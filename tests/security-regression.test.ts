import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

function filesUnder(relative: string): string[] {
  const absolute = path.join(root, relative);
  return readdirSync(absolute).flatMap(entry => {
    const child = path.join(absolute, entry);
    return statSync(child).isDirectory()
      ? filesUnder(path.relative(root, child))
      : [child];
  });
}

describe("security regressions", () => {
  it("keeps legacy browser credentials and raw payment fields out of deployable source", () => {
    const files = [...filesUnder("public"), ...filesUnder("client/src")];
    const source = files
      .filter(file => /\.(html|ts|tsx|js|css)$/.test(file))
      .map(file => readFileSync(file, "utf8"))
      .join("\n");
    expect(source).not.toMatch(
      /coachmurray2026|service_role|sk_live_|whsec_|ANTHROPIC_API_KEY/
    );
    expect(source).not.toMatch(/Card Number|\bCVC\b|dangerouslySetInnerHTML/);
    expect(source).not.toMatch(/https:\/\/[a-z]+\.supabase\.co/);
  });

  it("does not use randomness or claim an unsent quiz email", () => {
    const quiz = readFileSync(path.join(root, "public/quiz.html"), "utf8");
    expect(quiz).not.toContain("Math.random");
    expect(quiz).not.toContain("on its way");
    expect(quiz).toContain("5-day-cutting-blueprint.pdf");
  });

  it("keeps the landing page landmark, metadata, and stable hero rendering", () => {
    const landing = readFileSync(path.join(root, "public/index.html"), "utf8");
    expect(landing).toMatch(/<meta name="description"/);
    expect(landing).toContain("<main>");
    expect(landing).not.toContain('<h1 data-reveal="letters"');
    expect(landing).toContain("--tm:#96938B");
  });

  it("publishes only the generated dist directory", () => {
    const netlify = readFileSync(path.join(root, "netlify.toml"), "utf8");
    expect(netlify).toContain('publish = "dist"');
    expect(netlify).not.toContain('publish = "."');
  });

  it("keeps checkout authorization and redirect origins fail-closed", () => {
    const shared = readFileSync(
      path.join(root, "netlify/lib/shared.mts"),
      "utf8"
    );
    expect(shared).toContain("STRIPE_ALLOWED_PAYMENT_LINK_IDS");
    expect(shared).not.toContain('payment_status === "no_payment_required"');
    expect(shared).not.toContain(
      'env("SITE_URL") ?? "https://coach-murray.netlify.app"'
    );
  });

  it("restricts unpublished and unassigned Supabase content", () => {
    const migration = readFileSync(
      path.join(
        root,
        "supabase/migrations/20260710000000_coach_os_canonical.sql"
      ),
      "utf8"
    );
    expect(migration).toContain('"clients read own active programs"');
    expect(migration).toContain('"clients read own active workouts"');
    expect(migration).toContain('"clients read own active nutrition"');
    expect(migration).toContain('"clients read assigned resources"');
    expect(migration).not.toContain('"authenticated read resources"');
    expect(migration).not.toMatch(
      /on conflict \(purchase_id\) do update set intake_payload/i
    );
    expect(migration).toContain("record_lead_submission");
    expect(migration).toContain(
      "revoke all on function public.handle_auth_user_link() from public, anon, authenticated"
    );
    expect(migration).toContain("user_id = (select auth.uid())");
    expect(migration).toContain("intake_submissions_client_idx");
    expect(migration).toContain("workouts_program_idx");
    expect(migration).not.toContain('create policy "coaches manage');
    expect(migration).toContain('create policy "deny direct lead access"');
  });

  it("keeps hosted auth invite-only and email actions scanner-safe", () => {
    const config = readFileSync(
      path.join(root, "supabase/config.toml"),
      "utf8"
    );
    const invite = readFileSync(
      path.join(root, "supabase/templates/invite.html"),
      "utf8"
    );
    const recovery = readFileSync(
      path.join(root, "supabase/templates/recovery.html"),
      "utf8"
    );
    const onboarding = readFileSync(
      path.join(root, "netlify/functions/submit-onboarding.mts"),
      "utf8"
    );
    const adminAction = readFileSync(
      path.join(root, "netlify/functions/admin-action.mts"),
      "utf8"
    );
    const browserAuth = readFileSync(
      path.join(root, "client/src/lib/auth.ts"),
      "utf8"
    );

    expect(config).toContain(
      'site_url = "https://coach-murray.netlify.app"'
    );
    expect(config).toContain("enable_signup = false");
    expect(config).toContain("minimum_password_length = 12");
    expect(config).toContain(
      'password_requirements = "lower_upper_letters_digits"'
    );
    expect(config).toContain(
      '"https://coach-murray.netlify.app/account/confirm**"'
    );
    expect(invite).toContain(
      "{{ .RedirectTo }}#token_hash={{ .TokenHash }}&amp;type=invite"
    );
    expect(recovery).toContain(
      "{{ .RedirectTo }}#token_hash={{ .TokenHash }}&amp;type=recovery"
    );
    expect(`${invite}\n${recovery}`).not.toContain(".ConfirmationURL");
    expect(onboarding).toContain("/account/confirm");
    expect(adminAction).toContain("/account/confirm");
    expect(browserAuth).toContain('new URL("/account/confirm"');
  });
});
