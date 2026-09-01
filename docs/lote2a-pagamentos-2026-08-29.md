HEAD_FINAL: 46cce929ddc973f2d3c55f28024d66cbd0f32203

Worktree: /home/s0ft/bnt-asaas | Branch: pix/lote2a | Base: origin/main @ 8b219a6e114790b0d0ec939a29012a168e851e65

Quatro commits locais. Nenhuma migration criada e nenhuma aplicada. Nenhum push, nenhum merge.
Nenhuma string visivel ao usuario foi criada (ver "Frontend" no fim).

---

## Parte 1: investigacao dirigida

Anchors no HEAD atual. Todos se moveram desde o Passo 0 e desde o Lote 1a.

### 1. `PaymentProvider` e o literal do `name`

`server/providers/types.ts:84-90`, antes deste lote:

```ts
export interface PaymentProvider {
  readonly name: "stripe";
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  cancel(input: CancelInput): Promise<CancelResult>;
  reactivate(input: ReactivateInput): Promise<ReactivateResult>;
  handleWebhook(input: WebhookInput): Promise<WebhookResult>;
}
```

**O que mais depende do literal `"stripe"`, e a distincao importa:** o `name` da interface era o
UNICO sitio de tipo. Os demais 17 sao valores gravados ou lidos, nao tipos, e nenhum deles muda
neste lote:

| Sitio | Natureza |
| --- | --- |
| `server/providers/types.ts:85` | **tipo**, o unico. Virou uniao |
| `server/providers/stripe.ts:600`, `:811`, `:1887` | valor gravado em `subscriptions.provider` / `billing_events.provider` |
| `server/providers/stripe.ts:1494`, `:1642` | filtro `.eq("provider", "stripe")` em `cancel` e `reactivate` |
| `server/providers/stripe.ts:2045` | valor do proprio `stripeProvider.name` |
| `server/routes/admin.ts:3204`, `:4154` | filtro de provider nas rotas de admin |
| `server/routes/cron.ts:363`, `:370`, `:425`, `:431`, `:436`, `:511`, `:514`, `:949` | rotulo de `RowOutcome`, nao o campo do banco |
| `server/routes/me.ts:467` | tag de Sentry |

Os filtros `.eq("provider", "stripe")` sao a razao de o Pix nao vazar para os fluxos de cancelamento
e reativacao da Stripe: uma linha `provider='asaas'` simplesmente nao e encontrada por eles.

### 2. `server/providers/index.ts` e a rota de webhook da Stripe

O arquivo tinha 4 linhas e dizia, no comentario, "Provider de pagamento unico: Stripe. Nao ha
seletor por env; o webhook tem rota fixa". A rota da Stripe e `server/routes/billing.ts:503`
(`router.post("/webhook/stripe", ...)`), montada em `server/app.ts:476`
(`app.use("/api/billing", billingRouter)`), e o prefixo `/api/billing/webhook` tem `express.raw`
dedicado em `server/app.ts:397-405`, porque a Stripe autentica por assinatura sobre os bytes crus.

### 3. Idempotencia de `billing_events`: ACHADO PRINCIPAL

Schema, de `supabase/migrations/20260526054330_billing_events_idempotency.sql:4-12` mais duas
migrations posteriores:

```sql
create table if not exists public.billing_events (
  id text primary key,                 -- event.id do Asaas (evt_...)
  event_type text not null,
  provider_subscription_id text,
  payment_id text,
  event_created_at timestamptz,
  received_at timestamptz not null default now(),
  raw jsonb
);
-- 20260713180000: provider text not null default 'asaas'
-- 20260727130000: processed_at timestamptz
```

**A coluna unica e `id`, e a unicidade e GLOBAL. A coluna `provider` existe mas NAO compoe a
chave.** Os dois provedores emitem ids que comecam por `evt_`.

Isso NAO comporta um segundo provedor sem namespace. Uma colisao entre um id do Asaas e um id da
Stripe ja gravado nao daria erro: o upsert com `ignoreDuplicates` trataria o evento novo como ja
visto, devolveria 200, e **o pagamento sumiria em silencio**. Probabilidade minuscula, consequencia
maxima, e e a classe de falha que esta base ja pagou caro.

