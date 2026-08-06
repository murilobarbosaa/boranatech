---
paths:
  - "shared/linkedin/**"
  - "server/lib/linkedinChecks.ts"
  - "client/src/components/linkedin/**"
---

# Limiares do LinkedIn

- **Sitio numerico novo em `shared/linkedin/`, `server/lib/linkedinChecks.ts` ou `client/src/components/linkedin/` precisa ser classificado NO MESMO COMMIT**, em `MUT` (e um limiar, entao e mutado e tem de quebrar teste) ou em `NAO_LIMIAR` com o motivo.
- `pnpm check:limiares` roda no CI e reprova se ficar orfao, e tambem se uma ancora de `MUT` deixar de casar com a fonte. Mesmo contrato do `EXPECTED_TABLE_COUNT`: alterar e ato deliberado, no commit que cria o sitio.
- **Roda a AUDITORIA, nao as mutacoes**: o modo completo leva mais de dez minutos porque roda a suite uma vez por mutante, e nao cabe em gate.
- Ate 2026-08-01 o script estava fora de qualquer gate e abortava na arvore limpa havia semanas, com 6 sitios orfaos, tres deles produzidos pela propria auditoria que o criou: guard que ninguem invoca carrega a mesma informacao que um que sempre passa, zero.
- A lista canonica de sitios vive em `scripts/mutateLinkedinThresholds.mjs`, que aborta em item nao classificado. A familia dessa contramedida esta em `docs/postmortems-instrumentos.md#afirmar-o-total`.
