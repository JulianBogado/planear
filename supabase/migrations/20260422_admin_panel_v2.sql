-- Admin Panel v2
-- 1. Policy permissive para que admin pueda hacer UPDATE en negocios ajenos
-- 2. RPC admin_list_businesses actualizada con más info
-- 3. RPC admin_update_user para editar perfil + nombre de negocio
-- 4. RPC admin_delete_user para borrar usuario completo

-- 1. Policy UPDATE permissiva para admin
CREATE POLICY businesses_admin_update ON businesses
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- 2. Actualizar admin_list_businesses con más campos
DROP FUNCTION IF EXISTS admin_list_businesses();

CREATE FUNCTION admin_list_businesses()
RETURNS TABLE (
  id                   uuid,
  name                 text,
  user_id              uuid,
  tier                 text,
  subscription_ends_at timestamptz,
  is_promo             boolean,
  email                text,
  owner_nombre         text,
  owner_apellido       text,
  owner_phone          text,
  business_phone       text,
  category             text,
  instagram            text,
  facebook             text,
  tiktok               text,
  subscriber_count     bigint,
  created_at           timestamptz
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
      u.email::text,
      p.nombre,
      p.apellido,
      p.telefono,
      b.phone,
      b.category,
      b.instagram,
      b.facebook,
      b.tiktok,
      COUNT(s.id),
      b.created_at
    FROM businesses b
    JOIN auth.users u ON u.id = b.user_id
    LEFT JOIN profiles p ON p.id = b.user_id
    LEFT JOIN subscribers s ON s.business_id = b.id
    GROUP BY b.id, u.email, p.nombre, p.apellido, p.telefono
    ORDER BY b.name;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_list_businesses() TO authenticated;

-- 3. RPC para editar perfil del dueño + nombre del negocio
CREATE OR REPLACE FUNCTION admin_update_user(
  p_user_id      uuid,
  p_nombre       text,
  p_apellido     text,
  p_telefono     text,
  p_business_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  UPDATE profiles
    SET nombre = p_nombre, apellido = p_apellido, telefono = p_telefono
    WHERE id = p_user_id;

  UPDATE businesses
    SET name = p_business_name
    WHERE user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_user(uuid, text, text, text, text) TO authenticated;

-- 4. Permiso para que la función SECURITY DEFINER pueda borrar auth users
GRANT DELETE ON auth.users TO postgres;

-- 5. RPC para eliminar usuario completo
CREATE OR REPLACE FUNCTION admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  SELECT id INTO v_business_id FROM businesses WHERE user_id = p_user_id;

  IF v_business_id IS NOT NULL THEN
    -- Borrar tablas con FK NO ACTION primero
    DELETE FROM usage_logs WHERE business_id = v_business_id;
    DELETE FROM payments   WHERE business_id = v_business_id;
    -- Borrar business (cascada: subscribers, plans, appointments, business_availability)
    DELETE FROM businesses WHERE id = v_business_id;
  END IF;

  DELETE FROM profiles WHERE id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_user(uuid) TO authenticated;
