# Setup and configuration

[Documentation index](README.md)

## Prerequisites

| Dependency | Requirement |
| --- | --- |
| Node.js | At least 20.19.0, based on the installed Mongoose engine requirement; Next.js requires at least 20.9.0 |
| npm | Use a version compatible with your Node installation and committed lockfiles; this checkout was inspected with npm 10.8.2 |
| MongoDB | Replica set or sharded deployment supporting multi-document transactions; a standalone local instance is insufficient for core workflows |
| Redis | Required for login sessions and signup; use a deployment supporting `GETDEL`, `SET EX NX`, and `SCAN` |
| SMTP | Required for email verification and normal self-service account creation |
| Cloudinary | Required when uploading campaign covers; covers can be omitted |
| YouTube Data API credentials | Required for YouTube submissions and view synchronization |

Install and manage MongoDB and Redis separately. This repository does not include containers or infrastructure provisioning. A managed MongoDB replica set or an independently configured development replica set can be used. Keep development data separate from production.

## Install dependencies

Run installation separately in each application directory:

```powershell
Set-Location Server
npm ci
```

From the root in another terminal:

```powershell
Set-Location client
npm ci
```

`npm ci` uses the existing package lock and will report a mismatch if a manifest and lockfile disagree. Review dependency changes before regenerating a lockfile. There is no root-level `npm install` or `npm run dev` command.

## Server environment

Copy [Server/.env.example](../Server/.env.example) to `Server/.env` if the latter does not already exist. Start the server from `Server/` so dotenv loads the intended file.

| Variable | Example/template value | Purpose and requirement |
| --- | --- | --- |
| `PORT` | `5000` | Listening port; code falls back to 5000 |
| `NODE_ENV` | `development` | Use `production` for secure cookies and generic server error responses |
| `CLIENT_URL` | `http://localhost:3000` | Required at startup; exact trusted browser origin, including scheme and port, without a path or trailing slash |
| `MONGODB_URI` | `mongodb://localhost:27017/cocreate?replicaSet=rs0` | Required; example assumes an already configured replica set |
| `REDIS_URL` | `redis://localhost:6379` | Required; use the provider's authenticated/TLS URI where applicable |
| `JWT_ACCESS_SECRET` | Your own random secret | Required; signs access and signup setup tokens |
| `JWT_REFRESH_SECRET` | A different random secret | Required; signs refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access-token lifetime; read directly by JWT signing |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh-token lifetime |
| `SESSION_TTL_SECONDS` | `604800` | Redis session lifetime in seconds |
| `REFRESH_COOKIE_MAX_AGE_MS` | `604800000` | Browser refresh cookie lifetime in milliseconds |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP hostname; configure for your provider |
| `SMTP_PORT` | `465` | Numeric port; code enables implicit TLS only when this equals 465 |
| `SMTP_USER` | Your SMTP user | Email transport authentication |
| `SMTP_PASS` | Your SMTP credential | Email transport authentication |
| `EMAIL_FROM` | `CoCreate <sender@example.com>` | Sender accepted by the configured SMTP provider |
| `CLOUDINARY_CLOUD_NAME` | Your cloud name | Needed for cover uploads |
| `CLOUDINARY_API_KEY` | Your key | Server-only upload credential |
| `CLOUDINARY_API_SECRET` | Your secret | Server-only upload credential |
| `YOUTUBE_API_KEY` | Your API key | Needed for YouTube statistics; absence also skips scheduled tracking |

Only the five variables listed in `src/config/env.js` are checked for presence at startup: MongoDB URI, Redis URL, both JWT secrets, and client URL. Token lifetimes, session TTL, SMTP, and provider settings still need valid values for the corresponding features. Values in `.env.example` are configuration suggestions, not automatic runtime defaults.

Generate each JWT secret separately, then paste the outputs into your private environment file:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Keep refresh token, Redis session, and cookie lifetimes aligned. Refreshing issues a new access token; it does not extend the Redis session or rotate the refresh token.

## Frontend environment

Create `client/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Include `/api`: service wrappers append paths such as `/auth/login` and `/campaigns`. This variable is public browser configuration and must contain no secrets. Restart the development server after changing it; production builds need the final value before `npm run build`.

## Start locally

With MongoDB and Redis reachable, run in `Server/`:

```powershell
npm run dev
```

Expected startup messages indicate MongoDB connected, Redis connected, and the listening port. Run in `client/`:

```powershell
npm run dev
```

Open `http://localhost:3000`. Check API reachability from PowerShell:

```powershell
Invoke-RestMethod http://localhost:5000/
```

Expected JSON:

```json
{"success":true,"message":"Cocreate API is running"}
```

The root route checks HTTP reachability; it is not a live MongoDB/Redis health probe. Use `localhost` consistently; switching the browser to `127.0.0.1` without updating trusted origins can break authentication.

## First accounts

1. Open `/register`, choose Creator or Brand, and enter an email address.
2. Open the verification email's link within 24 hours.
3. Complete name and password setup within 30 minutes. Passwords must be 8-72 characters and match their confirmation.
4. Sign in through `/login`. Repeat with the other role to exercise a campaign end to end.

Public signup cannot create administrators. There is no admin bootstrap command. A database operator must provision an approved admin account through a controlled process, using a bcrypt hash with cost 12, `role: "ADMIN"`, `status: "ACTIVE"`, and `emailVerified: true`. Do not expose admin creation through public signup.

`npm run seed` creates only one unverified development Creator with a random, undisclosed password. It is not a ready-to-login account or an admin seed. Complete that account through the email signup flow if needed.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Startup reports missing environment variables | Run from `Server/`; populate all required values in `.env` |
| MongoDB connects but acceptance/review/credit fails | Confirm the database supports transactions and the URI targets the replica set |
| Redis connection failure | URI, credentials, TLS requirements, service availability, network access |
| Signup returns 503 | SMTP credentials, sender, connectivity, and `client/public/brand/logo.png` attachment availability |
| Login or refresh returns trusted-application 403 | Exact `CLIENT_URL`, browser origin, and `X-CoCreate-Request: 1` |
| Authentication returns 415 | Send `Content-Type: application/json` and a JSON body, including `{}` for refresh/logout |
| API requests reach Next.js or return unexpected 404 | Ensure `NEXT_PUBLIC_API_URL` includes the backend origin and `/api` |
| Cover upload fails | Cloudinary settings, one `cover` field, supported image format, 5 MB size cap |
| YouTube submission fails | Valid public video URL, API key configuration, provider availability/quota |
| Login works but reload loses session | Browser cookie policy, correct hostnames, Redis TTL, HTTPS in production |
| `npm ci` fails | Compare package manifest and lockfile; inspect the peer-dependency conflict before changing install flags |

For production topology and proxy concerns, see [deployment](deployment.md).
