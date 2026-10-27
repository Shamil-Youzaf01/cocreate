# CoCreate

CoCreate is a campaign collaboration platform where brands recruit creators, review submitted content, and credit rewards based on verified views. Creators discover campaigns, apply, submit content, track earnings, and request withdrawals. Administrators manage users, moderate campaigns, and handle reports, disputes, and payout requests.

This documentation describes the working files reviewed on **27 October 2026**. It is based on the implementation in this checkout. The previously tracked `COCREATE_SRS_v1.0.pdf` is absent from the working directory, so these documents do not claim conformance to that specification.

## Documentation

Start with the [documentation index](docs/README.md), or open a guide directly:

| Guide | Contents |
| --- | --- |
| [Setup and configuration](docs/setup.md) | Requirements, environment variables, installation, local startup |
| [Architecture](docs/architecture.md) | Components, request flow, authentication, integrations |
| [User workflows](docs/workflows.md) | Creator, brand, and admin instructions; rewards and state transitions |
| [API reference](docs/api.md) | Every mounted endpoint, permissions, payloads, responses, examples |
| [Data model](docs/data-model.md) | MongoDB entities, relationships, fields, indexes, Redis records |
| [Frontend](docs/frontend.md) | Pages, components, state, styling, service conventions |
| [Backend](docs/backend.md) | Modules, validation, transactions, background jobs, errors |
| [Testing](docs/testing.md) | Available checks, integration scripts, prerequisites, known script issues |
| [Deployment and operations](docs/deployment.md) | Builds, hosting requirements, monitoring, backups, migration |
| [Maintenance and limitations](docs/maintenance.md) | Contribution workflow, known gaps, documentation upkeep |

## Technology

| Layer | Implementation |
| --- | --- |
| Web application | Next.js 16.3.8 App Router, React 19.2.8 |
| UI | Tailwind CSS 4, Base UI, React Aria, Lucide icons, Recharts, next-themes |
| Client state and HTTP | Zustand 5, Axios |
| API | Express 5, Node.js ES modules |
| Persistence | MongoDB through Mongoose 9; Redis for sessions and signup state |
| Identity | bcrypt password hashing, JWT access tokens, HTTP-only refresh cookies |
| Integrations | SMTP through Nodemailer, Cloudinary covers, YouTube Data API statistics |

Versions above are declared in the package manifests; lockfiles record resolved installations. There is no root package or workspace runner.

## Quick start

Use Node.js **20.19.0 or later** to satisfy the currently installed backend dependencies. You also need a transaction-capable MongoDB deployment and Redis. SMTP credentials are needed to register through the UI. See [setup](docs/setup.md) for configuration and optional integrations.

In PowerShell, from the project root:

```powershell
Copy-Item Server/.env.example Server/.env
```

Edit `Server/.env` with your own database, Redis, JWT, and email settings. Preserve an existing environment file instead of overwriting it. Create `client/.env.local` with:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the API in one terminal:

```powershell
Set-Location Server
npm ci
npm run dev
```

Start the frontend from the project root in another terminal:

```powershell
Set-Location client
npm ci
npm run dev
```

Open `http://localhost:3000`. The API responds at `http://localhost:5000/`; API routes are under `/api`. Use the same hostname consistently for browser and API configuration.

## Repository layout

```text
CoCreate/
|-- README.md
|-- docs/                      Project documentation
|-- client/
|   |-- public/brand/          Logo and icon assets
|   |-- src/app/               Landing, authentication, dashboard pages
|   |-- src/components/        Shared UI and authentication guards
|   |-- src/services/          API wrappers
|   |-- src/lib/               Axios and toast utilities
|   |-- src/hooks/             Notifications and unsaved changes
|   `-- src/store/             In-memory authentication state
`-- Server/
    |-- .env.example           Server configuration template
    |-- scripts/               Seed, migration, integration checks
    `-- src/
        |-- app.js             Express middleware and route mounts
        |-- server.js          Startup, dependencies, shutdown
        |-- config/            MongoDB, Redis, SMTP, cookies, Cloudinary
        |-- routes/            HTTP endpoints and role guards
        |-- controllers/       Request and response handling
        |-- services/          Business rules and persistence operations
        |-- models/            Mongoose schemas
        |-- middlewares/       Authentication, authorization, uploads, errors
        |-- validations/       Zod request schemas
        |-- jobs/              YouTube tracking scheduler
        `-- utils/             Tokens, rewards, budgets, query helpers
```

## Current scope

Campaign creation supports Instagram Reels and YouTube Videos/Shorts. YouTube view growth is tracked automatically; Instagram views are verified manually by the owning brand. Approval, view verification, and reward credit are separate actions. Withdrawal processing records an administrator's payout decision; no bank or payment gateway transfer is implemented.

The repository contains integration scripts, but no `npm test` script, CI workflow, deployment manifest, or standalone license file was found. See [testing](docs/testing.md) and [limitations](docs/maintenance.md) before relying on these areas.
