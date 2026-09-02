HEAD_FINAL: f727292c2e38351a392c1472726e34ee9623d6eb

# Fase 1 do Pix: NO AR

Deploy dos lotes 2j (Asaas em producao) e 2m (modal, timer, valor do card),
executado em 2026-09-01. `main` em `f727292c`, Railway e Vercel confirmados,
webhook definitivo ativo, smoke com dinheiro real concluido.

## Gates, transcritos

- **Gate 1 (veredito apto do 2d-prod).** Substituido por aditivo do arquiteto: a
  prova ponta a ponta passou para a Etapa D, em producao.
- **Gate 2 (escritor das linhas apagadas).** Liberado. O escritor foi
  identificado por `pg_stat_statements`: script de limpeza humano via SQL Editor,
  filtrado por provider. A condicao de bloqueio original era "escritor
  desconhecido", e ela deixou de valer.
- **Gate 3 (sweep editorial da Ana).** Adiado por decisao dela; o "pode publicar"
  cobre publicar com as strings atuais. O sweep e a pendencia pos-lancamento
  numero 1.
- **Gate 4 ("pode publicar" e congelamento).** A Ana viu o preview (modal nos
  dois temas, valor no card, timer) e concedeu o "pode publicar" com escopo no
  hash `f727292c`, **transmitido pelo Murilo**. O congelamento foi declarado pelo
  proprio Murilo: nenhum commit dele entre a concessao e o fim do rito. O
  congelamento foi respeitado: `origin/main` estava em `f2bfd12d` na conferencia
  do inicio e continuava la no momento do merge.

## Etapa A: merge e CI

`main` avancou `f2bfd12d..f727292c` em fast-forward puro (0 commits do main fora
da branch, 9 a subir), sem merge commit. CI verde nos dois jobs:

```
run 33510770322   qualidade: success   migrations: success
https://github.com/murilobarbosaa/boranatech/actions/runs/33510770322
```

Nota operacional: `gh` nao existe nesta maquina. O CI foi conferido pela API do
GitHub com o `GITHUB_TOKEN` do `.env`.

## Etapa B: os dois deploys

**Railway.** `/api/health` com `commit: f727292c...`, `uptime` 108s, e os cinco
`checks` (database, openai, currents, jooble, redis) em ok.

**Vercel.** Medida na superficie certa e COM CONTROLE, que foi a licao cara do
2j: peguei o `index-BjBbJqH9.js` servido, extrai dele a referencia do chunk lazy
do Checkout (`Checkout-BwLP1HB2.js`, 40.525 bytes contra 32.962 antes do modal) e
procurei nele.

| Marcador | Ocorrencias |
| --- | --- |
| `native_pix` (CONTROLE, existia antes do 2m) | 1 |
| `Pagamento confirmado` (2m) | 1 |
| `Expira em` (timer, 2m) | 1 |
| `Vence em` (timer, 2m) | 1 |
| `bnt-keep-colors mt-3` (2L) | 1 |

O controle em 1 e o que da valor aos outros quatro: sem ele, uma busca no arquivo
errado teria dado zero em tudo e parecido "deploy nao chegou". Foi exatamente o
que aconteceu comigo no 2j, e so o controle desmentiu.

Confirmado tambem pelo sinal que o `confirmar-deploy.md` designa como primario
para a Vercel: release `f727292c`, `lastDeploy vercel-production
2026-09-01T13:00:57Z`.

**Kill-switch.** Nao precisou ser reprovado neste lote (as envs nao mudaram), mas
ficou provado no 2j por acidente feliz: com as tres `ASAAS_*` ausentes, a rota
`/api/webhooks/asaas` respondeu **503**; com elas, **401** sem token. Como
`asaasEnabled` e lido no carregamento do modulo, a mudanca de 503 para 401 e
prova de processo novo com as variaveis, sem depender de olhar o painel.

## Etapa C: webhook

Configuracao inalterada neste lote. Estado conferido:

```
totalCount: 1
695e2fba-f05a-45ae-a568-b4bf6b061eb5  boranatech-pix
  url        : https://api.boranatech.com.br/api/webhooks/asaas
  enabled=true  interrupted=false
  events     : PAYMENT_CONFIRMED, PAYMENT_DELETED, PAYMENT_OVERDUE, PAYMENT_RECEIVED
```

O legado `boranatech-billing` (que apontava para `/api/billing/webhook`, rota
404) foi removido no 2j. A lista final tem um item.

