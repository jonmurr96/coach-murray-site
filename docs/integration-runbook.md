# Production Integration Runbook

## 1. Supabase

1. Give the connected Supabase account access to the intended production project, or select one approved project.
2. Before applying the migration to an existing roster, run `select lower(email), count(*) from public.client_profiles group by lower(email) having count(*) > 1;` and resolve any case-variant duplicates deliberately. The migration enforces one case-insensitive client identity per email.
3. Apply `supabase/migrations/20260710000000_coach_os_canonical.sql` through the Supabase CLI or SQL editor.
4. In Auth settings, set the Site URL to the exact HTTPS origin used by `SITE_URL`. Allow redirects to `/account/setup`, `/account/confirm`, and `/account/reset` on that same origin. Do not allow wildcard external origins.
5. Disable public user signups and anonymous sign-ins. Keep email confirmation enabled. Set the project password minimum to at least 12 characters and enable available password-compromise checks.
6. Configure production SMTP before inviting any client. Replace the Supabase **Invite user** and **Reset password** email links with the scanner-safe templates below. The first browser page does not consume the token; the human must select **Continue securely**.

   Invite-user link:

   ```html
   <a
     href="{{ .SiteURL }}/account/confirm#token_hash={{ .TokenHash }}&amp;type=invite"
     >Create your Coach Murray account</a
   >
   ```

   Password-recovery link:

   ```html
   <a
     href="{{ .SiteURL }}/account/confirm#token_hash={{ .TokenHash }}&amp;type=recovery"
     >Reset your Coach Murray password</a
   >
   ```

7. Disable click tracking in the SMTP/email provider so it does not rewrite one-time authentication links.
8. Set the public URL/publishable key and server service-role key in Netlify using `.env.example` as the name contract. The service-role key must never use a `VITE_` prefix.
9. Provision the first signed coach role from a trusted local shell. This command creates a confirmed owner only when the email does not exist; for an existing user it updates `app_metadata.role` without rotating the password.

   ```bash
   export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
   export COACH_EMAIL="YOUR_EMAIL"
   export COACH_TEMP_PASSWORD="A-unique-12-plus-character-temporary-password1"
   pnpm provision:coach
   unset SUPABASE_SERVICE_ROLE_KEY COACH_TEMP_PASSWORD
   ```

   To deliberately rotate an existing coach password, also set `COACH_FORCE_PASSWORD_UPDATE=true`. Never trust `user_metadata` for authorization; Coach OS reads only signed `app_metadata.role`.

10. Sign in at `/coach/sign-in`, verify Coach OS opens, sign out, and sign in again so a freshly issued JWT contains the role.

## 2. Stripe

1. Set every Payment Link “after payment” redirect to `https://YOUR_DOMAIN/onboarding?session_id={CHECKOUT_SESSION_ID}`.
2. Add `package_name` metadata to each Payment Link or related Checkout Session if a custom display name is required.
3. Copy the four approved `plink_...` identifiers from Stripe into the comma-separated `STRIPE_ALLOWED_PAYMENT_LINK_IDS` Netlify variable. Onboarding rejects completed sessions from every other Stripe offer.
4. Create a webhook endpoint at `https://YOUR_DOMAIN/.netlify/functions/stripe-webhook`.
5. Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_failed`.
6. Store the live secret key and webhook signing secret only in Netlify environment variables.
7. Test an approved paid session, an incomplete session, and a completed session from a non-coaching Payment Link; only the approved paid session may reveal onboarding.

## 3. Email

1. Verify the sending domain with Resend.
2. Configure `RESEND_API_KEY`, `TRANSACTIONAL_FROM_EMAIL`, and `ONBOARDING_NOTIFY_EMAIL`.
3. Supabase Auth invitation and recovery delivery must use the production SMTP configuration and scanner-safe templates in section 1.
4. Do not include health, injury, nutrition, or signature data in notification email bodies.

## 4. Netlify

1. Resolve the audited project split in `docs/deployment-state.md`: `coach-murray` is the current manual production site while `coachmurray` is Git-linked.
2. Connect the approved canonical Netlify project to `jonmurr96/coach-murray-site` and preserve the intended public domain/aliases.
3. Add all variables from `.env.example` using production scopes.
4. Run `pnpm verify` locally.
5. Deploy a preview and exercise the QA matrix before promoting it.
6. Confirm security headers, functions, redirects, and the exact public origin from the deployed site.

## 5. Release acceptance matrix

Exercise these checks on a deploy preview with test-mode Stripe and a non-production Supabase test user before promotion:

1. A completed checkout from an approved Payment Link opens verified onboarding; an unpaid session and an unapproved Payment Link do not.
2. Submitting onboarding once creates one immutable intake, one client profile, and one account invitation. Replaying the same Checkout Session does not send another invitation or alter the first intake.
3. The post-onboarding screen asks the client to check email. Opening the email does not consume the token until **Continue securely** is selected.
4. An invite session can create a strong password but cannot read any client data beforehand. After password creation, the same user reaches `/dashboard`.
5. Signing out and using `/sign-in` with the new password returns directly to the client dashboard. A wrong or unlinked account remains closed.
6. Password recovery shows the same request response for known and unknown email addresses. An expired/reused token fails closed; a valid token changes the password and revokes other refresh sessions.
7. `/coach/sign-in` opens Coach OS only for `owner`, `coach`, or `admin` in signed `app_metadata`. A client token and a role placed only in `user_metadata` receive no coach access.
8. Coach OS can review the paid intake and, after the cooldown, resend account setup to a still-pending client. Concurrent resend attempts deliver at most one email.
9. Dashboard, Coach OS, setup, recovery, and confirmation pages return `private, no-store`, `noindex`, `no-referrer`, and the route-specific self-only script CSP.
10. Run `pnpm verify` and `pnpm test:e2e`, then inspect Netlify function logs, Supabase Auth audit logs, Stripe webhook delivery, and Resend delivery without recording secrets or health-form payloads.

## 6. Future integrations

- Calendar, analytics, AI drafting, file uploads, and lifecycle automations intentionally remain off until a provider and data/consent policy are approved.
- AI may draft a plan only on the server; a coach must review and publish it. Never send sensitive intake data to a model without an explicit privacy decision and vendor agreement.
