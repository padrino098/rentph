package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

func integrationDatabase(t *testing.T) *pgxpool.Pool {
	t.Helper()
	connection := os.Getenv("TEST_DATABASE_URL")
	if connection == "" {
		t.Skip("set TEST_DATABASE_URL to run real PostgreSQL integration tests")
	}
	ctx := context.Background()
	admin, err := pgxpool.New(ctx, connection)
	if err != nil {
		t.Fatal(err)
	}
	token, err := randomToken()
	if err != nil {
		admin.Close()
		t.Fatal(err)
	}
	schema := pgx.Identifier{"rentph_test_" + token[:16]}.Sanitize()
	if _, err := admin.Exec(ctx, "CREATE SCHEMA "+schema); err != nil {
		admin.Close()
		t.Fatal(err)
	}
	t.Cleanup(func() {
		defer admin.Close()
		if _, err := admin.Exec(ctx, "DROP SCHEMA "+schema+" CASCADE"); err != nil {
			t.Errorf("clean up isolated test schema: %v", err)
		}
	})
	cfg, err := pgxpool.ParseConfig(connection)
	if err != nil {
		t.Fatal(err)
	}
	cfg.ConnConfig.RuntimeParams["search_path"] = schema
	db, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(db.Close)
	if err := migrate(ctx, db); err != nil {
		t.Fatalf("initialize schema: %v", err)
	}
	if err := migrate(ctx, db); err != nil {
		t.Fatalf("repeat migration: %v", err)
	}
	return db
}

func TestPostgresAuthLifecycle(t *testing.T) {
	db := integrationDatabase(t)
	cfg := testConfig()
	cfg.mailFrom = "hello@example.test"
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	server := httptest.NewServer(newRouter(cfg, db, logger))
	defer server.Close()
	api := &apiServer{cfg: cfg, db: db, logger: logger}
	client := server.Client()
	ctx := context.Background()
	const email = "workflow@example.test"
	const password = "StrongPass123!"

	call := func(method, path, token string, body any, wantStatus int) map[string]json.RawMessage {
		t.Helper()
		var reader io.Reader
		if body != nil {
			encoded, err := json.Marshal(body)
			if err != nil {
				t.Fatal(err)
			}
			reader = bytes.NewReader(encoded)
		}
		req, err := http.NewRequest(method, server.URL+path, reader)
		if err != nil {
			t.Fatal(err)
		}
		req.Header.Set("Accept", "application/json")
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Origin", "http://localhost:5173")
		if token != "" {
			req.Header.Set("Authorization", "Bearer "+token)
		}
		res, err := client.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		defer res.Body.Close()
		data, err := io.ReadAll(res.Body)
		if err != nil {
			t.Fatal(err)
		}
		if res.StatusCode != wantStatus {
			t.Fatalf("%s %s status = %d, want %d: %s", method, path, res.StatusCode, wantStatus, data)
		}
		if res.Header.Get("Access-Control-Allow-Origin") != "http://localhost:5173" {
			t.Errorf("%s %s missing CORS origin", method, path)
		}
		var envelope map[string]json.RawMessage
		if err := json.Unmarshal(data, &envelope); err != nil {
			t.Fatalf("invalid JSON response from %s: %v", path, err)
		}
		var success bool
		wantSuccess := wantStatus >= 200 && wantStatus < 300
		if value, ok := envelope["success"]; !ok {
			t.Fatalf("%s missing success envelope", path)
		} else if err := json.Unmarshal(value, &success); err != nil || success != wantSuccess {
			t.Fatalf("%s invalid success flag for HTTP %d: %s", path, wantStatus, value)
		}
		var message string
		if err := json.Unmarshal(envelope["message"], &message); err != nil || strings.TrimSpace(message) == "" {
			t.Fatalf("%s missing response message", path)
		}
		if wantSuccess {
			if _, ok := envelope["data"]; !ok {
				t.Fatalf("%s missing success data field", path)
			}
		}
		return envelope
	}
	auth := func(body map[string]json.RawMessage) authResult {
		t.Helper()
		var result authResult
		if err := json.Unmarshal(body["data"], &result); err != nil {
			t.Fatal(err)
		}
		if result.Token == "" || result.User.ID < 1 || result.User.Email != email {
			t.Fatalf("invalid auth result: %+v", result.User)
		}
		return result
	}
	register := registerRequest{Name: "Workflow Test", Email: email, Password: password, PasswordConfirmation: password, Role: "owner"}
	registered := auth(call("POST", "/api/v1/auth/register", "", register, 201))
	if registered.User.Role != "owner" || registered.User.AccountStatus != "active" || registered.User.EmailVerifiedAt != nil {
		t.Fatalf("unexpected registered user: %+v", registered.User)
	}
	call("POST", "/api/v1/auth/register", "", register, 422)
	register.Email = "admin@example.test"
	register.Role = "admin"
	call("POST", "/api/v1/auth/register", "", register, 422)
	call("POST", "/api/v1/auth/login", "", loginRequest{Email: email, Password: "wrong"}, 401)
	login := auth(call("POST", "/api/v1/auth/login", "", loginRequest{Email: email, Password: password}, 200))
	call("GET", "/api/v1/auth/me", login.Token, nil, 200)
	call("POST", "/api/v1/auth/logout", login.Token, nil, 200)
	call("GET", "/api/v1/auth/me", login.Token, nil, 401)
	call("GET", "/api/v1/auth/me", registered.Token, nil, 200)

	_, err := db.Exec(ctx, "UPDATE users SET account_status='suspended' WHERE id=$1", registered.User.ID)
	if err != nil {
		t.Fatal(err)
	}
	call("POST", "/api/v1/auth/login", "", loginRequest{Email: email, Password: password}, 403)
	if _, err := db.Exec(ctx, "UPDATE users SET account_status='active' WHERE id=$1", registered.User.ID); err != nil {
		t.Fatal(err)
	}

	call("POST", "/api/v1/auth/email/verification-notification", registered.Token, nil, 200)
	link := strings.TrimPrefix(api.verificationURL(registered.User.ID, email), cfg.appURL)
	call("GET", link+"&extra=tampered", registered.Token, nil, 403)
	call("GET", link, registered.Token, nil, 200)
	me := call("GET", "/api/v1/auth/me", registered.Token, nil, 200)
	var current struct {
		User user `json:"user"`
	}
	if err := json.Unmarshal(me["data"], &current); err != nil || current.User.EmailVerifiedAt == nil {
		t.Fatalf("email verification was not persisted: %v", err)
	}
	call("POST", "/api/v1/auth/email/verification-notification", registered.Token, nil, 200)
	call("POST", "/api/v1/auth/forgot-password", "", emailRequest{Email: email}, 200)
	call("POST", "/api/v1/auth/forgot-password", "", emailRequest{Email: "unknown@example.test"}, 200)
	const resetToken = "integration-reset-secret"
	if _, err := db.Exec(ctx, "UPDATE password_reset_tokens SET token=$1, created_at=NOW() WHERE email=$2", tokenDigest(resetToken), email); err != nil {
		t.Fatal(err)
	}
	reset := resetPasswordRequest{Email: email, Token: resetToken, Password: "NewStrongPass123!", PasswordConfirmation: "NewStrongPass123!"}
	call("POST", "/api/v1/auth/reset-password", "", reset, 200)
	call("POST", "/api/v1/auth/reset-password", "", reset, 422)
	call("POST", "/api/v1/auth/login", "", loginRequest{Email: email, Password: password}, 401)
	auth(call("POST", "/api/v1/auth/login", "", loginRequest{Email: email, Password: reset.Password}, 200))
	if _, err := db.Exec(ctx, "INSERT INTO password_reset_tokens (email,token,created_at) VALUES ($1,$2,$3)", email, tokenDigest(resetToken), time.Now().Add(-2*time.Hour)); err != nil {
		t.Fatal(err)
	}
	call("POST", "/api/v1/auth/reset-password", "", reset, 422)
}

