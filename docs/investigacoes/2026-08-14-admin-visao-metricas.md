# Investigação: métricas da aba "Visão" do painel admin

**Data:** 2026-08-14, entre 04:43 e 04:55 UTC (01:43-01:55 BRT).
**Modo:** somente leitura. Nenhum arquivo de código alterado, nenhum commit, nenhuma
escrita em banco ou na API do Stripe. Este documento é o único arquivo criado.
**Branch de trabalho:** `fix/openai-cota-credencial`.

## Disciplina de evidência

Todo número deste relatório saiu de um comando executado nesta sessão, com o horário
registrado. Nada veio de memória, de doc antigo ou de execução anterior.

**Ressalva de fidelidade que precisa vir antes dos números.** A branch em que a
investigação rodou está **35 commits atrás de `origin/main`**, e produção é `origin/main`.
Antes de afirmar qualquer coisa sobre o comportamento em produção, cada arquivo lido foi
comparado com a versão de `origin/main`:

| Arquivo | HEAD vs origin/main |
| --- | --- |
| `server/routes/stats.ts` | idêntico |
| `server/lib/overviewWindow.ts` | idêntico |
| `server/lib/billingMetrics.ts` | idêntico |
| `server/lib/financeMetrics.ts` | idêntico |
| `server/lib/aiUsageStats.ts` | idêntico |
| `server/lib/aiTools.ts` | idêntico |
| `server/lib/userListEnrichment.ts` | idêntico |
| `server/lib/aiUsage.ts` | idêntico |
| `server/routes/admin.ts` | difere (+232 linhas), **mas o bloco `router.get("/overview")` é byte a byte idêntico** (conferido por `diff` dos 120 linhas do handler) |
| `client/src/pages/Admin.tsx` | difere (+18 linhas), em hunks nas linhas 77, 1194, 7035 e 7450; **o `useMemo` dos seis cards (6596-6690) está fora de todos eles** |
| `client/src/pages/home/sections/Hero.tsx` | difere (working tree removeu 51 linhas de telemetria PostHog); a lógica do contador (`data.count`, `setUsersCount`, `AnimatedCounter`) é a mesma em `origin/main`, conferida linha a linha |

Ou seja: tudo que este relatório afirma sobre a Visão e sobre o contador da home vale para
o código que está em produção.

**Limitação declarada:** não foi possível chamar `GET /api/admin/overview` diretamente
(exige JWT com claim de admin, e obter um exigiria um login real, que é escrita de
sessão). O caminho usado foi **replicar a query exata do handler** via PostgREST /
Management API, com os mesmos filtros, na mesma janela. Cada réplica está transcrita junto
do número. Onde a réplica podia divergir do handler, isso está dito.

---

# PARTE A — Divergência de usuários

## A1. Contador público da home

**Componente:** `client/src/pages/home/sections/Hero.tsx:589` (`export default function Hero`).

- Estado inicial: `useState<number | null>(() => readCachedUsersCount())`
  (`Hero.tsx:594`), lendo `localStorage["bnt_users_count"]`. Só aceita `> 0`; `0` ou lixo
  vira `null` e cai no placeholder (`Hero.tsx:532-544`).
- Busca: `fetch(apiUrl("/api/stats/users-count"))` em `Hero.tsx:612-615`.
- Render: `Hero.tsx:696-698`, `+<AnimatedCounter value={usersCount} …> pessoas`.

**Endpoint:** `server/routes/stats.ts:45`, `router.get("/users-count")`.

Query final, em `server/routes/stats.ts:37-43`:

```ts
supabaseAdmin.from("profiles").select("*", { count: "exact", head: true })
```

**Transformações. Enumeradas uma a uma, porque a pergunta era essa:**

| Transformação | Existe? | Evidência |
| --- | --- | --- |
| Offset somado / "seed" de social proof | **Não** | Nenhuma aritmética entre `data.count` e `setUsersCount` (`Hero.tsx:660`). O `+` exibido antes do número é tipografia literal no JSX (`Hero.tsx:697`), não soma. |
| Arredondamento | **Não** | `AnimatedCounter` recebe o inteiro cru. |
| Valor hardcoded | **Não hoje. Existiu.** | Ver abaixo. |
| Cache com TTL | **Sim, dois** | (1) servidor: `lastKnownGood` em memória do processo, `FRESH_TTL_MS = 5 min` (`stats.ts:13-15,46-48`); (2) cliente: `localStorage`, sem expiração, sobrescrito a cada fetch bem-sucedido. |
| ISR / revalidação Vercel | **Não** | O número não é prerenderizado; vem de `fetch` no cliente contra `api.boranatech.com.br`. |
| Filtro de qualquer espécie | **Não** | `select("*", {count:"exact", head:true})` sem `.eq`, `.gte`, `.is` ou `.neq`. Conta a tabela `profiles` inteira. |

**Histórico de offset proposital (`git log`/`git show`):** houve. O commit
`e2924547 fix(home): replace hardcoded counter default with cached last good value`
(2026-05-28) removeu a linha `const [usersCount, setUsersCount] = useState(4800)`. Era um
valor fixo de 4.800 exibido **antes** de o fetch responder, e mantido se o fetch falhasse.
Foi substituído pelo par `localStorage` + `null`. Nada equivalente existe hoje.
O endpoint nasceu em `df24e683` (2026-05-18) já contando `profiles` sem filtro; os commits
posteriores (`b35e2de7`, `bb721b9f`, `f96a5ec1`, `424c9adb`) só mexeram em degradação,
last-known-good e instrumentação, nunca no critério de contagem.

**Degradação:** se a query falhar ou devolver `count` nulo, o endpoint serve o
`lastKnownGood` (200, nunca 0 inventado) e reporta ao Sentry com `route: stats/users-count`.
Se o `lastKnownGood` também for nulo (processo recém-subido), devolve `{count: null}` e o
cliente cai no placeholder.

## A2. Card de usuários do admin

Caminho completo, componente → endpoint → service → SQL:

1. **Componente:** `client/src/pages/Admin.tsx:6604` (`useMemo` `adminMetricCards`),
   card 0: `label: "Novos usuários"`, `value: String(c.novosUsuarios.value)`,
   `detail: "Cadastros " + janelaLabel` (`Admin.tsx:6624-6627`). Renderizado em
   `Admin.tsx:7112-7118` dentro do `BlocoBoundary "Cards do período"`.
2. **Fetch:** `Admin.tsx:6137`, `adminFetch("/overview?window=" + overviewWindow)`, em
   efeito próprio disparado por mudança de janela (`Admin.tsx:6130-6157`).
3. **Endpoint:** `server/routes/admin.ts:932`, `router.get("/overview")`.
4. **Resolução da janela:** `resolverJanela(parseOverviewWindow(req.query.window))`,
   `server/lib/overviewWindow.ts:35`.
5. **Query final:** `contarPerfis`, `server/routes/admin.ts:936-948`:

```ts
let q = supabaseAdmin
  .from("profiles")
  .select("user_id", { count: "exact", head: true })
  .lte("created_at", ate);
if (desde) q = q.gte("created_at", desde);
```

**Filtros aplicados, enumerados:**

