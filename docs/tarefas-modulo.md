# Módulo Tarefas (aba `#tarefas` do admin)

Board Kanban interno para backlog, features, melhorias e débito técnico.
Construído em seis fases entre 27 e 28 de julho de 2026.

Este documento existe para quem abrir o módulo daqui a um ano entender **por que**
cada decisão foi tomada, sem precisar reabrir seis conversas. O roteiro de teste
manual é o `docs/smoke-tarefas.md`.

## Onde as coisas estão

| Camada | Arquivo |
| --- | --- |
| Schema | `supabase/migrations/20260727160000_create_admin_tasks.sql` |
| API | `server/routes/adminTasks.ts`, montada em `/api/admin/crm` |
| Posição fracionária | `server/lib/adminTaskPosition.ts` |
| Tipos do domínio | `client/src/components/admin/tasks/types.ts` |
| Service | `client/src/services/adminTasksService.ts` |
| UI | `client/src/components/admin/tasks/` |
| Aba | `client/src/pages/Admin.tsx` (`adminNavItems` + bloco `AdminSection`) |

Oito tabelas, todas com prefixo `admin_task*`: `admin_task_boards`,
`admin_task_columns`, `admin_tasks`, `admin_task_labels`,
`admin_task_label_links`, `admin_task_comments`, `admin_task_checklist_items`,
`admin_task_activity`.

O módulo de referência para estilo, tratamento de erro e padrão de update
otimista é o `client/src/components/admin/BugsDashboard.tsx`. Onde este módulo se
afasta dele, o motivo está registrado abaixo.

## Por que o mount é `/crm` e não `/tasks`

O recurso "tarefa" precisa viver em `/crm/tasks`. Se o router morasse em
`/tasks`, as tarefas teriam que ficar na raiz dele, e `/tasks/boards` competiria
com `/tasks/:id` funcionando só pela ordem de declaração. É armadilha pronta para
quem adicionar uma rota nomeada depois.

## Decisões estruturais

### Posição fracionária, não índice sequencial

`admin_tasks.position` é `double precision`. Mover um card reescreve **uma**
linha, não a coluna inteira.

O modo de falha é silencioso: ponto médio repetido no mesmo intervalo esgota a
precisão do double em ~50 inserções, dois cards empatam e a ordem passa a ser a
que o banco devolver. Por isso `positionBetween` **não devolve `number`**: devolve
`{kind:"ok"} | {kind:"rebalance"}`, e não existe caminho que entregue um número
sem o chamador tratar o esgotamento. O rebalanceamento acontece **dentro** de
`resolveTaskPosition`, nunca no call site — é o que impede uma rota nova de
esquecer dele.

Esse caminho nunca roda no uso normal, então tem teste de integração contra
Postgres e PostgREST reais em `server/routes/adminTasks.rebalance.test.ts` (60
inserções no mesmo intervalo). Ele pula por padrão; as instruções de Docker estão
no cabeçalho do arquivo e no passo 22 do smoke.

**Semântica dos vizinhos** (o par de nomes que todo mundo troca): `before_task_id`
é o card que fica **acima** na ordem final, `after_task_id` o que fica **abaixo**.
A referência é sempre o estado final desejado, nunca o anterior.

### Um caminho só de movimentação

Setas de avanço rápido, drag and drop e o select de Etapa do modal chamam a
**mesma** `moveTaskTo`, com o mesmo contador de sequência e o mesmo rollback.
Dois caminhos com a mesma responsabilidade divergem no primeiro conserto que só
um dos dois recebe.

O rollback é **por tarefa**, não do snapshot inteiro: restaurar o snapshot
desfaria movimentos posteriores já gravados. E há um contador de sequência por
tarefa, aplicado **no sucesso e no erro** — se um segundo move já partiu, nem o
erro nem a resposta atrasada do primeiro tocam o estado.

### Regra das mutações otimistas (leia antes de escrever a próxima)

Este módulo aprendeu a mesma lição **três vezes**, em lugares diferentes, e nas
três o sintoma foi o mesmo: a tela mostrando um estado plausível e errado, sem
nenhum erro em log nenhum. Duas regras, e as duas são sobre **escopo**.

