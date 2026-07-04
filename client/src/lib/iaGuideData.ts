export type IaCusto = "Grátis" | "Pago" | "Freemium";

export interface IaTool {
  nome: string;
  empresa: string;
  paraQueServe: string;
  quandoUsar: string;
  custo: IaCusto;
  url: string;
  temPortugues?: boolean;
  embaixadora?: boolean;
  docUrl?: string;
  videoUrl?: string;
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

// TODO: adicionar mais ferramentas (curadoria verificada, link oficial real).
// Basta acrescentar objetos IaTool nos grupos existentes ou criar novos grupos
// IaToolGroup { grupo, descricao, ferramentas: IaTool[] }. Nao inventar.
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
        temPortugues: true,
      },
      {
        nome: "Claude",
        empresa: "Anthropic",
        paraQueServe: "Lidar com textos longos e ler ou explicar código.",
        quandoUsar:
          "Analisar um arquivo grande, revisar redação ou pedir raciocínio mais cuidadoso.",
        custo: "Freemium",
        url: "https://claude.ai/",
        docUrl: "https://docs.anthropic.com/",
        temPortugues: true,
      },
      {
        nome: "Gemini",
        empresa: "Google",
        paraQueServe: "Assistente geral integrado ao ecossistema Google.",
        quandoUsar: "Dúvidas gerais e uso junto das ferramentas do Google.",
        custo: "Freemium",
        url: "https://gemini.google.com/",
        docUrl: "https://ai.google.dev/gemini-api/docs",
        temPortugues: true,
      },
      {
        nome: "Grok",
        empresa: "xAI",
        paraQueServe:
          "Assistente conversacional integrado ao X com respostas atuais.",
        quandoUsar: "Dúvidas gerais e acompanhar assuntos recentes.",
        custo: "Freemium",
        url: "https://grok.com/",
        docUrl: "https://docs.x.ai/",
      },
      {
        nome: "Microsoft Copilot",
        empresa: "Microsoft",
        paraQueServe: "Assistente da Microsoft integrado ao Windows e ao Office.",
        quandoUsar: "Usar IA dentro do Word, Excel e do navegador Edge.",
        custo: "Freemium",
        url: "https://copilot.microsoft.com/",
        docUrl: "https://support.microsoft.com/copilot",
        temPortugues: true,
      },
      {
        nome: "Le Chat",
        empresa: "Mistral AI",
        paraQueServe: "Assistente da Mistral para conversar e rascunhar texto.",
        quandoUsar: "Alternativa europeia para dúvidas e escrita.",
        custo: "Freemium",
        url: "https://chat.mistral.ai/",
        docUrl: "https://docs.mistral.ai/",
      },
      {
        nome: "Meta AI",
        empresa: "Meta",
        paraQueServe:
          "Assistente da Meta dentro do WhatsApp, Instagram e Messenger.",
        quandoUsar: "Tirar dúvidas rápidas sem sair dos apps da Meta.",
        custo: "Grátis",
        url: "https://www.meta.ai/",
      },
      {
        nome: "DeepSeek",
        empresa: "DeepSeek",
        paraQueServe: "Assistente de conversa e raciocínio com pesos abertos.",
        quandoUsar: "Estudar e resolver problemas com um modelo aberto.",
        custo: "Freemium",
        url: "https://chat.deepseek.com/",
        docUrl: "https://api-docs.deepseek.com/",
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
        docUrl: "https://docs.perplexity.ai/",
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
        docUrl: "https://docs.github.com/copilot",
      },
      {
        nome: "Cursor",
        empresa: "Anysphere",
        paraQueServe: "Editor de código com IA que explica, refatora e gera.",
        quandoUsar: "Programar com ajuda de IA dentro do editor.",
        custo: "Freemium",
        url: "https://cursor.com/",
        docUrl: "https://docs.cursor.com/",
        temPortugues: true,
        embaixadora: true,
      },
    ],
  },
  {
    grupo: "Criar app e site",
    descricao: "Geração de telas, sites e apps a partir de uma descrição.",
    ferramentas: [
      {
        nome: "v0",
        empresa: "Vercel",
        paraQueServe:
          "Gera interfaces e componentes a partir de uma descrição.",
        quandoUsar: "Prototipar telas rápido.",
        custo: "Freemium",
        url: "https://v0.dev/",
        docUrl: "https://v0.dev/docs",
      },
      {
        nome: "Bolt",
        empresa: "StackBlitz",
        paraQueServe: "Cria e roda apps web inteiros direto no navegador.",
        quandoUsar: "Tirar uma ideia do zero ao app sem configurar ambiente.",
        custo: "Freemium",
        url: "https://bolt.new/",
        docUrl: "https://support.bolt.new/",
      },
      {
        nome: "Lovable",
        empresa: "Lovable",
        paraQueServe: "Monta apps web completos a partir de conversa.",
        quandoUsar: "Criar um produto simples sem programar do zero.",
        custo: "Freemium",
        url: "https://lovable.dev/",
        docUrl: "https://docs.lovable.dev/",
      },
      {
        nome: "Replit",
        empresa: "Replit",
        paraQueServe:
          "Ambiente de programação no navegador com IA que gera apps.",
        quandoUsar: "Programar, hospedar e compartilhar projetos rápido.",
        custo: "Freemium",
        url: "https://replit.com/",
        docUrl: "https://docs.replit.com/",
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
        docUrl: "https://platform.openai.com/docs/guides/images",
        temPortugues: true,
      },
      {
        nome: "Midjourney",
        empresa: "Midjourney",
        paraQueServe: "Geração de imagens de alta qualidade.",
        quandoUsar: "Imagens mais caprichadas, operando via site ou Discord.",
        custo: "Pago",
        url: "https://www.midjourney.com/",
      },
      {
        nome: "Ideogram",
        empresa: "Ideogram",
        paraQueServe: "Gera imagens e lida bem com texto dentro da arte.",
        quandoUsar: "Criar logos, banners e imagens com palavras legíveis.",
        custo: "Freemium",
        url: "https://ideogram.ai/",
        docUrl: "https://docs.ideogram.ai/",
      },
      {
        nome: "Adobe Firefly",
        empresa: "Adobe",
        paraQueServe: "Geração de imagem da Adobe integrada ao Photoshop.",
        quandoUsar: "Criar e editar imagens dentro do fluxo da Adobe.",
        custo: "Freemium",
        url: "https://firefly.adobe.com/",
        docUrl: "https://helpx.adobe.com/firefly.html",
      },
      {
        nome: "Leonardo AI",
        empresa: "Leonardo",
        paraQueServe:
          "Geração de imagens com controle de estilo, voltada a arte e games.",
        quandoUsar: "Criar assets visuais com estilo consistente.",
        custo: "Freemium",
        url: "https://leonardo.ai/",
        docUrl: "https://docs.leonardo.ai/",
      },
      {
        nome: "Krea",
        empresa: "Krea",
        paraQueServe: "Geração e edição de imagem em tempo real.",
        quandoUsar: "Experimentar variações visuais rápido.",
        custo: "Freemium",
        url: "https://www.krea.ai/",
        docUrl: "https://docs.krea.ai/",
      },
      {
        nome: "Stable Diffusion",
        empresa: "Stability AI",
        paraQueServe: "Modelo aberto de geração de imagens a partir de texto.",
        quandoUsar: "Rodar geração de imagem localmente ou em serviços que o usam.",
        custo: "Freemium",
        url: "https://stability.ai",
        docUrl: "https://platform.stability.ai/docs",
      },
    ],
  },
  {
    grupo: "Vídeo",
    descricao: "Geração e edição de vídeo a partir de texto ou avatar.",
    ferramentas: [
      {
        nome: "Runway",
        empresa: "Runway",
        paraQueServe: "Gera e edita vídeos curtos a partir de texto e imagem.",
        quandoUsar: "Criar clipes e efeitos sem editor tradicional.",
        custo: "Freemium",
        url: "https://runwayml.com/",
      },
      {
        nome: "Sora",
        empresa: "OpenAI",
        paraQueServe: "Gera vídeos realistas a partir de uma descrição.",
        quandoUsar: "Produzir cenas curtas a partir de texto.",
        custo: "Pago",
        url: "https://sora.com/",
      },
      {
        nome: "Pika",
        empresa: "Pika",
        paraQueServe:
          "Cria vídeos curtos e animações a partir de texto e imagem.",
        quandoUsar: "Animar uma ideia rápido para redes.",
        custo: "Freemium",
        url: "https://pika.art/",
      },
      {
        nome: "Luma Dream Machine",
        empresa: "Luma AI",
        paraQueServe: "Gera vídeo a partir de texto e imagem.",
        quandoUsar: "Criar clipes curtos com movimento realista.",
        custo: "Freemium",
        url: "https://lumalabs.ai/",
        docUrl: "https://docs.lumalabs.ai/",
      },
      {
        nome: "HeyGen",
        empresa: "HeyGen",
        paraQueServe: "Cria vídeos com avatares que falam o seu texto.",
        quandoUsar: "Gravar um vídeo sem aparecer na câmera.",
        custo: "Freemium",
        url: "https://www.heygen.com/",
        docUrl: "https://docs.heygen.com/",
      },
      {
        nome: "Synthesia",
        empresa: "Synthesia",
        paraQueServe:
          "Vídeos com avatar e narração para treinamento e comunicação.",
        quandoUsar: "Produzir vídeos corporativos em escala.",
        custo: "Pago",
        url: "https://www.synthesia.io/",
        docUrl: "https://help.synthesia.io/",
      },
    ],
  },
  {
    grupo: "Áudio e voz",
    descricao: "Geração de voz e música a partir de texto.",
    ferramentas: [
      {
        nome: "ElevenLabs",
        empresa: "ElevenLabs",
        paraQueServe: "Gera narração em voz natural a partir de texto.",
        quandoUsar: "Criar locução para vídeos e podcasts.",
        custo: "Freemium",
        url: "https://elevenlabs.io/",
        docUrl: "https://elevenlabs.io/docs",
        embaixadora: true,
      },
      {
        nome: "Suno",
        empresa: "Suno",
        paraQueServe: "Cria músicas completas a partir de uma descrição.",
        quandoUsar: "Fazer uma trilha ou música por diversão.",
        custo: "Freemium",
        url: "https://suno.com/",
        docUrl: "https://help.suno.com/",
      },
      {
        nome: "Udio",
        empresa: "Udio",
        paraQueServe: "Gera músicas com voz e instrumentos a partir de texto.",
        quandoUsar: "Experimentar composições rápidas.",
        custo: "Freemium",
        url: "https://www.udio.com/",
        docUrl: "https://help.udio.com/",
      },
      {
        nome: "OpenAI Whisper",
        empresa: "OpenAI",
        paraQueServe: "Transcreve fala em texto com reconhecimento de voz, de código aberto.",
        quandoUsar: "Gerar legendas e transcrições de áudio e vídeo.",
        custo: "Grátis",
        url: "https://github.com/openai/whisper",
        docUrl: "https://platform.openai.com/docs/guides/speech-to-text",
      },
    ],
  },
  {
    grupo: "Produtividade e apresentações",
    descricao: "IA para apresentações, notas e fluxo de trabalho.",
    ferramentas: [
      {
        nome: "Gamma",
        empresa: "Gamma",
        paraQueServe: "Cria apresentações e documentos a partir de um tema.",
        quandoUsar: "Montar um slide bonito em minutos.",
        custo: "Freemium",
        url: "https://gamma.app/",
        docUrl: "https://help.gamma.app/",
      },
      {
        nome: "Notion AI",
        empresa: "Notion",
        paraQueServe: "Assistente de escrita e organização dentro do Notion.",
        quandoUsar: "Resumir, escrever e organizar notas no Notion.",
        custo: "Freemium",
        url: "https://www.notion.com/product/ai",
        docUrl: "https://www.notion.com/help/guides/using-notion-ai",
      },
      {
        nome: "Canva Magic Studio",
        empresa: "Canva",
        paraQueServe: "Recursos de IA do Canva para design e texto.",
        quandoUsar: "Criar posts e materiais visuais rápido.",
        custo: "Freemium",
        url: "https://www.canva.com/magic-studio/",
        temPortugues: true,
      },
      {
        nome: "Napkin",
        empresa: "Napkin",
        paraQueServe: "Transforma texto em diagramas e visuais.",
        quandoUsar: "Ilustrar uma ideia ou processo sem desenhar.",
        custo: "Freemium",
        url: "https://www.napkin.ai/",
      },
      {
        nome: "Otter.ai",
        empresa: "Otter",
        paraQueServe: "Transcreve e resume reuniões automaticamente.",
        quandoUsar: "Registrar e revisar o que foi dito em calls.",
        custo: "Freemium",
        url: "https://otter.ai/",
      },
      {
        nome: "Descript",
        empresa: "Descript",
        paraQueServe:
          "Edita áudio e vídeo editando o texto da transcrição.",
        quandoUsar: "Cortar e ajustar gravações sem editor complexo.",
        custo: "Freemium",
        url: "https://www.descript.com/",
      },
      {
        nome: "Grammarly",
        empresa: "Grammarly",
        paraQueServe: "Assistente de escrita que revisa gramática, clareza e tom.",
        quandoUsar: "Revisar textos e e-mails, principalmente em inglês.",
        custo: "Freemium",
        url: "https://www.grammarly.com",
        docUrl: "https://support.grammarly.com/",
      },
      {
        nome: "DeepL",
        empresa: "DeepL",
        paraQueServe: "Tradutor automático com foco em qualidade e naturalidade.",
        quandoUsar: "Traduzir textos entre idiomas com boa fluência.",
        custo: "Freemium",
        url: "https://www.deepl.com/pro",
        temPortugues: true,
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
        docUrl: "https://support.google.com/notebooklm",
        temPortugues: true,
      },
    ],
  },
  {
    grupo: "Modelos e comunidade",
    descricao: "Onde encontrar modelos abertos e a comunidade de IA.",
    ferramentas: [
      {
        nome: "Hugging Face",
        empresa: "Hugging Face",
        paraQueServe: "Repositório de modelos, datasets e demos de IA.",
        quandoUsar:
          "Testar modelos abertos e ver o que a comunidade publica.",
        custo: "Freemium",
        url: "https://huggingface.co/",
        docUrl: "https://huggingface.co/docs",
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

export interface IaCurso {
  nome: string;
  fonte: string;
  nivel: string;
  resumo: string;
  gratuito: boolean;
  url: string;
}

export const iaCursos: IaCurso[] = [
  {
    nome: "Elements of AI",
    fonte: "Universidade de Helsinki",
    nivel: "Iniciante",
    resumo: "Entenda o que é IA, sem código, com certificado gratuito.",
    gratuito: true,
    url: "https://www.elementsofai.com/",
  },
  {
    nome: "AI for Everyone",
    fonte: "DeepLearning.AI",
    nivel: "Iniciante",
    resumo: "Visao geral de IA pra qualquer área, não técnica.",
    gratuito: true,
    url: "https://www.deeplearning.ai/courses/ai-for-everyone/",
  },
  {
    nome: "Google AI Essentials",
    fonte: "Google",
    nivel: "Iniciante",
    resumo: "Usar IA no dia a dia de trabalho de forma prática.",
    gratuito: true,
    url: "https://www.cloudskillsboost.google/",
  },
  {
    nome: "Kaggle Learn",
    fonte: "Kaggle",
    nivel: "Iniciante",
    resumo: "Micro-cursos curtos e práticos, com notebooks prontos.",
    gratuito: true,
    url: "https://www.kaggle.com/learn",
  },
  {
    nome: "AI for Beginners",
    fonte: "Microsoft",
    nivel: "Iniciante",
    resumo: "24 lições abertas cobrindo fundamentos de IA.",
    gratuito: true,
    url: "https://github.com/microsoft/AI-For-Beginners",
  },
  {
    nome: "CS50 AI com Python",
    fonte: "Harvard",
    nivel: "Intermediário",
    resumo: "Fundamentos de IA com projetos, pede base de Python.",
    gratuito: true,
    url: "https://cs50.harvard.edu/ai/",
  },
  {
    nome: "Practical Deep Learning",
    fonte: "fast.ai",
    nivel: "Intermediário",
    resumo: "Deep learning mão na massa, do prático pro teórico.",
    gratuito: true,
    url: "https://course.fast.ai/",
  },
  {
    nome: "OpenAI Academy",
    fonte: "OpenAI",
    nivel: "Iniciante",
    resumo: "Materiais oficiais de uso de IA e prompts.",
    gratuito: true,
    url: "https://academy.openai.com/",
  },
  {
    nome: "Intro to Deep Learning (6.S191)",
    fonte: "MIT",
    nivel: "Intermediário",
    resumo: "Curso anual do MIT, atualizado com técnicas recentes.",
    gratuito: true,
    url: "https://introtodeeplearning.com/",
  },
];

export interface IaTermo {
  termo: string;
  definicao: string;
}

export const iaGlossario: IaTermo[] = [
  {
    termo: "LLM (modelo de linguagem)",
    definicao:
      "Programa treinado em muito texto que prevê e gera linguagem. É a base do ChatGPT, Claude e parecidos.",
  },
  {
    termo: "Prompt",
    definicao:
      "A instrução que você dá pra IA. Quanto mais claro e com contexto, melhor a resposta.",
  },
  {
    termo: "Token",
    definicao:
      "Pedaço de texto que o modelo processa. O tamanho de uma conversa é medido em tokens.",
  },
  {
    termo: "Alucinação",
    definicao:
      "Quando a IA responde algo errado com tom convincente. Por isso sempre verifique.",
  },
  {
    termo: "Janela de contexto",
    definicao:
      "Quanto de texto a IA consegue lembrar de uma vez na mesma conversa.",
  },
  {
    termo: "Fine-tuning",
    definicao: "Ajuste extra de um modelo com dados específicos pra uma tarefa.",
  },
  {
    termo: "RAG",
    definicao:
      "Técnica que liga a IA a uma base de documentos pra responder com fontes atualizadas.",
  },
  {
    termo: "Embedding",
    definicao:
      "Representação numérica de texto que permite buscar por significado, não só palavra.",
  },
  {
    termo: "Agente",
    definicao:
      "IA que executa passos e usa ferramentas sozinha pra cumprir uma tarefa, não só responde.",
  },
  {
    termo: "Multimodal",
    definicao:
      "IA que entende mais de um tipo de entrada, como texto, imagem e áudio.",
  },
  {
    termo: "Pesos abertos",
    definicao:
      "Modelos cujo miolo é publicado e pode ser baixado e rodado por qualquer um.",
  },
  {
    termo: "API",
    definicao:
      "Forma de um programa conversar com a IA por código, pra integrar em apps.",
  },
];

export interface IaCriador {
  nome: string;
  foco: string;
  plataforma: string;
  url: string;
}

export const iaCriadores: IaCriador[] = [
  {
    nome: "3Blue1Brown",
    foco: "Matemática e redes neurais com animações.",
    plataforma: "YouTube",
    url: "https://www.youtube.com/@3blue1brown",
  },
  {
    nome: "Two Minute Papers",
    foco: "Resumos curtos das pesquisas recentes de IA.",
    plataforma: "YouTube",
    url: "https://www.youtube.com/@TwoMinutePapers",
  },
  {
    nome: "Andrej Karpathy",
    foco: "Como os modelos funcionam por dentro, do zero.",
    plataforma: "YouTube",
    url: "https://www.youtube.com/@AndrejKarpathy",
  },
  {
    nome: "StatQuest",
    foco: "Estatística e machine learning de forma simples.",
    plataforma: "YouTube",
    url: "https://www.youtube.com/@statquest",
  },
  {
    nome: "sentdex",
    foco: "Python e IA na prática, com projetos.",
    plataforma: "YouTube",
    url: "https://www.youtube.com/@sentdex",
  },
  {
    nome: "DeepLearningAI",
    foco: "Canal do Andrew Ng, aulas e novidades de IA.",
    plataforma: "YouTube",
    url: "https://www.youtube.com/@Deeplearningai",
  },
  {
    nome: "IBM Technology",
    foco: "Explicações conceituais curtas de IA e dados.",
    plataforma: "YouTube",
    url: "https://www.youtube.com/@IBMTechnology",
  },
  {
    nome: "Matt Wolfe",
    foco: "Panorama de ferramentas e novidades de IA.",
    plataforma: "YouTube",
    url: "https://www.youtube.com/@mreflow",
  },
  {
    nome: "Lex Fridman",
    foco: "Entrevistas longas com nomes importantes de IA.",
    plataforma: "YouTube",
    url: "https://www.youtube.com/@lexfridman",
  },
  {
    nome: "Fireship",
    foco: "Visão rápida e dev-friendly de tech e IA.",
    plataforma: "YouTube",
    url: "https://www.youtube.com/@Fireship",
  },
];

export interface IaQuizOpcao {
  rotulo: string;
  recomendaA: string[];
  dica: string;
}

export const iaQuizPergunta = "O que você quer fazer agora?";

export const iaQuizOpcoes: IaQuizOpcao[] = [
  {
    rotulo: "Estudar ou tirar uma dúvida",
    recomendaA: ["ChatGPT", "Claude", "Gemini"],
    dica: "Peça explicação passo a passo e exemplos.",
  },
  {
    rotulo: "Programar",
    recomendaA: ["Cursor", "GitHub Copilot"],
    dica: "Use dentro do editor pra acelerar o código.",
  },
  {
    rotulo: "Pesquisar com fontes",
    recomendaA: ["Perplexity"],
    dica: "Ela responde citando os links pra você conferir.",
  },
  {
    rotulo: "Criar uma imagem",
    recomendaA: ["Midjourney", "Ideogram", "Leonardo AI"],
    dica: "Descreva estilo, cores e o que não quer.",
  },
  {
    rotulo: "Criar um vídeo",
    recomendaA: ["Runway", "Pika", "HeyGen"],
    dica: "Comece com clipes curtos pra testar.",
  },
  {
    rotulo: "Criar áudio ou voz",
    recomendaA: ["ElevenLabs", "Suno"],
    dica: "Bom pra narração, música e protótipos.",
  },
  {
    rotulo: "Escrever ou revisar texto",
    recomendaA: ["ChatGPT", "Claude"],
    dica: "Diga o tom, o público e o tamanho.",
  },
  {
    rotulo: "Criar um app ou site",
    recomendaA: ["v0", "Bolt", "Lovable"],
    dica: "Descreva a tela e vá ajustando.",
  },
  {
    rotulo: "Estudar dos seus materiais",
    recomendaA: ["NotebookLM"],
    dica: "Suba seus PDFs e pergunte sobre eles.",
  },
];
