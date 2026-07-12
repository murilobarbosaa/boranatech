// Adapter Jooble (front VAGAS, fase 2). Generaliza o sync legado para
// unidades por pais; a chave e vinculada ao HOST em que foi emitida (a atual
// e do jooble.org/US; ver comentario em config.ts), entao as unidades vivem
// em JOOBLE_UNITS com host explicito.

import { env } from "../../env";
import { fetchWithTimeout } from "../../http";
import {
  FETCH_TIMEOUT_MS,
  JOOBLE_KEYWORDS,
  JOOBLE_UNITS,
} from "../config";
import {
  asArray,
  asRecord,
  asString,
  detectArea,
  normalizeModality,
  normalizeSeniority,
  stripHtml,
  truncate,
} from "../normalize";
import type { NormalizedJob, SourceUnit } from "../types";

async function fetchJoobleUnit(
  country: string,
  host: string,
  perUnitLimit?: number,
): Promise<NormalizedJob[]> {
  const jobs: NormalizedJob[] = [];
  const seen = new Set<string>();

  for (const keyword of JOOBLE_KEYWORDS) {
    const res = await fetchWithTimeout(
      `https://${host}/api/${env.joobleApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: keyword, resultonpage: 50 }),
      },
      { service: `jooble:${country}`, timeoutMs: FETCH_TIMEOUT_MS },
    );
    if (!res.ok) {
      throw new Error(`jooble ${country} respondeu ${res.status}`);
    }

    const data = asRecord((await res.json()) as unknown);
    for (const raw of asArray(data?.jobs)) {
      const row = asRecord(raw);
      if (!row) continue;
      const url = asString(row.link);
      const title = asString(row.title);
      if (!url || !title || seen.has(url)) continue;
      seen.add(url);

      const location = asString(row.location);
      const snippet = asString(row.snippet);
      const modality =
        normalizeModality(`${title} ${location ?? ""}`) ?? null;
      jobs.push({
        external_id: asString(row.id),
        source: "jooble",
        title,
        company: asString(row.company),
        location,
        remote: modality === "remote",
        seniority: normalizeSeniority(title),
        url,
        description: snippet ? truncate(stripHtml(snippet)) : null,
        area_slug: detectArea(title),
        country,
        salary_min: null,
        salary_max: null,
        salary_currency: null,
        salary_is_predicted: null,
        contract_type: null,
        modality,
        labels: null,
        published_at: asString(row.updated) ?? new Date().toISOString(),
      });
      if (perUnitLimit && jobs.length >= perUnitLimit) return jobs;
    }
  }

  return jobs;
}

export function listJoobleUnits(): SourceUnit[] {
  if (!env.joobleApiKey) {
    console.warn("[vagas-sync] JOOBLE_API_KEY ausente, fonte jooble pulada");
    return [];
  }
  return JOOBLE_UNITS.map(({ country, host }) => ({
    source: "jooble",
    unit: country,
    fetch: (perUnitLimit?: number) =>
      fetchJoobleUnit(country, host, perUnitLimit),
  }));
}
