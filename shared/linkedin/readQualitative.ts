import { z } from "zod";

import {
  LINKEDIN_ORIGENS_DE_CAMPO,
  LinkedinBulletsReescritosSchema,
  LinkedinMelhoriaSchema,
  QUALITATIVE_VERSION,
  type LinkedinMelhoria,
  type LinkedinOrigemDeCampo,
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

/**
 * Bloco de bullets como ele pode estar GRAVADO, que é diferente do que a IA
 * pode RESPONDER.
 *
 * `experienciaNumero` é obrigatório na escrita (é o que sustenta a atribuição
 * estrutural do lastro), mas as análises gravadas antes dele existir só têm
 * `contexto` e `bullets`. Exigi-lo aqui faria o `.catch(undefined)` da lista
 * inteira disparar e o histórico dessas pessoas abrir sem bullets nenhum, que é
 * exatamente o incidente que este arquivo existe para não repetir.
 *
 * Derivado do schema de escrita com `.extend`, e não reescrito à mão: assim um
 * campo novo do bloco não precisa ser lembrado em dois lugares.
 */
const BlocoLidoSchema = LinkedinBulletsReescritosSchema.extend({
  experienciaNumero: z.number().int().min(1).optional(),
});

export type LinkedinBulletsReescritosLido = z.infer<typeof BlocoLidoSchema>;

/**
 * AUSÊNCIA DA PROCEDÊNCIA, em dois estados NOMEADOS.
 *
 * Toda análise gravada antes do lote que criou a procedência não tem o objeto,
 * e isso não é o mesmo que "veio do modelo" nem que "removeu zero itens". A
 * plataforma simplesmente não registrou o fato na época, e a interface precisa
 * poder dizer isso em vez de afirmar algo que ninguém mediu.
 *
 * Por que sentinela de STRING e não `null`: `null` convida `?? 0`, e o primeiro
 * `?? 0` transforma "não sei" em "medi zero" em silêncio, que é exatamente o
 * colapso que este reader existe para impedir. Com a união `number | "…"`, o
 * TypeScript recusa a aritmética e o erro aparece no `pnpm check`, não em
 * produção.
 */
export const PROCEDENCIA_DESCONHECIDA = "desconhecida";
export const CONTAGEM_INDISPONIVEL = "indisponivel";

export type OrigemLida =
  | LinkedinOrigemDeCampo
  | typeof PROCEDENCIA_DESCONHECIDA;
export type ContagemLida = number | typeof CONTAGEM_INDISPONIVEL;

export interface ProcedenciaView {
  sobreReescrito: OrigemLida;
  modeloMensagemRecrutador: OrigemLida;
  sugestoesHeadline: {
    entregues: ContagemLida;
    removidasPorGate: ContagemLida;
  };
  camposProsaLimpos: ContagemLida;
}

const ORIGENS_VALIDAS = new Set<string>(LINKEDIN_ORIGENS_DE_CAMPO);

/**
 * Origem por campo: só um dos valores conhecidos passa.
 *
 * Valor gravado por uma versão FUTURA que invente uma quarta origem cai em
 * `desconhecida`, e não no valor mais próximo. É o mesmo critério do resto do
 * arquivo: ausência e ilegibilidade são a mesma resposta honesta, "não sei".
 */
function lerOrigem(valor: unknown): OrigemLida {
  return typeof valor === "string" && ORIGENS_VALIDAS.has(valor)
    ? (valor as LinkedinOrigemDeCampo)
    : PROCEDENCIA_DESCONHECIDA;
}

/** Contagem: inteiro não negativo, ou o estado nomeado de indisponível. */
function lerContagem(valor: unknown): ContagemLida {
  return typeof valor === "number" && Number.isInteger(valor) && valor >= 0
    ? valor
    : CONTAGEM_INDISPONIVEL;
}

const ProcedenciaLidaSchema = z
  .object({
    sobreReescrito: z.unknown(),
    modeloMensagemRecrutador: z.unknown(),
    sugestoesHeadline: z
      .object({
        entregues: z.unknown(),
        removidasPorGate: z.unknown(),
      })
      .optional()
      .catch(undefined),
    camposProsaLimpos: z.unknown(),
  })
  .optional()
  .catch(undefined);

// Schema de LEITURA: tudo opcional de propósito. Ele não valida se a IA
// respondeu certo (isso é papel do LinkedinQualitativeSchema na escrita); ele
// só resgata o que der para resgatar de um jsonb que pode ter qualquer idade.
const LenientQualitativeSchema = z.object({
  procedencia: ProcedenciaLidaSchema,
  resumo: z.string().optional().catch(undefined),
  pontosFortes: z.array(z.string()).optional().catch(undefined),
  pontosFracos: z.array(z.string()).optional().catch(undefined),
  melhorias: z.array(LinkedinMelhoriaSchema).optional().catch(undefined),
  proximoPasso: z.string().optional().catch(undefined),
  headlines: z.array(z.string()).optional().catch(undefined),
  sobreReescrito: z.string().optional().catch(undefined),
  bulletsReescritos: z.array(BlocoLidoSchema).optional().catch(undefined),
  skillsParaEstudar: z.array(z.string()).optional().catch(undefined),
  /** Versão 1: campo único, derivado das palavras-chave faltantes. */
  skillsSugeridas: z.array(z.string()).optional().catch(undefined),
  modeloMensagemRecrutador: z.string().optional().catch(undefined),
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
  bulletsReescritos: LinkedinBulletsReescritosLido[];
  skillsParaEstudar: string[];
  modeloMensagemRecrutador: string;
  /**
   * O que a plataforma decidiu na entrega. Sempre presente na view: o que muda
   * com a idade do payload são os VALORES, que caem nos estados nomeados de
   * desconhecida e indisponível. Nunca é `undefined`, para o consumidor não ter
   * um segundo jeito de escrever "não sei".
   */
  procedencia: ProcedenciaView;
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
  "skillsParaEstudar",
  "modeloMensagemRecrutador",
] as const;

export function readQualitative(
  raw: unknown,
  declaredVersion?: number,
): QualitativeView {
  const parsed = LenientQualitativeSchema.safeParse(raw);
  const q = parsed.success ? parsed.data : {};

  // Versão: o carimbo do result manda; sem carimbo, a presença de
  // skillsParaEstudar decide. Linha antiga não tem carimbo nem o campo novo.
  const version =
    declaredVersion ??
    (q.skillsParaEstudar !== undefined ? QUALITATIVE_VERSION : 1);

  // Legado (v1): `skillsSugeridas` era derivado das FALTANTES, então vira
  // trilha de estudo, nunca "adicione agora". Renderizar aquela lista como
  // sugestão de competência repetiria o conselho ruim (Ruby e Elixir para um
  // dev JavaScript) a cada abertura do histórico.
  // v1 tinha só `skillsSugeridas`, derivado das FALTANTES: vira trilha de
  // estudo. A partir da v2 o campo já se chama skillsParaEstudar.
  const skillsParaEstudar = q.skillsParaEstudar ?? q.skillsSugeridas ?? [];
  const legado = q.skillsParaEstudar === undefined;

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
    skillsParaEstudar,
    modeloMensagemRecrutador: q.modeloMensagemRecrutador ?? "",
    procedencia: {
      sobreReescrito: lerOrigem(q.procedencia?.sobreReescrito),
      modeloMensagemRecrutador: lerOrigem(
        q.procedencia?.modeloMensagemRecrutador,
      ),
      sugestoesHeadline: {
        entregues: lerContagem(q.procedencia?.sugestoesHeadline?.entregues),
        removidasPorGate: lerContagem(
          q.procedencia?.sugestoesHeadline?.removidasPorGate,
        ),
      },
      camposProsaLimpos: lerContagem(q.procedencia?.camposProsaLimpos),
    },
    camposAusentes: [],
  };

  // Um campo legado não conta como ausente: ele existe, só tem outro nome.
  const resolvidosPeloLegado = new Set(legado ? ["skillsParaEstudar"] : []);
  view.camposAusentes = CAMPOS_ESPERADOS.filter(
    (campo) =>
      !resolvidosPeloLegado.has(campo) &&
      (q as Record<string, unknown>)[campo] === undefined,
  );

  return view;
}
