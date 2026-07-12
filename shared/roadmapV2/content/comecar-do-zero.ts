// TODO(Ana): revisao editorial completa desta trilha (titulos, descricoes e
// todo o conteudo em markdown foram escritos a partir do roadmap legado
// "Começar do Zero em TI" e precisam de revisao de copy).
import type { RoadmapV2 } from "../types";

export const comecarDoZero: RoadmapV2 = {
  slug: "comecar-do-zero",
  area: "carreira",
  kind: "carreira",
  title: "Começar do Zero em TI",
  level: "Iniciante",
  description:
    "Para quem nunca teve contato com tecnologia e quer entender por onde começar. Sem pré-requisitos: apenas vontade de aprender.",
  sections: [
    {
      id: "descobrindo",
      title: "Descobrindo o universo tech",
      description:
        "Feita para quem não tem nenhuma experiência em TI: entenda o que existe na área antes de escolher um caminho.",
      level: "iniciante",
      children: [
        {
          id: "descobrindo.panorama",
          title: "Entenda o universo tech",
          description:
            "Um mapa geral das áreas de tecnologia e do que cada uma faz.",
          content:
            "Tecnologia não é uma profissão única: é um guarda-chuva de dezenas de áreas diferentes. Tem gente que constrói telas e botões (front-end), gente que cuida da lógica e dos dados por trás (back-end), gente que desenha a experiência antes de existir código (UX/UI), gente que analisa dados pra apoiar decisões, gente que testa sistemas pra garantir qualidade (QA), gente que cuida de servidores e redes, e muito mais.\n\nO primeiro passo de quem está começando do zero é conhecer esse mapa. Reserve alguns dias pra pesquisar as áreas, assistir vídeos introdutórios e ler descrições do dia a dia de cada profissional. Não precisa entender os termos técnicos ainda: o objetivo é ter uma noção do que existe e do que desperta sua curiosidade.\n\nUma armadilha comum é achar que TI é só programação. Várias áreas, como UX/UI, produto e análise de dados, usam pouco ou nenhum código no início. Se programar não te atrai de cara, isso não fecha as portas da tecnologia pra você.\n\nAo final desta etapa, você deve conseguir citar quatro ou cinco áreas e explicar, em uma frase cada, o que o profissional daquela área faz.",
          resources: [
            {
              label: "Explorar as áreas da plataforma",
              url: "/areas",
            },
          ],
        },
        {
          id: "descobrindo.profissoes",
          title: "O dia a dia de cada profissional",
          description:
            "Vá além dos nomes: descubra como é a rotina real de cada área.",
          content:
            'Saber que existe "desenvolvedor back-end" é diferente de saber como é o dia de um. Antes de escolher uma direção, vale investigar a rotina real das áreas que chamaram sua atenção: quais problemas a pessoa resolve, com quem ela trabalha, quanto tempo passa em reunião, o que ela entrega no fim da semana.\n\nBoas fontes pra isso são vídeos de "um dia na vida" de profissionais brasileiros, entrevistas em podcasts de tecnologia e posts no LinkedIn de quem trabalha na área. Procure sempre mais de uma fonte por área: a rotina muda bastante entre empresa grande, startup e trabalho freelancer.\n\nEnquanto pesquisa, anote o que te animou e o que te desanimou em cada área. Gostar de resolver problemas visuais aponta pra um lado; gostar de organizar informação e encontrar padrões aponta pra outro; gostar de conversar com pessoas e destravar times aponta pra um terceiro.\n\nEssas anotações vão ser sua matéria prima na hora de escolher uma área pra explorar de verdade na próxima etapa. Não existe resposta certa: existe a área que combina com o que você gosta de fazer repetidamente.',
        },
        {
          id: "descobrindo.mitos",
          title: "Erros comuns de quem está começando",
          description:
            "As armadilhas mais frequentes do início e como não cair nelas.",
          content:
            'Alguns erros se repetem em quase toda história de quem começa em tecnologia. Conhecer os principais agora economiza meses de frustração.\n\nO primeiro é tentar aprender tudo ao mesmo tempo. Não tente estudar três linguagens ou três áreas em paralelo: foque em uma área e vá fundo. Profundidade em uma coisa vale mais no início do que superficialidade em cinco.\n\nO segundo é o famoso "tutorial hell": ficar preso assistindo curso atrás de curso sem nunca criar nada próprio. Assistir aula dá sensação de progresso, mas o aprendizado de verdade acontece quando você trava tentando fazer sozinho e precisa se virar pra destravar.\n\nO terceiro é não publicar seus projetos por medo de julgamento. Todo mundo começou com projeto simples e código imperfeito. Quem avalia iniciante quer ver evolução e iniciativa, não perfeição. Projeto guardado na sua máquina não existe pra ninguém.\n\nGuarde esses três avisos e volte a eles sempre que sentir que o estudo travou. Na maioria das vezes, o problema vai ser um desses.',
        },
      ],
    },
    {
      id: "escolha",
      title: "Escolha da área",
      description:
        "Cruze o que você descobriu com o seu perfil e escolha uma área pra explorar de verdade.",
      level: "iniciante",
      children: [
        {
          id: "escolha.perfil",
          title: "Conheça seu perfil",
          description:
            "Identifique o que você gosta de fazer antes de decidir a direção.",
          content:
            "Escolher área olhando só pra salário ou pra moda do momento costuma dar errado: você vai passar milhares de horas trabalhando nisso, então o que sustenta a carreira é gostar do tipo de problema que a área resolve.\n\nFaça um balanço honesto. Você prefere ver o resultado visual do que faz ou se importa mais com a lógica por trás? Gosta mais de trabalhar sozinho e focado ou conversando e coordenando pessoas? Se sente atraído por números e padrões ou por comportamento humano? Prefere criar coisas novas ou melhorar e organizar o que já existe?\n\nNão existe combinação melhor ou pior: cada perfil encaixa melhor em algumas áreas. Quem gosta de resultado visual tende a curtir front-end e UX/UI. Quem gosta de lógica e estrutura tende a curtir back-end e dados. Quem gosta de gente e organização tende a curtir produto, QA e gestão.\n\nSe quiser um empurrão estruturado, o quiz de carreira da plataforma cruza suas respostas com as áreas e sugere caminhos compatíveis com seu perfil. Use o resultado como hipótese a testar, não como sentença.",
          resources: [
            {
              label: "Fazer o quiz de carreira",
              url: "/quiz-carreira",
            },
          ],
        },
        {
          id: "escolha.area",
          title: "Escolha uma área para explorar",
          description:
            "Defina uma única área de partida e assuma o compromisso de testá-la.",
          content:
            'Com o mapa das áreas e o seu perfil em mãos, é hora de decidir: escolha uma única área pra explorar nas próximas semanas. Front-end, UX/UI, dados e QA costumam ser boas portas de entrada por terem material introdutório abundante e primeiros resultados rápidos, mas a melhor escolha é a que mais combinou com o que você descobriu sobre si.\n\nEncare a escolha como um experimento, não como casamento. Você vai estudar essa área por um período definido (algumas semanas), criar algo pequeno nela e só então avaliar: gostei do tipo de problema? Me vejo fazendo isso todo dia? Se a resposta for não, trocar de área depois de um teste honesto não é desperdício, é aprendizado. Boa parte do conhecimento (lógica, ferramentas, vocabulário) se aproveita na área seguinte.\n\nO que não funciona é ficar pulando de área em área a cada semana sem dar tempo de nenhuma mostrar sua profundidade, ou ficar meses parado na dúvida sem escolher nada.\n\nEscolhida a área, anote em algum lugar visível: "vou explorar X até tal data". Esse compromisso simples protege você da tentação de recomeçar do zero a cada vídeo novo que aparecer no feed.',
        },
      ],
    },
    {
      id: "base",
      title: "Base de lógica",
      description:
        "A fundação que serve pra qualquer área: aprender a pensar em passos que um computador entende.",
      level: "intermediario",
      children: [
        {
          id: "base.logica",
          title: "Lógica de programação",
          description:
            "O raciocínio estruturado que sustenta qualquer caminho na tecnologia.",
          content:
            "Independente da área escolhida, entender lógica de programação ajuda muito. Ela é a habilidade de quebrar um problema em passos pequenos e ordenados que um computador consegue executar: receber uma informação, tomar uma decisão com base nela, repetir uma ação várias vezes, guardar um resultado pra usar depois.\n\nMesmo quem vai pra áreas com pouco código, como UX/UI ou produto, se beneficia: lógica melhora a comunicação com desenvolvedores e o entendimento de como sistemas funcionam por dentro. E pra quem vai programar, ela é o alicerce de tudo que vem depois.\n\nO conteúdo clássico cobre variáveis (guardar valores), condicionais (se isso, faça aquilo), laços de repetição (faça isso várias vezes) e funções (agrupar passos com um nome). Existem cursos gratuitos e completos de lógica em português, como os do Curso em Vídeo, que cobrem tudo isso com exercícios.\n\nReserve de duas a quatro semanas pra essa etapa, estudando um pouco por dia. O critério de conclusão não é terminar o curso: é conseguir resolver problemas simples sozinho, sem olhar a resposta.",
          resources: [
            {
              label: "Curso em Vídeo",
              url: "https://www.cursoemvideo.com",
              kind: "curso",
            },
          ],
        },
        {
          id: "base.pratica",
          title: "Pratique com exercícios",
          description:
            "Transforme a teoria em habilidade resolvendo problemas pequenos todo dia.",
          content:
            "Lógica de programação não se aprende assistindo: se aprende errando. A cada conceito novo do curso, pare o vídeo e tente resolver variações do exercício por conta própria antes de ver a solução.\n\nUma rotina que funciona: todo dia, refaça de memória um exercício que você já viu e tente um que nunca viu. Problemas bons pra essa fase são coisas do cotidiano traduzidas em passos: calcular quanto fica uma conta dividida entre amigos, decidir se um ano é bissexto, somar apenas os números pares de uma lista, contar quantas vezes uma letra aparece numa palavra.\n\nQuando travar (e você vai travar), resista ao impulso de olhar a resposta imediatamente. Fique pelo menos quinze minutos tentando caminhos diferentes: é exatamente nesse desconforto que o cérebro constrói a habilidade. Se depois disso ainda estiver preso, aí sim olhe a solução, entenda o raciocínio e refaça sozinho no dia seguinte.\n\nO sinal de que você está pronto pra avançar é conseguir ler um problema novo, esboçar os passos da solução em português antes de escrever qualquer código, e chegar numa resposta que funciona sem ajuda.",
        },
      ],
    },
    {
      id: "curso",
      title: "Primeiro curso da sua área",
      description:
        "Um curso introdutório gratuito, escolhido com critério e levado do início ao fim.",
      level: "intermediario",
      children: [
        {
          id: "curso.escolher",
          title: "Escolha um curso introdutório gratuito",
          description:
            "Um único curso da sua área, gratuito e com projeto prático no fim.",
          content:
            "Com a base de lógica construída, é hora do primeiro curso técnico da área que você escolheu. Não precisa pagar nada nessa fase: existe material gratuito de sobra e de qualidade no YouTube, no freeCodeCamp, na DIO e em plataformas parecidas.\n\nBons critérios pra escolher: o curso é introdutório de verdade (não assume conhecimento prévio além de lógica), foi publicado ou atualizado recentemente, tem exercícios ou um projeto prático no fim, e tem uma carga horária que você consegue encarar (entre dez e quarenta horas é uma boa faixa pra um primeiro curso).\n\nA regra mais importante: escolha UM curso. Abrir três cursos da mesma coisa em paralelo é a receita do abandono. Se bater a dúvida entre dois bons candidatos, escolha qualquer um; a diferença entre eles importa muito menos do que a consistência de quem estuda.\n\nA seção de cursos da plataforma reúne opções gratuitas filtradas por área e pode encurtar essa garimpagem. Escolhido o curso, anote a data em que pretende terminar: um prazo realista, considerando de quatro a oito semanas de estudo constante.",
          resources: [
            {
              label: "Cursos gratuitos na plataforma",
              url: "/cursos",
            },
            {
              label: "freeCodeCamp",
              url: "https://www.freecodecamp.org",
              kind: "curso",
            },
          ],
        },
        {
          id: "curso.concluir",
          title: "Complete do início ao fim",
          description:
            "Constância vence intensidade: termine o curso que você começou.",
          content:
            'Terminar um curso introdutório inteiro é menos comum do que parece: a maioria das pessoas abandona nas primeiras semanas. Concluir o seu já te coloca na minoria que sai da inércia, e a disciplina construída aqui vale tanto quanto o conteúdo.\n\nAlgumas táticas aumentam muito a chance de chegar ao fim. Estude em horário fixo, mesmo que sejam só trinta minutos por dia: constância diária vence maratonas de fim de semana. Digite todo código ou refaça todo exercício mostrado, nunca só assista. Mantenha um caderno (físico ou digital) com anotações do que aprendeu em cada aula, escritas com suas palavras.\n\nQuando o curso ficar difícil (e vai ficar, geralmente no meio), não interprete como sinal de que "não é pra você". Dificuldade no meio do caminho é a experiência universal de quem aprende algo novo. Reduza o ritmo se precisar, revise as aulas anteriores, mas não pare.\n\nO critério de conclusão desta etapa é objetivo: curso terminado, exercícios feitos e anotações registradas. Com isso em mãos, você está pronto pra etapa que separa quem estuda de quem constrói: o primeiro projeto.',
        },
      ],
    },
    {
      id: "projeto",
      title: "Primeiro projeto e portfólio",
      description:
        "Saia do consumo e crie algo seu, publicado onde o mundo possa ver.",
      level: "avancado",
      children: [
        {
          id: "projeto.criar",
          title: "Crie seu primeiro projeto",
          description:
            "Aplique o que aprendeu em algo pequeno, seu e terminado.",
          content:
            "Chegou o momento mais importante da trilha: criar alguma coisa sua. Aplique o que o curso ensinou em um projeto pequeno e pessoal. Não precisa ser perfeito nem original: precisa ser SEU e precisa ser TERMINADO.\n\nO formato depende da área. Quem foi de front-end pode fazer uma página pessoal ou um site pra um negócio fictício. Quem foi de UX/UI pode redesenhar a tela de um aplicativo que usa todo dia, documentando as decisões. Quem foi de dados pode analisar uma base pública e apresentar três descobertas. Quem foi de QA pode escrever um plano de testes completo pra um aplicativo conhecido.\n\nA regra de ouro é escopo pequeno: algo que você termina em uma ou duas semanas. Projeto grande demais é a forma mais comum de abandonar o primeiro projeto. Se a ideia não cabe em duas semanas, corte funcionalidades até caber.\n\nDurante o processo você vai travar em coisas que o curso não cobriu. Isso não é falha do plano: é o plano. Pesquisar erro, ler documentação e destravar sozinho é exatamente a habilidade que o mercado paga. A seção de projetos da plataforma tem ideias com passo a passo se você precisar de inspiração.",
          resources: [
            {
              label: "Ideias de projetos na plataforma",
              url: "/projetos",
            },
          ],
        },
        {
          id: "projeto.publicar",
          title: "Publique no GitHub ou Behance",
          description:
            "Projeto guardado não existe: publique e comece seu portfólio.",
          content:
            "Projeto terminado e guardado na sua máquina não existe pra ninguém. O passo que transforma estudo em portfólio é publicar: GitHub pra quem trabalha com código, Behance pra quem foi de design.\n\nNo GitHub, crie uma conta com nome profissional (de preferência seu nome, sem apelidos difíceis de ler), suba o projeto num repositório e escreva um README simples: o que o projeto faz, o que você usou pra construir e o que aprendeu no processo. Esse texto curto importa: é a primeira coisa que qualquer pessoa (incluindo recrutadores) lê.\n\nNo Behance, monte a apresentação do seu projeto de design contando a história: qual era o problema, que caminhos você explorou, por que tomou cada decisão e como ficou o resultado. Processo bem contado vale mais do que tela bonita sem contexto.\n\nBata o medo de publicar de frente: seu primeiro projeto público vai ser simples, e está tudo bem. Quem olha o perfil de um iniciante procura sinal de iniciativa e evolução, não maturidade técnica. Este é o início do seu portfólio: cada projeto futuro se acumula em cima deste primeiro tijolo.",
          resources: [
            {
              label: "GitHub",
              url: "https://github.com",
              kind: "doc",
            },
            {
              label: "Behance",
              url: "https://www.behance.net",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "presenca",
      title: "Presença e comunidade",
      description:
        "Torne sua jornada visível e conecte-se com quem já está no caminho.",
      level: "avancado",
      children: [
        {
          id: "presenca.linkedin",
          title: "Monte seu LinkedIn",
          description:
            "Crie ou atualize seu perfil com o que você já construiu até aqui.",
          content:
            'Com projeto publicado, você já tem o que mostrar: é hora de montar (ou atualizar) seu LinkedIn. Ele é a vitrine profissional mais consultada por recrutadores no Brasil, e um perfil bem preenchido começa a trabalhar por você antes mesmo da primeira candidatura.\n\nO essencial pra esta fase: foto com boa iluminação e fundo neutro, título dizendo o que você está estudando e o que busca (por exemplo, "Estudante de front-end em transição de carreira"), uma seção Sobre curta e honesta contando sua história, e seu projeto adicionado com link pro GitHub ou Behance.\n\nDepois do perfil de pé, comece a se conectar com pessoas da sua área: colegas de curso, criadores de conteúdo que você acompanha, profissionais que trabalham onde você gostaria de trabalhar. Convite com mensagem curta e genuína tem taxa de aceitação muito maior do que convite mudo.\n\nMontar um LinkedIn forte é um assunto com profundidade própria: a plataforma tem uma trilha inteira dedicada a isso, do título até a estratégia de posts. Ela é o complemento natural deste passo.',
          resources: [
            {
              label: "Trilha completa de LinkedIn",
              url: "/roadmaps/linkedin",
            },
          ],
        },
        {
          id: "presenca.comunidade",
          title: "Entre em uma comunidade",
          description: "Networking desde o início: aprenda junto, não sozinho.",
          content:
            'Estudar sozinho funciona por um tempo, mas quem entra numa comunidade avança mais rápido e desiste menos. Participar de grupos no Discord, no Slack, no WhatsApp ou no LinkedIn te dá três coisas que estudo solitário não dá: respostas quando você trava, noção realista do mercado e conexões que viram indicações lá na frente.\n\nProcure comunidades da sua área com movimento real: canais de dúvidas ativos, eventos ou lives recorrentes, gente iniciante e gente experiente convivendo. A seção de comunidades da plataforma lista opções por área e formato pra encurtar essa busca.\n\nEntrar é só o primeiro passo: comunidade funciona pra quem participa. Apresente-se no canal de boas-vindas, acompanhe as conversas por alguns dias pra pegar o tom, responda o que você souber (explicar o básico pra alguém consolida o seu próprio aprendizado) e pergunte sem vergonha quando travar, mostrando o que você já tentou.\n\nNetworking é fundamental desde o início, não depois que você "estiver pronto". As pessoas que te veem aprendendo hoje são as mesmas que vão lembrar de você quando surgir uma vaga de estágio amanhã.',
          resources: [
            {
              label: "Comunidades na plataforma",
              url: "/comunidades",
            },
          ],
        },
        {
          id: "presenca.proximopasso",
          title: "Próximo passo: a trilha da sua área",
          description:
            "Onde continuar a jornada depois de concluir esta trilha.",
          content:
            'Se você chegou até aqui com as etapas concluídas, olhe pra trás um segundo: você saiu de "não sei nada de TI" pra alguém com área escolhida, base de lógica, um curso completo, um projeto publicado, LinkedIn de pé e uma comunidade por perto. Isso é mais do que a maioria constrói.\n\nO próximo passo natural é ganhar profundidade técnica: aprofunde-se no roadmap específico da área que você escolheu. A plataforma tem trilhas completas por área (front-end, back-end, dados, UX/UI, QA e várias outras), organizadas do nível iniciante ao avançado, com conteúdo passo a passo e projetos práticos no caminho.\n\nA dinâmica muda um pouco a partir daqui: em vez de descobrir o terreno, você vai construir em cima dele. O ritmo que funcionou nesta trilha (estudo constante, prática diária, projeto publicado a cada ciclo) continua sendo a fórmula.\n\nEscolha a trilha da sua área na página de roadmaps e comece pela primeira etapa. E mantenha o hábito que você criou aqui: aprender, construir, publicar, repetir.',
          resources: [
            {
              label: "Todas as trilhas por área",
              url: "/roadmaps",
            },
          ],
        },
      ],
    },
  ],
};
