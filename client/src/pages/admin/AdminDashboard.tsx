import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Activity,
  BarChart3,
  BellRing,
  BookOpen,
  Bot,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  FileText,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Send,
  Settings,
  Sparkles,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminPayload } from "@shared/contracts";
import { AccessGate } from "@/components/AccessGate";
import { BrandLockup } from "@/components/Brand";
import { api, ApiError } from "@/lib/api";
import { signOut } from "@/lib/auth";
import { isLocalPreview } from "@/lib/config";

type TabId =
  | "overview"
  | "clients"
  | "checkins"
  | "calendar"
  | "programs"
  | "messages"
  | "leads"
  | "payments"
  | "library"
  | "automations"
  | "analytics"
  | "settings";
type NavItem = { id: TabId; label: string; icon: LucideIcon };

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Operations",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "clients", label: "Clients", icon: Users },
      { id: "checkins", label: "Check-ins", icon: ClipboardCheck },
      { id: "calendar", label: "Calendar", icon: CalendarDays },
      { id: "programs", label: "Programs", icon: FileText },
      { id: "messages", label: "Messages", icon: MessageCircle },
    ],
  },
  {
    label: "Business",
    items: [
      { id: "leads", label: "Leads", icon: UserPlus },
      { id: "payments", label: "Payments", icon: CreditCard },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { id: "library", label: "Library", icon: Library },
      { id: "automations", label: "Automations", icon: Bot },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

const previewData: AdminPayload = {
  preview: true,
  coach: { firstName: "Murray", role: "Owner" },
  metrics: {
    activeClients: 18,
    pendingPlans: 3,
    dueCheckIns: 5,
    unreadMessages: 4,
    monthlyRevenue: 7_480,
  },
  clients: [
    {
      id: "00000000-0000-0000-0000-000000000011",
      name: "Preview Client A",
      email: "client-a@example.com",
      goal: "Build strength",
      status: "active",
      weekNumber: 4,
      totalWeeks: 12,
      adherence: 88,
      lastActive: "2 hours ago",
    },
    {
      id: "00000000-0000-0000-0000-000000000012",
      name: "Preview Client B",
      email: "client-b@example.com",
      goal: "Fat loss",
      status: "check-in due",
      weekNumber: 7,
      totalWeeks: 16,
      adherence: 61,
      lastActive: "4 days ago",
    },
    {
      id: "00000000-0000-0000-0000-000000000013",
      name: "Preview Client C",
      email: "client-c@example.com",
      goal: "Athletic performance",
      status: "plan pending",
      weekNumber: 0,
      totalWeeks: 12,
      lastActive: "Today",
    },
  ],
  checkIns: [
    {
      id: "ci1",
      clientId: "00000000-0000-0000-0000-000000000011",
      clientName: "Preview Client A",
      submittedAt: "2026-07-09T16:00:00.000Z",
      adherence: 88,
      energy: 4,
      reviewed: false,
    },
    {
      id: "ci2",
      clientId: "00000000-0000-0000-0000-000000000012",
      clientName: "Preview Client B",
      submittedAt: "2026-07-07T14:00:00.000Z",
      adherence: 61,
      energy: 2,
      reviewed: false,
    },
  ],
  messages: [
    {
      id: "msg1",
      clientId: "00000000-0000-0000-0000-000000000011",
      clientName: "Preview Client A",
      body: "Can you check my squat form before Friday?",
      sentAt: "2026-07-10T14:30:00.000Z",
      read: false,
    },
  ],
  leads: [
    {
      id: "00000000-0000-0000-0000-000000000021",
      name: "Preview Lead",
      email: "lead@example.com",
      source: "Coaching quiz",
      status: "new",
      createdAt: "2026-07-10T13:00:00.000Z",
    },
  ],
  programs: [
    {
      id: "p1",
      clientId: "00000000-0000-0000-0000-000000000011",
      clientName: "Preview Client A",
      title: "Foundation Strength — Phase 1",
      status: "active",
      updatedAt: "2026-07-08T12:00:00.000Z",
    },
    {
      id: "p2",
      clientId: "00000000-0000-0000-0000-000000000013",
      clientName: "Preview Client C",
      title: "Awaiting intake review",
      status: "draft",
      updatedAt: "2026-07-10T12:00:00.000Z",
    },
  ],
  payments: [
    {
      id: "pay1",
      clientName: "Preview Client A",
      amount: 249,
      currency: "USD",
      status: "paid",
      createdAt: "2026-07-01T12:00:00.000Z",
    },
  ],
};

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[var(--cm-radius-lg)] border border-[var(--cm-border)] bg-[var(--cm-surface)] ${className}`}
    >
      {children}
    </section>
  );
}

function Header({
  kicker,
  title,
  description,
  action,
}: {
  kicker: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="cm-kicker">{kicker}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cm-text-muted)]">
          {description}
        </p>
      </div>
      {action}
    </header>
  );
}

function PreviewNotice() {
  return (
    <div
      role="status"
      className="mb-6 flex items-start gap-3 rounded-xl border border-[rgb(240_208_112_/_0.25)] bg-[rgb(212_170_64_/_0.08)] px-4 py-3 text-sm text-[var(--cm-text-soft)]"
    >
      <Sparkles className="mt-0.5 shrink-0 text-[var(--cm-gold)]" size={17} />
      <span>
        <strong className="text-[var(--cm-gold-light)]">
          Coach OS preview.
        </strong>{" "}
        Sample records are fictional and mutations are disabled.
      </span>
    </div>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const colors =
    tone === "success"
      ? "border-[rgb(100_197_144_/_0.25)] bg-[rgb(100_197_144_/_0.08)] text-[var(--cm-positive)]"
      : tone === "warning"
        ? "border-[rgb(242_184_75_/_0.25)] bg-[rgb(242_184_75_/_0.08)] text-[var(--cm-warning)]"
        : tone === "danger"
          ? "border-[rgb(242_119_107_/_0.25)] bg-[rgb(242_119_107_/_0.08)] text-[var(--cm-danger)]"
          : "border-[var(--cm-border)] text-[var(--cm-text-soft)]";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${colors}`}
    >
      {children}
    </span>
  );
}

