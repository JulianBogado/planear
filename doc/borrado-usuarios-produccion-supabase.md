# Borrado de usuarios en producción — Supabase vs panel admin

**Fecha:** 2026-04-28

## Resumen

En producción, el borrado de usuarios **no debe hacerse desde el dashboard de Supabase/Auth**.

El borrado correcto debe hacerse desde el **panel admin de la app**, usando la RPC:

- `admin_delete_user(uuid)`

## Por qué

El proyecto tiene dependencias relacionales que no siempre se resuelven con un simple delete directo sobre `auth.users`.

Aunque algunas referencias usan `ON DELETE CASCADE`, otras relaciones del modelo requieren limpieza previa o un orden de borrado controlado.

Por eso, si se intenta borrar un usuario directamente desde Supabase Dashboard, puede aparecer un error como:

```text
Failed to delete user: Database error deleting user
```

## Qué hace el flujo correcto

La RPC `admin_delete_user` borra primero los datos dependientes del negocio y recién al final elimina el registro en `auth.users`.

Orden actual del flujo:

1. `usage_logs`
2. `payments`
3. `businesses`
4. `profiles`
5. `auth.users`

Además, el panel admin ya bloquea:

- auto-borrado del admin actual
- borrado de cuentas presentes en `admin_users`

## Regla operativa

- **Sí** borrar usuarios desde la app (`/admin`)
- **No** borrar usuarios productivos directamente desde Supabase Dashboard/Auth

## Nota

Si por algún motivo hubiera que borrar un usuario manualmente desde SQL o desde el dashboard, primero hay que limpiar explícitamente todas las referencias hijas relevantes. No asumir que `auth.users` se puede borrar solo.
