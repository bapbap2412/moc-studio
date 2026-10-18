import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = {
  "image/jpeg": { extension: "jpg", signature: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", signature: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 },
  "image/webp": { extension: "webp", signature: (bytes: Uint8Array) => String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" },
} as const;

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Bạn cần đăng nhập bằng tài khoản quản trị." }, { status: 403 });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("image");
  } catch {
    return NextResponse.json({ error: "Dữ liệu tải lên không hợp lệ." }, { status: 400 });
  }

  if (!file || typeof file === "string" || file.size === 0) {
    return NextResponse.json({ error: "Vui lòng chọn một ảnh." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Ảnh vượt quá dung lượng tối đa 5 MB." }, { status: 413 });
  }

  const format = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
  if (!format) {
    return NextResponse.json({ error: "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP." }, { status: 415 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!format.signature(buffer)) {
    return NextResponse.json({ error: "Nội dung tệp không khớp với định dạng ảnh đã chọn." }, { status: 415 });
  }

  const filename = `${randomUUID()}.${format.extension}`;
  const uploadDirectory = path.join(process.cwd(), "public", "images", "products");
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, filename), buffer, { flag: "wx" });

  return NextResponse.json({ url: `/images/products/${filename}` });
}
