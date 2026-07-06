import { matchRoute } from "../platformKnowledge";
import type { AgentTool } from "../types";

export const suggestNavigation: AgentTool = {
  name: "suggest_navigation",
  tier: "free",
  description:
    "Valida uma rota interna do BoraNaTech contra o mapa de rotas e retorna o caminho e um rotulo. Use para apontar o usuario a uma pagina existente, inclusive /planos nos CTAs do Pro. Aceita rotas exatas do mapa e caminhos com slug quando a base e conhecida (por exemplo /areas/frontend), mas casar com o padrao NAO garante que o slug existe: quando o conteudo do slug nao foi confirmado por search_platform_content, prefira indicar a pagina indice (por exemplo /areas). So aceita rotas conhecidas; nunca invente caminhos.",
  parameters: {
    type: "object",
    properties: {
      route: {
        type: "string",
        description:
          "Caminho interno comecando com '/', por exemplo '/cursos', '/planos' ou '/areas/frontend'. Precisa existir no mapa de rotas ou casar com um padrao conhecido de detalhe por slug.",
      },
    },
    required: ["route"],
    additionalProperties: false,
  },
  async execute(args) {
    const route = typeof args.route === "string" ? args.route.trim() : "";
    const match = matchRoute(route);

    if (!match) {
      // TODO(Ana): texto de rota desconhecida exposto via resposta do modelo.
      return JSON.stringify({
        ok: false,
        message: `A rota "${route}" nao existe no mapa do BoraNaTech. Nao sugira esse caminho.`,
      });
    }

    if (match.kind === "pattern") {
      // TODO(Ana): texto da nota de slug nao verificado exposto via resposta do modelo.
      return JSON.stringify({
        ok: true,
        route: match.route,
        label: match.label,
        tier: match.tier,
        note:
          "Caminho aceito pelo padrao de rotas, mas a existencia do conteudo deste slug nao foi verificada. Se a busca nao confirmou esse conteudo, prefira indicar a pagina indice.",
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
