// Ordem canonica do TOUR GUIADO.
//
// E a numeracao dos arquivos de design/onboardings/, nao a ordem do registry
// (que segue o <Switch> do App.tsx) nem a do menu. O material foi desenhado
// como uma sequencia: 01 apresenta a plataforma, 02 as areas, 03 o quiz, e
// assim por diante ate 33. Quem escolheu "me mostra cada aba" no card 5 da home
// esta pedindo exatamente essa sequencia.
//
// Lista LITERAL e ordenada, nao derivada do registry: derivar dela colocaria a
// ordem a reboque do arquivo de rotas, que muda por outros motivos. O teste
// `tourOrder.test.ts` afirma que toda entrada daqui tem onboarding portado e
// que o total bate.

export const TOUR_ORDER = [
  "/", // 01_Home_1
  "/areas", // 02_Areas
  "/quiz-carreira", // 03_QuizCarreira
  "/faculdades", // 04_Faculdades
  "/tecnologias", // 05_Tecnologias
  "/tecnologias/por-area", // 06_MapaTecnologias
  "/tecnologias/ranking", // 07_RankingTecnologias
  "/dicionario", // 08_Dicionario
  "/roadmaps", // 09_Roadmaps
  "/roadmaps/ia", // 10_RoadmapIA
  "/plano-carreira", // 11_PlanoCarreira
  "/cursos", // 12_Cursos
  "/plataformas", // 13_Plataformas
  "/projetos", // 14_Projetos
  "/ingles", // 15_Ingles
  "/ferramentas", // 16_Ferramentas
  "/ia", // 17_GuiaIA
  "/vagas", // 18_Vagas
  "/empresas", // 19_Empresas
  "/entrevistas", // 20_Entrevistas
  "/curriculo/gerar", // 21_CurriculoGerar
  "/curriculo/analisar", // 22_CurriculoAnalisar
  "/linkedin/analisar", // 23_LinkedinAnalisar
  "/portfolio/analisar", // 24_PortfolioAnalisar
  "/evolucao", // 25_Evolucao
  "/salarios", // 26_Salarios
  "/noticias", // 27_Noticias
  "/eventos", // 28_Eventos
  "/dicas", // 29_Dicas
  "/comunidades", // 30_Comunidades
  "/sobre", // 31_Sobre
  "/mentorias", // 32_Mentorias
  "/mulheres", // 33_Mulheres
] as const;

/**
 * Total afirmado, mesmo contrato de EXPECTED_TABLE_COUNT: mudar este numero e
 * ato deliberado, no commit que acrescenta o onboarding novo a sequencia.
 */
export const EXPECTED_TOUR_LENGTH = 33;

/**
 * Proxima rota da sequencia depois de `depoisDe`, pulando o que ja foi visto.
 *
 * `depoisDe = null` comeca do inicio. Devolve null quando nao ha mais nada, o
 * que e o fim do tour.
 *
 * Rota FORA da ordem (a pessoa navegou para algum lugar por conta propria no
 * meio do tour) tambem devolve null: retomar de um ponto que a sequencia nao
 * conhece seria adivinhar. Quem trata isso e o host, que so retoma quando cai
 * numa rota da ordem.
 */
export function proximaRotaDoTour(
  depoisDe: string | null,
  jaViu: (routeKey: string) => boolean,
): string | null {
  let inicio = 0;
  if (depoisDe !== null) {
    const at = TOUR_ORDER.indexOf(depoisDe as (typeof TOUR_ORDER)[number]);
    if (at < 0) return null;
    inicio = at + 1;
  }
  for (let i = inicio; i < TOUR_ORDER.length; i += 1) {
    if (!jaViu(TOUR_ORDER[i])) return TOUR_ORDER[i];
  }
  return null;
}

/** A rota participa da sequencia do tour? */
export function estaNaOrdemDoTour(routeKey: string): boolean {
  return (TOUR_ORDER as readonly string[]).includes(routeKey);
}
