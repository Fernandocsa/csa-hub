-- Link manager career to the same person as a CSA player (ex-jogador → treinador).
ALTER TABLE managers
  ADD COLUMN IF NOT EXISTS player_id integer REFERENCES players(id);

CREATE UNIQUE INDEX IF NOT EXISTS managers_player_id_uidx
  ON managers (player_id)
  WHERE player_id IS NOT NULL;
