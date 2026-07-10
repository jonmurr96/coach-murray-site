import { z } from "zod";

const optionalText = z.string().trim().max(2_000).optional().default("");
const optionalShortText = z.string().trim().max(240).optional().default("");
const optionalNumber = z.number().finite().nonnegative().optional();

export const checkoutSessionIdSchema = z
  .string()
  .trim()
  .regex(/^cs_(test|live)_[A-Za-z0-9_]{16,}$/i, "Invalid checkout session");

export const onboardingSchema = z.object({
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
  signatureData: z
    .string()
    .max(450_000)
    .refine(
      value => value.startsWith("data:image/png;base64,"),
      "Signature is required"
    ),
});

export type OnboardingSubmission = z.infer<typeof onboardingSchema>;

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
]);

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
  }),
  z.object({
    kind: z.literal("update-lead"),
    leadId: z.string().uuid(),
    status: z.enum(["new", "contacted", "qualified", "won", "lost"]),
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
  library: Array<{ id: string; title: string; kind: string; url?: string }>;
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
