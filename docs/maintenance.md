# Maintenance and known limitations

[Documentation index](README.md)

## Contribution workflow

1. Read the matching workflow, API and module guide before editing behavior.
2. Inspect the working tree and preserve unrelated changes. This documentation was written against a heavily modified checkout rather than a clean historical release.
3. Keep role checks at routes and ownership/participation checks at the service/controller handling the resource.
4. Pass an explicit input allowlist to persistence operations; avoid accepting identity, balance or status fields wholesale from request bodies.
5. Keep financial state changes in the existing transaction boundary. Notifications belong after the commit and must not convert a completed action into an error.
6. Reuse frontend API wrappers, auth restoration, feedback, loading and role-navigation components.
7. Run checks appropriate to the change. Use a dedicated database for integration scripts and record retained fixtures.
8. Update documentation alongside changed endpoints, configuration, field semantics and state transitions.

There is no enforced PR template, CI workflow, branching policy, formatter command, or commit-message convention in the reviewed files. Follow the team's chosen process without assuming those controls exist.

## Coding conventions in this checkout

Backend modules use ES imports/exports. Common filenames are `<domain>.routes.js`, `<domain>.controller.js`, `<domain>.service.js`, `<domain>.validation.js`, with PascalCase model names. `AppError` carries operational messages/status codes, and centralized middleware normalizes persistence/upload errors.

Frontend service files use the shared Axios instance. State belongs close to the feature unless it is session identity. Shared dashboard components live under `_components/shared`; reusable global primitives live under `src/components`. Role-specific dashboard pages select appropriate Creator/Brand/Admin views.

## Known implementation gaps

These are observations from source inspection, not a claim that every issue has been reproduced in a running environment.

| Area | Current limitation / implication |
| --- | --- |
| Specification | The tracked SRS PDF is absent from the working directory; requirements traceability has not been verified |
| Directory casing | Working directory uses `client`; older tracked files use `Client`; review the committed state for Linux deployments and email asset lookup |
| Validation | Create-campaign Zod maxima exceed Mongoose maxima; effective persisted limits are lower. Other endpoints use a mix of Zod/manual/model validation |
| Platform support | Models contain TikTok/Other and Instagram API possibilities, but creation supports only Instagram Reels and YouTube Video/Short; Instagram views are manual |
| Reward migration | Several dashboard/population paths still refer to removed legacy `reward`; do not treat every dashboard amount as ledger-authoritative |
| Money representation | Numbers have no explicit rounding, decimal precision or currency field; INR is a presentation assumption |
| Campaign funding | A campaign budget is a configured ceiling, not proof of deposited funds or escrow |
| Budget reservations | Ready rewards and accepted creators do not reserve budget; a later credit may be refused |
| Lifecycle | `COMPLETED` exists without a mounted completion action; no automatic campaign closure at deadline |
| Submission gates | Submission creation does not independently check publication/deadline; application review does not independently enforce those gates either |
| Video authenticity | YouTube API reads statistics without checking creator/channel ownership; eligible views can change with subsequent counts before credit |
| Tracking failure | Failed sync retains prior successful reward values; credit does not require a fresh successful sync timestamp |
| Tracking scale | In-process timer, 50 items per batch, no distributed lock, queue or external scheduler |
| Payment execution | Withdrawals record an external payment; no payment gateway, bank verification, automatic transfer, or cancellation workflow |
| Ledger linkage | Paid-withdrawal writer does not set `withdrawalId`, so the partial unique reference index does not cover those writes |
| Access revocation | Logout revokes refresh but does not invalidate existing access JWTs immediately; account status checks still block inactive users |
| Sessions | No refresh rotation or sliding Redis TTL; user-session revocation scans the session keyspace |
| Rate limiting | Process-local store and no configured `trust proxy`; deployment topology needs deliberate handling |
| Notifications | Polling only, best-effort writes, no outbox/retry/retention job |
| Cloudinary | Image replacement/removal does not delete old assets; abandoned uploads may remain |
| Sensitive data | Payment details are stored as ordinary fields; no field-level encryption or comprehensive audit trail is implemented |
| Moderation duplicates | Active report/dispute duplicate prevention uses service queries, not a unique conditional index |
| Automated checks | No `npm test`, conventional test directory, or CI; one YouTube submission fixture conflicts with Instagram format validation |
| Configuration | Startup validates only five required variable presences; other settings can fail later when used |
| Admin onboarding | No public admin signup or admin bootstrap script |
| Account recovery | No implemented password reset/change or email-change endpoint |
| Legal/package metadata | Backend manifest declares ISC, frontend is private; no standalone repository license file was found |

## Documentation upkeep

| Change | Documents to update |
| --- | --- |
| New/changed endpoint or payload | [API](api.md), [workflows](workflows.md), module guide |
| New env variable or provider | [Setup](setup.md), [deployment](deployment.md), [architecture](architecture.md) |
| New model/index or money rule | [Data model](data-model.md), [workflows](workflows.md), [backend](backend.md) |
| New UI route or role | [Frontend](frontend.md), [workflows](workflows.md), API permissions if applicable |
| New script/check | [Testing](testing.md), relevant runbook |
| Hosting/job change | [Deployment](deployment.md), [architecture](architecture.md), limitation inventory |

Check Markdown links, command working directories, env-variable names, route coverage, and code examples against source. Never copy private `.env` values into documentation. Update the review date when rechecking behavior, and distinguish proposed improvements from implemented features.
