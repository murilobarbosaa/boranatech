HEAD_FINAL: ca505a1e

# Lote 2o: cliente cancela a propria cobranca Pix pendente

Branch `pix/lote2o-cancelamento`, worktree `/home/s0ft/bnt-cancel-pix`, base `main` em `f050d76a`.
Sem migration, `EXPECTED_*` intocados. Deploy so com gate: visual e copy do Dialog pela Ana, "pode subir" do Murilo.

## Triagem previa (2026-09-11, somente leitura)

Linhas `asaas` + `pending` no banco: 8. Cobrancas PENDING no Asaas: 9. As 8 linhas casam uma a uma com a cobranca do Asaas (`externalReference` = id da linha). Nada foi cancelado.

| user_id  | plano  | cobranca             | criada (UTC) | dueDate | valor  |
| -------- | ------ | -------------------- | ------------ | ------- | ------ |
| c5c9a3c8 | mensal | pay_dvbgzkyyil4umc6q | 09-09 18:02  | 09-11   | 29,90  |
| c6176b80 | anual  | pay_fij0t0sgukepmrng | 09-10 11:21  | 09-12   | 222,00 |
| 2230611c | mensal | pay_cvip2e1shcy8hiri | 09-10 11:47  | 09-12   | 29,90  |
| 22f74338 | mensal | pay_hj4vav6922e9w042 | 09-10 15:37  | 09-12   | 29,90  |
| 1bb931cb | mensal | pay_43mjuzcemkz3f7hu | 09-10 17:07  | 09-12   | 29,90  |
| 602c2be6 | mensal | pay_8if48wkaaqljxpj3 | 09-10 17:57  | 09-12   | 29,90  |
| 3dda192c | mensal | pay_tuw7f7khztq1baqo | 09-11 22:05  | 09-13   | 29,90  |
| 930d79a3 | mensal | pay_bs4m9k6xkb3qbiw1 | 09-11 22:07  | 09-13   | 29,90  |

Dois casos para o painel, independentes de relato:

1. `22f74338`: assinatura Stripe por cartao `active` desde 2026-09-11 20:09 e Pix mensal ainda pendente. Se o Pix for pago, a ativacao da linha pendente pode marcar a do cartao como `superseded`: cobranca dupla.
2. `pay_iexu7etlbfpp6qkw` (Semestral, R$ 129,00, vence 09-12): o `externalReference` nao existe em `subscriptions` e o usuario dono nao existe mais no Auth (404). Cobranca viva e pagavel, sem dono.

## Passo 0

- **a. A trava.** `server/providers/asaas.ts:292-319`, `createCheckout` recusa com `409 pix_pending` quando existe linha `pix` + `pending` do usuario. O front mostra toast em `client/src/pages/Checkout.tsx:879-883` e, na renovacao, em `client/src/pages/Perfil.tsx:1076`.
- **b. `closePendingCharge` e idempotente.** `server/providers/asaas.ts:1455-1490` (numeracao da `main`): o update e `.eq("id", row.id).eq("status", "pending")`. Numa linha ja `canceled` nao escreve nada e nao da erro. PARE 1 nao disparou.
- **c. Cliente HTTP.** `asaasFetch`, `server/lib/asaasClient.ts:57-120`: timeout de 15s, fail-closed, nao-ok vira `502 asaas_error` com `asaas_status`, `asaas_code` e `asaas_description` no `context`; transporte vira `502 asaas_unreachable` sem `context`.
- **d. Resposta do DELETE.** Sucesso documentado: `{"deleted": true, "id": "pay_..."}` (docs.asaas.com/reference/excluir-cobranca, conferido em 2026-09-11). O erro de cobranca ja recebida NAO e documentado, e o projeto nao tinha amostra. PARE 2 disparou; resolvido pela classificacao por status via GET, aprovada pelo Murilo em 2026-09-11 (tres baldes, abaixo). O corpo real do DELETE fica para o smoke em producao.
- **e. Pontos de UI.** Bloco pendente: `client/src/pages/Perfil.tsx:1880-1939` (o `<PixQrCodeBlock />` na 1937). Modal: `client/src/components/pro/PixCheckoutModal.tsx`, sem rodape comum; montado por `Checkout.tsx:1499`, `Perfil.tsx:2398` (renovacao) e `Renovar.tsx:248` (sem sessao).
- **f. Desbloqueio automatico.** `refreshSubscription` (`client/src/contexts/SubscriptionContext.tsx:87-125`) refaz `GET /subscription`; `server/routes/billing.ts:287-297` so enxerga linha `pending`, entao com a linha fechada o `pendingCharge` vem `null`, o bloco some (`Perfil.tsx:980-986`) e o guard do item a deixa passar.
- **Rate limit.** Limiter global para `/api` (`server/app.ts:289`); `/api/billing/cancel-pending` nao esta em `server/lib/rateLimitExempt.ts`.

