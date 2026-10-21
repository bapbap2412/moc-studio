import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(root, ".env.local") });

const host = process.env.TEST_DB_HOST ?? process.env.DB_HOST ?? "127.0.0.1";
if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
  throw new Error("Integration tests require a local MySQL host. Set TEST_DB_HOST to localhost.");
}
const port = Number(process.env.TEST_DB_PORT ?? process.env.DB_PORT ?? 3306);
const user = process.env.TEST_DB_USER ?? process.env.DB_USER ?? "root";
const password = process.env.TEST_DB_PASSWORD ?? process.env.DB_PASSWORD ?? "";
const dbName = `moc_it_${Date.now().toString(36)}`;
const appPort = 32000 + (Date.now() % 20000);
const baseUrl = `http://127.0.0.1:${appPort}`;
const customerEmail = `customer-${dbName}@example.test`;
const adminEmail = `admin-${dbName}@example.test`;
const testPassword = "IntegrationPass123!";
let adminConnection;
let appProcess;
let testConnection;
let cleanupRequired = false;

function log(name) { process.stdout.write(`\n[RUN] ${name}\n`); }
function ok(name) { process.stdout.write(`[PASS] ${name}\n`); }
function id() { return randomUUID(); }

async function applySqlFile(conn, file) {
  const source = await readFile(path.join(root, file), "utf8");
  const statements = source.split(/;\s*(?:\r?\n|$)/).map((statement) => statement.trim()).filter(Boolean);
  for (const statement of statements) await conn.query(statement);
}

async function waitForApp() {
  const until = Date.now() + 90_000;
  while (Date.now() < until) {
    if (appProcess.exitCode !== null) throw new Error(`Next server exited (${appProcess.exitCode}).`);
    try {
      const response = await fetch(`${baseUrl}/api/auth/me`, { signal: AbortSignal.timeout(2000) });
      if (response.status < 500) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Next server did not become ready within 90 seconds.");
}

async function login(email, passwordText = testPassword) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: passwordText }),
  });
  return { response, cookie: response.headers.get("set-cookie")?.match(/moc_studio_session=[^;]+/)?.[0] ?? "" };
}

function checkoutForm({ variantId, quantity = 1, couponCode = "", payment = "cod" }) {
  const form = new FormData();
  form.set("fullName", "Integration Customer");
  form.set("phone", "0901234567");
  form.set("province", "Ho Chi Minh City");
  form.set("ward", "Ward Test");
  form.set("street", "1 Test Street");
  form.set("note", "Integration test order");
  form.set("payment", payment);
  form.set("couponCode", couponCode);
  form.set("items", JSON.stringify([{ variantId, quantity }]));
  return form;
}

