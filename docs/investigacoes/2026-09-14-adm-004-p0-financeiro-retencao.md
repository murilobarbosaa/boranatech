# ADM-004-P0 — auditoria de receita recorrente, assinaturas e retenção

Data da auditoria: 2026-09-14
Base auditada: `39fa5eeb60599efa655ac8fd4256b3e2db088a83` (`origin/main`)
Base inicial informada: `1f81de8475b80bbd5ab917d4ec736bb4dddab80d`
Escopo: análise estática; nenhuma correção implementada

## Veredito executivo

O admin tem dois domínios que precisam continuar separados:

1. **Caixa observado**: `finance_transactions` registra movimentos recebidos dos provedores. É a melhor fonte atual para receita bruta, taxas e líquido, mas sua cobertura não é provada no próprio dado e há lacunas conhecidas. Os números devem ser classificados como **parciais**, nunca como contabilidade completa.
2. **Estado atual de acesso**: `subscriptions` diz quem parece ativo agora. Não é um ledger contratual e não preserva cada obrigação/ciclo. O “MRR” atual aplica preço de catálogo ao estado corrente, não o valor contratado. Ele é uma **estimativa de run-rate de catálogo**, não MRR contratual.

Conclusão principal: **MRR contratual, ARR contratual, churn de receita, New/Expansion/Contraction/Reactivation/Churned MRR, NRR, logo churn confiável e LTV confiável não são mensuráveis hoje**. Exibir números para eles sem um novo modelo factual induziria decisões incorretas.

Há boas decisões defensivas no código: paginação, falha explícita em várias leituras, `trialing` fora de MRR, `past_due` separado, gaps de snapshots visíveis, idempotência por evento/transação e distinção de caixa versus recorrência na UI. Isso não supre a ausência de fatos contratuais históricos.

## Legenda de evidência

- **Comprovado**: observado diretamente em schema, implementação, teste ou configuração versionada.
- **Inferência**: conclusão lógica a partir dos fatos versionados, ainda sem medir produção.
- **Medição bloqueada**: exigiria consulta agregada ao banco; não havia credencial configurada no clone.
- **Confiável**: definição e cobertura demonstráveis para a decisão proposta.
- **Parcial**: há sinal útil, mas cobertura, reconciliação ou semântica incompleta.
- **Indisponível**: o fato necessário não é preservado; não é correto calcular.
- **Incorreto**: o rótulo/fórmula atual afirma algo diferente do que a fonte prova.

## Fontes examinadas

Principais evidências estáticas:

- `server/lib/financeMetrics.ts`: caixa, taxas, refunds, série e receita diferida;
- `server/lib/billingMetrics.ts`: MRR atual, ARPU, risco, churn e LTV;
- `server/lib/subscriptionSnapshots.ts`: fotografia diária derivada;
- `server/lib/stripeSync.ts`: ingestão de balance transactions Stripe;
- `server/lib/asaasLedger.ts` e `asaasLedgerWriter.ts`: ingestão do caixa Asaas;
- `server/providers/stripe.ts`, `asaas.ts` e `shared.ts`: eventos e transições;
- `server/routes/admin.ts`: APIs e caches do admin;
- `client/src/components/admin/FinanceDashboard.tsx` e `client/src/pages/Admin.tsx`: definições exibidas;
- migrations de `subscriptions`, `billing_events`, `finance_transactions`, snapshots, refunds, cupons e creators;
- `shared/planPricing.ts` e `shared/paymentMethods.ts`: preço atual de catálogo e ciclos avulsos.

Os detalhes linha a linha estão em:

- `2026-09-14-adm-004-p0-metricas.csv`;
- `2026-09-14-adm-004-p0-escritores-fontes.csv`;
- `2026-09-14-adm-004-p0-confiabilidade.csv`;
- `2026-09-14-adm-004-p0-consultas-read-only.sql`.

## 1. O que o painel mede hoje

