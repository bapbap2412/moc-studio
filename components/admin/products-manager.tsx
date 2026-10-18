"use client";

import { useState, useTransition } from "react";
import { ImagePlus, Package, Pencil, Plus, Trash2 } from "lucide-react";
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
  PRODUCT_TYPES,
  PRODUCT_STATUSES,
  type AdminCategory,
  type AdminProduct,
} from "@/lib/admin-types";
import { formatPrice } from "@/lib/format";
import { colors, sizes } from "@/lib/data";

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
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState<AdminProduct | null>(null);
  const [pending, startTransition] = useTransition();

  const search = normalizeSearch(query);
  const filtered = products.filter(
    (p) =>
      (statusFilter === "all" || p.status === statusFilter) &&
      (categoryFilter === "all" || String(p.category_id) === categoryFilter) &&
      (typeFilter === "all" || p.product_type === typeFilter) &&
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
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Lọc theo loại sản phẩm"
          className={`${inputClass} sm:w-44`}
        >
          <option value="all">Tất cả loại</option>
          {Object.entries(PRODUCT_TYPES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <p className="text-sm text-neutral-500 sm:ml-auto">
          Hiển thị {filtered.length}/{products.length}
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e6de] bg-white">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-260 text-left text-sm">
              <thead className="bg-[#faf9f6] text-xs text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Sản phẩm</th>
                  <th className="px-6 py-4 font-medium">Danh mục</th>
                  <th className="px-6 py-4 font-medium">Loại</th>
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
                      <td className="px-6 py-4 text-neutral-600">
                        {PRODUCT_TYPES[p.product_type as keyof typeof PRODUCT_TYPES] ??
                          PRODUCT_TYPES.other}
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
                Thêm sản phẩm đầu tiên
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
          key={editing?.id ?? "new-product"}
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedColorIds, setSelectedColorIds] = useState<number[]>(() =>
    [...new Set(product?.variants.map((variant) => variant.color_id) ?? [])],
  );
  const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>(() =>
    [...new Set(product?.variants.map((variant) => variant.size_id) ?? [])],
  );
  const [stockByCombination, setStockByCombination] = useState<Record<string, string>>({});
  const [defaultStockQuantity, setDefaultStockQuantity] = useState(() =>
    String(product?.variants.length === 1 ? product.variants[0].stock_quantity : 0),
  );
  const existingVariants = new Map(
    (product?.variants ?? []).map((variant) => [`${variant.color_id}:${variant.size_id}`, variant]),
  );
  const existingColorIds = new Set(product?.variants.map((variant) => variant.color_id) ?? []);
  const existingSizeIds = new Set(product?.variants.map((variant) => variant.size_id) ?? []);
  const selectedVariants = selectedColorIds.flatMap((colorId) =>
    selectedSizeIds.flatMap((sizeId) => {
      const key = `${colorId}:${sizeId}`;
      const existing = existingVariants.get(key);
      const isNewCombination = !existing && (
        !product?.variants.length || !existingColorIds.has(colorId) || !existingSizeIds.has(sizeId)
      );
      if (!existing && !isNewCombination) return [];
      return {
        ...(existing ? { id: existing.id } : {}),
        colorId,
        sizeId,
        stockQuantity: Number(stockByCombination[key] ?? existing?.stock_quantity ?? defaultStockQuantity),
      };
    }),
  );

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.set("image", file);
    setUploadingImage(true);
    try {
      const response = await fetch("/api/admin/products/upload-image", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        toast.error(result.error ?? "Không thể tải ảnh lên.");
        return;
      }
      setImageUrl(result.url);
      toast.success("Đã tải ảnh lên.");
    } catch {
      toast.error("Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <section className="sm:col-span-2 rounded-lg border border-[#e8e5dc] bg-[#faf9f6] p-4">
        <h3 className="text-sm font-medium">Tồn kho</h3>
        <input type="hidden" name="variants_payload" value={JSON.stringify(selectedVariants)} />
        <div className="mt-3 max-w-xs">
          <Field
            label="Số lượng tồn kho mặc định"
            htmlFor="p-stock-default"
            hint="Áp dụng cho từng tổ hợp mới; tồn kho của biến thể hiện có được giữ nguyên."
          >
            <input
              id="p-stock-default"
              type="number"
              required
              min={0}
              max={1_000_000}
              step={1}
              value={defaultStockQuantity}
              onChange={(event) => setDefaultStockQuantity(event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Màu sắc <span className="text-red-600">*</span></legend>
            <div className="grid grid-cols-2 gap-2">
              {colors.map((color) => {
                const checked = selectedColorIds.includes(color.id);
                const alreadyUsed = product?.variants.some((variant) => variant.color_id === color.id) ?? false;
                return (
                  <label key={color.id} className="flex items-center gap-2 rounded-md border border-[#e8e5dc] bg-white px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={alreadyUsed}
                      onChange={() => setSelectedColorIds((current) => checked ? current.filter((id) => id !== color.id) : [...current, color.id])}
                      className="accent-[#24241f]"
                    />
                    <span className="size-3 rounded-full border border-black/10" style={{ backgroundColor: color.hexCode }} />
                    {color.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Kích cỡ <span className="text-red-600">*</span></legend>
            <div className="grid grid-cols-2 gap-2">
              {sizes.map((size) => {
                const checked = selectedSizeIds.includes(size.id);
                const alreadyUsed = product?.variants.some((variant) => variant.size_id === size.id) ?? false;
                return (
                  <label key={size.id} className="flex items-center gap-2 rounded-md border border-[#e8e5dc] bg-white px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={alreadyUsed}
                      onChange={() => setSelectedSizeIds((current) => checked ? current.filter((id) => id !== size.id) : [...current, size.id])}
                      className="accent-[#24241f]"
                    />
                    {size.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>
        {selectedVariants.length > 0 ? (
          <div className="mt-5 border-t border-[#e8e5dc] pt-4">
            <p className="mb-3 text-sm font-medium">Tồn kho theo từng tổ hợp</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectedVariants.map((variant) => {
                const key = `${variant.colorId}:${variant.sizeId}`;
                const color = colors.find((item) => item.id === variant.colorId);
                const size = sizes.find((item) => item.id === variant.sizeId);
                return (
                  <Field key={key} label={`${color?.name ?? "Màu"} / ${size?.name ?? "Size"}`} htmlFor={`p-stock-${key}`}>
                    <input
                      id={`p-stock-${key}`}
                      type="number"
                      min={0}
                      max={1_000_000}
                      step={1}
                      required
                      value={stockByCombination[key] ?? String(existingVariants.get(key)?.stock_quantity ?? defaultStockQuantity)}
                      onChange={(event) => setStockByCombination((current) => ({ ...current, [key]: event.target.value }))}
                      className={inputClass}
                    />
                  </Field>
                );
              })}
            </div>
            {product && <p className="mt-3 text-xs text-neutral-500">Tổng tồn kho hiện tại: {product.total_stock} sản phẩm. Biến thể đã có được giữ lại khi sửa.</p>}
          </div>
        ) : (
          <p className="mt-4 text-sm text-red-600">Chọn ít nhất một màu sắc và một kích cỡ.</p>
        )}
      </section>
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

      <Field label="Loại sản phẩm" htmlFor="p-type" required>
        <select
          id="p-type"
          name="product_type"
          required
          defaultValue={product?.product_type ?? "other"}
          className={inputClass}
        >
          {Object.entries(PRODUCT_TYPES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
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
          step={1}
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
          step={1}
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
        label="Ảnh đại diện"
        htmlFor="p-image"
        hint="Chọn ảnh JPG, PNG hoặc WebP (tối đa 5 MB), hoặc nhập URL ảnh."
        className="sm:col-span-2"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="p-image"
            name="image_url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            maxLength={1000}
            className={inputClass}
            placeholder="/images/products/ten-san-pham.jpg hoặc https://..."
          />
          <label className={`inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#e8e5dc] px-3 text-sm transition hover:bg-[#f5f4ef] ${uploadingImage ? "pointer-events-none opacity-60" : ""}`}>
            <ImagePlus size={16} />
            {uploadingImage ? "Đang tải..." : "Chọn ảnh"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              disabled={uploadingImage || pending}
              className="sr-only"
            />
          </label>
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[#f5f4ef]">
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
          pending={pending || uploadingImage}
          submitLabel={product ? "Lưu thay đổi" : "Thêm sản phẩm"}
        />
      </div>
    </form>
  );
}
