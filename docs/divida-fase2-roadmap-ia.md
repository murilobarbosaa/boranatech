# Dívida deixada pela Fase 2 do Roadmap com IA

Registrada em 2026-07-31, no fechamento da fase. Cada item diz **onde está**, **por
que não foi feito agora** e **o que custa deixar assim**. Nada aqui é bug
desconhecido: são decisões, e o objetivo do documento é que elas não virem
descoberta arqueológica daqui a três meses.

Referências de linha valem para o commit em que este documento foi escrito.
`server/routes/admin.ts` estava em edição ativa por outra frente na mesma hora, e
suas linhas se moveram várias vezes durante a sessão. Por isso, quando a âncora
estável for o **nome da função**, é ele que está citado.

## Onde mora o quê, da Fase 2

Para quem chegar procurando:

| Artefato                               | Caminho                                    |
| -------------------------------------- | ------------------------------------------ |
| Runbook de deploy                      | `docs/runbook-deploy-roadmap-ia-fase2.md`  |
| Rollback das migrations                | `docs/rollback-fase2-roadmap-ia.sql`       |
| Auditoria dos pontos cegos do guard    | `docs/auditoria-pontos-cegos-guard.md`     |
| Ledger de migrations e a órfã superada | `docs/debito-ledger-migrations.md`         |
| Vazamento de reserva no stream         | `docs/erro-engolido.md`, adendo 2026-07-30 |

O runbook foi commitado **dentro de commits da frente de reembolsos**
(`d33e552` e `c2c30e0`), não de um commit da Fase 2. Foi um acidente de árvore
compartilhada: o arquivo estava no índice quando aquela frente commitou. O
conteúdo está correto e íntegro; o histórico é que mistura assuntos. Decidido não
reescrever. Fica registrado aqui porque `git log docs/runbook-*` leva a commits
com mensagem de reembolso, e sem esta nota isso parece erro.

---

## 1. `invalidateProStatusCache` no call site, não dentro de `revogarAcessoPro`

**Onde:** `server/routes/admin.ts`, função `revogarAcessoPro` (por volta da linha
1801). Ela muda `subscriptions.status` para `canceled` e **não** invalida o cache
Redis de status Pro. Quem invalida são os chamadores, depois de `decidirERevogar`.

**Estado hoje: correto.** Os dois caminhos de reembolso (Stripe e externo)
chamam `await invalidateProStatusCache(uid)` logo depois. Não há bug.

