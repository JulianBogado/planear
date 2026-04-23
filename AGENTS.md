# PLANE.AR — AGENTS.md

Guía operativa para agentes que trabajen en este repositorio. Este archivo no reemplaza el `README.md`: el README es para onboarding humano; este documento define contexto, restricciones y decisiones que un agente debe respetar al tocar código.

## Cómo usar este archivo

- Leer este archivo antes de hacer cambios relevantes.
- Priorizar `AGENTS.md` para convenciones, trampas y decisiones de arquitectura.
- Usar `README.md` para setup local, comandos y visión general.
- Si una implementación agrega reglas, restricciones o flujos nuevos, actualizar este archivo.
- Si una implementación merece documentación funcional o técnica, crear un `.md` en `doc/` con fecha y resumen de lo realizado.

## Producto

- Nombre comercial: `PLANE.AR` (antes `SubsManager`).
- Tipo: SaaS multiusuario para pequeños negocios con suscripciones, membresías y turnos.
- Estado: app funcional, en desarrollo activo.
- Idioma de la UI: español argentino siempre.

## Stack

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 19 | UI |
| Vite | 8 | Build |
| Tailwind CSS | 3.4 | Estilos |
| React Router DOM | v7 | Routing |
| Supabase JS | 2.x | Auth + PostgreSQL |
| date-fns | v4 | Fechas |
| lucide-react | latest | Íconos |
| recharts | 3.x | Gráficos |
| react-helmet-async | 3.x | SEO |

## Skills locales disponibles

Estos skills viven en `subsmanager/.agents/skills/` y conviene revisarlos cuando la tarea coincide claramente con su alcance.

| Skill | Ruta | Cuándo usarlo |
|------|------|---------------|
| `programmatic-seo` | `.agents/skills/programmatic-seo/SKILL.md` | Páginas SEO generadas por plantilla, landings a escala, páginas por ubicación, comparativas o integraciones |
| `security-review` | `.agents/skills/security-review/SKILL.md` | Auditorías de seguridad, búsqueda de vulnerabilidades, revisión OWASP, auth/autorización/XSS/inyección |
| `supabase` | `.agents/skills/supabase/SKILL.md` | Cualquier tarea con Supabase: auth, RLS, migraciones, edge functions, cliente JS, CLI |
| `supabase-postgres-best-practices` | `.agents/skills/supabase-postgres-best-practices/SKILL.md` | Optimización SQL, diseño de schema, índices, performance de Postgres y RLS |
| `vercel-react-best-practices` | `.agents/skills/vercel-react-best-practices/SKILL.md` | Refactors o implementaciones React enfocadas en performance, carga, waterfalls y bundle |
| `web-design-guidelines` | `.agents/skills/web-design-guidelines/SKILL.md` | Review de UI, accesibilidad, UX y cumplimiento de guidelines visuales |

Regla práctica:
- Si la tarea cae claramente dentro de uno de esos dominios, revisar primero el `SKILL.md` correspondiente antes de implementar o auditar.

## Reglas de trabajo

- No introducir texto de UI en inglés.
- No comparar email del usuario para lógica de admin. El admin se valida solo vía RPC `is_admin()`.
- No llamar `useBusiness()` dentro de páginas protegidas. Usar `useOutletContext()`.
- No confundir `/planes` con `/servicios`.
- No replicar patrones legacy solo porque todavía existan en algunos archivos.
- Documentar implementaciones nuevas cuando cambien comportamiento, arquitectura o flujos importantes.

## Variables de entorno

Archivo local: `subsmanager/.env.local`

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Nota importante:
- `VITE_SUPERUSER_EMAIL` fue eliminado del frontend en la review de seguridad del `2026-04-19`.
- La verificación de admin se hace exclusivamente con `src/hooks/useIsAdmin.js` y la RPC `is_admin()`.

## Rutas que conviene recordar

### Públicas

| Ruta | Componente | Nota |
|------|-----------|------|
| `/` | `Inicio` | Landing principal |
| `/como-funciona` | `ComoFunciona` | Explicación del producto |
| `/planes` | `Planes` | Marketing, no CRUD |
| `/precios` | `Pricing` | Precios |
| `/login` | `Login` | Auth |
| `/register` | `Register` | Registro |
| `/email-confirmado` | `EmailConfirmado` | Confirmación de email |
| `/contacto` | `Contacto` | Contacto |
| `/reservar/:slug` | `PublicBooking` | Reserva pública |

