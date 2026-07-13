import { z } from "zod";

export const TERMS_VERSION = "2026-07-12" as const;

const optionalText = z.string().trim().max(2_000).optional().default("");
const optionalShortText = z.string().trim().max(240).optional().default("");
const optionalNumber = z.number().finite().nonnegative().optional();

export const checkoutSessionIdSchema = z
  .string()
  .trim()
  .regex(/^cs_(test|live)_[A-Za-z0-9_]{16,}$/i, "Invalid checkout session");

export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(128, "Password is too long")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

function isPngDataUrl(value: string) {
  if (!value.startsWith("data:image/png;base64,")) return false;
  const encoded = value.slice("data:image/png;base64,".length);
  if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return false;
  try {
    const decoded = atob(encoded);
    if (decoded.length < 8) return false;
    return [137, 80, 78, 71, 13, 10, 26, 10].every(
      (byte, index) => decoded.charCodeAt(index) === byte
    );
  } catch {
    return false;
  }
}

export const onboardingSchema = z
  .object({
    checkoutSessionId: checkoutSessionIdSchema,
    website: z.string().max(0).optional().default(""),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform(value => value.toLowerCase()),
    phone: optionalShortText,
    dateOfBirth: optionalShortText,
    gender: optionalShortText,
    heightFt: optionalNumber,
    heightIn: optionalNumber,
    currentWeight: optionalNumber,
    goalWeight: optionalNumber,
    experienceLevel: optionalShortText,
    currentProgram: optionalText,
    daysAvailable: optionalShortText,
    sessionLength: optionalShortText,
    equipmentAccess: optionalShortText,
    gymName: optionalShortText,
    exercisesLove: optionalText,
    exercisesHate: optionalText,
    injuries: optionalText,
    movementRestrictions: optionalText,
    mealsPerDay: optionalShortText,
    typicalEating: optionalText,
    nutritionStruggles: optionalText,
    dietaryRestrictions: optionalText,
    foodAllergies: optionalText,
    foodsLove: optionalText,
    foodsHate: optionalText,
    cookingSkill: optionalShortText,
    mealPrepFreq: optionalShortText,
    weeklyBudget: optionalShortText,
    supplements: optionalText,
    waterIntake: optionalShortText,
    alcoholFreq: optionalShortText,
    primaryGoal: z.string().trim().min(1).max(240),
    goalTimeline: optionalShortText,
    biggestObstacle: optionalText,
    successVision: optionalText,
    previousCoaches: optionalText,
    accountabilityStyle: optionalShortText,
    workoutTime: optionalShortText,
    workSchedule: optionalText,
    jobPhysicalDemand: optionalShortText,
    sleepHours: optionalShortText,
    stressLevel: optionalShortText,
    activityLevel: optionalShortText,
    termsAgreed: z.literal(true),
    termsVersion: z.literal(TERMS_VERSION),
    signatureData: z.string().max(450_000).optional().default(""),
    typedSignature: z.string().trim().max(160).optional().default(""),
  })
  .superRefine((value, context) => {
    if (!value.typedSignature && !value.signatureData) {
      context.addIssue({
        code: "custom",
        path: ["typedSignature"],
        message: "A typed or drawn signature is required",
      });
      return;
    }
    if (value.signatureData && !isPngDataUrl(value.signatureData))
      context.addIssue({
        code: "custom",
        path: ["signatureData"],
        message: "The drawn signature is not a valid PNG image",
      });
  });

export type OnboardingSubmission = z.infer<typeof onboardingSchema>;

export type SessionContextPayload = {
  authenticated: true;
  email: string;
  coach: boolean;
  client: boolean;
  clientReady: boolean;
  preferredPath: "/admin" | "/dashboard" | "/account/setup" | null;
};

export const checkInSchema = z.object({
  kind: z.literal("check-in"),
  weight: z.number().finite().positive().max(1_500).optional(),
  energy: z.number().int().min(1).max(5),
  adherence: z.number().int().min(0).max(100),
  wins: z.string().trim().max(2_000),
  challenges: z.string().trim().max(2_000),
});

export const messageSchema = z.object({
  kind: z.literal("message"),
  body: z.string().trim().min(1).max(5_000),
});

export const clientActionSchema = z.discriminatedUnion("kind", [
  checkInSchema,
  messageSchema,
  z.object({
    kind: z.literal("update-workout"),
    workoutId: z.string().uuid(),
    status: z.enum(["complete", "skipped"]),
  }),
  z.object({
    kind: z.literal("mark-messages-read"),
  }),
]);

export const workoutAssignmentSchema = z.object({
  title: z.string().trim().min(1).max(160),
  day: z.string().trim().min(1).max(80),
  durationMinutes: z.number().int().min(0).max(600),
  notes: z.string().trim().max(2_000).optional().default(""),
});

export const nutritionAssignmentSchema = z.object({
  calories: z.number().int().min(500).max(10_000),
  protein: z.number().int().min(0).max(1_000),
  carbs: z.number().int().min(0).max(2_000),
  fat: z.number().int().min(0).max(1_000),
  notes: z.string().trim().max(5_000).optional().default(""),
});

export const libraryResourceKindSchema = z.enum([
  "guide",
  "training",
  "nutrition",
  "video",
  "worksheet",
]);