### 1.1 Resultado de caixa

**Comprovado.** `getFinanceSummary` lê `finance_transactions` por `occurred_at`, inclui `charge`, `refund`, `adjustment` e `dispute`, exclui `payout`, e calcula:

- receita bruta = soma de `gross_cents` apenas em `charge`;
- taxas = soma de `fee_cents` nos tipos de receita;
- reembolsos = magnitude de `gross_cents` em `refund`;
- receita líquida = soma de `net_cents` nos tipos de receita;
- lucro = receita líquida menos despesas modeladas;
- margem = lucro / receita líquida quando positiva.

O intervalo é inclusivo (`>= from`, `<= to`) e baseado em instantes UTC enviados pelo cliente. Os presets usam início de mês UTC até `now`; a série agrupa por mês UTC. A UI formata em BRL mesmo que a linha possua `currency` e o agregador não segregue moeda.

**Risco.** Somar moedas distintas e formatar tudo como BRL seria incorreto. O Asaas é BRL; o schema Stripe admite moeda textual. A ausência de uma guarda `currency = BRL` torna a confiabilidade dependente de uma condição de produção ainda não medida.

**Cobertura.** Stripe entra por balance transactions, com sync diário às 04:20 UTC, botão manual e sync acionado por eventos relevantes. Asaas entra pelo webhook em modo best-effort depois da ativação. Se a escrita do ledger Asaas falhar, o acesso permanece correto e o financeiro fica incompleto até backfill. Não existe, na tabela, manifesto de reconciliação que prove intervalo integral por provedor.

**Lacuna conhecida.** `admin_refunds.settlement='external'` não entra em `finance_transactions`; logo reembolsos, receita líquida, lucro e margem globais ficam superestimados quando existir devolução externa. O próprio código documenta essa divergência.

Classificação: **parcial** para caixa; não é DRE, competência, saldo bancário ou receita reconhecida.

### 1.2 Receita recebida

**Comprovado.** Uma `charge` em `finance_transactions` é a evidência mais próxima de recebimento. Stripe usa balance transaction; Asaas só monta `charge` em `PAYMENT_RECEIVED` ou `PAYMENT_CONFIRMED`.

**Inferência.** “Receita bruta recebida” pode ser calculada por soma de charges, desde que a cobertura de ingestão seja demonstrada, moedas sejam separadas e ajustes/disputas não sejam confundidos com cobrança.

Classificação atual: **parcial**, pois não há cobertura/reconciliação explícita nem garantia de todas as moedas em BRL.

### 1.3 Receita bruta e líquida

- **Bruta exibida**: charges antes de taxas e sem descontar refunds/disputes.
- **Líquida exibida**: `net_cents` de charges, refunds, adjustments e disputes.
- **Não é receita contábil por competência**: é movimento do provedor por `occurred_at`.
- **Não incorpora devolução externa** e não explicita reservas, impostos, comissões pagas/devidas ou diferença entre autorização, liquidação e disponibilidade bancária.

Classificação atual: **parcial**.

### 1.4 Taxas Stripe e Asaas

- Stripe: `fee_cents` vem da balance transaction.
- Asaas: taxa é derivada como `value - netValue`.
- O painel traz total e quebra por provedor, mas não mede cobertura nem anomalias de taxa ausente.
- Tipos Stripe fora do mapa são `skipped`; entre os exemplos documentados está `stripe_fee`. Isso precisa de reconciliação para provar que nenhuma taxa relevante ficou fora.

Classificação atual: **parcial**.

### 1.5 MRR e ARR

**Definição atual exibida.** “MRR das assinaturas ativas”. A UI chama o bloco de “recorrente projetado”.

**Fórmula atual.** Para cada `subscriptions.status='active'` não expirada:

```text
MRR_atual = Σ round(preço_atual_de_catálogo[plano] / meses_do_intervalo)
```

