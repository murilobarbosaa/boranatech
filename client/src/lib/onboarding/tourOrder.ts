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
 * Nome curto de cada pagina, para o botao final do tour dizer para onde leva.
 *
 * NAO e texto novo: cada valor e o nome que o onboarding daquela rota ja
 * declara no proprio `ariaTitle`, sem o prefixo "Onboarding do Bora na Tech: ".
 * `tourOrder.test.ts` confere isso contra os arquivos de passos, entao mudar um
 * `ariaTitle` sem mudar aqui derruba o teste.
 *
 * Escrito, e nao derivado em tempo de execucao, porque derivar exigiria carregar
 * o modulo da PROXIMA rota (import dinamico, chunk proprio) so para pintar um
 * rotulo. O `Record` sobre a uniao literal de TOUR_ORDER cobre o outro lado: rota
 * nova na ordem sem rotulo aqui nao compila.
 */
export const TOUR_LABELS: Record<(typeof TOUR_ORDER)[number], string> = {
  "/": "Home",
  "/areas": "Áreas de TI",
  "/quiz-carreira": "Quiz de Carreira",
  "/faculdades": "Faculdades",
  "/tecnologias": "Tecnologias",
  "/tecnologias/por-area": "Mapa de Tecnologias",
  "/tecnologias/ranking": "Ranking de Tecnologias",
  "/dicionario": "Dicionário",
  "/roadmaps": "Roadmaps",
  "/roadmaps/ia": "Roadmap com IA",
  "/plano-carreira": "Plano de Carreira",
  "/cursos": "Cursos",
  "/plataformas": "Plataformas",
  "/projetos": "Projetos",
  "/ingles": "Inglês",
  "/ferramentas": "Ferramentas",
  "/ia": "Guia de IA",
  "/vagas": "Vagas",
  "/empresas": "Empresas",
  // Excecao ao ariaTitle, registrada em TOUR_LABELS_EXCECOES logo abaixo.
  "/entrevistas": "Entrevistas",
  "/curriculo/gerar": "Gerar Currículo",
  "/curriculo/analisar": "Avaliador de Currículo",
  "/linkedin/analisar": "Avaliador de LinkedIn",
  "/portfolio/analisar": "Avaliador de GitHub",
  "/evolucao": "Evolução de Carreira",
  "/salarios": "Salários",
  "/noticias": "Notícias",
  "/eventos": "Eventos",
  "/dicas": "Dicas",
  "/comunidades": "Comunidades",
  "/sobre": "Sobre nós",
  "/mentorias": "Mentorias e Ebooks",
  "/mulheres": "Mulheres",
};

/**
 * As UNICAS entradas de TOUR_LABELS que divergem do `ariaTitle` do onboarding
 * da rota, com o valor do qual elas divergem.
 *
 * Existe para a divergencia ser deliberada e verificavel, em vez de virar
 * "alguem digitou diferente". `tourOrder.test.ts` afirma as duas direcoes:
 *   - o `ariaTitle` da rota ainda e exatamente este valor (se ele mudar, o
 *     teste quebra e alguem decide de novo);
 *   - o rotulo ainda DIFERE dele (se o conteudo for corrigido para o plural, a
 *     excecao deixa de ser necessaria e o teste manda remove-la).
 *
 * Sem a segunda direcao, uma excecao resolvida apodreceria aqui em silencio.
 */
export const TOUR_LABELS_EXCECOES: Partial<
  Record<(typeof TOUR_ORDER)[number], string>
> = {
  // O onboarding se chama "Entrevista", no singular, e a pagina e /entrevistas.
  // No botao ("Próximo: ... →") o plural e o que le direito, e mexer no
  // `ariaTitle` sairia da transcricao dos 33 arquivos de design.
  "/entrevistas": "Entrevista",
};

/**
 * Texto do botao final DENTRO do tour, no lugar do cta do conteudo.
 *
 * O clique nesse botao leva para a proxima pagina da sequencia, e nao para onde
 * o cta do conteudo promete ("Ver as áreas da TI" em /areas levava para
 * /quiz-carreira). Aqui o rotulo passa a dizer o que o clique faz.
 *
 * Usa a MESMA `proximaRotaDoTour` que a navegacao usa, com o mesmo `jaViu`:
 * calcular o rotulo por outro caminho seria uma segunda fonte de verdade, capaz
 * de anunciar uma pagina e abrir outra. Sem proxima, o tour acaba aqui.
 */
export function ctaFinalDoTour(
  depoisDe: string | null,
  jaViu: (routeKey: string) => boolean,
): string {
  const proxima = proximaRotaDoTour(depoisDe, jaViu);
  if (!proxima) return "Concluir tour";
  return `Próximo: ${TOUR_LABELS[proxima]} →`;
}

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
): (typeof TOUR_ORDER)[number] | null {
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
