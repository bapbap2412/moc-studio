import mysql from "mysql2/promise";

const REQUIRED_CHECKS = [
  "chk_users_role", "chk_users_email", "chk_users_phone", "chk_users_full_name", "chk_users_password_hash", "chk_users_active",
  "chk_addresses_default", "chk_addresses_fields", "chk_addresses_phone",
  "chk_categories_fields", "chk_categories_sort_order", "chk_categories_parent",
  "chk_colors_hex_code", "chk_sizes_fields", "chk_sizes_sort_order",
  "chk_products_name", "chk_products_description", "chk_products_type", "chk_products_gender", "chk_products_status",
  "chk_products_price", "chk_products_flags", "chk_product_images_url",
  "chk_product_images_sort_order", "chk_product_variants_sku", "chk_product_variants_price",
  "chk_product_variants_stock", "chk_carts_single_owner", "chk_carts_session_token", "chk_cart_items_quantity",
  "chk_coupons_code", "chk_coupons_type", "chk_coupons_value", "chk_coupons_limits",
  "chk_coupons_dates", "chk_orders_code", "chk_orders_status", "chk_orders_payment_method",
  "chk_orders_payment_status", "chk_orders_completed_not_unpaid", "chk_orders_amounts", "chk_orders_contact",
  "chk_order_items_snapshot", "chk_order_items_price", "chk_order_items_quantity",
  "chk_reviews_rating", "chk_reviews_comment",
];

const REQUIRED_INDEXES = ["uq_addresses_single_default", "uq_order_items_variant"];
const REQUIRED_FOREIGN_KEYS = [
  "fk_product_colors_product", "fk_product_colors_color",
  "fk_variants_product_color", "fk_images_product_color",
];

function supportsEnforcedChecks(version: string, versionComment: string) {
  const isMariaDb = /mariadb/i.test(`${version} ${versionComment}`);
  const parsed = isMariaDb
    ? version.match(/(?:^5\.5\.5-)?(\d+)\.(\d+)\.(\d+)(?:-MariaDB)?/i)
    : version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!parsed) return false;
  const major = Number(parsed[1]);
  const minor = Number(parsed[2]);
  const patch = Number(parsed[3]);
  if (isMariaDb) return major > 10 || (major === 10 && minor >= 3);
  return major > 8 || (major === 8 && (minor > 0 || patch >= 16));
}

function fail(message: string) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

