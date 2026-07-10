import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";
import { BrandMark } from "@/components/Brand";
import { api } from "@/lib/api";
import { isLocalPreview } from "@/lib/config";

// ── Types ──────────────────────────────────────────────────────────────────
interface FormData {
  // Step 1
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  heightFt: string;
  heightIn: string;
  currentWeight: string;
  goalWeight: string;
  // Step 2
  experienceLevel: string;
  currentProgram: string;
  daysAvailable: string;
  sessionLength: string;
  equipmentAccess: string;
  gymName: string;
  exercisesLove: string;
  exercisesHate: string;
  injuries: string;
  movementRestrictions: string;
  // Step 3
  mealsPerDay: string;
  typicalEating: string;
  nutritionStruggles: string;
  dietaryRestrictions: string;
  foodAllergies: string;
  foodsLove: string;
  foodsHate: string;
  cookingSkill: string;
  mealPrepFreq: string;
  weeklyBudget: string;
  supplements: string;
  waterIntake: string;
  alcoholFreq: string;
  // Step 4
  primaryGoal: string;
  goalTimeline: string;
  biggestObstacle: string;
  successVision: string;
  previousCoaches: string;
  accountabilityStyle: string;
  workoutTime: string;
  // Step 5
  workSchedule: string;
  jobPhysicalDemand: string;
  sleepHours: string;
  stressLevel: string;
  activityLevel: string;
  // Step 6
  termsAgreed: boolean;
  signatureData: string;
  typedSignature: string;
}

const initialData: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  heightFt: "",
  heightIn: "",
  currentWeight: "",
  goalWeight: "",
  experienceLevel: "",
  currentProgram: "",
  daysAvailable: "",
  sessionLength: "",
  equipmentAccess: "",
  gymName: "",
  exercisesLove: "",
  exercisesHate: "",
  injuries: "",
  movementRestrictions: "",
  mealsPerDay: "",
  typicalEating: "",
  nutritionStruggles: "",
  dietaryRestrictions: "",
  foodAllergies: "",
  foodsLove: "",
  foodsHate: "",
  cookingSkill: "",
  mealPrepFreq: "",
  weeklyBudget: "",
  supplements: "",
  waterIntake: "",
  alcoholFreq: "",
  primaryGoal: "",
  goalTimeline: "",
  biggestObstacle: "",
  successVision: "",
  previousCoaches: "",
  accountabilityStyle: "",
  workoutTime: "",
  workSchedule: "",
  jobPhysicalDemand: "",
  sleepHours: "",
  stressLevel: "",
  activityLevel: "",
  termsAgreed: false,
  signatureData: "",
  typedSignature: "",
};

const STEPS = [
  "Personal Info",
  "Fitness History",
  "Nutrition",
  "Goals",
  "Lifestyle",
  "Agreement",
];

// ── Reusable field components ──────────────────────────────────────────────
const FieldIdContext = createContext<string | undefined>(undefined);

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  const fieldId = useContext(FieldIdContext);
  return (
    <label
      id={fieldId}
      className="mb-1.5 block text-sm font-semibold text-[var(--cm-text)]"
    >
      {children}{" "}
      {required && (
        <span className="text-[var(--cm-gold-light)]" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
}) {
  const fieldId = useContext(FieldIdContext);
  return (
    <input
      aria-labelledby={fieldId}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      readOnly={readOnly}
      className="cm-input px-4 py-3 text-sm placeholder:text-[var(--cm-text-muted)]"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const fieldId = useContext(FieldIdContext);
  return (
    <textarea
      aria-labelledby={fieldId}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="cm-input resize-none px-4 py-3 text-sm placeholder:text-[var(--cm-text-muted)]"
    />
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const fieldId = useContext(FieldIdContext);
  return (
    <select
      aria-labelledby={fieldId}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="cm-input px-4 py-3 text-sm"
      style={{
        background: "#1A1A1A",
        border: "1px solid #2A2A2A",
        color: value ? "#fff" : "#666",
      }}
    >
      <option value="" disabled>
        {placeholder || "Select..."}
      </option>
      {options.map(o => (
        <option
          key={o}
          value={o}
          style={{ color: "#fff", background: "#1A1A1A" }}
        >
          {o}
        </option>
      ))}
    </select>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  const id = useId();
  return (
    <FieldIdContext.Provider value={`field-${id.replaceAll(":", "")}`}>
      <div className="mb-5">{children}</div>
    </FieldIdContext.Provider>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold text-[var(--cm-text)]">{children}</h3>
      <div className="mt-2 h-0.5 rounded-full bg-gradient-to-r from-[var(--cm-gold)] to-transparent" />
    </div>
  );
}

// ── Signature Canvas ───────────────────────────────────────────────────────
function SignatureCanvas({ onSign }: { onSign: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);
  const onSignRef = useRef(onSign);

  useEffect(() => {
    onSignRef.current = onSign;
  }, [onSign]);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "#C9A84C";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawing.current = true;
      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };
    const draw = (e: MouseEvent | TouchEvent) => {
      if (!drawing.current) return;
      e.preventDefault();
      const pos = getPos(e, canvas);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };
    const stop = () => {
      if (!drawing.current) return;
      drawing.current = false;
      setHasSignature(true);
      onSignRef.current(canvas.toDataURL());
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stop);
    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stop);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stop);
    };
  }, []);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignRef.current("");
  };

  return (
    <div>
      <div
        className="relative rounded-lg overflow-hidden"
        style={{ border: "1px solid #2A2A2A", background: "#111" }}
      >
        <canvas
          ref={canvasRef}
          id="sigCanvas"
          width={600}
          height={150}
          className="block w-full"
          role="img"
          aria-label="Signature drawing area"
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-600 text-sm italic">
              Sign here with your mouse or finger
            </span>
          </div>
        )}
      </div>
      {hasSignature && (
        <button
          type="button"
          onClick={clear}
          className="mt-2 min-h-11 text-xs text-[var(--cm-text-muted)] transition-colors hover:text-[var(--cm-gold-light)]"
        >
          Clear signature
        </button>
      )}
    </div>
  );
}

