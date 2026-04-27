-- Seed local mínimo para PLANE.AR
--
-- Este archivo corre al levantar Supabase local.
-- Hoy no inserta datos de negocio porque la app depende de usuarios reales en auth.users.
-- El flujo recomendado es:
-- 1. levantar Supabase local
-- 2. registrarte desde la app local
-- 3. correr el snippet de admin si necesitás acceso administrativo
-- 4. completar onboarding desde la UI
--
-- Si más adelante querés datos demo automáticos, conviene agregarlos en una migration o
-- en este archivo, pero siempre atados a un usuario auth real ya existente.

SELECT 'seed local cargado' AS status;
