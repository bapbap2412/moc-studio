import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, formatPrice } from '@/lib/format'

export function getShippingFee(subtotal: number) {
  return subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE
}

export function OrderSummary({ subtotal, children }: { subtotal: number; children?: React.ReactNode }) {
  const shipping = getShippingFee(subtotal)
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal

  return (
    <div className="flex flex-col gap-4 bg-secondary p-6">
      <h2 className="font-serif text-2xl">Tóm tắt đơn hàng</h2>
      {remaining > 0 && subtotal > 0 && (
        <div>
          <p className="text-xs text-muted-foreground">
            Mua thêm <span className="font-medium text-foreground">{formatPrice(remaining)}</span> để được miễn phí giao hàng
          </p>
          <div className="mt-2 h-1 bg-border" aria-hidden="true">
            <div className="h-full bg-accent" style={{ width: `${(subtotal / FREE_SHIPPING_THRESHOLD) * 100}%` }} />
          </div>
        </div>
      )}
      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Tạm tính</dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Phí vận chuyển</dt>
          <dd>{shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-medium">
          <dt>Tổng cộng</dt>
          <dd>{formatPrice(subtotal + shipping)}</dd>
        </div>
      </dl>
      {children}
    </div>
  )
}
