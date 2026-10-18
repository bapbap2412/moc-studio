import type { PoolConnection } from "mysql2/promise";
import { getSession } from "@/lib/session";

export type ActionResult = { ok: boolean; message: string };

export const UNAUTHORIZED: ActionResult = {
  ok: false,
  message: "Bạn không có quyền thực hiện thao tác này.",
};

export async function isAdmin() {
  const session = await getSession();
  return session?.role === "admin";
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
export const PHONE_REGEX = /^[0-9+\-\s().]{8,20}$/;
