HEAD_FINAL: 3306800737566fff9ca5e6a49c15ea3c0b25d01d

Worktree: /home/s0ft/bnt-asaas | Branch: pix/lote2a | Base: origin/main @ 8b219a6e114790b0d0ec939a29012a168e851e65

Um commit novo (dezessete na branch). Nenhuma migration. Nenhum push, nenhum merge.

---

## Parte 1: investigacao dirigida

### 1.1 Como o fluxo Stripe aplica cupom: a hipotese do arquiteto esta CONFIRMADA

| Etapa | Onde | Quem faz |
| --- | --- | --- |
| Validacao (existe, ativo, janela, limite de usos, escopo de plano) | `server/lib/coupons.ts`, `findValidCoupon` | **nosso codigo** |
| Elegibilidade (so na primeira compra) | `server/providers/stripe.ts:1188-1193`, via `isFirstPurchase` | **nosso codigo** |
| Espelho do cupom na Stripe | `server/providers/stripe.ts:1203`, `ensureMarketingCoupon("bnt_promo_N_once")` | nosso codigo cria o objeto |
| **A CONTA do desconto** | `server/providers/stripe.ts:1324` e `:1348`, `discounts: [{ coupon }]` na sessao | **a Stripe** |

`findValidCoupon` devolve `discount_percent`, e o percentual e usado so para NOMEAR o objeto de
cupom (`bnt_promo_90_once`). **Nosso codigo nunca calculou um valor com desconto**, porque nunca
precisou: o checkout hospedado da Stripe recebe o cupom e faz a aritmetica.

Por isso o defeito nao foi um esquecimento pontual. Era estrutural: o Asaas cria a cobranca por API,
com o valor JA RESOLVIDO, e herdou o unico valor que o codigo sabia produzir.

### 1.2 Onde o frontend calcula a previa

**Funcao compartilhada, nao endpoint e nao calculo local.** `discountedPriceCents`
(`shared/planPricing.ts:91-97`), consumida por `client/src/pages/Checkout.tsx:54` atraves de
`planFinalPriceCents` (`:725-727`), que alimenta o card do plano (`:1156`) e o CTA (`:1326`).

```ts
export function discountedPriceCents(priceCents: number, percent: number): number {
  if (percent <= 0) return priceCents;
  return priceCents - Math.round((priceCents * percent) / 100);
}
```

Ela ja morava em `shared/`, alcancavel pelos dois lados. **A funcao unica ja existia; o servidor
simplesmente nunca a chamou.**

### 1.3 O cupom CHEGA ao Asaas, e era ignorado no lugar que importa

Chegava, e era usado pela metade:

| Uso | Antes deste lote |
| --- | --- |
| `coupon_code` na row `pending` | `server/providers/asaas.ts:302`, gravava `input.couponCode` (o **bruto do cliente**) |
| valor da cobranca | `server/providers/asaas.ts:336`, `value: getPlanChargeValue(input.planId)`, **preco cheio** |

Dois defeitos, nao um. O segundo e o medido ao vivo. O primeiro e mais silencioso: gravar o codigo
BRUTO significa que a ativacao contaria resgate (`increment_coupon_redemption`) de um cupom que
podia nem ter sido aprovado, corrompendo `times_redeemed`. A Stripe grava `validCouponCode`, que so
recebe valor quando o desconto de fato entrou na sessao (`stripe.ts:1207`).

### 1.4 Por que os testes do 2c passaram com o defeito presente

O caso que olhava a cobranca era **"a cobranca leva o id da linha local em externalReference"**
(`asaasPix.test.ts:302`), e ele afirmava exatamente duas coisas:

```ts
expect(body.externalReference).toBe("row-1");
expect(body.billingType).toBe("PIX");
```

**Nunca `body.value`.** O teste estava certo sobre o que afirmava e cego para o resto, que e a forma
mais comum de um teste passar sobre um defeito: ele nao mediu o campo errado, ele nao mediu o campo.

O requisito 3.4 do 2c ("valor cobrado respeita cupom, nenhuma bifurcacao de calculo") foi verificado
por LEITURA no relatorio daquele lote, com o argumento de que o provedor usava `getPlanChargeValue`,
"a mesma fonte do boleto". O argumento estava certo sobre a FONTE e errado sobre a CONTA: a fonte era
mesmo a mesma, e nenhum dos dois aplicava o desconto, porque no boleto quem aplica e a Stripe.

### 1.5 Cupom e resgate: onde vivem

| Objeto | Onde |
| --- | --- |
| Cupom canonico | tabela `public.coupons` (`supabase/migrations/20260723130000_create_coupons.sql`) |
| Espelho na Stripe | objeto `bnt_promo_N_once`, criado sob demanda por `ensureMarketingCoupon` |
| Codigo na assinatura | `subscriptions.coupon_code` |
| Contador de resgate | `coupons.times_redeemed`, via RPC `increment_coupon_redemption` |

