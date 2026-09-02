HEAD_FINAL: 6fb18d8aa9702b70ae349a89da50135679025a6b

Worktree: /home/s0ft/bnt-asaas | Branch: pix/lote2a | Base: origin/main @ 8b219a6e114790b0d0ec939a29012a168e851e65

Tres commits novos (sete na branch). Nenhuma migration. Nenhum push, nenhum merge.

---

## Parte 1: inventario dos efeitos de transicao

### 1. Tudo que `handleTransition` disparava, exaustivo

`server/providers/stripe.ts`, antes deste lote. **Seis efeitos, mais uma leitura.** Nenhum outro:
varri o arquivo por `checkBadges`, `badgeChecker`, `posthog`, `capture(` e
`collectSubscriptionSnapshot`, e nao ha nada. `handleTransition` era o unico ponto de efeito na
ativacao.

| # | Efeito | Linha | Gatilho | Falha |
| --- | --- | --- | --- | --- |
| 1 | `invalidateProStatusCache(userId)` | `:179` | **qualquer** mudanca de status, nao so ativacao | `void`, nao esperada |
| 2 | `recordAffiliateConversion(...)` | `:183` | `becameActive && affiliateCode` | propaga |
| 3 | `increment_coupon_redemption` | `:199` | `becameActive && couponCode` | best-effort, so loga |
| 4 | `enqueueEmail({ type: "pro_upgrade" })` | `:217` | `becameActive` | best-effort, so loga |
| 5 | `enqueueEmail({ type: "cancellation" })` | `:225` | `becameCanceled` | best-effort |
| 6 | `enqueueEmail({ type: "payment_failed" })` | `:228` | `becamePastDue` | best-effort |
| L | `getUserContact(userId)` | `:135` (def), `:213` (uso) | pre-requisito de 4, 5 e 6 | dentro do mesmo `try` |

`becameActive`, `becameCanceled` e `becamePastDue` sao mutuamente exclusivos (`past_due` nao e
status Pro, `canceled` tampouco), o que importa para a extracao: separar o ramo de ativacao nao
duplica a leitura de contato de ninguem.

### 2. O que o Asaas do Lote 2a ja fazia, e o que faltava

| Efeito | Lote 2a | Como |
| --- | --- | --- |
| 1, cache | **fazia** | reimplementado por fora, chamando `invalidateProStatusCache` direto |
| 2, afiliado | **fazia** | ja pelo caminho unico (`recordAffiliateConversion` em `shared.ts`) |
| 3, cupom | **fazia** | reimplementado por fora, com `try/catch` proprio duplicado |
| 4, e-mail | **NAO FAZIA** | e a pendencia nomeada na revisao |
| 5 e 6 | nao se aplicam | o Pix nao tem cancelamento nem `past_due` neste fluxo |

Dois dos tres que ele fazia eram COPIA, e copia de regra diverge no primeiro que alguem esquecer de
atualizar. E o que este lote elimina.

### 3. E-mail e registro de intencao

**E-mail:** `enqueueEmail` (`server/lib/queue.ts:24`, tipo `pro_upgrade`, prioridade `critical` em
`:51`) despacha para `sendProUpgradeEmail` (`server/lib/email.ts:353`), que envia por Resend.

**O template e AGNOSTICO do meio de pagamento**, e isso decide o item 2.1.4: o corpo fala de plano e
beneficios (`Obrigado por assinar o ${planName}...`, lista de `getProBenefitLabels()`, botao para
`/perfil`) e **nao menciona cartao, boleto nem Pix em lugar nenhum**. Nenhuma variante nova foi
criada, e **nenhuma string de e-mail nova existe neste lote**.

**Registro de intencao do boleto:** `server/providers/stripe.ts`, ramo `renewal_type === "manual"` de
`cancel` (era `:1430`). Pre-checa intencao viva (`status <> 'reverted'`), insere em
`subscription_cancellations` com `status: 'scheduled'` e `effective_at = current_period_end`, e e
**fail-loud** (o INSERT E a acao). NAO seta `cancel_at_period_end` e NAO chama a Stripe.

