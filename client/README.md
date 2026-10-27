# CoCreate frontend

Next.js App Router application for Creators, Brands and Administrators. Uses React, Tailwind CSS, Zustand, Axios, Recharts and shared UI primitives.

Create `.env.local` in this directory:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Install and run from this directory:

```powershell
npm ci
npm run dev
```

Open `http://localhost:3000`; run the Express API separately. Keep the browser origin consistent with backend `CLIENT_URL`. Authentication requires the backend's email/signup and refresh-cookie flow.

Available scripts are `dev`, `lint`, `build`, and `start`. For production, set the public API URL before `npm run build`, then use `npm start`.

- [Complete project documentation](../docs/README.md)
- [Setup](../docs/setup.md)
- [Frontend routes and conventions](../docs/frontend.md)
- [User workflows](../docs/workflows.md)
- [API contract](../docs/api.md)
- [Testing](../docs/testing.md)
- [Deployment](../docs/deployment.md)
