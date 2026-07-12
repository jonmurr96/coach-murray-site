-- Leads are handled only by Netlify functions using the service role. Make
-- the deny-by-default browser boundary explicit while retaining RLS.

drop policy if exists "deny direct lead access" on public.leads;
create policy "deny direct lead access"
on public.leads for all to authenticated
using (false)
with check (false);

drop policy if exists "deny direct lead submission access" on public.lead_submissions;
create policy "deny direct lead submission access"
on public.lead_submissions for all to authenticated
using (false)
with check (false);
