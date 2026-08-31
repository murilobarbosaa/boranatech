# Deploy da pilha completa: LinkedIn Fase 4, main e Marco 1 fiscal

**Fonte operacional vigente desta janela de deploy.** Substitui a secao 5 de
`docs/linkedin-fase4-fechamento.md`, que descrevia uma pilha de 56 commits sem
merge nenhum e cinco migrations pendentes. A pilha mudou: hoje sao quatro
merges, dez migrations e a frente fiscal embarcada.

Todo numero abaixo foi medido no worktree, e nao herdado de memoria. Onde o fato
vem de um lote anterior, o lote esta nomeado.

## 1. Retrato da pilha

| Item                              | Valor                                                                    |
| --------------------------------- | ------------------------------------------------------------------------ |
| HEAD                              | `3e37c4dcb28f6afe36b38fd25baf21cc80f934f5`                               |
| Branch                            | `feat/linkedin-fase-4`                                                   |
| Commits a publicar (`main..HEAD`) | **72** (68 comuns mais 4 merges)                                         |
| Merges na pilha                   | **4**                                                                    |
| `main` (producao)                 | `1ced0103`, e **e ancestral do HEAD** (`merge-base --is-ancestor` passa) |
| Suite                             | **4208 verdes, 10 pulados, zero vermelho** (331 arquivos de 334)         |
| `pnpm check` e `check:limiares`   | exit 0, com **0 orfaos** na auditoria de limiares                        |

Os quatro merges, do topo para baixo:

```
3e37c4dc merge(main): integrate latest main into linkedin stack            (main 1ced0103)
6cf78a65 merge(fiscal): integrate fiscal marco 1 into linkedin stack
1933d02b merge(main): integrate latest main into linkedin fase 4 stack     (main 71d28f77)
c3fa06b5 merge(main): integrate main into linkedin fase 4 stack            (main f490c622)
```

O quarto merge (Lote M4, 2026-08-31) existe porque a `main` andou 135 commits
depois do terceiro, com a frente de dark mode inteira entre eles, e o
fast-forward tinha deixado de ser viavel. Depois dele
`git merge-base --is-ancestor main HEAD` volta a imprimir **FF_VIAVEL**, com
**zero** commits da `main` fora do HEAD.

### 1.1 Estado de push: a premissa antiga de "nada pushado" esta ERRADA

Medido com `git ls-remote --heads origin`:

| Ref                          | Em `origin` | Situacao                                                                                  |
| ---------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `main`                       | `1ced0103`  | producao                                                                                  |
| `feat/linkedin-fase-4`       | `b47c78a4`  | **parcialmente pushada**; `b47c78a4` e ancestral do HEAD, e faltam **281** commits locais |
| `fix/openai-cota-credencial` | `a3e37d2a`  | **inteira em origin**                                                                     |
| `feat/fiscal-fechamento`     | ausente     | **nunca pushada**                                                                         |

Consequencia pratica: o `git push` desta janela nao e o primeiro da branch. Ele
avanca `feat/linkedin-fase-4` de `b47c78a4` para `3e37c4dc`, e como
`b47c78a4` e ancestral, e fast-forward tambem no remoto.

## 2. Checklist de migrations

**Dez pendentes**, derivadas por medicao e nao por lista escrita a mao: sao as
que existem em `supabase/migrations/` no HEAD (160 arquivos) e **nao** existem na
`main` (150 arquivos). O conjunto inverso e vazio, ou seja, a pilha ja contem
todas as migrations que a producao tem.

A lista continua sendo a mesma de antes do quarto merge, e isso foi DERIVADO e
nao presumido: as sete migrations que a `main` trouxe no intervalo ja estao
aplicadas em producao pelos deploys dela, entao entraram no HEAD pelo merge e
sairam do conjunto pendente pela propria regra (pendente = esta no HEAD e nao
esta na `main`). O total subiu de 153 para 160 dos dois lados do calculo, e a
diferenca seguiu dez.

Em ordem cronologica de timestamp, que e a ordem de aplicacao:

