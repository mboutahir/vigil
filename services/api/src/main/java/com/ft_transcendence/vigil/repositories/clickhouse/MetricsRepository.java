package com.ft_transcendence.vigil.repositories.clickhouse;

import com.ft_transcendence.vigil.domain.dtos.telemetry.Metric;
import com.ft_transcendence.vigil.domain.dtos.telemetry.MetricPoint;
import com.ft_transcendence.vigil.domain.dtos.telemetry.MetricSeries;
import com.ft_transcendence.vigil.exceptions.TelemetryRepositoryException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

// we read metric points for the list and CSV, and group them by time for the chart
@Repository
public class MetricsRepository {

	private static final String SELECT = """
			SELECT service, timestamp, name, value, attributes
			FROM metrics
			""";

	private static final String SERIES_SQL = """
			WITH chart_points AS (
				SELECT service, name, unit, value,
					attributes['internal'] = 'true' AS is_internal,
					toStartOfInterval(timestamp, toIntervalSecond(%1$d)) AS bucket,
					if(metric_type = 'sum' AND is_monotonic, 'counter', 'gauge') AS kind,
					lag(value) OVER (PARTITION BY series_id ORDER BY timestamp) AS previous_value,
					-- if a counter goes from 100 to 130, we count 30 for this point
					CASE
						WHEN aggregation_temporality != 'cumulative' THEN value
						WHEN value >= previous_value THEN value - previous_value
					END AS counter_change
				FROM metrics
				%2$s
			)
			SELECT service, name, bucket,
				any(unit) AS series_unit,
				any(kind) AS series_kind,
				any(is_internal) AS series_internal,
				-- counters show how much changed per second, gauges show the average
				if(series_kind = 'counter', sum(counter_change) / %1$d, avg(value)) AS bucket_value
			FROM chart_points
			GROUP BY service, name, bucket
			ORDER BY name, service, bucket
			""";

	private final JdbcTemplate jdbcTemplate;

	public MetricsRepository(@Qualifier("clickHouseJdbcTemplate") JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	public List<Metric> findMetrics(
			String service,
			String period,
			Boolean internalOnly,
			Instant before,
			int limit) {

		// for the next page we only get points older than the before time
		return filtered(service, period, internalOnly)
				.before(before)
				.orderBy("timestamp DESC")
				.limit(limit)
				.list(jdbcTemplate, this::mapMetric, "metrics");
	}

	// for CSV we get all the matching points, newest first
	public void streamAllMetrics(
			String service,
			String period,
			Boolean internalOnly,
			Consumer<Metric> consumer) {

		filtered(service, period, internalOnly)
				.orderBy("timestamp DESC")
				.stream(jdbcTemplate, this::mapMetric, consumer, "metrics");
	}

	// for alert analysis we read points between these times, oldest first
	public List<Metric> findMetrics(String service, Instant from, Instant to) {
		return filtered(service, null, null)
				.between(from, to)
				.orderBy("timestamp ASC")
				.list(jdbcTemplate, this::mapMetric, "metrics");
	}

	// when the collector tells us it saved new points, we find them by notification ID
	// so the live page can show them
	public List<Metric> findByNotificationId(String notificationId) {
		if (notificationId == null || notificationId.isBlank()) {
			throw new IllegalArgumentException("notificationId must not be blank");
		}
		return ClickHouseQuery.from(SELECT)
				.eq("attributes['vigil.notification_id']", notificationId)
				.list(jdbcTemplate, this::mapMetric, "metrics");
	}

	private ClickHouseQuery filtered(String service, String period, Boolean internalOnly) {
		ClickHouseQuery query = ClickHouseQuery.from(SELECT)
				.eq("service", service)
				.since(period);

		if (internalOnly != null)
			query.where(internalFilter(internalOnly));

		return query;
	}

	// false also takes points that have no internal key
	private static String internalFilter(boolean internalOnly) {
		return internalOnly
				? "attributes['internal'] = 'true'"
				: "(attributes['internal'] = 'false' OR NOT mapContains(attributes, 'internal'))";
	}

	private Metric mapMetric(ResultSet result, int rowNum) throws SQLException {
		return new Metric(
				result.getString("service"),
				result.getTimestamp("timestamp").toInstant(),
				result.getString("name"),
				result.getObject("value", Double.class),
				ClickHouseQuery.attributes(result));
	}

	public List<MetricSeries> findSeries(
			String period, String service, Boolean internalOnly, int intervalSeconds) {

		if (period == null || period.isBlank())
			throw new IllegalArgumentException("period must be one of 1h, 24h, 7d, 30d");

		ClickHouseQuery filters = filtered(service, period, internalOnly)
				.where("metric_type IN ('gauge', 'sum')");
		String sql = SERIES_SQL.formatted(intervalSeconds, filters.whereClause());
		record SeriesKey(String name, String service) {}
		Map<SeriesKey, MetricSeries> series = new LinkedHashMap<>();

		try {
			jdbcTemplate.query(sql, rs -> {
				var key = new SeriesKey(rs.getString("name"), rs.getString("service"));
				MetricSeries chart = series.get(key);
				if (chart == null) {
					chart = new MetricSeries(key.name(), key.service(),
							rs.getString("series_unit"), rs.getString("series_kind"),
							rs.getBoolean("series_internal"), new ArrayList<>());
					series.put(key, chart);
				}

				// each SQL row gives us a point for this chart
				chart.points().add(new MetricPoint(
						rs.getTimestamp("bucket").toInstant(),
						rs.getObject("bucket_value", Double.class)));
			}, filters.params());
		} catch (DataAccessException e) {
			throw new TelemetryRepositoryException("Failed to query metric series from ClickHouse", e);
		}

		return new ArrayList<>(series.values());
	}
}
