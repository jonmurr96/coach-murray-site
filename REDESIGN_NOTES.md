# Coach Murray redesign — September 2026

## Audit and direction

The original live homepage and quiz were reviewed on desktop and in a narrow mobile layout. The public deployment contained newer marketing pages than the repository, so the live onboarding and business terms were recovered before implementation.

The principal issues were an empty hero image placeholder, a headline animation that concealed part of the message, repetitive rounded cards and decorative effects, weak type hierarchy, missing mobile navigation, and little emphasis on the coach's engineering background or competition credibility. Several proof numbers had no supporting source. The quiz's email action displayed a success state without sending an email. The application and paid intake referenced unavailable Supabase endpoints; intake could display success after a failed submission.

The new direction uses charcoal, restrained metallic gold, condensed editorial headlines, locally hosted fonts, and Jonathon's own previously approved stage photography. “Built on data. Proven on stage.” connects engineering, competition, and coaching. The user-provided **2026 Mr. Alabama — Men's Physique** title appears prominently in the hero and coach story. No client testimonials, transformation claims, or performance statistics were invented.

The story now moves from positioning and authority to method, coach experience, the flagship offer, plan alternatives, process, frequently asked questions, and a short application. Mobile has a dedicated composition, working navigation, and a contextual application button. Motion is restrained and respects reduced-motion preferences.

## Business details preserved

| Plan | Monthly price |
| --- | ---: |
| Nutrition | $99 |
| Training | $119 |
| Full Coaching | $179 |
| Contest Prep | $249 |

The original Stripe payment links, package terms, and paid onboarding questions remain. The quiz retains the original recommendation logic, with truthful result wording and a direct path to discuss the recommended plan. Instagram is `jonmurr.fit`; contact is `jonmurr.fit@gmail.com`.

## Forms and operations

The static HTML forms are processed by Netlify Forms on the existing `coach-murray` project:

- `coaching-application`: short public inquiries, including selected coaching interest.
- `paid-client-intake`: the existing detailed intake, stored as `intake_json` with contact and package fields.

Both flows show success only after a successful server response. Failed requests retain answers and show a retry/contact message. View submissions in the project's Netlify **Forms** area. No email notification configuration is assumed; notifications are separate Netlify project settings.

The existing client-side Stripe session gate remains unchanged. It is not server-side payment verification. The legacy dashboard source files and bundled assets are preserved, but this redesign does not reconnect the unavailable Supabase services or provision a new coaching dashboard. Intake collection is ready for coach review; the website does not claim that an automated plan has been generated.

## Build and maintenance

Run `npm ci`, then `npm run dev` for development or `npm run build` for deployment. Netlify builds the source and publishes `dist`. The build uses an explicit public-file allowlist so development fixtures and dashboard source are not published. Optimized responsive WebP photos, local WOFF2 fonts, reserved image dimensions, lazy loading below the fold, and small static scripts keep the marketing experience lightweight.

The original production deploy can be restored from Netlify deploy history. Source is maintained in the existing `jonmurr96/coach-murray-site` repository.

## Verification

The static build, JavaScript syntax, HTML asset paths, unique element IDs, and whitespace checks passed. All 1,600 valid quiz answer combinations return a valid package, with representative recommendation branches checked separately. Desktop and 390px mobile compositions were visually inspected. Navigation, FAQ disclosure, plan preselection, required inputs, and failed-submission recovery were exercised in a browser. Mobile inspection used a constrained iframe because the browser surface did not expose device emulation.

No payment was made. Real-user Core Web Vitals and conversion improvements require traffic measurement after launch; no performance score or conversion uplift is asserted.