| #   | Arquivo                                                     | O que faz                                                                               | Classe  |
| --- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------- |
| 1   | `20260804120000_create_fiscal_invoices.sql`                 | cria `fiscal_invoices`, tres indices e habilita RLS                                     | aditiva |
| 2   | `20260804130000_add_profile_fiscal_fields.sql`              | colunas fiscais em `profiles` mais o CHECK de preferencia de documento                  | aditiva |
| 3   | `20260804140000_add_precisa_revisao_to_fiscal_invoices.sql` | coluna `precisa_revisao` e indice                                                       | aditiva |
| 4   | `20260804140100_schedule_reconcile_fiscal_invoices.sql`     | agenda o cron `reconcile-fiscal-invoices` (`55 */6 * * *`)                              | aditiva |
| 5   | `20260810120000_add_dps_fields_to_fiscal_invoices.sql`      | sequence `dps_numero_seq` e colunas de DPS                                              | aditiva |
| 6   | `20260815120000_linkedin_progress_nonnegative.sql`          | constraint de indice nao negativo em `linkedin_improvement_progress`                    | aditiva |
| 7   | `20260815130000_linkedin_progress_revision.sql`             | coluna `progress_revision` em `linkedin_analyses` e duas funcoes de sessao de progresso | aditiva |
| 8   | `20260821120000_add_attempt_details_to_ai_usage_logs.sql`   | coluna `attempt_details jsonb` em `ai_usage_logs`                                       | aditiva |
| 9   | `20260821120100_index_linkedin_analyses_created_at.sql`     | indice `linkedin_analyses_created_at_idx`                                               | aditiva |
| 10  | `20260821130000_serialize_ai_usage_in_flight.sql`           | duas assinaturas de `reserve_ai_usage_slot` (a de 4 argumentos e a antiga)              | aditiva |

**As dez sao aditivas, e isso foi conferido e nao suposto**: varredura por
`drop table`, `drop column`, `alter column ... type`, `delete from`, `truncate` e
`rename` nas dez nao achou nenhuma ocorrencia. **Portanto todas sao ISENTAS da
janela de migration destrutiva** (05h as 09h) e podem rodar a qualquer hora.

A unica clausula `drop` real do conjunto e um
`drop constraint if exists profiles_fiscal_documento_preferencia_check` na
migration 2, linha 52, que derruba uma constraint que a **propria migration
recria** logo abaixo. Nao ha perda de dado. Os demais casamentos de "drop" nas
dez sao texto de comentario.

### 2.1 Nota operacional da migration 2 (`20260804130000`)

**Ela roda em DUAS transacoes, de proposito, e isso substitui a ressalva antiga
de `ACCESS EXCLUSIVE`.** O arquivo declara `BEGIN` na linha 28 e `COMMIT` na 83,
e o `validate constraint` fica FORA dessa transacao, na linha 91.

O motivo esta escrito no proprio arquivo: o `add constraint` sem `NOT VALID` toma
`ACCESS EXCLUSIVE` em `profiles` e **segura o lock enquanto varre a tabela
inteira**, e `profiles` esta no caminho de login, entao a varredura bloquearia
leitura e escrita do site. Com `NOT VALID` (linha 72) o lock exclusivo dura um
instante, e a validacao acontece depois com `SHARE UPDATE EXCLUSIVE`, que nao
bloqueia trafego normal. O resultado final e identico ao do `ADD` sem
`NOT VALID`, com a constraint valida e verificada.

**Ao colar no SQL Editor, respeite o `COMMIT`**: o `validate constraint` precisa
ser executado depois dele para o ganho existir. Colar o arquivo inteiro de uma
vez funciona, porque o editor executa os statements na ordem.

### 2.2 Nota operacional da migration 4 (`20260804140100`)

Ela **agenda um cron**, e o cron fica **inerte enquanto `NFSE_ENABLED=false`**.
Isso nao e suposicao: o endpoint que ele chama,
`POST /api/cron/reconcile-fiscal-invoices`, tem a guarda logo na entrada
(`server/routes/cron.ts:1331`), que registra a execucao como sucesso com
`payload: { skipped: "nfse_disabled" }` e responde
`{ data: { skipped: "nfse_disabled" } }` sem varrer nada. O worker e a fila
fiscais tambem so nascem com a flag ligada (`server/index.ts:75` e `:94`).

O agendamento entrar antes da ativacao e o comportamento desejado: o cron existe,
roda a cada 6 horas, e nao faz nada ate o Marco 2.

### 2.3 Procedimento de aplicacao

1. **Conferir o que ja consta** na tabela de historico de migrations
   (`schema_migrations`) do banco alvo, antes de aplicar qualquer coisa. A lista
   acima e derivada do repositorio contra a `main`, e o banco e a outra ponta.
