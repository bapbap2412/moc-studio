import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import {
  categories,
  getColor,
  getSize,
  products as sampleProducts,
  type Product,
  type ProductFilters,
  type ProductType,
} from "@/lib/data";
import { PRODUCT_TYPES } from "@/lib/product-types";

type ProductRow = RowDataPacket & {
  id: string | number;
  category_id: number;
  product_type: string;
  name: string;
  slug: string;
  description: string | null;
  material: string | null;
  care_instructions: string | null;
  base_price: number;
  sale_price: number | null;
  gender: Product["gender"];
  is_featured: number | boolean;
  is_new: number | boolean;
  image_url: string | null;
};

export async function getStoreProducts(): Promise<Product[]> {
  try {
    const [rows] = await pool.query<ProductRow[]>(
      `SELECT p.id, p.category_id, p.product_type, p.name, p.slug, p.description,
        p.material, p.care_instructions, p.base_price, p.sale_price, p.gender,
        p.is_featured, p.is_new,
        (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_url
       FROM products p
       WHERE p.status = 'active'
       ORDER BY p.created_at DESC`,
    );
    if (rows.length === 0) return [];

    const ids = rows.map((row) => String(row.id));
    const placeholders = ids.map(() => "?").join(", ");
    const [variantRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, product_id, color_id, size_id, sku, stock_quantity
       FROM product_variants
       WHERE product_id IN (${placeholders})
       ORDER BY id`,
      ids,
    );
    const variantsByProduct = new Map<string, Product["variants"]>();
    for (const row of variantRows) {
      const productId = String(row.product_id);
      const variants = variantsByProduct.get(productId) ?? [];
      variants.push({
        id: String(row.id),
        colorId: Number(row.color_id),
        sizeId: Number(row.size_id),
        sku: String(row.sku),
        stockQuantity: Number(row.stock_quantity),
      });
      variantsByProduct.set(productId, variants);
    }

    return rows.map((row) => {
      const variants = variantsByProduct.get(String(row.id)) ?? [];
      const validType = Object.prototype.hasOwnProperty.call(PRODUCT_TYPES, row.product_type)
        ? row.product_type as ProductType
        : "other";
      return {
        id: String(row.id),
        categoryId: Number(row.category_id),
        productType: validType,
        name: row.name,
        slug: row.slug,
        description: row.description ?? "",
        material: row.material ?? "",
        careInstructions: row.care_instructions ?? "",
        basePrice: Number(row.base_price),
        salePrice: row.sale_price === null ? null : Number(row.sale_price),
        gender: row.gender,
        isFeatured: Boolean(Number(row.is_featured)),
        isNew: Boolean(Number(row.is_new)),
        imageUrl: row.image_url ?? "/placeholder.svg",
        colorIds: [...new Set(variants.map((variant) => variant.colorId))],
        sizeIds: [...new Set(variants.map((variant) => variant.sizeId))],
        variants,
        rating: 0,
        reviewCount: 0,
      };
    });
  } catch (error) {
    console.error("Store products query error:", error);
    return sampleProducts;
  }
}

export async function getStoreProductBySlug(slug: string) {
  const allProducts = await getStoreProducts();
  return allProducts.find((product) => product.slug === slug);
}

export function filterStoreProducts(products: Product[], filters: ProductFilters) {
  const category = categories.find((item) => item.slug === filters.category);
  const query = filters.q?.trim().toLocaleLowerCase("vi");
  const result = products.filter((product) => {
    if (category && product.categoryId !== category.id) return false;
    if (filters.type && product.productType !== filters.type) return false;
    if (query && !product.name.toLocaleLowerCase("vi").includes(query)) return false;
    if (filters.maxPrice && (product.salePrice ?? product.basePrice) > filters.maxPrice) return false;
    if (filters.sizes?.length) {
      const availableSizes = product.sizeIds.map((id) => getSize(id)?.name);
      if (!filters.sizes.some((size) => availableSizes.includes(size))) return false;
    }
    if (filters.colors?.length) {
      const availableColors = product.colorIds.map((id) => getColor(id)?.name);
      if (!filters.colors.some((color) => availableColors.includes(color))) return false;
    }
    return true;
  });

  if (filters.sort === "price-asc") result.sort((a, b) => (a.salePrice ?? a.basePrice) - (b.salePrice ?? b.basePrice));
  if (filters.sort === "price-desc") result.sort((a, b) => (b.salePrice ?? b.basePrice) - (a.salePrice ?? a.basePrice));
  if (filters.sort === "newest") result.sort((a, b) => Number(b.isNew) - Number(a.isNew));
  return result;
}
