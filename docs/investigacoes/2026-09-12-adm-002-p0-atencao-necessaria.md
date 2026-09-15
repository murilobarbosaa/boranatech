# ADM-002-P0 — investigação do painel “Atenção necessária”

Data da inspeção: 2026-09-12 (America/Sao_Paulo)<br>
Natureza: investigação técnica e de produto, somente leitura<br>
Decisão: não implementar nesta rodada

## Resumo executivo

ADM-03 está confirmado: o botão principal muda apenas para uma seção genérica do admin. Nenhum item carrega um identificador contextual na URL; a tela de usuários não lê um usuário da URL e só abre o detalhe após clique numa linha. O operador perde o contexto que originou o alerta.

ADM-04 também está confirmado, com alcances diferentes:

- `assinatura_past_due` prova somente que o estado local atual da assinatura é `past_due`. O texto afirma nova tentativa e cancelamento automático sem ler invoice, `next_payment_attempt`, política de cobrança ou obrigação aberta; o valor exibido é preço atual de catálogo, não saldo vencido.
- `cobrancas_falhadas` conta Charges históricos com `status=failed` diretamente na Stripe e soma os valores tentados. Não reconcilia tentativas do mesmo invoice/PaymentIntent, recuperação posterior ou saldo ainda aberto. “Cartão recusado é o motivo mais comum” é texto fixo, não uma medição.
- Asaas não possui alerta equivalente de tentativa falhada: Pix pendente nasce antes do recebimento, `PAYMENT_OVERDUE` encerra a pendência, e recebimento confirmado é escriturado separadamente. Não há dunning automático demonstrado nesse caminho.

O painel contém nove famílias. Duas são bons sinais operacionais locais, mas ainda sem navegação contextual (`pagamento_orfao`, `assinaturas_vencendo`); três são úteis como informação com rótulo mais restrito (`saida_agendada`, `custo_ia_spike`, `payout_falho`); quatro fazem afirmações acima do fato disponível (`assinatura_past_due`, `cobrancas_falhadas`, `influencer_com_assinatura`, partes de `assinaturas_vencendo`). A primeira fase recomendada é somente leitura, sem migration e sem chamadas a provedores na requisição: retirar ou degradar as afirmações não reconciliáveis, usar estados locais honestos, adicionar destinos internos contextualizados e revelar cobertura/frescor.

Não foi possível medir a situação atual: uma única tentativa agregada e sem PII ao PostgREST falhou por conectividade de rede. Nenhum número de fixture, comentário histórico ou relatório anterior é apresentado como dado atual.

## 1. Versões e trabalho concorrente

### Checkout original preservado

| Item                | Valor observado                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Checkout            | `/home/s0ft/boranatech`                                                                                                |
| Branch              | `fix/openai-cota-credencial`                                                                                           |
| HEAD                | `a3e37d2a2f3e8fd19e0a9d51653cd27c29fba96f`                                                                             |
| Upstream            | `origin/fix/openai-cota-credencial`                                                                                    |
| `main` local        | `398350893da70b838045fb4d74e7ad89fc10c8dd`                                                                             |
| `origin/main` local | `398350893da70b838045fb4d74e7ad89fc10c8dd`                                                                             |
| Estado              | sujo antes da investigação, com alterações da pessoa usuária; não tocado, salvo os dois entregáveis novos desta rodada |

O comportamento atual foi inspecionado na árvore limpa `/home/s0ft/bnt-main`, branch `main`, HEAD `398350893da70b838045fb4d74e7ad89fc10c8dd`. Não houve `fetch`: esta investigação registra a referência remota local disponível, sem afirmar que é o estado presente no servidor.

### Branch `feat/admin-attention-v3`

| Item                 | Evidência                                                                      |
| -------------------- | ------------------------------------------------------------------------------ |
| Worktree             | `/home/s0ft/bnt-atencao`, limpo                                                |
| HEAD                 | `7704526f000282ea1749044faf85026500f17cef`                                     |
| Upstream             | `origin/feat/admin-attention-v3` em `71d28f7761f59a938f22d50d3d8e34ea0c3ead2e` |
| Merge-base com main  | `1f766b2255939753cefd222cc2628b924e92210a`                                     |
| Autoria disponível   | Murilo Barbosa, conforme autor/committer dos commits Git                       |
| Conteúdo único atual | nenhum: a árvore de `7704526` é igual à do segundo pai/base                    |

