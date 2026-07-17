import { Router } from "express";
import type { Request, Response } from "express";

import { cacheKey, getOrCompute } from "../lib/cache";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";
import {
  FREE_COURSES_SAMPLE_SIZE,
  FREE_PLATFORMS_SAMPLE_SIZE,
} from "../../shared/freeTierLimits";
import { projetos } from "../../shared/projects/catalog";

const router = Router();

// Slugs dos projetos premium, derivados da fonte canonica (catalogo estatico
// compartilhado). A tabela `projects` do Supabase e um espelho seedado que NAO
// carrega o flag pro, entao o gate do payload de /projects usa este set, nao
// uma coluna do banco.
const PRO_PROJECT_SLUGS = new Set(
  projetos.filter((p) => p.pro === true).map((p) => p.id),
);

type TierPayload<T> = { data: T[]; lockedCount: number };

// Amostra posicional: free ve os primeiros `sampleSize` itens; o resto vira
// apenas contagem (lockedCount), sem dados. Pro ve tudo.
function sampleByTier<T>(
  data: T[],
  isPro: boolean,
  sampleSize: number,
): TierPayload<T> {
  if (isPro) return { data, lockedCount: 0 };
  const sample = data.slice(0, sampleSize);
  return { data: sample, lockedCount: Math.max(data.length - sampleSize, 0) };
}

// O payload destas rotas de catalogo VARIA por tier (Pro ve tudo; free/anonimo
// so a amostra) e o tier deriva do header Authorization. A CDN da Vercel chaveia
// o cache pela URL, nao pelo Authorization: uma unica resposta cacheada seria
// servida pros dois tiers. Isso vaza nos dois sentidos: a amostra de 6 chegando
// a um Pro, ou (se qualquer request autenticado gravasse o payload completo com
// header publico) o catalogo pago chegando a free/anonimo. Por isso NUNCA
// cacheavel em borda: `private, no-store` pra todo tier, sem excecao pro
// anonimo. `Vary: Authorization` e defesa em profundidade (documenta a
// dependencia e protege caso alguem reintroduza cache cacheavel aqui). Perder o
// cache de 60s destas 3 rotas e irrelevante; servir o payload do tier errado
// nao e. As paginas /cursos e /plataformas renderizam do estatico (data.ts),
// entao nao dependem deste cache pra performance.
function setTierCacheControl(_req: Request, res: Response) {
  res.vary("Authorization");
  res.set("Cache-Control", "private, no-store");
}

const NEWS_FEED_MAX_AGE_DAYS = 30; // TODO(Ana): janela de exibição do feed

// TTLs do cache publico. Requests com busca de texto livre (search/q) fazem
// bypass do cache: cardinalidade de chave ilimitada poluiria o Redis.
const LIST_TTL_SECONDS = 120;
const ITEM_TTL_SECONDS = 300;

// Cache-Control HTTP das rotas publicas (sem auth). Browser segura pouco
// (max-age) e a borda/CDN um pouco mais (s-maxage). Rotas mais dinamicas
// (news, jobs, sources/status) usam a variante curta.
const PUBLIC_CACHE_CONTROL = "public, max-age=60, s-maxage=120";
const DYNAMIC_CACHE_CONTROL = "public, max-age=30, s-maxage=60";