| Filtro | Aplicado? |
| --- | --- |
| Intervalo de datas | **Sim**: `created_at <= endIso` sempre; `created_at >= startIso` quando a janela não é `all`. |
| Exclusão de roles / admin | Não. `admin_roles` tem 2 linhas e elas contam nos dois números. |
| Exclusão de contas de teste | Não. Não existe coluna/flag de conta de teste em `profiles`. |
| Soft delete | Não existe coluna de soft delete em `profiles` (schema conferido, 38 colunas, nenhuma `deleted_at`). |
| E-mail confirmado | Não. A fonte é `profiles`, não `auth.users`. |
| Tabela fonte | `public.profiles`, a **mesma** da home. |

**Agregação:** feita no servidor (`count: "exact", head: true` — o Postgres conta, o
PostgREST devolve no header `content-range`). O frontend só faz `String(...)`.
A rota faz **duas** dessas contagens (janela atual e janela anterior, para o Δ),
mais `inicioDaSerie("profiles","created_at")` para saber a idade da série.

## A3. Filtro de período e timezone

**Existe seletor?** Sim: `client/src/components/admin/overview/OverviewPeriod.tsx`,
três pílulas — `7 dias` / `30 dias` / `Tudo`.

**Default:** `"30"`. Definido nos dois lados, com o mesmo valor:
`OverviewPeriod.tsx:29-33` (client) e `server/lib/overviewWindow.ts:13-18` (server).
Lixo ou ausência de `?window=` cai em `"30"`. A janela vive na **URL** (`?window=`), não
em estado local (`Admin.tsx:6111-6119`).

**"Novos Usuários" é filtrado por período POR DESIGN?** Sim, e isso é declarado em três
lugares: o rótulo do card é literalmente `"Novos usuários"` (não "Usuários"), o `detail`
diz `"Cadastros nos últimos 30 dias"`, e o comentário do handler em
`server/routes/admin.ts:928` descreve o número como
`"count em profiles.created_at (o unico calculo proprio, e e uma contagem)"`.
O rótulo estático de fallback ainda é `"Usuários"` com detalhe
`"Perfis cadastrados no banco"` (`Admin.tsx` `metricCards[0]`), mas ele é **sobrescrito**
pelo `useMemo` sempre que `/overview` responde; só aparece no estado de carregamento/erro.

**Timezone.** Aqui há uma inconsistência real dentro da própria aba:

| Bloco | Critério temporal | Fuso |
| --- | --- | --- |
| Os SEIS cards | Janela **deslizante por instante**: `agora - N*24h` até `agora`, via `new Date(...).toISOString()` | **UTC puro**, sem noção de dia civil |
| Gráfico "Cadastros por dia" | Janela por **dia civil**: `hoje` até `hoje - (N-1)` dias, com `diaBrasilia()` como chave de agrupamento | **America/Sao_Paulo** |
| Funil principal | Janela própria fixa de 30 dias, não segue o seletor | UTC (`from`/`to` em ISO) |
| Aquisição de usuários | Janela própria fixa de 30 dias, não segue o seletor | PostHog |

Medido às 04:53 UTC:

```sql
select (select count(*) from profiles where created_at >= now() - interval '30 days') as card_rolling_utc,
       (select count(*) from profiles where created_at >= ((current_date at time zone 'America/Sao_Paulo') - interval '29 days')) as grafico_civil_brasilia;
-- {"card_rolling_utc":4788,"grafico_civil_brasilia":4606}
```

**182 cadastros de diferença entre o card e o gráfico que fica logo abaixo dele**, os dois
rotulados "últimos 30 dias". Não é erro de nenhum dos dois isoladamente: são duas
definições diferentes da mesma palavra, na mesma tela.

## A4. Medição simultânea

Comando único, executado às **2026-08-14 04:44:40 UTC** (01:44:40 BRT):

```bash
set -a && . ./.env && set +a
NOW=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)
D30=$(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%S.000Z)

# (i) FONTE DA HOME, endpoint de produção
curl -s "https://api.boranatech.com.br/api/stats/users-count"

# (ii) RÉPLICA EXATA DE contarPerfis, janela default (30)
curl -s -o /dev/null -D - "$VITE_SUPABASE_URL/rest/v1/profiles?select=user_id&created_at=gte.$D30&created_at=lte.$NOW" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Prefer: count=exact" -H "Range: 0-0" | grep -i "^content-range"
```

| # | O que | Resultado |
| --- | --- | --- |
| (i) | `GET https://api.boranatech.com.br/api/stats/users-count` | `{"count":5456}` |
| (ii) | admin `window=30` (default) | `content-range: 0-0/4790` |
| (iii) | admin `window=all` | `content-range: 0-0/5456` |
| (iv) | réplica direta de `queryProfilesCount` (`profiles`, sem filtro) | `content-range: 0-0/5456` |
| (v) | perfis com `created_at < D30` | `content-range: 0-0/666` |

**Delta medido: 5456 − 4790 = 666.**

Registro do relato original: os números que motivaram a investigação (4.785 no admin,
5.455 na home, ~670 de diferença) foram medidos em outro instante e **não são
reverificáveis** — a base cresce continuamente. O que se pode afirmar é que o mecanismo
reproduz exatamente essa forma de divergência, com a mesma ordem de grandeza, na mesma
janela default.

## A5. Decomposição integral do delta

Categorias mutuamente exclusivas, cada uma com a query que a mediu. Todas às 04:43-04:44
UTC.

| # | Categoria | Query | Contagem |
| --- | --- | --- | --- |
| 1 | **Usuários fora da janela default de 30 dias** (`created_at < now()-30d`) | `profiles?select=user_id&created_at=lt.$D30` + `Prefer: count=exact` | **666** |
| 2 | `created_at` nulo (excluído pelo `.lte()` do admin, incluído no total da home) | `profiles?select=user_id&created_at=is.null` | **0** |
| 3 | `created_at` no futuro (excluído pelo `.lte(endIso)`) | `profiles?select=user_id&created_at=gt.$NOW` | **0** |
| 4 | Soft-deleted | coluna não existe em `profiles` (schema conferido) | **0** (n/a) |
| 5 | Contas de teste / admin excluídas | nenhum filtro desse tipo em nenhum dos dois lados | **0** |
| 6 | Offset fixo da home | nenhum (A1) | **0** |
| 7 | Divergência de tabela fonte (`auth.users` vs `profiles`) | ver abaixo | **0** |
| 8 | E-mail não confirmado | ver abaixo | **0** |
| 9 | Cache desatualizado da home (TTL 5 min) | endpoint devolveu 5456 == leitura direta 5456, no mesmo minuto | **0 no instante da medição** |
| | **SOMA** | | **666** |
| | **NÃO EXPLICADO** | | **0** |

Query da categoria 7 e 8, via Management API às 04:45 UTC:

```sql
select (select count(*) from auth.users) as auth_users,
       (select count(*) from auth.users where deleted_at is not null) as auth_deleted,
       (select count(*) from auth.users where email_confirmed_at is null) as auth_nao_confirmado,
       (select count(*) from public.profiles) as profiles,
       (select count(*) from auth.users u where not exists (select 1 from public.profiles p where p.user_id=u.id)) as auth_sem_profile,
       (select count(*) from public.profiles p where not exists (select 1 from auth.users u where u.id=p.user_id)) as profile_sem_auth;
```