`trialing` é contado separadamente; `past_due` fica fora do MRR e entra em risco. Mensal, semestral e anual usam 1, 6 e 12 meses. O preço primário vem de `shared/planPricing.ts`, hoje R$ 29,90, R$ 129,00 e R$ 222,00, e não do valor efetivamente contratado/cobrado.

**Problemas materiais:**

- não há `contracted_amount` nem `contracted_currency` por ciclo/versão;
- desconto de cupom/afiliado fica como código e evento de venda, não como obrigação recorrente vigente;
- desconto `once` não é distinguido de preço recorrente no MRR;
- mudanças de catálogo reescrevem retroativamente o valor atribuído a todas as assinaturas;
- manual Pix/boleto é compra avulsa com prazo de acesso e sem obrigação automática futura, mas entra no mesmo MRR de contratos recorrentes;
- `active` com `current_period_end = null` é aceito;
- não há pausa/grace period canônicos;
- não há timeline de upgrade/downgrade/ciclo para decompor variação;
- moeda do plano não é lida no cálculo.

**Veredito:** o número é um **run-rate de catálogo misturando obrigação automática e acesso pré-pago manual**. Chamá-lo de MRR contratual é **incorreto**. ARR derivado (`12 × MRR`) também é **indisponível** como métrica contratual.

### 1.6 Assinantes por estado

- `activeCount`: ativos não expirados que entram no MRR atual;
- `trialingCount`: trials presentes no recorte e não expirados;
- `past_due`: tally atual e risco, fora do MRR;
- `canceledCount`: snapshot grava tally cru de todas as linhas com status cancelado;
- `by_status`: estado cru de todas as linhas, inclusive históricas/superseded.

**Limites:** `subscriptions` é estado operacional mutável, pode ter várias linhas históricas por pessoa, e status não equivale a cliente único. `activeCount` é contagem de linhas, não logos deduplicados comprovados para toda a história. O índice parcial reduz duplicidade simultânea active/trialing, mas não transforma a tabela em ledger contratual.

Classificação: **parcial** para estado operacional atual; cancelados acumulados não são churn.

### 1.7 Novas assinaturas, renovações e reativações

- `subscriptions.created_at` mede criação de linha, não necessariamente pagamento ou início de obrigação.
- Cartão Stripe atualiza a mesma linha em renovações; ciclo anterior é sobrescrito.
- Manual Pix/boleto cria nova linha pending e depois ativa/supersede; uma renovação pode parecer nova assinatura.
- `past_due -> active` é classificado em runtime como recuperação, mas não há fato analítico imutável garantido para cada transição.
- “Reativação” de cartão pode ser apenas reversão de `cancel_at_period_end`; em manual, reverter intenção não cria obrigação futura.

Classificação atual: **indisponível** para séries gerenciais confiáveis de novas assinaturas, renovações e reativações.

### 1.8 Churn de clientes, churn de receita e LTV

O churn atual conta saídas efetivas em 30 dias e divide por uma aproximação de ativos no início:

```text
logo_churn_aproximado = saídas_deduplicadas_na_janela /
                        linhas_criadas_antes_do_início_e_não_encerradas_até_lá
```

Há guardas úteis contra zero falso e dados jovens. Entretanto, o próprio código declara `activeAtStart` como aproximação. A população é reconstruída de estado atual, `canceled_at` e `subscription_cancellations`, não de membership histórico por instante. Exclusão de conta pode apagar `subscriptions`; cancelamentos órfãos são excluídos do numerador para não misturar populações. Isso melhora consistência interna, mas perde churn real.

O LTV atual é `ARPU_atual / churnRate_30d`. Ele mistura run-rate de catálogo atual com um churn aproximado de janela curta e não considera margem, cohorts ou vida média adequada.

Veredito:

- logo churn atual: **parcial/experimental**, inadequado para decisão financeira;
- churn de receita: **indisponível**;
- LTV atual: **incorreto para decisão gerencial**;
- NRR e Gross Revenue Churn: **indisponíveis**.