**1. Um contador de sequência POR OPERAÇÃO.** Nunca compartilhado entre recursos
diferentes, nem entre operações que escrevem campos diferentes do mesmo recurso.

Duas requisições só são obsoletas uma em relação à outra quando disputam **o
mesmo estado**. Um contador compartilhado faz a resposta boa de uma ser
descartada como "atrasada" por causa da outra — e o descarte é silencioso por
construção, porque a guarda existe justamente para não fazer barulho.

**2. Rollback e merge apenas dos campos que a operação tocou.** Nunca o objeto
inteiro, nunca o snapshot inteiro.

Guardar `previous` completo é cômodo e errado: no momento do rollback, o objeto
pode ter recebido escritas de **outra** operação que já foi gravada no servidor.
Restaurá-lo por inteiro desfaz na tela algo que existe no banco. O mesmo vale
para o caminho de sucesso: a resposta traz o recurso como ele estava quando
aquela requisição partiu, e aplicá-la inteira sobrescreve o que chegou depois.

Vale para os **dois** caminhos, sucesso e erro. Errar só no sucesso é mais fácil,
porque o erro é o que a gente imagina ao escrever.

#### Os três episódios

| # | Onde | O que aconteceu |
| --- | --- | --- |
| 1 | `useBoardSnapshot` | A lista de quadros e o snapshot dividiam **um** contador. Criar um quadro disparava `reloadBoards()` e, logo depois, um `refresh()` do snapshot; a resposta da lista chegava com selo antigo e era **descartada**. O quadro era buscado com sucesso e jogado fora — sumia do seletor até algum outro evento refazer a lista. |
| 2 | `patchTaskProperty` | Não tinha contador **nenhum**. Duas alterações rápidas na mesma tarefa corriam sem guarda, e a resposta da primeira sobrescrevia a segunda. |
| 3 | `patchTaskProperty` | Guardava o objeto **inteiro** para o rollback. Desarquivar um card, movê-lo com a seta enquanto o patch estava no ar, e o patch falhar: o rollback devolvia `column_id` junto e o card voltava para a coluna antiga, desfazendo na tela um movimento que o servidor já tinha gravado. |

O 3 é literalmente o defeito que o "Um caminho só de movimentação" acima já
descrevia e que `moveTaskTo` já corrigia. Ele foi reintroduzido meses depois numa
operação nova, por quem tinha escrito a correção. **Conhecer a regra não bastou;
por isso ela está escrita aqui.**

Cada um dos três foi **reproduzido em teste antes do conserto** e cada correção
tem controle negativo: `useBoardSnapshot.seq.test.tsx` e
`TasksDashboard.patchRace.test.tsx`. O de compartilhar contador é instrutivo ao
contrário — reunir `patchSeqRef` e `moveSeqRef` num só deixa o teste vermelho,
porque cancelar uma operação pela outra é o mesmo defeito de cabeça para baixo.

### RLS sem policy, mais REVOKE

Todas as oito tabelas têm `enable row level security` e **zero policies**, igual a
`admin_bugs` e `notifications`. Todo acesso passa pelo server com service role
atrás de `requireAuth` + `requireAdmin`.

O `REVOKE` é camada **separada**, não redundância: RLS sem policy nega **linha**,
o REVOKE nega o **acesso à tabela**. A auditoria do projeto já confundiu as duas
uma vez (35 tabelas reportadas como cobertas por policy quando estavam cobertas
por privilégio), então aqui as duas são explícitas.

### Numeração pelo banco, não pela aplicação

O `DEV-42` vem de um `BEFORE INSERT` trigger (`assign_admin_task_number`), não de
uma RPC. O `UPDATE ... RETURNING` pega lock da linha do board dentro da mesma
transação do insert, então inserts concorrentes serializam. Sendo trigger, vale
também para insert feito fora da rota — uma RPC só protegeria quem lembrasse de
chamá-la. Verificado com 40 inserts concorrentes: 40 números distintos.

