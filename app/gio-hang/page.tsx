import type { Metadata } from 'next'
import type { RowDataPacket } from 'mysql2/promise'
import { CartView } from '@/components/cart/cart-view'
import { CustomerOrderStatuses, type CustomerOrderStatus } from '@/components/orders/customer-order-statuses'
import { getSession } from '@/lib/session'
import pool from '@/lib/db'

export const metadata: Metadata = { title: 'Giỏ hàng' }

export default async function CartPage() {
  const session = await getSession()
  let recentOrders: CustomerOrderStatus[] = []

  if (session?.role === 'customer') {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, code, status, payment_status, total,
          DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') AS created_at
         FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
        [session.userId],
      )
      recentOrders = rows.map((row) => ({
        id: String(row.id),
        code: String(row.code),
        status: String(row.status),
        payment_status: String(row.payment_status),
        total: Number(row.total),
        created_at: String(row.created_at),
      }))
    } catch (error) {
      console.error('Cart order statuses error:', error)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 md:px-8">
      <h1 className="font-serif text-4xl md:text-5xl">Giỏ hàng</h1>
      <CartView />
      {session?.role === 'customer' && <CustomerOrderStatuses orders={recentOrders} title="Theo dõi đơn hàng" />}
    </div>
  )
}
