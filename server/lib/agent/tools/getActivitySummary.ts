import { supabaseAdmin } from "../../supabaseAdmin";
import type { AgentTool } from "../types";

// Teto de linhas lidas. O retorno ao modelo e o resumo agrupado (poucas linhas),
// nao as linhas cruas. Ajustavel. // TODO: calibrar.
const MAX_ROWS = 500;
// Uso do proprio chat nao e sinal de feature de carreira: fica fora do resumo.
const EXCLUDED_TOOL = "agent-chat";

interface UsageRow {
  tool: string;
  created_at: string;
}

export const getActivitySummary: AgentTool = {
  name: "get_activity_summary",
  tier: "pro",
  description:
    "Retorna o RASTRO de uso de ferramentas do proprio usuario: para cada ferramenta ja usada com sucesso, qual e a data de uso mais recente. NAO retorna o resultado das ferramentas (a maioria nao guarda resultado), apenas se e quando foram usadas. Recurso do Plano Pro. A identidade vem do contexto seguro do servidor, nunca de argumentos.",
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
    // user_id; supabaseAdmin usa service role e bypassa o RLS. So contamos uso
    // bem-sucedido (status = success) e excluimos o proprio chat do agente.
    const { data, error } = await supabaseAdmin
      .from("ai_usage_logs")
      .select("tool, created_at")
      .eq("user_id", ctx.userId)
      .eq("status", "success")
      .neq("tool", EXCLUDED_TOOL)
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS);

    if (error) {
      console.warn("[agent/get_activity_summary] query falhou:", error.message);
      // Erro NUNCA colapsa em vazio.
      // TODO(Ana): mensagem de falha de consulta exposta via resposta do modelo.
      return JSON.stringify({
        ok: false,
        message:
          "Nao foi possivel consultar a atividade agora. Nao invente o historico; sugira tentar de novo.",
      });
    }

    const rows = (data ?? []) as UsageRow[];
    // Linhas vem ordenadas por created_at desc, entao a PRIMEIRA ocorrencia de
    // cada tool ja e a mais recente. Reduz a um uso mais recente por ferramenta.
    const lastByTool = new Map<string, string>();
    for (const row of rows) {
      if (!lastByTool.has(row.tool)) {
        lastByTool.set(row.tool, row.created_at);
      }
    }

    const usedTools = Array.from(lastByTool, ([tool, ts]) => ({
      tool,
      lastUsed: ts.slice(0, 10),
    }));

    // Vazio e legitimo: a pessoa ainda nao usou nenhuma ferramenta de carreira.
    return JSON.stringify({ ok: true, data: { usedTools } });
  },
};