O commit remoto `71d28f7` (“add user identity to attention items and accent visible copy”) alterava apenas `server/lib/atencaoNecessaria.ts` e seu teste (+220/−51). Ele já pertence à ancestralidade da main, que recebeu alterações adicionais nesses arquivos. O HEAD local `7704526` é um merge de sincronização; a main está 236 commits à frente do merge-base e o diff de conteúdo `main...HEAD` é vazio.

**Decisão:** branch obsoleta e não reutilizável como unidade de portabilidade. O problema e os testes históricos podem servir como documentação, mas qualquer ADM-002 deve partir da main atual. Não rebasear nem reaplicar essa branch.

### Sobreposição com ADM-001

A ADM-001 limpa está em `/tmp/boranatech-adm001-integracao-local`, branch `fix/adm-001-visao-pagamentos-v3`, HEAD `1ac2ce35c398009805cfad1780f7aa185080a9e2`, um commit sobre `3983508`. Ela toca 17 arquivos, entre eles:

- `client/src/pages/Admin.tsx`: tipos/estado/efeito e composição das séries da Visão;
- `server/routes/admin.ts`: contrato/cache/handler de `/overview-series`, imediatamente antes de `/attention`.

Ela não altera `atencaoNecessaria.ts` nem `AttentionPanel.tsx` e não muda diretamente o contrato `/attention`. Há, porém, sobreposição textual nos dois arquivos acima e proximidade de hunks no servidor; integrar ADM-002 antes de ADM-001 exigiria revisar manualmente esses trechos. A fase proposta abaixo deve ser construída depois da ADM-001 ou portada conscientemente sobre ela. A regra da ADM-001 — caixa registrado não é estado de assinatura nem entrega de webhook — deve governar os novos rótulos.

## 2. Fluxo efetivamente usado

```text
Admin/Visão
  └─ Admin.tsx monta uma vez e chama GET /admin/attention
      └─ requireAuth + requireAdmin (booleano, sem papéis)
          └─ cache Redis admincache:attention:v2, TTL 60 s
              └─ montarPainelDeAtencao()
                  ├─ Supabase: subscriptions, profiles, cancellation reasons
                  ├─ Supabase: billing_orphan_payments
                  ├─ Supabase: ai_usage_logs, expenses, influencers
                  ├─ Stripe ao vivo: Charges failed, Payouts failed
                  └─ Stripe ao vivo N+1: retrieve de cada orphan sub_...
      └─ {data, computedAt}; cliente descarta computedAt
          └─ AttentionPanel agrupa por tipo
              ├─ “Resolver no admin” → seção genérica
              └─ “Abrir na Stripe” → objeto quando disponível, senão lista genérica
```

Evidências principais: `server/routes/admin.ts:161-164,1609-1647`; `server/lib/atencaoNecessaria.ts:274-349,502-1018`; `client/src/pages/Admin.tsx:440-453,6489-6491,6593-6623,7932-7946`; `client/src/components/admin/overview/AttentionPanel.tsx`; `client/src/components/admin/users/UsersDashboard.tsx:11-52,145-223`.

## 3. Inventário completo dos alertas

