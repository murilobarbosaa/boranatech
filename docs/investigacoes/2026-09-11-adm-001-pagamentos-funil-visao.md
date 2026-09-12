# ADM-001 — Pagamentos registrados e funil pago da Visão

Data da implementação local: 11/09/2026. Fuso do produto: `America/Sao_Paulo`.

## Resultado executivo

Esta rodada remove da aba Visão a equivalência falsa entre linha de assinatura e cliente novo. O gráfico agora se chama **“Pagamentos registrados por dia”** e usa somente movimentos locais elegíveis de `finance_transactions`. Ele separa **Primeiro pagamento observado**, **Pagamentos posteriores** e pagamentos com identidade canônica mas sem pessoa classificável. “Primeiro observado” não é apresentado como aquisição: a cobertura histórica integral não pode ser provada pela base atual.

O funil passou a usar a mesma função de elegibilidade e identidade do gráfico. A coorte é: pessoas cadastradas no período → dessas, pessoas com pagamento elegível estritamente posterior ao cadastro → dessas pagantes, pessoas com linha de IA `status = success` cujo registro começou estritamente depois do pagamento. Falhas, recusas, reservas, uso anterior, assinatura pendente, trial e cortesia sem `charge` positivo ficam fora.

Não foram alterados MRR, receita líquida, churn, a aba Conversão, escrituração, webhooks ou modelo de dados. Não houve banco/provedor real disponível nesta rodada; portanto não há conciliação real, percentual de cobertura nem afirmação de histórico completo. Nenhuma operação externa, migration, backfill, sync, replay, cobrança, devolução ou deploy foi executada.

## Isolamento e base

- Repositório original: `/home/s0ft/boranatech`, branch `fix/openai-cota-credencial`, HEAD inicial `a3e37d2a2f3e8fd19e0a9d51653cd27c29fba96f`, com alterações preexistentes preservadas e não incorporadas.
- `main` e `origin/main` verificados no início: `f050d76abde09922e430a356085cfc7de09cd582`.
- O `.git` original é somente leitura no ambiente; `git worktree add` falhou ao criar o lock da branch. O isolamento foi feito por clone local em `/tmp/boranatech-adm001`, branch `fix/adm-001-visao-pagamentos`, baseada em `origin/main`.
- HEAD inicial e final do clone: `f050d76abde09922e430a356085cfc7de09cd582`. O resultado está em diff não commitado, pronto para revisão no clone; não houve push, merge ou publicação.
- Diff stat final: **13 arquivos, 1.855 inserções e 692 remoções**. Os quatro arquivos novos estão marcados no índice apenas com `intent-to-add`, para aparecerem no diff; nenhum conteúdo foi commitado.
- `AGENTS.md` não existe. `CLAUDE.md` e os dois artefatos ADM-000 do checkout original foram lidos integralmente.
- Dependências não foram reinstaladas nem alteradas: o clone usa um symlink ignorado por Git para o `node_modules` do checkout original. Uma tentativa offline incompleta foi preservada fora dos repositórios em `/tmp/boranatech-adm001-node_modules-partial` (5,3 MB). Os artefatos sintéticos da tentativa visual ficaram em `/tmp/adm001-visual` e o perfil vazio do Chrome em `/tmp/adm001-chrome-profile`; nenhum deles integra o diff e nenhuma captura foi gerada.

## Contrato final das métricas desta rodada

