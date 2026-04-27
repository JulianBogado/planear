
-- Revoca columnas sensibles de businesses para el rol anon (usuarios no autenticados)
-- La policy "Public reads businesses" sigue activa para los campos públicos necesarios
-- en la página de reserva pública (/reservar/:slug).
-- Los usuarios autenticados conservan acceso a sus propios datos via own_business policy.
REVOKE SELECT (
  user_id,
  tier,
  mp_subscription_id,
  mp_status,
  subscription_ends_at,
  is_promo
) ON businesses FROM anon;
;
