
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { EMAIL_REGEX, PHONE_REGEX } from "@/lib/admin-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const fullName =
      typeof body.full_name === "string" ? body.full_name.trim() : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    if (!fullName || !email || !phone || !password) {
      return NextResponse.json(
        { message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu." },
        { status: 400 }
      );
    }

    if (fullName.length > 120 || email.length > 255) {
      return NextResponse.json(
        { message: "Họ tên hoặc email quá dài." },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { message: "Email không hợp lệ." },
        { status: 400 }
      );
    }

    if (!PHONE_REGEX.test(phone)) {
      return NextResponse.json(
        { message: "Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0." },
        { status: 400 }
      );
    }

    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return NextResponse.json(
        { message: "Mật khẩu phải có ít nhất 8 ký tự và tối đa 72 byte." },
        { status: 400 }
      );
    }

    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if ((existing as unknown[]).length > 0) {
      return NextResponse.json(
        { message: "Email này đã được đăng ký." },
        { status: 409 }
      );
    }

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);

    await pool.execute(
      `INSERT INTO users
        (id, email, password_hash, full_name, phone, role)
       VALUES (?, ?, ?, ?, ?, 'customer')`,
      [id, email, passwordHash, fullName, phone]
    );

    return NextResponse.json(
      { message: "Đăng ký thành công! Bạn có thể đăng nhập." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register API error:", error);

    return NextResponse.json(
      { message: "Đăng ký thất bại. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
