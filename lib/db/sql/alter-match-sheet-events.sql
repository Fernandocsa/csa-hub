-- Match sheet events redesign (admin CSA Eventos tab)
ALTER TABLE match_goals
  ADD COLUMN IF NOT EXISTS is_penalty boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_own_goal boolean NOT NULL DEFAULT false,
  -- 'for' = GPF / g.c. a favor do CSA; 'against' = GPD sofrido
  ADD COLUMN IF NOT EXISTS own_goal_direction text;

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS captain_player_id integer REFERENCES players(id);

CREATE TABLE IF NOT EXISTS match_manager_cards (
  id serial PRIMARY KEY,
  match_id integer NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  card_type text NOT NULL,
  minute integer NOT NULL,
  injury_time_minute integer
);

CREATE INDEX IF NOT EXISTS match_manager_cards_match_id_idx
  ON match_manager_cards (match_id);
