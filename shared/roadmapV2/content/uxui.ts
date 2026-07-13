// TODO(Ana): revisao editorial do upgrade da fase 3c, lote 7 (folha nova de
// entrega para desenvolvimento, fecho do projeto elevado, fechos de criterio,
// conexoes nominais, blocos de texto estruturado e resources novos).
// Enquadramento de papel: uxui responde "isso funciona e e usavel?" (a
// experiencia e a interface), nao "vale a pena construir?" (isso e produto).
import type { RoadmapV2 } from "../types";

export const uxui: RoadmapV2 = {
  slug: "uxui",
  area: "uxui",
  title: "UX/UI Design do Zero",
  level: "Iniciante",
  description:
    "Da pesquisa com usuários ao protótipo de alta fidelidade no Figma, passando por interface, design system e testes. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é design de produto digital, a diferença entre UX e UI e a mentalidade de quem projeta pra pessoas.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é UX/UI Design",
          description:
            "Projetar produtos digitais que sejam ao mesmo tempo fáceis de usar e agradáveis de ver.",
          content:
            "Design de produto digital é decidir como um aplicativo ou site vai funcionar e como vai parecer, sempre a serviço de quem usa. Não é só deixar bonito; é resolver o problema da pessoa do jeito mais simples e claro possível. Um produto bem desenhado some: você usa sem pensar, sem travar, sem se perder.\n\nA sigla **UX/UI** junta dois lados do mesmo trabalho. **UX** (experiência do usuário) cuida de como o produto funciona: os fluxos, a lógica, a facilidade de chegar ao objetivo. **UI** (interface do usuário) cuida de como ele se apresenta: cores, tipografia, espaçamento, ícones, botões. Os dois andam juntos, e esta trilha cobre os dois na ordem natural do trabalho real: primeiro entender e estruturar, depois dar forma visual.\n\nUma ideia fundadora orienta tudo: o **design centrado no usuário**. A pessoa que vai usar o produto, não o gosto do designer nem o palpite do chefe, é quem dá a régua das decisões. Por isso a trilha começa por pesquisa, antes de qualquer pixel.\n\nUm conforto pra quem acha que precisa saber desenhar: design digital é muito mais sobre pensamento estruturado, empatia e clareza do que sobre talento artístico. As ferramentas e os princípios são aprendíveis, e é exatamente isso que você vai construir aqui.",
        },
        {
          id: "fundamentos.uxvsui",
          title: "UX e UI na prática",
          description:
            "Onde um termina e o outro começa, com um exemplo concreto.",
          content:
            "A diferença entre UX e UI confunde no começo, então vale fixá-la com um exemplo. Imagine o app de um banco e a tarefa de fazer um pagamento.\n\nO trabalho de **UX** é decidir o caminho: quantas telas até concluir, em que ordem aparecem as informações, onde o usuário confirma, o que acontece se o saldo for insuficiente, como o app evita que ele erre o valor. É a arquitetura da experiência, invisível mas decisiva. UX mal feito é o app que funciona mas irrita, onde você não acha o botão ou precisa de cinco toques pro que deveria levar dois.\n\nO trabalho de **UI** é dar forma a esse caminho: o tamanho e a cor do botão de confirmar, a fonte do valor, o espaçamento entre os campos, o ícone que representa a conta. É a camada que a pessoa vê e toca. UI mal feito é o app confuso visualmente, com hierarquia bagunçada e elementos que não se entendem.\n\nUma analogia ajuda: UX é a planta da casa (onde ficam os cômodos, como você circula entre eles); UI é o acabamento (as cores das paredes, os materiais, a iluminação). Uma casa linda com planta ruim é desconfortável; uma planta ótima sem acabamento é fria. Bons produtos precisam dos dois, e muitos profissionais cuidam dos dois sob o título de Product Designer.",
        },
        {
          id: "fundamentos.processo",
          title: "O processo de design",
          description:
            "As etapas que levam de um problema a uma solução testada, sem pular pro visual.",
          content:
            "Iniciantes têm um impulso compreensível: abrir a ferramenta e começar a desenhar telas bonitas. É o caminho mais curto pra retrabalho. Design profissional segue um processo, e conhecê-lo cedo evita meses de hábito errado.\n\nUm jeito difundido de pensar esse processo tem quatro movimentos. **Entender** o problema e as pessoas (pesquisa, antes de qualquer solução). **Definir** com clareza o que precisa ser resolvido, recortando o foco. **Idear e prototipar**, gerando soluções e materializando-as em wireframes e protótipos. E **testar** com usuários reais, aprendendo o que funciona e voltando pra ajustar.\n\nA palavra-chave é **iteração**. O processo não é uma linha reta que termina na primeira versão; é um ciclo. Você testa, descobre um problema, volta, ajusta e testa de novo. As melhores soluções raramente nascem prontas; elas amadurecem nessas voltas. Quem se apega à primeira ideia tende a defender o que não funciona.\n\nNote como esse processo organiza a trilha inteira: pesquisa primeiro, depois estrutura e fluxos, depois interface visual, e por fim prototipagem e teste. O visual, a parte que parece ser o design, chega no meio, apoiado em tudo que veio antes. Internalizar essa ordem é metade do aprendizado.",
        },
      ],
    },
    {
      id: "pesquisa",
      title: "Pesquisa com usuários",
      description:
        "Entender quem usa o produto antes de desenhar qualquer tela, a base do design centrado no usuário.",
      level: "iniciante",
      children: [
        {
          id: "pesquisa.metodos",
          title: "Métodos de pesquisa",
          description:
            "Como descobrir o que as pessoas realmente precisam, em vez de adivinhar.",
          content:
            'Design começa em escutar, não em desenhar. A **pesquisa com usuários** existe pra responder uma pergunta perigosa: você está resolvendo o problema certo? Sem ela, você projeta pra um usuário imaginário, que costuma ser uma versão idealizada de você mesmo, e erra o alvo com capricho.\n\nOs métodos se dividem em dois grandes tipos. A pesquisa **qualitativa** busca o porquê e o como, com poucas pessoas e muita profundidade: **entrevistas** (conversar pra entender necessidades, frustrações e contexto) e **observação** (ver a pessoa usando o produto de verdade, que quase sempre difere do que ela diz fazer). A pesquisa **quantitativa** busca o quanto, com muita gente e números: questionários e dados de uso.\n\nPra iniciante, o método mais valioso e acessível é a **entrevista**. Algumas conversas bem conduzidas com pessoas do público-alvo revelam mais que horas de suposição. A técnica central é simples e difícil ao mesmo tempo: pergunte sobre experiências reais e passadas ("me conta a última vez que você tentou fazer X"), não sobre opiniões hipotéticas ("você usaria um app que faz X?"). Gente é péssima em prever o próprio comportamento e ótima em relatar o que já viveu.\n\nO erro clássico é induzir a resposta que você quer ouvir. Boa pesquisa busca a verdade, mesmo quando ela contraria a ideia que você já adorava. Você domina este passo quando reescreve uma pergunta de opinião hipotética em uma pergunta sobre experiência real e passada.',
          resources: [
            {
              label: "Nielsen Norman Group: métodos de pesquisa de UX",
              url: "https://www.nngroup.com/articles/which-ux-research-methods/",
              kind: "artigo",
            },
          ],
        },
        {
          id: "pesquisa.persona",
          title: "Personas",
          description:
            "Resumir a pesquisa num personagem que mantém o time focado no usuário real.",
          content:
            'Depois de pesquisar, você precisa transformar o que aprendeu em algo que o time use no dia a dia. A **persona** faz isso: é um personagem fictício, mas baseado em dados reais da pesquisa, que representa um grupo típico de usuários.\n\nUma persona reúne nome, contexto, objetivos, frustrações e comportamentos de um perfil real que apareceu nas entrevistas. Não é invenção romântica; cada traço deve vir de algo que você de fato observou. Uma persona inventada do nada é pior que nenhuma, porque dá falsa sensação de fundamento.\n\nO valor é prático: ela vira uma régua compartilhada pra decidir. Quando o time discute uma feature, a pergunta deixa de ser "eu gosto disso?" e passa a ser "isso ajuda a Marina a alcançar o objetivo dela?". Isso tira a decisão do terreno do gosto pessoal e a ancora no usuário, que é justamente o princípio do design centrado em quem usa.\n\nUm cuidado honesto: persona é ferramenta, não verdade absoluta. Ela simplifica a realidade de propósito, e produtos reais atendem vários perfis. Comece com uma ou duas personas bem fundamentadas, ligadas às suas pesquisas, em vez de uma galeria de personagens detalhados sem dado por trás. Bem usada, ela mantém todo mundo desenhando pra pessoas, não pra abstrações.',
          resources: [
            {
              label: "Nielsen Norman Group: guia de personas",
              url: "https://www.nngroup.com/articles/personas-study-guide/",
              kind: "artigo",
            },
          ],
        },
        {
          id: "pesquisa.jornada",
          title: "Mapa de jornada",
          description:
            "Visualizar a experiência completa da pessoa pra achar onde ela sofre.",
          content:
            "Uma tela isolada engana: ela pode parecer ótima sozinha e fazer parte de uma experiência péssima. O **mapa de jornada** combate isso mostrando a experiência inteira, do início ao fim, pelos olhos do usuário.\n\nNa prática, é uma linha do tempo das etapas que a pessoa percorre pra atingir um objetivo. Imagine pedir comida por um app: descobrir o restaurante, escolher os pratos, montar o pedido, pagar, acompanhar a entrega, receber. Pra cada etapa, o mapa registra o que a pessoa faz, o que pensa e, principalmente, como se sente, marcando os momentos de fricção e frustração.\n\nO ganho é enxergar os **pontos de dor** que só aparecem na sequência. Talvez cada tela esteja bonita, mas o pulo entre o pagamento e o acompanhamento confunde, ou a espera sem informação gera ansiedade. Esses problemas vivem nas costuras entre etapas, invisíveis quando você olha telas separadas.\n\nO mapa também alinha o time em torno de uma visão compartilhada da experiência, em vez de cada um cuidar do seu pedaço sem ver o todo. Pra começar, não precisa de ferramenta sofisticada: liste as etapas numa linha e anote, abaixo de cada uma, a ação, o pensamento e a emoção. O simples ato de desenhar a jornada costuma revelar problemas que ninguém tinha notado.",
          resources: [
            {
              label: "Nielsen Norman Group: mapa de jornada",
              url: "https://www.nngroup.com/articles/journey-mapping-101/",
              kind: "artigo",
            },
          ],
        },
      ],
    },
    {
      id: "estrutura",
      title: "Estrutura e fluxos",
      description:
        "Organizar a informação e desenhar o esqueleto das telas antes de pensar no visual.",
      level: "intermediario",
      children: [
        {
          id: "estrutura.ia",
          title: "Arquitetura de informação",
          description:
            "Organizar o conteúdo de forma que a pessoa encontre o que procura.",
          content:
            "Antes de desenhar telas, é preciso organizar o que vai nelas. **Arquitetura de informação** é justamente isso: estruturar e rotular o conteúdo de um produto pra que as pessoas encontrem o que precisam sem esforço. É um trabalho invisível quando bem feito e enlouquecedor quando mal feito (o app onde você nunca acha a configuração que quer).\n\nDuas decisões centrais aparecem aqui. A **organização**: como agrupar o conteúdo em categorias que façam sentido pra quem usa, não pra quem construiu. Uma armadilha comum é espelhar a estrutura interna da empresa nos menus; o usuário não conhece nem liga pra como a empresa se divide. A **rotulagem**: que nomes dar a menus, seções e botões, usando as palavras do usuário, não o jargão técnico interno.\n\nUma técnica simples e poderosa pra acertar isso é o **card sorting**: você escreve os itens de conteúdo em cartões e pede pra pessoas do público-alvo agruparem do jeito que faz sentido pra elas. Os agrupamentos que surgem costumam ser bem diferentes do que o time imaginava, e revelam a estrutura natural.\n\nA meta é que a navegação pareça óbvia. Quando a pessoa encontra tudo no primeiro lugar onde procura, a arquitetura está certa. Esse esqueleto invisível sustenta os wireframes que você desenha no passo Wireframes, então vale resolvê-lo antes do visual.",
          resources: [
            {
              label: "Nielsen Norman Group: card sorting",
              url: "https://www.nngroup.com/articles/card-sorting-definition/",
              kind: "artigo",
            },
          ],
        },
        {
          id: "estrutura.fluxos",
          title: "Fluxos de usuário",
          description:
            "Mapear o caminho de telas e decisões até a pessoa concluir uma tarefa.",
          content:
            "Um **fluxo de usuário** é o caminho que a pessoa percorre pra completar uma tarefa específica, tela a tela, decisão a decisão. Enquanto o mapa de jornada olha a experiência ampla e emocional, o fluxo é mais técnico e preciso: ele desenha exatamente por onde a pessoa passa pra, digamos, criar uma conta ou finalizar uma compra.\n\nNa prática, você representa o fluxo como um diagrama de caixas e setas. Cada caixa é uma tela ou uma ação; cada seta é a transição. Os pontos mais importantes são as **decisões**, onde o caminho se divide: o usuário tem conta ou não? O pagamento foi aprovado ou recusado? O e-mail já existe no sistema? Cada bifurcação dessas precisa de um caminho desenhado, inclusive os caminhos de erro:\n\n```\ntela login -> tem conta?\n  sim -> home\n  nao -> cadastro\n  senha errada -> erro\n```\n\nÉ aqui que iniciantes mais escorregam: eles desenham só o **caminho feliz**, aquele em que tudo dá certo. Mas a vida real é cheia de senha esquecida, conexão que cai, campo preenchido errado. Um bom fluxo prevê esses desvios e define o que acontece em cada um. Boa parte da qualidade de um produto está em como ele trata o que dá errado.\n\nVocê domina este passo quando desenha um fluxo e aponta, em cada bifurcação, o que acontece quando dá errado, não só quando dá certo. Mapear o fluxo antes de desenhar telas economiza muito retrabalho: você descobre telas que faltavam e estados que não tinha pensado, no papel, antes de investir tempo no visual.",
        },
        {
          id: "estrutura.wireframe",
          title: "Wireframes",
          description:
            "O esqueleto de baixa fidelidade de cada tela, sem cor nem distração.",
          content:
            'O **wireframe** é o rascunho estrutural de uma tela: caixas, linhas e texto de marcação, sem cores, fontes definidas ou imagens reais. É de propósito feio e cinza, e essa é exatamente a sua força.\n\nO motivo de trabalhar assim é manter o foco na **estrutura**, não na aparência. No wireframe você decide o que vai em cada tela, a hierarquia (o que é mais importante e aparece primeiro), o posicionamento dos elementos e como a tela se conecta às outras do fluxo. Tudo isso sem se distrair com escolha de cor ou fonte, decisões que viriam cedo demais e atrapalhariam o pensamento.\n\nHá um ganho prático e até político nessa baixa fidelidade. Quando você mostra um wireframe cinza pra alguém, a conversa fica sobre o que importa naquela fase: "falta um botão de voltar aqui", "essa informação deveria vir antes". Se você mostrasse uma tela colorida e acabada, o feedback viraria "não gostei desse azul", desviando da estrutura. Baixa fidelidade convida a discutir as ideias certas.\n\nOutra vantagem: mudar um wireframe custa segundos, mudar um design acabado custa horas. Por isso o wireframe é o lugar barato de errar e ajustar. Comece simples, em papel ou na ferramenta, e só avance pro visual quando a estrutura das telas estiver resolvida e validada.',
          resources: [
            {
              label: "Figma: aprender design (recursos oficiais)",
              url: "https://www.figma.com/resources/learn-design/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "figma",
      title: "Figma",
      description:
        "A ferramenta padrão do mercado pra desenhar interfaces e protótipos.",
      level: "intermediario",
      children: [
        {
          id: "figma.ferramenta",
          title: "Conhecendo o Figma",
          description:
            "A ferramenta onde wireframes, telas e protótipos ganham vida.",
          content:
            "O **Figma** é hoje a ferramenta dominante de design de interfaces, e dominá-la não é opcional pra quem quer trabalhar na área. Ele roda no navegador, tem um plano gratuito generoso pra estudar e funciona em colaboração: várias pessoas podem editar o mesmo arquivo ao mesmo tempo, como num documento compartilhado.\n\nA ideia central é simples: você desenha em **frames** (cada frame costuma ser uma tela do app ou do site) dentro de uma tela infinita chamada canvas, onde várias telas convivem lado a lado. As ferramentas básicas são poucas: formas (retângulo, círculo), texto, e o painel de propriedades à direita, onde você ajusta tamanho, cor, espaçamento e alinhamento do que selecionou.\n\nDois recursos que economizam muito tempo e vale aprender logo. O **auto layout**, que faz os elementos se reorganizarem sozinhos quando você adiciona ou remove conteúdo, em vez de você reposicionar tudo na mão. E os **estilos**, que guardam cores e fontes reutilizáveis, garantindo consistência (assunto que cresce na seção de design system).\n\nNão tente aprender todos os recursos de uma vez; o Figma é vasto. Comece desenhando os wireframes da seção anterior nele, depois evolua pra telas com cor e tipografia. A fluência vem de usar, refazendo no Figma interfaces de apps que você já conhece. Os recursos oficiais de aprendizado são um ótimo ponto de partida.",
          resources: [
            {
              label: "Figma: central de ajuda (oficial)",
              url: "https://help.figma.com/hc/en-us",
              kind: "doc",
            },
            {
              label: "Figma: aprender design (recursos oficiais)",
              url: "https://www.figma.com/resources/learn-design/",
              kind: "doc",
            },
          ],
        },
        {
          id: "figma.componentes",
          title: "Componentes e reuso",
          description:
            "Criar elementos reutilizáveis pra trabalhar mais rápido e com consistência.",
          content:
            "Conforme suas telas crescem, você percebe que repete os mesmos elementos: o mesmo botão, o mesmo card, o mesmo campo de formulário, dezenas de vezes. Refazer cada um na mão é lento e gera inconsistência (botões ligeiramente diferentes espalhados pelo projeto). A solução do Figma são os **componentes**.\n\nUm componente é um elemento que você desenha uma vez e reutiliza onde quiser. Existe o **componente principal**, a fonte da verdade, e as **instâncias**, as cópias espalhadas pelas telas. A mágica está na ligação: quando você muda o componente principal (a cor do botão, o raio da borda), todas as instâncias mudam juntas, automaticamente. É o mesmo princípio de reuso que existe na programação, aplicado ao design.\n\nO ganho é duplo. **Velocidade**, porque você monta telas arrastando componentes prontos em vez de desenhar tudo de novo. E **consistência**, porque todos os botões do projeto são, literalmente, o mesmo botão, então não há como ficarem diferentes por descuido.\n\nComponentes mais avançados têm **variações** (o mesmo botão nos estados normal, pressionado e desativado) e **propriedades** que você ajusta em cada instância, como trocar o texto sem desvincular do principal. Esse é o conceito que prepara o terreno pro passo O que é um design system: um sistema de componentes é, no fundo, uma biblioteca bem organizada de elementos reutilizáveis.",
          resources: [
            {
              label: "Figma: central de ajuda (oficial)",
              url: "https://help.figma.com/hc/en-us",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "visual",
      title: "Design visual",
      description:
        "A camada de UI: cor, tipografia, layout e acessibilidade que dão forma e clareza às telas.",
      level: "intermediario",
      children: [
        {
          id: "visual.hierarquia",
          title: "Layout e hierarquia",
          description:
            "Guiar o olho da pessoa pelo que importa, com espaço, alinhamento e contraste.",
          content:
            "Antes de cor e fonte, vem a organização do espaço. **Hierarquia visual** é o que faz o olho da pessoa pousar primeiro no que importa, depois no secundário, sem que ela precise pensar. Uma tela sem hierarquia trata tudo como igualmente importante, e o resultado é cansativo e confuso.\n\nVocê cria hierarquia com poucas ferramentas. **Tamanho**: o que é mais importante é maior. **Contraste**: o que se destaca chama atenção, seja por cor ou peso. **Espaçamento**: dar respiro em volta de um elemento o valoriza, e agrupar coisas próximas comunica que elas se relacionam. **Alinhamento**: elementos alinhados parecem organizados e profissionais; desalinhamento dá sensação de descuido, mesmo que a pessoa não saiba dizer por quê.\n\nUm conceito que une tudo é o **espaço em branco** (ou espaço negativo), as áreas vazias entre os elementos. Iniciantes têm medo do vazio e tendem a lotar a tela; designers experientes sabem que o espaço é ativo, ele organiza, separa e dá foco. Tela apertada parece amadora.\n\nPra manter consistência, profissionais usam um **sistema de espaçamento**, baseado em múltiplos de um número (como 4 ou 8 pixels), em vez de valores aleatórios. Isso cria ritmo e harmonia entre as telas. Comece observando interfaces que você acha agradáveis e repare em quanta hierarquia e quanto espaço elas usam; quase sempre é mais do que parece.",
          resources: [
            {
              label: "web.dev: aprender design responsivo (Google, oficial)",
              url: "https://web.dev/learn/design",
              kind: "curso",
            },
          ],
        },
        {
          id: "visual.cor",
          title: "Cor",
          description:
            "Usar cor com intenção: hierarquia, significado e harmonia, não decoração.",
          content:
            "Cor é uma das ferramentas mais poderosas e mais mal usadas por iniciantes. O erro típico é escolher cores por gosto e espalhá-las sem critério. Em design de produto, cor tem função, não é enfeite.\n\nUm jeito sólido de pensar a paleta usa poucos papéis. Uma cor **primária**, que representa a marca e marca as ações principais (o botão de confirmar). Cores **neutras**, os cinzas e tons de fundo, que formam a maior parte da tela e dão o respiro. E cores **de apoio** ou semânticas, com significado fixo: verde pra sucesso, vermelho pra erro, amarelo pra alerta. Esses significados são quase convenções, e contrariá-los confunde.\n\nUma regra prática que salva telas: use cor com parcimônia. Uma interface onde tudo é colorido não tem destaque nenhum, porque destaque depende de contraste com o que está em volta. Reserve a cor mais forte pra ação mais importante e deixe o resto neutro; assim o olho sabe pra onde ir.\n\nDois cuidados técnicos. O **contraste** entre texto e fundo precisa ser suficiente pra leitura confortável, o que conecta cor diretamente ao passo Acessibilidade. E nunca dependa só da cor pra passar uma informação (como marcar um erro apenas de vermelho), porque parte das pessoas não distingue certas cores. Sistemas de design maduros, como o Material Design, trazem orientações detalhadas de cor que valem como referência.",
          resources: [
            {
              label: "Material Design: cor (oficial)",
              url: "https://m3.material.io/styles/color/system/overview",
              kind: "doc",
            },
          ],
        },
        {
          id: "visual.tipografia",
          title: "Tipografia",
          description:
            "Escolher e organizar fontes pra que o texto seja legível e tenha hierarquia.",
          content:
            "A maior parte de qualquer interface é texto, então tipografia não é detalhe; é estrutura. Boa tipografia some (a pessoa lê sem esforço) e a ruim atrapalha em silêncio, cansando os olhos sem que ninguém saiba apontar a causa.\n\nComece pela escolha da fonte, e aqui menos é mais: uma ou duas fontes por projeto bastam. O critério número um pra interface é **legibilidade**, especialmente em tamanhos pequenos e em tela. Fontes muito decorativas servem a um logo, não a um parágrafo. Na dúvida, uma boa fonte sem serifa (sans-serif), neutra e bem desenhada, resolve quase tudo.\n\nO que de fato cria qualidade é a **escala tipográfica**: um conjunto pequeno e fixo de tamanhos (por exemplo, título grande, subtítulo, corpo, legenda) usado de forma consistente em todo o produto. Isso gera hierarquia clara (você vê na hora o que é título e o que é corpo) e harmonia entre as telas. Tamanhos escolhidos no olho, um diferente em cada tela, geram bagunça visual.\n\nAlguns detalhes finos separam o amador do profissional: espaço entre linhas confortável (texto colado é difícil de ler), largura de linha que não se estende demais, e contraste suficiente entre o texto e o fundo. Sistemas como o Material Design definem escalas tipográficas completas que servem de referência pra você montar a sua.",
          resources: [
            {
              label: "Material Design: tipografia (oficial)",
              url: "https://m3.material.io/styles/typography/overview",
              kind: "doc",
            },
          ],
        },
        {
          id: "visual.acessibilidade",
          title: "Acessibilidade",
          description:
            "Projetar pra que todas as pessoas consigam usar, não só a maioria.",
          content:
            "**Acessibilidade** é projetar pra que pessoas com diferentes capacidades consigam usar o produto: quem enxerga pouco, quem não distingue certas cores, quem navega por teclado ou leitor de tela, quem tem limitações motoras. Não é um extra pra o fim do projeto nem caridade; é parte da definição de um bom design, e em muitos contextos é exigência legal.\n\nAlgumas decisões de acessibilidade são simples e melhoram a experiência de todo mundo. **Contraste** suficiente entre texto e fundo ajuda quem tem baixa visão e também quem usa o celular no sol. **Não depender só de cor** pra comunicar algo (somar um ícone ou texto ao vermelho de erro) cobre quem não distingue cores. **Áreas de toque** generosas nos botões ajudam quem tem dificuldade motora e também o dedo apressado de qualquer pessoa. **Texto alternativo** em imagens permite que leitores de tela descrevam o conteúdo pra quem não enxerga.\n\nExiste um conjunto de diretrizes internacionais pra isso, as **WCAG**, mantidas pelo W3C, que define critérios objetivos (como os níveis mínimos de contraste). Você não precisa decorá-las agora, mas precisa saber que existem e tê-las como referência.\n\nA mentalidade certa é incorporar acessibilidade desde o início, não remendar no fim. Decisões tomadas lá no contraste de cores e no tamanho da tipografia já são decisões de acessibilidade. Projetar pra todas as pessoas é, simplesmente, projetar melhor.",
          resources: [
            {
              label: "web.dev: aprender acessibilidade (Google, oficial)",
              url: "https://web.dev/learn/accessibility",
              kind: "curso",
            },
            {
              label: "W3C WAI: introdução à acessibilidade",
              url: "https://www.w3.org/WAI/",
              kind: "doc",
            },
          ],
        },
        {
          id: "visual.projeto",
          title: "Desenhar uma interface completa",
          description:
            "Aplicar layout, cor e tipografia numa tela real de alta fidelidade.",
          content:
            "Olhe pra trás um instante: você entrou nesta trilha sem abrir o Figma, e agora pesquisa usuários, estrutura a informação, desenha wireframes e domina os princípios de layout, cor, tipografia e acessibilidade. Este passo junta os princípios visuais numa tela de verdade, de **alta fidelidade**, pronta pra parecer um produto real.\n\nA encomenda é o painel do projeto abaixo, um **dashboard no Figma**: uma tela rica em informação, que é o tipo mais difícil e mais revelador de UI, porque obriga a organizar muita coisa com clareza. Você vai precisar de tudo junto: hierarquia (o que o olho vê primeiro), um sistema de espaçamento consistente, uma paleta com cor usada com intenção e uma escala tipográfica bem aplicada. Parta de um wireframe seu e evolua-o pro visual final, usando auto layout e componentes pra manter a consistência.\n\nO que separa este projeto de uma tela qualquer é o **acabamento**: alinhamento impecável, contraste adequado (que também é acessibilidade), e espaço em branco generoso, os detalhes que separam o amador do profissional.\n\nO critério de chegada é objetivo: um dashboard de alta fidelidade no Figma onde você consegue apontar, em cada bloco, por que ele tem aquele tamanho, aquela cor e aquele espaço, sem responder na base do gosto. É uma das peças mais fortes do portfólio, porque mostra domínio visual de forma imediata pra quem olha.",
          project: "dashboard-figma",
          resources: [
            {
              label: "Material Design: fundamentos (oficial)",
              url: "https://m3.material.io/foundations",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "designsystem",
      title: "Design system",
      description:
        "Transformar decisões soltas num sistema reutilizável que dá consistência e escala.",
      level: "avancado",
      children: [
        {
          id: "designsystem.oque",
          title: "O que é um design system",
          description:
            "Uma fonte única de verdade pra cores, tipografia e componentes de um produto.",
          content:
            "Um **design system** é o conjunto organizado de regras, estilos e componentes reutilizáveis que mantém um produto consistente. Em vez de cada tela reinventar cores, fontes e botões, todas bebem da mesma fonte. É o passo que transforma telas avulsas num produto coeso.\n\nEle costuma ter três camadas. Os **tokens**, que são as decisões mais básicas guardadas como valores nomeados: a paleta de cores, a escala de espaçamento, os tamanhos de fonte. Os **componentes**, os elementos prontos construídos a partir desses tokens: botões, campos, cards, modais, cada um com suas variações e estados. E as **diretrizes**, o texto que explica quando e como usar cada coisa, pra que o sistema seja aplicado com critério, não no chute.\n\nO valor cresce com o tamanho do projeto. Num produto grande, com muitas telas e várias pessoas trabalhando, o design system garante que tudo pareça da mesma família e acelera o trabalho (você monta telas combinando peças prontas). Sem ele, a inconsistência se acumula: vinte tons de azul, botões de dez tamanhos, telas que parecem de apps diferentes.\n\nVocê não precisa construir um design system gigante pra aprender. No Figma, comece pequeno: defina seus estilos de cor e texto e transforme seus elementos recorrentes em componentes. Isso já é um mini design system, e é exatamente o que sustenta um projeto consistente. Sistemas públicos consagrados, como o Material Design, servem de modelo do que um sistema maduro contém.",
          resources: [
            {
              label: "Material Design (sistema oficial do Google)",
              url: "https://m3.material.io/",
              kind: "doc",
            },
          ],
        },
        {
          id: "designsystem.plataformas",
          title: "Padrões de plataforma",
          description:
            "Respeitar as convenções de cada sistema operacional em vez de inventar do zero.",
          optional: true,
          content:
            "Quando você projeta pra um sistema específico, como Android ou iOS, não está numa folha em branco: cada plataforma tem suas **convenções**, e respeitá-las faz o produto parecer nativo e familiar, em vez de estranho.\n\nAs pessoas aprendem os padrões do sistema que usam todo dia: onde fica o botão de voltar, como se abre um menu, como um item de lista se comporta ao toque. Quando seu app segue esses padrões, a pessoa já sabe usá-lo sem aprender nada novo. Quando você inventa um jeito diferente só pra ser original, cria atrito: a pessoa precisa reaprender o óbvio.\n\nAs próprias donas das plataformas publicam guias detalhados. O **Material Design**, do Google, é a referência para Android e web. As **Human Interface Guidelines**, da Apple, cobrem iPhone, iPad e os demais aparelhos. Esses documentos explicam não só a aparência, mas o comportamento esperado de cada componente, e são leitura de referência pra qualquer designer de produto.\n\nÉ um tema opcional na sua base, mas importante de conhecer cedo: muito do design de produto é saber quando seguir a convenção (quase sempre) e quando vale quebrá-la (raramente, e com bom motivo). Originalidade em design não está em reinventar o botão de voltar; está em resolver o problema do usuário com clareza dentro de padrões que ele já entende.",
          resources: [
            {
              label: "Apple: Human Interface Guidelines (oficial)",
              url: "https://developer.apple.com/design/human-interface-guidelines",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "prototipo",
      title: "Protótipo, teste e portfólio",
      description:
        "A reta final: tornar o design clicável, validar com pessoas reais, entregar para o dev e mostrar o trabalho.",
      level: "avancado",
      children: [
        {
          id: "prototipo.prototipagem",
          title: "Prototipagem",
          description:
            "Ligar as telas pra simular o produto funcionando, antes de programar.",
          content:
            "Telas paradas mostram a aparência, mas não a experiência. O **protótipo** resolve isso: ele liga as telas entre si, simulando o produto funcionando, pra que alguém possa clicar e navegar como se fosse o app real, tudo antes de uma linha de código ser escrita.\n\nNo Figma, prototipar é conectar telas: você define que tocar em tal botão leva a tal tela, com tal transição. Monta-se assim o fluxo completo de uma tarefa (do início ao fim de um cadastro, por exemplo) de forma clicável. Dá pra ir além, com microinterações e animações, mas o essencial é deixar o caminho principal navegável.\n\nO protótipo serve a dois propósitos. **Comunicar**: é muito mais fácil alinhar uma ideia com o time e os desenvolvedores mostrando algo que funciona do que descrevendo em palavras ou apontando telas soltas. E **testar**: você coloca o protótipo na frente de usuários reais e observa, o que é o tema do próximo passo.\n\nUm princípio que economiza esforço: o nível de fidelidade do protótipo deve caber no objetivo. Pra testar se o fluxo faz sentido, um protótipo simples já basta; capricho visual viria cedo demais. Pra apresentar a versão final ou validar detalhes de interface, vale a alta fidelidade. Prototipar é, no fundo, a forma mais barata de descobrir problemas enquanto ainda é fácil consertá-los.",
          resources: [
            {
              label: "Figma: central de ajuda (oficial)",
              url: "https://help.figma.com/hc/en-us",
              kind: "doc",
            },
          ],
        },
        {
          id: "prototipo.heuristicas",
          title: "Heurísticas e usabilidade",
          description:
            "Princípios consagrados pra avaliar uma interface e achar problemas comuns.",
          content:
            "Antes mesmo de testar com usuários, você consegue avaliar uma interface sozinho usando princípios consagrados. Os mais conhecidos são as **10 heurísticas de usabilidade** de Jakob Nielsen, uma espécie de checklist de bom senso aplicado a interfaces, criado a partir de décadas de observação.\n\nVocê não precisa decorar as dez agora, mas vale conhecer o espírito de algumas. **Visibilidade do estado do sistema**: o produto sempre informa o que está acontecendo (um indicador de carregamento, uma confirmação após uma ação). **Correspondência com o mundo real**: usar a linguagem e os conceitos que a pessoa já conhece, não o jargão interno. **Controle e liberdade**: oferecer saídas claras, como desfazer e cancelar, pra quem errou. **Prevenção de erros**: melhor evitar que o erro aconteça do que só mostrar uma mensagem depois. **Consistência**: a mesma coisa funciona do mesmo jeito em todo o produto.\n\nA prática que aplica isso se chama **avaliação heurística**: você (ou alguns colegas) percorre a interface comparando-a com cada princípio e anota onde ela falha. É barato, rápido e pega uma boa parte dos problemas óbvios sem precisar de usuário nenhum.\n\nMas atenção a um limite honesto: heurística não substitui teste com gente real. Ela encontra os problemas que um especialista prevê; o teste revela os que ninguém imaginava. As duas técnicas se complementam, e bons designers usam ambas.",
          resources: [
            {
              label: "Nielsen Norman Group: 10 heurísticas de usabilidade",
              url: "https://www.nngroup.com/articles/ten-usability-heuristics/",
              kind: "artigo",
            },
          ],
        },
        {
          id: "prototipo.teste",
          title: "Teste de usabilidade",
          description:
            "Observar pessoas reais usando o protótipo pra descobrir o que só elas revelam.",
          content:
            'O **teste de usabilidade** é o momento da verdade: você dá uma tarefa a uma pessoa do público-alvo e observa ela tentando realizá-la no seu protótipo. É a forma mais direta de descobrir se o design funciona de verdade, e quase sempre humilha as certezas do designer.\n\nO formato básico é simples. Você define uma tarefa real ("compre o produto X"), entrega o protótipo e pede pra pessoa pensar em voz alta enquanto tenta. Seu trabalho é **observar e calar**: não ajude, não explique, não justifique. Cada hesitação, cada toque no lugar errado, cada "hã, e agora?" é ouro, porque revela um problema que você não enxergava de dentro.\n\nUma descoberta que surpreende iniciantes: você não precisa de muita gente. Poucos testes, com cerca de cinco pessoas, já revelam a maioria dos problemas mais graves de usabilidade. O valor está em testar cedo e com frequência, não em juntar uma multidão de uma vez.\n\nO erro mais comum e mais perigoso é tratar o teste como defesa do seu trabalho, induzindo a pessoa ou explicando o que ela "deveria" fazer. O objetivo não é provar que seu design é bom; é descobrir onde ele falha enquanto consertar ainda é barato. Cada problema encontrado num teste é um problema que não vai chegar ao usuário final. Encare resultados ruins como vitórias: eles são exatamente o que o teste existe pra achar.',
          resources: [
            {
              label: "Nielsen Norman Group: métodos de pesquisa de UX",
              url: "https://www.nngroup.com/articles/which-ux-research-methods/",
              kind: "artigo",
            },
          ],
        },
        {
          id: "prototipo.handoff",
          title: "Entrega para desenvolvimento",
          description:
            "Especificar a tela como um contrato pra o dev construir sem adivinhar.",
          content:
            "Um design lindo no Figma não vira produto sozinho: alguém precisa construí-lo. A **entrega para desenvolvimento** (handoff) é a ponte entre o design pronto e o código, e é onde muito trabalho bom se perde por falta de especificação clara.\n\nO desenvolvedor não adivinha o que você tinha na cabeça; ele constrói o que a tela mostra. Então a sua entrega precisa responder o que a imagem estática não diz. Os **espaçamentos** exatos entre os elementos. Os **estados** de cada componente (o botão normal, pressionado, desabilitado, carregando). O **comportamento responsivo** (o que acontece numa tela estreita e numa larga). Os **tokens** de cor e tipografia que ligam a tela ao design system. E, o mais esquecido, os **casos de borda**: como fica com um texto muito longo, com a lista vazia, com um erro de carregamento. A tela feliz é a fácil; o valor está em especificar o resto.\n\nUm checklist mínimo de handoff:\n\n```\n[ ] estados: normal, foco, erro, vazio\n[ ] espacamento e grid definidos\n[ ] responsivo: estreito e largo\n[ ] tokens de cor e texto\n[ ] texto longo e lista cheia\n```\n\nEncare a especificação como um **contrato**, não como enfeite: ela evita o retrabalho de o dev construir uma coisa e você pedir outra. E o melhor handoff começa **antes** do design estar pronto: converse com o dev cedo, porque ele sabe o que é caro de construir e o que já existe pronto, e isso muda o design.\n\nVocê domina este passo quando entrega uma tela e o dev consegue construí-la sem te perguntar nada sobre estados, espaçamento ou casos de borda.",
          resources: [
            {
              label: "Figma: central de ajuda (oficial)",
              url: "https://help.figma.com/hc/en-us",
              kind: "doc",
            },
          ],
        },
        {
          id: "prototipo.portfolio",
          title: "Portfólio",
          description:
            "Mostrar o raciocínio por trás do design, não só as telas bonitas.",
          content:
            "Em design, o **portfólio** vale mais que o currículo. É ele que abre portas, e iniciantes erram ao tratá-lo como uma galeria de telas bonitas. O que recrutadores e líderes de design realmente avaliam não é só o resultado visual; é o seu **raciocínio**.\n\nPor isso, a forma mais forte de apresentar um trabalho é o **estudo de caso**: contar a história do projeto do começo ao fim. Qual era o problema? O que você descobriu na pesquisa? Que decisões tomou e por quê? O que mudou depois dos testes? Telas finais lindas sem essa narrativa impressionam menos que um projeto modesto com pensamento claro, porque o trabalho real é resolver problemas, e é isso que a empresa quer ver que você sabe fazer.\n\nValem alguns conselhos práticos. Qualidade acima de quantidade: poucos estudos de caso bem contados superam uma enxurrada de telas soltas. Mostre o processo, incluindo wireframes e versões intermediárias, não só o resultado polido. E seja honesto sobre o que era projeto real, exercício pessoal ou redesenho de estudo; ninguém espera que um iniciante tenha só projetos de empresa.\n\nPlataformas como o **Behance** são vitrines tradicionais pra publicar esses trabalhos e ganhar visibilidade. Publique desde cedo, mesmo os projetos de estudo desta trilha: um portfólio que mostra evolução e raciocínio é, ele próprio, a prova de que você está pronto pra começar.",
          resources: [
            {
              label: "Behance (plataforma de portfólio)",
              url: "https://www.behance.net/",
              kind: "doc",
            },
          ],
        },
      ],
    },
  ],
};
