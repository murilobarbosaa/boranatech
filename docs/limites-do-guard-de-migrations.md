# O que `check:migrations` cobre, e o que não

Este documento existe porque a cobertura do guard já foi menor do que ele dizia **duas vezes**: a primeira
versão do regex enxergava 38 das 72 tabelas, e a versão seguinte não enumerava função nenhuma, o que
deixaria a RPC `reserve_ai_usage_slot` faltar sem nada acusar. Escrever o limite é a única forma de ele não
virar surpresa.

## Coberto e verificado

| Objeto | Como é enumerado | Como é verificado |
|---|---|---|
| Tabelas e views | `create table` nas migrations, com `drop table` descontado | `GET /rest/v1/<nome>`: `PGRST205` significa ausente |
| Funções (não-trigger) | `create function` / `create or replace function`, com `drop function` descontado | OpenAPI do PostgREST (`GET /rest/v1/`, `Accept: application/openapi+json`) enumera as RPC expostas |
| **RLS ativa** | `alter table ... enable row level security`, com `disable` descontado | Conta com service role e lê com a chave **anon**: anon ver linhas sem policy pública que justifique é **exposição** |

Em ambos há **guard de cobertura do parser**: se o arquivo tem mais `create X` do que o parser conseguiu
ler, o script aborta em vez de encolher o conjunto em silêncio. E há **asserção de tamanho do conjunto**
(`EXPECTED_TABLE_COUNT`, `EXPECTED_FUNCTION_COUNT`, `EXPECTED_TRIGGER_FUNCTION_COUNT`), que pega o caso em
que o parser para de reconhecer uma forma.

Duas decisões que valem registro:

- **A função não é chamada para testar existência.** `reserve_ai_usage_slot` é `VOLATILE` e **insere
  linha**. Verificar chamando escreveria em produção a cada `check:migrations`. O OpenAPI é leitura pura.
- **Função que devolve `trigger` não é verificável** e é reconhecida pela assinatura, não por lista de
  nomes. O escopo é o **primeiro `returns` depois do `create function`**, que é o da própria função. Uma
  versão anterior procurava `returns trigger` numa janela de 4000 caracteres e classificou
  `get_study_heatmap` e `is_user_admin` como trigger porque havia uma função de trigger logo abaixo no
  mesmo arquivo: duas RPC reais sairiam da verificação sem ninguém ver.

## Enumerado, NÃO verificado

| Objeto | Quantidade declarada | Por que não é verificado |
|---|---|---|
| Policies, como texto | 72 | O PostgREST não expõe `pg_policy`. O EFEITO da policy de SELECT é verificado pela leitura com anon (acima); o conteúdo exato de `using`/`with check` não é |
| Índices | 124 | Idem para `pg_index` |

O projeto não tem `DATABASE_URL` nem cliente Postgres (`pg`/`postgres` não estão instalados), então não há
caminho de leitura para nenhum dos dois. O script **imprime as duas contagens** a cada execução: é menos do
que verificar, e é mais do que fingir que não existem, porque uma queda no número fica visível.

**Como fechar, se valer a pena.** Uma RPC de introspecção somente-leitura
(`select polname from pg_policy`, `select indexname from pg_indexes where schemaname = 'public'`), exposta
só ao `service_role`. Custo: uma migration, que por sua vez precisa ser aplicada à mão, então o guard passa
a depender de um objeto que ele mesmo não consegue garantir no primeiro uso. É circular, mas a circularidade
é detectável: se a RPC de introspecção faltar, o guard reclama dela por nome. **Não implementado**: 196
objetos sem verificação são um risco real, e ainda assim menor que o de tabelas e funções, porque policy
ausente falha fechado (ninguém lê o que não devia) e índice ausente degrada desempenho sem corromper dado.

## Fora do escopo, declarado

- **Trigger** (o `create trigger`, não a função): não enumerado. Um trigger que não foi aplicado deixa
  `updated_at` parado, que é silencioso. Vale cobrir junto com policies, pela mesma RPC de introspecção.
- **View**: enumerada junto com tabela pelo mesmo regex? **Não.** `create view` não casa com
  `CREATE_TABLE_RE`. Views existentes seriam verificáveis pelo mesmo `GET /rest/v1/<nome>`, então esta é a
  lacuna mais barata de fechar das quatro.
- **Enum** (`create type ... as enum`) e valores acrescentados por `alter type`: não enumerados. Enum novo
  que não chegou ao banco derruba insert em runtime.
- **Grant e revoke**: não enumerados. Permissão faltando falha fechado.
- **Alteração de coluna** (`alter table ... add/drop/alter column`): **não enumerada, e é a maior lacuna
  que sobra.** O guard confirma que a tabela existe, não que ela tem as colunas que o código espera.
  Coluna faltando é exatamente o modo de falha do incidente que criou este script, só que uma camada
  abaixo.

## RLS: como é verificada, e o que fica inconclusivo

Para cada uma das 73 tabelas vivas que declaram RLS: conta com o service role (N) e lê com a chave anon (A).