```json
[{"auth_users":5456,"auth_deleted":0,"auth_nao_confirmado":0,"profiles":5456,
  "auth_sem_profile":0,"profile_sem_auth":0}]
```

`auth.users` e `public.profiles` estão em paridade perfeita: zero órfãos nos dois sentidos,
zero soft-deleted, zero e-mail não confirmado. As categorias 7 e 8 são estruturalmente nulas
hoje.

Sobre a categoria 9: o limite superior dela é a quantidade de cadastros em 5 minutos.
Taxa medida (1.469 cadastros em 7 dias, às 04:44) ≈ 210/dia ≈ **0,7 por 5 minutos**. Ou
seja, mesmo no pior caso o cache explica de 0 a 2 unidades — nunca centenas.

**Conclusão da decomposição: o delta é 100% "janela de 30 dias", com resíduo zero.**
A prova mais direta disso é (iii): com `window=all`, o admin devolve **5456**, exatamente o
número da home, com o mesmo `.lte(created_at, agora)` que já não exclui ninguém.

## A6. O que cada número mede

Sem veredito sobre qual é "o correto" — isso é decisão de produto.

- **Home (5.456):** cardinalidade da tabela `profiles` no instante da leitura, sem recorte
  temporal, com atraso de até 5 minutos pelo `lastKnownGood`. Lê como "quantas pessoas já
  criaram conta desde sempre". Série começa em **2026-05-04T19:04:20Z** (primeiro perfil).
- **Admin, card "Novos usuários" na janela default (4.790):** perfis criados na janela
  deslizante de 720 horas UTC encerrada agora. Lê como "quantos entraram no último mês".
- **Admin com `window=all` (5.456):** idêntico à home, por construção.

Os dois estão certos sobre o que perguntam. O que produz a impressão de erro é que o card
mais parecido com "usuários" na tela mais parecida com "painel geral" responde uma pergunta
com recorte, enquanto o número público responde sem recorte — e a única pista visual da
diferença é o `detail` em fonte menor ("Cadastros nos últimos 30 dias") e o rótulo
"Novos usuários", que o fallback de carregamento ainda chama de "Usuários".

---

# PARTE B — Auditoria dos demais cards

## B1. Definição implementada de cada card

Fonte comum: `server/routes/admin.ts:932-1035` (`GET /admin/overview`). O comentário do
handler (`admin.ts:912-931`) declara a intenção: "NAO HA ARITMETICA NOVA AQUI", cada
número vem de quem já sabia calculá-lo.

### 1. Novos usuários
Já detalhado em A2/A3. Fonte: `profiles.created_at`, DB local. Unidade: contagem.
Δ vs período imediatamente anterior de mesmo tamanho, via `calcularVariacao`
(`overviewWindow.ts:96`).

### 2. Assinantes Pro
- **Arquivo:** valor de `contarProPorOrigem()`, `server/routes/admin.ts:384-414`, exibido
  em `Admin.tsx:6632-6641`.
- **Cálculo:** lê `subscriptions` (paginado) + `influencers` com `revoked_at is null`
  (paginado), monta `buildEnrichmentIndex` (`server/lib/userListEnrichment.ts:126`) e faz
  `tallyProSources` (`userListEnrichment.ts:190`).
- **Regra de Pro** (`subscriptionGrantsPro`, `userListEnrichment.ts:63-74`): plano ≠ `free`
  **e** `status ∈ {active, trialing}` **e** (`current_period_end` nulo **ou** > agora).
  Fail-closed em status desconhecido e em data ilegível.
- **O card exibe `bySubscription`**, não `total` (`Admin.tsx:6634`).
- **Período:** nenhum. É estado atual; **ignora o seletor** e a tela não diz isso neste card
  (diz no de Receita em risco).
- Fonte: DB local. Unidade: pessoas.

### 3. Receita recorrente (MRR)
- **Arquivo:** `getMrrSnapshot()`, `server/lib/billingMetrics.ts:230-320`, exibido em
  `Admin.tsx:6644` via `formatCents`.
- **Cálculo:** `subscriptions` com `status ∈ {active, trialing}` e
  (`current_period_end` nulo ou > agora); `trialing` é contado à parte e **fica fora do MRR**
  (`billingMetrics.ts:267-270`); preço vem de `resolvePlanPriceCents` sobre
  `shared/planPricing.ts` (fonte única: 2990 / 12900 / 22200 centavos), com
  `plans.price_cents` só como fallback defensivo; normalização por
  `monthlyEquivalentCents = round(priceCents / INTERVAL_MONTHS[interval])`
  (`billingMetrics.ts:31-39`), com `month:1, semiannual:6, year:12` e **erro** (não default
  silencioso) para interval desconhecido.
- **Período:** nenhum, estado atual. Ignora o seletor.
- Fonte: DB local. Unidade: centavos de BRL, exibidos em reais.

### 4. Receita no período
- **Arquivo:** `getFinanceSummary()`, `server/lib/financeMetrics.ts:194-253`, exibido em
  `Admin.tsx:6650` com `detail: "Cobranças " + janelaLabel`.
- **Cálculo:** `finance_transactions` com `occurred_at` na janela (paginado, ordenado por
  `id`); o card lê **`receitaBrutaCents`**, que soma `gross_cents` **apenas de
  `type = 'charge'`** (`financeMetrics.ts:212-217`).
- **Bruto ou líquido?** **BRUTO.** Taxas (`fee_cents`) e reembolsos (`gross_cents` de
  `type='refund'`) são calculados no mesmo laço mas em campos separados
  (`taxasStripeCents`, `reembolsosCents`) e **não são descontados do número do card**.
  `payout` é excluído.
- **Período:** segue o seletor. Timezone: UTC (`new Date(janela.startIso)`).
- Δ vs período anterior. Fonte: tabela sincronizada `finance_transactions`, alimentada pelo
  cron `sync-finance` (janela de 7 dias, `SYNC_FINANCE_WINDOW_DAYS`).

### 5. Receita em risco
- **Arquivo:** `mrr.atRisk`, calculado **no mesmo laço** do MRR
  (`billingMetrics.ts:286-292`), exibido em `Admin.tsx:6657-6661`.
- **Definição no código:** `cancel_at_period_end = true` entre as assinaturas que já entram
  no MRR (`status='active'`, período não expirado). **Não** inclui `past_due`. **Não**
  inclui falhas de pagamento registradas.
- **Período:** nenhum. É o único card em que a tela **declara** que ignora o seletor
  (comentário em `admin.ts:1022-1024`; texto na UI).
- Exibe `mrrCents` em risco + `count` + `% do MRR`.

### 6. Custo de IA
- **Arquivo:** `custoTotalDeIa(agregarUsoDeIa(janela.startIso ?? epoch))`,
  `server/lib/aiUsageStats.ts:21-54`, exibido em `Admin.tsx:6666` via `formatCurrency`.
