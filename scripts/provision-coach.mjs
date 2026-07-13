import { createClient } from "@supabase/supabase-js";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const supabaseUrl = required("SUPABASE_URL");
const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
const email = required("COACH_EMAIL").toLowerCase();
const role = process.env.COACH_ROLE?.trim().toLowerCase() || "owner";
const password = process.env.COACH_TEMP_PASSWORD ?? "";
const forcePasswordUpdate = process.env.COACH_FORCE_PASSWORD_UPDATE === "true";

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  throw new Error("COACH_EMAIL must be a valid email address.");
if (!new Set(["owner", "coach", "admin"]).has(role))
  throw new Error("COACH_ROLE must be owner, coach, or admin.");
if (
  password &&
  (password.length < 12 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password))
)
  throw new Error(
    "COACH_TEMP_PASSWORD must contain 12+ characters with upper/lowercase letters and a number."
  );

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserByEmail() {
  const perPage = 1_000;
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    const match = data.users.find(
      user => user.email?.trim().toLowerCase() === email
    );
    if (match) return match;
    if (data.users.length < perPage) return null;
  }
  throw new Error("User search exceeded the safe pagination limit.");
}

const existing = await findUserByEmail();
if (!existing) {
  if (!password)
    throw new Error(
      "COACH_TEMP_PASSWORD is required when creating a new coach account."
    );
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
  });
  if (error) throw error;
  if (!data.user) throw new Error("Supabase did not confirm user creation.");
  process.stdout.write(`Created ${role} account for ${email}.\n`);
} else {
  const attributes = {
    email_confirm: true,
    app_metadata: { ...existing.app_metadata, role },
    ...(forcePasswordUpdate
      ? {
          password: password || required("COACH_TEMP_PASSWORD"),
        }
      : {}),
  };
  const { data, error } = await supabase.auth.admin.updateUserById(
    existing.id,
    attributes
  );
  if (error) throw error;
  if (!data.user) throw new Error("Supabase did not confirm the user update.");
  process.stdout.write(
    `Updated ${email} with signed app_metadata role ${role}${forcePasswordUpdate ? " and a new temporary password" : ""}.\n`
  );
}
