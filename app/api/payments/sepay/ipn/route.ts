import { NextResponse } from "next/server";
import { handleSePayIpn, type SePayIpn } from "@/lib/payment/sepay";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ success: false, message: "Invalid notification" }, { status: 400 });
  }

  try {
    const result = await handleSePayIpn(request.headers.get("x-secret-key"), payload as SePayIpn);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("SePay IPN processing failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false, message: "Unable to process notification" }, { status: 500 });
  }
}