O efeito de resgate do Lote 2b (`applyActivationEffects`, `server/providers/shared.ts`) le
`out_coupon_code`, que a RPC `activate_subscription_exclusive` devolve a partir de
`subscriptions.coupon_code` da row ativada. **Ou seja, o resgate registra exatamente o que a row
guardou**, e e por isso que gravar o bruto do cliente ali era um defeito de contabilidade e nao so de
higiene.

---

## Parte 2: implementacao

### 2.1 Uma funcao, dois consumidores

Nova em `server/lib/coupons.ts` (onde a validacao ja vivia):

```ts
export async function resolveCheckoutPriceCents(input: {
  userId: string;
  planId: PlanId;
  couponCode: string;
  isFirstPurchase: (userId: string) => Promise<boolean>;
}): Promise<{ finalCents: number; appliedCouponCode: string }>
```

A conta usa `discountedPriceCents`, **a mesma funcao que o frontend usa**. Nao sao duas
implementacoes que dao o mesmo numero: e a mesma implementacao, entao tela e cobranca nao podem
divergir por arredondamento.

`isFirstPurchase` entra **injetado** e nao importado: `server/lib/coupons.ts` e um modulo de
biblioteca e `isFirstPurchase` vive em `server/providers/shared.ts`; importar criaria dependencia de
lib para provider, na direcao errada. O chamador passa a funcao.

**O frontend nao precisou mudar**, e a evidencia e o item 1.2: ele ja consome
`discountedPriceCents` de `shared/planPricing.ts`. O que faltava era o servidor consumir a mesma
coisa. Nenhum endpoint de preview foi criado, porque nao ha o que sincronizar entre dois calculos que
sao um so.

**Divergencia legitima que permanece, e e a mesma da Stripe:** se a pessoa nao esta na primeira
compra, ou o cupom esta fora do escopo do plano, a tela mostra desconto (o frontend nao sabe dessas
duas regras) e a cobranca sai cheia. E o comportamento atual do cartao, nao uma regressao, e mexer
nisso exigiria expor as regras ao cliente ou um endpoint de preview. Fica registrado, nao corrigido.

### 2.2 Validacao identica, nenhuma regra nova

`resolveCheckoutPriceCents` chama `findValidCoupon(code, { planId })`, exatamente o que
`stripe.ts:1197` chama, e replica a condicao de primeira compra de `stripe.ts:1188-1193`. **Nenhum
criterio novo foi inventado.**

**Cupom nunca impede a compra**, tambem por paridade: qualquer recusa (inexistente, expirado, fora de
escopo, esgotado, nao e primeira compra) segue com o preco cheio e `appliedCouponCode` vazio. Nao ha
erro nomeado novo para cupom invalido, porque o fluxo atual tambem nao tem: a Stripe simplesmente nao
aplica o desconto.

### 2.3 Piso do Asaas

`ASAAS_MIN_CHARGE_CENTS = 500`, constante nomeada junto das outras do provedor, com o comentario
dizendo que e limite da plataforma e nao regra nossa.

A checagem roda **depois de resolver o preco e antes da row local e da chamada remota**:

```ts
if (finalCents < ASAAS_MIN_CHARGE_CENTS) {
  throw createError(422, "valor_minimo_pix", "...");
}
```

Ha teste afirmando zero chamada remota E zero escrita nesse caminho, mais um caso de **fronteira**:
96 por cento de R$ 129,00 da R$ 5,16 e **passa**, porque a recusa e abaixo do piso, nao no limite.

### 2.4 Rastro do cupom

`coupon_code` na row passou de `input.couponCode` (bruto do cliente) para `appliedCouponCode` (o
`code` canonico da tabela `coupons`, e so quando o desconto de fato entrou). Isso alinha o Asaas ao
que a Stripe ja fazia e conserta a contabilidade de `times_redeemed`.

Reentrega nao duplica resgate: ja garantido por `out_activated` desde o Lote 2b, e agora com teste
que passa o MESMO evento duas vezes e afirma **um** `increment_coupon_redemption`.

### 2.5 Arredondamento

Centavos inteiros, regra de `discountedPriceCents`: arredonda o **desconto**, nao o preco final.

Tres casos, e o terceiro merece nota. Os planos que aceitam Pix (12900 e 22200 centavos) sao
divisiveis por 100, entao `cents * percent / 100` com percentual inteiro **e sempre inteiro**: o caso
fracionario nao existe no Pix hoje. O teste do caso quebrado usa 2990 (mensal, cartao-only) para
travar a REGRA, e ha um terceiro caso que prova por iteracao que os planos de Pix nunca a alcancam.
Sem essa nota, o teste de dizima pareceria cobrir um risco que o Pix nao corre.

---

## Parte 3: testes

**13 casos novos** em `server/providers/asaasPix.test.ts` (de 46 para 59).

