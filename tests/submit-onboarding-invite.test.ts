import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { ensureClientAccountInvitation } from "../netlify/functions/submit-onboarding.mts";

const clientId = "00000000-0000-4000-8000-000000000011";
const now = new Date("2026-07-10T19:00:00.000Z");

function fakeSupabase(
  options: {
    claimData?: { id: string } | null;
    claimError?: object | null;
    inviteError?: { code?: string; message: string } | null;
    inviteThrows?: boolean;
  } = {}
) {
  const order: string[] = [];
  const builder = {
    eq: vi.fn(),
    is: vi.fn(),
    select: vi.fn(),
    maybeSingle: vi.fn(async () => ({
      data:
        options.claimData === undefined ? { id: clientId } : options.claimData,
      error: options.claimError ?? null,
    })),
  };
  builder.eq.mockReturnValue(builder);
  builder.is.mockReturnValue(builder);
  builder.select.mockReturnValue(builder);

  const table = {
    update: vi.fn((payload: { account_invited_at: string | null }) => {
      order.push(payload.account_invited_at ? "claim" : "release");
      return builder;
    }),
  };
  const inviteUserByEmail = vi.fn(async () => {
    order.push("invite");
    if (options.inviteThrows) throw new Error("network unavailable");
    return {
      data: { user: options.inviteError ? null : { id: "auth-user" } },
      error: options.inviteError ?? null,
    };
  });
  const client = {
    from: vi.fn(() => table),
    auth: { admin: { inviteUserByEmail } },
  } as unknown as SupabaseClient;
  return { client, order, table, inviteUserByEmail, builder };
}

function inviteInput(
  overrides: Partial<{
    intakeCreated: boolean;
    portalReady: boolean;
  }> = {}
) {
  return {
    clientId,
    email: "client@example.com",
    portalOrigin: "https://coach.example",
    intakeCreated: true,
    portalReady: false,
    now,
    ...overrides,
  };
}

describe("paid onboarding account invitation boundary", () => {
  it("sends the first invitation only after atomically claiming the client", async () => {
    const fake = fakeSupabase();
    await expect(
      ensureClientAccountInvitation(fake.client, inviteInput())
    ).resolves.toEqual({ accountState: "invited", warnings: [] });
    expect(fake.order).toEqual(["claim", "invite"]);
    expect(fake.inviteUserByEmail).toHaveBeenCalledWith("client@example.com", {
      redirectTo: "https://coach.example/account/setup",
    });
    expect(fake.builder.is).toHaveBeenCalledWith("account_invited_at", null);
  });

  it("never sends again for a replayed immutable intake", async () => {
    const fake = fakeSupabase();
    const result = await ensureClientAccountInvitation(
      fake.client,
      inviteInput({ intakeCreated: false })
    );
    expect(result.accountState).toBe("setup-pending");
    expect(result.warnings[0]).toMatch(/original account invitation/i);
    expect(fake.table.update).not.toHaveBeenCalled();
    expect(fake.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("allows only one concurrent request to win the delivery claim", async () => {
    const contended = fakeSupabase({ claimData: null });
    const result = await ensureClientAccountInvitation(
      contended.client,
      inviteInput()
    );
    expect(result.accountState).toBe("setup-pending");
    expect(contended.order).toEqual(["claim"]);
    expect(contended.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("does not invite when the client already completed setup", async () => {
    const fake = fakeSupabase();
    await expect(
      ensureClientAccountInvitation(
        fake.client,
        inviteInput({ portalReady: true })
      )
    ).resolves.toEqual({ accountState: "existing", warnings: [] });
    expect(fake.order).toEqual([]);
  });

  it("releases the claim and reports existing users without rotating access", async () => {
    const fake = fakeSupabase({
      inviteError: {
        code: "user_already_exists",
        message: "User already registered",
      },
    });
    const result = await ensureClientAccountInvitation(
      fake.client,
      inviteInput()
    );
    expect(result.accountState).toBe("existing");
    expect(result.warnings[0]).toMatch(/sign in or reset/i);
    expect(fake.order).toEqual(["claim", "invite", "release"]);
  });

  it("fails truthfully without leaving a delivery claim after an outage", async () => {
    const fake = fakeSupabase({ inviteThrows: true });
    const result = await ensureClientAccountInvitation(
      fake.client,
      inviteInput()
    );
    expect(result.accountState).toBe("invite-failed");
    expect(result.warnings[0]).toMatch(/could not be sent/i);
    expect(fake.order).toEqual(["claim", "invite", "release"]);
  });
});
