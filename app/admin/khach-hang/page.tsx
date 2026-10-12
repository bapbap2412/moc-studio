import type { RowDataPacket } from "mysql2/promise";
import { AdminShell } from "@/components/admin/admin-shell";
import { CustomersManager } from "@/components/admin/customers-manager";
import pool from "@/lib/db";
import type { AdminCustomer } from "@/lib/admin-types";

async function getCustomers(): Promise<AdminCustomer[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        u.id, u.email, u.full_name, u.phone,
        DATE_FORMAT(u.created_at, '%d/%m/%Y') AS created_at,
        (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.status != 'cancelled') AS order_count,
        (SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.user_id = u.id AND o.status != 'cancelled') AS total_spent
      FROM users u
      WHERE u.role = 'customer'
      ORDER BY u.created_at DESC`,
    );
    return rows.map((r) => ({
      id: String(r.id),
      email: r.email,
      full_name: r.full_name,
      phone: r.phone ?? null,
      created_at: r.created_at,
      order_count: Number(r.order_count),
      total_spent: Number(r.total_spent),
    }));
  } catch (error) {
    console.error("Admin customers error:", error);
    return [];
  }
}

export default async function AdminCustomersPage() {
  const customers = await getCustomers();

  return (
    <AdminShell activeHref="/admin/khach-hang" breadcrumb="Cửa hàng / Khách hàng" title="Khách hàng">
      <CustomersManager customers={customers} />
      <footer className="py-8 text-center text-xs text-neutral-400">
        © 2026 MỘC Studio · Admin Dashboard
      </footer>
    </AdminShell>
  );
}
