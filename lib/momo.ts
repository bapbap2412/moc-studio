import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";

type MomoEnvironment = "sandbox" | "production" | "test";
type MomoConfig = {
  environment: MomoEnvironment;
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  apiBaseUrl: string;
  siteUrl: string;
};

function getMomoConfig(): MomoConfig | null {
  const environment = process.env.MOMO_ENVIRONMENT as MomoEnvironment | undefined;
  const partnerCode = process.env.MOMO_PARTNER_CODE?.trim();
  const accessKey = process.env.MOMO_ACCESS_KEY?.trim();
  const secretKey = process.env.MOMO_SECRET_KEY?.trim();
  const siteUrl = process.env.SITE_URL?.trim().replace(/\/$/, "");
  if (!environment || !["sandbox", "production", "test"].includes(environment) || !partnerCode || !accessKey || !secretKey || !siteUrl) return null;

  let site: URL;
  try { site = new URL(siteUrl); } catch { return null; }
  if (environment === "production" && site.protocol !== "https:") return null;
  if (environment !== "test" && site.protocol !== "https:") return null;

  let apiBaseUrl: string;
  if (environment === "production") apiBaseUrl = "https://payment.momo.vn";
  else if (environment === "sandbox") apiBaseUrl = "https://test-payment.momo.vn";
  else {
    apiBaseUrl = process.env.MOMO_TEST_API_BASE_URL?.trim() ?? "";
    try {
      const endpoint = new URL(apiBaseUrl);
      if (!(endpoint.hostname === "127.0.0.1" || endpoint.hostname === "localhost" || endpoint.hostname === "::1")) return null;
      apiBaseUrl = endpoint.origin;
    } catch { return null; }
  }

  return { environment, partnerCode, accessKey, secretKey, apiBaseUrl, siteUrl };
}

export function isMomoConfigured() {
  return getMomoConfig() !== null;
}

function signature(secret: string, message: string) {
  return createHmac("sha256", secret).update(message, "utf8").digest("hex");
}

function safeSignatureEqual(expected: string, provided: unknown) {
  if (typeof provided !== "string" || !/^[a-f\d]{64}$/i.test(provided)) return false;
  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(provided, "hex");
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

export function verifyMomoIpnSignature(payload: Record<string, unknown>, secretKey: string, accessKey: string) {
  const fields = ["accessKey", "amount", "extraData", "message", "orderId", "orderInfo", "orderType", "partnerCode", "payType", "requestId", "responseTime", "resultCode", "transId"] as const;
  const values: Record<string, unknown> = { ...payload, accessKey };
  if (fields.some((field) => values[field] === undefined || values[field] === null)) return false;
  const message = fields.map((field) => `${field}=${String(values[field])}`).join("&");
  return safeSignatureEqual(signature(secretKey, message), payload.signature);
}

export async function createMomoPayment(orderCode: string) {
  const config = getMomoConfig();
  if (!config) throw new Error("MoMo payment is not configured.");

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT total,payment_method,payment_status FROM orders WHERE code = ? LIMIT 1",
    [orderCode],
  );
  const order = rows[0];
  if (!order || order.payment_method !== "ewallet" || order.payment_status !== "unpaid") throw new Error("Order is not eligible for MoMo payment.");
  const amount = Number(order.total);
  if (!Number.isSafeInteger(amount) || amount < 1000 || amount > 50_000_000) throw new Error("Order amount is outside MoMo's supported range.");

  const requestId = randomUUID();
  const requestType = "captureWallet";
  const extraData = "";
  const redirectUrl = `${config.siteUrl}/tai-khoan`;
  const ipnUrl = `${config.siteUrl}/api/payments/momo/ipn`;
  const orderInfo = `Thanh toan don hang ${orderCode}`;
  const fields = [
    `accessKey=${config.accessKey}`,
    `amount=${amount}`,
    `extraData=${extraData}`,
    `ipnUrl=${ipnUrl}`,
    `orderId=${orderCode}`,
    `orderInfo=${orderInfo}`,
    `partnerCode=${config.partnerCode}`,
    `redirectUrl=${redirectUrl}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`,
  ];
  const payload = {
    partnerCode: config.partnerCode,
    requestId,
    amount: String(amount),
    orderId: orderCode,
    orderInfo,
    redirectUrl,
    ipnUrl,
    requestType,
    extraData,
    lang: "vi",
    signature: signature(config.secretKey, fields.join("&")),
  };

  const response = await fetch(`${config.apiBaseUrl}/v2/gateway/api/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`MoMo returned HTTP ${response.status}.`);
  const result = await response.json() as Record<string, unknown>;
  const responseFields = [
    `accessKey=${config.accessKey}`,
    `amount=${String(result.amount ?? "")}`,
    `message=${String(result.message ?? "")}`,
    `orderId=${String(result.orderId ?? "")}`,
    `partnerCode=${String(result.partnerCode ?? "")}`,
    `payUrl=${String(result.payUrl ?? "")}`,
    `requestId=${String(result.requestId ?? "")}`,
    `responseTime=${String(result.responseTime ?? "")}`,
    `resultCode=${String(result.resultCode ?? "")}`,
  ];
  const validResponse = safeSignatureEqual(signature(config.secretKey, responseFields.join("&")), result.signature)
    && result.partnerCode === config.partnerCode
    && result.requestId === requestId
    && result.orderId === orderCode
    && Number(result.amount) === amount
    && Number(result.resultCode) === 0
    && typeof result.payUrl === "string";
  if (!validResponse) throw new Error("MoMo response signature or order details did not validate.");

  const payUrl = new URL(result.payUrl as string);
  if (payUrl.protocol !== "https:" && config.environment !== "test") throw new Error("MoMo returned an insecure payment URL.");
  if (payUrl.host !== new URL(config.apiBaseUrl).host) throw new Error("MoMo returned an unexpected payment host.");
  return payUrl.toString();
}

export async function handleMomoIpn(payload: Record<string, unknown>) {
  const config = getMomoConfig();
  if (!config || !verifyMomoIpnSignature(payload, config.secretKey, config.accessKey)) return false;
  const amount = Number(payload.amount);
  if (payload.partnerCode !== config.partnerCode || !Number.isSafeInteger(amount)) return false;
  if (typeof payload.orderId !== "string" || typeof payload.requestId !== "string") return false;

  if (Number(payload.resultCode) !== 0) {
    const [failedOrder] = await pool.execute<RowDataPacket[]>(
      `SELECT 1 FROM orders WHERE code = ? AND payment_method = 'ewallet'
        AND payment_status = 'unpaid' AND total = ? LIMIT 1`,
      [payload.orderId, amount],
    );
    return failedOrder.length > 0;
  }

  const [result] = await pool.execute(
    `UPDATE orders SET payment_status = 'paid'
     WHERE code = ? AND payment_method = 'ewallet' AND payment_status = 'unpaid' AND total = ?`,
    [payload.orderId, amount],
  );
  const affectedRows = (result as { affectedRows?: number }).affectedRows ?? 0;
  if (affectedRows === 1) return true;

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 1 FROM orders WHERE code = ? AND payment_method = 'ewallet'
      AND payment_status = 'paid' AND total = ? LIMIT 1`,
    [payload.orderId, amount],
  );
  return rows.length > 0;
}
