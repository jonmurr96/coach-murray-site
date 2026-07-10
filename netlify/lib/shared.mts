import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import Stripe from "stripe";

declare const Netlify:
  { env: { get(name: string): string | undefined } } | undefined;

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function env(name: string) {
  if (typeof Netlify !== "undefined") return Netlify.env.get(name)?.trim();
  return process.env[name]?.trim();
}

export function requiredEnv(name: string) {
  const value = env(name);
  if (!value) throw new HttpError(503, `${name} is not configured.`);
  return value;
}

export function json(status: number, body: unknown, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError)
    return json(error.status, { error: error.message });
  if (error instanceof SyntaxError)
    return json(400, { error: "The request body is not valid JSON." });
  console.error(
    "Unhandled function error",
    error instanceof Error ? error.message : "Unknown error"
  );
  return json(500, { error: "The request could not be completed." });
}

export function requireMethod(request: Request, method: "GET" | "POST") {
  if (request.method !== method)
    throw new HttpError(405, `Use ${method} for this endpoint.`);
}

export function assertTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = env("SITE_URL");
  const allowed = new Set(
    [
      requestOrigin,
      configuredOrigin,
      "http://localhost:8888",
      "http://127.0.0.1:8888",
    ].filter(Boolean)
  );
  if (!allowed.has(origin))
    throw new HttpError(403, "Request origin is not allowed.");
}

export async function readJson(request: Request, maxBytes = 600_000) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxBytes)
    throw new HttpError(413, "The request is too large.");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes)
    throw new HttpError(413, "The request is too large.");
  return JSON.parse(text) as unknown;
}

let stripe: Stripe | null = null;
export function getStripe() {
  if (!stripe)
    stripe = new Stripe(requiredEnv("STRIPE_SECRET_KEY"), {
      maxNetworkRetries: 2,
    });
  return stripe;
}

let supabaseAdmin: SupabaseClient | null = null;
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );
  }
  return supabaseAdmin;
}

export function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new HttpError(401, "Sign in is required.");
  return match[1];
}

export async function requireUser(request: Request): Promise<User> {
  const token = bearerToken(request);
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user)
    throw new HttpError(401, "Your session is invalid or expired.");
  return data.user;
}

export async function requireCoach(request: Request): Promise<User> {
  const user = await requireUser(request);
  const role = String(user.app_metadata?.role ?? "").toLowerCase();
  if (!["owner", "coach", "admin"].includes(role))
    throw new HttpError(403, "Coach access is required.");
  return user;
}

export async function requireClientProfile(request: Request) {
  const user = await requireUser(request);
  const result = await getSupabaseAdmin()
    .from("client_profiles")
    .select(
      "id,user_id,first_name,last_name,email,primary_goal,current_weight,goal_weight,week_number,total_weeks,stripe_customer_id"
    )
    .eq("user_id", user.id)
    .maybeSingle();
  if (result.error)
    throw new HttpError(500, "Client profile could not be loaded.");
  if (!result.data)
    throw new HttpError(404, "No client profile is linked to this account.");
  return { user, profile: result.data };
}

export function siteUrl() {
  return env("SITE_URL") ?? "https://coach-murray.netlify.app";
}

export function centsToUnits(value: number | null | undefined) {
  return typeof value === "number" ? value / 100 : 0;
}

export function packageNameFromSession(session: Stripe.Checkout.Session) {
  const metadataName = session.metadata?.package_name?.trim();
  if (metadataName) return metadataName.slice(0, 160);
  const firstLine = session.line_items?.data[0];
  const product = firstLine?.price?.product;
  if (
    product &&
    typeof product !== "string" &&
    !product.deleted &&
    product.name
  )
    return product.name.slice(0, 160);
  return "Coach Murray Coaching";
}

export async function verifiedCheckout(sessionId: string) {
  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });
  } catch {
    throw new HttpError(404, "Checkout session was not found.");
  }
  const isPaid =
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required";
  if (session.status !== "complete" || !isPaid)
    throw new HttpError(403, "Checkout is not complete.");
  const email = session.customer_details?.email ?? session.customer_email;
  if (!email)
    throw new HttpError(
      422,
      "The checkout session does not include a customer email."
    );
  return {
    session,
    email: email.toLowerCase(),
    packageName: packageNameFromSession(session),
  };
}
