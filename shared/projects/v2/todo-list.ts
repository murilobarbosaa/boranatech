import type { ProjetoV2Detalhe } from "./types";

// TODO(Ana): revisar todo o texto deste modulo (piloto v2, nao aprovado)
const detalhe: ProjetoV2Detalhe = {
  id: "todo-list",
  tipoEntrega: "repo_deploy",
  briefing: {
    contexto:
      "Você abre o celular de manhã e tem cinco coisas para não esquecer. A lista de tarefas é o app mais simples que existe e, por isso, o melhor lugar para aprender o que todo app faz: reagir a um clique, guardar informação e mostrar de novo quando a página recarrega. Quem consegue fazer uma lista de tarefas funcionar sem framework entende o DOM, eventos e localStorage, que são a base de tudo que vem depois.",
    aprende: [
      "Manipular o DOM com JavaScript puro",
      "Reagir a eventos de clique e teclado",
      "Guardar dados no navegador com localStorage",
      "Organizar o código em funções pequenas",
      "Publicar um app estático no GitHub Pages",
    ],
    preRequisitos: [
      {
        rotulo: "Ter feito a Página Pessoal, ou saber HTML e CSS",
        href: "/projetos/landing-page-pessoal",
      },
      {
        rotulo: "Saber o básico de JavaScript (variáveis, funções, arrays)",
        href: "/dicionario?termo=JavaScript",
      },
      { rotulo: "Ter uma conta no GitHub", href: "/dicionario?termo=GitHub" },
    ],
    tempoEstimado: { horas: [6, 12], semanas: [1, 2] },
  },
  requisitos: [
    {
      id: "adicionar",
      descricao:
        "Um campo de texto e um botão (ou a tecla Enter) adicionam uma tarefa à lista",
      verificacao:
        "Print no README mostra o campo e a lista; o JS tem um listener de submit ou de click",
    },
    {
      id: "concluir",
      descricao:
        "Clicar na tarefa ou num checkbox marca como concluída, com visual diferente (riscada ou apagada)",
      verificacao:
        "Print no README com uma tarefa concluída; o CSS tem uma classe de concluída",
    },
    {
      id: "remover",
      descricao: "Cada tarefa tem um botão para remover",
      verificacao:
        "Print no README ou o HTML/JS tem um botão de remover por item",
    },
    {
      id: "persistir",
      descricao: "As tarefas continuam lá depois de recarregar a página",
      verificacao: "O JS chama localStorage.setItem e localStorage.getItem",
    },
    {
      id: "lista-vazia",
      descricao:
        "Quando não há tarefas, a tela mostra uma mensagem em vez de ficar em branco",
      verificacao:
        "Print no README da lista vazia ou texto de vazio no HTML/JS",
    },
    {
      id: "deploy-publico",
      descricao:
        "O app abre num link público (GitHub Pages ou Netlify) sem erro",
      verificacao: "O README traz a URL do app e ela responde",
    },
    {
      id: "readme-completo",
      descricao:
        "README com o que é o app, o link no ar, um print e o que você aprendeu",
      verificacao:
        "README.md existe com URL do app, uma imagem e uma seção de aprendizados",
    },
    {
      id: "cinco-commits",
      descricao: "Pelo menos 5 commits com mensagens que dizem o que mudou",
      verificacao: "A API do GitHub lista 5 ou mais commits",
    },
  ],
  etapas: [
    {
      id: "estrutura",
      titulo: "Estrutura",
      tempo: "1 h",
      oQueFazer: [
        "Crie index.html com um formulário (input e botão) e uma lista vazia (ul).",
        "Crie style.css com o visual básico e uma classe para tarefa concluída.",
      ],
      prontoQuando:
        "A página abre com o campo, o botão e a lista, mesmo que nada funcione ainda.",
    },
    {
      id: "adicionar",
      titulo: "Adicionar tarefa",
      tempo: "1 a 2 h",
      oQueFazer: [
        "Em app.js, guarde as tarefas num array.",
        "Escute o submit do formulário, adicione ao array e desenhe a lista do zero a partir dele.",
      ],
      prontoQuando: "Digitar e apertar Enter faz a tarefa aparecer na lista.",
    },
    {
      id: "concluir-remover",
      titulo: "Concluir e remover",
      tempo: "1 a 2 h",
      oQueFazer: [
        "Cada item ganha um clique para alternar concluída e um botão para remover.",
        "Toda mudança altera o array e redesenha a lista.",
      ],
      prontoQuando: "Dá para marcar, desmarcar e remover qualquer tarefa.",
    },
    {
      id: "persistir",
      titulo: "Persistir",
      tempo: "1 h",
      oQueFazer: [
        "Depois de cada mudança, salve o array no localStorage.",
        "Ao carregar a página, leia do localStorage antes de desenhar.",
      ],
      prontoQuando:
        "Recarregar a página mantém as tarefas e o estado de concluída.",
    },
    {
      id: "publicar",
      titulo: "Publicar",
      tempo: "30 min",
      oQueFazer: [
        "Suba para o GitHub, escreva o README com print e link, ative o GitHub Pages.",
      ],
      prontoQuando: "O link abre numa aba anônima e a lista funciona lá.",
    },
  ],
  kit: [
    {
      tipo: "checklist",
      titulo: "As seis funções que o app precisa",
      nota: "adicionar(texto). alternar(id). remover(id). desenhar(): apaga a lista e recria a partir do array. salvar(): grava o array no localStorage. carregar(): lê o localStorage no início.",
    },
    {
      tipo: "modelo",
      titulo: "Formato de uma tarefa",
      nota: '{ id: 1725500000000, texto: "Estudar JavaScript", concluida: false }. O id pode ser Date.now().',
    },
    {
      tipo: "modelo",
      titulo: "README mínimo",
      nota: "Título. Uma frase do que é. Link do app no ar. Um print. O que você aprendeu em 3 linhas (DOM, eventos, localStorage).",
    },
    {
      tipo: "link",
      titulo: "localStorage no MDN",
      url: "https://developer.mozilla.org/pt-BR/docs/Web/API/Window/localStorage",
      nota: "Só guarda texto: use JSON.stringify para salvar e JSON.parse para ler.",
    },
  ],
  ajuda: {
    trilha: {
      slug: "frontend",
      nodeIds: [
        "javascript.dom.manipular",
        "javascript.dom.eventos",
        "javascript.dom.storage",
        "javascript.arrays",
        "primeirosite.publicar",
      ],
    },
    termos: ["JavaScript", "DOM", "Deploy", "Commit"],
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
