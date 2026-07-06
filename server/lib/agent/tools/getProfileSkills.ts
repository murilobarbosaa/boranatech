import { supabaseAdmin } from "../../supabaseAdmin";
import type { AgentTool } from "../types";

// Teto de linhas para nao estourar o contexto. Ajustavel. // TODO: calibrar.
const MAX_RESULTS = 50;

interface SkillRow {
  kind: string;
  label: string;
  level: string;
}

export const getProfileSkills: AgentTool = {
  name: "get_profile_skills",
  tier: "pro",
  description:
    "Retorna as skills declaradas pelo proprio usuario: tipo (tecnologia ou area), nome e nivel (aprendendo, uso, domino). Recurso do Plano Pro. A identidade vem do contexto seguro do servidor, nunca de argumentos.",
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
      .from("profile_skills")
      .select("kind, label, level")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false })
      .limit(MAX_RESULTS);

    if (error) {
      console.warn("[agent/get_profile_skills] query falhou:", error.message);
      // Erro NUNCA colapsa em vazio.
      // TODO(Ana): mensagem de falha de consulta exposta via resposta do modelo.
      return JSON.stringify({
        ok: false,
        message:
          "Nao foi possivel consultar as skills agora. Nao invente; sugira tentar de novo.",
      });
    }

    const rows = (data ?? []) as SkillRow[];
    // Vazio e legitimo: a pessoa ainda nao marcou skills (o agente pode sugerir).
    const items = rows.map((r) => ({
      kind: r.kind,
      label: r.label,
      level: r.level,
    }));

    return JSON.stringify({ ok: true, data: items });
  },
};
