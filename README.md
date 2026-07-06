# Bora na Tech?

Sua bússola para começar em tecnologia. Uma plataforma de carreira em TI para
iniciantes, que organiza áreas, roadmaps, cursos, projetos, IA, eventos e
carreira em uma jornada clara. A descoberta é gratuita; a análise personalizada
por IA é o plano Pro.

## Stack

- **Frontend**: React 19 (SPA), Vite 7, TypeScript 5.6, Tailwind CSS v4, Radix
  UI + shadcn, wouter (rotas), react-hook-form + zod.
- **Backend**: Express 4, Supabase (auth + banco), BullMQ/ioredis (filas).
- **Integrações**: Asaas (pagamentos), Resend (email), Currents API + OpenAI
  (notícias), PostHog (analytics).
- **Package manager**: pnpm 10.

## Pré-requisitos

- Node.js 22 (ver `.nvmrc`).
- pnpm 10.
- Um projeto Supabase e as chaves das integrações que for usar.

## Como rodar

```bash
# 1. Instalar dependências
pnpm install

# 2. Criar o .env a partir do exemplo e preencher as variáveis
cp .env.example .env

# 3. Subir client (porta 3000) e server (porta 3100) em paralelo
pnpm dev
```

As variáveis de ambiente estão documentadas em `.env.example`. A validação das
variáveis do server fica em `server/lib/env.ts`.

## Scripts

```bash
pnpm dev            # client (3000) + server (3100) em paralelo
pnpm dev:client     # só Vite
pnpm dev:server     # só Express
pnpm build          # build do client + bundle do server em dist/
pnpm start          # roda o build de produção
pnpm check          # tsc --noEmit
pnpm format         # prettier --write .
```

## Estrutura

- `client/src/`: SPA React (páginas em `pages/`, componentes em `components/`,
  contexts, hooks, dados estáticos em `lib/`).
- `server/`: API Express (rotas em `routes/`, middleware de auth, libs).
- `shared/`: código compartilhado entre client e server.
- `supabase/migrations/`: migrations do banco.

Convenções de código e de commits estão em `CLAUDE.md`.

## Deploy

- **Vercel**: apenas o frontend (rewrite catch-all para `index.html`).
- **Railway**: fullstack (build via `pnpm build`, start em `node dist/index.js`).

## Produção

<!-- TODO(Ana): confirmar e preencher a URL de produção -->
URL de produção: a definir.
