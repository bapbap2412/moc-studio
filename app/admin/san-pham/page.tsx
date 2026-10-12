import Image from "next/image";
import { Plus, Package } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import pool from "@/lib/db";
import { formatPrice } from "@/lib/format";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  category_name: string;
  base_price: number;
  sale_price: number | null;
  status: string;
  is_featured: number;
  is_new: number;
  image_url: string | null;
  total_stock: number;
};

async function getProducts(): Promise<ProductRow[]> {
  try {
    const [rows] = await pool.query(
      `SELECT
        p.id, p.name, p.slug, p.base_price, p.sale_price, p.status,
        p.is_featured, p.is_new,
        c.name AS category_name,
        (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS image_url,
        (SELECT COALESCE(SUM(pv.stock_quantity), 0) FROM product_variants pv WHERE pv.product_id = p.id) AS total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC`,
    );
    return rows as ProductRow[];
  } catch (error) {
    console.error("Admin products error:", error);
    return [];
  }
}

export default async function AdminProductsPage() {
  const products = await getProducts();

  const totalStock = products.reduce((sum, p) => sum + p.total_stock, 0);
  const activeCount = products.filter((p) => p.status === "active").length;

  return (
    <AdminShell
      activeHref="/admin/san-pham"
      breadcrumb="Cửa hàng / Sản phẩm"
      title="Sản phẩm"
    >
      <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl">Quản lý sản phẩm</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {products.length} sản phẩm · {activeCount} đang bán · {totalStock} sản phẩm trong kho
          </p>
        </div>
        <a
          href="#"
          className="inline-flex h-11 items-center justify-center gap-2 bg-[#24241f] px-5 text-sm text-white transition hover:bg-neutral-700"
        >
          <Plus size={17} />
          Thêm sản phẩm
        </a>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e6de] bg-white">
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-[#faf9f6] text-xs text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Sản phẩm</th>
                  <th className="px-6 py-4 font-medium">Danh mục</th>
                  <th className="px-6 py-4 font-medium">Giá</th>
                  <th className="px-6 py-4 font-medium">Tồn kho</th>
                  <th className="px-6 py-4 font-medium">Trạng thái</th>
                  <th className="px-6 py-4 font-medium">Nhãn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeae2]">
                {products.map((p) => {
                  const price = p.sale_price ?? p.base_price;
                  const outOfStock = p.total_stock === 0;
                  return (
                    <tr key={p.id} className="hover:bg-[#fcfbf8]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-[#f5f4ef]">
                            {p.image_url && (
                              <Image
                                src={p.image_url}
                                alt={p.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-600">
                        {p.category_name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium">{formatPrice(price)}</span>
                        {p.sale_price && (
                          <span className="ml-2 text-xs text-neutral-400 line-through">
                            {formatPrice(p.base_price)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            outOfStock
                              ? "text-red-600 font-medium"
                              : p.total_stock <= 10
                                ? "text-amber-600 font-medium"
                                : "text-neutral-600"
                          }
                        >
                          {p.total_stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs ${
                            p.status === "active"
                              ? "bg-green-50 text-green-700"
                              : p.status === "draft"
                                ? "bg-neutral-100 text-neutral-600"
                                : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {p.status === "active"
                            ? "Đang bán"
                            : p.status === "draft"
                              ? "Bản nháp"
                              : "Lưu trữ"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5">
                          {p.is_new === 1 && (
                            <span className="inline-flex rounded-full bg-[#f5f4ef] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-600">
                              Mới
                            </span>
                          )}
                          {p.is_featured === 1 && (
                            <span className="inline-flex rounded-full bg-[#e9e4d8] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-700">
                              Nổi bật
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <Package size={32} className="text-neutral-300" />
            <p className="font-serif text-xl text-neutral-400">
              Chưa có sản phẩm nào
            </p>
            <p className="text-sm text-neutral-500">
              Thêm sản phẩm đầu tiên để bắt đầu bán hàng.
            </p>
          </div>
        )}
      </section>

      <footer className="py-8 text-center text-xs text-neutral-400">
        © 2026 MỘC Studio · Admin Dashboard
      </footer>
    </AdminShell>
  );
}
