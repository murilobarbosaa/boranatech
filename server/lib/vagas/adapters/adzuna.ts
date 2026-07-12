// Adapter Adzuna (front VAGAS, fase 2). Uma pagina de 50 por pais por
// rodada, categoria de TI validada (it-jobs) com fallback de keyword por
// idioma quando a categoria falhar. Unica fonte com salario estruturado
// alem do Lever; a moeda vem do mapa pais -> moeda (a API nao devolve
// currency) e salary_is_predicted marca valor estimado pela propria Adzuna.

import { env } from "../../env";
import { fetchWithTimeout } from "../../http";
import {
  ADZUNA_COUNTRIES,
  ADZUNA_IT_CATEGORY,
  ADZUNA_KEYWORD_FALLBACK,
  FETCH_TIMEOUT_MS,
} from "../config";
import {
  asArray,
  asNumber,
  asRecord,
  asString,
  currencyForCountry,
  detectArea,
  normalizeModality,
  normalizeSeniority,
  stripHtml,
  truncate,
} from "../normalize";
import type { NormalizedJob, SourceUnit } from "../types";

function buildSearchUrl(country: string, useCategory: boolean): string {
  const params = new URLSearchParams({
    app_id: env.adzunaAppId,
    app_key: env.adzunaAppKey,
    results_per_page: "50",
    sort_by: "date",
    max_days_old: "30",
  });
  if (useCategory) {
    params.set("category", ADZUNA_IT_CATEGORY);
  } else {
    params.set("what", ADZUNA_KEYWORD_FALLBACK[country] ?? "developer");
  }
  return `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`;
}

async function fetchAdzunaUnit(
  country: string,
  perUnitLimit?: number,
): Promise<NormalizedJob[]> {
  let res = await fetchWithTimeout(
    buildSearchUrl(country, true),
    {},
    { service: `adzuna:${country}`, timeoutMs: FETCH_TIMEOUT_MS },
  );
  if (res.status === 400 || res.status === 404) {
    // Categoria nao aceita neste pais: fallback de keyword no idioma local.
    res = await fetchWithTimeout(
      buildSearchUrl(country, false),
      {},
      { service: `adzuna:${country}`, timeoutMs: FETCH_TIMEOUT_MS },
    );
  }
  if (!res.ok) {
    throw new Error(`adzuna ${country} respondeu ${res.status}`);
  }

  const data = asRecord((await res.json()) as unknown);
  const currency = currencyForCountry(country);
  const jobs: NormalizedJob[] = [];

  for (const raw of asArray(data?.results)) {
    const row = asRecord(raw);
    if (!row) continue;
    const url = asString(row.redirect_url);
    const title = asString(row.title);
    if (!url || !title) continue;

    const company = asRecord(row.company);
    const location = asRecord(row.location);
    const description = asString(row.description);
    const salaryMin = asNumber(row.salary_min);
    const salaryMax = asNumber(row.salary_max);
    const hasSalary = salaryMin !== null || salaryMax !== null;
    // salary_is_predicted chega como string "1"/"0".
    const predictedRaw = row.salary_is_predicted;
    const isPredicted =
      predictedRaw === "1" || predictedRaw === 1 || predictedRaw === true;
    const modality = normalizeModality(
      `${title} ${asString(location?.display_name) ?? ""}`,
    );

    jobs.push({
      external_id: asString(row.id),
      source: "adzuna",
      title: stripHtml(title),
      company: asString(company?.display_name),
      location: asString(location?.display_name),
      remote: modality === "remote",
      seniority: normalizeSeniority(title),
      url,
      description: description ? truncate(stripHtml(description)) : null,
      area_slug: detectArea(title),
      country,
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_currency: hasSalary ? currency : null,
      salary_is_predicted: hasSalary ? isPredicted : null,
      contract_type: null,
      modality,
      labels: null,
      published_at: asString(row.created) ?? new Date().toISOString(),
    });
    if (perUnitLimit && jobs.length >= perUnitLimit) break;
  }

  return jobs;
}

export function listAdzunaUnits(): SourceUnit[] {
  if (!env.adzunaAppId || !env.adzunaAppKey) {
    console.warn(
      "[vagas-sync] ADZUNA_APP_ID/ADZUNA_APP_KEY ausentes, fonte adzuna pulada",
    );
    return [];
  }
  return ADZUNA_COUNTRIES.map((country) => ({
    source: "adzuna",
    unit: country,
    fetch: (perUnitLimit?: number) => fetchAdzunaUnit(country, perUnitLimit),
  }));
}
