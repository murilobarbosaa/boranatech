# Plano de implementação: redesenho da aba "Visão" do admin

**Frente:** `feat/admin-visao-overview`, worktree `/home/s0ft/bnt-admin-visao`, base
`origin/main` = `6a57d4d2`.
**Investigação que originou:** `docs/investigacoes/2026-08-14-admin-visao-metricas.md`
(commitado nesta branch). Todo número deste plano vem de lá ou de medição feita em
2026-08-14 entre 05:11 e 05:17 UTC, indicada como "medido nesta rodada".

> Nome do arquivo: `docs/plans/` **não existe** nesta base. A convenção real é `docs/`
> plano, com `plano-<assunto>.md` (`plano-auth-consentimento.md`,
> `plano-unificar-bugs-tarefas.md`). Este arquivo segue a convenção existente.

---

## 0. Zona de colisão e regra de exclusão

### 0.1 Zona proibida desta frente (trabalho NÃO commitado da frente paralela)

Capturado em `/home/s0ft/boranatech` (branch `fix/openai-cota-credencial`) às
2026-08-14 02:08 BRT, 40 entradas. Agrupado:

| Grupo | Arquivos |
| --- | --- |
| LinkedIn (lib/rotas/shared) | `server/lib/linkedinAnalyze.ts`, `server/lib/linkedinChecks.ts`, `server/lib/linkedinDeteccaoNaoMoveNota.test.ts`, `server/routes/linkedin.ts`, `shared/linkedin/normalizeProfileText.ts`, `shared/linkedin/parse.ts`, `shared/linkedin/parse.headlineContexto.test.ts`, `shared/linkedin/schema.ts`, `scripts/mutateLinkedinThresholds.mjs`, + 3 testes deletados |
| SEO do client | `client/index.html`, `client/public/llms.txt`, `client/public/site.webmanifest`, `client/src/components/SEO.tsx`, e 18 páginas em `client/src/pages/` (incl. `Admin.tsx`, `home/HomeLanding.tsx`) |
| Docs | `docs/auditoria-linkedin-fechamento.md`, `docs/confirmar-deploy.md` |
| Não rastreados | `client/src/lib/seoJsonLd.test.ts`, `design/` |

**Regra desta frente: nenhum arquivo desse conjunto é tocado aqui.** Nenhuma fase abaixo
precisa deles — verificado item a item.

**Exceção declarada, com o motivo:** `client/src/pages/Admin.tsx` aparece nessa lista, e
esta frente **não pode existir sem editá-lo**. A modificação não commitada da frente
paralela nele é de **2 linhas** — troca de `"Admin · Bora na Tech?"` por
`"Admin · Bora na Tech"` no `<SEO title>`, nas linhas 1195 e 7036 (medido nesta rodada por
`git diff HEAD -- client/src/pages/Admin.tsx`). Esta frente mexe no `useMemo`
`adminMetricCards` (6596-6690) e no bloco de render da Visão (7085-7290). São regiões
disjuntas; o merge é textualmente trivial. **Registrado aqui para não virar surpresa.**

### 0.2 Segunda camada de colisão: o que a frente paralela já COMMITOU

Medido nesta rodada com `git diff --name-only $(git merge-base origin/main HEAD) HEAD`.
A primeira tentativa comparou contra `origin/main` direto e acusou colisão em 6 branches;
isso era **falso** — aquelas branches estão atrás da main, e o diff mostrava o que a *main*
andou, não o que a *branch* mudou. Corrigido para merge-base, o resultado é:

| Branch | Commits próprios | Colide nos alvos? |
| --- | --- | --- |
| `feat/consentimento-signin-wrap` | 0 | não |
| `feat/headline-editavel` | 0 | não |
| `feat/estimated-hours` | 3 | não |
| `chore/ast-aiusagetool` | 2 | não |
| `feat/home-design-sections` | 0 | não |
| `claude/linkedin-fase4` | 1 | não |
| `fix/onboarding-feedback` | 1 | não |
| `fix/sentry-round-5-preload` | 0 | não |
| **`fix/openai-cota-credencial`** | **3** | **sim** |

Os 3 commits são `31c95737`, `e6316e70` (classificação de erro da OpenAI) e `33000fa7`
(pipeline fiscal NFS-e). O que eles tocam dos meus alvos, com o tamanho:

| Arquivo | Δ da frente paralela | Onde | Risco de conflito com esta frente |
| --- | --- | --- | --- |
| `server/routes/admin.ts` | +232 | hunks em 23, **1875-2095**, 3420 | **baixo**: o `/overview` (929-1035) é byte a byte idêntico ao de `origin/main`, reconferido pós-`fetch`; o fiscal foi anexado bem depois |
| `client/src/pages/Admin.tsx` | +18 | hunks em 77, 1195, 7036, 7451 | **baixo**: fora do `useMemo` dos cards e do bloco da Visão |
| `server/routes/github.ts` | +2 | 243, 251 | **baixo**: os `logAiUsage` da Fase 5 estão em 137/184/196 |
| `server/routes/careerPlan.ts` | +2 | 215, 478 | **médio**: o alvo da Fase 5 é 275-282, mas 478 fica ao lado do `logAiUsage` de 467 |
| `server/routes/interview.ts` | +19/−12 | 11 hunks, incl. 1357 e 1549 | **médio**: o alvo (TTS, 1811) está entre hunks deslocados |
| `server/routes/me.ts` | +194 | 1, 340, 530 | não é alvo desta frente (só leitura, na Parte 1) |
| `server/providers/stripe.ts` | +225 | fiscal | não é alvo desta frente |

