# Smoke test: aba Tarefas (API, montada em /api/admin/crm)

Documento versionado de propósito. Checklist de release que vive só na conversa
some numa compactação de contexto, e já sumiu uma vez no meio do deploy que ele
existia para validar. Se um passo mudar, ele muda aqui.

Cobre a **Fase 1** (schema + API). Não há UI nesta fase: tudo é curl.

## Pré-requisitos

1. **A migration precisa estar aplicada no banco alvo.** Enquanto não estiver,
   todo endpoint deste documento responde 500 `db_error`, e o
   `pnpm check:migrations` lista as 8 tabelas como ausentes. Ordem correta:
   código no ar primeiro, migration depois (`db:push` ou o SQL no editor), e só
   então este smoke.
2. `pnpm check:migrations` verde contra o banco alvo.
3. Um token de um usuário com linha em `admin_roles`.

```bash
# Ambiente
set -a && . ./.env && set +a
BASE=http://localhost:3100          # produção: https://<railway>/
TOKEN='<access_token do usuário admin>'
AUTH=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")
```

Para pegar o token no navegador, logado como admin, no console:

```js
JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token")))).access_token
```

## 0. Guarda de acesso (fazer PRIMEIRO)

O módulo inteiro é interno. Antes de qualquer coisa, confirme que ele está
fechado; um board de roadmap interno aberto é vazamento, não bug cosmético.

```bash
# Sem token -> 401
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/admin/crm/boards"

# Token de usuário NÃO admin -> 403
curl -s -o /dev/null -w '%{http_code}\n' \
  -H "Authorization: Bearer $TOKEN_NAO_ADMIN" "$BASE/api/admin/crm/boards"

# Leitura direta pelo PostgREST com a chave anon -> NÃO pode devolver linha
curl -s -o /dev/null -w '%{http_code}\n' \
  "$VITE_SUPABASE_URL/rest/v1/admin_tasks?select=id&limit=1" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY"
```

Esperado: `401`, `403`, e na terceira um `401`/`404` (nunca `200` com linhas).

## 1. Seed chegou

```bash
curl -s "${AUTH[@]}" "$BASE/api/admin/crm/boards" | jq '.boards[] | {key, name}'
BOARD=$(curl -s "${AUTH[@]}" "$BASE/api/admin/crm/boards" | jq -r '.boards[0].id')

curl -s "${AUTH[@]}" "$BASE/api/admin/crm/boards/$BOARD/snapshot" \
  | jq '{colunas: [.columns[].name], etiquetas: [.labels[].name], admins: (.admins | length)}'
```

Esperado: board `DEV` / Desenvolvimento; as etapas na ordem
`Backlog, A Fazer, Em Progresso, Em Revisao, Concluido`; 6 etiquetas; ao menos
1 admin.

## 2. Criação de tarefa e ID curto

```bash
COL=$(curl -s "${AUTH[@]}" "$BASE/api/admin/crm/boards/$BOARD/snapshot" | jq -r '.columns[0].id')

curl -s "${AUTH[@]}" -X POST "$BASE/api/admin/crm/tasks" \
  -d "{\"board_id\":\"$BOARD\",\"title\":\"primeira tarefa\",\"priority\":\"alta\",\"type\":\"feature\"}" \
  | jq '{number, title, priority, column_id, completed_at, created_by}'
```

Esperado: `number` começa em 1 e **incrementa a cada criação**; `completed_at`
nulo (a coluna inicial não é terminal); `created_by` é o id do seu usuário.

**Verificação que importa:** o `number` é do banco, não do cliente. Mande um
`number` no corpo e confirme que ele é **ignorado**:

```bash
curl -s "${AUTH[@]}" -X POST "$BASE/api/admin/crm/tasks" \
  -d "{\"board_id\":\"$BOARD\",\"title\":\"numero forjado\",\"number\":999}" | jq '.number'
```

Esperado: o próximo da sequência, nunca `999`.

## 3. Movimentação, ordem e `completed_at` derivado

