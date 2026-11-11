import type { RowDataPacket } from "mysql2/promise";
import { AdminShell } from "@/components/admin/admin-shell";
import { CustomersManager } from "@/components/admin/customers-manager";
import pool from "@/lib/db";
import type { AdminCustomer } from "@/lib/admin-types";

const PAGE_SIZE = 25;

async function getCustomers(search: string, requestedPage: number, orderFilter: string): Promise<{ customers: AdminCustomer[]; total: number; page: number }> {
  try {
    const conditions = ["u.role = 'customer'"];
    const params: string[] = [];
    if (search) {
      conditions.push("(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)");
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }
    if (orderFilter === "with") conditions.push("EXISTS (SELECT 1 FROM orders ox WHERE ox.user_id = u.id AND ox.status <> 'cancelled')");
    if (orderFilter === "without") conditions.push("NOT EXISTS (SELECT 1 FROM orders ox WHERE ox.user_id = u.id AND ox.status <> 'cancelled')");
    const where = `WHERE ${conditions.join(" AND ")}`;
    const [counts] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM users u ${where}`,
      params,
    );
    const total = Number(counts[0]?.total ?? 0);
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(Math.max(1, requestedPage), pageCount);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        u.id, u.email, u.full_name, u.phone,
        DATE_FORMAT(u.created_at, '%d/%m/%Y') AS created_at,
        (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.status != 'cancelled') AS order_count,
        (SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.user_id = u.id AND o.status != 'cancelled' AND o.payment_status = 'paid') AS total_spent
      FROM users u
      ${where}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, PAGE_SIZE, (page - 1) * PAGE_SIZE],
    );
    const customers = rows.map((r) => ({
      id: String(r.id),
      email: r.email,
      full_name: r.full_name,
      phone: r.phone ?? null,
      created_at: r.created_at,
      order_count: Number(r.order_count),
      total_spent: Number(r.total_spent),
    }));
    return { customers, total, page };
  } catch (error) {
    console.error("Admin customers error:", error);
    return { customers: [], total: 0, page: 1 };
  }
}

async function getCustomerSummary() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total,
      SUM(EXISTS (SELECT 1 FROM orders o WHERE o.user_id=u.id AND o.status <> 'cancelled')) AS with_orders,
      COALESCE(SUM((SELECT COALESCE(SUM(o.total),0) FROM orders o WHERE o.user_id=u.id AND o.status <> 'cancelled' AND o.payment_status='paid')),0) AS paid_spend
     FROM users u WHERE u.role='customer'`,
  );
  const row = rows[0] ?? {};
  return { total: Number(row.total ?? 0), withOrders: Number(row.with_orders ?? 0), paidSpend: Number(row.paid_spend ?? 0) };
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; orders?: string }>;
}) {
  const { q, page, orders } = await searchParams;
  const orderFilter = orders === "with" || orders === "without" ? orders : "all";
  const [paginatedCustomers, summary] = await Promise.all([
    getCustomers(typeof q === "string" ? q.trim().slice(0, 100) : "", Number(page) || 1, orderFilter),
    getCustomerSummary(),
  ]);

  return (
    <AdminShell activeHref="/admin/khach-hang" breadcrumb="Cửa hàng / Khách hàng" title="Khách hàng">
      <CustomersManager
        customers={paginatedCustomers.customers}
        totalCustomers={paginatedCustomers.total}
        currentPage={paginatedCustomers.page}
        pageSize={PAGE_SIZE}
        initialQuery={typeof q === "string" ? q : ""}
        initialOrderFilter={orderFilter}
        summary={summary}
      />
      <footer className="py-8 text-center text-xs text-neutral-400">
        © 2026 MỘC Studio · Admin Dashboard
      </footer>
    </AdminShell>
  );
}
