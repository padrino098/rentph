package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha1"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type envelope struct {
	Success bool                `json:"success"`
	Message string              `json:"message"`
	Data    any                 `json:"data,omitempty"`
	Errors  map[string][]string `json:"errors,omitempty"`
}

type user struct {
	ID              int64      `json:"id"`
	Name            string     `json:"name"`
	Email           string     `json:"email"`
	Role            string     `json:"role"`
	AccountStatus   string     `json:"account_status"`
	EmailVerifiedAt *time.Time `json:"email_verified_at"`
	PasswordHash    string     `json:"-"`
}

type apiServer struct {
	cfg    config
	db     *pgxpool.Pool
	logger *slog.Logger
}

type authenticated struct {
	user    user
	tokenID int64
}

type authContextKey struct{}

const userMorphType = "App\\Models\\User"

func newRouter(cfg config, db *pgxpool.Pool, logger *slog.Logger) http.Handler {
	api := &apiServer{cfg: cfg, db: db, logger: logger}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /up", api.health)
	mux.HandleFunc("GET /api/v1/health", api.health)
	mux.HandleFunc("POST /api/v1/auth/register", api.register)
	mux.HandleFunc("POST /api/v1/auth/login", api.login)
	mux.HandleFunc("POST /api/v1/auth/forgot-password", api.forgotPassword)
	mux.HandleFunc("POST /api/v1/auth/reset-password", api.resetPassword)
	mux.Handle("POST /api/v1/auth/logout", api.requireAuth(http.HandlerFunc(api.logout)))
	mux.Handle("GET /api/v1/auth/me", api.requireAuth(http.HandlerFunc(api.me)))
	mux.Handle("POST /api/v1/auth/email/verification-notification", api.requireAuth(http.HandlerFunc(api.sendVerificationNotification)))
	mux.Handle("GET /api/v1/auth/email/verify/{id}/{hash}", api.requireAuth(http.HandlerFunc(api.verifyEmail)))

	return api.withLogging(api.withCORS(mux))
}

func (s *apiServer) withCORS(next http.Handler) http.Handler {
	allowed := make(map[string]struct{}, len(s.cfg.corsOrigins))
	for _, origin := range s.cfg.corsOrigins {
		allowed[origin] = struct{}{}
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if _, ok := allowed[origin]; ok && origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Add("Vary", "Origin")
		}
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type")
			w.Header().Set("Access-Control-Max-Age", "600")
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *apiServer) withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		s.logger.Info("request", "method", r.Method, "path", r.URL.Path, "duration", time.Since(start))
	})
}

func (s *apiServer) health(w http.ResponseWriter, r *http.Request) {
	if s.db != nil {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		if err := s.db.Ping(ctx); err != nil {
			s.writeError(w, http.StatusServiceUnavailable, "Database unavailable.", nil)
			return
		}
	}
	s.writeSuccess(w, http.StatusOK, "OK", map[string]string{"status": "ok"})
}

func (s *apiServer) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenID, secret, ok := parseBearer(r.Header.Get("Authorization"))
		if !ok {
			s.writeError(w, http.StatusUnauthorized, "Unauthenticated.", nil)
			return
		}

		var current authenticated
		err := s.db.QueryRow(r.Context(), `
SELECT u.id, u.name, u.email, u.role, u.account_status, u.email_verified_at,
       u.password, t.id
FROM personal_access_tokens t
JOIN users u ON u.id = t.tokenable_id
WHERE t.id = $1
  AND t.tokenable_type = $3
  AND t.token = $2
  AND (t.expires_at IS NULL OR t.expires_at > NOW())`,
			tokenID, tokenDigest(secret), userMorphType,
		).Scan(
			&current.user.ID, &current.user.Name, &current.user.Email, &current.user.Role,
			&current.user.AccountStatus, &current.user.EmailVerifiedAt, &current.user.PasswordHash,
			&current.tokenID,
		)
		if errors.Is(err, pgx.ErrNoRows) {
			s.writeError(w, http.StatusUnauthorized, "Unauthenticated.", nil)
			return
		}
		if err != nil {
			s.internalError(w, err)
			return
		}
		if _, err := s.db.Exec(r.Context(), "UPDATE personal_access_tokens SET last_used_at = NOW(), updated_at = NOW() WHERE id = $1", current.tokenID); err != nil {
			s.internalError(w, err)
			return
		}

		ctx := context.WithValue(r.Context(), authContextKey{}, current)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (s *apiServer) currentUser(r *http.Request) authenticated {
	return r.Context().Value(authContextKey{}).(authenticated)
}