```bash
T1=$(curl -s "${AUTH[@]}" -X POST "$BASE/api/admin/crm/tasks" \
  -d "{\"board_id\":\"$BOARD\",\"title\":\"A\"}" | jq -r '.id')
T2=$(curl -s "${AUTH[@]}" -X POST "$BASE/api/admin/crm/tasks" \
  -d "{\"board_id\":\"$BOARD\",\"title\":\"B\"}" | jq -r '.id')
DONE=$(curl -s "${AUTH[@]}" "$BASE/api/admin/crm/boards/$BOARD/snapshot" \
  | jq -r '.columns[] | select(.is_done) | .id')

# Reordenar DENTRO da coluna: põe B antes de A
curl -s "${AUTH[@]}" -X PATCH "$BASE/api/admin/crm/tasks/$T2/move" \
  -d "{\"column_id\":\"$COL\",\"after_task_id\":\"$T1\"}" | jq '.position'

# Mover para a coluna terminal -> carimba completed_at
curl -s "${AUTH[@]}" -X PATCH "$BASE/api/admin/crm/tasks/$T1/move" \
  -d "{\"column_id\":\"$DONE\"}" | jq '{column_id, completed_at}'

# Voltar para uma coluna não terminal -> limpa completed_at
curl -s "${AUTH[@]}" -X PATCH "$BASE/api/admin/crm/tasks/$T1/move" \
  -d "{\"column_id\":\"$COL\"}" | jq '{column_id, completed_at}'
```

Esperado: `completed_at` preenchido ao entrar na terminal, `null` ao sair.
Nenhuma dessas chamadas envia `position` nem `completed_at`: os dois são do
server.

## 4. Etiquetas, inclusive a criação inline duplicada

```bash
L=$(curl -s "${AUTH[@]}" -X POST "$BASE/api/admin/crm/labels" \
  -d "{\"board_id\":\"$BOARD\",\"name\":\"Frontend\"}" | jq -r '.id')

# Nome que JÁ existe (caso comum da criação inline): 200 com a etiqueta existente
curl -s -o /dev/null -w '%{http_code}\n' "${AUTH[@]}" -X POST \
  "$BASE/api/admin/crm/labels" -d "{\"board_id\":\"$BOARD\",\"name\":\"frontend\"}"

# Nome com curinga de LIKE: tem que criar uma etiqueta nova, não devolver outra
curl -s "${AUTH[@]}" -X POST "$BASE/api/admin/crm/labels" \
  -d "{\"board_id\":\"$BOARD\",\"name\":\"50% pronto\"}" | jq '{name}'

# Aplicar duas vezes é idempotente
curl -s "${AUTH[@]}" -X POST "$BASE/api/admin/crm/tasks/$T1/labels" -d "{\"label_id\":\"$L\"}"
curl -s "${AUTH[@]}" -X POST "$BASE/api/admin/crm/tasks/$T1/labels" -d "{\"label_id\":\"$L\"}"
curl -s "${AUTH[@]}" "$BASE/api/admin/crm/tasks/$T1" | jq '.label_ids | length'
```

Esperado: `200` no nome repetido (case-insensitive); `50% pronto` criada como
etiqueta própria; `label_ids` com exatamente 1 item após aplicar duas vezes.

## 5. Etapas: exclusão com tarefas dentro

```bash
NOVA=$(curl -s "${AUTH[@]}" -X POST "$BASE/api/admin/crm/columns" \
  -d "{\"board_id\":\"$BOARD\",\"name\":\"Descartar\"}" | jq -r '.id')
curl -s "${AUTH[@]}" -X PATCH "$BASE/api/admin/crm/tasks/$T2/move" -d "{\"column_id\":\"$NOVA\"}" > /dev/null

# Sem moveTo -> 409 com a contagem na mensagem
curl -s "${AUTH[@]}" -X DELETE "$BASE/api/admin/crm/columns/$NOVA" | jq '.error'

# Com moveTo -> esvazia e exclui
curl -s "${AUTH[@]}" -X DELETE "$BASE/api/admin/crm/columns/$NOVA?moveTo=$COL" | jq
```

Esperado: `409 column_not_empty` na primeira; `{"ok":true}` na segunda, com a
tarefa preservada na etapa de destino.

## 6. Reordenação de etapas exige o conjunto COMPLETO

```bash
IDS=$(curl -s "${AUTH[@]}" "$BASE/api/admin/crm/boards/$BOARD/snapshot" | jq -c '[.columns[].id]')

# Lista parcial -> 400
curl -s "${AUTH[@]}" -X PATCH "$BASE/api/admin/crm/columns/reorder" \
  -d "{\"board_id\":\"$BOARD\",\"ids\":$(echo $IDS | jq -c '.[0:2]')}" | jq '.error.code'

# Lista completa invertida -> 200 e ordem nova
curl -s "${AUTH[@]}" -X PATCH "$BASE/api/admin/crm/columns/reorder" \
  -d "{\"board_id\":\"$BOARD\",\"ids\":$(echo $IDS | jq -c 'reverse')}" \
  | jq '[.columns[].name]'
```

