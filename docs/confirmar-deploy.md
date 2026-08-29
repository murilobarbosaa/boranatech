# Como confirmar que um deploy chegou

**Escrito em 2026-07-31**, depois de o instrumento que vinha sendo usado há dez deploys falhar pela primeira vez, e falhar dizendo "não mudou" sobre um deploy que tinha acontecido.

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

### 1. Sinal primário DA VERCEL: a release do Sentry com `dateFinished`

**ESTE PASSO NÃO ENXERGA O RAILWAY.** Corrigido em 2026-08-18, e a correção é o contrário
do que este documento afirmava antes: o backend **nunca** registrou deploy neste endpoint.
Medido no dia, sobre quatro releases de datas diferentes, todas trazem exatamente os mesmos
dois ambientes e nenhum do Railway:

```
eb032d66  vercel-production 2026-08-18T18:11:19Z | vercel-preview 2026-08-18T18:07:51Z
b8084fbf  vercel-production 2026-08-17T04:59:43Z | vercel-preview 2026-08-17T04:51:50Z
2af86a8b  vercel-production 2026-08-14T12:02:04Z | vercel-preview 2026-08-14T11:59:04Z
6a57d4d2  vercel-production 2026-08-14T04:13:39Z | vercel-preview 2026-08-14T04:10:28Z
```

Usar este passo para concluir alguma coisa sobre o Railway é ler um endpoint que responde
por OUTRO SUJEITO, e a conclusão sai como "o backend não subiu" sobre um backend que subiu.
É a mesma família dos três casos listados no fim deste documento. **O Railway se confirma
pelo passo 2**, e só por ele.

```bash
set -a && . ./.env && set +a
FULL=$(git rev-parse <sha>)
curl -s -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
  "https://sentry.io/api/0/organizations/$SENTRY_ORG_SLUG/releases/$FULL/" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); ld=d.get('lastDeploy') or {}; print(ld.get('environment'), ld.get('dateFinished'))"
```

Saída esperada: `vercel-production 2026-07-31T07:18:22Z`.

**É o único que declara o instante em que terminou.** Só ele responde "já acabou?"; todos os outros respondem "como está agora", e "agora" pode ser antes.

#### Mas NÃO leia `lastDeploy`: leia a lista e procure o ambiente

**Corrigido em 2026-08-05.** O `lastDeploy` é o deploy MAIS RECENTE, e o mais recente frequentemente não é o de produção: o preview termina antes. Medido naquele dia, o mesmo release respondia

```
lastDeploy = vercel-preview      02:09:36Z     <- terminou primeiro
             vercel-production   02:12:29Z     <- o que interessa, 3 min depois
```

Ler `lastDeploy` na primeira amostra devolve `vercel-preview` e conclui "produção não chegou" sobre um deploy que estava a caminho. O valor está certo e descreve outro objeto, que é a mesma forma de errar do bloco acima sobre o Railway, com o sujeito trocado dentro da própria Vercel em vez de entre plataformas.

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

### 2. Backend: o campo `commit` do `/api/health`, amostra única

**É O INSTRUMENTO DO RAILWAY.** O passo 1 não o alcança (ver o bloco lá em cima).

```bash
curl -s https://api.boranatech.com.br/api/health \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['commit'])"
```

Compare com o SHA esperado (`git rev-parse origin/main`). Igual, o deploy chegou; diferente,
não chegou. Resposta categórica, sem janela de inferência e sem aritmética.

O valor vem de `RAILWAY_GIT_COMMIT_SHA`, que o Railway injeta no container, e passa por
`server/lib/commitSha.ts`. Fora do Railway (dev local, CI, teste) o campo é `null`, nunca
string vazia, e a normalização mora dentro da função, não no call site. Isso importa na
leitura: `null` em produção seria defeito da injeção, não deploy pendente, e os dois estados
ficam distinguíveis em vez de virarem o mesmo valor mudo.

**Nunca medir por frequência** (ver `CLAUDE.md`, o loop de 150 requisições que disparou a
mitigação da Vercel). Uma amostra responde. Se o deploy ainda não chegou, espere e amostre de
novo, espaçado.

#### `uptime` é SECUNDÁRIO, e o que sobrou para ele

O mesmo endpoint devolve `uptime`, e ele responde outra pergunta: "há quanto tempo ESTE
processo está de pé", não "qual versão ele carrega". Continua útil para um uso, e não é
confirmar deploy:

**Investigar reinício que NÃO é deploy.** OOM, crash, restart da plataforma. Com o `commit`
igual ao esperado e um `uptime` baixo que ninguém pediu, houve reinício sem troca de versão,
que é exatamente o sintoma procurado. Subtraia o `uptime` do instante da amostra para ter o
instante do boot.

Para confirmar DEPLOY ele é ruim, por dois motivos que se somam: um restart sem deploy zera o
`uptime` e parece deploy, e um deploy que demora zera o `uptime` tarde e parece que não subiu.
Além disso a inferência exigia uma condição conferida à parte, **nenhum outro push à `main` na
janela entre o deploy medido e a amostra** (`git log --oneline <sha-anterior>..origin/main`),
porque com dois pushes no intervalo um `uptime` baixo é compatível com os dois, e escolher um
é chutar. O campo `commit` dispensa a condição inteira: ele nomeia o SHA.

