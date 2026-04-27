
-- 1. Tier efectivo (considera expiración de suscripción)
CREATE OR REPLACE FUNCTION get_effective_tier(p_business_id uuid)
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT CASE
    WHEN b.tier = 'free' THEN 'free'
    WHEN b.subscription_ends_at IS NOT NULL AND now() > b.subscription_ends_at THEN 'free'
    ELSE b.tier
  END
  FROM businesses b WHERE b.id = p_business_id;
$$;

-- 2. ¿Puede agregar suscriptor? (free=5, starter=50, pro=∞)
CREATE OR REPLACE FUNCTION can_add_subscriber(p_business_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT CASE get_effective_tier(p_business_id)
    WHEN 'pro'     THEN true
    WHEN 'starter' THEN (SELECT count(*) FROM subscribers WHERE business_id = p_business_id) < 50
    ELSE                 (SELECT count(*) FROM subscribers WHERE business_id = p_business_id) < 5
  END;
$$;

-- 3. ¿Puede agregar plan? (free=2, starter=3, pro=∞)
CREATE OR REPLACE FUNCTION can_add_plan(p_business_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT CASE get_effective_tier(p_business_id)
    WHEN 'pro'     THEN true
    WHEN 'starter' THEN (SELECT count(*) FROM plans WHERE business_id = p_business_id) < 3
    ELSE                 (SELECT count(*) FROM plans WHERE business_id = p_business_id) < 2
  END;
$$;

-- 4. Helper: verifica que los campos de tier no cambiaron en un UPDATE
-- Lee los valores actuales (pre-update) con SECURITY DEFINER
CREATE OR REPLACE FUNCTION _tier_fields_unchanged(
  p_id uuid, p_tier text,
  p_ends_at timestamptz, p_mp_sub_id text, p_mp_status text
)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    b.tier = p_tier AND
    b.subscription_ends_at IS NOT DISTINCT FROM p_ends_at AND
    b.mp_subscription_id IS NOT DISTINCT FROM p_mp_sub_id AND
    b.mp_status IS NOT DISTINCT FROM p_mp_status
  FROM businesses b WHERE b.id = p_id;
$$;

-- 5. RESTRICTIVE UPDATE policy en businesses
-- Bloquea cambios en campos de tier para usuarios autenticados.
-- service_role tiene BYPASSRLS → bypasea esta policy y puede actualizar tier via webhook.
CREATE POLICY "businesses_protect_tier_fields" ON businesses
  AS RESTRICTIVE
  FOR UPDATE
  WITH CHECK (
    _tier_fields_unchanged(id, tier, subscription_ends_at, mp_subscription_id, mp_status)
  );

-- 6. Límite de suscriptores por tier — RESTRICTIVE INSERT
CREATE POLICY "subscribers_insert_tier_limit" ON subscribers
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (can_add_subscriber(business_id));

-- 7. Límite de planes por tier — RESTRICTIVE INSERT
CREATE POLICY "plans_insert_tier_limit" ON plans
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (can_add_plan(business_id));
;
