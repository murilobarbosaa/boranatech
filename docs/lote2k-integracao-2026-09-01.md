HEAD_FINAL: fe4cc814 (merge, ultimo commit de codigo). O commit deste relatorio
fica por cima e nao pode conter o proprio SHA; ele vai na resposta da sessao.

# Lote 2k: integracao do main avancado

`origin/main` em `56f2578e`, conferido no inicio e de novo imediatamente antes do
merge. A branch `pix/lote2a` agora contem o main inteiro (`git rev-list --count
HEAD..origin/main` = 0).

## Tarefa 0: os relatorios viram commit

O repositorio JA tem convencao: relatorio de engenharia mora direto em `docs/`,
sem subdiretorio (`fase0-fechamento.md`, `fase3-fechamento.md`,
`curriculo-pro-fase-1c-relatorio.md`, `curriculo-pro-fase-2a-relatorio.md`). Os
subdiretorios existentes sao tematicos (`investigacoes`, `medicoes`,
`roadmaps`), nao um lugar generico de relatorio. Segui a convencao existente e
NAO criei `docs/relatorios/pagamentos/`.

Nove arquivos movidos e commitados em `893c158c`: os oito lotes 2a a 2i mais o
`lote2j-deploy-2026-09-01.md`. O 2j entrou junto porque e da mesma serie e ficaria
como unico orfao, reproduzindo exatamente o problema que a tarefa fecha.

### Achado colateral: o `.gitignore` nao cobria o backup do `.env`

O `.gitignore` traz `.env*-bak`, que exige o nome TERMINAR em `-bak`. O backup que
eu havia criado no lote anterior se chamava `.env.bak-2i` e **nao casava**: uma
copia integral do `.env`, com todos os segredos, estava desprotegida na arvore.
Renomeei para `.env.2i-bak` e confirmei por `git check-ignore` que agora e
ignorado.

Nao mexi no `.gitignore`: isso e mudanca fora do escopo deste lote. Fica
registrado que o padrao e posicional e cobre so um dos dois jeitos obvios de
nomear um backup, que e a mesma familia de defeito que este projeto documenta
(escopo derivado por casamento de padrao que sub-casa em silencio).

## Tarefa 1: leitura semantica dos cinco commits de pagamento do main

### `d04a80f3` fix(stripe): treat lost write race on active subscription as success

**Camada:** aplicacao, dentro de `applySubscription` (`server/providers/stripe.ts`),
o caminho de assinatura RECORRENTE de cartao.

**O que muda:** classifica o 23505 vindo do indice parcial
`subscriptions_one_active_per_user`. O `upsert` arbitra
`provider_subscription_id`, e `ON CONFLICT` so absorve conflito no indice
ARBITRADO; conflito em qualquer outro indice unico levanta erro. Ao receber o
23505, o codigo LE o ocupante do slot ativo e decide entre tres desfechos:
ocupante e a propria assinatura do evento (corrida benigna, retorna sem lancar e
sem disparar `handleTransition`), ocupante e outra assinatura (erro real,
`AssinaturaAtivaDuplicada`, lanca), ou nao achou ocupante (lanca, porque "nao sei"
nao pode virar "esta tudo bem").

**Colide com 2a-2i?** NAO, e a razao e estrutural, nao textual. Medido nesta
arvore ja mesclada:

| Mecanismo | Onde e chamado | Caminho |
| --- | --- | --- |
| RPC `activate_subscription_exclusive` | `onBoletoAsyncPaymentSucceeded` (stripe.ts:903) e `activateOnPayment` (asaas.ts:810) | pagamento AVULSO (boleto e Pix) |
| Classificacao do 23505 | `applySubscription` (stripe.ts:337) | assinatura RECORRENTE de cartao |

Sao funcoes diferentes, em caminhos de escrita diferentes. A RPC resolve a
exclusividade DENTRO do banco, numa transacao, para os fluxos avulsos que o lote
1a atomizou. A classificacao do main resolve na aplicacao a corrida do upsert de
cartao, que nao pode usar `ON CONFLICT` naquele indice porque o PostgREST arbitra
uma lista de colunas seca. Os dois defendem a MESMA invariante (uma ativa por
usuario) em camadas diferentes, e nenhum anula o outro: um nao passa pelo codigo
do outro.

