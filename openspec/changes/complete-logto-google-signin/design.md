# Token Exchange Design

## Context
The application uses two authentication domains:
1.  **Logto (Identity Provider)**: Handles social login (Google) and issues an OIDC-like session to the Next.js server.
2.  **Flask Backend (Resource Server)**: Protects data using its own JWTs (`Flask-JWT-Extended`).

We need to bridge these two.

## Protocol
1.  User signs in at Logto.
2.  Logto redirects to `/api/auth/logto/sign-in-callback`.
3.  Next.js uses Logto SDK to verify code and get `LogtoContext`.
4.  Next.js constructs a payload:
    ```json
    {
      "email": "user@example.com",
      "sub": "logto|12345",
      "name": "User Name",
      "avatar": "https://...",
      "secret": "<LOGTO_EXCHANGE_SECRET>"
    }
    ```
5.  Next.js `POST`s to Flask `http://localhost:5001/api/v1/auth/logto/exchange`.
6.  Flask verifies `secret`.
7.  Flask checks DB:
    *   Find by `oauth_id == sub`.
    *   Find by `email == email`.
    *   If found: Update `oauth_id` if missing.
    *   If not found: Create User with random password, `oauth_provider='logto'`, `oauth_id=sub`.
8.  Flask generates `access_token` (JWT).
9.  Flask returns:
    ```json
    { "access_token": "eyJ...", "user": { ... } }
    ```
10. Next.js sets cookies on the *Response* to the Browser:
    *   `logto:...` (Logto Session)
    *   `access_token` (Backend Session - `httpOnly: false` for Axios access)

## Security Considerations
- **LOGTO_EXCHANGE_SECRET**: Must be strong and kept sync'd. If leaked, attackers can forge any user identity.
- **TLS**: In production, backend-frontend communication should be private network or TLS.
