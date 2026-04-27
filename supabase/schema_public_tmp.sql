


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."_tier_fields_unchanged"("p_id" "uuid", "p_tier" "text", "p_ends_at" timestamp with time zone, "p_mp_sub_id" "text", "p_mp_status" "text") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    b.tier = p_tier AND
    b.subscription_ends_at IS NOT DISTINCT FROM p_ends_at AND
    b.mp_subscription_id IS NOT DISTINCT FROM p_mp_sub_id AND
    b.mp_status IS NOT DISTINCT FROM p_mp_status
  FROM businesses b WHERE b.id = p_id;
$$;


ALTER FUNCTION "public"."_tier_fields_unchanged"("p_id" "uuid", "p_tier" "text", "p_ends_at" timestamp with time zone, "p_mp_sub_id" "text", "p_mp_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_tier_fields_unchanged"("p_id" "uuid", "p_tier" "text", "p_ends_at" timestamp with time zone, "p_mp_sub_id" "text", "p_mp_status" "text", "p_pending_tier" "text") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    b.tier                 = p_tier AND
    b.subscription_ends_at IS NOT DISTINCT FROM p_ends_at AND
    b.mp_subscription_id   IS NOT DISTINCT FROM p_mp_sub_id AND
    b.mp_status            IS NOT DISTINCT FROM p_mp_status AND
    b.pending_tier         IS NOT DISTINCT FROM p_pending_tier
  FROM businesses b WHERE b.id = p_id;
$$;


ALTER FUNCTION "public"."_tier_fields_unchanged"("p_id" "uuid", "p_tier" "text", "p_ends_at" timestamp with time zone, "p_mp_sub_id" "text", "p_mp_status" "text", "p_pending_tier" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_delete_user"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_business_id uuid;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  SELECT id INTO v_business_id FROM businesses WHERE user_id = p_user_id;

  IF v_business_id IS NOT NULL THEN
    DELETE FROM usage_logs WHERE business_id = v_business_id;
    DELETE FROM payments   WHERE business_id = v_business_id;
    DELETE FROM businesses WHERE id = v_business_id;
  END IF;

  DELETE FROM profiles WHERE id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."admin_delete_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_subscribers"("p_business_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "phone" "text", "plan_name" "text", "status" "text", "end_date" "date", "uses_remaining" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      s.id,
      s.name,
      s.phone,
      p.name AS plan_name,
      s.status,
      s.end_date,
      s.uses_remaining
    FROM subscribers s
    LEFT JOIN plans p ON p.id = s.plan_id
    WHERE s.business_id = p_business_id
    ORDER BY s.name;
END;
$$;


ALTER FUNCTION "public"."admin_get_subscribers"("p_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_businesses"() RETURNS TABLE("id" "uuid", "name" "text", "user_id" "uuid", "tier" "text", "subscription_ends_at" timestamp with time zone, "is_promo" boolean, "email" "text", "owner_nombre" "text", "owner_apellido" "text", "owner_phone" "text", "business_phone" "text", "category" "text", "instagram" "text", "facebook" "text", "tiktok" "text", "subscriber_count" bigint, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      b.id,
      b.name,
      b.user_id,
      b.tier,
      b.subscription_ends_at,
      b.is_promo,
      u.email::text,
      p.nombre,
      p.apellido,
      p.telefono,
      b.phone,
      b.category,
      b.instagram,
      b.facebook,
      b.tiktok,
      COUNT(s.id),
      b.created_at
    FROM businesses b
    JOIN auth.users u ON u.id = b.user_id
    LEFT JOIN profiles p ON p.id = b.user_id
    LEFT JOIN subscribers s ON s.business_id = b.id
    GROUP BY b.id, u.email, p.nombre, p.apellido, p.telefono
    ORDER BY b.name;
END;
$$;


ALTER FUNCTION "public"."admin_list_businesses"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_user"("p_user_id" "uuid", "p_nombre" "text", "p_apellido" "text", "p_telefono" "text", "p_business_name" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  UPDATE profiles
    SET nombre = p_nombre, apellido = p_apellido, telefono = p_telefono
    WHERE id = p_user_id;

  UPDATE businesses
    SET name = p_business_name
    WHERE user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."admin_update_user"("p_user_id" "uuid", "p_nombre" "text", "p_apellido" "text", "p_telefono" "text", "p_business_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_add_plan"("p_business_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT CASE get_effective_tier(p_business_id)
    WHEN 'pro'     THEN true
    WHEN 'starter' THEN (SELECT count(*) FROM plans WHERE business_id = p_business_id) < 3
    ELSE                 (SELECT count(*) FROM plans WHERE business_id = p_business_id) < 2
  END;
$$;


ALTER FUNCTION "public"."can_add_plan"("p_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_add_subscriber"("p_business_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT CASE get_effective_tier(p_business_id)
    WHEN 'pro'     THEN true
    WHEN 'starter' THEN (SELECT count(*) FROM subscribers WHERE business_id = p_business_id) < 15
    ELSE                 (SELECT count(*) FROM subscribers WHERE business_id = p_business_id) < 5
  END;
$$;


ALTER FUNCTION "public"."can_add_subscriber"("p_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_usage_log_atomic"("p_log_id" "uuid", "p_business_id" "uuid", "p_delete_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_subscriber_id uuid;
  v_end_date      date;
  v_new_uses      int;
BEGIN
  -- Soft-delete, verifica pertenencia al negocio
  UPDATE usage_logs
  SET deleted_at    = now(),
      delete_reason = p_delete_reason
  WHERE id            = p_log_id
    AND business_id   = p_business_id
    AND deleted_at    IS NULL
  RETURNING subscriber_id INTO v_subscriber_id;

  IF v_subscriber_id IS NULL THEN
    RAISE EXCEPTION 'Log no encontrado o ya eliminado';
  END IF;

  -- Devuelve un uso al suscriptor
  UPDATE subscribers
  SET uses_remaining = uses_remaining + 1
  WHERE id = v_subscriber_id
  RETURNING uses_remaining, end_date INTO v_new_uses, v_end_date;

  -- Recalcula status (espeja computeStatus() del frontend)
  UPDATE subscribers
  SET status = CASE
    WHEN v_new_uses <= 0               THEN 'no_uses'
    WHEN v_end_date < CURRENT_DATE     THEN 'expired'
    WHEN v_end_date < CURRENT_DATE + 7 THEN 'expiring_soon'
    ELSE 'active'
  END
  WHERE id = v_subscriber_id;
END;
$$;


ALTER FUNCTION "public"."delete_usage_log_atomic"("p_log_id" "uuid", "p_business_id" "uuid", "p_delete_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_effective_tier"("p_business_id" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT CASE
    WHEN b.tier = 'free' THEN 'free'
    WHEN b.subscription_ends_at IS NOT NULL AND now() > b.subscription_ends_at THEN 'free'
    ELSE b.tier
  END
  FROM businesses b WHERE b.id = p_business_id;
$$;


ALTER FUNCTION "public"."get_effective_tier"("p_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, apellido, telefono)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'nombre',
    NEW.raw_user_meta_data->>'apellido',
    NEW.raw_user_meta_data->>'telefono'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid());
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."public_book_appointment"("p_business_id" "uuid", "p_subscriber_id" "uuid", "p_slot_start" timestamp with time zone, "p_slot_end" timestamp with time zone, "p_client_name" "text", "p_client_dni" "text", "p_notes" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_agenda_enabled boolean;
  v_id uuid;
  v_capacity int;
  v_booked_count int;
BEGIN
  SELECT agenda_enabled INTO v_agenda_enabled
  FROM businesses WHERE id = p_business_id;
  IF NOT FOUND OR v_agenda_enabled = false THEN
    RAISE EXCEPTION 'Negocio no encontrado o agenda deshabilitada';
  END IF;

  -- Get the minimum slot_capacity among blocks that cover this day of week
  SELECT COALESCE(MIN(slot_capacity), 1)
  INTO v_capacity
  FROM business_availability
  WHERE business_id = p_business_id
    AND (EXTRACT(DOW FROM p_slot_start AT TIME ZONE 'UTC'))::int = ANY(days_of_week);

  -- If no availability configured, fall back to 1
  IF v_capacity IS NULL THEN
    v_capacity := 1;
  END IF;

  -- Count existing non-cancelled bookings for this exact slot
  SELECT COUNT(*) INTO v_booked_count
  FROM appointments
  WHERE business_id = p_business_id
    AND slot_start = p_slot_start
    AND status != 'cancelled';

  IF v_booked_count >= v_capacity THEN
    RAISE EXCEPTION 'slot_full';
  END IF;

  INSERT INTO appointments (
    business_id, subscriber_id, slot_start, slot_end,
    client_name, client_dni, notes, status, use_logged
  ) VALUES (
    p_business_id, p_subscriber_id, p_slot_start, p_slot_end,
    p_client_name, p_client_dni, p_notes, 'pending', false
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."public_book_appointment"("p_business_id" "uuid", "p_subscriber_id" "uuid", "p_slot_start" timestamp with time zone, "p_slot_end" timestamp with time zone, "p_client_name" "text", "p_client_dni" "text", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."public_cancel_appointment"("p_appointment_id" "uuid", "p_subscriber_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  UPDATE appointments
  SET status = 'cancelled'
  WHERE id = p_appointment_id
    AND subscriber_id = p_subscriber_id
    AND status IN ('pending', 'confirmed')
  RETURNING true;
$$;


ALTER FUNCTION "public"."public_cancel_appointment"("p_appointment_id" "uuid", "p_subscriber_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."public_check_existing_booking"("p_business_id" "uuid", "p_subscriber_id" "uuid") RETURNS TABLE("id" "uuid", "slot_start" timestamp with time zone, "slot_end" timestamp with time zone, "status" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT id, slot_start, slot_end, status
  FROM appointments
  WHERE business_id = p_business_id
    AND subscriber_id = p_subscriber_id
    AND status IN ('pending', 'confirmed')
    AND slot_start >= NOW()
  ORDER BY slot_start
  LIMIT 1;
$$;


ALTER FUNCTION "public"."public_check_existing_booking"("p_business_id" "uuid", "p_subscriber_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."public_get_booked_slots"("p_business_id" "uuid", "p_date" "text") RETURNS TABLE("slot_start" timestamp with time zone, "slot_end" timestamp with time zone, "status" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT slot_start, slot_end, status
  FROM appointments
  WHERE business_id = p_business_id
    AND slot_start >= (p_date || 'T00:00:00.000Z')::timestamptz
    AND slot_start <= (p_date || 'T23:59:59.999Z')::timestamptz
    AND status != 'cancelled';
$$;


ALTER FUNCTION "public"."public_get_booked_slots"("p_business_id" "uuid", "p_date" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."public_lookup_subscriber"("p_business_id" "uuid", "p_dni" "text") RETURNS TABLE("id" "uuid", "name" "text", "uses_remaining" integer, "status" "text", "end_date" "date")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT id, name, uses_remaining, status, end_date
  FROM subscribers
  WHERE business_id = p_business_id
    AND dni = p_dni
  LIMIT 1;
$$;


ALTER FUNCTION "public"."public_lookup_subscriber"("p_business_id" "uuid", "p_dni" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "subscriber_id" "uuid",
    "slot_start" timestamp with time zone NOT NULL,
    "slot_end" timestamp with time zone NOT NULL,
    "client_name" "text" NOT NULL,
    "client_dni" "text",
    "notes" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "use_logged" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "cancel_reason" "text",
    CONSTRAINT "appointments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "days_of_week" integer[] DEFAULT '{1,2,3,4,5}'::integer[],
    "start_time" time without time zone DEFAULT '09:00:00'::time without time zone,
    "end_time" time without time zone DEFAULT '18:00:00'::time without time zone,
    "slot_duration" integer DEFAULT 60,
    "advance_days" integer DEFAULT 7,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "block_name" "text",
    "slot_capacity" integer DEFAULT 1 NOT NULL,
    "simple_shift" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."business_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."businesses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "phone" "text",
    "address" "text",
    "instagram" "text",
    "facebook" "text",
    "tiktok" "text",
    "theme" "text" DEFAULT 'naranja'::"text",
    "tier" "text" DEFAULT 'free'::"text" NOT NULL,
    "mp_subscription_id" "text",
    "mp_status" "text",
    "subscription_ends_at" timestamp with time zone,
    "slug" "text",
    "agenda_enabled" boolean DEFAULT true,
    "allow_guest_bookings" boolean DEFAULT false,
    "is_promo" boolean DEFAULT false NOT NULL,
    "pending_tier" "text"
);


ALTER TABLE "public"."businesses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscriber_id" "uuid",
    "amount" numeric(10,2),
    "paid_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text",
    "business_id" "uuid"
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "total_uses" integer DEFAULT 1 NOT NULL,
    "duration_days" integer DEFAULT 30 NOT NULL,
    "is_template" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "items" "text"[] DEFAULT '{}'::"text"[]
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "nombre" "text",
    "apellido" "text",
    "telefono" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."public_contact_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'received'::"text" NOT NULL,
    "source" "text" DEFAULT 'public_contact_form'::"text" NOT NULL,
    "ip_hash" "text",
    "user_agent" "text",
    "email_sent_at" timestamp with time zone,
    "email_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "public_contact_messages_status_check" CHECK (("status" = ANY (ARRAY['received'::"text", 'email_failed'::"text"])))
);


ALTER TABLE "public"."public_contact_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "plan_id" "uuid",
    "name" "text" NOT NULL,
    "phone" "text",
    "notes" "text",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "uses_remaining" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "dni" "text",
    "email" "text"
);


ALTER TABLE "public"."subscribers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "business_name" "text",
    "email" "text",
    "category" "text",
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."support_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscriber_id" "uuid",
    "used_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text",
    "business_id" "uuid",
    "deleted_at" timestamp with time zone,
    "delete_reason" "text",
    "appointment_id" "uuid"
);


ALTER TABLE "public"."usage_logs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_availability"
    ADD CONSTRAINT "business_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."public_contact_messages"
    ADD CONSTRAINT "public_contact_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_messages"
    ADD CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage_logs"
    ADD CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id");



CREATE INDEX "business_availability_business_id_idx" ON "public"."business_availability" USING "btree" ("business_id");



CREATE INDEX "idx_usage_logs_business_used_at" ON "public"."usage_logs" USING "btree" ("business_id", "used_at" DESC) WHERE ("deleted_at" IS NULL);



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."business_availability"
    ADD CONSTRAINT "business_availability_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_messages"
    ADD CONSTRAINT "support_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."usage_logs"
    ADD CONSTRAINT "usage_logs_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."usage_logs"
    ADD CONSTRAINT "usage_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id");



ALTER TABLE ONLY "public"."usage_logs"
    ADD CONSTRAINT "usage_logs_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE CASCADE;



CREATE POLICY "Only admins can read admin_users" ON "public"."admin_users" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner inserts own appointments" ON "public"."appointments" FOR INSERT WITH CHECK (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."user_id" = "auth"."uid"()))));



CREATE POLICY "Owner inserts own availability" ON "public"."business_availability" FOR INSERT WITH CHECK (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."user_id" = "auth"."uid"()))));



CREATE POLICY "Owner manages appointments" ON "public"."appointments" USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."user_id" = "auth"."uid"()))));



CREATE POLICY "Owner manages availability" ON "public"."business_availability" USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."user_id" = "auth"."uid"()))));



CREATE POLICY "Owner updates appointments" ON "public"."appointments" FOR UPDATE USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."user_id" = "auth"."uid"()))));



CREATE POLICY "Owner updates availability" ON "public"."business_availability" FOR UPDATE USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."user_id" = "auth"."uid"()))));



