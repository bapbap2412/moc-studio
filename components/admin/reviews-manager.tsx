"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";
import { saveReviewReply, setReviewVisible } from "@/app/admin/danh-gia/actions";
import { SearchInput } from "@/components/admin/admin-ui";

export type AdminReview = {
  id: number;
  product_id: string;
  rating: number;
  comment: string | null;
  admin_reply: string | null;
  is_visible: boolean;
  created_at: string;
  product_name: string;
  product_slug: string;
  full_name: string;
  email: string;
};

export function ReviewsManager({ reviews, total, currentPage, pageSize, initialQuery, summary }: {
  reviews: AdminReview[]; total: number; currentPage: number; pageSize: number; initialQuery: string;
  summary: { total: number; visible: number; hidden: number };
}) {
  const [query, setQuery] = useState(initialQuery);
  const [pending, startTransition] = useTransition();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  function toggle(review: AdminReview) {
    startTransition(async () => {
      const result = await setReviewVisible(review.id, !review.is_visible);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function reply(event: React.FormEvent<HTMLFormElement>, reviewId: number) {
    event.preventDefault();
    const content = String(new FormData(event.currentTarget).get("reply") ?? "");
    startTransition(async () => {
      const result = await saveReviewReply(reviewId, content);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <>
      <section className="mb-6">
        <h1 className="font-serif text-3xl md:text-4xl">Quản lý đánh giá</h1>
        <p className="mt-2 text-sm text-neutral-500">{summary.total} đánh giá · {summary.visible} đang hiển thị · {summary.hidden} đã ẩn</p>
      </section>
      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form action="/admin/danh-gia" method="get" className="flex w-full gap-2 sm:max-w-md">
          <SearchInput name="q" value={query} onChange={setQuery} placeholder="Tìm sản phẩm, khách hàng, nội dung..." />
          <button type="submit" className="sr-only">Tìm</button>
        </form>
        <p className="text-sm text-neutral-500 sm:ml-auto">{total} kết quả</p>
      </section>
      <section className="divide-y divide-[#eeeae2] overflow-hidden rounded-xl border border-[#e9e6de] bg-white">
        {reviews.length ? reviews.map((review) => (
          <article key={review.id} className="p-5 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/san-pham/${review.product_slug}`} className="font-medium hover:underline">{review.product_name}</Link>
                  <span className={`rounded-full px-2.5 py-1 text-xs ${review.is_visible ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-600"}`}>{review.is_visible ? "Đang hiển thị" : "Đã ẩn"}</span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">{review.full_name} · {review.email} · {review.created_at}</p>
                <div className="mt-3 flex" aria-label={`${review.rating} trên 5 sao`}>
                  {[1,2,3,4,5].map((star) => <Star key={star} size={15} className={star <= review.rating ? "fill-amber-400 text-amber-400" : "text-neutral-300"} />)}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">{review.comment || "(Không có nội dung)"}</p>
              </div>
              <button type="button" disabled={pending} onClick={() => toggle(review)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#e8e5dc] px-3 py-2 text-sm hover:bg-[#f5f4ef] disabled:opacity-50">
                {review.is_visible ? <EyeOff size={15} /> : <Eye size={15} />}{review.is_visible ? "Ẩn đánh giá" : "Hiện đánh giá"}
              </button>
            </div>
            <form onSubmit={(event) => reply(event, review.id)} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <textarea name="reply" maxLength={2000} defaultValue={review.admin_reply ?? ""} placeholder="Phản hồi công khai của cửa hàng…" className="min-h-20 flex-1 rounded-lg border border-[#e8e5dc] p-3 text-sm" />
              <button type="submit" disabled={pending} className="self-end rounded-lg bg-[#4b5735] px-4 py-2 text-sm text-white disabled:opacity-50">Lưu phản hồi</button>
            </form>
          </article>
        )) : <p className="p-12 text-center text-sm text-neutral-500">Chưa có đánh giá phù hợp.</p>}
      </section>
      {pageCount > 1 && <nav aria-label="Phân trang đánh giá" className="mt-5 flex items-center justify-between text-sm">
        <span className="text-neutral-500">Trang {currentPage}/{pageCount}</span>
        <div className="flex gap-2">
          {currentPage > 1 ? <Link className="rounded-lg border px-3 py-2" href={`/admin/danh-gia?q=${encodeURIComponent(initialQuery)}&page=${currentPage-1}`}>Trước</Link> : <span className="rounded-lg border px-3 py-2 text-neutral-400">Trước</span>}
          {currentPage < pageCount ? <Link className="rounded-lg border px-3 py-2" href={`/admin/danh-gia?q=${encodeURIComponent(initialQuery)}&page=${currentPage+1}`}>Sau</Link> : <span className="rounded-lg border px-3 py-2 text-neutral-400">Sau</span>}
        </div>
      </nav>}
    </>
  );
}
