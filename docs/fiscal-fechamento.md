# Frente fiscal (NFS-e): fechamento do Marco 1 e runbook de ativacao

Escrito em 2026-08-24, no fim do lote 5, e emendado no lote 6. Registra o que o
Marco 1 entregou (a plataforma sobe com o pipeline fiscal PRESENTE, INVISIVEL e
DESLIGADO), e a sequencia literal para liga-lo no Marco 2.

O deploy do Marco 1 nao LIGA nada, mas **APLICA as 5 migrations**, porque elas
sao pre-condicao de CI verde (secao 4). A distincao presente, invisivel e
desligado continua valendo: o que muda e que o banco passa a ter as estruturas
vazias, que ninguem consome.

O pipeline inteiro ja estava no codigo desde `33000fa7`
(`feat(fiscal): automatic NFS-e issuance pipeline (phases 1-5.1)`, 60 arquivos,
8857 insercoes). Ele nunca foi ativado, e as 5 migrations dele nunca foram
aplicadas em lugar nenhum. O Marco 1 nao construiu feature: ele tornou seguro
subir com esse codigo embarcado.

Contexto sem duplicar aqui: a autopsia completa do pipeline esta no relatorio do
Passo 0 desta frente, e os quatro lotes tem relatorio proprio
(`relatorio-lote1-fiscal.md` a `relatorio-lote4-fiscal.md`, nao commitados, na
raiz do worktree `bnt-fiscal`).

## Estado do banco, medido em 2026-08-24

Verificado pelo arquiteto no SQL Editor do Supabase, contra producao. E a
premissa que autoriza tudo que vem depois:

- `to_regclass('public.fiscal_invoices')` devolveu `null`: a tabela NAO existe.
- `pg_constraint` nao contem `profiles_fiscal_documento_preferencia_check`.
- NENHUMA das 5 migrations fiscais consta em `supabase_migrations.schema_migrations`.
- `public.profiles` tem 6687 linhas.

A aplicacao das 5 sera INEDITA. Nao ha estado parcial para reconciliar.

## 1. Os lotes do Marco 1

| Lote | Commit     | O que mudou                                                                                                                                |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | `b38aa1dd` | Guarda de kill-switch nas 4 rotas fiscais que operavam com a emissao desligada, com desfecho NOMEADO em cada uma.                          |
| 2    | `9cf4cddf` | Gate de frontend nas 5 superficies fiscais, com ponto unico de verdade fail-closed e a rota `GET /api/billing/nfse-status` que o alimenta. |
| 4    | `a21b80d0` | Os 2 em-dash reais do dominio removidos, e 30 marcadores `TODO(Ana)` novos sobre a copy fiscal visivel.                                    |
| 3    | `1c99f40b` | A migration do CHECK em `profiles` passa a `NOT VALID` mais `VALIDATE` em transacao separada.                                              |

Os lotes 3 e 4 sairam fora de ordem numerica de proposito: o 3 dependia de
confirmar no banco que a migration nunca fora aplicada, e essa medicao chegou
depois.

## 2. O que o deploy do Marco 1 NAO faz

Este e o ponto do marco. Subir estes quatro commits NAO:

- **liga env fiscal nenhuma**. `NFSE_ENABLED` ausente resolve para desligado, em
  silencio e sem warn (`server/lib/env.ts:107`, `if (!raw) return false`).
  Qualquer valor diferente do literal exato `"true"` tambem desliga, com warn
  nomeando o valor recebido.
- **nao emite, nao enfileira e nao mostra nada**, conforme a tabela abaixo.

O deploy APLICA as 5 migrations, e isso nao contradiz o acima: elas criam
estrutura vazia que ninguem consome com o switch desligado, e sao pre-condicao
de CI verde (secao 4). O banco passa a ter as tabelas; o produto continua sem
qualquer superficie fiscal.

Com o switch desligado, o comportamento medido em cada superficie:

