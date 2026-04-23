# Analytics — Google Analytics 4

**Fecha:** 2026-04-23

## Qué se implementó

Integración de Google Analytics 4 para tracking de marketing en páginas públicas.

**Paquete:** `react-ga4`

## Archivos

| Archivo | Rol |
|---------|-----|
| `src/lib/analytics.js` | Wrapper: `initGA()`, `trackPageView()`, `trackEvent()` |
| `src/components/GATracker.jsx` | Componente null que dispara `trackPageView` en cada cambio de ruta |
| `src/main.jsx` | Llama `initGA()` al arrancar la app |
| `src/App.jsx` | Monta `<GATracker />` dentro de `<BrowserRouter>` |

## Variable de entorno

```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Para obtener el Measurement ID:
1. Ir a [analytics.google.com](https://analytics.google.com)
2. Crear una propiedad GA4 para plane.ar
3. En Administración → Flujos de datos → Web → copiar el Measurement ID (`G-...`)
4. Pegarlo en `.env.local` y en las variables de entorno del servidor de producción

Si la variable no está definida, `initGA()` es no-op (no rompe nada en desarrollo).

## Eventos trackeados

| Evento | Dónde | Cuándo |
|--------|-------|--------|
| `pageview` (automático) | `GATracker.jsx` | Cada cambio de ruta |
| `sign_up` | `Register.jsx` | Al completar el registro exitosamente |
| `cta_click` (label: `hero`) | `Inicio.jsx` | Clic en botón "Empezá gratis" del hero |
| `cta_click` (label: `bottom_cta`) | `Inicio.jsx` | Clic en botón "Empezá gratis" del CTA inferior |

## Cómo verificar en GA4 DebugView

1. Instalar la extensión de Chrome "Google Analytics Debugger"
2. Activarla y navegar por la app
3. En GA4: Configuración → DebugView — los eventos aparecen en tiempo real
