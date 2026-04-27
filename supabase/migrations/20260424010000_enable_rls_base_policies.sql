-- Reconciliacion local de RLS/policies base.
-- La bootstrap inicial corta antes del bloque de policies del schema real,
-- por eso estas tablas quedaban sin RLS al iniciar Supabase local.

DROP POLICY IF EXISTS "Only admins can read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Owner inserts own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owner manages appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owner updates appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owner inserts own availability" ON public.business_availability;
DROP POLICY IF EXISTS "Owner manages availability" ON public.business_availability;
DROP POLICY IF EXISTS "Owner updates availability" ON public.business_availability;
DROP POLICY IF EXISTS "Public reads availability" ON public.business_availability;
DROP POLICY IF EXISTS "Public reads businesses" ON public.businesses;
DROP POLICY IF EXISTS "insert own" ON public.support_messages;
DROP POLICY IF EXISTS "own_business" ON public.businesses;
DROP POLICY IF EXISTS "own_payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
DROP POLICY IF EXISTS "own_plans" ON public.plans;
DROP POLICY IF EXISTS "own_subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "own_usage_logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Users can update their own usage_logs" ON public.usage_logs;
DROP POLICY IF EXISTS "plans_insert_tier_limit" ON public.plans;
DROP POLICY IF EXISTS "subscribers_insert_tier_limit" ON public.subscribers;
DROP POLICY IF EXISTS "businesses_admin_update" ON public.businesses;
DROP POLICY IF EXISTS "businesses_protect_tier_fields" ON public.businesses;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read admin_users"
  ON public.admin_users
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner inserts own appointments"
  ON public.appointments
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT businesses.id
      FROM public.businesses
      WHERE businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner manages appointments"
  ON public.appointments
  USING (
    business_id IN (
      SELECT businesses.id
      FROM public.businesses
      WHERE businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner updates appointments"
  ON public.appointments
  FOR UPDATE
  USING (
    business_id IN (
      SELECT businesses.id
      FROM public.businesses
      WHERE businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner inserts own availability"
  ON public.business_availability
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT businesses.id
      FROM public.businesses
      WHERE businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner manages availability"
  ON public.business_availability
  USING (
    business_id IN (
      SELECT businesses.id
      FROM public.businesses
      WHERE businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner updates availability"
  ON public.business_availability
  FOR UPDATE
  USING (
    business_id IN (
      SELECT businesses.id
      FROM public.businesses
      WHERE businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Public reads availability"
  ON public.business_availability
  FOR SELECT
  USING (true);

CREATE POLICY "Public reads businesses"
  ON public.businesses
  FOR SELECT
  USING (true);

CREATE POLICY "insert own"
  ON public.support_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_business"
  ON public.businesses
  USING (auth.uid() = user_id);

CREATE POLICY "own_payments"
  ON public.payments
  USING (
    subscriber_id IN (
      SELECT s.id
      FROM public.subscribers s
      JOIN public.businesses b ON s.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own payments"
  ON public.payments
  FOR UPDATE
  USING (
    subscriber_id IN (
      SELECT subscribers.id
      FROM public.subscribers
      WHERE subscribers.business_id IN (
        SELECT businesses.id
        FROM public.businesses
        WHERE businesses.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "own_plans"
  ON public.plans
  USING (
    business_id IN (
      SELECT businesses.id
      FROM public.businesses
      WHERE businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "own_subscribers"
  ON public.subscribers
  USING (
    business_id IN (
      SELECT businesses.id
      FROM public.businesses
      WHERE businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "own_usage_logs"
  ON public.usage_logs
  USING (
    subscriber_id IN (
      SELECT s.id
      FROM public.subscribers s
      JOIN public.businesses b ON s.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own usage_logs"
  ON public.usage_logs
  FOR UPDATE
  USING (
    subscriber_id IN (
      SELECT subscribers.id
      FROM public.subscribers
      WHERE subscribers.business_id IN (
        SELECT businesses.id
        FROM public.businesses
        WHERE businesses.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "plans_insert_tier_limit"
  ON public.plans
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (public.can_add_plan(business_id));

CREATE POLICY "subscribers_insert_tier_limit"
  ON public.subscribers
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (public.can_add_subscriber(business_id));

CREATE POLICY "businesses_admin_update"
  ON public.businesses
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "businesses_protect_tier_fields"
  ON public.businesses
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    public.is_admin()
    OR (
      public._tier_fields_unchanged(
        id,
        tier,
        subscription_ends_at,
        mp_subscription_id,
        mp_status,
        pending_tier
      )
      AND (
        is_promo = (
          SELECT b.is_promo
          FROM public.businesses b
          WHERE b.id = businesses.id
        )
      )
    )
  );
