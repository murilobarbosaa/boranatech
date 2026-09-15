import type { AdminFinanceContract } from "@shared/adminFinance";
import {
  diaBrasilia,
  inicioDoDiaBrasilia,
  somarDiaCivil,
} from "@shared/brasiliaDay";

/** Ajusta somente a fixture sintética ao período solicitado pelo teste. */
export function financeFixtureForRequest(
  original: AdminFinanceContract,
  path: string,
): AdminFinanceContract {
  const params = new URL(path, "http://localhost").searchParams;
  const preset = params.get(
    "preset",
  ) as AdminFinanceContract["period"]["preset"];
  const today = diaBrasilia(new Date().toISOString())!;
  const endDayInclusive =
    preset === "custom"
      ? params.get("toDay")!
      : preset === "previous_month"
        ? somarDiaCivil(`${today.slice(0, 7)}-01`, -1)
        : preset === "all"
          ? somarDiaCivil(params.get("asOfDay")!, -1)
          : somarDiaCivil(today, -1);
  const startDay =
    preset === "custom"
      ? params.get("fromDay")!
      : preset === "previous_month"
        ? `${endDayInclusive.slice(0, 7)}-01`
        : preset === "all"
          ? "2026-01-01" // apenas início sintético da fixture, não do produto
          : somarDiaCivil(today, preset === "90d" ? -90 : -30);
  const fixture = structuredClone(original);
  fixture.period = {
    ...fixture.period,
    preset,
    startDay,
    endDayInclusive,
    from: inicioDoDiaBrasilia(startDay),
    toExclusive: inicioDoDiaBrasilia(somarDiaCivil(endDayInclusive, 1)),
  };
  for (const bucket of fixture.cash.currencies) {
    const initial = bucket.series[0];
    const series: typeof bucket.series = [];
    for (
      let day = startDay;
      day <= endDayInclusive;
      day = somarDiaCivil(day, 1)
    ) {
      series.push({
        day,
        positiveEntriesCents:
          day === startDay ? (initial?.positiveEntriesCents ?? 0) : 0,
        refundsCents: day === startDay ? (initial?.refundsCents ?? 0) : 0,
        feesCents: day === startDay ? (initial?.feesCents ?? 0) : 0,
        calculableNetCents:
          day === startDay ? (initial?.calculableNetCents ?? 0) : 0,
      });
    }
    bucket.series = series;
  }
  return fixture;
}
