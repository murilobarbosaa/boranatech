import { supabaseAdmin } from "../../supabaseAdmin";
import type { AgentTool } from "../types";

interface QuizResultRow {
  result_area: string | null;
  result_area_slug: string | null;
  level: string | null;
  confidence: number | null;
  completed_at: string | null;
}

export const getQuizResult: AgentTool = {
  name: "get_quiz_result",
  tier: "pro",
  description:
    "Retorna o resultado do quiz de carreira mais recente concluido pelo proprio usuario (area, nivel, confianca, data). Recurso do Plano Pro. Nao recebe parametros: a identidade do usuario vem do contexto seguro do servidor, nunca de argumentos.",
  parameters: {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: false,
  },
  async execute(_args, ctx) {
    // Recheck de tier DENTRO da tool (defesa em profundidade): nao confia que o
    // registry so a entregou para Pro. Se nao for Pro, recusa SEM tocar o banco.
    // O incidente de all-accounts-Pro e o motivo deste recheck.
    if (ctx.isPro !== true) {
      // TODO(Ana): mensagem de recurso Pro exposta via resposta do modelo.
      return JSON.stringify({
        ok: false,
        message: "Este recurso e do Plano Pro.",
      });
    }

    // Identidade vem SO do ctx (JWT verificado). Argumentos do modelo sao
    // ignorados de proposito; nenhum user_id pode vir do modelo. Filtra
    // explicitamente por user_id = ctx.userId (service role bypassa o RLS).
    const { data, error } = await supabaseAdmin
      .from("career_quiz_attempts")
      .select("result_area, result_area_slug, level, confidence, completed_at")
      .eq("user_id", ctx.userId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("[agent/get_quiz_result] query falhou:", error.message);
      // Erro NUNCA colapsa em vazio: {ok:false} e distinto de {ok:true,data:null}.
      // TODO(Ana): mensagem de falha de consulta exposta via resposta do modelo.
      return JSON.stringify({
        ok: false,
        message:
          "Nao foi possivel consultar o quiz agora. Nao invente o resultado; sugira tentar de novo.",
      });
    }

    if (!data) {
      // Sem quiz concluido: vazio legitimo, distinto de erro.
      return JSON.stringify({ ok: true, data: null });
    }

    const row = data as QuizResultRow;
    return JSON.stringify({
      ok: true,
      data: {
        area: row.result_area,
        areaSlug: row.result_area_slug,
        nivel: row.level,
        confidence: row.confidence,
        data: row.completed_at ? row.completed_at.slice(0, 10) : null,
      },
    });
  },
};
