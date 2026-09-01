import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * BARREIRA DA IDENTIDADE snapshot -> DIA CIVIL DE BRASÍLIA.
 *
 * `subscription_snapshots.snapshot_date` é gravado por
 * `collectSubscriptionSnapshot` como o dia **UTC** do instante da coleta
 * (`new Date().toISOString().slice(0,10)`). O `/subscription-history` trata esse
 * rótulo como se fosse o dia civil de Brasília, e isso está correto por um motivo
 * que NÃO é óbvio: o cron roda às 05:10 UTC, que é **depois** de 03:00 UTC, a
 * meia-noite de Brasília. Nesse horário os dois dias coincidem, e o mapeamento é
 * a identidade.
 *
 * A Fase 2 documentou isso num comentário que dizia "se o cron mudar, quebra".
 * Comentário não quebra build. Este teste transforma a condição em guarda: se
 * alguém mover o `cron.schedule` para antes das 03:00 UTC, um snapshot coletado
 * (por exemplo) às 02:00 UTC do dia D pertence ao dia civil D-1 em Brasília, a
 * série inteira desliza um dia, e NADA acusaria, o gráfico continuaria
 * desenhando barras plausíveis nas datas erradas.
 *
 * O ESCOPO DESTE TESTE É DERIVADO DE UM PARSER, que é a classe de instrumento que
 * este projeto documenta como a que falha PASSANDO. A contramedida é a de sempre:
 * afirmar o TOTAL, não a pertinência. O teste conta as ocorrências de
 * `cron.schedule` no arquivo e exige que TODAS tenham sido lidas, um agendamento
 * novo que o regex não casasse derrubaria a contagem em vez de passar batido.
 */

const CAMINHO = new URL(
  "../../supabase/migrations/20260715150100_schedule_subscription_snapshot.sql",
  import.meta.url,
);

/** Hora UTC a partir da qual o dia UTC e o dia civil de Brasília coincidem. */
const HORA_MINIMA_UTC = 3;

const SQL = readFileSync(CAMINHO, "utf8");

type Agendamento = { jobname: string; cron: string };

function agendamentos(): Agendamento[] {
  const encontrados: Agendamento[] = [];
  // `exec` em laço, e NÃO `for (const m of SQL.matchAll(...))`: o `tsconfig.json`
  // da aplicação não declara `target`, então cai em ES5, e iterar o
  // `RegExpStringIterator` do `matchAll` ali é erro de compilação (TS2802). A
  // suíte passava (o vitest transpila com esbuild) e o `pnpm check` acusou:
  // mesma família dos contornos que o CLAUDE.md registra para iterar `Set`.
  const re = /cron\.schedule\(\s*'([^']+)'\s*,\s*'([^']+)'/g;
  let m = re.exec(SQL);
  while (m !== null) {
    encontrados.push({ jobname: m[1], cron: m[2] });
    m = re.exec(SQL);
  }
  return encontrados;
}

describe("horário do cron de snapshot sustenta a identidade snapshot -> dia civil", () => {
  it("o parser leu TODOS os cron.schedule do arquivo", () => {
    // Afirma o total: `cron.schedule(` aparece N vezes no SQL, e o parser
    // precisa ter extraído N agendamentos. Se um deles vier com formatação
    // diferente, a contagem cai aqui em vez de o teste passar sobre menos.
    const ocorrencias = (SQL.match(/cron\.schedule\(/g) ?? []).length;
    expect(ocorrencias).toBeGreaterThan(0);
    expect(agendamentos()).toHaveLength(ocorrencias);
  });

  it("o job snapshot-subscriptions existe na migration", () => {
    const alvo = agendamentos().find(
      (a) => a.jobname === "snapshot-subscriptions",
    );
    expect(
      alvo,
      "cron.schedule de snapshot-subscriptions não encontrado",
    ).toBeTruthy();
  });

  it("roda às 03:00 UTC ou depois, senão o dia UTC deixa de ser o dia de Brasília", () => {
    const alvo = agendamentos().find(
      (a) => a.jobname === "snapshot-subscriptions",
    )!;
    // Formato cron: "minuto hora * * *".
    const [minuto, hora] = alvo.cron.split(/\s+/);
    expect(/^\d+$/.test(hora), `hora não literal no cron "${alvo.cron}"`).toBe(
      true,
    );
    expect(/^\d+$/.test(minuto)).toBe(true);
    expect(Number(hora)).toBeGreaterThanOrEqual(HORA_MINIMA_UTC);
  });

  it("o horário conferido é o que a documentação afirma (05:10 UTC)", () => {
    // CONTROLE de fidelidade: se o horário mudar para outro valor que ainda
    // passe no teste acima (ex.: 04:00), este cai e obriga a atualizar os
    // comentários de `/subscription-history` e do plano, que citam 05:10.
    const alvo = agendamentos().find(
      (a) => a.jobname === "snapshot-subscriptions",
    )!;
    expect(alvo.cron).toBe("10 5 * * *");
  });
});
