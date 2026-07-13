# Coach Murray Design System

This is the canonical visual and interaction contract for the public site, verified onboarding, client portal, and Coach OS. New UI should use these decisions before introducing a variant.

## Product character

Coach Murray should feel disciplined, direct, premium, and personal. The interface uses restraint: near-black surfaces, warm gold for priority and brand, generous spacing, and clear operational language. It must never resemble a generic blue SaaS dashboard or a casino-style luxury theme.

## Foundation

### Color tokens

| Token                 |     Value | Use                                 |
| --------------------- | --------: | ----------------------------------- |
| `--cm-bg`             | `#050507` | Page background                     |
| `--cm-surface`        | `#0C0C10` | Navigation and primary panels       |
| `--cm-surface-raised` | `#15151A` | Inputs and nested panels            |
| `--cm-border`         | `#292930` | Default dividers and borders        |
| `--cm-border-strong`  | `#3A3A43` | Hover and emphasis borders          |
| `--cm-gold`           | `#D4AA40` | Brand and primary action            |
| `--cm-gold-light`     | `#F0D070` | High-emphasis gold text/focus       |
| `--cm-gold-dark`      | `#A77E20` | Gradient depth only                 |
| `--cm-text`           | `#F4F1EA` | Primary text                        |
| `--cm-text-soft`      | `#C6C2B8` | Secondary readable text             |
| `--cm-text-muted`     | `#96938B` | Labels and metadata                 |
| `--cm-positive`       | `#64C590` | Confirmed positive state            |
| `--cm-warning`        | `#F2B84B` | Attention needed                    |
| `--cm-danger`         | `#F2776B` | Destructive/error state             |
| `--cm-info`           | `#73AEF5` | Informational state, used sparingly |

Gold is not body text. Status colors must always be paired with text or an icon, never used as the only signal.

### Typography

- Display and headings: Cabinet Grotesk, weights 700–800.
- UI, body, forms, and data: DM Sans, weights 400–700.
- Fraunces is permitted only as an editorial accent on the marketing site.
- Headings use tight tracking and balanced wrapping. Body copy targets 60–75 characters per line.
- Minimum body size is 14px in dense operational UI and 16px for marketing or instructional copy.

### Shape, spacing, and elevation

- Spacing follows a 4px base: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Inputs and compact controls use a 10px radius; navigation and buttons use 14px; large cards use 20px.
- Borders, not shadows, establish most hierarchy. The large card shadow is reserved for focused flows such as onboarding and authentication.
- Every pointer target is at least 44×44px.

## Components

### Buttons

- Primary: gold gradient, near-black text, one per decision area.
- Secondary: raised dark surface with visible border.
- Tertiary: text button in gold, still at least 44px high.
- Destructive actions require explicit red styling and confirmation.
- Loading text describes the current action: “Publishing…”, not “Please wait”.

### Forms

- Every control has a programmatically associated label.
- Required fields use an asterisk plus native/semantic validation.
- Errors appear beside or above the affected area and explain how to recover.
- Success is only shown after persistence is confirmed by the server.
- Sensitive payment fields never render in Coach Murray UI; Stripe Checkout and Billing Portal own them.

### Cards and tables

- A card represents one coherent concept. Nested cards are limited to one level.
- Tables use real table semantics, visible headers, horizontal scrolling below their minimum content width, and an adjacent mobile alternative when row actions become complex.
- Empty states name what is absent and what event will populate it.

### Navigation

- Public site: compact header plus a real mobile menu.
- Client desktop: one 264px sidebar. Client mobile: four primary destinations plus a More sheet.
- Coach OS desktop: one 272px grouped sidebar. Coach OS mobile: top bar plus full-height drawer.
- Never show desktop and mobile navigation simultaneously.

### Icons and imagery

- Lucide is the only product icon family. No emoji serve as interface icons.
- Icons clarify labels; they do not replace labels for primary navigation or ambiguous actions.
- Photography should show real coaching, real movement, and natural contrast. Avoid generic stock gym imagery.

## Interaction and accessibility

- Keyboard focus uses a 3px `--cm-gold-light` ring with 3px offset.
- A skip link precedes application navigation.
- Drawers and modal sheets must have named close buttons and a visible overlay.
- Motion is limited to 160–240ms for hover, drawer, and feedback transitions. `prefers-reduced-motion` disables nonessential motion.
- WCAG AA contrast is the floor. Muted text is never used for required instructions.
- Do not disable zoom or lock viewport scaling.

## Content rules

- Lead with the client’s next decision or coach’s next operational task.
- Use plain language: “Program published” instead of “Mutation successful.”
- Do not invent schedules, delivery times, integration states, or saved outcomes.
- Preview data must be labeled as fictional and non-persistent.
- Medical diagnoses and emergency guidance are outside the product’s scope; the intake should collect only information necessary to adapt coaching safely.

## Acceptance checklist

- Uses semantic tokens instead of introducing near-duplicate black/gold values.
- Works at 320px without horizontal document overflow.
- Has visible hover, focus, loading, success, error, disabled, and empty states where relevant.
- Does not expose secrets or privileged actions in browser code.
- Does not claim data was saved before a successful server response.
- Avoids raw `innerHTML`, hardcoded admin credentials, emoji icons, and raw payment inputs.
