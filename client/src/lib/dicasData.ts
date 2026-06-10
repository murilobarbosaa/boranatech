export interface DicaArtigo {
  title: string;
  url: string;
}

export interface DicaTema {
  key: string;
  label: string;
  intro?: string;
  passos: string[];
  artigos: DicaArtigo[];
}

export const dicasPraticas: DicaTema[] = [
  {
    key: "estagio",
    label: "Estágio",
    intro:
      "A porta de entrada mais comum. Não pesa saber tudo, pesa mostrar que você aprende e já fez coisas.",
    passos: [
      "Monte 2 a 3 projetos no GitHub e saiba explicar um de ponta a ponta.",
      "Currículo de 1 página com tecnologias e links dos projetos.",
      "LinkedIn completo, conecte com gente da área e poste o que aprende.",
      "Procure em LinkedIn (aba Vagas) e em job boards como DIO, GeekHunter e Coodesh, além dos programas de estágio das empresas.",
      "Candidate-se a muitas vagas, mesmo sem cumprir 100% dos requisitos.",
      "Espere nãos; cada processo é treino.",
    ],
    artigos: [
      {
        title: "DIO: Como consegui meu estágio em TI",
        url: "https://www.dio.me/articles/como-consegui-meu-estagio-em-ti-e-como-voce-pode-conquistar-o-seu-tambem-ba2d1efe0e77",
      },
      {
        title:
          "dev.to: 8 dicas para conseguir o seu primeiro estágio como desenvolvedor(a)",
        url: "https://dev.to/dellamora/8-dicas-para-conseguir-o-seu-primeiro-estagio-como-desenvolvedor-a-4345",
      },
    ],
  },
  {
    key: "curriculo",
    label: "Currículo e LinkedIn",
    intro:
      "Currículo de dev é curto e mostra o que você fez, não uma lista de tarefas.",
    passos: [
      "1 página objetiva, com tecnologias e projetos com links.",
      "Adapte pra cada vaga usando termos da descrição (filtro ATS).",
      "Corte o óbvio (pacote Office, Windows).",
      "Use verbos de ação e resultados quando tiver.",
      "LinkedIn com foto, headline clara e projetos fixados.",
      "Peça pra alguém da área revisar.",
    ],
    artigos: [
      {
        title: "Indeed Brasil: Currículo para programador (com dicas)",
        url: "https://br.indeed.com/conselho-de-carreira/curriculos-cartas-apresentacao/curriculo-programador",
      },
      {
        title:
          "DevMedia: Como criar um currículo de programador mesmo sem experiência",
        url: "https://www.devmedia.com.br/como-criar-um-curriculo-de-programador-mesmo-sem-experiencia/44190",
      },
    ],
  },
  {
    key: "entrevistas",
    label: "Entrevistas",
    intro:
      "O processo costuma ter etapas (triagem, técnico, comportamental); preparar cada uma muda o jogo.",
    passos: [
      "Revise lógica e o básico da stack da vaga.",
      "Pratique resolver problema explicando o raciocínio em voz alta.",
      "Tenha exemplos reais pra perguntas comportamentais (situação, o que fez, resultado).",
      "Estude a empresa e leve perguntas.",
      "Não saber algo é normal; mostre como buscaria a resposta.",
    ],
    artigos: [
      {
        title:
          "Coodesh: Entrevista técnica para desenvolvedores, veja como se sair bem",
        url: "https://coodesh.com/blog/candidates/dicas/entrevista-tecnica-para-desenvolvedores/",
      },
      {
        title: "Revelo: Entrevista com desenvolvedor, 12 perguntas frequentes",
        url: "https://blog.revelo.com.br/entrevista-com-desenvolvedor/",
      },
    ],
  },
  {
    key: "portfolio",
    label: "Portfólio e GitHub",
    intro: "Seu GitHub é a prova prática do que você sabe.",
    passos: [
      "Projetos que resolvem algo real superam clones de tutorial.",
      "README claro em cada um (o que é, como rodar, print ou deploy).",
      "2 a 3 bem-feitos superam 10 pela metade.",
      "Commits frequentes e descritivos, perfil organizado.",
      "Faça deploy de pelo menos um (Vercel ou Netlify) pra ter link ao vivo.",
    ],
    artigos: [
      {
        title:
          "DIO: Como construir um portfólio profissional no GitHub mesmo sendo iniciante",
        url: "https://www.dio.me/articles/como-construir-um-portfolio-profissional-no-github-mesmo-sendo-iniciante-fb2b377ae094",
      },
      {
        title: "dev.to: Dicas para usar o GitHub como portfólio",
        url: "https://dev.to/github/dicas-para-usar-o-github-como-portfolio-2ab8",
      },
    ],
  },
  {
    key: "estudar",
    label: "Como estudar",
    intro: "Constância e prática batem maratona e teoria solta.",
    passos: [
      "Aprenda fazendo: cada conceito vira um mini-projeto.",
      "Uma trilha por vez, evite pular de tecnologia.",
      "Reconstrua do zero pra fixar.",
      "Documente o que estuda.",
      "Pratique resolução de problemas com regularidade.",
    ],
    artigos: [
      {
        title: "roadmap.sh: trilhas de aprendizado por área",
        url: "https://roadmap.sh",
      },
      {
        title: "Alura: Como começar a programar do zero, guia completo",
        url: "https://www.alura.com.br/artigos/como-comecar-programar",
      },
    ],
  },
  {
    key: "softskills",
    label: "Soft skills",
    intro: "O que destrava a carreira tanto quanto o código.",
    passos: [
      "Comunique com clareza e saiba explicar o que fez.",
      "Faça boas perguntas (contexto e o que já tentou).",
      "Code review com humildade.",
      "Dê e receba feedback sem levar pro pessoal.",
      "Inglês técnico destrava documentação.",
    ],
    artigos: [
      {
        title: "Alura: Soft skills para desenvolvedores, o guia completo",
        url: "https://www.alura.com.br/artigos/soft-skills-para-devs",
      },
      {
        title: "DIO: A importância das soft skills no mundo da programação",
        url: "https://www.dio.me/articles/a-importancia-das-soft-skills-no-mundo-da-programacao",
      },
    ],
  },
  {
    key: "carreira",
    label: "Carreira e mercado",
    intro: "Como sair do júnior e crescer.",
    passos: [
      "Foque em fundamentos, não só na ferramenta da moda.",
      "Networking: comunidades e eventos abrem portas reais.",
      "Peça feedback e mostre evolução pra crescer de júnior pra pleno.",
      "Ajudar outras pessoas também acelera seu aprendizado.",
    ],
    artigos: [],
  },
  {
    key: "bemestar",
    label: "Bem-estar",
    passos: [
      "Ritmo sustentável; aprender cansa e descansar faz parte.",
      "Comparação é armadilha; cada trajetória é uma.",
      "Pedir ajuda é maturidade, não fraqueza.",
    ],
    artigos: [],
  },
];
