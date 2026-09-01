HEAD_FINAL: 50ff28801a6a01517dd9a523ac102ca4138b6c8e

# Lote 2m: modal Pix no checkout, timer e valor do card

Branch `pix/lote2m`, a partir de `main` em `f2bfd12d`. Sem push.

## Passo 0, com arquivo e linha

**a. Onde o checkout cria a cobranca e navega.** `client/src/pages/Checkout.tsx`,
handler `doCheckout` (linha 761). O ramo `flow === "native_pix"` comecava na 777,
com `await refreshSubscription()` na 794 e `setLocation("/perfil")` na 795.

**b. Primitiva de modal.** `@/components/ui/dialog` (shadcn: `Dialog`,
`DialogContent`, `DialogHeader`, `DialogTitle`), consumida por doze componentes,
entre eles `PaymentMethodDialog.tsx:3-8`. Abre e fecha por `open` e
`onOpenChange`, controlados pelo pai. O `PixCheckoutModal` usa a mesma; nenhum
modal novo do zero.

**c. O que `pendingCharge` expunha.** `server/routes/billing.ts:209-226`: exatamente
`planCode`, `createdAt` e `paymentMethod`. **Sem valor.** E o valor tambem NAO
existia em tabela nenhuma para ser exposto: o insert da linha pendente
(`asaas.ts`) grava `plan_id` e `coupon_code`; `subscriptions` nao tem coluna de
valor; `raw_provider_payload` so e escrito pelo webhook, na ativacao, entao numa
cobranca pendente e nulo; e `finance_transactions`, que tem `gross_cents`, nunca
e escrita pelo `asaas.ts` e so nasce depois do pagamento. Isso acionou o primeiro
PARE, resolvido pelo arquiteto com a opcao A refinada.

**d. De onde vinha o R$ 129,00.** `client/src/pages/Perfil.tsx:887-891`,
`getPlanPriceCents(subscriptionData.plans.code)` do `planPricing.ts`, renderizado
na 1879. Preco do plano, nunca da cobranca.

**e. Assinatura do `pix-qrcode`.** `server/providers/asaas.ts:1023-1040` devolve
`{encodedImage, payload, expirationDate}`, com `expirationDate: string | null`
repassado cru do provedor.

**f. Contrato do `pixPolling.ts`.** `nextPixPollStep({isPro, elapsedMs})` devolve
`confirmed`, `stop:timeout` ou `wait:4000`, com confirmacao vencendo timeout.
Intervalo 4s, teto 10min. O componente fica com `setTimeout` e `fetch`.

## O formato do `expirationDate`, MEDIDO

Cobranca `pay_97mhq09np4utjmfx`, criada pelo Murilo no painel do Asaas em
2026-09-01, lida por `GET /payments/{id}` e `GET /payments/{id}/pixQrCode`:

```
value          : 12.9
dueDate        : '2026-09-03'
expirationDate : '2027-09-03 23:59:59'
```

O formato e **19 caracteres, espaco no lugar do `T`, sem offset**, exatamente o
caso perigoso: `new Date("2027-09-03 23:59:59")` e hora local no Chrome e
`Invalid Date` no Safari. `parseAsaasDate` faz o parse manual e aplica `-03:00`
explicito, com o motivo escrito no codigo.

### ACHADO NAO PREVISTO: `expirationDate` nao e o prazo que importa

O `dueDate` da cobranca e **2026**-09-03 (dois dias, como `PIX_DUE_DAYS` manda) e
o `expirationDate` do QR e **2027**-09-03: um ano e dois dias. Um timer alimentado
por `expirationDate` contaria mais de oito mil horas, o que contradiz a propria
copy do produto ("O código vence em 2 dias", `PaymentMethodDialog`).

E o prazo que decide de verdade e o `dueDate`, nao o do QR: passado ele, o Asaas
emite `PAYMENT_OVERDUE`, que esta em `CLOSING_EVENTS` do `asaas.ts` e fecha a
linha pendente. Depois disso, mesmo que a pessoa pagasse, `activateOnPayment`
encontraria a linha em `canceled` e lancaria.

**Nao mudei a fonte por conta propria.** O modal recebe a data ja resolvida e o
`Checkout.tsx` passa `parseAsaasDate(qr.expirationDate)`, entao trocar a fonte e
uma linha no chamador. Fica para decisao: manter `expirationDate` (timer
praticamente sempre em "far") ou expor o `dueDate` no `pix-qrcode` (aditivo) e
usar o menor dos dois.

## Tarefa 1: PixCheckoutModal

`client/src/components/pro/PixCheckoutModal.tsx`, novo.

