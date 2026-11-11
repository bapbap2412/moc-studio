import type { RowDataPacket } from "mysql2/promise";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductsManager } from "@/components/admin/products-manager";
import pool from "@/lib/db";
import type { AdminCategory, AdminProduct, AdminProductVariant } from "@/lib/admin-types";
import type { Color, Size } from "@/lib/data";

const PAGE_SIZE = 25;

async function getProducts(search: string, requestedPage: number): Promise<{ products: AdminProduct[]; total: number; page: number }> {
  try {
    const where = search ? "WHERE p.name LIKE ?" : "";
    const params = search ? [`%${search}%`] : [];
    const [counts] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM products p ${where}`,
      params,
    );
    const total = Number(counts[0]?.total ?? 0);
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(Math.max(1, requestedPage), pageCount);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        p.id, p.name, p.slug, p.category_id, p.product_type, p.description, p.base_price, p.sale_price,
        p.gender, p.status, p.is_featured, p.is_new,
        c.name AS category_name,
        (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_url,
        (SELECT COALESCE(SUM(pv.stock_quantity), 0) FROM product_variants pv WHERE pv.product_id = p.id) AS total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, PAGE_SIZE, (page - 1) * PAGE_SIZE],
    );
    const ids = rows.map((row) => String(row.id));
    let variantRows: RowDataPacket[] = [];
    if (ids.length) {
      [variantRows] = await pool.query<RowDataPacket[]>(
        `SELECT pv.id, pv.product_id, pv.color_id, c.name AS color_name,
          pv.size_id, s.name AS size_name, pv.stock_quantity
         FROM product_variants pv
         JOIN colors c ON c.id = pv.color_id
         JOIN sizes s ON s.id = pv.size_id
         WHERE pv.product_id IN (?)
         ORDER BY pv.id`,
        [ids],
      );
    }
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
    const products = rows.map((r) => ({
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
    return { products, total, page };
  } catch (error) {
    console.error("Admin products error:", error);
    return { products: [], total: 0, page: 1 };
  }
}

async function getProductSummary() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total,
      SUM(status='active') AS active_count,
      COALESCE(SUM((SELECT COALESCE(SUM(pv.stock_quantity),0) FROM product_variants pv WHERE pv.product_id=p.id)),0) AS stock_total
     FROM products p`,
  );
  const row = rows[0] ?? {};
  return { total: Number(row.total ?? 0), activeCount: Number(row.active_count ?? 0), totalStock: Number(row.stock_total ?? 0) };
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

async function getColors(): Promise<Color[]> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT id, name, hex_code FROM colors ORDER BY name");
  return rows.map((row) => ({ id: Number(row.id), name: String(row.name), hexCode: String(row.hex_code) }));
}

async function getSizes(): Promise<Size[]> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT id, name, sort_order FROM sizes ORDER BY sort_order, name");
  return rows.map((row) => ({ id: Number(row.id), name: String(row.name), sortOrder: Number(row.sort_order) }));
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const [paginatedProducts, categories, colors, sizes, summary] = await Promise.all([
    getProducts(typeof q === "string" ? q.trim().slice(0, 100) : "", Number(page) || 1),
    getCategories(),
    getColors(),
    getSizes(),
    getProductSummary(),
  ]);

  return (
    <AdminShell activeHref="/admin/san-pham" breadcrumb="Cửa hàng / Sản phẩm" title="Sản phẩm">
      <ProductsManager
        products={paginatedProducts.products}
        categories={categories}
        colors={colors}
        sizes={sizes}
        totalProducts={paginatedProducts.total}
        currentPage={paginatedProducts.page}
        pageSize={PAGE_SIZE}
        initialQuery={typeof q === "string" ? q : ""}
        summary={summary}
      />
      <footer className="py-8 text-center text-xs text-neutral-400">
        © 2026 MỘC Studio · Admin Dashboard
      </footer>
    </AdminShell>
  );
}
