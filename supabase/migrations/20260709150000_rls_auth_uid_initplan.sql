-- Applied manually via Supabase SQL Editor on 2026-07-09.
-- Wraps auth.uid() in a scalar subselect so Postgres evaluates it once
-- per query (initplan) instead of once per row in RLS policies.

ALTER POLICY profiles_select_own ON public.profiles USING (((select auth.uid()) = user_id));
ALTER POLICY profiles_update_own ON public.profiles USING (((select auth.uid()) = user_id));
ALTER POLICY subscriptions_select_own ON public.subscriptions USING (((select auth.uid()) = user_id));
ALTER POLICY ai_usage_logs_select_own ON public.ai_usage_logs USING (((select auth.uid()) = user_id));
ALTER POLICY bookmarks_select_own ON public.user_bookmarks USING (((select auth.uid()) = user_id));
ALTER POLICY bookmarks_delete_own ON public.user_bookmarks USING (((select auth.uid()) = user_id));
ALTER POLICY roadmap_progress_select_own ON public.user_roadmap_progress USING (((select auth.uid()) = user_id));
ALTER POLICY roadmap_progress_update_own ON public.user_roadmap_progress USING (((select auth.uid()) = user_id));
ALTER POLICY roadmap_progress_delete_own ON public.user_roadmap_progress USING (((select auth.uid()) = user_id));
ALTER POLICY quiz_attempts_select_own ON public.career_quiz_attempts USING (((select auth.uid()) = user_id));
ALTER POLICY quiz_attempts_update_own ON public.career_quiz_attempts USING (((select auth.uid()) = user_id));
ALTER POLICY quiz_answers_select_own ON public.career_quiz_answers USING ((EXISTS ( SELECT 1
   FROM career_quiz_attempts a
  WHERE ((a.id = career_quiz_answers.attempt_id) AND (a.user_id = (select auth.uid()))))));
ALTER POLICY admin_roles_select_own ON public.admin_roles USING (((select auth.uid()) = user_id));
ALTER POLICY study_entries_select_own ON public.study_entries USING (((select auth.uid()) = user_id));
ALTER POLICY study_entries_update_own ON public.study_entries USING (((select auth.uid()) = user_id));
ALTER POLICY study_entries_delete_own ON public.study_entries USING (((select auth.uid()) = user_id));
ALTER POLICY subscription_cancellations_own_select ON public.subscription_cancellations USING (((select auth.uid()) = user_id));
ALTER POLICY users_can_read_own_badges ON public.user_badges USING (((select auth.uid()) = user_id));
ALTER POLICY content_audit_logs_select_admin ON public.content_audit_logs USING (is_user_admin((select auth.uid())));
ALTER POLICY "users read own progress" ON public.user_progress USING (((select auth.uid()) = user_id));
ALTER POLICY "users update own progress" ON public.user_progress USING (((select auth.uid()) = user_id));
ALTER POLICY "users delete own progress" ON public.user_progress USING (((select auth.uid()) = user_id));
ALTER POLICY linkedin_analyses_select_own ON public.linkedin_analyses USING (((select auth.uid()) = user_id));
ALTER POLICY agent_conversations_select_own ON public.agent_conversations USING (((select auth.uid()) = user_id));
ALTER POLICY agent_conversations_update_own ON public.agent_conversations USING (((select auth.uid()) = user_id));
ALTER POLICY agent_conversations_delete_own ON public.agent_conversations USING (((select auth.uid()) = user_id));
ALTER POLICY agent_messages_select_own ON public.agent_messages USING ((EXISTS ( SELECT 1
   FROM agent_conversations c
  WHERE ((c.id = agent_messages.conversation_id) AND (c.user_id = (select auth.uid()))))));
ALTER POLICY agent_messages_delete_own ON public.agent_messages USING ((EXISTS ( SELECT 1
   FROM agent_conversations c
  WHERE ((c.id = agent_messages.conversation_id) AND (c.user_id = (select auth.uid()))))));
ALTER POLICY github_analyses_select_own ON public.github_analyses USING (((select auth.uid()) = user_id));
ALTER POLICY ai_roadmaps_select_own ON public.ai_roadmaps USING (((select auth.uid()) = user_id));
ALTER POLICY resumes_select_own ON public.resumes USING (((select auth.uid()) = user_id));
ALTER POLICY resume_analyses_select_own ON public.resume_analyses USING (((select auth.uid()) = user_id));
ALTER POLICY interview_sessions_select_own ON public.interview_sessions USING (((select auth.uid()) = user_id));
ALTER POLICY interview_turns_select_own ON public.interview_turns USING ((EXISTS ( SELECT 1
   FROM interview_sessions s
  WHERE ((s.id = interview_turns.session_id) AND (s.user_id = (select auth.uid()))))));
ALTER POLICY career_plans_select_own ON public.career_plans USING (((select auth.uid()) = user_id));
ALTER POLICY profiles_update_own ON public.profiles WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY bookmarks_insert_own ON public.user_bookmarks WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY roadmap_progress_insert_own ON public.user_roadmap_progress WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY quiz_attempts_insert_own ON public.career_quiz_attempts WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY quiz_answers_insert_own ON public.career_quiz_answers WITH CHECK ((EXISTS ( SELECT 1
   FROM career_quiz_attempts a
  WHERE ((a.id = career_quiz_answers.attempt_id) AND (a.user_id = (select auth.uid()))))));
ALTER POLICY study_entries_insert_own ON public.study_entries WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "users insert own progress" ON public.user_progress WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "users update own progress" ON public.user_progress WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY avatar_reports_insert_own ON public.avatar_reports WITH CHECK (((select auth.uid()) = reporter_user_id));
ALTER POLICY agent_conversations_insert_own ON public.agent_conversations WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY agent_conversations_update_own ON public.agent_conversations WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY agent_messages_insert_own ON public.agent_messages WITH CHECK ((EXISTS ( SELECT 1
   FROM agent_conversations c
  WHERE ((c.id = agent_messages.conversation_id) AND (c.user_id = (select auth.uid()))))));
