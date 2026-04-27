
-- Drop the unused date-typed overload (client passes text, calls the text version)
DROP FUNCTION IF EXISTS public.public_get_booked_slots(uuid, date);

-- Update the text version to also filter cancelled (same result, cleaner)
CREATE OR REPLACE FUNCTION public.public_get_booked_slots(p_business_id uuid, p_date text)
RETURNS TABLE(slot_start timestamp with time zone, slot_end timestamp with time zone, status text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT slot_start, slot_end, status
  FROM appointments
  WHERE business_id = p_business_id
    AND slot_start >= (p_date || 'T00:00:00.000Z')::timestamptz
    AND slot_start <= (p_date || 'T23:59:59.999Z')::timestamptz
    AND status != 'cancelled';
$$;
;