Buraco na sequência é aceito: insert que falha depois do trigger queima o número,
exatamente como uma sequence do Postgres. Numeração de card é identidade, não
contagem.

`key` e `slug` do board são **imutáveis** — o ID curto circula em deep link.

### Log de atividade denormalizado

`admin_task_activity.payload` guarda o **rótulo legível** no momento da escrita
(nome da etiqueta, da coluna, do responsável), com o id junto.

Guardar só o id faz o histórico se reescrever sozinho: renomear "Urgente" para
"Crítico" mudaria o que uma linha de seis meses atrás diz, e excluir a etiqueta
transformaria a linha num buraco. O caso pior era `label_removed`, porque a
etiqueta costuma ser excluída logo depois; a rota lê o nome **antes** de
desvincular.

Exceção deliberada: o **nome do ator** é resolvido ao vivo contra a lista de
admins. Etiqueta renomeada muda o significado do evento; pessoa renomeada é a
mesma pessoa.

O log é escrito no mesmo handler da mutação e é **best-effort**: o supabase-js
não expõe transação, então quando o log falha a mutação já foi confirmada.
Falhar a resposta mentiria "não salvou" sobre algo que salvou.

### Lookup por valor do servidor sempre com fallback

`priorityMetaOf`, `typeMetaOf`, `activityLineOf`, `activityDotOf`, `safeHexColor`
e o `readViewState` nunca acessam mapa direto. O bundle no navegador pode ser
mais antigo que o backend (Vercel e Railway sobem separados), e
`MAPA[valor].label` com um valor novo derruba a aba inteira. Regra do
`CLAUDE.md`, e o precedente é `notificationTypeMetaOf`.

### Nada perde texto digitado

O autosave do modal (`useAutoSave.ts`) tem quatro portas de saída: `Esc`, clique
fora, trocar de tarefa e F5. As três primeiras passam pelo mesmo `requestClose`,
que **aguarda** o flush; o F5 cai no aviso de `beforeunload`, porque o navegador
não espera requisição durante o unload e fingir que salvou seria pior que avisar.

Falha de gravação **devolve o patch para a fila** em vez de descartar. O composer
de comentário faz o mesmo com o texto.

### Filtro no cliente, e o que ele quebra

Busca e filtros rodam sobre o snapshot já carregado. É instantâneo e elimina uma
família inteira de estados de carregamento. **Limite**: para de valer quando um
quadro passar de alguns milhares de tarefas — aí o gargalo deixa de ser o filtro e
passa a ser o snapshot, e a troca certa é paginar o snapshot. A única exceção é o
toggle de arquivadas, que muda o que o servidor devolve.