Esperado: `incomplete_order` na parcial; ordem invertida na completa. Reverta
depois mandando `$IDS` original.

## 7. Comentários: só o autor edita

```bash
C=$(curl -s "${AUTH[@]}" -X POST "$BASE/api/admin/crm/tasks/$T1/comments" \
  -d '{"body":"comentario de teste"}' | jq -r '.id')

curl -s "${AUTH[@]}" -X PATCH "$BASE/api/admin/crm/comments/$C" -d '{"body":"editado"}' | jq '.body'

# Com o token de OUTRO admin -> 404 (não 403: a linha não casa o WHERE)
curl -s -H "Authorization: Bearer $TOKEN_OUTRO_ADMIN" -H "Content-Type: application/json" \
  -X PATCH "$BASE/api/admin/crm/comments/$C" -d '{"body":"invasao"}' | jq '.error.code'
```

## 8. Checklist e log de atividade

```bash
I=$(curl -s "${AUTH[@]}" -X POST "$BASE/api/admin/crm/tasks/$T1/checklist" \
  -d '{"content":"primeiro item"}' | jq -r '.id')
curl -s "${AUTH[@]}" -X PATCH "$BASE/api/admin/crm/checklist/$I" -d '{"is_done":true}' | jq '.is_done'

curl -s "${AUTH[@]}" "$BASE/api/admin/crm/tasks/$T1" \
  | jq '{checklist: (.checklist | length), atividade: [.activity[].action]}'
```

Esperado no log, sem passo manual nenhum: `created`, `moved`, `completed`,
`reopened`, `label_added`. O log é escrito pelo server dentro do mesmo handler
da mutação; nenhuma chamada deste documento pede para registrar atividade.

## 9. Contagens do snapshot

```bash
curl -s "${AUTH[@]}" "$BASE/api/admin/crm/boards/$BOARD/snapshot" \
  | jq '.tasks[] | {number, title, checklist_done, checklist_total, comment_count, label_ids}'
```

Esperado: os agregados batem com o que foi criado nos passos 4, 7 e 8.

## 10. Limpeza

```bash
for t in $T1 $T2; do curl -s "${AUTH[@]}" -X DELETE "$BASE/api/admin/crm/tasks/$t"; done
```

As tarefas criadas nos passos 2 e 3 também precisam sair. `admin_task_boards` em
cascata leva tudo junto, mas **não exclua o board DEV**: ele é o seed.

---

# Smoke test da interface (Fase 2, board e CRUD)

Em `/admin?section=tarefas`, logado como admin. Ainda **não há drag and drop nem
modal da tarefa**: mover é pelas setas do card e pelo menu da coluna.

Os passos 11 a 14 são os chatos, e são os que importam. Os automatizados estão em
`client/src/components/admin/tasks/TasksDashboard.optimistic.test.tsx`; a lista
abaixo é a conferência com rede e banco de verdade.

## 11. Etapa não-vazia (409 → escolher destino)

1. Crie uma etapa nova pelo botão **"+ Nova etapa"**.
2. Mova uma tarefa para ela com a seta `→`.
3. No menu da etapa (`⋯`), **Excluir etapa**, e confirme.

Esperado: o diálogo **não fecha**. Ele troca para a mensagem do servidor
(`A etapa tem 1 tarefa(s)…`) e mostra um select **"Mover as tarefas para"**. O
botão vira **"Mover e excluir"** e fica desabilitado até você escolher o destino.
Ao confirmar, a etapa some e a tarefa aparece na etapa escolhida.

## 12. Dois movimentos em sequência rápida

Clique na seta `→` do mesmo card **duas vezes seguidas, rápido**, atravessando
duas etapas.

Esperado: o card avança duas etapas e **fica lá**. Não pode voltar sozinho para a
etapa intermediária depois de um instante, nem para a original. Recarregue a
página: a etapa final tem que ser a mesma.

Para exercitar o caminho de erro, no DevTools use **Network → Offline** e clique
na seta: o card volta para a etapa de origem e aparece um toast de erro. Volte a
ficar online e recarregue para confirmar que o servidor concorda com a tela.