// ── Step Components ────────────────────────────────────────────────────────
function Step1({
  d,
  u,
}: {
  d: FormData;
  u: (k: keyof FormData, v: string) => void;
}) {
  return (
    <div>
      <SectionTitle>Personal Information</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup>
          <Label required>First Name</Label>
          <Input
            value={d.firstName}
            onChange={v => u("firstName", v)}
            placeholder="Ciara"
            required
          />
        </FieldGroup>
        <FieldGroup>
          <Label required>Last Name</Label>
          <Input
            value={d.lastName}
            onChange={v => u("lastName", v)}
            placeholder="Cyphers-Miller"
            required
          />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label required>
          Email Address{" "}
          <span className="font-normal text-[var(--cm-text-muted)]">
            (from checkout)
          </span>
        </Label>
        <Input
          value={d.email}
          onChange={v => u("email", v)}
          placeholder="you@email.com"
          type="email"
          required
          readOnly
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Phone Number</Label>
        <Input
          value={d.phone}
          onChange={v => u("phone", v)}
          placeholder="(555) 000-0000"
          type="tel"
        />
      </FieldGroup>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup>
          <Label>Date of Birth</Label>
          <Input
            value={d.dateOfBirth}
            onChange={v => u("dateOfBirth", v)}
            type="date"
          />
        </FieldGroup>
        <FieldGroup>
          <Label>Gender</Label>
          <Select
            value={d.gender}
            onChange={v => u("gender", v)}
            placeholder="Select gender"
            options={["Female", "Male", "Non-binary", "Prefer not to say"]}
          />
        </FieldGroup>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <FieldGroup>
          <Label>Height (ft)</Label>
          <Input
            value={d.heightFt}
            onChange={v => u("heightFt", v)}
            placeholder="5"
            type="number"
          />
        </FieldGroup>
        <FieldGroup>
          <Label>Height (in)</Label>
          <Input
            value={d.heightIn}
            onChange={v => u("heightIn", v)}
            placeholder="7"
            type="number"
          />
        </FieldGroup>
        <div />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup>
          <Label>Current Weight (lbs)</Label>
          <Input
            value={d.currentWeight}
            onChange={v => u("currentWeight", v)}
            placeholder="255"
            type="number"
          />
        </FieldGroup>
        <FieldGroup>
          <Label>Goal Weight (lbs)</Label>
          <Input
            value={d.goalWeight}
            onChange={v => u("goalWeight", v)}
            placeholder="185"
            type="number"
          />
        </FieldGroup>
      </div>
    </div>
  );
}

