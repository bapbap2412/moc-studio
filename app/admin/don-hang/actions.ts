"use server";

import { randomInt, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/format";
import {
  type ActionResult,
  EMAIL_REGEX,
  PHONE_REGEX,
  UNAUTHORIZED,
  dbErrorCode,
  isAdmin,
  readText,
} from "@/lib/admin-server";

const VALID_STATUSES = ["pending", "confirmed", "shipping", "completed", "cancelled"];
const VALID_PAYMENT_STATUSES = ["unpaid", "paid", "refunded"];
const VALID_PAYMENT_METHODS = ["cod", "bank_transfer", "ewallet"];
const MAX_QTY_PER_VARIANT = 20;
const MAX_LINES = 30;

class OrderError extends Error {}

type ContactInput = {
  recipientName: string;
  phone: string;
  email: string;
  shippingAddress: string;
  note: string | null;
  status: string;
  paymentStatus: string;
};

function parseContact(formData: FormData): { data: ContactInput } | { error: string } {
  const recipientName = readText(formData, "recipient_name");
  const phone = readText(formData, "phone");
  const email = readText(formData, "email").toLowerCase();
  const shippingAddress = readText(formData, "shipping_address");
  const note = readText(formData, "note");
  const status = readText(formData, "status");
  const paymentStatus = readText(formData, "payment_status");

  if (!recipientName || recipientName.length > 120) {
    return { error: "Tên người nhận là bắt buộc và tối đa 120 ký tự." };
  }
  if (!PHONE_REGEX.test(phone)) return { error: "Số điện thoại không hợp lệ." };
  if (!EMAIL_REGEX.test(email) || email.length > 255) {
    return { error: "Email không hợp lệ." };
  }
  if (!shippingAddress || shippingAddress.length > 500) {
    return { error: "Địa chỉ giao hàng là bắt buộc và tối đa 500 ký tự." };
  }
  if (note.length > 1000) return { error: "Ghi chú tối đa 1000 ký tự." };
  if (!VALID_STATUSES.includes(status)) return { error: "Trạng thái đơn không hợp lệ." };
  if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
    return { error: "Trạng thái thanh toán không hợp lệ." };
  }

  return {
    data: { recipientName, phone, email, shippingAddress, note: note || null, status, paymentStatus },
  };
}

function parseItems(raw: string): Map<string, number> | string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "Danh sách sản phẩm không hợp lệ.";
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return "Đơn hàng cần ít nhất 1 sản phẩm.";
  }
  if (parsed.length > MAX_LINES) return `Tối đa ${MAX_LINES} dòng sản phẩm.`;

  // Aggregate by variant so the quantity cap applies to the whole order, not per line.
  const quantities = new Map<string, number>();
  for (const line of parsed) {
    const variantId = typeof line?.variantId === "string" ? line.variantId : "";
    const quantity = Number(line?.quantity);
    if (!variantId) return "Vui lòng chọn sản phẩm cho mọi dòng.";
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return "Số lượng phải là số nguyên dương.";
    }
    quantities.set(variantId, (quantities.get(variantId) ?? 0) + quantity);
  }
  for (const quantity of quantities.values()) {
    if (quantity > MAX_QTY_PER_VARIANT) {
      return `Mỗi biến thể tối đa ${MAX_QTY_PER_VARIANT} sản phẩm trong một đơn.`;
    }
  }
  return quantities;
}

async function changeStock(conn: PoolConnection, orderId: string, direction: "restore" | "deduct") {
  const [items] = await conn.execute<RowDataPacket[]>(
    "SELECT variant_id, product_name, quantity FROM order_items WHERE order_id = ? AND variant_id IS NOT NULL",
    [orderId],
  );
  for (const item of items) {
    if (direction === "restore") {
      await conn.execute(
        "UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?",
        [item.quantity, item.variant_id],
      );
    } else {
      const [result] = await conn.execute<ResultSetHeader>(
        "UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?",
        [item.quantity, item.variant_id, item.quantity],
      );
      if (result.affectedRows === 0) {
        throw new OrderError(`"${item.product_name}" không đủ tồn kho để mở lại đơn.`);
      }
    }
  }
}

async function syncStockForStatusChange(
  conn: PoolConnection,
  orderId: string,
  oldStatus: string,
  newStatus: string,
) {
  if (oldStatus !== "cancelled" && newStatus === "cancelled") {
    await changeStock(conn, orderId, "restore");
  } else if (oldStatus === "cancelled" && newStatus !== "cancelled") {
    await changeStock(conn, orderId, "deduct");
  }
}

function generateOrderCode() {
  const now = new Date();
  const datePart = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `MOC${datePart}${randomInt(1000, 10000)}`;
}

function revalidateOrderPages() {
  revalidatePath("/admin/don-hang");
  revalidatePath("/admin/khach-hang");
  revalidatePath("/admin/san-pham");
  revalidatePath("/admin");
}

function handleError(error: unknown, fallback: string): ActionResult {
  if (error instanceof OrderError) return { ok: false, message: error.message };
  console.error(fallback, error);
  return { ok: false, message: fallback };
}