**Decisao: NAO criar migration.** Ver a secao "Decisao da migration".

### 4. `BOLETO_ACCESS_DAYS` e as camadas que negam por nome

| Camada | Posicao atual | Forma |
| --- | --- | --- |
| Mapa canonico (por INCLUSAO) | `server/providers/stripe.ts:1224-1227` | lista quem pode |
| Provider, recusa | `server/providers/stripe.ts:1416-1420` | `boleto_not_allowed_on_monthly` |
| Rota, recusa por nome | `server/routes/billing.ts:404` | nega `pro_monthly` nominalmente |
| Frontend, decide o dialogo | `client/src/pages/Checkout.tsx:734` | `selectedPlan === "pro_monthly"` |

So localizado, conforme instruido. A consolidacao fica para o lote do frontend.

### 5. Como o boleto cria a linha `pending`, e a chamada da RPC

Linha pendente: `server/providers/stripe.ts:808-838`, dentro de `applyBoletoPending`. Preenche
`user_id`, `plan_id`, `provider`, `provider_subscription_id` (o id da SESSAO, `cs_...`),
`provider_customer_id`, `affiliate_code`, `coupon_code`, `status: "pending"`, `payment_method`,
`renewal_type: "manual"`, periodo nulo, `last_event_at`, `raw_provider_payload`. Upsert com
`onConflict: "provider_subscription_id", ignoreDuplicates: true`.

RPC pos-Lote 1a: `server/providers/stripe.ts:971-1030`, com os seis parametros, a captura
`stripe_boleto_ativacao_falhou` no erro, o tratamento de retorno vazio e o `out_activated === false`
encerrando sem redisparar efeitos.

**CONTRADICAO FACTUAL COM O ENUNCIADO, e ela e material.** O prompt manda criar a linha local antes
da cobranca remota e diz que essa e a "mesma ordem do boleto". **Nao e.** No boleto a sessao da
Stripe nasce PRIMEIRO, em `createCheckout`, e a linha `pending` so aparece quando o
`checkout.session.completed` chega. Nao existe linha local antes da chamada remota naquele fluxo.

Isso nao contradiz nenhuma das decisoes de escopo listadas no enunciado (Pix avulso, taxas, reusar o
modelo, sandbox, sem frontend), entao nao parei. **Implementei a ordem que o prompt manda**, que e
genuinamente melhor: a ordem do boleto e exatamente a que obrigou a inventar
`billing_orphan_payments` e o cron `detect-orphan-payments` depois, porque um
`checkout.session.completed` perdido deixa dinheiro do lado da Stripe sem linha nenhuma. O comentario
no codigo registra a diferenca em vez de repetir a afirmacao errada.

### 6. Validacao de env na subida

Objeto lido em `server/lib/env.ts:73-83` (bloco Stripe). Validacao fail-closed em
`server/lib/env.ts:312-329`, dentro de `if (env.billingEnabled)`, acumulando os faltantes e
chamando `process.exit(1)`.

---

## 2.1 Configuracao

**Variaveis novas (NOMES apenas):** `ASAAS_API_URL`, `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`.

Campos em `server/lib/env.ts`: `asaasApiUrl`, `asaasApiKey`, `asaasWebhookToken` e o derivado
`asaasEnabled`.

**Fail-closed POR INTEIRO, e a checagem e conjuntiva.** `asaasEnabled` exige as tres presentes. O
comentario registra por que o meio-termo e o estado perigoso: com a chave e sem o token de webhook, o
checkout criaria cobranca real que nenhum webhook autenticado poderia confirmar (dinheiro entra,
acesso nao sai); com o token e sem a chave, a rota aceitaria evento de uma cobranca que este ambiente
nunca criou.

