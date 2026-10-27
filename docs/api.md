# API reference

[Documentation index](README.md)

## Base URL and conventions

Local base URL: `http://localhost:5000/api`. Paths in the tables below include `/api`; do not add it twice. IDs are MongoDB ObjectId strings. Enum values are uppercase and case sensitive. Creation endpoints return 201; other successful endpoints generally return 200. There is no API version prefix or generated OpenAPI specification.

`Any` means any authenticated, active user (`CREATOR`, `BRAND`, `ADMIN`). `Owner` qualifications are enforced by service/controller checks beyond the route's role guard.

Typical success envelope:

```json
{
  "success": true,
  "message": "Optional operation message",
  "data": { "campaign": {} }
}
```

Lists may include `results` and `pagination`. Not every list is paginated. Do not assume one uniform response shape; each table identifies the keys inside `data`.

Typical centralized error:

```json
{
  "success": false,
  "status": "fail",
  "message": "Authentication required"
}
```

Some directly returned errors and rate-limit responses omit `status`. Production responses replace messages for status codes of 500 or above with `Internal server error` when handled by the central middleware.

| HTTP status | Meaning in this API |
| --- | --- |
| 400 | Validation, malformed ID, or invalid operation/state in many older services |
| 401 | Missing/expired access token or invalid refresh session |
| 403 | Wrong role, ownership, inactive account, unverified login, or untrusted auth request |
| 404 | Missing resource; inaccessible campaigns may also be hidden with 404 |
| 409 | Duplicate or conflicting operation, reward/budget/state conflict |
| 410 | Retired registration endpoint |
| 413 | Oversized campaign image |
| 415 | Auth request is not JSON |
| 429 | Global/auth limits or signup email cooldown |
| 500 | Internal error or missing YouTube configuration |
| 502 | Failed/invalid response from YouTube |
| 503 | Email delivery or campaign upload configuration unavailable |

## Authentication and transport

Protected endpoints require:

```http
Authorization: Bearer <accessToken>
```

Non-retired mutating `/api/auth` requests require all of:

```http
Origin: http://localhost:3000
X-CoCreate-Request: 1
Content-Type: application/json
```

`Origin` must exactly equal the origin configured by `CLIENT_URL`. Send JSON `{}` for refresh/logout. Browsers must include credentials so the HTTP-only refresh/signup cookies are sent. Cookie-based signup profile calls do not require a Bearer access token.

CORS allows the configured frontend origin with credentials, and headers `Content-Type`, `Authorization`, and `X-CoCreate-Request`. CORS alone is not the route's authorization mechanism.

All `/api` routes share a default limit of 300 requests per 15 minutes per limiter identity (normally IP). Login adds 10 per 15 minutes. Signup start/verify/profile POSTs share the registration limiter of 20 per hour. These limits are process-local. Signup start also enforces a 60-second email cooldown and returns `Retry-After` plus `data.retryAfter` when blocked.

## Health and identity endpoints

| Method | Path | Access | Body/query | Result |
| --- | --- | --- | --- | --- |
| GET | `/` | Public | None | `success`, message `Cocreate API is running` (outside `/api`) |
| POST | `/api/auth/signup/start` | Public, trusted auth request | `email`, `role: CREATOR or BRAND` | `data.email`, `role`, `retryAfter`; pending cookie |
| POST | `/api/auth/signup/verify` | Email token, trusted auth request | `token`: 64 lowercase hexadecimal characters | `data.email`, `profileRequired`; setup cookie |
| GET | `/api/auth/signup/profile` | Valid setup cookie and Redis authorization | None | `data.email`, `role` |
| POST | `/api/auth/signup/profile` | Setup cookie, trusted auth request | `name`, `password`, `confirmPassword`; `role` for older setup identities without a selected role | 201, success message; clears signup cookies |
| POST | `/api/auth/login` | Public, trusted auth request | `email`, `password` | `data.user`, `accessToken`; refresh cookie |
| GET | `/api/auth/me` | Any | None | `data.user` |
| POST | `/api/auth/refresh` | Refresh cookie, trusted auth request | `{}` | `data.accessToken`; existing refresh/session lifetime retained |
| POST | `/api/auth/logout` | Trusted auth request | `{}`; optional refresh cookie | Revokes refresh session if valid and clears cookie |
| POST | `/api/auth/register` | Retired | Any | 410 with retirement message |
| GET | `/api/auth/verify-email/:token` | Retired | Any | 410 with retirement message |
| POST | `/api/auth/resend-verification` | Retired | Any | 410 with retirement message |
| PATCH | `/api/profile/me` | Any | Allowed profile fields | `data.user` |

Signup names are 2-50 characters and passwords 8-72 characters, matching confirmation. A role selected at signup start controls completion. Public signup never creates an admin. New-account profile completion does not log the user in.

