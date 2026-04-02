import { useState, useEffect, useRef } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────
// TODO: Replace with actual Supabase client + auth session
const SUPABASE_URL = "https://mwztnobeybuuslbfitnp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13enRub2JleWJ1dXNsYmZpdG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDI3NzAsImV4cCI6MjA4OTQxODc3MH0.xqyuF7jV2hZRJcIhMV4yekApp1r9oIFd168JSINy6pr8I";

// ─── MOCK CLIENT DATA ─────────────────────────────────────────
// TODO: Replace with Supabase query filtered by auth user_id
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
      day: "Monday", label: "Chest / Triceps", completed: true,
      exercises: [
        { name: "Incline DB Press", sets: 4, reps: "10-12", weight: "80 lbs", logged: true, note: "Control the descent" },
        { name: "Cable Fly (Low-to-High)", sets: 3, reps: "15", weight: "30 lbs", logged: true },
        { name: "Dip (Weighted)", sets: 3, reps: "8-10", weight: "BW+25", logged: true },
        { name: "Tricep Pushdown (V-Bar)", sets: 3, reps: "15-20", weight: "60 lbs", logged: true },
        { name: "Overhead DB Extension", sets: 3, reps: "12-15", weight: "65 lbs", logged: true },
      ],
    },
    {
      day: "Tuesday", label: "Back / Biceps", completed: true,
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
      day: "Wednesday", label: "Rest / Cardio", completed: true,
      exercises: [
        { name: "Incline Walk (30 min)", sets: 1, reps: "30 min", weight: "Speed 3.5 / 8% incline", logged: true, note: "Fasted preferred" },
      ],
    },
    {
      day: "Thursday", label: "Quads / Glutes", completed: false, today: true,
      exercises: [
        { name: "Hack Squat", sets: 4, reps: "10-12", weight: "—", logged: false },
        { name: "Leg Press (Narrow Stance)", sets: 3, reps: "15", weight: "—", logged: false },
        { name: "Bulgarian Split Squat", sets: 3, reps: "10ea", weight: "—", logged: false, note: "Drive through heel, full depth" },
        { name: "Leg Extension (Slow Neg)", sets: 3, reps: "15-20", weight: "—", logged: false },
        { name: "Hip Thrust (Barbell)", sets: 3, reps: "12-15", weight: "—", logged: false },
        { name: "Incline Walk (20 min)", sets: 1, reps: "20 min", weight: "Post-workout", logged: false },
      ],
    },
    {
      day: "Friday", label: "Shoulders / Traps", completed: false,
      exercises: [
        { name: "Seated DB Press", sets: 4, reps: "10-12", weight: "—", logged: false },
        { name: "Cable Lateral Raise", sets: 4, reps: "15-20", weight: "—", logged: false },
        { name: "Rear Delt Fly (Pec Dec)", sets: 3, reps: "20", weight: "—", logged: false },
        { name: "DB Shrug", sets: 3, reps: "15-20", weight: "—", logged: false },
        { name: "Face Pulls (Rope)", sets: 3, reps: "20", weight: "—", logged: false },
      ],
    },
    {
      day: "Saturday", label: "Hamstrings / Calves", completed: false,
      exercises: [
        { name: "Romanian Deadlift", sets: 4, reps: "10-12", weight: "—", logged: false },
        { name: "Lying Leg Curl", sets: 3, reps: "12-15", weight: "—", logged: false },
        { name: "Seated Leg Curl", sets: 3, reps: "15-20", weight: "—", logged: false },
        { name: "Standing Calf Raise", sets: 4, reps: "15-20", weight: "—", logged: false },
        { name: "Seated Calf Raise", sets: 4, reps: "20-25", weight: "—", logged: false },
      ],
    },
    {
      day: "Sunday", label: "Rest", completed: false,
      exercises: [
        { name: "Full Rest Day", sets: 0, reps: "—", weight: "—", logged: false, note: "Recovery is part of the program." },
      ],
    },
  ],
};

const CHECKIN_HISTORY = [
  {
    week: "Week of Mar 10",
    weight: 200.2,
    sessions: 5,
    adherence: 90,
    energy: 4, sleep: 3, stress: 3,
    notes: "Felt a bit depleted mid-week but pushed through. Weekend nutrition was solid.",
    coachFeedback: "Great week Marcus. Weight is moving in the right direction. Keep protein up, I'm going to bump your morning carbs by 20g for the next 7 days — you need the fuel. Hit all 5 sessions, that's what we need.",
    coachFeedbackDate: "Mar 12",
  },
  {
    week: "Week of Mar 3",
    weight: 201.8,
    sessions: 4,
    adherence: 80,
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
  {
    id: 1, from: "coach", name: "Coach Murray", avatar: "JM",
    text: "Week 3 program is uploaded. Thursday is your heavy quad day — make sure you're fueled. Hit me if you have any questions before the session.",
    time: "Today, 8:14 AM", unread: true,
  },
  {
    id: 2, from: "client", name: "Marcus Williams", avatar: "MW",
    text: "Should I add extra cardio on rest days? Energy has been solid.",
    time: "Yesterday, 7:30 PM", unread: false,
  },
  {
    id: 3, from: "coach", name: "Coach Murray", avatar: "JM",
    text: "Hold off on extra cardio for now — we're deep in the cut and I want to preserve muscle. The scheduled cardio is enough. Once we're out of peak week I'll reassess.",
    time: "Yesterday, 8:05 PM", unread: true,
  },
  {
    id: 4, from: "client", name: "Marcus Williams", avatar: "MW",
    text: "Got it. Also hit a new PR on hack squats last week — 315 for 10.",
    time: "2 days ago, 6:15 PM", unread: false,
  },
  {
    id: 5, from: "coach", name: "Coach Murray", avatar: "JM",
    text: "That's MONEY. The conditioning work is paying off. Keep that same energy into this week's sessions. 💪",
    time: "2 days ago, 9:00 PM", unread: false,
  },
];

const RESOURCES = [
  { id: 1, type: "pdf", title: "Peak Week Nutrition Protocol", desc: "Pre-competition carb cycling, water manipulation, and sodium guidelines.", date: "Mar 1", pinned: true },
  { id: 2, type: "video", title: "Posing Practice — Mandatory Poses", desc: "Full breakdown of your mandatory poses. Practice these daily.", date: "Feb 20", pinned: true },
  { id: 3, type: "pdf", title: "Contest Prep Supplement Stack", desc: "What to take, when to take it, and what to avoid close to show day.", date: "Feb 15", pinned: false },
  { id: 4, type: "pdf", title: "Training Log Template", desc: "Downloadable PDF to track weights, sets, and RPE each session.", date: "Jan 10", pinned: false },
  { id: 5, type: "link", title: "MyFitnessPal Macro Tracking Guide", desc: "How to accurately log food for your specific goals.", date: "Sep 20", pinned: false },
];

// ─── ICONS ────────────────────────────────────────────────────
const Icon = ({ name, size = 20 }) => {
  const s = { width: size, height: size, strokeWidth: 1.8, fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" };
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
    chevronLeft: <svg {...s} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
    chevronDown: <svg {...s} viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>,
    fire: <svg {...s} viewBox="0 0 24 24"><path d="M12 2c0 0-5 5-5 10a5 5 0 0010 0c0-5-5-10-5-10z"/><path d="M12 12c0 0-2 2-2 3.5a2 2 0 004 0c0-1.5-2-3.5-2-3.5z" fill="currentColor"/></svg>,
    bell: <svg {...s} viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    camera: <svg {...s} viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    lock: <svg {...s} viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    send: <svg {...s} viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    paperclip: <svg {...s} viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>,
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
  };
  return icons[name] || null;
};

// ─── WEIGHT SPARKLINE ─────────────────────────────────────────
const WeightSparkline = ({ data }) => {
  const vals = data.map(d => d.weight);
  const min = Math.min(...vals), max = Math.max(...vals);
  const W = 120, H = 36, pad = 4;
  const xStep = (W - pad * 2) / (vals.length - 1);
  const yScale = v => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
  const points = vals.map((v, i) => `${pad + i * xStep},${yScale(v)}`).join(" ");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <polyline points={points} fill="none" stroke="#E8C547" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pad + (vals.length - 1) * xStep} cy={yScale(vals[vals.length - 1])} r="3" fill="#E8C547" />
    </svg>
  );
};

