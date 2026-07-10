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
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Dumbbell,
  Home,
  Library,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Send,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Utensils,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { PortalPayload } from "@shared/contracts";
import { AccessGate } from "@/components/AccessGate";
import { BrandLockup } from "@/components/Brand";
import { api, ApiError } from "@/lib/api";
import { signOut } from "@/lib/auth";
import { isLocalPreview } from "@/lib/config";

type TabId =
  | "home"
  | "training"
  | "nutrition"
  | "checkins"
  | "progress"
  | "messages"
  | "library"
  | "profile"
  | "billing"
  | "settings";
type NavItem = { id: TabId; label: string; icon: LucideIcon };

const primaryNav: NavItem[] = [
  { id: "home", label: "Overview", icon: Home },
  { id: "training", label: "Training", icon: Dumbbell },
  { id: "nutrition", label: "Nutrition", icon: Utensils },
  { id: "checkins", label: "Check-ins", icon: ClipboardCheck },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "library", label: "Library", icon: Library },
];

const accountNav: NavItem[] = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
];

const previewData: PortalPayload = {
  preview: true,
  profile: {
    id: "00000000-0000-0000-0000-000000000001",
    firstName: "Preview",
    lastName: "Client",
    email: "preview@example.com",
    primaryGoal: "Build strength and consistency",
    weekNumber: 4,
    totalWeeks: 12,
    currentWeight: 158,
    goalWeight: 145,
  },
  program: {
    id: "00000000-0000-0000-0000-000000000002",
    title: "Foundation Strength — Phase 1",
    summary:
      "Three progressive strength sessions, two conditioning blocks, and a daily movement target.",
    status: "active",
    weeks: 12,
  },
  workouts: [
    {
      id: "w1",
      title: "Lower Body Strength",
      day: "Today",
      durationMinutes: 52,
      status: "ready",
      notes: "Work at a controlled tempo and leave one clean rep in reserve.",
    },
    {
      id: "w2",
      title: "Upper Body Push + Pull",
      day: "Friday",
      durationMinutes: 48,
      status: "upcoming",
      notes:
        "Use the neutral-grip variation if your shoulders feel restricted.",
    },
    {
      id: "w3",
      title: "Zone 2 Conditioning",
      day: "Saturday",
      durationMinutes: 35,
      status: "upcoming",
      notes: "Keep the pace conversational and stay inside your assigned zone.",
    },
  ],
  nutrition: {
    calories: 2_100,
    protein: 165,
    carbs: 220,
    fat: 65,
    notes:
      "Build each meal around protein, produce, and a measured carb source.",
  },
  checkIns: [
    {
      id: "c1",
      submittedAt: "2026-07-06T15:00:00.000Z",
      adherence: 88,
      energy: 4,
      weight: 158,
    },
  ],
  messages: [
    {
      id: "m1",
      sender: "coach",
      body: "Strong week. Keep the same loads and own the tempo on every rep.",
      sentAt: "2026-07-09T16:30:00.000Z",
      read: false,
    },
  ],
  progress: [
    { recordedAt: "2026-06-15T12:00:00.000Z", weight: 162, adherence: 79 },
    { recordedAt: "2026-06-22T12:00:00.000Z", weight: 160.5, adherence: 84 },
    { recordedAt: "2026-06-29T12:00:00.000Z", weight: 159, adherence: 86 },
    { recordedAt: "2026-07-06T12:00:00.000Z", weight: 158, adherence: 88 },
  ],
  library: [
    {
      id: "l1",
      title: "5-Day Cutting Blueprint",
      kind: "Guide",
      url: "/5-day-cutting-blueprint.pdf",
    },
    { id: "l2", title: "Protein Portions Without a Scale", kind: "Nutrition" },
    { id: "l3", title: "How to Film a Form Check", kind: "Training" },
  ],
  subscription: {
    status: "active",
    packageName: "Full Coaching",
    renewsAt: "2026-08-01",
  },
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

function PageHeader({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-6">
      <p className="cm-kicker">{kicker}</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cm-text-muted)] sm:text-base">
        {description}
      </p>
    </header>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
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

function PreviewNotice() {
  return (
    <div
      role="status"
      className="mb-6 flex items-start gap-3 rounded-xl border border-[rgb(240_208_112_/_0.25)] bg-[rgb(212_170_64_/_0.08)] px-4 py-3 text-sm text-[var(--cm-text-soft)]"
    >
      <Sparkles className="mt-0.5 shrink-0 text-[var(--cm-gold)]" size={17} />
      <span>
        <strong className="text-[var(--cm-gold-light)]">Preview data.</strong>{" "}
        Actions demonstrate the experience but are not saved.
      </span>
    </div>
  );
}

async function refreshSavedPortal(onRefresh: () => Promise<void>) {
  try {
    await onRefresh();
  } catch {
    toast.warning(
      "Your update was saved, but the latest dashboard data could not be refreshed. Reload to see it."
    );
  }
}

function Overview({
  data,
  onNavigate,
}: {
  data: PortalPayload;
  onNavigate: (tab: TabId) => void;
}) {
  const { profile, program } = data;
  const progress = profile.totalWeeks
    ? Math.min(100, Math.round((profile.weekNumber / profile.totalWeeks) * 100))
    : 0;
  const nextWorkout =
    data.workouts.find(
      workout => !["complete", "skipped"].includes(workout.status)
    ) ?? data.workouts[0];
  const latestCoachNote = data.messages
    .filter(message => message.sender === "coach")
    .sort(
      (left, right) =>
        new Date(right.sentAt).getTime() - new Date(left.sentAt).getTime()
    )[0];
  const unread = data.messages.filter(
    message => message.sender === "coach" && !message.read
  ).length;
  return (
    <>
      <PageHeader
        kicker={`Week ${profile.weekNumber} of ${profile.totalWeeks}`}
        title={`Welcome back, ${profile.firstName}`}
        description="Your plan, priorities, and coach communication—all in one place."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Program progress", value: `${progress}%`, icon: BarChart3 },
          {
            label: "Current weight",
            value: profile.currentWeight
              ? `${profile.currentWeight} lb`
              : "Not logged",
            icon: TrendingUp,
          },
          {
            label: "Check-in adherence",
            value: data.checkIns[0] ? `${data.checkIns[0].adherence}%` : "Due",
            icon: ClipboardCheck,
          },
          {
            label: "Unread messages",
            value: String(unread),
            icon: MessageCircle,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Panel key={label} className="p-4">
            <div className="flex items-center justify-between text-xs text-[var(--cm-text-muted)]">
              <span>{label}</span>
              <Icon size={16} className="text-[var(--cm-gold)]" />
            </div>
            <div className="mt-3 text-2xl font-extrabold text-[var(--cm-text)]">
              {value}
            </div>
          </Panel>
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Panel className="overflow-hidden">
          <div className="border-b border-[var(--cm-border)] p-5">
            <p className="cm-kicker">Current program</p>
            <h2 className="mt-2 text-xl font-extrabold">
              {program?.title ?? "Your plan is being prepared"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--cm-text-muted)]">
              {program?.summary ??
                "Coach Murray will publish your first phase here after reviewing your intake."}
            </p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <button
              onClick={() => onNavigate("training")}
              className="min-h-28 rounded-xl border border-[var(--cm-border)] bg-[var(--cm-surface-raised)] p-4 text-left transition hover:border-[var(--cm-border-strong)]"
            >
              <Dumbbell className="text-[var(--cm-gold)]" size={20} />
              <span className="mt-5 block text-xs text-[var(--cm-text-muted)]">
                Next training
              </span>
              <strong className="mt-1 block">
                {nextWorkout?.title ?? "No session assigned"}
              </strong>
            </button>
            <button
              onClick={() => onNavigate("nutrition")}
              className="min-h-28 rounded-xl border border-[var(--cm-border)] bg-[var(--cm-surface-raised)] p-4 text-left transition hover:border-[var(--cm-border-strong)]"
            >
              <Utensils className="text-[var(--cm-gold)]" size={20} />
              <span className="mt-5 block text-xs text-[var(--cm-text-muted)]">
                Daily target
              </span>
              <strong className="mt-1 block">
                {data.nutrition
                  ? `${data.nutrition.calories.toLocaleString()} kcal · ${data.nutrition.protein}g protein`
                  : "Pending coach review"}
              </strong>
            </button>
          </div>
        </Panel>
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <p className="cm-kicker">Coach note</p>
            <MessageCircle size={17} className="text-[var(--cm-gold)]" />
          </div>
          {latestCoachNote ? (
            <>
              <blockquote className="mt-5 text-lg font-medium leading-8 text-[var(--cm-text-soft)]">
                “{latestCoachNote.body}”
              </blockquote>
              <button
                onClick={() => onNavigate("messages")}
                className="mt-6 min-h-11 text-sm font-bold text-[var(--cm-gold)]"
              >
                Open messages →
              </button>
            </>
          ) : (
            <EmptyState
              icon={MessageCircle}
              title="No new notes"
              description="Coach feedback will appear here."
            />
          )}
        </Panel>
      </div>
    </>
  );
}

function Training({
  data,
  onRefresh,
}: {
  data: PortalPayload;
  onRefresh: () => Promise<void>;
}) {
  const [pendingWorkout, setPendingWorkout] = useState<{
    id: string;
    status: "complete" | "skipped";
  } | null>(null);
  const updateWorkout = async (
    workoutId: string,
    status: "complete" | "skipped"
  ) => {
    if (data.preview) {
      toast.info(`Preview only — this workout was not marked ${status}.`);
      return;
    }
    setPendingWorkout({ id: workoutId, status });
    try {
      await api.clientAction({ kind: "update-workout", workoutId, status });
      toast.success(
        status === "complete"
          ? "Workout marked complete."
          : "Workout marked skipped."
      );
      await refreshSavedPortal(onRefresh);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Workout status could not be updated."
      );
    } finally {
      setPendingWorkout(null);
    }
  };
  return (
    <>
      <PageHeader
        kicker="Program"
        title="Training"
        description="Follow the assigned order, loads, tempo, and coaching notes for each session."
      />
      <Panel>
        {data.workouts.length ? (
          <div className="divide-y divide-[var(--cm-border)]">
            {data.workouts.map((workout, index) => (
              <article key={workout.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(212_170_64_/_0.1)] font-extrabold text-[var(--cm-gold)]">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--cm-text-muted)]">
                      {workout.day}
                    </p>
                    <h2 className="mt-1 font-bold">{workout.title}</h2>
                    <p className="mt-1 text-sm text-[var(--cm-text-muted)]">
                      {workout.durationMinutes} minutes
                    </p>
                    {workout.notes.trim() && (
                      <div className="mt-4 rounded-xl border border-[var(--cm-border)] bg-[var(--cm-surface-raised)] p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--cm-gold)]">
                          Coach notes
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--cm-text-soft)]">
                          {workout.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  <span className="w-fit rounded-full border border-[var(--cm-border)] px-3 py-1 text-xs font-bold capitalize text-[var(--cm-text-soft)]">
                    {workout.status}
                  </span>
                </div>
                {!["complete", "skipped"].includes(workout.status) && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--cm-border)] pt-4 sm:ml-14">
                    <button
                      type="button"
                      className="cm-button-primary px-4 py-2 text-sm"
                      disabled={pendingWorkout !== null}
                      onClick={() => void updateWorkout(workout.id, "complete")}
                    >
                      {pendingWorkout?.id === workout.id &&
                      pendingWorkout.status === "complete"
                        ? "Completing…"
                        : "Mark complete"}
                    </button>
                    <button
                      type="button"
                      className="min-h-11 rounded-[var(--cm-radius-md)] border border-[var(--cm-border)] px-4 text-sm font-bold text-[var(--cm-text-soft)] transition hover:border-[var(--cm-border-strong)] hover:text-[var(--cm-text)] disabled:opacity-50"
                      disabled={pendingWorkout !== null}
                      onClick={() => void updateWorkout(workout.id, "skipped")}
                    >
                      {pendingWorkout?.id === workout.id &&
                      pendingWorkout.status === "skipped"
                        ? "Skipping…"
                        : "Skip workout"}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Dumbbell}
            title="No workouts assigned"
            description="Your training sessions will appear after Coach Murray publishes your program."
          />
        )}
      </Panel>
    </>
  );
}

function Nutrition({ data }: { data: PortalPayload }) {
  if (!data.nutrition)
    return (
      <>
        <PageHeader
          kicker="Fuel"
          title="Nutrition"
          description="Your targets and coach notes."
        />
        <Panel>
          <EmptyState
            icon={Utensils}
            title="Nutrition targets are pending"
            description="Coach Murray will publish targets after reviewing your intake."
          />
        </Panel>
      </>
    );
  const targets = [
    ["Calories", data.nutrition.calories.toLocaleString(), "kcal"],
    ["Protein", String(data.nutrition.protein), "g"],
    ["Carbohydrates", String(data.nutrition.carbs), "g"],
    ["Fat", String(data.nutrition.fat), "g"],
  ];
  return (
    <>
      <PageHeader
        kicker="Fuel"
        title="Nutrition"
        description="Daily targets are a compass. Use check-ins to tell your coach how execution feels."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {targets.map(([label, value, unit]) => (
          <Panel key={label} className="p-5">
            <p className="text-xs text-[var(--cm-text-muted)]">{label}</p>
            <p className="mt-2 text-3xl font-extrabold text-[var(--cm-gold-light)]">
              {value}
              <span className="ml-1 text-sm text-[var(--cm-text-muted)]">
                {unit}
              </span>
            </p>
          </Panel>
        ))}
      </div>
      <Panel className="mt-4 p-5">
        <p className="cm-kicker">Coach guidance</p>
        <p className="mt-3 max-w-3xl leading-7 text-[var(--cm-text-soft)]">
          {data.nutrition.notes}
        </p>
      </Panel>
    </>
  );
}

function CheckIns({
  data,
  onRefresh,
}: {
  data: PortalPayload;
  onRefresh: () => Promise<void>;
}) {
  const [energy, setEnergy] = useState(4);
  const [adherence, setAdherence] = useState(80);
  const [weight, setWeight] = useState("");
  const [wins, setWins] = useState("");
  const [challenges, setChallenges] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (data.preview) {
      toast.info("Preview only — this check-in was not saved.");
      return;
    }
    setSaving(true);
    try {
      await api.clientAction({
        kind: "check-in",
        energy,
        adherence,
        weight: weight ? Number(weight) : undefined,
        wins,
        challenges,
      });
      toast.success("Check-in submitted to Coach Murray.");
      setWins("");
      setChallenges("");
      setWeight("");
      await refreshSavedPortal(onRefresh);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Check-in could not be saved."
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <PageHeader
        kicker="Weekly review"
        title="Check-in"
        description="Share the signal your coach needs to adjust the plan—not just the numbers."
      />
      <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <Panel className="p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-bold">
              Energy (1–5)
              <input
                className="cm-input mt-2 px-3"
                type="number"
                min="1"
                max="5"
                required
                value={energy}
                onChange={e => setEnergy(Number(e.target.value))}
              />
            </label>
            <label className="text-sm font-bold">
              Adherence (%)
              <input
                className="cm-input mt-2 px-3"
                type="number"
                min="0"
                max="100"
                required
                value={adherence}
                onChange={e => setAdherence(Number(e.target.value))}
              />
            </label>
            <label className="text-sm font-bold">
              Weight (optional)
              <input
                className="cm-input mt-2 px-3"
                type="number"
                min="1"
                max="1500"
                step="0.1"
                value={weight}
                onChange={e => setWeight(e.target.value)}
              />
            </label>
          </div>
          <label className="mt-5 block text-sm font-bold">
            Wins
            <textarea
              className="cm-input mt-2 min-h-28 p-3"
              maxLength={2000}
              value={wins}
              onChange={e => setWins(e.target.value)}
              placeholder="What went well this week?"
            />
          </label>
          <label className="mt-5 block text-sm font-bold">
            Challenges
            <textarea
              className="cm-input mt-2 min-h-28 p-3"
              maxLength={2000}
              value={challenges}
              onChange={e => setChallenges(e.target.value)}
              placeholder="Where did the plan get difficult?"
            />
          </label>
          <button
            className="cm-button-primary mt-5 w-full px-5 py-3 sm:w-auto"
            type="submit"
            disabled={saving}
          >
            {saving ? "Submitting…" : "Submit check-in"}
          </button>
        </Panel>
        <Panel className="overflow-hidden">
          <div className="border-b border-[var(--cm-border)] p-5">
            <h2 className="font-bold">Recent check-ins</h2>
          </div>
          {data.checkIns.length ? (
            <div className="divide-y divide-[var(--cm-border)]">
              {data.checkIns.slice(0, 5).map(item => (
                <div className="p-5" key={item.id}>
                  <div className="flex justify-between text-sm">
                    <span>
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </span>
                    <strong className="text-[var(--cm-positive)]">
                      {item.adherence}% adherence
                    </strong>
                  </div>
                  <p className="mt-2 text-xs text-[var(--cm-text-muted)]">
                    Energy {item.energy}/5
                    {item.weight ? ` · ${item.weight} lb` : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardCheck}
              title="No check-ins yet"
              description="Your first submission will appear here."
            />
          )}
        </Panel>
      </form>
    </>
  );
}

function Progress({ data }: { data: PortalPayload }) {
  const latest = data.progress.at(-1);
  return (
    <>
      <PageHeader
        kicker="Trajectory"
        title="Progress"
        description="Use trends over time. A single weigh-in never tells the whole story."
      />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel className="p-6">
          <Target className="text-[var(--cm-gold)]" />
          <p className="mt-6 text-xs text-[var(--cm-text-muted)]">
            Primary goal
          </p>
          <h2 className="mt-2 text-2xl font-extrabold">
            {data.profile.primaryGoal.trim() || "Not provided"}
          </h2>
          <p className="mt-6 text-sm text-[var(--cm-text-muted)]">
            Latest weight
          </p>
          <p className="mt-1 text-4xl font-extrabold text-[var(--cm-gold-light)]">
            {latest?.weight ? `${latest.weight} lb` : "Not logged"}
          </p>
        </Panel>
        <Panel className="overflow-hidden">
          <div className="border-b border-[var(--cm-border)] p-5">
            <h2 className="font-bold">Weekly trend</h2>
          </div>
          {data.progress.length ? (
            <div className="divide-y divide-[var(--cm-border)]">
              {data.progress.map(entry => (
                <div
                  key={entry.recordedAt}
                  className="grid grid-cols-3 gap-3 p-4 text-sm"
                >
                  <span className="text-[var(--cm-text-muted)]">
                    {new Date(entry.recordedAt).toLocaleDateString()}
                  </span>
                  <strong>{entry.weight ? `${entry.weight} lb` : "—"}</strong>
                  <span className="text-right text-[var(--cm-positive)]">
                    {entry.adherence != null ? `${entry.adherence}%` : "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No progress entries"
              description="Progress recorded through check-ins will appear here."
            />
          )}
        </Panel>
      </div>
    </>
  );
}

function Messages({
  data,
  onRefresh,
}: {
  data: PortalPayload;
  onRefresh: () => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const readRequestStarted = useRef(false);
  const hasUnreadCoachMessages = data.messages.some(
    message => message.sender === "coach" && !message.read
  );

  useEffect(() => {
    if (data.preview || !hasUnreadCoachMessages || readRequestStarted.current)
      return;
    readRequestStarted.current = true;
    void api
      .clientAction({ kind: "mark-messages-read" })
      .then(() => refreshSavedPortal(onRefresh))
      .catch(error => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Messages could not be marked read."
        );
      });
  }, [data.preview, hasUnreadCoachMessages, onRefresh]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;
    if (data.preview) {
      toast.info("Preview only — this message was not sent.");
      return;
    }
    setSaving(true);
    try {
      await api.clientAction({ kind: "message", body });
      setBody("");
      toast.success("Message sent.");
      await refreshSavedPortal(onRefresh);
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
      <PageHeader
        kicker="Direct support"
        title="Messages"
        description="Keep coaching questions, feedback, and decisions attached to your program."
      />
      <Panel className="mx-auto max-w-3xl overflow-hidden">
        <div className="max-h-[54vh] min-h-72 space-y-4 overflow-y-auto p-5 sm:p-6">
          {data.messages.length ? (
            data.messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender === "client" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.sender === "client" ? "bg-[var(--cm-gold)] text-[var(--cm-bg)]" : "border border-[var(--cm-border)] bg-[var(--cm-surface-raised)] text-[var(--cm-text-soft)]"}`}
                >
                  <p>{message.body}</p>
                  <time className="mt-1 block text-[10px] opacity-65">
                    {new Date(message.sentAt).toLocaleString()}
                  </time>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={MessageCircle}
              title="Start the conversation"
              description="Ask a question or share an update below."
            />
          )}
        </div>
        <form
          onSubmit={submit}
          className="flex gap-2 border-t border-[var(--cm-border)] p-3"
        >
          <label className="sr-only" htmlFor="message-body">
            Message Coach Murray
          </label>
          <textarea
            id="message-body"
            className="cm-input cm-compact min-h-12 resize-none px-3 py-3"
            rows={1}
            maxLength={5000}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Message Coach Murray…"
          />
          <button
            className="cm-button-primary flex h-12 w-12 shrink-0 items-center justify-center"
            type="submit"
            disabled={saving}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </Panel>
    </>
  );
}

function LibraryPage({ data }: { data: PortalPayload }) {
  return (
    <>
      <PageHeader
        kicker="Resources"
        title="Library"
        description="Guides and coaching resources assigned to your current phase."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.library.length ? (
          data.library.map(item => (
            <Panel key={item.id} className="p-5">
              <BookOpen className="text-[var(--cm-gold)]" />
              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[var(--cm-text-muted)]">
                {item.kind}
              </p>
              <h2 className="mt-2 text-lg font-bold">{item.title}</h2>
              {item.url ? (
                <a
                  className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-[var(--cm-gold)]"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open resource →
                </a>
              ) : (
                <p className="mt-5 text-sm text-[var(--cm-text-muted)]">
                  Available inside your coaching plan.
                </p>
              )}
            </Panel>
          ))
        ) : (
          <Panel className="sm:col-span-2 xl:col-span-3">
            <EmptyState
              icon={Library}
              title="No resources assigned"
              description="Resources from Coach Murray will appear here."
            />
          </Panel>
        )}
      </div>
    </>
  );
}

function AccountPage({
  tab,
  data,
}: {
  tab: "profile" | "billing" | "settings";
  data: PortalPayload;
}) {
  const billing = async () => {
    if (data.preview) {
      toast.info("Preview only — no billing portal was opened.");
      return;
    }
    try {
      const { url } = await api.createBillingPortal();
      window.location.assign(url);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Billing portal is unavailable."
      );
    }
  };
  if (tab === "profile")
    return (
      <>
        <PageHeader
          kicker="Account"
          title="Profile"
          description="Personal and coaching details from your verified onboarding."
        />
        <Panel className="max-w-2xl p-6">
          <dl className="grid gap-5 sm:grid-cols-2">
            {[
              ["Name", `${data.profile.firstName} ${data.profile.lastName}`],
              ["Email", data.profile.email],
              [
                "Primary goal",
                data.profile.primaryGoal.trim() || "Not provided",
              ],
              [
                "Program week",
                `${data.profile.weekNumber} of ${data.profile.totalWeeks}`,
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-[var(--cm-text-muted)]">{label}</dt>
                <dd className="mt-1 font-bold">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </>
    );
  if (tab === "billing")
    return (
      <>
        <PageHeader
          kicker="Account"
          title="Billing"
          description="Payment details remain securely hosted by Stripe."
        />
        <Panel className="max-w-2xl p-6">
          <CreditCard className="text-[var(--cm-gold)]" />
          <h2 className="mt-5 text-xl font-bold">
            {data.subscription?.packageName ?? "No active subscription"}
          </h2>
          <p className="mt-2 text-sm text-[var(--cm-text-muted)]">
            Status: {data.subscription?.status ?? "inactive"}
            {data.subscription?.renewsAt
              ? ` · Renews ${new Date(data.subscription.renewsAt).toLocaleDateString()}`
              : ""}
          </p>
          <button
            onClick={billing}
            className="cm-button-primary mt-6 px-5 py-3"
          >
            Manage billing securely
          </button>
          <p className="mt-3 text-xs leading-5 text-[var(--cm-text-muted)]">
            Coach Murray never stores card numbers or security codes.
          </p>
        </Panel>
      </>
    );
  return (
    <>
      <PageHeader
        kicker="Account"
        title="Settings"
        description="Security and session controls."
      />
      <Panel className="max-w-2xl p-6">
        <h2 className="font-bold">Sign out everywhere you use this browser</h2>
        <p className="mt-2 text-sm text-[var(--cm-text-muted)]">
          You can return with a secure email link at any time.
        </p>
        <button
          onClick={() => void signOut()}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--cm-border)] px-4 text-sm font-bold text-[var(--cm-text-soft)]"
        >
          <LogOut size={16} /> Sign out
        </button>
      </Panel>
    </>
  );
}

function Portal() {
  const [active, setActive] = useState<TabId>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [data, setData] = useState<PortalPayload | null>(
    isLocalPreview ? previewData : null
  );
  const [error, setError] = useState("");

  const refreshPortal = useCallback(async () => {
    const nextData = await api.getPortal();
    setData(nextData);
    setError("");
  }, []);

  useEffect(() => {
    if (isLocalPreview) return;
    void refreshPortal().catch(cause =>
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Your dashboard could not be loaded."
      )
    );
  }, [refreshPortal]);

  useEffect(() => {
    if (!sidebarOpen && !moreOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        setMoreOpen(false);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [moreOpen, sidebarOpen]);

  const activeLabel = useMemo(
    () =>
      [...primaryNav, ...accountNav].find(item => item.id === active)?.label ??
      "Overview",
    [active]
  );
  const navigate = (tab: TabId) => {
    setActive(tab);
    setSidebarOpen(false);
    setMoreOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error)
    return (
      <main
        id="main-content"
        className="flex min-h-screen items-center justify-center p-4"
      >
        <Panel className="max-w-md p-7 text-center">
          <h1 className="text-2xl font-extrabold">Dashboard unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--cm-text-muted)]">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="cm-button-primary mt-6 px-5 py-3"
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
        Loading your coaching dashboard…
      </main>
    );

  const content =
    active === "home" ? (
      <Overview data={data} onNavigate={navigate} />
    ) : active === "training" ? (
      <Training data={data} onRefresh={refreshPortal} />
    ) : active === "nutrition" ? (
      <Nutrition data={data} />
    ) : active === "checkins" ? (
      <CheckIns data={data} onRefresh={refreshPortal} />
    ) : active === "progress" ? (
      <Progress data={data} />
    ) : active === "messages" ? (
      <Messages data={data} onRefresh={refreshPortal} />
    ) : active === "library" ? (
      <LibraryPage data={data} />
    ) : (
      <AccountPage
        tab={active as "profile" | "billing" | "settings"}
        data={data}
      />
    );
  const nav = (items: NavItem[]) =>
    items.map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        onClick={() => navigate(id)}
        className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 text-left text-sm font-bold transition ${active === id ? "border-[rgb(212_170_64_/_0.24)] bg-[rgb(212_170_64_/_0.1)] text-[var(--cm-gold-light)]" : "border-transparent text-[var(--cm-text-muted)] hover:bg-[var(--cm-surface-raised)] hover:text-[var(--cm-text)]"}`}
        aria-current={active === id ? "page" : undefined}
      >
        <Icon size={18} />
        <span>{label}</span>
        {id === "messages" &&
          data.messages.some(m => m.sender === "coach" && !m.read) && (
            <span
              className="ml-auto h-2 w-2 rounded-full bg-[var(--cm-gold)]"
              aria-label="Unread messages"
            />
          )}
      </button>
    ));

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-[var(--cm-border)] bg-[var(--cm-surface)] lg:flex">
        <div className="border-b border-[var(--cm-border)] p-5">
          <BrandLockup context="Client Portal" />
        </div>
        <div className="border-b border-[var(--cm-border)] px-5 py-4">
          <p className="text-xs text-[var(--cm-text-muted)]">Signed in as</p>
          <p className="mt-1 truncate text-sm font-bold">
            {data.profile.firstName} {data.profile.lastName}
          </p>
        </div>
        <nav aria-label="Client portal" className="flex-1 overflow-y-auto p-3">
          {nav(primaryNav)}
          <p className="mb-2 mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cm-text-muted)]">
            Account
          </p>
          {nav(accountNav)}
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
            aria-label="Client portal navigation"
            className="relative flex h-full w-[min(82vw,304px)] flex-col border-r border-[var(--cm-border)] bg-[var(--cm-surface)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--cm-border)] p-4">
              <BrandLockup context="Client Portal" />
              <button
                autoFocus
                className="flex h-11 w-11 items-center justify-center"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              >
                <X />
              </button>
            </div>
            <nav className="overflow-y-auto p-3">
              {nav(primaryNav)}
              <p className="mb-2 mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cm-text-muted)]">
                Account
              </p>
              {nav(accountNav)}
            </nav>
          </aside>
        </div>
      )}
      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--cm-border)] bg-[rgb(5_5_7_/_0.9)] px-4 backdrop-blur lg:hidden">
          <button
            className="flex h-11 w-11 items-center justify-center"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </button>
          <strong className="text-sm">{activeLabel}</strong>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(212_170_64_/_0.12)] text-xs font-extrabold text-[var(--cm-gold)]">
            {data.profile.firstName[0]}
            {data.profile.lastName[0]}
          </span>
        </header>
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1320px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8"
        >
          {data.preview && <PreviewNotice />}
          {content}
        </main>
      </div>
      <nav
        aria-label="Mobile client navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--cm-border)] bg-[rgb(12_12_16_/_0.97)] px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur lg:hidden"
      >
        {(
          [
            primaryNav[0],
            primaryNav[1],
            primaryNav[2],
            primaryNav[4],
          ] as NavItem[]
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => navigate(id)}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-bold ${active === id ? "text-[var(--cm-gold-light)]" : "text-[var(--cm-text-muted)]"}`}
            aria-current={active === id ? "page" : undefined}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-bold text-[var(--cm-text-muted)]"
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>
      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <button
            className="absolute inset-0 bg-black/70"
            aria-label="Dismiss more menu"
            onClick={() => setMoreOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-more-title"
            className="relative w-full rounded-t-3xl border-t border-[var(--cm-border)] bg-[var(--cm-surface)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 id="client-more-title" className="text-lg font-extrabold">
                More
              </h2>
              <button
                autoFocus
                onClick={() => setMoreOpen(false)}
                className="flex h-11 w-11 items-center justify-center"
                aria-label="Close more menu"
              >
                <X />
              </button>
            </div>
            {nav([primaryNav[3], primaryNav[5], primaryNav[6], ...accountNav])}
          </section>
        </div>
      )}
    </div>
  );
}

export default function ClientDashboard() {
  return (
    <AccessGate area="client">
      <Portal />
    </AccessGate>
  );
}