CREATE POLICY "Public reads availability" ON "public"."business_availability" FOR SELECT USING (true);



CREATE POLICY "Public reads businesses" ON "public"."businesses" FOR SELECT USING (true);



CREATE POLICY "Users can update their own payments" ON "public"."payments" FOR UPDATE USING (("subscriber_id" IN ( SELECT "subscribers"."id"
   FROM "public"."subscribers"
  WHERE ("subscribers"."business_id" IN ( SELECT "businesses"."id"
           FROM "public"."businesses"
          WHERE ("businesses"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can update their own usage_logs" ON "public"."usage_logs" FOR UPDATE USING (("subscriber_id" IN ( SELECT "subscribers"."id"
   FROM "public"."subscribers"
  WHERE ("subscribers"."business_id" IN ( SELECT "businesses"."id"
           FROM "public"."businesses"
          WHERE ("businesses"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."businesses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "businesses_admin_update" ON "public"."businesses" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "businesses_protect_tier_fields" ON "public"."businesses" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("public"."is_admin"() OR ("public"."_tier_fields_unchanged"("id", "tier", "subscription_ends_at", "mp_subscription_id", "mp_status", "pending_tier") AND ("is_promo" = ( SELECT "b"."is_promo"
   FROM "public"."businesses" "b"
  WHERE ("b"."id" = "businesses"."id"))))));



CREATE POLICY "insert own" ON "public"."support_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own profile select" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "own profile update" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "own_business" ON "public"."businesses" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "own_payments" ON "public"."payments" USING (("subscriber_id" IN ( SELECT "s"."id"
   FROM ("public"."subscribers" "s"
     JOIN "public"."businesses" "b" ON (("s"."business_id" = "b"."id")))
  WHERE ("b"."user_id" = "auth"."uid"()))));



CREATE POLICY "own_plans" ON "public"."plans" USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."user_id" = "auth"."uid"()))));



