# Testing and verification

[Documentation index](README.md)

## What exists

The frontend has ESLint and a production build command. The backend has standalone Node assertion/integration scripts under `Server/scripts/`. Neither package defines `npm test`, and no `Server/tests/` directory or CI workflow was present in the reviewed working tree. An IDE tab pointing to a test file does not make it available on disk.

The commands below describe how to run checks; they are not a claim that the application's full suite passed during this documentation change. Database/provider scripts were inspected rather than run against configured services.

## Local static checks

Run inside `client/`:

```powershell
npm run lint
npm run build
```

Build with the intended `NEXT_PUBLIC_API_URL`. Existing lint/build issues should be recorded separately from documentation validation. A successful build checks frontend packaging; it does not validate live API or financial flows.

From the project root, check backend JavaScript syntax without starting services:

```powershell
Get-ChildItem Server/src, Server/scripts -Filter *.js -Recurse | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { throw "Syntax check failed: $($_.FullName)" }
}
```

## Integration prerequisites

Use a dedicated disposable database and Redis configuration. The scripts load `Server/.env`, many create retained records, and several generate Bearer tokens directly from database users. This bypasses normal login/signup and does not test those flows.

Most HTTP scripts require `npm run dev` or `npm start` already running, using the same database and JWT configuration as the script. Configure `PORT` consistently; those scripts call `http://localhost:<PORT>/api`. Transaction checks require a replica set.

Provider-specific checks need a valid YouTube key or Cloudinary account as indicated. Some scripts use fixed deadlines of `2026-12-15T23:59:59.000Z`; update these to a future date when necessary. Review fixtures against current campaign-format validation before running.

## Script inventory

Run commands in this table from `Server/`.

| Command | Coverage | Requirements and side effects |
| --- | --- | --- |
| `node scripts/testCampaignCreation.js` | Valid performance campaign and invalid payout constraints | Running API, active Brand; successful campaign remains in DB |
| `node scripts/testCampaignCreation.js --invalid-only` | Invalid payout constraints only | Same API/Brand requirements; skips successful creation case |
| `node scripts/testCampaignCoverImage.js` | Optional cover, invalid URL, edit/clear/restore, read/persistence behavior | Running API, active Brand; retains published test campaign; uses an image URL without uploading |
| `node scripts/testLiveCampaignCover.js` | Real multipart upload, replacement, brand/creator reads | Running API, active Brand and Creator, Cloudinary; retains campaign and two provider assets |
| `node scripts/testPerformanceRewardFlow.js` | Approval separate from payment, thresholds/cap, credit/duplicate, ledger/budget, concurrent credits | Running API, active Brand, transaction-capable DB; retains fixtures and writes root `PERFORMANCE_REWARD_CHECKPOINT.json` |
| `node scripts/finalRewardRegression.js` | End-to-end participation/reward checks and exact insufficient-budget case | Running API, transaction-capable DB; retains fixtures and writes root `FINAL_REWARD_REGRESSION.json` |
| `node scripts/testYouTubeSubmission.js` | Submission baseline capture and provider-backed sync | Running API, YouTube key, DB; removes tracked fixture users/campaigns/applications/submissions in finally; notification residue may remain |
| `node scripts/testYouTubeTrackingFlow.js` | Controlled counts, baseline delta, outages, ownership, caps, budget, revisions, scheduled batch | Starts its own ephemeral app server; real DB with mocked YouTube fetch; cleans tracked business fixtures, but notification residue may remain |

`seed-user.js` and `migrateCampaignRewards.js` are data-writing utilities, not tests.

## Known script constraints

`testYouTubeSubmission.js` currently sets `contentType: "VIDEO"` for both YouTube and Instagram cases. The Instagram case conflicts with the implemented `INSTAGRAM`/`REEL` requirement and will need its fixture corrected before it can validate the intended flow. This is a known existing mismatch; the documentation change does not alter it.

`testYouTubeTrackingFlow.js` invokes the general tracking batch with a mocked upstream count. The batch can touch any qualifying submission in that database, not just its own fixtures. Use an empty isolated database. Scripts cleaning business fixtures do not necessarily clean notifications delivered to existing admins.

Integration fixtures can generate many HTTP requests and hit the 300-per-15-minute global limit. Account for existing traffic when interpreting a 429. Scripts minting tokens do not prove browser cookie, SMTP, signup, or refresh behavior.

## Manual acceptance checklist

| Area | Check and expected outcome |
| --- | --- |
| Email signup | Select role, request email, verify once, complete matching password, then sign in |
| Signup protection | Duplicate active signup, wrong/reused/expired token, incorrect origin and missing trusted header fail appropriately |
| Session restoration | Reload a dashboard with a valid refresh cookie; user identity returns without another login |
| Expired session | Revoked/expired refresh session leads to login; concurrent failed requests do not loop |
| Role isolation | Creator cannot create campaigns; Brand cannot access a creator wallet; non-admin cannot moderate |
| Ownership | A second Brand cannot review, verify or credit another Brand's campaign/submission |
| Campaign | Save draft, edit, publish, discover; published campaign cannot be edited; past-deadline discovery excludes it |
| Cover | Upload, preview, replace, clear; missing/unsupported/oversized file is handled |
| Applications | Apply once, accept/reject, enforce slots including parallel acceptance |
| Submissions | Require accepted application, request feedback-backed revision, resubmit, approve |
| Manual reward | Below minimum yields zero; boundary qualifies; cap applies; approval alone changes no wallet balance |
| YouTube reward | Baseline captured; sync after approval uses growth; decrease floors at zero; same/replacement video baseline rules hold |
| Credit | One positive credit updates wallet/ledger/budget; duplicate/insufficient budget does not change financial records |
| Withdrawals | Request reserves funds; pending rejection restores; approval then paid creates one debit without double deduction |
| Moderation | Suspension blocks protected requests and revokes refresh; reports/disputes close with expected metadata |
| Notifications | Only recipient can read, mark one/all, and newer events survive an earlier mark-all cutoff |
| UI | Verify mobile navigation, dark/light theme, loading/empty/error states and unsaved-change prompts |

## Reporting validation results

Record the command, runtime, database isolation, provider mode (mock/live), outcome, and retained fixtures. Treat generated JSON reports as potentially sensitive because they can contain test identities and record IDs. Never publish environment secrets or live payment details as test evidence.
