-- VERIFICAÇÃO da migration 20260730170000_ai_usage_excluded_tools.sql
--
-- Dois blocos, para colar no SQL editor do Supabase. ORDEM:
--
--   1. BLOCO ANTES   (rodar imediatamente antes de aplicar a migration)
--   2. aplicar a migration:
--        cat supabase/migrations/20260730170000_ai_usage_excluded_tools.sql
--   3. BLOCO DEPOIS  (rodar logo em seguida)
--
-- POR QUE AUTOCONTIDO. A primeira versão desta verificação comparava com o
-- número "11", medido numa sessão anterior. Isso quebra de duas formas: se
-- alguém usar a plataforma no meio, o número muda; e se a janela do dia virar
-- entre uma medição e outra, ele zera. O critério aqui é uma RELAÇÃO entre
-- valores capturados na hora, então vale em qualquer horário.
--
-- A FRONTEIRA DO DIA NÃO É MEIA-NOITE DE BRASÍLIA. Medido em 2026-07-31:
--
--   date_trunc('day', now() at time zone 'America/Sao_Paulo')  ->  2026-07-31 00:00:00
--   coagido para timestamptz com TimeZone da sessão = UTC      ->  2026-07-31 00:00:00+00
--   isso em Brasília                                           ->  2026-07-30 21:00:00
--
-- Ou seja, o "dia" da cota vai das 21:00 às 21:00 de Brasília. É um efeito de o
-- `at time zone` produzir um `timestamp` sem fuso que volta a ser lido como UTC.
-- Não é introduzido por esta migration: ela PRESERVA a expressão verbatim, e o
-- comportamento antes e depois é o mesmo. Fica registrado porque muda a leitura
-- dos números, e vira dívida própria (mexer nisso desloca a janela de cota de
-- todo mundo, então não é conserto de passagem).


-- ===========================================================================
-- BLOCO ANTES  (rodar IMEDIATAMENTE antes de aplicar)
-- ===========================================================================

