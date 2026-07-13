import { describe, expect, it } from "vitest";
import adminClientDetail, {
  buildIntakeSections,
} from "../netlify/functions/admin-client-detail.mts";

const context = {} as never;

describe("Coach OS intake review boundary", () => {
  it("requires authentication before returning client details", async () => {
    const response = await adminClientDetail(
      new Request(
        "https://coach.example/.netlify/functions/admin-client-detail?client_id=00000000-0000-4000-8000-000000000011"
      ),
      context
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Sign in is required.",
    });
  });

  it("returns only allowlisted, human-readable intake answers", () => {
    const sections = buildIntakeSections({
      dateOfBirth: "1992-05-09",
      currentWeight: 185,
      primaryGoal: "Build strength",
      exercisesLove: "Squats and rows",
      termsAgreed: true,
      signatureData: "data:image/png;base64,raw-signature",
      internalNote: "never expose this",
      nestedSecret: { token: "also hidden" },
    });
    const responseText = JSON.stringify(sections);

    expect(sections).toContainEqual(
      expect.objectContaining({
        title: "Starting point",
        items: expect.arrayContaining([
          { label: "Date of birth", value: "May 9, 1992" },
          { label: "Current weight", value: "185 lb" },
        ]),
      })
    );
    expect(responseText).toContain("Build strength");
    expect(responseText).not.toContain("raw-signature");
    expect(responseText).not.toContain("never expose this");
    expect(responseText).not.toContain("also hidden");
    expect(responseText).not.toContain("termsAgreed");
  });
});