| Tipo e texto                                                                         | Condição/fonte real                                                                                             | Tempo, paginação e duplicidade                                                                                   | Valor real                                                     | Clique/destino                                            | Classificação                                                      |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------ |
| `assinatura_past_due` — “Pagamento em atraso”; Stripe tentando novamente e cancelará | linha local `subscriptions.status='past_due'`; perfil só enriquece e-mail                                       | estado atual local, sem idade da falha; subscriptions paginadas por OFFSET/id; não lê invoice                    | preço atual do catálogo e equivalente mensal, não saldo devido | usuários genérico; Stripe específica só se houver `sub_`  | **enganoso**: sinal útil, texto/peso não provados                  |
| `saida_agendada` — acesso termina na data                                            | `cancel_at_period_end=true`; motivo `subscription_cancellations.status=scheduled`                               | estado atual; motivo sem paginação; fim formatado em Brasília                                                    | catálogo atual, não pagamento/receita perdida                  | usuários genérico; `sub_` específica quando presente      | **informativo**; ação contextual ausente                           |
| `cobrancas_falhadas` — N falhas, “R$ que não entraram”, cartão mais comum            | Stripe `charges.list`, depois `status=failed`                                                                   | 7×24h, paginação SDK; cada Charge conta, sem dedupe por invoice/PI e sem recuperação                             | soma de valores tentados, não dívida/saldo                     | financeiro genérico e lista Stripe filtrada               | **enganoso/sem fonte suficiente** para dívida                      |
| `pagamento_orfao` — pagamento sem assinatura local                                   | `billing_orphan_payments.resolved_at IS NULL`, somente com expected subscription id; retrieve Stripe por `sub_` | consulta local sem paginação; N+1 Stripe; falha externa mantém item; exclui órfão de charge sem expected id      | valor nominal salvo pelo detector                              | financeiro genérico; `sub_` específica, `cs_` lista geral | **acionável, porém incompleto**                                    |
| `custo_ia_spike` — custo acima do normal hoje                                        | `ai_usage_logs`: hoje ≥ US$0,50 e >3× mediana dos 14 dias civis anteriores                                      | Brasília; hoje parcial vs dias completos; OFFSET/id; consulta tem limite inferior, sem limite superior explícito | soma estimada em USD                                           | aba IA genérica                                           | **informativo**; drilldown ausente                                 |
| `payout_falho` — repasse falhou/dinheiro retido                                      | Stripe `payouts.list(status=failed)`                                                                            | 14×24h; paginação SDK; histórico que sai pela janela, não resolução                                              | valor do payout, não receita perdida                           | financeiro genérico e lista Stripe de payouts             | **informativo/acionável**, justificativa atual excede o fato local |
| `mes_sem_despesa` — nenhuma despesa no mês anterior                                  | inexistência de linha em `expenses` entre datas civis do mês                                                    | limite 1 correto para existência; Brasília; muda por lançamento/virada do mês                                    | sem valor                                                      | financeiro genérico                                       | **acionável**, se a política exige fechamento mensal               |
| `influencer_com_assinatura` — “assinatura paga vigente”                              | grant ativo + subscription `active` **ou `trialing`**, período não expirado                                     | influencers sem paginação; subscriptions OFFSET/user_id; dedupe por pessoa                                       | nenhum                                                         | usuários genérico                                         | **enganoso**: trial/estado de acesso não prova pagamento           |
| `assinaturas_vencendo` — manual vence em 7 dias, lembrete já saiu                    | subscription active/manual, fim em 7×24h e nenhuma pending recente pelo mesmo usuário                           | pending associado por usuário e timestamp textual; OFFSET/id; não lê marcador nem fila de e-mail                 | soma mensal de catálogo; ausentes viram 0 dentro do agregado   | usuários genérico                                         | **acionável no vencimento; enganoso no lembrete/meio/total**       |

### Falhas transversais

- `coletarTudo` usa páginas de 1.000, OFFSET e termina na página vazia; não pede total, não detecta ID repetido ou mutação concorrente e não oferece snapshot transacional.
- `profiles`, `subscription_cancellations`, `influencers` e órfãos são leituras não paginadas; o limite padrão do PostgREST pode truncar silenciosamente.
- o servidor mantém cache por 60 segundos, mas o cliente busca apenas na montagem. `computedAt` é retornado e descartado. Uma aba aberta pode ficar desatualizada indefinidamente.
- não há validação runtime do payload no cliente. `data` ausente vira `null` sem erro e o painel não renderiza nada; fonte parcialmente indisponível é corretamente separada do estado “Tudo em ordem”.
- o painel coloca PII no texto do payload para construir os cards. A fase seguinte deve preferir rótulo mínimo e identificador opaco contextual, sem propagar payload bruto de provedor.
- os links externos são limitados a `https://dashboard.stripe.com`, mas quase todos os internos são `/admin?section=usuarios|financeiro|ia`.

## 4. Escritores e semântica de cobrança

