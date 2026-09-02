HEAD_FINAL: 86e03dca315efdfebcc6df97713f52f57900cded

Worktree: /home/s0ft/bnt-asaas | Branch: pix/lote2a | Base: origin/main @ 8b219a6e114790b0d0ec939a29012a168e851e65

Quatro commits novos (onze na branch). Nenhuma migration. Nenhum push, nenhum merge.

---

## DOIS DESVIOS DE ESCOPO, declarados antes de tudo

O escopo de arquivos deste lote nao comportava o que a Tarefa 2 pede. Registro os dois no topo em
vez de escondidos no meio.

**1. `shared/paymentMethods.ts` e `shared/paymentMethods.test.ts` sao arquivos NOVOS, fora da lista.**
A Tarefa 2 exige "um unico ponto de verdade" consumido pela UI **e** pela rota. A UI nao pode
importar de `server/`, e nenhum arquivo de `shared/` estava na lista. Sem um modulo cross-tier o
requisito e impossivel de cumprir, e a alternativa (duplicar) e exatamente o que a tarefa manda
eliminar. Escolhi implementar e sinalizar; parar entregaria zero e a intencao era inequivoca.

**2. `server/providers/stripe.ts` foi editado, e nao estava na lista.** A Tarefa 2.1 manda derivar o
ponto unico "dos mapas `BOLETO_ACCESS_DAYS` e `PIX_ACCESS_DAYS`". Unificar significa que o mapa do
boleto deixa de existir, e ele mora em `stripe.ts`. A mudanca sao **duas linhas** (o `const` some, o
call site passa a chamar `oneOffAccessDays`). A alternativa era deixar dois mapas que precisam ser
iguais sem guarda nenhuma, que e a classe de defeito que este projeto documenta.

Tambem foram tocados, como consequencia mecanica e nao como escopo novo:
`server/providers/types.ts` (o alias de `CheckoutPaymentMethod`), `client/src/services/subscriptionService.ts`
(terceira copia da uniao, achada na Tarefa 1) e `server/routes/webhooksAsaas.ts` mais seu teste
(call site do simbolo renomeado na Tarefa 0).

---

## Tarefa 0: rename completo em `asaas.ts`

Commit `b6f77705`, sozinho, 254 insercoes e 251 remocoes. `tsc` verde antes e depois, testes sem
mudanca de expectativa (49 casos dos dois arquivos do Asaas passaram sem tocar em asserção nenhuma).

**Ficaram como estao, e a razao e a mesma nos dois casos:** nomes ditados pela interface
`PaymentProvider` (`createCheckout`, `cancel`, `reactivate`, `handleWebhook`) e nomes que descrevem o
payload do Asaas (`AsaasEvent`, `AsaasCustomer`, `AsaasCharge`).

| Antes | Depois |
| --- | --- |
| `vencimentoEmDias` | `dueDateInDays` |
| `resolverCustomer` | `resolveCustomer` |
| `acharAssinaturaPix` | `findPixSubscription` |
| `formatarData` | `formatDate` |
| `texto` | `asText` |
| `processarEventoAsaas` | `processAsaasEvent` |
| `acharLinha` | `findSubscriptionRow` |
| `ativarPorPagamento` | `activateOnPayment` |
| `encerrarPendente` | `closePendingCharge` |
| `isPlanIdConhecido` | `isKnownPlanId` |
| `AsaasCustomerBusca` | `AsaasCustomerSearch` |
| `AsaasCobranca` | `AsaasCharge` |
| `ResultadoDeWebhook` | `WebhookOutcome` |
| `EVENTOS_DE_PAGAMENTO` | `PAYMENT_EVENTS` |
| `EVENTOS_DE_ENCERRAMENTO` | `CLOSING_EVENTS` |

Mais 24 variaveis locais (`cobranca` para `charge`, `idDoEvento` para `eventId`, `linha` para `row`,
e assim por diante). O arquivo nao tem mais identificador em portugues.

---

## Tarefa 1: investigacao dirigida

### 1.1 Como o frontend dispara o checkout hoje

| Camada | Anchor |
| --- | --- |
| Pagina | `client/src/pages/Checkout.tsx`, `handleSubscribe` e `doCheckout` (`:743`) |
| Dialog de metodo | `client/src/components/pro/PaymentMethodDialog.tsx`, aberto so quando o plano nao e mensal |
| Servico | `client/src/services/subscriptionService.ts:46`, `createCheckout(planId, paymentMethod)` |
| Rota | `server/routes/billing.ts:351`, `POST /api/billing/checkout` |
| Redirecionamento | `doCheckout` faz `window.location.href = checkoutUrl` |

