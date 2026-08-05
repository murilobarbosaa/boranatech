# Como confirmar que um deploy chegou

**Escrito em 2026-07-31**, depois de o instrumento que vinha sendo usado há dez deploys falhar pela primeira vez — e falhar dizendo "não mudou" sobre um deploy que tinha acontecido.

## Passo 0: o worktree de deploy tem de estar atual

```bash
git -C /home/s0ft/bnt-main fetch origin
git -C /home/s0ft/bnt-main merge --ff-only origin/main
```

**Antes de qualquer `cherry-pick` ou `push` ali.** Em 2026-08-01 o `bnt-main` foi encontrado **4 commits
atrás** da `main` do servidor, por leitura manual. A operação principal daquele worktree é `cherry-pick`, que
partiria de base velha sem nada avisar: nem o git, nem o CI, nem o hook. O worktree existe para eliminar a
disputa de checkout, e trocou por um modo de errar mais silencioso.

## O procedimento

### 1. Sinal primário: a release do Sentry com `dateFinished`

```bash
set -a && . ./.env && set +a
FULL=$(git rev-parse <sha>)
curl -s -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
  "https://sentry.io/api/0/organizations/$SENTRY_ORG_SLUG/releases/$FULL/" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); ld=d.get('lastDeploy') or {}; print(ld.get('environment'), ld.get('dateFinished'))"
```

Saída esperada: `vercel-production 2026-07-31T07:18:22Z`.

**É o único que declara o instante em que terminou.** Só ele responde "já acabou?" — todos os outros respondem "como está agora", e "agora" pode ser antes.

#### Mas NÃO leia `lastDeploy`: leia a lista e procure o ambiente

**Corrigido em 2026-08-05.** O `lastDeploy` é o deploy MAIS RECENTE, e o mais recente frequentemente não é o de produção: o preview termina antes. Medido naquele dia, o mesmo release respondia

```
lastDeploy = vercel-preview      02:09:36Z     <- terminou primeiro
             vercel-production   02:12:29Z     <- o que interessa, 3 min depois
```

Ler `lastDeploy` na primeira amostra devolve `vercel-preview` e conclui "produção não chegou" sobre um deploy que estava a caminho. É a mesma família da release amostrada às 20:07 com o Railway terminando às 20:10, com o sujeito trocado em vez do instante: o valor está certo e descreve outro objeto.

```bash
curl -s -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
  "https://sentry.io/api/0/organizations/$SENTRY_ORG_SLUG/releases/$FULL/deploys/" \
  | python3 -c "import sys,json; print(' | '.join(f\"{x['environment']}={x['dateFinished']}\" for x in json.load(sys.stdin)))"
```

E confira o **ambiente pelo nome**, não a posição na lista.

### 1-bis. O CI verde morre junto com o SHA

**Acrescentado em 2026-08-05.** A política manda subir só com CI verde. Se entre a medição e o push houver
`rebase`, `amend` ou `squash`, **o verde medido se refere a um commit que não existe mais**. Aconteceu com duas
branches autorizadas no mesmo lote: a primeira subiu, a segunda ficou 1 atrás, o rebase trocou `d6ee466` por
`b916bec`, e o verde de `d6ee466` deixou de significar qualquer coisa sobre o que seria empurrado.

**Meça o CI DEPOIS da última operação que altera SHA**, e compare o `head_sha` do run com o `HEAD` da branch
antes de empurrar. Guardar "CI verde" sem o SHA é guardar um valor sem o sujeito dele.

### 2. Backend: `uptime` do `/api/health`, amostra única

```bash
curl -s https://api.boranatech.com.br/api/health | python3 -c "import sys,json; print(json.load(sys.stdin)['uptime'])"
```

Valor baixo (segundos, não horas) significa que o Railway reiniciou. **Nunca medir por frequência** (ver `CLAUDE.md`, o loop de 150 requisições que disparou a mitigação da Vercel).

### 3. Frontend: o hash do bundle é SECUNDÁRIO, e tem dois pontos cegos

```bash
curl -s https://boranatech.com.br/ | grep -oE '/assets/index-[A-Za-z0-9._-]+\.js' | head -1
```

Serve, **desde que** você compare com uma amostra colhida ANTES do push. Sem linha de base, "o hash é X" não é informação.

**Ponto cego 1: o entry não muda quando só chunk lazy muda.** As rotas são carregadas sob demanda (`LinkedinAnalisar`, `CurriculoAnalisar`, `PortfolioAnalisar`, `Admin`). Uma mudança inteiramente dentro de uma delas não altera o conteúdo do entry, e o hash sai idêntico. **Aconteceu em `e0c285d`**: o commit tocou quatro componentes de rota, o entry ficou igual, e a leitura ingênua foi "o deploy não chegou".

**Ponto cego 2: pedir o arquivo antigo responde 200.** O `vercel.json` tem catch-all rewrite para `/index.html`, então um asset que não existe mais devolve **HTTP 200 com o HTML da SPA** (~4 KB), não 404. Conferir por status code conclui que o arquivo antigo ainda está lá.

```bash
# errado:  curl -o /dev/null -w "%{http_code}" .../assets/index-ANTIGO.js   -> 200, sempre
# certo:   comparar o TAMANHO, ou o conteúdo
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" https://boranatech.com.br/assets/index-ANTIGO.js
# 200 4341  -> é o index.html do catch-all, o arquivo sumiu
```

### 4. Confirmar um chunk lazy especificamente, por CONTEÚDO

Quando a mudança está numa rota lazy, o entry não ajuda. O caminho que funcionou:

1. Escolher uma string nova e distintiva do commit, de preferência copy visível (sobrevive à minificação; nome de função não).
2. Baixar o entry e achar o nome do chunk da rota, que está no mapa de imports dinâmicos:
   ```bash
   curl -s https://boranatech.com.br/assets/index-<HASH>.js \
     | grep -oE '"assets/LinkedinAnalisar-[A-Za-z0-9_-]+\.js"'
   ```
3. Baixar o chunk e procurar a string:
   ```bash
   curl -s https://boranatech.com.br/assets/LinkedinAnalisar-<HASH>.js | grep -c "confira abaixo"
   ```

Foi assim que se provou que o `eeda681` estava no ar: a copy do `312e759` (`"confira abaixo"`, `"caracteres lidos"`) apareceu no chunk servido, e como `eeda681` é anterior na linhagem, a presença de um implica a do outro.

## Por que este documento existe

Três medições desta série declararam ausência sobre algo que ainda não tinha acontecido:

1. **"A release cobre um projeto só"** — amostrada às 20:07, com o Railway terminando às 20:10. A release passou a cobrir os dois. Não era anomalia, era pressa.
2. **"Zero artefatos, nenhum source map"** — endpoint legado (`/releases/{v}/files/`), que indexa por URL e devolve vazio porque o `sentry-cli` moderno sobe por debug ID. O correto é `/files/artifact-bundles/`, que mostrava 1066 arquivos o tempo todo.
3. **"O bundle não mudou"** — amostrado antes de o Vercel terminar, num commit em que o entry também não mudaria. Dois defeitos ao mesmo tempo, e o segundo teria mascarado o primeiro.

O padrão comum: **a superfície respondeu, e a resposta foi lida como veredito.** Status 200 com corpo errado, endpoint certo com dado de outra época, hash certo de um artefato que não é o que mudou.

**Regra prática:** antes de concluir "não chegou", conferir se o instrumento consegue enxergar essa mudança específica, e se o instante da medição é depois do instante do evento.
