import type { RoadmapIntake } from "../aiRoadmap";
import type { RoadmapV2 } from "../roadmapV2/types";

/**
 * Aritmetica de carga de um roadmap gerado.
 *
 * POR QUE ISTO EXISTE. Ate 2026-08-05 a unica forma de saber se um roadmap
 * estava dimensionado para a pessoa era perguntar a um juiz LLM, que devolve
 * nota de 1 a 5 com ruido medido de ate 1,20 ponto em algumas dimensoes. Com
 * `estimatedHours` sendo numero inteiro de horas de esforco, "cabe no prazo?"
 * vira conta, e conta nao tem ruido. Esta e a primeira metrica objetiva de
 * personalizacao da fase.
 *
 * O QUE ELA NAO MEDE. Que o conteudo seja bom, relevante ou pessoal. Um roadmap
 * pode ter razao de carga perfeita e ser generico. A conta responde uma pergunta
 * so, e responde bem: o volume pedido cabe no tempo que a pessoa declarou ter.
 */

/**
 * Horas semanais por faixa do intake.
 *
 * Usa o PONTO MEDIO das faixas fechadas, nao o extremo: "de 5 a 10" vira 7,5, e
 * nao 5 nem 10. Ancorar no piso classificaria como sobrecarregado quase todo
 * roadmap de quem esta no topo da faixa, e ancorar no teto faria o contrario.
 *
 * "20-mais" e aberta e o ponto medio nao existe. Fica 25, um valor deliberado e
 * conservador: quem declara "mais de 20" quase nunca esta declarando 40, e
 * escolher um numero alto demais aqui esconderia sobrecarga real justamente na
 * faixa em que o modelo mais infla. Trocar 25 por outro numero e ato deliberado,
 * porque muda o veredito de todo roadmap dessa faixa.
 */
export const HORAS_POR_SEMANA: Record<RoadmapIntake["hoursPerWeek"], number> = {
  "ate-5": 2.5,
  "5-10": 7.5,
  "10-20": 15,
  "20-mais": 25,
};

/**
 * Semanas por prazo. 4,33 semanas por mes (52/12), nao 4: com 4 o ano fecharia
 * em 48 semanas e o erro cresceria justamente no prazo mais longo.
 *
 * "sem-prazo" devolve null de proposito, e o resultado inteiro vira null. Um
 * default silencioso aqui (12 meses, por exemplo) produziria uma razao de carga
 * plausivel e indistinguivel de uma real, que e a classe de erro que este
 * repositorio ja pagou caro. Sem prazo declarado nao existe carga disponivel, e
 * dizer "nao da pra saber" e a unica resposta honesta.
 */
export const SEMANAS_POR_PRAZO: Record<
  RoadmapIntake["deadline"],
  number | null
> = {
  "3m": 13,
  "6m": 26,
  "12m": 52,
  "sem-prazo": null,
};

/**
 * Faixa em que a carga e considerada calibrada.
 *
 * Nao e [0,9 .. 1,1]: um roadmap que ocupa 100% do tempo declarado nao sobra
 * margem para semana ruim, e um que ocupa 60% nao e defeito, e folga. O teto e
 * o que importa, e 1,0 ja e o limite: acima disso o plano nao cabe no prazo que
 * a propria pessoa pediu.
 */
export const RAZAO_MINIMA = 0.4;
export const RAZAO_MAXIMA = 1.0;

export interface CargaRoadmap {
  /** Soma de estimatedHours de todos os passos, em qualquer profundidade. */
  horasGeradas: number;
  /** Passos sem estimatedHours numerico (roadmap antigo, ou geracao parcial). */
  passosSemHoras: number;
  passosTotais: number;
  /** null quando o prazo e "sem-prazo": sem prazo nao ha carga disponivel. */
  horasDisponiveis: number | null;
  /** horasGeradas / horasDisponiveis. null quando horasDisponiveis e null. */
  razao: number | null;
  /** null quando razao e null: sem base de comparacao nao ha veredito. */
  calibrado: boolean | null;
}

function somar(
  nodes: RoadmapV2["sections"][number]["children"] | undefined,
  acc: { horas: number; sem: number; total: number },
): void {
  for (const node of nodes ?? []) {
    acc.total += 1;
    if (typeof node.estimatedHours === "number") {
      acc.horas += node.estimatedHours;
    } else {
      acc.sem += 1;
    }
    somar(node.children, acc);
  }
}

