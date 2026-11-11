"use server";

import { revalidatePath } from "next/cache";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { recordAdminAudit } from "@/lib/admin-audit";
import { dbErrorCode, isAdmin, readText, type ActionResult, UNAUTHORIZED } from "@/lib/admin-server";

type CouponInput = {
  code: string;
  discountType: "percent" | "fixed";
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: number;
};

function parseCoupon(formData: FormData): { data: CouponInput } | { error: string } {
  const code = readText(formData, "code").toUpperCase();
  const discountType = readText(formData, "discount_type");
  const value = Number(readText(formData, "value"));
  const minOrderAmount = Number(readText(formData, "min_order_amount"));
  const maxRaw = readText(formData, "max_discount");
  const usageRaw = readText(formData, "usage_limit");
  const startsRaw = readText(formData, "starts_at");
  const endsRaw = readText(formData, "ends_at");
  const isActive = formData.get("is_active") === "1" ? 1 : 0;

  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
    return { error: "Mã giảm giá cần có 3–30 ký tự A-Z, số, gạch ngang hoặc gạch dưới." };
  }
  if (discountType !== "percent" && discountType !== "fixed") {
    return { error: "Loại giảm giá không hợp lệ." };
  }
  if (!Number.isSafeInteger(value) || value < 1 || value > 1_000_000_000 || (discountType === "percent" && value > 100)) {
    return { error: discountType === "percent" ? "Phần trăm giảm phải từ 1 đến 100." : "Số tiền giảm không hợp lệ." };
  }
  if (!Number.isSafeInteger(minOrderAmount) || minOrderAmount < 0 || minOrderAmount > 1_000_000_000) {
    return { error: "Giá trị đơn tối thiểu không hợp lệ." };
  }

  const maxDiscount = maxRaw ? Number(maxRaw) : null;
  if (maxDiscount !== null && (!Number.isSafeInteger(maxDiscount) || maxDiscount < 1 || maxDiscount > 1_000_000_000)) {
    return { error: "Mức giảm tối đa không hợp lệ." };
  }
  if (discountType === "fixed" && maxDiscount !== null) {
    return { error: "Mức giảm tối đa chỉ áp dụng cho mã theo phần trăm." };
  }

  const usageLimit = usageRaw ? Number(usageRaw) : null;
  if (usageLimit !== null && (!Number.isSafeInteger(usageLimit) || usageLimit < 1 || usageLimit > 1_000_000_000)) {
    return { error: "Số lượt sử dụng tối đa không hợp lệ." };
  }

  const validDate = (value: string) => {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
    const [date, time] = value.split("T");
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    const parsed = new Date(year, month - 1, day, hour, minute);
    return parsed.getFullYear() === year && parsed.getMonth() === month - 1 &&
      parsed.getDate() === day && parsed.getHours() === hour && parsed.getMinutes() === minute;
  };
  if (!validDate(startsRaw) || !validDate(endsRaw)) return { error: "Thời gian áp dụng không hợp lệ." };
  const startsAt = startsRaw ? `${startsRaw.replace("T", " ")}:00` : null;
  const endsAt = endsRaw ? `${endsRaw.replace("T", " ")}:00` : null;
  if (startsAt && endsAt && endsAt < startsAt) return { error: "Thời điểm kết thúc phải sau thời điểm bắt đầu." };

  return { data: { code, discountType, value, minOrderAmount, maxDiscount, usageLimit, startsAt, endsAt, isActive } };
}

export async function saveCoupon(id: number | null, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (id !== null && (!Number.isSafeInteger(id) || id <= 0)) return { ok: false, message: "Mã giảm giá không hợp lệ." };
  const parsed = parseCoupon(formData);
  if ("error" in parsed) return { ok: false, message: parsed.error };
  const coupon = parsed.data;
  const values = [coupon.code, coupon.discountType, coupon.value, coupon.minOrderAmount, coupon.maxDiscount, coupon.usageLimit, coupon.startsAt, coupon.endsAt, coupon.isActive];

  try {
    if (id === null) {
      await pool.execute(
        `INSERT INTO coupons (code, discount_type, value, min_order_amount, max_discount, usage_limit, starts_at, ends_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values,
      );
    } else {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [rows] = await conn.execute<RowDataPacket[]>("SELECT used_count FROM coupons WHERE id = ? FOR UPDATE", [id]);
        if (!rows.length) {
          await conn.rollback();
          return { ok: false, message: "Không tìm thấy mã giảm giá." };
        }
        if (coupon.usageLimit !== null && coupon.usageLimit < Number(rows[0].used_count)) {
          await conn.rollback();
          return { ok: false, message: "Giới hạn lượt dùng không thể thấp hơn số lượt đã sử dụng." };
        }
        await conn.execute(
          `UPDATE coupons SET code=?, discount_type=?, value=?, min_order_amount=?, max_discount=?, usage_limit=?, starts_at=?, ends_at=?, is_active=?
           WHERE id=?`,
          [...values, id],
        );
        await conn.commit();
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }
    }
    revalidatePath("/admin/ma-giam-gia");
    await recordAdminAudit(id === null ? "coupon.create" : "coupon.update", "coupon", id, { code: coupon.code, active: Boolean(coupon.isActive) });
    return { ok: true, message: id === null ? "Đã tạo mã giảm giá." : "Đã cập nhật mã giảm giá." };
  } catch (error) {
    if (dbErrorCode(error) === "ER_DUP_ENTRY") return { ok: false, message: "Mã giảm giá này đã tồn tại." };
    console.error("Save coupon error:", error);
    return { ok: false, message: "Không thể lưu mã giảm giá. Vui lòng thử lại." };
  }
}

export async function setCouponActive(id: number, active: boolean): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!Number.isSafeInteger(id) || id <= 0 || typeof active !== "boolean") return { ok: false, message: "Mã giảm giá không hợp lệ." };
  const [result] = await pool.execute(
    "UPDATE coupons SET is_active = ? WHERE id = ?",
    [active ? 1 : 0, id],
  );
  if ((result as { affectedRows: number }).affectedRows === 0) return { ok: false, message: "Không tìm thấy mã giảm giá." };
  revalidatePath("/admin/ma-giam-gia");
  await recordAdminAudit(active ? "coupon.activate" : "coupon.deactivate", "coupon", id);
  return { ok: true, message: active ? "Đã bật mã giảm giá." : "Đã tắt mã giảm giá." };
}
