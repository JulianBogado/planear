
CREATE OR REPLACE FUNCTION public.public_book_appointment(
  p_business_id uuid,
  p_subscriber_id uuid,
  p_slot_start timestamp with time zone,
  p_slot_end timestamp with time zone,
  p_client_name text,
  p_client_dni text,
  p_notes text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_agenda_enabled boolean;
  v_id uuid;
  v_capacity int;
  v_booked_count int;
BEGIN
  SELECT agenda_enabled INTO v_agenda_enabled
  FROM businesses WHERE id = p_business_id;
  IF NOT FOUND OR v_agenda_enabled = false THEN
    RAISE EXCEPTION 'Negocio no encontrado o agenda deshabilitada';
  END IF;

  -- Get the minimum slot_capacity among blocks that cover this day of week
  SELECT COALESCE(MIN(slot_capacity), 1)
  INTO v_capacity
  FROM business_availability
  WHERE business_id = p_business_id
    AND (EXTRACT(DOW FROM p_slot_start AT TIME ZONE 'UTC'))::int = ANY(days_of_week);

  -- If no availability configured, fall back to 1
  IF v_capacity IS NULL THEN
    v_capacity := 1;
  END IF;

  -- Count existing non-cancelled bookings for this exact slot
  SELECT COUNT(*) INTO v_booked_count
  FROM appointments
  WHERE business_id = p_business_id
    AND slot_start = p_slot_start
    AND status != 'cancelled';

  IF v_booked_count >= v_capacity THEN
    RAISE EXCEPTION 'slot_full';
  END IF;

  INSERT INTO appointments (
    business_id, subscriber_id, slot_start, slot_end,
    client_name, client_dni, notes, status, use_logged
  ) VALUES (
    p_business_id, p_subscriber_id, p_slot_start, p_slot_end,
    p_client_name, p_client_dni, p_notes, 'pending', false
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
;
