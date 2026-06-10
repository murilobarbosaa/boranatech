export interface DicaArtigo {
  title: string;
  url: string;
  desc?: string;
}

export interface CarreiraTema {
  key: string;
  label: string;
  texto: string;
  pontos: string[];
  artigos: DicaArtigo[];
}

export interface Filme {
  titulo: string;
  ano: string;
  porque: string;
}

export interface Livro {
  titulo: string;
  autor: string;
  url?: string;
}

export const carreiraTemas: CarreiraTema[] = [
  {
    key: "estagio",
    label: "Estágio",
    texto:
      "Empresas de estágio não esperam que você saiba tudo, esperam evidência de que você aprende sozinha e já colocou a mão na massa. Por isso 2 a 3 projetos no GitHub que você saiba explicar de ponta a ponta valem mais que cursos não terminados. Trate cada processo como treino: a maioria recebe vários nãos antes do sim. Candidate-se mesmo sem cumprir todos os requisitos (são lista de desejos, não eliminatórios).",
    pontos: [
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
    texto:
      "Currículo de dev é curto e mostra o que você fez, não tarefas genéricas. Muitos passam por filtro ATS, então adapte a cada vaga com termos da descrição. Resultados concretos e links de projetos valem mais que adjetivos.",
    pontos: [
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
    texto:
      "O processo costuma ter etapas (triagem, técnico, comportamental). No técnico, importa explicar o raciocínio em voz alta, não só acertar. No comportamental, tenha exemplos reais (situação, ação, resultado). Não saber algo é normal; mostre como você buscaria a resposta.",
    pontos: [
      "Revise lógica e o básico da stack da vaga.",
      "Pratique resolver problema explicando o raciocínio em voz alta.",
      "Tenha exemplos reais pra perguntas comportamentais (situação, ação, resultado).",
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
    texto:
      "O GitHub é a prova prática do que você sabe. Projetos que resolvem algo real superam clones de tutorial, e um README claro (o que é, como rodar, print ou deploy) muda como o recrutador te vê. 2 a 3 bem-feitos superam 10 pela metade; faça deploy de pelo menos um.",
    pontos: [
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
    texto:
      "Constância e prática batem maratona e teoria solta. Aprenda fazendo, cada conceito vira um mini-projeto; siga uma trilha por vez; reconstrua do zero pra fixar; documente o que aprende.",
    pontos: [
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
    texto:
      "O que destrava a carreira tanto quanto o código. Saber comunicar, fazer boas perguntas (com contexto e o que já tentou), receber feedback sem levar pro pessoal e ler inglês técnico abrem mais portas que mais um framework.",
    pontos: [
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
    texto:
      "Pra sair do júnior, foque em fundamentos (não só na ferramenta da moda), construa networking real em comunidades e eventos, e peça feedback pra mostrar evolução. Ajudar outras pessoas acelera seu próprio aprendizado.",
    pontos: [
      "Foque em fundamentos, não só na ferramenta da moda.",
      "Networking: comunidades e eventos abrem portas reais.",
      "Peça feedback e mostre evolução pra crescer de júnior pra pleno.",
      "Ajudar outras pessoas também acelera seu aprendizado.",
    ],
    artigos: [
      {
        title:
          "DIO: Próximo passo na carreira, como evoluir de júnior para sênior",
        url: "https://www.dio.me/articles/proximo-passo-na-carreira-de-desenvolvedor-de-software-como-evoluir-de-junior-para-senior-e-conquistar-melhores-oportunidades",
      },
      {
        title: "Alura: Carreira de desenvolvedor júnior, o mercado em 2026",
        url: "https://www.alura.com.br/artigos/desenvolvedor-junior",
      },
    ],
  },
];

export const bibliotecaFilmes: Filme[] = [
  {
    titulo: "O Jogo da Imitação",
    ano: "2014",
    porque: "Alan Turing e as origens da computação.",
  },
  {
    titulo: "A Rede Social",
    ano: "2010",
    porque:
      "Empreendedorismo e o lado complexo de criar uma grande empresa de tech.",
  },
  {
    titulo: "Piratas do Vale do Silício",
    ano: "1999",
    porque: "Origens de Apple e Microsoft.",
  },
  {
    titulo: "Steve Jobs",
    ano: "2015",
    porque: "Visão e criatividade.",
  },
  {
    titulo: "Ex Machina",
    ano: "2015",
    porque: "IA e ética.",
  },
  {
    titulo: "Ela",
    ano: "2013",
    porque: "IA e relações humanas.",
  },
  {
    titulo: "O Dilema das Redes",
    ano: "2020",
    porque: "Documentário sobre algoritmos e impacto social.",
  },
  {
    titulo: "Revolution OS",
    ano: "2001",
    porque:
      "Documentário sobre software livre e Linux (grátis no YouTube).",
  },
  {
    titulo: "Estrelas Além do Tempo",
    ano: "2016",
    porque: "Mulheres na computação da NASA.",
  },
  {
    titulo: "Snowden",
    ano: "2016",
    porque: "Vigilância e privacidade.",
  },
  {
    titulo: "Os Estagiários",
    ano: "2013",
    porque: "Começar do zero, leve.",
  },
  {
    titulo: "Jogos de Guerra",
    ano: "1983",
    porque:
      "Um jovem invade um sistema militar, clássico sobre hacking e ética.",
  },
  {
    titulo: "AlphaGo",
    ano: "2017",
    porque: "A IA da DeepMind enfrenta o campeão mundial de Go.",
  },
  {
    titulo: "Codificando Preconceitos (Coded Bias)",
    ano: "2020",
    porque:
      "Viés em reconhecimento facial, pesquisa de Joy Buolamwini no MIT.",
  },
  {
    titulo: "O Menino da Internet (The Internet's Own Boy)",
    ano: "2014",
    porque: "A vida de Aaron Swartz e o acesso livre ao conhecimento.",
  },
  {
    titulo: "Lo and Behold",
    ano: "2016",
    porque: "Werner Herzog sobre o passado e futuro da internet.",
  },
];

export const bibliotecaSeries: Filme[] = [
  {
    titulo: "Mr. Robot",
    ano: "2015",
    porque: "Hacker e segurança, retrato cru da cultura cyber.",
  },
  {
    titulo: "Silicon Valley",
    ano: "2014",
    porque: "Comédia sobre uma startup tentando crescer no Vale.",
  },
  {
    titulo: "Halt and Catch Fire",
    ano: "2014",
    porque: "O boom do PC e da internet nos anos 80 e 90.",
  },
  {
    titulo: "Black Mirror",
    ano: "2011",
    porque: "Antologia sobre os efeitos da tecnologia na sociedade.",
  },
];

export const bibliotecaLivros: Livro[] = [
  {
    titulo: "Eloquent JavaScript",
    autor: "Marijn Haverbeke",
    url: "https://eloquentjavascript.net",
  },
  {
    titulo: "You Don't Know JS",
    autor: "Kyle Simpson",
    url: "https://github.com/getify/You-Dont-Know-JS",
  },
  {
    titulo: "Entendendo Algoritmos",
    autor: "Aditya Bhargava",
  },
  {
    titulo: "Código Limpo (Clean Code)",
    autor: "Robert C. Martin",
  },
  {
    titulo: "O Programador Pragmático",
    autor: "Hunt e Thomas",
  },
  {
    titulo: "Pro Git (em português)",
    autor: "Scott Chacon e Ben Straub",
    url: "https://git-scm.com/book/pt-br/v2",
  },
];

export const bibliotecaVideos: DicaArtigo[] = [
  {
    title: "Curso em Vídeo (Gustavo Guanabara)",
    url: "https://www.youtube.com/channel/UCrWvhVmt0Qac3HgsjQK62FQ",
    desc: "Cursos gratuitos de lógica, HTML, CSS, Python e Git.",
  },
  {
    title: "Rocketseat",
    url: "https://www.youtube.com/channel/UCSfwM5u0Kce6Cce8_S72olg",
    desc: "Front, back e carreira para iniciantes.",
  },
  {
    title: "Filipe Deschamps",
    url: "https://www.youtube.com/@FilipeDeschamps",
    desc: "Conceitos de programação e código limpo de forma didática.",
  },
  {
    title: "Código Fonte TV",
    url: "https://www.youtube.com/@codigofontetv",
    desc: "Novidades e fundamentos de tecnologia.",
  },
  {
    title: "Attekita Dev",
    url: "https://www.youtube.com/@attekitadev",
    desc: "Conteúdo acessível para quem está começando.",
  },
  {
    title: "Akitando (Fabio Akita)",
    url: "https://www.youtube.com/@Akitando",
    desc: "Panoramas profundos sobre carreira e tecnologia.",
  },
  {
    title: "Programação Dinâmica",
    url: "https://www.youtube.com/channel/UC70mr11REaCqgKke7DPJoLg",
    desc: "Ciência da computação e dados de forma visual.",
  },
  {
    title: "freeCodeCamp",
    url: "https://www.youtube.com/@freecodecamp",
    desc: "Conteúdo em inglês, legendável.",
  },
  {
    title: "Fireship",
    url: "https://www.youtube.com/@Fireship",
    desc: "Vídeos rápidos em inglês, legendável.",
  },
  {
    title: "CS50 (Harvard)",
    url: "https://www.youtube.com/@cs50",
    desc: "Ciência da computação de Harvard, em inglês.",
  },
];

export const bibliotecaPodcasts: DicaArtigo[] = [
  {
    title: "Hipsters Ponto Tech",
    url: "https://www.hipsters.tech/",
    desc: "Papos sobre desenvolvimento, carreira e tendências.",
  },
  {
    title: "Dev Sem Fronteiras",
    url: "https://www.devsemfronteiras.tech/",
    desc: "Brasileiros que foram trabalhar com tech fora do país.",
  },
];

export const bibliotecaReferencia: DicaArtigo[] = [
  {
    title: "The Odin Project",
    url: "https://www.theodinproject.com",
    desc: "Currículo gratuito e open source de desenvolvimento web.",
  },
  {
    title: "roadmap.sh",
    url: "https://roadmap.sh",
    desc: "Trilhas visuais de aprendizado por área.",
  },
  {
    title: "MDN Web Docs (PT)",
    url: "https://developer.mozilla.org/pt-BR/",
    desc: "Documentação de HTML, CSS, JavaScript e Web APIs.",
  },
];
