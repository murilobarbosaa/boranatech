import type { RoadmapV2 } from "../types";

export const qa: RoadmapV2 = {
  slug: "qa",
  area: "qa",
  title: "QA e Testes de Software do Zero",
  level: "Iniciante",
  description:
    "Dos fundamentos de qualidade e teste manual ao design de casos, teste de APIs e automação. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é garantir qualidade, a mentalidade de quem testa e onde o teste entra no desenvolvimento.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é QA",
          description:
            "Garantir que o software funcione bem, antes que o usuário descubra o contrário.",
          content:
            "QA (Quality Assurance, garantia de qualidade) é a área que cuida pra que o software funcione como deveria: sem bugs que atrapalham, fazendo o que promete e com boa experiência pra quem usa. O profissional de QA é quem testa, questiona e protege a qualidade antes que o produto chegue ao usuário final.\n\nO valor disso fica claro quando falta. Um bug que escapa pra produção pode custar caro: clientes frustrados, vendas perdidas, retrabalho às pressas, reputação arranhada. Existe um princípio conhecido na área: quanto mais cedo um defeito é encontrado, mais barato é corrigi-lo. Um problema pego no início custa pouco; o mesmo problema descoberto pelo cliente depois do lançamento custa muito mais. QA existe pra mover essa descoberta pra o mais cedo possível.\n\nNa prática, o profissional de QA cria casos de teste, executa testes (manuais e automatizados), reporta bugs com clareza e trabalha junto com os desenvolvedores pra que a qualidade seja construída, não remendada no fim. Não é um papel de oposição ao time de desenvolvimento; é de parceria por um objetivo comum.\n\nUm ponto que torna a área atraente: QA é uma das melhores **portas de entrada** pra tecnologia. Começa-se com testes manuais e documentação, que exigem mais organização e atenção que conhecimento técnico profundo, e evolui-se pra automação com o tempo. É um caminho acessível pra quem está migrando de carreira, com demanda constante no mercado. Esta trilha segue exatamente essa ordem, do manual ao automatizado.",
          resources: [
            {
              label:
                "ISTQB (organização internacional de certificação em testes)",
              url: "https://www.istqb.org/",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.qualidadeteste",
          title: "Qualidade e teste",
          description:
            "A diferença entre garantir qualidade e simplesmente testar.",
          content:
            'Dois termos andam juntos mas não são a mesma coisa, e entender a diferença molda como você enxerga o trabalho. **Testar** é a atividade de executar o software pra encontrar defeitos: rodar um caso, ver se o resultado bate com o esperado. **Garantir qualidade** (o QA) é mais amplo: é cuidar de todo o processo pra que a qualidade aconteça, não só caçar bugs no fim.\n\nA distinção tem consequência prática. Quem só testa entra em ação quando o software já está pronto, procurando o que deu errado. Quem pensa em qualidade participa antes: ajuda a esclarecer requisitos ambíguos (um requisito mal definido vira bug garantido), questiona casos que ninguém pensou, sugere melhorias de processo. A diferença entre as duas posturas é a diferença entre apagar incêndio e prevenir incêndio.\n\nUma verdade incômoda que todo profissional precisa aceitar: **testar não prova que o software é perfeito**. Por mais que você teste, é impossível verificar todas as combinações possíveis de uso. O teste mostra a **presença** de defeitos, nunca a ausência total deles. Por isso o trabalho é sobre **risco**: focar esforço onde uma falha seria mais provável ou mais grave, em vez de tentar, em vão, testar tudo.\n\nEssa mentalidade evita duas armadilhas: a falsa sensação de segurança ("passou nos testes, então está perfeito") e a paralisia de querer testar o infinito. Bom QA é teste inteligente, guiado por risco, somado ao cuidado com a qualidade ao longo de todo o processo.',
          resources: [
            {
              label: "ISTQB: Foundation Level (referência da área)",
              url: "https://www.istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.mindset",
          title: "A mentalidade de quem testa",
          description:
            "Pensar diferente do desenvolvedor: procurar onde quebra, não onde funciona.",
          content:
            'Existe uma mentalidade característica de QA, e desenvolvê-la importa tanto quanto qualquer ferramenta. Enquanto o desenvolvedor pensa em **fazer funcionar**, o profissional de QA pensa em **como isto pode quebrar**. São lentes complementares, e a tensão saudável entre elas é o que produz software robusto.\n\nNa prática, isso é uma curiosidade questionadora e uma atenção a detalhes acima da média. Onde o usuário comum vê uma tela funcionando, o QA pergunta: e se eu deixar este campo vazio? E se eu digitar um texto gigante? E se eu clicar duas vezes rápido? E se a internet cair no meio? E se a data for inválida? São os **casos de borda**, as situações fora do caminho feliz, onde os bugs mais se escondem.\n\nUm traço valioso é o ceticismo construtivo: não assumir que algo funciona só porque deveria funcionar, e verificar com os próprios olhos. "Deve estar ok" não é uma conclusão de QA; "testei e está ok" é.\n\nMas há um equilíbrio humano importante. A mentalidade de "quebrar as coisas" se aplica ao **software**, nunca às pessoas. Reportar um bug não é apontar culpado nem humilhar quem programou; é colaborar por um produto melhor. O bom QA é rigoroso com o sistema e gentil com as pessoas, mantendo uma relação de parceria com o time de desenvolvimento. Quem transforma bug em acusação azeda o ambiente e perde a colaboração que torna o trabalho eficaz.',
        },
        {
          id: "fundamentos.ciclo",
          title: "QA no ciclo de desenvolvimento",
          description:
            "Por que testar cedo e ao longo de todo o processo, não só no fim.",
          content:
            "Uma ideia desatualizada coloca o QA como a última etapa: o time constrói tudo e, no fim, joga pra o testador aprovar ou reprovar. Essa visão custa caro e gera atrito. A abordagem moderna integra a qualidade ao longo de **todo** o processo.\n\nO conceito-chave é o que se chama de testar cedo, às vezes resumido como mover o teste pra a esquerda da linha do tempo do projeto. Em vez de esperar o software ficar pronto, o QA se envolve desde o início: ao discutir um requisito, já pensa em como testá-lo e aponta ambiguidades; conforme o código nasce, já vai testando pedaços, em vez de acumular tudo pro final. Quanto antes um defeito aparece, mais barato e simples é corrigir, porque menos coisa foi construída em cima dele.\n\nIsso encaixa naturalmente no trabalho **ágil**, que você verá presente em quase todo time de tecnologia. Em ciclos curtos, o teste acontece dentro de cada ciclo, junto com o desenvolvimento, não numa fase separada depois de tudo. O QA participa das cerimônias do time, entende as prioridades e testa continuamente.\n\nA consequência cultural é importante: qualidade passa a ser responsabilidade de **todo o time**, não só do QA. O desenvolvedor também testa o próprio trabalho, todos se preocupam com qualidade, e o profissional de QA atua como especialista que potencializa esse cuidado coletivo, em vez de ser o único guardião no fim da linha. Entender esse posicionamento muda como você se integra ao time e multiplica seu impacto.",
        },
      ],
    },
    {
      id: "tipos",
      title: "Tipos e níveis de teste",
      description:
        "O vocabulário que organiza o que se testa, em que momento e de que ângulo.",
      level: "iniciante",
      children: [
        {
          id: "tipos.niveis",
          title: "Níveis de teste",
          description:
            "Do menor pedaço de código ao sistema inteiro, cada nível tem seu papel.",
          content:
            'Testes acontecem em diferentes **níveis**, do menor pedaço de código até o sistema completo. Conhecer essa escala ajuda a entender onde cada teste atua e por que todos importam.\n\nO **teste de unidade** verifica a menor parte isolada do software, como uma função sozinha. É rápido, barato e geralmente escrito pelos próprios desenvolvedores. O **teste de integração** verifica se partes diferentes funcionam bem **juntas**, porque peças que funcionam isoladas podem falhar ao se conectar (o front conversando com a API, a API com o banco).\n\nO **teste de sistema** verifica o software completo, de ponta a ponta, como um todo, simulando o uso real. E o **teste de aceitação** confirma se o sistema atende ao que o cliente ou o usuário realmente precisa, respondendo "isto é o que foi pedido?".\n\nUma forma de organizar isso visualmente é a **pirâmide de testes**, que você aprofunda na seção de automação: muitos testes de unidade na base (rápidos e baratos), menos de integração no meio, e poucos de ponta a ponta no topo (mais lentos e caros). A ideia é equilibrar custo e confiança.\n\nPra um QA iniciante, o foco prático costuma ser nos níveis mais altos (sistema e aceitação), olhando o produto pela perspectiva do usuário, que é onde o teste manual e a automação de interface atuam. Mas entender a escala inteira te ajuda a conversar com os desenvolvedores e a saber qual nível faz sentido pra cada situação, em vez de tentar testar tudo pelo nível mais caro.',
          resources: [
            {
              label: "ISTQB: Foundation Level (referência da área)",
              url: "https://www.istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/",
              kind: "doc",
            },
          ],
        },
        {
          id: "tipos.funcional",
          title: "Funcional e não-funcional",
          description:
            "Testar o que o sistema faz e também como ele se comporta.",
          content:
            'Os testes também se dividem por **o que** verificam, e há duas grandes categorias que cobrem ângulos diferentes da qualidade.\n\nO **teste funcional** verifica se o software faz o que deveria fazer: o login aceita a senha certa e recusa a errada, o cálculo do carrinho soma corretamente, o cadastro salva os dados. É a pergunta "funciona como esperado?", e é onde a maior parte do trabalho de QA começa, porque trata diretamente das funcionalidades que o usuário usa.\n\nO **teste não-funcional** verifica **como** o software se comporta, em qualidades que vão além da função em si. Os principais tipos vale conhecer: **desempenho** (o sistema é rápido? aguenta muitos usuários ao mesmo tempo?), **usabilidade** (é fácil e agradável de usar?), **segurança** (está protegido contra acessos e usos indevidos?), **compatibilidade** (funciona em diferentes navegadores, telas e dispositivos?).\n\nA diferença prática: um sistema pode passar em todos os testes funcionais (tudo funciona) e ainda assim ser ruim por motivos não-funcionais (lento demais, confuso, inseguro). Os dois lados importam pra qualidade real.\n\nPara quem começa, o foco inicial é quase sempre o funcional, que é mais direto e cobre o essencial. Os testes não-funcionais costumam ser mais especializados (teste de desempenho, por exemplo, é quase uma subárea própria). Mas ter o mapa completo na cabeça te faz lembrar de perguntar não só "funciona?", mas também "funciona bem, rápido, seguro e fácil?", o que distingue um QA atento de um que só confere o óbvio.',
        },
        {
          id: "tipos.caixa",
          title: "Caixa preta e caixa branca",
          description:
            "Testar olhando só o comportamento, ou também o código por dentro.",
          content:
            "Uma última forma de classificar testes é pela **perspectiva**: o quanto você enxerga do funcionamento interno do software ao testá-lo. Duas abordagens marcam os extremos.\n\nNo teste de **caixa preta**, você testa sem olhar o código interno, só pelo comportamento externo: dá uma entrada, observa a saída, verifica se está correta, como um usuário faria. Você não precisa saber **como** o sistema faz; só se ele faz certo. É a abordagem mais comum pra quem começa em QA, e a base do teste manual e de boa parte da automação de interface, porque foca na experiência real de quem usa.\n\nNo teste de **caixa branca**, você conhece o código por dentro e testa com base nessa estrutura, buscando exercitar os diferentes caminhos internos do programa. Exige saber programar e entender a implementação, e costuma ficar mais a cargo dos desenvolvedores, sendo típico do teste de unidade.\n\nExiste também um meio-termo, a **caixa cinza**, em que você tem algum conhecimento da estrutura interna (como o modelo do banco de dados ou as APIs envolvidas), mas testa principalmente pelo comportamento. É comum na prática: saber um pouco de como o sistema funciona por dentro ajuda a desenhar testes mais espertos, mesmo testando de fora.\n\nPara um QA iniciante, o foco é a caixa preta, que não exige programação profunda e já permite encontrar muitos defeitos. Conforme você cresce, especialmente rumo à automação e ao teste de APIs, vai naturalmente incorporando algum conhecimento interno, caminhando pra a caixa cinza.",
        },
      ],
    },
    {
      id: "design",
      title: "Design de testes",
      description:
        "A habilidade central do QA: criar bons casos de teste, planejá-los e reportar bem o que encontra.",
      level: "intermediario",
      children: [
        {
          id: "design.casos",
          title: "Casos de teste",
          description:
            "A unidade básica do trabalho: descrever o que testar e o resultado esperado.",
          content:
            'O **caso de teste** é a unidade básica do trabalho de QA: a descrição de uma verificação específica a ser feita. Um bom caso de teste deixa claro o que fazer e o que esperar, de forma que qualquer pessoa consiga executá-lo e chegar ao mesmo resultado.\n\nUm caso de teste costuma ter alguns elementos. As **pré-condições**: o que precisa estar pronto antes (por exemplo, um usuário cadastrado existir). Os **passos**: a sequência exata de ações a executar. E o **resultado esperado**: o que deve acontecer se o sistema estiver correto. Na hora de executar, você compara o resultado real com o esperado; se baterem, passou, se não, você encontrou um possível defeito.\n\n```\nCaso de teste (esqueleto):\n\nPré-condições:      o que precisa existir antes\nPassos:             a sequência exata de ações\nResultado esperado: o que o sistema deve fazer\n```\n\nA clareza é o que separa um bom caso de um inútil. "Testar o login" não é um caso de teste; é um desejo vago. "Com um usuário válido cadastrado, inserir email e senha corretos e clicar em entrar; esperado: usuário acessa a página inicial" é um caso de teste de verdade, executável e sem ambiguidade.\n\nUm bom conjunto de casos cobre mais que o caminho feliz. Para cada funcionalidade, você pensa em três frentes: o cenário positivo (tudo certo deve funcionar), os cenários negativos (dados inválidos devem ser recusados com clareza) e os casos de borda (limites, campos vazios, valores extremos). É justamente nos cenários negativos e de borda que moram os bugs que o teste apressado não pega.\n\nEscrever bons casos de teste é uma habilidade que se desenvolve com prática e que está no coração do trabalho de QA. Você domina esta etapa quando escreve um caso que outra pessoa executa e chega ao mesmo veredito que você, sem precisar adivinhar nada. A próxima parte mostra técnicas pra fazer isso de forma mais inteligente.',
        },
        {
          id: "design.tecnicas",
          title: "Técnicas de design de teste",
          description: "Métodos pra testar bem sem precisar testar o infinito.",
          content:
            'Como é impossível testar todas as combinações possíveis, existem **técnicas de design de teste** que ajudam a escolher os casos mais valiosos, cobrindo bastante com poucos testes bem pensados. Duas são fundamentais e fáceis de aplicar.\n\nA **partição de equivalência** parte de uma ideia simples: valores que o sistema trata da mesma forma não precisam ser testados um a um. Você os agrupa em classes e testa um representante de cada. Se um campo aceita idades de 18 a 65, não faz sentido testar 19, 20, 21, 22; testar um valor válido (digamos, 30) representa toda a faixa válida, e um valor inválido (10) representa os recusados. Isso reduz drasticamente o número de testes sem perder cobertura real.\n\nA **análise de valores limite** complementa, focando nas **bordas** das faixas, que é onde os erros mais aparecem. Programadores erram com frequência justamente nos limites (usar maior que em vez de maior ou igual, por exemplo). Para a faixa de 18 a 65, você testa os valores de fronteira: 17 e 18 (a borda de baixo), 65 e 66 (a borda de cima). Essa técnica caça uma categoria inteira de bugs comuns com pouquíssimos casos.\n\nHá outras técnicas mais avançadas, mas essas duas já transformam a forma como você testa: de "vou testando o que vier à cabeça" para "escolho casos representativos e focados nas bordas". O resultado é testar de forma mais inteligente, não mais exaustiva, encontrando mais defeitos com menos esforço. A documentação da área, como o material do ISTQB, detalha essas e outras técnicas.',
          resources: [
            {
              label: "ISTQB: Foundation Level (técnicas de teste)",
              url: "https://www.istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/",
              kind: "doc",
            },
          ],
        },
        {
          id: "design.dados",
          title: "Dados de teste",
          description:
            "O dado certo é metade do teste: massa, dado sintético e o perigo do dado real.",
          content:
            "Um caso de teste bem escrito ainda pode falhar por um motivo silencioso: o **dado** usado pra executá-lo. Testar o cadastro de um cliente exige um cliente; testar um pagamento recusado exige um cartão que recuse. Preparar esses dados, a **massa de teste**, é metade do trabalho de testar, e costuma ser subestimado por quem começa.\n\nHá algumas formas de conseguir essa massa, cada uma com seu cuidado. O **dado sintético** é criado de propósito pra o teste (um usuário fictício, um pedido inventado): é o mais seguro e controlável, porque você sabe exatamente o que ele contém e pode montar os casos de borda que precisa (o campo vazio, o valor no limite, o nome com acento). O **dado real de produção** é tentador porque parece realista, mas carrega um perigo sério: pode conter **dado sensível** de pessoas de verdade (nome, CPF, email, cartão), e usá-lo em teste é um risco de vazamento e, muitas vezes, uma violação de leis de proteção de dados como a LGPD. Se precisar partir de dados reais, eles devem ser **mascarados** (descaracterizados) antes.\n\nUm sintoma clássico de má gestão de dados de teste é o **teste que só passa na sua máquina**: funciona pra você porque seu ambiente tem aquele cliente cadastrado, mas quebra pra o colega ou no servidor de testes, que não têm o mesmo dado. Teste bom não depende de um dado que só existe no seu canto; ele **cria o que precisa** (as pré-condições que você viu nos casos de teste) e, de preferência, **limpa depois**, pra rodar igual em qualquer lugar e quantas vezes for.\n\nVocê domina esta etapa quando, ao desenhar um teste, já pensa de onde vem o dado que ele precisa, garante que não é informação sensível de gente real, e monta a massa de forma que o teste rode igual na sua máquina, na do time e no servidor.",
          resources: [
            {
              label: "LGPD: lei de proteção de dados (texto oficial)",
              url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm",
              kind: "doc",
            },
          ],
        },
        {
          id: "design.plano",
          title: "Plano de testes",
          description:
            "Organizar a estratégia de teste de um projeto ou funcionalidade.",
          content:
            "Quando o trabalho cresce além de alguns casos soltos, você precisa de um **plano de testes**: um documento que organiza a estratégia de teste de um projeto ou funcionalidade. Ele responde, antes de sair testando, o que será testado, como, por quem e até onde.\n\nUm plano de testes costuma cobrir alguns pontos. O **escopo**: o que será testado e, igualmente importante, o que **não** será (porque testar tudo é impossível, e deixar claro os limites evita expectativas erradas). A **abordagem**: que tipos e níveis de teste serão usados, manuais ou automatizados. Os **critérios**: o que define que o teste foi suficiente e que a qualidade está aceitável pra liberar. E os **riscos**: o que é mais crítico e merece mais atenção, guiando onde concentrar o esforço.\n\nEsse pensamento conecta com a mentalidade baseada em risco da área: como o tempo é limitado, o plano prioriza testar com mais profundidade as partes onde uma falha seria mais provável ou mais grave (o pagamento, o login), e menos as partes secundárias. Planejar é decidir conscientemente onde investir a atenção.\n\nUm plano não precisa ser um calhamaço; o tamanho se ajusta ao projeto. O valor está em **pensar a estratégia antes de executar**, em vez de testar no impulso e descobrir tarde que algo importante ficou de fora.\n\nEste é o exercício que transforma a teoria da seção em prática. O projeto vinculado te encomenda o **plano de testes de um aplicativo que você conhece**: o escopo (o que entra e o que fica de fora), a abordagem (que tipos e níveis de teste, manuais ou automatizados), os critérios que definem qualidade aceitável pra liberar, e os riscos que dizem onde concentrar o esforço. É uma das peças mais representativas de um portfólio de QA, porque mostra que você pensa a estratégia antes de sair testando. Você chega ao fim quando outra pessoa consegue ler o seu plano e saber exatamente o que será testado, com que profundidade, e por que essas escolhas, sem precisar te perguntar nada.",
          project: "plano-testes",
        },
        {
          id: "design.bugs",
          title: "Reportar bugs",
          description:
            "Comunicar um defeito de forma que ele possa ser entendido e corrigido.",
          content:
            'Encontrar um bug é metade do trabalho; a outra metade é **reportá-lo bem**. Um relatório de bug ruim gera idas e vindas, frustração e defeitos que não são corrigidos porque ninguém entendeu o problema. Um bom relatório faz o defeito ser compreendido e resolvido rápido, e é uma marca registrada do QA profissional.\n\nUm bom relatório de bug responde, com clareza, a algumas coisas. Um **título** objetivo que resume o problema. Os **passos pra reproduzir**: a sequência exata pra fazer o bug acontecer de novo, porque um defeito que o desenvolvedor não consegue reproduzir é quase impossível de corrigir. O **resultado esperado** versus o **resultado obtido**: o que deveria acontecer e o que de fato aconteceu. E o **ambiente**: onde ocorreu (navegador, dispositivo, versão), já que alguns bugs só aparecem em contextos específicos. Evidências como capturas de tela ou vídeo ajudam muito.\n\n```\nRelatório de bug (esqueleto):\n\nTítulo:             resumo objetivo do problema\nPassos:             1. ... 2. ... 3. ...\nResultado esperado: o que deveria acontecer\nResultado obtido:   o que de fato aconteceu\nAmbiente:           navegador / dispositivo / versão\nEvidência:          print ou vídeo\n```\n\nA **reprodutibilidade** é o ponto mais crítico. Antes de reportar, confirme que você consegue fazer o bug acontecer seguindo seus próprios passos. "Às vezes dá erro" é um relatório frustrante; "seguindo estes passos, o erro acontece sempre" é acionável.\n\nDuas qualidades de tom importam. **Objetividade**: descreva fatos, não suposições sobre a causa (o desenvolvedor investiga o porquê). E **respeito**: o relatório descreve um problema no software, não uma falha da pessoa que o escreveu. Bugs reportados com clareza e sem acusação mantêm a parceria com o time. Ferramentas como o Jira são onde esses relatórios costumam viver e ser acompanhados. Você domina esta etapa quando escreve um relatório que o desenvolvedor lê e reproduz o bug de primeira, sem precisar te procurar pra perguntar como.',
          resources: [
            {
              label: "Jira (Atlassian, página oficial)",
              url: "https://www.atlassian.com/software/jira",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "execucao",
      title: "Execução de testes",
      description:
        "Pôr a mão na massa testando de verdade, do roteiro fechado à exploração livre.",
      level: "intermediario",
      children: [
        {
          id: "execucao.manual",
          title: "Teste manual",
          description:
            "Executar testes como um usuário, o ponto de partida de todo QA.",
          content:
            'O **teste manual** é executar os testes você mesmo, interagindo com o software como um usuário faria: clicando, digitando, navegando, conferindo se cada coisa responde como esperado. É o ponto de partida de todo QA e continua sendo essencial, mesmo na era da automação.\n\nNa prática, você pega seus casos de teste e os executa um a um, registrando o resultado de cada um: passou ou falhou. Quando algo falha, você investiga, confirma que consegue reproduzir e reporta o bug. É um trabalho que exige atenção, paciência e organização, qualidades mais importantes aqui do que conhecimento técnico avançado, o que torna o teste manual a porta de entrada acessível da área.\n\nHá uma tentação, vinda do hype da automação, de menosprezar o teste manual como "coisa de iniciante". É um engano. Algumas verificações são difíceis ou caras de automatizar e fazem mais sentido manualmente; a avaliação de usabilidade e da experiência real depende do olhar humano; e testar funcionalidades novas, ainda instáveis, costuma começar manual antes de valer a pena automatizar. O teste manual e o automatizado se complementam, não competem.\n\nUm cuidado: teste manual repetitivo e sempre igual cansa e perde eficácia, porque a atenção cai e você passa a executar no piloto automático, deixando defeitos passarem. É justamente esse tipo de teste repetitivo (como a regressão, que você verá adiante) o melhor candidato à automação, liberando você pro teste que exige raciocínio humano. Dominar bem o manual é a base sobre a qual a automação faz sentido depois.',
        },
        {
          id: "execucao.exploratorio",
          title: "Teste exploratório",
          description:
            "Investigar o software livremente, usando criatividade e experiência.",
          content:
            'Nem todo teste segue um roteiro fechado. O **teste exploratório** é uma abordagem em que você investiga o software de forma mais livre, aprendendo sobre ele enquanto testa, projetando e executando casos ao mesmo tempo, guiado pela sua experiência e curiosidade.\n\nDiferente do teste roteirizado, onde você segue casos definidos de antemão, no exploratório você parte de uma área ou objetivo ("vou explorar o fluxo de checkout") e vai seguindo as pistas: algo pareceu estranho aqui, deixe-me cutucar mais; e se eu tentar isto? Cada descoberta orienta o próximo passo. É menos previsível e mais investigativo, como um detetive seguindo evidências.\n\nO valor do exploratório é encontrar o que os casos planejados não previram. Casos de teste cobrem o que você **pensou** antes; a exploração descobre o que ninguém imaginou, justamente os bugs mais surpreendentes e, às vezes, mais graves. Ele aproveita ao máximo a mentalidade questionadora do QA e a capacidade humana de notar o inesperado.\n\nMas exploratório não é bagunça nem clicar à toa. Boas práticas dão estrutura: definir um foco e um tempo pra cada sessão de exploração, e anotar o que você testou e o que encontrou, pra o trabalho ser rastreável e não se perder. É liberdade com propósito, não ausência de método.\n\nNa prática, o melhor é combinar as duas abordagens: o teste roteirizado garante que o essencial e o conhecido sejam sempre verificados, e o exploratório descobre o desconhecido. QA maduro usa as duas conforme a situação, sabendo que cada uma pega defeitos que a outra deixa passar.',
        },
        {
          id: "execucao.regressao",
          title: "Regressão e smoke",
          description:
            "Garantir que o que funcionava continua funcionando após mudanças.",
          content:
            'Duas práticas de teste aparecem o tempo todo no dia a dia e merecem nome próprio, porque resolvem problemas recorrentes do desenvolvimento.\n\nO **teste de regressão** verifica se mudanças recentes no software não quebraram o que já funcionava. Isso é mais comum do que parece: ao corrigir um bug ou adicionar uma funcionalidade, é fácil, sem querer, estragar outra parte que dependia daquele código. Regressão é o nome do termo "regredir": algo que estava bom voltou a ficar ruim. Por isso, a cada nova versão, vale reexecutar testes de funcionalidades que já passavam, pra confirmar que continuam de pé.\n\nO problema é que regressão completa é repetitiva e cresce sem parar: quanto mais o sistema tem funcionalidades, mais coisas reverificar a cada mudança. É exatamente por isso que a regressão é a **principal candidata à automação**: tarefas repetitivas, sempre iguais, que o computador faz mais rápido e sem cansaço. Esse é um dos maiores motivos pra automatizar testes, tema da seção seguinte.\n\nO **smoke test** (teste de fumaça) é um conjunto pequeno e rápido de verificações das funcionalidades mais essenciais, feito logo após uma nova versão pra responder uma pergunta básica: "o sistema está minimamente de pé pra valer a pena testar o resto?". O nome vem da ideia de ligar um aparelho e ver se sai fumaça. Se o smoke test falha (o login nem abre, a página principal não carrega), nem adianta partir pros testes detalhados; volta logo pro time corrigir.\n\nJuntas, essas práticas protegem a estabilidade: o smoke test dá um sinal rápido de saúde, e a regressão garante que o progresso não venha às custas de quebrar o que já existia.',
        },
      ],
    },
    {
      id: "apis",
      title: "Teste de APIs",
      description:
        "Testar a camada por baixo da interface, onde os sistemas trocam dados, e como ela se comporta sob carga.",
      level: "intermediario",
      children: [
        {
          id: "apis.postman",
          title: "Testar APIs com Postman",
          description:
            "Verificar a comunicação entre sistemas, sem passar pela tela.",
          content:
            "Boa parte do software se comunica por **APIs**, as interfaces por onde os sistemas trocam dados (o app conversando com o servidor, um serviço chamando outro). Testar APIs diretamente, sem passar pela tela, é uma habilidade muito valorizada em QA, porque pega problemas na fonte e independe da interface visual.\n\nVale relembrar o básico: a comunicação web acontece por requisições e respostas. O cliente faz uma requisição (com um método como GET pra buscar ou POST pra criar, e às vezes dados no corpo) e o servidor responde com um código de status (a faixa 200 é sucesso, 400 é erro de quem pediu, 500 é erro do servidor) e, em geral, dados em formato JSON. Testar uma API é fazer essas requisições e verificar se as respostas vêm corretas.\n\nA ferramenta mais usada pra isso é o **Postman**, que permite montar requisições, enviá-las e inspecionar as respostas de forma visual e amigável, sem precisar programar. Com ele você verifica se o status retornado é o esperado, se os dados da resposta estão corretos e se a API lida bem com entradas inválidas (mandar dados errados de propósito e conferir se ela recusa com o erro certo, em vez de quebrar).\n\nTestar API tem vantagens sobre testar só pela interface. É mais **rápido e estável**, porque não depende de telas que mudam de aparência. E pega problemas **mais cedo e mais fundo**: às vezes a tela parece ok, mas a API por baixo já está devolvendo dados errados, ou o contrário. O Postman permite ainda agrupar requisições em coleções e montar verificações automatizadas simples, um primeiro passo natural rumo à automação que você vê a seguir.",
          resources: [
            {
              label: "Postman: documentação oficial (Learning Center)",
              url: "https://learning.postman.com/docs/",
              kind: "doc",
            },
          ],
        },
        {
          id: "apis.performance",
          title: "Noções de teste de performance",
          description:
            "Como o sistema se comporta sob carga: tempo de resposta, throughput e ponto de quebra.",
          content:
            'Um sistema pode estar 100% correto e ainda assim ser inutilizável se for lento ou cair quando muita gente usa ao mesmo tempo. Verificar isso é o **teste de performance** (ou de desempenho), um tipo de teste não-funcional que pergunta não "funciona?", mas "funciona bem sob pressão?". Na prática, ele é quase sempre feito contra a **API** ou o serviço por baixo da interface, disparando muitas chamadas de uma vez pra ver como o sistema aguenta, o que conecta direto com o teste de APIs desta seção.\n\nAlguns conceitos organizam a área. O **teste de carga** simula o volume de uso esperado (por exemplo, mil usuários simultâneos) pra confirmar que o sistema aguenta o dia a dia. O **teste de estresse** vai além do esperado de propósito, aumentando a carga até o sistema falhar, pra descobrir o **ponto de quebra**: o limite a partir do qual ele deixa de responder. Saber onde fica esse limite é o que permite planejar com folga, em vez de descobrir na pior hora.\n\nDuas medidas resumem o comportamento sob carga. O **tempo de resposta** é quanto o sistema demora pra responder a uma requisição (importa não só a média, mas os piores casos, os usuários mais lentos). O **throughput** é quantas requisições ele processa por segundo, uma medida da sua capacidade real. Juntos, respondem se a experiência continua aceitável quando a casa enche.\n\nUm cuidado de maturidade: teste de performance tem hora. Não faz sentido otimizar a carga de algo que ainda muda toda semana ou que nunca terá muitos usuários. Ele **vale a pena** quando o volume é real e a lentidão custa caro (uma loja em dia de promoção, um sistema com prazo apertado de resposta). Ferramentas como o k6 e o JMeter automatizam esse tipo de teste, mas o primeiro passo é entender o que medir. Você entende esta etapa quando consegue dizer, pra um sistema qualquer, quantos usuários ele precisa aguentar, em quanto tempo cada resposta é aceitável, e a partir de que ponto ele começa a sofrer.',
          resources: [
            {
              label: "k6: documentação oficial (teste de carga)",
              url: "https://grafana.com/docs/k6/latest/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "automacao",
      title: "Automação de testes",
      description:
        "Fazer o computador executar testes repetitivos, liberando você pro que exige raciocínio.",
      level: "avancado",
      children: [
        {
          id: "automacao.porque",
          title: "Por que e quando automatizar",
          description:
            "Os ganhos reais da automação e a armadilha de querer automatizar tudo.",
          content:
            'A **automação de testes** é escrever código que executa testes automaticamente, em vez de você fazer tudo na mão. É uma habilidade que valoriza muito o profissional de QA e amplia o que ele consegue cobrir, mas precisa ser entendida com equilíbrio, porque o hype esconde armadilhas.\n\nOs ganhos são claros nos casos certos. Testes automatizados são **rápidos** (rodam em segundos o que levaria horas manualmente), **repetíveis** (executam exatamente igual toda vez, sem o cansaço humano que deixa passar defeitos) e podem rodar com **frequência** (a cada mudança no código, automaticamente). O caso de uso clássico é a regressão: reverificar, a cada versão, que o que funcionava continua funcionando.\n\nMas automatizar tem custo: escrever e, principalmente, **manter** os testes automatizados dá trabalho. Quando a interface muda, os testes precisam ser ajustados, ou começam a falhar por motivos errados. Por isso, automação não é gratuita nem sempre vale a pena.\n\nA decisão sábia é seletiva. Bons candidatos à automação: testes repetitivos, executados com frequência, de funcionalidades estáveis e críticas. Maus candidatos: funcionalidades que ainda mudam muito (os testes viveriam quebrando), verificações pontuais feitas uma vez só, e a avaliação de usabilidade e experiência, que dependem do olhar humano.\n\nA mentalidade errada é "automatizar tudo", que gera um monte de testes frágeis e caros de manter, que mais atrapalham que ajudam. A certa é automatizar **o que dá o melhor retorno**, mantendo o teste manual e exploratório pro que exige raciocínio. Automação amplia o QA; não substitui o pensamento dele.',
        },
        {
          id: "automacao.piramide",
          title: "A pirâmide de testes",
          description:
            "Como equilibrar tipos de teste automatizado por custo e velocidade.",
          content:
            'Ao automatizar, surge a pergunta de **quanto** automatizar em cada nível, e um modelo clássico orienta isso: a **pirâmide de testes**. Ela propõe uma proporção saudável entre os tipos de teste automatizado, equilibrando custo, velocidade e confiança.\n\nNa **base**, larga, ficam os **testes de unidade**: muitos deles, porque são rápidos, baratos e estáveis. Eles verificam pedaços isolados do código e dão um retorno quase instantâneo quando algo quebra. No **meio**, em menor quantidade, os **testes de integração**, que verificam partes funcionando juntas. No **topo**, estreito, poucos **testes de ponta a ponta** (end-to-end), que simulam o usuário usando o sistema inteiro pela interface.\n\nA lógica da forma é importante. Os testes de ponta a ponta dão muita confiança (testam o sistema como o usuário o vê), mas são **lentos, caros de escrever e frágeis**: qualquer mudança na tela pode quebrá-los, e eles falham por motivos difíceis de diagnosticar. Por isso ficam no topo, em pouca quantidade, reservados aos fluxos mais críticos. Os de unidade, na base abundante, sustentam a maior parte da confiança a baixo custo.\n\nO **antipadrão** mais comum é a pirâmide invertida (ou o "cone de sorvete"): muitos testes de ponta a ponta e poucos de unidade. O resultado é uma suíte lenta, instável e dolorosa de manter, que as pessoas acabam ignorando quando falha. Como QA, especialmente vindo do teste de interface, é tentador querer automatizar tudo pelo topo; entender a pirâmide te ajuda a defender a proporção certa junto ao time. A maior parte do trabalho de automação de interface do QA vive justamente nesse topo, então usá-lo com parcimônia, nos fluxos que mais importam, é o caminho.',
        },
        {
          id: "automacao.ferramentas",
          title: "Ferramentas de automação",
          description:
            "As ferramentas que automatizam testes de interface e o que considerar ao escolher.",
          content:
            "Para automatizar testes de interface (os de ponta a ponta, no topo da pirâmide), existem ferramentas dedicadas que controlam o navegador automaticamente, simulando um usuário: abrindo páginas, clicando, preenchendo campos e verificando resultados. Conhecer ao menos uma é esperado de um QA que avança pra automação.\n\nEntre as mais usadas hoje estão o **Cypress** e o **Playwright**, ambas modernas, com boa documentação e foco em testar aplicações web. O **Selenium** é a ferramenta mais antiga e tradicional da categoria, ainda muito presente no mercado e em vagas. As três resolvem o mesmo problema central de formas diferentes, e a boa notícia é que os **conceitos são os mesmos**: localizar elementos na tela, interagir com eles e fazer afirmações sobre o que deveria acontecer. Quem aprende uma migra pra outra sem recomeçar.\n\nUm conselho de foco pra não se dispersar: escolha **uma** ferramenta e aprenda bem, em vez de arranhar a superfície de várias. Se possível, escolha a que o mercado ou a empresa que você mira usa. A automação exige alguma noção de programação (geralmente JavaScript no caso de Cypress e Playwright), então é aqui que o QA encosta no mundo do código, mas começa-se com o básico, sem precisar ser desenvolvedor.\n\nUm cuidado recorrente na automação de interface são os **testes instáveis** (flaky): aqueles que às vezes passam e às vezes falham sem mudança real, geralmente por questões de tempo (a tela ainda não carregou quando o teste tentou clicar). Eles minam a confiança na suíte inteira, porque ninguém sabe se a falha é real. Aprender a escrever testes estáveis, que esperam os elementos corretamente, é parte essencial do ofício.",
          resources: [
            {
              label: "Cypress: documentação oficial",
              url: "https://docs.cypress.io/",
              kind: "doc",
            },
            {
              label: "Playwright: introdução (documentação oficial)",
              url: "https://playwright.dev/docs/intro",
              kind: "doc",
            },
            {
              label: "Selenium: documentação oficial",
              url: "https://www.selenium.dev/documentation/",
              kind: "doc",
            },
          ],
        },
        {
          id: "automacao.ci",
          title: "Testes no CI/CD",
          description:
            "Rodar os testes automaticamente a cada mudança, antes de chegar em produção.",
          content:
            "O verdadeiro poder da automação se realiza quando os testes rodam **sozinhos, a cada mudança**, sem ninguém precisar lembrar de executá-los. Isso acontece dentro do **CI/CD** (integração e entrega contínuas), o fluxo automatizado que muitos times usam pra construir e publicar software.\n\nA ideia é simples e poderosa. Cada vez que um desenvolvedor envia uma alteração de código, um serviço de CI baixa o código num ambiente limpo e roda automaticamente as verificações: os testes automatizados, entre elas. Se algum teste falha, a mudança é barrada (fica marcada em vermelho) e não avança até ser corrigida. Assim, código que quebra algo é pego **antes** de chegar à produção, em vez de depois, pelo usuário.\n\nPara o QA, isso muda o jogo. Seus testes automatizados deixam de ser algo que você roda de vez em quando e viram uma **rede de proteção contínua**, que vigia a qualidade a cada commit, sem esforço manual. A regressão, antes trabalhosa e esquecível, passa a acontecer automaticamente o tempo todo.\n\nUma ferramenta comum pra montar esses fluxos é o GitHub Actions, integrado ao repositório, mas o conceito vale pra qualquer uma. Você não precisa ser especialista em configurar pipelines pra começar, mas entender como o CI funciona e como seus testes se encaixam nele é o que torna a automação de QA realmente valiosa pro time.\n\nEsse é o ponto onde QA, automação e desenvolvimento se encontram: a qualidade vira parte automática do processo de entrega, não uma etapa separada e opcional. Demonstrar que você entende esse fluxo é um diferencial forte na carreira.",
          resources: [
            {
              label: "GitHub Actions (documentação oficial)",
              url: "https://docs.github.com/pt/actions",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "carreira",
      title: "Certificação e carreira",
      description:
        "Validar conhecimento com a certificação mais reconhecida e dar os primeiros passos na área.",
      level: "avancado",
      children: [
        {
          id: "carreira.istqb",
          title: "Certificação ISTQB",
          description:
            "A certificação mais reconhecida da área de testes, e como ela ajuda.",
          content:
            "Na área de QA, a certificação mais reconhecida internacionalmente é a do **ISTQB** (International Software Testing Qualifications Board), uma organização que padroniza conhecimento em testes de software. A porta de entrada é a certificação de nível fundamental (Foundation Level), voltada justamente a quem está começando.\n\nO que a torna valiosa pra iniciantes é que ela cobre exatamente os fundamentos desta trilha: o que é teste, os tipos e níveis, as técnicas de design de casos, o processo de teste e o vocabulário padronizado da área. Estudar pra ela organiza o aprendizado e dá uma base teórica sólida, além de ser amplamente pedida e valorizada no mercado, funcionando como um selo que abre portas em recrutamento.\n\nUm ganho menos óbvio é o **vocabulário comum**. A área de testes tem muitos termos que às vezes são usados de formas diferentes por pessoas diferentes; o ISTQB padroniza esses conceitos, o que ajuda você a se comunicar com clareza e a entender vagas e materiais técnicos. Falar a língua padrão da área é um diferencial prático.\n\nO conselho de equilíbrio vale aqui como nas outras áreas: a certificação ajuda a entrar e a estruturar o estudo, mas não substitui prática real. O ideal é estudar pra ela com a intenção de **entender de verdade**, não de decorar respostas, e combiná-la com prática concreta, como os projetos desta trilha. Uma certificação acompanhada de planos de teste escritos, bugs bem reportados e alguma automação demonstrável vale muito mais que o certificado sozinho.",
          resources: [
            {
              label: "ISTQB: Certified Tester Foundation Level (oficial)",
              url: "https://www.istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/",
              kind: "doc",
            },
          ],
        },
        {
          id: "carreira.entrar",
          title: "Entrar na carreira",
          description:
            "Por que QA é uma das melhores portas de entrada para a tecnologia.",
          optional: true,
          content:
            "QA é frequentemente apontada como uma das **melhores portas de entrada** para a tecnologia, e por bons motivos. O teste manual e a documentação, onde se começa, exigem mais organização, atenção a detalhes e raciocínio do que conhecimento técnico profundo, o que torna a área acessível pra quem está migrando de carreira sem formação em programação.\n\nA fórmula pra entrar combina algumas peças. **Fundamentos sólidos**, que você consegue explicar com clareza: o que é qualidade, como desenhar bons casos, como reportar um bug. A **certificação ISTQB Foundation**, que passa por filtros de recrutamento e organiza o estudo. E, principalmente, **prática demonstrável**: um plano de testes para um app real que você usa, uma coleção de bugs bem documentados, casos de teste escritos com capricho, e, conforme avança, uma automação simples de um fluxo. Esse material funciona como portfólio e prova que você sabe fazer, não só falar.\n\nUm caminho natural de evolução existe na própria área. Muita gente entra como analista de QA focado em testes manuais e, com o tempo, aprende automação e migra pra QA Engineer, um perfil mais técnico e mais bem remunerado. Não é preciso saber automatizar pra começar; é preciso querer aprender ao longo do caminho.\n\nDuas qualidades pesam tanto quanto a técnica. A **atenção a detalhes** e a curiosidade questionadora, que são a essência do bom testador e que você pode demonstrar na forma como aborda os exercícios. E a **comunicação**, porque grande parte do trabalho é reportar problemas com clareza e colaborar com o time, sempre com a postura de parceria, não de oposição. Quem traz organização, olhar crítico e bom relacionamento encontra na QA um caminho concreto e acessível pra tecnologia.",
        },
      ],
    },
  ],
};
