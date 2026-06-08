import OpenAI from "openai";
import { env } from "./env";

const openai = new OpenAI({ apiKey: env.openaiApiKey });

const VALID_LEVELS = ["iniciante", "intermediario", "avancado"] as const;
type Level = (typeof VALID_LEVELS)[number];

export interface ArticleEnrichment {
  title_pt_br: string;
  summary_pt_br: string;
  level: Level;
  why_it_matters: string;
}

const SYSTEM_PROMPT = `Você é um curador de conteúdo para uma plataforma brasileira de orientação de carreira em TI (BoraNaTech). Seu público é predominantemente iniciantes (15-30 anos) explorando carreiras em tecnologia.

Sua tarefa é receber um artigo em inglês e retornar JSON com 4 campos:
1. title_pt_br: título traduzido para PT-BR fluente, natural
2. summary_pt_br: resumo (1-2 frases) em PT-BR fluente, explicando o essencial
3. level: classificação do nível técnico para entender ('iniciante', 'intermediario', 'avancado')
4. why_it_matters: 1 frase explicando POR QUE essa notícia específica importa para alguém iniciando na área de TI no Brasil

Regras estritas:
- PT-BR brasileiro, não Português europeu (use "você" e não "tu", "celular" e não "telemóvel", etc)
- Tradução natural, não literal
- why_it_matters deve ser ESPECÍFICO para o conteúdo do artigo, NÃO genérico
- Retorne APENAS JSON válido, sem texto antes ou depois`;

export async function enrichArticle(
  title: string,
  summary: string,
): Promise<ArticleEnrichment | null> {
  if (!env.openaiApiKey) {
    console.warn("[aiEnrich] OPENAI_API_KEY não configurada, pulando");
    return null;
  }

  const userPrompt = `Título original: ${title}

Resumo original: ${summary}

Retorne JSON conforme especificado.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as Partial<ArticleEnrichment>;

    if (
      typeof parsed.title_pt_br !== "string" ||
      typeof parsed.summary_pt_br !== "string" ||
      typeof parsed.level !== "string" ||
      typeof parsed.why_it_matters !== "string"
    ) {
      console.warn("[aiEnrich] missing required fields:", parsed);
      return null;
    }

    let level = parsed.level as Level;
    if (!VALID_LEVELS.includes(level)) {
      console.warn(
        "[aiEnrich] invalid level, defaulting to intermediario:",
        parsed.level,
      );
      level = "intermediario";
    }

    return {
      title_pt_br: parsed.title_pt_br,
      summary_pt_br: parsed.summary_pt_br,
      level,
      why_it_matters: parsed.why_it_matters,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[aiEnrich] failed:", message);
    return null;
  }
}
