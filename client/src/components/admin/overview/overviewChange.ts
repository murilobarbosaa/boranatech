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
 * Data em UTC, sempre.
 *
 * `toLocaleDateString` sem `timeZone` usa o fuso do NAVEGADOR, e um instante
 * gravado como `2026-07-16T00:00:00Z` vira 15/07 em qualquer fuso a oeste de
 * Greenwich — inclusive no de Brasília. O rótulo diria um dia a menos do que a
 * série realmente começou. Os carimbos do admin são UTC, então a leitura é UTC.
 */
export function dataUtc(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function motivoLegivel(motivo: string, historicoDesde?: string | null): string {
  if (motivo === "historico_insuficiente") {
    return historicoDesde
      ? `Sem comparação: histórico desde ${dataUtc(historicoDesde)}`
      : "Sem comparação: histórico insuficiente";
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
