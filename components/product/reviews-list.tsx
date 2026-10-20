import type { RowDataPacket } from "mysql2/promise";
import { Star } from "lucide-react";
import Link from "next/link";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { ReviewForm } from "@/components/product/review-form";

type ReviewRow = RowDataPacket & { rating: number; comment: string | null; full_name: string; created_at: string };

export async function ReviewsList({ productId, slug }: { productId: string; slug: string }) {
  const [rows] = await pool.execute<ReviewRow[]>(
    `SELECT r.rating, r.comment, u.full_name, DATE_FORMAT(r.created_at, '%d/%m/%Y') AS created_at
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.product_id = ? ORDER BY r.created_at DESC LIMIT 50`,
    [productId],
  );
  const session = await getSession();
  let eligible = false;
  if (session?.role === "customer") {
    const [orders] = await pool.execute<RowDataPacket[]>(
      `SELECT 1 FROM order_items oi JOIN product_variants pv ON pv.id = oi.variant_id
       JOIN orders o ON o.id = oi.order_id
       WHERE pv.product_id = ? AND o.user_id = ? AND o.status = 'completed' LIMIT 1`,
      [productId, session.userId],
    );
    eligible = orders.length > 0;
  }

  return (
    <section aria-labelledby="reviews-heading" className="mt-16 border-t border-border pt-10">
      <h2 id="reviews-heading" className="font-serif text-3xl">Đánh giá sản phẩm <span className="text-base text-muted-foreground">({rows.length})</span></h2>
      {eligible && <ReviewForm productId={productId} slug={slug} />}
      {!session && <p className="mt-4 text-sm text-muted-foreground"><Link className="underline underline-offset-4" href={`/dang-nhap?returnTo=${encodeURIComponent(`/san-pham/${slug}`)}`}>Đăng nhập</Link> để gửi đánh giá sau khi nhận hàng.</p>}
      {session?.role === "customer" && !eligible && <p className="mt-4 text-sm text-muted-foreground">Đánh giá được mở cho tài khoản đã nhận sản phẩm.</p>}
      {!rows.length ? <p className="mt-6 text-sm text-muted-foreground">Chưa có đánh giá nào.</p> : (
        <ul className="mt-6 divide-y divide-border">
          {rows.map((review, index) => <li key={`${review.full_name}-${index}`} className="py-5">
            <div className="flex items-center gap-3"><span className="text-sm font-medium">{review.full_name}</span><span className="text-xs text-muted-foreground">{review.created_at}</span></div>
            <div className="mt-2 flex" aria-label={`${review.rating} trên 5 sao`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`size-4 ${star <= review.rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />)}</div>
            {review.comment && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{review.comment}</p>}
          </li>)}
        </ul>
      )}
    </section>
  );
}
