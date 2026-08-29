HEAD_FINAL: 86fe1cfd331ab19049b2e102a5fe57ecbfc0675d
(ultimo commit de trabalho. O commit que acrescenta ESTE documento vem depois
dele por construcao, e por isso nao pode se citar: um arquivo nao contem o SHA
do commit que o cria. `git log --oneline origin/main..HEAD` da a lista fechada.)

# Pormenores de agosto: hardening de checks, eventos e dicionario

Sessao de 2026-08-28, retomada depois do reinicio do notebook.
Branch `fix/pormenores-agosto`, worktree `/home/s0ft/bnt-pormenores`.
Nada aqui foi publicado, aplicado no banco ou mergeado.

## Retomada: o que a FASE D encontrou

**A sessao anterior nao chegou ao setup.** Worktree ausente, branch ausente
local e remotamente (`git worktree list`, `git branch -a`, `git ls-remote origin
fix/pormenores-agosto`, os tres negativos). Nao havia commit parcial, edicao
pendente nem stash: **nao houve descarte de trabalho nenhum**, e portanto nao ha
diff salvo a recuperar.

`origin/main` avancou de `8f2f2d39` (o valor esperado pelo prompt) para
`2902cdf8`. Os dois commits novos sao `78ec95a0 fix(intake): exclude info level
events from task ingestion` e `2902cdf8 chore(db): record sentry sync cron
scheduling migrations`, tocando `server/lib/sentryApi.ts`,
`server/lib/sentryApi.test.ts` e duas migrations de cron do Sentry. **Nenhum
arquivo-alvo desta frente**, entao nao foi caso de PARE. O unico efeito foi
deslocar a numeracao da migration nova, que passou a vir depois de
`20260823170000`.

### Checklist de entregaveis, com a evidencia que classificou cada um

| # | Estado na FASE D | Evidencia |
|---|---|---|
| 1a | FALTA | `grep` por `check`/`argv` vazio nos dois geradores. Ambos DETERMINISTICOS (derivam de arrays estaticos, sem `Date.now` nem ordem instavel), entao o commit previo de determinismo nao foi necessario |
| 1a2 | FALTA | `check:generated` ausente do `package.json` |
| 1b | PARCIAL | a direcao inversa ja existia em `checkMigrationsApplied.mts` (linhas 753 e 769-777), mas so como `console.warn`: o script terminava VERDE com drift. Sem allowlist. O job `migrations` do CI tem os tres secrets de banco, entao a guarda coube no `check:migrations` e nao num script on-demand |
| 1c | FALTA | `check:all` ausente |
| 2a | FALTA | `Eventos.tsx:478-484` listava so `ESTADO_UF_OPTS` mais "Todos os estados"; o filtro em `:296` era `e.uf === estadoUF` |
| 2b | FALTA | `PraVoce.tsx:23` e `:298` vivos; `:327-328` e `:338` renderizavam "Online" duas vezes |
| 2c1 | FALTA | ultima migration era `20260823170000` |
| 2c2 | FALTA | `claude/produto/` tinha so `04-` e `05-` |
| 3a | **DONE, ja em `origin/main`** | `Dicionario.tsx:124` ja fazia `example: enr?.example ?? ""`, e `EnrichedTerm` tipa `example: string`. Os campos irmaos nao tem o defeito: `term`, `category`, `tags` e `meaning` estao presentes nos 313 termos de `shared/glossaryData.ts` (contagem por campo: 313 cada), e `level` tambem e coalescido. **Nada a fazer, e nenhum commit foi criado para este item** |
| 3b | FALTA | `contentApi.ts:148-171` fabricava 4 fontes; varredura do repositorio inteiro (`.ts`, `.tsx`, `.mts`, `.mjs`, `.js`, `.json`, `.md`, com `scripts/`) achou ZERO consumidores alem do reexport em `contentService.ts:21` |
| 3c | PARCIAL | `server/routes/admin.ts:2023` e `Admin.tsx:5693,5718` ja propagavam `null` corretamente. Faltava o estado VISIVEL: a faixa em `:6355` so renderiza com `total !== null`, entao "nao sei quantos sao" era indistinguivel de "estes sao todos" numa lista que a rota corta em 100 sem avisar |

## Commits

