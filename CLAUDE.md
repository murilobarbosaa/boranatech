# CLAUDE.md (Bora na Tech)

## Regras de Trabalho

- Investigar antes de mudar: ler o código relevante e entender a causa antes de propor correção, nunca chutar.
- Tarefa ambígua: declarar a suposição ou perguntar, nunca escolher uma interpretação em silêncio.
- Escopo fechado: mexer só no que a tarefa pede. Não refatorar nem "limpar" código adjacente. Se algo de fora precisar mudar, sinalizar, não fazer.
- Não remover código nem comentário que não entende. Perguntar antes.
- Solução mais simples primeiro. Não introduzir abstração, dependência ou camada que a tarefa não pediu.
- Leitura direcionada: abrir arquivo e trecho específicos, não "ler o projeto inteiro".
- Antes de considerar pronto: rodar `pnpm check`. Mudança em auth, controle de acesso ou deploy exige validação manual antes de subir.
- Hook de pre-commit versionado em `.githooks/pre-commit` (suite inteira + `pnpm check`, ~11s). Roda a suite toda de proposito: a versao com lista de arquivos escrita a mao deixou passar um commit com 10 testes vermelhos. `pnpm check` NAO cobre `*.test.ts` (o `tsconfig.json` os exclui), entao erro de tipo em teste so aparece rodando o teste. O `prepare` do `package.json` aponta o `core.hooksPath` sozinho no `pnpm install`; se o hook não estiver rodando, `git config core.hooksPath .githooks`. `--no-verify` só em emergência.
- **Instrumento de verificação cujo escopo é derivado por um parser que pode sub-casar em silêncio sempre falha PASSANDO.** Lista escrita à mão é só o caso degenerado; regex, janela de contexto e casamento de padrão são o mesmo mecanismo. Instâncias nesta base, **sem numeral de propósito**: uma contagem escrita à mão nesta frase seria ela mesma um caso da classe que o parágrafo documenta, e ficaria desatualizada no primeiro esquecimento. A lista cresce, o total não é afirmado aqui.

  - a migration que dependia de alguém lembrar de aplicar;
  - o regex do `checkMigrationsApplied` que enxergava 38 de 72 tabelas;
  - o pre-commit com lista de arquivos, que liberou árvore vermelha;
  - a janela de 4000 caracteres que classificou duas RPC reais como trigger e as tirou da verificação;
  - o `stripSqlComments` que casou o `/*` de `/api/cron/*` com o `*/` de um cron `*/6` e apagou 3663 caracteres de SQL real;
  - o parser que aplicava todos os `CREATE` antes de todos os `DROP`, desfazendo declaração de quem dropa e recria;
  - o `contarLinhas` devolvendo -1: erro de rede virou "protegida", e falha de infra foi contada como sucesso de segurança;
  - as 35 tabelas reportadas como cobertas por policy quando estavam cobertas por privilégio, um veredito certo sobre o efeito e errado sobre o mecanismo;
  - o `env -i`, que para provar "a suíte roda sem ambiente" limpou as variáveis do shell em vez do arquivo `.env` do disco, que o `dotenv` lê direto, e devolveu 549 testes verdes sobre uma condição que nunca existiu;
  - o **blip de disponibilidade** usado para detectar quando o Railway terminou um deploy: o Railway troca sem downtime, e as 150 amostras deram 200 sem uma exceção. O instrumento não teria funcionado nem num dia limpo, e o silêncio dele era indistinguível de "ainda não subiu";
  - o **checklist de smoke test que morava só na conversa**: sumiu numa compactação de contexto, no meio do deploy que ele existia para validar, e a reconstrução de memória perdeu 3 dos 11 passos, justamente os três dos bugs que motivaram a Fase 1. É a mesma classe com outro suporte: o escopo foi derivado de um armazenamento que encolhe em silêncio, e o que sobrou parecia uma lista completa. **Contramedida: artefato de release é documento versionado no repositório (`docs/smoke-linkedin.md`), nunca mensagem de chat.** Serve para qualquer artefato crítico: se não está em arquivo commitado, não existe.

  Nenhum deles acusou nada: todos reportaram sucesso sobre uma superfície menor.
