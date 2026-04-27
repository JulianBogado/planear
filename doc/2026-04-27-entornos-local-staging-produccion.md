# Entornos Supabase y scripts por modo

**Fecha:** 2026-04-27

## Implementado

- Se creó la rama de trabajo `feature/supabase-envs` para aislar estos cambios de `main`.
- El frontend quedó preparado para tres modos:
  - `development` con `npm run dev`
  - `staging` con `npm run dev:staging` y `npm run build:staging`
  - `production` con `npm run build`
- Se agregaron templates de entorno para frontend:
  - `.env.development.example`
  - `.env.staging.example`
  - `.env.production.example`
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

## Convenciones nuevas

- No usar `.env.local` como archivo principal del frontend.
- No usar `supabase link` para alternar entre staging y produccion.
- Toda operacion remota de Supabase debe llevar `--project-ref` explicito.
