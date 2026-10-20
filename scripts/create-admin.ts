import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) before creating an admin.");
  }

  const { default: pool } = await import("../lib/db");
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.execute(
      `INSERT INTO users
        (id, email, password_hash, full_name, phone, role)
       VALUES (?, ?, ?, ?, NULL, 'admin')
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         role = 'admin'`,
      [randomUUID(), email, passwordHash, "Admin MOC Studio"],
    );
    console.log("Created or updated admin account:", email);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Could not create admin:", error);
  process.exitCode = 1;
});
