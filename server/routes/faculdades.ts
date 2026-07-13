import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";

import { cacheKey, getOrCompute } from "../lib/cache";
import { cacheConnection } from "../lib/redis";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError } from "../middleware/error";

// Rota PUBLICA e gratuita das faculdades de tecnologia (Censo INEP 2024).
// Sem gate de Pro, sem auth. Registrada antes do validateSupabaseJwt em
// app.ts. Leitura server-side com filtro, busca e paginacao.
//
// FAIL-CLOSED: erro de banco NUNCA vira array vazio (isso mascararia falha e
// se confundiria com "sem resultado"); vira 500 db_error, um erro claro. O
// rate limit tambem e fail-closed (Redis fora = 503), no padrao da newsletter.

const router = Router();

const LIST_TTL_SECONDS = 120;
const FILTROS_TTL_SECONDS = 1800;

// Rate limit por IP, mesmo padrao INCR+EXPIRE da newsletter. Janela generosa
// (rota de leitura publica); dominante sobre o cache fail-open.
const RATE_WINDOW_SECONDS = 60;
const RATE_MAX_REQUESTS = 120;

// 26 estados + DF. Validacao fechada: UF fora disso = 400.
const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
] as const;

// Taxonomia espelhada do CHECK da migration e de faculdadesSubareas.ts.
const SUBAREAS = [
  "Desenvolvimento",
  "Dados e IA",
  "Infra e Redes",
  "Segurança",
  "Gestão e Produto",
  "Jogos",
  "QA",
  "Outros",
] as const;

const MODALIDADE_CODE: Record<"presencial" | "ead", number> = {
  presencial: 1,
  ead: 2,
};
const GRAU_CODE: Record<"bacharelado" | "licenciatura" | "tecnologico", number> =
  {
    bacharelado: 1,
    licenciatura: 2,
    tecnologico: 3,
  };
const REDE_CODE: Record<"publica" | "privada", number> = {
  publica: 1,
  privada: 2,
};

const CURSO_SELECT =
  "co_curso, co_ies, no_curso, no_curso_raw, no_cine_rotulo, " +
  "co_cine_area_detalhada, subarea, tp_grau_academico, no_grau_academico, " +
  "tp_modalidade_ensino, no_modalidade_ensino, sg_uf, no_municipio, " +
  "qt_vg_total, " +
  "faculdades_ies!inner(no_ies, sg_ies, tp_organizacao_academica, " +
  "no_organizacao_academica, tp_rede, no_rede)";

interface IesEmbed {
  no_ies: string;
  sg_ies: string | null;
  tp_organizacao_academica: number | null;
  no_organizacao_academica: string | null;
  tp_rede: number | null;
  no_rede: string | null;
}

interface CursoRow {
  co_curso: number;
  co_ies: number;
  no_curso: string;
  no_curso_raw: string;
  no_cine_rotulo: string | null;
  co_cine_area_detalhada: string | null;
  subarea: string;
  tp_grau_academico: number | null;
  no_grau_academico: string | null;
  tp_modalidade_ensino: number | null;
  no_modalidade_ensino: string | null;
  sg_uf: string | null;
  no_municipio: string | null;
  qt_vg_total: number | null;
  faculdades_ies: IesEmbed;
}

interface IesRow {
  co_ies: number;
  no_ies: string;
  sg_ies: string | null;
  no_mantenedora: string | null;
  sg_uf: string;
  no_municipio: string | null;
  co_municipio: number | null;
  tp_organizacao_academica: number | null;
  no_organizacao_academica: string | null;
  tp_categoria_administrativa: number | null;
  no_categoria_administrativa: string | null;
  tp_rede: number | null;
  no_rede: string | null;
  ano_censo: number;
}

const ListQuerySchema = z.object({
  uf: z.enum(UFS).optional(),
  modalidade: z.enum(["presencial", "ead"]).optional(),
  grau: z.enum(["bacharelado", "licenciatura", "tecnologico"]).optional(),
  subarea: z.enum(SUBAREAS).optional(),
  rede: z.enum(["publica", "privada"]).optional(),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  // Teto rigido: limit acima de 50 e CAPADO em 50, nao rejeitado. Valor
  // invalido (nao-inteiro, <1) cai no safeParse e vira 400.
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .default(20)
    .transform((value) => Math.min(value, 50)),
});

