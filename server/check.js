import "dotenv/config";
import { pool } from "./db.js";

const email = "it@antraajaal.com";   // ← the account you just signed up
await pool.query("DELETE FROM users WHERE email = $1", [email]);
console.log("Done — deleted", email);
const check = await pool.query("SELECT id, name, email, role FROM users");
console.table(check.rows);
process.exit(0);