| Superficie                                                                        | Com a emissao desligada                                                                                                                                   |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worker da fila                                                                    | NAO SOBE. `server/index.ts:94` so o cria com `env.redisUrl && env.nfseEnabled`.                                                                           |
| Ganchos do webhook da Stripe                                                      | Retornam antes de qualquer leitura ou escrita (`server/providers/stripe.ts:898, 954, 1004`). Nenhuma linha em `fiscal_invoices`.                          |
| Cron de reconciliacao                                                             | Roda e PULA declaradamente: grava `recordCronRun` com `{ skipped: "nfse_disabled" }` e responde 200 com o mesmo slug (`server/routes/cron.ts:1330-1339`). |
| Reembolso administrativo                                                          | Efeito fiscal dentro de `if (env.nfseEnabled && chargeId)` (`server/routes/admin.ts:3503`). O reembolso acontece normal.                                  |
| Gancho do PATCH de perfil                                                         | Dentro de `if (env.nfseEnabled && tocaFiscal)` (`server/routes/me.ts:541`).                                                                               |
| `GET /api/billing/invoices`                                                       | 200 com `{ data: [], nfse: "disabled" }`, sem tocar o banco (lote 1).                                                                                     |
| `GET /api/admin/fiscal-invoices/summary`                                          | 200 com agregados zerados mais `nfse: "disabled"`, sem tocar o banco.                                                                                     |
| `GET /api/admin/fiscal-invoices`                                                  | 200 com `{ data: [], nfse: "disabled" }`, sem tocar o banco.                                                                                              |
| `POST /api/admin/fiscal-invoices/:id/retry`                                       | 409 `nfse_disabled`. NENHUMA linha muda de estado, NADA e enfileirado.                                                                                    |
| Banner fiscal, secao de notas do perfil, bloco de dados fiscais, gate do checkout | Somem por completo. O gate do checkout nem le o perfil: segue direto ao pagamento.                                                                        |
| Painel fiscal do admin                                                            | NAO some: mostra o estado nomeado em uma linha, no lugar dos cartoes e da tabela, e nao pede nada ao backend.                                             |

A assimetria do painel do admin e deliberada: quem abre o financeiro precisa
distinguir "nao ha nota nenhuma" de "a emissao esta desligada", e um espaco
vazio diria a primeira coisa.

## 3. A rota do sinal: `GET /api/billing/nfse-status`

Criada no lote 2 (`server/routes/billing.ts`), publica, sem `requireAuth`.

| Estado              | Resposta                             |
| ------------------- | ------------------------------------ |
| `NFSE_ENABLED=true` | `{ "data": { "nfse": "enabled" } }`  |
| Qualquer outro caso | `{ "data": { "nfse": "disabled" } }` |

Ela e publica porque o banner fiscal mora no `Layout`, que atravessa toda pagina
inclusive as anonimas; com `requireAuth` cada carga deslogada geraria um 401
previsivel e inutil. O dado nao e do usuario: e flag de configuracao do produto,
igual para todo mundo.

**O cliente e fail-closed em todos os caminhos de duvida**
(`client/src/services/nfseStatus.ts`): so o literal exato `"enabled"` mostra
superficie fiscal. Resolvem para ESCONDIDO, sem excecao:

- campo ausente na resposta (backend antigo que nao conhece a rota);
- **404 da rota** (mesma causa, na janela de deploy: a Vercel sobe antes do
  Railway, entao existe um intervalo de 1 a 3 minutos com bundle novo contra
  backend antigo);
- resposta malformada, erro de rede, e o estado de carregamento.

Os quatro casos tem teste nomeado em `client/src/services/nfseStatus.test.tsx`,
dois deles chamados "JANELA DE DEPLOY" exatamente por isso.

## 4. Checklist do deploy unificado (Marco 1)

Estes passos rodam **na mesma sessao de trabalho do deploy, imediatamente ANTES
do merge para a `main`**. Nao sao do Marco 2.

### Por que a aplicacao nao pode esperar a ativacao

O job `migrations` do CI compara as tabelas DECLARADAS em `supabase/migrations`
com as que existem no banco alvo. Os arquivos fiscais estao no repositorio desde
`33000fa7` (12 de agosto), e o banco nao tem nada fiscal (medicao de 2026-08-24,
no topo deste documento). Logo, o job falha, e continua falhando enquanto as 5
nao forem aplicadas.

