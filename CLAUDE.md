# PLANE.AR — Guía para agentes de IA

Esta guía resume todo lo que un subagente necesita saber para trabajar en este proyecto sin tener que explorar el código desde cero.

---

## Implementaciones nuevas

Siempre que lo amerite, sumar las implementaciones nuevas a claude.md y readme.md para llevar un control.

Cada vez que haga una nueva implentación debe quedar asentada en una carpeta que se llame doc y el nombre de la nueva implementación en un archivo .md. Dentro del archivo va la fecha y lo realizado.


## Identidad del producto

- **Nombre comercial:** PLANE.AR (anteriormente SubsManager)
- **Qué hace:** Plataforma multiusuario SaaS para que pequeños negocios (peluquerías, manicuras, vinotecas, entrenadores, etc.) administren suscripciones y membresías de clientes. Reemplazo del cuaderno físico.
- **Estado:** App funcional, en desarrollo activo.
- **Idioma de la UI:** Español argentino en todo momento.

---

## Stack técnico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 19 | UI |
| Vite | 8 | Build tool |
| Tailwind CSS | 3.4 | Estilos (con CSS custom properties para theming) |
| React Router DOM | v7 | Routing |
| Supabase JS | 2.x | Auth + base de datos PostgreSQL |
| date-fns | v4 | Manejo de fechas |
| lucide-react | latest | Íconos |
| recharts | 3.x | Gráficos en Stats |
| react-helmet-async | 3.x | SEO meta tags |

---

## Variables de entorno

Archivo: `subsmanager/.env`

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SUPERUSER_EMAIL=...
```

El `VITE_SUPERUSER_EMAIL` habilita acceso a vistas especiales (Stats, Agenda) sin importar el tier del negocio.

---

## Rutas

### Públicas

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | `Inicio` | Landing page con rubros, testimoniales y CTA |
| `/como-funciona` | `ComoFunciona` | Explicación del producto |
| `/planes` | `Planes` | Landing de planes/precios (MARKETING — no es la gestión de planes) |
| `/precios` | `Pricing` | Página de precios |
| `/login` | `Login` | Login |
| `/register` | `Register` | Registro |
| `/contacto` | `Contacto` | Formulario de contacto |
| `/reservar/:slug` | `PublicBooking` | Reserva de turno pública (sin autenticación) |

### Protegidas — requieren usuario sin negocio

| Ruta | Componente |
|------|-----------|
| `/onboarding` | `Onboarding` — wizard de configuración inicial |

### Protegidas — requieren usuario + negocio (`AppGuard`)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/dashboard` | `Dashboard` | Panel principal con stats y lista de clientes |
| `/suscriptores` | `Subscribers` | Listado y gestión de suscriptores |
| `/suscriptores/:id` | `SubscriberDetail` | Ficha de suscriptor individual |
| `/servicios` | `Plans` | CRUD de planes del negocio |
| `/estadisticas` | `Stats` | Estadísticas (requiere tier pro o superuser) |
| `/agenda` | `Agenda` | Calendario de turnos |
| `/ayuda` | `Help` | Ayuda y soporte |
| `/configuracion` | `Settings` | Configuración del negocio |

> ⚠️ **Trampa frecuente:** `/planes` es la landing pública de marketing. `/servicios` es la gestión privada de planes del negocio. NO son lo mismo.

---

## Estructura de carpetas

