// A parte do gráfico que pode mentir sem parecer que mentiu.
//
// Duas decisões moram aqui, as duas puras e testadas: onde o eixo Y começa, e
// que frase o gráfico usa para responder à sua pergunta num relance.

export type DominioY = {
  min: number;
  max: number;
  /** Eixo NÃO começa em zero. Quando true, a tela é obrigada a dizer. */
  truncado: boolean;
};

/**
 * Onde o eixo Y começa.
 *
 * COMEÇAR EM ZERO É O PADRÃO, porque eixo truncado exagera tendência: uma
 * variação de 2% vira uma subida de 45 graus. Mas zero também mente na direção
 * oposta quando a variação é pequena perto do valor absoluto, a linha vira uma
 * reta e o gráfico não responde nada.
 *
 * A regra: trunca só quando a variação for MENOR que 25% do máximo, e nesse caso
 * `truncado` obriga a tela a avisar. Eixo truncado sem aviso é a forma clássica
 * de exagerar tendência, e é a única coisa que este arquivo existe para impedir.
 *
 * Medido na série de hoje: MRR vai de R$ 467,40 a R$ 1.706,80, variação de 73%
 * do máximo, então o eixo começa em ZERO e não há nada a avisar. A regra só
 * entra em ação quando a base amadurecer e o crescimento relativo diminuir.
 */
export function dominioDoEixoY(valores: number[]): DominioY {
  const validos = valores.filter((v) => Number.isFinite(v));
  if (validos.length === 0) return { min: 0, max: 0, truncado: false };

  const min = Math.min(...validos);
  const max = Math.max(...validos);
  if (max <= 0 || min <= 0) return { min: 0, max, truncado: false };

  // SÉRIE CONSTANTE (inclui a de um ponto só) não trunca. Truncar aqui daria um
  // eixo de faixa mínima em volta de um valor que não varia, e a tela anunciaria
  // "o eixo não começa em zero" para um gráfico sem inclinação a exagerar.
  if (max === min) return { min: 0, max, truncado: false };

  const variacaoRelativa = (max - min) / max;
  if (variacaoRelativa >= 0.25) return { min: 0, max, truncado: false };

  // Uma folga de 10% da variação abaixo do mínimo, para o ponto mais baixo não
  // encostar no eixo.
  const folga = Math.max((max - min) * 0.1, 1);
  return { min: Math.max(0, Math.floor(min - folga)), max, truncado: true };
}

export type Tendencia = {
  /** Frase curta, a resposta em três segundos. Nunca vazia. */
  texto: string;
  tom: "alta" | "baixa" | "neutro";
};

/**
 * "Está subindo ou parou de subir?", para uma série de NÍVEL (MRR, ativos).
 *
 * Compara o primeiro ponto medido com o último. Pontos sem medição ficam de
 * fora: comparar contra um buraco daria uma variação contra nada.
 */
export function tendenciaDeNivel(
  valores: Array<number | null>,
  formatar: (v: number) => string,
): Tendencia {
  const medidos = valores.filter((v): v is number => v !== null);
  if (medidos.length < 2) {
    return { texto: "Sem histórico suficiente para comparar", tom: "neutro" };
  }
  const delta = medidos[medidos.length - 1] - medidos[0];
  if (delta === 0) {
    return { texto: "Estável no período", tom: "neutro" };
  }
  return {
    texto: `${delta > 0 ? "+" : "-"}${formatar(Math.abs(delta))} no período`,
    tom: delta > 0 ? "alta" : "baixa",
  };
}

/**
 * "O topo do funil está enchendo ou secando?", para uma série de FLUXO
 * (cadastros por dia).
 *
 * Nível se compara ponta a ponta; fluxo, não: um dia forte no fim faria "subiu"
 * e um dia fraco faria "caiu", e os dois seriam ruído. Aqui a comparação é entre
 * a MÉDIA da metade recente e a da metade anterior, que é o que responde se está
 * enchendo ou secando.
 *
 * O dia PARCIAL fica de fora dos dois lados: ele sempre puxa a média recente
 * para baixo, e às 8h da manhã diria "secando" todo dia.
 */
export function tendenciaDeFluxo(
  pontos: Array<{ count: number; partial: boolean }>,
  /**
   * Copy do ramo "metade anterior zerada", a UNICA parte desta funcao que fala
   * do dominio: o resto ("Acelerando: 12 -> 20 por dia") serve qualquer
   * contagem diaria. O default mantem o grafico de cadastros exatamente como
   * era; o de ativos passa as frases dele. Sem este parametro, um mes sem
   * ninguem no site imprimiria "Nenhum cadastro no periodo" num grafico que
   * nao mede cadastro.
   */
  zeroCopy: { nenhum: string; comecou: string } = {
    nenhum: "Nenhum cadastro no período",
    comecou: "Começou a entrar cadastro no período",
  },
  /**
   * Unidade do BALDE, para a frase não dizer "por dia" sobre uma série semanal.
   * A aritmética (média da metade recente contra a anterior) vale para qualquer
   * balde de tamanho constante; só a palavra muda.
   */
  unidade: string = "dia",
): Tendencia {
  const completos = pontos.filter((p) => !p.partial);
  if (completos.length < 4) {
    return { texto: "Sem histórico suficiente para comparar", tom: "neutro" };
  }
  const meio = Math.floor(completos.length / 2);
  const media = (lista: typeof completos) =>
    lista.reduce((s, p) => s + p.count, 0) / lista.length;
  const anterior = media(completos.slice(0, meio));
  const recente = media(completos.slice(meio));

  if (anterior === 0) {
    return recente > 0
      ? { texto: zeroCopy.comecou, tom: "alta" }
      : { texto: zeroCopy.nenhum, tom: "neutro" };
  }

  const variacao = ((recente - anterior) / anterior) * 100;
  // Abaixo de 10% é ruído de dia a dia, não tendência. Chamar isso de subida ou
  // queda treinaria a pessoa a ignorar a frase.
  if (Math.abs(variacao) < 10) {
    return {
      texto: `Estável: ~${Math.round(recente)} por ${unidade}`,
      tom: "neutro",
    };
  }
  return {
    texto:
      variacao > 0
        ? `Acelerando: ${Math.round(anterior)} → ${Math.round(recente)} por ${unidade}`
        : `Desacelerando: ${Math.round(anterior)} → ${Math.round(recente)} por ${unidade}`,
    tom: variacao > 0 ? "alta" : "baixa",
  };
}

/** `AAAA-MM-DD` (dia civil) em `dd/mm`, por recorte. Nunca passa por `Date`. */
export function rotuloDeDia(dia: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dia);
  return m ? `${m[3]}/${m[2]}` : dia;
}

/**
 * Quantos rótulos do eixo X cabem sem virar sopa.
 *
 * Em 380px não dá para mostrar 88 datas. A saída NÃO é rolagem horizontal: os
 * pontos continuam todos desenhados (a forma da curva é o dado), e o que rareia
 * são os RÓTULOS. Rolagem esconderia metade da série atrás de um gesto que
 * ninguém faz num painel.
 */
export function intervaloDeRotulos(pontos: number, alvo: number): number {
  if (pontos <= alvo) return 0; // 0 = mostra todos (semântica do Recharts)
  return Math.ceil(pontos / alvo) - 1;
}