### 1.9 Inadimplência e recuperação

- `past_due` atual sinaliza inadimplência Stripe operacional e seu equivalente mensal de catálogo;
- pending manual é cobrança emitida/aguardando, não dívida contratual automática;
- Asaas Pix overdue fecha uma compra avulsa pending; não representa parcela de contrato recorrente;
- `past_due -> active` é reconhecido no código como recuperação, mas não persistido em fato analítico próprio;
- não existem saldo devedor, vencimento original, tentativas, valor recuperado e write-off canônicos por obrigação.

Classificação: **parcial** para fila operacional de Stripe; **indisponível** para inadimplência financeira aberta e taxa/valor de recuperação comprovados.

### 1.10 Reembolsos e chargebacks

- Stripe refunds/disputes chegam ao ledger por balance transactions;
- Asaas refund integral chega por `PAYMENT_REFUNDED`;
- Asaas refund parcial é reconhecido como não tratado;
- `admin_refunds` registra intenção/resultado e settlement, mas devolução externa não entra no resumo global;
- chargeback Asaas não possui modelo equivalente; o código assume que Pix não tem chargeback.

Classificação: **parcial**. Refunds do ledger são bons fatos de caixa quando ingeridos, mas a cobertura consolidada não é provada e devoluções externas/partial Asaas permanecem fora.

### 1.11 Cupons, afiliados e comissões

- `subscriptions.coupon_code` e `affiliate_code` preservam atribuição na linha corrente;
- cupons guardam percentual atual, validade e contador de uso, mas não uma versão imutável da regra aplicada;
- afiliados mantêm contadores acumulados mutáveis (`sales`, `revenue_cents`, `commission_due_cents`, `commission_paid_cents`);
- `creator_events` registra vendas desde 2026-09-14, em best-effort, ao lado dos contadores;
- comissão é calculada na ativação sobre `revenueCents` do evento; ausência de valor não escreve conversão;
- renovação é explicitamente excluída de desconto e não há ledger de comissão por ciclo com settlement completo.

Classificação: **parcial** para atribuição e totais operacionais; **indisponível** para margem líquida por cupom/afiliado e comissão devida/paga reconciliada por pagamento ao longo de toda a história.

### 1.12 Planos mensal, semestral/anual, manual e gratuito

- Catálogo pago: mensal, semestral e anual.
- Cartão: recorrente automático para os três.
- Pix: avulso/manual para mensal, semestral e anual.
- Boleto: avulso/manual apenas semestral e anual.
- Gratuito não é uma obrigação financeira e deve ser exibido como população de acesso, nunca MRR zero somado a pagantes.
- Concessões de creator/influencer/afiliado dão Pro sem `subscriptions`; precisam ficar fora de assinantes pagantes e MRR.

O painel deve separar pelo menos: `free`, `grant`, `recurring_auto`, `prepaid_manual` e `trial`.

## 2. Fatos não equivalentes

| Fonte                        | O que prova                                                                      | O que não prova                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `finance_transactions`       | movimento de caixa observado pelo provedor, valor bruto/taxa/líquido e instante  | obrigação contratual, período prestado, cobertura completa, saldo bancário                                     |
| `billing_events`             | evento recebido, identidade, hora do provedor/recebimento e conclusão do handler | pagamento por si só, contrato canônico ou arquivo imutável completo; linhas podem ser removidas em compensação |
| `subscriptions`              | estado operacional corrente de acesso e vínculo mais recente                     | histórico de ciclos, preço contratado, receita recebida ou população histórica exata                           |
| payload Stripe               | estado/evento do provedor no momento recebido                                    | fato interno reconciliado ou permanência garantida fora de `raw`                                               |
| payload Asaas                | cobrança/evento avulso observado                                                 | assinatura recorrente; o produto usa Pix como compra manual                                                    |
| `subscription_cancellations` | intenção/desfecho de não renovação/cancelamento                                  | obrigação, valor perdido ou logo histórico completo                                                            |
| `subscription_snapshots`     | fotografia diária derivada pela regra do painel                                  | decomposição causal, precisão intradiária ou reconstrução do contrato                                          |
| `admin_refunds`              | ação/devolução declarada e seu settlement                                        | movimento no ledger em todos os settlements                                                                    |
| `affiliates`                 | contadores acumulados correntes                                                  | ledger imutável de comissão e reconciliação de pagamento                                                       |
| `creator_events`             | telemetria temporal recente de click/checkout/sale                               | cobertura histórica ou entrega garantida; escrita é best-effort                                                |