**Decisão, e ela é um julgamento que quero explícito:** a regra que você deu manda adiar
"qualquer arquivo da frente paralela (`shared/linkedin/`, `server/lib/linkedin*`, SEO do
client)". Essa enumeração é exatamente a zona **não commitada** de 0.1, e é ela que aplico
como proibição dura. A camada commitada (fiscal + erro da OpenAI) é outro corpo de trabalho
que por acaso mora na mesma branch; adiá-la também **inviabilizaria a Fase 5 inteira e
metade da Fase 1**. Então:

- **Proibido (adiado sem discussão):** os arquivos de 0.1.
- **Permitido com mitigação:** `admin.ts`, `Admin.tsx`, `github.ts`, `careerPlan.ts`,
  `interview.ts`. Mitigação: **a Fase 5 é a última**, e antes dela esta branch faz
  `git fetch && git rebase origin/main`. Se `fix/openai-cota-credencial` já tiver subido,
  o rebase resolve; se não, a Fase 5 espera. Isso está escrito como pré-condição da Fase 5.

Se você preferir a leitura estrita (adiar tudo que a outra branch tocou), a consequência é:
Fase 5 sai do escopo desta frente e Fase 1 perde o item de moeda. Diga e eu ajusto.

---

## 0.3 D8 — Exclusão de conta cancela assinatura Stripe

**Decisão tomada em 2026-08-14, a partir do dossiê do cliente órfão.**

O dossiê mostrou que o caso NÃO era "pagou sem ter conta". A sessão de checkout carrega
`client_reference_id` e `metadata.supabase_user_id` = `79022fea-…` (a rota
`POST /billing/checkout` exige `requireAuth`, `server/routes/billing.ts:330`), logo a conta
existia. Ela sumiu depois: o id não está em `auth.users`, não há linha em nenhuma das 35
tabelas com coluna `user_id`, e `auth.audit_log_entries` está vazia.

A causa é `DELETE /api/me` (`server/routes/me.ts:434-451`): chama
`supabaseAdmin.auth.admin.deleteUser(userId)` e **nada mais**. Todos os FKs
`user_id → auth.users` são `ON DELETE CASCADE` (medido em `pg_constraint`), então
`profiles`, `subscriptions` e `subscription_cancellations` somem juntos; e
`finance_transactions.user_id` é `SET NULL`, o que explica a cobrança de R$ 29,90 sem dono.
A assinatura na Stripe fica viva e cobrando.

**D8, e a regra é fail-closed:**

1. resolver customer e assinaturas do usuário **ANTES** do `deleteUser` (depois, o CASCADE
   já apagou o mapeamento e não há como descobrir o customer);
2. cancelar **imediatamente** na Stripe toda assinatura `active`/`trialing`/`past_due`,
   inclusive as que já têm `cancel_at_period_end` (nesse caso a data de saída é antecipada
   para agora, o que é o efeito desejado: a conta não existe mais);
3. **sem reembolso** do período restante;
4. gravar `metadata { account_deleted_at, deleted_user_id }` no customer, para o detector de
   órfãos poder classificar em vez de gritar;
5. só então `deleteUser`;
6. falha na Stripe **aborta a exclusão** com erro claro ao usuário e evento no Sentry.
   Deletar a conta e deixar a cobrança viva é o pior dos dois resultados possíveis.

Usuário sem customer/assinatura: fluxo atual intocado, zero chamadas à Stripe. Avulso de
boleto (`provider_subscription_id` = `cs_…`): não há Subscription na Stripe para cancelar, e
o acesso morre com a conta.

## 0.4 Pendências registradas (não executadas nesta frente)

| Pendência | Por quê fica registrada aqui |
| --- | --- |
| **Remover o alias `custoIa.valueBrl`** | O rename para `valueUsd` é expand/contract. O contract (remoção do alias) é ato deliberado de uma fase posterior, no mesmo commit que atualiza `server/lib/janelaDeDeployInversa.test.ts`. Sem esta linha, o alias vira lixo permanente |
| **Apagar a linha `cs_test_…` de `billing_events`** | Um evento de **modo teste** (`cs_test_a1hjDcpNU…`, `murilo1234@gmail.com`, R$ 24,90, 2026-07-15) está gravado no banco de **produção**. A Parte 3 desta rodada impede novos; **a linha já existente NÃO é apagada** (escrita em produção proibida). Limpeza a autorizar em rodada futura, e é `delete` de uma linha, portanto migration destrutiva sujeita à janela de 05h-09h |
| **Backfill das 251 chamadas sem custo** | Recomendação é NÃO fazer (ver 5.2: nenhuma das 251 tem tokens). Se for feito assim mesmo, exige script idempotente com `--dry-run` e autorização em rodada separada |

## 1. FASE 1 — Correções de exatidão

Objetivo: cada número da tela passa a dizer a verdade sobre o que mede. Sem mudança de
layout, sem gráfico novo.

### 1.1 Card "Usuários totais" ao lado de "Novos usuários" (D1)

- **Por quê:** a divergência 4.790 vs 5.456 fechou em 666/666, resíduo zero — não é bug, é
  ausência do card sem janela. Hoje o total só existe escolhendo "Tudo" no seletor, o que
  muda os outros cinco cards junto.
- **Arquivos:**
  - `server/routes/admin.ts` — `/overview`: acrescentar `cards.usuariosTotais`, alimentado
    por `contarPerfis(null, janela.endIso)`. **Reusa a função que já existe**, com `desde`
    nulo; não é aritmética nova.
  - `client/src/pages/Admin.tsx` — `adminMetricCards`: card novo antes de "Novos usuários";
    `OverviewData` ganha o campo.
