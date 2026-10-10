'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Minus, Plus, Star } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { effectivePrice, getColor, getSize, type Product } from '@/lib/data'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

export function ProductPurchase({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [colorId, setColorId] = useState(product.colorIds[0])
  const [sizeId, setSizeId] = useState<number | null>(product.sizeIds.length === 1 ? product.sizeIds[0] : null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState('')

  const stockFor = (sId: number) =>
    product.variants.find((v) => v.colorId === colorId && v.sizeId === sId)?.stockQuantity ?? 0

  const variant = sizeId ? product.variants.find((v) => v.colorId === colorId && v.sizeId === sizeId) : undefined
  const stock = variant?.stockQuantity ?? 0
  const color = getColor(colorId)

  function handleAdd() {
    if (!variant) {
      setError('Vui lòng chọn kích cỡ')
      return
    }
    if (stock === 0) return
    addItem({
      variantId: variant.id,
      productSlug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl,
      colorName: color?.name ?? '',
      sizeName: getSize(variant.sizeId)?.name ?? '',
      unitPrice: effectivePrice(product),
      quantity,
      maxQuantity: stock,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="font-serif text-3xl leading-tight text-balance md:text-4xl">{product.name}</h1>
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
          <span>
            {product.rating} ({product.reviewCount} đánh giá)
          </span>
        </div>
        <div className="mt-4 flex items-baseline gap-3">
          <span className={cn('text-2xl', product.salePrice && 'text-accent')}>{formatPrice(effectivePrice(product))}</span>
          {product.salePrice && (
            <span className="text-muted-foreground line-through">{formatPrice(product.basePrice)}</span>
          )}
        </div>
      </div>

      <fieldset>
        <legend className="text-sm">
          Màu sắc: <span className="font-medium">{color?.name}</span>
        </legend>
        <div className="mt-3 flex gap-3">
          {product.colorIds.map((id) => {
            const c = getColor(id)
            if (!c) return null
            return (
              <button
                key={id}
                type="button"
                aria-pressed={id === colorId}
                aria-label={c.name}
                onClick={() => {
                  setColorId(id)
                  setQuantity(1)
                }}
                className={cn(
                  'size-9 rounded-full border border-foreground/15 ring-offset-2 ring-offset-background transition',
                  id === colorId && 'ring-2 ring-foreground',
                )}
                style={{ backgroundColor: c.hexCode }}
              />
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <div className="flex items-center justify-between">
          <legend className="text-sm">Kích cỡ</legend>
          <Link href="#" className="text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground">
            Hướng dẫn chọn size
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.sizeIds.map((id) => {
            const s = getSize(id)
            const out = stockFor(id) === 0
            return (
              <button
                key={id}
                type="button"
                disabled={out}
                aria-pressed={id === sizeId}
                onClick={() => {
                  setSizeId(id)
                  setQuantity(1)
                  setError('')
                }}
                className={cn(
                  'h-11 min-w-14 border px-4 text-sm transition-colors',
                  id === sizeId ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground',
                  out && 'cursor-not-allowed text-muted-foreground line-through opacity-60 hover:border-border',
                )}
              >
                {s?.name}
              </button>
            )
          })}
        </div>
        <p className="mt-2 min-h-5 text-xs" aria-live="polite">
          {error ? (
            <span className="text-destructive">{error}</span>
          ) : variant ? (
            stock > 0 && stock <= 3 ? (
              <span className="text-accent">Chỉ còn {stock} sản phẩm</span>
            ) : stock > 0 ? (
              <span className="text-muted-foreground">Còn hàng</span>
            ) : (
              <span className="text-destructive">Hết hàng</span>
            )
          ) : null}
        </p>
      </fieldset>

      <div className="flex gap-3">
        <div className="flex h-12 items-center border border-border">
          <button
            type="button"
            aria-label="Giảm số lượng"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex size-12 items-center justify-center hover:bg-muted"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center text-sm" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Tăng số lượng"
            onClick={() => setQuantity((q) => Math.min(q + 1, stock || 1))}
            className="flex size-12 items-center justify-center hover:bg-muted"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!!variant && stock === 0}
          className="flex h-12 flex-1 items-center justify-center gap-2 bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-50"
        >
          {added ? (
            <>
              <Check className="size-4" aria-hidden="true" /> Đã thêm vào giỏ
            </>
          ) : (
            'Thêm vào giỏ hàng'
          )}
        </button>
      </div>
      {added && (
        <Link href="/gio-hang" className="-mt-3 text-center text-sm underline underline-offset-4">
          Xem giỏ hàng
        </Link>
      )}

      <div className="divide-y divide-border border-y border-border">
        <details className="group py-4" open>
          <summary className="cursor-pointer list-none text-sm font-medium">Mô tả sản phẩm</summary>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
        </details>
        <details className="group py-4">
          <summary className="cursor-pointer list-none text-sm font-medium">Chất liệu & bảo quản</summary>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            <span className="text-foreground">Chất liệu:</span> {product.material}
            <br />
            {product.careInstructions}
          </p>
        </details>
        <details className="group py-4">
          <summary className="cursor-pointer list-none text-sm font-medium">Giao hàng & đổi trả</summary>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Giao hàng 2–4 ngày toàn quốc. Miễn phí vận chuyển cho đơn từ 1.000.000₫. Đổi trả miễn phí trong 30 ngày.
          </p>
        </details>
      </div>
    </div>
  )
}
