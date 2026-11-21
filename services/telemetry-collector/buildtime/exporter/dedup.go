package exporter

import (
	"crypto/sha256"
	"encoding/json"
	"time"
)

// A dedupKey is a SHA-256 digest of the identity fields for one telemetry row.
type dedupKey [sha256.Size]byte

func keyFrom(value any) dedupKey {

	data, _ := json.Marshal(value)
	return sha256.Sum256(data)

}

// logDedupKey uses the entire normalized log row before delivery stamps its notification ID.
func logDedupKey(row LogRow) dedupKey {

	return keyFrom(struct {
		Signal string
		Row    LogRow
	}{"logs", row})

}

// metricDedupKey identifies a point by series, timestamps, and normalized payload.
func metricDedupKey(row MetricRow) dedupKey {

	return keyFrom(struct {
		Signal         string
		SeriesID       string
		Timestamp      time.Time
		StartTimestamp *time.Time
		Payload        string
	}{"metrics", row.SeriesID, row.Timestamp, row.StartTimestamp, row.DedupPayload})

}

// traceDedupKey keeps the same identity when a retry changes other span fields.
func traceDedupKey(row TraceRow) dedupKey {

	return keyFrom(struct {
		Signal  string
		TraceID string
		SpanID  string
	}{"traces", row.TraceID, row.SpanID})

}