A prova nao e so leitura. `boletoAtivacaoRpc.test.ts` (14 testes, da branch) e
`webhookCorridaAssinatura.test.ts` (7 testes, do main) passam juntos na mesma
arvore.

**Dependencia que este commit revela:** ele nomeia o indice
`subscriptions_one_active_per_user` num literal e cita um 23505 REAL medido em
30/08 13:50:27. Um 23505 nomeando um indice so pode ocorrer se o indice existe,
entao a migration `20260829120000` **esta aplicada em producao**. Eu a tinha
registrada como nao aplicada; a anotacao estava desatualizada e fica corrigida
aqui. O guard nao consegue confirmar isso por conta propria (ele diz, na propria
saida: "73 policy(s) e 155 indice(s) declarados... NAO VERIFICADOS: o PostgREST
nao expoe nenhum dos dois"). Consulta complementar: 126 linhas ativas ou trialing,
126 usuarios distintos, zero usuario com mais de uma.

### `53fddf8d` fix(stripe): report invoice paid without subscription instead of silent return

**Camada:** aplicacao, `onInvoicePaid`. Troca um `return` mudo por
`console.error` mais Sentry `warning` quando uma invoice paga nao tem assinatura
vinculada. O 200 continua certo (nao ha o que retentar); o que muda e o rastro.

**Colide?** Nao. Toca so o caminho de invoice da Stripe, que nenhum lote 2a-2i
alterou. E da mesma familia de decisao que os lotes 2a-2i adotaram (ausencia nao
vira zero, silencio nao vira sucesso), entao reforca, nao contradiz.

### `9deb89ba` feat(billing): detect charges without owner from finance transactions

**Camada:** biblioteca nova (`server/lib/chargeSemDono.ts`) mais a rota de cron
`detect-orphan-payments` e a migration `20260831140000`.

**Colide?** Toca `server/routes/cron.ts`, um dos tres arquivos em conflito, mas
em REGIAO diferente da minha: ele mexe no handler de orfaos (linhas ~1363-1420) e
eu mexi em `selecionarAssinaturasAVencer` (~561-627). A colisao textual em
`cron.ts` veio de outro commit (ver Tarefa 2).

Nota de intencao, nao de codigo: o detector varre `finance_transactions` da
Stripe. Uma cobranca Pix do Asaas nao aparece nessa fonte, entao **o detector de
orfaos nao cobre o Asaas**. Nao e regressao (a fonte sempre foi a Stripe), e nao
esta no escopo deste lote; entra na lista de pendencias pos-lancamento.

### `1ced0103` fix(finance): keep plan code when parent charge has no owner

**Camada:** `server/lib/stripeSync.ts`, sincronizacao de `finance_transactions`.
Preserva o codigo do plano quando a cobranca-pai nao tem dono.

**Colide?** Nao. Arquivo que nenhum lote 2a-2i tocou.

### `7c4394dc` fix(db): allow billing orphan resolve action in audit check

**Camada:** banco, migration `20260831120000`, mais `auditActions.test.ts`.

**Colide?** Nao. Amplia a CHECK de `content_audit_logs.action` para aceitar
`billing_orphan_resolve`. Nenhum lote 2a-2i grava audit log.

### As duas migrations do main

Ambas **ADITIVAS** e isentas da janela de migration destrutiva.

`20260831120000_allow_billing_orphan_resolve_in_audit_action.sql`: troca a CHECK
de `content_audit_logs.action` por uma que contem os catorze valores antigos mais
`billing_orphan_resolve`. Nenhuma linha existente fica invalida.

`20260831140000_orphan_payments_charge_sem_dono.sql`: em
`billing_orphan_payments`, afrouxa `stripe_session_id` (sai o NOT NULL),
acrescenta `stripe_charge_id`, `candidate_user_id` e `candidate_checked_at`, poe
uma CHECK de exatamente-uma-chave e cria UNIQUE simples em `stripe_charge_id`
(nao parcial, por causa do 42P10 do `ON CONFLICT` que o cabecalho da migration
documenta e reproduz).

**Implicacao nos `EXPECTED_*`: nenhuma.** Nenhuma das duas cria tabela ou funcao.
O unico contador que mudou no main foi `EXPECTED_FUNCTION_COUNT`, de 32 para 33,
e por outro commit (`8c602228`, a RPC de listagem de usuarios do admin).

**Aplicadas no banco?** `20260831140000` SIM, verificado por consulta: as tres
colunas novas respondem 200 no PostgREST, e o controle com uma coluna inexistente
responde 400, o que prova que o teste discrimina. `20260831120000` NAO e
verificavel por leitura: o PostgREST nao expoe CHECK constraint, e a unica prova
direta seria um INSERT em producao. Fica declarada como nao verificada por mim.

## Tarefa 2: o merge

`git merge --no-ff --no-commit origin/main`, com `origin/main` reconfirmado em
`56f2578e` no mesmo comando.

### Resolucao 1: `server/routes/cron.ts`

Dois conflitos, **os dois puramente cosmeticos**, e a causa e simetrica: os dois
lados fizeram a MESMA limpeza de travessao nas MESMAS linhas, com pontuacao
diferente (`56e7f4c8` na branch, `db4efb9a` no main).

```
branch : ... diz quando sobrou: corte
main   : ... diz quando sobrou, corte

branch : ... ja escapou dele. Foi assim que o orfao de
main   : ... ja escapou dele, foi assim que o orfao de
```

**Resolvido pelo lado do main.** Justificativa: os dois textos sao semanticamente
identicos, entao o criterio passa a ser outro, e o menor diff contra o que ja
esta publicado e o melhor. Ficar com o meu texto criaria diferenca sem ganho.

A mudanca funcional do 2i esta em outra regiao e nunca esteve em disputa.
Conferido apos a resolucao: `.neq("provider", "asaas")` e
`selecionarAssinaturasAVencer` presentes, e `detectarChargesSemDono`,
`chargesSemDono` e `LOOKUPS_REAIS` (do main) tambem.

### Resolucao 2: `client/src/pages/Perfil.tsx`

Um conflito, mesma causa e mesmo criterio.

```
branch : ... nao veem esse botao: o cancel hoje
main   : ... nao veem esse botao, o cancel hoje
```

**Resolvido pelo lado do main.** A tela do QR nativo do 2h esta em outra regiao e
fez auto-merge.

### Resolucao 3: `client/src/components/pro/PaymentMethodDialog.tsx`

**Este era real, e tomar qualquer um dos dois lados inteiro daria errado.**

```
branch : onClick={() => onSelect(method)}      + shadow-[3px_3px_0_#0f172a]
main   : onClick={() => onSelect(option.method)} + shadow-[3px_3px_0_var(--bnt-shadow)]
```

Dois eixos independentes na mesma linha: o lote 2c mudou o identificador, o main
trocou a cor crua por variavel de tema. **Resolvido COMBINANDO**: `onSelect(method)`
do lado da branch, `var(--bnt-shadow)` do lado do main.

O lado do main esta errado NESTA arvore, e o motivo esta no codigo que fez
auto-merge logo acima:

```tsx
{options.map((method) => {
  const option = METHOD_UI[method];
```

Depois do 2c, `method` e o identificador do meio e `option` e a entrada de
apresentacao, cujo tipo e `{ icon, title, note }`. `option.method` nao existe. O
`tsc` teria pego, mas o ponto e outro: a linha certa nao existia em nenhum dos
dois lados, e sim na combinacao.

### Os seis arquivos de auto-merge

Ordenados por risco, medido pelo tamanho da mudanca dos DOIS lados:

| Arquivo | main | branch |
| --- | --- | --- |
| `server/providers/stripe.ts` | 239+/23- | 24+/149- |
| `server/app.ts` | 29+/7- | 28+/8- |
| `server/lib/env.ts` | 14+/0- | 46+/0- |
| `client/src/pages/Checkout.tsx` | 11+/11- | 83+/4- |
| `server/routes/billing.ts` | 2+/1- | 170+/50- |
| `client/src/components/certificates/CompleteProfileModal.tsx` | 3+/3- | 17+/5- |

Os tres primeiros conferidos por leitura:

**`server/providers/stripe.ts`, VEREDITO OK.** E o de maior risco: o main
acrescentou 239 linhas e a branch REMOVEU 149 (a mudanca de
`recordAffiliateConversion` para `shared.ts`). Conferido que o import de
`./shared` esta la e que todo o bloco novo do main esta presente e integro
(`INDICE_ATIVO_POR_USUARIO`, `ehConflitoDeAtivoPorUsuario`,
`STATUS_DO_INDICE_ATIVO`, `AssinaturaAtivaDuplicada`,
`stripe_corrida_assinatura_ativa`, `customerIdOfInvoice`). Nenhuma referencia
pendente ao que a branch moveu.

**`server/app.ts`, VEREDITO OK.** As cinco alteracoes do main estao todas na
regiao do middleware de rate limit (linhas ~304 a 375). A da branch e o import e
a montagem do `webhooksAsaasRouter` (linhas 32 e 518). Regioes disjuntas. A ordem
do `express.raw` continua certa: ele cobre `/api/billing/webhook` e
`/api/resend/webhook`, e o router do Asaas e montado em `/api/webhooks`, um
prefixo que nao passa por raw, que e exatamente o desenho do 2a.

**`server/lib/env.ts`, VEREDITO OK.** Os dois lados sao puramente aditivos e nao
se tocam: a branch acrescentou `asaasApiUrl`, `asaasApiKey`, `asaasWebhookToken`
e o conjuntivo `asaasEnabled`; o main acrescentou `sentryEnableNonProd`. Este
arquivo entrou na lista de risco por consequencia, nao por tamanho: mesclar
errado aqui derrubaria `asaasEnabled` e o Pix sumiria do checkout inteiro em
silencio, que e o proprio kill-switch descrito no 2j.

### Contadores, re-derivados por medicao

`pnpm check:migrations` rodado de verdade contra o banco, no estado pos-merge,
com o ambiente lido por Python (nunca `. ./.env`: a chave do Asaas comeca com
cifrao e o shell a expandiria como variavel indefinida, defeito ja medido nesta
serie).

```
EXPECTED_TABLE_COUNT             = 83   medido: 83 tabelas declaradas existem
EXPECTED_FUNCTION_COUNT          = 33   medido: 25 por REST + 8 de trigger
EXPECTED_TRIGGER_FUNCTION_COUNT  = 8
EXPECTED_RLS_COUNT               = 83
EXIT = 0
```

Nenhum contador precisou de ajuste: o 33 veio do main e a branch nao disputava a
linha. O guard tambem confirmou a assercao comportamental de
`ai_usage_excluded_tools()` e a direcao inversa (nenhuma funcao no banco sem
estar declarada).

## Tarefa 3: prova

### Baterias

| Bateria | Resultado |
| --- | --- |
| `pnpm check` | EXIT 0 |
| Suite completa (hook de pre-commit) | 3485 passaram, 10 pulados, 263 arquivos |
| Suite completa SEM `.env` (segunda rodada do hook) | verde, `.env` do disco conferido intacto |
| `pnpm check:limiares` | 131 sitios, 0 ORFAOS, 57 ancoras casando |
| `pnpm check:scripts` | EXIT 0 |
| Bateria dirigida (13 arquivos) | 205 testes, todos verdes |

A bateria dirigida cobriu a zona de colisao da Tarefa 1 dos dois lados:
`boletoAtivacaoRpc`, `asaasPix`, `webhookAsaasAuth`, `cronLembreteProvedor`,
`cronReconcileDuplicada`, `comissaoBasePaga`, `paymentMethods`,
`billingProDelegation`, `pixPolling` (branch) e `webhookCorridaAssinatura`,
`chargeSemDono`, `stripeSyncDono`, `auditActions` (main).

### Expectativas alteradas: NENHUMA

Provado por medicao, nao por afirmacao: a intersecao entre os arquivos de teste
alterados em relacao a cada pai e VAZIA. O main trouxe 39 arquivos de teste e a
branch 8, e nenhum aparece nos dois. Nao houve teste algum cuja expectativa
precisasse ser reconciliada, e eu nao editei nenhum arquivo de teste neste lote.

### Travessao

Conferido por Python (o `grep` desta maquina falha PASSANDO nesta checagem).
Linhas ADICIONADAS pelo merge em relacao a cada pai: **0 ocorrencias** dos dois
lados. Os tres arquivos que resolvi, conferidos por inteiro: limpos.

## ACHADO QUE O MERGE NAO RESOLVE: dark mode contra a tela do Pix

Entre os 84 commits veio o **dark mode inteiro** (`ccfaa6ce`, `843f1da1`,
`23fb5ae5` e a serie `theme`). Ele estabeleceu a convencao de cor por variavel
(`var(--bnt-shadow)`, `var(--brand-yellow)`). Os componentes do Pix nasceram nos
lotes 2c e 2h, ANTES dessa convencao existir, e o merge nao tem como perceber
isso: nao ha conflito nenhum, o codigo compila e os testes passam.

Medido na arvore ja mesclada:

```
arquivos .tsx do client usando var(--bnt-shadow) : 193
arquivos .tsx do client com sombra hexadecimal crua: 2
```

E os dois sao `client/src/components/admin/tasks/BoardColumn.overflow.test.tsx`
(arquivo de teste) e **`client/src/components/pro/PixQrCodeBlock.tsx`**, que tem
zero `var(--)` e cinco valores crus (`bg-white`, `#0f172a` em quatro sombras,
`#FFB800`, `text-slate-950`, `text-slate-600`, `text-slate-700`).

Em outras palavras: o unico arquivo de producao do frontend inteiro que ficou
fora da convencao de tema e a tela do QR Code do Pix. `PaymentMethodDialog.tsx`
esta parcialmente convertido (tres `var(--)`, cinco valores crus), porque a
conversao dele veio de raspao pela resolucao de conflito.

**NAO corrigi**, por ser fora do escopo declarado deste lote. Mas isto e material
para a Etapa D do 2j: quem for comprar no smoke com o tema escuro ligado vai ver
a tela do Pix com fundo branco cravado no meio de uma interface escura.

## Commits

```
893c158c docs(payments): add phase 1 lot reports
fe4cc814 merge(payments): sync pix/lote2a with main
```

Mais o commit deste relatorio. `git status --porcelain` limpo apos cada um.

## Veredito sobre o 2j

**Integracao FEITA e provada. O 2j esta desbloqueado do ponto de vista tecnico**:
a branch contem o main inteiro, os tres conflitos estao resolvidos com
justificativa, os contadores foram medidos e todas as baterias estao verdes.

Continuam pendentes, e nao sao deste lote:

1. **O congelamento precisa valer de verdade.** Ele ja foi declarado uma vez e
   nao valeu: 84 commits entraram. Enquanto a Etapa A do 2j nao rodar, qualquer
   push no main reabre este mesmo trabalho.
2. **Gate 3**: o adiamento por escrito da Ana sobre o sweep editorial ainda nao
   chegou. O main traz `cb0a896f chore: resolve lote1 editorial markers approved
   by ana`, que cobre os marcadores do lote 1, nao os de 2c, 2f, 2g e 2h.
3. **Dark mode na tela do Pix** (secao acima). Decisao de produto: corrigir antes
   da Etapa D ou aceitar a aparencia no smoke.
4. **Duas cobrancas Asaas vivas**, `pay_3pmbrkcxuxrl25x4` e
   `pay_yilzimnpr2lije63`, ambas PENDING e pagaveis ate 03/09. O cancelamento
   ficou combinado para depois da Etapa C.
5. **`20260831120000` nao verificada por mim** (CHECK constraint nao e legivel
   pelo PostgREST).
6. **Detector de orfaos nao cobre o Asaas**: a fonte e `finance_transactions` da
   Stripe. Nao e regressao, e pendencia pos-lancamento.
