import type { ProjetoV2Detalhe } from "./types";

// Conteudo aprovado pela Ana em 03/09/2026 (Anexo A do diagnostico da aba
// Projetos). Kit de layout no Figma ainda nao existe: entra quando for
// produzido, nunca com URL inventada.
const detalhe: ProjetoV2Detalhe = {
  id: "landing-page-pessoal",
  tipoEntrega: "repo_deploy",
  briefing: {
    contexto:
      "Um recrutador abre o link que você mandou e tem 30 segundos. Nesse tempo ele precisa entender quem você é, o que você está estudando, ver que você já construiu alguma coisa e saber como te chamar. Sua página pessoal é a resposta para esses 30 segundos. Não precisa ser bonita como a de um designer. Precisa ser clara, funcionar no celular e estar no ar. Este é o primeiro projeto que você vai poder colocar no LinkedIn e no currículo com link, e é onde todos os seus próximos projetos vão morar.",
    aprende: [
      "Estruturar uma página com HTML semântico",
      "Alinhar elementos com Flexbox",
      "Fazer a página funcionar no celular",
      "Versionar com Git e GitHub",
      "Publicar um site de graça no GitHub Pages",
    ],
    preRequisitos: [
      { rotulo: "Saber o que são HTML e CSS", href: "/dicionario?termo=HTML" },
      { rotulo: "Ter o VS Code instalado", href: "/ferramentas" },
      { rotulo: "Ter uma conta no GitHub", href: "/dicionario?termo=GitHub" },
    ],
    tempoEstimado: { horas: [6, 10], semanas: [1, 2] },
  },
  requisitos: [
    {
      id: "deploy-publico",
      descricao:
        "A página abre num link público (GitHub Pages ou Netlify) sem erro",
      verificacao: "O README traz a URL do site e ela responde",
    },
    {
      id: "header-menu",
      descricao:
        "Header com seu nome e um menu com pelo menos 3 links que levam às seções da própria página",
      verificacao:
        "Print da página no README mostra o header e o menu, ou o index.html tem nav com pelo menos 3 âncoras internas",
    },
    {
      id: "secao-sobre",
      descricao:
        "Seção Sobre com foto ou avatar e um parágrafo de até 5 linhas dizendo quem você é e o que está estudando",
      verificacao: "Print no README ou seção identificável no index.html",
    },
    {
      id: "secao-projetos",
      descricao:
        "Seção Projetos com pelo menos 2 cards, cada um com título, descrição de 1 a 2 linhas e link",
      verificacao:
        "Print no README ou dois blocos identificáveis no index.html com link",
    },
    {
      id: "secao-contato",
      descricao:
        "Seção Contato com link do LinkedIn, do GitHub e um e-mail clicável",
      verificacao:
        "index.html tem links para linkedin.com, github.com e um mailto:",
    },
    {
      id: "responsivo-375",
      descricao:
        "Funciona em tela de celular (375 px de largura) sem rolagem horizontal",
      verificacao:
        "Print em largura de celular no README, ou media query no CSS",
    },
    {
      id: "tags-semanticas",
      descricao: "Usa as tags header, nav, main, section e footer",
      verificacao: "index.html contém as cinco tags",
    },
    {
      id: "css-separado",
      descricao:
        "Cores, fontes e espaçamentos num arquivo .css separado, sem estilo inline",
      verificacao:
        "Existe um arquivo .css na árvore e o index.html o referencia",
    },
    {
      id: "readme-completo",
      descricao:
        "Repositório público com README contendo o que é o projeto, o link do site no ar e um print",
      verificacao: "README.md existe com URL do site e uma imagem",
    },
    {
      id: "cinco-commits",
      descricao:
        "Histórico com pelo menos 5 commits com mensagens que dizem o que mudou",
      verificacao: "A API do GitHub lista 5 ou mais commits",
    },
  ],
  etapas: [
    {
      id: "planejar",
      titulo: "Planejar",
      tempo: "30 min",
      oQueFazer: [
        "Rabisque as 4 seções no papel ou no Figma.",
        "Escreva o texto do Sobre e escolha os 2 projetos que vão nos cards.",
      ],
      prontoQuando:
        "Você tem o texto e a lista dos 2 projetos, mesmo que um deles seja este site.",
    },
    {
      id: "html",
      titulo: "Estrutura em HTML",
      tempo: "1 a 2 h",
      oQueFazer: [
        "Crie index.html com as 4 seções e o conteúdo real, sem CSS ainda.",
        "Faça o menu apontar para as seções com âncoras.",
      ],
      prontoQuando:
        "A página abre no navegador e clicar no menu rola até a seção certa.",
    },
    {
      id: "css",
      titulo: "Estilo em CSS",
      tempo: "2 a 4 h",
      oQueFazer: [
        "Crie style.css.",
        "Defina cores e fonte, alinhe o menu e os cards com Flexbox, dê espaço entre as seções.",
      ],
      prontoQuando: "A página parece uma página, não um documento de texto.",
    },
    {
      id: "celular",
      titulo: "Celular",
      tempo: "1 h",
      oQueFazer: [
        "Abra as ferramentas do navegador, simule 375 px e ajuste com uma media query.",
      ],
      prontoQuando: "Nada vaza para o lado e o menu continua usável.",
    },
    {
      id: "publicar",
      titulo: "Publicar",
      tempo: "30 min",
      oQueFazer: [
        "Crie o repositório no GitHub, suba os arquivos, escreva o README, ative o GitHub Pages.",
      ],
      prontoQuando: "O link abre numa aba anônima.",
    },
  ],
  kit: [
    {
      tipo: "modelo",
      titulo: "Texto do Sobre em 3 frases",
      nota: "Quem você é (nome, cidade, o que fazia antes). O que está estudando agora e há quanto tempo. O que procura (primeira vaga, estágio, freelas).",
    },
    {
      tipo: "modelo",
      titulo: "README mínimo",
      nota: "Título do projeto. Uma frase do que é. Link do site no ar. Um print. Como rodar (abrir o index.html). O que você aprendeu em 2 linhas.",
    },
    {
      tipo: "checklist",
      titulo: "Tags semânticas",
      nota: "header: topo com nome e menu. nav: o menu. main: o conteúdo principal. section: cada bloco (sobre, projetos, contato). footer: rodapé com créditos e links.",
    },
    {
      tipo: "link",
      titulo: "Google Fonts",
      url: "https://fonts.google.com",
      nota: "Escolha uma fonte para títulos e uma para texto. Inter, Poppins e Nunito funcionam bem em portfólio.",
    },
  ],
  ajuda: {
    video: {
      titulo: "Como Criar um Portfolio do Zero com HTML e CSS para Iniciantes",
      url: "https://www.youtube.com/watch?v=SV7TL0hxmIQ",
    },
    trilha: {
      slug: "frontend",
      nodeIds: [
        "html.semantica",
        "layout.flexbox",
        "layout.responsivo",
        "primeirosite.publicar",
        "ferramentas.git.basico",
      ],
    },
    termos: [
      "HTML",
      "CSS",
      "Flexbox",
      "Responsividade",
      "Deploy",
      "Git",
      "GitHub",
      "Commit",
    ],
  },
  verificacaoAutomatica: [
    "deploy_responde",
    "repo_publico",
    "arquivo:index.html",
    "readme_existe",
    "readme_tem_link_deploy",
    "min_commits_5",
  ],
};

export default detalhe;