## 13. Criar tarefa com a rede falhando

1. DevTools → Network → **Offline**.
2. **"+ Nova tarefa"**, digite um título, `Enter`.

Esperado: o card aparece na hora, some sozinho quando a requisição falha, e um
toast informa o erro. **Não pode sobrar card fantasma nem duplicado** ao voltar
para online e recarregar.

Ainda online, digite três títulos seguidos com `Enter` entre eles: o campo
**continua aberto e focado** e as três tarefas aparecem, cada uma com seu ID
curto (`DEV-…`) depois que o servidor responde.

## 14. `?task=` e `?section=` juntos

1. Clique num card. A URL vira `/admin?section=tarefas&task=DEV-42` e o card
   ganha um anel violeta.
2. **F5.** Tem que voltar na aba Tarefas com o mesmo card destacado. Se cair em
   "Visão", a escrita do parâmetro comeu o `section`.
3. **Voltar** no navegador: sai o `task=`, o destaque some, a aba continua
   Tarefas.
4. **Avançar**: o destaque volta.
5. Troque para a aba **Bugs & Erros** e volte para **Tarefas**: o `task=` foi
   descartado (ele pertence a esta aba) e nada quebrou.
6. Edite a URL para `?section=tarefas&task=lixo` e recarregue: a tela carrega
   normal, sem destaque e sem erro no console.

## 15. Etapas: renomear, cor, WIP e ordem

- **Duplo clique** no nome da etapa: vira campo. `Enter` salva, `Esc` cancela e
  volta o nome anterior.
- Menu `⋯` → **Cor**: a faixa do topo da coluna muda na hora.
- Menu `⋯` → **Definir limite (WIP)**: informe `1` numa etapa com 2 ou mais
  tarefas. O contador vira `2/1` em vermelho. **Confirme que ainda dá para mover
  outra tarefa para lá**: o limite é aviso, não bloqueio.
- Menu `⋯` → **Mover para a esquerda/direita**: a coluna troca de lugar. Nas
  pontas as opções ficam desabilitadas. Recarregue e confirme que a ordem
  persistiu (se aparecer `incomplete_order`, a lista enviada não estava completa).

## 16. Estados vazios e responsivo

- Uma etapa sem tarefas mostra "Nenhuma tarefa nesta etapa", não espaço em branco.
- Um quadro sem etapas mostra o convite para criar a primeira.
- Em viewport de celular (DevTools, ~390px): as colunas rolam na horizontal com
  encaixe (snap) e as setas `←`/`→` dos cards ficam **sempre visíveis**, já que
  não existe hover em toque.

---

# Smoke test do drag and drop (Fase 3)

**Use um quadro sandbox, nunca o `DEV`.** Crie um board com key `TST` e apague no
fim; o cascade leva colunas, tarefas e etiquetas junto. O motivo não é só evitar
sujeira: criar e mover tarefa incrementa `next_number` de forma **irreversível**,
e testar no `DEV` deixaria buracos permanentes na numeração antes de existir uma
tarefa real.

## 17. Clique versus arrasto

O ponto mais fácil de quebrar da fase.

1. **Clique** num card sem mexer o mouse: abre `?task=`.
2. **Arraste** um card e solte: **não pode** abrir a tarefa ao soltar.
3. Arraste um card e solte **no mesmo lugar**: nada acontece, e o Network não
   mostra nenhum `PATCH /move`.
4. Clique nas setas `←`/`→`: move sem abrir a tarefa e sem iniciar arrasto.

## 18. Toque (obrigatório, e não é o mesmo teste do mouse)

No DevTools, ative **device toolbar** e um perfil de celular, para os eventos
serem de toque. Melhor ainda: abra pelo IP da rede (`http://192.168.x.x:3000`)
num celular de verdade.

Com **o mesmo dedo**, os três gestos precisam conviver:

1. **Deslizar para cima/baixo** sobre a lista: rola a coluna. Não pode arrancar
   o card.
2. **Deslizar para os lados** sobre o board: rola entre colunas.
3. **Pressionar e segurar (~0,2s) e então arrastar**: levanta o card.

Se o card sair junto com a rolagem, o `delay` do `TouchSensor` está curto demais;
se for difícil pegar o card, está longo. Está em `TasksDashboard.tsx`
(`activationConstraint: { delay: 220, tolerance: 6 }`).

## 19. Teclado

