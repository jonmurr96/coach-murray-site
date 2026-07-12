import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  BarChart3,
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import type {
  AdminClientDetailPayload,
  AdminLibraryPayload,
  AdminPayload,
} from "@shared/contracts";
import { AccessGate } from "@/components/AccessGate";
import { BrandLockup } from "@/components/Brand";
import { api, ApiError } from "@/lib/api";
import { signOut } from "@/lib/auth";
import { isLocalPreview } from "@/lib/config";

type TabId =
  | "overview"
  | "clients"
  | "checkins"
  | "programs"
  | "messages"
  | "leads"
  | "payments"
  | "library"
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
      { id: "settings", label: "Account & Security", icon: Settings },
    ],
  },
];

const previewLibrary: AdminLibraryPayload = {
  resources: [
    {
      id: "00000000-0000-4000-8000-000000000041",
      title: "5-Day Cutting Blueprint",
      kind: "guide",
      url: "/5-day-cutting-blueprint.pdf",
      updatedAt: "2026-07-10T15:00:00.000Z",
      assignedClientIds: ["00000000-0000-0000-0000-000000000011"],
    },
    {
      id: "00000000-0000-4000-8000-000000000042",
      title: "How to Film a Form Check",
      kind: "video",
      url: "https://example.com/form-check",
      updatedAt: "2026-07-10T16:00:00.000Z",
      assignedClientIds: [
        "00000000-0000-0000-0000-000000000011",
        "00000000-0000-0000-0000-000000000012",
      ],
    },
  ],
  clients: [
    {
      id: "00000000-0000-0000-0000-000000000011",
      name: "Preview Client A",
      status: "active",
    },
    {
      id: "00000000-0000-0000-0000-000000000012",
      name: "Preview Client B",
      status: "check-in due",
    },
    {
      id: "00000000-0000-0000-0000-000000000013",
      name: "Preview Client C",
      status: "plan pending",
    },
  ],
};

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
      weight: 158,
      wins: "Completed every planned session and improved sleep consistency.",
      challenges: "Late meetings made meal timing difficult twice.",
      reviewed: false,
    },
    {
      id: "ci2",
      clientId: "00000000-0000-0000-0000-000000000012",
      clientName: "Preview Client B",
      submittedAt: "2026-07-07T14:00:00.000Z",
      adherence: 61,
      energy: 2,
      weight: 202.5,
      wins: "Kept daily walks in place during a difficult work week.",
      challenges: "Low energy and missed two training sessions.",
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

type AdminClient = AdminPayload["clients"][number];
type ClientReviewState = {
  client: AdminClient;
  detail: AdminClientDetailPayload | null;
  loading: boolean;
  error: string;
};

function previewClientDetail(client: AdminClient): AdminClientDetailPayload {
  return {
    profile: {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: "(555) 010-2026",
      status: client.status,
    },
    accountSetup: {
      completed: client.weekNumber > 0,
      ...(client.weekNumber === 0
        ? { invitedAt: "2026-07-10T13:00:00.000Z" }
        : {}),
    },
    purchase: {
      packageName: "Preview 12-Week Coaching",
      purchasedAt: "2026-06-12T15:30:00.000Z",
    },
    intake: {
      submittedAt: "2026-06-12T16:05:00.000Z",
      termsAcceptedAt: "2026-06-12T16:04:00.000Z",
      termsVersion: "2026-07-10",
      signatureOnFile: true,
      sections: [
        {
          title: "Starting point",
          items: [
            { label: "Current weight", value: "185 lb" },
            { label: "Goal weight", value: "172 lb" },
            { label: "Training experience", value: "Intermediate" },
          ],
        },
        {
          title: "Training preferences",
          items: [
            { label: "Training days available", value: "4 days per week" },
            { label: "Preferred session length", value: "60 minutes" },
            {
              label: "Equipment access",
              value: "Full commercial gym",
            },
            {
              label: "Movement restrictions",
              value: "No current restrictions reported",
            },
          ],
        },
        {
          title: "Nutrition",
          items: [
            { label: "Meals per day", value: "3 meals and 1 snack" },
            {
              label: "Nutrition challenges",
              value: "Consistency during work travel",
            },
            { label: "Daily water intake", value: "About 80 oz" },
          ],
        },
        {
          title: "Goals and coaching",
          items: [
            { label: "Primary goal", value: client.goal },
            { label: "Goal timeline", value: "12–16 weeks" },
            {
              label: "Preferred accountability",
              value: "Direct weekly feedback and measurable targets",
            },
          ],
        },
      ],
    },
  };
}

function formatAdminDate(value: string, includeTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime
      ? { hour: "numeric", minute: "2-digit", timeZoneName: "short" }
      : {}),
  }).format(date);
}