CREATE POLICY "own_subscribers" ON "public"."subscribers" USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."user_id" = "auth"."uid"()))));



CREATE POLICY "own_usage_logs" ON "public"."usage_logs" USING (("subscriber_id" IN ( SELECT "s"."id"
   FROM ("public"."subscribers" "s"
     JOIN "public"."businesses" "b" ON (("s"."business_id" = "b"."id")))
  WHERE ("b"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "plans_insert_tier_limit" ON "public"."plans" AS RESTRICTIVE FOR INSERT WITH CHECK ("public"."can_add_plan"("business_id"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."public_contact_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscribers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscribers_insert_tier_limit" ON "public"."subscribers" AS RESTRICTIVE FOR INSERT WITH CHECK ("public"."can_add_subscriber"("business_id"));



ALTER TABLE "public"."support_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage_logs" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."_tier_fields_unchanged"("p_id" "uuid", "p_tier" "text", "p_ends_at" timestamp with time zone, "p_mp_sub_id" "text", "p_mp_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_tier_fields_unchanged"("p_id" "uuid", "p_tier" "text", "p_ends_at" timestamp with time zone, "p_mp_sub_id" "text", "p_mp_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_tier_fields_unchanged"("p_id" "uuid", "p_tier" "text", "p_ends_at" timestamp with time zone, "p_mp_sub_id" "text", "p_mp_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_tier_fields_unchanged"("p_id" "uuid", "p_tier" "text", "p_ends_at" timestamp with time zone, "p_mp_sub_id" "text", "p_mp_status" "text", "p_pending_tier" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_tier_fields_unchanged"("p_id" "uuid", "p_tier" "text", "p_ends_at" timestamp with time zone, "p_mp_sub_id" "text", "p_mp_status" "text", "p_pending_tier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_tier_fields_unchanged"("p_id" "uuid", "p_tier" "text", "p_ends_at" timestamp with time zone, "p_mp_sub_id" "text", "p_mp_status" "text", "p_pending_tier" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_delete_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_user"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_subscribers"("p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_subscribers"("p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_subscribers"("p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_list_businesses"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_list_businesses"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_list_businesses"() TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_user"("p_user_id" "uuid", "p_nombre" "text", "p_apellido" "text", "p_telefono" "text", "p_business_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_user"("p_user_id" "uuid", "p_nombre" "text", "p_apellido" "text", "p_telefono" "text", "p_business_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_user"("p_user_id" "uuid", "p_nombre" "text", "p_apellido" "text", "p_telefono" "text", "p_business_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_add_plan"("p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_add_plan"("p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_add_plan"("p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_add_subscriber"("p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_add_subscriber"("p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_add_subscriber"("p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_usage_log_atomic"("p_log_id" "uuid", "p_business_id" "uuid", "p_delete_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_usage_log_atomic"("p_log_id" "uuid", "p_business_id" "uuid", "p_delete_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_usage_log_atomic"("p_log_id" "uuid", "p_business_id" "uuid", "p_delete_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_effective_tier"("p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_effective_tier"("p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_effective_tier"("p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."public_book_appointment"("p_business_id" "uuid", "p_subscriber_id" "uuid", "p_slot_start" timestamp with time zone, "p_slot_end" timestamp with time zone, "p_client_name" "text", "p_client_dni" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."public_book_appointment"("p_business_id" "uuid", "p_subscriber_id" "uuid", "p_slot_start" timestamp with time zone, "p_slot_end" timestamp with time zone, "p_client_name" "text", "p_client_dni" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."public_book_appointment"("p_business_id" "uuid", "p_subscriber_id" "uuid", "p_slot_start" timestamp with time zone, "p_slot_end" timestamp with time zone, "p_client_name" "text", "p_client_dni" "text", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."public_cancel_appointment"("p_appointment_id" "uuid", "p_subscriber_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."public_cancel_appointment"("p_appointment_id" "uuid", "p_subscriber_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."public_cancel_appointment"("p_appointment_id" "uuid", "p_subscriber_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."public_check_existing_booking"("p_business_id" "uuid", "p_subscriber_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."public_check_existing_booking"("p_business_id" "uuid", "p_subscriber_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."public_check_existing_booking"("p_business_id" "uuid", "p_subscriber_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."public_get_booked_slots"("p_business_id" "uuid", "p_date" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."public_get_booked_slots"("p_business_id" "uuid", "p_date" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."public_get_booked_slots"("p_business_id" "uuid", "p_date" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."public_lookup_subscriber"("p_business_id" "uuid", "p_dni" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."public_lookup_subscriber"("p_business_id" "uuid", "p_dni" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."public_lookup_subscriber"("p_business_id" "uuid", "p_dni" "text") TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."business_availability" TO "anon";
GRANT ALL ON TABLE "public"."business_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."business_availability" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."businesses" TO "anon";
GRANT ALL ON TABLE "public"."businesses" TO "authenticated";
GRANT ALL ON TABLE "public"."businesses" TO "service_role";



GRANT SELECT("id") ON TABLE "public"."businesses" TO "anon";



GRANT SELECT("name") ON TABLE "public"."businesses" TO "anon";



GRANT SELECT("category") ON TABLE "public"."businesses" TO "anon";



GRANT SELECT("created_at") ON TABLE "public"."businesses" TO "anon";



GRANT SELECT("phone") ON TABLE "public"."businesses" TO "anon";



GRANT SELECT("address") ON TABLE "public"."businesses" TO "anon";



GRANT SELECT("instagram") ON TABLE "public"."businesses" TO "anon";



GRANT SELECT("facebook") ON TABLE "public"."businesses" TO "anon";



GRANT SELECT("tiktok") ON TABLE "public"."businesses" TO "anon";



GRANT SELECT("theme") ON TABLE "public"."businesses" TO "anon";



GRANT SELECT("slug") ON TABLE "public"."businesses" TO "anon";



GRANT SELECT("agenda_enabled") ON TABLE "public"."businesses" TO "anon";



GRANT SELECT("allow_guest_bookings") ON TABLE "public"."businesses" TO "anon";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."public_contact_messages" TO "service_role";



GRANT ALL ON TABLE "public"."subscribers" TO "anon";
GRANT ALL ON TABLE "public"."subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."subscribers" TO "service_role";



GRANT ALL ON TABLE "public"."support_messages" TO "anon";
GRANT ALL ON TABLE "public"."support_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."support_messages" TO "service_role";



GRANT ALL ON TABLE "public"."usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_logs" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







