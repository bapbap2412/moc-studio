import { NextResponse } from "next/server";
import { toggleWishlist } from "@/app/wishlist/actions";
import { isSameOriginRequest } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, message: "Yêu cầu không hợp lệ." }, { status: 403 });
  }
  try {
    const body = await request.json();
    const result = await toggleWishlist(typeof body.productId === "string" ? body.productId : "");
    return NextResponse.json(result, { status: result.ok ? 200 : 401 });
  } catch {
    return NextResponse.json({ ok: false, message: "Không thể cập nhật danh sách yêu thích." }, { status: 400 });
  }
}