## Etapa D: o smoke, item por item

Comprador: Murilo, conta testarpix1, cupom TESTEPIX de 90%, plano semestral.
Baseline congelado antes de comecar (`billing_events` asaas com 5 linhas, 2
linhas de assinatura, `times_redeemed` 0), para os deltas serem medidos e nao
lembrados.

**(a) `billing_events`.** Uma linha nova, de 5 para 6:

```
PAYMENT_RECEIVED   pay_qlfe88ojqywpde05
  received_at  : 2026-09-01T13:11:33.981Z
  event_created: 2026-09-01T10:11:33Z
  id           : asaas:evt_d26e303b238e509335ac9ba210e51b0f&1493667944
```

Veio so `PAYMENT_RECEIVED`, sem `PAYMENT_CONFIRMED`, e isso e o esperado para
Pix: a liquidacao e imediata e o Asaas emite um evento so. O handler trata os
dois igual (`PAYMENT_EVENTS`), entao qualquer um dos dois ativa.

**(b) A assinatura.**

```
cab7d0e3-2cbc-4026-b844-542e3c7ca391
  status               : active
  payment_method       : pix
  cobranca             : pay_qlfe88ojqywpde05
  coupon_code          : TESTEPIX
  created_at           : 13:08:50.046Z   (nasceu pending)
  current_period_start : 2026-09-01T13:11:34.203Z
  current_period_end   : 2027-03-02T13:11:34.203Z
```

182 dias exatos, que e o `ONE_OFF_ACCESS_DAYS` do semestral.

A prova de `out_activated` e INDIRETA, e vale registrar por que: o campo nao e
persistido em lugar nenhum, entao nao da para le-lo depois. Mas
`applyActivationEffects` (`asaas.ts:956`) so e chamado com
`out_activated === true`, e o resgate do cupom acontece dentro dele. O contador
subiu, logo a RPC ativou. Se ela tivesse devolvido `false` (reprocesso, ou linha
em estado errado), a funcao teria retornado antes e o cupom nao teria mexido.

**(c) Cupom.** `times_redeemed` de 0 para **1**, exato. Desconto (90), status e
`max_redemptions` intactos no momento da medicao.

**(d) E-mail.** Disparo registrado no Resend:

```
13:11:35.066Z   "Seu plano Pro está ativo!"   status: bounced
```

1,08s depois do evento. O `bounced` e esperado e nao e defeito: o dominio da
conta de teste nao existe (`gmail.cpm`). A prova pedida era o disparo. Conferido
pelo outro lado tambem: zero issues no Sentry mencionando e-mail ou ativacao,
entao o alarme `ativacao_email_falhou` nao acendeu.

**(e) Reentrega idempotente.** O Murilo reenviou o mesmo evento pelo painel. Tudo
identico ao baseline congelado:

| O que | Baseline | Depois | Veredito |
| --- | --- | --- | --- |
| linhas em `billing_events` (asaas) | 6 | 6 | identico |
| eventos `PAYMENT_RECEIVED` | 1 | 1 | identico |
| `updated_at` da assinatura | 13:11:34.25822Z | 13:11:34.25822Z | identico |
| `current_period_start` | 13:11:34.203Z | 13:11:34.203Z | identico |
| linhas asaas em `subscriptions` | 3 | 3 | identico |
| e-mails de ativacao para a conta de teste | 1 | 1 | identico |

O dedupe e por chave primaria (`asaas:<eventId>`) com `ignoreDuplicates`, e
acontece ANTES do `try` que ativa: a segunda entrega sai em
`{received: true, deduped: true}` sem tocar em nada. Nao temos leitura do log do
Railway, entao o "200 com deduped" nao foi lido diretamente; a evidencia e o
estado, que e mais forte que o log para esta pergunta.

Registro de um erro meu aqui: a primeira checagem do Resend contou TODOS os
envios do periodo e acusou divergencia. Eram e-mails de boas-vindas de cadastros
reais de terceiros, sem relacao com o teste. O filtro correto (assunto de
ativacao, e depois o dominio da conta de teste) devolveu 1 e 1. Instrumento largo
demais responde outra pergunta.

**(f) Fila.** `enabled=true`, `interrupted=false`, depois de tudo.

**(g) Sentry.** Zero issues no `node-express` com ocorrencia depois das 13:04Z.

**(h) Latencia do caminho de pagamento.**

