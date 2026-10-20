"use server";

import { randomInt, randomUUID } from "node:crypto";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { PHONE_REGEX } from "@/lib/admin-server";
import { calculateOrderAmounts, hasStockForOrder } from "@/lib/critical-rules";
import { isMomoConfigured } from "@/lib/momo";

const MAX_LINES = 30;
const MAX_QTY_PER_VARIANT = 20;

type CheckoutResult = { ok: true; code: string } | { ok: false; message: string };
type CouponResult = { ok: true; code: string; discount: number } | { ok: false; message: string };

type CouponRow = RowDataPacket & {
  id: number;
  code: string;
  discount_type: string;
  value: number;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
};

function getCouponDiscount(coupon: CouponRow, subtotal: number) {
  if (coupon.discount_type === "percent") {
    const amount = Math.floor(subtotal * Number(coupon.value) / 100);
    return Math.min(amount, coupon.max_discount === null ? amount : Number(coupon.max_discount), subtotal);
  }
  if (coupon.discount_type === "fixed") return Math.min(Number(coupon.value), subtotal);
  return 0;
}

async function findValidCoupon(query: (sql: string, values: unknown[]) => Promise<[RowDataPacket[], unknown]>, code: string, subtotal: number, lock = false) {
  const [rows] = await query(
    `SELECT id, code, discount_type, value, min_order_amount, max_discount,
      usage_limit, used_count
     FROM coupons
     WHERE code = ? AND is_active = 1
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (ends_at IS NULL OR ends_at >= NOW())
       AND (usage_limit IS NULL OR used_count < usage_limit)
     LIMIT 1${lock ? " FOR UPDATE" : ""}`,
    [code],
  );
  const coupon = rows[0] as CouponRow | undefined;
  if (!coupon) return { coupon: null, message: "Mã giảm giá không hợp lệ, đã hết lượt hoặc hết hạn." };
  if (subtotal < Number(coupon.min_order_amount)) {
    return { coupon: null, message: `Đơn hàng cần đạt ${Number(coupon.min_order_amount).toLocaleString("vi-VN")}đ để dùng mã này.` };
  }
  const discount = getCouponDiscount(coupon, subtotal);
  if (discount <= 0) return { coupon: null, message: "Mã giảm giá không áp dụng được cho đơn hàng này." };
  return { coupon, discount };
}

export async function previewCoupon(codeInput: string, subtotal: number): Promise<CouponResult> {
  const session = await getSession();
  if (!session || session.role !== "customer") return { ok: false, message: "Vui lòng đăng nhập để dùng mã giảm giá." };
  const code = codeInput.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,30}$/.test(code) || !Number.isSafeInteger(subtotal) || subtotal <= 0) {
    return { ok: false, message: "Vui lòng nhập mã giảm giá hợp lệ." };
  }
  const result = await findValidCoupon((sql, values) => pool.query<RowDataPacket[]>(sql, values), code, subtotal);
  if (!result.coupon || !("discount" in result)) return { ok: false, message: result.message ?? "Mã giảm giá không hợp lệ." };
  return { ok: true, code, discount: result.discount };
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function generateOrderCode() {
  const now = new Date();
  const datePart = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `MOC${datePart}${randomInt(1000, 10000)}`;
}

