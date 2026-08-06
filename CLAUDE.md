# CLAUDE.md (Bora na Tech)

## Regras de Trabalho

- Investigar antes de mudar: ler o código relevante e entender a causa antes de propor correção, nunca chutar.
- Tarefa ambígua: declarar a suposição ou perguntar, nunca escolher uma interpretação em silêncio.
- Escopo fechado: mexer só no que a tarefa pede. Não refatorar nem "limpar" código adjacente. Se algo de fora precisar mudar, sinalizar, não fazer.
- Não remover código nem comentário que não entende. Perguntar antes.
- Solução mais simples primeiro. Não introduzir abstração, dependência ou camada que a tarefa não pediu.
- Leitura direcionada: abrir arquivo e trecho específicos, não "ler o projeto inteiro".
- Antes de considerar pronto: rodar `pnpm check`. Mudança em auth, controle de acesso ou deploy exige validação manual antes de subir.
- O hook de pre-commit está em `.githooks/pre-commit` e roda a suíte inteira, a suíte de novo sem `.env` e o `pnpm check`. `--no-verify` só em emergência; se o hook não estiver rodando, `git config core.hooksPath .githooks` (por quê: `docs/decisoes.md#hook-de-pre-commit`).
- Instrumento de verificação cujo escopo é derivado por um parser que pode sub-casar em silêncio sempre falha PASSANDO (detalhe: `docs/postmortems-instrumentos.md#escopo-derivado-por-parser`).
- Guard afirma o TOTAL, não só a pertinência: "existem exatamente N, e são estes", nunca "os N que eu conheço estão lá" (detalhe: `docs/postmortems-instrumentos.md#afirmar-o-total`).
- Reproduzir ausência de ARQUIVO renomeando o arquivo, nunca limpando variável de ambiente (detalhe: `docs/postmortems-instrumentos.md#ausencia-de-arquivo`).
- Teste que lê `env.*` precisa mockar `./env`, porque no CI não existe arquivo `.env`.
- Trocar simulação por um ambiente que genuinamente não tem a coisa, sempre que der (detalhe: `docs/postmortems-instrumentos.md#nao-simular-a-condicao`).
- Proteção dentro da função, nunca no call site; quando não couber dentro, o teste que enumera os call sites é o plano B (por quê: `docs/decisoes.md#protecao-dentro-da-funcao`).
- Fallback neutro para valor de APRESENTAÇÃO; exceção para valor que É a informação. O critério: degradar este valor produz um resultado que alguém pode confundir com correto? Se sim, lance (por quê: `docs/decisoes.md#fallback-vs-excecao`).
- Classificar por ORIGEM da chave, nunca pela forma do acesso. Enumeração por forma acha candidatos; o veredito exige seguir a origem (por quê: `docs/decisoes.md#origem-da-chave`).
- Verificar nos dois sentidos: "o que declarei existe?" não é a mesma pergunta que "o que existe está declarado?" (detalhe: `docs/postmortems-instrumentos.md#verificar-nos-dois-sentidos`).
- Conteúdo e copy: nunca inventar dado (números de mercado, salários, instituições). Sem fonte, suavizar pra qualitativo ou remover.

## Stack

