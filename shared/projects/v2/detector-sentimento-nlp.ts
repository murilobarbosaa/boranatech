import type { ProjetoV2Detalhe } from "./types";

// TODO(Ana): revisar todo o texto deste modulo (piloto v2, nao aprovado)
const detalhe: ProjetoV2Detalhe = {
  id: "detector-sentimento-nlp",
  tipoEntrega: "notebook",
  briefing: {
    contexto:
      "Uma loja recebe duas mil avaliações por mês e ninguém consegue ler tudo. Um modelo de sentimento diz em segundos quantas são positivas, quantas são negativas e onde está a reclamação. Você não vai treinar nada: vai usar um modelo pronto do Hugging Face, entender o que ele devolve, medir onde ele erra em português e colocar numa interface simples. É o projeto de entrada em IA aplicada.",
    aprende: [
      "Usar um modelo pré-treinado com a biblioteca transformers",
      "Ler label e score de um pipeline de NLP",
      "Medir acertos com exemplos em português",
      "Montar uma interface com Streamlit",
      "Publicar e documentar um app de IA com suas limitações",
    ],
    preRequisitos: [
      { rotulo: "Python básico", href: "/roadmaps/inteligencia-artificial" },
      {
        rotulo: "Saber usar um notebook (Colab serve e já tem GPU grátis)",
        href: "/dicionario?termo=Notebook",
      },
      { rotulo: "Saber o que é deploy", href: "/dicionario?termo=Deploy" },
    ],
    tempoEstimado: { horas: [6, 12], semanas: [1, 2] },
  },
  requisitos: [
    {
      id: "modelo",
      descricao:
        "Notebook ou script carrega um pipeline de análise de sentimento do Hugging Face com um modelo em português ou multilíngue, nomeado",
      verificacao: "O nome do modelo aparece no código e no README",
    },
    {
      id: "funcao",
      descricao: "Uma função que recebe um texto e devolve o rótulo e o score",
      verificacao: "Função identificável no código",
    },
    {
      id: "medicao",
      descricao:
        "Teste com pelo menos vinte frases (dez positivas, dez negativas) e uma tabela com o percentual de acerto",
      verificacao: "Tabela no notebook ou no README",
    },
    {
      id: "erros",
      descricao:
        "Seção onde erra, com três exemplos de erro e uma hipótese para cada (ironia, gíria, negação)",
      verificacao: "Seção no notebook ou no README",
    },
    {
      id: "interface",
      descricao: "App Streamlit com caixa de texto e resultado",
      verificacao: "Print da interface no README",
    },
    {
      id: "publicado",
      descricao:
        "App publicado no Streamlit Community Cloud, ou notebook público no Colab ou Kaggle se o app não for publicado",
      verificacao: "O link abre sem login",
    },
    {
      id: "readme",
      descricao: "README com o modelo usado, o link, um print e as limitações",
      verificacao: "README.md com os quatro itens",
    },
    {
      id: "requirements",
      descricao: "requirements.txt com transformers, torch e streamlit",
      verificacao: "Arquivo na raiz",
    },
  ],
  etapas: [
    {
      id: "modelo",
      titulo: "Ambiente e modelo",
      tempo: "1 a 2 h",
      oQueFazer: [
        "No Colab, instale transformers e carregue um pipeline de sentiment-analysis com um modelo em português ou multilíngue.",
        "Passe três frases e olhe o que volta.",
      ],
      prontoQuando: "O pipeline responde com label e score.",
    },
    {
      id: "funcao",
      titulo: "Função e primeiros testes",
      tempo: "1 h",
      oQueFazer: [
        "Embrulhe numa função que recebe texto e devolve rótulo e score.",
        "Teste frases com ironia e gíria de propósito.",
      ],
      prontoQuando:
        "A função funciona e você já viu ela errar pelo menos uma vez.",
    },
    {
      id: "medir",
      titulo: "Medir",
      tempo: "1 a 2 h",
      oQueFazer: [
        "Escreva vinte frases que você tem certeza do sentimento.",
        "Rode todas, monte a tabela, calcule o percentual, separe os erros.",
      ],
      prontoQuando:
        "Tabela com vinte linhas e a seção onde erra com três exemplos.",
    },
    {
      id: "streamlit",
      titulo: "Interface",
      tempo: "1 a 2 h",
      oQueFazer: ["app.py com st.text_area, botão e o resultado com o score."],
      prontoQuando: "streamlit run app.py abre e classifica o que você digita.",
    },
    {
      id: "publicar",
      titulo: "Publicar e documentar",
      tempo: "1 h",
      oQueFazer: [
        "requirements.txt. Suba para o GitHub. Publique no Streamlit Community Cloud.",
        "README com modelo, link, print e limitações.",
      ],
      prontoQuando: "O link abre numa aba anônima e classifica uma frase.",
    },
  ],
  kit: [
    {
      tipo: "link",
      titulo: "Modelos no Hugging Face Hub",
      url: "https://huggingface.co/models",
      nota: "Filtre por Text Classification e procure por sentiment com portuguese ou multilingual. Leia o card do modelo: ele diz em que dados foi treinado.",
    },
    {
      tipo: "link",
      titulo: "Streamlit Community Cloud",
      url: "https://streamlit.io/cloud",
      nota: "Gratuito, publica direto do repositório no GitHub. Modelos grandes podem estourar a memória do plano gratuito: prefira modelos pequenos.",
    },
    {
      tipo: "modelo",
      titulo: "Tabela de acertos",
      nota: "Frase. Sentimento esperado. Rótulo do modelo. Score. Acertou (sim, não). No fim: acertos divididos por vinte.",
    },
    {
      tipo: "checklist",
      titulo: "Frases que costumam derrubar o modelo",
      nota: "Ironia (que atendimento maravilhoso, esperei duas horas). Negação (não achei ruim). Gíria regional. Frase com elogio e reclamação juntos. Texto em maiúsculas.",
    },
  ],
  ajuda: {
    trilha: {
      slug: "inteligencia-artificial",
      nodeIds: [
        "fundamentos.ambiente",
        "dominios.nlp",
        "generativa.huggingface",
        "pratica.kaggle",
      ],
    },
    termos: ["Notebook", "Deploy"],
  },
  verificacaoAutomatica: ["artefato_responde"],
};

export default detalhe;