func (s *apiServer) writeSuccess(w http.ResponseWriter, status int, message string, data any) {
	if data == nil {
		data = json.RawMessage("null")
	}
	s.writeJSON(w, status, envelope{Success: true, Message: message, Data: data})
}

func (s *apiServer) writeError(w http.ResponseWriter, status int, message string, validation map[string][]string) {
	if validation == nil {
		validation = map[string][]string{}
	}
	s.writeJSON(w, status, map[string]any{
		"success": false,
		"message": message,
		"errors":  validation,
	})
}

func (s *apiServer) writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		s.logger.Error("write API response", "error", err)
	}
}

func (s *apiServer) internalError(w http.ResponseWriter, err error) {
	s.logger.Error("API request failed", "error", err)
	s.writeError(w, http.StatusInternalServerError, "An unexpected error occurred.", nil)
}

func decodeJSON(w http.ResponseWriter, r *http.Request, target any) error {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(target); err != nil {
		return err
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return fmt.Errorf("request body must contain one JSON object")
	}
	return nil
}

func parseBearer(header string) (int64, string, bool) {
	parts := strings.Fields(header)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return 0, "", false
	}
	tokenParts := strings.SplitN(parts[1], "|", 2)
	if len(tokenParts) != 2 || tokenParts[1] == "" {
		return 0, "", false
	}
	id, err := strconv.ParseInt(tokenParts[0], 10, 64)
	if err != nil || id < 1 {
		return 0, "", false
	}
	return id, tokenParts[1], true
}

func tokenDigest(secret string) string {
	sum := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(sum[:])
}

func randomToken() (string, error) {
	bytes, err := randomBytes(32)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func verificationHash(email string) string {
	sum := sha1.Sum([]byte(email))
	return hex.EncodeToString(sum[:])
}

func (s *apiServer) verificationURL(id int64, email string) string {
	expires := time.Now().Add(60 * time.Minute).Unix()
	path := fmt.Sprintf("/api/v1/auth/email/verify/%d/%s", id, verificationHash(email))
	unsigned := s.cfg.appURL + path + "?expires=" + strconv.FormatInt(expires, 10)
	signature := hmacHex(s.cfg.signingKey, unsigned)
	return unsigned + "&signature=" + signature
}

func (s *apiServer) validVerificationSignature(r *http.Request, id, hash string) bool {
	query := r.URL.Query()
	if len(query) != 2 || len(query["expires"]) != 1 || len(query["signature"]) != 1 {
		return false
	}
	expiresText := query.Get("expires")
	signature := query.Get("signature")
	expires, err := strconv.ParseInt(expiresText, 10, 64)
	if err != nil || time.Now().Unix() > expires || signature == "" {
		return false
	}
	path := fmt.Sprintf("/api/v1/auth/email/verify/%s/%s", id, hash)
	unsigned := s.cfg.appURL + path + "?" + url.Values{"expires": []string{expiresText}}.Encode()
	return hmac.Equal([]byte(signature), []byte(hmacHex(s.cfg.signingKey, unsigned)))
}

func hmacHex(key, value string) string {
	mac := hmac.New(sha256.New, []byte(key))
	_, _ = mac.Write([]byte(value))
	return hex.EncodeToString(mac.Sum(nil))
}
