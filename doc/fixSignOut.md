# Fix: Flujo de cierre de sesión y redirects de auth

**Fecha:** 2026-04-19

## Problema

Al cerrar sesión y navegar a la landing page (`/`), el navbar seguía mostrando "Ir al panel" en lugar de "Iniciar sesión / Registrarse". Presionando "Ir al panel" el usuario llegaba a `/onboarding` sin poder operar.

### Causas identificadas

1. **`signOut()` no limpiaba estado explícitamente:** Solo llamaba `supabase.auth.signOut()` y dependía de `onAuthStateChange` para limpiar `user`/`session`. Si ese evento llegaba tarde o fallaba, el estado quedaba obsoleto.

2. **`AppLayout` no navegaba tras sign out:** Dependía de que `AppGuard` detectara `user = null` y redirigiera. No había `navigate()` explícito.

3. **`Login.jsx` no redirigía usuarios ya autenticados:** Un usuario que confirmaba su email (con sesión activa) y luego iba a `/login` podía quedar en un estado confuso.

4. **`Onboarding.jsx` no tenía opción de cerrar sesión:** Un usuario recién registrado (con sesión activa pero sin negocio) quedaba atrapado en `/onboarding` sin forma de salir.

---

## Cambios implementados

### 1. `src/context/AuthContext.jsx`
`signOut()` ahora limpia el estado React de forma inmediata, sin esperar a `onAuthStateChange`:
```js
async function signOut() {
  await supabase.auth.signOut()
  setUser(null)
  setSession(null)
}
```

### 2. `src/components/layout/AppLayout.jsx`
Los dos botones "Cerrar sesión" (desktop y mobile) ahora navegan a `/` después del sign out:
```jsx
onClick={async () => { await signOut(); navigate('/') }}
```

### 3. `src/pages/Login.jsx`
Redirige automáticamente a `/dashboard` si el usuario ya tiene sesión activa:
```jsx
const { user, loading: authLoading } = useAuth()
if (!authLoading && user) return <Navigate to="/dashboard" replace />
```
Evita que un usuario con sesión activa (ej: recién confirmó su email) vea el formulario de login.

### 4. `src/pages/Onboarding.jsx`
- Corregido nombre de marca: "SubsManager" → "PLANE.AR"
- Agregado botón "Cerrar sesión" en el header de la página, visible en todos los pasos del wizard
- Permite salir del flujo de onboarding si el usuario no quiere continuar
