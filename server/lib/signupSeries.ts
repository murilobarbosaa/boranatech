import { diaBrasilia, somarDiaCivil } from "../../shared/brasiliaDay";

// Série DIÁRIA de cadastros.
//
// GRANULARIDADE DIÁRIA, e ela foi MEDIDA, não herdada. No diagnóstico de
// 2026-07-30 a série era serrilhada e a decisão foi semanal. Remedido em
// 2026-08-01, na janela de 30 dias terminando em 01/08: 3.422 cadastros, 23 dos
// 30 dias com cadastro, e os 7 dias vazios são TODOS anteriores a 13/07. De
// 13/07 a 31/07 são 19 dias CONSECUTIVOS, de 79 a 477 por dia, mediana 156.
// A serrilha era do período anterior à tração, e agrupar por semana hoje só
// esconderia o formato do dado.
//
// ZERO É MEDIÇÃO, ausência não é. Nesta série um dia sem linha significa que
// ninguém se cadastrou — isso é um zero de verdade e a barra é desenhada. É o
// oposto do histórico de assinaturas, onde dia sem snapshot significa que
// NINGUÉM MEDIU, e ali a linha precisa quebrar. Tratar os dois igual faria uma
// das duas mentir.

export type PontoDeCadastro = {
  /** `AAAA-MM-DD` no fuso de Brasília. */
  date: string;
  count: number;
  /**
   * O dia de HOJE ainda está acontecendo: o número é parcial e vai subir. Sem
   * esta marca o gráfico desenharia um despencar no último ponto todo dia de
   * manhã, e "as inscrições caíram" é a leitura errada mais fácil de tirar de um
   * gráfico diário.
   */
  partial: boolean;
};

/**
 * Agrupa carimbos de criação por DIA DE BRASÍLIA e preenche a janela.
 *
 * O agrupamento por fuso não é detalhe: `iso.slice(0, 10)` agruparia pelo dia
 * UTC, e todo cadastro feito depois das 21h locais cairia na barra do dia
 * seguinte. É o mesmo defeito que estava no gráfico de leituras de notificação.
 */
export function montarSerieDeCadastros(input: {
  criadosEm: string[];
  /** Primeiro dia da janela (`AAAA-MM-DD`, Brasília). */
  inicio: string;
  /** Último dia da janela, normalmente hoje. */
  fim: string;
  hoje: string;
}): PontoDeCadastro[] {
  const porDia = new Map<string, number>();
  for (const iso of input.criadosEm) {
    const dia = diaBrasilia(iso);
    if (!dia) continue;
    porDia.set(dia, (porDia.get(dia) ?? 0) + 1);
  }

  const pontos: PontoDeCadastro[] = [];
  for (let d = input.inicio; d <= input.fim; d = somarDiaCivil(d)) {
    pontos.push({
      date: d,
      count: porDia.get(d) ?? 0,
      partial: d === input.hoje,
    });
  }
  return pontos;
}

// `somarDia` saiu daqui em 2026-08-14: `server/routes/admin.ts` tinha uma cópia
// byte a byte chamada `somarDias`, e duas implementações da mesma aritmética são
// as que divergem na primeira correção aplicada só numa delas. A função única é
// `somarDiaCivil`, em `shared/brasiliaDay.ts`, ao lado de `diaBrasilia` e
// `inicioDoDiaBrasilia` — que é onde a aritmética de dia civil pertence.
