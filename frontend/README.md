## Reader Digest Frontend

Next.js 15 App Router frontend for the Reader Digest admin and reader experience.

---

## Prerequisites

- Node.js 18+
- npm 9+ (ships with Node 18)
- Running Reader Digest backend API (`http://localhost:5001` by default)

---

## Setup

```bash
cd frontend
npm install
```

Create `.env.local` based on the template below. All Logto values come from the Logto Cloud console; see `../LOGTO_INTEGRATION.md` for the full walk-through.

```bash
NEXT_PUBLIC_API_URL=http://localhost:5001

LOGTO_ENDPOINT=https://your-tenant.logto.app
LOGTO_APP_ID=your-logto-app-id
LOGTO_APP_SECRET=your-logto-app-secret
LOGTO_BASE_URL=http://localhost:3000
LOGTO_SCOPES=openid profile email offline_access
LOGTO_COOKIE_SECRET=replace-with-long-random-string
LOGTO_COOKIE_SECURE=false

LOGTO_BACKEND_SECRET=shared-secret-used-by-backend
LOGTO_BACKEND_API_URL=http://localhost:5001

NEXT_PUBLIC_LOGTO_ENDPOINT=$LOGTO_ENDPOINT
NEXT_PUBLIC_LOGTO_APP_ID=$LOGTO_APP_ID
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> The `LOGTO_BACKEND_SECRET` value **must** match the `LOGTO_EXCHANGE_SECRET` inside `backend/.env`. The Next.js Logto callback route sends it to the Flask API to mint the Reader Digest JWT.

---

## Development

Start the local dev server:

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000). Logto redirects back to `/admin` after login; ensure the backend is running on port `5001` so the login exchange succeeds.

---

## Available Scripts

- `npm run dev` – Start the development server.
- `npm run build` – Create a production build.
- `npm run lint` – Run ESLint over the project.

---

## Authentication Flow Summary

1. User clicks **Sign in with Logto**.
2. The API route `/api/auth/logto/sign-in` kicks off the Logto OIDC flow and stores the desired redirect.
3. After successful authentication, `/api/auth/logto/sign-in-callback` fetches the Logto claims and exchanges them with the backend.
4. The backend (`/api/v1/auth/logto/exchange`) upserts the account and returns a Reader Digest JWT.
5. The frontend stores that JWT in the `access_token` cookie so existing admin screens continue to function.

See `../LOGTO_INTEGRATION.md` for troubleshooting tips and production considerations.
