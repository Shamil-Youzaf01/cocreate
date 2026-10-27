# Frontend guide

[Documentation index](README.md)

## Application structure

The frontend is a Next.js App Router application in `client/`. Most interactive dashboard and auth components use the `"use client"` directive. Imports beginning `@/` resolve to `client/src/` through `jsconfig.json`.

| Directory/file | Responsibility |
| --- | --- |
| `src/app/layout.js` | Root metadata, global CSS, theme provider |
| `src/app/page.js` | Public landing page |
| `src/app/(auth)/` | Shared auth layout, register, login, verify, setup |
| `src/app/dashboard/layout.js` | Authentication restoration, navigation, mobile drawer, route guard |
| `src/app/dashboard/_components/creator/` | Creator dashboards and feature views |
| `src/app/dashboard/_components/brand/` | Brand dashboards, campaign form, review views |
| `src/app/dashboard/_components/admin/` | Admin queues and moderation views |
| `src/app/dashboard/_components/shared/` | Campaign covers/budget/reward, submission performance, lists, status/stats |
| `src/components/` | App-wide loading, navigation, dialogs, notifications, logo |
| `src/components/tailgrids/core/` | Reusable UI primitives; includes `.tsx` files |
| `src/services/` | Domain HTTP wrappers using the shared Axios client |
| `src/store/authStore.js` | In-memory identity, access token, loading and session version |
| `src/hooks/` | Notification polling and unsaved-change handling |
| `src/lib/` | Axios refresh/retry and toast utilities |

The project has JavaScript application code and some TypeScript UI files, but no root TypeScript configuration was found. `next.config.mjs` currently contains no custom application options.

## Browser route map

Route groups such as `(auth)` and private component folders such as `_components` do not appear in URLs.

| Route | Purpose / intended role |
| --- | --- |
| `/` | Public landing page |
| `/register` | Select Creator/Brand and request email verification |
| `/verify-email?token=...` | Exchange email token for setup authorization |
| `/complete-profile` | Name/password setup after verification |
| `/login` | Sign in |
| `/dashboard` | Role-specific overview |
| `/dashboard/notifications` | Own notification history |
| `/dashboard/campaigns` | Creator discovery, Brand campaigns, Admin oversight |
| `/dashboard/campaigns/new` | Brand campaign creation |
| `/dashboard/campaigns/[campaignId]` | Campaign detail, subject to backend visibility |
| `/dashboard/campaigns/[campaignId]/edit` | Brand draft editor |
| `/dashboard/campaigns/[campaignId]/applications` | Brand application review |
| `/dashboard/campaigns/[campaignId]/submissions` | Brand submission review |
| `/dashboard/applications` | Creator or Brand application view |
| `/dashboard/submissions` | Creator or Brand submission view |
| `/dashboard/submissions/new` | Creator submission form |
| `/dashboard/submissions/[submissionId]` | Creator submission detail |
| `/dashboard/submissions/campaign/[campaignId]` | Brand campaign submission queue |
| `/dashboard/wallet` | Creator balance and transactions |
| `/dashboard/withdrawals` | Creator requests/history or Admin queue |
| `/dashboard/reports` | Role-specific report views |
| `/dashboard/disputes` | Role-specific dispute views |
| `/dashboard/profile` | Creator/Brand profile |
| `/dashboard/users` | Admin user management |

The UI does not expose every API action to every permitted backend role. For example, the submission detail API supports Admin and owning Brand reads, while the frontend's single-submission route is Creator-only. Consult `DashboardRouteGuard.js` when adding a page.

## Authentication state and HTTP

Use [lib/axios.js](../client/src/lib/axios.js) for authenticated requests. It uses `NEXT_PUBLIC_API_URL`, includes credentials, sets the trusted auth header, and attaches the current Bearer token.

API wrappers return the JSON response body, not the entire Axios response. A caller normally reads `result.data.campaign`, for example. API lists are not all paginated; use the endpoint's documented shape.

`AuthInitializer` restores a dashboard session by refreshing then fetching the user. `DashboardRouteGuard` checks role-specific base routes and special child-route rules. A disallowed dashboard page redirects to `/dashboard`; an unauthenticated user redirects to `/login`. Backend authorization is still required for every protected operation.

On a protected 401 response the interceptor obtains a refreshed token and retries once. Concurrent refreshes share a promise. Auth endpoint failures are excluded from this retry loop. If refresh fails or retry remains unauthorized, the store clears and navigation goes to login with session-expiry feedback. Session versions prevent retries from crossing a login/logout boundary.

Do not bypass these wrappers with a separate token store. Identity and tokens intentionally live only in memory; reload restoration uses the HTTP-only cookie.

## Campaign covers

The Brand `CampaignForm` owns upload state and saving. [CampaignCoverUploader.js](../client/src/app/dashboard/_components/shared/CampaignCoverUploader.js) provides selection/drop, preview, replacement, removal, progress and error display through props:

| Prop | Contract |
| --- | --- |
| `coverImage` | Current `{url, publicId}` object |
| `onUpload(file)` | Parent callback for selected/dropped file |
| `onRemove()` | Parent callback to clear image selection |
| `isUploading`, `disabled` | Disable selection/removal while unavailable |
| `progress` | Percent; 100 shows provider-processing text |
| `error` | Inline alert text |

The service uploads `FormData` using field name `cover`, then returns the provider object for the form to save. Shared `CampaignCover` renders a cover or fallback across campaign views. UI and backend accept JPG/PNG/WebP up to 5 MB. A successful upload can exist before a campaign is saved; removal/replacement only changes the campaign reference and does not destroy Cloudinary assets.

## Theme, layout, and feedback

Global styling uses Tailwind CSS 4, shared CSS tokens and default/dark theme styles. `next-themes` controls theme selection. `ThemeProvider` is installed at the root. The dashboard has a collapsible desktop sidebar and a React Aria mobile drawer.

Use existing components for loading states, empty states, status badges, confirmation dialogs, and toast feedback. Campaign reward and budget components provide a consistent presentation of the backend's calculated fields; avoid computing a separate payment rule in the UI.

Notification hooks fetch on mount, every 60 seconds while visible, and on focus/visibility changes. They abort obsolete requests and scope displayed data to the current user/page. Mark-all passes the server's `asOf` cutoff.

## Extending a feature

1. Add a service function to the matching domain file and use shared Axios.
2. Implement the page in the App Router and reusable view under the appropriate role/shared components.
3. Update both sidebar data and route permissions when adding navigation.
4. Handle loading, empty, permission, network error, and mutation states.
5. Preserve unsaved-change protection for editable forms and prevent repeated submission while a mutation is pending.
6. Validate backend ownership and state transitions independently; client checks only improve usability.
7. Update [API](api.md), [workflows](workflows.md), and this route map as needed.

## Commands

Run inside `client/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npm run lint` | ESLint through `eslint.config.mjs` |
| `npm run build` | Production build |
| `npm start` | Serve an existing production build |

There is no configured frontend unit or browser-test runner. See [testing](testing.md).
