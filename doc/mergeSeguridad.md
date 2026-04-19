# Merge seguridadAgenda → main

**Fecha:** 2026-04-19

## Qué se hizo

Integración de las branches `mejorasagenda` y `seguridadAgenda` a `main` con punto de control previo.

## Estado antes del merge

```
01a69dd  Initial commit
    |
11f037c  ← main / origin/main  (correcciones de agenda)
    |
12f27d0  ← mejorasagenda  (implementacion de agenda por espacios)
    |
4c02d2f  ← seguridadAgenda  (toggle guest mode)
```

## Operaciones realizadas

1. **Commit en seguridadAgenda** — se commitearon los cambios del toggle `allow_guest_bookings` (Settings.jsx, PublicBooking.jsx, CLAUDE.md, doc/guestModeToggle.md)
2. **Tag de rollback** — `git tag pre-seguridad-agenda` aplicado sobre `main` en `11f037c`
3. **Merge fast-forward** — `git merge seguridadAgenda` sin conflictos
4. **Branch eliminada** — `mejorasagenda` borrada (absorbida por seguridadAgenda)

## Estado después del merge

```
main → 4c02d2f  (incluye mejorasagenda + seguridadAgenda)
tag: pre-seguridad-agenda → 11f037c  (punto de rollback)
```

## Cómo hacer rollback si es necesario

```bash
git checkout main
git reset --hard pre-seguridad-agenda
```

Esto devuelve `main` al estado previo al merge. El tag permanece intacto.