**O que faltava para o frontend alcancar o provedor Asaas: um seletor na rota.** Nao precisou de rota
nova nem de mudanca no servico (o parametro `payment_method` ja existia e ja viajava). A rota chamava
`stripeProvider.createCheckout` incondicionalmente; agora ela ramifica pelo meio.

**O seletor NAO ficou em `providers/index.ts`**, e isso foi decisao: um mapa `Record<string, Provider>`
indexado pelo valor que chega do corpo HTTP e exatamente a forma de erro que o CLAUDE.md documenta
(mapa indexado por valor de fora). O `if (paymentMethod === "pix")` na rota e um ramo sobre uma uniao
FECHADA, entao o `tsc` cobra quando um meio novo entrar. `index.ts` so exporta os dois providers.

### 1.2 As tres camadas do gating, posicoes de antes

| Camada | Posicao | Forma |
| --- | --- | --- |
| Mapa canonico do boleto | `server/providers/stripe.ts:1224`, `BOLETO_ACCESS_DAYS` | por INCLUSAO |
| Mapa canonico do Pix | `server/providers/asaas.ts`, `PIX_ACCESS_DAYS` | por INCLUSAO |
| Rota | `server/routes/billing.ts:399`, `if (paymentMethod === "boleto" && planId === "pro_monthly")` | **nega por NOME** |
| UI | `client/src/pages/Checkout.tsx:734`, `if (selectedPlan === "pro_monthly")` | **nega por NOME** |
| UI, lista de opcoes | `PaymentMethodDialog.tsx`, array `OPTIONS` em duro | **lista fixa** |

Quatro lugares, dois deles negando um plano nominalmente e um deles com a lista de meios escrita a
mao. Achei ainda uma **quinta** copia que o enunciado nao previa: a uniao
`CheckoutPaymentMethod = "card" | "boleto"` em `client/src/services/subscriptionService.ts:25`, que
ja estava desatualizada no instante em que o Pix nasceu.

### 1.3 Estado aguardando pagamento do boleto

Nao ha pagina propria nem polling: **o estado vive na pagina de cobranca** (`client/src/pages/Perfil.tsx`),
alimentado pelo campo `pendingBoleto` do `GET /api/billing/subscription` (`server/routes/billing.ts:172`).

Dois cenarios, ja distinguidos no codigo (`Perfil.tsx:906`): **A**, primeira compra (`!isPro && pendingBoleto`),
card proprio, sem botao de cancelar e sem CTA, com o texto "Boleto enviado para seu e-mail. Vence em
3 dias."; **B**, renovacao (`isPro && pendingBoleto`), card ativo normal mais um aviso "Renovação em
processamento".

Para `renewal_type = 'manual'`, a pagina usa `nonRenewal` (lido de `subscription_cancellations`), e
**nao** `cancel_at_period_end`, que para avulso e sempre false.

---

## Tarefa 2: consolidacao do gating

**Ponto unico: `shared/paymentMethods.ts`.**

```ts
export const PAYMENT_METHODS = ["card", "boleto", "pix"] as const;
export type PaymentMethodId = (typeof PAYMENT_METHODS)[number];

export const ONE_OFF_ACCESS_DAYS: Partial<Record<PlanId, number>> = {
  pro_semiannual: 182,
  pro_annual: 365,
};

export function allowedPaymentMethods(planId: PlanId): readonly PaymentMethodId[]
export function isPaymentMethodAllowed(planId: PlanId, method: PaymentMethodId): boolean
export function isPaymentMethodId(value: unknown): value is PaymentMethodId
export function oneOffAccessDays(planId: PlanId): number | undefined
```

**Permissao e duracao saem do MESMO mapa, e nao por economia:** um plano so pode ser vendido de forma
avulsa se existir resposta para "acesso por quanto tempo?". Estar no mapa E a permissao; o numero E a
duracao. Nao ha como declarar uma sem a outra.

`card` vale para todo plano porque e o unico recorrente. Os avulsos dependem de o plano ter prazo
declarado.

**Os consumidores, todos os cinco:**

