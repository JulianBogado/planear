# Mejoras de Agenda — Multi-bloque y Capacidad por turno

**Fecha:** 2026-04-18

## Qué se implementó

Extensión del sistema de agenda para soportar tres escenarios reales que el modelo anterior no cubría:

1. **Descanso al mediodía** — configurar múltiples franjas horarias (ej. 9-13 y 15-19) por día.
2. **Bloques sueltos** — vivero/vinoteca con franjas amplias (ej. slot_duration=240 min = "Mañana").
3. **Capacidad > 1** — box/trainer grupal donde múltiples personas pueden reservar el mismo slot.

---

## Cambios aplicados

### DB — Migraciones

**`agenda_multiblock_capacity`**
- Se eliminó la restricción `UNIQUE` en `business_availability.business_id`, permitiendo N filas por negocio.
- Se agregaron columnas:
  - `block_name text` — nombre opcional de la franja ("Mañana", "Tarde", etc.)
  - `slot_capacity int NOT NULL DEFAULT 1` — cuántas reservas simultáneas admite el slot.
- Se creó índice `business_availability_business_id_idx` para lecturas rápidas.

**`fix_public_get_booked_slots_capacity`**
- Se reemplazó `public_get_booked_slots` para devolver una fila por reserva (no deduplicada), necesario para el conteo correcto de capacidad.

### `src/hooks/useAppointments.js` — `getAvailableSlots()`

Firma anterior: `getAvailableSlots(availability, dateStr, existingAppointments)` (objeto único)

Firma nueva: `getAvailableSlots(availabilityBlocks, dateStr, existingAppointments)` (array o objeto — retrocompatible)

- Itera sobre cada bloque del array.
- Cuenta reservas por slot con `bookedCount` y compara contra `block.slot_capacity`.
- Ordena los slots resultantes por hora de inicio.
- Sigue funcionando si se pasa un objeto único (lo envuelve en array).

### `src/hooks/useAvailability.js`

- `fetchAvailability`: cambia de `.maybeSingle()` a `.select('*').order('id')` → devuelve array.
- Estado inicial: `[]` en lugar de `null`.
- `saveAvailability(blocks)`: recibe array de bloques → DELETE+INSERT (reemplaza todos los bloques del negocio).

### `src/hooks/useAppointments.js` — `usePublicAvailability`

- `setAvailability(avail ?? [])` en lugar de `setAvailability(avail)`.
- Estado inicial: `[]`.

### `src/pages/Settings.jsx`

- Nuevas constantes: `SLOT_OPTIONS = [20, 40, 60, 120, 240]` y `CAPACITY_OPTIONS = [1, 2, 3, 5, 10]`.
- Estado: reemplaza `agendaDays/agendaStart/agendaEnd/agendaSlot` por `agendaBlocks` (array de objetos).
- UI: formulario de franjas horarias dinámico con botones para agregar/eliminar bloques.
- Cada bloque configura: nombre opcional, días, horario desde/hasta, duración, capacidad.

### `src/pages/Agenda.jsx`

- `modalSlots`: usa `availability?.length` en lugar de `availability`.
- `handleCreate`: `slotEnd` se deriva de `newForm.slot_end` (guardado al seleccionar un slot) o fallback a `availability?.[0]?.slot_duration`.
- Los botones de slot ahora guardan tanto `slot_start` como `slot_end` en `newForm`.
- Fallback de tiempo manual: usa `availability?.length > 0`.

### `src/pages/PublicBooking.jsx`

- `advance`: usa `availability?.[0]?.advance_days ?? 7`.
- `selectableDates`: un día es seleccionable si AL MENOS UN bloque tiene ese día en `days_of_week`.
- `availableSlots`: usa `availability?.length`.
- Guard "sin disponibilidad": usa `!availability?.length`.

---

## Retrocompatibilidad

Los negocios que ya tenían configurada su agenda (1 fila en `business_availability`) siguen funcionando sin cambios. La columna `slot_capacity` tiene `DEFAULT 1`, y `getAvailableSlots` acepta tanto objeto único como array.
