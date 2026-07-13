import type { RoadmapV2 } from "../types";

export const analiseSistemas: RoadmapV2 = {
  slug: "analise-sistemas",
  area: "analise-sistemas",
  title: "Análise de Sistemas do Zero",
  level: "Iniciante",
  description:
    "De levantar requisitos a modelar processos e validar entregas: a ponte entre o negócio e o time de desenvolvimento. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que faz um analista de sistemas e como o papel difere de produto e gestão.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é análise de sistemas",
          description:
            "Entender o problema do negócio e traduzi-lo em requisitos claros para o time técnico.",
          content:
            'O analista de sistemas é quem faz a **ponte entre o negócio e a tecnologia**. De um lado, estão as pessoas com um problema ou uma necessidade (uma área da empresa, os usuários, os clientes); do outro, o time de desenvolvimento, que vai construir a solução. O analista entende a fundo o que o negócio precisa e traduz isso em **requisitos claros** que o time consegue construir.\n\nNa prática, o trabalho envolve conversar muito: levantar necessidades com usuários e áreas de negócio, documentar processos e regras, modelar a solução em diagramas e casos de uso, alinhar expectativas entre os dois mundos, e acompanhar os testes pra garantir que o que foi construído resolve o problema certo. É um papel de organização, comunicação e visão de processos.\n\nO perfil que combina com a área é bem específico, e atrai muita gente: alguém que gosta de **organizar ideias, conversar com pessoas e entender como as coisas funcionam**, unindo raciocínio lógico com boa comunicação. É ideal pra quem curte tecnologia mas **não quer passar o dia inteiro programando**. Você precisa entender de tecnologia o suficiente pra conversar com os desenvolvedores, mas seu trabalho central é compreender e comunicar, não codar.\n\nUm tema vai se repetir como o coração da profissão: traduzir necessidades vagas e às vezes contraditórias em especificações claras e construíveis. "O cliente quer um sistema melhor" não é construível; cabe ao analista transformar isso em requisitos concretos que o time possa transformar em software. Esta trilha te leva do levantamento de requisitos à modelagem e validação, sempre com a comunicação como fio condutor.',
        },
        {
          id: "fundamentos.ponte",
          title: "Negócio, produto e gestão",
          description:
            "Como o analista de sistemas se distingue de papéis vizinhos que se confundem.",
          content:
            "A análise de sistemas convive com papéis vizinhos que se sobrepõem e confundem: produto, gestão de projetos e análise de negócios. Entender as diferenças ajuda a posicionar o seu trabalho e a escolher sua direção.\n\nO **gerente de produto** decide **o que** construir e **por quê**, focado na estratégia, na visão do produto e no valor pro usuário e pro negócio. Olha pra o futuro do produto. O **gerente de projetos** (ou Scrum Master) foca em **como entregar**: coordena o time, os prazos e o processo pra que a construção aconteça. O **analista de sistemas** foca em **o que exatamente** será construído, no nível de detalhe: pega a necessidade e a transforma em requisitos, regras e modelos precisos que o time de desenvolvimento usa pra construir.\n\nUma forma de ver a diferença: o produto define a direção, a gestão organiza a jornada, e a análise de sistemas desenha o mapa detalhado do que precisa ser feito. Há um papel muito próximo, o **analista de negócios**, que em muitos lugares se sobrepõe quase totalmente ao analista de sistemas, com ênfase um pouco maior nos processos de negócio.\n\nNa realidade das empresas, esses papéis se misturam bastante, e os títulos variam. Em times pequenos, uma pessoa pode acumular vários. Mas a competência central da análise de sistemas é distinta e valiosa: a **engenharia de requisitos**, a habilidade de elicitar, documentar e modelar com precisão o que um sistema deve fazer. É nisso que esta trilha foca, e é o que diferencia o analista dos demais. Se você gosta mais de **detalhar e modelar a solução** do que de definir estratégia ou coordenar times, a análise de sistemas é a sua área.",
        },
      ],
    },
    {
      id: "tecnica",
      title: "Base técnica",
      description:
        "O suficiente de tecnologia pra conversar de igual pra igual com o time de desenvolvimento.",
      level: "iniciante",
      children: [
        {
          id: "tecnica.logica",
          title: "Lógica de programação",
          description:
            "Entender como o software pensa, sem precisar programar o dia todo.",
          content:
            'O analista de sistemas não precisa ser programador, mas precisa **entender como o software funciona** pra conversar bem com o time e escrever requisitos viáveis. A base disso é a lógica de programação, e mesmo um conhecimento introdutório faz uma diferença enorme.\n\nO que vale entender. Os conceitos fundamentais: variáveis (dados que o sistema guarda), condicionais ("se isto, então aquilo", que é como as regras de negócio viram código), laços (repetições) e a ideia de que um programa segue uma sequência lógica de passos. Você não precisa dominar a sintaxe de uma linguagem específica, mas precisa pensar de forma estruturada, decompondo um problema em passos lógicos.\n\nPor que isso importa tanto pro analista? Porque te permite escrever requisitos que fazem **sentido técnico**. Quando você entende como o software toma decisões, você documenta regras de negócio de forma clara e completa, antecipando os casos que o desenvolvedor precisará tratar ("e se o campo estiver vazio?", "e se o valor for negativo?"). Um analista que pensa logicamente escreve especificações que o time consegue construir sem mil idas e vindas.\n\nAlém disso, entender lógica facilita a conversa: você compreende quando o desenvolvedor diz que algo é complexo ou inviável, e consegue negociar alternativas. Falar minimamente a língua do time constrói respeito e parceria.\n\nNão precisa virar dev; um curso introdutório de lógica e algoritmos já cobre o essencial. Pratique pensando em como pequenos problemas do dia a dia poderiam ser resolvidos passo a passo, de forma estruturada. Essa forma de raciocinar é uma ferramenta que você usará em toda especificação que escrever.',
          resources: [
            {
              label: "Python: tutorial oficial (base de lógica, em português)",
              url: "https://docs.python.org/pt-br/3/tutorial/",
              kind: "doc",
            },
          ],
        },
        {
          id: "tecnica.sql",
          title: "SQL básico",
          description:
            "Conversar com os dados e entender a estrutura dos sistemas.",
          content:
            "Quase todo sistema guarda dados num banco de dados, e saber o **básico de SQL** é uma das habilidades mais úteis pro analista de sistemas. Não pra administrar bancos, mas pra entender a estrutura dos dados e conseguir respostas por conta própria.\n\nO SQL é a linguagem pra consultar bancos de dados, e é surpreendentemente legível. O comando central é o `SELECT`, que busca dados: `SELECT nome FROM clientes WHERE cidade = 'Recife'` traz os clientes de Recife. Com poucos elementos (`SELECT` pra escolher colunas, `WHERE` pra filtrar, `ORDER BY` pra ordenar), você já consegue explorar os dados de um sistema.\n\nPor que isso é valioso pro analista? Por vários motivos práticos. Você consegue **investigar dados** pra entender melhor um processo ou validar uma regra (\"quantos pedidos ficam parados nesse status?\"), sem depender de pedir tudo pro time de dados. Você entende a **estrutura** das informações que o sistema manipula, o que ajuda a escrever requisitos coerentes com o modelo de dados existente. E você consegue **validar entregas** conferindo se os dados estão sendo gravados corretamente.\n\nUm conhecimento básico já abre muitas portas: saber consultar uma ou duas tabelas, filtrar e contar registros cobre boa parte das necessidades do dia a dia. Conforme você avança, entender como tabelas se relacionam (as chaves que ligam clientes a pedidos, por exemplo) aprofunda sua compreensão dos sistemas.\n\nO PostgreSQL é gratuito pra praticar, e o próprio tutorial oficial ensina SQL de forma direta. Junto com a lógica de programação, o SQL te dá a fluência técnica pra ser um analista que o time leva a sério.",
          resources: [
            {
              label: "PostgreSQL: tutorial de SQL (oficial)",
              url: "https://www.postgresql.org/docs/current/tutorial-sql.html",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "requisitos",
      title: "Engenharia de requisitos",
      description:
        "A competência central do analista: descobrir, entender e documentar o que o sistema precisa fazer.",
      level: "intermediario",
      children: [
        {
          id: "requisitos.levantamento",
          title: "Levantamento de requisitos",
          description:
            "Descobrir o que as pessoas realmente precisam, não só o que pedem.",
          content:
            'O **levantamento de requisitos** (ou elicitação) é o coração do trabalho do analista: descobrir, junto às pessoas, o que o sistema precisa fazer. E é mais difícil do que parece, porque as pessoas raramente sabem expressar com clareza o que precisam.\n\nA técnica principal são as **entrevistas e conversas** com os usuários e as áreas de negócio. E aqui há uma armadilha clássica: as pessoas costumam pedir **soluções**, não descrever **problemas**. Alguém diz "preciso de um botão de exportar relatório", quando o problema real é "preciso compartilhar esses dados com meu chefe toda semana", que talvez tenha uma solução melhor. O bom analista investiga o problema por trás do pedido, perguntando "por quê?" e "o que você está tentando resolver?".\n\nFazer **boas perguntas** é a habilidade número um aqui. Perguntas abertas que revelam o contexto ("me conta como você faz isso hoje"), perguntas que expõem exceções ("e quando dá errado, o que acontece?"), e a paciência de escutar de verdade em vez de já sair propondo solução. Observar as pessoas trabalhando, quando possível, revela ainda mais que perguntar, porque o que elas fazem nem sempre é o que dizem fazer.\n\nOutras fontes complementam as entrevistas: analisar documentos e sistemas existentes, observar processos, e conversar com diferentes **stakeholders**, porque pessoas diferentes têm visões diferentes (e às vezes conflitantes) da mesma necessidade. Parte do trabalho é reconciliar essas visões.\n\nO objetivo final é entender o problema fundo o suficiente pra documentá-lo com precisão. Levantar requisitos mal é a causa raiz de muitos projetos que falham: o time constrói direito a coisa errada. Por isso essa etapa, feita com cuidado, é onde o analista mais agrega valor. Você domina esta etapa quando, diante de um pedido já embrulhado como solução ("quero um botão de exportar"), consegue recuar até o problema real por trás dele antes de especificar qualquer coisa.',
          resources: [
            {
              label:
                "IIBA: instituto de análise de negócios (referência da área)",
              url: "https://www.iiba.org/",
              kind: "doc",
            },
          ],
        },
        {
          id: "requisitos.tipos",
          title: "Tipos de requisitos",
          description:
            "Distinguir o que o sistema faz, como ele se comporta e as regras do negócio.",
          content:
            'Nem todo requisito é igual, e classificá-los ajuda o analista a não esquecer dimensões importantes. Há algumas distinções fundamentais.\n\nOs **requisitos funcionais** descrevem **o que** o sistema deve fazer: as funcionalidades e comportamentos. "O sistema deve permitir cadastrar um cliente", "deve enviar um email de confirmação após a compra". É a parte mais visível e a primeira que vem à cabeça.\n\nOs **requisitos não-funcionais** descrevem **como** o sistema deve se comportar, em qualidades que vão além da função: desempenho ("a busca deve responder em menos de 2 segundos"), segurança, usabilidade, disponibilidade, capacidade. São frequentemente esquecidos por iniciantes, mas decisivos: um sistema pode fazer tudo certo funcionalmente e ainda ser inutilizável por ser lento ou inseguro. O bom analista lembra de perguntar sobre eles.\n\nAs **regras de negócio** são as políticas e restrições do negócio que o sistema deve respeitar: "um desconto acima de 20% precisa de aprovação do gerente", "um cliente inadimplente não pode fazer novo pedido". Elas costumam ser a parte mais complexa e mais sujeita a exceções, e documentá-las com clareza e completude (incluindo os casos de exceção) é onde o analista realmente brilha.\n\nUma distinção prática útil: separar o que é **necessidade** (o problema a resolver) do que é **solução** (uma forma de resolver). Documentar a necessidade dá liberdade pro time encontrar a melhor solução; cravar a solução cedo demais pode engessar o que poderia ser feito melhor.\n\nClassificar bem os requisitos garante que você cobriu o problema por inteiro, sem deixar buracos que viram retrabalho ou bugs depois. É uma checklist mental que separa uma especificação completa de uma cheia de furos.',
        },
        {
          id: "requisitos.integracoes",
          title: "Integrações e contratos de API",
          description:
            "Especificar como o sistema conversa com outros, antes de alguém programar.",
          content:
            "Nenhum sistema vive sozinho. O checkout chama o meio de pagamento, o cadastro consulta a base de CEP, o relatório puxa dados de outro serviço. Cada uma dessas conversas é uma **integração**: um sistema chamando outro pra pedir ou enviar informação. Especificar bem essas integrações é uma parte do trabalho do analista que costuma passar batida, até o projeto travar por causa dela.\n\nO centro de uma integração é o **contrato**: o acordo de como os dois sistemas se falam. Um bom contrato responde três perguntas. O que **entra** (quais dados o outro sistema espera receber, em que formato)? O que **sai** (o que ele devolve quando dá certo)? E, a pergunta mais esquecida e mais importante, o que acontece **quando dá errado** (o pagamento é recusado, o serviço está fora do ar, a resposta demora demais)? Especificar só o caminho feliz é a origem clássica de integrações que quebram em produção. Como qualquer requisito, o contrato precisa ser específico e sem ambiguidade.\n\nPra escrever esse contrato, você precisa de um vocabulário mínimo pra conversar com o time. A **API** é a porta pela qual um sistema oferece seus serviços a outro. Um **endpoint** é um endereço específico dessa porta (o de criar pedido, o de consultar saldo). O **payload** são os dados que trafegam na chamada. A **autenticação** é como o sistema prova que tem permissão de chamar. E o **retry** é a política de tentar de novo quando uma chamada falha por algo temporário. Você não precisa saber implementar nada disso: seu papel é **especificar o contrato e negociar** o que cada lado faz, não escrever a API.\n\nO hábito que separa o bom analista é especificar a integração **antes** de alguém codar. Uma integração acordada no papel (entradas, saídas, erros e quem responde por quê) evita a descoberta tardia de que os dois sistemas assumiram coisas diferentes. Você domina esta etapa quando pega uma integração qualquer e descreve, numa página, o que entra, o que sai e o que o sistema faz em cada tipo de falha, sem precisar abrir uma linha de código.",
          resources: [
            {
              label: "MDN: uma visão geral do HTTP (em português)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Overview",
              kind: "doc",
            },
          ],
        },
        {
          id: "requisitos.documentacao",
          title: "Documentar requisitos",
          description:
            "Registrar os requisitos de forma clara, completa e sem ambiguidade.",
          content:
            'Levantar os requisitos é metade do trabalho; **documentá-los bem** é a outra. A documentação é o que comunica ao time de desenvolvimento, e a todos os envolvidos, o que precisa ser construído. Documentação ruim gera mal-entendidos, retrabalho e software que não resolve o problema.\n\nO inimigo número um é a **ambiguidade**. Frases vagas como "o sistema deve ser rápido" ou "a tela deve ser amigável" não são requisitos; são desejos. Quão rápido? Amigável como? O bom requisito é **específico, mensurável e testável**: alguém deve conseguir ler e saber exatamente o que construir e como verificar se foi atendido. "A busca deve retornar resultados em até 2 segundos" é testável; "a busca deve ser rápida" não é.\n\nAlguns princípios de boa documentação. **Clareza**: linguagem simples e direta, sem jargão desnecessário, entendível tanto pelo negócio quanto pelo time técnico. **Completude**: cobrir não só o caminho feliz, mas as exceções e os casos de borda (o que acontece quando dá errado?). **Consistência**: termos usados sempre com o mesmo significado, sem contradições entre requisitos. E **rastreabilidade**: poder ligar cada requisito à necessidade de negócio que o originou.\n\nFerramentas como o **Confluence** (da Atlassian) são comuns pra centralizar essa documentação, mantendo-a organizada e acessível. Mas o formato importa menos que a qualidade do conteúdo.\n\nUm cuidado de equilíbrio, especialmente em ambientes ágeis: documentar o **suficiente** pra criar entendimento, sem afogar o time em papelada que ninguém lê. A documentação serve à comunicação, não à burocracia. Escrever requisitos claros e testáveis é uma habilidade que se desenvolve com prática, e é exatamente o que distingue um bom analista. Você domina esta etapa quando escreve um requisito que outra pessoa lê e sabe exatamente o que construir e como verificar se ficou pronto, sem precisar te perguntar nada.',
          resources: [
            {
              label: "Confluence (ferramenta de documentação, oficial)",
              url: "https://www.atlassian.com/software/confluence",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "modelagem",
      title: "Modelagem",
      description:
        "Representar visualmente sistemas e processos, porque um bom diagrama vale mais que páginas de texto.",
      level: "intermediario",
      children: [
        {
          id: "modelagem.uml",
          title: "UML e casos de uso",
          description:
            "A linguagem visual padrão para representar sistemas de software.",
          content:
            "Texto sozinho às vezes não basta pra descrever um sistema; um **diagrama** comunica estrutura e fluxo de forma muito mais clara. A linguagem padrão pra isso em software é a **UML** (Linguagem de Modelagem Unificada), um conjunto de tipos de diagrama pra representar diferentes aspectos de um sistema.\n\nA UML tem vários diagramas, mas o analista não precisa dominar todos. Os mais úteis no dia a dia são poucos. O **diagrama de casos de uso** mostra, de forma simples, quem usa o sistema (os atores) e o que cada um pode fazer (os casos de uso), dando uma visão geral das funcionalidades. O **diagrama de classes** representa as entidades do sistema e suas relações (clientes, pedidos, produtos e como se conectam), útil pra alinhar o modelo de dados com o time. E os **diagramas de atividade ou sequência** mostram fluxos e a ordem em que as coisas acontecem.\n\nMerece destaque o **caso de uso** detalhado, que é mais texto que diagrama: a descrição passo a passo de como um ator interage com o sistema pra atingir um objetivo, incluindo o fluxo principal e os fluxos alternativos (o que acontece quando algo foge do esperado). Escrever bons casos de uso, com as exceções mapeadas, é uma habilidade clássica e valiosa do analista, porque força a pensar em todos os caminhos que o sistema precisa tratar.\n\nUm conselho prático: use a UML como **ferramenta de comunicação**, não como fim em si. O objetivo é alinhar entendimento, não produzir diagramas perfeitos segundo a especificação formal. Um diagrama simples que todos entendem vale mais que um tecnicamente impecável que ninguém lê. A UML é mantida pela OMG, que define o padrão, mas no dia a dia o pragmatismo manda.",
          resources: [
            {
              label: "UML (especificação oficial, OMG)",
              url: "https://www.uml.org/",
              kind: "doc",
            },
          ],
        },
        {
          id: "modelagem.bpmn",
          title: "Modelagem de processos (BPMN)",
          description:
            "Desenhar como um processo de negócio funciona, do início ao fim.",
          content:
            'Antes de pensar num sistema, muitas vezes é preciso entender o **processo de negócio** que ele vai apoiar: a sequência de atividades que as pessoas executam pra atingir um resultado. Mapear esse processo é uma habilidade central do analista, e a notação padrão pra isso é o **BPMN** (Business Process Model and Notation).\n\nO BPMN é uma linguagem visual feita pra representar processos de forma que tanto o pessoal de negócio quanto o de tecnologia entendam. Com poucos símbolos (atividades, decisões, eventos de início e fim, e as setas que conectam tudo), você desenha o fluxo de um processo do começo ao fim, mostrando quem faz o quê, em que ordem, e onde o caminho se divide conforme as decisões.\n\nUm conceito útil do BPMN são as **raias** (lanes), que dividem o processo por responsável: cada ator (uma pessoa, um setor, um sistema) tem sua faixa, e fica visível quem é responsável por cada etapa. Isso revela handoffs (passagens de responsabilidade entre áreas), que costumam ser onde os processos travam ou se perdem.\n\nO valor de mapear processos é duplo. Primeiro, **entender a situação atual**: desenhar como o processo funciona hoje (o "as-is") frequentemente revela ineficiências, retrabalho e gargalos que ninguém tinha notado. Segundo, **projetar a melhoria**: desenhar como o processo deveria funcionar (o "to-be"), muitas vezes apoiado por um novo sistema. Essa visão de processos é o que distingue o analista de sistemas de quem só pensa em telas e funcionalidades isoladas.\n\nO BPMN, como a UML, é mantido pela OMG. Use-o pragmaticamente, como ferramenta de entendimento compartilhado. Um bom mapa de processo alinha negócio e tecnologia em torno de como as coisas realmente funcionam, que é o ponto de partida pra qualquer boa solução.',
          resources: [
            {
              label: "BPMN (especificação oficial, OMG)",
              url: "https://www.bpmn.org/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "agil",
      title: "O analista no time ágil",
      description:
        "Como o trabalho de análise acontece dentro dos times de desenvolvimento modernos.",
      level: "intermediario",
      children: [
        {
          id: "agil.historias",
          title: "Histórias de usuário",
          description:
            "Descrever requisitos no formato que os times ágeis usam.",
          content:
            'Nos times ágeis, que são a maioria hoje, os requisitos costumam ser expressos como **histórias de usuário** (user stories): descrições curtas de uma necessidade, do ponto de vista de quem usa. O analista de sistemas frequentemente escreve ou ajuda a refinar essas histórias, então dominar o formato é essencial.\n\nA forma clássica é: "como [tipo de usuário], quero [fazer algo] para [alcançar um objetivo]". Por exemplo: "como cliente, quero salvar meus dados de pagamento para não digitá-los a cada compra". Repare que ela captura **quem** quer, **o quê** e, principalmente, **por quê** (o objetivo), que é a parte mais importante e a mais esquecida.\n\nA história de usuário não é uma especificação técnica completa de propósito. Ela é, na ideia original, um convite à conversa: um lembrete de discutir a necessidade com o time, não um documento que substitui o diálogo. Os detalhes emergem na conversa entre análise, desenvolvimento e os demais envolvidos.\n\nPara dizer quando uma história está "pronta" de verdade, define-se os **critérios de aceitação**: as condições objetivas que precisam ser atendidas pra considerá-la concluída. Para a história do pagamento: "os dados ficam salvos de forma segura", "o usuário pode removê-los", "funciona em compras futuras". Escrever bons critérios de aceitação é uma habilidade muito valorizada do analista, porque eles eliminam a ambiguidade e servem de base pros testes, evitando o mal-entendido clássico de o time achar que terminou e o negócio achar que não.\n\nA conexão com o trabalho do analista é direta: as histórias de usuário e seus critérios são onde os requisitos que você levantou e documentou viram itens construíveis pelo time. É a tradução final da necessidade pra a linguagem do desenvolvimento ágil.',
          resources: [
            {
              label: "Atlassian: histórias de usuário",
              url: "https://www.atlassian.com/agile/project-management/user-stories",
              kind: "doc",
            },
          ],
        },
        {
          id: "agil.processo",
          title: "Ágil, validação e stakeholders",
          description:
            "Como o analista atua ao longo do ciclo ágil e garante que a entrega resolve o problema.",
          content:
            "O analista de sistemas trabalha dentro do ritmo dos times de desenvolvimento, e hoje esse ritmo é quase sempre **ágil**. Vale entender o básico pra se integrar bem. O ágil organiza o trabalho em ciclos curtos (como os sprints do Scrum), entregando pedaços do sistema com frequência, aprendendo e ajustando o rumo. Em vez de especificar tudo de uma vez no início, o analista trabalha de forma contínua, detalhando os requisitos conforme se aproximam de serem construídos. As trilhas de produto e gestão aprofundam o ágil; aqui basta saber como o analista se encaixa nele.\n\nO papel do analista não termina quando os requisitos são entregues ao time. Uma parte importante é a **validação**: acompanhar os testes e conferir se o que foi construído realmente atende ao que foi pedido e resolve o problema do negócio. O analista ajuda a verificar os critérios de aceitação, participa de testes, e funciona como guardião de que a solução faz sentido pra quem vai usar. Pegar um desvio aqui, antes de chegar ao usuário, evita dor de cabeça.\n\nE por trás de tudo está a **comunicação com stakeholders**, talvez a habilidade mais decisiva da profissão. O analista vive entre mundos diferentes (negócio, usuários, desenvolvimento, gestão) que falam línguas diferentes e às vezes querem coisas conflitantes. Traduzir entre esses mundos, alinhar expectativas, mediar conflitos de requisitos e manter todos na mesma página é o trabalho diário. Uma decisão técnica explicada ao negócio, uma necessidade de negócio traduzida ao time: essa tradução constante é o que faz o analista ser a ponte.\n\nAs qualidades que sustentam tudo: escuta ativa, clareza na comunicação, paciência e a capacidade de enxergar a situação pela perspectiva de cada lado. Comunicação, aqui, vale tanto quanto a parte técnica.",
          resources: [
            {
              label: "Manifesto Ágil (texto oficial, em português)",
              url: "https://agilemanifesto.org/iso/ptbr/manifesto.html",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "carreira",
      title: "Carreira",
      description:
        "Construir um portfólio de documentação e dar os primeiros passos numa carreira de ponte.",
      level: "avancado",
      children: [
        {
          id: "carreira.portfolio",
          title: "Portfólio de documentação",
          description:
            "Demonstrar a capacidade de analisar e documentar com exemplos concretos.",
          content:
            "Diferente de áreas que entregam código ou telas, a análise de sistemas entrega **documentos, modelos e clareza**, o que torna o portfólio um pouco menos óbvio de montar, mas perfeitamente possível e muito eficaz. Como em qualquer área, demonstrar a capacidade na prática vale mais que afirmá-la no currículo.\n\nA boa notícia é que você pode construir um portfólio com **projetos fictícios ou de estudo**, sem depender de um emprego. Algumas peças que demonstram bem a competência. Documentar os **requisitos de um app real** que você usa: escolha um aplicativo, analise-o e escreva os requisitos funcionais, não-funcionais e regras de negócio que ele parece seguir. Modelar um **processo em BPMN**: pegue um processo que você conhece (uma compra online, um atendimento) e desenhe seu fluxo. Escrever **casos de uso e histórias de usuário** de um sistema, com critérios de aceitação bem definidos.\n\nEsses exercícios provam exatamente o que recrutadores procuram: que você sabe **levantar, organizar e comunicar** requisitos com clareza. Um caso de uso bem escrito, com fluxos alternativos mapeados, ou um diagrama de processo limpo, demonstram raciocínio analítico de forma imediata.\n\nApresente esse material de forma organizada e legível, porque a própria clareza da apresentação é uma demonstração da sua habilidade. Um portfólio confuso contradiz a competência que você quer mostrar; um bem estruturado já é meio caminho andado.\n\nO conselho central: como a comunicação e a clareza são a essência da profissão, deixe seu portfólio ser a prova viva dessas qualidades. A forma como você documenta seus exemplos diz tanto sobre você quanto o conteúdo deles.",
        },
        {
          id: "carreira.projeto",
          title: "Projeto final: especificação completa de um sistema",
          description:
            "Do levantamento ao protótipo navegável: a especificação que prova a competência da trilha.",
          content:
            "Esta é a hora de reunir tudo o que a trilha construiu num único trabalho, do jeito que um analista entrega na vida real. Você aprendeu a levantar requisitos conversando com pessoas, a classificá-los, a documentá-los sem ambiguidade, a especificar as integrações que o sistema precisa, e a modelar processos e casos de uso. O projeto final pede que você use tudo isso junto, não em pedaços soltos.\n\nO projeto vinculado te encomenda a **especificação completa de um sistema fictício**, do levantamento ao protótipo navegável. Partindo de um problema de negócio que você entenda (um sistema de agendamento, um controle de estoque, um app de pedidos), você produz o pacote inteiro: os requisitos funcionais, não-funcionais e as regras de negócio; um mapa do processo em BPMN; os casos de uso com seus fluxos alternativos; as histórias de usuário com critérios de aceitação; a especificação das integrações com outros sistemas; e um protótipo navegável que dê forma visual à solução.\n\nMais que qualquer certificado, é este pacote que prova a um recrutador que você sabe fazer a ponte entre o problema e a solução especificada. Você chega ao fim quando um desenvolvedor consegue ler o seu material e começar a construir sem te perguntar o que o sistema deve fazer, e um gestor consegue entender o que será entregue e por quê. Uma especificação que passa nesses dois testes cumpriu o papel da profissão.",
          project: "especificacao-sistema-real",
        },
        {
          id: "carreira.entrar",
          title: "Entrar na carreira",
          description:
            "Como se posicionar para uma área que valoriza comunicação tanto quanto técnica.",
          optional: true,
          content:
            "A análise de sistemas é uma porta interessante pra tecnologia, especialmente pra quem tem perfil de **comunicação e organização** e gosta de tecnologia sem querer programar o dia inteiro. É uma área que recebe bem gente em transição de carreira, porque valoriza habilidades que muitas pessoas já desenvolveram em outras funções.\n\nA fórmula pra entrar combina algumas peças. Domine os **fundamentos** desta trilha: levantamento e documentação de requisitos, modelagem (UML e BPMN), histórias de usuário, e a base técnica leve (lógica e SQL) que te permite conversar com o time. Construa um **portfólio** de documentação, como vimos, com exemplos concretos que provam sua capacidade analítica. E desenvolva a **comunicação**, que é a ferramenta número um da profissão, treinando escrever e apresentar com clareza.\n\nUma vantagem pra quem vem de outras áreas: a **experiência de negócio** é um trunfo, não um obstáculo. Quem trabalhou em vendas, atendimento, finanças, operações ou qualquer área que entende processos e pessoas traz uma compreensão de negócio que muitos analistas técnicos não têm. Enquadrar essa bagagem em termos de análise (problemas que você entendeu, processos que mapeou, melhorias que propôs) é meio caminho andado.\n\nUma observação realista: a área costuma valorizar uma formação na área de tecnologia ou negócios, e o tempo até a primeira vaga pode ser um pouco maior que o de áreas de entrada como suporte. Mas é uma carreira estável, bem remunerada nos níveis mais sêniores, e com caminhos de evolução pra produto, gestão e arquitetura de soluções.\n\nDuas qualidades fecham o perfil e abrem portas: a **capacidade de fazer boas perguntas** (a essência de levantar requisitos) e a **clareza ao documentar e comunicar**. Quem demonstra essas duas, com um portfólio que as prove, tem um caminho concreto nessa profissão de ponte.",
        },
      ],
    },
  ],
};
