import type { RoadmapV2 } from "../types";

export const mainframe: RoadmapV2 = {
  slug: "mainframe",
  area: "mainframe",
  title: "Mainframe e COBOL do Zero",
  level: "Iniciante",
  description:
    "Da lógica e do COBOL ao JCL, DB2 e ao ambiente z/OS: como manter os sistemas críticos que rodam bancos e governo. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é um mainframe, por que ele continua essencial e que oportunidade isso representa.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é um mainframe",
          description:
            "O computador de grande porte que processa milhões de transações com confiabilidade extrema.",
          content:
            "Mainframe é um computador de **grande porte** projetado pra processar volumes enormes de transações com confiabilidade altíssima e ininterrupta. Não é um servidor comum maior; é uma classe própria de máquina, otimizada pra rodar sistemas críticos que não podem parar nem errar, processando milhões de operações por dia de forma estável.\n\nVocê interage com mainframes mais do que imagina. Eles estão no coração de **bancos** (toda vez que você faz um pagamento ou consulta um saldo, provavelmente um mainframe processa), de **governos**, **seguradoras** e **companhias aéreas**. São os bastidores invisíveis de sistemas que movem o mundo financeiro e administrativo, muitos deles rodando há décadas.\n\nO ambiente do mainframe tem um mundo próprio de tecnologias, com nomes que parecem de outra era porque, em parte, são: o sistema operacional **z/OS**, a linguagem **COBOL** (na qual boa parte desses sistemas foi escrita), o **JCL** pra controlar a execução de tarefas, e bancos como o **DB2**. O profissional da área desenvolve e mantém esses sistemas, garantindo que continuem funcionando.\n\nO que torna o mainframe único e atraente como carreira é justamente sua longevidade. Esses sistemas continuam no ar porque são extremamente estáveis e caríssimos de substituir, então as empresas preferem mantê-los e modernizá-los a reescrevê-los do zero. Isso cria uma situação peculiar no mercado, que a próxima parte explora: muita demanda por quem sabe mantê-los, e poucos profissionais novos entrando. Esta trilha te leva da lógica e do COBOL até o ambiente z/OS, abrindo as portas de um nicho estável e bem pago.",
          resources: [
            {
              label: "IBM Z (página oficial da plataforma)",
              url: "https://www.ibm.com/z/",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.porque",
          title: "O nicho e a oportunidade",
          description:
            "Por que os mainframes seguem firmes e o que isso significa pra sua carreira.",
          content:
            'Pra quem está acostumado com a velocidade da tecnologia web, pode parecer estranho que sistemas de décadas, escritos em COBOL, continuem rodando. Mas isso tem uma lógica sólida, e entendê-la revela uma oportunidade de carreira incomum.\n\nEsses sistemas seguem no ar por três motivos. São **estáveis e confiáveis**, fruto de décadas de ajuste e operação em produção, processando bilhões em transações sem falhar. São **caros e arriscados de substituir**: reescrever do zero o sistema central de um banco, que funciona, é um projeto gigantesco, caro e perigoso, então as empresas preferem manter e modernizar aos poucos. E **funcionam**: não há urgência de trocar algo que entrega o que precisa de forma robusta.\n\nDisso nasce uma dinâmica de mercado peculiar e favorável a quem entra. De um lado, a **demanda segue alta**, porque esses sistemas precisam de manutenção e evolução contínuas, e muitos profissionais experientes da área estão se aposentando. De outro, **poucos profissionais novos** entram, porque a maioria dos iniciantes é atraída por áreas mais "modernas" como web e dados. O resultado é um nicho com **baixa concorrência** e **boa estabilidade**.\n\nVale o ajuste de expectativa honesto: é um **nicho**, com menos vagas que áreas como desenvolvimento web, e tecnologias específicas que você não usará fora dele. O perfil que combina é quem gosta de lógica e atenção a detalhe, tem paciência pra ler e entender **código legado** (sistemas antigos e grandes), e **valoriza estabilidade mais que novidade constante**. Se isso descreve você, a relação entre demanda firme e baixa concorrência torna o mainframe um caminho estratégico e frequentemente subestimado.',
        },
      ],
    },
    {
      id: "logica",
      title: "Lógica de programação",
      description:
        "A base de raciocínio que sustenta o COBOL e qualquer programação.",
      level: "iniciante",
      children: [
        {
          id: "logica.logica",
          title: "Lógica de programação",
          description:
            "Pensar de forma estruturada, a fundação antes de qualquer linguagem.",
          content:
            'Antes do COBOL e de qualquer tecnologia de mainframe, vem a **lógica de programação**. Ela é a fundação de toda a área, e a recomendação é clara: comece por aqui, especialmente se você ainda não programou.\n\nLógica de programação é a capacidade de **resolver problemas de forma estruturada**, decompondo uma tarefa em passos claros e sequenciais que um computador possa executar. Os conceitos fundamentais valem pra qualquer linguagem: variáveis (guardar dados), condicionais ("se isto, então aquilo", que é como as regras de negócio viram código), laços (repetir uma ação), e a ideia de seguir uma sequência lógica de instruções.\n\nNo contexto do mainframe, esses fundamentos têm um sabor particular que vale antecipar. Muito do trabalho envolve **processar dados em massa**: ler um arquivo enorme registro por registro, aplicar regras a cada um, e gerar resultados. O raciocínio de "para cada registro, faça isto" é onipresente, e a lógica de laços e condicionais é exatamente o que sustenta isso. Pensar de forma organizada e metódica, com atenção aos detalhes e aos casos de exceção, é a mentalidade da área.\n\nA boa notícia é que, se você já programa em qualquer linguagem, essa base se transfere direto, e você pode avançar mais rápido pro COBOL. Se está começando do zero, vale investir tempo aqui antes, eventualmente passando por uma introdução a lógica e algoritmos. O COBOL, que você verá a seguir, é uma linguagem com sintaxe peculiar mas conceitos simples; quem domina a lógica aprende COBOL sem grande dificuldade. A lógica é o que realmente importa; a sintaxe é detalhe.',
        },
      ],
    },
    {
      id: "cobol",
      title: "COBOL",
      description:
        "A linguagem no coração dos sistemas de mainframe, que você vai ler, manter e escrever.",
      level: "intermediario",
      children: [
        {
          id: "cobol.linguagem",
          title: "COBOL: a linguagem",
          description:
            "A linguagem dos sistemas de negócio, verbosa mas legível.",
          content:
            "O **COBOL** é a linguagem no coração da maioria dos sistemas de mainframe. Criada nos anos 1950 pra aplicações de negócio, ela domina os sistemas financeiros e administrativos até hoje, e dominá-la é a competência central de quem trabalha na área.\n\nO COBOL tem uma característica que marca quem vem de linguagens modernas: ele é **verboso e parecido com inglês**. Onde outra linguagem usa símbolos concisos, o COBOL usa palavras: `ADD A TO B GIVING C`, `MOVE X TO Y`. Isso foi proposital, pra o código ser legível até por quem não é programador profissional. No começo parece estranho e prolixo, mas a legibilidade é uma força: programas COBOL de décadas atrás ainda são compreensíveis hoje.\n\nA estrutura de um programa COBOL é organizada em **divisões** bem definidas, cada uma com um papel: uma identifica o programa, outra descreve o ambiente, outra (a Data Division) declara todos os dados que o programa usa, e a Procedure Division contém a lógica de fato. Essa rigidez de estrutura é típica do COBOL e, uma vez entendida, dá previsibilidade ao código.\n\nUm conceito central é a descrição detalhada dos **dados**: o COBOL leva muito a sério a definição exata de cada campo (tamanho, tipo, formato), porque foi feito pra processar dados de negócio com precisão. Você declara minuciosamente a estrutura dos dados antes de usá-los.\n\nUma boa notícia pra carreira: por ser um nicho com poucos profissionais novos, saber COBOL é um diferencial concreto. A documentação oficial da IBM e cursos abertos, como os do Open Mainframe Project, são ótimas referências pra aprender do zero.",
          resources: [
            {
              label: "IBM: documentação do COBOL para z/OS (oficial)",
              url: "https://www.ibm.com/docs/en/cobol-zos",
              kind: "doc",
            },
            {
              label: "Open Mainframe Project: curso de COBOL (gratuito)",
              url: "https://github.com/openmainframeproject/cobol-programming-course",
              kind: "curso",
            },
          ],
        },
        {
          id: "cobol.arquivos",
          title: "Trabalhar com arquivos",
          description:
            "Ler e gravar grandes volumes de dados, o pão de cada dia do COBOL.",
          content:
            'O trabalho mais característico do COBOL é **processar arquivos**: ler grandes volumes de dados, aplicar regras e gerar resultados. Entender como o COBOL lida com arquivos é entender boa parte do que a área faz no dia a dia.\n\nO padrão clássico é o **processamento sequencial**: o programa abre um arquivo de entrada, lê **registro por registro** (cada linha de dados, como um cliente ou uma transação), processa cada um aplicando a lógica de negócio, e grava o resultado num arquivo de saída. Esse fluxo de "ler, processar, escrever, repetir até o fim do arquivo" é o coração de incontáveis programas COBOL, como gerar relatórios, calcular folhas de pagamento ou processar movimentações bancárias do dia.\n\nUm conceito fundamental é a **estrutura fixa dos registros**. Diferente de formatos flexíveis, os dados no mainframe costumam ter posições fixas: os caracteres de 1 a 10 são o nome, de 11 a 20 o código, e assim por diante. O COBOL descreve essa estrutura em detalhe na Data Division, e essa precisão é o que permite processar bilhões de registros de forma confiável e rápida.\n\nVocê também encontra os conceitos de **dataset** (o nome que o mundo mainframe dá aos arquivos) e diferentes formas de organizá-los, das mais simples (sequenciais) às indexadas, que você verá adiante com o VSAM.\n\nA habilidade prática a desenvolver é escrever um programa que lê um arquivo de entrada, faz algum processamento (somar valores, filtrar, transformar) e gera um relatório ou um arquivo de saída. Esse é, inclusive, um projeto de aprendizado clássico da área, e exercita exatamente o tipo de trabalho que um desenvolvedor mainframe faz na prática.',
          resources: [
            {
              label: "GnuCOBOL (compilador COBOL livre, para praticar)",
              url: "https://gnucobol.sourceforge.io/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "jcl",
      title: "JCL e processamento em lote",
      description:
        "Como dizer ao mainframe o que executar, com quais dados, fora do tempo real.",
      level: "intermediario",
      children: [
        {
          id: "jcl.jcl",
          title: "JCL: controlar a execução",
          description:
            "A linguagem que diz ao sistema qual programa rodar e com quais recursos.",
          content:
            'No mainframe, você não simplesmente "roda" um programa COBOL clicando nele. Você precisa dizer ao sistema **o que executar, com quais dados e quais recursos**, e isso se faz com o **JCL** (Job Control Language, linguagem de controle de jobs). Aprender JCL é tão essencial quanto o COBOL, porque é o que coloca seus programas pra rodar.\n\nO JCL não é uma linguagem de programação no sentido usual; é uma linguagem de **controle**. Um script JCL descreve um **job** (uma unidade de trabalho a ser executada) especificando coisas como: qual programa rodar, quais arquivos (datasets) ele vai ler e escrever, quanta memória reservar, e o que fazer conforme o resultado. É a ponte entre o seu programa e o sistema operacional z/OS.\n\nA sintaxe do JCL é peculiar e datada, com suas próprias convenções rígidas, e costuma intimidar no começo. Mas a estrutura é lógica: um job é composto de **steps** (passos), e cada step normalmente executa um programa com seus dados associados. Um job pode ter vários steps em sequência, encadeando programas: o resultado de um vira a entrada do próximo.\n\nUm conceito importante são as **condições**: o JCL permite decidir se um step roda ou não com base no resultado do anterior (por exemplo, só prosseguir se o passo anterior terminou bem). Isso dá controle sobre fluxos complexos de processamento.\n\nNa prática, escrever e ajustar JCL pra executar programas é tarefa diária do desenvolvedor mainframe. Você vai escrever JCL pra rodar seus programas COBOL, e ler JCL existente pra entender como os sistemas são executados. A documentação do z/OS da IBM cobre o JCL em detalhe, e a prática num ambiente real fixa a sintaxe.',
          resources: [
            {
              label: "IBM: documentação do z/OS (inclui JCL)",
              url: "https://www.ibm.com/docs/en/zos",
              kind: "doc",
            },
          ],
        },
        {
          id: "jcl.batch",
          title: "Processamento em lote",
          description:
            "Processar grandes volumes de dados em massa, sem interação em tempo real.",
          content:
            "O JCL serve principalmente ao **processamento em lote** (batch), que é o modo de trabalho dominante no mundo mainframe e merece ser entendido como conceito, porque difere bastante do que se vê na web.\n\nProcessamento em lote significa executar uma grande quantidade de trabalho **de uma vez, sem interação humana em tempo real**. Em vez de responder a cliques de usuários instantaneamente (o que seria processamento interativo, ou on-line), um job em lote pega um grande volume de dados acumulados e os processa em massa, geralmente em horários de menor uso, como a madrugada. O resultado fica pronto pra quando for necessário.\n\nOs exemplos clássicos ilustram o porquê. O fechamento diário de um banco: durante a noite, um conjunto de jobs processa todas as transações do dia, atualiza saldos, gera extratos, calcula juros. A folha de pagamento de uma empresa: um job processa todos os funcionários de uma vez. A emissão de milhões de faturas. Esses são trabalhos que fazem sentido em lote, não em tempo real, e são exatamente onde o mainframe brilha, processando volumes gigantescos com confiabilidade.\n\nDois conceitos acompanham o batch. O **agendamento**: jobs em lote costumam rodar em horários definidos ou em sequências encadeadas, orquestrados pra acontecer na ordem certa. E a **recuperação**: como esses jobs processam dados críticos, é essencial poder reiniciar de onde parou se algo falhar no meio, sem reprocessar tudo nem corromper dados.\n\nEntender a mentalidade do batch (processar muito de uma vez, de forma confiável e recuperável) é compreender a essência do que o mainframe faz melhor que qualquer outra plataforma, e o motivo de ele seguir insubstituível em tantos cenários de alto volume.",
        },
      ],
    },
    {
      id: "dados",
      title: "Dados no mainframe",
      description:
        "Onde e como os dados ficam guardados e são acessados nesse ambiente.",
      level: "intermediario",
      children: [
        {
          id: "dados.db2",
          title: "DB2 e SQL",
          description:
            "O banco de dados relacional do mainframe, acessado com SQL.",
          content:
            "Boa parte dos dados no mainframe vive em bancos de dados, e o mais importante é o **DB2**, o banco de dados relacional da IBM. Saber acessá-lo é parte central do trabalho, e a boa notícia é que ele usa **SQL**, a mesma linguagem padrão dos bancos relacionais, então esse conhecimento se transfere de e pra outras áreas.\n\nSe você já viu SQL, está em casa: o DB2 usa os mesmos comandos fundamentais. O `SELECT` busca dados, com `WHERE` pra filtrar e `JOIN` pra combinar tabelas; o `INSERT`, `UPDATE` e `DELETE` manipulam registros. Os conceitos de tabelas, linhas, colunas e relacionamentos são os mesmos de qualquer banco relacional. Se você não conhece SQL, vale aprender o básico, porque é uma habilidade valiosa muito além do mainframe.\n\nO que é particular do mundo mainframe é **como** o SQL se integra ao COBOL. Os programas COBOL acessam o DB2 através de comandos SQL embutidos no próprio código (o chamado SQL embarcado): você escreve a consulta dentro do programa COBOL, e ele a executa pra ler ou atualizar dados durante o processamento. Assim, um programa de batch pode ler registros de um arquivo, consultar e atualizar o DB2 pra cada um, e gerar resultados, combinando o processamento de arquivos com o acesso ao banco.\n\nVocê também ouvirá falar de processamento **on-line** versus batch no acesso a dados: transações interativas (consultar um saldo na hora) acessam o DB2 em tempo real, enquanto jobs em lote o atualizam em massa. Os dois convivem sobre os mesmos dados.\n\nA documentação oficial do DB2 é a referência completa. Dominar SQL e entender como ele se integra ao COBOL te dá a capacidade de trabalhar com os dados que são o coração desses sistemas.",
          resources: [
            {
              label: "IBM: documentação do DB2 (oficial)",
              url: "https://www.ibm.com/docs/en/db2",
              kind: "doc",
            },
          ],
        },
        {
          id: "dados.vsam",
          title: "VSAM e armazenamento legado",
          description:
            "As formas de guardar dados em arquivos, anteriores e paralelas ao DB2.",
          optional: true,
          content:
            "Nem todos os dados do mainframe estão em bancos relacionais como o DB2. Muitos sistemas, especialmente os mais antigos, guardam dados em formas próprias de arquivo, e a mais importante é o **VSAM**. Conhecê-lo ajuda a entender e manter os sistemas legados, que são boa parte do trabalho da área.\n\nO **VSAM** (Virtual Storage Access Method) é um método de organização de arquivos da IBM que permite acessar dados de formas mais eficientes que um arquivo sequencial simples. Sua grande vantagem é o **acesso indexado**: enquanto um arquivo sequencial obriga a ler tudo do início até achar um registro, o VSAM permite ir direto a um registro específico por uma chave, como buscar um cliente pelo seu número sem percorrer todos os outros. É, em essência, uma forma de armazenamento com índice, anterior e paralela aos bancos relacionais.\n\nVocê encontrará programas COBOL que leem e gravam em arquivos VSAM diretamente, sem passar por um banco como o DB2. Entender como esses arquivos funcionam, como são organizados e como o COBOL os acessa é necessário pra manter esses sistemas.\n\nHá também o **IMS**, um banco de dados mais antigo, de modelo hierárquico (anterior ao relacional), ainda presente em alguns sistemas críticos muito longevos. É mais nichado, mas vale saber que existe.\n\nÉ um tema mais específico, por isso opcional nesta fase. Mas reflete uma realidade da área: trabalhar com mainframe é, muitas vezes, lidar com **camadas de tecnologia de diferentes épocas** convivendo no mesmo sistema, das mais antigas (VSAM, IMS) às mais recentes (DB2). Essa convivência de gerações tecnológicas é parte do charme e do desafio de manter sistemas que atravessaram décadas.",
        },
      ],
    },
    {
      id: "ambiente",
      title: "O ambiente z/OS",
      description:
        "O sistema operacional e as ferramentas onde todo o trabalho de mainframe acontece.",
      level: "avancado",
      children: [
        {
          id: "ambiente.zos",
          title: "z/OS e TSO/ISPF",
          description:
            "O sistema operacional do mainframe e a interface onde você trabalha.",
          content:
            "Todo o trabalho de mainframe acontece dentro do **z/OS**, o sistema operacional dos mainframes da IBM. Diferente de Windows ou Linux, o z/OS foi projetado pra confiabilidade extrema e processamento de altíssimo volume, e tem um jeito próprio de fazer as coisas que leva algum tempo pra dominar.\n\nA forma como você interage com o z/OS também é particular. A interface principal é o **TSO/ISPF**, um ambiente baseado em **texto e menus**, operado pelo teclado, sem o mouse e as janelas a que você está acostumado. Pode parecer datado, e é, mas é eficiente e poderoso pra quem aprende. No ISPF você edita seus programas COBOL e JCL, navega pelos datasets, submete jobs pra execução e vê os resultados. É a sua bancada de trabalho no mainframe.\n\nAlguns conceitos do ambiente valem conhecer. Os **datasets**, o nome do mainframe pros arquivos, organizados de formas específicas e com convenções próprias de nomenclatura. A **submissão de jobs**, o ato de enviar um JCL pra execução, e o acompanhamento da fila de jobs. E a leitura das **saídas** dos jobs, onde você confere o que aconteceu na execução.\n\nDominar o TSO/ISPF é uma questão de prática: a navegação por teclado e os comandos viram naturais com o uso, e a produtividade que se ganha é grande. No começo, ter um mapa dos comandos básicos ajuda muito.\n\nA forma ideal de aprender o ambiente é praticando num **mainframe real**, e a boa notícia é que existe acesso gratuito pra estudo, como você verá na parte de carreira. A documentação oficial do z/OS da IBM é a referência completa pra esse mundo.",
          resources: [
            {
              label: "IBM: documentação do z/OS (oficial)",
              url: "https://www.ibm.com/docs/en/zos",
              kind: "doc",
            },
          ],
        },
        {
          id: "ambiente.cics",
          title: "CICS e transações",
          description:
            "O monitor que permite processamento interativo em tempo real no mainframe.",
          content:
            "Até aqui, o foco foi o processamento em lote. Mas o mainframe também faz processamento **on-line**, em tempo real, e a tecnologia central pra isso é o **CICS** (Customer Information Control System). Entender o CICS completa a visão de como o mainframe atende tanto o batch quanto o interativo.\n\nO CICS é um **monitor de transações**: um software que gerencia muitas transações interativas acontecendo ao mesmo tempo, com altíssimo desempenho e confiabilidade. Quando você consulta um saldo num caixa eletrônico ou faz uma operação que responde na hora, frequentemente é o CICS coordenando aquela transação no mainframe, em milissegundos, em meio a milhares de outras simultâneas.\n\nO conceito central é a **transação**: uma unidade de trabalho interativa, curta e bem definida, que faz algo (consultar, atualizar) e responde rápido. O CICS gerencia o ciclo de vida dessas transações, o acesso simultâneo aos dados, a integridade (garantindo que uma transação ou completa tudo ou nada, como você viu no conceito de banco de dados) e a recuperação em caso de falha. Programas COBOL podem ser escritos pra rodar sob o CICS, atendendo essas transações on-line, diferente dos programas de batch.\n\nA distinção que vale guardar: o **batch** processa grandes volumes de uma vez, sem interação, em horários definidos; o **on-line via CICS** atende interações em tempo real, uma a uma, com resposta imediata. Os dois modos convivem no mesmo mainframe, muitas vezes sobre os mesmos dados, e juntos explicam como uma única plataforma sustenta tanto o fechamento noturno de um banco quanto as consultas instantâneas durante o dia.\n\nO CICS é um tema avançado, com seu próprio ecossistema, e a documentação oficial da IBM é a referência pra aprofundar.",
          resources: [
            {
              label: "IBM: documentação do CICS (oficial)",
              url: "https://www.ibm.com/docs/en/cics-ts",
              kind: "doc",
            },
          ],
        },
        {
          id: "ambiente.abend",
          title: "Abends e depuração",
          description:
            "Investigar e resolver as falhas que acontecem na execução.",
          content:
            'Quando algo dá errado na execução de um programa no mainframe, acontece um **abend** (de abnormal end, término anormal), e investigar abends é uma das atividades mais frequentes e importantes do desenvolvedor mainframe. Saber depurar é o que distingue quem mantém esses sistemas de verdade.\n\nUm abend é o equivalente, no mundo mainframe, a um programa que "quebra". Mas aqui há uma cultura forte de diagnóstico estruturado, fruto de décadas de operação de sistemas críticos. Cada abend vem com um **código** que indica o tipo de problema, e a partir dele você começa a investigação. Os abends têm causas variadas: um erro de lógica, um dado inesperado, um arquivo que não foi encontrado, um problema de configuração no JCL, uma falha de acesso a dados.\n\nAs ferramentas de investigação são próprias do ambiente. Você analisa os **logs** da execução do job (que registram o que aconteceu e onde parou) e, em casos mais complexos, os **dumps**: registros detalhados do estado da memória no momento da falha, que ajudam a entender exatamente o que deu errado. Ler um dump é uma habilidade específica e valorizada da área, que se desenvolve com prática.\n\nA mentalidade do diagnóstico no mainframe é metódica e paciente: você parte do código do abend, lê os logs, isola onde e por que o programa falhou, e corrige a causa. Em sistemas que processam dados críticos, entender de verdade a causa raiz (em vez de "tentar de novo") é essencial, porque um erro pode afetar dados importantes.\n\nAtenção ao detalhe, paciência pra investigar e familiaridade com os códigos e ferramentas de diagnóstico são o que fazem um bom analista de mainframe. É um trabalho de detetive sobre sistemas grandes e críticos, e dominá-lo é parte central da profissão.',
          resources: [
            {
              label: "IBM: documentação do z/OS (mensagens e códigos)",
              url: "https://www.ibm.com/docs/en/zos",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "carreira",
      title: "Prática e carreira",
      description:
        "Praticar num mainframe real de graça e entrar num nicho estável e de baixa concorrência.",
      level: "avancado",
      children: [
        {
          id: "carreira.projeto",
          title: "Projeto final: rotina batch com JCL",
          description:
            "Crítica, totalização e relatório orquestrados por JCL, o dia a dia batch de verdade.",
          content:
            "Esta é a hora de montar, de ponta a ponta, o tipo de rotina que roda toda madrugada nos bancos: um processamento em lote de verdade, orquestrado por JCL. Você aprendeu a lógica, o COBOL e o trabalho com arquivos, o JCL e a mentalidade batch, o acesso a dados com DB2, e o ambiente z/OS. O projeto final junta tudo numa rotina que faz trabalho real.\n\nO projeto vinculado te encomenda uma **rotina batch em COBOL orquestrada por JCL**: um job com mais de um passo que lê um arquivo de entrada (movimentações, por exemplo), **critica** cada registro (valida o que está correto e separa o que está errado), **totaliza** os dados válidos (somas, contagens, agrupamentos), e gera um **relatório** de saída. É o padrão ler, validar, processar e relatar que sustenta incontáveis sistemas em produção, no tamanho de um exercício.\n\nComo manda o mundo mainframe, trate os erros com método: registros inválidos vão pra uma saída separada em vez de derrubar o job, e cada passo do JCL só avança se o anterior terminou bem. Você chega ao fim quando o seu job roda do início ao fim no ambiente (o IBM Z Xplore serve pra isso), processa um arquivo com dados bons e ruins misturados, e produz o relatório totalizado mais a lista do que foi rejeitado, e você consegue ler a saída do job e explicar o que cada passo fez. Uma rotina batch que passa nesse teste mostra exatamente o trabalho que um desenvolvedor mainframe faz no dia a dia.",
          project: "rotina-batch-cobol",
        },
        {
          id: "carreira.entrar",
          title: "Entrar na carreira",
          description:
            "Como praticar de verdade e se posicionar num nicho com demanda firme.",
          content:
            "O mainframe é um nicho com uma equação de carreira incomum e favorável: **demanda firme** (sistemas críticos que precisam de manutenção e gente experiente se aposentando) e **baixa concorrência** (poucos iniciantes escolhem a área). Quem entra com seriedade encontra um caminho estável e frequentemente subestimado.\n\nVale ser honesto sobre a natureza dessa entrada, sem romantizar nem menosprezar. Mainframe não é tecnologia morta: é infraestrutura crítica e ativa de bancos, seguradoras e governo, rodando agora enquanto você lê isto. Uma geração inteira que a mantém está se aposentando, e pouca gente nova entra, e é exatamente por isso que o mercado paga bem. Mas a porta de entrada costuma ser diferente da de outras áreas: mais que uma vaga júnior aberta num site de empregos, o caminho comum é um **programa de formação de uma grande empresa** (bancos, seguradoras e consultorias formam turmas próprias de trainees em mainframe). Mirar esses programas de trainee e estágio, nas empresas que operam a plataforma, é a estratégia mais realista pra entrar.\n\nUm obstáculo histórico da área era o acesso ao ambiente, já que mainframes são caros e não ficam no computador de casa. Isso mudou, e é a melhor notícia pra quem quer aprender: a IBM oferece acesso **gratuito a um mainframe real** pra estudo, através do **IBM Z Xplore** (sucessor do antigo Master the Mainframe). Nele, você cria uma conta, acessa um ambiente z/OS de verdade pela internet, e resolve **desafios práticos** que ensinam o ambiente, o JCL, o COBOL e o resto, no mainframe real, sem custo. Praticar ali é, de longe, a forma mais eficaz de aprender, e resolver esses desafios é também uma prova concreta pro currículo.\n\nA fórmula pra entrar combina algumas peças. Domine a **lógica de programação** e o **COBOL**, que são o núcleo. Aprenda **JCL** pra executar programas e **SQL/DB2** pra acessar dados. Pratique no **IBM Z Xplore** pra ganhar experiência no ambiente real. E conheça o básico do **z/OS, TSO/ISPF e CICS**. Os recursos gratuitos da área são bons e específicos: além do IBM Z Xplore, há cursos abertos de COBOL e mainframe mantidos por iniciativas como o Open Mainframe Project.\n\nO perfil que prospera aqui, vale lembrar: gosta de lógica e atenção ao detalhe, tem paciência pra entender **código legado** (sistemas grandes e antigos, que você vai mais ler e manter do que criar do zero), e **valoriza estabilidade**. Se isso é você, o mainframe oferece uma combinação rara de demanda, baixa concorrência e segurança, num canto da tecnologia que poucos exploram e que sustenta, silenciosamente, boa parte do mundo financeiro.",
          resources: [
            {
              label: "IBM Z: plataforma e formação (oficial)",
              url: "https://www.ibm.com/z/",
              kind: "doc",
            },
            {
              label: "Open Mainframe Project (cursos abertos)",
              url: "https://www.openmainframeproject.org/",
              kind: "doc",
            },
          ],
        },
      ],
    },
  ],
};
