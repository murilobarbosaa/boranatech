import type { ProjetoV2Detalhe } from "./types";

// TODO(Ana): revisar todo o texto deste modulo (piloto v2, nao aprovado)
const detalhe: ProjetoV2Detalhe = {
  id: "api-rest-tarefas",
  tipoEntrega: "repo",
  briefing: {
    contexto:
      "Todo app que você usa fala com um servidor: o app de tarefas do seu celular manda 'crie esta tarefa' e o servidor guarda. Esta API é esse servidor. Sem tela, só endpoints: você vai criar, listar, editar e apagar tarefas pelo Postman ou Insomnia. É o projeto que separa quem sabe JavaScript de quem sabe construir um back-end: rotas, validação, erros e banco.",
    aprende: [
      "Criar rotas REST com Express",
      "Ler params, query e body de uma requisição",
      "Validar entrada e responder com o status HTTP certo",
      "Persistir dados num banco a partir do código",
      "Documentar uma API para outra pessoa usar",
    ],
    preRequisitos: [
      {
        rotulo: "Saber o básico de JavaScript",
        href: "/dicionario?termo=JavaScript",
      },
      { rotulo: "Ter o Node.js instalado", href: "/ferramentas?q=Node.js" },
      { rotulo: "Entender o que é uma API", href: "/dicionario?termo=API" },
    ],
    tempoEstimado: { horas: [8, 16], semanas: [1, 3] },
  },
  requisitos: [
    {
      id: "listar",
      descricao: "GET /tarefas devolve a lista de tarefas em JSON",
      verificacao: "README documenta a rota com exemplo de resposta",
    },
    {
      id: "criar",
      descricao:
        "POST /tarefas cria uma tarefa e responde 201 com a tarefa criada",
      verificacao: "README documenta a rota com exemplo de request e response",
    },
    {
      id: "atualizar",
      descricao: "PUT ou PATCH /tarefas/:id atualiza título ou concluída",
      verificacao: "README documenta a rota",
    },
    {
      id: "remover",
      descricao: "DELETE /tarefas/:id remove e responde 204",
      verificacao: "README documenta a rota",
    },
    {
      id: "validacao",
      descricao:
        "POST sem título responde 400 com uma mensagem de erro em JSON",
      verificacao: "README mostra o exemplo do 400",
    },
    {
      id: "nao-encontrado",
      descricao: "Qualquer rota com id inexistente responde 404",
      verificacao: "README mostra o exemplo do 404",
    },
    {
      id: "banco",
      descricao:
        "As tarefas ficam num banco (SQLite, PostgreSQL ou MongoDB), não só em memória",
      verificacao:
        "package.json tem a dependência do driver ou ORM e o README diz qual banco",
    },
    {
      id: "colecao",
      descricao:
        "O repositório inclui uma coleção do Postman ou Insomnia, ou um arquivo .http, com todas as rotas",
      verificacao: "Arquivo de coleção ou .http na árvore do repositório",
    },
    {
      id: "cinco-commits",
      descricao: "Pelo menos 5 commits com mensagens que dizem o que mudou",
      verificacao: "A API do GitHub lista 5 ou mais commits",
    },
  ],
  etapas: [
    {
      id: "servidor",
      titulo: "Servidor no ar",
      tempo: "1 h",
      oQueFazer: [
        "npm init, instale o Express, crie server.js com uma rota GET / que responde um JSON.",
        "Rode com node e teste no navegador ou no Postman.",
      ],
      prontoQuando: "GET / responde no Postman.",
    },
    {
      id: "rotas",
      titulo: "CRUD em memória",
      tempo: "2 a 4 h",
      oQueFazer: [
        "Guarde as tarefas num array e crie as quatro rotas.",
        "Use express.json() para ler o body.",
      ],
      prontoQuando:
        "Dá para criar, listar, editar e apagar pelo Postman, e a lista some quando o servidor reinicia (é o esperado por enquanto).",
    },
    {
      id: "validacao",
      titulo: "Validação e erros",
      tempo: "1 a 2 h",
      oQueFazer: [
        "Recuse POST sem título com 400 e mensagem.",
        "Responda 404 para id inexistente.",
        "Trate erro inesperado com 500 sem vazar detalhes.",
      ],
      prontoQuando: "Cada caso de erro devolve o status e a mensagem certos.",
    },
    {
      id: "banco",
      titulo: "Banco de dados",
      tempo: "3 a 6 h",
      oQueFazer: [
        "Troque o array por um banco: SQLite com better-sqlite3 ou Prisma é o caminho mais curto; MongoDB com Mongoose também vale.",
        "Crie a tabela ou coleção pelo código.",
      ],
      prontoQuando: "Reiniciar o servidor não apaga as tarefas.",
    },
    {
      id: "documentar",
      titulo: "Documentar",
      tempo: "1 h",
      oQueFazer: [
        "Exporte a coleção do Postman ou Insomnia para o repositório.",
        "Escreva o README com as rotas, exemplos e como rodar.",
      ],
      prontoQuando: "Outra pessoa consegue rodar e testar só lendo o README.",
    },
  ],
  kit: [
    {
      tipo: "modelo",
      titulo: "Formato de uma tarefa",
      nota: '{ "id": 1, "titulo": "Estudar Express", "concluida": false, "criadaEm": "2026-09-05T12:00:00Z" }',
    },
    {
      tipo: "checklist",
      titulo: "Status HTTP que a API usa",
      nota: "200 ok. 201 criado. 204 removido sem corpo. 400 entrada inválida. 404 não encontrado. 500 erro do servidor.",
    },
    {
      tipo: "modelo",
      titulo: "README de API",
      nota: "O que é. Como rodar (instalar, variáveis, comando). Tabela de rotas: método, caminho, body, resposta. Exemplos de 400 e 404. Qual banco e por quê.",
    },
    {
      tipo: "link",
      titulo: "Documentação do Express",
      url: "https://expressjs.com/pt-br/",
      nota: "Roteamento e middleware são as duas páginas que você mais vai abrir.",
    },
    {
      tipo: "link",
      titulo: "Postman",
      url: "https://www.postman.com/downloads/",
      nota: "Insomnia ou a extensão REST Client do VS Code fazem o mesmo.",
    },
  ],
  ajuda: {
    trilha: {
      slug: "backend",
      nodeIds: [
        "servidor.rotas",
        "servidor.reqres",
        "apis.crud",
        "apis.validacao",
        "apis.erros",
        "bancodedados.orm",
        "qualidade.docs",
      ],
    },
    termos: ["API", "REST", "CRUD", "HTTP", "JSON", "Endpoint", "Node.js"],
  },
  verificacaoAutomatica: [
    "repo_publico",
    "readme_existe",
    "arquivo:package.json",
    "min_commits_5",
  ],
};

export default detalhe;