A busca é **substring literal**, nunca padrão: `%`, `_` e `\` são caracteres
comuns por construção. Se um dia migrar para o servidor, precisam ser escapados
no `ilike` — é a mesma classe do `50% pronto` que apareceu na criação inline de
etiqueta.

**Filtro ativo desabilita a reordenação dentro da coluna.** Com cards ocultos
entre dois visíveis, o ponto médio cai em posição arbitrária em relação aos
ocultos: a tela fica certa e a ordenação real fica indefinida, e ninguém percebe
até limpar o filtro. Mover entre colunas continua valendo, entrando no fim (que
não depende de vizinho). Mesma regra com agrupamento fora de etapa, onde a
posição não tem significado — ali soltar altera a **propriedade**.

Toda essa semântica mora em `resolveBoardDrop.ts`, função pura e testada; o
`handleDragEnd` só despacha.

### Estado na URL

`?section=`, `?task=`, e agora busca, filtros, agrupamento, visão e arquivadas.
Nenhuma função monta a query do zero: todas recebem a search atual e preservam o
que não é delas. É o que torna "todas as atrasadas do fulano" um link
compartilhável e faz voltar/avançar funcionar sem estado espelhado.

### Controle negativo obrigatório

Toda suíte nova é quebrada de propósito depois de ficar verde, para provar que
fica vermelha. O procedimento pegou **duas asserções falso-verdes** em fases
seguidas:

- Fase 3: "alguma posição é múltiplo de 1000" passaria sem rebalanceamento
  nenhum, porque tarefas criadas no fim já nascem em múltiplos de 1000. Trocado
  pelo sinal inequívoco: a posição de um card que ninguém moveu mudou.
- Fase 4: comparação de índices num vetor de eventos passava com `void flush()`
  no lugar de `await flush()`, porque a ordem de *invocação* não distingue nada.
  Trocado por prender a resposta e afirmar que o fechamento não acontece.

Cada quebra e cada restauração (conferida por md5) estão nos relatórios de fase.

## Quando ARQUIVAR uma issue no Sentry em vez de resolver

Procedimento operacional, escrito em 2026-08-31 depois de medir o ciclo abaixo.

### O ciclo que este procedimento evita

Mover um card para Concluído empurra `resolved` à issue no Sentry
(`server/routes/adminTasks.ts:1457`, via `alvoDaTransicao`). A documentação do
Sentry é explícita: *"A plain **Resolve** treats any later event as a
regression"*. Então, quando um evento novo chega:

1. o Sentry marca a issue como regressão e volta o status para `unresolved`;
2. o Sentry manda e-mail de regressão;
3. a varredura do CRM vê um evento posterior ao `completed_at` e reabre o card.

Para erro que **nunca vai parar de acontecer**, esse ciclo não tem fim. Medido:
`chunk_reload` (`BORANATECH-FRONT-R`) e `vite_preload_error`
(`BORANATECH-FRONT-T`) foram marcados como regressão em três releases seguidas
(`832e5208`, `6a57d4d2`, `8f2f2d39`), porque eles medem **deploy**, não falha:
todo deploy troca o bundle, uma aba antiga tenta carregar um chunk que não existe
mais, e o evento chega.

### Quando arquivar em vez de resolver

Arquive quando o card não descreve um defeito a corrigir, e sim um fato que o
produto vai continuar produzindo. Duas famílias, ambas já mapeadas:

- **Telemetria que mede recuperação, não falha.** O sinal existe para medir, e
  disparar é o comportamento correto do mecanismo.
- **Ambiente do usuário.** Senha errada, e-mail já cadastrado, link de e-mail
  expirado, consentimento negado. Não há correção de produto possível.

Resolva (Concluído normal) quando houve **conserto**: o erro deve parar de
acontecer, e se voltar você QUER saber. A regressão do Sentry é exatamente o
alarme certo nesse caso, e continua funcionando.

### Os candidatos de hoje

Medição de 2026-08-31 sobre `admin_task_activity`, contando reaberturas feitas
pelo job (`action = 'reopened'` com `payload->>'origem' = 'sentry'`). Cinco
cards, de 57 vinculados, com duas reaberturas cada, e os cinco são das duas
famílias acima:

| Card | Título | Issue | Família |
| --- | --- | --- | --- |
| 61 | `chunk_reload` | `BORANATECH-FRONT-R` | telemetria de deploy |
| 64 | `vite_preload_error` | `BORANATECH-FRONT-T` | telemetria de deploy |
| 33 | `auth provider failure: access_denied` | `BORANATECH-FRONT-8` | ambiente do usuário |
| 35 | `auth provider failure: invalid_credentials` | `BORANATECH-FRONT-6` | ambiente do usuário |
| 40 | `auth provider failure: otp_expired` | `BORANATECH-FRONT-B` | ambiente do usuário |

Nenhum card tinha três ou mais reaberturas, mas o log de atividade só existe
desde 29/07 (289 linhas). A janela de 33 dias sustenta *quais* cards concentram
o problema, não uma frequência.

### Como fazer, e o que acontece depois

**No painel do Sentry**, na issue: use Archive. Não há gesto no CRM que faça
isso, e a ausência é deliberada (ver abaixo).

**Do lado do CRM**, a partir de `a8d398f5`: `decidirManutencao`
(`server/lib/sentryTaskDecisions.ts`) passa a NÃO reabrir card concluído cuja
issue esteja arquivada. O card fica em Concluído, o selo "Voltou" não aparece, e
o motivo registrado no log é `"concluido, evento novo em <data> mas issue
arquivada no Sentry (ignored)"`, que se distingue de `"concluido, sem evento
novo"`.

