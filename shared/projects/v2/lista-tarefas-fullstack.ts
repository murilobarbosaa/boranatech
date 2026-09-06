import type { ProjetoV2Detalhe } from "./types";

// TODO(Ana): revisar todo o texto deste modulo (piloto v2, nao aprovado)
const detalhe: ProjetoV2Detalhe = {
  id: "lista-tarefas-fullstack",
  tipoEntrega: "repo_deploy",
  briefing: {
    contexto:
      "Você já fez a lista de tarefas que vive só no navegador. Agora ela ganha um servidor e um banco: as tarefas ficam guardadas de verdade e aparecem iguais em qualquer dispositivo. É o primeiro projeto em que as duas pontas conversam, e é exatamente isso que uma vaga júnior full-stack pede para ver: um front que chama uma API sua, com deploy dos dois lados.",
    aprende: [
      "Montar uma tela em React com estado e efeitos",
      "Consumir uma API com fetch, tratando loading e erro",
      "Construir a API com Express e banco",
      "Configurar CORS e variáveis de ambiente",
      "Fazer deploy separado do front e do back",
    ],
    preRequisitos: [
      {
        rotulo: "Ter feito a To-Do List com JavaScript",
        href: "/projetos/todo-list",
      },
      {
        rotulo: "Ter feito a API REST de Tarefas",
        href: "/projetos/api-rest-tarefas",
      },
      {
        rotulo: "Conhecer o básico de React (componentes, useState, useEffect)",
        href: "/dicionario?termo=React",
      },
    ],
    tempoEstimado: { horas: [15, 25], semanas: [2, 4] },
  },
  requisitos: [
    {
      id: "front-crud",
      descricao:
        "A tela lista, cria, conclui e remove tarefas chamando a API (nada fica só no navegador)",
      verificacao:
        "Prints no README e o código do front chama fetch nas quatro operações",
    },
    {
      id: "loading-erro",
      descricao:
        "A tela mostra estado de carregando e mensagem de erro quando a API falha",
      verificacao:
        "Print no README com o estado de erro ou trecho identificável no código",
    },
    {
      id: "api-banco",
      descricao:
        "A API tem o CRUD completo e persiste num banco (SQLite ou PostgreSQL)",
      verificacao:
        "package.json do server tem o driver ou ORM e o README diz qual banco",
    },
    {
      id: "cors",
      descricao: "CORS configurado para o domínio do front",
      verificacao:
        "O server tem o middleware de CORS e o README cita a origem permitida",
    },
    {
      id: "env",
      descricao:
        "A URL da API no front vem de variável de ambiente, com um .env.example no repositório",
      verificacao: "Arquivo .env.example existe e o código lê a variável",
    },
    {
      id: "deploy-front",
      descricao: "Front no ar (Vercel ou Netlify)",
      verificacao: "O README traz a URL do front e ela responde",
    },
    {
      id: "deploy-back",
      descricao:
        "API no ar (Render ou Railway) ou, se não publicar, README com passo a passo para rodar local que funciona",
      verificacao:
        "README traz a URL da API ou a seção de execução local com comandos",
    },
    {
      id: "arquitetura",
      descricao:
        "README com um desenho ou lista de como as partes se conectam (front, API, banco) e os dois links",
      verificacao: "README tem seção de arquitetura",
    },
    {
      id: "estrutura",
      descricao:
        "Repositório organizado em pastas client e server (ou dois repositórios linkados entre si)",
      verificacao:
        "Árvore do repositório tem as duas pastas ou o README aponta o outro repositório",
    },
  ],
  etapas: [
    {
      id: "api",
      titulo: "A API",
      tempo: "3 a 5 h",
      oQueFazer: [
        "Reaproveite a API de tarefas. Se ela ainda não tem banco, é a hora.",
      ],
      prontoQuando: "O CRUD funciona no Postman com dados persistidos.",
    },
    {
      id: "front",
      titulo: "A tela em React",
      tempo: "4 a 6 h",
      oQueFazer: [
        "Crie o projeto com Vite. Um componente lista, um formulário cria.",
        "Comece com dados fixos para validar a tela.",
      ],
      prontoQuando: "A tela funciona com dados fixos.",
    },
    {
      id: "integrar",
      titulo: "Ligar as pontas",
      tempo: "3 a 5 h",
      oQueFazer: [
        "Troque os dados fixos por fetch na API.",
        "Mostre carregando e erro.",
        "Configure CORS no server.",
      ],
      prontoQuando:
        "Criar uma tarefa na tela aparece no banco e recarregar a página mantém tudo.",
    },
    {
      id: "env",
      titulo: "Ambiente",
      tempo: "1 a 2 h",
      oQueFazer: [
        "A URL da API vira variável de ambiente no front.",
        "Crie o .env.example nos dois lados.",
      ],
      prontoQuando: "Trocar a URL não exige mexer no código.",
    },
    {
      id: "deploy",
      titulo: "Deploy dos dois",
      tempo: "2 a 4 h",
      oQueFazer: [
        "Front na Vercel, API no Render ou Railway, banco gerenciado ou SQLite em disco.",
        "Ajuste CORS para a URL de produção e escreva o README com a arquitetura.",
      ],
      prontoQuando:
        "O link do front abre numa aba anônima e as tarefas funcionam contra a API no ar.",
    },
  ],
  kit: [
    {
      tipo: "modelo",
      titulo: "Estrutura de pastas",
      nota: "raiz: README.md. client: projeto Vite com React. server: Express, banco e .env.example. Um package.json em cada pasta.",
    },
    {
      tipo: "checklist",
      titulo: "Checklist de deploy",
      nota: "Variáveis de ambiente configuradas na plataforma. CORS liberado para a URL do front. URL da API no front apontando para produção. Banco acessível do servidor no ar. Testar os quatro botões depois do deploy.",
    },
    {
      tipo: "modelo",
      titulo: "README full-stack",
      nota: "O que é. Links do front e da API. Arquitetura em 3 linhas ou um desenho. Como rodar local (client e server). Decisões: qual banco, por quê.",
    },
    {
      tipo: "link",
      titulo: "Deploy de React na Vercel",
      url: "https://vercel.com/docs/frameworks/vite",
      nota: "Vite é detectado automaticamente.",
    },
    {
      tipo: "link",
      titulo: "Deploy de Node no Render",
      url: "https://render.com/docs/deploy-node-express-app",
      nota: "O plano gratuito hiberna o servidor: a primeira requisição pode demorar.",
    },
  ],
  ajuda: {
    trilha: {
      slug: "fullstack",
      nodeIds: [
        "integracao.consumir",
        "integracao.cors",
        "bancodedados.conectar",
        "deploy.env",
        "deploy.backend",
        "deploy.frontend",
      ],
    },
    termos: ["React", "CORS", "API", "Deploy", "Endpoint"],
  },
  verificacaoAutomatica: [
    "deploy_responde",
    "repo_publico",
    "readme_existe",
    "readme_tem_link_deploy",
    "min_commits_5",
  ],
};

export default detalhe;
