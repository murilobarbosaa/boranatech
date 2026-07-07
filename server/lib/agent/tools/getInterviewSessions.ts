import { supabaseAdmin } from "../../supabaseAdmin";
import type { AgentTool } from "../types";

const MAX_SESSIONS = 5;

interface SessionRow {
  kind: string | null;
  area: string | null;
  level: string | null;
  status: string | null;
  question_count: number | null;
  good_count: number | null;
  verdict: { result?: unknown } | null;
  created_at: string | null;
}

export const getInterviewSessions: AgentTool = {
  name: "get_interview_sessions",
  tier: "pro",
  description:
    "Retorna as ultimas 5 sessoes de entrevista simulada do proprio usuario (tipo vaga ou geral, area, nivel, status, respostas boas sobre avaliadas e veredito). Os resultados ficam salvos, entao retorna dados de fato. Recurso do Plano Pro. A identidade vem do contexto seguro do servidor, nunca de argumentos.",
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
      .from("interview_sessions")
      .select("kind, area, level, status, question_count, good_count, verdict, created_at")
      .eq("user_id", ctx.userId)
      .order("updated_at", { ascending: false })
      .limit(MAX_SESSIONS);

    if (error) {
      console.warn("[agent/get_interview_sessions] query falhou:", error.message);
      // Erro NUNCA colapsa em vazio: {ok:false} e distinto de lista vazia.
      // TODO(Ana): mensagem de falha de consulta exposta via resposta do modelo.
      return JSON.stringify({
        ok: false,
        message:
          "Nao foi possivel consultar as entrevistas simuladas agora. Nao invente; sugira tentar de novo.",
      });
    }

    const rows = (data ?? []) as SessionRow[];
    // Lista vazia e resultado valido: a pessoa nunca fez entrevista simulada.
    return JSON.stringify({
      ok: true,
      data: rows.map((row) => ({
        tipo: row.kind === "job" ? "vaga" : "geral",
        area: row.area,
        nivel: row.level,
        status: row.status,
        respostasBoas: row.good_count ?? 0,
        respostasAvaliadas: row.question_count ?? 0,
        veredito:
          row.verdict && typeof row.verdict.result === "string"
            ? row.verdict.result
            : null,
        data: row.created_at ? row.created_at.slice(0, 10) : null,
      })),
    });
  },
};
