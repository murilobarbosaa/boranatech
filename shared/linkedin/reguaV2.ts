import type { LinkedinCheckTier, LinkedinLevel } from "./schema";

/**
 * Régua v2 do analisador de LinkedIn: as quatro decisões que mudam nota.
 *
 * Módulo puro e separado de propósito. Cada função aqui é um número que a
 * simulação sobre as 107 análises persistidas mediu antes de virar código, e
 * cada uma tem teste de fronteira em `linkedinFronteiras.test.ts`.
 */

// ---------------------------------------------------------------------------
// 1. COBERTURA: variante C
// ---------------------------------------------------------------------------

/**
 * Cortes de cobertura de tecnologias-chave, por tamanho da pool da área.
 *
 * A régua v1 usava razão fixa (50% e 75% de TODAS as tecnologias da área) e não
 * classificava ninguém: 1 das 107 aprovava o essencial e 0 aprovavam o ótimo.
 * Em `backend`, 50% de 64 são 32 tecnologias comprovadas no perfil, o que não
 * acontece.
 *
 * A contagem absoluta pura (6 e 10) conserta isso e cria um problema pior nas
 * áreas de pool pequena: `analise-sistemas` tem 3 tecnologias no total, então o
 * essencial em 6 é **impossível**, e a impossibilidade é INVISÍVEL no placar,
 * porque esses perfis já reprovavam. Três áreas ficariam com o check essencial
 * inalcançável e cinco com o ótimo.
 *
 * Variante C: o corte é o mínimo entre o absoluto e a proporção, então nunca
 * passa do tamanho da pool. Mais a trava `ótima >= essencial + 1`, que não
 * dispara com nenhuma pool real de hoje e existe para a pool que encolher: com
 * pool 1, sem ela, os dois checks virariam o mesmo número e nunca se
 * diferenciariam.
 */
export function cortesDeCobertura(pool: number): {
  essencial: number;
  otima: number;
} {
  const essencial = Math.min(6, Math.ceil(pool / 2));
  const otima = Math.max(essencial + 1, Math.min(10, Math.ceil(pool * 0.75)));
  return { essencial, otima };
}

// ---------------------------------------------------------------------------
// 2. LIMIARES DE DENSIDADE POR NÍVEL
// ---------------------------------------------------------------------------

/**
 * Níveis que recebem régua de densidade mais leve.
 *
 * Estágio, trainee e júnior porque a exigência de volume de texto mede tempo de
 * carreira, não qualidade de perfil. Transição pelo mesmo motivo: a pessoa pode
 * ter vinte anos de experiência e três meses de história na área nova.
 */
const NIVEL_LEVE: ReadonlySet<LinkedinLevel> = new Set<LinkedinLevel>([
  "estagio",
  "trainee",
  "junior",
  "transicao",
]);

export interface LimiaresDensidade {
  /** Mínimo de caracteres da seção Sobre para `sobre-tamanho`. */
  sobreMin: number;
  /** Máximo da seção Sobre. Não muda por nível: texto longo demais cansa igual. */
  sobreMax: number;
  /**
   * Mínimo de caracteres da descrição de CADA experiência.
   * Ver `expDescricoesPorItem`.
   */
  descricaoPorExperiencia: number;
}

/**
 * Valores, e a base de cada um. Medido sobre as 107 análises persistidas e
 * sobre as 6 fixtures.
 *
 *   `sobreMin` 500 -> 300 no leve. Base: das 75 análises de nível leve com
 *   Sobre preenchido, 70 já passam em 500 e 73 passam em 300. O corte leve
 *   recupera 3 perfis cujo Sobre tem entre 300 e 500 caracteres, que é um Sobre
 *   curto e real, não um Sobre ausente. `sobreMax` fica em 2200 para os dois:
 *   o máximo observado em toda a base é 2168, então o teto não está apertando
 *   ninguém e mexer nele seria mexer no escuro.
 *
 *   `descricaoPorExperiencia` 100 no padrão, 50 no leve. Base: 100 é o valor
 *   que a v1 já usava, só que somando TODAS as descrições; aplicá-lo por item é
 *   endurecer, e endurecer para quem está começando não é o objetivo. 50 fica
 *   abaixo da menor descrição legítima medida no corpus (56 caracteres,
 *   "Atendimento ao cliente e organizacao do estoque da loja."), então nenhuma
 *   descrição real observada reprova no nível leve.
 *
 *   `exp-resultados` NAO entra: ele nao tem limiar numerico para afrouxar,
 *   pergunta se ha numero nas descricoes, e a resposta e sim ou nao. Afrouxar
 *   viraria auto-aprovacao, ou seja, um card dizendo "Descricoes com numeros"
 *   num perfil sem numero. Esta regua v2 existe justamente para acabar com esse
 *   tipo de card, entao afrouxar aqui contradiria o proprio release.
 */
