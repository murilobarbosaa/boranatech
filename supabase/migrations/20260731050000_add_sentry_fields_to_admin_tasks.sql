-- Vinculo com o Sentry e campos de manutencao em admin_tasks.
--
-- Fase 2 de docs/plano-unificar-bugs-tarefas.md. NADA consome estas colunas
-- ainda: o sync so nasce na Fase 3, e desligado. Migration puramente ADITIVA
-- (colunas nullable novas e indices), isenta da janela de migration destrutiva.
--
-- ----------------------------------------------------------------------------
-- INVARIANTE 2: campo do sync e campo do humano sao SEPARADOS.
-- ----------------------------------------------------------------------------
-- Todo detalhe vindo do Sentry mora em sentry_data (jsonb), NUNCA em
-- description nem em notes. Esses dois sao do humano, e sync que sobrescreve
-- edicao humana e perda de trabalho silenciosa: ninguem percebe que perdeu, e
-- nao ha de onde recuperar. A separacao e estrutural (coluna diferente), nao uma
-- convencao que alguem precise lembrar.
--
-- ----------------------------------------------------------------------------
-- INVARIANTE 3: deduplicacao por CONSTRAINT, nunca por logica de aplicacao.
-- ----------------------------------------------------------------------------
-- admin_tasks_sentry_numeric_id_key faz o `on conflict` do sync decidir. Ler
-- antes de inserir tem janela de corrida, e o job roda concorrente com ele mesmo
-- (o lock de cron e por nome de job, mas o retry manual e o cron podem se
-- cruzar).
--
-- A chave e o sentry_numeric_id (o `id` do grupo), nao o shortId. Os dois sao
-- estaveis, mas o numerico e o que a API sempre devolve na listagem e o que as
-- rotas de leitura por id aceitam; o shortId e para gente ler. Unicidade GLOBAL
-- e nao por quadro: uma issue e uma tarefa, ponto.
--
-- ----------------------------------------------------------------------------
-- POR QUE sentry_last_seen E PERSISTIDO, e nao lido da listagem toda vez.
-- ----------------------------------------------------------------------------
-- A poda por silencio e a ressurreicao precisam ser avaliadas A PARTIR DOS
-- NOSSOS CARDS, nunca a partir da listagem do Sentry. O motivo e que uma issue
-- silenciosa CAI FORA da janela de 14d e desaparece da listagem: se a avaliacao
-- partisse de la, o job nunca veria o lastSeen de quem ficou quieto, que e
-- exatamente a populacao que a poda existe para alcancar. A listagem serve para
-- INGESTAO (o que e novo); os nossos cards servem para MANUTENCAO (o que mudou
-- no que ja temos). Mesma estrutura de duas fases que reconcileDoneCards ja usa.

begin;

alter table public.admin_tasks
  -- shortId legivel (NODE-EXPRESS-1). Vai na tela e no que a pessoa fala em voz
  -- alta; nao serve como chave (ver acima).
  add column if not exists sentry_issue_id text check (
    sentry_issue_id is null or char_length(sentry_issue_id) between 1 and 100
  ),
  -- groupId numerico. CHAVE de deduplicacao.
  add column if not exists sentry_numeric_id text check (
    sentry_numeric_id is null or char_length(sentry_numeric_id) between 1 and 100
  ),
  add column if not exists sentry_issue_url text check (
    sentry_issue_url is null or char_length(sentry_issue_url) between 1 and 2048
  ),
  -- Bloco do Sentry, renderizado como secao propria no modal existente
  -- (invariante 8: nada de interface paralela). Jsonb e nao colunas soltas
  -- porque o conjunto de campos uteis vai mudar (culprit, level, release,
  -- environment, contagem, usuarios afetados, stack), e cada mudanca dessas
  -- viraria migration. Nunca e filtrado por dentro: e lido inteiro.
  add column if not exists sentry_data jsonb,
  -- Ultimo evento conhecido da issue. Base da poda por silencio (21 dias sem
  -- evento) e da ressurreicao (lastSeen > archived_at).
  add column if not exists sentry_last_seen timestamptz,
  -- Ultima vez que a manutencao conferiu este card contra o Sentry. Alimenta o
  -- selo "verificado, sem eventos ha Xd" e permite drenar os mais antigos
  -- primeiro quando o teto por run cortar.
  add column if not exists sentry_last_checked_at timestamptz,
  -- Instante do evento que trouxe o card de volta, seja de Concluido
  -- (reabertura) ou do arquivo (ressurreicao). O log de atividade e quem
  -- distingue os dois motivos; aqui e so o carimbo que a tela desenha.
  add column if not exists sentry_reopen_event_at timestamptz,
  -- Ponte para a migracao de admin_bugs (Fase 5). Declarada agora para aquela
  -- migration ser idempotente por CONSTRAINT (on conflict do nothing) em vez de
  -- `not exists`, que tem a mesma janela de corrida que o invariante 3 proibe.
  add column if not exists legacy_bug_id uuid;

-- ----------------------------------------------------------------------------
-- POR QUE ESTES DOIS INDICES NAO SAO PARCIAIS. Leia antes de "otimizar".
-- ----------------------------------------------------------------------------
-- A primeira versao desta migration tinha `where <coluna> is not null` nos dois,
-- com a justificativa de que card humano tem os campos nulos e nao deve ocupar
-- espaco no indice. Estava errada, e o erro so apareceu contra um Postgres de
-- verdade (server/lib/sentryTaskDedup.pg.test.ts):
--
--   ERROR: there is no unique or exclusion constraint matching the
--          ON CONFLICT specification
--
-- `on conflict (coluna)` NAO casa com indice unico PARCIAL: o Postgres exige que
-- o alvo repita o predicado (`on conflict (col) where col is not null`). E o
-- PostgREST/supabase-js so sabe mandar NOMES DE COLUNA no `onConflict`, sem
-- clausula where. Ou seja: com indice parcial, o insert do sync falharia em toda
-- execucao, e o invariante 3 (deduplicacao pela constraint) seria impossivel de
-- cumprir pelo caminho que o modulo usa.
--
-- E o predicado nao era necessario para nada. Em indice unico comum o Postgres
-- trata NULLs como DISTINTOS entre si, entao N cards humanos com a coluna nula
-- convivem sem colidir. Verificado empiricamente, nao suposto: 5 nulos inseridos
-- na mesma coluna com indice unico comum, todos aceitos.
--
-- Criados sobre colunas recem-nascidas (integralmente nulas), entao NAO PODEM
-- falhar por dado existente.
create unique index if not exists admin_tasks_sentry_numeric_id_key
  on public.admin_tasks (sentry_numeric_id);

create unique index if not exists admin_tasks_legacy_bug_id_key
  on public.admin_tasks (legacy_bug_id);

-- Varredura da manutencao: so cards vinculados ao Sentry, drenando por quem foi
-- conferido ha mais tempo. `nulls first` poe os nunca conferidos na frente.
create index if not exists admin_tasks_sentry_maintenance_idx
  on public.admin_tasks (sentry_last_checked_at nulls first)
  where sentry_numeric_id is not null;

commit;