function ClientIntakeDialog({
  state,
  preview,
  onClose,
  onRetry,
}: {
  state: ClientReviewState;
  preview: boolean;
  onClose: () => void;
  onRetry: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const [resendingInvite, setResendingInvite] = useState(false);
  const [resentAt, setResentAt] = useState<string | null>(null);
  onCloseRef.current = onClose;

  useEffect(() => setResentAt(null), [state.client.id]);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      previouslyFocused?.focus();
    };
  }, []);

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const detail = state.detail;
  const invitedAt = resentAt ?? detail?.accountSetup.invitedAt ?? null;
  const invitedAtMs = invitedAt ? Date.parse(invitedAt) : Number.NaN;
  const resendAvailableAt = invitedAtMs + 15 * 60 * 1_000;
  const resendCoolingDown =
    Number.isFinite(resendAvailableAt) && resendAvailableAt > Date.now();
  const inviteEligible = Boolean(detail?.intake && detail.purchase);
  const resendInvite = async () => {
    if (!detail || detail.accountSetup.completed || !inviteEligible) return;
    if (preview) {
      toast.info("Preview only — no account setup email was sent.");
      return;
    }
    setResendingInvite(true);
    try {
      const result = await api.adminAction({
        kind: "resend-client-invite",
        clientId: detail.profile.id,
      });
      if (!result.invitedAt)
        throw new Error("The invitation was not confirmed by Coach OS.");
      setResentAt(result.invitedAt);
      toast.success("Account setup invitation sent.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The account setup invitation could not be sent."
      );
    } finally {
      setResendingInvite(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-5">
      <button
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-label="Close intake review"
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-intake-title"
        aria-describedby="client-intake-description"
        aria-busy={state.loading}
        onKeyDown={trapFocus}
        className="relative flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden border border-[var(--cm-border)] bg-[var(--cm-bg)] shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-[var(--cm-radius-lg)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--cm-border)] bg-[var(--cm-surface)] px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="cm-kicker">Secure intake review</p>
            <h2
              id="client-intake-title"
              className="mt-2 truncate text-xl font-extrabold sm:text-2xl"
            >
              {state.client.name}
            </h2>
            <p
              id="client-intake-description"
              className="mt-1 text-sm text-[var(--cm-text-muted)]"
            >
              Verified onboarding answers available to authorized coaching
              staff.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--cm-border)] text-[var(--cm-text-muted)] hover:text-[var(--cm-text)]"
            onClick={onClose}
            aria-label="Close intake review"
          >
            <X size={20} />
          </button>
        </header>

        <div className="overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {preview && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-[rgb(240_208_112_/_0.25)] bg-[rgb(212_170_64_/_0.08)] px-4 py-3 text-sm leading-6 text-[var(--cm-text-soft)]"
            >
              <strong className="text-[var(--cm-gold-light)]">
                Preview only.
              </strong>{" "}
              These answers are fictional. No API request was made and no data
              is saved from this review.
            </div>
          )}

          {state.loading && (
            <div
              role="status"
              className="flex min-h-64 items-center justify-center text-sm text-[var(--cm-text-muted)]"
            >
              Loading the verified intake…
            </div>
          )}

          {!state.loading && state.error && (
            <div
              role="alert"
              className="rounded-xl border border-[rgb(242_119_107_/_0.3)] bg-[rgb(242_119_107_/_0.08)] p-5"
            >
              <h3 className="font-bold text-[var(--cm-danger)]">
                Intake unavailable
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--cm-text-soft)]">
                {state.error}
              </p>
              <button
                className="mt-4 min-h-11 rounded-xl border border-[var(--cm-border-strong)] px-4 text-sm font-bold"
                onClick={onRetry}
              >
                Try again
              </button>
            </div>
          )}

          {!state.loading && detail && (
            <div className="space-y-5">
              <section className="rounded-xl border border-[var(--cm-border)] bg-[var(--cm-surface)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold">Client record</h3>
                  <Badge
                    tone={
                      detail.profile.status === "active" ? "success" : "warning"
                    }
                  >
                    {detail.profile.status}
                  </Badge>
                </div>
                <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-[var(--cm-text-muted)]">
                      Email
                    </dt>
                    <dd className="mt-1 break-all font-bold">
                      {detail.profile.email}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--cm-text-muted)]">
                      Phone
                    </dt>
                    <dd className="mt-1 font-bold">
                      {detail.profile.phone || "Not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--cm-text-muted)]">
                      Account setup
                    </dt>
                    <dd className="mt-1">
                      <Badge
                        tone={
                          detail.accountSetup.completed ? "success" : "warning"
                        }
                      >
                        {detail.accountSetup.completed ? "Complete" : "Pending"}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--cm-text-muted)]">
                      Last setup invitation
                    </dt>
                    <dd className="mt-1 font-bold">
                      {invitedAt
                        ? formatAdminDate(invitedAt, true)
                        : "Not recorded"}
                    </dd>
                  </div>
                </dl>
                {!detail.accountSetup.completed && (
                  <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[var(--cm-border)] bg-[var(--cm-surface-raised)] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold">
                        Client access is pending
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--cm-text-muted)]">
                        {!inviteEligible
                          ? "A verified onboarding intake and purchase are required before account access can be invited."
                          : resendCoolingDown
                            ? `Another setup email can be sent after ${formatAdminDate(new Date(resendAvailableAt).toISOString(), true)}.`
                            : "Send a fresh secure setup link to the client's verified email."}
                      </p>
                    </div>
                    <button
                      className="cm-button-primary min-h-11 shrink-0 px-4 py-2.5 text-sm"
                      disabled={
                        resendingInvite || resendCoolingDown || !inviteEligible
                      }
                      onClick={() => void resendInvite()}
                    >
                      {resendingInvite ? "Sending…" : "Resend setup email"}
                    </button>
                  </div>
                )}
              </section>

              <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-xl border border-[var(--cm-border)] bg-[var(--cm-surface)] p-5">
                  <h3 className="font-bold">Purchase</h3>
                  {detail.purchase ? (
                    <dl className="mt-4 space-y-3 text-sm">
                      <div>
                        <dt className="text-xs text-[var(--cm-text-muted)]">
                          Package
                        </dt>
                        <dd className="mt-1 font-bold">
                          {detail.purchase.packageName}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--cm-text-muted)]">
                          Purchased
                        </dt>
                        <dd className="mt-1">
                          {formatAdminDate(detail.purchase.purchasedAt, true)}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--cm-text-muted)]">
                      No linked purchase is available.
                    </p>
                  )}
                </section>

                <section className="rounded-xl border border-[var(--cm-border)] bg-[var(--cm-surface)] p-5">
                  <h3 className="font-bold">Agreement</h3>
                  {detail.intake ? (
                    <dl className="mt-4 space-y-3 text-sm">
                      <div>
                        <dt className="text-xs text-[var(--cm-text-muted)]">
                          Terms accepted
                        </dt>
                        <dd className="mt-1">
                          {formatAdminDate(detail.intake.termsAcceptedAt, true)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--cm-text-muted)]">
                          Terms version
                        </dt>
                        <dd className="mt-1 font-mono text-xs">
                          {detail.intake.termsVersion}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-xs text-[var(--cm-text-muted)]">
                          Digital signature
                        </dt>
                        <dd>
                          <Badge
                            tone={
                              detail.intake.signatureOnFile
                                ? "success"
                                : "warning"
                            }
                          >
                            {detail.intake.signatureOnFile
                              ? "On file"
                              : "Not on file"}
                          </Badge>
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--cm-text-muted)]">
                      No completed intake is on file.
                    </p>
                  )}
                </section>
              </div>

              {detail.intake && (
                <section>
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-extrabold">Intake answers</h3>
                      <p className="mt-1 text-xs text-[var(--cm-text-muted)]">
                        Submitted{" "}
                        {formatAdminDate(detail.intake.submittedAt, true)}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--cm-text-muted)]">
                      Read-only
                    </span>
                  </div>
                  {detail.intake.sections.length ? (
                    <div className="space-y-4">
                      {detail.intake.sections.map(section => (
                        <section
                          key={section.title}
                          className="rounded-xl border border-[var(--cm-border)] bg-[var(--cm-surface)] p-5"
                        >
                          <h4 className="font-bold text-[var(--cm-gold-light)]">
                            {section.title}
                          </h4>
                          <dl className="mt-4 divide-y divide-[var(--cm-border)]">
                            {section.items.map(item => (
                              <div
                                key={item.label}
                                className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(160px,0.35fr)_1fr] sm:gap-5"
                              >
                                <dt className="text-xs font-bold text-[var(--cm-text-muted)]">
                                  {item.label}
                                </dt>
                                <dd className="whitespace-pre-wrap text-sm leading-6 text-[var(--cm-text-soft)]">
                                  {item.value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </section>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-[var(--cm-border)] bg-[var(--cm-surface)] p-5 text-sm text-[var(--cm-text-muted)]">
                      The intake contains no reviewable answers.
                    </p>
                  )}
                </section>
              )}
            </div>
          )}
        </div>

        <footer className="flex justify-end border-t border-[var(--cm-border)] bg-[var(--cm-surface)] px-4 py-3 sm:px-6">
          <button
            className="min-h-11 rounded-xl border border-[var(--cm-border-strong)] px-5 text-sm font-bold"
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

function ClientsPage({ data }: { data: AdminPayload }) {
  const [query, setQuery] = useState("");
  const [review, setReview] = useState<ClientReviewState | null>(null);
  const filtered = data.clients.filter(client =>
    `${client.name} ${client.email} ${client.goal}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const openReview = (client: AdminClient) => {
    if (data.preview) {
      setReview({
        client,
        detail: previewClientDetail(client),
        loading: false,
        error: "",
      });
      return;
    }

    setReview({ client, detail: null, loading: true, error: "" });
    void api
      .getAdminClientDetail(client.id)
      .then(detail =>
        setReview(current =>
          current?.client.id === client.id
            ? { ...current, detail, loading: false }
            : current
        )
      )
      .catch(cause =>
        setReview(current =>
          current?.client.id === client.id
            ? {
                ...current,
                loading: false,
                error:
                  cause instanceof ApiError
                    ? cause.message
                    : "The verified intake could not be loaded.",
              }
            : current
        )
      );
  };

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
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead className="bg-[var(--cm-surface-raised)] text-xs uppercase tracking-wider text-[var(--cm-text-muted)]">
              <tr>
                {[
                  "Client",
                  "Goal",
                  "Status",
                  "Program",
                  "Adherence",
                  "Last active",
                  "Intake",
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
                  <td className="px-5 py-4">
                    <button
                      className="min-h-11 rounded-xl border border-[var(--cm-border-strong)] px-4 text-sm font-bold text-[var(--cm-gold-light)] hover:bg-[var(--cm-surface-raised)]"
                      onClick={() => openReview(client)}
                      aria-label={`Review intake for ${client.name}`}
                    >
                      Review intake
                    </button>
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
      {review && (
        <ClientIntakeDialog
          state={review}
          preview={data.preview}
          onClose={() => setReview(null)}
          onRetry={() => openReview(review.client)}
        />
      )}
    </>
  );
}

function CheckInsPage({
  data,
  onSaved,
}: {
  data: AdminPayload;
  onSaved: () => Promise<void>;
}) {
  const [reviewingId, setReviewingId] = useState("");
  const markReviewed = async (checkInId: string) => {
    if (data.preview) {
      toast.info("Preview only — this check-in was not marked reviewed.");
      return;
    }
    setReviewingId(checkInId);
    try {
      await api.adminAction({ kind: "review-check-in", checkInId });
      toast.success("Check-in marked reviewed.");
      try {
        await onSaved();
      } catch {
        toast.warning("Review was saved, but the queue could not refresh.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Check-in review could not be saved."
      );
    } finally {
      setReviewingId("");
    }
  };
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
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                <div className="col-span-2 rounded-xl bg-[var(--cm-surface-raised)] p-4 sm:col-span-1">
                  <p className="text-xs text-[var(--cm-text-muted)]">Weight</p>
                  <strong className="mt-1 block text-2xl">
                    {item.weight == null ? "—" : `${item.weight} lb`}
                  </strong>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--cm-border)] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--cm-positive)]">
                    Wins
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--cm-text-soft)]">
                    {item.wins || "Not provided"}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--cm-border)] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--cm-warning)]">
                    Challenges
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--cm-text-soft)]">
                    {item.challenges || "Not provided"}
                  </p>
                </div>
              </div>
              {!item.reviewed && (
                <button
                  className="cm-button-primary mt-4 px-4 py-3"
                  disabled={reviewingId === item.id}
                  onClick={() => void markReviewed(item.id)}
                >
                  {reviewingId === item.id ? "Saving review…" : "Mark reviewed"}
                </button>
              )}
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

type WorkoutDraft = {
  id: string;
  title: string;
  day: string;
  durationMinutes: number;
  notes: string;
};

let workoutDraftSequence = 0;
function createWorkoutDraft(): WorkoutDraft {
  return {
    id: `workout-draft-${(workoutDraftSequence += 1)}`,
    title: "",
    day: "Monday",
    durationMinutes: 45,
    notes: "",
  };
}

function ProgramsPage({
  data,
  onSaved,
}: {
  data: AdminPayload;
  onSaved: () => Promise<void>;
}) {
  const [clientId, setClientId] = useState(data.clients[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [weeks, setWeeks] = useState(12);
  const [workouts, setWorkouts] = useState<WorkoutDraft[]>([
    createWorkoutDraft(),
  ]);
  const [nutritionEnabled, setNutritionEnabled] = useState(false);
  const [nutrition, setNutrition] = useState({
    calories: 2000,
    protein: 160,
    carbs: 210,
    fat: 60,
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const updateWorkout = (
    id: string,
    field: Exclude<keyof WorkoutDraft, "id">,
    value: string | number
  ) =>
    setWorkouts(current =>
      current.map(workout =>
        workout.id === id ? { ...workout, [field]: value } : workout
      )
    );
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!workouts.length && !nutritionEnabled) {
      toast.error("Add at least one workout or a nutrition plan.");
      return;
    }
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
        workouts: workouts.map(({ id: _id, ...workout }) => workout),
        nutrition: nutritionEnabled ? nutrition : null,
      });
      toast.success("Program published to the client dashboard.");
      setTitle("");
      setSummary("");
      setWorkouts([createWorkoutDraft()]);
      setNutritionEnabled(false);
      try {
        await onSaved();
      } catch {
        toast.warning("Program was published, but Coach OS could not refresh.");
      }
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
      <div className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
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
          <h2 className="text-xl font-extrabold">Program builder</h2>
          <p className="mt-2 text-sm text-[var(--cm-text-muted)]">
            Review the overview, assigned workouts, and nutrition targets before
            publishing. Publishing archives the client's prior active plan.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-6">
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
            <section className="rounded-xl border border-[var(--cm-border)] bg-[var(--cm-surface-raised)] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold">Assigned workouts</h3>
                  <p className="mt-1 text-xs text-[var(--cm-text-muted)]">
                    These appear in this order in the client portal.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--cm-border-strong)] px-4 text-sm font-bold"
                  onClick={() =>
                    setWorkouts(current => [...current, createWorkoutDraft()])
                  }
                >
                  <Plus size={16} /> Add workout
                </button>
              </div>
              {workouts.length ? (
                <div className="mt-4 space-y-4">
                  {workouts.map((workout, index) => (
                    <fieldset
                      key={workout.id}
                      className="rounded-xl border border-[var(--cm-border)] bg-[var(--cm-surface)] p-4"
                    >
                      <legend className="px-2 text-xs font-bold uppercase tracking-wider text-[var(--cm-gold)]">
                        Workout {index + 1}
                      </legend>
                      <div className="grid gap-3 sm:grid-cols-[0.7fr_1.3fr_110px]">
                        <label className="text-sm font-bold">
                          Day or schedule
                          <input
                            className="cm-input mt-2 px-3"
                            required
                            maxLength={80}
                            value={workout.day}
                            onChange={event =>
                              updateWorkout(
                                workout.id,
                                "day",
                                event.target.value
                              )
                            }
                          />
                        </label>
                        <label className="text-sm font-bold">
                          Workout title
                          <input
                            className="cm-input mt-2 px-3"
                            required
                            maxLength={160}
                            value={workout.title}
                            onChange={event =>
                              updateWorkout(
                                workout.id,
                                "title",
                                event.target.value
                              )
                            }
                          />
                        </label>
                        <label className="text-sm font-bold">
                          Minutes
                          <input
                            className="cm-input mt-2 px-3"
                            type="number"
                            min="0"
                            max="600"
                            required
                            value={workout.durationMinutes}
                            onChange={event =>
                              updateWorkout(
                                workout.id,
                                "durationMinutes",
                                Number(event.target.value)
                              )
                            }
                          />
                        </label>
                      </div>
                      <label className="mt-3 block text-sm font-bold">
                        Exercise prescription and coach notes
                        <textarea
                          className="cm-input mt-2 min-h-28 p-3"
                          maxLength={2000}
                          placeholder="Example: Back squat — 4 × 6 @ RPE 7. Control the three-second eccentric."
                          value={workout.notes}
                          onChange={event =>
                            updateWorkout(
                              workout.id,
                              "notes",
                              event.target.value
                            )
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--cm-border)] px-4 text-sm font-bold text-[var(--cm-danger)]"
                        onClick={() =>
                          setWorkouts(current =>
                            current.filter(item => item.id !== workout.id)
                          )
                        }
                      >
                        <Trash2 size={16} /> Remove workout
                      </button>
                    </fieldset>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-[var(--cm-border)] p-4 text-sm text-[var(--cm-text-muted)]">
                  No workouts selected. Enable nutrition below to publish a
                  nutrition-only plan.
                </p>
              )}
            </section>
            <section className="rounded-xl border border-[var(--cm-border)] bg-[var(--cm-surface-raised)] p-4 sm:p-5">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 font-extrabold">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[var(--cm-gold)]"
                  checked={nutritionEnabled}
                  onChange={event => setNutritionEnabled(event.target.checked)}
                />
                Publish nutrition targets with this plan
              </label>
              {nutritionEnabled && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {(
                      [
                        ["calories", "Calories", 500, 10000],
                        ["protein", "Protein (g)", 0, 1000],
                        ["carbs", "Carbs (g)", 0, 2000],
                        ["fat", "Fat (g)", 0, 1000],
                      ] as const
                    ).map(([key, label, min, max]) => (
                      <label className="text-sm font-bold" key={key}>
                        {label}
                        <input
                          className="cm-input mt-2 px-3"
                          type="number"
                          min={min}
                          max={max}
                          required
                          value={nutrition[key]}
                          onChange={event =>
                            setNutrition(current => ({
                              ...current,
                              [key]: Number(event.target.value),
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <label className="block text-sm font-bold">
                    Nutrition guidance
                    <textarea
                      className="cm-input mt-2 min-h-28 p-3"
                      maxLength={5000}
                      placeholder="Meal structure, timing, food substitutions, hydration, and adjustment notes."
                      value={nutrition.notes}
                      onChange={event =>
                        setNutrition(current => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              )}
            </section>
            <button
              className="cm-button-primary w-full px-5 py-3 sm:w-auto"
              disabled={saving || !clientId}
            >
              {saving ? "Publishing…" : "Publish plan to client"}
            </button>
          </form>
        </Panel>
      </div>
    </>
  );
}

function MessagesPage({
  data,
  onSaved,
}: {
  data: AdminPayload;
  onSaved: () => Promise<void>;
}) {
  const [clientId, setClientId] = useState(data.clients[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const acknowledgedInbox = useRef(false);
  useEffect(() => {
    if (
      data.preview ||
      data.metrics.unreadMessages === 0 ||
      acknowledgedInbox.current
    )
      return;
    acknowledgedInbox.current = true;
    void api
      .adminAction({ kind: "mark-inbox-read" })
      .then(async () => {
        try {
          await onSaved();
        } catch {
          toast.warning(
            "Inbox was marked read, but Coach OS could not refresh."
          );
        }
      })
      .catch(error => {
        acknowledgedInbox.current = false;
        toast.error(
          error instanceof Error
            ? error.message
            : "Inbox read status could not be saved."
        );
      });
  }, [data.metrics.unreadMessages, data.preview, onSaved]);
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
      try {
        await onSaved();
      } catch {
        toast.warning("Message was sent, but Coach OS could not refresh.");
      }
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

function LeadsPage({
  data,
  onSaved,
}: {
  data: AdminPayload;
  onSaved: () => Promise<void>;
}) {
  const [updatingId, setUpdatingId] = useState("");
  const change = async (
    leadId: string,
    status: "new" | "contacted" | "qualified" | "won" | "lost"
  ) => {
    if (data.preview) {
      toast.info("Preview only — lead status was not changed.");
      return;
    }
    setUpdatingId(leadId);
    try {
      await api.adminAction({ kind: "update-lead", leadId, status });
      toast.success("Lead status updated.");
      try {
        await onSaved();
      } catch {
        toast.warning("Lead was updated, but the pipeline could not refresh.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Lead could not be updated."
      );
    } finally {
      setUpdatingId("");
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
                        disabled={updatingId === lead.id}
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

function AnalyticsPage({ data }: { data: AdminPayload }) {
  const adherenceValues = data.clients.flatMap(client =>
    client.adherence == null ? [] : [client.adherence]
  );
  const averageAdherence = adherenceValues.length
    ? Math.round(
        adherenceValues.reduce((sum, value) => sum + value, 0) /
          adherenceValues.length
      )
    : null;
  const wonLeads = data.leads.filter(lead => lead.status === "won").length;
  const qualifiedLeads = data.leads.filter(lead =>
    ["qualified", "won"].includes(lead.status)
  ).length;
  const conversionRate = data.leads.length
    ? Math.round((wonLeads / data.leads.length) * 100)
    : null;
  const statusCounts = [
    "active",
    "plan pending",
    "check-in due",
    "paused",
    "complete",
  ].map(status => ({
    status,
    count: data.clients.filter(client => client.status === status).length,
  }));
  const maxStatusCount = Math.max(1, ...statusCounts.map(item => item.count));

  return (
    <>
      <Header
        kicker="Performance"
        title="Analytics"
        description="Operational signals calculated from canonical client, lead, check-in, and Stripe records."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Active clients", String(data.metrics.activeClients)],
          [
            "Average adherence",
            averageAdherence == null ? "Not available" : `${averageAdherence}%`,
          ],
          ["Qualified leads", String(qualifiedLeads)],
          [
            "Lead conversion",
            conversionRate == null ? "Not available" : `${conversionRate}%`,
          ],
        ].map(([label, value]) => (
          <Panel className="p-5" key={label}>
            <p className="text-xs text-[var(--cm-text-muted)]">{label}</p>
            <p className="mt-3 text-2xl font-extrabold text-[var(--cm-gold-light)]">
              {value}
            </p>
          </Panel>
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-5 sm:p-6">
          <h2 className="font-extrabold">Client status distribution</h2>
          <div className="mt-5 space-y-4">
            {statusCounts.map(item => (
              <div key={item.status}>
                <div className="flex justify-between text-sm">
                  <span className="capitalize text-[var(--cm-text-soft)]">
                    {item.status}
                  </span>
                  <strong>{item.count}</strong>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--cm-surface-raised)]">
                  <div
                    className="h-full rounded-full bg-[var(--cm-gold)]"
                    style={{
                      width: `${Math.round((item.count / maxStatusCount) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-5 sm:p-6">
          <h2 className="font-extrabold">Revenue snapshot</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--cm-text-muted)]">
            Completed payments recorded by the signed Stripe webhook during the
            current month.
          </p>
          <p className="mt-6 text-4xl font-extrabold text-[var(--cm-gold-light)]">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(data.metrics.monthlyRevenue ?? 0)}
          </p>
          <p className="mt-4 text-sm text-[var(--cm-text-soft)]">
            {data.payments.length} payment record
            {data.payments.length === 1 ? "" : "s"} this month
          </p>
        </Panel>
      </div>
    </>
  );
}

type LibraryResource = AdminLibraryPayload["resources"][number];
type LibraryResourceKind = LibraryResource["kind"];

const resourceKinds: Array<{
  value: LibraryResourceKind;
  label: string;
}> = [
  { value: "guide", label: "Guide" },
  { value: "training", label: "Training" },
  { value: "nutrition", label: "Nutrition" },
  { value: "video", label: "Video" },
  { value: "worksheet", label: "Worksheet" },
];

function resourceLocation(url: string) {
  if (url.startsWith("/")) return "Coach Murray website";
  try {
    return new URL(url).hostname;
  } catch {
    return "External resource";
  }
}

export function LibraryPage({ preview }: { preview: boolean }) {
  const [library, setLibrary] = useState<AdminLibraryPayload | null>(
    preview ? previewLibrary : null
  );
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState(
    previewLibrary.resources[0]?.id ?? ""
  );
  const [editingId, setEditingId] = useState("");
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<LibraryResourceKind>("guide");
  const [url, setUrl] = useState("");
  const [search, setSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [assignmentBusy, setAssignmentBusy] = useState("");

  const loadLibrary = useCallback(async () => {
    if (preview) return previewLibrary;
    const next = await api.getAdminLibrary();
    setLibrary(next);
    setLoadError("");
    setSelectedId(current =>
      current && next.resources.some(resource => resource.id === current)
        ? current
        : (next.resources[0]?.id ?? "")
    );
    return next;
  }, [preview]);

  useEffect(() => {
    if (preview) return;
    void loadLibrary().catch(error =>
      setLoadError(
        error instanceof Error
          ? error.message
          : "The resource library could not be loaded."
      )
    );
  }, [loadLibrary, preview]);

  const resetEditor = () => {
    setEditingId("");
    setExpectedUpdatedAt("");
    setTitle("");
    setKind("guide");
    setUrl("");
  };
  const editResource = (resource: LibraryResource) => {
    setSelectedId(resource.id);
    setEditingId(resource.id);
    setExpectedUpdatedAt(resource.updatedAt);
    setTitle(resource.title);
    setKind(resource.kind);
    setUrl(resource.url);
  };
  const submitResource = async (event: FormEvent) => {
    event.preventDefault();
    if (preview) {
      toast.info("Preview only — no library resource was saved.");
      return;
    }
    setSaving(true);
    try {
      const result = editingId
        ? await api.adminAction({
            kind: "update-resource",
            resourceId: editingId,
            expectedUpdatedAt,
            resource: { title, kind, url },
          })
        : await api.adminAction({
            kind: "create-resource",
            resource: { title, kind, url },
          });
      const next = await loadLibrary();
      setSelectedId(result.resourceId ?? next.resources[0]?.id ?? "");
      resetEditor();
      toast.success(editingId ? "Resource updated." : "Resource created.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The resource could not be saved."
      );
    } finally {
      setSaving(false);
    }
  };
  const deleteResource = async (resource: LibraryResource) => {
    if (preview) {
      toast.info("Preview only — no library resource was deleted.");
      return;
    }
    if (
      !window.confirm(
        `Delete “${resource.title}”? It will be removed from every assigned client.`
      )
    )
      return;
    setDeletingId(resource.id);
    try {
      await api.adminAction({
        kind: "delete-resource",
        resourceId: resource.id,
      });
      if (editingId === resource.id) resetEditor();
      await loadLibrary();
      toast.success("Resource deleted and client assignments removed.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The resource could not be deleted."
      );
    } finally {
      setDeletingId("");
    }
  };
  const setAssignment = async (clientId: string, assigned: boolean) => {
    if (!selectedId || preview) return;
    const busyKey = `${selectedId}:${clientId}`;
    setAssignmentBusy(busyKey);
    try {
      await api.adminAction({
        kind: "set-resource-assignment",
        resourceId: selectedId,
        clientId,
        assigned,
      });
      setLibrary(current =>
        current
          ? {
              ...current,
              resources: current.resources.map(resource =>
                resource.id === selectedId
                  ? {
                      ...resource,
                      assignedClientIds: assigned
                        ? Array.from(
                            new Set([...resource.assignedClientIds, clientId])
                          )
                        : resource.assignedClientIds.filter(
                            assignedId => assignedId !== clientId
                          ),
                    }
                  : resource
              ),
            }
          : current
      );
      toast.success(assigned ? "Resource assigned." : "Assignment removed.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The assignment could not be updated."
      );
    } finally {
      setAssignmentBusy("");
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredResources = (library?.resources ?? []).filter(resource =>
    `${resource.title} ${resource.kind} ${resource.url}`
      .toLowerCase()
      .includes(normalizedSearch)
  );
  const normalizedClientSearch = clientSearch.trim().toLowerCase();
  const filteredClients = (library?.clients ?? []).filter(client =>
    `${client.name} ${client.status}`
      .toLowerCase()
      .includes(normalizedClientSearch)
  );
  const selected = library?.resources.find(
    resource => resource.id === selectedId
  );

  return (
    <>
      <Header
        kicker="Resources"
        title="Library"
        description="Create trusted resource links and choose exactly which clients can access each one."
        action={
          <button
            className="cm-button-primary inline-flex min-h-11 items-center gap-2 px-4 py-2.5 text-sm"
            onClick={resetEditor}
          >
            <Plus size={16} /> New resource
          </button>
        }
      />
      {loadError ? (
        <Panel className="max-w-2xl p-6">
          <div role="alert">
            <h2 className="font-extrabold text-[var(--cm-danger)]">
              Library unavailable
            </h2>
            <p className="mt-2 text-sm text-[var(--cm-text-soft)]">
              {loadError}
            </p>
            <button
              className="mt-4 min-h-11 rounded-xl border border-[var(--cm-border-strong)] px-4 text-sm font-bold"
              onClick={() => void loadLibrary().catch(() => undefined)}
            >
              Try again
            </button>
          </div>
        </Panel>
      ) : !library ? (
        <Panel>
          <div
            role="status"
            className="p-8 text-sm text-[var(--cm-text-muted)]"
          >
            Loading resource library…
          </div>
        </Panel>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <Panel className="overflow-hidden">
              <div className="border-b border-[var(--cm-border)] p-5">
                <label
                  className="block text-sm font-bold"
                  htmlFor="resource-search"
                >
                  Search resources
                </label>
                <div className="relative mt-2">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cm-text-muted)]"
                    size={17}
                  />
                  <input
                    id="resource-search"
                    className="cm-input pl-10 pr-3"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Title, kind, or URL"
                  />
                </div>
              </div>
              {filteredResources.length ? (
                <div className="divide-y divide-[var(--cm-border)]">
                  {filteredResources.map(resource => (
                    <article
                      key={resource.id}
                      className={`p-5 ${selectedId === resource.id ? "bg-[rgb(212_170_64_/_0.06)]" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => setSelectedId(resource.id)}
                          aria-pressed={selectedId === resource.id}
                        >
                          <span className="block truncate font-extrabold">
                            {resource.title}
                          </span>
                          <span className="mt-1 block text-xs capitalize text-[var(--cm-text-muted)]">
                            {resource.kind} · {resourceLocation(resource.url)}
                          </span>
                          <span className="mt-3 inline-flex rounded-full border border-[var(--cm-border)] px-2.5 py-1 text-xs font-bold text-[var(--cm-text-soft)]">
                            {resource.assignedClientIds.length} client
                            {resource.assignedClientIds.length === 1 ? "" : "s"}
                          </span>
                        </button>
                        <div className="flex shrink-0 gap-1">
                          <a
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--cm-border)] text-[var(--cm-text-muted)] hover:text-[var(--cm-gold)]"
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${resource.title}`}
                          >
                            <ExternalLink size={16} />
                          </a>
                          <button
                            type="button"
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--cm-border)] text-[var(--cm-text-muted)] hover:text-[var(--cm-gold)]"
                            onClick={() => editResource(resource)}
                            aria-label={`Edit ${resource.title}`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--cm-border)] text-[var(--cm-text-muted)] hover:text-[var(--cm-danger)] disabled:opacity-50"
                            disabled={deletingId === resource.id}
                            onClick={() => void deleteResource(resource)}
                            aria-label={`Delete ${resource.title}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty
                  icon={Library}
                  title={
                    library.resources.length
                      ? "No matching resources"
                      : "No resources yet"
                  }
                  description={
                    library.resources.length
                      ? "Try a different title, kind, or URL."
                      : "Create the first trusted resource link for your clients."
                  }
                />
              )}
            </Panel>

            <Panel className="overflow-hidden">
              <div className="border-b border-[var(--cm-border)] p-5">
                <h2 className="font-extrabold">Client access</h2>
                <p className="mt-1 text-sm text-[var(--cm-text-muted)]">
                  {selected
                    ? `Choose who can open “${selected.title}.”`
                    : "Select a resource to manage its client access."}
                </p>
              </div>
              {selected ? (
                <div className="p-5">
                  <label
                    className="block text-sm font-bold"
                    htmlFor="library-client-search"
                  >
                    Find a client
                  </label>
                  <input
                    id="library-client-search"
                    className="cm-input mt-2 px-3"
                    value={clientSearch}
                    onChange={event => setClientSearch(event.target.value)}
                    placeholder="Name or status"
                  />
                  {preview && (
                    <p className="mt-3 text-xs text-[var(--cm-text-muted)]">
                      Assignments are disabled in preview mode.
                    </p>
                  )}
                  <fieldset className="mt-4 max-h-80 space-y-2 overflow-y-auto">
                    <legend className="sr-only">Assigned clients</legend>
                    {filteredClients.map(client => {
                      const checked = selected.assignedClientIds.includes(
                        client.id
                      );
                      const busy =
                        assignmentBusy === `${selected.id}:${client.id}`;
                      return (
                        <label
                          key={client.id}
                          className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[var(--cm-border)] px-3 py-2"
                        >
                          <input
                            type="checkbox"
                            className="h-5 w-5 accent-[var(--cm-gold)]"
                            checked={checked}
                            disabled={preview || Boolean(assignmentBusy)}
                            onChange={event =>
                              void setAssignment(
                                client.id,
                                event.target.checked
                              )
                            }
                          />
                          <span className="min-w-0 flex-1">
                            <strong className="block truncate text-sm">
                              {client.name}
                            </strong>
                            <span className="block text-xs capitalize text-[var(--cm-text-muted)]">
                              {busy ? "Saving…" : client.status}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                    {!filteredClients.length && (
                      <p className="py-5 text-center text-sm text-[var(--cm-text-muted)]">
                        {library.clients.length
                          ? "No clients match this search."
                          : "No client records are available yet."}
                      </p>
                    )}
                  </fieldset>
                </div>
              ) : (
                <Empty
                  icon={Users}
                  title="No resource selected"
                  description="Select or create a resource before assigning clients."
                />
              )}
            </Panel>
          </div>

          <Panel className="h-fit p-5 sm:p-6">
            <p className="cm-kicker">
              {editingId ? "Edit resource" : "New resource"}
            </p>
            <h2 className="mt-2 text-xl font-extrabold">
              {editingId ? "Update client resource" : "Add to the library"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--cm-text-muted)]">
              Use a secure external link or a same-site path. File uploads are
              not enabled.
            </p>
            <form className="mt-6 space-y-4" onSubmit={submitResource}>
              <label className="block text-sm font-bold">
                Resource title
                <input
                  className="cm-input mt-2 px-3"
                  required
                  maxLength={160}
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                />
              </label>
              <label className="block text-sm font-bold">
                Resource kind
                <select
                  className="cm-input mt-2 px-3 capitalize"
                  value={kind}
                  onChange={event =>
                    setKind(event.target.value as LibraryResourceKind)
                  }
                >
                  {resourceKinds.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold">
                Resource URL
                <input
                  className="cm-input mt-2 px-3"
                  required
                  maxLength={2048}
                  inputMode="url"
                  value={url}
                  onChange={event => setUrl(event.target.value)}
                  placeholder="https://… or /resource.pdf"
                />
                <span className="mt-2 block text-xs font-normal leading-5 text-[var(--cm-text-muted)]">
                  Only HTTPS destinations and paths hosted on this website are
                  accepted.
                </span>
              </label>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  className="cm-button-primary min-h-11 px-5 py-2.5 text-sm"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving…"
                    : editingId
                      ? "Save changes"
                      : "Create resource"}
                </button>
                {editingId && (
                  <button
                    className="min-h-11 rounded-xl border border-[var(--cm-border-strong)] px-5 text-sm font-bold"
                    type="button"
                    onClick={resetEditor}
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </Panel>
        </div>
      )}
    </>
  );
}

function AccountSecurityPage({ preview }: { preview: boolean }) {
  const endSession = () => {
    if (preview) {
      toast.info("Preview only — there is no authenticated session to end.");
      return;
    }
    void signOut();
  };
  return (
    <>
      <Header
        kicker="Your account"
        title="Account & Security"
        description="Manage the Coach OS session on this browser."
      />
      <Panel className="max-w-2xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgb(212_170_64_/_0.1)] text-[var(--cm-gold)]">
            <Settings size={20} />
          </span>
          <div>
            <h2 className="font-extrabold">Current browser session</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--cm-text-muted)]">
              Signing out ends Coach OS access on this device. Sign in again
              with your coach account to return.
            </p>
            <button
              onClick={endSession}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--cm-border-strong)] px-4 text-sm font-bold text-[var(--cm-text-soft)]"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
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
  const refreshAdmin = useCallback(async () => {
    const next = await api.getAdmin();
    setData(next);
    setError("");
  }, []);
  useEffect(() => {
    if (isLocalPreview) return;
    void refreshAdmin().catch(cause =>
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Coach OS could not be loaded."
      )
    );
  }, [refreshAdmin]);
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
      <CheckInsPage data={data} onSaved={refreshAdmin} />
    ) : active === "programs" ? (
      <ProgramsPage data={data} onSaved={refreshAdmin} />
    ) : active === "messages" ? (
      <MessagesPage data={data} onSaved={refreshAdmin} />
    ) : active === "leads" ? (
      <LeadsPage data={data} onSaved={refreshAdmin} />
    ) : active === "payments" ? (
      <PaymentsPage data={data} />
    ) : active === "analytics" ? (
      <AnalyticsPage data={data} />
    ) : active === "library" ? (
      <LibraryPage preview={data.preview} />
    ) : (
      <AccountSecurityPage preview={data.preview} />
    );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-[var(--cm-border)] bg-[var(--cm-surface)] lg:flex">
        <div className="border-b border-[var(--cm-border)] p-5">
          <BrandLockup context="Coach OS" />
        </div>
        <div className="border-b border-[var(--cm-border)] px-5 py-4">
          <p className="text-xs text-[var(--cm-text-muted)]">Workspace</p>
          <p className="mt-1 text-sm font-bold capitalize">
            {data.coach.role} · {data.coach.firstName}
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
