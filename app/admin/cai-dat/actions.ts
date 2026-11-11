"use server";

import { revalidatePath } from "next/cache";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { recordAdminAudit } from "@/lib/admin-audit";
import { getSession } from "@/lib/session";
import { getCurrentAdminSession, type ActionResult, UNAUTHORIZED } from "@/lib/admin-server";

export async function setAdminActive(id: string, active: boolean): Promise<ActionResult> {
  const session = await getSession();
  if (!(await getCurrentAdminSession(session))) return UNAUTHORIZED;
  if (!session || !/^[0-9a-f-]{36}$/i.test(id)) {
    return { ok: false, message: "Tài khoản quản trị không hợp lệ." };
  }
  if (id === session.userId) {
    return { ok: false, message: "Bạn không thể tự khóa tài khoản đang sử dụng." };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [admins] = await conn.execute<RowDataPacket[]>(
      "SELECT id, is_active FROM users WHERE role = 'admin' FOR UPDATE",
    );
    const actor = admins.find((row) => String(row.id) === session.userId);
    if (!actor || Number(actor.is_active) !== 1) {
      await conn.rollback();
      return UNAUTHORIZED;
    }
    const target = admins.find((row) => String(row.id) === id);
    if (!target) {
      await conn.rollback();
      return { ok: false, message: "Không tìm thấy tài khoản quản trị." };
    }
    if (!active && Number(target.is_active) === 1 && admins.filter((row) => Number(row.is_active) === 1).length <= 1) {
      await conn.rollback();
      return { ok: false, message: "Không thể khóa quản trị viên hoạt động cuối cùng." };
    }

    await conn.execute(
      "UPDATE users SET is_active = ? WHERE id = ? AND role = 'admin'",
      [active ? 1 : 0, id],
    );
    await conn.commit();
    await recordAdminAudit(active ? "admin.unlock" : "admin.lock", "user", id);
    revalidatePath("/admin/cai-dat");
    return {
      ok: true,
      message: active ? "Đã mở khóa tài khoản quản trị." : "Đã khóa tài khoản quản trị.",
    };
  } catch (error) {
    await conn.rollback();
    console.error("Update admin account status error:", error);
    return { ok: false, message: "Không thể cập nhật quyền truy cập. Vui lòng thử lại." };
  } finally {
    conn.release();
  }
}