**O `reactivate` do boleto** (ramo em `:1586`) marca `status: 'reverted'` onde estava `'scheduled'`.
Fail-loud, idempotente por construcao: um segundo clique nao acha `'scheduled'` e retorna sucesso.

**Nenhum efeito tinha acoplamento profundo a objetos da Stripe.** A condicao de PARE nao foi
acionada: os seis operam sobre `userId`, `planName` e codigos de texto. `sourceEvent` ja vinha
normalizado desde o Lote 1a, exatamente para nao carregar o objeto de evento.

---

## 2.1 Efeitos de ativacao em caminho compartilhado

**Novo em `server/providers/shared.ts`:**

| Funcao | Papel |
| --- | --- |
| `getUserContact(userId)` | subiu de `stripe.ts`, onde era privada |
| `applyActivationEffects(params)` | cache, afiliado, cupom e e-mail, nesta ordem |
| `recordNonRenewalIntent(params)` | registro de intencao (secao 2.2) |
| `revertNonRenewalIntent(id)` | reversao (secao 2.2) |

`applyActivationEffects` recebe **dados, nunca o objeto de evento da Stripe**: `userId`, `logPrefix`,
`planName`, `affiliateCode`, `couponCode`, `revenueCents`, `sourceEvent` (ja normalizado) e
`prevStatus`.

**`handleTransition` passou a delegar:**

```diff
-  if (prevStatus !== nextStatus) {
-    void invalidateProStatusCache(userId);
-  }
-  if (becameActive && opts.affiliateCode) { ...recordAffiliateConversion... }
-  if (becameActive && opts.couponCode) { ...increment_coupon_redemption... }
-  if (!becameActive && !becameCanceled && !becamePastDue) return;
-  try {
-    const { email, name, gender } = await getUserContact(userId);
-    if (!email) return;
-    if (becameActive) { await enqueueEmail({ type: "pro_upgrade", ... }); }
-    if (becameCanceled) {
+  if (becameActive) {
+    await applyActivationEffects({ userId, logPrefix: "webhook/stripe", ... });
+  } else if (prevStatus !== nextStatus) {
+    void invalidateProStatusCache(userId);
+  }
+  if (!becameCanceled && !becamePastDue) return;
+  try {
+    const { email, name, gender } = await getUserContact(userId);
+    if (!email) return;
+    if (becameCanceled) {
```

**Comportamento identico, e a equivalencia e demonstravel:** a invalidacao de cache mudou de LUGAR,
nao de MOMENTO, porque `becameActive` implica `prevStatus !== nextStatus` (um status Pro nao pode
suceder a si mesmo sob `!isProStatus(prev) && isProStatus(next)`). O `else if` cobre exatamente o
complemento. A ordem interna (cache, afiliado, cupom, e-mail) foi preservada, e os contratos de falha
tambem: afiliado propaga, cupom e e-mail sao best-effort.

**A prova pedida em 2.1.2:** os 43 casos de teste dos provedores da Stripe passam **sem uma unica
mudanca de expectativa e sem mudanca de fiacao**. `stripeLivemode` (5), `boletoAtivacaoRpc` (14),
`stripeWebhookEvents` (5) e `comissaoBasePaga` (19) nao foram tocados neste lote.

**O Asaas passou a chamar o mesmo caminho**, eliminando as duas duplicacoes do Lote 2a e ganhando o
e-mail. `import { invalidateProStatusCache }` saiu de `asaas.ts`; o bloco de `increment_coupon_redemption`
com `try/catch` proprio sumiu.

**Idempotencia (2.1.5):** `applyActivationEffects` so e chamada com `out_activated === true` nos dois
provedores. No Asaas, o `if (!resultado.out_activated) return false;` precede a chamada; na Stripe, o
`becameActive`. Travado por teste nos dois sentidos.

**O e-mail nao precisou de variante** (2.1.4): o template e agnostico. `logPrefix` distingue a origem
no log sem ramificar comportamento.

## 2.2 Contratos de `cancel` e `reactivate` do Pix

O Lote 2a devolvia `400 pix_sem_recorrencia`. Era verdade sobre o Asaas e mentira sobre o produto: a
pessoa PODE dizer que nao quer renovar, e a intencao dela tem onde ser guardada.

