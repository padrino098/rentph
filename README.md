# RentPH

RentPH contains a React/Vite frontend in the repository root and a Go JSON API in `backend/`.

## Backend Development

Requirements: Go 1.27+ for local API development, or Docker Engine/Compose for the full stack. The API uses PostgreSQL; the web UI is served by Nginx on port 5050.

```powershell
Copy-Item deploy.env.example deploy.env
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
$key = -join ($bytes | ForEach-Object { $_.ToString('x2') })
(Get-Content deploy.env) -replace '^AUTH_SIGNING_KEY=.*$', "AUTH_SIGNING_KEY=$key" | Set-Content -Encoding ascii deploy.env
# Also replace POSTGRES_PASSWORD with a strong random password.
docker compose --env-file deploy.env up --build -d
```

The web app is available at `http://localhost:5050`; the API is reverse-proxied at `http://localhost:5050/api/v1` and locally published at `http://localhost:8000/api/v1`. The web UI is published on port 5050, the API is bound to host loopback by default, and PostgreSQL stays on the Docker network. `deploy.env` supplies the database password, signing key, and public URL; it is ignored by Git. Set `PUBLIC_URL` to the deployment origin and configure HTTPS before using real credentials or customer data. The API migrates the existing auth schema at startup without dropping users or tokens.

Run the API locally from `backend/` with `go run -mod=mod .` after setting the database and signing-key environment variables. Run backend tests with `go test -mod=mod ./...` from `backend/`.

Run the Vite frontend from the repository root with `npm run dev`. Its `/api` development proxy forwards requests to `http://127.0.0.1:8000`; set `API_PROXY_TARGET` if the Go API runs elsewhere. The API and PostgreSQL must be running for real credential authentication.

Credential registration and login use `VITE_API_BASE_URL`, defaulting to same-origin `/api/v1` in the browser. Vite proxies that path in development and Nginx proxies it in Compose. The Android emulator defaults to `http://10.0.2.2:8000/api/v1`; native builds require an absolute HTTP(S) URL when overriding the default. Use HTTPS for deployed builds.

## Connection Verification

Run `npm run test:api`, `npm run lint`, and `npm run build` from the repository root. Backend unit tests run with `go test -mod=mod ./...` from the backend directory. Set `TEST_DATABASE_URL` to a disposable PostgreSQL database to also run the integration tests; without it, those tests skip.

See [docs/connection-verification.md](docs/connection-verification.md) for the tested workflows, connection fixes, and remaining integration gaps. Authentication is connected to Go; marketplace workflows still use the browser-local demo store. Password reset and email verification exist in the API but do not yet have frontend screens.

[.coderabbit.yaml](.coderabbit.yaml) supplies workflow-focused review instructions with automatic reviews and automatic chat disabled. This configuration is not an executed CodeRabbit review; no external review was triggered.

## Listing Cards

Search and saved-listing cards show only the cover photo, property name, city, rating, and monthly rent, with save and compare actions where available. Select a card to open the full listing, including its address, nearby campuses, availability, amenities, house rules, and rental costs.

## Rental Search

The compact search panel is capped at 768 CSS pixels, with 44-pixel-high controls and individually labelled location, monthly budget, campus, and distance fields: two columns on phones from 360 CSS pixels, one column on narrower screens, and four columns on large screens. A separate action row provides Search rentals and Clear filters without crowding the budget field. Campus shortcuts remain available below the panel.

Budget, campus, and distance use matching RentPH selection dialogs instead of platform-specific select popups. Each dialog shows the current selection, scrollable touch-friendly options, and close/cancel controls. Choosing an option updates the field; Search rentals applies the search. Dismissing a dialog leaves the field unchanged. Android system Back dismisses an open selection dialog before normal app Back behavior.

## Android App

The React frontend is also packaged as a native Android app with Capacitor. See [docs/android-app.md](docs/android-app.md) for SDK/AVD setup and commands. The short workflow is `npm run android:setup`, `npm run android:emulator`, then `npm run android:install` after the emulator finishes booting. A JDK 21 or newer and Android SDK command-line tools are required.

The mobile More menu uses a compact side drawer, limited to 320 CSS pixels or 82% of the viewport width, with scrollable content and touch-friendly menu rows.

## Implemented API

Authentication endpoints are documented in [docs/api.md](docs/api.md). The backend includes registration, login/logout, current-user lookup, password reset, and signed email verification. Property, booking, payment, messaging, and rental lifecycle APIs are not implemented yet.