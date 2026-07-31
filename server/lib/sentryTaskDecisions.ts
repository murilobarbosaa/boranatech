import {
  ARQUIVADO_PELO_SYNC,
  DIAS_SEM_EVENTO_PARA_ARQUIVAR,
} from "../../shared/tasks/sentryIntake";
import type { SentryEventDetail, SentryIssue } from "./sentryApi";

// Decisoes do sync do Sentry, PURAS: nenhuma leitura, nenhuma escrita, nenhum
// relogio proprio (o `agora` sempre vem de fora).
//
// Por que separado do job: e o que faz o dry-run valer alguma coisa. As duas
// modalidades percorrem ESTE mesmo codigo e chegam as MESMAS decisoes; a unica
// diferenca entre elas e o que acontece depois, na camada de escrita. Um dry-run
// que decidisse por um caminho paralelo estaria mostrando um relatorio sobre um
// programa que nao e o que roda de verdade.

// ---------------------------------------------------------------------------
// Etiqueta de area
// ---------------------------------------------------------------------------

/**
 * Mapa EXPLICITO de projeto do Sentry para etiqueta do quadro.
 *
 * Medido em 2026-07-31: a organizacao tem exatamente dois projetos, e a
 * correspondencia e exata. As duas etiquetas ja existem no quadro BUG com as
 * cores do seed, entao nao ha etiqueta a criar.
 *
 * NAO derivar de `project.platform` (`javascript-react`, `node-express`): esse
 * campo e do SDK, muda com upgrade de SDK e nao com decisao nossa. NAO inferir
 * do `culprit` (hoje uma URL no front, um caminho de arquivo no back): para no
 * primeiro SSR ou no primeiro script servido por CDN.
 */
export const ETIQUETA_POR_PROJETO: Record<string, string> = {
  "boranatech-front": "Frontend",
  "node-express": "Backend",
};

export type ResultadoEtiqueta =
  | { tipo: "ok"; nome: string }
  | { tipo: "desconhecido"; slug: string };

/**
 * Resolve a etiqueta, ou avisa que nao sabe.
 *
 * NENHUMA ETIQUETA E MELHOR QUE A ERRADA: slug fora do mapa devolve
 * `desconhecido`, o card nasce sem etiqueta e o job registra o slug no relatorio
 * da run. Projeto novo no Sentry entra sozinho na listagem (a consulta usa
 * `project=-1`), e cai aqui: o comportamento desejado e a etiqueta sumir e o
 * aviso aparecer, nunca o job chutar.
 */
export function etiquetaParaProjeto(projectSlug: string): ResultadoEtiqueta {
  const nome = ETIQUETA_POR_PROJETO[projectSlug];
  if (!nome) return { tipo: "desconhecido", slug: projectSlug || "(vazio)" };
  return { tipo: "ok", nome };
}

// ---------------------------------------------------------------------------
// Bloco sentry_data
// ---------------------------------------------------------------------------

/**
 * O bloco que vai para `admin_tasks.sentry_data`.
 *
 * INVARIANTE 2: isto NUNCA vai para `description` nem para `notes`. Esses dois
 * sao do humano, e sync que sobrescreve edicao humana e perda de trabalho
 * silenciosa.
 *
 * `coleta.completo` existe para separar DOIS ESTADOS QUE PARECEM IGUAIS na tela:
 * "esta issue nao tem release" e "o 429 chegou antes de eu conseguir ler o
 * release". Sem essa distincao, um card coletado no meio de um rate limit
 * pareceria um card sem dado, para sempre, e ninguem saberia que faltou buscar.
 * A manutencao retenta exatamente os que estao com `completo: false`.
 */
export type SentryDataBloco = {
  coleta: {
    em: string;
    completo: boolean;
    /** Preenchido so quando `completo` e falso. Diz POR QUE faltou. */
    motivo: string | null;
  };
  issue: {
    shortId: string;
    titulo: string;
    culprit: string;
    level: string;
    status: string;
    projeto: string;
    eventos: number;
    usuarios: number;
    primeiroEvento: string;
    ultimoEvento: string;
    permalink: string;
  };
  /** Null quando a coleta do detalhe falhou OU quando o evento nao existe mais. */
  detalhe: {
    environment: string | null;
    release: string | null;
    url: string | null;
    stack: string | null;
  } | null;
};

