export type IaCusto = "Grátis" | "Pago" | "Freemium";

export interface IaTool {
  nome: string;
  empresa: string;
  paraQueServe: string;
  quandoUsar: string;
  custo: IaCusto;
  url: string;
}

export interface IaToolGroup {
  grupo: string;
  descricao: string;
  ferramentas: IaTool[];
}

export const iaAvisos: string[] = [
  "São apoio, não substituem aprender de verdade.",
  "Podem errar e inventar informação (alucinar); verifique e teste antes de confiar.",
  "Nunca cole dados sensíveis: senhas, chaves, dados de clientes ou código confidencial.",
];

export const iaTools: IaToolGroup[] = [
  {
    grupo: "Conversacional e geral",
    descricao: "Assistentes para tirar dúvidas, explicar e rascunhar.",
    ferramentas: [
      {
        nome: "ChatGPT",
        empresa: "OpenAI",
        paraQueServe:
          "Tirar dúvidas, explicar conceitos e erros, rascunhar texto e código.",
        quandoUsar:
          "Pergunta geral, estudar um tópico ou gerar um primeiro rascunho.",
        custo: "Freemium",
        url: "https://chatgpt.com/",
      },
      {
        nome: "Claude",
        empresa: "Anthropic",
        paraQueServe: "Lidar com textos longos e ler ou explicar código.",
        quandoUsar:
          "Analisar um arquivo grande, revisar redação ou pedir raciocínio mais cuidadoso.",
        custo: "Freemium",
        url: "https://claude.ai/",
      },
      {
        nome: "Gemini",
        empresa: "Google",
        paraQueServe: "Assistente geral integrado ao ecossistema Google.",
        quandoUsar: "Dúvidas gerais e uso junto das ferramentas do Google.",
        custo: "Freemium",
        url: "https://gemini.google.com/",
      },
    ],
  },
  {
    grupo: "Pesquisa com fontes",
    descricao: "Para pesquisar e ter referências para conferir.",
    ferramentas: [
      {
        nome: "Perplexity",
        empresa: "Perplexity AI",
        paraQueServe: "Responde citando os links das fontes usadas.",
        quandoUsar:
          "Quando você precisa de referências para checar a resposta.",
        custo: "Freemium",
        url: "https://www.perplexity.ai/",
      },
    ],
  },
  {
    grupo: "Código",
    descricao: "Ajuda dentro do editor para escrever e entender código.",
    ferramentas: [
      {
        nome: "GitHub Copilot",
        empresa: "GitHub",
        paraQueServe: "Autocompletar de código dentro do editor.",
        quandoUsar: "Acelerar código repetitivo no dia a dia.",
        custo: "Freemium",
        url: "https://github.com/features/copilot",
      },
      {
        nome: "Cursor",
        empresa: "Anysphere",
        paraQueServe: "Editor de código com IA que explica, refatora e gera.",
        quandoUsar: "Programar com ajuda de IA dentro do editor.",
        custo: "Freemium",
        url: "https://cursor.com/",
      },
    ],
  },
  {
    grupo: "Imagem",
    descricao: "Geração de imagens a partir de texto.",
    ferramentas: [
      {
        nome: "DALL-E",
        empresa: "OpenAI",
        paraQueServe: "Gera imagens a partir de texto, dentro do ChatGPT.",
        quandoUsar: "Criar uma ilustração ou mockup simples.",
        custo: "Pago",
        url: "https://openai.com/index/dall-e-3/",
      },
      {
        nome: "Midjourney",
        empresa: "Midjourney",
        paraQueServe: "Geração de imagens de alta qualidade.",
        quandoUsar: "Imagens mais caprichadas, operando via site ou Discord.",
        custo: "Pago",
        url: "https://www.midjourney.com/",
      },
    ],
  },
  {
    grupo: "Estudo a partir dos seus materiais",
    descricao: "Aprende com os seus próprios documentos.",
    ferramentas: [
      {
        nome: "NotebookLM",
        empresa: "Google",
        paraQueServe:
          "Resume e responde perguntas a partir dos seus documentos.",
        quandoUsar: "Estudar de PDFs e anotações suas.",
        custo: "Freemium",
        url: "https://notebooklm.google.com/",
      },
    ],
  },
  {
    grupo: "Interface (UI)",
    descricao: "Geração de telas e componentes.",
    ferramentas: [
      {
        nome: "v0",
        empresa: "Vercel",
        paraQueServe:
          "Gera interfaces e componentes a partir de uma descrição.",
        quandoUsar: "Prototipar telas rápido.",
        custo: "Freemium",
        url: "https://v0.dev/",
      },
    ],
  },
];

