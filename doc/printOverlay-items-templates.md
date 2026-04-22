# PrintOverlay — nombre del negocio + campo items en templates

**Fecha:** 2026-04-21

---

## 1. Nombre del negocio en PrintOverlay

**Archivo:** `src/components/PrintOverlay.jsx`

El nombre del negocio ya existía en los tres estilos de tarjeta. Se ajustó su visibilidad para que sea apenas perceptible (marca sutil, no protagonista):

| Estilo | Antes | Después |
|--------|-------|---------|
| `linea` | `text-[9px] font-bold uppercase` con color brand | `text-[8px] font-medium uppercase text-stone-300` |
| `panel` | `text-[9px] font-bold uppercase text-white/50` | `text-[8px] font-medium uppercase text-white/30` |
| `solido` | `text-[9px] font-bold uppercase text-white/50` | `text-[8px] font-medium uppercase text-white/30` |

---

## 2. Campo `items` en templates

**Archivo:** `src/constants/templates.js`

El formulario de edición de planes ya tenía el campo "Incluye" (`items: []` en `EMPTY_FORM` y `plan.items ?? []` al cargar). Los templates no lo incluían, quedando desincronizados.

Se agregó `items: []` a todos los templates del objeto `TEMPLATES`. Los valores quedan vacíos — cada negocio puede completarlos al editar el plan.

**Campo en el plan:**
```js
{ name: '...', description: '...', price: 0, total_uses: 0, duration_days: 30, items: [] }
```

El array `items` se renderiza en los carteles de impresión (`PrintOverlay`) bajo el título "Incluye", y también en la vista de plan en `/servicios`.