- Criada a cobranca, o checkout **abre o modal e nao navega**. O
  `refreshSubscription` e o `setLocation` sairam do ramo `native_pix` e passaram
  para as duas saidas do modal, com o motivo no codigo: enquanto ele esta aberto
  a pessoa ainda nao pagou, entao nao ha estado novo para buscar, e navegar
  desmontaria o proprio modal.
- Conteudo: valor em destaque, copia e cola com botao, QR, timer, aviso de
  confirmacao automatica. Hierarquia por dispositivo preservada do 2h
  (`flex-col-reverse` no mobile, `sm:flex-col` no desktop), com markup unico.
- Polling por `nextPixPollStep`, sem logica de confirmacao nova. Para em
  desmontagem, fechamento e sucesso. `refreshSubscription({ silent: true })`
  para a reconsulta de fundo nao piscar a tela.
- Sucesso: o conteudo vira check verde, mensagem curta e botao unico
  "Ver meu Pro", que atualiza a assinatura e navega.
- Fechamento pelo usuario: mesmo desfecho do fluxo antigo, `refreshSubscription`
  e navegacao para a pagina de assinatura, onde o bloco existente segue como
  superficie de retorno frio. Esse bloco NAO saiu.
- Erro do `pix-qrcode`: fallback do 2h dentro do modal, com o link da fatura.
- Expirado: mensagem e botao que volta para a escolha de plano, sem chamada ao
  backend.

**Tema.** Zero hex novo: `var(--bnt-shadow)`, `bg-[var(--brand-yellow)]`,
`text-ink-on-accent` no botao amarelo (regra 5 do CLAUDE.md), e a mesma excecao
comentada `bnt-keep-colors` do 2L no ladrilho do QR.

**Mobile.** `max-h-[90vh] overflow-y-auto` no `DialogContent`: sem isso o botao
de copiar ficava fora da area visivel em viewport baixa, sem como alcanca-lo.

## Tarefa 2: timer

`client/src/lib/pixExpiration.ts`, novo, duas funcoes puras.

- `parseAsaasDate`: string com offset passa direto; string sem offset e parseada
  a mao e recebe `-03:00` explicito (o Brasil aboliu o horario de verao em 2019,
  entao o offset e fixo o ano inteiro); qualquer outra coisa vira `null`, nunca
  `Invalid Date`.
- `formatPixRemaining`: acima de uma hora devolve `far` com horas arredondadas
  para CIMA e o vencimento absoluto em `America/Sao_Paulo`; abaixo de uma hora
  devolve `near` com `mm:ss`; prazo vencido devolve `expired`; sem data devolve
  `unknown`, que **nao** e o mesmo que `expired`, porque dizer "expirou" sobre
  cobranca viva e a pior mentira que a tela pode contar.
- O tick de um segundo e o `setInterval` ficam no componente; a decisao mora nas
  funcoes puras.

**24 testes** em `pixExpiration.test.ts`, cobrindo as duas formas de string, o
caso `Invalid Date`, as duas fronteiras (uma hora e zero) e uma asserção de que a
string sem offset NAO e interpretada como UTC.

## Tarefa 3: valor do card

- `pendingCharge` ganhou `amountCents` (`server/routes/billing.ts`), lido do
  provedor por `fetchChargeAmountCents` apenas quando existe cobranca Asaas
  pendente, devolvendo `null` em vez de lancar.
- `client/src/pages/Perfil.tsx`: o campo "Valor" usa
  `pendingCharge?.amountCents ?? planCents`. Sem cobranca pendente, ou com
  backend antigo, ou com provedor mudo, o comportamento e o de hoje.
- A resposta da CRIACAO tambem passou a trazer `amountCents`
  (`CreateCheckoutResult`), e e de la que o modal tira o numero: fonte unica, sem
  recalcular desconto no frontend e sem chamada remota no fluxo quente.

**8 testes** em `server/routes/billingPendingChargeValor.test.ts`: campo presente
quando o dube devolve valor, `null` (e explicitamente nao zero) quando nao
devolve, a rota nao cai, o id certo e passado, e os tres casos em que o provedor
NAO deve ser consultado (boleto da Stripe, linha sem id, sem cobranca pendente).

## Caminho do dinheiro

O relatorio pedia diff VAZIO em `asaas.ts`. Isso deixou de ser possivel quando o
arquiteto decidiu que o valor vem da resposta de criacao do provedor: o campo
precisa ser lido e repassado. O que da para afirmar, e esta medido:

```
server/providers/asaas.ts        +48  -0     (nenhuma linha existente alterada)
server/routes/webhooksAsaas.ts   DIFF VAZIO
server/providers/shared.ts       DIFF VAZIO  (efeitos de ativacao)
```

