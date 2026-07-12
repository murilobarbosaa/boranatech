import { Router } from "express";
import { z } from "zod";

import { cacheKey, getOrCompute } from "../lib/cache";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import {
  checkProStatus,
  requireAdmin,
  requireAuth,
} from "../middleware/auth";
import { createError } from "../middleware/error";

// Rotas Pro de vagas (front VAGAS, fase 2). Contrato de seguranca (mesmo do
// linkedin.ts): identidade SEMPRE do JWT (req.user), tier resolvido
// server-side fail-closed (checkProStatus) e recheck explicito de !req.isPro
// em TODO handler Pro. Handlers de admin usam requireAdmin por rota
// (fail-closed: erro na checagem = 403).

const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

const LIST_TTL_SECONDS = 120;

const SENIORITIES = ["estagio", "junior", "pleno", "senior"] as const;
const CONTRACTS = ["clt", "pj"] as const;
const MODALITIES = ["remote", "hybrid", "onsite"] as const;
const SOURCES = ["jooble", "adzuna", "github", "ats_boards", "manual"] as const;

const ListQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  region: z.enum(["br", "intl", "all"]).default("all"),
  country: z.string().trim().toLowerCase().length(2).optional(),
  seniority: z.enum(SENIORITIES).optional(),
  contract: z.enum(CONTRACTS).optional(),
  modality: z.enum(MODALITIES).optional(),
  source: z.enum(SOURCES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(12),
});

// Colunas do item LEVE da lista (sem description, que so vai no detalhe).
const LIST_COLUMNS =
  "id, title, company, location, remote, seniority, url, area_slug, country, source, modality, contract_type, featured, salary_min, salary_max, salary_currency, salary_is_predicted, published_at";

type JobRow = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  remote: boolean | null;
  seniority: string | null;
  url: string;
  area_slug: string | null;
  country: string | null;
  source: string;
  modality: string | null;
  contract_type: string | null;
  featured: boolean | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_is_predicted: boolean | null;
  published_at: string | null;
  description?: string | null;
  labels?: unknown;
};

function toItem(row: JobRow) {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    remote: row.remote === true,
    seniority: row.seniority,
    url: row.url,
    areaSlug: row.area_slug,
    country: row.country,
    source: row.source,
    modality: row.modality,
    contract: row.contract_type,
    featured: row.featured === true,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    salaryCurrency: row.salary_currency,
    salaryIsPredicted: row.salary_is_predicted,
    publishedAt: row.published_at,
  };
}

// Sanitiza o q para o .or(ilike) do PostgREST: virgula e parenteses separam
// condicoes na sintaxe do or; %/_ sao wildcards do ilike. Trocamos por espaco
// em vez de rejeitar pra busca "react, node" ainda funcionar.
function sanitizeQuery(q: string): string {
  return q.replace(/[,()%_\\]/g, " ").replace(/\s+/g, " ").trim();
}

// GET /api/vagas: lista paginada com filtros.
router.get("/", async (req, res, next) => {
  if (!req.isPro) {
    return next(
      createError(403, "forbidden", "Recurso Pro. Assine o Plano Pro."),
    );
  }

  const parsed = ListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(createError(400, "invalid_request", "Filtros inválidos."));
  }
  const { q, region, country, seniority, contract, modality, source, page, limit } =
    parsed.data;

  try {
    const payload = await getOrCompute(
      cacheKey("vagas:list", {
        q,
        region,
        country,
        seniority,
        contract,
        modality,
        source,
        page,
        limit,
      }),
      LIST_TTL_SECONDS,
      async () => {
        const offset = (page - 1) * limit;
        let query = supabaseAdmin
          .from("external_jobs")
          .select(LIST_COLUMNS, { count: "exact" })
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (region === "br") query = query.eq("country", "br");
        if (region === "intl") query = query.neq("country", "br");
        if (country) query = query.eq("country", country);
        if (seniority) query = query.eq("seniority", seniority);
        if (contract) query = query.eq("contract_type", contract);
        if (modality) query = query.eq("modality", modality);
        if (source) query = query.eq("source", source);
        if (q) {
          const safe = sanitizeQuery(q);
          if (safe) {
            query = query.or(`title.ilike.%${safe}%,company.ilike.%${safe}%`);
          }
        }

        const { data, error, count } = await query;
        if (error) {
          throw createError(500, "db_error", "Erro ao buscar vagas.");
        }
        const total = count ?? 0;
        return {
          items: ((data ?? []) as JobRow[]).map(toItem),
          total,
          page,
          limit,
          hasMore: offset + limit < total,
        };
      },
    );
    res.json({ data: payload });
  } catch (err) {
    next(err);
  }
});