function Empty({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[rgb(212_170_64_/_0.1)] text-[var(--cm-gold)]">
        <Icon size={20} />
      </span>
      <h2 className="font-bold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--cm-text-muted)]">
        {description}
      </p>
    </div>
  );
}

function Overview({
  data,
  navigate,
}: {
  data: AdminPayload;
  navigate: (tab: TabId) => void;
}) {
  const stats = [
    ["Active clients", data.metrics.activeClients, Users, "clients" as TabId],
    ["Plans pending", data.metrics.pendingPlans, FileText, "programs" as TabId],
    [
      "Check-ins due",
      data.metrics.dueCheckIns,
      ClipboardCheck,
      "checkins" as TabId,
    ],
    [
      "Unread messages",
      data.metrics.unreadMessages,
      MessageCircle,
      "messages" as TabId,
    ],
  ] as const;
  return (
    <>
      <Header
        kicker="Coach operations"
        title={`Good morning, ${data.coach.firstName}`}
        description="Start with the work that needs a decision, then move to the rest of the roster."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, Icon, tab]) => (
          <button
            key={label}
            onClick={() => navigate(tab)}
            className="rounded-[var(--cm-radius-lg)] border border-[var(--cm-border)] bg-[var(--cm-surface)] p-5 text-left transition hover:border-[var(--cm-border-strong)]"
          >
            <div className="flex items-center justify-between text-xs text-[var(--cm-text-muted)]">
              <span>{label}</span>
              <Icon size={17} className="text-[var(--cm-gold)]" />
            </div>
            <p className="mt-4 text-3xl font-extrabold">{value}</p>
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--cm-border)] p-5">
            <h2 className="font-bold">Needs attention</h2>
            <BellRing size={18} className="text-[var(--cm-warning)]" />
          </div>
          <div className="divide-y divide-[var(--cm-border)]">
            {[
              {
                label: `${data.checkIns.filter(item => !item.reviewed).length} check-ins waiting for review`,
                tab: "checkins" as TabId,
                tone: "warning" as const,
              },
              {
                label: `${data.metrics.pendingPlans} client plans waiting to publish`,
                tab: "programs" as TabId,
                tone: "neutral" as const,
              },
              {
                label: `${data.metrics.unreadMessages} unread client messages`,
                tab: "messages" as TabId,
                tone: "danger" as const,
              },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => navigate(item.tab)}
                className="flex min-h-16 w-full items-center justify-between gap-4 px-5 text-left text-sm font-bold hover:bg-[var(--cm-surface-raised)]"
              >
                <span>{item.label}</span>
                <Badge tone={item.tone}>Review</Badge>
              </button>
            ))}
          </div>
        </Panel>
        <Panel className="p-5">
          <p className="cm-kicker">Monthly revenue</p>
          <p className="mt-4 text-4xl font-extrabold text-[var(--cm-gold-light)]">
            {data.metrics.monthlyRevenue == null
              ? "Not connected"
              : new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(data.metrics.monthlyRevenue)}
          </p>
          <p className="mt-3 text-sm text-[var(--cm-text-muted)]">
            Captured Stripe payments this month. Refunds and disputes remain
            visible in Stripe.
          </p>
          <button
            onClick={() => navigate("payments")}
            className="mt-5 min-h-11 text-sm font-bold text-[var(--cm-gold)]"
          >
            Open payments →
          </button>
        </Panel>
      </div>
    </>
  );
}