### Stripe

`billing_events` é escrito em `server/providers/stripe.ts` por upsert do ID do evento. Guarda tipo, instante do provedor, vínculos disponíveis, payload do evento e `processed_at`. Ele deduplica **entrega de webhook**, não tentativa, invoice, obrigação ou pagamento. O handler atual processa `invoice.payment_failed`, `invoice.paid`, checkout, assinatura, charge paga/reembolsada/disputada; não persiste `charge.failed` ou `payment_intent.payment_failed` como uma entidade operacional normalizada.

`invoice.payment_failed` altera `subscriptions.status` para `past_due`. `invoice.paid` e eventos posteriores voltam a aplicar o estado da assinatura. `subscriptions.raw_provider_payload` é um snapshot substituído pelo evento mais recente, não histórico de invoices. `finance_transactions` é preenchida pela sincronização de balance transactions para charge/refund/dispute/payout: comprova movimento de caixa registrado, não tentativa falhada.

Não existem tabelas locais normalizadas atuais de invoice, PaymentIntent ou Charge. O payload bruto de `billing_events` pode preservar campos do evento da invoice, mas sua presença/cobertura histórica e correspondência à invoice atual não foram medidas; varrer payloads não é contrato aceitável para o painel. `billing_failed_payments` aparece nos tipos e numa branch não integrada, mas a main inspecionada não contém migration nem escritor ativo. Uma tabela nomeada sem escritor/cobertura demonstrados não é fonte disponível.

### Asaas

Pix é cobrança avulsa. Uma subscription `pending` nasce antes do pagamento. Eventos `PAYMENT_RECEIVED`/`PAYMENT_CONFIRMED` ativam o acesso e geram ledger; `PAYMENT_OVERDUE`/exclusão fecham a pendência. `billing_events` preserva entrega/processamento e `finance_transactions` preserva recebimento. O código atual não demonstra tentativa automática de cartão/dunning no Asaas. O painel não tem card Asaas de falha/atraso e não deve inferi-lo a partir de `pending`.

### Matriz de fatos

| Conceito                          | Fonte local disponível                                          | Confiabilidade/tempo                                      | Riscos e lacuna                                                                 |
| --------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| tentativa Stripe falhada          | evento bruto quando retido; hoje o card consulta Charge ao vivo | histórico do objeto/evento, não estado da obrigação       | sem tabela ativa, dedupe e cobertura; várias tentativas por invoice             |
| cobrança atualmente vencida       | `subscriptions.past_due` é proxy de estado de acesso            | último estado local, atualizado por webhook/reconciliação | sem amount remaining, invoice atual ou idade; pode estar stale                  |
| assinatura inadimplente           | `subscriptions.past_due`                                        | estado local atual                                        | não prova dívida monetária nem política aplicável                               |
| próxima tentativa automática      | possivelmente campo de invoice em payload histórico             | apenas evento no tempo                                    | não normalizado, pode mudar; não demonstrável no painel atual                   |
| pagamento definitivamente perdido | nenhuma fonte suficiente                                        | —                                                         | falha histórica, cancelamento e expiração de janela não provam incobrabilidade  |
| recuperação posterior             | `invoice.paid` e/ou charge positiva no ledger                   | eventos/caixa posteriores                                 | requer correlação pela mesma invoice/obrigação; subscription/user é aproximação |
| cancelamento após inadimplência   | eventos de assinatura + histórico de falha                      | possível sequência histórica                              | causa não necessariamente explícita; não inferir causalidade só pela ordem      |
| cobrança sem vínculos             | `billing_orphan_payments`, eventos/ledger com vínculos nulos    | fila persistida, mas detectores têm janela/cobertura      | card exclui família charge-only e faz N+1 ao provedor                           |
| valor potencialmente em risco     | invoice amount remaining seria o candidato                      | não normalizado hoje                                      | catálogo e soma de tentativas são substitutos incorretos                        |
| valor não recebido                | obrigação aberta reconciliada seria necessária                  | inexistente                                               | ausência no ledger não prova não recebimento fora da cobertura                  |

## 5. Afirmação atual × fato comprovado × correção