**Diferenca deliberada em relacao ao bloco da Stripe:** a Stripe ABORTA O BOOT quando falta
credencial, porque `BILLING_ENABLED=true` declara a intencao de vender. O Asaas ainda nao e a via
principal: a ausencia dele e um meio de pagamento a menos, nao um site quebrado. Entao o processo
SOBE com o provider desligado, e o motivo e dito uma vez no boot em vez de descoberto no primeiro
checkout. O que nao existe e o meio-termo silencioso: parcialmente configurado loga como ERRO.

**`ASAAS_API_URL` vem de env e nao e derivada de `isProd`**, de proposito: sandbox e producao sao
hosts diferentes, e um booleano decidindo host de cobranca e o tipo de inferencia que manda dinheiro
para o lugar errado sem ninguem declarar nada.

**Estado local medido:** `ASAAS_WEBHOOK_TOKEN` tem 64 caracteres no `.env`; `ASAAS_API_KEY` esta
**definida mas VAZIA** (sandbox ainda nao provisionado). Com isso `asaasEnabled` e `false` nesta
maquina, e o Pix fica desligado, que e exatamente o comportamento desejado. Nenhum valor aparece
neste relatorio.

Existe tambem um `ASAAS_ENV` legado no `.env`, de 10 caracteres, que **nao e lido por este codigo**.

## 2.2 `server/providers/asaas.ts` e `server/lib/asaasClient.ts`

**Cliente HTTP proprio, fino** (`server/lib/asaasClient.ts`): sao tres endpoints, e uma dependencia a
mais no caminho do dinheiro custa mais do que resolve. Teto de 15s por requisicao (`fetch` nativo nao
tem timeout; mesmo valor do `supabaseAdmin`). Distingue falha de TRANSPORTE (`502 asaas_unreachable`)
de recusa do provedor (`502 asaas_error`), porque falha de transporte pode ter criado a cobranca do
outro lado sem devolver o id. Guard fail-closed DENTRO da funcao, nao so no chamador.

**`PIX_ACCESS_DAYS`** (`server/providers/asaas.ts`): por INCLUSAO, so `pro_semiannual: 182` e
`pro_annual: 365`, os MESMOS numeros do boleto. O acesso comprado nao pode depender do meio de
pagamento. Plano fora do mapa: `400 pix_not_allowed_on_monthly`, mesmo formato do boleto.

**`PIX_DUE_DAYS = 2`**, e nao os 3 do boleto: um Pix e instantaneo, o prazo e so a validade do QR
Code, e prazo longo mantem a linha `pending` bloqueando o guard 409 por muito mais tempo do que a
pessoa leva para pagar.

**Customer: busca ANTES de criar.** O Asaas nao deduplica por `externalReference`; dois POST criam
dois customers para a mesma pessoa e partem o historico dela em dois, sem erro para acusar.

**Ordem das escritas:** (1) linha local `pending` com `provider_subscription_id` NULL, (2) cobranca
remota com `externalReference` = id da linha, (3) UPDATE amarrando `provider_subscription_id` ao id
da cobranca. `provider_subscription_id` e UNIQUE, e no Postgres UNIQUE admite varios NULL, entao
linhas em voo nao colidem. Falha em (2) cancela a linha para nao travar o guard 409 da proxima
tentativa.

**Guards de duplicidade**, os dois fail-closed (erro de query BLOQUEIA): `409 conflict` para quem ja
tem assinatura ativa, `409 pix_pending` para quem ja tem Pix aguardando. O indice unico e a rede de
seguranca, nao a primeira linha: sem o guard a pessoa pagaria e so entao descobriria, por um 23505 no
webhook, que ja era assinante.

**`cancel` e `reactivate`: NAO sao no-op silencioso.** O enunciado pedia no-op "seguindo o que o
boleto faz". Verifiquei o boleto e ele NAO e no-op: ele registra a intencao de nao renovar em
`subscription_cancellations` e devolve `non_renewal: true`. Como este lote nao expoe cancelamento de
Pix pela UI, implementar aquele registro seria escrever caminho sem chamador. Entao os dois **lancam
`400 pix_sem_recorrencia`**, o que garante o unico efeito que importa hoje: ninguem chama o Asaas
achando que existe assinatura remota para cancelar. Devolver sucesso vazio esconderia a chamada
errada. O registro da intencao fica para o lote que expuser a acao.

