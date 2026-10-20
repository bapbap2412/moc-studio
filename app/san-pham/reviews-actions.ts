"use server";

import { revalidatePath } from "next/cache";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function submitProductReview(productId: string, slug: string, ratingValue: number, commentValue: string) {
  const session = await getSession();
  if (!session || session.role !== "customer") return { ok: false, message: "Đăng nhập tài khoản khách hàng để đánh giá." };
  if (!/^[0-9a-f-]{36}$/i.test(productId) || !Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    return { ok: false, message: "Vui lòng chọn mức đánh giá từ 1 đến 5 sao." };
  }
  const comment = commentValue.trim();
  if (comment.length > 1000) return { ok: false, message: "Đánh giá tối đa 1000 ký tự." };

  const [eligible] = await pool.execute<RowDataPacket[]>(
    `SELECT 1 FROM order_items oi
     JOIN product_variants pv ON pv.id = oi.variant_id
     JOIN orders o ON o.id = oi.order_id
     WHERE pv.product_id = ? AND o.user_id = ? AND o.status = 'completed'
     LIMIT 1`,
    [productId, session.userId],
  );
  if (eligible.length === 0) return { ok: false, message: "Chỉ khách đã nhận sản phẩm mới có thể đánh giá." };

  await pool.execute(
    `INSERT INTO reviews (product_id, user_id, rating, comment)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), created_at = CURRENT_TIMESTAMP`,
    [productId, session.userId, ratingValue, comment || null],
  );
  revalidatePath(`/san-pham/${slug}`);
  return { ok: true, message: "Cảm ơn bạn đã gửi đánh giá." };
}
