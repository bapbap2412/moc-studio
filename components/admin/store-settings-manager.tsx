"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { saveStoreSettings } from "@/app/admin/cai-dat/settings-actions";
import { Field, FormActions, inputClass, textareaClass } from "@/components/admin/admin-ui";
import type { StoreSettings } from "@/lib/store-settings";

export function StoreSettingsManager({ settings }: { settings: StoreSettings }) {
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveStoreSettings(formData);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <section className="mt-6 rounded-xl border border-[#e8e5dc] bg-white p-5 md:p-6">
      <h2 className="font-medium">Thông tin và chính sách cửa hàng</h2>
      <p className="mt-1 text-sm text-neutral-500">Các thay đổi về vận chuyển được dùng khi tính tiền giỏ hàng và tạo đơn mới.</p>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Mô tả ngắn" htmlFor="store-tagline" className="sm:col-span-2">
          <input id="store-tagline" name="tagline" maxLength={255} required defaultValue={settings.tagline} className={inputClass} />
        </Field>
        <Field label="Hotline" htmlFor="store-hotline" required>
          <input id="store-hotline" name="hotline" maxLength={30} required defaultValue={settings.hotline} className={inputClass} />
        </Field>
        <Field label="Địa chỉ cửa hàng" htmlFor="store-address" required>
          <input id="store-address" name="store_address" maxLength={255} required defaultValue={settings.storeAddress} className={inputClass} />
        </Field>
        <Field label="Phí giao hàng (₫)" htmlFor="store-shipping-fee" required>
          <input id="store-shipping-fee" name="shipping_fee" type="number" min={0} max={1_000_000_000} required defaultValue={settings.shippingFee} className={inputClass} />
        </Field>
        <Field label="Ngưỡng miễn phí giao hàng (₫)" htmlFor="store-free-shipping" required>
          <input id="store-free-shipping" name="free_shipping_threshold" type="number" min={1} max={1_000_000_000} required defaultValue={settings.freeShippingThreshold} className={inputClass} />
        </Field>
        <Field label="Số ngày đổi trả" htmlFor="store-return-days" required>
          <input id="store-return-days" name="return_days" type="number" min={0} max={365} required defaultValue={settings.returnDays} className={inputClass} />
        </Field>
        <Field label="Nội dung chính sách đổi trả" htmlFor="store-return-policy" className="sm:col-span-2">
          <textarea id="store-return-policy" name="return_policy" maxLength={2000} required defaultValue={settings.returnPolicy} className={textareaClass} />
        </Field>
        <div className="sm:col-span-2">
          <FormActions onCancel={() => window.location.reload()} pending={pending} submitLabel="Lưu cài đặt" />
        </div>
      </form>
    </section>
  );
}
