-- Help public "Por Estado" aggregations on birth_state.
CREATE INDEX IF NOT EXISTS players_birth_state_idx ON players (birth_state);
