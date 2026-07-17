import { supabaseAdmin } from "../../supabaseAdmin";
import type { AgentTool } from "../types";

// Top N de resultados retornados ao modelo. Ajustavel. // TODO: calibrar.
const MAX_RESULTS = 6;
const DESCRIPTION_PREVIEW_CHARS = 200;

interface SearchRow {
  resource_type: string;
  title: string;
  url: string | null;
  description: string | null;
}

export const searchPlatformContent: AgentTool = {
  name: "search_platform_content",
  tier: "free",
  description:
    "Busca conteudo publico e publicado da plataforma BoraNaTech (areas, tecnologias, cursos, roadmaps, projetos, noticias, eventos, vagas, plataformas). Use para responder 'onde encontro X' e citar paginas reais. Nao retorna nenhum dado pessoal do usuario.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Termo de busca em portugues, com pelo menos 2 caracteres.",
      },
      resourceType: {
        type: "string",
        description:
          "Opcional. Filtra por tipo de recurso, por exemplo: course, area, roadmap, project, news, event, platform.",
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
  async execute(args) {
    const query = typeof args.query === "string" ? args.query.trim() : "";
    const resourceType =
      typeof args.resourceType === "string" ? args.resourceType.trim() : "";

    if (query.length < 2) {
      // TODO(Ana): texto de retorno para busca com termo curto demais.
      return "A busca precisa de pelo menos 2 caracteres. Peca um termo mais especifico ao usuario.";
    }

    let dbQuery = supabaseAdmin
      .from("search_documents")
      .select("resource_type, title, url, description")
      // Defesa em profundidade: filtra is_published explicitamente. supabaseAdmin
      // usa service role e bypassa o RLS, entao nao confiamos so na policy.
      .eq("is_published", true)
      .textSearch("search_vector", query, {
        type: "websearch",
        config: "portuguese",
      })
      .limit(MAX_RESULTS);

    if (resourceType) {
      dbQuery = dbQuery.eq("resource_type", resourceType);
    }

    const { data, error } = await dbQuery;

    if (error) {
      // Falha de execucao da tool. O modelo NAO pode inventar resultado: devolve
      // um sinal claro para ele avisar a falha e sugerir tentar de novo.
      // TODO(Ana): texto de falha de busca exposto via resposta do modelo.
      return JSON.stringify({
        ok: false,
        message:
          "A busca de conteudo falhou agora. Nao foi possivel recuperar resultados. Nao invente paginas; avise que houve falha e sugira tentar de novo.",
      });
    }

    let rows = (data ?? []) as SearchRow[];

    if (rows.length === 0) {
      // Fallback ilike sobre titulo e descricao quando a full-text nao casa:
      // full-text vazio pode ser stemming ou erro de digitacao. Mesmos filtros
      // (is_published = true, mesmo teto). Erro do fallback nao vira falha da
      // tool: o full-text ja respondeu, entao segue como vazio legitimo.
      // Sanitiza o termo para a sintaxe or() do PostgREST (virgula e parenteses
      // separariam condicoes).
      const likeTerm = query.replace(/[,()"]/g, " ").trim();
      if (likeTerm.length >= 2) {
        let fallbackQuery = supabaseAdmin
          .from("search_documents")
          .select("resource_type, title, url, description")
          .eq("is_published", true)
          .or(`title.ilike.%${likeTerm}%,description.ilike.%${likeTerm}%`)
          .limit(MAX_RESULTS);

        if (resourceType) {
          fallbackQuery = fallbackQuery.eq("resource_type", resourceType);
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) {
          console.warn(
            "[agent/search_platform_content] fallback ilike falhou:",
            fallbackError.message,
          );
        } else {
          rows = (fallbackData ?? []) as SearchRow[];
        }
      }
    }
    if (rows.length === 0) {
      // TODO(Ana): texto de busca sem resultados.
      return JSON.stringify({
        ok: true,
        results: [],
        message: `Nenhum conteudo publicado encontrado para "${query}".`,
      });
    }

    const results = rows.map((r) => ({
      title: r.title,
      resourceType: r.resource_type,
      url: r.url,
      description: r.description
        ? r.description.slice(0, DESCRIPTION_PREVIEW_CHARS)
        : null,
    }));

    return JSON.stringify({ ok: true, results });
  },
};
