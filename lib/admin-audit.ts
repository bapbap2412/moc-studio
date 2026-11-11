import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function recordAdminAudit(
  action: string,
  targetType: string,
  targetId?: string | number | null,
  details?: Record<string, unknown>,
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") return;
    await pool.execute(
      "INSERT INTO admin_audit_logs (admin_user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [session.userId, action.slice(0, 80), targetType.slice(0, 50), targetId == null ? null : String(targetId).slice(0, 100), details ? JSON.stringify(details).slice(0, 4000) : null],
    );
  } catch (error) {
    console.error("Admin audit log error:", error);
  }
}
