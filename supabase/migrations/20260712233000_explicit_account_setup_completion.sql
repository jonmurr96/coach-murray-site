-- Supabase Auth assigns an internal random password when an invite is
-- confirmed. Portal readiness must wait for a later password change made from
-- Coach Murray's authenticated account-setup screen.

create or replace function public.handle_auth_user_link()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if new.email_confirmed_at is null or new.email is null then return new; end if;

  update public.client_profiles as profile
  set
    user_id = new.id,
    account_setup_completed_at = case
      when tg_op = 'UPDATE'
        and old.email_confirmed_at is not null
        and new.email_confirmed_at is not null
        and new.encrypted_password is distinct from old.encrypted_password
        and nullif(btrim(coalesce(new.encrypted_password, '')), '') is not null
        then coalesce(profile.account_setup_completed_at, now())
      else profile.account_setup_completed_at
    end
  where
    (
      profile.user_id = new.id
      or (
        profile.user_id is null
        and lower(profile.email) = lower(new.email)
        and not exists (
          select 1
          from public.client_profiles as linked_profile
          where linked_profile.user_id = new.id
        )
      )
    )
    and exists (
      select 1
      from public.purchases as purchase
      where purchase.client_id = profile.id
        and purchase.payment_status = 'paid'
        and purchase.checkout_status = 'complete'
    );
  return new;
end;
$$;

revoke all on function public.handle_auth_user_link() from public, anon, authenticated;
