/**
 * ACUMULACAO DO USO MEDIDO da OpenAI, para toda a plataforma.
 *
 * Estas auxiliares nasceram em `server/lib/careerPlan/intakeChat.ts` na Fase 4
 * lote 3b, e ate o lote 5 existiam em QUATRO copias: as duas de
 * `server/lib/aiRoadmap/`, a de `server/lib/resumeAnalyze.ts` e a de
 * `server/routes/interview.ts`. Cada lote que precisou delas copiou, porque a
 * alternativa era importar de outra feature.
 *
 * MODULO NEUTRO, e a neutralidade e o ponto: ele nao importa de feature nenhuma,
 * entao qualquer uma pode importar dele sem criar aresta com as outras. Era essa
 * a objecao que mantinha as copias vivas (o plano de carreira nao deve depender
 * do chat de intake do roadmap para chegar num utilitario), e ela desaparece
 * quando o utilitario nao pertence a ninguem.
 *
 * O nome comeca com `ai` e nao com o de uma feature pelo mesmo motivo: ele fala
 * do `usage` da OpenAI, que e comum as nove ferramentas.
 *
 * As quatro copias eram identicas em comportamento. Divergiam so na grafia do
 * tipo de retorno de `usoDoContrato` (duas escreviam a forma inline, duas o
 * alias `UsoMedido`, que e a mesma coisa) e em `aiRoadmap/generate.ts`, onde
 * `novoUsoAcumulado` estava inline no unico ponto de uso. O relatorio do lote 5
 * traz o diff.
 */

/** O uso medido de um request, como ele viaja nos contratos dos helpers. */
export interface UsoMedido {
  inputTokens: number;
  outputTokens: number;
}

/** Acumulador do uso medido ao longo das tentativas de um request. */
export interface UsoAcumulado {
  inputTokens: number;
  outputTokens: number;
  medido: boolean;
}

/** Zera o acumulador. `medido` false enquanto nenhuma resposta trouxer `usage`. */
export function novoUsoAcumulado(): UsoAcumulado {
  return { inputTokens: 0, outputTokens: 0, medido: false };
}

/**
 * Soma o `usage` desta resposta ao acumulado do request.
 *
 * Chamado logo DEPOIS de ler o corpo e ANTES de validar conteudo, JSON ou
 * schema, de proposito: uma tentativa que a OpenAI respondeu e nos reprovamos
 * foi cobrada igual, e o token dela precisa entrar na conta.
 */
export function somarUso(
  acumulado: UsoAcumulado,
  usage: { prompt_tokens?: number; completion_tokens?: number } | undefined,
): void {
  if (typeof usage?.prompt_tokens !== "number") return;
  acumulado.inputTokens += usage.prompt_tokens;
  acumulado.outputTokens += usage.completion_tokens ?? 0;
  acumulado.medido = true;
}

/** O campo `uso` do contrato, ou undefined quando nada foi medido. */
export function usoDoContrato(acumulado: UsoAcumulado): UsoMedido | undefined {
  return acumulado.medido
    ? {
        inputTokens: acumulado.inputTokens,
        outputTokens: acumulado.outputTokens,
      }
    : undefined;
}

/**
 * Soma o uso de DUAS chamadas, preservando a ausencia.
 *
 * Existe porque ha fluxos que cobram UMA unidade de quota por mais de uma
 * chamada de IA: o turno de fechamento da entrevista (avaliacao mais veredito) e
 * a geracao de roadmap (esqueleto mais uma chamada por secao). Se as duas
 * estiverem ausentes, o resultado e ausente; se so uma trouxer medicao, o total
 * e o dela, e nao uma soma com zero fingido do outro lado.
 *
 * Tambem estava duplicada, em `aiRoadmap/generate.ts` e `routes/interview.ts`.
 */
export function somarUsoDeChamadas(
  a: UsoMedido | undefined,
  b: UsoMedido | undefined,
): UsoMedido | undefined {
  if (!a) return b;
  if (!b) return a;
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
  };
}
