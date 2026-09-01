HEAD_FINAL: 39f407ddc002eba0c3da6cad86ff260358ac5136

Worktree: /home/s0ft/bnt-asaas | Branch: pix/lote2a | Base: origin/main @ 8b219a6e114790b0d0ec939a29012a168e851e65

Um commit novo (vinte e um na branch). Nenhuma migration. Nenhum push, nenhum merge.

**A Tarefa 2 acionou a condicao de PARE que o proprio enunciado previu.** Nao foi implementada; a
proposta esta na secao dela.

---

## Tarefa 1: vazamento de renovacao neutralizado

### O que mudou

O seletor de `expiring-subscriptions` ganhou `.neq("provider", "asaas")` e foi **extraido** para
`selecionarAssinaturasAVencer` (`server/routes/cron.ts`), exportada.

```diff
     .eq("renewal_type", "manual")
     .eq("status", "active")
+    .neq("provider", "asaas")
     .gt("current_period_end", nowIso)
     .lte("current_period_end", windowIso)
```

**A extracao nao e enfeite: era a unica forma de testar o que importa.** A consulta vivia inline
dentro de `coletarTagueado`, no corpo do handler de rota, entao a unica coisa testavel de fora seria
o FORMATO da query. O `cronBoletoExpiry.test.ts` ja registra por que isso nao serve: "um dube que so
registrasse os filtros provaria a intencao da query, nao quais linhas ela pega". Exportada, ela roda
contra um dube que APLICA os filtros.

**Exclusao por PROVEDOR, nao por metodo**, conforme decidido: a pergunta e quem RENOVA, nao como a
pessoa pagou. Excluir por `payment_method='pix'` funcionaria hoje por coincidencia (todo Pix e
Asaas), e deixaria de funcionar no dia em que a Stripe oferecer Pix ou o Asaas oferecer boleto.

### Testes

`server/routes/cronLembreteProvedor.test.ts`, **6 casos**, com dube que aplica `eq`, `neq`, `gt` e
`lte`:

| Caso | O que prova |
| --- | --- |
| linha Pix ativa na janela nao e selecionada | o efeito da correcao |
| linha de BOLETO equivalente segue selecionada | **regressao**: mesmos `renewal_type`, `status` e vencimento; so o provedor difere |
| mistura realista | dos dois juntos, so o boleto sai |
| cartao (`renewal_type: auto`) fora | filtro pre-existente intacto |
| cancelada fora | idem |
| vencimento fora da janela, dos dois lados | idem |

Os tres ultimos existem para provar que a correcao **nao estreitou** nada alem do pretendido.

### `POST /api/billing/renew` NAO foi tocado

Conforme instruido. O hardcode dele (`billing.ts:605-610`: `stripeProvider.createCheckout` com
`paymentMethod: "boleto"`) fica como parte da pendencia datada. Com a exclusao acima, ninguem chega
la por Pix, porque ninguem recebe o link.

---

## Tarefa 2: PARE, e a razao e a que o enunciado antecipou

O enunciado dizia: "Se a margem do boleto depender de campo que o Pix preenche igual, reusar; se
depender de algo especifico de boleto, PARE e proponha."

**A margem e reusavel. O GUARD nao e, e o guard e a parte que importa.**

### O que o cron do boleto realmente faz

Ele nao expira por idade. Ele expira por idade **e so depois de confirmar com o provedor que a
cobranca nao foi paga**:

| Etapa | Anchor | Depende de |
| --- | --- | --- |
| margem | `cron.ts:770`, `ORPHAN_BOLETO_DAYS = 4` (3d do boleto mais 1d de folga) | `created_at`, campo generico |
| **guard** | `cron.ts:836`, `lerSessaoDeBoleto(sessionId, stripe)` | **Checkout Session da Stripe** |
| pago ainda pending | `cron.ts:846-852` | NAO cancela; grita para investigacao |
| leitura indisponivel | `cron.ts:838-844` | NAO cancela; conta como `failed` |

