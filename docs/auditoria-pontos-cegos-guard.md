# Auditoria dos pontos cegos do `check:migrations` (Q1.c)

Levantamento **somente leitura** feito em 2026-07-30, no fechamento da Fase 2 do
Roadmap com IA. Nada foi alterado no banco. O objetivo é medir o tamanho do que o
guard **não** verifica, para a Fase 4 (que precisa de migration destrutiva) saber
onde está pisando.

Complementa `docs/limites-do-guard-de-migrations.md`, que descreve o mecanismo.
Este aqui põe número.

## Por que a ordem foi invertida

O pedido original varria o schema inteiro de uma vez. Foi dividido em duas fases
porque uma divergência nos objetos do **caminho de deploy** mudaria o deploy, e
uma divergência no resto não. A fase 1 é bloqueante; a fase 2 é inventário.

---

## Fase 1 (bloqueante): objetos do caminho de deploy

Tabelas auditadas, uma a uma, arquivo × produção: `ai_usage_logs`, `ai_roadmaps`,
`roadmap_completions`, `user_progress`, `user_roadmap_progress`, `certificates`.
(`ai_usage_*` não tem outra tabela além de `ai_usage_logs`.)

**Resultado: nenhuma divergência.** Os quatro tipos de objeto que o guard não
enxerga foram conferidos manualmente e batem com o que as migrations declaram.

### Políticas RLS: expressões `USING` / `WITH CHECK`

As 12 policies dessas tabelas usam todas o mesmo predicado,
`(select auth.uid()) = user_id`, na forma otimizada com subselect. Origem
rastreada:

| Tabela                  | Policies | Declaradas em                                                |
| ----------------------- | -------- | ------------------------------------------------------------ |
| `ai_roadmaps`           | 1 SELECT | `20260702130000` + reescrita por `20260709150000` (initplan) |
| `ai_usage_logs`         | 1 SELECT | idem                                                         |
| `user_progress`         | 4 CRUD   | `20260519185242` + reescrita por `20260709150000`            |
| `user_roadmap_progress` | 4 CRUD   | `20260517231011` + reescrita por `20260709150000`            |
| `roadmap_completions`   | 1 SELECT | `20260711130000`, já nasceu com `(select auth.uid())`        |
| `certificates`          | 1 SELECT | `20260714120100`, já nasceu com `(select auth.uid())`        |

As duas últimas foram criadas **depois** da migration de initplan, então não
aparecem nela; nasceram na forma final. Confirmado lendo os dois arquivos.

Uma assimetria observada, **sem efeito de segurança**:
`user_roadmap_progress.roadmap_progress_update_own` tem `USING` e não tem
`WITH CHECK`, enquanto `user_progress."users update own progress"` tem os dois.
No Postgres, policy de UPDATE sem `WITH CHECK` aplica o `USING` também à linha
nova, então o efeito é o mesmo. Fica registrado como inconsistência de estilo,
não como buraco.

### Check constraints

| Tabela                  | Constraint                           | Produção                                                                                       | Arquivo                  |
| ----------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------ |
| `ai_roadmaps`           | `ai_roadmaps_status_check`           | `generating, partial, ready, failed`                                                           | `20260702130000` — igual |
| `user_progress`         | `user_progress_context_check`        | `portfolio_checklist, favorites, course_progress, quiz_history, career_plan, project_progress` | `20260723033128` — igual |
| `user_roadmap_progress` | `user_roadmap_progress_status_check` | `completed, skipped`                                                                           | `20260517231011` — igual |

`ai_usage_logs`, `certificates` e `roadmap_completions` **não têm check
constraint nenhuma** em produção, e nenhuma migration declara uma. Este fato é
relevante para a Fase 2 do Roadmap com IA e está detalhado abaixo.

### Triggers

Só duas nessas tabelas, ambas declaradas:

- `user_progress_set_updated_at` → `set_updated_at()` (`20260519185242`)
- `user_roadmap_progress_updated_at` → `set_updated_at()` (`20260517231011`)

`ai_roadmaps` **não tem trigger de `updated_at`**: a coluna é mantida pela
aplicação, que manda `updated_at` explícito em cada `update`. Não é divergência
(nenhuma migration declara trigger ali), mas é uma dependência de disciplina do
código que vale saber que existe.

### Defaults de coluna

Todos conferidos e idênticos ao declarado: `gen_random_uuid()` nas PKs, `now()`
nos timestamps, `'{}'::jsonb` em `inputs`/`roadmap`/`state`,
`'generating'::text` em `ai_roadmaps.status`, `'completed'::text` em
`user_roadmap_progress.status`.

### O que isto libera para o deploy da Fase 2

Dois pontos que o runbook depende:

1. **`ai_usage_logs.status` não tem CHECK constraint** e é `text` puro. O status
   novo `'rejected'` que a observabilidade da Fase 2 grava entra sem erro. Se
   houvesse constraint, o insert falharia e a observabilidade nasceria cega.
