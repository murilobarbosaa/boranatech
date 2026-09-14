# ADM-004-P1.1-R1 — suplemento de consistência financeira

Data da revisão: 2026-09-14. Base: `39fa5eeb60599efa655ac8fd4256b3e2db088a83`. Escopo: análise estática e fixtures exclusivamente sintéticas. Nenhum banco ou provedor foi consultado.

## Resultado executivo

A R1 confirmou quatro defeitos na P1.1 e os corrigiu sem criar fatos financeiros novos:

1. O contador da aba Financeiro podia divergir da ADM-001: usava a identidade da balance transaction Stripe e exigia fee, net e moeda; a ADM-001 usa `stripe_charge_id` e só exige charge, valor bruto positivo e instante. O contador global agora reutiliza `classifyRegisteredPayments` e é independente da elegibilidade do movimento para subtotais monetários.
2. `plans!inner` ocultava acessos cujo plano estivesse ausente. A relação deixou de ser inner; plano ausente/legado chega ao classificador e é excluído apenas do valor de catálogo, com diagnóstico.
3. Duas subscriptions atuais da mesma pessoa eram contadas e precificadas duas vezes. Sem precedência temporal/contratual comprovada, a pessoa agora é marcada conflitante e todas as suas linhas ficam fora das modalidades e do catálogo.
4. Uma consulta local bem-sucedida sem linhas era confundida com fonte `not_collected`. Agora ela é `partial`, com zero apenas nos contadores diagnósticos, nenhuma moeda/card monetário e mensagem própria. Falha da fonte continua sendo erro controlado, não lista vazia.

Também foram fechadas validações de tamanho do payload, coerência entre período civil e instantes, cobertura exata das séries, reconciliação série/subtotal e preservação do cache anterior em refresh malsucedido. A área de retenção deixou de chamar ausência recente de login de churn.

## R1-A — consistência com ADM-001

O resultado comprovado é:

- Charge elegível: `type = charge`, provedor `stripe|asaas`, `gross_cents` inteiro seguro e positivo, `occurred_at` válido e não posterior ao corte. `finance_transactions` não possui coluna `status`; portanto não há status transacional aceito ou rejeitado por nenhum dos dois leitores.
- Identidade: Stripe `stripe:charge:<stripe_charge_id>`; Asaas `asaas:payment:<provider_transaction_id>`.
- Duplicata: uma identidade canônica vira um pagamento. Divergência de bruto ou instante exclui a identidade inteira. Offset textual equivalente é normalizado para o mesmo instante.
- Usuário: ausência não exclui o pagamento. Um único usuário conhecido enriquece duplicata nula; usuários conhecidos divergentes anulam a atribuição sem apagar o fato econômico. Plano segue a mesma regra de enriquecimento/conflito.
- Provedor: faz parte do namespace da identidade; não há fusão Stripe × Asaas.
- Moeda: ADM-001 não a usa. ADM-004 normaliza para ISO alpha-3 maiúscula somente para agregação monetária; moeda ausente/inválida impede o subtotal, mas não apaga um pagamento elegível ADM-001.
- Data: ambos usam `Date.parse` e ISO canônico para identidade temporal; o período financeiro aplica início inclusivo e fim exclusivo depois da classificação.

Não foi criado um segundo classificador: `honestFinance` reutiliza `classifyRegisteredPayments`. `cash.registeredPayments` é o total equivalente da Visão. Teste de reconciliação cobre duplicata Stripe com balance transaction diferente, fee/moeda inválidos, linha sem usuário e refund inelegível.

## R1-B — escritores e sinais monetários

