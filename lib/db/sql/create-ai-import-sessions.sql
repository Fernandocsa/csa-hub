-- AI import sessions for season batch preview → commit flow
CREATE TABLE IF NOT EXISTS ai_import_sessions (
  id serial PRIMARY KEY,
  kind text NOT NULL DEFAULT 'season_matches',
  season_year integer,
  source_text text,
  preview jsonb NOT NULL,
  usage jsonb,
  status text NOT NULL DEFAULT 'preview',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS ai_import_sessions_expires_idx ON ai_import_sessions (expires_at);
CREATE INDEX IF NOT EXISTS ai_import_sessions_status_idx ON ai_import_sessions (status);
