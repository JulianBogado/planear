# Admin Panel v2

**Fecha:** 2026-04-22

## Qué se implementó

Extensión del panel admin con más información de usuarios, edición, eliminación y fix del bug de acceso pro.

## Bug fix: acceso pro no aplicaba

La política permissive `own_business` en `businesses` solo permitía UPDATE cuando `auth.uid() = user_id`. Al actualizar el negocio de otro usuario, ninguna policy permissive pasaba y el UPDATE afectaba 0 filas sin error.

**Fix:** Nueva política permissive `businesses_admin_update` que permite UPDATE a cualquier fila cuando `is_admin()` es true.

## Cambios en DB (`20260422_admin_panel_v2.sql`)

### Nueva policy
`businesses_admin_update` — PERMISSIVE FOR UPDATE — `USING (is_admin()) WITH CHECK (is_admin())`

### `admin_list_businesses()` actualizada
Ahora incluye: `owner_nombre`, `owner_apellido`, `owner_phone`, `business_phone`, `category`, `instagram`, `facebook`, `tiktok`, `subscriber_count`, `created_at`.

### `admin_update_user(p_user_id, p_nombre, p_apellido, p_telefono, p_business_name)`
SECURITY DEFINER. Verifica `is_admin()`. Actualiza `profiles` (nombre, apellido, teléfono) y `businesses.name`.

### `admin_delete_user(p_user_id)`
SECURITY DEFINER. Verifica `is_admin()`. Orden de borrado:
1. `usage_logs` (FK NO ACTION)
2. `payments` (FK NO ACTION)
3. `businesses` (cascade a subscribers, plans, appointments, business_availability)
4. `profiles`
5. `auth.users` (requiere `GRANT DELETE ON auth.users TO postgres`)

## Cambios en Admin.jsx

- **Tarjetas expandibles:** click despliega contacto, redes, rubro, fecha de alta, estado promo
- **Chips copiables:** email, teléfonos, redes — click copia al portapapeles con feedback visual
- **Header de tarjeta:** nombre + tier badge + cantidad de suscriptores
- **PromoPanel:** integrado en el detalle (dar/revocar con datepicker)
- **Modal edición:** nombre negocio, nombre/apellido/teléfono del dueño
- **Modal eliminación:** requiere escribir el nombre exacto del negocio para confirmar
- **Buscador:** ahora busca también por nombre y apellido del dueño
- **Totales globales:** header muestra total negocios, total suscriptores, cantidad promo
