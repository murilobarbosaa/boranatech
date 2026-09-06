import type { ProjetoV2Detalhe } from "./types";

// TODO(Ana): revisar todo o texto deste modulo (piloto v2, nao aprovado)
const detalhe: ProjetoV2Detalhe = {
  id: "analise-dados-publicos",
  tipoEntrega: "notebook",
  briefing: {
    contexto:
      "Uma prefeitura, um hospital, um time de marketing: todo mundo tem dados e quase ninguém tem quem os leia. Este projeto é o retrato de uma análise de verdade: você pega um dataset público, limpa, faz perguntas, responde com gráficos e escreve o que descobriu como se fosse para alguém que decide. É o notebook que quem recruta em dados abre primeiro no seu portfólio.",
    aprende: [
      "Carregar e inspecionar dados com Pandas",
      "Limpar nulos, duplicatas e tipos",
      "Responder perguntas com filtros e groupby",
      "Visualizar com Matplotlib ou Seaborn",
      "Escrever conclusões que outra pessoa entende",
    ],
    preRequisitos: [
      { rotulo: "Python básico", href: "/roadmaps/dados" },
      {
        rotulo: "Conhecer o DataFrame do Pandas",
        href: "/dicionario?termo=Pandas",
      },
      {
        rotulo: "Saber usar um notebook (Jupyter, Colab ou Kaggle)",
        href: "/dicionario?termo=Notebook",
      },
    ],
    tempoEstimado: { horas: [10, 20], semanas: [1, 3] },
  },
  requisitos: [
    {
      id: "dataset",
      descricao:
        "Dataset público identificado no início, com link da fonte e descrição das colunas usadas",
      verificacao: "Primeira seção do notebook tem o link e a descrição",
    },
    {
      id: "perguntas",
      descricao: "Pelo menos 3 perguntas escritas antes das análises",
      verificacao: "Seção de perguntas visível antes dos gráficos",
    },
    {
      id: "limpeza",
      descricao:
        "Seção de limpeza dizendo o que foi feito (nulos, duplicatas, tipos) e quantas linhas sobraram",
      verificacao: "Seção de limpeza com contagem antes e depois",
    },
    {
      id: "graficos",
      descricao:
        "Pelo menos 4 gráficos, cada um com título, eixos nomeados e legenda quando houver mais de uma série",
      verificacao: "Os gráficos aparecem renderizados no notebook publicado",
    },
    {
      id: "leitura",
      descricao:
        "Cada gráfico é seguido de 1 a 3 frases dizendo o que ele mostra",
      verificacao: "Célula de texto após cada gráfico",
    },
    {
      id: "conclusoes",
      descricao:
        "Seção final com 3 a 5 conclusões, cada uma ligada a uma pergunta",
      verificacao: "Seção de conclusões no fim",
    },
    {
      id: "roda-inteiro",
      descricao: "O notebook roda de cima a baixo sem erro (Restart e Run All)",
      verificacao:
        "Notebook publicado sem célula de erro e com as saídas presentes",
    },
    {
      id: "publicado",
      descricao:
        "Publicado no Kaggle, no Colab (link público) ou no GitHub com o notebook renderizado",
      verificacao: "O link abre sem login e mostra as saídas",
    },
  ],
  etapas: [
    {
      id: "escolher",
      titulo: "Escolher e perguntar",
      tempo: "1 a 2 h",
      oQueFazer: [
        "Escolha um dataset de um tema que você tem curiosidade, com pelo menos algumas mil linhas e uma coluna de data ou categoria.",
        "Escreva 3 perguntas que valeria a pena responder.",
      ],
      prontoQuando: "As perguntas estão escritas na primeira célula.",
    },
    {
      id: "limpar",
      titulo: "Limpar",
      tempo: "2 a 4 h",
      oQueFazer: [
        "info, describe, isna, duplicated: entenda o que está sujo.",
        "Trate nulos e tipos, e registre quantas linhas entraram e saíram.",
      ],
      prontoQuando:
        "O DataFrame limpo está pronto e a seção de limpeza explica cada decisão.",
    },
    {
      id: "explorar",
      titulo: "Explorar",
      tempo: "3 a 5 h",
      oQueFazer: [
        "Para cada pergunta, um groupby, um filtro ou uma tabela que responda.",
        "Anote os números que vão virar conclusão.",
      ],
      prontoQuando: "Cada pergunta tem uma tabela ou número que a responde.",
    },
    {
      id: "visualizar",
      titulo: "Visualizar",
      tempo: "2 a 4 h",
      oQueFazer: [
        "Um gráfico por pergunta, mais um de contexto. Título, eixos e legenda em todos.",
        "Depois de cada gráfico, escreva o que ele mostra.",
      ],
      prontoQuando: "Quatro gráficos legíveis, cada um com sua leitura.",
    },
    {
      id: "concluir",
      titulo: "Concluir e publicar",
      tempo: "1 a 2 h",
      oQueFazer: [
        "Escreva as conclusões no formato o quê, quanto, e daí.",
        "Restart e Run All. Publique.",
      ],
      prontoQuando:
        "O link público abre com as saídas e alguém sem contexto entende o que você descobriu.",
    },
  ],
  kit: [
    {
      tipo: "link",
      titulo: "Datasets no Kaggle",
      url: "https://www.kaggle.com/datasets",
      nota: "Filtre por CSV e por tamanho. Datasets com muitas votações costumam vir mais limpos.",
    },
    {
      tipo: "link",
      titulo: "Portal de dados abertos",
      url: "https://dados.gov.br",
      nota: "Dados brasileiros: educação, saúde, transporte. Mais sujos, mais interessantes.",
    },
    {
      tipo: "modelo",
      titulo: "Estrutura do notebook",
      nota: "Título e contexto. Fonte e colunas. Perguntas. Limpeza (antes e depois). Uma seção por pergunta, com gráfico e leitura. Conclusões. Limitações.",
    },
    {
      tipo: "modelo",
      titulo: "Formato de uma conclusão",
      nota: "O quê: o que você viu. Quanto: o número. E daí: o que alguém faria com isso. Exemplo: as vendas caem em fevereiro (o quê), 18% abaixo da média (quanto), então promoções no início do ano fazem sentido (e daí).",
    },
    {
      tipo: "checklist",
      titulo: "Checklist de limpeza",
      nota: "Nomes de coluna padronizados. Tipos certos (data é data, número é número). Nulos tratados com a decisão anotada. Duplicatas removidas. Valores impossíveis (idade negativa, data no futuro) investigados.",
    },
  ],
  ajuda: {
    trilha: {
      slug: "dados",
      nodeIds: [
        "pandas.limpeza",
        "pandas.transformar",
        "visualizacao.matplotlib",
        "projeto.dataset",
        "projeto.comunicacao",
      ],
    },
    termos: ["Pandas", "Dataset", "Notebook"],
  },
  verificacaoAutomatica: ["artefato_responde"],
};

export default detalhe;
