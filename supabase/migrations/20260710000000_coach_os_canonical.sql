-- Canonical Coach Murray / Coach OS schema.
-- Apply this to the ONE Supabase project configured in Netlify. Do not apply it
-- to the two legacy project references embedded in the old standalone pages.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_coach()
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('owner', 'coach', 'admin');
$$;

create table if not exists public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  email text not null,
  phone text,
  primary_goal text,
  current_weight numeric(7,2),
  goal_weight numeric(7,2),
  status text not null default 'plan pending' check (status in ('plan pending', 'active', 'check-in due', 'paused', 'complete')),
  week_number integer not null default 0 check (week_number between 0 and 104),
  total_weeks integer not null default 12 check (total_weeks between 1 and 104),
  adherence integer check (adherence between 0 and 100),
  stripe_customer_id text unique,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_profiles_email_unique unique (email)
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.client_profiles(id) on delete set null,
  stripe_checkout_session_id text not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  email text not null,
  package_name text not null,
  amount_total integer not null default 0 check (amount_total >= 0),
  currency text not null default 'usd',
  payment_status text not null,
  checkout_status text,
  subscription_status text,
  current_period_end timestamptz,
  purchased_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete restrict,
  intake_payload jsonb not null,
  terms_accepted_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  constraint intake_purchase_unique unique (purchase_id)
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  coach_user_id uuid references auth.users(id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  summary text not null default '' check (char_length(summary) <= 5000),
  weeks integer not null check (weeks between 1 and 52),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  title text not null,
  scheduled_day text,
  duration_minutes integer check (duration_minutes between 0 and 600),
  status text not null default 'upcoming' check (status in ('ready', 'upcoming', 'complete', 'skipped')),
  sort_order integer not null default 0,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  calories integer not null check (calories between 500 and 10000),
  protein_grams integer not null check (protein_grams between 0 and 1000),
  carb_grams integer not null check (carb_grams between 0 and 2000),
  fat_grams integer not null check (fat_grams between 0 and 1000),
  notes text not null default '',
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  weight numeric(7,2),
  energy integer not null check (energy between 1 and 5),
  adherence integer not null check (adherence between 0 and 100),
  wins text not null default '' check (char_length(wins) <= 2000),
  challenges text not null default '' check (char_length(challenges) <= 2000),
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now()
);

create table if not exists public.progress_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  check_in_id uuid references public.check_ins(id) on delete set null,
  weight numeric(7,2),
  adherence integer check (adherence between 0 and 100),
  photo_path text,
  recorded_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  sender_role text not null check (sender_role in ('client', 'coach')),
  sender_user_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 5000),
  sent_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  email text not null,
  source text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
  marketing_consent boolean not null default false,
  consent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_email_unique unique (email)
);

