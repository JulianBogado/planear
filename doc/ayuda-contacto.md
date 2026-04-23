# Formulario de contacto en /ayuda

**Fecha:** 2026-04-23

## ¿Qué se implementó?

### 1. Formulario funcional (envío por email)

El formulario de la tab "Contacto" en `/ayuda` estaba guardando los mensajes directamente en la tabla `support_messages` sin enviar ninguna notificación. El equipo nunca se enteraba de los mensajes.

Se reemplazó el insert directo por una llamada a la edge function `contact-form`, que guarda en `public_contact_messages` y envía un email a hola@plane.ar vía Resend.

**Archivos modificados:** `src/pages/Help.jsx`

**Cambios en `handleSend`:**
- Ya no hace `supabase.from('support_messages').insert(...)`
- Llama a `supabase.functions.invoke('contact-form', { body: { name, email, message, website: '', form_started_at } })`
- `name`: nombre del negocio (fallback: email del usuario si el nombre tiene < 2 caracteres)
- `message`: prefija la categoría seleccionada: `[Motivo]\n\nMensaje del usuario`
- `form_started_at`: timestamp al montar el componente (satisface el check anti-spam de 3 segundos)
- `website`: vacío (honeypot)

La tabla `support_messages` sigue existiendo en la DB pero ya no se usa desde este formulario.

### 2. Animación de confirmación (tilde animado)

Al enviar exitosamente, en vez de un toast la tab de Contacto reemplaza el formulario con una pantalla de confirmación animada.

**Archivos modificados:** `src/pages/Help.jsx`, `src/index.css`

**Animaciones agregadas en `index.css`:**
- `animate-check-pop`: el círculo verde entra con bounce elástico (escala 0 → 1.18 → 0.92 → 1 con rotación leve), usando `cubic-bezier(0.34, 1.56, 0.64, 1)`
- `animate-fade-up`: el texto y el botón secundario suben desde 8px con fade, con delays escalonados (0.2s y 0.35s)

**Estado `sent` en Help.jsx:**
- `setSent(true)` al recibir respuesta exitosa de la edge function
- Muestra círculo `bg-emerald-50` con `CheckCircle2` (44px, emerald) + título + email del usuario
- Botón "Enviar otra consulta" hace `setSent(false)` y limpia categoría y mensaje