**`handleWebhook` do contrato lanca, e isso e deliberado.** `WebhookInput` carrega `rawBody` porque
foi desenhado para a assinatura HMAC da Stripe. O Asaas autentica por token no header, que nao toca o
corpo. Forcar o Asaas por esse metodo seria fingir que ele usa algo que nao usa; a rota chama
`processarEventoAsaas` diretamente. O metodo existe para satisfazer o tipo e lanca se alguem o chamar
por engano.

## 2.3 Webhook

**Rota:** `POST /api/webhooks/asaas` (`server/routes/webhooksAsaas.ts`, montada em
`server/app.ts:480`). Fora de `/api/billing` de proposito: aquele prefixo carrega o `express.raw` da
Stripe, que este provedor nao usa.

**Autenticacao:** `asaas-access-token` comparado em tempo constante. `timingSafeEqual` LANCA com
buffers de tamanhos diferentes, e o tamanho e justamente o que um atacante controla, entao comparar
comprimento antes reintroduziria o vazamento por outro caminho. A funcao normaliza para o tamanho do
esperado e so entao compara. Token esperado vazio nunca confere: configuracao ausente nao vira porta
aberta.

**Contrato de status, desenhado contra a fila do Asaas** (que PAUSA a conta inteira depois de uma
sequencia de falhas):

| Status | Quando |
| --- | --- |
| 401 | token ausente ou errado, **sem corpo** |
| 503 | Asaas desligado por configuracao incompleta, **checado ANTES do token** |
| 200 | processado, duplicado, ou tipo desconhecido |
| 500 | falha de processamento, para a reentrega acontecer |

O 503 vem antes do 401 porque sem configuracao nao ha token esperado com que comparar, e um 401 diria
"credencial errada" sobre um ambiente que simplesmente nao tem Asaas.

**Idempotencia:** `billing_events` com `id = "asaas:" + event.id`. Repetido devolve 200 imediato.
Falha no processamento apaga o registro (compensacao) para a reentrega reprocessar.

**Eventos:** `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED` ativam via
`activate_subscription_exclusive`; `PAYMENT_OVERDUE` e `PAYMENT_DELETED` encerram a linha `pending`
(condicional em `pending`, sem efeitos de transicao, porque a pessoa nunca teve acesso). Desconhecido
devolve 200 com log e **nao grava `billing_events`**: o dedupe nao protege nada num evento que nao
muta, e a linha travaria um resend futuro se um handler surgir depois (foi o que aconteceu com um
`async_payment_succeeded` da Stripe).

**Sentry:** `asaas_webhook_falhou` em qualquer falha de processamento, com nome e id do evento, mais
`asaas_ativacao_falhou` no erro especifico da RPC. Falha repetida PAUSA a fila, e isso precisa ser
visivel no dia 1.

**Comissao:** pelo caminho unico. `paidAmountCentsFromAsaas` converte reais para centavos com
`Math.round` (o float do JSON traz 129.99999) e devolve `null` quando o evento nao declara valor.
`null` NAO vira zero: `recordAffiliateConversion` pula o incremento e captura, mesmo contrato do
cartao e do boleto.

**Efeito extra necessario:** `invalidateProStatusCache` apos a ativacao. Sem ele a pessoa que acabou
de pagar continua nao-Pro ate o TTL de 60s expirar. Tambem conta o resgate do cupom, no mesmo ponto
em que a Stripe conta.

### Refactor que este lote precisou fazer, e por que

`recordAffiliateConversion` estava em `server/providers/stripe.ts`. Usar "o caminho unico" a partir do
Asaas exigiria `import ... from "./stripe"`, ou seja, o provedor Asaas carregando o SDK da Stripe e o
`PLAN_BY_PRICE` que aquele modulo monta no load. Movi a funcao para `server/providers/shared.ts`, que
existe exatamente para "regra compartilhada entre os providers" (e ja hospeda `isFirstPurchase`).
Rename puro de local, sem mudanca de comportamento; os 19 casos de `comissaoBasePaga.test.ts`
continuam passando com a importacao atualizada. Commit proprio, separado do resto.