As tres unicas mudancas em `asaas.ts` sao: um campo OPCIONAL no tipo
`AsaasCharge`, um campo NOVO no objeto de retorno, e uma funcao NOVA de leitura
(`fetchChargeAmountCents`). Nenhuma linha de criacao de cobranca, de webhook, de
ativacao ou de cupom foi tocada.

## Evidencias

```
pnpm check                      EXIT 0 (em cada commit)
suite completa                  3517 passaram, 10 pulados, 265 arquivos
  (era 3485 antes do lote: +32, sendo 24 do timer e 8 do valor)
pre-commit                      verde nos 4 commits (suite, suite sem .env, tsc, limiares)
prettier                        conforme nos arquivos tocados
travessao (scanner Python)      0 ocorrencias
```

## Diff por arquivo

```
client/src/components/pro/PixCheckoutModal.tsx    +318
client/src/lib/pixExpiration.test.ts              +141
client/src/lib/pixExpiration.ts                   +113
client/src/pages/Checkout.tsx                     +67 -19
client/src/pages/Perfil.tsx                       +27 -6
client/src/services/subscriptionService.ts        +5
server/providers/asaas.ts                         +48
server/providers/types.ts                         +11
server/routes/billing.ts                          +29 -2
server/routes/billingPendingChargeValor.test.ts   +229
```

## Commits

```
e0dfec47 feat(billing): expose pending charge amount from provider
bc75bdd5 feat(pix): parse provider expiration date with explicit brasilia offset
8ed935be fix(perfil): show pending charge amount instead of plan price
50ff2880 feat(checkout): pay pix in a modal without leaving the page
```

## Verificacao visual: o que deu e o que NAO deu

`pnpm build` com `VITE_API_URL=http://localhost:3100` (EXIT 0) e
`vite preview` em pe na 4173. O modal esta no bundle: `Pix copia e cola`,
`bnt-keep-colors mt-3`, `text-ink-on-accent`, `Pagamento confirmado` e
`Expira em` aparecem todos em `Checkout-CXVa6BbD.js`.

**Nao consegui renderizar o modal.** Ele so abre depois de um `createCheckout`
bem-sucedido, o que significa criar cobranca real em producao: caminho do
dinheiro, a segunda condicao de PARE deste lote. O mesmo vale para o bloco da
pagina de assinatura, que depende de cobranca pendente. Entao o que existe sobre
a aparencia e INSPECAO do markup, nao verificacao: as classes sao as mesmas
tokens ja provadas em producao pelo 2L. A verificacao de verdade e a Etapa D, e o
roteiro dela ja inclui alternar os dois temas na tela do QR.

## Strings TODO(Ana) novas

Todas em `PixCheckoutModal.tsx`:

1. titulo do modal, nos dois estados ("Pague com Pix" e "Pagamento confirmado!")
2. mensagem de confirmacao ("Seu acesso Pro ja esta liberado.")
3. rotulo do botao apos a confirmacao ("Ver meu Pro")
4. mensagem de codigo expirado
5. rotulo do botao de refazer o checkout ("Escolher plano de novo")
6. estado de carregamento ("Gerando seu codigo Pix...")
7. copy da falha ao gerar o codigo
8. rotulo do fallback para a fatura
9. rotulo do valor ("Valor")
10. rotulo do copia e cola ("Pix copia e cola")
11. rotulos do botao de copiar ("Copiar codigo" e "Copiado!")
12. rotulo do QR ("Escaneie no app do banco")
13. texto da contagem regressiva ("Expira em mm:ss")
14. texto do prazo ("Vence em Xh, ate DD/MM HH:MM")
15. aviso de confirmacao automatica

## Pendencias que este lote registra

1. **Opcao C, o desenho permanente**: persistir o valor cobrado na criacao, com
   migration. A opcao A entregue aqui e a ponte; C tira a dependencia de rede do
   caminho frio e torna o valor auditavel sem consultar o provedor. Precisa de
   aprovacao de migration.
2. **Fonte do timer** (secao "achado nao previsto" acima).
3. **`formatCurrencyFromCents` duplicado**: existe como funcao privada em
   `Perfil.tsx` e agora como `formatarBRL` no modal. Extrair para lib e refactor
   de codigo adjacente, fora do escopo deste lote.
4. **Cobranca `pay_97mhq09np4utjmfx`** criada para a medicao do formato: precisa
   ser cancelada pelo Murilo no painel.

---

# Delta: o timer passa a ser governado pelo `dueDate`

