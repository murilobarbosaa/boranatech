


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_ai_usage_today"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select count(*)::integer
  from public.ai_usage_logs
  where user_id = p_user_id
    and status = 'success'
    and created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo');
$$;


ALTER FUNCTION "public"."get_ai_usage_today"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_study_heatmap"("p_user_id" "uuid", "p_days" integer DEFAULT 365) RETURNS TABLE("date" "date", "minutes" integer, "entries" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    (date_trunc('day', studied_at at time zone 'America/Sao_Paulo'))::date as date,
    coalesce(sum(minutes), 0)::integer as minutes,
    count(*)::integer as entries
  from study_entries
  where user_id = p_user_id
    and studied_at >= (now() - (p_days || ' days')::interval)
  group by (date_trunc('day', studied_at at time zone 'America/Sao_Paulo'))::date
  order by date asc;
$$;


ALTER FUNCTION "public"."get_study_heatmap"("p_user_id" "uuid", "p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_study_stats"("p_user_id" "uuid", "p_range" "text" DEFAULT '30d'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_days integer;
  v_from date;
  v_total_minutes integer;
  v_days_studied integer;
  v_current_streak integer;
  v_longest_streak integer;
  v_streak_count integer;
  v_prev_date date;
  v_entry_date date;
begin
  v_days := case
    when p_range = '7d' then 7
    when p_range = '30d' then 30
    when p_range = '90d' then 90
    else 30
  end;

  v_from := current_date - v_days;

  select
    coalesce(sum(minutes), 0),
    count(distinct studied_at)
  into v_total_minutes, v_days_studied
  from public.study_entries
  where user_id = p_user_id
    and studied_at >= v_from;

  -- Calcular streak atual
  v_current_streak := 0;
  v_prev_date := current_date + 1;

  for v_entry_date in
    select distinct studied_at
    from public.study_entries
    where user_id = p_user_id
    order by studied_at desc
  loop
    if v_prev_date - v_entry_date = 1 or v_current_streak = 0 then
      v_current_streak := v_current_streak + 1;
      v_prev_date := v_entry_date;
    else
      exit;
    end if;
  end loop;

  -- Calcular longest streak
  v_longest_streak := 0;
  v_streak_count := 0;
  v_prev_date := null;

  for v_entry_date in
    select distinct studied_at
    from public.study_entries
    where user_id = p_user_id
    order by studied_at asc
  loop
    if v_prev_date is null or v_entry_date - v_prev_date = 1 then
      v_streak_count := v_streak_count + 1;
    else
      v_streak_count := 1;
    end if;
    if v_streak_count > v_longest_streak then
      v_longest_streak := v_streak_count;
    end if;
    v_prev_date := v_entry_date;
  end loop;

  return jsonb_build_object(
    'total_minutes', v_total_minutes,
    'days_studied', v_days_studied,
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak
  );
end;
$$;


ALTER FUNCTION "public"."get_study_stats"("p_user_id" "uuid", "p_range" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (user_id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_admin"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select exists (
    select 1 from public.admin_roles
    where user_id = p_user_id
  );
$$;


ALTER FUNCTION "public"."is_user_admin"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_pro"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select exists (
    select 1
    from public.subscriptions s
    join public.plans p on p.id = s.plan_id
    where s.user_id = p_user_id
      and p.code != 'free'
      and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;


ALTER FUNCTION "public"."is_user_pro"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_search_vector"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(new.description, '')), 'B');
  return new;
end;
$$;


ALTER FUNCTION "public"."update_search_vector"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'editor'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "admin_roles_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'editor'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."admin_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."affiliates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "code" "text" NOT NULL,
    "discount_percent" integer DEFAULT 20 NOT NULL,
    "commission_percent" integer DEFAULT 30 NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "clicks" integer DEFAULT 0 NOT NULL,
    "trials" integer DEFAULT 0 NOT NULL,
    "sales" integer DEFAULT 0 NOT NULL,
    "revenue_cents" integer DEFAULT 0 NOT NULL,
    "commission_due_cents" integer DEFAULT 0 NOT NULL,
    "commission_paid_cents" integer DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "affiliates_commission_percent_check" CHECK ((("commission_percent" >= 1) AND ("commission_percent" <= 100))),
    CONSTRAINT "affiliates_discount_percent_check" CHECK ((("discount_percent" >= 1) AND ("discount_percent" <= 100))),
    CONSTRAINT "affiliates_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."affiliates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "tool" "text" NOT NULL,
    "request_id" "text",
    "input_chars" integer,
    "output_chars" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "model" "text",
    "status" "text" NOT NULL,
    "error_message" "text",
    "cost_estimate" numeric(10,6),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_usage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."areas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "short_description" "text",
    "full_description" "text",
    "tag" "text",
    "tag_class" "text",
    "icon" "text",
    "color" "text",
    "daily_tasks" "jsonb" DEFAULT '[]'::"jsonb",
    "profile_indicated" "text",
    "skills" "jsonb" DEFAULT '[]'::"jsonb",
    "tools" "jsonb" DEFAULT '[]'::"jsonb",
    "roles" "jsonb" DEFAULT '[]'::"jsonb",
    "average_salary" "jsonb" DEFAULT '{}'::"jsonb",
    "initial_roadmap" "jsonb" DEFAULT '[]'::"jsonb",
    "projects" "jsonb" DEFAULT '[]'::"jsonb",
    "free_courses" "jsonb" DEFAULT '[]'::"jsonb",
    "essential_terms" "jsonb" DEFAULT '[]'::"jsonb",
    "initial_tips" "text",
    "is_pro" boolean DEFAULT false,
    "is_published" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."career_quiz_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "attempt_id" "uuid" NOT NULL,
    "question_id" "text" NOT NULL,
    "answer_id" "text",
    "answer_text" "text",
    "area" "text",
    "order_index" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."career_quiz_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."career_quiz_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "result_area" "text",
    "result_area_slug" "text",
    "confidence" integer,
    "result_json" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "career_quiz_attempts_confidence_check" CHECK ((("confidence" >= 0) AND ("confidence" <= 100)))
);


ALTER TABLE "public"."career_quiz_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "base_url" "text",
    "status" "text" DEFAULT 'inactive'::"text",
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "last_sync_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "content_sources_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'error'::"text"]))),
    CONSTRAINT "content_sources_type_check" CHECK (("type" = ANY (ARRAY['rss'::"text", 'jobs-api'::"text", 'events-api'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."content_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_sync_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_id" "uuid",
    "status" "text" NOT NULL,
    "started_at" timestamp with time zone NOT NULL,
    "finished_at" timestamp with time zone,
    "items_found" integer DEFAULT 0,
    "items_created" integer DEFAULT 0,
    "items_updated" integer DEFAULT 0,
    "items_failed" integer DEFAULT 0,
    "error_message" "text",
    "raw_summary" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "content_sync_logs_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'error'::"text", 'partial'::"text"])))
);


ALTER TABLE "public"."content_sync_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text",
    "title" "text" NOT NULL,
    "provider" "text",
    "url" "text",
    "area_slug" "text",
    "technology_slugs" "jsonb" DEFAULT '[]'::"jsonb",
    "level" "text",
    "price_label" "text",
    "is_free" boolean DEFAULT true,
    "workload_hours" integer,
    "certificate" boolean DEFAULT false,
    "description" "text",
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "language" "text" DEFAULT 'pt-BR'::"text",
    "rating" numeric(3,1),
    "is_published" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses_backup_20260516" (
    "id" "uuid",
    "slug" "text",
    "title" "text",
    "provider" "text",
    "url" "text",
    "area_slug" "text",
    "technology_slugs" "jsonb",
    "level" "text",
    "price_label" "text",
    "is_free" boolean,
    "workload_hours" integer,
    "certificate" boolean,
    "description" "text",
    "tags" "jsonb",
    "language" "text",
    "rating" numeric(3,1),
    "is_published" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."courses_backup_20260516" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text",
    "title" "text" NOT NULL,
    "description" "text",
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "location_label" "text",
    "city" "text",
    "state" "text",
    "online" boolean DEFAULT false,
    "url" "text",
    "source" "text",
    "source_external_id" "text",
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "is_published" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."external_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "external_id" "text",
    "source" "text" NOT NULL,
    "title" "text" NOT NULL,
    "company" "text",
    "location" "text",
    "remote" boolean DEFAULT false,
    "seniority" "text",
    "employment_type" "text",
    "url" "text" NOT NULL,
    "description" "text",
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "area_slug" "text",
    "published_at" timestamp with time zone,
    "fetched_at" timestamp with time zone DEFAULT "now"(),
    "is_published" boolean DEFAULT true
);


ALTER TABLE "public"."external_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."news" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text",
    "title" "text" NOT NULL,
    "summary" "text",
    "url" "text" NOT NULL,
    "image_url" "text",
    "source" "text",
    "author" "text",
    "published_at" timestamp with time zone,
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "is_external" boolean DEFAULT true,
    "is_published" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."news" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'BRL'::"text",
    "interval" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "provider_price_id" "text",
    "is_active" boolean DEFAULT true,
    "features" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platforms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text",
    "name" "text" NOT NULL,
    "url" "text",
    "description" "text",
    "price_label" "text",
    "strengths" "jsonb" DEFAULT '[]'::"jsonb",
    "limitations" "jsonb" DEFAULT '[]'::"jsonb",
    "best_for" "jsonb" DEFAULT '[]'::"jsonb",
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "rating" numeric(3,1),
    "is_published" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."platforms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text",
    "email" "text",
    "handle" "text",
    "avatar_url" "text",
    "bio" "text",
    "area_interesse" "text",
    "nivel_atual" "text",
    "objetivo" "text",
    "onboarding_completed" boolean DEFAULT false,
    "onboarding_step" integer DEFAULT 0,
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "welcome_email_sent" boolean DEFAULT false NOT NULL,
    "avatar_border" "text" DEFAULT 'classic'::"text" NOT NULL,
    "avatar_icon" "text" DEFAULT 'initials'::"text" NOT NULL,
    "avatar_bg" "text" DEFAULT 'yellow'::"text" NOT NULL,
    CONSTRAINT "profiles_avatar_bg_check" CHECK (("avatar_bg" = ANY (ARRAY['slate'::"text", 'yellow'::"text", 'purple'::"text", 'pink'::"text", 'green'::"text", 'blue'::"text", 'orange'::"text", 'cream'::"text", 'white'::"text"]))),
    CONSTRAINT "profiles_avatar_border_check" CHECK (("avatar_border" = ANY (ARRAY['classic'::"text", 'purple'::"text", 'gold'::"text", 'pink'::"text", 'green'::"text", 'blue'::"text", 'orange'::"text", 'red'::"text", 'cyan'::"text"]))),
    CONSTRAINT "profiles_avatar_icon_check" CHECK (("avatar_icon" = ANY (ARRAY['initials'::"text", 'code'::"text", 'sparkles'::"text", 'rocket'::"text", 'brain'::"text", 'laptop'::"text", 'star'::"text", 'target'::"text", 'crown'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text",
    "title" "text" NOT NULL,
    "description" "text",
    "objective" "text",
    "level" "text",
    "area_slug" "text",
    "tools" "jsonb" DEFAULT '[]'::"jsonb",
    "simplified_steps" "jsonb" DEFAULT '[]'::"jsonb",
    "portfolio_tips" "text",
    "linkedin_suggestion" "text",
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "is_published" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects_backup_20260516" (
    "id" "uuid",
    "slug" "text",
    "title" "text",
    "description" "text",
    "objective" "text",
    "level" "text",
    "area_slug" "text",
    "tools" "jsonb",
    "simplified_steps" "jsonb",
    "portfolio_tips" "text",
    "linkedin_suggestion" "text",
    "tags" "jsonb",
    "is_published" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."projects_backup_20260516" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roadmap_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "roadmap_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "order_index" integer NOT NULL,
    "estimated_hours" integer,
    "resources" "jsonb" DEFAULT '[]'::"jsonb",
    "deliverable" "text",
    "is_pro" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roadmap_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roadmaps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "area_slug" "text",
    "level" "text",
    "estimated_duration_weeks" integer,
    "is_pro" boolean DEFAULT false,
    "is_published" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roadmaps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roadmaps_backup_20260516" (
    "id" "uuid",
    "slug" "text",
    "title" "text",
    "description" "text",
    "area_slug" "text",
    "level" "text",
    "estimated_duration_weeks" integer,
    "is_pro" boolean,
    "is_published" boolean,
    "sort_order" integer,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."roadmaps_backup_20260516" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."search_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "url" "text",
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "search_vector" "tsvector",
    "is_published" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."search_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "studied_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "minutes" integer DEFAULT 0 NOT NULL,
    "mode" "text" DEFAULT 'ritmo'::"text" NOT NULL,
    "text" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "study_entries_minutes_check" CHECK (("minutes" >= 0)),
    CONSTRAINT "study_entries_mode_check" CHECK (("mode" = ANY (ARRAY['produtiva'::"text", 'ritmo'::"text", 'dispersa'::"text", 'revisar'::"text"])))
);


ALTER TABLE "public"."study_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_cancellations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider_subscription_id" "text",
    "reason_code" "text",
    "reason_text" "text",
    "canceled_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "effective_at" timestamp with time zone,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    CONSTRAINT "subscription_cancellations_reason_code_check" CHECK (("reason_code" = ANY (ARRAY['expensive'::"text", 'unused'::"text", 'missing_feature'::"text", 'paused'::"text", 'other'::"text"]))),
    CONSTRAINT "subscription_cancellations_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'completed'::"text", 'reverted'::"text"])))
);


ALTER TABLE "public"."subscription_cancellations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "uuid",
    "provider" "text" DEFAULT 'asaas'::"text" NOT NULL,
    "provider_customer_id" "text",
    "provider_subscription_id" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "canceled_at" timestamp with time zone,
    "raw_provider_payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."technologies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "description" "text",
    "long_description" "text",
    "icon" "text",
    "color" "text",
    "use_cases" "jsonb" DEFAULT '[]'::"jsonb",
    "pros" "jsonb" DEFAULT '[]'::"jsonb",
    "cons" "jsonb" DEFAULT '[]'::"jsonb",
    "learning_path" "jsonb" DEFAULT '[]'::"jsonb",
    "related_area_slugs" "jsonb" DEFAULT '[]'::"jsonb",
    "market_demand" "text",
    "difficulty" "text",
    "beginner_friendly_score" integer,
    "salary_context" "jsonb" DEFAULT '{}'::"jsonb",
    "resources" "jsonb" DEFAULT '[]'::"jsonb",
    "tools" "jsonb" DEFAULT '[]'::"jsonb",
    "companies_using" "jsonb" DEFAULT '[]'::"jsonb",
    "is_published" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."technologies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "badge_id" "text" NOT NULL,
    "unlocked_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_bookmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_id" "text" NOT NULL,
    "title_snapshot" "text",
    "subtitle_snapshot" "text",
    "url_snapshot" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_bookmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roadmap_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "roadmap_id" "uuid" NOT NULL,
    "step_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_roadmap_progress_status_check" CHECK (("status" = ANY (ARRAY['completed'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."user_roadmap_progress" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_roles"
    ADD CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_roles"
    ADD CONSTRAINT "admin_roles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."affiliates"
    ADD CONSTRAINT "affiliates_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."affiliates"
    ADD CONSTRAINT "affiliates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."areas"
    ADD CONSTRAINT "areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."areas"
    ADD CONSTRAINT "areas_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."career_quiz_answers"
    ADD CONSTRAINT "career_quiz_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."career_quiz_attempts"
    ADD CONSTRAINT "career_quiz_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_sources"
    ADD CONSTRAINT "content_sources_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."content_sources"
    ADD CONSTRAINT "content_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_sync_logs"
    ADD CONSTRAINT "content_sync_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."external_jobs"
    ADD CONSTRAINT "external_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."external_jobs"
    ADD CONSTRAINT "external_jobs_url_key" UNIQUE ("url");



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_url_key" UNIQUE ("url");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platforms"
    ADD CONSTRAINT "platforms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platforms"
    ADD CONSTRAINT "platforms_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_handle_key" UNIQUE ("handle");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."roadmap_steps"
    ADD CONSTRAINT "roadmap_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roadmaps"
    ADD CONSTRAINT "roadmaps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roadmaps"
    ADD CONSTRAINT "roadmaps_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."search_documents"
    ADD CONSTRAINT "search_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."search_documents"
    ADD CONSTRAINT "search_documents_resource_type_resource_id_key" UNIQUE ("resource_type", "resource_id");



ALTER TABLE ONLY "public"."study_entries"
    ADD CONSTRAINT "study_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_cancellations"
    ADD CONSTRAINT "subscription_cancellations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_provider_subscription_id_key" UNIQUE ("provider_subscription_id");



ALTER TABLE ONLY "public"."technologies"
    ADD CONSTRAINT "technologies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."technologies"
    ADD CONSTRAINT "technologies_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "unique_user_badge" UNIQUE ("user_id", "badge_id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_bookmarks"
    ADD CONSTRAINT "user_bookmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_bookmarks"
    ADD CONSTRAINT "user_bookmarks_user_id_resource_type_resource_id_key" UNIQUE ("user_id", "resource_type", "resource_id");



ALTER TABLE ONLY "public"."user_roadmap_progress"
    ADD CONSTRAINT "user_roadmap_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roadmap_progress"
    ADD CONSTRAINT "user_roadmap_progress_user_id_step_id_key" UNIQUE ("user_id", "step_id");



CREATE INDEX "affiliates_code_idx" ON "public"."affiliates" USING "btree" ("code");



CREATE INDEX "affiliates_status_idx" ON "public"."affiliates" USING "btree" ("status");



CREATE INDEX "ai_usage_logs_created_at_idx" ON "public"."ai_usage_logs" USING "btree" ("created_at");



CREATE INDEX "ai_usage_logs_tool_idx" ON "public"."ai_usage_logs" USING "btree" ("tool");



CREATE INDEX "ai_usage_logs_user_id_idx" ON "public"."ai_usage_logs" USING "btree" ("user_id");



CREATE INDEX "areas_published_idx" ON "public"."areas" USING "btree" ("is_published", "sort_order");



CREATE INDEX "areas_slug_idx" ON "public"."areas" USING "btree" ("slug");



CREATE INDEX "career_quiz_answers_attempt_idx" ON "public"."career_quiz_answers" USING "btree" ("attempt_id");



CREATE INDEX "career_quiz_attempts_user_id_idx" ON "public"."career_quiz_attempts" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "content_sync_logs_source_idx" ON "public"."content_sync_logs" USING "btree" ("source_id", "created_at" DESC);



CREATE INDEX "courses_area_slug_idx" ON "public"."courses" USING "btree" ("area_slug");



CREATE INDEX "events_starts_at_idx" ON "public"."events" USING "btree" ("starts_at" DESC);



CREATE INDEX "external_jobs_area_slug_idx" ON "public"."external_jobs" USING "btree" ("area_slug");



CREATE INDEX "external_jobs_published_at_idx" ON "public"."external_jobs" USING "btree" ("published_at" DESC);



CREATE INDEX "external_jobs_seniority_idx" ON "public"."external_jobs" USING "btree" ("seniority");



CREATE INDEX "idx_user_badges_badge_id" ON "public"."user_badges" USING "btree" ("badge_id");



CREATE INDEX "idx_user_badges_user_id" ON "public"."user_badges" USING "btree" ("user_id");



CREATE INDEX "news_is_published_idx" ON "public"."news" USING "btree" ("is_published");



CREATE INDEX "news_published_at_idx" ON "public"."news" USING "btree" ("published_at" DESC);



CREATE INDEX "profiles_user_id_idx" ON "public"."profiles" USING "btree" ("user_id");



CREATE INDEX "projects_area_slug_idx" ON "public"."projects" USING "btree" ("area_slug");



CREATE INDEX "roadmap_steps_roadmap_id_idx" ON "public"."roadmap_steps" USING "btree" ("roadmap_id", "order_index");



CREATE INDEX "roadmaps_slug_idx" ON "public"."roadmaps" USING "btree" ("slug");



CREATE INDEX "search_documents_type_idx" ON "public"."search_documents" USING "btree" ("resource_type");



CREATE INDEX "search_documents_vector_idx" ON "public"."search_documents" USING "gin" ("search_vector");



CREATE INDEX "study_entries_studied_at_idx" ON "public"."study_entries" USING "btree" ("studied_at" DESC);



CREATE INDEX "study_entries_user_id_idx" ON "public"."study_entries" USING "btree" ("user_id");



CREATE INDEX "subscription_cancellations_canceled_at_idx" ON "public"."subscription_cancellations" USING "btree" ("canceled_at" DESC);



CREATE INDEX "subscription_cancellations_status_idx" ON "public"."subscription_cancellations" USING "btree" ("status");



CREATE INDEX "subscription_cancellations_user_id_idx" ON "public"."subscription_cancellations" USING "btree" ("user_id");



CREATE INDEX "subscriptions_cancel_at_period_end_idx" ON "public"."subscriptions" USING "btree" ("cancel_at_period_end") WHERE ("cancel_at_period_end" = true);



CREATE INDEX "subscriptions_provider_subscription_id_idx" ON "public"."subscriptions" USING "btree" ("provider_subscription_id");



CREATE INDEX "subscriptions_user_id_idx" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "technologies_category_idx" ON "public"."technologies" USING "btree" ("category");



CREATE INDEX "technologies_slug_idx" ON "public"."technologies" USING "btree" ("slug");



CREATE INDEX "user_bookmarks_resource_idx" ON "public"."user_bookmarks" USING "btree" ("resource_type", "resource_id");



CREATE INDEX "user_bookmarks_user_id_idx" ON "public"."user_bookmarks" USING "btree" ("user_id");



CREATE INDEX "user_roadmap_progress_user_idx" ON "public"."user_roadmap_progress" USING "btree" ("user_id", "roadmap_id");



CREATE OR REPLACE TRIGGER "affiliates_updated_at" BEFORE UPDATE ON "public"."affiliates" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "areas_updated_at" BEFORE UPDATE ON "public"."areas" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "content_sources_updated_at" BEFORE UPDATE ON "public"."content_sources" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "courses_updated_at" BEFORE UPDATE ON "public"."courses" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "events_updated_at" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "news_updated_at" BEFORE UPDATE ON "public"."news" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "plans_updated_at" BEFORE UPDATE ON "public"."plans" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "platforms_updated_at" BEFORE UPDATE ON "public"."platforms" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "roadmap_steps_updated_at" BEFORE UPDATE ON "public"."roadmap_steps" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "roadmaps_updated_at" BEFORE UPDATE ON "public"."roadmaps" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "search_documents_vector_update" BEFORE INSERT OR UPDATE ON "public"."search_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_search_vector"();



CREATE OR REPLACE TRIGGER "study_entries_updated_at" BEFORE UPDATE ON "public"."study_entries" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "technologies_updated_at" BEFORE UPDATE ON "public"."technologies" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "user_roadmap_progress_updated_at" BEFORE UPDATE ON "public"."user_roadmap_progress" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."admin_roles"
    ADD CONSTRAINT "admin_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."career_quiz_answers"
    ADD CONSTRAINT "career_quiz_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."career_quiz_attempts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."career_quiz_attempts"
    ADD CONSTRAINT "career_quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_sync_logs"
    ADD CONSTRAINT "content_sync_logs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."content_sources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."roadmap_steps"
    ADD CONSTRAINT "roadmap_steps_roadmap_id_fkey" FOREIGN KEY ("roadmap_id") REFERENCES "public"."roadmaps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_entries"
    ADD CONSTRAINT "study_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_cancellations"
    ADD CONSTRAINT "subscription_cancellations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_bookmarks"
    ADD CONSTRAINT "user_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roadmap_progress"
    ADD CONSTRAINT "user_roadmap_progress_roadmap_id_fkey" FOREIGN KEY ("roadmap_id") REFERENCES "public"."roadmaps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roadmap_progress"
    ADD CONSTRAINT "user_roadmap_progress_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."roadmap_steps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roadmap_progress"
    ADD CONSTRAINT "user_roadmap_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."admin_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_roles_select_own" ON "public"."admin_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."affiliates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "affiliates_admin_all" ON "public"."affiliates" USING (true) WITH CHECK (true);



ALTER TABLE "public"."ai_usage_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_usage_logs_select_own" ON "public"."ai_usage_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."areas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "areas_select_published" ON "public"."areas" FOR SELECT USING (("is_published" = true));



CREATE POLICY "bookmarks_delete_own" ON "public"."user_bookmarks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "bookmarks_insert_own" ON "public"."user_bookmarks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "bookmarks_select_own" ON "public"."user_bookmarks" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."career_quiz_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."career_quiz_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_sources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_sources_select_public" ON "public"."content_sources" FOR SELECT USING (true);



ALTER TABLE "public"."content_sync_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_sync_logs_select_public" ON "public"."content_sync_logs" FOR SELECT USING (true);



ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses_backup_20260516" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "courses_select_published" ON "public"."courses" FOR SELECT USING (("is_published" = true));



ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "events_select_published" ON "public"."events" FOR SELECT USING (("is_published" = true));



ALTER TABLE "public"."external_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "external_jobs_select_published" ON "public"."external_jobs" FOR SELECT USING (("is_published" = true));



ALTER TABLE "public"."news" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "news_select_published" ON "public"."news" FOR SELECT USING (("is_published" = true));



ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "plans_select_public" ON "public"."plans" FOR SELECT USING (("is_active" = true));



ALTER TABLE "public"."platforms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "platforms_select_published" ON "public"."platforms" FOR SELECT USING (("is_published" = true));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects_backup_20260516" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projects_select_published" ON "public"."projects" FOR SELECT USING (("is_published" = true));



CREATE POLICY "quiz_answers_insert_own" ON "public"."career_quiz_answers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."career_quiz_attempts" "a"
  WHERE (("a"."id" = "career_quiz_answers"."attempt_id") AND ("a"."user_id" = "auth"."uid"())))));



CREATE POLICY "quiz_answers_select_own" ON "public"."career_quiz_answers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."career_quiz_attempts" "a"
  WHERE (("a"."id" = "career_quiz_answers"."attempt_id") AND ("a"."user_id" = "auth"."uid"())))));



CREATE POLICY "quiz_attempts_insert_own" ON "public"."career_quiz_attempts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "quiz_attempts_select_own" ON "public"."career_quiz_attempts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "quiz_attempts_update_own" ON "public"."career_quiz_attempts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "roadmap_progress_delete_own" ON "public"."user_roadmap_progress" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "roadmap_progress_insert_own" ON "public"."user_roadmap_progress" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "roadmap_progress_select_own" ON "public"."user_roadmap_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "roadmap_progress_update_own" ON "public"."user_roadmap_progress" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."roadmap_steps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "roadmap_steps_select_published" ON "public"."roadmap_steps" FOR SELECT USING (true);



ALTER TABLE "public"."roadmaps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roadmaps_backup_20260516" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "roadmaps_select_published" ON "public"."roadmaps" FOR SELECT USING (("is_published" = true));



ALTER TABLE "public"."search_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "search_documents_select_published" ON "public"."search_documents" FOR SELECT USING (("is_published" = true));



ALTER TABLE "public"."study_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "study_entries_delete_own" ON "public"."study_entries" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "study_entries_insert_own" ON "public"."study_entries" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "study_entries_select_own" ON "public"."study_entries" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "study_entries_update_own" ON "public"."study_entries" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."subscription_cancellations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscription_cancellations_own_select" ON "public"."subscription_cancellations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "subscription_cancellations_service_role_all" ON "public"."subscription_cancellations" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscriptions_select_own" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."technologies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "technologies_select_published" ON "public"."technologies" FOR SELECT USING (("is_published" = true));



ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_bookmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roadmap_progress" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_can_read_own_badges" ON "public"."user_badges" FOR SELECT USING (("auth"."uid"() = "user_id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."get_ai_usage_today"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ai_usage_today"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ai_usage_today"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_study_heatmap"("p_user_id" "uuid", "p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_study_heatmap"("p_user_id" "uuid", "p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_study_heatmap"("p_user_id" "uuid", "p_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_study_stats"("p_user_id" "uuid", "p_range" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_study_stats"("p_user_id" "uuid", "p_range" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_study_stats"("p_user_id" "uuid", "p_range" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_admin"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_admin"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_admin"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_pro"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_pro"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_pro"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_search_vector"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_search_vector"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_search_vector"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_roles" TO "anon";
GRANT ALL ON TABLE "public"."admin_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_roles" TO "service_role";



GRANT ALL ON TABLE "public"."affiliates" TO "anon";
GRANT ALL ON TABLE "public"."affiliates" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliates" TO "service_role";



GRANT ALL ON TABLE "public"."ai_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."ai_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_usage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."areas" TO "anon";
GRANT ALL ON TABLE "public"."areas" TO "authenticated";
GRANT ALL ON TABLE "public"."areas" TO "service_role";



GRANT ALL ON TABLE "public"."career_quiz_answers" TO "anon";
GRANT ALL ON TABLE "public"."career_quiz_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."career_quiz_answers" TO "service_role";



GRANT ALL ON TABLE "public"."career_quiz_attempts" TO "anon";
GRANT ALL ON TABLE "public"."career_quiz_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."career_quiz_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."content_sources" TO "anon";
GRANT ALL ON TABLE "public"."content_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."content_sources" TO "service_role";



GRANT ALL ON TABLE "public"."content_sync_logs" TO "anon";
GRANT ALL ON TABLE "public"."content_sync_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."content_sync_logs" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."courses_backup_20260516" TO "anon";
GRANT ALL ON TABLE "public"."courses_backup_20260516" TO "authenticated";
GRANT ALL ON TABLE "public"."courses_backup_20260516" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."external_jobs" TO "anon";
GRANT ALL ON TABLE "public"."external_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."external_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."news" TO "anon";
GRANT ALL ON TABLE "public"."news" TO "authenticated";
GRANT ALL ON TABLE "public"."news" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."platforms" TO "anon";
GRANT ALL ON TABLE "public"."platforms" TO "authenticated";
GRANT ALL ON TABLE "public"."platforms" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."projects_backup_20260516" TO "anon";
GRANT ALL ON TABLE "public"."projects_backup_20260516" TO "authenticated";
GRANT ALL ON TABLE "public"."projects_backup_20260516" TO "service_role";



GRANT ALL ON TABLE "public"."roadmap_steps" TO "anon";
GRANT ALL ON TABLE "public"."roadmap_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."roadmap_steps" TO "service_role";



GRANT ALL ON TABLE "public"."roadmaps" TO "anon";
GRANT ALL ON TABLE "public"."roadmaps" TO "authenticated";
GRANT ALL ON TABLE "public"."roadmaps" TO "service_role";



GRANT ALL ON TABLE "public"."roadmaps_backup_20260516" TO "anon";
GRANT ALL ON TABLE "public"."roadmaps_backup_20260516" TO "authenticated";
GRANT ALL ON TABLE "public"."roadmaps_backup_20260516" TO "service_role";



GRANT ALL ON TABLE "public"."search_documents" TO "anon";
GRANT ALL ON TABLE "public"."search_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."search_documents" TO "service_role";



GRANT ALL ON TABLE "public"."study_entries" TO "anon";
GRANT ALL ON TABLE "public"."study_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."study_entries" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_cancellations" TO "anon";
GRANT ALL ON TABLE "public"."subscription_cancellations" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_cancellations" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."technologies" TO "anon";
GRANT ALL ON TABLE "public"."technologies" TO "authenticated";
GRANT ALL ON TABLE "public"."technologies" TO "service_role";



GRANT ALL ON TABLE "public"."user_badges" TO "anon";
GRANT ALL ON TABLE "public"."user_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."user_badges" TO "service_role";



GRANT ALL ON TABLE "public"."user_bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."user_bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."user_bookmarks" TO "service_role";



GRANT ALL ON TABLE "public"."user_roadmap_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_roadmap_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roadmap_progress" TO "service_role";









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































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


