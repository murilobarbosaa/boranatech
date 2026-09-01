HEAD_FINAL: 6544340f5b76e5089431028ddfb5290dffe7c940

Worktree: /home/s0ft/bnt-asaas | Branch: pix/lote2a | Base: origin/main @ 8b219a6e114790b0d0ec939a29012a168e851e65

Dois commits novos (dezenove na branch). Nenhuma migration. Nenhum push, nenhum merge.

---

## Tarefa 1: backend

### 1.1 O endpoint, e por que ele nao tem parametro

`GET /api/billing/pix-qrcode` (`server/routes/billing.ts`), autenticado por `requireAuth`.

**A autorizacao e POR CONSTRUCAO, nao por checagem.** A rota nao aceita id nenhum: ela resolve a
cobranca a partir de `req.user.id`, filtrando `provider='asaas'`, `payment_method='pix'` e
`status='pending'`. Nao existe o caso "id de outra pessoa", entao **nao existe checagem de dono para
alguem esquecer de escrever**. E o mesmo principio de "protecao dentro da funcao, nunca no call
site" que o CLAUDE.md registra, aplicado ao desenho da URL.

Um id de pagamento numa URL do cliente seria enumeravel e teria de ser defendido a cada requisicao.
Este desenho nao tem o que defender.

Sem Pix pendente: **404 `pix_pendente_ausente`**, nomeado, porque nao ter cobranca aberta e o estado
normal de quem nao esta comprando, nao um erro.

### 1.2 O proxy, e a resposta 200 incompleta

`fetchPixQrCode(chargeId)` em `server/providers/asaas.ts` chama
`GET /v3/payments/{id}/pixQrCode` e devolve `{ encodedImage, payload, expirationDate }`.

`asaasFetch` ja traduz falha de transporte (`asaas_unreachable`) e recusa do provedor
(`asaas_error`) sem vazar corpo bruto. O que faltava era o terceiro caso: **resposta 200 sem os
campos que interessam**. Sem nome proprio, ela viraria "erro de rede" na investigacao. Agora e
`502 pix_qrcode_indisponivel`.

`expirationDate` ausente vira `null` explicito, nao some do contrato: quem consome nao precisa
distinguir "nao veio" de "nao existe o campo".

O id vai **escapado** na URL (`encodeURIComponent`), com teste afirmando o escape.

### 1.3 Resposta do checkout: expand, nada removido

`CreateCheckoutResult` ganhou `flow?: "redirect" | "native_pix"`, **ADITIVO**:

```ts
checkoutUrl: string | undefined;  // MANTIDO
subscriptionId: string;
flow?: "redirect" | "native_pix";  // novo, opcional
```

Ausente significa "redirecione", que e exatamente o que o bundle antigo ja faz com `checkoutUrl`.
O Pix devolve `native_pix` e **continua devolvendo `invoiceUrl`** como fallback. Nada foi removido
neste lote, pela regra de expand/contract: bundle ja em execucao le o nome velho e nao recarrega
sozinho.

**O QR NAO viaja na resposta do checkout.** Ele vem pelo endpoint proprio, porque isso mantem o id da
cobranca fora do cliente e permite reabrir a tela depois sem refazer o checkout.

---

## Tarefa 2: frontend

### 2.1 e 2.2 O bloco do QR, e a hierarquia por dispositivo

`client/src/components/pro/PixQrCodeBlock.tsx`, montado no cenario A da tela de cobranca
(`Perfil.tsx`, primeira compra aguardando pagamento) quando o meio e Pix.

**A hierarquia e feita com a ORDEM DO FLEX, nao com dois blocos condicionais:**

```
flex flex-col-reverse   (mobile: copia-e-cola primeiro)
sm:flex-col             (desktop: QR primeiro)
```

Um markup so. Dois blocos por breakpoint divergiriam na primeira correcao, e o custo de manter os
dois em sincronia recairia sobre quem mexesse na copy.

**A razao da inversao e pratica:** ninguem escaneia um QR exibido na propria tela do celular. No
mobile o copia-e-cola lidera e o QR fica embaixo, para quem tem um segundo aparelho; no desktop o
telefone e o leitor natural e o QR lidera.

