# Guía: cómo modificar planes (precios, límites, features)

Cada vez que se necesite cambiar precios, límites de clientes/planes o el listado de features de los tiers, hay que tocar estos archivos **en el orden indicado**.

---

## 1. Frontend — display y lógica UI

**Archivo:** `src/constants/tiers.js`

Contiene dos exports:

### `TIER_LIMITS` (enforcement client-side)
```js
starter: { maxSubscribers: 15, maxPlans: 3, canPrint: true, canStats: false, canReserve: false }
```
- `maxSubscribers` / `maxPlans`: límite que usa el hook `useSubscription` para mostrar el modal de upgrade en la UI.
- `canPrint`, `canStats`, `canReserve`: flags de features booleanas.

### `TIER_INFO` (display)
```js
starter: {
  price: 16900,           // número entero, ARS
  priceLabel: '$16.900/mes',  // string para mostrar en pantalla
  features: [...],        // lista visible en Pricing y Planes
  locked: [...],          // features bloqueadas mostradas tachadas
}
```

**Impacta en:** `src/pages/Pricing.jsx`, `src/pages/Planes.jsx` y cualquier componente que lea `TIER_INFO`.

---

## 2. Mercado Pago — lo que se cobra realmente

**Archivo:** `supabase/functions/create-subscription/index.ts`

```ts
const TIER_PRICES = {
  starter: { amount: 16900, label: 'PLANE.AR Starter' },
  pro:     { amount: 22900, label: 'PLANE.AR Pro' },
}
```

- `amount`: monto en ARS que MP cobra mensualmente.
- Después de editar, hacer **redeploy** de la edge function:
  ```
  supabase functions deploy create-subscription
  ```

---

## 3. Base de datos — enforcement real (RLS)

**Función:** `public.can_add_subscriber(p_business_id uuid)` en Supabase

Los límites de suscriptores están **hardcodeados** en esta función SQL. No lee de `tiers.js`. Hay que actualizarla vía migración cuando cambie `maxSubscribers`:

```sql
CREATE OR REPLACE FUNCTION public.can_add_subscriber(p_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT CASE get_effective_tier(p_business_id)
    WHEN 'pro'     THEN true
    WHEN 'starter' THEN (SELECT count(*) FROM subscribers WHERE business_id = p_business_id) < 15
    ELSE                 (SELECT count(*) FROM subscribers WHERE business_id = p_business_id) < 5
  END;
$$;
```

Ídem para `can_add_plan` si se cambia el límite de planes del Starter (actualmente `< 3`).

> Sin este cambio, la UI muestra el nuevo límite pero la DB sigue permitiendo inserts hasta el valor viejo.

---

## 4. Documentación interna

**Archivo:** `CLAUDE.md` — tabla en la sección "Tier System" (líneas ~258-260)

Mantener sincronizada con los valores reales para que futuras sesiones de IA tengan contexto correcto.

---

## Resumen rápido

| Qué cambiar | Archivo | Runtime |
|---|---|---|
| Precios mostrados en pantalla | `src/constants/tiers.js` → `TIER_INFO` | Frontend |
| Límite de clientes/planes en UI | `src/constants/tiers.js` → `TIER_LIMITS` | Frontend |
| Monto que cobra MP | `supabase/functions/create-subscription/index.ts` | Edge Function (Deno) |
| Enforcement real en DB | Función SQL `can_add_subscriber` / `can_add_plan` | Supabase Postgres |
| Documentación IA | `CLAUDE.md` sección "Tier System" | — |
