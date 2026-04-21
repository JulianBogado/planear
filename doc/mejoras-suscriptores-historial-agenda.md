# Mejoras /suscriptores, /agenda y ficha de cliente

**Fecha:** 2026-04-21
**Branch:** feature/suscriptores-agenda-improvements

---

## Base de datos

- Nueva columna `email text` en `subscribers` (nullable en DB, obligatoria en el frontend para nuevos registros)
- Nuevas columnas `deleted_at timestamptz` y `delete_reason text` en `usage_logs` para soft-delete con trazabilidad completa
- Índice parcial `idx_usage_logs_business_used_at` en `usage_logs (business_id, used_at DESC) WHERE deleted_at IS NULL` para optimizar el historial de la agenda
- Nueva RPC `delete_usage_log_atomic(p_log_id, p_business_id, p_delete_reason)`: soft-delete del log + restaura 1 uso al suscriptor + recalcula status, todo en una sola transacción atómica (SECURITY DEFINER con `search_path = public`)

Migración: `supabase/migrations/20260421_usage_logs_soft_delete_email.sql`

---

## /suscriptores — tarjetas

- **Campos obligatorios al registrar:** DNI, teléfono y email (antes eran opcionales los dos primeros y el email no existía)
- **Info strip** debajo del nombre (fuera del área clickeable para permitir interacciones propias):
  - DNI
  - Teléfono con **copy to clipboard** al hacer click — muestra ícono de copiar al hover, sin navegar al detalle. Toast de confirmación "Teléfono copiado"
  - "Activo desde dd/MM/yy" (fecha de inicio de la suscripción actual)
- **Texto de estado corregido** (esquina superior derecha):
  - `active` / `expiring_soon` → "Vence el dd/MM/yy"
  - `expired` → "Vencido el dd/MM/yy" (solo cuando la fecha realmente pasó)
  - `no_uses` → "Sin usos desde dd/MM/yy" (última fecha de uso) o "Sin usos disponibles" si no hay historial — ya no dice "Vencido el" cuando la fecha de fin aún no pasó

---

## /agenda — historial de usos

- Nueva tab **"Historial"** (tercera opción junto a Hoy/Mañana y Semana)
- Lista todos los usos del negocio con: nombre del cliente, fecha/hora, notas opcionales
- Carga lazy: `useUsageLogs` solo consulta Supabase cuando la tab está activa (se pasa `null` como businessId cuando la vista no está activa)
- Botón de eliminación visible al hover en cada fila
- Modal de eliminación con **motivo obligatorio** — el botón de confirmar está deshabilitado mientras el campo esté vacío
- Al eliminar: soft-delete en DB (queda `deleted_at` + `delete_reason`), el uso desaparece del historial, el cliente recupera 1 crédito. Toast: "Uso eliminado y crédito devuelto al cliente"

---

## Ficha del cliente — /suscriptores/:id

- **Email** visible en "Información del cliente" y editable en el modal de edición (campo opcional retroactivamente para clientes existentes)
- **Copy to clipboard** en teléfono, email y DNI: al hacer hover sobre cada campo aparece ícono de copiar. Toast con el nombre del campo ("Teléfono copiado", "Email copiado", "DNI copiado")
- **Sección "Turnos reservados"**: muestra todos los turnos futuros del suscriptor (pendientes y confirmados), tanto los reservados desde el public booking como los cargados desde la agenda. Incluye horario, día completo en español, notas. Los confirmados se destacan en verde con badge. Si no hay turnos próximos: "Sin turnos próximos"
- **Eliminación de usos** migrada a la RPC atómica `delete_usage_log_atomic` (antes era un DELETE manual + UPDATE separado, con riesgo de inconsistencia). El motivo queda registrado automáticamente como "Eliminado desde ficha del cliente"
- `fetchLogs` filtra `deleted_at IS NULL` para no mostrar usos soft-deleted

---

## Hooks

### Nuevo: `src/hooks/useUsageLogs.js`
- `logs`: array de usos activos del negocio con join a `subscribers(name)`
- `loading`, `refetch`
- `deleteUsage(logId, reason)`: llama la RPC atómica, actualización optimista del estado local

### Modificado: `src/hooks/useSubscribers.js`
- `fetchSubscribers` ahora lanza 3 queries en paralelo (`Promise.all`):
  1. Suscriptores + plan
  2. Último uso por suscriptor (`usage_logs` DESC, filtra `deleted_at IS NULL`, limit 500)
  3. Próximo turno por suscriptor (`appointments` ASC, futuros, no cancelados)
- Resultado enriquecido: cada suscriptor tiene `last_used_at` y `next_appointment`
- `createSubscriber` incluye el campo `email`
- Updates optimistas en `registerUse` y `renewSubscriber` preservan `last_used_at` y `next_appointment` sin necesidad de refetch completo

---

## Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `src/hooks/useUsageLogs.js` | **Nuevo** |
| `src/hooks/useSubscribers.js` | Fetch enriquecido, email, optimistic updates |
| `src/pages/Subscribers.jsx` | Form obligatorio, info strip, copy teléfono, fix texto estado |
| `src/pages/SubscriberDetail.jsx` | Email, copy en campos, turnos reservados, RPC delete |
| `src/pages/Agenda.jsx` | Tab historial, modal eliminación con motivo |
| `supabase/migrations/20260421_usage_logs_soft_delete_email.sql` | **Nuevo** |
