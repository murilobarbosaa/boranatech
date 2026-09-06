import type { ProjetoV2Detalhe } from "./types";

// TODO(Ana): revisar todo o texto deste modulo (piloto v2, nao aprovado)
const detalhe: ProjetoV2Detalhe = {
  id: "prd-feature-nova",
  tipoEntrega: "documento",
  briefing: {
    contexto:
      "Uma feature que ninguém escreveu direito custa semanas de retrabalho. O PRD, documento de requisitos de produto, é a ferramenta do PM para alinhar problema, solução, escopo e como saber se deu certo, antes de qualquer linha de código. Pegue um produto que você usa, escolha uma melhoria que faria, e escreva o PRD como se fosse entregá-lo amanhã para um time de desenvolvimento e design.",
    aprende: [
      "Formular um problema com evidência",
      "Separar solução de escopo (o que entra e o que não entra)",
      "Escrever histórias de usuário com critérios de aceite",
      "Definir métrica de sucesso e hipótese",
      "Escrever para engenharia e design lerem sem reunião",
    ],
    preRequisitos: [
      {
        rotulo: "Saber o que faz um Product Manager",
        href: "/roadmaps/produto",
      },
      {
        rotulo: "Saber o que é backlog e história de usuário",
        href: "/dicionario?termo=Backlog",
      },
      { rotulo: "Saber o que é MVP", href: "/dicionario?termo=MVP" },
    ],
    tempoEstimado: { horas: [5, 10], semanas: [1, 2] },
  },
  requisitos: [
    {
      id: "contexto",
      descricao: "Produto escolhido e persona alvo descritos em um parágrafo",
      verificacao: "Primeira seção do documento",
    },
    {
      id: "problema",
      descricao:
        "Problema com pelo menos uma evidência (dado, reclamação pública, observação própria)",
      verificacao: "Seção Problema com a evidência citada",
    },
    {
      id: "metrica",
      descricao: "Objetivo e uma métrica de sucesso com número alvo e prazo",
      verificacao: "Seção Objetivo com a métrica",
    },
    {
      id: "solucao",
      descricao:
        "Solução proposta em um parágrafo mais o fluxo em passos ou um esboço",
      verificacao: "Seção Solução com o fluxo",
    },
    {
      id: "escopo",
      descricao: "Escopo com listas explícitas de entra e não entra",
      verificacao: "As duas listas existem",
    },
    {
      id: "historias",
      descricao:
        "Pelo menos cinco histórias de usuário no formato como, quero, para",
      verificacao: "Seção Histórias com cinco ou mais",
    },
    {
      id: "criterios",
      descricao: "Cada história com critérios de aceite testáveis",
      verificacao:
        "Cada história tem pelo menos um critério em dado, quando, então ou equivalente",
    },
    {
      id: "riscos",
      descricao: "Riscos e perguntas em aberto listados",
      verificacao: "Seção Riscos",
    },
    {
      id: "publico",
      descricao:
        "Documento público (Notion, Google Docs com link de leitura, ou PDF) com no máximo quatro páginas",
      verificacao: "O link abre sem login",
    },
  ],
  etapas: [
    {
      id: "escolher",
      titulo: "Produto e problema",
      tempo: "1 h",
      oQueFazer: [
        "Escolha um produto que você usa toda semana e uma coisa que te irrita nele.",
        "Procure evidência: avaliações na loja, reclamações públicas, sua própria observação com data.",
      ],
      prontoQuando:
        "O problema está escrito em duas frases e tem uma evidência ao lado.",
    },
    {
      id: "metrica",
      titulo: "Objetivo e métrica",
      tempo: "30 min",
      oQueFazer: [
        "O que muda se der certo? Escolha um número que dá para medir e um prazo.",
      ],
      prontoQuando: "A métrica tem número alvo e data.",
    },
    {
      id: "solucao",
      titulo: "Solução e escopo",
      tempo: "1 a 2 h",
      oQueFazer: [
        "Descreva a solução em um parágrafo e o fluxo em passos.",
        "Liste o que entra e o que fica de fora desta versão.",
      ],
      prontoQuando: "Alguém lendo sabe o que vai e o que não vai ser feito.",
    },
    {
      id: "historias",
      titulo: "Histórias e critérios",
      tempo: "2 a 3 h",
      oQueFazer: [
        "Quebre a solução em histórias como, quero, para.",
        "Para cada uma, critérios de aceite que um QA conseguiria testar.",
      ],
      prontoQuando: "Cinco histórias, todas com critério.",
    },
    {
      id: "revisar",
      titulo: "Riscos, revisão e publicar",
      tempo: "1 h",
      oQueFazer: [
        "Liste riscos e perguntas abertas.",
        "Corte até caber em quatro páginas. Publique.",
      ],
      prontoQuando:
        "O link abre numa aba anônima e o documento tem no máximo quatro páginas.",
    },
  ],
  kit: [
    {
      tipo: "modelo",
      titulo: "Seções do PRD",
      nota: "Contexto e persona. Problema e evidência. Objetivo e métrica. Solução e fluxo. Escopo (entra, não entra). Histórias com critérios. Riscos e perguntas abertas.",
    },
    {
      tipo: "modelo",
      titulo: "História com critérios",
      nota: "Como [persona], quero [ação] para [resultado]. Critérios: Dado [contexto], quando [ação], então [resultado observável]. Um critério por comportamento.",
    },
    {
      tipo: "checklist",
      titulo: "O time consegue começar?",
      nota: "Dá para estimar sem reunião? Está claro o que fica de fora? Cada história tem como saber que acabou? A métrica tem número? Cabe em quatro páginas?",
    },
    {
      tipo: "modelo",
      titulo: "Exemplo de métrica",
      nota: "Aumentar de 62% para 75% a taxa de conclusão do cadastro em 60 dias após o lançamento. Evitar métrica de vaidade (downloads, cliques) sem ligação com o problema.",
    },
  ],
  ajuda: {
    trilha: {
      slug: "produto",
      nodeIds: [
        "fundamentos.mentalidade",
        "backlog.historias",
        "especificacao.prd",
        "metricas.northstar",
      ],
    },
    termos: ["Backlog", "MVP", "Métrica", "KPI"],
  },
  verificacaoAutomatica: ["artefato_responde"],
};

export default detalhe;
