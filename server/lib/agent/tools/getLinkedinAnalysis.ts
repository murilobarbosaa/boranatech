import { supabaseAdmin } from "../../supabaseAdmin";
import type { AgentTool } from "../types";

// O result e o jsonb completo persistido pela rota de analise; aqui so os
// campos consumidos pelo resumo do agente, tudo opcional (linhas antigas
// podem ter shapes anteriores).
interface LinkedinRow {
  area: string | null;
  level: string | null;
  score: number | null;
  faixa: string | null;
  created_at: string | null;
  result: {
    qualitative?: {
      melhorias?: Array<{ prioridade?: unknown; titulo?: unknown }>;
      proximoPasso?: unknown;
    };
  } | null;
}

export const getLinkedinAnalysis: AgentTool = {
  name: "get_linkedin_analysis",
  tier: "pro",
  description:
    "Retorna a analise de LinkedIn mais recente do proprio usuario: area, nivel, nota, faixa, data, as melhorias sugeridas (titulo e prioridade) e o proximo passo de maior impacto. Esta e a unica ferramenta cujo resultado fica salvo, entao retorna o resultado de fato. Recurso do Plano Pro. A identidade vem do contexto seguro do servidor, nunca de argumentos.",
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
      return JSON.stringify({
        ok: false,
        message: "Este recurso e do Plano Pro.",
      });
    }

    // Identidade SO do ctx.userId (JWT verificado). Filtra explicitamente por
    // user_id; supabaseAdmin usa service role e bypassa o RLS.
    const { data, error } = await supabaseAdmin
      .from("linkedin_analyses")
      .select("area, level, score, faixa, created_at, result")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn(
        "[agent/get_linkedin_analysis] query falhou:",
        error.message,
      );
      // Erro NUNCA colapsa em vazio: {ok:false} e distinto de {ok:true,data:null}.
      // TODO(Ana): mensagem de falha de consulta exposta via resposta do modelo.
      return JSON.stringify({
        ok: false,
        message:
          "Nao foi possivel consultar a analise de LinkedIn agora. Nao invente; sugira tentar de novo.",
      });
    }

    if (!data) {
      // Sem analise: vazio legitimo, distinto de erro.
      return JSON.stringify({ ok: true, data: null });
    }

    const row = data as LinkedinRow;
    // Resumo do result jsonb: so melhorias com titulo string e o proximoPasso
    // quando existir (shapes antigos degradam pra lista vazia/null, nunca
    // inventam conteudo).
    const qualitative = row.result?.qualitative;
    const melhorias = Array.isArray(qualitative?.melhorias)
      ? qualitative.melhorias
          .filter(
            (item): item is { titulo: string; prioridade?: unknown } =>
              typeof item?.titulo === "string",
          )
          .map((item) => ({
            titulo: item.titulo,
            prioridade:
              typeof item.prioridade === "string" ? item.prioridade : null,
          }))
      : [];
    return JSON.stringify({
      ok: true,
      data: {
        area: row.area,
        nivel: row.level,
        score: row.score,
        faixa: row.faixa,
        data: row.created_at ? row.created_at.slice(0, 10) : null,
        melhorias,
        proximoPasso:
          typeof qualitative?.proximoPasso === "string"
            ? qualitative.proximoPasso
            : null,
      },
    });
  },
};
