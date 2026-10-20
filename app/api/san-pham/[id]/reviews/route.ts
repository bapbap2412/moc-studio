import { NextResponse } from "next/server";
import { submitProductReview } from "@/app/san-pham/reviews-actions";
import { isSameOriginRequest } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, message: "Yêu cầu không hợp lệ." }, { status: 403 });
  }
  try {
    const { id } = await context.params;
    const body = await request.json();
    const result = await submitProductReview(id, typeof body.slug === "string" ? body.slug : "", Number(body.rating), typeof body.comment === "string" ? body.comment : "");
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch {
    return NextResponse.json({ ok: false, message: "Không thể gửi đánh giá." }, { status: 400 });
  }
}
