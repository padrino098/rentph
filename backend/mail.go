package main

import (
	"fmt"
	"net"
	"net/mail"
	"net/smtp"
	"strings"
)

func (s *apiServer) sendMail(recipient, subject, body string) error {
	from, err := mail.ParseAddress(s.cfg.mailFrom)
	if err != nil {
		return fmt.Errorf("invalid MAIL_FROM_ADDRESS: %w", err)
	}
	to, err := mail.ParseAddress(recipient)
	if err != nil {
		return fmt.Errorf("invalid recipient address: %w", err)
	}

	if s.cfg.mailer == "log" {
		s.logger.Info("email notification", "to", to.Address, "subject", subject, "body", body)
		return nil
	}

	host, _, err := net.SplitHostPort(net.JoinHostPort(s.cfg.mailHost, s.cfg.mailPort))
	if err != nil {
		return fmt.Errorf("invalid SMTP host or port: %w", err)
	}
	var auth smtp.Auth
	if s.cfg.mailUsername != "" {
		auth = smtp.PlainAuth("", s.cfg.mailUsername, s.cfg.mailPassword, host)
	}

	message := strings.Join([]string{
		"From: " + from.String(),
		"To: " + to.String(),
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"",
		strings.ReplaceAll(body, "\n", "\r\n"),
	}, "\r\n")
	if err := smtp.SendMail(net.JoinHostPort(s.cfg.mailHost, s.cfg.mailPort), auth, from.Address, []string{to.Address}, []byte(message)); err != nil {
		return fmt.Errorf("send SMTP message: %w", err)
	}
	s.logger.Info("email notification sent", "to", to.Address, "subject", subject)
	return nil
}
