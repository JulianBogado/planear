# Pago real de prueba - Pro a $2.900

**Fecha:** 2026-04-24

## Contexto historico

Este archivo queda solo como registro de la prueba real que se hizo con `pro` temporalmente
en `$2.900` para validar cobro, webhook y reconciliacion sin hacer una prueba cara.

## Que se hizo

- Se bajo temporalmente `pro` a `$2.900` en:
  - `src/constants/tiers.js`
  - `supabase/functions/create-subscription/index.ts`
- Se confirmo que el flujo real de:
  - checkout
  - webhook
  - reconciliacion
  funcionaba correctamente.

## Estado actual

El precio de `pro` ya fue restaurado a su valor normal:

- `pro.price = 22900`
- `pro.priceLabel = '$22.900/mes'`
- `pro.amount = 22900`

Este documento no describe el estado vigente del pricing; solo deja trazabilidad de la prueba.
