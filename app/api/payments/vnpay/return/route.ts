import { NextResponse } from "next/server";
import { verifyVnpayReturn } from "@/lib/vnpay";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const result = verifyVnpayReturn(new URL(request.url).searchParams);
  const destination = new URL("/tai-khoan", process.env.SITE_URL ?? request.url);
  destination.searchParams.set("payment", !result ? "unverified" : result.successful ? "processing" : "failed");
  return NextResponse.redirect(destination);
}
