"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

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
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f7f6f2] text-[#24241f]">
      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Đóng menu quản lý"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#e8e5dc] bg-white shadow-xl lg:hidden">
            <div className="flex h-20 items-center justify-between border-b border-[#eeeae2] px-6">
              <div>
                <h1 className="font-serif text-2xl tracking-[0.2em]">MỘC</h1>
                <p className="mt-1 text-[9px] tracking-[0.28em] text-neutral-500">STUDIO · ADMIN</p>
              </div>
              <button
                type="button"
                aria-label="Đóng menu quản lý"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 hover:bg-[#f0eee8]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-4 py-7">
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Quản lý cửa hàng</p>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = item.href === activeHref;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${active ? "bg-[#24241f] text-white" : "text-neutral-600 hover:bg-[#f5f4ef]"}`}
                    >
                      <Icon size={18} strokeWidth={1.7} />
                      {item.label}
                    </a>
                  );
                })}
              </nav>
            </div>
          </aside>
        </>
      )}
      <aside className={`hidden min-h-screen shrink-0 flex-col border-r border-[#e8e5dc] bg-white transition-[width] duration-200 lg:flex ${sidebarExpanded ? "w-64" : "w-20"}`}>
        <div className={`flex h-20 border-b border-[#eeeae2] ${sidebarExpanded ? "items-center justify-between px-7" : "flex-col items-center justify-center gap-1 px-2"}`}>
          <div className={sidebarExpanded ? "" : "text-center"}>
            <h1 className="font-serif text-2xl tracking-[0.2em]">MỘC</h1>
            {sidebarExpanded && <p className="mt-1 text-[9px] tracking-[0.28em] text-neutral-500">
              STUDIO · ADMIN
            </p>}
          </div>
          <button
            type="button"
            onClick={() => setSidebarExpanded((expanded) => !expanded)}
            aria-label={sidebarExpanded ? "Thu gọn thanh quản lý cửa hàng" : "Mở rộng thanh quản lý cửa hàng"}
            aria-expanded={sidebarExpanded}
            title={sidebarExpanded ? "Thu gọn menu" : "Mở rộng menu"}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-neutral-600 transition hover:bg-[#f0eee8] hover:text-[#24241f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24241f]/20"
          >
            {sidebarExpanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        <div className={sidebarExpanded ? "px-4 py-7" : "px-2 py-7"}>
          {sidebarExpanded && <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Quản lý cửa hàng
          </p>}

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === activeHref;

              return (
                <a
                  key={item.label}
                  href={item.href}
                  title={!sidebarExpanded ? item.label : undefined}
                  className={`flex items-center rounded-lg py-3 text-sm transition ${sidebarExpanded ? "gap-3 px-3" : "justify-center px-0"} ${
                    active
                      ? "bg-[#24241f] text-white"
                      : "text-neutral-600 hover:bg-[#f5f4ef]"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.7} />
                  {sidebarExpanded && item.label}
                </a>
              );
            })}
          </nav>
        </div>

        <div className={`mt-auto border-t border-[#eeeae2] ${sidebarExpanded ? "p-5" : "p-3"}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e9e4d8] font-serif">
              M
            </div>
            {sidebarExpanded && <div>
              <p className="text-sm font-medium">Admin MỘC Studio</p>
              <p className="mt-1 text-xs text-neutral-500">Quản trị viên</p>
            </div>}
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-20 items-center border-b border-[#e8e5dc] bg-white/95 px-5 backdrop-blur md:px-9">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu quản lý"
              aria-expanded={mobileMenuOpen}
              className="inline-flex rounded-lg p-2 transition hover:bg-[#f0eee8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24241f]/20 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-xs text-neutral-500">{breadcrumb}</p>
              <h2 className="mt-1 text-lg font-semibold">{title}</h2>
            </div>
          </div>

        </header>

        <div className="mx-auto max-w-375 p-5 md:p-9">{children}</div>
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
