# Design Guideline: Coach Murray Coaching Ecosystem

## Product intent

The experience moves a prospect through one trustworthy sequence: understand the offer, choose a package, complete Stripe Checkout, submit verified onboarding, then work from a populated client dashboard. Coach OS is the owner-facing control plane for the same records.

## Experience principles

1. **Earn trust at each boundary.** Payment, onboarding, health-related answers, and messaging clearly explain what is happening and who can see the data.
2. **Make the next action obvious.** Each page has one dominant decision; operational dashboards rank work by urgency.
3. **Keep the brand disciplined.** Black, warm gold, cream text, Cabinet Grotesk, DM Sans, and Lucide define the family resemblance across every route.
4. **Tell the truth about state.** Preview, empty, loading, failure, saved, and configuration-required states are visibly distinct.
5. **Design for the phone first.** The client portal remains easy to use one-handed; Coach OS uses a drawer rather than compressing its wide information architecture.

## Page hierarchy

- Marketing pages persuade and explain.
- Checkout is hosted by Stripe.
- Onboarding is a focused six-step task with purchase verification before fields appear.
- Client dashboard emphasizes today’s plan, adherence, coach feedback, and fast check-ins.
- Coach OS emphasizes review queues, clients needing attention, program publishing, and messages.

## Layout guidance

- Marketing content max-width: 1200px; long-form text max-width: 720px.
- Product content max-width: 1320px client / 1440px coach.
- Page gutters: 16px mobile, 24px tablet, 32px desktop.
- Prefer two-column detail layouts only above 1200px.
- Dense tables get a real overflow container; the document itself must never overflow horizontally.

## Responsive breakpoints

- 320–639px: single column, mobile navigation, full-width form actions.
- 640–1023px: two-column cards where helpful, mobile navigation retained.
- 1024px+: persistent sidebar and multi-column operational layout.
- 1440px+: content width stays capped; whitespace grows instead of cards stretching indefinitely.

## Component behavior

- Inputs are 44px minimum, use visible labels, and preserve user values after recoverable errors.
- Primary buttons use concise verb phrases and show action-specific loading text.
- Notifications are brief and never the only place an error appears for a blocked task.
- Status badges contain text and use restrained tint backgrounds.
- Tables expose column headings and keep identities, status, and action context together.
- Empty states explain the event that will populate the area.

## Quality bars

- WCAG 2.2 AA target for contrast, focus, keyboard use, names, roles, and labels.
- No raw card data, service-role keys, or third-party API secrets in browser bundles.
- No preview record can be confused for a real client.
- No saved/published/sent confirmation occurs before server confirmation.
- Reduced motion is respected globally.
