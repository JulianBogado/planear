
-- Remove unique constraint to allow multiple blocks per business
ALTER TABLE business_availability DROP CONSTRAINT IF EXISTS business_availability_business_id_key;

-- Add new columns
ALTER TABLE business_availability ADD COLUMN IF NOT EXISTS block_name text;
ALTER TABLE business_availability ADD COLUMN IF NOT EXISTS slot_capacity int NOT NULL DEFAULT 1;

-- Index for fast lookups by business_id
CREATE INDEX IF NOT EXISTS business_availability_business_id_idx
  ON business_availability(business_id);
;
