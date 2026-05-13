# CLAUDE.md — Bora na Tech

## Stack

- **Frontend**: React 19 SPA, Vite 7, TypeScript 5.6 (`strict: true`)
- **Roteamento**: wouter 3 — `<Switch>/<Route>` centralizado em `client/src/App.tsx`
- **UI**: Tailwind CSS v4 (`@tailwindcss/vite`) + Radix UI primitivos + shadcn (`components.json`)
- **Icons**: lucide-react
- **State**: React Context puro — `AuthContext`, `SubscriptionContext`, `ThemeContext`
- **Forms**: react-hook-form + zod v4
- **Backend**: Express 4 (porta 3100 em dev) + Supabase (supabase-js v2) + BullMQ/ioredis
- **Package manager**: pnpm 10

## Path Aliases

```
@/*        → client/src/*
@shared/*  → shared/*
@assets    → attached_assets/   (vite.config apenas)
```

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

> Sem script `test` no package.json — vitest instalado mas não exposto.

## Estrutura

```
client/src/
  components/
    ui/         # shadcn primitivos gerados — não editar manualmente
    shared/     # componentes reutilizáveis entre páginas
    pro/        # badges Pro, paywalls
    admin/
  contexts/     # AuthContext, SubscriptionContext, ThemeContext
  hooks/
  lib/          # utils.ts, supabase.ts, aiClient.ts, data files estáticos
  pages/        # 60+ páginas, uma por rota, nomeadas em português
  services/     # contracts.ts (tipos), profileService.ts

server/
  routes/       # admin, ai, billing, bookmarks, content, cron, me, quiz, search, sitemap, study
  middleware/   # auth.ts (requireAuth, checkProStatus), error.ts (createError)
  lib/          # env, supabaseAdmin, openai, aiTools, queue

shared/const.ts   # COOKIE_NAME, ONE_YEAR_MS
supabase/migrations/
```

## Convenções de Componentes

- **Estrutura de arquivo**: imports → constantes/data → sub-componentes → `export default` principal
- **Tipagem**: props sempre tipadas inline ou com `interface` local — sem PropTypes
- **Estilo**: 100% Tailwind; classes arbitrárias `shadow-[5px_5px_0_#cor]` são padrão do projeto
- **Classes custom globais**: `bnt-pressable` (efeito press), `animate-marquee-left`, `animate-gentle-float` — definidas em `index.css`
- **Nomes**: arquivos e componentes em PascalCase; páginas nomeadas em português (ex: `TecnologiaMapa`)
- Sem CSS modules, styled-components ou comentários explicativos no JSX

## Convenções do Server

- Cada arquivo de rota cria `const router = Router()` e exporta `router`
- Guarda de auth: `router.use(requireAuth)` e/ou `router.use(checkProStatus)` no topo
- Erros: `return next(createError(statusCode, "code_slug", "Mensagem."))` — nunca throw direto
- Queries via `supabaseAdmin` (service role) — nunca o client Supabase do frontend no server

## Paleta & Design System

| Token | Valor |
|-------|-------|
| Amarelo primário | `#FFB800` |
| Fundo cream | `#faf8f4` |
| Border padrão | `border-slate-950` (quase preto) |
| Sombra flat | `shadow-[5px_5px_0_#0f172a]` ou cor de acento |
| Violet acento | `violet-800` / `#c4b5fd` |
| Emerald (grátis) | `emerald-*` |

Tipografia de seção: `font-display font-black` para headings; labels de seção `text-sm font-black uppercase tracking-[0.2em]`.

## Deploy

| Alvo | Config |
|------|--------|
| Vercel | Só frontend — catch-all rewrite `/(.*) → /index.html` |
| Railway | Fullstack — nixpacks, `npm run build`, start: `node dist/index.js` |

## Arquivos Importantes

- `client/src/pages/HomeLanding.tsx` — home pública (10 seções + footer)
- `client/src/App.tsx` — todas as rotas declaradas aqui
- `client/src/lib/data.ts` — dados estáticos das áreas, eventos, notícias
- `server/lib/env.ts` — validação de variáveis de ambiente
- `server/middleware/auth.ts` — injeta `req.user` e `req.isPro`
