-- URL-based coaching resources are managed only by role-verified Netlify
-- functions. Keep the database boundary strict even when a privileged server
-- client writes the records.

alter table public.library_resources
  alter column url set not null;

alter table public.library_resources
  drop constraint if exists library_resources_title_check,
  add constraint library_resources_title_check check (
    title = btrim(title)
    and char_length(title) between 1 and 160
  ),
  drop constraint if exists library_resources_kind_check,
  add constraint library_resources_kind_check check (
    kind in ('guide', 'training', 'nutrition', 'video', 'worksheet')
  ),
  drop constraint if exists library_resources_url_check,
  add constraint library_resources_url_check check (
    url = btrim(url)
    and char_length(url) between 1 and 2048
    and (
      url ~ '^https://[^[:space:]]+$'
      or url ~ '^/[^/[:space:]][^[:space:]]*$'
    )
  );

drop trigger if exists library_resources_set_updated_at on public.library_resources;
create trigger library_resources_set_updated_at
before update on public.library_resources
for each row execute function public.set_updated_at();
