// O DIA em Brasília de um instante.
//
// POR QUE EXISTE. Duas coisas parecidas e diferentes convivem no banco:
//
//   `date`         dia civil (`expenses.incurred_on`, `subscription_snapshots.
//                  snapshot_date`, `admin_tasks.due_date`). Chega como
//                  "2026-07-16". `new Date("2026-07-16")` parseia como MEIA-NOITE
//                  UTC, e em qualquer fuso negativo `toLocaleDateString` devolve
//                  o DIA ANTERIOR. Para esses, a formatação é recorte de string
//                  (ver `formatIsoDay` em admin/tasks/relativeTime.ts), nunca
//                  `new Date`.
//
//   `timestamptz`  instante (`created_at`, `occurred_at`, `read_at`...). Aqui o
//                  fuso LOCAL é o correto a exibir, e forçar UTC mostraria o dia
//                  errado na direção oposta. Esses NÃO precisam de conserto.
//
// Este arquivo resolve o terceiro caso, que é o que morde em silêncio: AGRUPAR
// instantes por dia. `iso.slice(0, 10)` agrupa pelo dia UTC, então tudo que
// acontece depois das 21h de Brasília cai no balde do dia seguinte e a série
// inteira sai deslocada. Ninguém percebe olhando um gráfico.

const BRASILIA_TZ = "America/Sao_Paulo";

// `en-CA` produz AAAA-MM-DD, que é o formato de chave que os agrupamentos usam
// e o único que ordena por comparação de string.
const diaFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: BRASILIA_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * `AAAA-MM-DD` do dia em Brasília de um instante ISO.
 *
 * Devolve `null` para entrada inválida em vez de "Invalid Date": chave de
 * agrupamento inválida viraria uma barra fantasma no gráfico.
 */
export function diaBrasilia(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return diaFmt.format(d);
}

/**
 * `AAAA-MM-DD` (coluna `date`) em `dd/mm/aaaa`, por RECORTE.
 *
 * Não passa por `new Date()` de propósito: a string já É o dia, e converter para
 * instante só introduz o fuso que não existe no dado.
 */
export function formatarDiaCivil(valor: string | null | undefined): string {
  if (!valor) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}
