// Deep link da aba Tarefas: `?section=tarefas&task=DEV-42`.
//
// Funcoes PURAS de propósito, separadas do componente e com teste proprio. O
// modo de falha aqui e o classico de manipulacao de querystring: escrever um
// parametro reconstruindo a URL do zero e apagar os outros em silencio. A pagina
// do admin ja faz `setLocation('/admin?section=' + section)`, que descarta tudo
// o mais; se a escrita do `task` seguisse o mesmo molde, abrir uma tarefa jogaria
// a pessoa de volta para "visao-geral" no F5.
//
// Por isso as duas funcoes abaixo recebem a search ATUAL e devolvem a search
// nova, preservando o que nao e delas. Nao existe caminho aqui que monte a URL
// a partir do nada.

/** Aceita `DEV-42`: prefixo do board (maiusculo) e numero do card. */
const SHORT_ID = /^[A-Z][A-Z0-9]{1,9}-\d+$/;

/**
 * Le `?task=` e devolve o ID curto normalizado, ou null.
 *
 * Normaliza para maiusculo antes de validar (link colado de um chat vem
 * minusculo com frequencia), mas recusa qualquer coisa fora do formato: um
 * `?task=<script>` nunca vira estado da tela.
 */
export function readTaskParam(search: string): string | null {
  const raw = new URLSearchParams(search).get("task");
  if (!raw) return null;
  const normalized = raw.trim().toUpperCase();
  return SHORT_ID.test(normalized) ? normalized : null;
}

/**
 * Devolve a query string com `task` definido (ou removido, quando shortId e
 * null), PRESERVANDO os demais parametros, `section` inclusive.
 *
 * O retorno ja vem com "?" na frente, ou vazio quando nao sobrou parametro
 * nenhum, para concatenar direto no path.
 */
export function withTaskParam(search: string, shortId: string | null): string {
  const params = new URLSearchParams(search);
  if (shortId) {
    params.set("task", shortId);
  } else {
    params.delete("task");
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Monta o ID curto exibido no card e usado no deep link. */
export function shortIdOf(boardKey: string, taskNumber: number): string {
  return `${boardKey}-${taskNumber}`;
}

/**
 * Separa `DEV-42` em prefixo e numero. Devolve null em formato invalido, para o
 * chamador nao ter que confiar num split.
 */
export function parseShortId(
  shortId: string,
): { boardKey: string; number: number } | null {
  if (!SHORT_ID.test(shortId)) return null;
  const separator = shortId.lastIndexOf("-");
  const boardKey = shortId.slice(0, separator);
  const number = Number(shortId.slice(separator + 1));
  return Number.isSafeInteger(number) && number > 0 ? { boardKey, number } : null;
}
