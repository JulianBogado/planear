# Reconciliacion de suscripcion

**Fecha:** 2026-04-24

## Objetivo

Agregar un fallback confiable cuando Mercado Pago cobra correctamente pero el webhook
no llega a impactar `businesses` a tiempo.

## Que se implemento

- Nueva edge function `verify-subscription`.
- La funcion:
  - valida el usuario autenticado
  - busca el negocio del usuario
  - intenta consultar primero la suscripcion guardada en `businesses.mp_subscription_id`
  - tambien busca la suscripcion mas reciente en Mercado Pago para ese usuario
  - elige la mejor candidata:
    - prioriza `authorized`
    - prioriza una suscripcion vigente sobre una `cancelled`
    - prioriza la mas nueva si hay competencia entre varias
  - si la suscripcion vigente esta `authorized`, actualiza:
    - `tier`
    - `mp_status`
    - `mp_subscription_id`
    - `subscription_ends_at`
    - `pending_tier = null`

## Donde se usa

- `Pricing.jsx`
  - al volver del checkout
  - con mensaje de `Estamos verificando tu pago...`
- `AppLayout.jsx`
  - para que la verificacion tambien exista al volver a cualquier vista protegida
- `Dashboard.jsx`
  - como refuerzo visual y de sincronizacion
- `Settings.jsx`
  - para refrescar el negocio cuando el tier cambia desde MP

## Resultado esperado

- Si el webhook falla o tarda, cuando el usuario vuelve a la app el negocio se sincroniza solo.
- Si habia una suscripcion vieja cancelada y una nueva activa, la reconciliacion debe quedarse con la nueva.
- El usuario no deberia quedar cobrado y en `free` o `starter` por un webhook viejo.
