-- Configuracao da automacao: por FLAG, nunca por sigla de quadro.
--
-- Fase 2 de docs/plano-unificar-bugs-tarefas.md. Migration puramente ADITIVA,
-- isenta da janela de migration destrutiva.
--
-- ----------------------------------------------------------------------------
-- INVARIANTE 5: automacao e por flag de quadro, nao por sigla.
-- ----------------------------------------------------------------------------
-- Nada de `if (board.key === 'BUG')` no codigo. A sigla e uma escolha de
-- interface que alguem pode renomear, e no dia em que renomear a automacao para
-- em silencio (ou pior, passa a agir no quadro errado, se a sigla for reusada).
-- Duas flags, com responsabilidades DIFERENTES e de proposito:
--
--   admin_task_boards.sentry_sync_enabled -> "este quadro recebe o feed";
--   admin_task_columns.intake_source      -> "esta etapa e onde ele cai".
--
-- Separadas porque respondem perguntas diferentes: a primeira e o interruptor
-- (e o que fica FALSE ate a Fase 6, o que permite o codigo da Fase 3 subir
-- inerte); a segunda e o endereco. Um quadro ligado SEM etapa de intake e um
-- estado invalido, e o job deve ABORTAR nele em vez de escolher uma etapa por
-- conta propria: escolher seria criar card em lugar arbitrario e chamar isso de
-- sucesso.
--
-- `is_pinned` e a "etapa fixada". Ela NAO pode ser excluida nem reordenada, e
-- card manual nao entra nela (a recusa mora na rota, Fase 4). Isso e o que
-- sustenta a semantica "esta etapa contem APENAS card que nunca foi triado",
-- da qual dependem a poda automatica e a ressurreicao.

begin;

alter table public.admin_task_boards
  -- Interruptor da automacao. FALSE por padrao de proposito: o codigo do sync
  -- (Fase 3) sobe sem fazer nada, e ligar e um ato separado e observavel.
  add column if not exists sentry_sync_enabled boolean not null default false;

alter table public.admin_task_columns
  -- Etapa fixada. Ver acima.
  add column if not exists is_pinned boolean not null default false,
  -- Qual feed automatico cai nesta etapa. Lista fechada com UM valor hoje; e
  -- CHECK e nao boolean porque a pergunta e "de onde vem", e um segundo feed
  -- (que nao existe e pode nunca existir) seria um valor novo e nao uma coluna
  -- nova. Null = etapa comum.
  add column if not exists intake_source text check (
    intake_source is null or intake_source in ('sentry')
  );

-- No maximo UMA etapa de intake por quadro, garantido por constraint e nao por
-- verificacao no codigo. Duas etapas de intake fariam o job escolher entre elas,
-- e toda escolha implicita aqui e uma decisao que ninguem tomou. Parcial: etapa
-- comum (intake_source null) nao participa.
create unique index if not exists admin_task_columns_one_intake_per_board
  on public.admin_task_columns (board_id)
  where intake_source is not null;

commit;
