import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { sendTaskEmail } from "./email.js";

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;   // now from .env

// Gatekeeper: verify the token on protected routes
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Not logged in" });
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

// GET all tasks
app.get("/api/tasks", authenticate, async (req, res) => {
  const result = await pool.query("SELECT * FROM tasks ORDER BY id DESC");
  res.json(result.rows);
});

// GET all users
app.get("/api/users", authenticate, async (req, res) => {
  const result = await pool.query("SELECT id, name, email, role FROM users");
  res.json(result.rows);
});

// CREATE a task
app.post("/api/tasks", authenticate, async (req, res) => {
  const { title, who, prio, status, due, project_id } = req.body;   // ← add project_id
  const created_by = req.user.id;

  const result = await pool.query(
    "INSERT INTO tasks (title, who, prio, status, due, created_by, project_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
    [title, who, prio, status, due, created_by, project_id]   // ← add project_id
  );
  const newTask = result.rows[0];

  const assignee = await pool.query("SELECT name, email FROM users WHERE id = $1", [who]);
  if (assignee.rows[0]?.email) {
    sendTaskEmail(assignee.rows[0].email, title, req.user.name);
  }
  res.json(newTask);
});
// app.post("/api/tasks", authenticate, async (req, res) => {
//   const { title, who, prio, status, due } = req.body;
//   const created_by = req.user.id;

//   const result = await pool.query(
//     "INSERT INTO tasks (title, who, prio, status, due, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
//     [title, who, prio, status, due, created_by]
//   );
//   const newTask = result.rows[0];

//   const assignee = await pool.query("SELECT name, email FROM users WHERE id = $1", [who]);
//   if (assignee.rows[0]?.email) {
//     sendTaskEmail(assignee.rows[0].email, title, req.user.name);
//   }
//   res.json(newTask);
// });

// UPDATE a task
app.put("/api/tasks/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, who, prio, due, status } = req.body;

  const found = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
  const task = found.rows[0];
  if (!task) return res.status(404).json({ error: "Task not found" });

  const canUpdateStatus = task.who === req.user.id || task.created_by === req.user.id || req.user.role === "admin";
  const canEdit = task.created_by === req.user.id || req.user.role === "admin";
  const isFullEdit = title !== undefined;

  if (isFullEdit && !canEdit) {
    return res.status(403).json({ error: "You don't have permission to edit this task" });
  }
  if (!isFullEdit && !canUpdateStatus) {
    return res.status(403).json({ error: "You don't have permission to update this task" });
  }

  const updated = await pool.query(
    "UPDATE tasks SET title=$1, who=$2, prio=$3, due=$4, status=$5 WHERE id=$6 RETURNING *",
    [title ?? task.title, who ?? task.who, prio ?? task.prio, due ?? task.due, status ?? task.status, id]
  );
  res.json(updated.rows[0]);
});

// DELETE a task
app.delete("/api/tasks/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const found = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
  const task = found.rows[0];
  if (!task) return res.status(404).json({ error: "Task not found" });

  const isCreator = task.created_by === req.user.id;
  const isAdmin = req.user.role === "admin";
  if (!isCreator && !isAdmin) {
    return res.status(403).json({ error: "You don't have permission to delete this task" });
  }

  await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
  res.json({ deleted: Number(id) });
});

// GET meetings
app.get("/api/meetings", authenticate, async (req, res) => {
  const result = await pool.query("SELECT * FROM meetings ORDER BY id DESC");
  res.json(result.rows);
});

// CREATE meeting
app.post("/api/meetings", authenticate, async (req, res) => {
  const { title, time, who, link } = req.body;
  const result = await pool.query(
    "INSERT INTO meetings (title, time, who, link) VALUES ($1,$2,$3,$4) RETURNING *",
    [title, time, who, link]
  );
  res.json(result.rows[0]);
});

// UPDATE a user (admin only)
app.put("/api/users/:id", authenticate, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  const { id } = req.params;
  const { name, role } = req.body;

  const found = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  const target = found.rows[0];
  if (!target) return res.status(404).json({ error: "User not found" });

  const updated = await pool.query(
    "UPDATE users SET name=$1, role=$2 WHERE id=$3 RETURNING id, name, email, role",
    [name ?? target.name, role ?? target.role, id]
  );
  res.json(updated.rows[0]);
});


// GET all projects
app.get("/api/projects", authenticate, async (req, res) => {
  const result = await pool.query("SELECT * FROM projects ORDER BY id DESC");
  res.json(result.rows);
});

// CREATE a project (admin only)
app.post("/api/projects", authenticate, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Project name is required" });

  const result = await pool.query(
    "INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *",
    [name, description, req.user.id]
  );
  res.json(result.rows[0]);
});

// DELETE a project (admin only)
app.delete("/api/projects/:id", authenticate, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  const { id } = req.params;
  // Unlink tasks from this project first, so they aren't orphaned
  await pool.query("UPDATE tasks SET project_id = NULL WHERE project_id = $1", [id]);
  await pool.query("DELETE FROM projects WHERE id = $1", [id]);
  res.json({ deleted: Number(id) });
});

// SIGN UP
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1,$2,$3) RETURNING id, name, email",
      [name, email, hashedPassword]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {   // Postgres unique-violation code
      return res.status(400).json({ error: "That email is already registered" });
    }
    res.status(500).json({ error: "Could not create account" });
  }
});

// LOG IN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const found = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = found.rows[0];
  if (!user) return res.status(400).json({ error: "Invalid email or password" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "Invalid email or password" });

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend API running on port ${PORT}`);
});