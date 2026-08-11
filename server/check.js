import db from "./db.js";
const email = "satnam@gmail.com";   // ← your account's email
db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(email);
console.log(`${email} is now an admin.`);
console.table(db.prepare("SELECT id, name, email, role FROM users").all());