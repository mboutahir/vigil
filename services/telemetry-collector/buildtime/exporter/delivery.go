package exporter

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"slices"
	"time"

	"go.opentelemetry.io/collector/consumer/consumererror"
)

var errDedupInFlight = errors.New("matching telemetry is awaiting storage; retry export")

// pendingDelivery remembers an accepted insert that still needs visibility confirmation.
type pendingDelivery struct {
	metadata notification
	keys     []dedupKey
	count    int
}

func deliver[T any](ctx context.Context, exporter *Exporter, signal string, rows []T, key func(T) dedupKey, fields func(T) (string, time.Time, map[string]string), insert func(context.Context, []T) error) error {
	if len(rows) == 0 {
		return nil
	}
	if !exporter.deliveryMu.TryLock() {
		return errDedupInFlight
	}
	defer exporter.deliveryMu.Unlock()

	id := exporter.newNotificationID()
	keys := make([]dedupKey, len(rows))
	incoming := make(map[dedupKey]bool, len(rows))
	size := 0
	for i, row := range rows {
		keys[i] = key(row) // Hash before stamping the generated notification ID.
		incoming[keys[i]] = true
		_, _, attributes := fields(row)
		attributes["vigil.notification_id"] = id

		encoded, err := json.Marshal(row)
		if err != nil {
			return consumererror.NewPermanent(fmt.Errorf("serialize %s: %w", signal, err))
		}
		size += len(encoded) + 1 // JSONEachRow adds one newline per row, including duplicates.
		if size > exporter.Config.MaxSerializedBatchBytes {
			return consumererror.NewPermanent(fmt.Errorf("serialized %s batch exceeds %d bytes", signal, exporter.Config.MaxSerializedBatchBytes))
		}
	}

	// Recover accepted inserts before selecting new rows. Recovered keys must be
	// skipped for this call even if their refreshed expiry elapses during a callback.
	recovered := make(map[dedupKey]bool)
	for i := 0; i < len(exporter.pending); {
		pending := exporter.pending[i]
		overlaps := slices.ContainsFunc(pending.keys, func(key dedupKey) bool { return incoming[key] })
		if !overlaps {
			i++
			continue
		}
		if err := exporter.finishDelivery(ctx, pending); err != nil {
			return err
		}
		for _, key := range pending.keys {
			recovered[key] = true
		}
		exporter.pending = slices.Delete(exporter.pending, i, i+1)
	}

	now := exporter.now()
	for key, expiresAt := range exporter.recent {
		if !now.Before(expiresAt) {
			delete(exporter.recent, key)
		}
	}

	var stored []T
	var storedKeys []dedupKey
	latest := make(map[string]time.Time)
	for i, row := range rows {
		key := keys[i]
		if !incoming[key] || recovered[key] {
			continue
		}
		delete(incoming, key) // Keep only the first occurrence in this batch.
		if _, exists := exporter.recent[key]; exists {
			continue
		}
		stored = append(stored, row)
		storedKeys = append(storedKeys, key)
		service, timestamp, _ := fields(row)
		if timestamp.After(latest[service]) {
			latest[service] = timestamp
		}
	}
	if len(stored) == 0 {
		return nil
	}
	if err := insert(ctx, stored); err != nil {
		return fmt.Errorf("insert %s: %w", signal, err)
	}

	pending := pendingDelivery{
		metadata: notification{NotificationID: id, SignalType: signal, Services: serviceMetadata(latest)},
		keys:     storedKeys,
		count:    len(stored),
	}
	if err := exporter.finishDelivery(ctx, pending); err != nil {
		exporter.pending = append(exporter.pending, pending)
		return err
	}
	return nil
}

func (exporter *Exporter) finishDelivery(ctx context.Context, pending pendingDelivery) error {
	metadata := pending.metadata
	if err := exporter.Storage.ConfirmVisible(ctx, metadata.SignalType, metadata.NotificationID, pending.count); err != nil {
		return fmt.Errorf("confirm %s visibility (insert already committed): %w", metadata.SignalType, err)
	}

	metadata.StoredAt = exporter.now().UTC()
	expiresAt := metadata.StoredAt.Add(exporter.Config.DedupWindow)
	for _, key := range pending.keys {
		exporter.recent[key] = expiresAt
	}
	if err := exporter.sendCallback(ctx, metadata); err != nil {
		exporter.recordCallbackFailure(ctx, metadata, err)
	}
	return nil
}