// GET /api/vagas/destaques: vagas destaque vivas (max 8).
// TODO(Ana): decidir se destaques ficam visíveis no free (alcance para
// empresas parceiras); hoje segue Pro-gated como o resto da pagina.
router.get("/destaques", async (req, res, next) => {
  if (!req.isPro) {
    return next(
      createError(403, "forbidden", "Recurso Pro. Assine o Plano Pro."),
    );
  }

  try {
    const payload = await getOrCompute(
      cacheKey("vagas:destaques"),
      LIST_TTL_SECONDS,
      async () => {
        const { data, error } = await supabaseAdmin
          .from("external_jobs")
          .select(LIST_COLUMNS)
          .eq("is_published", true)
          .eq("featured", true)
          .or(`featured_until.is.null,featured_until.gt.${new Date().toISOString()}`)
          .order("published_at", { ascending: false })
          .limit(8);
        if (error) {
          throw createError(500, "db_error", "Erro ao buscar destaques.");
        }
        return { items: ((data ?? []) as JobRow[]).map(toItem) };
      },
    );
    res.json({ data: payload });
  } catch (err) {
    next(err);
  }
});

// GET /api/vagas/admin: listagem das vagas manuais para o painel admin.
// ANTES do GET /:id para o segmento "admin" nao cair no param. Todos os
// estados de published, SEM cache (admin le fresco); limit fixo 100 cobre o
// volume manual esperado por muito tempo.
router.get("/admin", requireAdmin, async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("external_jobs")
      .select(`${LIST_COLUMNS}, description, featured_until, is_published`)
      .eq("source", "manual")
      .order("published_at", { ascending: false })
      .limit(100);
    if (error) {
      return next(createError(500, "db_error", "Erro ao listar vagas."));
    }
    type AdminRow = JobRow & {
      featured_until: string | null;
      is_published: boolean | null;
    };
    const items = ((data ?? []) as AdminRow[]).map((row) => ({
      ...toItem(row),
      description: row.description ?? null,
      featuredUntil: row.featured_until,
      published: row.is_published === true,
    }));
    res.json({ data: { items } });
  } catch (err) {
    next(err);
  }
});