Profile shared fields: `name`, `bio` (max 300), `location` (max 100), `avatarUrl`, `instagramUrl`. Creator-only fields: `youtubeUrl`, `categories` (up to eight strings, 1-50 characters each). Brand-only fields: `industry` (max 100), `website`. URL fields accept a valid URL or an empty string. The controller only applies fields allowed for the current role.

## Campaign endpoints

| Method | Path | Access | Input | Keys inside `data` |
| --- | --- | --- | --- | --- |
| GET | `/api/campaigns/published` | Any | `page`, `limit`, `search`, `platform`, `contentType`, `sort` | `campaigns`; top-level `results`, `pagination` |
| GET | `/api/campaigns/my` | Brand | None | `campaigns`; top-level `results` |
| POST | `/api/campaigns/upload-cover` | Brand | Multipart, single file field `cover` | `coverImage: {url, publicId}` |
| POST | `/api/campaigns` | Brand | Campaign creation payload below | `campaign` (201) |
| GET | `/api/campaigns/:campaignId` | Any, visibility rules | ID | `campaign`, `myApplication`, `mySubmission` |
| PATCH | `/api/campaigns/:campaignId` | Owning Brand, draft | Partial editable campaign fields | `campaign` |
| PATCH | `/api/campaigns/:campaignId/publish` | Owning Brand, draft | No body required | `campaign` |
| PATCH | `/api/campaigns/:campaignId/close` | Owning Brand, published | No body required | `campaign` |

Creation example (choose a future deadline when executing):

```json
{
  "title": "Original creator reel",
  "description": "Create an original product demonstration for our campaign.",
  "requirements": "Publish an original vertical reel with the required disclosure.",
  "platform": "INSTAGRAM",
  "contentType": "REEL",
  "campaignBudget": 10000,
  "rewardRatePerThousandViews": 200,
  "minimumPayout": 800,
  "maximumPayoutPerCreator": 2500,
  "creatorSlots": 10,
  "deadline": "2099-12-15T23:59:59.000Z"
}
```

`coverImage` is optional and takes `{ "url": "https://...", "publicId": "..." }`. To clear the saved image, PATCH `{ "coverImage": { "url": "", "publicId": "" } }`. Omitting the image preserves it. Uploading does not itself attach the image to a campaign: save the returned object in create/edit. Uploads accept JPEG, PNG, and WebP, maximum 5 MB, and are transformed to 1600 x 1000 with automatic crop/quality in `cocreate/campaigns`.

Use numeric JSON values for reward fields. Effective constraints: budget/rate/maximum at least 1, minimum nonnegative, minimum <= maximum <= budget, optional slots null or positive integer. Creation supports Instagram Reel or YouTube Video/Short only. Title is effectively 3-100 characters; description 10-3,000; requirements 5-3,000, due to combined Zod and model validation. Deadline must be future. Editing uses an allowlist and model validation; it does not share every create-time string minimum.

Published discovery excludes expired campaigns. General pagination defaults to page 1, limit 10, capped at 100. Search matches title/description case-insensitively. `sort` supports comma-separated fields and a `-` prefix for descending; the current allowlist is `createdAt`, `deadline`, and legacy `reward`. Sorting by legacy reward is not meaningful for new performance-reward campaigns.

Campaign details are visible to admins, the owning brand, and authenticated users for a published campaign. A creator may also see a closed/completed campaign if they have an accepted application or a submission. Other inaccessible campaigns return 404. Creator details include their application/submission status. Owning-brand details additionally include `campaign.rewardOverview`.

Campaign read services add `rewardsIssued`, `remainingBudget`, and `budgetUsagePercent` from completed reward credits. Creation/edit responses are raw campaign documents and need not include those computed values.

## Application endpoints

| Method | Path | Access | Input | Keys inside `data` |
| --- | --- | --- | --- | --- |
| POST | `/api/applications/campaigns/:campaignId/apply` | Creator | Optional `message`, max 1,000 | `application` (201) |
| GET | `/api/applications/my` | Creator | None | `applications` |
| GET | `/api/applications/brand/my` | Brand | None | `summary`, `applications` |
| GET | `/api/applications/campaigns/:campaignId` | Owning Brand | ID | `applications` |
| PATCH | `/api/applications/:applicationId/review` | Owning Brand | `decision: ACCEPTED or REJECTED` | `application` |

Applying requires a published campaign before its deadline and no previous application by that creator. Review requires a pending application. Acceptances enforce optional creator slots transactionally. These lists are not paginated.

## Submission and reward endpoints

