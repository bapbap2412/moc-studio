
import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import pool from "../lib/db";

async function main() {
  const email = "admin147@gmail.com";
  const password = "ABC123456";
  const passwordHash = await bcrypt.hash(password, 12);

  await pool.execute(
    `INSERT INTO users
      (id, email, password_hash, full_name, phone, role)
     VALUES (?, ?, ?, ?, NULL, 'admin')
     ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       role = 'admin'`,
    [randomUUID(), email, passwordHash, "Admin MỘC Studio"]
  );

  console.log("Đã tạo/cập nhật tài khoản Admin:", email);
}

main()
  .catch((error) => {
    console.error("Không thể tạo Admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
