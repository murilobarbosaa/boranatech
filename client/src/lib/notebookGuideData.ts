export const notebookFraming: string[] = [
  "Você não precisa de máquina cara para começar a estudar tech.",
  "Dá para começar com o que você já tem; muita coisa roda no navegador.",
  "Quando o notebook for fraco, a nuvem resolve boa parte com editores online e ambientes prontos.",
];

export const notebookParts: {
  peca: string;
  oQueFaz: string;
  quantoBasta: string;
}[] = [
  {
    peca: "Processador (CPU)",
    oQueFaz: "O cérebro que executa as tarefas.",
    quantoBasta:
      "Um processador moderno de linha intermediária já dá conta de estudar e programar.",
  },
  {
    peca: "Memória RAM",
    oQueFaz:
      "Espaço de trabalho do que está aberto agora; pouca RAM trava com muitas abas.",
    quantoBasta: "8 GB é o mínimo confortável hoje; 16 GB deixa tudo folgado.",
  },
  {
    peca: "Armazenamento (SSD vs HD)",
    oQueFaz: "Onde ficam arquivos e programas; SSD é muito mais rápido que HD.",
    quantoBasta: "Prefira SSD; 256 GB para começar, 512 GB mais tranquilo.",
  },
  {
    peca: "Placa de vídeo (GPU)",
    oQueFaz:
      "Processa gráficos; só importa para jogos, edição pesada, 3D ou treinar IA localmente.",
    quantoBasta: "Para programar e estudar, a GPU integrada basta.",
  },
  {
    peca: "Tela",
    oQueFaz: "Onde você passa horas; Full HD cansa menos a vista.",
    quantoBasta: "Full HD (1920x1080) é o ponto doce; tamanho é gosto pessoal.",
  },
  {
    peca: "Bateria",
    oQueFaz: "Quanto tempo longe da tomada.",
    quantoBasta:
      "Importa se você estuda fora de casa; veja avaliações reais, não só o número do fabricante.",
  },
  {
    peca: "Sistema operacional",
    oQueFaz: "A base onde tudo roda (Windows, macOS ou Linux).",
    quantoBasta:
      "Qualquer um serve para aprender; use o que você tem e se sente confortável.",
  },
];

export const notebookByGoal: {
  objetivo: string;
  ram: string;
  ssd: string;
  gpu: string;
  nota: string;
}[] = [
  {
    objetivo: "Programação web e estudo geral",
    ram: "8 GB (16 GB folgado)",
    ssd: "256 GB+",
    gpu: "integrada basta",
    nota: "O caso mais leve, roda no navegador e no editor.",
  },
  {
    objetivo: "Back-end e DevOps",
    ram: "16 GB recomendado",
    ssd: "512 GB+",
    gpu: "integrada basta",
    nota: "Containers e vários serviços ao mesmo tempo pedem mais RAM.",
  },
  {
    objetivo: "Ciência de dados e IA",
    ram: "16 GB+ (32 GB se possível)",
    ssd: "512 GB+",
    gpu: "dedicada ajuda a treinar modelos, mas muita coisa roda na nuvem",
    nota: "Datasets e notebooks pesam na RAM.",
  },
  {
    objetivo: "Design e UX",
    ram: "16 GB recomendado",
    ssd: "512 GB+",
    gpu: "integrada serve, dedicada ajuda em edição pesada",
    nota: "Ferramentas visuais e muitos arquivos abertos.",
  },
  {
    objetivo: "Mobile",
    ram: "16 GB recomendado",
    ssd: "512 GB+",
    gpu: "integrada basta",
    nota: "Emuladores de Android consomem bastante RAM. Para desenvolver para iOS é preciso um Mac, porque o Xcode só roda no macOS; para Android qualquer sistema serve.",
  },
  {
    objetivo: "Jogos",
    ram: "16 GB",
    ssd: "512 GB+",
    gpu: "dedicada necessária",
    nota: "Único caso em que a GPU é prioridade real.",
  },
];

export const notebookTiers: {
  faixa: string;
  entrega: string;
  praQuem: string;
}[] = [
  {
    faixa: "Entrada",
    entrega:
      "Liga, navega e roda editor de código e o básico, com paciência ao abrir várias coisas.",
    praQuem:
      "Pra quem começa do zero, foco em web e estudo geral, com orçamento curto.",
  },
  {
    faixa: "Intermediário",
    entrega: "Roda vários programas ao mesmo tempo sem travar.",
    praQuem:
      "Pra quem já tem direção e quer trabalhar sem frustração; cobre a maioria dos casos.",
  },
  {
    faixa: "Parrudo",
    entrega: "Aguenta cargas pesadas como IA local, jogos ou edição de vídeo.",
    praQuem:
      "Pra quem precisa de GPU dedicada ou trabalha com dados, jogos ou mídia.",
  },
];

export const notebookExtras: { titulo: string; desc: string }[] = [
  {
    titulo: "Novo vs usado ou recondicionado",
    desc: "Usado ou recondicionado de procedência confiável estica o orçamento; cheque bateria, garantia e estado real antes de fechar.",
  },
  {
    titulo: "Use a nuvem quando a máquina for fraca",
    desc: "Dá para programar pelo navegador em ambientes prontos como GitHub Codespaces e Replit; bom para começar sem depender do hardware.",
  },
];

export const notebookBuyingTips: { titulo: string; desc: string }[] = [
  {
    titulo: "Priorize RAM e SSD",
    desc: "São o que mais muda a sensação de velocidade no dia a dia.",
  },
  {
    titulo: "Não pague a mais por GPU sem precisar",
    desc: "Para programar e estudar, GPU dedicada raramente compensa.",
  },
  {
    titulo: "Windows, Mac ou Linux",
    desc: "Qualquer um aprende; macOS é caro, Linux é leve e gratuito, Windows é o mais comum. Use o que cabe no bolso e no costume.",
  },
  {
    titulo: "Espere promoção",
    desc: "Datas como Black Friday costumam ter bons descontos; pesquise o histórico de preço.",
  },
  {
    titulo: "Requisito mínimo honesto",
    desc: "8 GB de RAM e SSD já dão para começar. Abaixo disso, a nuvem ajuda.",
  },
];
