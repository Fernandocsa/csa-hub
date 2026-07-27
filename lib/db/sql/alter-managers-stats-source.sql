-- Track whether manager aggregate stats were last calculated from matches or edited manually.
ALTER TABLE managers
  ADD COLUMN IF NOT EXISTS stats_source text;

ALTER TABLE managers DROP CONSTRAINT IF EXISTS managers_stats_source_check;
ALTER TABLE managers ADD CONSTRAINT managers_stats_source_check CHECK (
  stats_source IS NULL OR stats_source IN ('manual', 'calculated')
);

ALTER TABLE managers
  ADD COLUMN IF NOT EXISTS stats_recalculated_at timestamptz;
