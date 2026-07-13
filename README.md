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

## Pagamentos

O billing suporta dois providers atras da mesma interface (`server/providers/`).
`PAYMENT_PROVIDER` (default `asaas`) seleciona quem atende checkout/cancel/
reactivate. Os webhooks tem rota fixa e independem do seletor:
`POST /api/billing/webhook` (Asaas) e `POST /api/billing/webhook/stripe` (Stripe).

### Envs

| Env | Onde | Para que |
| --- | --- | --- |
| `PAYMENT_PROVIDER` | backend | `asaas` (default) ou `stripe`. |
| `STRIPE_SECRET_KEY` | backend (Railway) | Chave secreta da Stripe (`sk_test_`/`sk_live_`). Nunca no frontend. |
| `STRIPE_WEBHOOK_SECRET` | backend (Railway) | Signing secret do webhook (`whsec_`). Fail-closed se ausente. |
| `STRIPE_PRICE_PRO_MONTHLY` | backend | price_id do plano mensal. |
| `STRIPE_PRICE_PRO_SEMIANNUAL` | backend | price_id do plano semestral. |
| `STRIPE_PRICE_PRO_ANNUAL` | backend | price_id do plano anual. |

Nenhum segredo Stripe vai para o frontend (o Checkout hospedado dispensa a
publishable key). price_ids de sandbox e producao sao diferentes.

### Setup dos produtos/precos na Stripe

Cria 1 product e 3 prices em BRL com os valores de `shared/planPricing.ts`
(fonte unica). Idempotente. Rode uma vez por ambiente, com a `STRIPE_SECRET_KEY`
daquele ambiente, e cole as linhas `STRIPE_PRICE_*` impressas nas envs:

```bash
STRIPE_SECRET_KEY=sk_test_... pnpm exec tsx scripts/stripe-setup.mjs
```

### Testar o webhook localmente

```bash
# encaminha os eventos da Stripe para o webhook local (imprime o whsec_ a usar
# em STRIPE_WEBHOOK_SECRET):
stripe listen --forward-to localhost:3100/api/billing/webhook/stripe

# com PAYMENT_PROVIDER=stripe e as envs preenchidas, assine com o cartao de teste
# 4242 4242 4242 4242 (qualquer validade futura / CVC). O acesso Pro so e liberado
# pelo webhook, nunca pela success page.
```

Obs.: em dev o `SubscriptionContext` forca Pro (`import.meta.env.DEV`). Para
validar o webhook de ponta a ponta, desligue esse bypass, senao o teste passa
mesmo com o webhook quebrado.

## Deploy

- **Vercel**: apenas o frontend (rewrite catch-all para `index.html`).
- **Railway**: fullstack (build via `pnpm build`, start em `node dist/index.js`).

## Produção

<!-- TODO(Ana): confirmar e preencher a URL de produção -->
URL de produção: a definir.
