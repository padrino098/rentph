# RentPH API

This directory contains the Go HTTP API. The service uses PostgreSQL and preserves the existing authentication API contract and database records.

Run locally with `go run -mod=mod .` after setting the variables in `.env.example` in your shell. Run tests with `go test -mod=mod ./...`.

The PostgreSQL integration tests skip unless `TEST_DATABASE_URL` is set. Use a disposable database whose account can create and drop schemas:

```powershell
$env:TEST_DATABASE_URL = "postgres://test_user:test_password@127.0.0.1:5432/test_database?sslmode=disable"
go test -mod=mod -count=1 ./...
go vet -mod=mod ./...
```

Each integration test creates a randomly named schema, initializes it twice, and drops only that schema on completion. Tests cover credential validation, owner roles, token revocation, suspended-account login, signed email verification, password reset expiry and one-time consumption, and Laravel bcrypt/Sanctum compatibility. Mail uses the log mailer, not a real SMTP provider. Do not use production credentials or point these tests at a customer database.

The root `docker-compose.yml` builds this service, migrates the auth schema at startup, and serves the web app through Nginx. API routes and configuration are documented in `../docs/api.md`.
