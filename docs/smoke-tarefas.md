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
