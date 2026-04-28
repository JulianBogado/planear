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

Archivos usados por Vite segun el modo:

- `.env.development.local`
- `.env.staging.local`
- `.env.production.local`

Notas:

- `npm run dev` usa `.env.development.local`
- `npm run dev:staging` usa `.env.staging.local`
- `npm run build` usa `.env.production.local`
- `.env.local` ya no debe usarse como archivo principal del frontend

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
npm run supabase:start
npm run dev
```

Notas:

- El repo ya trabaja con `.env.development.local`, `.env.staging.local` y `.env.production.local`.
- Si falta alguno, crearlo manualmente con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del entorno correspondiente.
- El `anon key` local se obtiene del stack local de Supabase.
- Para functions locales, usar `supabase/env/local.functions.env`. Si no existe, se puede crear a partir de `supabase/env/local.functions.example`.
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
- `/admin` ahora usa guard dedicado en router y chequeo defensivo en la pagina.
- Las RPCs `admin_list_businesses`, `admin_get_subscribers`, `admin_update_user` y `admin_delete_user` deben devolver `Acceso denegado` si el caller no es admin.
- `admin_delete_user` no puede borrar cuentas presentes en `admin_users` ni permitir auto-borrado del admin actual.
