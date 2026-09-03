-- Normalizacao dos travessoes ja gravados em public.external_events, mais o
-- soft delete de duas duplicatas.
--
-- JA EXECUTADO, EM 02/09/2026. Este arquivo e registro do que foi rodado, nao
-- tarefa pendente. Confirmado no banco na mesma data: o trigger
-- external_events_normaliza_travessao existe e esta habilitado, e a contagem de
-- linhas vivas com travessao e zero.
--
-- A VERIFICACAO 4 E RETRATO DAQUELE DIA, NAO FORMULA PERMANENTE. Ela reproduz o
-- predicado que a rota GET /api/content/eventos tinha em 02/09 (dois ramos de
-- data: comeca hoje ou depois, ou sem data). Na frente seguinte a rota ganhou um
-- TERCEIRO ramo, `ends_on >= hoje`, para os eventos em andamento nao sumirem da
-- pagina no proprio dia em que estao acontecendo. Quem reaproveitar a consulta
-- daqui para comparar com o total da API vai encontrar um numero MENOR que o da
-- rota, pela diferenca dos eventos em andamento (18 na medicao de 02/09).
--
-- COMO USAR (NAO rodar fora destas condicoes):
--   1. Janela 05h-09h de Brasilia, logo depois do backup diario. Este arquivo
--      ALTERA DADO EXISTENTE (UPDATE de texto e soft delete), entao a janela de
--      migration destrutiva do CLAUDE.md se aplica: RPO de ate 24h, PITR
--      desabilitado.
--   2. Confirmar ANTES que o backup da noite esta COMPLETED (procedimento no
--      CLAUDE.md, secao "Janela de migration destrutiva").
--   3. Aplicar ANTES a migration
--      supabase/migrations/20260828120000_normalize_dashes_on_external_events.sql,
--      que cria o trigger. A ordem importa: com o trigger ja ativo, a rotina de
--      coleta nao consegue reintroduzir travessao na janela entre este backfill
--      e o deploy. Na ordem inversa existe essa fresta.
--   4. Rodar a SECAO 0 sozinha e ANOTAR os numeros. Ela e a contagem ANTES, e
--      sem ela as verificacoes do fim nao tem com o que ser comparadas.
--   5. Rodar da SECAO 1 ao COMMIT de uma vez so: e uma transacao unica, ou tudo
--      entra ou nada entra. Rodar statement a statement quebra essa garantia,
--      porque o SQL Editor do Supabase abre sessao por execucao.
--   6. Conferir as quatro verificacoes do fim.
--
-- OS CARACTERES SAO chr(8211) (meia-risca) E chr(8212) (travessao), NUNCA
-- LITERAIS, pelo mesmo motivo da migration: um arquivo cuja finalidade e
-- remover esses dois caracteres nao pode conte-los, senao o scanner que varre a
-- base acusa falso positivo justamente no arquivo que resolve o problema.
--
-- IDEMPOTENTE. Todo comando tem guarda que o torna no-op na segunda execucao: o
-- UPDATE de normalizacao so pega linha que AINDA tem um dos dois caracteres, os
-- soft deletes so pegam linha com deleted_at nulo, e o INSERT no ledger tem
-- `on conflict do nothing`.

-- ---------------------------------------------------------------------------
-- SECAO 0: CONTAGEM ANTES. Rodar sozinha, ANTES da transacao, e anotar.
--
-- Derivada do banco na hora, nunca escrita a mao: um numero fixo aqui
-- envelheceria entre a redacao deste arquivo e a execucao dele, e a verificacao
-- final estaria comparando com uma medicao de outro dia.
-- ---------------------------------------------------------------------------
select
  count(*) filter (where title          ~ ('[' || chr(8211) || chr(8212) || ']')) as title,
  count(*) filter (where description    ~ ('[' || chr(8211) || chr(8212) || ']')) as description,
  count(*) filter (where date_label     ~ ('[' || chr(8211) || chr(8212) || ']')) as date_label,
  count(*) filter (where location_label ~ ('[' || chr(8211) || chr(8212) || ']')) as location_label,
  count(*) filter (where organizer      ~ ('[' || chr(8211) || chr(8212) || ']')) as organizer,
  count(*) filter (
    where (coalesce(title, '') || coalesce(description, '') || coalesce(date_label, '')
        || coalesce(location_label, '') || coalesce(organizer, ''))
          ~ ('[' || chr(8211) || chr(8212) || ']')
  ) as linhas_afetadas,
  count(*) as linhas_vivas
  from public.external_events
 where deleted_at is null;

-- ---------------------------------------------------------------------------
-- TRANSACAO UNICA. Da SECAO 1 ao COMMIT, de uma vez so.
-- ---------------------------------------------------------------------------
BEGIN;

