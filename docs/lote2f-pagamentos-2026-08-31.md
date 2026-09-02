HEAD_FINAL: c8f1c51d0aa739a653458cde669c31b27022b9ea

Worktree: /home/s0ft/bnt-asaas | Branch: pix/lote2a | Base: origin/main @ 8b219a6e114790b0d0ec939a29012a168e851e65

Dois commits novos (dezesseis na branch). Nenhuma migration. Nenhum push, nenhum merge.

---

## Tarefa 1: a compensacao existe, e o banco limpo e consistente com ela

**Anchor: `server/providers/asaas.ts:296-312`**, no `catch` que envolve a criacao do cliente e da
cobranca dentro de `createCheckout`:

```ts
} catch (err) {
  const { error: cleanupError } = await supabaseAdmin
    .from("subscriptions")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("id", created.id)
    .eq("status", "pending");
  ...
  throw err;
}
```

**Ja havia teste**, do Lote 2a: "falha no Asaas cancela a linha pendente, para nao travar o guard
409" (`server/providers/asaasPix.test.ts`), que afirma a presenca do UPDATE com `status: "canceled"`.
Nenhum teste novo foi necessario para esta tarefa.

**Uma precisao sobre o fato medido pelo arquiteto.** "Zero linhas `pending`" esta correto e e
esperado, mas **nao significa zero linhas**: a compensacao FLIPA para `canceled`, nao apaga. Cada
tentativa recusada pelo Asaas deixou uma linha `subscriptions` com `provider='asaas'`,
`payment_method='pix'`, `status='canceled'`, `provider_subscription_id NULL`. Elas nao concedem
acesso, nao travam o guard 409 e nao aparecem em metrica de ativa, mas existem e entram na limpeza
pos-Fase 1 junto com o resto.

---

## Tarefa 2: backend

### A guarda de CPF, e por que ela vem primeiro

`server/providers/asaas.ts`, dentro de `createCheckout`, **antes dos dois guards de duplicidade,
antes da row local e antes de qualquer chamada remota**:

```ts
const { data: perfil, error: perfilError } = await supabaseAdmin
  .from("profiles").select("cpf").eq("user_id", input.user.id).maybeSingle();
if (perfilError) { /* fail-closed: 500 db_error, bloqueia */ }
const cpf = String(perfil?.cpf ?? "").replace(/\D/g, "");
if (!isValidCpf(cpf)) {
  throw createError(422, "cpf_obrigatorio", "Informe seu CPF para pagar com Pix.");
}
```

**A ordem e o ponto.** Se a guarda viesse depois da row local, cada tentativa sem CPF deixaria uma
linha para a compensacao limpar, e o guard 409 de Pix pendente travaria a proxima tentativa da mesma
pessoa. Ha teste afirmando zero chamada remota E zero escrita nesse caminho.

**422 e nao 400**: o corpo da requisicao esta correto; o que falta e um pre-requisito do usuario. O
slug e o que a UI usa para abrir a coleta, entao ele e contrato, nao decoracao.

**`isValidCpf` REUSADO, nao reescrito** (`shared/certificates/types.ts`, o mesmo que
`server/routes/me.ts:327` usa). Duas validacoes do mesmo documento divergem, e a que ficar para tras
aceita o que a outra recusa. Ha teste com `11111111111`: onze digitos, invalido, recusado. Uma
checagem por comprimento o aceitaria e o Asaas o recusaria adiante, que e o mesmo defeito com outro
disfarce.

### O documento viajando para o Asaas

`resolveCustomer` passou a receber `cpf` e a fazer duas coisas novas:

1. **Cliente novo** nasce com `cpfCnpj` (so digitos).
2. **Cliente existente** tem o documento comparado por digitos (o Asaas as vezes devolve formatado) e
   **atualizado antes da cobranca** se estiver ausente ou divergente. O motivo esta no comentario: o
   cliente pode ter sido criado antes de o documento ser exigido, ou a pessoa pode ter corrigido o
   CPF no perfil depois; nos dois casos a cobranca seria recusada e o sintoma pareceria falha de
   pagamento em vez de dado desatualizado. Ha teste afirmando a ORDEM (update antes da cobranca) e
   outro afirmando que documento igual NAO gera update a toa.

### O CPF nao vaza

**Ele nao entra em nenhuma mensagem de erro, log cru ou contexto de Sentry.** Verificado por
varredura: zero ocorrencias de `cpf` em `console.*`, `createError` ou blocos `extra:` do arquivo.

