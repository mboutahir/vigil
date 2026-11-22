package exporter

import (
	"bytes"
	"cmp"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/rand/v2"
	"net/http"
	"slices"
	"time"

	"go.uber.org/zap"
)

// notification is the JSON contract for a visible batch, including one summary per service.
type notification struct {
	NotificationID string                `json:"notification_id"`
	SignalType     string                `json:"signal_type"`
	StoredAt       time.Time             `json:"stored_at"`
	Services       []notificationService `json:"services"`
}

type notificationService struct {
	Service         string    `json:"service"`
	LatestTimestamp time.Time `json:"latest_timestamp"`
}

func serviceMetadata(latest map[string]time.Time) []notificationService {
	services := make([]notificationService, 0, len(latest))
	for service, timestamp := range latest {
		services = append(services, notificationService{service, timestamp.UTC()})
	}
	slices.SortFunc(services, func(a, b notificationService) int { return cmp.Compare(a.Service, b.Service) })
	return services
}

func waitForCallback(ctx context.Context, delay time.Duration) error {
	timer := time.NewTimer(delay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return nil
	}
}

// sendCallback encodes the metadata once so every attempt posts the same notification.
func (exporter *Exporter) sendCallback(ctx context.Context, metadata notification) error {
	payload, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("encode callback: %w", err)
	}

	for attempt := 1; ; attempt++ {
		request, err := http.NewRequestWithContext(ctx, http.MethodPost, exporter.Config.BackendCallbackURL, bytes.NewReader(payload))
		if err != nil {
			return fmt.Errorf("create callback: %w", err)
		}
		request.Header.Set("Content-Type", "application/json")

		response, err := exporter.callbackClient.Do(request)
		if err == nil {
			// Drain a bounded amount to allow reuse of the connection for small responses.
			_, _ = io.Copy(io.Discard, io.LimitReader(response.Body, 4096))
			response.Body.Close()
			status := response.StatusCode
			if status == http.StatusNoContent {
				return nil
			}
			err = fmt.Errorf("callback returned HTTP %d (expected 204)", status)
			if status < 500 || status > 599 {
				return err
			}
		}
		if attempt == 3 || ctx.Err() != nil {
			return err
		}
		delay := time.Duration(attempt)*time.Second + rand.N(250*time.Millisecond)
		if err := exporter.wait(ctx, delay); err != nil {
			return err
		}
	}
}

// recordCallbackFailure reports a failed notification without causing another insert.
func (exporter *Exporter) recordCallbackFailure(ctx context.Context, metadata notification, err error) {
	if exporter.callbackFailures != nil {
		exporter.callbackFailures.Add(ctx, 1)
	}
	if exporter.Settings.Logger != nil {
		exporter.Settings.Logger.Error("telemetry stored but callback failed", zap.String("notification_id", metadata.NotificationID), zap.String("signal_type", metadata.SignalType), zap.Error(err))
	}
}
