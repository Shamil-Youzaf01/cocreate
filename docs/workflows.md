# User workflows and business rules

[Documentation index](README.md)

## Role capabilities

| Capability | Creator | Brand | Admin |
| --- | --- | --- | --- |
| Browse published campaigns | Yes | Yes | Yes |
| Create, edit draft, publish own campaign | No | Yes | No |
| Apply and submit content | Own participation | No | No |
| Review applications and submissions | No | Own campaigns | No |
| Verify views and credit rewards | No | Own campaigns | No |
| Sync approved YouTube submission | Own submission | Own campaign | No public sync route |
| Wallet and withdrawal request | Own wallet | No | No |
| Review withdrawals and record payment | No | No | Yes |
| Submit reports | Yes | Yes | API permits it |
| Raise campaign dispute | Participant | Own campaign | No |
| Moderate users/campaigns, resolve reports/disputes | No | No | Yes |
| Notifications | Own notifications | Own notifications | Own notifications |

Frontend route guards help navigation. Backend role and ownership checks determine actual access. Administrators have oversight routes but do not automatically inherit Brand or Creator actions.

## Registration and profile

Visit `/register`, choose Creator or Brand, and request a verification link. Wait at least 60 seconds before requesting another email for the same address. Links expire after 24 hours and can be used once. Complete profile setup within 30 minutes after verification, then sign in.

Creators can maintain name, bio, location, avatar URL, Instagram/YouTube URLs, and up to eight categories. Brands can maintain shared profile fields plus industry and website. Profile updates do not change email, password, account role, or status. Avatar/profile links are URLs; there is no avatar-upload endpoint.

## Brand campaign workflow

1. Open `/dashboard/campaigns/new`.
2. Enter title, description, requirements, supported platform/content format, future deadline, budget, rate per thousand views, minimum payout, maximum payout per creator, and optional creator slot limit.
3. Optionally upload a cover image. Choose JPG, PNG, or WebP up to 5 MB; 1600 x 1000 pixels is the UI recommendation.
4. Save the campaign as a draft. Only drafts can be edited.
5. Publish the draft to make it discoverable before its deadline.
6. Review pending applications, then review submitted content.
7. Verify approved content's views, then explicitly credit an eligible reward.
8. Close the published campaign when recruitment should end.

Accepted platform combinations are `INSTAGRAM`/`REEL`, `YOUTUBE`/`VIDEO`, and `YOUTUBE`/`SHORT`. Broader model enums are reserved/legacy possibilities, not supported creation formats.

Campaign reward constraints are:

```text
0 <= minimumPayout <= maximumPayoutPerCreator <= campaignBudget
campaignBudget >= 1
rewardRatePerThousandViews >= 1
maximumPayoutPerCreator >= 1
creatorSlots = null, or a positive integer
```

The backend applies both request and model validation. Effective model limits are 100 characters for title and 3,000 each for description and requirements; creation also requires at least 3, 10, and 5 characters respectively.

An omitted slot limit allows acceptance without a fixed count limit. Slots count accepted applications; the configured budget is not reserved when applications are accepted. There is no budget funding/deposit action.

Campaign status follows `DRAFT -> PUBLISHED -> CLOSED` through Brand routes. Administrators may close a draft or published campaign. `COMPLETED` exists in the model, but no mounted endpoint marks a campaign completed. Passing a deadline removes a campaign from discovery without automatically changing its status.

## Creator application and submission workflow

1. Browse `/dashboard/campaigns`; filter/search available published campaigns.
2. Open the brief and apply with an optional message, once per campaign.
3. Track the application at `/dashboard/applications`.
4. After acceptance, open `/dashboard/submissions` and submit a content URL with an optional caption.
5. If a revision is requested, read the feedback and resubmit the existing submission.
6. After approval, track view verification, eligibility, and reward status on the submission detail page.
7. Review credited funds under `/dashboard/wallet`.

Applications start as `PENDING` and may become `ACCEPTED` or `REJECTED`. Reviewed applications cannot be reviewed again. Slot limits are enforced during acceptance, including concurrent acceptances.

One creator can have one submission per campaign. A submission starts as `SUBMITTED`; the owning brand can choose `APPROVED`, `REJECTED`, or `REVISION_REQUESTED`. Revision requests require nonblank feedback. Only `REVISION_REQUESTED` content can be resubmitted; resubmission returns it to `SUBMITTED` and clears the previous review.

Application creation enforces publication and deadline. Submission creation currently checks application acceptance but does not independently reject a closed/expired campaign; do not infer that a disabled UI action is an API enforcement rule. Application review likewise does not independently require the campaign to remain published or before deadline.

## Reward calculation

