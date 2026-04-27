
-- Fix mutable search_path on SECURITY DEFINER functions
-- Prevents schema injection attacks where a malicious user could shadow public objects

ALTER FUNCTION public.get_effective_tier(p_business_id uuid)
  SET search_path = public;

ALTER FUNCTION public.can_add_plan(p_business_id uuid)
  SET search_path = public;

ALTER FUNCTION public.can_add_subscriber(p_business_id uuid)
  SET search_path = public;

ALTER FUNCTION public._tier_fields_unchanged(
  p_id uuid,
  p_tier text,
  p_ends_at timestamp with time zone,
  p_mp_sub_id text,
  p_mp_status text
)
  SET search_path = public;
;