export async function submitCustomerOrder(formData: FormData): Promise<CheckoutResult> {
  const session = await getSession();
  if (!session || session.role !== "customer") {
    return { ok: false, message: "Vui lòng đăng nhập tài khoản khách hàng để đặt đơn." };
  }

  const recipientName = readText(formData, "fullName");
  const phone = readText(formData, "phone");
  const province = readText(formData, "province");
  const ward = readText(formData, "ward");
  const street = readText(formData, "street");
  const note = readText(formData, "note");
  const paymentValue = readText(formData, "payment");
  const paymentMethod = paymentValue === "e_wallet" ? "ewallet" : paymentValue;
  const couponCode = readText(formData, "couponCode").toUpperCase();

  if (!recipientName || recipientName.length > 120) return { ok: false, message: "Vui lòng nhập họ tên người nhận." };
  if (!PHONE_REGEX.test(phone)) return { ok: false, message: "Số điện thoại không hợp lệ." };
  if (!province || !ward || !street) return { ok: false, message: "Vui lòng nhập đầy đủ địa chỉ giao hàng." };
  if (note.length > 1000) return { ok: false, message: "Ghi chú tối đa 1000 ký tự." };
  if (!["cod", "bank_transfer", "ewallet"].includes(paymentMethod)) {
    return { ok: false, message: "Phương thức thanh toán không hợp lệ." };
  }
  if (paymentMethod === "ewallet" && !isMomoConfigured()) {
    return { ok: false, message: "Thanh toán MoMo hiện chưa được cấu hình cho cửa hàng." };
  }

  let rawItems: unknown;
  try {
    rawItems = JSON.parse(readText(formData, "items"));
  } catch {
    return { ok: false, message: "Giỏ hàng không hợp lệ. Vui lòng tải lại trang." };
  }
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > MAX_LINES) {
    return { ok: false, message: "Giỏ hàng trống hoặc có quá nhiều sản phẩm." };
  }

  const quantities = new Map<string, number>();
  for (const item of rawItems) {
    const variantId = typeof item?.variantId === "string" ? item.variantId : "";
    const quantity = Number(item?.quantity);
    if (!variantId || !Number.isInteger(quantity) || quantity < 1) {
      return { ok: false, message: "Thông tin sản phẩm trong giỏ không hợp lệ." };
    }
    quantities.set(variantId, (quantities.get(variantId) ?? 0) + quantity);
  }
  if ([...quantities.values()].some((quantity) => quantity > MAX_QTY_PER_VARIANT)) {
    return { ok: false, message: `Mỗi biến thể chỉ được đặt tối đa ${MAX_QTY_PER_VARIANT} sản phẩm.` };
  }

  const conn: PoolConnection = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const variantIds = [...quantities.keys()];
    const [variants] = await conn.query<RowDataPacket[]>(
      `SELECT pv.id, pv.stock_quantity, p.name AS product_name, p.status,
        COALESCE(c.name, '—') AS color_name, COALESCE(s.name, '—') AS size_name,
        COALESCE(pv.price_override, p.sale_price, p.base_price) AS price
       FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       LEFT JOIN colors c ON c.id = pv.color_id
       LEFT JOIN sizes s ON s.id = pv.size_id
       WHERE pv.id IN (?)
       FOR UPDATE`,
      [variantIds],
    );
    if (variants.length !== variantIds.length) throw new Error("Một số sản phẩm không còn tồn tại.");

    let subtotal = 0;
    for (const variant of variants) {
      const quantity = quantities.get(String(variant.id)) ?? 0;
      if (variant.status !== "active") throw new Error(`“${variant.product_name}” hiện không được bán.`);
      if (!hasStockForOrder(Number(variant.stock_quantity), quantity)) {
        throw new Error(`“${variant.product_name}” chỉ còn ${variant.stock_quantity} sản phẩm trong kho.`);
      }
      subtotal += Number(variant.price) * quantity;
    }

    let couponId: number | null = null;
    let discountAmount = 0;
    if (couponCode) {
      const couponResult = await findValidCoupon((sql, values) => conn.query<RowDataPacket[]>(sql, values), couponCode, subtotal, true);
      if (!couponResult.coupon || !("discount" in couponResult)) throw new Error(couponResult.message ?? "Mã giảm giá không hợp lệ.");
      couponId = Number(couponResult.coupon.id);
      discountAmount = couponResult.discount;
    }
    const { shippingFee, discountAmount: finalDiscountAmount, total } = calculateOrderAmounts(subtotal, discountAmount);
    let code = "";
    for (let attempt = 0; attempt < 5 && !code; attempt++) {
      const candidate = generateOrderCode();
      const [matches] = await conn.execute<RowDataPacket[]>("SELECT id FROM orders WHERE code = ? LIMIT 1", [candidate]);
      if (matches.length === 0) code = candidate;
    }
    if (!code) throw new Error("Không tạo được mã đơn hàng. Vui lòng thử lại.");

    const orderId = randomUUID();
    const shippingAddress = `${street}, ${ward}, ${province}`;
    await conn.execute(
      `INSERT INTO orders
        (id, code, user_id, status, payment_method, payment_status, subtotal, shipping_fee,
         discount_amount, total, coupon_id, recipient_name, phone, email, shipping_address, note)
       VALUES (?, ?, ?, 'pending', ?, 'unpaid', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, code, session.userId, paymentMethod, subtotal, shippingFee, finalDiscountAmount, total, couponId, recipientName, phone, session.email, shippingAddress, note || null],
    );
    if (couponId !== null) {
      await conn.execute("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?", [couponId]);
    }

    for (const variant of variants) {
      const quantity = quantities.get(String(variant.id)) ?? 0;
      await conn.execute(
        `INSERT INTO order_items
          (order_id, variant_id, product_name, color_name, size_name, unit_price, quantity)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, variant.id, variant.product_name, variant.color_name, variant.size_name, Number(variant.price), quantity],
      );
      const [result] = await conn.execute<ResultSetHeader>(
        "UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?",
        [quantity, variant.id, quantity],
      );
      if (result.affectedRows === 0) {
        throw new Error(`“${variant.product_name}” vừa hết hàng. Vui lòng kiểm tra giỏ hàng.`);
      }
    }

    await conn.commit();
    revalidatePath("/tai-khoan");
    revalidatePath("/gio-hang");
    revalidatePath("/admin/don-hang");
    revalidatePath("/admin/san-pham");
    revalidatePath("/admin");
    return { ok: true, code };
  } catch (error) {
    await conn.rollback();
    console.error("Customer checkout error:", error);
    return { ok: false, message: error instanceof Error ? error.message : "Không thể đặt hàng. Vui lòng thử lại." };
  } finally {
    conn.release();
  }
}