**O que NAO foi reaproveitado, e fica declarado:** o e-mail transacional de ativacao. Ele vive em
`handleTransition`, que nao e exportado, e o texto dele e copy visivel ao usuario, fora do escopo
deste lote. **Um Pix pago hoje ativa o acesso e nao dispara e-mail de confirmacao.** Nao e regressao
(o fluxo nao existia), e a consolidacao dos efeitos de transicao entre os dois provedores fica
pendente.

## 2.4 Decisao da migration: NAO CRIADA

A unicidade de `billing_events.id` e global, entao **nao comporta** um segundo provedor sem namespace
(Parte 1, item 3). A pergunta e onde o namespace vive.

**Escolhido: no VALOR.** `chaveDeEvento()` prefixa `asaas:`, num unico lugar. Colisao vira impossivel
por construcao (id da Stripe nunca contem `:`), linhas existentes nao sao tocadas, e o custo e zero.

**Descartado: chave composta `(provider, id)`.** E mais robusta (nao depende de ninguem lembrar do
prefixo, que e o principio de "protecao dentro da funcao"), mas exige DROP e recriacao de PRIMARY KEY
numa tabela viva, ou seja, migration destrutiva com janela, para eliminar uma colisao teorica. A
contramedida escolhida fica escrita no codigo com essa justificativa, para a decisao nao ser reaberta
do zero.

**Consequencia:** nenhum contador `EXPECTED_*` mudou, e `pnpm check:scripts` nao era exigido. Rodei
`pnpm check:migrations` mesmo assim para confirmar que nada regrediu.

## 2.5 Testes

**37 casos novos**, em dois arquivos. Nenhum toca rede: o cliente do Asaas e dublado por inteiro.

`server/providers/asaasPix.test.ts` (25 casos): plano fora do mapa recusa **sem tocar o Asaas**; os
dias batem com os do boleto; o insert da linha e a PRIMEIRA escrita, com `provider_subscription_id`
nulo; a cobranca leva `externalReference` = id da linha; a linha e amarrada depois; o customer e
BUSCADO antes de criado; falha no Asaas cancela a linha pendente; os dois guards 409; a chave gravada
tem namespace; o **mesmo evento duas vezes ativa uma vez so**; a RPC recebe os seis parametros certos;
o periodo e o do plano; **nenhuma escrita direta de status** no caminho de ativacao; erro da RPC
captura e propaga; conversao de reais para centavos; **ausencia de valor pula o incremento e captura**;
`PAYMENT_OVERDUE` e `PAYMENT_DELETED` encerram; evento desconhecido nao escreve nada; pagamento sem
linha grita.

`server/routes/webhookAsaasAuth.test.ts` (12 casos): token exato, errado de mesmo tamanho, mais curto,
mais longo, prefixo correto de tamanho errado, esperado vazio; 401 sem corpo com token ausente e com
token errado; **503 vence o token quando desligado**; 200 no caminho feliz; **200 em evento
desconhecido, com o motivo escrito** (4xx pausaria a fila); erro vai para o `next`.

**Dois casos existem para o instrumento nao mentir**: um afirma que um UPDATE direto APARECE no
gravador de escritas, porque cinco outros afirmam `escritas` VAZIO e uma afirmacao de vazio passa
igual quando o duble parou de gravar.

**Dois defeitos do meu proprio dube foram encontrados e corrigidos durante a execucao**, e ficam
registrados: (a) o helper de evento tinha `...over` DEPOIS da chave `payment`, entao um caso que so
queria mexer em `value` apagava `id` e `externalReference` silenciosamente; (b) a tabela `affiliates`
nao devolvia linha, entao o teste de comissao passava por um caminho que nunca chegava a RPC. Os dois
apareceram como falha, nao como verde enganoso, porque os casos afirmavam presenca e nao ausencia.

---

## Saidas das baterias

