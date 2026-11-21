package exporter

import (
	"testing"
	"time"
)

// TestDedupKeys checks which field changes affect the identity of each signal.
func TestDedupKeys(tester *testing.T) {

	timestamp := time.Unix(100, 0)
	log := LogRow{ServiceName: "api", Severity: "info", Message: "hello", Timestamp: timestamp}
	sameLog := log

	if logDedupKey(log) != logDedupKey(sameLog) {
		tester.Fatal("the same log must have the same key")
	}

	otherLog := log
	otherLog.Timestamp = timestamp.Add(time.Millisecond)

	if logDedupKey(log) == logDedupKey(otherLog) {
		tester.Fatal("logs with different exact timestamps must not match")
	}

	metric := MetricRow{SeriesID: "series-a", Timestamp: timestamp, DedupPayload: "value-1"}
	otherMetric := metric
	otherMetric.DedupPayload = "value-2"

	if metricDedupKey(metric) == metricDedupKey(otherMetric) {
		tester.Fatal("different metric points must not match")
	}

	span := TraceRow{TraceID: "trace-a", SpanID: "span-a"}
	otherSpan := span
	otherSpan.SpanID = "span-b"

	if traceDedupKey(span) == traceDedupKey(otherSpan) {
		tester.Fatal("different spans must not match")
	}

	otherSpan = span
	otherSpan.Name = "renamed"

	if traceDedupKey(span) != traceDedupKey(otherSpan) {
		tester.Fatal("a retried span keeps its identity even if other fields change")
	}

}
