import express from "express";
import cors from "cors";
import db from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { sendTaskEmail } from "./email.js";
const app = express();
app.use(cors());            // allow the React app to call this server
app.use(express.json());    // let the server read JSON sent from React



// Gatekeeper: verify the token on protected routes
function authenticate(req, res, next) {
  const header = req.headers.authorization;           // "Bearer <token>"
  if (!header) return res.status(401).json({ error: "Not logged in" });

  const token = header.split(" ")[1];                 // grab the token part
  try {
    const decoded = jwt.verify(token, JWT_SECRET);    // valid & untampered?
    req.user = decoded;                               // attach { id, name } to the request
    next();                                           // allow the route to run
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
const JWT_SECRET = "antraajaal-secret-key-change-this-later";
// When React asks for GET /api/tasks, send back the tasks list
app.get("/api/tasks", authenticate, (req, res) => {
  const tasks = db.prepare("SELECT * FROM tasks").all();
  res.json(tasks);
});

app.get("/api/users", authenticate, (req, res) => {
  const users = db.prepare("SELECT * FROM users").all();
  res.json(users);
});


// Create a new task: React sends the task data, we save it to the database
app.post("/api/tasks", authenticate, (req, res) => {
  const { title, who, prio, status, due } = req.body;
  const created_by = req.user.id;   // ← from the verified token, NOT the browser

  const result = db
    .prepare("INSERT INTO tasks (title, who, prio, status, due, created_by) VALUES (?, ?, ?, ?, ?, ?)")
    .run(title, who, prio, status, due, created_by);

  const newTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);

  const assignee = db.prepare("SELECT name, email FROM users WHERE id = ?").get(who);
  if (assignee?.email) {
    sendTaskEmail(assignee.email, title, req.user.name);
  }
  res.json(newTask);
});

app.put("/api/tasks/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const { title, who, prio, due, status } = req.body;
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

  if (!task) return res.status(404).json({ error: "Task not found" });

  // Status-only updates (the checkbox) — assignee, creator, or admin
  const canUpdateStatus = task.who === req.user.id || task.created_by === req.user.id || req.user.role === "admin";
  // Full edits — only creator or admin
  const canEdit = task.created_by === req.user.id || req.user.role === "admin";

  // If they're changing more than just status, require edit permission
  const isFullEdit = title !== undefined;
  if (isFullEdit && !canEdit) {
    return res.status(403).json({ error: "You don't have permission to edit this task" });
  }
  if (!isFullEdit && !canUpdateStatus) {
    return res.status(403).json({ error: "You don't have permission to update this task" });
  }

  // Use new values where provided, fall back to existing ones
  db.prepare("UPDATE tasks SET title = ?, who = ?, prio = ?, due = ?, status = ? WHERE id = ?")
    .run(
      title ?? task.title,
      who ?? task.who,
      prio ?? task.prio,
      due ?? task.due,
      status ?? task.status,
      id
    );

  res.json(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id));
});

// DELETE a task

app.delete("/api/tasks/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

  if (!task) return res.status(404).json({ error: "Task not found" });

  // Rule: only the creator OR an admin may delete
  const isCreator = task.created_by === req.user.id;
  const isAdmin = req.user.role === "admin";

  if (!isCreator && !isAdmin) {
    return res.status(403).json({ error: "You don't have permission to delete this task" });
  }

  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  res.json({ deleted: Number(id) });
});

app.get("/api/meetings", authenticate, (req, res) => {
  const meetings = db.prepare("SELECT * FROM meetings").all();
  res.json(meetings);
});


app.post("/api/meetings", authenticate, (req, res) => {
  const { title, time, who, link } = req.body;   // read what React sent

  const result = db
    .prepare("INSERT INTO meetings (title, time, who, link) VALUES (?, ?, ?, ?)")
    .run(title, time, who, link);                // save it

  // Send the newly-created task back, including its fresh database id
  const meetings = db
    .prepare("SELECT * FROM meetings WHERE id = ?")
    .get(result.lastInsertRowid);

  res.json(meetings);
});

// Signup routes

// SIGN UP — create a new account
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;

  // 1. Basic check: all fields present
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // 2. Hash the password before storing it — never store plain text
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Save the new user
    const result = db
      .prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)")
      .run(name, email, hashedPassword);

    // 4. Send back the new user — but NOT the password
    res.json({ id: result.lastInsertRowid, name, email });
  } catch (err) {
    // The UNIQUE rule on email throws if the email already exists
    if (err.message.includes("UNIQUE")) {
      return res.status(400).json({ error: "That email is already registered" });
    }
    res.status(500).json({ error: "Could not create account" });
  }
});

// Login

// LOG IN — verify credentials, return a token
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  // 1. Find the user by email
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  // 2. Compare the typed password against the stored hash
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  // 3. Success — create a signed token holding the user's id and name
  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },   // ← add role
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  // 4. Send back the token and safe user info (never the password)
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});


// Start the server on port 4000
app.listen(4000, () => {
  console.log("✅ Backend API running on http://localhost:4000");
});

