# Mejoras al Onboarding: campos de contacto + paleta de colores

**Fecha:** 2026-04-19

## Cambios implementados

### 1. `src/pages/Onboarding.jsx` — campos de contacto opcionales

El paso 1 del wizard ("¿Cómo se llama tu negocio?") ahora incluye tres campos opcionales debajo del nombre:
- **Teléfono**
- **Dirección**
- **Instagram** (sin @)

Los campos están separados visualmente con una línea y el texto "Información de contacto · podés completarlo después".

`handleFinish()` los incluye en el INSERT a `businesses`:
```js
{ phone: phone.trim() || null, address: address.trim() || null, instagram: instagram.trim() || null }
```

Los campos son `null` si se dejan vacíos — no rompen el flujo. Quedan persistidos en la tabla `businesses` y aparecen pre-cargados en Configuración en el próximo inicio de sesión.

### 2. `src/context/ThemeContext.jsx` — paleta de colores por defecto

Cambiado el fallback del tema de `"rosa"` a `"celeste"`:
```js
return THEMES.includes(stored) ? stored : "celeste"
```

**Efecto:**
- Páginas públicas (Register, Login, Onboarding, EmailConfirmado) ahora muestran el azul de PLANE.AR (`#2785aa`) en todos los elementos que usan `brand-600`
- Usuarios nuevos sin tema guardado en localStorage → celeste por defecto
- Usuarios existentes con tema guardado → sin cambios (localStorage prevalece)
