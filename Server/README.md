# CoCreate API

Express 5 API backed by MongoDB/Mongoose and Redis. Source uses Node.js ES modules. Start commands run from this directory.

```powershell
Copy-Item .env.example .env
npm ci
npm run dev
```

Populate your own environment values before starting; preserve an existing `.env`. MongoDB must support multi-document transactions. Redis is required. Normal registration needs SMTP and the sibling `client/public/brand/logo.png` asset. Cloudinary is used for cover uploads, and YouTube credentials for video statistics.

Default port is 5000, routes are mounted under `/api`, and `GET /` returns the API-running response. `npm start` runs without nodemon. `npm run seed` creates an unverified development Creator, not an administrator or ready-to-login account.

- [Complete project documentation](../docs/README.md)
- [Setup and environment reference](../docs/setup.md)
- [Backend implementation](../docs/backend.md)
- [HTTP API](../docs/api.md)
- [Models and indexes](../docs/data-model.md)
- [Integration checks](../docs/testing.md)
- [Deployment and migration](../docs/deployment.md)

No `npm test` or backend lint script is configured. Review integration-script side effects before running them against any database.