| Camada | Antes | Depois |
| --- | --- | --- |
| `server/routes/billing.ts` | `if (method === "boleto" && plan === "pro_monthly")` | `if (!isPaymentMethodAllowed(planId, paymentMethod))`, slug `payment_method_not_allowed` |
| `server/providers/stripe.ts` | `BOLETO_ACCESS_DAYS[planId]` | `oneOffAccessDays(planId)`, mapa local REMOVIDO |
| `server/providers/asaas.ts` | `PIX_ACCESS_DAYS[planId]` | `oneOffAccessDays(planId)`, mapa local REMOVIDO |
| `client/src/pages/Checkout.tsx` | `if (selectedPlan === "pro_monthly") doCheckout("card")` | `const metodos = allowedPaymentMethods(selectedPlan); if (metodos.length === 1) doCheckout(metodos[0])` |
| `PaymentMethodDialog.tsx` | array `OPTIONS` em duro | `allowedPaymentMethods(planId).map(...)` sobre `METHOD_UI` |

`METHOD_UI` e `Record<PaymentMethodId, ...>`, ou seja, cobre a uniao FECHADA: um meio novo no ponto
unico obriga uma entrada de apresentacao e o `tsc` cobra. Nao ha fallback silencioso que renderizaria
um botao sem rotulo.

**As duas unioes duplicadas viraram alias**, nao uma terceira e uma quarta:
`server/providers/types.ts` (`CheckoutPaymentMethod = PaymentMethodId`) e
`client/src/services/subscriptionService.ts` (idem). Nenhuma lista de meios sobrou escrita a mao.

**Verificacao final:** `rg "BOLETO_ACCESS_DAYS|PIX_ACCESS_DAYS"` em `server`, `shared` e `client`
devolve **uma unica ocorrencia, e e o comentario histórico** dentro de `shared/paymentMethods.ts` que
explica de onde a regra veio.

### Teste da negacao por omissao (2.3)

`shared/paymentMethods.test.ts`, **9 casos**. O que eles travam nao e a tabela atual, e sim a DIRECAO
da regra:

- um meio ficticio (`"cripto"`) nao e reconhecido por `isPaymentMethodId`, e **nao aparece em plano nenhum**;
- todo meio permitido em qualquer plano esta na uniao fechada (o inverso: nada escapa por caminho lateral);
- `pro_monthly` so aceita cartao **sem ser citado por nome**: a recusa vem da ausencia dele no mapa de avulsos;
- a implicacao "tem prazo se e somente se aceita avulso" vale nos dois sentidos, iterando `PLAN_ORDER`;
- cartao vale em todo plano;
- nenhum `PlanId` fica sem meio nenhum (um plano novo nao pode ficar invendavel em silencio).

**A rota tambem recusa o meio ficticio**, por `isPaymentMethodId` no corpo: `"cripto"` nao passa da
validacao de tipo, e um meio conhecido mas nao permitido cai no `payment_method_not_allowed`.

---

## Tarefa 3: Pix no checkout

**Opcao visivel so onde o plano permite** (2 e 3.1 sao a mesma mecanica): o dialog renderiza
`allowedPaymentMethods(planId)`, entao no mensal ele nem abre (um unico meio, vai direto para cartao)
e no semestral e anual aparecem os tres.

**Fluxo (3.2):** o usuario escolhe Pix, `doCheckout("pix")` chama `createCheckout`, a rota ramifica
para `asaasProvider`, o provedor cria a linha `pending` e a cobranca (caminho do Lote 2a), e a rota
devolve `checkoutUrl = invoiceUrl`. O redirecionamento e o **mesmo** `window.location.href` que o
cartao e o boleto ja usavam, sem bifurcacao.

**Preco e desconto (3.4):** nenhuma bifurcacao de calculo. O provedor Asaas usa
`getPlanChargeValue(planId)` de `shared/planPricing.ts`, a mesma fonte do boleto, e `affiliateCode` e
`couponCode` viajam da rota para o provedor pelos mesmos campos.

**Estado aguardando pagamento (3.3):** ver Tarefa 4, porque no boleto ele vive na pagina de cobranca.

**Erros novos tratados na UI:** `pix_pending`, `payment_method_not_allowed` e `asaas_disabled`, os
tres com toast proprio e `TODO(Ana)`.

---

## Tarefa 4: pagina de cobranca com assinatura Asaas

**O defeito encontrado:** a consulta de cobranca pendente filtrava `payment_method = 'boleto'`
(`billing.ts:172`). **Um Pix aguardando pagamento era invisivel**: a pessoa pagava e a tela dizia que
ela era do plano free.

**A correcao respeita expand/contract (CLAUDE.md), nao e troca seca.** A consulta passou a
`.in("payment_method", ["boleto", "pix"])`, e a resposta emite DOIS campos:

- `pendingBoleto`, **com a semantica exata de antes** (so preenchido quando o meio e boleto), porque
  todo bundle ja em execucao le esse nome e nao recarrega sozinho;
- `pendingCharge`, campo novo, com `paymentMethod`, que e o que o frontend novo consome.

**Um Pix pendente NAO vira `pendingBoleto`.** Um bundle antigo mostraria "Boleto enviado para seu
e-mail. Vence em 3 dias." sobre um Pix. Mentir sobre o meio e pior que nao mostrar, entao o campo
velho fica null e o bundle velho degrada para "sem pendencia".

**No cliente**, `Perfil.tsx` le `pendingCharge` e **cai em `pendingBoleto` quando o backend ainda for
o velho**: a janela de deploy nao e atomica (Vercel sobe antes do Railway), e sem esse fallback o card
de "aguardando pagamento" sumiria por minutos a cada deploy, justamente para quem acabou de pagar.

**Conteudo por meio, e a diferenca que importa:** o Pix **nao herda o prazo do boleto**. Cenario A diz
"Pix gerado. A confirmação costuma levar alguns segundos; o código vence em 2 dias." em vez de "Vence
em 3 dias"; cenario B diz "Seu Pix está sendo confirmado, costuma levar alguns segundos" em vez de
"Seu boleto está aguardando pagamento". Os dois com `TODO(Ana)`.

**Cancelar e reativar** ja funcionam pelo contrato do Lote 2b: `nonRenewal` e lido de
`subscription_cancellations` filtrando `renewal_type === "manual"`, que a linha Pix satisfaz.
**Nenhuma mudanca foi necessaria ali**, e nenhuma mencao a cartao aparece para esse usuario (o bloco
de cartao e condicional a `renewal_type === 'auto'`).

### `GET /api/billing/subscription`, o segundo caminho de `isPro`

**Verificado, e ele NAO mente sobre assinatura Asaas.** `isPro` vem da RPC `is_user_pro`, que avalia
`status` e `current_period_end` sem olhar `provider`; a consulta primaria filtra por status, nao por
provedor; `accessSource` devolve `"subscription"` corretamente.

**Nao refatorei a logica de decisao dele**, conforme instruido. O que fica registrado para a
unificacao futura: ele continua sendo uma **segunda implementacao** de `isPro`, paralela a
`resolveProStatus` (`server/middleware/auth.ts:59`) e divergente dela em tres pontos, todos mapeados
no Passo 0 e nenhum agravado por este lote: nao consulta o cache Redis, nao passa por `isDevProUser`,
e recompoe o ramo de admin por fora, so para rotular `accessSource`.

---

## Tarefa 5: visibilidade do e-mail

No `catch` best-effort de `applyActivationEffects` (`server/providers/shared.ts`), captura
`ativacao_email_falhou` no Sentry (`level: "warning"`, fingerprint fixo) com `user_id`, `template` e
`provedor`, antes do `console.error`.

**O e-mail segue best-effort**: a ativacao ja aconteceu e o acesso ja foi concedido, entao derrubar o
webhook trocaria uma confirmacao atrasada por um retry do evento inteiro. O que mudou e que ele deixa
de ser invisivel, e o motivo e concreto: **este mesmo catch engoliu em silencio um `TypeError` que
impedia TODO e-mail de ativacao do Pix de sair**, achado na revisao do Lote 2b por acaso, nao por
alarme.

---

## Strings TODO(Ana) deste lote

Seis marcadores novos, prontos para o sweep. Todas as strings sao visiveis ao usuario.

| Arquivo:linha | Contexto | Texto |
| --- | --- | --- |
| `client/src/components/pro/PaymentMethodDialog.tsx:51` | opcao Pix no dialog | titulo `Pix`; nota `Cai na hora. O código vence em 2 dias e você renova manualmente.` |
| `client/src/pages/Checkout.tsx:775` | toast, Pix ja pendente | `Você tem um Pix aguardando pagamento. Confira seu e-mail.` |
| `client/src/pages/Checkout.tsx:780` | toast, meio nao permitido | `Essa forma de pagamento não está disponível neste plano.` |
| `client/src/pages/Checkout.tsx:783` | toast, Asaas desligado | `Pix indisponível no momento. Tente cartão ou boleto.` |
| `client/src/pages/Perfil.tsx:1782` | cenario A, aguardando pagamento | `Pix gerado. A confirmação costuma levar alguns segundos; o código vence em 2 dias.` |
| `client/src/pages/Perfil.tsx:1879` | cenario B, renovacao em processamento | `Renovação em processamento. Seu Pix está sendo confirmado, costuma levar alguns segundos.` |