Com `Tab`, chegue a um card e pressione **espaço**. As setas movem, **espaço**
solta, **Esc** cancela. Com um leitor de tela ligado, os anúncios têm que sair em
**português** ("Tarefa TST-3 movida para Em Progresso, posição 2 de 5"), nunca em
inglês.

## 20. Colunas por arrasto

Arraste pela **alça** (o ícone de seis pontos à esquerda do nome). A coluna troca
de lugar; recarregue e confirme que persistiu. Se aparecer `incomplete_order`, a
lista enviada não continha todas as etapas.

## 21. WIP durante o arrasto

Defina limite `1` numa etapa que já tenha 1 tarefa e arraste outra por cima: a
coluna destaca em **vermelho** em vez de violeta. **Solte assim mesmo**: tem que
aceitar. O limite avisa, não bloqueia.

## 22. Rebalanceamento de posição

Coberto de forma automatizada contra um Postgres e um PostgREST reais, em
`server/routes/adminTasks.rebalance.test.ts`. Ele **pula por padrão** (o CI não
tem Docker) e roda assim:

```bash
docker network create bnt-test
docker run -d --name bnt-pg --network bnt-test -e POSTGRES_PASSWORD=test \
  -p 55432:5432 postgres:16-alpine

# prelude: schema auth, auth.users, set_updated_at, roles anon/authenticated,
# e um role apirole com bypassrls (o alvo aqui e a camada de dados, nao a RLS,
# que o check:migrations ja verifica contra producao).
psql -h localhost -p 55432 -U postgres -f <prelude.sql>
psql -h localhost -p 55432 -U postgres \
  -f supabase/migrations/20260727160000_create_admin_tasks.sql

docker run -d --name bnt-rest --network bnt-test -p 55433:3000 \
  -e PGRST_DB_URI="postgres://postgres:test@bnt-pg:5432/postgres" \
  -e PGRST_DB_SCHEMAS=public -e PGRST_DB_ANON_ROLE=apirole \
  -e PGRST_JWT_SECRET="reallyreallyreallyreallyverysafesecret" \
  postgrest/postgrest:v12.2.3

# BNT_PGREST_JWT: JWT HS256 com { "role": "apirole" }, assinado com o secret
# acima. Sem ele o PostgREST responde 401 ao header Authorization que o
# supabase-js sempre envia.
BNT_PGREST_URL=http://127.0.0.1:55433 \
BNT_TEST_USER_ID=<uuid em auth.users> \
BNT_PGREST_JWT=<jwt> \
  pnpm vitest run server/routes/adminTasks.rebalance.test.ts
```

Use **`127.0.0.1`, não `localhost`**: o `fetch` do Node resolve `localhost` para
IPv6 e o container só publica em IPv4.

Se algum dia for preciso conferir que esse teste ainda **discrimina**, o controle
negativo é trocar `MIN_POSITION_GAP` por `Number.MIN_VALUE` em
`server/lib/adminTaskPosition.ts` (desliga o rebalanceamento na prática) e
confirmar que ele fica vermelho. Restaure depois.

---

# Smoke test do modal (Fase 4)

Ainda no quadro sandbox. Abra uma tarefa clicando no card.

Os casos de perda de texto estão automatizados em
`TaskModal.autosave.test.tsx`, e os testes foram conferidos contra o controle
negativo (com `void flush()` no lugar de `await flush()` eles ficam vermelhos).
A lista abaixo é o que só o navegador mostra.

## 23. Abrir não trava esperando a rede

Com o DevTools em **Slow 3G**, clique num card: o modal abre **na hora** com
skeleton, e o conteúdo entra depois. Se a tela congelar antes de abrir, o
carregamento voltou a bloquear a abertura.

## 24. Fechar com alteração em voo

O caso que custa dado, e que tem quatro portas:

1. Digite na descrição e aperte **Esc imediatamente**, antes do debounce. O
   indicador mostra `salvando…`, o modal só fecha depois, e ao reabrir o texto
   está lá.
2. Mesma coisa clicando **fora** do modal.
3. Digite e navegue com **`↓`** para a próxima tarefa da etapa: grava a atual
   antes de trocar. Volte com `↑` e confirme.
4. Digite e aperte **F5**: o navegador precisa **avisar** que há alteração não
   salva. (Aqui não dá para gravar: o navegador não espera requisição durante o
   unload, então avisar é o comportamento correto.)

