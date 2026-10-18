"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { PRODUCT_TYPES } from "@/lib/product-types";
import {
  type ActionResult,
  UNAUTHORIZED,
  dbErrorCode,
  executeIfTableExists,
  isAdmin,
  readText,
  slugify,
} from "@/lib/admin-server";

const VALID_GENDERS = ["women", "men", "unisex"];
const VALID_STATUSES = ["draft", "active", "archived"];
const VALID_PRODUCT_TYPES = Object.keys(PRODUCT_TYPES);

type ProductInput = {
  name: string;
  categoryId: number;
  productType: string;
  description: string | null;
  basePrice: number;
  salePrice: number | null;
  gender: string;
  status: string;
  isFeatured: number;
  isNew: number;
  imageUrl: string | null;
};

type VariantInput = {
  id?: string;
  colorId: number;
  sizeId: number;
  stockQuantity: number;
};

function parseVariants(formData: FormData): VariantInput[] | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(readText(formData, "variants_payload"));
  } catch {
    return { error: "Danh sách màu sắc, kích cỡ không hợp lệ." };
  }
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 100) {
    return { error: "Vui lòng chọn ít nhất một màu sắc và kích cỡ." };
  }

  const variants: VariantInput[] = [];
  const combinations = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") return { error: "Thông tin biến thể không hợp lệ." };
    const value = item as Record<string, unknown>;
    const colorId = Number(value.colorId);
    const sizeId = Number(value.sizeId);
    const stockQuantity = Number(value.stockQuantity);
    const id = typeof value.id === "string" ? value.id : undefined;
    const key = `${colorId}:${sizeId}`;
    if (!Number.isInteger(colorId) || colorId <= 0 || !Number.isInteger(sizeId) || sizeId <= 0) {
      return { error: "Màu sắc và kích cỡ của biến thể không hợp lệ." };
    }
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 1_000_000) {
      return { error: "Tồn kho mỗi biến thể phải là số nguyên từ 0 đến 1.000.000." };
    }
    if (combinations.has(key)) return { error: "Không thể tạo trùng tổ hợp màu sắc và kích cỡ." };
    combinations.add(key);
    variants.push({ id, colorId, sizeId, stockQuantity });
  }
  return variants;
}