- **Contramedida que funcionou nas três vezes em que foi aplicada: afirmar o TOTAL, não só a pertinência.** Um guard que responde "os N que eu conheço estão lá" é inútil; um que responde "existem exatamente N, e são estes" quebra quando o conjunto muda. Na prática: (1) contar as ocorrências amplas e comparar com as que o parser leu, abortando na diferença; (2) asserção de tamanho do conjunto (`EXPECTED_TABLE_COUNT`, `EXPECTED_FUNCTION_COUNT`, `EXPECTED_RLS_COUNT`), cuja alteração é ato deliberado no commit da migration; (3) descoberta a partir da fonte com **aborto em item não classificado**, como em `scripts/mutateLinkedinThresholds.mjs`, onde todo sítio numérico precisa estar em uma de duas listas e um sítio novo derruba a execução.
- **Reproduzir ausência de ARQUIVO renomeando o arquivo, nunca limpando variável.** Contramedida da sétima instância, e ela generaliza: quando a afirmação é "roda sem X", o teste precisa remover X, não algo correlacionado com X. `env -i` limpa o ambiente do shell, mas `server/lib/env.ts` chama `config()` do `dotenv`, que lê `.env` do disco e não depende do shell; a checagem válida é `mv .env .env.probe-bak`, rodar, restaurar, e conferir o md5 depois. Detalhe em `docs/harness-fidelidade-instrumento.md`, seção 2-bis.
- **Renomear campo de resposta é expand/contract com alias, nunca troca seca.** E o motivo não é a janela de deploy: é que **todo cliente com JS antigo em execução** continua lendo o nome velho até recarregar, e não existe prazo para isso. Aba aberta desde antes do deploy não é alcançada por redeploy nenhum do frontend; só o backend alcança. Medido nesta base: `f70f1b3` renomeou `skillsSugeridas` para `skillsParaEstudar`, única mudança não-aditiva em 94 commits, e o bundle anterior lia o nome antigo sem guarda (`.length` direto), então a ausência derrubava o render inteiro do resultado com `TypeError` em vez de degradar. O procedimento: (1) **expand**, o backend emite os dois nomes, na resposta E no que persiste, com data de remoção no comentário; (2) esperar o tempo de vida plausível de uma sessão; (3) **contract**, remover o alias no mesmo commit que atualiza o teste que trava a decisão (`server/lib/janelaDeDeployInversa.test.ts`).
- **Medir estado de produção por endpoint que DECLARA o estado, em amostra única. Nunca por frequência.** Estado que se afirma: `uptime` do `/api/health` (dá o instante em que o processo subiu, com uma requisição), o nome do bundle no `index.html` (dá qual build está sendo servido, com uma requisição). Estado que se infere de repetição: "bati de 2 em 2 segundos e num momento mudou". A segunda forma custa mais, mede pior e **tem efeito colateral**: um loop de 150 requisições em 5 minutos contra `boranatech.com.br` disparou a mitigação da Vercel (`x-vercel-mitigated: challenge`, 403 para tudo que não seja navegador), e o desafio cegou exatamente a medição que o loop existia para fazer. Além de não medir, apagou a evidência.
- **O instrumento que não simula a condição é o que pega.** Ponto positivo a copiar, não só erro a evitar: o CI é o primeiro instrumento desta série sem o defeito da classe, e o motivo é estrutural. Ele não *simula* a ausência do `.env`, ele simplesmente **não tem** `.env` (o job `qualidade` não recebe secret nenhum). Não existe parser meu decidindo o escopo, então não existe escopo para encolher em silêncio. Foi ele quem pegou o que o `env -i` deixou passar, no primeiro push. Sempre que der para trocar uma simulação por um ambiente que genuinamente não tem a coisa, trocar.
- **Proteção dentro da função, nunca no call site.** A contramedida acima é de DETECÇÃO; esta é de PREVENÇÃO, e é mais barata. Guarda escrita no chamador precisa ser repetida em cada chamador e some no primeiro que alguém esquecer; guarda escrita dentro da função cobre todos os chamadores por construção, inclusive os que ainda não existem. Os dois casos desta base, medidos: `setScoreDelta` tinha **2 call sites e a guarda no chamador**, e um dos dois ficou sem a supressão por autodeclaração (corrigido com um funil único, `shared/linkedin/deltaFunil.ts`); `logAiUsage` tem **84 call sites e a guarda dentro**, procurando a reserva por `(usuario, tool)`, e os 84 estão cobertos sem ninguém ter que lembrar de nada. Quando a guarda não couber dentro, o teste que enumera os call sites da fonte é o plano B, não o A.
- **Verificar nos dois sentidos.** "O que declarei existe?" não é a mesma pergunta que "o que existe está declarado?". A segunda é o que separa backup físico de reconstrução a partir das migrations, que é o que um ambiente de ensaio faz.
- Conteúdo e copy: nunca inventar dado (números de mercado, salários, instituições). Sem fonte, suavizar pra qualitativo ou remover.