```
evento recebido        13:11:33.981Z
periodo iniciado (RPC) 13:11:34.203Z    +222 ms
linha atualizada       13:11:34.258Z    +277 ms
e-mail disparado       13:11:35.066Z   +1085 ms
```

Referencia: o cancelamento de ontem fechou em 64ms. A diferenca e coerente com o
que cada caminho faz. O cancelamento e um `UPDATE`; este roda a RPC transacional,
le o plano, calcula o periodo e encadeia os efeitos de ativacao.

## NAO REGRESSAO DO BOLETO, provada em producao com cliente real

Este e o achado mais valioso do dia e nao estava no roteiro. O boleto Stripe de
R$ 129 que estava pendente desde `2026-09-01T00:35:11Z` **foi pago e ativado**:

```
06:43:30.246Z  charge.succeeded                          processado 06:43:31
06:43:30.799Z  checkout.session.async_payment_succeeded  processado 06:43:31
06:43:30.947Z  linha 55b28435 -> active, periodo ate 2027-03-02
```

`checkout.session.async_payment_succeeded` e exatamente o caminho que o lote 1a
reescreveu para usar a RPC `activate_subscription_exclusive`. A ativacao rodou
sobre o codigo novo, ja em producao (deploy de `f2bfd12d` as 05:17Z), com
dinheiro real de um cliente real, latencia de ~148ms, sem uma linha no Sentry.

Ou seja: a Fase 1 nao so nao quebrou o boleto, como a prova disso veio de graca,
de um pagamento espontaneo, e nao de um teste montado.

## Etapa E

**1. Cupom.** O `TESTEPIX` saiu do ar. **Mas foi APAGADO e nao desativado**, e
isso importa registrar. Confirmado com controles nos dois sentidos: `code=eq.` e
`ilike` devolvem vazio, o id `91e22926-...` nao existe mais, e o controle
(`code=eq.EMPREGO`) acha normalmente. A tabela tem 9 cupons e nenhum e o de
teste.

O objetivo de seguranca foi atingido (sem linha, `findValidCoupon` nao acha nada,
e um cupom de 90% apagado e tao inofensivo quanto um inativo), e nada quebrou por
referencia (`subscriptions.coupon_code` e texto, nao chave estrangeira). O que se
perdeu foi o REGISTRO: `times_redeemed: 1` era a evidencia auditavel do resgate e
sumiu junto com a linha. A medicao das 13:11:34.364Z virou o unico registro do
fato, e so existe porque foi capturada antes.

**2. Assinatura interna ativa.** A `cab7d0e3` (conta testarpix1) segue ativa ate
2027-03-02. Decisao de manter ou encerrar e da Ana; nada foi feito.

**3. Vigilancia.** Janela de 30 minutos a partir da confirmacao (13:11:34Z ate
13:41:34Z). Resultado na secao final.

**4. Nota para o contador.** Movimentacoes de teste do fim de semana e de hoje:

| Cobranca | Valor | Desfecho |
| --- | --- | --- |
| `pay_yilzimnpr2lije63` | R$ 12,90 | cancelada sem pagamento |
| `pay_3pmbrkcxuxrl25x4` | R$ 12,90 | cancelada sem pagamento |
| `pay_4ymdgbco5s91ldth` | nao medido | cancelada sem pagamento |
| `pay_g73ho8r8d52s3u2l` | nao medido | cancelada sem pagamento |
| `pay_97mhq09np4utjmfx` | R$ 12,90 | cancelada sem pagamento |
| `pay_qlfe88ojqywpde05` | **R$ 12,90** | **PAGA** (smoke final) |

**Dinheiro que de fato circulou: R$ 12,90 bruto, uma unica vez.** O liquido de
uma cobranca Pix de R$ 12,90 nesta conta foi medido em R$ 10,91, ou seja, R$ 1,99
de taxa. Duas cobrancas aparecem como "nao medido" de proposito: elas foram
canceladas antes de eu ler o valor delas e ja nao existem na API para consulta.
Presumir que eram R$ 12,90 seria plausivel e nao medido, e este projeto tem
historico com numeros plausiveis.

## Backlog pos-lancamento, consolidado

1. **Sweep editorial da Ana** (Gate 3, adiado): TODO(Ana) acumulados dos lotes
   2c, 2f, 2g, 2h e as 15 strings novas do 2m.
2. **Renovacao Pix**: hoje o lembrete de renovacao exclui o provedor Asaas
   (2i). Limite de janeiro de 2027.
3. **Cron de cobranca Pix orfa**: precisa de um leitor de status do Asaas; sem
   ele o guard cancelaria assinaturas pagas cujo webhook se perdeu.