function Step2({
  d,
  u,
}: {
  d: FormData;
  u: (k: keyof FormData, v: string) => void;
}) {
  return (
    <div>
      <SectionTitle>Fitness History & Training</SectionTitle>
      <FieldGroup>
        <Label>Experience Level</Label>
        <Select
          value={d.experienceLevel}
          onChange={v => u("experienceLevel", v)}
          placeholder="Select level"
          options={[
            "Beginner (0–1 year)",
            "Intermediate (1–3 years)",
            "Advanced (3–5 years)",
            "Elite (5+ years)",
          ]}
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Current or Recent Training Program</Label>
        <Textarea
          value={d.currentProgram}
          onChange={v => u("currentProgram", v)}
          placeholder="Describe what you're currently doing for exercise, if anything..."
        />
      </FieldGroup>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup>
          <Label>Days Available Per Week</Label>
          <Select
            value={d.daysAvailable}
            onChange={v => u("daysAvailable", v)}
            placeholder="Select days"
            options={[
              "1 day",
              "2 days",
              "3 days",
              "4 days",
              "5 days",
              "6 days",
            ]}
          />
        </FieldGroup>
        <FieldGroup>
          <Label>Preferred Session Length</Label>
          <Select
            value={d.sessionLength}
            onChange={v => u("sessionLength", v)}
            placeholder="Select length"
            options={[
              "30–45 minutes",
              "45–60 minutes",
              "60–75 minutes",
              "75–90 minutes",
              "90+ minutes",
            ]}
          />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label>Equipment Access</Label>
        <Select
          value={d.equipmentAccess}
          onChange={v => u("equipmentAccess", v)}
          placeholder="Select access"
          options={[
            "Full commercial gym",
            "Home gym (full)",
            "Home gym (limited)",
            "Dumbbells only",
            "Bodyweight only",
          ]}
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Gym Name (if applicable)</Label>
        <Input
          value={d.gymName}
          onChange={v => u("gymName", v)}
          placeholder="Planet Fitness, LA Fitness, etc."
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Preferred Workout Time</Label>
        <Select
          value={d.workoutTime}
          onChange={v => u("workoutTime", v)}
          placeholder="Select time"
          options={[
            "Early morning (5–8 AM)",
            "Morning (8–11 AM)",
            "Midday (11 AM–1 PM)",
            "Afternoon (1–4 PM)",
            "Evening (4–7 PM)",
            "Night (7 PM+)",
            "Flexible / no preference",
          ]}
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Exercises You Love</Label>
        <Textarea
          value={d.exercisesLove}
          onChange={v => u("exercisesLove", v)}
          placeholder="Squats, deadlifts, running, yoga..."
          rows={2}
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Exercises You Hate or Want to Avoid</Label>
        <Textarea
          value={d.exercisesHate}
          onChange={v => u("exercisesHate", v)}
          placeholder="Burpees, box jumps, etc."
          rows={2}
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Current or Past Injuries</Label>
        <Textarea
          value={d.injuries}
          onChange={v => u("injuries", v)}
          placeholder="Describe any injuries, surgeries, or chronic pain areas..."
          rows={2}
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Movement Restrictions</Label>
        <Textarea
          value={d.movementRestrictions}
          onChange={v => u("movementRestrictions", v)}
          placeholder="Any movements you physically cannot perform..."
          rows={2}
        />
      </FieldGroup>
    </div>
  );
}