```
subsmanager/
├── .env                           → Variables de entorno (no commitear)
└── src/
    ├── App.jsx                    → Router + guards (AppGuard, OnboardingGuard)
    ├── main.jsx                   → Entry point
    ├── index.css                  → Themes CSS vars (4 temas: rosa/salvia/lila/celeste)
    ├── components/
    │   ├── PrintOverlay.jsx       → Portal de impresión de planes (createPortal)
    │   ├── ScrollToTop.jsx        → Auto-scroll al top en cada navegación
    │   ├── layout/
    │   │   ├── AppLayout.jsx      → Layout protegido: nav desktop + bottom nav mobile + config dropdown
    │   │   ├── PublicNavbar.jsx   → Navbar para páginas públicas
    │   │   └── PublicFooter.jsx   → Footer para páginas públicas
    │   ├── seo/
    │   │   ├── SEOHead.jsx        → Helmet meta tags
    │   │   └── StructuredData.jsx → JSON-LD structured data
    │   └── ui/
    │       ├── Badge.jsx          → Badge de colores (green/yellow/red/gray/brand)
    │       ├── Button.jsx         → Variants: primary, outline, ghost; sizes: sm/md/lg; loading
    │       ├── DatePicker.jsx     → Input + popover con MiniCalendar; props: value ('yyyy-MM-dd'), onChange, label
    │       ├── EmptyState.jsx     → Placeholder con ícono, título, descripción y acción
    │       ├── Input.jsx          → Input + Textarea + Select (todos exportados)
    │       ├── MiniCalendar.jsx   → Calendario mensual con busy dots y double-click
    │       ├── Modal.jsx          → Modal con backdrop blur y close por escape
    │       ├── Skeleton.jsx       → Base skeleton + SubscriberCardSkeleton, PlanCardSkeleton, StatsSkeleton
    │       ├── StatusBadge.jsx    → Mapea status enum → Badge coloreado
    │       └── UpgradeModal.jsx   → Modal de upgrade de tier
    ├── context/
    │   ├── AuthContext.jsx        → user, session, loading, signOut — useAuth()
    │   ├── ThemeContext.jsx       → theme, setTheme, syncFromBusiness, THEMES, PALETTE_META — useTheme()
    │   └── ToastContext.jsx       → showToast(message, type) — useToast()
    ├── hooks/
    │   ├── useAppointments.js     → useAppointments(businessId, date)
    │   │                            useTodayTomorrowAppointments(businessId)
    │   │                            useMonthAppointments(businessId, year, month) → [dates, refetch]
    │   │                            usePastPendingAppointments(businessId)
    │   │                            useWeekAppointments(businessId, weekStartStr) ⚠️ weekStart debe ser string 'yyyy-MM-dd', no Date
    │   │                            usePublicAvailability(slug) — también trae business.phone
    │   │                            getAvailableSlots(blocks, dateStr, existing) — acepta array o objeto único; soporta slot_capacity > 1
    │   ├── useAvailability.js     → useAvailability(business) — config de agenda + slug
    │   ├── useBusiness.js         → useBusiness(userId) → { business, loading, updateBusiness }
    │   ├── useIsAdmin.js          → useIsAdmin() — llama RPC is_admin(), devuelve boolean
    │   ├── usePlans.js            → usePlans(businessId) — CRUD + loadTemplates + wipeAndReload
    │   ├── useStats.js            → useStats(businessId) — usageByWeek, totalRevenue, recentRevenue
    │   ├── useSubscribers.js      → useSubscribers(businessId) — CRUD + registerUse + renewSubscriber
    │   └── useSubscription.js     → useSubscription(business) — tier, canAddSubscriber, canAddPlan,
    │                                canPrint, canStats, canReserve
    ├── constants/
    │   ├── templates.js           → CATEGORIES (12 rubros con íconos lucide)
    │   │                            TEMPLATES (planes pre-armados por rubro)
    │   └── tiers.js               → TIER_LIMITS (maxSubscribers/maxPlans/features por tier)
    │                                TIER_INFO (precios y descripciones)
    ├── lib/
    │   └── supabase.js            → createClient(...) → export supabase
    ├── pages/
    │   ├── Agenda.jsx             → Calendar + vistas día/semana (7 días desde selectedDate) + selector de suscriptor al crear turno + turnos sin confirmar + modal cancelación con motivo
    │   ├── ComoFunciona.jsx       → Pública: cómo funciona + casos de uso
    │   ├── Contacto.jsx           → Pública: formulario de contacto
    │   ├── Dashboard.jsx          → Panel principal; turnos próximos: hoy + mañana + resto de la semana (7 días desde hoy via useWeekAppointments)
    │   ├── Help.jsx               → Ayuda y soporte
    │   ├── Inicio.jsx             → Landing: rubros, testimoniales, features, CTA
    │   ├── Landing.jsx            → ⚠️ Archivo legacy, NO está en el router
    │   ├── Login.jsx              → Auth login
    │   ├── Onboarding.jsx         → Wizard: nombre negocio → rubro → plantillas de planes
    │   ├── Planes.jsx             → Pública: info de planes PLANE.AR (marketing)
    │   ├── Plans.jsx              → Privada /servicios: CRUD de planes del negocio
    │   ├── Pricing.jsx            → Pública: tabla de precios
    │   ├── PublicBooking.jsx      → Pública: reserva por DNI; si suscripción vencida/sin usos muestra tarjeta con botón WhatsApp (business.phone) y opción guest
    │   ├── Register.jsx           → Registro
    │   ├── Settings.jsx           → Config del negocio: nombre, rubro, redes, tema, agenda
    │   ├── Stats.jsx              → Estadísticas (tier pro / superuser)
    │   ├── SubscriberDetail.jsx   → Ficha de suscriptor: info, uso, historial, pagos
    │   └── Subscribers.jsx        → Lista de suscriptores con filtros y buscador
    └── utils/
        └── status.js              → computeStatus(end_date, uses_remaining) → {status, label, colorClass}
```

