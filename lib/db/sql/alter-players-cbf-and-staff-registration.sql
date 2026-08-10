-- Player CBF registration (disambiguation).
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS cbf_registration text;

CREATE UNIQUE INDEX IF NOT EXISTS players_cbf_registration_uidx
  ON players (cbf_registration)
  WHERE cbf_registration IS NOT NULL AND btrim(cbf_registration) <> '';

-- Staff role + professional registration on managers (comissao tecnica).
-- staff_role: manager | assistant | fitness | doctor | masseur
ALTER TABLE managers
  ADD COLUMN IF NOT EXISTS staff_role text NOT NULL DEFAULT 'manager';

ALTER TABLE managers
  ADD COLUMN IF NOT EXISTS registration_type text;

ALTER TABLE managers
  ADD COLUMN IF NOT EXISTS registration_number text;

CREATE INDEX IF NOT EXISTS managers_staff_role_idx ON managers (staff_role);