Nenhuma consulta ou KPI deve somar essas fontes como se fossem duplicatas intercambiáveis. A união exige chaves, precedência e reconciliação explícitas.

## 3. Suficiência para MRR contratual por instante

| Requisito                      | Disponibilidade atual                                               | Veredito                                   |
| ------------------------------ | ------------------------------------------------------------------- | ------------------------------------------ |
| obrigação recorrente ativa     | `status` atual; manual não é recorrente                             | parcial                                    |
| valor contratado               | preço atual de catálogo e valor de pagamentos                       | indisponível                               |
| moeda contratada               | plano/transaction têm moeda, assinatura não fixa a moeda            | indisponível                               |
| intervalo contratado           | plano atual tem intervalo                                           | parcial; mutável e sem versão              |
| início/fim do período          | campos atuais existem                                               | parcial; ciclos anteriores sobrescritos    |
| trial                          | `trial_end` e status existem                                        | parcial; sem timeline completa             |
| cancelamento imediato/agendado | flags e cancellation rows                                           | parcial                                    |
| pausa                          | status possível no payload/snapshot, sem modelo canônico de período | indisponível                               |
| upgrade/downgrade              | plano atual                                                         | indisponível historicamente                |
| reativação                     | reversão/transição em runtime                                       | indisponível como fato analítico           |
| desconto                       | código e alguns eventos                                             | indisponível como versão/efeito recorrente |
| grace period                   | não modelado                                                        | indisponível                               |
| assinatura manual              | `renewal_type`, método e período atual                              | parcial; é acesso pré-pago, não obrigação  |
| provedor/id externo            | campos existem                                                      | parcial; sem namespace/versões completas   |

**Decisão:** não existe informação suficiente para provar MRR contratual em cada instante. Consequentemente, churn de receita e decomposição de MRR também não são mensuráveis com confiabilidade.

## 4. Modelo recomendado — sem implementação nesta fase

### 4.1 Princípios

1. Append-only para fatos externos e decisões internas.
2. Correção por fato compensatório/superseding, nunca `UPDATE` que apaga história econômica.
3. `effective_at` responde quando o fato vale no negócio; `observed_at` responde quando o sistema soube.
4. Identidade namespaced: `(provider, account, object_type, external_id, event_id/version)`.
5. Moeda sempre explícita; nunca somar moedas sem conversão versionada.
6. Pagamento, obrigação, acesso e evento são entidades separadas.
7. Snapshots são derivados reconstruíveis, não fonte primária.

### 4.2 Fatos propostos

**`billing_event_facts`**

- provider, provider_account, event_id, event_type, object_id;
- provider_created_at (`effective_at` quando aplicável), received_at (`observed_at`);
- payload hash, schema version, livemode, ingest status;
- first_seen_at, last_seen_at, attempt count;
- unique por namespace/evento; raw criptografado/restrito com retenção definida.

**`contract_obligation_facts`**