---

## Base de datos (Supabase)

### Tablas principales

| Tabla | Campos clave |
|-------|-------------|
| `businesses` | `id`, `user_id`, `name`, `category`, `tier`, `theme`, `slug`, `phone`, `instagram`, `facebook`, `tiktok`, `address`, `agenda_enabled`, `mp_subscription_id`, `mp_status`, `subscription_ends_at` |
| `plans` | `id`, `business_id`, `name`, `description`, `price`, `total_uses`, `duration_days`, `is_template`, `items` (text[]) |
| `subscribers` | `id`, `business_id`, `plan_id`, `name`, `phone`, `dni`, `notes`, `start_date`, `end_date`, `uses_remaining`, `status` |
| `usage_logs` | `id`, `subscriber_id`, `business_id`, `used_at`, `notes` |
| `payments` | `id`, `subscriber_id`, `amount`, `paid_at`, `notes` |
| `appointments` | `id`, `business_id`, `subscriber_id`, `slot_start`, `slot_end`, `client_name`, `client_dni`, `notes`, `status`, `use_logged`, `cancel_reason` |
| `business_availability` | `id`, `business_id`, `days_of_week[]`, `start_time`, `end_time`, `slot_duration`, `advance_days`, `block_name`, `slot_capacity` — múltiples filas por negocio posibles |
| `support_messages` | `id`, `business_id`, `message`, `created_at` |

### RPC Functions (Supabase)

| Función | Descripción |
|---------|-------------|
| `is_admin()` | Verifica si el usuario actual es superusuario |
| `public_get_booked_slots(p_business_id, p_date)` | Una fila por reserva no cancelada (sin auth) — permite contar capacidad por slot |
| `public_lookup_subscriber(p_business_id, p_dni)` | Busca suscriptor por DNI (sin auth) — devuelve cualquier status, incluido `expired`/`no_uses` |
| `public_check_existing_booking(p_business_id, p_subscriber_id)` | Turno existente pendiente (sin auth) |
| `public_cancel_appointment(p_appointment_id, p_subscriber_id)` | Cancela turno (sin auth) |
| `public_book_appointment(...)` | Crea turno (sin auth) |

---

## Patrones de arquitectura

### Guard Pattern

```
BrowserRouter
  ├── Rutas públicas (sin guard)
  ├── OnboardingGuard → solo si tiene user pero NO business
  │   └── /onboarding
  └── AppGuard → requiere user + business
      └── AppLayout (pasa business via outlet context)
          └── Todas las páginas protegidas
```

### Outlet Context

Todas las páginas protegidas reciben `business` y `updateBusiness` via React Router outlet context. **Nunca** llamar `useBusiness()` directamente dentro de una página protegida.

```js
// AppLayout.jsx:
<Outlet context={{ business, updateBusiness }} />

// Cualquier página protegida:
const { business, updateBusiness } = useOutletContext()
```

### Sistema de temas

4 temas definidos en `src/index.css` como `[data-theme="X"]` con CSS custom properties:
- **rosa** — coral/pink (default)
- **salvia** — verde
- **lila** — púrpura
- **celeste** — azul `#2785aa` (identidad visual de PLANE.AR)

`ThemeContext` aplica el tema al `<html>` con `data-theme` y lo sincroniza con localStorage y el campo `businesses.theme`.

Las clases Tailwind como `text-brand-600`, `bg-brand-50`, `bg-surface`, `bg-surface-tint` usan las variables CSS. Ver `tailwind.config.js`.

