-- Coach OS database access is exclusively mediated by role-verified Netlify
-- functions. Remove redundant direct PostgREST management policies for coach
-- JWTs; the server-side service role continues to bypass RLS as intended.

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