- **Query nova:** 1 `count(exact, head)` sem filtro inferior. Custo medido no relatório:
  o `contarPerfis` com filtro levou 1.873 ms da minha máquina (inclui RTT de internet, o
  Railway paga menos). Sem filtro é o mesmo plano de índice; a rota passa de 2 para 3
  contagens de `profiles`. **Índice:** nenhum novo — é `count(*)` de tabela inteira.
- **Risco:** aumentar o pior caso da rota, que já é o `contarPerfis`. Mitigação na 1.7.
- **NÃO fazer:** não trocar a fonte da home; não mexer em `server/routes/stats.ts`. Os dois
  números continuam vindo de `profiles`, e é por isso que batem.

### 1.2 Assinantes Pro: total deduplicado, trialing em chip, past_due fora (D3)

- **Por quê:** o client soma `bySubscription` (96) + `byInfluencer` (25) = 121, e o total
  real é **124** — as 3 pessoas em `both` somem. O backend **já envia** `total`
  (`admin.ts:1013-1017`); o client só não o usa. Além disso o rótulo "Assinaturas ativas"
  inclui `trialing`, que o MRR exclui de propósito.
- **Arquivos:**
  - `client/src/pages/Admin.tsx` — headline passa a `c.acessoPro.total`; `bySubscription`,
    `byInfluencer` e `both` viram detalhe/chips.
  - `server/routes/admin.ts` — expor `both` no payload (hoje o `tally` calcula e a rota
    descarta) e expor `trialingCount` de `getMrrSnapshot` (já calculado, também descartado).
  - `client/src/pages/Admin.tsx` — `past_due` sai daqui e vai para o card de risco (1.5).
- **Query nova:** **nenhuma.** Tudo já é computado; só para de ser jogado fora.
- **Risco:** o headline muda de 96 para 124 sem mudança de realidade. Precisa de nota na
  tela, senão lê como salto de 29%.
- **NÃO fazer:** não reimplementar a regra de Pro. `buildEnrichmentIndex`/`tallyProSources`
  continuam a fonte única; o comentário em `userListEnrichment.ts:170-176` já explica por quê.

### 1.3 Vigência dos 8 avulsos `cs_live_` — **verificado, nada a corrigir**

Medido nesta rodada (2026-08-14 05:14 UTC):

```sql
select p.code, s.status, s.current_period_end::date,
       (s.current_period_end > now()) as vigente, s.payment_method, s.renewal_type
from subscriptions s join plans p on p.id=s.plan_id
where s.provider_subscription_id like 'cs_%';
```

| status | total | vigentes | expirados | sem fim |
| --- | --- | --- | --- | --- |
| active | 8 | **8** | 0 | 0 |
| canceled | 2 | 1 | 0 | 1 |

Os 8 são todos **boleto**, `renewal_type: manual`, com `current_period_end` entre
**2027-01-22 e 2027-08-10**. Nenhum expirado. A contagem de Pro **está correta hoje** e
`subscriptionGrantsPro` já aplica `current_period_end > now()`.

**Ação nesta fase: nenhuma correção de contagem.** O item entra como **teste de regressão**
(1.8) que trava a regra, e como nota na tela: parte do "Pro" não é assinatura recorrente na
Stripe, é acesso pré-pago por boleto — o que explica, sozinho, R$ 166,00 dos R$ 136,10 de
diferença de MRR contra o Stripe.

### 1.4 Custo de IA: a moeda (D6)

- **Por quê:** `MODEL_PRICING` é declarado em **US$/1M tokens** (`aiTools.ts:47,55-58`),
  `estimateCostFromTokens` devolve dólares, o valor é gravado cru, o campo se chama
  `valueBrl` e é formatado com `currency: "BRL"`. O card diz **R$ 2,41** onde o número é
  **US$ 2,41**.
- **Arquivos:**
  - `server/routes/admin.ts` — renomear `custoIa.valueBrl` → `custoIa.valueUsd`.
  - `client/src/pages/Admin.tsx` — formatar em USD; linha secundária em BRL **só se**
    `AI_COST_USD_BRL_RATE` estiver definida.
  - `server/lib/env.ts` — declarar `AI_COST_USD_BRL_RATE` como **opcional**.
  - `server/lib/aiUsageStats.ts` — corrigir a docstring de `custoTotalDeIa`
    ("Custo total em reais" → dólares). Uma docstring errada em cima de uma unidade errada
    é o que sustentou o defeito.
- **Renomear campo de resposta é expand/contract, e o CLAUDE.md é explícito.** Então:
  1. **expand:** o backend emite `valueUsd` **e** `valueBrl` (o mesmo número), com a data de
     remoção no comentário;
  2. o client passa a ler `valueUsd`;
  3. **contract:** `valueBrl` sai num commit posterior, junto com o teste de
     `server/lib/janelaDeDeployInversa.test.ts`.
  Sem isso, aba de admin aberta desde antes do deploy quebra o card.
- **Query nova:** nenhuma.
- **NÃO fazer:** **não** buscar cotação em API externa. Taxa por env, estática, e a linha em
  BRL some quando a env não existe — melhor ausência declarada que número que envelhece sozinho.

### 1.5 Receita em risco e receita no período (D4, D5)

- **Receita no período:** manter **bruto** como principal (é a base do Simples) e exibir
  junto o líquido = bruto − reembolsos − taxas. Os três já são calculados por
  `getFinanceSummary` (`receitaBrutaCents`, `reembolsosCents`, `taxasStripeCents`,
  `receitaLiquidaCents`) e **dois são descartados** pela rota.
  Na janela medida: bruto R$ 4.213,15, taxas R$ 189,42, reembolso R$ 148,74,
  líquido R$ 3.874,99.