`maskCpf(digits)` foi criada para o caso em que ele precisasse aparecer, e recebeu **um sitio real**
em vez de virar codigo morto: o log da MUTACAO do documento de um cliente remoto
(`documento do cliente cus_X atualizado para 529.***.**25`). Mutar objeto no provedor e o tipo de
efeito que nao pode acontecer em silencio, e a mascara mostra o bastante para casar com a linha do
banco numa investigacao e insuficiente para reconstruir o documento. Ha teste afirmando as duas
metades.

---

## Tarefa 3: frontend

### Uma leitura do item 3.1 que precisa ficar explicita

O item pede "se o perfil nao tem CPF, apresentar passo minimo ANTES de chamar o checkout". **O
cliente nao tem como saber isso.** O `GET /api/me` nao devolve `cpf`, e o `CertificateBlock`, que e o
outro fluxo que precisa do documento, tambem nao le: ele recebe do servidor a lista do que falta.

Implementar a checagem no cliente exigiria expor o CPF (ou sua validade) ao frontend, criando uma
**segunda fonte de verdade** sobre a validade do documento, que divergiria da do servidor na primeira
correcao de regra. Entao:

**O 422 E a checagem.** O fluxo tenta o checkout; ao receber `cpf_obrigatorio`, abre a coleta; ao
salvar, retoma o checkout **na mesma interacao**, sem obrigar a pessoa a escolher o metodo de novo.
Isso satisfaz o efeito que o item 3.1 descreve (coleta e prossegue sem sair do fluxo) e o item 3.2 ao
mesmo tempo, com o servidor como unica autoridade. Custo: uma requisicao a mais no caminho em que
falta o dado.

### Reuso do passo de coleta, sem modal novo

`CompleteProfileModal` (`client/src/components/certificates/`) ja coleta CPF e nome completo, com
mascara de digitacao, validacao de digito verificador e o mesmo `PATCH /api/me`. Reusei em vez de
criar outro, como o item 3.1 manda.

**Foi preciso parametrizar duas frases**, e a mudanca e ADITIVA: `titulo` e `motivo` viraram props
OPCIONAIS com o default do certificado, entao `CertificateBlock` **nao muda uma linha**. Duplicar o
modal para trocar duas frases criaria duas mascaras de CPF e duas validacoes de nome que
divergiriam na primeira correcao.

**Nota de escopo:** `client/src/components/certificates/CompleteProfileModal.tsx` nao esta na lista
de arquivos permitidos ("componentes do fluxo Pix do 2c"). Toquei porque o proprio item 3.1 manda
reusar o que existe, e reusar exigia as duas props. A alternativa era o modal novo que o item proibe.

**Cartao intocado**: a coleta so e acionada pelo `cpf_obrigatorio`, que so o provedor Asaas emite.

---

## Tarefa 4: testes

**11 casos novos** em `server/providers/asaasPix.test.ts` (de 35 para 46).

| Grupo | Casos |
| --- | --- |
| CPF e pre-requisito | 422 nomeado; **zero chamada remota e zero row local**; CPF invalido conta como ausente; CPF com mascara no banco e aceito |
| documento viaja | cliente novo nasce com `cpfCnpj`; cliente existente divergente e atualizado ANTES da cobranca; documento igual nao gera update |
| CPF nao vaza | `maskCpf` mostra o bastante para casar e nada para reconstruir; nenhuma captura de Sentry do fluxo carrega o documento |

O dube ganhou `profiles.cpf`; sem isso todos os 35 casos anteriores passariam a dar 422, e eles
continuam verdes com o CPF de teste.

**Frontend sem teste automatizado, declarado.** Nao ha teste de componente cobrindo `Checkout.tsx`
neste repo (o diretorio `client/src/components/certificates` nao tem `.test.tsx` nenhum), e criar
harness de render para o fluxo inteiro esta fora do que este lote pede. O que fica coberto por
`tsc` e o contrato de props; o que fica sem prova automatizada e a sequencia "422 abre a coleta,
salvar retoma o checkout", que precisa ser exercitada no retorno do 2d-prod.

**CPFs usados nos testes**, para constar: `52998224725` (valido, o exemplo classico de documentacao),
`11111111111` (invalido por construcao) e `00000000000` (placeholder do dube para o cliente
divergente). **Nenhum e de pessoa real.**

---

## Strings TODO(Ana)

