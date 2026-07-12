-- Follow-up for projects that applied the canonical migration before the
-- post-deploy Supabase security and performance advisor pass.

revoke all on function public.handle_auth_user_link() from public, anon, authenticated;

create index if not exists intake_submissions_client_idx on public.intake_submissions (client_id);
create index if not exists messages_sender_user_idx on public.messages (sender_user_id);
create index if not exists nutrition_plans_client_idx on public.nutrition_plans (client_id);
create index if not exists nutrition_plans_program_idx on public.nutrition_plans (program_id);
create index if not exists programs_coach_user_idx on public.programs (coach_user_id);
create index if not exists progress_entries_check_in_idx on public.progress_entries (check_in_id);
create index if not exists purchases_client_idx on public.purchases (client_id);
create index if not exists workouts_program_idx on public.workouts (program_id);

-- Coach OS is server-mediated. The service role used by verified Netlify
-- functions bypasses RLS, so direct browser table-management policies for
-- coach JWTs only widen the exposed PostgREST surface and are unnecessary.
drop policy if exists "coaches manage profiles" on public.client_profiles;
drop policy if exists "coaches manage purchases" on public.purchases;
drop policy if exists "coaches manage intake" on public.intake_submissions;
drop policy if exists "coaches manage programs" on public.programs;
drop policy if exists "coaches manage workouts" on public.workouts;
drop policy if exists "coaches manage nutrition" on public.nutrition_plans;
drop policy if exists "coaches manage checkins" on public.check_ins;
drop policy if exists "coaches manage progress" on public.progress_entries;
drop policy if exists "coaches manage messages" on public.messages;
drop policy if exists "coaches manage leads" on public.leads;
drop policy if exists "coaches manage lead submissions" on public.lead_submissions;
drop policy if exists "coaches manage resources" on public.library_resources;
drop policy if exists "coaches manage assignments" on public.client_resources;

alter policy "clients read own profile" on public.client_profiles using (
  user_id = (select auth.uid()) and account_setup_completed_at is not null
);

alter policy "clients read own purchases" on public.purchases using (client_id in (
  select id from public.client_profiles
  where user_id = (select auth.uid()) and account_setup_completed_at is not null
));

alter policy "clients read own intake" on public.intake_submissions using (client_id in (
  select id from public.client_profiles
  where user_id = (select auth.uid()) and account_setup_completed_at is not null
));

alter policy "clients read own active programs" on public.programs using (
  status = 'active' and published_at is not null and
  client_id in (
    select id from public.client_profiles
    where user_id = (select auth.uid()) and account_setup_completed_at is not null
  )
);

alter policy "clients read own active workouts" on public.workouts using (
  client_id in (
    select id from public.client_profiles
    where user_id = (select auth.uid()) and account_setup_completed_at is not null
  ) and
  program_id in (
    select id from public.programs where status = 'active' and published_at is not null
  )
);

alter policy "clients read own active nutrition" on public.nutrition_plans using (
  status = 'active' and published_at is not null and
  client_id in (
    select id from public.client_profiles
    where user_id = (select auth.uid()) and account_setup_completed_at is not null
  )
);

alter policy "clients read own checkins" on public.check_ins using (client_id in (
  select id from public.client_profiles
  where user_id = (select auth.uid()) and account_setup_completed_at is not null
));

alter policy "clients read own progress" on public.progress_entries using (client_id in (
  select id from public.client_profiles
  where user_id = (select auth.uid()) and account_setup_completed_at is not null
));

alter policy "clients read own messages" on public.messages using (client_id in (
  select id from public.client_profiles
  where user_id = (select auth.uid()) and account_setup_completed_at is not null
));

alter policy "clients read assigned resources" on public.library_resources using (
  exists (
    select 1
    from public.client_resources cr
    join public.client_profiles cp on cp.id = cr.client_id
    where cr.resource_id = library_resources.id
      and cp.user_id = (select auth.uid())
      and cp.account_setup_completed_at is not null
  )
);

alter policy "clients read own assignments" on public.client_resources using (client_id in (
  select id from public.client_profiles
  where user_id = (select auth.uid()) and account_setup_completed_at is not null
));
