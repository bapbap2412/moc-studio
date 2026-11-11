import type { RowDataPacket } from "mysql2/promise";
import { AdminShell } from "@/components/admin/admin-shell";
import { ReviewsManager, type AdminReview } from "@/components/admin/reviews-manager";
import pool from "@/lib/db";

const PAGE_SIZE = 25;

async function getReviews(search: string, requestedPage: number) {
  const where = search ? "WHERE p.name LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR r.comment LIKE ?" : "";
  const pattern = `%${search}%`;
  const params = search ? [pattern, pattern, pattern, pattern] : [];
  const [counts] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM reviews r JOIN products p ON p.id=r.product_id JOIN users u ON u.id=r.user_id ${where}`, params);
  const total = Number(counts[0]?.total ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.id, r.product_id, r.rating, r.comment, r.is_visible, r.admin_reply,
      DATE_FORMAT(r.created_at, '%d/%m/%Y %H:%i') AS created_at,
      p.name AS product_name, p.slug AS product_slug, u.full_name, u.email
     FROM reviews r JOIN products p ON p.id=r.product_id JOIN users u ON u.id=r.user_id
     ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    [...params, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  );
  const reviews: AdminReview[] = rows.map((row) => ({
    id: Number(row.id), product_id: String(row.product_id), rating: Number(row.rating),
    comment: row.comment === null ? null : String(row.comment), admin_reply: row.admin_reply === null ? null : String(row.admin_reply), is_visible: Number(row.is_visible) === 1,
    created_at: String(row.created_at), product_name: String(row.product_name), product_slug: String(row.product_slug),
    full_name: String(row.full_name), email: String(row.email),
  }));
  return { reviews, total, page };
}

async function getSummary() {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS total, SUM(is_visible=1) AS visible, SUM(is_visible=0) AS hidden FROM reviews");
  const row = rows[0] ?? {};
  return { total: Number(row.total ?? 0), visible: Number(row.visible ?? 0), hidden: Number(row.hidden ?? 0) };
}

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page } = await searchParams;
  const [result, summary] = await Promise.all([
    getReviews(typeof q === "string" ? q.trim().slice(0, 100) : "", Number(page) || 1),
    getSummary(),
  ]);
  return (
    <AdminShell activeHref="/admin/danh-gia" breadcrumb="Cửa hàng / Đánh giá" title="Đánh giá">
      <ReviewsManager reviews={result.reviews} total={result.total} currentPage={result.page} pageSize={PAGE_SIZE} initialQuery={typeof q === "string" ? q : ""} summary={summary} />
      <footer className="py-8 text-center text-xs text-neutral-400">© 2026 MỘC Studio · Admin Dashboard</footer>
    </AdminShell>
  );
}
