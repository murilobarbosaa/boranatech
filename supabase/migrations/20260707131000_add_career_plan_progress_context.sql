-- Adiciona o context 'career_plan' ao user_progress, para o checklist do plano
-- de carreira (item_key "<planId>:<itemId>", com itemId vindo do checklist
-- derivado pelo server e congelado em career_plans.result.checklist).
--
-- A CHECK constraint de context e recriada com os 4 valores existentes mais o
-- novo; nome exato conforme 20260519185242_create_user_progress.sql.

alter table public.user_progress
  drop constraint user_progress_context_check;

alter table public.user_progress
  add constraint user_progress_context_check
  check (context in (
    'portfolio_checklist',
    'favorites',
    'course_progress',
    'quiz_history',
    'career_plan'
  ));