| Métrica | Definição e população | Unidade | Fonte | Identidade/deduplicação | Timestamp e corte | Exclusões e cobertura | Texto visível |
|---|---|---:|---|---|---|---|---|
| Pagamento elegível | Movimento `type = charge`, `gross_cents` inteiro seguro e positivo, provider suportado e identidade canônica presente | pagamentos | `finance_transactions` | Stripe: `provider + stripe_charge_id`; Asaas: `provider + provider_transaction_id`, que no escritor de charge é `payment.id` | `occurred_at <= corte`; janela inclusiva; bucket civil de Brasília | Zero/negativo/inválido, provider desconhecido, identidade ausente, data inválida e futuro ficam fora. `net_cents = 0` não elimina bruto positivo | “Pagamentos registrados por dia” |
| Primeiro pagamento observado | Menor instante entre pagamentos elegíveis distintos de uma pessoa em todo o histórico local lido até o corte | pagamentos | resultado compartilhado acima | Primeiro após ordenação por `occurred_at`, chave canônica e `id` | Procura antes do início da janela; só exibe na janela se o primeiro global cair nela | Não prova primeiro pagamento da vida; empate é desempatado estavelmente e contado como ambiguidade | “Primeiro pagamento observado” + ressalva histórica permanente |
| Pagamento posterior | Outro pagamento canônico da mesma pessoa depois do primeiro observado | pagamentos | resultado compartilhado acima | mesma chave; pagamentos diferentes continuam diferentes, inclusive com troca de provedor | `occurred_at` | Não é chamado de renovação/reativação/aquisição | “Pagamentos posteriores” |
| Sem classificação de pessoa | Pagamento elegível e deduplicável sem `user_id`, ou identidade repetida ligada a usuários conflitantes | pagamentos | resultado compartilhado acima | mantém uma ocorrência por pagamento | `occurred_at` | Incluído no total de pagamentos e separado; não entra em pessoas nem funil | “Sem pessoa identificada” |
| Pessoas identificadas que pagaram no período | União de `user_id` entre pagamentos elegíveis exibidos na janela | pessoas | resultado compartilhado acima | uma pessoa no período inteiro | mesmos limites | Não é soma de pessoas únicas por dia; órfãos não contam | Total separado do total de pagamentos |
| Meio de pagamento | Meio somente quando existe vínculo persistido exato demonstrável | pagamentos | `subscriptions.payment_method`, vinculado no Asaas por `provider_subscription_id = payment.id` | por pagamento | não altera data | Stripe permanece “Não identificado” porque `charge.id` não se liga estruturalmente à assinatura local sem payload/API. Evidência conflitante também fica desconhecida | Distribuição compacta, preservando “Não identificado” |
| Provedor | Quem escreveu o movimento (`stripe` ou `asaas`) | pagamentos | `finance_transactions.provider` | por pagamento | não altera data | Eixo separado do meio e da natureza observacional | Distribuição separada por provedor |
| Cadastro da coorte | Pessoas com perfil criado na janela | pessoas | `profiles` | `user_id`, menor `created_at` observado em duplicata | janela e corte comuns | Perfil inválido/futuro fica fora | “Cadastros no período” |
| Pagante da coorte | Pessoa da coorte com pagamento elegível estritamente depois do cadastro e até o corte | pessoas | `profiles` + contrato compartilhado de pagamentos | pessoa; primeiro pagamento elegível após cadastro | `payment.occurred_at > profile.created_at` | Empate não demonstra “depois”; assinatura/trial/cortesia/pending não substituem pagamento | “Com pagamento registrado após o cadastro” |
| Uso de IA pós-pagamento | Pagante da coorte com `ai_usage_logs.status = success` e `created_at` estritamente depois do pagamento | pessoas | `ai_usage_logs` | pessoa | `log.created_at > payment.occurred_at` e `<= corte` | `reserved`, erro/recusa, uso anterior, sem usuário/data e futuro ficam fora | “Com uso de IA bem-sucedido iniciado após o pagamento” |

### Semântica temporal comprovada nos escritores

- Stripe grava `occurred_at = new Date(bt.created * 1000)` e preserva `bt.id`, `charge.id`, valores bruto/taxa/líquido, usuário e plano em `server/lib/stripeSync.ts:504-527`. É o instante do movimento de saldo registrado pela Stripe; não prova sozinho a hora exata em que o cliente pagou nem disponibilidade para saque.
- Asaas usa `event.dateCreated`, com fallback explícito para `receivedAtIso`, em `server/lib/asaasLedger.ts:95-113`; a charge usa `payment.id`, bruto, líquido e taxa derivada em `server/lib/asaasLedger.ts:127-165`. É recebimento reconhecido/registrado, não promessa de liquidação bancária.
- A reserva de IA pode ser atualizada para `success` sem atualizar `created_at` (`server/lib/aiUsage.ts:663-724`). Por isso a métrica afirma o início do registro success após o pagamento, não a conclusão da geração.