- **Frontend**: React 19 SPA, Vite 7, TypeScript 5.6 (`strict: true`)
- **Roteamento**: wouter 3 (`<Switch>/<Route>` centralizado em `client/src/App.tsx`)
- **UI**: Tailwind CSS v4 (`@tailwindcss/vite`) + Radix UI primitivos + shadcn (`components.json`)
- **Icons**: lucide-react
- **State**: React Context puro (`AuthContext`, `SubscriptionContext`, `ThemeContext`)
- **Forms**: react-hook-form + zod v4
- **Backend**: Express 4 (porta 3100 em dev) + Supabase (supabase-js v2) + BullMQ/ioredis
- **Integrações**: Stripe (pagamentos, SDK `stripe` v22, client em `server/lib/stripeClient.ts`), Resend (email), Currents API + OpenAI gpt-4o-mini (notícias), PostHog (analytics); auth Supabase via PKCE. O Asaas foi o gateway anterior e não existe mais no código: a migration `20260714010505_remove_asaas_data_and_defaults.sql` removeu os dados dele.
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
pnpm test           # vitest run (suite inteira)
pnpm format         # prettier --write .
```

> Não há ESLint, Biome nem oxlint no projeto: a única checagem de estilo é o Prettier, e `pnpm format` reescreve o repositório inteiro. Para conferir só o que você mexeu, `npx prettier --check <arquivos>`. Vários arquivos já em `main` não passam nesse check, então um warn não significa que foi você: compare com a versão em `HEAD` antes de concluir.

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
routes/ # admin, ai, billing, bookmarks, content, cron, me, quiz, study (não há search: a busca é client-side sobre `client/src/lib/data.ts`; `server/lib/searchIndex.ts` alimenta outra coisa)
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
- **Lookups por valor do servidor**: acesso a mapa indexado por valor vindo do servidor (status, type, category, enums) passa por resolver com fallback neutro, nunca acesso direto. Referência: `notificationTypeMetaOf` em `client/src/lib/notificationTypeMeta.ts` (por quê: `docs/decisoes.md#fallback-vs-excecao`).
- **Header/Footer remontam a cada navegação**: o `Layout` é renderizado dentro de cada página, então `useState`/`useRef` locais deles renascem a cada rota. Estado que precisa sobreviver à navegação vive em Context; fetch no Header/Footer precisa de cache ou Context (por quê: `docs/decisoes.md#header-footer-remontam`).

## Convenções do Server

- Cada arquivo de rota cria `const router = Router()` e exporta `router`
- Guarda de auth: `router.use(requireAuth)` e/ou `router.use(checkProStatus)` no topo
- Erros: `return next(createError(statusCode, "code_slug", "Mensagem."))`, nunca throw direto
- Queries via `supabaseAdmin` (service role), nunca o client Supabase do frontend no server
- Renomear campo de resposta é expand/contract com alias, nunca troca seca: emitir os dois nomes, esperar o tempo de vida de uma sessão, remover o alias depois (por quê: `docs/decisoes.md#expand-contract`)

## Acesso Pro

- `isPro || isAdmin` é intencional em toda a plataforma: admin enxerga como Pro por design, não é bug.
- Produto: catálogo e descoberta são grátis; análise personalizada por IA é Pro. Exceções explícitas (decisão de produto): o Comparador (/comparador e /tecnologias/comparar) e a área de entrevistas (/entrevistas) são 100% Pro. Isso decide onde entra ProGate/paywall.
- Cursos e Plataformas são freemium: o grátis vê uma amostra (tamanhos em `client/src/lib/freeTierLimits.ts`, reexport de `shared/freeTierLimits.ts`, fonte única compartilhada com o server), o Pro vê tudo.
- O gate por tier não alcança o bundle JS: o catálogo completo continua extraível dele (detalhe: `docs/decisoes.md#divida-gating-catalogo`).

## Política de Branch e Deploy