export const libraryResourceUrlSchema = z
  .string()
  .trim()
  .min(1, "A resource URL is required")
  .max(2_048, "The resource URL is too long")
  .refine(value => {
    if (/\s/.test(value)) return false;
    if (/^\/[^/\s][^\s]*$/.test(value)) return true;
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Use an HTTPS URL or a same-site path beginning with one slash")
  .transform(value => value.replace(/^https:/i, "https:"));

export const libraryResourceInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  kind: libraryResourceKindSchema,
  url: libraryResourceUrlSchema,
});

export const adminActionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("send-message"),
    clientId: z.string().uuid(),
    body: z.string().trim().min(1).max(5_000),
  }),
  z.object({
    kind: z.literal("publish-program"),
    clientId: z.string().uuid(),
    title: z.string().trim().min(1).max(160),
    summary: z.string().trim().max(5_000),
    weeks: z.number().int().min(1).max(52),
    workouts: z.array(workoutAssignmentSchema).max(21).default([]),
    nutrition: nutritionAssignmentSchema.nullable().optional().default(null),
  }),
  z.object({
    kind: z.literal("update-lead"),
    leadId: z.string().uuid(),
    status: z.enum(["new", "contacted", "qualified", "won", "lost"]),
  }),
  z.object({
    kind: z.literal("review-check-in"),
    checkInId: z.string().uuid(),
  }),
  z.object({
    kind: z.literal("resend-client-invite"),
    clientId: z.string().uuid(),
  }),
  z.object({
    kind: z.literal("create-resource"),
    resource: libraryResourceInputSchema,
  }),
  z.object({
    kind: z.literal("update-resource"),
    resourceId: z.string().uuid(),
    expectedUpdatedAt: z.string().datetime({ offset: true }),
    resource: libraryResourceInputSchema,
  }),
  z.object({
    kind: z.literal("delete-resource"),
    resourceId: z.string().uuid(),
  }),
  z.object({
    kind: z.literal("set-resource-assignment"),
    resourceId: z.string().uuid(),
    clientId: z.string().uuid(),
    assigned: z.boolean(),
  }),
  z.object({
    kind: z.literal("mark-inbox-read"),
  }),
]);

export type ClientAction = z.infer<typeof clientActionSchema>;
export type AdminAction = z.infer<typeof adminActionSchema>;

export const leadSubmissionSchema = z.object({
  kind: z.enum(["application", "quiz"]),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).optional().default(""),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform(value => value.toLowerCase()),
  source: z.string().trim().max(120),
  marketingConsent: z.boolean().default(false),
  website: z.string().max(0).optional().default(""),
  metadata: z.record(z.string(), z.string().max(500)).default({}),
});

export type PortalPayload = {
  preview: boolean;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    primaryGoal: string;
    weekNumber: number;
    totalWeeks: number;
    currentWeight?: number;
    goalWeight?: number;
  };
  program: null | {
    id: string;
    title: string;
    summary: string;
    status: string;
    weeks: number;
  };
  workouts: Array<{
    id: string;
    title: string;
    day: string;
    durationMinutes: number;
    status: string;
    notes: string;
  }>;
  nutrition: null | {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    notes: string;
  };
  checkIns: Array<{
    id: string;
    submittedAt: string;
    adherence: number;
    energy: number;
    weight?: number;
  }>;
  messages: Array<{
    id: string;
    sender: "client" | "coach";
    body: string;
    sentAt: string;
    read: boolean;
  }>;
  progress: Array<{ recordedAt: string; weight?: number; adherence?: number }>;
  library: Array<{ id: string; title: string; kind: string; url: string }>;
  subscription: null | {
    status: string;
    packageName: string;
    renewsAt?: string;
  };
};

export type AdminPayload = {
  preview: boolean;
  coach: { firstName: string; role: string };
  metrics: {
    activeClients: number;
    pendingPlans: number;
    dueCheckIns: number;
    unreadMessages: number;
    monthlyRevenue?: number;
  };
  clients: Array<{
    id: string;
    name: string;
    email: string;
    goal: string;
    status: string;
    weekNumber: number;
    totalWeeks: number;
    adherence?: number;
    lastActive?: string;
  }>;
  checkIns: Array<{
    id: string;
    clientId: string;
    clientName: string;
    submittedAt: string;
    adherence: number;
    energy: number;
    weight?: number;
    wins: string;
    challenges: string;
    reviewed: boolean;
  }>;
  messages: Array<{
    id: string;
    clientId: string;
    clientName: string;
    body: string;
    sentAt: string;
    read: boolean;
  }>;
  leads: Array<{
    id: string;
    name: string;
    email: string;
    source: string;
    status: string;
    createdAt: string;
  }>;
  programs: Array<{
    id: string;
    clientId: string;
    clientName: string;
    title: string;
    status: string;
    updatedAt: string;
  }>;
  payments: Array<{
    id: string;
    clientName: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
};

export type AdminLibraryPayload = {
  resources: Array<{
    id: string;
    title: string;
    kind: z.infer<typeof libraryResourceKindSchema>;
    url: string;
    updatedAt: string;
    assignedClientIds: string[];
  }>;
  clients: Array<{
    id: string;
    name: string;
    status: string;
  }>;
};

export type AdminClientDetailPayload = {
  profile: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
  };
  accountSetup: {
    completed: boolean;
    invitedAt?: string;
  };
  purchase: null | {
    packageName: string;
    purchasedAt: string;
  };
  intake: null | {
    submittedAt: string;
    termsAcceptedAt: string;
    termsVersion: string;
    signatureOnFile: boolean;
    sections: Array<{
      title: string;
      items: Array<{ label: string; value: string }>;
    }>;
  };
};
