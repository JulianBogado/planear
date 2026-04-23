# Organización de Entornos Supabase

**Fecha:** 2026-04-22

## Objetivo

Definir una forma simple y segura de trabajar con Supabase mientras la app ya está en producción, sin desarrollar directamente sobre la base real.

La recomendación para este proyecto es usar:

- **1 proyecto de producción**
- **1 proyecto de staging**

Y trabajar localmente contra `staging`.

---

## Estructura recomendada

### Producción

Es el proyecto Supabase que usa la app en vivo.

Uso esperado:

- usuarios reales
- datos reales
- deploy final
- operación normal del negocio

No usar para:

- pruebas manuales con datos fake
- cambios de schema sin validar
- pruebas de edge functions
- debugging agresivo
- test de formularios, webhooks o RLS

---

### Staging

Es un proyecto Supabase separado, usado para desarrollo y validación antes de pasar cambios a producción.

Uso esperado:

- probar frontend local
- probar migraciones
- probar edge functions
- probar RLS
- probar secrets
- probar integraciones nuevas

La idea es que `staging` sea lo más parecido posible a `producción`, pero sin ser el entorno real del negocio.

---

## Flujo recomendado

### Día a día

1. La app publicada usa **producción**.
2. Vos trabajás en VS Code local.
3. Tu entorno local apunta a **staging**.
4. Probás ahí todo lo nuevo.
5. Cuando queda bien, recién lo llevás a **producción**.

---

## Cómo crear staging

### Opción recomendada

Crear un proyecto nuevo de Supabase para staging y clonarlo desde producción.

Esto sirve cuando querés un entorno de prueba con una base parecida a la real.

Supabase permite clonar un proyecto restaurando datos desde producción a un proyecto nuevo.

Documentación oficial:

- https://supabase.com/docs/guides/platform/clone-project

---

## Qué copia el clone de Supabase

Cuando clonás/restaurás desde producción a un proyecto nuevo, Supabase copia:

- schema de base de datos
- tablas
- vistas
- funciones SQL
- datos
- índices
- roles, permisos y usuarios de base
- datos de `auth` y cuentas de usuarios

---

## Qué NO se copia automáticamente

Después del clone, tenés que revisar o configurar manualmente:

- Edge Functions
- secrets de Edge Functions
- configuración de Auth
- API keys
- Storage y buckets
- Realtime
- integraciones externas
- callbacks / redirect URLs

Esto es importante: el clone no deja staging “idéntico” a producción en toda la plataforma, sino principalmente en la base de datos.

---

## Recomendación importante sobre datos reales

Si clonás producción a staging, vas a tener datos reales o muy cercanos a los reales.

Por eso:

- no uses staging para pruebas desordenadas
- no mandes mails reales sin querer
- no dispares webhooks reales
- no dejes jobs automáticos activos si pueden hacer acciones externas

Si usás extensiones o jobs con efectos externos, revisalos y desactivalos si corresponde.

---

## Variables de entorno

### Local

Tu `.env.local` debería apuntar a **staging**.

Ejemplo:

```env
VITE_SUPABASE_URL=https://TU-STAGING.supabase.co
VITE_SUPABASE_ANON_KEY=TU_STAGING_ANON_KEY
```

Eso hace que cuando levantes la app local en VS Code, estés trabajando contra staging y no contra producción.

---

### Producción

Las variables del hosting deben apuntar al proyecto de **producción**.

Ejemplo conceptual:

```env
VITE_SUPABASE_URL=https://TU-PROD.supabase.co
VITE_SUPABASE_ANON_KEY=TU_PROD_ANON_KEY
```

En resumen:

- **local usa staging**
- **deploy usa producción**

---

## Cómo trabajar con cambios

### Frontend puro

Si el cambio es solo visual o de frontend:

- trabajás local contra staging
- verificás que no rompa nada
- deployás la web

### Cambios de base de datos

Si el cambio toca schema:

1. crear migración
2. aplicar en staging
3. probar
4. aplicar en producción

### Cambios de edge functions

Si el cambio toca una función:

1. editar en branch local
2. deployar a staging
3. probar
4. deployar a producción

### Cambios de secrets

Los secrets deben cargarse por separado en cada entorno:

- staging
- producción

Nunca asumir que un secret cargado en staging existe también en producción.

---

## Flujo de trabajo recomendado

### Branches de Git

- `main` → estado estable
- `feature/...` → trabajo nuevo

### Flujo

1. crear branch nueva
2. desarrollar localmente apuntando a staging
3. probar cambios
4. si hay migraciones, validarlas primero en staging
5. mergear cuando esté listo
6. aplicar migraciones y functions en producción

---

## Qué conviene probar siempre en staging

- migraciones
- RLS
- edge functions
- formularios públicos
- webhooks
- auth
- secrets nuevos
- cambios en settings o redirects

---

## Qué podés hacer en producción con cuidado

Sí podés:

- mirar datos
- revisar logs
- validar que algo ya desplegado funciona
- verificar usuarios reales o comportamiento real

No conviene hacer directo:

- pruebas con datos inventados
- creación de tablas nuevas
- cambios de columnas
- cambios de policies
- pruebas de emails
- debugging experimental
- deploys no probados

---

## Cuándo refrescar staging desde producción

Tiene sentido volver a clonar o refrescar staging cuando:

- los datos de staging quedaron viejos
- necesitás reproducir un bug con datos reales
- querés validar una migración o feature sobre un entorno parecido a producción

No hace falta hacerlo todos los días.

Se puede usar como “foto razonablemente actual” del estado real.

---

## Checklist después de clonar producción a staging

Después de crear o refrescar staging, revisar:

- `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del entorno local
- secrets de Edge Functions
- deploy de Edge Functions necesarias
- URLs de redirección en Auth
- proveedores de email
- webhooks externos
- Storage
- cualquier cron o integración automática

---

## Estrategia simple recomendada para este proyecto

### Lo mínimo sano

- **Producción**: proyecto real
- **Staging**: proyecto separado
- **Local**: apunta a staging

### Regla práctica

- si el cambio toca solo UI, igual probalo en staging
- si toca Supabase, nunca lo pruebes primero en producción

---

## Resumen corto

La organización recomendada es:

- app en vivo → **Supabase producción**
- VS Code local → **Supabase staging**
- cambios nuevos → primero staging, después producción

Y si necesitás un staging bien parecido a producción, lo resolvés clonando/restaurando producción a un proyecto nuevo y reconfigurando manualmente lo que no se copia solo.

---

## Referencias oficiales

- Clone / restore de proyecto:
  https://supabase.com/docs/guides/platform/clone-project

- Branching:
  https://supabase.com/docs/guides/deployment/branching

- Managing environments:
  https://supabase.com/docs/guides/deployment/managing-environments

- Database migrations:
  https://supabase.com/docs/guides/deployment/database-migrations
