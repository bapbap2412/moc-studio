
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { createSession } from "@/lib/session";
import { canLoginWith, normalizeEmail } from "@/lib/critical-rules";

export const runtime = "nodejs";

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: "customer" | "admin";
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    if (!canLoginWith(email, password)) {
      return NextResponse.json(
        { message: "Vui lòng nhập email và mật khẩu." },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT id, email, password_hash, full_name, role
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    const users = rows as UserRow[];
    const user = users[0];

    // Không tiết lộ email nào đã đăng ký hay chưa.
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json(
        { message: "Email hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    if (user.role !== "admin" && user.role !== "customer") {
      return NextResponse.json(
        { message: "Tài khoản không có quyền đăng nhập." },
        { status: 403 }
      );
    }

    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      message: "Đăng nhập thành công.",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login API error:", error);

    return NextResponse.json(
      { message: "Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