export async function createOrder(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  const contact = parseContact(formData);
  if ("error" in contact) return { ok: false, message: contact.error };
  const c = contact.data;

  const paymentMethod = readText(formData, "payment_method");
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    return { ok: false, message: "Phương thức thanh toán không hợp lệ." };
  }

  const quantities = parseItems(String(formData.get("items") ?? ""));
  if (typeof quantities === "string") return { ok: false, message: quantities };

  const userIdRaw = readText(formData, "user_id");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let userId: string | null = null;
    if (userIdRaw) {
      const [users] = await conn.execute<RowDataPacket[]>(
        "SELECT id FROM users WHERE id = ? AND role = 'customer' LIMIT 1",
        [userIdRaw],
      );
      if (users.length === 0) throw new OrderError("Khách hàng không tồn tại.");
      userId = userIdRaw;
    }

    // Prices and stock always come from the database, never from the client.
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
    if (variants.length !== variantIds.length) {
      throw new OrderError("Một số sản phẩm không còn tồn tại.");
    }

    let subtotal = 0;
    for (const v of variants) {
      const quantity = quantities.get(String(v.id)) ?? 0;
      if (v.status !== "active") {
        throw new OrderError(`"${v.product_name}" hiện không được bán.`);
      }
      if (Number(v.stock_quantity) < quantity) {
        throw new OrderError(
          `"${v.product_name}" (${v.color_name}/${v.size_name}) chỉ còn ${v.stock_quantity} sản phẩm.`,
        );
      }
      subtotal += Number(v.price) * quantity;
    }

    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotal + shippingFee;
    const orderId = randomUUID();

    let code = "";
    for (let attempt = 0; attempt < 5 && !code; attempt++) {
      const candidate = generateOrderCode();
      const [dup] = await conn.execute<RowDataPacket[]>(
        "SELECT id FROM orders WHERE code = ? LIMIT 1",
        [candidate],
      );
      if (dup.length === 0) code = candidate;
    }
    if (!code) throw new OrderError("Không thể tạo mã đơn hàng, vui lòng thử lại.");

    await conn.execute(
      `INSERT INTO orders
        (id, code, user_id, status, payment_method, payment_status, subtotal, shipping_fee,
         discount_amount, total, recipient_name, phone, email, shipping_address, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
      [orderId, code, userId, c.status, paymentMethod, c.paymentStatus, subtotal, shippingFee,
        total, c.recipientName, c.phone, c.email, c.shippingAddress, c.note],
    );

    for (const v of variants) {
      const quantity = quantities.get(String(v.id)) ?? 0;
      await conn.execute(
        `INSERT INTO order_items
          (order_id, variant_id, product_name, color_name, size_name, unit_price, quantity)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, v.id, v.product_name, v.color_name, v.size_name, Number(v.price), quantity],
      );
      if (c.status !== "cancelled") {
        await conn.execute(
          "UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?",
          [quantity, v.id],
        );
      }
    }

    await conn.commit();
    revalidateOrderPages();
    return { ok: true, message: `Đã tạo đơn hàng ${code}.` };
  } catch (error) {
    await conn.rollback();
    return handleError(error, "Không thể tạo đơn hàng. Vui lòng thử lại.");
  } finally {
    conn.release();
  }
}

export async function updateOrder(id: string, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  const contact = parseContact(formData);
  if ("error" in contact) return { ok: false, message: contact.error };
  const c = contact.data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute<RowDataPacket[]>(
      "SELECT code, status FROM orders WHERE id = ? FOR UPDATE",
      [id],
    );
    if (rows.length === 0) throw new OrderError("Đơn hàng không tồn tại hoặc đã bị xóa.");

    await syncStockForStatusChange(conn, id, String(rows[0].status), c.status);
    await conn.execute(
      `UPDATE orders SET
        recipient_name = ?, phone = ?, email = ?, shipping_address = ?, note = ?,
        status = ?, payment_status = ?
       WHERE id = ?`,
      [c.recipientName, c.phone, c.email, c.shippingAddress, c.note, c.status, c.paymentStatus, id],
    );

    await conn.commit();
    revalidateOrderPages();
    return { ok: true, message: `Đã cập nhật đơn hàng ${rows[0].code}.` };
  } catch (error) {
    await conn.rollback();
    return handleError(error, "Không thể cập nhật đơn hàng. Vui lòng thử lại.");
  } finally {
    conn.release();
  }
}

export async function updateOrderStatus(id: string, status: string): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!VALID_STATUSES.includes(status)) {
    return { ok: false, message: "Trạng thái đơn không hợp lệ." };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute<RowDataPacket[]>(
      "SELECT code, status FROM orders WHERE id = ? FOR UPDATE",
      [id],
    );
    if (rows.length === 0) throw new OrderError("Đơn hàng không tồn tại hoặc đã bị xóa.");

    await syncStockForStatusChange(conn, id, String(rows[0].status), status);
    await conn.execute("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

    await conn.commit();
    revalidateOrderPages();
    return { ok: true, message: `Đã đổi trạng thái đơn ${rows[0].code}.` };
  } catch (error) {
    await conn.rollback();
    return handleError(error, "Không thể đổi trạng thái đơn hàng.");
  } finally {
    conn.release();
  }
}

export async function deleteOrder(id: string): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute<RowDataPacket[]>(
      "SELECT code, status FROM orders WHERE id = ? FOR UPDATE",
      [id],
    );
    if (rows.length === 0) throw new OrderError("Đơn hàng không tồn tại hoặc đã bị xóa.");

    // Goods that were never shipped go back to stock; shipped/completed goods do not.
    if (rows[0].status === "pending" || rows[0].status === "confirmed") {
      await changeStock(conn, id, "restore");
    }
    await conn.execute("DELETE FROM order_items WHERE order_id = ?", [id]);
    await conn.execute("DELETE FROM orders WHERE id = ?", [id]);

    await conn.commit();
    revalidateOrderPages();
    return { ok: true, message: `Đã xóa đơn hàng ${rows[0].code}.` };
  } catch (error) {
    await conn.rollback();
    if (dbErrorCode(error) === "ER_ROW_IS_REFERENCED_2") {
      return { ok: false, message: "Đơn hàng đang được tham chiếu, không thể xóa." };
    }
    return handleError(error, "Không thể xóa đơn hàng. Vui lòng thử lại.");
  } finally {
    conn.release();
  }
}