function ClientsPage({ data }: { data: AdminPayload }) {
  const [query, setQuery] = useState("");
  const filtered = data.clients.filter(client =>
    `${client.name} ${client.email} ${client.goal}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );
  return (
    <>
      <Header
        kicker="Roster"
        title="Clients"
        description="Search every active and pending coaching relationship."
        action={
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Search clients</span>
            <Search
              className="pointer-events-none absolute left-3 top-3.5 text-[var(--cm-text-muted)]"
              size={17}
            />
            <input
              className="cm-input pl-10 pr-3"
              placeholder="Search clients…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </label>
        }
      />
      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-[var(--cm-surface-raised)] text-xs uppercase tracking-wider text-[var(--cm-text-muted)]">
              <tr>
                {[
                  "Client",
                  "Goal",
                  "Status",
                  "Program",
                  "Adherence",
                  "Last active",
                ].map(head => (
                  <th className="px-5 py-4 font-bold" key={head}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cm-border)]">
              {filtered.map(client => (
                <tr
                  key={client.id}
                  className="hover:bg-[rgb(255_255_255_/_0.015)]"
                >
                  <td className="px-5 py-4">
                    <strong className="block">{client.name}</strong>
                    <span className="mt-1 block text-xs text-[var(--cm-text-muted)]">
                      {client.email}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[var(--cm-text-soft)]">
                    {client.goal}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      tone={client.status === "active" ? "success" : "warning"}
                    >
                      {client.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    Week {client.weekNumber}/{client.totalWeeks}
                  </td>
                  <td className="px-5 py-4 font-bold">
                    {client.adherence == null ? "—" : `${client.adherence}%`}
                  </td>
                  <td className="px-5 py-4 text-[var(--cm-text-muted)]">
                    {client.lastActive ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <Empty
            icon={Users}
            title="No matching clients"
            description="Try a different name, email, or goal."
          />
        )}
      </Panel>
    </>
  );
}

function CheckInsPage({ data }: { data: AdminPayload }) {
  return (
    <>
      <Header
        kicker="Review queue"
        title="Check-ins"
        description="Prioritize low energy, low adherence, and unreviewed submissions."
      />
      <div className="grid gap-3 lg:grid-cols-2">
        {data.checkIns.length ? (
          data.checkIns.map(item => (
            <Panel key={item.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold">{item.clientName}</h2>
                  <p className="mt-1 text-xs text-[var(--cm-text-muted)]">
                    {new Date(item.submittedAt).toLocaleString()}
                  </p>
                </div>
                <Badge tone={item.reviewed ? "success" : "warning"}>
                  {item.reviewed ? "Reviewed" : "Needs review"}
                </Badge>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[var(--cm-surface-raised)] p-4">
                  <p className="text-xs text-[var(--cm-text-muted)]">
                    Adherence
                  </p>
                  <strong className="mt-1 block text-2xl">
                    {item.adherence}%
                  </strong>
                </div>
                <div className="rounded-xl bg-[var(--cm-surface-raised)] p-4">
                  <p className="text-xs text-[var(--cm-text-muted)]">Energy</p>
                  <strong className="mt-1 block text-2xl">
                    {item.energy}/5
                  </strong>
                </div>
              </div>
            </Panel>
          ))
        ) : (
          <Panel className="lg:col-span-2">
            <Empty
              icon={CheckCircle2}
              title="Review queue is clear"
              description="New client check-ins will appear here."
            />
          </Panel>
        )}
      </div>
    </>
  );
}

function ProgramsPage({ data }: { data: AdminPayload }) {
  const [clientId, setClientId] = useState(data.clients[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [weeks, setWeeks] = useState(12);
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (data.preview) {
      toast.info("Preview only — this program was not published.");
      return;
    }
    setSaving(true);
    try {
      await api.adminAction({
        kind: "publish-program",
        clientId,
        title,
        summary,
        weeks,
      });
      toast.success("Program published to the client dashboard.");
      setTitle("");
      setSummary("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Program could not be published."
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <Header
        kicker="Coaching delivery"
        title="Programs"
        description="Draft deliberately, then publish one client-specific source of truth."
      />
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel className="overflow-hidden">
          <div className="border-b border-[var(--cm-border)] p-5">
            <h2 className="font-bold">Current programs</h2>
          </div>
          {data.programs.length ? (
            <div className="divide-y divide-[var(--cm-border)]">
              {data.programs.map(program => (
                <div className="p-5" key={program.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <strong>{program.clientName}</strong>
                      <p className="mt-1 text-sm text-[var(--cm-text-soft)]">
                        {program.title}
                      </p>
                      <p className="mt-2 text-xs text-[var(--cm-text-muted)]">
                        Updated{" "}
                        {new Date(program.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      tone={program.status === "active" ? "success" : "warning"}
                    >
                      {program.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              icon={FileText}
              title="No programs yet"
              description="Publish a client's first program from the builder."
            />
          )}
        </Panel>
        <Panel className="p-5 sm:p-6">
          <h2 className="text-xl font-extrabold">Publish a program</h2>
          <p className="mt-2 text-sm text-[var(--cm-text-muted)]">
            AI may assist drafting later, but a coach must review and publish
            every plan.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-bold">
              Client
              <select
                className="cm-input mt-2 px-3"
                required
                value={clientId}
                onChange={e => setClientId(e.target.value)}
              >
                {data.clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <label className="block text-sm font-bold">
                Program title
                <input
                  className="cm-input mt-2 px-3"
                  required
                  maxLength={160}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </label>
              <label className="block text-sm font-bold">
                Weeks
                <input
                  className="cm-input mt-2 px-3"
                  type="number"
                  min="1"
                  max="52"
                  required
                  value={weeks}
                  onChange={e => setWeeks(Number(e.target.value))}
                />
              </label>
            </div>
            <label className="block text-sm font-bold">
              Coach summary
              <textarea
                className="cm-input mt-2 min-h-36 p-3"
                required
                maxLength={5000}
                value={summary}
                onChange={e => setSummary(e.target.value)}
              />
            </label>
            <button
              className="cm-button-primary w-full px-5 py-3 sm:w-auto"
              disabled={saving}
            >
              {saving ? "Publishing…" : "Review and publish"}
            </button>
          </form>
        </Panel>
      </div>
    </>
  );
}

function MessagesPage({ data }: { data: AdminPayload }) {
  const [clientId, setClientId] = useState(data.clients[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (data.preview) {
      toast.info("Preview only — this message was not sent.");
      return;
    }
    setSaving(true);
    try {
      await api.adminAction({ kind: "send-message", clientId, body });
      setBody("");
      toast.success("Message sent.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Message could not be sent."
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <Header
        kicker="Client communication"
        title="Messages"
        description="Keep coaching communication private, attributable, and attached to the correct client."
      />
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel className="overflow-hidden">
          {data.messages.length ? (
            <div className="divide-y divide-[var(--cm-border)]">
              {data.messages.map(message => (
                <article className="p-5" key={message.id}>
                  <div className="flex items-center justify-between">
                    <strong>{message.clientName}</strong>
                    {!message.read && (
                      <span
                        className="h-2 w-2 rounded-full bg-[var(--cm-gold)]"
                        aria-label="Unread"
                      />
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--cm-text-soft)]">
                    {message.body}
                  </p>
                  <time className="mt-2 block text-xs text-[var(--cm-text-muted)]">
                    {new Date(message.sentAt).toLocaleString()}
                  </time>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              icon={MessageCircle}
              title="Inbox is clear"
              description="New client messages will appear here."
            />
          )}
        </Panel>
        <Panel className="p-5 sm:p-6">
          <h2 className="text-xl font-extrabold">Send a message</h2>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block text-sm font-bold">
              Client
              <select
                required
                className="cm-input mt-2 px-3"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
              >
                {data.clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold">
              Message
              <textarea
                required
                maxLength={5000}
                className="cm-input mt-2 min-h-40 p-3"
                value={body}
                onChange={e => setBody(e.target.value)}
              />
            </label>
            <button
              className="cm-button-primary inline-flex items-center gap-2 px-5 py-3"
              disabled={saving}
            >
              <Send size={16} /> {saving ? "Sending…" : "Send message"}
            </button>
          </form>
        </Panel>
      </div>
    </>
  );
}

function LeadsPage({ data }: { data: AdminPayload }) {
  const change = async (
    leadId: string,
    status: "new" | "contacted" | "qualified" | "won" | "lost"
  ) => {
    if (data.preview) {
      toast.info("Preview only — lead status was not changed.");
      return;
    }
    try {
      await api.adminAction({ kind: "update-lead", leadId, status });
      toast.success("Lead status updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Lead could not be updated."
      );
    }
  };
  return (
    <>
      <Header
        kicker="Pipeline"
        title="Leads"
        description="Applications and quiz leads enter one traceable pipeline."
      />
      <Panel className="overflow-hidden">
        {data.leads.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-[var(--cm-surface-raised)] text-xs uppercase tracking-wider text-[var(--cm-text-muted)]">
                <tr>
                  {["Lead", "Source", "Created", "Status"].map(head => (
                    <th className="px-5 py-4" key={head}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cm-border)]">
                {data.leads.map(lead => (
                  <tr key={lead.id}>
                    <td className="px-5 py-4">
                      <strong>{lead.name}</strong>
                      <span className="mt-1 block text-xs text-[var(--cm-text-muted)]">
                        {lead.email}
                      </span>
                    </td>
                    <td className="px-5 py-4">{lead.source}</td>
                    <td className="px-5 py-4 text-[var(--cm-text-muted)]">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        aria-label={`Status for ${lead.name}`}
                        className="cm-input max-w-40 px-3"
                        value={lead.status}
                        onChange={e =>
                          void change(
                            lead.id,
                            e.target.value as
                              "new" | "contacted" | "qualified" | "won" | "lost"
                          )
                        }
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon={UserPlus}
            title="No leads yet"
            description="Verified application submissions will appear here."
          />
        )}
      </Panel>
    </>
  );
}

function PaymentsPage({ data }: { data: AdminPayload }) {
  return (
    <>
      <Header
        kicker="Revenue"
        title="Payments"
        description="Read-only payment status from Stripe. Refunds and disputes are managed in Stripe."
      />
      <Panel className="overflow-hidden">
        {data.payments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[var(--cm-surface-raised)] text-xs uppercase tracking-wider text-[var(--cm-text-muted)]">
                <tr>
                  {["Client", "Amount", "Status", "Date"].map(head => (
                    <th className="px-5 py-4" key={head}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cm-border)]">
                {data.payments.map(payment => (
                  <tr key={payment.id}>
                    <td className="px-5 py-4 font-bold">
                      {payment.clientName}
                    </td>
                    <td className="px-5 py-4">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: payment.currency,
                      }).format(payment.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        tone={payment.status === "paid" ? "success" : "warning"}
                      >
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-[var(--cm-text-muted)]">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon={CreditCard}
            title="Stripe is not returning payments"
            description="Confirm the webhook and secret key before relying on revenue reporting."
          />
        )}
      </Panel>
    </>
  );
}

function SystemPage({
  tab,
  data,
}: {
  tab: "calendar" | "library" | "automations" | "analytics" | "settings";
  data: AdminPayload;
}) {
  const map = {
    calendar: {
      icon: CalendarDays,
      kicker: "Schedule",
      title: "Calendar",
      description: "Kickoff calls and check-in deadlines belong here.",
      empty:
        "Connect the approved calendar provider before scheduling from Coach OS.",
    },
    library: {
      icon: BookOpen,
      kicker: "Resources",
      title: "Library",
      description: "Reusable training and nutrition resources.",
      empty:
        "Create resources only after storage and access policies are configured.",
    },
    automations: {
      icon: Bot,
      kicker: "Workflow",
      title: "Automations",
      description: "Event-driven follow-ups with visible status and ownership.",
      empty:
        "Automations remain off until email, webhook retries, and consent rules are configured.",
    },
    analytics: {
      icon: Activity,
      kicker: "Performance",
      title: "Analytics",
      description: "Operational trends from real client and payment data.",
      empty:
        "Analytics will populate after the canonical Supabase project and Stripe webhook are active.",
    },
    settings: {
      icon: Settings,
      kicker: "System",
      title: "Settings",
      description: "Security, integrations, and account controls.",
      empty:
        "Production secrets are managed in Netlify environment variables and are never displayed here.",
    },
  } as const;
  const item = map[tab];
  return (
    <>
      <Header
        kicker={item.kicker}
        title={item.title}
        description={item.description}
      />
      <Panel className="max-w-3xl">
        <Empty
          icon={item.icon}
          title={data.preview ? "Preview state" : "Configuration required"}
          description={item.empty}
        />
        {tab === "settings" && (
          <div className="border-t border-[var(--cm-border)] p-5">
            <button
              onClick={() => void signOut()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--cm-border)] px-4 text-sm font-bold text-[var(--cm-text-soft)]"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        )}
      </Panel>
    </>
  );
}

function CoachOS() {
  const [active, setActive] = useState<TabId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<AdminPayload | null>(
    isLocalPreview ? previewData : null
  );
  const [error, setError] = useState("");
  useEffect(() => {
    if (isLocalPreview) return;
    void api
      .getAdmin()
      .then(setData)
      .catch(cause =>
        setError(
          cause instanceof ApiError
            ? cause.message
            : "Coach OS could not be loaded."
        )
      );
  }, []);
  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [sidebarOpen]);
  const activeLabel = useMemo(
    () =>
      navGroups.flatMap(group => group.items).find(item => item.id === active)
        ?.label ?? "Overview",
    [active]
  );
  const navigate = (tab: TabId) => {
    setActive(tab);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  if (error)
    return (
      <main
        id="main-content"
        className="flex min-h-screen items-center justify-center p-4"
      >
        <Panel className="max-w-md p-7 text-center">
          <h1 className="text-2xl font-extrabold">Coach OS unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--cm-text-muted)]">
            {error}
          </p>
          <button
            className="cm-button-primary mt-6 px-5 py-3"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </Panel>
      </main>
    );
  if (!data)
    return (
      <main
        id="main-content"
        className="flex min-h-screen items-center justify-center text-sm text-[var(--cm-text-muted)]"
      >
        Loading Coach OS…
      </main>
    );
  const nav = navGroups.map(group => (
    <div key={group.label}>
      <p className="mb-2 mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cm-text-muted)] first:mt-0">
        {group.label}
      </p>
      {group.items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => navigate(id)}
          className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 text-left text-sm font-bold transition ${active === id ? "border-[rgb(212_170_64_/_0.24)] bg-[rgb(212_170_64_/_0.1)] text-[var(--cm-gold-light)]" : "border-transparent text-[var(--cm-text-muted)] hover:bg-[var(--cm-surface-raised)] hover:text-[var(--cm-text)]"}`}
          aria-current={active === id ? "page" : undefined}
        >
          <Icon size={18} />
          {label}
          {id === "messages" && data.metrics.unreadMessages > 0 && (
            <span className="ml-auto rounded-full bg-[var(--cm-gold)] px-1.5 py-0.5 text-[10px] text-[var(--cm-bg)]">
              {data.metrics.unreadMessages}
            </span>
          )}
        </button>
      ))}
    </div>
  ));
  const content =
    active === "overview" ? (
      <Overview data={data} navigate={navigate} />
    ) : active === "clients" ? (
      <ClientsPage data={data} />
    ) : active === "checkins" ? (
      <CheckInsPage data={data} />
    ) : active === "programs" ? (
      <ProgramsPage data={data} />
    ) : active === "messages" ? (
      <MessagesPage data={data} />
    ) : active === "leads" ? (
      <LeadsPage data={data} />
    ) : active === "payments" ? (
      <PaymentsPage data={data} />
    ) : (
      <SystemPage
        tab={
          active as
            "calendar" | "library" | "automations" | "analytics" | "settings"
        }
        data={data}
      />
    );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-[var(--cm-border)] bg-[var(--cm-surface)] lg:flex">
        <div className="border-b border-[var(--cm-border)] p-5">
          <BrandLockup context="Coach OS" />
        </div>
        <div className="border-b border-[var(--cm-border)] px-5 py-4">
          <p className="text-xs text-[var(--cm-text-muted)]">Workspace</p>
          <p className="mt-1 text-sm font-bold">
            Owner · {data.coach.firstName}
          </p>
        </div>
        <nav aria-label="Coach OS" className="flex-1 overflow-y-auto p-3">
          {nav}
        </nav>
      </aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/75"
            onClick={() => setSidebarOpen(false)}
            aria-label="Dismiss navigation"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Coach OS navigation"
            className="relative flex h-full w-[min(86vw,320px)] flex-col border-r border-[var(--cm-border)] bg-[var(--cm-surface)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--cm-border)] p-4">
              <BrandLockup context="Coach OS" />
              <button
                autoFocus
                className="flex h-11 w-11 items-center justify-center"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close navigation"
              >
                <X />
              </button>
            </div>
            <nav className="overflow-y-auto p-3">{nav}</nav>
          </aside>
        </div>
      )}
      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[var(--cm-border)] bg-[rgb(5_5_7_/_0.9)] px-4 backdrop-blur lg:hidden">
          <button
            className="flex h-11 w-11 items-center justify-center"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </button>
          <strong className="text-sm">{activeLabel}</strong>
        </header>
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          {data.preview && <PreviewNotice />}
          {content}
        </main>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AccessGate area="admin">
      <CoachOS />
    </AccessGate>
  );
}
