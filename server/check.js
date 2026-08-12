import "dotenv/config";
import { pool } from "./db.js";

const email = "it@antraajaal.com";   // ← the account you just signed up
await pool.query("UPDATE users SET role = 'admin' WHERE email = $1", [email]);

const check = await pool.query("SELECT id, name, email, role FROM users");
console.log("Users now:");
console.table(check.rows);
process.exit(0);