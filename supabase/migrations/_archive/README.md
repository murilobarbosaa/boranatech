# Migrations arquivadas

Estas migrations representam patches incrementais aplicados em produção
ANTES da introdução do baseline (`20260517231011_remote_schema.sql`).

**Não execute estes arquivos.** Eles já estão refletidos no baseline.
Estão preservados aqui apenas como referência histórica.

Para alterações daqui em diante:

```bash
pnpm db:new nome_da_migration
```

A nova migration será criada em `supabase/migrations/` (fora do `_archive`)
e aplicada via `pnpm db:push` quando estiver pronta.
