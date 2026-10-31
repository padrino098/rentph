# Deployment and Local Services

The Compose stack runs the React/Vite production build behind Nginx, the Go API, and PostgreSQL 16. Copy `deploy.env.example` to `deploy.env`, set strong `POSTGRES_PASSWORD` and `AUTH_SIGNING_KEY` values and `PUBLIC_URL`, then start it with `docker compose --env-file deploy.env up --build -d`. The web app is published on host port 5050, the API port is bound to host loopback on 8000 by default, and PostgreSQL is not published. Nginx reverse-proxies `/api/v1`; Compose waits for the healthy database and the API applies idempotent auth schema changes at startup.

For production, set a unique random `AUTH_SIGNING_KEY` of at least 32 bytes and `PUBLIC_URL` to the public origin. Use strong database credentials, configure SMTP for real email delivery, and terminate TLS at an ingress or reverse proxy. Open TCP port 5050 in the host/cloud firewall; keep port 8000 bound to loopback unless direct API access is intentional. Do not expose PostgreSQL publicly.

## Local Frontend Connection

Start PostgreSQL and the Go API, then run `npm run dev` from the repository root. Browser requests default to `/api/v1`; Vite forwards `/api` to `API_PROXY_TARGET`, defaulting to `http://127.0.0.1:8000`. Leave `VITE_API_BASE_URL` empty to use that same-origin proxy. Setting an absolute browser API URL bypasses it and requires the API's CORS configuration to allow the frontend origin.

For Capacitor builds, the emulator default is `http://10.0.2.2:8000/api/v1`. A deployed native build needs an absolute HTTPS `VITE_API_BASE_URL`; a relative `/api/v1` cannot reach the backend from an installed native app. Environment changes require rebuilding the frontend and syncing the native project.

## Validation

Run `npm run test:api`, `npm run lint`, and `npm run build` from the repository root. Run `go test -mod=mod ./...` from the backend directory. Set `TEST_DATABASE_URL` to a disposable PostgreSQL database for real database integration tests; they otherwise skip. The test account needs permission to create and drop isolated schemas.

Live Vite-to-Go-to-PostgreSQL connectivity was checked with disposable local services. Compose YAML and proxy wiring were checked statically, but Docker/Nginx were not executed because Docker is unavailable. Actual SMTP delivery and an installed Android app were not tested. See [connection-verification.md](connection-verification.md) for the full scope.