Quatro marcadores. Os dois primeiros sao novos deste lote; os dois ultimos existiam no modal e
viraram valores default ao serem parametrizados, mantendo o marcador.

| Arquivo:linha | Contexto | Texto |
| --- | --- | --- |
| `client/src/pages/Checkout.tsx` (props do CompleteProfileModal) | titulo do passo de CPF no Pix | `Falta o seu CPF` |
| `client/src/pages/Checkout.tsx` (idem) | **razao visivel de por que pedimos CPF** | `O Pix exige o CPF do pagador para gerar a cobrança. Ele fica só no seu cadastro.` |
| `client/src/components/certificates/CompleteProfileModal.tsx` (default) | titulo, fluxo de certificado | `Falta um passo para o seu certificado` |
| `client/src/components/certificates/CompleteProfileModal.tsx` (default) | razao, fluxo de certificado | `O CPF consta no certificado e é o que permite a validação por faculdades e empresas.` |

A segunda linha e a exigida pelo item 3.3: diz que o pedido vem do meio de pagamento, e que o dado
nao sai do cadastro.

A mensagem do 422 (`Informe seu CPF para pagar com Pix.`) e de API e hoje nao e renderizada: a UI
trata o slug abrindo a coleta, nao exibindo o texto. Entra no sweep junto das demais mensagens de
erro do provedor.

---

## Saidas das baterias

```
$ pnpm check           -> EXIT=0
$ pnpm test            -> EXIT=0
   Test Files  243 passed | 3 skipped (246)
        Tests  3204 passed | 10 skipped (3214)
$ pnpm check:limiares  -> EXIT=0
```

Eram 3195 ao fim do Lote 2e; 3204 agora. `pnpm check:scripts` nao foi exigido: nada em `scripts/`.

## Conferencia

```
client/src/components/certificates/CompleteProfileModal.tsx  U+2014=0 U+2013=0
client/src/pages/Checkout.tsx                                U+2014=0 U+2013=0
server/providers/asaas.ts                                    U+2014=0 U+2013=0
server/providers/asaasPix.test.ts                            U+2014=0 U+2013=0
TOTAL: 0
```

Varredura de segredo nos arquivos do lote: 4 segredos com valor utilizavel procurados, **ACHADOS:
nenhum**. Varredura de sequencias de 11 digitos: as tres encontradas sao os fixtures acima.

## Commits

| Hash | Mensagem | Arquivos |
| --- | --- | --- |
| `f86baf57` | `fix(pix): require and send payer cpf when creating asaas charge` | `asaas.ts`, `asaasPix.test.ts` |
| `c8f1c51d` | `feat(pix): collect cpf in checkout flow before creating charge` | `CompleteProfileModal.tsx`, `Checkout.tsx` |

Staging por nome explicito, `git diff --cached --name-only` conferido antes de cada um, pathspec no
commit. Pre-commit verde nos dois. **Nenhum push, nenhum merge.**

## O 2d-prod pode retomar da Etapa 3

**Sim, com duas condicoes.**

1. **Backend local reiniciado nesta branch** (`c8f1c51d`). O processo que estava de pe carrega o
   codigo sem a guarda de CPF; sem reiniciar, a Etapa 3 repete o mesmo `invalid_object`.
2. **A conta de teste interna precisa ter CPF valido em `profiles.cpf`.** Se nao tiver, o fluxo agora
   pede na tela em vez de falhar (que e a correcao), entao isto nao bloqueia: e so seguir o passo.

Nao ha mudanca no webhook: a rota, o token e o formato do evento sao os mesmos, entao o webhook
registrado na Etapa 2 continua valendo e **nao precisa ser recriado**.

Lembrete que independe deste lote: se um webhook de producao foi criado apontando para um tunel, ele
continua ativo. Webhook de producao para URL morta faz evento real de cliente falhar em fila, e a
fila do Asaas pausa a conta inteira depois de uma sequencia de falhas. A Etapa 6.1 (`DELETE
/v3/webhooks/{id}`) segue obrigatoria ao fim do 2d-prod, e eu nao tenho o id porque nao fui eu que o
criei.

## git status --porcelain final

```
?? lote2a-pagamentos-2026-08-29.md
?? lote2b-pagamentos-2026-08-29.md
?? lote2c-pagamentos-2026-08-29.md
?? lote2e-pagamentos-2026-08-30.md
?? lote2f-pagamentos-2026-08-31.md
```
