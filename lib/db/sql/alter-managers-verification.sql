-- Manager verification fields (parity with players).
ALTER TABLE managers ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified';
ALTER TABLE managers ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE managers ADD COLUMN IF NOT EXISTS verified_by text;
