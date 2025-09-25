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
   - **Development**: `http://localhost:3000/api/auth/callback`
   - **Production**: `https://your-domain/api/auth/callback`
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

NEXT_PUBLIC_LOGTO_ENDPOINT=$LOGTO_ENDPOINT
NEXT_PUBLIC_LOGTO_APP_ID=$LOGTO_APP_ID
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Note**
> - `LOGTO_BASE_URL` must match the origin you configured in Logto for each environment (e.g. `https://reader.example.com`).
> - `offline_access` gives refresh tokens; remove if you only need short-lived sessions.

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

## 5. Next.js adapter wiring (coming next)

The upcoming commits will:

1. Create `src/app/api/auth/[logto]/route.ts` to expose Logto’s `/signin`, `/callback`, and `/signout` endpoints using `createLogtoAdapter` from `@logto/next`.
2. Wrap the App Router with `LogtoProvider` (client) + `withLogto` (server) so components can call `useLogto()`.
3. Replace the custom credential login form with Logto’s login redirect for social connectors while keeping optional username/password fallback.
4. Augment `AuthContext` so that backend API calls receive a Logto access token (or we exchange it for an internal JWT).

---

## 6. Backend token verification (preview)

The Flask API must trust the tokens issued by Logto instead of locally-minted JWTs. Planned implementation:

1. **Add dependencies**
  ```bash
  pip install python-jose[cryptography] requests-cache
  ```
  Add them to `backend/requirements.txt` in the follow-up PR.

2. **JWKS cache helper** – create `utils/logto.py` with a helper that fetches Logto’s signing keys:
  ```python
  import os
  from functools import lru_cache
  import requests

  LOGTO_ENDPOINT = os.getenv('LOGTO_ENDPOINT')

  @lru_cache(maxsize=1)
  def get_logto_jwks():
     response = requests.get(f"{LOGTO_ENDPOINT}/oidc/jwks", timeout=5)
     response.raise_for_status()
     return response.json()
  ```

3. **Request middleware** – add a decorator/Flask `before_request` hook that:
  - reads `Authorization: Bearer <token>`
  - uses `jose.jwt.decode()` with the cached JWKS to verify signature, audience (`LOGTO_APP_ID`), and issuer (`LOGTO_ENDPOINT`) values
  - extracts the `sub` and `email` claims
  - looks up the corresponding `User` (matching `oauth_provider='logto'` and `oauth_id=sub`), provisioning one if missing
  - populates `flask.g.current_user` so existing route code can reuse it

4. **Tighten legacy authentication** – once Logto is the primary login method, phase out password-based login for accounts originating from social connectors by marking them as read-only or removing their password hashes entirely.

We’ll implement this end-to-end in the next backend-focused task once the frontend can successfully retrieve a Logto access token.

---

## 7. Operational next steps

- [ ] Confirm `npm install` runs cleanly with the new dependencies.
- [ ] Add the Logto configuration file described above and ensure `npm run lint` passes.
- [ ] Build a small `LogtoLoginButton` component to test redirects locally.
- [ ] Implement backend verification once you can obtain a Logto access token from the frontend.
- [ ] Update documentation (README + deployment guides) once the flow is end-to-end.

This file should evolve as we proceed with the integration.
