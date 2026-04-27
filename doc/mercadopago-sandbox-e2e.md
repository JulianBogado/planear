# Mercado Pago sandbox E2E

**Fecha:** 2026-04-24

## Para que sirve este documento

Este archivo queda como referencia de pruebas y troubleshooting de sandbox.
No describe el flujo canonico de produccion. El flujo vigente de cobro real y reconciliacion
esta documentado en `CLAUDE.md`, `doc/reconciliacion-suscripcion.md` y `doc/scheduled-downgrade.md`.

## Estado real de la integracion

- `create-subscription` crea el `preapproval` con:
  - `external_reference: ${tier}:${userId}`
  - `notification_url` al `mp-webhook`
  - `back_url` resuelto desde `APP_SITE_URL`
- `mp-webhook` procesa `subscription_preapproval` y `subscription_authorized_payment`.
- `verify-subscription` queda como fallback oficial cuando el webhook tarda o no impacta.
- `cancel-subscription` conserva el downgrade programado con `pending_tier`.

## Lo que se aprendio del sandbox

- El sandbox de Mercado Pago para suscripciones no fue la via mas confiable para validar este flujo.
- Hubo diferencias entre:
  - cuentas test
  - credenciales `TEST-...`
  - credenciales `APP_USR-...` de cuentas de prueba
  - comportamiento de `preapproval`
- El experimento de forzar `status: 'authorized'` al crear el `preapproval` fue descartado porque rompio la creacion con `400 Invalid request data`.
- El override de `MP_TEST_PAYER_EMAIL` no forma parte del flujo final actual y no debe tomarse como configuracion canonica.

## Checklist minimo si se vuelve a probar sandbox

1. Confirmar que el negocio de prueba no tenga `is_promo = true`.
2. Confirmar que el webhook apunte a `https://<project-ref>.supabase.co/functions/v1/mp-webhook`.
3. Confirmar que `MP_WEBHOOK_SECRET` este vacio o sincronizado exactamente con la configuracion de sandbox.
4. Confirmar que el usuario autenticado en la app coincide con el negocio que se quiere upgrade-ar.
5. Verificar en `businesses`:
   - `mp_subscription_id`
   - `mp_status`
   - `tier`
   - `subscription_ends_at`
   - `pending_tier`

## Troubleshooting util

- Si el cobro se registra pero el negocio no cambia de plan enseguida, revisar primero:
  - si `mp_subscription_id` quedo persistido
  - si el webhook entro
  - si `verify-subscription` encuentra una suscripcion mas nueva que la guardada
- Si hay una suscripcion vieja cancelada y una nueva activa, la reconciliacion debe elegir la mejor:
  - priorizar `authorized`
  - priorizar la mas nueva
- Si el webhook no impacta, la app puede recuperar el estado cuando el usuario vuelve a entrar.
