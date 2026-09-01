HEAD_FINAL: cb0c003a

# Lote 2n: confetti na confirmacao do Pix

Branch `pix/lote2n`, a partir de `main` em `3f10a22d`. Um commit. **Sem push**: o
deploy aguarda o gate da Ana.

## Passo 0

**a. Onde vive o efeito.** `canvas-confetti` (ja em `package.json`, `^1.9.4`,
com `@types` correspondente), encapsulado em `client/src/lib/proConfetti.ts`, que
exporta `fireProCelebration(origin)`. Faz um burst inicial de 90 particulas no
ponto de origem e depois um ciclo de ~2s alternando bursts espalhados e canhoes
dos cantos inferiores a cada 240ms. Devolve um `stop()` que limpa o intervalo.
Paleta fixa: `#FFB800`, `#1a1a1a`, `#ffffff`, `#10b981`.

**b. Reutilizavel?** Sim, sem nenhum acoplamento. **Zero linhas extraidas.** Ja e
modulo compartilhado, consumido por cinco lugares: `CheckoutSucesso`,
`RoadmapCompletionModal`, `RoadmapTrail`, `CertificateBlock` e `RoadmapQuiz`. Foi
so importar.

E vale registrar o que o Passo 0 revelou: **`CheckoutSucesso.tsx` ja dispara o
confetti**. Ou seja, quem pagava com cartao ou boleto era celebrado e quem pagava
com Pix nao. Este lote nao adiciona um efeito novo, fecha uma assimetria que o
Pix nativo criou sem querer.

**c. A transicao de sucesso.** `PixCheckoutModal.tsx`, dentro do efeito de
polling: `if (decisao.action === "confirmed") setFase({ nome: "confirmado" })`.

**Acessibilidade.** O cabecalho do `proConfetti.ts` diz que
`prefers-reduced-motion` e responsabilidade de quem chama. Conferi os cinco
chamadores: **todos ja respeitam**. Nao houve correcao de acessibilidade a fazer,
e o guard novo herda a mesma regra.

Nenhum dos dois PARE do lote disparou: zero linhas a extrair (limite era ~30) e
nenhuma dependencia nova (`package.json` e `pnpm-lock.yaml` intocados).

## O que mudou

**`client/src/lib/celebration.ts`** (novo, 28 linhas): `shouldFireCelebration`,
funcao pura com as tres condicoes. Extraida porque as tres falham em SILENCIO: um
disparo repetido nao quebra nada visivelmente, um confete que ignora
`prefers-reduced-motion` e um problema que quem escreve o codigo normalmente nao
ve, e um disparo que nunca acontece parece "nao funciona nesta maquina".

A funcao NAO marca nada; quem chama e dono do `alreadyFired`. Manter a marcacao
fora dela e o que a deixa pura e testavel sem relogio nem estado global, e um dos
testes trava isso: chamar duas vezes com a mesma entrada devolve o mesmo.

**`client/src/components/pro/PixCheckoutModal.tsx`**: um `useEffect` espelhando
`CheckoutSucesso.tsx:111-124`, com `useRef` de disparo unico, `useReducedMotion`
do framer-motion, e o `stop()` devolvido como cleanup do efeito (o ciclo dura ~2s
e o modal pode desmontar antes). A origem do burst sai do
`getBoundingClientRect()` do bloco de confirmacao, com o centro da tela como
palpite quando o rect ainda nao existe.

Nenhuma string nova. Nenhuma mudanca de layout: a unica alteracao no JSX e um
`ref` no `div` que ja existia.

## Caminho do dinheiro: diff vazio

```
server/providers/asaas.ts        DIFF VAZIO
server/routes/webhooksAsaas.ts   DIFF VAZIO
server/providers/shared.ts       DIFF VAZIO
server/routes/billing.ts         DIFF VAZIO
client/src/lib/pixPolling.ts     DIFF VAZIO
package.json / pnpm-lock.yaml    intocados
```

## Evidencias

```
pnpm check                 EXIT 0
suite completa             3531 passaram, 10 pulados, 266 arquivos
  (3524 antes: +7, todos do guard)
celebration.test.ts        7 testes
travessao (Python)         0
prettier                   conforme
pre-commit                 verde (suite, suite sem .env, tsc, limiares)
```

## Diff

```
client/src/components/pro/PixCheckoutModal.tsx  +41 -1
client/src/lib/celebration.test.ts              +57
client/src/lib/celebration.ts                   +28
```

## Verificacao visual: o que deu e o que nao deu

`pnpm build` EXIT 0. O confetti e code-split em
`assets/proConfetti-D-8B6i0n.js` mais `assets/confetti.module-oQXWb4Lk.js`, e o
chunk do Checkout (`Checkout-D6W23FNB.js`) passou a referencia-lo, exatamente
como o `CheckoutSucesso-DNxjyrtO.js` ja fazia. A simetria entre os caminhos de
compra esta no bundle.

**Nao consegui ver o efeito rodando.** O estado de sucesso do modal so aparece
depois de um pagamento Pix real confirmado pelo webhook, e nao ha como forcar
esse estado no preview sem mudar codigo, o que seria escopo alem do pedido. Entao
o que existe e a prova de que o codigo certo esta no lugar certo, nao a prova
visual do efeito. A verificacao visual fica para o proximo smoke com pagamento
real, ou para a Ana se ela encontrar um caminho de forcar o estado.

Registro honesto porque o mesmo limite ja apareceu no 2m e vale a mesma regra:
inspecao de markup e de bundle nao e verificacao de comportamento.
