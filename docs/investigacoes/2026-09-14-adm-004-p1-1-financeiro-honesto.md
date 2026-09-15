# ADM-004-P1.1 — painel financeiro honesto

Data da implementação: 2026-09-14
Base auditada: `39fa5eeb60599efa655ac8fd4256b3e2db088a83`
Natureza: implementação estática, sem consulta a dados reais

## Resultado

A aba Financeiro passou a exibir apenas dois conjuntos de fatos locais:

1. movimentos observados em `finance_transactions`, sempre separados por moeda e classificados como parciais;
2. estado atual dos acessos em `subscriptions`, separado entre automático, manual pré-pago e trial.

O cálculo derivado de preço vigente de catálogo deixou de ser chamado MRR. MRR contratual e métricas de retenção aparecem em um único bloco indisponível, com valor `null`, porque o modelo atual não preserva obrigação e ciclos contratuais por instante.

## Fórmulas publicadas

| Indicador                        | Fórmula                                                                               | Fonte                                     | Estado                          |
| -------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------- |
| Entradas positivas registradas   | `sum(gross_cents)` para `type=charge` e bruto positivo, após validação e deduplicação | `finance_transactions`                    | parcial, por moeda              |
| Reembolsos registrados           | `sum(abs(gross_cents))` para `type=refund` aceito                                     | `finance_transactions`                    | parcial, por moeda              |
| Taxas registradas                | soma assinada de `fee_cents` nos tipos aceitos                                        | `finance_transactions`                    | parcial, por moeda              |
| Líquido calculável registrado    | `sum(net_cents)` de `charge`, `refund`, `adjustment` e `dispute` aceitos              | `finance_transactions`                    | parcial, por moeda              |
| Pagamentos registrados           | identidades canônicas de `charge` positiva                                            | `finance_transactions`                    | parcial, por moeda              |
| Pessoas identificadas            | `count(distinct user_id)` nas charges aceitas                                         | `finance_transactions`                    | parcial, por moeda              |
| Transações sem pessoa            | movimentos aceitos cujo `user_id` é ausente                                           | `finance_transactions`                    | parcial, por moeda              |
| Acessos automáticos ativos       | linhas não expiradas com `status=active` e `renewal_type=auto`                        | `subscriptions`                           | parcial                         |
| Acessos manuais pré-pagos ativos | linhas não expiradas com `status=active` e `renewal_type=manual`                      | `subscriptions`                           | parcial e fora de recorrência   |
| Acessos em trial                 | linhas não expiradas com `status=trialing`                                            | `subscriptions`                           | parcial e fora de pagantes      |
| Valor mensal de catálogo         | soma do preço vigente do ciclo dividido pelos meses do intervalo                      | `subscriptions` + `shared/planPricing.ts` | parcial, por moeda e modalidade |

`fee_cents` e `net_cents` são somados com seu sinal persistido. Não há conversão cambial ou total multimoeda.

## Nomenclatura e remoções

- “MRR atual”, quando era apenas preço vigente mensalizado sobre acesso atual, virou **Valor mensal de catálogo dos acessos ativos**.
- O gráfico histórico legado visível passou a se chamar **Valor mensal de catálogo e acessos ativos**.
- O card da Visão que somava caixa sem declarar moeda deixou de exibir o total legado e passou a encaminhar para **Caixa registrado por moeda** na aba Financeiro.
- “Receita bruta”, “receita líquida” e “pagamentos” passaram a usar **registrado** ou **observado**.
- O painel deixou de consumir e mostrar `/billing-metrics`; o endpoint legado foi preservado para compatibilidade de ADM-001/ADM-002.
- O botão operacional de sincronização com Stripe foi removido da aba. “Atualizar leitura local” apenas refaz o GET local e renova o cache write-through.
- Não há percentuais comparativos: a P1.1 não possui uma base histórica equivalente e comprovadamente coberta para sustentá-los.

## Indisponíveis, nunca zero

Um único bloco agrupa: MRR contratual, ARR, New MRR, Expansion MRR, Contraction MRR, Reactivation MRR, Churned MRR, NRR, churn de receita, logo churn e LTV. Todos usam `status=unavailable` e `value=null`.

Faltam fatos imutáveis de obrigação, preço/moeda contratados por ciclo e timeline de trial, pausa, grace period, alteração de plano, cancelamento e reativação. O catálogo atual e o estado atual de acesso não substituem esses fatos.

## Contrato e falhas explícitas

`shared/adminFinance.ts` define o contrato runtime v1 com Zod. Ele carrega estado `available | partial | unavailable | not_collected`, fonte, cobertura, frescor, `computedAt`, período, timezone, moeda, exclusões, conflitos e limitações.

O parser rejeita:

- versão ausente ou diferente de 1;
- campo obrigatório ausente;
- `NaN`, infinito e inteiro inseguro;
- valor sem moeda ou moeda divergente do bucket;
- valor carregado por estado indisponível/não coletado;
- moeda repetida, que poderia induzir soma implícita;
- dias repetidos, fora de ordem ou séries de moedas desalinhadas.

O cache usa chave `admincache:finance:honest:v1:<janela>`, valida antes de escrever e valida novamente no cache hit. Um cache incompatível produz erro; não cai no payload legado, lista vazia ou zero.

## Leitura, identidade e cobertura

