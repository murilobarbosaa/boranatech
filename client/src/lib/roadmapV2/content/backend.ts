import type { RoadmapV2 } from "../types";

export const backend: RoadmapV2 = {
  slug: "backend",
  area: "backend",
  title: "Back-end do Zero",
  level: "Iniciante",
  description:
    "Da lógica de servidor até publicar uma API com banco de dados. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      level: "iniciante",
      description: "O que é back-end e o ambiente pra começar.",
      children: [
        {
          id: "fundamentos.conceitos",
          title: "Como funciona o back-end",
          children: [
            {
              id: "fundamentos.conceitos.clienteservidor",
              title: "Cliente e servidor",
              description: "Quem pede e quem responde numa aplicação web.",
            },
            {
              id: "fundamentos.conceitos.http",
              title: "HTTP, métodos e status",
              description:
                "A linguagem que o navegador e o servidor usam pra conversar.",
              resources: [
                {
                  label: "MDN HTTP",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP",
                  kind: "doc",
                },
              ],
            },
            {
              id: "fundamentos.conceitos.api",
              title: "O que é uma API",
              description:
                "A porta de entrada que outros sistemas usam pra falar com o seu.",
              resources: [
                {
                  label: "MDN API",
                  url: "https://developer.mozilla.org/pt-BR/docs/Glossary/API",
                  kind: "doc",
                },
              ],
            },
            {
              id: "fundamentos.conceitos.frontback",
              title: "Front-end x back-end",
              description: "O que roda no navegador e o que roda no servidor.",
              optional: true,
            },
          ],
        },
        {
          id: "fundamentos.terminal",
          title: "Terminal e linha de comando",
          description:
            "Os comandos essenciais pra navegar e rodar coisas sem mouse.",
        },
        {
          id: "fundamentos.logica",
          title: "Lógica de programação",
          children: [
            {
              id: "fundamentos.logica.tipos",
              title: "Tipos, variáveis e operadores",
              description:
                "Os blocos mais básicos pra guardar e combinar valores.",
              resources: [
                {
                  label: "JavaScript.info",
                  url: "https://javascript.info",
                  kind: "curso",
                },
              ],
            },
            {
              id: "fundamentos.logica.controle",
              title: "Condicionais e laços",
              description: "Tomar decisões e repetir ações no código.",
            },
            {
              id: "fundamentos.logica.funcoes",
              title: "Funções",
              description:
                "Empacotar lógica que você reaproveita em vários lugares.",
            },
            {
              id: "fundamentos.logica.estruturas",
              title: "Arrays e objetos",
              description:
                "As duas estruturas que você vai usar o tempo todo pra organizar dados.",
            },
          ],
        },
        {
          id: "fundamentos.git",
          title: "Git e GitHub",
          children: [
            {
              id: "fundamentos.git.basico",
              title: "add, commit, push",
              description: "O ciclo básico de salvar e enviar seu código.",
              resources: [
                {
                  label: "Documentação Git",
                  url: "https://git-scm.com/doc",
                  kind: "doc",
                },
              ],
            },
            {
              id: "fundamentos.git.branches",
              title: "Branches e merge",
              description: "Trabalhar em paralelo e juntar as mudanças.",
            },
            {
              id: "fundamentos.git.pr",
              title: "Pull requests",
              description: "Propor e revisar mudanças antes de integrar.",
            },
          ],
        },
      ],
    },
    {
      id: "linguagem",
      title: "JavaScript pro back-end",
      level: "iniciante",
      description: "A linguagem que a gente vai rodar no servidor.",
      children: [
        {
          id: "linguagem.base",
          title: "Base da linguagem",
          children: [
            {
              id: "linguagem.base.tipos",
              title: "Tipos e variáveis",
              description:
                "Os tipos de dados do JavaScript e como guardar valores.",
              resources: [
                {
                  label: "JavaScript.info",
                  url: "https://javascript.info",
                  kind: "curso",
                },
              ],
            },
            {
              id: "linguagem.base.funcoes",
              title: "Funções e escopo",
              description:
                "Empacotar lógica reutilizável e entender onde as variáveis vivem.",
            },
            {
              id: "linguagem.base.estruturas",
              title: "Arrays e objetos",
              description: "Estruturar dados em listas e em pares chave-valor.",
            },
            {
              id: "linguagem.base.desestruturacao",
              title: "Desestruturação e spread",
              description:
                "Extrair e espalhar valores de objetos e arrays com menos código.",
            },
          ],
        },
        {
          id: "linguagem.modulos",
          title: "Módulos (import / export e require)",
          description:
            "Quebrar o código em arquivos que se importam, nos dois padrões que o Node usa.",
        },
        {
          id: "linguagem.json",
          title: "JSON",
          description: "O formato que as APIs usam pra trocar dados.",
        },
        {
          id: "linguagem.async",
          title: "Assíncrono",
          children: [
            {
              id: "linguagem.async.promises",
              title: "Promises",
              description:
                "Lidar com operações que terminam no futuro, como acessar o banco.",
              resources: [
                {
                  label: "JavaScript.info Promises",
                  url: "https://javascript.info/promise-basics",
                  kind: "curso",
                },
              ],
            },
            {
              id: "linguagem.async.awaitasync",
              title: "async / await",
              description: "Escrever código assíncrono que parece síncrono.",
            },
            {
              id: "linguagem.async.erros",
              title: "Tratamento de erros (try / catch)",
              description:
                "Capturar e tratar o que pode dar errado sem derrubar o servidor.",
            },
          ],
        },
      ],
    },
    {
      id: "node",
      title: "Node.js",
      level: "intermediario",
      description: "O que roda seu JavaScript fora do navegador.",
      children: [
        {
          id: "node.intro",
          title: "Primeiros passos",
          children: [
            {
              id: "node.intro.oque",
              title: "O que é o Node.js",
              description: "O ambiente que executa JavaScript no servidor.",
              resources: [
                {
                  label: "Node.js Learn",
                  url: "https://nodejs.org/en/learn",
                  kind: "doc",
                },
              ],
            },
            {
              id: "node.intro.npm",
              title: "npm e pnpm",
              description: "Instalar e gerenciar as bibliotecas do projeto.",
            },
            {
              id: "node.intro.packagejson",
              title: "package.json e scripts",
              description:
                "O arquivo que descreve seu projeto e os comandos pra rodá-lo.",
            },
          ],
        },
        {
          id: "node.nativos",
          title: "Módulos nativos",
          children: [
            {
              id: "node.nativos.fs",
              title: "Ler e escrever arquivos (fs)",
              description: "Mexer com arquivos direto do código.",
              resources: [
                {
                  label: "Node.js fs",
                  url: "https://nodejs.org/api/fs.html",
                  kind: "doc",
                },
              ],
            },
            {
              id: "node.nativos.path",
              title: "Caminhos de arquivo (path)",
              description:
                "Montar caminhos que funcionam em qualquer sistema operacional.",
            },
            {
              id: "node.nativos.process",
              title: "process e variáveis de ambiente",
              description:
                "Ler configurações e dados do ambiente onde o app roda.",
            },
          ],
        },
        {
          id: "node.servidor",
          title: "Criar um servidor HTTP nativo",
          description:
            "Subir um servidor do zero pra entender o que o Express faz por baixo.",
          resources: [
            {
              label: "Node.js HTTP",
              url: "https://nodejs.org/api/http.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "node.eventloop",
          title: "Event loop (conceito)",
          description:
            "Como o Node dá conta de muitas tarefas com uma thread só.",
          optional: true,
        },
      ],
    },
    {
      id: "express",
      title: "Express e APIs REST",
      level: "intermediario",
      description: "O jeito prático de construir APIs em Node.",
      children: [
        {
          id: "express.base",
          title: "Base do Express",
          children: [
            {
              id: "express.base.setup",
              title: "Instalar e subir o Express",
              description: "Colocar um servidor de pé com poucas linhas.",
              resources: [
                {
                  label: "Express",
                  url: "https://expressjs.com/pt-br/",
                  kind: "doc",
                },
              ],
            },
            {
              id: "express.base.rotas",
              title: "Rotas e métodos",
              description: "Definir os endereços da API e o que cada um faz.",
            },
            {
              id: "express.base.reqres",
              title: "Request e response",
              description: "Ler o que chega e devolver a resposta certa.",
            },
            {
              id: "express.base.params",
              title: "Params, query e body",
              description: "As três formas de receber dados numa requisição.",
            },
          ],
        },
        {
          id: "express.middleware",
          title: "Middlewares",
          description:
            "Funções que rodam entre a requisição e a resposta, como checar autenticação ou registrar acessos.",
        },
        {
          id: "express.rest",
          title: "API REST na prática",
          children: [
            {
              id: "express.rest.crud",
              title: "CRUD e recursos",
              description:
                "As quatro operações básicas: criar, ler, atualizar e apagar.",
            },
            {
              id: "express.rest.status",
              title: "Status codes certos",
              description:
                "Responder com o código que descreve o que aconteceu.",
              resources: [
                {
                  label: "MDN HTTP Status",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status",
                  kind: "doc",
                },
              ],
            },
            {
              id: "express.rest.validacao",
              title: "Validação de entrada (Zod)",
              description:
                "Checar se os dados que chegaram vieram no formato esperado.",
              resources: [
                { label: "Zod", url: "https://zod.dev", kind: "doc" },
              ],
            },
          ],
        },
        {
          id: "express.erros",
          title: "Tratamento de erros centralizado",
          description: "Um lugar só pra capturar e responder os erros da API.",
        },
      ],
    },
    {
      id: "bancodedados",
      title: "Banco de dados",
      level: "intermediario",
      description: "Onde os dados ficam guardados de verdade.",
      children: [
        {
          id: "bancodedados.conceitos",
          title: "Conceitos",
          children: [
            {
              id: "bancodedados.conceitos.sqlnosql",
              title: "SQL x NoSQL",
              description:
                "As duas grandes famílias de banco e quando usar cada uma.",
            },
            {
              id: "bancodedados.conceitos.modelagem",
              title: "Modelagem básica",
              description:
                "Decidir quais tabelas e campos seu sistema precisa.",
            },
          ],
        },
        {
          id: "bancodedados.relacional",
          title: "Banco relacional (PostgreSQL)",
          children: [
            {
              id: "bancodedados.relacional.postgres",
              title: "PostgreSQL",
              description: "Um dos bancos relacionais mais usados do mercado.",
              resources: [
                {
                  label: "PostgreSQL",
                  url: "https://www.postgresql.org/docs",
                  kind: "doc",
                },
              ],
            },
            {
              id: "bancodedados.relacional.queries",
              title: "SELECT, INSERT, UPDATE, DELETE",
              description: "Os comandos pra ler e mudar dados no banco.",
            },
            {
              id: "bancodedados.relacional.relacionamentos",
              title: "Relacionamentos e chaves",
              description:
                "Ligar tabelas entre si com chaves primária e estrangeira.",
            },
          ],
        },
        {
          id: "bancodedados.orm",
          title: "Acessar o banco pelo código",
          children: [
            {
              id: "bancodedados.orm.prisma",
              title: "ORM (Prisma)",
              description:
                "Conversar com o banco usando JavaScript em vez de SQL puro.",
              resources: [
                {
                  label: "Prisma",
                  url: "https://www.prisma.io/docs",
                  kind: "doc",
                },
              ],
            },
            {
              id: "bancodedados.orm.migrations",
              title: "Migrations",
              description:
                "Versionar mudanças na estrutura do banco, como o Git faz com o código.",
            },
            {
              id: "bancodedados.orm.conectar",
              title: "Conectar a API ao banco",
              description:
                "Fazer suas rotas lerem e gravarem dados de verdade.",
            },
          ],
        },
        {
          id: "bancodedados.nosql",
          title: "NoSQL (MongoDB)",
          description:
            "Guardar dados em documentos flexíveis em vez de tabelas.",
          optional: true,
        },
        {
          id: "bancodedados.cache",
          title: "Cache (Redis)",
          description:
            "Guardar dados quentes na memória pra responder mais rápido.",
          optional: true,
        },
      ],
    },
    {
      id: "autenticacao",
      title: "Autenticação e segurança",
      level: "avancado",
      description: "Identificar usuários e proteger a aplicação.",
      children: [
        {
          id: "autenticacao.senhas",
          title: "Hashing de senha (bcrypt)",
          description:
            "Nunca guardar a senha pura, só uma versão embaralhada dela.",
        },
        {
          id: "autenticacao.login",
          title: "Manter o usuário logado",
          children: [
            {
              id: "autenticacao.login.sessoes",
              title: "Sessões e cookies",
              description: "A forma clássica de lembrar quem está logado.",
            },
            {
              id: "autenticacao.login.jwt",
              title: "JWT (tokens)",
              description:
                "Um token assinado que identifica o usuário em cada requisição.",
              resources: [
                {
                  label: "JWT",
                  url: "https://jwt.io/introduction",
                  kind: "doc",
                },
              ],
            },
            {
              id: "autenticacao.login.middleware",
              title: "Middleware de autenticação",
              description: "Barrar rotas privadas pra quem não está logado.",
            },
          ],
        },
        {
          id: "autenticacao.seguranca",
          title: "Segurança básica",
          children: [
            {
              id: "autenticacao.seguranca.segredos",
              title: "Variáveis de ambiente e segredos",
              description: "Manter senhas e chaves fora do código.",
            },
            {
              id: "autenticacao.seguranca.cors",
              title: "CORS",
              description: "Controlar quais sites podem chamar sua API.",
              resources: [
                {
                  label: "MDN CORS",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CORS",
                  kind: "doc",
                },
              ],
            },
            {
              id: "autenticacao.seguranca.validacao",
              title: "Validação e sanitização",
              description: "Nunca confiar cegamente no que o usuário manda.",
            },
            {
              id: "autenticacao.seguranca.owasp",
              title: "Ameaças comuns (OWASP)",
              description:
                "As falhas de segurança mais frequentes e como evitá-las.",
              optional: true,
              resources: [
                {
                  label: "OWASP Top Ten",
                  url: "https://owasp.org/www-project-top-ten",
                  kind: "doc",
                },
              ],
            },
          ],
        },
        {
          id: "autenticacao.rate",
          title: "Rate limiting",
          description:
            "Limitar quantas requisições alguém pode fazer pra evitar abuso.",
          optional: true,
        },
      ],
    },
    {
      id: "qualidade",
      title: "Qualidade e Boas Práticas",
      level: "avancado",
      description: "O que separa um projeto de estudo de um profissional.",
      children: [
        {
          id: "qualidade.typescript",
          title: "TypeScript no back",
          description:
            "Adicionar tipos ao JavaScript pra pegar erros antes de rodar.",
          resources: [
            {
              label: "TypeScript",
              url: "https://www.typescriptlang.org/docs",
              kind: "doc",
            },
          ],
        },
        {
          id: "qualidade.estrutura",
          title: "Estrutura em camadas",
          description:
            "Separar rotas, regras de negócio e acesso a dados em pastas distintas.",
        },
        {
          id: "qualidade.erros",
          title: "Padrão de erros e respostas",
          description:
            "Devolver erros sempre no mesmo formato pra quem consome a API.",
        },
        {
          id: "qualidade.logging",
          title: "Logging",
          description:
            "Registrar o que acontece pra investigar problemas depois.",
        },
        {
          id: "qualidade.testes",
          title: "Testes",
          children: [
            {
              id: "qualidade.testes.unit",
              title: "Unitários (Vitest)",
              description: "Testar pedaços da lógica de forma automática.",
              resources: [
                {
                  label: "Vitest",
                  url: "https://vitest.dev/guide",
                  kind: "doc",
                },
              ],
            },
            {
              id: "qualidade.testes.integracao",
              title: "Integração de API (Supertest)",
              description: "Testar suas rotas de ponta a ponta.",
              optional: true,
            },
          ],
        },
        {
          id: "qualidade.docs",
          title: "Documentar a API (OpenAPI / Swagger)",
          description: "Descrever os endpoints pra quem vai consumir a API.",
          optional: true,
          resources: [
            { label: "OpenAPI", url: "https://www.openapis.org", kind: "doc" },
          ],
        },
      ],
    },
    {
      id: "deploy",
      title: "Projeto e Deploy",
      level: "avancado",
      description: "Juntar tudo e colocar no ar.",
      children: [
        {
          id: "deploy.planejar",
          title: "Planejar uma API real",
          description: "Definir os recursos e as rotas antes de codar.",
        },
        {
          id: "deploy.construir",
          title: "Construir aplicando tudo",
          description: "Juntar o que você aprendeu numa API de ponta a ponta.",
        },
        {
          id: "deploy.env",
          title: "Configuração por ambiente (.env)",
          description: "Separar configs de desenvolvimento e de produção.",
        },
        {
          id: "deploy.bancoprod",
          title: "Banco de dados gerenciado",
          description:
            "Usar um banco hospedado em vez de rodar na sua máquina.",
        },
        {
          id: "deploy.publicar",
          title: "Deploy (Railway, Render)",
          description: "Colocar a API no ar pra qualquer um acessar.",
          resources: [
            { label: "Railway", url: "https://docs.railway.app", kind: "doc" },
            { label: "Render", url: "https://render.com/docs", kind: "doc" },
          ],
        },
        {
          id: "deploy.monitor",
          title: "Logs e monitoramento",
          description: "Acompanhar a saúde da API depois que ela está no ar.",
        },
        {
          id: "deploy.ci",
          title: "CI básico",
          description: "Automatizar testes e build a cada mudança.",
          optional: true,
        },
        {
          id: "deploy.docker",
          title: "Docker (conceito)",
          description:
            "Empacotar a aplicação pra rodar igual em qualquer lugar.",
          optional: true,
        },
      ],
    },
  ],
};
