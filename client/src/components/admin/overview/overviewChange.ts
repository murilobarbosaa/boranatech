// Como a tela mostra (ou deixa de mostrar) a variação de um card.
//
// A regra que sustenta este arquivo: card SEM Δ é honesto, card com Δ FALSO não.
// E espaço vazio no lugar do Δ parece defeito, então quando não há comparação a
// tela diz o motivo em uma linha curta.

/** O envelope que o servidor manda por card (server/lib/overviewWindow.ts). */
export type ChangePayload =
  | {
      disponivel: true;
      atual: number;
      anterior: number;
      delta: number;
      percent: number | null;
    }
  | { disponivel: false; atual: number; motivo: string };

export type ChangeLabel = {
  /** Texto curto ao pé do card. Nunca vazio. */
  texto: string;
  tom: "alta" | "baixa" | "neutro";
};

function pct(valor: number): string {
  const sinal = valor > 0 ? "+" : "";
  return `${sinal}${valor.toFixed(1).replace(".", ",")}%`;
}

/**
 * Motivo legível, por RESOLVER com fallback e nunca por acesso direto: um motivo
 * novo no backend não pode derrubar a página (é a regra do projeto, e foi assim
 * que `STATUS_META[item.status].label` quebrou o admin em produção).
 */
/**
 * Data de um INSTANTE, no fuso de quem lê.
 *
 * `historicoDesde` e `seriesStart` vêm de `timestamptz` (`profiles.created_at`,
 * `finance_transactions.occurred_at`): são instantes, e para um instante o dia
 * LOCAL é o correto a exibir. Na fatia 5 eu tinha forçado `timeZone: "UTC"`
 * aqui, corrigindo o sintoma pelo lado errado — um teste com meia-noite UTC
 * falhava, e a resposta foi mudar o fuso da exibição em vez de reconhecer que o
 * valor de teste é que não representava o campo. Para instante, UTC mostra o dia
 * errado na direção oposta (um evento das 22h em Brasília apareceria como do dia
 * seguinte).
 *
 * Quem precisa do outro caso — coluna `date`, onde o dia é o próprio dado — usa
 * `formatarDiaCivil` de `@shared/brasiliaDay`, que recorta a string sem passar
 * por `new Date`.
 */
export function dataDeInstante(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function motivoLegivel(motivo: string, historicoDesde?: string | null): string {
  if (motivo === "historico_insuficiente") {
    // A FRASE DIZ O QUE ACONTECEU, não o nome do estado. "Sem comparação:
    // histórico desde 13/07/2026" fazia quem lê perguntar o que a data tem a ver
    // com a ausência do Δ; a resposta é que a série começa DENTRO do período
    // escolhido, então o período anterior não tem dado para comparar. Dito
    // assim, a frase se explica sozinha e a data vira contexto, não charada.
    return historicoDesde
      ? `Dados começam no meio do período (${dataDeInstante(historicoDesde)}), sem comparação`
      : "Dados começam no meio do período, sem comparação";
  }
  if (motivo === "janela_sem_anterior")
    return "Sem período anterior para comparar";
  if (motivo === "sem_dados") return "Sem dados no período anterior";
  return "Sem comparação disponível";
}

export function rotuloDeVariacao(
  change: ChangePayload | null | undefined,
  historicoDesde?: string | null,
): ChangeLabel | null {
  // Backend antigo na janela de deploy: sem o campo, a tela não inventa nada.
  if (!change) return null;

  if (!change.disponivel) {
    return {
      texto: motivoLegivel(change.motivo, historicoDesde),
      tom: "neutro",
    };
  }

  if (change.delta === 0) {
    return { texto: "Igual ao período anterior", tom: "neutro" };
  }

  const tom = change.delta > 0 ? "alta" : "baixa";
  // PERCENTUAL AUSENTE quando a base era zero. O delta absoluto continua
  // verdadeiro e é ele que aparece; inventar "+∞%" destruiria a confiança na
  // página inteira.
  if (change.percent === null) {
    return {
      texto:
        change.delta > 0
          ? "Novo no período (não havia antes)"
          : "Zerou no período",
      tom,
    };
  }

  return { texto: `${pct(change.percent)} vs. período anterior`, tom };
}