export function limiaresDensidade(nivel: LinkedinLevel): LimiaresDensidade {
  return NIVEL_LEVE.has(nivel)
    ? {
        sobreMin: 300,
        sobreMax: 2200,
        descricaoPorExperiencia: 50,
      }
    : {
        sobreMin: 500,
        sobreMax: 2200,
        descricaoPorExperiencia: 100,
      };
}

// ---------------------------------------------------------------------------
// 3. CHECKS POR ITEM NAS EXPERIÊNCIAS
// ---------------------------------------------------------------------------

export interface VeredictoPorItem {
  aprovado: boolean;
  /** Índices (base 1) das experiências sem descrição própria suficiente. */
  reprovadas: number[];
  total: number;
}

/**
 * `exp-descricoes` deixa de olhar o bloco concatenado e passa a olhar cada
 * experiência.
 *
 * Por que muda: o agregado somava todas as descrições e comparava com 100
 * caracteres, então uma experiência vazia no meio de quatro cheias passava
 * despercebida e o card dizia "critérios ok" para um perfil com buraco. O card
 * estava falso, e a nota estava alta pelo motivo errado.
 *
 * A decisão é pela correção, não pelo número: uma experiência sem descrição
 * própria é um fato do perfil, e o relatório tem que dizer QUAL.
 */
export function expDescricoesPorItem(
  tamanhos: readonly number[],
  minimoPorItem: number,
): VeredictoPorItem {
  const reprovadas = tamanhos
    .map((n, i) => (n < minimoPorItem ? i + 1 : 0))
    .filter((i) => i > 0);
  return { aprovado: tamanhos.length > 0 && reprovadas.length === 0, reprovadas, total: tamanhos.length };
}

// ---------------------------------------------------------------------------
// 4. TETO DOS SINAIS AUTODECLARADOS
// ---------------------------------------------------------------------------

/**
 * Peso máximo que a categoria `sinais` pode somar no denominador da nota.
 *
 * Os cinco checks de sinais (foto, banner, open to work, conexões, atividade)
 * são AUTODECLARADOS: a plataforma não lê nenhum deles do PDF, ela pergunta no
 * formulário e acredita. Na v1 eles somam 28 de 194 pontos possíveis, ou
 * **14,4% da nota**, e um deles é `essencial`, o mesmo tier de "ter headline".
 *
 * 12 é pouco mais que um check essencial verificado (10). A regra que o número
 * expressa: o conjunto inteiro do que a pessoa declara sobre si vale um pouco
 * mais que um único fato que a ferramenta conseguiu conferir, e menos que dois.
 *
 * O tier de cada check NÃO muda: ele continua governando a apresentação e a
 * ordem no relatório. O que muda é o peso efetivo no cálculo.
 */
export const TETO_SINAIS = 12;

/**
 * Peso efetivo de um check no cálculo da nota.
 *
 * Sinais são escalados proporcionalmente para caber em `TETO_SINAIS`. Isso mexe
 * no DENOMINADOR e portanto desloca a nota de todo mundo, inclusive de quem não
 * mudou nada: está quantificado isolado em `docs/simulacao-regua-v2.md`.
 */
export function pesoEfetivo(
  tier: LinkedinCheckTier,
  category: string,
  pesoBase: number,
  somaSinaisBase: number,
): number {
  if (category !== "sinais" || somaSinaisBase <= TETO_SINAIS) return pesoBase;
  return (pesoBase * TETO_SINAIS) / somaSinaisBase;
}

/**
 * A mudança entre duas análises veio SÓ de autodeclaração?
 *
 * Quando sim, delta e celebração ficam suprimidos: subir de faixa por ter
 * marcado "sim, tenho banner" seria a plataforma parabenizando a pessoa por
 * responder um formulário, não por melhorar o perfil.
 */
export function mudancaSoDeAutodeclaracao(
  antes: readonly { id: string; category: string; aprovado: boolean }[],
  depois: readonly { id: string; category: string; aprovado: boolean }[],
): boolean {
  const mapa = new Map(antes.map((c) => [c.id, c.aprovado]));
  const mudaram = depois.filter(
    (c) => mapa.has(c.id) && mapa.get(c.id) !== c.aprovado,
  );
  return mudaram.length > 0 && mudaram.every((c) => c.category === "sinais");
}
