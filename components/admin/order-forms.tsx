"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Field,
  FormActions,
  iconButtonClass,
  inputClass,
  secondaryButtonClass,
  textareaClass,
} from "@/components/admin/admin-ui";
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type AdminOrder,
  type AdminVariant,
  type CustomerOption,
} from "@/lib/admin-types";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, formatPrice } from "@/lib/format";

type FormProps = {
  pending: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

function StatusFields({ order }: { order?: AdminOrder }) {
  return (
    <>
      <Field label="Trạng thái đơn" htmlFor="o-status" required>
        <select
          id="o-status"
          name="status"
          defaultValue={order?.status ?? "pending"}
          className={inputClass}
        >
          {Object.entries(ORDER_STATUSES).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Thanh toán" htmlFor="o-pay-status" required>
        <select
          id="o-pay-status"
          name="payment_status"
          defaultValue={order?.payment_status ?? "unpaid"}
          className={inputClass}
        >
          {Object.entries(PAYMENT_STATUSES).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </select>
      </Field>
    </>
  );
}

type ContactValues = {
  recipient_name: string;
  phone: string;
  email: string;
  shipping_address: string;
};

function ContactFields({
  values,
  onChange,
  note,
}: {
  values: ContactValues;
  onChange: (values: ContactValues) => void;
  note?: string | null;
}) {
  const set = (key: keyof ContactValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...values, [key]: event.target.value });

  return (
    <>
      <Field label="Người nhận" htmlFor="o-name" required>
        <input id="o-name" name="recipient_name" required maxLength={120} value={values.recipient_name} onChange={set("recipient_name")} className={inputClass} />
      </Field>
      <Field label="Số điện thoại" htmlFor="o-phone" required>
        <input id="o-phone" name="phone" type="tel" required maxLength={20} value={values.phone} onChange={set("phone")} className={inputClass} />
      </Field>
      <Field label="Email" htmlFor="o-email" required className="sm:col-span-2">
        <input id="o-email" name="email" type="email" required maxLength={255} value={values.email} onChange={set("email")} className={inputClass} />
      </Field>
      <Field label="Địa chỉ giao hàng" htmlFor="o-address" required className="sm:col-span-2">
        <textarea id="o-address" name="shipping_address" required maxLength={500} value={values.shipping_address} onChange={set("shipping_address")} className={`${textareaClass} min-h-16`} />
      </Field>
      <Field label="Ghi chú" htmlFor="o-note" className="sm:col-span-2">
        <textarea id="o-note" name="note" maxLength={1000} defaultValue={note ?? ""} className={`${textareaClass} min-h-16`} />
      </Field>
    </>
  );
}

export function OrderEditForm({ order, pending, onSubmit, onCancel }: FormProps & { order: AdminOrder }) {
  const [contact, setContact] = useState<ContactValues>({
    recipient_name: order.recipient_name,
    phone: order.phone,
    email: order.email,
    shipping_address: order.shipping_address,
  });

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Sản phẩm trong đơn" className="rounded-lg border border-[#eeeae2]">
        <ul className="divide-y divide-[#eeeae2]">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{item.product_name}</p>
                <p className="text-xs text-neutral-500">
                  {item.color_name} / {item.size_name} · {formatPrice(item.unit_price)} × {item.quantity}
                </p>
              </div>
              <span className="font-medium">{formatPrice(item.unit_price * item.quantity)}</span>
            </li>
          ))}
          {order.items.length === 0 && (
            <li className="px-4 py-3 text-sm text-neutral-500">Đơn hàng không có sản phẩm.</li>
          )}
        </ul>
        <dl className="space-y-1.5 border-t border-[#eeeae2] bg-[#faf9f6] px-4 py-3 text-sm">
          <div className="flex justify-between"><dt className="text-neutral-500">Tạm tính</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-500">Phí vận chuyển</dt><dd>{order.shipping_fee > 0 ? formatPrice(order.shipping_fee) : "Miễn phí"}</dd></div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between"><dt className="text-neutral-500">Giảm giá</dt><dd>-{formatPrice(order.discount_amount)}</dd></div>
          )}
          <div className="flex justify-between font-semibold"><dt>Tổng cộng</dt><dd>{formatPrice(order.total)}</dd></div>
          <div className="flex justify-between text-xs text-neutral-500"><dt>Phương thức</dt><dd>{PAYMENT_METHODS[order.payment_method] ?? order.payment_method}</dd></div>
        </dl>
      </section>

      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <StatusFields order={order} />
        <ContactFields values={contact} onChange={setContact} note={order.note} />
        <p className="text-xs text-neutral-500 sm:col-span-2">
          Chuyển sang &quot;Đã hủy&quot; sẽ hoàn lại tồn kho; mở lại đơn đã hủy sẽ trừ kho lại.
        </p>
        <div className="sm:col-span-2">
          <FormActions onCancel={onCancel} pending={pending} submitLabel="Lưu thay đổi" />
        </div>
      </form>
    </div>
  );
}

