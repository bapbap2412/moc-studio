import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "./format";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function canLoginWith(email: string, password: string) {
  return normalizeEmail(email).length > 0 && password.length > 0;
}

export function hasAdminAccess(role: string | null | undefined) {
  return role === "admin";
}

export function hasStockForOrder(stock: number, quantity: number) {
  return Number.isInteger(stock) && Number.isInteger(quantity) && stock >= 0 && quantity > 0 && stock >= quantity;
}

export function calculateOrderAmounts(subtotal: number, discount: number) {
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : subtotal > 0 ? SHIPPING_FEE : 0;
  const discountAmount = Math.min(Math.max(0, Math.floor(discount)), Math.max(0, Math.floor(subtotal)));
  return { shippingFee, discountAmount, total: Math.max(0, subtotal + shippingFee - discountAmount) };
}