- **Trabalho em branch, `main` é produção.** Nada de commit direto na `main`.
- **CI roda em push de qualquer branch** (`.github/workflows/ci.yml`), então a validação acontece antes da `main`, sem cerimônia de PR.
- **Fast-forward quando o CI estiver verde.** Sem merge commit, sem PR. Antes de subir, conferir que é fast-forward mesmo: `git rev-list --count <branch>..origin/main` tem que dar 0.
- **`/home/s0ft/bnt-main` é o worktree de deploy, e ninguém edita lá.** Aceita `cherry-pick`, `merge --ff-only` e `push`. Editar arquivo, não, inclusive documentação (por quê: `docs/decisoes.md#worktree-de-deploy`).
- **`git worktree lock` NÃO impede edição**, e o hook de pre-commit que recusaria commit vindo do `bnt-main` foi descartado: não tente de novo (por quê: `docs/decisoes.md#worktree-lock`).
- **Frentes paralelas usam WORKTREES SEPARADOS, nunca o mesmo working tree**, e isso inclui experimento que modifica prompt. A receita de criação e o que é compartilhado entre worktrees estão em `docs/decisoes.md#worktrees-paralelos`.
- **`git add <arquivo>` não limita o commit àquele arquivo**: o commit leva o índice inteiro. Em árvore compartilhada, use `git commit -- <arquivos>`.
- **Branch de dias, não de semanas.** Lote grande transforma qualquer problema numa investigação entre muitos suspeitos (por quê: `docs/decisoes.md`).
- **Deploy NÃO é atômico**: Vercel (frontend) e Railway (backend) sobem independentes, e a Vercel costuma terminar primeiro. Existe uma janela de 1 a 3 minutos com front novo contra backend antigo. Todo campo novo que o front leia precisa degradar sozinho nessa janela, e a prova é teste, não inspeção (`shared/linkedin/janelaDeDeploy.test.ts`).
- **NÃO rodar análise em preview da Vercel**: o preview fala com o Railway e o Supabase de produção, então grava linha real e consome cota de IA. Preview serve para ver a interface, não para exercitar fluxo (por quê: `docs/decisoes.md#preview-vercel`).
- **Medir estado de produção por endpoint que DECLARA o estado, em amostra única**, nunca por frequência: `uptime` do `/api/health`, nome do bundle no `index.html` (por quê: `docs/decisoes.md#medir-producao`).
- **Código antes da migration**, com o checklist de 5 passos e a janela de migration destrutiva em `.claude/rules/migrations.md`.
- `pnpm check` deve estar VERDE antes de deployar: o Vite builda mesmo com `tsc` vermelho, então um check vermelho não impede um deploy quebrado de subir. `pnpm check` é offline e NÃO inclui `check:migrations`, que precisa de rede e do service role.

## Convenções de Git / Commits

**REGRA CRÍTICA, sempre seguir:**

- **LÍNGUA**: mensagens de commit DEVEM ser escritas em **INGLÊS**, sempre. Os exemplos abaixo refletem isso. Não usar português, nem mistura PT/EN.
- **Formato Conventional Commits**: `tipo(escopo): descrição curta no imperativo`. Verbo no imperativo presente (`add`, `fix`, `remove`, `wire`), nunca em "-s"/"-ing"/"-ed". Ex: `feat(billing): add reactivate endpoint`.
- **Sem travessão nem meia-risca em nenhum texto, código ou copy do projeto.** Hífen comum (`-`) só em palavras compostas legítimas. Substituir por pontos finais, vírgulas ou parênteses.

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

## Arquivos Importantes

- `client/src/pages/HomeLanding.tsx`, home pública (10 seções + footer)
- `client/src/App.tsx`, todas as rotas declaradas aqui
- `client/src/lib/data.ts`, dados estáticos das áreas, eventos, notícias
- `server/lib/env.ts`, validação de variáveis de ambiente
- `server/middleware/auth.ts`, injeta `req.user` e `req.isPro`
- `client/public/sitemap.xml`, sitemap estático (não há rota de sitemap no server); é ele que define quais rotas o prerender (`scripts/prerender.mjs`) gera na Vercel
- Conteúdo vive em dois lugares: estático em `client/src/lib/data.ts` e tabelas no Supabase. Confirmar qual é o canônico da feature antes de editar (roadmaps renderizam do estático).

## Regras com escopo de caminho

Carregam sozinhas quando você mexe nos arquivos que elas cobrem:

- `.claude/rules/migrations.md`, para `supabase/migrations/**` e `scripts/checkMigrationsApplied.mts`
- `.claude/rules/linkedin-limiares.md`, para `shared/linkedin/**`, `server/lib/linkedinChecks.ts` e `client/src/components/linkedin/**`
- `.claude/rules/github-workflows.md`, para `.github/workflows/**`
