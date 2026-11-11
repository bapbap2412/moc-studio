import type { PoolConnection } from "mysql2/promise";

export async function writeInventoryMovement(conn: PoolConnection, variantId: string, before: number, after: number, reason: string, actorId: string | null = null) {
  if (before === after) return;
  await conn.execute(
    `INSERT INTO inventory_movements (variant_id, sku_snapshot, product_name, color_name, size_name, stock_before, stock_after, reason, admin_user_id)
     SELECT pv.id, pv.sku, p.name, c.name, s.name, ?, ?, ?, ?
     FROM product_variants pv JOIN products p ON p.id=pv.product_id
     JOIN colors c ON c.id=pv.color_id JOIN sizes s ON s.id=pv.size_id
     WHERE pv.id=?`,
    [before, after, reason.slice(0, 255), actorId, variantId],
  );
}
