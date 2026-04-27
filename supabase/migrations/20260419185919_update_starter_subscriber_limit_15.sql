CREATE OR REPLACE FUNCTION public.can_add_subscriber(p_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT CASE get_effective_tier(p_business_id)
    WHEN 'pro'     THEN true
    WHEN 'starter' THEN (SELECT count(*) FROM subscribers WHERE business_id = p_business_id) < 15
    ELSE                 (SELECT count(*) FROM subscribers WHERE business_id = p_business_id) < 5
  END;
$$;;
