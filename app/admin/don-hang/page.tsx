import type { RowDataPacket } from "mysql2/promise";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { OrdersManager } from "@/components/admin/orders-manager";
import pool from "@/lib/db";
import { getStoreSettings } from "@/lib/store-settings";
import type {
  AdminOrder,
  AdminOrderItem,
  AdminVariant,
  CustomerOption,
} from "@/lib/admin-types";

const PAGE_SIZE = 25;

async function getOrders(search: string, requestedPage: number, status: string, payment: string): Promise<{
  orders: AdminOrder[];
  total: number;
  page: number;
}> {
  try {
    const conditions: string[] = [];
    const searchParams: string[] = [];
    if (search) {
      conditions.push("(o.code LIKE ? OR o.recipient_name LIKE ? OR o.phone LIKE ? OR o.email LIKE ?)");
      const pattern = `%${search}%`;
      searchParams.push(pattern, pattern, pattern, pattern);
    }
    if (["pending", "confirmed", "shipping", "completed", "cancelled"].includes(status)) {
      conditions.push("o.status = ?");
      searchParams.push(status);
    }
    if (["unpaid", "paid", "refunded"].includes(payment)) {
      conditions.push("o.payment_status = ?");
      searchParams.push(payment);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM orders o ${where}`,
      searchParams,
    );
    const total = Number(countRows[0]?.total ?? 0);
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(Math.max(1, requestedPage), pageCount);
    const offset = (page - 1) * PAGE_SIZE;
    const [orderRows] = await pool.query<RowDataPacket[]>(
      `SELECT
          o.id, o.code, o.user_id, o.recipient_name, o.phone, o.email, o.shipping_address, o.note,
          o.subtotal, o.shipping_fee, o.discount_amount, o.total,
          o.status, o.payment_method, o.payment_status,
          DATE_FORMAT(o.created_at, '%d/%m/%Y %H:%i') AS created_at
        FROM orders o
        ${where}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?`,
      [...searchParams, PAGE_SIZE, offset],
    );

    const orderIds = orderRows.map((row) => String(row.id));
    let itemRows: RowDataPacket[] = [];
    if (orderIds.length) {
      [itemRows] = await pool.query<RowDataPacket[]>(
        "SELECT id, order_id, product_name, color_name, size_name, unit_price, quantity FROM order_items WHERE order_id IN (?) ORDER BY id",
        [orderIds],
      );
    }

    const itemsByOrder = new Map<string, AdminOrderItem[]>();
    for (const r of itemRows) {
      const list = itemsByOrder.get(String(r.order_id)) ?? [];
      list.push({
        id: Number(r.id),
        product_name: r.product_name,
        color_name: r.color_name,
        size_name: r.size_name,
        unit_price: Number(r.unit_price),
        quantity: Number(r.quantity),
      });
      itemsByOrder.set(String(r.order_id), list);
    }

    const orders = orderRows.map((r) => ({
      id: String(r.id),
      code: r.code,
      user_id: r.user_id ? String(r.user_id) : null,
      recipient_name: r.recipient_name,
      phone: r.phone,
      email: r.email,
      shipping_address: r.shipping_address ?? "",
      note: r.note ?? null,
      subtotal: Number(r.subtotal),
      shipping_fee: Number(r.shipping_fee),
      discount_amount: Number(r.discount_amount),
      total: Number(r.total),
      status: r.status,
      payment_method: r.payment_method,
      payment_status: r.payment_status,
      created_at: r.created_at,
      items: itemsByOrder.get(String(r.id)) ?? [],
    }));
    return { orders, total, page };
  } catch (error) {
    console.error("Admin orders error:", error);
    return { orders: [], total: 0, page: 1 };
  }
}

async function getVariants(): Promise<AdminVariant[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT pv.id, pv.sku, pv.stock_quantity, p.name AS product_name,
        COALESCE(c.name, '—') AS color_name, COALESCE(s.name, '—') AS size_name,
        COALESCE(pv.price_override, p.sale_price, p.base_price) AS price
       FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       LEFT JOIN colors c ON c.id = pv.color_id
       LEFT JOIN sizes s ON s.id = pv.size_id
       WHERE p.status = 'active'
       ORDER BY p.name, c.name, s.sort_order`,
    );
    return rows.map((r) => ({
      id: String(r.id),
      sku: r.sku,
      product_name: r.product_name,
      color_name: r.color_name,
      size_name: r.size_name,
      price: Number(r.price),
      stock: Number(r.stock_quantity),
    }));
  } catch (error) {
    console.error("Admin variants error:", error);
    return [];
  }
}

async function getCustomerOptions(): Promise<CustomerOption[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, full_name, email, phone FROM users WHERE role = 'customer' ORDER BY full_name",
    );
    return rows.map((r) => ({
      id: String(r.id),
      full_name: r.full_name,
      email: r.email,
      phone: r.phone ?? null,
    }));
  } catch (error) {
    console.error("Admin customer options error:", error);
    return [];
  }
}

async function getOrderSummary() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total_orders,
      SUM(status = 'pending') AS pending_count,
      SUM(status = 'completed') AS completed_count,
      COALESCE(SUM(CASE WHEN status <> 'cancelled' AND payment_status = 'paid' THEN total ELSE 0 END), 0) AS paid_revenue
     FROM orders`,
  );
  const row = rows[0] ?? {};
  return {
    totalOrders: Number(row.total_orders ?? 0),
    pendingCount: Number(row.pending_count ?? 0),
    completedCount: Number(row.completed_count ?? 0),
    paidRevenue: Number(row.paid_revenue ?? 0),
  };
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string; payment?: string }>;
}) {
  const { q, page, status, payment } = await searchParams;
  const currentStatus = typeof status === "string" && ["pending", "confirmed", "shipping", "completed", "cancelled"].includes(status) ? status : "all";
  const currentPayment = typeof payment === "string" && ["unpaid", "paid", "refunded"].includes(payment) ? payment : "all";
  const [paginatedOrders, summary, variants, customers, storeSettings] = await Promise.all([
    getOrders(typeof q === "string" ? q.trim().slice(0, 100) : "", Number(page) || 1, currentStatus, currentPayment),
    getOrderSummary(),
    getVariants(),
    getCustomerOptions(),
    getStoreSettings(),
  ]);

  return (
    <AdminShell activeHref="/admin/don-hang" breadcrumb="Cửa hàng / Đơn hàng" title="Đơn hàng">
      <OrdersManager
        orders={paginatedOrders.orders}
        variants={variants}
        customers={customers}
        initialQuery={typeof q === "string" ? q : ""}
        initialStatus={currentStatus}
        initialPayment={currentPayment}
        totalOrders={paginatedOrders.total}
        currentPage={paginatedOrders.page}
        pageSize={PAGE_SIZE}
        summary={summary}
        shippingFee={storeSettings.shippingFee}
        freeShippingThreshold={storeSettings.freeShippingThreshold}
      />
      <footer className="py-8 text-center text-xs text-neutral-400">
        © 2026 MỘC Studio · Admin Dashboard
      </footer>
    </AdminShell>
  );
}
