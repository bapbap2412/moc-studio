import Link from "next/link";
import { ArrowRight, Building2, Package, ShieldCheck, Truck } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, formatPrice } from "@/lib/format";

const settingsSections = [
  {
    title: "Thông tin cửa hàng",
    description: "Thương hiệu MỘC Studio · Thời trang từ chất liệu tự nhiên.",
    detail: "Hotline: 02838505520",
    icon: Building2,
  },
  {
    title: "Giao hàng",
    description: `Phí giao hàng tiêu chuẩn: ${formatPrice(SHIPPING_FEE)}.`,
    detail: `Miễn phí giao hàng cho đơn từ ${formatPrice(FREE_SHIPPING_THRESHOLD)}.`,
    icon: Truck,
  },
  {
    title: "Chính sách đổi trả",
    description: "Khách hàng được hỗ trợ đổi trả trong vòng 30 ngày.",
    detail: "Thông tin chính sách được hiển thị trên cửa hàng trực tuyến.",
    icon: Package,
  },
  {
    title: "Quyền truy cập",
    description: "Khu vực quản trị chỉ dành cho tài khoản có quyền quản trị viên.",
    detail: "Tài khoản khách hàng không thể truy cập các chức năng quản lý.",
    icon: ShieldCheck,
  },
];

export default function AdminSettingsPage() {
  return (
    <AdminShell
      activeHref="/admin/cai-dat"
      breadcrumb="Cửa hàng / Cài đặt"
      title="Cài đặt"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-7">
          <h1 className="font-serif text-3xl">Thiết lập cửa hàng</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Thông tin và chính sách hiện đang áp dụng trên MỘC Studio.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {settingsSections.map(({ title, description, detail, icon: Icon }) => (
            <section key={title} className="rounded-xl border border-[#e8e5dc] bg-white p-5 md:p-6">
              <div className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f5f4ef]">
                  <Icon size={19} strokeWidth={1.7} />
                </span>
                <div>
                  <h2 className="font-medium">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-500">{detail}</p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-xl border border-[#e8e5dc] bg-white p-5 md:p-6">
          <h2 className="font-medium">Quản lý cửa hàng</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Đi tới các mục quản lý để cập nhật dữ liệu cửa hàng.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/admin/san-pham"
              className="inline-flex items-center gap-2 rounded-lg border border-[#e8e5dc] px-4 py-2.5 text-sm transition hover:bg-[#f5f4ef]"
            >
              Quản lý sản phẩm <ArrowRight size={15} />
            </Link>
            <Link
              href="/admin/khach-hang"
              className="inline-flex items-center gap-2 rounded-lg border border-[#e8e5dc] px-4 py-2.5 text-sm transition hover:bg-[#f5f4ef]"
            >
              Quản lý khách hàng <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        <footer className="py-8 text-center text-xs text-neutral-400">
          © 2026 MỘC Studio · Admin Dashboard
        </footer>
      </div>
    </AdminShell>
  );
}