2. **`ai_roadmaps.status` tem CHECK** e aceita exatamente os quatro valores que o
   código usa, incluindo `'failed'`, que o conserto da geração órfã escreve. Um
   quinto valor exigiria migration.

---

## Fase 2 (inventário, não bloqueante): tamanho do campo minado

Contagens do schema `public` em produção, em 2026-07-30, contra o que o guard
verifica hoje.

| Categoria            | Em produção   | Verificado pelo guard                                        | Cego    |
| -------------------- | ------------- | ------------------------------------------------------------ | ------- |
| Tabelas              | 85            | **sim**, nos 2 sentidos                                      | 0       |
| Funções (por nome)   | 23 declaradas | **sim**, nos 2 sentidos                                      | 0       |
| Funções (por corpo)  | 23            | **1** (asserção comportamental de `ai_usage_excluded_tools`) | 22      |
| RLS ligada/desligada | 85            | **sim**                                                      | 0       |
| Policies (expressão) | 68            | não                                                          | **68**  |
| Índices              | 267           | não                                                          | **267** |
| Check constraints    | 106           | não                                                          | **106** |
| Triggers             | 27            | não                                                          | **27**  |
| Defaults de coluna   | 347           | não                                                          | **347** |
| Colunas (existência) | —             | não                                                          | todas   |

As 3 tabelas expostas pelo PostgREST e não declaradas em migration nenhuma
(`payment_recovery_emails`, `stripe_customers`, `billing_failed_payments`) já são
reportadas pelo guard a cada execução e continuam pendentes. 82 declaradas + 3
não declaradas = 85, que fecha com a contagem de produção.

#### Por que o warn das 3 é ESPERADO nesta árvore, e não defeito

Rastreado em 2026-08-01. As três existem no banco desde 2026-07-28 porque as
migrations foram aplicadas **deliberadamente**, antes do deploy do código que as
consome — a ordem que o `CLAUDE.md` manda seguir. Os quatro arquivos que as
declaram (`20260822100000_create_billing_failed_payments`,
`20260822100100_create_stripe_customers`,
`20260822100200_create_payment_recovery_emails` e
`20260822100400_add_episodio_to_payment_recovery_emails`, este último trazendo a
coluna `episodio`) vivem na branch **`fix/billing-customer-reuse`**, que ainda
não subiu. Conferido: nenhum arquivo em `supabase/migrations/` desta árvore
menciona qualquer uma das três, e nenhum código desta árvore as referencia fora
de `shared/database.types.ts` (que é gerado do banco e portanto as conhece).

Nesta branch, então, o warn **descreve a realidade corretamente**: as tabelas
existem, a declaração delas não está aqui. Ele desaparece sozinho quando a branch
de billing entrar, e nesse momento `EXPECTED_TABLE_COUNT` e `EXPECTED_RLS_COUNT`
sobem de 82 para 85 (medido: com os quatro arquivos presentes o guard conta 85 e
aborta pedindo o ajuste, que é o comportamento correto dele).

Trazer os quatro arquivos para cá foi **testado e descartado**: criaria os mesmos
arquivos em duas branches, garantindo conflito no merge seguinte e repetindo o
risco de bump duplo do contador que este mesmo projeto já viu no 81 -> 82. A
declaração entra uma vez, pelo merge da branch que a criou.

### LACUNA: "tabela não declarada" avisa, mas não reprova

Registrada em 2026-08-01, separada do item acima de propósito: aquele é um estado
esperado desta branch, **este é um defeito do instrumento**.

`recursosNaoDeclarados` (em `scripts/checkMigrationsApplied.mts`) emite
`console.warn` e **não alimenta `houveFalha`**. Verificado seguindo os doze
pontos que setam a flag: nenhum deles é este. O guard sai com código 0 mesmo
listando tabelas que existem no banco e que migration nenhuma declara.

**Consequência prática.** Alguém cria uma tabela pelo painel do Supabase, por um
script solto ou por um `psql` manual, e o guard **nunca acusa** — nem no CI. A
reconstrução a partir das migrations (que é o que um ambiente de ensaio faz)
nasce sem ela, e a divergência só aparece quando alguém for usar o ambiente e
descobrir que a tabela não existe lá. É a classe que o `CLAUDE.md` documenta:
veredito certo sobre uma superfície menor que a real. A direção "o que declarei
existe?" reprova; a direção inversa, "o que existe está declarado?", só avisa.

**Por que não pode virar falha incondicional hoje.** Três motivos medidos:

1. Reprovaria esta própria branch, e a de billing, e qualquer branch que aplique
   a migration antes do deploy do código — que é a ordem que o `CLAUDE.md`
   EXIGE. A janela entre aplicar e mergear é legítima e pode durar dias.
2. Reprovaria trabalho paralelo: com dois worktrees ativos, a branch A vê as
   tabelas que a branch B aplicou e ainda não mergeou.
