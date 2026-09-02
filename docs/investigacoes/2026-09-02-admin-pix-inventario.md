HEAD_FINAL: 6277d6c7760809e94bb79b0353742a615400a7f4

# Investigação: Pix no painel de admin e pendências da Visão

Rodada de leitura, em `/home/s0ft/bnt-investiga-pix` (branch `docs/investigacao-pix`, criada a partir de `origin/main`). Nenhuma escrita fora deste arquivo.

**Nota de instrumento, registrada porque o prompt 01b pediu e porque afetou uma medição.** Todo comando de git rodou com o sandbox de Bash DESLIGADO. Com o sandbox ligado, `git status --porcelain` em `/home/s0ft/boranatech` listou `.bashrc`, `.zshrc`, `.gitconfig`, `.profile`, `.vscode` e outros dotfiles como não rastreados; nenhum deles existe na árvore. A leitura sem sandbox não os mostra.

**Segundo defeito de instrumento, encontrado durante a seção 9 e corrigido antes de o resultado entrar aqui.** A primeira varredura das frentes vivas passou a lista de paths por variável de shell não citada (`-- $PATHS`). Para `bnt-nfsen` e `bnt-fiscal` isso devolveu diff VAZIO com exit code 0, e a mesma consulta com os paths literais devolve 12 e 14 arquivos. O shell come um trecho da expansão em posição de pathspec (visível num erro colateral: `$mb:server/providers/asaas.ts` chegou ao git como `<hash>rs/asaas.ts`). É a classe do CLAUDE.md, escopo derivado por um mecanismo que sub-casa em silêncio e falha PASSANDO, e teria produzido aqui a conclusão falsa "nenhuma frente toca o escopo". **Todos os números da seção 9 foram remedidos com lista literal.**

## 0. Commits entre a auditoria e o HEAD_FINAL

```
$ git log --oneline 1f766b2..HEAD -- server/routes/admin.ts server/lib server/providers \
    server/routes/cron.ts server/routes/webhooksAsaas.ts supabase/migrations \
    client/src/pages/Admin.tsx client/src/components/admin
6277d6c7 fix(queue): start bullmq workers only in production unless explicitly enabled
```

É o ÚNICO commit entre `1f766b2` e `6277d6c7` (`git rev-list --count 1f766b2..HEAD` = 1). Ele toca `.env.example`, `server/index.ts`, `server/lib/env.ts`, `server/lib/envWorkers.test.ts` e `server/startServerWorkers.test.ts`. Não toca `finance_transactions`, Asaas nem reembolso. Consequência prática: **todas as âncoras de linha do prompt 01 casaram exatamente** (`admin.ts:5853`, `:2959`, `:3100`, `:3915`, `:4226`, `:5126`, `:5742`, `:860`, `chargeSemDono.ts:289`, `overviewSeries.ts:442`, `stripeSync.ts:504`, `env.ts:99-117`). As linhas citadas abaixo são as do `HEAD_FINAL`.

---

## 1. Respostas diretas

### A. Claim `admin_role`

**Nasce FORA do repositório: a função `custom_access_token_hook` existe no banco, nenhuma migration a declara, e o próprio guard de migrations a mantém numa lista de exceção para não acusar o drift.**

Evidência:

- `scripts/checkMigrationsApplied.mts:762`: `"custom_access_token_hook"` está dentro do `const DE_EXTENSAO`, o conjunto documentado em `scripts/checkMigrationsApplied.mts:745-763` como "existe no banco e nenhuma migration declara". A lista foi escrita para funções de extensão (`unaccent`, `show_trgm`, `gtrgm_in`); o hook entrou junto.
- `shared/database.types.ts:3923`: `custom_access_token_hook: { Args: { event: Json }; Returns: Json }`. Os tipos são gerados do banco, então a função existe lá.
- `rg -n "custom_access_token" supabase/migrations/` não retorna nada. Nenhuma migration a cria.
- `supabase/config.toml:279-281`: o bloco `[auth.hook.custom_access_token]` está COMENTADO, exatamente como vem no template do Supabase CLI. A habilitação também não está versionada.

**O que precisaria ser versionado** para um ambiente reconstruído a partir das migrations nascer igual a produção: (1) o `CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb) RETURNS jsonb`, com o corpo que lê `public.admin_roles`; (2) `GRANT EXECUTE ... TO supabase_auth_admin` e o `REVOKE` de `anon`/`authenticated`; (3) `GRANT SELECT ON public.admin_roles TO supabase_auth_admin`, sem o qual o hook roda e não enxerga a tabela; (4) a habilitação, que hoje é um toggle no dashboard (Authentication, Hooks) e não tem equivalente versionável a não ser descomentar o bloco do `config.toml`, que só vale para o Supabase local. O item (4) é o que o CLAUDE.md chamaria de pré-requisito externo não versionável, no mesmo molde do `vault.secrets 'cron_secret'` citado em `supabase/migrations/20260717120000_reschedule_sync_jobs_12h.sql:16-17`.

**Até quando uma conta removida de `admin_roles` continua vendo a casca do admin: até o access token atual expirar.** Não há `refreshSession` forçado em nenhum ponto do caminho de admin.

- `client/src/hooks/useAdmin.ts:39-46`: lê a claim com `readAdminClaim(session.access_token)` e, se ela existir, faz `setIsAdmin(true)` e RETORNA. A rede não é tocada. O `fetch("/api/admin/me")` de `useAdmin.ts:49-51` é fallback, só alcançado quando a claim não está no token.
- `client/src/pages/Admin.tsx:6899-6912`: o mesmo desenho no gate da página. Com claim presente, `setAccessState("allowed")` e os dados carregam em background; `adminFetch("/me")` (`Admin.tsx:6919`) só roda no fallback.
- `client/src/lib/adminClaim.ts:1-4`: o cabeçalho declara que a função não verifica assinatura e que a autoridade continua no backend, "que valida via RPC a cada request". Isso é verdade para os DADOS (cada rota de `/api/admin/*` revalida), mas não para a CASCA: a interface abre e as abas aparecem.
- Único `refreshSession` no client: `client/src/contexts/FavoritesContext.tsx:198`, sem relação com admin.

**TTL do access token: `jwt_expiry = 3600` em `supabase/config.toml:160`** (uma hora). Ressalva honesta: esse arquivo é a configuração do Supabase LOCAL; o valor efetivo do projeto remoto é o do dashboard e não está no repositório. Não medi o projeto remoto (rodada de leitura de código). Com rotação de refresh token ligada (`config.toml:166`), o `getSession()` do supabase-js renova sozinho quando o token expira, e o token novo passa pelo hook de novo, sem a claim. Então o teto é o TTL, não indefinido.

### B. Cadência de `/finance/sync`

**Os dois: um cron diário às 04:20 com janela de 7 dias, e um botão manual SEM janela nenhuma, que varre a conta inteira desde sempre. Idempotente por `stripe_balance_transaction_id`, sem risco de dupla contagem.**

Evidência:

- Cron: `supabase/migrations/20260714130200_schedule_sync_finance.sql:13-17`, `cron.schedule('sync-finance', '20 4 * * *', $$SELECT public.call_cron_endpoint('/api/cron/sync-finance')$$)`. Nenhuma migration posterior reagenda esse job (a `20260717120000_reschedule_sync_jobs_12h.sql` reagenda `sync-jobs`, que é o de VAGAS, não este).
- Janela do cron: `server/routes/cron.ts:1474-1477` monta `since = agora - SYNC_FINANCE_WINDOW_DAYS dias` e chama `syncBalanceTransactions({ since })`. `SYNC_FINANCE_WINDOW_DAYS = 7` em `server/lib/financeSyncWindow.ts:37`.
- Botão manual: `server/routes/admin.ts:5853-5855`, `syncBalanceTransactions({})`. **Sem `since`.** Em `server/lib/stripeSync.ts:417-419` o `created.gte` só entra quando `params.since` existe, e `stripeSync.ts:448` usa auto-paginação (`for await`), que percorre TODAS as páginas. Ou seja, o botão relista a conta inteira. Não é bug (o upsert é idempotente), mas é um custo muito diferente do que o rótulo "sincronizar agora" sugere, e diferente do que o comentário de `financeSyncWindow.ts:21-24` mediu (aquele custo é o do cron).
- Mais três chamadores, todos com janela de 2 dias: o webhook da Stripe em `server/providers/stripe.ts:2046-2048` (eventos `charge.succeeded`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`); a rota de reembolso em `server/routes/admin.ts:4101-4103`; a de devolução externa em `server/routes/admin.ts:4418-4420`, e só quando `settlement === "stripe_dashboard"`.
- Idempotência: `server/lib/stripeSync.ts:519`, `{ onConflict: "stripe_balance_transaction_id" }`, sobre o UNIQUE da coluna. **Não há risco de dupla contagem** entre manual e cron: a segunda passada reescreve a mesma linha. O upsert reescrever `user_id` é intencional e é o mecanismo pelo qual uma linha órfã se conserta sozinha (`financeSyncWindow.ts:10-16`).
- Charge cuja `user_id` não resolve: `stripeSync.ts:469-502` tenta, em ordem, `refs.customerId`, depois `refs.paymentIntentId` (caminho do boleto), depois `refs.parentChargeId` (refund e dispute, pela cobrança-mãe). Falhando tudo, a linha entra com `user_id` NULL, sem erro. O caminho do "sem dono" começa aí: `server/lib/chargeSemDono.ts:286-296` lista `type='charge' AND user_id IS NULL`, e o cron `detect-orphan-payments` (`supabase/migrations/20260727120100_schedule_detect_orphan_payments.sql`, `'50 */6 * * *'`) registra em `billing_orphan_payments`. A faixa de saúde conta o mesmo conjunto por outro caminho, em `server/routes/admin.ts:858-869`.

Observação de fuso, não medida: `pg_cron` roda no fuso do banco, que num projeto Supabase é UTC. `'20 4 * * *'` seria 01:20 em Brasília, não 04:20. O comentário em `supabase/migrations/20260714130200_schedule_sync_finance.sql:12` diz "uma vez por dia, 04:20" sem qualificar o fuso, e o de `20260715150100_schedule_subscription_snapshot.sql:18` diz explicitamente "05:10 UTC". Não conferi `cron.job` no banco. Fica como pergunta na seção 8.

### C. `trialing` em "Assinantes Pro"

**`trialing` CONTA. O rótulo "Quem tem assinatura paga" está errado, e o comentário que afirma o contrário, três linhas acima do rótulo, também.**

Evidência da cadeia inteira:

- `server/lib/userListEnrichment.ts:24`: `const STATUS_QUE_DAO_PRO = new Set(["active", "trialing"]);`
- `server/lib/userListEnrichment.ts:67`: `if (!row.status || !STATUS_QUE_DAO_PRO.has(row.status)) return false;` Logo `trialing` passa e `past_due` não.
- `server/lib/userListEnrichment.ts:68-72`: `current_period_end` nulo concede; caso contrário exige `fim > now`. Data ilegível é fail-closed (`Number.isNaN` devolve false).
- `server/lib/userListEnrichment.ts:149-150`: `is_pro` e `pro_source` saem daí, e `tallyProSources` (`:196-208`) conta `pro_source === "subscription"` mais `both` em `bySubscription`.
- `server/routes/admin.ts:497-499`: `contarProPorOrigem` devolve exatamente esse tally, sobre TODAS as assinaturas paginadas.
- `server/routes/admin.ts:1244`: o resultado vira `acessoPro` no payload de `/overview`.
- `client/src/pages/Admin.tsx:7221-7222`: `label: "Assinantes Pro"`, `value: formatCount(c.acessoPro.bySubscription)`.

A RPC concorda com o TypeScript, condição a condição. Versão vigente de `is_user_pro`, a migration mais recente que a redefine, `supabase/migrations/20260716130100_add_influencer_to_is_user_pro.sql:22-36`:

```sql
and p.code != 'free'
and s.status in ('active', 'trialing')
and (s.current_period_end is null or s.current_period_end > now())
```

Respostas pedidas, uma a uma:

| Pergunta | Resposta | Linha |
| --- | --- | --- |
| `trialing` conta? | **Sim** | `userListEnrichment.ts:24`; RPC `:28` da migration |
| `past_due` conta? | **Não** | mesmo conjunto, por ausência |
| `active` com `current_period_end` no passado conta? | **Não** | `userListEnrichment.ts:72`, `fim > now.getTime()` |

**O rótulo mente em dois lugares, e um deles é um comentário que afirma o oposto do código.**

1. `client/src/pages/Admin.tsx:762`: `detail: "Quem tem assinatura paga"`. Um trial não pagou nada.
2. `client/src/pages/Admin.tsx:7229-7231`, no detalhe do MESMO card:

   ```
   // TRIALING FORA DO HEADLINE: trial não paga, e por isso o MRR o exclui
   // de propósito. Somá-lo ao número de pagantes faria o card divergir do
   // MRR no primeiro trial.
   ```

   O comentário está descrevendo o MRR, onde é verdade (`server/lib/billingMetrics.ts:290-293` faz `continue` em `trialing`), e afirmando por tabela que o headline também exclui. Não exclui: o headline é `acessoPro.bySubscription`, e `bySubscription` inclui `trialing`. A divergência que o comentário diz evitar é exatamente a que existe hoje: **`activeCount` do MRR e `bySubscription` do card discordam pelo número de trials**, e os dois cards ficam lado a lado.

**Por quanto.** Com as contagens da seção 2 do prompt (a distribuição por `provider:status:renewal_type:payment_method`), nenhum `trialing` aparece: são 101 + 15 + 14 + 1 = 131 linhas `active` e 8 `past_due`. **Se a distribuição estiver completa, o erro é de ZERO hoje.** Ele é latente, não corrente: nasce no primeiro trial. Isso também explica por que o próprio detalhe do card já imprime `c.mrr.trialingCount` (`Admin.tsx:7232`) sob condição `> 0`, e ninguém viu a linha aparecer.

---

## 2. Leitores de `finance_transactions`

Conjunto completo em `server/`, por `rg -n 'from("finance_transactions")' server/`, excluindo testes: 13 ocorrências, 2 delas escrita (`stripeSync.ts:337` é leitura de apoio ao próprio sync, `:504` é o upsert). Os 11 leitores de consumo estão abaixo. **`server/routes/cron.ts` NÃO tem ocorrência direta**: a única menção é o comentário de `cron.ts:1400`; ele lê a tabela indiretamente, por `detectarChargesSemDono` (`cron.ts:18`), que é o leitor 3.

Legenda da coluna de veredito, sob a hipótese da seção 3 do prompt 01 (coluna `provider`, `provider_transaction_id`, `stripe_balance_transaction_id` nullable):

- **conserta** = passa a enxergar Pix sem mudança de código
- **pequena** = enxerga, mas um rótulo ou filtro precisa mudar
- **quebra** = produz resultado errado ou silenciosamente omite a linha

| # | Arquivo:linha | O que calcula | Colunas e types usados | Assume Stripe em | Veredito | Rótulo no client a corrigir |
| --- | --- | --- | --- | --- | --- | --- |
| 1a | `server/lib/financeMetrics.ts:164-178` (`loadTransactions`), consumido por `:199` e `:278` | Receita bruta, líquida, taxas, reembolsos, receita por plano, série mensal | `type, gross_cents, fee_cents, net_cents, plan_code, occurred_at`. Types: `charge`, `refund`, `adjustment`, `dispute` (`:59-64`); `payout` excluído | Só no NOME do campo de saída `taxasStripeCents` (`:93`, `:209`, `:241`). Nenhuma coluna Stripe é lida | **conserta**, com rótulo | `client/src/components/admin/FinanceDashboard.tsx:359` "Taxas Stripe"; `client/src/pages/Admin.tsx:7258` "taxas"; `Admin.tsx:8065` "fonte: Stripe balance transactions" |
| 1b | `server/lib/financeMetrics.ts:349-361` (`getDeferredRevenue`) | Receita diferida de planos semestral e anual | `gross_cents`, filtra `type='charge'` e `user_id` | Não lê coluna Stripe. Mas cruza com `subscriptions` sem filtro de provider (`:322-331`) | **pequena** | nenhum |
| 2 | `server/lib/overviewSeries.ts:440-447` | Série `receitaBrutaCents` da Visão | `type, gross_cents, occurred_at`; filtra `type === "charge"` em `:526-528` | Nada | **conserta** | nenhum direto. Ver o descompasso descrito abaixo da tabela |
| 3 | `server/lib/chargeSemDono.ts:286-296` (`LOOKUPS_REAIS.listarSemDono`) | Detector de cobrança sem dono, alimenta `billing_orphan_payments` | `stripe_charge_id, gross_cents, currency, occurred_at, raw_payload`; `type='charge'`, `user_id is null` | **Sim, três vezes.** `linhaDoBanco` (`:270-283`) lê `raw_payload.source.billing_details.email` e `raw_payload.source.customer`, que é o shape da balance transaction da Stripe. E `:166-167` filtra `l.stripeChargeId &&` | **QUEBRA** (ver seção 3) | `client/src/components/admin/OrphanPaymentsPanel.tsx:270` "A Stripe registrou o pagamento"; `:7`, `:71-73` |
| 4 | `server/routes/admin.ts:858-869` | Faixa de saúde, item "cobranças sem dono" | `gross_cents`; `type='charge'`, `user_id is null`, `occurred_at <` corte | **Não assume nada.** Não lê `stripe_charge_id` nem `raw_payload` | **conserta** | `server/lib/healthBand.ts:235-238`, texto "Resolva em Pagamentos órfãos", que aponta para uma tela que não teria a linha (ver seção 3) |
| 5 | `server/routes/admin.ts:2957-2961`, via `server/lib/userListPaidTotals.ts` | "Valor pago" por linha da lista de usuários | `user_id, type, gross_cents`. Types que contam: `charge`, `refund`, `dispute` (`userTransactions.ts:23`) | Nada. Segunda fonte é `admin_refunds` | **conserta** | nenhum |
| 6 | `server/routes/admin.ts:3099-3102` | "Valor pago (total)" do modal de detalhe | `type, gross_cents`, `eq user_id` | Nada | **conserta** | nenhum |
| 7 | `server/routes/admin.ts:3913-3919` (rota `POST /users/:id/refunds`) | Recomputa escopo e teto do reembolso | `id, type, gross_cents, fee_cents, net_cents, currency, occurred_at, stripe_charge_id, stripe_invoice_id, plan_code` | **Sim.** O alvo é achado por `item.stripe_charge_id === chargeId` (`admin.ts:3944-3945`) | **QUEBRA** (404 para Pix) | nenhum: a tela não oferece a ação, porque não há id |
| 8 | `server/routes/admin.ts:4224-4230` (rota `POST /users/:id/external-refunds`) | Mesmo recompute, para devolução declarada | idem | **Sim**, mesma busca por `stripe_charge_id` (`admin.ts:4253-4254`) | **QUEBRA** (404 para Pix) | nenhum |
| 9 | `server/routes/admin.ts:5124-5135`, via `server/lib/userTransactions.ts` | Extrato do usuário, com estado de reembolso por cobrança | as 10 colunas do leitor 7 | **Sim, parcialmente.** `agregarPorCobranca` (`userTransactions.ts:175-190`) indexa por `stripe_charge_id` e descarta linha sem ele (`:181`) | **pequena para a soma, QUEBRA para o teto** (ver seção 3) | nenhum |
| 10 | `server/routes/admin.ts:5740-5748` (rota `GET /finance/transactions`) | Tabela paginada da aba Financeiro | `id, stripe_charge_id, stripe_invoice_id, type, gross_cents, fee_cents, net_cents, currency, occurred_at, user_id, plan_code` | Só nos nomes das colunas expostas | **pequena** (coluna de id sairia vazia) | `client/src/components/admin/FinanceDashboard.tsx:419` e `:423` "Extrato da Stripe"; `:249` "Falha ao sincronizar com a Stripe" |
| 11 | `server/routes/cron.ts` | **Nenhuma ocorrência direta.** Lê por `detectarChargesSemDono` (`cron.ts:18`, `:1400` comentário) | herda do leitor 3 | herda | herda a QUEBRA | ver leitor 3 |

**Descompasso que a hipótese não cria, mas expõe, no leitor 2.** Na mesma função `montarSeriesDaVisao`, a série `receitaBrutaCents` vem de `finance_transactions` (`overviewSeries.ts:440`) e a série `conversoesPro` vem de `subscriptions` (`overviewSeries.ts:452-458`, agrupada em `:534-543`), que não tem filtro de provider. **Hoje, um pagamento Pix já produz uma barra em "Conversões Pro" e ZERO em "Receita bruta", no mesmo gráfico, no mesmo dia.** O mesmo vale para o funil (`overviewSeries.ts:625-627`, `usuariosPro` sai de `assinaturas`) e para o MRR e "Assinantes Pro", que leem `subscriptions`. É a assimetria descrita no achado 1 do prompt, e ela é visível numa única tela.

---

## 3. O que a hipótese da seção 3 não cobre (PARE)

Sete pontos. Os quatro primeiros são caminhos SEM cobertura nenhuma, e a hipótese, do jeito que está escrita, não os menciona.

### 3.1. O detector de cobrança sem dono descarta a linha Asaas em silêncio, e a faixa de saúde não

`server/lib/chargeSemDono.ts:166-167`:

```ts
const candidatas = linhas.filter(
  (l) => l.stripeChargeId && passouDoCorte(l.occurredAt, agoraMs, corteDias),
);
```

Sob a hipótese, uma linha Asaas tem `stripe_charge_id` NULL (o id do pagamento vai para `provider_transaction_id`). O `&&` a elimina antes de qualquer verificação. O scan devolve `encontradas: 0`, `leituraOk: true`, `naoVerificadas: 0`, a run do cron sai `success` e nada é gravado em `billing_orphan_payments`.

**Enquanto isso, o leitor 4, a faixa de saúde (`admin.ts:858-869`), CONTA a mesma linha**, porque não filtra por `stripe_charge_id`. Resultado: a faixa diz "R$ X em 1 cobrança sem usuário atribuído" e manda "Resolva em Pagamentos órfãos" (`server/lib/healthBand.ts:235-238`), e a tela de Pagamentos órfãos está vazia. Duas telas discordando, e a que fica calada é a que tem o botão de agir.

Fosse só o filtro, seria mudança pequena. Não é: `linhaDoBanco` (`chargeSemDono.ts:270-283`) extrai email e customer de `raw_payload.source.billing_details.email` e `raw_payload.source.customer`. O `raw_payload` de uma linha Asaas é o objeto `payment` do evento (as chaves estão na seção 2 do prompt), que não tem `source`. `textoEm` devolveria null nos dois, e o item entraria com `candidatoVerificado: false` (`chargeSemDono.ts:184-187`), o que mantém a run em `partial` para sempre. O email do pagador Pix EXISTE, mas noutro lugar: `raw_payload.customer` é o id do cliente no Asaas, e resolvê-lo exige chamada à API do Asaas, equivalente ao `emailDoCustomer` que hoje só fala com a Stripe (`chargeSemDono.ts:305-320`).

### 3.2. Estorno Asaas não tem caminho nenhum, e o evento nem é gravado

Eventos tratados hoje, `server/providers/asaas.ts:626-628`:

```ts
const PAYMENT_EVENTS = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);
const CLOSING_EVENTS = new Set(["PAYMENT_OVERDUE", "PAYMENT_DELETED"]);
```

**`PAYMENT_REFUNDED` não está em nenhum dos dois.** E o efeito é pior do que "não processa": em `server/providers/asaas.ts:704-711`, o `if (!handled)` retorna ANTES do upsert em `billing_events` (`:719-733`). Então um estorno de Pix não deixa rastro em lugar nenhum: nem linha em `billing_events`, nem mudança em `subscriptions`, nem linha de `refund`. O log `console.log("[webhook/asaas] event nao handled: ...")` é tudo o que sobra, e não é consultável por tela nenhuma.

A hipótese diz "Eventos de estorno do Asaas (`PAYMENT_REFUNDED` e equivalentes): linha `type='refund'` com sinal negativo". Isso pressupõe um handler que não existe. **A hipótese precisa incluir, antes disso, acrescentar o evento a `PAYMENT_EVENTS` ou a um terceiro conjunto, e decidir o que ele faz com a assinatura** (revogar? o `decidirERevogar` não alcança Asaas, ver 3.4).

Nota de nomenclatura, não verificada contra a documentação do Asaas: existe também `PAYMENT_REFUND_IN_PROGRESS` e, para estorno parcial, `PAYMENT_PARTIALLY_REFUNDED`. Não confirmei os nomes exatos, e o payload real desses eventos não está entre os 6 eventos existentes medidos na seção 2 do prompt (1 `PAYMENT_RECEIVED`, 5 `PAYMENT_DELETED`). Pergunta na seção 8.

### 3.3. Assinatura Pix que vence nunca muda de status, e por isso nunca entra no churn

Não existe job que expire assinatura `renewal_type='manual'` vencida. Verificado nos três candidatos:

- `POST /api/cron/process-cancellations` (`server/routes/cron.ts:445-470`) exige `cancel_at_period_end = true`. Uma assinatura Pix que simplesmente não foi renovada tem esse campo falso, então a linha nunca é selecionada.
- `POST /api/cron/expire-pending-boletos` (`server/routes/cron.ts:793`) age sobre `status='pending'`, não sobre `active` vencida.
- `POST /api/cron/expiring-subscriptions` (`server/routes/cron.ts:607`) só ENVIA e-mail; não muda status. E exclui Asaas explicitamente (ver 3.4).

**Consequência medida no código:** a linha fica `status='active'` com `current_period_end` no passado, indefinidamente. O acesso PARA (tanto `is_user_pro` quanto `subscriptionGrantsPro` exigem `current_period_end > now`), mas o registro não. Como `canceled_at` nunca é preenchido e não nasce linha em `subscription_cancellations`, **ela não entra no churn**: `contarSaidasEfetivas` (`server/lib/billingMetrics.ts:504-546`) conta por `canceled_at` na janela ou por cancelamento `completed`, e a Pix vencida não tem nem um nem outro.

Efeito colateral no denominador: `tallySubscriptionStatuses` (`server/lib/subscriptionSnapshots.ts:30-47`) é um tally CRU da coluna `status`, sem filtro de período, então `by_status['active']` cresce monotonicamente com Pix vencidos. O cabeçalho do arquivo (`:11-16`) já avisa que `by_status` e `active_count` divergem por construção; o Pix aumenta essa divergência sem teto.

Se a hipótese for implementada como está, uma assinatura Pix passará a ter cobrança e receita corretas e continuará invisível no churn. **A hipótese não menciona expiração.**

### 3.4. Três caminhos filtram `provider = 'stripe'` ou excluem Asaas, e um deles é a revogação de acesso

| Sítio | Filtro | Efeito para Pix |
| --- | --- | --- |
| `server/routes/admin.ts:4629` (`POST /users/:id/subscription/cancel`) | `.eq("provider", "stripe")` | 404 `"Nenhuma assinatura ativa encontrada."`, mensagem falsa: a assinatura existe e está ativa |
| `server/routes/admin.ts:3679` (`decidirERevogar`) | `.eq("provider", "stripe")` | Reembolso que zerasse o saldo NÃO revogaria o acesso. Devolveria `no_active_subscription`, que a tela lê como "não havia o que revogar" |
| `server/routes/cron.ts:595` (`selecionarAssinaturasAVencer`) | `.neq("provider", "asaas")` | Nenhum lembrete de renovação. Este é DELIBERADO e datado: `cron.ts:579-583` documenta a exclusão e marca pendência "até JANEIRO DE 2027" |

O terceiro é decisão registrada, com prazo. Os dois primeiros não têm nota nenhuma sobre Asaas: o de `cancel` justifica em seguida o caso boleto (`admin.ts:4645-4653`, `renewal_type === "manual"` devolve 409 com texto sobre boleto), um ramo que uma linha Asaas nunca alcança porque o filtro de provider já a eliminou antes.

**O caso do `decidirERevogar` é o mais grave dos dois**, porque ele é o mecanismo que existe para impedir "dinheiro devolvido e acesso mantido" (`server/lib/proRevocation.ts:6-9`). Para Pix ele está desligado por um filtro.

Ponto que funciona por construção e vale registrar: `precisaCancelarNaStripe` (`server/lib/proRevocation.ts:111-115`) devolve `renewal_type !== "manual" && Boolean(provider_subscription_id)`. Uma linha Asaas é `manual`, então a função devolve false e **nenhuma chamada externa é feita**, que é o certo (no Asaas o objeto é uma cobrança avulsa, não uma assinatura recorrente; não há o que cancelar lá). O raciocínio está certo para Asaas, mas o docstring (`proRevocation.ts:100-110`) só fala de boleto e Stripe. Se alguém um dia trocar o critério de `renewal_type` para `provider`, isso quebra em silêncio.

### 3.5. O extrato mostra a cobrança Pix e mente sobre quanto ainda dá para devolver

Sob a hipótese, a linha Asaas entra em `finance_transactions` com `stripe_charge_id` NULL. No extrato:

- `total_paid_cents` fica **certo**: `totalPagoCents` (`server/lib/userTransactions.ts:134-150`) soma por `type` e `gross_cents`, sem tocar em id.
- `refundable_cents` fica **errado**: `buildTransactionList` (`userTransactions.ts:219-222`) só busca o agregado quando `row.stripe_charge_id` existe; sem ele, usa `AGREGADO_ZERO`. Então `refundable_cents = gross_cents` SEMPRE, mesmo depois de um estorno.
- Uma linha Asaas de `refund` seria **descartada** da agregação por `userTransactions.ts:181` (`if (!row.stripe_charge_id) continue;`), então nem apareceria como reembolso ligado à cobrança.

Isso não é cosmético: `refundable_cents` é o TETO que autoriza devolver dinheiro (`server/lib/refund.ts:150-152`) e é o insumo de `devolucaoZeraOSaldo` (`proRevocation.ts:85-90`). Um teto que nunca desce é a direção insegura, a mesma que `userTransactions.ts:250-254` diz ter sido evitada de propósito ao tornar `declaradas` obrigatório.

**A hipótese não diz o que fazer com `agregarPorCobranca`.** A chave de junção precisa passar a ser a mesma que o resto: `(provider, provider_transaction_id)`, ou uma coluna única derivada. Enquanto for `stripe_charge_id`, Pix não liga cobrança a estorno.

### 3.6. Uma frente não mergeada acopla nota fiscal a `stripe_charge_id`

`bnt-fiscal` e `bnt-nfsen` criam `public.fiscal_invoices` com `stripe_charge_id` UNIQUE como chave de idempotência e de junção. O comentário da migration (`supabase/migrations/20260804120000_create_fiscal_invoices.sql`, no diff dessas branches, linhas 14-19 do arquivo novo) diz:

> CHAVE DE IDEMPOTENCIA E DE JUNCAO: stripe_charge_id, unique. E a MESMA coluna de finance_transactions.stripe_charge_id

E o cron `reconcile-fiscal-invoices` (`'55 */6 * * *'`) "varre finance_transactions da janela". Sob a hipótese, **um pagamento Pix nunca gera nota fiscal**, porque não tem `stripe_charge_id` para casar, e o UNIQUE em Postgres aceita múltiplos NULL, então nem colide: simplesmente não junta. Detalhe: essa frente já mede que a taxa NÃO deduz da base da nota (o comentário diz que `amount_cents` é o bruto e "NAO deriva de finance_transactions.net_cents"), o que é consistente com o Pix, onde a taxa também é despesa nossa.

Isso não derruba a hipótese, mas define uma ordem: **se `fiscal_invoices` subir antes da coluna `provider`, ela nasce com a mesma dívida**, e corrigir depois exige migration numa tabela que guarda CPF.

### 3.7. Duas premissas menores da hipótese que a leitura não confirma

- **"`user_id` e `plan_code` vindos da row de `subscriptions` já localizada por `findSubscriptionRow`".** Correto quanto ao `user_id`: `findSubscriptionRow` (`server/providers/asaas.ts:786-816`) seleciona `id, user_id, status, plan_id, affiliate_code, coupon_code`. Mas **`plan_code` não está no select**: só `plan_id`. O `activateOnPayment` faz uma segunda consulta para obtê-lo (`asaas.ts:868-872`, `.from("plans").select("code, name").eq("id", row.plan_id)`). A hipótese precisa reusar essa consulta ou acrescentar o embed.
- **"`gross_cents = round(value*100)`".** Já existe função pronta e testada para isso, `paidAmountCentsFromAsaas` (`server/providers/asaas.ts:645-649`), que faz `Math.round(amount * 100)` e devolve **`null`, não zero**, quando o campo não é numérico. O cabeçalho dela (`:632-643`) explica por que a distinção importa. A hipótese deve usá-la, não reimplementar o `round`, ou a base ganha a terceira montagem da mesma conversão.

---

## 4. Campo de data e taxa

### O campo que deve virar `occurred_at`

**Recomendação: `confirmedDate`, com fallback para `paymentDate` e, só então, `clientPaymentDate`.** Justificativa e ressalva abaixo, nessa ordem, porque a ressalva é grande.

O que a leitura estabelece com certeza:

1. **Hoje NENHUM campo de data do payload é usado.** `activateOnPayment` usa o relógio do servidor: `server/providers/asaas.ts:876-877`, `const paidAt = new Date();` e `const paidAtIso = paidAt.toISOString();`. Esse valor vira o `p_last_event_at` da RPC (`:907`) e a âncora do período (`:894-900`). O único campo de data do payload que chega ao banco é indireto: `p_raw_payload: event` (`asaas.ts:908`) persiste o evento INTEIRO em `subscriptions.raw_provider_payload`, então `paymentDate`, `clientPaymentDate` e `confirmedDate` estão lá, sem serem lidos.
2. **`event.dateCreated` é lido**, e vai para `billing_events.event_created_at` (`asaas.ts:726`). É a data do EVENTO, não a do pagamento.
3. **Semântica dos três candidatos, pelo que o próprio Asaas nomeia:** `clientPaymentDate` é quando o cliente diz ter pago; `paymentDate` é a data de pagamento registrada; `confirmedDate` é quando o Asaas CONFIRMOU o recebimento. Para Pix os três tendem a coincidir no mesmo dia, porque a liquidação é imediata; para boleto eles divergem em dias.

Por que `confirmedDate` primeiro: `finance_transactions` é declaradamente regime de CAIXA (`server/lib/financeMetrics.ts:4-7`), e o análogo da Stripe é `bt.created` da balance transaction (`stripeSync.ts:514`), que é o instante em que a Stripe reconheceu o movimento na conta, não o instante em que o cartão foi apresentado. `confirmedDate` é o campo do Asaas com essa semântica. `clientPaymentDate` é o pior candidato dos três porque é declaração do pagador.

**A ressalva, e ela é o motivo de eu não fechar isso sozinho.** Os três campos aparecem na lista de chaves da seção 2 do prompt, mas o prompt não traz os VALORES do evento `PAYMENT_RECEIVED` real. Não sei, sem olhar o dado:

- se `confirmedDate` vem preenchido num `PAYMENT_RECEIVED` de Pix (pode vir null e só ser preenchido em `PAYMENT_CONFIRMED`);
- **em que formato cada um vem.** `dueDate` é `YYYY-MM-DD` e `expirationDate` do QR foi medido como `"2027-09-03 23:59:59"`, 19 caracteres, espaço no lugar do `T` e SEM offset (`client/src/lib/pixExpiration.ts:20-24`, medição de 2026-09-01). Se `confirmedDate` for `YYYY-MM-DD`, ele **não serve como `occurred_at`**: a coluna é `timestamptz` e um dia civil sem hora viraria meia-noite, jogando a receita para o dia errado sistematicamente.

**Tratamento de fuso, que a hipótese vai precisar e que hoje não existe no servidor.** O parse correto já está escrito, testado, e mora no CLIENT: `parseAsaasDate` em `client/src/lib/pixExpiration.ts:39-72`, do commit `bc75bdd feat(pix): parse provider expiration date with explicit brasilia offset`. Ele resolve exatamente este problema: string sem offset nunca entra crua em `new Date()` (`pixExpiration.ts:25-29`: Chrome interpreta como hora local do navegador, Safari devolve `Invalid Date`), e o offset entra explícito como `-03:00` (`:11`), justificado em `:31-33` pelo fato de o Brasil ter abolido o horário de verão em 2019. Para `YYYY-MM-DD` puro ele devolve o FIM do dia em Brasília (`:64-69`), escolha conservadora que faz sentido para prazo e **não faz sentido para `occurred_at`**.

Ou seja: **a função certa existe, está no lado errado, e a regra do `YYYY-MM-DD` dela é a errada para este uso.** Mover `parseAsaasDate` para `shared/` é o caminho barato (é pura, sem dependência de DOM), mas a política do dia-sem-hora precisa ser decidida à parte para `occurred_at`. Não decido isso aqui.

### A taxa

`value - netValue`, exatamente como o prompt registrou, e o mapeamento cai limpo:

```
gross_cents = paidAmountCentsFromAsaas(event)          // Math.round(value * 100)
net_cents   = Math.round(netValue * 100)
fee_cents   = gross_cents - net_cents
currency    = "BRL"
```

Isso preserva a invariante que `financeMetrics.ts:209-210` assume, `taxasStripeCents += t.fee_cents` e `receitaLiquidaCents += t.net_cents` sobre TODA linha de receita, sem inspecionar provider. É por isso que o leitor 1a "conserta sozinho": ele já soma três campos independentes, e a única coisa Stripe nele é o nome do campo de saída.

Uma ressalva de sinal: `fee_cents` da Stripe é positivo e `net = gross - fee`. Para o Asaas, `netValue` já vem líquido, então a subtração dá o mesmo sinal. Mas em linha de `refund` a Stripe grava `gross_cents` NEGATIVO (invariante declarada na coluna, citada em `server/lib/userTransactions.ts:130-131` e `admin.ts:3086-3088`), e o estorno do Asaas viria com `value` positivo no payload. **A conversão de estorno precisa negar explicitamente**, e isso é fácil de esquecer porque o caminho de charge não precisa.

### Exemplo real

Não posso dar um. Os dados de `billing_events` que tenho são os da seção 2 do prompt, que listam as CHAVES presentes em `raw.payment`, não os valores. O único evento de pagamento existente é 1 `PAYMENT_RECEIVED` (contra 5 `PAYMENT_DELETED`), e nem seu `id` de pagamento nem seus valores estão no prompt. Esta rodada é de leitura de código e não consultei o banco. **Não invento o exemplo.** O que precisa ser extraído, e cabe em uma consulta que não toca dado pessoal:

```sql
select raw->'payment'->>'id',
       raw->'payment'->>'value',      raw->'payment'->>'netValue',
       raw->'payment'->>'paymentDate', raw->'payment'->>'clientPaymentDate',
       raw->'payment'->>'confirmedDate', raw->'payment'->>'creditDate'
