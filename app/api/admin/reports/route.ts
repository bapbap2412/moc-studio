import type { RowDataPacket } from "mysql2/promise";
import { recordAdminAudit } from "@/lib/admin-audit";
import { isAdmin } from "@/lib/admin-server";
import pool from "@/lib/db";

function csvCell(value: unknown) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const type = new URL(request.url).searchParams.get("type");
  if (!type) return Response.json({ error: "Unknown report" }, { status: 400 });
  const reports: Record<string, { filename: string; sql: string }> = {
    orders: { filename: "orders.csv", sql: `SELECT code, status, payment_status, payment_method, recipient_name, phone, email, subtotal, shipping_fee, discount_amount, total, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at FROM orders ORDER BY created_at DESC LIMIT 50000` },
    products: { filename: "products.csv", sql: `SELECT p.name, p.slug, c.name AS category, p.status, p.base_price, p.sale_price, COALESCE(SUM(pv.stock_quantity),0) AS stock FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN product_variants pv ON pv.product_id=p.id GROUP BY p.id ORDER BY p.name LIMIT 50000` },
    inventory: { filename: "inventory.csv", sql: `SELECT pv.sku, p.name AS product, c.name AS color, s.name AS size, pv.stock_quantity FROM product_variants pv JOIN products p ON p.id=pv.product_id JOIN colors c ON c.id=pv.color_id JOIN sizes s ON s.id=pv.size_id ORDER BY p.name, c.name, s.sort_order LIMIT 50000` },
    customers: { filename: "customers.csv", sql: `SELECT full_name, email, phone, DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at FROM users WHERE role='customer' ORDER BY created_at DESC LIMIT 50000` },
  };
  const report = reports[type];
  if (!report) return Response.json({ error: "Unknown report" }, { status: 400 });
  try {
    const [rows] = await pool.query<RowDataPacket[]>(report.sql);
    const headers = rows.length ? Object.keys(rows[0]) : type === "orders" ? ["code", "status", "payment_status", "payment_method", "recipient_name", "phone", "email", "subtotal", "shipping_fee", "discount_amount", "total", "created_at"] : [];
    const csv = [headers.map(csvCell).join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\r\n");
    await recordAdminAudit("report.export", type, null, { rows: rows.length });
    return new Response(`\uFEFF${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${report.filename}"`, "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin report export error:", error);
    return Response.json({ error: "Could not export report" }, { status: 500 });
  }
}
