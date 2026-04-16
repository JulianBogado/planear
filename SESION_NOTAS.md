# Notas de sesión — SubsManager

## Resumen de lo implementado

---

## 1. Página de Estadísticas (`src/pages/Stats.jsx`)

Se creó una página completa de estadísticas con gráficos usando la librería **Recharts**.

### Instalación
```bash
npm install recharts
```

### Contenido
- **4 tarjetas de resumen**: total clientes, activos, por vencer, vencidos/sin usos
- **Gráfico de torta (donut)**: distribución de clientes por plan
- **Gráfico de barras horizontal**: % promedio de consumo de usos por plan
- **Gráfico de barras vertical**: actividad semanal (últimas 8 semanas)
- **Ingresos**: total acumulado y últimos 30 días

### Hook asociado (`src/hooks/useStats.js`)
- Consulta `usage_logs` agrupando por semana usando `date-fns`
- Consulta `payments` para calcular ingresos totales y recientes

### Gate de acceso
La página solo está disponible para el **tier Pro**. Si el usuario tiene free o starter, ve una pantalla de upgrade en lugar de los gráficos.

---

## 2. Página de Ayuda (`src/pages/Help.jsx`)

Página con dos pestañas:

### FAQ
- Preguntas frecuentes organizadas en categorías (Primeros pasos, Planes, Clientes, Configuración)
- Acordeón: solo una pregunta abierta a la vez

### Contacto
- Formulario con categoría, email (solo lectura) y mensaje
- Guarda en la tabla `support_messages` de Supabase

### SQL necesario en Supabase
```sql
create table support_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  business_name text,
  email text,
  category text,
  message text not null,
  created_at timestamptz default now()
);
```

---

## 3. Cambios en el layout (`src/components/layout/AppLayout.jsx`)

- Se agregó **Estadísticas** como 5° ítem del menú de navegación inferior
- Se agregó un **botón flotante "?"** (HelpCircle) que lleva a `/ayuda`, visible en todas las páginas excepto en `/ayuda` misma

---

## 4. Mejoras en SubscriberDetail (`src/pages/SubscriberDetail.jsx`)

- El botón **Renovar** ahora es siempre visible (antes solo aparecía si la suscripción estaba vencida)
- Al renovar, se puede **cambiar el plan** desde un selector dentro del modal
- Al cambiar el plan, el **precio se autocompleta** automáticamente con el precio del plan seleccionado
- El campo de monto tiene el **prefijo $** para mayor claridad visual
- La fecha de vencimiento calculada se actualiza en tiempo real al cambiar el plan

---

## 5. Fix de espaciado en Subscribers (`src/pages/Subscribers.jsx`)

El cuadro de confirmación "¿Confirmás el registro de uso?" estaba pegado al borde inferior de la card.

**Causa**: CSS margin collapse — el `margin-bottom` del hijo colapsa con el del padre cuando no hay padding/border/overflow en el padre.

**Fix**: Envolver en un `<div className="px-4 pb-4">` — el padding no colapsa.

---

## 6. Sistema de planes y monetización

### Tiers implementados

| Tier | Precio | Clientes | Planes | Cartelería | Estadísticas |
|---|---|---|---|---|---|
| Free | $0 | 5 | 2 | ❌ | ❌ |
| Starter | $2.500/mes | 50 | Ilimitados | ✅ | ❌ |
| Pro | $5.000/mes | Ilimitados | Ilimitados | ✅ | ✅ |

### Archivos creados

| Archivo | Descripción |
|---|---|
| `src/constants/tiers.js` | Define `TIER_LIMITS` y `TIER_INFO` para cada plan |
| `src/hooks/useSubscription.js` | Lee `business.tier` y expone helpers: `canAddSubscriber`, `canAddPlan`, `canPrint`, `canStats` |
| `src/components/ui/UpgradeModal.jsx` | Modal que se muestra cuando el usuario alcanza un límite, con botón para ir a `/precios` |
| `src/pages/Pricing.jsx` | Página pública de precios (accesible sin login) con los 3 planes |

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/pages/Subscribers.jsx` | Bloquea "+ Nuevo" si se alcanza el límite de clientes del tier |
| `src/pages/Plans.jsx` | Bloquea "+ Nuevo plan" e "Imprimir" según tier |
| `src/pages/Stats.jsx` | Muestra pantalla de upgrade si tier no es Pro |
| `src/pages/Settings.jsx` | Sección "Mi plan" con tier actual y botón de upgrade |
| `src/App.jsx` | Ruta pública `/precios` fuera de los guards de autenticación |

### Migración SQL en Supabase
```sql
alter table businesses
  add column if not exists tier text not null default 'free',
  add column if not exists mp_subscription_id text,
  add column if not exists mp_status text,
  add column if not exists subscription_ends_at timestamptz;
