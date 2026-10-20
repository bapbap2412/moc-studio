import type { Metadata } from 'next'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { isMomoConfigured } from '@/lib/momo'

export const metadata: Metadata = { title: 'Thanh toán' }
export const dynamic = 'force-dynamic'

export default function CheckoutPage() {
  const paymentDetails = {
    bankName: process.env.BANK_NAME ?? '',
    bankAccount: process.env.BANK_ACCOUNT_NO ?? '',
    bankAccountName: process.env.BANK_ACCOUNT_NAME ?? '',
    momoEnabled: isMomoConfigured(),
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 md:px-8">
      <h1 className="font-serif text-4xl md:text-5xl">Thanh toán</h1>
      <CheckoutForm paymentDetails={paymentDetails} />
    </div>
  )
}
