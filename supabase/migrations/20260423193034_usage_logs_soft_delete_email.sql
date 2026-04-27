-- Email en suscriptores
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS email text DEFAULT NULL;

-- Soft-delete en usage_logs
ALTER TABLE usage_logs
  ADD COLUMN IF NOT EXISTS deleted_at  timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delete_reason text       DEFAULT NULL;

-- Índice parcial para historial de usos por negocio
CREATE INDEX IF NOT EXISTS idx_usage_logs_business_used_at
  ON usage_logs (business_id, used_at DESC)
  WHERE deleted_at IS NULL;

-- RPC atómica: soft-delete + restaurar uso al suscriptor en una transacción
CREATE OR REPLACE FUNCTION delete_usage_log_atomic(
  p_log_id        uuid,
  p_business_id   uuid,
  p_delete_reason text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscriber_id uuid;
  v_end_date      date;
  v_new_uses      int;
BEGIN
  -- Soft-delete, verifica pertenencia al negocio
  UPDATE usage_logs
  SET deleted_at    = now(),
      delete_reason = p_delete_reason
  WHERE id            = p_log_id
    AND business_id   = p_business_id
    AND deleted_at    IS NULL
  RETURNING subscriber_id INTO v_subscriber_id;

  IF v_subscriber_id IS NULL THEN
    RAISE EXCEPTION 'Log no encontrado o ya eliminado';
  END IF;

  -- Devuelve un uso al suscriptor
  UPDATE subscribers
  SET uses_remaining = uses_remaining + 1
  WHERE id = v_subscriber_id
  RETURNING uses_remaining, end_date INTO v_new_uses, v_end_date;

  -- Recalcula status (espeja computeStatus() del frontend)
  UPDATE subscribers
  SET status = CASE
    WHEN v_new_uses <= 0               THEN 'no_uses'
    WHEN v_end_date < CURRENT_DATE     THEN 'expired'
    WHEN v_end_date < CURRENT_DATE + 7 THEN 'expiring_soon'
    ELSE 'active'
  END
  WHERE id = v_subscriber_id;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_usage_log_atomic(uuid, uuid, text) TO authenticated;;
