import type { Context } from "@netlify/functions";
import { z } from "zod";
import type { AdminClientDetailPayload } from "../../shared/contracts";
import {
  errorResponse,
  getSupabaseAdmin,
  HttpError,
  json,
  requireCoach,
  requireMethod,
} from "../lib/shared.mts";

type IntakeItem = { label: string; value: string };
type IntakeField = {
  key: string;
  label: string;
  format?: (value: string | number | boolean) => string;
};

const clientIdSchema = z.string().uuid();

const intakeSections: Array<{
  title: string;
  fields: IntakeField[];
}> = [
  {
    title: "Starting point",
    fields: [
      {
        key: "dateOfBirth",
        label: "Date of birth",
        format: value => formatDateOnly(String(value)),
      },
      { key: "gender", label: "Gender" },
      { key: "heightFt", label: "Height (feet)" },
      { key: "heightIn", label: "Height (inches)" },
      {
        key: "currentWeight",
        label: "Current weight",
        format: value => `${value} lb`,
      },
      {
        key: "goalWeight",
        label: "Goal weight",
        format: value => `${value} lb`,
      },
      { key: "experienceLevel", label: "Training experience" },
      { key: "currentProgram", label: "Current program" },
    ],
  },
  {
    title: "Training preferences",
    fields: [
      { key: "daysAvailable", label: "Training days available" },
      { key: "sessionLength", label: "Preferred session length" },
      { key: "equipmentAccess", label: "Equipment access" },
      { key: "gymName", label: "Gym" },
      { key: "exercisesLove", label: "Exercises they enjoy" },
      { key: "exercisesHate", label: "Exercises they avoid" },
      { key: "injuries", label: "Injuries or health considerations" },
      {
        key: "movementRestrictions",
        label: "Movement restrictions",
      },
    ],
  },
  {
    title: "Nutrition",
    fields: [
      { key: "mealsPerDay", label: "Meals per day" },
      { key: "typicalEating", label: "Typical day of eating" },
      { key: "nutritionStruggles", label: "Nutrition challenges" },
      { key: "dietaryRestrictions", label: "Dietary restrictions" },
      { key: "foodAllergies", label: "Food allergies" },
      { key: "foodsLove", label: "Foods they enjoy" },
      { key: "foodsHate", label: "Foods they avoid" },
      { key: "cookingSkill", label: "Cooking confidence" },
      { key: "mealPrepFreq", label: "Meal-prep frequency" },
      { key: "weeklyBudget", label: "Weekly food budget" },
      { key: "supplements", label: "Supplements" },
      { key: "waterIntake", label: "Daily water intake" },
      { key: "alcoholFreq", label: "Alcohol frequency" },
    ],
  },
  {
    title: "Goals and coaching",
    fields: [
      { key: "primaryGoal", label: "Primary goal" },
      { key: "goalTimeline", label: "Goal timeline" },
      { key: "biggestObstacle", label: "Biggest obstacle" },
      { key: "successVision", label: "What success looks like" },
      { key: "previousCoaches", label: "Previous coaching experience" },
      { key: "accountabilityStyle", label: "Preferred accountability" },
    ],
  },
  {
    title: "Lifestyle and schedule",
    fields: [
      { key: "workoutTime", label: "Preferred workout time" },
      { key: "workSchedule", label: "Work schedule" },
      { key: "jobPhysicalDemand", label: "Job activity level" },
      { key: "sleepHours", label: "Typical sleep" },
      { key: "stressLevel", label: "Stress level" },
      { key: "activityLevel", label: "Daily activity level" },
    ],
  },
];

function formatDateOnly(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function humanValue(
  value: unknown,
  format?: IntakeField["format"]
): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return format ? format(trimmed) : trimmed;
  }
  if (typeof value === "number" && Number.isFinite(value))
    return format ? format(value) : String(value);
  if (typeof value === "boolean")
    return format ? format(value) : value ? "Yes" : "No";
  return null;
}

/**
 * Converts stored intake JSON into a deliberate response allowlist. Fields not
 * listed above—including signatureData and any future internal fields—cannot
 * cross the Coach OS API boundary.
 */
export function buildIntakeSections(
  payload: unknown
): Array<{ title: string; items: IntakeItem[] }> {
  const record =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};

  return intakeSections
    .map(section => ({
      title: section.title,
      items: section.fields.flatMap(field => {
        const value = humanValue(record[field.key], field.format);
        return value ? [{ label: field.label, value }] : [];
      }),
    }))
    .filter(section => section.items.length > 0);
}

export default async function handler(request: Request, _context: Context) {
  try {
    requireMethod(request, "GET");
    await requireCoach(request);

    const clientIdResult = clientIdSchema.safeParse(
      new URL(request.url).searchParams.get("client_id")
    );
    if (!clientIdResult.success)
      throw new HttpError(400, "A valid client ID is required.");

    const clientId = clientIdResult.data;
    const supabase = getSupabaseAdmin();
    const profileResult = await supabase
      .from("client_profiles")
      .select(
        "id,first_name,last_name,email,phone,status,account_setup_completed_at,account_invited_at"
      )
      .eq("id", clientId)
      .maybeSingle();

    if (profileResult.error)
      throw new HttpError(500, "Client details could not be loaded.");
    if (!profileResult.data)
      throw new HttpError(404, "Client record was not found.");

    const intakeResult = await supabase
      .from("intake_submissions")
      .select(
        "purchase_id,intake_payload,terms_accepted_at,terms_version,submitted_at,signature_sha256"
      )
      .eq("client_id", clientId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (intakeResult.error)
      throw new HttpError(500, "Client intake could not be loaded.");

    const purchaseQuery = supabase
      .from("purchases")
      .select("package_name,purchased_at")
      .order("purchased_at", { ascending: false })
      .limit(1);
    const purchaseResult = intakeResult.data?.purchase_id
      ? await purchaseQuery
          .eq("id", intakeResult.data.purchase_id)
          .maybeSingle()
      : await purchaseQuery.eq("client_id", clientId).maybeSingle();

    if (purchaseResult.error)
      throw new HttpError(500, "Client purchase could not be loaded.");

    const profile = profileResult.data;
    const intake = intakeResult.data;
    const purchase = purchaseResult.data;
    const payload: AdminClientDetailPayload = {
      profile: {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        email: profile.email,
        ...(profile.phone ? { phone: profile.phone } : {}),
        status: profile.status,
      },
      accountSetup: {
        completed: Boolean(profile.account_setup_completed_at),
        ...(profile.account_invited_at
          ? { invitedAt: profile.account_invited_at }
          : {}),
      },
      purchase: purchase
        ? {
            packageName: purchase.package_name,
            purchasedAt: purchase.purchased_at,
          }
        : null,
      intake: intake
        ? {
            submittedAt: intake.submitted_at,
            termsAcceptedAt: intake.terms_accepted_at,
            termsVersion: intake.terms_version,
            signatureOnFile:
              typeof intake.signature_sha256 === "string" &&
              /^[a-f0-9]{64}$/.test(intake.signature_sha256),
            sections: buildIntakeSections(intake.intake_payload),
          }
        : null,
    };

    return json(200, payload);
  } catch (error) {
    return errorResponse(error);
  }
}
