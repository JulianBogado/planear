# Entornos Supabase y scripts por modo

**Fecha:** 2026-04-27

## Implementado

- Se creó la rama de trabajo `feature/supabase-envs` para aislar estos cambios de `main`.
- El frontend quedó preparado para tres modos:
  - `development` con `npm run dev`
  - `staging` con `npm run dev:staging` y `npm run build:staging`
  - `production` con `npm run build`
- El frontend quedó con estos archivos finales:
  - `.env.development.local`
  - `.env.staging.local`
  - `.env.production.local`
- Se agregaron templates de secrets para Edge Functions:
  - `supabase/env/local.functions.example`
  - `supabase/env/staging.functions.example`
  - `supabase/env/prod.functions.example`
- Se agregaron scripts npm para:
  - levantar y frenar Supabase local
  - servir functions localmente
  - deployar functions a staging y produccion
  - sincronizar secrets a staging y produccion
- Las functions `create-subscription`, `cancel-subscription`, `contact-form`, `verify-subscription` y `mp-webhook` dejaron de depender de dominios hardcodeados para CORS.
- `create-subscription` ahora toma el `back_url` desde `APP_SITE_URL`.
- `verify-subscription` dejó de responder con `Access-Control-Allow-Origin: *`.
- Se sanitizaron referencias operativas para no depender del `project-ref` productivo dentro del flujo de trabajo documentado.
- Se trajo el historial remoto faltante de migraciones (`20260417...` a `20260423...`).
- Se agregó `20260417000000_initial_schema_bootstrap.sql` para crear el schema base que no estaba versionado.
- Se agregó `20260424010000_enable_rls_base_policies.sql` para re-habilitar RLS y policies base en local.
- Se agregó `supabase/seed.sql` como seed mínimo válido.
- Se agregó `supabase/snippets/grant-local-admin.sql` para promover admins locales.

## Convenciones nuevas

- No usar `.env.local` como archivo principal del frontend.
- No usar `supabase link` para alternar entre staging y produccion.
- Toda operacion remota de Supabase debe llevar `--project-ref` explicito.
- Después de `db reset` local, los admins deben volver a insertarse en `public.admin_users`.
