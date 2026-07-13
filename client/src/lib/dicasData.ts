export interface DicaArtigo {
  title: string;
  url: string;
  desc?: string;
  carreira?: boolean;
}

export interface CarreiraTema {
  id: string;
  titulo: string;
  texto: string;
  pontos: string[];
  artigos: DicaArtigo[];
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

export const carreiraTemas: CarreiraTema[] = [
  {
    id: "estagio",
    titulo: "Estágio",
    texto:
      "Empresas de estágio não esperam que você saiba tudo, esperam evidência de que você aprende sozinha e já colocou a mão na massa. Por isso 2 a 3 projetos no GitHub que você saiba explicar de ponta a ponta valem mais que cursos não terminados. Trate cada processo como treino: a maioria recebe vários nãos antes do sim, e candidatar-se mesmo sem cumprir todos os requisitos faz parte (eles são lista de desejos, não eliminatórios).",
    pontos: [
      "2 a 3 projetos que você explica de ponta a ponta valem mais que cursos não terminados.",
      "Candidate-se mesmo sem cumprir todos os requisitos: são lista de desejos, não eliminatórios.",
      "Trate cada processo como treino; os nãos vêm antes do sim.",
    ],
    artigos: [
      {
        title: "DIO: Como consegui meu estágio em TI",
        url: "https://www.dio.me/articles/como-consegui-meu-estagio-em-ti-e-como-voce-pode-conquistar-o-seu-tambem-ba2d1efe0e77",
        desc: "Relato real de quem conquistou o primeiro estágio.",
      },
      {
        title: "dev.to: 8 dicas para o seu primeiro estágio como dev",
        url: "https://dev.to/dellamora/8-dicas-para-conseguir-o-seu-primeiro-estagio-como-desenvolvedor-a-4345",
        desc: "Passos práticos para o primeiro estágio.",
      },
    ],
  },
  {
    id: "curriculo",
    titulo: "Currículo e LinkedIn",
    texto:
      "Currículo de dev é curto e mostra o que você fez, não tarefas genéricas. Muitos passam por um filtro automático (ATS) antes de um humano ler, então adapte a cada vaga usando os termos da própria descrição. Resultados concretos e links de projetos valem mais que adjetivos.",
    pontos: [
      "Curto e focado no que você fez, com resultados concretos.",
      "Adapte a cada vaga com os termos da descrição (passa por filtro ATS).",
      "Links de projetos valem mais que adjetivos.",
    ],
    artigos: [
      {
        title: "DevMedia: Currículo de programador mesmo sem experiência",
        url: "https://www.devmedia.com.br/como-criar-um-curriculo-de-programador-mesmo-sem-experiencia/44190",
        desc: "Como montar o currículo sem experiência prévia.",
      },
    ],
  },
  {
    id: "entrevistas",
    titulo: "Entrevistas",
    texto:
      "O processo costuma ter etapas: triagem, técnico e comportamental. No técnico, importa explicar o raciocínio em voz alta, não só chegar na resposta certa. No comportamental, tenha exemplos reais no formato situação, ação e resultado. Não saber algo é normal; o que conta é mostrar como você buscaria a resposta.",
    pontos: [
      "No técnico, explique o raciocínio em voz alta, não só acerte.",
      "No comportamental, use exemplos reais: situação, ação, resultado.",
      "Não saber algo é normal; mostre como você buscaria a resposta.",
    ],
    artigos: [
      {
        title: "DIO: 8 dicas para se preparar para uma entrevista de emprego",
        url: "https://www.dio.me/articles/8-dicas-para-se-preparar-para-uma-entrevista-de-emprego",
        desc: "Preparação da entrevista, do técnico ao comportamental.",
      },
      {
        title: "freeCodeCamp: Como passar na entrevista de programação",
        url: "https://www.freecodecamp.org/portuguese/news/como-passar-na-entrevista-de-programacao-dicas-que-me-ajudaram-a-obter-ofertas-de-emprego-no-google-airbnb-e-na-dropbox/",
        desc: "Estratégias para a entrevista técnica de código.",
      },
    ],
  },
  {
    id: "portfolio",
    titulo: "Portfólio e GitHub",
    texto:
      "O GitHub é a prova prática do que você sabe. Projetos que resolvem algo real superam clones de tutorial, e um README claro (o que é, como rodar, print ou deploy) muda como o recrutador te vê. Dois ou três projetos bem-feitos superam dez pela metade, e vale fazer deploy de pelo menos um.",
    pontos: [
      "Projetos que resolvem algo real superam clones de tutorial.",
      "README claro: o que é, como rodar, print ou deploy.",
      "2 a 3 bem-feitos superam 10 pela metade; faça deploy de pelo menos um.",
    ],
    artigos: [
      {
        title: "DIO: Portfólio profissional no GitHub sendo iniciante",
        url: "https://www.dio.me/articles/como-construir-um-portfolio-profissional-no-github-mesmo-sendo-iniciante-fb2b377ae094",
        desc: "Monte um portfólio no GitHub do zero.",
      },
      {
        title: "dev.to: Dicas para usar o GitHub como portfólio",
        url: "https://dev.to/github/dicas-para-usar-o-github-como-portfolio-2ab8",
        desc: "Organize seu GitHub como vitrine.",
      },
    ],
  },
  {
    id: "estudar",
    titulo: "Como estudar",
    texto:
      "Constância e prática batem maratona e teoria solta. Aprenda fazendo: a cada conceito novo, transforme em um mini-projeto, siga uma trilha por vez, reconstrua do zero pra fixar e documente o que aprende. Progresso pequeno e diário rende mais que um fim de semana inteiro de vez em quando.",
    pontos: [
      "Constância e prática batem maratona e teoria solta.",
      "Cada conceito vira um mini-projeto; siga uma trilha por vez.",
      "Reconstrua do zero pra fixar e documente o que aprende.",
    ],
    artigos: [
      {
        title: "Alura: Como começar a programar, guia completo",
        url: "https://www.alura.com.br/artigos/como-comecar-programar",
        desc: "Guia para quem começa do zero.",
      },
      {
        title: "roadmap.sh: trilhas visuais por área",
        url: "https://roadmap.sh",
        desc: "Mapas de estudo por área, uma trilha por vez.",
      },
    ],
  },
  {
    id: "softskills",
    titulo: "Soft skills",
    texto:
      "As soft skills destravam a carreira tanto quanto o código. Saber comunicar, fazer boas perguntas (com contexto e o que você já tentou), receber feedback sem levar pro pessoal e ler inglês técnico abrem mais portas que aprender mais um framework.",
    pontos: [
      "Comunicar bem pesa tanto quanto o código.",
      "Boas perguntas trazem contexto e o que você já tentou.",
      "Receba feedback sem levar pro pessoal; leia inglês técnico.",
    ],
    artigos: [
      {
        title: "Alura: Soft skills para devs, o guia completo",
        url: "https://www.alura.com.br/artigos/soft-skills-para-devs",
        desc: "As soft skills que mais importam na área.",
      },
      {
        title: "DIO: A importância das soft skills na programação",
        url: "https://www.dio.me/articles/a-importancia-das-soft-skills-no-mundo-da-programacao",
        desc: "Por que soft skills destravam a carreira.",
      },
    ],
  },
  {
    id: "mercado",
    titulo: "Carreira e mercado",
    texto:
      "Pra sair do júnior, foque nos fundamentos e não só na ferramenta da moda, construa networking real em comunidades e eventos, e peça feedback pra mostrar evolução. Ajudar outras pessoas a resolver problemas acelera o seu próprio aprendizado.",
    pontos: [
      "Fundamentos primeiro, não só a ferramenta da moda.",
      "Networking real em comunidades e eventos abre portas.",
      "Peça feedback e ajude os outros; isso acelera você.",
    ],
    artigos: [
      {
        title: "DIO: Como evoluir de júnior para sênior",
        url: "https://www.dio.me/articles/proximo-passo-na-carreira-de-desenvolvedor-de-software-como-evoluir-de-junior-para-senior-e-conquistar-melhores-oportunidades",
        desc: "O caminho de júnior a sênior.",
      },
      {
        title: "Alura: Carreira de desenvolvedor júnior",
        url: "https://www.alura.com.br/artigos/desenvolvedor-junior",
        desc: "Panorama do mercado júnior.",
      },
    ],
  },
];

export const dicasCategorias = [
  "Como estudar",
  "Primeiro emprego",
  "Código no dia a dia",
  "Mentalidade e comunidade",
  "Currículo",
  "Entrevista",
  "Portfólio",
  "Networking",
  "LinkedIn",
  "Estudo",
  "Estágio",
  "Produtividade",
  "Soft skills",
  "Comunidades",
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
  {
    categoria: "Currículo",
    texto:
      "Comece cada item de experiência com um verbo de ação e termine com o resultado mensurável que aquilo gerou, como reduzir tempo de build ou aumentar conversão.",
  },
  {
    categoria: "Currículo",
    texto:
      "Adapte o resumo do topo para a vaga específica em vez de usar um texto genérico que serve para qualquer empresa.",
  },
  {
    categoria: "Currículo",
    texto:
      "Liste tecnologias que você realmente sabe explicar numa conversa, porque tudo o que estiver no documento pode virar pergunta na entrevista.",
  },
  {
    categoria: "Currículo",
    texto:
      "Mantenha em uma única página enquanto você tiver menos de cinco anos de experiência e corte projetos antigos que não dizem mais nada sobre você hoje.",
  },
  {
    categoria: "Currículo",
    texto:
      "Troque frases vagas como responsável por melhorias por números concretos, mesmo que sejam estimativas honestas baseadas no que você observou.",
  },
  {
    categoria: "Currículo",
    texto:
      "Salve sempre em PDF com nome de arquivo claro contendo seu nome e o cargo, evitando títulos como curriculo-final-versao3.",
  },
  {
    categoria: "Currículo",
    texto:
      "Evite barras de proficiência que dizem oitenta por cento de uma linguagem, pois ninguém sabe medir isso e o recrutador desconfia.",
  },
  {
    categoria: "Currículo",
    texto:
      "Inclua uma linha curta de contexto sobre cada empresa pouco conhecida, já que o leitor pode não saber o tamanho ou o setor dela.",
  },
  {
    categoria: "Entrevista",
    texto:
      "Pense em voz alta durante problemas técnicos, porque o entrevistador quer entender seu raciocínio e não apenas ver a resposta final pronta.",
  },
  {
    categoria: "Entrevista",
    texto:
      "Antes de codar, repita o enunciado com suas palavras e confirme as restrições para evitar resolver o problema errado com perfeição.",
  },
  {
    categoria: "Entrevista",
    texto:
      "Quando travar, descreva onde você está preso em vez de ficar em silêncio, pois muitos entrevistadores dão dicas se entenderem seu bloqueio.",
  },
  {
    categoria: "Entrevista",
    texto:
      "Prepare três histórias flexíveis de projetos seus que possam responder a várias perguntas comportamentais diferentes.",
  },
  {
    categoria: "Entrevista",
    texto:
      "Use a estrutura situação, tarefa, ação e resultado para respostas comportamentais sem parecer um roteiro decorado.",
  },
  {
    categoria: "Entrevista",
    texto:
      "Pesquise o produto da empresa e abra a aplicação antes da conversa, para citar algo concreto que você notou usando.",
  },
  {
    categoria: "Entrevista",
    texto:
      "Tenha perguntas suas no fim, focadas em como o time trabalha no dia a dia, e não só em benefícios.",
  },
  {
    categoria: "Entrevista",
    texto:
      "Se errar uma resposta e perceber depois, é legítimo retomar e corrigir, mostrando que você revisa o próprio trabalho.",
  },
  {
    categoria: "Entrevista",
    texto:
      "Teste seu microfone, câmera e conexão minutos antes de entrevistas remotas para não gastar os primeiros instantes resolvendo problema técnico.",
  },
  {
    categoria: "Portfólio",
    texto:
      "Mostre poucos projetos bem acabados em vez de muitos pela metade, pois profundidade conta mais que quantidade.",
  },
  {
    categoria: "Portfólio",
    texto:
      "Escreva um README que explique o problema resolvido, as decisões técnicas e como rodar o projeto em poucos comandos.",
  },
  {
    categoria: "Portfólio",
    texto:
      "Inclua pelo menos um projeto que resolva uma dor real sua ou de alguém próximo, porque isso rende histórias melhores na entrevista.",
  },
  {
    categoria: "Portfólio",
    texto:
      "Hospede uma versão funcionando online quando possível, já que um link clicável impressiona mais do que apenas código no repositório.",
  },
  {
    categoria: "Portfólio",
    texto:
      "Adicione capturas de tela ou um gif curto no topo do README para quem avalia entender o projeto sem precisar instalar nada.",
  },
  {
    categoria: "Portfólio",
    texto:
      "Documente o que você faria diferente hoje, mostrando senso crítico e capacidade de aprender com as próprias escolhas.",
  },
  {
    categoria: "Portfólio",
    texto:
      "Evite tutoriais copiados sem mudanças, porque eles aparecem em centenas de portfólios e não revelam nada sobre você.",
  },
  {
    categoria: "Networking",
    texto:
      "Ofereça ajuda antes de pedir algo, comentando o trabalho dos outros ou compartilhando recursos úteis sem esperar retorno imediato.",
  },
  {
    categoria: "Networking",
    texto:
      "Após eventos, mande uma mensagem curta lembrando do contexto da conversa em vez de só clicar em conectar sem texto.",
  },
  {
    categoria: "Networking",
    texto:
      "Mantenha uma lista das pessoas que te ajudaram e atualize-as quando você conseguir resultados, fechando o ciclo de gratidão.",
  },
  {
    categoria: "Networking",
    texto:
      "Converse com profissionais um pouco mais experientes que você, e não apenas com quem já está em cargos sênior distantes.",
  },
  {
    categoria: "Networking",
    texto:
      "Peça conversas rápidas de quinze minutos para entender uma área, deixando claro que você respeita o tempo da pessoa.",
  },
  {
    categoria: "Networking",
    texto:
      "Networking interno também conta, então almoce e converse com times vizinhos quando já estiver empregado.",
  },
  {
    categoria: "LinkedIn",
    texto:
      "Use o título do perfil para dizer o que você faz e busca, não apenas o cargo atual, já que é o que mais aparece nas buscas.",
  },
  {
    categoria: "LinkedIn",
    texto:
      "Escreva a seção sobre em primeira pessoa, contando sua trajetória de forma humana em vez de listar palavras-chave soltas.",
  },
  {
    categoria: "LinkedIn",
    texto:
      "Publique aprendizados de projetos seus de tempos em tempos, pois mostrar processo atrai mais oportunidades do que só repostar conteúdo alheio.",
  },
  {
    categoria: "LinkedIn",
    texto:
      "Peça recomendações a colegas logo após entregas bem-sucedidas, enquanto a memória do trabalho ainda está fresca.",
  },
  {
    categoria: "LinkedIn",
    texto:
      "Ative o aviso discreto de aberto a oportunidades para recrutadores quando estiver buscando, sem necessariamente exibir isso publicamente.",
  },
  {
    categoria: "LinkedIn",
    texto:
      "Use uma foto de perfil com seu rosto visível e iluminado, já que perfis com foto recebem muito mais respostas.",
  },
  {
    categoria: "LinkedIn",
    texto:
      "Comente com substância em posts da sua área, porque comentários reflexivos te tornam conhecido mais rápido do que só dar curtidas.",
  },
  {
    categoria: "Estudo",
    texto:
      "Aprenda construindo algo de verdade em vez de acumular cursos, pois o conhecimento fixa quando você precisa resolver um problema real.",
  },
  {
    categoria: "Estudo",
    texto:
      "Estude os fundamentos como estruturas de dados e redes, já que frameworks mudam mas a base sustenta toda a sua carreira.",
  },
  {
    categoria: "Estudo",
    texto:
      "Explique em voz alta ou por escrito o que acabou de aprender, porque ensinar revela rápido o que você ainda não entendeu.",
  },
  {
    categoria: "Estudo",
    texto:
      "Defina um projeto-meta e aprenda apenas o necessário para avançar nele, evitando se perder em conteúdo infinito sem aplicação.",
  },
  {
    categoria: "Estudo",
    texto:
      "Leia código de projetos open source maduros para ver como pessoas experientes organizam soluções de verdade.",
  },
  {
    categoria: "Estudo",
    texto:
      "Reserve blocos curtos e regulares em vez de maratonas raras, pois consistência diária vence intensidade esporádica no aprendizado técnico.",
  },
  {
    categoria: "Estudo",
    texto:
      "Aprofunde-se em uma stack até ter confiança antes de sair pulando para a próxima tecnologia da moda.",
  },
  {
    categoria: "Estudo",
    texto:
      "Pratique ler mensagens de erro com calma, porque saber interpretar erros é uma das habilidades que mais aceleram seu progresso.",
  },
  {
    categoria: "Primeiro emprego",
    texto:
      "Nos primeiros meses, faça muitas perguntas, pois ninguém espera que o recém-chegado já saiba tudo do sistema.",
  },
  {
    categoria: "Primeiro emprego",
    texto:
      "Anote como configurar o ambiente e os processos do time enquanto aprende, e depois transforme isso em documentação útil para o próximo.",
  },
  {
    categoria: "Primeiro emprego",
    texto:
      "Entregue tarefas pequenas com qualidade antes de pedir desafios grandes, construindo confiança aos poucos com o time.",
  },
  {
    categoria: "Primeiro emprego",
    texto:
      "Peça feedback de forma específica perguntando o que melhorar em algo concreto, em vez de aguardar a avaliação formal anual.",
  },
  {
    categoria: "Primeiro emprego",
    texto:
      "Entenda o produto e o cliente, não só o código, porque isso te ajuda a tomar decisões técnicas mais acertadas.",
  },
  {
    categoria: "Primeiro emprego",
    texto:
      "Avise cedo quando perceber que uma tarefa vai atrasar, pois transparência vale mais que silêncio seguido de surpresa.",
  },
  {
    categoria: "Primeiro emprego",
    texto:
      "Observe como os colegas mais respeitados se comunicam e resolvem conflitos, e use isso como referência de comportamento.",
  },
  {
    categoria: "Estágio",
    texto:
      "Trate o estágio como uma vitrine de atitude, já que muitas contratações efetivas vêm de quem mostrou iniciativa e vontade de aprender.",
  },
  {
    categoria: "Estágio",
    texto:
      "Aproveite que é esperado que você erre para experimentar e perguntar bastante enquanto a cobrança ainda é menor.",
  },
  {
    categoria: "Estágio",
    texto:
      "Encontre um mentor informal no time e demonstre que você aplica os conselhos recebidos, o que estimula a pessoa a te ajudar mais.",
  },
  {
    categoria: "Estágio",
    texto:
      "Ofereça-se para tarefas que ninguém quer fazer, pois elas costumam render aprendizado e visibilidade rápidos.",
  },
  {
    categoria: "Estágio",
    texto:
      "Guarde exemplos do que você construiu durante o estágio, com prints e descrições, para alimentar seu currículo e portfólio depois.",
  },
  {
    categoria: "Estágio",
    texto:
      "Mostre interesse genuíno pelo negócio fazendo perguntas sobre por que as coisas são feitas de determinada maneira.",
  },
  {
    categoria: "Produtividade",
    texto:
      "Divida tarefas grandes em pedaços pequenos e entregáveis, porque progresso visível mantém a motivação e facilita pedir ajuda.",
  },
  {
    categoria: "Produtividade",
    texto:
      "Proteja blocos de foco profundo sem notificações, já que trocar de contexto o tempo todo destrói a produtividade em programação.",
  },
  {
    categoria: "Produtividade",
    texto:
      "Antes de começar a codar, escreva em uma frase o que você quer alcançar para não se perder no meio da implementação.",
  },
  {
    categoria: "Produtividade",
    texto:
      "Estabeleça um limite de tempo para tentar resolver algo sozinho antes de pedir ajuda, equilibrando autonomia e bom uso do tempo do time.",
  },
  {
    categoria: "Produtividade",
    texto:
      "Automatize tarefas repetitivas que você faz toda semana, pois o tempo investido no script costuma se pagar rápido.",
  },
  {
    categoria: "Produtividade",
    texto:
      "Faça pausas reais longe da tela, porque boa parte das soluções aparece quando o cérebro descansa do problema.",
  },
  {
    categoria: "Produtividade",
    texto:
      "Termine o dia anotando o próximo passo concreto, assim você recomeça amanhã sem perder tempo decidindo por onde ir.",
  },
  {
    categoria: "Soft skills",
    texto:
      "Aprenda a escrever mensagens claras e objetivas, pois grande parte do trabalho em tech acontece por texto assíncrono.",
  },
  {
    categoria: "Soft skills",
    texto:
      "Em revisões de código, comente o código e não a pessoa, e explique o porquê das suas sugestões.",
  },
  {
    categoria: "Soft skills",
    texto:
      "Saiba dizer não sei e vou descobrir, porque admitir limites com naturalidade gera mais confiança do que improvisar respostas.",
  },
  {
    categoria: "Soft skills",
    texto:
      "Adapte o nível técnico da sua explicação ao público, traduzindo termos quando fala com pessoas de áreas não técnicas.",
  },
  {
    categoria: "Soft skills",
    texto:
      "Receba críticas separando o feedback da sua autoestima, focando no que dá para melhorar na próxima entrega.",
  },
  {
    categoria: "Soft skills",
    texto:
      "Reconheça publicamente a contribuição dos colegas, pois dar crédito fortalece relações e raramente diminui o seu valor.",
  },
  {
    categoria: "Soft skills",
    texto:
      "Desenvolva paciência para entender o contexto antes de propor mudanças, já que muitas decisões estranhas têm uma razão histórica.",
  },
  {
    categoria: "Comunidades",
    texto:
      "Participe ativamente de comunidades técnicas respondendo dúvidas que você já sabe, porque ensinar consolida o seu próprio conhecimento.",
  },
  {
    categoria: "Comunidades",
    texto:
      "Contribua com projetos open source começando por documentação ou correções pequenas antes de mirar mudanças grandes.",
  },
  {
    categoria: "Comunidades",
    texto:
      "Vá a meetups e eventos locais mesmo sem conhecer ninguém, pois aparecer com frequência transforma estranhos em rede de contatos.",
  },
  {
    categoria: "Comunidades",
    texto:
      "Ao pedir ajuda em fóruns, mostre o que já tentou e o erro completo, o que aumenta muito a chance de boas respostas.",
  },
  {
    categoria: "Comunidades",
    texto:
      "Ofereça-se para palestrar sobre algo que aprendeu, já que apresentar mesmo coisas básicas te destaca e força um aprendizado mais sólido.",
  },
  {
    categoria: "Comunidades",
    texto:
      "Seja gentil e paciente com iniciantes nas comunidades, pois a reputação que você constrói viaja mais longe do que imagina.",
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
  {
    titulo: "Moneyball",
    ano: "2011",
    porque:
      "Prova na prática como dados e estatística derrubam intuição e mudam decisões de um setor inteiro.",
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
  {
    titulo: "WeCrashed",
    ano: "2022",
    porque:
      "Dramatiza a ascensão e queda da WeWork e expõe os perigos de hype, ego e financiamento sem freio.",
  },
  {
    titulo: "Super Pumped: The Battle for Uber",
    ano: "2022",
    porque:
      "Mostra os bastidores da Uber e como cultura agressiva e crescimento a qualquer custo cobram seu preço.",
  },
  {
    titulo: "The Dropout",
    ano: "2022",
    porque:
      "Conta a fraude da Theranos e serve de alerta sobre vender uma tecnologia que ainda não funciona.",
  },
  {
    titulo: "Inventing Anna",
    ano: "2022",
    porque:
      "Explora golpe e construção de imagem no ecossistema de investidores e startups de Nova York.",
  },
  {
    titulo: "Upload",
    ano: "2020",
    porque:
      "Imagina consciências hospedadas na nuvem e brinca com monetização, dados e vida digital pós-morte.",
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