export function montarSentryData(params: {
  issue: SentryIssue;
  detalhe: SentryEventDetail | null;
  /** Null = coleta completa. Texto = por que o detalhe nao veio. */
  falha: string | null;
  agoraIso: string;
}): SentryDataBloco {
  const { issue, detalhe, falha, agoraIso } = params;
  return {
    coleta: {
      em: agoraIso,
      completo: falha === null,
      motivo: falha,
    },
    issue: {
      shortId: issue.shortId,
      titulo: issue.title,
      culprit: issue.culprit,
      level: issue.level,
      status: issue.status,
      projeto: issue.projectSlug,
      eventos: issue.count,
      usuarios: issue.userCount,
      primeiroEvento: issue.firstSeen,
      ultimoEvento: issue.lastSeen,
      permalink: issue.permalink,
    },
    detalhe: detalhe
      ? {
          environment: detalhe.environment,
          release: detalhe.release,
          url: detalhe.url,
          stack: detalhe.stack,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Decisao de manutencao
// ---------------------------------------------------------------------------

/**
 * O minimo que a decisao precisa saber sobre um card nosso.
 *
 * Nomes em snake_case espelhando a coluna, como o resto do modulo: nao existe
 * camada de traducao entre o que o banco devolve e o que o codigo le, e e por
 * isso que nao existe onde os dois divergirem em silencio.
 */
export type CardParaManutencao = {
  id: string;
  number: number;
  title: string;
  sentry_numeric_id: string;
  /** Etapa atual. Comparada com a etapa fixada para saber se foi triado. */
  column_id: string;
  completed_at: string | null;
  archived_at: string | null;
  archived_source: string | null;
};

export type TipoDecisao = "reabrir" | "ressuscitar" | "podar" | "nada";

export type Decisao = {
  tipo: TipoDecisao;
  /** Frase curta que vai para o relatorio do dry-run e para o log. */
  motivo: string;
};

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Decide o que fazer com UM card, dado o estado atual da issue.
 *
 * `lastSeen` undefined = a issue nao voltou no lote. FAIL-SAFE 2: isso conta
 * como "sem evento novo", NUNCA como recorrencia. Ausencia nao e evidencia.
 *
 * FAIL-SAFE 1: timestamp base nulo nunca dispara nada. `completed_at` nulo nao
 * reabre e `archived_at` nulo nao ressuscita, porque sem a base nao ha
 * comparacao possivel e agir sobre base incerta e pior que nao agir.
 */
export function decidirManutencao(params: {
  card: CardParaManutencao;
  /** lastSeen FRESCO, do lote. undefined se a issue nao veio. */
  lastSeen: string | undefined;
  /**
   * lastSeen PERSISTIDO no nosso card (`sentry_last_seen`), da ultima vez que a
   * issue apareceu. Usado SO para medir silencio, nunca para detectar evento
   * novo. Ver o bloco abaixo.
   */
  lastSeenPersistido: string | null;
  /** status da issue no Sentry, ou undefined se ela nao veio no lote. */
  statusNoSentry: string | undefined;
  /** Id da etapa fixada do quadro. Card fora dela ja foi triado. */
  etapaFixadaId: string;
  agoraIso: string;
}): Decisao {
  const {
    card,
    lastSeen,
    lastSeenPersistido,
    statusNoSentry,
    etapaFixadaId,
    agoraIso,
  } = params;
  const agora = Date.parse(agoraIso);
  // `evento` e o sinal de RECORRENCIA e vem SO do lote fresco: reabrir e
  // ressuscitar exigem evidencia positiva e recente. Usar o persistido aqui
  // faria o card reabrir para sempre, porque o valor guardado nao muda sozinho.
  const evento = lastSeen ? Date.parse(lastSeen) : null;
  // `paraSilencio` e outra pergunta: "ha quanto tempo nao acontece nada". Para
  // ela a ausencia no lote NAO e falta de informacao, e o valor que guardamos
  // continua valendo.
  //
  // POR QUE ISSO IMPORTA, e nao e preciosismo: medido em 2026-07-31, o filtro
  // por id sem statsPeriod devolve issue de 9 dias, mas NAO da para provar que a
  // janela e ilimitada (a organizacao nao tem issue mais velha que isso para
  // testar). Se ela for menor que 21 dias, toda issue elegivel a poda estaria
  // FORA do lote, `lastSeen` viria undefined, e a poda NUNCA dispararia, em
  // silencio, que e a classe de defeito que este projeto inteiro documenta.
  // Medir silencio pelo que ja sabemos remove a dependencia dessa incognita.
  const referenciaSilencio = lastSeen ?? lastSeenPersistido;

  // --- Arquivado -----------------------------------------------------------
  if (card.archived_at) {
    // Arquivado POR HUMANO nunca ressuscita. Isso e o silenciamento, e ele tem
    // que sobreviver a recorrencia: sem isso nao existe forma de calar um erro
    // conhecido, e a fila volta a crescer com o que ja foi decidido ignorar.
    if (card.archived_source !== ARQUIVADO_PELO_SYNC) {
      return {
        tipo: "nada",
        motivo: "arquivado por humano (silenciado), nao ressuscita",
      };
    }
    if (evento === null) {
      return { tipo: "nada", motivo: "arquivado pelo job, sem evento novo" };
    }
    const arquivadoEm = Date.parse(card.archived_at);
    if (evento > arquivadoEm) {
      return {
        tipo: "ressuscitar",
        motivo: `evento novo em ${lastSeen} depois do arquivamento em ${card.archived_at}`,
      };
    }
    return {
      tipo: "nada",
      motivo: "arquivado pelo job, evento anterior ao arquivamento",
    };
  }

  // --- Concluido -----------------------------------------------------------
  if (card.completed_at) {
    if (evento === null) {
      return { tipo: "nada", motivo: "concluido, sem evento novo" };
    }
    if (evento > Date.parse(card.completed_at)) {
      return {
        tipo: "reabrir",
        motivo: `evento novo em ${lastSeen} depois da conclusao em ${card.completed_at}`,
      };
    }
    return { tipo: "nada", motivo: "concluido, evento anterior a conclusao" };
  }

  // --- Nunca triado (ainda na etapa fixada) --------------------------------
  if (card.column_id === etapaFixadaId) {
    if (statusNoSentry === "resolved") {
      return { tipo: "podar", motivo: "resolvido no Sentry e nunca triado" };
    }
    if (referenciaSilencio === null) {
      // Nunca soubemos de evento nenhum para este card: nem agora, nem antes.
      // Sem base nao ha medida, e arquivar aqui seria ler ausencia de dado como
      // "esta quieto", que e a mesma confusao do contarLinhas devolvendo -1.
      return {
        tipo: "nada",
        motivo: "nunca triado, sem lastSeen para medir silencio",
      };
    }
    const diasEmSilencio = Math.floor(
      (agora - Date.parse(referenciaSilencio)) / MS_POR_DIA,
    );
    if (diasEmSilencio > DIAS_SEM_EVENTO_PARA_ARQUIVAR) {
      return {
        tipo: "podar",
        motivo: `nunca triado e ${diasEmSilencio} dias sem evento (limite ${DIAS_SEM_EVENTO_PARA_ARQUIVAR})`,
      };
    }
    return {
      tipo: "nada",
      motivo: `nunca triado, ${diasEmSilencio} dias sem evento`,
    };
  }

  // --- Triado por humano ---------------------------------------------------
  // INVARIANTE 1: o sync cria, o humano tria. Card que saiu da etapa fixada e do
  // humano, e o job nao o relocaliza. A unica excecao e a reabertura, tratada
  // acima, e ela so alcanca card CONCLUIDO.
  return { tipo: "nada", motivo: "triado por humano, fora do alcance do sync" };
}

/** Precisa de recoleta do detalhe? Le o bloco sem confiar no formato. */
export function detalheIncompleto(sentryData: unknown): boolean {
  if (!sentryData || typeof sentryData !== "object") return false;
  const coleta = (sentryData as Record<string, unknown>).coleta;
  if (!coleta || typeof coleta !== "object") return false;
  return (coleta as Record<string, unknown>).completo === false;
}