HEAD_FINAL desta parte: ver o ultimo commit da lista abaixo. O corpo acima
descreve o lote como entregue antes desta decisao; o que segue substitui a
secao "achado nao previsto".

## O que mudou

**1. A resposta de criacao expande de novo, com `dueDate`.** O
`POST /v3/payments` ja devolve o campo; `asaas.ts` passou a repassa-lo, do mesmo
jeito aditivo do `amountCents`, sem nenhuma chamada extra. `CreateCheckoutResult`
e o tipo do servico do cliente acompanham.

**2. `parseAsaasDate` ganhou a forma so-data.** `"YYYY-MM-DD"` vira
**23:59:59 em -03:00**, o fim daquele dia em Brasilia. A escolha e conservadora
de proposito: o Asaas so vira a cobranca para OVERDUE na madrugada seguinte,
entao tratar o dia inteiro como valido nunca declara vencido algo que ainda pode
ser pago, enquanto assumir 00:00 tiraria um dia de prazo de quem pagou no dia
certo.

**3. O prazo exibido e o MENOR dos dois**, por `earliestDeadline`, funcao pura
nova. Nulo e ignorado e nao tratado como zero, senao um campo ausente venceria
todos os prazos reais e a tela diria "expirado" sobre cobranca viva. Sem nenhum
prazo valido o timer simplesmente nao renderiza, e o resto do modal funciona: o
timer nunca e condicao de renderizacao de nada.

Pegar o menor em vez de trocar uma fonte pela outra tambem resolve o futuro: se
algum dia o prazo do QR for o mais curto, ele passa a mandar sem mudanca de
codigo.

## O `dueDate` que o NOSSO checkout grava

`asaas.ts:375` envia `dueDateInDays(PIX_DUE_DAYS, new Date())` com
`PIX_DUE_DAYS = 2`, e a funcao faz `toISOString().slice(0, 10)`, ou seja, a data
em **UTC**. Isso nao bate sempre com "2 dias" em Brasilia, e o desvio foi medido:

```
hora Brasilia   dueDate gravado   dias reais em Brasilia
    03:30         2026-09-03               2
    12:30         2026-09-03               2
    20:30         2026-09-03               2
    21:30         2026-09-04               3
    22:30         2026-09-04               3
    23:30         2026-09-04               3
```

Entre 21h e meia-noite de Brasilia (00h a 03h UTC), a cobranca nasce com TRES
dias em vez de dois. O erro e sempre para MAIS, nunca para menos, entao ninguem
recebe menos prazo do que a copy promete ("O código vence em 2 dias", em
`PaymentMethodDialog.tsx:57`). Nao corrigi: e mudanca no calculo do vencimento,
ou seja, caminho do dinheiro, que este lote nao toca. Fica registrado.

## Expectativa de teste ALTERADA (uma)

Em `pixExpiration.test.ts`, a string `"2026-09-03"` estava na lista de entradas
que deviam virar `null`, sob o rotulo "data incompleta". Com a decisao acima ela
passou a ser uma entrada VALIDA, entao saiu da lista e ganhou tres casos
proprios. E a unica expectativa alterada, e ela mudou porque o comportamento
mudou de proposito.

## Evidencias do delta

```
pnpm check                  EXIT 0
suite completa              3524 passaram, 10 pulados, 265 arquivos
  (3517 antes do delta: +7, sendo 3 do caso so-data, 5 do earliestDeadline,
   menos 1 que saiu da lista de entradas invalidas)
pixExpiration.test.ts       31 testes
travessao (Python)          0
```

## Diff do delta

```
server/providers/asaas.ts                       +10
server/providers/types.ts                       +5
client/src/services/subscriptionService.ts      +2
client/src/lib/pixExpiration.ts                 +45 -8
client/src/lib/pixExpiration.test.ts            +59
client/src/components/pro/PixCheckoutModal.tsx  +18 -3
client/src/pages/Checkout.tsx                   +8 -1
```

`server/routes/webhooksAsaas.ts` e `server/providers/shared.ts` seguem com diff
vazio. Em `asaas.ts` o delta tambem e puramente aditivo.

## Commits do delta

```
d67b72e4 feat(billing): expose charge due date in checkout response
4a6ec0a8 feat(pix): resolve deadline from earliest of due date and qr expiry
0b19922b fix(checkout): drive pix timer by charge due date
```

## Pendencia nova

`dueDateInDays` calcula em UTC e por isso concede tres dias nos checkouts feitos
depois das 21h de Brasilia (medicao acima). Sempre a mais, nunca a menos, entao
nao ha prejuizo para quem compra; corrigir exige mexer no calculo do vencimento
e precisa de lote proprio.
