# Legacy Inventory and Disposition

These files remain in the local working folder only so the original state can be audited. They are ignored by Git and excluded from Netlify because the production publish directory is `dist`.

| Legacy artifact         | Disposition                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `admin.html`            | Replaced by the authenticated React Coach OS route and server-side role enforcement           |
| `portal.html`           | Replaced by the authenticated React client dashboard                                          |
| `onboarding.html`       | Replaced by Stripe-verified React onboarding and a transactional Supabase function            |
| `admin-dashboard.jsx`   | Superseded design prototype; its useful IA was incorporated into Coach OS                     |
| `client-dashboard.jsx`  | Superseded design prototype; its useful IA was incorporated into the client portal            |
| `assets/index-*.js/css` | Historical compiled landing bundle with no reproducible source; not published                 |
| `deploy.sh`             | Historical Git helper that did not deploy Netlify; replaced by the reproducible Netlify build |
| `index.html.bak`        | Historical backup; not published                                                              |

The supplied v2 client and owner dashboard HTML files outside this workspace were treated as interaction and information-architecture references only. Their raw `innerHTML`, invalid handlers, custom card fields, static mock integrations, and mobile overflow were not copied into production source.