**O registro de intencao morava dentro do provedor Stripe**, entao foi extraido para `shared.ts` no
mesmo movimento, com a mesma justificativa de `recordAffiliateConversion`. Os dois provedores usam as
mesmas duas funcoes.

`cancel` do Asaas: acha a assinatura Pix (filtrando `provider = 'asaas'` pelo mesmo motivo que a
Stripe filtra `'stripe'`, para uma acao de um provedor nao atingir a linha do outro), chama
`recordNonRenewalIntent`, e devolve `{ cancel_at_period_end: false, non_renewal: true, effective_at }`.
Nao chama o Asaas, nao escreve em `subscriptions`, e nao seta `cancel_at_period_end` (isso acordaria
o bug latente do cron `process-cancellations`).

`reactivate`: chama `revertNonRenewalIntent`. Sem assinatura, devolve `redirect_to_checkout` para
`/planos`, mesma saida do caminho de cartao quando nao ha o que reativar, porque a acao que resolve e
comprar de novo.

**`pix_sem_recorrencia` nao existe mais como codigo de erro.** A unica ocorrencia restante da string
e o comentario que registra a mudanca. Nenhum teste do 2a afirmava aquele codigo, entao nenhum
precisou mudar de expectativa.

## 2.3 Rename

`chaveDeEvento` para `eventKey`. Rename puro, 6 ocorrencias (3 no provedor, 3 no teste), commit
proprio, `pnpm check` verde antes e depois.

**Registro de uma premissa do enunciado que a medicao contradiz.** O prompt diz "convencao dominante
do arquivo (ingles)". A convencao dominante de `asaas.ts` **e portuguesa**, nao inglesa. Excluindo os
quatro nomes ditados pela interface `PaymentProvider` (`createCheckout`, `cancel`, `reactivate`,
`handleWebhook`), os nomes de escolha livre sao:

```
portugues (10): acharAssinaturaPix, acharLinha, ativarPorPagamento, encerrarPendente,
                formatarData, isPlanIdConhecido, processarEventoAsaas, resolverCustomer,
                texto, vencimentoEmDias
ingles (2):     paidAmountCentsFromAsaas, eventKey (este lote)
```

O ingles e a convencao do REPOSITORIO (`stripe.ts` tinha 32 de 33; `shared.ts` e integralmente
ingles), e foi eu quem produziu o desvio ao escrever `asaas.ts` no Lote 2a. Fiz o rename pedido, que
alinha ao repositorio, **e o efeito colateral e que `asaas.ts` ficou internamente MAIS misto do que
antes**: um ingles a mais entre dez portugueses.

Uma passada de nomenclatura no arquivo inteiro resolveria, e e barata (rename puro, o `tsc` pega
tudo). **Nao fiz**, porque o escopo deste lote diz "rename puro" de um simbolo e o CLAUDE.md manda
sinalizar em vez de agir quando algo de fora precisa mudar. Fica registrado como decisao de voces.

## 2.4 Testes

**12 casos novos**, todos em `server/providers/asaasPix.test.ts` (de 25 para 37).

| Grupo | Casos | O que prova |
| --- | --- | --- |
| conjunto completo de efeitos | 4 | e-mail sai uma vez com o plano; comissao conta uma vez com o valor pago; cupom conta uma vez; **os tres saem na MESMA ativacao, nao um subconjunto** |
| reentrega | 2 | `out_activated=false` da zero e-mail, zero comissao, zero cupom; o mesmo evento duas vezes envia UM e-mail |
| cancel e reactivate | 6 | registra intencao e **nao toca o Asaas**; nao escreve em `subscriptions`; idempotente com intencao existente; 404 sem assinatura; reverte a intencao; sem assinatura manda ao checkout |

O quarto caso do primeiro grupo e o que teria acusado a lacuna do Lote 2a: ele afirma o conjunto
COMPLETO, e o e-mail era o membro que faltava.

**E-mail dublado** (`vi.mock("../lib/queue")`), gravando os jobs. Nenhum teste envia e-mail real.

### Um defeito do meu proprio dube, encontrado e corrigido, que vale registrar

Ao ligar o e-mail no caminho do Asaas, os 25 testes do Lote 2a **continuaram verdes**. Isso era
suspeito, porque o dube nao tinha `supabaseAdmin.auth`. Rodei uma copia do arquivo sem o
`vi.spyOn(console, "error")` que silencia o log, e apareceu:

