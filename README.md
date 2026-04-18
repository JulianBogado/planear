# PLANE.AR — SubsManager

Plataforma SaaS multiusuario para que pequeños negocios administren suscripciones y membresías de clientes. Reemplazo digital del cuaderno físico: control de usos, vencimientos, renovaciones y turnos en un solo lugar.

---

## Stack

| Tecnología | Versión |
|------------|---------|
| React | 19 |
| Vite | 8 |
| Tailwind CSS | 3.4 |
| React Router DOM | v7 |
| Supabase JS | 2.x |
| date-fns | v4 |
| lucide-react | latest |
| recharts | 3.x |
| react-helmet-async | 3.x |

---

## Setup local

```bash
# 1. Clonar e instalar dependencias
cd subsmanager
npm install

# 2. Crear archivo de variables de entorno
cp .env.example .env
# Editar .env con las credenciales de Supabase

# 3. Levantar el servidor de desarrollo
npm run dev
```

---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anon pública de Supabase |
| `VITE_SUPERUSER_EMAIL` | Email con acceso admin irrestricto |

---

## Estructura del proyecto

```
src/
├── App.jsx                    → Router principal + guardas de autenticación
├── main.jsx                   → Entry point
├── index.css                  → Estilos globales + variables CSS para temas
│
├── components/
│   ├── PrintOverlay.jsx       → Overlay de impresión de planes (createPortal)
│   ├── ScrollToTop.jsx        → Scroll al top en cada cambio de ruta
│   ├── layout/
│   │   ├── AppLayout.jsx      → Layout de la app protegida
│   │   ├── PublicNavbar.jsx   → Navbar de páginas públicas
│   │   └── PublicFooter.jsx   → Footer de páginas públicas
│   ├── seo/
│   │   ├── SEOHead.jsx        → Meta tags con react-helmet-async
│   │   └── StructuredData.jsx → JSON-LD para rich snippets
│   └── ui/
│       ├── Badge.jsx
│       ├── DatePicker.jsx     → Input + popover con MiniCalendar integrado
│       ├── Button.jsx
│       ├── EmptyState.jsx
│       ├── Input.jsx          → También exporta Textarea, Select
│       ├── MiniCalendar.jsx
│       ├── Modal.jsx
│       ├── Skeleton.jsx       → También exporta variantes pre-armadas
│       ├── StatusBadge.jsx    → Badge de estado de suscripción
│       └── UpgradeModal.jsx
│
├── context/
│   ├── AuthContext.jsx        → Sesión de usuario (useAuth)
│   ├── ThemeContext.jsx       → Sistema de temas (useTheme, THEMES, PALETTE_META)
│   └── ToastContext.jsx       → Notificaciones toast (useToast)
│
├── hooks/
│   ├── useAppointments.js     → Turnos: CRUD, slots disponibles, vista semana/mes
│   ├── useAvailability.js     → Disponibilidad horaria del negocio
│   ├── useBusiness.js         → Datos del negocio del usuario autenticado
│   ├── useIsAdmin.js          → Verificación de superusuario via RPC
│   ├── usePlans.js            → CRUD de planes + carga de templates
│   ├── useStats.js            → Estadísticas de uso e ingresos
│   ├── useSubscribers.js      → CRUD de suscriptores + usos + renovaciones
│   └── useSubscription.js     → Tier del negocio y feature flags
│
├── constants/
│   ├── templates.js           → Rubros y planes pre-armados por categoría
│   └── tiers.js               → Definición de tiers free/starter/pro
│
├── lib/
│   └── supabase.js            → Cliente de Supabase
│
├── pages/
│   ├── Agenda.jsx             → /agenda — Calendario de turnos
│   ├── ComoFunciona.jsx       → /como-funciona — Pública
│   ├── Contacto.jsx           → /contacto — Pública
│   ├── Dashboard.jsx          → /dashboard — Panel principal
│   ├── Help.jsx               → /ayuda — Soporte
│   ├── Inicio.jsx             → / — Landing page
│   ├── Login.jsx              → /login
│   ├── Onboarding.jsx         → /onboarding — Setup inicial
│   ├── Planes.jsx             → /planes — Landing de planes (marketing)
│   ├── Plans.jsx              → /servicios — Gestión de planes del negocio
│   ├── Pricing.jsx            → /precios — Pública
│   ├── PublicBooking.jsx      → /reservar/:slug — Reserva sin auth
│   ├── Register.jsx           → /register
│   ├── Settings.jsx           → /configuracion
│   ├── Stats.jsx              → /estadisticas
│   ├── SubscriberDetail.jsx   → /suscriptores/:id
│   └── Subscribers.jsx        → /suscriptores
│
└── utils/
    └── status.js              → computeStatus() — lógica de estado de suscripción
```