from billing_events
where provider = 'asaas' and event_type = 'PAYMENT_RECEIVED';
```

---

## 5. Reembolso, cancelamento, expiração e risco para Pix

**Reembolso pela rota da Stripe (`POST /users/:id/refunds`, `server/routes/admin.ts:3873`).** Hoje, com Pix fora de `finance_transactions`, a rota nem chega perto: o `select` de `admin.ts:3913-3919` filtra por `user_id` e não traz linha nenhuma para o Pix. **Sob a hipótese, ela passa a trazer a linha e ainda assim falha**, em `admin.ts:3944-3945`, `extrato.items.find((item) => item.stripe_charge_id === chargeId && item.type === "charge")`: com `stripe_charge_id` NULL, `alvo` é `undefined` e a rota devolve 404 `charge_not_found`, "Cobrança não encontrada para este usuário." **Não existe guarda por `provider` em lugar nenhum da rota.** A proteção que existe é acidental e vem do formato do id, e ela é frágil: `server/lib/refund.ts:127` recusa boleto por `charge.is_boleto`, que nasce de `chargeId.startsWith("py_")` em `admin.ts:3966`, uma heurística de prefixo da Stripe. Se a hipótese algum dia preencher `stripe_charge_id` com o id do Asaas (`pay_...`), a rota tentaria `refunds.create` na Stripe com um id do Asaas. O 404 é o comportamento certo hoje, mas é certo por acaso, e uma mensagem errada: a cobrança existe.

**Devolução externa (`POST /users/:id/external-refunds`, `server/routes/admin.ts:4171`).** Deveria ser o caminho natural para Pix, já que registra um ato feito fora e não emite nada (`refund.ts:96-102` documenta que `permitirBoleto: true` existe justamente para essa rota). **Como está, não serve:** ela usa exatamente a mesma busca por `stripe_charge_id` (`admin.ts:4253-4254`) e devolve o mesmo 404. Para servir, precisa achar a cobrança pela chave nova, e a coluna `admin_refunds.stripe_charge_id` (lida em `admin.ts:2962` e `userTransactions.ts:34`) precisaria de um par equivalente, senão a declaração externa fica sem a que ligar.

**Cancelamento (`POST /users/:id/subscription/cancel`, `server/routes/admin.ts:4598`).** Para uma assinatura Asaas, **nada acontece e a mensagem é falsa.** O `select` de `admin.ts:4622-4632` tem `.eq("provider", "stripe")`, então `sub` é null e a rota devolve 404 `not_found`, "Nenhuma assinatura ativa encontrada.". A pessoa TEM assinatura ativa. Nenhuma chamada ao Asaas é feita, e nem deveria: `precisaCancelarNaStripe` (`server/lib/proRevocation.ts:111-115`) já devolveria false por `renewal_type === "manual"`, e no Asaas não existe assinatura recorrente para cancelar, só uma cobrança avulsa já paga. **O que deveria acontecer** é o mesmo que o boleto recebe hoje: um 409 com texto honesto ("não renova sozinha, o acesso termina no fim do período já pago"), que é literalmente o ramo de `admin.ts:4645-4653` que o filtro de provider impede de alcançar. Não é chamada externa que falta; é a linha chegar ao ramo certo.

**Renovação e expiração.** A assinatura Pix que vence sem renovar **vira nada**: continua `status='active'`, `current_period_end` no passado, `canceled_at` NULL, e nenhum job a toca. Detalhado em 3.3, com os três jobs verificados. Quem escreve o fim do acesso não é ninguém: é a condição `current_period_end > now()` avaliada em tempo de leitura, em `is_user_pro` (`supabase/migrations/20260716130100_add_influencer_to_is_user_pro.sql:29`) e em `subscriptionGrantsPro` (`server/lib/userListEnrichment.ts:72`). Por isso **ela não entra no churn**: `contarSaidasEfetivas` (`server/lib/billingMetrics.ts:504-546`) precisa de `canceled_at` na janela ou de uma linha `completed` em `subscription_cancellations`, e não há nem um nem outro. Sobre o lembrete: `selecionarAssinaturasAVencer` (`server/routes/cron.ts:585-600`) exclui Asaas com `.neq("provider", "asaas")`, decisão deliberada e datada em `cron.ts:579-583`, com o motivo certo (o link do e-mail leva a `POST /api/billing/renew`, que tem provider e método fixos em duro) e prazo até janeiro de 2027, calculado sobre o primeiro vencimento semestral de Pix em março de 2027.

**Receita em risco.** Confirmado: **uma assinatura `asaas:active:manual` perto do `current_period_end` NÃO aparece em `getMrrSnapshot().atRisk`.** O `atRisk` tem exatamente duas famílias, montadas no mesmo laço de `server/lib/billingMetrics.ts:325-364`: `saindo`, que exige `row.cancel_at_period_end` (`:337`), e `emAtraso`, que exige `row.status === 'past_due'` (`:319`). Uma Pix ativa não é nenhuma das duas. **Ela ESTÁ no MRR**, porque a query de `billingMetrics.ts:265-277` não filtra provider: a 1 linha `asaas:active:manual:pix` entra somando preço de tabela, junto com as 130 da Stripe. Ou seja, o painel afirma receita recorrente de uma assinatura que não renova sozinha e não avisa quando está para acabar.

**Onde entraria a terceira família.** No mesmo laço, como terceiro acumulador ao lado de `saindoCents` e `atrasoCents`, pelo motivo que `billingMetrics.ts:326-331` já escreve: calcular isso num segundo lugar criaria uma terceira implementação de `monthlyEquivalentCents`. A condição seria `renewal_type === 'manual' && current_period_end <= agora + prazo`. Duas coisas a resolver antes: (1) `renewal_type` **não está no select** de `billingMetrics.ts:267-270` (que traz só `status, cancel_at_period_end, plans(...)`), então a coluna precisa entrar; (2) o prazo.

**Qual prazo usar.** O prompt pede "o mesmo que o cron de expiração usa", e a resposta honesta é que **não existe cron de expiração** (3.3). O prazo comparável é o do cron de LEMBRETE, `expiring-subscriptions`: a janela de varredura é 31 dias (`cron.ts:614`, "janela do maior marco (30d anual) + folga"), e os marcos por ciclo estão no módulo de marcos, com o semestral em até 15 dias (`cron.ts:614` comentário). Usar 31 dias alinharia o card ao instrumento que de fato existe. Mas registro a inversão: o normal é o painel copiar o prazo do job que age, e aqui só há job que avisa, e ele exclui Asaas. **O card avisaria sobre um vencimento para o qual nenhum e-mail vai sair.**

---

## 6. Visão: blocos não lidos

### `server/lib/overviewSeries.ts`

Cinco séries de FLUXO e duas de ESTOQUE, montadas em `montarSeriesDaVisao` (`:419`). Todas as leituras são paginadas por `coletarTudo` e acontecem num único `Promise.all` (`:426-484`).

| Série | Fonte | Fórmula | Janela |
| --- | --- | --- | --- |
| `cadastros` | `profiles` | contagem por dia civil de Brasília | `naJanela` (`:517-518`), os DOIS limites |
| `receitaBrutaCents` | **`finance_transactions`** (`:440-447`) | soma de `gross_cents` onde `type === 'charge'` (`:526-528`) | `gte occurred_at >= desdeIso` na query |
| `conversoesPro` | `subscriptions` (`:452-458`) | primeira linha por `user_id`, por `created_at` (`:534-543`) | `naJanela` |
| `custoIaUsd` | `ai_usage_logs` | soma de `cost_estimate` parseado (`:545-550`) | `gte created_at` |
| `chamadasSemCustoMedido` | `ai_usage_logs` | `status === 'success'` e custo 0 ou não finito (`:551-558`) | idem |
| `mrrCents` (estoque) | `subscription_snapshots` (`:479-486`) | leitura direta, **sem zero-fill**: dia sem snapshot volta `null` (`:562-571`) | todos os dias da janela |
| `assinantesAtivos` (estoque) | idem | idem | idem |

**Onde entra `finance_transactions`: só na `receitaBrutaCents`.** É o leitor 2 da tabela da seção 2, e o único ponto da Visão cego a Pix. Sob a hipótese, conserta sozinho.

**O que muda com Pix, e é o achado deste bloco:** nada mais precisa mudar, e é exatamente aí que está o problema. `conversoesPro`, o funil e as duas séries de estoque leem `subscriptions` e `subscription_snapshots`, que **já enxergam Asaas hoje**. Então o gráfico da Visão já desenha, no mesmo dia, uma conversão Pro sem a receita correspondente. Corrigir só a `receitaBrutaCents` fecha a assimetria, sem tocar no resto.

**Funil** (`:620-645`): coorte de `profiles` da janela, cruzada com dois conjuntos, `usuariosAtivados` (quem tem qualquer `ai_usage_logs`) e `usuariosPro` (quem tem qualquer linha em `subscriptions`, `:625-627`). `anterior` é a mesma contagem sobre a janela anterior, com `maturidadeAnteriorDias` (`:634-639`) declarando quanto tempo a coorte anterior teve para amadurecer. **O que pode enganar:** `usuariosPro` é "tem linha em `subscriptions`", não "tem Pro". Uma linha `pending` que nunca foi paga, ou `canceled`, conta como conversão no funil. Para Pix isso é mais provável que para cartão, porque a linha nasce `pending` no momento em que o QR é gerado, e 5 dos 6 eventos Asaas existentes são `PAYMENT_DELETED`. Não é regressão introduzida pelo Pix, mas o Pix aumenta a população afetada.

**Ferramentas** (`:648-664`): agrupa `ai_usage_logs` por `tool`, somando `chamadas`, `custoUsd` e `semCustoMedido`, ordenado por chamadas desc. Sem relação com Pix.

**`semFonteLocal`** (`:673-687`): duas métricas declaradas como ausentes em vez de omitidas, `chargesFalhadasPorDia` ("billing_failed_payments não tem escritor nesta base") e `aquisicaoPorCanal` (nenhuma coluna de UTM). O padrão é bom e é onde uma eventual série de Pix pendente deveria aparecer enquanto não existir.

**Frescor do snapshot** (`calcularFrescor`, `:376-393`): compara o rótulo do último snapshot com o horário esperado, usando `SNAPSHOT_HORA_UTC`/`SNAPSHOT_MINUTO_UTC` e uma margem. É o único ponto da Visão que sabe que a fonte de estoque pode estar parada.

### `server/lib/atencaoNecessaria.ts`

Oito tipos, enumerados no union de `ItemAtencao.tipo` (`:61-69`). Janela padrão 7 dias (`:458`, `janelaDias = opcoes.janelaDias ?? 7`), com uma exceção declarada.

| Tipo | Fonte | Janela | Cobre Asaas? |
| --- | --- | --- | --- |
| `assinatura_past_due` | `subscriptions`, `status='past_due'` (`:514`, `:542-551`) | estado atual | **Sim por construção, nunca na prática.** Query sem filtro de provider, mas Pix nunca fica `past_due`: não há cobrança recorrente que falhe |
| `saida_agendada` | `subscriptions`, `cancel_at_period_end` (`:553-570`) | estado atual | **Sim por construção, nunca na prática.** Pix não recebe `cancel_at_period_end` de ninguém |
| `cobrancas_falhadas` | agregado externo | `janelaDias` (`:590`, `:607`) | Não |
| `pagamento_orfao` | `billing_orphan_payments` (`:625`) | estado atual | **Não**, e por causa de 3.1: a linha Asaas nunca chega a essa tabela |
| `custo_ia_spike` | `ai_usage_logs` (`:384`) | janela | n/a |
| `payout_falho` | Stripe (`:154`, `:695-710`) | `PAYOUT_JANELA_DIAS = 14` (`:149`) | Não, e nem faz sentido |
| `mes_sem_despesa` | `expenses` (`:730`) | mês | n/a |
| `influencer_com_assinatura` | `influencers` + `subscriptions` (`:770`, `:790`) | estado atual | Sim, sem filtro de provider |

**Nenhum tipo cobre cobrança Pix pendente vencida nem webhook Asaas perdido.** O mais próximo seria `pagamento_orfao`, e ele está cortado em 3.1. Registro também que `url` (`:100`, "Para onde ir para agir FORA daqui. Hoje, sempre a Stripe") é montado por `s.provider_subscription_id?.startsWith("sub_")` (`:536-538`) e sai vazio para qualquer linha Asaas, cujo `provider_subscription_id` guarda o id da cobrança (`pay_...`).

Nota sobre `valorCents`: vem de `resolvePlanPriceCents` (`:530-534`), preço de tabela, não valor pago. É o achado 2 do prompt aparecendo num segundo lugar além do MRR. O campo é documentado como "valor NOMINAL do contrato" (`:75-78`), o que é honesto, mas continua sendo preço de tabela sem desconto de cupom ou afiliado.

### `computarSaudeDeIntegracoes` (`server/routes/admin.ts:599-635`)

Sonda cinco coisas, cacheadas 180s sob a chave `admincache:integrations-health`: `billingEnabled`, PostHog (via `getPosthogHealth()`), Stripe (`secretKey`, `webhookSecret` e os três `priceIds`), Redis (ping real) e Resend (presença de chave).

**Asaas NÃO está.** Consequência: uma configuração parcial do Asaas desliga o Pix por inteiro, com log no boot (`server/lib/env.ts:393-396`), e o painel não mostra nada. Some do produto sem sinal na tela.

**Sonda mínima, no molde exato das outras.** As três variáveis são `ASAAS_API_URL`, `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN` (`server/lib/env.ts:104-106`), e o booleano derivado é `env.asaasEnabled` (`:114-118`), fail-closed por inteiro. O bloco caberia como:

```
asaas: {
  enabled: env.asaasEnabled,
  apiUrl: Boolean(env.asaasApiUrl),
  apiKey: Boolean(env.asaasApiKey),
  webhookToken: Boolean(env.asaasWebhookToken),
}
```

Isso é presença de env, não alcance de serviço, igual ao que já se faz com Stripe e Resend, e custa zero requisição. O que ele pega é o estado PARCIAL, que é o perigoso: `env.ts:391-396` já distingue "não configurado, Pix DESLIGADO" (as três ausentes, silêncio esperado) de "PARCIALMENTE configurado, e por isso DESLIGADO por inteiro" (`console.warn`). Hoje esse warn some no log do Railway.

### `server/lib/healthBand.ts:245-268`, o item "boleto-limbo"

**Confirmado, e a mistura é maior do que o texto.** A fonte é `server/routes/admin.ts:826-828`:

```ts
supabaseAdmin
  .from("subscriptions")
  .select("created_at, plans(code, price_cents)")
  .eq("status", "pending"),
