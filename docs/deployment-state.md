# Audited Deployment State

State captured July 10, 2026.

## GitHub

- Repository: `jonmurr96/coach-murray-site`
- Production branch before this work: `main` at `0ae25fc`
- Rebuilt source branch: `codex/coach-os-v2`
- Draft review: pull request #1

## Netlify

Three existing projects were found:

| Project                | Site ID                                | Role before v2                                                                       |
| ---------------------- | -------------------------------------- | ------------------------------------------------------------------------------------ |
| `coach-murray`         | `78da1788-ca6c-46c8-abfa-442175f35bba` | Current public site at `coach-murray.netlify.app`; manual/API deploy, not Git-linked |
| `coach-murray-landing` | `965d4619-c465-445f-88c1-f3fc8a73be30` | Landing/redirect project                                                             |
| `coachmurray`          | `551c227c-d278-4b9d-b744-d7d6f46c5f1c` | Legacy Git-linked project for `jonmurr96/coach-murray-site`                          |

The draft pull request deploy preview runs on the Git-linked `coachmurray` project. It is not the current `coach-murray` production origin. Before production promotion, choose one canonical Netlify project and connect the repository, domains, environment variables, Stripe redirect, and webhook to that same project. The recommended path is to preserve the current public `coach-murray` identity while making its deploy source reproducible from the GitHub repository.

Both relevant Netlify projects returned no configured environment variables during the audit. Production promotion is intentionally withheld until the required values in `.env.example` exist.

## Supabase

The two project references embedded in the legacy pages were not accessible through the connected Supabase account. The accessible projects in that account were inactive and had different project references. No migration was applied and no new paid project was created.

The SQL migration in `supabase/migrations` is ready for one approved canonical project. Applying it and setting the Netlify variables are external activation steps, not code changes.

## OpenAI Sites

No existing Sites project was returned for the connected account, and there was no local `.openai/hosting.json`. No additional Sites project was created because Netlify and GitHub are the established deployment path for this product.
