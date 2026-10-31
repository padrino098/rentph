# Authentication

The Go API issues Sanctum-compatible hashed personal access tokens for registration and login. Logout deletes only the token used for the current request. Login rejects invalid credentials and any account whose `account_status` is not `active`. Registration cannot create administrator accounts and triggers an email-verification notification.

Password reset tokens are stored in PostgreSQL and expire after 60 minutes. The forgot-password response is intentionally generic to avoid account enumeration. Verification links are HMAC-signed and compare both the user ID and SHA-1 email hash to the authenticated account. Verification and reset notifications use the configured Go API mailer.

Configure SMTP before using real email delivery. The development default logs notification links. Bearer tokens are credentials; keep them out of logs and client-side URLs, and use HTTPS outside local development.

The React client calls the API for credential registration and login, restores sessions with `/auth/me`, and revokes tokens on logout. Browser builds default to same-origin `/api/v1`, forwarded by Vite in development and Nginx in Compose. `VITE_API_BASE_URL` can override this; `API_PROXY_TARGET` changes only Vite's upstream. The Android emulator uses the native Capacitor HTTP bridge to reach `http://10.0.2.2:8000/api/v1`; native overrides must be absolute HTTP(S) URLs.

Session restoration clears a stored token on HTTP 401, not on a network outage or server failure. Transient failures display an alert and retain the cached session; that cached account has not been revalidated until a later successful lookup. Reload after connectivity returns to retry restoration. A late restoration response cannot replace a newly selected session. Logout always clears local credentials, and an unsuccessful server revocation is reported explicitly.

The current client persists bearer tokens in localStorage for this development phase; use a hardened token storage design before production deployment. Demo persona shortcuts remain local and do not authenticate with the API. Owner API accounts map to the frontend's host role.

Forgot-password, reset-password, and email-verification routes are tested at the API level but have no frontend recovery/verification screens. A reset notification currently points to a frontend path that has no reset form, and a verification request requires the authenticated bearer token as well as the signed URL. Do not treat email delivery or these user-facing workflows as complete.

Run `npm run test:api` for frontend HTTP-contract and native-bridge dispatch checks. See [connection-verification.md](connection-verification.md) for live browser and PostgreSQL verification evidence and limitations.