2. **Aplicar a mao no Supabase SQL Editor**, na ordem da tabela (1 a 10).
3. **`supabase migration repair --status applied <timestamp>`** para cada um dos
   dez timestamps. Sem isso o historico local e o remoto divergem.
4. **`pnpm check:migrations`** contra o banco alvo. Ele nao roda offline: precisa
   de rede e do service role.

### 2.4 Migrations ANTES do backend, e as duas consequencias de inverter

A regra geral do `CLAUDE.md` e que codigo novo tolera schema antigo, e schema
novo nao e tolerado por codigo antigo. Nesta janela ha duas consequencias
concretas, herdadas de `docs/linkedin-fase4-fechamento.md`:

- **Sem a coluna `attempt_details`** (migration 8), o insert de uso de IA
  **falha**.
- **Sem a RPC de quatro argumentos** (migration 10), `checkAiDailyLimit` cai no
  **modo degradado em silencio**: as analises continuam, a serializacao some e a
  corrida de cota reabre. O aviso no Sentry sai no maximo uma vez a cada cinco
  minutos, entao o silencio e quase total.

A segunda e a pior das duas, porque nao quebra: degrada.

## 3. Sequencia de deploy

1. **Congelar a `main`.** Nenhuma publicacao pelo `bnt-main` ate o fast-forward
   desta pilha. O congelamento falhou em tres lotes seguidos (a `main` andou de
   `f490c622` para `39389b54`, depois `683344e4`, `d4a76a83` e `71d28f77` no meio
   do trabalho) e segurou no Lote F. Cada movimento da `main` invalida o
   `FF_VIAVEL` e obriga a um merge a mais.
2. **CI verde no SHA exato** que sera publicado.
3. **Push da branch** apos o "pode publicar". `feat/linkedin-fase-4` avanca de
   `b47c78a4` para `6cf78a65`, em fast-forward.
4. **Fast-forward da `main`, pelo worktree de deploy**, que nao aceita edicao:

   ```bash
   cd /home/s0ft/bnt-main
   git fetch origin
   git rev-list --count feat/linkedin-fase-4..origin/main   # tem que dar 0
   git merge --ff-only feat/linkedin-fase-4
   git push origin main
   ```

5. **Aplicar as dez migrations** (secao 2.3), ANTES do backend.
6. **Deploy do backend (Railway).**
7. **Deploy do frontend (Vercel).**
8. **Verificacao**: `/api/health` (o campo `commit` diz qual build esta servindo,
   e `uptime` diz quando o processo subiu, em UMA requisicao) e o `sitemap.xml`.
   Medir estado por endpoint que DECLARA o estado, em amostra unica; nunca por
   loop de frequencia, que ja disparou a mitigacao da Vercel e cegou a propria
   medicao.

### 3.1 `NFSE_ENABLED=false` explicito no ambiente

**A variavel precisa estar declarada como `false` na Railway antes do deploy do
backend.** O Marco 1 sobe com a emissao desligada; ativar e o Marco 2.

Com a flag desligada, estas seis superficies devem permanecer invisiveis ou
declarar o estado. Arquivo e linha no HEAD desta janela, conferidos no Lote F:

| #   | Superficie                  | Onde o gate decide                                                                         |
| --- | --------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | Banner do Layout            | `client/src/components/fiscal/FiscalDataBanner.tsx:73` (montado por `Layout.tsx:22`)       |
| 2   | Secao de notas do `/perfil` | `client/src/pages/Perfil.tsx:2130`                                                         |
| 3   | Bloco de notas fiscais      | `client/src/components/fiscal/FiscalInvoicesSection.tsx:76` (e `:53` guardando o fetch)    |
| 4   | Painel fiscal do admin      | `client/src/components/admin/FiscalInvoicesDashboard.tsx:177` (e `:131` guardando o fetch) |
| 5   | Checkout                    | `client/src/pages/Checkout.tsx:772`                                                        |
| 6   | `GET /api/billing/invoices` | `server/routes/billing.ts:345`, respondendo **200 com `{ data: [], nfse: "disabled" }`**   |

O gate do frontend e **fail-closed em todos os caminhos de duvida**: ausencia do
campo, valor desconhecido, resposta malformada, erro de rede e o estado de
carregamento resolvem para desligado. Isso cobre a janela de deploy, em que o
bundle novo conversa com o backend antigo que ainda nao conhece
`GET /api/billing/nfse-status`.

