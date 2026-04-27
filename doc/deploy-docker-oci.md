# Deploy — PLANE.AR en OCI + Docker + Portainer

**Fecha:** 2026-04-23

---

## Contexto

PLANE.AR es una SPA de React + Vite que no tiene backend propio. Todo el backend es:
- **Supabase** (base de datos, auth, Edge Functions) → ya está en la nube, no hay que deployarlo
- **MercadoPago** → integrado via Edge Functions de Supabase

Lo que hay que deployar es únicamente **el frontend estático** (la carpeta `/dist` que genera `npm run build`), servido por nginx dentro de un contenedor Docker.

**Arquitectura en producción:**

```
Internet → nginx externo (SSL + dominio) → contenedor Docker (nginx interno, puerto 80) → archivos estáticos /dist
```

El nginx externo termina SSL y redirige el tráfico HTTP al contenedor. El contenedor solo sirve HTTP en el puerto 80 (sin SSL), lo que simplifica enormemente el manejo de certificados Let's Encrypt.

---

## Archivos a crear

| Archivo | Estado | Acción |
|---------|--------|--------|
| `Dockerfile` | No existe | Crear |
| `docker-compose.yml` | No existe | Crear |
| `deploy/nginx-container.conf` | No existe | Crear (nginx interno, solo HTTP) |
| `deploy/nginx.conf` | Ya existe | Usar como referencia para el nginx externo |
| Secrets de Supabase | En producción | Actualizar MP_ACCESS_TOKEN |

---

## Por qué Docker en vez de solo `npm run build`

`npm run build` genera la carpeta `/dist`. La diferencia está en **qué hacés después**:

| | Solo `npm run build` | Con Docker |
|-|---------------------|------------|
| Para servir los archivos | Instalar nginx en el servidor, copiar `/dist` manualmente | Está incluido en la imagen |
| Para actualizar | Rebuild local + copiar archivos al servidor + reiniciar nginx | Rebuild imagen + restart contenedor |
| Portabilidad | Depende de la configuración del servidor | Funciona igual en cualquier servidor con Docker |
| Rollback a una versión anterior | Complejo | `docker run planear:v1` |
| Gestión desde Portainer | No posible | Nativo |

Docker empaqueta "la app + el servidor web + la configuración" en una unidad que se puede iniciar, detener, actualizar y hacer rollback desde Portainer con unos clics.

---

## Paso 1 — Cambiar MercadoPago a producción

Las credenciales de MP están guardadas como secrets en las Edge Functions de Supabase, **no en el código del frontend** ni en la imagen Docker.

### 1.1 Obtener token de producción

1. Ir al panel de desarrolladores de MercadoPago
2. Crear (o seleccionar) la app de PLANE.AR en **modo producción**
3. Copiar el **Access Token de producción** (empieza con `APP_USR-`)
4. Ir a la sección **Webhooks** de la misma app y:
   - Configurar la URL del webhook: `https://TU_PROJECT_REF.supabase.co/functions/v1/mp-webhook`
   - Copiar el **Webhook Secret** (se usará para verificar firma HMAC)

### 1.2 Actualizar secrets en Supabase

Con la CLI de Supabase:

```bash
supabase secrets set MP_ACCESS_TOKEN="APP_USR-xxxxxxxxx" --project-ref TU_PROJECT_REF
supabase secrets set MP_WEBHOOK_SECRET="tu_webhook_secret" --project-ref TU_PROJECT_REF
```

O desde el dashboard: `Project → Edge Functions → Secrets → agregar/editar MP_ACCESS_TOKEN y MP_WEBHOOK_SECRET`

> ⚠️ No es necesario redesployar las Edge Functions. Cambiar el secret es suficiente.

### 1.3 ¿MP_PLAN_STARTER_ID y MP_PLAN_PRO_ID son necesarios?

**No.** La función `supabase/functions/create-subscription/index.ts` crea cada preapproval directamente contra la API de MP usando los montos hardcodeados (`16900` y `22900` ARS). No usa planes pre-existentes. Solo se necesita `MP_ACCESS_TOKEN`.

---

## Paso 2 — Crear el Dockerfile

Crear `Dockerfile` en la raíz del proyecto:

```dockerfile
# Stage 1: build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Las VITE_ vars se inyectan en el JS en tiempo de build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
RUN npm run build

# Stage 2: serve
FROM nginx:alpine
COPY deploy/nginx-container.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Por qué multi-stage:** La imagen final solo tiene nginx + los archivos estáticos. No incluye node_modules (250+ MB) ni código fuente. La imagen final pesa ~30 MB.

**Por qué VITE_ como ARG:** Las variables `VITE_*` se incrustan en el JavaScript durante el build. No existen en runtime — Vite las reemplaza en el código estático. Por eso se pasan como argumentos de build (`--build-arg`), no como variables de entorno del contenedor en ejecución.

**¿No es un problema de seguridad?** No. `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` son **públicas por diseño** — cualquiera que visite la app puede verlas en los archivos JS del browser. El control de acceso lo hace RLS en Supabase. El `MP_ACCESS_TOKEN` de producción sí es secreto, pero vive solo en Supabase — nunca toca Docker ni el servidor OCI.

---

## Paso 3 — Crear nginx-container.conf

Este nginx es simple: solo sirve HTTP en el puerto 80. **El SSL lo maneja el nginx externo**.

Crear `deploy/nginx-container.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # SPA: todas las rutas sirven index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets (Vite les pone hash en el nombre)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~ /\.(env|git) {
        deny all;
        return 404;
    }
}
```

> Los headers de seguridad (CSP, HSTS, X-Frame-Options) van en el nginx **externo**. El `deploy/nginx.conf` existente ya los tiene configurados.

---

## Paso 4 — Crear docker-compose.yml

Crear `docker-compose.yml` en la raíz:

```yaml
services:
  planear:
    image: planear:latest
    container_name: planear
    restart: unless-stopped
    ports:
      - "8080:80"
```

El build no se hace con docker-compose (porque necesita pasar las build args). docker-compose solo se usa para levantar la imagen ya buildeada.

---

## Paso 5 — Buildear la imagen

### Opción A: Buildear en la PC local y subir al servidor

```bash
# 1. Build (desde e:\Suscripciones\subsmanager\)
docker build \
  --build-arg VITE_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=TU_PROD_ANON_KEY \
  -t planear:latest \
  .

# 2. Exportar la imagen
docker save planear:latest | gzip > planear.tar.gz

# 3. Subir al servidor OCI
scp planear.tar.gz usuario@ip-del-servidor:/home/usuario/

# 4. En el servidor OCI, cargar la imagen
docker load < planear.tar.gz
```

### Opción B: Buildear directamente en el servidor OCI (más simple)

```bash
# Copiar el proyecto al servidor (sin node_modules ni dist)
# Luego buildear en el servidor:
docker build \
  --build-arg VITE_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=TU_PROD_ANON_KEY \
  -t planear:latest \
  /ruta/al/proyecto
```

---

## Paso 6 — Deploy con Portainer

Una vez que la imagen `planear:latest` está cargada en el servidor:

1. Abrir Portainer
2. Ir a **Stacks → Add stack**
3. Pegar el contenido del `docker-compose.yml`
4. Hacer clic en **Deploy the stack**

El contenedor queda escuchando en el puerto **8080** del servidor.

> **Alternativa rápida:** Containers → Add container → Image: `planear:latest` → Port mapping: `8080:80` → Restart policy: `Unless stopped`

---

## Paso 7 — Configurar nginx externo vía GUI

En nginx-proxy-manager (o equivalente):

1. **Agregar un Proxy Host nuevo:**
   - Domain Names: `plane.ar` y `www.plane.ar`
   - Scheme: `http`
   - Forward Hostname/IP: `localhost`
   - Forward Port: `8080`
   - Activar "Block Common Exploits"

2. **Pestaña SSL:**
   - Seleccionar "Request a new SSL certificate" (Let's Encrypt)
   - Activar "Force SSL" y "HTTP/2 Support"
   - Ingresar email y aceptar términos → el certificado se obtiene automáticamente
   - La renovación es automática

3. **Headers de seguridad (pestaña Advanced):**
   ```nginx
   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
   add_header X-Frame-Options "DENY" always;
   add_header X-Content-Type-Options "nosniff" always;
   add_header Content-Security-Policy "default-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mercadopago.com; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:" always;
   ```

---

## Paso 8 — Configurar DNS en OCI

- En OCI: verificar que las Security Lists permiten tráfico en puertos 80 y 443
- En el proveedor de DNS: apuntar `plane.ar` y `www.plane.ar` a la IP pública del servidor OCI

---

## Verificación

```bash
# Contenedor corriendo
docker ps | grep planear

# Responde en el puerto del contenedor
curl -I http://localhost:8080

# MercadoPago: hacer una suscripción de prueba y revisar logs de la edge function
supabase functions logs mp-webhook --project-ref TU_PROJECT_REF
```

---

## Actualizar la app (nueva versión)

```bash
# 1. Rebuild de la imagen
docker build --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_ANON_KEY=... -t planear:latest .

# 2. En Portainer: Stacks → tu stack → Redeploy
```