- **Receita em risco:** separar `cancel_at_period_end` (20, R$ 566,80) de `past_due`
  (1 assinatura, R$ 29,90/mês), e acrescentar contador de **charges falhadas na janela**.
- **Arquivos:** `server/routes/admin.ts` (expor os campos já calculados +
  `pastDue`), `server/lib/billingMetrics.ts` (acumulador de `past_due` no mesmo laço —
  mesmo padrão do `atRisk`, sem segunda implementação da normalização mensal),
  `client/src/pages/Admin.tsx`.
- **Charges falhadas:** ver 3.3 — **não** existe fonte local hoje.
- **NÃO fazer:** não somar `past_due` ao `atRisk`. São coisas diferentes: uma tem data de
  saída, a outra tem pagamento quebrado.

### 1.6 Detector de órfãos: full-history (D7)

- **Por quê:** `orphanPayments.ts` usa `DEFAULT_WINDOW_DAYS = 7` (com `MAX_WINDOW_DAYS = 90`),
  e o órfão real desta investigação é de **2026-07-19** — fora de alcance há semanas. Medido
  nesta rodada: **2** `checkout.session.completed` em `billing_events` cujo
  `provider_subscription_id` não tem linha em `subscriptions`; um é `cs_test_…` (sessão de
  **teste** que entrou no banco de produção, e-mail `murilo1234@gmail.com`, R$ 24,90) e o
  outro é o órfão real.
- **Arquivos:** `server/lib/orphanPayments.ts` (modo `full` sem teto de 90 dias, paginado),
  `server/routes/cron.ts` (parâmetro), e opcionalmente uma segunda fonte: varrer
  `billing_events` local em vez de só listar na Stripe — é mais barato e pega o mesmo caso.
- **Query nova:** o `left join` acima sobre `billing_events` (374 linhas hoje) é trivial.
- **Risco:** varredura full-history na Stripe cresce com o tempo. Mitigação: modo `full` é
  **sob demanda** (rota de cron com parâmetro), não o padrão diário.
- **NÃO fazer:** **não** promover ninguém automaticamente. O módulo já declara
  ("O job SO DETECTA") e essa fronteira fica. Auto-cura é decisão separada.
- **NÃO fazer:** nada sobre o órfão específico entra em código. Contato/reembolso é decisão
  humana, fora deste plano (ver o dossiê no resumo desta rodada).

### 1.7 Cache do `/overview`

- **Por quê:** `signup-history` e `paid-funnel` têm cache de 300 s; **o `/overview` não tem
  nenhum**. Cada carga da página e cada troca de janela refaz 9 leituras, e a Fase 1 sobe
  para ~11. A leitura mais cara medida é o `contarPerfis` (1.873 ms).
- **Arquivo:** `server/routes/admin.ts`, com o `getOrCompute` **que já existe**, chave
  `admincache:overview:<window>`, TTL 60 s (mais curto que os 300 s dos outros porque o
  admin usa estes números para agir).
- **Risco:** número velho. Mitigação: carimbar `computedAt` na resposta e exibir, como o
  funil já faz.

### 1.8 Testes da Fase 1 (com controles negativos)

| Arquivo | Caso positivo | **Controle negativo** |
| --- | --- | --- |
| `server/lib/userListEnrichment.test.ts` (existente) | avulso boleto com `current_period_end` no futuro conta como Pro | **avulso com `current_period_end` no passado NÃO conta**; **`past_due` NÃO conta**; **plano `free` NÃO conta** |
| novo `server/routes/adminOverviewCards.test.ts` | `usuariosTotais` ignora a janela; `novosUsuarios` a respeita | **`window=7` e `window=all` devolvem o MESMO `usuariosTotais`**; `both>0` ⇒ `total > bySubscription + byInfluencer` |
| novo `server/lib/aiCostUnit.test.ts` | `custoIa.valueUsd` é o mesmo número de `valueBrl` durante o expand | **sem `AI_COST_USD_BRL_RATE`, a resposta NÃO traz linha em BRL** (ausência, não zero) |
| `server/lib/janelaDeDeployInversa.test.ts` (existente) | resposta com `valueBrl` e `valueUsd` não quebra o bundle antigo | **remover `valueBrl` quebra o teste** — é o que trava o contract |

---

## 2. FASE 2 — Janela e timezone unificados (D2)

### 2.1 O problema, medido

O relatório documentou duas semânticas. Mapeando os consumidores nesta rodada, são **três**,
e há ainda uma quarta mistura:

| Rota | Semântica de "últimos N dias" | Fuso |
| --- | --- | --- |
| `/overview` (`admin.ts:929`) | instante deslizante `agora − N×24h` | **UTC** |
| `/signup-history` (`admin.ts:1207`) | N dias **civis** terminando hoje | **America/Sao_Paulo** (`diaBrasilia`) |
| `/subscription-history` (`admin.ts:~1400`) | N dias civis terminando **no último snapshot**, não em hoje | dia civil, **mas `staleDays` compara com `hojeUtc = new Date().toISOString().slice(0,10)`** |

Diferença medida entre a primeira e a segunda, 2026-08-14 04:53 UTC: **4.788 vs 4.606**,
182 cadastros, na mesma tela, com o mesmo rótulo.

Existem ainda **duas aritméticas de dia duplicadas**: `somarDia`
(`server/lib/signupSeries.ts:66`) e `somarDias` (`server/routes/admin.ts:1346`).

### 2.2 Blast radius completo (levantado nesta rodada)

**Server** — `server/lib/overviewWindow.ts` é importado por **um único arquivo**:

```
server/routes/admin.ts:66-69  (calcularVariacao, parseOverviewWindow, resolverJanela)
  :931   /overview
  :1209  /signup-history
  :1003,1022  calcularVariacao
```

**Client** — 5 arquivos:

```
client/src/pages/Admin.tsx                                 (86-90, 6118-6122, 6625, 6651, 7092)
client/src/components/admin/overview/OverviewPeriod.tsx    (define OverviewWindow + parse)
client/src/components/admin/overview/SignupChart.tsx       (21, 44, 155)
client/src/components/admin/overview/SubscriptionChart.tsx (21, 61)
client/src/components/admin/overview/overviewChange.ts     (rotuloDeVariacao, dataDeInstante)
```

**`diaBrasilia`** (`shared/brasiliaDay.ts`) tem um consumidor fora da Visão:
`server/routes/adminNotifications.ts:1289` (agrupamento de leituras de notificação).

**Conclusão do impacto: nenhuma outra aba do admin usa `overviewWindow.ts`.** A mudança é
contida à Visão. `adminNotifications.ts` já usa dia civil de Brasília, ou seja, a unificação
vai **na direção** do que ele já faz — não é preciso tocá-lo.

### 2.3 O que muda

- `server/lib/overviewWindow.ts`: `resolverJanela` passa a devolver **limites de dia civil de
  Brasília**: `startIso` = 00:00:00 BRT do dia `hoje − (N−1)`, `endIso` = agora.
  `previousStart/End` idem, o período civil imediatamente anterior, do mesmo tamanho.
- `server/routes/admin.ts`: `/signup-history` e `/subscription-history` passam a derivar o
  intervalo **da mesma função**, em vez de recalcular. `somarDias` (1346) é deletado em favor
  de `somarDia` (`signupSeries.ts`) — uma aritmética de dia, num lugar só.
- **`staleDays` do `/subscription-history` fica em UTC — exceção deliberada, não esquecimento.**
  Ele não mede "quantos dias civis o usuário percebe": mede **atraso de um job**, e a
  cadência do job é UTC. Verificado nesta rodada em
  `supabase/migrations/20260715150100_schedule_subscription_snapshot.sql:18-24`: o `pg_cron`
  roda `snapshot-subscriptions` **uma vez por dia às 05:10 UTC**. Converter a comparação
  para dia civil de Brasília faria o `staleDays` pular de 0 para 1 às 21h de Brasília todo
  dia, sem que nada tivesse atrasado — alarme falso diário, e alarme falso é alarme que
  alguém desliga. **Decisão: manter UTC/duração absoluta, e trocar o nome da variável de
  `hojeUtc` para algo que diga por quê** (ex.: `hojeNaCadenciaDoJob`), com o comentário
  apontando a migration. Se um dia a cadência do cron virar horário de Brasília, esta
  exceção cai junto — e é por isso que o comentário cita a migration, não o valor.
- Resposta ganha `windowLabel` (ex.: `"15 jul – 14 ago"`) e `windowTz: "America/Sao_Paulo"`,
  **calculados no servidor**, para o client não reimplementar fuso.
- `OverviewPeriod.tsx` e cada card/gráfico exibem o badge de intervalo
  (`"15 jul – 14 ago · Brasília"`).
- O gráfico marca o **dia parcial** (hoje) visualmente e no `aria-label`.

### 2.4 Riscos

- **Toda a Visão muda de número no mesmo deploy.** Os cards caem (a janela civil é menor que
  a deslizante: 4.606 vs 4.788 no dia da medição). É esperado e precisa estar na nota de
  release, senão lê como regressão.
- **Δ vs período anterior** muda junto: o "anterior" passa a ser N dias civis, não N×24h.
  Sem isso, o Δ compararia peras com maçãs.
- **Horário de verão:** o Brasil não observa DST hoje, mas `Intl` com `America/Sao_Paulo`
  resolve sozinho se voltar. Aritmética manual de `−3h` **não** resolveria — por isso a
  conversão passa por `Intl`, nunca por offset fixo.

### 2.5 Testes (com controles negativos)

Arquivo novo `server/lib/overviewWindow.brasilia.test.ts`, com relógio injetado
(`resolverJanela` já aceita `agora: Date`):

| Caso | Esperado |
| --- | --- |
| cadastro às **23:50 BRT** do dia-limite (= 02:50 UTC do dia seguinte) | **entra** no bucket do dia BRT correto, não no de UTC |
| cadastro às **00:10 BRT** do primeiro dia da janela | **entra** |
| **negativo:** cadastro às **23:50 BRT do dia anterior** ao início | **NÃO entra** |
| **negativo:** cadastro às **21:30 BRT de hoje** (= 00:30 UTC de amanhã) | **entra** em hoje, e **NÃO** cria um bucket de amanhã |
| `window=7` chamada às 00:05 BRT | 7 buckets, o primeiro com 5 minutos de dado, marcado como parcial |
| **negativo:** `previousStart..previousEnd` **não** intersecta `start..end` | zero sobreposição |
| soma dos buckets do gráfico == valor do card `novosUsuarios` | **igualdade exata** — é o teste que fecha os 182 |

O último é o que vale mais: hoje ele **falharia**, e é exatamente a asserção que faltava.

### 2.6 O que NÃO fazer

- Não introduzir biblioteca de data (`date-fns`, `dayjs`, `luxon`). `Intl` +
  `shared/brasiliaDay.ts` já cobrem, e dependência nova não foi pedida.
- Não mudar o fuso de nada fora da Visão. `expenses.incurred_on`,
  `subscription_snapshots.snapshot_date` e `admin_tasks.due_date` são coluna `date` e o
  comentário de `brasiliaDay.ts` explica por que não passam por `new Date`.
