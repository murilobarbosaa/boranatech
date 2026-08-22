/**
 * ACUMULACAO DO USO MEDIDO da OpenAI, compartilhada pelo modulo careerPlan.
 *
 * Estas quatro auxiliares nasceram em `intakeChat.ts` na Fase 4 lote 3b, quando
 * o chat de intake passou a repassar o `usage` da resposta em vez de descarta-lo.
 * O lote 3c precisou exatamente delas na GERACAO do plano, que e o outro
 * consumidor de IA deste mesmo modulo.
 *
 * POR QUE MODULO PROPRIO, e nao um import de `generate.ts` para `intakeChat.ts`:
 * a acumulacao nao pertence a nenhum dos dois. Fazer a geracao do plano importar
 * do chat criaria uma dependencia entre duas features que nao se falam, so para
 * chegar num utilitario. Um arquivo de dezoito linhas ao lado dos dois resolve,
 * e desfaz uma das quatro copias que o lote 3b registrou como divida.
 *
 * As outras tres copias (as duas de `server/lib/aiRoadmap/` e a de
 * `server/lib/resumeAnalyze.ts`) continuam de pe: elas moram fora deste
 * diretorio, e o escopo do lote 3c termina aqui. Ficam registradas no relatorio.
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
