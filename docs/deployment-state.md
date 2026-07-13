# Audited Deployment State

State captured July 12, 2026.

## GitHub

- Repository: `jonmurr96/coach-murray-site`
- Production branch remains `main`; no production promotion was performed.
- Release candidate branch: `codex/coach-os-v2`
- Draft review: pull request #1
- The draft pull request is the source of truth for the current candidate commit.

## Netlify

The existing project split is preserved deliberately:

| Project                | Site ID                                | Current role                                                                 |
| ---------------------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| `coach-murray`         | `78da1788-ca6c-46c8-abfa-442175f35bba` | Public production origin; still serving its prior deploy                     |
| `coach-murray-landing` | `965d4619-c465-445f-88c1-f3fc8a73be30` | Existing landing/redirect project; unchanged                                 |
| `coachmurray`          | `551c227c-d278-4b9d-b744-d7d6f46c5f1c` | Isolated live candidate at `https://coachmurray.netlify.app` and PR previews |

The candidate was uploaded from the release branch through Netlify's managed deploy path. Its static routes, redirects, headers, Functions, Supabase connection, Stripe connection, client role boundary, and coach role boundary have been exercised. Production `coach-murray` was not overwritten.

All 13 currently usable variables from `.env.example` are configured on `coach-murray`; `TRANSACTIONAL_FROM_EMAIL` is intentionally absent because no Resend domain is verified. The same runtime contract is present on the isolated candidate. Netlify encrypts ordinary environment variables at rest, but the current Developer plan does not expose custom scopes. Live attempts to use Secrets Controller or Functions-only scopes returned `503` from otherwise healthy Stripe Functions, so the working all-scope configuration was restored and reverified without exposing values. Upgrading Netlify is required before those credentials can be made write-only and Functions-scoped.

## Supabase

- Canonical project: `Coach-Murray`
- Project ref: `emowlnxzcemeteiuftaj`
- State: active and healthy
- Canonical schema, three security/performance follow-up migrations, the URL-resource Library guardrail migration, and both explicit account-setup completion migrations are applied.
- All public tables have RLS. Client reads are scoped to the signed user and published/assigned data; Coach OS uses role-checked Netlify Functions rather than browser-wide coach policies.
- Hosted Auth is invite-only, anonymous sign-in is disabled, password minimum is 12 characters with lowercase/uppercase/digit requirements, refresh-token rotation is enabled, and password changes require recent authentication.
- Production and candidate confirmation URLs are allowlisted. `supabase config push` reports remote Auth, API, and DB configuration up to date.
- The configured owner email exists as a confirmed Auth user with signed `app_metadata.role = owner`. A one-time password-setup email was sent through Resend's account-only test sender.
- Supabase's security advisor has one remaining plan-gated warning: leaked-password/HIBP protection requires Supabase Pro. An API attempt to enable it returned `402`.

## Stripe

- Four live Payment Link IDs are stored in the server allowlist.
- An active live Billing Portal configuration provides invoice history, payment-method updates, and cancellation at period end. Both Netlify projects store its exact configuration ID so client billing sessions do not depend on a mutable default.
- A live webhook endpoint exists at `https://coach-murray.netlify.app/.netlify/functions/stripe-webhook` with exactly the required five event types.
- The endpoint remains disabled until production promotion. Its signing secret is stored outside Git.
- A real completed session from an allowlisted Payment Link returned `200 verified` through the candidate Function.
- Signed and invalid-signature webhook probes returned `200` and `400`, respectively.
- Live Payment Link redirects still point to the existing production onboarding URLs and do not yet include `{CHECKOUT_SESSION_ID}`. They must be changed only when the new production deploy is ready.

## Email release gate

`jonmurr.fit` currently returns DNS `NXDOMAIN`. Resend reports the domain, DKIM, and SPF records as failed. Because Supabase's free tier rejects hosted template changes while its default mailer is active, production SMTP and the scanner-safe invitation/recovery templates cannot be activated until one of these is true:

1. `jonmurr.fit` is registered and its Resend DNS records verify, or
2. another owned, verified sending domain is supplied.

The branded scanner-safe templates already exist in `supabase/templates`. Do not enable live Payment Link redirects, the Stripe webhook, or the new production deploy while paid-client invitation delivery remains unavailable.

## Candidate verification evidence

- Verification equivalent to `pnpm verify`: type-check, 99 tests, and production build passed.
- `pnpm test:e2e`: 25 Chromium accessibility, access-boundary, mobile-auth-entry, and containment checks passed.
- Trusted candidate lead submission wrote one lead and one submission to Supabase; the test record was verified and deleted.
- Untrusted origin, anonymous session, and malformed checkout probes failed closed with `403`, `401`, and `400`.
- Ephemeral browser clients reached `/dashboard`; ephemeral owner-role coaches reached `/admin`; cross-role APIs were denied; all test users and data were removed.
- An ephemeral owner created, edited, assigned, unassigned, and deleted a Library resource through the live candidate. The assigned client received it through both the dashboard API and browser UI.
- An ephemeral linked client created a live Stripe Billing Portal session and received an HTTPS `billing.stripe.com` destination. The temporary Stripe customer, Supabase users/profile, and Library records were removed afterward.
- Landing, client sign-in, coach sign-in, setup, confirmation, onboarding, dashboard, and admin routes rendered without console errors or horizontal overflow.

## OpenAI Sites

No Sites project is part of the production path. Netlify and GitHub remain the established deployment system.