| Method | Path | Access | Input | Keys inside `data` |
| --- | --- | --- | --- | --- |
| POST | `/api/submissions/campaigns/:campaignId` | Creator with accepted application | `contentUrl`, optional `caption` (max 2,000) | `submission` (201) |
| GET | `/api/submissions/campaigns/:campaignId` | Owning Brand | ID | `submissions`, including ledger-derived `creditedReward` |
| GET | `/api/submissions/my` | Creator | None | `summary`, `readyToSubmit`, `underReview`, `needsRevision`, `approved`, `rejected` |
| GET | `/api/submissions/brand/my` | Brand | None | `summary`, `submissions` |
| GET | `/api/submissions/:submissionId` | Owning Creator, owning Brand, or Admin | ID | `submission`, including `creditedReward` |
| PATCH | `/api/submissions/:submissionId/review` | Owning Brand | `decision: APPROVED, REJECTED, or REVISION_REQUESTED`; optional `feedback` | `submission` |
| PATCH | `/api/submissions/:submissionId/resubmit` | Owning Creator, revision requested | `contentUrl`, optional `caption` | `submission` |
| PATCH | `/api/submissions/:submissionId/verify-views` | Owning Brand, non-YouTube | `verifiedViews`: nonnegative safe integer | `submission` |
| POST | `/api/submissions/:submissionId/sync-views` | Owning Creator or Brand | No body required | `submission` |
| POST | `/api/submissions/:submissionId/credit-reward` | Owning Brand | No body required | `submission`, `reward`, `wallet`, `campaignBudget`, `rewardsIssued`, `remainingBudget`, `budgetUsagePercent` |
| POST | `/api/youtube/test-video` | Any | `url`: supported YouTube URL | `videoId`, `title`, `channelId`, `channelTitle`, `viewCount` |

`REVISION_REQUESTED` requires feedback. Approval resets reward status to `PENDING_VERIFICATION`; it does not credit money. Manual view verification and YouTube synchronization require approved, uncredited content. The minimum payout is an eligibility threshold; the maximum caps final reward. Crediting requires `READY`, a positive final reward, and sufficient remaining budget. Duplicate credit attempts return 409.

YouTube submissions capture baseline views at creation. Sync verifies growth from that baseline; a replacement video on resubmission gets a new baseline. `/youtube/test-video` only fetches statistics; it neither creates a submission nor changes rewards.

The creator's `readyToSubmit` entries are derived from accepted applications without a submission, not stored Submission records. The creator summary includes counts for ready to submit, under review, needs revision, and approved; rejected entries are returned separately. List shapes and populated reference fields differ from the detailed submission response.

## Wallet and withdrawal endpoints

| Method | Path | Access | Input | Keys inside `data` |
| --- | --- | --- | --- | --- |
| GET | `/api/wallet/me` | Creator | None | `wallet`; creates one if missing |
| GET | `/api/wallet/transactions` | Creator | None | `transactions` |
| POST | `/api/withdrawals` | Creator | `amount`, `paymentDetails` | `withdrawal` (201) |
| GET | `/api/withdrawals/my` | Creator | None | `withdrawals` |
| GET | `/api/withdrawals/admin` | Admin | Optional `status` | `withdrawals` |
| PATCH | `/api/withdrawals/:withdrawalId/approve` | Admin | Optional `adminNote` | `withdrawal` |
| PATCH | `/api/withdrawals/:withdrawalId/reject` | Admin | Optional `adminNote` | `withdrawal` |
| PATCH | `/api/withdrawals/:withdrawalId/paid` | Admin | Optional `adminNote` | `withdrawal` |

UPI example:

```json
{"amount":1000,"paymentDetails":{"method":"UPI","upiId":"creator@example"}}
```

Bank example:

```json
{
  "amount": 1000,
  "paymentDetails": {
    "method": "BANK_TRANSFER",
    "accountName": "Example Creator",
    "accountNumber": "000000000000",
    "ifsc": "EXAMPLE0001"
  }
}
```

These are placeholders, not verified payment details. Amount must be finite, at least 1 under model validation, and within available balance. Requesting reserves the funds immediately. Only pending withdrawals can be approved/rejected, and only approved withdrawals can be marked paid. Status filter values: `PENDING`, `APPROVED`, `REJECTED`, `PAID`. Payment occurs externally; these endpoints record state and accounting.

## Report and dispute endpoints

| Method | Path | Access | Input | Keys inside `data` |
| --- | --- | --- | --- | --- |
| POST | `/api/reports` | Any | `targetType`, `targetId`, `reason`, `description` | `report` (201) |
| GET | `/api/reports/my` | Any | None | `reports` |
| GET | `/api/reports/admin` | Admin | Optional `status`, `targetType` | `reports` |
| PATCH | `/api/reports/:reportId/status` | Admin | `status`, optional `adminNote` | `report` |
| POST | `/api/disputes` | Creator or Brand | `campaignId`, `category`, `subject`, `description`; optional `applicationId`, `submissionId` | `dispute` (201) |
| GET | `/api/disputes/my` | Creator or Brand | None | `disputes` |
| GET | `/api/disputes/admin` | Admin | Optional `status` | `disputes` |
| PATCH | `/api/disputes/:disputeId/review` | Admin | No body required | `dispute` |
| PATCH | `/api/disputes/:disputeId/resolve` | Admin | `decision: RESOLVED or REJECTED`, nonblank `resolution` | `dispute` |