- **Cálculo:** soma de `ai_usage_logs.cost_estimate` para `created_at >= startIso`
  (paginado). **Sem limite superior** — para `window=30` isso é inofensivo porque não há
  linha no futuro, mas a query não espelha o `endIso` que os outros cards usam.
- **Tabela de preços:** `MODEL_PRICING` em `server/lib/aiTools.ts:55-58`, **hardcoded no
  código**, valores `gpt-4o-mini: 0.15/0.60` e `gpt-4o: 2.50/10.00` **por milhão de
  tokens**, documentados no próprio arquivo como **"US$ por 1 milhao de tokens"**.
  A gravação acontece em `logAiUsage` (`server/lib/aiUsage.ts:409,431`), com
  `cost_estimate: params.costEstimate || 0`.
- **Cobertura de modelos:** os únicos modelos presentes na base são `gpt-4o-mini` (2.339
  chamadas) e `gpt-4o-mini-transcribe` (4), mais 3 linhas com `model` nulo. `gpt-4o-mini`
  está na tabela; `gpt-4o-mini-transcribe` cai em `NON_TEXT_MODELS` e recebe custo 0
  deliberadamente.

## B2. Verificação cruzada contra fonte independente

Todas as leituras do Stripe são `GET` paginados (`/v1/subscriptions`, `/v1/charges`,
`/v1/balance_transactions`), executadas entre 04:48 e 04:50 UTC.

### 2.1 Assinantes Pro — local vs Stripe

> **CORREÇÃO de 2026-08-14 05:45 UTC.** A primeira versão desta seção trouxe uma réplica SQL
> com contagem **mutuamente exclusiva** e a rotulou "réplica de `tallyProSources`". Ela não
> era fiel: `tallyProSources` (`server/lib/userListEnrichment.ts`) devolve
> `bySubscription = só_assinatura + both` e `byInfluencer = só_influencer + both`, com o
> comentário no próprio código dizendo "quem tem os dois conta nos DOIS ramos". A réplica
> errada inverteu a conclusão sobre o defeito da tela (ver a correção no achado 5). MRR,
> receita e receita em risco não dependiam disso e seguem válidos.

Local, réplica FIEL de `tallyProSources` (05:45 UTC):

| só assinatura | só influencer | `both` | **`bySubscription` (é o exibido)** | **`byInfluencer` (é o exibido)** | `total` |
| --- | --- | --- | --- | --- | --- |
| 96 | 25 | 3 | **99** | **28** | **124** |

Confere com as contagens brutas: `subscriptions` tem 99 linhas `active` (todas concedendo
Pro) e `influencers` tem 28 concessões não revogadas.

Local, `subscriptions` por status:

| status | linhas | `cancel_at_period_end` | expiradas |
| --- | --- | --- | --- |
| active | 99 | 20 | 0 |
| canceled | 3 | 1 | 1 |
| past_due | 1 | 0 | 0 |

Stripe (`/v1/subscriptions?status=all`, 04:48 UTC):

| status | assinaturas |
| --- | --- |
| active | 92 |
| canceled | 1 |
| past_due | 1 |
| **total** | **94** |

`cancel_at_period_end` no Stripe: 22 no total, **21 entre as `active`**.
`trialing`: **zero** dos dois lados.

**Reconciliação linha a linha** (cruzamento por `provider_subscription_id`):

- **8 assinaturas `active` no banco local não existem no Stripe como Subscription.**
  O motivo é visível no identificador: o `provider_subscription_id` delas é um
  **Checkout Session id (`cs_live_…`)**, não um `sub_…`. São pagamentos avulsos
  (`mode: payment`) que concedem N meses de acesso sem criar objeto Subscription na Stripe.
  Composição: 2 × `pro_annual`, 6 × `pro_semiannual`.
  Prefixos no banco: `cs_` → 8 active + 2 canceled; `sub` → 91 active + 1 canceled + 1 past_due.
- **1 assinatura `active` no Stripe não existe no banco local**: `sub_1Tv4SXQ6lxIhx7VyTXK837Zy`,
  criada 2026-07-19T23:49:23Z, mensal R$ 29,90, `cancel_at_period_end: true`,
  cliente `cus_UuuH60fx3UKspZ`. **Esse e-mail não tem sequer perfil em `profiles`**
  (`select count(*) from profiles where email = …` → 0).
- **Divergências de `cancel_at_period_end` entre linhas que existem dos dois lados: 0.**
- **Assinaturas Stripe com cupom/desconto ativo: 0.**

Fecha exatamente: `99 − 8 + 1 = 92`.

### 2.2 Receita recorrente — MRR recomputado do Stripe