function Step3({
  d,
  u,
}: {
  d: FormData;
  u: (k: keyof FormData, v: string) => void;
}) {
  return (
    <div>
      <SectionTitle>Nutrition Habits</SectionTitle>
      <FieldGroup>
        <Label>How Many Meals Do You Eat Per Day?</Label>
        <Select
          value={d.mealsPerDay}
          onChange={v => u("mealsPerDay", v)}
          placeholder="Select"
          options={[
            "1–2 meals",
            "3 meals",
            "4 meals",
            "5+ meals",
            "I graze throughout the day",
          ]}
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Describe Your Typical Daily Eating</Label>
        <Textarea
          value={d.typicalEating}
          onChange={v => u("typicalEating", v)}
          placeholder="Walk me through what you typically eat from morning to night..."
          rows={4}
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Biggest Nutrition Struggles</Label>
        <Textarea
          value={d.nutritionStruggles}
          onChange={v => u("nutritionStruggles", v)}
          placeholder="Cravings, portion control, eating out, meal prep, emotional eating..."
          rows={3}
        />
      </FieldGroup>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup>
          <Label>Dietary Restrictions</Label>
          <Textarea
            value={d.dietaryRestrictions}
            onChange={v => u("dietaryRestrictions", v)}
            placeholder="Vegetarian, vegan, gluten-free, halal, kosher, none..."
            rows={2}
          />
        </FieldGroup>
        <FieldGroup>
          <Label>Food Allergies</Label>
          <Textarea
            value={d.foodAllergies}
            onChange={v => u("foodAllergies", v)}
            placeholder="Nuts, dairy, shellfish, none..."
            rows={2}
          />
        </FieldGroup>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup>
          <Label>Foods You Love</Label>
          <Textarea
            value={d.foodsLove}
            onChange={v => u("foodsLove", v)}
            placeholder="Chicken, rice, fruit, pasta..."
            rows={2}
          />
        </FieldGroup>
        <FieldGroup>
          <Label>Foods You Hate</Label>
          <Textarea
            value={d.foodsHate}
            onChange={v => u("foodsHate", v)}
            placeholder="Broccoli, fish, eggs..."
            rows={2}
          />
        </FieldGroup>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup>
          <Label>Cooking Skill Level</Label>
          <Select
            value={d.cookingSkill}
            onChange={v => u("cookingSkill", v)}
            placeholder="Select"
            options={[
              "Beginner (basic meals)",
              "Intermediate",
              "Advanced (comfortable cooking anything)",
            ]}
          />
        </FieldGroup>
        <FieldGroup>
          <Label>Meal Prep Frequency</Label>
          <Select
            value={d.mealPrepFreq}
            onChange={v => u("mealPrepFreq", v)}
            placeholder="Select"
            options={[
              "Never",
              "Occasionally",
              "1x per week",
              "2x per week",
              "Daily",
            ]}
          />
        </FieldGroup>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup>
          <Label>Weekly Food Budget</Label>
          <Select
            value={d.weeklyBudget}
            onChange={v => u("weeklyBudget", v)}
            placeholder="Select"
            options={[
              "Under $50",
              "$50–$100",
              "$100–$150",
              "$150–$200",
              "$200+",
            ]}
          />
        </FieldGroup>
        <FieldGroup>
          <Label>Daily Water Intake</Label>
          <Select
            value={d.waterIntake}
            onChange={v => u("waterIntake", v)}
            placeholder="Select"
            options={[
              "Less than 4 cups",
              "4–6 cups",
              "6–8 cups",
              "8–10 cups",
              "10+ cups",
            ]}
          />
        </FieldGroup>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup>
          <Label>Current Supplements</Label>
          <Textarea
            value={d.supplements}
            onChange={v => u("supplements", v)}
            placeholder="Protein powder, creatine, vitamins, none..."
            rows={2}
          />
        </FieldGroup>
        <FieldGroup>
          <Label>Alcohol Consumption</Label>
          <Select
            value={d.alcoholFreq}
            onChange={v => u("alcoholFreq", v)}
            placeholder="Select"
            options={[
              "Never",
              "Rarely (1–2x/month)",
              "Occasionally (1–2x/week)",
              "Frequently (3+x/week)",
            ]}
          />
        </FieldGroup>
      </div>
    </div>
  );
}

function Step4({
  d,
  u,
}: {
  d: FormData;
  u: (k: keyof FormData, v: string) => void;
}) {
  return (
    <div>
      <SectionTitle>Your Goals</SectionTitle>
      <FieldGroup>
        <Label required>Primary Goal</Label>
        <Select
          value={d.primaryGoal}
          onChange={v => u("primaryGoal", v)}
          placeholder="Select your main goal"
          options={[
            "Lose weight / fat loss",
            "Build muscle / gain size",
            "Body recomposition (lose fat + gain muscle)",
            "Improve athletic performance",
            "Improve overall health & energy",
            "Contest prep / competition",
            "Post-pregnancy fitness",
          ]}
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Goal Timeline</Label>
        <Select
          value={d.goalTimeline}
          onChange={v => u("goalTimeline", v)}
          placeholder="Select timeline"
          options={[
            "1–3 months",
            "3–6 months",
            "6–12 months",
            "12+ months",
            "No specific timeline",
          ]}
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Biggest Obstacle to Reaching Your Goals</Label>
        <Textarea
          value={d.biggestObstacle}
          onChange={v => u("biggestObstacle", v)}
          placeholder="What has held you back in the past? Be honest — this helps me help you."
          rows={3}
        />
      </FieldGroup>
      <FieldGroup>
        <Label>What Does Success Look Like to You?</Label>
        <Textarea
          value={d.successVision}
          onChange={v => u("successVision", v)}
          placeholder="Describe what your life looks like when you've hit your goal..."
          rows={3}
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Have You Worked With a Coach Before?</Label>
        <Textarea
          value={d.previousCoaches}
          onChange={v => u("previousCoaches", v)}
          placeholder="If yes, what worked? What didn't? Why did you stop?"
          rows={3}
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Preferred Accountability Style</Label>
        <Select
          value={d.accountabilityStyle}
          onChange={v => u("accountabilityStyle", v)}
          placeholder="Select style"
          options={[
            "Check-ins only (I'm self-motivated)",
            "Regular encouragement and reminders",
            "Tough love — push me hard",
            "Detailed feedback on everything",
          ]}
        />
      </FieldGroup>
    </div>
  );
}

