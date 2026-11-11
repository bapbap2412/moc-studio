import Link from "next/link";
import type { RowDataPacket } from "mysql2/promise";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminAccountsManager, type AdminAccount } from "@/components/admin/admin-accounts-manager";
import { StoreSettingsManager } from "@/components/admin/store-settings-manager";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { getStoreSettings } from "@/lib/store-settings";

async function getAdminAccounts(): Promise<AdminAccount[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, email, full_name, is_active FROM users WHERE role = 'admin' ORDER BY full_name, email",
  );
  return rows.map((row) => ({
    id: String(row.id),
    email: String(row.email),
    full_name: String(row.full_name),
    is_active: Number(row.is_active) === 1,
  }));
}

export default async function AdminSettingsPage() {
  const [accounts, session, settings] = await Promise.all([getAdminAccounts(), getSession(), getStoreSettings()]);
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

        <StoreSettingsManager settings={settings} />

        <section className="mt-6 rounded-xl border border-[#e8e5dc] bg-white p-5 md:p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f5f4ef]"><ShieldCheck size={19} strokeWidth={1.7} /></span>
            <div>
              <h2 className="font-medium">Quyền truy cập</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">Khu vực quản trị chỉ dành cho tài khoản có quyền quản trị viên; tài khoản khách hàng không thể truy cập chức năng quản lý.</p>
            </div>
          </div>
        </section>

        <AdminAccountsManager accounts={accounts} currentUserId={session?.userId ?? ""} />

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
