---
paths:
  - "shared/linkedin/**"
  - "server/lib/linkedinChecks.ts"
  - "client/src/components/linkedin/**"
---

# Limiares do LinkedIn

- **Sitio numerico novo em `shared/linkedin/`, `server/lib/linkedinChecks.ts` ou `client/src/components/linkedin/` precisa ser classificado NO MESMO COMMIT**, em `MUT` (e um limiar, entao e mutado e tem de quebrar teste) ou em `NAO_LIMIAR` com o motivo.
- `pnpm check:limiares` roda **no hook de pre-commit E no CI**, e reprova se um sitio ficar orfao, e tambem se uma ancora de `MUT` deixar de casar com a fonte. Mesmo contrato do `EXPECTED_TABLE_COUNT`: alterar e ato deliberado, no commit que cria o sitio.
- **Roda a AUDITORIA, nao as mutacoes**: o modo completo leva mais de dez minutos porque roda a suite uma vez por mutante, e nao cabe em gate. Isso nao mudou e nao deve mudar.
- **ENTROU NO GATE LOCAL EM 2026-08-18, e ate ali a decisao era a oposta.** O registro antigo dizia que ele ficava fora do hook porque "o hook ja e o gate mais caro do fluxo, e gate lento vira `--no-verify`", com a conferencia do CI cobrindo o resto. O que derrubou isso foi um caso real: o `eb032d66` foi mergeado na main com este check VERMELHO. O gate existia so no CI remoto, e o desenho pedia que alguem conferisse o CI pelo SHA antes do merge; na primeira vez em que isso foi exigido de verdade, nao aconteceu. Localmente nada acusava, porque `pnpm check` passava, a suite passava, e o hook nao tinha o que reprovar. Passo de checklist que depende de memoria e o mesmo desenho que ja tinha falhado com a migration nunca aplicada.
- O custo, que e o que viabilizou: **0,02s** chamando o node direto e **0,24s** via `pnpm`, medidos em 2026-08-18. O hook ja paga duas rodadas de suite; a auditoria e ruido diante disso. A medicao vai com data porque e medicao, nao assercao.
- Ate 2026-08-01 o script estava fora de qualquer gate e abortava na arvore limpa havia semanas, com 6 sitios orfaos, tres deles produzidos pela propria auditoria que o criou: guard que ninguem invoca carrega a mesma informacao que um que sempre passa, zero. A entrada no CI resolveu metade; a entrada no hook, em 2026-08-18, fechou a outra.
- A lista canonica de sitios vive em `scripts/mutateLinkedinThresholds.mjs`, que aborta em item nao classificado. A familia dessa contramedida esta em `docs/postmortems-instrumentos.md#afirmar-o-total`.
