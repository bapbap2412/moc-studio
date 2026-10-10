
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  Search,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  MoreHorizontal,
  Shirt,
  CreditCard,
  Menu,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
const stats = [
  {
    label: "Tổng doanh thu",
    value: "24.850.000₫",
    change: "+12,8%",
    up: true,
    icon: CreditCard,
  },
  {
    label: "Đơn hàng",
    value: "128",
    change: "+8,2%",
    up: true,
    icon: ShoppingBag,
  },
  {
    label: "Sản phẩm",
    value: "86",
    change: "+4 sản phẩm",
    up: true,
    icon: Package,
  },
  {
    label: "Khách hàng",
    value: "542",
    change: "-2,4%",
    up: false,
    icon: Users,
  },
];

const orders = [
  {
    id: "#MOC-1028",
    customer: "Nguyễn Minh Anh",
    product: "Áo sơ mi Linen",
    date: "10/10/2026",
    total: "590.000₫",
    status: "Đang xử lý",
  },
  {
    id: "#MOC-1027",
    customer: "Trần Khánh Linh",
    product: "Quần ống rộng",
    date: "10/10/2026",
    total: "750.000₫",
    status: "Đã giao",
  },
  {
    id: "#MOC-1026",
    customer: "Lê Hoàng Nam",
    product: "Áo thun Basic",
    date: "09/10/2026",
    total: "320.000₫",
    status: "Đang giao",
  },
  {
    id: "#MOC-1025",
    customer: "Phạm Thu Hà",
    product: "Váy Midi",
    date: "09/10/2026",
    total: "890.000₫",
    status: "Đã giao",
  },
];

const navItems = [
  { label: "Tổng quan", icon: LayoutDashboard, href: "/admin" },
  { label: "Sản phẩm", icon: Package, href: "/admin/san-pham" },
  { label: "Đơn hàng", icon: ShoppingBag, href: "/admin/don-hang" },
  { label: "Khách hàng", icon: Users, href: "/admin/khach-hang" },
  { label: "Cài đặt", icon: Settings, href: "/admin/cai-dat" },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#24241f]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-[#e8e5dc] bg-white lg:flex">
        <div className="flex h-20 items-center border-b border-[#eeeae2] px-7">
          <div>
            <h1 className="font-serif text-2xl tracking-[0.2em]">
              MỘC
            </h1>
            <p className="mt-1 text-[9px] tracking-[0.28em] text-neutral-500">
              STUDIO · ADMIN
            </p>
          </div>
        </div>

        <div className="px-4 py-7">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Quản lý cửa hàng
          </p>

          <nav className="space-y-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = index === 0;

              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                    active
                      ? "bg-[#24241f] text-white"
                      : "text-neutral-600 hover:bg-[#f5f4ef]"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.7} />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-[#eeeae2] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e9e4d8] font-serif">
              M
            </div>
            <div>
              <p className="text-sm font-medium">Admin MỘC Studio</p>
              <p className="mt-1 text-xs text-neutral-500">Quản trị viên</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-800">
                Quản trị viên
            </p>
            <LogoutButton />
        </div>
      </aside>

      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-[#e8e5dc] bg-white/95 px-5 backdrop-blur md:px-9">
          <div className="flex items-center gap-3">
            <Menu className="lg:hidden" size={21} />
            <div>
              <p className="text-xs text-neutral-500">Cửa hàng / Dashboard</p>
              <h2 className="mt-1 text-lg font-semibold">Tổng quan</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Tìm kiếm"
              className="hidden h-10 items-center gap-2 rounded-lg border border-[#e8e5dc] px-3 text-sm text-neutral-500 sm:flex"
            >
              <Search size={16} />
              Tìm kiếm...
            </button>
            <button
              type="button"
              aria-label="Thông báo"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#e8e5dc]"
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] p-5 md:p-9">
          <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                Thứ bảy, 10 tháng 10, 2026
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
                    <span className="text-neutral-400">
                      so với tháng trước
                    </span>
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
                {[38, 58, 45, 78, 53, 90, 68].map((height, index) => (
                  <div
                    key={index}
                    className="flex h-full flex-1 flex-col justify-end"
                  >
                    <div
                      className={`w-full rounded-t-sm ${
                        index === 5 ? "bg-[#34342c]" : "bg-[#d9d5c9]"
                      }`}
                      style={{ height: `${height}%` }}
                      title={`Ngày ${index + 4}`}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-between pl-2 text-[11px] text-neutral-400">
                {["04/10", "05/10", "06/10", "07/10", "08/10", "09/10", "10/10"].map(
                  (day) => <span key={day}>{day}</span>
                )}
              </div>
            </article>

            <article className="rounded-xl border border-[#e9e6de] bg-white p-5 md:p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Tình trạng đơn hàng</h3>
                <MoreHorizontal size={20} className="text-neutral-500" />
              </div>

              <div className="mt-7 space-y-6">
                {[
                  { label: "Đã giao", value: 62, color: "bg-[#45483b]" },
                  { label: "Đang giao", value: 24, color: "bg-[#aaa48f]" },
                  { label: "Đang xử lý", value: 14, color: "bg-[#d9c8a2]" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-neutral-600">{item.label}</span>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#f0eee8]">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-[#eeeae2] pt-5">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Shirt size={17} />
                  <span>Sản phẩm đang được quan tâm</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  Khu vực này sẽ hiển thị sản phẩm bán chạy khi kết nối dữ liệu.
                </p>
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

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
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
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#fcfbf8]">
                      <td className="px-6 py-4 font-medium">{order.id}</td>
                      <td className="px-6 py-4">{order.customer}</td>
                      <td className="px-6 py-4 text-neutral-600">{order.product}</td>
                      <td className="px-6 py-4 text-neutral-500">{order.date}</td>
                      <td className="px-6 py-4 font-medium">{order.total}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs ${
                            order.status === "Đã giao"
                              ? "bg-green-50 text-green-700"
                              : order.status === "Đang giao"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-[#eeeae2] px-6 py-4 text-xs text-neutral-500">
              <span>Hiển thị 4 đơn hàng mẫu</span>
              <button type="button" className="underline underline-offset-4">
                Xem chi tiết
              </button>
            </div>
          </section>

          <footer className="py-8 text-center text-xs text-neutral-400">
            © 2026 MỘC Studio · Admin Dashboard
          </footer>
        </div>
      </main>
    </div>
  );
}