| Afirmação atual                         | Fato que o código comprova                      | Correção mínima verdadeira                                                                    |
| --------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| “Pagamento em atraso”                   | assinatura local em `past_due`                  | “Assinatura com estado local past_due” + idade/frescor quando disponível                      |
| “Stripe está tentando de novo”          | nenhum                                          | ocultar; mostrar próxima tentativa somente com invoice atual persistida                       |
| “assinatura cancela sozinha”            | nenhum para aquele contrato                     | remover; política é externa/configurável                                                      |
| “R$ X que não entraram”                 | soma de Charges falhados                        | “R$ X tentados em Charges falhados”, sem chamar de dívida; idealmente retirar até fonte local |
| “cartão recusado é o motivo mais comum” | nenhum agrupamento de motivo                    | remover ou computar a distribuição a partir de fonte persistida confiável                     |
| valor do past_due/saída = risco         | preço atual de catálogo                         | rotular “preço atual do plano”; não agregar como saldo vencido                                |
| “pagamento sem assinatura”              | detector persistiu um órfão de parte dos fluxos | “caso órfão detectado”; revelar cobertura e incluir charge-only na lista operacional          |
| “dinheiro retido na Stripe”             | Payout com status failed                        | “payout registrado como failed”; causa/saldo exigem fato próprio                              |
| “assinatura paga” do influencer         | active ou trialing local                        | “acesso por assinatura/trial”; pagamento exige charge positiva correlacionada                 |
| “lembrete já saiu”                      | nada lido pelo painel                           | remover; marcador prova enfileiramento, entrega exige estado da fila/provedor                 |
| meio não Pix = boleto                   | apenas comparação binária                       | Pix, boleto quando explicitamente igual, senão “não identificado”                             |
| botão “Resolver no admin”               | troca de seção                                  | “Abrir usuários/financeiro/IA” até existir destino contextual                                 |

## 6. Matriz de ações contextuais

| Ação                                      | Destino/ID necessário                                                  | Pré-condição e fallback                                               | Autorização                        | Natureza e auditoria                                                    |
| ----------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| abrir cliente                             | `/admin?section=usuarios&user=<id>`                                    | user_id local; sem ID, abrir filtro de “sem vínculo”                  | admin leitura; futuramente viewer+ | leitura; UsersDashboard deve validar param e abrir modal                |
| abrir assinatura local                    | detalhe do cliente, aba assinatura, `subscription.id`                  | ID local; fallback cliente                                            | admin leitura                      | leitura                                                                 |
| abrir invoice/PaymentIntent/Charge Stripe | deep link por ID validado e ambiente correto                           | ID persistido e prefixo esperado; fallback lista Stripe filtrada      | admin leitura, link externo        | leitura; não enviar segredo/payload                                     |
| abrir cobrança Asaas                      | console Asaas por payment ID validado                                  | payment ID persistido; fallback financeiro filtrado                   | admin leitura                      | leitura; não consultar Asaas no render                                  |
| filtrar financeiro                        | `/admin?section=financeiro&provider=...&type=...&user=...&payment=...` | parâmetros existentes e validados; fallback apenas filtros suportados | admin leitura                      | leitura; não reinterpretar ausência como zero                           |
| abrir órfão operacional                   | `/admin?section=financeiro&panel=orphans&orphan=<id>`                  | identidade local do órfão                                             | admin leitura                      | leitura; resolução futura requer owner/editor, idempotência e audit log |
| copiar contato                            | detalhe do cliente, gesto explícito                                    | perfil acessível; sem contato, indisponível                           | papel com acesso a PII             | leitura de PII auditável; não pôr e-mail na URL                         |
| mostrar próxima tentativa                 | campo normalizado da invoice + instante de captura                     | somente quando persistido e atual; fallback “não disponível”          | admin leitura                      | leitura; mostrar `observedAt`                                           |
| cobrar/retry/cancelar/reembolsar          | fora da fase 1                                                         | prova de suporte, idempotency key, dunning e obrigação                | somente após ADM-19, papel forte   | mutável, confirmação forte e trilha imutável obrigatórias               |

Não se recomenda “marcar como resolvido” sem fato persistente, regra de reabertura e auditoria. Também não se recomenda retry manual enquanto não houver coordenação idempotente com o dunning do provedor.