### Protegidas sin negocio

| Ruta | Componente |
|------|-----------|
| `/onboarding` | `Onboarding` |

### Protegidas con negocio

| Ruta | Componente | Nota |
|------|-----------|------|
| `/dashboard` | `Dashboard` | Panel principal |
| `/suscriptores` | `Subscribers` | Listado |
| `/suscriptores/:id` | `SubscriberDetail` | Detalle |
| `/servicios` | `Plans` | CRUD real de planes |
| `/estadisticas` | `Stats` | Solo pro o admin |
| `/agenda` | `Agenda` | Turnos |
| `/ayuda` | `Help` | Soporte |
| `/configuracion` | `Settings` | Configuración |

Trampa frecuente:
- `/planes` es una landing pública.
- `/servicios` es la gestión privada de planes del negocio.

## Arquitectura y patrones

### Guards

```text
BrowserRouter
├── rutas públicas
├── OnboardingGuard
│   └── /onboarding
└── AppGuard
    └── AppLayout
        └── páginas protegidas
```

### Outlet context

Las páginas protegidas reciben `business` y `updateBusiness` desde `AppLayout`.

```jsx
<Outlet context={{ business, updateBusiness }} />
```

```jsx
const { business, updateBusiness } = useOutletContext()
```

Regla:
- En páginas protegidas, usar el outlet context.
- Reservar `useBusiness()` para capas donde realmente corresponda.

### Sistema de temas

- Temas disponibles: `rosa`, `salvia`, `lila`, `celeste`.
- `celeste` (`#2785aa`) es el color más ligado a la identidad visual de PLANE.AR.
- Los temas viven en `src/index.css` con custom properties y se aplican por `data-theme` en `<html>`.
- `ThemeContext` sincroniza tema con `localStorage` y `businesses.theme`.

### Estado de suscripción

La lógica está en `src/utils/status.js` mediante `computeStatus(end_date, uses_remaining)`.

| Status | Regla |
|--------|-------|
| `no_uses` | `uses_remaining <= 0` |
| `expired` | fecha vencida |
| `expiring_soon` | vencimiento entre 0 y 6 días |
| `active` | 7 días o más restantes |

El estado se recalcula al leer y al mutar suscriptores en `useSubscribers`.

### Tiers

Usar `useSubscription(business)` para permisos de UI y feature flags.

| Tier | Suscriptores | Planes | Print | Stats | Agenda |
|------|-------------|--------|-------|-------|--------|
| `free` | 5 | 2 | no | no | no |
| `starter` | 15 | 3 | sí | no | no |
| `pro` | ilimitado | ilimitado | sí | sí | sí |

## Archivos y puntos importantes

### Núcleo

- `src/App.jsx`: router y guards.
- `src/components/layout/AppLayout.jsx`: layout protegido y outlet context.
- `src/context/AuthContext.jsx`: sesión.
- `src/context/ThemeContext.jsx`: tema.
- `src/lib/supabase.js`: cliente Supabase.

### Hooks críticos

- `src/hooks/useAppointments.js`
  Regla: `useWeekAppointments(businessId, weekStartStr)` recibe string `yyyy-MM-dd`, no `Date`.
- `src/hooks/useBusiness.js`
  Devuelve `{ business, loading, updateBusiness }`.
- `src/hooks/useIsAdmin.js`
  Única vía válida en frontend para detectar superusuario.
- `src/hooks/usePlans.js`
  CRUD y templates.
- `src/hooks/useStats.js`
  Datos de estadísticas.
- `src/hooks/useSubscribers.js`
  CRUD, usos, renovación y recálculo de status.
- `src/hooks/useSubscription.js`
  Permisos por tier.

### Páginas con más riesgo funcional

- `src/pages/Agenda.jsx`
  Maneja vistas día/semana, alta de turnos, cancelación y estados.
- `src/pages/PublicBooking.jsx`
  Reserva pública por DNI, guest booking y WhatsApp.
- `src/pages/Register.jsx`
  No debe mandar al onboarding antes de confirmar email.
- `src/pages/Settings.jsx`
  Config del negocio, tema, agenda y datos sensibles del negocio.
- `src/pages/Stats.jsx`
  Debe respetar gating por tier pro/admin.

### UI reutilizable

