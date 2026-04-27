
-- Return one row per appointment (not deduplicated) to support capacity > 1
CREATE OR REPLACE FUNCTION public_get_booked_slots(p_business_id uuid, p_date date)
RETURNS TABLE(slot_start timestamptz, status text)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT slot_start, status
  FROM appointments
  WHERE business_id = p_business_id
    AND slot_start >= (p_date::text || 'T00:00:00.000Z')::timestamptz
    AND slot_start <= (p_date::text || 'T23:59:59.999Z')::timestamptz
    AND status != 'cancelled';
$$;
;
