import type { RowDataPacket } from "mysql2/promise";
import { AdminShell } from "@/components/admin/admin-shell";
import { CatalogManager } from "@/components/admin/catalog-manager";
import pool from "@/lib/db";

export default async function AdminCatalogPage() {
  const [[categories], [colors], [sizes]] = await Promise.all([
    pool.query<RowDataPacket[]>("SELECT id, name, slug, description, image_url, sort_order, parent_id FROM categories ORDER BY sort_order, name"),
    pool.query<RowDataPacket[]>("SELECT id, name, hex_code FROM colors ORDER BY name"),
    pool.query<RowDataPacket[]>("SELECT id, name, sort_order FROM sizes ORDER BY sort_order, name"),
  ]);
  return <AdminShell activeHref="/admin/danh-muc" breadcrumb="Cửa hàng / Danh mục & thuộc tính" title="Danh mục">
    <CatalogManager
      categories={categories.map((row) => ({ id: Number(row.id), name: String(row.name), slug: String(row.slug), description: row.description ? String(row.description) : null, image_url: row.image_url ? String(row.image_url) : null, sort_order: Number(row.sort_order), parent_id: row.parent_id === null ? null : Number(row.parent_id) }))}
      colors={colors.map((row) => ({ id: Number(row.id), name: String(row.name), hex_code: String(row.hex_code) }))}
      sizes={sizes.map((row) => ({ id: Number(row.id), name: String(row.name), sort_order: Number(row.sort_order) }))}
    />
  </AdminShell>;
}
