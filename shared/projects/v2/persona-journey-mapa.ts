import type { ProjetoV2Detalhe } from "./types";

// TODO(Ana): revisar todo o texto deste modulo (piloto v2, nao aprovado)
const detalhe: ProjetoV2Detalhe = {
  id: "persona-journey-mapa",
  tipoEntrega: "figma",
  briefing: {
    contexto:
      "Antes de desenhar uma tela, quem faz UX precisa saber para quem ela é e o que essa pessoa está tentando fazer. Persona e mapa de jornada são as duas ferramentas que transformam 'os usuários' em uma pessoa com nome, rotina e frustração. Escolha um serviço que você usa (o app do banco, o site da faculdade, o delivery) e documente a experiência de alguém real com ele, com evidência e não com achismo.",
    aprende: [
      "Construir uma persona a partir de evidência",
      "Mapear etapas, ações, emoções e pontos de dor",
      "Identificar oportunidades ligadas a dores específicas",
      "Apresentar pesquisa de forma visual no Figma ou FigJam",
      "Sintetizar conversas curtas com pessoas reais",
    ],
    preRequisitos: [
      {
        rotulo: "Ter uma conta no Figma (o plano gratuito serve)",
        href: "/roadmaps/uxui",
      },
      {
        rotulo: "Saber a diferença entre UX e UI",
        href: "/dicionario?termo=UX",
      },
      {
        rotulo: "Saber o que é uma persona",
        href: "/dicionario?termo=Persona",
      },
    ],
    tempoEstimado: { horas: [6, 12], semanas: [1, 2] },
  },
  requisitos: [
    {
      id: "contexto",
      descricao:
        "Serviço escolhido e objetivo da pessoa declarados no topo do arquivo",
      verificacao: "Primeira página do arquivo tem o serviço e o objetivo",
    },
    {
      id: "evidencia",
      descricao:
        "Pelo menos três conversas curtas com pessoas reais (ou três respostas de formulário), resumidas numa página de evidências",
      verificacao: "Página Evidências com três resumos",
    },
    {
      id: "persona",
      descricao:
        "Persona com nome, contexto, objetivo, frustração e uma frase que ela diria",
      verificacao: "Página Persona com os cinco campos",
    },
    {
      id: "jornada",
      descricao:
        "Jornada com pelo menos cinco etapas, cada uma com ação, pensamento ou emoção e ponto de contato",
      verificacao: "Página Jornada com as colunas",
    },
    {
      id: "curva",
      descricao:
        "Curva de emoção visível ao longo da jornada, com pelo menos um ponto alto e um baixo",
      verificacao: "Linha ou ícones de emoção na jornada",
    },
    {
      id: "oportunidades",
      descricao:
        "Pelo menos três oportunidades, cada uma ligada a uma dor específica da jornada",
      verificacao: "Página Oportunidades com a ligação explícita",
    },
    {
      id: "publico",
      descricao:
        "Arquivo público no Figma ou FigJam, com as páginas nomeadas: Evidências, Persona, Jornada, Oportunidades",
      verificacao: "O link abre sem login e mostra as quatro páginas",
    },
    {
      id: "aprendizado",
      descricao:
        "Texto curto, de até cinco linhas, com o que você aprendeu fazendo",
      verificacao: "Na última página ou na descrição da entrega",
    },
  ],
  etapas: [
    {
      id: "escolher",
      titulo: "Escolher e recrutar",
      tempo: "1 h",
      oQueFazer: [
        "Escolha um serviço que você usa e uma tarefa concreta dentro dele (pagar um boleto, pedir um lanche, matricular numa disciplina).",
        "Combine três conversas de 10 minutos com pessoas que fazem essa tarefa.",
      ],
      prontoQuando: "Três pessoas confirmadas e o roteiro pronto.",
    },
    {
      id: "conversar",
      titulo: "Conversar",
      tempo: "1 a 2 h",
      oQueFazer: [
        "Use o roteiro do kit. Pergunte o que aconteceu da última vez, não o que a pessoa acha.",
        "Anote frases literais.",
      ],
      prontoQuando:
        "Três resumos na página Evidências, com pelo menos uma frase literal cada.",
    },
    {
      id: "persona",
      titulo: "Persona",
      tempo: "1 a 2 h",
      oQueFazer: [
        "Monte a persona a partir do que ouviu. Cada afirmação aponta para uma evidência.",
      ],
      prontoQuando:
        "Ninguém consegue apontar um campo da persona que não venha de uma conversa.",
    },
    {
      id: "jornada",
      titulo: "Jornada",
      tempo: "2 a 4 h",
      oQueFazer: [
        "Etapas em colunas; ação, pensamento, emoção e ponto de contato em linhas.",
        "Desenhe a curva de emoção.",
      ],
      prontoQuando: "Dá para ver onde a experiência sobe e onde desce.",
    },
    {
      id: "oportunidades",
      titulo: "Oportunidades e publicar",
      tempo: "1 h",
      oQueFazer: [
        "Para cada ponto baixo, uma oportunidade concreta.",
        "Nomeie as páginas, torne o arquivo público, escreva o aprendizado.",
      ],
      prontoQuando: "O link abre numa aba anônima com as quatro páginas.",
    },
  ],
  kit: [
    {
      tipo: "modelo",
      titulo: "Roteiro da conversa (10 minutos)",
      nota: "Me conta a última vez que você fez [a tarefa]. O que você fez primeiro? Onde travou? O que sentiu nesse momento? O que fez depois? Se pudesse mudar uma coisa, qual seria?",
    },
    {
      tipo: "modelo",
      titulo: "Campos da persona",
      nota: "Nome e idade fictícios. Contexto (rotina, dispositivo, frequência de uso). Objetivo com o serviço. Principal frustração. Uma frase que ela diria. Cada campo com a evidência de onde veio.",
    },
    {
      tipo: "modelo",
      titulo: "Colunas da jornada",
      nota: "Etapa. O que a pessoa faz. O que pensa ou sente. Ponto de contato (tela, notificação, atendente). Dor ou momento bom. Oportunidade.",
    },
    {
      tipo: "link",
      titulo: "Templates no Figma Community",
      url: "https://www.figma.com/community",
      nota: "Procure por journey map e persona. Use como base, mas o conteúdo tem que ser o seu.",
    },
    {
      tipo: "checklist",
      titulo: "Regra de ouro",
      nota: "Cada afirmação sobre a pessoa aponta para uma conversa. Se não aponta, é achismo e sai.",
    },
  ],
  ajuda: {
    trilha: {
      slug: "uxui",
      nodeIds: [
        "pesquisa.metodos",
        "pesquisa.persona",
        "pesquisa.jornada",
        "figma.ferramenta",
      ],
    },
    termos: ["UX", "Persona", "Jornada do usuário"],
  },
  verificacaoAutomatica: ["artefato_responde"],
};

export default detalhe;
