
import { ShoppingBag, Package, Users, ArrowUpRight, ArrowDownRight, Plus, MoveHorizontal as MoreHorizontal, Shirt, CreditCard } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import pool from "@/lib/db";
import { formatPrice } from "@/lib/format";

const statusMap: Record<
  string,
  { label: string; badgeClass: string; barColor: string }
> = {
  pending: {
    label: "Đang xử lý",
    badgeClass: "bg-amber-50 text-amber-700",
    barColor: "bg-[#d9c8a2]",
  },
  confirmed: {
    label: "Đã xác nhận",
    badgeClass: "bg-blue-50 text-blue-700",
    barColor: "bg-[#aaa48f]",
  },
  shipping: {
    label: "Đang giao",
    badgeClass: "bg-blue-50 text-blue-700",
    barColor: "bg-[#aaa48f]",
  },
  completed: {
    label: "Đã giao",
    badgeClass: "bg-green-50 text-green-700",
    barColor: "bg-[#45483b]",
  },
  cancelled: {
    label: "Đã hủy",
    badgeClass: "bg-red-50 text-red-700",
    barColor: "bg-red-300",
  },
};

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : 0;
  return ((current - previous) / previous) * 100;
}

function formatChange(pct: number | null): string {
  if (pct === null) return "mới";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1).replace(".", ",")}%`;
}

type DashboardData = {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  newProducts: number;
  totalCustomers: number;
  newCustomers: number;
  revenueChange: number | null;
  orderChange: number | null;
  chartDays: { label: string; revenue: number }[];
  orderStatuses: { status: string; count: number; pct: number }[];
  recentOrders: {
    code: string;
    recipient_name: string;
    product_name: string | null;
    created_at: string;
    total: number;
    status: string;
  }[];
  bestSellers: { product_name: string; total_qty: number }[];
};

const defaultData: DashboardData = {
  totalRevenue: 0,
  totalOrders: 0,
  totalProducts: 0,
  newProducts: 0,
  totalCustomers: 0,
  newCustomers: 0,
  revenueChange: null,
  orderChange: null,
  chartDays: [],
  orderStatuses: [],
  recentOrders: [],
  bestSellers: [],
};

async function getDashboardData(): Promise<DashboardData> {
  try {
    const days: { key: string; label: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      days.push({ key, label, revenue: 0 });
    }

    const [
      statsResult,
      momResult,
      chartResult,
      statusResult,
      recentResult,
      bestSellerResult,
    ] = await Promise.all([
      pool.query(
        `SELECT
          (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'cancelled') AS total_revenue,
          (SELECT COUNT(*) FROM orders) AS total_orders,
          (SELECT COUNT(*) FROM products WHERE status = 'active') AS total_products,
          (SELECT COUNT(*) FROM products WHERE status = 'active' AND is_new = 1) AS new_products,
          (SELECT COUNT(*) FROM users WHERE role = 'customer') AS total_customers,
          (SELECT COUNT(*) FROM users WHERE role = 'customer' AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')) AS new_customers`,
      ),
      pool.query(
        `SELECT
          COALESCE(SUM(CASE WHEN created_at >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN total ELSE 0 END), 0) AS this_month_rev,
          COALESCE(SUM(CASE WHEN created_at >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01') AND created_at < DATE_FORMAT(NOW(), '%Y-%m-01') THEN total ELSE 0 END), 0) AS last_month_rev,
          COALESCE(SUM(CASE WHEN created_at >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 ELSE 0 END), 0) AS this_month_orders,
          COALESCE(SUM(CASE WHEN created_at >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01') AND created_at < DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 ELSE 0 END), 0) AS last_month_orders
        FROM orders
        WHERE status != 'cancelled'`,
      ),
      pool.query(
        `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS d, COALESCE(SUM(total), 0) AS rev
         FROM orders
         WHERE status != 'cancelled' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
         ORDER BY d`,
      ),
      pool.query(
        `SELECT status, COUNT(*) AS cnt FROM orders GROUP BY status`,
      ),
      pool.query(
        `SELECT o.code, o.recipient_name, DATE_FORMAT(o.created_at, '%d/%m/%Y') AS created_at, o.total, o.status,
           (SELECT oi.product_name FROM order_items oi WHERE oi.order_id = o.id ORDER BY oi.id LIMIT 1) AS product_name
         FROM orders o
         ORDER BY o.created_at DESC
         LIMIT 5`,
      ),
      pool.query(
        `SELECT oi.product_name, SUM(oi.quantity) AS total_qty
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE o.status != 'cancelled'
         GROUP BY oi.product_name
         ORDER BY total_qty DESC
         LIMIT 3`,
      ),
    ]);

    const statsRow = (statsResult[0] as Record<string, unknown>[])[0] || {};
    const momRow = (momResult[0] as Record<string, unknown>[])[0] || {};

    const thisMonthRev = Number(momRow.this_month_rev) || 0;
    const lastMonthRev = Number(momRow.last_month_rev) || 0;
    const thisMonthOrders = Number(momRow.this_month_orders) || 0;
    const lastMonthOrders = Number(momRow.last_month_orders) || 0;

    const chartRows = chartResult[0] as { d: string; rev: number }[];
    const chartMap = new Map<string, number>();
    for (const row of chartRows) {
      chartMap.set(row.d, Number(row.rev) || 0);
    }
    for (const day of days) {
      day.revenue = chartMap.get(day.key) || 0;
    }

    const statusRows = statusResult[0] as { status: string; cnt: number }[];
    const totalOrdersCount = statusRows.reduce(
      (sum, r) => sum + Number(r.cnt),
      0,
    );
    const orderStatuses = statusRows
      .map((r) => ({
        status: r.status,
        count: Number(r.cnt),
        pct:
          totalOrdersCount > 0
            ? Math.round((Number(r.cnt) / totalOrdersCount) * 100)
            : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const recentOrders = (recentResult[0] as Record<string, unknown>[]).map(
      (r) => ({
        code: String(r.code),
        recipient_name: String(r.recipient_name),
        product_name: r.product_name ? String(r.product_name) : null,
        created_at: String(r.created_at),
        total: Number(r.total),
        status: String(r.status),
      }),
    );

    const bestSellers = (bestSellerResult[0] as Record<string, unknown>[]).map(
      (r) => ({
        product_name: String(r.product_name),
        total_qty: Number(r.total_qty),
      }),
    );

    return {
      totalRevenue: Number(statsRow.total_revenue) || 0,
      totalOrders: Number(statsRow.total_orders) || 0,
      totalProducts: Number(statsRow.total_products) || 0,
      newProducts: Number(statsRow.new_products) || 0,
      totalCustomers: Number(statsRow.total_customers) || 0,
      newCustomers: Number(statsRow.new_customers) || 0,
      revenueChange: pctChange(thisMonthRev, lastMonthRev),
      orderChange: pctChange(thisMonthOrders, lastMonthOrders),
      chartDays: days.map((d) => ({ label: d.label, revenue: d.revenue })),
      orderStatuses,
      recentOrders,
      bestSellers,
    };
  } catch (error) {
    console.error("Dashboard data error:", error);
    return defaultData;
  }
}

export default async function AdminPage() {
  const data = await getDashboardData();

  const today = new Date();
  const dateStr = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(today);
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const stats = [
    {
      label: "Tổng doanh thu",
      value: formatPrice(data.totalRevenue),
      change: formatChange(data.revenueChange),
      up: data.revenueChange === null ? true : data.revenueChange >= 0,
      icon: CreditCard,
      suffix: "so với tháng trước",
    },
    {
      label: "Đơn hàng",
      value: String(data.totalOrders),
      change: formatChange(data.orderChange),
      up: data.orderChange === null ? true : data.orderChange >= 0,
      icon: ShoppingBag,
      suffix: "so với tháng trước",
    },
    {
      label: "Sản phẩm",
      value: String(data.totalProducts),
      change: `${data.newProducts} mới`,
      up: true,
      icon: Package,
      suffix: "đang bán",
    },
    {
      label: "Khách hàng",
      value: String(data.totalCustomers),
      change: `${data.newCustomers} mới`,
      up: true,
      icon: Users,
      suffix: "tháng này",
    },
  ];

  const maxRev = Math.max(...data.chartDays.map((d) => d.revenue), 1);
  const chartHeights = data.chartDays.map((d) =>
    Math.max((d.revenue / maxRev) * 100, 2),
  );
  const todayIndex = data.chartDays.length - 1;

  return (
    <AdminShell activeHref="/admin" breadcrumb="Cửa hàng / Dashboard" title="Tổng quan">
        <div className="mx-auto max-w-375 p-5 md:p-9">
          <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                {formattedDate}
              </p>
              <h1 className="mt-3 font-serif text-3xl md:text-4xl">
                Chào mừng trở lại.
              </h1>
              <p className="mt-2 text-sm text-neutral-500">
                Đây là tình hình tổng quan cửa hàng của bạn.
              </p>
            </div>

            <a
              href="/admin/san-pham"
              className="inline-flex h-11 items-center justify-center gap-2 bg-[#24241f] px-5 text-sm text-white transition hover:bg-neutral-700"
            >
              <Plus size={17} />
              Thêm sản phẩm
            </a>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const TrendIcon = stat.up ? ArrowUpRight : ArrowDownRight;

              return (
                <article
                  key={stat.label}
                  className="rounded-xl border border-[#e9e6de] bg-white p-5 md:p-6"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-500">{stat.label}</p>
                    <Icon size={19} className="text-neutral-500" />
                  </div>

                  <p className="mt-5 text-2xl font-semibold tracking-tight">
                    {stat.value}
                  </p>

                  <p
                    className={`mt-3 flex items-center gap-1 text-xs ${
                      stat.up ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    <TrendIcon size={15} />
                    {stat.change}
                    <span className="text-neutral-400">{stat.suffix}</span>
                  </p>
                </article>
              );
            })}
          </section>

          <section className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <article className="rounded-xl border border-[#e9e6de] bg-white p-5 md:p-6 xl:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Doanh thu cửa hàng</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Biểu đồ minh họa trong 7 ngày gần nhất
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-[#e8e5dc] px-3 py-2 text-xs"
                >
                  7 ngày gần đây
                </button>
              </div>

              <div className="mt-8 flex h-56 items-end gap-3 border-b border-l border-[#eeeae2] px-3 pb-0 pt-4 sm:gap-5">
                {chartHeights.map((height, index) => (
                  <div
                    key={index}
                    className="flex h-full flex-1 flex-col justify-end"
                  >
                    <div
                      className={`w-full rounded-t-sm ${
                        index === todayIndex ? "bg-[#34342c]" : "bg-[#d9d5c9]"
                      }`}
                      style={{ height: `${height}%` }}
                      title={`${data.chartDays[index]?.label}: ${formatPrice(data.chartDays[index]?.revenue ?? 0)}`}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-between pl-2 text-[11px] text-neutral-400">
                {data.chartDays.map((day) => (
                  <span key={day.label}>{day.label}</span>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-[#e9e6de] bg-white p-5 md:p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Tình trạng đơn hàng</h3>
                <MoreHorizontal size={20} className="text-neutral-500" />
              </div>

              <div className="mt-7 space-y-6">
                {data.orderStatuses.length > 0 ? (
                  data.orderStatuses.map((item) => {
                    const meta = statusMap[item.status] ?? {
                      label: item.status,
                      barColor: "bg-[#d9d5c9]",
                    };
                    return (
                      <div key={item.status}>
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-neutral-600">
                            {meta.label}
                          </span>
                          <span className="font-medium">{item.pct}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#f0eee8]">
                          <div
                            className={`h-full rounded-full ${meta.barColor}`}
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-neutral-400">
                    Chưa có đơn hàng nào.
                  </p>
                )}
              </div>

              <div className="mt-8 border-t border-[#eeeae2] pt-5">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Shirt size={17} />
                  <span>Sản phẩm bán chạy</span>
                </div>
                {data.bestSellers.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {data.bestSellers.map((bs) => (
                      <li
                        key={bs.product_name}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-neutral-600">
                          {bs.product_name}
                        </span>
                        <span className="font-medium">
                          {bs.total_qty} đã bán
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs leading-5 text-neutral-500">
                    Chưa có dữ liệu bán hàng. Sản phẩm bán chạy sẽ hiển thị ở
                    đây khi có đơn hàng.
                  </p>
                )}
              </div>
            </article>
          </section>

          <section className="mt-7 overflow-hidden rounded-xl border border-[#e9e6de] bg-white">
            <div className="flex flex-col justify-between gap-3 border-b border-[#eeeae2] p-5 sm:flex-row sm:items-center md:p-6">
              <div>
                <h3 className="font-semibold">Đơn hàng gần đây</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Các đơn hàng mới nhất của cửa hàng
                </p>
              </div>
              <a
                href="/admin/don-hang"
                className="text-sm underline underline-offset-4"
              >
                Xem tất cả
              </a>
            </div>

            {data.recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-180 text-left text-sm">
                  <thead className="bg-[#faf9f6] text-xs text-neutral-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Mã đơn hàng</th>
                      <th className="px-6 py-4 font-medium">Khách hàng</th>
                      <th className="px-6 py-4 font-medium">Sản phẩm</th>
                      <th className="px-6 py-4 font-medium">Ngày đặt</th>
                      <th className="px-6 py-4 font-medium">Tổng tiền</th>
                      <th className="px-6 py-4 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eeeae2]">
                    {data.recentOrders.map((order) => {
                      const meta = statusMap[order.status] ?? {
                        label: order.status,
                        badgeClass: "bg-neutral-100 text-neutral-700",
                      };
                      return (
                        <tr key={order.code} className="hover:bg-[#fcfbf8]">
                          <td className="px-6 py-4 font-medium">
                            {order.code}
                          </td>
                          <td className="px-6 py-4">{order.recipient_name}</td>
                          <td className="px-6 py-4 text-neutral-600">
                            {order.product_name ?? "—"}
                          </td>
                          <td className="px-6 py-4 text-neutral-500">
                            {order.created_at}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {formatPrice(order.total)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs ${meta.badgeClass}`}
                            >
                              {meta.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <p className="font-serif text-xl text-neutral-400">
                  Chưa có đơn hàng nào
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                  Đơn hàng mới sẽ xuất hiện tại đây khi khách hàng đặt mua.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-[#eeeae2] px-6 py-4 text-xs text-neutral-500">
              <span>
                {data.recentOrders.length > 0
                  ? `Hiển thị ${data.recentOrders.length} đơn hàng gần nhất`
                  : "Chưa có đơn hàng"}
              </span>
              <a
                href="/admin/don-hang"
                className="underline underline-offset-4"
              >
                Xem chi tiết
              </a>
            </div>
          </section>

          <footer className="py-8 text-center text-xs text-neutral-400">
            © 2026 MỘC Studio · Admin Dashboard
          </footer>
        </div>
    </AdminShell>
  );
}
