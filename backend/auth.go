package main

import (
	"context"
	"crypto/subtle"
	"errors"
	"fmt"
	"net/http"
	"net/mail"
	"net/url"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
)

type registerRequest struct {
	Name                 string `json:"name"`
	Email                string `json:"email"`
	Password             string `json:"password"`
	PasswordConfirmation string `json:"password_confirmation"`
	Role                 string `json:"role"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type emailRequest struct {
	Email string `json:"email"`
}

type resetPasswordRequest struct {
	Email                string `json:"email"`
	Token                string `json:"token"`
	Password             string `json:"password"`
	PasswordConfirmation string `json:"password_confirmation"`
}

type authResult struct {
	User  user   `json:"user"`
	Token string `json:"token,omitempty"`
}

func (s *apiServer) register(w http.ResponseWriter, r *http.Request) {
	var input registerRequest
	if err := decodeJSON(w, r, &input); err != nil {
		s.writeError(w, http.StatusBadRequest, "The request body must be valid JSON.", nil)
		return
	}
	input.Name = strings.TrimSpace(input.Name)
	input.Email = normalizeEmail(input.Email)
	if input.Role == "" {
		input.Role = "student"
	}
	validation := make(map[string][]string)
	if input.Name == "" || utf8.RuneCountInString(input.Name) > 255 {
		validation["name"] = []string{"The name field is required and must be at most 255 characters."}
	}
	validateEmail(validation, input.Email)
	validatePassword(validation, input.Password, input.PasswordConfirmation)
	if input.Role != "student" && input.Role != "renter" && input.Role != "owner" {
		validation["role"] = []string{"The selected role is invalid."}
	}
	if len(validation) > 0 {
		s.writeError(w, http.StatusUnprocessableEntity, "The given data was invalid.", validation)
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(input.Password), 12)
	if err != nil {
		s.internalError(w, err)
		return
	}
	secret, err := randomToken()
	if err != nil {
		s.internalError(w, err)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	tx, err := s.db.Begin(ctx)
	if err != nil {
		s.internalError(w, err)
		return
	}
	defer func() {
		if err := tx.Rollback(context.Background()); err != nil && !errors.Is(err, pgx.ErrTxClosed) {
			s.logger.Error("rollback registration transaction", "error", err)
		}
	}()

	var current user
	err = tx.QueryRow(ctx, `
INSERT INTO users (name, email, password, role, account_status, created_at, updated_at)
VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
RETURNING id, name, email, role, account_status, email_verified_at`,
		input.Name, input.Email, string(passwordHash), input.Role,
	).Scan(&current.ID, &current.Name, &current.Email, &current.Role, &current.AccountStatus, &current.EmailVerifiedAt)
	if err != nil {
		if isUniqueViolation(err) {
			s.writeError(w, http.StatusUnprocessableEntity, "The given data was invalid.", map[string][]string{
				"email": {"The email has already been taken."},
			})
			return
		}
		s.internalError(w, err)
		return
	}
	var tokenID int64
	err = tx.QueryRow(ctx, `
INSERT INTO personal_access_tokens (tokenable_type, tokenable_id, name, token, abilities, created_at, updated_at)
VALUES ($1, $2, 'rentph-api', $3, '["*"]', NOW(), NOW())
RETURNING id`,
		userMorphType, current.ID, tokenDigest(secret),
	).Scan(&tokenID)
	if err != nil {
		s.internalError(w, err)
		return
	}
	if err := tx.Commit(ctx); err != nil {
		s.internalError(w, err)
		return
	}

	verificationURL := s.verificationURL(current.ID, current.Email)
	if err := s.sendMail(current.Email, "Verify your RentPH email", "Verify your RentPH email address:\n\n"+verificationURL); err != nil {
		s.logger.Error("send email verification", "user_id", current.ID, "error", err)
		s.writeError(w, http.StatusInternalServerError, "Your account was created, but the verification email could not be sent.", nil)
		return
	}

	s.writeSuccess(w, http.StatusCreated, "Account registered.", authResult{
		User: current, Token: fmt.Sprintf("%d|%s", tokenID, secret),
	})
}

func (s *apiServer) login(w http.ResponseWriter, r *http.Request) {
	var input loginRequest
	if err := decodeJSON(w, r, &input); err != nil {
		s.writeError(w, http.StatusBadRequest, "The request body must be valid JSON.", nil)
		return
	}
	input.Email = normalizeEmail(input.Email)
	validation := make(map[string][]string)
	validateEmail(validation, input.Email)
	if input.Password == "" {
		validation["password"] = []string{"The password field is required."}
	}
	if len(validation) > 0 {
		s.writeError(w, http.StatusUnprocessableEntity, "The given data was invalid.", validation)
		return
	}

	var current user
	err := s.db.QueryRow(r.Context(), `
SELECT id, name, email, role, account_status, email_verified_at, password
FROM users WHERE email = $1`, input.Email,
	).Scan(&current.ID, &current.Name, &current.Email, &current.Role, &current.AccountStatus,
		&current.EmailVerifiedAt, &current.PasswordHash)
	if errors.Is(err, pgx.ErrNoRows) || (err == nil && !verifyPassword(current.PasswordHash, input.Password)) {
		s.writeError(w, http.StatusUnauthorized, "The provided credentials are invalid.", nil)
		return
	}
	if err != nil {
		s.internalError(w, err)
		return
	}
	if current.AccountStatus != "active" {
		s.writeError(w, http.StatusForbidden, "This account is not active.", nil)
		return
	}

	secret, err := randomToken()
	if err != nil {
		s.internalError(w, err)
		return
	}
	var tokenID int64
	err = s.db.QueryRow(r.Context(), `
INSERT INTO personal_access_tokens (tokenable_type, tokenable_id, name, token, abilities, created_at, updated_at)
VALUES ($1, $2, 'rentph-api', $3, '["*"]', NOW(), NOW())
RETURNING id`, userMorphType, current.ID, tokenDigest(secret)).Scan(&tokenID)
	if err != nil {
		s.internalError(w, err)
		return
	}

	s.writeSuccess(w, http.StatusOK, "Logged in.", authResult{
		User: current, Token: fmt.Sprintf("%d|%s", tokenID, secret),
	})
}

func (s *apiServer) logout(w http.ResponseWriter, r *http.Request) {
	current := s.currentUser(r)
	if _, err := s.db.Exec(r.Context(), "DELETE FROM personal_access_tokens WHERE id = $1", current.tokenID); err != nil {
		s.internalError(w, err)
		return
	}
	s.writeSuccess(w, http.StatusOK, "Logged out.", nil)
}

func (s *apiServer) me(w http.ResponseWriter, r *http.Request) {
	current := s.currentUser(r)
	s.writeSuccess(w, http.StatusOK, "OK", map[string]user{"user": current.user})
}

func (s *apiServer) forgotPassword(w http.ResponseWriter, r *http.Request) {
	var input emailRequest
	if err := decodeJSON(w, r, &input); err != nil {
		s.writeError(w, http.StatusBadRequest, "The request body must be valid JSON.", nil)
		return
	}
	input.Email = normalizeEmail(input.Email)
	validation := make(map[string][]string)
	validateEmail(validation, input.Email)
	if len(validation) > 0 {
		s.writeError(w, http.StatusUnprocessableEntity, "The given data was invalid.", validation)
		return
	}

	var userID int64
	err := s.db.QueryRow(r.Context(), "SELECT id FROM users WHERE email = $1", input.Email).Scan(&userID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		s.internalError(w, err)
		return
	}
	if err == nil {
		token, tokenErr := randomToken()
		if tokenErr != nil {
			s.internalError(w, tokenErr)
			return
		}
		_, tokenErr = s.db.Exec(r.Context(), `
INSERT INTO password_reset_tokens (email, token, created_at)
VALUES ($1, $2, NOW())
ON CONFLICT (email) DO UPDATE SET token = EXCLUDED.token, created_at = NOW()`,
			input.Email, tokenDigest(token))
		if tokenErr != nil {
			s.internalError(w, tokenErr)
			return
		}
		resetURL := s.cfg.appURL + "/reset-password?token=" + url.QueryEscape(token) + "&email=" + url.QueryEscape(input.Email)
		if err := s.sendMail(input.Email, "Reset your RentPH password", "Reset your RentPH password using this link:\n\n"+resetURL); err != nil {
			s.logger.Error("send password reset email", "user_id", userID, "error", err)
		}
	}
	s.writeSuccess(w, http.StatusOK, "If the account exists, a password reset link has been sent.", nil)
}

func (s *apiServer) resetPassword(w http.ResponseWriter, r *http.Request) {
	var input resetPasswordRequest
	if err := decodeJSON(w, r, &input); err != nil {
		s.writeError(w, http.StatusBadRequest, "The request body must be valid JSON.", nil)
		return
	}
	input.Email = normalizeEmail(input.Email)
	validation := make(map[string][]string)
	validateEmail(validation, input.Email)
	if input.Token == "" {
		validation["token"] = []string{"The token field is required."}
	}
	validatePassword(validation, input.Password, input.PasswordConfirmation)
	if len(validation) > 0 {
		s.writeError(w, http.StatusUnprocessableEntity, "The given data was invalid.", validation)
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), 12)
	if err != nil {
		s.internalError(w, err)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	tx, err := s.db.Begin(ctx)
	if err != nil {
		s.internalError(w, err)
		return
	}
	defer func() {
		if err := tx.Rollback(context.Background()); err != nil && !errors.Is(err, pgx.ErrTxClosed) {
			s.logger.Error("rollback password reset transaction", "error", err)
		}
	}()

	var storedToken string
	var createdAt *time.Time
	err = tx.QueryRow(ctx, `
SELECT token, created_at FROM password_reset_tokens
WHERE email = $1
FOR UPDATE`, input.Email).Scan(&storedToken, &createdAt)
	if errors.Is(err, pgx.ErrNoRows) || (err == nil && (createdAt == nil || time.Since(*createdAt) > time.Hour || !verifyResetToken(storedToken, input.Token))) {
		s.writeError(w, http.StatusUnprocessableEntity, "The password reset token is invalid or expired.", nil)
		return
	}
	if err != nil {
		s.internalError(w, err)
		return
	}
	result, err := tx.Exec(ctx, "UPDATE users SET password = $1, remember_token = NULL, updated_at = NOW() WHERE email = $2", string(hash), input.Email)
	if err != nil {
		s.internalError(w, err)
		return
	}
	if result.RowsAffected() == 0 {
		s.writeError(w, http.StatusUnprocessableEntity, "The password reset token is invalid or expired.", nil)
		return
	}
	if _, err := tx.Exec(ctx, "DELETE FROM password_reset_tokens WHERE email = $1", input.Email); err != nil {
		s.internalError(w, err)
		return
	}
	if err := tx.Commit(ctx); err != nil {
		s.internalError(w, err)
		return
	}
	s.writeSuccess(w, http.StatusOK, "Password reset.", nil)
}

func (s *apiServer) sendVerificationNotification(w http.ResponseWriter, r *http.Request) {
	current := s.currentUser(r).user
	if current.EmailVerifiedAt != nil {
		s.writeSuccess(w, http.StatusOK, "Email already verified.", nil)
		return
	}
	link := s.verificationURL(current.ID, current.Email)
	if err := s.sendMail(current.Email, "Verify your RentPH email", "Verify your RentPH email address:\n\n"+link); err != nil {
		s.logger.Error("send email verification", "user_id", current.ID, "error", err)
		s.writeError(w, http.StatusInternalServerError, "The verification email could not be sent.", nil)
		return
	}
	s.writeSuccess(w, http.StatusOK, "Verification link sent.", nil)
}

func (s *apiServer) verifyEmail(w http.ResponseWriter, r *http.Request) {
	current := s.currentUser(r)
	idText, hash := r.PathValue("id"), r.PathValue("hash")
	if idText != fmt.Sprint(current.user.ID) ||
		subtle.ConstantTimeCompare([]byte(hash), []byte(verificationHash(current.user.Email))) != 1 ||
		!s.validVerificationSignature(r, idText, hash) {
		s.writeError(w, http.StatusForbidden, "The verification link is invalid.", nil)
		return
	}

	if current.user.EmailVerifiedAt == nil {
		if _, err := s.db.Exec(r.Context(), "UPDATE users SET email_verified_at = NOW(), updated_at = NOW() WHERE id = $1 AND email_verified_at IS NULL", current.user.ID); err != nil {
			s.internalError(w, err)
			return
		}
	}
	s.writeSuccess(w, http.StatusOK, "Email verified.", map[string]bool{"verified": true})
}

func validateEmail(validation map[string][]string, email string) {
	parsed, err := mail.ParseAddress(email)
	if email == "" || len(email) > 255 || err != nil || parsed.Address != email {
		validation["email"] = []string{"The email must be a valid email address."}
	}
}

func validatePassword(validation map[string][]string, password, confirmation string) {
	if utf8.RuneCountInString(password) < 8 {
		validation["password"] = append(validation["password"], "The password must be at least 8 characters.")
	}
	if len(password) > 72 {
		validation["password"] = append(validation["password"], "The password may not be greater than 72 bytes.")
	}
	if confirmation == "" || password != confirmation {
		validation["password"] = append(validation["password"], "The password confirmation does not match.")
	}
}

func normalizeEmail(email string) string {
	return strings.TrimSpace(email)
}

func verifyPassword(hash, password string) bool {
	return compareBcryptHash(hash, password) == nil
}

func compareBcryptHash(hash, password string) error {
	if strings.HasPrefix(hash, "$2y$") {
		hash = "$2a$" + strings.TrimPrefix(hash, "$2y$")
	}
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

func verifyResetToken(storedHash, token string) bool {
	if subtle.ConstantTimeCompare([]byte(storedHash), []byte(tokenDigest(token))) == 1 {
		return true
	}
	return compareBcryptHash(storedHash, token) == nil
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