| SHA | Mensagem | Item |
|---|---|---|
| `466fc30c` | `build(checks): add check mode to generated data scripts` | 1a, 1a2 |
| `d35febba` | `build(checks): add schema drift guard with allowlist` | 1b |
| `7dadd13f` | `build(checks): add check:all aggregate and update commit gate` | 1c |
| `442a79ce` | `feat(eventos): add international option to uf filter` | 2a |
| `89d5af4a` | `fix(eventos): drop dead evergreen map and duplicate online label` | 2b |
| `8eaf7ea0` | `feat(db): add dash normalization trigger for external events` | 2c1 |
| `8b8a6b0b` | `chore(db): add cleanup window sql for dashes and duplicates` | 2c2 |
| `9215b67f` | `fix(conteudo): remove fabricated fallback sources in content api` | 3b |
| `86fe1cfd` | `fix(admin): propagate null count instead of masking in events total` | 3c |

Nove commits para dez itens da tabela: o `3a` ja estava correto em `origin/main` e
o commit `fix(dicionario): stop interpolating undefined example in search`
**nao existe de proposito**. Commit que nao muda comportamento seria ruido no
historico e sugeriria um defeito que nao havia.

`8eaf7ea0` foi criado e depois emendado (a branch nunca foi publicada) para
trocar o literal `'- -'` sem espaco por `chr(45)`, pelo motivo da secao
"Decisoes".

## Decisoes tomadas

**1b, allowlist em vez de warn.** A direcao inversa ja rodava e ja imprimia o
drift; o que faltava era consequencia. Warn dentro de gate de CI nao obriga
ninguem a nada, e o conjunto so cresce. A allowlist
(`scripts/lib/schemaDriftAllowlist.ts`) inverte o custo: drift novo quebra o CI,
e permitir um exige escrever nome, tipo, data e justificativa no commit que o
introduz. **Verificada nos dois sentidos**, e o segundo sentido e o que impede a
lista de apodrecer: entrada que nao corresponde mais a drift nenhum (porque a
migration finalmente subiu, ou porque o nome foi digitado errado) tambem falha.

As quatro entradas semeadas sao o drift REAL medido nesta sessao, nao um chute:
`billing_failed_payments`, `stripe_customers` e `payment_recovery_emails` tem
migration rastreada na branch `fix/billing-customer-reuse`, que ainda nao entrou
na main (`git log --diff-filter=A` confirmou os tres arquivos e os SHAs).
`vw_eventos_agenda` **nao tem rastro nenhum** no repositorio, e a entrada diz
exatamente isso, com a hipotese de origem marcada como nao confirmada em vez de
escrita como se fosse achado.

**1c, o que `check:all` agrega e o que ele nao alcanca.** `check` +
`check:generated` + `check:scripts` + `check:limiares`, todos offline. Fora:
`check:migrations` (precisa de rede e service role) e a suite. O CLAUDE.md
registra explicitamente a lacuna que sobra: **o hook de pre-commit chama `pnpm
check`, nao `pnpm check:all`**, entao ele nao roda `check:generated` nem
`check:scripts`; quem pega gerado desatualizado e o CI ou o comando rodado a
mao. Isso ficou escrito em vez de implicito, porque a decisao de manter
`check:scripts` fora do hook e deliberada e ja esta documentada la.

**2a, sentinela e nao valor de UF.** "Internacional" nao e uma unidade da
federacao; gravar "INT" na coluna seria inventar uma UF que o banco nao tem.
O predicado exige as duas metades (`uf` nulo E modalidade diferente de Online)
porque evento online brasileiro tambem tem `uf` nulo, e sem a segunda metade o
recorte devolveria uma lista majoritariamente nacional, pior que nao ter filtro.

**2b, o mapa estava morto, e isso foi provado antes de remover.** Consulta ao
banco: nao existe `external_id` igual a `campus-party` nem a `python-brasil`. Os
eventos equivalentes foram migrados com prefixo `legado-`
(`legado-campus-party-brasil`, `legado-python-brasil-2026`), entao
`EVENTO_EVERGREEN[evento.id]` nunca casava e o fallback `?? evento.formato` era
o unico caminho vivo. Era tambem a causa exata da duplicata: a linha do pino de
mapa dizia "Online" e a linha do calendario dizia "Online" de novo. A linha do
calendario passou a mostrar `dataLabel`, e some quando o banco nao tem rotulo,
em vez de repetir o formato.

