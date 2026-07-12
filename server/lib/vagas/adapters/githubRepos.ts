// Adapter dos repos de vagas do GitHub (front VAGAS, fase 2). Cada issue
// aberta e uma vaga BR. Labels da comunidade carregam senioridade, contrato,
// modalidade e cidade; o titulo segue o padrao "[Cidade] Vaga na Empresa" e a
// empresa e extraida best-effort (senao fica null).

import { env } from "../../env";
import { fetchWithTimeout } from "../../http";
import { FETCH_TIMEOUT_MS, GITHUB_MAX_PAGES, GITHUB_REPOS } from "../config";
import {
  asArray,
  asRecord,
  asString,
  detectArea,
  normalizeContract,
  normalizeModality,
  normalizeSeniority,
  truncate,
} from "../normalize";
import type { NormalizedJob, SourceUnit } from "../types";

// Extrai a cidade do prefixo "[Cidade]" e a empresa do sufixo "na Empresa";
// qualquer coisa fora do padrao vira null, nunca chute.
function parseTitle(title: string): {
  city: string | null;
  company: string | null;
} {
  const bracket = /^\[([^\]]+)\]\s*(.*)$/.exec(title.trim());
  const city = bracket ? bracket[1].trim() : null;
  const rest = bracket ? bracket[2] : title;
  const company = /(?:\bna\b|\bno\b|\bem\b|@|\bat\b)\s+(.{2,80})$/i.exec(
    rest.trim(),
  );
  return { city, company: company ? company[1].trim() : null };
}

async function fetchRepoUnit(
  repo: string,
  perUnitLimit?: number,
): Promise<NormalizedJob[]> {
  const token = env.githubVagasToken;
  const maxPages = token ? GITHUB_MAX_PAGES : 1;
  const headers: Record<string, string> = {
    "User-Agent": "boranatech-vagas-sync",
    Accept: "application/vnd.github+json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const jobs: NormalizedJob[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await fetchWithTimeout(
      `https://api.github.com/repos/${repo}/issues?state=open&sort=created&direction=desc&per_page=50&page=${page}`,
      { headers },
      { service: `github:${repo}`, timeoutMs: FETCH_TIMEOUT_MS },
    );
    if (!res.ok) {
      throw new Error(`github ${repo} respondeu ${res.status}`);
    }

    const items = asArray((await res.json()) as unknown);
    for (const raw of items) {
      const row = asRecord(raw);
      if (!row) continue;
      // A listagem de issues inclui PRs; a chave pull_request identifica.
      if ("pull_request" in row) continue;
      const url = asString(row.html_url);
      const title = asString(row.title);
      const number = row.number;
      if (!url || !title || typeof number !== "number") continue;

      const labels = asArray(row.labels)
        .map((label) => asString(asRecord(label)?.name))
        .filter((name): name is string => name !== null);
      const labelText = labels.join(" ").toLowerCase();
      const { city, company } = parseTitle(title);
      const modality =
        normalizeModality(labelText) ?? normalizeModality(title);
      const body = asString(row.body);

      jobs.push({
        external_id: `${repo}#${number}`,
        source: "github",
        title,
        company,
        location: city,
        remote: modality === "remote",
        seniority:
          normalizeSeniority(labelText) ?? normalizeSeniority(title),
        url,
        description: body ? truncate(body) : null,
        area_slug: detectArea(`${repo} ${title}`),
        country: "br",
        salary_min: null,
        salary_max: null,
        salary_currency: null,
        salary_is_predicted: null,
        contract_type:
          normalizeContract(labelText) ?? normalizeContract(title),
        modality,
        labels: labels.length > 0 ? labels : null,
        published_at: asString(row.created_at) ?? new Date().toISOString(),
      });
      if (perUnitLimit && jobs.length >= perUnitLimit) return jobs;
    }

    // Pagina incompleta = acabaram as issues; nao ha proxima pagina.
    if (items.length < 50) break;
  }

  return jobs;
}

export function listGithubUnits(): SourceUnit[] {
  if (!env.githubVagasToken) {
    console.warn(
      "[vagas-sync] sem GITHUB_VAGAS_TOKEN/GITHUB_TOKEN: fonte github em modo reduzido (1 pagina por repo)",
    );
  }
  return GITHUB_REPOS.map((repo) => ({
    source: "github",
    unit: repo,
    fetch: (perUnitLimit?: number) => fetchRepoUnit(repo, perUnitLimit),
  }));
}
