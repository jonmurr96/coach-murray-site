# Production Integration Runbook

## 1. Supabase

1. Give the connected Supabase account access to the intended production project, or select one approved project.
2. Apply `supabase/migrations/20260710000000_coach_os_canonical.sql` through the Supabase CLI or SQL editor.
3. Set the public URL/publishable key and server service-role key in Netlify using `.env.example` as the name contract.
4. Sign in once as the owner, then assign `app_metadata.role = owner` through a privileged admin workflow. Never expose role assignment in the browser.
5. Configure Auth site URL and redirect allowlist for `/dashboard` and `/admin` on the production domain.

## 2. Stripe

1. Set every Payment Link “after payment” redirect to `https://YOUR_DOMAIN/onboarding?session_id={CHECKOUT_SESSION_ID}`.
2. Add `package_name` metadata to each Payment Link or related Checkout Session if a custom display name is required.
3. Create a webhook endpoint at `https://YOUR_DOMAIN/.netlify/functions/stripe-webhook`.
4. Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_failed`.
5. Store the live secret key and webhook signing secret only in Netlify environment variables.
6. Test both a completed and incomplete session; incomplete or forged IDs must not reveal onboarding.

## 3. Email

1. Verify the sending domain with Resend.
2. Configure `RESEND_API_KEY`, `TRANSACTIONAL_FROM_EMAIL`, and `ONBOARDING_NOTIFY_EMAIL`.
3. Supabase Auth invitation/magic-link delivery must also have a production SMTP configuration and matching redirect allowlist.
4. Do not include health, injury, nutrition, or signature data in notification email bodies.

## 4. Netlify

1. Resolve the audited project split in `docs/deployment-state.md`: `coach-murray` is the current manual production site while `coachmurray` is Git-linked.
2. Connect the approved canonical Netlify project to `jonmurr96/coach-murray-site` and preserve the intended public domain/aliases.
3. Add all variables from `.env.example` using production scopes.
4. Run `pnpm verify` locally.
5. Deploy a preview and exercise the QA matrix before promoting it.
6. Confirm security headers, functions, redirects, and the exact public origin from the deployed site.

## 5. Future integrations

- Calendar, analytics, AI drafting, file uploads, and lifecycle automations intentionally remain off until a provider and data/consent policy are approved.
- AI may draft a plan only on the server; a coach must review and publish it. Never send sensitive intake data to a model without an explicit privacy decision and vendor agreement.
