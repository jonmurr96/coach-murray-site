import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  clearSession: vi.fn(),
  getCurrentSession: vi.fn(),
  unsubscribe: vi.fn(),
}));
const apiMocks = vi.hoisted(() => ({ getSessionContext: vi.fn() }));

vi.mock("@/lib/config", () => ({
  hasSupabaseConfig: true,
  isLocalPreview: false,
}));
vi.mock("@/lib/auth", () => ({
  clearSession: authMocks.clearSession,
  getCurrentSession: authMocks.getCurrentSession,
  getSupabaseBrowserClient: () => ({
    auth: {
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: authMocks.unsubscribe } },
      }),
    },
  }),
}));
vi.mock("@/lib/api", () => ({
  api: apiMocks,
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public status: number
    ) {
      super(message);
    }
  },
}));

import { AccessGate } from "@/components/AccessGate";

const pendingClient = {
  authenticated: true,
  email: "client@example.com",
  coach: false,
  client: true,
  clientReady: false,
  preferredPath: "/account/setup",
};

beforeEach(() => {
  vi.clearAllMocks();
  authMocks.getCurrentSession.mockResolvedValue({ access_token: "token" });
});

afterEach(cleanup);

describe("server-preflight dashboard access gate", () => {
  it("does not render client data until the server confirms setup", async () => {
    let resolveContext: (value: typeof pendingClient) => void = () => undefined;
    apiMocks.getSessionContext.mockReturnValue(
      new Promise(resolve => {
        resolveContext = resolve;
      })
    );
    render(
      <AccessGate area="client">
        <div>Private client dashboard</div>
      </AccessGate>
    );

    expect(screen.getByText("Verifying your account access…")).toBeVisible();
    expect(screen.queryByText("Private client dashboard")).toBeNull();
    resolveContext({
      ...pendingClient,
      clientReady: true,
      preferredPath: "/dashboard",
    });
    expect(await screen.findByText("Private client dashboard")).toBeVisible();
  });

  it("keeps an invite session out until password setup completes", async () => {
    apiMocks.getSessionContext.mockResolvedValue(pendingClient);
    render(
      <AccessGate area="client">
        <div>Private client dashboard</div>
      </AccessGate>
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "Finish account setup" })
      ).toBeVisible()
    );
    expect(screen.queryByText("Private client dashboard")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Create account password" })
    ).toHaveAttribute("href", "/account/setup");
  });

  it("does not grant Coach OS to an authenticated non-coach", async () => {
    apiMocks.getSessionContext.mockResolvedValue({
      ...pendingClient,
      clientReady: true,
      preferredPath: "/dashboard",
    });
    render(
      <AccessGate area="admin">
        <div>Private Coach OS</div>
      </AccessGate>
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "Access not authorized" })
      ).toBeVisible()
    );
    expect(screen.queryByText("Private Coach OS")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Continue to your account" })
    ).toHaveAttribute("href", "/dashboard");
  });

  it("routes a signed-out visitor to the correct sign-in screen", async () => {
    authMocks.getCurrentSession.mockResolvedValue(null);
    render(
      <AccessGate area="admin">
        <div>Private Coach OS</div>
      </AccessGate>
    );

    expect(
      await screen.findByRole("link", { name: "Sign in to Coach OS" })
    ).toHaveAttribute("href", "/coach/sign-in");
    expect(apiMocks.getSessionContext).not.toHaveBeenCalled();
  });
});
