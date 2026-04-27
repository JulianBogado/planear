
-- Estrategia correcta: revocar el SELECT a nivel tabla y regrantear solo columnas públicas
REVOKE SELECT ON businesses FROM anon;

GRANT SELECT (
  id,
  name,
  category,
  slug,
  theme,
  phone,
  address,
  instagram,
  facebook,
  tiktok,
  agenda_enabled,
  allow_guest_bookings,
  created_at
) ON businesses TO anon;
;