3. O PostgREST expõe o que ele expõe. Uma view criada por uma extensão ou por um
   recurso gerenciado do Supabase apareceria como "não declarada" sem que
   ninguém tenha feito nada errado (o guard já mantém `DE_EXTENSAO` para o caso
   equivalente em funções, e a lista de exceção de tabelas não existe).

**Critério proposto** (não implementado): falhar quando a tabela não declarada
estiver no banco **e não estiver em nenhuma branch conhecida**. Operacionalmente,
uma lista de exceção explícita e datada no próprio guard, no molde de
`DE_EXTENSAO`, com o nome da tabela, a branch onde a migration vive e a data de
entrada; a ausência da tabela nessa lista vira falha. Isso inverte o default de
"avisa e segue" para "reprova salvo declaração", e a declaração custa uma linha
no commit que aplica a migration. O que ela compra: uma tabela criada pelo painel
não tem branch para citar, então não entra na lista, então quebra o CI — que é
exatamente o caso que hoje passa despercebido.

### Migrations que não deixam rastro estrutural nenhum

**21 dos 123 arquivos** não declaram estrutura: são DML puro ou agendamento de
cron. Para essas, o guard é cego por construção — não há objeto para procurar, e
"foi aplicada?" só se responde olhando o dado ou o `cron.job`.

Classificação verificada item a item (o primeiro verbo SQL de cada arquivo), e a
soma fecha: 102 com DDL + 21 sem = 123. A primeira tentativa deste levantamento
usou um padrão que **sub-casou** e classificou a
`20260730180000_ai_roadmaps_one_generating_per_user.sql` como DML porque o regex
pedia `create index` e o arquivo diz `CREATE UNIQUE INDEX`. É a classe de defeito
que o `CLAUDE.md` documenta, e ela apareceu aqui mesmo, na ferramenta de medir o
campo cego. Por isso a contagem acima é conferida pela soma, não afirmada de
memória.

Os 21, por natureza (12 + 5 + 4 = 21):

- **12 de agendamento de cron** (`select cron.schedule(...)`): `20260518233658`,
  `20260529130000`, `20260702120000`, `20260714130200`, `20260715120100`,
  `20260715140000`, `20260715150100`, `20260717120000`, `20260720140000`,
  `20260721160100`, `20260723120100`, `20260727120100`.
- **5 de conteúdo/seed** (`insert`/`update` em áreas, planos, preços):
  `20260524120110`, `20260526143000`, `20260528120000`, `20260715130000`,
  `20260716140000`.
- **4 de limpeza** (`delete`/`update` corretivo): `20260518002827`,
  `20260518071400`, `20260519121147`, `20260723071025`.

Verificar essas exige consultar `cron.job` (para as de agendamento) ou o dado
(para as demais). Nenhuma delas é verificável por estrutura, então nenhum guard
de schema vai alcançá-las. Vale como aviso para a Fase 4: se ela depender de uma
dessas ter rodado, a checagem tem que ser escrita à mão.

---

## O que isto significa para a Fase 4

A Fase 4 precisa de migration destrutiva. As três coisas a levar daqui:

1. **O caminho de deploy está limpo.** As 6 tabelas do fluxo do Roadmap com IA
   batem arquivo × produção nos quatro tipos de objeto invisíveis ao guard. Não
   há surpresa escondida ali.
2. **Índice, policy, check, trigger e default continuam invisíveis.** Uma
   migration destrutiva que dependa de qualquer um deles precisa de verificação
   escrita à mão, no molde da asserção comportamental de
   `ai_usage_excluded_tools()`: afirmar o **conteúdo**, com igualdade de conjunto.
3. **O caminho que responde de verdade continua sendo o ensaio.** Restaurar
   backup num projeto descartável e aplicar as 123 migrations do zero num segundo,
   e comparar (`docs/debito-ledger-migrations.md`, seção "O que verificar antes de
   um backfill"). É a única coisa que responde "o que existe está declarado, com a
   mesma forma?" sem depender de um parser meu.

## Reproduzir

```bash
set -a && . ./.env && set +a
q() { curl -s -X POST "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" -d "{\"query\":\"$1\"}"; }

# totais por categoria
q "select (select count(*) from pg_policies where schemaname='public') as policies,
          (select count(*) from pg_constraint con join pg_class c on c.oid=con.conrelid
             join pg_namespace n on n.oid=c.relnamespace
            where n.nspname='public' and con.contype='c') as checks,
          (select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid
             join pg_namespace n on n.oid=c.relnamespace
            where n.nspname='public' and not t.tgisinternal) as triggers,
          (select count(*) from information_schema.columns
            where table_schema='public' and column_default is not null) as defaults;"

# expressoes de policy de uma tabela
q "select policyname, cmd, qual, with_check from pg_policies
    where schemaname='public' and tablename='ai_roadmaps';"
```