O comentario do proprio cron diz o porque: "NUNCA cancela boleto pago... Na duvida (pago, ou erro na
consulta), deixa a linha VIVA".

### Por que nao da para espelhar dentro do escopo

O guard le a Checkout Session da Stripe. O equivalente para Pix seria ler o status da cobranca no
Asaas (`GET /v3/payments/{id}`), e **essa funcao nao existe**: `server/providers/asaas.ts` exporta
`maskCpf`, `paidAmountCentsFromAsaas`, `eventKey`, `processAsaasEvent` e `fetchPixQrCode`. Nenhuma le
status de cobranca.

Escrever essa funcao significa editar `server/providers/asaas.ts`, e o escopo deste lote e
`server/routes/cron.ts` e testes.

### Por que NAO implementei sem o guard

Seria pior que nao fazer. Sem consultar o Asaas, o cron nao consegue distinguir:

- **Pix nao pago e vencido** (o caso que ele existe para limpar), de
- **Pix PAGO cujo webhook de ativacao se perdeu** (dinheiro entrou, acesso nao saiu).

O estado no nosso banco e identico nos dois: `pending`. E exatamente por isso que o cron do boleto
consulta a Stripe. Um cron sem guard cancelaria a assinatura de quem pagou, e o registro do
pagamento sumiria do nosso lado. **Trocaria uma linha travada por um pagamento apagado.**

Vale notar que o risco de hoje e menor do que parece: a linha `pending` orfa trava o guard 409 de UM
usuario, ele nao perde dinheiro, e a situacao e visivel no admin. O remedio sem guard causaria dano
maior que a doenca.

### Proposta para o lote proprio

1. Em `server/providers/asaas.ts`, uma funcao espelhando `lerSessaoDeBoleto`: le `GET /v3/payments/{id}`,
   **nao lanca**, e devolve `{ estado: "ok", pago, status }` ou `{ estado: "indisponivel", motivo }`.
   Pago quando o status for `RECEIVED` ou `CONFIRMED`, que sao os mesmos que o webhook trata como
   pagamento (`PAYMENT_EVENTS` em `asaas.ts`).
2. Em `cron.ts`, o ramo Pix no mesmo handler, com `ORPHAN_PIX_DAYS = 3` (2d do QR, `PIX_DUE_DAYS`,
   mais 1d de folga, na mesma proporcao do boleto) e o MESMO tratamento: pago nao cancela e grita;
   indisponivel nao cancela e conta `failed`.
3. Renomear o handler, ou aceitar que `expire-pending-boletos` passa a cobrar dois meios. O nome
   dizendo `boletos` sobre um job que tambem mata Pix e a classe de documentacao que ensina o erro.

### Sobre a corrida com o webhook (item 2.2 do enunciado)

Conferi, e ela **ja converge nos dois sentidos**, independente da Tarefa 2:

- **cron antes, webhook depois**: `closePendingCharge` (`asaas.ts`) faz `UPDATE ... .eq("status", "pending")`.
  Linha ja fora de `pending` casa zero linhas, o Supabase nao devolve erro, e o handler segue para o
  `return`. No-op silencioso, sem excecao.
- **webhook antes, cron depois**: o seletor exige `status='pending'`; a linha nao entra no lote.

Nenhum ajuste era necessario, e nenhum foi feito.

---

## Tarefa 3: pendencias registradas

**1. Renovacao Pix propria. PRAZO: JANEIRO DE 2027.**
Hoje `expiring-subscriptions` exclui `provider='asaas'`, entao assinante Pix nao recebe lembrete de
vencimento. Falta: e-mail proprio do Pix e `POST /api/billing/renew` escolhendo provedor e metodo
pelo que a assinatura usa, em vez do `stripeProvider` mais `paymentMethod: "boleto"` fixos em duro
(`billing.ts:605-610`). O primeiro vencimento semestral de Pix cai em marco de 2027; ate janeiro de
2027 ninguem fica sem aviso por causa da exclusao. Depois disso, fica.

