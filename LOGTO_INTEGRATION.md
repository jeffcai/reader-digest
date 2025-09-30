# Logto Community Cloud Integration (Starter Guide)

This document captures the initial scaffolding required to integrate **Logto** social login (Google, GitHub, etc.) into Reader Digest. Follow these steps in order and commit each configuration change once verified.

---

## 1. Create and configure a Logto application

1. Sign up at [https://cloud.logto.io](https://cloud.logto.io) and create a **Community Cloud** tenant.
2. In the Logto console, create a new **Web** application (App Router / SPA).
3. Collect the following values – you will copy them into your `.env` files shortly:
   - `endpoint` (tenant base URL, e.g. `https://your-tenant.logto.app`)
   - `appId`
   - `appSecret`
4. Configure redirect URIs (per environment):
  - **Development**: `http://localhost:3000/api/auth/logto/sign-in-callback`
  - **Production**: `https://your-domain/api/auth/logto/sign-in-callback`
5. Configure post-logout URIs (optional but recommended):
   - `http://localhost:3000/logout`
   - `https://your-domain/logout`
6. Enable the social connectors you want (Google, GitHub, etc.) under **Connectors → Social**.

---

## 2. Environment variables

Add the new secrets to the appropriate env files for each environment.

```
LOGTO_ENDPOINT=https://your-tenant.logto.app
LOGTO_APP_ID=xxx
LOGTO_APP_SECRET=xxx
LOGTO_BASE_URL=http://localhost:3000
LOGTO_SCOPES=openid profile email offline_access
LOGTO_COOKIE_SECRET=replace-with-long-random-string
LOGTO_COOKIE_SECURE=false

LOGTO_BACKEND_SECRET=choose-a-long-random-string
LOGTO_BACKEND_API_URL=http://localhost:5001
LOGTO_EXCHANGE_SECRET=keep-in-backend-.env-only

NEXT_PUBLIC_LOGTO_ENDPOINT=$LOGTO_ENDPOINT
NEXT_PUBLIC_LOGTO_APP_ID=$LOGTO_APP_ID
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Note**
> - `LOGTO_BASE_URL` must match the origin you configured in Logto for each environment (e.g. `https://reader.example.com`).
> - `offline_access` gives refresh tokens; remove if you only need short-lived sessions.
> - `LOGTO_COOKIE_SECRET` is required so Logto can encrypt its session cookie; pick a 32+ character random string and rotate per environment.
> - Set `LOGTO_COOKIE_SECURE=true` in production so cookies are marked Secure and SameSite=None.
> - `LOGTO_BACKEND_SECRET` is used by the Next.js server route to call the Flask backend securely. Copy the same value into the backend `.env` file as `LOGTO_EXCHANGE_SECRET`.
> - `LOGTO_BACKEND_API_URL` should point at the Flask API base (defaults to `http://localhost:5001`).

Remember to add these keys to 1Password or your secret store; do **not** commit `.env.local`.

---

## 3. Frontend dependencies

Install the Logto SDK for Next.js:

```bash
cd frontend
npm install @logto/next@^2 @logto/core@^3
```

The `@logto/next` package provides server helpers, hooks (`useLogto`) for client components, and middleware utilities. `@logto/core` ships type definitions reused across the project.

---

## 4. Shared configuration helpers

Create `frontend/src/lib/logto/config.ts` (starter template – adjust as we continue the integration):

```ts
import type { LogtoConfig } from '@logto/next';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      LOGTO_ENDPOINT: string;
      LOGTO_APP_ID: string;
      LOGTO_APP_SECRET: string;
      LOGTO_BASE_URL: string;
      LOGTO_SCOPES?: string;
      NEXT_PUBLIC_LOGTO_ENDPOINT: string;
      NEXT_PUBLIC_LOGTO_APP_ID: string;
      NEXT_PUBLIC_SITE_URL: string;
    }
  }
}

export const serverLogtoConfig: LogtoConfig = {
  endpoint: process.env.LOGTO_ENDPOINT,
  appId: process.env.LOGTO_APP_ID,
  appSecret: process.env.LOGTO_APP_SECRET,
  baseUrl: process.env.LOGTO_BASE_URL,
  scopes: process.env.LOGTO_SCOPES?.split(' ') ?? ['openid', 'profile', 'email'],
};

export const clientLogtoConfig = {
  endpoint: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT,
  appId: process.env.NEXT_PUBLIC_LOGTO_APP_ID,
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
};
```

This keeps type safety across server/client boundaries. Future steps will import these configs into layout, middleware, and API routes.

---

## 5. Current implementation summary

- `src/app/api/auth/logto/[...action]/route.ts` now orchestrates the entire OIDC dance – it stores the desired redirect target, calls `handleSignIn`, processes the callback, fetches Logto user claims, exchanges them with the Flask backend, and finally drops the Reader Digest JWT in the `access_token` cookie before redirecting back to `/admin`.
- The Flask backend exposes `POST /api/v1/auth/logto/exchange`, secured via `X-Logto-Exchange-Secret`. It upserts users (`oauth_provider='logto'`) and returns a first-party JWT expected by existing frontend code.
- A missing or disabled Reader Digest account will be provisioned on the fly using the Logto profile (`email`, `preferred_username`, etc.).
- The legacy username/password flow continues to work side-by-side; AuthContext consumes whichever `access_token` cookie is present.

### Remaining enhancements

1. Harden backend token verification by validating Logto ID tokens directly (JWKS / issuer / audience checks) instead of trusting the internal shared secret.
2. Add UI affordances for signing out of both Logto and Reader Digest simultaneously.
3. Expand the runbooks with production deployment guidance, including DNS + HTTPS domains used as `LOGTO_BASE_URL`.

---

## 6. Operational next steps

- [ ] Confirm `npm install` runs cleanly with the new dependencies.
- [ ] Ensure the new Logto configuration file is present and `npm run lint` passes.
- [ ] Verify the Logto sign-in button redirects back to `/admin` with a populated Reader Digest user session.
- [ ] Implement backend verification once you can obtain a Logto access token from the frontend (see enhancements above).
- [ ] Update documentation (README + deployment guides) once the flow is end-to-end.

This file should evolve as we proceed with the integration.

---

## 7. Operational Runbook

Use this checklist whenever you need to validate the Logto → Reader Digest round trip.

### 7.1 Local environment bootstrap

1. Start the Flask API on port `5001` (`cd backend && python app.py` or `./start-dev.sh`).
2. Start the Next.js dev server on port `3000` (`cd frontend && npm run dev`).
3. Confirm both `.env` files include matching secrets:
  - `frontend/.env.local`: `LOGTO_BACKEND_SECRET=...`
  - `backend/.env`: `LOGTO_EXCHANGE_SECRET=...` (same value as above)
4. Ensure the Logto application has `http://localhost:3000/api/auth/logto/sign-in-callback` registered as an allowed redirect URI.

### 7.2 Sign-in flow validation

1. Visit `http://localhost:3000/login` and click **Sign in with Logto**.
2. Authenticate with any enabled Logto connector (e.g., Google).
3. After redirect, verify you land on `/admin` and the browser stores both cookies:
  - Logto session cookie (`logto:<app-id>`, `HttpOnly`)
  - Reader Digest `access_token` cookie (readable by client code)
4. The backend should log a `POST /api/v1/auth/logto/exchange` request; on first login a new `User` record is created with `oauth_provider='logto'`.
5. Browse the admin dashboard to confirm API calls include the `Authorization: Bearer <access_token>` header.

### 7.3 New user provisioning check

1. Clear cookies or use a private window to simulate a fresh account.
2. Repeat the sign-in flow; confirm the backend assigns a unique username based on the Logto profile.
3. Inspect the `users` table (SQLite) to ensure the account has `oauth_id` populated with the Logto subject (`sub`).

### 7.4 Troubleshooting quick-reference

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `/login?error=logto-misconfigured` | `LOGTO_BACKEND_SECRET` missing | Add the secret to `.env.local` and restart Next.js |
| `/login?error=logto-profile` | Logto claims missing `email` or `sub` | Ensure scopes include `openid email profile`; double-check connector configuration |
| `/login?error=logto-exchange` | Backend rejected the exchange | Verify shared secret matches, backend running on correct URL/port |
| Redirect loops to `/login` | Backend JWT not set | Inspect browser cookies and backend response payload |

Keep this runbook close to the ops/deployment documentation and update it after every significant auth change.