-- ---------------------------------------------------------------------------
-- SECAO 1: normalizacao dos cinco campos de texto.
--
-- `translate` e nao `replace` aninhado: mapeia caractere a caractere, entao os
-- dois caracteres de origem viram dois hifens numa passada. Campo nulo continua
-- nulo, que e o desejado (normalizar nao inventa string vazia onde nao havia
-- texto).
--
-- O WHERE e RESTRITIVO de proposito: so linha que tem pelo menos um dos dois
-- caracteres em pelo menos um dos cinco campos. Sem ele o UPDATE tocaria as 366
-- linhas vivas, carimbaria updated_at em todas pelo trigger
-- external_events_touch, e a segunda execucao voltaria a mexer em tudo. Com
-- ele, rodar de novo toca ZERO linhas.
--
-- NAO filtra por deleted_at: o trigger normaliza toda escrita futura sem olhar
-- esse campo, entao restringir aqui deixaria o backfill e o trigger com regras
-- diferentes, e a verificacao 1 do fim (esperado 0) nao poderia ser feita sobre
-- a tabela inteira.
-- ---------------------------------------------------------------------------
-- O DESTINO DO translate E chr(45) || chr(45), E NAO A STRING '- -' SEM ESPACO.
-- Motivo medido em 2026-08-28: aquela string, dentro de um arquivo .sql, e um
-- campo minado para qualquer leitor que remova comentario por "corta do tracinho
-- duplo ate o fim da linha". Um validador escrito nesta propria sessao fez
-- exatamente isso, comeu a aspa de fechamento e reportou erro de sintaxe num SQL
-- correto. O Postgres le certo, mas ferramenta ingenua no meio do caminho nao, e
-- o custo de nao depender disso e um `chr()`.
update public.external_events
   set title          = translate(title,          chr(8211) || chr(8212), chr(45) || chr(45)),
       description    = translate(description,    chr(8211) || chr(8212), chr(45) || chr(45)),
       date_label     = translate(date_label,     chr(8211) || chr(8212), chr(45) || chr(45)),
       location_label = translate(location_label, chr(8211) || chr(8212), chr(45) || chr(45)),
       organizer      = translate(organizer,      chr(8211) || chr(8212), chr(45) || chr(45))
 where (coalesce(title, '') || coalesce(description, '') || coalesce(date_label, '')
     || coalesce(location_label, '') || coalesce(organizer, ''))
       ~ ('[' || chr(8211) || chr(8212) || ']');

-- ---------------------------------------------------------------------------
-- SECAO 2: soft delete das duas duplicatas.
--
-- DELETE fisico nao e uma opcao: o trigger external_events_no_delete levanta
-- P0001 na tabela inteira. A remocao e por coluna, como o hint daquele trigger
-- manda.
--
-- QUAL DOS PARES FICA, e por que. Sao dois eventos reais, cada um cadastrado
-- duas vezes pela rotina de coleta com external_id diferente:
--   CBSoft: fica `cbsoft-sao-paulo-2026`, porque a url dele e a canonica do
--           congresso; sai `cbsoft-2026-sao-paulo`.
--   Code & Pajamas: fica `code-pajamas-gdg-cloud-sao-paulo-2026`, porque a url
--           dele e a pagina de inscricao; sai `code-pajamas-gdg-cloud-sp-2026`.
-- O criterio foi a URL de destino, nao o titulo nem a data: e o unico campo em
-- que os dois registros de cada par diferem de forma que importa para quem
-- clica.
--
-- `and deleted_at is null` em ambos: com a guarda, a re-execucao toca zero
-- linhas e nao reescreve o deleted_at para um instante novo.
-- ---------------------------------------------------------------------------
update public.external_events
   set deleted_at = now(),
       deleted_reason = 'duplicata de cbsoft-sao-paulo-2026, que tem a url canonica do congresso'
 where external_id = 'cbsoft-2026-sao-paulo'
   and deleted_at is null;

update public.external_events
   set deleted_at = now(),
       deleted_reason = 'duplicata de code-pajamas-gdg-cloud-sao-paulo-2026, que tem a url de inscricao'
 where external_id = 'code-pajamas-gdg-cloud-sp-2026'
   and deleted_at is null;

