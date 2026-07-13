-- A confirmed Auth row can still contain only Supabase's generated invitation
-- password. Paid onboarding links that identity, but readiness is established
-- only by the post-link password-change trigger.

create or replace function public.complete_client_onboarding(
  p_checkout_session_id text,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_package_name text,
  p_amount_total integer,
  p_currency text,
  p_email text,
  p_profile jsonb,
  p_intake jsonb,
  p_terms_version text,
  p_signature_sha256 text
)
returns table (client_id uuid, portal_ready boolean, intake_created boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_client_id uuid;
  v_purchase_id uuid;
  v_user_id uuid;
  v_account_setup_completed_at timestamptz;
  v_existing_client_id uuid;
  v_existing_account_setup_completed_at timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_checkout_session_id, 0));

  select i.client_id, cp.account_setup_completed_at
  into v_existing_client_id, v_existing_account_setup_completed_at
  from public.purchases p
  join public.intake_submissions i on i.purchase_id = p.id
  join public.client_profiles cp on cp.id = i.client_id
  where p.stripe_checkout_session_id = p_checkout_session_id
  limit 1;

  if v_existing_client_id is not null then
    return query select v_existing_client_id, v_existing_account_setup_completed_at is not null, false;
    return;
  end if;

  select id, null::timestamptz
  into v_user_id, v_account_setup_completed_at
  from auth.users
  where lower(email) = lower(p_email) and email_confirmed_at is not null
  limit 1;

  insert into public.client_profiles (
    user_id, first_name, last_name, email, phone, primary_goal, current_weight,
    goal_weight, stripe_customer_id, account_setup_completed_at
  ) values (
    v_user_id,
    p_profile ->> 'first_name',
    p_profile ->> 'last_name',
    lower(p_email),
    nullif(p_profile ->> 'phone', ''),
    nullif(p_profile ->> 'primary_goal', ''),
    nullif(p_profile ->> 'current_weight', '')::numeric,
    nullif(p_profile ->> 'goal_weight', '')::numeric,
    p_stripe_customer_id,
    v_account_setup_completed_at
  )
  on conflict (lower(email)) do update set
    user_id = coalesce(public.client_profiles.user_id, excluded.user_id),
    account_setup_completed_at = case
      when public.client_profiles.user_id is null
        or public.client_profiles.user_id = excluded.user_id
        then coalesce(public.client_profiles.account_setup_completed_at, excluded.account_setup_completed_at)
      else public.client_profiles.account_setup_completed_at
    end,
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

  insert into public.intake_submissions (
    client_id, purchase_id, intake_payload, terms_version, signature_sha256
  ) values (
    v_client_id, v_purchase_id, p_intake, p_terms_version, p_signature_sha256
  );

  select account_setup_completed_at
  into v_account_setup_completed_at
  from public.client_profiles
  where id = v_client_id;
  return query select v_client_id, v_account_setup_completed_at is not null, true;
end;
$$;

revoke all on function public.complete_client_onboarding(text,text,text,text,integer,text,text,jsonb,jsonb,text,text) from public, anon, authenticated;
grant execute on function public.complete_client_onboarding(text,text,text,text,integer,text,text,jsonb,jsonb,text,text) to service_role;
