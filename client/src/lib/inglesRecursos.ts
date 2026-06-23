export type EnglishNivel = "Comecando" | "Intermediario" | "Avancado";
export type EnglishObjetivo =
  | "Conversar"
  | "Ler documentacao e codigo"
  | "Entrevista internacional"
  | "Passar em um exame";

export interface RecursoIngles {
  nome: string;
  url: string;
  subarea: string;
  nivel: EnglishNivel | "Todos";
  objetivo: EnglishObjetivo[];
  gratuito: boolean;
  desc: string;
}

export const NIVEIS_INGLES: EnglishNivel[] = [
  "Comecando",
  "Intermediario",
  "Avancado",
];

export const OBJETIVOS_INGLES: EnglishObjetivo[] = [
  "Conversar",
  "Ler documentacao e codigo",
  "Entrevista internacional",
  "Passar em um exame",
];

export const SUBAREAS_INGLES = [
  "Plataformas e cursos",
  "Conversacao",
  "Ingles pra tech",
  "Ferramentas",
  "Podcasts",
];

export const recursosIngles: RecursoIngles[] = [
  {
    "nome": "Duolingo",
    "url": "https://www.duolingo.com",
    "subarea": "Plataformas e cursos",
    "nivel": "Comecando",
    "objetivo": [
      "Conversar"
    ],
    "gratuito": true,
    "desc": "App gamificado de licoes curtas pra quem ta comecando do zero no ingles."
  },
  {
    "nome": "BBC Learning English",
    "url": "https://www.bbc.co.uk/learningenglish",
    "subarea": "Plataformas e cursos",
    "nivel": "Todos",
    "objetivo": [
      "Conversar",
      "Passar em um exame"
    ],
    "gratuito": true,
    "desc": "Cursos, videos e audios gratuitos da BBC com sotaque britanico e legendas."
  },
  {
    "nome": "British Council LearnEnglish",
    "url": "https://learnenglish.britishcouncil.org",
    "subarea": "Plataformas e cursos",
    "nivel": "Todos",
    "objetivo": [
      "Conversar",
      "Passar em um exame"
    ],
    "gratuito": true,
    "desc": "Plataforma gratuita do British Council com exercicios por nivel e teste de proficiencia."
  },
  {
    "nome": "VOA Learning English",
    "url": "https://learningenglish.voanews.com",
    "subarea": "Plataformas e cursos",
    "nivel": "Comecando",
    "objetivo": [
      "Conversar"
    ],
    "gratuito": true,
    "desc": "Noticias em ingles americano faladas mais devagar pra treinar escuta de quem ta iniciando."
  },
  {
    "nome": "Cambridge English",
    "url": "https://www.cambridgeenglish.org",
    "subarea": "Plataformas e cursos",
    "nivel": "Todos",
    "objetivo": [
      "Passar em um exame"
    ],
    "gratuito": false,
    "desc": "Site oficial dos exames de Cambridge com materiais e provas reconhecidas mundialmente."
  },
  {
    "nome": "FutureLearn",
    "url": "https://www.futurelearn.com",
    "subarea": "Plataformas e cursos",
    "nivel": "Intermediario",
    "objetivo": [
      "Ler documentacao e codigo",
      "Passar em um exame"
    ],
    "gratuito": true,
    "desc": "Cursos online de universidades, varios gratuitos, otimos pra estudar ingles em contexto de area."
  },
  {
    "nome": "ESOL Courses",
    "url": "https://www.esolcourses.com",
    "subarea": "Plataformas e cursos",
    "nivel": "Todos",
    "objetivo": [
      "Conversar",
      "Passar em um exame"
    ],
    "gratuito": true,
    "desc": "Recursos gratuitos de ingles organizados por nivel, do iniciante ao avancado, com jogos e quizzes."
  },
  {
    "nome": "Busuu",
    "url": "https://www.busuu.com",
    "subarea": "Plataformas e cursos",
    "nivel": "Comecando",
    "objetivo": [
      "Conversar"
    ],
    "gratuito": true,
    "desc": "Licoes curtas com correcao de nativos da comunidade pra praticar do basico ao intermediario."
  },
  {
    "nome": "italki",
    "url": "https://www.italki.com",
    "subarea": "Conversacao",
    "nivel": "Todos",
    "objetivo": [
      "Conversar",
      "Entrevista internacional"
    ],
    "gratuito": false,
    "desc": "Marketplace pra agendar aulas particulares de conversacao com professores nativos."
  },
  {
    "nome": "Cambly",
    "url": "https://www.cambly.com",
    "subarea": "Conversacao",
    "nivel": "Todos",
    "objetivo": [
      "Conversar",
      "Entrevista internacional"
    ],
    "gratuito": false,
    "desc": "Conversa ao vivo com falantes nativos a qualquer hora, em sessoes individuais ou em grupo."
  },
  {
    "nome": "Tandem",
    "url": "https://www.tandem.net",
    "subarea": "Conversacao",
    "nivel": "Todos",
    "objetivo": [
      "Conversar"
    ],
    "gratuito": true,
    "desc": "App de intercambio de idiomas onde voce troca conversa com nativos por texto, audio e video."
  },
  {
    "nome": "HelloTalk",
    "url": "https://www.hellotalk.com",
    "subarea": "Conversacao",
    "nivel": "Todos",
    "objetivo": [
      "Conversar"
    ],
    "gratuito": true,
    "desc": "App gratuito de troca de idiomas pra conversar com nativos e ensinar portugues em troca."
  },
  {
    "nome": "MDN Web Docs",
    "url": "https://developer.mozilla.org",
    "subarea": "Ingles pra tech",
    "nivel": "Intermediario",
    "objetivo": [
      "Ler documentacao e codigo"
    ],
    "gratuito": true,
    "desc": "Documentacao de referencia de HTML, CSS e JavaScript pra treinar leitura tecnica em ingles."
  },
  {
    "nome": "freeCodeCamp",
    "url": "https://www.freecodecamp.org",
    "subarea": "Ingles pra tech",
    "nivel": "Comecando",
    "objetivo": [
      "Ler documentacao e codigo"
    ],
    "gratuito": true,
    "desc": "Curriculo gratuito de programacao em ingles que ensina codigo construindo projetos no navegador."
  },
  {
    "nome": "DEV Community",
    "url": "https://dev.to",
    "subarea": "Ingles pra tech",
    "nivel": "Intermediario",
    "objetivo": [
      "Ler documentacao e codigo"
    ],
    "gratuito": true,
    "desc": "Comunidade de devs com artigos e tutoriais em ingles pra acostumar a ler conteudo da area."
  },
  {
    "nome": "Stack Overflow",
    "url": "https://stackoverflow.com",
    "subarea": "Ingles pra tech",
    "nivel": "Intermediario",
    "objetivo": [
      "Ler documentacao e codigo"
    ],
    "gratuito": true,
    "desc": "Site de perguntas e respostas de programacao onde se treina vocabulario tecnico em ingles."
  },
  {
    "nome": "Cambridge Dictionary",
    "url": "https://dictionary.cambridge.org",
    "subarea": "Ferramentas",
    "nivel": "Todos",
    "objetivo": [
      "Conversar",
      "Ler documentacao e codigo",
      "Passar em um exame"
    ],
    "gratuito": true,
    "desc": "Dicionario de ingles com definicoes simples, audio de pronuncia e exemplos de uso real."
  },
  {
    "nome": "WordReference",
    "url": "https://www.wordreference.com",
    "subarea": "Ferramentas",
    "nivel": "Todos",
    "objetivo": [
      "Conversar",
      "Ler documentacao e codigo"
    ],
    "gratuito": true,
    "desc": "Dicionario e tradutor com forum ativo pra tirar duvidas de traducao entre idiomas."
  },
  {
    "nome": "YouGlish",
    "url": "https://youglish.com",
    "subarea": "Ferramentas",
    "nivel": "Todos",
    "objetivo": [
      "Conversar",
      "Entrevista internacional"
    ],
    "gratuito": true,
    "desc": "Mostra como nativos pronunciam qualquer palavra usando trechos reais de videos."
  },
  {
    "nome": "Anki",
    "url": "https://apps.ankiweb.net",
    "subarea": "Ferramentas",
    "nivel": "Todos",
    "objetivo": [
      "Conversar",
      "Passar em um exame"
    ],
    "gratuito": true,
    "desc": "App de flashcards com repeticao espacada pra fixar vocabulario sem esquecer."
  },
  {
    "nome": "Grammarly",
    "url": "https://www.grammarly.com",
    "subarea": "Ferramentas",
    "nivel": "Todos",
    "objetivo": [
      "Ler documentacao e codigo",
      "Entrevista internacional"
    ],
    "gratuito": true,
    "desc": "Assistente de escrita que corrige gramatica e tom de textos em ingles na hora."
  },
  {
    "nome": "6 Minute English (BBC)",
    "url": "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english",
    "subarea": "Podcasts",
    "nivel": "Intermediario",
    "objetivo": [
      "Conversar"
    ],
    "gratuito": true,
    "desc": "Podcast semanal da BBC com episodios de seis minutos sobre um tema e vocabulario novo."
  },
  {
    "nome": "The English We Speak (BBC)",
    "url": "https://www.bbc.co.uk/learningenglish/english/features/the-english-we-speak",
    "subarea": "Podcasts",
    "nivel": "Intermediario",
    "objetivo": [
      "Conversar"
    ],
    "gratuito": true,
    "desc": "Programa curto da BBC que explica uma giria ou expressao do dia a dia por semana."
  }
];

function nivelRank(itemNivel: RecursoIngles["nivel"], target: EnglishNivel): number {
  if (itemNivel === target) return 0;
  if (itemNivel === "Todos") return 1;
  return 2;
}

export function montarTrilha(
  nivel: EnglishNivel,
  objetivo: EnglishObjetivo,
): RecursoIngles[] {
  const pool = recursosIngles
    .filter((item) => item.objetivo.includes(objetivo))
    .sort((a, b) => nivelRank(a.nivel, nivel) - nivelRank(b.nivel, nivel));
  return pool.slice(0, 5);
}
