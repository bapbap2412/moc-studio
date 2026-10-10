
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT DATABASE() AS db, VERSION() AS version");

    return NextResponse.json({
      success: true,
      message: "Kết nối MySQL thành công",
      data: rows,
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