Reembolso parcial/total e disputa são movimentos próprios (`refund`/`dispute`) e não removem retrospectivamente a charge da história. Esta rodada não recalcula líquido, MRR ou churn.

## Leitura, cobertura e falhas

As quatro leituras que governam pagamento/funil são paginadas, têm ordem estável e pedem `count=exact`. A função compara o total retornado com o total materializado; erro, `count` ausente ou divergente lança erro e não devolve zero/fallback.

Equivalentes SQL das seleções (o código usa Supabase/PostgREST):

```sql
-- Histórico local observado de pagamentos até o mesmo corte
select id, provider, provider_transaction_id, stripe_charge_id,
       type, gross_cents, occurred_at, created_at, user_id, plan_code
from finance_transactions
where type = 'charge' and occurred_at <= :cutoff
order by occurred_at asc, id asc;

-- Coorte atual
select user_id, created_at
from profiles
where created_at >= :window_start and created_at <= :cutoff
order by created_at asc, user_id asc;

-- Evidência estreita de meio; nenhum payload bruto é lido
select provider, provider_subscription_id, payment_method
from subscriptions
order by id asc;

-- IA potencialmente posterior ao cadastro/pagamento da coorte
select user_id, tool, status, cost_estimate, created_at
from ai_usage_logs
where created_at >= :window_start and created_at <= :cutoff
order by created_at asc, id asc;
```

O payload informa separadamente: corte do cálculo; primeira ocorrência observada; maior `created_at` entre linhas locais lidas (descrita como linha criada, nunca “última sincronização”); linhas lidas; pagamentos distintos; duplicatas; sem usuário; sem meio; empates; conflitos de usuário/meio; e exclusões agregadas. Mesmo uma leitura local concluída sempre declara `historicoIntegral = nao_verificavel`. Zero linhas significa apenas “zero observado”.

Sem acesso real ao banco, a data inicial da cobertura, a completude do ledger e a reconciliação com provedores continuam não verificáveis. Linhas Stripe legadas sem `stripe_charge_id` ficam explicitamente excluídas por falta de identidade canônica; preencher esse elo exige reconciliação/backfill futuro revisado, não inferência no painel.

## Exemplo sintético executado

Janela sintética com corte em 11/09/2026, 12:00 de Brasília:

- `u1` e `u2` se cadastraram na janela; `u-old` se cadastrou antes dela.
- `u1` tem uma charge Stripe anterior à janela e um Pix Asaas na janela.
- `u2` tem uma charge Stripe na janela e uma duplicata com a mesma `charge.id`.
- `u-old` tem uma charge Stripe na janela; há também uma charge Stripe canônica sem usuário.
- Existem assinaturas pendentes Pix/boleto sem charge correspondente; elas não entram.
- Só `u1` tem `success` de IA iniciado depois do pagamento; `u2` tem erro.

Resultado esperado e obtido na função real usada pela rota:

| Saída | Resultado |
|---|---:|
| Pagamentos distintos na janela | 4 |
| Primeiro pagamento observado | 2 (`u2`, `u-old`) |
| Pagamentos posteriores | 1 (`u1`; o anterior global foi encontrado fora da janela) |
| Sem pessoa identificada | 1 |
| Pessoas identificadas que pagaram | 3 |
| Meio | Pix 1; Não identificado 3 |
| Provedor | Asaas 1; Stripe 3 |
| Duplicatas removidas | 1 |
| Funil da coorte | 2 cadastros → 2 pagantes → 1 com IA success pós-pagamento |

A divergência 4 pagamentos no gráfico versus 2 pagantes no funil é correta: o gráfico inclui pagamento de pessoa cadastrada antes da janela e o pagamento sem usuário; o funil mantém apenas a coorte de cadastros da janela. Não há tentativa de forçar igualdade.

## Interface, API, cache e desempenho

