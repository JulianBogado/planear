# Mejoras al flujo de registro y login

**Fecha:** 2026-04-19

## Qué se implementó

### 1. Tabla `profiles` en Supabase (migración `create_profiles_table`)

Nueva tabla que almacena los datos personales del usuario:

```
profiles (id, nombre, apellido, telefono, created_at)
```

- `id` referencia `auth.users(id)` con CASCADE DELETE
- RLS habilitada: el usuario solo puede leer y actualizar su propio perfil
- Trigger `on_auth_user_created`: se ejecuta automáticamente al crearse un nuevo usuario en `auth.users`, lee los datos desde `raw_user_meta_data` (pasados en `options.data` del signUp) e inserta la fila en `profiles` con `SECURITY DEFINER` (evita problemas de RLS antes de la confirmación de email)

### 2. `src/pages/Register.jsx`

- Nuevos campos: **Nombre** y **Apellido** (en grilla de 2 columnas) + **Teléfono**
- Validaciones agregadas: nombre y apellido no vacíos; teléfono con al menos 8 dígitos numéricos; contraseñas que coinciden y mínimo 6 caracteres
- `signUp` ahora incluye:
  ```js
  options: {
    emailRedirectTo: `${window.location.origin}/email-confirmado`,
    data: { nombre, apellido, telefono }
  }
  ```
- Post-registro: en lugar de redirigir a `/onboarding`, se muestra una pantalla de éxito con el mensaje "Revisá tu casilla de correo y confirmá tu cuenta" y un link al login
- Eliminada dependencia de `useNavigate` (ya no es necesaria)

### 3. `src/pages/Login.jsx`

- Cambio mínimo: `navigate('/')` → `navigate('/dashboard')`
- `AppGuard` se encarga del resto: si el usuario no tiene negocio creado, redirige a `/onboarding`; si ya tiene, muestra el dashboard

### 4. `src/pages/EmailConfirmado.jsx` (archivo nuevo)

- Página pública en ruta `/email-confirmado`
- Supabase redirige aquí tras la confirmación del correo (via `emailRedirectTo`)
- El cliente Supabase procesa automáticamente el token en la URL
- Muestra: check verde + "¡Cuenta confirmada! Ya podés iniciar sesión" + botón al login

### 5. `src/App.jsx`

- Agregada ruta pública `<Route path="/email-confirmado" element={<EmailConfirmado />} />`

## Pendiente (configuración manual en Supabase Dashboard)

En **Authentication → URL Configuration → Redirect URLs**, agregar la URL de producción:
```
https://plane.ar/email-confirmado
```
(localhost ya funciona por estar permitido por defecto durante desarrollo)