- internal contract/customer pseudonymous ids;
- provider e external contract id;
- event kind: started, renewed, repriced, expanded, contracted, paused, resumed, cancel_scheduled, cancel_reverted, canceled, expired, corrected;
- amount, currency, interval e interval_count;
- period_start/end, trial_start/end, cancel_effective_at, grace_end;
- plan/product version, discount facts e predecessor/supersedes;
- `effective_at`, `observed_at`, source event id e idempotency key.

**`payment_facts`**

- charge/payment identity, obligation/cycle link;
- authorized, paid, failed, refunded, disputed, recovered, payout/available;
- gross, fee, tax, refund, dispute, net e currency como componentes explícitos;
- provider effective time, observed time, settlement time;
- links para correção/reversal, sem apagar o original.

**`contract_cycle_facts`**

- um ciclo/versionamento por período devido;
- scheduled amount, due date, service period, status e source;
- permite distinguir renovação automática, compra manual e extensão antecipada.

**`commission_facts`**

- attribution version, earning, reversal e payment;
- base, percentual, moeda, valor devido/pago, cycle/payment link;
- correções append-only.

### 4.3 Reconciliação, cobertura e frescor

Por provedor e dia/intervalo, persistir:

- watermark de eventos e movimentos consultados;
- menor/maior `effective_at`, última coleta concluída e `observed_at`;
- contagem e soma na origem versus fatos internos;
- ids ausentes, duplicados, não tratados e fora de ordem;
- moeda/tipo não suportados;
- estado `complete`, `partial`, `stale`, `failed` ou `not_collected`;
- janela sujeita a atraso/reabertura.

Eventos atrasados devem entrar com `effective_at` original e `observed_at` real. Snapshots afetados são reconstruídos a partir dos fatos. Evento fora de ordem não deve simplesmente desaparecer: registrar a observação e deixar o projetor decidir a versão efetiva.

### 4.4 Snapshots derivados

Gerar snapshots diários e mensais versionados por `as_of`, `computed_at`, versão da fórmula e cobertura. Todo snapshot deve ser descartável e reconstruível. Nunca corrigir o snapshot manualmente; corrigir/adicionar fatos e recomputar.

## 5. Métricas gerenciais propostas

Todas as métricas de MRR usam obrigação recorrente automática ativa no instante. Compras manuais pré-pagas aparecem em “receita pré-paga/renovação manual”, fora de MRR contratual.

Para uma janela `[t0, t1)`:

- **MRR inicial**: soma do MRR contratual por logo em `t0`.
- **MRR final**: soma do MRR contratual por logo imediatamente antes de `t1`.
- **New MRR**: MRR em `t1` de logos cujo primeiro MRR pago começou na janela.
- **Expansion MRR**: soma dos aumentos positivos em logos presentes antes da expansão.
- **Contraction MRR**: magnitude das reduções sem chegar a zero.
- **Reactivation MRR**: MRR de logos que voltaram após intervalo real com MRR zero.
- **Churned MRR**: MRR imediatamente anterior de logos que chegaram a zero por saída.

Invariante:

```text
MRR_final = MRR_inicial + New + Expansion + Reactivation
            - Contraction - Churned + Correções_explicitadas
```

- **Gross Revenue Churn**: `(Churned MRR + Contraction MRR) / MRR inicial elegível`.
- **NRR**: `(MRR inicial + Expansion + Reactivation - Contraction - Churned) / MRR inicial`.
- **Logo churn**: logos recorrentes ativos em `t0` que chegam a zero por churn / logos recorrentes ativos em `t0`, com regra explícita de reativação na mesma janela.
- **Clientes pagantes novos**: logos com primeiro pagamento liquidado positivo na janela; separar recorrente e manual.
- **Receita recebida bruta**: soma de pagamentos liquidados positivos por moeda, excluindo payout e sem compensar refund.
- **Receita líquida após refunds e taxas**: charges + ajustes econômicos - refunds - disputes - fees, por moeda e settlement, com cobertura completa.
- **Inadimplência aberta comprovada**: saldo vencido e não liquidado de ciclos contratuais recorrentes, na data de corte; não incluir checkout manual abandonado como dívida.
- **Recuperação**: valor/obrigação vencida que posteriormente foi liquidada; reportar valor, logos e aging.
- **ARPU**: MRR final / logos pagantes recorrentes no mesmo instante; somente com MRR contratual coberto.
- **LTV**: indisponível até haver cohorts maduros, churn confiável e margem/contribuição por cohort. Quando houver, preferir LTV de margem observada por cohort; fórmula simplificada apenas como cenário rotulado.