function Step5({
  d,
  u,
}: {
  d: FormData;
  u: (k: keyof FormData, v: string) => void;
}) {
  return (
    <div>
      <SectionTitle>Schedule & Lifestyle</SectionTitle>
      <FieldGroup>
        <Label>Work Schedule</Label>
        <Select
          value={d.workSchedule}
          onChange={v => u("workSchedule", v)}
          placeholder="Select schedule"
          options={[
            "Traditional 9–5 (office)",
            "Work from home",
            "Shift work / irregular hours",
            "Part-time",
            "Stay-at-home parent",
            "Student",
            "Retired",
          ]}
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Physical Demand of Your Job</Label>
        <Select
          value={d.jobPhysicalDemand}
          onChange={v => u("jobPhysicalDemand", v)}
          placeholder="Select"
          options={[
            "Sedentary (mostly sitting)",
            "Light (some walking)",
            "Moderate (on feet most of day)",
            "Heavy (physical labor)",
          ]}
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Average Hours of Sleep Per Night</Label>
        <Select
          value={d.sleepHours}
          onChange={v => u("sleepHours", v)}
          placeholder="Select"
          options={[
            "Less than 5 hours",
            "5–6 hours",
            "6–7 hours",
            "7–8 hours",
            "8+ hours",
          ]}
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Current Stress Level</Label>
        <Select
          value={d.stressLevel}
          onChange={v => u("stressLevel", v)}
          placeholder="Select"
          options={[
            "Low (mostly relaxed)",
            "Moderate (manageable)",
            "High (frequently stressed)",
            "Very high (overwhelmed)",
          ]}
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Overall Daily Activity Level (outside of workouts)</Label>
        <Select
          value={d.activityLevel}
          onChange={v => u("activityLevel", v)}
          placeholder="Select"
          options={[
            "Sedentary (little to no movement)",
            "Lightly active (light walks, housework)",
            "Moderately active (regular movement throughout day)",
            "Very active (physically demanding lifestyle)",
          ]}
        />
      </FieldGroup>
    </div>
  );
}

function Step6({
  d,
  u,
  onSign,
}: {
  d: FormData;
  u: (k: keyof FormData, v: string | boolean) => void;
  onSign: (data: string) => void;
}) {
  return (
    <div>
      <SectionTitle>Client Agreement & Signature</SectionTitle>
      <div
        className="rounded-xl p-5 mb-6 text-sm leading-relaxed text-gray-300"
        style={{ background: "#111", border: "1px solid #2A2A2A" }}
      >
        <p
          className="font-semibold text-white mb-3"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Coach Murray Online Coaching Agreement
        </p>
        <p className="mb-3">
          By signing below, I acknowledge and agree to the following:
        </p>
        <ul className="space-y-2 list-none">
          {[
            "I understand that Coach Murray's coaching services are for fitness and nutrition guidance only and do not constitute medical advice.",
            "I confirm that I am in generally good health and have consulted a physician if I have any medical conditions.",
            "I understand that results depend on my own consistency, effort, and adherence to the program.",
            "I agree to communicate openly and honestly with my coach about my progress, struggles, and any changes in my health.",
            "I understand that my personal information will be kept confidential and used solely to build and deliver my coaching program.",
            "I commit to completing weekly check-ins and communicating any concerns promptly.",
            "I understand that the purchase, cancellation, and refund terms disclosed during checkout apply to my package.",
          ].map((item, i) => (
            <li key={i} className="flex gap-2">
              <span style={{ color: "#C9A84C", flexShrink: 0 }}>✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-[var(--cm-text-muted)]">
          Agreement version: 2026-07-10
        </p>
      </div>

      <FieldGroup>
        <label
          className="flex cursor-pointer items-start gap-3 rounded-xl p-4 transition-all duration-200"
          style={{
            background: d.termsAgreed ? "rgba(201,168,76,0.08)" : "#111",
            border: `1px solid ${d.termsAgreed ? "#C9A84C" : "#2A2A2A"}`,
          }}
        >
          <input
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--cm-gold)]"
            type="checkbox"
            checked={d.termsAgreed}
            onChange={event => u("termsAgreed", event.target.checked)}
            required
          />
          <span className="text-sm text-[var(--cm-text-soft)]">
            I have read and agree to the Client Agreement above. I understand
            this is a binding commitment to my health and fitness journey.
          </span>
        </label>
      </FieldGroup>

      <FieldGroup>
        <Label required>Digital Signature</Label>
        <p className="mb-3 text-xs leading-5 text-[var(--cm-text-muted)]">
          Draw your signature below, or type your full legal name in the
          keyboard-accessible field. Either method confirms the agreement.
        </p>
        <SignatureCanvas onSign={onSign} />
        <div className="my-4 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-[var(--cm-border)]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--cm-text-muted)]">
            Or type
          </span>
          <span className="h-px flex-1 bg-[var(--cm-border)]" />
        </div>
        <label
          htmlFor="typed-signature"
          className="mb-2 block text-sm font-semibold text-[var(--cm-text)]"
        >
          Full legal name
        </label>
        <input
          id="typed-signature"
          className="cm-input px-4 py-3 text-sm placeholder:text-[var(--cm-text-muted)]"
          value={d.typedSignature}
          onChange={event => u("typedSignature", event.target.value)}
          maxLength={160}
          autoComplete="name"
          placeholder="Type your full legal name"
        />
      </FieldGroup>
    </div>
  );
}

// ── Progress Bar ───────────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = ((step + 1) / total) * 100;
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-3">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1"
            style={{ flex: 1 }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={{
                background:
                  i < step
                    ? "#C9A84C"
                    : i === step
                      ? "linear-gradient(135deg, #E8C96A, #C9A84C)"
                      : "#1A1A1A",
                border: i <= step ? "2px solid #C9A84C" : "2px solid #2A2A2A",
                color: i <= step ? (i < step ? "#000" : "#000") : "#666",
                boxShadow:
                  i === step ? "0 0 12px rgba(201,168,76,0.4)" : "none",
              }}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span
              className="text-xs hidden sm:block"
              style={{
                color: i === step ? "#C9A84C" : i < step ? "#888" : "#444",
              }}
            >
              {s}
            </span>
          </div>
        ))}
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "#1A1A1A" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #C9A84C, #E8C96A)",
          }}
        />
      </div>
    </div>
  );
}

