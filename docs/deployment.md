# Deployment and operations

[Documentation index](README.md)

## Deployment model

Deploy a Next.js frontend and a persistent Node.js Express API separately. Provide transaction-capable MongoDB, Redis, SMTP, and the integration credentials needed by enabled features. The repository has no Dockerfile, Compose setup, infrastructure manifests, process-manager configuration, or CI/CD workflow; the commands here describe application requirements rather than an existing automated deployment.

The current working directory uses `client/`, while older tracked Git entries use `Client/`. Review the committed checkout's directory casing before deploying on a case-sensitive filesystem. The backend email logo path specifically resolves to lowercase `client/public/brand/logo.png`.

## Build and run

For the API, install from `Server/` and start:

```powershell
npm ci
npm start
```

There is no backend compile step. Run from `Server/`, or provide environment variables through the hosting platform so dotenv working-directory assumptions do not matter.

For the frontend, set `NEXT_PUBLIC_API_URL` to the public backend base ending in `/api` before building, then run in `client/`:

```powershell
npm ci
npm run build
npm start
```

The frontend is configured for a Next.js runtime, with no static export or standalone output setting. Changing the public API URL after building requires a new frontend build.

## Production configuration

| Concern | Required configuration |
| --- | --- |
| Trusted browser origin | `CLIENT_URL` must match the actual frontend origin exactly, without path/trailing slash |
| Public API URL | `NEXT_PUBLIC_API_URL=https://api.example.com/api` (illustrative hostname) |
| Cookie policy | `NODE_ENV=production` enables Secure and SameSite=None; serve API and frontend over HTTPS |
| Credentials | Set private server variables using host secrets; never put provider/JWT/database secrets in public frontend variables |
| Database | Reachable replica set/sharded deployment with appropriate credentials and backup strategy |
| Redis | Reachable authenticated service; TLS URI where required; losing sessions invalidates refresh/signup state |
| Email asset | Package `client/public/brand/logo.png` at the relative location expected by the backend email service |
| Uploads | Configure all three Cloudinary variables; allow multipart traffic and sufficient proxy body size for a 5 MB file plus overhead |
| YouTube | Provide the API key for submission capture and tracking; track provider quota and failures |
| Runtime | Use a persistent API process for the in-memory timer; it is not a durable scheduled worker |

Production's `SameSite=None` does not override browser third-party cookie blocking. Verify signup and refresh in the intended frontend/API domain topology. Hosting both under a compatible site can simplify cookie behavior, but any proxy/rewrite mapping must be configured explicitly; none is bundled.

## Reverse proxy and scaling

The Express app has no `trust proxy` setting. Configure it deliberately for your proxy topology before relying on client-IP-based rate limits; trusting arbitrary forwarded headers is also incorrect. Current limiter stores are in memory, so multiple instances have independent counts and restarts reset them.

Each API instance starts its own YouTube scheduler. Multiple instances may duplicate upstream reads and consume extra quota. Transaction checks guard important reward writes but are not a distributed job scheduler. Before scaling, add a coordinated worker/lock strategy and shared rate-limit storage if required.

Notifications are best effort after business commits. There is no durable outbox/retry mechanism. API restarts and notification failures may leave missing events even though the business record changed successfully.

## Release verification

1. Build/lint the frontend and review applicable integration checks in an isolated environment.
2. Confirm the deployment includes current source, lockfiles and email logo asset, with correct directory casing.
3. Provision/configure MongoDB, Redis and required providers; verify the new API process starts successfully.
4. Build frontend with the final public API URL and publish both application services.
5. Check `GET /`, then browser signup/login/refresh/logout using the production origins and cookies.
6. Exercise a non-production account's campaign, cover upload and submission reads; perform financial acceptance checks in a dedicated test environment.
7. Observe API error, provider sync and notification logs during rollout.

The root HTTP response only proves that the process is serving requests. No readiness endpoint continuously checks MongoDB/Redis, and no metrics endpoint is implemented.

## Logs and monitoring

The app logs to the process console. Startup/shutdown, database connections, Redis errors, 5xx errors, YouTube batch failures and notification failures are visible there. SMTP transport logging is enabled in development. There is no structured logging service, tracing, metrics, or alerting configuration.

Operational monitoring should observe API availability, unexpected 4xx/5xx rates, database/Redis connectivity, SMTP failures, tracking staleness/failures, YouTube quota, and payout queue age. Avoid logging passwords, tokens, provider keys, verification URLs, or payment details. The YouTube service intentionally avoids logging request URLs containing keys.

## Backups and recovery

Back up MongoDB business data and maintain a tested restore process. Wallet, withdrawal and transaction records must be restored consistently. Cloudinary assets live outside MongoDB; database records only contain URLs/public IDs. Plan asset retention separately.

Redis holds temporary signup and session state. A Redis flush or unrecoverable restart may log users out and invalidate outstanding setup flows. Recovery should request new verification links/sign-ins rather than fabricate token records.

There is no automated ledger reconciliation or refund process. Investigate discrepancies with completed transactions and withdrawal states before any manual repair. The paid-withdrawal writer currently omits `withdrawalId`; see [data model](data-model.md).

## Legacy campaign reward migration

Source: [migrateCampaignRewards.js](../Server/scripts/migrateCampaignRewards.js). Back up the target database and inspect candidate records before running from `Server/`:

```powershell
node scripts/migrateCampaignRewards.js
```

This command writes to the database configured by `MONGODB_URI`. It has no dry-run flag. It selects raw campaigns missing either `campaignBudget` or `rewardRatePerThousandViews`, then proposes:

```text
oldReward = Number(reward) or 2500
oldMaxCreators = Number(maxCreators) or 10
campaignBudget = oldReward * oldMaxCreators
rewardRatePerThousandViews = 200
minimumPayout = 800
maximumPayoutPerCreator = oldReward
creatorSlots = oldMaxCreators
```

It validates all proposed reward configurations before writing any records, conditionally updates each candidate, verifies saved values, and retains legacy `reward`/`maxCreators`. Existing rewards below the proposed minimum can fail validation. The migration is not one transaction across the entire collection; a write failure may leave earlier records migrated. It can also overwrite other new reward fields on a partially migrated candidate.

Rerunning skips campaigns where both selection fields already exist. It does not convert historical submission rewards, repair dashboards, credit wallets, or reconcile the ledger. Use the backup to recover unintended data changes; no rollback command is included.

## Shutdown and rollback

Send `SIGTERM`/`SIGINT` to allow the server to close HTTP connections and dependencies. The tracking stop flag prevents further loop work but is not a durable checkpoint. Configure your host's process lifecycle and shutdown timeout appropriately.

Keep a known previous source/build artifact and matching configuration for application rollback. Reverting application files does not undo database migration, credits, withdrawals, or external payments; those need explicit reconciliation/recovery procedures.