**2. `process-cancellations`, armadilha latente.**
Hoje seguro porque `cancel()` do Asaas NAO seta `cancel_at_period_end` (decisao do Lote 2b), e o
seletor exige essa flag. Se algum dia setar, a linha entra e `getStripeSubscriptionState` sera
chamada com um id `pay_...`, lancando a cada execucao, para sempre. E o mesmo bug latente que o
codigo ja documenta para boleto (`cron.ts`, regiao 375-390), agora compartilhado por dois provedores.

**3. Mock de dev do `SubscriptionContext`, backlog de DX.**
`client/src/contexts/SubscriptionContext.tsx:97-102` e `:136-141`: sob `import.meta.env.DEV` o
contexto devolve assinatura mockada e **nunca chama a API**. Default `?devSub=active` da `isPro:
true`. Qualquer fluxo real de billing e invisivel em `pnpm dev:client`, e foi o que escondeu a tela
do QR na tentativa de ontem. Desejavel: mock OPT-IN (so com `?devSub=` presente), com o caminho real
por default.

**4. Cron de expiracao de Pix pendente orfa.** A Tarefa 2 acima, com a proposta.

---

## Saidas das baterias

```
$ pnpm check           -> EXIT=0
$ pnpm test            -> EXIT=0
   Test Files  245 passed | 3 skipped (248)
        Tests  3235 passed | 10 skipped (3245)
$ pnpm check:limiares  -> EXIT=0
```

Eram 3229 ao fim do Lote 2h; 3235 agora, os 6 novos.

## Conferencia de travessoes

```
server/routes/cron.ts                        U+2014=0 U+2013=0
server/routes/cronLembreteProvedor.test.ts   U+2014=0 U+2013=0
TOTAL: 0
```

## Commits

| Hash | Mensagem | Arquivos |
| --- | --- | --- |
| `39f407dd` | `fix(cron): exclude asaas subscriptions from stripe renewal reminders` | `cron.ts`, `cronLembreteProvedor.test.ts` |

Staging por nome explicito, `git diff --cached --name-only` conferido antes, pathspec no commit.
Pre-commit verde. **Nenhum push, nenhum merge.**

## Retomada do 2d-prod

**Liberada**, com o backend reiniciado nesta branch (`39f407dd`).

**Frontend por `pnpm build && pnpm preview`**, conforme decidido (caminho 2 da verificacao anterior).
E o unico modo em que `import.meta.env.DEV` fica `false` e o `SubscriptionContext` chama a API de
verdade. Em `pnpm dev:client` o mock intercepta e a tela do QR nunca renderiza, entao a Etapa 3
mediria o mock em vez do fluxo.

A cobranca `pay_yilzimnpr2lije63` continua viva e `pending` (linha `e4d3a51e`), entao a Etapa 3 pode
comecar exibindo o QR dela, sem refazer checkout. Para exercitar o roteiro de cupom do Lote 2g e
preciso uma cobranca nova, e ai vale lembrar que o guard 409 de Pix pendente vai recusar enquanto
essa estiver aberta: cancelar ela no painel primeiro (o `PAYMENT_DELETED` fecha a linha e libera).

O `DELETE /v3/webhooks/{id}` da Etapa 6.1 segue obrigatorio ao fim. Nao tenho o id porque nao fui eu
que o criei.

## git status --porcelain final

```
?? lote2a-pagamentos-2026-08-29.md
?? lote2b-pagamentos-2026-08-29.md
?? lote2c-pagamentos-2026-08-29.md
?? lote2e-pagamentos-2026-08-30.md
?? lote2f-pagamentos-2026-08-31.md
?? lote2g-pagamentos-2026-08-31.md
?? lote2h-pagamentos-2026-08-31.md
?? lote2i-pagamentos-2026-09-01.md
```
