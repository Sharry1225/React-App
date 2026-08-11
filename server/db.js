import Database from "better-sqlite3";

// Opens (or creates, first time) a database file called antraajaal.db
const db = new Database("antraajaal.db");

// Create the tasks table if it doesn't exist yet.
// Each column has a type — this is you designing your data's shape.
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    title  TEXT NOT NULL,
    who    INTEGER,
    prio   TEXT,
    status TEXT,
    due    TEXT,
    created_by INTEGER
  )
`);

// Seed starting data ONLY if the table is currently empty
const count = db.prepare("SELECT COUNT(*) AS n FROM tasks").get();
if (count.n === 0) {
  const insert = db.prepare(
    "INSERT INTO tasks (title, who, prio, status, due) VALUES (?, ?, ?, ?, ?)"
  );
  insert.run("Finalize Q3 brand system for Nimbus", 2, "High", "In progress", "Aug 06");
  insert.run("Ship onboarding email flow", 3, "Med", "In progress", "Aug 07");
  insert.run("Client review — Larkspur retainer", 4, "High", "To do", "Aug 06");
  console.log("🌱 Seeded starter tasks into the database");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS meetings (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    time  TEXT,
    who   INTEGER,
    link  INTEGER
  )
`);

const meet = db.prepare("SELECT COUNT(*) AS n FROM meetings").get();
if (meet.n === 0) {
  const insert = db.prepare(
    "INSERT INTO meetings (title, time, who, link) VALUES (?, ?, ?, ?)"
  );
  insert.run("Nimbus weekly sync", "Today · 3:00 PM", 2, 1);
insert.run("Design critique", "Tomorrow · 11:00 AM", 3, 1);
insert.run("Retainer review — Larkspur", "Aug 06 · 4:30 PM", 1, 0);
}

// User table //

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL,
    email    TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role     TEXT DEFAULT 'member'
  )
`);


// Add new columns to existing tables (safe: wrapped so it won't crash if already added)

try { db.exec("ALTER TABLE tasks ADD COLUMN created_by INTEGER"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'member'"); } catch {}
export default db;