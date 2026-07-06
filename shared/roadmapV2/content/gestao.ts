import type { RoadmapV2 } from "../types";

export const gestao: RoadmapV2 = {
  slug: "gestao",
  area: "gestao",
  title: "Gestão de Projetos Tech do Zero",
  level: "Iniciante",
  description:
    "Da mentalidade ágil e do Scrum à facilitação, planejamento, gestão de riscos e certificações. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é coordenar projetos de tecnologia, quais papéis fazem isso e a tensão que todo projeto carrega.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é gestão de projetos tech",
          description:
            "Coordenar pessoas, prazos e recursos pra entregar projetos de tecnologia.",
          content:
            "Gestão de projetos em tecnologia é a prática de coordenar pessoas, prazos e recursos pra que um projeto saia do papel e seja entregue com sucesso. Não é quem programa nem quem desenha; é quem **organiza** o trabalho do time, remove obstáculos e garante que tudo caminhe junto rumo ao objetivo.\n\nNa prática, esse profissional facilita o dia a dia da equipe: organiza o que precisa ser feito e em que ordem, conduz as reuniões, acompanha o andamento, identifica riscos antes que virem problemas e mantém quem está de fora (chefes, clientes, outras áreas) informado. É um trabalho de muita **comunicação** e organização, pouco de execução técnica direta.\n\nUma confusão comum vale esclarecer: gestão de projetos não é mandar nas pessoas. Em times de tecnologia, especialmente os ágeis, quem coordena raramente é o chefe da equipe. A força do papel vem de **facilitar e influenciar**, não de dar ordens. Servir o time, destravar o que atrapalha e criar as condições pra que as pessoas entreguem o melhor é a essência do trabalho.\n\nUm ponto importante pra carreira: você não precisa ser um programador experiente pra atuar aqui, mas precisa entender o suficiente de tecnologia pra falar a língua do time e tomar boas decisões. Por isso a área recebe muita gente em transição, vinda de outras funções, que traz organização, comunicação e liderança. Esta trilha te dá o mapa dessa profissão, na ordem certa.",
          resources: [
            {
              label: "Atlassian: gestão ágil de projetos",
              url: "https://www.atlassian.com/agile/project-management",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.projetoproduto",
          title: "Projeto, produto e operação",
          description:
            "Três formas de trabalho que se confundem e pedem abordagens diferentes.",
          content:
            "Três palavras aparecem juntas em tecnologia e confundem quem começa: projeto, produto e operação. Separá-las ajuda a entender onde a gestão de projetos atua.\n\nUm **projeto** tem começo, meio e fim, com um objetivo definido: migrar um sistema, lançar uma nova plataforma, implantar uma ferramenta. Ele termina quando o objetivo é atingido. É o terreno clássico da gestão de projetos: coordenar esse esforço temporário até a entrega.\n\nUm **produto** é contínuo e evolui sem data pra acabar: um app que melhora a cada versão. Quem cuida da estratégia do produto (o que construir e por quê) é o gerente de produto, um papel vizinho mas distinto. A gestão de projetos foca mais no **como entregar** do que no **o que e por quê**.\n\nA **operação** é o trabalho recorrente de manter algo funcionando: suporte, manutenção, rotinas. Não é um projeto, porque não tem fim; é o dia a dia que sustenta o que já existe.\n\nNa realidade, esses mundos se misturam, e os títulos variam de empresa pra empresa. Mas a distinção importa pra escolher a abordagem: trabalho temporário com objetivo claro pede gestão de projeto; trabalho contínuo de evolução pede gestão de produto; trabalho recorrente pede gestão de operação. Entender em qual você está evita aplicar a ferramenta errada, como tentar tocar um produto vivo com a rigidez de um projeto que precisa acabar numa data.",
        },
        {
          id: "fundamentos.papeis",
          title: "Os papéis da área",
          description:
            "Scrum Master, PMO, coordenador e Agile Coach, e como diferem.",
          content:
            "A gestão de projetos tech tem vários títulos, que confundem porque se sobrepõem. Conhecer os principais ajuda a entender o leque de caminhos e a saber pra onde mirar.\n\nO **Scrum Master** é talvez a porta de entrada mais comum hoje. Ele facilita o processo ágil de um time: conduz as cerimônias, ajuda a equipe a seguir o Scrum, remove impedimentos e protege o time de interferências. Não é um chefe; é um facilitador a serviço do time, e a maior parte desta trilha prepara pra esse papel.\n\nO **PMO** (escritório de projetos) é uma área que padroniza e acompanha os projetos da empresa, definindo métodos, ferramentas e relatórios. Um analista de PMO é outra entrada comum pra quem começa, mais voltada a organização, documentação e acompanhamento.\n\nO **coordenador de projetos** tem um papel mais tradicional de planejar cronogramas, gerenciar recursos e acompanhar entregas, às vezes em contextos menos ágeis. E o **Agile Coach** é um papel mais sênior, que ajuda não só um time, mas a organização inteira a adotar e amadurecer a cultura ágil.\n\nUm ponto que tira pressão de quem começa: você não precisa decidir tudo agora. Esses papéis compartilham uma base comum (métodos ágeis, comunicação, facilitação, organização) que é exatamente o que esta trilha cobre. Domine a base e a especialização vem com a experiência e o tipo de empresa onde você for atuar.",
          resources: [
            {
              label: "Scrum Guide (guia oficial)",
              url: "https://scrumguides.org/scrum-guide.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.restricoes",
          title: "Escopo, tempo e custo",
          description:
            "A tensão que todo projeto carrega e que a gestão precisa equilibrar.",
          content:
            "Existe um conceito clássico que resume a tensão de qualquer projeto, e entendê-lo cedo evita promessas impossíveis. É a ideia das três restrições que se equilibram: **escopo** (o quanto será feito), **tempo** (em quanto tempo) e **custo** (com quais recursos). As três estão ligadas, e mexer numa afeta as outras.\n\nA lição prática é que você não controla as três livremente ao mesmo tempo. Quer mais escopo no mesmo prazo? Vai precisar de mais recursos, ou a qualidade sofre. Quer entregar mais rápido sem aumentar a equipe? Algo do escopo precisa sair. Prometer mais escopo, em menos tempo, com menos gente, é a receita do projeto que atrasa, estoura o orçamento ou entrega algo ruim. Reconhecer esse trade-off é metade do trabalho de quem gerencia.\n\nUma diferença importante entre o jeito tradicional e o ágil aparece aqui. No modelo tradicional, costuma-se fixar o escopo e tentar estimar tempo e custo pra entregá-lo. No ágil, é comum fixar o tempo (os ciclos curtos) e o time, e deixar o **escopo** ser o que se ajusta: entrega-se o mais valioso primeiro, e o que não couber fica pra depois. Por isso priorização é tão central no ágil.\n\nGuarde a ideia central: gestão de projetos é, em boa parte, a arte de equilibrar essas três forças com honestidade, comunicando os trade-offs em vez de fingir que dá pra ter tudo. Quem promete o impossível pra agradar perde a confiança quando a conta chega.",
        },
      ],
    },
    {
      id: "agil",
      title: "Mentalidade ágil",
      description:
        "A filosofia que domina o desenvolvimento de tecnologia hoje e por que ela surgiu.",
      level: "iniciante",
      children: [
        {
          id: "agil.manifesto",
          title: "O manifesto ágil",
          description:
            "Os valores por trás de como times de tecnologia trabalham hoje.",
          content:
            "Quase todo time de tecnologia trabalha de forma **ágil**, e entender o espírito disso importa mais que decorar regras. A ideia nasceu como reação a um jeito antigo de tocar projetos: planejar tudo nos mínimos detalhes no início, executar por meses ou anos seguindo o plano à risca, e só entregar no fim. O problema é que, quando finalmente entregava, a necessidade já tinha mudado, ou o plano se revelava errado, e era tarde pra corrigir.\n\nEm 2001, um grupo de profissionais escreveu o **Manifesto Ágil**, com quatro valores que viraram a base do trabalho moderno. Em resumo: pessoas e a colaboração entre elas valem mais que processos rígidos; software funcionando vale mais que documentação extensa; colaborar com o cliente vale mais que negociar contratos travados; e responder a mudanças vale mais que seguir um plano fixo a qualquer custo.\n\nO coração de tudo é trabalhar em **ciclos curtos**, entregando pedaços pequenos, aprendendo com cada entrega e ajustando o rumo. Em vez de uma aposta gigante no escuro, muitas apostas pequenas com correção constante. Pra quem gerencia, isso muda o trabalho: menos controlar a execução de um plano fixo, mais facilitar um fluxo de adaptação contínua.\n\nUm cuidado honesto: ágil virou moda, e muita empresa adota o vocabulário (sprints, dailies) sem o espírito (adaptar-se, focar em valor, confiar no time). Seguir rituais não é ser ágil; ser ágil é entregar valor cedo e mudar de rota quando os fatos mudam. Quem gerencia precisa zelar pelo espírito, não só pelos ritos.",
          resources: [
            {
              label: "Manifesto Ágil (texto oficial, em português)",
              url: "https://agilemanifesto.org/iso/ptbr/manifesto.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "agil.cascata",
          title: "Cascata e ágil",
          description:
            "Os dois grandes modelos de tocar projetos e quando cada um faz sentido.",
          content:
            "Pra entender o ágil de verdade, vale conhecer o modelo que ele veio substituir em boa parte dos casos: o **cascata** (waterfall). Nele, o projeto avança em fases sequenciais e rígidas: primeiro levanta-se tudo o que precisa, depois projeta-se tudo, depois constrói-se tudo, depois testa-se, depois entrega-se. Cada fase só começa quando a anterior termina, como uma cascata que só corre pra baixo.\n\nO cascata tem uma lógica e ainda faz sentido em alguns contextos: projetos com requisitos muito claros e estáveis, onde mudança é cara ou perigosa (certas obras, sistemas regulados). Quando você sabe exatamente o que precisa desde o início e isso não vai mudar, planejar tudo de uma vez pode funcionar.\n\nO problema é que software raramente é assim. Requisitos mudam, o cliente descobre o que quer ao ver algo funcionando, o mercado se move. No cascata, descobrir um erro só no fim é caríssimo, porque já se construiu tudo em cima da premissa errada. Foi essa dor que fez o ágil surgir, com sua aposta em ciclos curtos e correção constante.\n\nNa prática, os dois modelos convivem, e muitas empresas usam abordagens híbridas. A maturidade não está em achar que ágil é sempre melhor, e sim em entender o **porquê** de cada um: ambiente incerto e que muda pede adaptação (ágil); ambiente estável e bem definido tolera planejamento longo (cascata). Quem gerencia escolhe a abordagem pelo contexto, não pela moda.",
          resources: [
            {
              label: "Atlassian: o que é ágil",
              url: "https://www.atlassian.com/agile",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "scrum",
      title: "Scrum",
      description:
        "O método ágil mais usado, e o que mais aparece em vagas de gestão de projetos tech.",
      level: "intermediario",
      children: [
        {
          id: "scrum.visao",
          title: "Scrum: a estrutura",
          description:
            "O método ágil mais difundido e a lógica dos seus ciclos de trabalho.",
          content:
            "O **Scrum** é a forma mais difundida de organizar trabalho ágil, e dominá-lo é praticamente obrigatório pra quem quer atuar em gestão de projetos tech. A ideia central é dividir o trabalho em **sprints**: ciclos curtos e de duração fixa (em geral de uma a quatro semanas) ao fim dos quais o time entrega algo funcional e utilizável.\n\nA lógica por trás é o aprendizado constante. Em vez de planejar meses à frente, o time se compromete com um conjunto pequeno de trabalho a cada sprint, entrega, mostra o resultado e ajusta o que vem depois com base no que aprendeu. Isso cria um ritmo previsível e oportunidades frequentes de corrigir o rumo, em vez de descobrir problemas só no fim.\n\nO Scrum se organiza em torno de três coisas: **papéis** (quem faz o quê), **eventos** (as reuniões e ciclos) e **artefatos** (os itens que organizam o trabalho, como o backlog). Os próximos nós detalham cada um. Por enquanto, guarde a estrutura geral: um time pequeno, ciclos curtos e repetidos, com pontos definidos pra planejar, alinhar, mostrar e melhorar.\n\nUma fonte vale destaque: o **Scrum Guide**, o documento oficial que define o Scrum, é curto, gratuito e leitura obrigatória pra quem leva a área a sério. Muito do que se vê por aí são interpretações; ir à fonte evita aprender o Scrum errado. Ele cabe em uma tarde de leitura e é a base das certificações da área.",
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
          id: "scrum.papeis",
          title: "Papéis no Scrum",
          description:
            "Quem compõe um time Scrum e a responsabilidade de cada um.",
          content:
            "O Scrum define um time pequeno com responsabilidades claras, e entender quem faz o quê é essencial, porque a confusão de papéis é fonte comum de problema nas empresas.\n\nO **Product Owner** é responsável por **o que** será construído e em que ordem. Ele cuida do backlog, define prioridades e representa a voz do negócio e do cliente. É quem decide o valor, dizendo o que é mais importante a cada momento.\n\nOs **desenvolvedores** (o time que constrói) são responsáveis por **como** transformar as prioridades em produto pronto. No Scrum, esse time é auto-organizado: ele decide a melhor forma de fazer o trabalho, em vez de receber ordens detalhadas. Confiar na autonomia do time é um princípio central.\n\nO **Scrum Master** é responsável por garantir que o Scrum funcione bem. Ele facilita os eventos, ajuda o time a melhorar, remove impedimentos e protege o time de interferências externas. É o papel mais ligado à gestão de projetos, e o ponto que mais gera mal-entendido: ele **não é o chefe** do time nem manda nas pessoas. É um líder servidor, que serve o time pra que ele renda melhor.\n\nUma observação útil pra carreira: em muitas empresas, especialmente menores, uma mesma pessoa acumula mais de um papel, ou os títulos não batem exatamente com o Scrum oficial. Conhecer a divisão ideal te ajuda a enxergar essas distorções e a entender qual responsabilidade está, na prática, na sua mão.",
          resources: [
            {
              label: "Scrum Guide (guia oficial)",
              url: "https://scrumguides.org/scrum-guide.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "scrum.eventos",
          title: "Eventos e artefatos",
          description:
            "As reuniões que dão ritmo ao Scrum e os itens que organizam o trabalho.",
          content:
            "O Scrum organiza o trabalho em torno de alguns **eventos** (cerimônias) que dão ritmo ao time, e de **artefatos** que organizam o que precisa ser feito.\n\nOs eventos acontecem dentro de cada sprint. O **planejamento** abre o ciclo, definindo o que o time vai entregar naquele sprint. A **daily** é uma reunião curta diária (cerca de quinze minutos) pra o time se alinhar: o que avançou, o que vem agora, o que está travando. A **review** acontece no fim do sprint, pra mostrar o que foi entregue e colher feedback. E a **retrospectiva** fecha o ciclo discutindo como o time pode trabalhar melhor da próxima vez.\n\nUma palavra sobre a retrospectiva, porque é a mais subestimada e, para quem facilita, a mais importante. É nela que o time melhora de verdade, olhando o próprio processo com honestidade. Conduzir boas retrospectivas, em que as pessoas falam abertamente e saem com ações concretas, é uma das habilidades mais valiosas de um Scrum Master.\n\nOs artefatos principais são dois. O **product backlog** é a lista priorizada de tudo que pode ser feito no produto, mantida pelo Product Owner. O **sprint backlog** é o recorte que o time puxou pra trabalhar no sprint atual. Eles tornam o trabalho visível e organizado.\n\nQuem coordena não apenas marca essas reuniões; faz com que elas tenham propósito. Cerimônia no automático, sem objetivo claro, vira perda de tempo que o time passa a odiar. Bem facilitadas, elas são o que mantém o Scrum vivo.",
          resources: [
            {
              label: "Atlassian: sprints",
              url: "https://www.atlassian.com/agile/scrum/sprints",
              kind: "doc",
            },
          ],
        },
        {
          id: "scrum.facilitacao",
          title: "O Scrum Master como facilitador",
          description:
            "A essência do papel: servir o time, não comandá-lo.",
          content:
            "Vale aprofundar o papel central pra quem entra na área pelo Scrum, porque ele é o mais mal compreendido. O **Scrum Master** é um facilitador e um **líder servidor**: sua função é criar as condições pra o time render bem, não controlar o que cada pessoa faz.\n\nNa prática, isso se traduz em algumas frentes. **Remover impedimentos**: quando algo trava o time (uma dependência de outra área, uma ferramenta que falta, uma decisão pendente), o Scrum Master corre atrás de destravar, pra o time não perder tempo. **Facilitar os eventos**: conduzir as cerimônias de forma que sejam úteis e respeitem o tempo de todos. **Proteger o time**: blindar a equipe de interrupções e pedidos de última hora que atrapalham o foco do sprint. E **ajudar o time a melhorar**: apoiar a evolução contínua, sem impor.\n\nO ponto mais difícil de internalizar é a ausência de autoridade hierárquica. O Scrum Master não dá ordens nem avalia desempenho; sua influência vem de confiança, clareza e do serviço que presta. Isso exige habilidades humanas fortes: escuta, mediação de conflitos, comunicação, paciência. É um trabalho mais de pessoas do que de processos.\n\nUm sinal de Scrum Master imaturo é tratar o papel como o de um chefe disfarçado, cobrando tarefas e microgerenciando. Um sinal de maturidade é o time funcionar tão bem que quase não se nota a presença dele. A meta, paradoxal, é tornar-se cada vez menos necessário, deixando o time mais autônomo a cada sprint.",
          resources: [
            {
              label: "Scrum Guide (guia oficial)",
              url: "https://scrumguides.org/scrum-guide.html",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "kanban",
      title: "Kanban e fluxo",
      description:
        "Uma abordagem complementar ao Scrum, focada em visualizar e otimizar o fluxo de trabalho.",
      level: "intermediario",
      children: [
        {
          id: "kanban.fluxo",
          title: "Kanban e fluxo contínuo",
          description:
            "Visualizar o trabalho e limitar o que se faz ao mesmo tempo.",
          content:
            "O **Kanban** é outra abordagem ágil muito usada, com uma lógica diferente do Scrum. Em vez de ciclos fechados de tempo, ele foca em **fluxo contínuo**: o trabalho entra e sai conforme o time tem capacidade, sem a estrutura de sprints.\n\nA ferramenta central é o **quadro Kanban**, dividido em colunas que representam as etapas do trabalho, classicamente \"a fazer\", \"em andamento\" e \"concluído\". Cada tarefa é um cartão que se move da esquerda pra direita conforme avança. A grande virtude é tornar o trabalho **visível**: olhando o quadro, qualquer um vê o que está em andamento, o que está parado e onde as coisas se acumulam. Quem gerencia ganha um raio-x do fluxo num relance.\n\nO princípio mais valioso e menos óbvio do Kanban é o **limite de trabalho em andamento** (WIP): definir um número máximo de tarefas que podem estar \"em andamento\" ao mesmo tempo. Isso combate a ilusão de produtividade de começar muitas coisas e terminar poucas. Menos tarefas simultâneas significa mais coisas de fato concluídas, e gargalos que ficam óbvios no quadro, pedindo atenção.\n\nKanban e Scrum não são rivais; muitos times misturam os dois. Uma regra prática comum: Scrum encaixa bem quando o trabalho dá pra planejar em ciclos (construir novas funcionalidades), e Kanban brilha em trabalho de fluxo imprevisível e contínuo (suporte, correções, demandas que chegam a qualquer hora). Conhecer os dois te deixa escolher a ferramenta certa pra cada contexto.",
          resources: [
            {
              label: "Atlassian: Kanban",
              url: "https://www.atlassian.com/agile/kanban",
              kind: "doc",
            },
          ],
        },
        {
          id: "kanban.metricas",
          title: "Métricas de fluxo",
          description:
            "Como medir a saúde do trabalho de um time, com honestidade.",
          content:
            "Gerenciar bem exige enxergar como o trabalho realmente flui, e algumas métricas simples ajudam, especialmente em Kanban. Elas respondem perguntas práticas: estamos entregando num ritmo saudável? Onde o trabalho empaca?\n\nUm conceito útil é o **lead time**: quanto tempo uma tarefa leva desde que entra na fila até ser concluída. Acompanhar isso mostra se as entregas estão demorando mais que o aceitável e ajuda a dar previsões mais realistas. Relacionado, o **throughput** mede quantas tarefas o time conclui num período, dando uma noção de capacidade real, baseada em fatos, não em otimismo.\n\nEm Scrum, fala-se também em **velocidade**: quanto trabalho um time costuma concluir por sprint, usado pra planejar os próximos. Aqui mora uma armadilha séria que todo gestor precisa conhecer: velocidade é uma ferramenta de **planejamento do time**, não de comparação ou cobrança. Comparar a velocidade de times diferentes, ou pressionar por números cada vez maiores, corrompe a métrica, porque o time aprende a inflar estimativas. Métrica usada como chicote sempre vira teatro.\n\nA mentalidade certa é usar métricas pra **entender e melhorar o fluxo**, junto com o time, não pra vigiar pessoas. Os melhores indicadores apontam onde o processo trava (uma etapa onde tarefas se acumulam, por exemplo) pra que vocês resolvam juntos. Ferramentas de gestão calculam isso automaticamente, mas o valor está em interpretar com honestidade e agir sobre o gargalo, não em ostentar um número bonito.",
          resources: [
            {
              label: "Atlassian: métricas ágeis",
              url: "https://www.atlassian.com/agile/project-management/metrics",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "planejamento",
      title: "Planejamento e riscos",
      description:
        "Organizar o que será feito, estimar com realismo, antecipar riscos e registrar o essencial.",
      level: "intermediario",
      children: [
        {
          id: "planejamento.backlog",
          title: "Backlog e priorização",
          description:
            "Organizar o trabalho e decidir o que fazer primeiro.",
          content:
            "O **backlog** é a lista de tudo que pode ser feito num projeto ou produto: funcionalidades, melhorias, correções, ideias. Mantê-lo organizado e priorizado é uma das atividades mais constantes de quem coordena, em parceria com o Product Owner.\n\nUm item de backlog costuma ser escrito como **história de usuário**, uma descrição curta da necessidade do ponto de vista de quem usa: \"como [usuário], quero [algo] para [objetivo]\". O \"para\" é a parte mais importante, porque captura o valor real por trás do pedido. Histórias têm também **critérios de aceitação**, as condições objetivas pra considerar o item pronto, que evitam o mal-entendido clássico de o time achar que terminou e o cliente achar que não.\n\nMas o backlog sempre cresce mais rápido do que o time entrega, e aí vem o trabalho mais difícil: **priorizar**. Priorizar é, na essência, dizer \"agora não\" pra quase tudo, porque escolher uma coisa é adiar outras. Técnicas simples ajudam a decidir por critérios em vez de por quem fala mais alto, como comparar o **valor** que cada item entrega contra o **esforço** que custa, fazendo primeiro o que dá muito retorno com pouco trabalho.\n\nUm conceito que diferencia o profissional maduro: a tensão entre **urgente** e **importante**. O barulho do dia a dia empurra o urgente, mas o trabalho que mais cria valor costuma ser o importante e não urgente. Proteger espaço pra ele, em meio à pressão, é uma marca de boa gestão. Backlog bem cuidado é o que mantém o time trabalhando no que realmente importa.",
          resources: [
            {
              label: "Atlassian: backlog do produto",
              url: "https://www.atlassian.com/agile/scrum/backlogs",
              kind: "doc",
            },
            {
              label: "Atlassian: histórias de usuário",
              url: "https://www.atlassian.com/agile/project-management/user-stories",
              kind: "doc",
            },
          ],
        },
        {
          id: "planejamento.estimativas",
          title: "Estimativas e cronograma",
          description:
            "Prever prazos com humildade, sabendo que estimativa não é promessa.",
          content:
            "Toda gestão precisa, em algum momento, responder \"quando fica pronto?\". Estimar é difícil e cercado de armadilhas, e fazer isso com honestidade é uma habilidade que separa quem gera confiança de quem queima a própria credibilidade.\n\nA primeira verdade a aceitar: **estimativa não é promessa**. É um palpite informado, com incerteza embutida, não uma data garantida. Tratar uma estimativa como compromisso de sangue é a origem de muito sofrimento em projetos. O bom gestor comunica estimativas com a incerteza junto, em vez de cravar uma data e depois sofrer pra cumpri-la.\n\nNo mundo ágil, é comum estimar por **tamanho relativo** em vez de horas exatas: o time compara itens entre si (este é maior ou menor que aquele?), o que costuma ser mais confiável do que tentar prever horas precisas. Uma técnica conhecida é o planning poker, em que o time estima em conjunto, expondo diferenças de entendimento que, sozinhas, já valem a conversa.\n\nDois erros aparecem sempre. O **otimismo**: a tendência natural de subestimar, esquecendo imprevistos, testes, revisões e o inesperado que sempre aparece. E ignorar que **quem faz deve estimar**: estimativa imposta de cima, sem o time, costuma ser fantasia. Envolver quem vai executar torna a previsão mais realista e o compromisso mais genuíno.\n\nA postura madura é planejar com humildade: dar a melhor estimativa possível, comunicar a incerteza, e atualizar conforme aprende. Replanejar diante de fatos novos não é falha de gestão; é exatamente o trabalho.",
        },
        {
          id: "planejamento.riscos",
          title: "Gestão de riscos",
          description:
            "Antecipar o que pode dar errado, antes que dê.",
          content:
            "Uma das contribuições mais valiosas de quem gerencia é pensar no que pode dar errado **antes** que dê, em vez de só apagar incêndios depois. Isso é **gestão de riscos**, e é o que diferencia o gestor que dorme tranquilo do que vive correndo atrás do prejuízo.\n\nUm **risco** é algo incerto que, se acontecer, afeta o projeto, em geral pra pior: uma pessoa-chave que pode sair, uma dependência de outra área que pode atrasar, uma tecnologia nova que o time ainda não domina, um fornecedor que pode falhar. O trabalho começa por **identificar** esses riscos, conversando com o time e olhando o projeto com olhar cético: o que pode atrapalhar?\n\nDepois, avalia-se cada risco por dois fatores: a **probabilidade** de acontecer e o **impacto** se acontecer. Isso ajuda a priorizar, porque você não tem tempo de tratar tudo. Risco provável e de alto impacto merece atenção imediata; risco improvável e de baixo impacto pode só ser monitorado.\n\nPara os riscos que importam, define-se uma **resposta**. Pode ser evitar (mudar o plano pra que o risco não exista), reduzir (agir pra diminuir a chance ou o impacto), ter um plano B pronto, ou conscientemente aceitar quando o custo de tratar não compensa. O importante é a decisão ser consciente, não omissão.\n\nA mentalidade central: gestão de riscos não é pessimismo, é realismo preparado. Falar abertamente do que pode dar errado, sem medo de parecer negativo, é sinal de profissionalismo. Surpresa desagradável que poderia ter sido prevista é uma falha de gestão, não azar.",
        },
        {
          id: "planejamento.documento",
          title: "Documentar o projeto",
          description:
            "Registrar o essencial pra alinhar o time sem virar burocracia.",
          content:
            "Projetos precisam de algum registro escrito pra alinhar todo mundo, mas há um equilíbrio delicado: documentar o suficiente pra criar clareza, sem afogar o time em papelada que ninguém lê. O Manifesto Ágil valoriza software funcionando acima de documentação extensa, mas isso não significa documentação nenhuma; significa documentar com propósito.\n\nUm documento de projeto útil costuma cobrir alguns pontos. O **objetivo e o contexto**: o que se quer alcançar e por quê. O **escopo**: o que entra e, igualmente importante, o que **não** entra (a fronteira que evita o projeto inchar sem controle). Os principais **envolvidos** e suas responsabilidades. Os **riscos** conhecidos e como serão tratados. E uma noção de **prazos e entregas**, com a incerteza comunicada honestamente.\n\nA seção do que fica **de fora** é a mais subestimada e uma das mais poderosas. Deixar explícito o que não será feito agora evita expectativas erradas e protege o foco da equipe.\n\nO princípio que guia tudo: o documento serve pra **criar entendimento compartilhado**, não pra cumprir ritual. Se ninguém lê ou se ele não tira dúvidas reais, falhou, por mais completo que seja. Adapte o tamanho ao projeto: algo pequeno pede poucas linhas; uma iniciativa grande pede mais. E lembre que o documento não substitui a conversa; ele registra e alinha, mas as melhores decisões nascem do diálogo.\n\nO projeto abaixo te guia na criação de um documento de projeto, exatamente o exercício que consolida esta seção. Use-o pra praticar com um caso fictício.",
          project: "documento-requisitos",
          resources: [
            {
              label: "Atlassian: roadmaps de projeto",
              url: "https://www.atlassian.com/agile/product-management/roadmaps",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "pessoas",
      title: "Pessoas e comunicação",
      description:
        "A parte mais humana e decisiva do trabalho: comunicar bem, liderar sem mandar e destravar o time.",
      level: "avancado",
      children: [
        {
          id: "pessoas.comunicacao",
          title: "Comunicação e stakeholders",
          description:
            "A habilidade número um de quem gerencia, adaptada a cada público.",
          content:
            "Se há uma habilidade que define o sucesso em gestão de projetos, é a **comunicação**. A maior parte dos problemas de projeto não é técnica; é de comunicação: expectativas desalinhadas, informação que não circulou, mal-entendidos que cresceram. Quem comunica bem previne metade dos incêndios.\n\nUm conceito-chave são os **stakeholders**: todas as pessoas com interesse no projeto, como a liderança, o cliente, outras áreas, e o próprio time. Cada uma quer informação diferente, e a arte está em **adaptar a mensagem ao público**. A liderança quer saber de prazos, riscos e resultados, não de detalhes técnicos. O time quer clareza sobre prioridades e contexto. O cliente quer entender o que vai receber e quando. A mesma situação precisa ser contada de formas diferentes pra fazer sentido pra cada um.\n\nAlguns princípios práticos ajudam. **Transparência**, principalmente com más notícias: um atraso comunicado cedo é um problema gerenciável; escondido até estourar, é uma crise e uma quebra de confiança. **Clareza**: dizer o que precisa ser feito, por quem e até quando, sem ambiguidade. E **escuta**, porque comunicar não é só falar; é entender o que o time e os stakeholders realmente precisam, inclusive o que não foi dito.\n\nUm cuidado especial vale pra stakeholders que chegam com soluções prontas (\"precisamos disso até sexta\"). O bom gestor investiga o problema por trás (\"o que te leva a precisar disso? que situação você quer resolver?\"), porque muitas vezes há um caminho melhor que o pedido original. Comunicação boa transforma exigências em conversas, e conversas em boas decisões.",
        },
        {
          id: "pessoas.status",
          title: "Status e relatórios",
          description:
            "Manter todos informados do andamento, de forma clara e honesta.",
          content:
            "Parte recorrente do trabalho é responder \"como está o projeto?\" pra quem está de fora. Fazer isso bem, de forma clara e honesta, constrói confiança; fazer mal gera ansiedade, microgerenciamento e perda de credibilidade.\n\nUm bom relatório de status costuma responder a poucas perguntas essenciais. O que **avançou** desde a última atualização. O que está **planejado** pra frente. O que está **travando** ou em risco, e o que está sendo feito a respeito. E, quando relevante, se o projeto segue dentro do esperado de prazo e escopo. Curto e direto vence longo e enrolado: quem recebe quer entender a situação rápido, não ler um romance.\n\nO erro mais perigoso é o **status maquiado**, aquele que pinta tudo de verde pra evitar conversa difícil. Esconder problemas não os resolve; só adia a explosão e a torna maior, além de destruir a confiança quando a verdade aparece. A regra de ouro é não ter surpresas: quem acompanha seus relatórios não deveria ser pego de surpresa por um problema que você já conhecia. Comunicar um risco cedo, mesmo que desconfortável, é sinal de profissionalismo.\n\nFerramentas de gestão ajudam a gerar parte dessa visão automaticamente (quadros, gráficos de andamento), mas o relatório não é só números; é a **narrativa honesta** do que está acontecendo e do que você está fazendo a respeito. Um bom gestor usa o status pra alinhar e pedir ajuda quando precisa, não só pra prestar contas.",
        },
        {
          id: "pessoas.lideranca",
          title: "Liderança e impedimentos",
          description:
            "Liderar sem autoridade formal e destravar o caminho do time.",
          content:
            "A liderança em gestão de projetos tech é peculiar: na maioria dos contextos ágeis, você lidera **sem autoridade hierárquica**. Não é o chefe, não manda, não avalia salário. E ainda assim precisa fazer um time caminhar junto. Como?\n\nA resposta é a **liderança servidora**: em vez de comandar de cima, você serve o time, criando as condições pra que ele renda bem. Sua influência vem de confiança, competência, clareza e do exemplo, não de cargo. Isso exige humildade e força de caráter: liderar pela autoridade é fácil; liderar pelo respeito conquistado é o trabalho de verdade.\n\nA atividade mais concreta dessa liderança é **remover impedimentos**. Impedimento é tudo que trava o time e que ele não consegue resolver sozinho: uma decisão pendente com outra área, um acesso que falta, uma dependência externa atrasada, uma dúvida que ninguém responde. O gestor corre atrás de destravar essas coisas, pra o time manter o foco em entregar. Em boa parte, o seu trabalho é tirar pedras do caminho dos outros.\n\nIsso se conecta a um princípio ágil importante: **confiar no time e dar autonomia**. Microgerenciar (controlar cada passo, exigir relatórios constantes, decidir por todos) sufoca times de tecnologia e afasta gente boa. Profissionais técnicos rendem mais com clareza de objetivo e liberdade de método. O papel de quem coordena não é controlar a execução, é alinhar a direção, remover obstáculos e proteger o foco.\n\nDuas qualidades sustentam tudo: empatia, pra entender as pessoas, e firmeza, pra defender o time e tomar decisões difíceis. O equilíbrio entre as duas é a marca de um bom líder.",
          resources: [
            {
              label: "Scrum Guide (guia oficial)",
              url: "https://scrumguides.org/scrum-guide.html",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "carreira",
      title: "Ferramentas e carreira",
      description:
        "As ferramentas do dia a dia, as certificações que abrem portas e os primeiros passos na área.",
      level: "avancado",
      children: [
        {
          id: "carreira.ferramentas",
          title: "Ferramentas de gestão",
          description:
            "O software onde o trabalho de coordenação acontece na prática.",
          content:
            "Boa parte do trabalho de gestão acontece em **ferramentas** que organizam tarefas, quadros e acompanhamento. Conhecê-las é prático e esperado em qualquer vaga, mas vale entender desde já que a ferramenta é meio, não fim: ela apoia um bom processo, não o substitui.\n\nA mais presente no mercado de tecnologia é o **Jira**, usado por muitos times pra gerenciar backlogs, sprints e fluxos de trabalho, com recursos voltados a Scrum e Kanban. É robusto e cheio de configurações, então aparece bastante em vagas. O **Trello**, mais simples e visual, baseado em quadros de cartões, é ótimo pra começar a entender o conceito de quadro Kanban e pra projetos menores. Há ainda outras opções populares com propostas parecidas.\n\nUma armadilha comum merece atenção: encantar-se com a ferramenta e esquecer o processo. Configurar um Jira complexo não torna um time ágil; quadros lindos não substituem comunicação real e prioridades claras. A ferramenta deve servir ao jeito do time trabalhar, não o contrário. Time que molda o próprio processo pra agradar a ferramenta inverteu a lógica.\n\nO conselho prático: aprenda o suficiente da ferramenta pra ser produtivo, de preferência a que o mercado que você mira usa, mas invista a maior parte da energia em entender os **conceitos** (backlog, fluxo, priorização, métricas). Conceitos se transferem entre ferramentas; quem entende o processo aprende qualquer software rápido. O contrário não vale: dominar cliques sem entender o porquê não forma um bom gestor.",
          resources: [
            {
              label: "Jira (Atlassian, página oficial)",
              url: "https://www.atlassian.com/software/jira",
              kind: "doc",
            },
            {
              label: "Trello: guia oficial",
              url: "https://trello.com/guide",
              kind: "doc",
            },
          ],
        },
        {
          id: "carreira.certificacoes",
          title: "Certificações",
          description:
            "O caminho mais reconhecido pra validar conhecimento em métodos ágeis.",
          content:
            "Gestão de projetos tech é uma área onde **certificações** pesam bastante, porque ajudam a comprovar conhecimento de método pra quem está começando e ainda não tem histórico. Elas também organizam o estudo, dando uma lista clara de tópicos a dominar.\n\nNo mundo ágil, as certificações mais citadas pra iniciantes giram em torno do Scrum. A **PSM I** (Professional Scrum Master I), oferecida pela Scrum.org, valida o domínio do Scrum e do papel de Scrum Master, e é muito reconhecida no mercado. Existe também a equivalente voltada ao Product Owner, a PSPO I. Um ponto que atrai quem começa: o material de estudo principal é justamente o Scrum Guide, que é gratuito, então dá pra se preparar sem custo de curso, pagando só a prova.\n\nFora do universo Scrum, há certificações de gestão de projetos mais tradicionais e abrangentes, oferecidas por instituições como o PMI, mais voltadas a profissionais com alguma experiência e a contextos além do ágil. Valem o radar conforme a carreira avança.\n\nUm conselho de equilíbrio: certificação ajuda a passar por filtros de recrutamento e a estruturar o aprendizado, mas não substitui prática nem entendimento real. O ideal é estudar pra ela com a intenção de **compreender**, não de decorar respostas, e combiná-la com experiência concreta, mesmo que em projetos pessoais, voluntariado ou simulações. Uma certificação acompanhada da capacidade de facilitar de verdade e de explicar suas decisões vale muito mais que o certificado sozinho.",
          resources: [
            {
              label: "Scrum Guide (base oficial das certificações Scrum)",
              url: "https://scrumguides.org/scrum-guide.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "carreira.entrar",
          title: "Entrar na carreira",
          description:
            "Como construir experiência e se posicionar pra primeira vaga.",
          optional: true,
          content:
            "Gestão de projetos tech é uma das áreas mais acessíveis pra quem vem de **transição de carreira**, porque valoriza habilidades que muita gente já desenvolveu em outras funções: organização, comunicação, liderança, coordenação de pessoas. Quem já organizou eventos, liderou equipes ou geriu processos em qualquer setor traz uma base real, que só precisa ser traduzida pra linguagem da área.\n\nAlguns caminhos de entrada são comuns. As posições de **Scrum Master júnior** e **analista de PMO** estão entre as portas mais frequentes. Também é comum migrar de dentro da própria empresa: quem trabalha num time de tecnologia em outra função e demonstra perfil de organização e facilitação às vezes assume aos poucos responsabilidades de coordenação.\n\nPara se posicionar sem experiência formal na área, combine três coisas. Uma **certificação** de base, como a PSM I, que passa por filtros e organiza o estudo. **Conhecimento sólido** dos fundamentos desta trilha, que você consegue explicar com clareza numa entrevista. E **prática demonstrável**, mesmo que fora de um emprego formal: facilitar a organização de um projeto voluntário, coordenar um grupo de estudos, aplicar Scrum num projeto pessoal com colegas. Qualquer experiência real de coordenação conta como história pra contar.\n\nDuas qualidades pesam tanto quanto o método. A **comunicação**, que é a ferramenta número um do papel, e que você pode treinar escrevendo e apresentando com clareza. E a capacidade de **enquadrar sua experiência passada** em termos de gestão: os problemas que você resolveu, as pessoas que coordenou, os resultados que ajudou a entregar. Saber contar essa história, com a mentalidade de servir o time e entregar valor, abre mais portas que qualquer certificado isolado.",
        },
      ],
    },
  ],
};
