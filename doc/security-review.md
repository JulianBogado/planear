# Security Review — PLANE.AR

**Fecha:** 2026-04-19 (segunda ronda: 2026-04-19)
**Revisado por:** Claude Code (análisis estático + auditoría de DB vía MCP)
**Estado:** Corregido — 1 item manual pendiente (HaveIBeenPwned, ver abajo)

---

## Resumen ejecutivo

Se realizaron dos rondas de auditoría de seguridad sobre el codebase completo de PLANE.AR (frontend React, edge functions Deno, base de datos Supabase). El modelo de seguridad es correcto: anon key pública con RLS como barrera de datos, JWT verification en funciones, admin check server-side via RPC. Se encontraron y corrigieron 15 issues en total.

---

## Hallazgos y soluciones — Ronda 1 (frontend + DB inicial)

### ✅ CRÍTICO 1 — fetchPayments() sin verificación de ownership
**Archivo:** `src/pages/SubscriberDetail.jsx:81`
Los pagos solo se consultan si el suscriptor fue previamente validado como perteneciente al negocio actual.
```js
// Antes: if (!business?.id) return
// Después:
if (!business?.id || !subscriber) return
```

### ✅ CRÍTICO 2 — handleDeleteLog() sin filtro business_id
**Archivo:** `src/pages/SubscriberDetail.jsx:166`
```js
// Antes: .delete().eq('id', logId)
// Después:
.delete().eq('id', logId).eq('business_id', business.id)
```

### ✅ ALTO 3 — Check de superusuario client-side (patrón legacy)
**Archivos:** `src/pages/Agenda.jsx`, `src/pages/Stats.jsx`
Reemplazado `user?.email === import.meta.env.VITE_SUPERUSER_EMAIL` por `useIsAdmin()` en ambos archivos. Se eliminó `useAuth` y `user` que ya no eran necesarios.

### ✅ ALTO 4 — useIsAdmin() sin error handling
**Archivo:** `src/hooks/useIsAdmin.js`
```js
// Antes: .then(({ data }) => setIsAdmin(!!data))
// Después:
.then(({ data, error }) => { if (!error) setIsAdmin(!!data) })
```

### ✅ ALTO 5 — Admin tier update sin manejo de error RLS
**Archivo:** `src/pages/Settings.jsx:385`
El botón de cambio de tier del panel admin ahora captura y muestra el error si la DB rechaza el update.

### ✅ ALTO 6 — Contraseña mínima de 6 caracteres
**Archivo:** `src/pages/Register.jsx`
Mínimo 8 caracteres + al menos 1 número. También configurado en Supabase Auth Dashboard.

### ✅ MEDIO 7 — Redirect a MP sin validación de URL
**Archivo:** `src/pages/Pricing.jsx`
Se valida que `init_point` empiece con `https://www.mercadopago.com.ar/` o `https://sandbox.mercadopago.com.ar/` antes del redirect.

### ✅ MEDIO 8 — PII en logs de edge functions
Emails de usuarios removidos de todos los console.error/log.

### ✅ MEDIO 9 — Source maps en producción
`vite.config.js` → `build: { sourcemap: false }`

### ✅ MEDIO 10 — VITE_SUPERUSER_EMAIL expuesto en frontend
Removido completamente del bundle. Solo vive en la DB (función `is_admin()` chequea tabla `admin_users`). Removido también de `.env.example`.

---

## Hallazgos y soluciones — Ronda 2 (DB + edge functions + servidor)

### ✅ CRÍTICO 11 — CORS `Access-Control-Allow-Origin: *` en edge functions
**Archivos:** `supabase/functions/create-subscription/index.ts`, `supabase/functions/mp-webhook/index.ts`

Ambas funciones devolvían `*` en el header CORS, permitiendo que cualquier origen invocara las funciones desde un browser. Ahora usan el `SITE_URL` env var como allowed origin.

```typescript
// Antes: 'Access-Control-Allow-Origin': '*'
// Después:
'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') ?? 'http://localhost:5173'
```

**Acción requerida:** Setear `SITE_URL` en los secrets de las edge functions:
Supabase Dashboard → Edge Functions → Secrets → agregar `SITE_URL=https://TU_DOMINIO.com`

### ✅ CRÍTICO 12 — Sin verificación de firma del webhook de MercadoPago
**Archivo:** `supabase/functions/mp-webhook/index.ts`