async function insertVariant(
  conn: PoolConnection,
  productId: string,
  productName: string,
  variant: VariantInput,
) {
  const sku = `${slugify(productName).slice(0, 35)}-${variant.colorId}-${variant.sizeId}-${randomUUID().slice(0, 8)}`;
  await conn.execute(
    `INSERT INTO product_variants
      (id, product_id, color_id, size_id, sku, stock_quantity)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [randomUUID(), productId, variant.colorId, variant.sizeId, sku, variant.stockQuantity],
  );
}

async function saveVariants(
  conn: PoolConnection,
  productId: string,
  productName: string,
  variants: VariantInput[],
) {
  const [rows] = await conn.execute<RowDataPacket[]>(
    "SELECT id, color_id, size_id FROM product_variants WHERE product_id = ? FOR UPDATE",
    [productId],
  );
  const existingByCombination = new Map(
    rows.map((row) => [`${Number(row.color_id)}:${Number(row.size_id)}`, String(row.id)]),
  );
  const submittedIds = new Set(variants.flatMap((variant) => variant.id ? [variant.id] : []));
  const existingIds = new Set(rows.map((row) => String(row.id)));
  if (submittedIds.size !== (variants.filter((variant) => variant.id).length) ||
      [...existingIds].some((id) => !submittedIds.has(id))) {
    return { error: "Danh sách biến thể đã thay đổi. Vui lòng tải lại trang rồi thử lại." };
  }

  for (const variant of variants) {
    const key = `${variant.colorId}:${variant.sizeId}`;
    const existingId = existingByCombination.get(key);
    if (variant.id) {
      if (existingId !== variant.id) {
        return { error: "Biến thể không thuộc sản phẩm này. Vui lòng tải lại trang." };
      }
      await conn.execute(
        "UPDATE product_variants SET stock_quantity = ? WHERE id = ? AND product_id = ?",
        [variant.stockQuantity, variant.id, productId],
      );
    } else {
      if (existingId) return { error: "Tổ hợp màu sắc và kích cỡ đã tồn tại." };
      await insertVariant(conn, productId, productName, variant);
    }
  }
  return { ok: true as const };
}

function parseProduct(
  formData: FormData,
): { data: ProductInput } | { error: string } {
  const name = readText(formData, "name");
  const categoryId = Number(readText(formData, "category_id"));
  const productType = readText(formData, "product_type");
  const basePrice = Number(readText(formData, "base_price"));
  const saleRaw = readText(formData, "sale_price");
  const salePrice = saleRaw === "" ? null : Number(saleRaw);
  const gender = readText(formData, "gender");
  const status = readText(formData, "status");
  const description = readText(formData, "description");
  const imageUrl = readText(formData, "image_url");

  if (!name || name.length > 200) {
    return { error: "Tên sản phẩm là bắt buộc và tối đa 200 ký tự." };
  }
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return { error: "Vui lòng chọn danh mục." };
  }
  if (!VALID_PRODUCT_TYPES.includes(productType)) {
    return { error: "Loáº¡i sáº£n pháº©m khÃ´ng há»£p lá»‡." };
  }
  if (!Number.isInteger(basePrice) || basePrice <= 0 || basePrice > 1_000_000_000) {
    return { error: "Giá gốc phải là số nguyên dương (VND)." };
  }
  if (
    salePrice !== null &&
    (!Number.isInteger(salePrice) || salePrice <= 0 || salePrice >= basePrice)
  ) {
    return { error: "Giá khuyến mãi phải lớn hơn 0 và nhỏ hơn giá gốc." };
  }
  if (!VALID_GENDERS.includes(gender)) {
    return { error: "Giới tính không hợp lệ." };
  }
  if (!VALID_STATUSES.includes(status)) {
    return { error: "Trạng thái không hợp lệ." };
  }
  if (description.length > 5000) {
    return { error: "Mô tả tối đa 5000 ký tự." };
  }
  if (
    imageUrl &&
    (imageUrl.length > 1000 || !/^(https?:\/\/|\/)/.test(imageUrl))
  ) {
    return { error: "Đường dẫn ảnh phải bắt đầu bằng http(s):// hoặc /." };
  }

  return {
    data: {
      name,
      categoryId,
      productType,
      description: description || null,
      basePrice,
      salePrice,
      gender,
      status,
      isFeatured: formData.get("is_featured") === "on" ? 1 : 0,
      isNew: formData.get("is_new") === "on" ? 1 : 0,
      imageUrl: imageUrl || null,
    },
  };
}

async function uniqueSlug(conn: PoolConnection, name: string, excludeId?: string) {
  const base = slugify(name);
  for (let attempt = 1; attempt <= 50; attempt++) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`;
    const [rows] = await conn.execute<RowDataPacket[]>(
      "SELECT id FROM products WHERE slug = ? AND id <> ? LIMIT 1",
      [candidate, excludeId ?? ""],
    );
    if (rows.length === 0) return candidate;
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
}

async function savePrimaryImage(
  conn: PoolConnection,
  productId: string,
  name: string,
  imageUrl: string | null,
) {
  const [rows] = await conn.execute<RowDataPacket[]>(
    "SELECT id FROM product_images WHERE product_id = ? ORDER BY sort_order, id LIMIT 1",
    [productId],
  );
  const existingId = rows[0]?.id as number | undefined;

  if (imageUrl && existingId) {
    await conn.execute(
      "UPDATE product_images SET url = ?, alt_text = ? WHERE id = ?",
      [imageUrl, name, existingId],
    );
  } else if (imageUrl) {
    await conn.execute(
      "INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES (?, ?, ?, 0)",
      [productId, imageUrl, name],
    );
  } else if (existingId) {
    await conn.execute("DELETE FROM product_images WHERE id = ?", [existingId]);
  }
}

function revalidateProductPages() {
  revalidatePath("/admin/san-pham");
  revalidatePath("/admin");
  revalidatePath("/san-pham");
  revalidatePath("/");
}

function friendlyError(error: unknown, fallback: string): ActionResult {
  const code = dbErrorCode(error);
  if (code === "ER_NO_REFERENCED_ROW_2") {
    return { ok: false, message: "Danh mục, màu sắc hoặc kích cỡ không tồn tại trong dữ liệu." };
  }
  if (code === "ER_DUP_ENTRY") {
    return { ok: false, message: "Sản phẩm bị trùng dữ liệu (slug)." };
  }
  console.error(fallback, error);
  return { ok: false, message: fallback };
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  const parsed = parseProduct(formData);
  if ("error" in parsed) return { ok: false, message: parsed.error };
  const variants = parseVariants(formData);
  if ("error" in variants) return { ok: false, message: variants.error };
  const p = parsed.data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const id = randomUUID();
    const slug = await uniqueSlug(conn, p.name);

    await conn.execute(
      `INSERT INTO products
        (id, category_id, product_type, name, slug, description, base_price, sale_price, gender, status, is_featured, is_new)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, p.categoryId, p.productType, p.name, slug, p.description, p.basePrice, p.salePrice, p.gender, p.status, p.isFeatured, p.isNew],
    );
    const variantSave = await saveVariants(conn, id, p.name, variants);
    if ("error" in variantSave) {
      await conn.rollback();
      return { ok: false, message: variantSave.error };
    }
    await savePrimaryImage(conn, id, p.name, p.imageUrl);

    await conn.commit();
    revalidateProductPages();
    return { ok: true, message: `Đã thêm sản phẩm "${p.name}".` };
  } catch (error) {
    await conn.rollback();
    return friendlyError(error, "Không thể thêm sản phẩm. Vui lòng thử lại.");
  } finally {
    conn.release();
  }
}

export async function updateProduct(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  const parsed = parseProduct(formData);
  if ("error" in parsed) return { ok: false, message: parsed.error };
  const variants = parseVariants(formData);
  if ("error" in variants) return { ok: false, message: variants.error };
  const p = parsed.data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.execute<RowDataPacket[]>(
      "SELECT name, slug FROM products WHERE id = ? FOR UPDATE",
      [id],
    );
    if (existing.length === 0) {
      await conn.rollback();
      return { ok: false, message: "Sản phẩm không tồn tại hoặc đã bị xóa." };
    }

    const slug =
      existing[0].name === p.name
        ? String(existing[0].slug)
        : await uniqueSlug(conn, p.name, id);

    await conn.execute(
      `UPDATE products SET
        category_id = ?, product_type = ?, name = ?, slug = ?, description = ?, base_price = ?, sale_price = ?,
        gender = ?, status = ?, is_featured = ?, is_new = ?
       WHERE id = ?`,
      [p.categoryId, p.productType, p.name, slug, p.description, p.basePrice, p.salePrice, p.gender, p.status, p.isFeatured, p.isNew, id],
    );
    const variantSave = await saveVariants(conn, id, p.name, variants);
    if ("error" in variantSave) {
      await conn.rollback();
      return { ok: false, message: variantSave.error };
    }
    await savePrimaryImage(conn, id, p.name, p.imageUrl);

    await conn.commit();
    revalidateProductPages();
    return { ok: true, message: `Đã cập nhật sản phẩm "${p.name}".` };
  } catch (error) {
    await conn.rollback();
    return friendlyError(error, "Không thể cập nhật sản phẩm. Vui lòng thử lại.");
  } finally {
    conn.release();
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Order history keeps product_name/color/size, so detach variants instead of losing orders.
    await conn.execute(
      `UPDATE order_items SET variant_id = NULL
       WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = ?)`,
      [id],
    );
    await executeIfTableExists(
      conn,
      `DELETE FROM cart_items
       WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = ?)`,
      [id],
    );
    await conn.execute("DELETE FROM product_variants WHERE product_id = ?", [id]);
    await conn.execute("DELETE FROM product_images WHERE product_id = ?", [id]);
    await executeIfTableExists(conn, "DELETE FROM reviews WHERE product_id = ?", [id]);
    await executeIfTableExists(conn, "DELETE FROM wishlists WHERE product_id = ?", [id]);

    const [result] = await conn.execute("DELETE FROM products WHERE id = ?", [id]);
    if ((result as { affectedRows: number }).affectedRows === 0) {
      await conn.rollback();
      return { ok: false, message: "Sản phẩm không tồn tại hoặc đã bị xóa." };
    }

    await conn.commit();
    revalidateProductPages();
    return { ok: true, message: "Đã xóa sản phẩm." };
  } catch (error) {
    await conn.rollback();
    if (dbErrorCode(error) === "ER_ROW_IS_REFERENCED_2") {
      return {
        ok: false,
        message:
          "Sản phẩm đang được tham chiếu ở dữ liệu khác. Hãy chuyển trạng thái sang Lưu trữ thay vì xóa.",
      };
    }
    console.error("Delete product error:", error);
    return { ok: false, message: "Không thể xóa sản phẩm. Vui lòng thử lại." };
  } finally {
    conn.release();
  }
}
