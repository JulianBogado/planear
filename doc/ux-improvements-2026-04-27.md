# UX Improvements — 2026-04-27

## Cambios realizados

### 1. Onboarding — ítems del plan visibles
**Archivo:** `src/pages/Onboarding.jsx`

En el paso 3 del onboarding ("Servicios sugeridos"), cada tarjeta de plan ahora muestra los `items` del template como bullets debajo de la línea de usos/días. Antes solo se veía nombre, usos, días y precio. Los ítems vienen del campo `items: string[]` en `src/constants/templates.js`.

---

### 2. Dashboard — badge de tier removido del saludo
**Archivo:** `src/pages/Dashboard.jsx`

Se eliminó el badge de tier (Free/Starter/Pro) que aparecía debajo del "Hola, [nombre del negocio]". Era redundante con el badge que ya existe en el navbar. El saludo queda solo con el nombre del negocio.

---

### 3. Navbar — colores diferenciados por tier
**Archivo:** `src/components/layout/AppLayout.jsx`

Se actualizó `tierBadgeClass` con colores metálicos diferenciados:
- **Pro** → dorado: `bg-amber-100 text-amber-700 border border-amber-300`
- **Starter** → plateado: `bg-slate-100 text-slate-600 border border-slate-300`
- **Free** → bronce: `bg-orange-100 text-orange-700 border border-orange-200`

Aplica tanto al header desktop como al header mobile (usan la misma variable).

---

### 4. Registrar uso — aviso de uso ya registrado en el día
**Archivos:** `src/pages/Subscribers.jsx`, `src/pages/SubscriberDetail.jsx`

Al hacer click en "Registrar uso" (tanto desde la tarjeta en `/suscriptores` como desde el botón en `/suscriptores/:id`), se consulta `usage_logs` para verificar si el cliente ya registró un uso en el día actual.

- Si **no hay uso del día**: se muestra la confirmación habitual.
- Si **ya hay un uso del día**: el mensaje cambia a *"Este cliente registró un uso el día [dd/MM/yyyy] a las [HH:mm]. ¿Confirmás otro uso?"* con color ámbar de advertencia.

La query filtra por `deleted_at IS NULL` para ignorar usos eliminados con soft-delete.

---

### 5. Notas en historial de usos — mayor visibilidad
**Archivo:** `src/pages/SubscriberDetail.jsx`

Las notas guardadas en `usage_logs.notes` ahora se muestran con un estilo más legible: fondo sutil (`bg-stone-50`), borde (`border-stone-100`) y texto itálico, en vez del texto gris pequeño que antes era casi invisible.

---

### 6. Alta de cliente — registro de pago inicial
**Archivos:** `src/pages/Subscribers.jsx`, `src/hooks/useSubscribers.js`

Se agregó el campo **"Monto pagado (opcional)"** al formulario de nuevo cliente en `/suscriptores`. Si se completa con un valor mayor a 0, `createSubscriber` inserta automáticamente un registro en la tabla `payments` tras crear el suscriptor. Esto permite que el historial de pagos en la ficha del cliente no quede vacío desde el primer día.

El insert de pago no bloquea la creación del cliente si falla (comportamiento no-crítico).

---

### 7. Selección masiva en /suscriptores
**Archivo:** `src/pages/Subscribers.jsx`

Se agregó un modo de selección múltiple activable desde el botón **"Seleccionar"** en el header. Al activarlo, cada tarjeta muestra un checkbox y el click hace toggle de selección en vez de navegar.

Con clientes seleccionados aparece una **barra fija al pie** con tres acciones:

| Acción | Confirmación |
|--------|-------------|
| **Renovar** | Modal simple: "Se van a renovar N clientes con el mismo plan que tienen actualmente. ¿Confirmás?" |
| **Registrar uso** | Modal simple: "Se va a registrar un uso para N clientes. ¿Confirmás?" |
| **Eliminar** | Modal de advertencia: requiere escribir `ELIMINAR` para habilitar el botón |

La renovación masiva llama a `renewSubscriber(sub, '', null)` — sin monto (no crea pago) y con el plan actual. La eliminación masiva usa `deleteSubscriber` en `Promise.all`.

Al terminar cualquier acción masiva, el modo selección se desactiva automáticamente y se muestra un toast con el resultado.
