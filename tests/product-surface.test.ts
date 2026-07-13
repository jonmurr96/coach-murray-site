import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

describe("truthful production surfaces", () => {
  it("keeps public check-in promises aligned with the implemented form", () => {
    const landing = read("public/index.html");
    expect(landing).not.toMatch(/progress photos/i);
    expect(landing).not.toMatch(/within 24\s*-\s*48 hours/i);
    expect(landing).toMatch(/weight, energy, adherence, wins, and challenges/i);
  });

  it("uses package-aware cadence and real client session controls", () => {
    const onboarding = read("client/src/pages/OnboardingForm.tsx");
    const dashboard = read("client/src/pages/dashboard/ClientDashboard.tsx");
    expect(onboarding).toMatch(/cadence included in my plan/i);
    expect(dashboard).toMatch(/Progress review/);
    expect(dashboard).toMatch(/Progress trend/);
    expect(dashboard).toMatch(/Account & security/);
    expect(dashboard).toMatch(/Sign out on this device/);
    expect(dashboard).toMatch(/Revoke other device sessions/);
    expect(dashboard).not.toMatch(/Weekly review|Weekly trend/);
  });

  it("does not advertise unconfigured Coach OS providers as destinations", () => {
    const dashboard = read("client/src/pages/admin/AdminDashboard.tsx");
    expect(dashboard).not.toMatch(/id: "calendar"/);
    expect(dashboard).not.toMatch(/id: "automations"/);
    expect(dashboard).toMatch(/Account & Security/);
  });
});
