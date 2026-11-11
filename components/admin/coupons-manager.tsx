"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import { saveCoupon, setCouponActive } from "@/app/admin/ma-giam-gia/actions";
import { Field, FormActions, Modal, SearchInput, inputClass, primaryButtonClass } from "@/components/admin/admin-ui";
import { formatPrice } from "@/lib/format";

export type AdminCoupon = {
  id: number;
  code: string;
  discount_type: "percent" | "fixed";
  value: number;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

function localDate(value: string | null) {
  return value ? value.replace(" ", "T").slice(0, 16) : "";
}

export function CouponsManager({ coupons, total, currentPage, pageSize, initialQuery }: { coupons: AdminCoupon[]; total: number; currentPage: number; pageSize: number; initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const filterQuery = new URLSearchParams({ q: initialQuery }).toString();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveCoupon(editing?.id ?? null, data);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setFormOpen(false);
      setEditing(null);
    });
  }

  function toggle(coupon: AdminCoupon) {
    startTransition(async () => {
      const result = await setCouponActive(coupon.id, !coupon.is_active);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <>
      <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl">Mã giảm giá</h1>
        <p className="mt-2 text-sm text-neutral-500">{total} mã · không xóa mã để giữ lịch sử đơn hàng.</p>
        </div>
        <button type="button" className={primaryButtonClass} onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={17} /> Tạo mã
        </button>
      </section>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form action="/admin/ma-giam-gia" method="get" className="flex w-full gap-2 sm:max-w-md">
          <SearchInput name="q" value={query} onChange={setQuery} placeholder="Tìm mã giảm giá..." />
          <button type="submit" className="rounded-lg border px-4 text-sm">Tìm</button>
        </form>
        <p className="text-sm text-neutral-500 sm:ml-auto">Hiển thị {coupons.length} mã trên trang · {total} kết quả</p>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e6de] bg-white">
        {coupons.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-220 text-left text-sm">
              <thead className="bg-[#faf9f6] text-xs text-neutral-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Mã</th>
                  <th className="px-5 py-4 font-medium">Ưu đãi</th>
                  <th className="px-5 py-4 font-medium">Điều kiện</th>
                  <th className="px-5 py-4 font-medium">Lượt dùng</th>
                  <th className="px-5 py-4 font-medium">Thời hạn</th>
                  <th className="px-5 py-4 font-medium">Trạng thái</th>
                  <th className="px-5 py-4 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeae2]">
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="px-5 py-4 font-semibold">{coupon.code}</td>
                    <td className="px-5 py-4">{coupon.discount_type === "percent" ? `${coupon.value}%${coupon.max_discount ? ` · tối đa ${formatPrice(coupon.max_discount)}` : ""}` : formatPrice(coupon.value)}</td>
                    <td className="px-5 py-4 text-neutral-600">Đơn từ {formatPrice(coupon.min_order_amount)}</td>
                    <td className="px-5 py-4 text-neutral-600">{coupon.used_count}/{coupon.usage_limit ?? "∞"}</td>
                    <td className="px-5 py-4 text-xs text-neutral-600">{coupon.starts_at ?? "Không giới hạn"}<br />đến {coupon.ends_at ?? "Không giới hạn"}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${coupon.is_active ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-600"}`}>{coupon.is_active ? "Đang bật" : "Đã tắt"}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" disabled={pending} onClick={() => { setEditing(coupon); setFormOpen(true); }} className="rounded-lg border border-[#e8e5dc] p-2 hover:bg-[#f5f4ef]" aria-label={`Sửa mã ${coupon.code}`}><Pencil size={15} /></button>
                        <button type="button" disabled={pending} onClick={() => toggle(coupon)} className="rounded-lg border border-[#e8e5dc] px-3 py-2 text-xs hover:bg-[#f5f4ef]">{coupon.is_active ? "Tắt" : "Bật"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-neutral-400">
            <TicketPercent size={30} />
            <p>{total ? "Không tìm thấy mã phù hợp." : "Chưa có mã giảm giá."}</p>
          </div>
        )}
      </section>

      {pageCount > 1 && <nav className="mt-5 flex items-center justify-between text-sm"><span>Trang {currentPage}/{pageCount}</span><div className="flex gap-2">{currentPage > 1 && <a className="rounded border px-3 py-2" href={`/admin/ma-giam-gia?${filterQuery}&page=${currentPage - 1}`}>Trước</a>}{currentPage < pageCount && <a className="rounded border px-3 py-2" href={`/admin/ma-giam-gia?${filterQuery}&page=${currentPage + 1}`}>Sau</a>}</div></nav>}

      <Modal open={formOpen} onClose={() => !pending && setFormOpen(false)} title={editing ? `Sửa mã ${editing.code}` : "Tạo mã giảm giá"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mã giảm giá" htmlFor="coupon-code" required hint="3–30 ký tự A-Z, số, _ hoặc -.">
              <input id="coupon-code" name="code" required minLength={3} maxLength={30} defaultValue={editing?.code} onChange={(event) => { event.currentTarget.value = event.currentTarget.value.toUpperCase(); }} className={inputClass} />
            </Field>
            <Field label="Loại giảm" htmlFor="coupon-type" required>
              <select id="coupon-type" name="discount_type" defaultValue={editing?.discount_type ?? "percent"} className={inputClass}>
                <option value="percent">Phần trăm</option>
                <option value="fixed">Số tiền cố định</option>
              </select>
            </Field>
            <Field label="Giá trị giảm" htmlFor="coupon-value" required>
              <input id="coupon-value" name="value" type="number" min={1} max={1_000_000_000} required defaultValue={editing?.value} className={inputClass} />
            </Field>
            <Field label="Đơn tối thiểu (₫)" htmlFor="coupon-minimum" required>
              <input id="coupon-minimum" name="min_order_amount" type="number" min={0} max={1_000_000_000} required defaultValue={editing?.min_order_amount ?? 0} className={inputClass} />
            </Field>
            <Field label="Giảm tối đa (₫)" htmlFor="coupon-max" hint="Chỉ dùng với mã phần trăm.">
              <input id="coupon-max" name="max_discount" type="number" min={1} max={1_000_000_000} defaultValue={editing?.max_discount ?? ""} className={inputClass} />
            </Field>
            <Field label="Lượt dùng tối đa" htmlFor="coupon-limit" hint="Để trống nếu không giới hạn.">
              <input id="coupon-limit" name="usage_limit" type="number" min={1} max={1_000_000_000} defaultValue={editing?.usage_limit ?? ""} className={inputClass} />
            </Field>
            <Field label="Bắt đầu" htmlFor="coupon-start">
              <input id="coupon-start" name="starts_at" type="datetime-local" defaultValue={localDate(editing?.starts_at ?? null)} className={inputClass} />
            </Field>
            <Field label="Kết thúc" htmlFor="coupon-end">
              <input id="coupon-end" name="ends_at" type="datetime-local" defaultValue={localDate(editing?.ends_at ?? null)} className={inputClass} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input name="is_active" value="1" type="checkbox" defaultChecked={editing?.is_active ?? true} /> Bật mã ngay sau khi lưu</label>
          <FormActions onCancel={() => setFormOpen(false)} pending={pending} submitLabel={editing ? "Lưu thay đổi" : "Tạo mã"} />
        </form>
      </Modal>
    </>
  );
}