- O antigo `conversoesPro` foi removido, sem reutilizar sua chave para outra semântica.
- `contractVersion: 2` e o bloco `pagamentos` são obrigatórios. O cliente pede `contract=2` e valida a forma antes de renderizar.
- Cliente antigo → backend novo: falta de `contract=2` recebe HTTP 409 com mensagem para atualizar; não recebe payload novo sob semântica antiga.
- Cliente novo → backend antigo: o backend ignora a query e devolve o payload antigo; o cliente detecta ausência do contrato v2 e mostra erro de incompatibilidade, sem renderizar aquisição.
- Cache passou de `admincache:overview-series:<janela>` para `admincache:overview-series:v2:<janela>`, TTL preservado em 60 s.
- Nenhum payload bruto do provedor é enviado ou lido para classificar meio.
- Custo restante, ainda sem medição real: uma varredura do histórico completo de charges e uma varredura estreita de assinaturas por recomputação de cache; `count=exact` também tem custo no banco. Não há N+1 nem limite silencioso. Uma futura medição pode justificar índice/RPC/materialização, mas isso não autoriza migration nesta rodada.

## Validação realmente executada

Comandos finais aprovados:

- `pnpm vitest run server/lib/registeredPayments.test.ts server/lib/overviewSeries.test.ts server/routes/adminOverviewSeriesV2.test.ts client/src/components/admin/overview/fase4.test.tsx client/src/pages/Admin.visao.hierarquia.test.tsx server/lib/stripeSyncJanela.test.ts server/lib/stripeSyncDono.test.ts server/lib/asaasLedger.test.ts --configLoader runner`: **8 arquivos, 173 testes aprovados**.
- `pnpm exec tsc --noEmit`: aprovado.
- Prettier apenas nos arquivos alterados e `pnpm prettier --check <arquivos alterados>`: aprovado.
- `git diff --check`: aprovado.
- Equivalentes do restante de `pnpm check`, todos aprovados: `node --import tsx scripts/generateRoadmapMeta.mts --check`; `generateProjectsV2Registry.mts --check`; `generateSitemap.mts --check`; `checkCspHashes.mts`.

Ocorrências e limitações registradas:

- `pnpm check` agregado: o `tsc` passou; a CLI `tsx` falhou antes do primeiro gerador ao tentar abrir `/tmp/tsx-1000/*.pipe` (`listen EPERM`). Os quatro scripts foram então executados pelo runtime equivalente sem IPC, não ignorados.
- A primeira tentativa da nova integração via `adminTestClient` reproduziu os dois timeouts de 5 s relatados na ADM-000. A causa foi identificada: o helper abre `127.0.0.1` e o sandbox gera `listen EPERM`. Não houve aumento de timeout nem skip. A computação real usada pela rota foi extraída para `carregarOverviewSeries` e testada diretamente, inclusive erro e paginação.
- Inspeção visual: o componente real foi renderizado com dados sintéticos em jsdom na suíte de componente. Uma captura headless local foi tentada, mas o Chrome falhou ao abrir seu socket interno (`setsockopt EPERM`); nenhuma imagem foi produzida. Isto não é E2E nem conciliação real.
- Os 291 testes da ADM-000 não foram reapresentados como validação deste patch. A suíte completa não foi executada; foram executadas as suítes afetadas e as dos escritores que fundamentam o contrato.

Cobertura de casos: pendências Pix/boleto sem charge; geração versus registro de recebimento; pagamento anterior à janela; UUID fora de ordem; pessoa antiga; troca de provedor; retorno/renovação manual sem classificação comercial; duplicata; pagamentos distintos; zero/negativo/inválido; usuário/identidade ausente; conflito de vínculo/meio; reembolso parcial/total e disputa; virada e limites de Brasília; empate/futuro; IA anterior, erro, reserva, success posterior e timestamp insuficiente; múltiplos pagamentos versus pessoas únicas; histórico desconhecido; fonte indisponível; leitura com várias páginas/incompleta; payload incompatível; denominador zero; cadastros recentes; e delta de coortes desativado.

## Achados da auditoria e backlog

