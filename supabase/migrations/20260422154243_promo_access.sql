-- Acceso pro promocional
-- Agrega is_promo a businesses, extiende la policy de tier y crea la RPC para admin

-- 1. Columna is_promo
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS is_promo boolean NOT NULL DEFAULT false;

-- 2. Extender la policy RESTRICTIVE para incluir is_promo
-- Necesitamos reemplazar la policy existente para agregar is_promo al chequeo
DROP POLICY IF EXISTS businesses_protect_tier_fields ON businesses;
DROP FUNCTION IF EXISTS admin_list_businesses();

CREATE POLICY businesses_protect_tier_fields ON businesses
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    is_admin()
    OR _tier_fields_unchanged(id, tier, subscription_ends_at, mp_subscription_id, mp_status)
       AND (is_promo = (SELECT b.is_promo FROM businesses b WHERE b.id = businesses.id))
  );

-- 3. RPC para listar todos los businesses (solo accesible para admins)
CREATE OR REPLACE FUNCTION admin_list_businesses()
RETURNS TABLE (
  id          uuid,
  name        text,
  user_id     uuid,
  tier        text,
  subscription_ends_at timestamptz,
  is_promo    boolean,
  email       text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      b.id,
      b.name,
      b.user_id,
      b.tier,
      b.subscription_ends_at,
      b.is_promo,
      u.email::text
    FROM businesses b
    JOIN auth.users u ON u.id = b.user_id
    ORDER BY b.name;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_list_businesses() TO authenticated;;
