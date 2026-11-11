import type { RowDataPacket } from "mysql2/promise";
import { AdminShell } from "@/components/admin/admin-shell";
import { CouponsManager, type AdminCoupon } from "@/components/admin/coupons-manager";
import pool from "@/lib/db";

const PAGE_SIZE = 25;

async function getCoupons(search: string, requestedPage: number): Promise<{ coupons: AdminCoupon[]; total: number; page: number }> {
  const where = search ? "WHERE code LIKE ?" : "";
  const params = search ? [`%${search}%`] : [];
  const [counts] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM coupons ${where}`, params);
  const total = Number(counts[0]?.total ?? 0);
  const page = Math.min(Math.max(1, requestedPage), Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, code, discount_type, value, min_order_amount, max_discount, usage_limit, used_count,
      DATE_FORMAT(starts_at, '%Y-%m-%d %H:%i:%s') AS starts_at,
      DATE_FORMAT(ends_at, '%Y-%m-%d %H:%i:%s') AS ends_at,
      is_active
     FROM coupons ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  );
  const coupons = rows.map((row) => ({
    id: Number(row.id),
    code: String(row.code),
    discount_type: row.discount_type,
    value: Number(row.value),
    min_order_amount: Number(row.min_order_amount),
    max_discount: row.max_discount === null ? null : Number(row.max_discount),
    usage_limit: row.usage_limit === null ? null : Number(row.usage_limit),
    used_count: Number(row.used_count),
    starts_at: row.starts_at ? String(row.starts_at) : null,
    ends_at: row.ends_at ? String(row.ends_at) : null,
    is_active: Number(row.is_active) === 1,
  }));
  return { coupons, total, page };
}

export default async function AdminCouponsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page } = await searchParams;
  const result = await getCoupons(typeof q === "string" ? q.trim().slice(0, 100) : "", Number(page) || 1);
  return (
    <AdminShell activeHref="/admin/ma-giam-gia" breadcrumb="Cửa hàng / Mã giảm giá" title="Mã giảm giá">
      <CouponsManager coupons={result.coupons} total={result.total} currentPage={result.page} pageSize={PAGE_SIZE} initialQuery={typeof q === "string" ? q : ""} />
      <footer className="py-8 text-center text-xs text-neutral-400">© 2026 MỘC Studio · Admin Dashboard</footer>
    </AdminShell>
  );
}
