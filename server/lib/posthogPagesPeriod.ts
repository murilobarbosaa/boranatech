import {
  POSTHOG_PAGES_MAX_INTERVAL_DAYS,
  type PagesPeriod,
} from "./posthogPages";

export class InvalidPosthogPagesPeriod extends Error {
  constructor(readonly reason: string) {
    super(reason);
  }
}

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
function dateValue(value: unknown, name: string): Date {
  if (typeof value !== "string" || !ISO_UTC.test(value))
    throw new InvalidPosthogPagesPeriod(`${name} inválido.`);
  const date = new Date(value);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString() !== value ||
    !value.endsWith("T00:00:00.000Z")
  ) {
    throw new InvalidPosthogPagesPeriod(`${name} inválido.`);
  }
  return date;
}

export function parsePosthogPagesPeriod(
  query: Record<string, unknown>,
  now: Date = new Date(),
): { period: PagesPeriod; refresh: boolean } {
  for (const key of Object.keys(query)) {
    if (key !== "from" && key !== "to" && key !== "refresh") {
      throw new InvalidPosthogPagesPeriod(`Parâmetro ${key} não suportado.`);
    }
  }
  if ((query.from === undefined) !== (query.to === undefined)) {
    throw new InvalidPosthogPagesPeriod("Informe from e to juntos.");
  }
  if (query.refresh !== undefined && query.refresh !== "1") {
    throw new InvalidPosthogPagesPeriod("refresh inválido.");
  }
  const defaultEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  const from =
    query.from === undefined
      ? new Date(defaultEnd.getTime() - 30 * 24 * 60 * 60 * 1000)
      : dateValue(query.from, "from");
  const to = query.to === undefined ? defaultEnd : dateValue(query.to, "to");
  if (from.getTime() >= to.getTime())
    throw new InvalidPosthogPagesPeriod("Intervalo invertido ou vazio.");
  if (
    to.getTime() - from.getTime() >
    POSTHOG_PAGES_MAX_INTERVAL_DAYS * 86_400_000
  ) {
    throw new InvalidPosthogPagesPeriod("Intervalo acima de 400 dias.");
  }
  return {
    period: { from: from.toISOString(), to: to.toISOString(), timezone: "UTC" },
    refresh: query.refresh === "1",
  };
}