## Stack

- **Frontend**: React 19 SPA, Vite 7, TypeScript 5.6 (`strict: true`)
- **Roteamento**: wouter 3 (`<Switch>/<Route>` centralizado em `client/src/App.tsx`)
- **UI**: Tailwind CSS v4 (`@tailwindcss/vite`) + Radix UI primitivos + shadcn (`components.json`)
- **Icons**: lucide-react
- **State**: React Context puro (`AuthContext`, `SubscriptionContext`, `ThemeContext`)
- **Forms**: react-hook-form + zod v4
- **Backend**: Express 4 (porta 3100 em dev) + Supabase (supabase-js v2) + BullMQ/ioredis
- **Integrações**: Asaas (pagamentos), Resend (email), Currents API + OpenAI gpt-4o-mini (notícias), PostHog (analytics); auth Supabase via PKCE
- **Package manager**: pnpm 10

## Path Aliases

@/_ → client/src/_
@shared/_ → shared/_
@assets → attached_assets/ (vite.config apenas)

## Comandos

```bash
pnpm dev            # client (3000) + server (3100) em paralelo
pnpm dev:client     # só Vite
pnpm dev:server     # só Express
pnpm build          # vite build + esbuild server bundle → dist/
pnpm start          # NODE_ENV=production node dist/index.js
pnpm check          # tsc --noEmit
pnpm format         # prettier --write .
```

> Sem script `test` no package.json. Vitest instalado mas não exposto.

## Estrutura

client/src/
components/
ui/ # shadcn primitivos gerados, não editar manualmente
shared/ # componentes reutilizáveis entre páginas
pro/ # badges Pro, paywalls
admin/
contexts/ # AuthContext, SubscriptionContext, ThemeContext
hooks/
lib/ # utils.ts, supabase.ts, aiClient.ts, data files estáticos
pages/ # 60+ páginas, uma por rota, nomeadas em português
services/ # contracts.ts (tipos), profileService.ts
server/
routes/ # admin, ai, billing, bookmarks, content, cron, me, quiz, search, study
middleware/ # auth.ts (requireAuth, checkProStatus), error.ts (createError)
lib/ # env, supabaseAdmin, openai, aiTools, queue
shared/const.ts # COOKIE_NAME, ONE_YEAR_MS
supabase/migrations/

## Convenções de Componentes

- **Estrutura de arquivo**: imports → constantes/data → sub-componentes → `export default` principal
- **Tipagem**: props sempre tipadas inline ou com `interface` local, sem PropTypes
- **Estilo**: 100% Tailwind; classes arbitrárias `shadow-[5px_5px_0_#cor]` são padrão do projeto
- **Classes custom globais**: `bnt-pressable` (efeito press), `animate-marquee-left`, `animate-gentle-float` (definidas em `index.css`)
- **Nomes**: arquivos e componentes em PascalCase; páginas nomeadas em português (ex: `TecnologiaMapa`)
- Sem CSS modules, styled-components ou comentários explicativos no JSX
- **Lookups por valor do servidor**: todo acesso a mapa/dicionário indexado por um valor que vem do servidor (status, type, audience, category, enums em geral) passa por um resolver com fallback neutro, nunca acesso direto. Um enum novo que o bundle ainda não conhece derruba a página inteira (`STATUS_META[item.status].label` quebrou o admin em produção com `Cannot read properties of undefined (reading 'label')`). Referência de implementação: `notificationTypeMetaOf` em `client/src/lib/notificationTypeMeta.ts`.
- **Header/Footer remontam a cada navegação**: o `Layout` (Header + main + Footer) é renderizado DENTRO de cada página, não em volta do `<Switch>` (`App.tsx`), então o wouter desmonta e remonta o Header e o Footer a cada troca de rota, e todo `useState`/`useRef` local deles renasce. Estado que precisa SOBREVIVER à navegação vive em Context (montado uma vez em `App.tsx`), nunca em estado local do Header/Footer; estado efêmero de UI (dropdown aberto, drawer, modal) pode ficar local, porque resetar ao navegar é o comportamento desejado. Caso real: a animação de chegada do sino não disparava porque o `useRef` do contador anterior renascia semeado a cada navegação, corrigido movendo o sinal para o `NotificationsContext`. Efeitos de fetch no Header/Footer também disparam a cada navegação, então precisam de cache/Context (ex.: `client/src/lib/newsletterState.ts`, uma chamada por carga de app).

