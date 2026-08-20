import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { vi } from "vitest";

import type { AreaSlug } from "../../../../../shared/areas";
import type {
  LinkedinAnalyzeRequest,
  LinkedinLevel,
  Mercado,
} from "../../../../../shared/linkedin/schema";
import * as http from "../../../http";
import { analyzeLinkedin, type AnalyzeAiIo } from "../../../linkedinAnalyze";

/**
 * HARNESS DO GOLDEN QUALITATIVO (Fase 2, lote 7).
 *
 * Ele NÃO afirma nada: ele GRAVA. Roda o pipeline qualitativo real de ponta a
 * ponta (perfil, prompt, resposta congelada, schema, gates, retry contextual,
 * lastro, fallback, contabilização) e devolve um objeto com tudo o que a fase
 * decidiu ao longo de sete lotes. Quem afirma é `linkedinGoldenQualitativo.
 * test.ts`, comparando com o arquivo JSON de cada cenário.
 *
 * PROTOCOLO DE ATUALIZAÇÃO, e ele não é decorativo:
 *
 *   1. golden que quebra significa que o COMPORTAMENTO mudou. A primeira
 *      pergunta é sempre "essa mudança era intencional?", nunca "como faço o
 *      teste passar";
 *   2. atualizar um golden para calar um teste é PROIBIDO. O diff do JSON tem
 *      de ser lido linha a linha e justificado na conversa do projeto ANTES do
 *      commit que o atualiza;
 *   3. o commit que atualiza um golden não pode conter mais nada além dele e da
 *      mudança de comportamento que o causou.
 *
 * Para regravar depois de uma mudança aprovada:
 *   GOLDEN_QUALITATIVO_WRITE=1 npx vitest run server/lib/linkedinGoldenQualitativo.test.ts
 *   npx prettier --write "server/lib/__fixtures__/linkedin/qualitativo/*.json"
 *
 * O segundo comando não é enfeite: o `JSON.stringify` quebra linhas longas de
 * um jeito e o Prettier de outro, e sem ele o `prettier --check` do CI reprova
 * um golden recém-gravado. A comparação do teste é sobre o objeto lido, não
 * sobre os bytes, então a formatação não muda o veredito.
 *
 * DETERMINISMO. O único ponto do fluxo com relógio é a amostragem do Sentry em
 * `registrarViolacao` (`Date.now()` contra `INTERVALO_LASTRO_MS`). Ela NÃO
 * afeta este harness: o que se captura aqui é o `console.warn` estruturado, que
 * sai em TODA ocorrência e não carrega timestamp, ou seja, a lista completa
 * ANTES da amostragem. Nada mais no caminho usa relógio, sorteio ou ordem de
 * iteração instável, e o teste prova a estabilidade rodando o mesmo cenário
 * duas vezes.
 */

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(AQUI, "..");

export const GOLDENS = AQUI;

/** Uma resposta congelada da OpenAI, na forma que o transporte devolve. */
export interface RespostaCongelada {
  /** O objeto qualitativo, ou uma string crua para forjar JSON inválido. */
  conteudo: Record<string, unknown> | string;
  promptTokens: number;
  completionTokens: number;
  finishReason?: string;
}

export interface Cenario {
  nome: string;
  /** O que este golden existe para congelar. Vai para dentro do JSON. */
  politica: string;
  fixture: string;
  area: AreaSlug;
  level: LinkedinLevel;
  mercado: Mercado;
  skills: string;
  objetivo?: string;
  /** Uma entrada por tentativa. A última se repete se o laço pedir mais. */
  respostas: RespostaCongelada[];
  /** Nota de comportamento congelado que merece revisão humana. */
  nota?: string;
}

interface ViolacaoRegistrada {
  tipo: string;
  campo: string;
  termo: string;
  acao: string;
}

interface DiagnosticoDaChamada {
  presente: boolean;
  /**
   * Campos citados pelo bloco, em ordem de aparição. Só nomes: o texto do
   * diagnóstico não é congelado de propósito, para que ajuste de redação não
   * quebre dezesseis goldens. O que importa é a POLÍTICA (quem foi citado).
   */
  cita: string[];
}

const CAMPOS_CITAVEIS = [
  "resumo",
  "pontosFortes",
  "pontosFracos",
  "melhorias",
  "proximoPasso",
  "headlines",
  "sobreReescrito",
  "modeloMensagemRecrutador",
  "skillsParaEstudar",
  "bulletsReescritos",
];

const MARCA_DE_DIAGNOSTICO = "CORREÇÃO DA TENTATIVA ANTERIOR";

