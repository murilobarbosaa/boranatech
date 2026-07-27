import { z } from "zod";

import {
  LinkedinBulletsReescritosSchema,
  LinkedinMelhoriaSchema,
  QUALITATIVE_VERSION,
  type LinkedinBulletsReescritos,
  type LinkedinMelhoria,
} from "./schema";

/**
 * Leitura VERSIONADA e tolerante do `qualitative` persistido.
 *
 * Por que existe: `linkedin_analyses.result` é jsonb gravado por uma versão do
 * código e lido por outra, sem nenhuma validação em runtime na volta
 * (`getLinkedinAnalysis` faz só um cast). Acessar `result.qualitative.x` direto
 * é a mesma classe do incidente que o CLAUDE.md documenta em "Lookups por valor
 * do servidor": um campo que sumiu ou mudou de nome derruba a página inteira do
 * resultado, e o histórico de 107 análises é exatamente onde isso apareceria.
 *
 * Contrato desta função:
 *   - NUNCA lança. Entrada corrompida vira render parcial, não tela branca.
 *   - Campo ilegível vira valor neutro (string vazia ou lista vazia) e entra em
 *     `camposAusentes`, para a UI poder omitir o bloco em vez de mostrar vazio
 *     sem explicação.
 *   - Traduz a versão 1 (campo único `skillsSugeridas`) para o formato atual.
 */

// Schema de LEITURA: tudo opcional de propósito. Ele não valida se a IA
// respondeu certo (isso é papel do LinkedinQualitativeSchema na escrita); ele
// só resgata o que der para resgatar de um jsonb que pode ter qualquer idade.
const LenientQualitativeSchema = z.object({
  resumo: z.string().optional(),
  pontosFortes: z.array(z.string()).optional(),
  pontosFracos: z.array(z.string()).optional(),
  melhorias: z.array(LinkedinMelhoriaSchema).optional(),
  proximoPasso: z.string().optional(),
  headlines: z.array(z.string()).optional(),
  sobreReescrito: z.string().optional(),
  bulletsReescritos: z.array(LinkedinBulletsReescritosSchema).optional(),
  skillsParaAdicionarAgora: z.array(z.string()).optional(),
  skillsParaEstudar: z.array(z.string()).optional(),
  /** Versão 1: campo único, derivado das palavras-chave faltantes. */
  skillsSugeridas: z.array(z.string()).optional(),
  modeloMensagemRecrutador: z.string().optional(),
});

export interface QualitativeView {
  /** Versão detectada do formato lido (1 = legado, sem os campos novos). */
  version: number;
  resumo: string;
  pontosFortes: string[];
  pontosFracos: string[];
  melhorias: LinkedinMelhoria[];
  proximoPasso: string;
  headlines: string[];
  sobreReescrito: string;
  bulletsReescritos: LinkedinBulletsReescritos[];
  skillsParaAdicionarAgora: string[];
  skillsParaEstudar: string[];
  modeloMensagemRecrutador: string;
  /** Nomes dos campos que não vieram ou não puderam ser lidos. */
  camposAusentes: string[];
}

const CAMPOS_ESPERADOS = [
  "resumo",
  "pontosFortes",
  "pontosFracos",
  "melhorias",
  "proximoPasso",
  "headlines",
  "sobreReescrito",
  "bulletsReescritos",
  "skillsParaAdicionarAgora",
  "skillsParaEstudar",
  "modeloMensagemRecrutador",
] as const;

export function readQualitative(
  raw: unknown,
  declaredVersion?: number,
): QualitativeView {
  const parsed = LenientQualitativeSchema.safeParse(raw);
  const q = parsed.success ? parsed.data : {};

  // Versão: o carimbo do result manda; sem carimbo, a presença dos campos novos
  // decide. Linha antiga não tem carimbo nem campos novos, então cai em 1.
  const temCamposNovos =
    q.skillsParaAdicionarAgora !== undefined || q.skillsParaEstudar !== undefined;
  const version =
    declaredVersion ?? (temCamposNovos ? QUALITATIVE_VERSION : 1);

  // Legado (v1): `skillsSugeridas` era derivado das FALTANTES, então vira
  // trilha de estudo, nunca "adicione agora". Renderizar aquela lista como
  // sugestão de competência repetiria o conselho ruim (Ruby e Elixir para um
  // dev JavaScript) a cada abertura do histórico.
  const legado = version < QUALITATIVE_VERSION;
  const skillsParaAdicionarAgora = legado
    ? []
    : (q.skillsParaAdicionarAgora ?? []);
  const skillsParaEstudar = legado
    ? (q.skillsSugeridas ?? [])
    : (q.skillsParaEstudar ?? []);

  const view: QualitativeView = {
    version,
    resumo: q.resumo ?? "",
    pontosFortes: q.pontosFortes ?? [],
    pontosFracos: q.pontosFracos ?? [],
    melhorias: q.melhorias ?? [],
    proximoPasso: q.proximoPasso ?? "",
    headlines: q.headlines ?? [],
    sobreReescrito: q.sobreReescrito ?? "",
    bulletsReescritos: q.bulletsReescritos ?? [],
    skillsParaAdicionarAgora,
    skillsParaEstudar,
    modeloMensagemRecrutador: q.modeloMensagemRecrutador ?? "",
    camposAusentes: [],
  };

  // Um campo legado não conta como ausente: ele existe, só tem outro nome.
  const resolvidosPeloLegado = new Set(
    legado ? ["skillsParaAdicionarAgora", "skillsParaEstudar"] : [],
  );
  view.camposAusentes = CAMPOS_ESPERADOS.filter(
    (campo) =>
      !resolvidosPeloLegado.has(campo) &&
      (q as Record<string, unknown>)[campo] === undefined,
  );

  return view;
}