select
  now()                                              as instante,
  (date_trunc('day', now() at time zone 'America/Sao_Paulo'))::timestamptz
                                                     as corte_do_dia_efetivo,
  public.get_ai_usage_today('6a9063c4-2bcb-4432-8a75-70fccc676851')
                                                     as global_antes,
  public.get_ai_usage_today_by_tool(
    '6a9063c4-2bcb-4432-8a75-70fccc676851', 'roadmap-intake-chat')
                                                     as dedicada_antes,
  (select count(*)
     from public.ai_usage_logs
    where user_id = '6a9063c4-2bcb-4432-8a75-70fccc676851'
      and tool = 'roadmap-intake-chat'
      and status = 'success'
      and created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo'))
                                                     as turnos_intake_no_dia;

-- Linhas de hoje por tool, para saber o que compõe o número acima.
select tool, status, count(*) as n
  from public.ai_usage_logs
 where user_id = '6a9063c4-2bcb-4432-8a75-70fccc676851'
   and created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo')
 group by tool, status
 order by tool, status;

-- ANOTE `corte_do_dia_efetivo`. Se ele mudar entre os dois blocos, a janela
-- virou no meio e o critério relacional do bloco DEPOIS não fecha. O que fazer
-- nesse caso está no fim deste arquivo.


-- ===========================================================================
-- BLOCO DEPOIS  (rodar logo após aplicar)
-- ===========================================================================

-- 1. A lista canônica existe e tem EXATAMENTE estes 4 elementos.
--    Afirma o TOTAL, não a pertinência: um 5o elemento reprova.
select
  public.ai_usage_excluded_tools()                       as lista,
  array_length(public.ai_usage_excluded_tools(), 1)      as total,
  public.ai_usage_excluded_tools() @> ARRAY[
    'agent-chat','interview-turn','career-plan-chat','roadmap-intake-chat'
  ]::text[]                                              as contem_os_4,
  array_length(public.ai_usage_excluded_tools(), 1) = 4  as total_bate;
-- ESPERADO: total = 4, contem_os_4 = true, total_bate = true.

-- 2. As duas consumidoras LEEM a função, em vez de manter lista própria.
select p.proname,
       pg_get_functiondef(p.oid) like '%ai_usage_excluded_tools()%' as usa_a_lista
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('get_ai_usage_today', 'reserve_ai_usage_slot')
 order by p.proname;
-- ESPERADO: as duas com usa_a_lista = true.

-- 3. CRITÉRIO RELACIONAL do efeito retroativo.
--    Substitua os dois números pelos que o BLOCO ANTES devolveu.
--
--    A regra: depois da migration, get_ai_usage_today deixa de contar
--    'roadmap-intake-chat'. Então a queda tem que ser EXATAMENTE o número de
--    turnos de intake bem-sucedidos no dia.
--
--        global_depois = global_antes - turnos_intake_no_dia
--
--    Isso vale em qualquer horário e não depende de nenhum valor absoluto.
select
  public.get_ai_usage_today('6a9063c4-2bcb-4432-8a75-70fccc676851')
                                                  as global_depois,
  :global_antes                                   as global_antes_informado,
  :turnos_intake_no_dia                           as turnos_informados,
  public.get_ai_usage_today('6a9063c4-2bcb-4432-8a75-70fccc676851')
    = :global_antes - :turnos_intake_no_dia       as relacao_fecha,
  (date_trunc('day', now() at time zone 'America/Sao_Paulo'))::timestamptz
                                                  as corte_agora;
-- ESPERADO: relacao_fecha = true, e corte_agora IGUAL ao do bloco ANTES.
--
-- O SQL editor do Supabase não aceita `:parametro`. Troque à mão:
--   :global_antes           -> o número que o bloco ANTES devolveu
--   :turnos_intake_no_dia   -> idem
-- Se preferir não editar, a forma sem parâmetro é a de baixo.

-- 3-bis. Mesma verificação SEM parâmetro, recalculando os dois lados agora.
--    Funciona porque a contagem de turnos de intake do dia é lida de novo, da
--    mesma tabela, no mesmo instante.
select
  public.get_ai_usage_today('6a9063c4-2bcb-4432-8a75-70fccc676851') as global_depois,
  (select count(*)
     from public.ai_usage_logs
    where user_id = '6a9063c4-2bcb-4432-8a75-70fccc676851'
      and status = 'success'
      and (tool is null or tool <> all(ARRAY[
            'agent-chat','interview-turn','career-plan-chat','roadmap-intake-chat'
          ]::text[]))
      and created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo'))
                                                                   as esperado,
  public.get_ai_usage_today('6a9063c4-2bcb-4432-8a75-70fccc676851') =
  (select count(*)
     from public.ai_usage_logs
    where user_id = '6a9063c4-2bcb-4432-8a75-70fccc676851'
      and status = 'success'
      and (tool is null or tool <> all(ARRAY[
            'agent-chat','interview-turn','career-plan-chat','roadmap-intake-chat'
          ]::text[]))
      and created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo'))
                                                                   as bate;
-- ESPERADO: bate = true. Esta é a verificação mais forte das três, porque
-- reimplementa o critério do lado de fora da função e compara os dois.


-- ===========================================================================
-- SE A JANELA DO DIA VIRAR ENTRE OS DOIS BLOCOS
-- ===========================================================================
--
-- Sintoma: `corte_agora` diferente de `corte_do_dia_efetivo`, e/ou
-- `relacao_fecha = false` com números que não fazem sentido (tipicamente
-- global_depois muito menor, porque a janela zerou para todo mundo).
--
-- O que ainda conclui, e é suficiente para liberar o deploy:
--
--   a) A verificação 1 (lista com 4 elementos) NÃO depende de tempo. Ela sozinha
--      já prova que a migration foi aplicada.
--   b) A verificação 2 (as duas funções lendo a lista) também não depende de
--      tempo. Ela prova a unificação, que é o ponto estrutural da migration.
--   c) A verificação 3-bis continua válida: ela recalcula os DOIS lados no mesmo
--      instante, então a virada afeta os dois igualmente e a igualdade se mantém.
--
-- Só a verificação 3 (com os números anotados) fica sem veredito. Nesse caso:
-- ignore-a e use a 3-bis. Não repita o bloco ANTES depois da migration, porque
-- aí ele já mediria o comportamento novo e a comparação perderia o sentido.
