package main

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

type config struct {
	address      string
	databaseURL  string
	databaseHost string
	databasePort string
	databaseName string
	databaseUser string
	databasePass string
	databaseSSL  string
	appURL       string
	signingKey   string
	corsOrigins  []string
	mailer       string
	mailHost     string
	mailPort     string
	mailUsername string
	mailPassword string
	mailFrom     string
}

func loadConfig() (config, error) {
	cfg := config{
		address:      envOr("API_ADDRESS", ":8000"),
		databaseURL:  strings.TrimSpace(os.Getenv("DATABASE_URL")),
		databaseHost: envOr("DB_HOST", "127.0.0.1"),
		databasePort: envOr("DB_PORT", "5432"),
		databaseName: envOr("DB_DATABASE", "rentph"),
		databaseUser: envOr("DB_USERNAME", "rentph"),
		databasePass: os.Getenv("DB_PASSWORD"),
		databaseSSL:  envOr("DB_SSLMODE", "prefer"),
		appURL:       strings.TrimRight(envOr("APP_URL", "http://localhost:5050"), "/"),
		signingKey:   os.Getenv("AUTH_SIGNING_KEY"),
		corsOrigins:  splitCSV(envOr("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:4173,http://127.0.0.1:4173,http://localhost:5173,http://127.0.0.1:5173")),
		mailer:       strings.ToLower(envOr("MAILER", "log")),
		mailHost:     strings.TrimSpace(os.Getenv("MAIL_HOST")),
		mailPort:     envOr("MAIL_PORT", "587"),
		mailUsername: os.Getenv("MAIL_USERNAME"),
		mailPassword: os.Getenv("MAIL_PASSWORD"),
		mailFrom:     envOr("MAIL_FROM_ADDRESS", "hello@example.com"),
	}

	if len(cfg.signingKey) < 32 {
		return config{}, fmt.Errorf("AUTH_SIGNING_KEY must contain at least 32 bytes")
	}
	if cfg.mailer != "log" && cfg.mailer != "smtp" {
		return config{}, fmt.Errorf("MAILER must be either log or smtp")
	}
	if cfg.mailer == "smtp" && cfg.mailHost == "" {
		return config{}, fmt.Errorf("MAIL_HOST is required when MAILER=smtp")
	}
	if _, err := strconv.Atoi(cfg.mailPort); err != nil {
		return config{}, fmt.Errorf("MAIL_PORT must be a number: %w", err)
	}

	return cfg, nil
}

func envOr(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func splitCSV(value string) []string {
	var values []string
	for _, item := range strings.Split(value, ",") {
		if item = strings.TrimSpace(item); item != "" {
			values = append(values, item)
		}
	}
	return values
}
