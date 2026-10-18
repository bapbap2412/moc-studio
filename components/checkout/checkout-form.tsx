'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { OrderSummary } from '@/components/cart/order-summary'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { submitCustomerOrder } from '@/app/thanh-toan/actions'

const paymentMethods = [
  { value: 'cod', label: 'Thanh toán khi nhận hàng (COD)', note: 'Trả tiền mặt khi nhận hàng' },
  { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng', note: 'Thông tin tài khoản sẽ được gửi qua email' },
  { value: 'ewallet', label: 'Ví điện tử (MoMo, ZaloPay)', note: 'Quét mã QR để thanh toán' },
]

const inputClass =
  'h-11 w-full border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/30'

type Province = { code: number; name: string }
type Ward = { code: number; name: string }

function Field({ id, label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </label>
      <input id={id} name={id} className={inputClass} {...props} />
    </div>
  )
}

export function CheckoutForm() {
  const { items, subtotal, clear } = useCart()
  const [payment, setPayment] = useState('cod')
  const [orderCode, setOrderCode] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [provinces, setProvinces] = useState<Province[]>([])
  const [provinceCode, setProvinceCode] = useState('')
  const [provinceName, setProvinceName] = useState('')
  const [wards, setWards] = useState<Ward[]>([])
  const [wardName, setWardName] = useState('')
  const [loadingProvinces, setLoadingProvinces] = useState(true)
  const [loadingWards, setLoadingWards] = useState(false)
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    fetch('https://provinces.open-api.vn/api/v2/p/', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Không thể tải danh sách tỉnh thành.')
        return response.json() as Promise<Province[]>
      })
      .then(setProvinces)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') {
          setLocationError('Không tải được danh sách địa chỉ. Vui lòng tải lại trang để thử lại.')
        }
      })
      .finally(() => setLoadingProvinces(false))

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!provinceCode) {
      setWards([])
      setLoadingWards(false)
      return
    }

    const controller = new AbortController()
    setLoadingWards(true)
    setLocationError('')

    fetch(`https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Không thể tải danh sách phường xã.')
        return response.json() as Promise<{ wards?: Ward[] }>
      })
      .then((province) => setWards(province.wards ?? []))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') {
          setWards([])
          setLocationError('Không tải được danh sách phường xã. Vui lòng chọn lại tỉnh thành.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingWards(false)
      })

    return () => controller.abort()
  }, [provinceCode])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setSubmitError('')

    const formData = new FormData(e.currentTarget)
    formData.set('items', JSON.stringify(items.map(({ variantId, quantity }) => ({ variantId, quantity }))))

    try {
      const result = await submitCustomerOrder(formData)
      if (!result.ok) {
        setSubmitError(result.message)
        return
      }
      setOrderCode(result.code)
      clear()
    } catch {
      setSubmitError('Không thể kết nối máy chủ để đặt hàng. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  if (orderCode) {
    return (
      <div className="mt-10 flex flex-col items-center gap-4 bg-secondary px-6 py-20 text-center">
        <CheckCircle2 className="size-10 text-accent" aria-hidden="true" />
        <p className="font-serif text-3xl">Cảm ơn bạn đã đặt hàng!</p>
        <p className="text-sm text-muted-foreground">
          Mã đơn hàng của bạn là <span className="font-medium text-foreground">{orderCode}</span>. Chúng tôi sẽ liên hệ để xác
          nhận trong thời gian sớm nhất.
        </p>
        <p className="text-sm text-muted-foreground">Trạng thái đơn: Đang xử lý · Thanh toán: Chưa thanh toán</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link href="/tai-khoan" className="inline-flex h-12 items-center border border-border px-7 text-sm font-medium hover:bg-background">
            Theo dõi đơn hàng
          </Link>
          <Link href="/san-pham" className="inline-flex h-12 items-center bg-primary px-7 text-sm font-medium text-primary-foreground hover:bg-primary/85">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center gap-4 border border-dashed border-border py-24 text-center">
        <p className="font-serif text-2xl">Chưa có sản phẩm để thanh toán</p>
        <Link href="/san-pham" className="text-sm underline underline-offset-4">
          Quay lại cửa hàng
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-10">
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-4 font-serif text-2xl">Thông tin giao hàng</legend>
          <Field id="fullName" label="Họ và tên" required autoComplete="name" className="sm:col-span-2" />
          <Field id="phone" label="Số điện thoại" type="tel" required autoComplete="tel" pattern="0[0-9]{9}" title="Số điện thoại gồm 10 chữ số, bắt đầu bằng 0" />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="province" className="text-xs text-muted-foreground">Tỉnh / Thành phố</label>
            <select
              id="province"
              name="province"
              required
              autoComplete="address-level1"
              className={inputClass}
              value={provinceName}
              disabled={loadingProvinces || provinces.length === 0}
              onChange={(event) => {
                const selectedProvince = provinces.find((province) => province.name === event.target.value)
                setProvinceName(selectedProvince?.name ?? '')
                setProvinceCode(selectedProvince ? String(selectedProvince.code) : '')
                setWardName('')
              }}
            >
              <option value="">{loadingProvinces ? 'Đang tải tỉnh thành...' : 'Chọn tỉnh / thành phố'}</option>
              {provinces.map((province) => (
                <option key={province.code} value={province.name}>{province.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ward" className="text-xs text-muted-foreground">Phường / Xã / Đặc khu</label>
            <select
              id="ward"
              name="ward"
              required
              autoComplete="address-level2"
              className={inputClass}
              disabled={!provinceCode || loadingWards || wards.length === 0}
              value={wardName}
              onChange={(event) => setWardName(event.target.value)}
            >
              <option value="">
                {!provinceCode ? 'Chọn tỉnh / thành phố trước' : loadingWards ? 'Đang tải phường / xã...' : 'Chọn phường / xã'}
              </option>
              {wards.map((ward) => (
                <option key={ward.code} value={ward.name}>{ward.name}</option>
              ))}
            </select>
          </div>
          {locationError && <p role="alert" className="text-xs text-destructive sm:col-span-2">{locationError}</p>}
          <Field id="street" label="Số nhà, tên đường" required autoComplete="street-address" />
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="note" className="text-xs text-muted-foreground">
              Ghi chú (không bắt buộc)
            </label>
            <textarea id="note" name="note" rows={3} className={cn(inputClass, 'h-auto py-2.5')} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-4 font-serif text-2xl">Phương thức thanh toán</legend>
          <div className="flex flex-col gap-3">
            {paymentMethods.map((m) => (
              <label
                key={m.value}
                className={cn(
                  'flex cursor-pointer items-start gap-3 border p-4 transition-colors',
                  payment === m.value ? 'border-foreground' : 'border-border hover:border-foreground/40',
                )}
              >
                <input
                  type="radio"
                  name="payment"
                  value={m.value}
                  checked={payment === m.value}
                  onChange={() => setPayment(m.value)}
                  className="mt-0.5 size-4 accent-[var(--foreground)]"
                />
                <span>
                  <span className="block text-sm font-medium">{m.label}</span>
                  <span className="block text-xs text-muted-foreground">{m.note}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="lg:sticky lg:top-32 lg:self-start">
        <OrderSummary subtotal={subtotal}>
          <ul className="flex flex-col gap-3 border-t border-border pt-4">
            {items.map((item) => (
              <li key={item.variantId} className="flex items-center gap-3">
                <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden bg-muted">
                  <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                </div>
                <div className="flex-1 text-xs">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted-foreground">
                    {item.colorName} / {item.sizeName} × {item.quantity}
                  </p>
                </div>
                <p className="text-xs">{formatPrice(item.unitPrice * item.quantity)}</p>
              </li>
            ))}
          </ul>
          {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="h-12 bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
          </button>
        </OrderSummary>
      </div>
    </form>
  )
}
