"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { saveCatalogItem } from "@/app/admin/danh-muc/actions";
import { Field, FormActions, Modal, inputClass, primaryButtonClass } from "@/components/admin/admin-ui";

type Category = { id: number; name: string; slug: string; description: string | null; image_url: string | null; sort_order: number; parent_id: number | null };
type Color = { id: number; name: string; hex_code: string };
type Size = { id: number; name: string; sort_order: number };
type Kind = "category" | "color" | "size";
type Entry = Category | Color | Size;

export function CatalogManager({ categories, colors, sizes }: { categories: Category[]; colors: Color[]; sizes: Size[] }) {
  const [kind, setKind] = useState<Kind>("category");
  const [editing, setEditing] = useState<Entry | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function openForm(nextKind: Kind, item: Entry | null = null) {
    setKind(nextKind);
    setEditing(item);
    setOpen(true);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveCatalogItem(kind, editing?.id ?? null, data);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
    });
  }

  return (
    <>
      <section className="mb-6">
        <h1 className="font-serif text-3xl md:text-4xl">Danh mục, màu và kích cỡ</h1>
        <p className="mt-2 text-sm text-neutral-500">Các mục đã dùng bởi sản phẩm không thể xóa; hãy sửa tên hoặc giữ lại để bảo toàn đơn hàng cũ.</p>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <CatalogSection title="Danh mục" onAdd={() => openForm("category")}>
          {categories.map((item) => <CatalogRow key={item.id} title={item.name} subtitle={`${item.slug} · thứ tự ${item.sort_order}`} onEdit={() => openForm("category", item)} />)}
        </CatalogSection>
        <CatalogSection title="Màu sắc" onAdd={() => openForm("color")}>
          {colors.map((item) => <CatalogRow key={item.id} title={item.name} subtitle={item.hex_code} color={item.hex_code} onEdit={() => openForm("color", item)} />)}
        </CatalogSection>
        <CatalogSection title="Kích cỡ" onAdd={() => openForm("size")}>
          {sizes.map((item) => <CatalogRow key={item.id} title={item.name} subtitle={`Thứ tự ${item.sort_order}`} onEdit={() => openForm("size", item)} />)}
        </CatalogSection>
      </section>

      <Modal open={open} onClose={() => !pending && setOpen(false)} title={`${editing ? "Sửa" : "Thêm"} ${kind === "category" ? "danh mục" : kind === "color" ? "màu sắc" : "kích cỡ"}`}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Tên" htmlFor="catalog-name" required>
            <input id="catalog-name" name="name" required maxLength={kind === "category" ? 100 : kind === "color" ? 50 : 20} defaultValue={(editing as { name?: string } | null)?.name} className={inputClass} />
          </Field>
          {kind === "category" && <>
            <Field label="Slug" htmlFor="catalog-slug" hint="Có thể để trống để tự tạo từ tên.">
              <input id="catalog-slug" name="slug" maxLength={120} defaultValue={(editing as Category | null)?.slug} className={inputClass} />
            </Field>
            <Field label="Danh mục cha" htmlFor="catalog-parent">
              <select id="catalog-parent" name="parent_id" defaultValue={(editing as Category | null)?.parent_id ?? ""} className={inputClass}>
                <option value="">Không có</option>
                {categories.filter((item) => item.id !== editing?.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </Field>
            <Field label="Đường dẫn ảnh" htmlFor="catalog-image">
              <input id="catalog-image" name="image_url" maxLength={1000} defaultValue={(editing as Category | null)?.image_url ?? ""} className={inputClass} />
            </Field>
            <Field label="Mô tả" htmlFor="catalog-description">
              <textarea id="catalog-description" name="description" maxLength={2000} defaultValue={(editing as Category | null)?.description ?? ""} className={`${inputClass} min-h-24 py-2`} />
            </Field>
            <SortOrder value={(editing as Category | null)?.sort_order ?? categories.length + 1} />
          </>}
          {kind === "color" && <Field label="Mã màu HEX" htmlFor="catalog-hex" required>
            <input id="catalog-hex" name="hex_code" type="color" required defaultValue={(editing as Color | null)?.hex_code ?? "#777777"} className={`${inputClass} h-12 p-1`} />
          </Field>}
          {kind === "size" && <SortOrder value={(editing as Size | null)?.sort_order ?? sizes.length + 1} />}
          <FormActions onCancel={() => setOpen(false)} pending={pending} submitLabel={editing ? "Lưu thay đổi" : "Thêm mục"} />
        </form>
      </Modal>
    </>
  );
}

function SortOrder({ value }: { value: number }) {
  return <Field label="Thứ tự sắp xếp" htmlFor="catalog-sort" required>
    <input id="catalog-sort" name="sort_order" type="number" min={0} max={100000} required defaultValue={value} className={inputClass} />
  </Field>;
}

function CatalogSection({ title, onAdd, children }: { title: string; onAdd: () => void; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-xl border border-[#e9e6de] bg-white">
    <div className="flex items-center justify-between border-b border-[#eeeae2] p-4">
      <h2 className="font-medium">{title}</h2>
      <button type="button" onClick={onAdd} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs"><Plus size={14} />Thêm</button>
    </div>
    <div className="divide-y divide-[#eeeae2]">{children || <p className="p-5 text-sm text-neutral-500">Chưa có mục nào.</p>}</div>
  </section>;
}

function CatalogRow({ title, subtitle, color, onEdit }: { title: string; subtitle: string; color?: string; onEdit: () => void }) {
  return <div className="flex items-center justify-between gap-3 px-4 py-3">
    <div className="flex min-w-0 items-center gap-3">
      {color && <span className="size-5 shrink-0 rounded-full border" style={{ backgroundColor: color }} />}
      <div className="min-w-0"><p className="truncate text-sm font-medium">{title}</p><p className="truncate text-xs text-neutral-500">{subtitle}</p></div>
    </div>
    <button type="button" onClick={onEdit} aria-label={`Sửa ${title}`} className="rounded-lg border p-2"><Pencil size={14} /></button>
  </div>;
}
