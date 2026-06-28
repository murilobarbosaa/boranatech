import { findRoute } from "../platformKnowledge";
import type { AgentTool } from "../types";

export const suggestNavigation: AgentTool = {
  name: "suggest_navigation",
  tier: "free",
  description:
    "Valida uma rota interna do BoraNaTech contra o mapa de rotas e retorna o caminho e um rotulo. Use para apontar o usuario a uma pagina existente, inclusive /planos nos CTAs do Pro. So aceita rotas conhecidas; nunca invente caminhos.",
  parameters: {
    type: "object",
    properties: {
      route: {
        type: "string",
        description:
          "Caminho interno comecando com '/', por exemplo '/cursos' ou '/planos'. Precisa existir no mapa de rotas.",
      },
    },
    required: ["route"],
    additionalProperties: false,
  },
  async execute(args) {
    const route = typeof args.route === "string" ? args.route.trim() : "";
    const match = findRoute(route);

    if (!match) {
      // TODO(Ana): texto de rota desconhecida exposto via resposta do modelo.
      return JSON.stringify({
        ok: false,
        message: `A rota "${route}" nao existe no mapa do BoraNaTech. Nao sugira esse caminho.`,
      });
    }

    return JSON.stringify({
      ok: true,
      route: match.route,
      label: match.label,
      tier: match.tier,
    });
  },
};
