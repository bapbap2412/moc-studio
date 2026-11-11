"use server";

import { revalidatePath } from "next/cache";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { recordAdminAudit } from "@/lib/admin-audit";
import { isAdmin, readText, type ActionResult, UNAUTHORIZED } from "@/lib/admin-server";
import { getSession } from "@/lib/session";

export async function adjustStock(variantId: string, nextStock: number, reason: string): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!/^[0-9a-f-]{36}$/i.test(variantId) || !Number.isSafeInteger(nextStock) || nextStock < 0 || nextStock > 1_000_000) {
    return { ok: false, message: "Biến thể hoặc số lượng tồn kho không hợp lệ." };
  }
  const note = reason.trim().slice(0, 255);
  if (!note) return { ok: false, message: "Hãy ghi lý do điều chỉnh tồn kho." };
  const session = await getSession();
  const conn = await pool.getConnection();
  let before = 0;
  let product = "";
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT pv.stock_quantity, p.name AS product_name
       FROM product_variants pv JOIN products p ON p.id=pv.product_id
       WHERE pv.id=? FOR UPDATE`, [variantId],
    );
    if (!rows.length) {
      await conn.rollback();
      return { ok: false, message: "Không tìm thấy biến thể sản phẩm." };
    }
    before = Number(rows[0].stock_quantity);
    product = String(rows[0].product_name);
    if (before === nextStock) {
      await conn.rollback();
      return { ok: false, message: "Số lượng mới trùng với tồn kho hiện tại." };
    }
    await conn.execute("UPDATE product_variants SET stock_quantity=? WHERE id=?", [nextStock, variantId]);
    await conn.execute(
      `INSERT INTO inventory_movements (variant_id, sku_snapshot, product_name, color_name, size_name, stock_before, stock_after, reason, admin_user_id)
       SELECT pv.id, pv.sku, p.name, c.name, s.name, ?, ?, ?, ?
       FROM product_variants pv JOIN products p ON p.id=pv.product_id JOIN colors c ON c.id=pv.color_id JOIN sizes s ON s.id=pv.size_id
       WHERE pv.id=?`,
      [before, nextStock, note, session?.userId ?? null, variantId],
    );
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    console.error("Adjust inventory error:", error);
    return { ok: false, message: "Không điều chỉnh được tồn kho. Hãy thử lại." };
  } finally {
    conn.release();
  }
  await recordAdminAudit("inventory.adjust", "product_variant", variantId, { product, stockBefore: before, stockAfter: nextStock, reason: note });
  revalidatePath("/admin/ton-kho");
  revalidatePath("/admin/san-pham");
  revalidatePath("/san-pham", "layout");
  return { ok: true, message: "Đã cập nhật tồn kho và ghi lịch sử điều chỉnh." };
}
