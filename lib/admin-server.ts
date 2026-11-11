import type { PoolConnection } from "mysql2/promise";
import pool from "@/lib/db";
import { deleteSession, getSession, type SessionUser } from "@/lib/session";
import type { RowDataPacket } from "mysql2/promise";

export type ActionResult = { ok: boolean; message: string };

export const UNAUTHORIZED: ActionResult = {
  ok: false,
  message: "Bạn không có quyền thực hiện thao tác này.",
};

export async function isAdmin() {
  const session = await getSession();
  return (await getCurrentAdminSession(session)) !== null;
}

export async function getCurrentAdminSession(
  session: SessionUser | null,
): Promise<SessionUser | null> {
  if (!session || session.role !== "admin") return null;

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT email FROM users WHERE id = ? AND role = 'admin' AND is_active = 1 LIMIT 1",
    [session.userId],
  );
  if (rows.length === 0) {
    await deleteSession();
    return null;
  }

  return { ...session, email: String(rows[0].email) };
}

export function dbErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  return undefined;
}

// Some optional tables (reviews, wishlists...) may not exist in every MySQL setup.
export async function executeIfTableExists(
  conn: PoolConnection,
  sql: string,
  params: (string | number | null)[],
) {
  try {
    await conn.execute(sql, params);
  } catch (error) {
    if (dbErrorCode(error) !== "ER_NO_SUCH_TABLE") throw error;
  }
}

export function slugify(input: string) {
  const slug = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
  return slug || "san-pham";
}

export function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Vietnamese mobile/landline numbers are stored as 10 digits, including the leading 0.
export const PHONE_REGEX = /^0[0-9]{9}$/;
