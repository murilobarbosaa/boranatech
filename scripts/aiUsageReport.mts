// Relatorio FIXO de uso e custo de IA. Existe para que o mesmo numero possa ser
// recalculado daqui a um mes e comparado sem discussao sobre "qual query voce
// rodou".
//
// Historia: durante a auditoria do Analisador de LinkedIn os totais mudaram de
// rodada para rodada (821, 822, 892, 826) porque cada consulta ad hoc usava uma
// janela diferente e o proprio banco recebia linhas novas no meio. Nenhum dos
// numeros estava errado; eles simplesmente nao eram a mesma medicao. Este
// script congela a pergunta.
//
// Uso:
//   pnpm report:ai-usage                 (ultimos 30 dias)
//   pnpm report:ai-usage -- --days=7
//   pnpm report:ai-usage -- --since=2026-06-01 --until=2026-07-01
//   pnpm report:ai-usage -- --json       (saida para diff/serie historica)
//
// Definicoes, fixadas:
//   - JANELA: created_at >= since e < until. `until` exclusivo, para dois
//     periodos adjacentes nunca contarem a mesma linha duas vezes.
//   - TOTAL DE LINHAS: todas as linhas da janela, qualquer status.
//   - CUSTO: tokens exatos (input_tokens/output_tokens) quando gravados;
//     senao estimativa por caracteres. A coluna cost_estimate historica e
//     IGNORADA de proposito: ela carrega a regua antiga, que inflava 5,x vezes.
//   - GROUP BY: ferramenta e modelo.
import { estimateCost, estimateCostFromTokens } from "../server/lib/aiTools";

interface Row {
  tool: string | null;
  model: string | null;
  status: string | null;
  cost_estimate: string | number | null;
  input_chars: number | null;
  output_chars: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
}

const args = process.argv.slice(2);
const flag = (name: string): string | null => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const asJson = args.includes("--json");

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
/**
 * Mesmo codigo e mesma razao de `checkMigrationsApplied.mts`: 78 e `EX_CONFIG`
 * do `sysexits.h`, e serve para "nao consegui olhar" nao ser confundido com
 * "olhei e nao achei nada".
 *
 * Encontrado em 2026-08-01 exercitando o caminho de FALHA dos guards, depois de
 * o `check:migrations` ter sido consertado pelo mesmo defeito: `exit(1)` igual
 * ao de erro real, e uma linha com o mesmo prefixo da saida normal. Um relatorio
 * de custo de IA que devolve zero linhas e um que nao rodou pareciam a mesma
 * coisa, e este e um relatorio cujo resultado esperado AS VEZES E vazio.
 */
const EXIT_AMBIENTE_AUSENTE = 78;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "[aiUsageReport] ABORTADO SEM CONSULTAR NADA: faltam VITE_SUPABASE_URL " +
      "e/ou SUPABASE_SERVICE_ROLE_KEY no ambiente.",
  );
  console.error(
    "[aiUsageReport] NENHUMA linha de uso foi lida. Este resultado NAO " +
      "significa que nao houve uso de IA no periodo.",
  );
  console.error(
    `[aiUsageReport] exit=${EXIT_AMBIENTE_AUSENTE} (EX_CONFIG) e ` +
      "deliberadamente diferente de exit=1, que significa 'consultei e falhou'.",
  );
  process.exit(EXIT_AMBIENTE_AUSENTE);
}

const days = Number(flag("days") ?? 30);
const until = flag("until")
  ? new Date(`${flag("until")}T00:00:00.000Z`)
  : new Date();
const since = flag("since")
  ? new Date(`${flag("since")}T00:00:00.000Z`)
  : new Date(until.getTime() - days * 24 * 3600 * 1000);