```

---

## 7. Integración con MercadoPago (Suscripciones recurrentes)

### Arquitectura
- Se usa la **API de Suscripciones de MercadoPago** (endpoint `/preapproval`)
- El cobro es mensual y automático
- El frontend **nunca maneja credenciales secretas** — todo pasa por Supabase Edge Functions

### Flujo completo
```
Usuario en /precios → "Suscribirse al Starter"
  ↓
supabase.functions.invoke('create-subscription', { tier: 'starter' })
  ↓
Edge Function crea preapproval en MP → devuelve init_point
  ↓
Browser redirige al checkout de MercadoPago
  ↓
Usuario paga → MP redirige a back_url (/configuracion)
  ↓
MP envía webhook a la Edge Function mp-webhook
  ↓
mp-webhook actualiza businesses.tier en Supabase
  ↓
Usuario recarga → features desbloqueadas
```

### Edge Functions creadas

#### `supabase/functions/create-subscription/index.ts`
- Verifica el JWT del usuario usando `SUPABASE_SERVICE_ROLE_KEY`
- Llama a `POST /preapproval` de MP con los datos del tier
- Devuelve `{ init_point }` para redirigir al checkout

#### `supabase/functions/mp-webhook/index.ts`
- Recibe eventos `subscription_preapproval` de MP
- Consulta el estado del preapproval en MP
- Actualiza `businesses.tier`, `mp_subscription_id`, `mp_status`, `subscription_ends_at`

### Setup de Supabase CLI

```bash
# Instalar CLI (una sola vez)
npm install -g supabase

# Login
supabase login

# Vincular al proyecto
supabase link --project-ref TU_PROJECT_REF

# Configurar secrets
supabase secrets set MP_ACCESS_TOKEN=TEST-xxx...
supabase secrets set SITE_URL=https://tu-dominio.com  # localhost no es válido para MP

# Desplegar funciones
supabase functions deploy create-subscription --no-verify-jwt
supabase functions deploy mp-webhook
```

> **Nota**: El flag `--no-verify-jwt` es necesario porque la verificación del JWT la hace el código de la función manualmente (usando `supabaseAdmin.auth.getUser(token)`), no el gateway de Supabase.

### Secrets necesarios en Supabase

| Secret | Descripción |
|---|---|
| `MP_ACCESS_TOKEN` | Access Token de MercadoPago (empieza con `TEST-` en sandbox) |
| `SITE_URL` | URL pública de la app (no puede ser localhost) |

### Configurar el webhook en MercadoPago
En el portal de desarrolladores de MP:
- **URL**: `https://TU_PROJECT_REF.supabase.co/functions/v1/mp-webhook`
- **Eventos**: `subscription_preapproval`

### ¿Cuándo hacer deploy?
| Acción | Frecuencia |
|---|---|
| `npm run dev` | Cada vez que trabajás en el frontend |
| `supabase functions deploy` | Solo cuando modificás el código de una Edge Function |
| `supabase secrets set` | Una sola vez (quedan guardados en Supabase) |

### Tarjetas de prueba (sandbox)
Usar las tarjetas de prueba que provee MercadoPago en su documentación de desarrolladores para simular pagos sin dinero real.

---

## Problemas encontrados y soluciones

| Problema | Causa | Solución |
|---|---|---|
| Edge Function devuelve 401 "Missing authorization header" | Función no deployada todavía | Hacer deploy con `supabase functions deploy` |
| Edge Function devuelve 401 "Invalid JWT" | El gateway de Supabase rechaza el JWT antes de que corra el código | Deploy con `--no-verify-jwt` |
| Error "No se pudo crear el plan en MercadoPago" | El endpoint `/preapproval_plan` falla con credenciales TEST | Simplificado: crear el preapproval directamente en `/preapproval` sin necesidad de un plan previo |
| Error "Invalid value for back_url, must be a valid URL" | MP no acepta `http://localhost` como back_url | Setear `SITE_URL` con una URL pública válida (en producción, la URL real de la app) |
