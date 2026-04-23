# Bugfix: botón configuración de agenda no hacía scroll a la sección

**Fecha:** 2026-04-23

## Problema

El botón de configuración (⚙) en `/agenda` navegaba a `/configuracion#agenda-seccion`, pero al llegar a Settings la página quedaba en el tope y no bajaba a la sección de agenda.

## Causa raíz

Dos problemas combinados:

1. El div de la sección "Agenda y reservas" en Settings.jsx no tenía `id="agenda-seccion"`, por lo que el hash no tenía elemento target.
2. `ScrollToTop.jsx` hace `window.scrollTo(0, 0)` en cada cambio de pathname, cancelando cualquier scroll hash nativo del browser.

## Fix

En `Settings.jsx`:

- Se agregó `id="agenda-seccion"` al div contenedor de la sección de agenda.
- Se agregó un `useEffect` que detecta `location.hash === '#agenda-seccion'` y llama `scrollIntoView({ behavior: 'smooth' })` con un delay de 100ms para ejecutarse después de ScrollToTop.

```js
const location = useLocation()
useEffect(() => {
  if (location.hash === '#agenda-seccion') {
    const el = document.getElementById('agenda-seccion')
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100)
  }
}, [location.hash])
```

## Archivos modificados

- `src/pages/Settings.jsx` — id en sección agenda + useEffect de scroll hash
