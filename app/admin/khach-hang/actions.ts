"use server";

import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import {
  type ActionResult,
  EMAIL_REGEX,
  PHONE_REGEX,
  UNAUTHORIZED,
  dbErrorCode,
  executeIfTableExists,
  isAdmin,
  readText,
} from "@/lib/admin-server";

type CustomerInput = {
  fullName: string;
  email: string;
  phone: string | null;
  password: string;
};

function parseCustomer(
  formData: FormData,
  passwordRequired: boolean,
): { data: CustomerInput } | { error: string } {
  const fullName = readText(formData, "full_name");
  const email = readText(formData, "email").toLowerCase();
  const phone = readText(formData, "phone");
  const password = String(formData.get("password") ?? "");

  if (!fullName || fullName.length > 120) {
    return { error: "Họ tên là bắt buộc và tối đa 120 ký tự." };
  }
  if (!EMAIL_REGEX.test(email) || email.length > 255) {
    return { error: "Email không hợp lệ." };
  }
  if (phone && !PHONE_REGEX.test(phone)) {
    return { error: "Số điện thoại không hợp lệ." };
  }
  if (passwordRequired || password) {
    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return { error: "Mật khẩu phải có ít nhất 8 ký tự và tối đa 72 byte." };
    }
  }

  return { data: { fullName, email, phone: phone || null, password } };
}

async function emailTaken(email: string, excludeId?: string) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
    [email, excludeId ?? ""],
  );
  return rows.length > 0;
}

function revalidateCustomerPages() {
  revalidatePath("/admin/khach-hang");
  revalidatePath("/admin");
}

export async function createCustomer(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  const parsed = parseCustomer(formData, true);
  if ("error" in parsed) return { ok: false, message: parsed.error };
  const c = parsed.data;

  try {
    if (await emailTaken(c.email)) {
      return { ok: false, message: "Email này đã được sử dụng." };
    }
    const passwordHash = await bcrypt.hash(c.password, 12);
    await pool.execute(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role)
       VALUES (?, ?, ?, ?, ?, 'customer')`,
      [randomUUID(), c.email, passwordHash, c.fullName, c.phone],
    );
    revalidateCustomerPages();
    return { ok: true, message: `Đã thêm khách hàng "${c.fullName}".` };
  } catch (error) {
    if (dbErrorCode(error) === "ER_DUP_ENTRY") {
      return { ok: false, message: "Email này đã được sử dụng." };
    }
    console.error("Create customer error:", error);
    return { ok: false, message: "Không thể thêm khách hàng. Vui lòng thử lại." };
  }
}

export async function updateCustomer(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  const parsed = parseCustomer(formData, false);
  if ("error" in parsed) return { ok: false, message: parsed.error };
  const c = parsed.data;

  try {
    if (await emailTaken(c.email, id)) {
      return { ok: false, message: "Email này đã được sử dụng." };
    }

    const [result] = c.password
      ? await pool.execute(
          `UPDATE users SET full_name = ?, email = ?, phone = ?, password_hash = ?
           WHERE id = ? AND role = 'customer'`,
          [c.fullName, c.email, c.phone, await bcrypt.hash(c.password, 12), id],
        )
      : await pool.execute(
          `UPDATE users SET full_name = ?, email = ?, phone = ?
           WHERE id = ? AND role = 'customer'`,
          [c.fullName, c.email, c.phone, id],
        );

    if ((result as { affectedRows: number }).affectedRows === 0) {
      return { ok: false, message: "Khách hàng không tồn tại hoặc đã bị xóa." };
    }

    revalidateCustomerPages();
    return { ok: true, message: `Đã cập nhật khách hàng "${c.fullName}".` };
  } catch (error) {
    if (dbErrorCode(error) === "ER_DUP_ENTRY") {
      return { ok: false, message: "Email này đã được sử dụng." };
    }
    console.error("Update customer error:", error);
    return { ok: false, message: "Không thể cập nhật khách hàng. Vui lòng thử lại." };
  }
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Orders are kept for accounting; they simply lose the link to the account.
    await conn.execute("UPDATE orders SET user_id = NULL WHERE user_id = ?", [id]);
    await executeIfTableExists(
      conn,
      "DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ?)",
      [id],
    );
    await executeIfTableExists(conn, "DELETE FROM carts WHERE user_id = ?", [id]);
    await executeIfTableExists(conn, "DELETE FROM addresses WHERE user_id = ?", [id]);
    await executeIfTableExists(conn, "DELETE FROM reviews WHERE user_id = ?", [id]);
    await executeIfTableExists(conn, "DELETE FROM wishlists WHERE user_id = ?", [id]);

    const [result] = await conn.execute(
      "DELETE FROM users WHERE id = ? AND role = 'customer'",
      [id],
    );
    if ((result as { affectedRows: number }).affectedRows === 0) {
      await conn.rollback();
      return { ok: false, message: "Khách hàng không tồn tại hoặc đã bị xóa." };
    }

    await conn.commit();
    revalidateCustomerPages();
    revalidatePath("/admin/don-hang");
    return { ok: true, message: "Đã xóa khách hàng. Các đơn hàng cũ vẫn được giữ lại." };
  } catch (error) {
    await conn.rollback();
    console.error("Delete customer error:", error);
    return { ok: false, message: "Không thể xóa khách hàng. Vui lòng thử lại." };
  } finally {
    conn.release();
  }
}
