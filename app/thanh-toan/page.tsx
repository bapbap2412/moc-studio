import type { Metadata } from 'next'
import { CheckoutForm } from '@/components/checkout/checkout-form'

export const metadata: Metadata = { title: 'Thanh toán' }

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 md:px-8">
      <h1 className="font-serif text-4xl md:text-5xl">Thanh toán</h1>
      <CheckoutForm />
    </div>
  )
}
