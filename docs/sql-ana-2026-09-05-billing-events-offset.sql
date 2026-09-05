-- =============================================================================
-- PARA A ANA RODAR NO SQL EDITOR. NAO EXECUTADO POR MIM.
--
-- (1) Corrige o desvio de 3h das linhas Asaas ja gravadas em billing_events.
-- (2) Carimba a migration 20260902120100 no historico.
--
-- Medido em 2026-09-03 e RECONFERIDO em 2026-09-05, contra producao (o
-- conjunto nao mudou nos dois dias):
--   6 linhas com provider='asaas' e event_created_at nao nulo
--   6 delas com (received_at - event_created_at) entre 2h55 e 3h05
--   todas de 2026-09-01, ou seja, TODAS anteriores a correcao de codigo
--
-- CAUSA. `raw.dateCreated` do Asaas vem em horario de Brasilia SEM offset, e foi
-- persistido como se fosse UTC. O codigo ja corrige todo evento NOVO desde o
-- deploy do lote 1 (`instanteAsaas`, shared/asaasDatetime.ts); este script so
-- acerta o historico, e nao e pre-requisito de deploy nenhum.
--
-- JANELA OBRIGATORIA: 05h-09h de Brasilia, com o backup da madrugada
-- confirmado COMPLETED. O bloco (1) e UPDATE em dado preexistente, ou seja,
-- destrutivo pela regra do CLAUDE.md. Registre no commit ou no PR:
--   janela: HHhMM, backup de <data> confirmado COMPLETED
--
-- COMO RODAR: um bloco por vez, conferindo a contagem entre eles. O SQL Editor
-- do Supabase nao garante a mesma sessao entre statements, entao NAO confie em
-- BEGIN/COMMIT abrangendo os blocos: cada um aqui e independente e idempotente.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- (0) ANTES: confira que o retrato ainda e o mesmo. ESPERADO: 6 | 6
-- -----------------------------------------------------------------------------
-- Se `na_janela` vier diferente de 6, PARE e reconfira: o conjunto mudou entre a
-- medicao e a execucao, e o bloco (1) escreveria sobre um retrato que ninguem
-- olhou.

select
  count(*) filter (
    where received_at - event_created_at
          between interval '2 hours 55 minutes' and interval '3 hours 5 minutes'
  ) as na_janela,
  count(*) as total_asaas
from public.billing_events
where provider = 'asaas'
  and event_created_at is not null;


-- -----------------------------------------------------------------------------
-- (1) A CORRECAO. AFETA: 6 linhas.
-- -----------------------------------------------------------------------------
-- A guarda pela DIFERENCA contra `received_at` e o que impede o script de somar
-- 3h duas vezes: depois de rodar, a diferenca dessas linhas cai para perto de
-- zero e elas saem do `where`. Rodar de novo afeta 0 linhas.
--
-- A mesma guarda protege o evento entregue com atraso REAL de 3h, que existiria
-- com `event_created_at` correto: e o preco de nao ter uma marca de origem por
-- linha. Com 6 linhas, todas do mesmo dia e todas anteriores a correcao, o risco
-- e nulo hoje; se este script for reaproveitado com um conjunto maior, confira o
-- bloco (0) antes.

update public.billing_events
   set event_created_at = event_created_at + interval '3 hours'
 where provider = 'asaas'
   and event_created_at is not null
   and received_at - event_created_at
       between interval '2 hours 55 minutes' and interval '3 hours 5 minutes';


-- -----------------------------------------------------------------------------
-- (2) DEPOIS: ESPERADO 0 | 6
-- -----------------------------------------------------------------------------
-- `na_janela` = 0 e `total_asaas` = 6: as seis continuam la (nada foi apagado) e
-- nenhuma tem mais o desvio.

select
  count(*) filter (
    where received_at - event_created_at
          between interval '2 hours 55 minutes' and interval '3 hours 5 minutes'
  ) as na_janela,
  count(*) as total_asaas
from public.billing_events
where provider = 'asaas'
  and event_created_at is not null;


-- -----------------------------------------------------------------------------
-- (3) CARIMBO no historico de migrations
-- -----------------------------------------------------------------------------
-- Sem ele, o arquivo 20260902120100_billing_events_asaas_offset_fix.sql fica no
-- repositorio sem constar como aplicado, que e exatamente a condicao que o
-- `pnpm check:migrations` existe para acusar.
--
-- `statements` fica NULL, como nas linhas existentes (conferido em 2026-09-03:
-- as seis migrations mais recentes tem statements nulo).
--
-- Idempotente pelo ON CONFLICT: rodar duas vezes nao duplica nem falha.

insert into supabase_migrations.schema_migrations (version, name)
values ('20260902120100', 'billing_events_asaas_offset_fix')
on conflict (version) do nothing;


-- -----------------------------------------------------------------------------
-- (4) CONFERENCIA do carimbo. ESPERADO: 1 linha
-- -----------------------------------------------------------------------------

select version, name
from supabase_migrations.schema_migrations
where version = '20260902120100';
