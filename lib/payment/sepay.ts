import { timingSafeEqual } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { SePayPgClient } from "sepay-pg-node";
import pool from "@/lib/db";

function getConfig() {
  const merchantId = process.env.SEPAY_MERCHANT_ID?.trim();
  const secretKey = process.env.SEPAY_SECRET_KEY?.trim();
  const siteUrl = process.env.SITE_URL?.trim().replace(/\/$/, "");
  if (process.env.SEPAY_ENV !== "sandbox" || !merchantId || !secretKey || !siteUrl) return null;

  let site: URL;
  try {
    site = new URL(siteUrl);
  } catch {
    return null;
  }
  if (site.protocol !== "https:") return null;
  return { merchantId, secretKey, siteUrl };
}

export function isSePayConfigured() {
  return getConfig() !== null;
}

export async function createSePayPayment(orderCode: string, returnOrigin?: string | null) {
  const config = getConfig();
  if (!config) throw new Error("SePay sandbox is not configured.");

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT total,payment_method,payment_status FROM orders WHERE code = ? LIMIT 1",
    [orderCode],
  );
  const order = rows[0];
  if (!order || order.payment_method !== "sepay" || order.payment_status !== "unpaid") {
    throw new Error("Order is not eligible for SePay payment.");
  }
  const amount = Number(order.total);
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Order amount is outside SePay's supported range.");

  const client = new SePayPgClient({
    env: "sandbox",
    merchant_id: config.merchantId,
    secret_key: config.secretKey,
  });
  let callbackOrigin = config.siteUrl;
  if (returnOrigin) {
    const origin = new URL(returnOrigin);
    const isLocalHttp = origin.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
    if (origin.protocol !== "https:" && !isLocalHttp) {
      throw new Error("SePay return origin must use HTTPS, except for local development.");
    }
    callbackOrigin = origin.origin;
  }
  const resultUrl = `${callbackOrigin}/thanh-toan/ket-qua?order=${encodeURIComponent(orderCode)}`;
  const fields = client.checkout.initOneTimePaymentFields({
    operation: "PURCHASE",
    payment_method: "BANK_TRANSFER",
    order_invoice_number: orderCode,
    order_amount: amount,
    currency: "VND",
    order_description: `Thanh toan don hang ${orderCode}`,
    success_url: resultUrl,
    error_url: resultUrl,
    cancel_url: resultUrl,
  });

  return { checkoutUrl: client.checkout.initCheckoutUrl(), fields };
}

function secretMatches(provided: string | null, expected: string) {
  if (!provided) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

export type SePayIpn = {
  timestamp?: unknown;
  notification_type?: unknown;
  order?: {
    order_invoice_number?: unknown;
    order_status?: unknown;
    order_currency?: unknown;
    order_amount?: unknown;
  };
  transaction?: {
    transaction_status?: unknown;
    transaction_amount?: unknown;
    transaction_currency?: unknown;
  };
};

function parseAmount(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const amount = Number(text);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

export async function handleSePayIpn(providedSecret: string | null, payload: SePayIpn) {
  const config = getConfig();
  if (!config || !secretMatches(providedSecret, config.secretKey)) {
    return { status: 401, body: { success: false, message: "Unauthorized" } };
  }

  if (payload.notification_type === "TRANSACTION_VOID") {
    return { status: 200, body: { success: true } };
  }
  if (payload.notification_type !== "ORDER_PAID") {
    return { status: 400, body: { success: false, message: "Unsupported notification" } };
  }

  const orderCode = payload.order?.order_invoice_number;
  const orderAmount = parseAmount(payload.order?.order_amount);
  const transactionAmount = parseAmount(payload.transaction?.transaction_amount);
  if (!Number.isSafeInteger(payload.timestamp)
    || typeof orderCode !== "string" || !orderCode || !orderAmount || !transactionAmount
    || payload.order?.order_currency !== "VND" || payload.transaction?.transaction_currency !== "VND"
    || payload.order?.order_status !== "CAPTURED" || payload.transaction?.transaction_status !== "APPROVED"
    || orderAmount !== transactionAmount) {
    return { status: 400, body: { success: false, message: "Invalid payment notification" } };
  }

  const [orders] = await pool.execute<RowDataPacket[]>(
    "SELECT total,payment_method,payment_status FROM orders WHERE code = ? LIMIT 1",
    [orderCode],
  );
  const order = orders[0];
  if (!order || order.payment_method !== "sepay") {
    return { status: 404, body: { success: false, message: "Order not found" } };
  }
  if (Number(order.total) !== orderAmount) {
    return { status: 400, body: { success: false, message: "Amount mismatch" } };
  }
  if (order.payment_status === "paid") return { status: 200, body: { success: true, message: "Already processed" } };
  if (order.payment_status !== "unpaid") {
    return { status: 409, body: { success: false, message: "Order is not payable" } };
  }

  const [result] = await pool.execute(
    `UPDATE orders SET payment_status = 'paid'
     WHERE code = ? AND payment_method = 'sepay' AND payment_status = 'unpaid' AND total = ?`,
    [orderCode, orderAmount],
  );
  if ((result as { affectedRows?: number }).affectedRows === 1) {
    return { status: 200, body: { success: true } };
  }

  const [paidRows] = await pool.execute<RowDataPacket[]>(
    "SELECT 1 FROM orders WHERE code = ? AND payment_method = 'sepay' AND payment_status = 'paid' AND total = ? LIMIT 1",
    [orderCode, orderAmount],
  );
  return paidRows.length
    ? { status: 200, body: { success: true, message: "Already processed" } }
    : { status: 409, body: { success: false, message: "Order is not payable" } };
}
