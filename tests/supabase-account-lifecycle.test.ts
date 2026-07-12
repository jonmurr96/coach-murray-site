// @vitest-environment node

import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const migrationPath = path.join(
  root,
  "supabase/migrations/20260710000000_coach_os_canonical.sql"
);
const hardeningMigrationPath = path.join(
  root,
  "supabase/migrations/20260712180000_security_performance_hardening.sql"
);
const coachRlsMigrationPath = path.join(
  root,
  "supabase/migrations/20260712183000_server_mediated_coach_rls.sql"
);
const leadRlsMigrationPath = path.join(
  root,
  "supabase/migrations/20260712184500_deny_direct_lead_access.sql"
);
const signatureHash = "a".repeat(64);

let db: PGlite;

async function completeOnboarding(sessionId: string, email: string) {
  return db.query<{
    client_id: string;
    portal_ready: boolean;
    intake_created: boolean;
  }>(
    `select * from public.complete_client_onboarding(
      $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11
    )`,
    [
      sessionId,
      `cus_${sessionId}`,
      null,
      "Coaching",
      25000,
      "usd",
      email,
      JSON.stringify({ first_name: "Test", last_name: "Client" }),
      JSON.stringify({ primaryGoal: "Build consistency" }),
      "2026-07-10",
      signatureHash,
    ]
  );
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create schema auth;
    create role anon;
    create role authenticated;
    create role service_role;
    create table auth.users (
      id uuid primary key,
      email text,
      email_confirmed_at timestamptz,
      encrypted_password text,
      raw_app_meta_data jsonb default '{}'::jsonb
    );
    create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  `);
  const migration = readFileSync(migrationPath, "utf8").replace(
    "create extension if not exists pgcrypto;",
    "-- gen_random_uuid is built into the PGlite PostgreSQL validation runtime"
  );
  await db.exec(migration);
  await db.exec(readFileSync(hardeningMigrationPath, "utf8"));
  await db.exec(readFileSync(coachRlsMigrationPath, "utf8"));
  await db.exec(readFileSync(leadRlsMigrationPath, "utf8"));
}, 15_000);

afterAll(async () => {
  await db?.close();
});

describe("Supabase account lifecycle migration", () => {
  it("rejects client emails that differ only by case", async () => {
    await db.query(
      "insert into public.client_profiles (first_name, last_name, email) values ($1, $2, $3)",
      ["Case", "One", "CaseSensitive@example.com"]
    );

    await expect(
      db.query(
        "insert into public.client_profiles (first_name, last_name, email) values ($1, $2, $3)",
        ["Case", "Two", "casesensitive@example.com"]
      )
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("treats a confirmed existing password account as setup-complete", async () => {
    const userId = crypto.randomUUID();
    const email = "ready@example.com";
    await db.query(
      "insert into auth.users (id, email, email_confirmed_at, encrypted_password) values ($1, $2, now(), $3)",
      [userId, email, "hashed-password"]
    );

    const result = await completeOnboarding("cs_ready", email);
    expect(result.rows).toEqual([
      expect.objectContaining({ portal_ready: true, intake_created: true }),
    ]);
    await expect(
      db.query(
        "select user_id, account_setup_completed_at is not null as ready from public.client_profiles where lower(email) = lower($1)",
        [email]
      )
    ).resolves.toMatchObject({ rows: [{ user_id: userId, ready: true }] });
  });

  it("links an invited user at confirmation but opens the portal only after password setup", async () => {
    const userId = crypto.randomUUID();
    const email = "invited@example.com";
    const firstCompletion = await completeOnboarding("cs_invited", email);
    expect(firstCompletion.rows).toEqual([
      expect.objectContaining({ portal_ready: false, intake_created: true }),
    ]);

    await db.query(
      "insert into auth.users (id, email, encrypted_password) values ($1, $2, '')",
      [userId, email]
    );
    await db.query(
      "update auth.users set email_confirmed_at = now() where id = $1",
      [userId]
    );
    await expect(
      db.query(
        "select user_id, account_setup_completed_at from public.client_profiles where lower(email) = lower($1)",
        [email]
      )
    ).resolves.toMatchObject({
      rows: [{ user_id: userId, account_setup_completed_at: null }],
    });

    await db.query(
      "update auth.users set encrypted_password = $2 where id = $1",
      [userId, "hashed-password"]
    );
    await expect(
      db.query(
        "select account_setup_completed_at is not null as ready from public.client_profiles where user_id = $1",
        [userId]
      )
    ).resolves.toMatchObject({ rows: [{ ready: true }] });

    const replay = await completeOnboarding("cs_invited", email);
    expect(replay.rows).toEqual([
      expect.objectContaining({ portal_ready: true, intake_created: false }),
    ]);
  });

  it("does not let an already-linked user claim another paid profile by changing email", async () => {
    const userId = crypto.randomUUID();
    const originalEmail = "linked@example.com";
    const otherEmail = "other-client@example.com";
    await db.query(
      "insert into auth.users (id, email, email_confirmed_at, encrypted_password) values ($1, $2, now(), $3)",
      [userId, originalEmail, "hashed-password"]
    );
    await completeOnboarding("cs_linked", originalEmail);
    await completeOnboarding("cs_other_client", otherEmail);

    await db.query("update auth.users set email = $2 where id = $1", [
      userId,
      otherEmail,
    ]);

    await expect(
      db.query(
        "select email, user_id from public.client_profiles where lower(email) in (lower($1), lower($2)) order by email",
        [originalEmail, otherEmail]
      )
    ).resolves.toMatchObject({
      rows: [
        { email: originalEmail, user_id: userId },
        { email: otherEmail, user_id: null },
      ],
    });
  });

  it("does not link an auth user to an unpaid manually-created profile", async () => {
    const userId = crypto.randomUUID();
    const email = "unpaid@example.com";
    await db.query(
      "insert into public.client_profiles (first_name, last_name, email) values ($1, $2, $3)",
      ["Unpaid", "Profile", email]
    );
    await db.query(
      "insert into auth.users (id, email, email_confirmed_at, encrypted_password) values ($1, $2, now(), $3)",
      [userId, email, "hashed-password"]
    );

    await expect(
      db.query(
        "select user_id, account_setup_completed_at from public.client_profiles where lower(email) = lower($1)",
        [email]
      )
    ).resolves.toMatchObject({
      rows: [{ user_id: null, account_setup_completed_at: null }],
    });
  });
});
