"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { adjustStock } from "@/app/admin/ton-kho/actions";
import { formatPrice } from "@/lib/format";

export type LowStockVariant = { id: string; sku: string; product_name: string; color_name: string; size_name: string; stock_quantity: number };
export type InventoryMovement = { id: number; sku: string; product_name: string; color_name: string; size_name: string; stock_before: number; stock_after: number; reason: string; created_at: string };

export function InventoryManager({ lowStock, movements, total, page, pageCount }: { lowStock: LowStockVariant[]; movements: InventoryMovement[]; total: number; page: number; pageCount: number }) {
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<LowStockVariant | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target) return;
    const data = new FormData(event.currentTarget);
    const nextStock = Number(data.get("stock"));
    const reason = String(data.get("reason") ?? "");
    startTransition(async () => {
      const result = await adjustStock(target.id, nextStock, reason);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setTarget(null);
    });
  }

  return <>
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="font-serif text-3xl md:text-4xl">Theo dõi tồn kho</h1><p className="mt-2 text-sm text-neutral-500">Cảnh báo biến thể còn tối đa 10 sản phẩm; mỗi điều chỉnh lưu số lượng trước/sau, lý do và thời gian.</p></div><a href="/api/admin/reports?type=inventory" className="rounded-lg border px-4 py-2 text-sm">Xuất tồn kho CSV</a></header>
    <section className="mb-8 overflow-hidden rounded-xl border border-amber-200 bg-white">
      <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 p-4"><AlertTriangle size={17} className="text-amber-700" /><h2 className="font-medium">Sắp hết hàng ({lowStock.length})</h2></div>
      {lowStock.length ? <div className="divide-y divide-[#eeeae2]">{lowStock.map((variant) => <div key={variant.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div><p className="font-medium">{variant.product_name}</p><p className="text-xs text-neutral-500">{variant.sku} · {variant.color_name} / {variant.size_name}</p></div>
        <strong className={variant.stock_quantity === 0 ? "text-red-600" : "text-amber-700"}>{variant.stock_quantity} còn lại</strong>
        <button type="button" onClick={() => setTarget(variant)} className="rounded-lg border px-3 py-2 text-sm">Điều chỉnh</button>
      </div>)}</div> : <p className="p-6 text-sm text-neutral-500">Không có biến thể nào sắp hết hàng.</p>}
    </section>

    <section className="overflow-hidden rounded-xl border border-[#e9e6de] bg-white">
      <div className="flex items-center gap-2 border-b border-[#eeeae2] p-4"><ClipboardList size={17} /><h2 className="font-medium">Lịch sử điều chỉnh tồn kho</h2></div>
      {movements.length ? <div className="overflow-x-auto"><table className="w-full min-w-220 text-left text-sm"><thead className="bg-[#faf9f6] text-xs text-neutral-500"><tr><th className="p-4">Thời gian</th><th className="p-4">Sản phẩm / SKU</th><th className="p-4">Tồn trước → sau</th><th className="p-4">Lý do</th></tr></thead><tbody className="divide-y divide-[#eeeae2]">{movements.map((movement) => <tr key={movement.id}><td className="p-4 text-neutral-500">{movement.created_at}</td><td className="p-4"><p>{movement.product_name}</p><p className="text-xs text-neutral-500">{movement.sku} · {movement.color_name}/{movement.size_name}</p></td><td className="p-4">{movement.stock_before} → {movement.stock_after} <span className={movement.stock_after > movement.stock_before ? "text-green-700" : "text-red-600"}>({movement.stock_after - movement.stock_before > 0 ? "+" : ""}{movement.stock_after - movement.stock_before})</span></td><td className="p-4 text-neutral-600">{movement.reason}</td></tr>)}</tbody></table></div> : <p className="p-6 text-sm text-neutral-500">Chưa có lịch sử điều chỉnh.</p>}
      {pageCount > 1 && <nav className="flex items-center justify-between border-t p-4 text-sm"><span>Trang {page}/{pageCount} · {total} lượt</span><div className="flex gap-2">{page > 1 && <Link className="rounded border px-3 py-2" href={`/admin/ton-kho?page=${page - 1}`}>Trước</Link>}{page < pageCount && <Link className="rounded border px-3 py-2" href={`/admin/ton-kho?page=${page + 1}`}>Sau</Link>}</div></nav>}
    </section>

    {target && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setTarget(null); }}><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6"><h2 className="text-lg font-medium">Điều chỉnh tồn: {target.product_name}</h2><p className="text-xs text-neutral-500">{target.sku} · hiện có {target.stock_quantity}</p><label className="block text-sm">Tồn mới<input name="stock" type="number" required min="0" max="1000000" defaultValue={target.stock_quantity} className="mt-1 h-11 w-full border px-3" /></label><label className="block text-sm">Lý do<input name="reason" required maxLength={255} placeholder="Nhập kho, kiểm kê, hàng lỗi..." className="mt-1 h-11 w-full border px-3" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setTarget(null)} className="rounded border px-4 py-2" disabled={pending}>Hủy</button><button type="submit" className="rounded bg-[#4b5735] px-4 py-2 text-white" disabled={pending}>Lưu thay đổi</button></div></form></div>}
  </>;
}
