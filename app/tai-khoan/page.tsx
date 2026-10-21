
import Link from "next/link";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2/promise";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import { LogoutButton } from "@/components/auth/logout-button";
import { AccountProfileForm } from "@/components/account/account-profile-form";
import { CustomerOrderStatuses, type CustomerOrderStatus } from "@/components/orders/customer-order-statuses";

type AccountRow = RowDataPacket & {
  full_name: string;
  phone: string | null;
};

type AddressRow = RowDataPacket & {
  province: string;
  ward: string;
  street: string;
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const { payment } = await searchParams;
  const session = await getSession();

  if (!session) {
    redirect("/dang-nhap");
  }

  if (session.role === "admin") {
    redirect("/admin");
  }

  const [rows] = await pool.execute<AccountRow[]>(
    "SELECT full_name, phone FROM users WHERE id = ? AND role = 'customer' LIMIT 1",
    [session.userId],
  );
  const account = rows[0];

  if (!account) redirect("/dang-nhap");

  const [addressRows] = await pool.execute<AddressRow[]>(
    `SELECT province, ward, street
     FROM addresses
     WHERE user_id = ?
     ORDER BY is_default DESC
     LIMIT 1`,
    [session.userId],
  );
  const address = addressRows[0];

  const [orderRows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, code, status, payment_status, total,
      DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') AS created_at
     FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
    [session.userId],
  );
  const orders: CustomerOrderStatus[] = orderRows.map((row) => ({
    id: String(row.id),
    code: String(row.code),
    status: String(row.status),
    payment_status: String(row.payment_status),
    total: Number(row.total),
    created_at: String(row.created_at),
  }));

  return (
    <main className="min-h-[70vh] bg-background px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-muted-foreground">
          MỘC Studio / Tài khoản
        </p>

        <h1 className="mt-3 font-serif text-3xl">
          Tài khoản của tôi
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Xin chào, chào mừng bạn quay lại MỘC Studio.
        </p>

        {payment === "processing" && <p role="status" className="mt-4 border border-border bg-secondary p-4 text-sm">VNPay đã trả kết quả. Đơn hàng sẽ hiển thị đã thanh toán sau khi máy chủ xác nhận IPN.</p>}
        {payment === "failed" && <p role="status" className="mt-4 border border-border bg-secondary p-4 text-sm">Giao dịch VNPay chưa thành công. Bạn có thể kiểm tra trạng thái đơn hàng bên dưới hoặc liên hệ cửa hàng.</p>}
        {payment === "unverified" && <p role="alert" className="mt-4 border border-border bg-secondary p-4 text-sm">Không xác minh được kết quả trả về từ VNPay. Hãy kiểm tra trạng thái đơn hàng bên dưới.</p>}

        <section className="mt-8 rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold">
            Thông tin tài khoản
          </h2>

          <div className="mt-5">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="mt-1 font-medium">{session.email}</p>
          </div>

          <AccountProfileForm
            fullName={account.full_name}
            phone={account.phone ?? ""}
            address={address ?? { province: "", ward: "", street: "" }}
          />

          
        </section>
        <CustomerOrderStatuses orders={orders} title="Đơn hàng của tôi" />
      </div>
    </main>
  );
}
