import assert from "node:assert/strict";
import test from "node:test";
import { calculateOrderAmounts, canLoginWith, hasAdminAccess, hasStockForOrder, normalizeEmail } from "../lib/critical-rules";

test("login trims and normalizes email and rejects missing credentials", () => {
  assert.equal(normalizeEmail("  Customer@Example.COM "), "customer@example.com");
  assert.equal(canLoginWith(" customer@example.com ", "password"), true);
  assert.equal(canLoginWith("", "password"), false);
  assert.equal(canLoginWith("customer@example.com", ""), false);
});

test("order total includes shipping and subtracts a bounded coupon discount", () => {
  assert.deepEqual(calculateOrderAmounts(500_000, 100_000), { shippingFee: 30_000, discountAmount: 100_000, total: 430_000 });
  assert.deepEqual(calculateOrderAmounts(1_000_000, 1_200_000), { shippingFee: 0, discountAmount: 1_000_000, total: 0 });
  assert.deepEqual(calculateOrderAmounts(0, 0), { shippingFee: 0, discountAmount: 0, total: 0 });
});

test("inventory guard rejects overselling and invalid quantities", () => {
  assert.equal(hasStockForOrder(3, 3), true);
  assert.equal(hasStockForOrder(2, 3), false);
  assert.equal(hasStockForOrder(2, 0), false);
  assert.equal(hasStockForOrder(-1, 1), false);
});

test("admin guard only grants the admin role", () => {
  assert.equal(hasAdminAccess("admin"), true);
  assert.equal(hasAdminAccess("customer"), false);
  assert.equal(hasAdminAccess(null), false);
});