```
[webhook/asaas] Erro ao processar e-mail transacional
TypeError: Cannot read properties of undefined (reading 'admin')
```

O e-mail nao estava sendo enviado: `getUserContact` explodia em `supabaseAdmin.auth.admin`, o
`try/catch` best-effort engolia, e o teste passava sobre um caminho quebrado. **Um teste que so
afirma "nao explodiu" nao distingue "funcionou" de "falhou em silencio dentro de um catch".** O dube
ganhou `auth.admin.getUserById` e `profiles`, e os casos novos afirmam PRESENCA do e-mail, nao
ausencia de erro.

---

## Strings novas marcadas TODO(Ana)

Duas, ambas mensagens de retorno de API do fluxo de Pix, espelhando literalmente as do boleto que ja
carregam o mesmo marcador:

| Local | String |
| --- | --- |
| `server/providers/asaas.ts`, `cancel` | `// TODO(Ana): mensagem de sucesso do "nao renovar" do Pix.`<br>`Anotado: sua assinatura não vai renovar. Você mantém o acesso Pro até <data>.` |
| `server/providers/asaas.ts`, `reactivate` | `// TODO(Ana): mensagem de sucesso do "voltar atras" do Pix.`<br>`Pronto: o aviso de não renovação foi removido. Seu acesso Pro segue até <data> e você pode renovar quando quiser.` |

**Nenhuma string de e-mail nova**: o template `pro_upgrade` foi reusado sem alteracao.

Nenhuma tela renderiza essas duas hoje (nao ha frontend de Pix). Elas entram no sweep editorial junto
com as equivalentes do boleto, que ja estao marcadas em `server/providers/stripe.ts`.

---

## Saidas das baterias

```
$ pnpm check           -> EXIT=0
   [generateRoadmapMeta] em sincronia. [generateSitemap] 119 rotas. [checkCspHashes] 1 hash.
$ pnpm test            -> EXIT=0
   Test Files  241 passed | 3 skipped (244)
        Tests  3175 passed | 10 skipped (3185)
$ pnpm check:limiares  -> EXIT=0
```

Eram 3163 ao fim do Lote 2a; 3175 agora, os 12 novos.

`pnpm check:scripts` nao foi exigido: nenhum arquivo em `scripts/` foi tocado.

## Conferencia de travessoes

Python, byte a byte, sobre os arquivos do lote:

```
server/providers/asaas.ts          U+2014=0 U+2013=0
server/providers/asaasPix.test.ts  U+2014=0 U+2013=0
server/providers/shared.ts         U+2014=0 U+2013=0
server/providers/stripe.ts         U+2014=0 U+2013=0
TOTAL: 0
```

## Varredura de segredo

4 segredos com valor utilizavel procurados (`ASAAS_WEBHOOK_TOKEN`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`), nenhum pulado por estar vazio, **ACHADOS:
nenhum**.

## Commits

| Hash | Mensagem | Arquivos |
| --- | --- | --- |
| `257878ef` | `refactor(billing): extract activation effects into shared provider path` | `shared.ts`, `stripe.ts` |
| `ec834ce3` | `feat(asaas): use shared activation effects and boleto cancel contract` | `asaas.ts`, `asaasPix.test.ts` |
| `6fb18d8a` | `refactor(asaas): rename event key helper to english convention` | `asaas.ts`, `asaasPix.test.ts` |

O rename foi **desfeito e refeito** de proposito para ficar sozinho no terceiro commit: eu ja o tinha
aplicado antes de escrever o comportamento, e um rename misturado com mudanca de comportamento
esconde as duas coisas no mesmo diff. O commit `6fb18d8a` tem 6 insercoes e 6 remocoes, e mais nada.

Staging por nome explicito, `git diff --cached --name-only` conferido antes de cada um, commit com
pathspec. Pre-commit verde nos tres.

**Nenhum push, nenhum merge, nenhuma migration.**

## git status --porcelain final

```
?? lote2a-pagamentos-2026-08-29.md
?? lote2b-pagamentos-2026-08-29.md
```