function canonicalVnpay(params) {
  return Object.keys(params).filter((key) => key.startsWith("vnp_") && key !== "vnp_SecureHash" && key !== "vnp_SecureHashType")
    .sort().map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`).join("&");
}

function signedVnpay(params) {
  const signed = { ...params };
  signed.vnp_SecureHash = createHmac("sha512", "vnpay-test-secret").update(canonicalVnpay(signed), "utf8").digest("hex");
  return signed;
}

async function checkout(cookie, input) {
  return fetch(`${baseUrl}/api/checkout`, {
    method: "POST",
    headers: { Cookie: cookie, Origin: baseUrl },
    body: checkoutForm(input),
  });
}

try {
  adminConnection = await mysql.createConnection({ host, port, user, password, charset: "utf8mb4" });
  await adminConnection.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  cleanupRequired = true;
  testConnection = await mysql.createConnection({ host, port, user, password, database: dbName, charset: "utf8mb4" });

  for (const file of [
    "scripts/001_create_schema.sql",
    "scripts/002_add_children_category.sql",
    "scripts/003_add_product_type.sql",
    "scripts/004_refine_accessory_product_types.sql",
    "scripts/005_make_address_district_optional.sql",
    "scripts/006_add_product_is_new.sql",
    "scripts/007_reduce_product_prices.sql",
  ]) await applySqlFile(testConnection, file);

  const customerId = id();
  const adminId = id();
  const passwordHash = await bcrypt.hash(testPassword, 4);
  await testConnection.execute("INSERT INTO users (id,email,password_hash,full_name,phone,role) VALUES (?,?,?,?,?,'customer')", [customerId, customerEmail, passwordHash, "Integration Customer", "0901234567"]);
  await testConnection.execute("INSERT INTO users (id,email,password_hash,full_name,phone,role) VALUES (?,?,?,?,?,'admin')", [adminId, adminEmail, passwordHash, "Integration Admin", "0901234568"]);

  const productId = id();
  await testConnection.execute(
    `INSERT INTO products (id,category_id,product_type,name,slug,description,base_price,sale_price,gender,status,is_featured,is_new)
     VALUES (?,1,'shirt','Integration Product',?,'Integration fixture',120000,100000,'unisex','active',0,0)`,
    [productId, `integration-${dbName}`],
  );
  const variants = Object.fromEntries(["coupon", "race", "bank", "wallet"].map((name) => [name, id()]));
  for (const [index, [name, variantId]] of Object.entries(variants).entries()) {
    const quantity = name === "race" ? 2 : 5;
    await testConnection.execute(
      "INSERT INTO product_variants (id,product_id,color_id,size_id,sku,stock_quantity) VALUES (?,?,1,?,?,?)",
      [variantId, productId, index + 1, `IT-${dbName}-${name}`, quantity],
    );
  }
  await testConnection.execute(
    `INSERT INTO coupons (code,discount_type,value,min_order_amount,max_discount,usage_limit,used_count,is_active)
     VALUES ('INTEGRATION10','percent',10,0,50000,1,0,1)`,
  );

  const appEnv = {
    ...process.env,
    NODE_ENV: "production",
    DB_HOST: host,
    DB_PORT: String(port),
    DB_USER: user,
    DB_PASSWORD: password,
    DB_NAME: dbName,
    SESSION_SECRET: "integration-test-secret-that-is-longer-than-thirty-two-characters",
    BANK_NAME: "Test Bank",
    BANK_ACCOUNT_NO: "000111222333",
    BANK_ACCOUNT_NAME: "MOC TEST ACCOUNT",
    VNPAY_ENVIRONMENT: "test",
    VNPAY_TMN_CODE: "VNPAY_TEST_TMN",
    VNPAY_HASH_SECRET: "vnpay-test-secret",
    VNPAY_TEST_PAYMENT_URL: `http://127.0.0.1:${appPort}/fake-vnpay-payment`,
    SITE_URL: baseUrl,
    PORT: String(appPort),
  };
  appProcess = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "start", "-p", String(appPort)], {
    cwd: root,
    env: appEnv,
    stdio: "ignore",
    windowsHide: true,
  });
  await waitForApp();

  log("Login and admin access");
  const badLogin = await login(customerEmail, "wrong-password");
  assert.equal(badLogin.response.status, 401);
  const customerLogin = await login(customerEmail);
  assert.equal(customerLogin.response.status, 200);
  assert.ok(customerLogin.cookie);
  const customerAdminPage = await fetch(`${baseUrl}/admin`, { headers: { Cookie: customerLogin.cookie }, redirect: "manual" });
  assert.equal(customerAdminPage.status, 307);
  const forbiddenUpload = await fetch(`${baseUrl}/api/admin/products/upload-image`, { method: "POST", headers: { Cookie: customerLogin.cookie, Origin: baseUrl }, body: new FormData() });
  assert.equal(forbiddenUpload.status, 403);
  const adminLogin = await login(adminEmail);
  assert.equal(adminLogin.response.status, 200);
  const allowedUploadWithoutFile = await fetch(`${baseUrl}/api/admin/products/upload-image`, { method: "POST", headers: { Cookie: adminLogin.cookie, Origin: baseUrl }, body: new FormData() });
  assert.equal(allowedUploadWithoutFile.status, 400);
  ok("bad/good login and customer/admin access control");

  log("Coupon checkout and payment totals");
  const crossOriginOrder = await fetch(`${baseUrl}/api/checkout`, { method: "POST", headers: { Cookie: customerLogin.cookie, Origin: "https://attacker.example" }, body: checkoutForm({ variantId: variants.coupon }) });
  assert.equal(crossOriginOrder.status, 403);
  const couponOrder = await checkout(customerLogin.cookie, { variantId: variants.coupon, quantity: 2, couponCode: "integration10" });
  assert.equal(couponOrder.status, 200, await couponOrder.clone().text());
  const couponResult = await couponOrder.json();
  assert.equal(couponResult.ok, true);
  const [orders] = await testConnection.execute("SELECT id,subtotal,shipping_fee,discount_amount,total,coupon_id,payment_status FROM orders WHERE code = ?", [couponResult.code]);
  assert.equal(orders.length, 1);
  assert.equal(Number(orders[0].subtotal), 200000);
  assert.equal(Number(orders[0].shipping_fee), 30000);
  assert.equal(Number(orders[0].discount_amount), 20000);
  assert.equal(Number(orders[0].total), 210000);
  assert.equal(orders[0].payment_status, "unpaid");
  const [couponRows] = await testConnection.execute("SELECT used_count FROM coupons WHERE code='INTEGRATION10'");
  assert.equal(Number(couponRows[0].used_count), 1);
  const exhaustedCoupon = await checkout(customerLogin.cookie, { variantId: variants.bank, couponCode: "INTEGRATION10" });
  assert.equal(exhaustedCoupon.status, 400);
  ok("coupon is revalidated, discounted, stored, and its usage limit enforced");

  log("Concurrent inventory checkout");
  const competing = await Promise.all([
    checkout(customerLogin.cookie, { variantId: variants.race, quantity: 2 }),
    checkout(customerLogin.cookie, { variantId: variants.race, quantity: 2 }),
  ]);
  assert.deepEqual(competing.map((response) => response.status).sort(), [200, 400]);
  const [raceStock] = await testConnection.execute("SELECT stock_quantity FROM product_variants WHERE id = ?", [variants.race]);
  assert.equal(Number(raceStock[0].stock_quantity), 0);
  const [raceOrderCount] = await testConnection.execute("SELECT COUNT(*) AS total FROM order_items WHERE variant_id = ?", [variants.race]);
  assert.equal(Number(raceOrderCount[0].total), 1);
  ok("simultaneous orders cannot oversell the final two units");

  log("Wishlist and post-delivery reviews");
  const wishlistFirst = await fetch(`${baseUrl}/api/wishlist`, { method: "POST", headers: { Cookie: customerLogin.cookie, Origin: baseUrl, "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
  assert.equal(wishlistFirst.status, 200);
  assert.equal((await wishlistFirst.json()).saved, true);
  const crossOriginWishlist = await fetch(`${baseUrl}/api/wishlist`, { method: "POST", headers: { Cookie: customerLogin.cookie, Origin: "invalid-origin" }, body: JSON.stringify({ productId }) });
  assert.equal(crossOriginWishlist.status, 403);
  const wishlistSecond = await fetch(`${baseUrl}/api/wishlist`, { method: "POST", headers: { Cookie: customerLogin.cookie, Origin: baseUrl, "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
  assert.equal((await wishlistSecond.json()).saved, false);
  const reviewUrl = `${baseUrl}/api/san-pham/${productId}/reviews`;
  const earlyReview = await fetch(reviewUrl, { method: "POST", headers: { Cookie: customerLogin.cookie, Origin: baseUrl, "Content-Type": "application/json" }, body: JSON.stringify({ slug: `integration-${dbName}`, rating: 5, comment: "Too early" }) });
  assert.equal((await earlyReview.json()).ok, false);
  await testConnection.execute("UPDATE orders SET status='completed' WHERE id = ?", [orders[0].id]);
  const validReview = await fetch(reviewUrl, { method: "POST", headers: { Cookie: customerLogin.cookie, Origin: baseUrl, "Content-Type": "application/json" }, body: JSON.stringify({ slug: `integration-${dbName}`, rating: 4, comment: "Delivered and tested" }) });
  assert.equal((await validReview.json()).ok, true);
  const duplicateReview = await fetch(reviewUrl, { method: "POST", headers: { Cookie: customerLogin.cookie, Origin: baseUrl, "Content-Type": "application/json" }, body: JSON.stringify({ slug: `integration-${dbName}`, rating: 5, comment: "Updated review" }) });
  assert.equal((await duplicateReview.json()).ok, true);
  const [reviewRows] = await testConnection.execute("SELECT rating,comment FROM reviews WHERE product_id=? AND user_id=?", [productId, customerId]);
  assert.equal(reviewRows.length, 1);
  assert.equal(Number(reviewRows[0].rating), 5);
  assert.equal(reviewRows[0].comment, "Updated review");
  ok("wishlist toggles and reviews require a delivered order; repeat review updates existing row");

  log("Bank transfer and VNPay signature/IPN flow");
  const checkoutPage = await fetch(`${baseUrl}/thanh-toan`);
  const checkoutHtml = await checkoutPage.text();
  assert.ok(checkoutHtml.includes("Test Bank"));
  assert.ok(checkoutHtml.includes("000111222333"));
  assert.ok(checkoutHtml.includes("MOC TEST ACCOUNT"));
  assert.ok(checkoutHtml.includes("vnpayEnabled") && checkoutHtml.includes("true"));
  const bankOrder = await checkout(customerLogin.cookie, { variantId: variants.bank, payment: "bank_transfer" });
  assert.equal(bankOrder.status, 200, await bankOrder.clone().text());
  const bankResult = await bankOrder.json();
  const walletOrder = await checkout(customerLogin.cookie, { variantId: variants.wallet, payment: "ewallet" });
  assert.equal(walletOrder.status, 200, await walletOrder.clone().text());
  const walletResult = await walletOrder.json();
  const paymentUrl = new URL(walletResult.paymentUrl);
  assert.equal(paymentUrl.origin, `http://127.0.0.1:${appPort}`);
  assert.equal(paymentUrl.pathname, "/fake-vnpay-payment");
  const paymentParams = Object.fromEntries(paymentUrl.searchParams.entries());
  assert.equal(paymentParams.vnp_TmnCode, "VNPAY_TEST_TMN");
  assert.equal(paymentParams.vnp_TxnRef, walletResult.code);
  assert.equal(paymentParams.vnp_Version, "2.1.0");
  assert.equal(paymentParams.vnp_SecureHash, signedVnpay(Object.fromEntries(Object.entries(paymentParams).filter(([key]) => key !== "vnp_SecureHash"))).vnp_SecureHash);
  const [paymentRows] = await testConnection.execute("SELECT payment_method,payment_status FROM orders WHERE code IN (?,?) ORDER BY payment_method", [bankResult.code, walletResult.code]);
  assert.equal(paymentRows.length, 2);
  assert.deepEqual(paymentRows.map((row) => row.payment_status), ["unpaid", "unpaid"]);
  assert.deepEqual(paymentRows.map((row) => row.payment_method), ["bank_transfer", "ewallet"]);
  const [walletDetails] = await testConnection.execute("SELECT total,payment_status FROM orders WHERE code=?", [walletResult.code]);
  const ipnUrl = `${baseUrl}/api/payments/vnpay/ipn`;
  const notificationFields = {
    vnp_TmnCode: "VNPAY_TEST_TMN", vnp_TxnRef: walletResult.code,
    vnp_Amount: String(Number(walletDetails[0].total) * 100), vnp_CurrCode: "VND",
    vnp_OrderInfo: `Thanh toan don hang ${walletResult.code}`, vnp_TransactionNo: "12345678",
    vnp_BankCode: "NCB", vnp_PayDate: "20261021120000", vnp_CardType: "ATM",
  };
  const returnParams = signedVnpay({ ...notificationFields, vnp_ResponseCode: "00", vnp_TransactionStatus: "00" });
  const browserReturn = await fetch(`${baseUrl}/api/payments/vnpay/return?${new URLSearchParams(returnParams)}`, { redirect: "manual" });
  assert.equal(browserReturn.status, 307);
  assert.match(browserReturn.headers.get("location"), /payment=processing/);
  const tamperedReturn = { ...returnParams, vnp_SecureHash: "0".repeat(128) };
  const invalidBrowserReturn = await fetch(`${baseUrl}/api/payments/vnpay/return?${new URLSearchParams(tamperedReturn)}`, { redirect: "manual" });
  assert.match(invalidBrowserReturn.headers.get("location"), /payment=unverified/);
  const [unpaidAfterReturn] = await testConnection.execute("SELECT payment_status FROM orders WHERE code=?", [walletResult.code]);
  assert.equal(unpaidAfterReturn[0].payment_status, "unpaid");

  const invalidIpn = signedVnpay({ ...notificationFields, vnp_ResponseCode: "00", vnp_TransactionStatus: "00" });
  invalidIpn.vnp_SecureHash = "0".repeat(128);
  const invalidNotification = await fetch(`${ipnUrl}?${new URLSearchParams(invalidIpn)}`);
  assert.equal((await invalidNotification.json()).RspCode, "97");
  const mismatchedAmount = signedVnpay({ ...notificationFields, vnp_Amount: String((Number(walletDetails[0].total) + 100) * 100), vnp_ResponseCode: "00", vnp_TransactionStatus: "00" });
  const mismatchNotification = await fetch(`${ipnUrl}?${new URLSearchParams(mismatchedAmount)}`);
  assert.equal((await mismatchNotification.json()).RspCode, "04");
  const failedNotification = await fetch(`${ipnUrl}?${new URLSearchParams(signedVnpay({ ...notificationFields, vnp_ResponseCode: "24", vnp_TransactionStatus: "02" }))}`);
  assert.equal((await failedNotification.json()).RspCode, "00");
  const [unpaidAfterFailure] = await testConnection.execute("SELECT payment_status FROM orders WHERE code=?", [walletResult.code]);
  assert.equal(unpaidAfterFailure[0].payment_status, "unpaid");
  const validIpn = signedVnpay({ ...notificationFields, vnp_ResponseCode: "00", vnp_TransactionStatus: "00" });
  const validNotification = await fetch(`${ipnUrl}?${new URLSearchParams(validIpn)}`);
  assert.equal((await validNotification.json()).RspCode, "00");
  const duplicateNotification = await fetch(`${ipnUrl}?${new URLSearchParams(validIpn)}`);
  assert.equal((await duplicateNotification.json()).RspCode, "02");
  const [paidAfterNotification] = await testConnection.execute("SELECT payment_status FROM orders WHERE code=?", [walletResult.code]);
  assert.equal(paidAfterNotification[0].payment_status, "paid");
  const paymentGuide = await (await fetch(`${baseUrl}/van-chuyen-thanh-toan`)).text();
  assert.match(paymentGuide, /VNPay/);
  ok("bank details, signed VNPay URLs and returns, IPN validation, and idempotent payment updates");

  const dbTestProduction = await fetch(`${baseUrl}/api/db-test`);
  assert.equal(dbTestProduction.status, 404);
  ok("database diagnostics are hidden in production mode");
  process.stdout.write("\nIntegration suite passed. Temporary test database will now be removed.\n");
} catch (error) {
  process.stderr.write(`\nIntegration test failed: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
} finally {
  if (appProcess && appProcess.exitCode === null) appProcess.kill();
  if (testConnection) await testConnection.end().catch(() => {});
  if (adminConnection) {
    if (cleanupRequired && process.env.TEST_KEEP_DB !== "1") await adminConnection.query(`DROP DATABASE IF EXISTS \`${dbName}\``).catch((error) => {
      process.stderr.write(`Could not remove temporary database ${dbName}: ${error.message}\n`);
      process.exitCode = 1;
    });
    await adminConnection.end().catch(() => {});
  }
}