Recomputo independente (só `status='active'`, `unit_amount × quantity ÷ meses do
`recurring.interval × interval_count`, sem descontos):

```
MRR recomputado (Stripe): 258.940 centavos = R$ 2.589,40 sobre 92 assinaturas
Preços encontrados: 2990/month ×76, 22200/year ×9, 12900/month×6 ×7
```

Local, réplica de `getMrrSnapshot` com os preços de `planPricing.ts`:

```
active_count 99 | mrr_cents 272.550 | at_risk_count 20 | at_risk_cents 56.680
```

**Normalização mensal — o código faz a MESMA que eu fiz?** Sim.
`monthlyEquivalentCents` divide o preço do ciclo pelos meses do ciclo e arredonda:
mensal 2990→2990, semestral 12900/6→2150, anual 22200/12→1850. O Stripe representa o
semestral como `interval: month, interval_count: 6`, que dá os mesmos 6 meses.
Não há divergência de método.

**Reconciliação do delta de R$ 136,10 (13.610 centavos), sem resíduo:**

| Item | Centavos/mês |
| --- | --- |
| MRR local | 272.550 |
| − 2 avulsos anuais só no local (2 × 1.850) | −3.700 |
| − 6 avulsos semestrais só no local (6 × 2.150) | −12.900 |
| + 1 assinatura mensal só no Stripe | +2.990 |
| **= MRR Stripe** | **258.940** ✔ |

### 2.3 Receita no período — charges do Stripe na mesma janela

Stripe, charges criadas nos últimos 30 dias (04:50 UTC):

```
178 charges no total | 90 succeeded+paid | 88 failed
soma bruta das succeeded: 424.305 centavos = R$ 4.243,05
amount_refunded no conjunto: 14.874 centavos
```

Local, `finance_transactions` na mesma janela (04:46 UTC):

```
type='charge' nos últimos 30d: 89 linhas, gross 421.315 centavos = R$ 4.213,15
liquida 30d (charge+refund, net): 387.499 | taxas 30d: 18.942
```

**Delta: 424.305 − 421.315 = 2.990 centavos, e 90 − 89 = 1 charge.**
Reconciliação: a charge faltante é `ch_3Tv4SVQ6lxIhx7Vy1FdcOxBE`, R$ 29,90, 2026-07-19,
do mesmo cliente órfão da seção 2.1. **Resíduo zero.**

**Bruto ou líquido:** o card mostra **bruto**. Na janela, isso significa que ele exibe
R$ 4.213,15 ignorando R$ 189,42 de taxas Stripe e R$ 148,74 de um reembolso ocorrido
no período (`type='refund'`, 1 linha, `gross_cents = −14.874`). Receita líquida no mesmo
intervalo: R$ 3.874,99.

### 2.4 Receita em risco

| Fonte | count | valor/mês |
| --- | --- | --- |
| Card (local, `cancel_at_period_end` entre as do MRR) | 20 | R$ 566,80 |
| Stripe (`active` com `cancel_at_period_end`) | 21 | R$ 596,70 |

Delta: 1 assinatura, R$ 29,90 — de novo a `sub_1Tv4SX…` órfã. **Resíduo zero.**

O card também exibe `% do MRR`. Com os números locais: 56.680 / 272.550 = **20,8%**.

**O que a definição do código NÃO cobre:** `past_due` (1 assinatura local, 1 no Stripe,
R$ 29,90/mês) e falhas de pagamento. Os 88 charges falhados dos últimos 30 dias no Stripe
não entram em "receita em risco" por nenhum caminho.

### 2.5 Custo de IA

Card (janela default, 04:46 UTC): 2.115 chamadas, soma de `cost_estimate` = **2,4136**.

**Fonte independente para o valor absoluto: não há.** A OpenAI não expõe faturamento por
API key de forma consultável aqui, e as chamadas não carregam custo devolvido pelo
provedor. O que dá para verificar é a **consistência interna**, e ela tem três problemas
mensuráveis:

**(a) A unidade está errada.** `MODEL_PRICING` é documentado e escrito em **dólares** por
milhão de tokens (`aiTools.ts:47,55-58`). `estimateCostFromTokens` devolve dólares
(`aiTools.ts:101-104`). Esse número é gravado cru em `ai_usage_logs.cost_estimate`
(`aiUsage.ts:409,431`), somado por `custoTotalDeIa` — cuja docstring diz
`"Custo total em reais"` (`aiUsageStats.ts:51`) — exposto no campo `custoIa.valueBrl`
(`admin.ts:1032`) e formatado com `Intl.NumberFormat("pt-BR", {currency:"BRL"})`
(`Admin.tsx:643-648`). O card diz **R$ 2,41** onde o valor calculado é **US$ 2,41**.
Nenhuma conversão existe em nenhum ponto do caminho.

**(b) Cobertura por ferramenta: sete ferramentas sempre registram custo zero.**
Medido sobre a base inteira (04:47 UTC), `zero_cost == calls`:

| tool | chamadas | com custo 0 | desde |
| --- | --- | --- | --- |
| github-perfil | 79 | 79 | 2026-06-07 |
| career-plan | 65 | 65 | 2026-07-10 |
| interview-turn | 62 | 62 | 2026-07-07 |
| github-repo | 23 | 23 | 2026-06-07 |
| interview-session | 15 | 15 | 2026-07-07 |
| study-plan-build | 5 | 5 | 2026-06-21 |
| interview | 2 | 2 | 2026-06-28 |
| **total** | **251** | **251** | |

Causa confirmada no código, não inferida: essas rotas chamam `logAiUsage` **sem** o campo
`costEstimate`, e `logAiUsage` grava `params.costEstimate || 0`. Sítios verificados:
`server/routes/github.ts:137,184,196` (o `tool` é montado como `` `github-${mode}` ``,
linha 132), `server/routes/careerPlan.ts:275-282` (`tool: TOOL`, com `TOOL = "career-plan"`
na linha 44 — note que o **outro** tool do mesmo arquivo, `CAREER_PLAN_CHAT_TOOL`, passa
`costEstimate` na linha 457, então o arquivo tem os dois comportamentos),
`server/routes/interview.ts:1811` (com `TODO: calibrar costEstimate` explícito na linha
1809 — esse caso é declarado, é TTS da ElevenLabs, não OpenAI).

A grep completa de quem passa `costEstimate` cobre: `ai.ts`, `resumeAnalysis.ts`,
`linkedin.ts`, `careerPlan.ts` (só o chat), `agent.ts`, `aiRoadmap.ts`. Fora dessa lista,
o custo é zero por construção.

**(c) Uso da OpenAI que não passa pelo logger.** Enumerado por grep de `logAiUsage` nos
módulos que falam com a OpenAI:

| Módulo | Chama `logAiUsage`? | Situação |
| --- | --- | --- |
| `server/lib/linkedinAnalyze.ts` | não | coberto: a rota `linkedin.ts` loga |
| `server/lib/githubAnalyze.ts` | não | coberto pela rota (mas sem custo, item b) |
| `server/lib/resumeAnalyze.ts` | não | coberto: `resumeAnalysis.ts` loga com custo |
| **`server/lib/aiEnrich.ts`** | **não** | **LACUNA**: `enrichArticle` é chamado por `server/jobs/syncNews.ts` e `server/jobs/enrichBacklog.ts`. Gasto real de gpt-4o-mini que **não gera nenhuma linha em `ai_usage_logs`** |
| `server/lib/avatarUpload.ts` | não | moderação (`MODERATION_MODEL`), em `NON_TEXT_MODELS`; não logada |
| `server/lib/audioTranscribe.ts` | não | transcrição, cobrada por minuto; em `NON_TEXT_MODELS` |
| `server/lib/healthBand.ts` | n/a | não chama a OpenAI, só lê o status da sonda |

**Cobertura por ferramenta de produto, respondendo à pergunta do escopo:**

| Ferramenta | Loga chamada? | Loga custo? |
| --- | --- | --- |
| LinkedIn (`linkedin-analyzer`) | sim | **sim** |
| Currículo (`resume-analyzer`, `resume-builder`, `resume-render`) | sim | **sim** |
| Roadmap (`roadmap-generator`, `roadmap-intake-chat`) | sim | **sim** |
| Agente (`agent-chat`) | sim | **sim** |
| GitHub (`github-perfil`, `github-repo`) | sim | **não** |
| Simulador de entrevista (`interview-*`) | sim | **não** |
| Plano de carreira (`career-plan`) | sim | **não** |
| Quiz de carreira | — | **não usa IA** (`career_quiz_attempts` é determinístico; nenhum tool correspondente em `ai_usage_logs`) |
| Enriquecimento de notícias (`aiEnrich`) | **não** | **não** |

Além disso: 3 linhas com `cost_estimate` nulo (todas de `resume-builder`, sem `model`),
e 445 linhas com custo exatamente 0 na base inteira — as 251 acima mais as de status
`error`/`rate_limited`/`unauthorized`, que corretamente não têm custo.

## B3. Tabela final de divergências

Valores das 04:44-04:50 UTC de 2026-08-14. "Valor exibido" = o que o card mostraria,
computado pela réplica exata da query do handler.

| Card | Valor exibido | Fonte independente | Delta | Causa provável |
| --- | --- | --- | --- | --- |
| **Novos usuários** (default 30d) | 4.790 | contador da home: 5.456 | −666 | Não é erro: janela default de 30 dias vs total sem recorte. Com `window=all` o admin dá 5.456, exato. |
| **Assinantes Pro** | 99 | Stripe: 92 `active` | +7 | 8 pagamentos avulsos (`cs_live_…`) que só existem no banco, menos 1 assinatura Stripe sem linha local. Ver decomposição abaixo. |
| **Receita recorrente (MRR)** | R$ 2.725,50 | Stripe recomputado: R$ 2.589,40 | +R$ 136,10 | 8 avulsos locais (+R$ 166,00) − 1 assinatura Stripe ausente do banco (−R$ 29,90). Resíduo 0. |
| **Receita no período** (30d) | R$ 4.213,15 (89 charges) | Stripe: R$ 4.243,05 (90 charges) | −R$ 29,90 | 1 charge não sincronizada, do cliente órfão. Resíduo 0. Além disso o card é **bruto**: ignora R$ 189,42 de taxas e R$ 148,74 de reembolso na janela. |
| **Receita em risco** | R$ 566,80 (20 assinaturas) | Stripe: R$ 596,70 (21 `active` com `cancel_at_period_end`) | −R$ 29,90 | A mesma assinatura órfã. Resíduo 0. A definição também exclui `past_due` (1 assinatura, R$ 29,90/mês) e as 88 charges falhadas de 30 dias. |
| **Custo de IA** (30d) | "R$ 2,41" | sem fonte externa consultável | — | Três defeitos internos: (1) o valor é **US$**, exibido com símbolo R$; (2) 251 chamadas históricas de 7 ferramentas gravam custo 0 por falta de `costEstimate` no call site; (3) o enriquecimento de notícias gasta OpenAI sem gerar linha nenhuma. |

Decomposição do delta de "Assinantes Pro", que é o único não trivial:

```
99  bySubscription exibido (= 96 só-assinatura + 3 que também têm concessão)
-8  pagamentos avulsos cs_live_… (não existem como Subscription no Stripe)
+1  sub_1Tv4SX… (existe no Stripe, não existe no banco)
= 92  active no Stripe  ✔
```

Duas observações sobre esse card, independentes da divergência com o Stripe:

- **O rótulo diz "Assinaturas ativas" mas a regra inclui `trialing`**
  (`STATUS_QUE_DAO_PRO = {active, trialing}`). Hoje é inofensivo — há zero em trial nos dois
  lados — mas o número deixaria de bater com o MRR no primeiro trial, porque
  `getMrrSnapshot` exclui `trialing` do MRR de propósito.
- **As 3 pessoas em `both` são contadas DUAS vezes por quem lê a tela.** O card mostra
  `bySubscription` (**99**) e o `detail` mostra `byInfluencer` (**28**); os dois ramos são
  INCLUSIVOS, então quem soma chega a 127 e o total real é **124**. O `total` deduplicado é
  calculado e **enviado** pelo endpoint (`admin.ts`), e o client simplesmente não o usa
  (`Admin.tsx` lê só `bySubscription` e `byInfluencer`). O comentário em
  `userListEnrichment.ts:170-176` avisa exatamente disso ("o total NAO e a soma",
  "`total` é a união, e existe justamente para ninguém precisar somar por conta própria") —
  e a UI faz o leitor somar mesmo assim.

---

# PARTE C — Inventário para o redesign

## C1. Seções atuais da aba Visão

Ordem de renderização em `client/src/pages/Admin.tsx:7085-7290`.

| # | Seção | O que mostra | De onde vem | Custo / latência |
| --- | --- | --- | --- | --- |
| 1 | **Faixa de saúde** (`HealthBand`) | Problemas ativos: banco, OpenAI, Currents, Jooble, PostHog, Stripe, Redis, Resend, atraso do snapshot diário, boletos pendentes, **charges sem dono**, fila de e-mail. Verde = a faixa some | `/api/health` + `/admin/integrations/health` (cacheado); tipos em `server/lib/healthBand.ts` | 2 requisições, uma cacheada |
| 2 | **Seletor de período** | 7 / 30 / Tudo; governa só os 6 cards e os 2 gráficos | URL (`?window=`) | — |
| 3 | **6 cards** | Parte B | `GET /admin/overview` (9 leituras em `Promise.all`) | Ver medição abaixo |
| 4 | **Receita recorrente e assinantes** (`SubscriptionChart`) | Série de MRR e contagem de assinantes | `subscription_snapshots` (29 linhas, `snapshot_date` de 2026-07-16 a 2026-08-13) | barato, ≤30 linhas |
| 5 | **Cadastros por dia** (`SignupChart`) | Série diária | `GET /admin/signup-history`, lê `profiles.created_at` da janela e agrupa **em memória** por `diaBrasilia`; cache Redis 300s | ~4.800 linhas em 30d, 5 páginas paginadas; o cache é o que torna isso viável |
| 6 | **Funil principal** (`PaidFunnel`) | Visitante → cadastro → checkout → pagante, + boletos pendentes, + retornos, + assinantes sem rastro | PostHog (HogQL) **+** `subscriptions`; cache 300s; **janela fixa de 30d, declarada na tela** | 1 leitura PostHog + varredura paginada de `subscriptions` |
| 7 | **Aquisição de usuários** | Ranking de `$referring_domain` por pessoas únicas | PostHog, HogQL `select trimRight(properties.$referring_domain,'/') … limit 6`; **janela fixa de 30d, declarada** | 1 query do bundle de 9 do `getPosthogStats` |
| 8 | **Eventos recentes** | Últimas 10 ações de conteúdo | `GET /admin/dashboard` → `content_audit_logs` (149 linhas), `limit 10` | trivial |

**Latência das leituras do `/overview`**, medida às 04:54 UTC pela réplica PostgREST.
**Ressalva importante:** medido da minha máquina no Brasil contra o Supabase, então inclui
RTT de internet que o Railway não paga. Serve para ordenar as leituras entre si, não como
número absoluto de produção.

| Leitura | ms | Observação |
| --- | --- | --- |
| `contarPerfis` (count exato de `profiles` na janela) | **1.873** | a mais cara com folga; a rota faz **duas** (atual + anterior) |
| `contarProPorOrigem`: `subscriptions` | 640 | 103 linhas, paginado |
| `agregarUsoDeIa` (1ª de 3 páginas) | 451 | 2.115 linhas em 30d |
| `getFinanceSummary`: `finance_transactions` | 404 | executado **2×** (atual + anterior) |
| `getMrrSnapshot` | 402 | |
| `contarProPorOrigem`: `influencers` | 336 | 30 linhas |
| `getFinanceSummary`: `expenses` | 295 | 5 linhas, lido **2×** e sem filtro de data |

As 9 leituras rodam em `Promise.all`, então o tempo de parede é o pior caso (`contarPerfis`),
não a soma. **O `/overview` não tem cache** — ao contrário de `signup-history` e
`paid-funnel`, que têm 300s. Cada troca de janela e cada carga da página refaz tudo.

Referência de produção no momento da medição: `GET /api/health` respondeu
`responseTime: 136ms`, `uptime: 2335s`, todos os checks `ok`.

## C2. Dados que já existem e não viram métrica

Contagens e intervalos medidos às 04:52-04:53 UTC.

### Uso por ferramenta

| Fonte | Granularidade | Linhas | Desde |
| --- | --- | --- | --- |
| `ai_usage_logs` | 1 linha por chamada, com `tool`, `status`, `model`, `input_tokens`, `output_tokens`, `cost_estimate`, `user_id` | 2.346 | 2026-05-09 |
| `linkedin_analyses` | 1 por análise | 256 | 2026-07-11 |
| `linkedin_improvement_progress` | 1 por item de checklist | 129 | — |
| `github_analyses` | 1 por análise | 87 | 2026-07-04 |
| `github_improvement_progress` | | 31 | — |
| `resume_analyses` / `resumes` | 1 por análise / currículo | 73 / 52 | 2026-07-04 |
| `ai_roadmaps` + `roadmap_steps` + `roadmap_completions` | roadmap, passo, conclusão | 92 / 96 / 204 | 2026-07-04 |
| `interview_sessions` + `interview_turns` | sessão e turno | 14 / 118 | 2026-07-07 |
| `career_plans` | 1 por plano | 60 | — |
| `career_quiz_attempts` + `career_quiz_answers` | tentativa e resposta individual | 3.896 / 55.024 | 2026-05-09 |
| `roadmap_quiz_attempts` | | 138 | — |
| `agent_conversations` + `agent_messages` | | 31 / 130 | — |

`ai_usage_logs.user_id` permite **custo de IA por usuário e por ferramenta** hoje, sem
instrumentação nova — sujeito à ressalva (b)/(c) da Parte B sobre cobertura de custo.

### Assinaturas, cobranças, falhas, recuperação

| Fonte | Granularidade | Linhas | Desde |
| --- | --- | --- | --- |
| `subscriptions` | 1 por assinatura, com `provider`, `payment_method`, `renewal_type`, `affiliate_code`, `coupon_code`, `cancel_at_period_end` | 103 | 2026-07-13 |
| `subscription_snapshots` | **diária**, com `mrr_cents`, `by_plan`, `by_status` | 29 | 2026-07-16 |
| `subscription_cancellations` | 1 por cancelamento, com `reason_code` e `reason_text` | 28 | — |
| `finance_transactions` | 1 por transação (`charge`/`refund`/`payout`), com `gross`/`fee`/`net`/`plan_code` | 110 | 2026-07-13 |
| `billing_events` | webhooks brutos, com `event_type` e `raw` | 374 | — |
| `expenses` | despesas com recorrência | 5 | 2026-07-10 |
| `coupons` / `affiliates` | | 5 / 43 | — |
| `admin_refunds` | | 2 | — |

**Tabelas de falha e recuperação que existem e estão VAZIAS:**
`billing_failed_payments` (0), `payment_recovery_emails` (0), `billing_orphan_payments` (0),
`stripe_customers` (0). Grep no repositório inteiro (`.ts` + `.sql`): as três primeiras só
aparecem em `shared/database.types.ts` (tipos gerados) — **não existe nenhum escritor**
para `billing_failed_payments`, `payment_recovery_emails` nem `stripe_customers`.
`billing_orphan_payments` tem escritor (`server/lib/orphanPayments.ts:159,177`), mas com
janela deslizante de 7 dias (`DEFAULT_WINDOW_DAYS`), então o órfão de 2026-07-19 encontrado
nesta investigação já está fora do alcance dele.

Enquanto isso o Stripe registrou **88 charges falhadas nos últimos 30 dias**, contra 90
bem-sucedidas. Nada disso está no banco nem em nenhuma tela.

### PostHog

Eventos capturados no client (grep de `posthog.capture` em `client/src`):
`user_signed_up`, `user_signed_in`, `user_signed_out`, `oauth_sign_in_started`,
`checkout_started`, `checkout_abandoned`, `subscription_completed`, `pro_gate_hit`,
`content_gate_hit`, `quiz_completed`, `favorite_toggled`, `waitlist_signup`,
`whatsapp_support_clicked`, `chunk_reload`, `consent_request_failed`, e a família
`roadmap_ia_*` (`chat_iniciado`, `chat_bloqueado`, `can_generate`, `geracao_iniciada`,
`geracao_concluida`, `geracao_falhou`), mais `$pageview`/`$pageleave` automáticos.

Já consultados por HogQL em `server/lib/posthog.ts`: páginas mais vistas, ranking de
`pro_gate_hit` por `properties.feature` **com conversão para assinante**, domínio de
referência, tempo médio e scroll por página, saídas por sessão. A maior parte disso
alimenta as abas Conversão e Páginas, não a Visão.

### Operação e engajamento

| Fonte | Linhas | Desde |
| --- | --- | --- |
| `cron_run_logs` | 25.699 | 2026-05-18 |
| `user_progress` | 15.279 | 2026-05-20 |
| `user_consents` (`accepted_at`, `document`, `version`, `consent_method`) | 10.768 | — |
| `user_bookmarks` | 2.527 | 2026-05-07 |
| `notifications` / `notification_reads` / `notification_recipients` | 99 / 2.067 / 82 | 2026-07-16 |
| `email_campaigns` / `email_campaign_recipients` / `resend_events` / `email_suppressions` | 26 / 22.776 / 257 / 46 | — |
| `external_events` | 329 | 2026-08-11 |
| `waitlist` | 315 | 2026-07-06 a 2026-07-15 |
| `user_badges` / `certificates` | 137 / 58 | — |
| `admin_tasks` / `admin_bugs` | 101 / 25 | — |

### Onboarding

`profiles` já carrega `onboarding_completed` (bool), `onboarding_step` (int),
`area_interesse`, `nivel_atual`, `objetivo`, `career_goal`, `marketing_opt_in` +
`marketing_opt_in_at`, `welcome_email_sent`, `gender`, `city`/`uf`,
`linkedin_url`/`github_url`/`website_url`. Nenhum desses aparece na Visão. Dá para medir
**taxa de conclusão de onboarding e em que passo as pessoas param**, hoje, sem migration.

### Fila BullMQ

Existe e é observada, mas só como sinal binário: `healthBand.ts:55-59` expõe
`filaDeEmail: { failed, waiting } | null`, com `null` significando "fila indisponível", que
o comentário distingue explicitamente de "fila vazia". Não há série histórica.

### Fiscal

**`fiscal_invoices` não existe no banco de produção** (`information_schema.tables`
filtrado por `fiscal%` devolveu `[]`). Isso **não é um defeito**: as 5 migrations que a
criam (`20260804120000_create_fiscal_invoices.sql` em diante) estão apenas no commit
`33000fa7`, que vive só na branch `fix/openai-cota-credencial` e **não foi mergeado em
`origin/main`** (`git branch --contains 33000fa7` lista só essa branch). Registrado aqui
para o inventário: hoje não há dado fiscal para exibir.

## C3. O que NÃO existe e exigiria instrumentação nova

1. **Atribuição de aquisição por canal/UTM no banco.** Existe parcialmente **no PostHog**
   (`$referring_domain`, que é o que a seção "Aquisição de usuários" mostra). O que não
   existe: nenhuma coluna de UTM/canal/`landing_page` em `profiles` ou em `subscriptions`,
   e nenhum `posthog.capture` com `utm_*` explícito. Consequência prática: não dá para
   cruzar canal com receita no SQL, só olhar pessoas por domínio referenciador no PostHog,
   com todas as limitações de bloqueador de anúncio (o próprio `paid-funnel` já devolve
   `assinantesSemRastro` justamente por isso).
2. **Registro de falha de pagamento e de recuperação.** As tabelas existem e estão vazias
   por falta de escritor. Instrumentar significa consumir os eventos
   `invoice.payment_failed` / `charge.failed` do Stripe e persistir; hoje eles chegam em
   `billing_events` cru, sem nenhuma leitura agregada.
3. **Custo de IA em reais.** Falta a conversão USD→BRL (e a decisão de qual cotação usar e
   quando congelá-la), além de fechar as lacunas de `costEstimate` da Parte B.
4. **Custo de IA do enriquecimento de notícias.** `aiEnrich` precisaria chamar `logAiUsage`
   (não há `userId` natural ali — é job de sistema, então exigiria decidir como representar
   isso na tabela).
5. **Série histórica de MRR anterior a 2026-07-16.** `subscription_snapshots` só existe
   desde então; os 29 pontos são todo o histórico. Reconstruir o passado exigiria derivar
   de `finance_transactions` (que começa em 2026-07-13) ou do Stripe.
6. **Agregação de cadastros por dia no banco.** Hoje o `signup-history` varre ~4.800 linhas
   e agrupa em memória. O comentário do handler (`admin.ts`, seção "SERIE DIARIA DE
   CADASTROS") já registra que a evolução natural é uma função de agregação, e por que ela
   não entrou.
7. **Retenção / coorte de assinantes.** Existe `getUsageRetention` (retenção de *uso*, dias
   desde o último acesso) e `subscription_cancellations` com motivo, mas não há coorte por
   mês de assinatura nem curva de sobrevivência.

---

# Apêndice: os cinco achados mais importantes

1. **A divergência de usuários não é um bug, é a janela default de 30 dias, e ela fecha
   com resíduo zero.** 5.456 (home) − 4.790 (admin `window=30`) = 666, e os perfis com
   `created_at` anterior a 30 dias são exatamente 666. Com `window=all` o admin devolve
   5.456, o mesmo número da home. Não há offset, não há cache relevante, não há
   soft-delete, não há divergência de tabela: `auth.users` e `profiles` têm 5.456 cada,
   com zero órfãos nos dois sentidos.

2. **Existe um cliente pagando na Stripe que não existe no produto.**
   `sub_1Tv4SXQ6lxIhx7VyTXK837Zy` / `cus_UuuH60fx3UKspZ`, mensal R$ 29,90, criada
   2026-07-19, `active` com `cancel_at_period_end: true`. Não há linha em `subscriptions`
   **e não há sequer perfil em `profiles` com esse e-mail**. É a mesma assinatura que
   explica, sozinha, os três deltas de dinheiro contra o Stripe (MRR, receita no período,
   receita em risco). O detector de órfãos existe (`orphanPayments.ts`) mas tem janela de
   7 dias, então já não a alcança; a charge dela aparece hoje só como uma das
   2 "cobranças sem dono" de `finance_transactions` (R$ 120,20 no total, a mais antiga de
   2026-07-19).

3. **O card "Custo de IA" mostra dólares com símbolo de real, e ignora 7 ferramentas.**
   `MODEL_PRICING` é declarado em US$/milhão de tokens, o valor é gravado cru, o campo se
   chama `valueBrl` e é formatado como BRL. Além disso, 251 chamadas históricas
   (github-perfil, career-plan, interview-turn, github-repo, interview-session,
   study-plan-build, interview) gravam custo 0 porque o call site não passa `costEstimate`,
   e o enriquecimento de notícias (`aiEnrich`, usado por `syncNews` e `enrichBacklog`)
   gasta OpenAI **sem gerar linha nenhuma** em `ai_usage_logs`. O número exibido é um piso
   sobre um subconjunto, numa moeda errada.

4. **Os seis cards e o gráfico logo abaixo usam definições diferentes de "últimos 30 dias":
   182 cadastros de diferença, medidos.** Os cards usam janela deslizante por instante em
   UTC (`agora − 30×24h`); o gráfico "Cadastros por dia" usa 30 dias civis de Brasília via
   `diaBrasilia`. 4.788 contra 4.606 às 04:53 UTC. Cada um é internamente coerente; juntos,
   na mesma tela, com o mesmo rótulo, não somam.

5. **O card "Assinantes Pro" apresenta duas parcelas que se SOBREPÕEM, e o total
   deduplicado, que o backend envia, não é usado.** Ele exibe `bySubscription` (**99**) e,
   no detalhe, `byInfluencer` (**28**); quem soma chega a 127 e o total real de pessoas com
   Pro é **124**. As 3 pessoas em `both` (assinatura **e** concessão de influencer) entram
   nas duas parcelas, por decisão explícita de `tallyProSources`
   (`bySubscription = só_assinatura + both`, comentada no código como "quem tem os dois
   conta nos DOIS ramos"). O `total` já vem pronto na resposta; o client simplesmente não o
   lê. Somam-se dois desalinhamentos de rótulo: "Assinaturas ativas" inclui `trialing` (que
   o MRR exclui de propósito), e o card ignora o seletor de período sem dizer isso — ao
   contrário do card de Receita em risco, que declara.

   > **Este achado foi CORRIGIDO em 2026-08-14 05:45 UTC**, e a correção inverte o
   > mecanismo. A primeira versão dizia que as 3 pessoas "somem da tela" (96 + 25 = 121 <
   > 124). O erro foi meu, e foi de instrumento: escrevi uma réplica SQL com contagem
   > mutuamente exclusiva e a chamei de "réplica de `tallyProSources`" sem conferir a função
   > contra a fonte. É a mesma classe que este documento persegue — um instrumento cujo
   > escopo eu derivei em vez de ler, e que falhou **passando**, com um número plausível.
   > Quem acusou foi um teste (`server/routes/adminOverviewCards.test.ts`) escrito contra o
   > código real, não contra a minha réplica. A conclusão prática (headline = `total`
   > deduplicado) não muda; o que muda é que o defeito é dupla contagem, não omissão.

## Estado do repositório ao final

- **Branch atual:** `fix/openai-cota-credencial`
- **Posição:** 3 commits à frente de `origin/main`, **35 commits atrás**
- **`git status` resumido:** 34 arquivos modificados, 3 deletados
  (`server/lib/linkedinHeadlineFinalUnica.test.ts`, `server/lib/linkedinHeadlineManual.test.ts`,
  `server/routes/linkedinHeadlineManualRota.test.ts`), 2 não rastreados
  (`client/src/lib/seoJsonLd.test.ts`, `design/`), mais este relatório.
  As modificações concentram-se em `shared/linkedin/`, `server/lib/linkedin*`,
  `server/routes/linkedin.ts` e em SEO no client — **nenhuma delas toca a Visão, o
  `/overview` ou o contador da home** (conferido por `git diff origin/main` arquivo a
  arquivo, ver a seção de fidelidade no topo).
- **Implicação para planejar a próxima frente:** há trabalho não commitado de outra frente
  nesta árvore. Pela política de `CLAUDE.md`, a correção das métricas deve nascer em
  **worktree separado** (`git worktree add /home/s0ft/bnt-<frente> -b <branch> main`),
  não aqui.