// ─── MACRO RING ───────────────────────────────────────────────
const MacroRing = ({ value, target, color, label, size = 72 }) => {
  const pct = Math.min(value / target, 1);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - pct * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#F0EDE6", lineHeight: 1 }}>{target}</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.5px", marginTop: 2 }}>g</span>
        </div>
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
};

// ─── PROGRESS CHART ───────────────────────────────────────────
const WeightChart = ({ data }) => {
  const vals = data.map(d => d.weight);
  const min = Math.floor(Math.min(...vals)) - 2;
  const max = Math.ceil(Math.max(...vals)) + 2;
  const W = 100, H = 80, padL = 0, padB = 0;
  const xStep = W / (vals.length - 1);
  const yScale = v => H - ((v - min) / (max - min)) * H;
  const points = vals.map((v, i) => `${i * xStep},${yScale(v)}`).join(" ");
  const fill = vals.map((v, i) => `${i * xStep},${yScale(v)}`).join(" ") + ` ${(vals.length - 1) * xStep},${H} 0,${H}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 80, overflow: "visible" }}>
      <defs>
        <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8C547" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#E8C547" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill="url(#wGrad)" />
      <polyline points={points} fill="none" stroke="#E8C547" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {vals.map((v, i) => (
        <circle key={i} cx={i * xStep} cy={yScale(v)} r="3" fill="#E8C547" />
      ))}
    </svg>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────
export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [animateIn, setAnimateIn] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [checkinData, setCheckinData] = useState({ weight: "", sessions: "", adherence: "", energy: 3, sleep: 3, stress: 3, notes: "" });
  const [checkinSubmitted, setCheckinSubmitted] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [loggedWeights, setLoggedWeights] = useState({});
  const [expandedDay, setExpandedDay] = useState("Thursday");
  const [moreOpen, setMoreOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setAnimateIn(false);
    const t = setTimeout(() => setAnimateIn(true), 30);
    return () => clearTimeout(t);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "messages" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab]);

  const theme = {
    bg: "#0D0D0F", surface: "#16161A", surfaceHover: "#1C1C22",
    border: "rgba(255,255,255,0.06)", borderLight: "rgba(255,255,255,0.1)",
    text: "#F0EDE6", textMuted: "rgba(255,255,255,0.45)", textDim: "rgba(255,255,255,0.25)",
    accent: "#E8C547", accentDim: "rgba(232,197,71,0.12)",
    green: "#47E8A0", greenDim: "rgba(71,232,160,0.12)",
    red: "#E85C47", redDim: "rgba(232,92,71,0.12)",
    blue: "#4793E8", blueDim: "rgba(71,147,232,0.12)",
  };

  const card = {
    background: theme.surface, border: `1px solid ${theme.border}`,
    borderRadius: 14, padding: "18px 20px",
  };

  const fadeIn = (delay = 0) => ({
    opacity: animateIn ? 1 : 0,
    transform: animateIn ? "translateY(0)" : "translateY(10px)",
    transition: `all 0.45s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  });

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

  // ── SIDEBAR (Desktop) ──────────────────────────────────────
  const Sidebar = () => (
    <div style={{
      width: 220, minWidth: 220, background: theme.surface,
      borderRight: `1px solid ${theme.border}`,
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 22px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${theme.accent}, #D4A017)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 14, color: "#0D0D0F", flexShrink: 0,
        }}>JM</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, letterSpacing: "-0.3px" }}>Coach Murray</div>
          <div style={{ fontSize: 10, color: theme.textMuted, letterSpacing: "1.5px", textTransform: "uppercase" }}>Client Portal</div>
        </div>
      </div>
      {/* Nav */}
      <div style={{ padding: "12px 8px", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          const badge = item.id === "messages" && unreadCount > 0 ? unreadCount : null;
          const isCheckinDue = item.id === "checkin" && !checkinSubmitted;
          return (
            <div key={item.id} onClick={() => setActiveTab(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                background: isActive ? theme.accentDim : "transparent",
                color: isActive ? theme.accent : theme.textMuted,
                transition: "all 0.15s ease", fontWeight: isActive ? 600 : 400,
                position: "relative",
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = theme.surfaceHover; e.currentTarget.style.color = theme.text; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.textMuted; }}}
            >
              <Icon name={item.icon} size={18} />
              <span style={{ fontSize: 13, letterSpacing: "-0.2px" }}>{item.label}</span>
              {badge && (
                <div style={{
                  marginLeft: "auto", background: theme.red, color: "#fff",
                  fontSize: 10, fontWeight: 700, borderRadius: 10,
                  padding: "1px 6px", minWidth: 18, textAlign: "center",
                }}>{badge}</div>
              )}
              {isCheckinDue && !badge && (
                <div style={{
                  marginLeft: "auto", background: theme.accent, color: "#0D0D0F",
                  fontSize: 9, fontWeight: 700, borderRadius: 10, padding: "1px 6px",
                }}>DUE</div>
              )}
            </div>
          );
        })}
      </div>
      {/* Client info footer */}
      <div style={{ padding: "14px 16px", borderTop: `1px solid ${theme.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, #4793E8, #2d6cbf)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>{CLIENT.avatar}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{CLIENT.name}</div>
            <div style={{ fontSize: 10, color: theme.textMuted }}>{CLIENT.package}</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── BOTTOM NAV (Mobile) — 4 primary + More drawer ─────────
  const primaryNavItems = navItems.filter(n => ["home", "program", "checkin", "messages"].includes(n.id));
  const moreNavItems   = navItems.filter(n => ["nutrition", "progress", "resources", "account"].includes(n.id));

  const BottomNav = () => (
    <>
      {/* More drawer overlay */}
      {moreOpen && (
        <div
          onClick={() => setMoreOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 98,
            background: "rgba(0,0,0,0.5)",
          }}
        />
      )}
      {/* More drawer panel */}
      <div style={{
        position: "fixed", left: 0, right: 0, zIndex: 99,
        bottom: moreOpen ? 64 : "-200px",
        transition: "bottom 0.35s cubic-bezier(0.16,1,0.3,1)",
        background: theme.surface,
        borderTop: `1px solid ${theme.border}`,
        borderRadius: "16px 16px 0 0",
        padding: "16px 12px 8px",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
          {moreNavItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <div key={item.id}
                onClick={() => { setActiveTab(item.id); setMoreOpen(false); }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "14px 8px", borderRadius: 12, cursor: "pointer",
                  background: isActive ? theme.accentDim : "rgba(255,255,255,0.03)",
                  color: isActive ? theme.accent : theme.textMuted,
                }}
              >
                <Icon name={item.icon} size={22} />
                <span style={{ fontSize: 11, marginTop: 6, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: theme.surface, borderTop: `1px solid ${theme.border}`,
        display: "flex", zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
      }}>
        {primaryNavItems.map(item => {
          const isActive = activeTab === item.id;
          const badge = item.id === "messages" && unreadCount > 0;
          const isCheckinDue = item.id === "checkin" && !checkinSubmitted;
          return (
            <div key={item.id} onClick={() => { setActiveTab(item.id); setMoreOpen(false); }}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                padding: "10px 4px 6px", cursor: "pointer", position: "relative",
                color: isActive ? theme.accent : theme.textDim,
              }}
            >
              <Icon name={item.icon} size={22} />
              <span style={{ fontSize: 10, marginTop: 4, fontWeight: isActive ? 700 : 400 }}>{item.label}</span>
              {badge && <div style={{ position: "absolute", top: 8, right: "calc(50% - 16px)", width: 8, height: 8, borderRadius: "50%", background: theme.red, border: `2px solid ${theme.surface}` }} />}
              {isCheckinDue && !badge && <div style={{ position: "absolute", top: 8, right: "calc(50% - 16px)", width: 8, height: 8, borderRadius: "50%", background: theme.accent, border: `2px solid ${theme.surface}` }} />}
            </div>
          );
        })}
        {/* More button */}
        <div onClick={() => setMoreOpen(o => !o)}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            padding: "10px 4px 6px", cursor: "pointer",
            color: moreOpen ? theme.accent : theme.textDim,
          }}
        >
          <Icon name={moreOpen ? "x" : "grid"} size={22} />
          <span style={{ fontSize: 10, marginTop: 4, fontWeight: moreOpen ? 700 : 400 }}>More</span>
        </div>
      </div>
    </>
  );

  // ── HOME TAB ───────────────────────────────────────────────
  const HomeTab = () => {
    const { stats } = CLIENT;
    const sessionsLeft = stats.sessionsTarget - stats.adherenceThisWeek;
    const today = PROGRAM.days.find(d => d.today);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Greeting */}
        <div style={fadeIn(0)}>
          <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: theme.text, letterSpacing: "-0.5px" }}>
            Good morning, {CLIENT.name.split(" ")[0]} 👋
          </div>
          <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
            {today ? `Today: ${today.label}` : "Rest day — recover well."} · Week 3 of Contest Prep
          </div>
        </div>

        {/* Next check-in strip */}
        <div style={{
          ...fadeIn(30),
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", borderRadius: 10,
          background: checkinSubmitted ? theme.greenDim : "rgba(232,197,71,0.07)",
          border: `1px solid ${checkinSubmitted ? "rgba(71,232,160,0.2)" : "rgba(232,197,71,0.18)"}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ color: checkinSubmitted ? theme.green : theme.accent }}>
              <Icon name={checkinSubmitted ? "check" : "checkin"} size={15} />
            </div>
            <span style={{ fontSize: 12, color: theme.text, fontWeight: 600 }}>
              {checkinSubmitted ? "Check-in submitted — awaiting coach feedback" : "Weekly check-in due Sunday"}
            </span>
          </div>
          {!checkinSubmitted && (
            <button onClick={() => setActiveTab("checkin")}
              style={{ fontSize: 11, fontWeight: 700, color: theme.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              Submit →
            </button>
          )}
        </div>

        {/* Quick stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, ...fadeIn(50) }}>
          {[
            { label: "Weight", value: `${CLIENT.stats.currentWeight}`, unit: "lbs", icon: "trendDown", color: theme.green },
            { label: "Streak", value: `${CLIENT.stats.streak}`, unit: "days", icon: "fire", color: theme.accent },
            { label: "Sessions", value: `${CLIENT.stats.adherenceThisWeek}/${CLIENT.stats.sessionsTarget}`, unit: "this wk", icon: "dumbbell", color: theme.blue },
            {
              label: "Adherence",
              value: `${Math.round((CLIENT.stats.adherenceThisWeek / CLIENT.stats.sessionsTarget) * 100)}%`,
              unit: "this wk",
              icon: "chart",
              color: Math.round((CLIENT.stats.adherenceThisWeek / CLIENT.stats.sessionsTarget) * 100) >= 80 ? theme.green : theme.red,
            },
          ].map((stat, i) => (
            <div key={stat.label} style={{ ...card, padding: "14px 14px", textAlign: "center" }}>
              <div style={{ color: stat.color, marginBottom: 6, display: "flex", justifyContent: "center" }}>
                <Icon name={stat.icon} size={16} />
              </div>
              <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: theme.text, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 9, color: theme.textMuted, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.8px" }}>{stat.unit}</div>
              <div style={{ fontSize: 10, color: theme.textDim, marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Today's workout card */}
        {today && (
          <div style={{ ...card, borderLeft: `3px solid ${theme.accent}`, ...fadeIn(100) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: theme.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Today's Session</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>{today.label}</div>
              </div>
              <div style={{
                background: theme.accentDim, color: theme.accent,
                fontSize: 12, fontWeight: 700, borderRadius: 8, padding: "6px 12px",
              }}>{today.exercises.length} exercises</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {today.exercises.slice(0, 3).map((ex, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 2 ? `1px solid ${theme.border}` : "none" }}>
                  <span style={{ fontSize: 13, color: theme.text }}>{ex.name}</span>
                  <span style={{ fontSize: 12, color: theme.textMuted }}>{ex.sets}×{ex.reps}</span>
                </div>
              ))}
              {today.exercises.length > 3 && (
                <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>+ {today.exercises.length - 3} more exercises</div>
              )}
            </div>
            <button onClick={() => setActiveTab("program")}
              style={{
                marginTop: 14, width: "100%", padding: "12px", borderRadius: 10,
                background: theme.accent, color: "#0D0D0F", border: "none",
                fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "-0.2px",
              }}>
              Open Full Program
            </button>
          </div>
        )}

        {/* Check-in CTA */}
        {!checkinSubmitted && (
          <div style={{ ...card, background: `linear-gradient(135deg, rgba(232,197,71,0.08), rgba(232,197,71,0.03))`, border: `1px solid rgba(232,197,71,0.2)`, ...fadeIn(150) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ color: theme.accent }}><Icon name="checkin" size={22} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>Weekly Check-In Due</div>
                <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>Submit your weight, sessions, and how you're feeling.</div>
              </div>
              <button onClick={() => setActiveTab("checkin")}
                style={{
                  background: theme.accent, color: "#0D0D0F", border: "none",
                  borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                Submit
              </button>
            </div>
          </div>
        )}

        {/* Recent message from coach */}
        <div style={{ ...fadeIn(200) }}>
          <div style={{ fontSize: 12, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10, fontWeight: 600 }}>From Coach Murray</div>
          {MESSAGES_DATA.filter(m => m.from === "coach").slice(0, 1).map(msg => (
            <div key={msg.id} style={{ ...card, borderLeft: `3px solid ${theme.blue}` }}>
              <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.6 }}>"{msg.text}"</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <span style={{ fontSize: 11, color: theme.textMuted }}>{msg.time}</span>
                <button onClick={() => setActiveTab("messages")}
                  style={{ background: "none", border: "none", color: theme.blue, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                  Reply →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Weight sparkline */}
        <div style={{ ...card, ...fadeIn(250) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>Weight Trend</div>
            <span style={{ fontSize: 12, color: theme.green, fontWeight: 600 }}>↓ {(WEIGHT_HISTORY[0].weight - WEIGHT_HISTORY[WEIGHT_HISTORY.length - 1].weight).toFixed(1)} lbs total</span>
          </div>
          <WeightSparkline data={WEIGHT_HISTORY} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 11, color: theme.textDim }}>{WEIGHT_HISTORY[0].week}</span>
            <span style={{ fontSize: 11, color: theme.textDim }}>{WEIGHT_HISTORY[WEIGHT_HISTORY.length - 1].week}</span>
          </div>
        </div>
      </div>
    );
  };

  // ── PROGRAM TAB ────────────────────────────────────────────
  const ProgramTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={fadeIn(0)}>
        <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, letterSpacing: "-0.5px" }}>{PROGRAM.blockName}</div>
        <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>Assigned by Coach Murray</div>
      </div>

      {/* Coach note */}
      <div style={{ ...card, borderLeft: `3px solid ${theme.blue}`, ...fadeIn(50) }}>
        <div style={{ fontSize: 11, color: theme.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Coach Note</div>
        <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.6 }}>{PROGRAM.coachNote}</div>
      </div>

      {/* Day list */}
      {PROGRAM.days.map((day, di) => {
        const isExpanded = expandedDay === day.day;
        const isToday = !!day.today;
        return (
          <div key={day.day} style={{
            ...card,
            border: isToday ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`,
            ...fadeIn(80 + di * 30),
          }}>
            <div onClick={() => setExpandedDay(isExpanded ? null : day.day)}
              style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              {/* Status indicator */}
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: day.completed ? theme.greenDim : isToday ? theme.accentDim : "rgba(255,255,255,0.04)",
                border: `2px solid ${day.completed ? theme.green : isToday ? theme.accent : theme.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: day.completed ? theme.green : isToday ? theme.accent : theme.textDim,
              }}>
                {day.completed ? <Icon name="check" size={14} /> : <span style={{ fontSize: 10, fontWeight: 700 }}>{di + 1}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: isToday ? theme.accent : theme.text }}>{day.day}</span>
                  {isToday && <span style={{ fontSize: 9, background: theme.accent, color: "#0D0D0F", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>TODAY</span>}
                </div>
                <div style={{ fontSize: 12, color: theme.textMuted }}>{day.label}</div>
              </div>
              <div style={{ color: theme.textDim, transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
                <Icon name="chevronRight" size={16} />
              </div>
            </div>

            {isExpanded && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${theme.border}` }}>
                {day.exercises.map((ex, ei) => (
                  <div key={ei} style={{
                    display: "grid", gridTemplateColumns: "1fr auto auto",
                    gap: 8, alignItems: "center",
                    padding: "10px 0",
                    borderBottom: ei < day.exercises.length - 1 ? `1px solid ${theme.border}` : "none",
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{ex.name}</div>
                      {ex.note && <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, fontStyle: "italic" }}>{ex.note}</div>}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, color: theme.textMuted }}>{ex.sets} × {ex.reps}</div>
                    </div>
                    {/* Weight logging input for today's session */}
                    {isToday && !ex.logged ? (
                      <input
                        type="text"
                        placeholder="lbs"
                        value={loggedWeights[`${day.day}-${ei}`] || ""}
                        onChange={e => setLoggedWeights(prev => ({ ...prev, [`${day.day}-${ei}`]: e.target.value }))}
                        style={{
                          width: 60, padding: "6px 8px", background: theme.surfaceHover,
                          border: `1px solid ${theme.borderLight}`, borderRadius: 6,
                          color: theme.text, fontSize: 12, textAlign: "center",
                          outline: "none",
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: 12, color: ex.logged ? theme.green : theme.textDim, fontWeight: ex.logged ? 600 : 400, textAlign: "right", minWidth: 60 }}>
                        {ex.logged ? ex.weight : "—"}
                      </div>
                    )}
                  </div>
                ))}
                {isToday && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${theme.border}` }}>
                    {/* RPE selector */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }}>
                        Session RPE <span style={{ color: theme.textDim }}>(Rate of Perceived Exertion — how hard was today overall?)</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {[1,2,3,4,5,6,7,8,9,10].map(n => {
                          const rpeColor = n <= 4 ? theme.green : n <= 7 ? theme.accent : theme.red;
                          return (
                            <button key={n}
                              onClick={() => setLoggedWeights(prev => ({ ...prev, [`${day.day}-rpe`]: n }))}
                              style={{
                                flex: 1, padding: "8px 0", borderRadius: 7, border: "none", cursor: "pointer",
                                fontSize: 12, fontWeight: 700,
                                background: loggedWeights[`${day.day}-rpe`] === n ? rpeColor : "rgba(255,255,255,0.04)",
                                color: loggedWeights[`${day.day}-rpe`] === n ? "#0D0D0F" : theme.textDim,
                                transition: "all 0.12s",
                              }}>{n}</button>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: theme.textDim }}>Easy</span>
                        <span style={{ fontSize: 10, color: theme.textDim }}>Max effort</span>
                      </div>
                    </div>
                    {/* Session notes */}
                    <textarea
                      placeholder="Session notes — PRs, how you felt, anything to flag for coach..."
                      rows={2}
                      value={loggedWeights[`${day.day}-notes`] || ""}
                      onChange={e => setLoggedWeights(prev => ({ ...prev, [`${day.day}-notes`]: e.target.value }))}
                      style={{
                        width: "100%", padding: "10px 12px",
                        background: theme.surfaceHover, border: `1px solid ${theme.border}`,
                        borderRadius: 8, color: theme.text, fontSize: 12,
                        outline: "none", resize: "none", lineHeight: 1.6,
                        fontFamily: "inherit", boxSizing: "border-box", marginBottom: 10,
                      }}
                    />
                    <button style={{
                      width: "100%", padding: "11px", borderRadius: 10,
                      background: theme.accent, color: "#0D0D0F", border: "none",
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                    }}>
                      Save Session
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── NUTRITION TAB ──────────────────────────────────────────
  const NutritionTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={fadeIn(0)}>
        <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, letterSpacing: "-0.5px" }}>Nutrition Plan</div>
        <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>Set by Coach Murray · Read-only</div>
      </div>

      {/* Macro rings */}
      <div style={{ ...card, ...fadeIn(50) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Daily Targets</div>
          <div style={{ fontSize: 11, color: theme.textDim }}>Targets set by coach</div>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: isMobile ? "20px 0" : 0,
          justifyItems: "center",
        }}>
          <MacroRing value={180} target={MACROS.protein.target} color={MACROS.protein.color} label="Protein" />
          <MacroRing value={240} target={MACROS.carbs.target} color={MACROS.carbs.color} label="Carbs" />
          <MacroRing value={50} target={MACROS.fats.target} color={MACROS.fats.color} label="Fats" />
          <MacroRing value={2100} target={MACROS.calories.target} color={MACROS.calories.color} label="Calories" size={72} />
        </div>
        <div style={{ marginTop: 20, padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
          {[
            { label: "Protein", val: MACROS.protein.target, unit: "g", color: MACROS.protein.color },
            { label: "Carbohydrates", val: MACROS.carbs.target, unit: "g", color: MACROS.carbs.color },
            { label: "Fats", val: MACROS.fats.target, unit: "g", color: MACROS.fats.color },
            { label: "Total Calories", val: MACROS.calories.target, unit: "kcal", color: MACROS.calories.color },
          ].map((m, i) => (
            <div key={m.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0",
              borderBottom: i < 3 ? `1px solid ${theme.border}` : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.color }} />
                <span style={{ fontSize: 13, color: theme.text }}>{m.label}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.val}{m.unit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Coach nutrition notes */}
      <div style={{ ...card, borderLeft: `3px solid ${theme.accent}`, ...fadeIn(100) }}>
        <div style={{ fontSize: 11, color: theme.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Coach Notes</div>
        <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.7 }}>{MACROS.notes}</div>
      </div>

      {/* Meal timing */}
      <div style={{ ...card, ...fadeIn(150) }}>
        <div style={{ fontSize: 13, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: 14 }}>Meal Timing</div>
        {[
          { time: "7:00 AM", label: "Meal 1 — Pre-Training", detail: "Protein + Carbs. Skip fats pre-workout." },
          { time: "10:00 AM", label: "Intra / Post Workout", detail: "EAAs + Carbs during. Protein shake immediately after." },
          { time: "1:00 PM", label: "Meal 2 — Midday", detail: "Full macro meal. Lean protein + complex carbs + fats." },
          { time: "4:30 PM", label: "Meal 3 — Afternoon", detail: "Protein-forward. Light carbs if training again today." },
          { time: "7:30 PM", label: "Meal 4 — Dinner", detail: "Full meal. Keep carbs moderate in the evening." },
          { time: "9:30 PM", label: "Meal 5 — Before Bed", detail: "Casein or cottage cheese. No carbs." },
        ].map((m, i) => (
          <div key={i} style={{
            display: "flex", gap: 14, alignItems: "flex-start",
            padding: "10px 0",
            borderBottom: i < 5 ? `1px solid ${theme.border}` : "none",
          }}>
            <div style={{ fontSize: 11, color: theme.accent, fontWeight: 700, minWidth: 58, paddingTop: 2 }}>{m.time}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{m.label}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2, lineHeight: 1.5 }}>{m.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── CHECK-IN TAB ───────────────────────────────────────────
  const CheckInTab = () => {
    const RatingRow = ({ label, key_, max = 5, color, lowLabel = "Low", highLabel = "High" }) => (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: theme.text, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 10, color: theme.textDim }}>{lowLabel} → {highLabel}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {Array.from({ length: max }, (_, i) => i + 1).map(n => (
            <button key={n}
              onClick={() => !checkinSubmitted && setCheckinData(p => ({ ...p, [key_]: n }))}
              style={{
                flex: 1, height: 42, borderRadius: 8, border: "none", cursor: checkinSubmitted ? "default" : "pointer",
                background: checkinData[key_] === n ? color : checkinData[key_] > n ? `${color}40` : "rgba(255,255,255,0.05)",
                color: checkinData[key_] === n ? "#0D0D0F" : checkinData[key_] > n ? color : theme.textDim,
                fontWeight: 700, fontSize: 14, transition: "all 0.15s",
              }}>{n}</button>
          ))}
        </div>
      </div>
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={fadeIn(0)}>
          <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, letterSpacing: "-0.5px" }}>Weekly Check-In</div>
          <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>Due every Sunday. Your coach reviews these within 24 hrs.</div>
        </div>

        {/* Submission form or submitted state */}
        {!checkinSubmitted ? (
          <div style={{ ...card, ...fadeIn(50) }}>
            {/* Weight */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, color: theme.textMuted, display: "block", marginBottom: 8 }}>Current Weight (lbs)</label>
              <input type="number" placeholder="e.g. 197.4"
                value={checkinData.weight}
                onChange={e => setCheckinData(p => ({ ...p, weight: e.target.value }))}
                style={{
                  width: "100%", padding: "12px 14px", background: theme.surfaceHover,
                  border: `1px solid ${theme.borderLight}`, borderRadius: 10,
                  color: theme.text, fontSize: 15, fontWeight: 600, outline: "none", boxSizing: "border-box",
                }} />
            </div>

            {/* Sessions */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, color: theme.textMuted, display: "block", marginBottom: 8 }}>Training Sessions Completed</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                  <button key={n} onClick={() => setCheckinData(p => ({ ...p, sessions: n }))}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer",
                      background: checkinData.sessions === n ? theme.accent : "rgba(255,255,255,0.05)",
                      color: checkinData.sessions === n ? "#0D0D0F" : theme.textMuted,
                      fontWeight: 700, fontSize: 14, transition: "all 0.15s",
                    }}>{n}</button>
                ))}
              </div>
            </div>

            {/* Ratings */}
            <RatingRow label="Energy Level" key_="energy" color={theme.green} lowLabel="Depleted" highLabel="Locked in" />
            <RatingRow label="Sleep Quality" key_="sleep" color={theme.blue} lowLabel="Poor" highLabel="Great" />
            <RatingRow label="Stress Level" key_="stress" color={theme.red} lowLabel="Chill" highLabel="Overwhelmed" />

            {/* Notes */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, color: theme.textMuted, display: "block", marginBottom: 8 }}>Notes for Coach (optional)</label>
              <textarea
                value={checkinData.notes}
                onChange={e => setCheckinData(p => ({ ...p, notes: e.target.value }))}
                placeholder="Anything your coach should know this week — how you felt, what was hard, wins, etc."
                rows={4}
                style={{
                  width: "100%", padding: "12px 14px", background: theme.surfaceHover,
                  border: `1px solid ${theme.borderLight}`, borderRadius: 10,
                  color: theme.text, fontSize: 13, outline: "none", resize: "vertical",
                  boxSizing: "border-box", lineHeight: 1.6, fontFamily: "inherit",
                }} />
            </div>

            {/* Photo upload */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: theme.textMuted, display: "block", marginBottom: 8 }}>Progress Photos (optional)</label>
              <div style={{
                border: `2px dashed ${theme.border}`, borderRadius: 10, padding: "24px",
                textAlign: "center", cursor: "pointer", color: theme.textDim,
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = theme.accentDim}
                onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
              >
                <Icon name="camera" size={24} />
                <div style={{ fontSize: 13, marginTop: 8, color: theme.textMuted }}>Tap to attach photos</div>
                <div style={{ fontSize: 11, marginTop: 4, color: theme.textDim }}>Front, side, back recommended</div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!checkinData.weight) return alert("Enter your weight to submit.");
                setCheckinSubmitted(true);
                // TODO: POST to Supabase check_ins table
              }}
              style={{
                width: "100%", padding: "14px", borderRadius: 12,
                background: theme.accent, color: "#0D0D0F", border: "none",
                fontSize: 15, fontWeight: 800, cursor: "pointer", letterSpacing: "-0.2px",
              }}>
              Submit Check-In
            </button>
          </div>
        ) : (
          <div style={{ ...card, border: `1px solid rgba(71,232,160,0.25)`, background: "rgba(71,232,160,0.04)", ...fadeIn(50) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: theme.greenDim,
                display: "flex", alignItems: "center", justifyContent: "center", color: theme.green, flexShrink: 0,
              }}><Icon name="check" size={20} /></div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>Check-In Submitted ✓</div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>Today at {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: theme.textMuted }}>Weight logged</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{checkinData.weight} lbs</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: theme.textMuted }}>Sessions this week</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{checkinData.sessions} / 5</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: theme.textMuted }}>Energy / Sleep / Stress</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{checkinData.energy} · {checkinData.sleep} · {checkinData.stress}</span>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: "10px 14px", background: theme.blueDim, borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ color: theme.blue, flexShrink: 0 }}><Icon name="bell" size={14} /></div>
              <div style={{ fontSize: 12, color: theme.text, lineHeight: 1.5 }}>
                Coach Murray typically responds within <strong>24 hours</strong>. You'll see feedback appear below once it's sent.
              </div>
            </div>
          </div>
        )}

        {/* Past check-ins */}
        <div style={fadeIn(100)}>
          <div style={{ fontSize: 12, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12, fontWeight: 600 }}>Previous Check-Ins</div>
          {CHECKIN_HISTORY.map((ci, i) => (
            <div key={i} style={{ ...card, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{ci.week}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{ci.weight} lbs · {ci.sessions} sessions</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { val: ci.energy, color: theme.green, label: "E" },
                    { val: ci.sleep, color: theme.blue, label: "S" },
                    { val: ci.stress, color: theme.red, label: "St" },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.val}/5</div>
                      <div style={{ fontSize: 9, color: theme.textDim }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              {ci.coachFeedback && (
                <div style={{ background: "rgba(71,147,232,0.06)", borderLeft: `2px solid ${theme.blue}`, padding: "10px 12px", borderRadius: "0 8px 8px 0" }}>
                  <div style={{ fontSize: 10, color: theme.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Coach Response · {ci.coachFeedbackDate}</div>
                  <div style={{ fontSize: 12, color: theme.text, lineHeight: 1.6 }}>{ci.coachFeedback}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── PROGRESS TAB ───────────────────────────────────────────
  const ProgressTab = () => {
    const start = WEIGHT_HISTORY[0].weight;
    const current = WEIGHT_HISTORY[WEIGHT_HISTORY.length - 1].weight;
    const lost = (start - current).toFixed(1);
    const remaining = (current - CLIENT.stats.goalWeight).toFixed(1);
    const pct = Math.round(((start - current) / (start - CLIENT.stats.goalWeight)) * 100);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={fadeIn(0)}>
          <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, letterSpacing: "-0.5px" }}>Your Progress</div>
          <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>Since {CLIENT.startDate}</div>
        </div>

        {/* Goal progress */}
        <div style={{ ...card, ...fadeIn(50) }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: theme.green }}>↓{lost} lbs</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>Lost so far · {remaining} lbs to goal</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: theme.accent }}>{pct}%</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>Goal progress</div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${theme.accent}, ${theme.green})`, borderRadius: 3, transition: "width 1s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 11, color: theme.textDim }}>Start: {start} lbs</span>
            <span style={{ fontSize: 11, color: theme.textDim }}>Goal: {CLIENT.stats.goalWeight} lbs</span>
          </div>
        </div>

        {/* Weight chart */}
        <div style={{ ...card, ...fadeIn(100) }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Weight Over Time</div>
          <WeightChart data={WEIGHT_HISTORY} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {WEIGHT_HISTORY.filter((_, i) => i % 2 === 0 || i === WEIGHT_HISTORY.length - 1).map((d, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{d.weight}</div>
                <div style={{ fontSize: 9, color: theme.textDim, marginTop: 2 }}>{d.week}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress photos */}
        <div style={{ ...card, ...fadeIn(125) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>Progress Photos</div>
            <button style={{ fontSize: 11, color: theme.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Upload New →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              { label: "Start", date: "Sep 15", weight: "204.5 lbs", shade: 0.08 },
              { label: "Current", date: "Mar 17", weight: "198.0 lbs", shade: 0.04, isLatest: true },
              { label: "Goal", date: "Target", weight: "185 lbs", shade: 0.02 },
            ].map((p, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  aspectRatio: "3/4", borderRadius: 12,
                  background: p.isLatest
                    ? `linear-gradient(180deg, rgba(232,197,71,0.1), rgba(232,197,71,0.03))`
                    : `rgba(255,255,255,${p.shade})`,
                  border: `1px solid ${p.isLatest ? "rgba(232,197,71,0.25)" : theme.border}`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                  cursor: "pointer", position: "relative", overflow: "hidden",
                }}>
                  {p.isLatest && (
                    <div style={{
                      position: "absolute", top: 8, right: 8, fontSize: 9, fontWeight: 700,
                      background: theme.accent, color: "#0D0D0F", borderRadius: 4, padding: "2px 6px",
                    }}>LATEST</div>
                  )}
                  <div style={{ color: p.isLatest ? theme.accent : theme.textDim }}>
                    <Icon name="camera" size={22} />
                  </div>
                  {!p.isLatest && <div style={{ fontSize: 10, color: theme.textDim }}>Tap to view</div>}
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: p.isLatest ? theme.accent : theme.text }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>{p.date}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, marginTop: 1 }}>{p.weight}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Body measurements */}
        <div style={{ ...card, ...fadeIn(137) }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 14 }}>Body Measurements</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Chest", current: 44, prev: 45.5, unit: '"' },
              { label: "Waist", current: 32, prev: 33.5, unit: '"' },
              { label: "Arms", current: 17, prev: 16.5, unit: '"' },
              { label: "Quads", current: 26, prev: 26, unit: '"' },
              { label: "Hips", current: 38, prev: 39, unit: '"' },
              { label: "Calves", current: 15.5, prev: 15.5, unit: '"' },
            ].map((m, i) => {
              const diff = (m.current - m.prev).toFixed(1);
              const isWaist = m.label === "Waist" || m.label === "Hips";
              const improved = isWaist ? m.current < m.prev : m.current > m.prev;
              const unchanged = m.current === m.prev;
              return (
                <div key={i} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>{m.label}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>{m.current}{m.unit}</span>
                    {!unchanged && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: improved ? theme.green : theme.red }}>
                        {diff > 0 ? "+" : ""}{diff}{m.unit}
                      </span>
                    )}
                    {unchanged && <span style={{ fontSize: 10, color: theme.textDim }}>no change</span>}
                  </div>
                  <div style={{ fontSize: 10, color: theme.textDim, marginTop: 2 }}>Was {m.prev}{m.unit}</div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: theme.textDim, marginTop: 10, textAlign: "center" }}>Measurements logged by Coach Murray · Last updated Mar 17</div>
        </div>

        {/* Milestones */}
        <div style={{ ...card, ...fadeIn(150) }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 14 }}>Milestones</div>
          {[
            { label: "First 5 lbs lost", achieved: true, date: "Oct 12" },
            { label: "Consistency streak: 4 weeks", achieved: true, date: "Nov 3" },
            { label: "First 10 lbs lost", achieved: true, date: "Dec 7" },
            { label: "Crossed below 200 lbs", achieved: true, date: "Mar 17" },
            { label: "Final 5 lbs to goal", achieved: false, date: null },
            { label: "Goal weight: 185 lbs", achieved: false, date: null },
          ].map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < 5 ? `1px solid ${theme.border}` : "none" }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: m.achieved ? theme.greenDim : "rgba(255,255,255,0.04)",
                border: `2px solid ${m.achieved ? theme.green : theme.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: m.achieved ? theme.green : theme.textDim,
              }}>
                {m.achieved ? <Icon name="check" size={11} /> : <span style={{ fontSize: 8 }}>○</span>}
              </div>
              <span style={{ flex: 1, fontSize: 13, color: m.achieved ? theme.text : theme.textMuted }}>{m.label}</span>
              {m.date && <span style={{ fontSize: 11, color: theme.textDim }}>{m.date}</span>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── MESSAGES TAB ───────────────────────────────────────────
  const MessagesTab = () => (
    <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "calc(100vh - 140px)" : "calc(100vh - 60px)" }}>
      <div style={{ ...fadeIn(0), paddingBottom: 14, borderBottom: `1px solid ${theme.border}`, marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, letterSpacing: "-0.5px" }}>Messages</div>
        <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>Direct line to Coach Murray</div>
      </div>

      {/* Messages list */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16 }}>
        {(() => {
          // Group messages by day for date separators
          const groups = [];
          let lastDay = null;
          MESSAGES_DATA.forEach((msg, i) => {
            const day = msg.time.split(",")[0]; // "Today", "Yesterday", "2 days ago"
            if (day !== lastDay) {
              groups.push({ type: "separator", day });
              lastDay = day;
            }
            groups.push({ type: "message", msg, i });
          });
          return groups.map((item, gi) => {
            if (item.type === "separator") {
              return (
                <div key={`sep-${gi}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                  <div style={{ flex: 1, height: 1, background: theme.border }} />
                  <span style={{ fontSize: 10, color: theme.textDim, fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", flexShrink: 0 }}>{item.day}</span>
                  <div style={{ flex: 1, height: 1, background: theme.border }} />
                </div>
              );
            }
            const { msg, i } = item;
            const isCoach = msg.from === "coach";
            return (
              <div key={msg.id} style={{
                display: "flex", flexDirection: isCoach ? "row" : "row-reverse",
                gap: 10, alignItems: "flex-end", ...fadeIn(i * 40),
              }}>
                {isCoach && (
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg, ${theme.accent}, #D4A017)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "#0D0D0F",
                  }}>JM</div>
                )}
                <div style={{
                  maxWidth: "75%", padding: "12px 14px",
                  borderRadius: isCoach ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                  background: isCoach ? theme.surface : "rgba(232,197,71,0.1)",
                  border: `1px solid ${isCoach ? theme.border : "rgba(232,197,71,0.2)"}`,
                }}>
                  <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.6 }}>{msg.text}</div>
                  <div style={{ fontSize: 10, color: theme.textDim, marginTop: 6 }}>
                    {msg.time.split(", ")[1] || msg.time}
                    {msg.unread && isCoach && (
                      <span style={{ marginLeft: 6, color: theme.accent, fontWeight: 700 }}>NEW</span>
                    )}
                  </div>
                </div>
              </div>
            );
          });
        })()}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <button style={{ color: theme.textMuted, background: "none", border: "none", cursor: "pointer", padding: "10px 4px", flexShrink: 0 }}>
            <Icon name="paperclip" size={18} />
          </button>
          <textarea
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); setMessageText(""); }}}
            placeholder="Message Coach Murray..."
            rows={1}
            style={{
              flex: 1, padding: "10px 14px", background: theme.surface,
              border: `1px solid ${theme.borderLight}`, borderRadius: 12,
              color: theme.text, fontSize: 13, outline: "none", resize: "none",
              fontFamily: "inherit", lineHeight: 1.5,
            }} />
          <button
            onClick={() => setMessageText("")}
            style={{
              background: messageText.trim() ? theme.accent : "rgba(255,255,255,0.05)",
              color: messageText.trim() ? "#0D0D0F" : theme.textDim,
              border: "none", borderRadius: 10, padding: "10px 14px",
              cursor: messageText.trim() ? "pointer" : "default",
              transition: "all 0.15s", flexShrink: 0,
            }}>
            <Icon name="send" size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  // ── RESOURCES TAB ──────────────────────────────────────────
  const ResourcesTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={fadeIn(0)}>
        <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, letterSpacing: "-0.5px" }}>Resources</div>
        <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>Files and guides from Coach Murray</div>
      </div>

      {/* Pinned */}
      <div style={fadeIn(50)}>
        <div style={{ fontSize: 11, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10, fontWeight: 600 }}>📌 Pinned</div>
        {RESOURCES.filter(r => r.pinned).map((res, i) => (
          <div key={res.id} style={{ ...card, marginBottom: 10, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: res.type === "pdf" ? theme.redDim : res.type === "video" ? theme.blueDim : theme.accentDim,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: res.type === "pdf" ? theme.red : res.type === "video" ? theme.blue : theme.accent,
            }}>
              <Icon name={res.type === "video" ? "video" : res.type === "link" ? "link" : "book"} size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{res.title}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{res.desc}</div>
            </div>
            <div style={{ color: theme.textDim, flexShrink: 0 }}>
              <Icon name={res.type === "link" ? "externalLink" : "download"} size={16} />
            </div>
          </div>
        ))}
      </div>

      {/* All resources */}
      <div style={fadeIn(100)}>
        <div style={{ fontSize: 11, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10, fontWeight: 600 }}>All Files</div>
        {RESOURCES.filter(r => !r.pinned).map((res, i) => (
          <div key={res.id} style={{ ...card, marginBottom: 10, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: res.type === "pdf" ? theme.redDim : res.type === "video" ? theme.blueDim : theme.accentDim,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: res.type === "pdf" ? theme.red : res.type === "video" ? theme.blue : theme.accent,
            }}>
              <Icon name={res.type === "video" ? "video" : res.type === "link" ? "link" : "book"} size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{res.title}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2, lineHeight: 1.4 }}>{res.desc}</div>
              <div style={{ fontSize: 10, color: theme.textDim, marginTop: 4 }}>Added {res.date}</div>
            </div>
            <div style={{ color: theme.textDim, flexShrink: 0 }}>
              <Icon name={res.type === "link" ? "externalLink" : "download"} size={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── ACCOUNT TAB ────────────────────────────────────────────
  const AccountTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={fadeIn(0)}>
        <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, letterSpacing: "-0.5px" }}>My Account</div>
      </div>

      {/* Profile card */}
      <div style={{ ...card, ...fadeIn(50) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: `linear-gradient(135deg, #4793E8, #2d6cbf)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 800, color: "#fff",
          }}>{CLIENT.avatar}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>{CLIENT.name}</div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{CLIENT.email}</div>
          </div>
        </div>
        {[
          { label: "Package", value: CLIENT.package },
          { label: "Coach", value: CLIENT.coachName },
          { label: "Start Date", value: CLIENT.startDate },
        ].map((row, i) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: `1px solid ${theme.border}` }}>
            <span style={{ fontSize: 13, color: theme.textMuted }}>{row.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Subscription */}
      <div style={{ ...card, ...fadeIn(100) }}>
        <div style={{ fontSize: 13, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: 14 }}>Subscription</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>${CLIENT.monthlyRate}<span style={{ fontSize: 13, fontWeight: 400, color: theme.textMuted }}>/mo</span></div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>Next billing: {CLIENT.nextBilling}</div>
          </div>
          <div style={{ background: theme.greenDim, color: theme.green, fontSize: 11, fontWeight: 700, borderRadius: 8, padding: "5px 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Active
          </div>
        </div>
        <a href={CLIENT.stripePortalUrl} target="_blank" rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "12px", borderRadius: 10, textDecoration: "none",
            background: "rgba(255,255,255,0.05)", border: `1px solid ${theme.border}`,
            color: theme.text, fontSize: 13, fontWeight: 600,
          }}>
          <Icon name="creditCard" size={16} />
          Manage Billing (Stripe Portal)
          <Icon name="externalLink" size={14} />
        </a>
      </div>

      {/* Notifications */}
      <div style={{ ...card, ...fadeIn(150) }}>
        <div style={{ fontSize: 13, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: 14 }}>Notifications</div>
        {[
          { label: "New message from coach", sub: "Push + Email" },
          { label: "Weekly check-in reminder", sub: "Sunday 8 AM" },
          { label: "New program uploaded", sub: "Push only" },
          { label: "Billing updates", sub: "Email only" },
        ].map((n, i) => (
          <div key={n.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 3 ? `1px solid ${theme.border}` : "none" }}>
            <div>
              <div style={{ fontSize: 13, color: theme.text }}>{n.label}</div>
              <div style={{ fontSize: 11, color: theme.textDim, marginTop: 2 }}>{n.sub}</div>
            </div>
            {/* Toggle stub */}
            <div style={{
              width: 42, height: 24, borderRadius: 12,
              background: i < 3 ? theme.accent : "rgba(255,255,255,0.08)",
              position: "relative", cursor: "pointer", transition: "background 0.2s",
            }}>
              <div style={{
                position: "absolute", top: 3, left: i < 3 ? "calc(100% - 21px)" : 3,
                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <div style={fadeIn(200)}>
        <button style={{
          width: "100%", padding: "13px", borderRadius: 10,
          background: "none", border: `1px solid rgba(232,92,71,0.2)`,
          color: theme.red, fontSize: 14, fontWeight: 600, cursor: "pointer",
          letterSpacing: "-0.2px",
        }}>
          Sign Out
        </button>
      </div>
    </div>
  );

  // ── TAB RENDERER ───────────────────────────────────────────
  const renderTab = () => {
    switch (activeTab) {
      case "home":       return <HomeTab />;
      case "program":    return <ProgramTab />;
      case "nutrition":  return <NutritionTab />;
      case "checkin":    return <CheckInTab />;
      case "progress":   return <ProgressTab />;
      case "messages":   return <MessagesTab />;
      case "resources":  return <ResourcesTab />;
      case "account":    return <AccountTab />;
      default:           return <HomeTab />;
    }
  };

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", minHeight: "100vh", background: theme.bg,
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: theme.text,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
        input::-webkit-inner-spin-button, input::-webkit-outer-spin-button { -webkit-appearance: none; }
      `}</style>

      {/* Sidebar — desktop only */}
      {!isMobile && <Sidebar />}

      {/* Main content */}
      <div style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        padding: isMobile ? "20px 16px 100px" : "32px 36px",
        maxWidth: isMobile ? "100%" : 720,
      }}>
        {renderTab()}
      </div>

      {/* Bottom nav — mobile only */}
      {isMobile && <BottomNav />}
    </div>
  );
}