Regras de denominador:

- logo é pessoa/conta deduplicada, não linha de assinatura;
- excluir free/grants do denominador pagante;
- segregar moeda ou converter com taxa versionada e data explícita;
- comparar períodos de igual duração e mesma maturidade;
- não comparar mês corrente parcial com mês completo sem normalização visível.

## 6. Proposta visual e gerencial

### 6.1 Cabeçalho persistente

- período e timezone;
- `as of` por fonte;
- cobertura Stripe, Asaas e fatos internos;
- estado global: `complete`, `partial`, `unavailable`, `not_collected`;
- aviso de mês parcial e comparação utilizada.

### 6.2 Hierarquia da aba

```text
Financeiro
├── Saúde recorrente
│   ├── MRR final | NRR | Gross Revenue Churn | logos pagantes
│   └── waterfall: inicial + new + expansion + reactivation - contraction - churn
├── Caixa
│   ├── recebido bruto | refunds | disputes | taxas | líquido
│   └── tendência por provider/moeda/meio
├── Cobrança e recuperação
│   ├── inadimplência aberta por aging
│   ├── recuperado no período
│   └── manuais vencendo / pagamentos pending (fora de dívida contratual)
├── Planos e canais
│   ├── mensal/semestral/anual; auto/manual/free/grant
│   └── Stripe/Asaas; card/Pix/boleto; cupom/afiliado
└── Qualidade dos dados
    ├── cobertura, frescor, eventos atrasados/não tratados
    └── reconciliação e limitações
```

### 6.3 KPIs e interação

- Cards mostram valor, delta absoluto, delta percentual, denominador, período comparado e badge de cobertura.
- Waterfall é a explicação principal da variação de MRR; total sem decomposição não é acionável.
- Filtros: plano/versionamento, provider, meio, moeda, auto/manual e canal de atribuição.
- Drill-down usa ids internos pseudonimizados, faixa de valor, plano, provider, estado e datas; sem nome, email, documento ou external id concreto.
- `partial`: valor conhecido acompanhado de cobertura e parcela desconhecida, nunca tratado como total.
- `unavailable`: fatos existem mas consulta/projeção falhou.
- `not_collected`: o fato nunca foi coletado.
- desconhecido é `null` + motivo; nunca zero.
- períodos incompletos têm comparação “até o mesmo dia/hora” ou comparação desabilitada.

## 7. Leituras reais