O rito de publicacao exige CI verde job a job no `head_sha` do deploy. **Aplicar
e o que deixa esse job verde; nao aplicar e o que o mantem vermelho.** Nao ha
como publicar primeiro e aplicar depois.

Aplicar com o switch desligado e seguro pelo que a secao 2 ja estabelece: nada
consome as tabelas (o worker nao sobe, os ganchos retornam antes de qualquer
efeito, as 4 rotas nao chegam ao banco), a RLS de `fiscal_invoices` nega tudo
por nao ter policy nenhuma, e o cron passa a pular declaradamente assim que o
backend novo subir.

### 4.1 Aplicacao das migrations

**Manual, no SQL Editor do Supabase, arquivo INTEIRO de uma vez, em ordem de
timestamp.** Nunca `supabase db push`.

1. `20260804120000_create_fiscal_invoices.sql`
2. `20260804130000_add_profile_fiscal_fields.sql`
3. `20260804140000_add_precisa_revisao_to_fiscal_invoices.sql`
4. `20260804140100_schedule_reconcile_fiscal_invoices.sql`
5. `20260810120000_add_dps_fields_to_fiscal_invoices.sql`

Todas as cinco sao ADITIVAS (criam tabela, colunas nullable, indices, sequence e
um agendamento de cron; nenhuma altera ou remove dado), entao sao **isentas da
janela de migration destrutiva** do CLAUDE.md e podem rodar a qualquer hora.

**Nota especial da 2 (`20260804130000`).** Ela roda em DUAS transacoes de
proposito (lote 3): o `add constraint` nasce `NOT VALID`, o `COMMIT` fecha o
bloco, e so entao o `validate constraint` roda sozinho. Sem essa separacao, o
`ADD` tomaria ACCESS EXCLUSIVE em `profiles` e SEGURARIA o lock durante a
varredura da tabela inteira; `profiles` e a tabela do caminho de login. Como o
SQL Editor pode tratar cada statement em sessao propria, **a verificacao abaixo
nao e opcional**:

```sql
select convalidated from pg_constraint
where conname = 'profiles_fiscal_documento_preferencia_check';
```

Esperado: `true`. Se vier `false`, a constraint existe mas nao verificou as
linhas antigas, ou seja, e uma garantia que so parece existir. Nesse caso rode o
validate isolado:

```sql
alter table public.profiles
  validate constraint profiles_fiscal_documento_preferencia_check;
```

### 4.2 A janela do cron, entre aplicar a 4 e o backend novo subir

A `20260804140100` agenda `reconcile-fiscal-invoices` em `55 */6 * * *`. Entre
aplica-la e o backend novo entrar no ar, o job bate em
`/api/cron/reconcile-fiscal-invoices`, que ainda nao existe.

**O que acontece de fato, medido em
`supabase/migrations/20260518003955_schedule_cron_jobs.sql:17-48`**: a funcao
`public.call_cron_endpoint` chama `net.http_post` (pg_net) e guarda apenas o
`request_id` que ele devolve. Ela **nao le a resposta** e **nao trata status**.
Consequencias, uma a uma:

- o 404 **nao levanta excecao** (a unica `RAISE EXCEPTION` da funcao e para
  `cron_secret` ausente no vault, linha 33);
- o job aparece como **bem-sucedido** em `cron.job_run_details`, porque o
  comando SQL executou sem erro: ele disparou a requisicao e retornou o id. O
  sucesso e sobre o SQL, nao sobre o HTTP;
- **nada e gravado em `cron_run_logs`**, porque quem grava e o backend
  (`recordCronRun`, em `server/lib/cron-logs.ts`), e ele nunca e alcancado;
- **nenhum alerta externo dispara**. O Sentry nao roda dentro do banco, e
  nenhuma migration le `net._http_response` (verificado por grep em
  `supabase/migrations/`).

Ou seja: o 404 nessa janela e **silencioso**, e o unico rastro fica na tabela do
pg_net, que tem retencao curta.