## Convenções do Server

- Cada arquivo de rota cria `const router = Router()` e exporta `router`
- Guarda de auth: `router.use(requireAuth)` e/ou `router.use(checkProStatus)` no topo
- Erros: `return next(createError(statusCode, "code_slug", "Mensagem."))`, nunca throw direto
- Queries via `supabaseAdmin` (service role), nunca o client Supabase do frontend no server

## Acesso Pro

- `isPro || isAdmin` é intencional em toda a plataforma: admin enxerga como Pro por design, não é bug.
- Produto: catálogo e descoberta são grátis; análise personalizada por IA é Pro. Exceções explícitas (decisão de produto de 2026-07): o Comparador (/comparador e /tecnologias/comparar) e a área de entrevistas (/entrevistas) são 100% Pro. Isso decide onde entra ProGate/paywall.
- Cursos e Plataformas são freemium: o grátis vê uma amostra (tamanhos em `client/src/lib/freeTierLimits.ts`, reexport de `shared/freeTierLimits.ts`, fonte única compartilhada com o server), o Pro vê tudo.
- Dívida conhecida do gating de catálogo: o gate por tier cobre a API (`server/routes/content.ts`), o DOM, o HTML prerenderizado e o JSON-LD, mas o catálogo completo continua extraível do bundle JS, porque `client/src/lib/data.ts` é a fonte canônica e é importada estaticamente pelas páginas. Fechar isso exige inverter a fonte canônica para o DB (servir só a amostra ao free no runtime), o que é um projeto à parte.

## Política de Branch e Deploy

Decidida em 2026-07-27, depois de um lote de 94 commits acumulados sem subir.

