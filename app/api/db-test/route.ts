
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  try {
    await pool.query("SELECT 1");

    return NextResponse.json({
      success: true,
      message: "Kết nối MySQL thành công",
      data: null,
    });
  } catch (error) {
    console.error("MySQL connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Không thể kết nối MySQL. Hãy kiểm tra cấu hình.",
      },
      { status: 500 }
    );
  }
}

