# Go API

The Go API is in `backend/` and keeps the existing `/api/v1` JSON contract. Success responses use `{ "success": true, "message": "...", "data": ... }`; validation failures return HTTP 422 with an `errors` object, and missing or invalid bearer credentials return HTTP 401.

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | No | Register a student, renter, or owner; returns a bearer token and sends email verification |
| POST | `/api/v1/auth/login` | No | Validate credentials and issue a bearer token |
| POST | `/api/v1/auth/logout` | Bearer token | Revoke the current token |
| GET | `/api/v1/auth/me` | Bearer token | Return the authenticated user's public account fields |
| POST | `/api/v1/auth/forgot-password` | No | Send a reset link without disclosing whether an email exists |
| POST | `/api/v1/auth/reset-password` | No | Reset a password with a valid broker token |
| POST | `/api/v1/auth/email/verification-notification` | Bearer token | Send a verification link to the current user |
| GET | `/api/v1/auth/email/verify/{id}/{hash}` | Bearer token + signed URL | Verify the authenticated user's email |
| GET | `/up` | No | Readiness check, including the PostgreSQL connection |
| GET | `/api/v1/health` | No | API-prefixed readiness check, including PostgreSQL |

Registration requires `name`, `email`, `password`, and `password_confirmation`; `role` is optional and defaults to `student`. Login requires `email` and `password`. Protected routes use the `Authorization: Bearer <id>|<secret>` header.

The Go service stores users and Sanctum-compatible hashed bearer tokens in PostgreSQL. At startup it creates any missing auth tables and adds `role` and `account_status` columns to an existing Laravel users table without dropping account data. Bcrypt password hashes and existing Sanctum tokens are compatible.

Configure `AUTH_SIGNING_KEY` with a unique random secret for signed email verification URLs. `MAILER=log` logs verification/reset links (development default); use `MAILER=smtp` and set `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, and `MAIL_FROM_ADDRESS` for email delivery. Password reset links expire after 60 minutes.

Property, search, booking, application, payment, and other rental lifecycle APIs are not implemented.

The frontend currently calls only registration, login, logout, and current-user lookup. Password recovery and email verification do not have frontend workflows. API-level coverage and the local-only marketplace boundary are documented in [connection-verification.md](connection-verification.md).