## Desenho

`cancelPayment(paymentId)` em `server/providers/asaas.ts`, nunca lanca:

- DELETE 2xx com `deleted: true`: `cancelada`.
- DELETE 2xx sem `deleted: true`: `falha`.
- DELETE 5xx ou transporte (sem `asaas_status` 4xx): `falha`, sem GET.
- DELETE 4xx: GET `/payments/{id}` (`lerPagamento`), e o status decide:
  - `RECEIVED`, `CONFIRMED`, `RECEIVED_IN_CASH`: `already_paid`;
  - `deleted: true` ou `CANCELLED`: `cancelada` (idempotente: duplo clique, corrida com o painel);
  - qualquer outro status, status ausente ou GET falho: `falha`.

`POST /api/billing/cancel-pending` (`handleCancelPending`, `server/routes/billing.ts`): resolve a linha pelo `req.user.id` (nenhum id do cliente). Sem linha, ou linha sem cobranca: `404 sem_cobranca_pendente`. `already_paid`: `409 pagamento_ja_recebido`, linha intacta. `falha`: `502 cancelamento_falhou`, linha intacta. `cancelada`: `closePendingCharge` na mesma requisicao e `200 { data: { canceled: true } }`. Se o fechamento falhar depois do DELETE aceito, o erro sobe (500); o PAYMENT_DELETED fecha a linha, e um novo clique tambem, pelo balde "ja removida".

Suposicoes declaradas:

- Linha `pending` sem `provider_subscription_id` responde 404 em vez de fechar: fechar sem saber se a cobranca remota nasceu arriscaria justamente a cobranca orfa que o fail-closed evita.
- A acao do modal aparece so onde o chamador passa `onChargeCanceled`: no Checkout. O modal de renovacao do Perfil e o `/renovar` (sem sessao) ficam sem ela. O bloco frio do Perfil so existe para quem nao e Pro (primeira compra), como antes.

## Os cinco desfechos testados

`server/routes/billingCancelPending.test.ts`: sem pendente (404), linha sem cobranca (404), autorizacao por construcao (filtros por `user_id` e id no corpo ignorado), `already_paid` (409, linha intacta), falha (502, linha intacta), sucesso (200 e `closePendingCharge` com `chargeId` e `rowId`), fechamento falho apos DELETE (erro sobe), leitura falha (500, Asaas nao chamado).

`server/providers/asaasPix.test.ts`, describe `cancelPayment`: os tres baldes do GET (`already_paid` x3, `cancelada` por `deleted` e por `CANCELLED`, `falha` por PENDING, OVERDUE, status desconhecido, status ausente e GET falho), DELETE 2xx com e sem `deleted`, 5xx e transporte sem GET, erro cru sem `context`, id escapado.

`server/providers/asaasPix.test.ts`, describe do fechamento sincrono: o fechamento grava `canceled` com `canceled_at` filtrado por `id` e `status = pending`; o PAYMENT_DELETED posterior sobre a linha ja `canceled` so emite update filtrado por `pending` (no-op no banco), sem RPC, sem Sentry e sem e-mail.

`client/src/components/pro/CancelPendingPixDialog.test.tsx`: aviso do QR, sucesso, `pagamento_ja_recebido`, `sem_cobranca_pendente`, falha generica (sem `onResolved`, dialog aberto), erro de rede, Voltar sem chamada.

## Diff por arquivo

Commits do lote, sobre `869c8c31` (correcao das bombas-relogio, abaixo):

- `f5287c61` feat(asaas): add pending pix charge cancellation with status fallback
- `a0388ab1` feat(billing): add endpoint for customer to cancel pending pix charge
- `ca505a1e` feat(checkout): let customer cancel pending pix charge from profile and modal

`git diff --stat main..ca505a1e` (inclui os dois arquivos de teste do `869c8c31`):

```
 .../components/pro/CancelPendingPixDialog.test.tsx | 137 ++++++++++++++
 .../src/components/pro/CancelPendingPixDialog.tsx  | 133 +++++++++++++
 client/src/components/pro/PixCheckoutModal.tsx     |  42 +++++
 client/src/pages/Checkout.tsx                      |   6 +
 client/src/pages/Perfil.tsx                        |  24 ++-
 client/src/pages/Renovar.test.tsx                  |  10 +
 client/src/services/subscriptionService.ts         |  16 ++
 server/providers/asaas.ts                          |  92 ++++++++-
 server/providers/asaasPix.test.ts                  | 205 ++++++++++++++++++++
 server/routes/adminPaginacao.test.ts               |  10 +
 server/routes/billing.ts                           | 104 +++++++++++
 server/routes/billingCancelPending.test.ts         | 208 +++++++++++++++++++++
 12 files changed, 984 insertions(+), 3 deletions(-)
```