Report targets: `USER`, `CAMPAIGN`, `SUBMISSION`. Reasons: `SPAM`, `INAPPROPRIATE_CONTENT`, `FRAUD`, `HARASSMENT`, `MISLEADING`, `OTHER`. Description max 2,000; admin note max 2,000. Status filter includes `OPEN`, `UNDER_REVIEW`, `RESOLVED`, `DISMISSED`; status updates exclude `OPEN`. Closed reports cannot change again.

Dispute categories: `PAYMENT`, `SUBMISSION`, `CAMPAIGN_REQUIREMENTS`, `REWARD`, `OTHER`. Subject max 150, description and resolution max 3,000. Statuses: `OPEN`, `UNDER_REVIEW`, `RESOLVED`, `REJECTED`. Raising a dispute requires campaign ownership or a creator application. Review requires `OPEN`; resolution accepts `OPEN` or `UNDER_REVIEW`. See [workflows](workflows.md) for reference ownership and active-duplicate rules.

## Admin, dashboard, and notifications

| Method | Path | Access | Input | Keys inside `data` |
| --- | --- | --- | --- | --- |
| GET | `/api/admin/users` | Admin | `role`, `status`, `search`, `page`, `limit`, `sort` | `users`; top-level `results`, `pagination` |
| GET | `/api/admin/campaigns` | Admin | `status`, `search`, `page`, `limit` | `campaigns`, `pagination` |
| PATCH | `/api/admin/users/:userId/status` | Admin | `status: ACTIVE, SUSPENDED, or BANNED` | `user` |
| PATCH | `/api/admin/campaigns/:campaignId/moderate` | Admin | `action: CLOSE` | `campaign` |
| GET | `/api/dashboard` | Any | None | `dashboard`, shape depends on role |
| GET | `/api/notifications` | Any | `page` default 1, `limit` default 20 | `notifications`, `unreadCount`, `pagination`, `asOf` |
| PATCH | `/api/notifications/:notificationId/read` | Recipient | No body required | No `data` required; `success: true` |
| PATCH | `/api/notifications/read-all` | Any | `before`: list response's ISO `asOf` | No `data` required; `success: true` |

Admin users list excludes admins and permits role filters `CREATOR`/`BRAND`; search covers name/email and sort allows `createdAt`, `name`, `email`. Admins cannot moderate themselves or other admin accounts. Suspension/banning revokes refresh sessions. Admin campaign list status values are `DRAFT`, `PUBLISHED`, `CLOSED`, `COMPLETED`; search covers title, default limit is 20, and ordering is newest first.

Notifications enforce page 1-10,000 and limit 1-50. Pagination includes `page`, `limit`, `total`, `hasNextPage`. `before` must be valid and no later than server time. Notification read operations are recipient-scoped. Mark-all only changes unread records created at or before the supplied cutoff.

General query-helper pagination contains:

```json
{
  "page": 1,
  "limit": 10,
  "total": 23,
  "totalPages": 3,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

Dashboard payloads contain role-specific statistics, lists and chart series. Some fields retain legacy reward references; use wallet/transaction and campaign budget endpoints for financial accounting. See [backend](backend.md) and [maintenance](maintenance.md).

## PowerShell request examples

Sign in and retain the cookie in a web session:

```powershell
$apiBase = 'http://localhost:5000/api'
$authHeaders = @{
    Origin = 'http://localhost:3000'
    'X-CoCreate-Request' = '1'
}
$loginBody = @{
    email = 'brand@example.com'
    password = '<your-password>'
} | ConvertTo-Json
$loginResult = Invoke-RestMethod -Method Post -Uri "$apiBase/auth/login" -Headers $authHeaders -ContentType 'application/json' -Body $loginBody -SessionVariable coCreateSession
$bearerHeaders = @{ Authorization = "Bearer $($loginResult.data.accessToken)" }
Invoke-RestMethod -Uri "$apiBase/campaigns/my" -Headers $bearerHeaders
```

Refresh in the same PowerShell session:

```powershell
$refreshResult = Invoke-RestMethod -Method Post -Uri "$apiBase/auth/refresh" -Headers $authHeaders -ContentType 'application/json' -Body '{}' -WebSession $coCreateSession
$bearerHeaders.Authorization = "Bearer $($refreshResult.data.accessToken)"
```

Use these examples with your own development accounts. The headers are required even for a non-browser client calling the auth mutation endpoints.