#### A afirmação que este passo trazia, e que ficou falsa

Até 2026-08-22 este documento dizia, com razão:

> `uptime` prova REINÍCIO, não VERSÃO. Não existe endpoint que declare qual SHA o backend
> carrega, então este passo nunca responde "o processo roda o commit X".

**Deixou de ser verdade no commit `4c565547`**, de 2026-08-22, que acrescentou
`commitShaAtual()` em `server/lib/commitSha.ts` e o campo `commit` no `/api/health`. O
docstring da função diz para que ela existe: "Existe para 'o deploy subiu?' ser uma linha de
curl contra `/api/health` em vez de aritmética sobre `uptime`". O documento não acompanhou, e
seguiu por seis dias mandando usar o instrumento pior enquanto negava a existência do melhor.

**O custo, medido: 34 minutos, em 2026-08-28.** Na publicação do `383ec3bc` a verificação do
Railway seguiu este passo como estava escrito: três rodadas de amostras de `uptime`,
aritmética para achar o instante do boot, e a conclusão "não chegou" tirada por inferência. Só
depois disso alguém leu a resposta INTEIRA do `/api/health` e viu o campo `commit` declarando
o SHA anterior. A conclusão estava certa e o caminho era desnecessário, que é o pior formato:
nada falhou, então nada acusou.

Fica registrado em vez de apagado, no mesmo padrão da correção de 2026-08-18 (o bloco do passo
1 sobre o Railway). O erro registrado é o que impede a reincidência, e um documento que mostra
só a versão corrigida ensina a confiar nele sem conferir a data.

#### Quando a Vercel sobe e o Railway não

Descoberto em 2026-08-28, no mesmo deploy. A Vercel terminou 53 segundos depois do push
(`vercel-production = 2026-08-29T00:54:59Z`) e o Railway ainda servia o SHA anterior 34
minutos depois. **Vercel pronta não é evidência sobre o Railway**, e a assimetria pode ser de
dezenas de minutos, não dos 1 a 3 que o passo 1 cita para o caso normal.

Com o `commit` do health dizendo que o backend não trocou, sobram três causas, e **elas se
distinguem no painel do Railway, não daqui**:

1. **Build em fila ou em andamento.** A espera é real e termina sozinha.
2. **Build quebrado.** O deploy foi disparado e falhou. O serviço segue no anterior, saudável,
   e nada no health acusa: a leitura é idêntica à da causa 1.
3. **Auto-deploy ou webhook desconectado.** Nenhum deploy foi disparado, e a espera é infinita.

**Não há credencial de API do Railway no ambiente** (nenhuma variável `RAILWAY_*` no `.env`),
então nada aqui separa as três: de fora, as três produzem exatamente a mesma leitura, "o
`commit` continua o anterior". Confundir a primeira com a terceira é esperar por um deploy que
nunca foi disparado. Abra o painel.

Naquele caso o deploy acabou chegando sozinho, com boot em `2026-08-29T02:22:46Z`, cerca de 88
minutos depois do push. Qual das três demoras foi, o painel diria; daqui só se viu o resultado,
e é só isso que fica afirmado.

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

Medições desta série declararam ausência sobre algo que ainda não tinha acontecido:

1. **"A release cobre um projeto só"**, amostrada às 20:07 com o Railway terminando às 20:10.
   Na época a leitura foi "não era anomalia, era pressa", e este documento chegou a afirmar
   que a release tinha passado a cobrir os dois. **Isso era falso, e a correção veio em
   2026-08-18**: a release nunca cobriu o Railway, em release nenhuma (as quatro conferidas
   estão no passo 1). O erro original foi de INSTANTE, a correção que se escreveu para ele foi
   de SUJEITO, e a segunda é pior que a primeira, porque uma afirmação errada dentro do
   documento de verificação ensina o erro em vez de apenas omiti-lo. Ver `CLAUDE.md`, "regra
   escrita errada em arquivo de regras".
2. **"Zero artefatos, nenhum source map"**, endpoint legado (`/releases/{v}/files/`), que indexa por URL e devolve vazio porque o `sentry-cli` moderno sobe por debug ID. O correto é `/files/artifact-bundles/`, que mostrava 1066 arquivos o tempo todo.
3. **"O bundle não mudou"**, amostrado antes de o Vercel terminar, num commit em que o entry também não mudaria. Dois defeitos ao mesmo tempo, e o segundo teria mascarado o primeiro.

O padrão comum: **a superfície respondeu, e a resposta foi lida como veredito.** Status 200 com corpo errado, endpoint certo com dado de outra época, hash certo de um artefato que não é o que mudou.

**Regra prática:** antes de concluir "não chegou", conferir se o instrumento consegue enxergar essa mudança específica, e se o instante da medição é depois do instante do evento.