Repita o passo 1 com **Network → Offline**: aparece `erro ao salvar`, e o texto
digitado **não é descartado** — voltando a ficar online, a próxima gravação leva
o conteúdo.

## 25. Etapa pelo select move de verdade

Mude a **Etapa** na coluna lateral. O card atrás precisa pular de coluna no board.
Se a etapa de destino for terminal, o modal passa a mostrar **Concluído em**.
Confirme no Network que saiu um `PATCH /crm/tasks/:id/move`, e **não** um
`PATCH /crm/tasks/:id` com `column_id` — é o mesmo caminho do drag.

## 26. Etiqueta com nome que já existe

Em **Etiquetas**, digite o nome de uma etiqueta que **já existe** no quadro (com
outra caixa, por exemplo `frontend` quando existe `Frontend`) e confirme. Ela
precisa ser aplicada normalmente, **sem nenhuma mensagem de erro**. A API devolve
200 com a etiqueta existente, e isso é sucesso.

Depois teste um nome com curinga de LIKE, como `50% pronto`: tem que criar uma
etiqueta nova, não reaproveitar outra.

## 27. Markdown

Selecione um trecho na descrição e clique em **negrito** — os asteriscos entram
em volta da seleção e a seleção continua no texto, não nos delimitadores.
`Ctrl+B`, `Ctrl+I` e `Ctrl+K` fazem o mesmo. Na aba **Visualizar**, um
`- [ ] item` vira caixa de seleção (isso é o `remark-gfm`).

Escreva `<img src=x onerror=alert(1)>` e vá para **Visualizar**: o HTML aparece
como **texto**, nunca executa. Não há `rehype-raw` nem `dangerouslySetInnerHTML`
no projeto, e é assim que fica.

## 28. `?task=` inexistente

Edite a URL para `?section=tarefas&task=DEV-99999` (número que não existe) e
recarregue: toast de erro, o `?task=` sai da URL e a aba Tarefas continua
carregada. **Não** pode cair na Visão.

## 29. Mobile em tela cheia

Em viewport de celular, o modal ocupa a tela inteira, sem cantos arredondados e
sem borda, e as propriedades ficam **abaixo** do conteúdo, não numa coluna
lateral espremida.

## 30. Ações

- **Link**: copia e, colado em outra aba, abre a mesma tarefa.
- **Duplicar**: cria `(cópia)` na mesma etapa, com um **ID curto novo**.
- **Arquivar**: fecha o modal e o card some do board.
- **Excluir**: pede confirmação, fecha e some. O checklist vai junto (cascade).

---

# Smoke test de comentários e histórico (Fase 5)

Ainda no quadro sandbox. Abra uma tarefa e use as abas **Comentários** e
**Histórico** no fim da coluna principal.

Os casos de perda de texto, o resolver de `action` desconhecido, a paginação e a
denormalização do payload estão automatizados, e cada suíte foi conferida contra
controle negativo (ver o relatório da fase). A lista abaixo é o que só o
navegador mostra.

## 31. Comentar offline

DevTools → Network → **Offline**. Escreva um comentário e envie.

Esperado: o comentário aparece na hora, some quando a requisição falha, toast de
erro, e **o texto volta para o campo de escrita**. Volte a ficar online, mande de
novo e recarregue: aparece uma vez só, nunca duas.

## 32. Editar comentário de outro autor

Peça para outra pessoa admin comentar na mesma tarefa (ou insira uma linha em
`admin_task_comments` com `author_id` diferente do seu).

Na interface os botões de editar e excluir **não aparecem** nesse comentário. Mas
o que garante é o servidor, então force pelo console:

```js
await fetch("/api/admin/crm/comments/<id-do-comentario-alheio>", {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
  body: JSON.stringify({ body: "invasão" }),
}).then((r) => r.status);
```

Esperado: **404**, não 200 e não 403. A rota filtra por `author_id` no próprio
`WHERE`, então a linha simplesmente não casa.

## 33. `action` desconhecido no histórico

Simula o bundle antigo contra backend novo. No SQL editor:

```sql
insert into public.admin_task_activity (task_id, actor_id, action, payload)
values ('<uuid da tarefa>', null, 'archived', '{}'::jsonb);
```

Depois edite o `action` dessa linha para um valor fora do CHECK — como o CHECK
recusa, o teste real de bundle antigo é o inverso: **remova uma entrada do
`switch` em `taskActivityMeta.ts`** e recarregue. A linha tem que mostrar
"registrou uma alteração", nunca sumir e nunca derrubar a aba. Restaure depois.

