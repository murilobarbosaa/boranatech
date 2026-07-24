# CLAUDE.md (Bora na Tech)

## Regras de Trabalho

- Investigar antes de mudar: ler o código relevante e entender a causa antes de propor correção, nunca chutar.
- Tarefa ambígua: declarar a suposição ou perguntar, nunca escolher uma interpretação em silêncio.
- Escopo fechado: mexer só no que a tarefa pede. Não refatorar nem "limpar" código adjacente. Se algo de fora precisar mudar, sinalizar, não fazer.
- Não remover código nem comentário que não entende. Perguntar antes.
- Solução mais simples primeiro. Não introduzir abstração, dependência ou camada que a tarefa não pediu.
- Leitura direcionada: abrir arquivo e trecho específicos, não "ler o projeto inteiro".
- Antes de considerar pronto: rodar `pnpm check`. Mudança em auth, controle de acesso ou deploy exige validação manual antes de subir.
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
- Checklist: (1) commit + push, (2) deploy de backend e frontend, (3) `db:push`, (4) smoke test.
- `pnpm check` deve estar VERDE antes de deployar: o Vite builda mesmo com `tsc` vermelho, então um check vermelho não impede um deploy quebrado de subir.

## Arquivos Importantes

- `client/src/pages/HomeLanding.tsx`, home pública (10 seções + footer)
- `client/src/App.tsx`, todas as rotas declaradas aqui
- `client/src/lib/data.ts`, dados estáticos das áreas, eventos, notícias
- `server/lib/env.ts`, validação de variáveis de ambiente
- `server/middleware/auth.ts`, injeta `req.user` e `req.isPro`
- `client/public/sitemap.xml`, sitemap estático (não há rota de sitemap no server); é ele que define quais rotas o prerender (`scripts/prerender.mjs`) gera na Vercel
- Conteúdo vive em dois lugares: estático em `client/src/lib/data.ts` e tabelas no Supabase. Confirmar qual é o canônico da feature antes de editar (roadmaps renderizam do estático).
