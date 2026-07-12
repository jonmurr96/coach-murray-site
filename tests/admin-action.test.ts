import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { adminActionSchema } from "@shared/contracts";
import adminAction, {
  CLIENT_INVITE_COOLDOWN_MS,
  clientInviteCooldownRemaining,
  resendClientSetupInvite,
} from "../netlify/functions/admin-action.mts";
import { HttpError } from "../netlify/lib/shared.mts";

const clientId = "00000000-0000-4000-8000-000000000011";
const now = new Date("2026-07-10T18:00:00.000Z");
const context = {} as never;

type InviteProfile = {
  id: string;
  email: string;
  account_setup_completed_at: string | null;
  account_invited_at: string | null;
};

function fakeSupabase(
  options: {
    profile?: InviteProfile | null;
    profileError?: object | null;
    intake?: { purchase_id: string } | null;
    intakeError?: object | null;
    purchase?: {
      id: string;
      payment_status: string;
      checkout_status: string;
    } | null;
    purchaseError?: object | null;
    inviteError?: { code?: string; message: string; status?: number } | null;
    inviteThrows?: boolean;
    inviteUser?: object | null;
    updateData?: { id: string } | null;
    updateError?: object | null;
  } = {}
) {
  const order: string[] = [];
  const profile =
    options.profile === undefined
      ? {
          id: clientId,
          email: "client@example.com",
          account_setup_completed_at: null,
          account_invited_at: null,
        }
      : options.profile;
  const intake =
    options.intake === undefined
      ? { purchase_id: "00000000-0000-4000-8000-000000000012" }
      : options.intake;
  const purchase =
    options.purchase === undefined
      ? {
          id: "00000000-0000-4000-8000-000000000012",
          payment_status: "paid",
          checkout_status: "complete",
        }
      : options.purchase;

  const selectBuilder = (data: unknown, error: object | null) => {
    const builder = {
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      maybeSingle: vi.fn(async () => ({ data, error })),
    };
    builder.eq.mockReturnValue(builder);
    builder.order.mockReturnValue(builder);
    builder.limit.mockReturnValue(builder);
    return builder;
  };
  const profileSelect = selectBuilder(profile, options.profileError ?? null);
  const intakeSelect = selectBuilder(intake, options.intakeError ?? null);
  const purchaseSelect = selectBuilder(purchase, options.purchaseError ?? null);

  const updateBuilder = {
    eq: vi.fn(),
    is: vi.fn(),
    select: vi.fn(),
    maybeSingle: vi.fn(async () => ({
      data:
        options.updateData === undefined
          ? { id: clientId }
          : options.updateData,
      error: options.updateError ?? null,
    })),
  };
  updateBuilder.eq.mockReturnValue(updateBuilder);
  updateBuilder.is.mockReturnValue(updateBuilder);
  updateBuilder.select.mockReturnValue(updateBuilder);

  const table = {
    select: vi.fn(() => profileSelect),
    update: vi.fn((payload: unknown) => {
      const invitedAt = (payload as { account_invited_at: string | null })
        .account_invited_at;
      order.push(invitedAt === now.toISOString() ? "claim" : "release");
      return updateBuilder;
    }),
  };
  const intakeTable = { select: vi.fn(() => intakeSelect) };
  const purchaseTable = { select: vi.fn(() => purchaseSelect) };
  const inviteUserByEmail = vi.fn(
    async (_email: string, _options: { redirectTo: string }) => {
      order.push("invite");
      if (options.inviteThrows) throw new Error("network unavailable");
      return {
        data: {
          user:
            options.inviteUser === undefined
              ? { id: "auth-user" }
              : options.inviteUser,
        },
        error: options.inviteError ?? null,
      };
    }
  );
  const client = {
    from: vi.fn((name: string) => {
      if (name === "client_profiles") return table;
      if (name === "intake_submissions") return intakeTable;
      if (name === "purchases") return purchaseTable;
      throw new Error(`Unexpected table: ${name}`);
    }),
    auth: { admin: { inviteUserByEmail } },
  } as unknown as SupabaseClient;

  return { client, inviteUserByEmail, table, updateBuilder, order };
}

async function expectHttpError(
  promise: Promise<unknown>,
  status: number,
  message: RegExp
) {
  try {
    await promise;
    throw new Error("Expected the operation to reject with an HttpError.");
  } catch (error) {
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ status });
    expect((error as Error).message).toMatch(message);
  }
}

