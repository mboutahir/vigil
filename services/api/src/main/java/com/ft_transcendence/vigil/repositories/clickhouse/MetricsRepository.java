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

	// metric names seen in the last 7 days, for the alert rule form
	// histograms have no single value and rules skip them, so we leave them out like the rule evaluation does
	private static final String NAMES_SQL = """
			SELECT DISTINCT name
			FROM metrics
			WHERE timestamp >= now() - INTERVAL 7 DAY AND value IS NOT NULL
			ORDER BY name
			""";

	// one value per time slot: the average of the points in it, for every kind of metric
	private static final String SERIES_SQL = """
			SELECT service, name,
				toStartOfInterval(timestamp, toIntervalSecond(%1$d)) AS bucket,
				any(unit) AS series_unit,
				any(if(metric_type = 'sum' AND is_monotonic, 'counter', 'gauge')) AS series_kind,
				avg(value) AS bucket_value
			FROM metrics
			%2$s
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
			Instant before,
			int limit) {

		// for the next page we only get points older than the before time
		return filtered(service, period)
				.before(before)
				.orderBy("timestamp DESC")
				.limit(limit)
				.list(jdbcTemplate, this::mapMetric, "metrics");
	}

	// for CSV we get all the matching points, newest first
	public void streamAllMetrics(
			String service,
			String period,
			Consumer<Metric> consumer) {

		filtered(service, period)
				.orderBy("timestamp DESC")
				.stream(jdbcTemplate, this::mapMetric, consumer, "metrics");
	}

	// for alert analysis we read points between these times, oldest first
	public List<Metric> findMetrics(String service, Instant from, Instant to) {
		return filtered(service, null)
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

	// alert rules match on the metric name, so the form lists the names the services really send
	public List<String> findMetricNames() {
		try {
			return jdbcTemplate.queryForList(NAMES_SQL, String.class);
		} catch (DataAccessException e) {
			throw new TelemetryRepositoryException("Failed to query metric names from ClickHouse", e);
		}
	}

	private ClickHouseQuery filtered(String service, String period) {
		return ClickHouseQuery.from(SELECT)
				.eq("service", service)
				.since(period);
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
			String period, String service, int intervalSeconds) {

		if (period == null || period.isBlank())
			throw new IllegalArgumentException("period must be one of 1h, 24h, 7d, 30d");

		ClickHouseQuery filters = filtered(service, period)
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
							new ArrayList<>());
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