- Não oferecer janela de 90 dias. `OverviewPeriod.tsx` já documenta por que não existe.

---

## 3. FASE 3 — Painel "Atenção necessária" (substitui "Eventos recentes")

"Eventos recentes" mostra as 10 últimas linhas de `content_audit_logs` (149 linhas na base).
É histórico de edição de conteúdo, não decisão. Sai.

### 3.1 Itens, e só os que têm fonte HOJE

| Item | Fonte | Estado medido |
| --- | --- | --- |
| Assinaturas `past_due` | `subscriptions.status` | 1 (R$ 29,90/mês) |
| Saídas agendadas | `cancel_at_period_end` | 20 (R$ 566,80/mês, 20,8% do MRR) |
| Cobranças sem dono | `finance_transactions.user_id is null` | 2, R$ 120,20, mais antiga 2026-07-19 |
| Pagamentos órfãos | detector da 1.6 + `billing_events` | 2 sessões sem linha (1 é `cs_test_`) |
| Boletos emitidos e não pagos | já em `healthBand.ts` (`boletosPendentes`) | já exibido na faixa |
| Snapshot diário atrasado | `healthBand.ts` (`snapshotStaleDays`) | já exibido |
| Fila de e-mail (BullMQ) | `healthBand.ts` (`filaDeEmail: {failed, waiting} \| null`) | **disponível** — o inventário da Parte C confirma, e o tipo já distingue `null` (indisponível) de `{failed:0}` (vazia) |
| Spike de custo de IA | `ai_usage_logs` | limiar simples: custo dos últimos 7 dias > 2× a média das 4 semanas anteriores |

### 3.2 Charges falhadas na janela — **não há fonte local**

`billing_failed_payments`, `payment_recovery_emails` e `stripe_customers` existem e estão
**vazias**, e a varredura do repositório inteiro (`.ts` + `.sql`) mostra que só aparecem em
`shared/database.types.ts`: **não existe escritor nesta base**. Você indicou que os
escritores vivem na branch não mergeada `fix/billing-customer-reuse`.

**Decisão desta frente: não depender delas.** Duas opções, e a recomendação:

- **(A) recomendada** — ler o contador direto da Stripe (`charges` com `created[gte]`,
  contando `status=failed`), atrás do cache de 60 s da 1.7. Medido nesta rodada: 88 falhas
  contra 90 sucessos em 30 dias, numa listagem paginada. É 1 chamada de API por janela.
- **(B)** — esperar `fix/billing-customer-reuse` mergear e ler do banco. Mais barato em
  runtime, mas cria dependência entre frentes.

Com (A), o item entra na Fase 3 sem bloqueio. Se (B) chegar antes, a fonte troca sem mudar
a tela.

### 3.3 Arquivos

- novo `server/lib/atencaoNecessaria.ts` — coleta e classifica; **fail-soft por item**
  (um item que falha vira estado nomeado, nunca some em silêncio).
- `server/routes/admin.ts` — `GET /admin/attention`, com o `getOrCompute` existente.
- novo `client/src/components/admin/overview/AttentionPanel.tsx`.
- `client/src/pages/Admin.tsx` — troca do bloco "Eventos recentes".

### 3.4 Ações por item

Cada item leva link: **abrir no Stripe** (`https://dashboard.stripe.com/subscriptions/<id>`)
ou **ver usuário** (aba Usuários, via `setActiveSection("usuarios")`, padrão que os cards já
usam com `destino`). Nenhuma ação de escrita no painel — botão que cancela ou reembolsa
não entra nesta frente.

### 3.5 Riscos e o que NÃO fazer

- **Risco:** painel de alertas que nunca fica vazio vira ruído e alguém desliga. Regra:
  item resolvido **some**; verde é ausência, como o `HealthBand` já faz.
- **NÃO fazer:** não duplicar o que a faixa de saúde já mostra. Boletos pendentes e snapshot
  atrasado ficam **só** na faixa; o painel novo referencia, não repete.
- **NÃO fazer:** não escrever nas tabelas vazias de billing. Elas pertencem à outra frente.

---

## 4. FASE 4 — Cards digeridos e gráficos novos

### 4.1 Cards com Δ + sparkline

- Δ vs janela anterior: `calcularVariacao` **já existe** e já é usado por `novosUsuarios` e
  `receita`. Estender para os demais **só onde houver série**, e manter o motivo nomeado
  (`historico_insuficiente` / `janela_sem_anterior` / `sem_dados`) quando não houver.
- Sparkline: `subscription_snapshots` (MRR e assinantes, 29 pontos desde 2026-07-16) e
  `signup-history` (cadastros). **Para "Receita em risco" e "Custo de IA" não há série
  diária** — sparkline ali seria desenho sem dado. Ficam sem.
- **Arquivos:** `client/src/components/admin/overview/` (há `chartMath.ts` e `ChartFrame.tsx`
  em `origin/main` para reusar), `client/src/pages/Admin.tsx`.

### 4.2 Funil reduzido a taxas

`computarFunilPago` já devolve `steps`, `biggestLeak`, `pagantesNaJanela`,
`assinantesSemRastro`, `retornos`, `boletosPendentes`. A mudança é de **apresentação**:
exibir taxa entre etapas em vez de contagem absoluta, mantendo o absoluto no tooltip.
**Tendência** exige guardar o funil de janelas anteriores — hoje o cache é por chave fixa de
30 dias e não há histórico. **Marcar como instrumentação futura**, fora desta frente.

### 4.3 Aquisição