## 34. Tarefa com muito histórico

Gere volume mudando a prioridade da mesma tarefa umas 40 vezes (o `↑`/`↓` do
select serve). Abra a tarefa e vá em **Histórico**.

Esperado: 30 linhas e um botão **"Carregar mais"**. Clique: emenda a página
seguinte sem repetir nem pular nenhuma linha, e o botão some quando acaba.
Confirme no Network que a abertura da tarefa **não** baixou o histórico inteiro.

## 35. Etiqueta excluída no histórico

Aplique uma etiqueta numa tarefa, remova-a da tarefa e depois **exclua a etiqueta
do quadro**. No histórico, as duas linhas continuam dizendo o nome dela.

É o ponto do Passo 1 desta fase: o log guarda o rótulo legível gravado no momento
do evento, não uma referência que pode desaparecer.

## 36. Contador do card

Comente numa tarefa e feche o modal: o contador de comentários no card, no board,
já subiu. Sem recarregar a página.

---

# Smoke test de busca, filtros e lista (Fase 6)

## 37. Busca com caractere especial

Crie duas tarefas: `entregar 100% do escopo` e `entregar 100 coisas`. Busque por
`100%`.

Esperado: **só a primeira**. Se as duas aparecerem, a busca virou padrão e o `%`
voltou a ser curinga. Repita com `a_b` versus `axb`.

`/` foca o campo de busca. Com o cursor dentro dele, digitar `n` escreve `n`,
**não** abre um composer.

## 38. Drag com filtro ativo

O caso mais delicado da fase.

1. Numa etapa com 3 cards, filtre por prioridade de modo a esconder **o do meio**.
2. Tente arrastar o primeiro card para baixo do terceiro, **dentro da mesma
   etapa**.

Esperado: **nada acontece**, e o aviso na barra explica por quê. Não pode haver
`PATCH /move` no Network.

3. Arraste o mesmo card para **outra etapa**.

Esperado: funciona, e ele entra no **fim** da etapa de destino. Limpe o filtro e
confirme que a ordem da etapa de origem continua exatamente como estava.

## 39. Drag agrupado por prioridade

Agrupe por **Prioridade** e arraste um card de "Média" para "Alta".

Esperado: a prioridade muda (o badge do card acompanha) e o histórico registra
`mudou a prioridade de média para alta`. Não pode haver `PATCH /move`. Dentro do
grupo não há reordenação — arrastar um card sobre outro do mesmo grupo não faz
nada.

Repita agrupando por **Responsável**, incluindo soltar em "Sem responsável": tem
que **desatribuir**, não gravar a string `none`.

## 40. URL com filtro, tarefa aberta e F5

1. Ligue um filtro (ex.: atrasadas), agrupe por responsável, mude para **Lista**.
2. Abra uma tarefa.
3. A URL tem `section`, `task`, `due`, `group` e `view` ao mesmo tempo.
4. **F5.** Volta exatamente igual: mesma aba, mesmo filtro, mesmo agrupamento,
   mesma visão, mesma tarefa aberta.
5. **Voltar** no navegador desfaz um passo por vez, sem perder os outros
   parâmetros.
6. Copie a URL e abra em outra aba: mesmo estado.
7. Limpe os filtros: os parâmetros **somem** da URL em vez de ficarem vazios.

## 41. Contador filtrado e estado vazio

Com filtro ligado, o contador da etapa mostra `3 de 12`, não `3`. Uma etapa que
ficou sem nada mostra "Nada bate com os filtros" com link de limpar — texto
**diferente** de "Nenhuma tarefa nesta etapa".

O limite de WIP continua contando o **total** da etapa, não o filtrado: um filtro
não pode fazer um estouro de WIP desaparecer.

## 42. Arquivadas

Arquive uma tarefa pelo modal. Ligue **Mostrar arquivadas** nos filtros: ela
reaparece com aparência distinta (tracejada, título riscado) e um botão de
desarquivar. Desarquive e confirme que volta ao normal.

## 43. Lista

Alterne para **Lista**. Respeita o mesmo filtro, busca e agrupamento; clicar numa
linha abre o mesmo modal; as setas movem entre etapas. Com filtro que não casa
nada, mostra o estado vazio com botão de limpar.
