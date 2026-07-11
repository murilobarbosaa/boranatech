import type { RoadmapV2 } from "../types";

export const sre: RoadmapV2 = {
  slug: "sre",
  area: "sre",
  title: "SRE do Zero",
  level: "Iniciante",
  description:
    "Da base técnica à engenharia de confiabilidade: SLOs, observabilidade, resposta a incidentes e automação pra manter sistemas grandes no ar. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é engenharia de confiabilidade, como difere de DevOps e a filosofia que a guia.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é SRE",
          description:
            "Usar engenharia de software para operar sistemas grandes com confiabilidade.",
          content:
            "SRE (Site Reliability Engineering, ou engenharia de confiabilidade) é a disciplina que usa **programação e engenharia de software pra operar sistemas** em escala, mantendo-os estáveis, rápidos e disponíveis. A ideia que a define: tratar a operação de infraestrutura como um problema de software, automatizando tudo que antes era feito manualmente por equipes de operações.\n\nA disciplina surgiu no **Google**, que precisava manter serviços gigantescos funcionando e percebeu que escalar isso com trabalho manual era impossível. A solução foi colocar engenheiros de software pra resolver problemas de operação com código. Daí nasceram conceitos e uma cultura que hoje são referência mundial, documentados nos livros de SRE do Google, que são gratuitos e a melhor fonte da área.\n\nNa prática, o SRE monitora a saúde dos sistemas (disponibilidade, latência, erros), automatiza tarefas de operação, responde a incidentes quando algo quebra, e trabalha pra tornar as aplicações mais resilientes e escaláveis. Tudo com um objetivo central: **confiabilidade**, garantir que o sistema funcione pros usuários de forma consistente.\n\nUm recado honesto que a própria área repete, e que vale ter claro desde já: SRE **raramente é uma primeira vaga**. É uma área avançada (a mais difícil entre as de infraestrutura) que costuma exigir experiência prévia em desenvolvimento ou em infraestrutura/DevOps. Em compensação, é muito valorizada e bem paga. Encare esta trilha como o mapa de uma especialização poderosa, idealmente construída sobre uma base anterior. Ela te mostra o que torna o SRE único, com destaque pros conceitos de confiabilidade que são o coração da profissão.",
          resources: [
            {
              label: "Google SRE Books (gratuitos, em inglês)",
              url: "https://sre.google/books/",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.vsdevops",
          title: "SRE e DevOps",
          description:
            "Duas abordagens da mesma busca por entregar software rápido e estável.",
          content:
            'SRE e DevOps são frequentemente confundidos, e com razão: os dois buscam o mesmo objetivo (entregar software de forma rápida e confiável, unindo desenvolvimento e operações) e compartilham muitas ferramentas. Vale entender a relação pra não se perder.\n\nUma forma popular de descrever a relação: se o **DevOps** é uma filosofia, um conjunto de princípios sobre como dev e ops devem colaborar, o **SRE** é uma **implementação concreta e prescritiva** dessa filosofia, com práticas e métricas específicas. Diz-se que SRE é o que acontece quando você pede a um engenheiro de software pra projetar a operação. O DevOps diz "reduza os silos, automatize, meça"; o SRE diz exatamente **como**, com conceitos rigorosos como SLOs e error budgets.\n\nNa prática, há muita sobreposição: ambos usam containers, Kubernetes, CI/CD, observabilidade e infraestrutura como código, temas que a trilha de DevOps cobre em profundidade. A diferença está na **ênfase** e no rigor. O SRE traz uma abordagem mais quantitativa e baseada em engenharia pra **confiabilidade**: ele mede a confiabilidade com números, define metas explícitas pra ela e usa essas metas pra tomar decisões. Essa disciplina em torno de medir e gerenciar confiabilidade é o que distingue o SRE.\n\nPor isso, esta trilha não repete tudo de DevOps. Ela aborda a base técnica de forma mais breve, apontando pra trilha de DevOps onde fizer sentido, e foca no que é **distintamente SRE**: a engenharia de confiabilidade, com SLIs, SLOs, error budgets, resposta a incidentes e a cultura própria da área. É aí que mora o valor único da profissão.',
        },
        {
          id: "fundamentos.risco",
          title: "Confiabilidade e a aceitação do risco",
          description:
            "Por que buscar 100% de disponibilidade é o objetivo errado.",
          content:
            'Aqui está uma das ideias mais contraintuitivas e fundadoras do SRE, que muda como você pensa sobre sistemas: **buscar 100% de confiabilidade é o objetivo errado**. Parece absurdo à primeira vista (quem não quer um sistema que nunca cai?), mas faz todo sentido quando você entende o raciocínio.\n\nO primeiro motivo é prático: 100% é praticamente impossível e o custo de cada "nove" adicional de disponibilidade cresce de forma absurda. Sair de 99% pra 99,9% é caro; chegar a 99,999% é caríssimo, exigindo redundância e complexidade enormes. O segundo motivo é mais profundo: os usuários **não percebem** a diferença além de certo ponto. Se a conexão de internet da pessoa já falha mais que o seu serviço, melhorar a confiabilidade do serviço não muda a experiência dela. Você estaria gastando uma fortuna pra um ganho que ninguém nota.\n\nDaí nasce o conceito central: em vez de perseguir a perfeição, o SRE define um **nível de confiabilidade adequado** pro serviço (alto, mas não 100%) e gerencia conscientemente em torno dele. A diferença entre esse alvo e os 100% é o espaço onde se pode **assumir risco**: lançar mudanças, inovar, mover rápido. Um sistema que nunca pode falhar é um sistema que nunca pode mudar, e isso mata a inovação.\n\nEssa aceitação consciente do risco é a base filosófica que sustenta os conceitos de SLO e error budget que você verá em breve. Ela transforma confiabilidade de um desejo vago ("que não caia nunca") numa decisão de engenharia, com um alvo explícito e um orçamento de falhas que o time pode gastar com inteligência. Internalizar isso é entender o que o SRE realmente é.',
        },
      ],
    },
    {
      id: "bases",
      title: "Base técnica",
      description:
        "Os pré-requisitos técnicos sobre os quais o trabalho de SRE se apoia.",
      level: "iniciante",
      children: [
        {
          id: "bases.tecnica",
          title: "A base técnica de um SRE",
          description:
            "Linux, redes e programação: o alicerce que o SRE precisa ter.",
          content:
            "Antes da engenharia de confiabilidade, o SRE precisa de uma base técnica sólida, e é parte do motivo pelo qual a área raramente é uma primeira vaga. Três fundamentos sustentam tudo.\n\n**Linux e redes**: a imensa maioria dos sistemas roda em Linux, e o SRE precisa entender o sistema a fundo (processos, recursos, logs, linha de comando) e como as redes funcionam (como os dados trafegam, portas, protocolos), porque problemas de confiabilidade frequentemente moram nesse nível. Não dá pra diagnosticar um sistema lento sem entender o que está acontecendo por baixo.\n\n**Programação**: o que distingue o SRE de um operador tradicional é resolver problemas de operação com **código**. As linguagens mais usadas na área são **Python** (ótima pra automação e scripts) e **Go** (criada pensando em sistemas e infraestrutura, muito presente em ferramentas de nuvem). Você usa programação pra automatizar tarefas, construir ferramentas e integrar sistemas. Sem saber programar, você é um operador; com programação, você é um engenheiro de confiabilidade.\n\nSe você está vindo do **desenvolvimento**, já tem a programação e precisa fortalecer a infraestrutura. Se vem da **infraestrutura ou DevOps**, já tem a base de sistemas e precisa reforçar a programação. Os dois caminhos convergem aqui, e é por isso que SRE costuma ser um passo posterior, não o ponto de partida.\n\nGrande parte dessa base, junto com o ferramental que vem a seguir, é compartilhada com DevOps. Se você ainda não a tem firme, vale construí-la primeiro; a trilha de DevOps cobre esse terreno em detalhe.",
          resources: [
            {
              label: "Ubuntu: linha de comando pra iniciantes",
              url: "https://ubuntu.com/tutorials/command-line-for-beginners",
              kind: "artigo",
            },
            {
              label: "Go: documentação oficial (linguagem comum em SRE)",
              url: "https://go.dev/doc/",
              kind: "doc",
            },
          ],
        },
        {
          id: "bases.k8s",
          title: "Containers e Kubernetes",
          description:
            "A plataforma onde os sistemas modernos rodam, e que o SRE opera.",
          content:
            "Os sistemas modernos que o SRE mantém no ar rodam, em grande parte, em **containers** orquestrados por **Kubernetes**. Entender essa plataforma é parte essencial do ferramental da área, ainda que não seja o que distingue o SRE de outras áreas de infraestrutura.\n\nResumindo o que a trilha de DevOps detalha: um **container** empacota uma aplicação com tudo que ela precisa pra rodar igual em qualquer lugar (a tecnologia mais conhecida é o Docker), e o **Kubernetes** é o orquestrador que gerencia muitos containers em escala, distribuindo-os por servidores, reiniciando os que falham, escalando conforme a demanda e cuidando da rede entre eles.\n\nPara o SRE, o Kubernetes importa por um motivo especial: muitos dos mecanismos de **confiabilidade** vivem nele. Ele reinicia automaticamente um container que morreu, distribui réplicas pra que a falha de uma não derrube o serviço, faz verificações de saúde (health checks) pra saber se a aplicação está respondendo, e permite escalar pra aguentar picos de carga. Operar bem o Kubernetes é, em boa medida, operar a confiabilidade dos sistemas modernos.\n\nVale o mesmo alerta de ritmo que aparece em DevOps: o Kubernetes é poderoso e complexo, e faz sentido aprendê-lo depois de dominar containers. Para o SRE, não basta saber usá-lo; é preciso entender como ele se comporta sob falha e sob carga, porque é exatamente nesses momentos que a confiabilidade é testada.\n\nComo essa base técnica é compartilhada com DevOps e nuvem, esta trilha a trata de forma resumida. O foco daqui pra frente é o que torna o SRE único: medir e gerenciar a confiabilidade.",
          resources: [
            {
              label: "Kubernetes: conceitos básicos (oficial)",
              url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "confiabilidade",
      title: "Engenharia de confiabilidade",
      description:
        "O coração do SRE: medir a confiabilidade com números e gerenciá-la com metas explícitas.",
      level: "intermediario",
      children: [
        {
          id: "confiabilidade.sli",
          title: "SLIs: medir o que importa",
          description:
            "Os indicadores que medem, de fato, a experiência do usuário.",
          content:
            'Pra gerenciar a confiabilidade, primeiro é preciso **medi-la**, e é aqui que entra o **SLI** (Service Level Indicator, ou indicador de nível de serviço): uma métrica que mede, de forma objetiva, algum aspecto da qualidade do serviço do ponto de vista do usuário.\n\nA palavra-chave é "do ponto de vista do usuário". Um SLI não mede coisas internas que ao usuário não importam (como o uso de CPU de um servidor); mede o que ele de fato experimenta. Os SLIs mais comuns são. A **disponibilidade**: a proporção de requisições bem-sucedidas (o serviço respondeu, ou deu erro?). A **latência**: quanto tempo as requisições demoram (o serviço está rápido?). E a **taxa de erros**: a fração de requisições que falham. Dependendo do serviço, há outros, como a vazão (quanto ele processa) ou a qualidade dos dados.\n\nA escolha dos SLIs certos é mais sutil do que parece, e é uma habilidade central do SRE. O erro comum é medir muita coisa que não reflete a experiência real. A pergunta guia é: "o que, se piorasse, o usuário sentiria e reclamaria?". Se a latência subir e o usuário perceber lentidão, latência é um bom SLI. Se uma métrica interna oscilar sem o usuário notar, ela não é um bom SLI de confiabilidade.\n\nUm detalhe importante na medição da latência: olha-se os **percentis**, não só a média. A média esconde os casos ruins; o percentil 99 (o tempo que 99% das requisições não ultrapassam) revela a experiência dos usuários mais prejudicados, que são os que reclamam. Os SLIs são a fundação quantitativa de tudo o que vem a seguir: sem medir bem, não há como definir metas nem gerenciar confiabilidade.',
          resources: [
            {
              label: "Google SRE Book: Service Level Objectives",
              url: "https://sre.google/sre-book/service-level-objectives/",
              kind: "doc",
            },
          ],
        },
        {
          id: "confiabilidade.slo",
          title: "SLOs: definir a meta",
          description:
            "A meta explícita de confiabilidade que o time se compromete a manter.",
          content:
            'Com os SLIs medindo a confiabilidade, o **SLO** (Service Level Objective, ou objetivo de nível de serviço) é a **meta** que você define pra cada indicador: o nível de confiabilidade que o serviço se compromete a manter. É o conceito mais central do SRE.\n\nUm SLO é um número concreto sobre um SLI, ao longo de um período. Por exemplo: "99,9% das requisições devem ser bem-sucedidas, medido ao longo de 30 dias", ou "95% das requisições devem responder em menos de 300 milissegundos". Ele transforma a confiabilidade de um desejo vago ("o sistema tem que ser rápido e estável") numa meta explícita, mensurável e acordada.\n\nA escolha do SLO conecta diretamente com a filosofia de aceitação do risco que você viu: o alvo é **alto, mas deliberadamente abaixo de 100%**, porque a perfeição é cara demais e desnecessária. O número certo vem de entender o que os usuários realmente precisam e o que o negócio pode sustentar, não de cravar o máximo possível por reflexo.\n\nO poder do SLO está em ser uma **decisão compartilhada** entre engenharia, produto e negócio. Todos concordam com a meta, e ela vira a régua objetiva pra decisões: o serviço está dentro do SLO? Então está confiável o suficiente, e o time pode focar em entregar novidades. Está abaixo? Então confiabilidade vira prioridade. Em vez de discussões emocionais sobre "o sistema está estável?", há um número que responde.\n\nUm cuidado relacionado: existem os **SLAs** (acordos de nível de serviço), que são compromissos contratuais com clientes, geralmente com penalidades. Os SLOs costumam ser mais rígidos que os SLAs, justamente pra você corrigir o rumo antes de quebrar uma promessa contratual. O guia prático do Google de implementação de SLOs é uma referência excelente pra aprofundar.',
          resources: [
            {
              label: "Google SRE Workbook: implementando SLOs",
              url: "https://sre.google/workbook/implementing-slos/",
              kind: "doc",
            },
          ],
        },
        {
          id: "confiabilidade.errorbudget",
          title: "Error budget",
          description:
            "O orçamento de falhas que equilibra estabilidade e inovação.",
          content:
            'O **error budget** (orçamento de erros) é talvez a ideia mais elegante do SRE, e o que conecta confiabilidade com inovação de forma genial. Ele surge diretamente do SLO.\n\nSe o seu SLO é 99,9% de disponibilidade, isso significa que você **aceita** 0,1% de falhas. Esse 0,1% é o seu error budget: um orçamento de "falha permitida" que o time pode gastar ao longo do período. Em vez de tratar toda falha como inaceitável, você reconhece que existe um espaço de erro tolerável, e o gerencia como um recurso.\n\nA genialidade está em como isso resolve o conflito eterno entre **estabilidade e velocidade**. Times de desenvolvimento querem lançar rápido (e mudança traz risco); times de operação querem estabilidade (e estabilidade pede cautela). O error budget transforma esse conflito numa regra objetiva: **enquanto há orçamento de erro disponível**, o time pode lançar mudanças à vontade, inovar, mover rápido, porque há margem pra absorver eventuais falhas. **Quando o orçamento se esgota** (o serviço já falhou mais que o permitido no período), os lançamentos param e a prioridade vira estabilizar, até o orçamento se recompor.\n\nIsso muda tudo. A decisão de "podemos lançar isso arriscado agora?" deixa de ser uma briga de opiniões e vira matemática: tem orçamento? Pode. Acabou? Não pode. Engenharia e produto passam a ter um incentivo alinhado, porque gastar o orçamento com falhas bobas significa menos espaço pra lançar coisas novas.\n\nO error budget é o que faz a confiabilidade ser um facilitador da inovação, não um freio. É a peça que fecha o tripé SLI, SLO, error budget, o coração quantitativo do SRE, e o que mais distingue a disciplina de uma operação tradicional.',
        },
      ],
    },
    {
      id: "observabilidade",
      title: "Observabilidade",
      description:
        "Enxergar profundamente o que acontece dentro dos sistemas para medir, alertar e diagnosticar.",
      level: "intermediario",
      children: [
        {
          id: "observabilidade.tres",
          title: "Logs, métricas e tracing",
          description:
            "Os três pilares que permitem entender o que um sistema está fazendo.",
          content:
            'Não dá pra manter confiável o que você não consegue enxergar. A **observabilidade** é a capacidade de entender o estado interno de um sistema pelo que ele emite pra fora, e é o que permite medir os SLIs, disparar alertas e diagnosticar problemas. Ela se apoia em três pilares.\n\nAs **métricas** são números medidos ao longo do tempo: requisições por segundo, latência, uso de recursos, taxa de erros. São compactas, ideais pra acompanhar tendências e disparar alertas, e é delas que saem os SLIs. Respondem "o que está acontecendo, em números?".\n\nOs **logs** são registros de eventos, linha a linha, do que o sistema fez. São detalhados e essenciais pra investigar o que aconteceu quando algo deu errado. Respondem "o que exatamente ocorreu neste momento?". Logs bem estruturados (com campos, não só texto solto) são muito mais fáceis de filtrar e analisar.\n\nO **tracing** (rastreamento) segue uma requisição através de **vários serviços**, mostrando por onde ela passou e quanto tempo gastou em cada etapa. É especialmente valioso em sistemas distribuídos, onde uma única requisição do usuário pode atravessar dezenas de serviços, e o tracing revela exatamente onde o tempo se perde ou o erro acontece.\n\nOs três se complementam: as métricas avisam que algo está errado, os logs e os traces ajudam a descobrir **por quê**. A diferença entre monitoramento tradicional e observabilidade é a profundidade: observabilidade é poder fazer perguntas novas sobre o sistema ("por que só os usuários da região X estão lentos?") e obter respostas, mesmo que você não tivesse previsto a pergunta. Pra um SRE, dominar esses três pilares é pré-requisito pra todo o resto.',
        },
        {
          id: "observabilidade.sinais",
          title: "Sinais de ouro e ferramentas",
          description:
            "O que monitorar de mais importante, e com quais ferramentas.",
          content:
            'Com tantas coisas possíveis de medir, por onde começar? O SRE tem uma resposta consagrada: os **quatro sinais de ouro** (golden signals), os indicadores mais importantes pra monitorar qualquer serviço voltado a usuários, segundo o livro de SRE do Google.\n\nSão eles. A **latência**: quanto tempo as requisições demoram, separando as bem-sucedidas das que falham (uma falha rápida e uma falha lenta contam histórias diferentes). O **tráfego**: quanta demanda o serviço está recebendo. Os **erros**: a taxa de requisições que falham. E a **saturação**: o quão "cheio" o serviço está, o quanto dos seus recursos já está em uso, indicando quão perto ele está do limite. Monitorar esses quatro já dá uma visão sólida da saúde de quase qualquer serviço, e eles se conectam diretamente com os SLIs.\n\nNo ferramental, a dupla mais comum no mundo SRE e DevOps é o **Prometheus**, que coleta e armazena métricas, e o **Grafana**, que as exibe em dashboards visuais e gráficos. Juntos, eles dão o retrato em tempo real da saúde dos sistemas, e são onde os quatro sinais de ouro e os SLIs ganham vida em painéis. Existem outras ferramentas, inclusive serviços gerenciados de observabilidade, mas Prometheus e Grafana são a base mais difundida e um ótimo ponto de aprendizado.\n\nUm bom dashboard de SRE não tenta mostrar tudo; mostra os sinais que importam, organizados pra responder rápido à pergunta "está tudo bem?". Construir esses painéis, ligados aos SLIs, é uma das atividades práticas centrais da área.',
          resources: [
            {
              label: "Google SRE Book: monitorando sistemas distribuídos",
              url: "https://sre.google/sre-book/monitoring-distributed-systems/",
              kind: "doc",
            },
            {
              label: "Prometheus: visão geral (oficial)",
              url: "https://prometheus.io/docs/introduction/overview/",
              kind: "doc",
            },
            {
              label: "Grafana: documentação oficial",
              url: "https://grafana.com/docs/",
              kind: "doc",
            },
          ],
        },
        {
          id: "observabilidade.alertas",
          title: "Alertas que importam",
          description:
            "Ser avisado dos problemas certos, sem afogar o time em ruído.",
          content:
            "Monitorar sem alertar é olhar pro painel e esperar notar um problema. Os **alertas** automatizam isso: regras que avisam a equipe quando algo foge do esperado, idealmente antes que o usuário perceba. Mas alertar bem é uma arte, e fazê-lo mal causa um dos maiores males da operação.\n\nEsse mal é a **fadiga de alertas** (alert fatigue). Quando o sistema dispara alertas demais, muitos irrelevantes ou que não exigem ação, a equipe se acostuma a ignorá-los, e aí o alerta importante passa despercebido no meio do ruído. Um time soterrado de notificações é, na prática, um time sem alertas, porque ninguém mais olha. Pior ainda, alertas constantes no meio da noite esgotam as pessoas.\n\nPor isso o SRE segue um princípio rigoroso: **alerte apenas sobre o que exige ação humana imediata**, de preferência ligado aos sintomas que afetam o usuário e ao consumo do error budget. Um bom alerta responde sim a três perguntas: isso é real? é urgente? exige que um humano aja agora? Se a resposta a qualquer uma é não, provavelmente não deveria ser um alerta que acorda alguém; pode ser apenas registrado pra análise posterior.\n\nUma distinção útil: alertar sobre **sintomas** (o usuário está sofrendo: erros subindo, latência alta) costuma ser melhor que alertar sobre **causas** (um disco enchendo), porque há muitas causas possíveis pra cada sintoma, e o que importa é o impacto no usuário. O error budget também ajuda aqui: você pode alertar com base na velocidade com que ele está sendo consumido, focando a atenção no que de fato ameaça a meta de confiabilidade.\n\nAlertas bem desenhados são o que permite ao SRE dormir tranquilo, sendo acordado só quando realmente importa.",
        },
      ],
    },
    {
      id: "incidentes",
      title: "Resposta a incidentes",
      description:
        "Como agir quando algo quebra, e como aprender com isso sem caçar culpados.",
      level: "avancado",
      children: [
        {
          id: "incidentes.resposta",
          title: "Resposta a incidentes e on-call",
          description:
            "Agir de forma organizada quando um sistema falha, sob pressão.",
          content:
            "Por mais confiável que seja um sistema, **incidentes acontecem**: o serviço cai, fica lento, começa a dar erros. A forma como a equipe responde define se é um susto contornado em minutos ou uma crise que dura horas. A resposta a incidentes é uma competência central do SRE, e tem método.\n\nUma prática comum na área é o **on-call** (plantão): a cada momento, alguém da equipe está de prontidão pra responder se um alerta disparar, inclusive fora do horário comercial. É uma responsabilidade séria, e justamente por isso o SRE se importa tanto com bons alertas: ninguém deve ser acordado por um alarme falso. Plantões sustentáveis, que não esgotam as pessoas, são uma preocupação real e ética da disciplina.\n\nDurante um incidente, a calma e a organização valem ouro. Práticas maduras incluem definir **papéis claros** (quem comanda a resposta, quem investiga, quem comunica), manter uma **comunicação centralizada** pra todo mundo saber o que está acontecendo, e focar primeiro em **restaurar o serviço** (mitigar o impacto no usuário), deixando a investigação da causa raiz pra depois. No calor do momento, parar o sangramento vem antes de entender por que ele começou.\n\nUm erro comum sob pressão é agir por impulso e piorar tudo: mexer em várias coisas ao mesmo tempo sem registrar, ou tomar decisões drásticas no pânico. Por isso existe o processo. Manter a cabeça fria, seguir um roteiro e priorizar o usuário é o que diferencia uma resposta profissional.\n\nE o incidente não termina quando o serviço volta. Ele termina quando o time aprende com ele, o que é o tema do próximo passo, e talvez a parte mais valiosa de toda a resposta.",
        },
        {
          id: "incidentes.postmortem",
          title: "Post-mortems sem culpa",
          description:
            "Transformar cada falha em aprendizado, sem procurar culpados.",
          content:
            'Depois que um incidente é resolvido, o SRE faz um **post-mortem**: um documento que analisa o que aconteceu, por quê, como foi resolvido e, principalmente, o que será feito pra evitar que se repita. É aqui que a falha vira aprendizado, e é uma das práticas mais valiosas da cultura SRE.\n\nO princípio que define um bom post-mortem é ser **sem culpa** (blameless). Isso significa analisar o incidente focando nas **causas sistêmicas**, não em apontar a pessoa que "errou". A lógica é poderosa: se uma pessoa conseguiu derrubar o sistema com um comando, o problema real não é a pessoa, é o **sistema** que permitiu que um comando fizesse isso sem proteção. A pergunta certa não é "quem errou?", é "o que no nosso processo e nas nossas ferramentas permitiu que esse erro acontecesse e causasse esse estrago?".\n\nA razão de ser tão rigoroso quanto a isso é prática, não só gentileza. Quando há cultura de culpa, as pessoas **escondem** erros e quase-acidentes, com medo de punição, e o time perde a chance de aprender. Quando a cultura é sem culpa, as pessoas relatam problemas abertamente, e a organização melhora de verdade. Segurança psicológica gera transparência, e transparência gera confiabilidade.\n\nUm bom post-mortem costuma incluir: uma linha do tempo do que aconteceu, o impacto (quanto error budget foi gasto), a causa raiz, o que funcionou e o que não funcionou na resposta, e uma lista de **ações concretas** pra prevenir a repetição, com responsáveis. Sem ações de verdade, o post-mortem vira teatro.\n\nA mentalidade que sustenta tudo: falhas são inevitáveis e são oportunidades de aprender. Cada incidente bem analisado deixa o sistema um pouco mais robusto, fechando o ciclo de melhoria contínua que está no coração do SRE.',
          resources: [
            {
              label: "Google SRE Book: cultura de post-mortem",
              url: "https://sre.google/sre-book/postmortem-culture/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "automacao",
      title: "Automação e resiliência",
      description:
        "Eliminar o trabalho manual repetitivo e construir sistemas que aguentam falhas e crescimento.",
      level: "avancado",
      children: [
        {
          id: "automacao.toil",
          title: "Toil: eliminar o trabalho manual",
          description:
            "O conceito que orienta o SRE a automatizar em vez de repetir.",
          content:
            'Um conceito central e muito característico do SRE é o **toil**: o trabalho operacional manual, repetitivo, automatizável e sem valor duradouro, que cresce junto com o sistema. Reiniciar um serviço na mão toda vez que trava, aplicar a mesma configuração repetidamente, responder ao mesmo tipo de alerta com os mesmos passos: isso é toil.\n\nO problema do toil não é só ser chato; é que ele **não escala** e consome o tempo que deveria ir pra engenharia de verdade. Se a operação de um sistema exige cada vez mais trabalho manual conforme ele cresce, em algum momento a equipe afoga em tarefas repetitivas e não sobra tempo pra melhorar nada. É uma armadilha que mata equipes de operação tradicionais.\n\nA filosofia do SRE ataca isso de frente: o objetivo é **automatizar o toil pra eliminá-lo**, liberando os engenheiros pra trabalho que realmente melhora o sistema. Por isso o SRE é, antes de tudo, um engenheiro: ele resolve problemas de operação escrevendo código que faz a tarefa repetitiva sozinho, de forma confiável, pra sempre. O Google chega a recomendar limitar a fração do tempo da equipe gasta com toil, pra garantir que sobre tempo pra engenharia.\n\nA mentalidade prática é poderosa e simples: quando você se pega fazendo algo manual pela segunda ou terceira vez, pare e pergunte "isso dá pra automatizar?". Quase sempre dá, e o investimento de automatizar se paga rápido. Essa busca incansável por eliminar o trabalho manual repetitivo é uma das marcas mais distintivas da profissão, e o que conecta o SRE diretamente com a habilidade de programar. Automação não é um detalhe do trabalho; é o trabalho.',
          resources: [
            {
              label: "Google SRE Book: eliminando o toil",
              url: "https://sre.google/sre-book/eliminating-toil/",
              kind: "doc",
            },
          ],
        },
        {
          id: "automacao.resiliencia",
          title: "Escalabilidade e resiliência",
          description:
            "Construir sistemas que aguentam crescer e que sobrevivem a falhas.",
          content:
            "Além de operar sistemas, o SRE trabalha pra torná-los **mais robustos por projeto**, atuando junto com o desenvolvimento. Dois objetivos guiam isso: escalabilidade e resiliência.\n\nA **escalabilidade** é a capacidade do sistema de aguentar mais carga (mais usuários, mais dados) sem degradar. A forma mais comum de escalar na nuvem é **horizontalmente**: adicionar mais cópias (réplicas) da aplicação pra dividir a carga, em vez de depender de uma única máquina cada vez maior. Sistemas bem projetados escalam adicionando réplicas, e o Kubernetes ajuda a fazer isso automaticamente conforme a demanda sobe e desce.\n\nA **resiliência** é a capacidade de continuar funcionando (ou se recuperar rápido) diante de falhas, porque falhas são inevitáveis em escala: máquinas quebram, redes oscilam, dependências caem. Algumas técnicas tornam sistemas resilientes. A **redundância**: ter cópias e caminhos alternativos, pra que a falha de um componente não derrube tudo (lembra das zonas de disponibilidade na nuvem). A **degradação graciosa**: quando uma parte falha, o sistema continua oferecendo o essencial em vez de cair por inteiro (um app que mostra o conteúdo principal mesmo se a parte de recomendações estiver fora). E a contenção de falhas, pra que o problema de um componente não se espalhe em cascata pelos outros.\n\nUma frase resume a mentalidade do SRE aqui: **projete esperando a falha**. Em vez de torcer pra nada quebrar, você assume que vai quebrar e constrói o sistema pra sobreviver a isso. Essa postura, somada à infraestrutura como código que torna tudo reproduzível e à automação que elimina o toil, é o que permite manter sistemas grandes confiáveis. É a engenharia, no sentido pleno, aplicada à confiabilidade.",
          resources: [
            {
              label:
                "Terraform: documentação oficial (infraestrutura como código)",
              url: "https://developer.hashicorp.com/terraform/docs",
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
        "Os melhores recursos da área e o caminho realista pra uma especialização avançada e bem paga.",
      level: "avancado",
      children: [
        {
          id: "carreira.projeto",
          title: "Projeto final: observabilidade com SLO",
          description:
            "Métricas, SLO com error budget e um incidente simulado com postmortem, SRE de ponta a ponta.",
          project: "stack-observabilidade-slo",
        },
        {
          id: "carreira.entrar",
          title: "Entrar na carreira",
          description:
            "Como se preparar para uma das áreas mais avançadas e valorizadas de infraestrutura.",
          content:
            "SRE é uma das áreas mais avançadas, valorizadas e bem pagas de infraestrutura, e raramente é uma primeira vaga. Encarar isso com realismo é o que evita frustração e te coloca no caminho certo.\n\nO ponto de partida quase sempre é uma **base prévia**. A maioria dos SREs chega à área vinda do **desenvolvimento** (trazendo a programação) ou da **infraestrutura/DevOps** (trazendo o conhecimento de sistemas e operação). Se você está começando do zero em tecnologia, o caminho inteligente é construir primeiro uma dessas bases, talvez passando por desenvolvimento ou DevOps, e migrar pra SRE depois. Não há atalho que pule essa fundação, porque o SRE precisa programar **e** entender infraestrutura a fundo.\n\nSobre essa base, o que distingue o candidato a SRE é o domínio dos conceitos **próprios da confiabilidade** que esta trilha enfatizou: SLIs, SLOs, error budgets, observabilidade, resposta a incidentes e a cultura de automação e post-mortems sem culpa. Saber falar com propriedade sobre como medir e gerenciar confiabilidade é o que diferencia um SRE de um operador ou de um DevOps generalista.\n\nA melhor referência da área é gratuita e indispensável: os **livros de SRE do Google**, disponíveis online, que definiram a disciplina e detalham tudo o que vimos aqui em profundidade. Lê-los é praticamente um rito de passagem da profissão. Some a isso prática com o ferramental (Kubernetes, Prometheus, Grafana, Terraform), idealmente em projetos que demonstrem confiabilidade: subir uma aplicação em Kubernetes com monitoramento, montar dashboards de métricas, automatizar deploy com pipeline e infraestrutura como código.\n\nDuas qualidades fecham o perfil: a **calma sob pressão**, essencial pra resposta a incidentes, e a **obsessão por automação**, porque o SRE existe pra eliminar o trabalho manual com engenharia. Com a base certa, os conceitos de confiabilidade dominados e os livros do Google como guia, você está no caminho de uma carreira de elite em infraestrutura.",
          resources: [
            {
              label: "Google SRE Books (índice, gratuitos)",
              url: "https://sre.google/sre-book/table-of-contents/",
              kind: "doc",
            },
          ],
        },
      ],
    },
  ],
};