### 3.2 Como smoke-testar isso em producao

1. Abrir `/perfil` como assinante ativo: **nao pode** aparecer nem o banner de
   dados fiscais nem a secao de notas.
2. Abrir o `/checkout`: **nao pode** aparecer o bloco de dados fiscais.
3. Abrir o admin: **nao pode** aparecer o painel de notas fiscais.
4. `GET /api/billing/invoices` autenticado: deve devolver **200** com
   `{"data":[],"nfse":"disabled"}`. **200 e nao erro e deliberado**: o cliente
   trata qualquer `!res.ok` como falha e mostraria mensagem de defeito para um
   estado que nao e defeito. O campo `nfse` existe para "desligado" e "voce nao
   tem notas" nao chegarem identicos.
5. `GET /api/billing/nfse-status`: deve devolver `{"data":{"nfse":"disabled"}}`.

### 3.3 Janela conhecida

O deploy nao e atomico: a Vercel costuma terminar antes da Railway, e ha 1 a 3
minutos de **frontend novo contra backend antigo**.

O que muda nessa janela, herdado de `docs/linkedin-fase4-fechamento.md`: o teto
de aborto do client e **130,4s** contra um backend cujo pior caso ainda e
**150,4s**, ou seja a margem volta a ser negativa ate a Railway subir. Nao piora
nada, so nao melhora ainda.

O que a frente fiscal acrescenta a essa janela: nada que degrade, porque o gate
do frontend e fail-closed e resolve para desligado quando a rota de status ainda
nao existe no backend antigo.

**O checklist de melhorias do LinkedIn exige as migrations aplicadas.** Sem as
duas de progresso (6 e 7), a rota devolve 503 `progress_unavailable` e o
checklist some, o que e degradacao correta e nao defeito.

## 4. Pos-deploy

### 4.1 Smoke test minimo do LinkedIn

1. **Analise nova**: rodar uma analise de perfil completa e conferir que ela
   termina, grava e aparece.
2. **Historico**: abrir a lista de analises e conferir que a nova consta.
3. **Progresso**: marcar e desmarcar um item do checklist de melhorias, e
   conferir que o estado sobrevive a um reload (e o que exercita as migrations 6
   e 7 e as duas funcoes de sessao).

O checklist versionado da frente esta em `docs/smoke-linkedin.md`, e e ele que
vale: checklist que mora em conversa some numa compactacao de contexto, e ja
sumiu uma vez no meio do deploy que existia para validar.

### 4.2 Notas de painel para a Ana

**As quatro descontinuidades do painel de custo somam, e a instrucao vale para as
quatro: nao comparar semanas que atravessam o deploy.** Um salto na serie nao e
aumento de uso nem de preco. Herdado de `docs/linkedin-fase4-fechamento.md`:

| Nota                        | Efeito                                                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Fallback calibrado          | quatro rotas passam a reportar cerca de **1,82 vez** (4 dividido por 2,2) o valor anterior                           |
| Rotas migradas para medicao | as mesmas quatro saem da estimativa para os tokens cobrados, e passam a incluir as tentativas reprovadas             |
| Plano de carreira           | sai de **zero** para valor: a chamada mais cara da rota aparecia custando nada                                       |
| Entrevista                  | sai de **zero** para valor em **seis** pontos (sessao, turno, fechamento, dica, traducao). Tende a ser o maior salto |

Linhas historicas ficam como estao. Cada serie so volta a ser comparavel a partir
da primeira semana inteira depois do deploy.

### 4.3 O que NAO faz parte desta janela

**A ativacao fiscal.** Esta janela sobe o Marco 1: o codigo existe, as tabelas
existem, o cron esta agendado, e tudo fica desligado por `NFSE_ENABLED=false`.

Ligar a emissao e o **Marco 2**, com pre-requisitos de negocio proprios, e tem
runbook separado: `docs/fiscal-fechamento.md`, secao 5, trazido pelo commit
`e3b2a755`. Ele cobre os pre-requisitos que bloqueiam, as envs da Railway, a
regeneracao dos types, o smoke test pos-ativacao e o rollback.

