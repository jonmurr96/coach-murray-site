import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, LockKeyhole, Mail, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseBrowserClient, sendMagicLink } from "@/lib/auth";
import { hasSupabaseConfig, isLocalPreview } from "@/lib/config";
import { BrandLockup } from "./Brand";

type GateState = "checking" | "allowed" | "signed-out" | "unconfigured";

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
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isLocalPreview) return;
    const client = getSupabaseBrowserClient();
    if (!client || !hasSupabaseConfig) {
      setState("unconfigured");
      return;
    }
    void client.auth
      .getSession()
      .then(({ data }) => setState(data.session ? "allowed" : "signed-out"));
    const { data } = client.auth.onAuthStateChange((_event, session) =>
      setState(session ? "allowed" : "signed-out")
    );
    return () => data.subscription.unsubscribe();
  }, []);

  if (state === "allowed") return <>{children}</>;

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    try {
      await sendMagicLink(email, area === "admin" ? "/admin" : "/dashboard");
      toast.success("Secure sign-in link sent. Check your inbox.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not send the sign-in link."
      );
    } finally {
      setSending(false);
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
          <div className="py-14 text-center text-sm text-[var(--cm-text-muted)]">
            Checking your secure session…
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
        ) : (
          <form className="mt-8" onSubmit={send}>
            <LockKeyhole
              className="mb-4 text-[var(--cm-gold)]"
              aria-hidden="true"
            />
            <h1 id="access-title" className="text-2xl font-extrabold">
              Secure {area === "admin" ? "coach" : "client"} sign in
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--cm-text-soft)]">
              Use the email attached to your coaching account. No password is
              stored on this site.
            </p>
            <label
              htmlFor="access-email"
              className="mt-6 block text-sm font-bold"
            >
              Email address
            </label>
            <div className="relative mt-2">
              <Mail
                className="pointer-events-none absolute left-3 top-3.5 text-[var(--cm-text-muted)]"
                size={18}
                aria-hidden="true"
              />
              <input
                id="access-email"
                className="cm-input pl-10 pr-3"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={event => setEmail(event.target.value)}
              />
            </div>
            <button
              className="cm-button-primary mt-4 w-full px-4 py-3"
              type="submit"
              disabled={sending}
            >
              {sending ? "Sending secure link…" : "Email me a sign-in link"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
