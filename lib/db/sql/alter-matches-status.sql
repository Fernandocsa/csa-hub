-- Match lifecycle: played (historical) vs scheduled (future fixtures).
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'played';

-- Existing rows stay 'played' via default.
CREATE INDEX IF NOT EXISTS matches_status_date_idx ON matches (status, match_date);

COMMENT ON COLUMN matches.status IS 'played | scheduled — scheduled excluded from historical stats';