router.get("/areas", async (req, res, next) => {
  try {
    const { tag, search } = req.query;
    const payload = await getOrCompute(
      cacheKey("content:areas", { tag }),
      LIST_TTL_SECONDS,
      async () => {
        let query = supabaseAdmin
          .from("areas")
          .select(
            "id, slug, name, short_description, tag, tag_class, icon, color, is_pro, sort_order, profile_indicated, skills, roles",
          )
          .eq("is_published", true)
          .order("sort_order", { ascending: true });

        if (tag) query = query.eq("tag", tag);
        if (search) query = query.ilike("name", `%${search}%`);

        const { data, error } = await query;
        if (error) throw createError(500, "db_error", "Erro ao buscar áreas.");
        return { data: data || [] };
      },
      { bypass: Boolean(search) },
    );

    res.set("Cache-Control", PUBLIC_CACHE_CONTROL);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.get("/areas/:slug", async (req, res, next) => {
  try {
    const payload = await getOrCompute(
      cacheKey("content:areas-item", { slug: req.params.slug }),
      ITEM_TTL_SECONDS,
      async () => {
        const { data, error } = await supabaseAdmin
          .from("areas")
          .select("*")
          .eq("slug", req.params.slug)
          .eq("is_published", true)
          .single();

        // null = not found: devolvido sem cachear (so sucesso entra no cache)
        if (error || !data) return null;
        return { data };
      },
    );

    if (!payload)
      return next(createError(404, "not_found", "Área não encontrada."));

    res.set("Cache-Control", PUBLIC_CACHE_CONTROL);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.get("/technologies", async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const payload = await getOrCompute(
      cacheKey("content:technologies", { category }),
      LIST_TTL_SECONDS,
      async () => {
        let query = supabaseAdmin
          .from("technologies")
          .select("*")
          .eq("is_published", true)
          .order("sort_order", { ascending: true });

        if (category) query = query.eq("category", category);
        if (search) query = query.ilike("name", `%${search}%`);

        const { data, error } = await query;
        if (error)
          throw createError(500, "db_error", "Erro ao buscar tecnologias.");
        return { data: data || [] };
      },
      { bypass: Boolean(search) },
    );

    res.set("Cache-Control", PUBLIC_CACHE_CONTROL);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.get("/technologies/ranking", async (_req, res, next) => {
  try {
    const payload = await getOrCompute(
      cacheKey("content:technologies-ranking"),
      LIST_TTL_SECONDS,
      async () => {
        const { data, error } = await supabaseAdmin
          .from("technologies")
          .select("*")
          .eq("is_published", true)
          .order("sort_order", { ascending: true });

        if (error)
          throw createError(500, "db_error", "Erro ao buscar ranking.");
        return { data: data || [] };
      },
    );

    res.set("Cache-Control", PUBLIC_CACHE_CONTROL);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.get("/technologies/compare", async (req, res, next) => {
  try {
    const { left, right } = req.query;
    if (!left || !right) {
      return next(
        createError(
          400,
          "invalid_request",
          "Parâmetros left e right são obrigatórios.",
        ),
      );
    }

    const payload = await getOrCompute(
      cacheKey("content:technologies-compare", { left, right }),
      ITEM_TTL_SECONDS,
      async () => {
        const { data, error } = await supabaseAdmin
          .from("technologies")
          .select("*")
          .in("slug", [String(left), String(right)])
          .eq("is_published", true);

        if (error)
          throw createError(500, "db_error", "Erro ao comparar tecnologias.");
        if (!data || data.length < 2) return null;
        return { data };
      },
    );

    if (!payload)
      return next(
        createError(
          404,
          "not_found",
          "Uma ou mais tecnologias não encontradas.",
        ),
      );

    res.set("Cache-Control", PUBLIC_CACHE_CONTROL);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.get("/technologies/:slug", async (req, res, next) => {
  try {
    const payload = await getOrCompute(
      cacheKey("content:technologies-item", { slug: req.params.slug }),
      ITEM_TTL_SECONDS,
      async () => {
        const { data, error } = await supabaseAdmin
          .from("technologies")
          .select("*")
          .eq("slug", req.params.slug)
          .eq("is_published", true)
          .single();

        if (error || !data) return null;
        return { data };
      },
    );

    if (!payload)
      return next(createError(404, "not_found", "Tecnologia não encontrada."));

    res.set("Cache-Control", PUBLIC_CACHE_CONTROL);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.get("/courses", checkProStatus, async (req, res, next) => {
  try {
    const { area, is_free, level, search } = req.query;
    const payload = await getOrCompute(
      cacheKey("content:courses", { area, is_free, level }),
      LIST_TTL_SECONDS,
      async () => {
        let query = supabaseAdmin
          .from("courses")
          .select("*")
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (area) query = query.eq("area_slug", area);
        if (is_free !== undefined)
          query = query.eq("is_free", is_free === "true");
        if (level) query = query.eq("level", level);
        if (search) query = query.ilike("title", `%${search}%`);

        const { data, error } = await query;
        if (error) throw createError(500, "db_error", "Erro ao buscar cursos.");
        return { data: data || [] };
      },
      { bypass: Boolean(search) },
    );

    // Fatiamento por tier: free (inclui anonimo) so recebe a amostra; os itens
    // travados nao vao no payload, so a contagem. Fail-closed: checkProStatus
    // resolve req.isPro como false em qualquer erro.
    const tier = sampleByTier(
      payload.data,
      req.isPro === true,
      FREE_COURSES_SAMPLE_SIZE,
    );
    setTierCacheControl(req, res);
    res.json(tier);
  } catch (err) {
    next(err);
  }
});

router.get("/platforms", checkProStatus, async (req, res, next) => {
  try {
    const payload = await getOrCompute(
      cacheKey("content:platforms"),
      LIST_TTL_SECONDS,
      async () => {
        const { data, error } = await supabaseAdmin
          .from("platforms")
          .select("*")
          .eq("is_published", true)
          .order("name", { ascending: true });

        if (error)
          throw createError(500, "db_error", "Erro ao buscar plataformas.");
        return { data: data || [] };
      },
    );

    const tier = sampleByTier(
      payload.data,
      req.isPro === true,
      FREE_PLATFORMS_SAMPLE_SIZE,
    );
    setTierCacheControl(req, res);
    res.json(tier);
  } catch (err) {
    next(err);
  }
});

router.get("/projects", checkProStatus, async (req, res, next) => {
  try {
    const { area, level } = req.query;
    const payload = await getOrCompute(
      cacheKey("content:projects", { area, level }),
      LIST_TTL_SECONDS,
      async () => {
        let query = supabaseAdmin
          .from("projects")
          .select("*")
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (area) query = query.eq("area_slug", area);
        if (level) query = query.eq("level", level);

        const { data, error } = await query;
        if (error)
          throw createError(500, "db_error", "Erro ao buscar projetos.");
        return { data: data || [] };
      },
    );

    // Gate por flag (nao posicional): free nao recebe os projetos premium. O
    // espelho `projects` do Supabase nao seeda o flag pro, entao filtramos pelo
    // slug contra a fonte canonica (PRO_PROJECT_SLUGS). Pro ve tudo.
    const rows = payload.data as Array<{ slug?: string }>;
    let data = rows;
    let lockedCount = 0;
    if (req.isPro !== true) {
      const before = rows.length;
      data = rows.filter(
        (row) => !(row.slug && PRO_PROJECT_SLUGS.has(row.slug)),
      );
      lockedCount = before - data.length;
    }
    setTierCacheControl(req, res);
    res.json({ data, lockedCount });
  } catch (err) {
    next(err);
  }
});

router.get("/projects/:slug", async (req, res, next) => {
  try {
    const payload = await getOrCompute(
      cacheKey("content:projects-item", { slug: req.params.slug }),
      ITEM_TTL_SECONDS,
      async () => {
        const { data, error } = await supabaseAdmin
          .from("projects")
          .select("*")
          .eq("slug", req.params.slug)
          .eq("is_published", true)
          .single();

        if (error || !data) return null;
        return { data };
      },
    );

    if (!payload)
      return next(createError(404, "not_found", "Projeto não encontrado."));

    res.set("Cache-Control", PUBLIC_CACHE_CONTROL);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.get("/roadmaps", async (req, res, next) => {
  try {
    const { area } = req.query;
    const payload = await getOrCompute(
      cacheKey("content:roadmaps", { area }),
      LIST_TTL_SECONDS,
      async () => {
        let query = supabaseAdmin
          .from("roadmaps")
          .select(
            "id, slug, title, description, area_slug, level, estimated_duration_weeks, is_pro, sort_order",
          )
          .eq("is_published", true)
          .order("sort_order", { ascending: true });

        if (area) query = query.eq("area_slug", area);

        const { data, error } = await query;
        if (error)
          throw createError(500, "db_error", "Erro ao buscar roadmaps.");
        return { data: data || [] };
      },
    );

    res.set("Cache-Control", PUBLIC_CACHE_CONTROL);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.get("/roadmaps/:slug/progress", requireAuth, async (req, res, next) => {
  try {
    const { data: roadmap } = await supabaseAdmin
      .from("roadmaps")
      .select("id")
      .eq("slug", req.params.slug)
      .single();

    if (!roadmap)
      return next(createError(404, "not_found", "Roadmap não encontrado."));

    const { data, error } = await supabaseAdmin
      .from("user_roadmap_progress")
      .select("step_id, status, completed_at, notes")
      .eq("user_id", req.user!.id)
      .eq("roadmap_id", roadmap.id);

    if (error)
      return next(createError(500, "db_error", "Erro ao buscar progresso."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.post("/roadmaps/:slug/progress", requireAuth, async (req, res, next) => {
  try {
    const { step_id, status, notes } = req.body as Record<string, unknown>;

    if (!step_id)
      return next(
        createError(400, "invalid_request", "step_id é obrigatório."),
      );
    if (status && !["completed", "skipped"].includes(String(status))) {
      return next(createError(400, "invalid_request", "status inválido."));
    }

    const { data: roadmap } = await supabaseAdmin
      .from("roadmaps")
      .select("id")
      .eq("slug", req.params.slug)
      .single();
    if (!roadmap)
      return next(createError(404, "not_found", "Roadmap não encontrado."));

    if (status === null || status === undefined) {
      await supabaseAdmin
        .from("user_roadmap_progress")
        .delete()
        .eq("user_id", req.user!.id)
        .eq("step_id", step_id);
      return res.json({ data: { removed: true } });
    }

    const { data, error } = await supabaseAdmin
      .from("user_roadmap_progress")
      .upsert(
        {
          user_id: req.user!.id,
          roadmap_id: roadmap.id,
          step_id,
          status: status || "completed",
          completed_at: new Date().toISOString(),
          notes: notes || null,
        },
        { onConflict: "user_id,step_id" },
      )
      .select()
      .single();

    if (error)
      return next(createError(500, "db_error", "Erro ao salvar progresso."));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/roadmaps/:slug", async (req, res, next) => {
  try {
    const payload = await getOrCompute(
      cacheKey("content:roadmaps-item", { slug: req.params.slug }),
      ITEM_TTL_SECONDS,
      async () => {
        const { data: roadmap, error } = await supabaseAdmin
          .from("roadmaps")
          .select("*, roadmap_steps(*)")
          .eq("slug", req.params.slug)
          .eq("is_published", true)
          .order("order_index", {
            referencedTable: "roadmap_steps",
            ascending: true,
          })
          .single();

        if (error || !roadmap) return null;
        return { data: roadmap };
      },
    );

    if (!payload)
      return next(createError(404, "not_found", "Roadmap não encontrado."));

    res.set("Cache-Control", PUBLIC_CACHE_CONTROL);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.get("/sources/status", async (_req, res, next) => {
  try {
    const payload = await getOrCompute(
      cacheKey("content:sources-status"),
      LIST_TTL_SECONDS,
      async () => {
        const { data, error } = await supabaseAdmin
          .from("content_sources")
          .select("code, name, type, status, last_sync_at")
          .order("code");

        if (error)
          throw createError(
            500,
            "db_error",
            "Erro ao buscar status das fontes.",
          );
        return { data: data || [] };
      },
    );

    res.set("Cache-Control", DYNAMIC_CACHE_CONTROL);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.get("/news", async (req, res, next) => {
  try {
    // Clamp ANTES da chave de cache: valor fora da faixa normaliza pra mesma
    // entrada (limit invalido ou acima de 50 vira o default da rota).
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const rawLimit = parseInt(String(req.query.limit || "21"), 10);
    const limit =
      Number.isInteger(rawLimit) && rawLimit >= 1 && rawLimit <= 50
        ? rawLimit
        : 21;
    const level = req.query.level ? String(req.query.level) : "";
    const q = req.query.q ? String(req.query.q).trim() : "";

    const payload = await getOrCompute(
      cacheKey("content:news", { page, limit, level }),
      LIST_TTL_SECONDS,
      async () => {
        const cutoffISO = new Date(
          Date.now() - NEWS_FEED_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
        ).toISOString();

        let query = supabaseAdmin
          .from("news")
          .select(
            "id, slug, title, title_pt_br, summary, summary_pt_br, level, why_it_matters, url, image_url, source, author, published_at, tags, enriched_at",
            { count: "exact" },
          )
          .eq("is_published", true)
          .not("enriched_at", "is", null)
          .gte("published_at", cutoffISO);

        if (
          level &&
          ["iniciante", "intermediario", "avancado"].includes(level)
        ) {
          query = query.eq("level", level);
        }

        if (q) {
          const safe = q.replace(/[%,()]/g, " ");
          const term = `%${safe}%`;
          query = query.or(
            `title_pt_br.ilike.${term},summary_pt_br.ilike.${term},why_it_matters.ilike.${term}`,
          );
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query
          .order("published_at", { ascending: false, nullsFirst: false })
          .order("id", { ascending: false })
          .range(from, to);

        const { data, count, error } = await query;
        if (error)
          throw createError(500, "db_error", "Erro ao buscar notícias.");

        const total = count ?? 0;
        const total_pages = Math.max(1, Math.ceil(total / limit));

        return {
          data: data || [],
          pagination: {
            page,
            limit,
            total,
            total_pages,
            has_next: page < total_pages,
            has_prev: page > 1,
          },
        };
      },
      { bypass: Boolean(q) },
    );

    res.set("Cache-Control", DYNAMIC_CACHE_CONTROL);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

export default router;
