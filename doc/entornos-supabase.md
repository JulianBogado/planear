# Entornos Supabase: local, staging y produccion

**Fecha:** 2026-04-27

## Objetivo

Separar claramente los tres entornos de trabajo del proyecto para evitar que el desarrollo diario use credenciales o datos de produccion por defecto.

## Esquema vigente

- **Local**
  - Corre con `supabase start` en Docker.
  - Es el entorno por defecto de `npm run dev`.
  - Usa `.env.development.local` para el frontend.
  - Usa `supabase/env/local.functions.env` para Edge Functions locales.
  - Usa `supabase/seed.sql` en cada reset local.
  - Se apoya en `20260417000000_initial_schema_bootstrap.sql` para crear el schema base.
  - Rehabilita RLS y policies base con `20260424010000_enable_rls_base_policies.sql`.

- **Staging**
  - Vive en un proyecto remoto nuevo de Supabase.
  - Se usa para validar migraciones, RLS, functions y cambios antes de produccion.
  - Usa `.env.staging.local` para el frontend local cuando querés apuntar a staging.
  - Usa `supabase/env/staging.functions.env` para secrets de functions.

- **Produccion**
  - Es el proyecto remoto actual en uso por la app publicada.
  - Usa `.env.production.local` solo para builds locales excepcionales.
  - En deploy real, las variables del frontend deben venir del host o pipeline.
  - Usa `supabase/env/prod.functions.env` para sincronizar secrets remotos.

## Regla principal

- `npm run dev` siempre debe levantar la app contra **Supabase local**.
- `npm run dev:staging` existe para probar el frontend contra staging remoto.
- `npm run build` genera build de produccion.
- `npm run build:staging` genera build orientado a staging.

## Frontend

Variables requeridas:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

- `.env.development.local`
- `.env.staging.local`
- `.env.production.local`

No usar `.env.local` como fuente principal porque Vite lo carga en todos los modos.

## Edge Functions

Variables configurables por entorno:

- `APP_SITE_URL`
- `ALLOWED_ORIGINS`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `CONTACT_FROM_EMAIL`
- `CONTACT_TO_EMAIL`

Templates incluidos:

- `supabase/env/local.functions.example`
- `supabase/env/staging.functions.example`
- `supabase/env/prod.functions.example`

Copias locales esperadas:

- `supabase/env/local.functions.env`
- `supabase/env/staging.functions.env`
- `supabase/env/prod.functions.env`

`SITE_URL` queda soportada solo por compatibilidad. La convencion nueva es `APP_SITE_URL` + `ALLOWED_ORIGINS`.

## CLI y deploy

No usar `supabase link` como mecanismo para cambiar de entorno. El estado de `supabase/.temp/project-ref` no debe considerarse confiable para deploys remotos.

Toda operacion remota debe usar `--project-ref` explicito.

Scripts npm preparados:

- `npm run supabase:start`
- `npm run supabase:stop`
- `npm run supabase:functions:serve:local`
- `npm run supabase:functions:deploy:staging`
- `npm run supabase:functions:deploy:prod`
- `npm run supabase:secrets:set:staging`
- `npm run supabase:secrets:set:prod`

Snippets útiles:

- `supabase/snippets/grant-local-admin.sql`

Variables necesarias para deploy remoto:

- `SUPABASE_PROJECT_REF_STAGING`
- `SUPABASE_PROJECT_REF_PROD`

## Integraciones externas

- **Local**: se pueden dejar desactivadas o con credenciales de prueba.
- **Staging**: debe usar sandbox o credenciales test.
- **Produccion**: usa credenciales reales.

Hoy staging sigue sin URL publica propia, asi que los flujos externos que dependen de callbacks HTTP completos quedan preparados pero no necesariamente cerrados end-to-end.

## Checklist rapido

1. Completar `.env.development.local`, `.env.staging.local` y `.env.production.local` según corresponda.
2. Copiar el template correcto de functions a `supabase/env/*.env`.
3. Levantar Supabase local con `npm run supabase:start`.
4. Correr `npm run dev` para local o `npm run dev:staging` para remoto.
5. Si hacés `db reset` local, volver a otorgar admin si lo necesitás.
6. Para deploys y secrets remotos, exportar `SUPABASE_PROJECT_REF_STAGING` y `SUPABASE_PROJECT_REF_PROD`.