create table if not exists public.library_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null,
  url text,
  storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_resources (
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  resource_id uuid not null references public.library_resources(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (client_id, resource_id)
);

create index if not exists purchases_email_idx on public.purchases (lower(email), purchased_at desc);
create index if not exists purchases_subscription_idx on public.purchases (stripe_subscription_id) where stripe_subscription_id is not null;
create index if not exists programs_client_status_idx on public.programs (client_id, status, published_at desc);
create index if not exists workouts_client_order_idx on public.workouts (client_id, sort_order);
create index if not exists check_ins_client_date_idx on public.check_ins (client_id, submitted_at desc);
create index if not exists messages_client_date_idx on public.messages (client_id, sent_at);
create index if not exists progress_client_date_idx on public.progress_entries (client_id, recorded_at);
create index if not exists leads_status_date_idx on public.leads (status, created_at desc);

drop trigger if exists client_profiles_set_updated_at on public.client_profiles;
create trigger client_profiles_set_updated_at before update on public.client_profiles for each row execute function public.set_updated_at();
drop trigger if exists programs_set_updated_at on public.programs;
create trigger programs_set_updated_at before update on public.programs for each row execute function public.set_updated_at();
drop trigger if exists nutrition_plans_set_updated_at on public.nutrition_plans;
create trigger nutrition_plans_set_updated_at before update on public.nutrition_plans for each row execute function public.set_updated_at();
drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads for each row execute function public.set_updated_at();

create or replace function public.handle_auth_user_link()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  update public.client_profiles
  set user_id = new.id
  where user_id is null and lower(email) = lower(new.email);
  return new;
end;
$$;

drop trigger if exists coach_os_link_auth_user on auth.users;
create trigger coach_os_link_auth_user after insert or update of email on auth.users for each row execute function public.handle_auth_user_link();

create or replace function public.complete_client_onboarding(
  p_checkout_session_id text,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_package_name text,
  p_amount_total integer,
  p_currency text,
  p_email text,
  p_profile jsonb,
  p_intake jsonb
)
returns table (client_id uuid, portal_ready boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_client_id uuid;
  v_purchase_id uuid;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where lower(email) = lower(p_email) limit 1;

  insert into public.client_profiles (
    user_id, first_name, last_name, email, phone, primary_goal, current_weight, goal_weight, stripe_customer_id
  ) values (
    v_user_id,
    p_profile ->> 'first_name',
    p_profile ->> 'last_name',
    lower(p_email),
    nullif(p_profile ->> 'phone', ''),
    nullif(p_profile ->> 'primary_goal', ''),
    nullif(p_profile ->> 'current_weight', '')::numeric,
    nullif(p_profile ->> 'goal_weight', '')::numeric,
    p_stripe_customer_id
  )
  on conflict (email) do update set
    user_id = coalesce(public.client_profiles.user_id, excluded.user_id),
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    phone = excluded.phone,
    primary_goal = excluded.primary_goal,
    current_weight = excluded.current_weight,
    goal_weight = excluded.goal_weight,
    stripe_customer_id = coalesce(excluded.stripe_customer_id, public.client_profiles.stripe_customer_id)
  returning id into v_client_id;

  insert into public.purchases (
    client_id, stripe_checkout_session_id, stripe_customer_id, stripe_subscription_id, email,
    package_name, amount_total, currency, payment_status, checkout_status, subscription_status
  ) values (
    v_client_id, p_checkout_session_id, p_stripe_customer_id, p_stripe_subscription_id, lower(p_email),
    p_package_name, p_amount_total, lower(p_currency), 'paid', 'complete', case when p_stripe_subscription_id is null then null else 'active' end
  )
  on conflict (stripe_checkout_session_id) do update set
    client_id = excluded.client_id,
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    email = excluded.email,
    package_name = excluded.package_name,
    amount_total = excluded.amount_total,
    currency = excluded.currency,
    payment_status = excluded.payment_status,
    checkout_status = excluded.checkout_status,
    updated_at = now()
  returning id into v_purchase_id;

  insert into public.intake_submissions (client_id, purchase_id, intake_payload)
  values (v_client_id, v_purchase_id, p_intake)
  on conflict (purchase_id) do update set intake_payload = excluded.intake_payload, submitted_at = now();

  return query select v_client_id, v_user_id is not null;
end;
$$;

create or replace function public.submit_client_check_in(
  p_client_id uuid,
  p_weight numeric,
  p_energy integer,
  p_adherence integer,
  p_wins text,
  p_challenges text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_check_in_id uuid;
begin
  insert into public.check_ins (client_id, weight, energy, adherence, wins, challenges)
  values (p_client_id, p_weight, p_energy, p_adherence, p_wins, p_challenges)
  returning id into v_check_in_id;
  insert into public.progress_entries (client_id, check_in_id, weight, adherence)
  values (p_client_id, v_check_in_id, p_weight, p_adherence);
  update public.client_profiles set adherence = p_adherence, current_weight = coalesce(p_weight, current_weight), last_active_at = now() where id = p_client_id;
  return v_check_in_id;
end;
$$;

create or replace function public.publish_client_program(
  p_client_id uuid,
  p_coach_user_id uuid,
  p_title text,
  p_summary text,
  p_weeks integer
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_program_id uuid;
begin
  update public.programs set status = 'archived' where client_id = p_client_id and status = 'active';
  insert into public.programs (client_id, coach_user_id, title, summary, weeks, status, published_at)
  values (p_client_id, p_coach_user_id, p_title, p_summary, p_weeks, 'active', now())
  returning id into v_program_id;
  update public.client_profiles set status = 'active', total_weeks = p_weeks, week_number = greatest(week_number, 1) where id = p_client_id;
  return v_program_id;
end;
$$;

revoke all on function public.complete_client_onboarding(text,text,text,text,integer,text,text,jsonb,jsonb) from public, anon, authenticated;
revoke all on function public.submit_client_check_in(uuid,numeric,integer,integer,text,text) from public, anon, authenticated;
revoke all on function public.publish_client_program(uuid,uuid,text,text,integer) from public, anon, authenticated;
grant execute on function public.complete_client_onboarding(text,text,text,text,integer,text,text,jsonb,jsonb) to service_role;
grant execute on function public.submit_client_check_in(uuid,numeric,integer,integer,text,text) to service_role;
grant execute on function public.publish_client_program(uuid,uuid,text,text,integer) to service_role;

alter table public.client_profiles enable row level security;
alter table public.purchases enable row level security;
alter table public.intake_submissions enable row level security;
alter table public.programs enable row level security;
alter table public.workouts enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.check_ins enable row level security;
alter table public.progress_entries enable row level security;
alter table public.messages enable row level security;
alter table public.leads enable row level security;
alter table public.library_resources enable row level security;
alter table public.client_resources enable row level security;

create policy "clients read own profile" on public.client_profiles for select to authenticated using (user_id = auth.uid());
create policy "coaches manage profiles" on public.client_profiles for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "clients read own purchases" on public.purchases for select to authenticated using (client_id in (select id from public.client_profiles where user_id = auth.uid()));
create policy "coaches manage purchases" on public.purchases for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "clients read own intake" on public.intake_submissions for select to authenticated using (client_id in (select id from public.client_profiles where user_id = auth.uid()));
create policy "coaches manage intake" on public.intake_submissions for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "clients read own programs" on public.programs for select to authenticated using (client_id in (select id from public.client_profiles where user_id = auth.uid()));
create policy "coaches manage programs" on public.programs for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "clients read own workouts" on public.workouts for select to authenticated using (client_id in (select id from public.client_profiles where user_id = auth.uid()));
create policy "coaches manage workouts" on public.workouts for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "clients read own nutrition" on public.nutrition_plans for select to authenticated using (client_id in (select id from public.client_profiles where user_id = auth.uid()));
create policy "coaches manage nutrition" on public.nutrition_plans for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "clients read own checkins" on public.check_ins for select to authenticated using (client_id in (select id from public.client_profiles where user_id = auth.uid()));
create policy "coaches manage checkins" on public.check_ins for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "clients read own progress" on public.progress_entries for select to authenticated using (client_id in (select id from public.client_profiles where user_id = auth.uid()));
create policy "coaches manage progress" on public.progress_entries for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "clients read own messages" on public.messages for select to authenticated using (client_id in (select id from public.client_profiles where user_id = auth.uid()));
create policy "coaches manage messages" on public.messages for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "coaches manage leads" on public.leads for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "authenticated read resources" on public.library_resources for select to authenticated using (true);
create policy "coaches manage resources" on public.library_resources for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "clients read own assignments" on public.client_resources for select to authenticated using (client_id in (select id from public.client_profiles where user_id = auth.uid()));
create policy "coaches manage assignments" on public.client_resources for all to authenticated using (public.is_coach()) with check (public.is_coach());

-- Assign the initial owner role with a privileged admin workflow after the owner
-- has signed in once. Never accept this role from user_metadata or a browser form:
-- update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"owner"}'::jsonb where email = 'OWNER_EMAIL';
