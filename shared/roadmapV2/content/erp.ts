// TODO(Ana): revisao editorial completa desta trilha (titulos, descricoes e
// todo o conteudo em markdown sao novos e precisam de revisao de copy).
import type { RoadmapV2 } from "../types";

export const erp: RoadmapV2 = {
  slug: "erp",
  area: "carreira",
  kind: "carreira",
  title: "Sistemas Corporativos e ERP do Zero",
  level: "Iniciante",
  description:
    "Um mercado enorme e pouco falado: os sistemas que rodam por dentro das grandes empresas (SAP, Totvs, Oracle). Um caminho que valoriza entender de negócio tanto quanto de tecnologia.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que são sistemas corporativos e ERP, por que quase toda empresa grande depende deles e por que esse mercado é tão grande.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.o-que-e",
          title: "O que é um ERP",
          description:
            "Um sistema único que integra os principais processos de uma empresa num só lugar.",
          content:
            "ERP significa Enterprise Resource Planning, ou planejamento dos recursos da empresa. Na prática, é um sistema que integra os principais processos de um negócio (finanças, estoque, compras, vendas, fiscal, recursos humanos) numa base de dados única, para que a informação circule de forma consistente entre as áreas.\n\nO problema que o ERP resolve é a fragmentação. Sem ele, cada área usa sua própria planilha ou seu próprio sistema, e os dados não conversam: o financeiro não sabe o que o estoque tem, as vendas não veem o que a produção consegue entregar. Com um ERP, uma venda registrada atualiza automaticamente o estoque, gera a nota fiscal e reflete no financeiro, tudo ligado.\n\nQuase toda empresa de médio e grande porte roda algum ERP, porque em certa escala é impossível operar sem essa integração. Isso faz do mundo de ERP um mercado gigantesco e constante, que emprega muita gente e é bem menos falado do que áreas mais badaladas da tecnologia.",
        },
        {
          id: "fundamentos.mercado",
          title: "Um mercado grande e discreto",
          description:
            "Por que o mundo de ERP emprega tanto e por que quase ninguém comenta sobre ele.",
          content:
            "O mercado de sistemas corporativos é um dos maiores da tecnologia, e ao mesmo tempo um dos menos comentados entre quem está começando. Enquanto muita gente sonha com startups e desenvolvimento web, as grandes empresas de todos os setores (indústria, varejo, agro, serviços) rodam sobre ERPs e precisam de gente para implantar, configurar, manter e evoluir esses sistemas.\n\nEssa discrição tem um lado bom: menos gente disputando, demanda alta e salários competitivos, especialmente para quem se especializa. Consultores e analistas de ERP experientes são bastante procurados, e a estabilidade tende a ser maior, porque empresas não trocam de ERP com facilidade, o que gera trabalho de longo prazo.\n\nOutro traço marcante é que o mundo de ERP mistura tecnologia com negócio. Boa parte do trabalho é entender como uma empresa funciona (seus processos financeiros, fiscais, de estoque) e traduzir isso para o sistema. Por isso a área valoriza quem tem visão de negócio, e não só quem programa, abrindo espaço para perfis variados.",
        },
      ],
    },
    {
      id: "processos",
      title: "Processos de negócio",
      description:
        "O coração do ERP é a empresa: entender os processos que o sistema informatiza.",
      level: "iniciante",
      children: [
        {
          id: "processos.financeiro-fiscal",
          title: "Financeiro, contábil e fiscal",
          description:
            "As áreas que lidam com dinheiro, impostos e registros legais, centrais em qualquer ERP.",
          content:
            "O núcleo financeiro é um dos pilares de qualquer ERP. Ele cuida das contas a pagar e a receber, do fluxo de caixa, dos registros contábeis e das obrigações fiscais. Como toda operação da empresa acaba virando dinheiro que entra ou sai, esse módulo se conecta com quase todos os outros.\n\nNo Brasil, a parte fiscal tem peso especial por causa da complexidade tributária: notas fiscais eletrônicas, diferentes impostos, obrigações que precisam ser entregues ao governo em formatos específicos. Um ERP usado no país precisa dar conta dessas regras, e boa parte do trabalho de quem atua com ERP aqui envolve exatamente configurar e manter essa conformidade.\n\nPara começar na área, você não precisa ser contador, mas ganha muito entendendo os conceitos básicos: o que é uma nota fiscal, como funciona o contas a pagar e a receber, o que significa apurar um imposto. Esse vocabulário de negócio é a ponte entre o que a empresa faz e o que o sistema precisa registrar.",
        },
        {
          id: "processos.estoque-logistica",
          title: "Estoque, compras e vendas",
          description:
            "O fluxo de produtos entrando e saindo, e como o ERP o mantém sob controle.",
          content:
            "Outro grande conjunto de processos é o que movimenta produtos e mercadorias. Compras cuida de adquirir o que a empresa precisa; o estoque controla o que ela tem, onde está e quanto; vendas registra o que sai para os clientes. Num ERP integrado, esses três se conversam em tempo real.\n\nO valor da integração fica claro num exemplo: quando uma venda é registrada, o sistema baixa o item do estoque, sinaliza se o nível ficou baixo (o que pode disparar uma compra), gera a nota fiscal e reflete o valor no financeiro. Sem ERP, cada um desses passos seria manual e sujeito a erro e descompasso entre as áreas.\n\nEntender esse fluxo de mercadorias e informações é essencial para quem trabalha com ERP, porque muitos projetos giram em torno de fazer o sistema espelhar corretamente como a empresa compra, guarda e vende. Cada negócio tem particularidades, e adaptar o ERP a elas é grande parte do trabalho.",
        },
      ],
    },
    {
      id: "papel",
      title: "O papel do consultor e analista de ERP",
      description:
        "Quem faz o ERP funcionar na empresa: os perfis funcional e técnico e o que cada um faz.",
      level: "iniciante",
      children: [
        {
          id: "papel.funcional-tecnico",
          title: "Funcional versus técnico",
          description:
            "Dois perfis complementares: quem entende o negócio e o sistema, e quem programa customizações.",
          content:
            "O trabalho com ERP costuma se dividir em dois grandes perfis. O consultor ou analista funcional é quem entende profundamente os processos de negócio e como configurar o ERP para atendê-los. Ele conversa com as áreas da empresa, levanta necessidades, parametriza o sistema e treina os usuários. É um perfil que mistura negócio e tecnologia, e muitas vezes não exige programar.\n\nO perfil técnico (às vezes chamado de desenvolvedor ou consultor técnico) é quem programa dentro do ERP: cria customizações, relatórios específicos, integrações e ajustes que a configuração padrão não cobre. Esse perfil trabalha com a linguagem de programação própria do ERP e é acionado quando a necessidade vai além do que dá para parametrizar.\n\nOs dois se complementam num projeto: o funcional define o que precisa ser feito segundo o negócio, o técnico constrói o que exige código. Muita gente começa por um lado e, com o tempo, aprende do outro. Saber qual perfil combina mais com você (mais negócio ou mais programação) ajuda a escolher por onde entrar.",
        },
        {
          id: "papel.requisitos",
          title: "Levantar requisitos e parametrizar",
          description:
            "Traduzir a necessidade da empresa em configurações do sistema, o dia a dia funcional.",
          content:
            "Boa parte do trabalho com ERP é levantamento de requisitos: sentar com as pessoas das áreas, entender como elas trabalham hoje, quais são as regras e as exceções, e descobrir o que o sistema precisa fazer para atender. É um trabalho de escuta, perguntas e organização, antes de qualquer configuração.\n\nCom os requisitos claros, vem a parametrização: ajustar as configurações do ERP para que ele se comporte como a empresa precisa, sem escrever código. ERPs são feitos para serem altamente configuráveis justamente porque cada empresa opera de um jeito, e a maior parte das necessidades se resolve nessas configurações, não em programação.\n\nEssa combinação de entender o negócio e traduzi-lo em configuração é a essência do trabalho funcional, e é uma habilidade muito valorizada. Quem faz isso bem se torna a ponte confiável entre as áreas da empresa e o sistema, uma posição de destaque e de crescimento na carreira de ERP.",
        },
      ],
    },
    {
      id: "modulos",
      title: "Módulos e customização",
      description:
        "Como o ERP se divide em módulos e onde entra a programação quando a configuração não basta.",
      level: "intermediario",
      children: [
        {
          id: "modulos.estrutura",
          title: "Módulos do ERP",
          description:
            "O sistema dividido por área de negócio, e por que a especialização acontece por módulo.",
          content:
            "Um ERP é organizado em módulos, cada um cobrindo uma área da empresa: módulo financeiro, de estoque, de compras, de vendas, de recursos humanos, de produção, e assim por diante. Todos compartilham a mesma base de dados, mas cada módulo tem suas telas, regras e configurações próprias.\n\nEssa divisão em módulos explica como a especialização funciona na carreira de ERP. É comum um profissional se especializar em um ou dois módulos (por exemplo, tornar-se referência no módulo financeiro ou no de estoque), porque cada um tem profundidade suficiente para ser uma especialidade. Consultor de um módulo específico é um perfil valorizado e bem remunerado.\n\nPara começar, entender que o ERP é modular ajuda a escolher um foco em vez de tentar aprender tudo de uma vez. Muita gente entra por um módulo que combina com sua formação ou interesse (quem vem de contábeis vai bem no financeiro, por exemplo) e vai ampliando a partir dali.",
        },
        {
          id: "modulos.customizacao",
          title: "Parametrização versus customização",
          description:
            "A diferença entre configurar o que já existe e programar algo novo dentro do ERP.",
          content:
            "Adaptar um ERP a uma empresa acontece em dois níveis. A parametrização usa as configurações que o próprio sistema oferece, sem código: ativar recursos, definir regras, ajustar comportamentos dentro do que o ERP já prevê. É o caminho preferencial, porque é mais rápido, mais seguro e mais fácil de manter nas atualizações.\n\nA customização é quando a necessidade vai além do que a configuração alcança, e é preciso programar algo novo dentro do ERP. Cada grande ERP tem sua própria linguagem para isso: o mundo SAP usa a linguagem ABAP, o universo Totvs Protheus usa o ADVPL (e sua evolução), e assim por diante. É aí que entra o perfil técnico.\n\nUma boa prática do mercado é preferir parametrizar e customizar só quando necessário, porque customização em excesso torna o sistema difícil de atualizar e manter. Entender essa fronteira (o que dá para resolver configurando e quando realmente vale programar) é um conhecimento valioso, tanto para o perfil funcional quanto para o técnico.",
        },
      ],
    },
    {
      id: "integracoes",
      title: "Integrações",
      description:
        "O ERP raramente vive sozinho: como ele troca dados com outros sistemas da empresa.",
      level: "intermediario",
      children: [
        {
          id: "integracoes.conceito",
          title: "Integrar o ERP com outros sistemas",
          description:
            "Por que empresas conectam o ERP a lojas, bancos e outros sistemas, e como isso funciona.",
          content:
            "Na prática, o ERP quase nunca é o único sistema de uma empresa. Ele precisa conversar com a loja virtual (para receber pedidos), com os bancos (para pagamentos e conciliação), com sistemas do governo (para obrigações fiscais), com ferramentas de relacionamento com clientes, e por aí vai. Fazer esses sistemas trocarem dados de forma automática é o trabalho de integração.\n\nAs integrações modernas costumam usar APIs: interfaces pelas quais um sistema oferece seus dados e funções para outro consumir de forma padronizada. Quando o ERP e a loja virtual se integram bem, um pedido feito no site aparece automaticamente no ERP, sem ninguém redigitar nada, evitando erro e retrabalho.\n\nUm conceito importante ligado a integrações é o de dados mestres: as informações-base compartilhadas entre sistemas, como o cadastro de clientes, de produtos e de fornecedores. Manter esses dados consistentes entre os sistemas integrados é um desafio recorrente, e cuidar disso é parte relevante do trabalho de quem atua com ERP.",
        },
      ],
    },
    {
      id: "ecossistema",
      title: "Ecossistema SAP e Totvs no Brasil",
      description:
        "Os principais players do mercado brasileiro de ERP e o que caracteriza cada um.",
      level: "intermediario",
      children: [
        {
          id: "ecossistema.players",
          title: "SAP, Totvs, Oracle e o mercado nacional",
          description:
            "Quem domina o mercado de ERP no Brasil e por que vale conhecer esse cenário.",
          content:
            "No Brasil, alguns nomes dominam o mercado de ERP. A SAP é uma gigante global, forte especialmente em grandes empresas e multinacionais, com um ecossistema enorme de consultores ao redor. A Totvs é a principal empresa brasileira do setor, muito presente em empresas de médio porte no país, com o Protheus entre seus produtos mais conhecidos. A Oracle também tem presença relevante com suas soluções corporativas.\n\nConhecer esse cenário ajuda a orientar a carreira, porque a demanda por profissionais costuma seguir os sistemas mais usados. Especializar-se em um ERP com forte presença no mercado que você quer atuar aumenta as oportunidades, e cada plataforma tem sua comunidade, seus materiais de estudo e suas certificações.\n\nA escolha entre focar em SAP, Totvs ou outro depende de fatores como a região, o setor e o porte das empresas que você quer atender. Não existe escolha universalmente melhor: existe a que combina com o mercado que você mira. Vale pesquisar quais sistemas as empresas da sua área e região mais usam antes de decidir onde investir seu tempo.",
        },
      ],
    },
    {
      id: "certificacoes",
      title: "Certificações",
      description:
        "Como as credenciais funcionam no mundo de ERP e por que elas pesam bastante nessa área.",
      level: "intermediario",
      children: [
        {
          id: "certificacoes.como",
          title: "Certificações no mundo de ERP",
          description:
            "O papel das certificações oficiais e como se preparar para elas.",
          content:
            "No mundo de ERP, as certificações têm peso maior do que em muitas outras áreas de tecnologia. Os fabricantes (como SAP e Totvs) oferecem certificações oficiais em seus sistemas e módulos, e essas credenciais são bastante valorizadas por empresas e consultorias na hora de contratar, especialmente para quem ainda está construindo experiência.\n\nAs certificações são organizadas por produto e por módulo, acompanhando a especialização da área: existem trilhas de certificação para diferentes sistemas e diferentes áreas de negócio dentro deles. Preparar-se envolve estudar os materiais oficiais do fabricante, praticar no sistema quando possível, e conhecer a fundo o módulo escolhido.\n\nVale checar diretamente com os fabricantes quais certificações existem, seus pré-requisitos e formatos atuais, porque esses detalhes mudam com o tempo e variam por produto. O princípio geral é claro: no ERP, uma certificação reconhecida somada a experiência prática é uma combinação forte para conseguir vagas e negociar melhores condições.",
        },
      ],
    },
    {
      id: "carreira",
      title: "Carreira",
      description:
        "Como entrar no mundo de ERP, quais perfis existem e como crescer nessa área estável e bem paga.",
      level: "intermediario",
      children: [
        {
          id: "carreira.entrar",
          title: "Como entrar na área",
          description:
            "Os caminhos de entrada para quem vem de negócio e para quem vem de tecnologia.",
          content:
            "Há mais de uma porta de entrada para o mundo de ERP, e isso é uma vantagem da área. Quem vem de áreas de negócio (administração, contábeis, logística) tem facilidade com o lado funcional, porque já entende os processos da empresa, e aprende a operar o sistema pelo caminho. Quem vem de programação encontra espaço no lado técnico, aprendendo a linguagem específica do ERP escolhido.\n\nOportunidades comuns de entrada incluem vagas de analista júnior, estágios em consultorias especializadas e posições de suporte a usuários de ERP dentro de empresas que usam o sistema. Muita gente começa dando suporte ou operando o ERP no dia a dia de uma empresa e, ao entender bem o sistema, migra para funções de analista ou consultor.\n\nEscolher um sistema (por exemplo, SAP ou Totvs) e um módulo para focar dá direção ao estudo e à busca por vagas. Especializar-se em algo específico, com boa demanda no seu mercado, costuma render mais do que tentar saber um pouco de tudo superficialmente.",
        },
        {
          id: "carreira.crescer",
          title: "Crescimento e especialização",
          description:
            "Por que a área recompensa a experiência e como evoluir de analista a consultor sênior.",
          content:
            "A carreira de ERP recompensa bastante a experiência e a especialização. Um consultor que domina profundamente um módulo e conhece os processos de negócio associados se torna raro e disputado, com remuneração à altura. Diferente de áreas onde a tecnologia muda muito rápido, o conhecimento de processos de negócio envelhece devagar, o que dá longevidade à carreira.\n\nOs caminhos de crescimento incluem aprofundar-se em um módulo até virar referência, ampliar para vários módulos ou para a visão geral do sistema, evoluir do funcional para papéis de liderança de projetos de implantação, ou, no lado técnico, dominar a programação e as integrações do ERP. Consultorias e grandes empresas oferecem trilhas para todos esses rumos.\n\nÉ uma área estável, bem paga e com demanda constante, mas ainda pouco divulgada para quem está começando na tecnologia. Para quem gosta de entender como as empresas funcionam por dentro e de resolver problemas de negócio com sistemas, o mundo de ERP é uma escolha de carreira sólida e cheia de oportunidades.",
        },
      ],
    },
  ],
};