// Paginacao explicita: PostgREST tem teto por request, e um limit alto que
// silenciosamente trunca e exatamente como se produz um total errado.
const PAGE = 1000;
const rows: Row[] = [];
for (let from = 0; ; from += PAGE) {
  const url =
    `${supabaseUrl}/rest/v1/ai_usage_logs` +
    `?select=tool,model,status,cost_estimate,input_chars,output_chars,input_tokens,output_tokens,created_at` +
    `&created_at=gte.${since.toISOString()}&created_at=lt.${until.toISOString()}` +
    `&order=created_at.asc`;
  const res = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Range: `${from}-${from + PAGE - 1}`,
    },
  });
  if (!res.ok) {
    console.error(`[aiUsageReport] HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const page = (await res.json()) as Row[];
  rows.push(...page);
  if (page.length < PAGE) break;
}

interface Bucket {
  linhas: number;
  comTokens: number;
  custo: number;
  porStatus: Record<string, number>;
}
const novo = (): Bucket => ({ linhas: 0, comTokens: 0, custo: 0, porStatus: {} });

const porFerramenta: Record<string, Bucket> = {};
const porModelo: Record<string, Bucket> = {};
let total = novo();
let custoColunaHistorica = 0;

for (const r of rows) {
  const tool = r.tool ?? "(sem tool)";
  const model = r.model ?? "(sem model)";
  const status = r.status ?? "(sem status)";
  const temTokens = (r.input_tokens ?? 0) > 0;
  const custo = temTokens
    ? estimateCostFromTokens(r.input_tokens ?? 0, r.output_tokens ?? 0, model)
    : estimateCost(r.input_chars ?? 0, r.output_chars ?? 0, model);
  custoColunaHistorica += Number(r.cost_estimate ?? 0);

  for (const [mapa, chave] of [
    [porFerramenta, tool],
    [porModelo, model],
  ] as const) {
    mapa[chave] ??= novo();
    mapa[chave].linhas += 1;
    mapa[chave].custo += custo;
    if (temTokens) mapa[chave].comTokens += 1;
    mapa[chave].porStatus[status] = (mapa[chave].porStatus[status] ?? 0) + 1;
  }
  total.linhas += 1;
  total.custo += custo;
  if (temTokens) total.comTokens += 1;
  total.porStatus[status] = (total.porStatus[status] ?? 0) + 1;
}

if (asJson) {
  console.log(
    JSON.stringify(
      {
        since: since.toISOString(),
        until: until.toISOString(),
        total,
        custoColunaHistorica,
        porFerramenta,
        porModelo,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const usd = (n: number) => `US$ ${n.toFixed(4)}`;
console.log(`[aiUsageReport] janela: ${since.toISOString()} ate ${until.toISOString()} (until exclusivo)`);
console.log(`linhas na janela: ${total.linhas} | com tokens exatos: ${total.comTokens} (${total.linhas ? Math.round((100 * total.comTokens) / total.linhas) : 0}%)`);
console.log(`status: ${JSON.stringify(total.porStatus)}`);
console.log();
console.log("POR FERRAMENTA".padEnd(26) + "linhas  c/tokens        custo");
for (const [k, v] of Object.entries(porFerramenta).sort((a, b) => b[1].custo - a[1].custo)) {
  console.log(`${k.padEnd(26)}${String(v.linhas).padStart(6)}${String(v.comTokens).padStart(10)}${usd(v.custo).padStart(13)}`);
}
console.log();
console.log("POR MODELO".padEnd(26) + "linhas  c/tokens        custo");
for (const [k, v] of Object.entries(porModelo).sort((a, b) => b[1].custo - a[1].custo)) {
  console.log(`${k.padEnd(26)}${String(v.linhas).padStart(6)}${String(v.comTokens).padStart(10)}${usd(v.custo).padStart(13)}`);
}
console.log();
console.log(`CUSTO NA JANELA (regua atual): ${usd(total.custo)}`);
console.log(`coluna cost_estimate historica (regua antiga, so referencia): ${usd(custoColunaHistorica)}`);
