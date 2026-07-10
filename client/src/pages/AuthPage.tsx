import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  Settings2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { passwordSchema, type SessionContextPayload } from "@shared/contracts";
import { BrandLockup } from "@/components/Brand";
import { api } from "@/lib/api";
import {
  clearSession,
  getCurrentSession,
  revokeOtherSessions,
  sendPasswordReset,
  signInWithPassword,
  updatePassword,
  verifyEmailToken,
} from "@/lib/auth";
import { hasSupabaseConfig } from "@/lib/config";

export type AuthMode = "client" | "coach" | "confirm" | "setup" | "reset";

const ACCOUNT_EMAIL_KEY = "cm-account-email";
const ACCOUNT_WARNINGS_KEY = "cm-account-warnings";

function storedEmail() {
  try {
    return sessionStorage.getItem(ACCOUNT_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

function clearStoredOnboarding() {
  try {
    sessionStorage.removeItem(ACCOUNT_EMAIL_KEY);
    sessionStorage.removeItem(ACCOUNT_WARNINGS_KEY);
  } catch {
    // Private browsing can disable storage; account access still works.
  }
}

function setupStatus() {
  const value = new URLSearchParams(window.location.search).get("status");
  return value === "invited" || value === "pending" || value === "invite-failed"
    ? value
    : null;
}

function resetDestination(): "/dashboard" | "/admin" {
  return new URLSearchParams(window.location.search).get("next") === "/admin"
    ? "/admin"
    : "/dashboard";
}

function stripAuthArtifacts(mode: AuthMode) {
  const url = new URL(window.location.href);
  const hadAuthHash = /(?:access_token|refresh_token|error|type)=/i.test(
    url.hash
  );
  const authQueryKeys = [
    "code",
    "token",
    "token_hash",
    "type",
    "error",
    "error_code",
    "error_description",
  ];
  const hadAuthQuery = authQueryKeys.some(key => url.searchParams.has(key));
  if (!hadAuthHash && !hadAuthQuery) return;
  for (const key of authQueryKeys) url.searchParams.delete(key);
  url.hash = "";
  if (mode !== "reset") url.searchParams.delete("next");
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}`
  );
}

function destinationFor(context: SessionContextPayload) {
  return context.preferredPath;
}

function ConfigurationCard() {
  return (
    <div className="mt-8">
      <Settings2 className="mb-4 text-[var(--cm-warning)]" aria-hidden="true" />
      <h1 id="auth-title" className="text-2xl font-extrabold">
        Portal setup is not complete
      </h1>
      <p className="mt-3 text-sm leading-6 text-[var(--cm-text-soft)]">
        Sign in stays closed until the production authentication service is
        connected. No credentials were submitted.
      </p>
      <a
        href="/"
        className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--cm-gold)]"
      >
        <ArrowLeft size={16} /> Return to coachmurray.com
      </a>
    </div>
  );
}

function PasswordRequirements({ password }: { password: string }) {
  const requirements = [
    [password.length >= 12, "12 or more characters"],
    [/[a-z]/.test(password), "One lowercase letter"],
    [/[A-Z]/.test(password), "One uppercase letter"],
    [/[0-9]/.test(password), "One number"],
  ] as const;
  return (
    <ul
      className="mt-3 grid gap-1 text-xs text-[var(--cm-text-muted)] sm:grid-cols-2"
      aria-label="Password requirements"
    >
      {requirements.map(([valid, label]) => (
        <li
          key={label}
          className={valid ? "text-[var(--cm-positive)]" : undefined}
        >
          <span aria-hidden="true">{valid ? "✓" : "○"}</span> {label}
        </li>
      ))}
    </ul>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold">
        {label}
      </label>
      <div className="relative mt-2">
        <LockKeyhole
          className="pointer-events-none absolute left-3 top-3.5 text-[var(--cm-text-muted)]"
          size={18}
          aria-hidden="true"
        />
        <input
          id={id}
          className="cm-input py-3 pl-10 pr-12"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={event => onChange(event.target.value)}
        />
        <button
          type="button"
          className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--cm-text-muted)] hover:text-[var(--cm-text)]"
          onClick={() => setVisible(current => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function AccountMismatch({
  context,
  expected,
  onUseAnother,
}: {
  context: SessionContextPayload;
  expected: "client" | "coach";
  onUseAnother: () => void;
}) {
  const destination = destinationFor(context);
  const destinationLabel = context.coach
    ? "Continue to Coach OS"
    : context.clientReady
      ? "Continue to client dashboard"
      : "Finish account setup";
  return (
    <div className="mt-8">
      <ShieldCheck className="mb-4 text-[var(--cm-gold)]" aria-hidden="true" />
      <h1 id="auth-title" className="text-2xl font-extrabold">
        Different account area
      </h1>
      <p className="mt-3 text-sm leading-6 text-[var(--cm-text-soft)]">
        This signed-in account does not have {expected} access. Coach and client
        permissions are verified by the server before any dashboard is shown.
      </p>
      <div className="mt-6 grid gap-3">
        {destination && (
          <a
            className="cm-button-primary inline-flex min-h-11 items-center justify-center px-4 py-3 text-center"
            href={destination}
          >
            {destinationLabel}
          </a>
        )}
        <button
          className="min-h-11 rounded-[var(--cm-radius-md)] border border-[var(--cm-border-strong)] px-4 py-3 font-bold text-[var(--cm-text)]"
          type="button"
          onClick={onUseAnother}
        >
          Use another account
        </button>
      </div>
    </div>
  );
}

function SignInForm({ mode }: { mode: "client" | "coach" }) {
  const destination = mode === "coach" ? "/admin" : "/dashboard";
  const onboardingComplete =
    mode === "client" &&
    new URLSearchParams(window.location.search).get("onboarding") ===
      "complete";
  const [email, setEmail] = useState(storedEmail);
  const [password, setPassword] = useState("");
  const [forgot, setForgot] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mismatch, setMismatch] = useState<SessionContextPayload | null>(null);

  const useAnother = async () => {
    setSubmitting(true);
    try {
      await clearSession();
      setMismatch(null);
      setPassword("");
    } catch {
      setError("The current session could not be cleared. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let active = true;
    void getCurrentSession()
      .then(async session => {
        if (!active || !session) return;
        stripAuthArtifacts(mode);
        const context = await api.getSessionContext();
        if (!active) return;
        const allowed =
          (mode === "coach" && context.coach) ||
          (mode === "client" && context.clientReady);
        if (allowed) {
          window.location.replace(destination);
          return;
        }
        if (mode === "client" && context.client && !context.clientReady) {
          window.location.replace("/account/setup");
          return;
        }
        setMismatch(context);
      })
      .catch(() => {
        if (active)
          setError("Your existing session could not be verified. Try again.");
      });
    return () => {
      active = false;
    };
  }, [destination, mode]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    if (forgot) {
      try {
        await sendPasswordReset(email, destination);
        setRecoverySent(true);
      } catch {
        setError(
          "Password recovery could not be started right now. Wait a moment and try again."
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    let credentialsAccepted = false;
    try {
      await signInWithPassword(email, password);
      credentialsAccepted = true;
      const context = await api.getSessionContext();
      const allowed =
        (mode === "coach" && context.coach) ||
        (mode === "client" && context.clientReady);
      if (allowed) {
        clearStoredOnboarding();
        window.location.replace(destination);
        return;
      }
      if (mode === "client" && context.client && !context.clientReady) {
        window.location.replace("/account/setup");
        return;
      }
      setMismatch(context);
    } catch {
      setError(
        credentialsAccepted
          ? "You are signed in, but account access could not be verified. Wait a moment and try again."
          : "Email or password is incorrect. Try again or reset it below."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (mismatch)
    return (
      <AccountMismatch
        context={mismatch}
        expected={mode}
        onUseAnother={() => void useAnother()}
      />
    );

  return (
    <form className="mt-8" onSubmit={submit} noValidate>
      {recoverySent ? (
        <div aria-live="polite">
          <CheckCircle2
            className="mb-4 text-[var(--cm-positive)]"
            aria-hidden="true"
          />
          <h1 id="auth-title" className="text-2xl font-extrabold">
            Check your email
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--cm-text-soft)]">
            If an account exists for that email, a secure password-reset link is
            on its way. The same message is shown for every address.
          </p>
          <button
            className="mt-6 min-h-11 text-sm font-bold text-[var(--cm-gold)]"
            type="button"
            onClick={() => {
              setForgot(false);
              setRecoverySent(false);
              setError("");
            }}
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <>
          {forgot ? (
            <KeyRound
              className="mb-4 text-[var(--cm-gold)]"
              aria-hidden="true"
            />
          ) : (
            <LockKeyhole
              className="mb-4 text-[var(--cm-gold)]"
              aria-hidden="true"
            />
          )}
          <h1 id="auth-title" className="text-2xl font-extrabold">
            {forgot
              ? `Reset your ${mode === "coach" ? "Coach OS" : "client"} password`
              : mode === "coach"
                ? "Coach OS sign in"
                : "Client sign in"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--cm-text-soft)]">
            {forgot
              ? "Enter the email attached to your account."
              : `Use your ${mode === "coach" ? "authorized coaching" : "coaching account"} credentials.`}
          </p>
          {onboardingComplete && !forgot && (
            <p className="mt-4 rounded-lg border border-[rgb(100_197_144_/_0.35)] bg-[rgb(100_197_144_/_0.08)] p-3 text-sm text-[var(--cm-positive)]">
              Your verified intake is saved. Sign in to continue to your client
              dashboard.
            </p>
          )}
          <label htmlFor="auth-email" className="mt-6 block text-sm font-bold">
            Email address
          </label>
          <div className="relative mt-2">
            <Mail
              className="pointer-events-none absolute left-3 top-3.5 text-[var(--cm-text-muted)]"
              size={18}
              aria-hidden="true"
            />
            <input
              id="auth-email"
              className="cm-input py-3 pl-10 pr-3"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </div>
          {!forgot && (
            <div className="mt-5">
              <PasswordField
                id="auth-password"
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
            </div>
          )}
          {error && (
            <p
              className="mt-4 rounded-lg border border-[rgb(242_119_107_/_0.35)] bg-[rgb(242_119_107_/_0.08)] p-3 text-sm text-[var(--cm-danger)]"
              role="alert"
            >
              {error}
            </p>
          )}
          <button
            className="cm-button-primary mt-5 w-full px-4 py-3"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? forgot
                ? "Requesting secure link…"
                : "Verifying account…"
              : forgot
                ? "Send password-reset link"
                : "Sign in"}
          </button>
          <button
            className="mt-4 min-h-11 w-full text-sm font-bold text-[var(--cm-gold)]"
            type="button"
            onClick={() => {
              setForgot(current => !current);
              setError("");
            }}
          >
            {forgot ? "Back to sign in" : "Forgot your password?"}
          </button>
        </>
      )}
      <div className="mt-7 border-t border-[var(--cm-border)] pt-5 text-center text-xs text-[var(--cm-text-muted)]">
        {mode === "coach" ? (
          <a className="font-bold text-[var(--cm-gold)]" href="/sign-in">
            Client sign in
          </a>
        ) : (
          <div className="space-y-3">
            <p>
              New client? Account creation starts only after verified checkout
              and onboarding.
            </p>
            <a
              className="inline-flex min-h-11 items-center font-bold text-[var(--cm-gold)]"
              href="/coach/sign-in"
            >
              Coach OS sign in
            </a>
          </div>
        )}
      </div>
    </form>
  );
}

function PasswordChangeForm({ mode }: { mode: "setup" | "reset" }) {
  const [state, setState] = useState<
    "checking" | "ready" | "missing" | "invalid"
  >("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const status = useMemo(setupStatus, []);
  const next = useMemo(resetDestination, []);

  useEffect(() => {
    let active = true;
    void getCurrentSession()
      .then(async session => {
        if (!active) return;
        if (!session) {
          setState("missing");
          return;
        }
        stripAuthArtifacts(mode);
        if (mode === "reset") {
          setState("ready");
          return;
        }
        const context = await api.getSessionContext();
        if (!active) return;
        if (context.clientReady) {
          clearStoredOnboarding();
          window.location.replace("/dashboard");
        } else if (context.client) {
          setState("ready");
        } else if (context.coach) {
          window.location.replace("/admin");
        } else {
          setState("invalid");
        }
      })
      .catch(() => {
        if (active) setState("invalid");
      });
    return () => {
      active = false;
    };
  }, [mode]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Choose a stronger password."
      );
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    let passwordUpdated = false;
    try {
      await updatePassword(password);
      passwordUpdated = true;
      if (mode === "reset") {
        try {
          await revokeOtherSessions();
        } catch {
          toast.warning(
            "Password changed, but other signed-in devices could not be revoked automatically."
          );
        }
      }
      const context = await api.getSessionContext();
      const destination = context.preferredPath;
      if (mode === "setup" && !context.clientReady)
        throw new Error(
          "Your password was saved, but the client profile is not ready yet. Contact Coach Murray."
        );
      clearStoredOnboarding();
      toast.success(
        mode === "setup" ? "Account created securely." : "Password updated."
      );
      window.location.replace(
        destination ?? (next === "/admin" ? "/coach/sign-in" : "/sign-in")
      );
    } catch (caught) {
      setError(
        passwordUpdated
          ? mode === "setup"
            ? "Your password was saved, but dashboard access could not be confirmed. Sign in again or contact Coach Murray."
            : "Your password was updated, but account access could not be verified. Return to sign in with the new password."
          : caught instanceof Error
            ? caught.message
            : "Your password could not be updated. Request a new secure link."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (state === "checking")
    return (
      <div
        className="py-14 text-center text-sm text-[var(--cm-text-muted)]"
        aria-live="polite"
      >
        Verifying your secure link…
      </div>
    );

  if (state === "missing") {
    const invitationFailed = mode === "setup" && status === "invite-failed";
    return (
      <div className="mt-8">
        {invitationFailed ? (
          <KeyRound
            className="mb-4 text-[var(--cm-warning)]"
            aria-hidden="true"
          />
        ) : (
          <Mail className="mb-4 text-[var(--cm-gold)]" aria-hidden="true" />
        )}
        <h1 id="auth-title" className="text-2xl font-extrabold">
          {mode === "setup"
            ? invitationFailed
              ? "Account invitation needs attention"
              : "Check your email to create your account"
            : "Reset link required"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--cm-text-soft)]">
          {mode === "setup"
            ? invitationFailed
              ? "Your verified intake is saved. Contact Coach Murray so a fresh account invitation can be sent securely."
              : "Open the secure invitation sent after onboarding, then create your password here. If it expired, Coach Murray can send a fresh invitation."
            : "This password-reset link is missing, expired, or already used. Request a new link from the correct sign-in page."}
        </p>
        <div className="mt-6 grid gap-3">
          {invitationFailed && (
            <a
              className="cm-button-primary inline-flex min-h-11 items-center justify-center px-4 py-3"
              href="mailto:jonmurr.fit@gmail.com?subject=Account%20setup%20invitation"
            >
              Contact Coach Murray
            </a>
          )}
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--cm-radius-md)] border border-[var(--cm-border-strong)] px-4 py-3 font-bold"
            href={next === "/admin" ? "/coach/sign-in" : "/sign-in"}
          >
            {mode === "setup"
              ? "I already have an account"
              : "Request a new link"}
          </a>
        </div>
      </div>
    );
  }

  if (state === "invalid")
    return (
      <div className="mt-8">
        <LockKeyhole
          className="mb-4 text-[var(--cm-danger)]"
          aria-hidden="true"
        />
        <h1 id="auth-title" className="text-2xl font-extrabold">
          Secure link could not be verified
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--cm-text-soft)]">
          This link is invalid, expired, or is not connected to a paid client
          profile. No dashboard access was granted.
        </p>
        <a
          href="/sign-in"
          className="mt-6 inline-flex min-h-11 items-center font-bold text-[var(--cm-gold)]"
        >
          Return to client sign in
        </a>
      </div>
    );

  return (
    <form className="mt-8" onSubmit={submit} noValidate>
      <KeyRound className="mb-4 text-[var(--cm-gold)]" aria-hidden="true" />
      <h1 id="auth-title" className="text-2xl font-extrabold">
        {mode === "setup"
          ? "Create your account password"
          : "Choose a new password"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-[var(--cm-text-soft)]">
        {mode === "setup"
          ? "This final step activates your client dashboard. Your password is sent directly to the authentication service."
          : "After this change, other refresh sessions will be revoked and your account area will be verified again."}
      </p>
      <div className="mt-6">
        <PasswordField
          id="new-password"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <PasswordRequirements password={password} />
      </div>
      <div className="mt-5">
        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
      </div>
      {error && (
        <p
          className="mt-4 rounded-lg border border-[rgb(242_119_107_/_0.35)] bg-[rgb(242_119_107_/_0.08)] p-3 text-sm text-[var(--cm-danger)]"
          role="alert"
        >
          {error}
        </p>
      )}
      <button
        className="cm-button-primary mt-5 w-full px-4 py-3"
        type="submit"
        disabled={submitting}
      >
        {submitting
          ? "Securing your account…"
          : mode === "setup"
            ? "Create account and continue"
            : "Update password and continue"}
      </button>
    </form>
  );
}

function EmailActionConfirmation() {
  // The production templates place the token in the fragment so it is never
  // sent in the static page request or server logs.
  const params = new URLSearchParams(
    window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.search
  );
  const tokenHash = params.get("token_hash")?.trim() ?? "";
  const type = params.get("type");
  const validType = type === "invite" || type === "recovery" ? type : null;
  const validToken =
    tokenHash.length >= 16 &&
    tokenHash.length <= 1_024 &&
    /^[A-Za-z0-9._~-]+$/.test(tokenHash);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    if (!validType || !validToken) return;
    setSubmitting(true);
    setError("");
    try {
      await verifyEmailToken(tokenHash, validType);
      window.history.replaceState(window.history.state, "", "/account/confirm");
      window.location.replace(
        validType === "invite" ? "/account/setup" : "/account/reset"
      );
    } catch {
      setError(
        "This secure email action is invalid, expired, or already used. Request a fresh email and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!validType || !validToken)
    return (
      <div className="mt-8">
        <ShieldAlert
          className="mb-4 text-[var(--cm-danger)]"
          aria-hidden="true"
        />
        <h1 id="auth-title" className="text-2xl font-extrabold">
          Secure email link is invalid
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--cm-text-soft)]">
          The email action is missing its one-time verification token. Nothing
          was confirmed and no account access was granted.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold text-[var(--cm-gold)]">
          <a className="inline-flex min-h-11 items-center" href="/sign-in">
            Client sign in
          </a>
          <a
            className="inline-flex min-h-11 items-center"
            href="/coach/sign-in"
          >
            Coach OS sign in
          </a>
        </div>
      </div>
    );

  return (
    <div className="mt-8">
      <ShieldCheck className="mb-4 text-[var(--cm-gold)]" aria-hidden="true" />
      <h1 id="auth-title" className="text-2xl font-extrabold">
        {validType === "invite"
          ? "Confirm account invitation"
          : "Confirm password recovery"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-[var(--cm-text-soft)]">
        Select continue to use this one-time email action. This deliberate
        second step prevents automated email scanners from consuming the secure
        token before you do.
      </p>
      {error && (
        <p
          className="mt-4 rounded-lg border border-[rgb(242_119_107_/_0.35)] bg-[rgb(242_119_107_/_0.08)] p-3 text-sm text-[var(--cm-danger)]"
          role="alert"
        >
          {error}
        </p>
      )}
      <button
        className="cm-button-primary mt-6 w-full px-4 py-3"
        type="button"
        disabled={submitting}
        onClick={() => void confirm()}
      >
        {submitting ? "Verifying secure token…" : "Continue securely"}
      </button>
    </div>
  );
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const context =
    mode === "coach"
      ? "Coach OS"
      : mode === "client"
        ? "Client Portal"
        : mode === "confirm"
          ? "Secure Email Action"
          : mode === "setup"
            ? "Account Setup"
            : "Password Recovery";

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center px-4 py-12"
    >
      <section
        className="cm-card w-full max-w-md p-6 sm:p-8"
        aria-labelledby="auth-title"
      >
        <BrandLockup context={context} />
        {!hasSupabaseConfig ? (
          <ConfigurationCard />
        ) : mode === "client" || mode === "coach" ? (
          <SignInForm mode={mode} />
        ) : mode === "confirm" ? (
          <EmailActionConfirmation />
        ) : (
          <PasswordChangeForm mode={mode} />
        )}
      </section>
    </main>
  );
}
