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
| Policies (RLS) | 72 | O PostgREST não expõe `pg_policy` de forma nenhuma |
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

## Achado colateral, 2026-07-27

`call_cron_endpoint` está exposta no banco e **não é declarada por migration nenhuma**: ela aparece só
dentro de um comentário SQL. Foi criada à mão em algum momento. O guard não acusa porque ele checa o
sentido "declarado existe?", não "existente é declarado?". O sentido inverso é outra lacuna, e a mesma RPC
de introspecção fecharia os dois.
