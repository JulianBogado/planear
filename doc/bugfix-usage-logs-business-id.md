# Bugfix: historial de usos vacío por business_id nulo

**Fecha:** 2026-04-23

## Problema

El historial de usos aparecía vacío tanto en `/suscriptores/:id` (SubscriberDetail.jsx) como en la vista "Historial" de `/agenda` (useUsageLogs.js). Ambos hacen queries filtrando por `.eq('business_id', businessId)`, pero todos los registros en `usage_logs` tenían `business_id = null`.

## Causa raíz

En `useSubscribers.js`, la función `registerUse` insertaba en `usage_logs` solo con `subscriber_id`, omitiendo `business_id`:

```js
// Antes (bug):
const logData = { subscriber_id: subscriber.id }

// Después (fix):
const logData = { subscriber_id: subscriber.id, business_id: businessId }
```

## Migraciones aplicadas

Además, la migración `20260421_usage_logs_soft_delete_email.sql` (soft-delete en usage_logs + columna `email` en subscribers) existía en el repo pero nunca había sido aplicada a la DB. Esto causaba que la query `.is('deleted_at', null)` fallara silenciosamente. Se aplicó vía MCP.

## Backfill

Se corrieron los 9 registros existentes con `business_id = null`:

```sql
UPDATE usage_logs ul
SET business_id = s.business_id
FROM subscribers s
WHERE ul.subscriber_id = s.id
AND ul.business_id IS NULL;
```

## Archivos modificados

- `src/hooks/useSubscribers.js` — `registerUse`: agrega `business_id` al insert de usage_logs
