import { useState, useEffect, useRef } from "react";
// ─── MOCK DATA ───────────────────────────────────────────────
const CLIENTS = [
  { id: 1, name: "Marcus Williams", avatar: "MW", status: "active", package: "Contest Prep", startDate: "2025-09-15", nextBilling: "2026-04-15", weight: 198, goalWeight: 185, adherence: 94, lastCheckIn: "2 days ago", trend: "down", weeklyChange: -1.2, photo: true, tags: ["competitor", "advanced"], email: "marcus.w@email.com", phone: "(256) 555-0142", measurements: { chest: 44, waist: 32, arms: 17, quads: 26 }, macros: { protein: 220, carbs: 280, fats: 65 }, monthlyRate: 299 },
  { id: 2, name: "Sarah Chen", avatar: "SC", status: "active", package: "Transformation", startDate: "2025-11-01", nextBilling: "2026-04-01", weight: 148, goalWeight: 135, adherence: 87, lastCheckIn: "1 day ago", trend: "down", weeklyChange: -0.8, photo: true, tags: ["fat-loss", "intermediate"], email: "sarah.chen@email.com", phone: "(256) 555-0198", measurements: { chest: 36, waist: 28, arms: 12, quads: 22 }, macros: { protein: 140, carbs: 160, fats: 50 }, monthlyRate: 199 },
  { id: 3, name: "Derek Johnson", avatar: "DJ", status: "active", package: "Performance", startDate: "2026-01-10", nextBilling: "2026-04-10", weight: 225, goalWeight: 225, adherence: 91, lastCheckIn: "Today", trend: "stable", weeklyChange: 0.3, photo: false, tags: ["strength", "advanced"], email: "djohnson@email.com", phone: "(256) 555-0267", measurements: { chest: 48, waist: 36, arms: 18.5, quads: 28 }, macros: { protein: 250, carbs: 350, fats: 80 }, monthlyRate: 249 },
  { id: 4, name: "Aliyah Brooks", avatar: "AB", status: "active", package: "Lifestyle", startDate: "2025-08-20", nextBilling: "2026-04-20", weight: 138, goalWeight: 130, adherence: 78, lastCheckIn: "4 days ago", trend: "down", weeklyChange: -0.4, photo: true, tags: ["fat-loss", "beginner"], email: "aliyah.b@email.com", phone: "(256) 555-0334", measurements: { chest: 34, waist: 27, arms: 11, quads: 21 }, macros: { protein: 130, carbs: 140, fats: 45 }, monthlyRate: 149 },
  { id: 5, name: "Jordan Reeves", avatar: "JR", status: "paused", package: "Contest Prep", startDate: "2025-06-01", nextBilling: "—", weight: 176, goalWeight: 165, adherence: 0, lastCheckIn: "3 weeks ago", trend: "paused", weeklyChange: 0, photo: true, tags: ["competitor", "paused"], email: "j.reeves@email.com", phone: "(256) 555-0401", measurements: { chest: 42, waist: 30, arms: 16, quads: 25 }, macros: { protein: 200, carbs: 220, fats: 55 }, monthlyRate: 299 },
  { id: 6, name: "Tina Okafor", avatar: "TO", status: "active", package: "Transformation", startDate: "2026-02-01", nextBilling: "2026-04-01", weight: 162, goalWeight: 145, adherence: 96, lastCheckIn: "Today", trend: "down", weeklyChange: -1.5, photo: true, tags: ["fat-loss", "intermediate"], email: "tina.ok@email.com", phone: "(256) 555-0478", measurements: { chest: 38, waist: 30, arms: 13, quads: 23 }, macros: { protein: 150, carbs: 170, fats: 52 }, monthlyRate: 199 },
  { id: 7, name: "Chris Nakamura", avatar: "CN", status: "active", package: "Performance", startDate: "2025-12-15", nextBilling: "2026-04-15", weight: 185, goalWeight: 190, adherence: 82, lastCheckIn: "3 days ago", trend: "up", weeklyChange: 0.6, photo: false, tags: ["muscle-gain", "intermediate"], email: "chris.n@email.com", phone: "(256) 555-0545", measurements: { chest: 43, waist: 33, arms: 16.5, quads: 25 }, macros: { protein: 210, carbs: 300, fats: 70 }, monthlyRate: 249 },
];
const LEADS = [
  { id: 1, name: "Travis Coleman", stage: "discovery-booked", source: "Instagram", date: "Mar 14", notes: "Interested in contest prep, 2nd show", value: 299 },
  { id: 2, name: "Megan Patel", stage: "new", source: "Website", date: "Mar 16", notes: "Fat loss inquiry, works night shifts", value: 199 },
  { id: 3, name: "Darnell Wright", stage: "proposal-sent", source: "Referral", date: "Mar 10", notes: "Referred by Marcus, wants performance coaching", value: 249 },
  { id: 4, name: "Keisha Barnes", stage: "discovery-done", source: "TikTok", date: "Mar 12", notes: "Postpartum fitness, very motivated", value: 199 },
  { id: 5, name: "Ryan O'Brien", stage: "new", source: "Google", date: "Mar 17", notes: "General fitness, new to coaching", value: 149 },
  { id: 6, name: "Jasmine Holt", stage: "won", source: "Instagram", date: "Mar 5", notes: "Signed Transformation package", value: 199 },
  { id: 7, name: "Andre Mitchell", stage: "lost", source: "Referral", date: "Mar 1", notes: "Went with local gym PT instead", value: 249 },
];
const CHECKINS_PENDING = [
  { clientId: 1, clientName: "Marcus Williams", avatar: "MW", submitted: "Mar 15, 8:42 AM", hasPhotos: true, notes: "Feeling flat, energy low mid-week" },
  { clientId: 6, clientName: "Tina Okafor", avatar: "TO", submitted: "Mar 16, 7:15 PM", hasPhotos: true, notes: "Best week yet! Hit all sessions" },
  { clientId: 2, clientName: "Sarah Chen", avatar: "SC", submitted: "Mar 16, 10:30 AM", hasPhotos: true, notes: "Struggled with weekend nutrition" },
  { clientId: 3, clientName: "Derek Johnson", avatar: "DJ", submitted: "Mar 17, 6:00 AM", hasPhotos: false, notes: "PR on squat — 495x3" },
];
const REVENUE_DATA = [
  { month: "Oct", revenue: 3450 }, { month: "Nov", revenue: 3890 },
  { month: "Dec", revenue: 4200 }, { month: "Jan", revenue: 4650 },
  { month: "Feb", revenue: 5100 }, { month: "Mar", revenue: 5446 },
];
const MESSAGES = [
  { id: 1, from: "Marcus Williams", avatar: "MW", preview: "Hey coach, should I add cardio on rest days?", time: "10 min ago", unread: true },
  { id: 2, from: "Sarah Chen", avatar: "SC", preview: "Check-in submitted! Also had a question about...", time: "2 hrs ago", unread: true },
  { id: 3, from: "Tina Okafor", avatar: "TO", preview: "Thank you so much for the adjustments!", time: "5 hrs ago", unread: false },
  { id: 4, from: "Derek Johnson", avatar: "DJ", preview: "Video of my squat PR attached 💪", time: "8 hrs ago", unread: false },
];
const SCHEDULE_TODAY = [
  { time: "9:00 AM", event: "Review Check-ins (4)", type: "task", color: "#E8C547" },
  { time: "11:00 AM", event: "Discovery Call — Travis Coleman", type: "call", color: "#47E8A0" },
  { time: "1:00 PM", event: "Program Updates — Marcus & Tina", type: "programming", color: "#4793E8" },
  { time: "3:30 PM", event: "Content Filming — YouTube", type: "content", color: "#E847A0" },
  { time: "6:00 PM", event: "Own Training Session", type: "personal", color: "#A047E8" },
];
// ─── ICONS (inline SVG components) ───────────────────────────
const Icon = ({ name, size = 20 }) => {
  const s = { width: size, height: size, strokeWidth: 1.8, fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    home: <svg {...s} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    users: <svg {...s} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    funnel: <svg {...s} viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    calendar: <svg {...s} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    message: <svg {...s} viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    dollar: <svg {...s} viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    chart: <svg {...s} viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    clipboard: <svg {...s} viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
    zap: <svg {...s} viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    book: <svg {...s} viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
    search: <svg {...s} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    bell: <svg {...s} viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    chevron: <svg {...s} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>,
    check: <svg {...s} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
    camera: <svg {...s} viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    trendUp: <svg {...s} viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    trendDown: <svg {...s} viewBox="0 0 24 24"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
    dumbbell: <svg {...s} viewBox="0 0 24 24"><path d="M6.5 6.5h11v11h-11z" fill="none"/><rect x="2" y="9" width="3" height="6" rx="1"/><rect x="19" y="9" width="3" height="6" rx="1"/><line x1="5" y1="12" x2="19" y2="12"/><rect x="5" y="7" width="2" height="10" rx="0.5"/><rect x="17" y="7" width="2" height="10" rx="0.5"/></svg>,
    star: <svg {...s} viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" stroke="currentColor"/></svg>,
    plus: <svg {...s} viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    arrowLeft: <svg {...s} viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    settings: <svg {...s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    x: <svg {...s} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  };
  return icons[name] || null;
};
// ─── MINI CHART COMPONENT ────────────────────────────────────
const MiniBarChart = ({ data, height = 120, accent = "#E8C547" }) => {
  const max = Math.max(...data.map(d => d.revenue));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, paddingTop: 8 }}>
      {data.map((d, i) => {
        const h = (d.revenue / max) * (height - 24);
        const isLast = i === data.length - 1;
        return (
          <div key={d.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}>
            <span style={{ fontSize: 10, color: isLast ? accent : "rgba(255,255,255,0.5)", fontWeight: isLast ? 700 : 400, fontVariantNumeric: "tabular-nums" }}>
              ${(d.revenue / 1000).toFixed(1)}k
            </span>
            <div style={{
              width: "100%", maxWidth: 32, height: h, borderRadius: "4px 4px 2px 2px",
              background: isLast ? accent : "rgba(255,255,255,0.08)",
              border: isLast ? "none" : "1px solid rgba(255,255,255,0.06)",
              transition: "height 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
            }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.5px" }}>{d.month}</span>
          </div>
        );
      })}
    </div>
  );
};
// ─── WEIGHT SPARKLINE ────────────────────────────────────────
const Sparkline = ({ trend, color }) => {
  const paths = {
    down: "M0,14 C8,12 16,16 24,10 C32,4 40,8 48,2",
    up: "M0,2 C8,4 16,0 24,6 C32,12 40,8 48,14",
    stable: "M0,8 C8,6 16,10 24,7 C32,9 40,7 48,8",
    paused: "M0,8 L48,8",
  };
  return (
    <svg width="48" height="16" viewBox="0 0 48 16" fill="none">
      <path d={paths[trend] || paths.stable} stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};
// ─── ADHERENCE RING ──────────────────────────────────────────
const AdherenceRing = ({ value, size = 40 }) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value >= 90 ? "#47E8A0" : value >= 75 ? "#E8C547" : "#E85C47";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)" }} />
    </svg>
  );
};
// ─── MAIN APP ────────────────────────────────────────────────
export default function TrainerCRM() {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSubTab, setClientSubTab] = useState("overview");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [animateIn, setAnimateIn] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [checkinReply, setCheckinReply] = useState({ activeIdx: null, text: "" });
  const [sentReplies, setSentReplies] = useState({});
  const [coachNotes, setCoachNotes] = useState({});
  const [editingMacros, setEditingMacros] = useState(false);
  const [macroEdits, setMacroEdits] = useState({});
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  useEffect(() => {
    setAnimateIn(false);
    const t = setTimeout(() => setAnimateIn(true), 30);
    return () => clearTimeout(t);
  }, [activeTab, selectedClient]);
  const activeClients = CLIENTS.filter(c => c.status === "active");
  const mrr = activeClients.reduce((s, c) => s + c.monthlyRate, 0);
  const avgAdherence = Math.round(activeClients.reduce((s, c) => s + c.adherence, 0) / activeClients.length);
  const theme = {
    bg: "#0D0D0F", surface: "#16161A", surfaceHover: "#1C1C22",
    border: "rgba(255,255,255,0.06)", borderLight: "rgba(255,255,255,0.1)",
    text: "#F0EDE6", textMuted: "rgba(255,255,255,0.45)", textDim: "rgba(255,255,255,0.25)",
    accent: "#E8C547", accentDim: "rgba(232,197,71,0.12)",
    green: "#47E8A0", greenDim: "rgba(71,232,160,0.12)",
    red: "#E85C47", redDim: "rgba(232,92,71,0.12)",
    blue: "#4793E8", blueDim: "rgba(71,147,232,0.12)",
  };
  const navItems = [
    { id: "home", icon: "home", label: "Dashboard" },
    { id: "clients", icon: "users", label: "Clients" },
    { id: "pipeline", icon: "funnel", label: "Pipeline" },
    { id: "programs", icon: "dumbbell", label: "Programs" },
    { id: "calendar", icon: "calendar", label: "Schedule" },
    { id: "messages", icon: "message", label: "Messages" },
    { id: "finances", icon: "dollar", label: "Finances" },
    { id: "analytics", icon: "chart", label: "Analytics" },
    { id: "automations", icon: "zap", label: "Automations" },
    { id: "resources", icon: "book", label: "Resources" },
  ];
  const card = {
    background: theme.surface, border: `1px solid ${theme.border}`,
    borderRadius: 14, padding: "20px 22px", transition: "all 0.2s ease",
  };
  const fadeIn = (delay = 0) => ({
    opacity: animateIn ? 1 : 0,
    transform: animateIn ? "translateY(0)" : "translateY(12px)",
    transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
  });
  const Sidebar = () => (
    <div style={{
      width: sidebarCollapsed ? 68 : 220, minWidth: sidebarCollapsed ? 68 : 220,
      background: theme.surface, borderRight: `1px solid ${theme.border}`,
      display: "flex", flexDirection: "column", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      position: "relative", zIndex: 10,
    }}>
      <div style={{
        padding: sidebarCollapsed ? "20px 12px" : "20px 22px",
        borderBottom: `1px solid ${theme.border}`,
        display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
      }} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${theme.accent}, #D4A017)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 14, color: "#0D0D0F", flexShrink: 0,
        }}>PT</div>
        {!sidebarCollapsed && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, letterSpacing: "-0.3px" }}>CoachCRM</div>
            <div style={{ fontSize: 10, color: theme.textMuted, letterSpacing: "1.5px", textTransform: "uppercase" }}>Pro Trainer</div>
          </div>
        )}
      </div>
      <div style={{ padding: "12px 8px", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          const hasNotif = item.id === "messages" && MESSAGES.filter(m => m.unread).length > 0;
          return (
            <div key={item.id} onClick={() => { setActiveTab(item.id); setSelectedClient(null); }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: sidebarCollapsed ? "10px 0" : "10px 14px",
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                borderRadius: 10, cursor: "pointer", position: "relative",
                background: isActive ? theme.accentDim : "transparent",
                color: isActive ? theme.accent : theme.textMuted,
                transition: "all 0.15s ease", fontWeight: isActive ? 600 : 400,
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = theme.surfaceHover; e.currentTarget.style.color = theme.text; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.textMuted; }}}
            >
              <Icon name={item.icon} size={18} />
              {!sidebarCollapsed && <span style={{ fontSize: 13, letterSpacing: "-0.2px" }}>{item.label}</span>}
              {hasNotif && (
                <div style={{
                  position: sidebarCollapsed ? "absolute" : "relative",
                  top: sidebarCollapsed ? 6 : "auto", right: sidebarCollapsed ? 12 : "auto",
                  marginLeft: sidebarCollapsed ? 0 : "auto",
                  width: 8, height: 8, borderRadius: 4, background: theme.red,
                }} />
              )}
            </div>
          );
        })}
      </div>
      {!sidebarCollapsed && (
        <div style={{ padding: "16px 22px", borderTop: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #E8C547 0%, #47E8A0 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, color: "#0D0D0F",
          }}>JM</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>Jonathon M.</div>
            <div style={{ fontSize: 10, color: theme.textMuted }}>Head Coach</div>
          </div>
        </div>
      )}
    </div>
  );
  const StatCard = ({ label, value, sub, icon, color, delay = 0 }) => (
    <div style={{ ...card, ...fadeIn(delay), display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1.2px", fontWeight: 500 }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", color }}>
          <Icon name={icon} size={16} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: theme.text, letterSpacing: "-1px", lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
  const HomeTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ ...fadeIn(0), display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: theme.text, margin: 0, letterSpacing: "-0.8px" }}>Good morning, Jonathon</h1>
          <p style={{ fontSize: 14, color: theme.textMuted, margin: "6px 0 0" }}>
            You have <span style={{ color: theme.accent, fontWeight: 600 }}>4 check-ins</span> to review and <span style={{ color: theme.green, fontWeight: 600 }}>1 call</span> today
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ ...card, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onClick={() => setSearchOpen(!searchOpen)}>
            <Icon name="search" size={16} />
            {!searchOpen && <span style={{ fontSize: 12, color: theme.textMuted }}>Search...</span>}
            {searchOpen && <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ background: "none", border: "none", outline: "none", color: theme.text, fontSize: 12, width: 140 }}
              placeholder="Search clients..." />}
          </div>
          <div style={{ ...card, padding: "8px 12px", cursor: "pointer", position: "relative" }}>
            <Icon name="bell" size={16} />
            <div style={{ position: "absolute", top: 6, right: 8, width: 6, height: 6, borderRadius: 3, background: theme.red }} />
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatCard label="Active Clients" value={activeClients.length} sub="1 paused" icon="users" color={theme.accent} delay={60} />
        <StatCard label="Monthly Revenue" value={`$${mrr.toLocaleString()}`} sub="+12% from last month" icon="dollar" color={theme.green} delay={120} />
        <StatCard label="Avg Adherence" value={`${avgAdherence}%`} sub="Across all active" icon="chart" color={theme.blue} delay={180} />
        <StatCard label="Pipeline Value" value={`$${LEADS.filter(l=>!["won","lost"].includes(l.stage)).reduce((s,l)=>s+l.value,0)}/mo`} sub={`${LEADS.filter(l=>!["won","lost"].includes(l.stage)).length} prospects`} icon="funnel" color="#A047E8" delay={240} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...card, ...fadeIn(300) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: theme.accent }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>Pending Check-ins</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: theme.accentDim, color: theme.accent }}>{CHECKINS_PENDING.length}</span>
              </div>
              <span style={{ fontSize: 12, color: theme.accent, cursor: "pointer", fontWeight: 500 }}>Review All →</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CHECKINS_PENDING.map((ci, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "12px 14px",
                  borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${theme.border}`,
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = theme.surfaceHover; e.currentTarget.style.borderColor = theme.borderLight; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = theme.border; }}
                  onClick={() => { setSelectedClient(CLIENTS.find(c => c.id === ci.clientId)); setActiveTab("clients"); setClientSubTab("checkins"); }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: `linear-gradient(135deg, ${theme.accent}30, ${theme.accent}10)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: theme.accent, flexShrink: 0,
                  }}>{ci.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{ci.clientName}</span>
                      {ci.hasPhotos && <span style={{ color: theme.textDim }}><Icon name="camera" size={13} /></span>}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ci.notes}</div>
                  </div>
                  <div style={{ fontSize: 10, color: theme.textDim, flexShrink: 0, textAlign: "right" }}>{ci.submitted}</div>
                  <div style={{ color: theme.textDim }}><Icon name="chevron" size={14} /></div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...card, ...fadeIn(400) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>Revenue Trend</span>
              <span style={{ fontSize: 11, color: theme.green, fontWeight: 600 }}>↑ 12.3% MoM</span>
            </div>
            <MiniBarChart data={REVENUE_DATA} height={110} accent={theme.accent} />
          </div>
          {/* ── Needs Attention ── */}
          {(() => {
            const flags = [
              ...CLIENTS.filter(c => c.lastCheckIn === "4 days ago" || c.lastCheckIn === "3 weeks ago").map(c => ({
                name: c.name, avatar: c.avatar, type: "checkin",
                msg: c.lastCheckIn === "3 weeks ago" ? "No check-in in 3 weeks — reach out" : "Check-in 4 days overdue",
                color: c.lastCheckIn === "3 weeks ago" ? theme.red : theme.accent,
                clientId: c.id,
              })),
              ...CLIENTS.filter(c => {
                const billing = c.nextBilling;
                if (!billing || billing === "—") return false;
                const days = Math.ceil((new Date(billing) - new Date()) / 86400000);
                return days >= 0 && days <= 5;
              }).map(c => ({
                name: c.name, avatar: c.avatar, type: "billing",
                msg: `Billing renews ${c.nextBilling} — confirm active`,
                color: theme.blue, clientId: c.id,
              })),
              ...CLIENTS.filter(c => c.adherence < 80 && c.status === "active").map(c => ({
                name: c.name, avatar: c.avatar, type: "adherence",
                msg: `Low adherence (${c.adherence}%) — may need re-engagement`,
                color: theme.red, clientId: c.id,
              })),
            ];
            if (!flags.length) return null;
            return (
              <div style={{ ...card, ...fadeIn(450), border: `1px solid rgba(232,92,71,0.2)` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: theme.red }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>Needs Attention</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: theme.redDim, color: theme.red }}>{flags.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {flags.map((f, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 12px", borderRadius: 10,
                      background: `${f.color}08`, border: `1px solid ${f.color}20`,
                      cursor: "pointer",
                    }} onClick={() => { setSelectedClient(CLIENTS.find(c => c.id === f.clientId)); setActiveTab("clients"); setClientSubTab("overview"); }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: `${f.color}20`, display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 11, fontWeight: 700, color: f.color,
                      }}>{f.avatar}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{f.name}</span>
                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>{f.msg}</div>
                      </div>
                      <div style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                        background: `${f.color}18`, color: f.color, textTransform: "uppercase", letterSpacing: "0.5px",
                      }}>{f.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...card, ...fadeIn(350) }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 14 }}>Today's Schedule</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SCHEDULE_TODAY.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                  <span style={{ fontSize: 11, color: theme.textDim, width: 58, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{s.time}</span>
                  <div style={{ width: 3, height: 28, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: theme.text, fontWeight: 500 }}>{s.event}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...card, ...fadeIn(450) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>Messages</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: theme.redDim, color: theme.red }}>{MESSAGES.filter(m => m.unread).length} new</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {MESSAGES.slice(0, 3).map(m => (
                <div key={m.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
                  borderRadius: 8, cursor: "pointer",
                  background: m.unread ? "rgba(232,197,71,0.04)" : "transparent",
                  border: `1px solid ${m.unread ? "rgba(232,197,71,0.1)" : "transparent"}`,
                }} onClick={() => setActiveTab("messages")}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: m.unread ? `${theme.accent}20` : "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: m.unread ? theme.accent : theme.textMuted,
                  }}>{m.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: m.unread ? 700 : 500, color: theme.text }}>{m.from}</span>
                      <span style={{ fontSize: 10, color: theme.textDim }}>{m.time}</span>
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.preview}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...card, ...fadeIn(500), padding: "16px 18px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 12 }}>Quick Actions</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Add Client", icon: "plus", color: theme.green },
                { label: "New Program", icon: "dumbbell", color: theme.blue },
                { label: "Log Lead", icon: "funnel", color: "#A047E8" },
                { label: "Send Blast", icon: "message", color: theme.accent },
              ].map(a => (
                <div key={a.label} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                  borderRadius: 8, background: a.color + "10", cursor: "pointer",
                  border: `1px solid ${a.color}15`, transition: "all 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = a.color + "20"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = a.color + "10"; }}
                >
                  <span style={{ color: a.color }}><Icon name={a.icon} size={14} /></span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: a.color }}>{a.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  const ClientProfile = ({ client }) => {
    const c = client;
    const subTabs = [
      { id: "overview", label: "Overview" },
      { id: "checkins", label: "Check-ins" },
      { id: "programming", label: "Programming" },
      { id: "nutrition", label: "Nutrition" },
      { id: "progress", label: "Progress" },
      { id: "billing", label: "Billing" },
    ];
    return (
      <div style={{ ...fadeIn(0) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, cursor: "pointer" }} onClick={() => setSelectedClient(null)}>
          <Icon name="arrowLeft" size={18} />
          <span style={{ fontSize: 13, color: theme.textMuted }}>Back to Clients</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: `linear-gradient(135deg, ${theme.accent}, #D4A017)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 800, color: "#0D0D0F",
          }}>{c.avatar}</div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: 0, letterSpacing: "-0.5px" }}>{c.name}</h2>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                background: c.status === "active" ? theme.greenDim : theme.redDim,
                color: c.status === "active" ? theme.green : theme.red,
                textTransform: "uppercase", letterSpacing: "0.5px",
              }}>{c.status}</span>
              <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.06)", color: theme.textMuted }}>{c.package}</span>
              {c.tags.map(t => (
                <span key={t} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "rgba(255,255,255,0.04)", color: theme.textDim }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <div style={{ ...card, padding: "8px 14px", cursor: "pointer", fontSize: 12, color: theme.accent, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="message" size={14} /> Message
            </div>
            <div style={{ ...card, padding: "8px 14px", cursor: "pointer", fontSize: 12, color: theme.textMuted }}>
              <Icon name="settings" size={14} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${theme.border}`, paddingBottom: 1 }}>
          {subTabs.map(t => (
            <div key={t.id} onClick={() => setClientSubTab(t.id)} style={{
              padding: "8px 16px", fontSize: 12, fontWeight: clientSubTab === t.id ? 600 : 400,
              color: clientSubTab === t.id ? theme.accent : theme.textMuted,
              borderBottom: clientSubTab === t.id ? `2px solid ${theme.accent}` : "2px solid transparent",
              cursor: "pointer", transition: "all 0.15s",
            }}>{t.label}</div>
          ))}
        </div>
        {clientSubTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div style={{ ...card, ...fadeIn(100) }}>
              <div style={{ fontSize: 11, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14, fontWeight: 500 }}>Contact</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div><div style={{ fontSize: 10, color: theme.textDim }}>Email</div><div style={{ fontSize: 12, color: theme.text, marginTop: 2 }}>{c.email}</div></div>
                <div><div style={{ fontSize: 10, color: theme.textDim }}>Phone</div><div style={{ fontSize: 12, color: theme.text, marginTop: 2 }}>{c.phone}</div></div>
                <div><div style={{ fontSize: 10, color: theme.textDim }}>Start Date</div><div style={{ fontSize: 12, color: theme.text, marginTop: 2 }}>{c.startDate}</div></div>
                <div><div style={{ fontSize: 10, color: theme.textDim }}>Next Billing</div><div style={{ fontSize: 12, color: theme.text, marginTop: 2 }}>{c.nextBilling}</div></div>
              </div>
            </div>
            <div style={{ ...card, ...fadeIn(200) }}>
              <div style={{ fontSize: 11, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14, fontWeight: 500 }}>Body Stats</div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: theme.text, letterSpacing: "-1px" }}>{c.weight}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>lbs current</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <Sparkline trend={c.trend} color={c.trend === "down" ? theme.green : c.trend === "up" ? theme.blue : theme.textMuted} />
                  <span style={{ fontSize: 10, color: c.weeklyChange < 0 ? theme.green : c.weeklyChange > 0 ? theme.blue : theme.textMuted, fontWeight: 600 }}>
                    {c.weeklyChange > 0 ? "+" : ""}{c.weeklyChange} lbs/wk
                  </span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {Object.entries(c.measurements).map(([key, val]) => (
                  <div key={key} style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(255,255,255,0.03)" }}>
                    <div style={{ fontSize: 10, color: theme.textDim, textTransform: "capitalize" }}>{key}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{val}"</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...card, ...fadeIn(300) }}>
              <div style={{ fontSize: 11, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14, fontWeight: 500 }}>Adherence & Nutrition</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div style={{ position: "relative" }}>
                  <AdherenceRing value={c.adherence} size={56} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: theme.text }}>{c.adherence}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>Weekly Adherence</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>Last check-in: {c.lastCheckIn}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: theme.textDim, marginBottom: 8, fontWeight: 500 }}>Daily Macro Targets</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Protein", val: c.macros.protein, color: theme.red, unit: "g" },
                  { label: "Carbs", val: c.macros.carbs, color: theme.accent, unit: "g" },
                  { label: "Fats", val: c.macros.fats, color: theme.blue, unit: "g" },
                ].map(m => (
                  <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, color: theme.textMuted, width: 50 }}>{m.label}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min((m.val / 350) * 100, 100)}%`, height: "100%", borderRadius: 3, background: m.color }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: theme.text, width: 40, textAlign: "right" }}>{m.val}{m.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* ── Private Coach Notes ── */}
          <div style={{ ...card, ...fadeIn(400) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>Private Coach Notes</div>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(232,92,71,0.1)", color: theme.red, fontWeight: 600, letterSpacing: "0.5px" }}>NOT VISIBLE TO CLIENT</span>
            </div>
            <textarea
              value={coachNotes[c.id] || ""}
              onChange={e => setCoachNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
              placeholder={`Private notes about ${c.name.split(" ")[0]}... personality, motivators, things they mentioned on calls, red flags, context you want to remember.`}
              rows={4}
              style={{
                width: "100%", padding: "12px 14px",
                background: "rgba(255,255,255,0.02)", border: `1px solid ${theme.border}`,
                borderRadius: 10, color: theme.text, fontSize: 13,
                outline: "none", resize: "vertical", lineHeight: 1.6,
                fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button
                onClick={() => showToast("Notes saved")}
                style={{
                  padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: coachNotes[c.id]?.trim() ? theme.accentDim : "rgba(255,255,255,0.04)",
                  color: coachNotes[c.id]?.trim() ? theme.accent : theme.textDim,
                  fontSize: 12, fontWeight: 600, transition: "all 0.15s",
                }}>
                Save Notes
              </button>
            </div>
          </div>
          </div>
        )}
        {clientSubTab === "checkins" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, ...fadeIn(100) }}>
            {[
              { date: "Mar 15, 2026", weight: c.weight, adherence: c.adherence, sessions: 5, energy: 4, sleep: 3, stress: 3, notes: "Solid week overall. Hit all training sessions. Feeling tighter in the waist.", hasPhotos: true },
              { date: "Mar 8, 2026", weight: c.weight + 0.8, adherence: c.adherence - 2, sessions: 4, energy: 3, sleep: 4, stress: 2, notes: "Missed one session due to work. Nutrition was on point.", hasPhotos: true },
              { date: "Mar 1, 2026", weight: c.weight + 1.5, adherence: c.adherence - 5, sessions: 4, energy: 2, sleep: 3, stress: 3, notes: "Adjusting to new program. Some DOMS. Diet was roughly 80% compliant.", hasPhotos: true },
            ].map((ci, i) => {
              const isOpen = checkinReply.activeIdx === `${c.id}-${i}`;
              const replied = sentReplies[`${c.id}-${i}`];
              return (
                <div key={i} style={{
                  ...card, padding: "18px 20px",
                  border: `1px solid ${i === 0 ? "rgba(232,197,71,0.2)" : theme.border}`,
                }}>
                  {/* Header row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{ci.date}</span>
                      {i === 0 && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 12, background: theme.accentDim, color: theme.accent, fontWeight: 600 }}>Latest</span>}
                      {ci.hasPhotos && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: theme.textDim }}>
                          <Icon name="camera" size={12} /> Photos
                        </span>
                      )}
                    </div>
                    {replied
                      ? <span style={{ fontSize: 11, color: theme.green, fontWeight: 600 }}>✓ Responded</span>
                      : <button onClick={() => setCheckinReply(prev => ({ activeIdx: isOpen ? null : `${c.id}-${i}`, text: isOpen ? "" : prev.text }))}
                          style={{
                            fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 8, border: "none",
                            background: isOpen ? "rgba(255,255,255,0.06)" : theme.accentDim,
                            color: isOpen ? theme.textMuted : theme.accent, cursor: "pointer",
                          }}>
                          {isOpen ? "Cancel" : "↩ Reply"}
                        </button>
                    }
                  </div>
                  {/* Stats row */}
                  <div style={{ display: "flex", gap: 20, marginBottom: 12, flexWrap: "wrap" }}>
                    {[
                      { label: "Weight", val: `${ci.weight} lbs`, color: theme.text },
                      { label: "Sessions", val: `${ci.sessions}/5`, color: ci.sessions >= 5 ? theme.green : theme.accent },
                      { label: "Adherence", val: `${ci.adherence}%`, color: ci.adherence >= 90 ? theme.green : theme.accent },
                      { label: "Energy", val: `${ci.energy}/5`, color: ci.energy >= 4 ? theme.green : ci.energy <= 2 ? theme.red : theme.accent },
                      { label: "Sleep", val: `${ci.sleep}/5`, color: ci.sleep >= 4 ? theme.green : ci.sleep <= 2 ? theme.red : theme.accent },
                      { label: "Stress", val: `${ci.stress}/5`, color: ci.stress <= 2 ? theme.green : ci.stress >= 4 ? theme.red : theme.accent },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ fontSize: 10, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.8px" }}>{s.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginTop: 2 }}>{s.val}</div>
                      </div>
                    ))}
                  </div>
                  {/* Client notes */}
                  <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.6, padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, marginBottom: replied || isOpen ? 12 : 0 }}>
                    "{ci.notes}"
                  </div>
                  {/* Sent reply preview */}
                  {replied && (
                    <div style={{ padding: "10px 12px", background: "rgba(71,232,160,0.05)", border: `1px solid rgba(71,232,160,0.15)`, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: theme.green, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 5 }}>Your Response</div>
                      <div style={{ fontSize: 12, color: theme.text, lineHeight: 1.6 }}>{replied}</div>
                    </div>
                  )}
                  {/* Inline reply composer */}
                  {isOpen && !replied && (
                    <div style={{ marginTop: 4 }}>
                      <textarea
                        autoFocus
                        value={checkinReply.text}
                        onChange={e => setCheckinReply(prev => ({ ...prev, text: e.target.value }))}
                        placeholder={`Write your feedback for ${c.name.split(" ")[0]}...`}
                        rows={4}
                        style={{
                          width: "100%", padding: "12px 14px",
                          background: "#1C1C22", border: `1px solid rgba(232,197,71,0.25)`,
                          borderRadius: 10, color: theme.text, fontSize: 13,
                          outline: "none", resize: "vertical", lineHeight: 1.6,
                          fontFamily: "inherit", boxSizing: "border-box",
                        }}
                      />
                      <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => {
                            if (!checkinReply.text.trim()) return;
                            setSentReplies(prev => ({ ...prev, [`${c.id}-${i}`]: checkinReply.text }));
                            setCheckinReply({ activeIdx: null, text: "" });
                            showToast(`Response sent to ${c.name.split(" ")[0]}`);
                            // TODO: POST reply to Supabase check_in_responses table
                          }}
                          style={{
                            padding: "9px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                            background: checkinReply.text.trim() ? theme.accent : "rgba(255,255,255,0.06)",
                            color: checkinReply.text.trim() ? "#0D0D0F" : theme.textDim,
                            fontSize: 12, fontWeight: 700, transition: "all 0.15s",
                          }}>
                          Send to Client →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {clientSubTab === "programming" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ ...card, ...fadeIn(100) }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 4 }}>Current Block</div>
              <div style={{ fontSize: 12, color: theme.accent, marginBottom: 16 }}>Hypertrophy — Week 3 of 6</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["Upper Push", "Lower Quad-Dominant", "Upper Pull", "Lower Hinge", "Arms & Accessories"].map((d, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${theme.border}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: theme.textDim, width: 40 }}>Day {i + 1}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: theme.text }}>{d}</span>
                    </div>
                    <Icon name="chevron" size={14} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...card, ...fadeIn(200) }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Progression Log</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { lift: "Bench Press", current: "225 x 8", prev: "225 x 6", trend: "up" },
                  { lift: "Squat", current: "315 x 6", prev: "315 x 5", trend: "up" },
                  { lift: "RDL", current: "275 x 10", prev: "275 x 10", trend: "stable" },
                  { lift: "OHP", current: "155 x 5", prev: "150 x 6", trend: "up" },
                ].map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: theme.text }}>{l.lift}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 11, color: theme.textDim }}>{l.prev}</span>
                      <span style={{ color: theme.textDim }}>→</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: l.trend === "up" ? theme.green : theme.text }}>{l.current}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {clientSubTab === "nutrition" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, ...fadeIn(100) }}>
            <div style={{ ...card }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>Macro Targets</div>
                <button
                  onClick={() => {
                    if (editingMacros) {
                      showToast(`Macros updated for ${c.name.split(" ")[0]}`);
                      // TODO: PATCH Supabase client_onboarding macros
                    }
                    setEditingMacros(e => !e);
                    if (!editingMacros) setMacroEdits({ protein: c.macros.protein, carbs: c.macros.carbs, fats: c.macros.fats });
                  }}
                  style={{
                    padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: editingMacros ? theme.accent : theme.accentDim,
                    color: editingMacros ? "#0D0D0F" : theme.accent,
                    fontSize: 12, fontWeight: 700, transition: "all 0.15s",
                  }}>
                  {editingMacros ? "✓ Save Changes" : "Edit Macros"}
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: editingMacros ? 20 : 0 }}>
                {[
                  { key: "calories", label: "Calories", val: (macroEdits.protein || c.macros.protein) * 4 + (macroEdits.carbs || c.macros.carbs) * 4 + (macroEdits.fats || c.macros.fats) * 9, color: theme.accent, readOnly: true },
                  { key: "protein", label: "Protein", val: editingMacros ? macroEdits.protein : c.macros.protein, suffix: "g", color: theme.red },
                  { key: "carbs", label: "Carbs", val: editingMacros ? macroEdits.carbs : c.macros.carbs, suffix: "g", color: theme.accent },
                  { key: "fats", label: "Fats", val: editingMacros ? macroEdits.fats : c.macros.fats, suffix: "g", color: theme.blue },
                ].map(m => (
                  <div key={m.label} style={{ padding: "14px 16px", borderRadius: 10, background: m.color + "10", textAlign: "center" }}>
                    {editingMacros && !m.readOnly
                      ? <input
                          type="number"
                          value={m.val}
                          onChange={e => setMacroEdits(prev => ({ ...prev, [m.key]: Number(e.target.value) }))}
                          style={{
                            width: "100%", background: "none", border: "none", outline: "none",
                            fontSize: 22, fontWeight: 800, color: m.color, textAlign: "center",
                            fontFamily: "inherit",
                          }}
                        />
                      : <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.val}{m.suffix || ""}</div>
                    }
                    <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.8px" }}>{m.label}</div>
                  </div>
                ))}
              </div>
              {editingMacros && (
                <div style={{ marginTop: 4 }}>
                  <textarea
                    placeholder="Reason for adjustment (e.g. 'Dropping carbs 20g — scale stalled, want to create deficit without pulling protein')..."
                    rows={3}
                    style={{
                      width: "100%", padding: "10px 14px",
                      background: "rgba(255,255,255,0.02)", border: `1px solid ${theme.border}`,
                      borderRadius: 8, color: theme.text, fontSize: 12,
                      outline: "none", resize: "none", lineHeight: 1.6,
                      fontFamily: "inherit", boxSizing: "border-box",
                    }}
                  />
                  <div style={{ fontSize: 11, color: theme.textDim, marginTop: 6 }}>This note will be saved with the client's adjustment history.</div>
                </div>
              )}
            </div>
            {/* Meal timing */}
            <div style={{ ...card }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 12 }}>Meal Timing Protocol</div>
              {[
                { time: "7:00 AM", label: "Meal 1 — Pre-Training", detail: "Protein + Carbs. No fats pre-workout." },
                { time: "10:00 AM", label: "Post-Workout", detail: "EAAs + fast carbs. Protein shake immediately after." },
                { time: "1:00 PM", label: "Meal 2 — Midday", detail: "Full macro meal. Lean protein + complex carbs + fats." },
                { time: "4:30 PM", label: "Meal 3 — Afternoon", detail: "Protein-forward. Light carbs if training." },
                { time: "7:30 PM", label: "Meal 4 — Dinner", detail: "Full meal. Moderate carbs in evening." },
                { time: "9:30 PM", label: "Meal 5 — Before Bed", detail: "Casein protein. No carbs." },
              ].map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "8px 0", borderBottom: i < 5 ? `1px solid ${theme.border}` : "none" }}>
                  <div style={{ fontSize: 11, color: theme.accent, fontWeight: 700, minWidth: 58, paddingTop: 2 }}>{m.time}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>{m.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {clientSubTab === "progress" && (
          <div style={{ ...card, ...fadeIn(100) }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Progress Timeline</div>
            <div style={{ display: "flex", gap: 20 }}>
              {["Week 1", "Week 6", "Week 12"].map((w, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{
                    height: 180, borderRadius: 12, background: `linear-gradient(180deg, rgba(232,197,71,${0.05 + i * 0.03}), rgba(255,255,255,0.02))`,
                    border: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8,
                  }}>
                    <span style={{ color: theme.textDim, fontSize: 12 }}><Icon name="camera" size={24} /><br />Photo</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{w}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>{c.weight + (2 - i) * 4} lbs</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {clientSubTab === "billing" && (
          <div style={{ ...card, ...fadeIn(100) }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Billing & Contract</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div style={{ padding: "14px", borderRadius: 10, background: theme.greenDim }}>
                <div style={{ fontSize: 11, color: theme.textMuted }}>Monthly Rate</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: theme.green }}>${c.monthlyRate}</div>
              </div>
              <div style={{ padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: 11, color: theme.textMuted }}>Next Billing</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{c.nextBilling}</div>
              </div>
              <div style={{ padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: 11, color: theme.textMuted }}>Client Since</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{c.startDate}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  const ClientsTab = () => {
    if (selectedClient) return <ClientProfile client={selectedClient} />;
    const filtered = searchQuery ? CLIENTS.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())) : CLIENTS;
    return (
      <div style={{ ...fadeIn(0) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: 0, letterSpacing: "-0.5px" }}>Clients</h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ ...card, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="search" size={14} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ background: "none", border: "none", outline: "none", color: theme.text, fontSize: 12, width: 150 }}
                placeholder="Search clients..." />
            </div>
            <div style={{
              padding: "8px 16px", borderRadius: 10, cursor: "pointer",
              background: `linear-gradient(135deg, ${theme.accent}, #D4A017)`,
              fontSize: 12, fontWeight: 700, color: "#0D0D0F", display: "flex", alignItems: "center", gap: 6,
            }}>
              <Icon name="plus" size={14} /> Add Client
            </div>
          </div>
        </div>
        <div style={{ ...card }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.8fr 0.8fr 0.8fr 0.6fr 0.4fr", gap: 12, padding: "10px 14px", marginBottom: 4 }}>
            {["Client", "Package", "Weight Trend", "Adherence", "Last Check-in", "Status", ""].map(h => (
              <span key={h} style={{ fontSize: 10, color: theme.textDim, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 500 }}>{h}</span>
            ))}
          </div>
          {filtered.map((c, i) => (
            <div key={c.id} style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 0.8fr 0.8fr 0.8fr 0.6fr 0.4fr",
              gap: 12, padding: "12px 14px", alignItems: "center",
              borderRadius: 8, cursor: "pointer", transition: "all 0.12s",
              borderBottom: `1px solid ${theme.border}`, ...fadeIn(i * 50 + 100),
            }}
              onMouseEnter={e => { e.currentTarget.style.background = theme.surfaceHover; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              onClick={() => { setSelectedClient(c); setClientSubTab("overview"); }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: `linear-gradient(135deg, ${theme.accent}30, ${theme.accent}10)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: theme.accent, flexShrink: 0,
                }}>{c.avatar}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{c.name}</span>
              </div>
              <span style={{ fontSize: 12, color: theme.textMuted }}>{c.package}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkline trend={c.trend} color={c.trend === "down" ? theme.green : c.trend === "up" ? theme.blue : theme.textMuted} />
                <span style={{ fontSize: 11, fontWeight: 600, color: c.weeklyChange < 0 ? theme.green : c.weeklyChange > 0 ? theme.blue : theme.textMuted }}>
                  {c.weeklyChange > 0 ? "+" : ""}{c.weeklyChange}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AdherenceRing value={c.adherence} size={28} />
                <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{c.adherence}%</span>
              </div>
              <span style={{ fontSize: 12, color: theme.textMuted }}>{c.lastCheckIn}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 12, textTransform: "uppercase",
                background: c.status === "active" ? theme.greenDim : theme.redDim,
                color: c.status === "active" ? theme.green : theme.red,
              }}>{c.status}</span>
              <div style={{ color: theme.textDim }}><Icon name="chevron" size={14} /></div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  const PipelineTab = () => {
    const stages = [
      { id: "new", label: "New Inquiry", color: theme.blue },
      { id: "discovery-booked", label: "Call Booked", color: theme.accent },
      { id: "discovery-done", label: "Call Done", color: "#A047E8" },
      { id: "proposal-sent", label: "Proposal Sent", color: "#E847A0" },
      { id: "won", label: "Won", color: theme.green },
      { id: "lost", label: "Lost", color: theme.red },
    ];
    return (
      <div style={{ ...fadeIn(0) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: 0, letterSpacing: "-0.5px" }}>Pipeline</h1>
          <div style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", background: `linear-gradient(135deg, ${theme.accent}, #D4A017)`, fontSize: 12, fontWeight: 700, color: "#0D0D0F" }}>+ Add Lead</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${stages.length}, 1fr)`, gap: 12 }}>
          {stages.map((stage, si) => {
            const stageLeads = LEADS.filter(l => l.stage === stage.id);
            return (
              <div key={stage.id} style={{ ...fadeIn(si * 80) }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: stage.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{stage.label}</span>
                  <span style={{ fontSize: 10, color: theme.textDim, marginLeft: "auto" }}>{stageLeads.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {stageLeads.map(lead => (
                    <div key={lead.id} style={{ ...card, padding: "14px 16px", cursor: "pointer", borderLeft: `3px solid ${stage.color}` }}
                      onMouseEnter={e => { e.currentTarget.style.background = theme.surfaceHover; }}
                      onMouseLeave={e => { e.currentTarget.style.background = theme.surface; }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 4 }}>{lead.name}</div>
                      <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, lineHeight: 1.4 }}>{lead.notes}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 12, background: "rgba(255,255,255,0.04)", color: theme.textDim }}>{lead.source}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: stage.color }}>${lead.value}/mo</span>
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div style={{ padding: 20, textAlign: "center", borderRadius: 10, border: `1px dashed ${theme.border}` }}>
                      <span style={{ fontSize: 11, color: theme.textDim }}>No leads</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  const MessagesTab = () => (
    <div style={{ ...fadeIn(0) }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: "0 0 20px", letterSpacing: "-0.5px" }}>Messages</h1>
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 14, height: "calc(100vh - 180px)" }}>
        <div style={{ ...card, padding: 0, overflow: "auto" }}>
          {MESSAGES.map(m => (
            <div key={m.id} style={{
              display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 18px",
              borderBottom: `1px solid ${theme.border}`, cursor: "pointer",
              background: m.unread ? "rgba(232,197,71,0.03)" : "transparent",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = theme.surfaceHover; }}
              onMouseLeave={e => { e.currentTarget.style.background = m.unread ? "rgba(232,197,71,0.03)" : "transparent"; }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `${theme.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: theme.accent }}>{m.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: m.unread ? 700 : 500, color: theme.text }}>{m.from}</span>
                  <span style={{ fontSize: 10, color: theme.textDim }}>{m.time}</span>
                </div>
                <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.preview}</div>
              </div>
              {m.unread && <div style={{ width: 8, height: 8, borderRadius: 4, background: theme.accent, flexShrink: 0, marginTop: 6 }} />}
            </div>
          ))}
        </div>
        <div style={{ ...card, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <div style={{ color: theme.textDim, marginBottom: 8 }}><Icon name="message" size={32} /></div>
          <div style={{ fontSize: 14, color: theme.textMuted }}>Select a conversation</div>
        </div>
      </div>
    </div>
  );
  const FinancesTab = () => (
    <div style={{ ...fadeIn(0) }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: "0 0 20px", letterSpacing: "-0.5px" }}>Finances</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard label="MRR" value={`$${mrr.toLocaleString()}`} sub="Monthly recurring" icon="dollar" color={theme.green} delay={60} />
        <StatCard label="ARR Projection" value={`$${(mrr * 12).toLocaleString()}`} sub="Annualized" icon="chart" color={theme.accent} delay={120} />
        <StatCard label="Avg Client Value" value={`$${Math.round(mrr / activeClients.length)}/mo`} sub="Per active client" icon="users" color={theme.blue} delay={180} />
        <StatCard label="Churn Rate" value="4.2%" sub="Last 90 days" icon="trendDown" color={theme.red} delay={240} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14 }}>
        <div style={{ ...card, ...fadeIn(300) }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Revenue — Last 6 Months</div>
          <MiniBarChart data={REVENUE_DATA} height={160} accent={theme.accent} />
        </div>
        <div style={{ ...card, ...fadeIn(350) }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Revenue by Package</div>
          {[
            { pkg: "Contest Prep", clients: 1, rate: 299, color: theme.accent },
            { pkg: "Performance", clients: 2, rate: 249, color: theme.blue },
            { pkg: "Transformation", clients: 2, rate: 199, color: theme.green },
            { pkg: "Lifestyle", clients: 1, rate: 149, color: "#A047E8" },
          ].map(p => (
            <div key={p.pkg} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: p.color }} />
                <span style={{ fontSize: 12, color: theme.text }}>{p.pkg}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: p.color }}>${p.clients * p.rate}/mo</div>
                <div style={{ fontSize: 10, color: theme.textDim }}>{p.clients} client{p.clients > 1 ? "s" : ""}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  const AnalyticsTab = () => (
    <div style={{ ...fadeIn(0) }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: "0 0 20px", letterSpacing: "-0.5px" }}>Analytics</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard label="Lead Conversion" value="42%" sub="Last 30 days" icon="funnel" color={theme.green} delay={60} />
        <StatCard label="Avg Client Duration" value="5.2 mo" sub="Active clients" icon="calendar" color={theme.accent} delay={120} />
        <StatCard label="Client Lifetime Value" value="$1,248" sub="Average revenue" icon="star" color={theme.blue} delay={180} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ ...card, ...fadeIn(240) }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Lead Sources</div>
          {[
            { source: "Instagram", count: 12, pct: 40, color: "#E847A0" },
            { source: "Referrals", count: 8, pct: 27, color: theme.accent },
            { source: "Website", count: 5, pct: 17, color: theme.blue },
            { source: "TikTok", count: 3, pct: 10, color: "#47E8A0" },
            { source: "Google", count: 2, pct: 6, color: "#A047E8" },
          ].map(s => (
            <div key={s.source} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: theme.text }}>{s.source}</span>
                <span style={{ fontSize: 11, color: theme.textMuted }}>{s.count} leads · {s.pct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ width: `${s.pct}%`, height: "100%", borderRadius: 3, background: s.color }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...card, ...fadeIn(300) }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Retention Cohorts</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 4, marginBottom: 12 }}>
            {["", "M1", "M3", "M6", "M12"].map(h => (
              <div key={h} style={{ fontSize: 10, color: theme.textDim, textAlign: "center", fontWeight: 500 }}>{h}</div>
            ))}
            {[
              { cohort: "Q3 '25", vals: [100, 85, 71, 57] },
              { cohort: "Q4 '25", vals: [100, 88, 75, null] },
              { cohort: "Q1 '26", vals: [100, 92, null, null] },
            ].map(row => (
              <>
                <div style={{ fontSize: 11, color: theme.textMuted, display: "flex", alignItems: "center" }}>{row.cohort}</div>
                {row.vals.map((v, i) => (
                  <div key={i} style={{
                    padding: "8px 4px", borderRadius: 6, textAlign: "center",
                    background: v !== null ? `rgba(71, 232, 160, ${(v / 100) * 0.3})` : "rgba(255,255,255,0.02)",
                    fontSize: 12, fontWeight: 600, color: v !== null ? theme.text : theme.textDim,
                  }}>{v !== null ? `${v}%` : "—"}</div>
                ))}
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  const PlaceholderTab = ({ title, icon, description, features }) => (
    <div style={{ ...fadeIn(0) }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: "0 0 20px", letterSpacing: "-0.5px" }}>{title}</h1>
      <div style={{ ...card, textAlign: "center", padding: "60px 40px" }}>
        <div style={{ color: theme.accent, marginBottom: 16, opacity: 0.5 }}><Icon name={icon} size={40} /></div>
        <div style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginBottom: 8 }}>{description}</div>
        <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
          This section is ready for implementation. Key features planned:
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {features.map(f => (
            <span key={f} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 20, background: "rgba(255,255,255,0.04)", color: theme.textMuted, border: `1px solid ${theme.border}` }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
  const tabContent = {
    home: <HomeTab />,
    clients: <ClientsTab />,
    pipeline: <PipelineTab />,
    programs: <PlaceholderTab title="Programs & Templates" icon="dumbbell" description="Training Program Library" features={["Program Builder", "Template Library", "Exercise Database", "Auto-Progression", "Deload Scheduling", "Block Periodization"]} />,
    calendar: <PlaceholderTab title="Schedule" icon="calendar" description="Unified Calendar" features={["Consultation Booking", "Check-in Deadlines", "Content Planning", "Client Milestones", "Sync with Google Calendar", "Automated Reminders"]} />,
    messages: <MessagesTab />,
    finances: <FinancesTab />,
    analytics: <AnalyticsTab />,
    automations: <PlaceholderTab title="Automations" icon="zap" description="Workflow Automations" features={["Check-in Reminders", "Welcome Sequences", "Re-engagement Emails", "Renewal Alerts", "Birthday Messages", "Missed Check-in Triggers"]} />,
    resources: <PlaceholderTab title="Resources" icon="book" description="Client Resource Library" features={["Exercise Videos", "Nutrition Guides", "Supplement Protocols", "Recipe Packs", "Mindset Content", "Per-Client Assignment"]} />,
  };
  return (
    <div style={{
      display: "flex", height: "100vh", width: "100vw",
      background: theme.bg, color: theme.text, overflow: "hidden",
      fontFamily: "'DM Sans', 'Satoshi', -apple-system, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      {/* ── Toast notification ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: toast.type === "success" ? "#16261A" : "#261616",
          border: `1px solid ${toast.type === "success" ? theme.green : theme.red}`,
          borderRadius: 12, padding: "13px 18px",
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          animation: "slideUp 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: toast.type === "success" ? theme.green : theme.red, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{toast.msg}</span>
        </div>
      )}
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <Sidebar />
      <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
        {tabContent[activeTab]}
      </div>
    </div>
  );
}