**Por que é dívida:** já são **seis** call sites de `invalidateProStatusCache` em
`admin.ts`, e a garantia depende de cada um lembrar. É a forma exata do incidente
do `setScoreDelta` que o `CLAUDE.md` documenta: 2 call sites, guarda no chamador,
um esqueceu. A regra do próprio projeto ("proteção dentro da função, nunca no call
site") diz que a invalidação pertence a `revogarAcessoPro`.

**Por que não agora:** `admin.ts` é da frente de reembolsos e estava sendo editado
em paralelo. Mexer lá durante a Fase 2 criaria conflito e misturaria as duas
histórias no diff. **Dono: a frente de reembolsos.**

**Custo de deixar:** o sétimo call site é o que esquece. Enquanto não esquecer,
zero.

## 2. Geração em voo não é interrompida por revogação de Pro

**Onde:** `server/routes/aiRoadmap.ts:536` (`passesProGate` no `/generate`) e
`:896` (o mesmo no `/resume`). O gate lê `req.isPro` **uma vez**, no início da
requisição; o SSE depois transmite por minutos, seção a seção, sem reconsultar.

**Efeito:** revogar o Pro de alguém no meio de uma geração não para a geração. Ela
termina e a pessoa fica com o roadmap.

**Por que não agora:** é **pré-existente**, não foi introduzido pela Fase 2, e
consertar exigiria reconsultar o status a cada seção, o que troca um custo certo
(uma consulta por seção, em toda geração de todo mundo) por um ganho num caso que
não se sabe se acontece. Sem medição, é otimizar para o improvável.

**Custo de deixar:** uma geração de roadmap para quem acabou de ser revogado. O
teto do prejuízo é o custo de uma chamada de IA, e a janela é de minutos.

## 3. C3: reserva de cota órfã no handler de stream

**Onde:** `server/routes/ai.ts:298` reserva a vaga; os quatro caminhos de saída
seguintes (mensagens inválidas em `:323` e `:336`, payload grande em `:342`, chave
da OpenAI ausente em `:346`) fazem `return next(createError(...))` **sem logar**,
então a reserva fica em `reserved` e ocupa uma vaga da cota da pessoa até expirar
em 10 minutos.

O handler não-streaming do mesmo arquivo (`:67`) faz o certo e fecha todas as
saídas. É uma assimetria entre dois handlers irmãos, não uma falha do mecanismo
compartilhado: `logAiUsage` procura a reserva por `(usuario, tool)` e a converte,
e isso funciona.

**Alcance:** `/api/ai/stream` é a rota genérica, então atinge **toda tool servida
por ela**, não só o `resume-builder` onde as 3 órfãs foram observadas.

**Por que não agora:** fora do escopo da Fase 2, e o conserto bom não é uma linha
por saída (isso repete o defeito) e sim um wrapper que libere no `finally`.
**Vira demanda própria.** Detalhe completo em `docs/erro-engolido.md`.

**Custo de deixar:** até uma vaga de cota por 10 minutos, por falha, por pessoa.
As 3 linhas órfãs observadas não foram removidas (limpeza de dado precisa de
autorização).

## 4. Teto global de 50/dia apertado para assinante Pro

**Onde:** `server/lib/env.ts:100`, `AI_DAILY_LIMIT_PRO` com default `50`.

**Por que entra aqui:** a Fase 2 tirou o chat de intake da cota global (a
`20260730170000` acrescenta `roadmap-intake-chat` à lista canônica de exclusões),
o que **alivia** o teto, mas não o revisa. As ferramentas que continuam contra os
50 são as demais tools Pro, e ninguém mediu se 50 é o número certo para quem paga.

**Por que não agora:** é decisão de produto, não de engenharia, e mudar o número
sem medir a distribuição de uso trocaria um palpite por outro.

**Como decidir depois:** o funil do P2 e `ai_usage_logs` já têm o dado. A pergunta
respondível é "quantos assinantes Pro chegam a 50 num dia, e em quais tools".

## 5. 26 valores de `project` em texto livre nos roadmaps antigos

**Onde:** coluna `ai_roadmaps.roadmap`, campo `project` dos passos folha.

**Medido em produção em 2026-07-31**, contra `shared/projects/catalog.ts` (168 ids):

| Medida                                       | Valor  |
| -------------------------------------------- | ------ |
| Passos com `project` preenchido              | 43     |
| Valores distintos                            | 32     |
| Valores que SÃO id do catálogo               | 6      |
| Valores em **texto livre**, fora do catálogo | **26** |

Os 26 não são ids deformados: são frases inteiras, do tipo "Crie um conjunto de
testes para uma das funcionalidades da sua API e execute-os." O gerador antigo
preenchia `project` com a descrição de um exercício em vez do id de um projeto do
catálogo.

**Efeito:** esses passos caem em "projeto indisponível" na tela, porque o lookup
não acha o id.

**Por que não agora:** é dívida de **dado**, não de código, e o conserto é uma
migration de DML sobre `jsonb` de linhas de usuário. Isso é alteração de dado
existente, então cai na **janela de migration destrutiva** (05h-09h, backup
confirmado) e merece a Fase 3, com o enriquecimento do prompt que impede o caso de
voltar a acontecer.

**Cuidado registrado para quem for fazer:** o número 26 é de hoje e sobe a cada
roadmap gerado pelo prompt atual. Corrigir o dado sem corrigir o gerador é enxugar
gelo; a ordem certa é gerador primeiro, backfill depois.

## 6. Ledger de migrations do Supabase parado desde maio

**Onde:** `docs/debito-ledger-migrations.md`, documento próprio e completo.

**Resumo:** 114+ arquivos no repositório, 16 versões registradas no
`supabase_migrations.schema_migrations`. As migrations vêm sendo aplicadas pelo
SQL editor, que não escreve no ledger. O schema está certo; o registro é que
mentiu.

**Novidade da Fase 2:** a primeira órfã real foi encontrada
(`20260713160000`), e a decisão foi **superá-la, não aplicá-la**. Ela é a primeira
entrada conhecida que um backfill futuro precisa marcar como _superada_, não como
_aplicada_ nem como _pendente_.

**Por que não agora:** o backfill seguro exige ensaio em dois projetos Supabase
descartáveis (restaurar backup num, aplicar migrations do zero no outro, `db diff`
entre os dois). É fase própria, com custo próprio.

## 7. Auditoria Q1.c: fase 1 feita, fase 2 dimensionada

**Onde:** `docs/auditoria-pontos-cegos-guard.md`.

**Fase 1 (bloqueante): FEITA e limpa.** As 6 tabelas do caminho de deploy
(`ai_usage_logs`, `ai_roadmaps`, `roadmap_completions`, `user_progress`,
`user_roadmap_progress`, `certificates`) foram conferidas arquivo × produção nos
quatro objetos invisíveis ao guard: policies (expressões `USING`/`WITH CHECK`),
check constraints, triggers e defaults. **Zero divergência.**

**Fase 2 (inventário): DIMENSIONADA, não auditada item a item.** O tamanho do
campo cego está medido, e é este:

| Categoria                                   | Em produção | Verificado pelo guard     |
| ------------------------------------------- | ----------- | ------------------------- |
| Policies (expressão)                        | 68          | não                       |
| Índices                                     | 267         | não                       |
| Check constraints                           | 106         | não                       |
| Triggers                                    | 27          | não                       |
| Defaults de coluna                          | 347         | não                       |
| Migrations sem rastro estrutural (DML/cron) | 21 de 123   | impossível por construção |

**O que falta:** conferir esses objetos um a um, fora do caminho de deploy. Não
foi feito porque o retorno é baixo comparado ao custo, e porque a ferramenta certa
não é inspeção manual e sim o ensaio descrito no item 6, que responde
"o que existe está declarado, com a mesma forma?" sem depender de um parser.

**Consequência prática para a Fase 4**, que precisa de migration destrutiva:
qualquer coisa que ela dependa nessas cinco categorias precisa de verificação
escrita à mão, no molde da asserção comportamental de `ai_usage_excluded_tools()`,
afirmando o **conteúdo** por igualdade de conjunto e não a existência.

## 8. Rede em tempo de import na suíte de testes (local, nunca no CI)

**Onde:** `server/lib/redis.ts:17` e `:64`. As duas conexões são criadas no
**import do módulo**, com `lazyConnect: false`:

```ts
export const queueConnection = env.redisUrl ? new IORedis(env.redisUrl, {...
export const cacheConnection = env.redisUrl ? new IORedis(env.redisUrl, {...
```

**Efeito:** qualquer teste que importe esse módulo, direto ou transitivamente,
abre TCP para o Redis de **produção**, e é flaky por construção. Observado uma
vez em 2026-07-31 durante esta demanda, com
`getaddrinfo EAI_AGAIN tramway.proxy.rlwy.net` na saída da suíte.

**Por que o CI não é afetado:** o job `qualidade` não recebe secret nenhum, então
`REDIS_URL` é vazia, `env.redisUrl` é falsy e nenhuma conexão é criada. O guard
estrutural aqui é o mesmo que o `CLAUDE.md` elogia: o CI **não tem** a variável,
não a simula.

**Quem é afetado:** rodadas locais e a **primeira rodada do pre-commit**, que
roda na árvore principal com `.env`. A segunda rodada do hook é imune, porque
renomeia o `.env`.

**Por que não agora:** `redis.ts` é infraestrutura compartilhada por várias
frentes, e torná-lo lazy muda o comportamento de fila e cache em produção. Não é
conserto de passagem, e não é da Fase 2.

**Custo de deixar:** ruído e instabilidade em rodada local. Zero em CI.

## 9. O episódio do índice sujo, e a cadeia que ele custou

**A causa raiz de quatro rodadas de retrabalho, e ela cabe numa frase:** eu deixei
um arquivo meu no índice do git entre duas operações, e a outra frente commitou.

A cadeia, em ordem:

1. `docs/runbook-deploy-roadmap-ia-fase2.md` ficou **staged** enquanto eu fazia
   outra coisa.
2. A frente de admin rodou `git commit` e o arquivo foi junto. **139 linhas do
   runbook entraram em `5674aee` e `f3edd26`**, dois commits de reembolso.
3. Isso criou uma dependência invisível: o runbook passou a existir só dentro de
   commits que não eram meus.
4. No rebase da fase, o `CLAUDE.md` conflitou entre duas versões da própria frente
   de admin, e o rebase abortou.
5. Nasceu a `fase2-rebaseada`, que para resolver arrastou **14 commits da outra
   frente** já superados na `main`.
6. Nasceu a `fase2-limpa`, com cherry-pick de 23 commits, que conflitou **três
   vezes** no mesmo runbook.
7. Descobriu-se que **18 dos 22 já estavam na `main`**, carregados pela merge, e
   que todo o esforço de branch tinha sido para um caminho que ninguém usou.

**Custo:** quatro rodadas de preparação, três branches descartáveis, e um plano de
freeze que nunca foi executado.

**A regra que evita:** com duas frentes na mesma árvore, `git add` e `git commit`
são **um** ato, nunca dois separados por outra tarefa. E `git commit <pathspec>`
em vez de `git add` + `git commit`, porque o pathspec ignora o índice para tudo o
que não foi nomeado.

**A regra maior, que é o aprendizado da fase:** quando duas frentes dividem a
árvore, **a branch não é a unidade de deploy.** Planejar fast-forward de uma
branch que a outra frente também usa é planejar para um mundo que não existe. Ou
as frentes se isolam em worktrees de verdade, ou o deploy é da `main`, e a
"branch da fase" é só um lugar de trabalho.

## 10. `schema_mismatch` no chat de intake (entrada da Fase 3)

**Primeiro achado que a observabilidade do P2 produziu sozinha.** Antes dela, estes
7 turnos seriam invisíveis.

**Medido em 2026-08-04**, sobre 101 turnos pós-deploy:

| Medida                               | Valor                                |
| ------------------------------------ | ------------------------------------ |
| Turnos com `schema_mismatch`         | **7** de 101 (6,9%)                  |
| Pessoas afetadas                     | **1** (`a618848e`)                   |
| Janela                               | 5 minutos, 03/08 entre 23:23 e 23:28 |
| `input_chars` / `output_chars` nos 7 | **0** nos dois                       |

**O padrão, e ele é tranquilizador:** a pessoa **conseguiu o roadmap**
(`ia-70f4bc45`, `ready`, 23:28:19). A sequência dela foi 7 turnos bons, 3 erros,
**2 turnos bons**, 4 erros, e então a geração completa. Ou seja: o erro é
transitório, o botão de "tentar de novo" (que só aparece em `transient`, por
desenho desta fase) **funcionou**, e ela atravessou.

**O que o dado sugere e o que ele não prova:**

- `input_chars = 0` significa que o callback de I/O nunca disparou, então a falha
  está na validação da resposta do modelo, não na chamada.
- Os erros começam com o histórico já grande (o último turno bom antes deles tinha
  7422 chars de entrada) mas **não há limiar**: dois turnos bons aconteceram
  depois, com 8254 e 8814 chars. Não é comprimento.
- Cada linha de erro representa uma requisição que **esgotou as 3 tentativas
  internas**. Os 7 são 7 requisições, não 7 tentativas.
- **Não sabemos qual campo do `IntakeProposalSchema` falhou**, porque
  `classificarFalhaDeTurno` guarda só o código `schema_mismatch`, sem o feedback
  do Zod. Foi decisão de privacidade deliberada (o detalhe cru pode conter a fala
  da pessoa), e o preço aparece agora.

**Para a Fase 3:** gravar o **caminho do campo** que falhou (`issues[].path` do
Zod), que não é conteúdo do usuário e por isso não fere a regra de privacidade.
Sem isso, o diagnóstico para em "o modelo errou o schema" e não avança.