**Medição bloqueada.** No clone isolado não estavam configuradas `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `STRIPE_SECRET_KEY` ou `ASAAS_API_KEY`. Nenhuma consulta foi executada e nenhum arquivo `.env` real existia, apenas `.env.example`.

O SQL separado é agregado, sem PII ou external ids, inicia uma transação `READ ONLY`, define timeout e não chama providers. Ele deve ser executado apenas por operador autorizado e seu resultado precisa registrar instante, ambiente e cobertura.

Não reutilizar medições antigas citadas em comentários como estado atual. Elas são evidência histórica do defeito, não fotografia de 2026-09-14.

## 8. Plano ADM-004-P1 em etapas pequenas

### P1.1 — contrato semântico e estados de ausência

- congelar glossário, fórmulas, timezone, moeda e denominadores;
- adicionar tipos de resposta com `value`, `status`, `asOf`, `coverage`, `source` e `limitations`;
- renomear o MRR atual para “run-rate de catálogo” antes de criar MRR contratual;
- testes de contrato para impedir zero em unknown.

### P1.2 — cobertura e reconciliação sem mudar métricas

- criar fatos/watermarks de ingestão versionados;
- medir Stripe/Asaas por intervalo, tipo e moeda;
- expor frescor, skipped/unhandled e divergências;
- nenhum backfill automático; plano e aprovação separados.

### P1.3 — fatos de obrigação e ciclo

- schema append-only de eventos, obrigações, ciclos e correções;
- projetores idempotentes com eventos fora de ordem;
- dual-write observável, sem trocar leitores;
- testes por cenários: trial, cancel agendado, pause, desconto, upgrade/downgrade, manual e recuperação.

### P1.4 — reconstrução e validação histórica

- ferramenta dry-run agregada;
- relatório de cobertura por período/provedor;
- backfill somente em fase explicitamente autorizada, com rollback lógico e sem sobrescrever fatos;
- reconciliar somas e amostras sem PII.

### P1.5 — métricas recorrentes

- MRR inicial/final e waterfall;
- logo churn, revenue churn e NRR;
- separar auto recorrente de pré-pago manual;
- snapshots reconstruíveis com versão da fórmula.

### P1.6 — caixa consolidado

- incorporar settlements externos sem dupla contagem;
- separar refund, dispute, fee, tax, payout e moeda;
- reconciliar recebido bruto/líquido por provedor.

### P1.7 — UI em rollout

- primeiro qualidade/cobertura e rótulos honestos;
- depois caixa;
- por último recorrência contratual, habilitada somente onde cobertura for suficiente;
- manter aba antiga lado a lado até reconciliação aceita.

### P1.8 — LTV e cohorts

- somente após maturidade mínima e validação de churn/MRR;
- margem por cohort, retenção por plano/canal e intervalos de confiança;
- nenhum LTV quando o dado não sustentar a conclusão.

## 9. Riscos de decisão atuais

1. Alterar preço de catálogo muda o “MRR” de toda a base sem nenhum contrato mudar.
2. Tratar pré-pago manual como recorrente superestima receita comprometida.
3. Usar `created_at` como nova venda mistura checkout, pending e renovação manual.
4. Usar status atual para denominador histórico produz churn plausível, porém não comprovado.
5. LTV atual amplifica duas aproximações e pode orientar CAC incorretamente.
6. Caixa pode omitir ledger Asaas que falhou e devolução externa.
7. Somar moedas e formatar como BRL pode produzir total sem significado.
8. Contadores de afiliado e telemetria best-effort podem divergir sem reconciliação.
9. Snapshot diário preserva o resultado da fórmula antiga, não os fatos para corrigi-la.
10. Ausência de cobertura/frescor visível faz um parcial parecer completo.

## 10. Critérios de aceite para chamar uma métrica de confiável

- definição, unidade, moeda, timezone e janela versionados;
- numerador e denominador reproduzíveis a partir de fatos imutáveis;
- cobertura e frescor no payload e na tela;
- reconciliação fechada ou diferença explicitada;
- late events e correções reprocessáveis;
- testes de invariantes e casos de borda;
- `unknown != 0` em banco, API e UI;
- segregação de free/grants/manual/recorrente;
- sem PII no drill-down gerencial;
- owner operacional e runbook para divergência.

## 11. Prompt da primeira implementação

O prompt copiável está em `2026-09-14-adm-004-p1-prompt.md`. A primeira fatia recomendada é P1.1: contrato semântico, estados de qualidade e rótulo honesto do número atual, sem migration e sem tentar inventar MRR contratual.

## Estado final desta fase

- Auditoria estática concluída na base declarada.
- Nenhum código de produção alterado.
- Nenhuma migration, backfill, sync, replay ou chamada operacional a Stripe/Asaas.
- Nenhum dado lido ou alterado.
- Nenhum commit, push, PR, merge ou deploy.
