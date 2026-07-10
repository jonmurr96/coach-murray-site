# Coach Murray Web

One deployable project for the public Coach Murray website, Stripe-verified onboarding, client portal, and Coach OS.

## Local development

```bash
corepack enable
pnpm install
pnpm dev
```

Open `/onboarding?preview=1`, `/dashboard`, and `/admin` locally for clearly labeled fictional preview data. Production builds never enable this preview path. Production authentication routes are `/sign-in`, `/coach/sign-in`, `/account/confirm`, `/account/setup`, and `/account/reset`; public signup is intentionally unavailable.

## Verification

```bash
pnpm verify
pnpm exec playwright install chromium
pnpm test:e2e
```

The Playwright gate builds the production bundle, checks public routes, runs
automated WCAG A/AA scans, detects mobile horizontal overflow, and verifies that
onboarding and protected dashboards remain closed when production credentials
are absent. It also checks distinct client/coach sign-in entry points, protected
account routes, and mobile containment. GitHub Actions runs both commands on every pull
request.

The Netlify production build publishes only `dist`; historical standalone files
at the repository root are not deployed.

See [architecture](docs/architecture.md), [design system](DESIGN.md), and the [integration runbook](docs/integration-runbook.md).
