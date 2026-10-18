import Link from 'next/link'
import { PAYMENT_STATUSES, ORDER_STATUSES } from '@/lib/admin-types'
import { formatPrice } from '@/lib/format'

export type CustomerOrderStatus = {
  id: string
  code: string
  status: string
  payment_status: string
  total: number
  created_at: string
}

export function CustomerOrderStatuses({
  orders,
  title = 'Đơn hàng gần đây',
}: {
  orders: CustomerOrderStatus[]
  title?: string
}) {
  return (
    <section className="mt-10 border-t border-border pt-8">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-2xl">{title}</h2>
        <Link href="/tai-khoan" className="text-sm underline underline-offset-4">Tài khoản</Link>
      </div>
      {orders.length === 0 ? (
        <p className="border border-border bg-background px-5 py-6 text-sm text-muted-foreground">
          Chưa có đơn hàng để theo dõi. Trạng thái sẽ xuất hiện tại đây sau khi bạn đặt hàng.
        </p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {orders.map((order) => {
            const orderStatus = ORDER_STATUSES[order.status] ?? { label: order.status, badgeClass: 'bg-neutral-100 text-neutral-700' }
            const paymentStatus = PAYMENT_STATUSES[order.payment_status] ?? { label: order.payment_status, badgeClass: 'bg-neutral-100 text-neutral-700' }
            return (
              <li key={order.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Mã đơn {order.code}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{order.created_at} · {formatPrice(order.total)}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-3 py-1.5 ${orderStatus.badgeClass}`}>Đơn hàng: {orderStatus.label}</span>
                  <span className={`rounded-full px-3 py-1.5 ${paymentStatus.badgeClass}`}>Thanh toán: {paymentStatus.label}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
