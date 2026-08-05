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
