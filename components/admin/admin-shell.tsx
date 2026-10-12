import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  Search,
  Bell,
  Menu,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

const navItems = [
  { label: "Tổng quan", icon: LayoutDashboard, href: "/admin" },
  { label: "Sản phẩm", icon: Package, href: "/admin/san-pham" },
  { label: "Đơn hàng", icon: ShoppingBag, href: "/admin/don-hang" },
  { label: "Khách hàng", icon: Users, href: "/admin/khach-hang" },
  { label: "Cài đặt", icon: Settings, href: "/admin/cai-dat" },
];

export function AdminShell({
  children,
  activeHref,
  breadcrumb,
  title,
}: {
  children: React.ReactNode;
  activeHref: string;
  breadcrumb: string;
  title: string;
}) {
  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#24241f]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-[#e8e5dc] bg-white lg:flex">
        <div className="flex h-20 items-center border-b border-[#eeeae2] px-7">
          <div>
            <h1 className="font-serif text-2xl tracking-[0.2em]">MỘC</h1>
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
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === activeHref;

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
              <p className="text-xs text-neutral-500">{breadcrumb}</p>
              <h2 className="mt-1 text-lg font-semibold">{title}</h2>
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

        <div className="mx-auto max-w-[1500px] p-5 md:p-9">{children}</div>
      </main>
    </div>
  );
}

export const orderStatusMap: Record<
  string,
  { label: string; badgeClass: string }
> = {
  pending: {
    label: "Đang xử lý",
    badgeClass: "bg-amber-50 text-amber-700",
  },
  confirmed: {
    label: "Đã xác nhận",
    badgeClass: "bg-blue-50 text-blue-700",
  },
  shipping: {
    label: "Đang giao",
    badgeClass: "bg-blue-50 text-blue-700",
  },
  completed: {
    label: "Đã giao",
    badgeClass: "bg-green-50 text-green-700",
  },
  cancelled: {
    label: "Đã hủy",
    badgeClass: "bg-red-50 text-red-700",
  },
};

export const productStatusMap: Record<
  string,
  { label: string; badgeClass: string }
> = {
  draft: {
    label: "Bản nháp",
    badgeClass: "bg-neutral-100 text-neutral-600",
  },
  active: {
    label: "Đang bán",
    badgeClass: "bg-green-50 text-green-700",
  },
  archived: {
    label: "Lưu trữ",
    badgeClass: "bg-neutral-100 text-neutral-500",
  },
};
