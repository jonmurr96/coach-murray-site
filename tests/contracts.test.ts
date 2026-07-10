import { describe, expect, it } from "vitest";
import {
  adminActionSchema,
  checkoutSessionIdSchema,
  clientActionSchema,
  leadSubmissionSchema,
  onboardingSchema,
  passwordSchema,
  TERMS_VERSION,
} from "@shared/contracts";

const validIntake = {
  checkoutSessionId: "cs_test_1234567890abcdefghijkl",
  firstName: "Avery",
  lastName: "Client",
  email: "AVERY@example.com",
  primaryGoal: "Build strength",
  termsAgreed: true,
  termsVersion: TERMS_VERSION,
  signatureData: "",
  typedSignature: "Avery Client",
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

  it("requires one valid drawn or typed signature", () => {
    expect(
      onboardingSchema.safeParse({
        ...validIntake,
        signatureData: "",
        typedSignature: "",
      }).success
    ).toBe(false);
    expect(
      onboardingSchema.safeParse({
        ...validIntake,
        signatureData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB",
        typedSignature: "",
      }).success
    ).toBe(true);
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

  it("requires a long mixed-case password with a number", () => {
    expect(passwordSchema.safeParse("StrongPassword123").success).toBe(true);
    for (const weak of [
      "Short1",
      "alllowercase123",
      "ALLUPPERCASE123",
      "NoNumbersHere",
    ]) {
      expect(passwordSchema.safeParse(weak).success, weak).toBe(false);
    }
  });

  it("validates complete program and workout lifecycle actions", () => {
    const program = adminActionSchema.parse({
      kind: "publish-program",
      clientId: "00000000-0000-4000-8000-000000000011",
      title: "Foundation phase",
      summary: "Build repeatable movement quality.",
      weeks: 12,
      workouts: [
        {
          title: "Lower body strength",
          day: "Monday",
          durationMinutes: 50,
          notes: "Back squat — 4 × 6 @ RPE 7",
        },
      ],
      nutrition: {
        calories: 2100,
        protein: 165,
        carbs: 220,
        fat: 65,
        notes: "Build meals around protein and produce.",
      },
    });
    expect(program.kind).toBe("publish-program");
    if (program.kind !== "publish-program")
      throw new Error("Expected a publish-program action");
    expect(
      clientActionSchema.safeParse({
        kind: "update-workout",
        workoutId: "00000000-0000-4000-8000-000000000012",
        status: "complete",
      }).success
    ).toBe(true);
    expect(
      adminActionSchema.safeParse({
        ...program,
        workouts: [{ ...program.workouts[0], durationMinutes: 601 }],
      }).success
    ).toBe(false);
  });
});
