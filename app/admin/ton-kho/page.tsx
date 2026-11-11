import type { RowDataPacket } from "mysql2/promise";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { InventoryManager, type InventoryMovement, type LowStockVariant } from "@/components/admin/inventory-manager";
import pool from "@/lib/db";

const PAGE_SIZE = 25;
const LOW_STOCK_LIMIT = 10;

export default async function AdminInventoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: rawPage } = await searchParams;
  const [lowRows, countRows] = await Promise.all([
    pool.query<RowDataPacket[]>(
      `SELECT pv.id, pv.sku, pv.stock_quantity, p.name AS product_name, c.name AS color_name, s.name AS size_name
       FROM product_variants pv JOIN products p ON p.id=pv.product_id JOIN colors c ON c.id=pv.color_id JOIN sizes s ON s.id=pv.size_id
       WHERE pv.stock_quantity <= ? AND p.status <> 'archived' ORDER BY pv.stock_quantity, p.name, c.name, s.sort_order`, [LOW_STOCK_LIMIT],
    ),
    pool.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM inventory_movements"),
  ]);
  const total = Number(countRows[0][0]?.total ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(rawPage) || 1), pageCount);
  const [movementRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, sku_snapshot, product_name, color_name, size_name, stock_before, stock_after, reason,
      DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') AS created_at
     FROM inventory_movements ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`, [PAGE_SIZE, (page - 1) * PAGE_SIZE],
  );
  const lowStock: LowStockVariant[] = lowRows[0].map((row) => ({ id: String(row.id), sku: String(row.sku), product_name: String(row.product_name), color_name: String(row.color_name), size_name: String(row.size_name), stock_quantity: Number(row.stock_quantity) }));
  const movements: InventoryMovement[] = movementRows.map((row) => ({ id: Number(row.id), sku: String(row.sku_snapshot), product_name: String(row.product_name), color_name: String(row.color_name), size_name: String(row.size_name), stock_before: Number(row.stock_before), stock_after: Number(row.stock_after), reason: String(row.reason), created_at: String(row.created_at) }));
  return <AdminShell activeHref="/admin/ton-kho" breadcrumb="Cửa hàng / Tồn kho" title="Tồn kho">
    <InventoryManager lowStock={lowStock} movements={movements} total={total} page={page} pageCount={pageCount} />
    <footer className="py-8 text-center text-xs text-neutral-400">© 2026 MỘC Studio · Admin Dashboard</footer>
  </AdminShell>;
}
