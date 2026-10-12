"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
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

type ProductInput = {
  name: string;
  categoryId: number;
  description: string | null;
  basePrice: number;
  salePrice: number | null;
  gender: string;
  status: string;
  isFeatured: number;
  isNew: number;
  imageUrl: string | null;
};

function parseProduct(
  formData: FormData,
): { data: ProductInput } | { error: string } {
  const name = readText(formData, "name");
  const categoryId = Number(readText(formData, "category_id"));
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
    return { ok: false, message: "Danh mục không tồn tại." };
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
  const p = parsed.data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const id = randomUUID();
    const slug = await uniqueSlug(conn, p.name);

    await conn.execute(
      `INSERT INTO products
        (id, category_id, name, slug, description, base_price, sale_price, gender, status, is_featured, is_new)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, p.categoryId, p.name, slug, p.description, p.basePrice, p.salePrice, p.gender, p.status, p.isFeatured, p.isNew],
    );
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
        category_id = ?, name = ?, slug = ?, description = ?, base_price = ?, sale_price = ?,
        gender = ?, status = ?, is_featured = ?, is_new = ?
       WHERE id = ?`,
      [p.categoryId, p.name, slug, p.description, p.basePrice, p.salePrice, p.gender, p.status, p.isFeatured, p.isNew, id],
    );
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
