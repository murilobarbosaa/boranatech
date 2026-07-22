import type { RoadmapV2 } from "../types";

export const inteligenciaArtificial: RoadmapV2 = {
  slug: "inteligencia-artificial",
  area: "ia",
  title: "Inteligência Artificial do Zero",
  level: "Iniciante",
  description:
    "Dos fundamentos e da matemática essencial ao machine learning, deep learning e IA generativa. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é IA de verdade, como os termos se encaixam e que expectativas ter antes de mergulhar.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é inteligência artificial",
          description:
            "Sistemas que executam tarefas que pareceriam exigir inteligência humana.",
          content:
            "Inteligência artificial é o campo que constrói sistemas capazes de executar tarefas que, feitas por uma pessoa, pareceriam exigir inteligência: reconhecer um rosto, entender uma frase, recomendar um filme, dirigir um carro. É um guarda-chuva amplo, com décadas de história e várias abordagens diferentes por baixo.\n\nA abordagem que domina a IA de hoje é o **aprendizado de máquina** (machine learning): em vez de o programador escrever todas as regras na mão, o sistema **aprende** padrões a partir de exemplos. Você não programa o que é um gato; você mostra milhares de fotos de gatos e o sistema descobre sozinho os padrões que os caracterizam. Essa virada de chave, de regras escritas pra padrões aprendidos, é o que explica os avanços recentes.\n\nVale separar o que você vê no noticiário do que a área realmente é. A IA atual é **especializada**: cada sistema resolve um tipo de problema (traduzir texto, identificar fraude, gerar imagem). A ideia de uma máquina com inteligência geral, igual à humana, ainda é tema de pesquisa e especulação, não realidade de produto.\n\nEsta trilha cobre o caminho prático de quem quer trabalhar com IA: a base de programação e matemática, o machine learning clássico, as redes neurais e o deep learning, e por fim a IA generativa que está transformando o setor. É uma área difícil e fascinante; a recompensa vem de construir a base com paciência.",
        },
        {
          id: "fundamentos.historia",
          title: "A história da IA em marcos",
          description:
            "De onde a IA veio e por que ela avança em ondas, não em linha reta.",
          content:
            "A IA não nasceu ontem, e conhecer sua trajetória ajuda a entender por que ela avança em ondas, com períodos de euforia seguidos de decepção. O ponto de partida costuma ser 1950, quando **Alan Turing** propôs a pergunta 'máquinas podem pensar?' e o teste que leva seu nome. Em 1956, um encontro em Dartmouth cunhou o termo 'inteligência artificial' e deu início ao campo como disciplina.\n\nAs décadas seguintes alternaram avanços e frustrações. Promessas grandes demais, seguidas de resultados aquém, levaram a cortes de financiamento e a períodos que ficaram conhecidos como **invernos da IA**, quando o interesse e o dinheiro secaram. A área sobreviveu, mas aprendeu a lição sobre o próprio exagero.\n\nA virada moderna veio em duas ondas. Por volta de 2012, o **deep learning** provou seu valor ao vencer competições de reconhecimento de imagem com folga, puxado por mais dados e placas de vídeo potentes. E a partir de 2017, a arquitetura **transformer** abriu caminho pros grandes modelos de linguagem, culminando na era atual dos LLMs e da IA generativa que você usa hoje.\n\nO padrão se repete: cada onda entrega avanços reais e também exageros. Guardar essa perspectiva histórica te protege dos dois extremos, o ceticismo que ignora o que mudou de verdade e o deslumbramento que acha que tudo já é possível.",
        },
        {
          id: "fundamentos.camadas",
          title: "IA, machine learning e deep learning",
          description:
            "Três termos que se aninham e que muita gente usa como sinônimos por engano.",
          content:
            "Três termos aparecem o tempo todo e são tratados como sinônimos por quem está de fora, mas eles se **aninham** como bonecas russas, um dentro do outro. Entender essa hierarquia organiza a área inteira na sua cabeça.\n\nO termo mais amplo é **inteligência artificial**, que engloba qualquer técnica pra fazer máquinas executarem tarefas inteligentes, inclusive abordagens antigas baseadas em regras escritas à mão.\n\nDentro dela está o **machine learning**, o conjunto de técnicas em que o sistema aprende padrões a partir de dados em vez de seguir regras programadas. É onde mora a maior parte da IA útil de hoje, e inclui métodos clássicos como árvores de decisão e regressão.\n\nE dentro do machine learning está o **deep learning**, uma família específica baseada em **redes neurais** com muitas camadas. É a tecnologia por trás dos avanços mais chamativos dos últimos anos: reconhecimento de imagem, tradução, reconhecimento de voz e os modelos generativos. Ele brilha especialmente com dados não estruturados, como imagens, áudio e texto.\n\nA lição prática: nem todo problema pede deep learning. Para muitos casos com dados em tabela, um modelo clássico de machine learning é mais rápido, mais barato e igualmente bom. Saber escolher a ferramenta certa pro problema é mais valioso que usar sempre a mais sofisticada, e esta trilha cobre as duas, na ordem certa.",
        },
        {
          id: "fundamentos.tipos",
          title: "IA fraca, IA forte e AGI",
          description:
            "A diferença entre a IA que existe hoje e a que ainda é especulação.",
          content:
            "Um mal-entendido comum mistura a IA que existe hoje com a IA dos filmes. Separar os termos evita esperar da tecnologia o que ela não faz.\n\nA IA que temos é a **IA fraca** (ou estreita): sistemas que resolvem **uma** tarefa específica muito bem, e só ela. O modelo que reconhece rostos não sabe jogar xadrez; o que recomenda filmes não dirige carro. Todo produto de IA que você conhece, dos assistentes de chat aos filtros de spam, é IA estreita, por mais impressionante que pareça. Ela não entende o mundo; executa bem um recorte dele.\n\nA **IA forte**, ou **inteligência geral artificial** (AGI), seria um sistema com a flexibilidade da mente humana: capaz de aprender qualquer tarefa, transferir conhecimento de um domínio pra outro e raciocinar de forma ampla. Ela **não existe**, e há debate honesto sobre se, quando e como poderia existir. Tratá-la como iminente é especulação, não engenharia.\n\nOs LLMs recentes borraram um pouco essa fronteira, porque parecem gerais ao conversar sobre quase tudo. Mas continuam sendo previsores de texto muito capazes, com limites reais de raciocínio e confiabilidade, não uma mente geral. Para trabalhar na área, o que importa é a IA fraca: é ela que gera valor, resolve problemas e emprega. Deixe a AGI pro debate filosófico e foque no que dá pra construir de verdade.",
        },
        {
          id: "fundamentos.expectativas",
          title: "Expectativas realistas",
          description:
            "Separar o que a IA faz bem do hype, antes de investir meses de estudo.",
          content:
            'A IA vive cercada de exagero, e ajustar as expectativas cedo evita frustração e decisões ruins de carreira. Vale separar o que a tecnologia realmente faz do que se imagina que ela faz.\n\nO que a IA faz bem: encontrar padrões em grandes volumes de dados, automatizar tarefas repetitivas de percepção (ler, ver, ouvir) e gerar conteúdo plausível. O que ela **não** é: nem mágica, nem consciência, nem fonte de verdade. Um modelo não "entende" o mundo como uma pessoa; ele captura padrões estatísticos dos dados com que foi treinado, e por isso erra de formas que humanos não errariam, com toda a confiança.\n\nDuas verdades que pesam no dia a dia de quem trabalha na área. Primeira: o trabalho real é muito menos glamouroso que a manchete. A maior parte do esforço está em coletar, limpar e entender dados, não em inventar algoritmos novos. Segunda: IA depende inteiramente de bons dados. Dados ruins ou enviesados geram modelos ruins ou enviesados, por mais avançada que seja a técnica.\n\nHá também uma pergunta honesta de carreira. A pesquisa de ponta exige forte base matemática e costuma pedir pós-graduação. Mas existe um espaço enorme e crescente pra quem **aplica** IA: usar modelos prontos, integrá-los em produtos, ajustá-los a um problema. Esta trilha te prepara pra esse caminho aplicado, que é onde a maioria das oportunidades está.',
        },
        {
          id: "fundamentos.aplicacoes",
          title: "IA no mundo real",
          description:
            "Onde a IA já trabalha hoje, por setor, além das manchetes.",
          content:
            "Antes de mergulhar na técnica, vale ver onde a IA já gera valor, porque isso ancora o estudo em problemas reais e ajuda a escolher pra onde levar sua carreira. A tecnologia deixou o laboratório e virou infraestrutura silenciosa de muitos setores.\n\nAlguns exemplos concretos por área. Na **saúde**, modelos apoiam diagnósticos por imagem e a triagem de exames. Em **finanças**, detectam fraude em tempo real e apoiam decisões de crédito. No **varejo** e no streaming, os **sistemas de recomendação** decidem o que você vê e compra. Na **indústria**, a visão computacional inspeciona produtos e prevê falhas de máquinas antes que aconteçam. No **agronegócio**, imagens de satélite e sensores orientam plantio e colheita. E, de forma transversal, a **IA generativa** entrou em atendimento, marketing, programação e criação de conteúdo.\n\nDois padrões valem notar. Primeiro: a maioria dessas aplicações não é robô humanoide nem nada futurista; é um modelo bem escolhido resolvendo um problema específico e concreto de negócio. Segundo: o valor quase sempre vem de juntar a IA a bons dados e a um processo que a usa de verdade, não da sofisticação do algoritmo em si.\n\nAo longo desta trilha, sempre que aprender uma técnica, tente ligá-la a um uso real. Esse hábito transforma conceito abstrato em ferramenta, e é o que separa quem sabe a teoria de quem sabe aplicá-la.",
        },
        {
          id: "fundamentos.ambiente",
          title: "Python e Colab",
          description:
            "A linguagem e o ambiente onde quase toda a IA prática acontece.",
          content:
            "Quase tudo em IA é feito em **Python**. Não por acaso: as bibliotecas mais importantes da área (as de machine learning, deep learning e manipulação de dados) são escritas pra ela, e a comunidade inteira gira em torno desse ecossistema. Se você for aprender uma linguagem pra IA, é essa.\n\nPara começar sem dor de cabeça de instalação, a ferramenta ideal é o **Google Colab**: um ambiente de notebook que roda no navegador, de graça, com as principais bibliotecas de IA já disponíveis. Você abre, escreve Python e executa, sem configurar nada. Notebooks são perfeitos pra IA porque o trabalho é exploratório: você roda um pedaço, vê o resultado, ajusta e tenta de novo.\n\nO Colab tem um bônus decisivo pra deep learning: ele oferece acesso gratuito a **GPU**, um tipo de processador que acelera muito o treino de redes neurais. Treinar um modelo de imagem no processador comum pode levar horas; na GPU, minutos. Para quem está começando e não tem uma máquina potente, isso remove uma barreira real.\n\nNas primeiras seções você vai usar Python e bibliotecas leves; mais pra frente, quando chegar no deep learning, a GPU do Colab entra em cena. Comece criando um notebook, rodando algumas linhas de Python e se acostumando ao ambiente. É o terreno onde toda a parte prática desta trilha vai acontecer.",
          resources: [
            {
              label: "Google Colab",
              url: "https://colab.research.google.com/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "prerequisitos",
      title: "Pré-requisitos",
      description:
        "As bases que sustentam tudo o que vem depois: programação em Python, a matemática essencial (álgebra, cálculo e estatística) e um ambiente de trabalho reprodutível.",
      level: "iniciante",
      children: [
        {
          id: "prerequisitos.python",
          title: "Python para IA",
          description:
            "A base de programação que você usa em todo projeto, com ou sem matemática.",
          content:
            "Antes de qualquer modelo, vem a fluência em Python. Não precisa ser nível engenheiro de software, mas precisa ser sólida o bastante pra você ler e escrever código sem travar a cada linha.\n\nComece pelo essencial da linguagem: variáveis e tipos, condicionais (`if`), laços (`for`), **funções** e as estruturas de dados do dia a dia, listas e dicionários. Esse é o mesmo núcleo que qualquer trilha de programação cobre, e ele sustenta tudo.\n\nDepois, foque nas bibliotecas que são a língua franca da IA. O **NumPy** trabalha com arrays e cálculo numérico em massa, e é a fundação sobre a qual o resto se apoia. O **Pandas** manipula dados em tabelas, indispensável pra preparar dados antes de treinar. E o **Matplotlib** desenha gráficos pra você visualizar dados e resultados. Você não precisa dominar as três de uma vez, mas vai esbarrar nelas em todo projeto.\n\nUm caminho eficiente é aprender Python já com a cabeça em dados: em vez de exercícios abstratos, manipule um conjunto de dados real desde cedo. Isso fixa a linguagem e já te aproxima do trabalho de verdade. A regra de ouro é praticar escrevendo código, não só lendo: a fluência que você vai precisar nas próximas seções só vem da repetição.",
          resources: [
            {
              label: "Python: tutorial oficial (em português)",
              url: "https://docs.python.org/pt-br/3/tutorial/introduction.html",
              kind: "doc",
            },
            {
              label: "Kaggle Learn: Python",
              url: "https://www.kaggle.com/learn/python",
              kind: "curso",
            },
          ],
        },
        {
          id: "prerequisitos.algebra",
          title: "Álgebra linear na medida",
          description:
            "Vetores e matrizes: a linguagem em que dados e modelos são escritos.",
          content:
            "Álgebra linear tem fama de bicho de sete cabeças, mas a fatia que a IA usa no dia a dia é intuitiva e vale entender, mesmo sem virar especialista. Ela é, no fundo, a **linguagem em que os dados e os modelos são escritos**.\n\nDois objetos importam. Um **vetor** é uma lista de números, e é assim que um exemplo vira dado pro modelo: uma casa pode ser o vetor de área, número de quartos e preço; uma palavra pode ser um vetor que captura seu significado. Uma **matriz** é uma tabela de números, uma pilha de vetores, e é assim que um conjunto de dados inteiro (ou os pesos de uma rede neural) é representado.\n\nA operação central é a **multiplicação de matrizes**. Parece abstrata, mas é literalmente o que uma rede neural faz a cada camada: multiplica as entradas pelos pesos pra produzir a próxima etapa. Quando você entende que treinar uma rede é ajustar números dentro de matrizes, o deep learning deixa de ser mágica.\n\nVocê não precisa calcular isso na mão; o **NumPy** faz por você em uma linha. O que precisa é da imagem mental: dados são vetores, coleções de dados são matrizes, e modelos transformam uns nos outros multiplicando. Com essa noção, os termos que aparecem em Redes neurais e em Como uma rede aprende deixam de assustar. Você entende este passo quando explica, com suas palavras, por que uma imagem ou uma frase pode virar uma lista de números.",
        },
        {
          id: "prerequisitos.calculo",
          title: "Cálculo, só a intuição",
          description:
            "A ideia de derivada e gradiente, que explica como todo modelo aprende.",
          content:
            "De toda a matemática da IA, o cálculo é o que mais gente teme e o que você menos precisa dominar formalmente pra começar. Basta uma ideia, e ela é poderosa: a de **derivada**.\n\nA derivada responde a uma pergunta simples: se eu mexer um pouquinho nesta entrada, o resultado sobe ou desce, e com que intensidade? É a **inclinação** de uma curva num ponto. Pensa numa trilha na montanha: em cada passo, a derivada te diz se o chão sobe ou desce ali e o quão íngreme está.\n\nPor que isso é o coração do aprendizado de máquina? Porque treinar um modelo é procurar o ponto de **menor erro**, e a derivada aponta pra que lado ir pra reduzir esse erro. O **gradiente** é só a versão dessa ideia com muitas variáveis ao mesmo tempo: um vetor que aponta a direção de subida mais forte, então seguir o sentido oposto leva o modelo ladeira abaixo, rumo ao erro mínimo. É exatamente isso que a **descida de gradiente** faz, o mecanismo que a etapa Como uma rede aprende descreve em detalhe.\n\nA boa notícia repete a das outras bases: as bibliotecas calculam derivadas e gradientes sozinhas, automaticamente. Você não vai derivar fórmulas na mão. Precisa só da intuição: derivada é inclinação, gradiente aponta pra onde melhorar, e aprender é descer rumo ao menor erro. Com essa imagem, a seção de deep learning fica muito mais concreta.",
        },
        {
          id: "prerequisitos.matematica",
          title: "A matemática essencial",
          description:
            "O quanto de matemática você realmente precisa pra começar, sem se paralisar.",
          content:
            "Matemática assusta muita gente que quer entrar em IA, então vale uma conversa franca. Sim, IA é uma área matemática, e quanto mais fundo você for (especialmente em pesquisa), mais matemática vai precisar. Mas pra **começar** e aplicar modelos, você precisa de menos do que imagina, e dá pra aprender no caminho.\n\nTrês áreas importam mais. A **estatística** básica é a mais imediata: média, mediana, desvio padrão, distribuições, probabilidade e correlação. Ela é o que te permite entender seus dados e interpretar se um modelo é bom de verdade, sem se enganar. A **álgebra linear** aparece porque dados e modelos são representados como vetores e matrizes; entender o que são e como se multiplicam ajuda a enxergar o que acontece por dentro de uma rede neural. E noções de **cálculo**, especialmente a ideia de derivada, explicam como os modelos aprendem ajustando-se aos poucos.\n\nO erro clássico é querer dominar toda a matemática antes de tocar em código, e nunca sair do lugar. O caminho que funciona é o inverso: comece a praticar com modelos prontos, entendendo a intuição, e aprofunde a teoria conforme a curiosidade e a necessidade aparecem. Você não precisa derivar as fórmulas pra usar uma biblioteca; precisa entender o que cada conceito significa.\n\nPriorize a estatística, que dá retorno imediato; a álgebra linear e o cálculo têm passos próprios aqui na trilha, em Álgebra linear na medida e Cálculo, só a intuição, que cobrem só a intuição de que você precisa sem te prender na teoria.",
        },
        {
          id: "prerequisitos.ambiente",
          title: "Ambiente de desenvolvimento",
          description:
            "O kit de ferramentas reprodutível que todo projeto de dados usa.",
          content:
            "O Colab resolve o começo, mas todo projeto sério de IA precisa de um ambiente organizado e reprodutível. Montar isso cedo evita a dor clássica do 'na minha máquina funcionava'.\n\nA peça central é o **Jupyter Notebook**, o mesmo formato do Colab, só que rodando localmente: você mistura código, resultados, gráficos e anotações num documento só, ideal pro trabalho exploratório de dados. É onde a maior parte da experimentação em IA acontece.\n\nA seguir vêm os **ambientes virtuais**, com `venv` ou `conda`. Cada projeto tem suas próprias versões de bibliotecas, e instalar tudo junto no sistema gera conflitos rapidamente. Um ambiente virtual isola as dependências de cada projeto numa caixa separada, então um não quebra o outro. É um hábito profissional que separa quem improvisa de quem trabalha de forma sustentável.\n\nPor fim, o **Git**, o sistema de controle de versão. Ele guarda o histórico do seu código, permite voltar atrás quando algo quebra e é a base pra publicar projetos no **GitHub**, que em IA funciona como portfólio vivo. Não precisa dominar Git a fundo agora; o básico de salvar versões e enviar pro GitHub já muda seu jogo.\n\nEsses três (Jupyter local, ambientes isolados e Git) formam o kit que acompanha todo o resto da trilha. Você domina este passo quando cria um ambiente virtual limpo, roda um notebook nele e versiona o resultado no Git sem depender do Colab.",
        },
      ],
    },
    {
      id: "ml",
      title: "Machine learning",
      description:
        "O coração da IA aplicada: ensinar modelos a aprender com dados e avaliar se aprenderam mesmo.",
      level: "intermediario",
      children: [
        {
          id: "ml.fluxo",
          title: "O fluxo de um projeto de ML",
          description:
            "As etapas que todo projeto percorre, do problema ao modelo em uso.",
          content:
            "Treinar um modelo é só uma fatia de um projeto de machine learning. Conhecer o fluxo completo cedo evita a ilusão de que o trabalho é só rodar um algoritmo.\n\nTudo começa no **problema**: o que se quer prever ou decidir, traduzido numa pergunta clara. Sem isso, nenhum modelo tem rumo. Em seguida vêm os **dados**: coletá-los e, principalmente, **prepará-los**. Essa etapa de limpeza e organização costuma consumir a maior parte do tempo de um projeto real, e é a que mais decide o resultado final. Dados ruins arruinam o melhor algoritmo.\n\nDepois vem a parte que recebe os holofotes mas é proporcionalmente pequena: **treinar** um modelo nos dados e **avaliar** se ele realmente funciona em dados que nunca viu. Quase sempre você testa vários modelos e ajustes, comparando resultados, em vez de acertar de primeira.\n\nPor fim, o modelo precisa **ser usado**: integrado a um produto, a um relatório ou a uma decisão, onde gera valor de verdade. Um modelo que fica parado num notebook não serve a ninguém.\n\nNote o tema recorrente: a parte glamourosa (o algoritmo) é uma fração do trabalho; a maior parte é entender o problema e cuidar dos dados. Quem internaliza isso desde o começo constrói projetos que funcionam, em vez de colecionar modelos bonitos que não resolvem nada.",
          resources: [
            {
              label: "Google: Machine Learning Crash Course (oficial)",
              url: "https://developers.google.com/machine-learning/crash-course",
              kind: "curso",
            },
          ],
        },
        {
          id: "ml.tipos",
          title: "Tipos de aprendizado",
          description:
            "As grandes famílias de machine learning e quando cada uma se aplica.",
          content:
            "Machine learning se divide em algumas grandes famílias, e reconhecer qual o seu problema pertence orienta toda a escolha de técnica.\n\nA mais comum é o **aprendizado supervisionado**, em que você treina o modelo com exemplos que já têm a resposta certa, como um aluno estudando com gabarito. Ele se divide em duas tarefas: **classificação**, que prevê uma categoria (este email é spam ou não, esta imagem é gato ou cachorro), e **regressão**, que prevê um número (o preço de um imóvel, a demanda do próximo mês). A maioria dos projetos práticos cai aqui.\n\nNo **aprendizado não supervisionado**, os dados não têm resposta pronta, e o modelo busca estrutura sozinho. O caso típico é a **clusterização**: agrupar clientes parecidos sem saber de antemão quais grupos existem. É útil pra explorar dados e descobrir padrões que ninguém tinha definido.\n\nExiste ainda o **aprendizado por reforço**, em que um agente aprende por tentativa e erro, recebendo recompensas por boas decisões. É a abordagem por trás de IAs que jogam e de parte da robótica. É mais avançado e nichado, então fica pra depois.\n\nPara começar, concentre-se no supervisionado, que é o mais direto, o mais usado e o que melhor ensina os conceitos fundamentais de treino e avaliação que valem pra todas as famílias.",
          resources: [
            {
              label: "Kaggle Learn: Intro to Machine Learning",
              url: "https://www.kaggle.com/learn/intro-to-machine-learning",
              kind: "curso",
            },
          ],
        },
        {
          id: "ml.regressao",
          title: "Regressão linear e logística",
          description:
            "Os dois modelos base que resolvem uma enormidade de problemas reais.",
          content:
            "Todo mundo começa o machine learning supervisionado por dois modelos, e não é à toa: eles são simples, rápidos, fáceis de interpretar e resolvem uma quantidade enorme de problemas reais. Entender bem os dois vale mais que colecionar algoritmos sofisticados.\n\nA **regressão linear** prevê um **número**. Ela traça a melhor reta (ou plano, com várias entradas) que relaciona as features ao valor que se quer prever: preço de um imóvel a partir de área e localização, vendas do próximo mês a partir do histórico. A grande vantagem é a transparência: dá pra ler, em cada feature, o quanto ela empurra a previsão pra cima ou pra baixo.\n\nApesar do nome parecido, a **regressão logística** faz o oposto: prevê uma **categoria**, não um número. Ela é o modelo base de **classificação**, e em vez de um valor devolve uma probabilidade (a chance de o email ser spam, de o cliente cancelar, de a transação ser fraude), que você converte em sim ou não por um limite. É o cavalo de batalha de incontáveis sistemas de classificação em produção.\n\nComeçar por esses dois tem um motivo pedagógico forte: como são interpretáveis, você entende **por que** o modelo decidiu o que decidiu, o que fica impossível em modelos mais complexos. Antes de partir pra árvores e ensembles, garanta que monta, treina e lê uma regressão linear e uma logística no scikit-learn. Essa base torna todo o resto mais fácil de encaixar.",
        },
        {
          id: "ml.arvores",
          title: "Árvores de decisão e ensembles",
          description:
            "De regras em cascata aos modelos que vencem a maioria dos problemas em tabela.",
          content:
            "Depois da regressão, a família mais útil do machine learning clássico são as **árvores de decisão** e o que se constrói a partir delas. Uma árvore de decisão faz previsões com uma sequência de perguntas de sim ou não sobre os dados (renda maior que X? idade menor que Y?), como um fluxograma que você poderia desenhar. A vantagem é ser fácil de visualizar e explicar.\n\nO problema é que uma árvore sozinha tende a **decorar** os dados de treino e generaliza mal. A solução foi engenhosa: em vez de uma árvore, use **muitas** e combine as previsões. Isso é um **ensemble**, e dois se destacam.\n\nO **Random Forest** treina centenas de árvores um pouco diferentes e faz uma votação entre elas; o erro de uma se cancela com o de outra, e o resultado é robusto e difícil de errar feio. O **Gradient Boosting**, na forma de bibliotecas como o **XGBoost**, constrói árvores em sequência, cada uma corrigindo os erros da anterior, e costuma entregar a melhor precisão possível em dados de tabela.\n\nUm fato que orienta a prática: pra dados **estruturados** (tabelas com colunas), esses ensembles de árvores frequentemente **vencem o deep learning**, com menos dados e menos esforço. É por isso que dominam competições do Kaggle e sistemas reais de negócio. Domine o Random Forest e um método de boosting no scikit-learn, e você terá a ferramenta que resolve a maior fatia dos problemas de IA aplicada do dia a dia.",
          resources: [
            {
              label: "scikit-learn: métodos de ensemble (guia oficial)",
              url: "https://scikit-learn.org/stable/modules/ensemble.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "ml.instancia",
          title: "KNN e SVM",
          description:
            "Dois clássicos que classificam por proximidade e por fronteira.",
          content:
            "Além de regressões e árvores, dois outros modelos clássicos aparecem sempre e trazem ideias que vale carregar: o KNN e o SVM. Eles atacam a classificação por ângulos diferentes e complementam seu repertório.\n\nO **KNN** (k vizinhos mais próximos) é o mais intuitivo de todos: pra classificar um novo exemplo, ele olha os **k** exemplos mais parecidos que já conhece e vai no que a maioria deles é. Se os vizinhos mais próximos de um cliente são todos inadimplentes, ele provavelmente também é. É simples, não exige treino elaborado e ensina bem a noção de **similaridade** entre dados, mas fica lento e impreciso quando os dados têm muitas dimensões.\n\nO **SVM** (máquina de vetores de suporte) pensa diferente: ele busca a **fronteira** que melhor separa as classes, deixando a maior margem possível entre elas. Foi um dos modelos mais poderosos antes da era do deep learning e ainda brilha em problemas com poucos dados e muitas features, como certos casos de texto. Sua ideia de encontrar a melhor separação é elegante e influente.\n\nNa prática, você raramente vai escolher esses dois por padrão (árvores e ensembles costumam render mais em tabelas), mas os conceitos por trás deles, proximidade e margem de separação, são fundamentais e reaparecem em técnicas mais avançadas. No scikit-learn, ambos seguem o mesmo ciclo de `.fit()` e `.predict()` que você já conhece, então experimentá-los custa pouco e amplia sua intuição sobre como diferentes modelos enxergam os mesmos dados.",
        },
        {
          id: "ml.clustering",
          title: "K-means e clusterização",
          description:
            "Encontrar grupos nos dados quando ninguém disse quais grupos existem.",
          content:
            "Até aqui os modelos aprenderam com respostas prontas. A clusterização vira a chave: é o carro-chefe do **aprendizado não supervisionado**, onde os dados **não têm rótulo** e o modelo precisa achar estrutura sozinho.\n\nO problema típico é **segmentação**: você tem milhares de clientes e quer descobrir grupos naturais entre eles (quem compra muito e raramente, quem compra pouco e sempre) sem definir os grupos de antemão. O modelo agrupa quem se parece, e cada grupo é um **cluster**.\n\nO algoritmo mais conhecido é o **K-means**. Você diz quantos grupos quer (o **k**), e ele posiciona centros e vai puxando cada ponto pro centro mais próximo, ajustando os centros até estabilizar. O resultado são k grupos de exemplos parecidos entre si. É rápido, simples e o ponto de partida padrão pra clusterização.\n\nDuas dificuldades honestas acompanham o método. Escolher o **k** certo nem sempre é óbvio, e existem técnicas pra ajudar a decidir. E, como não há gabarito, **avaliar** um agrupamento é mais subjetivo que numa tarefa supervisionada: muitas vezes o teste real é o grupo fazer sentido pro negócio.\n\nA clusterização é ótima pra **explorar** dados que você ainda não entende e pra gerar hipóteses, e combina com a redução de dimensionalidade que vem a seguir. Você domina este passo quando pega um conjunto de dados sem rótulo, roda um K-means e consegue interpretar o que cada grupo encontrado representa no mundo real.",
          resources: [
            {
              label: "scikit-learn: clustering (guia oficial)",
              url: "https://scikit-learn.org/stable/modules/clustering.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "ml.dimensionalidade",
          title: "Redução de dimensionalidade e PCA",
          description:
            "Comprimir muitas variáveis em poucas, sem perder o essencial.",
          content:
            "Dados reais costumam ter **muitas** colunas: dezenas ou centenas de features por exemplo. Isso traz um problema conhecido como a maldição da dimensionalidade: quanto mais dimensões, mais os dados ficam esparsos, mais lento fica o treino e mais fácil o modelo se perder no ruído. A **redução de dimensionalidade** ataca isso.\n\nA ideia é comprimir muitas variáveis em poucas, mantendo o máximo da informação que importa. É como resumir um texto longo em poucas frases que preservam o sentido: você perde detalhe, mas ganha clareza e eficiência.\n\nA técnica clássica é o **PCA** (análise de componentes principais). Ela encontra as direções em que os dados mais **variam** e reescreve tudo em função dessas poucas direções principais, descartando as que quase não carregam informação. Você troca, por exemplo, cinquenta colunas correlacionadas por dez componentes que capturam quase toda a variação.\n\nDois usos práticos justificam aprender isso. O primeiro é **acelerar e simplificar** modelos, dando a eles menos entradas e mais limpas. O segundo é **visualização**: é impossível enxergar dados em cem dimensões, mas o PCA consegue projetá-los em duas ou três, revelando agrupamentos a olho nu, o que combina muito bem com a clusterização do passo anterior.\n\nNo scikit-learn, o PCA segue o mesmo padrão de uso dos outros modelos. Você domina este passo quando pega um conjunto de dados com muitas colunas, reduz pra duas componentes principais e plota o resultado pra enxergar a estrutura que estava escondida.",
          resources: [
            {
              label: "scikit-learn: decomposição e PCA (guia oficial)",
              url: "https://scikit-learn.org/stable/modules/decomposition.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "ml.features",
          title: "Feature engineering",
          description:
            "Preparar e criar boas variáveis, o trabalho que mais decide o resultado.",
          content:
            "Existe uma verdade pouco glamourosa no machine learning: a qualidade das suas **features** (as variáveis de entrada do modelo) costuma decidir mais o resultado que a escolha do algoritmo. **Feature engineering** é a arte de preparar e criar boas variáveis, e é onde os projetos de verdade ganham ou perdem.\n\nParte do trabalho é **limpar e converter**. Modelos só entendem números, então categorias como cidade ou tipo de produto precisam virar números de forma adequada. Valores faltantes precisam ser tratados, não ignorados. Escalas muito diferentes entre colunas (idade de 0 a 100 ao lado de renda na casa dos milhares) atrapalham vários modelos e pedem normalização.\n\nA parte mais criativa é **criar** variáveis novas a partir das que existem, usando conhecimento do problema. De uma data de nascimento você extrai a idade; de um par de datas, a duração; de um endereço, a região. Uma feature bem pensada, que capture algo que o modelo sozinho não veria, muitas vezes melhora o resultado mais do que trocar de algoritmo.\n\nO custo disso reaparece o tempo todo nesta trilha: como você viu em O fluxo de um projeto de ML, é a etapa de dados que consome a maior parte do tempo, e feature engineering é o coração dela. Vale investir aqui. Você domina este passo quando, diante de um conjunto de dados cru, consegue tratar o que está sujo e criar ao menos uma variável nova que faça o modelo enxergar melhor o problema.",
          resources: [
            {
              label: "Kaggle Learn: Feature Engineering",
              url: "https://www.kaggle.com/learn/feature-engineering",
              kind: "curso",
            },
          ],
        },
        {
          id: "ml.avaliacao",
          title: "Treino, teste e overfitting",
          description:
            "Por que separar os dados e como saber se o modelo é mesmo bom.",
          content:
            "Aqui mora o conceito que separa quem entende machine learning de quem só roda código: você **nunca** avalia um modelo nos mesmos dados em que ele aprendeu. Um aluno que decora o gabarito gabarita a prova que já viu, mas isso não prova que aprendeu. Com modelos é igual.\n\nA solução é separar os dados antes de treinar. O conjunto de **treino** ensina o modelo. O conjunto de **teste** fica guardado e só é usado no fim, pra medir o desempenho em dados que o modelo nunca viu. Esse número é o que estima como ele vai se sair na vida real.\n\nIsso revela o vilão mais comum, o **overfitting**: o modelo decora os dados de treino, vai perfeito neles e mal nos de teste. Acertar demais no treino é sinal de alerta, não de sucesso, porque significa que o modelo memorizou em vez de generalizar. O extremo oposto, o **underfitting**, é o modelo simples demais, que não aprende nem o treino.\n\nA forma de avaliar muda conforme a tarefa, e escolher a métrica certa importa tanto quanto o modelo. Em classificação, a taxa de acerto bruta engana quando as classes são desbalanceadas: num problema onde 99 por cento dos casos são de uma classe, chutar sempre a maioria acerta 99 por cento e não serve pra nada. Por isso existem métricas que olham além disso. Em regressão, mede-se o tamanho típico do erro. Entender essas medidas é o que evita comemorar um modelo que, na prática, não funciona.",
        },
        {
          id: "ml.sklearn",
          title: "Primeiros modelos com scikit-learn",
          description:
            "A biblioteca que coloca o ciclo de machine learning clássico em poucas linhas.",
          content:
            "A porta de entrada prática do machine learning é o **scikit-learn**, a biblioteca padrão pra modelos clássicos em Python. Sua maior virtude é a consistência: praticamente todo modelo segue o mesmo punhado de passos, então quando você aprende um, aprende o uso de quase todos.\n\nO ciclo é direto. Você separa os dados em treino e teste com uma função pronta. Escolhe e cria um modelo. Chama `.fit()` com as features e o alvo de treino, e é aí que o modelo aprende. Chama `.predict()` pra gerar previsões. E compara essas previsões com as respostas reais usando uma função de métrica. Esse roteiro de quatro passos se repete em quase todo projeto.\n\nComece pelos modelos mais simples e interpretáveis, como a **regressão linear** (pra prever números) e a **árvore de decisão** (que toma decisões em cascata, fáceis de visualizar). Eles são rápidos de treinar, fáceis de entender e, muitas vezes, suficientes. Saltar direto pro modelo mais complexo da moda costuma trazer mais dor de cabeça que ganho, especialmente enquanto você ainda aprende a avaliar resultados.\n\nO scikit-learn também traz as ferramentas em volta do modelo: preparação de dados, comparação entre modelos e ajuste de configurações. Por agora, domine o ciclo básico com alguns modelos simples num conjunto de dados real. É essa fluência que torna o salto pro deep learning, na próxima seção, muito mais tranquilo.",
          resources: [
            {
              label: "scikit-learn: começando (documentação oficial)",
              url: "https://scikit-learn.org/stable/getting_started.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "ml.metricas",
          title: "Métricas e validação cruzada",
          description:
            "Medir o modelo com a régua certa e confiar no número que você viu.",
          content:
            "Você já viu, em Treino, teste e overfitting, por que não se avalia um modelo nos dados de treino. Este passo fecha a conta: **com qual régua** medir, e como **confiar** no número.\n\nEm classificação, a taxa de acerto sozinha engana, especialmente com classes desbalanceadas. Por isso existem métricas mais finas. A **precisão** pergunta: dos casos que o modelo marcou como positivos, quantos eram mesmo? O **recall** pergunta o oposto: dos positivos reais, quantos o modelo pegou? Há tensão entre as duas, e o **F1** as combina num número só. Qual priorizar depende do problema: num teste de doença, perder um caso (recall baixo) é mais grave que um alarme falso; num filtro de spam, o oposto.\n\nA outra metade é a confiança no resultado. Avaliar uma vez só, num único corte de treino e teste, pode dar sorte ou azar na divisão. A **validação cruzada** resolve isso: ela reparte os dados em várias dobras e treina e testa em rodízio, usando cada parte como teste uma vez. O desempenho vira uma média de vários testes, muito mais estável e digna de confiança que uma medição única.\n\nJuntas, essas ideias separam avaliar um modelo com rigor de só olhar um número bonito. Você domina este passo quando escolhe a métrica adequada ao problema (e sabe justificar por quê) e valida o modelo com validação cruzada em vez de um único corte.",
          resources: [
            {
              label: "scikit-learn: avaliação de modelos (guia oficial)",
              url: "https://scikit-learn.org/stable/modules/model_evaluation.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "ml.regularizacao",
          title: "Combater o overfitting",
          description:
            "As técnicas práticas pra fazer o modelo generalizar, não decorar.",
          content:
            "O overfitting, que Treino, teste e overfitting apresentou, é o inimigo recorrente do machine learning: o modelo decora o treino e falha no mundo real. Este passo reúne as armas práticas pra combatê-lo, porque diagnosticar o problema é metade; saber corrigir é a outra.\n\nA arma mais poderosa e mais ignorada é **mais dados**. Quanto mais exemplos variados o modelo vê, mais difícil fica decorar e mais ele é forçado a aprender o padrão geral. Quando dá pra conseguir mais dados, quase sempre é o melhor caminho.\n\nA segunda é **simplificar o modelo**. Um modelo com liberdade demais (uma árvore funda demais, uma rede grande demais) tem capacidade de sobra pra decorar. Limitar essa capacidade, por exemplo podando a profundidade de uma árvore, força a generalização. Menos é mais quando o risco é decorar.\n\nA terceira é a **regularização** propriamente dita: uma penalidade adicionada ao treino que desencoraja o modelo a dar peso exagerado a qualquer feature. Na prática, ela empurra os pesos pra valores menores e mais equilibrados, o que produz modelos mais simples e que generalizam melhor. É um botão que a maioria dos algoritmos oferece e que vale saber ajustar.\n\nJunte isso à validação cruzada do passo anterior e você tem o ciclo completo: medir com rigor, detectar o overfitting e corrigi-lo. Você domina este passo quando, ao ver um modelo indo muito melhor no treino que no teste, sabe pelo menos três formas de reduzir essa diferença.",
        },
      ],
    },
    {
      id: "deeplearning",
      title: "Deep learning",
      description:
        "As redes neurais por trás dos avanços recentes da IA: das ferramentas de treino às arquiteturas que veem imagens, leem sequências e destravaram os LLMs.",
      level: "intermediario",
      children: [
        {
          id: "deeplearning.redes",
          title: "Redes neurais",
          description:
            "A estrutura inspirada no cérebro que aprende padrões complexos.",
          content:
            'O **deep learning** se baseia nas **redes neurais artificiais**, uma estrutura vagamente inspirada no cérebro. A unidade básica é o **neurônio**: ele recebe vários números de entrada, faz uma conta simples com eles (uma soma ponderada) e produz uma saída. Sozinho, um neurônio faz pouco.\n\nA força vem da organização em **camadas**. Os neurônios se agrupam em camadas conectadas em sequência: os dados entram pela primeira, passam por uma ou mais camadas intermediárias (as "escondidas") e saem pela última como a previsão. O "deep" (profundo) do deep learning vem justamente de ter **muitas** camadas, e é isso que permite aprender padrões muito complexos.\n\nO que cada neurônio aprende são seus **pesos**, os números que controlam quanta importância dar a cada entrada. Treinar uma rede é, no fundo, ajustar milhões desses pesos até que ela acerte. Você não define os pesos na mão; o treino faz isso a partir dos dados, e o próximo passo explica como.\n\nA grande vantagem das redes neurais aparece com dados **não estruturados**: imagens, áudio e texto, onde os modelos clássicos têm dificuldade. Por isso o deep learning domina visão computacional, reconhecimento de voz e processamento de linguagem. A desvantagem é que elas costumam exigir muitos dados e bastante poder de computação, e são mais difíceis de interpretar. Não são a resposta pra tudo: pra dados em tabela, um modelo clássico bem feito muitas vezes vence.',
          resources: [
            {
              label: "Kaggle Learn: Intro to Deep Learning",
              url: "https://www.kaggle.com/learn/intro-to-deep-learning",
              kind: "curso",
            },
          ],
        },
        {
          id: "deeplearning.treino",
          title: "Como uma rede aprende",
          description:
            "A intuição por trás do ajuste de pesos que faz o modelo melhorar.",
          content:
            'Treinar uma rede neural parece mágica, mas a ideia central é intuitiva e vale entender, mesmo sem a matemática. O processo é um ciclo de tentativa, medição de erro e correção, repetido muitas vezes.\n\nPrimeiro, a rede recebe um exemplo e produz uma previsão (no começo, praticamente um chute, porque os pesos são aleatórios). Em seguida, uma **função de perda** mede o quão longe a previsão ficou da resposta certa: um número que representa o tamanho do erro. O objetivo do treino é deixar esse erro o menor possível.\n\nAí entra a parte engenhosa. A rede calcula em que direção ajustar cada peso pra reduzir o erro um pouquinho, e dá um pequeno passo nessa direção. Esse mecanismo de "descer" rumo ao menor erro é a famosa **descida de gradiente**. Repetindo isso sobre milhares de exemplos, muitas vezes, os pesos vão se ajustando e a rede vai acertando mais.\n\nDois termos que você vai ouvir sempre: uma **época** é uma passagem completa por todos os dados de treino (em geral são necessárias várias), e a **taxa de aprendizado** controla o tamanho de cada passo (grande demais e o treino fica instável, pequena demais e fica lento).\n\nA boa notícia pra quem está aprendendo: as bibliotecas cuidam de toda essa matemática por você. Você precisa entender a **intuição** (erro medido, pesos ajustados aos poucos), não derivar as fórmulas. Com essa imagem na cabeça, o que o framework faz deixa de ser caixa-preta.',
        },
        {
          id: "deeplearning.frameworks",
          title: "PyTorch e TensorFlow",
          description:
            "As duas bibliotecas que tornam o deep learning prático e acessível.",
          content:
            "Construir uma rede neural do zero, programando toda a matemática, seria inviável no dia a dia. Por isso existem os **frameworks de deep learning**, que cuidam do trabalho pesado e deixam você focar em projetar e treinar o modelo. Dois dominam o cenário.\n\nO **PyTorch** é hoje o mais popular em pesquisa e muito usado na indústria. Tem fama de ser intuitivo e flexível, com um jeito de escrever que se parece bastante com Python comum, o que agrada quem está aprendendo. O **TensorFlow**, do Google, é o outro grande nome, forte em ambientes de produção, e costuma ser usado através do **Keras**, uma interface de alto nível que torna a construção de redes bem mais simples e amigável pra iniciantes.\n\nA boa notícia é que você não precisa escolher de forma definitiva nem aprender os dois agora. Os conceitos (camadas, função de perda, treino por épocas, avaliação) são os mesmos nos dois; muda a sintaxe. Quem aprende um migra pro outro sem grande dificuldade.\n\nUma recomendação pra começar: prefira o caminho de alto nível, seja o Keras ou as ferramentas equivalentes do PyTorch, que escondem a complexidade e deixam você treinar uma rede funcional com poucas linhas. Mergulhar no controle fino de cada detalhe vem depois, quando a base estiver firme. E lembre-se da GPU gratuita do Colab: é nesta seção que ela passa a fazer diferença real no tempo de treino.",
          resources: [
            {
              label: "PyTorch: tutoriais oficiais",
              url: "https://pytorch.org/tutorials/",
              kind: "doc",
            },
            {
              label: "Keras (documentação oficial)",
              url: "https://keras.io/",
              kind: "doc",
            },
          ],
        },
        {
          id: "deeplearning.cnn",
          title: "Redes convolucionais (CNNs)",
          description: "A arquitetura que fez o deep learning dominar imagens.",
          content:
            "Entre os tipos de rede neural, o primeiro que vale conhecer por nome é a **rede neural convolucional**, ou **CNN**. Foi ela que, por volta de 2012, fez o deep learning explodir ao vencer competições de reconhecimento de imagem, e ainda é a base da visão computacional.\n\nO problema que ela resolve é específico. Numa imagem, o que importa é o **padrão local**: uma borda, um canto, uma textura, independentemente de estarem no topo ou na base da foto. Uma rede comum, que liga tudo a tudo, ignora essa estrutura e desperdiça esforço. A CNN foi desenhada pra respeitá-la.\n\nA ideia central é a **convolução**: pequenos filtros deslizam pela imagem inteira procurando um padrão de cada vez, como uma lupa que varre a foto. As primeiras camadas detectam coisas simples (bordas, cores), e as seguintes combinam essas peças em formas e, por fim, em objetos inteiros. Essa construção em camadas, do simples ao complexo, é o que dá à CNN sua força visual.\n\nVocê não vai projetar uma CNN do zero pra começar. O caminho prático é o **transfer learning** que a etapa Visão computacional descreve: pegar uma CNN já treinada em milhões de imagens e adaptá-la ao seu problema com poucos dados. Mas entender o que a rede faz por dentro tira o mistério e te ajuda a usá-la bem. Você domina este passo quando explica, sem fórmulas, por que uma convolução é melhor que uma rede comum pra enxergar imagens.",
          resources: [
            {
              label: "Kaggle Learn: Computer Vision",
              url: "https://www.kaggle.com/learn/computer-vision",
              kind: "curso",
            },
          ],
        },
        {
          id: "deeplearning.rnn",
          title: "Redes recorrentes e LSTMs",
          description:
            "As arquiteturas feitas pra dados em sequência, onde a ordem importa.",
          content:
            "Imagens são grades fixas, mas muitos dados são **sequências**, onde a ordem carrega o significado: uma frase, uma série de vendas ao longo do tempo, o áudio de uma fala. Pra esses, a família clássica é a das **redes neurais recorrentes**, ou **RNNs**.\n\nA sacada da RNN é ter **memória**. Em vez de olhar cada entrada isolada, ela processa a sequência um item por vez e carrega um resumo do que já viu, alimentando esse contexto na próxima etapa. Ao ler uma frase palavra por palavra, ela mantém uma noção do que veio antes, que é o que permite entender que o sentido de uma palavra depende das anteriores.\n\nAs RNNs simples esbarravam num limite: esqueciam o começo de sequências longas. A solução foram as **LSTMs** (memória de longo e curto prazo), uma variante com um mecanismo interno que decide o que guardar e o que descartar, preservando informação relevante por muito mais tempo. Por anos, LSTMs foram o estado da arte em tradução, texto e voz.\n\nHoje, boa parte desse território foi conquistada pelos **transformers**, que o próximo passo apresenta e que lidam com contexto de forma ainda mais eficiente. Mesmo assim, entender a ideia de processar sequência com memória é essencial: é o problema que os transformers herdaram e resolveram melhor. Você domina este passo quando sabe explicar por que dados em sequência precisam de uma arquitetura diferente da usada em imagens, e o que a memória de uma LSTM acrescenta.",
        },
        {
          id: "deeplearning.transformers",
          title: "Transformers e attention",
          description: "A arquitetura que destravou os LLMs e a IA generativa.",
          content:
            "De todas as arquiteturas de deep learning, uma merece destaque especial porque mudou a IA recente por completo: o **transformer**, surgido em 2017. Ele é a ponte entre esta seção e a IA generativa, e entender sua ideia central ilumina tudo o que vem depois.\n\nO problema que ele resolveu foi o de **contexto** em sequências longas. As RNNs liam palavra por palavra, em ordem, e sofriam com frases longas e com o treino lento. O transformer trouxe um mecanismo chamado **attention** (atenção), que faz algo diferente: pra interpretar cada palavra, ele olha **todas** as outras da sequência ao mesmo tempo e decide, pra cada uma, quanto ela importa naquele contexto.\n\nUm exemplo torna concreto: na frase 'o banco estava cheio', a palavra 'banco' só se resolve olhando o resto. O mecanismo de atenção pesa as palavras vizinhas pra definir o sentido certo. Fazer isso pra tudo de uma vez, em vez de sequencialmente, deu dois ganhos enormes: melhor compreensão de contexto e treino muito mais paralelizável, o que permitiu modelos gigantescos.\n\nEsse é o **T** de GPT (transformer), e é a fundação técnica dos **LLMs** e da IA generativa que a próxima seção detalha. Você não precisa implementar a atenção pra usar esses modelos, mas guardar a ideia (cada elemento olha todos os outros e pesa o que importa) é o que faz os LLMs deixarem de ser caixa-preta total. Você domina este passo quando explica, em uma frase, o que a atenção faz e por que ela destravou os modelos de linguagem atuais.",
        },
      ],
    },
    {
      id: "dominios",
      title: "Domínios da IA",
      description:
        "As grandes especializações do deep learning aplicadas a problemas reais: imagens, linguagem, recomendação, áudio e séries temporais.",
      level: "avancado",
      children: [
        {
          id: "dominios.visao",
          title: "Visão computacional",
          description: "Ensinar máquinas a interpretar imagens e vídeos.",
          content:
            '**Visão computacional** é a área da IA que ensina máquinas a interpretar imagens e vídeos: identificar objetos, reconhecer rostos, ler placas, detectar defeitos numa linha de produção, apoiar diagnósticos médicos por imagem. Foi um dos primeiros campos transformados pelo deep learning.\n\nPara o computador, uma imagem é só uma grade de números (a intensidade de cor de cada pixel). O desafio é desses números brutos extrair significado, e foi aí que as redes neurais brilharam. O tipo de rede projetado pra isso é a **rede neural convolucional**, que aprende a detectar padrões visuais em etapas: primeiro bordas e texturas simples, depois formas, depois objetos inteiros, combinando o que aprendeu camada a camada.\n\nAs tarefas típicas têm nomes que vale conhecer. **Classificação de imagem** responde "o que é isto?" (a foto é de um gato). **Detecção de objetos** vai além e responde "o que está aqui e onde?", marcando cada objeto com uma caixa. E há tarefas mais finas, como separar exatamente os pixels de cada objeto.\n\nUm atalho que define a prática moderna é o **transfer learning**: em vez de treinar uma rede gigante do zero (o que exige enormes volumes de dados e computação), você parte de um modelo já treinado em milhões de imagens e o adapta ao seu problema específico com poucos dados. É assim que projetos pequenos conseguem resultados fortes, e é a forma mais sensata de um iniciante começar em visão.',
          resources: [
            {
              label: "PyTorch: tutoriais oficiais",
              url: "https://pytorch.org/tutorials/",
              kind: "doc",
            },
          ],
        },
        {
          id: "dominios.nlp",
          title: "Processamento de linguagem natural",
          description: "Fazer máquinas entenderem e gerarem linguagem humana.",
          content:
            "**Processamento de linguagem natural** (PLN, ou NLP em inglês) é a área que faz máquinas lidarem com a linguagem humana: traduzir, resumir, classificar sentimentos, responder perguntas, conversar. É o campo por trás dos assistentes de chat e dos tradutores automáticos, e o que mais avançou nos últimos anos.\n\nO desafio é que linguagem é ambígua, depende de contexto e cheia de exceções. O primeiro passo técnico é transformar texto em números que o modelo entenda, já que redes neurais só operam com números. Isso envolve quebrar o texto em pedaços (os **tokens**) e representá-los como vetores que capturam significado, de forma que palavras parecidas fiquem próximas nesse espaço numérico.\n\nA grande virada do NLP recente veio de uma arquitetura de rede neural chamada **transformer**, que lida muito bem com a ordem e o contexto das palavras numa frase longa. Foi ela que abriu caminho pros modelos de linguagem em larga escala, tema da próxima seção, e que está por trás da maioria dos sistemas de linguagem que você usa hoje.\n\nPara quem está aprendendo, o ecossistema do **Hugging Face** virou o ponto de encontro do NLP: ele reúne modelos prontos, dados e ferramentas que permitem resolver tarefas de linguagem com poucas linhas, aproveitando modelos que outras pessoas já treinaram. Começar usando esses modelos prontos é a forma mais rápida de ver NLP funcionando antes de entender cada detalhe por dentro.",
          resources: [
            {
              label: "Hugging Face: curso de NLP (oficial)",
              url: "https://huggingface.co/learn/nlp-course",
              kind: "curso",
            },
          ],
        },
        {
          id: "dominios.recomendacao",
          title: "Sistemas de recomendação",
          description: "A IA que decide o que você vê, compra e assiste.",
          content:
            "Talvez a aplicação de IA que mais afeta o seu dia sem você notar sejam os **sistemas de recomendação**: o que a loja sugere, o próximo vídeo que toca, os produtos que aparecem primeiro, o feed que você rola. Eles movem uma fatia enorme da receita de gigantes de tecnologia e varejo, o que os torna uma especialização muito valorizada.\n\nO problema é sempre o mesmo: entre milhões de itens, quais mostrar pra **esta** pessoa? Duas grandes abordagens respondem a isso. A **filtragem colaborativa** recomenda com base no comportamento de gente parecida: se pessoas com gosto semelhante ao seu gostaram de um item, provavelmente você também vai. É o padrão de quem viu isto também viu aquilo, e não precisa entender o conteúdo do item, só os padrões de quem consome.\n\nA outra é a **filtragem baseada em conteúdo**: recomendar itens parecidos com os que você já curtiu, usando características do próprio item (gênero de um filme, categoria de um produto). Na prática, os sistemas reais **combinam** as duas e ainda misturam sinais de contexto, formando modelos híbridos.\n\nHá desafios característicos que vale conhecer, como o **arranque a frio**: o que recomendar pra um usuário ou um item totalmente novo, sobre o qual não há histórico? Lidar com isso é parte do ofício. Você domina este passo quando distingue a abordagem colaborativa da baseada em conteúdo e consegue dar um exemplo real de cada uma num produto que você usa.",
        },
        {
          id: "dominios.audio",
          title: "Áudio e fala",
          description:
            "Transformar voz em texto e texto em voz, e o que mais a IA faz com som.",
          content:
            "Depois de imagem e texto, o terceiro grande tipo de dado não estruturado é o **áudio**, e a IA já faz com ele coisas que viraram cotidiano. Duas tarefas dominam a área e vale conhecer pelos nomes técnicos.\n\nA primeira é o **reconhecimento de fala**, ou **speech-to-text** (STT): transformar voz em texto. É o que faz o ditado do celular funcionar, gera legendas automáticas e transcreve reuniões. Ficou notavelmente bom nos últimos anos, a ponto de modelos abertos transcreverem vários idiomas com boa qualidade.\n\nA segunda é a **síntese de voz**, ou **text-to-speech** (TTS): o caminho inverso, transformar texto em fala com som natural. É a voz dos assistentes, dos aplicativos de acessibilidade e de audiolivros gerados por IA, hoje muito mais fluida que as vozes robóticas de antigamente.\n\nPor baixo, o áudio é tratado de um jeito que conversa com o que você já viu: o som vira uma representação visual do tempo e da frequência (uma espécie de imagem), e aí entram redes como as que atuam em visão e sequências. Ou seja, as ideias de CNNs e de modelos de sequência reaparecem aqui, aplicadas a um dado novo.\n\nComo em outros domínios, o caminho prático é usar **modelos prontos**: o ecossistema do Hugging Face traz modelos de STT e TTS que você aplica com poucas linhas. Você domina este passo quando sabe a diferença entre STT e TTS e consegue citar um uso real de cada um.",
          resources: [
            {
              label: "Hugging Face: curso de áudio (oficial)",
              url: "https://huggingface.co/learn/audio-course",
              kind: "curso",
            },
          ],
        },
        {
          id: "dominios.series",
          title: "Séries temporais",
          description:
            "Prever o futuro a partir do passado: vendas, demanda, sensores.",
          content:
            "Uma classe de problema aparece em quase todo negócio: prever o **futuro** a partir do histórico. Quantas unidades vou vender no próximo mês? Qual a demanda de energia amanhã? Esse tipo de dado, medido ao longo do tempo, é uma **série temporal**, e prevê-la é uma especialização de IA muito requisitada.\n\nO que torna séries temporais diferentes é que a **ordem e o tempo importam de verdade**, e os dados não são independentes: o valor de hoje depende do de ontem. Isso muda até a forma de avaliar, porque você não pode embaralhar os dados como fazia antes; treinar no futuro pra prever o passado não faz sentido. A separação entre treino e teste precisa respeitar a linha do tempo.\n\nAlguns padrões são o pão com manteiga da área. A **tendência** é o movimento de longo prazo (as vendas sobem ano a ano). A **sazonalidade** é o padrão que se repete em ciclos (mais sorvete no verão, mais acessos à noite). Um bom modelo de série temporal captura esses componentes pra projetar o que vem.\n\nAs abordagens vão de métodos estatísticos clássicos e dedicados a modelos de machine learning e às redes de sequência que você viu em Redes recorrentes e LSTMs, boas justamente porque a ordem importa. Você domina este passo quando reconhece uma série temporal, identifica tendência e sazonalidade nela, e entende por que não pode embaralhar os dados na hora de avaliar o modelo.",
          resources: [
            {
              label: "Kaggle Learn: Time Series",
              url: "https://www.kaggle.com/learn/time-series",
              kind: "curso",
            },
          ],
        },
      ],
    },
    {
      id: "generativa",
      title: "IA generativa",
      description:
        "Os modelos que geram texto, imagem e código, e como aproveitá-los sem treinar do zero.",
      level: "avancado",
      children: [
        {
          id: "generativa.llms",
          title: "LLMs e modelos de fundação",
          description:
            "O que são os grandes modelos de linguagem que mudaram a IA recente.",
          content:
            "A IA generativa, que cria texto, imagem, áudio e código, é a fronteira mais visível da área hoje. No centro dela estão os **LLMs** (modelos de linguagem em larga escala), as redes por trás dos assistentes de chat que escrevem, resumem e respondem perguntas.\n\nA ideia que sustenta um LLM é, na essência, simples: ele foi treinado pra **prever a próxima palavra** num texto, repetidas vezes, em volumes gigantescos de material. De tanto fazer isso, acabou capturando padrões profundos de linguagem, fatos e formas de raciocínio. Quando gera uma resposta, está, no fundo, prevendo sequências de palavras plausíveis a partir do que você escreveu.\n\nEsses LLMs são um exemplo de **modelo de fundação**: modelos enormes, treinados em dados amplos e genéricos, que servem de base pra muitas tarefas diferentes sem precisar de um modelo novo pra cada uma. É uma mudança de mentalidade em relação ao machine learning clássico, onde se treinava um modelo específico por problema.\n\nDuas limitações são essenciais de entender e nunca esquecer. LLMs **alucinam**: geram informações falsas com total confiança, porque produzem texto plausível, não verdade verificada. E o conhecimento deles está congelado nos dados de treino, com um limite de data. Por isso, em qualquer uso sério, a saída de um LLM precisa de verificação humana. Tratar a resposta de um modelo como fato é o erro mais perigoso e mais comum de quem começa a usá-los.",
        },
        {
          id: "generativa.prompts",
          title: "Engenharia de prompts",
          description:
            "A habilidade de pedir bem, que extrai o melhor de qualquer LLM.",
          content:
            "A forma mais imediata e barata de melhorar o que um LLM entrega não é trocar de modelo, é **pedir melhor**. **Engenharia de prompts** é a habilidade de escrever instruções que extraem respostas boas e confiáveis, e virou competência básica de quem trabalha com IA generativa.\n\nAlguns princípios rendem quase sempre. Seja **específico**: diga o papel que o modelo deve assumir, o formato que você quer na saída e as restrições que importam, em vez de um pedido vago. Dê **contexto**: informação relevante colada no prompt reduz chute e alucinação. E mostre **exemplos** do que você espera quando a tarefa é sutil; poucos exemplos bem escolhidos guiam o modelo melhor que qualquer explicação longa.\n\nUma técnica que vale conhecer é pedir ao modelo pra **pensar passo a passo** em problemas que exigem raciocínio. Ao explicitar as etapas antes da resposta final, ele erra menos em contas e em lógica, porque não tenta adivinhar o resultado de uma vez.\n\nDois avisos honestos. Primeiro: prompt bom **reduz**, mas não elimina, os erros e alucinações que você viu em LLMs e modelos de fundação; a validação da saída continua obrigatória. Segundo: isto é ofício empírico, se aprende testando e iterando, não decorando fórmulas. Escrever bons prompts é também o que sustenta o uso via API e o projeto final desta trilha. Você domina este passo quando pega uma resposta ruim de um modelo e a melhora de forma consistente só reescrevendo a instrução, sem trocar o modelo.",
        },
        {
          id: "generativa.huggingface",
          title: "Usar modelos prontos",
          description:
            "Aproveitar modelos que outros já treinaram, o caminho prático da IA aplicada.",
          content:
            "A notícia libertadora pra quem está começando: você não precisa treinar esses modelos gigantes (o que custaria uma fortuna em computação) pra trabalhar com eles. A IA aplicada moderna é, em boa parte, **usar modelos que outras pessoas e empresas já treinaram**.\n\nO grande hub disso é o **Hugging Face**, uma plataforma que reúne dezenas de milhares de modelos prontos, abertos, pra texto, imagem, áudio e mais. Com poucas linhas de código você baixa um modelo e o aplica a uma tarefa: classificar sentimento, resumir um texto, traduzir, transcrever áudio, gerar imagem. É a forma mais rápida de ver IA de ponta funcionando nas suas mãos.\n\nO outro caminho de uso são as **APIs**: serviços que dão acesso aos modelos mais poderosos pela internet, sem você baixar nada. Você manda um pedido, o modelo roda nos servidores do provedor e devolve a resposta. Isso permite construir produtos com IA potente sem ter infraestrutura própria, e é como a maioria das aplicações de IA generativa é feita hoje.\n\nUma habilidade que nasceu daí e vale desenvolver é escrever boas instruções pra esses modelos, dando contexto e exemplos claros pra obter respostas melhores. Pra muitos problemas, usar bem um modelo pronto resolve com qualidade e em uma fração do esforço de treinar algo do zero. Comece por aqui: é o caminho de maior retorno pra quem entra na área aplicada.",
          resources: [
            {
              label: "Hugging Face: documentação oficial",
              url: "https://huggingface.co/docs",
              kind: "doc",
            },
            {
              label: "Hugging Face: cursos (oficial)",
              url: "https://huggingface.co/learn",
              kind: "curso",
            },
          ],
        },
        {
          id: "generativa.api",
          title: "Usar um LLM via API",
          description:
            "O modelo como serviço: você chama, ele responde, e você valida o que volta.",
          content:
            "A forma mais comum de trabalhar com IA generativa hoje não é treinar modelo nenhum, é **consumir um LLM como serviço**, por uma API. Você manda um pedido pela internet, o modelo roda nos servidores do provedor, e devolve a resposta. Nada é treinado na sua chamada: o modelo já veio pronto, e cada requisição é independente, ele não aprende com o que você envia nem lembra da conversa anterior a menos que você reenvie o histórico.\n\nUma chamada típica separa dois papéis. O **prompt de sistema** define quem o modelo é e as regras que ele deve seguir (o tom, o formato, o que não fazer). O **prompt de usuário** traz a pergunta ou a tarefa daquela vez. Essa separação é o que te dá controle: o sistema fixa o comportamento, o usuário varia a cada chamada.\n\n```\nChamada a um LLM (estrutura):\n\nsystem: define o papel e os limites\nuser:   a pergunta ou tarefa da vez\ntemperature: baixa = previsível, alta = variado\n```\n\nA **temperatura** vale conhecer: baixa deixa as respostas mais previsíveis e consistentes (bom pra tarefas objetivas), alta deixa mais criativas e variadas (bom pra gerar ideias, ruim pra precisão).\n\nDois hábitos separam quem usa API com profissionalismo. O primeiro é olhar o **custo por token**: você paga por pedaço de texto que entra e sai, então prompts enormes e respostas longas custam dinheiro real, e num produto de verdade isso vira uma restrição de projeto, não um detalhe. O segundo, e mais importante: **nunca confie na saída sem validar**. Como você viu em LLMs e modelos de fundação, o modelo erra com confiança, inventa fatos e formatos, e o seu código precisa checar o que voltou antes de usar. Este é o coração da IA aplicada: você não pesquisa modelos novos, você integra um modelo pronto com bom senso e verificação. Você domina esta etapa quando monta uma chamada com prompt de sistema e de usuário, ajusta a temperatura pro tipo de tarefa, e trata a resposta como algo a validar, não como verdade.",
          resources: [
            {
              label: "OpenAI: documentação da API (referência)",
              url: "https://platform.openai.com/docs/",
              kind: "doc",
            },
          ],
        },
        {
          id: "generativa.rag",
          title: "RAG na prática",
          description:
            "Dar ao modelo os seus documentos pra ele responder com base neles.",
          content:
            "O jeito mais eficaz de fazer um LLM responder sobre **conteúdo específico** (os documentos da sua empresa, um manual, uma base de artigos) sem treinar nada chama-se **RAG**, geração aumentada por recuperação. É a técnica por trás da maioria dos assistentes úteis de hoje, e o coração do projeto final desta trilha.\n\nA ideia resolve duas limitações que você já conhece: o LLM tem conhecimento genérico, congelado no tempo, e alucina quando não sabe. O RAG contorna isso **buscando** os trechos relevantes dos seus dados e entregando-os junto com a pergunta, pra o modelo responder com base neles em vez de na memória.\n\nO fluxo tem etapas claras. Primeiro, você quebra os documentos em pedaços (o **chunking**), porque um LLM não digere um manual inteiro de uma vez. Depois, converte cada pedaço em **embeddings**, vetores que capturam o significado do texto, e os guarda num **banco vetorial** (vector store). Quando chega uma pergunta, você a transforma em vetor também, busca no banco os trechos mais próximos em significado e os injeta no prompt. O modelo então responde ancorado nesse contexto recuperado.\n\n- Chunking: dividir os documentos em pedaços\n- Embeddings: virar cada pedaço em vetor de significado\n- Vector store: guardar e buscar por similaridade\n- Montar o prompt com os trechos achados e perguntar\n\nO ganho é grande: respostas atualizadas, específicas e com fonte rastreável, o que reduz alucinação. Você domina este passo quando explica, na ordem, por que cada etapa do RAG existe e como ela ajuda o modelo a responder sobre os seus dados.",
        },
        {
          id: "generativa.adaptar",
          title: "Adaptar modelos ao seu caso",
          description:
            "Maneiras de especializar um modelo pronto sem treiná-lo do zero.",
          optional: true,
          content:
            "Modelos prontos resolvem muito, mas às vezes você precisa que eles se comportem de um jeito específico pro seu problema. Existem formas de adaptá-los, em ordem crescente de esforço, e conhecer o leque ajuda a escolher a mais barata que resolve.\n\nA mais simples é dar bom **contexto na instrução**: explicar a tarefa com clareza e incluir alguns exemplos do que você espera, ali mesmo no pedido ao modelo. Surpreende o quanto isso melhora as respostas, sem treinar nada.\n\nUm passo além, muito usado com LLMs, é conectar o modelo a uma **base de conhecimento própria**: em vez de confiar só na memória dele (que é genérica e pode estar desatualizada), você busca os trechos relevantes dos seus documentos e os entrega junto com a pergunta, pra o modelo responder com base neles. Essa técnica reduz alucinação e é a forma mais comum de fazer um assistente responder sobre conteúdo específico de uma empresa.\n\nO caminho mais pesado é o **fine-tuning**: continuar o treino de um modelo pronto com os seus próprios dados, pra especializá-lo num domínio ou estilo. Dá mais controle, mas exige dados, computação e cuidado, então costuma valer a pena só quando as opções mais simples não bastam.\n\nA regra prática que economiza tempo e dinheiro: comece sempre pela alternativa mais leve. Boa instrução resolve muito; base de conhecimento resolve a maioria do resto; fine-tuning fica pro que sobrar. Pular direto pro mais complexo é o erro caro de quem está aprendendo.",
          resources: [
            {
              label: "Hugging Face: curso de NLP (oficial)",
              url: "https://huggingface.co/learn/nlp-course",
              kind: "curso",
            },
          ],
        },
        {
          id: "generativa.agentes",
          title: "Agentes e function calling",
          description:
            "Quando o LLM deixa de só responder e passa a agir com ferramentas.",
          content:
            "Até aqui o LLM só **respondia** texto. O passo seguinte da IA generativa é deixá-lo **agir**: usar ferramentas, consultar sistemas e executar tarefas de vários passos. É a ideia dos **agentes de IA**, uma das fronteiras mais quentes da área.\n\nO mecanismo que torna isso possível é o **function calling** (ou uso de ferramentas). Em vez de só devolver texto, o modelo pode indicar que quer **chamar uma função** que você disponibilizou: buscar o clima, consultar um banco de dados, fazer uma conta, pesquisar na web. O seu código executa a função de verdade e devolve o resultado ao modelo, que segue o raciocínio com essa informação nova em mãos. Assim o LLM supera duas fraquezas suas, contas e fatos atualizados, delegando-as a ferramentas confiáveis.\n\nUm **agente** leva isso adiante: ele recebe um objetivo, decide sozinho quais ferramentas usar e em que ordem, executa, observa o resultado e continua até concluir a tarefa, num laço de pensar e agir. É o que permite assistentes que não só respondem, mas realizam.\n\nDois pés no chão importam. Agentes são poderosos e ainda **frágeis**: erram, entram em laços, gastam muitos tokens, e por isso pedem limites e supervisão. E toda a desconfiança que você aprendeu com LLMs vale em dobro quando o modelo pode **executar ações**, não só falar. Você domina este passo quando entende como o function calling conecta o modelo ao mundo e por que dar ferramentas a um LLM exige mais cuidado, não menos.",
        },
        {
          id: "generativa.multimodal",
          title: "Modelos multimodais",
          description:
            "Uma IA só que entende texto, imagem e áudio ao mesmo tempo.",
          content:
            "Por muito tempo, cada tipo de dado tinha seu modelo: um pra texto, outro pra imagem, outro pra áudio. A fronteira atual da IA generativa junta tudo num só: os **modelos multimodais**, que entendem e combinam **várias modalidades** ao mesmo tempo.\n\nNa prática, são os modelos pra quem você manda uma **foto e uma pergunta** e recebe uma resposta em texto sobre a imagem; que descrevem uma cena, leem um gráfico, transcrevem um documento fotografado ou geram uma imagem a partir de uma frase. A mesma ideia de representar dados como vetores de significado, que você viu em texto e áudio, permite colocar imagem, som e palavra num espaço comum onde o modelo relaciona uns aos outros.\n\nIsso destrava aplicações que antes exigiam juntar vários sistemas na mão: acessibilidade que descreve o mundo pra quem não enxerga, busca por imagem em linguagem natural, análise de documentos que misturam texto e figura, assistentes que veem a sua tela. É uma das direções que mais cresce, e boa parte dos grandes modelos atuais já nasce multimodal.\n\nPara quem aplica IA, o caminho é o de sempre nesta seção: usar esses modelos por **API** ou pelos modelos prontos do Hugging Face, com a mesma disciplina de validar a saída. A novidade é o leque de problemas que passam a caber num modelo só. Você domina este passo quando imagina um produto útil que só é possível porque um modelo entende imagem e texto juntos, e sabe por onde começaria a construí-lo.",
        },
      ],
    },
    {
      id: "pratica",
      title: "Prática e responsabilidade",
      description:
        "Levar o aprendizado ao mundo real: praticar, colocar modelos em produção, agir com responsabilidade e construir uma carreira em IA.",
      level: "avancado",
      children: [
        {
          id: "pratica.kaggle",
          title: "Praticar no Kaggle",
          description:
            "A plataforma onde teoria vira prática com dados e problemas reais.",
          content:
            "Teoria de IA só assenta com prática, e a melhor plataforma pra isso é o **Kaggle**. Ela reúne três coisas valiosas num lugar só: milhares de conjuntos de dados gratuitos sobre quase qualquer assunto, um ambiente de notebook pronto pra rodar (parecido com o Colab) e **competições** onde você resolve problemas reais e compara seu resultado com o de outras pessoas.\n\nPara quem está aprendendo, o caminho recomendado tem etapas. Comece pelos cursos curtos e práticos do **Kaggle Learn**, que cobrem desde Python até deep learning de forma direta e aplicada. Depois, pegue um conjunto de dados que te interesse e faça uma análise ou um modelo do começo ao fim, sozinho. Por fim, quando ganhar confiança, entre numa competição voltada pra iniciantes; o objetivo não é vencer, é aprender vendo como outras pessoas abordam o mesmo problema.\n\nUm valor menos óbvio do Kaggle são as **soluções compartilhadas**: depois das competições, muita gente publica como resolveu, e ler esses notebooks ensina mais que horas de teoria abstrata, porque mostra raciocínio aplicado a dados de verdade.\n\nE há o lado portfólio: notebooks públicos bem feitos no Kaggle, assim como projetos no GitHub, são prova concreta da sua capacidade pra quem for te contratar. Em IA, mostrar projetos reais pesa tanto quanto saber a teoria. Praticar de forma consistente, com problemas que te motivam, é o que de fato transforma estudo em habilidade.",
          resources: [
            {
              label: "Kaggle Learn (catálogo de cursos)",
              url: "https://www.kaggle.com/learn",
              kind: "curso",
            },
          ],
        },
        {
          id: "pratica.mlops",
          title: "MLOps: modelo em produção",
          description:
            "O que é preciso pra um modelo viver de forma confiável fora do notebook.",
          content:
            "Um modelo que funciona no notebook e um modelo que serve usuários de verdade são coisas diferentes. **MLOps** é o conjunto de práticas que leva o modelo do experimento à produção e o mantém funcionando de forma confiável. É onde IA encontra a engenharia, e uma das especializações mais requisitadas do mercado.\n\nAlguns pilares valem conhecer. O **versionamento** vai além do código: em IA você precisa rastrear também qual **dado** e qual **modelo** geraram cada resultado, pra conseguir reproduzir e voltar atrás. O **deploy** é disponibilizar o modelo pra ser consumido, em geral atrás de uma API, com a mesma preparação de dados que existia no treino, senão ele recebe entradas diferentes das que aprendeu.\n\nO ponto mais característico é o **monitoramento**. Diferente de um software comum, um modelo pode **degradar sozinho** com o tempo, sem nenhum bug: o mundo muda, os dados de entrada deixam de se parecer com os de treino, e a qualidade cai. Esse fenômeno é o **drift**, e detectá-lo cedo, acompanhando as previsões e os dados que chegam, é o que evita um modelo silenciosamente errado em produção. Quando o drift aparece, a resposta costuma ser retreinar com dados atuais.\n\nVocê não precisa dominar ferramentas de MLOps agora, mas guardar a mentalidade muda seu jogo: colocar um modelo no ar é o **começo** do trabalho, não o fim. Você domina este passo quando entende por que um modelo em produção precisa ser monitorado e o que é o drift.",
        },
        {
          id: "pratica.custos",
          title: "Custos, latência e otimização",
          description:
            "Escolher o modelo certo pelo equilíbrio entre qualidade, preço e velocidade.",
          content:
            "Fora do estudo, IA custa dinheiro e tempo, e ignorar isso é o que separa um protótipo bonito de um produto que se sustenta. Saber equilibrar qualidade, **custo** e **velocidade** é parte do ofício de quem aplica IA de verdade.\n\nA primeira decisão é a **escolha do modelo**. Em IA generativa, o modelo maior e melhor também é o mais caro e o mais lento. Muitas vezes um modelo menor resolve a tarefa com qualidade suficiente por uma fração do custo. A pergunta certa não é qual o modelo mais poderoso, e sim qual o menor modelo que resolve **este** problema bem o bastante.\n\nA **latência** (o tempo até a resposta) importa tanto quanto o custo em produtos interativos: ninguém espera dez segundos por uma resposta de chat. Modelos menores respondem mais rápido, o que é mais um motivo pra não usar o maior por padrão.\n\nDo lado técnico, uma ideia vale citar: a **quantização** comprime um modelo usando números de menor precisão, deixando-o mais leve e rápido com perda pequena de qualidade. É uma das formas de rodar modelos potentes em hardware modesto e de baratear a operação.\n\nO fio condutor é o mesmo do custo por token que você viu em Usar um LLM via API: em produção, cada decisão de modelo tem preço, e engenharia de IA é também engenharia de compromissos. Você domina este passo quando, diante de uma tarefa, justifica a escolha de um modelo pelo equilíbrio entre qualidade, custo e latência, não só pela potência.",
        },
        {
          id: "pratica.etica",
          title: "Limitações, viés e ética",
          description:
            "Os riscos reais da tecnologia que todo profissional precisa levar a sério.",
          content:
            "Trabalhar com IA traz responsabilidade, e ignorar isso não é neutro: causa dano real a pessoas. Alguns temas precisam estar no radar de quem constrói esses sistemas, não como filosofia, mas como parte do ofício.\n\nO mais central é o **viés**. Modelos aprendem dos dados, e dados refletem o mundo como ele é, com todas as suas desigualdades. Um modelo treinado em decisões historicamente enviesadas aprende e **amplia** esse viés, podendo discriminar por gênero, raça ou origem em coisas sérias como crédito, contratação e justiça. O modelo não é objetivo só por ser matemático; ele é tão justo quanto os dados e as escolhas de quem o construiu.\n\nOutros pontos importam tanto quanto. A **privacidade**: modelos treinam com dados de pessoas, que precisam ser tratados com cuidado e respeito à lei. A **transparência**: muitos modelos são caixas-pretas difíceis de explicar, o que é grave quando a decisão afeta a vida de alguém que merece saber o porquê. E, na IA generativa, a **desinformação** e as **alucinações**, já que esses sistemas geram com facilidade conteúdo falso e convincente, que vira risco real quando a saída sem verificação vira decisão.\n\nHá ainda a dimensão **legal**, que deixou de ser opcional. No Brasil, a **LGPD** rege como dados pessoais podem ser coletados e usados, e alcança diretamente quem treina modelos com dados de pessoas. Na Europa, o **AI Act** passou a impor obrigações conforme o risco de cada aplicação e virou referência global. Conhecer esse terreno faz parte do trabalho de quem constrói IA, não é assunto só do jurídico.\n\nA postura profissional não é paralisar diante dos riscos, é levá-los a sério: questionar a qualidade e a representatividade dos dados, testar o modelo em diferentes grupos, e manter pessoas no controle das decisões que importam. Quem entra na área agora vai construir ferramentas com impacto real na vida das pessoas. Fazer isso com consciência faz parte de ser bom no que você faz.",
        },
        {
          id: "pratica.carreira",
          title: "Carreira em IA",
          description:
            "Os caminhos profissionais da área e como montar um portfólio que abre portas.",
          content:
            "A essa altura você tem o mapa técnico da IA. Vale fechar com o mapa **profissional**: quais são os caminhos e como se posicionar, porque a área tem papéis bem diferentes por baixo do guarda-chuva de trabalhar com IA.\n\nTrês perfis ajudam a se orientar. O **Cientista de Dados** foca em extrair conhecimento dos dados: explora, modela, experimenta, e costuma viver mais perto da estatística e do negócio. O **Engenheiro de Machine Learning** foca em levar modelos à produção de forma robusta e escalável, e puxa mais pra engenharia de software e infraestrutura, o território de MLOps. E o **Engenheiro de IA** (AI Engineer), papel que cresceu com a IA generativa, foca em construir produtos em cima de modelos prontos, integrando LLMs, RAG e agentes em aplicações reais.\n\nOs limites entre eles são borrados e variam por empresa, mas conhecer os três te ajuda a mirar o que combina com você: mais pesquisa e dados, mais engenharia e escala, ou mais produto e aplicação.\n\nO que abre portas em qualquer um deles é a mesma coisa: **projetos reais**. Como você viu em Praticar no Kaggle, mostrar o que construiu (notebooks públicos, repositórios no GitHub, uma aplicação no ar) pesa tanto quanto o diploma, e muitas vezes mais. Um portfólio de dois ou três projetos que resolvem problemas concretos comunica sua capacidade melhor que qualquer lista de cursos. Você domina este passo quando sabe qual dos perfis te atrai mais e tem clareza do próximo projeto que vai colocar no seu portfólio.",
        },
        {
          id: "pratica.projeto",
          title: "Projeto final: chatbot com IA",
          description:
            "Um chatbot completo com IA, juntando modelo, contexto e interface num produto real.",
          content:
            "Esta é a hora de transformar a trilha num produto que qualquer pessoa consegue usar, e nada representa melhor a IA aplicada de hoje que um chatbot. Você percorreu os fundamentos, o machine learning, o deep learning, os domínios de linguagem e a IA generativa, incluindo como chamar um LLM via API. O projeto final junta o modelo, o contexto e uma interface num só lugar.\n\nO projeto vinculado te encomenda um **chatbot com IA** de ponta a ponta: uma interface simples de conversa, ligada a um LLM por API, com um prompt de sistema que define o papel do assistente, e, de preferência, uma base de conhecimento própria (os seus documentos) que o modelo consulta pra responder sobre um assunto específico, em vez de depender só da memória genérica dele. É o encontro de tudo o que a trilha construiu: modelo pronto, contexto bem dado e produto utilizável.\n\nComo manda a área, trate a saída com desconfiança saudável: mostre de onde veio a resposta quando usar uma base própria, e não apresente o que o modelo diz como verdade absoluta. Você chega ao fim quando alguém abre o seu chatbot, faz uma pergunta sobre o conteúdo que você deu, e recebe uma resposta coerente e ancorada nesse conteúdo, com a interface deixando claro que é um assistente de IA. Um chatbot que passa nesse teste é a peça de portfólio que melhor prova que você sabe aplicar IA, que é o que esta trilha se propôs a formar.",
          project: "chatbot-com-ia",
        },
        {
          id: "pratica.proximos",
          title: "Próximos passos",
          description: "Como continuar evoluindo depois de cobrir a base.",
          optional: true,
          content:
            "Esta trilha te deu o mapa da IA: fundamentos, pré-requisitos, machine learning, deep learning, os domínios de visão e linguagem, e a IA generativa. O próximo passo é aprofundar na direção que mais te atrai, porque a área é ampla demais pra dominar tudo de uma vez, e tentar isso só dispersa.\n\nAlguns caminhos de aprofundamento. Se a base matemática te interessa e você quer pesquisa, vale investir em estatística, álgebra linear e cálculo com mais seriedade, e estudar os algoritmos por dentro. Se o seu foco é aplicar IA em produtos, o caminho é aprender a colocar modelos em produção de forma confiável (a disciplina às vezes chamada de MLOps) e a integrá-los em sistemas reais. Se a IA generativa te empolga, aprofunde em como construir aplicações sólidas em cima de LLMs.\n\nDuas atitudes sustentam uma carreira em IA a longo prazo. A primeira é **escolher e aprofundar**, em vez de pular de novidade em novidade; especialização é o que cria valor real. A segunda é manter o **aprendizado contínuo**, porque a área se move rápido e parte do que é ponta hoje muda em poucos anos. A boa notícia é que os fundamentos que você construiu aqui (como dados, modelos e avaliação funcionam) mudam devagar e sustentam tudo o que vier por cima.\n\nEscolha um problema que te interesse de verdade e construa algo com ele. Projetos reais, do início ao fim, ensinam mais que qualquer curso e formam o portfólio que abre portas.",
          resources: [
            {
              label: "fast.ai: Practical Deep Learning (curso oficial)",
              url: "https://course.fast.ai/",
              kind: "curso",
            },
          ],
        },
      ],
    },
  ],
};