- **Trabalho em branch, `main` é produção.** Nada de commit direto na `main`.
- **CI roda em push de qualquer branch** (`.github/workflows/ci.yml`), então a validação acontece antes da `main`, sem cerimônia de PR. Repositório de uma pessoa: PR sem revisor cobra sem pagar.
- **Fast-forward quando o CI estiver verde.** Sem merge commit, sem PR. Antes de subir, conferir que é fast-forward mesmo: `git rev-list --count <branch>..origin/main` tem que dar 0.
- **Branch de dias, não de semanas.** O lote de 94 commits de julho é o anti-padrão a não repetir: cada fase da auditoria deveria ter sido um deploy com 24h de observação. Lote grande transforma qualquer problema numa investigação entre 94 suspeitos, e adia a única verificação que vale, que é o comportamento em produção.
- **Deploy NÃO é atômico**: Vercel (frontend) e Railway (backend) sobem independentes, e a Vercel costuma terminar primeiro. Existe uma janela de 1 a 3 minutos com front novo contra backend antigo. Todo campo novo que o front leia precisa degradar sozinho nessa janela, e a prova é teste, não inspeção (`shared/linkedin/janelaDeDeploy.test.ts` usa a resposta real do backend antigo).
- **NÃO rodar análise em preview da Vercel.** `VITE_API_URL`, `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão no escopo Production **and** Preview, então o preview fala com o Railway e o Supabase de produção: uma análise rodada nele grava linha real em `linkedin_analyses` e consome cota de IA de verdade. Preview serve para ver a interface, não para exercitar fluxo. Duas alternativas foram descartadas em 2026-07-27, e o motivo fica aqui para a decisão não ser reaberta do zero: **desligar o preview** (`ignoreCommand` no `vercel.json`) tiraria a única forma de ver o frontend antes da `main`; **ambiente de ensaio de verdade** exige um segundo Supabase e um segundo Railway, com custo próprio e com o mesmo problema de sincronia de schema que `docs/ambiente-backup-restauracao.md` já recomendou evitar. `VITE_POSTHOG_KEY` e `VITE_POSTHOG_HOST` ficaram só em Production, então preview não polui telemetria (e o `posthog.init` sem chave não quebra: testado, ele loga e segue).
- **`on: push` sem filtro mais `pull_request` faz o workflow rodar DUAS vezes num PR do mesmo repositório.** Sem efeito hoje, porque o fluxo é branch e fast-forward, sem PR. Se PR voltar a ser usado, filtrar um dos dois gatilhos.
- **Teste que lê `env.*` precisa mockar `./env`.** No CI não existe arquivo `.env` e o job `qualidade` não recebe secret nenhum. E cuidado com a verificação: `env -i` **não** isola o `dotenv`, que lê o arquivo do disco; a checagem válida é `mv .env .env.bak`, rodar, restaurar. Ver `docs/harness-fidelidade-instrumento.md`, seção 2-bis.

## Convenções de Git / Commits

**REGRA CRÍTICA, sempre seguir:**

- **LÍNGUA**: mensagens de commit DEVEM ser escritas em **INGLÊS**, sempre. Os exemplos abaixo refletem isso. Não usar português, nem mistura PT/EN.
- **Formato Conventional Commits**: `tipo(escopo): descrição curta no imperativo`. Verbo no imperativo presente (`add`, `fix`, `remove`, `wire`), nunca em "-s"/"-ing"/"-ed". Ex: `feat(billing): add reactivate endpoint`.
- **Sem travessão (`—`) nem meia-risca (`–`) em nenhum texto, código ou copy do projeto.** Hífen comum (`-`) só em palavras compostas legítimas. Substituir por pontos finais, vírgulas ou parênteses.

Commits são **uma única linha** no formato `tipo(escopo): descrição curta`.

- **NUNCA** escrever mensagens multi-linha
- **NUNCA** adicionar parágrafos de contexto, bullet points, ou descrição estendida
- **NUNCA** adicionar `Co-Authored-By:` ou qualquer trailer
- **NUNCA** reescrever histórico já publicado em `origin/main`.
- **NUNCA** alterar `.nvmrc` nem o campo `engines` do `package.json`.
- O subject é a única coisa que vai no commit, sem body, sem footer

**Tipos permitidos**: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `test`, `perf`

**Exemplos corretos:**
feat(noticias): scroll to top on page change
fix(auth): replace 800ms race with url-based recovery detection
refactor(jobs): switch syncNews to EN keywords with inline enrichment
chore(db): remove legacy PT-PT news rows without enrichment

**Exemplos errados (NÃO fazer):**
fix(auth): replace 800ms race
The previous 800ms grace timer redirected legitimate recovery visits to...
[parágrafos explicando o que mudou]
Co-Authored-By: Claude Opus 4.7 noreply@anthropic.com

Se o contexto da mudança precisar de explicação detalhada, isso vai em PR description ou em documentação separada, nunca no commit message.

**Como fazer commit no terminal sem cair na armadilha:**

```bash
git commit -m "tipo(escopo): descrição curta"
```

Usar `-m` direto evita o editor abrir e tentar gerar descrição estendida automaticamente.

## Paleta & Design System

| Token            | Valor                                         |
| ---------------- | --------------------------------------------- |
| Amarelo primário | `#FFB800`                                     |
| Fundo cream      | `#faf8f4`                                     |
| Border padrão    | `border-slate-950` (quase preto)              |
| Sombra flat      | `shadow-[5px_5px_0_#0f172a]` ou cor de acento |
| Violet acento    | `violet-800` / `#c4b5fd`                      |
| Emerald (grátis) | `emerald-*`                                   |

Tipografia de seção: `font-display font-black` para headings; labels de seção `text-sm font-black uppercase tracking-[0.2em]`.

## Deploy

| Alvo    | Config                                                            |
| ------- | ----------------------------------------------------------------- |
| Vercel  | Só frontend, catch-all rewrite `/(.*) → /index.html`              |
| Railway | Fullstack, nixpacks, `npm run build`, start: `node dist/index.js` |

### Ordem de deploy: código antes da migration

