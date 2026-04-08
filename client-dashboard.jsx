import { useState, useEffect, useRef } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────
const SUPABASE_URL = "https://mwztnobeybuuslbfitnp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13enRub2JleWJ1dXNsYmZpdG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDI3NzAsImV4cCI6MjA4OTQxODc3MH0.xqyuF7jV2hZRJcIhMV4yekApp1r9oIFd168JSINy6pr8I";

// ─── MOCK CLIENT DATA ─────────────────────────────────────────
const CLIENT = {
  id: "client-001",
  name: "Marcus Williams",
  avatar: "MW",
  email: "marcus.w@email.com",
  package: "Contest Prep",
  coachName: "Coach Murray",
  startDate: "Sep 15, 2025",
  nextBilling: "Apr 15, 2026",
  monthlyRate: 299,
  stripePortalUrl: "https://billing.stripe.com/p/login/test_example",
  stats: {
    currentWeight: 198,
    goalWeight: 185,
    streak: 6,
    adherenceThisWeek: 5,
    sessionsTarget: 5,
    checkInSubmitted: false,
    unreadMessages: 2,
  },
};

const MACROS = {
  protein: { target: 220, unit: "g", color: "#E85C47" },
  carbs: { target: 280, unit: "g", color: "#E8C547" },
  fats: { target: 65, unit: "g", color: "#4793E8" },
  calories: { target: 2620, unit: "kcal", color: "#47E8A0" },
  notes: "Keep protein within 10g of target daily. Carbs can flex ±20g on training days. No refeed this week — stay on cut macros through the weekend.",
};

const PROGRAM = {
  blockName: "Peak Week Block — Week 3",
  coachNote: "Focus on full ROM and controlled eccentrics this week. Keep rest at 90s. Don't ego lift — positions matter more than weight right now.",
  days: [
    {
      day: "Mon", label: "Chest / Triceps", completed: true,
      exercises: [
        { name: "Incline DB Press", sets: 4, reps: "10-12", weight: "80 lbs", logged: true, note: "Control the descent" },
        { name: "Cable Fly (Low-to-High)", sets: 3, reps: "15", weight: "30 lbs", logged: true },
        { name: "Dip (Weighted)", sets: 3, reps: "8-10", weight: "BW+25", logged: true },
        { name: "Tricep Pushdown (V-Bar)", sets: 3, reps: "15-20", weight: "60 lbs", logged: true },
        { name: "Overhead DB Extension", sets: 3, reps: "12-15", weight: "65 lbs", logged: true },
      ],
    },
    {
      day: "Tue", label: "Back / Biceps", completed: true,
      exercises: [
        { name: "Barbell Row (Overhand)", sets: 4, reps: "8-10", weight: "185 lbs", logged: true },
        { name: "Lat Pulldown (Wide)", sets: 3, reps: "12", weight: "140 lbs", logged: true },
        { name: "Seated Cable Row (Close)", sets: 3, reps: "12-15", weight: "120 lbs", logged: true },
        { name: "Face Pulls", sets: 3, reps: "20", weight: "40 lbs", logged: true },
        { name: "Incline DB Curl", sets: 3, reps: "12", weight: "30 lbs", logged: true },
        { name: "Hammer Curl", sets: 3, reps: "15", weight: "35 lbs", logged: true },
      ],
    },
    {
      day: "Wed", label: "Rest / Cardio", completed: true,
      exercises: [
        { name: "Incline Walk (30 min)", sets: 1, reps: "30 min", weight: "Speed 3.5 / 8% incline", logged: true, note: "Fasted preferred" },
      ],
    },
    {
      day: "Thu", label: "Quads / Glutes", completed: false, today: true,
      exercises: [
        { name: "Hack Squat", sets: 4, reps: "10-12", weight: "—", logged: false },
        { name: "Leg Press (Narrow)", sets: 3, reps: "15", weight: "—", logged: false },
        { name: "Bulgarian Split Squat", sets: 3, reps: "10ea", weight: "—", logged: false, note: "Drive through heel, full depth" },
        { name: "Leg Extension (Slow Neg)", sets: 3, reps: "15-20", weight: "—", logged: false },
        { name: "Hip Thrust (Barbell)", sets: 3, reps: "12-15", weight: "—", logged: false },
        { name: "Incline Walk (20 min)", sets: 1, reps: "20 min", weight: "Post-workout", logged: false },
      ],
    },
    {
      day: "Fri", label: "Shoulders / Traps", completed: false,
      exercises: [
        { name: "Seated DB Press", sets: 4, reps: "10-12", weight: "—", logged: false },
        { name: "Cable Lateral Raise", sets: 4, reps: "15-20", weight: "—", logged: false },
        { name: "Rear Delt Fly (Pec Dec)", sets: 3, reps: "20", weight: "—", logged: false },
        { name: "DB Shrug", sets: 3, reps: "15-20", weight: "—", logged: false },
        { name: "Face Pulls (Rope)", sets: 3, reps: "20", weight: "—", logged: false },
      ],
    },
    {
      day: "Sat", label: "Hamstrings / Calves", completed: false,
      exercises: [
        { name: "Romanian Deadlift", sets: 4, reps: "10-12", weight: "—", logged: false },
        { name: "Lying Leg Curl", sets: 3, reps: "12-15", weight: "—", logged: false },
        { name: "Seated Leg Curl", sets: 3, reps: "15-20", weight: "—", logged: false },
        { name: "Standing Calf Raise", sets: 4, reps: "15-20", weight: "—", logged: false },
        { name: "Seated Calf Raise", sets: 4, reps: "20-25", weight: "—", logged: false },
      ],
    },
    {
      day: "Sun", label: "Rest", completed: false,
      exercises: [
        { name: "Full Rest Day", sets: 0, reps: "—", weight: "—", logged: false, note: "Recovery is part of the program." },
      ],
    },
  ],
};

const CHECKIN_HISTORY = [
  {
    week: "Week of Mar 10", weight: 200.2, sessions: 5, adherence: 90,
    energy: 4, sleep: 3, stress: 3,
    notes: "Felt a bit depleted mid-week but pushed through. Weekend nutrition was solid.",
    coachFeedback: "Great week Marcus. Weight is moving in the right direction. Keep protein up, I'm going to bump your morning carbs by 20g for the next 7 days — you need the fuel. Hit all 5 sessions, that's what we need.",
    coachFeedbackDate: "Mar 12",
  },
  {
    week: "Week of Mar 3", weight: 201.8, sessions: 4, adherence: 80,
    energy: 3, sleep: 4, stress: 2,
    notes: "Missed Saturday — family event. Energy was good overall.",
    coachFeedback: "Good week overall. One missed session but you communicated early, that's the right move. Scale is trending well. Going to keep macros the same this week and reassess after Thursday check-in.",
    coachFeedbackDate: "Mar 5",
  },
];

const WEIGHT_HISTORY = [
  { week: "Feb 3", weight: 204.5 },
  { week: "Feb 10", weight: 203.0 },
  { week: "Feb 17", weight: 202.4 },
  { week: "Feb 24", weight: 201.8 },
  { week: "Mar 3", weight: 201.8 },
  { week: "Mar 10", weight: 200.2 },
  { week: "Mar 17", weight: 198.0 },
];

