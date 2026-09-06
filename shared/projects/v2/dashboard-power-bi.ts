import type { ProjetoV2Detalhe } from "./types";

// TODO(Ana): revisar todo o texto deste modulo (piloto v2, nao aprovado)
const detalhe: ProjetoV2Detalhe = {
  id: "dashboard-power-bi",
  tipoEntrega: "dashboard",
  briefing: {
    contexto:
      "O gerente de vendas abre o painel na segunda de manhã e precisa ver, em dez segundos, quanto vendeu, o que está caindo e onde. Este projeto é esse painel. Você vai sair de uma planilha de vendas e chegar num dashboard interativo com filtros, o artefato mais pedido em vaga de analista de BI, e o que mais aparece em portfólio de quem entra na área.",
    aprende: [
      "Importar e modelar dados no Power BI",
      "Relacionar tabelas de pedidos, produtos e clientes",
      "Escrever medidas DAX básicas",
      "Escolher o gráfico certo para cada pergunta",
      "Publicar e compartilhar um painel",
    ],
    preRequisitos: [
      {
        rotulo: "Saber o que é um dashboard e para que serve",
        href: "/dicionario?termo=Dashboard",
      },
      { rotulo: "Entender o que é um KPI", href: "/dicionario?termo=KPI" },
      {
        rotulo: "Ter o Power BI Desktop instalado (gratuito, Windows)",
        href: "/roadmaps/dados",
      },
    ],
    tempoEstimado: { horas: [8, 14], semanas: [1, 2] },
  },
  requisitos: [
    {
      id: "dados",
      descricao:
        "Planilha de vendas com pelo menos três tabelas relacionadas (pedidos, produtos, clientes) ou uma tabela com mais de 500 linhas",
      verificacao:
        "A fonte está citada na descrição da entrega e o print do modelo mostra as tabelas",
    },
    {
      id: "modelo",
      descricao: "Relacionamentos definidos entre as tabelas",
      verificacao: "Print da aba Modelo com as linhas de relacionamento",
    },
    {
      id: "medidas",
      descricao:
        "Pelo menos três medidas DAX: faturamento total, ticket médio e quantidade de pedidos",
      verificacao: "Print da lista de medidas ou as fórmulas na descrição",
    },
    {
      id: "visuais",
      descricao:
        "Quatro visuais: um cartão de KPI, barras por categoria, linha por mês e um mapa ou tabela por região",
      verificacao: "Os quatro aparecem no painel publicado",
    },
    {
      id: "filtros",
      descricao: "Filtros de período e de categoria funcionando",
      verificacao:
        "Segmentações visíveis no painel e o print mostra um filtro aplicado",
    },
    {
      id: "titulos",
      descricao: "Todo visual tem título e, quando cabe, legenda",
      verificacao: "Visível no painel publicado",
    },
    {
      id: "publicado",
      descricao:
        "Painel publicado no Power BI Service com link público (Publicar na web) ou, se não puder, PDF exportado com o painel inteiro",
      verificacao: "O link abre sem login ou o PDF está anexado",
    },
    {
      id: "descricao",
      descricao:
        "Descrição da entrega com a fonte dos dados e as três perguntas que o painel responde",
      verificacao: "Texto na entrega ou no README",
    },
  ],
  etapas: [
    {
      id: "dados",
      titulo: "Dados",
      tempo: "1 a 2 h",
      oQueFazer: [
        "Escolha um dataset de vendas com data, produto, região e valor.",
        "Abra no Power BI e confira os tipos de cada coluna.",
      ],
      prontoQuando: "As tabelas estão carregadas com tipos certos.",
    },
    {
      id: "modelo",
      titulo: "Modelo",
      tempo: "1 a 2 h",
      oQueFazer: [
        "Crie os relacionamentos na aba Modelo.",
        "Crie uma tabela de calendário se o dataset não tiver.",
      ],
      prontoQuando:
        "Arrastar um campo de produto e um valor de pedido num visual dá o número certo.",
    },
    {
      id: "medidas",
      titulo: "Medidas DAX",
      tempo: "2 a 3 h",
      oQueFazer: [
        "Faturamento = SUM. Pedidos = COUNTROWS ou DISTINCTCOUNT. Ticket médio = DIVIDE.",
        "Confira os números contra a planilha.",
      ],
      prontoQuando: "As três medidas batem com uma conta manual.",
    },
    {
      id: "visuais",
      titulo: "Visuais e filtros",
      tempo: "2 a 4 h",
      oQueFazer: [
        "KPIs em cima, gráficos no meio, tabela embaixo.",
        "Segmentação de período e de categoria.",
        "Título em tudo.",
      ],
      prontoQuando: "Mudar o filtro muda todos os visuais.",
    },
    {
      id: "publicar",
      titulo: "Publicar",
      tempo: "1 h",
      oQueFazer: [
        "Publique no Power BI Service e gere o link de Publicar na web.",
        "Escreva a descrição com a fonte e as perguntas.",
      ],
      prontoQuando: "O link abre numa aba anônima.",
    },
  ],
  kit: [
    {
      tipo: "link",
      titulo: "Power BI Desktop",
      url: "https://powerbi.microsoft.com/pt-br/desktop/",
      nota: "Gratuito, só Windows. No Mac, use uma máquina virtual ou o Power BI Service no navegador com limitações.",
    },
    {
      tipo: "checklist",
      titulo: "Medidas DAX que resolvem o projeto",
      nota: "Faturamento = SUM(Pedidos[Valor]). Pedidos = COUNTROWS(Pedidos). Ticket médio = DIVIDE([Faturamento], [Pedidos]). Faturamento ano anterior = CALCULATE([Faturamento], SAMEPERIODLASTYEAR(Calendario[Data])).",
    },
    {
      tipo: "modelo",
      titulo: "Layout do painel",
      nota: "Linha 1: três cartões de KPI. Linha 2: barras por categoria à esquerda, linha por mês à direita. Linha 3: mapa ou tabela por região. Filtros na lateral.",
    },
    {
      tipo: "modelo",
      titulo: "Onde achar dados de vendas",
      nota: "No Kaggle, procure por sales dataset e escolha um com data, produto, região e valor. Datasets de e-commerce brasileiro também servem.",
    },
  ],
  ajuda: {
    trilha: {
      slug: "dados",
      nodeIds: [
        "sql.agregacao",
        "visualizacao.principios",
        "projeto.comunicacao",
      ],
    },
    termos: ["Dashboard", "KPI", "Métrica"],
  },
  verificacaoAutomatica: ["artefato_responde"],
};

export default detalhe;
