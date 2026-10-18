import type { RowDataPacket } from "mysql2/promise";
import { AdminShell } from "@/components/admin/admin-shell";
import { OrdersManager } from "@/components/admin/orders-manager";
import pool from "@/lib/db";
import type {
  AdminOrder,
  AdminOrderItem,
  AdminVariant,
  CustomerOption,
} from "@/lib/admin-types";

async function getOrders(): Promise<AdminOrder[]> {
  try {
    const [[orderRows], [itemRows]] = await Promise.all([
      pool.query<RowDataPacket[]>(
        `SELECT
          o.id, o.code, o.user_id, o.recipient_name, o.phone, o.email, o.shipping_address, o.note,
          o.subtotal, o.shipping_fee, o.discount_amount, o.total,
          o.status, o.payment_method, o.payment_status,
          DATE_FORMAT(o.created_at, '%d/%m/%Y %H:%i') AS created_at
        FROM orders o
        ORDER BY o.created_at DESC`,
      ),
      pool.query<RowDataPacket[]>(
        `SELECT id, order_id, product_name, color_name, size_name, unit_price, quantity
         FROM order_items ORDER BY id`,
      ),
    ]);

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

    return orderRows.map((r) => ({
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
  } catch (error) {
    console.error("Admin orders error:", error);
    return [];
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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, orders, variants, customers] = await Promise.all([
    searchParams,
    getOrders(),
    getVariants(),
    getCustomerOptions(),
  ]);

  return (
    <AdminShell activeHref="/admin/don-hang" breadcrumb="Cửa hàng / Đơn hàng" title="Đơn hàng">
      <OrdersManager
        orders={orders}
        variants={variants}
        customers={customers}
        initialQuery={typeof q === "string" ? q : ""}
      />
      <footer className="py-8 text-center text-xs text-neutral-400">
        © 2026 MỘC Studio · Admin Dashboard
      </footer>
    </AdminShell>
  );
}