```

**Sem filtro de `provider` e sem filtro de `payment_method`.** Toda cobrança Pix aguardando pagamento está em `status='pending'` (é o estado em que `activateOnPayment` exige encontrar a linha, `asaas.ts:857-862`), então ela entra aqui.

Três coisas assumem boleto nesse caminho, não só o texto:

1. **O texto**, `healthBand.ts:265-268`: "N boleto(s), R$ X parados", em três variantes.
2. **O prazo.** `BOLETO_LIMBO_DIAS = 5` (`healthBand.ts:63`), e o comentário de `:245-246` diz "passado o prazo o boleto vira órfão e a linha é cancelada pelo cron". Para Pix as duas metades estão erradas: o prazo medido da cobrança Pix é o `dueDate`, e a medição de 2026-09-01 registrada em `client/src/lib/pixExpiration.ts:78-79` deu `dueDate` 2026-09-03, ou seja **cerca de 3 dias, não 5**. E o cron que cancela é `expire-pending-boletos` (`server/routes/cron.ts:793`), que opera sobre sessões da Stripe (`provider_subscription_id` começando com `cs_`, lido em `cron.ts:841`) e **não alcança linha Asaas**. Quem fecha a linha Pix é o próprio webhook, por `PAYMENT_OVERDUE`/`PAYMENT_DELETED` (`asaas.ts:628`).
3. **O valor.** `admin.ts:901-912` monta `valorCents: plano?.price_cents ?? 0`, preço de tabela do plano. Terceira ocorrência do achado 2, e aqui com um agravante: `?? 0` transforma plano sem preço num zero que soma silenciosamente no total exibido.

Ou seja, para uma cobrança Pix pendente a faixa mostra a palavra errada, um prazo 2 dias mais longo que o real, uma promessa de cancelamento por um cron que não vai agir, e um valor de tabela.

### `subscription_snapshots`

**Quem escreve:** `collectSubscriptionSnapshot` em `server/lib/subscriptionSnapshots.ts:52-88`, chamada pelo cron `POST /api/cron/snapshot-subscriptions` (`server/routes/cron.ts:1667`). **Frequência:** uma vez por dia, `'10 5 * * *'`, agendado em `supabase/migrations/20260715150100_schedule_subscription_snapshot.sql:21-25`, e o comentário de `:18` diz explicitamente 05:10 UTC. Upsert idempotente por `snapshot_date` (`subscriptionSnapshots.ts:75`), então rodar duas vezes no mesmo dia atualiza a mesma linha.

O `snapshot_date` é `new Date().toISOString().slice(0, 10)` (`:62`), o dia UTC. `server/routes/admin.ts:2074-2090` documenta por que isso é seguro para esta cadência: 05:10 UTC é depois de 03:00 UTC (meia-noite de Brasília), então dia UTC e dia civil de Brasília coincidem, e o mapeamento é a identidade. E declara a condição de quebra: se o cron passar para antes de 03:00 UTC, a série inteira desliza um dia em silêncio.

**Quando falta um dia**, `GET /subscription-history` (`admin.ts:2092`) devolve o buraco EXPLÍCITO: `admin.ts:2177-2192` empurra a data em `gaps` e retorna `{ date, missing: true, activeCount: null, trialingCount: null, mrrCents: null }`. Não maquia e não interpola. A variação da janela (`admin.ts:2201-2215`) usa o primeiro e o último ponto COM medição, para um dia faltante não virar extremo. E `overviewSeries.ts:562-571` faz o mesmo do lado da Visão, devolvendo `null` em vez de zero, com o motivo escrito: "zero afirmaria que o MRR caiu a zero, e interpolar afirmaria uma medição que não houve". Lista vazia é fail-loud (`admin.ts:2103-2112`, `coletarTudo` propaga).

Relação com Pix: nenhuma direta, mas o snapshot herda tudo de `getMrrSnapshot` (`subscriptionSnapshots.ts:53`), então a assinatura Pix entra no `mrr_cents` e no `active_count` históricos, com preço de tabela, desde 01/09. O `by_status` é tally cru e vai acumular os Pix vencidos que nunca mudam de status (3.3).

### `server/lib/posthog.ts`, `contarAtividadeAgora` (`:648-694`)

Uma única query HogQL para duas contagens (`:673`):

```sql
select uniqIf(distinct_id, timestamp > now() - interval 5 minute) as online,
       uniq(distinct_id) as hoje