Recomendacao: aplicar as 5 na mesma sessao do deploy, o que reduz a janela a
minutos. Se ela cruzar um disparo (minuto 55 de hora multipla de 6), o efeito e
exatamente o descrito acima e **cessa sozinho** quando o backend novo sobe, sem
nada a limpar. Depois disso o job passa a pular declaradamente, gravando
`{ skipped: "nfse_disabled" }` no `cron_run_logs`, que ja e rastro visivel.

### 4.3 Carimbo no historico de migrations

Depois de aplicar, para cada uma das 5, na mesma ordem:

```bash
supabase migration repair --status applied 20260804120000
supabase migration repair --status applied 20260804130000
supabase migration repair --status applied 20260804140000
supabase migration repair --status applied 20260804140100
supabase migration repair --status applied 20260810120000
```

Verificacao: as 5 passam a constar em `supabase_migrations.schema_migrations`, e
o job `migrations` do CI passa a ficar verde no proximo push.

## 5. Runbook de ativacao (Marco 2)

Ordem literal. Cada passo tem verificacao com resultado esperado.

### 5.1 Pre-requisitos de NEGOCIO (bloqueiam, e nao sao tecnicos)

Nenhum passo tecnico abaixo deve comecar antes destes tres:

1. **Confirmacao do contador.** O item da lista de servicos (LC 116) e a
   aliquota de ISS do municipio, para Brasilia/DF. O `.env.example` ja registra
   os valores desta empresa como `item 1.09, aliquota 2`, mas com o aviso de que
   vem do CONTADOR, nao de tentativa e erro: **errar aqui nao produz erro
   visivel, produz nota valida com imposto errado**. O mesmo vale para
   `NFSE_OPTANTE_SIMPLES`, que nao tem default de proposito.
2. **Contrato e homologacao do provedor Focus.** O token e o cadastro na
   prefeitura. A homologacao roda pelo script dedicado
   (`scripts/homologarNfse.mts`), que se recusa a rodar fora de homologacao
   (`scripts/lib/homologacaoGuard.mts` aborta se `NFSE_FOCUS_ENV` nao for
   `homologacao`, se `NFSE_ENABLED` nao for `true`, ou se o provider nao for
   `focus_nfse`).
