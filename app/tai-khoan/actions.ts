"use server";

import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2/promise";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { PHONE_REGEX } from "@/lib/admin-server";

export type ProfileActionState = { ok: boolean; message: string };

type UserPasswordRow = RowDataPacket & { password_hash: string };

export async function updateAccountProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await getSession();
  if (!session || session.role !== "customer") {
    return { ok: false, message: "Vui lòng đăng nhập bằng tài khoản khách hàng." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const province = String(formData.get("province") ?? "").trim();
  const ward = String(formData.get("ward") ?? "").trim();
  const street = String(formData.get("street") ?? "").trim();

  if (!fullName || fullName.length > 120) {
    return { ok: false, message: "Họ tên là bắt buộc và tối đa 120 ký tự." };
  }
  if (!PHONE_REGEX.test(phone)) {
    return { ok: false, message: "Số điện thoại không hợp lệ." };
  }

  const hasAddress = Boolean(province || ward || street);
  if (hasAddress && (!province || !ward || !street)) {
    return { ok: false, message: "Vui lòng nhập đủ tỉnh/thành phố, phường/xã và số nhà, tên đường." };
  }

  const changingPassword = Boolean(currentPassword || newPassword || confirmPassword);
  if (changingPassword) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return { ok: false, message: "Nhập đủ mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới." };
    }
    if (newPassword.length < 8 || Buffer.byteLength(newPassword, "utf8") > 72) {
      return { ok: false, message: "Mật khẩu mới cần ít nhất 8 ký tự và tối đa 72 byte." };
    }
    if (newPassword !== confirmPassword) {
      return { ok: false, message: "Xác nhận mật khẩu mới không khớp." };
    }
  }

  try {
    if (changingPassword) {
      const [rows] = await pool.execute<UserPasswordRow[]>(
        "SELECT password_hash FROM users WHERE id = ? AND role = 'customer' LIMIT 1",
        [session.userId],
      );
      const user = rows[0];
      if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
        return { ok: false, message: "Mật khẩu hiện tại không chính xác." };
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await pool.execute(
        "UPDATE users SET full_name = ?, phone = ?, password_hash = ? WHERE id = ? AND role = 'customer'",
        [fullName, phone, passwordHash, session.userId],
      );
    } else {
      await pool.execute(
        "UPDATE users SET full_name = ?, phone = ? WHERE id = ? AND role = 'customer'",
        [fullName, phone, session.userId],
      );
    }

    if (hasAddress) {
      const [addresses] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM addresses WHERE user_id = ? ORDER BY is_default DESC LIMIT 1",
        [session.userId],
      );
      const addressId = (addresses[0] as RowDataPacket & { id: string } | undefined)?.id;

      if (addressId) {
        await pool.execute(
          `UPDATE addresses
           SET recipient_name = ?, phone = ?, province = ?, district = NULL, ward = ?, street = ?, is_default = 1
           WHERE id = ? AND user_id = ?`,
          [fullName, phone, province, ward, street, addressId, session.userId],
        );
      } else {
        await pool.execute(
          `INSERT INTO addresses
           (user_id, recipient_name, phone, province, ward, street, is_default)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [session.userId, fullName, phone, province, ward, street],
        );
      }
    }

    revalidatePath("/tai-khoan");
    return { ok: true, message: "Thông tin tài khoản đã được cập nhật." };
  } catch (error) {
    console.error("Account profile update error:", error);
    return { ok: false, message: "Không thể cập nhật tài khoản lúc này. Vui lòng thử lại." };
  }
}
