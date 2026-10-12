import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { AdminShell, orderStatusMap } from "@/components/admin/admin-shell";
import pool from "@/lib/db";
import { formatPrice } from "@/lib/format";

type OrderRow = {
  id: string;
  code: string;
  recipient_name: string;
  phone: string;
  email: string;
  total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  item_count: number;
  first_product: string | null;
};

async function getOrders(): Promise<OrderRow[]> {
  try {
    const [rows] = await pool.query(
      `SELECT
        o.id, o.code, o.recipient_name, o.phone, o.email,
        o.total, o.status, o.payment_method, o.payment_status,
        DATE_FORMAT(o.created_at, '%d/%m/%Y') AS created_at,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
        (SELECT oi.product_name FROM order_items oi WHERE oi.order_id = o.id ORDER BY oi.id LIMIT 1) AS first_product
      FROM orders o
      ORDER BY o.created_at DESC`,
    );
    return rows as OrderRow[];
  } catch (error) {
    console.error("Admin orders error:", error);
    return [];
  }
}

const paymentMethodMap: Record<string, string> = {
  cod: "COD",
  bank_transfer: "Chuyển khoản",
  ewallet: "Ví điện tử",
};

const paymentStatusMap: Record<string, { label: string; badgeClass: string }> = {
  unpaid: { label: "Chưa thanh toán", badgeClass: "bg-amber-50 text-amber-700" },
  paid: { label: "Đã thanh toán", badgeClass: "bg-green-50 text-green-700" },
  refunded: { label: "Đã hoàn tiền", badgeClass: "bg-red-50 text-red-700" },
};

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;

  return (
    <AdminShell
      activeHref="/admin/don-hang"
      breadcrumb="Cửa hàng / Đơn hàng"
      title="Đơn hàng"
    >
      <section className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl">Quản lý đơn hàng</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {orders.length} đơn hàng · {pendingCount} đang xử lý · {completedCount} đã giao ·{" "}
          Tổng doanh thu {formatPrice(totalRevenue)}
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e6de] bg-white">
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-[#faf9f6] text-xs text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Mã đơn</th>
                  <th className="px-6 py-4 font-medium">Khách hàng</th>
                  <th className="px-6 py-4 font-medium">Sản phẩm</th>
                  <th className="px-6 py-4 font-medium">Ngày đặt</th>
                  <th className="px-6 py-4 font-medium">Thanh toán</th>
                  <th className="px-6 py-4 font-medium">Tổng tiền</th>
                  <th className="px-6 py-4 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeae2]">
                {orders.map((o) => {
                  const statusMeta = orderStatusMap[o.status] ?? {
                    label: o.status,
                    badgeClass: "bg-neutral-100 text-neutral-700",
                  };
                  const payStatus = paymentStatusMap[o.payment_status] ?? {
                    label: o.payment_status,
                    badgeClass: "bg-neutral-100 text-neutral-700",
                  };
                  return (
                    <tr key={o.id} className="hover:bg-[#fcfbf8]">
                      <td className="px-6 py-4 font-medium">{o.code}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{o.recipient_name}</p>
                          <p className="text-xs text-neutral-500">{o.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-600">
                        {o.first_product ? (
                          <span>
                            {o.first_product}
                            {o.item_count > 1 && (
                              <span className="text-neutral-400">
                                {" "}
                                +{o.item_count - 1} khác
                              </span>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4 text-neutral-500">
                        {o.created_at}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-neutral-600">
                            {paymentMethodMap[o.payment_method] ?? o.payment_method}
                          </span>
                          <span
                            className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] ${payStatus.badgeClass}`}
                          >
                            {payStatus.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatPrice(o.total)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs ${statusMeta.badgeClass}`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <ShoppingBag size={32} className="text-neutral-300" />
            <p className="font-serif text-xl text-neutral-400">
              Chưa có đơn hàng nào
            </p>
            <p className="text-sm text-neutral-500">
              Đơn hàng sẽ xuất hiện tại đây khi khách hàng đặt mua.
            </p>
            <Link
              href="/san-pham"
              className="mt-2 inline-flex h-11 items-center bg-[#24241f] px-5 text-sm text-white transition hover:bg-neutral-700"
            >
              Xem cửa hàng
            </Link>
          </div>
        )}
      </section>

      <footer className="py-8 text-center text-xs text-neutral-400">
        © 2026 MỘC Studio · Admin Dashboard
      </footer>
    </AdminShell>
  );
}