type Line = { key: number; variantId: string; quantity: number };

export function OrderCreateForm({
  variants,
  customers,
  pending,
  onSubmit,
  onCancel,
}: FormProps & { variants: AdminVariant[]; customers: CustomerOption[] }) {
  const [userId, setUserId] = useState("");
  const [contact, setContact] = useState<ContactValues>({
    recipient_name: "",
    phone: "",
    email: "",
    shipping_address: "",
  });
  const [lines, setLines] = useState<Line[]>([{ key: 1, variantId: "", quantity: 1 }]);

  const variantById = new Map(variants.map((v) => [v.id, v]));
  const subtotal = lines.reduce((sum, line) => {
    const variant = variantById.get(line.variantId);
    return variant ? sum + variant.price * line.quantity : sum;
  }, 0);
  const shippingFee = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  function selectCustomer(id: string) {
    setUserId(id);
    const customer = customers.find((c) => c.id === id);
    if (customer) {
      setContact((prev) => ({
        ...prev,
        recipient_name: customer.full_name,
        email: customer.email,
        phone: customer.phone ?? prev.phone,
      }));
    }
  }

  function updateLine(key: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  if (variants.length === 0) {
    return (
      <div className="flex flex-col gap-4 text-sm text-neutral-600">
        <p>
          Chưa có biến thể sản phẩm nào đang bán (cần có màu, size và tồn kho trong bảng{" "}
          <code className="rounded bg-[#f5f4ef] px-1">product_variants</code>) nên chưa thể tạo đơn.
        </p>
        <button type="button" onClick={onCancel} className={`${secondaryButtonClass} self-end`}>
          Đóng
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(lines.map(({ variantId, quantity }) => ({ variantId, quantity })))}
      />

      <Field label="Khách hàng có tài khoản" htmlFor="o-user" hint="Tùy chọn — chọn để tự điền thông tin." className="sm:col-span-2">
        <select id="o-user" name="user_id" value={userId} onChange={(e) => selectCustomer(e.target.value)} className={inputClass}>
          <option value="">Khách vãng lai (không liên kết tài khoản)</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name} — {c.email}
            </option>
          ))}
        </select>
      </Field>

      <fieldset className="flex flex-col gap-3 sm:col-span-2">
        <legend className="mb-1.5 text-sm font-medium">
          Sản phẩm<span className="ml-0.5 text-red-600">*</span>
        </legend>
        {lines.map((line, index) => {
          const variant = variantById.get(line.variantId);
          return (
            <div key={line.key} className="flex items-start gap-2">
              <div className="flex-1">
                <select
                  aria-label={`Sản phẩm dòng ${index + 1}`}
                  required
                  value={line.variantId}
                  onChange={(e) => updateLine(line.key, { variantId: e.target.value })}
                  className={inputClass}
                >
                  <option value="" disabled>Chọn sản phẩm / màu / size</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id} disabled={v.stock === 0}>
                      {v.product_name} — {v.color_name}/{v.size_name} · {formatPrice(v.price)} · còn {v.stock}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                aria-label={`Số lượng dòng ${index + 1}`}
                min={1}
                max={Math.max(1, Math.min(20, variant?.stock ?? 20))}
                required
                value={line.quantity}
                onChange={(e) => updateLine(line.key, { quantity: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
                className={`${inputClass} w-20`}
              />
              <button
                type="button"
                onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                disabled={lines.length === 1}
                className={`${iconButtonClass} mt-1 hover:bg-red-50 hover:text-red-600 disabled:opacity-40`}
                aria-label={`Xóa dòng ${index + 1}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setLines((prev) => [...prev, { key: Date.now(), variantId: "", quantity: 1 }])}
          className={`${secondaryButtonClass} h-9 self-start`}
        >
          <Plus size={15} />
          Thêm dòng
        </button>
        <dl className="space-y-1 rounded-lg bg-[#faf9f6] px-4 py-3 text-sm">
          <div className="flex justify-between"><dt className="text-neutral-500">Tạm tính</dt><dd>{formatPrice(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-500">Phí vận chuyển</dt><dd>{shippingFee > 0 ? formatPrice(shippingFee) : "Miễn phí"}</dd></div>
          <div className="flex justify-between font-semibold"><dt>Tổng cộng (dự kiến)</dt><dd>{formatPrice(subtotal + shippingFee)}</dd></div>
        </dl>
      </fieldset>

      <ContactFields values={contact} onChange={setContact} />

      <Field label="Phương thức thanh toán" htmlFor="o-method" required className="sm:col-span-2">
        <select id="o-method" name="payment_method" defaultValue="cod" className={inputClass}>
          {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </Field>
      <StatusFields />

      <div className="sm:col-span-2">
        <FormActions onCancel={onCancel} pending={pending} submitLabel="Tạo đơn hàng" />
      </div>
    </form>
  );
}
