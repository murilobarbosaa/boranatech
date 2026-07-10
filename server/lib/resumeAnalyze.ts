import {
  ResumeAnalysisModelSchema,
  type ResumeAnalysisModel,
  type ResumeAnalyzeRequest,
  type ResumeScoreResult,
} from "../../shared/resumeAnalysis/schema";
import { env } from "./env";
import { fetchWithTimeout } from "./http";
import { buildOpenAIHeaders, DEFAULT_MODEL, OPENAI_BASE_URL } from "./openai";
import { toOpenAIStrictSchema } from "./openaiStrictSchema";

// Parte qualitativa do Analisador de Curriculo, no molde EXATO de
// linkedinAnalyze.ts: a nota e DETERMINISTICA (computeResumeScore, em
// shared/resumeAnalysis/schema.ts) e chega aqui como FATO; a IA recebe o
// breakdown para comentar o porque da nota, nunca para recalcula-la.

const AI_MAX_ATTEMPTS = 3;
const AI_BACKOFF_MS = [400, 800];
// Teto de saida da analise. Ajustavel. // TODO: calibrar.
const MAX_TOKENS = 3000;
const AI_TEMPERATURE = 0.5;

const ANALYSIS_JSON_SCHEMA = toOpenAIStrictSchema(ResumeAnalysisModelSchema);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// TODO(Ana): revisar toda a copy do prompt do avaliador de curriculo.
const SYSTEM_PROMPT = `Voce e um avaliador senior de curriculos para carreiras de tecnologia no Brasil, mentor da plataforma BoraNaTech. Seu publico e iniciante: estagiarios, juniores e pessoas em transicao de carreira. Seu trabalho e diagnosticar o curriculo com honestidade e devolver sugestoes construtivas e acionaveis.

REGRA DOS FATOS: a nota e o detalhamento por criterio que voce vai receber ja foram calculados de forma deterministica e sao fatos. Voce nao recalcula, nao contradiz e nao inventa nota; seu papel e explicar em linguagem humana o que a nota reflete e como melhorar cada ponto. Nunca invente informacoes que nao estao no curriculo: se algo nao esta la, voce pode apontar a ausencia, mas nao pode afirmar que a pessoa tem aquela experiencia ou habilidade. E o inverso tambem: NUNCA aponte como ausente uma informacao que esta presente no texto; antes de dizer que falta uma secao ou um dado, confira se ele nao aparece com outro nome ou em outro idioma (ex: Goal em vez de Objetivo, Work Experience em vez de Experiencia).

IDIOMA DA RESPOSTA: detecte o idioma do curriculo enviado e escreva TODO o qualitativo (resumo, pontos, diagnosticos, sugestoes de reescrita) nesse MESMO idioma. Curriculo em ingles recebe analise em ingles; em portugues, analise em portugues do Brasil.

CURADORIA: avalie tambem a curadoria do documento: excesso de bullets genericos dilui as conquistas (menos bullets, mais fortes); o teto pratico e de 2 paginas; secoes separadas de Responsibilities e Achievements funcionam melhor fundidas em bullets de conquista (acao + resultado).

EMPREGOS SIMULTANEOS: se houver mais de um emprego marcado como atual (Present, Atual) sem rotulo de freela, part-time ou contrato, sinalize como ponto a esclarecer para o recrutador, nao como erro.

SUGESTOES POR SECAO: para cada secao com problema real, entregue um diagnostico curto e uma sugestao de reescrita pronta para copiar e colar, na primeira pessoa quando for texto do curriculo, usando SOMENTE fatos presentes no curriculo enviado.

ADERENCIA A VAGA: preencha aderenciaVaga SOMENTE quando o input trouxer o texto de uma vaga. Sem vaga no input, devolva aderenciaVaga como null, nunca invente uma vaga.

TOM: direto, encorajador e concreto, nunca condescendente. Uma pessoa iniciante precisa sair sabendo exatamente o que fazer.

ESTILO: no idioma do curriculo (ver IDIOMA DA RESPOSTA). Proibido travessao e meia-risca, use ponto, virgula ou parenteses. Sem emojis.

Responda apenas com o JSON do schema.`;

function buildUserPrompt(
  request: ResumeAnalyzeRequest,
  score: ResumeScoreResult,
): string {
  const lines: string[] = [];
  lines.push(
    `NOTA DETERMINISTICA (fato, nao recalcular): ${score.score} de 100, faixa ${score.faixa}.`,
  );
  lines.push("Detalhamento por criterio:");
  for (const criterio of score.criterios) {
    lines.push(
      `- ${criterio.label}: ${criterio.achieved} de ${criterio.weight} pontos. ${criterio.detail}`,
    );
  }
  if (request.targetRole) {
    lines.push(`\nCargo alvo informado: ${request.targetRole}`);
  }
  if (request.jobPostingText) {
    lines.push(`\nVAGA ALVO (para a secao aderenciaVaga):\n${request.jobPostingText}`);
  } else {
    lines.push("\nSem vaga no input: aderenciaVaga deve ser null.");
  }
  lines.push(`\nCURRICULO ENVIADO:\n${request.resumeText}`);
  return lines.join("\n");
}

export interface ResumeAiIo {
  inputChars: number;
  outputChars: number;
}

async function runQualitativeOnce(
  userText: string,
  onAiIo?: (io: ResumeAiIo) => void,
): Promise<ResumeAnalysisModel> {
  const response = await fetchWithTimeout(
    OPENAI_BASE_URL,
    {
      method: "POST",
      headers: buildOpenAIHeaders(env.openaiApiKey),
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: AI_TEMPERATURE,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userText },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "resume_analysis",
            strict: true,
            schema: ANALYSIS_JSON_SCHEMA,
          },
        },
      }),
    },
    { service: "openai", timeoutMs: 60_000 },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `OpenAI respondeu ${response.status}: ${text.slice(0, 300)}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("A IA nao retornou conteudo.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Resposta da IA nao veio em JSON valido: ${detail}.`);
  }

  const validation = ResumeAnalysisModelSchema.safeParse(parsed);
  if (!validation.success) {
    const issues = JSON.stringify(validation.error.issues).slice(0, 300);
    throw new Error(
      `Resposta da IA nao bateu com o schema esperado: ${issues}`,
    );
  }

  onAiIo?.({ inputChars: userText.length, outputChars: content.length });
  return validation.data;
}

export async function runResumeQualitative(
  request: ResumeAnalyzeRequest,
  score: ResumeScoreResult,
  onAiIo?: (io: ResumeAiIo) => void,
): Promise<ResumeAnalysisModel> {
  if (!env.openaiApiKey) {
    throw new Error("Servico de IA nao configurado.");
  }

  const userText = buildUserPrompt(request, score);
  let lastError: unknown;
  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await runQualitativeOnce(userText, onAiIo);
    } catch (err) {
      lastError = err;
      const detail = err instanceof Error ? err.message : String(err);
      console.error(
        `[resume-analyze] IA tentativa ${attempt}/${AI_MAX_ATTEMPTS} falhou: ${detail}`,
      );
      if (attempt < AI_MAX_ATTEMPTS) {
        await sleep(AI_BACKOFF_MS[attempt - 1] ?? 800);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Falha ao gerar a analise da IA.");
}
