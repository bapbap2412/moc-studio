'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, X } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { OrderSummary } from '@/components/cart/order-summary'
import { formatPrice } from '@/lib/format'

export function CartView() {
  const { items, subtotal, updateQuantity, removeItem } = useCart()

  if (items.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center gap-4 border border-dashed border-border py-24 text-center">
        <p className="font-serif text-2xl">Giỏ hàng của bạn đang trống</p>
        <p className="text-sm text-muted-foreground">Khám phá bộ sưu tập mới và chọn cho mình món đồ yêu thích.</p>
        <Link
          href="/san-pham"
          className="mt-2 inline-flex h-12 items-center bg-primary px-7 text-sm font-medium text-primary-foreground hover:bg-primary/85"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y divide-border border-y border-border">
        {items.map((item) => (
          <li key={item.variantId} className="flex gap-4 py-6">
            <Link href={`/san-pham/${item.productSlug}`} className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden bg-muted md:w-28">
              <Image src={item.imageUrl} alt={item.name} fill sizes="112px" className="object-cover" />
            </Link>
            <div className="flex flex-1 flex-col justify-between gap-3">
              <div className="flex justify-between gap-4">
                <div>
                  <Link href={`/san-pham/${item.productSlug}`} className="text-sm font-medium hover:underline">
                    {item.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.colorName} / {item.sizeName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.variantId)}
                  aria-label={`Xóa ${item.name} khỏi giỏ`}
                  className="flex size-8 shrink-0 items-center justify-center hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex items-end justify-between gap-4">
                <div className="flex h-9 items-center border border-border">
                  <button
                    type="button"
                    aria-label="Giảm số lượng"
                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    className="flex size-9 items-center justify-center hover:bg-muted"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label="Tăng số lượng"
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    className="flex size-9 items-center justify-center hover:bg-muted"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <p className="text-sm font-medium">{formatPrice(item.unitPrice * item.quantity)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="lg:sticky lg:top-32 lg:self-start">
        <OrderSummary subtotal={subtotal}>
          <Link
            href="/thanh-toan"
            className="flex h-12 items-center justify-center bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/85"
          >
            Tiến hành thanh toán
          </Link>
          <Link href="/san-pham" className="text-center text-sm underline underline-offset-4">
            Tiếp tục mua sắm
          </Link>
        </OrderSummary>
      </div>
    </div>
  )
}
