import type { ProjetoV2Detalhe } from "./types";

// TODO(Ana): revisar todo o texto deste modulo (piloto v2, nao aprovado)
const detalhe: ProjetoV2Detalhe = {
  id: "plano-testes",
  tipoEntrega: "documento",
  briefing: {
    contexto:
      "Antes de um app ir para a loja, alguém precisa dizer: testei isso, isso e isso, e achei esses problemas. Esse alguém é QA, e o plano de testes é o documento que organiza o trabalho: o que será testado, como, com quais dados, e o que saiu errado. Escolha um app real que você usa (banco, delivery, transporte) e teste como se fosse o QA da empresa. Sem código: é raciocínio, método e registro.",
    aprende: [
      "Mapear funcionalidades e priorizar o que testar",
      "Escrever casos de teste com passos e resultado esperado",
      "Executar e registrar o resultado de cada caso",
      "Reportar um bug que o desenvolvedor consegue reproduzir",
      "Organizar tudo num plano que outra pessoa segue",
    ],
    preRequisitos: [
      {
        rotulo: "Saber o que QA faz no ciclo de desenvolvimento",
        href: "/roadmaps/qa",
      },
      {
        rotulo: "Saber o que é um caso de teste",
        href: "/dicionario?termo=Caso de teste",
      },
      {
        rotulo: "Saber o que é um bug e um bug report",
        href: "/dicionario?termo=Bug",
      },
    ],
    tempoEstimado: { horas: [6, 10], semanas: [1, 2] },
  },
  requisitos: [
    {
      id: "escopo",
      descricao:
        "App escolhido, plataforma e versão, e o escopo do que será testado, declarados no início",
      verificacao: "Seção de escopo no documento",
    },
    {
      id: "mapa",
      descricao:
        "Mapa de pelo menos cinco funcionalidades com prioridade (alta, média, baixa)",
      verificacao: "Tabela de funcionalidades",
    },
    {
      id: "casos",
      descricao:
        "Pelo menos quinze casos de teste com id, pré-condição, passos, dado de teste e resultado esperado",
      verificacao: "Tabela de casos com as cinco colunas",
    },
    {
      id: "negativos",
      descricao:
        "Pelo menos dois cenários negativos (entrada errada, sem internet, campo vazio) para cada funcionalidade de prioridade alta",
      verificacao: "Casos marcados como negativos",
    },
    {
      id: "execucao",
      descricao:
        "Cada caso executado com status (passou, falhou, bloqueado) e data",
      verificacao: "Colunas de status e data preenchidas",
    },
    {
      id: "bugs",
      descricao:
        "Pelo menos dois bugs reportados com passos para reproduzir, esperado versus obtido, severidade e evidência (print)",
      verificacao: "Seção de bugs com os campos",
    },
    {
      id: "resumo",
      descricao:
        "Resumo com percentual de casos aprovados e uma recomendação (pode lançar, não pode, pode com ressalvas)",
      verificacao: "Seção de resumo",
    },
    {
      id: "publico",
      descricao:
        "Documento público (Notion, Google Docs ou Sheets, ou GitHub) com as seções nomeadas",
      verificacao: "O link abre sem login",
    },
    {
      id: "privacidade",
      descricao:
        "Nenhum dado pessoal real nos prints (nome, saldo, endereço borrados ou de conta de teste)",
      verificacao: "Prints sem dado pessoal visível",
    },
  ],
  etapas: [
    {
      id: "mapear",
      titulo: "Escolher e mapear",
      tempo: "1 h",
      oQueFazer: [
        "Escolha o app e a versão. Liste as funcionalidades que uma pessoa usa numa semana normal.",
        "Dê prioridade pelo impacto de quebrar.",
      ],
      prontoQuando: "Tabela com cinco ou mais funcionalidades priorizadas.",
    },
    {
      id: "casos",
      titulo: "Escrever os casos",
      tempo: "2 a 3 h",
      oQueFazer: [
        "Para cada funcionalidade, o caminho feliz e os negativos.",
        "Passos numerados, dado de teste explícito, resultado esperado observável.",
      ],
      prontoQuando:
        "Quinze casos que outra pessoa conseguiria executar sem perguntar nada.",
    },
    {
      id: "executar",
      titulo: "Executar",
      tempo: "1 a 2 h",
      oQueFazer: [
        "Execute um a um, registre status e data.",
        "Quando falhar, guarde o print na hora.",
      ],
      prontoQuando: "Todos os casos têm status.",
    },
    {
      id: "bugs",
      titulo: "Reportar bugs",
      tempo: "1 h",
      oQueFazer: [
        "Para cada falha, um bug report com o modelo do kit.",
        "Severidade pelo impacto, não pela sua irritação.",
      ],
      prontoQuando:
        "Dois ou mais bugs que um desenvolvedor reproduziria só lendo.",
    },
    {
      id: "resumir",
      titulo: "Resumir e publicar",
      tempo: "30 min",
      oQueFazer: [
        "Percentual de aprovação, principais riscos, recomendação.",
        "Nomeie as seções e publique.",
      ],
      prontoQuando: "O link abre numa aba anônima.",
    },
  ],
  kit: [
    {
      tipo: "modelo",
      titulo: "Colunas do caso de teste",
      nota: "ID (CT-01). Funcionalidade. Tipo (positivo, negativo). Pré-condição. Passos numerados. Dado de teste. Resultado esperado. Status. Data. Observação.",
    },
    {
      tipo: "modelo",
      titulo: "Bug report",
      nota: "Título curto. Ambiente (app, versão, aparelho, sistema). Passos para reproduzir. Resultado esperado. Resultado obtido. Severidade (bloqueante, alta, média, baixa). Evidência (print ou vídeo). Frequência (sempre, às vezes).",
    },
    {
      tipo: "checklist",
      titulo: "Cenários negativos que quase sempre rendem bug",
      nota: "Campo vazio. Texto longo demais. Caractere especial. Sem internet no meio da ação. Voltar com o botão do sistema. Girar a tela. Duplo clique no botão de confirmar.",
    },
    {
      tipo: "modelo",
      titulo: "Escala de severidade",
      nota: "Bloqueante: impede a tarefa principal. Alta: tarefa principal com contorno difícil. Média: função secundária ou contorno fácil. Baixa: visual ou texto.",
    },
  ],
  ajuda: {
    trilha: {
      slug: "qa",
      nodeIds: [
        "design.casos",
        "design.tecnicas",
        "design.plano",
        "design.bugs",
        "execucao.manual",
      ],
    },
    termos: ["Caso de teste", "Bug"],
  },
  verificacaoAutomatica: ["artefato_responde"],
};

export default detalhe;