const MESSAGES_DATA = [
  { id: 1, from: "coach", name: "Coach Murray", avatar: "JM", text: "Week 3 program is uploaded. Thursday is your heavy quad day — make sure you're fueled. Hit me if you have any questions before the session.", time: "Today, 8:14 AM", unread: true },
  { id: 2, from: "client", name: "Marcus Williams", avatar: "MW", text: "Should I add extra cardio on rest days? Energy has been solid.", time: "Yesterday, 7:30 PM", unread: false },
  { id: 3, from: "coach", name: "Coach Murray", avatar: "JM", text: "Hold off on extra cardio for now — we're deep in the cut and I want to preserve muscle. The scheduled cardio is enough. Once we're out of peak week I'll reassess.", time: "Yesterday, 8:05 PM", unread: true },
  { id: 4, from: "client", name: "Marcus Williams", avatar: "MW", text: "Got it. Also hit a new PR on hack squats last week — 315 for 10.", time: "2 days ago, 6:15 PM", unread: false },
  { id: 5, from: "coach", name: "Coach Murray", avatar: "JM", text: "That's MONEY. The conditioning work is paying off. Keep that same energy into this week's sessions. 💪", time: "2 days ago, 9:00 PM", unread: false },
];

const RESOURCES = [
  { id: 1, type: "pdf", title: "Peak Week Nutrition Protocol", desc: "Pre-competition carb cycling, water manipulation, and sodium guidelines.", date: "Mar 1", pinned: true },
  { id: 2, type: "video", title: "Posing Practice — Mandatory Poses", desc: "Full breakdown of your mandatory poses. Practice these daily.", date: "Feb 20", pinned: true },
  { id: 3, type: "pdf", title: "Contest Prep Supplement Stack", desc: "What to take, when to take it, and what to avoid close to show day.", date: "Feb 15", pinned: false },
  { id: 4, type: "pdf", title: "Training Log Template", desc: "Downloadable PDF to track weights, sets, and RPE each session.", date: "Jan 10", pinned: false },
  { id: 5, type: "link", title: "MyFitnessPal Macro Tracking Guide", desc: "How to accurately log food for your specific goals.", date: "Sep 20", pinned: false },
];

// ─── INJECT FONTS ─────────────────────────────────────────────
const injectFonts = () => {
  if (typeof document !== "undefined" && !document.getElementById("cm-fonts")) {
    const link = document.createElement("link");
    link.id = "cm-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.id = "cm-styles";
    style.textContent = `
      * { box-sizing: border-box; }
      :root { color-scheme: dark; }
      body { margin: 0; background: #0A0A0C; }
      @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      @keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
      @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      .cm-tab { transition: color 0.15s, background 0.15s; }
      .cm-tab:hover { background: rgba(255,255,255,0.04) !important; }
      .cm-nav-item { transition: all 0.15s ease; }
      .cm-nav-item:hover { background: rgba(255,255,255,0.04) !important; }
      .cm-btn { transition: all 0.15s ease; cursor: pointer; }
      .cm-btn:hover { filter: brightness(1.1); }
      .cm-btn:active { transform: scale(0.97); }
      textarea:focus, input:focus { outline: none !important; }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
    `;
    document.head.appendChild(style);
  }
};

// ─── ICONS ────────────────────────────────────────────────────
const Icon = ({ name, size = 20 }) => {
  const s = { width: size, height: size, strokeWidth: 1.8, fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", display: "block", flexShrink: 0 };
  const icons = {
    home: <svg {...s} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    dumbbell: <svg {...s} viewBox="0 0 24 24"><rect x="2" y="9" width="3" height="6" rx="1"/><rect x="19" y="9" width="3" height="6" rx="1"/><line x1="5" y1="12" x2="19" y2="12"/><rect x="5" y="7" width="2" height="10" rx="0.5"/><rect x="17" y="7" width="2" height="10" rx="0.5"/></svg>,
    nutrition: <svg {...s} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    checkin: <svg {...s} viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    chart: <svg {...s} viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    message: <svg {...s} viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    book: <svg {...s} viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
    user: <svg {...s} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    check: <svg {...s} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
    chevronRight: <svg {...s} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>,
    chevronDown: <svg {...s} viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>,
    fire: <svg {...s} viewBox="0 0 24 24"><path d="M12 2c0 0-5 5-5 10a5 5 0 0010 0c0-5-5-10-5-10z"/><path d="M12 12c0 0-2 2-2 3.5a2 2 0 004 0c0-1.5-2-3.5-2-3.5z" fill="currentColor"/></svg>,
    bell: <svg {...s} viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    camera: <svg {...s} viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    send: <svg {...s} viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none"/></svg>,
    download: <svg {...s} viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    externalLink: <svg {...s} viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
    star: <svg {...s} viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" stroke="currentColor"/></svg>,
    trendDown: <svg {...s} viewBox="0 0 24 24"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
    plus: <svg {...s} viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    video: <svg {...s} viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
    link: <svg {...s} viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
    target: <svg {...s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>,
    creditCard: <svg {...s} viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    grid: <svg {...s} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    x: <svg {...s} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    lock: <svg {...s} viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    paperclip: <svg {...s} viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>,
    info: <svg {...s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    arrowUp: <svg {...s} viewBox="0 0 24 24"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
    arrowDown: <svg {...s} viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  };
  return icons[name] || null;
};

// ─── WEIGHT SPARKLINE ─────────────────────────────────────────
const WeightSparkline = ({ data }) => {
  const vals = data.map(d => d.weight);
  const min = Math.min(...vals), max = Math.max(...vals);
  const W = 100, H = 32, pad = 3;
  const xStep = (W - pad * 2) / (vals.length - 1);
  const yScale = v => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
  const points = vals.map((v, i) => `${pad + i * xStep},${yScale(v)}`).join(" ");
  const lastX = pad + (vals.length - 1) * xStep;
  const lastY = yScale(vals[vals.length - 1]);
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="spkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8C547" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#E8C547" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${points} ${lastX},${H} ${pad},${H}`} fill="url(#spkGrad)" />
      <polyline points={points} fill="none" stroke="#E8C547" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3" fill="#E8C547" />
    </svg>
  );
};

// ─── MACRO RING ───────────────────────────────────────────────
const MacroRing = ({ value, target, color, label, unit = "g", size = 80 }) => {
  const pct = Math.min((value || 0) / target, 1);
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - pct * circ;
  const displayVal = value || target;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)", filter: `drop-shadow(0 0 6px ${color}60)` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#F0EDE6", lineHeight: 1, fontFamily: "'Syne', sans-serif" }}>{displayVal}</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.5px", fontFamily: "'DM Sans', sans-serif" }}>{unit}</span>
        </div>
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
    </div>
  );
};

