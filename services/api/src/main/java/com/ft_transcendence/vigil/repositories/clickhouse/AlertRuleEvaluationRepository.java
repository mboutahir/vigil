package com.ft_transcendence.vigil.repositories.clickhouse;

import com.ft_transcendence.vigil.domain.entities.Alerts.AlertRules;
import com.ft_transcendence.vigil.domain.entities.Alerts.SignalType;
import com.ft_transcendence.vigil.exceptions.TelemetryRepositoryException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;

// we get the number to check against the alert limit, like the error count
@Repository
public class AlertRuleEvaluationRepository {
    private final JdbcTemplate jdbcTemplate;

    public AlertRuleEvaluationRepository(@Qualifier("clickHouseJdbcTemplate") JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Double findAlertRuleValue(AlertRules alertRule, Instant windowEnd) {
        String aggregationExpression = getAggregationExpression(alertRule);
        if (aggregationExpression == null)
            return null;

        SignalType signalType = alertRule.getSignalType();
        // we end at the newest timestamp from the new data and look back as far as the rule says
        // the query only takes rows after the start, up to and including the end
        Instant windowStart = windowEnd.minusSeconds(alertRule.getWindowSeconds());
        String sql = """
                SELECT count() AS row_count, %s AS rule_value
                FROM %s
                WHERE service = ? AND timestamp > ? AND timestamp <= ?
                """.formatted(aggregationExpression, signalType.name());

        String service = alertRule.getService();
        Timestamp startTimestamp = Timestamp.from(windowStart);
        Timestamp endTimestamp = Timestamp.from(windowEnd);
        // we return null if there are no rows. if there are logs but none are errors,
        // an error count rule still gets 0
        RowMapper<Double> ruleValueMapper = (result, rowNumber) -> {
            if (result.getLong("row_count") == 0)
                return null;
            return result.getDouble("rule_value");
        };

        try {
            if (signalType == SignalType.metrics) {
                String metricsSql = sql + "AND name = ? AND value IS NOT NULL";
                return jdbcTemplate.queryForObject(metricsSql, ruleValueMapper,
                        service, startTimestamp, endTimestamp, alertRule.getMetricName());
            }
            return jdbcTemplate.queryForObject(sql, ruleValueMapper, service, startTimestamp, endTimestamp);
        } catch (DataAccessException e) {
            throw new TelemetryRepositoryException("Failed to evaluate rule " + alertRule.getId(), e);
        }
    }

    // for logs and traces the rule name tells us what to count or calculate
    // for metrics the rule picks how to use the values, like avg, max, or latest
    private static String getAggregationExpression(AlertRules alertRule) {
        SignalType signalType = alertRule.getSignalType();
        String aggregation = alertRule.getAggregation();
        if (signalType == SignalType.metrics && aggregation == null)
            return null;

        return switch (signalType) {
            case logs -> switch (alertRule.getMetricName()) {
                case "error_count" -> "countIf(severity = 'error')";
                case "warning_count" -> "countIf(severity = 'warning')";
                case "critical_count" -> "countIf(severity = 'critical')";
                case "total_count" -> "count()";
                default -> null;
            };
            case traces -> switch (alertRule.getMetricName()) {
                case "error_rate" -> "countIf(status = 'error') / count()";
                case "span_count" -> "count()";
                case "avg_duration_ms" -> "avg(duration_ms)";
                case "p50_duration_ms" -> "quantile(0.5)(duration_ms)";
                case "p95_duration_ms" -> "quantile(0.95)(duration_ms)";
                case "p99_duration_ms" -> "quantile(0.99)(duration_ms)";
                case "max_duration_ms" -> "max(duration_ms)";
                default -> null;
            };
            case metrics -> switch (aggregation) {
                case "latest" -> "argMax(value, timestamp)";
                case "avg" -> "avg(value)";
                case "sum" -> "sum(value)";
                case "min" -> "min(value)";
                case "max" -> "max(value)";
                case "count" -> "count()";
                case "p50" -> "quantile(0.5)(value)";
                case "p95" -> "quantile(0.95)(value)";
                case "p99" -> "quantile(0.99)(value)";
                default -> null;
            };
        };
    }
}