Mais as duas do Lote 2b, ainda pendentes e no mesmo sweep: `server/providers/asaas.ts:388` (mensagem
do "nao renovar" do Pix) e `server/providers/asaas.ts:414` (mensagem do "voltar atras").

**O ponto editorial que atravessa todas:** o Pix confirma em segundos. Nenhum texto pode herdar a
promessa de prazo do boleto ("vence em 3 dias", "1 a 2 dias uteis"). Onde aparece "2 dias" no Pix, e a
validade do QR Code, nao o tempo de compensacao, e a copy precisa deixar isso claro.

---

## Saidas das baterias

```
$ pnpm check           -> EXIT=0
$ pnpm test            -> EXIT=0
   Test Files  242 passed | 3 skipped (245)
        Tests  3184 passed | 10 skipped (3194)
$ pnpm check:limiares  -> EXIT=0
```

Eram 3175 ao fim do Lote 2b; 3184 agora, os 9 casos novos do gating. `pnpm check:scripts` nao foi
exigido: nada em `scripts/` foi tocado.

Os 1363 testes de cliente passaram sem mudanca de expectativa.

## Conferencia de travessoes

Python, byte a byte, sobre os 12 arquivos de codigo do lote:

```
client/src/components/pro/PaymentMethodDialog.tsx  U+2014=0 U+2013=0
client/src/pages/Checkout.tsx                      U+2014=0 U+2013=0
client/src/pages/Perfil.tsx                        U+2014=1 U+2013=0   <<<
client/src/services/subscriptionService.ts         U+2014=0 U+2013=0
server/providers/asaas.ts                          U+2014=0 U+2013=0
server/providers/asaasPix.test.ts                  U+2014=0 U+2013=0
server/providers/shared.ts                         U+2014=0 U+2013=0
server/providers/stripe.ts                         U+2014=0 U+2013=0
server/providers/types.ts                          U+2014=0 U+2013=0
server/routes/billing.ts                           U+2014=0 U+2013=0
shared/paymentMethods.test.ts                      U+2014=0 U+2013=0
shared/paymentMethods.ts                           U+2014=0 U+2013=0
TOTAL: 1
```

**O unico travessao e PRE-EXISTENTE e nao veio deste lote.** Verificado contra a base:
`git show origin/main:client/src/pages/Perfil.tsx` tambem tem exatamente 1. Esta na linha 1920, num
COMENTARIO sobre acesso de admin e cortesia, sem relacao com Pix e fora da regiao que editei. Nao
corrigi, pela mesma razao dos dois de `cron.ts` no Lote 1a: escopo fechado, sinalizar em vez de agir.

**Nenhuma string visivel criada neste lote tem travessao.**

## Varredura de segredo

4 segredos com valor utilizavel procurados, nenhum pulado por estar vazio, **ACHADOS: nenhum**.

## Commits

| Hash | Mensagem | Arquivos |
| --- | --- | --- |
| `b6f77705` | `refactor(asaas): rename internal identifiers to english convention` | `asaas.ts`, `asaasPix.test.ts`, `webhooksAsaas.ts`, `webhookAsaasAuth.test.ts` |
| `d72bc07a` | `fix(billing): capture sentry context when activation email fails` | `shared.ts` |
| `dc32a9d6` | `feat(pix): consolidate payment method gating and enable pix checkout` | 10 arquivos (ponto unico, teste, types, stripe, asaas, teste do asaas, billing, service, dialog, Checkout) |
| `86e03dca` | `feat(pix): show pending pix charge on billing page` | `Perfil.tsx` |

**Uma imprecisao de rotulo, declarada:** `server/routes/billing.ts` carrega as mudancas das Tarefas 2
(gating e seletor) **e** 4 (o campo `pendingCharge`) no commit `dc32a9d6`, cujo titulo nomeia so a
primeira. Separar exigiria `git add -p`, que e interativo e nao roda neste ambiente. O arquivo faz
genuinamente as duas coisas.

Staging por nome explicito, `git diff --cached --name-only` conferido antes de cada commit, commit com
pathspec. Pre-commit verde nos quatro.

**Nenhum push, nenhum merge, nenhuma migration.**

## git status --porcelain final

```
?? lote2a-pagamentos-2026-08-29.md
?? lote2b-pagamentos-2026-08-29.md
?? lote2c-pagamentos-2026-08-29.md
```
