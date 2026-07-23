-- Backfill (uma vez so, manual, no SQL editor do Supabase): marca como bounced
-- os recipients de dominio reservado que ficaram gravados como 'sent' (aceitos
-- pelo Resend, com bounce assincrono que nunca foi ingerido antes do webhook da
-- Etapa 4).
--
-- Escopo: status = 'sent' e dominio reservado
--   lower(email) ~ '@example\.(com|org|net)$'  OU  '\.(test|example|invalid|localhost)$'
-- Efeitos: delivery_status = 'bounced' + delivery_updated_at, recalculo de
-- bounced_count por campanha, e supressao global dos enderecos.
-- NAO toca sent_count (historicamente significa "aceito pelo provedor").
--
-- ============================================================================
-- POR QUE ESTA E A VERSAO EM STATEMENTS SEPARADOS (e nao as "espertas")
-- ============================================================================
--
-- 1) TEMP TABLE nao funciona aqui. O SQL editor do Supabase roda cada statement
--    em sessao diferente, entao uma "create temp table ..." no statement 1 NAO
--    persiste para os statements 2 e 3 (temp table e por sessao). A versao que
--    capturava o conjunto numa temp table falhou por isso.
--
-- 2) CTE de ESCRITA nao referenciada NAO EXECUTA. A versao que juntava tudo num
--    "WITH updated AS (UPDATE ...), bumped AS (UPDATE ...) ..." dependia de CTEs
--    de escrita rodarem mesmo sem serem lidas pela query principal. No Postgres,
--    uma CTE de escrita que ninguem referencia nao roda de forma confiavel: o
--    incremento do contador simplesmente nao aconteceu. Statements separados e
--    explicitos sao o caminho seguro.
--
-- 3) NOTA DE APRENDIZADO (importante): contador agregado em backfill deve ser
--    RECALCULADO POR ATRIBUICAO a partir da fonte de verdade, NUNCA incrementado.
--    A primeira versao usava "bounced_count = bounced_count + cnt"; isso NAO e
--    idempotente e DOBROU os contadores quando o script rodou mais de uma vez na
--    execucao real. A versao correta (statement 2 abaixo) faz
--    "bounced_count = agg.cnt", derivando de count(*) sobre delivery_status =
--    'bounced'. Alem de idempotente, isto CORRIGE valores ja dobrados (reseta
--    para a verdade).
--
-- Cada statement abaixo e independentemente idempotente. Rode 1, 2 e 3 em ordem;
-- rodar o conjunto de novo nao altera o resultado.
-- ============================================================================

-- 1) Marca delivery_status = 'bounced' nos recipients 'sent' de dominio
--    reservado. O guard "is distinct from 'bounced'" evita re-tocar
--    delivery_updated_at em re-execucoes.
update public.email_campaign_recipients
set delivery_status = 'bounced',
    delivery_updated_at = now()
where status = 'sent'
  and delivery_status is distinct from 'bounced'
  and ( lower(email) ~ '@example\.(com|org|net)$'
        or lower(email) ~ '\.(test|example|invalid|localhost)$' );

-- 2) Recalcula bounced_count POR ATRIBUICAO (idempotente; corrige duplicacao).
--    Fonte de verdade: numero de recipients com delivery_status = 'bounced' por
--    campanha (inclui bounces reais do webhook, nao so os deste backfill).
update public.email_campaigns c
set bounced_count = agg.cnt
from (
  select campaign_id, count(*)::int as cnt
  from public.email_campaign_recipients
  where delivery_status = 'bounced'
  group by campaign_id
) agg
where c.id = agg.campaign_id;

-- 3) Supressao global dos enderecos reservados 'sent'. Idempotente via
--    unique(email) + do nothing. Distinct: mesmo e-mail em varias campanhas
--    suprime uma vez so.
insert into public.email_suppressions (email, reason, source)
select distinct lower(email), 'bounced', 'reserved_domain_backfill'
from public.email_campaign_recipients
where status = 'sent'
  and ( lower(email) ~ '@example\.(com|org|net)$'
        or lower(email) ~ '\.(test|example|invalid|localhost)$' )
on conflict (email) do nothing;
