"use server";

import { revalidatePath } from "next/cache";
import type { ResultSetHeader } from "mysql2/promise";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

type WishlistToggleResult = { ok: true; saved: boolean } | { ok: false; message: string };

export async function toggleWishlist(productId: string): Promise<WishlistToggleResult> {
  const session = await getSession();
  if (!session || session.role !== "customer") return { ok: false, message: "Đăng nhập tài khoản khách hàng để lưu sản phẩm." };
  if (!/^[0-9a-f-]{36}$/i.test(productId)) return { ok: false, message: "Sản phẩm không hợp lệ." };

  const [existing] = await pool.execute<ResultSetHeader>(
    "DELETE FROM wishlists WHERE user_id = ? AND product_id = ?",
    [session.userId, productId],
  );
  const saved = existing.affectedRows === 0;
  if (saved) await pool.execute("INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)", [session.userId, productId]);
  revalidatePath("/wishlist");
  return { ok: true, saved };
}

export async function getWishlistStatus(productId: string) {
  const session = await getSession();
  if (!session || session.role !== "customer") return false;
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT 1 FROM wishlists WHERE user_id = ? AND product_id = ? LIMIT 1",
    [session.userId, productId],
  );
  return rows.length > 0;
}