**2c, ordem de aplicacao.** O cabecalho do SQL de janela manda aplicar a
migration do trigger ANTES do backfill. Com o trigger ja ativo, a rotina de
coleta nao consegue reintroduzir travessao na janela entre o backfill e o
deploy; na ordem inversa existe essa fresta.

**2c, `chr(45)` no lugar do hifen duplo literal.** Descoberto por acidente util
nesta sessao: um validador que eu mesmo escrevi removeu comentario por "corta do
tracinho duplo ate o fim da linha", comeu a aspa de fechamento da string de
destino do `translate` e reportou erro de sintaxe num SQL correto. E a mesma
familia do `stripSqlComments` que o CLAUDE.md cataloga. O Postgres le o literal
certo, mas ferramenta ingenua no meio do caminho nao, e o custo de nao depender
disso e um `chr()`. Trocado nos dois arquivos.

**3b, `null` e nao `[]`.** Lista vazia afirma "o servidor respondeu e nao ha
fonte nenhuma". Aqui nao houve resposta, e o valor precisa dizer isso. Mesmo
desfecho do `getNews` logo abaixo no arquivo. A mudanca de assinatura foi segura
porque a varredura do repositorio inteiro nao achou consumidor: nenhum call site
precisou de ajuste.

**3c, terceiro estado visivel.** Nao inventamos numero (era o que `total ?? 0`
faria); dizemos que ele nao veio. A faixa nova so aparece com `total === null`,
sem erro de carga e com pelo menos uma linha na tela.

## Verificacao

```
pnpm check:all   -> EXIT=0
pnpm test        -> Test Files 231 passed | 3 skipped (234)
                    Tests 3021 passed | 10 skipped (3031)   em 57,43s
```

**Os guards novos foram exercitados contra a condicao que deveriam pegar, nao so
observados passando** (a regra do CLAUDE.md sobre instrumento que falha
passando):

- `check:generated`: com um drift proposital no `countsGenerated.ts` (2 linhas),
  EXIT=1; restaurado por `git restore` (status limpo confirmado), EXIT=0.
  A primeira tentativa desta medicao foi INVALIDA e esta registrada aqui de
  proposito: o `cp` de backup falhou por `$TMPDIR` vazio, o `&&` curto-circuitou,
  o drift nunca chegou a ser criado, e o EXIT=1 que apareceu era do proprio `cp`.
  Instrumento reportando o valor certo pelo motivo errado.
- guarda de drift: removendo `stripe_customers` da allowlist, EXIT=1 com a
  mensagem nomeando a tabela; restaurada, EXIT=0. Acrescentando uma entrada
  inexistente (`tabela_que_nao_existe_teste`), EXIT=1 pelo sentido inverso;
  removida, EXIT=0.
- SQL de janela: os 4 statements de escrita passaram por `EXPLAIN` (planeja, nao
  executa) contra o banco de producao, e os 5 SELECTs de verificacao rodaram de
  fato, por serem leitura pura. Todos validos: nenhuma coluna inexistente,
  nenhum erro de sintaxe.

**Dash-scan byte a byte, em Python, sobre a branch inteira:** 13 arquivos
tocados, 573 linhas adicionadas, **0 com U+2013 ou U+2014**. Os 8 U+2014 de
`client/src/pages/Admin.tsx` sao pre-existentes em `origin/main` (contagem
`8 -> 8`, e nenhuma linha adicionada por esta branch os contem).

**Diff:** `~/Downloads/pormenores.diff`, md5 `d2f28cdbb4ae681c06a3befdf63daa0e`,
874 linhas. Ele cobre os NOVE commits de trabalho, ate `86fe1cfd`, e nao inclui
este relatorio, pelo mesmo motivo de auto-referencia da linha `HEAD_FINAL`.

## O que NAO foi feito, e precisa da Ana

1. **Aplicar a migration `20260828120000`** e depois rodar
   `claude/produto/06-janela-normalizacao-e-dedup.sql` na janela de 05h as 09h,
   com o backup da noite confirmado `COMPLETED`. Nesta sessao nao foi aplicado
   SQL nenhum em producao.
