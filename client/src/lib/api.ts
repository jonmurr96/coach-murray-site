import type {
  AdminAction,
  AdminPayload,
  ClientAction,
  PortalPayload,
} from "@shared/contracts";
import { getAccessToken } from "./auth";

type ApiErrorBody = { error?: string; detail?: string };

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`/.netlify/functions/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  const body = (await response.json().catch(() => ({}))) as ApiErrorBody | T;
  if (!response.ok) {
    const error = body as ApiErrorBody;
    throw new ApiError(
      error.error ?? "The request could not be completed.",
      response.status
    );
  }
  return body as T;
}

export const api = {
  verifyCheckout(sessionId: string) {
    return request<{ verified: true; email: string; packageName: string }>(
      `verify-checkout?session_id=${encodeURIComponent(sessionId)}`
    );
  },
  submitOnboarding(payload: unknown) {
    return request<{ saved: true; portalReady: boolean; warnings: string[] }>(
      "submit-onboarding",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },
  getPortal() {
    return request<PortalPayload>("dashboard");
  },
  getAdmin() {
    return request<AdminPayload>("admin-data");
  },
  clientAction(payload: ClientAction) {
    return request<{ saved: true }>("client-action", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  adminAction(payload: AdminAction) {
    return request<{ saved: true }>("admin-action", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  createBillingPortal() {
    return request<{ url: string }>("billing-portal", {
      method: "POST",
      body: "{}",
    });
  },
};
