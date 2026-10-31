# Database

The Go API creates the PostgreSQL auth tables for users, password reset tokens, and Sanctum-compatible personal access tokens at startup. It adds `role` and `account_status` columns to an existing Laravel users table when needed and does not drop existing user records. Roles accepted by public registration are `student`, `renter`, and `owner`; administrator accounts must be provisioned outside public registration.

The configured database connection is PostgreSQL. Go unit tests do not require a database. The requested property, location, dormitory, booking, lease, payment, review, and messaging tables have not yet been added; each will be introduced alongside its owning feature rather than as unused placeholder schema.