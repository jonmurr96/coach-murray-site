# Coach Murray Web

One deployable project for the public Coach Murray website, Stripe-verified onboarding, client portal, and Coach OS.

## Local development

```bash
corepack enable
pnpm install
pnpm dev
```

Open `/onboarding?preview=1`, `/dashboard`, and `/admin` locally for clearly labeled fictional preview data. Production builds never enable this preview path.

## Verification

```bash
pnpm verify
```

The Netlify production build publishes only `dist`; historical standalone files at the repository root are not deployed.

See [architecture](docs/architecture.md), [design system](DESIGN.md), and the [integration runbook](docs/integration-runbook.md).