## 7. Avaliação de utilidade operacional

Hoje o painel não responde de modo consistente a “o que exige ação humana agora”. Ele mistura:

- estado atual de acesso (`subscriptions`);
- eventos históricos/tentativas (Stripe ao vivo e `billing_events`);
- movimentos de caixa (`finance_transactions`, apenas indiretamente nos detectores);
- qualidade operacional (órfãos, despesa ausente, spike de IA);
- intenções futuras (saída e vencimento).

Não há cálculo confiável de clientes afetados e dinheiro realmente em risco. A agregação por tipo soma valores de naturezas diferentes; alguns valores são preço de catálogo, outros tentativa, payout ou estimativa em USD. Idade, próxima tentativa e confirmação de resolução faltam. O card pode ser um bom inbox de estados locais, mas não é hoje uma fila de cobrança reconciliada.

## 8. Proposta ADM-002 em fases

### Fase 1 — pequena, verdadeira e somente leitura

1. Contrato `/attention` v3 discriminado por `kind`, com `observedAt`, `source`, `sourceState`, `subject` opaco, `occurredAt/stateUpdatedAt`, `amount {kind,currency,cents}` e ações tipadas. Valor ausente permanece ausente.
2. Manter: órfãos locais, saídas agendadas, vencimentos manuais, mês sem despesa e spike IA. Renomear os textos conforme a matriz. Dividir “past_due” como estado local, sem dívida/retry. Remover da resposta principal `cobrancas_falhadas` e payouts ao vivo até fonte local; nunca chamar ausência dessa fonte de zero.
3. Trocar botões por destinos contextuais internos: cliente, órfão, filtro financeiro e detalhe IA. Até o destino existir, rótulo honesto “Abrir seção”, não “Resolver”.
4. Para vencimentos: meio ternário, remover alegação de lembrete e não somar mensal desconhecido como zero. Para influencer: separar `trialing`; não dizer pago sem recebimento elegível.
5. Proibir acesso a Stripe/Asaas na requisição do painel. Consumir apenas fatos locais. Exibir “algumas fontes indisponíveis”, hora de cálculo e limites de cobertura.
6. Validar payload no cliente; erro/incompatibilidade deve ser estado controlado. Atualizar a atenção em intervalo explícito ou oferecer refresh somente leitura. Cache curto, versionado pelo contrato, apenas para sucesso; preservar `computedAt` e invalidar quando escritores locais relevantes concluírem.

Critérios de aceitação:

- cada rótulo é derivável de campo selecionado e escritor documentado;
- nenhuma pendência/tentativa vira dinheiro perdido ou pagamento;
- clicar abre o registro/filtro correto quando há ID e um fallback nomeado quando não há;
- ausência, falha e leitura parcial não viram “Tudo em ordem”/zero;
- sem N+1 nem provider call no request;
- leituras paginadas estáveis com detecção de total/IDs, declarando ausência de snapshot;
- testes de contrato, cache, autorização, link/param, payload inválido, truncagem, estados vazios/parciais e bordas de Brasília;
- regressão explícita para past_due recuperado, múltiplas tentativas, trial, meio desconhecido, órfão charge-only e aba aberta além do TTL.

### Fase 2 — normalização/reconciliação

Persistir uma projeção imutável e idempotente de obrigação/invoice, tentativa, status atual, próxima tentativa e vínculos; correlacionar falha e recuperação pela identidade da obrigação, não por pessoa. Medir cobertura e atraso de ingestão. Só então apresentar obrigação aberta, valor em risco e dunning. Migration/backfill precisam de plano de compatibilidade e classificação explícita de desconhecidos.

### Fase 3 — operações mutáveis

Depois da ADM-19, definir owner/editor/viewer, audit log, idempotência, confirmação e integração segura com o dunning. Ações possíveis são resolver vínculo órfão, retry/cancelamento/refund, mas nenhuma entra antes dessas garantias.

### Interação com ADM-001 e ADM-19

