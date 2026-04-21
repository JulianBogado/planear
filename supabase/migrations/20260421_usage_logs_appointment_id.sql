ALTER TABLE usage_logs
  ADD COLUMN IF NOT EXISTS appointment_id uuid
  REFERENCES appointments(id) ON DELETE SET NULL;
