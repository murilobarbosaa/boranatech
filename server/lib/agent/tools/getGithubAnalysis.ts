import { supabaseAdmin } from "../../supabaseAdmin";
import type { AgentTool } from "../types";

interface GithubRow {
  area: string | null;
  level: string | null;
  score: number | null;
  faixa: string | null;
  created_at: string | null;
}

export const getGithubAnalysis: AgentTool = {
  name: "get_github_analysis",
  tier: "pro",
  description:
    "Retorna a analise de GitHub mais recente do proprio usuario (area, nota, faixa, data). O resultado fica salvo, entao retorna o resultado de fato. Recurso do Plano Pro. A identidade do usuario vem do contexto seguro do servidor, nunca de argumentos.",
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
      .from("github_analyses")
      .select("area, level, score, faixa, created_at")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("[agent/get_github_analysis] query falhou:", error.message);
      // Erro NUNCA colapsa em vazio: {ok:false} e distinto de {ok:true,data:null}.
      // TODO(Ana): mensagem de falha de consulta exposta via resposta do modelo.
      return JSON.stringify({
        ok: false,
        message:
          "Nao foi possivel consultar a analise de GitHub agora. Nao invente; sugira tentar de novo.",
      });
    }

    if (!data) {
      // Sem analise: vazio legitimo, distinto de erro.
      return JSON.stringify({ ok: true, data: null });
    }

    const row = data as GithubRow;
    return JSON.stringify({
      ok: true,
      data: {
        area: row.area,
        nivel: row.level,
        score: row.score,
        faixa: row.faixa,
        data: row.created_at ? row.created_at.slice(0, 10) : null,
      },
    });
  },
};
