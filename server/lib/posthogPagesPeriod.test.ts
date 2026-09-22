import { describe, expect, it } from "vitest";
import { parsePosthogPagesPeriod } from "./posthogPagesPeriod";
import { posthogWindow } from "./posthog";

const NOW = new Date("2026-09-15T15:00:00.000Z");
const FROM = "2026-08-01T00:00:00.000Z";
const TO = "2026-09-16T00:00:00.000Z";

describe("janela declarada de Páginas", () => {
  it("mantém a mesma chave durante o dia e declara UTC e fim exclusivo", () => {
    const morning = parsePosthogPagesPeriod(
      {},
      new Date("2026-09-15T00:01:00Z"),
    );
    const evening = parsePosthogPagesPeriod(
      {},
      new Date("2026-09-15T23:59:00Z"),
    );
    expect(morning).toEqual(evening);
    expect(morning.period).toMatchObject({ to: TO, timezone: "UTC" });
    expect(parsePosthogPagesPeriod({ from: FROM, to: TO }, NOW).period).toEqual(
      { from: FROM, to: TO, timezone: "UTC" },
    );
  });

  it.each([
    [{ from: "inválido", to: TO }, "from inválido"],
    [{ from: FROM, to: "inválido" }, "to inválido"],
    [{ from: FROM }, "juntos"],
    [{ to: TO }, "juntos"],
    [{ from: TO, to: FROM }, "invertido"],
    [{ from: [FROM, FROM], to: TO }, "from inválido"],
    [{ from: FROM, to: [TO, TO] }, "to inválido"],
    [{ from: FROM, to: TO, refresh: ["1", "1"] }, "refresh inválido"],
    [{ from: FROM, to: TO, extra: "value" }, "não suportado"],
    [{ from: "2025-08-01T00:00:00.000Z", to: TO }, "400 dias"],
    [{ from: "2026-09-15T12:00:00.000Z", to: TO }, "from inválido"],
    [{ from: FROM, to: "2026-09-16T00:00:00.001Z" }, "to inválido"],
  ] as const)("recusa parâmetro incorreto %#", (query, expected) => {
    expect(() => parsePosthogPagesPeriod(query, NOW)).toThrow(expected);
  });

  it("aceita limite exato e rejeita o dia seguinte", () => {
    const to = new Date(TO);
    const atLimit = new Date(to.getTime() - 400 * 86_400_000).toISOString();
    const above = new Date(to.getTime() - 401 * 86_400_000).toISOString();
    expect(
      parsePosthogPagesPeriod({ from: atLimit, to: TO }, NOW).period.from,
    ).toBe(atLimit);
    expect(() => parsePosthogPagesPeriod({ from: above, to: TO }, NOW)).toThrow(
      "400 dias",
    );
  });
  it("um dia inclui o início e último milissegundo, exclui o fim", () => {
    const from = "2026-09-15T00:00:00.000Z";
    const range = parsePosthogPagesPeriod({ from, to: TO }, NOW).period;
    expect(range).toMatchObject({ from, to: TO, timezone: "UTC" });
    const sql = posthogWindow(new Date(range.from), new Date(range.to));
    expect(sql).toContain("timestamp >= toDateTime('2026-09-15 00:00:00')");
    expect(sql).toContain("timestamp < toDateTime('2026-09-16 00:00:00')");
    const inside = (event: string) => event >= range.from && event < range.to;
    expect(inside(from)).toBe(true);
    expect(inside("2026-09-15T23:59:59.999Z")).toBe(true);
    expect(inside(TO)).toBe(false);
  });
});