// GET /api/vagas/:id: detalhe completo (com description e labels).
router.get("/:id", async (req, res, next) => {
  if (!req.isPro) {
    return next(
      createError(403, "forbidden", "Recurso Pro. Assine o Plano Pro."),
    );
  }

  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Vaga não encontrada."));
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("external_jobs")
      .select(`${LIST_COLUMNS}, description, labels`)
      .eq("id", id.data)
      .eq("is_published", true)
      .maybeSingle();
    if (error) {
      return next(createError(500, "db_error", "Erro ao buscar a vaga."));
    }
    if (!data) {
      return next(createError(404, "not_found", "Vaga não encontrada."));
    }
    const row = data as JobRow;
    res.json({
      data: {
        ...toItem(row),
        description: row.description ?? null,
        labels: Array.isArray(row.labels) ? row.labels : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// --- Admin: vagas destaque manuais (source='manual') ---

const salaryFields = {
  salary_min: z.number().nonnegative().optional(),
  salary_max: z.number().nonnegative().optional(),
  salary_currency: z.string().trim().toUpperCase().length(3).optional(),
};

// Valor de salario sem moeda e rejeitado: nunca gravar numero ambiguo.
function salaryHasCurrency(data: {
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
}): boolean {
  const hasValue =
    data.salary_min !== undefined || data.salary_max !== undefined;
  return !hasValue || data.salary_currency !== undefined;
}

const AdminCreateSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    company: z.string().trim().min(1).max(120),
    location: z.string().trim().min(1).max(120),
    country: z.string().trim().toLowerCase().length(2).default("br"),
    url: z
      .string()
      .trim()
      .url()
      .refine((u) => u.startsWith("https://"), "URL deve ser https."),
    seniority: z.enum(SENIORITIES).optional(),
    contract: z.enum(CONTRACTS).optional(),
    modality: z.enum(MODALITIES).optional(),
    description: z.string().trim().max(4000).optional(),
    ...salaryFields,
    featured: z.boolean().default(true),
    featured_until: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida.")
      .optional(),
    published: z.boolean().default(true),
  })
  .refine(salaryHasCurrency, {
    message: "salary_currency é obrigatória quando há valor de salário.",
  });

const AdminPatchSchema = z
  .object({
    title: z.string().trim().min(3).max(160).optional(),
    company: z.string().trim().min(1).max(120).optional(),
    location: z.string().trim().min(1).max(120).optional(),
    country: z.string().trim().toLowerCase().length(2).optional(),
    url: z
      .string()
      .trim()
      .url()
      .refine((u) => u.startsWith("https://"), "URL deve ser https.")
      .optional(),
    seniority: z.enum(SENIORITIES).nullable().optional(),
    contract: z.enum(CONTRACTS).nullable().optional(),
    modality: z.enum(MODALITIES).nullable().optional(),
    description: z.string().trim().max(4000).nullable().optional(),
    salary_min: z.number().nonnegative().nullable().optional(),
    salary_max: z.number().nonnegative().nullable().optional(),
    salary_currency: z.string().trim().toUpperCase().length(3).nullable().optional(),
    featured: z.boolean().optional(),
    featured_until: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida.")
      .nullable()
      .optional(),
    published: z.boolean().optional(),
  })
  .refine(
    (data) =>
      salaryHasCurrency({
        salary_min: data.salary_min ?? undefined,
        salary_max: data.salary_max ?? undefined,
        salary_currency: data.salary_currency ?? undefined,
      }),
    { message: "salary_currency é obrigatória quando há valor de salário." },
  );

type AdminCreate = z.infer<typeof AdminCreateSchema>;

function adminRowFromPayload(data: AdminCreate, userId: string) {
  const nowIso = new Date().toISOString();
  return {
    source: "manual",
    title: data.title,
    company: data.company,
    location: data.location,
    country: data.country,
    url: data.url,
    remote: data.modality === "remote",
    seniority: data.seniority ?? null,
    contract_type: data.contract ?? null,
    modality: data.modality ?? null,
    description: data.description ?? null,
    salary_min: data.salary_min ?? null,
    salary_max: data.salary_max ?? null,
    salary_currency: data.salary_currency ?? null,
    // Salario manual informado pelo admin nunca e estimativa.
    salary_is_predicted: data.salary_min !== undefined || data.salary_max !== undefined ? false : null,
    featured: data.featured,
    featured_until: data.featured_until ?? null,
    is_published: data.published,
    created_by: userId,
    published_at: nowIso,
    last_seen_at: nowIso,
    area_slug: null,
    external_id: null,
    labels: null,
  };
}

// POST /api/vagas/admin: cria vaga destaque manual.
// Sem invalidacao de cache pubcache (nao existe helper de invalidacao por
// prefixo); a janela de TTL de 120s e aceita por decisao da fase.
router.post("/admin", requireAdmin, async (req, res, next) => {
  const parsed = AdminCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(
      createError(
        400,
        "invalid_request",
        parsed.error.issues[0]?.message ?? "Payload inválido.",
      ),
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("external_jobs")
      .insert(adminRowFromPayload(parsed.data, req.user!.id))
      .select(`${LIST_COLUMNS}, description`)
      .single();
    if (error) {
      if (error.code === "23505") {
        return next(
          createError(409, "conflict", "Já existe uma vaga com essa URL."),
        );
      }
      return next(createError(500, "db_error", "Erro ao criar a vaga."));
    }
    const row = data as JobRow;
    res
      .status(201)
      .json({ data: { ...toItem(row), description: row.description ?? null } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/vagas/admin/:id: edicao parcial, SOMENTE de vagas manuais.
router.patch("/admin/:id", requireAdmin, async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Vaga não encontrada."));
  }
  const parsed = AdminPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(
      createError(
        400,
        "invalid_request",
        parsed.error.issues[0]?.message ?? "Payload inválido.",
      ),
    );
  }

  try {
    const { data: existing, error: findError } = await supabaseAdmin
      .from("external_jobs")
      .select("id, source")
      .eq("id", id.data)
      .maybeSingle();
    if (findError) {
      return next(createError(500, "db_error", "Erro ao buscar a vaga."));
    }
    if (!existing) {
      return next(createError(404, "not_found", "Vaga não encontrada."));
    }
    if (existing.source !== "manual") {
      return next(
        createError(
          403,
          "forbidden",
          "Somente vagas manuais podem ser editadas.",
        ),
      );
    }

    const d = parsed.data;
    const patch: Record<string, unknown> = {};
    if (d.title !== undefined) patch.title = d.title;
    if (d.company !== undefined) patch.company = d.company;
    if (d.location !== undefined) patch.location = d.location;
    if (d.country !== undefined) patch.country = d.country;
    if (d.url !== undefined) patch.url = d.url;
    if (d.seniority !== undefined) patch.seniority = d.seniority;
    if (d.contract !== undefined) patch.contract_type = d.contract;
    if (d.modality !== undefined) {
      patch.modality = d.modality;
      patch.remote = d.modality === "remote";
    }
    if (d.description !== undefined) patch.description = d.description;
    if (d.salary_min !== undefined) patch.salary_min = d.salary_min;
    if (d.salary_max !== undefined) patch.salary_max = d.salary_max;
    if (d.salary_currency !== undefined)
      patch.salary_currency = d.salary_currency;
    if (d.featured !== undefined) patch.featured = d.featured;
    if (d.featured_until !== undefined)
      patch.featured_until = d.featured_until;
    if (d.published !== undefined) patch.is_published = d.published;
    if (Object.keys(patch).length === 0) {
      return next(createError(400, "invalid_request", "Nada para atualizar."));
    }

    const { data, error } = await supabaseAdmin
      .from("external_jobs")
      .update(patch)
      .eq("id", id.data)
      .eq("source", "manual")
      .select(`${LIST_COLUMNS}, description`)
      .single();
    if (error) {
      return next(createError(500, "db_error", "Erro ao atualizar a vaga."));
    }
    const row = data as JobRow;
    res.json({
      data: { ...toItem(row), description: row.description ?? null },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
