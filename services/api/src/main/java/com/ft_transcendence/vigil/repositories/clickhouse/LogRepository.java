package com.ft_transcendence.vigil.repositories.clickhouse;

import com.ft_transcendence.vigil.domain.dtos.telemetry.Log;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.function.Consumer;

// we read logs from ClickHouse and can filter by time, service, severity, or message text
@Repository
public class LogRepository {

    private static final String SELECT = """
            SELECT service, timestamp, severity, message, attributes
            FROM logs
            """;

    private final JdbcTemplate jdbcTemplate;

    public LogRepository(@Qualifier("clickHouseJdbcTemplate") JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Log> findLogs(
            String period,
            String service,
            String severity,
            String search,
            String sort,
            int count,
            Instant before,
            int offset) {

        ClickHouseQuery query = filtered(period, service, severity, search);

        // when sorting by time, the next page gets older logs
        // when sorting by another column, offset tells us how many rows to skip
        if (sort == null || sort.isBlank() || sort.equals("timestamp"))
            query.before(before).orderBy("timestamp DESC").limit(count);
        else
            query.orderBy(sortColumn(sort) + " ASC").limit(count).offset(offset);

        return query.list(jdbcTemplate, this::mapLog, "logs");
    }

    // for CSV we get all the matching logs, newest first
    public void streamAllLogs(
            String period,
            String service,
            String severity,
            String search,
            Consumer<Log> consumer) {

        filtered(period, service, severity, search)
                .orderBy("timestamp DESC")
                .stream(jdbcTemplate, this::mapLog, consumer, "logs");
    }

    // for alert analysis we read logs between these times, oldest first
    public List<Log> findLogs(String service, Instant from, Instant to) {
        return filtered(null, service, null, null)
                .between(from, to)
                .orderBy("timestamp ASC")
                .list(jdbcTemplate, this::mapLog, "logs");
    }

    // when the collector tells us it saved new logs, we find them by notification ID
    // so the live page can show them
    public List<Log> findByNotificationId(String notificationId) {
        if (notificationId == null || notificationId.isBlank()) {
            throw new IllegalArgumentException("notificationId must not be blank");
        }
        return ClickHouseQuery.from(SELECT)
                .eq("attributes['vigil.notification_id']", notificationId)
                .list(jdbcTemplate, this::mapLog, "logs");
    }

    private ClickHouseQuery filtered(String period, String service, String severity, String search) {
        return ClickHouseQuery.from(SELECT)
                .since(period)
                .eq("service", service)
                .eq("severity", severity)
                .like("message", search);
    }

    private Log mapLog(ResultSet result, int rowNum) throws SQLException {
        return new Log(
                result.getString("service"),
                result.getTimestamp("timestamp").toInstant(),
                result.getString("severity"),
                result.getString("message"),
                ClickHouseQuery.attributes(result));
    }

    private String sortColumn(String sort) {
        return switch (sort) {
            case "timestamp" -> "timestamp";
            case "service" -> "service";
            case "severity" -> "severity";
            case "message" -> "message";
            default -> throw new IllegalArgumentException("unknown sort field");
        };
    }
}