Botao de copiar com feedback de "Copiado!" por 2s. **Clipboard bloqueado nao derruba o bloco**
(contexto inseguro ou permissao negada): o codigo segue visivel e selecionavel na tela, entao a
pessoa nunca fica sem caminho.

Tokens e formas da plataforma: borda `slate-950`, sombra flat `shadow-[3px_3px_0_#0f172a]`, acento
`#FFB800`, `bnt-pressable`, `font-display`. **Nenhuma dependencia nova, nada de `components/ui`**
(os icones sao `lucide-react`, ja usado no repo).

### 2.3 Confirmacao automatica

Polling em `Perfil.tsx`, ativo **somente** enquanto ha Pix pendente e a pessoa ainda nao e Pro.
Reconsulta `refreshSubscription({ silent: true })` (o `silent` evita piscar o card de carregamento a
cada ciclo), e quando o webhook ativa, a tela transiciona sozinha, sem recarregar.

**A regra de parada vive fora do componente**, em `client/src/lib/pixPolling.ts`, e a razao esta
escrita la: as duas maneiras de errar aqui sao INVISIVEIS na tela. Um polling que nunca para vira
requisicao infinita numa aba esquecida; um que para cedo demais deixa a tela dizendo que o pagamento
nao chegou depois de ele ter chegado. Nenhuma das duas produz sintoma visual, entao nenhuma seria
pega por inspecao. No componente ficou so o `setTimeout`, que e encanamento.

Intervalo 4s, teto 10 minutos. **Confirmacao vence timeout**, e a ordem das checagens e deliberada:
se o timeout viesse primeiro, quem pagasse no ultimo instante veria "expirou" depois de ter pago.

Nao inventei celebracao: a transicao usa o card de assinatura ativa que a tela ja renderiza quando
`isPro` vira true.

### 2.4 Estados de borda, todos nomeados

| Estado | Tratamento |
| --- | --- |
| carregando o QR | mensagem propria |
| falha ao carregar | card com o motivo mais o fallback "Abrir a fatura para pagar", quando ha `invoiceUrl` |
| fallback discreto no caminho feliz | link "Preferir a fatura do provedor", pequeno, abaixo do QR |
| `valor_minimo_pix` | **toast proprio no Checkout, matando a lacuna declarada no Lote 2g** |

**Cobranca expirada nao ganhou tratamento proprio, e declaro.** O caminho existe no backend
(`PAYMENT_OVERDUE` e `PAYMENT_DELETED` encerram a linha), e o efeito na tela hoje e o card de
pendencia sumir, porque `pendingCharge` zera. O que falta e a mensagem explicita "esta cobranca
expirou, gere outra". Nao ha estado no frontend que distinga "expirou" de "nunca existiu", e criar um
exigiria o backend informar o motivo do encerramento, o que este lote nao pede.

---

## Tarefa 3: testes

**12 casos novos**: 5 em `server/providers/asaasPix.test.ts` (de 59 para 64) e 7 em
`client/src/lib/pixPolling.test.ts` (arquivo novo).

| Grupo | Casos |
| --- | --- |
| QR no backend | `flow=native_pix` **E `invoiceUrl` mantido** (expand provado); devolve os tres campos; `expirationDate` ausente vira null; **200 incompleta vira erro nomeado**; id escapado na URL |
| regra de parada | confirmado para; dentro do prazo espera; no teto para por timeout; **um ms antes ainda tenta** (fronteira); **confirmado E estourado reporta CONFIRMADO** |
| plausibilidade dos numeros | intervalo na faixa de segundos; teto maior que um Pix e menor que o prazo do QR |

**O teste do endpoint HTTP nao foi escrito, e a razao e concreta.** O handler nao esta exportado e
`server/routes/billing.ts` so tem o seam de `handleGetSubscription`, criado no Lote 2e. Exportar um
segundo handler para cobrir uma rota de quatro linhas cujo unico comportamento nao trivial
(`fetchPixQrCode`) **ja esta coberto** seria seam por seam, nao por necessidade. O que fica sem prova
automatizada e a fiacao entre a consulta e o proxy, que o `tsc` cobre em tipo e a Etapa 3 do 2d-prod
cobre em comportamento.

**A lacuna de teste de componente segue declarada**, como nos lotes anteriores: nao ha harness de
render para `Perfil.tsx` neste repo. A prova visual do QR, da hierarquia por dispositivo e da
transicao automatica e a retomada do 2d-prod.

