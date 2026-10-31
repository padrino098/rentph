# Backend Architecture

The Go API is isolated in `backend/`; the existing Vite frontend remains at the repository root. API routes are versioned under `/api/v1`, authentication uses Sanctum-compatible bearer tokens, and the common success response is `{ success, message, data }`. Validation and authentication errors use `{ success, message, errors }`.

PostgreSQL is the configured deployment database. The Go API does not require Redis or server-side sessions. Auth data migrations are idempotent and preserve the existing user and token tables. Payment integrations, background jobs, and domain services will be introduced with their respective feature phases.

Current implemented scope: Go HTTP API, user role/status fields, and authentication flows. Property inventory, applications, bookings, payments, tenancy, messaging, admin reporting, and their domain models are not yet implemented.