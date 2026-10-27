# Backend guide

[Documentation index](README.md)

## Entrypoints and lifecycle

Run from `Server/`. [server.js](../Server/src/server.js) loads dotenv, validates required environment values, connects MongoDB, connects Redis, starts the YouTube tracking timer, then listens on `PORT` (fallback 5000). Startup failure exits with code 1.

[app.js](../Server/src/app.js) constructs the Express app separately from startup. This allows an integration script to import the app and choose an ephemeral HTTP port, while connecting dependencies itself.

`SIGINT`/`SIGTERM` stops future tracking ticks, closes the HTTP server, closes MongoDB and Redis, and exits. There is no explicit forced-shutdown deadline or durable job handoff.

## Middleware order

1. Helmet security headers.
2. Credentialed CORS for `CLIENT_URL` and explicit allowed headers.
3. JSON and URL-encoded parsers, each limited to 1 MB.
4. Cookie parser.
5. Public root health response.
6. Global `/api` rate limiter.
7. Domain routers, including per-route authentication, authorization, validation, and upload middleware.
8. Unknown-route `AppError` with 404.
9. Central error handler.

Multipart image uploads are parsed by Multer on their route and have a separate 5 MB limit. Authentication routes add origin/header/JSON checks for non-retired mutating calls. The app does not configure Express `trust proxy`.

## Domain modules

| Module | Primary behavior |
| --- | --- |
| `signup.controller.js` | Email-first signup, Redis single-use tokens, setup cookies, profile completion and legacy unverified-account completion |
| `auth.service.js`, `session.service.js` | Login checks, refresh validation, session creation/revocation |
| `profile.controller.js` | Apply validated role-appropriate profile fields |
| `campaign.service.js` | Create/edit/publish/close, visibility, discovery, budget enrichment |
| `application.service.js` | Apply once, owner review, slot enforcement |
| `submission.service.js` | Accepted-creator submission, revisions, reviews, YouTube baseline capture |
| `performanceReward.service.js` | Manual views, reward eligibility, transactionally credit within budget |
| `youtube.service.js`, `youtubeTracking.service.js` | Provider fetches, baseline, eligible-growth sync and failure metadata |
| `wallet.service.js` | Lazy wallet creation, reward ledger writes, wallet totals and transaction reads |
| `withdrawal.service.js` | Reserve available funds, approve, restore on rejection, record paid debit |
| `report.service.js`, `dispute.service.js` | Target/participant checks, active-duplicate checks, admin resolution |
| `admin.service.js` | Non-admin user moderation, session revocation, campaign closure |
| `dashboard.service.js`, `dashboardDetails.service.js` | Role-specific counts, charts, queues and recommendations |
| `notification.service.js` | Best-effort event upserts, recipient lists, read state |

Most controllers delegate to services; several list/detail/dashboard controllers also query models directly. The mounted dashboard controller uses its own Creator implementation and the dashboard service for Brand/Admin. Do not assume every exported service is reached by an HTTP route.

## Authentication and authorization

`protect` requires a Bearer access JWT, verifies it, reloads the user, rejects non-active accounts, and attaches `{userId, role}` to `req.user`. `authorize(...roles)` restricts roles. Services/controllers separately confirm resource ownership or participation.

Signup hashes passwords with bcrypt cost 12. JWT access and refresh signing use separate configured secrets and expirations. Refresh additionally requires a matching live Redis session and active database user. Access tokens do not validate Redis session membership. See [architecture](architecture.md) for logout and revocation implications.

## Validation and response handling

`validate(schema)` parses `{body, params, query}` using Zod, stores parsed input in `req.validated`, and throws a 400 `AppError` with concatenated messages on failure. Profile updates consume parsed data. Campaign creation runs a Zod gate but its controller reads `req.body`; model validation remains significant.

Login, profile, and campaign requests have explicit Zod schemas. Signup has controller-local schemas. Many other operations use manual checks plus Mongoose validation. ObjectId validation varies by module; invalid casts are normalized by the error handler.

The error middleware maps Mongoose cast/validation errors to 400, duplicate keys to 409, oversized Multer files to 413, and other Multer errors to 400. It logs server errors and masks their details in production. Express 5 propagates rejected async handlers; some controllers also explicitly call `next(error)`.

Return established JSON keys and status codes when adding an endpoint. New ownership and state failures should be deliberate; existing modules use both 400 and 409 for invalid transitions.

## Transactions and concurrency

MongoDB must support transactions. Key operations are:

| Operation | Consistency behavior |
| --- | --- |
| Application acceptance | Transaction updates shared campaign version before recounting accepted slots |
| Submission review | Transaction checks owner and current review state, then saves decision |
| Manual view verification | Transaction checks approval/no prior credit, calculates reward, saves verification |
| YouTube synchronization | Fetches provider data, then rechecks content/baseline/reward state inside a transaction |
| Reward credit | Shared campaign version write, completed-spend check, duplicate check, wallet/ledger/submission updates in one transaction |
| Withdrawal request | Reserves available balance and creates request in one transaction |
| Withdrawal rejection | Restores balance and closes request in one transaction |
| Withdrawal paid | Writes debit, increments total withdrawn and marks paid in one transaction |

Withdrawal approval uses an atomic conditional update matching `PENDING`. Notifications occur after business changes and are not included in their transactions.

Do not call the wallet credit helper as an independent payment workflow: the performance reward service supplies approval, eligibility, budget checks and the transaction session. Completed reward credits determine spend; pending rewards do not reserve budget.

## Background YouTube job

`startYouTubeTracking()` attempts an immediate tick and schedules a tick every 15 minutes. If no API key is set, ticks do no work. Each process prevents overlapping local ticks with a boolean flag.

The batch selects up to 50 submissions, ordered by `updatedAt`, where content is approved, reward is not credited, tracking source is `YOUTUBE_API`, and the last successful sync is at least 15 minutes old or absent. It synchronizes sequentially and logs per-item errors. Failed videos remain eligible to retry.

Provider requests have a 10-second timeout. Error messages avoid logging the URL because it contains the key. A valid sync sets verified views to nonnegative growth from baseline and recalculates the reward. There is no automatic credit or stop-at-deadline check.

Every API process starts this timer. Running several instances duplicates scheduling without a distributed lock. The callable `runYouTubeTrackingBatch()` scans all qualifying database records, including when invoked by an integration script.

## Notifications

Delivery uses a unique recipient/event key and `$setOnInsert`, preserving existing read state. Titles/messages are bounded. Only `/dashboard` links are accepted. Failures are caught and logged; a completed business action still succeeds. There is no retry queue/outbox, so delivery can be lost during a notification write failure.

Lists and read updates are recipient-scoped. Mark-all uses a validated server-time cutoff to avoid clearing newer events. Reads are idempotent for an already read notification.

## Commands

Run inside `Server/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Nodemon development process |
| `npm start` | Node production/runtime entry point |
| `npm run seed` | Create the single unverified development Creator if absent |

There is no compile step, server lint script, or `npm test` script. Integration scripts and the legacy reward migration are invoked directly; see [testing](testing.md) and [operations](deployment.md).
