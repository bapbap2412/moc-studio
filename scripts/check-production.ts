import mysql from "mysql2/promise";

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
    "MOMO_ENVIRONMENT", "MOMO_PARTNER_CODE", "MOMO_ACCESS_KEY", "MOMO_SECRET_KEY",
  ];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) throw new Error(`Missing production variables: ${missing.join(", ")}`);

  const dbName = process.env.DB_NAME!;
  if (process.env.DB_USER!.toLowerCase() === "root") throw new Error("DB_USER must be a database-scoped application account, not root.");
  if (process.env.DB_PASSWORD === "change-me") throw new Error("DB_PASSWORD still uses the sample value.");
  if (process.env.SESSION_SECRET!.length < 32 || /replace-with|change-me|example/i.test(process.env.SESSION_SECRET!)) {
    throw new Error("SESSION_SECRET must be a unique random value at least 32 characters long.");
  }
  if (process.env.MOMO_ENVIRONMENT !== "production") throw new Error("MOMO_ENVIRONMENT must be production for a production preflight.");

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
    const [identityRows] = await connection.query<mysql.RowDataPacket[]>("SELECT DATABASE() AS database_name, CURRENT_USER() AS account, VERSION() AS version");
    const identity = identityRows[0];
    if (identity.database_name !== dbName) throw new Error("Connected database does not match DB_NAME.");
    if (String(identity.account).split("@")[0].toLowerCase() === "root") throw new Error("MySQL resolved the connection to root; use a restricted application account.");

    const [grantRows] = await connection.query<mysql.RowDataPacket[]>("SHOW GRANTS");
    const grants = grantRows.map((row) => String(Object.values(row)[0]));
    const hasScopedGrant = grants.some((grant) => grant.includes(`ON \`${dbName}\`.*`) || grant.includes(`ON ${dbName}.*`));
    const hasBroadGrant = grants.some((grant) => grant.includes("ON *.*") && !grant.includes("USAGE ON *.*"));
    if (!hasScopedGrant || hasBroadGrant) throw new Error("MySQL account must have grants scoped to DB_NAME, without database-wide privileges.");

    const [adminRows] = await connection.execute<mysql.RowDataPacket[]>("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'");
    if (Number(adminRows[0].total) < 1) throw new Error("No admin account exists in the configured database.");

    const [tableRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = ? AND table_name IN ('orders','coupons','reviews','wishlists','product_variants')`,
      [dbName],
    );
    const tables = new Set(tableRows.map((row) => String(row.table_name)));
    const requiredTables = ["orders", "coupons", "reviews", "wishlists", "product_variants"];
    const missingTables = requiredTables.filter((table) => !tables.has(table));
    if (missingTables.length) throw new Error(`Missing expected MySQL tables: ${missingTables.join(", ")}`);

    console.log(`PASS: MySQL ${identity.version}; database and grants are scoped; ${Number(adminRows[0].total)} admin account(s); required tables present.`);
  } finally {
    await connection.end();
  }

  const response = await fetch(siteUrl, { redirect: "follow", signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`SITE_URL returned HTTP ${response.status}.`);
  if (new URL(response.url).protocol !== "https:") throw new Error("The public site redirected away from HTTPS.");
  console.log(`PASS: ${new URL(response.url).origin} is reachable over HTTPS.`);
  console.log("PASS: required bank and MoMo production variables are present (secret values were not printed).");
}

main().catch((error: unknown) => {
  fail(error instanceof Error ? error.message : "Production preflight failed.");
});
