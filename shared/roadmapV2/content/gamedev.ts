import type { RoadmapV2 } from "../types";

export const gamedev: RoadmapV2 = {
  slug: "gamedev",
  area: "gamedev",
  title: "Desenvolvimento de Jogos do Zero",
  level: "Iniciante",
  description:
    "Da escolha da engine e da linguagem às mecânicas, física, game design e publicação do seu primeiro jogo. Escolha sua engine e conclua uma etapa pra liberar a próxima.",
  languages: [
    { id: "unity", label: "Unity (C#)" },
    { id: "godot", label: "Godot (GDScript)" },
    { id: "unreal", label: "Unreal (C++)" },
  ],
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é programar jogos, que expectativas ter e o papel central da game engine.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é desenvolvimento de jogos",
          description:
            "Programar tudo que faz um jogo funcionar, da movimentação à inteligência dos inimigos.",
          content:
            'Desenvolvimento de jogos é a programação por trás dos jogos digitais, do mobile casual ao console de grande porte. O desenvolvedor de jogos cria tudo que faz um jogo funcionar: os controles, as mecânicas de combate, a inteligência dos inimigos, a física, o salvamento de progresso, a otimização pra rodar bem em diferentes aparelhos.\n\nÉ uma área que mistura disciplinas. Tem **programação** (a base de tudo), mas também **matemática** aplicada (vetores e geometria pra mover objetos no espaço), sensibilidade pra **experiência do jogador** (o jogo é divertido? está justo?) e muito **trabalho em equipe**: programadores colaboram de perto com designers de jogo, artistas, animadores e profissionais de som. Raramente um jogo nasce de uma pessoa só.\n\nUma característica define o ofício: a quantidade de **testes e ajustes**. Fazer um jogo "sentir" bem (o pulo na medida certa, a dificuldade equilibrada, o controle responsivo) exige iterar muito, testando e refinando sem parar. Paciência pra esse ajuste fino é parte do trabalho.\n\nUm detalhe prático que vale saber desde já: em jogos, mais que em outras áreas de programação, o **inglês** é quase indispensável. A maior parte da documentação, dos tutoriais e das comunidades está em inglês, então desenvolver essa habilidade em paralelo acelera muito o aprendizado.\n\nEsta trilha te leva do zero até publicar um primeiro jogo, passando pela escolha da engine, a programação, as mecânicas, o game design e a publicação. É um caminho técnico e criativo ao mesmo tempo, e dos mais gratificantes pra quem ama games.',
        },
        {
          id: "fundamentos.expectativas",
          title: "Expectativas realistas",
          description:
            "Uma conversa honesta sobre o mercado de jogos antes de você investir tempo.",
          content:
            "Vale uma conversa franca antes de mergulhar, porque o mercado de jogos tem particularidades que pesam na decisão de carreira. Ignorá-las leva à frustração; conhecê-las ajuda a entrar com os pés no chão.\n\nO mercado de games no Brasil é **menor** que o de outras áreas de tecnologia, embora venha crescendo, com mais força no segmento **mobile** e em estúdios de porte médio. Isso significa menos vagas que em áreas como desenvolvimento web, e mais concorrência por elas. O salário inicial também tende a ser **mais baixo** que em outras áreas de programação no começo da carreira, ainda que profissionais experientes, especialmente em estúdios internacionais ou trabalhando remoto pra fora, possam ganhar bem.\n\nA conclusão honesta, que a própria área costuma repetir: entre em games por **paixão**, não principalmente pelo dinheiro. Quem ama jogos e tem prazer em construí-los encontra motivação pra atravessar os desafios; quem busca só retorno financeiro rápido tende a se decepcionar e encontraria caminhos mais diretos em outras áreas de tecnologia.\n\nMas há um lado muito positivo. As habilidades que você desenvolve em games (programação, matemática, otimização, resolução de problemas complexos) são valiosas e **transferíveis** pra outras áreas, então o aprendizado nunca é perdido. E a paixão pela área é real e contagiante: poucas coisas em programação se comparam à satisfação de ver alguém jogando e se divertindo com algo que você construiu.\n\nSe você tem essa paixão genuína, o caminho vale a pena, e esta trilha te dá o mapa. Só entre com expectativas calibradas.",
        },
        {
          id: "fundamentos.engine",
          title: "O que é uma game engine",
          description:
            "A ferramenta central que faz o trabalho pesado por trás de qualquer jogo.",
          content:
            "Você não constrói um jogo do zero programando cada pixel e cada cálculo de física na mão; isso levaria anos. Em vez disso, usa uma **game engine** (motor de jogo): um software que já traz pronto o trabalho pesado e comum a praticamente todos os jogos, deixando você focar no que torna o seu jogo único.\n\nUma engine oferece, entre outras coisas: um sistema de **renderização** (desenhar gráficos 2D ou 3D na tela), um motor de **física** (gravidade, colisões, movimento), gerenciamento de **cenas** e objetos, tratamento de **entrada** (teclado, mouse, controle, toque), som, e ferramentas visuais pra montar os níveis do jogo. É como receber uma cozinha equipada em vez de ter que fabricar o fogão.\n\nA engine define boa parte do seu fluxo de trabalho e até a linguagem de programação que você vai usar. Por isso, escolher uma engine é a primeira grande decisão da área, e é nela que esta trilha se ramifica. Esta trilha funciona com três engines, e você escolhe uma no seletor acima:\n\n- **Unity**, que usa a linguagem C#, é a mais usada no mercado, especialmente em jogos mobile, com a maior quantidade de vagas e material de estudo.\n- **Godot**, que usa principalmente a linguagem GDScript, é livre e de código aberto, leve e muito amigável pra iniciantes.\n- **Unreal Engine**, que usa C++, é referência em jogos de gráficos avançados e grande porte.\n\nO próximo passo te ajuda a escolher a sua, e o conteúdo da trilha se adapta a ela.",
        },
      ],
    },
    {
      id: "inicio",
      title: "Escolha e linguagem",
      description:
        "Decidir sua engine e aprender a linguagem de programação que ela usa.",
      level: "iniciante",
      children: [
        {
          id: "inicio.escolha",
          title: "Escolher sua engine",
          description: "Como decidir entre Unity, Godot e Unreal pra começar.",
          content:
            'A escolha da engine parece intimidadora, mas há orientações claras pra iniciantes, e a boa notícia é que os **conceitos fundamentais** (game loop, cenas, objetos, física, mecânicas) são parecidos entre todas. Quem aprende uma migra pra outra com bem menos esforço do que parece, então não existe escolha "errada" que vá travar sua carreira.\n\nUm retrato pra orientar a decisão. A **Unity** é a aposta mais segura por empregabilidade: é a mais usada no mercado, domina o mobile, e tem a maior biblioteca de tutoriais e a maior comunidade. Usa C#, uma linguagem acessível. A **Godot** é excelente pra começar: é leve (roda em máquinas modestas), gratuita e de código aberto, com uma curva de entrada suave e uma linguagem própria, o GDScript, fácil de aprender. A **Unreal Engine** brilha em jogos de gráficos avançados e grande porte, mas usa C++, uma linguagem mais difícil, e é mais pesada, o que a torna menos indicada pra quem está dando os primeiros passos.\n\nA recomendação prática pra iniciantes costuma ser **Unity ou Godot**, por serem mais leves e amigáveis. Escolha Unity se mira o mercado e mais vagas; escolha Godot se quer simplicidade, software livre e uma entrada mais suave. Deixe a Unreal pra quando tiver mais base, ou escolha-a se o seu sonho é especificamente trabalhar com jogos de gráficos de ponta.\n\nO mais importante: **decida e siga**. Pular de engine em engine no começo é a forma mais comum de não sair do lugar. Selecione a sua acima e mantenha-se nela até completar a trilha.',
        },
        {
          id: "inicio.linguagem",
          title: "A linguagem da sua engine",
          description: "Programar é a base, e cada engine usa uma linguagem.",
          content:
            "Antes de fazer mágica numa engine, você precisa saber **programar**. A lógica de programação (variáveis, condicionais, laços, funções, estruturas de dados) é a base inegociável, e a linguagem específica vem da engine que você escolheu. Se você está totalmente do zero, vale começar pelos fundamentos de lógica antes de mergulhar na sintaxe.\n\nUm conselho que vale pra todas as engines: comece pequeno. Aprenda o suficiente da linguagem pra fazer um objeto se mover na tela, e vá aumentando a complexidade conforme constrói jogos cada vez maiores. Escolha sua engine acima pra ver qual linguagem aprender e por onde começar.",
          byLanguage: {
            unity: {
              content:
                "A Unity usa **C#**, uma linguagem da Microsoft, robusta e relativamente amigável pra iniciantes. Foque no básico: variáveis e tipos, condicionais, laços, funções, classes e listas. Em Unity, você escreve scripts em C# que se anexam aos objetos do jogo pra dar comportamento a eles. A documentação oficial da linguagem é completa, e o Unity Learn traz cursos gratuitos que ensinam C# já no contexto de jogos.",
              resources: [
                {
                  label: "Unity Learn (cursos oficiais gratuitos)",
                  url: "https://learn.unity.com/",
                  kind: "curso",
                },
                {
                  label: "C# (documentação oficial)",
                  url: "https://learn.microsoft.com/en-us/dotnet/csharp/",
                  kind: "doc",
                },
              ],
            },
            godot: {
              content:
                "A Godot usa principalmente o **GDScript**, uma linguagem própria criada pra ela, com sintaxe parecida com Python, simples e fácil de aprender, ideal pra quem começa. Foque no básico: variáveis, condicionais, laços, funções e o trabalho com os nós da cena. Em Godot, você anexa scripts GDScript aos nós pra dar comportamento. A documentação oficial da Godot ensina o GDScript do zero, de forma clara e gratuita.",
              resources: [
                {
                  label: "Godot: GDScript (documentação oficial)",
                  url: "https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/index.html",
                  kind: "doc",
                },
              ],
            },
            unreal: {
              content:
                "A Unreal usa **C++**, uma linguagem poderosa porém mais difícil, com conceitos como gerenciamento de memória que exigem mais cuidado. Foque no básico de C++ (tipos, funções, classes, ponteiros) com paciência, porque a curva é mais íngreme. A Unreal também oferece o **Blueprints**, um sistema visual de programação por blocos que permite criar lógica sem escrever código, ótimo pra prototipar e aprender antes de mergulhar fundo no C++.",
              resources: [
                {
                  label: "Unreal Engine: documentação oficial",
                  url: "https://dev.epicgames.com/documentation/en-us/unreal-engine",
                  kind: "doc",
                },
                {
                  label: "cppreference (referência de C++)",
                  url: "https://en.cppreference.com/w/",
                  kind: "doc",
                },
              ],
            },
          },
        },
      ],
    },
    {
      id: "engine",
      title: "Dentro da engine",
      description:
        "Os conceitos centrais de como um jogo é estruturado e ganha vida na engine.",
      level: "intermediario",
      children: [
        {
          id: "engine.modelo",
          title: "Como a engine organiza um jogo",
          description:
            "O modelo de objetos e cenas que estrutura tudo na engine.",
          content:
            "Todo jogo é feito de **cenas** (telas ou níveis, como o menu principal ou uma fase) compostas por **objetos** (o jogador, os inimigos, as plataformas, a câmera, as luzes). Entender como a sua engine organiza esses objetos é o passo que destrava a construção de qualquer jogo, porque é a estrutura sobre a qual tudo o mais se apoia.\n\nCada engine tem seu modelo e seu vocabulário próprio pra isso, mas a ideia central é a mesma: você monta a cena posicionando objetos, e dá comportamento a eles através de scripts na linguagem que você aprendeu. Há também o conceito de **reaproveitar** objetos prontos (um inimigo que você configura uma vez e usa dezenas de vezes), que economiza muito trabalho. Escolha sua engine acima pra ver o modelo dela.",
          byLanguage: {
            unity: {
              content:
                "Na Unity, tudo na cena é um **GameObject**, e o comportamento vem dos **Components** que você anexa a ele (um componente de física, um de renderização, ou um script C# seu). Essa composição (um objeto = vários componentes) é o coração da Unity. Objetos reutilizáveis são salvos como **Prefabs**: você configura um inimigo uma vez, vira prefab, e o usa quantas vezes quiser, com mudanças no prefab refletindo em todas as cópias.",
              resources: [
                {
                  label: "Unity: manual (documentação oficial)",
                  url: "https://docs.unity3d.com/Manual/index.html",
                  kind: "doc",
                },
              ],
            },
            godot: {
              content:
                "Na Godot, tudo é **nó** (Node), e os nós se organizam em árvore dentro de uma **cena**. Um nó faz uma coisa (mostrar um sprite, detectar colisão, tocar um som), e você os combina aninhando-os. A grande sacada da Godot é que **qualquer cena pode virar um nó de outra cena**, o que torna o reaproveitamento muito natural: você cria a cena do inimigo e a instancia quantas vezes quiser dentro da fase.",
              resources: [
                {
                  label: "Godot: introdução (documentação oficial)",
                  url: "https://docs.godotengine.org/en/stable/getting_started/introduction/index.html",
                  kind: "doc",
                },
              ],
            },
            unreal: {
              content:
                "Na Unreal, os objetos que vivem no mundo do jogo são chamados de **Actors**, e a cena (o nível) é montada com eles. O comportamento pode vir de código C++ ou de **Blueprints**, o sistema visual de scripting. Objetos reutilizáveis e configuráveis são organizados como Blueprints próprios, que você posiciona no nível. A documentação oficial da Unreal cobre esse modelo e o fluxo de trabalho no editor.",
              resources: [
                {
                  label: "Unreal Engine: documentação oficial",
                  url: "https://dev.epicgames.com/documentation/en-us/unreal-engine",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "engine.gameloop",
          title: "O game loop",
          description:
            "O ciclo que roda dezenas de vezes por segundo e faz o jogo acontecer.",
          content:
            'Por trás de todo jogo existe o **game loop**: um ciclo que se repete muitas vezes por segundo (em geral entre 30 e 60, ou mais) e que, a cada volta, atualiza o estado do jogo e redesenha a tela. Cada volta desse ciclo é um **frame**. Quando você joga a 60 frames por segundo, o game loop está rodando 60 vezes por segundo. Entender isso muda como você pensa a programação de jogos.\n\nA cada frame, o jogo basicamente faz três coisas: lê a **entrada** do jogador (qual tecla foi apertada, pra onde o controle aponta), **atualiza** o estado do mundo (move objetos, aplica física, roda a lógica dos inimigos) e **desenha** o resultado na tela. As engines cuidam desse ciclo pra você e oferecem pontos onde seu código entra: tipicamente uma função que roda **a cada frame**, onde você coloca a lógica que precisa rodar continuamente, como o movimento do jogador.\n\nUm conceito crucial nasce daí: o **delta time**, o tempo que passou desde o frame anterior. Como nem todo computador roda na mesma velocidade, você multiplica os movimentos pelo delta time pra que o jogo se comporte igual num PC rápido e num lento. Sem isso, seu personagem andaria mais rápido numa máquina potente, o que é um bug clássico de iniciante.\n\nA lição prática: pense em "o que precisa acontecer a cada frame?". Mover, checar colisões, atualizar a pontuação. Essa mentalidade de ciclo contínuo, diferente de um programa comum que roda do início ao fim e termina, é a base de raciocínio da programação de jogos, e vale pra todas as engines.',
        },
      ],
    },
    {
      id: "mecanicas",
      title: "Mecânicas de jogo",
      description:
        "O que torna um jogo jogável: controle, física, colisões e inimigos com comportamento.",
      level: "intermediario",
      children: [
        {
          id: "mecanicas.movimento",
          title: "Movimento e controle",
          description:
            "Fazer o jogador responder aos comandos, a primeira mecânica de todo jogo.",
          content:
            'A primeira mecânica de qualquer jogo é o **movimento**: fazer o personagem responder aos comandos do jogador. Parece simples, mas é onde mora boa parte da sensação de um jogo, o famoso "game feel". Um controle responsivo e gostoso de usar é o que separa um jogo que parece bom de um que parece travado.\n\nO fluxo geral é o mesmo em qualquer engine: a cada frame, você lê a **entrada** do jogador (teclas, controle, toque na tela) e move o objeto de acordo, sempre considerando o delta time pra o movimento ser consistente em qualquer máquina. A partir do movimento básico, você adiciona refinamentos (aceleração, pulo, gravidade) que dão personalidade ao controle. Escolha sua engine acima pra ver como ler a entrada e mover objetos nela.',
          byLanguage: {
            unity: {
              content:
                "Na Unity, você lê a entrada pelo sistema de Input e move objetos alterando a posição do **Transform** do GameObject, ou aplicando força ao seu **Rigidbody** quando o movimento usa física. A função `Update` (que roda a cada frame) é onde a leitura de entrada costuma ficar. O Unity Learn tem tutoriais práticos de movimentação que são um ótimo primeiro exercício.",
              resources: [
                {
                  label: "Unity Learn (tutoriais oficiais)",
                  url: "https://learn.unity.com/",
                  kind: "curso",
                },
              ],
            },
            godot: {
              content:
                'Na Godot, você define **ações de entrada** no mapa de input (associando teclas e botões a nomes como "pular" e "mover") e as lê no script, geralmente na função `_process` (a cada frame) ou `_physics_process` (para movimento com física). Mover é alterar a posição do nó ou usar os nós de corpo físico. A documentação oficial tem um guia direto de movimento pro primeiro jogo.',
              resources: [
                {
                  label: "Godot: documentação oficial",
                  url: "https://docs.godotengine.org/en/stable/",
                  kind: "doc",
                },
              ],
            },
            unreal: {
              content:
                "Na Unreal, a entrada é mapeada no sistema de Input (associando teclas a ações) e tratada no código do seu Actor ou Pawn, ou em Blueprints. O movimento costuma usar componentes próprios da engine, como o de movimento de personagem, que já trazem física e colisão prontas. A documentação oficial cobre o sistema de entrada e os componentes de movimento.",
              resources: [
                {
                  label: "Unreal Engine: documentação oficial",
                  url: "https://dev.epicgames.com/documentation/en-us/unreal-engine",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "mecanicas.fisica",
          title: "Física e colisões",
          description:
            "Gravidade, empurrões e a detecção de quando objetos se tocam.",
          content:
            'Boa parte dos jogos depende de **física** e **colisões**, e as engines trazem isso pronto, poupando você de programar gravidade e cálculos de impacto do zero. Você não precisa entender a matemática por baixo pra usar; precisa entender os conceitos.\n\nDois elementos trabalham juntos. O **corpo físico** é o que faz um objeto obedecer à física da engine: cair com a gravidade, ser empurrado, deslizar. Você marca quais objetos são afetados pela física e quais ficam parados (uma plataforma sólida, por exemplo). O **colisor** é a forma (uma caixa, um círculo) que define os limites do objeto pra detecção de toque. Curiosamente, o colisor nem sempre tem o formato exato do desenho; muitas vezes uma forma simples aproximada já basta e roda mais rápido.\n\nA **detecção de colisão** é o que avisa seu código quando dois objetos se tocam, e é a base de incontáveis mecânicas: o jogador pegou uma moeda, a bala acertou o inimigo, o personagem pisou no chão, caiu no espinho. As engines disparam eventos nesses momentos, e você programa o que acontece (somar ponto, tirar vida, tocar um som).\n\nUm conceito útil é o **trigger** (gatilho): um colisor que detecta a passagem sem bloquear fisicamente, perfeito pra zonas invisíveis como "o jogador entrou na área do chefe" ou "chegou ao fim da fase".\n\nUma dica de iniciante: comece com a física que a engine oferece pronta, em vez de tentar simular tudo na mão. Só parta pra cálculos próprios quando precisar de um comportamento muito específico que o motor padrão não dá. Na maioria dos jogos, a física pronta da engine cobre o necessário.',
        },
        {
          id: "mecanicas.ia",
          title: "IA de inimigos",
          description:
            "Dar comportamento a inimigos e personagens não jogáveis.",
          content:
            'Inimigos e personagens não jogáveis (NPCs) precisam de comportamento, e isso é a **inteligência artificial** dos jogos. Atenção a uma expectativa: aqui IA não significa redes neurais nem aprendizado de máquina. É lógica programada que faz os personagens parecerem inteligentes, geralmente mais simples do que se imagina, e o objetivo não é ser "esperto", é ser **divertido** de enfrentar.\n\nA técnica mais comum e didática é a **máquina de estados**: o inimigo está sempre num estado (patrulhando, perseguindo, atacando, fugindo) e troca de estado conforme condições. Por exemplo: patrulha um trecho; se o jogador chega perto, muda pra perseguir; se fica ao alcance, muda pra atacar; se perde o jogador de vista, volta a patrulhar. Esse modelo simples já produz inimigos que parecem ter intenção, e cobre a maioria dos jogos de iniciante.\n\nOutros recursos comuns: a **detecção** (como o inimigo percebe o jogador, por distância ou por linha de visão) e o **pathfinding** (encontrar caminho até um alvo desviando de obstáculos), que as engines costumam oferecer pronto através de ferramentas de navegação.\n\nUm princípio de design importante: a melhor IA de jogo não é a mais difícil de vencer, é a que cria a experiência certa. Um inimigo perfeito que nunca erra é frustrante, não divertido. Bons jogos dão ao inimigo falhas propositais (um tempo de reação, uma brecha pra explorar) pra que enfrentá-lo seja um desafio justo e prazeroso. Pra começar, uma máquina de estados simples com comportamentos claros vai te levar longe, e refinar a sensação vem com os testes.',
        },
      ],
    },
    {
      id: "conteudo",
      title: "Conteúdo e sistemas",
      description:
        "Dar forma e permanência ao jogo: arte, som, interface e salvamento de progresso.",
      level: "intermediario",
      children: [
        {
          id: "conteudo.assets",
          title: "Assets: arte, som e sprites",
          description:
            "Os recursos visuais e sonoros que dão vida ao jogo e como integrá-los.",
          content:
            "Um jogo não é só código; é também **assets**: os recursos visuais e sonoros que dão vida a ele. Imagens 2D (chamadas **sprites**), modelos 3D, texturas, animações, músicas e efeitos sonoros. Como programador, você não precisa ser artista, mas precisa saber **integrar** esses assets na engine e fazê-los funcionar.\n\nUma boa notícia pra quem está começando e não desenha nem compõe: existem muitos assets **gratuitos** disponíveis pra estudo e prototipagem, em bibliotecas e sites especializados. Você pode focar na programação usando arte de terceiros (sempre respeitando a licença de uso de cada um), e substituí-la depois. Não deixe a falta de habilidade artística travar seu aprendizado de programação.\n\nNa prática, você importa os assets pra engine e os associa aos objetos: um sprite vira a aparência de um personagem 2D, um modelo 3D vira a forma de um objeto, um som é disparado quando algo acontece. As **animações** merecem atenção, porque dão vida ao jogo (o personagem que anda, ataca, pula), e as engines têm sistemas próprios pra controlar quando cada animação toca.\n\nDuas questões técnicas aparecem cedo. Os assets costumam ser arquivos **grandes** (imagens, áudio, modelos), o que traz um cuidado de versionamento: por isso a área usa o **Git LFS**, uma extensão do Git feita pra lidar bem com arquivos binários grandes, evitando que o repositório fique pesado demais. E há a **otimização**: assets pesados demais prejudicam a performance, então tamanho e formato importam, especialmente em jogos mobile.\n\nComece simples, com assets prontos e gratuitos, e foque em fazer o jogo funcionar. Polir o visual vem depois.",
          resources: [
            {
              label: "Git LFS (para versionar assets grandes)",
              url: "https://git-lfs.com/",
              kind: "doc",
            },
            {
              label: "Blender: manual (ferramenta de assets 3D)",
              url: "https://docs.blender.org/manual/en/latest/",
              kind: "doc",
            },
          ],
        },
        {
          id: "conteudo.uisave",
          title: "Interface e salvar progresso",
          description:
            "Menus, placares e a capacidade do jogo lembrar onde o jogador parou.",
          content:
            "Além da ação principal, um jogo completo precisa de duas coisas que iniciantes costumam deixar pro fim e subestimam: a interface e o salvamento.\n\nA **interface** (UI) é tudo que comunica informação ao jogador sem ser o mundo do jogo em si: o menu principal, a tela de pausa, a barra de vida, o placar de pontos, a contagem de munição, as telas de vitória e derrota. As engines têm sistemas próprios pra montar UI, posicionando textos, imagens e botões na tela. Um cuidado importante é que a UI precisa se adaptar a **tamanhos de tela diferentes**, especialmente em mobile, pra não ficar cortada ou minúscula em alguns aparelhos.\n\nO **salvamento de progresso** (save/load) é o que faz o jogo lembrar onde o jogador parou: a fase alcançada, a pontuação máxima, os itens conquistados, as configurações. Sem isso, tudo se perde ao fechar o jogo, o que é aceitável num protótipo, mas não num jogo de verdade. O conceito é **persistir** dados: gravar as informações importantes em arquivo no dispositivo e lê-las de volta quando o jogo abre. As engines oferecem mecanismos pra isso, do mais simples (guardar alguns valores, como o recorde) ao mais completo (salvar o estado inteiro de uma partida).\n\nUm sistema de inventário com save/load completo é, inclusive, um ótimo projeto de estudo, porque junta lógica de dados, interface e persistência num só desafio. Tratar UI e salvamento com cuidado é o que transforma um protótipo jogável num jogo que as pessoas levam a sério, então não deixe essas peças pra última hora.",
        },
      ],
    },
    {
      id: "design",
      title: "Game design e prática",
      description:
        "O que torna um jogo divertido, e a forma mais rápida de aprender de verdade.",
      level: "avancado",
      children: [
        {
          id: "design.fundamentos",
          title: "Fundamentos de game design",
          description:
            "Programar o jogo é metade; fazê-lo divertido é a outra.",
          content:
            'Saber programar um jogo é diferente de saber fazer um jogo **bom**. O **game design** é a disciplina de tornar um jogo divertido, justo e envolvente, e mesmo como programador vale entender seus fundamentos, porque suas decisões de código afetam a experiência o tempo todo.\n\nAlgumas ideias centrais. A **diversão** costuma vir de mecânicas claras combinadas de formas interessantes, não de complexidade. Jogos clássicos provam que regras simples geram experiências profundas. O **balanceamento** (a dificuldade) é delicado: difícil demais frustra, fácil demais entedia; o ponto certo, que desafia sem punir injustamente, exige muito teste e ajuste. A **curva de aprendizado** importa: um bom jogo ensina o jogador aos poucos, introduzindo mecânicas de forma gradual, em vez de jogar tudo de uma vez.\n\nUm conceito poderoso é o **feedback**: o jogo precisa responder às ações do jogador de forma clara e satisfatória. Quando você acerta um inimigo, algo deve comunicar isso (um som, um efeito visual, uma vibração). Esse retorno imediato é boa parte do que faz um jogo "sentir" bem, e é território onde programação e design se encontram.\n\nA lição mais prática de todas: a diversão se descobre **testando**, não planejando. Ideias que pareciam ótimas no papel se mostram chatas ao jogar, e acasos viram a melhor parte do jogo. Por isso desenvolvedores colocam algo jogável na mão de outras pessoas o quanto antes e observam: onde travam, onde se divertem, onde desistem. Você não precisa ser um game designer completo, mas pensar na experiência do jogador, e não só em fazer o código funcionar, é o que diferencia quem faz jogos de quem só programa.',
        },
        {
          id: "design.jams",
          title: "Game jams",
          description:
            "A forma mais rápida de aprender, terminar projetos e fazer networking.",
          content:
            'Se há uma única recomendação que quase todo desenvolvedor de jogos faz pra quem está começando, é: **participe de game jams**. Uma game jam é um evento (em geral de um fim de semana) em que você cria um jogo do zero, sozinho ou em equipe, dentro de um tema e de um prazo curto. Existem jams online e gratuitas o ano todo, para todos os níveis.\n\nO valor é enorme e por vários motivos. O prazo curto te força a **terminar** algo, combatendo o maior vilão do iniciante: começar dez jogos grandiosos e não acabar nenhum. Um jogo pequeno e completo ensina muito mais que um grande pela metade, e a jam te obriga a praticar o ato de finalizar e publicar. Você aprende a **cortar escopo**, focando no essencial pra caber no tempo, uma habilidade valiosa em qualquer projeto.\n\nAlém do aprendizado técnico acelerado (você resolve em dois dias problemas reais que adiaria por meses), as jams são ótimas pra **networking**: você conhece outros desenvolvedores, forma equipes, troca conhecimento e entra numa comunidade. Em uma área de mercado mais nichado, essas conexões importam muito pra carreira.\n\nHá eventos conhecidos mundialmente, como a Global Game Jam (presencial e anual em várias cidades) e jams online recorrentes como a Ludum Dare, além de incontáveis jams temáticas em plataformas de publicação. Não espere se sentir "pronto"; o ponto da jam é justamente aprender fazendo, com imperfeição e prazo apertado. Participar de uma, mesmo que seu jogo fique simples, costuma ensinar mais que semanas de tutorial isolado.',
          resources: [
            {
              label: "Global Game Jam (site oficial)",
              url: "https://globalgamejam.org/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "carreira",
      title: "Publicar e carreira",
      description:
        "Colocar seu jogo no mundo e dar os primeiros passos rumo a uma vaga.",
      level: "avancado",
      children: [
        {
          id: "carreira.publicar",
          title: "Publicar seu jogo",
          description:
            "Levar seu jogo das suas mãos para as de outras pessoas.",
          content:
            "Um jogo só fica completo quando outras pessoas o jogam. Publicar é o marco que transforma seu projeto em algo real, e é mais acessível do que parece, especialmente pra começar.\n\nA forma mais simples e amigável pra iniciantes é a **Itch.io**, uma plataforma voltada a jogos independentes onde você pode publicar de graça, com pouca burocracia. É o lugar ideal pra colocar seus primeiros jogos no ar, receber feedback e montar uma presença, e é onde muitos jogos de game jam acabam. Comece por aí: a barreira é baixíssima e a comunidade é acolhedora.\n\nPara mobile, há as lojas de aplicativos (como a Google Play), que alcançam muita gente mas exigem uma conta de desenvolvedor paga e passam por processos de revisão, como qualquer app. Para jogos de PC voltados a um público maior, a Steam é a principal vitrine, mas tem custo e requisitos mais altos, fazendo mais sentido quando você já tem um jogo mais maduro. Comece pelo mais simples e suba conforme o projeto e a ambição crescem.\n\nIndependentemente da plataforma, alguns cuidados se repetem: prepare uma boa página com capturas de tela, um vídeo curto mostrando o jogo, uma descrição clara, e teste bem o jogo em diferentes condições antes de publicar. A primeira impressão conta muito.\n\nPublicar tem um valor que vai além do jogo em si: cada jogo publicado é uma peça concreta de **portfólio**, prova palpável do que você sabe fazer, que vale muito mais que qualquer currículo na hora de buscar uma vaga na área.",
          resources: [
            {
              label: "Itch.io: guia para criadores (oficial)",
              url: "https://itch.io/docs/creators/getting-started",
              kind: "doc",
            },
          ],
        },
        {
          id: "carreira.projeto",
          title: "Projeto final: roguelike procedural",
          description:
            "Um roguelike com geração procedural de fases, consolidando tudo que a trilha construiu.",
          project: "roguelike-procedural",
        },
        {
          id: "carreira.entrar",
          title: "Entrar na carreira",
          description:
            "Como construir um portfólio de jogos e se posicionar para uma vaga.",
          optional: true,
          content:
            "Em desenvolvimento de jogos, o **portfólio fala mais alto que tudo**. Mais do que diplomas ou certificados, o que abre portas são os jogos que você de fato construiu e publicou, porque eles provam, de forma palpável, que você sabe levar um projeto do início ao fim.\n\nA fórmula que funciona é direta. Construa **vários jogos pequenos e completos**, em vez de um grande inacabado: comece por clássicos simples (um Pong, um Breakout, um endless runner), evolua pra um plataformer 2D com fases e inimigos, e suba a complexidade aos poucos. Cada jogo terminado ensina mais que dez começados. **Participe de game jams**, que aceleram o aprendizado e geram projetos pro portfólio. E **publique** seus jogos, ao menos na Itch.io, com páginas caprichadas. Documente tudo, de preferência também no GitHub.\n\nDuas particularidades da área pesam na estratégia. O **inglês** é especialmente importante: a maior parte da documentação, das comunidades e das vagas internacionais está em inglês, e como o mercado nacional é mais nichado, muita oportunidade boa (inclusive remota pra fora) exige o idioma. E a **comunidade** importa muito: as conexões feitas em jams, fóruns e eventos frequentemente levam a oportunidades, em uma área onde se conhecer pessoas conta.\n\nSeja realista sobre o caminho, como vimos nos fundamentos: o mercado é menor e o início costuma pagar menos que outras áreas de programação. Mas se a paixão por jogos é real, o caminho é viável e gratificante. E lembre-se de que as habilidades técnicas que você constrói aqui (programação, matemática, otimização) são valiosas e transferíveis, então mesmo que você acabe migrando pra outra área de tecnologia, o aprendizado nunca é desperdiçado.",
        },
      ],
    },
  ],
};
