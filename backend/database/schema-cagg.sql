-- TimescaleDB Continuous Aggregates for IoT Monitoring System
-- Materialized views and policies (cannot run inside transaction)

-- ============================================
-- Continuous Aggregate: Sensor Readings Hourly
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS sensor_readings_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    device_id,
    AVG(battery_voltage) AS avg_battery_voltage,
    AVG(battery_current) AS avg_battery_current,
    AVG(main_voltage) AS avg_main_voltage,
    AVG(main_current) AS avg_main_current,
    AVG(light_intensity) AS avg_light_intensity,
    COUNT(*) AS reading_count
FROM sensor_readings
GROUP BY bucket, device_id;

-- Refresh policy for continuous aggregate
SELECT add_continuous_aggregate_policy('sensor_readings_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE);