# Turno Simple en Agenda Pública

**Fecha:** 2026-04-20

## Qué se implementó

Opción por bloque de agenda que permite al negocio configurar un "turno simple": el cliente elige el bloque completo (ej: "Mañana") en lugar de un horario granular exacto (ej: "09:00").

---

## Cambios aplicados

### DB — Migración `add_simple_shift_to_availability`

```sql
ALTER TABLE business_availability
  ADD COLUMN simple_shift BOOLEAN NOT NULL DEFAULT false;
```

Retrocompatible: bloques existentes tienen `simple_shift = false` por defecto → comportamiento granular sin cambios.

### `src/pages/Settings.jsx`

- `DEFAULT_BLOCK` incluye `simple_shift: false`
- UI por bloque: checkbox "Turno simple — el cliente elige el bloque completo, no un horario exacto"
- Cuando `simple_shift = true`, el selector de duración de turno se oculta (no aplica)

### `src/hooks/useAppointments.js` — `getAvailableSlots()`

- Los slots ahora incluyen `{ ..., blockName, isSimpleShift }`
- Cuando `block.simple_shift = true`: genera **un único slot** que cubre todo el bloque (start_time → end_time). La disponibilidad se calcula contando todas las reservas que caen dentro del bloque vs `slot_capacity`.
- Cuando `block.simple_shift = false`: lógica granular existente sin cambios.

### `src/pages/PublicBooking.jsx`

- Los slots disponibles se dividen en `simpleShifts` y `granularSlots`
- **Turnos simples**: se muestran como cards anchas con nombre del bloque + rango horario ("De 09:00 a 13:00")
- **Slots granulares**: se muestran como grilla de botones horarios (comportamiento anterior)
- Paso de confirmación: para turno simple muestra nombre del bloque + "Te esperamos de HH:MM a HH:MM"
- Pantalla de éxito: muestra nombre del bloque si existe, seguido del rango completo

---

## Casos de uso

| Configuración | Lo que ve el cliente |
|---|---|
| `simple_shift=true`, `block_name="Mañana"`, 09:00–13:00 | Card "Mañana · De 09:00 a 13:00" |
| `simple_shift=true`, sin nombre, 09:00–13:00 | Card "09:00 – 13:00 · De 09:00 a 13:00" |
| `simple_shift=false`, cualquier duración | Grilla de botones horarios (comportamiento anterior) |
| Mezcla de ambos tipos en un mismo día | Cards primero, luego grilla |