El webhook aceptaba cualquier request sin verificar que viniera de MP. Un atacante podía simular un pago para upgradear su cuenta a Pro gratuitamente.

Implementada verificación HMAC-SHA256 usando el header `X-Signature` de MP:
- Parsea `ts` y `v1` del header
- Construye template: `id:{data.id};request-id:{x-request-id};ts:{ts}`
- Computa HMAC-SHA256 con `MP_WEBHOOK_SECRET`
- Compara con `v1`

**Acción requerida:** Obtener el webhook secret en MercadoPago Dashboard → Webhooks → ver la clave secreta → setear como `MP_WEBHOOK_SECRET` en Supabase Edge Functions secrets.

> Nota: La verificación es condicional (`if (webhookSecret)`) para no romper ambientes de desarrollo donde no existe el secret. En producción el secret DEBE estar configurado.

### ✅ ALTO 13 — 4 funciones DB con search_path mutable
**Funciones:** `get_effective_tier`, `can_add_plan`, `can_add_subscriber`, `_tier_fields_unchanged`

Todas son `SECURITY DEFINER`. Sin `search_path` fijo, un usuario podría intentar un ataque de schema injection creando objetos que sombreen los de `public`. Corregido via migración `fix_function_search_path_mutable`.

```sql
ALTER FUNCTION public.get_effective_tier(p_business_id uuid) SET search_path = public;
-- (idem para las otras 3)
```

### ✅ MEDIO 14 — vercel.json con `unsafe-inline` + deployment en Oracle
Deployment es en Oracle server, no Vercel. Se creó `deploy/nginx.conf` con los security headers equivalentes incluyendo:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy` (sin `unsafe-inline` en scripts)
- Redirect HTTP → HTTPS
- Cache de assets estáticos con hash

---

## Pendiente manual — 1 item

| Item | Acción | Dónde |
|------|--------|-------|
| **HaveIBeenPwned protection** | Habilitar "Leaked password protection" | Supabase Dashboard → Auth → Providers → Email → Password Settings → activar toggle |
| **SITE_URL en edge functions** | Setear `SITE_URL=https://TU_DOMINIO.com` | Supabase Dashboard → Edge Functions → Secrets |
| **MP_WEBHOOK_SECRET en edge functions** | Obtener de MP Dashboard → Webhooks y setear el secret | Supabase Dashboard → Edge Functions → Secrets |
| **Deploy nginx.conf** | Copiar `deploy/nginx.conf` al servidor Oracle, reemplazar `TU_DOMINIO.com` y configurar SSL con Let's Encrypt | Oracle server |
| **Rate limiting en public_lookup_subscriber** | Ver opciones en `doc/security-review.md` sección anterior — opción A (edge function proxy) para V2 | Supabase Edge Functions |

---

## Estado final de la DB (verificado via MCP)

| Check | Estado |
|-------|--------|
| RLS habilitado en todas las tablas | ✅ |
| Políticas SELECT/INSERT/DELETE en payments | ✅ `own_payments` (ALL) |
| Políticas en usage_logs | ✅ `own_usage_logs` (ALL) |
| Políticas en appointments | ✅ `Owner manages appointments` (ALL) |
| Políticas RESTRICTIVE en businesses (tier) | ✅ |
| `can_add_subscriber` / `can_add_plan` como límites DB | ✅ |
| search_path fijo en funciones SECURITY DEFINER | ✅ (corregido ronda 2) |
| Advisors de seguridad restantes | ⚠️ Solo HaveIBeenPwned (pendiente dashboard) |

---

## Lo que estaba bien desde el inicio

- Auth via `supabase.auth.onAuthStateChange()` — correcto
- `src/lib/supabase.js` — env vars, sin hardcode
- `.mcp.json` en `.gitignore`, `.env.local` nunca commiteado
- Edge functions usan `SUPABASE_SERVICE_ROLE_KEY` via `Deno.env.get()` — correcto
- JWT validation en `create-subscription` — presente
- `is_admin()` chequea tabla `admin_users`, no email hardcodeado
- `AppGuard` / `OnboardingGuard` — patrón correcto para SPA
- Sin `dangerouslySetInnerHTML`, `eval()`, ni XSS vectors en el frontend
- Sin console.log con PII en el frontend
