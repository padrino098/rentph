# Frontend and Go Connection Verification

## Outcome

Credential authentication is connected through React, the HTTP client, the Go API, and PostgreSQL. The Laravel backend only implemented authentication; replacing that backend did not create marketplace endpoints. Most marketplace interactions remain seeded, browser-local demonstrations.

Verification used disposable loopback-only Go, Vite, and PostgreSQL services with synthetic accounts. No production database or actual email provider was used.

## Connection Matrix

| Workflow | Persistence / connection | Verification |
| --- | --- | --- |
| Register student/renter/owner | Frontend -> Go -> PostgreSQL | Live owner registration returned 201; owner mapped to host and landlord navigation appeared. API tests cover validation and reject public admin registration. |
| Login | Frontend -> Go -> PostgreSQL | Wrong-password error displayed; valid desktop and 390px mobile login returned 200. |
| Restore current account | Frontend `/auth/me` -> Go -> PostgreSQL | Reload restored the correct account; outage displayed an alert without deleting its token; reconnection and reload restored it again. |
| Stale restoration | Frontend session state | Held an existing `/auth/me` response, selected a demo student, then released it. The late response did not replace the demo session or restore the cleared token. |
| Logout | Frontend -> Go token deletion, then local clear | Desktop/mobile logout returned 200; the revoked token returned 401 on lookup; successful mobile logout left no auth alert. Client tests also cover failed revocation with local token removal. |
| Password recovery/reset | Go -> PostgreSQL; notification log mailer | API tests cover known/unknown email responses, password replacement, old-password rejection, expiry, and consumed-token rejection. No frontend reset form exists. |
| Email verification | Go -> PostgreSQL; notification log mailer | API tests cover notification, signed verification, tampering rejection, and persisted verification. No frontend verification flow exists. |
| Search, filters, listing details | Seeded browser store | Manila search returned five listings; detail/back preserved the location filter. Search remained available at 390px. No API requests occurred during search. |
| Saved listings and comparison | Browser localStorage | Card actions independently toggled without opening details; detail navigation showed the chosen listing. No API requests occurred. |
| Rental application submission | Browser localStorage | Submission added exactly one application and displayed its code in the applications view. No API requests occurred; the synthetic addition was restored away after the check. |
| Booking, simulated payment, messages, host/admin actions | Browser localStorage | Source workflow traced to the local store, not Go. These were not fully exercised end-to-end and do not perform real payments or cross-device synchronization. |
| Native auth HTTP | Capacitor bridge -> absolute API URL | Automated bridge-dispatch contract passed; no installed Android app/device network test was performed. |
| Production web connection | Nginx -> Go -> PostgreSQL in Compose | Configuration inspected and YAML validated; Docker/Nginx runtime not exercised. |

## Connection Fixes

- Browser default is same-origin `/api/v1`, with a Vite development proxy. This avoids relying on a separately configured cross-origin localhost endpoint. The proxy reads `API_PROXY_TARGET` from Vite environment files and respects shell overrides.
- Native builds retain the emulator host default and reject relative API overrides.
- API failures retain HTTP status; outages, invalid JSON, invalid envelopes, and malformed account/token data are reported explicitly.
- Login/register validate returned data before persisting a token.
- Session restoration distinguishes HTTP 401 from temporary connectivity/server failures and ignores cancelled or obsolete responses.
- Logout clears local credentials even if server revocation fails, while displaying the failure instead of creating an unhandled promise rejection.
- Auth forms have dialog semantics, associated input labels, an accessible close action, and explicit error alerts.

## Validation Results

| Check | Result |
| --- | --- |
| Frontend API, native dispatch, and Vite proxy tests | 10 passed, none failed or skipped |
| TypeScript (`npm run lint`) | Passed |
| Production frontend build | Passed |
| Go unit and real PostgreSQL integration tests | 12 top-level tests passed, including both database tests |
| Go vet, module checksum verification, and build | Passed |
| CodeRabbit official schema and disabled automatic-review settings | Passed locally |
| Compose/Nginx configuration | Static validation passed; runtime not tested |
| Temporary services and downloaded test tools | Stopped and removed after verification |

## Repeatable Checks

From the repository root:

```powershell
npm run test:api
npm run lint
npm run build
```

The frontend suite contains ten tests for URL defaults, request/response contracts, error status, invalid authentication data, offline handling, logout, native dispatch, and actual Vite configuration loading from environment files and shell overrides.

From the backend directory, using a disposable PostgreSQL database:

```powershell
$env:TEST_DATABASE_URL = "postgres://test_user:test_password@127.0.0.1:5432/test_database?sslmode=disable"
go test -mod=mod -count=1 ./...
go vet -mod=mod ./...
go mod verify
go build -mod=mod .
```

Integration tests create isolated schemas, repeat migration, and clean up those schemas. They skip if `TEST_DATABASE_URL` is absent. The account must have schema creation/drop permission. The unit and database integration run passed all 12 top-level Go tests.

The browser checks above were interactive verification, not a committed browser automation suite. The native test simulates the bridge and is not evidence of actual emulator/device connectivity. Static Compose validation is not evidence of a running container deployment.

## CodeRabbit

[../.coderabbit.yaml](../.coderabbit.yaml) was validated locally against the official CodeRabbit schema. It instructs future reviews to trace functional workflows, distinguish API-backed auth from demo persistence, and check platform URLs, errors, async restoration, roles, database compatibility, and deployment wiring.

Automatic reviews, automatic incremental reviews, and automatic chat replies are disabled. No CodeRabbit installation, external source upload, pull request submission, or external review was performed as part of this task. This file prepares a later authorized review; it is not CodeRabbit findings.

## Remaining Integration Gaps

- Marketplace APIs and PostgreSQL persistence do not exist for listings, applications, bookings, payments, messages, or administration. A real account's role in a demo dashboard is not backend authorization for those actions.
- Password reset notifications point to a frontend reset path without a form. Email verification requires both the signed link and bearer authentication; simply opening an email link does not complete the current frontend workflow.
- SMTP delivery, TLS deployment, Docker/Nginx runtime, and installed Android connectivity remain unverified.
- Auth tokens remain in localStorage for development. Cached sessions retained during outages must not be interpreted as newly server-validated.
- The pre-existing large frontend bundle and Vite `__dirname` compatibility warnings are unrelated to API connectivity.
- Verification initially found the backend in a nested Git repository. During publication, its legacy Git metadata was preserved in a local backup outside the project and the Go source was imported into the root RentPH repository. Root GitHub Actions now run frontend checks and Go tests with a PostgreSQL service; legacy Laravel runtime files remain local and excluded from publication.