### Status de suscripción

Calculado por `src/utils/status.js:computeStatus(end_date, uses_remaining)`:

| Status | Condición | Color |
|--------|-----------|-------|
| `no_uses` | `uses_remaining <= 0` | Rojo |
| `expired` | `daysLeft < 0` | Rojo |
| `expiring_soon` | `daysLeft` entre 0 y 6 | Amarillo |
| `active` | `daysLeft >= 7` | Verde |

El status se recalcula en `useSubscribers` al leer datos y al mutar (crear/actualizar/renovar).

### Tier System

El campo `businesses.tier` controla las features disponibles:

| Tier | Precio | Suscriptores | Planes | Print | Stats | Agenda |
|------|--------|-------------|--------|-------|-------|--------|
| free | $0 | 5 | 2 | ✗ | ✗ | ✗ |
| starter | $25.000/mes | 50 | 3 | ✓ | ✗ | ✗ |
| pro | $30.000/mes | ∞ | ∞ | ✓ | ✓ | ✓ |

Usar `useSubscription(business)` para chequear permisos en componentes.

### Seguridad de tiers (RLS enforcement)

Los límites de tier se aplican en dos capas: frontend (`useSubscription`) + DB (políticas RESTRICTIVE).

**Funciones auxiliares (SECURITY DEFINER):**

| Función | Descripción |
|---------|-------------|
| `get_effective_tier(business_id)` | Devuelve el tier real considerando `subscription_ends_at` (si venció → 'free') |
| `can_add_subscriber(business_id)` | `true` si el negocio puede agregar un suscriptor más según su tier |
| `can_add_plan(business_id)` | `true` si el negocio puede agregar un plan más según su tier |
| `_tier_fields_unchanged(id, tier, ends_at, mp_sub_id, mp_status)` | Helper para la policy de UPDATE en businesses |

**Políticas RESTRICTIVE:**

| Tabla | Política | Qué bloquea |
|-------|----------|-------------|
| `businesses` | `businesses_protect_tier_fields` | UPDATE de `tier`, `subscription_ends_at`, `mp_subscription_id`, `mp_status` por usuarios no-admin |
| `subscribers` | `subscribers_insert_tier_limit` | INSERT cuando se supera el límite del tier |
| `plans` | `plans_insert_tier_limit` | INSERT cuando se supera el límite del tier |

> `service_role` (edge functions) tiene BYPASSRLS y no es afectado. El superusuario (`is_admin()`) puede modificar el tier desde Settings.

---

## Integración Mercado Pago

Edge functions en `supabase/functions/`:

| Función | Descripción |
|---------|-------------|
| `create-subscription` | Crea un preapproval en MP para el tier elegido. Requiere JWT. Devuelve `init_point`. |
| `mp-webhook` | Recibe eventos de MP (`subscription_preapproval`), actualiza `tier` y `subscription_ends_at` en `businesses`. |

El tier se transmite via `external_reference` en el preapproval. El webhook usa `service_role` para actualizar campos protegidos por RLS.

---

## Convenciones

- **Idioma:** Todo en español argentino. Nunca inglés en labels o mensajes de usuario.
- **Fechas para DB:** `format(date, 'yyyy-MM-dd')` con date-fns.
- **Fechas para display:** `format(date, 'dd/MM/yy')` o `'dd/MM/yyyy'`.
- **Parse seguro de fechas:** Al parsear fechas de Supabase, siempre agregar `T00:00:00` para evitar problemas de timezone: `new Date(sub.end_date + 'T00:00:00')`.
- **Verificar superusuario:** Usar `useIsAdmin()` hook. No usar `user?.email === import.meta.env.VITE_SUPERUSER_EMAIL` directamente en componentes (patrón legacy que existe en algunos archivos pero no debe replicarse).
- **Componentes UI:** Importar siempre desde `components/ui/`, nunca desde archivos de páginas.
- **StatusBadge** está en `src/components/ui/StatusBadge.jsx`, no en `Subscribers.jsx`.

---

## Lo que NO está implementado aún (V2+)

- WhatsApp / emails automáticos
- Selección de ítems/combos en turnos (`appointment_items` — schema diseñado, no implementado)
- App móvil nativa
