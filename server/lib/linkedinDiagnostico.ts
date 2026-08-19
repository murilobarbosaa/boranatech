/**
 * Diagnóstico enviado ao modelo na tentativa SEGUINTE (Fase 2, lote 6).
 *
 * O retry de hoje reenvia o MESMO prompt, sem uma palavra sobre o que deu
 * errado, e o modelo tende a repetir o mesmo erro na segunda chamada, que é
 * paga. Aqui a tentativa seguinte recebe o prompt original mais um bloco curto
 * dizendo o que a plataforma recusou.
 *
 * REGRA DURA DESTE MÓDULO: o diagnóstico NUNCA cita o conteúdo reprovado
 * verbatim. Só nome de campo, tipo esperado e regra violada. O motivo não é
 * economia de token: o conteúdo devolvido pelo modelo pode carregar material
 * injetado que veio do usuário (foi o lote 3 inteiro), e devolvê-lo ao modelo
 * em POSIÇÃO DE INSTRUÇÃO, fora dos blocos delimitados, desfaria aquela
 * proteção pela porta dos fundos. Os testes deste módulo afirmam a ausência do
 * conteúdo, não só a presença do campo.
 */

/** Forma mínima de um issue do Zod, estrutural para não importar a lib. */
export interface IssueDeSchema {
  path: PropertyKey[];
  message: string;
  code?: string;
}

/** Cabeçalho comum, para o modelo reconhecer o bloco em qualquer caso. */
const CABECALHO =
  "CORREÇÃO DA TENTATIVA ANTERIOR: a resposta que você enviou foi recusada pela plataforma antes de chegar ao usuário. Corrija exatamente os pontos abaixo e devolva o JSON completo do schema, sem comentar esta correção em nenhum campo.";

/** `melhorias.2.comoFazer`, ou `<raiz>` quando o issue não aponta campo. */
function caminhoDe(issue: IssueDeSchema): string {
  return issue.path.map((p) => String(p)).join(".") || "<raiz>";
}

/**
 * Bloco para falha de SCHEMA: um caminho por linha, com a regra violada.
 *
 * A mensagem do Zod descreve a expectativa ("Expected string, received
 * number", "Array must contain at least 3 element(s)") e não o valor recebido,
 * então ela pode ir inteira. Caminhos repetidos são deduplicados: um array com
 * dez itens errados geraria dez linhas iguais e afogaria o resto.
 */
export function diagnosticoDeSchema(issues: readonly IssueDeSchema[]): string {
  const linhas: string[] = [];
  const vistos = new Set<string>();
  for (const issue of issues) {
    const linha = `- ${caminhoDe(issue)}: ${issue.message}`;
    if (vistos.has(linha)) continue;
    vistos.add(linha);
    linhas.push(linha);
  }
  return [
    CABECALHO,
    "Campos reprovados na validação do schema:",
    ...linhas,
    "Devolva TODOS os campos do schema, e não apenas os corrigidos.",
  ].join("\n");
}

/** Bloco para JSON malformado: não há caminho de campo, só a forma. */
export function diagnosticoDeJsonInvalido(): string {
  return [
    CABECALHO,
    "A resposta anterior não era JSON válido.",
    "Devolva SOMENTE o objeto JSON do schema, sem texto antes ou depois, sem cercas de código e sem comentários.",
  ].join("\n");
}

/**
 * Bloco para reprovação de GATE (idioma ou vazamento de delimitador).
 *
 * O campo e a regra bastam: dizer "o texto que você escreveu estava em inglês"
 * não acrescenta nada que o nome do idioma exigido já não diga, e citar o
 * texto cairia na regra dura do topo deste arquivo.
 */
export function diagnosticoDeGate(reprovas: readonly string[]): string {
  return [
    CABECALHO,
    "Campos reprovados nas checagens de saída:",
    ...reprovas.map((r) => `- ${r}`),
    "Devolva TODOS os campos do schema, e não apenas os corrigidos.",
  ].join("\n");
}