| Grupo | Casos |
| --- | --- |
| valor respeita o cupom | 90 por cento no semestral cobra 12,90; **o valor cobrado e IDENTICO a previa, pela mesma funcao**; sem cupom o valor e cheio (regressao); cupom invalido cobra cheio e nao grava codigo; nao e primeira compra nao aplica |
| rastro | a row leva o codigo canonico; ativacao conta resgate uma vez e reentrega nao duplica |
| piso | 422 nomeado; zero chamada e zero row; **fronteira: exatamente 5,16 passa** |
| arredondamento | percentual exato sem drift; fracao arredonda o desconto; os planos de Pix nunca caem no caso fracionario |

O dube ganhou a tabela `coupons`.

### Um erro meu que o `tsc` pegou, e vale registrar

Escrevi `estado.activation` no teste novo, mas o campo do dube se chamava `estado.ativacao`. O
vitest passou a mensagem "expected [] to have length 1", que parecia defeito do codigo; o `pnpm
check` deu o veredito real: `Property 'activation' does not exist`. Corrigi, e **aproveitei para
alinhar os dois campos que o rename do Lote 2c deixou pela metade** (`ativacao` e `ativacaoErro` no
arquivo de teste, enquanto os simbolos exportados ja estavam em ingles), para o arquivo nao carregar
dois vocabularios para a mesma coisa.

---

## Strings TODO(Ana)

Uma nova:

| Arquivo | Contexto | Texto |
| --- | --- | --- |
| `server/providers/asaas.ts`, guarda do piso | erro de valor abaixo do minimo | `O valor com desconto ficou abaixo do mínimo do Pix. Tente cartão.` |

E de API, e hoje nao ha tela que a renderize (a UI do 2c trata `pix_pending`, `asaas_disabled`,
`payment_method_not_allowed` e `cpf_obrigatorio`, mas nao `valor_minimo_pix`). **Fica registrado como
lacuna de UI**: um cupom agressivo o bastante hoje produziria o toast generico "Não foi possível
iniciar o checkout".

---

## Saidas das baterias

```
$ pnpm check           -> EXIT=0
$ pnpm test            -> EXIT=0
   Test Files  243 passed | 3 skipped (246)
        Tests  3217 passed | 10 skipped (3227)
$ pnpm check:limiares  -> EXIT=0
```

Eram 3204 ao fim do Lote 2f; 3217 agora.

## Conferencia

```
server/lib/coupons.ts              U+2014=0 U+2013=0
server/providers/asaas.ts          U+2014=0 U+2013=0
server/providers/asaasPix.test.ts  U+2014=0 U+2013=0
TOTAL: 0
```

Varredura de segredo nos arquivos do lote: **ACHADOS: nenhum**.

## Commits

| Hash | Mensagem | Arquivos |
| --- | --- | --- |
| `33068007` | `fix(pix): charge discounted price using shared coupon price resolver` | `coupons.ts`, `asaas.ts`, `asaasPix.test.ts` |

`server/routes/billing.ts` **nao precisou mudar**: ele ja repassava `couponCode` ao provedor.
`server/providers/stripe.ts` **nao foi tocado**: a validacao ja estava extraida em
`server/lib/coupons.ts`, entao o reuso nao exigiu mexer nele. O frontend **nao foi tocado**, pelo
motivo do item 2.1.

Staging por nome explicito, `git diff --cached --name-only` conferido antes, pathspec no commit.
Pre-commit verde. **Nenhum push, nenhum merge.**

## O 2d-prod

**Pode retomar da Etapa 3, com backend local reiniciado nesta branch (`33068007`).** O processo que
estava de pe carrega o codigo sem esta correcao e sem a do CPF.

**O roteiro de cupom passa a ser OBRIGATORIO na Etapa 3, nao mais so na 5.** O que precisa ser
exercitado ali, com cupom aplicado:

1. a tela e a `invoiceUrl` mostram o MESMO valor;
2. o valor cobrado e o descontado;
3. apos o pagamento, `coupons.times_redeemed` sobe **exatamente um**;
4. a reentrega do mesmo evento nao mexe no contador de novo.

Os itens 3 e 4 sao os que nenhum teste unitario alcanca: eles dependem da RPC real e do estado real
da tabela.

Nada mudou no webhook (rota, token e formato do evento), entao o registrado na Etapa 2 **continua
valendo**. E o `DELETE /v3/webhooks/{id}` da Etapa 6.1 segue obrigatorio ao fim; nao tenho o id
porque nao fui eu que o criei.

## git status --porcelain final

```
?? lote2a-pagamentos-2026-08-29.md
?? lote2b-pagamentos-2026-08-29.md
?? lote2c-pagamentos-2026-08-29.md
?? lote2e-pagamentos-2026-08-30.md
?? lote2f-pagamentos-2026-08-31.md
?? lote2g-pagamentos-2026-08-31.md
```