describe("coach account setup invitation resend", () => {
  it("accepts only a valid client-scoped resend action", () => {
    expect(
      adminActionSchema.safeParse({
        kind: "resend-client-invite",
        clientId,
      }).success
    ).toBe(true);
    expect(
      adminActionSchema.safeParse({
        kind: "resend-client-invite",
        clientId: "not-a-client-id",
      }).success
    ).toBe(false);
  });

  it("requires a coach session before looking up a client", async () => {
    const response = await adminAction(
      new Request("https://coach.example/.netlify/functions/admin-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://coach.example",
        },
        body: JSON.stringify({ kind: "resend-client-invite", clientId }),
      }),
      context
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Sign in is required.",
    });
  });

  it("enforces a full 15-minute resend cooldown", () => {
    const sentAt = new Date(now.getTime() - CLIENT_INVITE_COOLDOWN_MS + 1);
    expect(clientInviteCooldownRemaining(sentAt.toISOString(), now)).toBe(1);
    expect(
      clientInviteCooldownRemaining(
        new Date(now.getTime() - CLIENT_INVITE_COOLDOWN_MS).toISOString(),
        now
      )
    ).toBe(0);
    expect(clientInviteCooldownRemaining("invalid", now)).toBe(0);
  });

  it("atomically claims the cooldown before sending to the stored client email", async () => {
    const fake = fakeSupabase();
    const result = await resendClientSetupInvite(
      fake.client,
      clientId,
      "https://coach.example",
      now
    );

    expect(result).toEqual({ invitedAt: now.toISOString() });
    expect(fake.inviteUserByEmail).toHaveBeenCalledWith("client@example.com", {
      redirectTo: "https://coach.example/account/confirm",
    });
    expect(fake.order).toEqual(["claim", "invite"]);
    expect(fake.updateBuilder.is).toHaveBeenCalledWith(
      "account_setup_completed_at",
      null
    );
    expect(fake.updateBuilder.is).toHaveBeenCalledWith(
      "account_invited_at",
      null
    );
  });

  it("rejects completed setup and recent invitations without sending", async () => {
    const complete = fakeSupabase({
      profile: {
        id: clientId,
        email: "client@example.com",
        account_setup_completed_at: "2026-07-10T16:00:00.000Z",
        account_invited_at: "2026-07-10T15:00:00.000Z",
      },
    });
    await expectHttpError(
      resendClientSetupInvite(
        complete.client,
        clientId,
        "https://coach.example",
        now
      ),
      409,
      /already completed/i
    );
    expect(complete.inviteUserByEmail).not.toHaveBeenCalled();

    const coolingDown = fakeSupabase({
      profile: {
        id: clientId,
        email: "client@example.com",
        account_setup_completed_at: null,
        account_invited_at: "2026-07-10T17:50:00.000Z",
      },
    });
    await expectHttpError(
      resendClientSetupInvite(
        coolingDown.client,
        clientId,
        "https://coach.example",
        now
      ),
      429,
      /5 minutes/i
    );
    expect(coolingDown.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("requires verified onboarding and a completed paid purchase", async () => {
    const missingIntake = fakeSupabase({ intake: null });
    await expectHttpError(
      resendClientSetupInvite(
        missingIntake.client,
        clientId,
        "https://coach.example",
        now
      ),
      409,
      /verified onboarding/i
    );
    expect(missingIntake.inviteUserByEmail).not.toHaveBeenCalled();

    const unpaid = fakeSupabase({
      purchase: {
        id: "00000000-0000-4000-8000-000000000012",
        payment_status: "unpaid",
        checkout_status: "complete",
      },
    });
    await expectHttpError(
      resendClientSetupInvite(
        unpaid.client,
        clientId,
        "https://coach.example",
        now
      ),
      409,
      /verified payment/i
    );
    expect(unpaid.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("releases the invitation claim when delivery fails", async () => {
    const fake = fakeSupabase({
      inviteError: { message: "SMTP provider unavailable", status: 503 },
    });

    await expectHttpError(
      resendClientSetupInvite(
        fake.client,
        clientId,
        "https://coach.example",
        now
      ),
      502,
      /could not be delivered/i
    );
    expect(fake.table.update).toHaveBeenCalledTimes(2);
    expect(fake.order).toEqual(["claim", "invite", "release"]);
  });

  it("does not send if the invitation claim cannot be persisted", async () => {
    const fake = fakeSupabase({ updateError: { message: "database down" } });

    await expectHttpError(
      resendClientSetupInvite(
        fake.client,
        clientId,
        "https://coach.example",
        now
      ),
      500,
      /could not be reserved.*no setup email was sent/i
    );
    expect(fake.order).toEqual(["claim"]);
    expect(fake.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("allows only one concurrent sender to claim an invitation", async () => {
    const contended = fakeSupabase({ updateData: null });
    await expectHttpError(
      resendClientSetupInvite(
        contended.client,
        clientId,
        "https://coach.example",
        now
      ),
      409,
      /another invitation is already in progress/i
    );
    expect(contended.order).toEqual(["claim"]);
    expect(contended.inviteUserByEmail).not.toHaveBeenCalled();
  });
});