// ─── WEIGHT CHART ─────────────────────────────────────────────
const WeightChart = ({ data }) => {
  const vals = data.map(d => d.weight);
  const min = Math.floor(Math.min(...vals)) - 2;
  const max = Math.ceil(Math.max(...vals)) + 2;
  const W = 100, H = 70;
  const xStep = W / (vals.length - 1);
  const yScale = v => H - ((v - min) / (max - min)) * H;
  const points = vals.map((v, i) => `${i * xStep},${yScale(v)}`).join(" ");
  const fill = vals.map((v, i) => `${i * xStep},${yScale(v)}`).join(" ") + ` ${(vals.length - 1) * xStep},${H} 0,${H}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 70, overflow: "visible" }}>
      <defs>
        <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8C547" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#E8C547" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill="url(#wGrad)" />
      <polyline points={points} fill="none" stroke="#E8C547" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {vals.map((v, i) => (
        <circle key={i} cx={i * xStep} cy={yScale(v)} r={i === vals.length - 1 ? 3.5 : 2} fill="#E8C547" />
      ))}
    </svg>
  );
};

// ─── SECTION LABEL ────────────────────────────────────────────
const SectionLabel = ({ children, action, onAction }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif" }}>
      {children}
    </span>
    {action && (
      <button onClick={onAction} style={{ fontSize: 11, color: "#E8C547", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
        {action}
      </button>
    )}
  </div>
);

// ─── COACH QUOTE ──────────────────────────────────────────────
const CoachQuote = ({ text, name = "Coach Murray", theme }) => (
  <div style={{ background: "rgba(232,197,71,0.05)", borderLeft: "2px solid rgba(232,197,71,0.5)", borderRadius: "0 10px 10px 0", padding: "12px 14px", marginBottom: 0 }}>
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#E8C547", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>{name}</div>
    <div style={{ fontSize: 13, color: "rgba(240,237,230,0.75)", lineHeight: 1.6, fontStyle: "italic", fontFamily: "'DM Sans', sans-serif" }}>"{text}"</div>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function ClientDashboard() {
  injectFonts();

  const [activeTab, setActiveTab] = useState("home");
  const [prevTab, setPrevTab] = useState(null);
  const [animateIn, setAnimateIn] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [checkinData, setCheckinData] = useState({ weight: "", sessions: "", energy: 3, sleep: 3, stress: 3, notes: "" });
  const [checkinSubmitted, setCheckinSubmitted] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [expandedDay, setExpandedDay] = useState("Thu");
  const [moreOpen, setMoreOpen] = useState(false);
  const [rpeValues, setRpeValues] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setAnimateIn(false);
    const t = setTimeout(() => setAnimateIn(true), 20);
    return () => clearTimeout(t);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "messages" && messagesEndRef.current) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [activeTab]);

  // ── THEME ─────────────────────────────────────────────────
  const T = {
    bg: "#0A0A0C",
    surface: "#111115",
    surfaceAlt: "#151519",
    surfaceElevated: "#1E1E24",
    border: "rgba(255,255,255,0.06)",
    borderMid: "rgba(255,255,255,0.1)",
    text: "#F0EDE6",
    textMuted: "rgba(255,255,255,0.42)",
    textDim: "rgba(255,255,255,0.2)",
    accent: "#E8C547",
    accentDim: "rgba(232,197,71,0.10)",
    accentGlow: "rgba(232,197,71,0.18)",
    green: "#47E8A0",
    greenDim: "rgba(71,232,160,0.10)",
    red: "#E85C47",
    redDim: "rgba(232,92,71,0.10)",
    blue: "#4793E8",
    blueDim: "rgba(71,147,232,0.10)",
  };

  // ── CARD STYLES ───────────────────────────────────────────
  const card = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: 14,
    padding: "18px 20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
  };

  const cardAccent = {
    ...card,
    background: "linear-gradient(#111115, #111115) padding-box, linear-gradient(135deg, rgba(232,197,71,0.25) 0%, rgba(232,197,71,0.05) 100%) border-box",
    border: "1px solid transparent",
  };

  const fadeIn = (delay = 0) => ({
    opacity: animateIn ? 1 : 0,
    transform: animateIn ? "translateY(0)" : "translateY(8px)",
    transition: `opacity 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  });

  const D = { fontFamily: "'Syne', sans-serif" };
  const B = { fontFamily: "'DM Sans', sans-serif" };

  // ── NAVIGATION ────────────────────────────────────────────
  const navItems = [
    { id: "home", icon: "home", label: "Home" },
    { id: "program", icon: "dumbbell", label: "Program" },
    { id: "nutrition", icon: "nutrition", label: "Nutrition" },
    { id: "checkin", icon: "checkin", label: "Check-In" },
    { id: "progress", icon: "chart", label: "Progress" },
    { id: "messages", icon: "message", label: "Messages" },
    { id: "resources", icon: "book", label: "Resources" },
    { id: "account", icon: "user", label: "Account" },
  ];

  const unreadCount = MESSAGES_DATA.filter(m => m.unread && m.from === "coach").length;

  const goTo = (id) => { setActiveTab(id); setMoreOpen(false); };

  // ── SIDEBAR (Desktop) ─────────────────────────────────────
  const Sidebar = () => (
    <div style={{ width: 210, minWidth: 210, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, overflowY: "auto" }}>
      {/* Brand */}
      <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${T.accent} 0%, #C4A020 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#0A0A0C", flexShrink: 0, ...D }}>JM</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, letterSpacing: "-0.3px", ...D }}>Coach Murray</div>
            <div style={{ fontSize: 9, color: T.textDim, letterSpacing: "1.8px", textTransform: "uppercase", marginTop: 1, ...B }}>Client Portal</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ padding: "10px 8px", flex: 1 }}>
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          const badge = item.id === "messages" && unreadCount > 0 ? unreadCount : null;
          const isDue = item.id === "checkin" && !checkinSubmitted;
          return (
            <div key={item.id} className="cm-nav-item" onClick={() => goTo(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 11, padding: "9px 12px 9px", borderRadius: 10,
                cursor: "pointer", marginBottom: 2, position: "relative",
                borderLeft: isActive ? `2px solid ${T.accent}` : "2px solid transparent",
                paddingLeft: isActive ? 10 : 12,
                background: isActive ? T.accentDim : "transparent",
                color: isActive ? T.accent : T.textMuted,
              }}>
              <Icon name={item.icon} size={16} />
              <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, letterSpacing: "-0.2px", ...B }}>{item.label}</span>
              {badge && <div style={{ marginLeft: "auto", background: T.red, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 8, padding: "1px 6px", ...B }}>{badge}</div>}
              {isDue && !badge && <div style={{ marginLeft: "auto", background: T.accent, color: "#0A0A0C", fontSize: 9, fontWeight: 700, borderRadius: 8, padding: "2px 6px", ...B }}>DUE</div>}
            </div>
          );
        })}
      </div>

      {/* Client footer */}
      <div style={{ padding: "14px 16px", borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #4793E8 0%, #2d6cbf 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0, ...D }}>{CLIENT.avatar}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...B }}>{CLIENT.name}</div>
            <div style={{ fontSize: 10, color: T.textDim, ...B }}>{CLIENT.package}</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── BOTTOM NAV (Mobile) ───────────────────────────────────
  const primaryNavItems = navItems.filter(n => ["home", "program", "checkin", "messages"].includes(n.id));
  const moreNavItems = navItems.filter(n => ["nutrition", "progress", "resources", "account"].includes(n.id));

  const BottomNav = () => (
    <>
      {moreOpen && <div onClick={() => setMoreOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 98, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />}
      {/* More drawer */}
      <div style={{ position: "fixed", left: 0, right: 0, zIndex: 99, bottom: moreOpen ? 58 : "-160px", transition: "bottom 0.35s cubic-bezier(0.16,1,0.3,1)", background: T.surfaceElevated, borderTop: `1px solid ${T.border}`, borderRadius: "18px 18px 0 0", padding: "16px 16px 8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {moreNavItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} onClick={() => goTo(item.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 6px", borderRadius: 12, cursor: "pointer", background: isActive ? T.accentDim : "rgba(255,255,255,0.03)", color: isActive ? T.accent : T.textMuted }}>
                <Icon name={item.icon} size={20} />
                <span style={{ fontSize: 10, marginTop: 5, fontWeight: isActive ? 700 : 400, ...B }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.surface, borderTop: `1px solid ${T.border}`, display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
        {[...primaryNavItems, { id: "__more__", icon: moreOpen ? "x" : "grid", label: "More" }].map(item => {
          const isActive = item.id === "__more__" ? moreOpen : activeTab === item.id;
          const badge = item.id === "messages" && unreadCount > 0;
          const isDue = item.id === "checkin" && !checkinSubmitted;
          return (
            <div key={item.id} onClick={() => item.id === "__more__" ? setMoreOpen(o => !o) : goTo(item.id)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 4px 5px", cursor: "pointer", position: "relative", color: isActive ? T.accent : T.textDim }}>
              {isActive && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 22, height: 2, borderRadius: "0 0 2px 2px", background: T.accent }} />}
              <Icon name={item.icon} size={20} />
              <span style={{ fontSize: 9, marginTop: 4, fontWeight: isActive ? 700 : 400, letterSpacing: "0.2px", ...B }}>{item.label}</span>
              {badge && <div style={{ position: "absolute", top: 7, right: "calc(50% - 14px)", width: 7, height: 7, borderRadius: "50%", background: T.red, border: `2px solid ${T.surface}` }} />}
              {isDue && !badge && <div style={{ position: "absolute", top: 7, right: "calc(50% - 14px)", width: 7, height: 7, borderRadius: "50%", background: T.accent, border: `2px solid ${T.surface}` }} />}
            </div>
          );
        })}
      </div>
    </>
  );

  // ══════════════════════════════════════════════════════════
  // ── HOME TAB ──────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════
  const HomeTab = () => {
    const { stats } = CLIENT;
    const today = PROGRAM.days.find(d => d.today);
    const adherencePct = Math.round((stats.adherenceThisWeek / stats.sessionsTarget) * 100);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header */}
        <div style={fadeIn(0)}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: T.accent, marginBottom: 6, ...B }}>
            Week 3 · Contest Prep
          </div>
          <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 800, color: T.text, letterSpacing: "-0.8px", lineHeight: 1.1, ...D }}>
            Good morning,<br />Marcus 👋
          </div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 6, ...B }}>
            {today ? `Today: ${today.label}` : "Rest day — recover well."} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </div>
        </div>

        {/* Check-in banner */}
        <div style={{ ...fadeIn(40), padding: "12px 16px", borderRadius: 12, background: checkinSubmitted ? T.greenDim : "rgba(232,197,71,0.07)", border: `1px solid ${checkinSubmitted ? "rgba(71,232,160,0.2)" : "rgba(232,197,71,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ color: checkinSubmitted ? T.green : T.accent }}><Icon name={checkinSubmitted ? "check" : "checkin"} size={15} /></div>
            <span style={{ fontSize: 12, color: T.text, fontWeight: 500, ...B }}>{checkinSubmitted ? "Check-in submitted — awaiting coach feedback" : "Weekly check-in due Sunday"}</span>
          </div>
          {!checkinSubmitted && (
            <button className="cm-btn" onClick={() => goTo("checkin")} style={{ fontSize: 11, fontWeight: 700, color: T.accent, background: "none", border: "none", cursor: "pointer", padding: 0, ...B }}>Submit →</button>
          )}
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, ...fadeIn(70) }}>
          {[
            { label: "Current Weight", value: `${stats.currentWeight}`, unit: "lbs", icon: "trendDown", color: T.green },
            { label: "Streak", value: `${stats.streak}`, unit: "days", icon: "fire", color: T.accent },
            { label: "Sessions", value: `${stats.adherenceThisWeek}/${stats.sessionsTarget}`, unit: "this week", icon: "dumbbell", color: T.blue },
            { label: "Adherence", value: `${adherencePct}%`, unit: "this week", icon: "chart", color: adherencePct >= 80 ? T.green : T.red },
          ].map((stat) => (
            <div key={stat.label} style={{ ...card, textAlign: "center", padding: "16px 12px" }}>
              <div style={{ color: stat.color, display: "flex", justifyContent: "center", marginBottom: 8 }}><Icon name={stat.icon} size={15} /></div>
              <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: stat.color, lineHeight: 1, ...D }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: T.textDim, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.8px", ...B }}>{stat.unit}</div>
              <div style={{ width: 20, height: 1, background: stat.color, borderRadius: 1, margin: "6px auto 0", opacity: 0.4 }} />
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 5, ...B }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Today's workout */}
        {today && (
          <div style={{ ...cardAccent, ...fadeIn(100) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: T.accent, marginBottom: 5, ...B }}>Today's Session</div>
                <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, color: T.text, letterSpacing: "-0.4px", ...D }}>{today.label}</div>
              </div>
              <div style={{ background: T.accentDim, color: T.accent, fontSize: 11, fontWeight: 700, borderRadius: 8, padding: "5px 10px", border: `1px solid rgba(232,197,71,0.15)`, ...B }}>
                {today.exercises.length} exercises
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {today.exercises.slice(0, 4).map((ex, i, arr) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <span style={{ fontSize: 13, color: T.text, ...B }}>{ex.name}</span>
                  <span style={{ fontSize: 12, color: T.textMuted, ...B }}>{ex.sets}×{ex.reps}</span>
                </div>
              ))}
              {today.exercises.length > 4 && (
                <div style={{ paddingTop: 10 }}>
                  <button className="cm-btn" onClick={() => goTo("program")} style={{ width: "100%", padding: "9px", borderRadius: 10, background: "rgba(232,197,71,0.07)", border: `1px solid rgba(232,197,71,0.15)`, color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", ...B }}>
                    View full session (+{today.exercises.length - 4} more) →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weight + Quick macro row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, ...fadeIn(140) }}>
          {/* Weight trend */}
          <div style={card}>
            <SectionLabel>Weight Trend</SectionLabel>
            <WeightSparkline data={WEIGHT_HISTORY} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: T.text, ...D }}>{CLIENT.stats.currentWeight}</span>
              <span style={{ fontSize: 12, color: T.textMuted, ...B }}>lbs</span>
            </div>
            <div style={{ fontSize: 11, color: T.green, marginTop: 2, ...B }}>↓ {(WEIGHT_HISTORY[0].weight - CLIENT.stats.currentWeight).toFixed(1)} from start</div>
          </div>
          {/* Goal */}
          <div style={card}>
            <SectionLabel>Goal</SectionLabel>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginTop: 8, ...D }}>{CLIENT.stats.goalWeight}</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, ...B }}>lbs target</div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: T.textDim, ...B }}>Progress</span>
                <span style={{ fontSize: 10, color: T.accent, ...B }}>
                  {Math.round(((WEIGHT_HISTORY[0].weight - CLIENT.stats.currentWeight) / (WEIGHT_HISTORY[0].weight - CLIENT.stats.goalWeight)) * 100)}%
                </span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", background: `linear-gradient(90deg, ${T.accent}, #D4A017)`, borderRadius: 4, width: `${Math.round(((WEIGHT_HISTORY[0].weight - CLIENT.stats.currentWeight) / (WEIGHT_HISTORY[0].weight - CLIENT.stats.goalWeight)) * 100)}%`, transition: "width 1s ease" }} />
              </div>
            </div>
            <div style={{ fontSize: 10, color: T.textDim, marginTop: 8, ...B }}>{(CLIENT.stats.currentWeight - CLIENT.stats.goalWeight).toFixed(1)} lbs to go</div>
          </div>
        </div>

        {/* Coach note */}
        <div style={fadeIn(170)}>
          <SectionLabel>Coach's Note This Week</SectionLabel>
          <CoachQuote text={PROGRAM.coachNote} theme={T} />
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // ── PROGRAM TAB ───────────────────────────────────────────
  // ══════════════════════════════════════════════════════════
  const ProgramTab = () => {
    const [sessionNotes, setSessionNotes] = useState("");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header */}
        <div style={fadeIn(0)}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: T.accent, marginBottom: 4, ...B }}>Training Program</div>
          <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: T.text, letterSpacing: "-0.5px", ...D }}>{PROGRAM.blockName}</div>
        </div>

        {/* Week calendar pills */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, ...fadeIn(40) }}>
          {PROGRAM.days.map((day) => (
            <div key={day.day} onClick={() => setExpandedDay(day.day)} className="cm-btn"
              style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 10, cursor: "pointer", border: `1px solid ${expandedDay === day.day ? "rgba(232,197,71,0.3)" : T.border}`, background: day.today ? T.accentDim : expandedDay === day.day ? "rgba(255,255,255,0.04)" : "transparent", position: "relative" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: day.today ? T.accent : expandedDay === day.day ? T.text : T.textMuted, textAlign: "center", ...B }}>{day.day}</div>
              {day.completed && <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.green, margin: "4px auto 0" }} />}
              {day.today && !day.completed && <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.accent, margin: "4px auto 0" }} />}
              {!day.completed && !day.today && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "transparent", margin: "4px auto 0" }} />}
            </div>
          ))}
        </div>

        {/* Selected day workout */}
        {PROGRAM.days.filter(d => d.day === expandedDay).map(day => (
          <div key={day.day} style={fadeIn(80)}>
            <div style={{ ...cardAccent }}>
              {/* Day header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: "-0.4px", ...D }}>{day.label}</div>
                    {day.today && <span style={{ fontSize: 10, background: T.accentDim, color: T.accent, padding: "2px 8px", borderRadius: 6, fontWeight: 700, border: `1px solid rgba(232,197,71,0.2)`, ...B }}>TODAY</span>}
                    {day.completed && <span style={{ fontSize: 10, background: T.greenDim, color: T.green, padding: "2px 8px", borderRadius: 6, fontWeight: 700, ...B }}>DONE</span>}
                  </div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, ...B }}>{day.exercises.length} exercises</div>
                </div>
              </div>

              {/* Exercise list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {day.exercises.map((ex, i) => (
                  <div key={i} style={{ padding: "11px 0", borderBottom: i < day.exercises.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, color: T.text, fontWeight: 500, ...B }}>{ex.name}</span>
                          {ex.logged && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, flexShrink: 0 }} />}
                        </div>
                        {ex.note && <div style={{ fontSize: 11, color: T.textDim, marginTop: 2, fontStyle: "italic", ...B }}>{ex.note}</div>}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                        <div style={{ fontSize: 13, color: T.textMuted, ...B }}>{ex.sets > 0 ? `${ex.sets}×${ex.reps}` : ex.reps}</div>
                        {ex.weight !== "—" && <div style={{ fontSize: 11, color: T.textDim, marginTop: 1, ...B }}>{ex.weight}</div>}
                      </div>
                    </div>
                    {/* RPE selector for today's incomplete */}
                    {day.today && !ex.logged && ex.sets > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 10, color: T.textDim, marginBottom: 6, letterSpacing: "0.5px", ...B }}>RPE</div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {[1,2,3,4,5,6,7,8,9,10].map(n => {
                            const key = `${day.day}-${i}`;
                            const isSelected = rpeValues[key] === n;
                            const rpeColor = n <= 4 ? T.green : n <= 7 ? T.accent : T.red;
                            return (
                              <div key={n} onClick={() => setRpeValues(p => ({ ...p, [key]: n }))}
                                style={{ width: 26, height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${isSelected ? rpeColor : T.border}`, background: isSelected ? `${rpeColor}20` : "transparent", color: isSelected ? rpeColor : T.textDim, transition: "all 0.15s", ...B }}>
                                {n}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Session notes for today */}
              {day.today && (
                <div style={{ marginTop: 16 }}>
                  <textarea
                    value={sessionNotes}
                    onChange={e => setSessionNotes(e.target.value)}
                    placeholder="Session notes (optional)..."
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", color: T.text, fontSize: 13, resize: "none", minHeight: 70, fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <button className="cm-btn" style={{ width: "100%", marginTop: 8, padding: "11px", borderRadius: 10, background: T.accent, color: "#0A0A0C", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", letterSpacing: "0.3px", ...B }}>
                    Mark Session Complete ✓
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Coach note */}
        <div style={fadeIn(120)}>
          <SectionLabel>Coach's Note</SectionLabel>
          <CoachQuote text={PROGRAM.coachNote} theme={T} />
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // ── NUTRITION TAB ─────────────────────────────────────────
  // ══════════════════════════════════════════════════════════
  const NutritionTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={fadeIn(0)}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: T.accent, marginBottom: 4, ...B }}>Nutrition Plan</div>
        <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: T.text, letterSpacing: "-0.5px", ...D }}>Daily Macros</div>
      </div>

      {/* Calories hero */}
      <div style={{ ...cardAccent, ...fadeIn(40), textAlign: "center", padding: "24px 20px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: T.textDim, marginBottom: 8, ...B }}>Daily Target</div>
        <div style={{ fontSize: isMobile ? 44 : 52, fontWeight: 800, color: T.green, letterSpacing: "-2px", lineHeight: 1, ...D }}>{MACROS.calories.target.toLocaleString()}</div>
        <div style={{ fontSize: 14, color: T.textMuted, marginTop: 4, ...B }}>kilocalories</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
          {[
            { label: "Protein", val: `${MACROS.protein.target}g`, color: MACROS.protein.color },
            { label: "Carbs", val: `${MACROS.carbs.target}g`, color: MACROS.carbs.color },
            { label: "Fats", val: `${MACROS.fats.target}g`, color: MACROS.fats.color },
          ].map(m => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "6px 12px", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: m.color, ...D }}>{m.val}</div>
              <div style={{ fontSize: 10, color: T.textDim, marginTop: 1, ...B }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Macro rings */}
      <div style={{ ...card, ...fadeIn(80) }}>
        <SectionLabel>Macro Breakdown</SectionLabel>
        <div style={{ display: "flex", justifyContent: "space-around", padding: "8px 0 4px" }}>
          <MacroRing value={null} target={MACROS.protein.target} color={MACROS.protein.color} label="Protein" unit="g" size={isMobile ? 72 : 88} />
          <MacroRing value={null} target={MACROS.carbs.target} color={MACROS.carbs.color} label="Carbs" unit="g" size={isMobile ? 72 : 88} />
          <MacroRing value={null} target={MACROS.fats.target} color={MACROS.fats.color} label="Fats" unit="g" size={isMobile ? 72 : 88} />
          <MacroRing value={null} target={MACROS.calories.target} color={MACROS.calories.color} label="Calories" unit="kcal" size={isMobile ? 72 : 88} />
        </div>
      </div>

      {/* Coach notes */}
      <div style={fadeIn(110)}>
        <SectionLabel>Nutrition Notes</SectionLabel>
        <CoachQuote text={MACROS.notes} theme={T} />
      </div>

      {/* Meal timing */}
      <div style={{ ...card, ...fadeIn(140) }}>
        <SectionLabel>Meal Timing Protocol</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { time: "7:00 AM", meal: "Meal 1 — Breakfast", note: "High protein, moderate carbs" },
            { time: "10:30 AM", meal: "Meal 2 — Mid-Morning", note: "Protein + fruit" },
            { time: "1:00 PM", meal: "Meal 3 — Lunch", note: "Balanced macros" },
            { time: "Pre-WO", meal: "Pre-Workout", note: "40–50g carbs, light protein" },
            { time: "Post-WO", meal: "Post-Workout", note: "Fast carbs + protein immediately" },
            { time: "7:30 PM", meal: "Meal 5 — Dinner", note: "High protein, lower carbs" },
          ].map((m, i, arr) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ width: 52, flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.accent, ...B }}>{m.time}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 500, ...B }}>{m.meal}</div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 1, ...B }}>{m.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // ── CHECK-IN TAB ──────────────────────────────────────────
  // ══════════════════════════════════════════════════════════
  const CheckInTab = () => {
    const metricLabels = {
      energy: { low: "Depleted", high: "Locked In" },
      sleep: { low: "Poor", high: "Great" },
      stress: { low: "Chill", high: "Overwhelmed" },
    };

    const handleSubmit = () => {
      if (!checkinData.weight || !checkinData.sessions) return;
      setCheckinSubmitted(true);
    };

    if (checkinSubmitted) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ ...cardAccent, textAlign: "center", padding: "32px 24px", ...fadeIn(0) }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: T.greenDim, border: `1px solid rgba(71,232,160,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: T.green }}><Icon name="check" size={22} /></div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 6, ...D }}>Check-In Submitted</div>
            <div style={{ fontSize: 13, color: T.textMuted, ...B }}>Coach Murray typically responds within 24 hours.</div>
          </div>
          <div style={{ ...card, ...fadeIn(60) }}>
            <SectionLabel>What You Submitted</SectionLabel>
            {[
              { label: "Weight", value: `${checkinData.weight} lbs` },
              { label: "Sessions Completed", value: checkinData.sessions },
              { label: "Energy", value: `${checkinData.energy}/5` },
              { label: "Sleep Quality", value: `${checkinData.sleep}/5` },
              { label: "Stress Level", value: `${checkinData.stress}/5` },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
                <span style={{ fontSize: 13, color: T.textMuted, ...B }}>{item.label}</span>
                <span style={{ fontSize: 13, color: T.text, fontWeight: 600, ...B }}>{item.value}</span>
              </div>
            ))}
            {checkinData.notes && (
              <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4, ...B }}>Notes</div>
                <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.5, ...B }}>{checkinData.notes}</div>
              </div>
            )}
          </div>
          {/* Previous feedback */}
          {CHECKIN_HISTORY.slice(0, 1).map((h, i) => (
            <div key={i} style={{ ...card, ...fadeIn(100) }}>
              <SectionLabel>Previous Feedback — {h.week}</SectionLabel>
              <CoachQuote text={h.coachFeedback} theme={T} />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={fadeIn(0)}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: T.accent, marginBottom: 4, ...B }}>Weekly Check-In</div>
          <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: T.text, letterSpacing: "-0.5px", ...D }}>How was your week?</div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4, ...B }}>Due Sunday · Takes 2 minutes</div>
        </div>

        {/* Weight */}
        <div style={{ ...card, ...fadeIn(40) }}>
          <SectionLabel>Morning Weight</SectionLabel>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              placeholder="0.0"
              value={checkinData.weight}
              onChange={e => setCheckinData(p => ({ ...p, weight: e.target.value }))}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${checkinData.weight ? "rgba(232,197,71,0.3)" : T.border}`, borderRadius: 10, padding: "14px 50px 14px 16px", color: T.text, fontSize: 22, fontWeight: 700, fontFamily: "'Syne', sans-serif", transition: "border-color 0.2s" }}
            />
            <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: T.textDim, fontFamily: "'DM Sans', sans-serif" }}>lbs</span>
          </div>
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 6, ...B }}>Take first thing in the morning, after bathroom</div>
        </div>

        {/* Sessions */}
        <div style={{ ...card, ...fadeIn(70) }}>
          <SectionLabel>Sessions Completed</SectionLabel>
          <div style={{ display: "flex", gap: 8 }}>
            {[0,1,2,3,4,5,6,7].map(n => {
              const isSelected = parseInt(checkinData.sessions) === n;
              return (
                <div key={n} onClick={() => setCheckinData(p => ({ ...p, sessions: n }))}
                  style={{ flex: 1, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, cursor: "pointer", border: `1px solid ${isSelected ? T.accent : T.border}`, background: isSelected ? T.accentDim : "rgba(255,255,255,0.02)", color: isSelected ? T.accent : T.textMuted, fontSize: 14, fontWeight: 700, transition: "all 0.15s", ...D }}>
                  {n}
                </div>
              );
            })}
          </div>
        </div>

        {/* Metrics */}
        {["energy", "sleep", "stress"].map((metric, mi) => (
          <div key={metric} style={{ ...card, ...fadeIn(100 + mi * 30) }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <SectionLabel>{metric.charAt(0).toUpperCase() + metric.slice(1)}</SectionLabel>
              <div />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: T.textDim, ...B }}>{metricLabels[metric].low}</span>
              <span style={{ fontSize: 10, color: T.textDim, ...B }}>{metricLabels[metric].high}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[1,2,3,4,5].map(n => {
                const isSelected = checkinData[metric] === n;
                const barColor = metric === "stress" ? (n >= 4 ? T.red : n === 3 ? T.accent : T.green) : (n >= 4 ? T.green : n === 3 ? T.accent : T.red);
                return (
                  <div key={n} onClick={() => setCheckinData(p => ({ ...p, [metric]: n }))}
                    style={{ flex: 1, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, cursor: "pointer", border: `1px solid ${isSelected ? barColor : T.border}`, background: isSelected ? `${barColor}18` : "rgba(255,255,255,0.02)", color: isSelected ? barColor : T.textDim, fontSize: 14, fontWeight: 700, transition: "all 0.15s", boxShadow: isSelected ? `0 0 10px ${barColor}30` : "none", ...D }}>
                    {n}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Notes */}
        <div style={{ ...card, ...fadeIn(200) }}>
          <SectionLabel>Notes for Coach (Optional)</SectionLabel>
          <textarea
            value={checkinData.notes}
            onChange={e => setCheckinData(p => ({ ...p, notes: e.target.value }))}
            placeholder="How did the week feel? Any wins, challenges, or questions for Coach Murray..."
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", color: T.text, fontSize: 13, resize: "none", minHeight: 90, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s" }}
          />
        </div>

        <div style={fadeIn(230)}>
          <button className="cm-btn" onClick={handleSubmit}
            style={{ width: "100%", padding: "14px", borderRadius: 12, background: checkinData.weight && checkinData.sessions !== "" ? T.accent : "rgba(232,197,71,0.3)", color: "#0A0A0C", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", letterSpacing: "0.3px", ...B }}>
            Submit Check-In →
          </button>
          <div style={{ fontSize: 11, color: T.textDim, textAlign: "center", marginTop: 8, ...B }}>Coach Murray responds within 24 hours</div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // ── PROGRESS TAB ──────────────────────────────────────────
  // ══════════════════════════════════════════════════════════
  const ProgressTab = () => {
    const totalLost = (WEIGHT_HISTORY[0].weight - CLIENT.stats.currentWeight).toFixed(1);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={fadeIn(0)}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: T.accent, marginBottom: 4, ...B }}>Progress Tracking</div>
          <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: T.text, letterSpacing: "-0.5px", ...D }}>Your Journey</div>
        </div>

        {/* Big weight stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, ...fadeIn(40) }}>
          {[
            { label: "Start", value: WEIGHT_HISTORY[0].weight, unit: "lbs", color: T.textMuted },
            { label: "Current", value: CLIENT.stats.currentWeight, unit: "lbs", color: T.accent },
            { label: "Goal", value: CLIENT.stats.goalWeight, unit: "lbs", color: T.green },
          ].map(s => (
            <div key={s.label} style={{ ...card, textAlign: "center", padding: "14px 10px" }}>
              <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4, ...B }}>{s.label}</div>
              <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: s.color, ...D }}>{s.value}</div>
              <div style={{ fontSize: 10, color: T.textDim, ...B }}>{s.unit}</div>
            </div>
          ))}
        </div>

        {/* Weight chart */}
        <div style={{ ...card, ...fadeIn(70) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <SectionLabel>Weight Over Time</SectionLabel>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.text, ...D }}>{CLIENT.stats.currentWeight} <span style={{ fontSize: 13, color: T.textMuted, fontWeight: 400, ...B }}>lbs</span></div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.green, ...D }}>↓ {totalLost}</div>
              <div style={{ fontSize: 10, color: T.textDim, marginTop: 1, ...B }}>total lost</div>
            </div>
          </div>
          <WeightChart data={WEIGHT_HISTORY} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 9, color: T.textDim, ...B }}>{WEIGHT_HISTORY[0].week}</span>
            <span style={{ fontSize: 9, color: T.textDim, ...B }}>{WEIGHT_HISTORY[WEIGHT_HISTORY.length-1].week}</span>
          </div>
        </div>

        {/* Check-in history */}
        <div style={fadeIn(100)}>
          <SectionLabel>Check-In History</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CHECKIN_HISTORY.map((h, i) => (
              <div key={i} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, ...B }}>{h.week}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: T.accent, ...D }}>{h.weight}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {[
                    { label: "Sessions", value: h.sessions, icon: "dumbbell" },
                    { label: "Adherence", value: `${h.adherence}%`, icon: "chart" },
                    { label: "Energy", value: `${h.energy}/5`, icon: "fire" },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, ...D }}>{stat.value}</div>
                      <div style={{ fontSize: 10, color: T.textDim, marginTop: 2, ...B }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                <CoachQuote text={h.coachFeedback} theme={T} />
              </div>
            ))}
          </div>
        </div>

        {/* Measurements */}
        <div style={{ ...card, ...fadeIn(130) }}>
          <SectionLabel>Body Measurements</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { site: "Chest", current: "42\"", start: "43.5\"", delta: "-1.5" },
              { site: "Waist", current: "33\"", start: "35\"", delta: "-2.0" },
              { site: "Arms", current: "16.5\"", start: "16.5\"", delta: "0" },
              { site: "Quads", current: "25\"", start: "25.5\"", delta: "-0.5" },
              { site: "Hips", current: "40\"", start: "41.5\"", delta: "-1.5" },
              { site: "Calves", current: "15.5\"", start: "15.5\"", delta: "0" },
            ].map(m => (
              <div key={m.site} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.8px", ...B }}>{m.site}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text, ...D }}>{m.current}</div>
                <div style={{ fontSize: 11, color: parseFloat(m.delta) < 0 ? T.green : parseFloat(m.delta) > 0 ? T.red : T.textDim, marginTop: 2, ...B }}>
                  {parseFloat(m.delta) !== 0 ? m.delta + "\"" : "—"} {parseFloat(m.delta) < 0 ? "↓" : parseFloat(m.delta) > 0 ? "↑" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div style={{ ...card, ...fadeIn(160) }}>
          <SectionLabel>Progress Photos</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {["Start", "Current", "Goal"].map((label, i) => (
              <div key={label} style={{ borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, aspectRatio: "3/4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
                <div style={{ color: T.textDim }}><Icon name="camera" size={20} /></div>
                <div style={{ fontSize: 10, color: T.textDim, ...B }}>{label}</div>
              </div>
            ))}
          </div>
          <button className="cm-btn" style={{ width: "100%", marginTop: 12, padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", ...B }}>
            + Upload Progress Photo
          </button>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // ── MESSAGES TAB ──────────────────────────────────════════
  // ══════════════════════════════════════════════════════════
  const MessagesTab = () => {
    const [messages, setMessages] = useState(MESSAGES_DATA);
    const [text, setMessageTextLocal] = useState(messageText);

    const handleSend = () => {
      if (!text.trim()) return;
      setMessages(prev => [...prev, { id: Date.now(), from: "client", name: CLIENT.name, avatar: CLIENT.avatar, text: text.trim(), time: "Just now", unread: false }]);
      setMessageTextLocal("");
      setMessageText("");
    };

    const grouped = [];
    let currentDate = null;
    messages.forEach(m => {
      const dateLabel = m.time.startsWith("Today") ? "Today" : m.time.startsWith("Yesterday") ? "Yesterday" : "2 days ago";
      if (dateLabel !== currentDate) { grouped.push({ type: "date", label: dateLabel }); currentDate = dateLabel; }
      grouped.push({ type: "message", ...m });
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "calc(100vh - 120px)" : "calc(100vh - 80px)", gap: 0 }}>
        {/* Header */}
        <div style={{ padding: "0 0 14px", ...fadeIn(0) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${T.accent}, #C4A020)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#0A0A0C", ...D }}>JM</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, ...D }}>Coach Murray</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green }} />
                <span style={{ fontSize: 11, color: T.textMuted, ...B }}>Active coach</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages scroll area */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, paddingBottom: 12 }}>
          {grouped.map((item, idx) => {
            if (item.type === "date") {
              return (
                <div key={idx} style={{ textAlign: "center", padding: "10px 0 4px" }}>
                  <span style={{ fontSize: 10, color: T.textDim, background: T.surface, padding: "3px 10px", borderRadius: 20, border: `1px solid ${T.border}`, ...B }}>{item.label}</span>
                </div>
              );
            }
            const isCoach = item.from === "coach";
            return (
              <div key={item.id} style={{ display: "flex", flexDirection: "column", alignItems: isCoach ? "flex-start" : "flex-end", marginBottom: 4 }}>
                {isCoach && (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, maxWidth: "82%" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${T.accent}, #C4A020)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#0A0A0C", flexShrink: 0, ...D }}>{item.avatar}</div>
                    <div>
                      <div style={{ padding: "10px 14px", borderRadius: "4px 16px 16px 16px", background: "rgba(232,197,71,0.08)", border: `1px solid rgba(232,197,71,0.14)`, maxWidth: "100%" }}>
                        <div style={{ fontSize: 13, color: T.text, lineHeight: 1.55, ...B }}>{item.text}</div>
                      </div>
                      <div style={{ fontSize: 10, color: T.textDim, marginTop: 4, paddingLeft: 2, display: "flex", alignItems: "center", gap: 6, ...B }}>
                        {item.time}
                        {item.unread && <span style={{ fontSize: 9, background: T.red, color: "#fff", padding: "1px 5px", borderRadius: 4, fontWeight: 700, ...B }}>NEW</span>}
                      </div>
                    </div>
                  </div>
                )}
                {!isCoach && (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, maxWidth: "82%" }}>
                    <div>
                      <div style={{ padding: "10px 14px", borderRadius: "16px 4px 16px 16px", background: "rgba(71,147,232,0.12)", border: `1px solid rgba(71,147,232,0.2)` }}>
                        <div style={{ fontSize: 13, color: T.text, lineHeight: 1.55, ...B }}>{item.text}</div>
                      </div>
                      <div style={{ fontSize: 10, color: T.textDim, marginTop: 4, textAlign: "right", paddingRight: 2, ...B }}>{item.time}</div>
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #4793E8 0%, #2d6cbf 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0, ...D }}>{item.avatar}</div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              value={text}
              onChange={e => setMessageTextLocal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Message Coach Murray..."
              rows={1}
              style={{ flex: 1, background: T.surfaceElevated, border: `1px solid ${T.borderMid}`, borderRadius: 12, padding: "11px 14px", color: T.text, fontSize: 13, resize: "none", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4, maxHeight: 100, overflow: "auto" }}
            />
            <button className="cm-btn" onClick={handleSend}
              style={{ width: 40, height: 40, borderRadius: 10, background: text.trim() ? T.accent : "rgba(232,197,71,0.2)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: text.trim() ? "#0A0A0C" : T.textDim, transition: "all 0.2s", flexShrink: 0 }}>
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // ── RESOURCES TAB ─────────────────────────────────────────
  // ══════════════════════════════════════════════════════════
  const ResourcesTab = () => {
    const typeIcon = { pdf: "download", video: "video", link: "externalLink" };
    const typeColor = { pdf: T.red, video: T.blue, link: T.green };
    const pinned = RESOURCES.filter(r => r.pinned);
    const rest = RESOURCES.filter(r => !r.pinned);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={fadeIn(0)}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: T.accent, marginBottom: 4, ...B }}>Resources</div>
          <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: T.text, letterSpacing: "-0.5px", ...D }}>Your Library</div>
        </div>

        {pinned.length > 0 && (
          <div style={fadeIn(40)}>
            <SectionLabel>Pinned</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pinned.map(r => (
                <div key={r.id} style={{ ...cardAccent, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", padding: "14px 16px" }} className="cm-btn">
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${typeColor[r.type]}18`, border: `1px solid ${typeColor[r.type]}30`, display: "flex", alignItems: "center", justifyContent: "center", color: typeColor[r.type], flexShrink: 0 }}>
                    <Icon name={typeIcon[r.type]} size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2, ...B }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: T.textDim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...B }}>{r.desc}</div>
                  </div>
                  <div style={{ flexShrink: 0, color: T.textDim }}><Icon name="chevronRight" size={14} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={fadeIn(80)}>
          <SectionLabel>All Resources</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rest.map(r => (
              <div key={r.id} style={{ ...card, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", padding: "14px 16px" }} className="cm-btn">
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${typeColor[r.type]}12`, border: `1px solid ${typeColor[r.type]}25`, display: "flex", alignItems: "center", justifyContent: "center", color: typeColor[r.type], flexShrink: 0 }}>
                  <Icon name={typeIcon[r.type]} size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 1, ...B }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: T.textDim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...B }}>{r.desc}</div>
                </div>
                <div style={{ fontSize: 10, color: T.textDim, flexShrink: 0, ...B }}>{r.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // ── ACCOUNT TAB ───────────────────────────────────────────
  // ══════════════════════════════════════════════════════════
  const AccountTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={fadeIn(0)}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: T.accent, marginBottom: 4, ...B }}>Account</div>
        <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: T.text, letterSpacing: "-0.5px", ...D }}>Your Profile</div>
      </div>

      {/* Profile card */}
      <div style={{ ...cardAccent, ...fadeIn(40), display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, #4793E8 0%, #2d6cbf 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", flexShrink: 0, ...D }}>{CLIENT.avatar}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: "-0.4px", ...D }}>{CLIENT.name}</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, ...B }}>{CLIENT.email}</div>
        </div>
        <div style={{ background: T.accentDim, color: T.accent, fontSize: 11, fontWeight: 700, borderRadius: 8, padding: "5px 10px", border: `1px solid rgba(232,197,71,0.2)`, ...B }}>{CLIENT.package}</div>
      </div>

      {/* Package info */}
      <div style={{ ...card, ...fadeIn(70) }}>
        <SectionLabel>Coaching Package</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { label: "Package", value: CLIENT.package },
            { label: "Coach", value: CLIENT.coachName },
            { label: "Start Date", value: CLIENT.startDate },
            { label: "Monthly Rate", value: `$${CLIENT.monthlyRate}/mo` },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <span style={{ fontSize: 13, color: T.textMuted, ...B }}>{item.label}</span>
              <span style={{ fontSize: 13, color: T.text, fontWeight: 600, ...B }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Billing */}
      <div style={{ ...card, ...fadeIn(100) }}>
        <SectionLabel>Billing</SectionLabel>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 13, color: T.textMuted, ...B }}>Next Billing Date</span>
          <span style={{ fontSize: 13, color: T.text, fontWeight: 600, ...B }}>{CLIENT.nextBilling}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0" }}>
          <span style={{ fontSize: 13, color: T.textMuted, ...B }}>Billing Status</span>
          <span style={{ fontSize: 13, color: T.green, fontWeight: 600, ...B }}>✓ Active</span>
        </div>
        <button className="cm-btn" onClick={() => window.open(CLIENT.stripePortalUrl, "_blank")}
          style={{ width: "100%", marginTop: 14, padding: "11px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...B }}>
          <Icon name="creditCard" size={14} />
          Manage Billing Portal
        </button>
      </div>

      {/* Quick links */}
      <div style={{ ...card, ...fadeIn(130) }}>
        <SectionLabel>Quick Links</SectionLabel>
        {[
          { label: "Message Coach Murray", icon: "message", action: () => goTo("messages") },
          { label: "Submit Check-In", icon: "checkin", action: () => goTo("checkin") },
          { label: "View Resources", icon: "book", action: () => goTo("resources") },
        ].map((item, i, arr) => (
          <div key={i} onClick={item.action} className="cm-btn"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none", cursor: "pointer", color: T.textMuted }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name={item.icon} size={15} />
              <span style={{ fontSize: 13, color: T.text, ...B }}>{item.label}</span>
            </div>
            <Icon name="chevronRight" size={14} />
          </div>
        ))}
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────
  const tabComponents = {
    home: <HomeTab />,
    program: <ProgramTab />,
    nutrition: <NutritionTab />,
    checkin: <CheckInTab />,
    progress: <ProgressTab />,
    messages: <MessagesTab />,
    resources: <ResourcesTab />,
    account: <AccountTab />,
  };

  const contentPad = isMobile ? "16px 16px 80px" : "28px 32px";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: `radial-gradient(ellipse 80% 50% at 20% -10%, rgba(232,197,71,0.06) 0%, transparent 60%), ${T.bg}`, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar — desktop only */}
      {!isMobile && <Sidebar />}

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto", overflowX: "hidden" }}>
        {/* Desktop top bar */}
        {!isMobile && (
          <div style={{ padding: "20px 32px 0", borderBottom: `1px solid ${T.border}`, marginBottom: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 18 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: "-0.5px", ...D }}>
                  {navItems.find(n => n.id === activeTab)?.label}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {unreadCount > 0 && (
                  <div onClick={() => goTo("messages")} className="cm-btn"
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: T.redDim, border: `1px solid rgba(232,92,71,0.2)`, cursor: "pointer", color: T.red }}>
                    <Icon name="bell" size={14} />
                    <span style={{ fontSize: 12, fontWeight: 700, ...B }}>{unreadCount} new message{unreadCount > 1 ? "s" : ""}</span>
                  </div>
                )}
                {!checkinSubmitted && (
                  <div onClick={() => goTo("checkin")} className="cm-btn"
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: T.accentDim, border: `1px solid rgba(232,197,71,0.2)`, cursor: "pointer", color: T.accent }}>
                    <Icon name="checkin" size={14} />
                    <span style={{ fontSize: 12, fontWeight: 700, ...B }}>Check-In Due</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile top bar */}
        {isMobile && (
          <div style={{ padding: "16px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, background: T.bg, zIndex: 50, backdropFilter: "blur(12px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${T.accent}, #C4A020)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, color: "#0A0A0C", ...D }}>JM</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, ...D }}>Coach Murray</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {unreadCount > 0 && (
                <div onClick={() => goTo("messages")} style={{ position: "relative", cursor: "pointer", color: T.textDim }}>
                  <Icon name="message" size={20} />
                  <div style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: "50%", background: T.red, border: `2px solid ${T.bg}` }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab content */}
        <div style={{ padding: contentPad, maxWidth: 820, margin: "0 auto" }}>
          {tabComponents[activeTab]}
        </div>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && <BottomNav />}
    </div>
  );
}
