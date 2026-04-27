# Formulario de contacto público con Resend

**Fecha:** 2026-04-22

## Objetivo

Activar el formulario público de `src/pages/Contacto.jsx` con un flujo seguro que:

- guarde cada mensaje en base de datos
- envíe una notificación inmediata por email
- no exponga secretos ni permita inserts públicos directos

## Arquitectura

Flujo implementado:

`Contacto.jsx` → `Supabase Edge Function contact-form` → `public_contact_messages` + `Resend`

## Componentes

### Frontend

`src/pages/Contacto.jsx`

- deja de simular el envío
- llama a `supabase.functions.invoke('contact-form')`
- muestra estado de carga, éxito y error
- manda `form_started_at` para defensa anti-spam
- incluye un honeypot oculto (`website`)

### Base de datos

Migración:

- `supabase/migrations/20260422_public_contact_messages.sql`

Tabla:

- `public_contact_messages`

Campos principales:

- `name`
- `email`
- `message`
- `status`
- `source`
- `ip_hash`
- `user_agent`
- `email_sent_at`
- `email_error`
- `created_at`

RLS:

- habilitado
- sin permisos para `anon` ni `authenticated`
- toda escritura pasa por la Edge Function usando `service_role`

### Edge Function

`supabase/functions/contact-form/index.ts`

Responsabilidades:

- acepta solo `POST`
- valida `name`, `email` y `message`
- rechaza honeypot completo
- rechaza envíos demasiado rápidos
- limita por cantidad de mensajes recientes desde la misma IP anonimizada
- inserta el mensaje en DB
- envía email vía Resend
- guarda error de envío si el proveedor falla

## Secrets requeridos

Configurar en Supabase Edge Functions:

- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL=hola@plane.ar`
- `CONTACT_FROM_EMAIL`
- `APP_SITE_URL`
- `ALLOWED_ORIGINS`

## Notas

- `support_messages` no se reutiliza para este caso.
- El formulario público queda separado del soporte autenticado de `Help.jsx`.
- Si el envío del proveedor falla, el mensaje igual queda persistido para diagnóstico.
