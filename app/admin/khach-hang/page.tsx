import { Users } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import pool from "@/lib/db";
import { formatPrice } from "@/lib/format";

type CustomerRow = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  order_count: number;
  total_spent: number;
};

async function getCustomers(): Promise<CustomerRow[]> {
  try {
    const [rows] = await pool.query(
      `SELECT
        u.id, u.email, u.full_name, u.phone,
        DATE_FORMAT(u.created_at, '%d/%m/%Y') AS created_at,
        (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.status != 'cancelled') AS order_count,
        (SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.user_id = u.id AND o.status != 'cancelled') AS total_spent
      FROM users u
      WHERE u.role = 'customer'
      ORDER BY u.created_at DESC`,
    );
    return rows as CustomerRow[];
  } catch (error) {
    console.error("Admin customers error:", error);
    return [];
  }
}

export default async function AdminCustomersPage() {
  const customers = await getCustomers();

  const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const withOrders = customers.filter((c) => c.order_count > 0).length;

  return (
    <AdminShell
      activeHref="/admin/khach-hang"
      breadcrumb="Cửa hàng / Khách hàng"
      title="Khách hàng"
    >
      <section className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl">Quản lý khách hàng</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {customers.length} khách hàng · {withOrders} đã đặt hàng · Tổng chi tiêu{" "}
          {formatPrice(totalSpent)}
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e6de] bg-white">
        {customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#faf9f6] text-xs text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Khách hàng</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Số điện thoại</th>
                  <th className="px-6 py-4 font-medium">Ngày đăng ký</th>
                  <th className="px-6 py-4 font-medium">Số đơn hàng</th>
                  <th className="px-6 py-4 font-medium">Tổng chi tiêu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeae2]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#fcfbf8]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e9e4d8] text-xs font-medium">
                          {c.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{c.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">{c.email}</td>
                    <td className="px-6 py-4 text-neutral-600">
                      {c.phone ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-neutral-500">
                      {c.created_at}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          c.order_count > 0
                            ? "font-medium"
                            : "text-neutral-400"
                        }
                      >
                        {c.order_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {c.total_spent > 0 ? formatPrice(c.total_spent) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <Users size={32} className="text-neutral-300" />
            <p className="font-serif text-xl text-neutral-400">
              Chưa có khách hàng nào
            </p>
            <p className="text-sm text-neutral-500">
              Khách hàng sẽ xuất hiện tại đây khi họ đăng ký tài khoản.
            </p>
          </div>
        )}
      </section>

      <footer className="py-8 text-center text-xs text-neutral-400">
        © 2026 MỘC Studio · Admin Dashboard
      </footer>
    </AdminShell>
  );
}