ADM-001 fornece o contrato de pagamentos registrados e evita usar assinatura como prova de caixa. ADM-002 deve reutilizar essa regra quando precisar provar recebimento, sem chamar posterior de renovação/reativação. Como `Admin.tsx` e `admin.ts` se sobrepõem, a implementação deve partir da ADM-001 integrada. ADM-19 bloqueia qualquer ampliação mutável: o middleware atual verifica apenas admin booleano, sem distinguir owner/editor/viewer.

## 9. Riscos priorizados

### P0

- dívida/recuperação/retry afirmados sem reconciliação por obrigação;
- botão primário perde contexto;
- chamadas Stripe ao vivo e N+1 dentro da renderização administrativa;
- todos os administradores compartilham a mesma capacidade, inclusive rotas mutáveis (ADM-19).

### P1

- valores de catálogo/tentativa apresentados como risco;
- cliente descarta frescor e não atualiza painel aberto;
- fontes locais não paginadas e coletor OFFSET sem garantia de snapshot;
- órfãos charge-only ausentes do resumo; trial tratado como pagante; lembrete e meio inventados.

### P2

- spike compara dia parcial com dias completos e tem limiar calibrado historicamente;
- agrupamento mistura unidades/semânticas e usa PII no texto;
- ausência de filtros e deep links para IA/financeiro.

## 10. Validação somente leitura

Comando focal:

```text
pnpm vitest run --configLoader runner \
  server/lib/atencaoNecessaria.test.ts \
  client/src/components/admin/overview/AttentionPanel.test.tsx \
  client/src/components/admin/users/UsersDashboard.test.tsx \
  server/routes/adminOverviewCache.test.ts
```

Resultado: 110 testes aprovados nos três arquivos diretamente ligados a serviço/painel/usuários (46 + 37 + 27). No arquivo agregado de rota/cache, 23 verificações sem socket passaram e quatro testes HTTP expiraram por `listen EPERM 127.0.0.1`; o comando terminou falho com 133 aprovados, 4 falhados e 4 erros não tratados. Esses quatro não são apresentados como teste aprovado nem como defeito de produto.

Foram também executadas inspeções Git (`status`, branch, refs, `merge-base`, logs, diffs e árvores), buscas estáticas de escritores/consumidores e uma tentativa de `HEAD` agregada com `count=exact`, `limit=0`, sem PII. A leitura externa retornou `aggregate_read=blocked_network` dentro do limite de cinco segundos. Nenhum endpoint de sync/retry foi chamado.

## 11. O que não pôde ser medido

- contagem atual de alerts, clientes, tentativas, recuperações, obrigações e valores;
- presença/cobertura real dos tipos de `billing_events` e campos dos payloads;
- atraso de webhook/sync e frescor real por provedor;
- quantas falhas pertencem à mesma invoice/PI ou foram recuperadas;
- quantos `past_due` estão resolvidos externamente mas stale localmente;
- cobertura histórica integral de Stripe/Asaas/ledger e detectores de órfão;
- configuração de dunning e próximas tentativas na Stripe;
- entrega efetiva de lembretes;
- quantidade de linhas potencialmente truncadas;
- comportamento HTTP da rota neste sandbox, devido à proibição de socket.

As consultas preparadas estão em `2026-09-12-adm-002-leituras.sql`. Elas continuam aproximações nomeadas; não convertem evento, estado e caixa em uma mesma medida.

## 12. Arquivos de evidência relevantes

- `server/lib/atencaoNecessaria.ts`
- `server/routes/admin.ts`
- `client/src/pages/Admin.tsx`
- `client/src/components/admin/overview/AttentionPanel.tsx`
- `client/src/components/admin/users/UsersDashboard.tsx`
- `server/providers/stripe.ts`
- `server/lib/stripeSync.ts`
- `server/lib/asaasLedger.ts`
- `server/lib/asaasLedgerWriter.ts`
- `server/lib/orphanPayments.ts`
- `server/lib/chargeSemDono.ts`
- `server/lib/aiUsage.ts`
- `server/middleware/auth.ts`
- migrations de billing events, órfãos, lembretes e jobs

Nenhum comentário antigo foi usado sozinho como prova; as conclusões acima foram confrontadas com consultas, escritores e consumidores atuais da main local inspecionada.