async function main() {
  if (process.env.NODE_ENV !== "production") {
    throw new Error("Set NODE_ENV=production in the target environment before running this preflight.");
  }

  const required = [
    "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME", "SESSION_SECRET",
    "SITE_URL", "BANK_NAME", "BANK_ACCOUNT_NO", "BANK_ACCOUNT_NAME",
    "VNPAY_ENVIRONMENT", "VNPAY_TMN_CODE", "VNPAY_HASH_SECRET",
  ];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) throw new Error(`Missing production variables: ${missing.join(", ")}`);

  const dbName = process.env.DB_NAME!;
  if (process.env.DB_USER!.toLowerCase() === "root") throw new Error("DB_USER must be a database-scoped application account, not root.");
  if (process.env.DB_PASSWORD === "change-me") throw new Error("DB_PASSWORD still uses the sample value.");
  if (process.env.SESSION_SECRET!.length < 32 || /replace-with|change-me|example/i.test(process.env.SESSION_SECRET!)) {
    throw new Error("SESSION_SECRET must be a unique random value at least 32 characters long.");
  }
  if (process.env.VNPAY_ENVIRONMENT !== "production") throw new Error("VNPAY_ENVIRONMENT must be production for a production preflight.");

  let siteUrl: URL;
  try { siteUrl = new URL(process.env.SITE_URL!); } catch { throw new Error("SITE_URL must be a valid public URL."); }
  if (siteUrl.protocol !== "https:") throw new Error("SITE_URL must use HTTPS.");
  if (/example|your-domain/i.test(siteUrl.hostname)) throw new Error("SITE_URL still uses a placeholder domain.");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbName,
    charset: "utf8mb4",
    connectTimeout: 10_000,
  });
  try {
    const [identityRows] = await connection.query<mysql.RowDataPacket[]>("SELECT DATABASE() AS database_name, CURRENT_USER() AS account, VERSION() AS version, @@version_comment AS version_comment");
    const identity = identityRows[0];
    if (identity.database_name !== dbName) throw new Error("Connected database does not match DB_NAME.");
    if (String(identity.account).split("@")[0].toLowerCase() === "root") throw new Error("MySQL resolved the connection to root; use a restricted application account.");
    if (!supportsEnforcedChecks(String(identity.version), String(identity.version_comment))) {
      throw new Error("Database must be MySQL 8.0.16+ or MariaDB 10.3+ to enforce the integrity CHECK constraints.");
    }

    const [grantRows] = await connection.query<mysql.RowDataPacket[]>("SHOW GRANTS");
    const grants = grantRows.map((row) => String(Object.values(row)[0]));
    const hasScopedGrant = grants.some((grant) => grant.includes(`ON \`${dbName}\`.*`) || grant.includes(`ON ${dbName}.*`));
    const hasBroadGrant = grants.some((grant) => grant.includes("ON *.*") && !grant.includes("USAGE ON *.*"));
    if (!hasScopedGrant || hasBroadGrant) throw new Error("MySQL account must have grants scoped to DB_NAME, without database-wide privileges.");

    const [adminRows] = await connection.execute<mysql.RowDataPacket[]>("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'");
    if (Number(adminRows[0].total) < 1) throw new Error("No admin account exists in the configured database.");

    const [tableRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = ? AND table_name IN ('orders','coupons','reviews','wishlists','product_variants','product_colors')`,
      [dbName],
    );
    const tables = new Set(tableRows.map((row) => String(row.table_name)));
    const requiredTables = ["orders", "coupons", "reviews", "wishlists", "product_variants", "product_colors"];
    const missingTables = requiredTables.filter((table) => !tables.has(table));
    if (missingTables.length) throw new Error(`Missing expected MySQL tables: ${missingTables.join(", ")}`);

    const [checkRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT constraint_name FROM information_schema.table_constraints
       WHERE table_schema = ? AND constraint_type = 'CHECK'`,
      [dbName],
    );
    const checkNames = new Set(checkRows.map((row) => String(row.constraint_name)));
    const missingChecks = REQUIRED_CHECKS.filter((name) => !checkNames.has(name));
    if (missingChecks.length) {
      throw new Error(`Missing integrity CHECK constraints; run migrations 009-011: ${missingChecks.join(", ")}`);
    }

    const [indexRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT DISTINCT index_name FROM information_schema.statistics
       WHERE table_schema = ? AND index_name IN ('uq_addresses_single_default','uq_order_items_variant')`,
      [dbName],
    );
    const indexNames = new Set(indexRows.map((row) => String(row.index_name)));
    const missingIndexes = REQUIRED_INDEXES.filter((name) => !indexNames.has(name));
    if (missingIndexes.length) {
      throw new Error(`Missing integrity unique indexes from migration 010: ${missingIndexes.join(", ")}`);
    }

    const [foreignKeyRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT constraint_name FROM information_schema.table_constraints
       WHERE constraint_schema = ? AND constraint_type = 'FOREIGN KEY'`,
      [dbName],
    );
    const foreignKeyNames = new Set(foreignKeyRows.map((row) => String(row.constraint_name)));
    const missingForeignKeys = REQUIRED_FOREIGN_KEYS.filter((name) => !foreignKeyNames.has(name));
    if (missingForeignKeys.length) {
      throw new Error(`Missing product-color integrity foreign keys from migration 010: ${missingForeignKeys.join(", ")}`);
    }

    console.log(`PASS: MySQL ${identity.version}; database and grants are scoped; ${Number(adminRows[0].total)} admin account(s); required tables and integrity constraints present.`);
  } finally {
    await connection.end();
  }

  const response = await fetch(siteUrl, { redirect: "follow", signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`SITE_URL returned HTTP ${response.status}.`);
  if (new URL(response.url).protocol !== "https:") throw new Error("The public site redirected away from HTTPS.");
  console.log(`PASS: ${new URL(response.url).origin} is reachable over HTTPS.`);
  console.log("PASS: required bank and VNPay production variables are present (secret values were not printed).");
}

main().catch((error: unknown) => {
  fail(error instanceof Error ? error.message : "Production preflight failed.");
});
