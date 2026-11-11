"use server";

import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { recordAdminAudit } from "@/lib/admin-audit";
import { isAdmin, readText, type ActionResult, UNAUTHORIZED } from "@/lib/admin-server";

export async function saveStoreSettings(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  const settings = {
    tagline: readText(formData, "tagline"),
    hotline: readText(formData, "hotline"),
    storeAddress: readText(formData, "store_address"),
    shippingFee: Number(readText(formData, "shipping_fee")),
    freeShippingThreshold: Number(readText(formData, "free_shipping_threshold")),
    returnDays: Number(readText(formData, "return_days")),
    returnPolicy: readText(formData, "return_policy"),
  };
  if (!settings.tagline || settings.tagline.length > 255) return { ok: false, message: "Mô tả cửa hàng là bắt buộc và tối đa 255 ký tự." };
  if (!/^[0-9+ ()-]{8,30}$/.test(settings.hotline)) return { ok: false, message: "Số hotline không hợp lệ." };
  if (!settings.storeAddress || settings.storeAddress.length > 255) return { ok: false, message: "Địa chỉ cửa hàng là bắt buộc và tối đa 255 ký tự." };
  if (!Number.isSafeInteger(settings.shippingFee) || settings.shippingFee < 0 || settings.shippingFee > 1_000_000_000) return { ok: false, message: "Phí giao hàng không hợp lệ." };
  if (!Number.isSafeInteger(settings.freeShippingThreshold) || settings.freeShippingThreshold < 1 || settings.freeShippingThreshold > 1_000_000_000) return { ok: false, message: "Ngưỡng miễn phí giao hàng không hợp lệ." };
  if (!Number.isSafeInteger(settings.returnDays) || settings.returnDays < 0 || settings.returnDays > 365) return { ok: false, message: "Số ngày đổi trả phải từ 0 đến 365." };
  if (!settings.returnPolicy || settings.returnPolicy.length > 2000) return { ok: false, message: "Chính sách đổi trả là bắt buộc và tối đa 2000 ký tự." };

  try {
    await pool.execute(
      `INSERT INTO store_settings (id, tagline, hotline, store_address, shipping_fee, free_shipping_threshold, return_days, return_policy)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE tagline=VALUES(tagline), hotline=VALUES(hotline), store_address=VALUES(store_address),
         shipping_fee=VALUES(shipping_fee), free_shipping_threshold=VALUES(free_shipping_threshold), return_days=VALUES(return_days), return_policy=VALUES(return_policy)`,
      [settings.tagline, settings.hotline, settings.storeAddress, settings.shippingFee, settings.freeShippingThreshold, settings.returnDays, settings.returnPolicy],
    );
  } catch (error) {
    console.error("Save store settings error:", error);
    return { ok: false, message: "Không lưu được cài đặt cửa hàng. Vui lòng thử lại." };
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin/cai-dat");
  revalidatePath("/van-chuyen-thanh-toan");
  await recordAdminAudit("store_settings.update", "store_settings", 1, { shippingFee: settings.shippingFee, freeShippingThreshold: settings.freeShippingThreshold, returnDays: settings.returnDays });
  return { ok: true, message: "Đã lưu cài đặt cửa hàng." };
}