4. **Opcao C do valor**: persistir o valor cobrado na criacao, com migration.
   Tira a dependencia de rede do caminho frio e torna o valor auditavel sem
   consultar o provedor. Aguarda aprovacao de migration da Ana.
5. **Desvio de UTC no `dueDate`**: `dueDateInDays` calcula em UTC, entao checkout
   entre 21h e meia-noite de Brasilia grava tres dias em vez de dois. Sempre para
   mais, nunca para menos, entao nao ha prejuizo; corrigir antes da renovacao
   Pix.
6. **Botao de excluir cupom destroi historico**: deveria desativar (soft-delete)
   quando `times_redeemed > 0`, em vez de apagar a linha. Ver Etapa E item 1.
7. **`processed_at` do `billing_events` nao e escrito pelo caminho Asaas**: e uma
   camada a menos que a Stripe tem. Se a compensacao falhar apos um erro, a
   reentrega e deduplicada e o evento se perde, com o Sentry
   `asaas_webhook_falhou` como unico rastro.
8. **Detector de orfaos nao cobre o Asaas**: a fonte e `finance_transactions` da
   Stripe, e cobranca Pix nao aparece la.
9. **`formatCurrencyFromCents` duplicado**: funcao privada em `Perfil.tsx` e
   `formatarBRL` no `PixCheckoutModal`. Extrair para lib.
10. **`.gitignore` posicional**: corrigido no 2L para `.env.bak*`, mas a licao
    fica: padrao que cobre um dos dois jeitos obvios de nomear falha passando.
11. **Migration `20260831120000` nao verificada por leitura**: CHECK constraint
    nao e legivel pelo PostgREST. Verificada pelo arquiteto via
    `schema_migrations`.
12. **`vite_preload_error` e `chunk_reload`** no frontend: serie aberta desde
    2026-08-14, agitada a cada deploy pela troca de hash dos chunks. Nao e
    regressao deste ciclo, mas e ruido cronico com 151 usuarios afetados.
13. **Tela de cobranca expirada** na pagina de assinatura (o modal ja tem o
    estado; a pagina nao).
14. **Contract do `pendingBoleto`**: remover o alias depois de passado o tempo de
    vida de uma sessao, no mesmo commit que atualiza
    `janelaDeDeployInversa.test.ts`.
15. **Card do admin** para cobrancas Pix.
16. **Mock de DEV opt-in** no `SubscriptionContext`: hoje ele mente `isPro: true`
    e nunca chama a API, o que escondeu a tela do QR durante o 2d-prod.
17. **~168 travessoes em comentarios** espalhados por 83 arquivos, em lote
    proprio com janela coordenada.
18. **Lote 2n, confetti na confirmacao do Pix**: Passo 0 ja feito. `proConfetti.ts`
    e modulo compartilhado sem acoplamento, zero linhas a extrair, e os cinco
    chamadores ja respeitam `prefers-reduced-motion`. O `CheckoutSucesso.tsx` ja
    celebra cartao e boleto, entao o Pix e o unico caminho de compra sem
    celebracao.

## Vigilancia de 30 minutos: resultado

Janela de `2026-09-01T13:11:34Z` a `13:41:40Z`, contada a partir da confirmacao
do pagamento.

```
node-express       0 issues com ocorrencia na janela
boranatech-front   3 issues, TODAS pre-existentes:
  auth provider failure: bad_oauth_state   firstSeen 2026-07-29
  chunk_reload                             firstSeen 2026-08-14
  vite_preload_error                       firstSeen 2026-08-14
```

Nenhuma issue NOVA em nenhum dos dois projetos. As tres do frontend sao series
antigas: `bad_oauth_state` desde 29/07 e o par de chunk desde 14/08, este ultimo
agitado pela troca de hash a cada deploy.

Estado final do dominio ao fechar a janela:

```
billing_events (asaas) : 6
subscriptions  (asaas) : 3  (1 active, 0 pending)
```

## Declaracao

**A Fase 1 do Pix esta NO AR.** Uma compra real foi feita, paga, confirmada
sozinha na tela, ativou a assinatura pela RPC, contou o resgate do cupom,
disparou o e-mail, resistiu a reentrega sem duplicar efeito e nao acendeu uma
unica luz no Sentry. O caminho de boleto, que compartilha a mesma RPC, provou nao
ter regredido com um pagamento espontaneo de cliente real no mesmo dia.
