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
});
