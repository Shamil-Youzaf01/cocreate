# Documentation index

These guides describe CoCreate's current implementation as reviewed on 27 October 2026. Source code remains authoritative if behavior changes. Links refer to the working directory; some files may not yet be committed in this checkout.

## Reading paths

| Audience | Suggested order |
| --- | --- |
| New developer | [Setup](setup.md), [architecture](architecture.md), [frontend](frontend.md), [backend](backend.md) |
| API consumer | [Authentication and endpoints](api.md), [workflows](workflows.md), [data model](data-model.md) |
| Creator, brand, administrator | [User workflows](workflows.md) |
| Tester | [Testing](testing.md), [API](api.md), [limitations](maintenance.md) |
| Operator | [Configuration](setup.md), [deployment](deployment.md), [maintenance](maintenance.md) |

## Guide inventory

1. [Setup and configuration](setup.md): dependencies, environment variable reference, local startup, first accounts, troubleshooting.
2. [Architecture](architecture.md): boundaries, data flow, sessions, external integrations, implementation constraints.
3. [User workflows](workflows.md): onboarding, role capabilities, campaigns, applications, submissions, earnings, withdrawals, moderation.
4. [API reference](api.md): HTTP conventions, authentication, complete route inventory, request bodies, response keys, examples.
5. [Data model](data-model.md): all ten MongoDB models, references, enums, indexes, computed fields, Redis key lifecycle.
6. [Frontend](frontend.md): routes, role components, HTTP and auth state, theme, notifications, campaign covers.
7. [Backend](backend.md): startup, middleware, services, validation, transactions, jobs, error behavior.
8. [Testing](testing.md): existing commands and script behavior, manual acceptance checks, validation boundaries.
9. [Deployment and operations](deployment.md): production configuration, process lifecycle, dependencies, observability, backups, migration.
10. [Maintenance and limitations](maintenance.md): coding conventions, contribution checks, current gaps and inconsistencies.

## Terminology

| Term | Meaning |
| --- | --- |
| Campaign | Brand-owned brief with a deadline, budget, content format, and reward rules |
| Application | Creator's request to participate in one campaign |
| Submission | The content URL submitted after application acceptance |
| Verified views | Views accepted for reward calculation, manually or from YouTube growth |
| Calculated reward | Uncapped result of views divided by 1,000, multiplied by the campaign rate |
| Final reward | Eligible reward after applying the per-creator cap |
| Credited reward | Money recorded in completed reward transactions for a submission |
| Remaining budget | Campaign budget minus completed campaign reward credits |
| Withdrawal | Request to move available creator balance to a UPI or bank account |
| Report | Moderation complaint about a user, campaign, or submission |
| Dispute | Campaign-related issue raised by a participant or owning brand |

Examples use placeholder identities and credentials. No private environment values are included.
