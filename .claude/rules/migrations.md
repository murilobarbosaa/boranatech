---
paths:
  - "supabase/migrations/**"
  - "scripts/checkMigrationsApplied.mts"
---

# Migrations

## Ordem de deploy: código antes da migration

- Aplicar migration (`db:push`) apenas DEPOIS ou SIMULTANEAMENTE ao deploy do código que a consome, nunca antes. Justificativa: código novo tolera schema antigo (colunas nullable, guardas de fallback); schema novo NÃO é tolerado por código antigo (migration + cron no banco sem o endpoint deployado = notificação agendada não dispara; enum novo no banco sem o frontend que o conhece = crash de admin).
- Checklist: (1) commit + push, (2) deploy de backend e frontend, (3) `db:push` (ou o SQL da migration no SQL Editor), (4) **`pnpm check:migrations` contra o banco alvo**, (5) smoke test.
- O passo (4) não é opcional: a regra acima protege contra migration ANTES do código, mas não contra a migration que nunca chega DEPOIS. Foi exatamente isso que aconteceu com `20260710120000_create_linkedin_improvement_progress.sql`: o código subiu, a migration ficou só no repositório, e o checklist de melhorias do Analisador de LinkedIn nasceu morto em produção devolvendo 500. Nada acusou, porque código novo tolerando schema antigo é justamente o que o passo (3) pressupõe. `pnpm check:migrations` compara as tabelas declaradas em `supabase/migrations/*.sql` com as que existem no banco e falha listando as ausentes.
- O mesmo guard roda no CI (`.github/workflows/ci.yml`, job `migrations`), porque passo de checklist que depende de memória humana é o desenho que já falhou uma vez. O CI precisa dos secrets `VITE_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`; sem eles o job falha com mensagem explícita, o que é o comportamento desejado.

## Asserções de tamanho de conjunto

- `EXPECTED_TABLE_COUNT` no script é uma asserção do tamanho do conjunto declarado, para pegar o caso em que o parser encolhe em silêncio. **Alterar esse número é ato deliberado**, feito no mesmo commit da migration que cria ou dropa a tabela, com o nome dela na mensagem do commit. Se o script reclamar do número sem você ter mexido em migration, investigue o parser antes de mexer no número. O mesmo vale para `EXPECTED_RLS_COUNT` e `EXPECTED_FUNCTION_COUNT`.
- A família dessa contramedida (afirmar o total, não a pertinência) está em `docs/postmortems-instrumentos.md#afirmar-o-total`.

## Migration que só faz `create or replace` de função

- **Migration que só faz `create or replace` de função EXIGE uma asserção comportamental no guard.** A verificação de função é por nome, via OpenAPI do PostgREST: uma função que já existe passa, tenha o corpo que tiver. Então uma migration que só troca comportamento é invisível para o guard, e pode nunca chegar em produção sem nada acusar (foi o que aconteceu com `get_ai_usage_today`; o caso completo está em `docs/postmortems-instrumentos.md#escopo-derivado-por-parser`). Ao escrever uma dessas: exponha o dado como função chamável e acrescente uma entrada em `ASSERCOES`, em `scripts/checkMigrationsApplied.mts`, afirmando o **resultado** (conjunto inteiro, não pertinência). Sem isso a migration não está pronta.

## Janela de migration destrutiva

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
