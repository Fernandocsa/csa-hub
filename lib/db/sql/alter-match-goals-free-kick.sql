-- Free-kick goal flag on match sheet events
ALTER TABLE match_goals
  ADD COLUMN IF NOT EXISTS is_free_kick boolean NOT NULL DEFAULT false;
