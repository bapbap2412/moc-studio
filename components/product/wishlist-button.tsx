'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { getWishlistStatus, toggleWishlist } from '@/app/wishlist/actions'

export function WishlistButton({ productId, compact = false }: { productId: string; compact?: boolean }) {
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    getWishlistStatus(productId).then((value) => { if (active) setSaved(value) }).catch(() => {})
    return () => { active = false }
  }, [productId])

  async function toggle() {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) })
      const result = await response.json() as Awaited<ReturnType<typeof toggleWishlist>>
      if (!result.ok) { setMessage(result.message); return }
      setSaved(result.saved)
      setMessage(result.saved ? 'Đã lưu vào danh sách yêu thích.' : 'Đã bỏ khỏi danh sách yêu thích.')
    } catch {
      setMessage('Không thể cập nhật danh sách yêu thích.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" onClick={toggle} disabled={busy} aria-pressed={saved} aria-label={saved ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'} title={message || (saved ? 'Bỏ yêu thích' : 'Thêm vào yêu thích')} className={compact ? 'flex size-10 items-center justify-center rounded-full bg-background/90 shadow-sm hover:bg-background disabled:opacity-50' : 'inline-flex h-11 items-center justify-center gap-2 border border-border px-4 text-sm hover:bg-muted disabled:opacity-50'}>
      <Heart className={compact ? 'size-4' : 'size-4'} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
      {!compact && <span>{saved ? 'Đã yêu thích' : 'Yêu thích'}</span>}
      <span className="sr-only" aria-live="polite">{message}</span>
    </button>
  )
}