Um acoplamento registrado la que vale repetir aqui: **regenerar os types e subir
o `EXPECTED_TABLE_COUNT` de `adminUsersHarness.test.ts` de 85 para 86 sao um
unico commit**. Fazer um sem o outro quebra o harness, que aborta o arquivo
inteiro e derruba um pedaco grande da suite. Isso e do Marco 2, nao desta janela.

### 4.4 Conformidade de tema: 22 sitios que sobem sem seguir o dark mode

O quarto merge trouxe a frente de dark mode, que converteu hex de marca em
variaveis de tema no cliente inteiro. A pilha bifurcou antes disso, e o que ela
adicionou de interface nao passou por aquela conversao.

**O merge resolveu a maior parte sozinho.** Antes dele a medicao dava 164
ocorrencias em 13 arquivos; depois dele sao **22 em 9**, porque nas regioes que
os dois lados tocaram a versao convertida da `main` venceu o auto-merge. O que
sobrou esta concentrado nos componentes fiscais, que a `main` nunca viu:

| Arquivo                                                   | Sitios |
| --------------------------------------------------------- | ------ |
| `client/src/components/fiscal/FiscalDataModal.tsx`        | 8      |
| `client/src/components/admin/FiscalInvoicesDashboard.tsx` | 3      |
| `client/src/pages/Perfil.tsx`                             | 3      |
| `client/src/components/fiscal/FiscalDataBanner.tsx`       | 2      |
| `client/src/components/fiscal/FiscalInvoicesSection.tsx`  | 2      |
| `client/src/components/admin/LinkedinLastroDashboard.tsx` | 1      |
| `client/src/components/linkedin/LinkedinHistory.tsx`      | 1      |
| `client/src/components/linkedin/LinkedinScoreHero.tsx`    | 1      |
| `client/src/pages/LinkedinAnalisar.tsx`                   | 1      |

Consequencia de deploy, e ela e visual e nao funcional: **em tema escuro, esses
pontos continuam claros**. Nada quebra, nada fica ilegivel por erro de logica, e
nenhuma rota deixa de responder; o que acontece e uma ilha de cor clara.

O unico sitio em que o hex e **dado e nao apresentacao** e
`LinkedinScoreHero.tsx:57`, `CONFETTI_COLORS`, um array de strings entregue a
biblioteca de confete. Ele nao vira variavel de tema pelo mesmo motivo que
qualquer valor consumido fora do CSS: quem le nao resolve `var()`.

Fechar isso e o **Lote T**, com escopo fechado e criterio afirmavel, de 22 para
zero nos oito arquivos de apresentacao. Nao faz parte desta janela de deploy.

## 5. Backlog registrado nesta janela

Itens acumulados durante a Fase 4 e os merges. Ficam aqui em uma linha cada para
nao se perderem, sem ordem de prioridade.

1. **413 `internal_error`**: o corpo acima do teto por rota devolve o slug errado
   em vez de um nomeado.
2. **`GET` de improvements que muta**: a rota de leitura do checklist tem efeito
   colateral de escrita, o que contraria o verbo.
3. **Modo legado `undefined`**: caminho degradado em que o modo nao e nomeado, e
   `undefined` circula como se fosse estado.
4. **Parser do `lerPaths` descarta a ultima entrada** de `paths` em
   `.claude/rules/linkedin-limiares.md`: o `\n` final e consumido pelo
   delimitador do frontmatter. Medido no Lote C2-REV2: 4 entradas no arquivo, 3
   lidas. Hoje inofensivo por acaso, porque a descartada e a unica que nao
   pertence ao `FONTES`.
5. **Router de billing sem assercao de total de rotas**: medido no Lote F,
   `EXPECTED_ROUTE_COUNT` conta so o `adminRouter`, e `GET /nfse-status` entrou
   sem entrar em contador nenhum.
6. **Hook `pre-merge-commit` ausente**: so existe `.githooks/pre-commit`, entao um
   merge SEM conflito commita sem passar pelo gate. Medido no Lote F, e a razao
   de o merge fiscal ter sido feito com `--no-commit`.
7. **Residuo raro ao quadrado**: caso de borda conhecido do analisador, ainda sem
   tratamento proprio.
8. **Harness do interview**: pendencia de harness da area de entrevistas.

Os itens 1, 2, 3, 7 e 8 vem do backlog acumulado dos lotes da Fase 4; os itens 4,
5 e 6 foram medidos nos lotes de merge e tem a medicao registrada nos relatorios
nomeados acima.