- As duas fontes são lidas uma vez e em paralelo; o join do plano vem na consulta de acessos, sem N+1.
- A paginação usa `count=exact`, ordenação estável e identidade de linha. Count ausente, inválido ou mutável, linha repetida e identidade ausente abortam a leitura.
- A identidade econômica é `provider + provider_transaction_id`, com fallback documentado para balance transaction Stripe.
- Duplicatas economicamente idênticas são ignoradas. Diferença de tipo, bruto, taxa, líquido, moeda ou instante exclui o grupo inteiro e incrementa `economicConflict`; não existe escolha silenciosa de representante.
- Dois offsets que representam o mesmo instante são normalizados ao mesmo ISO antes da comparação.
- A leitura declara `transactionalSnapshot=false`, `reconciledWithProviders=false` e `externalCoverage=not_collected`.
- Zero dentro de um bucket existente significa zero nas linhas locais aceitas. Nenhuma linha local no período produz `not_collected` e métricas nulas, não R$ 0.
- Reembolso externo em `admin_refunds` que não entrou no ledger permanece uma limitação textual; não é inferido.

## Período

O backend é a autoridade da janela. Presets de 30/90 dias e mês anterior usam dias civis completos em `America/Sao_Paulo`, com início inclusivo e fim exclusivo. Período personalizado rejeita o dia corrente/futuro, inversão e mais de 366 dias. A interface mostra datas e timezone. Comparação percentual foi omitida porque não há janelas históricas de cobertura equivalente demonstrável.

## Segurança e compatibilidade

- Não foi criada rota administrativa. `/api/admin/finance/summary` e `/api/admin/finance/transactions` já constam no manifesto com `finance.read`; a contagem fechada permanece 128.
- O modo RBAC permanece `observe`; papéis e `admin_roles` não foram alterados.
- O contrato novo é opt-in por `contract=honest-v1`. Chamadores antigos de `/finance/summary` mantêm o payload legado.
- Não foram alterados fluxos de cobrança, assinatura, acesso, reembolso, afiliado ou comissão.
- A requisição não chama Stripe nem Asaas.
- O drill-down reaproveita rota administrativa protegida e não mostra nome, email nem identificador externo.

## Interface

A ordem principal responde: caixa positivo, reembolso, taxa e líquido por moeda; pagamentos/pessoas/sem pessoa; acessos automáticos/manuais/trial; catálogo explicitamente não contratual; métricas indisponíveis; e drill-down. Estados parciais usam tom neutro/âmbar, nunca verde. Há loading, erro explícito, parcial, indisponível e não coletado, filtros de período/moeda e refresh local contextualizado.

## Validação executada

- suíte completa: 447 arquivos aprovados e 5 arquivos integralmente skipped; 5.928 testes aprovados e 18 skipped declarados; zero falhas;
- suíte focal final: contrato, caixa, períodos, paginação, RBAC, interface e regressões de Visão aprovados;
- TypeScript principal e `tsconfig.scripts.json`: aprovados;
- geradores em modo check, sitemap e CSP: aprovados;
- Prettier nos arquivos da tarefa e `git diff --check`: aprovados;
- exemplo JSON validado pelo parser compartilhado v1;
- inspeção visual com Chromium e fixture sintética em 1440×1000 e 390×844: hierarquia, quebra de cards, filtros, metadados, bloco indisponível e drill-down sem corte ou overflow horizontal observado.

Os 18 skips dependem de integrações Postgres/Redis declaradas pela suíte; não foram contabilizados como aprovados. A inspeção visual não usou autenticação ou dados reais e não equivale a teste integrado contra o backend.

## Artefatos complementares

- `2026-09-14-adm-004-p1-1-matriz.csv`: matriz disponível/parcial/indisponível.
- `2026-09-14-adm-004-p1-1-exemplo-sintetico.json`: payload exclusivamente sintético; não é medição.
- `2026-09-14-adm-004-p1-2-plano.md`: evolução para fatos append-only de obrigação e ciclo.

## Limitações residuais

- cobertura histórica dos dois provedores não é provada;
- não há snapshot transacional durante a paginação;
- não há reconciliação nem watermark persistido;
- reembolsos externos ao ledger e tipos não materializados podem faltar;
- `subscriptions` é estado atual mutável, não histórico contratual;
- o preço atual pode divergir do preço contratado;
- pessoas são deduplicadas somente pelo `user_id` persistido;
- valores em buckets vazios não devem ser interpretados como cobertura externa completa.

## Arquivos da P1.1

Implementação e testes:

- `shared/adminFinance.ts`
- `shared/adminFinance.test.ts`
- `server/lib/honestFinance.ts`
- `server/lib/honestFinance.test.ts`
- `server/routes/admin.ts`
- `server/lib/adminRbac.test.ts`
- `client/src/components/admin/FinanceDashboard.tsx`
- `client/src/components/admin/FinanceDashboard.test.tsx`
- `client/src/components/admin/overview/SubscriptionChart.tsx`
- `client/src/components/admin/overview/chartMath.ts`
- `client/src/components/admin/overview/chartMath.test.ts`
- `client/src/components/admin/overview/fase4.test.tsx`
- `client/src/components/admin/overview/HealthBand.test.tsx`
- `client/src/pages/Admin.tsx`
- `client/src/pages/Admin.visao.hierarquia.test.tsx`
- `server/lib/overviewSeries.ts`
- `server/lib/healthBand.ts`

Documentação:

- este relatório;
- a matriz, o exemplo sintético e o plano P1.2 listados acima.

Os seis artefatos P0 foram preservados integralmente. Não houve migration, backfill, sync, replay, leitura de dado real, chamada operacional a provedor, commit, push, PR, merge ou deploy.
