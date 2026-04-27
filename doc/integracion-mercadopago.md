# Integración Mercado Pago — Edge Functions

**Fecha:** 2026-04-20

## Qué se implementó

Integración completa de suscripciones recurrentes con MercadoPago mediante dos Supabase Edge Functions (Deno):

- `create-subscription` — Crea un preapproval en MP y devuelve el `init_point` para redirigir al usuario al checkout.
- `mp-webhook` — Recibe notificaciones de MP cuando cambia el estado de una suscripción y actualiza el tier del negocio en Supabase.

---

## Problemas resueltos durante el desarrollo

### 1. Error 401 — JWT RS256 vs HS256

Los proyectos nuevos de Supabase con clave `sb_publishable_` emiten JWTs en RS256. La validación por defecto del gateway (`verify_jwt = true`) esperaba HS256 y rechazaba todos los tokens.

**Solución:**
- Crear `supabase/config.toml` con `verify_jwt = false` para que la función maneje la auth internamente.
- Validar el token con `supabase.auth.getUser(token)` (llama al servidor de Supabase, funciona con ambos algoritmos).

### 2. Error 500 en sandbox de MP

MP sandbox rechazaba el preapproval por dos razones:
- `start_date` demasiado cercano al momento actual (MP requiere mínimo ~5 min).
- `back_url` apuntando a `localhost` (MP sandbox rechaza URLs no HTTPS/producción).

**Solución:**
- `start_date` configurado a `now + 10 minutos`.
- `back_url` resuelto desde `APP_SITE_URL` para separar local, staging y producción sin hardcodes en código.

---

## Arquitectura

### `create-subscription`

```
Pricing.jsx
  → supabase.functions.invoke('create-subscription', { body: { tier }, headers: { Authorization: Bearer <token> } })
  → Edge function valida JWT con supabase.auth.getUser(token)
  → POST /preapproval a MP con payer_email del usuario autenticado
  → Devuelve { init_point } → redirige a MP
```

**`external_reference`:** Se envía como `${tier}:${userId}` (ej: `starter:uuid-del-usuario`). El webhook lo usa para identificar el negocio sin depender del email.

### `mp-webhook`

Recibe eventos `subscription_preapproval`. Flujo:

1. Verifica firma HMAC-SHA256 si `MP_WEBHOOK_SECRET` está configurado.
2. Consulta el preapproval completo a la API de MP.
3. Determina el tier desde `external_reference` (formato `${tier}:${userId}` o legacy `starter`/`pro`).
4. Busca el business en Supabase con triple fallback:
   - Por `mp_subscription_id` (si ya fue vinculado antes).
   - Por `user_id` extraído del `external_reference`.
   - Por email del pagador (fallback para casos legacy).
5. Actualiza `tier`, `mp_subscription_id`, `mp_status` y `subscription_ends_at` usando `service_role` (bypassea RLS).

---

## Variables de entorno (Supabase secrets)

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `MP_ACCESS_TOKEN` | Sí | Token de acceso MP (`TEST-...` en sandbox, `APP_USR-...` en producción) |
| `MP_WEBHOOK_SECRET` | No | Secret para verificar firma HMAC del webhook (recomendado en producción) |
| `MP_PLAN_STARTER_ID` | No | ID de plan MP para mapeo legacy por `preapproval_plan_id` |
| `MP_PLAN_PRO_ID` | No | ID de plan MP para mapeo legacy por `preapproval_plan_id` |

Configurar con:
```bash
npx supabase secrets set MP_ACCESS_TOKEN=TEST-xxxxx
```

---

## Archivos relevantes

- `supabase/functions/create-subscription/index.ts`
- `supabase/functions/mp-webhook/index.ts`
- `supabase/config.toml` — `verify_jwt = false` para `create-subscription`
- `src/pages/Pricing.jsx` — invoca la edge function y valida el `init_point`
- `src/constants/tiers.js` — precios y límites por tier
