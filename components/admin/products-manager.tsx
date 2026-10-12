"use client";

import { useState, useTransition } from "react";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/app/admin/san-pham/actions";
import {
  Badge,
  ConfirmDialog,
  Field,
  FormActions,
  Modal,
  SearchInput,
  iconButtonClass,
  inputClass,
  normalizeSearch,
  primaryButtonClass,
  textareaClass,
} from "@/components/admin/admin-ui";
import {
  GENDERS,
  PRODUCT_STATUSES,
  type AdminCategory,
  type AdminProduct,
} from "@/lib/admin-types";
import { formatPrice } from "@/lib/format";

export function ProductsManager({
  products,
  categories,
}: {
  products: AdminProduct[];
  categories: AdminCategory[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState<AdminProduct | null>(null);
  const [pending, startTransition] = useTransition();

  const search = normalizeSearch(query);
  const filtered = products.filter(
    (p) =>
      (statusFilter === "all" || p.status === statusFilter) &&
      (categoryFilter === "all" || String(p.category_id) === categoryFilter) &&
      (!search || normalizeSearch(p.name).includes(search)),
  );

  const totalStock = products.reduce((sum, p) => sum + p.total_stock, 0);
  const activeCount = products.filter((p) => p.status === "active").length;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(product: AdminProduct) {
    setEditing(product);
    setFormOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = editing
        ? await updateProduct(editing.id, formData)
        : await createProduct(formData);
      if (result.ok) {
        toast.success(result.message);
        setFormOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteProduct(deleting.id);
      if (result.ok) {
        toast.success(result.message);
        setDeleting(null);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl">Quản lý sản phẩm</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {products.length} sản phẩm · {activeCount} đang bán · {totalStock}{" "}
            sản phẩm trong kho
          </p>
        </div>
        <button type="button" onClick={openCreate} className={primaryButtonClass}>
          <Plus size={17} />
          Thêm sản phẩm
        </button>
      </section>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Tìm theo tên sản phẩm..."
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Lọc theo trạng thái"
          className={`${inputClass} sm:w-44`}
        >
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(PRODUCT_STATUSES).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Lọc theo danh mục"
          className={`${inputClass} sm:w-48`}
        >
          <option value="all">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="text-sm text-neutral-500 sm:ml-auto">
          Hiển thị {filtered.length}/{products.length}
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e6de] bg-white">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-[#faf9f6] text-xs text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Sản phẩm</th>
                  <th className="px-6 py-4 font-medium">Danh mục</th>
                  <th className="px-6 py-4 font-medium">Giá</th>
                  <th className="px-6 py-4 font-medium">Tồn kho</th>
                  <th className="px-6 py-4 font-medium">Trạng thái</th>
                  <th className="px-6 py-4 font-medium">Nhãn</th>
                  <th className="px-6 py-4 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeae2]">
                {filtered.map((p) => {
                  const status = PRODUCT_STATUSES[p.status] ?? {
                    label: p.status,
                    badgeClass: "bg-neutral-100 text-neutral-600",
                  };
                  return (
                    <tr key={p.id} className="hover:bg-[#fcfbf8]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-10 shrink-0 overflow-hidden bg-[#f5f4ef]">
                            {p.image_url && (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-600">
                        {p.category_name ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium">
                          {formatPrice(p.sale_price ?? p.base_price)}
                        </span>
                        {p.sale_price !== null && (
                          <span className="ml-2 text-xs text-neutral-400 line-through">
                            {formatPrice(p.base_price)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            p.total_stock === 0
                              ? "font-medium text-red-600"
                              : p.total_stock <= 10
                                ? "font-medium text-amber-600"
                                : "text-neutral-600"
                          }
                        >
                          {p.total_stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={status.badgeClass}>{status.label}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5">
                          {p.is_new && (
                            <span className="rounded-full bg-[#f5f4ef] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-600">
                              Mới
                            </span>
                          )}
                          {p.is_featured && (
                            <span className="rounded-full bg-[#e9e4d8] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-700">
                              Nổi bật
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(p)}
                            className={iconButtonClass}
                            aria-label={`Sửa ${p.name}`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(p)}
                            className={`${iconButtonClass} hover:bg-red-50 hover:text-red-600`}
                            aria-label={`Xóa ${p.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Package size={32} className="text-neutral-300" />
            <p className="font-serif text-xl text-neutral-400">
              {products.length === 0
                ? "Chưa có sản phẩm nào"
                : "Không tìm thấy sản phẩm phù hợp"}
            </p>
            {products.length === 0 && (
              <button type="button" onClick={openCreate} className={`${primaryButtonClass} mt-2`}>
                <Plus size={17} />
                Thêm s���n phẩm đầu tiên
              </button>
            )}
          </div>
        )}
      </section>

      <Modal
        open={formOpen}
        onClose={() => !pending && setFormOpen(false)}
        title={editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
        description={
          editing
            ? "Cập nhật thông tin sản phẩm. Tồn kho được quản lý theo biến thể (màu × size)."
            : "Điền thông tin cơ bản. Đường dẫn (slug) sẽ được tạo tự động từ tên."
        }
      >
        <ProductForm
          product={editing}
          categories={categories}
          pending={pending}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => !pending && setDeleting(null)}
        onConfirm={handleDelete}
        pending={pending}
        title="Xóa sản phẩm?"
        message={
          <>
            Sản phẩm <strong className="text-[#24241f]">{deleting?.name}</strong>{" "}
            cùng toàn bộ biến thể và ảnh sẽ bị xóa vĩnh viễn. Các đơn hàng cũ vẫn giữ
            lại tên sản phẩm. Nếu chỉ muốn ngừng bán, hãy chuyển sang{" "}
            <strong>Lưu trữ</strong>.
          </>
        }
      />
    </>
  );
}

function ProductForm({
  product,
  categories,
  pending,
  onSubmit,
  onCancel,
}: {
  product: AdminProduct | null;
  categories: AdminCategory[];
  pending: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Tên sản phẩm" htmlFor="p-name" required className="sm:col-span-2">
        <input
          id="p-name"
          name="name"
          required
          maxLength={200}
          defaultValue={product?.name}
          className={inputClass}
          placeholder="VD: Áo sơ mi linen"
        />
      </Field>

      <Field label="Danh mục" htmlFor="p-category" required>
        <select
          id="p-category"
          name="category_id"
          required
          defaultValue={product?.category_id ? String(product.category_id) : ""}
          className={inputClass}
        >
          <option value="" disabled>
            Chọn danh mục
          </option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Giới tính" htmlFor="p-gender" required>
        <select
          id="p-gender"
          name="gender"
          defaultValue={product?.gender ?? "unisex"}
          className={inputClass}
        >
          {Object.entries(GENDERS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Giá gốc (VND)" htmlFor="p-base" required>
        <input
          id="p-base"
          name="base_price"
          type="number"
          inputMode="numeric"
          min={1}
          step={1000}
          required
          defaultValue={product?.base_price}
          className={inputClass}
          placeholder="690000"
        />
      </Field>

      <Field label="Giá khuyến mãi (VND)" htmlFor="p-sale" hint="Để trống nếu không giảm giá.">
        <input
          id="p-sale"
          name="sale_price"
          type="number"
          inputMode="numeric"
          min={1}
          step={1000}
          defaultValue={product?.sale_price ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Trạng thái" htmlFor="p-status" required>
        <select
          id="p-status"
          name="status"
          defaultValue={product?.status ?? "draft"}
          className={inputClass}
        >
          {Object.entries(PRODUCT_STATUSES).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </select>
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">Nhãn</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_new"
            defaultChecked={product?.is_new ?? false}
            className="h-4 w-4 accent-[#24241f]"
          />
          Hàng mới
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={product?.is_featured ?? false}
            className="h-4 w-4 accent-[#24241f]"
          />
          Nổi bật (hiện ở trang chủ)
        </label>
      </fieldset>

      <Field
        label="Ảnh đại diện (URL)"
        htmlFor="p-image"
        hint="VD: /images/ao-linen.jpg hoặc https://..."
        className="sm:col-span-2"
      >
        <div className="flex gap-3">
          <input
            id="p-image"
            name="image_url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            maxLength={1000}
            className={inputClass}
          />
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[#f5f4ef]">
            {/^(https?:\/\/|\/)/.test(imageUrl) && (
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
        </div>
      </Field>

      <Field label="Mô tả" htmlFor="p-desc" className="sm:col-span-2">
        <textarea
          id="p-desc"
          name="description"
          maxLength={5000}
          defaultValue={product?.description ?? ""}
          className={textareaClass}
        />
      </Field>

      <div className="sm:col-span-2">
        <FormActions
          onCancel={onCancel}
          pending={pending}
          submitLabel={product ? "Lưu thay đổi" : "Thêm sản phẩm"}
        />
      </div>
    </form>
  );
}
