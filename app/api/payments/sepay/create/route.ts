import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import { getSameOriginOrigin } from "@/lib/request-security";
import { createSePayPayment, isSePayConfigured } from "@/lib/payment/sepay";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestOrigin = getSameOriginOrigin(request);
  if (!requestOrigin) {
    return NextResponse.json({ ok: false, message: "Yêu cầu không hợp lệ." }, { status: 403 });
  }
  const session = await getSession();
  if (!session || session.role !== "customer") {
    return NextResponse.json({ ok: false, message: "Vui lòng đăng nhập để thanh toán." }, { status: 401 });
  }

  let orderCode: unknown;
  try {
    const body = await request.json();
    orderCode = body?.orderCode;
  } catch {
    return NextResponse.json({ ok: false, message: "Yêu cầu không hợp lệ." }, { status: 400 });
  }
  if (typeof orderCode !== "string" || !/^[A-Za-z0-9_-]{1,40}$/.test(orderCode)) {
    return NextResponse.json({ ok: false, message: "Mã đơn hàng không hợp lệ." }, { status: 400 });
  }
  if (!isSePayConfigured()) {
    return NextResponse.json({ ok: false, message: "SePay sandbox chưa được cấu hình." }, { status: 503 });
  }

  const [orders] = await pool.execute<RowDataPacket[]>(
    "SELECT 1 FROM orders WHERE code = ? AND user_id = ? AND payment_method = 'sepay' LIMIT 1",
    [orderCode, session.userId],
  );
  if (!orders.length) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy đơn hàng." }, { status: 404 });
  }

  try {
    const payment = await createSePayPayment(orderCode, requestOrigin);
    return NextResponse.json({ ok: true, ...payment });
  } catch (error) {
    console.error("SePay payment initialization failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, message: "Không thể khởi tạo thanh toán SePay." }, { status: 409 });
  }
}
