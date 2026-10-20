'use client'

import { useState, useTransition } from 'react'
import { Star } from 'lucide-react'

export function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const [rating, setRating] = useState(5)
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()

  function submit(formData: FormData) {
    const comment = String(formData.get('comment') ?? '')
    startTransition(async () => {
      const response = await fetch(`/api/san-pham/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, rating, comment }),
      })
      const result = await response.json() as { ok: boolean; message: string }
      setMessage(result.message)
      if (result.ok) (document.getElementById(`review-${productId}`) as HTMLFormElement | null)?.reset()
    })
  }

  return (
    <form id={`review-${productId}`} action={submit} className="mt-5 border-t border-border pt-5">
      <p className="text-sm font-medium">Đánh giá sau khi nhận hàng</p>
      <div className="mt-2 flex gap-1" role="group" aria-label="Chọn số sao">
        {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} sao`} aria-pressed={rating === value} onClick={() => setRating(value)}><Star className={`size-5 ${value <= rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`} /></button>)}
      </div>
      <label htmlFor={`review-comment-${productId}`} className="mt-3 block text-xs text-muted-foreground">Nhận xét (không bắt buộc)</label>
      <textarea id={`review-comment-${productId}`} name="comment" rows={3} maxLength={1000} className="mt-1 w-full border border-input bg-background p-3 text-sm" />
      <button disabled={pending} className="mt-3 h-10 bg-primary px-5 text-sm text-primary-foreground disabled:opacity-50">{pending ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
      {message && <p role="status" className="mt-2 text-xs text-muted-foreground">{message}</p>}
    </form>
  )
}
