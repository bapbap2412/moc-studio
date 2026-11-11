"use server";

import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { recordAdminAudit } from "@/lib/admin-audit";
import { isAdmin, readText, type ActionResult, UNAUTHORIZED } from "@/lib/admin-server";

type CatalogKind = "category" | "color" | "size";

function makeSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}

export async function saveCatalogItem(kind: CatalogKind, id: number | null, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!["category", "color", "size"].includes(kind) || (id !== null && (!Number.isSafeInteger(id) || id <= 0))) {
    return { ok: false, message: "Mục danh mục không hợp lệ." };
  }
  const name = readText(formData, "name");
  if (!name || name.length > (kind === "size" ? 20 : kind === "color" ? 50 : 100)) return { ok: false, message: "Tên bắt buộc và vượt quá độ dài cho phép." };

  try {
    if (kind === "category") {
      const slug = makeSlug(readText(formData, "slug") || name);
      const description = readText(formData, "description");
      const imageUrl = readText(formData, "image_url");
      const sortOrder = Number(readText(formData, "sort_order"));
      const parentRaw = readText(formData, "parent_id");
      const parentId = parentRaw ? Number(parentRaw) : null;
      if (!slug || slug.length > 120 || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 100_000) return { ok: false, message: "Slug hoặc thứ tự sắp xếp không hợp lệ." };
      if (description.length > 2000 || (imageUrl && (imageUrl.length > 1000 || !/^(https?:\/\/|\/)/.test(imageUrl)))) return { ok: false, message: "Mô tả hoặc đường dẫn ảnh danh mục không hợp lệ." };
      if (parentId !== null && (!Number.isInteger(parentId) || parentId <= 0 || parentId === id)) return { ok: false, message: "Danh mục cha không hợp lệ." };
      if (parentId !== null) {
        const [parents] = await pool.execute("SELECT id FROM categories WHERE id = ? AND parent_id IS NULL LIMIT 1", [parentId]);
        if (!(parents as unknown[]).length) return { ok: false, message: "Không tìm thấy danh mục cha." };
      }
      if (id === null) {
        await pool.execute("INSERT INTO categories (parent_id, name, slug, description, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)", [parentId, name, slug, description || null, imageUrl || null, sortOrder]);
      } else {
        await pool.execute("UPDATE categories SET parent_id=?, name=?, slug=?, description=?, image_url=?, sort_order=? WHERE id=?", [parentId, name, slug, description || null, imageUrl || null, sortOrder, id]);
      }
    } else if (kind === "color") {
      const hexCode = readText(formData, "hex_code").toUpperCase();
      if (!/^#[0-9A-F]{6}$/.test(hexCode)) return { ok: false, message: "Mã màu phải có dạng #RRGGBB." };
      if (id === null) await pool.execute("INSERT INTO colors (name, hex_code) VALUES (?, ?)", [name, hexCode]);
      else await pool.execute("UPDATE colors SET name=?, hex_code=? WHERE id=?", [name, hexCode, id]);
    } else {
      const sortOrder = Number(readText(formData, "sort_order"));
      if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 100_000) return { ok: false, message: "Thứ tự kích cỡ không hợp lệ." };
      if (id === null) await pool.execute("INSERT INTO sizes (name, sort_order) VALUES (?, ?)", [name, sortOrder]);
      else await pool.execute("UPDATE sizes SET name=?, sort_order=? WHERE id=?", [name, sortOrder, id]);
    }
    await recordAdminAudit(id === null ? "catalog.create" : "catalog.update", kind, id, { name });
    revalidatePath("/admin/danh-muc");
    revalidatePath("/admin/san-pham");
    revalidatePath("/san-pham", "layout");
    revalidatePath("/");
    return { ok: true, message: id === null ? "Đã thêm mục danh mục." : "Đã cập nhật mục danh mục." };
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    if (code === "ER_DUP_ENTRY") return { ok: false, message: "Tên hoặc slug này đã tồn tại." };
    console.error("Save catalog item error:", error);
    return { ok: false, message: "Không lưu được mục danh mục. Hãy kiểm tra mục đang được sản phẩm sử dụng rồi thử lại." };
  }
}