---

## Base de datos (Supabase)

### Esquema

```sql
-- Negocio del usuario
businesses (id, user_id, name, category, tier, theme, slug,
            phone, instagram, facebook, tiktok, address, agenda_enabled,
            mp_subscription_id, mp_status, subscription_ends_at)

-- Planes/paquetes que ofrece el negocio
plans (id, business_id, name, description, price,
       total_uses, duration_days, is_template, items text[])

-- Clientes suscriptos
subscribers (id, business_id, plan_id, name, phone, dni, notes,
             start_date, end_date, uses_remaining, status)

-- Registro de cada uso consumido
usage_logs (id, subscriber_id, business_id, used_at, notes)

-- Pagos de renovaciones
payments (id, subscriber_id, amount, paid_at, notes)

-- Turnos agendados
appointments (id, business_id, subscriber_id, slot_start, slot_end,
              client_name, client_dni, notes, status,
              use_logged, cancel_reason)
-- appointments.status: 'pending' | 'confirmed' | 'cancelled'

-- Configuración horaria de la agenda (múltiples filas por negocio)
business_availability (id, business_id, days_of_week,
                       start_time, end_time, slot_duration, advance_days,
                       block_name, slot_capacity)

-- Mensajes de soporte
support_messages (id, business_id, message, created_at)
```

### Migración requerida

Si la columna `cancel_reason` no existe aún en `appointments`:

```sql
ALTER TABLE appointments ADD COLUMN cancel_reason text;
```

### Agenda multi-bloque y capacidad

`business_availability` admite múltiples filas por negocio (se eliminó la constraint UNIQUE). Cada fila es una franja horaria independiente con `block_name` y `slot_capacity`. Ver `doc/mejorasAgenda.md` para detalle completo.

### Seguridad de tiers

Aplicada como migración en Supabase. Crea funciones `get_effective_tier`, `can_add_subscriber`, `can_add_plan`, `_tier_fields_unchanged` y políticas RESTRICTIVE en `businesses`, `subscribers` y `plans`. Ver CLAUDE.md para detalle completo.

---

## Sistema de temas

La app soporta 4 temas visuales configurables por negocio:

| Tema | Color base | Descripción |
|------|-----------|-------------|
| `rosa` | `#c96b61` | Default — coral/rosa |
| `salvia` | `#507758` | Verde |
| `lila` | `#6357aa` | Púrpura |
| `celeste` | `#2785aa` | Azul — identidad PLANE.AR |

Los temas funcionan mediante CSS custom properties (`--brand-600`, `--bg`, etc.) definidas en `index.css`. Tailwind las consume a través de `tailwind.config.js`. El tema activo se aplica con el atributo `data-theme` en `<html>` y se guarda en `businesses.theme`.

---

## Tiers de suscripción

| Tier | Precio | Suscriptores | Planes | Imprimir | Stats | Agenda |
|------|--------|-------------|--------|----------|-------|--------|
| `free` | Gratis | 5 | 2 | ✗ | ✗ | ✗ |
| `starter` | $25.000/mes | 50 | 3 | ✓ | ✗ | ✗ |
| `pro` | $30.000/mes | Ilimitado | Ilimitado | ✓ | ✓ | ✓ |

Usar el hook `useSubscription(business)` para verificar permisos en componentes.

---

## Rubros soportados

peluqueria · manicura · floreria · entrenador · yoga · bar · estetica · lashista · masajista · dermatologa · vinoteca · otro

Cada rubro tiene planes pre-armados en `src/constants/templates.js`.

---

## Comandos

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # ESLint
```