```
$ pnpm check           -> EXIT=0
   [generateRoadmapMeta] em sincronia. [generateSitemap] 119 rotas. [checkCspHashes] 1 hash.
$ pnpm test            -> EXIT=0
   Test Files  241 passed | 3 skipped (244)
        Tests  3163 passed | 10 skipped (3173)
$ pnpm check:limiares  -> EXIT=0
   131 sitios | 55 cobertos por ancora | 76 nao-limiar | 0 ORFAOS
   ok: 57 ancoras de mutante casam com a fonte
```

Eram 3126 testes antes deste lote; 3163 agora, os 37 novos.

`pnpm check:scripts` nao foi exigido: nenhum arquivo em `scripts/` foi tocado (a migration nao foi
criada, entao nenhum contador mudou).

## Conferencia de travessoes

Python, byte a byte, sobre os 12 arquivos que o lote tocou:

```
server/app.ts                                U+2014=0 U+2013=0
server/lib/asaasClient.ts                    U+2014=0 U+2013=0
server/lib/env.ts                            U+2014=0 U+2013=0
server/providers/asaas.ts                    U+2014=0 U+2013=0
server/providers/asaasPix.test.ts            U+2014=0 U+2013=0
server/providers/comissaoBasePaga.test.ts    U+2014=0 U+2013=0
server/providers/index.ts                    U+2014=0 U+2013=0
server/providers/shared.ts                   U+2014=0 U+2013=0
server/providers/stripe.ts                   U+2014=0 U+2013=0
server/providers/types.ts                    U+2014=0 U+2013=0
server/routes/webhookAsaasAuth.test.ts       U+2014=0 U+2013=0
server/routes/webhooksAsaas.ts               U+2014=0 U+2013=0
TOTAL: 0
```

## Varredura de segredo

Nenhum valor de segredo aparece em codigo, teste ou relatorio. Conferido programaticamente contra os
valores reais de `ASAAS_WEBHOOK_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e
`SUPABASE_SERVICE_ROLE_KEY`: 12 arquivos conferidos, ACHADOS: nenhum.

**A primeira versao deste verificador deu FALSO POSITIVO em todos os arquivos**, e fica registrado
porque e a mesma familia de defeito que este projeto documenta: `grep -F "$VAR"` com a variavel VAZIA
procura a string vazia, que casa toda linha. `ASAAS_API_KEY` esta vazia no `.env` local. A versao
corrigida ABORTA quando um segredo nao tem valor utilizavel, em vez de emitir veredito, e diz quais
pulou.

## Frontend

Nenhuma string visivel ao usuario foi criada. As mensagens dos `createError` deste lote ("Pagamento
por Pix indisponível no momento.", "Pix não está disponível neste plano.", "Você tem um Pix aguardando
pagamento.", "Compra por Pix não tem renovação automática para cancelar.") sao mensagens de ERRO DE
API, no mesmo registro das que o fluxo do boleto ja usa, e nenhuma tela as renderiza hoje: nao ha
frontend de Pix. Se alguma delas for exibida no lote de frontend, passa pela revisao de copy da Ana
junto com o resto.

## Commits

| Hash | Mensagem | Arquivos |
| --- | --- | --- |
| `12154255` | `refactor(affiliates): move conversion helper to shared provider module` | `shared.ts`, `stripe.ts`, `comissaoBasePaga.test.ts` |
| `857ec46c` | `feat(asaas): add fail-closed configuration and widen provider name union` | `env.ts`, `types.ts` |
| `54f0ee44` | `feat(asaas): add pix provider with pending row before remote charge` | `asaasClient.ts`, `asaas.ts`, `index.ts`, `asaasPix.test.ts` |
| `46cce929` | `feat(asaas): add authenticated idempotent webhook route` | `webhooksAsaas.ts`, `webhookAsaasAuth.test.ts`, `app.ts` |

Staging por nome explicito, `git diff --cached --name-only` conferido antes de cada um, commit com
pathspec. Pre-commit verde nos quatro.

**Nenhum push, nenhum merge, nenhuma migration aplicada.**

## git status --porcelain final

```
?? lote2a-pagamentos-2026-08-29.md
```