// ── Success Screen ─────────────────────────────────────────────────────────
function SuccessScreen({
  name,
  preview,
  warnings,
}: {
  name: string;
  preview: boolean;
  warnings: string[];
}) {
  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center p-4"
    >
      <div className="cm-card w-full max-w-xl p-6 text-center sm:p-9">
        <BrandMark size="lg" />
        <div className="mx-auto mb-6 mt-6 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--cm-positive)] bg-[rgb(100_197_144_/_0.1)] text-[var(--cm-positive)]">
          <CheckCircle2 aria-hidden="true" />
        </div>
        <h1 className="mb-3 text-3xl font-extrabold text-[var(--cm-gold-light)]">
          {preview ? "Preview complete" : `You're in, ${name}.`}
        </h1>
        <p className="mb-8 text-lg leading-7 text-[var(--cm-text-soft)]">
          {preview
            ? "The complete onboarding experience is working. No preview information was saved."
            : "Your intake is securely saved and linked to your verified purchase. Coach Murray can now review it and build your first phase."}
        </p>
        {warnings.length > 0 && (
          <div className="mb-5 rounded-xl border border-[rgb(242_184_75_/_0.3)] bg-[rgb(242_184_75_/_0.08)] p-4 text-left text-sm text-[var(--cm-warning)]">
            <strong>Saved, with a follow-up needed:</strong>
            {warnings.map(warning => (
              <p className="mt-1" key={warning}>
                {warning}
              </p>
            ))}
          </div>
        )}
        <div className="space-y-4 rounded-2xl border border-[var(--cm-border)] bg-[var(--cm-surface-raised)] p-6 text-left">
          <p className="mb-2 font-bold text-[var(--cm-text)]">
            What happens next
          </p>
          {[
            {
              num: "1",
              title: "Intake review",
              desc: "Coach Murray reviews your goals, constraints, and history.",
            },
            {
              num: "2",
              title: "Program build",
              desc: "Your training and nutrition phase is created and reviewed.",
            },
            {
              num: "3",
              title: "Kickoff details",
              desc: "You receive confirmed scheduling and portal instructions by email.",
            },
            {
              num: "4",
              title: "Week one",
              desc: "Your published plan appears in the client dashboard.",
            },
          ].map(s => (
            <div key={s.num} className="flex gap-3 items-start">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--cm-gold)] text-xs font-bold text-[var(--cm-bg)]">
                {s.num}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--cm-text)]">
                  {s.title}
                </p>
                <p className="text-xs leading-5 text-[var(--cm-text-muted)]">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        {!preview && (
          <a
            href="/dashboard"
            className="cm-button-primary mt-6 inline-flex min-h-11 items-center justify-center px-5 py-3"
          >
            Continue to secure sign in
          </a>
        )}
        <p className="mt-6 text-sm text-[var(--cm-text-muted)]">
          Questions?{" "}
          <a
            href="mailto:jonmurr.fit@gmail.com"
            className="font-bold text-[var(--cm-gold)] hover:underline"
          >
            jonmurr.fit@gmail.com
          </a>
        </p>
      </div>
    </main>
  );
}

