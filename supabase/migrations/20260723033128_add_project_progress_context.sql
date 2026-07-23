-- Adiciona o context 'project_progress' ao user_progress, para a conclusao
-- AUTODECLARADA de projetos (item_key = id do projeto no catalogo). A rota
-- PUT /api/progress/project_progress/:itemKey ja aceitava esse context em
-- VALID_CONTEXTS, mas a CHECK constraint nunca foi atualizada quando a feature
-- subiu, entao todo upsert batia em violacao 23514 e virava 500 generico
-- ("Erro ao salvar progresso.").
--
-- A CHECK constraint e recriada com os 5 valores existentes mais o novo; nome
-- exato conforme 20260519185242_create_user_progress.sql e
-- 20260707131000_add_career_plan_progress_context.sql.

alter table public.user_progress
  drop constraint user_progress_context_check;

alter table public.user_progress
  add constraint user_progress_context_check
  check (context in (
    'portfolio_checklist',
    'favorites',
    'course_progress',
    'quiz_history',
    'career_plan',
    'project_progress'
  ));