func TestPostgresLegacyTokenAndPasswordCompatibility(t *testing.T) {
	db := integrationDatabase(t)
	ctx := context.Background()
	password := "LegacyStrong123!"
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.MinCost)
	if err != nil {
		t.Fatal(err)
	}
	legacyHash := strings.Replace(string(hash), "$2a$", "$2y$", 1)
	var userID, tokenID int64
	if err := db.QueryRow(ctx, "INSERT INTO users (name,email,password) VALUES ('Legacy','legacy@example.test',$1) RETURNING id", legacyHash).Scan(&userID); err != nil {
		t.Fatal(err)
	}
	const secret = "legacy-sanctum-secret"
	if err := db.QueryRow(ctx, "INSERT INTO personal_access_tokens (tokenable_type,tokenable_id,name,token) VALUES ($1,$2,'legacy',$3) RETURNING id", userMorphType, userID, tokenDigest(secret)).Scan(&tokenID); err != nil {
		t.Fatal(err)
	}
	if err := migrate(ctx, db); err != nil {
		t.Fatal(err)
	}
	handler := newRouter(testConfig(), db, slog.New(slog.NewTextHandler(io.Discard, nil)))
	req := httptest.NewRequest("GET", "/api/v1/auth/me", nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %d|%s", tokenID, secret))
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, req)
	if recorder.Code != 200 {
		t.Fatalf("legacy token failed: %d %s", recorder.Code, recorder.Body.String())
	}
	req = httptest.NewRequest("POST", "/api/v1/auth/login", strings.NewReader(`{"email":"legacy@example.test","password":"LegacyStrong123!"}`))
	recorder = httptest.NewRecorder()
	handler.ServeHTTP(recorder, req)
	if recorder.Code != 200 {
		t.Fatalf("legacy password failed: %d %s", recorder.Code, recorder.Body.String())
	}
}