function respostaHttp(r: RespostaCongelada): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [
        {
          finish_reason: r.finishReason ?? "stop",
          message: {
            content:
              typeof r.conteudo === "string"
                ? r.conteudo
                : JSON.stringify(r.conteudo),
          },
        },
      ],
      usage: {
        prompt_tokens: r.promptTokens,
        completion_tokens: r.completionTokens,
      },
    }),
    text: async () => "",
  } as unknown as Response;
}

/** Ordena as chaves de qualquer objeto, recursivamente, para o JSON gravado. */
export function ordenarChaves(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ordenarChaves);
  if (valor === null || typeof valor !== "object") return valor;
  const entradas = Object.entries(valor as Record<string, unknown>).sort(
    ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
  );
  const saida: Record<string, unknown> = {};
  for (const [chave, item] of entradas) saida[chave] = ordenarChaves(item);
  return saida;
}

/**
 * Roda o cenário inteiro e devolve o retrato do que a plataforma entregou.
 *
 * Nenhuma requisição sai: `fetchWithTimeout` é dublado e devolve as respostas
 * congeladas na ordem. `console.warn` e `console.error` são silenciados e
 * capturados, então a saída do teste continua legível.
 */
export async function rodarCenario(
  cenario: Cenario,
): Promise<Record<string, unknown>> {
  const profileText = readFileSync(
    path.join(FIXTURES, cenario.fixture),
    "utf8",
  );
  const request = {
    profileText,
    area: cenario.area,
    level: cenario.level,
    mercado: cenario.mercado,
    skills: cenario.skills,
    foto: "sim",
    banner: "sim",
    openToWork: "sim",
    conexoes: "100-500",
    atividade: "semanal",
    ...(cenario.objetivo ? { objetivo: cenario.objetivo } : {}),
  } as LinkedinAnalyzeRequest;

  const enviadas: string[] = [];
  let indice = 0;
  vi.spyOn(http, "fetchWithTimeout").mockImplementation(
    async (_url: string, init?: RequestInit) => {
      enviadas.push(String(init?.body ?? ""));
      const r =
        cenario.respostas[Math.min(indice, cenario.respostas.length - 1)];
      indice += 1;
      return respostaHttp(r);
    },
  );

  const violacoes: ViolacaoRegistrada[] = [];
  vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
    const linha = args.map(String).join(" ");
    if (!linha.includes("ai_lastro_violado")) return;
    const lido = JSON.parse(linha) as ViolacaoRegistrada;
    violacoes.push({
      tipo: lido.tipo,
      campo: lido.campo,
      termo: lido.termo,
      acao: lido.acao,
    });
  });
  vi.spyOn(console, "error").mockImplementation(() => undefined);

  const tentativas: AnalyzeAiIo[] = [];
  let erro: string | null = null;
  let qualitative: unknown = null;
  let deterministicResumo: Record<string, unknown> | null = null;
  try {
    const { response } = await analyzeLinkedin(request, (io) =>
      tentativas.push(io),
    );
    qualitative = response.qualitative;
    deterministicResumo = {
      score: response.deterministic.score,
      faixa: response.deterministic.faixa,
      keywordsEncontradas: response.deterministic.keywordsEncontradas,
    };
  } catch (err) {
    erro = err instanceof Error ? err.name : String(err);
  }

  const diagnosticos: DiagnosticoDaChamada[] = enviadas.map((corpo) => {
    const payload = JSON.parse(corpo) as {
      messages: Array<{ role: string; content: string }>;
    };
    const texto = payload.messages.filter((m) => m.role === "user")[0].content;
    const bloco = texto.slice(texto.indexOf(MARCA_DE_DIAGNOSTICO));
    const presente = texto.includes(MARCA_DE_DIAGNOSTICO);
    return {
      presente,
      cita: presente
        ? CAMPOS_CITAVEIS.filter((campo) => bloco.includes(campo))
        : [],
    };
  });

  return ordenarChaves({
    cenario: cenario.nome,
    politica: cenario.politica,
    ...(cenario.nota ? { nota: cenario.nota } : {}),
    entrada: {
      fixture: cenario.fixture,
      area: cenario.area,
      level: cenario.level,
      mercado: cenario.mercado,
      skills: cenario.skills,
      ...(cenario.objetivo ? { objetivo: cenario.objetivo } : {}),
    },
    chamadas: enviadas.length,
    diagnosticoPorChamada: diagnosticos,
    tentativas: tentativas.map((t) => ({
      tentativa: t.tentativa,
      desfecho: t.desfecho,
      uso: t.uso,
    })),
    violacoes,
    erro,
    deterministico: deterministicResumo,
    qualitative,
  }) as Record<string, unknown>;
}
