# Downgrade programado de suscripcion

**Fecha:** 2026-04-24

## Objetivo

El downgrade ya no corta el acceso de inmediato. El usuario conserva el plan pago
hasta `subscription_ends_at` y el cambio efectivo se refleja al final del periodo.

## Comportamiento actual

| Caso | Comportamiento |
|------|----------------|
| Pro -> Starter | Se actualiza el `preapproval` existente, queda `pending_tier='starter'` y el cambio real ocurre cuando MP procesa el siguiente ciclo |
| Pro -> Free | Se cancela la suscripcion en MP, queda `pending_tier='free'` y el acceso se conserva hasta `subscription_ends_at` |
| Starter -> Free | Igual que arriba |
| Negocio sin `mp_subscription_id` | El cambio se aplica de inmediato |

## `cancel-subscription`

- Valida al usuario con `supabase.auth.getUser(token)`.
- Soporta `action: 'to_starter' | 'to_free'`.
- Mantiene la logica de `force` para eliminar exceso de datos cuando el tier destino no lo soporta.
- Si el cambio se programa con exito:
  - guarda `pending_tier`
  - devuelve `{ ok: true, scheduledFor }`
  - dispara un email transaccional confirmando la baja o el downgrade
- Si el envio del email falla:
  - la operacion no se revierte
  - queda logueado como error operativo

## `pending_tier`

- Es un hint de UI, no controla acceso real.
- El acceso real sigue dependiendo de:
  - `tier`
  - `subscription_ends_at`
  - `get_effective_tier`
- `mp-webhook` y `verify-subscription` limpian `pending_tier` cuando detectan que el nuevo estado ya quedo consolidado.

## UX actual

- En `Settings.jsx`:
  - se muestran botones de downgrade solo cuando corresponde
  - si existe `pending_tier`, se muestra banner de cambio programado
  - al confirmar la baja hay feedback inmediato antes del reload
- En `Dashboard.jsx`:
  - se muestra el toast persistido post-downgrade

## Nota

La branch original del rediseño fue `feature/scheduled-downgrade`, pero este documento
describe el estado consolidado actual de `feature/mp-sandbox-e2e`.