---

## Strings TODO(Ana)

Nove marcadores novos.

| Arquivo | Contexto | Texto |
| --- | --- | --- |
| `PixQrCodeBlock.tsx` | carregando | `Gerando seu código Pix...` |
| `PixQrCodeBlock.tsx` | falha ao gerar | `Não foi possível gerar o código agora.` |
| `PixQrCodeBlock.tsx` | fallback no erro | `Abrir a fatura para pagar` |
| `PixQrCodeBlock.tsx` | rotulo do copia-e-cola | `Pix copia e cola` |
| `PixQrCodeBlock.tsx` | botao de copiar | `Copiar código` / `Copiado!` |
| `PixQrCodeBlock.tsx` | rotulo do QR | `Escaneie no app do banco` |
| `PixQrCodeBlock.tsx` | fallback discreto | `Preferir a fatura do provedor` |
| `Checkout.tsx` | toast do valor minimo | `Com esse desconto o valor fica abaixo do mínimo do Pix. Escolha cartão.` |

Mais as ja registradas nos lotes 2c, 2f e 2g, ainda pendentes no mesmo sweep.

**O ponto editorial que atravessa este lote:** os dois rotulos de prazo (`vence em 2 dias` do QR e
`alguns segundos` da confirmacao) falam de coisas DIFERENTES, e a copy precisa deixar claro qual e
qual. O QR vence em 2 dias; a confirmacao leva segundos. Trocar os dois faria a pessoa achar que o
dinheiro leva 2 dias para cair.

---

## Saidas das baterias

```
$ pnpm check           -> EXIT=0
$ pnpm test            -> EXIT=0
   Test Files  244 passed | 3 skipped (247)
        Tests  3229 passed | 10 skipped (3239)
$ pnpm check:limiares  -> EXIT=0
```

Eram 3217 ao fim do Lote 2g; 3229 agora.

## Conferencia

Dez arquivos do lote, todos em `U+2014=0 U+2013=0`. **TOTAL: 0.**

Varredura de segredo: **ACHADOS: nenhum**.

## Commits

| Hash | Mensagem | Arquivos |
| --- | --- | --- |
| `36dcda89` | `feat(pix): serve pix qrcode from own endpoint scoped to the owner` | `types.ts`, `asaas.ts`, `billing.ts`, `asaasPix.test.ts` |
| `6544340f` | `feat(pix): render native qrcode and confirm payment without reload` | `pixPolling.ts`, `pixPolling.test.ts`, `PixQrCodeBlock.tsx`, `subscriptionService.ts`, `Checkout.tsx`, `Perfil.tsx` |

`server/lib/asaasClient.ts` **nao precisou mudar**: `asaasFetch` ja fazia GET autenticado com timeout
e traducao de erro, entao a chamada do `pixQrCode` coube sem alteracao no cliente HTTP.

Staging por nome explicito, `git diff --cached --name-only` conferido antes de cada um, pathspec no
commit. Pre-commit verde nos dois. **Nenhum push, nenhum merge.**

## O 2d-prod

**Retoma da Etapa 3 com backend E frontend reiniciados** nesta branch (`6544340f`). O frontend
importa: o redirecionamento para a fatura saiu do caminho do Pix, e um bundle antigo continuaria
mandando a pessoa para o Asaas.

**A Etapa 3 passa a incluir, alem do que ja tinha:**

1. a tela nativa exibe o QR e o copia-e-cola, com a identidade da plataforma;
2. o pagamento e feito **pelo copia-e-cola**, nao pela fatura hospedada;
3. **a tela confirma SOZINHA em poucos segundos apos o webhook, sem recarregar**;
4. o roteiro de cupom do Lote 2g continua obrigatorio (valor descontado na cobranca, `times_redeemed`
   subindo exatamente um, reentrega nao duplicando).

O item 3 e o unico que nenhum teste alcanca: ele depende do webhook real chegando ao tunel enquanto a
tela esta aberta.

Nada mudou no webhook (rota, token, formato), entao o registrado na Etapa 2 **continua valendo**. O
`DELETE /v3/webhooks/{id}` da Etapa 6.1 segue obrigatorio ao fim; nao tenho o id porque nao fui eu
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
```
