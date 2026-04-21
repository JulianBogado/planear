# Bugfix: eliminación de cliente y cancelación de turnos confirmados

**Fecha:** 2026-04-21
**Branch:** feature/suscriptores-agenda-improvements

---

## Bug 1 — Al eliminar un cliente, sus turnos seguían activos en la agenda

### Causa
La FK `appointments.subscriber_id` tiene `ON DELETE SET NULL`: al borrar el cliente, los turnos pendientes quedaban con `subscriber_id = null` y `status = 'pending'`, apareciendo en la agenda como turnos huérfanos sin nombre.

### Fix
En `SubscriberDetail.jsx → handleDelete`, antes de llamar a `deleteSubscriber`, se cancelan todos los turnos pendientes futuros del cliente con motivo "Cliente eliminado".

Los turnos confirmados del pasado quedan como registro histórico (con `subscriber_id = null`).

**Archivo modificado:** `src/pages/SubscriberDetail.jsx`

---

## Bug 2 — Los turnos confirmados no se podían cancelar

### Causa
`AppointmentCard` en `Agenda.jsx` solo mostraba los botones de acción (confirmar/cancelar) cuando `isPending`. Los turnos `confirmed` no tenían ningún control visible.

### Fix
El botón cancelar (✕) ahora aparece también en turnos `confirmed`. Al cancelar un turno confirmado:
- **Sin suscriptor vinculado:** solo cambia el status a `cancelled`.
- **Con suscriptor y `use_logged = true`:** cancela el turno + busca el `usage_log` asociado por `appointment_id` y lo soft-deletea via `delete_usage_log_atomic`, devolviendo el uso al cliente.

**Archivos modificados:** `src/pages/Agenda.jsx`, `src/hooks/useAppointments.js`

---

## Mejora de infraestructura — vínculo appointment ↔ usage_log

Para poder encontrar el `usage_log` correcto al cancelar un turno confirmado con suscriptor, se agregó la columna `appointment_id` a `usage_logs`.

- `confirmAppointment` ahora guarda el `appointment_id` al crear el usage_log.
- `cancelAppointment` acepta el objeto `appt` como tercer parámetro y, si corresponde, ejecuta la restauración atómica.

**Migración:** `supabase/migrations/20260421_usage_logs_appointment_id.sql`
