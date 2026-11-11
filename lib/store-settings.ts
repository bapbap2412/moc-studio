import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { dbErrorCode } from "@/lib/admin-server";

export type StoreSettings = {
  tagline: string;
  hotline: string;
  storeAddress: string;
  shippingFee: number;
  freeShippingThreshold: number;
  returnDays: number;
  returnPolicy: string;
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  tagline: "Thời trang tối giản từ chất liệu tự nhiên. Thiết kế tại Sài Gòn, may thủ công bởi những người thợ Việt.",
  hotline: "02838505520",
  storeAddress: "180 Cao Lỗ, Phường Chánh Hưng, Hồ Chí Minh, Việt Nam",
  shippingFee: 30_000,
  freeShippingThreshold: 1_000_000,
  returnDays: 30,
  returnPolicy: "Khách hàng được hỗ trợ đổi trả trong vòng 30 ngày. Đổi size hoặc trả hàng theo điều kiện áp dụng của cửa hàng.",
};

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT tagline, hotline, store_address, shipping_fee, free_shipping_threshold, return_days, return_policy FROM store_settings WHERE id=1 LIMIT 1",
    );
    const row = rows[0];
    if (!row) return DEFAULT_STORE_SETTINGS;
    return {
      tagline: String(row.tagline),
      hotline: String(row.hotline),
      storeAddress: String(row.store_address),
      shippingFee: Number(row.shipping_fee),
      freeShippingThreshold: Number(row.free_shipping_threshold),
      returnDays: Number(row.return_days),
      returnPolicy: String(row.return_policy),
    };
  } catch (error) {
    if (dbErrorCode(error) === "ER_NO_SUCH_TABLE") return DEFAULT_STORE_SETTINGS;
    throw error;
  }
}
