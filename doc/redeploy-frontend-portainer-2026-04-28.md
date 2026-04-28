# 2026-04-28 — Redeploy del frontend con Portainer

## Contexto

Este proyecto se deploya como una SPA estática de React + Vite servida por `nginx` dentro de un contenedor Docker.

El backend ya vive afuera del servidor:

- Supabase
- Edge Functions de Supabase
- Mercado Pago

Por eso, para actualizar producción, lo único que se redeploya es el frontend.

---

## Resumen rápido

Cada vez que haya cambios en frontend:

1. preparar un `tar.gz` limpio del proyecto
2. subirlo al servidor
3. descomprimirlo en el servidor
4. rebuildar la imagen Docker en el servidor ARM
5. redeployar el stack en Portainer
6. verificar que el contenedor responda por su puerto interno publicado

> En este flujo **no** se sube `dist/` manualmente y **no** se importa una imagen construida en Windows, porque el servidor corre en ARM.

---

## Requisitos previos

- Tener acceso al repo local
- Tener acceso SSH al servidor OCI
- Tener acceso a Portainer
- Tener disponibles los valores de producción:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_GA_MEASUREMENT_ID` si aplica

---

## Paso 1 — Generar el paquete para deploy

Desde la máquina local, en `e:\Suscripciones`, generar un comprimido limpio del proyecto.

Ejemplo:

```powershell
tar -czf planear-deploy-clean.tar.gz `
  --exclude='subsmanager/node_modules' `
  --exclude='subsmanager/dist' `
  --exclude='subsmanager/.git' `
  --exclude='subsmanager/.env.development.local' `
  --exclude='subsmanager/.env.staging.local' `
  --exclude='subsmanager/.env.production.local' `
  --exclude='subsmanager/supabase/env/*.env' `
  --exclude='subsmanager/supabase/.temp' `
  --exclude='subsmanager/.agents' `
  --exclude='subsmanager/.claude' `
  --exclude='subsmanager/.mcp.json' `
  --exclude='subsmanager/SESION_NOTAS.md' `
  subsmanager
```

Ese archivo contiene lo necesario para buildar en el servidor sin arrastrar basura local.

---

## Paso 2 — Subir el archivo al servidor

Subir `planear-deploy-clean.tar.gz` por FileZilla o SCP a una carpeta del servidor.

Ejemplo:

```text
/home/ubuntu/planear/
```

---

## Paso 3 — Descomprimir en el servidor

Entrar por SSH:

```bash
ssh ubuntu@IP_DEL_SERVIDOR
```

Ir a la carpeta donde se subió el archivo:

```bash
cd /home/ubuntu/planear
```

Descomprimir:

```bash
tar -xzf planear-deploy-clean.tar.gz
```

Entrar al proyecto:

```bash
cd subsmanager
```

Verificar que existan:

- `Dockerfile`
- `docker-compose.yml`
- `deploy/nginx-container.conf`

---

## Paso 4 — Rebuildar la imagen en el servidor ARM

Esto es importante: el build debe hacerse en el servidor porque la instancia corre sobre arquitectura ARM.

Si se construye la imagen en Windows x64 y se sube ya armada, puede fallar con:

```text
exec format error
```

Build recomendado:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=TU_PROD_ANON_KEY \
  --build-arg VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX \
  -t planear:latest \
  .
```

Si no se usa Google Analytics:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=TU_PROD_ANON_KEY \
  --build-arg VITE_GA_MEASUREMENT_ID= \
  -t planear:latest \
  .
```

Verificar imagen generada:

```bash
docker images | grep planear
```

---

## Paso 5 — Redeploy del stack en Portainer

El stack usa una imagen local del host:

```yaml
services:
  planear:
    image: planear:latest
    container_name: planear
    restart: unless-stopped
    ports:
      - "8083:80"
```

En Portainer:

1. Ir a `Stacks`
2. Abrir el stack de `planear`
3. Elegir `Redeploy`
4. Asegurarse de **no forzar un pull remoto** de la imagen

> `planear:latest` no vive en Docker Hub. Es una imagen local construida dentro del servidor.

Si Portainer intenta hacer pull y falla con algo como:

```text
pull access denied for planear
```

hay que desactivar la opción de pull y redeployar usando la imagen local.

---

## Paso 6 — Verificación post deploy

Ver contenedor:

```bash
docker ps
```

Debe aparecer algo como:

```text
planear   Up   0.0.0.0:8083->80/tcp
```

Probar desde el mismo servidor:

```bash
curl -I http://127.0.0.1:8083
```

Si responde `200 OK`, el frontend quedó levantado correctamente.

También se puede probar con la IP pública:

```bash
curl -I http://IP_PUBLICA:8083
```

---

## Problemas comunes

### 1. `exec format error`

Causa:
- imagen construida en otra arquitectura

Solución:
- rebuildar la imagen directamente en el servidor ARM

### 2. `pull access denied for planear`

Causa:
- Portainer intenta bajar `planear:latest` desde un registry remoto

Solución:
- usar la imagen local
- redeployar sin pull remoto

### 3. `curl http://127.0.0.1:8083` no responde

Causa posible:
- el contenedor no arrancó

Ver:

```bash
docker ps -a
docker logs planear
```

### 4. Cambios de frontend no se ven

Causas posibles:
- no se rebuildó la imagen
- Portainer no redeployó el stack correcto
- el navegador cacheó assets viejos

Chequeo:

```bash
docker images | grep planear
docker ps
curl -I http://127.0.0.1:8083
```

---

## Checklist corto

```text
1. Generar tar.gz limpio
2. Subir tar.gz al servidor
3. Descomprimir
4. docker build ... -t planear:latest .
5. Redeploy del stack en Portainer
6. curl -I http://127.0.0.1:8083
```
