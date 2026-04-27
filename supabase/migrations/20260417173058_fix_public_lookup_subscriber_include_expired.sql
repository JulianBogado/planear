
CREATE OR REPLACE FUNCTION public.public_lookup_subscriber(p_business_id uuid, p_dni text)
RETURNS TABLE(id uuid, name text, uses_remaining integer, status text, end_date date)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, name, uses_remaining, status, end_date
  FROM subscribers
  WHERE business_id = p_business_id
    AND dni = p_dni
  LIMIT 1;
$$;
;
