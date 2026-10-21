import { createHmac, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";

type VnpayEnvironment = "sandbox" | "production" | "test";
type VnpayConfig = {
  environment: VnpayEnvironment;
  tmnCode: string;
  hashSecret: string;
  siteUrl: string;
  paymentUrl: string;
};

function getVnpayConfig(): VnpayConfig | null {
  const environment = process.env.VNPAY_ENVIRONMENT as VnpayEnvironment | undefined;
  const tmnCode = process.env.VNPAY_TMN_CODE?.trim();
  const hashSecret = process.env.VNPAY_HASH_SECRET?.trim();
  const siteUrl = process.env.SITE_URL?.trim().replace(/\/$/, "");
  if (!environment || !["sandbox", "production", "test"].includes(environment) || !tmnCode || !hashSecret || !siteUrl) return null;

  let site: URL;
  try { site = new URL(siteUrl); } catch { return null; }
  if (environment !== "test" && site.protocol !== "https:") return null;

  let paymentUrl: string;
  if (environment === "sandbox") paymentUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  else if (environment === "production") paymentUrl = "https://pay.vnpay.vn/vpcpay.html";
  else {
    paymentUrl = process.env.VNPAY_TEST_PAYMENT_URL?.trim() ?? "";
    try {
      const endpoint = new URL(paymentUrl);
      if (!["127.0.0.1", "localhost", "::1"].includes(endpoint.hostname)) return null;
      paymentUrl = endpoint.origin + endpoint.pathname;
    } catch { return null; }
  }

  return { environment, tmnCode, hashSecret, siteUrl, paymentUrl };
}

export function isVnpayConfigured() {
  return getVnpayConfig() !== null;
}

function encodeVnpayValue(value: string) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

function canonicalVnpayData(params: Record<string, string>) {
  return Object.keys(params)
    .filter((key) => key.startsWith("vnp_") && key !== "vnp_SecureHash" && key !== "vnp_SecureHashType")
    .sort()
    .map((key) => `${encodeVnpayValue(key)}=${encodeVnpayValue(params[key])}`)
    .join("&");
}

export function signVnpayParams(params: Record<string, string>, hashSecret: string) {
  return createHmac("sha512", hashSecret).update(canonicalVnpayData(params), "utf8").digest("hex");
}

function verifyVnpaySignature(params: Record<string, string>, hashSecret: string) {
  const provided = params.vnp_SecureHash;
  if (!provided || !/^[a-f\d]{128}$/i.test(provided)) return false;
  const expectedBuffer = Buffer.from(signVnpayParams(params, hashSecret), "hex");
  const providedBuffer = Buffer.from(provided, "hex");
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

function vnDateTime(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`;
}

export async function createVnpayPayment(orderCode: string, clientIp: string | null) {
  const config = getVnpayConfig();
  if (!config) throw new Error("VNPay payment is not configured.");

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT total,payment_method,payment_status FROM orders WHERE code = ? LIMIT 1",
    [orderCode],
  );
  const order = rows[0];
  if (!order || order.payment_method !== "ewallet" || order.payment_status !== "unpaid") throw new Error("Order is not eligible for VNPay payment.");
  const amount = Number(order.total);
  if (!Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(amount * 100)) throw new Error("Order amount is outside VNPay's supported range.");

  const now = new Date();
  const expire = new Date(now.getTime() + 15 * 60_000);
  const ip = clientIp?.split(",")[0]?.trim() ?? "";
  const params: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: config.tmnCode,
    vnp_Amount: String(amount * 100),
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderCode,
    vnp_OrderInfo: `Thanh toan don hang ${orderCode}`,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: `${config.siteUrl}/api/payments/vnpay/return`,
    vnp_IpAddr: isIP(ip) ? ip : "127.0.0.1",
    vnp_CreateDate: vnDateTime(now),
    vnp_ExpireDate: vnDateTime(expire),
  };
  const secureHash = signVnpayParams(params, config.hashSecret);
  const query = `${canonicalVnpayData(params)}&vnp_SecureHash=${secureHash}`;
  return `${config.paymentUrl}?${query}`;
}

function queryToParams(searchParams: URLSearchParams): Record<string, string> | null {
  const params: Record<string, string> = {};
  for (const [key, value] of searchParams) {
    if (!key.startsWith("vnp_")) continue;
    if (Object.hasOwn(params, key)) return null;
    params[key] = value;
  }
  return params;
}

export function verifyVnpayReturn(searchParams: URLSearchParams) {
  const config = getVnpayConfig();
  const params = queryToParams(searchParams);
  if (!config || !params || !verifyVnpaySignature(params, config.hashSecret)) return null;
  if (params.vnp_TmnCode !== config.tmnCode || !params.vnp_TxnRef) return null;
  return {
    orderCode: params.vnp_TxnRef,
    successful: params.vnp_ResponseCode === "00" && params.vnp_TransactionStatus === "00",
  };
}

export async function handleVnpayIpn(searchParams: URLSearchParams) {
  const config = getVnpayConfig();
  const params = queryToParams(searchParams);
  if (!config || !params || !verifyVnpaySignature(params, config.hashSecret) || params.vnp_TmnCode !== config.tmnCode) {
    return { RspCode: "97", Message: "Invalid signature" };
  }

  const orderCode = params.vnp_TxnRef;
  const amountInCents = Number(params.vnp_Amount);
  if (!orderCode || !params.vnp_TransactionNo || !params.vnp_ResponseCode || !params.vnp_TransactionStatus
    || !Number.isSafeInteger(amountInCents) || amountInCents <= 0 || amountInCents % 100 !== 0) {
    return { RspCode: "04", Message: "Invalid order amount" };
  }
  const amount = amountInCents / 100;
  const [orders] = await pool.execute<RowDataPacket[]>(
    "SELECT total,payment_method,payment_status FROM orders WHERE code = ? LIMIT 1",
    [orderCode],
  );
  const order = orders[0];
  if (!order || order.payment_method !== "ewallet") return { RspCode: "01", Message: "Order not found" };
  if (Number(order.total) !== amount) return { RspCode: "04", Message: "Amount mismatch" };
  if (order.payment_status === "paid") return { RspCode: "02", Message: "Order already confirmed" };
  if (params.vnp_ResponseCode !== "00" || params.vnp_TransactionStatus !== "00") {
    return { RspCode: "00", Message: "Payment result recorded" };
  }

  const [result] = await pool.execute(
    `UPDATE orders SET payment_status = 'paid'
     WHERE code = ? AND payment_method = 'ewallet' AND payment_status = 'unpaid' AND total = ?`,
    [orderCode, amount],
  );
  const affectedRows = (result as { affectedRows?: number }).affectedRows ?? 0;
  if (affectedRows === 1) return { RspCode: "00", Message: "Confirm Success" };

  const [paidRows] = await pool.execute<RowDataPacket[]>(
    "SELECT 1 FROM orders WHERE code = ? AND payment_method = 'ewallet' AND payment_status = 'paid' AND total = ? LIMIT 1",
    [orderCode, amount],
  );
  return paidRows.length ? { RspCode: "02", Message: "Order already confirmed" } : { RspCode: "01", Message: "Order not eligible" };
}
