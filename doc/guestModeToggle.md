# Guest Mode Toggle — Control de reservas sin suscripción

**Fecha:** 2026-04-19

## Qué se implementó

Protección contra llenado malicioso de la agenda pública (`/reservar/:slug`). Se agregó un toggle en Settings que permite al negocio habilitar o deshabilitar las reservas de personas sin membresía activa.

## Cambios realizados

### Base de datos
- Nueva columna `businesses.allow_guest_bookings boolean DEFAULT false`
- Migration aplicada: `add_allow_guest_bookings_to_businesses`
- Default `false` — los negocios deben activar explícitamente el guest mode si lo desean

### `src/pages/Settings.jsx`
- Nuevo estado `allowGuestBookings` sincronizado con `business.allow_guest_bookings`
- Nuevo handler `handleToggleGuestBookings()` — guarda en DB y muestra toast
- Toggle visual dentro del bloque "Agenda y reservas", visible solo cuando `agendaEnabled = true`

### `src/pages/PublicBooking.jsx`
- `handleContinueAsGuest()` tiene un guard: si `business.allow_guest_bookings` es falso, no hace nada
- Botón "Reservar sin suscripción" en Step 0 (DNI gate) se renderiza condicionalmente
- Botón "Reservar sin suscripción" en Step EXPIRED (suscripción vencida) se renderiza condicionalmente

## Comportamiento

- `allow_guest_bookings = false` (default): solo suscriptores activos pueden reservar. El botón guest no aparece en ningún step.
- `allow_guest_bookings = true`: funciona igual que antes — cualquier persona puede reservar sin suscripción.

## Contexto de seguridad

El guest mode sin verificación era vulnerable a llenado de agenda por bots o manualmente. La decisión de desactivarlo por default y darlo como opt-in protege a los negocios que solo trabajan con suscriptores.

**V2+:** Si se reactiva el guest mode, se planea agregar verificación por SMS OTP antes de confirmar la reserva.
