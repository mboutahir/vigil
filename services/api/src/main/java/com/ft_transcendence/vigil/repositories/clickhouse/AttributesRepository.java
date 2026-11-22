package com.ft_transcendence.vigil.repositories.clickhouse;

import com.ft_transcendence.vigil.exceptions.TelemetryRepositoryException;
import com.ft_transcendence.vigil.domain.dtos.telemetry.AttributeResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Array;
import java.util.ArrayList;
import java.util.List;

// we get the attribute keys and values seen in logs, metrics, and traces in the last 7 days
@Repository
public class AttributesRepository {

    // put the three tables together, then get each key and its values
    private static final String SELECT = """
            WITH all_attributes AS (
                SELECT timestamp, attributes FROM logs
                UNION ALL
                SELECT timestamp, attributes FROM metrics
                UNION ALL
                SELECT timestamp, attributes FROM traces
            )
            SELECT key, groupUniqArray(attributes[key]) AS values
            FROM all_attributes
            ARRAY JOIN mapKeys(attributes) AS key
            WHERE timestamp >= now() - INTERVAL 7 DAY
            GROUP BY key
            ORDER BY key
            """;

    private final JdbcTemplate jdbcTemplate;

    public AttributesRepository(@Qualifier("clickHouseJdbcTemplate") JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<AttributeResponse> findAttributes() {
        try {
            return jdbcTemplate.query(SELECT, (result, rowNum) -> {
                Array sqlArray = result.getArray("values");
                List<String> values = new ArrayList<>();

                if (sqlArray != null)
                    for (Object value : (Object[]) sqlArray.getArray())
                        values.add(String.valueOf(value));

                return new AttributeResponse(result.getString("key"), values);
            });
        } catch (DataAccessException e) {
            throw new TelemetryRepositoryException("Failed to query attributes from ClickHouse", e);
        }
    }
}