Fonte única hoje: `$referring_domain` do PostHog (`server/lib/posthog.ts:206`).
**Não existe atribuição por canal/UTM**: nenhuma coluna de UTM em `profiles` ou
`subscriptions`, nenhum `posthog.capture` com `utm_*`. Consequência: não dá para cruzar canal
com receita em SQL. **Marcado como instrumentação futura, explicitamente fora desta frente**
(entra na Fase 5 do plano de produto, não neste).
O que dá para fazer agora: exibir o ranking já existente com o denominador declarado e a
ressalva de bloqueador de script (o `assinantesSemRastro` do funil já mede esse buraco).

### 4.4 Gráficos novos

| Gráfico | Fonte | Existe hoje? |
| --- | --- | --- |
| Conversões Pro por dia | `subscriptions.created_at` (103 linhas, desde 2026-07-13) | sim, agrupamento novo |
| Custo de IA × receita | `ai_usage_logs` + `finance_transactions` | sim, mas **com aviso "custo subestimado"** até a Fase 5 |
| Uso por ferramenta | `ai_usage_logs.tool` | sim, `agregarUsoDeIa` já devolve por tool |

**O aviso não é enfeite:** enquanto 7 ferramentas gravarem custo 0, um gráfico de custo ×
receita afirma uma margem melhor do que a real. Sem o aviso, é a mesma família do
`contarLinhas` devolvendo −1 — número plausível e errado.

### 4.5 ARPU e custo de IA por assinante

- ARPU: `getMrrSnapshot` **já calcula** `arpuCents`, e devolve `null` quando
  `activeCount === 0` (ausência, não zero). A rota descarta. Só expor.
- Custo de IA por assinante: `custoIa / acessoPro.total`. Herda o problema de unidade e de
  cobertura — **só entra depois da Fase 5**, ou com o mesmo aviso.

### 4.6 Riscos e o que NÃO fazer

- **Risco:** 29 pontos de snapshot é pouco para sparkline em janela de 30 dias. O componente
  precisa declarar "desde 16/07" em vez de desenhar 30 posições com 29 dados.
- **NÃO fazer:** não inventar série retroativa de MRR a partir de `finance_transactions`.
  Seria uma segunda fonte para o mesmo número, e a segunda é a que diverge.
- **NÃO fazer:** nenhuma dependência de gráfico nova. Reusar o que já existe em
  `components/admin/overview/`.

---

## 5. FASE 5 — Instrumentação de custo de IA

**Pré-condição obrigatória:** `git fetch && git rebase origin/main`, e
`fix/openai-cota-credencial` já mergeada. Motivo em 0.2 — os três arquivos desta fase são os
que a frente paralela tocou. É por isso que esta fase é a **última**: é a única cuja
liberação não depende desta frente. A Fase 4 não espera por ela (ver seção 7).

### 5.1 Os 7 call sites

| Arquivo | Linha | Tool | Ação |
| --- | --- | --- | --- |
| `server/routes/github.ts` | 137, 184, 196 | `github-perfil`, `github-repo` | acrescentar `costEstimate` (o `tool` é montado em 132 como `` `github-${mode}` ``) |
| `server/routes/careerPlan.ts` | 275-282 | `career-plan` | acrescentar `costEstimate`. **O mesmo arquivo já faz certo em 457** para `CAREER_PLAN_CHAT_TOOL` — é copiar o vizinho |
| `server/routes/interview.ts` | ~1811 | TTS (`INTERVIEW_TTS_TOOL`) | **caso à parte**: é ElevenLabs, não OpenAI, e o `TODO` da linha 1809 declara. Precisa de preço por caractere, não da tabela de token |
| `server/routes/interview.ts` | turnos/sessão | `interview-turn`, `interview-session` | acrescentar `costEstimate` |
| `server/lib/aiEnrich.ts` | `enrichArticle` | novo tool `news-enrich` | passa a chamar `logAiUsage`. **Decisão pendente:** é job de sistema, sem `userId` natural |

