import pg from "pg";

const { Pool } = pg;

// Connect using the DATABASE_URL env var (Render provides this)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
});

// Create tables if they don't exist (runs once on startup)
async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id       SERIAL PRIMARY KEY,
      name     TEXT NOT NULL,
      email    TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role     TEXT DEFAULT 'member'
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id         SERIAL PRIMARY KEY,
      title      TEXT NOT NULL,
      who        INTEGER,
      prio       TEXT,
      status     TEXT,
      due        TEXT,
      created_by INTEGER
    )
  `);
 

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meetings (
      id    SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      time  TEXT,
      who   INTEGER,
      link  INTEGER
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    created_by  INTEGER,
    created_at  TIMESTAMP DEFAULT NOW()

    )
  `);
 // Link tasks to projects (safe if already added)
  try {
    await pool.query("ALTER TABLE tasks ADD COLUMN project_id INTEGER REFERENCES projects(id)");
  } catch (e) { /* column already exists */ }
  console.log("✅ Postgres tables ready");
}

init().catch((err) => console.error("DB init failed:", err));