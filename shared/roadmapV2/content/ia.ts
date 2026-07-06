import type { RoadmapV2 } from "../types";

export const ia: RoadmapV2 = {
  slug: "ia",
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
          id: "fundamentos.camadas",
          title: "IA, machine learning e deep learning",
          description:
            "Três termos que se aninham e que muita gente usa como sinônimos por engano.",
          content:
            "Três termos aparecem o tempo todo e são tratados como sinônimos por quem está de fora, mas eles se **aninham** como bonecas russas, um dentro do outro. Entender essa hierarquia organiza a área inteira na sua cabeça.\n\nO termo mais amplo é **inteligência artificial**, que engloba qualquer técnica pra fazer máquinas executarem tarefas inteligentes, inclusive abordagens antigas baseadas em regras escritas à mão.\n\nDentro dela está o **machine learning**, o conjunto de técnicas em que o sistema aprende padrões a partir de dados em vez de seguir regras programadas. É onde mora a maior parte da IA útil de hoje, e inclui métodos clássicos como árvores de decisão e regressão.\n\nE dentro do machine learning está o **deep learning**, uma família específica baseada em **redes neurais** com muitas camadas. É a tecnologia por trás dos avanços mais chamativos dos últimos anos: reconhecimento de imagem, tradução, reconhecimento de voz e os modelos generativos. Ele brilha especialmente com dados não estruturados, como imagens, áudio e texto.\n\nA lição prática: nem todo problema pede deep learning. Para muitos casos com dados em tabela, um modelo clássico de machine learning é mais rápido, mais barato e igualmente bom. Saber escolher a ferramenta certa pro problema é mais valioso que usar sempre a mais sofisticada, e esta trilha cobre as duas, na ordem certa.",
        },
        {
          id: "fundamentos.expectativas",
          title: "Expectativas realistas",
          description:
            "Separar o que a IA faz bem do hype, antes de investir meses de estudo.",
          content:
            "A IA vive cercada de exagero, e ajustar as expectativas cedo evita frustração e decisões ruins de carreira. Vale separar o que a tecnologia realmente faz do que se imagina que ela faz.\n\nO que a IA faz bem: encontrar padrões em grandes volumes de dados, automatizar tarefas repetitivas de percepção (ler, ver, ouvir) e gerar conteúdo plausível. O que ela **não** é: nem mágica, nem consciência, nem fonte de verdade. Um modelo não \"entende\" o mundo como uma pessoa; ele captura padrões estatísticos dos dados com que foi treinado, e por isso erra de formas que humanos não errariam, com toda a confiança.\n\nDuas verdades que pesam no dia a dia de quem trabalha na área. Primeira: o trabalho real é muito menos glamouroso que a manchete. A maior parte do esforço está em coletar, limpar e entender dados, não em inventar algoritmos novos. Segunda: IA depende inteiramente de bons dados. Dados ruins ou enviesados geram modelos ruins ou enviesados, por mais avançada que seja a técnica.\n\nHá também uma pergunta honesta de carreira. A pesquisa de ponta exige forte base matemática e costuma pedir pós-graduação. Mas existe um espaço enorme e crescente pra quem **aplica** IA: usar modelos prontos, integrá-los em produtos, ajustá-los a um problema. Esta trilha te prepara pra esse caminho aplicado, que é onde a maioria das oportunidades está.",
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
        "As duas bases que sustentam tudo o que vem depois: programação em Python e a matemática essencial.",
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
          id: "prerequisitos.matematica",
          title: "A matemática essencial",
          description:
            "O quanto de matemática você realmente precisa pra começar, sem se paralisar.",
          content:
            "Matemática assusta muita gente que quer entrar em IA, então vale uma conversa franca. Sim, IA é uma área matemática, e quanto mais fundo você for (especialmente em pesquisa), mais matemática vai precisar. Mas pra **começar** e aplicar modelos, você precisa de menos do que imagina, e dá pra aprender no caminho.\n\nTrês áreas importam mais. A **estatística** básica é a mais imediata: média, mediana, desvio padrão, distribuições, probabilidade e correlação. Ela é o que te permite entender seus dados e interpretar se um modelo é bom de verdade, sem se enganar. A **álgebra linear** aparece porque dados e modelos são representados como vetores e matrizes; entender o que são e como se multiplicam ajuda a enxergar o que acontece por dentro de uma rede neural. E noções de **cálculo**, especialmente a ideia de derivada, explicam como os modelos aprendem ajustando-se aos poucos.\n\nO erro clássico é querer dominar toda a matemática antes de tocar em código, e nunca sair do lugar. O caminho que funciona é o inverso: comece a praticar com modelos prontos, entendendo a intuição, e aprofunde a teoria conforme a curiosidade e a necessidade aparecem. Você não precisa derivar as fórmulas pra usar uma biblioteca; precisa entender o que cada conceito significa.\n\nPriorize a estatística, que dá retorno imediato, e trate álgebra linear e cálculo como aprofundamento gradual ao longo da jornada.",
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
      ],
    },
    {
      id: "deeplearning",
      title: "Deep learning",
      description:
        "As redes neurais por trás dos avanços recentes da IA, e as ferramentas pra treiná-las.",
      level: "intermediario",
      children: [
        {
          id: "deeplearning.redes",
          title: "Redes neurais",
          description:
            "A estrutura inspirada no cérebro que aprende padrões complexos.",
          content:
            "O **deep learning** se baseia nas **redes neurais artificiais**, uma estrutura vagamente inspirada no cérebro. A unidade básica é o **neurônio**: ele recebe vários números de entrada, faz uma conta simples com eles (uma soma ponderada) e produz uma saída. Sozinho, um neurônio faz pouco.\n\nA força vem da organização em **camadas**. Os neurônios se agrupam em camadas conectadas em sequência: os dados entram pela primeira, passam por uma ou mais camadas intermediárias (as \"escondidas\") e saem pela última como a previsão. O \"deep\" (profundo) do deep learning vem justamente de ter **muitas** camadas, e é isso que permite aprender padrões muito complexos.\n\nO que cada neurônio aprende são seus **pesos**, os números que controlam quanta importância dar a cada entrada. Treinar uma rede é, no fundo, ajustar milhões desses pesos até que ela acerte. Você não define os pesos na mão; o treino faz isso a partir dos dados, e o próximo nó explica como.\n\nA grande vantagem das redes neurais aparece com dados **não estruturados**: imagens, áudio e texto, onde os modelos clássicos têm dificuldade. Por isso o deep learning domina visão computacional, reconhecimento de voz e processamento de linguagem. A desvantagem é que elas costumam exigir muitos dados e bastante poder de computação, e são mais difíceis de interpretar. Não são a resposta pra tudo: pra dados em tabela, um modelo clássico bem feito muitas vezes vence.",
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
            "Treinar uma rede neural parece mágica, mas a ideia central é intuitiva e vale entender, mesmo sem a matemática. O processo é um ciclo de tentativa, medição de erro e correção, repetido muitas vezes.\n\nPrimeiro, a rede recebe um exemplo e produz uma previsão (no começo, praticamente um chute, porque os pesos são aleatórios). Em seguida, uma **função de perda** mede o quão longe a previsão ficou da resposta certa: um número que representa o tamanho do erro. O objetivo do treino é deixar esse erro o menor possível.\n\nAí entra a parte engenhosa. A rede calcula em que direção ajustar cada peso pra reduzir o erro um pouquinho, e dá um pequeno passo nessa direção. Esse mecanismo de \"descer\" rumo ao menor erro é a famosa **descida de gradiente**. Repetindo isso sobre milhares de exemplos, muitas vezes, os pesos vão se ajustando e a rede vai acertando mais.\n\nDois termos que você vai ouvir sempre: uma **época** é uma passagem completa por todos os dados de treino (em geral são necessárias várias), e a **taxa de aprendizado** controla o tamanho de cada passo (grande demais e o treino fica instável, pequena demais e fica lento).\n\nA boa notícia pra quem está aprendendo: as bibliotecas cuidam de toda essa matemática por você. Você precisa entender a **intuição** (erro medido, pesos ajustados aos poucos), não derivar as fórmulas. Com essa imagem na cabeça, o que o framework faz deixa de ser caixa-preta.",
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
      ],
    },
    {
      id: "dominios",
      title: "Domínios da IA",
      description:
        "As duas grandes especializações do deep learning: ver imagens e entender linguagem.",
      level: "avancado",
      children: [
        {
          id: "dominios.visao",
          title: "Visão computacional",
          description:
            "Ensinar máquinas a interpretar imagens e vídeos.",
          content:
            "**Visão computacional** é a área da IA que ensina máquinas a interpretar imagens e vídeos: identificar objetos, reconhecer rostos, ler placas, detectar defeitos numa linha de produção, apoiar diagnósticos médicos por imagem. Foi um dos primeiros campos transformados pelo deep learning.\n\nPara o computador, uma imagem é só uma grade de números (a intensidade de cor de cada pixel). O desafio é desses números brutos extrair significado, e foi aí que as redes neurais brilharam. O tipo de rede projetado pra isso é a **rede neural convolucional**, que aprende a detectar padrões visuais em etapas: primeiro bordas e texturas simples, depois formas, depois objetos inteiros, combinando o que aprendeu camada a camada.\n\nAs tarefas típicas têm nomes que vale conhecer. **Classificação de imagem** responde \"o que é isto?\" (a foto é de um gato). **Detecção de objetos** vai além e responde \"o que está aqui e onde?\", marcando cada objeto com uma caixa. E há tarefas mais finas, como separar exatamente os pixels de cada objeto.\n\nUm atalho que define a prática moderna é o **transfer learning**: em vez de treinar uma rede gigante do zero (o que exige enormes volumes de dados e computação), você parte de um modelo já treinado em milhões de imagens e o adapta ao seu problema específico com poucos dados. É assim que projetos pequenos conseguem resultados fortes, e é a forma mais sensata de um iniciante começar em visão.",
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
          description:
            "Fazer máquinas entenderem e gerarem linguagem humana.",
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
      ],
    },
    {
      id: "pratica",
      title: "Prática e responsabilidade",
      description:
        "Consolidar o aprendizado com projetos reais e entender os limites e riscos da tecnologia.",
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
          id: "pratica.etica",
          title: "Limitações, viés e ética",
          description:
            "Os riscos reais da tecnologia que todo profissional precisa levar a sério.",
          content:
            "Trabalhar com IA traz responsabilidade, e ignorar isso não é neutro: causa dano real a pessoas. Alguns temas precisam estar no radar de quem constrói esses sistemas, não como filosofia, mas como parte do ofício.\n\nO mais central é o **viés**. Modelos aprendem dos dados, e dados refletem o mundo como ele é, com todas as suas desigualdades. Um modelo treinado em decisões historicamente enviesadas aprende e **amplia** esse viés, podendo discriminar por gênero, raça ou origem em coisas sérias como crédito, contratação e justiça. O modelo não é objetivo só por ser matemático; ele é tão justo quanto os dados e as escolhas de quem o construiu.\n\nOutros pontos importam tanto quanto. A **privacidade**: modelos treinam com dados de pessoas, que precisam ser tratados com cuidado e respeito à lei. A **transparência**: muitos modelos são caixas-pretas difíceis de explicar, o que é grave quando a decisão afeta a vida de alguém que merece saber o porquê. E, na IA generativa, a **desinformação**, já que esses sistemas geram conteúdo falso convincente com facilidade.\n\nA postura profissional não é paralisar diante dos riscos, é levá-los a sério: questionar a qualidade e a representatividade dos dados, testar o modelo em diferentes grupos, e manter pessoas no controle das decisões que importam. Quem entra na área agora vai construir ferramentas com impacto real na vida das pessoas. Fazer isso com consciência faz parte de ser bom no que você faz.",
        },
        {
          id: "pratica.proximos",
          title: "Próximos passos",
          description:
            "Como continuar evoluindo depois de cobrir a base.",
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