- Importar componentes desde `src/components/ui/`.
- `StatusBadge` está en `src/components/ui/StatusBadge.jsx`.

## Base de datos

### Tablas principales

| Tabla | Notas |
|-------|------|
| `profiles` | Perfil vinculado a `auth.users.id` |
| `businesses` | Negocio, tier, tema, agenda, Mercado Pago |
| `plans` | Planes del negocio |
| `subscribers` | Suscriptores y vigencia |
| `usage_logs` | Consumos |
| `payments` | Pagos |
| `appointments` | Turnos |
| `business_availability` | Bloques horarios múltiples |
| `support_messages` | Soporte |

### RPC públicas/clave

| Función | Uso |
|---------|-----|
| `is_admin()` | Validación de superusuario |
| `public_get_booked_slots(...)` | Slots ya reservados |
| `public_lookup_subscriber(...)` | Lookup por DNI |
| `public_check_existing_booking(...)` | Turno pendiente existente |
| `public_cancel_appointment(...)` | Cancelación pública |
| `public_book_appointment(...)` | Alta pública de turno |

## Seguridad y restricciones

### Admin

- No resolver permisos de admin por email en frontend.
- Usar siempre `is_admin()`.

### Enforcement de tiers

Los límites viven en dos capas:
- Frontend: `useSubscription`.
- Base de datos: funciones `SECURITY DEFINER` + policies `RESTRICTIVE`.

Funciones auxiliares:
- `get_effective_tier(business_id)`
- `can_add_subscriber(business_id)`
- `can_add_plan(business_id)`
- `_tier_fields_unchanged(...)`

Policies relevantes:
- `businesses_protect_tier_fields`
- `subscribers_insert_tier_limit`
- `plans_insert_tier_limit`

Nota:
- `service_role` no queda afectado por estas restricciones y se usa en edge functions.

### Agenda pública

El campo `businesses.allow_guest_bookings` controla si una persona sin suscripción activa puede reservar en `/reservar/:slug`.

- `false`: solo suscriptores.
- `true`: también invitados.

Esto se administra desde Settings.

## Fechas y formato

- Para guardar en DB: `format(date, 'yyyy-MM-dd')`.
- Para mostrar: `dd/MM/yy` o `dd/MM/yyyy`.
- Al parsear fechas de Supabase, agregar `T00:00:00` para evitar problemas de timezone.

Ejemplo:

```js
new Date(sub.end_date + 'T00:00:00')
```

## Estadísticas

Página: `src/pages/Stats.jsx`

Hook:
- `useStats(businessId)` devuelve `usageByWeek`, `totalRevenue`, `recentRevenue`, `loading`.

Restricción:
- Solo disponible para `pro` o admin.

## Mercado Pago

Edge functions en `supabase/functions/`:

| Función | Uso |
|---------|-----|
| `create-subscription` | Crea preapproval |
| `mp-webhook` | Actualiza tier y vencimiento |

Decisiones importantes:
- `external_reference` se envía como `${tier}:${userId}`.
- El webhook busca negocio primero por `mp_subscription_id`, luego por `user_id` desde `external_reference`, y recién después por email.
- Si `business.is_promo = true`, el webhook no debe tocar `tier` ni `subscription_ends_at`.

## Acceso promocional pro

Campo: `businesses.is_promo boolean default false`

Comportamiento:
- Permite acceso pro sin cobro.
- Tiene panel admin en `/admin`.
- Usa RPCs `admin_list_businesses()`, `admin_update_user(...)`, `admin_delete_user(uuid)`.
- `admin_delete_user` debe borrar respetando el orden de FK.
- La policy `businesses_admin_update` habilita updates cross-business para admin.

Referencia:
- `doc/promo-access.md`
- `doc/admin-panel-v2.md`

## No implementado todavía

- WhatsApp o emails automáticos.
- Selección de ítems o combos en turnos (`appointment_items` diseñado, no implementado).
- App móvil nativa.
- Guest mode con verificación SMS OTP.

## Checklist mental antes de tocar algo

- ¿Estoy respetando español argentino en la UI?
- ¿Estoy usando el guard, hook o contexto correcto?
- ¿Estoy tocando una ruta pública de marketing o una ruta privada real?
- ¿Estoy rompiendo reglas de tier o seguridad admin?
- ¿El cambio requiere actualizar este archivo o crear una nota en `doc/`?