- Aplicar migration (`db:push`) apenas DEPOIS ou SIMULTANEAMENTE ao deploy do código que a consome, nunca antes. Justificativa: código novo tolera schema antigo (colunas nullable, guardas de fallback); schema novo NÃO é tolerado por código antigo (migration + cron no banco sem o endpoint deployado = notificação agendada não dispara; enum novo no banco sem o frontend que o conhece = crash de admin).
- Checklist: (1) commit + push, (2) deploy de backend e frontend, (3) `db:push` (ou o SQL da migration no SQL Editor), (4) **`pnpm check:migrations` contra o banco alvo**, (5) smoke test.
- O passo (4) não é opcional: a regra acima protege contra migration ANTES do código, mas não contra a migration que nunca chega DEPOIS. Foi exatamente isso que aconteceu com `20260710120000_create_linkedin_improvement_progress.sql`: o código subiu, a migration ficou só no repositório, e o checklist de melhorias do Analisador de LinkedIn nasceu morto em produção devolvendo 500. Nada acusou, porque código novo tolerando schema antigo é justamente o que o passo (3) pressupõe. `pnpm check:migrations` compara as tabelas declaradas em `supabase/migrations/*.sql` com as que existem no banco e falha listando as ausentes.
- O mesmo guard roda no CI (`.github/workflows/ci.yml`, job `migrations`), porque passo de checklist que depende de memória humana é o desenho que já falhou uma vez. O CI precisa dos secrets `VITE_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`; sem eles o job falha com mensagem explícita, o que é o comportamento desejado.
- `EXPECTED_TABLE_COUNT` no script é uma asserção do tamanho do conjunto declarado, para pegar o caso em que o parser encolhe em silêncio. **Alterar esse número é ato deliberado**, feito no mesmo commit da migration que cria ou dropa a tabela, com o nome dela na mensagem do commit. Se o script reclamar do número sem você ter mexido em migration, investigue o parser antes de mexer no número.

### Janela de migration destrutiva

O backup do Supabase é **diário, por volta de 04:15 (horário de Brasília)**, e **PITR está desabilitado**. Isso significa RPO de até 24 horas: não existe "voltar para ontem às 14h32", só para o instante do último backup. Quebrar o banco às 21h custa cerca de 17 horas de dados; às 5h custa cerca de 45 minutos.

- **Migration que ALTERA ou REMOVE dado** (`drop column`, `drop table`, `alter column type`, `update`/`delete` de backfill, `rename`) roda **somente na janela imediatamente posterior ao backup diário, entre 05h e 09h de Brasília**. Registre no commit ou no PR o horário e o motivo em uma linha, no formato: `janela: 06h10, backup de <data> confirmado COMPLETED`.
- **Migration puramente aditiva é ISENTA da janela** e pode rodar a qualquer hora. O motivo é que ela não tem o que perder: criar tabela nova e vazia, adicionar coluna nullable, criar índice ou policy não destrói dado existente, então um rollback é `drop` do que acabou de ser criado, sem depender de backup. Foi o caso da `20260710120000_create_linkedin_improvement_progress.sql`.
- **Antes de qualquer migration destrutiva**, confirme que o backup da noite anterior existe e está `COMPLETED`:

```bash
set -a && . ./.env && set +a
curl -s "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/backups" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  | grep -oE '"status":"[A-Z]+","inserted_at":"[^"]+"' | head -3
```

Saída esperada (o mais recente primeiro):

```
"status":"COMPLETED","inserted_at":"2026-07-26T07:16:38.430Z"
```

Se o backup mais recente não for de hoje de madrugada, ou não estiver `COMPLETED`, **não rode a migration**: sem backup válido a janela não protege nada. Procedimento de restauração e ensaio em `docs/ambiente-backup-restauracao.md`.
- `pnpm check` deve estar VERDE antes de deployar: o Vite builda mesmo com `tsc` vermelho, então um check vermelho não impede um deploy quebrado de subir. `pnpm check` é offline e NÃO inclui `check:migrations`, que precisa de rede e do service role.

## Arquivos Importantes

- `client/src/pages/HomeLanding.tsx`, home pública (10 seções + footer)
- `client/src/App.tsx`, todas as rotas declaradas aqui
- `client/src/lib/data.ts`, dados estáticos das áreas, eventos, notícias
- `server/lib/env.ts`, validação de variáveis de ambiente
- `server/middleware/auth.ts`, injeta `req.user` e `req.isPro`
- `client/public/sitemap.xml`, sitemap estático (não há rota de sitemap no server); é ele que define quais rotas o prerender (`scripts/prerender.mjs`) gera na Vercel
- Conteúdo vive em dois lugares: estático em `client/src/lib/data.ts` e tabelas no Supabase. Confirmar qual é o canônico da feature antes de editar (roadmaps renderizam do estático).
