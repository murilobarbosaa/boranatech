import { PRO_TOOL_ICONS } from "./proToolIcons";

export type ProToolId = keyof typeof PRO_TOOL_ICONS;

export interface ProToolDetail {
  title: string;
  description: string;
  bullets?: string[];
}

// Fonte UNICA dos textos de cada ferramenta/beneficio Pro (modais do hero de
// /planos e usos futuros). Descricoes escritas a partir do que cada ferramenta
// REALMENTE faz hoje (paginas e prompts reais), sem prometer capability que
// nao existe.
// TODO(Ana): revisar toda a copy deste arquivo (titulos, descricoes e bullets).
export const PRO_TOOL_DETAILS: Record<ProToolId, ProToolDetail> = {
  comparador: {
    title: "Comparador completo",
    description:
      "Coloque duas opções lado a lado antes de decidir seu caminho: graduações e faculdades, cursos, plataformas de estudo, áreas de TI e tecnologias.",
    bullets: [
      "Compara custo, tempo, dificuldade e mercado",
      "Certificação, pré-requisitos e indicações",
      "Uma categoria por vez, sem misturar alhos com bugalhos",
    ],
  },
  iaPessoal: {
    title: "Sua própria IA pessoal",
    description:
      "No Pro, o agente de IA deixa de ser um tira-dúvidas da plataforma e passa a conhecer você: seu perfil, seus objetivos e seu progresso.",
    bullets: [
      "Guias e próximos passos sob medida",
      "Acompanha sua jornada de perto",
      "Histórico de conversas salvo",
    ],
  },
  roadmapIA: {
    title: "Roadmap personalizado por IA",
    description:
      "Pra sua área, o caminho do zero ao primeiro emprego gerado sob medida pra sua realidade: seu tempo, seu nível e seu objetivo.",
    bullets: [
      "Etapas na ordem certa de estudo",
      "Adaptado ao seu ritmo e ponto de partida",
    ],
  },
  planoCarreira: {
    title: "Plano de carreira inteligente",
    description:
      "A rota da sua carreira montada pela IA: degraus na ordem certa, certificações que valem o preço e cronograma no seu ritmo.",
    bullets: [
      "Degraus com o que estudar em cada um",
      "Certificações com preço de referência",
      "Checklist de progresso",
    ],
  },
  projetosPortfolio: {
    title: "Sugestão de projetos pra portfólio",
    description:
      "Ideias de projetos alinhadas à sua área e ao seu nível pra fortalecer o portfólio, com sugestões do que praticar em seguida.",
  },
  simuladorEntrevistas: {
    title: "Simulador de entrevistas",
    description:
      "Entrevista simulada por chat, calibrada pela vaga ou pela sua área, com feedback honesto a cada resposta e um veredito final de preparo.",
    bullets: [
      "Perguntas calibradas pela vaga real",
      "Feedback resposta a resposta",
      "Veredito de preparo no final",
    ],
  },
  geradorCurriculo: {
    title: "Gerador de currículo",
    description:
      "Um chat coleta sua formação, experiências, projetos e habilidades e monta um currículo pronto, adaptado ao seu momento (estudante, iniciante ou júnior).",
    bullets: [
      "Estrutura certa pra quem está começando",
      "Currículo pronto pra baixar e usar",
    ],
  },
  avaliadorCurriculo: {
    title: "Avaliador de currículo",
    description:
      "Cola seu currículo e recebe feedback acionável em segundos: nota, lacunas, palavras-chave e melhorias priorizadas, bullet por bullet.",
    bullets: [
      "Nota e lacunas do seu currículo atual",
      "Bullets reescritos pra linguagem de recrutador",
    ],
  },
  avaliadorLinkedin: {
    title: "Avaliador de LinkedIn",
    description:
      "Headline, sobre e experiências analisados e traduzidos pra linguagem de recrutador, com nota, checklist e textos prontos pra usar.",
    bullets: [
      "Nota e checklist de recrutador",
      "Textos prontos pra headline e sobre",
    ],
  },
  avaliadorGithub: {
    title: "Avaliador de GitHub",
    description:
      "Manda seu GitHub e a IA aponta o que tá faltando, o que tá bom e o que rouba pontos do seu portfólio, com sugestão de README.",
    bullets: [
      "Análise repositório a repositório",
      "Sugestão de README pronta pra usar",
    ],
  },
  feedVagas: {
    title: "Feed de vagas",
    description:
      "Vagas reais de estágio, trainee e júnior reunidas de várias fontes (Brasil e internacional), com busca e vagas em destaque.",
    bullets: [
      "Filtros por nível, modalidade e contrato",
      "Atualizado com vagas de várias fontes",
    ],
  },
  personalizacao: {
    title: "Personalização de perfil",
    description:
      "Deixe seu perfil com a sua cara: foto de perfil, bordas animadas exclusivas e conquistas especiais que só assinantes desbloqueiam.",
    bullets: [
      "Foto de perfil na conta",
      "Bordas de perfil exclusivas",
      "Conquistas especiais Pro",
    ],
  },
  suporteWhatsapp: {
    title: "Suporte pelo WhatsApp",
    description:
      "Canal direto de suporte pelo WhatsApp, exclusivo pra assinantes. O suporte por e-mail continua disponível pra todo mundo.",
  },
};
