-- TimescaleDB Core Schema for IoT Monitoring System
-- Tables, indexes, hypertables (transaction-safe)

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ============================================
-- Sensor Readings Table (Time-Series Data)
-- ============================================
CREATE TABLE IF NOT EXISTS sensor_readings (
    time TIMESTAMPTZ NOT NULL,
    device_id VARCHAR(50) NOT NULL,
    battery_voltage NUMERIC(10, 3),
    battery_current NUMERIC(10, 3),
    battery_power NUMERIC(10, 3),
    main_voltage NUMERIC(10, 3),
    main_current NUMERIC(10, 3),
    main_power NUMERIC(10, 3),
    light_intensity NUMERIC(5, 1),
    led_status VARCHAR(10),
    led2_status VARCHAR(10),
    led4_status VARCHAR(10),
    emergency_light_status VARCHAR(10),
    power_cut_status VARCHAR(20) DEFAULT 'NORMAL'
);

-- Create hypertable for sensor_readings
SELECT create_hypertable('sensor_readings', 'time', if_not_exists => TRUE);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_id ON sensor_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_time_device ON sensor_readings(time DESC, device_id);

-- ============================================
-- Power Cut Events Table
-- ============================================
CREATE TABLE IF NOT EXISTS power_cut_events (
    id BIGSERIAL,
    device_id VARCHAR(50) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_ms BIGINT NOT NULL,
    start_voltage NUMERIC(10, 3),
    end_voltage NUMERIC(10, 3),
    voltage_drop NUMERIC(10, 3),
    energy_consumed_mwh NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, start_time)
);

-- Create hypertable
SELECT create_hypertable('power_cut_events', 'start_time', if_not_exists => TRUE);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_power_cut_events_device_id ON power_cut_events(device_id);
CREATE INDEX IF NOT EXISTS idx_power_cut_events_start_time ON power_cut_events(start_time DESC);

-- ============================================
-- Command Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS command_logs (
    id BIGSERIAL,
    device_id VARCHAR(50) NOT NULL,
    time TIMESTAMPTZ NOT NULL,
    command_type VARCHAR(50),
    command_value VARCHAR(255),
    topic VARCHAR(255),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, time)
);

-- Create hypertable
SELECT create_hypertable('command_logs', 'time', if_not_exists => TRUE);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_command_logs_device_id ON command_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_command_logs_time ON command_logs(time DESC);
CREATE INDEX IF NOT EXISTS idx_command_logs_command_type ON command_logs(command_type);