```text
calculatedReward = (verifiedViews / 1000) * rewardRatePerThousandViews

if calculatedReward < minimumPayout:
    finalReward = 0
    rewardStatus = NOT_ELIGIBLE
else:
    finalReward = min(calculatedReward, maximumPayoutPerCreator)
    rewardStatus = READY
```

The minimum is an eligibility threshold, not a guaranteed minimum payment. The implementation uses JavaScript numbers without explicit currency rounding. UI and notifications use INR; records have no currency field.

With rate 200, minimum 800, and maximum 2,500:

| Verified views | Calculated reward | Final reward | Status |
| --- | --- | --- | --- |
| 3,000 | 600 | 0 | `NOT_ELIGIBLE` |
| 4,000 | 800 | 800 | `READY` |
| 6,000 | 1,200 | 1,200 | `READY` |
| 20,000 | 4,000 | 2,500 | `READY` |

Approval sets `PENDING_VERIFICATION`. The brand manually verifies a non-YouTube submission with a nonnegative safe integer view count. Verification cannot run on unapproved or already credited content. YouTube campaigns must use synchronization instead of manual verification.

Crediting requires `APPROVED`, `READY`, a positive valid final reward, and enough remaining campaign budget. The transaction creates the wallet if needed, writes a completed credit transaction, increases available balance and total earned, and marks the reward `CREDITED`. Duplicate credits fail. Further verification/sync is closed after credit. A zero reward cannot be credited even if a zero minimum allows calculation to return `READY`.

## YouTube tracking

Submitting a valid YouTube URL captures its current count as `baselineViews`. At submission time eligible views and reward remain zero. After approval, the creator or owning brand may sync, or the backend scheduler may sync later:

```text
eligibleViews = max(currentViews - baselineViews, 0)
verifiedViews = eligibleViews
```

Only growth since submission contributes to payment. A baseline of 5,000 and current count of 11,000 yields 6,000 eligible views. Counts below the baseline yield zero. The API does not verify that the submitter owns the video/channel.

Resubmitting the same video preserves the baseline. Replacing it with a different video captures a fresh baseline and resets reward calculation fields. An upstream failure marks tracking failed and records an error without discarding the last successful reward calculation. A later sync retries. Sync does not credit the wallet automatically.

## Wallet and withdrawals

Wallet values are `availableBalance`, `totalEarned`, and `totalWithdrawn`. A wallet is created on first wallet access or first credit.

Request a withdrawal at `/dashboard/withdrawals` with an amount of at least 1 and either:

| Method | Required details |
| --- | --- |
| `UPI` | `upiId` |
| `BANK_TRANSFER` | `accountName`, `accountNumber`, `ifsc` |

Submitting a request immediately deducts/reserves its amount from available balance. The administrator may approve or reject a `PENDING` request. Rejection restores reserved funds. Approval moves it to `APPROVED`; only then may it become `PAID` after an external transfer. Marking paid creates a completed debit transaction and increments total withdrawn without deducting available balance again.

There is no payment-provider call, automated transfer, cancel action, or mounted rejection path for an already approved withdrawal.

## Reports, disputes, and moderation

Use reports for a `USER`, `CAMPAIGN`, or `SUBMISSION`. Reasons are `SPAM`, `INAPPROPRIATE_CONTENT`, `FRAUD`, `HARASSMENT`, `MISLEADING`, and `OTHER`. A user cannot report themselves or open another active report on the same target. Admins move open reports to `UNDER_REVIEW`, `RESOLVED`, or `DISMISSED`; closed reports cannot be updated.

Use a dispute for campaign payment, submission, requirements, reward, or another campaign issue. A Creator must have an application for the campaign; a Brand must own it. Optional application/submission references must match the campaign and, for creators, their own records. One active dispute per raiser/campaign is allowed. Admins may move `OPEN` to `UNDER_REVIEW`, or close an `OPEN`/`UNDER_REVIEW` dispute as `RESOLVED` or `REJECTED` with a nonblank resolution.

Resolving a report or dispute records an outcome; it does not automatically move money or reverse rewards. Admin user moderation allows `ACTIVE`, `SUSPENDED`, and `BANNED` for non-admin users. Admin accounts cannot be moderated through that endpoint.

## Notifications and dashboard

Dashboard content varies by role: creators see participation, deliverables, recommendations and earnings; brands see campaign/application/submission queues; admins see user growth, campaign reports, withdrawals and dispute queues. Aggregated dashboards are presentation views, not a replacement for the transaction ledger.

The notification bell and `/dashboard/notifications` show persisted application, submission, campaign, reward, withdrawal, report, and dispute events. The UI refreshes every 60 seconds while visible and on focus/visibility changes. Marking all read uses the list response's `asOf` timestamp, preserving newer events.
