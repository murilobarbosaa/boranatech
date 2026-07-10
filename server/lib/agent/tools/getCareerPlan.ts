import { getCatalogItem } from "../../../../shared/careerCatalog";
import { supabaseAdmin } from "../../supabaseAdmin";
import type { AgentTool } from "../types";

interface PlanRow {
  id: string;
  intake: {
    goal?: unknown;
    area?: unknown;
    level?: unknown;
    hoursPerWeek?: unknown;
    horizonMonths?: unknown;
    budget?: unknown;
  } | null;
  result: {
    steps?: Array<{ id?: unknown; title?: unknown }>;
    certifications?: Array<{ catalogId?: unknown; optional?: unknown }>;
    checklist?: unknown;
  } | null;
  catalog_version: string | null;
  created_at: string | null;
}

export const getCareerPlan: AgentTool = {
  name: "get_career_plan",
  tier: "pro",
  description:
    "Retorna o plano de carreira ATIVO do proprio usuario (objetivo e restricoes do intake, degraus, certificacoes do catalogo e progresso do checklist). O plano fica salvo, entao retorna dados de fato; sem plano ativo, retorna vazio. Recurso do Plano Pro. A identidade vem do contexto seguro do servidor, nunca de argumentos.",
  parameters: {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: false,
  },
  async execute(_args, ctx) {
    // Recheck de tier DENTRO da tool (defesa em profundidade): nao confia que o
    // registry so a entregou para Pro. Se nao for Pro, recusa SEM tocar o banco.
    if (ctx.isPro !== true) {
      // TODO(Ana): mensagem de recurso Pro exposta via resposta do modelo.
      return JSON.stringify({ ok: false, message: "Este recurso e do Plano Pro." });
    }

    // Identidade SO do ctx.userId (JWT verificado). Filtra explicitamente por
    // user_id; supabaseAdmin usa service role e bypassa o RLS.
    const { data, error } = await supabaseAdmin
      .from("career_plans")
      .select("id, intake, result, catalog_version, created_at")
      .eq("user_id", ctx.userId)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("[agent/get_career_plan] query falhou:", error.message);
      // Erro NUNCA colapsa em "sem plano": {ok:false} e distinto de data null.
      // TODO(Ana): mensagem de falha de consulta exposta via resposta do modelo.
      return JSON.stringify({
        ok: false,
        message:
          "Nao foi possivel consultar o plano de carreira agora. Nao invente; sugira tentar de novo.",
      });
    }

    if (!data) {
      // Sem plano ativo: vazio legitimo, distinto de erro. O modelo deve dizer
      // que nao ha plano e sugerir criar um em /plano-carreira.
      return JSON.stringify({ ok: true, data: null });
    }

    const row = data as PlanRow;
    const checklist = Array.isArray(row.result?.checklist)
      ? row.result.checklist
      : [];

    // Contagem do progresso em query separada: erro aqui NAO derruba a tool,
    // mas checklistDone fica null (progresso indisponivel), NUNCA 0.
    let checklistDone: number | null = null;
    try {
      const { count, error: progressError } = await supabaseAdmin
        .from("user_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ctx.userId)
        .eq("context", "career_plan")
        .like("item_key", `${row.id}:%`)
        .contains("state", { checked: true });
      if (!progressError && typeof count === "number") {
        checklistDone = count;
      } else if (progressError) {
        console.warn(
          "[agent/get_career_plan] contagem do checklist falhou:",
          progressError.message,
        );
      }
    } catch (err) {
      console.warn("[agent/get_career_plan] contagem do checklist lancou:", err);
    }

    const steps = Array.isArray(row.result?.steps)
      ? row.result.steps.map((step) => ({
          id: typeof step.id === "string" ? step.id : null,
          titulo: typeof step.title === "string" ? step.title : null,
        }))
      : [];

    const certifications = Array.isArray(row.result?.certifications)
      ? row.result.certifications.map((cert) => {
          const catalogId =
            typeof cert.catalogId === "string" ? cert.catalogId : "";
          const item = catalogId ? getCatalogItem(catalogId) : null;
          return {
            catalogId: catalogId || null,
            nome: item?.name ?? catalogId ?? null,
            opcional: cert.optional === true,
          };
        })
      : [];

    return JSON.stringify({
      ok: true,
      data: {
        intake: {
          objetivo: typeof row.intake?.goal === "string" ? row.intake.goal : null,
          area: typeof row.intake?.area === "string" ? row.intake.area : null,
          nivel: typeof row.intake?.level === "string" ? row.intake.level : null,
          horasPorSemana:
            typeof row.intake?.hoursPerWeek === "number"
              ? row.intake.hoursPerWeek
              : null,
          horizonteMeses:
            typeof row.intake?.horizonMonths === "number"
              ? row.intake.horizonMonths
              : null,
          orcamento:
            typeof row.intake?.budget === "string" ? row.intake.budget : null,
        },
        degraus: steps,
        certificacoes: certifications,
        checklistTotal: checklist.length,
        // null = progresso indisponivel no momento (nunca invente 0).
        checklistDone,
        catalogVersion: row.catalog_version,
        criadoEm: row.created_at ? row.created_at.slice(0, 10) : null,
      },
    });
  },
};
