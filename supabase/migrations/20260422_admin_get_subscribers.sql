CREATE OR REPLACE FUNCTION admin_get_subscribers(p_business_id uuid)
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
    RETURN;
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

GRANT EXECUTE ON FUNCTION admin_get_subscribers(uuid) TO authenticated;