| Escritor/origem                      | Tipos                                              | Identidade/idempotência                                                                                                       | bruto/taxa/líquido e sinal                                                                                                                                                                                            |
| ------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/lib/stripeSync.ts`           | charge, refund, adjustment, dispute e payout       | `stripe_balance_transaction_id`; upsert pelo id Stripe; `provider_transaction_id = bt.id`; charge preserva `stripe_charge_id` | Copia sem normalização `bt.amount`, `bt.fee`, `bt.net` e moeda do balance transaction. A migration documenta bruto negativo em refund/dispute e líquido como bruto menos taxa. Payout não entra nos indicadores P1.1. |
| `server/lib/asaasLedger.ts` + writer | charge                                             | `(asaas, payment.id)`, insert idempotente com `ignoreDuplicates`                                                              | bruto=`value`; líquido=`netValue`; taxa=`gross-net`. Valores precisam existir; BRL fixo.                                                                                                                              |
| mesmos arquivos Asaas                | refund                                             | `(asaas, event.id)`; a cobrança mantém `(asaas, payment.id)`                                                                  | bruto e líquido=`-value`; taxa=0 porque o escritor não prova devolução da taxa.                                                                                                                                       |
| migration inicial/legado             | linhas Stripe anteriores à expansão multi-provedor | backfill de `provider_transaction_id` com o id da balance transaction; índice único antigo permanece                          | O schema nasceu para cópia dos balance transactions Stripe. Não foi encontrado escritor manual de `finance_transactions`.                                                                                             |

Não há escritor Asaas de adjustment/dispute nem escritor manual/legado alternativo na aplicação. Não há coluna `status`. Linhas de provider/tipo fora da matriz são excluídas. Null, inteiro inseguro, moeda inválida, instante inválido e identidade ausente são diagnosticados e não entram em subtotal.

Atualizar uma charge Stripe reencontra o mesmo id da balance transaction; repetir evento Asaas reencontra a chave do provedor. Refund é movimento próprio e não duplica a charge: seu líquido negativo representa o efeito posterior. Adjustment e dispute Stripe usam o líquido já produzido pelo balance transaction. A aba não recompõe `gross-fee`, evitando cobrar a taxa duas vezes; soma `net_cents` apenas nas combinações de escritor reconhecidas.

Lacuna residual: não há reconciliação externa nem snapshot, e a identidade de refund Asaas é a identidade do evento. Eventos semanticamente duplicados com ids distintos não podem ser provados equivalentes localmente. Por isso todos os indicadores de caixa permanecem `partial` e “taxa” não é chamada de custo contábil.

## R1-C — invariantes locais

Fixtures por moeda provam:

- entradas = soma de bruto apenas de charges positivas canônicas;
- refunds/disputes/adjustments nunca entram em entradas;
- reembolso exibido = `abs(gross_cents)` apenas de refund aceito;
- taxa = soma assinada do campo persistido, rotulada “taxa registrada”, não custo;
- líquido = soma de `net_cents` das linhas reconhecidas e integralmente válidas;
- qualquer linha excluída fica fora de todos os subtotais;
- não existe agregado multimoeda;
- cada subtotal reconcilia exatamente com sua série diária;
- centavos são inteiros seguros; não existe aritmética monetária em float;
- fonte indisponível gera erro; intervalo vazio com fonte disponível gera bloco vazio sem card monetário. Desconhecido continua `null`, nunca zero.

Fórmulas finais, sempre por moeda:

- entradas registradas = `Σ gross_cents` onde tipo=charge e bruto>0;
- reembolsos registrados = `Σ abs(gross_cents)` onde tipo=refund e bruto<0;
- taxas registradas = `Σ fee_cents` dos movimentos reconhecidos aceitos;
- líquido calculável registrado = `Σ net_cents` dos movimentos reconhecidos aceitos;
- pagamentos registrados = cardinalidade do classificador ADM-001 na janela, sem requisito de moeda/fee/net;
- pessoas identificadas = `count(distinct user_id)` dos pagamentos canônicos; sem pessoa inclui null e conflito de atribuição.

Todos são parciais: medem somente o ledger local observado.

## R1-D — acessos e catálogo

- Automático: uma pessoa sem conflito, `status=active`, não expirada, `renewal_type=auto`.
- Manual pré-pago: mesma condição com `renewal_type=manual`; fica sempre fora da recorrência automática.
- Trial: uma pessoa sem conflito, `status=trialing`, não expirada; não recebe valor de catálogo e não é cliente pagante.
- Expiração: `current_period_end <= computedAt` deixa de ser acesso atual; null significa fim não conhecido e mantém o estado parcial; valor inválido é não classificado.
- Cancelamento agendado: `cancel_at_period_end=true` continua acesso atual até o fim, é contado separadamente e nunca vira promessa de renovação.
- Mais de uma subscription atual com o mesmo `user_id`, inclusive provedores distintos, é conflito: nenhuma linha é escolhida e nenhum valor é somado. Sem `user_id`, linhas não podem ser deduplicadas entre pessoas e a limitação permanece explícita.
- Plano ausente/legado, moeda não BRL, intervalo desconhecido ou preço ausente exclui somente o valor de catálogo.
- Mensalização = preço vigente em centavos / meses do intervalo (1, 6 ou 12), somente quando a divisão é inteira. Não há arredondamento silencioso.

O rótulo permanece “valor mensal de catálogo dos acessos ativos”: não é contratado, recebido, MRR ou ARR. Manual aparece em bloco próprio e trial nunca contribui.

## R1-E — período, paginação e concorrência

A janela é `[from, toExclusive)` e representa somente dias civis completos de `America/Sao_Paulo`; presets produzem exposições equivalentes, custom limita a 366 dias e offsets equivalentes convergem ao mesmo instante. O contrato valida que os limites correspondem aos dias civis declarados e que cada série cobre exatamente a janela.

As duas consultas aplicam filtro no banco antes da paginação, selecionam apenas as colunas usadas, ordenam deterministicamente e usam `coletarTudoProvandoTotal`. Os testes existentes do paginador cobrem count ausente/inválido, count variável entre páginas, id repetido e aumento do count (inserção concorrente). A falha é explícita. Não existe snapshot transacional, portanto uma mutação que preserve count ainda é risco residual declarado. Não há N+1: ledger e acessos são duas leituras paralelas paginadas; preço vem de módulo local.

## R1-F — contrato, cache e erros

O contrato v1 é estrito e validado no servidor antes do cache, em cache hit e novamente no cliente. Rejeita versão/campo ausente, NaN, infinito, inteiro inseguro, data inválida, moeda inválida/repetida, valor sem moeda, métrica disponível sem valor, indisponível com valor, série repetida/desordenada/desalinhada/fora do período e subtotal divergente da série. Coleções são limitadas (366 pontos, 32 moedas, 8 grupos indisponíveis e limites para fontes/textos).

A chave contém somente versão e limites normalizados de uma janela máxima, logo tem cardinalidade previsível. Refresh é write-through: teste dedicado prova que falha de recomputação não chama SET nem remove o valor anterior; sucesso substitui depois do compute. Erro de consulta/contrato chega ao estado controlado do frontend. Não há polling; refresh depende de ação, fica desabilitado enquanto o request está em voo e ainda passa pelo rate limit global da API.

Moedas têm blocos independentes. Consulta vazia não cria bloco de moeda/card enganoso.

## R1-G — rotas e RBAC

Nenhuma rota foi adicionada, removida ou substituída. As duas rotas tocadas foram evoluídas no mesmo método+caminho:

| Antes                                 | Depois                                                                                            | capability     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| `GET /api/admin/finance/summary`      | mesmo caminho; payload honesto apenas com `contract=honest-v1`, legado preservado sem o parâmetro | `finance.read` |
| `GET /api/admin/finance/transactions` | mesmo caminho; filtros de período/moeda e paginação validada adicionados                          | `finance.read` |

Logo, o diff método+caminho é vazio e o manifesto continua com exatamente 128 rotas. O enumerador AST independente em `server/routes/adminRbacRoutes.test.ts` compara todas as rotas reais ao manifesto; o teste fechado e o teste focal das duas rotas confirmam cobertura. `ADMIN_RBAC_MODE` continua `observe`. Claims do cliente controlam apenas apresentação; autorização permanece em `requireAuth` + `requireAdmin` no servidor, antes do observador. Nenhum papel/admin_roles foi alterado.

## R1-H — interface e legado

A busca completa encontrou implementações históricas de MRR/churn/LTV em APIs internas (`billingMetrics`) ainda consumidas por fluxos legados da Visão e por rotinas; elas não foram apagadas sem prova de ausência de consumidores. A aba Financeiro atual consome exclusivamente `finance/summary?contract=honest-v1` e o extrato. O resumo legado ainda é usado pelo `ExpensesManager` somente para despesas por categoria.

Não há consumidor administrativo atual de `finance/sync` nem botão Stripe/Asaas na aba. A ação “Atualizar leitura local” só refaz consultas locais. O texto visível de catálogo não usa MRR. A área de uso/cancelamentos foi corrigida para não chamar falta de login de churn; ela declara que não mede logo churn ou churn de receita. As únicas ocorrências financeiras visíveis de MRR/ARR/NRR/LTV são a lista explícita de indicadores indisponíveis e a advertência “não serve para calcular”. Moeda acompanha todo valor; falha não vira zero.

## R1-I — segurança e desempenho

- `getHonestFinanceDashboard` usa apenas Supabase local e catálogo em código; nenhuma importação ou chamada Stripe/Asaas ocorre no request.
- O resumo não retorna user_id, email, nome, documento ou identificador externo. O drill-down não ganhou PII nem ids externos na interface e permanece atrás das guardas administrativas existentes.
- Período máximo: 366 dias completos. Série máxima: 366 pontos. Moedas e demais arrays têm limites runtime.
- Filtros são aplicados antes da paginação; não há leitura histórica integral nem N+1.
- Cache é versionado, chave limitada e TTL existente. Não há polling. Refresh concorrente entre réplicas ainda não possui lock anti-stampede; o rate limit global e o teto da janela limitam abuso, mas este é risco residual para P1.2.

## Diff incremental lógico da R1

- `server/lib/honestFinance.ts`: reconciliação ADM-001, identidade Stripe correta, vazio distinto de indisponível, conflitos de acesso, cancelamento agendado, plano ausente visível e mensalização inteira.
- `shared/adminFinance.ts`: novos diagnósticos/contadores e invariantes/limites runtime.
- `client/src/components/admin/FinanceDashboard.tsx`: contador global reconciliado, estado vazio, conflitos/cancelamentos.
- `client/src/pages/Admin.tsx` e `UsageRetentionDashboard.tsx`: nomenclatura de uso sem alegação de churn.
- testes de financeiro, contrato, interface e cache: fixtures e barreiras da R1.
- exemplo sintético e matriz: contrato/fórmulas atualizados.

## Limitações e riscos residuais

Sem fatos imutáveis de obrigação/ciclo, MRR contratual, ARR, movimentos de MRR, NRR, churn de receita, logo churn e LTV continuam indisponíveis. Sem reconciliação externa não há prova de cobertura integral, reembolso externo ausente não é inferido e frescor mede somente criação/atualização local. Paginação não é snapshot. Subscriptions sem user_id não permitem deduplicação por pessoa. Refund Asaas com ids de evento logicamente distintos não é reconciliável. O refresh não possui lock distribuído anti-stampede. Nada disso é apresentado como zero ou fato confiável.

Não houve migration, backfill, sync, replay, acesso a dados reais, chamada operacional a provedor, enforcement, commit, push, PR, merge ou deploy.

## Validação final

- Focal financeira/integração/RBAC: 16 arquivos, 298 testes aprovados, 0 falhos, 0 skipped.
- Regressão completa: 448 arquivos aprovados e 5 skipped; 5.938 testes aprovados e 18 skipped; 0 falhos. Skipped: `adminAuthUsersRpc.pg` (7), `projectAutoChecks.integration` (1), `adminTasks.rebalance` (5), `sentryTaskDedup.pg` (3) e `sentryTaskIntake.pg` (2). Nenhum foi contabilizado como aprovado.
- TypeScript principal, geradores/checks do `pnpm check` e TypeScript de scripts: aprovados.
- Prettier dos arquivos da tarefa e `git diff --check`: aprovados.
- Visual sintético, sem dados reais: Chromium em 1440×1000 e 390×844, sem overflow horizontal, sem alertas do componente e com a hierarquia esperada. Capturas fora do repositório: `/tmp/adm004-r1-desktop.png` e `/tmp/adm004-r1-mobile.png`. O harness temporário foi removido.
- Bloqueados: nenhum teste iniciado ficou bloqueado. Os 18 casos declarados skipped exigem os ambientes de integração nomeados acima.