3. **Aprovacao da copy pela Ana.** O dominio fiscal tem **33 marcadores
   `TODO(Ana)`**, distribuidos assim (medido em 2026-08-24):

   | Arquivo                                                   | Marcadores fiscais |
   | --------------------------------------------------------- | ------------------ |
   | `client/src/components/admin/FiscalInvoicesDashboard.tsx` | 11                 |
   | `client/src/components/fiscal/FiscalDataModal.tsx`        | 7                  |
   | `client/src/components/fiscal/FiscalInvoicesSection.tsx`  | 4                  |
   | `server/routes/admin.ts`                                  | 4                  |
   | `server/lib/email.ts`                                     | 3                  |
   | `client/src/components/fiscal/FiscalDataBanner.tsx`       | 1                  |
   | `client/src/pages/Admin.tsx`                              | 1                  |
   | `client/src/pages/Perfil.tsx`                             | 1                  |
   | `server/routes/billing.ts`                                | 1                  |

   Mais duas coisas que dependem dela e nao sao marcador:
   - as **4 strings de `server/routes/me.ts`** ("CPF invalido.", "CNPJ
     invalido.", "CEP invalido.", "UF invalida.", em 6 sitios), que ficaram sem
     marcacao porque o arquivo e um dos 7 em conflito com a frente do LinkedIn
     (ver secao 7);
   - a **decisao sobre o placeholder de celula vazia**. O lote 4 trocou o
     em-dash por `"sem dado"` no painel fiscal, mas o resto do admin usa o
     em-dash como marcador de campo vazio, e ha teste que depende disso
     (`client/src/components/admin/users/mobileLayout.test.tsx:147`). Hoje os
     dois padroes convivem. Unificar e decisao dela, e e trabalho de outra
     frente.

### 5.2 Aplicacao das migrations

**Feita no deploy do Marco 1**, conforme a secao 4.1: ela e pre-condicao de CI
verde, e nao pode esperar a ativacao. Se por qualquer motivo a ativacao ocorrer
sem que isso tenha acontecido, pare aqui e execute a secao 4 inteira (aplicacao,
verificacao do `convalidated` e carimbo) antes de seguir.

Verificacao rapida de que ja foi feito:

```sql
select to_regclass('public.fiscal_invoices') is not null as tabela_existe,
       (select convalidated from pg_constraint
        where conname = 'profiles_fiscal_documento_preferencia_check') as check_valido;
```

Esperado: `true` nas duas colunas.

### 5.3 Carimbo no historico de migrations

Tambem feito no deploy do Marco 1 (secao 4.3). Verificacao: as 5 constam em
`supabase_migrations.schema_migrations`.

### 5.4 Regeneracao dos types

`shared/database.types.ts` NAO contem `fiscal_invoices` hoje (medido no lote 2:
o arquivo declara 85 tabelas e a fiscal nao esta entre elas). Depois de aplicar:

```bash
pnpm db:types
```

que e `supabase gen types typescript --linked > shared/database.types.ts`
(`package.json:41`). Precedente de commit para esse passo, do `git log` do
proprio arquivo: `chore(db): regenerate types with admin_refunds and clear the
pending table exception`.

Verificacao: `grep -c "fiscal_invoices:" shared/database.types.ts` passa a
devolver pelo menos 1, e a contagem de tabelas no bloco `Tables` vai de 85 para 86.

### 5.5 Contadores: qual muda, e quando

**Medido, e e o contrario do que parece.** Os tres contadores de
`scripts/checkMigrationsApplied.mts` contam o que as MIGRATIONS DO REPOSITORIO
declaram, nao o que existe no banco. Como os 5 arquivos fiscais ja estao no
repositorio desde `33000fa7`, esses numeros **ja incluem o fiscal e NAO mudam**
com a aplicacao:

| Contador                  | Arquivo e linha                              | Valor | Muda ao aplicar?                                                                                                                     |
| ------------------------- | -------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `EXPECTED_TABLE_COUNT`    | `scripts/checkMigrationsApplied.mts:207`     | 83    | NAO. O proprio comentario diz "83 desde 20260804120000_create_fiscal_invoices.sql".                                                  |
| `EXPECTED_FUNCTION_COUNT` | `scripts/checkMigrationsApplied.mts:225`     | 28    | NAO. Nenhuma das 5 migrations cria funcao.                                                                                           |
| `EXPECTED_RLS_COUNT`      | `scripts/checkMigrationsApplied.mts:952`     | 83    | NAO. Conta `rlsDeclarada` cruzada com `declared`, e `fiscal_invoices` ja declara RLS no arquivo.                                     |
| `EXPECTED_ROUTE_COUNT`    | `server/routes/adminUsersGuards.test.ts:94`  | 59    | NAO. Conta declaracoes de rota do router de admin, e nenhuma rota de admin nasce ou morre aqui.                                      |
| `EXPECTED_TABLE_COUNT`    | `server/routes/adminUsersHarness.test.ts:27` | 85    | **SIM, para 86**, e nao pela aplicacao: pela REGENERACAO DOS TYPES do passo 4.4. Ele conta as tabelas de `shared/database.types.ts`. |

`dps_numero_seq` e uma sequence, e **nenhum contador conta sequences**
(verificado por grep nos dois arquivos). Ela nao entra em conta nenhuma.

O acoplamento, explicito:

- **Aplicar sem mexer em contador**: nao quebra nada. Pelo contrario, e o que
  CONSERTA o job `migrations` do CI, que hoje compara 83 tabelas declaradas
  contra um banco onde `fiscal_invoices` nao existe.
- **Regenerar os types sem subir 85 para 86**: quebra
  `server/routes/adminUsersHarness.test.ts`, que aborta o arquivo inteiro antes
  de qualquer teste rodar. Como esse harness e importado por varios testes de
  rota de admin, derruba um pedaco grande da suite.
- **Subir 85 para 86 sem regenerar os types**: quebra igual, pelo lado oposto (o
  parser lera 85 e o esperado sera 86).

Ou seja: os passos 4.4 e o ajuste do 85 para 86 sao **um unico commit**, e o
commit dos contadores acontece DEPOIS da aplicacao, junto com os types
regenerados. Os outros quatro contadores nao sao tocados.

Onde o guard roda, medido: `check:migrations` esta em `package.json:27` e e
invocado **no CI**, em `.github/workflows/ci.yml:95`, dentro do job `migrations`
(declarado na linha 67), que exige os secrets `VITE_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` e `VITE_SUPABASE_ANON_KEY`. Ele **NAO** roda no hook
de pre-commit: `.githooks/pre-commit` roda a suite, a suite de novo sem `.env` e
`pnpm check`, e so isso.

### 5.6 Envs na Railway

As 15 chaves lidas por `server/lib/env.ts`, todas com prefixo `NFSE_`:

| Env                                        | Exigida quando      | Ausente ou invalida                                                                                                                                              |
| ------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NFSE_ENABLED`                             | sempre (e o switch) | ausente ou diferente de `"true"`: emissao DESLIGADA, boot normal                                                                                                 |
| `NFSE_PROVIDER`                            | com o switch ligado | valor desconhecido: `process.exit(1)` (env.ts:425). `focus_nfsen` ainda e scaffold e tambem derruba o boot (435). `mock` com `NODE_ENV=production` derruba (446) |
| `NFSE_EMITIR_DESDE`                        | com o switch ligado | fora do formato `YYYY-MM-DD`: `process.exit(1)` (env.ts:468). **VEM DO CONTADOR**, sem default                                                                   |
| `NFSE_FOCUS_TOKEN`                         | com `focus_nfse`    | entra na lista de faltantes do `process.exit(1)` (env.ts:498)                                                                                                    |
| `NFSE_PRESTADOR_CNPJ`                      | com `focus_nfse`    | idem                                                                                                                                                             |
| `NFSE_PRESTADOR_INSCRICAO_MUNICIPAL`       | com `focus_nfse`    | idem. **PENDENTE**: o `.env.example` marca o valor desta empresa como "preencher, consultar o cadastro na prefeitura"                                            |
| `NFSE_PRESTADOR_CODIGO_MUNICIPIO`          | com `focus_nfse`    | idem. Valor desta empresa: `5300108` (Brasilia/DF)                                                                                                               |
| `NFSE_SERVICO_ITEM_LISTA`                  | com `focus_nfse`    | idem. **VEM DO CONTADOR**                                                                                                                                        |
| `NFSE_SERVICO_ALIQUOTA`                    | com `focus_nfse`    | idem. **VEM DO CONTADOR**                                                                                                                                        |
| `NFSE_OPTANTE_SIMPLES`                     | com `focus_nfse`    | aceita exatamente `"true"` ou `"false"`; qualquer outra coisa entra na lista de faltantes. **VEM DO CONTADOR**                                                   |
| `NFSE_FOCUS_ENV`                           | opcional            | invalida: warn e cai em `homologacao`, que e o default seguro de proposito                                                                                       |
| `NFSE_SERVICO_CODIGO_TRIBUTARIO_MUNICIPIO` | opcional            | so alguns municipios exigem                                                                                                                                      |
| `NFSE_NATUREZA_OPERACAO`                   | opcional            | quando presente vai verbatim no payload                                                                                                                          |
| `NFSE_REGIME_ESPECIAL_TRIBUTACAO`          | opcional            | idem. O ISSnet DF costuma rejeitar nota sem ele (erro E166)                                                                                                      |
| `NFSE_MOCK_FAIL`                           | so em teste         | `"true"` faz o mock devolver falha retentavel                                                                                                                    |

O desenho e fail-closed no boot: **configuracao incompleta com o switch LIGADO
nao sobe o processo**, em vez de subir e cobrar sem emitir nota. A mensagem do
`process.exit(1)` lista os nomes exatos das envs faltantes.

### 5.7 Smoke test pos-ativacao

Na ordem, e o passo 2 antes de qualquer coisa em producao:

1. **Sinal**: `curl -s https://api.boranatech.com.br/api/billing/nfse-status`
   deve devolver `{"data":{"nfse":"enabled"}}`. Se vier `disabled`, o boot
   ignorou a env (lembrando que so o literal exato `"true"` liga).
2. **Emissao em HOMOLOGACAO antes de producao**: com
   `NFSE_FOCUS_ENV=homologacao`, rodar `scripts/homologarNfse.mts`. O default da
   env ja e `homologacao` justamente para que esquecer de configurar mande a
   nota para o sandbox, que e recuperavel, em vez de emitir documento fiscal de
   verdade sem querer.
3. **Worker**: nos logs do boot, confirmar que o worker fiscal subiu. Ele exige
   `env.redisUrl` ALEM do switch (`server/index.ts:94`); com Redis ausente ele
   fica `null` em silencio, e a fila nao processa.
4. **Bucket**: nos logs, `[fiscal] bucket privado verificado.`. Se aparecer
   `[fiscal] ATENCAO: ...`, o Storage esta com problema; isso NAO derruba a
   aplicacao de proposito (o arquivamento e o passo que degrada, a nota continua
   sendo emitida), mas vai para o Sentry e precisa ser resolvido.
5. **Uma cobranca real de ponta a ponta**: confirmar a linha em
   `fiscal_invoices` com status `issued`, o PDF e o XML no bucket, o e-mail
   recebido com o anexo, e a nota aparecendo na secao "Suas notas" do `/perfil`.
6. **Painel do admin**: a aba financeiro deve mostrar os cartoes e a tabela, e
   nao mais a linha "Emissao de NFS-e desligada".

### 5.8 Rollback

`NFSE_ENABLED=false` na Railway, e redeploy.

Desliga **na hora** (ou no proximo boot, para os itens de boot):

- o worker da fila (nao e criado);
- os tres ganchos do webhook da Stripe (retornam antes de qualquer efeito);
- o cron (passa a pular com `nfse_disabled`, e o pulo fica registrado);
- as 4 rotas (voltam ao desfecho nomeado);
- o frontend inteiro, **na proxima carga de app de cada usuario** (o sinal e
  cacheado por carga, entao uma aba ja aberta so esconde ao recarregar).

**NAO desfaz**, e nao precisa desfazer:

- as migrations aplicadas (as tabelas e colunas ficam, vazias ou com o que ja
  foi gravado);
- as linhas de notas ja emitidas (documento fiscal emitido nao se apaga por
  variavel de ambiente; cancelamento de nota e outro processo, pela prefeitura);
- os types regenerados nem o contador em 86.

O rollback e barato exatamente porque tudo e fail-closed: nao existe estado
intermediario em que meio pipeline continua rodando. O que ja foi emitido
continua visivel para quem tem nota, porque o `GET /api/billing/invoices`
passa a devolver lista vazia, o que e a unica perda real do rollback e e
temporaria.

## 6. Pendencias externas

Duas, ambas pertencentes a frente do LinkedIn e nao a esta:

1. **As 4 strings de `server/routes/me.ts`** sem marcador `TODO(Ana)`, listadas
   em 4.1. O arquivo e um dos 7 em conflito, e esta frente nao o tocou.
2. **O comentario do `EXPECTED_ROUTE_COUNT`** em
   `server/routes/adminUsersGuards.test.ts` esta desatualizado: ele explica a
   linhagem ate 58 ("Era 58 desde as tres rotas de notas fiscais..."), mas o
   valor e **59**. Alguma frente somou uma rota de admin depois do commit fiscal
   e nao atualizou a prosa. O numero esta certo; a explicacao dele e que ficou
   sem o ultimo degrau.

## 7. Nota de integracao para a frente do LinkedIn

Para o merge de `feat/fiscal-fechamento` na `feat/linkedin-fase-4`:

- **Nenhum dos 7 arquivos em conflito foi tocado.** Confirmado nos quatro
  commits: `scripts/mutateLinkedinThresholds.mjs`, `server/app.ts`,
  `server/lib/aiUsageTool.test.ts`, `server/lib/linkedinAnalyze.ts`,
  `server/routes/adminUsersGuards.test.ts`, `server/routes/linkedin.ts` e
  `server/routes/me.ts` estao intactos.
- **`EXPECTED_ROUTE_COUNT` intocado em 59**, com `git diff` vazio no arquivo.
  A rota nova (`GET /api/billing/nfse-status`) mora no router de BILLING, que
  nao tem contador de rotas (verificado: `adminUsersGuards.test.ts` importa
  `adminRouter` e conta so ele).
- **O job `migrations` do CI da `feat/linkedin-fase-4` esta vermelho desde 12 de
  agosto, e as 5 fiscais precisam entrar na sequencia de deploy de voces.**
  Medido: `.github/workflows/ci.yml` dispara em `on: push:` SEM filtro de branch
  (linha 33, com o comentario "Dispara em push de QUALQUER branch, nao so
  main"), e o job `migrations` roda sempre que o evento e `push`
  (`if: github.event_name == 'push' || ...`, linha 72). O commit `33000fa7` e
  ancestral de `origin/feat/linkedin-fase-4` (verificado com
  `git merge-base --is-ancestor`), entao os arquivos fiscais estao no remoto
  desde 2026-08-12, declarando `fiscal_invoices` para um guard que a procura num
  banco onde ela nao existe.

  Ressalva de metodo: o veredito acima e DEDUZIDO de quatro medicoes (o gatilho
  roda nessa branch; o guard compara declarado com aplicado; o declarado inclui
  o fiscal desde 33000fa7; o banco nao tem nada fiscal). Nenhum run do GitHub
  Actions foi consultado desta maquina.

  Consequencia pratica: aplicar as 5 fiscais e o que deixa esse job verde, e
  vale para a `fase-4` tanto quanto para esta frente. `docs/linkedin-fase3-fechamento.md`
  ja manda migration antes de backend, e as 5 fiscais entram nessa mesma regra.
  **A ordem entre as migrations fiscais e as do LinkedIn e livre**: os conjuntos
  de objetos sao disjuntos (medido na secao F.4 do Passo 0 desta frente:
  `fiscal_invoices`, `dps_numero_seq` e colunas de `profiles` de um lado;
  `linkedin_analyses` e `linkedin_improvement_progress` do outro, e nenhuma das
  do LinkedIn toca `profiles`).

- **`scripts/mutateLinkedinThresholds.mjs` nao precisou mudar.** A lista
  `FONTES` dele nao inclui `server/routes/billing.ts` nem
  `server/routes/admin.ts`, e nenhum sitio numerico novo foi criado (as guardas
  sao booleanas; o unico literal novo e o status HTTP 409).

Arquivos NOVOS criados pela frente (8):

```
client/src/services/nfseStatus.ts
client/src/services/nfseStatus.test.tsx
client/src/components/fiscal/fiscalGate.test.tsx
client/src/components/admin/FiscalInvoicesDashboard.gate.test.tsx
client/src/pages/Checkout.gateFiscal.test.tsx
client/src/pages/Perfil.gateFiscal.test.tsx
server/routes/fiscalKillSwitch.test.ts
server/lib/fiscalProfileCheckMigration.test.ts
```

Arquivos MODIFICADOS (11): os quatro componentes fiscais, `Admin.tsx`,
`Checkout.tsx`, `Perfil.tsx`, `server/lib/email.ts`, `server/routes/admin.ts`,
`server/routes/billing.ts` e a migration `20260804130000`.

Os quatro commits, para cherry-pick ou fast-forward:

```
b38aa1dd fix(fiscal): guard fiscal routes behind nfse kill switch
9cf4cddf feat(fiscal): gate fiscal ui behind nfse kill switch
a21b80d0 chore(fiscal): mark visible fiscal copy and drop em dash placeholders
1c99f40b fix(fiscal): split profiles check into not valid plus validate
```

Baseline da suite ao fim do Marco 1: **259 arquivos e 3180 testes passando**, 3
arquivos e 10 testes pulados, com `pnpm check` em 0.