2. **O corpo plpgsql da funcao nova nao foi executado**, porque executa-lo
   significaria cria-la em producao. As expressoes `translate(..., chr(8211) ||
   chr(8212), chr(45) || chr(45))` foram validadas por `EXPLAIN` no UPDATE
   equivalente, que usa exatamente as mesmas; o que resta sem prova e a sintaxe
   do envelope plpgsql.

## Estado da integracao (conferido no fim da sessao)

`origin/main` avancou DE NOVO durante a sessao, de `2902cdf8` para `383ec3bc`,
seis commits (o lote de `fix/billing-observability`: alertas de cron, pagamentos
orfaos e Sentry no provider da Stripe). Eles tocam `server/lib/cronAlert*`,
`server/lib/orphanPayments*`, `server/providers/stripe.ts` e
`server/routes/cron.ts`: **zero colisao** com os 13 arquivos desta branch
(`comm -12` entre as duas listas devolveu vazio).

Consequencia pratica: a branch NAO e mais fast-forward puro
(`git rev-list --count HEAD..origin/main` = 6). A integracao e decisao da Ana e
nao foi feita aqui.

Conferido tambem o que isso faz com a allowlist de drift, porque um dos seis
commits podia ter trazido as migrations de billing: **nao trouxe**. As tres
(`create_billing_failed_payments`, `create_stripe_customers`,
`create_payment_recovery_emails`) continuam ausentes de `origin/main`, entao as
tres entradas seguem descrevendo drift real. Se a branch `fix/billing-customer-reuse`
subir depois, o guard vai acusar as tres como entradas obsoletas, e a acao certa
sera remove-las da allowlist, nao silenciar o guard.

## Achados fora de escopo (reportados, nao corrigidos)

1. **Os numeros medidos em 26/08 ja estao desatualizados**, e isso e um achado,
   nao um erro do prompt. Medido em 2026-08-28 pelos SELECTs de verificacao:
   **381 linhas vivas** (eram 366) e **108 com travessao** (eram 105), por campo
   `title` 49 (era 47), `location_label` 53, `date_label` 15, `organizer` 15
   (era 14), `description` 3. A rotina de coleta continua rodando e continua
   trazendo travessao, o que e a justificativa mais forte possivel para o
   trigger. **Nenhum desses numeros foi escrito nos SQLs**: a SECAO 0 conta
   dinamicamente, justamente para nao envelhecer entre a redacao e a execucao.
2. **Existe 1 linha soft-deletada com travessao** (`remanescentes_total` 109
   contra `remanescentes_vivos` 108). O UPDATE da SECAO 1 nao filtra por
   `deleted_at` e portanto a cobre, de proposito: o trigger tambem nao filtra, e
   backfill com regra diferente do trigger criaria inconsistencia.
3. **`client/src/pages/Admin.tsx` tem 8 travessoes U+2014 pre-existentes** na
   `main`, fora de qualquer linha desta branch. Violam a regra do CLAUDE.md e
   pedem uma limpeza propria.
4. **A migration nova e invisivel para o guard de existencia.** Funcao que
   devolve `trigger` nao e exposta pelo PostgREST, entao `check:migrations` nunca
   vai acusar se ela jamais for aplicada: e a mesma lacuna que custou 17 dias com
   `get_ai_usage_today`. A verificacao 3 do SQL de janela (consulta a
   `pg_trigger`) cobre o momento da aplicacao, mas nao e permanente. **Uma
   assercao comportamental permanente cabe aqui e nao foi adicionada de
   proposito: ela ficaria VERMELHA ate a janela rodar**, quebrando o CI da branch
   e da main por dias. O texto sugerido, para depois da janela, e afirmar que
   zero linhas vivas contem `chr(8211)` ou `chr(8212)`, que e leitura pura e
   quebra tanto se o trigger sumir quanto se ele nunca tiver sido criado.
5. **`getContentSourceStatus` nao tem nenhum consumidor.** Depois desta sessao
   ela devolve `null` corretamente em erro, mas segue sendo codigo que ninguem
   chama, exportado e reexportado. Remove-la e uma decisao de produto (o endpoint
   `/sources/status` existe no servidor), entao ficou de fora.
6. **`FreelanceGuide.tsx` continua com 2 `<select>` nativos** nunca catalogados
   no rollout do BntSelect. Nao tocado, so registrado.