| N | A | Veredito |
|---|---|---|
| > 0 | 0 | **Protegida** |
| > 0 | > 0 e existe policy de SELECT pública declarada | **Pública por decisão**, não exposição |
| > 0 | > 0 e **não** existe tal policy | **EXPOSTA**, o guard falha nomeando a tabela |
| 0 | qualquer | **Inconclusiva**, nunca verde |
| erro no service role | | **Inconclusiva** |

**Tabela vazia não prova nada**: anon ver zero pode ser RLS funcionando ou pode ser que não há o que ver.
Contá-la como verde seria o mesmo erro de sempre, falhar passando.

**A regra do Postgres que decide o falso positivo**: policy **sem cláusula `to`** vale para `public`, o que
inclui `anon`. A primeira versão deste teste exigia `to anon` explícito e teria acusado 11 tabelas de
catálogo como exposição, todas com `for select using (is_published = true)` e nenhum `to`. Falso positivo
em guard de segurança é pior que inútil: ensina a ignorar o alarme.

**Estado medido em 2026-07-27**: 53 protegidas, 13 públicas por policy declarada (`areas`, `courses`,
`external_jobs`, `faculdades_cursos`, `faculdades_ies`, `news`, `plans`, `platforms`, `projects`,
`roadmap_steps`, `roadmaps`, `search_documents`, `technologies`), **0 expostas**, 7 inconclusivas
(6 tabelas vazias mais `billing_orphan_payments`, que não existe). `external_jobs` é o caso mais
informativo: service role vê 8019 e anon vê 2348, ou seja, a policy está filtrando de fato.

**Requisito de ambiente**: a verificação precisa de `VITE_SUPABASE_ANON_KEY` além do service role.

- **Local**, sem a chave: o guard avisa que não verificou RLS e segue, porque o resto dele continua valendo.
- **No CI**, o job `migrations` passa `CHECK_RLS_OBRIGATORIO=1`, e aí a ausência da chave **falha o job**
  nomeando o secret que falta. Guard de segurança que pula em silêncio é a forma exata do problema que
  abriu esta auditoria.

**Secret a cadastrar**: `VITE_SUPABASE_ANON_KEY`, em GitHub → Settings → Secrets and variables → Actions →
Repository secrets. É a mesma chave anon pública que o frontend já usa (`VITE_*`), então não é segredo
novo: ela existe justamente para ser exposta ao navegador. O que o guard faz com ela é ler como um
visitante anônimo leria.

## Modo degradado do limite diário de IA

Sem a RPC `reserve_ai_usage_slot`, `checkAiDailyLimit` volta ao caminho antigo, ler-depois-escrever, e a
janela de corrida do TOCTOU reabre. **É deliberado**: derrubar nove ferramentas de IA porque uma migration
não foi aplicada é pior que a corrida, que custa algumas chamadas a mais para quem dispara requisições em
paralelo.

O que não pode é ser silencioso. Como reconhecer:

- **No log**: a string `MODO DEGRADADO` em `console.error`, com a causa (`PGRST202` quando a função não
  existe) e o caminho da migration a aplicar.
- **No Sentry**: evento de nível `error`, tags `area=ai-quota` e `degraded=true`, fingerprint
  `ai-quota-degraded` (todos os eventos agrupam num issue só).
- **No `check:migrations`**: a função aparece como ausente, por nome.

O aviso sai no máximo **uma vez a cada 5 minutos por processo**. Sem esse corte, um sistema degradado gera
um evento por requisição, o alerta vira ruído e ninguém olha, que é outra forma de silêncio.

## Direção inversa: existe no banco e ninguém declara

O guard também responde "existente é declarado?", para funções e para tabelas/views, comparando com o
OpenAPI. Importa porque backup físico preserva o objeto criado à mão, mas **reconstrução a partir das
migrations não** — e `supabase start` é reconstrução, então o ambiente de ensaio nasceria diferente de
produção. Função de extensão (`unaccent`, `show_trgm`, ...) fica numa lista de exceção explícita, com nome,
nunca por omissão. Medido em 2026-07-27: **zero** funções e **zero** tabelas nessa condição.

## Correção de um achado anterior, 2026-07-27

A rodada anterior afirmou que `call_cron_endpoint` existia no banco sem migration que a declarasse, criada
à mão. **Estava errado, e o errado era o parser.**

`stripSqlComments` era `replace(/\/\*[\s\S]*?\*\//g, " ")`, e casou o `/*` de `/api/cron/*`, na primeira
linha de `20260518003955_schedule_cron_jobs.sql`, com o `*/` de `'15 */6 * * *'` sessenta linhas abaixo.
Apagou 1502 caracteres de SQL real e escondeu a função. Medido em toda a pasta: **4 arquivos afetados,
3663 caracteres de SQL apagados, 1 função escondida**, nenhuma tabela e nenhuma RLS.

É a sexta instância da mesma classe nesta base, e a mais antiga. O conserto não é regex melhor, é léxico
mínimo: string entre aspas simples, dollar-quoting (onde mora todo corpo de função) e aninhamento de bloco.

Um segundo defeito do mesmo tipo apareceu junto: o parser aplicava todos os `CREATE` de um arquivo e só
depois todos os `DROP`, então `drop function x; create function x;` (padrão para trocar assinatura)
terminava com `x` removido do conjunto. Foi assim que `email_campaign_record_result` apareceu como não
declarada. Agora os eventos são aplicados em **ordem de origem**.
