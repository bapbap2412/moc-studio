import type { RowDataPacket } from "mysql2/promise";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductsManager } from "@/components/admin/products-manager";
import pool from "@/lib/db";
import type { AdminCategory, AdminProduct } from "@/lib/admin-types";

async function getProducts(): Promise<AdminProduct[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        p.id, p.name, p.slug, p.category_id, p.description, p.base_price, p.sale_price,
        p.gender, p.status, p.is_featured, p.is_new,
        c.name AS category_name,
        (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_url,
        (SELECT COALESCE(SUM(pv.stock_quantity), 0) FROM product_variants pv WHERE pv.product_id = p.id) AS total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC`,
    );
    return rows.map((r) => ({
      id: String(r.id),
      name: r.name,
      slug: r.slug,
      category_id: r.category_id === null ? null : Number(r.category_id),
      category_name: r.category_name ?? null,
      description: r.description ?? null,
      base_price: Number(r.base_price),
      sale_price: r.sale_price === null ? null : Number(r.sale_price),
      gender: r.gender ?? "unisex",
      status: r.status,
      is_featured: Boolean(Number(r.is_featured)),
      is_new: Boolean(Number(r.is_new)),
      image_url: r.image_url ?? null,
      total_stock: Number(r.total_stock),
    }));
  } catch (error) {
    console.error("Admin products error:", error);
    return [];
  }
}

async function getCategories(): Promise<AdminCategory[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, name FROM categories ORDER BY sort_order, name",
    );
    return rows.map((r) => ({ id: Number(r.id), name: r.name }));
  } catch (error) {
    console.error("Admin categories error:", error);
    return [];
  }
}

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <AdminShell activeHref="/admin/san-pham" breadcrumb="Cửa hàng / Sản phẩm" title="Sản phẩm">
      <ProductsManager products={products} categories={categories} />
      <footer className="py-8 text-center text-xs text-neutral-400">
        © 2026 MỘC Studio · Admin Dashboard
      </footer>
    </AdminShell>
  );
}
