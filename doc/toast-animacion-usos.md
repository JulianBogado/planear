# Toast y animación al registrar uso

**Fecha:** 2026-04-23

## Qué se hizo

En la página `/suscriptores`, al confirmar un registro de uso desde la card de un cliente, se agregaron dos mejoras de feedback visual:

### 1. Toast de confirmación

`handleRegister()` en `SubscriberCard` (Subscribers.jsx) ahora captura el resultado de `onRegisterUse()` y muestra:
- Toast verde "Uso registrado" si la operación fue exitosa.
- Toast rojo "Error al registrar el uso" si hubo un error.

Usa el sistema de toasts existente (`useToast` / `ToastContext`).

### 2. Animación del contador de usos restantes

Cuando el prop `uses_remaining` del suscriptor cambia, el número en la card hace un breve "pop":
- Escala de 1 → 1.28 → 1 en 450ms.
- Temporalmente toma el color `brand-600` y `font-semibold`.

Implementado con `useEffect` + `useRef` para detectar el cambio, estado `usesAnimating` para aplicar/quitar la clase, y el keyframe `@keyframes uses-pop` / `.animate-uses-pop` agregado en `index.css`.