const coIesParamSchema = z.coerce.number().int().positive();

// Fail-closed: sem rate limiter (Redis ausente ou fora) a rota nega com 503 em
// vez de seguir sem throttle. Retorna false quando ja respondeu via next(err).
async function enforceRateLimit(
  req: Request,
  next: NextFunction,
): Promise<boolean> {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (!cacheConnection) {
    next(
      createError(
        503,
        "rate_check_failed",
        "Servico indisponivel no momento. Tente novamente em instantes.",
      ),
    );
    return false;
  }
  try {
    const key = `faculdades:rl:${ip}`;
    const attempts = await cacheConnection.incr(key);
    if (attempts === 1) {
      await cacheConnection.expire(key, RATE_WINDOW_SECONDS);
    }
    if (attempts > RATE_MAX_REQUESTS) {
      next(
        createError(
          429,
          "too_many_requests",
          "Muitas requisicoes. Tente novamente em instantes.",
        ),
      );
      return false;
    }
  } catch (err) {
    console.error(
      "[faculdades] Rate limit Redis indisponivel, negando (fail-closed)",
      err,
    );
    next(
      createError(
        503,
        "rate_check_failed",
        "Servico indisponivel no momento. Tente novamente em instantes.",
      ),
    );
    return false;
  }
  return true;
}

