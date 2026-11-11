
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { deleteSession, getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
  }

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT email, role, is_active FROM users WHERE id = ? LIMIT 1",
    [session.userId],
  );
  const user = rows[0];
  if (!user || Number(user.is_active) !== 1 || !["admin", "customer"].includes(String(user.role))) {
    await deleteSession();
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 },
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      email: String(user.email),
      role: String(user.role),
    },
  });
}
