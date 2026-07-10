import { describe, expect, it } from "vitest";
import {
  checkoutSessionIdSchema,
  leadSubmissionSchema,
  onboardingSchema,
} from "@shared/contracts";

const validIntake = {
  checkoutSessionId: "cs_test_1234567890abcdefghijkl",
  firstName: "Avery",
  lastName: "Client",
  email: "AVERY@example.com",
  primaryGoal: "Build strength",
  termsAgreed: true,
  signatureData: `data:image/png;base64,${btoa("signature")}`,
};

describe("shared request contracts", () => {
  it("normalizes a valid verified intake", () => {
    const result = onboardingSchema.parse(validIntake);
    expect(result.email).toBe("avery@example.com");
    expect(result.termsAgreed).toBe(true);
  });

  it("rejects forged checkout IDs and missing agreement", () => {
    expect(checkoutSessionIdSchema.safeParse("cs_test_000").success).toBe(
      false
    );
    expect(
      onboardingSchema.safeParse({
        ...validIntake,
        checkoutSessionId: "cs_test_000",
      }).success
    ).toBe(false);
    expect(
      onboardingSchema.safeParse({ ...validIntake, termsAgreed: false }).success
    ).toBe(false);
  });

  it("rejects oversized or non-image signatures", () => {
    expect(
      onboardingSchema.safeParse({ ...validIntake, signatureData: "signed" })
        .success
    ).toBe(false);
    expect(
      onboardingSchema.safeParse({
        ...validIntake,
        signatureData: `data:image/png;base64,${"a".repeat(450_001)}`,
      }).success
    ).toBe(false);
  });

  it("validates and normalizes lead submissions", () => {
    const result = leadSubmissionSchema.parse({
      kind: "quiz",
      firstName: " Avery ",
      email: "AVERY@EXAMPLE.COM",
      source: "coaching quiz",
      marketingConsent: true,
      metadata: { recommended_package: "coaching" },
    });
    expect(result.firstName).toBe("Avery");
    expect(result.email).toBe("avery@example.com");
  });
});
