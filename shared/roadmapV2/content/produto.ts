// TODO(Ana): revisao editorial do upgrade da fase 3c, lote 7 (fecho do projeto
// reescrito, fechos de criterio, conexoes nominais, blocos de texto
// estruturado e resources novos). Enquadramento de papel: produto responde
// "vale a pena construir isso agora?" (o que construir e por que), nao "isso
// funciona e e usavel?" (isso e uxui). PM de verdade diz nao, prioriza com
// criterio explicito, defende com dado e convive com o tradeoff.
import type { RoadmapV2 } from "../types";

export const produto: RoadmapV2 = {
  slug: "produto",
  area: "produto",
  title: "Produto Digital do Zero",
  level: "Iniciante",
  description:
    "Da mentalidade de produto e discovery aos métodos ágeis, priorização, métricas e a entrada na carreira de PM. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é um produto digital, o que faz quem cuida dele e a mentalidade que separa produto de execução.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é produto digital",
          description:
            "Um software que resolve o problema de alguém e evolui com o tempo, não um projeto que acaba.",
          content:
            'Um **produto digital** é um software feito pra resolver o problema de um grupo de pessoas e gerar valor de forma contínua: um app de banco, uma loja online, uma ferramenta de trabalho, uma rede social. O que o define não é a tecnologia, é o fato de servir a alguém e evoluir com o tempo.\n\nVale separar **produto** de **projeto**, porque a diferença molda toda a área. Um projeto tem início, meio e fim: você entrega e acabou. Um produto é vivo: ele nasce, é usado, recebe feedback, melhora, ganha novas funções e às vezes é repensado por inteiro. Não existe "produto pronto"; existe produto numa etapa da sua evolução. Por isso o trabalho de produto é contínuo, não uma corrida até uma linha de chegada.\n\nTodo produto vive uma tensão entre três forças que precisam se equilibrar: o que o **negócio** precisa (gerar receita, crescer, ser sustentável), o que o **usuário** quer (resolver a dor dele de forma fácil e agradável) e o que a **tecnologia** permite (o que dá pra construir, com que esforço). Decisões de produto vivem nesse cruzamento.\n\nUm produto de sucesso resolve um problema real, de um público claro, melhor que as alternativas. Parece óbvio, mas é onde a maioria falha: constrói algo tecnicamente impecável que ninguém precisava. Esta trilha é sobre como evitar isso, decidindo o que construir e por quê.',
        },
        {
          id: "fundamentos.pm",
          title: "O papel do Product Manager",
          description:
            "Quem conecta negócio, usuário e tecnologia pra decidir o que construir.",
          content:
            "O **Product Manager** (PM, ou gerente de produto) é quem decide **o que** o time vai construir e **por quê**, deixando o **como** para os times de desenvolvimento e design. Não é quem programa nem quem desenha as telas; é quem garante que o time esteja construindo a coisa certa, pelas razões certas.\n\nNa prática, o PM vive naquele cruzamento entre negócio, usuário e tecnologia: conversa com clientes pra entender dores, olha métricas pra saber o que está funcionando, prioriza o que fazer primeiro, escreve o que precisa ser construído e mantém todo mundo alinhado em torno de um objetivo. É um trabalho de muita comunicação e decisão, pouco de execução técnica direta.\n\nUm detalhe que define a função: o PM normalmente **não tem autoridade hierárquica** sobre o time. Ele não manda nos desenvolvedores nem nos designers. Sua força vem de influência: clareza de visão, bons argumentos, dados e a confiança que ele constrói. Liderar sem mandar é a habilidade central, e a mais difícil de aprender.\n\nExistem títulos próximos que confundem. O **Product Owner** é um papel ligado ao Scrum, focado no backlog e na ligação com o time de desenvolvimento; em muitos lugares se sobrepõe ao PM. A boa notícia pra quem vem de outra área: produto valoriza muito experiências anteriores (vendas, suporte, design, dados, negócio), porque entender pessoas e contexto importa tanto quanto qualquer técnica.",
          resources: [
            {
              label: "Silicon Valley Product Group: artigos (Marty Cagan)",
              url: "https://www.svpg.com/articles/",
              kind: "artigo",
            },
            {
              label: "Atlassian: agile (referência)",
              url: "https://www.atlassian.com/agile",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.mentalidade",
          title: "Problema antes de solução",
          description:
            "A mentalidade que separa quem faz produto de quem só executa pedidos.",
          content:
            'A mentalidade mais importante de produto cabe numa frase: **apaixone-se pelo problema, não pela solução**. Iniciantes (e muitas empresas) fazem o contrário: partem de uma ideia de funcionalidade e correm pra construí-la, sem checar se ela resolve uma dor real de alguém.\n\nO problema disso é sutil. Quando você se apega a uma solução, passa a defendê-la mesmo quando os sinais dizem que ela não funciona, porque admitir que estava errado dói. Quando você se foca no **problema**, fica livre pra trocar de solução quantas vezes for preciso até achar a que resolve. A solução é descartável; o problema é o que importa.\n\nIsso muda as perguntas que você faz. Em vez de "como construímos esta feature?", você pergunta "que problema isto resolve, de quem, e como saberemos se resolveu?". Muita ideia bonita morre nessa pergunta, e morrer cedo é ótimo: economiza meses de trabalho em algo que ninguém queria.\n\nDuas armadilhas comuns ilustram o erro. A **feature factory**, o time que mede sucesso por quantidade de funcionalidades entregues, não por problemas resolvidos. E o **viés do construtor**, a tendência de construir o que é divertido ou tecnicamente interessante, em vez do que gera valor.\n\nUm bom PM é, antes de tudo, um cético disciplinado: questiona suposições, busca evidência e só investe esforço quando o problema e o valor estão claros. Essa postura sustenta tudo o que vem a seguir, a começar pela seção de Discovery, onde ela vira método.',
        },
      ],
    },
    {
      id: "discovery",
      title: "Discovery",
      description:
        "Descobrir o problema certo e validar ideias antes de gastar meses construindo a coisa errada.",
      level: "iniciante",
      children: [
        {
          id: "discovery.oque",
          title: "O que é discovery",
          description:
            "A fase de entender o problema e reduzir incerteza antes de construir.",
          content:
            "**Discovery** (descoberta) é a fase de produto dedicada a entender o problema e reduzir a incerteza **antes** de o time investir tempo construindo. É o oposto de receber uma ideia pronta e sair codando: é parar pra perguntar se essa ideia faz sentido.\n\nO trabalho de discovery responde a um conjunto de perguntas antes de qualquer linha de código. O problema é real e vale a pena resolver? Quem sofre com ele e o quanto? A solução que imaginamos de fato resolve? As pessoas usariam e, se for o caso, pagariam? Cada resposta encontrada cedo evita um erro caro lá na frente.\n\nUm jeito difundido de pensar isso separa dois riscos. O **risco do problema**: estamos resolvendo algo que importa? E o **risco da solução**: a forma que escolhemos resolve mesmo, de um jeito utilizável e viável? Discovery ataca os dois com pesquisa e experimentos baratos, antes de comprometer o time.\n\nUm equilíbrio importante: discovery não é análise infinita que nunca vira nada. O objetivo não é ter certeza absoluta (impossível), é reduzir a incerteza o suficiente pra apostar com mais confiança. Bom discovery é rápido e contínuo, andando em paralelo com a construção, não uma fase gigante que trava tudo no começo.\n\nA ideia central: é muito mais barato descobrir que uma ideia é ruim numa conversa de meia hora do que depois de três meses de desenvolvimento. Discovery é, no fundo, a arte de errar barato.",
          resources: [
            {
              label: "Nielsen Norman Group: fase de discovery",
              url: "https://www.nngroup.com/articles/discovery-phase/",
              kind: "artigo",
            },
          ],
        },
        {
          id: "discovery.pesquisa",
          title: "Conversar com usuários",
          description:
            "A habilidade mais valiosa do discovery: entender pessoas de verdade.",
          content:
            'A ferramenta mais poderosa de discovery é a mais simples: **conversar com as pessoas** que têm o problema. Parece óbvio, mas é raro feito bem, porque exige escutar de verdade, e não buscar confirmação pra ideia que você já adora.\n\nA técnica central das entrevistas é perguntar sobre o **comportamento real e passado**, não sobre opiniões hipotéticas. "Me conta a última vez que você precisou fazer X" revela muito mais que "você usaria um app que faz X?". As pessoas são péssimas em prever o que fariam e ótimas em relatar o que já viveram. Perguntas sobre o futuro hipotético geram respostas educadas e inúteis.\n\nO erro mais comum, e mortal, é **induzir a resposta** que você quer ouvir. "Você não acha que seria ótimo se..." não é pesquisa, é busca por validação. Boa entrevista é curiosa e neutra: você quer a verdade, mesmo (principalmente) quando ela contraria sua ideia.\n\nAlém das entrevistas, discovery usa outras fontes: observar pessoas usando o produto (que quase sempre difere do que elas dizem fazer), olhar dados de uso pra ver o comportamento em escala, e analisar o que concorrentes fazem. Cada fonte cobre um ângulo.\n\nUma descoberta que alivia iniciantes: você não precisa de muita gente. Poucas conversas bem conduzidas com o público certo já revelam padrões claros. O valor está na qualidade da escuta e na frequência, não no volume.',
          resources: [
            {
              label: "Nielsen Norman Group: métodos de pesquisa de UX",
              url: "https://www.nngroup.com/articles/which-ux-research-methods/",
              kind: "artigo",
            },
          ],
        },
        {
          id: "discovery.validar",
          title: "Validar antes de construir",
          description:
            "Testar ideias com o mínimo esforço pra aprender se valem o investimento.",
          content:
            'Depois de entender o problema, vem a tentação de construir a solução completa. Discovery oferece um caminho mais inteligente: **validar barato** antes de investir caro. A pergunta guia é sempre "qual é a menor coisa que podemos fazer pra aprender se isto funciona?".\n\nO conceito mais conhecido aqui é o **MVP** (produto mínimo viável): a versão mais simples possível da solução, suficiente pra testar a hipótese central com usuários reais. O ponto que iniciantes erram é o **mínimo**: MVP não é uma versão tosca de tudo, é uma versão completa do essencial. Resolve bem um problema, em vez de resolver mal vários.\n\nE existem formas de validar ainda mais baratas que um MVP, sem construir quase nada. Mostrar um protótipo clicável e observar a reação. Criar uma página que descreve a solução e medir quantas pessoas se interessam. Oferecer o serviço manualmente nos bastidores, em vez de automatizá-lo, pra ver se há demanda. Todas existem pra responder uma dúvida específica com o menor esforço.\n\nA lógica por trás de tudo é tratar ideias como **hipóteses a testar**, não verdades a executar. E uma hipótese boa tem forma, o que a torna testável:\n\n```\nacreditamos que [mudanca]\npara [publico]\nvai gerar [resultado].\nsaberemos ao ver [sinal].\n```\n\nVocê assume que pode estar errado e desenha o teste mais rápido pra descobrir. Cada validação ou derruba a ideia (ótimo, errou barato) ou aumenta sua confiança pra investir mais.\n\nEssa disciplina é o que separa apostas conscientes de apostas no escuro. Você domina este passo quando escreve uma hipótese que pode ser refutada e aponta o teste mais barato que a checa.',
        },
      ],
    },
    {
      id: "agil",
      title: "Métodos ágeis",
      description:
        "A forma de trabalho dominante no desenvolvimento de produtos: entregar em ciclos curtos e se adaptar.",
      level: "intermediario",
      children: [
        {
          id: "agil.manifesto",
          title: "O manifesto ágil",
          description:
            "A filosofia por trás de como times de produto trabalham hoje.",
          content:
            "Quase todo time de produto trabalha de forma **ágil**, e entender o espírito disso importa mais que decorar regras. A ideia nasceu como reação a um jeito antigo de fazer software: planejar tudo nos mínimos detalhes no começo, construir por meses ou anos e só entregar no fim. O problema é que, quando finalmente entregava, o mundo (e a necessidade do usuário) já tinha mudado, ou o plano se revelava errado.\n\nEm 2001, um grupo de profissionais escreveu o **Manifesto Ágil**, com quatro valores que viraram a base do trabalho moderno. Em resumo: pessoas e a colaboração entre elas valem mais que processos rígidos; software funcionando vale mais que documentação extensa; colaborar com o cliente vale mais que negociar contratos travados; e responder a mudanças vale mais que seguir um plano fixo a qualquer custo.\n\nO coração de tudo é trabalhar em **ciclos curtos**: construir um pedaço pequeno, entregar, aprender com o uso real e ajustar o rumo. Em vez de uma aposta gigante no escuro, muitas apostas pequenas com correção constante. Isso conversa diretamente com a mentalidade da seção de Discovery: você assume que vai errar e se organiza pra corrigir rápido.\n\nUm cuidado honesto: ágil virou moda e muita empresa adota o vocabulário (sprints, reuniões) sem o espírito (adaptar-se, focar em valor). Seguir rituais não é ser ágil; ser ágil é entregar valor cedo e mudar de rota quando os fatos mudam. O resto desta seção mostra os métodos concretos que põem essa filosofia em prática.",
          resources: [
            {
              label: "Manifesto Ágil (texto oficial, em português)",
              url: "https://agilemanifesto.org/iso/ptbr/manifesto.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "agil.scrum",
          title: "Scrum",
          description:
            "O método ágil mais usado: trabalho em sprints com papéis e ritos definidos.",
          content:
            "O **Scrum** é a forma mais difundida de organizar trabalho ágil, e você vai esbarrar nele em quase qualquer time de produto. A ideia central é dividir o trabalho em **sprints**: ciclos curtos e de duração fixa (em geral de uma a quatro semanas) ao fim dos quais o time entrega algo funcional e utilizável.\n\nO Scrum define três papéis. O **Product Owner** cuida do que será construído e da prioridade (o backlog), representando a voz do negócio e do usuário. O **time de desenvolvimento** constrói. E o **Scrum Master** ajuda o time a seguir o processo e remove obstáculos, sem ser um chefe.\n\nCada sprint tem alguns ritos (cerimônias). O **planejamento** define o que entra no sprint. A **daily**, uma reunião curta diária, alinha o que cada um está fazendo e o que está travando. A **review** mostra o que foi entregue, ao fim do sprint. E a **retrospectiva** discute como o time pode trabalhar melhor da próxima vez, o rito que mais gente subestima e que mais melhora o time.\n\nO ganho do Scrum é o ritmo previsível e a chance de corrigir o rumo a cada sprint, em vez de descobrir problemas só no fim. O risco é virar burocracia: time que faz todos os ritos no automático, sem o espírito de adaptação, tem a aparência de ágil sem o benefício. O Scrum Guide oficial é curto e vale a leitura direta.",
          resources: [
            {
              label: "Scrum Guide (guia oficial)",
              url: "https://scrumguides.org/scrum-guide.html",
              kind: "doc",
            },
            {
              label: "Atlassian: Scrum",
              url: "https://www.atlassian.com/agile/scrum",
              kind: "doc",
            },
          ],
        },
        {
          id: "agil.kanban",
          title: "Kanban",
          description:
            "Um método de fluxo contínuo que visualiza o trabalho e limita o que se faz ao mesmo tempo.",
          content:
            'O **Kanban** é outra forma popular de organizar trabalho ágil, com uma lógica diferente do Scrum. Em vez de ciclos fechados de tempo, ele foca em **fluxo contínuo**: as tarefas entram e saem conforme o time tem capacidade, sem a estrutura de sprints.\n\nA ferramenta central é o **quadro Kanban**, dividido em colunas que representam as etapas do trabalho, classicamente "a fazer", "em andamento" e "concluído". Cada tarefa é um cartão que se move da esquerda pra direita conforme avança. A grande virtude é tornar o trabalho **visível**: olhando o quadro, qualquer um vê o que está em andamento, o que está parado e onde as coisas se acumulam.\n\nO princípio mais valioso e menos óbvio do Kanban é o **limite de trabalho em andamento**: definir um número máximo de tarefas que podem estar "em andamento" ao mesmo tempo. Isso combate a ilusão de produtividade de começar muitas coisas e terminar poucas. Menos tarefas simultâneas significa mais coisas de fato concluídas, e gargalos que ficam óbvios no quadro.\n\nKanban e Scrum não são rivais; muitos times misturam os dois. Uma regra prática comum: Scrum encaixa bem quando o trabalho dá pra planejar em ciclos (construção de novas funcionalidades), e Kanban brilha em trabalho de fluxo imprevisível e contínuo (suporte, correções, demandas que chegam a qualquer hora). Conhecer os dois te deixa escolher a ferramenta certa pra cada contexto.',
          resources: [
            {
              label: "Atlassian: Kanban",
              url: "https://www.atlassian.com/agile/kanban",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "backlog",
      title: "Backlog e priorização",
      description:
        "Organizar o que precisa ser feito, decidir a ordem e comunicar a direção do produto.",
      level: "intermediario",
      children: [
        {
          id: "backlog.historias",
          title: "Histórias de usuário",
          description:
            "Descrever o que construir do ponto de vista de quem vai usar.",
          content:
            'Quando chega a hora de dizer ao time o que construir, o formato mais usado é a **história de usuário** (user story): uma descrição curta de uma necessidade, contada do ponto de vista de quem usa. A forma clássica é: "como [tipo de usuário], quero [fazer algo] para [alcançar um objetivo]".\n\nUm exemplo: "como cliente, quero salvar meus dados de pagamento para não digitá-los a cada compra". Repare no que essa frase faz: ela diz **quem** quer, **o quê** e, principalmente, **por quê**. O "para" é a parte mais importante e a mais esquecida, porque captura o objetivo real, e às vezes revela uma solução melhor que a imaginada.\n\nA história de usuário não é uma especificação técnica detalhada de propósito. Ela é, nas palavras de quem cunhou o conceito, um convite à conversa: um lembrete de discutir a necessidade com o time, não um documento que substitui o diálogo. Os detalhes surgem na conversa entre produto, design e desenvolvimento.\n\nPra saber quando uma história está "pronta" de verdade, o time define **critérios de aceitação**: as condições objetivas que precisam ser atendidas pra considerá-la concluída. Juntos, história e aceite formam um artefato só:\n\n```\ncomo cliente\nquero salvar meu pagamento\npara nao redigitar a cada compra.\naceite: dado salvo e removivel\n```\n\nOs critérios evitam o mal-entendido clássico de o time achar que terminou e o PM achar que não.\n\nManter as histórias focadas no usuário, e não em solução técnica, mantém o time conectado ao valor, que é o ponto.',
          resources: [
            {
              label: "Atlassian: histórias de usuário",
              url: "https://www.atlassian.com/agile/project-management/user-stories",
              kind: "doc",
            },
          ],
        },
        {
          id: "backlog.priorizacao",
          title: "Priorização",
          description:
            "Decidir o que fazer primeiro quando tudo parece importante.",
          content:
            'O **backlog** é a lista de tudo que poderia ser construído: funcionalidades, melhorias, correções, ideias. Ele sempre cresce mais rápido do que o time consegue entregar, e é aí que mora o trabalho mais difícil e mais valioso do PM: **priorizar**, ou seja, decidir o que fazer primeiro.\n\nPriorizar é, na essência, dizer **não** (ou "agora não") pra quase tudo. Como todo recurso é limitado, escolher uma coisa é adiar outras. O mesmo tradeoff aparece dentro de cada entrega, resumido numa frase honesta: entre **escopo, prazo e qualidade, você escolhe dois**. Querer os três de uma vez é a ilusão que estoura o prazo ou entrega mal, e reconhecer isso cedo é meio caminho de uma conversa madura com o time e a liderança. PM que tenta fazer tudo não prioriza nada, e o time se dispersa. A coragem de deixar boas ideias de fora é o que dá foco ao produto.\n\nPra decidir com menos viés, existem técnicas simples que comparam itens por critérios explícitos. Uma forma comum é pesar cada item pelo **valor** que entrega contra o **esforço** que custa: itens de muito valor e pouco esforço vão pra frente; os de pouco valor e muito esforço, pro fim. Outras abordagens somam critérios como alcance, impacto e confiança na estimativa. O método importa menos que o hábito de decidir por critérios, não por quem grita mais alto.\n\nE aqui aparece um conceito que define a maturidade de um PM: a **dívida** entre o que é urgente e o que é importante. O barulho do dia a dia (o pedido do chefe, o bug que incomoda) empurra o urgente, mas o trabalho que mais cria valor costuma ser o importante e não urgente. Proteger espaço pra ele, em meio à pressão, é uma das marcas de quem faz produto bem. Você domina este passo quando justifica por que disse não a uma ideia boa, com um critério explícito, e não com gosto.',
          resources: [
            {
              label: "Atlassian: backlog do produto",
              url: "https://www.atlassian.com/agile/scrum/backlogs",
              kind: "doc",
            },
          ],
        },
        {
          id: "backlog.roadmap",
          title: "Roadmap",
          description:
            "Comunicar a direção do produto sem prometer datas que você não controla.",
          content:
            "O **roadmap** é a visão de para onde o produto está indo ao longo do tempo. Ele comunica direção e prioridades pra todo mundo: o time que constrói, os líderes que cobram, os clientes que esperam. É a ponte entre a estratégia (o porquê) e a execução (o que será feito).\n\nO erro mais comum, e mais doloroso, é tratar o roadmap como uma **promessa de datas exatas**: uma lista de funcionalidades amarradas a dias específicos, meses à frente. O problema é que produto é cheio de incerteza; você vai aprender coisas que mudam o plano. Um roadmap rígido demais ou vira mentira (datas furadas que ninguém respeita mais) ou prende o time a um plano que os fatos já contradizem.\n\nA abordagem mais saudável organiza o roadmap por **horizontes de tempo e confiança**, não por datas cravadas. O que está perto é mais detalhado e provável; o que está longe é mais amplo e sujeito a mudança. Muitos times preferem ainda organizar o roadmap por **problemas a resolver ou objetivos**, não por uma lista de funcionalidades, justamente pra manter o foco no valor e a liberdade de escolher a melhor solução depois.\n\nUm bom roadmap equilibra dois deveres em tensão: dar clareza suficiente pra alinhar e planejar, sem fingir uma certeza que não existe. Ele é uma ferramenta de comunicação e direção, não um contrato. Comunicar isso com honestidade aos stakeholders evita a maior parte das frustrações.",
          resources: [
            {
              label: "Atlassian: roadmaps de produto",
              url: "https://www.atlassian.com/agile/product-management/roadmaps",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "especificacao",
      title: "Especificar e alinhar",
      description:
        "Transformar decisões em documentos claros e manter todas as partes interessadas na mesma página.",
      level: "intermediario",
      children: [
        {
          id: "especificacao.prd",
          title: "Documento de produto (PRD)",
          description:
            "Registrar o que será construído e por quê, pra alinhar o time.",
          content:
            'Em algum momento, as decisões de produto precisam virar um documento que o time possa seguir. O mais comum é o **PRD** (documento de requisitos de produto): um texto que descreve o que será construído, para quem e por quê, servindo de fonte de verdade pra desenvolvimento, design e negócio.\n\nUm bom PRD não é um calhamaço técnico; é um documento claro que costuma cobrir alguns pontos. O **problema e o contexto**: que dor estamos resolvendo e como descobrimos que ela importa. Os **objetivos**: o que queremos alcançar e como vamos medir o sucesso. O **escopo**: o que entra e, igualmente importante, o que **não** entra nesta versão. E as **histórias de usuário** com seus critérios de aceitação, detalhando o que precisa funcionar.\n\nA seção mais subestimada é a do que fica **de fora**. Deixar explícito o que não será feito agora evita expectativas erradas e protege o foco. "Não vamos fazer X nesta versão" é uma frase poderosa num PRD.\n\nUm princípio guia a escrita: o documento serve pra **criar entendimento compartilhado**, não pra cumprir burocracia. Se ninguém lê ou se ele não tira dúvidas reais do time, ele falhou, por mais bonito que seja. Adapte o tamanho ao contexto: uma mudança pequena pede poucas linhas; uma iniciativa grande pede mais.\n\nE lembre-se de que o documento não substitui a conversa. Ele registra e alinha, mas as melhores decisões ainda nascem do diálogo entre produto, design e desenvolvimento, com o PRD como base comum.',
        },
        {
          id: "especificacao.stakeholders",
          title: "Alinhar stakeholders",
          description:
            "Manter as pessoas interessadas no produto informadas, ouvidas e na mesma direção.",
          content:
            '**Stakeholders** são todas as pessoas com interesse no produto: a liderança da empresa, as áreas de vendas, marketing, suporte, jurídico, e às vezes clientes importantes. Boa parte do trabalho de um PM é mantê-las alinhadas, e isso é mais difícil do que parece, porque elas costumam querer coisas diferentes e conflitantes.\n\nA habilidade central aqui é a **comunicação**, adaptada a cada público. A liderança quer saber de objetivos e resultados, não de detalhes de implementação. O time de vendas quer entender o que pode prometer aos clientes. O suporte quer saber o que muda pra quem usa. A mesma decisão precisa ser contada de formas diferentes pra fazer sentido pra cada um.\n\nUm ponto delicado: stakeholders frequentemente chegam com **soluções prontas** ("precisamos da funcionalidade X"), não com problemas. O bom PM escuta com respeito, mas investiga o problema por trás do pedido ("o que te levou a pedir isso? que situação você está tentando resolver?"). Muitas vezes o problema real tem uma solução melhor que a sugerida, e essa conversa transforma um pedido numa boa decisão.\n\nA postura que sustenta tudo é equilibrar **firmeza e abertura**. Firmeza pra defender as prioridades do produto e dizer não quando preciso, com bons argumentos e dados. Abertura pra ouvir de verdade, mudar de ideia diante de boas razões e construir confiança. PM que só concorda vira tirador de pedidos; PM que só impõe perde aliados. O ponto de equilíbrio, conquistado com transparência, é onde a influência sem autoridade de fato acontece.',
        },
      ],
    },
    {
      id: "metricas",
      title: "Métricas de produto",
      description:
        "Usar dados pra entender se o produto está funcionando e tomar decisões com menos achismo.",
      level: "avancado",
      children: [
        {
          id: "metricas.porque",
          title: "Por que medir",
          description: "Trocar opinião por evidência na hora de decidir.",
          content:
            'Decisões de produto podem ser tomadas por opinião ou por evidência, e métricas são o que permitem o segundo caminho. Sem dados, as discussões viram disputa de achismo, onde costuma vencer quem tem mais cargo, não quem tem mais razão. Com dados, a conversa muda de "eu acho" pra "os números mostram".\n\nMas medir tem armadilhas, e conhecê-las cedo evita conclusões erradas. A primeira são as **métricas de vaidade**: números que parecem ótimos e sobem sempre, mas não dizem nada sobre valor real. Total de cadastros acumulados é o exemplo clássico: cresce pra sempre e não revela se as pessoas usam ou voltam. Métricas boas são **acionáveis**: mudam conforme suas decisões e ajudam a decidir o próximo passo.\n\nA segunda armadilha é confundir **correlação com causa**. Dois números subirem juntos não significa que um causou o outro; pode haver um terceiro fator por trás, ou ser acaso. Concluir causa a partir de uma simples coincidência nos dados é um erro caro e comum.\n\nA terceira é medir só números e esquecer o **porquê** por trás deles. Os dados dizem o que está acontecendo (a queda no uso de uma tela), mas raramente explicam a razão. Pra isso você volta às conversas do passo Conversar com usuários. Quantitativo e qualitativo se completam: os números apontam onde olhar, as conversas explicam o motivo.\n\nA mentalidade certa não é medir tudo, é medir o que importa e interpretar com honestidade, inclusive quando o dado contraria o que você esperava.',
          resources: [
            {
              label: "Mixpanel: documentação (ferramenta de analytics)",
              url: "https://docs.mixpanel.com/",
              kind: "doc",
            },
          ],
        },
        {
          id: "metricas.northstar",
          title: "North Star e KPIs",
          description:
            "Escolher poucas métricas que de fato representam o valor do produto.",
          content:
            "Um produto gera dezenas de números possíveis, e tentar acompanhar todos é o mesmo que não acompanhar nenhum. Por isso times de produto escolhem poucas métricas que realmente importam.\n\nOs **KPIs** (indicadores-chave de desempenho) são as métricas centrais que você acompanha de perto porque representam a saúde do produto ou de um objetivo. A palavra-chave é **poucos**: um punhado de KPIs bem escolhidos vale mais que um painel com cinquenta números que ninguém olha.\n\nMuitos times vão além e definem uma **North Star metric** (métrica estrela-guia): uma única métrica que melhor captura o valor que o produto entrega aos usuários. A ideia é que, se essa métrica cresce de forma saudável, o produto está realmente ajudando as pessoas, e o negócio cresce como consequência. Uma boa North Star mede valor entregue, não apenas atividade: algo como a frequência com que as pessoas realizam a ação central que as faz voltar, em vez de só o total de acessos.\n\nO cuidado mais importante é com o lado perverso das metas. Quando uma métrica vira meta, surge a tentação de inflá-la de formas que não geram valor real (forçar cliques, dificultar o cancelamento pra reduzir churn no papel). Por isso boas métricas vêm acompanhadas de **contrapesos**: indicadores de qualidade que garantem que você não está melhorando um número às custas da experiência. Escolher o que medir é, no fundo, escolher o que o time vai otimizar, então essa decisão molda o comportamento de todo mundo.",
          resources: [
            {
              label: "Amplitude: documentação (ferramenta de analytics)",
              url: "https://amplitude.com/docs",
              kind: "doc",
            },
          ],
        },
        {
          id: "metricas.funil",
          title: "Funil e retenção",
          description:
            "Dois jeitos de enxergar o comportamento dos usuários e onde melhorar.",
          content:
            "Duas formas de olhar dados aparecem o tempo todo em produto, e vale entender as duas.\n\nO **funil** acompanha uma sequência de etapas até um objetivo, medindo quantas pessoas avançam de uma pra outra. Pense no caminho de uma compra: visitar a loja, ver um produto, colocar no carrinho, pagar. Em cada etapa, parte das pessoas desiste. O funil mostra exatamente **onde** elas saem, e esse ponto de maior queda costuma ser a melhor oportunidade de melhoria: pequenas correções ali destravam ganhos grandes. É uma ferramenta de diagnóstico poderosa pra encontrar onde o produto perde pessoas.\n\nA **retenção** mede algo diferente e, muitas vezes, mais importante: quantas pessoas **voltam** ao produto depois do primeiro uso, ao longo do tempo. Conquistar usuários novos não adianta se eles somem em seguida; é como encher um balde furado. Boa retenção é o sinal mais honesto de que o produto entrega valor de verdade, porque as pessoas só voltam ao que as ajuda. Muitos consideram a retenção a métrica mais reveladora da saúde de um produto.\n\nA relação entre as duas conta uma história. O funil ajuda a trazer e converter pessoas; a retenção diz se valeu a pena tê-las trazido. Focar só em atrair, ignorando a retenção, é a receita do balde furado: muito esforço entrando, tudo escorrendo pelo fundo.\n\nFerramentas de analytics de produto, como as usadas no mercado, automatizam funis e relatórios de retenção, mas o valor está em saber que perguntas fazer a elas.",
        },
        {
          id: "metricas.experimentos",
          title: "Experimentos e teste A/B",
          description:
            "Provar o efeito de uma mudança comparando versões com usuários reais.",
          optional: true,
          content:
            "Quando você quer saber se uma mudança realmente melhora algo, em vez de só supor, a ferramenta certa é o **experimento**, e o tipo mais comum é o **teste A/B**.\n\nO funcionamento é simples e elegante. Você divide os usuários em dois grupos de forma aleatória. O grupo A vê a versão atual (o controle); o grupo B vê a versão com a mudança. Aí você compara uma métrica entre os dois grupos. Como a única diferença sistemática entre eles é a mudança, uma diferença consistente no resultado pode ser atribuída a ela. É a forma mais confiável de provar **causa**, não apenas correlação, e por isso resolve uma das armadilhas das métricas.\n\nAlguns cuidados separam um teste sério de um enganoso. É preciso ter **volume suficiente** de usuários pra que a diferença observada não seja só acaso; com pouca gente, qualquer variação parece significativa e engana. É preciso definir **antes** qual métrica você vai olhar, pra não sair garimpando qualquer número que tenha mexido a seu favor. E é preciso dar tempo ao teste, sem encerrá-lo no primeiro resultado animador.\n\nA cultura de experimentação é um sinal de maturidade em produto: em vez de discutir opiniões sobre qual botão converte mais, o time testa e deixa os usuários responderem. É opcional pra quem está começando, e faz mais sentido em produtos com bastante tráfego, mas entender o conceito muda a forma como você encara qualquer decisão: como uma hipótese que pode, e idealmente deve, ser testada.",
        },
      ],
    },
    {
      id: "carreira",
      title: "Lançar e começar na carreira",
      description:
        "Fechar o ciclo do produto e dar os primeiros passos concretos rumo a uma vaga de produto.",
      level: "avancado",
      children: [
        {
          id: "carreira.lancamento",
          title: "Lançar e iterar",
          description: "Por que o lançamento é um começo, não um fim.",
          content:
            "Há uma ideia errada e perigosa de que o trabalho termina quando a funcionalidade é lançada. Em produto, o **lançamento é o começo**, não o fim. Antes dele você trabalhava com hipóteses; depois, com o comportamento real dos usuários, que quase sempre surpreende.\n\nPor isso, lançar é só a abertura de um **ciclo de aprendizado**. Você acompanha as métricas que definiu (a funcionalidade está sendo usada? melhorou o que devia? as pessoas voltam?), ouve o feedback de quem usa e do suporte, e decide o próximo passo com base no que aprendeu. Muitas vezes a primeira versão revela problemas ou oportunidades que ninguém tinha previsto, e o valor real vem das iterações seguintes, não do lançamento inicial.\n\nPara reduzir risco, times maduros raramente lançam tudo pra todo mundo de uma vez. É comum liberar a novidade aos poucos: primeiro pra um grupo pequeno, observando se está tudo bem, e ampliando conforme a confiança cresce. Assim, se algo der errado, o impacto é contido e fácil de reverter.\n\nIsso fecha o círculo de toda a trilha. Discovery levanta hipóteses, o time constrói em ciclos ágeis, o lançamento as coloca à prova com usuários reais, as métricas mostram o resultado, e o aprendizado alimenta o próximo discovery. Produto não é uma linha reta com fim; é esse ciclo girando continuamente, cada volta deixando o produto um pouco melhor. Internalizar essa noção de melhoria contínua é entender o que a área realmente é.",
          resources: [
            {
              label: "Atlassian: sprints",
              url: "https://www.atlassian.com/agile/scrum/sprints",
              kind: "doc",
            },
          ],
        },
        {
          id: "carreira.projeto",
          title: "Projeto final: métricas de retenção",
          description:
            "Uma estratégia de métricas de retenção completa, o raciocínio de produto aplicado de ponta a ponta.",
          content:
            "Olhe pra trás um instante: você entrou nesta trilha achando que produto era construir funcionalidades, e agora se apaixona pelo problema, faz discovery pra errar barato, prioriza dizendo não, especifica com clareza e mede o que importa. Este passo junta o raciocínio de produto num artefato só, do jeito que um PM entrega valor: pensando, não codando.\n\nA encomenda é a do projeto abaixo, uma **estratégia de métricas de retenção**: escolha um produto (real ou fictício) e monte a estratégia de como medir se ele entrega valor de verdade. Defina a **North Star** que captura o valor central, os KPIs que a sustentam e os **contrapesos** de qualidade que impedem de inflar o número às custas da experiência. Desenhe o **funil** até a ação que faz a pessoa voltar, aponte onde o produto perde gente, e formule as **hipóteses** de melhoria como algo que pode ser refutado por um teste.\n\nO que separa este trabalho de um relatório qualquer é a **defensabilidade**: cada métrica vem com o porquê, e você precisa distinguir uma métrica de vaidade de uma acionável, e argumentar a escolha com critério, não com opinião.\n\nO critério de chegada é objetivo: um documento no GitHub (ou num portfólio) com a North Star, os KPIs e contrapesos, o funil com o ponto de maior queda, e as hipóteses de melhoria testáveis, de forma que outra pessoa entenda a lógica e você a defenda numa conversa. É este artefato que prova, mais que qualquer certificado, que você pensa como produto.",
          project: "metricas-retencao-produto",
        },
        {
          id: "carreira.entrar",
          title: "Entrar na carreira de produto",
          description:
            "Como construir experiência e portfólio quando ninguém te deu o cargo ainda.",
          content:
            "Produto tem um paradoxo cruel pra quem começa: as vagas pedem experiência, mas é difícil conseguir experiência sem a vaga. A boa notícia é que dá pra construir prova de capacidade por conta própria, e a maioria dos PMs chegou à área por **transição de carreira**, não por um diploma específico.\n\nO primeiro caminho é praticar o raciocínio de produto sem precisar de emprego. Pegue um produto que você usa, analise-o com olhar crítico: que problema ele resolve, pra quem, onde ele falha, o que você melhoraria e por quê. Crie um documento de produto fictício: defina um problema, um público, uma solução, métricas de sucesso e um roadmap. Esses exercícios, bem feitos, viram um **portfólio** que mostra como você pensa, que é justamente o que entrevistas de produto avaliam.\n\nO segundo caminho é aproveitar de onde você já vem. Quem trabalha com vendas conhece o cliente; quem vem de suporte conhece as dores; quem vem de dados sabe medir; quem vem de design entende o usuário. Produto valoriza essas bagagens, e enquadrar sua experiência atual em termos de produto (problemas que você resolveu, decisões que tomou, impacto que gerou) é meio caminho andado.\n\nDuas atitudes aceleram tudo. Desenvolver a **comunicação**, que é a ferramenta número um do PM, escrevendo e apresentando suas análises com clareza. E mostrar que você pensa em **problema, usuário e valor**, não em funcionalidades soltas. Demonstrar essa mentalidade num exercício real importa mais que qualquer certificado, porque é exatamente o que o trabalho exige todos os dias.",
        },
      ],
    },
  ],
};
