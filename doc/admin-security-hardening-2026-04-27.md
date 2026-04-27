# 2026-04-27 — Hardening de acceso admin

## Qué se hizo

- Se agregó `AdminGuard` en el router para que `/admin` no dependa solo del chequeo dentro de la página.
- `useIsAdmin()` ahora se recalcula cuando cambia el usuario autenticado y resetea el estado al cambiar de sesión.
- `Register.jsx` bloquea el registro si ya existe una sesión activa.
- `Admin.jsx` trata cualquier `Acceso denegado` como evento de seguridad: limpia datos, muestra toast y redirige a `/dashboard`.
- El menú "Panel admin" en `AppLayout.jsx` solo se muestra cuando `useIsAdmin()` resolvió `true`.

## Endurecimiento en Supabase

- Nueva migration: `20260427193000_admin_security_hardening.sql`.
- Las RPCs `admin_list_businesses`, `admin_get_subscribers`, `admin_update_user` y `admin_delete_user` ahora lanzan `RAISE EXCEPTION 'Acceso denegado'` cuando `is_admin()` es falso.
- `admin_delete_user` además bloquea:
  - auto-borrado del admin actual
  - borrado de cualquier usuario presente en `public.admin_users`

## Impacto esperado

- Un usuario no admin no debe poder ver el panel aunque navegue directo a `/admin`.
- Un usuario no admin no debe poder leer datos admin ni ejecutar RPCs `admin_*` desde cliente o consola.
- Un admin legítimo puede seguir gestionando usuarios normales, pero no puede borrar admins desde el panel.
