# Acceso Pro Promocional

**Fecha:** 2026-04-22

## Qué se implementó

Sistema para otorgar acceso pro gratuito (promocional) a negocios seleccionados, sin que paguen, con fecha de vencimiento configurable.

## Componentes

### Base de datos (`20260422_promo_access.sql`)
- Nueva columna `businesses.is_promo boolean DEFAULT false`
- Policy `businesses_protect_tier_fields` actualizada para incluir `is_promo` (solo admin puede modificarla)
- Nueva RPC `admin_list_businesses()` SECURITY DEFINER — retorna todos los negocios con email del usuario; solo ejecutable por admins (`is_admin()`)

### Panel admin (`src/pages/Admin.jsx`)
- Ruta `/admin`, protegida: redirige a `/dashboard` si no es admin
- Lista todos los negocios via `admin_list_businesses()`
- Buscador por nombre o email
- Por negocio: badge de tier, estado promo, fecha de vencimiento
- Botón "Dar acceso" → despliega DatePicker de vencimiento → UPDATE `{ tier: 'pro', subscription_ends_at, is_promo: true }`
- Botón "Revocar" → UPDATE `{ tier: 'free', subscription_ends_at: null, is_promo: false }`

### Navigation (`src/components/layout/AppLayout.jsx`)
- En el dropdown de Config (desktop y mobile): ítem "Panel admin" con ícono Shield, visible solo para superusuarios

### Settings (`src/pages/Settings.jsx`)
- En la sección "Mi suscripción": si `business.is_promo === true`, muestra badge "Pro (promo)" en amarillo y texto "Acceso promocional hasta: fecha" en lugar de "Próximo cobro"

### MP Webhook (`supabase/functions/mp-webhook/index.ts`)
- Antes de actualizar el business, consulta `is_promo`
- Si `is_promo === true`: solo actualiza `mp_subscription_id` y `mp_status`; no modifica `tier` ni `subscription_ends_at`

## Flujo de uso

1. Admin entra a `/admin` desde el menú Config → Panel admin
2. Busca el negocio por nombre o email
3. Clickea "Dar acceso" y selecciona fecha de vencimiento
4. El negocio inmediatamente tiene acceso pro completo (stats, agenda, cartelería, sin límites)
5. El usuario ve en Configuración → Mi suscripción: badge "Pro (promo)" con fecha de acceso
6. Cuando vence `subscription_ends_at`, el acceso baja automáticamente a free (lógica existente de `useSubscription`)
7. Para revocar antes: admin clickea "Revocar" en el panel
