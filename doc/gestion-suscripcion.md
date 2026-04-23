# Gestión de suscripción y eliminación de cuenta

**Fecha:** 2026-04-23  
**Branch:** feature/gestion-suscripcion

## ¿Qué se implementó?

Se agregaron tres acciones en la página de Configuración (`/configuracion`):

1. **Bajar al plan Starter** (solo usuarios Pro): cancela la suscripción Pro en MercadoPago y redirige al usuario a pagar el plan Starter.
2. **Darse de baja / pasar a Free** (usuarios Pro o Starter): cancela la suscripción en MercadoPago y setea el tier a `free` de inmediato.
3. **Solicitar eliminación de cuenta**: envía un email a hola@plane.ar con los datos pre-llenados (email, negocio, plan, motivo opcional) usando la edge function `contact-form` existente.

## Archivos modificados/creados

- `supabase/functions/cancel-subscription/index.ts` — nueva edge function
- `supabase/config.toml` — entrada `[functions.cancel-subscription] verify_jwt = false`
- `src/pages/Settings.jsx` — botones, modales, funciones y conteos de datos

## Lógica de downgrade con datos excedidos

Al bajar de tier, el sistema verifica si el negocio tiene más clientes o planes de los que permite el nuevo tier:

| Plan destino | Límite clientes | Límite planes |
|---|---|---|
| Starter | 15 | 3 |
| Free | 5 | 2 |

Si hay exceso, el modal muestra cuántos deben eliminarse y ofrece dos opciones:
- **Manual**: links a `/suscriptores` y `/servicios` para que el usuario elimine lo que quiera
- **Automático** (`force: true`): la edge function elimina los datos sobrantes de forma automática (suscriptores: newest-first con cascade; planes: primero los sin suscriptores, luego newest-first desvinculando suscriptores)

Esta validación ocurre en dos capas:
1. **Frontend**: lee los conteos desde Supabase al montar Settings (via RLS — solo ve sus propios datos)
2. **Backend**: la edge function vuelve a contar y rechaza con 422 si hay exceso y `force: false`

## Edge function: cancel-subscription

**POST body:**
```json
{ "action": "to_free" | "to_starter", "force": false | true }
```

**Respuestas:**
- `{ ok: true }` — acción `to_free` exitosa
- `{ init_point: "https://..." }` — acción `to_starter` exitosa (URL de pago MP)
- `{ error: "over_limit", subscriberCount, planCount, subLimit, planLimit }` — exceso de datos (force: false)
- `{ error: "..." }` — otros errores

**Variables de entorno necesarias** (ya configuradas): `MP_ACCESS_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Casos especiales

- `is_promo = true`: los botones de downgrade no se muestran; la edge function rechaza con 403
- `mp_subscription_id = null` (tier asignado manualmente por admin): la edge function saltea el paso de MP y solo actualiza la DB
- Downgrades desde Pricing.jsx: el flujo existente en `/precios` no se modificó
