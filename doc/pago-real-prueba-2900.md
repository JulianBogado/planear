# Pago real de prueba - Pro a $2.900

**Fecha:** 2026-04-24

## Contexto

Se dejo el plan `pro` temporalmente en `$2.900` para validar el flujo real de cobro,
webhook y reconciliacion sin hacer una prueba cara.

## Cambios temporales vigentes

- `src/constants/tiers.js`
  - `pro.price = 2900`
  - `pro.priceLabel = '$2.900/mes'`
- `supabase/functions/create-subscription/index.ts`
  - `pro.amount = 2900`

## Objetivo de esta prueba

Validar con dinero real que:

- el `preapproval` se crea correctamente
- el checkout abre con el usuario autenticado real
- `businesses` termina con:
  - `mp_subscription_id`
  - `mp_status`
  - `tier`
  - `subscription_ends_at`

## Nota importante

Este precio no debe considerarse definitivo. Antes de mergear a produccion hay que decidir
si `pro` vuelve a su valor comercial real y actualizar:

- `src/constants/tiers.js`
- `supabase/functions/create-subscription/index.ts`
- cualquier documentacion que exponga precios