| IDs | Situação nesta rodada | Classe/prioridade |
|---|---|---|
| ADM-01/02 | **Atendidos na Visão**: subscriptions/UUID/created_at deixaram de provar conversão; pending sem charge não entra; agrupamento usa o recebimento registrado | Erro comprovado corrigido, alta |
| ADM-05/06 | **Atendidos na Visão**: funil usa pagamento e success de IA em ordem temporal demonstrável; comparação entre coortes desativada | Erro comprovado corrigido, alta |
| ADM-07 | **Não resolvido integralmente**: o gráfico/funil novos não usam `subscription_completed`, mas a aba Conversão e sua instrumentação web permanecem fora do escopo | Limitação de medição, alta |
| ADM-03/04 | Não alterados | Erro/limitação, alta |
| ADM-08/09/10/11 | Não alterados: MRR, churn, risco e filtros de assinantes seguem para rodadas próprias | Risco financeiro, alta |
| ADM-12/13/14 | Não alterados | Limitação/produto, média |
| ADM-16 | Não alterado | Erro de produto, média |
| ADM-17 | Não alterado; concorrência na baixa de comissão continua risco prioritário e ausência de trilha não prova ausência de perda | Risco financeiro, crítica |
| ADM-18 | Não alterado | Limitação de medição, média |
| ADM-19 | Não alterado; RBAC owner/editor/viewer continua risco prioritário | Risco de permissão, crítica |
| ADM-15, ADM-20, ADM-21, ADM-22 | Preservados no backlog original de 22 itens; não examinados nesta rodada e não declarados confirmados | A revisar |

## O que ainda exige lastro/modelagem futura

- Aquisição, renovação automática/manual e reativação continuam indisponíveis quando não há história de contrato/ciclo/interrupção de acesso. Dias sem pagamento não são usados como substituto.
- O meio Stripe continua desconhecido sem elo normalizado entre charge e evidência de método. Provider não é tratado como meio.
- Cobertura integral do ledger e pagamentos órfãos/legados exigem conciliação real revisada com banco/provedores e talvez backfill; nenhum foi feito.
- Obrigação/fatura, tentativa, pagamento, entrega de webhook e movimento de ledger continuam identidades distintas. Esta rodada só centraliza a identidade observável do pagamento para Visão.
- Uma futura classificação comercial provavelmente exigirá fatos persistidos de contrato/ciclo e interrupção, além de política explícita para ambiguidades. Não foi proposta migration prematura.

## Arquivos da implementação

- `server/lib/registeredPayments.ts` e teste: contrato, identidade, dedupe, classificação observacional e cobertura.
- `server/lib/overviewSeries.ts` e teste: leituras completas provadas, séries e funil compartilhado.
- `server/routes/admin.ts` e `server/routes/adminOverviewSeriesV2.test.ts`: integração, negociação de contrato e cache v2.
- `client/src/components/admin/overview/SeriesCharts.tsx`, `FunnelDigest.tsx` e `fase4.test.tsx`: apresentação, unidades, ressalvas, estados e acessibilidade textual.
- `client/src/pages/Admin.tsx` e `Admin.visao.hierarquia.test.tsx`: tipo/consumo v2 e resposta incompatível explícita.
- `server/routes/adminOverviewCards.test.ts`: fixtures/regressões existentes atualizadas para a fonte paga real e `contract=2`.
- Este relatório. Nenhuma migration.

## Retorno copiável para revisão

> ADM-001 implementada localmente sobre `main@f050d76abde09922e430a356085cfc7de09cd582`, em clone isolado `/tmp/boranatech-adm001`, branch `fix/adm-001-visao-pagamentos`. O gráfico da Visão agora conta charges positivas registradas no ledger, deduplicadas por `stripe_charge_id`/`asaas payment.id`, e separa primeiro pagamento observado, posteriores e sem pessoa; não chama nenhum deles de aquisição/renovação/reativação sem lastro. O funil agora é cadastro → pagamento registrado após cadastro → success de IA cujo registro começou após pagamento, com coortes/deltas desiguais desligados. API/cache usam contrato v2 e negociação explícita, sem reinterpretar payload antigo. Não houve migration, backfill, sync, chamada a provedor, deploy ou dados reais. Validação final: 173 testes afetados/escritores aprovados, TypeScript/format/diff aprovados e quatro checks gerados aprovados via runtime sem IPC; `pnpm check` agregado e captura Chrome foram bloqueados por sockets proibidos no sandbox. ADM-01/02 e ADM-05/06 foram atendidos na Visão; ADM-07 é apenas parcial; demais achados, especialmente RBAC (ADM-19) e concorrência de comissão (ADM-17), permanecem no backlog. Diff pronto para revisão, sem publicação.
