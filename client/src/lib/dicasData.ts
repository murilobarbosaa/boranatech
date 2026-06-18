export interface DicaArtigo {
  title: string;
  url: string;
  desc?: string;
  carreira?: boolean;
}

export interface Dica {
  categoria: string;
  texto: string;
}

export interface Curiosidade {
  categoria: string;
  texto: string;
}

export interface Filme {
  titulo: string;
  ano: string;
  porque: string;
  tmdbType?: "movie" | "tv";
  tmdbId?: number;
  posterPath?: string;
}

export interface Livro {
  titulo: string;
  autor: string;
  url?: string;
  isbn?: string;
}

export const carreiraArtigos: DicaArtigo[] = [
  {
    title: "DIO: Como consegui meu estágio em TI",
    url: "https://www.dio.me/articles/como-consegui-meu-estagio-em-ti-e-como-voce-pode-conquistar-o-seu-tambem-ba2d1efe0e77",
    desc: "Relato real de quem conquistou o primeiro estágio.",
  },
  {
    title:
      "dev.to: 8 dicas para conseguir o seu primeiro estágio como desenvolvedor(a)",
    url: "https://dev.to/dellamora/8-dicas-para-conseguir-o-seu-primeiro-estagio-como-desenvolvedor-a-4345",
    desc: "Passos práticos para o primeiro estágio.",
  },
  {
    title:
      "DevMedia: Como criar um currículo de programador mesmo sem experiência",
    url: "https://www.devmedia.com.br/como-criar-um-curriculo-de-programador-mesmo-sem-experiencia/44190",
    desc: "Currículo sem experiência prévia.",
  },
  {
    title:
      "DIO: Como construir um portfólio profissional no GitHub mesmo sendo iniciante",
    url: "https://www.dio.me/articles/como-construir-um-portfolio-profissional-no-github-mesmo-sendo-iniciante-fb2b377ae094",
    desc: "Portfólio no GitHub para iniciantes.",
  },
  {
    title: "dev.to: Dicas para usar o GitHub como portfólio",
    url: "https://dev.to/github/dicas-para-usar-o-github-como-portfolio-2ab8",
    desc: "Organize seu GitHub como vitrine.",
  },
  {
    title: "Alura: Como começar a programar do zero, guia completo",
    url: "https://www.alura.com.br/artigos/como-comecar-programar",
    desc: "Guia completo para quem começa.",
  },
  {
    title: "Alura: Soft skills para desenvolvedores, o guia completo",
    url: "https://www.alura.com.br/artigos/soft-skills-para-devs",
    desc: "As soft skills que mais importam na área.",
  },
  {
    title: "DIO: A importância das soft skills no mundo da programação",
    url: "https://www.dio.me/articles/a-importancia-das-soft-skills-no-mundo-da-programacao",
    desc: "Por que soft skills destravam a carreira.",
  },
  {
    title:
      "DIO: Próximo passo na carreira, como evoluir de júnior para sênior",
    url: "https://www.dio.me/articles/proximo-passo-na-carreira-de-desenvolvedor-de-software-como-evoluir-de-junior-para-senior-e-conquistar-melhores-oportunidades",
    desc: "Como crescer de júnior para sênior.",
  },
  {
    title: "Alura: Carreira de desenvolvedor júnior, o mercado em 2026",
    url: "https://www.alura.com.br/artigos/desenvolvedor-junior",
    desc: "Panorama do mercado júnior.",
  },
];

export const dicasCategorias = [
  "Como estudar",
  "Primeiro emprego",
  "Código no dia a dia",
  "Mentalidade e comunidade",
] as const;