export function cargaDoRoadmap(
  roadmap: RoadmapV2,
  intake: Pick<RoadmapIntake, "hoursPerWeek" | "deadline">,
): CargaRoadmap {
  const acc = { horas: 0, sem: 0, total: 0 };
  for (const section of roadmap.sections ?? []) somar(section.children, acc);

  const semanas = SEMANAS_POR_PRAZO[intake.deadline] ?? null;
  const porSemana = HORAS_POR_SEMANA[intake.hoursPerWeek];
  const horasDisponiveis =
    semanas !== null && typeof porSemana === "number"
      ? semanas * porSemana
      : null;

  const razao =
    horasDisponiveis !== null && horasDisponiveis > 0
      ? acc.horas / horasDisponiveis
      : null;

  return {
    horasGeradas: acc.horas,
    passosSemHoras: acc.sem,
    passosTotais: acc.total,
    horasDisponiveis,
    razao,
    calibrado:
      razao === null ? null : razao >= RAZAO_MINIMA && razao <= RAZAO_MAXIMA,
  };
}

/**
 * Fracao das horas disponiveis que o plano pode ocupar.
 *
 * 0,70 e nao 1,0 porque plano que consome 100% do tempo declarado pressupoe que
 * a pessoa nunca perca uma semana, e ao longo de 6 a 12 meses ela perde: doenca,
 * pico no trabalho, festa de fim de ano, semana de prova. O prazo do intake e
 * "desejado", nao contratual.
 *
 * 0,70 e nao 0,60 nem 0,80 por um motivo verificavel: o criterio de sucesso
 * desta rodada e a razao final ficar entre 0,6 e 0,9, e 0,70 e o alvo que deixa
 * folga parecida para os dois lados do erro do modelo. Mirar 0,60 encostaria no
 * piso e transformaria qualquer subestimativa em reprovacao; mirar 0,80
 * encostaria no teto e faria o mesmo com qualquer superestimativa.
 */
export const FATOR_OCUPACAO = 0.7;

/**
 * Piso de um orcamento de secao. O schema exige no minimo 4 passos por secao e
 * no minimo MIN_STEP_HOURS por passo, entao uma secao viavel custa pelo menos
 * isto. Sem o piso, uma secao que herdasse orcamento zero (porque as anteriores
 * estouraram) receberia uma meta impossivel de cumprir, e o modelo resolveria
 * ignorando a instrucao inteira em vez de chegar perto dela.
 */
export const MINIMO_POR_SECAO = 4;

/**
 * Orcamento de horas da secao `sectionIndex`, calculado EM CODIGO.
 *
 * POR QUE ISTO EXISTE, e por que instruir melhor nao resolveria. Cada secao e
 * uma chamada independente a IA. O prompt de secao ja recebe as horas semanais
 * e o prazo (a primeira linha do contexto e "Disponibilidade"), e desde
 * 2026-08-05 tambem recebia a instrucao de caber nelas. Nao adiantou: medido em
 * 5 personas, o volume gerado ficou praticamente constante (223h a 325h,
 * amplitude de 1,46x) enquanto a disponibilidade variava 6x, e a relacao era
 * INVERSA (quem tinha 130h recebeu o plano mais pesado). O motivo e estrutural,
 * nao de redacao: nenhuma chamada sabe quanto as outras ja custaram, e um
 * orcamento global nao pode ser respeitado por chamadas que nao conversam. A
 * unica pessoa na conversa capaz de somar e o nosso codigo.
 *
 * AUTOCORRECAO. O loop de secoes e sequencial e escreve `children` no proprio
 * objeto `roadmap` antes da chamada seguinte, entao o que ja foi gerado esta
 * disponivel aqui. Em vez de dividir o total pelo numero de secoes uma vez so,
 * esta funcao divide o que SOBROU pelas secoes que FALTAM. Na primeira secao os
 * dois calculos dao o mesmo numero; a partir da segunda, um estouro inicial e
 * absorvido pelas seguintes em vez de propagar para o total. Divisao fixa
 * herdaria o defeito que a rodada anterior mediu: um erro no comeco vira erro
 * no fim, sem ninguem para notar.
 */
export function orcamentoDaSecao(
  roadmap: RoadmapV2,
  intake: Pick<RoadmapIntake, "hoursPerWeek" | "deadline">,
  sectionIndex: number,
): number | null {
  const semanas = SEMANAS_POR_PRAZO[intake.deadline] ?? null;
  const porSemana = HORAS_POR_SEMANA[intake.hoursPerWeek];
  // Sem prazo declarado nao existe orcamento. Devolve null, e quem chama omite
  // a instrucao inteira: um default silencioso aqui inventaria um teto que a
  // pessoa nunca declarou.
  if (semanas === null || typeof porSemana !== "number") return null;

  const secoes = roadmap.sections ?? [];
  if (sectionIndex < 0 || sectionIndex >= secoes.length) return null;

  const total = semanas * porSemana * FATOR_OCUPACAO;

  let gasto = 0;
  for (let i = 0; i < sectionIndex; i += 1) {
    const acc = { horas: 0, sem: 0, total: 0 };
    somar(secoes[i]?.children, acc);
    gasto += acc.horas;
  }

  const restante = Math.max(0, total - gasto);
  const secoesFaltando = secoes.length - sectionIndex;
  return Math.max(MINIMO_POR_SECAO, Math.round(restante / secoesFaltando));
}
