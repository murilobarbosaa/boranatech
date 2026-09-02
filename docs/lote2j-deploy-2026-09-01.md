# Lote 2j: deploy de producao

**ESTADO: BLOQUEADO NA ETAPA A, PASSO 1. O merge nao aconteceu.**

Primeira linha reservada para o SHA do merge no main: ainda nao existe.

## Gates, transcritos

- **Gate 1 (veredito apto do 2d-prod).** SUBSTITUIDO pelo aditivo do arquiteto:
  a prova ponta a ponta passa a acontecer na Etapa D, em producao.
- **Gate 2 (escritor das linhas apagadas).** Declarado ABERTO pelo arquiteto,
  com a justificativa de que o escritor foi identificado por
  `pg_stat_statements`: script de limpeza humano via SQL Editor, filtrado por
  provider. A condicao de bloqueio do texto original era "escritor desconhecido";
  ela deixou de valer. Registro a leitura porque a palavra ABERTO admite os dois
  sentidos: adotei "liberado", e nao "pendente", porque a justificativa entre
  parenteses so faz sentido nesse sentido.
- **Gate 3 (sweep editorial da Ana).** Adiado. O adiamento explicito por escrito
  dela ainda NAO chegou; o arquiteto determinou registra-lo quando a linha dela
  chegar. Fica em aberto como pendencia de registro, nao como bloqueio.
- **Gate 4 ("pode publicar" da Ana e congelamento do main).** Concedido pela Ana
  e **transmitido pelo Murilo**, nao dito diretamente por ela nesta sessao. O
  arquiteto pediu que fosse transcrito assim, e e assim que fica.

## O bloqueio

A Etapa A, passo 1, manda conferir que `origin/main` segue em `8b219a6e` e
determina: "Se avancou: PARE e reporte o que entrou". Ele avancou.

```
origin/main esperado : 8b219a6e
origin/main medido   : 56f2578ed057f607421f196e1c9245c78b5bd537
commits desde o congelamento: 84
```

`8b219a6e` continua sendo ancestral de `origin/main`, entao houve avanco linear,
sem reescrita de historia. Os 84 commits sao todos de `murilobarbosaa`, entre
2026-08-29 02:58 e 2026-08-31 11:48.

### Por escopo

Predominam tema e admin (`style(admin)` 11, `feat(admin)` 11, `fix(theme)` 7,
`feat(theme)` 7, `refactor(theme)` 6, `merge(theme)` 4, `fix(admin)` 7). Mas a
camada de pagamentos NAO ficou intacta:

- `9deb89ba feat(billing): detect charges without owner from finance transactions`
- `53fddf8d fix(stripe): report invoice paid without subscription instead of silent return`
- `d04a80f3 fix(stripe): treat lost write race on active subscription as success`
- `1ced0103 fix(finance): keep plan code when parent charge has no owner`
- `7c4394dc fix(db): allow billing orphan resolve action in audit check`

### Duas migrations novas no main

```
supabase/migrations/20260831120000_allow_billing_orphan_resolve_in_audit_action.sql
supabase/migrations/20260831140000_orphan_payments_charge_sem_dono.sql
```

Isso contradiz a premissa do texto do 2j ("Nenhuma migration nova nasceu nos
lotes 2a-2i, entao `EXPECTED_*` nao muda"). A premissa esta certa sobre a
BRANCH e errada sobre o MAIN. Os contadores `EXPECTED_*` precisam ser conferidos
por medicao depois do merge, nunca assumidos.

### Nove arquivos em intersecao

```
client/src/components/certificates/CompleteProfileModal.tsx
client/src/components/pro/PaymentMethodDialog.tsx
client/src/pages/Checkout.tsx
client/src/pages/Perfil.tsx
server/app.ts
server/lib/env.ts
server/providers/stripe.ts
server/routes/billing.ts
server/routes/cron.ts
```

### O merge conflita

Simulado com `git merge-tree --write-tree` (nao toca na arvore nem no indice):

```
CONFLICT (content): client/src/components/pro/PaymentMethodDialog.tsx
CONFLICT (content): client/src/pages/Perfil.tsx
CONFLICT (content): server/routes/cron.ts
```

Os outros seis arquivos da intersecao fazem auto-merge. Os tres conflitos sao de
conteudo e exigem resolucao manual com leitura dos dois lados.

## Por que isso nao e uma formalidade

O `fix(stripe): treat lost write race on active subscription as success` e o
`fix(stripe): report invoice paid without subscription instead of silent return`
mexem em decisao de ativacao, que e exatamente o que os lotes 2a a 2i
reescreveram do outro lado. Resolver esses conflitos no automatico e o desenho
que ja falhou nesta base: o resultado compila, os testes passam, e a divergencia
de comportamento so aparece com dinheiro real.

`server/routes/cron.ts` conflita e e o arquivo do 2i, onde entrou a exclusao do
provedor Asaas do seletor de lembrete. `client/src/pages/Perfil.tsx` conflita e e
onde mora a tela do QR nativo do 2h.

## Pendencia de higiene, separada

Na `pix/lote2a` estao sem commit, como arquivos nao rastreados, os relatorios dos
lotes 2a, 2b, 2c, 2e, 2f, 2g, 2h e 2i, mais o `.env.bak-2i`. Pela regra do
projeto, artefato que nao esta em arquivo commitado nao existe. Eles sobrevivem
hoje so porque ninguem limpou o worktree.
