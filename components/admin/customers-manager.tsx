"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Plus, ShoppingBag, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  createCustomer,
  deleteCustomer,
  updateCustomer,
} from "@/app/admin/khach-hang/actions";
import {
  ConfirmDialog,
  Field,
  FormActions,
  Modal,
  SearchInput,
  iconButtonClass,
  inputClass,
  normalizeSearch,
  primaryButtonClass,
} from "@/components/admin/admin-ui";
import type { AdminCustomer } from "@/lib/admin-types";
import { formatPrice } from "@/lib/format";

export function CustomersManager({ customers }: { customers: AdminCustomer[] }) {
  const [query, setQuery] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCustomer | null>(null);
  const [deleting, setDeleting] = useState<AdminCustomer | null>(null);
  const [pending, startTransition] = useTransition();

  const search = normalizeSearch(query);
  const filtered = customers.filter((c) => {
    if (orderFilter === "with" && c.order_count === 0) return false;
    if (orderFilter === "without" && c.order_count > 0) return false;
    if (!search) return true;
    return [c.full_name, c.email, c.phone ?? ""].some((v) =>
      normalizeSearch(v).includes(search),
    );
  });

  const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const withOrders = customers.filter((c) => c.order_count > 0).length;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = editing
        ? await updateCustomer(editing.id, formData)
        : await createCustomer(formData);
      if (result.ok) {
        toast.success(result.message);
        setFormOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteCustomer(deleting.id);
      if (result.ok) {
        toast.success(result.message);
        setDeleting(null);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl">Quản lý khách hàng</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {customers.length} khách hàng · {withOrders} đã đặt hàng · Tổng chi tiêu{" "}
            {formatPrice(totalSpent)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className={primaryButtonClass}
        >
          <Plus size={17} />
          Thêm khách hàng
        </button>
      </section>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Tìm theo tên, email, SĐT..."
        />
        <select
          value={orderFilter}
          onChange={(e) => setOrderFilter(e.target.value)}
          aria-label="Lọc theo đơn hàng"
          className={`${inputClass} sm:w-48`}
        >
          <option value="all">Tất cả khách hàng</option>
          <option value="with">Đã đặt hàng</option>
          <option value="without">Chưa đặt hàng</option>
        </select>
        <p className="text-sm text-neutral-500 sm:ml-auto">
          Hiển thị {filtered.length}/{customers.length}
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e6de] bg-white">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-215 text-left text-sm">
              <thead className="bg-[#faf9f6] text-xs text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Khách hàng</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Số điện thoại</th>
                  <th className="px-6 py-4 font-medium">Ngày đăng ký</th>
                  <th className="px-6 py-4 font-medium">Số đơn</th>
                  <th className="px-6 py-4 font-medium">Tổng chi tiêu</th>
                  <th className="px-6 py-4 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeae2]">
                {filtered.map((c) => (
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
                    <td className="px-6 py-4 text-neutral-600">{c.phone ?? "—"}</td>
                    <td className="px-6 py-4 text-neutral-500">{c.created_at}</td>
                    <td className="px-6 py-4">
                      <span className={c.order_count > 0 ? "font-medium" : "text-neutral-400"}>
                        {c.order_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {c.total_spent > 0 ? formatPrice(c.total_spent) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/admin/don-hang?q=${encodeURIComponent(c.email)}`}
                          className={iconButtonClass}
                          aria-label={`Xem đơn hàng của ${c.full_name}`}
                          title="Xem đơn hàng"
                        >
                          <ShoppingBag size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(c);
                            setFormOpen(true);
                          }}
                          className={iconButtonClass}
                          aria-label={`Sửa ${c.full_name}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(c)}
                          className={`${iconButtonClass} hover:bg-red-50 hover:text-red-600`}
                          aria-label={`Xóa ${c.full_name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Users size={32} className="text-neutral-300" />
            <p className="font-serif text-xl text-neutral-400">
              {customers.length === 0
                ? "Chưa có khách hàng nào"
                : "Không tìm thấy khách hàng phù hợp"}
            </p>
          </div>
        )}
      </section>

      <Modal
        open={formOpen}
        onClose={() => !pending && setFormOpen(false)}
        title={editing ? "Sửa khách hàng" : "Thêm khách hàng"}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Họ và tên" htmlFor="c-name" required>
            <input
              id="c-name"
              name="full_name"
              required
              maxLength={120}
              defaultValue={editing?.full_name}
              className={inputClass}
              autoComplete="off"
            />
          </Field>
          <Field label="Email" htmlFor="c-email" required>
            <input
              id="c-email"
              name="email"
              type="email"
              required
              maxLength={255}
              defaultValue={editing?.email}
              className={inputClass}
              autoComplete="off"
            />
          </Field>
          <Field label="Số điện thoại" htmlFor="c-phone">
            <input
              id="c-phone"
              name="phone"
              type="tel"
              maxLength={20}
              defaultValue={editing?.phone ?? ""}
              className={inputClass}
            />
          </Field>
          <Field
            label={editing ? "Mật khẩu mới" : "Mật khẩu"}
            htmlFor="c-password"
            required={!editing}
            hint={
              editing
                ? "Để trống nếu không đổi mật khẩu. Tối thiểu 8 ký tự."
                : "Tối thiểu 8 ký tự. Khách hàng dùng mật khẩu này để đăng nhập."
            }
          >
            <input
              id="c-password"
              name="password"
              type="password"
              minLength={8}
              required={!editing}
              className={inputClass}
              autoComplete="new-password"
            />
          </Field>
          <FormActions
            onCancel={() => setFormOpen(false)}
            pending={pending}
            submitLabel={editing ? "Lưu thay đổi" : "Thêm khách hàng"}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => !pending && setDeleting(null)}
        onConfirm={handleDelete}
        pending={pending}
        title="Xóa khách hàng?"
        message={
          <>
            Tài khoản <strong className="text-[#24241f]">{deleting?.full_name}</strong> (
            {deleting?.email}) cùng giỏ hàng và sổ địa chỉ sẽ bị xóa vĩnh viễn.{" "}
            {deleting && deleting.order_count > 0 && (
              <>{deleting.order_count} đơn hàng của khách vẫn được giữ lại.</>
            )}
          </>
        }
      />
    </>
  );
}
