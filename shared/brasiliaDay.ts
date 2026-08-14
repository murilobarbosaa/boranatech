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

// ---------------------------------------------------------------------------
// ARITMÉTICA DE DIA CIVIL
//
// Estas duas funções são a fonte ÚNICA de "que instante começa o dia X em
// Brasília" e "qual é o dia seguinte a X". Antes desta consolidação havia duas
// implementações de somar dia (`somarDia` em `server/lib/signupSeries.ts` e
// `somarDias` em `server/routes/admin.ts`) e NENHUMA de início de dia — a janela
// dos cards da Visão era em instantes UTC deslizantes, e a do gráfico logo
// abaixo em dias civis de Brasília. Medido em 2026-08-14 às 04:53 UTC: 4.788
// contra 4.606, 182 cadastros de diferença entre dois blocos rotulados
// "últimos 30 dias" na mesma tela.
//
// NENHUMA das duas usa offset fixo de -3h. O Brasil não observa horário de verão
// hoje, e escrever `-03:00` no código transformaria essa circunstância em regra:
// no dia em que o DST voltar, a conta erraria uma hora por seis meses, em
// silêncio, e o sintoma seria uma barra de gráfico no dia errado. Quem sabe o
// offset é o `Intl` com o nome do fuso, e é ele que responde.
// ---------------------------------------------------------------------------

// Hora de PAREDE em Brasília, no formato `AAAA-MM-DDTHH:mm:ss`. `sv-SE` é
// escolhido por produzir exatamente `AAAA-MM-DD HH:mm:ss`, sem AM/PM e sem
// reordenar campos.
const paredeFmt = new Intl.DateTimeFormat("sv-SE", {
  timeZone: BRASILIA_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function paredeEm(instanteMs: number): string {
  return paredeFmt.format(new Date(instanteMs)).replace(" ", "T");
}

/**
 * Instante UTC (ISO) em que o dia civil `dia` COMEÇA em Brasília.
 *
 * `inicioDoDiaBrasilia("2026-07-16")` devolve `2026-07-16T03:00:00.000Z` com o
 * offset atual (UTC-3).
 *
 * COMO FUNCIONA, e por que duas passadas. O problema é inverter um fuso: sei a
 * hora de parede que quero e preciso do instante. A conta é um ponto fixo —
 * chuto um instante, leio a parede que ele produz, corrijo pela diferença. Uma
 * passada resolve o caso normal; a segunda existe para a transição de horário de
 * verão, em que a primeira correção pode cair do outro lado do salto. Duas
 * passadas bastam para qualquer fuso real, e o teste fixa isso.
 *
 * Dia inválido LANÇA em vez de devolver `Invalid Date` disfarçado: um limite de
 * janela silenciosamente errado produziria um número plausível.
 */
export function inicioDoDiaBrasilia(dia: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) {
    throw new Error(`inicioDoDiaBrasilia: dia inválido ("${dia}")`);
  }
  const alvo = Date.parse(`${dia}T00:00:00Z`);
  if (Number.isNaN(alvo)) {
    throw new Error(`inicioDoDiaBrasilia: dia inválido ("${dia}")`);
  }
  let t = alvo;
  for (let i = 0; i < 2; i += 1) {
    const lidoComoUtc = Date.parse(`${paredeEm(t)}Z`);
    const erro = alvo - lidoComoUtc;
    if (erro === 0) break;
    t += erro;
  }
  return new Date(t).toISOString();
}

/**
 * Próximo dia civil (ou anterior, com passo negativo). A entrada já É o dia, e a
 * conta acontece em UTC de propósito: somar 1 a "2026-07-16" não depende de fuso
 * nenhum, e passar por fuso aqui só introduziria o erro que não existe.
 *
 * Consolidação de 2026-08-14: era `somarDia` em `signupSeries.ts` e `somarDias`
 * em `admin.ts`, com corpos idênticos. Duas cópias da mesma aritmética é a que
 * diverge na primeira correção que alguém aplica só numa delas.
 */
export function somarDiaCivil(dia: string, passo = 1): string {
  const d = new Date(`${dia}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`somarDiaCivil: dia inválido ("${dia}")`);
  }
  d.setUTCDate(d.getUTCDate() + passo);
  return d.toISOString().slice(0, 10);
}
