# Complete Logto Google Sign-in Support

## Problem
The current Logto integration is only partially scaffolded. While the standard Logto client workflow (redirect to Logto, sign in with Google, callback) is set up in `frontend/src/app/api/auth/[logto]/route.ts`, it does not yet integrate with the application's backend. Since the application uses its own JWT-based authentication system (`Flask-JWT-Extended` with `User` table), users who sign in via Logto currently just get a Logto session cookie but no backend API access token, rendering them unable to perform authorized actions.

## Solution
Implement a trusted token exchange pattern between the Next.js App Router (server-side) and the Flask Backend.

1.  **Backend (`flask`)**: Add a new `POST /api/v1/auth/logto/exchange` endpoint.
    *   This endpoint will accept a payload containing the Logto user identity and a shared secret (`LOGTO_EXCHANGE_SECRET`) to verify the request comes from the trusted frontend.
    *   It will upsert a user record (matching by `email` or `oauth_id`) and return a standard `access_token`.
2.  **Frontend (`next.js`)**: Extend the `sign-in-callback` handler in `src/app/api/auth/[logto]/route.ts`.
    *   After successfully validating the Logto callback, fetch the user info.
    *   Call the new backend exchange endpoint.
    *   Set the returned backend `access_token` as a cookie (accessible to client-side JS) so existing `api.ts` interceptors work seamlessly.

## Architecture
- **Data Flow**: `Browser` -> `Next.js API (Callback)` -> `Flask Backend (Exchange)` -> `User Database`.
- **Security**: The Frontend-Backend communication is secured via a shared secret (`LOGTO_EXCHANGE_SECRET`) which acts as an API key for this privileged operation.
