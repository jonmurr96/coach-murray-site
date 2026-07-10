import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  KeyRound,
  LockKeyhole,
  Settings2,
  ShieldAlert,
} from "lucide-react";
import type { SessionContextPayload } from "@shared/contracts";
import { api, ApiError } from "@/lib/api";
import {
  clearSession,
  getCurrentSession,
  getSupabaseBrowserClient,
} from "@/lib/auth";
import { hasSupabaseConfig, isLocalPreview } from "@/lib/config";
import { BrandLockup } from "./Brand";

type GateState =
  | "checking"
  | "allowed"
  | "signed-out"
  | "setup-required"
  | "wrong-area"
  | "unconfigured"
  | "error";

export function AccessGate({
  area,
  children,
}: {
  area: "client" | "admin";
  children: ReactNode;
}) {
  const [state, setState] = useState<GateState>(
    isLocalPreview ? "allowed" : "checking"
  );
  const [context, setContext] = useState<SessionContextPayload | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (isLocalPreview) return;
    if (!hasSupabaseConfig) {
      setState("unconfigured");
      return;
    }
    const client = getSupabaseBrowserClient();
    if (!client) {
      setState("unconfigured");
      return;
    }

    let active = true;
    let verification = 0;
    const verify = async () => {
      const current = ++verification;
      try {
        const session = await getCurrentSession();
        if (!active || current !== verification) return;
        if (!session) {
          setContext(null);
          setState("signed-out");
          return;
        }
        const verified = await api.getSessionContext();
        if (!active || current !== verification) return;
        setContext(verified);
        if (
          (area === "admin" && verified.coach) ||
          (area === "client" && verified.clientReady)
        ) {
          setState("allowed");
        } else if (
          area === "client" &&
          verified.client &&
          !verified.clientReady
        ) {
          setState("setup-required");
        } else {
          setState("wrong-area");
        }
      } catch (error) {
        if (!active || current !== verification) return;
        if (error instanceof ApiError && error.status === 401)
          setState("signed-out");
        else setState("error");
      }
    };

    void verify();
    const { data } = client.auth.onAuthStateChange(() => {
      // Supabase advises keeping auth callbacks synchronous. Defer the server
      // preflight until its internal session work has completed.
      window.setTimeout(() => void verify(), 0);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [area]);

  if (state === "allowed") return <>{children}</>;

  const signInPath = area === "admin" ? "/coach/sign-in" : "/sign-in";
  const useAnotherAccount = async () => {
    setClearing(true);
    try {
      await clearSession();
      window.location.replace(signInPath);
    } catch {
      setState("error");
      setClearing(false);
    }
  };

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center px-4 py-12"
    >
      <section
        className="cm-card w-full max-w-md p-6 sm:p-8"
        aria-labelledby="access-title"
      >
        <BrandLockup
          context={area === "admin" ? "Coach OS" : "Client Portal"}
        />
        {state === "checking" ? (
          <div
            className="py-14 text-center text-sm text-[var(--cm-text-muted)]"
            aria-live="polite"
          >
            Verifying your account access…
          </div>
        ) : state === "unconfigured" ? (
          <div className="mt-8">
            <Settings2
              className="mb-4 text-[var(--cm-warning)]"
              aria-hidden="true"
            />
            <h1 id="access-title" className="text-2xl font-extrabold">
              Portal setup is not complete
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--cm-text-soft)]">
              Authentication is intentionally closed until the production
              Supabase URL and publishable key are configured.
            </p>
            <a
              href="/"
              className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--cm-gold)]"
            >
              <ArrowLeft size={16} /> Return to coachmurray.com
            </a>
          </div>
        ) : state === "signed-out" ? (
          <div className="mt-8">
            <LockKeyhole
              className="mb-4 text-[var(--cm-gold)]"
              aria-hidden="true"
            />
            <h1 id="access-title" className="text-2xl font-extrabold">
              Sign in required
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--cm-text-soft)]">
              Sign in with the credentials attached to your authorized{" "}
              {area === "admin" ? "coaching" : "client"} account.
            </p>
            <a
              className="cm-button-primary mt-6 inline-flex min-h-11 w-full items-center justify-center px-4 py-3"
              href={signInPath}
            >
              {area === "admin" ? "Sign in to Coach OS" : "Client sign in"}
            </a>
          </div>
        ) : state === "setup-required" ? (
          <div className="mt-8">
            <KeyRound
              className="mb-4 text-[var(--cm-gold)]"
              aria-hidden="true"
            />
            <h1 id="access-title" className="text-2xl font-extrabold">
              Finish account setup
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--cm-text-soft)]">
              Your paid client profile is linked, but a password must be created
              before the dashboard can open.
            </p>
            <a
              className="cm-button-primary mt-6 inline-flex min-h-11 w-full items-center justify-center px-4 py-3"
              href="/account/setup"
            >
              Create account password
            </a>
          </div>
        ) : state === "wrong-area" ? (
          <div className="mt-8">
            <ShieldAlert
              className="mb-4 text-[var(--cm-warning)]"
              aria-hidden="true"
            />
            <h1 id="access-title" className="text-2xl font-extrabold">
              Access not authorized
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--cm-text-soft)]">
              This account does not have access to the requested area. Client
              and coach roles are verified by the server.
            </p>
            <div className="mt-6 grid gap-3">
              {context?.preferredPath && (
                <a
                  className="cm-button-primary inline-flex min-h-11 items-center justify-center px-4 py-3"
                  href={context.preferredPath}
                >
                  Continue to your account
                </a>
              )}
              <button
                className="min-h-11 rounded-[var(--cm-radius-md)] border border-[var(--cm-border-strong)] px-4 py-3 font-bold"
                type="button"
                disabled={clearing}
                onClick={() => void useAnotherAccount()}
              >
                {clearing ? "Clearing session…" : "Use another account"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <LockKeyhole
              className="mb-4 text-[var(--cm-danger)]"
              aria-hidden="true"
            />
            <h1 id="access-title" className="text-2xl font-extrabold">
              Session check unavailable
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--cm-text-soft)]">
              Account access could not be verified, so the dashboard stayed
              closed. Nothing was changed.
            </p>
            <button
              className="cm-button-primary mt-6 px-5 py-3"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
