// Adapter de boards de ATS (Greenhouse/Lever) de empresas curadas com
// operacao BR (front VAGAS, fase 2). O board devolve o mundo inteiro da
// empresa; o filtro de inclusao BR/LATAM decide o que entra. Limitacao
// registrada: "Remote" generico e aceito (empresas do config tem operacao
// BR), entao vaga remote-global entra como country br.

import { fetchWithTimeout } from "../../http";
import {
  ATS_BOARDS,
  ATS_BR_LOCATION_PATTERNS,
  FETCH_TIMEOUT_MS,
} from "../config";
import {
  asArray,
  asNumber,
  asRecord,
  asString,
  detectArea,
  normalizeModality,
  normalizeSeniority,
  stripHtml,
  truncate,
} from "../normalize";
import type { NormalizedJob, SourceUnit } from "../types";

function isBrLocation(location: string | null): boolean {
  if (!location) return false;
  const value = location.toLowerCase();
  return ATS_BR_LOCATION_PATTERNS.some((pattern) => value.includes(pattern));
}

async function fetchGreenhouseUnit(
  token: string,
  company: string,
  perUnitLimit?: number,
): Promise<NormalizedJob[]> {
  const res = await fetchWithTimeout(
    `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`,
    {},
    { service: `greenhouse:${token}`, timeoutMs: FETCH_TIMEOUT_MS },
  );
  if (!res.ok) {
    throw new Error(`greenhouse ${token} respondeu ${res.status}`);
  }

  const data = asRecord((await res.json()) as unknown);
  const jobs: NormalizedJob[] = [];
  for (const raw of asArray(data?.jobs)) {
    const row = asRecord(raw);
    if (!row) continue;
    const url = asString(row.absolute_url);
    const title = asString(row.title);
    const id = asNumber(row.id) ?? asString(row.id);
    if (!url || !title || id === null) continue;

    const location = asString(asRecord(row.location)?.name);
    if (!isBrLocation(location)) continue;

    const content = asString(row.content);
    const modality = normalizeModality(`${title} ${location ?? ""}`);
    jobs.push({
      external_id: `gh:${token}:${id}`,
      source: "ats_boards",
      title,
      company,
      location,
      remote: modality === "remote",
      seniority: normalizeSeniority(title),
      url,
      description: content ? truncate(stripHtml(content)) : null,
      area_slug: detectArea(title),
      country: "br",
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      salary_is_predicted: null,
      contract_type: null,
      modality,
      labels: null,
      published_at: asString(row.updated_at) ?? new Date().toISOString(),
    });
    if (perUnitLimit && jobs.length >= perUnitLimit) break;
  }

  return jobs;
}

async function fetchLeverUnit(
  slug: string,
  company: string,
  perUnitLimit?: number,
): Promise<NormalizedJob[]> {
  const res = await fetchWithTimeout(
    `https://api.lever.co/v0/postings/${slug}?mode=json`,
    {},
    { service: `lever:${slug}`, timeoutMs: FETCH_TIMEOUT_MS },
  );
  if (!res.ok) {
    throw new Error(`lever ${slug} respondeu ${res.status}`);
  }

  const jobs: NormalizedJob[] = [];
  for (const raw of asArray((await res.json()) as unknown)) {
    const row = asRecord(raw);
    if (!row) continue;
    const url = asString(row.hostedUrl);
    const title = asString(row.text);
    const id = asString(row.id);
    if (!url || !title || !id) continue;

    const categories = asRecord(row.categories);
    const location = asString(categories?.location);
    const workplace = asString(row.workplaceType);
    if (!isBrLocation(location) && workplace?.toLowerCase() !== "remote") {
      continue;
    }

    const salaryRange = asRecord(row.salaryRange);
    const salaryMin = asNumber(salaryRange?.min);
    const salaryMax = asNumber(salaryRange?.max);
    const hasSalary = salaryMin !== null || salaryMax !== null;
    const salaryCurrency = asString(salaryRange?.currency);
    const createdAt = asNumber(row.createdAt);
    const description = asString(row.descriptionPlain);
    const modality =
      normalizeModality(workplace ?? "") ??
      normalizeModality(`${title} ${location ?? ""}`);

    jobs.push({
      external_id: `lever:${slug}:${id}`,
      source: "ats_boards",
      title,
      company,
      location,
      remote: modality === "remote",
      seniority: normalizeSeniority(title),
      url,
      description: description ? truncate(description) : null,
      area_slug: detectArea(title),
      country: "br",
      // Salario so quando o Lever manda currency junto (nunca adivinhar).
      salary_min: hasSalary && salaryCurrency ? salaryMin : null,
      salary_max: hasSalary && salaryCurrency ? salaryMax : null,
      salary_currency: hasSalary && salaryCurrency ? salaryCurrency : null,
      salary_is_predicted: hasSalary && salaryCurrency ? false : null,
      contract_type: null,
      modality,
      labels: null,
      published_at: createdAt
        ? new Date(createdAt).toISOString()
        : new Date().toISOString(),
    });
    if (perUnitLimit && jobs.length >= perUnitLimit) break;
  }

  return jobs;
}

export function listAtsUnits(): SourceUnit[] {
  return ATS_BOARDS.map(({ ats, token, company }) => ({
    source: "ats_boards",
    unit: `${ats}:${token}`,
    fetch: (perUnitLimit?: number) =>
      ats === "greenhouse"
        ? fetchGreenhouseUnit(token, company, perUnitLimit)
        : fetchLeverUnit(token, company, perUnitLimit),
  }));
}
