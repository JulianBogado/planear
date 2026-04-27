-- Hardening del panel admin: acceso explícitamente denegado para no-admin
-- y bloqueo de borrado de cuentas admin / auto-borrado.

CREATE OR REPLACE FUNCTION public.admin_list_businesses()
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
    RAISE EXCEPTION 'Acceso denegado';
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

CREATE OR REPLACE FUNCTION public.admin_get_subscribers(p_business_id uuid)
RETURNS TABLE (
  id             uuid,
  name           text,
  phone          text,
  plan_name      text,
  status         text,
  end_date       date,
  uses_remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  RETURN QUERY
    SELECT
      s.id,
      s.name,
      s.phone,
      p.name AS plan_name,
      s.status,
      s.end_date,
      s.uses_remaining
    FROM subscribers s
    LEFT JOIN plans p ON p.id = s.plan_id
    WHERE s.business_id = p_business_id
    ORDER BY s.name;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id uuid,
  p_nombre text,
  p_apellido text,
  p_telefono text,
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

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
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

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'No podés eliminar tu propia cuenta admin desde este panel';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'No se pueden eliminar cuentas admin desde este panel';
  END IF;

  SELECT id INTO v_business_id FROM businesses WHERE user_id = p_user_id;

  IF v_business_id IS NOT NULL THEN
    DELETE FROM usage_logs WHERE business_id = v_business_id;
    DELETE FROM payments   WHERE business_id = v_business_id;
    DELETE FROM businesses WHERE id = v_business_id;
  END IF;

  DELETE FROM profiles WHERE id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;
