import { NextResponse } from "next/server";
import { handleMomoIpn } from "@/lib/momo";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid notification." }, { status: 400 });
  }

  try {
    const processed = await handleMomoIpn(payload);
    if (!processed) return NextResponse.json({ message: "Notification was not verified." }, { status: 400 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("MoMo IPN processing failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ message: "Notification could not be processed." }, { status: 500 });
  }
}
