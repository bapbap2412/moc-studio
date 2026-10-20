import Link from "next/link";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2/promise";
import { ProductCard } from "@/components/product-card";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import { getStoreProducts } from "@/lib/store-products";

export const metadata = { title: "Sản phẩm yêu thích" };

export default async function WishlistPage() {
  const session = await getSession();
  if (!session || session.role !== "customer") redirect("/dang-nhap?returnTo=%2Fwishlist");

  const [rows] = await pool.execute<RowDataPacket[]>("SELECT product_id FROM wishlists WHERE user_id = ?", [session.userId]);
  const ids = new Set(rows.map((row) => String(row.product_id)));
  const products = (await getStoreProducts()).filter((product) => ids.has(product.id));

  return (
    <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-12 md:px-8">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Tài khoản</p>
      <h1 className="mt-2 font-serif text-4xl">Sản phẩm yêu thích</h1>
      {products.length ? <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : (
        <div className="mt-8 border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">Danh sách yêu thích đang trống.</p>
          <Link href="/san-pham" className="mt-4 inline-block text-sm underline underline-offset-4">Khám phá sản phẩm</Link>
        </div>
      )}
    </main>
  );
}
