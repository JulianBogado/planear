-- ============================================================
-- Security Review 2026-04-19 — Auditoría de RLS
-- Estado: VERIFICADO — políticas existentes son correctas
-- NO requiere aplicación manual
-- ============================================================

-- Las siguientes políticas se verificaron como existentes en producción:

-- payments:
--   "own_payments" (ALL) — filtra via subscriber_id -> subscribers -> businesses.user_id = auth.uid()
--   "Users can update their own payments" (UPDATE) — idem

-- usage_logs:
--   "own_usage_logs" (ALL) — filtra via subscriber_id -> subscribers -> businesses.user_id = auth.uid()
--   "Users can update their own usage_logs" (UPDATE) — idem

-- appointments:
--   "Owner manages appointments" (ALL) — filtra por business_id -> businesses.user_id = auth.uid()
--   "Owner inserts own appointments" (INSERT) — idem
--   "Owner updates appointments" (UPDATE) — idem

-- RLS habilitado en todas las tablas públicas:
--   admin_users, appointments, business_availability, businesses,
--   payments, plans, profiles, subscribers, support_messages, usage_logs

-- Conclusion: el modelo de seguridad de datos es correcto.
-- Los fixes en el frontend (fetchPayments subscriber guard,
-- handleDeleteLog con business_id) son defensa en profundidad adicional.
