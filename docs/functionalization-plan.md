# Functionalization Workflow

## Goal

Move RentPH from a browser-only demo into a reliable rental marketplace backed by the Go API. Each phase must have real persistence, authorization, error/loading/empty states, tests, and updated documentation before it is considered complete. Demo controls and mock payment success must not be presented as production behavior.

## Phases

### 1. Frontend correctness and responsive access

Use actual catalog types in filters, synchronize filter state, show rent and transaction amounts consistently in PHP, and provide mobile navigation to all primary screens. Verify the search and detail flows at desktop and mobile sizes.

Status: Implemented in this pass. Backend integration remains separate.

### 2. API client and authentication

Add a typed frontend API client using a configurable API base URL. Wire bearer-token registration/login/logout/current-user flows, map backend roles to UI roles, handle 401/422 responses, and keep demo persona switching separate from authenticated sessions. The initial client is implemented; bearer tokens currently use localStorage and require a hardened storage strategy before production. Remaining work includes protected-flow integration tests and server-backed profiles.

Status: Core browser/native auth client implemented. Catalog and domain features still use the local demo store.

### 3. Catalog, profiles, and search

Complete the PostgreSQL schema and seed data for profiles, locations, schools, properties, images, and amenities. The preview now has a real Leaflet/OpenStreetMap map with campus radius, panning, zoom, and property popups, but its records still come from local demo data. Connect public property/school/search pages to paginated API resources, then connect owner CRUD and image uploads. Verify filtering and sorting against database queries rather than local arrays.

### 4. Availability, applications, and dorm inventory

Implement buildings, floors, rooms, beds, availability rules, blocked dates, and application workflow services. Connect student application submission and owner review to server-side validation and authorization. Keep bed reservations transactional and test concurrency and release on rejection/cancellation.

### 5. Booking and payment

Move booking and pricing authority to Go services. Integrate a real payment provider behind the provider interface, verify signed webhooks idempotently, and remove simulated payment success from production UI. Test pricing, conflicts, cancellation, refunds, and duplicate events.

### 6. Messaging, notifications, administration, and reporting

Connect conversations, messages, notifications, audit logs, account administration, settings, and reports to authenticated API endpoints. Queue external delivery and protect all admin operations with explicit policies. Property listings publish directly after owner submission and do not enter an admin approval queue.

### 7. Acceptance and release

Run the owner-to-student rental lifecycle against PostgreSQL using Go tests, plus frontend browser tests at mobile and desktop sizes. Require `go test -mod=mod ./...`, `npm run lint`, and `npm run build` to pass. Document deployment, secrets, backups, and known limitations.

## Completion Gate

A phase is complete only when its user flow calls the owning API or a clearly scoped local adapter, persists data in the intended store, handles success and failure states, has focused automated coverage, and passes the applicable checks. The current frontend still uses browser `localStorage`; phases 2 through 7 are not complete.