// Sanitiza q para o .or(ilike) do PostgREST: virgula e parenteses separam
// condicoes; %/_ sao wildcards do ilike. Troca por espaco em vez de rejeitar.
function sanitizeQuery(value: string): string {
  return value
    .replace(/[,()%_\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toCursoItem(row: CursoRow) {
  const ies = row.faculdades_ies;
  return {
    coCurso: row.co_curso,
    coIes: row.co_ies,
    curso: row.no_curso,
    cursoRaw: row.no_curso_raw,
    cineRotulo: row.no_cine_rotulo,
    cineAreaDetalhada: row.co_cine_area_detalhada,
    subarea: row.subarea,
    grau: row.no_grau_academico,
    grauCodigo: row.tp_grau_academico,
    modalidade: row.no_modalidade_ensino,
    modalidadeCodigo: row.tp_modalidade_ensino,
    uf: row.sg_uf,
    municipio: row.no_municipio,
    vagas: row.qt_vg_total,
    ies: {
      coIes: row.co_ies,
      nome: ies.no_ies,
      sigla: ies.sg_ies,
      organizacao: ies.no_organizacao_academica,
      organizacaoCodigo: ies.tp_organizacao_academica,
      rede: ies.no_rede,
    },
  };
}

// GET /api/faculdades/cursos: lista paginada com filtros server-side.
router.get("/cursos", async (req, res, next) => {
  if (!(await enforceRateLimit(req, next))) return;

  const parsed = ListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(
      createError(400, "invalid_request", "Parametros de busca invalidos."),
    );
  }
  const { uf, modalidade, grau, subarea, rede, q, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    const payload = await getOrCompute(
      cacheKey("faculdades:cursos", {
        uf,
        modalidade,
        grau,
        subarea,
        rede,
        q,
        page,
        limit,
      }),
      LIST_TTL_SECONDS,
      async () => {
        // Busca textual: q casa nome de curso OU nome de instituicao. Como o
        // nome da IES vive na tabela embedada, resolvemos os co_ies que casam
        // primeiro (indice trigram em no_ies) e depois OR com no_curso.
        // LIMITACAO conhecida: ilike e case-insensitive mas accent-SENSITIVE
        // ("estacio" nao casa "ESTÁCIO", "ciencia" nao casa "Ciência"). Folding
        // de acento exige a extensao unaccent + indice funcional, ou seja uma
        // migration, fora do escopo desta fase (rota). Fica para a fase 2.
        let iesIds: number[] = [];
        const safeQuery = q ? sanitizeQuery(q) : "";
        if (safeQuery) {
          const { data: iesMatch, error: iesErr } = await supabaseAdmin
            .from("faculdades_ies")
            .select("co_ies")
            .ilike("no_ies", `%${safeQuery}%`);
          if (iesErr) {
            throw createError(500, "db_error", "Erro ao buscar faculdades.");
          }
          iesIds = ((iesMatch ?? []) as Array<{ co_ies: number }>).map(
            (r) => r.co_ies,
          );
        }

        let query = supabaseAdmin
          .from("faculdades_cursos")
          .select(CURSO_SELECT, { count: "exact" })
          // qt_vg_total=0 e real (curso ativo sem vaga no censo): nao esconde,
          // so ranqueia por baixo. Ordem deterministica = paginacao estavel.
          // Relevancia real por trigram (similarity) exige funcao no banco,
          // fora do escopo desta fase; aproximamos pela mesma ordem estavel.
          .order("qt_vg_total", { ascending: false })
          .order("no_curso", { ascending: true })
          .range(offset, offset + limit - 1);

        // Ponto sutil da rota (filtro por UF x EAD sem UF):
        //  - modalidade=ead: so EAD, IGNORA uf.
        //  - modalidade=presencial: so presenciais (+ uf se veio).
        //  - uf sem modalidade: presenciais da UF E os EAD (nacionais), que e
        //    o que o usuario realmente quer ver.
        if (modalidade === "ead") {
          query = query.eq("tp_modalidade_ensino", MODALIDADE_CODE.ead);
        } else if (modalidade === "presencial") {
          query = query.eq("tp_modalidade_ensino", MODALIDADE_CODE.presencial);
          if (uf) query = query.eq("sg_uf", uf);
        } else if (uf) {
          query = query.or(
            `sg_uf.eq.${uf},tp_modalidade_ensino.eq.${MODALIDADE_CODE.ead}`,
          );
        }

        if (grau) query = query.eq("tp_grau_academico", GRAU_CODE[grau]);
        if (rede) {
          query = query.eq("faculdades_ies.tp_rede", REDE_CODE[rede]);
        }
        if (safeQuery) {
          const parts = [`no_curso.ilike.%${safeQuery}%`];
          if (iesIds.length > 0) {
            parts.push(`co_ies.in.(${iesIds.join(",")})`);
          }
          query = query.or(parts.join(","));
        }

        const { data, error, count } = await query;
        if (error) {
          throw createError(500, "db_error", "Erro ao buscar faculdades.");
        }
        const total = count ?? 0;
        return {
          items: ((data ?? []) as unknown as CursoRow[]).map(toCursoItem),
          total,
          page,
          limit,
          hasMore: offset + limit < total,
        };
      },
    );
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

interface FacetRow {
  sg_uf: string | null;
  subarea: string;
  tp_grau_academico: number | null;
  no_grau_academico: string | null;
  tp_modalidade_ensino: number | null;
  no_modalidade_ensino: string | null;
  faculdades_ies: { tp_rede: number | null; no_rede: string | null };
}

// PostgREST limita 1000 linhas por resposta; paginamos ate esgotar.
async function fetchAllFacetRows(): Promise<FacetRow[]> {
  const rows: FacetRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from("faculdades_cursos")
      .select(
        "sg_uf, subarea, tp_grau_academico, no_grau_academico, " +
          "tp_modalidade_ensino, no_modalidade_ensino, " +
          "faculdades_ies!inner(tp_rede, no_rede)",
      )
      .order("co_curso", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      throw createError(500, "db_error", "Erro ao montar filtros.");
    }
    const page = (data ?? []) as unknown as FacetRow[];
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  return rows;
}

// GET /api/faculdades/filtros: facetas com contagem para a UI montar os
// filtros sem hardcode. Cacheavel (muda so quando roda a ingestao).
router.get("/filtros", async (req, res, next) => {
  if (!(await enforceRateLimit(req, next))) return;

  try {
    const payload = await getOrCompute(
      cacheKey("faculdades:filtros"),
      FILTROS_TTL_SECONDS,
      async () => {
        const rows = await fetchAllFacetRows();

        const ufCount = new Map<string, number>();
        const subCount = new Map<string, number>();
        const grauCount = new Map<number, { label: string; count: number }>();
        const modCount = new Map<number, { label: string; count: number }>();
        const redeCount = new Map<number, { label: string; count: number }>();

        for (const row of rows) {
          if (row.sg_uf) {
            ufCount.set(row.sg_uf, (ufCount.get(row.sg_uf) ?? 0) + 1);
          }
          subCount.set(row.subarea, (subCount.get(row.subarea) ?? 0) + 1);
          if (row.tp_grau_academico !== null) {
            const cur = grauCount.get(row.tp_grau_academico);
            grauCount.set(row.tp_grau_academico, {
              label: row.no_grau_academico ?? "",
              count: (cur?.count ?? 0) + 1,
            });
          }
          if (row.tp_modalidade_ensino !== null) {
            const cur = modCount.get(row.tp_modalidade_ensino);
            modCount.set(row.tp_modalidade_ensino, {
              label: row.no_modalidade_ensino ?? "",
              count: (cur?.count ?? 0) + 1,
            });
          }
          const rede = row.faculdades_ies.tp_rede;
          if (rede !== null) {
            const cur = redeCount.get(rede);
            redeCount.set(rede, {
              label: row.faculdades_ies.no_rede ?? "",
              count: (cur?.count ?? 0) + 1,
            });
          }
        }

        return {
          ufs: Array.from(ufCount.entries())
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => a.value.localeCompare(b.value)),
          subareas: Array.from(subCount.entries())
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count),
          graus: Array.from(grauCount.entries())
            .map(([codigo, v]) => ({ codigo, label: v.label, count: v.count }))
            .sort((a, b) => b.count - a.count),
          modalidades: Array.from(modCount.entries())
            .map(([codigo, v]) => ({ codigo, label: v.label, count: v.count }))
            .sort((a, b) => b.count - a.count),
          redes: Array.from(redeCount.entries())
            .map(([codigo, v]) => ({ codigo, label: v.label, count: v.count }))
            .sort((a, b) => b.count - a.count),
        };
      },
    );
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

// GET /api/faculdades/ies/:co_ies: detalhe da IES e seus cursos de tech.
router.get("/ies/:co_ies", async (req, res, next) => {
  if (!(await enforceRateLimit(req, next))) return;

  const parsedId = coIesParamSchema.safeParse(req.params.co_ies);
  if (!parsedId.success) {
    return next(createError(400, "invalid_request", "co_ies invalido."));
  }
  const coIes = parsedId.data;

  try {
    const { data: ies, error: iesErr } = await supabaseAdmin
      .from("faculdades_ies")
      .select(
        "co_ies, no_ies, sg_ies, no_mantenedora, sg_uf, no_municipio, " +
          "co_municipio, tp_organizacao_academica, no_organizacao_academica, " +
          "tp_categoria_administrativa, no_categoria_administrativa, tp_rede, " +
          "no_rede, ano_censo",
      )
      .eq("co_ies", coIes)
      .maybeSingle();
    if (iesErr) {
      return next(createError(500, "db_error", "Erro ao buscar faculdade."));
    }
    if (!ies) {
      return next(createError(404, "not_found", "Faculdade nao encontrada."));
    }

    const { data: cursos, error: cursosErr } = await supabaseAdmin
      .from("faculdades_cursos")
      .select(CURSO_SELECT)
      .eq("co_ies", coIes)
      .order("qt_vg_total", { ascending: false })
      .order("no_curso", { ascending: true });
    if (cursosErr) {
      return next(createError(500, "db_error", "Erro ao buscar cursos."));
    }

    const row = ies as unknown as IesRow;
    res.json({
      ies: {
        coIes: row.co_ies,
        nome: row.no_ies,
        sigla: row.sg_ies,
        mantenedora: row.no_mantenedora,
        uf: row.sg_uf,
        municipio: row.no_municipio,
        organizacao: row.no_organizacao_academica,
        organizacaoCodigo: row.tp_organizacao_academica,
        categoria: row.no_categoria_administrativa,
        categoriaCodigo: row.tp_categoria_administrativa,
        rede: row.no_rede,
        anoCenso: row.ano_censo,
      },
      cursos: ((cursos ?? []) as unknown as CursoRow[]).map(toCursoItem),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
