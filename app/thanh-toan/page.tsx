import type { Metadata } from 'next'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { isVnpayConfigured } from '@/lib/vnpay'

export const metadata: Metadata = { title: 'Thanh toán' }
export const dynamic = 'force-dynamic'

export default function CheckoutPage() {
  const paymentDetails = {
    bankName: process.env.BANK_NAME ?? '',
    bankAccount: process.env.BANK_ACCOUNT_NO ?? '',
    bankAccountName: process.env.BANK_ACCOUNT_NAME ?? '',
    vnpayEnabled: isVnpayConfigured(),
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 md:px-8">
      <h1 className="font-serif text-4xl md:text-5xl">Thanh toán</h1>
      <CheckoutForm paymentDetails={paymentDetails} />
    </div>
  )
}
