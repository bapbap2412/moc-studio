import type { Metadata } from 'next'
import { CartView } from '@/components/cart/cart-view'

export const metadata: Metadata = { title: 'Giỏ hàng' }

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 md:px-8">
      <h1 className="font-serif text-4xl md:text-5xl">Giỏ hàng</h1>
      <CartView />
    </div>
  )
}
