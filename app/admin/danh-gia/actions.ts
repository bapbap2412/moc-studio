"use server";

import { revalidatePath } from "next/cache";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { recordAdminAudit } from "@/lib/admin-audit";
import { isAdmin, type ActionResult, UNAUTHORIZED } from "@/lib/admin-server";

export async function setReviewVisible(id: number, visible: boolean): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!Number.isSafeInteger(id) || id <= 0 || typeof visible !== "boolean") {
    return { ok: false, message: "Đánh giá không hợp lệ." };
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT p.slug FROM reviews r JOIN products p ON p.id = r.product_id WHERE r.id = ? LIMIT 1",
    [id],
  );
  if (!rows.length) return { ok: false, message: "Không tìm thấy đánh giá." };
  await pool.execute("UPDATE reviews SET is_visible = ? WHERE id = ?", [visible ? 1 : 0, id]);
  await recordAdminAudit(visible ? "review.publish" : "review.hide", "review", id);
  revalidatePath("/admin/danh-gia");
  revalidatePath(`/san-pham/${String(rows[0].slug)}`);
  revalidatePath("/san-pham");
  return { ok: true, message: visible ? "Đã hiển thị đánh giá." : "Đã ẩn đánh giá." };
}

export async function saveReviewReply(id: number, reply: string): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!Number.isSafeInteger(id) || id <= 0 || typeof reply !== "string" || reply.trim().length > 2000) return { ok: false, message: "Nội dung phản hồi không hợp lệ (tối đa 2.000 ký tự)." };
  const [rows] = await pool.execute<RowDataPacket[]>("SELECT p.slug FROM reviews r JOIN products p ON p.id=r.product_id WHERE r.id=? LIMIT 1", [id]);
  if (!rows.length) return { ok: false, message: "Không tìm thấy đánh giá." };
  const content = reply.trim();
  await pool.execute("UPDATE reviews SET admin_reply=?, admin_replied_at=IF(?='', NULL, NOW()) WHERE id=?", [content || null, content, id]);
  await recordAdminAudit(content ? "review.reply" : "review.reply_clear", "review", id);
  revalidatePath("/admin/danh-gia");
  revalidatePath(`/san-pham/${String(rows[0].slug)}`);
  return { ok: true, message: content ? "Đã lưu phản hồi cho đánh giá." : "Đã gỡ phản hồi." };
}