function CheckoutGate({
  kind,
  detail,
}: {
  kind: "checking" | "required" | "error";
  detail?: string;
}) {
  const isChecking = kind === "checking";
  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center p-4"
    >
      <section
        className="cm-card w-full max-w-md p-7 text-center sm:p-9"
        aria-live="polite"
      >
        <BrandMark size="lg" />
        {isChecking ? (
          <>
            <h1 className="mt-6 text-2xl font-extrabold">
              Verifying your purchase
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--cm-text-muted)]">
              This secure check links the intake to the correct Stripe checkout.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(242_184_75_/_0.1)] text-[var(--cm-warning)]">
              {kind === "required" ? <LockKeyhole /> : <AlertCircle />}
            </div>
            <h1 className="mt-5 text-2xl font-extrabold">
              {kind === "required"
                ? "Complete checkout first"
                : "Purchase could not be verified"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--cm-text-muted)]">
              {detail ??
                "Onboarding opens from the secure link shown after a completed purchase."}
            </p>
            <a
              href="/#packages"
              className="cm-button-primary mt-6 inline-flex min-h-11 items-center justify-center gap-2 px-5 py-3"
            >
              <ArrowLeft size={16} /> View coaching packages
            </a>
          </>
        )}
      </section>
    </main>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(initialData);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [checkoutStatus, setCheckoutStatus] = useState<
    "checking" | "verified" | "required" | "error"
  >("checking");
  const [checkoutSessionId, setCheckoutSessionId] = useState("");
  const [packageName, setPackageName] = useState("Coaching Program");
  const [checkoutError, setCheckoutError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [website, setWebsite] = useState("");
  const preview =
    isLocalPreview &&
    new URLSearchParams(window.location.search).get("preview") === "1";
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id")?.trim() ?? "";
    if (preview) {
      setCheckoutSessionId("cs_test_preview_0000000000000000");
      setPackageName("Full Coaching · Preview");
      setData(current => ({
        ...current,
        email: current.email || "preview@example.com",
      }));
      setCheckoutStatus("verified");
      return;
    }
    if (!sessionId) {
      setCheckoutStatus("required");
      return;
    }
    setCheckoutSessionId(sessionId);
    void api
      .verifyCheckout(sessionId)
      .then(result => {
        setPackageName(result.packageName);
        setData(current => ({
          ...current,
          email: result.email || current.email,
        }));
        setCheckoutStatus("verified");
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("session_id");
        window.history.replaceState(
          window.history.state,
          "",
          `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`
        );
      })
      .catch(error => {
        setCheckoutError(
          error instanceof Error
            ? error.message
            : "The checkout session is invalid or incomplete."
        );
        setCheckoutStatus("error");
      });
  }, [preview]);

  const update = (key: keyof FormData, value: string | boolean) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    const errs: string[] = [];
    if (step === 0) {
      if (!data.firstName.trim()) errs.push("First name is required");
      if (!data.lastName.trim()) errs.push("Last name is required");
      if (!data.email.trim() || !data.email.includes("@"))
        errs.push("Valid email is required");
    }
    if (step === 3) {
      if (!data.primaryGoal) errs.push("Please select your primary goal");
    }
    if (step === 5) {
      if (!data.termsAgreed) errs.push("Please agree to the client agreement");
      if (!data.signatureData && !data.typedSignature.trim())
        errs.push("Please provide your digital signature");
    }
    setErrors(errs);
    return errs.length === 0;
  };

  const next = async () => {
    if (!validate()) {
      topRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setErrors([]);
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      if (preview) {
        toast.info("Preview complete — no information was saved.");
        setSubmitted(true);
        return;
      }
      setSubmitting(true);
      try {
        const result = await api.submitOnboarding({
          checkoutSessionId,
          website,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          heightFt: data.heightFt ? parseInt(data.heightFt) : undefined,
          heightIn: data.heightIn ? parseInt(data.heightIn) : undefined,
          currentWeight: data.currentWeight
            ? parseFloat(data.currentWeight)
            : undefined,
          goalWeight: data.goalWeight ? parseFloat(data.goalWeight) : undefined,
          experienceLevel: data.experienceLevel,
          currentProgram: data.currentProgram,
          daysAvailable: data.daysAvailable || undefined,
          sessionLength: data.sessionLength,
          equipmentAccess: data.equipmentAccess,
          gymName: data.gymName,
          exercisesLove: data.exercisesLove,
          exercisesHate: data.exercisesHate,
          injuries: data.injuries,
          movementRestrictions: data.movementRestrictions,
          mealsPerDay: data.mealsPerDay || undefined,
          typicalEating: data.typicalEating,
          nutritionStruggles: data.nutritionStruggles,
          dietaryRestrictions: data.dietaryRestrictions,
          foodAllergies: data.foodAllergies,
          foodsLove: data.foodsLove,
          foodsHate: data.foodsHate,
          cookingSkill: data.cookingSkill,
          mealPrepFreq: data.mealPrepFreq,
          weeklyBudget: data.weeklyBudget,
          supplements: data.supplements,
          waterIntake: data.waterIntake,
          alcoholFreq: data.alcoholFreq,
          primaryGoal: data.primaryGoal,
          goalTimeline: data.goalTimeline,
          biggestObstacle: data.biggestObstacle,
          successVision: data.successVision,
          previousCoaches: data.previousCoaches,
          accountabilityStyle: data.accountabilityStyle,
          workoutTime: data.workoutTime || undefined,
          workSchedule: data.workSchedule,
          jobPhysicalDemand: data.jobPhysicalDemand,
          sleepHours: data.sleepHours || undefined,
          stressLevel: data.stressLevel,
          activityLevel: data.activityLevel,
          termsAgreed: data.termsAgreed,
          signatureData: data.signatureData,
          typedSignature: data.typedSignature.trim(),
          termsVersion: "2026-07-10",
        });
        try {
          sessionStorage.setItem("cm-account-email", result.email);
          sessionStorage.setItem(
            "cm-account-warnings",
            JSON.stringify(result.warnings)
          );
        } catch {
          // Storage is a convenience for prefilling the next screen. The
          // verified server-side intake and account lifecycle do not depend on it.
        }
        if (result.accountState === "existing") {
          window.location.assign("/sign-in?onboarding=complete");
        } else {
          const status =
            result.accountState === "setup-pending"
              ? "pending"
              : result.accountState;
          window.location.assign(
            `/account/setup?status=${encodeURIComponent(status)}`
          );
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Submission failed. Your information was not marked complete."
        );
      } finally {
        setSubmitting(false);
      }
    }
  };

  const back = () => {
    setErrors([]);
    setStep(s => s - 1);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (checkoutStatus === "checking") return <CheckoutGate kind="checking" />;
  if (checkoutStatus === "required") return <CheckoutGate kind="required" />;
  if (checkoutStatus === "error")
    return <CheckoutGate kind="error" detail={checkoutError} />;
  if (submitted)
    return (
      <SuccessScreen
        name={data.firstName}
        preview={preview}
        warnings={warnings}
      />
    );

  const stepComponents = [
    <Step1 d={data} u={(k, v) => update(k, v as string)} />,
    <Step2 d={data} u={(k, v) => update(k, v as string)} />,
    <Step3 d={data} u={(k, v) => update(k, v as string)} />,
    <Step4 d={data} u={(k, v) => update(k, v as string)} />,
    <Step5 d={data} u={(k, v) => update(k, v as string)} />,
    <Step6 d={data} u={update} onSign={sig => update("signatureData", sig)} />,
  ];

  return (
    <main id="main-content" className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto" ref={topRef}>
        {/* Header */}
        <div className="text-center mb-8">
          <BrandMark size="lg" />
          <h1 className="mt-4 text-2xl font-extrabold tracking-[0.12em] text-[var(--cm-gold)]">
            COACH MURRAY
          </h1>
          <p className="mt-1 text-sm text-[var(--cm-text-muted)]">
            Verified client intake · {packageName}
          </p>
          {preview && (
            <p className="mx-auto mt-3 w-fit rounded-full border border-[rgb(240_208_112_/_0.25)] bg-[rgb(212_170_64_/_0.08)] px-3 py-1 text-xs font-bold text-[var(--cm-gold-light)]">
              Preview mode · nothing is saved
            </p>
          )}
        </div>

        {/* Card */}
        <form
          className="cm-card p-6 sm:p-8"
          onSubmit={event => {
            event.preventDefault();
            void next();
          }}
        >
          <label className="cm-honeypot" aria-hidden="true">
            Leave this field empty
            <input
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={event => setWebsite(event.target.value)}
            />
          </label>
          <ProgressBar step={step} total={STEPS.length} />

          {/* Step header */}
          <div className="mb-6">
            <p className="cm-kicker mb-1">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 className="text-xl font-extrabold text-[var(--cm-text)]">
              {STEPS[step]}
            </h2>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div
              className="rounded-lg p-4 mb-6 text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#fca5a5",
              }}
            >
              {errors.map((e, i) => (
                <p key={i}>• {e}</p>
              ))}
            </div>
          )}

          {/* Step content */}
          {stepComponents[step]}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-80"
                style={{
                  background: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                  color: "#888",
                }}
              >
                ← Back
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="cm-button-primary rounded-xl py-3.5 text-sm disabled:opacity-50"
              style={{ flex: step === 0 ? "1" : "2" }}
            >
              {submitting
                ? "Submitting..."
                : step === STEPS.length - 1
                  ? "Submit Intake Form →"
                  : "Continue →"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-[var(--cm-text-muted)]">
          Sensitive coaching information is transmitted securely and is only
          available to authorized coaching staff.
        </p>
      </div>
    </main>
  );
}