-- ---------------------------------------------------------------------------
-- SECAO 3: registro da migration do trigger no ledger.
--
-- O ledger (supabase_migrations.schema_migrations) esta incompleto por outro
-- motivo, documentado em docs/debito-ledger-migrations.md: desde maio as
-- migrations vem sendo aplicadas pelo SQL Editor, que nao escreve nele. Este
-- INSERT registra ESTA versao e so ela; nao e o backfill do ledger, e nao
-- pretende ser.
--
-- A chave primaria e `version`, entao `on conflict (version) do nothing` torna
-- a re-execucao um no-op em vez de um erro que abortaria a transacao inteira.
-- ---------------------------------------------------------------------------
insert into supabase_migrations.schema_migrations (version, name)
values ('20260828120000', 'normalize_dashes_on_external_events')
on conflict (version) do nothing;

COMMIT;

-- ---------------------------------------------------------------------------
-- VERIFICACOES. Rodar DEPOIS do COMMIT e conferir os quatro resultados.
-- ---------------------------------------------------------------------------

-- 1. Esperado: 0, nas duas colunas. Qualquer numero diferente de zero significa
--    que sobrou travessao em algum campo, e o UPDATE da SECAO 1 nao cobriu o
--    conjunto que deveria.
select
  count(*) filter (
    where (coalesce(title, '') || coalesce(description, '') || coalesce(date_label, '')
        || coalesce(location_label, '') || coalesce(organizer, ''))
          ~ ('[' || chr(8211) || chr(8212) || ']')
  ) as remanescentes_total,
  count(*) filter (
    where deleted_at is null
      and (coalesce(title, '') || coalesce(description, '') || coalesce(date_label, '')
        || coalesce(location_label, '') || coalesce(organizer, ''))
          ~ ('[' || chr(8211) || chr(8212) || ']')
  ) as remanescentes_vivos
  from public.external_events;

-- 2. Esperado: QUATRO linhas, sendo as duas mantidas com deleted_at nulo e as
--    duas duplicatas com deleted_at preenchido. Menos de quatro linhas aqui
--    significa external_id digitado errado em algum lugar deste arquivo, e o
--    soft delete teria passado em silencio sem tocar nada.
select external_id,
       deleted_at is null as vivo,
       deleted_reason,
       url
  from public.external_events
 where external_id in (
         'cbsoft-sao-paulo-2026',
         'cbsoft-2026-sao-paulo',
         'code-pajamas-gdg-cloud-sao-paulo-2026',
         'code-pajamas-gdg-cloud-sp-2026'
       )
 order by external_id;

-- 3. Esperado: UMA linha, com tgenabled = 'O' (habilitado, modo origem). Zero
--    linha significa que a migration do trigger nao foi aplicada, e entao a
--    normalizacao acima e um retrato do momento: a proxima coleta traz
--    travessao de volta e nada acusa.
select t.tgname,
       t.tgenabled,
       pg_get_triggerdef(t.oid) as definicao
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relname = 'external_events'
   and t.tgname = 'external_events_normaliza_travessao'
   and not t.tgisinternal;

-- 4. Total que a pagina passa a exibir. E o MESMO predicado da rota
--    GET /api/content/eventos (server/routes/content.ts), reproduzido campo a
--    campo: `is_published`, `deleted_at` nulo, e o par
--    `starts_on.gte.<hoje>` OU `starts_on` nulo. A rota nao filtra por
--    `ends_on`: essa coluna aparece so na projecao do select.
--
--    A DATA DE CORTE E EM America/Sao_Paulo, NAO `current_date`. A rota calcula
--    `hoje` com `Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" })`,
--    e o equivalente exato em SQL e `(now() at time zone 'America/Sao_Paulo')::date`.
--    A versao anterior desta verificacao usava `current_date`, que no Postgres e
--    a data em UTC: entre 21h e a meia-noite de Brasilia o UTC ja virou o dia
--    seguinte, e o corte descartava os eventos do proprio dia em que eles ainda
--    estao acontecendo. A janela de execucao (05h as 09h de Brasilia) cai num
--    horario em que as duas datas coincidem, entao ali o numero seria o mesmo
--    por acidente; e justamente por ser acidente que a expressao foi corrigida,
--    em vez de deixada certa por sorte de horario.
--
--    COMO CONFERIR AO VIVO: este numero tem que ser igual ao campo `total` que
--    GET /api/content/eventos devolve no momento da janela (a rota pede
--    `count: "exact"` com os mesmos filtros, entao o `total` nao sofre do teto
--    de 500 do `limit`). A comparacao so vale depois de o cache da rota expirar.
--    Em relacao ao numero de ANTES da execucao, espere no maximo 2 a menos: as
--    duas duplicatas soft-deletadas, e so as que ja estivessem dentro do
--    predicado de data.
select count(*) as exibiveis_total
  from public.external_events
 where is_published = true
   and deleted_at is null
   and (starts_on >= (now() at time zone 'America/Sao_Paulo')::date
        or starts_on is null);
