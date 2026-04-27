
-- 1. Add pending_tier column
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS pending_tier text DEFAULT NULL;

-- 2. Update _tier_fields_unchanged to also protect pending_tier
CREATE OR REPLACE FUNCTION public._tier_fields_unchanged(
  p_id uuid,
  p_tier text,
  p_ends_at timestamptz,
  p_mp_sub_id text,
  p_mp_status text,
  p_pending_tier text
) RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    b.tier                 = p_tier AND
    b.subscription_ends_at IS NOT DISTINCT FROM p_ends_at AND
    b.mp_subscription_id   IS NOT DISTINCT FROM p_mp_sub_id AND
    b.mp_status            IS NOT DISTINCT FROM p_mp_status AND
    b.pending_tier         IS NOT DISTINCT FROM p_pending_tier
  FROM businesses b WHERE b.id = p_id;
$$;

-- 3. Recreate RLS policy passing pending_tier as 6th arg
DROP POLICY IF EXISTS businesses_protect_tier_fields ON businesses;

CREATE POLICY businesses_protect_tier_fields ON businesses
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (
    is_admin()
    OR (
      _tier_fields_unchanged(id, tier, subscription_ends_at, mp_subscription_id, mp_status, pending_tier)
      AND (is_promo = (SELECT b.is_promo FROM businesses b WHERE b.id = businesses.id))
    )
  );
;