export const iaUsageTips: { titulo: string; desc: string }[] = [
  {
    titulo: "Dê contexto",
    desc: "Diga seu nível, seu objetivo e o que já tentou antes de perguntar.",
  },
  {
    titulo: "Itere",
    desc: "Refine a resposta com novas instruções em vez de aceitar a primeira.",
  },
  {
    titulo: "Peça passo a passo",
    desc: "Peça explicação para entender, não só o resultado para copiar.",
  },
  {
    titulo: "Verifique e desconfie",
    desc: "A IA pode alucinar; cheque as fontes e teste o código antes de confiar.",
  },
  {
    titulo: "Não use como substituto",
    desc: "Ela acelera, mas você precisa entender o que ela entrega.",
  },
  {
    titulo: "Cuidado com dado sensível",
    desc: "Nunca cole senhas, chaves de API, dados de clientes ou código confidencial.",
  },
];

export const iaPromptTips: {
  tecnica: string;
  antes: string;
  depois: string;
}[] = [
  {
    tecnica: "Seja específico",
    antes: "Me ajuda com CSS.",
    depois:
      "Como centralizar uma div na horizontal e na vertical com Flexbox? Mostre o CSS e explique cada linha.",
  },
  {
    tecnica: "Dê exemplos",
    antes: "Escreve uma função de validação.",
    depois:
      "Escreva uma função JavaScript que valida e-mail: true para 'a@b.com' e false para 'a@b'. Inclua 3 testes.",
  },
  {
    tecnica: "Defina formato e tamanho",
    antes: "Explica APIs REST.",
    depois:
      "Explique APIs REST em 5 bullets curtos, com linguagem simples e sem jargão.",
  },
  {
    tecnica: "Peça raciocínio passo a passo",
    antes: "Esse código está certo?",
    depois:
      "Revise este código passo a passo, aponte os bugs e explique cada um antes de sugerir a correção.",
  },
  {
    tecnica: "Atribua um papel",
    antes: "Revisa meu currículo.",
    depois:
      "Aja como um recrutador tech. Revise meu currículo para vaga de dev júnior e aponte os 3 pontos mais fracos.",
  },
  {
    tecnica: "Itere com feedback",
    antes: "Aceitar a primeira resposta.",
    depois:
      "Bom começo. Agora deixe mais curto, foque em iniciantes e adicione um exemplo de código.",
  },
];

export const iaChooseByGoal: { objetivo: string; recomendacao: string }[] = [
  { objetivo: "Estudar um tópico", recomendacao: "ChatGPT, Claude ou Gemini" },
  { objetivo: "Estudar dos seus materiais", recomendacao: "NotebookLM" },
  { objetivo: "Programar no editor", recomendacao: "Cursor ou GitHub Copilot" },
  { objetivo: "Pesquisar com fontes", recomendacao: "Perplexity" },
  { objetivo: "Escrever e revisar texto", recomendacao: "ChatGPT ou Claude" },
  { objetivo: "Gerar imagem", recomendacao: "Midjourney ou DALL-E" },
  { objetivo: "Prototipar interface", recomendacao: "v0" },
];