from events where timestamp >= toDateTime('<inicio do dia de Brasilia>')
```

**A janela de 5 minutos** é literal, dentro do `uniqIf`. O corte do dia vem de `inicioDoDiaBrasilia(hoje)` (`:663`), com `hoje` derivado de `diaBrasilia` (`:657`), nunca de offset fixo de `-3h`; o cabeçalho de `:653-656` explica que escrever o offset à mão transformaria a ausência atual de horário de verão em regra. O literal é convertido por `hogTime`, e o comentário de `:659-661` registra que o fuso do projeto no PostHog é UTC, conferido contra o projeto real em 2026-08-17 junto com a aceitação do `uniqIf`.

**O que conta como "pessoa": `distinct_id`, não `person_id`.** Declarado em `:663-666`: é a única chave que existe nos eventos anônimos; quem navega deslogado e depois entra conta duas vezes, e quem usa dois navegadores também. É um número de presença com margem, e `:666` diz que a tela precisa dizer isso. O mesmo cabeçalho avisa para não trocar por `person_id` sem trocar também na série de ativos por dia, sob pena de duas unidades diferentes lado a lado na mesma aba.

Postura de erro consistente com o resto da base: resposta 2xx sem linha vira `state: "error"` e não zero (`:675-680`, "zero aqui seria indistinguível de um site vazio"); falta de env vira `not_configured` com a lista do que falta (`:649-652`).

### `server/lib/signupSeries.ts`

**Confirmado: usa dia civil de Brasília via `shared/brasiliaDay.ts`.** `signupSeries.ts:1` importa `diaBrasilia` e `somarDiaCivil`; o agrupamento é `diaBrasilia(iso)` em `:49-51` e a iteração da janela é `somarDiaCivil` em `:55`. O motivo está em `:35-37`: `iso.slice(0, 10)` agruparia pelo dia UTC e jogaria todo cadastro feito depois das 21h locais na barra do dia seguinte, o mesmo defeito que existiu no gráfico de leituras de notificação.

Dois pontos de desenho que valem registro por serem o contraste explícito com o bloco anterior: **zero é medição aqui** (`:13-17`, dia sem linha significa que ninguém se cadastrou, a barra é desenhada), ao contrário do histórico de assinaturas, onde dia sem snapshot significa que ninguém mediu e a linha precisa quebrar. E `partial: d === input.hoje` (`:59`) marca o dia corrente como incompleto, para o gráfico não desenhar um despencar no último ponto toda manhã. A cópia byte a byte de `somarDias` que existia em `admin.ts` foi removida em 2026-08-14 (`:65-69`).

---

## 7. Contradições com os fatos da seção 2 do prompt

Nenhuma contradição direta: o código é consistente com o schema medido. Três observações que qualificam os fatos, sem desmenti-los.

1. **"Uma linha Asaas NÃO cabe hoje sem migration": confirmado pelo código, e por dois motivos, não um.** Além do `stripe_balance_transaction_id NOT NULL` sem valor a preencher, o único escritor da tabela é `syncBalanceTransactions` (`server/lib/stripeSync.ts:504`), que é chamado por cinco sítios e **começa por `assertKeyMatchesDatabase()` (`:408`)**, uma guarda que aborta se a chave da Stripe não for `sk_live_`/`rk_live_` com banco não local (`:50-61`). E há uma segunda guarda por linha em `:459-466`, que aborta se `source.livemode === false`. Qualquer caminho de escrita Asaas precisa nascer FORA dessa função, ou as guardas de ambiente da Stripe passam a governar a ingestão de Pix, o que seria errado nos dois sentidos.

2. **`server/providers/asaas.ts` não menciona `finance_transactions` em nenhuma linha** (`grep -n "finance_transactions" server/providers/asaas.ts` não retorna nada). Confirma o achado 1 do prompt pelo lado do provider, e não só pelo lado da tabela.

3. **Sobre as contagens de `subscriptions` por status.** A distribuição da seção 2 não lista nenhuma linha `trialing` nem nenhuma `pending`. Isso importa para dois pontos deste relatório: o erro de rótulo do card "Assinantes Pro" (seção 1C) tem efeito ZERO hoje, e o item "boleto-limbo" da faixa (seção 6) só passa a misturar Pix quando houver uma cobrança pendente viva. Os dois são defeitos latentes, não correntes. Se a distribuição do prompt for parcial (por exemplo, se `pending` tiver sido omitido por ser transitório), a conclusão sobre o boleto-limbo muda. Não remedi o banco.

---

## 8. Perguntas para o arquiteto

1. **Valores reais de data no evento `PAYMENT_RECEIVED`.** A recomendação de `occurred_at` na seção 4 depende de saber se `confirmedDate` vem preenchido para Pix e, sobretudo, **em que formato** (`YYYY-MM-DD` puro não serve para uma coluna `timestamptz`). A consulta está escrita no fim da seção 4 e não expõe dado pessoal.

2. **`parseAsaasDate` vai para `shared/`?** A função certa existe e está em `client/src/lib/pixExpiration.ts:39-72`. É pura. Mas a regra dela para `YYYY-MM-DD` (fim do dia em Brasília, `:64-69`) é conservadora para PRAZO e errada para `occurred_at`. Mover e parametrizar, ou escrever uma segunda função no servidor? A segunda opção cria duas montagens da mesma conversão de fuso, que é o padrão que o CLAUDE.md diz divergir primeiro.

3. **Nomes exatos dos eventos de estorno do Asaas.** Não confirmei se são `PAYMENT_REFUNDED`, `PAYMENT_PARTIALLY_REFUNDED`, `PAYMENT_REFUND_IN_PROGRESS`, nem qual deles é terminal. A hipótese fala em "`PAYMENT_REFUNDED` e equivalentes" e o conjunto de "equivalentes" precisa ser fechado antes de virar código, senão o `if (!handled)` de `asaas.ts:704` continua descartando um deles sem gravar nada.

4. **Estorno de Pix deve revogar acesso?** Para Stripe, sim, quando zera o saldo (`server/lib/proRevocation.ts:85-90`). Mas `decidirERevogar` filtra `provider = 'stripe'` (`admin.ts:3679`). Tirar o filtro é a correção óbvia, e ela muda o comportamento de uma função que remove acesso, o que pede validação manual pela regra do CLAUDE.md.

5. **A terceira família de "receita em risco" usa qual prazo?** A seção 5 propõe 31 dias por alinhamento com `expiring-subscriptions`, mas registra a inversão: esse cron só AVISA, e exclui Asaas. Alternativa: criar primeiro o job que expira (3.3), e derivar o prazo dele, no mesmo padrão de `CHARGE_SEM_DONO_CORTE_DIAS = SYNC_FINANCE_WINDOW_DAYS + 1` (`server/lib/financeSyncWindow.ts:51`).

6. **Ordem entre esta frente e a fiscal.** `fiscal_invoices` (frentes `bnt-fiscal`/`bnt-nfsen`, não mergeadas) tem `stripe_charge_id` UNIQUE como chave de junção com `finance_transactions`. Se ela subir antes da coluna `provider`, nasce com a mesma dívida, numa tabela que guarda CPF. Qual sobe primeiro?

7. **Fuso do `pg_cron`.** `sync-finance` está em `'20 4 * * *'` e o comentário da migration diz "04:20" sem qualificar o fuso, enquanto o do snapshot diz "05:10 UTC" explicitamente. Se `pg_cron` roda em UTC, o sync roda 01:20 de Brasília, não 04:20, e a separação declarada em relação ao cluster 04:20/04:30/04:45 não é a que o comentário descreve. Uma consulta a `cron.job` resolve; não a fiz nesta rodada.

8. **A claim `admin_role` deve ser versionada?** Hoje o `custom_access_token_hook` está na lista de exceção de `scripts/checkMigrationsApplied.mts:762`, ao lado de funções de extensão. Isso silencia o guard de drift para um objeto que é NOSSO e é de segurança. O CLAUDE.md diz que reconstrução a partir das migrations precisa sair igual a produção; hoje sai sem o hook, e portanto sem gate de admin no client.

---

## 9. Frentes vivas

Worktrees cujo branch casa com `pix|asaas|semdono|orfao|finance|fiscal|invoice`, por `git worktree list`. Todos os números medidos com lista de paths LITERAL (ver a nota de instrumento no topo).

| Worktree | Branch | Mergeada? | Commits além de main | Escopo tocado (commitado / sujo) | O que muda para o Pix no painel |
| --- | --- | --- | --- | --- | --- |
| `bnt-pix` | `pix/ci-expected-fn` | Não | 1, só `b2f5b14f merge: sync pix/ci-expected-fn with main` | nenhum / nenhum | **Nada. Obsoleta.** Diff TOTAL contra `origin/main` vazio |
| `bnt-asaas` | `pix/lote2n-fechamento` | **Sim** | 0 | nenhum / nenhum | **Nada. Obsoleta**, árvore limpa |
| `bnt-semdono` | `feat/detectar-charge-sem-dono` | **Sim** | 0 | nenhum / nenhum | **Nada. Obsoleta**, árvore limpa |
| `bnt-orfaos` | `feat/admin-resolver-orfaos` | Não | 1, só `3b826af7 merge: sync ... with main` | nenhum / nenhum | **Nada. Obsoleta.** Diff TOTAL vazio |
| `bnt-invoice` | `fix/invoice-pagamento-mudo` | Não | 1, só `07137de8 merge: sync ... with main` | nenhum / nenhum | **Nada. Obsoleta.** Diff TOTAL vazio |
| `bnt-fiscal` | `feat/fiscal-fechamento` | Não | 100+ | `admin.ts` +361, `cron.ts` +69, 10 migrations / nenhum | Cria `fiscal_invoices` acoplada a `stripe_charge_id`. Ver 3.6 |
| `bnt-nfsen` | `feat/fiscal-nfsen` | Não | 100+ (superconjunto de `bnt-fiscal`) | `admin.ts` +361, `cron.ts` +69, 12 migrations / nenhum | idem, mais 2 migrations fiscais |

Sujeira nas árvores: `bnt-pix` tem 6 arquivos `.md` de relatório não rastreados; `bnt-fiscal` tem 8; `bnt-nfsen` tem mais de 20. **Nenhum arquivo sujo está no escopo financeiro** (o `diff --stat` sujo sobre a lista de paths é vazio em todas as sete). `bnt-asaas`, `bnt-semdono`, `bnt-orfaos` e `bnt-invoice` estão com árvore limpa.

Respostas de uma frase cada:

- **Alguma frente já escreve em `finance_transactions` pelo caminho Asaas?** Não, nenhuma: o único escritor continua sendo `server/lib/stripeSync.ts:504`, e as sete frentes têm diff vazio sobre `stripeSync.ts` e `asaas.ts`.
- **Alguma frente já tem migration alterando `finance_transactions`, `billing_events` ou `subscriptions`?** Não: as 12 migrations de `bnt-nfsen` criam ou alteram `fiscal_invoices`, `profiles`, `ai_usage_logs` e `linkedin_*`, e só MENCIONAM `finance_transactions` em comentário (a junção por `stripe_charge_id` de 3.6); nenhum DDL toca as três tabelas.
- **Alguma frente já trata `PAYMENT_REFUNDED` ou reembolso Asaas?** Não: nenhuma toca `server/providers/asaas.ts` nem `server/routes/webhooksAsaas.ts`. `bnt-nfsen` acrescenta um gancho na rota de reembolso (`applyRefundToFiscalInvoice`, no diff de `admin.ts` em `router.post("/users/:id/refunds")`), mas é a rota da Stripe, que não alcança Pix (seção 5).
- **`bnt-semdono` e `bnt-orfaos`:** os commits `0eb5d0d`, `44052a1`, `665780a` e `820744b` estão em `main`, e as duas frentes **estão obsoletas**. `bnt-semdono` é `JA MERGEADA` com árvore limpa e zero commits além de main. `bnt-orfaos` não é ancestral de main apenas porque tem um commit de merge que traz main para dentro dela; o diff contra `origin/main` é vazio em TODOS os paths, e a árvore está limpa. As duas podem ser removidas com `git worktree remove`.

**Nenhuma frente contradiz a hipótese da seção 3 do prompt 01.** A única que a complica é `bnt-fiscal`/`bnt-nfsen`, e isso está registrado em 3.6 como ordem de deploy, não como contradição.
