"use client";

import { useState, useTransition } from "react";
import { Eye, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createOrder,
  deleteOrder,
  updateOrder,
  updateOrderStatus,
} from "@/app/admin/don-hang/actions";
import {
  Badge,
  ConfirmDialog,
  Modal,
  SearchInput,
  iconButtonClass,
  inputClass,
  normalizeSearch,
  primaryButtonClass,
} from "@/components/admin/admin-ui";
import { OrderCreateForm, OrderEditForm } from "@/components/admin/order-forms";
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type AdminOrder,
  type AdminVariant,
  type CustomerOption,
} from "@/lib/admin-types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function OrdersManager({
  orders,
  variants,
  customers,
  initialQuery,
}: {
  orders: AdminOrder[];
  variants: AdminVariant[];
  customers: CustomerOption[];
  initialQuery: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminOrder | null>(null);
  const [pending, startTransition] = useTransition();

  const editing = orders.find((o) => o.id === editingId) ?? null;

  const search = normalizeSearch(query);
  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (paymentFilter !== "all" && o.payment_status !== paymentFilter) return false;
    if (!search) return true;
    return [o.code, o.recipient_name, o.phone, o.email].some((v) =>
      normalizeSearch(v).includes(search),
    );
  });

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;

  function run(action: () => Promise<{ ok: boolean; message: string }>, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message);
        onSuccess?.();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    run(() => createOrder(formData), () => setCreating(false));
  }

  function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const formData = new FormData(event.currentTarget);
    run(() => updateOrder(editing.id, formData), () => setEditingId(null));
  }

  return (
    <>
      <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl">Quản lý đơn hàng</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {orders.length} đơn hàng · {pendingCount} đang xử lý · {completedCount} đã giao ·
            Tổng doanh thu {formatPrice(totalRevenue)}
          </p>
        </div>
        <button type="button" onClick={() => setCreating(true)} className={primaryButtonClass}>
          <Plus size={17} />
          Tạo đơn hàng
        </button>
      </section>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={query} onChange={setQuery} placeholder="Tìm mã đơn, tên, SĐT, email..." />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Lọc theo trạng thái đơn"
          className={`${inputClass} sm:w-44`}
        >
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(ORDER_STATUSES).map(([value, meta]) => (
            <option key={value} value={value}>{meta.label}</option>
          ))}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          aria-label="Lọc theo thanh toán"
          className={`${inputClass} sm:w-48`}
        >
          <option value="all">Mọi thanh toán</option>
          {Object.entries(PAYMENT_STATUSES).map(([value, meta]) => (
            <option key={value} value={value}>{meta.label}</option>
          ))}
        </select>
        <p className="text-sm text-neutral-500 sm:ml-auto">
          Hiển thị {filtered.length}/{orders.length}
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e6de] bg-white">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-250 text-left text-sm">
              <thead className="bg-[#faf9f6] text-xs text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Mã đơn</th>
                  <th className="px-6 py-4 font-medium">Khách hàng</th>
                  <th className="px-6 py-4 font-medium">Sản phẩm</th>
                  <th className="px-6 py-4 font-medium">Ngày đặt</th>
                  <th className="px-6 py-4 font-medium">Thanh toán</th>
                  <th className="px-6 py-4 font-medium">Tổng tiền</th>
                  <th className="px-6 py-4 font-medium">Trạng thái</th>
                  <th className="px-6 py-4 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeae2]">
                {filtered.map((o) => {
                  const status = ORDER_STATUSES[o.status];
                  const payStatus = PAYMENT_STATUSES[o.payment_status] ?? {
                    label: o.payment_status,
                    badgeClass: "bg-neutral-100 text-neutral-700",
                  };
                  const first = o.items[0];
                  return (
                    <tr key={o.id} className="hover:bg-[#fcfbf8]">
                      <td className="px-6 py-4 font-medium">{o.code}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{o.recipient_name}</p>
                        <p className="text-xs text-neutral-500">{o.phone}</p>
                      </td>
                      <td className="px-6 py-4 text-neutral-600">
                        {first ? (
                          <span>
                            {first.product_name}
                            {o.items.length > 1 && (
                              <span className="text-neutral-400"> +{o.items.length - 1} khác</span>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4 text-neutral-500">{o.created_at}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-neutral-600">
                            {PAYMENT_METHODS[o.payment_method] ?? o.payment_method}
                          </span>
                          <Badge className={cn("px-2 py-0.5 text-[10px]", payStatus.badgeClass)}>
                            {payStatus.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{formatPrice(o.total)}</td>
                      <td className="px-6 py-4">
                        <select
                          value={o.status}
                          disabled={pending}
                          onChange={(e) => run(() => updateOrderStatus(o.id, e.target.value))}
                          aria-label={`Trạng thái đơn ${o.code}`}
                          className={cn(
                            "h-8 cursor-pointer rounded-full border-0 px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#4b5735]/20 disabled:cursor-wait",
                            status?.badgeClass ?? "bg-neutral-100 text-neutral-700",
                          )}
                        >
                          {Object.entries(ORDER_STATUSES).map(([value, meta]) => (
                            <option key={value} value={value} className="bg-white text-[#4b5735]">
                              {meta.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(o.id)}
                            className={iconButtonClass}
                            aria-label={`Xem và sửa đơn ${o.code}`}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(o)}
                            className={`${iconButtonClass} hover:bg-red-50 hover:text-red-600`}
                            aria-label={`Xóa đơn ${o.code}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <ShoppingBag size={32} className="text-neutral-300" />
            <p className="font-serif text-xl text-neutral-400">
              {orders.length === 0 ? "Chưa có đơn hàng nào" : "Không tìm thấy đơn hàng phù hợp"}
            </p>
          </div>
        )}
      </section>

      <Modal
        open={creating}
        onClose={() => !pending && setCreating(false)}
        title="Tạo đơn hàng"
        description="Giá và tồn kho được kiểm tra lại trên máy chủ khi lưu."
        size="lg"
      >
        <OrderCreateForm
          variants={variants}
          customers={customers}
          pending={pending}
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
        />
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => !pending && setEditingId(null)}
        title={editing ? `Đơn hàng ${editing.code}` : "Đơn hàng"}
        description={editing ? `Đặt ngày ${editing.created_at}` : undefined}
        size="lg"
      >
        {editing && (
          <OrderEditForm
            key={editing.id}
            order={editing}
            pending={pending}
            onSubmit={handleUpdate}
            onCancel={() => setEditingId(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => !pending && setDeleting(null)}
        onConfirm={() => deleting && run(() => deleteOrder(deleting.id), () => setDeleting(null))}
        pending={pending}
        title="Xóa đơn hàng?"
        message={
          <>
            Đơn <strong className="text-[#4b5735]">{deleting?.code}</strong> sẽ bị xóa vĩnh viễn.
            Nếu đơn chưa giao (Đang xử lý/Đã xác nhận), tồn kho sẽ được hoàn lại. Để giữ lịch
            sử, bạn nên chuyển trạng thái sang <strong>Đã hủy</strong> thay vì xóa.
          </>
        }
      />
    </>
  );
}
