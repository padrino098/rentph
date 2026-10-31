package main

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestRegisterValidatesInputWithoutDatabase(t *testing.T) {
	server := testServer()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader(`{"name":"","email":"bad","password":"short","password_confirmation":"different","role":"admin"}`))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()

	server.ServeHTTP(response, request)

	if response.Code != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusUnprocessableEntity)
	}
	var body envelope
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	for _, field := range []string{"name", "email", "password", "role"} {
		if len(body.Errors[field]) == 0 {
			t.Errorf("expected validation errors for %q", field)
		}
	}
}

func TestAuthenticationRoutesKeepJSONEnvelope(t *testing.T) {
	server := testServer()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	response := httptest.NewRecorder()

	server.ServeHTTP(response, request)

	if response.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusUnauthorized)
	}
	var body envelope
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body.Success || body.Message != "Unauthenticated." {
		t.Fatalf("unexpected response envelope: %+v", body)
	}
}

func TestParseBearer(t *testing.T) {
	tests := []struct {
		header string
		id     int64
		secret string
		ok     bool
	}{
		{header: "Bearer 42|abc", id: 42, secret: "abc", ok: true},
		{header: "bearer 42|abc", id: 42, secret: "abc", ok: true},
		{header: "Bearer abc", ok: false},
		{header: "Basic 42|abc", ok: false},
		{header: "Bearer 0|abc", ok: false},
		{header: "Bearer 42|", ok: false},
	}
	for _, test := range tests {
		id, secret, ok := parseBearer(test.header)
		if id != test.id || secret != test.secret || ok != test.ok {
			t.Errorf("parseBearer(%q) = (%d, %q, %t), want (%d, %q, %t)", test.header, id, secret, ok, test.id, test.secret, test.ok)
		}
	}
}

func TestSanctumUserMorphTypeMatchesLaravel(t *testing.T) {
	if userMorphType != `App\Models\User` {
		t.Fatalf("morph type = %q, want App\\Models\\User", userMorphType)
	}
}

func TestVerifyPasswordAcceptsLaravelBcryptHashes(t *testing.T) {
	hash, err := bcrypt.GenerateFromPassword([]byte("StrongPass123!"), bcrypt.MinCost)
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}
	laravelHash := strings.Replace(string(hash), "$2a$", "$2y$", 1)

	if !verifyPassword(laravelHash, "StrongPass123!") {
		t.Fatal("expected Laravel bcrypt hash to verify")
	}
	if verifyPassword(laravelHash, "incorrect") {
		t.Fatal("expected incorrect password to fail")
	}
}

func TestVerifyResetTokenAcceptsLegacyBcryptAndGoHashes(t *testing.T) {
	token := "one-time-reset-token"
	hash, err := bcrypt.GenerateFromPassword([]byte(token), bcrypt.MinCost)
	if err != nil {
		t.Fatalf("hash reset token: %v", err)
	}
	laravelHash := strings.Replace(string(hash), "$2a$", "$2y$", 1)
	if !verifyResetToken(laravelHash, token) {
		t.Fatal("expected legacy Laravel reset token to verify")
	}
	if !verifyResetToken(tokenDigest(token), token) {
		t.Fatal("expected Go reset token to verify")
	}
	if verifyResetToken(tokenDigest(token), "wrong-token") {
		t.Fatal("expected incorrect reset token to fail")
	}
}

func TestVerificationSignature(t *testing.T) {
	server := &apiServer{cfg: testConfig()}
	server.cfg.appURL = "https://rentph.example"
	id := int64(17)
	email := "casey@example.test"
	url := server.verificationURL(id, email)
	request := httptest.NewRequest(http.MethodGet, strings.TrimPrefix(url, server.cfg.appURL), nil)

	if !server.validVerificationSignature(request, strconv.FormatInt(id, 10), verificationHash(email)) {
		t.Fatal("expected generated verification URL to validate")
	}
	request.URL.RawQuery = "expires=1&signature=" + request.URL.Query().Get("signature")
	if server.validVerificationSignature(request, strconv.FormatInt(id, 10), verificationHash(email)) {
		t.Fatal("expected expired verification URL to be rejected")
	}
}

func TestCORSPreflight(t *testing.T) {
	server := testServer()
	request := httptest.NewRequest(http.MethodOptions, "/api/v1/auth/login", nil)
	request.Header.Set("Origin", "http://localhost:5173")
	response := httptest.NewRecorder()

	server.ServeHTTP(response, request)

	if response.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusNoContent)
	}
	if got := response.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
		t.Fatalf("allow-origin = %q", got)
	}
}

func TestDecodeJSONRejectsMultipleValues(t *testing.T) {
	request := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{} {}`))
	response := httptest.NewRecorder()
	var body map[string]any

	err := decodeJSON(response, request, &body)
	if err == nil {
		t.Fatal("expected trailing JSON value to be rejected")
	}
}

func TestHealthResponseUsesStandardEnvelope(t *testing.T) {
	handler := newRouter(testConfig(), nil, slog.New(slog.NewTextHandler(io.Discard, nil)))
	request := httptest.NewRequest(http.MethodGet, "/up", nil)
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
}

func testServer() http.Handler {
	return newRouter(testConfig(), nil, slog.New(slog.NewTextHandler(io.Discard, nil)))
}

func testConfig() config {
	return config{
		appURL:      "http://localhost:5050",
		signingKey:  "test-signing-key",
		corsOrigins: []string{"http://localhost:5173"},
		mailer:      "log",
	}
}
