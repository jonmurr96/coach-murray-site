import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import sessionContext, {
  buildSessionContext,
} from "../netlify/functions/session-context.mts";

const context = {} as never;
const root = path.resolve(import.meta.dirname, "..");

function user(role?: string) {
  return {
    email: "person@example.com",
    app_metadata: role ? { role } : {},
  };
}

describe("account lifecycle session context", () => {
  it("requires a verified bearer session", async () => {
    const response = await sessionContext(
      new Request("https://coach.example/.netlify/functions/session-context"),
      context
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Sign in is required.",
    });
  });

  it("routes signed coach roles from app_metadata to Coach OS", () => {
    expect(buildSessionContext(user("OWNER"), null)).toEqual({
      authenticated: true,
      email: "person@example.com",
      coach: true,
      client: false,
      clientReady: false,
      preferredPath: "/admin",
    });
  });

  it("distinguishes pending, ready, and unlinked client accounts", () => {
    expect(
      buildSessionContext(user(), { account_setup_completed_at: null })
    ).toMatchObject({
      client: true,
      clientReady: false,
      preferredPath: "/account/setup",
    });
    expect(
      buildSessionContext(user(), {
        account_setup_completed_at: "2026-07-10T12:00:00.000Z",
      })
    ).toMatchObject({
      client: true,
      clientReady: true,
      preferredPath: "/dashboard",
    });
    expect(buildSessionContext(user(), null)).toMatchObject({
      client: false,
      clientReady: false,
      preferredPath: null,
    });
  });

  it("gives a dual-role user the stricter Coach OS destination", () => {
    expect(
      buildSessionContext(user("coach"), {
        account_setup_completed_at: "2026-07-10T12:00:00.000Z",
      }).preferredPath
    ).toBe("/admin");
  });
});

describe("account lifecycle migration safeguards", () => {
  const migration = readFileSync(
    path.join(
      root,
      "supabase/migrations/20260710000000_coach_os_canonical.sql"
    ),
    "utf8"
  );
  const explicitSetupMigration = readFileSync(
    path.join(
      root,
      "supabase/migrations/20260712233000_explicit_account_setup_completion.sql"
    ),
    "utf8"
  );
  const explicitPaidOnboardingMigration = readFileSync(
    path.join(
      root,
      "supabase/migrations/20260712234500_paid_onboarding_explicit_setup.sql"
    ),
    "utf8"
  );

  it("tracks invitation and completed setup separately", () => {
    expect(migration).toContain("account_invited_at timestamptz");
    expect(migration).toContain("account_setup_completed_at timestamptz");
    expect(migration).toContain(
      "client_profiles_email_lower_unique on public.client_profiles (lower(email))"
    );
  });

  it("marks setup only after an already-confirmed user changes the temporary password", () => {
    expect(explicitSetupMigration).toContain(
      "old.email_confirmed_at is not null"
    );
    expect(explicitSetupMigration).toContain(
      "new.encrypted_password is distinct from old.encrypted_password"
    );
    expect(explicitSetupMigration).toContain(
      "purchase.payment_status = 'paid'"
    );
    expect(explicitSetupMigration).toContain(
      "purchase.checkout_status = 'complete'"
    );
  });

  it("uses setup completion—not a merely linked user—as portal readiness", () => {
    expect(migration).toContain(
      "v_existing_account_setup_completed_at is not null"
    );
    expect(migration).toContain(
      "v_account_setup_completed_at is not null, true"
    );
    expect(migration).not.toContain("v_existing_user_id is not null");
    expect(explicitPaidOnboardingMigration).toContain(
      "select id, null::timestamptz"
    );
    expect(explicitPaidOnboardingMigration).not.toContain("encrypted_password");
  });
});
