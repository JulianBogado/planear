# Categoría Vivero

**Fecha:** 2026-04-22

## Qué se hizo

Se agregó "Vivero" como nueva categoría de negocio en `src/constants/templates.js`.

- **Ícono:** `Sprout` (lucide-react) — representa brote/planta de vivero
- **Value:** `vivero`
- **Templates:** 2 planes pre-armados ("Verde en casa" y "Jardín en cuotas")

## Por qué no requirió migración de DB

El campo `businesses.category` es de tipo `text` libre sin CHECK constraint ni enum. Cualquier valor de texto es válido — solo basta con agregarlo a `CATEGORIES` en el frontend para que aparezca en Onboarding y Settings.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/constants/templates.js` | Import `Sprout`, entrada en `CATEGORIES`, templates en `TEMPLATES` |

## Cómo agregar una categoría nueva en el futuro

Ver `doc/cambios-planes.md` para el patrón general. Para rubros:
1. Agregar el import del ícono en `templates.js`
2. Agregar `{ value, label, Icon }` en `CATEGORIES`
3. Agregar `value: [...]` en `TEMPLATES`
4. No se necesita tocar Onboarding ni Settings (consumen dinámicamente)
5. No se necesita migración de DB
