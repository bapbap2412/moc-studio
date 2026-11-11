import type { RowDataPacket } from "mysql2/promise";
import { AdminShell } from "@/components/admin/admin-shell";
import pool from "@/lib/db";

const PAGE_SIZE = 50;

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page: rawPage } = await searchParams;
  const search = typeof q === "string" ? q.trim().slice(0, 100) : "";
  const where = search ? "WHERE l.action LIKE ? OR l.target_type LIKE ? OR l.target_id LIKE ? OR u.email LIKE ?" : "";
  const params = search ? Array(4).fill(`%${search}%`) : [];
  const [countRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM admin_audit_logs l LEFT JOIN users u ON u.id=l.admin_user_id ${where}`, params);
  const total = Number(countRows[0]?.total ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(rawPage) || 1), pageCount);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT l.action, l.target_type, l.target_id, l.details, u.email,
      DATE_FORMAT(l.created_at, '%d/%m/%Y %H:%i:%s') AS created_at
     FROM admin_audit_logs l LEFT JOIN users u ON u.id=l.admin_user_id ${where}
     ORDER BY l.created_at DESC, l.id DESC LIMIT ? OFFSET ?`,
    [...params, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  );
  const query = new URLSearchParams({ q: search }).toString();
  return <AdminShell activeHref="/admin/nhat-ky" breadcrumb="Cửa hàng / Nhật ký" title="Nhật ký thao tác">
    <header className="mb-5"><h1 className="font-serif text-3xl">Nhật ký thao tác quản trị</h1><p className="mt-2 text-sm text-neutral-500">Ghi lại ai đã thay đổi dữ liệu và thời điểm thực hiện.</p></header>
    <form action="/admin/nhat-ky" method="get" className="mb-4 flex gap-2"><input name="q" defaultValue={search} placeholder="Tìm thao tác, đối tượng, email..." className="h-11 w-full max-w-md border px-3 text-sm" /><button className="rounded border px-4 text-sm">Tìm</button></form>
    <section className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-220 text-left text-sm"><thead className="bg-[#faf9f6] text-xs text-neutral-500"><tr><th className="p-4">Thời gian</th><th className="p-4">Quản trị viên</th><th className="p-4">Thao tác</th><th className="p-4">Đối tượng</th><th className="p-4">Chi tiết</th></tr></thead><tbody className="divide-y">{rows.map((row, index) => <tr key={`${row.created_at}-${index}`}><td className="whitespace-nowrap p-4">{String(row.created_at)}</td><td className="p-4">{String(row.email ?? "Tài khoản đã xóa")}</td><td className="p-4 font-medium">{String(row.action)}</td><td className="p-4">{String(row.target_type)}{row.target_id ? ` · ${row.target_id}` : ""}</td><td className="max-w-md whitespace-pre-wrap p-4 text-xs text-neutral-600">{String(row.details ?? "")}</td></tr>)}</tbody></table>{!rows.length && <p className="p-8 text-center text-sm text-neutral-500">Chưa có bản ghi phù hợp.</p>}</section>
    {pageCount > 1 && <nav className="mt-4 flex justify-between text-sm"><span>Trang {page}/{pageCount} · {total} bản ghi</span><div className="flex gap-2">{page > 1 && <a className="rounded border px-3 py-2" href={`/admin/nhat-ky?${query}&page=${page - 1}`}>Trước</a>}{page < pageCount && <a className="rounded border px-3 py-2" href={`/admin/nhat-ky?${query}&page=${page + 1}`}>Sau</a>}</div></nav>}
  </AdminShell>;
}
