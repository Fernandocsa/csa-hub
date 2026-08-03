CREATE TABLE IF NOT EXISTS admin_divergence_dismissals (
  kind text NOT NULL,
  entity_id integer NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, entity_id)
);

CREATE INDEX IF NOT EXISTS admin_divergence_dismissals_created_at_idx
  ON admin_divergence_dismissals (created_at DESC);
