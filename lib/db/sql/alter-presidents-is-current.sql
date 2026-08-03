-- Distinguish ongoing mandate (term_end null + is_current) from unknown end date.
ALTER TABLE presidents
  ADD COLUMN IF NOT EXISTS is_current boolean NOT NULL DEFAULT false;

-- Current open mandate(s): null end starting in late 2025 (Robson Rodas and similar).
UPDATE presidents
SET is_current = true
WHERE term_end IS NULL
  AND term_start IS NOT NULL
  AND term_start >= DATE '2025-12-01';
