import type { RowDataPacket } from "mysql2/promise";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductsManager } from "@/components/admin/products-manager";
import pool from "@/lib/db";
import type { AdminCategory, AdminProduct, AdminProductVariant } from "@/lib/admin-types";

async function getProducts(): Promise<AdminProduct[]> {
  try {
    const [[rows], [variantRows]] = await Promise.all([
      pool.query<RowDataPacket[]>(
      `SELECT
        p.id, p.name, p.slug, p.category_id, p.product_type, p.description, p.base_price, p.sale_price,
        p.gender, p.status, p.is_featured, p.is_new,
        c.name AS category_name,
        (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_url,
        (SELECT COALESCE(SUM(pv.stock_quantity), 0) FROM product_variants pv WHERE pv.product_id = p.id) AS total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC`,
      ),
      pool.query<RowDataPacket[]>(
        `SELECT pv.id, pv.product_id, pv.color_id, c.name AS color_name,
          pv.size_id, s.name AS size_name, pv.stock_quantity
         FROM product_variants pv
         JOIN colors c ON c.id = pv.color_id
         JOIN sizes s ON s.id = pv.size_id
         ORDER BY pv.id`,
      ),
    ]);
    const variantsByProduct = new Map<string, AdminProductVariant[]>();
    for (const row of variantRows) {
      const productId = String(row.product_id);
      const variants = variantsByProduct.get(productId) ?? [];
      variants.push({
        id: String(row.id),
        color_id: Number(row.color_id),
        color_name: String(row.color_name),
        size_id: Number(row.size_id),
        size_name: String(row.size_name),
        stock_quantity: Number(row.stock_quantity),
      });
      variantsByProduct.set(productId, variants);
    }
    return rows.map((r) => ({
      id: String(r.id),
      name: r.name,
      slug: r.slug,
      category_id: r.category_id === null ? null : Number(r.category_id),
      category_name: r.category_name ?? null,
      product_type: r.product_type ?? "other",
      description: r.description ?? null,
      base_price: Number(r.base_price),
      sale_price: r.sale_price === null ? null : Number(r.sale_price),
      gender: r.gender ?? "unisex",
      status: r.status,
      is_featured: Boolean(Number(r.is_featured)),
      is_new: Boolean(Number(r.is_new)),
      image_url: r.image_url ?? null,
      total_stock: Number(r.total_stock),
      variants: variantsByProduct.get(String(r.id)) ?? [],
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
