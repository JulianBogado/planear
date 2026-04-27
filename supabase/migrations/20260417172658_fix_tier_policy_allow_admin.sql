
DROP POLICY IF EXISTS "businesses_protect_tier_fields" ON businesses;

CREATE POLICY "businesses_protect_tier_fields" ON businesses
  AS RESTRICTIVE
  FOR UPDATE
  WITH CHECK (
    is_admin()
    OR _tier_fields_unchanged(id, tier, subscription_ends_at, mp_subscription_id, mp_status)
  );
;
