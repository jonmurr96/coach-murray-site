import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "@/lib/api";

describe("browser API client", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns parsed data only after a successful response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          verified: true,
          email: "client@example.com",
          packageName: "Full Coaching",
        }),
        { status: 200 }
      )
    );
    await expect(
      api.verifyCheckout("cs_test_1234567890abcdefghijkl")
    ).resolves.toMatchObject({ verified: true, packageName: "Full Coaching" });
  });

  it("preserves a truthful server error and status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Checkout is not complete." }), {
        status: 403,
      })
    );
    await expect(
      api.verifyCheckout("cs_test_1234567890abcdefghijkl")
    ).rejects.toEqual(
      expect.objectContaining<ApiError>({
        name: "ApiError",
        message: "Checkout is not complete.",
        status: 403,
      })
    );
  });

  it("requests an allowlisted Coach OS intake detail by client ID", async () => {
    const payload = {
      profile: {
        id: "00000000-0000-4000-8000-000000000011",
        name: "Client A",
        email: "client@example.com",
        status: "active",
      },
      purchase: null,
      intake: null,
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(payload), { status: 200 })
      );

    await expect(
      api.getAdminClientDetail("00000000-0000-4000-8000-000000000011")
    ).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "/.netlify/functions/admin-client-detail?client_id=00000000-0000-4000-8000-000000000011",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("loads the coach resource library through its dedicated boundary", async () => {
    const payload = { resources: [], clients: [] };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(payload), { status: 200 })
      );

    await expect(api.getAdminLibrary()).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "/.netlify/functions/admin-library",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });
});
