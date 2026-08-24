CREATE TABLE IF NOT EXISTS otp_requests (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at INTEGER NOT NULL,
  ip TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_usage (
  email TEXT NOT NULL,
  day TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (email, day)
);

CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_rate_window_start ON rate_limits(window_start);

CREATE TABLE IF NOT EXISTS anonymous_users (
  anon_id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS usage_events (
  request_id TEXT PRIMARY KEY,
  anon_id TEXT NOT NULL,
  day TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  started_at INTEGER,
  completed_at INTEGER,
  status TEXT NOT NULL,
  model TEXT NOT NULL,
  reasoning_effort TEXT NOT NULL,
  reading_mode TEXT NOT NULL,
  visual_detail TEXT NOT NULL DEFAULT 'low',
  response_id TEXT,
  vector_store_id TEXT,
  file_ids_json TEXT NOT NULL DEFAULT '[]',
  input_tokens_estimated INTEGER NOT NULL DEFAULT 0,
  input_tokens_actual INTEGER NOT NULL DEFAULT 0,
  cached_input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens_actual INTEGER NOT NULL DEFAULT 0,
  reasoning_tokens_actual INTEGER NOT NULL DEFAULT 0,
  estimated_cost_microusd INTEGER NOT NULL DEFAULT 0,
  reserved_cost_microusd INTEGER NOT NULL DEFAULT 0,
  actual_cost_microusd INTEGER NOT NULL DEFAULT 0,
  estimated_points INTEGER NOT NULL DEFAULT 1,
  actual_points INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  file_count INTEGER NOT NULL DEFAULT 0,
  total_file_bytes INTEGER NOT NULL DEFAULT 0,
  prediction_error_microusd INTEGER,
  prediction_error_ratio REAL,
  cost_band TEXT NOT NULL DEFAULT 'normal',
  error_code TEXT,
  FOREIGN KEY (anon_id) REFERENCES anonymous_users(anon_id)
);

CREATE TABLE IF NOT EXISTS usage_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  extension TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  page_count INTEGER,
  input_tokens_estimated INTEGER,
  FOREIGN KEY (request_id) REFERENCES usage_events(request_id)
);

CREATE TABLE IF NOT EXISTS daily_user_usage (
  anon_id TEXT NOT NULL,
  day TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  points_used INTEGER NOT NULL DEFAULT 0,
  actual_cost_microusd INTEGER NOT NULL DEFAULT 0,
  normal_count INTEGER NOT NULL DEFAULT 0,
  elevated_count INTEGER NOT NULL DEFAULT 0,
  heavy_count INTEGER NOT NULL DEFAULT 0,
  extreme_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (anon_id, day)
);

CREATE TABLE IF NOT EXISTS daily_system_usage (
  day TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  timeout_count INTEGER NOT NULL DEFAULT 0,
  reserved_cost_microusd INTEGER NOT NULL DEFAULT 0,
  actual_cost_microusd INTEGER NOT NULL DEFAULT 0,
  points_used INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  reasoning_tokens INTEGER NOT NULL DEFAULT 0,
  normal_count INTEGER NOT NULL DEFAULT 0,
  elevated_count INTEGER NOT NULL DEFAULT 0,
  heavy_count INTEGER NOT NULL DEFAULT 0,
  extreme_count INTEGER NOT NULL DEFAULT 0,
  max_request_cost_microusd INTEGER NOT NULL DEFAULT 0,
  total_latency_ms INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS runtime_config (
  config_key TEXT PRIMARY KEY,
  config_value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_events_anon_day ON usage_events(anon_id, day, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_day_status ON usage_events(day, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_response ON usage_events(response_id);
CREATE INDEX IF NOT EXISTS idx_usage_files_request ON usage_files(request_id);
