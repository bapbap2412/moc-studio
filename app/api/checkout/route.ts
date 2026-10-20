import { NextResponse } from "next/server";
import { submitCustomerOrder } from "@/app/thanh-toan/actions";
import { isSameOriginRequest } from "@/lib/request-security";
import { createMomoPayment } from "@/lib/momo";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, message: "Yêu cầu không hợp lệ." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, message: "Dữ liệu đặt hàng không hợp lệ." }, { status: 400 });
  }

  const result = await submitCustomerOrder(formData);
  if (result.ok && formData.get("payment") === "ewallet") {
    try {
      const paymentUrl = await createMomoPayment(result.code);
      return NextResponse.json({ ...result, paymentUrl });
    } catch (error) {
      console.error("MoMo payment initialization failed:", error instanceof Error ? error.message : "Unknown error");
      return NextResponse.json({ ...result, paymentError: true });
    }
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