export const dicas: Dica[] = [
  {
    categoria: "Como estudar",
    texto:
      "Constância ganha de maratona: 30 minutos todo dia rendem mais que um fim de semana inteiro de vez em quando.",
  },
  {
    categoria: "Como estudar",
    texto:
      "Aprenda fazendo: a cada conceito novo, escreva código. Tutorial assistido sem praticar evapora.",
  },
  {
    categoria: "Como estudar",
    texto:
      "Saia do tutorial hell: refaça o projeto do zero sem olhar o vídeo. É ali que você vê o que aprendeu mesmo.",
  },
  {
    categoria: "Como estudar",
    texto:
      "Leia a mensagem de erro inteira e com calma. A maioria dos bugs de iniciante está escrita ali.",
  },
  {
    categoria: "Como estudar",
    texto:
      "Aprenda a pesquisar: jogue o erro entre aspas no Google e leia a primeira resposta do Stack Overflow até o fim.",
  },
  {
    categoria: "Como estudar",
    texto:
      "Entenda a lógica, não decore a sintaxe. Sintaxe você consulta, lógica você carrega.",
  },
  {
    categoria: "Como estudar",
    texto:
      "Pato de borracha: explique seu código em voz alta pra um objeto. Metade dos bugs aparece sozinha.",
  },
  {
    categoria: "Como estudar",
    texto:
      "Domine o básico antes do framework. HTML, CSS e JS sólidos valem mais que React mal entendido.",
  },
  {
    categoria: "Como estudar",
    texto:
      "Aprenda Git cedo, mesmo estudando sozinha. Versionar projeto é hábito profissional desde o primeiro dia.",
  },
  {
    categoria: "Como estudar",
    texto:
      "Use Pomodoro: 25 minutos de foco, 5 de pausa. Evita travar horas no mesmo problema.",
  },
  {
    categoria: "Como estudar",
    texto:
      "Inglês destrava a área. Mesmo básico, treine ler documentação em inglês desde o começo.",
  },
  {
    categoria: "Primeiro emprego",
    texto:
      "Aplique mesmo sem cumprir 100% dos requisitos. A descrição da vaga é lista de desejos, não eliminatória.",
  },
  {
    categoria: "Primeiro emprego",
    texto:
      "No começo é jogo de números: candidate-se em volume e não leve a rejeição pro pessoal.",
  },
  {
    categoria: "Primeiro emprego",
    texto:
      "Personalize o currículo pra cada vaga, citando as tecnologias do anúncio. Recrutador e sistema buscam por palavra.",
  },
  {
    categoria: "Primeiro emprego",
    texto:
      "Tenha 2 ou 3 projetos no GitHub que você sabe explicar linha por linha. Vale mais que 20 repos de tutorial.",
  },
  {
    categoria: "Primeiro emprego",
    texto:
      "No LinkedIn, escreva o que você faz e o que busca, não só “estudante”. É assim que recrutador te acha.",
  },
  {
    categoria: "Primeiro emprego",
    texto:
      "Indicação consegue mais vaga que portal. Avise sua rede que você está procurando.",
  },
  {
    categoria: "Código no dia a dia",
    texto:
      "Commit pequeno e frequente, com mensagem clara. Seu eu do futuro agradece.",
  },
  {
    categoria: "Código no dia a dia",
    texto:
      "Código legível ganha de código esperto. Você lê muito mais código do que escreve.",
  },
  {
    categoria: "Código no dia a dia",
    texto:
      "Aprenda a usar o debugger, não só o console.log. Economiza horas.",
  },
  {
    categoria: "Código no dia a dia",
    texto:
      "Leia código dos outros em projetos open source. Aprende-se a escrever lendo, como em qualquer língua.",
  },
  {
    categoria: "Código no dia a dia",
    texto:
      "Travou por mais de 30 minutos? Peça ajuda ou pause. Insistir cansada raramente resolve.",
  },
  {
    categoria: "Mentalidade e comunidade",
    texto:
      "Síndrome do impostor é quase universal na área. Sentir que não sabe o bastante não significa que você não saiba.",
  },
  {
    categoria: "Mentalidade e comunidade",
    texto:
      "Não compare seu capítulo 1 com o capítulo 20 de outra pessoa. Compare com você de um mês atrás.",
  },
  {
    categoria: "Mentalidade e comunidade",
    texto:
      "Aprenda em público: poste o que estudou. Ensina, fixa o aprendizado e vira portfólio sem querer.",
  },
  {
    categoria: "Mentalidade e comunidade",
    texto:
      "Entre numa comunidade (Discord, grupo, evento). Estudar acompanhada segura mais que sozinha.",
  },
  {
    categoria: "Mentalidade e comunidade",
    texto:
      "Faça boas perguntas: diga o contexto, o que já tentou e o erro exato. Pergunta boa atrai ajuda boa.",
  },
  {
    categoria: "Mentalidade e comunidade",
    texto:
      "Descanso faz parte do aprendizado. O cérebro consolida no intervalo, não só no esforço.",
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
  {
    titulo: "Jobs",
    ano: "2013",
    porque: "Cinebiografia dos primeiros anos de Steve Jobs e da Apple.",
  },
  {
    titulo: "O Quinto Poder",
    ano: "2013",
    porque: "A criação do WikiLeaks e o vazamento de documentos secretos.",
  },
  {
    titulo: "Matrix",
    ano: "1999",
    porque:
      "Simulação, realidade e escolha em um marco da ficção científica.",
  },
  {
    titulo: "Tron",
    ano: "1982",
    porque: "Um programador é puxado para dentro de um mundo digital.",
  },
  {
    titulo: "Tron: O Legado",
    ano: "2010",
    porque: "Continuação visual do universo digital de Tron.",
  },
  {
    titulo: "Blade Runner",
    ano: "1982",
    porque: "Replicantes e o que significa ser humano.",
  },
  {
    titulo: "Blade Runner 2049",
    ano: "2017",
    porque: "Continuação que aprofunda IA, memória e identidade.",
  },
  {
    titulo: "Hackers",
    ano: "1995",
    porque: "Jovens hackers dos anos 90 enfrentam uma conspiração.",
  },
  {
    titulo: "A Rede",
    ano: "1995",
    porque: "Uma analista de sistemas tem a identidade apagada online.",
  },
  {
    titulo: "Jogador Nº 1 (Ready Player One)",
    ano: "2018",
    porque: "Caça ao tesouro dentro de um mundo de realidade virtual.",
  },
  {
    titulo: "Free Guy",
    ano: "2021",
    porque: "Um personagem de videogame descobre que vive em um jogo.",
  },
  {
    titulo: "Antitrust",
    ano: "2001",
    porque: "Thriller sobre uma gigante de software e código roubado.",
  },
  {
    titulo: "O Círculo",
    ano: "2017",
    porque: "Privacidade e vigilância dentro de uma big tech.",
  },
  {
    titulo: "Eu, Robô",
    ano: "2004",
    porque: "IA, robôs e as leis da robótica de Asimov.",
  },
  {
    titulo: "General Magic",
    ano: "2018",
    porque: "Documentário sobre a startup dos anos 90 que previu o smartphone.",
  },
  {
    titulo: "Privacidade Hackeada (The Great Hack)",
    ano: "2019",
    porque:
      "Documentário sobre o escândalo da Cambridge Analytica e os dados pessoais.",
  },
  {
    titulo: "Citizenfour",
    ano: "2014",
    porque: "Documentário sobre o encontro com Snowden e os documentos da NSA.",
  },
  {
    titulo: "Print the Legend",
    ano: "2014",
    porque: "Documentário sobre a corrida da impressão 3D e suas startups.",
  },
  {
    titulo: "Indie Game: The Movie",
    ano: "2012",
    porque:
      "Documentário sobre os bastidores de desenvolvedores independentes de jogos.",
  },
  {
    titulo: "Steve Jobs: O Homem na Máquina",
    ano: "2015",
    porque: "Documentário com um retrato crítico do legado de Steve Jobs.",
  },
  {
    titulo: "TPB AFK: The Pirate Bay",
    ano: "2013",
    porque: "Documentário sobre os fundadores do Pirate Bay e a pirataria.",
  },
  {
    titulo: "We Are Legion",
    ano: "2012",
    porque: "Documentário sobre o coletivo hacktivista Anonymous.",
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
  {
    titulo: "Devs",
    ano: "2020",
    porque: "Thriller sobre uma empresa de tech e computação quântica.",
  },
  {
    titulo: "Pessoa de Interesse",
    ano: "2011",
    porque: "Uma IA prevê crimes a partir da vigilância em massa.",
  },
  {
    titulo: "The IT Crowd",
    ano: "2006",
    porque: "Comédia sobre um time de suporte de TI.",
  },
  {
    titulo: "Mythic Quest",
    ano: "2020",
    porque: "Comédia nos bastidores de um estúdio de games.",
  },
  {
    titulo: "StartUp",
    ano: "2016",
    porque: "Drama sobre o nascimento de uma startup de criptomoeda.",
  },
  {
    titulo: "Westworld",
    ano: "2016",
    porque: "Androides, consciência e ética em um parque temático.",
  },
  {
    titulo: "Valley of the Boom",
    ano: "2019",
    porque: "Docudrama sobre a bolha das pontocom dos anos 90.",
  },
  {
    titulo: "The Billion Dollar Code",
    ano: "2021",
    porque: "Disputa real sobre a origem de um mapa digital.",
  },
  {
    titulo: "Maniac",
    ano: "2018",
    porque: "Um experimento farmacêutico e os limites da mente humana.",
  },
  {
    titulo: "Years and Years",
    ano: "2019",
    porque: "Uma família e o futuro próximo moldado pela tecnologia.",
  },
];

export const bibliotecaLivros: Livro[] = [
  {
    titulo: "Eloquent JavaScript",
    autor: "Marijn Haverbeke",
    url: "https://eloquentjavascript.net",
    isbn: "9781593279509",
  },
  {
    titulo: "You Don't Know JS",
    autor: "Kyle Simpson",
    url: "https://github.com/getify/You-Dont-Know-JS",
  },
  {
    titulo: "Entendendo Algoritmos",
    autor: "Aditya Bhargava",
    isbn: "9781617292231",
  },
  {
    titulo: "Código Limpo (Clean Code)",
    autor: "Robert C. Martin",
    isbn: "9780132350884",
  },
  {
    titulo: "O Programador Pragmático",
    autor: "Hunt e Thomas",
    isbn: "9780135957059",
  },
  {
    titulo: "Pro Git (em português)",
    autor: "Scott Chacon e Ben Straub",
    url: "https://git-scm.com/book/pt-br/v2",
    isbn: "9781484200773",
  },
  {
    titulo: "Refatoração",
    autor: "Martin Fowler",
    isbn: "9780201485677",
  },
  {
    titulo: "Arquitetura Limpa",
    autor: "Robert C. Martin",
    isbn: "9780134494326",
  },
  {
    titulo: "A Startup Enxuta",
    autor: "Eric Ries",
    isbn: "9780307887894",
  },
  {
    titulo: "Cracking the Coding Interview",
    autor: "Gayle Laakmann McDowell",
    isbn: "9780984782802",
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
  {
    title: "Fabiano Goes (eprogramar)",
    url: "https://www.youtube.com/@eprogramar",
    desc: "Carreira, mercado de tecnologia e produtividade para devs.",
    carreira: true,
  },
  {
    title: "Augusto Galego (Guto Galego)",
    url: "https://www.youtube.com/@GutoGalego",
    desc: "Algoritmos, LeetCode e carreira internacional em tech.",
    carreira: true,
  },
  {
    title: "Lucas Montano",
    url: "https://www.youtube.com/@LucasMontano",
    desc: "Tecnologia, carreira e bastidores da vida de dev.",
  },
  {
    title: "Mayk Brito",
    url: "https://www.youtube.com/@maykbrito",
    desc: "Lógica, JavaScript e fundamentos para iniciantes.",
  },
  {
    title: "DevSuperior (Nélio Alves)",
    url: "https://www.youtube.com/@DevSuperior",
    desc: "Java, Spring e preparação para a primeira vaga.",
    carreira: true,
  },
  {
    title: "Cod3r Cursos",
    url: "https://www.youtube.com/@Cod3r",
    desc: "Desenvolvimento web moderno, JavaScript e Flutter.",
  },
  {
    title: "Hora de Codar",
    url: "https://www.youtube.com/@horadecodar",
    desc: "Desenvolvimento web com JavaScript, PHP e React.",
  },
  {
    title: "Sujeito Programador",
    url: "https://www.youtube.com/@SujeitoProgramador",
    desc: "Lógica, PHP e desenvolvimento web do zero.",
  },
  {
    title: "Bóson Treinamentos",
    url: "https://www.youtube.com/@bosontreinamentos",
    desc: "Redes, Linux, banco de dados e programação.",
  },
  {
    title: "Programador BR",
    url: "https://www.youtube.com/@ProgramadorBR",
    desc: "Programação, carreira e empreendedorismo em tech.",
    carreira: true,
  },
  {
    title: "Traversy Media",
    url: "https://www.youtube.com/@TraversyMedia",
    desc: "Tutoriais de desenvolvimento web, em inglês.",
  },
  {
    title: "The Net Ninja",
    url: "https://www.youtube.com/@NetNinja",
    desc: "Séries de tutoriais web em inglês, do básico ao avançado.",
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
  {
    title: "Pizza de Dados",
    url: "https://pizzadedados.com/",
    desc: "Ciência de dados e machine learning com convidados da área.",
  },
  {
    title: "Cabeça de Lab",
    url: "https://www.cabecadelab.com.br/",
    desc: "Podcast de tecnologia do LuizaLabs (Magalu), com carreira e inovação.",
  },
  {
    title: "Like a Boss",
    url: "https://www.likeaboss.com.br/",
    desc: "Conversas com líderes e fundadores sobre carreira e empreendedorismo.",
  },
  {
    title: "Vida de Programador",
    url: "https://open.spotify.com/show/3xWjAw6QebhWfOcgyxTEnX",
    desc: "Histórias e bastidores do dia a dia de quem programa, com André Noel.",
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

export const curiosidadesCategorias = [
  "Jogos",
  "História e pessoas",
  "Linguagens",
  "Internet e web",
  "Hardware e cultura",
] as const;

export const curiosidades: Curiosidade[] = [
  {
    categoria: "Jogos",
    texto:
      "Minecraft (versão Java) foi feito em Java pelo sueco Markus “Notch” Persson.",
  },
  {
    categoria: "Jogos",
    texto:
      "RollerCoaster Tycoon foi escrito quase todo em Assembly x86 por uma única pessoa, Chris Sawyer (só cerca de 1% em C).",
  },
  {
    categoria: "Jogos",
    texto: "Doom (1993) foi escrito em C; o Doom 3 já usou C++.",
  },
  {
    categoria: "Jogos",
    texto:
      "A maioria dos jogos AAA é feita em C++, com motores como a Unreal Engine.",
  },
  {
    categoria: "Jogos",
    texto: "Cuphead foi desenvolvido em C# usando a Unity.",
  },
  {
    categoria: "Jogos",
    texto: "EVE Online roda em Python (a variante Stackless Python).",
  },
  {
    categoria: "Jogos",
    texto:
      "Pac-Man trava num “kill screen” na fase 256 por um estouro de 8 bits.",
  },
  {
    categoria: "Jogos",
    texto:
      "O Mario apareceu primeiro como “Jumpman” no jogo Donkey Kong, em 1981.",
  },
  {
    categoria: "Jogos",
    texto:
      "Tetris foi criado por Alexey Pajitnov, na União Soviética, em 1984.",
  },
  {
    categoria: "Jogos",
    texto:
      "Pong (1972), da Atari, foi um dos primeiros jogos de sucesso comercial.",
  },
  {
    categoria: "Jogos",
    texto:
      "O primeiro easter egg famoso de videogame está no Adventure do Atari 2600, com o nome escondido do programador.",
  },
  {
    categoria: "Jogos",
    texto:
      "O “Konami Code” é um cheat clássico que aparece em vários jogos.",
  },
  {
    categoria: "História e pessoas",
    texto:
      "Ada Lovelace é considerada a primeira pessoa programadora, em 1843, antes de existir computador moderno.",
  },
  {
    categoria: "História e pessoas",
    texto:
      "O termo “bug” ficou famoso com uma mariposa presa num computador em 1947 (equipe de Grace Hopper); a palavra já existia antes, o episódio popularizou.",
  },
  {
    categoria: "História e pessoas",
    texto:
      "Grace Hopper ajudou a criar o COBOL e a ideia de linguagem legível por humanos.",
  },
  {
    categoria: "História e pessoas",
    texto:
      "Margaret Hamilton liderou o software de voo da Apollo 11 e ajudou a popularizar o termo “engenharia de software”.",
  },
  {
    categoria: "História e pessoas",
    texto:
      "Katherine Johnson fez cálculos de trajetória pra NASA (a história de Estrelas Além do Tempo).",
  },
  {
    categoria: "História e pessoas",
    texto:
      "Hedy Lamarr, atriz, coinventou uma técnica de salto de frequência que influenciou tecnologias sem fio.",
  },
  {
    categoria: "História e pessoas",
    texto: "O ENIAC (1945) era enorme e pesava dezenas de toneladas.",
  },
  {
    categoria: "História e pessoas",
    texto:
      "O primeiro disco rígido comercial da IBM (1956) guardava poucos megabytes e era gigante.",
  },
  {
    categoria: "História e pessoas",
    texto:
      "Alan Turing propôs a “máquina de Turing” em 1936, base da computação teórica.",
  },
  {
    categoria: "Linguagens",
    texto:
      "Python tem esse nome por causa do grupo de humor Monty Python, não da cobra.",
  },
  {
    categoria: "Linguagens",
    texto: "Java quase se chamou “Oak”.",
  },
  {
    categoria: "Linguagens",
    texto:
      "JavaScript foi criado em cerca de 10 dias por Brendan Eich, em 1995.",
  },
  {
    categoria: "Linguagens",
    texto:
      "JavaScript não tem relação técnica com Java; o nome foi marketing da época.",
  },
  {
    categoria: "Linguagens",
    texto:
      "A linguagem C foi criada por Dennis Ritchie nos anos 70 e é base de muita coisa até hoje.",
  },
  {
    categoria: "Linguagens",
    texto:
      "Ruby foi criada por Yukihiro Matsumoto (Matz), pensando na felicidade de quem programa.",
  },
  {
    categoria: "Linguagens",
    texto: "COBOL, dos anos 50 e 60, ainda roda em muitos sistemas de banco.",
  },
  {
    categoria: "Linguagens",
    texto:
      "O clássico “Hello, World!” virou tradição por causa do livro de C de Kernighan e Ritchie.",
  },
  {
    categoria: "Linguagens",
    texto:
      "A “guerra de editores” entre fãs de Vim e Emacs é uma piada antiga entre devs.",
  },
  {
    categoria: "Internet e web",
    texto: "O primeiro site da web ainda está no ar: info.cern.ch.",
  },
  {
    categoria: "Internet e web",
    texto:
      "A web foi inventada por Tim Berners-Lee no CERN, por volta de 1989 a 1991.",
  },
  {
    categoria: "Internet e web",
    texto:
      "O símbolo @ nos emails foi escolha de Ray Tomlinson, nos anos 70.",
  },
  {
    categoria: "Internet e web",
    texto: "O primeiro nome de domínio registrado foi symbolics.com, em 1985.",
  },
  {
    categoria: "Internet e web",
    texto:
      "O Git foi criado por Linus Torvalds em 2005 pra versionar o kernel do Linux.",
  },
  {
    categoria: "Internet e web",
    texto:
      "O Linux começou em 1991 como projeto de estudante do Linus Torvalds.",
  },
  {
    categoria: "Internet e web",
    texto: "O primeiro vídeo do YouTube, “Me at the zoo”, é de 2005.",
  },
  {
    categoria: "Internet e web",
    texto: "O primeiro tweet foi de Jack Dorsey, em 2006.",
  },
  {
    categoria: "Internet e web",
    texto:
      "A palavra “spam” pra mensagem indesejada vem de um quadro do Monty Python.",
  },
  {
    categoria: "Hardware e cultura",
    texto:
      "A Lei de Moore, de Gordon Moore, descreve que o número de transistores num chip dobra a cada cerca de dois anos.",
  },
  {
    categoria: "Hardware e cultura",
    texto:
      "O mouse foi demonstrado por Douglas Engelbart em 1968, na “Mãe de Todas as Demos”.",
  },
  {
    categoria: "Hardware e cultura",
    texto:
      "O primeiro conjunto de emoji moderno foi criado por Shigetaka Kurita no Japão, em 1999.",
  },
  {
    categoria: "Hardware e cultura",
    texto:
      "“Foo” e “bar” são nomes genéricos clássicos em exemplos de código.",
  },
  {
    categoria: "Hardware e cultura",
    texto: "O Stack Overflow, onde devs tiram dúvidas, nasceu em 2008.",
  },
  {
    categoria: "Hardware e cultura",
    texto:
      "O ícone de “salvar” é um disquete, objeto que muita gente nova nunca usou.",
  },
];