`server/providers/asaas.ts`: `cancelPayment` novo, `closePendingCharge` exportada (corpo intocado), `deleted` em `PagamentoDoAsaas` (dois `toEqual` de `lerPagamento` ganharam `deleted: false`). O duble de `asaasPix.test.ts` ganhou erro por metodo HTTP e grava os filtros de update.

## Diffs vazios exigidos

`git diff main..ca505a1e`: `server/routes/webhooksAsaas.ts` 0 linhas, `server/providers/shared.ts` 0 linhas, `supabase/migrations` 0 arquivos, `EXPECTED_` 0 ocorrencias no diff de `scripts/checkMigrationsApplied.mts`.

## Evidencias

- Pre-commit completo verde nos tres commits (suite + suite sem `.env` sobre o indice + `pnpm check` + `check:limiares`). Ultimo: 5378 passados, 18 pulados, nas duas rodadas.
- `pnpm check` (`tsc --noEmit`) verde na arvore ISOLADA de cada commit (`git archive` de `f5287c61`, `a0388ab1` e `ca505a1e`), porque o hook roda o `tsc` sobre o working tree e nao provaria o commit sozinho.
- Scanner de travessao (Python, bytes U+2013 e U+2014) sobre os 13 arquivos do diff e este relatorio: 0 achados.
- Prettier: os arquivos tocados passam; os que ja passavam em `HEAD` continuam passando.

## Strings novas com TODO(Ana)

- Dialog, titulo (sr-only): "Cancelar cobrança Pix"
- Dialog, pergunta: "Cancelar esta cobrança?"
- Dialog, aviso: "O código Pix atual deixa de valer. Depois disso, você pode escolher outro plano."
- Dialog, botoes: "Voltar", "Cancelar cobrança", "Cancelando..."
- Toast de sucesso: "Cobrança cancelada. Você já pode escolher outro plano."
- Toast de ja pago: "Esse Pix já foi pago. Seu acesso Pro está sendo liberado."
- Toast de ja nao pendente: "Essa cobrança não está mais pendente."
- Toast de falha: "Não foi possível cancelar agora. Tente de novo em instantes."
- Perfil, botao do bloco pendente: "Cancelar cobrança"
- Modal, acao secundaria: "Cancelar e escolher outro plano"

## Bombas-relogio na main (branch separada)

Dois testes da `main` passaram a falhar por data, reproduzido na `main` limpa (`f050d76a`) e barrando o pre-commit e o CI de qualquer branch:

- `client/src/pages/Renovar.test.tsx`: `dueDate: "2026-09-08"` fixo; desde entao o modal abre em "expirado" e o QR nao renderiza.
- `server/routes/adminPaginacao.test.ts`, "cada card decide o Δ pela SUA série": a janela 30 vs 30 comeca 60 dias atras e alcancou 2026-07-13 em 2026-09-11.

Corrigidos fixando so `Date` (`vi.useFakeTimers({ toFake: ["Date"] })`) no commit `869c8c31` da branch `test/fix-date-bombs`, com pre-commit verde (5345 passados nas duas rodadas) e CI verde (run 34662813793). Precisa ir para a `main` antes deste lote, que esta em cima dele.

## Backlog registrado

- **Auditoria de quem cancelou** (fora do escopo): coluna na linha para distinguir cancelamento pelo cliente, pelo webhook e pelo painel, na opcao C do valor persistido, na mesma migration futura. Hoje o rastro e o `raw_provider_payload` sintetico (`event: "CANCELAMENTO_PELO_CLIENTE"`) e o log `[billing/cancel-pending]`.
- **Exclusao de conta nao cancela Pix pendente no Asaas** (caso `pay_iexu7etlbfpp6qkw` da triagem).
- **`.env` local com dois `ASAAS_API_KEY` diferentes** (linhas 14 e 67, ambos de producao; vale o ultimo).

## Verificacao em producao

Roteiro de smoke do pedido do lote (cupom de teste novo com `max_redemptions` 2, desativar ao final): cancelar pelo Perfil, cancelar pelo modal, medir DELETE aceito, `canceled_at`, PAYMENT_DELETED no-op e checkout liberado, e registrar o corpo real do DELETE, que fecha o Passo 0.d.
