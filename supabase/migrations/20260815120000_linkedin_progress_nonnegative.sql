-- Linhas antigas corrompidas continuam legíveis e são filtradas pela aplicação.
-- NOT VALID aplica a regra a novas escritas sem fazer a migration falhar por
-- eventual dado histórico negativo; a validação do legado pode ser planejada
-- separadamente depois de medir e corrigir essas linhas.
alter table public.linkedin_improvement_progress
  add constraint linkedin_improvement_progress_index_nonnegative
  check (improvement_index >= 0) not valid;
