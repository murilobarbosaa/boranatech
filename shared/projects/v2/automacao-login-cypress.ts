import type { ProjetoV2Detalhe } from "./types";

// TODO(Ana): revisar todo o texto deste modulo (piloto v2, nao aprovado)
const detalhe: ProjetoV2Detalhe = {
  id: "automacao-login-cypress",
  tipoEntrega: "repo",
  briefing: {
    contexto:
      "Toda vez que alguém muda o código de um site, o login pode quebrar, e ninguém quer descobrir isso pelo cliente. Automatizar o teste de login é o primeiro passo em automação: um robô que abre o site, preenche, clica e confere. Você vai fazer isso com Cypress contra um site de prática, cobrindo o caminho feliz e os erros, do jeito que se faz numa empresa.",
    aprende: [
      "Instalar e configurar o Cypress",
      "Selecionar elementos de forma estável",
      "Escrever cenários de sucesso e de falha",
      "Verificar redirecionamento e mensagens de erro",
      "Rodar em modo headless e ler o relatório",
    ],
    preRequisitos: [
      {
        rotulo: "Saber o básico de JavaScript",
        href: "/dicionario?termo=JavaScript",
      },
      { rotulo: "Ter o Node.js instalado", href: "/ferramentas?q=Node.js" },
      {
        rotulo: "Entender o que é um teste de ponta a ponta",
        href: "/dicionario?termo=Teste E2E",
      },
    ],
    tempoEstimado: { horas: [6, 10], semanas: [1, 2] },
  },
  requisitos: [
    {
      id: "setup",
      descricao: "Projeto com Cypress instalado e configurado",
      verificacao:
        "package.json tem cypress nas dependências e existe cypress.config.js ou .ts",
    },
    {
      id: "alvo",
      descricao: "O site de prática testado está declarado no README",
      verificacao: "README cita a URL do site",
    },
    {
      id: "cinco-cenarios",
      descricao:
        "Pelo menos 5 cenários: login com sucesso, senha errada, usuário inexistente, campos vazios e logout",
      verificacao: "README lista os cenários e a pasta cypress tem os specs",
    },
    {
      id: "seletores",
      descricao:
        "Seletores estáveis (atributos data-cy, data-test ou id), não por texto nem por posição, ou justificativa no README quando o site não oferece",
      verificacao: "README tem a seção de seletores",
    },
    {
      id: "assercoes",
      descricao:
        "Cada cenário confere o resultado: URL depois do login, mensagem de erro, ou volta à tela de login após logout",
      verificacao: "README descreve as asserções por cenário",
    },
    {
      id: "credenciais",
      descricao:
        "Credenciais fora do código, num cypress.env.json ignorado pelo git, com um exemplo versionado",
      verificacao:
        "Existe cypress.env.example.json (ou equivalente) e o .gitignore cita cypress.env.json",
    },
    {
      id: "headless",
      descricao: "npm test roda os specs em modo headless",
      verificacao: "package.json tem o script test com cypress run",
    },
    {
      id: "readme",
      descricao: "README com como rodar e um print do relatório da execução",
      verificacao: "README.md tem os comandos e uma imagem",
    },
  ],
  etapas: [
    {
      id: "setup",
      titulo: "Setup",
      tempo: "1 h",
      oQueFazer: [
        "npm init, instale o Cypress, abra uma vez com npx cypress open para ele criar a estrutura.",
        "Escolha o site de prática e anote no README.",
      ],
      prontoQuando: "O Cypress abre e mostra a pasta de specs.",
    },
    {
      id: "sucesso",
      titulo: "Primeiro cenário",
      tempo: "1 a 2 h",
      oQueFazer: [
        "Escreva login.cy.js com o caminho feliz: visita, preenche, clica, confere a URL.",
      ],
      prontoQuando: "O cenário passa em verde no runner.",
    },
    {
      id: "erros",
      titulo: "Cenários de erro",
      tempo: "2 a 3 h",
      oQueFazer: [
        "Senha errada, usuário inexistente e campos vazios, cada um conferindo a mensagem certa.",
        "Logout voltando para a tela de login.",
      ],
      prontoQuando: "Os cinco cenários passam.",
    },
    {
      id: "credenciais",
      titulo: "Seletores e credenciais",
      tempo: "1 h",
      oQueFazer: [
        "Troque seletores frágeis por atributos estáveis.",
        "Mova usuário e senha para cypress.env.json e crie o exemplo.",
      ],
      prontoQuando: "Nenhuma senha aparece no código versionado.",
    },
    {
      id: "headless",
      titulo: "Headless e documentar",
      tempo: "1 h",
      oQueFazer: [
        "Crie o script test com cypress run, rode, tire o print do relatório.",
        "Escreva o README.",
      ],
      prontoQuando:
        "npm test roda tudo no terminal e o README mostra o resultado.",
    },
  ],
  kit: [
    {
      tipo: "link",
      titulo: "Site de prática: The Internet",
      url: "https://the-internet.herokuapp.com/login",
      nota: "Login com usuário tomsmith e senha SuperSecretPassword!, e mensagens de erro claras.",
    },
    {
      tipo: "link",
      titulo: "Site de prática: Swag Labs",
      url: "https://www.saucedemo.com",
      nota: "Vários usuários, inclusive um bloqueado, o que dá um cenário extra.",
    },
    {
      tipo: "modelo",
      titulo: "Esqueleto de um spec",
      nota: "describe('Login'). beforeEach: cy.visit(url). it('entra com credenciais válidas'). it('mostra erro com senha errada'). Cada it termina com pelo menos um should.",
    },
    {
      tipo: "checklist",
      titulo: "O que conferir em cada cenário",
      nota: "URL depois da ação. Texto da mensagem. Elemento que só existe logado (ou deslogado). Nada de cy.wait com número fixo.",
    },
    {
      tipo: "link",
      titulo: "Documentação do Cypress",
      url: "https://docs.cypress.io",
      nota: "Best Practices é a página para ler antes de escolher seletores.",
    },
  ],
  ajuda: {
    trilha: {
      slug: "qa",
      nodeIds: ["automacao.porque", "automacao.ferramentas", "automacao.ci"],
    },
    termos: ["Teste E2E", "Automação de testes", "JavaScript"],
  },
  verificacaoAutomatica: [
    "repo_publico",
    "readme_existe",
    "arquivo:package.json",
    "pasta:cypress",
    "min_commits_5",
  ],
};

export default detalhe;
