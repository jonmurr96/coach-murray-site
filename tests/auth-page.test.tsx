import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  clearSession: vi.fn(),
  getCurrentSession: vi.fn(),
  revokeOtherSessions: vi.fn(),
  sendPasswordReset: vi.fn(),
  signInWithPassword: vi.fn(),
  updatePassword: vi.fn(),
  verifyEmailToken: vi.fn(),
}));

const apiMocks = vi.hoisted(() => ({
  getSessionContext: vi.fn(),
}));

vi.mock("@/lib/auth", () => authMocks);
vi.mock("@/lib/api", () => ({ api: apiMocks }));
vi.mock("@/lib/config", () => ({ hasSupabaseConfig: true }));

import AuthPage from "@/pages/AuthPage";

beforeEach(() => {
  vi.clearAllMocks();
  authMocks.getCurrentSession.mockResolvedValue(null);
  authMocks.clearSession.mockResolvedValue(undefined);
  authMocks.sendPasswordReset.mockResolvedValue(undefined);
  history.replaceState({}, "", "/sign-in");
  sessionStorage.clear();
});

afterEach(cleanup);

describe("account authentication screens", () => {
  it("offers returning clients password sign-in without public signup", async () => {
    render(<AuthPage mode="client" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Client sign in" })
    ).toBeVisible();
    expect(screen.getByLabelText("Email address")).toHaveAttribute(
      "autocomplete",
      "email"
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "current-password"
    );
    expect(screen.getByRole("button", { name: "Sign in" })).toBeVisible();
    expect(screen.queryByRole("button", { name: /sign up/i })).toBeNull();
    expect(
      screen.getByText(/starts only after verified checkout/i)
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Coach OS sign in" })
    ).toHaveAttribute("href", "/coach/sign-in");
    await waitFor(() =>
      expect(authMocks.getCurrentSession).toHaveBeenCalledTimes(1)
    );
  });

  it("uses a non-enumerating client password-recovery response", async () => {
    render(<AuthPage mode="client" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Forgot your password?" })
    );
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "CLIENT@EXAMPLE.COM" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Send password-reset link" })
    );

    await waitFor(() =>
      expect(authMocks.sendPasswordReset).toHaveBeenCalledWith(
        "CLIENT@EXAMPLE.COM",
        "/dashboard"
      )
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Check your email" })
    ).toBeVisible();
    expect(
      screen.getByText(/same message is shown for every address/i)
    ).toBeVisible();
  });

  it("keeps account setup behind the one-time invitation session", async () => {
    history.replaceState({}, "", "/account/setup?status=invited");
    render(<AuthPage mode="setup" />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "Check your email to create your account",
        })
      ).toBeVisible()
    );
    expect(screen.queryByLabelText("New password")).toBeNull();
    expect(
      screen.getByText(/secure invitation sent after onboarding/i)
    ).toBeVisible();
  });

  it("does not consume an emailed token until the human confirms", async () => {
    const tokenHash = "a".repeat(64);
    history.replaceState(
      {},
      "",
      `/account/confirm#token_hash=${tokenHash}&type=invite`
    );
    authMocks.verifyEmailToken.mockRejectedValue(new Error("expired"));
    render(<AuthPage mode="confirm" />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Confirm account invitation",
      })
    ).toBeVisible();
    expect(authMocks.verifyEmailToken).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Continue securely" }));
    await waitFor(() =>
      expect(authMocks.verifyEmailToken).toHaveBeenCalledWith(
        tokenHash,
        "invite"
      )
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /invalid, expired, or already used/i
    );
  });

  it("shows a truthful recovery path when invitation delivery failed", async () => {
    history.replaceState({}, "", "/account/setup?status=invite-failed");
    render(<AuthPage mode="setup" />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "Account invitation needs attention",
        })
      ).toBeVisible()
    );
    expect(
      screen.getByRole("link", { name: "Contact Coach Murray" })
    ).toHaveAttribute("href", expect.stringMatching(/^mailto:/));
  });

  it("allowlists reset destinations instead of following arbitrary URLs", async () => {
    history.replaceState(
      {},
      "",
      "/account/reset?next=https%3A%2F%2Fevil.example"
    );
    render(<AuthPage mode="reset" />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "Reset link required" })
      ).toBeVisible()
    );
    expect(
      screen.getByRole("link", { name: "Request a new link" })
    ).toHaveAttribute("href", "/sign-in");
  });

  it("does not render a client dashboard path for an unlinked signed-in user", async () => {
    authMocks.getCurrentSession.mockResolvedValue({ access_token: "token" });
    apiMocks.getSessionContext.mockResolvedValue({
      authenticated: true,
      email: "unknown@example.com",
      coach: false,
      client: false,
      clientReady: false,
      preferredPath: null,
    });
    render(<AuthPage mode="client" />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "Different account area",
        })
      ).toBeVisible()
    );
    expect(screen.queryByRole("link", { name: /dashboard/i })).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Use another account" })
    );
    await waitFor(() =>
      expect(authMocks.clearSession).toHaveBeenCalledTimes(1)
    );
  });

  it("blocks weak or mismatched passwords before calling Supabase", async () => {
    history.replaceState({}, "", "/account/setup");
    authMocks.getCurrentSession.mockResolvedValue({ access_token: "token" });
    apiMocks.getSessionContext.mockResolvedValue({
      authenticated: true,
      email: "client@example.com",
      coach: false,
      client: true,
      clientReady: false,
      preferredPath: "/account/setup",
    });
    render(<AuthPage mode="setup" />);

    const password = await screen.findByLabelText("New password");
    fireEvent.change(password, { target: { value: "short" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "short" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create account and continue" })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Use at least 12 characters"
    );
    expect(authMocks.updatePassword).not.toHaveBeenCalled();

    fireEvent.change(password, { target: { value: "StrongPassword123" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "StrongPassword124" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create account and continue" })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Passwords do not match"
    );
    expect(authMocks.updatePassword).not.toHaveBeenCalled();
  });
});
