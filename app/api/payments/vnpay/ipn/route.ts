import { NextResponse } from "next/server";
import { handleVnpayIpn } from "@/lib/vnpay";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const result = await handleVnpayIpn(new URL(request.url).searchParams);
    return NextResponse.json(result);
  } catch (error) {
    console.error("VNPay IPN processing failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ RspCode: "99", Message: "Unable to process notification" });
  }
}
