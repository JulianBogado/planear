# PLANE.AR - SubsManager

Plataforma SaaS multiusuario para administrar suscripciones, membresias y turnos de pequenos negocios. El backend vive en Supabase y la app cliente corre con React + Vite.

## Entornos

Se trabajan tres entornos separados:

- `local`: `npm run dev` contra Supabase local en Docker.
- `staging`: proyecto remoto nuevo para validar antes de produccion.
- `produccion`: proyecto remoto actual, usado por la app en vivo.

Reglas operativas:

- No usar `.env.local` como archivo principal del frontend.
- No usar `supabase link` para cambiar entre staging y produccion.
- Toda operacion remota de Supabase debe ejecutarse con `--project-ref` explicito.

## Variables del frontend

Contrato del frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Archivos de ejemplo incluidos:

- `.env.development.example`
- `.env.staging.example`
- `.env.production.example`

Copialos a:

- `.env.development.local`
- `.env.staging.local`
- `.env.production.local`

Vite resuelve por modo:

- `npm run dev` -> `development`
- `npm run dev:staging` -> `staging`
- `npm run build` -> `production`
- `npm run build:staging` -> `staging`

## Variables de Edge Functions

Templates incluidos en `supabase/env/`:

- `local.functions.example`
- `staging.functions.example`
- `prod.functions.example`

Copialos a:

- `supabase/env/local.functions.env`
- `supabase/env/staging.functions.env`
- `supabase/env/prod.functions.env`

Variables principales:

- `APP_SITE_URL`
- `ALLOWED_ORIGINS`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `CONTACT_FROM_EMAIL`
- `CONTACT_TO_EMAIL`

`APP_SITE_URL` define retornos como Mercado Pago. `ALLOWED_ORIGINS` controla CORS. `SITE_URL` queda soportada solo por compatibilidad en functions viejas ya desplegadas.

## Setup local

```bash
npm install
copy .env.development.example .env.development.local
copy supabase\\env\\local.functions.example supabase\\env\\local.functions.env
npm run supabase:start
npm run dev
```

Notas:

- El `anon key` local se obtiene del stack local de Supabase.
- Si no vas a probar Mercado Pago o mail en local, podés dejar esos secrets vacios.

## Comandos

```bash
npm run dev
npm run dev:staging
npm run build
npm run build:staging
npm run preview
npm run lint

npm run supabase:start
npm run supabase:stop
npm run supabase:functions:serve:local
npm run supabase:functions:deploy:staging
npm run supabase:functions:deploy:prod
npm run supabase:secrets:set:staging
npm run supabase:secrets:set:prod
```

Para deploys/secrets remotos:

- `SUPABASE_PROJECT_REF_STAGING`
- `SUPABASE_PROJECT_REF_PROD`

Ejemplo:

```bash
set SUPABASE_PROJECT_REF_STAGING=tu_project_ref_staging
set SUPABASE_PROJECT_REF_PROD=tu_project_ref_prod
```

## Supabase y seguridad

- Las `VITE_*` del frontend son publicas por diseno.
- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` en el cliente.
- Las Edge Functions leen sus secrets desde variables de entorno del proyecto o desde `supabase/env/*.env` cuando corren localmente.
- `create-subscription`, `cancel-subscription`, `contact-form`, `verify-subscription` y `mp-webhook` ya no deben depender de dominios hardcodeados para CORS o retornos.
