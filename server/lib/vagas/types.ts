// Tipos do pipeline de vagas multi-fonte (front VAGAS, fase 2).

// Linha normalizada pronta para upsert em external_jobs. Espelha as colunas
// que o sync escreve; featured/featured_until/created_by ficam DE FORA de
// proposito (pertencem ao fluxo manual do admin e o upsert nunca os toca).
export type NormalizedJob = {
  external_id: string | null;
  source: JobSource;
  title: string;
  company: string | null;
  location: string | null;
  remote: boolean;
  seniority: string | null;
  url: string;
  description: string | null;
  area_slug: string | null;
  country: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_is_predicted: boolean | null;
  contract_type: string | null;
  modality: string | null;
  labels: string[] | null;
  published_at: string;
};

export type JobSource = "jooble" | "adzuna" | "github" | "ats_boards";

// Unidade de execucao de uma fonte: pais (jooble/adzuna), repo (github) ou
// empresa (ats_boards). O orquestrador roda as unidades de uma fonte com
// Promise.allSettled; erro de unidade e lancado pelo fetch (nunca lixo
// parcial silencioso) e vira o campo error do resultado.
export type SourceUnit = {
  source: JobSource;
  unit: string;
  fetch: (perUnitLimit?: number) => Promise<NormalizedJob[]>;
};

export type SourceRunResult = {
  source: JobSource;
  unit: string;
  fetched: number;
  upserted: number;
  failed: number;
  // Reprovadas no filtro de relevancia TI (fase 6); github nao filtra.
  dropped: number;
  error?: string;
};
