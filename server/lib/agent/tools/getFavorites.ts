import { supabaseAdmin } from "../../supabaseAdmin";
import type { AgentTool } from "../types";

// Teto de linhas para nao estourar o contexto. Ajustavel. // TODO: calibrar.
const MAX_RESULTS = 25;
const TITLE_PREVIEW_CHARS = 120;

interface BookmarkRow {
  resource_type: string;
  title_snapshot: string | null;
  url_snapshot: string | null;
}

export const getFavorites: AgentTool = {
  name: "get_favorites",
  tier: "pro",
  description:
    "Retorna os favoritos (bookmarks) do proprio usuario: tipo de recurso, titulo e link. Recurso do Plano Pro. A identidade vem do contexto seguro do servidor, nunca de argumentos.",
  parameters: {
    type: "object",
    properties: {
      resourceType: {
        type: "string",
        description:
          "Opcional. Filtra por tipo de recurso (por exemplo course, project, area). Filtro de conteudo, nunca identidade de usuario.",
      },
    },
    required: [],
    additionalProperties: false,
  },
  async execute(args, ctx) {
    // Recheck de tier DENTRO da tool (defesa em profundidade): nao confia que o
    // registry so a entregou para Pro. Se nao for Pro, recusa SEM tocar o banco.
    if (ctx.isPro !== true) {
      // TODO(Ana): mensagem de recurso Pro exposta via resposta do modelo.
      return JSON.stringify({ ok: false, message: "Este recurso e do Plano Pro." });
    }

    const resourceType =
      typeof args.resourceType === "string" ? args.resourceType.trim() : "";

    // Identidade SO do ctx.userId (JWT verificado). Filtra explicitamente por
    // user_id; supabaseAdmin usa service role e bypassa o RLS.
    let query = supabaseAdmin
      .from("user_bookmarks")
      .select("resource_type, title_snapshot, url_snapshot")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false })
      .limit(MAX_RESULTS);

    if (resourceType) {
      query = query.eq("resource_type", resourceType);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("[agent/get_favorites] query falhou:", error.message);
      // Erro NUNCA colapsa em vazio.
      // TODO(Ana): mensagem de falha de consulta exposta via resposta do modelo.
      return JSON.stringify({
        ok: false,
        message:
          "Nao foi possivel consultar os favoritos agora. Nao invente a lista; sugira tentar de novo.",
      });
    }

    const rows = (data ?? []) as BookmarkRow[];
    const items = rows.map((r) => ({
      resourceType: r.resource_type,
      title: r.title_snapshot
        ? r.title_snapshot.slice(0, TITLE_PREVIEW_CHARS)
        : null,
      url: r.url_snapshot,
    }));

    return JSON.stringify({ ok: true, data: items });
  },
};
