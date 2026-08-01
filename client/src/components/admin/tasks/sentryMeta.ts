import type { TaskArchivedSource, TaskSource } from "./types";

// Resolvers do feed do Sentry. TODOS com fallback neutro, pela regra do
// CLAUDE.md: o bundle no navegador pode ser mais antigo que o backend (Vercel e
// Railway sobem separados), e um `source` novo num acesso direto derrubaria o
// modal inteiro com "Cannot read properties of undefined".

export type OrigemMeta = {
  /** Rotulo curto para o selo do card. Vazio = nao desenhar selo. */
  selo: string;
  /** Nome do autor no cabecalho do card e nas linhas do histórico. */
  autor: string;
};

const ORIGEM_META: Record<TaskSource, OrigemMeta> = {
  human: { selo: "", autor: "" },
  sentry: { selo: "Sentry", autor: "Sentry" },
  migrated_bug: { selo: "Bug", autor: "Bugs & Erros" },
};

/**
 * Neutro para `source` DESCONHECIDO.
 *
 * Nao inventa nome: um valor que este bundle nao conhece vira "Automático",
 * porque a unica coisa que da para afirmar sobre ele e que nao foi digitado por
 * ninguem que esta olhando. Mentir "Sentry" seria pior que ser vago.
 */
const ORIGEM_NEUTRA: OrigemMeta = { selo: "Automático", autor: "Automático" };

export function origemMetaOf(value: string): OrigemMeta {
  return ORIGEM_META[value as TaskSource] ?? ORIGEM_NEUTRA;
}

/**
 * Nome do autor de um card, ja resolvido.
 *
 * INVARIANTE 7: card do sync tem `created_by` nulo, e a tela precisa dizer
 * "Sentry", nunca "Alguém" nem vazio. A ordem importa: `source` primeiro,
 * porque ele e a afirmacao; o nulo em `created_by` e so a consequencia.
 */
export function autorDoCard(
  task: { source: string; created_by: string | null },
  nomeHumano: string | null,
): string {
  const meta = origemMetaOf(task.source);
  if (meta.autor) return meta.autor;
  return nomeHumano ?? "Alguém";
}

// ---------------------------------------------------------------------------
// Arquivamento: silenciado por humano x podado pelo job
// ---------------------------------------------------------------------------

export type ArquivamentoMeta = {
  rotulo: string;
  descricao: string;
  /** Rotulo do botao que desfaz. */
  acaoDesfazer: string;
};

/**
 * Os dois estados de arquivamento tem FUTUROS DIFERENTES, e e por isso que a
 * tela precisa distingui-los:
 *
 *   silenciado (human)  -> nao volta NUNCA, mesmo se o erro acontecer de novo;
 *   podado (sentry_sync) -> volta sozinho na proxima recorrencia.
 *
 * Mostrar os dois como "arquivado" faria a pessoa achar que silenciar e so
 * limpar a tela, e ela nunca saberia que tem o recurso.
 */
const ARQUIVAMENTO_META: Record<TaskArchivedSource, ArquivamentoMeta> = {
  human: {
    rotulo: "Silenciado",
    descricao: "Este erro não volta para a fila, mesmo se acontecer de novo.",
    acaoDesfazer: "Dessilenciar",
  },
  sentry_sync: {
    rotulo: "Arquivado pelo Sentry",
    descricao:
      "Sem eventos novos por tempo suficiente. Volta sozinho se o erro acontecer de novo.",
    acaoDesfazer: "Desarquivar",
  },
};

const ARQUIVAMENTO_NEUTRO: ArquivamentoMeta = {
  rotulo: "Arquivado",
  descricao: "",
  acaoDesfazer: "Desarquivar",
};

export function arquivamentoMetaOf(
  value: string | null | undefined,
): ArquivamentoMeta {
  if (!value) return ARQUIVAMENTO_NEUTRO;
  return ARQUIVAMENTO_META[value as TaskArchivedSource] ?? ARQUIVAMENTO_NEUTRO;
}

/**
 * O que a acao de arquivar se chama, e o que ela significa, NA ETAPA FIXADA.
 *
 * Fora da etapa fixada, arquivar continua sendo arquivar: o card ja foi triado
 * e o job nao age mais sobre ele, entao "silenciar" nao descreveria nada.
 * Dentro dela, arquivar a mao E silenciar, e a tela precisa dizer isso ANTES do
 * clique, nao depois.
 */
export function acaoDeArquivar(naEtapaFixada: boolean): {
  rotulo: string;
  explicacao: string;
} {
  return naEtapaFixada
    ? {
        rotulo: "Silenciar",
        explicacao:
          "O erro sai da fila e não volta, mesmo se acontecer de novo.",
      }
    : { rotulo: "Arquivar", explicacao: "" };
}