**A guarda vai DENTRO, não no call site.** O CLAUDE.md é explícito ("Proteção dentro da
função, nunca no call site"), e este é o caso exemplar: `logAiUsage` já grava
`costEstimate || 0` silenciosamente. Proposta: quando `model` for de **texto** e houver
tokens/chars mas `costEstimate` vier `undefined`, `logAiUsage` **calcula sozinho**; quando o
modelo for de `NON_TEXT_MODELS`, grava 0 explícito. Assim o oitavo call site que alguém
esquecer já nasce coberto. Plano B (teste que enumera os call sites da fonte) só se a guarda
não couber dentro.

### 5.2 Backfill das 251 linhas — **recomendação: NÃO fazer**

Medido nesta rodada (05:16 UTC):

| tool | linhas | com tokens | com chars | sem nada |
| --- | --- | --- | --- | --- |
| github-perfil | 79 | **0** | 78 | 1 |
| career-plan | 65 | **0** | 60 | 5 |
| interview-turn | 62 | **0** | 58 | 4 |
| github-repo | 23 | **0** | 21 | 2 |
| interview-session | 15 | **0** | 15 | 0 |
| study-plan-build | 5 | **0** | 0 | 5 |
| interview | 2 | **0** | 0 | 2 |
| **total** | **251** | **0** | 232 | 19 |

**Nenhuma das 251 tem tokens.** Um backfill só poderia usar `CHARS_PER_TOKEN = 4` — e
`aiTools.ts` documenta, com medição própria, que o número real é **2,2 chars/token** em
português com termo técnico, ou seja, o backfill subestimaria em ~45% e produziria um valor
**plausível e indistinguível do certo**. É a contramedida errada pelo critério do CLAUDE.md
("degradar este valor produz um resultado que alguém pode confundir com correto?" → sim →
não degradar).

**Proposta:** deixar as 251 como estão e **marcá-las como não medidas** na apresentação
(a aba IA e o gráfico da 4.4 mostram "251 chamadas sem custo medido" ao lado do total), em
vez de fabricar centavos. Se você quiser o backfill mesmo assim, ele volta como script
idempotente com `--dry-run` obrigatório, e **a execução exige autorização em rodada
separada** — não entra aqui.

### 5.3 `MODEL_PRICING`: cobertura e atualidade

Modelos presentes na base (medido no relatório): `gpt-4o-mini` (2.339 chamadas),
`gpt-4o-mini-transcribe` (4), `model` nulo (3). A tabela cobre `gpt-4o-mini` e `gpt-4o`;
`gpt-4o-mini-transcribe` cai em `NON_TEXT_MODELS` e recebe 0 **deliberadamente**.
**Lacuna real:** as 3 linhas com `model` nulo (todas `resume-builder`) — `modelPricingOf`
nunca é chamado e o custo fica nulo, não 0. Tratar como "não medido", não como zero.
**Ação:** conferir os preços contra a tabela pública da OpenAI **no momento da
implementação** e registrar a data da conferência no comentário. Não afirmo aqui que
`0.15/0.60` continua correto — não verifiquei nesta sessão, e o arquivo hoje não carrega
data de conferência. Acrescentar essa data é parte da fase.

### 5.4 Testes

| Caso | Esperado |
| --- | --- |
| `logAiUsage` sem `costEstimate`, modelo de texto, com tokens | grava custo **calculado**, não 0 |
| **negativo:** modelo em `NON_TEXT_MODELS` | grava **0 explícito**, e não o preço do `DEFAULT_MODEL` |
| **negativo:** sem tokens e sem chars | grava **null**, não 0 (ausência ≠ gratuito) |
| `github-perfil` ponta a ponta | linha nasce com custo > 0 |
| `agregarUsoDeIa` | soma **não** conta linhas com custo null como 0 no denominador de "medido" |

---

## 6. Migrations

**Expectativa confirmada: nenhuma migration é necessária em nenhuma das cinco fases.**

Conferido por fase:

| Fase | Precisa de coluna/tabela nova? |
| --- | --- |
| 1 | não — só expõe campos já calculados e descartados (`both`, `trialingCount`, `arpuCents`, `reembolsosCents`, `taxasStripeCents`) |
| 2 | não — mudança de aritmética de janela, em memória |
| 3 | não — lê `subscriptions`, `finance_transactions`, `billing_events`, Stripe e o `healthBand` que já existem |
| 4 | não — agrupamentos novos sobre colunas existentes |
| 5 | não — `ai_usage_logs` já tem `input_tokens`, `output_tokens`, `model`, `cost_estimate` |

Se alguma fase revelar necessidade de migration, ela é **listada e NÃO aplicada**, e a
regra do CLAUDE.md vale: aditiva é isenta de janela; destrutiva só entre 05h e 09h de
Brasília com backup `COMPLETED` confirmado. Nenhuma das fases prevê nada destrutivo.

Nota de inventário, não de ação: `fiscal_invoices` **não existe** no banco de produção, e
isso está correto — as 5 migrations que a criam estão só no commit `33000fa7`, que não
foi mergeado. Não é dívida desta frente.

---

## 7. Ordem de execução e critério de pronto

**Ordem oficial: 1 → 2 → 3 → 4 → (merge de `fix/openai-cota-credencial` + rebase) → 5.**

| Ordem | Fase | Por que nesta posição |
| --- | --- | --- |
| 1 | **Fase 1** | corrige o que está errado hoje; não depende de nada |
| 2 | **Fase 2** | muda todos os números de uma vez; melhor sozinha num deploy, com 24 h de observação |
| 3 | **Fase 3** | independente das duas primeiras; entrega o maior valor operacional |
| 4 | **Fase 4** | entra ANTES da 5, e o custo de IA ainda incompleto **não a bloqueia**: os visuais de custo saem com selo "custo parcial / não medido" (4.4 e 4.5), que é informação honesta, não placeholder |
| 5 | **Fase 5** | por último, porque é a única que depende de fator externo: exige o merge de `fix/openai-cota-credencial` e um rebase (ver 0.2) |

> **Correção de uma contradição da primeira versão deste plano.** A versão anterior
> colocava a Fase 5 antes da 4 "porque o gráfico depende do custo estar certo", e ao mesmo
> tempo condicionava a Fase 5 a um merge que não está sob controle desta frente. As duas
> coisas juntas travariam a Fase 4 atrás de uma dependência externa. O selo de custo parcial
> resolve: a 4 entrega, declarando o que ainda não é medido, e a 5 remove o selo quando
> chegar.

Cada fase é **um deploy próprio**, com observação antes da seguinte — CLAUDE.md,
"branch de dias, não de semanas". Antes de cada uma: `pnpm check` verde e o `pre-commit`
completo (suite inteira + suite sem `.env` + `pnpm check`), que já rodou verde no commit
do relatório nesta branch (2.549 testes).

## 8. O que esta frente NÃO faz, em nenhuma fase

- Não toca nenhum arquivo da zona de 0.1 (LinkedIn, SEO do client, `design/`).
- Não escreve no banco de produção nem na API do Stripe (todas as leituras desta frente são
  `GET`/`SELECT`).
- Não altera o contador público da home nem `server/routes/stats.ts`.
- Não decide o caso do cliente órfão (contato, provisionamento manual ou reembolso). Só o
  detector entra em código.
- Não cria atribuição por canal/UTM.
- Não implementa auto-cura de pagamento órfão.
- Não executa backfill de custo de IA.
- Não altera `.nvmrc` nem `engines`.
