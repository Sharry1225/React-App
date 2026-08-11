import React, { useState, useRef, useMemo } from "react";
import { useEffect } from "react";
import {
  LayoutDashboard, CheckSquare, KanbanSquare, Zap, SlidersHorizontal,
  CalendarDays, MessageSquare, Clock, UserCheck, BarChart3, Trophy, Plug,
  Search, Bell, Plus, Play, Pause, Check, ChevronRight, ChevronLeft, Flame,
  X, Link2, Users, Video, Send, ArrowRight, TrendingUp, Circle, Dot
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip
} from "recharts";

function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";   // ← add this
  return fetch(`${API}${path}`, {                                        // ← use it here
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

// Build a list of the next 14 days as { value, label }
function upcomingDates(count = 14) {
  const out = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); // "Aug 7"
    out.push({ value: label, label: i === 0 ? `Today (${label})` : label });
  }
  return out;
}

/* ────────────────────────────────────────────────────────────────
   DESIGN TOKENS
   Palette: ink sidebar + warm-neutral workspace, jewel-teal primary,
   amber accent for "hot"/highlights. Deliberately not the default
   SaaS-indigo look. Display: Bricolage Grotesque. Body: Inter.
   Data readouts: JetBrains Mono (ops-console feel).
──────────────────────────────────────────────────────────────── */
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

    .aj * { box-sizing: border-box; }
    .aj {
      --ink: #12171C;
      --ink-2: #1A2229;
      --ink-line: #263039;
      --surface: #F6F7F4;
      --card: #FFFFFF;
      --border: #E5E8E3;
      --border-strong: #D3D8D0;
      --text: #17211D;
      --muted: #6C7871;
      --faint: #9AA49C;
      --teal: #0E9384;
      --teal-deep: #0B7A6E;
      --teal-soft: #E4F4F1;
      --amber: #E0912B;
      --amber-soft: #FBF0DC;
      --rose: #C4553B;
      --rose-soft: #F8E7E1;
      --violet: #6D5AE0;
      --radius: 14px;
      font-family: 'Inter', system-ui, sans-serif;
      color: var(--text);
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--surface);
      -webkit-font-smoothing: antialiased;
    }
    .aj h1,.aj h2,.aj h3,.aj h4 { font-family:'Bricolage Grotesque',sans-serif; margin:0; letter-spacing:-.01em; }
    .aj .mono { font-family:'JetBrains Mono',monospace; font-variant-numeric:tabular-nums; }

    /* ── SIDEBAR ─────────────────────────────── */
    .aj-side { width:246px; background:var(--ink); color:#C4CDD3; display:flex; flex-direction:column; flex-shrink:0; }
    .aj-brand { padding:20px 20px 16px; display:flex; align-items:center; gap:11px; border-bottom:1px solid var(--ink-line); position:relative; overflow:hidden; }
    .aj-brand svg.mesh { position:absolute; inset:0; width:100%; height:100%; opacity:.5; pointer-events:none; }
    .aj-logo { width:34px; height:34px; border-radius:9px; background:linear-gradient(140deg,var(--teal),#14B8A6); display:grid; place-items:center; flex-shrink:0; z-index:1; }
    .aj-brand-name { z-index:1; }
    .aj-brand-name b { font-family:'Bricolage Grotesque'; font-size:16px; color:#fff; font-weight:700; display:block; line-height:1.1; }
    .aj-brand-name span { font-size:11px; color:#7C8890; letter-spacing:.04em; }
    .aj-nav { padding:12px 12px; overflow-y:auto; flex:1; }
    .aj-nav-label { font-size:10.5px; text-transform:uppercase; letter-spacing:.11em; color:#5E6A71; padding:14px 10px 7px; }
    .aj-item { display:flex; align-items:center; gap:11px; width:100%; border:0; background:transparent; color:#AEB8BE; padding:9px 11px; border-radius:9px; font-size:13.5px; font-weight:500; cursor:pointer; text-align:left; transition:.12s; font-family:inherit; }
    .aj-item:hover { background:var(--ink-2); color:#E8EDF0; }
    .aj-item.on { background:var(--teal); color:#fff; box-shadow:0 2px 10px rgba(14,147,132,.35); }
    .aj-item .hot { margin-left:auto; background:var(--amber); color:#3a2400; font-size:9px; font-weight:700; padding:2px 6px; border-radius:20px; letter-spacing:.04em; }
    .aj-item.on .hot { background:#fff2d9; }
    .aj-side-foot { padding:12px; border-top:1px solid var(--ink-line); display:flex; align-items:center; gap:10px; }
    .aj-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(140deg,var(--amber),#d67b1e); display:grid; place-items:center; color:#fff; font-weight:700; font-size:13px; flex-shrink:0; font-family:'Bricolage Grotesque'; }
    .aj-side-foot small { display:block; color:#7C8890; font-size:11px; }
    .aj-side-foot b { font-size:13px; color:#E8EDF0; font-weight:600; }

    /* ── MAIN ─────────────────────────────── */
    .aj-main { flex:1; display:flex; flex-direction:column; min-width:0; }
    .aj-top { height:60px; background:var(--card); border-bottom:1px solid var(--border); display:flex; align-items:center; gap:16px; padding:0 26px; flex-shrink:0; }
    .aj-top h2 { font-size:18px; font-weight:700; }
    .aj-search { margin-left:auto; display:flex; align-items:center; gap:8px; background:var(--surface); border:1px solid var(--border); border-radius:9px; padding:7px 12px; width:240px; color:var(--muted); }
    .aj-search input { border:0; background:transparent; outline:none; font-size:13px; width:100%; color:var(--text); font-family:inherit; }
    .aj-icon-btn { width:36px; height:36px; border-radius:9px; border:1px solid var(--border); background:var(--card); display:grid; place-items:center; color:var(--muted); cursor:pointer; position:relative; }
    .aj-icon-btn:hover { border-color:var(--border-strong); color:var(--text); }
    .aj-dot { position:absolute; top:7px; right:8px; width:7px; height:7px; border-radius:50%; background:var(--rose); border:1.5px solid var(--card); }
    .aj-view { flex:1; overflow-y:auto; padding:26px; }

    /* ── SHARED UI ─────────────────────────────── */
    .aj-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); }
    .aj-pad { padding:20px; }
    .aj-row { display:flex; align-items:center; gap:12px; }
    .aj-between { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .aj-grid { display:grid; gap:16px; }
    .aj-section-h { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
    .aj-section-h h3 { font-size:15px; font-weight:700; }
    .aj-muted { color:var(--muted); }
    .aj-btn { display:inline-flex; align-items:center; gap:7px; background:var(--teal); color:#fff; border:0; padding:9px 15px; border-radius:9px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:.12s; }
    .aj-btn:hover { background:var(--teal-deep); }
    .aj-btn.ghost { background:var(--card); color:var(--text); border:1px solid var(--border); }
    .aj-btn.ghost:hover { border-color:var(--border-strong); }
    .aj-btn.sm { padding:6px 11px; font-size:12px; }
    .aj-chip { font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; display:inline-flex; align-items:center; gap:4px; }
    .aj-input, .aj-select { border:1px solid var(--border); border-radius:8px; padding:8px 11px; font-size:13px; font-family:inherit; color:var(--text); background:var(--card); outline:none; }
    .aj-input:focus, .aj-select:focus { border-color:var(--teal); box-shadow:0 0 0 3px var(--teal-soft); }
    .aj input:focus-visible, .aj button:focus-visible { outline:2px solid var(--teal); outline-offset:2px; }
    .aj-table { width:100%; border-collapse:collapse;margin-top: 15px; }
    .aj-table th { text-align:left; font-size:10.5px; text-transform:uppercase; letter-spacing:.07em; color:var(--faint); font-weight:600; padding:0 14px 10px; }
    .aj-table td { padding:13px 14px; border-top:1px solid var(--border); font-size:13.5px; }
    .aj-empty { text-align:center; padding:40px; color:var(--muted); }

    .aj-stat { padding:18px 20px; }
    .aj-stat .lbl { font-size:12px; color:var(--muted); display:flex; align-items:center; gap:7px; margin-bottom:10px; font-weight:500; }
    .aj-stat .num { font-family:'Bricolage Grotesque'; font-size:30px; font-weight:700; line-height:1; letter-spacing:-.02em; }
    .aj-stat .sub { font-size:11.5px; margin-top:8px; display:flex; align-items:center; gap:4px; }

    .aj-feed-item { display:flex; gap:12px; padding:12px 0; border-top:1px solid var(--border); }
    .aj-feed-item:first-child { border-top:0; }
    .aj-feed-dot { width:8px; height:8px; border-radius:50%; margin-top:6px; flex-shrink:0; }

    @keyframes dash { to { stroke-dashoffset:-24; } }
    .aj-mesh-line { stroke-dasharray:3 5; animation:dash 2.4s linear infinite; }
    @media (prefers-reduced-motion: reduce) { .aj-mesh-line { animation:none; } }

    .aj-modtile { text-align:left; border:1px solid var(--border); background:var(--card); border-radius:12px; padding:15px; cursor:pointer; transition:.14s; display:flex; flex-direction:column; gap:10px; }
    .aj-modtile:hover { border-color:var(--teal); transform:translateY(-2px); box-shadow:0 8px 20px rgba(18,23,28,.06); }
    .aj-modtile .ico { width:36px; height:36px; border-radius:9px; display:grid; place-items:center; }

    .aj-kcol { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:12px; min-height:120px; }
    .aj-kcard { background:var(--card); border:1px solid var(--border); border-radius:9px; padding:11px 12px; margin-top:9px; box-shadow:0 1px 2px rgba(18,23,28,.04); }
    .aj-kcard .t { font-size:13px; font-weight:600; margin-bottom:8px; }
    .aj-kmove { display:flex; justify-content:space-between; margin-top:9px; }
    .aj-kmove button { border:0; background:var(--surface); border-radius:6px; width:24px; height:24px; display:grid; place-items:center; cursor:pointer; color:var(--muted); }
    .aj-kmove button:hover { background:var(--teal-soft); color:var(--teal); }
    .aj-kmove button:disabled { opacity:.3; cursor:not-allowed; }

    .aj-chan { display:flex; align-items:center; gap:9px; padding:9px 11px; border-radius:8px; cursor:pointer; font-size:13.5px; color:var(--muted); }
    .aj-chan:hover { background:var(--surface); }
    .aj-chan.on { background:var(--teal-soft); color:var(--teal-deep); font-weight:600; }
    .aj-msg { max-width:74%; padding:9px 13px; border-radius:12px; font-size:13.5px; line-height:1.45; }
    .aj-msg.them { background:var(--surface); border:1px solid var(--border); border-top-left-radius:3px; }
    .aj-msg.me { background:var(--teal); color:#fff; border-top-right-radius:3px; margin-left:auto; }

    .aj-integ { display:flex; align-items:center; gap:13px; padding:16px; border:1px solid var(--border); border-radius:12px; background:var(--card); }
    .aj-integ .badge { width:44px; height:44px; border-radius:11px; display:grid; place-items:center; font-family:'Bricolage Grotesque'; font-weight:700; color:#fff; flex-shrink:0; font-size:15px; }
    .aj-toggle { width:40px; height:23px; border-radius:20px; border:0; cursor:pointer; position:relative; transition:.15s; flex-shrink:0; }
    .aj-toggle span { position:absolute; top:2.5px; left:2.5px; width:18px; height:18px; border-radius:50%; background:#fff; transition:.15s; }
    .aj-toggle.on { background:var(--teal); }
    .aj-toggle.on span { left:19px; }
    .aj-toggle.off { background:var(--border-strong); }

    .aj-rank { display:flex; align-items:center; gap:14px; padding:14px 16px; border-radius:12px; border:1px solid var(--border); background:var(--card); }
    .aj-rank .pos { width:30px; height:30px; border-radius:8px; display:grid; place-items:center; font-family:'Bricolage Grotesque'; font-weight:700; font-size:14px; flex-shrink:0; }

    .aj-timer { font-family:'Bricolage Grotesque'; font-size:52px; font-weight:700; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }

    @media (max-width:860px){
      .aj-side{ width:66px; } .aj-brand-name,.aj-nav-label,.aj-item span:not(.hot),.aj-side-foot small,.aj-side-foot b{ display:none; }
      .aj-item{ justify-content:center; } .aj-search{ display:none; }
    }
  `}</style>
);

/* ────────────────────────────────────────────────────────────────
   SEED DATA  (agency "Antraajaal")
──────────────────────────────────────────────────────────────── */
const TEAM = [
  { id: 1, name: "Ritwik A.", init: "RA", color: "#0E9384", role: "Founder" },
  { id: 2, name: "Aisha K.", init: "AK", color: "#6D5AE0", role: "Design Lead" },
  { id: 3, name: "Kabir S.", init: "KS", color: "#E0912B", role: "Engineer" },
  { id: 4, name: "Meera D.", init: "MD", color: "#C4553B", role: "PM" },
  { id: 5, name: "Dev P.", init: "DP", color: "#2A9D8F", role: "Engineer" },
  { id: 6, name: "Sana R.", init: "SR", color: "#B5478F", role: "Strategist" },
];

const DATE = [
  { id: 1, due: "1" },
  { id: 2, due: "2" },
  { id: 3, due: "3" },
  { id: 4, due: "4" },
  { id: 5, due: "5" },
  { id: 6, due: "6" },
];
const person = (id) => TEAM.find((t) => t.id === id);

const TASKS_SEED = [
  { id: 1, title: "Finalize Q3 brand system for Nimbus", who: 2, prio: "High", status: "In progress", due: "Aug 06" },
  { id: 2, title: "Ship onboarding email flow", who: 3, prio: "Med", status: "In progress", due: "Aug 07" },
  { id: 3, title: "Client review — Larkspur retainer", who: 4, prio: "High", status: "To do", due: "Aug 05" },
  { id: 4, title: "Audit analytics dashboard", who: 5, prio: "Low", status: "To do", due: "Aug 11" },
  { id: 5, title: "Publish case study: Meadowvale", who: 6, prio: "Med", status: "Done", due: "Aug 01" },
];
const KANBAN_SEED = {
  Backlog: [{ id: 11, t: "Scope AR filter concept", who: 2 }, { id: 12, t: "Vendor list for print run", who: 4 }],
  "In progress": [{ id: 13, t: "Landing page rebuild", who: 3 }, { id: 14, t: "Social kit — August", who: 6 }],
  Review: [{ id: 15, t: "Invoice template v2", who: 5 }],
  Done: [{ id: 16, t: "Kickoff deck — Nimbus", who: 2 }],
};
const KCOLS = ["Backlog", "In progress", "Review", "Done"];
const AUTOMATIONS_SEED = [
  { id: 1, trigger: "New task created", action: "Notify assignee in Chats", on: true },
  { id: 2, trigger: "New invoice created", action: "Add row to Google Sheets", on: true },
  { id: 3, trigger: "New meeting created", action: "Create Zoom link", on: false },
  { id: 4, trigger: "New agreement created", action: "Send WhatsApp confirmation", on: true },
];
const TRIGGERS = ["New task created", "New invoice created", "New meeting created", "New agreement created", "New board created"];
const ACTIONS = ["Notify assignee in Chats", "Add row to Google Sheets", "Create Zoom link", "Send WhatsApp confirmation", "Create a task", "Post to Slack"];
const FIELDS_SEED = [
  { id: 1, name: "Client tier", type: "Select", applies: "Clients", req: true },
  { id: 2, name: "Budget (₹)", type: "Number", applies: "Tasks", req: false },
  { id: 3, name: "Contract end", type: "Date", applies: "Agreements", req: true },
  { id: 4, name: "Billable", type: "Checkbox", applies: "Tasks", req: false },
];
const MEETINGS_SEED = [
  { id: 1, title: "Nimbus weekly sync", time: "Today · 3:00 PM", who: [2, 4], link: true },
  { id: 2, title: "Design critique", time: "Tomorrow · 11:00 AM", who: [2, 3, 6], link: true },
  { id: 3, title: "Retainer review — Larkspur", time: "Aug 06 · 4:30 PM", who: [1, 4], link: false },
];
const CHANNELS = ["# general", "# nimbus-project", "# design", "# clients"];
const MSG_SEED = {
  "# general": [
    { id: 1, who: 4, text: "Morning all — standup notes are up in the board." },
    { id: 2, who: 3, text: "Landing page rebuild is at review, taking a look now." },
    { id: 3, who: 2, text: "Nice. I'll push the brand tokens after lunch." },
  ],
  "# nimbus-project": [{ id: 1, who: 1, text: "Client loved the kickoff deck 🎉" }],
  "# design": [{ id: 1, who: 2, text: "New type scale in the shared library." }],
  "# clients": [{ id: 1, who: 4, text: "Larkspur invoice goes out Friday." }],
};
const TIMELOG_SEED = [
  { id: 1, task: "Landing page rebuild", who: 3, dur: "2:14:00", date: "Today" },
  { id: 2, task: "Brand system — Nimbus", who: 2, dur: "3:40:00", date: "Today" },
  { id: 3, task: "Client review prep", who: 4, dur: "0:55:00", date: "Yesterday" },
];
const ATT_SEED = TEAM.map((t, i) => ({
  ...t, state: i === 5 ? "Absent" : i % 2 === 0 ? "Present" : "Remote",
  since: i === 5 ? "—" : ["9:02", "9:14", "8:58", "9:30", "9:07"][i] || "9:00",
}));
const LEADERS = [
  { id: 1, pts: 1840, streak: 12 }, { id: 3, pts: 1620, streak: 8 },
  { id: 2, pts: 1585, streak: 9 }, { id: 4, pts: 1390, streak: 5 },
  { id: 5, pts: 1120, streak: 3 }, { id: 6, pts: 960, streak: 2 },
].map((r) => ({ ...person(r.id), ...r }));
const INTEGRATIONS_SEED = [
  { id: 1, name: "Make", desc: "Visual automation · 2,000+ apps", color: "#6D5AE0", tag: "MA", on: true },
  { id: 2, name: "Zapier", desc: "Automate across 8,000+ apps", color: "#E0912B", tag: "ZP", on: true },
  { id: 3, name: "Pabbly Connect", desc: "Workflow automation", color: "#0E9384", tag: "PB", on: false },
  { id: 4, name: "Zoom", desc: "Meetings & recordings", color: "#2D8CFF", tag: "ZM", on: true },
  { id: 5, name: "Google Sheets", desc: "Two-way data sync", color: "#188038", tag: "GS", on: true },
  { id: 6, name: "WhatsApp", desc: "Client messaging (360Dialog)", color: "#25D366", tag: "WA", on: false },
  { id: 7, name: "Slack", desc: "Team notifications", color: "#611f69", tag: "SL", on: false },
  { id: 8, name: "Stripe", desc: "Payments & invoicing", color: "#635BFF", tag: "ST", on: true },
];

const prioColor = (p) => p === "High" ? { c: "var(--rose)", b: "var(--rose-soft)" } : p === "Med" ? { c: "var(--amber)", b: "var(--amber-soft)" } : { c: "var(--teal)", b: "var(--teal-soft)" };
const statusColor = (s) => s === "Done" ? { c: "var(--teal)", b: "var(--teal-soft)" } : s === "In progress" ? { c: "var(--amber)", b: "var(--amber-soft)" } : { c: "var(--muted)", b: "var(--surface)" };

const Avatar = ({ id, users = [], size = 26 }) => {
  const list = Array.isArray(users) ? users : [];   // ← safety
  const u = list.find((m) => m.id === id);
  const initial = u ? u.name.charAt(0).toUpperCase() : "?";
  const name = u ? u.name : "Unknown";
  return (
    <div title={name} style={{ width: size, height: size, borderRadius: "50%", background: "var(--teal)", color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: size * 0.42, flexShrink: 0 }}>
      {initial}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────
   MODULE META (drives sidebar + dashboard hub)
──────────────────────────────────────────────────────────────── */
const MODULES = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "#0E9384", desc: "Your command center" },
  { key: "tasks", label: "Tasks", icon: CheckSquare, color: "#0E9384", desc: "Organize & track work" },
  { key: "activeusers", label: "Active Users", icon: CheckSquare, color: "#0E9384", desc: "View and manage active users" },
  { key: "kanban", label: "Kanban Boards", icon: KanbanSquare, color: "#6D5AE0", desc: "Visualize workflow" },
  { key: "automations", label: "Workflows", icon: Zap, color: "#E0912B", desc: "Trigger → action rules", hot: true },
  { key: "fields", label: "Custom Fields", icon: SlidersHorizontal, color: "#2A9D8F", desc: "Tailor your records" },
  { key: "meetings", label: "Meetings", icon: CalendarDays, color: "#2D8CFF", desc: "Schedule & organize" },
  { key: "chats", label: "Chats", icon: MessageSquare, color: "#B5478F", desc: "Team & client messaging" },
  { key: "time", label: "Time Tracking", icon: Clock, color: "#C4553B", desc: "Monitor productivity" },
  { key: "attendance", label: "Attendance", icon: UserCheck, color: "#188038", desc: "Track team presence" },
  { key: "reports", label: "Reports", icon: BarChart3, color: "#635BFF", desc: "Analytics & insights" },
  { key: "leaderboards", label: "Leaderboards", icon: Trophy, color: "#E0912B", desc: "Gamify the workspace" },
  { key: "integrations", label: "Integrations", icon: Plug, color: "#0EA5A0", desc: "Connect your tools" },
];

/* ═══════════════════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const submit = () => {
    setError("");
    const url = isSignup ? "/api/signup" : "/api/login";
    const body = isSignup ? { name, email, password } : { email, password };

    fetch(`${API}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        if (isSignup) {
          // After signup, switch to login so they sign in
          setIsSignup(false);
          setError("Account created — please log in.");
        } else {
          // Login success: hand the token + user up to App
          onLogin(data.token, data.user);
        }
      })
      .catch(() => setError("Something went wrong. Is the server running?"));
  };

  return (
    <div className="aj" style={{ alignItems: "center", justifyContent: "center", background: "var(--ink)" }}>
      <Styles />
      <div className="aj-card aj-pad" style={{ width: 360, padding: 32 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Antraajaal</h1>
        <p className="aj-muted" style={{ fontSize: 13, marginBottom: 22 }}>
          {isSignup ? "Create your account" : "Sign in to your workspace"}
        </p>

        {isSignup && (
          <input className="aj-input" style={{ width: "100%", marginBottom: 10 }}
            placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <input className="aj-input" style={{ width: "100%", marginBottom: 10 }}
          placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="aj-input" style={{ width: "100%", marginBottom: 16 }} type="password"
          placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()} />

        {error && <div style={{ fontSize: 12.5, color: "var(--rose)", marginBottom: 12 }}>{error}</div>}

        <button className="aj-btn" style={{ width: "100%", justifyContent: "center" }} onClick={submit}>
          {isSignup ? "Create account" : "Sign in"}
        </button>

        <div style={{ fontSize: 12.5, marginTop: 16, textAlign: "center" }} className="aj-muted">
          {isSignup ? "Already have an account? " : "New here? "}
          <button onClick={() => { setIsSignup(!isSignup); setError(""); }}
            style={{ border: 0, background: "none", color: "var(--teal)", cursor: "pointer", fontWeight: 600 }}>
            {isSignup ? "Sign in" : "Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    if (!token) return;               // ← don't fetch until the token is actually there
    api("/api/users")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setUsers(data))
      .catch((err) => console.error("Could not load users:", err));
  }, [user]);



  const handleLogin = (token, userData) => {
    localStorage.setItem("token", token);              // ← token FIRST
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);                                 // ← this triggers the effect, token already saved
  };


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };
  const [active, setActive] = useState("dashboard");
  const current = MODULES.find((m) => m.key === active);
  // The gate: no user → show login; otherwise show the app
  if (!user) return <LoginScreen onLogin={handleLogin} />;



  return (
    <div className="aj">
      <Styles />
      {/* SIDEBAR */}
      <aside className="aj-side">
        <div className="aj-brand">
          <svg className="mesh" viewBox="0 0 246 70" preserveAspectRatio="none">
            <g stroke="#0E9384" strokeWidth="1" fill="none" opacity="0.6">
              <path className="aj-mesh-line" d="M-5 55 L60 20 L120 48 L190 14 L250 42" />
              <path className="aj-mesh-line" d="M-5 20 L70 50 L140 22 L210 52 L250 22" />
            </g>
            <g fill="#14B8A6">
              <circle cx="60" cy="20" r="2" /><circle cx="120" cy="48" r="2" /><circle cx="190" cy="14" r="2" /><circle cx="70" cy="50" r="2" /><circle cx="140" cy="22" r="2" />
            </g>
          </svg>
          <div className="aj-logo">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="2.4" fill="#fff" stroke="none" />
              <circle cx="4" cy="5" r="1.6" fill="#fff" stroke="none" /><circle cx="20" cy="5" r="1.6" fill="#fff" stroke="none" />
              <circle cx="4" cy="19" r="1.6" fill="#fff" stroke="none" /><circle cx="20" cy="19" r="1.6" fill="#fff" stroke="none" />
              <path d="M12 12 L4 5 M12 12 L20 5 M12 12 L4 19 M12 12 L20 19" strokeWidth="1.4" />
            </svg>
          </div>
          <div className="aj-brand-name"><b>Antraajaal</b><span>Workspace</span></div>
        </div>

        <nav className="aj-nav">
          <div className="aj-nav-label">Overview</div>
          {MODULES.slice(0, 1).map((m) => <NavItem key={m.key} m={m} active={active} set={setActive} />)}
          <div className="aj-nav-label">Modules</div>
          {MODULES.slice(1).map((m) => <NavItem key={m.key} m={m} active={active} set={setActive} />)}
        </nav>

        <div className="aj-side-foot">
          <div className="aj-avatar">{user.name.charAt(0)}</div>
          <div><b>{user.name}</b><small>Signed in</small></div>
          <button onClick={handleLogout} title="Log out" style={{ marginLeft: "auto", border: 0, background: "transparent", color: "#7C8890", cursor: "pointer" }}>
            Log out</button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="aj-main">
        <header className="aj-top">
          <h2>{current.label}</h2>
          <div className="aj-search"><Search size={15} /><input placeholder="Search workspace…" /></div>
          <button className="aj-icon-btn"><Bell size={17} /><span className="aj-dot" /></button>
        </header>

        <main className="aj-view">
          {active === "dashboard" && <Dashboard go={setActive} />}
          {active === "tasks" && <Tasks users={users} currentUser={user} />}
          {active === "activeusers" && <ActiveUser user={user} />}
          {active === "kanban" && <Kanban />}
          {active === "automations" && <Automations />}
          {active === "fields" && <Fields />}
          {active === "meetings" && <Meetings />}
          {active === "chats" && <Chats />}
          {active === "time" && <TimeTracking />}
          {active === "attendance" && <Attendance />}
          {active === "reports" && <Reports />}
          {active === "leaderboards" && <Leaderboards />}
          {active === "integrations" && <Integrations />}
        </main>
      </div>
    </div>
  );
}

const ActiveUser = ({ user, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const isAdmin = currentUser?.role === "admin";
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    api("/api/users")
      .then((res) => { if (!res.ok) throw new Error("Unauthorized"); return res.json(); })
      .then((data) => setUsers(data))
      .catch((err) => console.error("Could not load users:", err));
  }, [user]);
  const saveUser = () => {
    api(`/api/users/${editing.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: editing.name, role: editing.role }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update user");
        return res.json();
      })
      .then((updatedUser) => {
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
        setEditing(null);   // close the modal
      })
      .catch((err) => console.error("Could not update user:", err));
  };


  return (
    <div className="aj-pad">
      {users.length === 0 ? (
        <p className="aj-muted">No users found.</p>
      ) : (
        <table className="aj-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td>{u.email}</td>
                <td><span className="aj-chip" style={{ background: "var(--surface)", color: "var(--muted)" }}>{u.role}</span></td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  {/* {(isAdmin || u.id === currentUser?.id) && ( */}
                  <>
                    <button onClick={() => setEditing(u)} title="Edit" style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--muted)", marginRight: 4 }}>
                      <SlidersHorizontal size={15} />
                    </button>
                  </>
                  {/* )}  */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editing && (
        <div onClick={() => setEditing(null)} style={{ position: "fixed", inset: 0, background: "rgba(18,23,28,.5)", display: "grid", placeItems: "center", zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} className="aj-card aj-pad" style={{ width: 420, padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Edit user</h3>

            <label style={{ fontSize: 12, color: "var(--muted)" }}>Name</label>
            <input className="aj-input" style={{ width: "100%", marginBottom: 12 }}
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })} />

            <label style={{ fontSize: 12, color: "var(--muted)" }}>Role</label>
            <select className="aj-select" style={{ width: "100%", marginBottom: 20 }}
              value={editing.role}
              onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
              <option value="admin">admin</option>
              <option value="member">member</option>
            </select>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="aj-btn ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="aj-btn" onClick={saveUser}>Save changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ m, active, set }) => {
  const Icon = m.icon;
  return (
    <button className={"aj-item" + (active === m.key ? " on" : "")} onClick={() => set(m.key)}>
      <Icon size={17} /><span>{m.label}</span>{m.hot && <span className="hot">HOT</span>}
    </button>
  );
};

/* ── section header helper ── */
const Head = ({ title, sub, action }) => (
  <div className="aj-section-h">
    <div><h3>{title}</h3>{sub && <div className="aj-muted" style={{ fontSize: 13, marginTop: 3 }}>{sub}</div>}</div>
    {action}
  </div>
);

/* ═══════════════ DASHBOARD (the hub) ═══════════════ */
function Dashboard({ go }) {
  const stats = [
    { lbl: "Active tasks", icon: CheckSquare, num: 8, sub: "3 due this week", tone: "var(--teal)" },
    { lbl: "Hours tracked today", icon: Clock, num: "6.9h", sub: "across 4 members", tone: "var(--amber)" },
    { lbl: "Team present", icon: Users, num: "5/6", sub: "1 out today", tone: "var(--violet)" },
    { lbl: "Open meetings", icon: Video, num: 3, sub: "next at 3:00 PM", tone: "var(--rose)" },
  ];
  const feed = [
    { c: "var(--teal)", who: 2, text: "moved Landing page rebuild to Review", t: "8m" },
    { c: "var(--amber)", who: 4, text: "created invoice #INV-0231 for Larkspur", t: "32m" },
    { c: "var(--violet)", who: 3, text: "logged 2h 14m on Landing page rebuild", t: "1h" },
    { c: "var(--rose)", who: 1, text: "closed the Meadowvale case study", t: "3h" },
  ];
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      {/* hero */}
      <div className="aj-card" style={{ position: "relative", overflow: "hidden", marginBottom: 18, background: "linear-gradient(120deg,#12171C,#1A2A2A)" }}>
        <svg viewBox="0 0 1180 150" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: .35 }}>
          <g stroke="#14B8A6" strokeWidth="1" fill="none">
            <path className="aj-mesh-line" d="M0 120 L200 50 L400 100 L620 30 L840 90 L1080 40 L1180 80" />
            <path className="aj-mesh-line" d="M0 40 L240 100 L480 44 L700 110 L920 50 L1180 120" />
          </g>
        </svg>
        <div className="aj-pad" style={{ position: "relative", padding: "26px 28px" }}>
          <div style={{ color: "#7FE3D6", fontSize: 12, fontWeight: 600, letterSpacing: ".05em", marginBottom: 6 }}>WEDNESDAY · GOOD MORNING</div>
          <h1 style={{ color: "#fff", fontSize: 27, marginBottom: 6 }}>Here's your workspace, Ritwik.</h1>
          <p style={{ color: "#9FB0AE", fontSize: 14, margin: 0 }}>8 tasks in motion · 3 meetings today · everything connected in one place.</p>
        </div>
      </div>

      {/* stat row */}
      <div className="aj-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 18 }}>
        {stats.map((s) => (
          <div key={s.lbl} className="aj-card aj-stat">
            <div className="lbl"><s.icon size={14} style={{ color: s.tone }} />{s.lbl}</div>
            <div className="num">{s.num}</div>
            <div className="sub aj-muted">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="aj-grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        {/* module hub */}
        <div>
          <div className="aj-section-h"><h3>Your modules</h3><span className="aj-muted" style={{ fontSize: 12 }}>{MODULES.length - 1} connected</span></div>
          <div className="aj-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            {MODULES.slice(1).map((m) => (
              <button key={m.key} className="aj-modtile" onClick={() => go(m.key)}>
                <div className="ico" style={{ background: m.color + "1A", color: m.color }}><m.icon size={19} /></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, display: "flex", alignItems: "center", gap: 6 }}>{m.label}{m.hot && <Flame size={13} style={{ color: "var(--amber)" }} />}</div>
                  <div className="aj-muted" style={{ fontSize: 11.5, marginTop: 2 }}>{m.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* activity + meetings */}
        <div>
          <div className="aj-section-h"><h3>Activity</h3></div>
          <div className="aj-card aj-pad" style={{ marginBottom: 16 }}>
            {feed.map((f, i) => (
              <div key={i} className="aj-feed-item">
                <span className="aj-feed-dot" style={{ background: f.c }} />
                <div style={{ fontSize: 13, flex: 1 }}>
                  <b>{person(f.who).name}</b> <span className="aj-muted">{f.text}</span>
                  <div className="aj-muted" style={{ fontSize: 11, marginTop: 2 }}>{f.t} ago</div>
                </div>
              </div>
            ))}
          </div>
          <div className="aj-section-h"><h3>Up next</h3></div>
          <div className="aj-card aj-pad">
            {MEETINGS_SEED.slice(0, 2).map((m) => (
              <div key={m.id} className="aj-between" style={{ padding: "8px 0" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.title}</div>
                  <div className="aj-muted mono" style={{ fontSize: 11, marginTop: 2 }}>{m.time}</div>
                </div>
                <div className="aj-row" style={{ gap: -6 }}>{m.who.map((w) => <Avatar key={w} id={w} size={24} />)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ TASKS ═══════════════ */

function Tasks({ users, currentUser }) {
  const safeUsers = Array.isArray(users) ? users : [];
  const [tasks, setTasks] = useState([]);   // start empty instead of hardcoded
  const [filter, setFilter] = useState("All");
  const [text, setText] = useState("");
  const [owner, setOwner] = useState(1);
  const [date, setDate] = useState(() => upcomingDates()[0].value);
  const [priority, setPriority] = useState("Med");
  // const [users, setUsers] = useState([]);
  const isAdmin = currentUser?.role === "admin";
  const [editing, setEditing] = useState(null);
  // Admins see everything; members see only tasks assigned to them
  const visibleTasks = isAdmin ? tasks : tasks.filter((t) => t.who === currentUser?.id);
  const filtered = visibleTasks.filter((t) => filter === "All" || t.status === filter);
  const [confirmDelete, setConfirmDelete] = useState(null);   // task pending deletion, or null
  // Fetch tasks from the backend once, when the page first loads
  useEffect(() => {
    api("/api/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error("Could not load tasks:", err));
  }, []);

  const add = () => {
    if (!text.trim()) return;

    api("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title: text.trim(), who: owner, prio: priority, status: "To do", due: date }),
    })
      .then((res) => res.json())
      .then((saved) => setTasks([saved, ...tasks]))
      .catch((err) => console.error("Could not save task:", err));

    setText("");
  };
  const cycle = (id) => {
    const task = tasks.find((t) => t.id === id);
    const nextStatus =
      task.status === "To do" ? "In progress"
        : task.status === "In progress" ? "Done"
          : "To do";

    api(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: nextStatus }),
    })
      .then((res) => res.json())
      .then((updated) => setTasks(tasks.map((t) => (t.id === id ? updated : t))))
      .catch((err) => console.error("Could not update task:", err));
  };
  const remove = (id) => {
    api(`/api/tasks/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => setTasks(tasks.filter((t) => t.id !== id)))
      .catch((err) => console.error("Could not delete task:", err));
  };

  const saveEdit = () => {
    api(`/api/tasks/${editing.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: editing.title, who: editing.who, prio: editing.prio,
        due: editing.due, status: editing.status,
      }),
    })
      .then((res) => res.json())
      .then((updated) => {
        setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
        setEditing(null);   // close the modal
      })
      .catch((err) => console.error("Could not save edit:", err));
  };
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <Head title="Tasks" sub="Organize and track everything the team is working on." />
      {isAdmin && (
        <div className="aj-card aj-pad" style={{ marginBottom: 16 }}>
          <div className="aj-row">
            <input className="aj-input" style={{ flex: 1 }} placeholder="Add a task…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
            <button className="aj-btn" onClick={add}><Plus size={15} />Add task</button>
            <label style={{ fontSize: 13, marginLeft: 12, color: "var(--muted)" }}>Assigned to:</label>
            <select className="aj-select" value={owner} onChange={(e) => setOwner(Number(e.target.value))}>
              {safeUsers.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
            <label style={{ fontSize: 13, marginLeft: 12, color: "var(--muted)" }}>Due Date:</label>
            <select className="aj-select" value={date} onChange={(e) => setDate(e.target.value)}>
              {upcomingDates().map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <label style={{ fontSize: 13, marginLeft: 12, color: "var(--muted)" }}>Priority:</label>
            <select className="aj-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="High">High</option>
              <option value="Med">Med</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="aj-row" style={{ marginTop: 14, gap: 8 }}>
            {["All", "To do", "In progress", "Done"].map((f) => (
              <button key={f} className={"aj-btn sm " + (filter === f ? "" : "ghost")} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>
      )}
      <div className="aj-card">
        <table className="aj-table">
          <thead>
            <tr>
              <th style={{ width: 30 }}>
              </th>
              <th>Task</th>
              {isAdmin && (<th>Owner</th>)}
              <th>Priority</th>
              <th>Status</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const pc = prioColor(t.prio), sc = statusColor(t.status);
              return (
                <tr key={t.id}>
                  <td><button onClick={() => cycle(t.id)} style={{ width: 20, height: 20, borderRadius: 6, border: "1.5px solid var(--border-strong)", background: t.status === "Done" ? "var(--teal)" : "transparent", cursor: "pointer", display: "grid", placeItems: "center" }}>{t.status === "Done" && <Check size={13} color="#fff" />}</button></td>
                  <td style={{ fontWeight: 500, textDecoration: t.status === "Done" ? "line-through" : "none", color: t.status === "Done" ? "var(--muted)" : "var(--text)" }}>{t.title}</td>
                  {isAdmin && (<td><Avatar id={t.who} users={safeUsers} /></td>)}
                  <td><span className="aj-chip" style={{ color: pc.c, background: pc.b }}>{t.prio}</span></td>
                  <td><span className="aj-chip" style={{ color: sc.c, background: sc.b }}>{t.status}</span></td>
                  <td className="mono aj-muted" style={{ fontSize: 12 }}>{t.due}</td>
                  {/* <td style={{ textAlign: "right" }}>
                    {isAdmin && (
                      <button onClick={() => remove(t.id)} style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--faint)" }}><X size={15} /></button>
                    )}
                  </td> */}
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {(isAdmin || t.created_by === currentUser?.id) && (
                      <>
                        <button onClick={() => setEditing(t)} title="Edit" style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--muted)", marginRight: 4 }}>
                          <SlidersHorizontal size={15} />
                        </button>
                        <button onClick={() => setConfirmDelete(t)} title="Delete" style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--faint)" }}>
                          <X size={15} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="aj-empty">No tasks here. Add one above to get started.</div>}
      </div>
      {editing && (
        <div onClick={() => setEditing(null)} style={{ position: "fixed", inset: 0, background: "rgba(18,23,28,.5)", display: "grid", placeItems: "center", zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} className="aj-card aj-pad" style={{ width: 420, padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Edit task</h3>

            <label style={{ fontSize: 12, color: "var(--muted)" }}>Title</label>
            <input className="aj-input" style={{ width: "100%", marginBottom: 12 }}
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })} />

            <label style={{ fontSize: 12, color: "var(--muted)" }}>Assigned to</label>
            <select className="aj-select" style={{ width: "100%", marginBottom: 12 }}
              value={editing.who}
              onChange={(e) => setEditing({ ...editing, who: Number(e.target.value) })}>
              {safeUsers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>

            <label style={{ fontSize: 12, color: "var(--muted)" }}>Priority</label>
            <select className="aj-select" style={{ width: "100%", marginBottom: 12 }}
              value={editing.prio}
              onChange={(e) => setEditing({ ...editing, prio: e.target.value })}>
              <option value="High">High</option><option value="Med">Med</option><option value="Low">Low</option>
            </select>

            <label style={{ fontSize: 12, color: "var(--muted)" }}>Due date</label>
            <select className="aj-select" style={{ width: "100%", marginBottom: 20 }}
              value={editing.due}
              onChange={(e) => setEditing({ ...editing, due: e.target.value })}>
              {upcomingDates().map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="aj-btn ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="aj-btn" onClick={saveEdit}>Save changes</button>
            </div>
          </div>
        </div>
      )}
      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} style={{ position: "fixed", inset: 0, background: "rgba(18,23,28,.5)", display: "grid", placeItems: "center", zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} className="aj-card aj-pad" style={{ width: 360, padding: 24 }}>
            <h3 style={{ marginBottom: 8 }}>Delete task?</h3>
            <p className="aj-muted" style={{ fontSize: 13.5, marginBottom: 20 }}>
              "{confirmDelete.title}" will be permanently deleted. This can't be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="aj-btn ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="aj-btn" style={{ background: "var(--rose)" }}
                onClick={() => { remove(confirmDelete.id); setConfirmDelete(null); }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ KANBAN ═══════════════ */
function Kanban() {
  const [board, setBoard] = useState(KANBAN_SEED);
  const move = (col, idx, dir) => {
    const ci = KCOLS.indexOf(col), ni = ci + dir;
    if (ni < 0 || ni >= KCOLS.length) return;
    const from = [...board[col]], [card] = from.splice(idx, 1);
    setBoard({ ...board, [col]: from, [KCOLS[ni]]: [...board[KCOLS[ni]], card] });
  };
  const addCard = (col) => {
    const t = prompt("New card for " + col + ":");
    if (t) setBoard({ ...board, [col]: [...board[col], { id: Date.now(), t, who: 1 }] });
  };
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <Head title="Kanban Boards" sub="Visualize work as it moves across stages." />
      <div className="aj-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {KCOLS.map((col) => (
          <div key={col} className="aj-kcol">
            <div className="aj-between" style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{col} <span className="aj-muted mono" style={{ fontSize: 11 }}>{board[col].length}</span></div>
              <button onClick={() => addCard(col)} style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--muted)" }}><Plus size={15} /></button>
            </div>
            {board[col].map((card, idx) => (
              <div key={card.id} className="aj-kcard">
                <div className="t">{card.t}</div>
                <div className="aj-between">
                  <Avatar id={card.who} size={22} />
                  <div className="aj-kmove">
                    <button disabled={KCOLS.indexOf(col) === 0} onClick={() => move(col, idx, -1)}><ChevronLeft size={14} /></button>
                    <button disabled={KCOLS.indexOf(col) === KCOLS.length - 1} onClick={() => move(col, idx, 1)}><ChevronRight size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ AUTOMATIONS / WORKFLOWS ═══════════════ */
function Automations() {
  const [rules, setRules] = useState(AUTOMATIONS_SEED);
  const [trig, setTrig] = useState(TRIGGERS[0]);
  const [act, setAct] = useState(ACTIONS[0]);
  const toggle = (id) => setRules(rules.map((r) => r.id === id ? { ...r, on: !r.on } : r));
  const add = () => setRules([...rules, { id: Date.now(), trigger: trig, action: act, on: true }]);
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <Head title="Workflows" sub="Every module emits events. Wire them to actions with trigger → action rules." action={<span className="aj-chip" style={{ color: "var(--amber)", background: "var(--amber-soft)" }}><Flame size={12} />Hot feature</span>} />
      <div className="aj-card aj-pad" style={{ marginBottom: 16 }}>
        <div className="aj-muted" style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>BUILD A RULE</div>
        <div className="aj-row" style={{ flexWrap: "wrap" }}>
          <span className="aj-chip" style={{ background: "var(--surface)", color: "var(--muted)" }}>WHEN</span>
          <select className="aj-select" value={trig} onChange={(e) => setTrig(e.target.value)}>{TRIGGERS.map((t) => <option key={t}>{t}</option>)}</select>
          <ArrowRight size={16} className="aj-muted" />
          <span className="aj-chip" style={{ background: "var(--surface)", color: "var(--muted)" }}>THEN</span>
          <select className="aj-select" value={act} onChange={(e) => setAct(e.target.value)}>{ACTIONS.map((a) => <option key={a}>{a}</option>)}</select>
          <button className="aj-btn" style={{ marginLeft: "auto" }} onClick={add}><Plus size={15} />Create</button>
        </div>
      </div>
      <div className="aj-grid" style={{ gap: 10 }}>
        {rules.map((r) => (
          <div key={r.id} className="aj-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, opacity: r.on ? 1 : .55 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--amber-soft)", display: "grid", placeItems: "center", color: "var(--amber)" }}><Zap size={17} /></div>
            <div style={{ flex: 1, fontSize: 13.5 }}>
              <span className="aj-muted">When</span> <b>{r.trigger}</b> <span className="aj-muted">then</span> <b>{r.action}</b>
            </div>
            <button className={"aj-toggle " + (r.on ? "on" : "off")} onClick={() => toggle(r.id)}><span /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ CUSTOM FIELDS ═══════════════ */
function Fields() {
  const [fields, setFields] = useState(FIELDS_SEED);
  const [name, setName] = useState(""); const [type, setType] = useState("Text"); const [applies, setApplies] = useState("Tasks");
  const add = () => { if (!name.trim()) return; setFields([...fields, { id: Date.now(), name: name.trim(), type, applies, req: false }]); setName(""); };
  const remove = (id) => setFields(fields.filter((f) => f.id !== id));
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <Head title="Custom Fields" sub="Extend any record type with fields that fit how you work." />
      <div className="aj-card aj-pad" style={{ marginBottom: 16 }}>
        <div className="aj-row" style={{ flexWrap: "wrap" }}>
          <input className="aj-input" style={{ flex: 1, minWidth: 160 }} placeholder="Field name…" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="aj-select" value={type} onChange={(e) => setType(e.target.value)}>{["Text", "Number", "Date", "Select", "Checkbox"].map((t) => <option key={t}>{t}</option>)}</select>
          <select className="aj-select" value={applies} onChange={(e) => setApplies(e.target.value)}>{["Tasks", "Clients", "Agreements", "Meetings"].map((t) => <option key={t}>{t}</option>)}</select>
          <button className="aj-btn" onClick={add}><Plus size={15} />Add field</button>
        </div>
      </div>
      <div className="aj-card">
        <table className="aj-table">
          <thead><tr><th>Field</th><th>Type</th><th>Applies to</th><th>Required</th><th></th></tr></thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.id}>
                <td style={{ fontWeight: 600 }}>{f.name}</td>
                <td><span className="aj-chip" style={{ background: "var(--surface)", color: "var(--muted)" }}>{f.type}</span></td>
                <td>{f.applies}</td>
                <td>{f.req ? <Check size={15} color="var(--teal)" /> : <span className="aj-muted">—</span>}</td>
                <td style={{ textAlign: "right" }}><button onClick={() => remove(f.id)} style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--faint)" }}><X size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════ MEETINGS ═══════════════ */
function Meetings() {
  const [meets, setMeets] = useState([]);
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  useEffect(() => {
    fetch(`${API}/api/meetings`)
      .then((res) => res.json())
      .then((data) => setMeets(data))
      .catch((err) => console.error("Could not load meetings:", err));
  }, []);
  const [filter, setFilter] = useState("All");
  const [text, setText] = useState("");
  const filtered = meets.filter((m) => filter === "All" || m.title.includes(text));
  const add = () => {
    const t = prompt("Meeting title:");
    if (!t) return;

    fetch(`${API}/api/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t, time: "Aug 12 · 2:00 PM", who: 1, link: 1 }),
    })
      .then((res) => res.json())
      .then((saved) => setMeets([...meets, saved]))
      .catch((err) => console.error("Could not save meeting:", err));
  };
  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <Head title="Meetings" sub="Schedule, organize and join — synced with your calendar." action={<button className="aj-btn" onClick={add}><Plus size={15} />Schedule</button>} />
      <div className="aj-grid" style={{ gap: 12 }}>
        {filtered.map((m) => (
          <div key={m.id} className="aj-card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 46, height: 46, borderRadius: 11, background: "var(--teal-soft)", color: "var(--teal-deep)", display: "grid", placeItems: "center" }}><CalendarDays size={20} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>{m.title}</div>
              <div className="aj-muted mono" style={{ fontSize: 12, marginTop: 3 }}>{m.time}</div>
            </div>
            <Avatar id={m.who} size={26} />
            <button className={"aj-btn sm " + (m.link ? "" : "ghost")}>{m.link ? <><Video size={13} />Join</> : "No link"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ CHATS ═══════════════ */
function Chats() {
  const [chan, setChan] = useState(CHANNELS[0]);
  const [store, setStore] = useState(MSG_SEED);
  const [text, setText] = useState("");
  const send = () => { if (!text.trim()) return; setStore({ ...store, [chan]: [...store[chan], { id: Date.now(), who: 1, text: text.trim(), me: true }] }); setText(""); };
  return (
    <div style={{ maxWidth: 1050, margin: "0 auto", height: "calc(100vh - 112px)" }}>
      <div className="aj-card" style={{ display: "flex", height: "100%", overflow: "hidden" }}>
        <div style={{ width: 210, borderRight: "1px solid var(--border)", padding: 12, flexShrink: 0 }}>
          <div className="aj-muted" style={{ fontSize: 11, fontWeight: 600, padding: "6px 10px", letterSpacing: ".06em" }}>CHANNELS</div>
          {CHANNELS.map((c) => <div key={c} className={"aj-chan " + (chan === c ? "on" : "")} onClick={() => setChan(c)}>{c}</div>)}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{chan}</div>
          <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            {store[chan].map((m) => (
              <div key={m.id} style={{ display: "flex", gap: 9, flexDirection: m.me ? "row-reverse" : "row" }}>
                {!m.me && <Avatar id={m.who} size={28} />}
                <div>
                  {!m.me && <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3, fontWeight: 600 }}>{person(m.who).name}</div>}
                  <div className={"aj-msg " + (m.me ? "me" : "them")}>{m.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: 14, borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
            <input className="aj-input" style={{ flex: 1 }} placeholder={"Message " + chan} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
            <button className="aj-btn" onClick={send}><Send size={15} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ TIME TRACKING ═══════════════ */
function TimeTracking() {
  const [running, setRunning] = useState(false);
  const [sec, setSec] = useState(0);
  const [logs, setLogs] = useState(TIMELOG_SEED);
  const ref = useRef(null);
  const toggle = () => {
    if (running) {
      clearInterval(ref.current); setRunning(false);
      if (sec > 0) { setLogs([{ id: Date.now(), task: "Untitled session", who: 1, dur: fmt(sec), date: "Today" }, ...logs]); setSec(0); }
    } else { setRunning(true); ref.current = setInterval(() => setSec((s) => s + 1), 1000); }
  };
  const fmt = (s) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <Head title="Time Tracking" sub="Track focus time and keep billable hours honest." />
      <div className="aj-card aj-pad" style={{ textAlign: "center", marginBottom: 18, padding: 30 }}>
        <div className="aj-timer mono" style={{ color: running ? "var(--teal)" : "var(--text)" }}>{fmt(sec)}</div>
        <button className="aj-btn" style={{ marginTop: 18, padding: "11px 26px", background: running ? "var(--rose)" : "var(--teal)" }} onClick={toggle}>
          {running ? <><Pause size={16} />Stop & log</> : <><Play size={16} />Start timer</>}
        </button>
      </div>
      <Head title="Logged today" />
      <div className="aj-card">
        <table className="aj-table">
          <thead><tr><th>Task</th><th>Member</th><th>Duration</th><th>Date</th></tr></thead>
          <tbody>{logs.map((l) => (
            <tr key={l.id}><td style={{ fontWeight: 500 }}>{l.task}</td><td><Avatar id={l.who} /></td><td className="mono" style={{ fontWeight: 600 }}>{l.dur}</td><td className="aj-muted">{l.date}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════ ATTENDANCE ═══════════════ */
function Attendance() {
  const [roster, setRoster] = useState(ATT_SEED);
  const states = { Present: { c: "var(--teal)", b: "var(--teal-soft)" }, Remote: { c: "var(--violet)", b: "#EDEAFB" }, Absent: { c: "var(--muted)", b: "var(--surface)" } };
  const cycle = (id) => setRoster(roster.map((r) => r.id === id ? { ...r, state: r.state === "Present" ? "Remote" : r.state === "Remote" ? "Absent" : "Present", since: r.state === "Absent" ? "9:00" : r.since } : r));
  const present = roster.filter((r) => r.state !== "Absent").length;
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <Head title="Attendance" sub={`${present} of ${roster.length} checked in today.`} />
      <div className="aj-grid" style={{ gap: 10 }}>
        {roster.map((r) => {
          const s = states[r.state];
          return (
            <div key={r.id} className="aj-card" style={{ padding: "13px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar id={r.id} size={34} />
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div><div className="aj-muted" style={{ fontSize: 12 }}>{r.role}</div></div>
              <div className="mono aj-muted" style={{ fontSize: 12 }}>{r.state !== "Absent" ? "in · " + r.since : "—"}</div>
              <button className="aj-chip" style={{ color: s.c, background: s.b, cursor: "pointer", border: 0 }} onClick={() => cycle(r.id)}><Circle size={9} fill={s.c} stroke="none" />{r.state}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════ REPORTS ═══════════════ */
function Reports() {
  const weekly = [{ d: "Mon", done: 6 }, { d: "Tue", done: 9 }, { d: "Wed", done: 5 }, { d: "Thu", done: 11 }, { d: "Fri", done: 8 }, { d: "Sat", done: 3 }];
  const byProject = [{ name: "Nimbus", value: 42, c: "#0E9384" }, { name: "Larkspur", value: 28, c: "#6D5AE0" }, { name: "Meadowvale", value: 18, c: "#E0912B" }, { name: "Internal", value: 12, c: "#C4553B" }];
  return (
    <div style={{ maxWidth: 1050, margin: "0 auto" }}>
      <Head title="Reports" sub="Insights across tasks, time and delivery." />
      <div className="aj-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 18 }}>
        {[{ l: "Tasks completed", v: "42", s: "this week", up: "+12%" }, { l: "Avg. cycle time", v: "2.4d", s: "per task", up: "-0.3d" }, { l: "Utilization", v: "78%", s: "billable hrs", up: "+5%" }].map((k) => (
          <div key={k.l} className="aj-card aj-stat"><div className="lbl">{k.l}</div><div className="num">{k.v}</div><div className="sub"><span className="aj-chip" style={{ color: "var(--teal)", background: "var(--teal-soft)" }}><TrendingUp size={11} />{k.up}</span><span className="aj-muted">{k.s}</span></div></div>
        ))}
      </div>
      <div className="aj-grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div className="aj-card aj-pad">
          <h3 style={{ fontSize: 14, marginBottom: 16 }}>Tasks completed this week</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={weekly} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDEFEA" />
              <XAxis dataKey="d" tick={{ fontSize: 12, fill: "#6C7871" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6C7871" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#F6F7F4" }} contentStyle={{ borderRadius: 10, border: "1px solid #E5E8E3", fontSize: 13 }} />
              <Bar dataKey="done" fill="#0E9384" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="aj-card aj-pad">
          <h3 style={{ fontSize: 14, marginBottom: 16 }}>Time by project</h3>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={byProject} dataKey="value" innerRadius={52} outerRadius={82} paddingAngle={3}>
                {byProject.map((e, i) => <Cell key={i} fill={e.c} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E8E3", fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 8 }}>
            {byProject.map((p) => <div key={p.name} className="aj-row" style={{ gap: 6, fontSize: 12 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: p.c }} />{p.name}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ LEADERBOARDS ═══════════════ */
function Leaderboards() {
  const medal = ["#E0912B", "#9AA49C", "#C4553B"];
  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <Head title="Leaderboards" sub="Points for closed tasks, streaks and on-time delivery." />
      <div className="aj-grid" style={{ gap: 10 }}>
        {LEADERS.map((r, i) => (
          <div key={r.id} className="aj-rank" style={i < 3 ? { borderColor: medal[i] + "66", background: medal[i] + "0D" } : {}}>
            <div className="pos" style={{ background: i < 3 ? medal[i] : "var(--surface)", color: i < 3 ? "#fff" : "var(--muted)" }}>{i + 1}</div>
            <Avatar id={r.id} size={38} />
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14.5 }}>{r.name}</div><div className="aj-muted" style={{ fontSize: 12 }}>{r.role}</div></div>
            <div className="aj-chip" style={{ color: "var(--amber)", background: "var(--amber-soft)" }}><Flame size={12} />{r.streak}d streak</div>
            <div className="mono" style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 18, minWidth: 60, textAlign: "right" }}>{r.pts.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ INTEGRATIONS ═══════════════ */
function Integrations() {
  const [list, setList] = useState(INTEGRATIONS_SEED);
  const toggle = (id) => setList(list.map((i) => i.id === id ? { ...i, on: !i.on } : i));
  const on = list.filter((i) => i.on).length;
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <Head title="Integrations" sub={`Connect external tools through iPaaS platforms and native links. ${on} active.`} />
      <div className="aj-grid" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
        {list.map((i) => (
          <div key={i.id} className="aj-integ">
            <div className="badge" style={{ background: i.color }}>{i.tag}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{i.name}</div>
              <div className="aj-muted" style={{ fontSize: 12, marginTop: 2 }}>{i.desc}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <button className={"aj-toggle " + (i.on ? "on" : "off")} onClick={() => toggle(i.id)}><span /></button>
              <div style={{ fontSize: 10.5, marginTop: 5, color: i.on ? "var(--teal)" : "var(--faint)", fontWeight: 600 }}>{i.on ? "Connected" : "Off"}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="aj-card aj-pad" style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, background: "var(--surface)" }}>
        <Link2 size={18} className="aj-muted" />
        <div style={{ fontSize: 13 }} className="aj-muted">Modules expose <b style={{ color: "var(--text)" }}>triggers</b> (new task, invoice, meeting, agreement, board) and <b style={{ color: "var(--text)" }}>actions</b> — connect once here, then automate in Workflows.</div>
      </div>
    </div>
  );
}