**Estado ausente não é decisão.** Se a issue não vier no lote da varredura, ou
vier com status desconhecido, o comportamento é o de sempre: reabrir por data.
Não saber não pode virar "está silenciada".

### ARQUIVAR É PERMANENTE até alguém desarquivar

Este é o ponto que mais importa saber antes de clicar, e ele foi **medido**, não
suposto, em 2026-08-31 contra a issue `NODE-EXPRESS-6` (com desfazer conferido):

- `PUT {"status":"ignored"}` grava `substatus: "archived_forever"`, e **não**
  "arquivado até escalar";
- as duas formas de pedir o modo "até escalar" (`substatus` no corpo e
  `statusDetails.ignoreUntilEscalating`) foram **aceitas com HTTP 200 e
  silenciosamente ignoradas**, o que é pior que um 400: quem confiasse na
  resposta acharia que configurou;
- `muted` é apelido: a API persiste `ignored`.

Consequência prática: **se o erro voltar a ser um problema de verdade, ninguém
avisa.** O Sentry não vai desarquivar por volume, e o CRM não vai reabrir o card.
Arquivar é dizer "eu decido não olhar mais isto", e a revisão dessa decisão é
humana.

### Por que o CRM não arquiva sozinho

Foi considerado e descartado no mesmo dia, pelo motivo acima. Empurrar o
silenciamento automaticamente transformaria uma decisão permanente e sem revisor
num efeito colateral de arrastar um card. `AlvoDoPush`
(`server/lib/sentryTaskPush.ts:34`) segue com `resolved` e `unresolved` só. O
gesto de silenciar fica com quem olha o Sentry; o CRM apenas parou de discordar
dele.

## O que ficou de fora, e por quê

| Item | Motivo |
| --- | --- |
| **Anexos** | Só existe o bucket `avatars`, com pipeline de imagem próprio. Precisa de bucket novo, política de tamanho e limpeza — projeto à parte. |
| **Calendário** | Cortado do escopo. Não há abstração especulativa esperando por ele: a visão é `"board" \| "lista"` e ponto. |
| **Comentários paginados** | O histórico é paginado porque cresce sozinho (uma linha por campo alterado). Comentário é escrito por gente e não passa de algumas dezenas. O padrão está pronto ao lado se virar problema. |
| **Unificação dos três `timeAgo`** | Existem três implementações locais e não exportadas (`BugsDashboard`, `NotificationsPanel`, `VagasJobCard`), nenhuma com relógio injetável. `relativeTime.ts` é a quarta, e a única testada. Unificar é refactor fora do escopo do módulo. |
| **Realtime entre abas** | O projeto não usa Supabase Realtime em lugar nenhum. Introduzir aqui seria a primeira vez. |
| **Ledger de migrations** | 114 migrations no repo, 16 registradas. Levantamento, risco e opções em `docs/debito-ledger-migrations.md`. É PR de infra, não de feature. |
| **`AdminSectionId` derivado** | O tipo é uma união escrita à mão enquanto `ADMIN_SECTION_IDS` é derivado de `adminNavItems`. Duplicação pré-existente, sinalizada e mantida fora do escopo. |

## Dependências acrescentadas

`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` e `remark-gfm`. Quatro
pacotes, sem transitivas relevantes. O dnd-kit foi necessário porque o HTML5 drag
do `BugsDashboard` não dispara em toque e não tem navegação por teclado.

## O que ainda não foi verificado

**O smoke manual dos passos 17 a 36 nunca rodou.** Todo o resto foi verificado por
`tsc`, pela suíte e, no caso do banco, contra Postgres real. Em especial:

- a constante de toque do `TouchSensor` (`delay: 220, tolerance: 6`) foi escolhida
  sem validação em tela real, e é o número que só o dedo valida;
- o **auto-scroll** do dnd-kit não foi configurado nem verificado, e o board tem
  containers de rolagem aninhados (coluna vertical dentro de board horizontal),
  que é onde o padrão costuma precisar de ajuste.
