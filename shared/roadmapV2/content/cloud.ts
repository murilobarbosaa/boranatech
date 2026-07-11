import type { RoadmapV2 } from "../types";

export const cloud: RoadmapV2 = {
  slug: "cloud",
  area: "cloud",
  title: "Cloud Computing do Zero",
  level: "Iniciante",
  description:
    "Das bases de Linux e redes aos serviços de computação, identidade, containers e automação na nuvem. Escolha seu provedor e conclua uma etapa pra liberar a próxima.",
  languages: [
    { id: "aws", label: "AWS" },
    { id: "azure", label: "Azure" },
    { id: "gcp", label: "Google Cloud" },
  ],
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é a nuvem, como ela é vendida em camadas de serviço e quem são os três grandes provedores.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é cloud computing",
          description:
            "Usar servidores e serviços de TI pela internet, pagando pelo que consome.",
          content:
            "Cloud computing (computação em nuvem) é usar recursos de TI, como servidores, armazenamento e bancos de dados, pela internet, sem precisar comprar e manter máquinas físicas. Em vez de ter um servidor na sua empresa, você aluga capacidade de um provedor gigante e acessa tudo remotamente.\n\nA mudança que isso trouxe é profunda. Antes, montar a infraestrutura de um produto exigia comprar equipamento caro, instalar em uma sala e esperar semanas. Na nuvem, você sobe um servidor em minutos, com alguns cliques ou comandos, e desliga quando não precisa mais. Isso democratizou a tecnologia: uma pessoa sozinha hoje tem acesso à mesma infraestrutura de uma grande empresa.\n\nDuas características definem a nuvem. A **elasticidade**: você aumenta ou diminui os recursos conforme a demanda, sem desperdício. E o modelo de **pagamento pelo uso**: você paga pelo que consome, como uma conta de luz, em vez de um grande investimento inicial. Isso é poderoso, mas tem um lado de atenção que a trilha aborda: custo que sobe sem controle quando você esquece recursos ligados.\n\nO profissional de cloud projeta, configura e cuida dessa infraestrutura: garante que os serviços fiquem no ar, escalem quando preciso, sejam seguros e não custem mais que o necessário. É uma área de alta demanda, que combina conhecimento de sistemas, redes e dos serviços de cada provedor.",
        },
        {
          id: "fundamentos.modelos",
          title: "IaaS, PaaS e SaaS",
          description:
            "As três camadas de serviço de nuvem e quanto de controle cada uma te dá.",
          content:
            "A nuvem é vendida em camadas, e três siglas resumem o quanto você gerencia em cada uma. Entendê-las organiza todo o catálogo de serviços que parece confuso no começo.\n\nNo **IaaS** (infraestrutura como serviço), o provedor te entrega os blocos básicos: servidores virtuais, armazenamento, rede. Você gerencia o sistema operacional, o que instala e como configura. É o mais flexível e o mais trabalhoso, parecido com ter um computador remoto que você controla por inteiro.\n\nNo **PaaS** (plataforma como serviço), o provedor cuida da infraestrutura e do sistema por baixo, e você só cuida da sua aplicação. Não precisa configurar servidor; você entrega o código e a plataforma roda. Menos controle, menos trabalho.\n\nNo **SaaS** (software como serviço), você apenas usa um software pronto pela internet, sem gerenciar nada por baixo. Um email na web ou uma ferramenta online são SaaS. É o que a maioria das pessoas usa todo dia sem perceber.\n\nUma analogia comum é a da pizza: fazer tudo em casa, comprar congelada, pedir delivery ou comer no restaurante, cada opção com menos esforço seu e menos controle. Em cloud, você vai trabalhar mais com IaaS e PaaS, escolhendo o nível certo pra cada caso: mais controle quando precisa, mais conveniência quando o controle não compensa o trabalho.",
        },
        {
          id: "fundamentos.provedores",
          title: "AWS, Azure e Google Cloud",
          description:
            "Os três grandes provedores e como escolher um pra focar nesta trilha.",
          content:
            "O mercado de nuvem é dominado por três grandes provedores, e esta trilha funciona com qualquer um dos três. Você escolhe um pra seguir, no seletor acima, e a boa notícia é que os **conceitos são os mesmos** em todos: muda o nome dos serviços e a tela do painel, não a ideia por trás.\n\nUm retrato rápido de cada um. A **AWS** (Amazon) foi a pioneira e é a líder de mercado, com o catálogo mais amplo e a maior quantidade de vagas e material de estudo. O **Azure** (Microsoft) é forte no mundo corporativo, especialmente em empresas que já usam o ecossistema Microsoft, e muito presente em vagas formais. O **Google Cloud** (GCP) tem destaque em dados, inteligência artificial e em tecnologias modernas como Kubernetes, que nasceu no Google.\n\nA regra de ouro é a mesma de aprender uma linguagem: **escolha um e fique nele até o fim da trilha**. Pular entre provedores no começo só atrapalha, porque você gasta energia com diferenças de nomenclatura em vez de aprender os conceitos. Depois de dominar um, migrar pros outros é rápido, já que tudo se traduz.\n\nNa dúvida sobre qual escolher, a AWS costuma ser a aposta mais segura pra iniciantes pela quantidade de material e vagas. Mas se você já vive no ecossistema Microsoft ou Google, ou mira uma empresa específica, faz sentido seguir o provedor dela. Os três oferecem documentação oficial gratuita e excelente.",
          resources: [
            {
              label: "AWS: documentação oficial",
              url: "https://docs.aws.amazon.com/",
              kind: "doc",
            },
            {
              label: "Microsoft Learn: Azure",
              url: "https://learn.microsoft.com/en-us/azure/",
              kind: "doc",
            },
            {
              label: "Google Cloud: documentação oficial",
              url: "https://cloud.google.com/docs",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.conta",
          title: "Sua conta e o nível gratuito",
          description:
            "Criar uma conta e usar a camada gratuita pra praticar sem gastar.",
          content:
            "A melhor forma de aprender nuvem é praticando nela, e os três provedores oferecem uma **camada gratuita** pra você começar sem gastar. Criar sua conta e explorar o painel é o primeiro passo prático da trilha.\n\nUm aviso que vale pra qualquer provedor: a camada gratuita tem limites, e passar deles gera cobrança. Por isso, dois hábitos desde o dia um. Configure **alertas de custo** pra ser avisado se a conta começar a gerar despesa. E **desligue ou remova** o que você criou pra testar quando terminar, porque recurso esquecido ligado é a causa número um de sustos na fatura. Trate isso como apagar a luz ao sair do quarto.\n\nEscolha seu provedor acima pra ver como criar a conta e o que a camada gratuita oferece.",
          byLanguage: {
            aws: {
              content:
                "A AWS tem um **Free Tier** com três tipos de oferta: serviços sempre gratuitos dentro de um limite, ofertas gratuitas por 12 meses pra contas novas, e créditos de teste. Crie a conta no site (vai pedir cartão pra verificação, mas dentro do limite não cobra), acesse o **Console** (o painel web) e ative os alertas de cobrança no serviço de billing logo de início.",
              resources: [
                {
                  label: "AWS Free Tier (oficial)",
                  url: "https://aws.amazon.com/free/",
                  kind: "doc",
                },
              ],
            },
            azure: {
              content:
                "O Azure oferece uma conta gratuita com créditos pra usar nos primeiros dias, além de uma lista de serviços gratuitos por 12 meses e outros sempre gratuitos dentro de limites. Crie a conta, acesse o **Azure Portal** (o painel web) e configure um alerta de orçamento (budget) no Cost Management pra acompanhar o consumo desde o começo.",
              resources: [
                {
                  label: "Azure: conta gratuita (oficial)",
                  url: "https://azure.microsoft.com/en-us/free/",
                  kind: "doc",
                },
              ],
            },
            gcp: {
              content:
                "O Google Cloud dá créditos de teste pra contas novas, além de um conjunto de produtos com uso gratuito dentro de limites mensais. Crie a conta, acesse o **Console** do Google Cloud e configure orçamentos e alertas de faturamento (billing budgets) logo no início, pra não ser pego de surpresa quando os créditos acabarem.",
              resources: [
                {
                  label: "Google Cloud: nível gratuito (oficial)",
                  url: "https://cloud.google.com/free",
                  kind: "doc",
                },
              ],
            },
          },
        },
      ],
    },
    {
      id: "bases",
      title: "Bases técnicas",
      description:
        "As duas fundações sem as quais nada de nuvem faz sentido: Linux e redes.",
      level: "iniciante",
      children: [
        {
          id: "bases.linux",
          title: "Linux e linha de comando",
          description: "O sistema que roda na maioria dos servidores da nuvem.",
          content:
            "A grande maioria dos servidores na nuvem roda **Linux**, então dominá-lo, em especial a linha de comando, é uma habilidade diária em cloud. Não dá pra gerenciar uma infraestrutura sem se sentir em casa no terminal.\n\nDiferente de clicar em janelas, no Linux você comanda o sistema digitando no **terminal**. Isso é mais rápido e funciona em qualquer servidor, inclusive nos que não têm tela, que é o caso da maioria das máquinas na nuvem: você se conecta a elas remotamente e só tem o terminal. Os comandos básicos cabem em poucos: navegar entre pastas, listar arquivos, editar texto, ver processos, checar logs.\n\nVocê também vai usar muito o acesso remoto seguro, o **SSH**, que é como você entra numa máquina virtual na nuvem a partir do seu computador pra administrá-la. E, conforme avança, vai usar as ferramentas de linha de comando dos próprios provedores pra controlar recursos por comando, não só pelo painel.\n\nNão precisa decorar centenas de comandos. Instale o Linux numa máquina virtual no seu computador (ou pratique direto numa instância gratuita na nuvem), use o terminal pra tarefas reais e deixe a fluência crescer com o uso. É um investimento que se paga em toda etapa seguinte da trilha.",
          resources: [
            {
              label: "Ubuntu: linha de comando pra iniciantes",
              url: "https://ubuntu.com/tutorials/command-line-for-beginners",
              kind: "artigo",
            },
          ],
        },
        {
          id: "bases.redes",
          title: "Redes na nuvem",
          description:
            "Como os recursos se conectam e se isolam dentro da nuvem.",
          content:
            "Toda a nuvem é construída sobre **redes**, então entender o básico de redes é pré-requisito pra praticamente tudo. Vale ter clara a ideia de endereço **IP** (o endereço de cada máquina), de **portas** (os pontos por onde os serviços conversam) e de como os dados viajam em pacotes pela internet.\n\nNa nuvem, aparece um conceito central: a **rede virtual privada**. Em vez de uma rede física, você cria, por software, uma rede isolada onde seus servidores vivem, com controle total sobre quem pode falar com quem. Dentro dela você define **sub-redes**, decide o que fica acessível da internet e o que fica privado, e configura **firewalls** (regras que liberam ou bloqueiam tráfego por porta e origem).\n\nEsse isolamento é a base da segurança em cloud. A boa prática é deixar exposto à internet apenas o mínimo necessário (por exemplo, só a porta de um site), mantendo bancos de dados e servidores internos em sub-redes privadas, sem acesso direto de fora. Cada provedor tem seu nome pra essa rede virtual, mas a ideia é idêntica nos três.\n\nVocê não precisa virar especialista em redes agora, mas precisa entender rede virtual, sub-rede e regra de firewall, porque esses conceitos aparecem toda vez que você sobe um recurso. Escolha seu provedor pra ver a documentação da rede virtual dele.",
          byLanguage: {
            aws: {
              content:
                "Na AWS, a rede virtual se chama **VPC** (Virtual Private Cloud). Dentro dela você cria sub-redes públicas e privadas, e controla o tráfego com security groups (firewall por recurso) e network ACLs (firewall por sub-rede). Quase todo recurso que você cria vive dentro de uma VPC.",
              resources: [
                {
                  label: "AWS VPC: documentação",
                  url: "https://docs.aws.amazon.com/vpc/",
                  kind: "doc",
                },
              ],
            },
            azure: {
              content:
                "No Azure, a rede virtual se chama **VNet** (Virtual Network). Você organiza recursos em sub-redes e controla o tráfego com Network Security Groups, que definem regras de entrada e saída por porta e origem. É a fronteira onde mora boa parte da segurança dos seus recursos.",
              resources: [
                {
                  label: "Azure Virtual Network: documentação",
                  url: "https://learn.microsoft.com/en-us/azure/virtual-network/",
                  kind: "doc",
                },
              ],
            },
            gcp: {
              content:
                "No Google Cloud, a rede virtual também se chama **VPC**, com uma particularidade: ela é global por padrão, abrangendo várias regiões. Você cria sub-redes e controla o tráfego com regras de firewall aplicadas por etiquetas e contas de serviço, definindo o que pode entrar e sair.",
              resources: [
                {
                  label: "Google Cloud VPC: documentação",
                  url: "https://cloud.google.com/vpc/docs",
                  kind: "doc",
                },
              ],
            },
          },
        },
      ],
    },
    {
      id: "computacao",
      title: "Computação e armazenamento",
      description:
        "Os blocos mais básicos da nuvem: servidores que processam e lugares pra guardar dados.",
      level: "intermediario",
      children: [
        {
          id: "computacao.regioes",
          title: "Regiões e zonas",
          description: "Onde, no mundo, sua infraestrutura de fato roda.",
          content:
            "A nuvem parece etérea, mas roda em prédios cheios de servidores espalhados pelo mundo, os **data centers**. Os provedores organizam isso em **regiões** (áreas geográficas, como uma no Brasil, outra nos Estados Unidos) e, dentro de cada região, em **zonas de disponibilidade** (data centers isolados entre si, mas próximos).\n\nEssa geografia importa por três motivos práticos que você considera ao subir qualquer recurso. A **latência**: quanto mais perto seus servidores estão dos usuários, mais rápida a resposta; um site pra brasileiros roda melhor numa região no Brasil. A **conformidade**: leis de proteção de dados às vezes exigem que a informação fique em determinado país. E o **custo**: o preço dos serviços varia de uma região pra outra.\n\nAs zonas existem pra dar **resiliência**. Se você quer que sua aplicação continue no ar mesmo que um data center tenha um problema, distribui os recursos em mais de uma zona. Assim, a falha de uma não derruba tudo. Esse é um princípio central de arquitetura confiável na nuvem, que conecta com a ideia de alta disponibilidade.\n\nO conceito é idêntico nos três provedores, mudando só os nomes das regiões. A lição prática pra agora: ao criar um recurso, repare sempre em qual região você está, porque é fácil criar coisas espalhadas por engano (e até esquecer recursos rodando numa região que você nem olha, gerando custo).",
        },
        {
          id: "computacao.vm",
          title: "Servidores virtuais",
          description:
            "O recurso mais fundamental: uma máquina na nuvem que você controla.",
          content:
            "O serviço mais básico de qualquer nuvem é o **servidor virtual**: uma máquina, criada por software, que você liga em minutos e controla como se fosse um computador remoto. É o coração do modelo IaaS e onde muita gente roda aplicações, bancos e serviços.\n\nAo criar um, você escolhe alguns parâmetros: o **tamanho** (quanta CPU e memória, que define o preço), o **sistema operacional** (em geral uma distribuição Linux), a **região** onde vai rodar e as regras de rede e firewall que o protegem. Depois, você se conecta a ele por SSH e o administra pelo terminal.\n\nUm ponto de atenção que se repete: o servidor virtual cobra enquanto está **ligado**, mesmo sem uso. Esquecer uma máquina ligada é a causa clássica de fatura inesperada. Desligue ou remova o que criou pra testar.\n\nEscolha seu provedor pra ver o serviço de servidores virtuais dele.",
          byLanguage: {
            aws: {
              content:
                "Na AWS, o serviço de servidores virtuais é o **EC2** (Elastic Compute Cloud), um dos mais usados de toda a plataforma. Você escolhe um tipo de instância (que define CPU e memória), uma imagem de sistema (AMI) e a VPC onde ela roda. A camada gratuita inclui um tipo pequeno de instância por um período, ideal pra praticar.",
              resources: [
                {
                  label: "AWS EC2: documentação",
                  url: "https://docs.aws.amazon.com/ec2/",
                  kind: "doc",
                },
              ],
            },
            azure: {
              content:
                "No Azure, o serviço se chama **Virtual Machines**. Você escolhe um tamanho de VM (a combinação de CPU e memória), a imagem do sistema operacional e a rede virtual onde ela fica. A conta gratuita oferece um período de uso de certos tamanhos de VM, suficiente pra aprender criando e acessando sua primeira máquina.",
              resources: [
                {
                  label: "Azure Virtual Machines: documentação",
                  url: "https://learn.microsoft.com/en-us/azure/virtual-machines/",
                  kind: "doc",
                },
              ],
            },
            gcp: {
              content:
                "No Google Cloud, o serviço se chama **Compute Engine**. Você define o tipo de máquina (CPU e memória), a imagem do sistema e a rede. O nível gratuito do Google inclui uma instância pequena de uso contínuo dentro de certos limites, ótima pra manter um servidor de testes rodando sem custo enquanto aprende.",
              resources: [
                {
                  label: "Google Compute Engine: documentação",
                  url: "https://cloud.google.com/compute/docs",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "computacao.armazenamento",
          title: "Armazenamento de objetos",
          description:
            "O jeito mais comum de guardar arquivos na nuvem, barato e praticamente infinito.",
          content:
            "Além de servidores, você precisa guardar dados, e o tipo de armazenamento mais usado na nuvem é o **armazenamento de objetos**. Em vez de um disco preso a uma máquina, é um serviço à parte onde você joga arquivos (imagens, vídeos, backups, documentos) que ficam acessíveis por um endereço, com capacidade praticamente ilimitada e custo baixo.\n\nVocê organiza os arquivos em **buckets** (algo como pastas de nível superior), e cada arquivo (objeto) tem um endereço próprio. Um uso clássico, e ótimo primeiro projeto, é **hospedar um site estático**: você sobe os arquivos HTML, CSS e imagens pro armazenamento de objetos e o serve direto de lá, sem precisar de servidor.\n\nUm cuidado de segurança fundamental: por padrão, mantenha seus buckets **privados**. Vazamentos famosos de dados aconteceram por buckets deixados abertos pra internet sem querer. Só torne público o que realmente deve ser público, como os arquivos de um site.\n\nEscolha seu provedor pra ver o serviço de armazenamento de objetos dele.",
          byLanguage: {
            aws: {
              content:
                "Na AWS, o armazenamento de objetos é o **S3** (Simple Storage Service), um dos serviços mais icônicos da nuvem. Você cria buckets, sobe objetos e controla o acesso com cuidado (a AWS bloqueia acesso público por padrão, justamente pra evitar vazamentos). Hospedar um site estático no S3 é um projeto inicial clássico.",
              resources: [
                {
                  label: "AWS S3: documentação",
                  url: "https://docs.aws.amazon.com/s3/",
                  kind: "doc",
                },
              ],
            },
            azure: {
              content:
                "No Azure, o armazenamento de objetos é o **Blob Storage**, parte do serviço de Storage Accounts. Você organiza os dados em containers (o equivalente aos buckets) e sobe blobs (os objetos). Ele também permite hospedar sites estáticos e controla o acesso por níveis, mantendo o privado como padrão seguro.",
              resources: [
                {
                  label: "Azure Blob Storage: documentação",
                  url: "https://learn.microsoft.com/en-us/azure/storage/blobs/",
                  kind: "doc",
                },
              ],
            },
            gcp: {
              content:
                "No Google Cloud, o serviço é o **Cloud Storage**. Você cria buckets, sobe objetos e define permissões com controle fino, mantendo o privado por padrão. Assim como nos outros, dá pra hospedar sites estáticos e usá-lo pra backups, dados de aplicações e arquivos de mídia, com custo baixo e escala alta.",
              resources: [
                {
                  label: "Google Cloud Storage: documentação",
                  url: "https://cloud.google.com/storage/docs",
                  kind: "doc",
                },
              ],
            },
          },
        },
      ],
    },
    {
      id: "identidade",
      title: "Identidade e segurança",
      description:
        "Controlar quem pode fazer o quê na sua nuvem e entender de quem é cada responsabilidade.",
      level: "intermediario",
      children: [
        {
          id: "identidade.iam",
          title: "Identidade e permissões (IAM)",
          description:
            "O serviço que decide quem acessa o quê, no coração da segurança em nuvem.",
          content:
            'Um dos serviços mais importantes e mais negligenciados por iniciantes é o de **identidade e gerenciamento de acesso** (IAM). É ele que controla **quem** pode fazer **o quê** na sua nuvem, e configurar isso bem é metade da segurança.\n\nA estrutura, semelhante nos três provedores, gira em torno de poucos conceitos. **Identidades** representam pessoas ou sistemas (um usuário, uma aplicação). **Permissões** ou políticas dizem quais ações cada identidade pode realizar em quais recursos. E **papéis** (roles) agrupam permissões pra serem atribuídos com facilidade.\n\nO princípio que guia tudo é o **menor privilégio**: dê a cada identidade apenas as permissões mínimas necessárias pro seu trabalho, e nada além. Se uma credencial vazar, o estrago fica contido ao pouco que ela podia fazer. O oposto, dar acesso total "pra não ter dor de cabeça", é justamente a receita da dor de cabeça grande.\n\nDuas práticas valem desde o início. Proteja a conta principal (a de administrador) com autenticação de múltiplos fatores e use-a o mínimo possível, criando identidades específicas pro dia a dia. E prefira dar permissões a **papéis** que os serviços assumem, em vez de espalhar credenciais fixas pelo código.\n\nEscolha seu provedor pra ver o serviço de identidade dele.',
          byLanguage: {
            aws: {
              content:
                "Na AWS, o serviço é o **IAM** (Identity and Access Management). Você cria usuários, grupos e roles, e anexa políticas (em formato JSON) que definem permissões. Uma prática essencial: não use a conta-raiz no dia a dia; crie usuários IAM com permissões específicas e ative o MFA na raiz.",
              resources: [
                {
                  label: "AWS IAM: documentação",
                  url: "https://docs.aws.amazon.com/iam/",
                  kind: "doc",
                },
              ],
            },
            azure: {
              content:
                "No Azure, o controle de acesso usa o **RBAC** (Role-Based Access Control), integrado ao Microsoft Entra ID (a identidade da Microsoft). Você atribui papéis (como leitor, colaborador, proprietário) a usuários e grupos, em escopos específicos, definindo o que cada um pode fazer em cada recurso.",
              resources: [
                {
                  label: "Azure RBAC: documentação",
                  url: "https://learn.microsoft.com/en-us/azure/role-based-access-control/",
                  kind: "doc",
                },
              ],
            },
            gcp: {
              content:
                "No Google Cloud, o serviço é o **IAM**. Você concede papéis (roles) a identidades (contas de usuário e contas de serviço) em determinados recursos, seguindo o princípio do menor privilégio. As contas de serviço são especialmente importantes pra dar permissões a aplicações sem usar credenciais de pessoas.",
              resources: [
                {
                  label: "Google Cloud IAM: documentação",
                  url: "https://cloud.google.com/iam/docs",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "identidade.responsabilidade",
          title: "Responsabilidade compartilhada",
          description:
            "Quem cuida da segurança de quê quando você usa a nuvem.",
          content:
            'Uma confusão comum de quem começa é achar que, ao usar a nuvem, toda a segurança fica por conta do provedor. Não é assim. Vale entender o **modelo de responsabilidade compartilhada**, que os três grandes provedores adotam com a mesma lógica.\n\nA divisão é mais ou menos esta: o provedor é responsável pela segurança **da** nuvem (os data centers físicos, o hardware, a infraestrutura que sustenta os serviços), e você é responsável pela segurança **na** nuvem (como você configura seus recursos, quem tem acesso, se seus dados estão protegidos, se as portas certas estão fechadas).\n\nNa prática, isso significa que a maioria dos incidentes de segurança na nuvem vem de **erros de configuração do cliente**, não de falhas do provedor: um bucket de armazenamento deixado público, permissões largas demais, uma porta aberta sem necessidade, uma senha fraca. O provedor te dá ferramentas seguras, mas a configuração é sua.\n\nO quanto cabe a você varia com o modelo de serviço. Num servidor virtual (IaaS), você cuida de mais coisas, inclusive de atualizar o sistema operacional. Num serviço gerenciado (PaaS), o provedor assume mais, e você foca na aplicação e nos acessos.\n\nA lição prática: nunca presuma que "está na nuvem, então está seguro". Aplique o que a trilha ensina (menor privilégio no IAM, redes privadas, buckets fechados, MFA) porque essa parte é, por contrato, sua responsabilidade.',
        },
      ],
    },
    {
      id: "servicos",
      title: "Serviços gerenciados",
      description:
        "Deixar o provedor cuidar do trabalho pesado: bancos, funções sem servidor e containers em escala.",
      level: "avancado",
      children: [
        {
          id: "servicos.bancos",
          title: "Bancos de dados gerenciados",
          description:
            "Deixar o provedor cuidar da operação do banco enquanto você usa.",
          content:
            "Você poderia instalar e administrar um banco de dados na mão, num servidor virtual, mas a nuvem oferece um caminho melhor: o **banco de dados gerenciado**. Você contrata o banco como serviço, e o provedor cuida da instalação, das atualizações, dos backups e da disponibilidade, enquanto você só usa.\n\nO ganho é enorme em trabalho e em segurança. Tarefas que exigem conhecimento especializado e atenção constante (manter backups confiáveis, aplicar correções de segurança, garantir que o banco não caia) passam a ser responsabilidade do provedor. Pra um iniciante, isso remove uma fonte gigante de risco: banco sem backup é tragédia anunciada, e o gerenciado resolve isso por padrão.\n\nOs provedores oferecem bancos gerenciados de vários tipos, dos relacionais (como PostgreSQL e MySQL) aos não relacionais. Pra começar, um banco relacional gerenciado cobre a maioria dos casos e conversa com tudo que você já viu sobre dados.\n\nEscolha seu provedor pra ver o serviço de banco gerenciado dele.",
          byLanguage: {
            aws: {
              content:
                "Na AWS, o serviço de bancos relacionais gerenciados é o **RDS** (Relational Database Service), que roda motores como PostgreSQL, MySQL e outros. Ele cuida de backups automáticos, atualizações e réplicas pra alta disponibilidade. Você se conecta a ele a partir da sua aplicação como faria com qualquer banco, mas sem administrar o servidor.",
              resources: [
                {
                  label: "AWS RDS: documentação",
                  url: "https://docs.aws.amazon.com/rds/",
                  kind: "doc",
                },
              ],
            },
            azure: {
              content:
                "No Azure, há serviços gerenciados como o **Azure SQL Database** e as ofertas gerenciadas de PostgreSQL e MySQL. O provedor cuida de backups, correções e disponibilidade, e você foca em usar o banco a partir da sua aplicação, sem se preocupar com a operação da infraestrutura por baixo.",
              resources: [
                {
                  label: "Azure SQL: documentação",
                  url: "https://learn.microsoft.com/en-us/azure/azure-sql/",
                  kind: "doc",
                },
              ],
            },
            gcp: {
              content:
                "No Google Cloud, o serviço de bancos relacionais gerenciados é o **Cloud SQL**, que roda PostgreSQL, MySQL e SQL Server. Ele automatiza backups, atualizações e réplicas, e você se conecta a partir da aplicação. Pra cargas muito grandes, o Google oferece também opções mais avançadas, mas o Cloud SQL cobre bem o início.",
              resources: [
                {
                  label: "Google Cloud SQL: documentação",
                  url: "https://cloud.google.com/sql/docs",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "servicos.serverless",
          title: "Serverless e funções",
          description:
            "Rodar código sem gerenciar servidor nenhum, pagando só pela execução.",
          content:
            "O modelo **serverless** (sem servidor) leva a conveniência ao extremo: você escreve uma função de código, entrega ao provedor, e ela roda quando é chamada, sem você gerenciar nenhuma máquina. O nome engana um pouco: existe servidor por baixo, mas ele é invisível pra você, totalmente cuidado pelo provedor.\n\nDuas características definem o modelo. Você paga **por execução** (pelo número de chamadas e pelo tempo que a função roda), e nada quando ela está parada, o que pode sair muito barato pra cargas intermitentes. E ele **escala sozinho**: se mil chamadas chegarem ao mesmo tempo, o provedor cuida de atender, sem você configurar nada.\n\nO uso típico são tarefas pontuais e orientadas a evento: processar um arquivo assim que ele é enviado, responder a uma requisição de API, executar uma rotina agendada. Não serve pra tudo (cargas constantes e pesadas podem custar mais que um servidor dedicado), mas pra muitos casos é a solução mais simples e econômica.\n\nEscolha seu provedor pra ver o serviço serverless dele.",
          byLanguage: {
            aws: {
              content:
                "Na AWS, o serviço serverless mais conhecido é o **Lambda**: você sobe uma função (em várias linguagens possíveis) e a conecta a gatilhos, como uma requisição HTTP ou um arquivo chegando no S3. Você paga pelo número de execuções e pelo tempo de processamento, sem custo quando a função está ociosa.",
              resources: [
                {
                  label: "AWS Lambda: documentação",
                  url: "https://docs.aws.amazon.com/lambda/",
                  kind: "doc",
                },
              ],
            },
            azure: {
              content:
                "No Azure, o serviço é o **Azure Functions**: você cria funções acionadas por gatilhos (HTTP, fila, agenda, evento de armazenamento) e paga conforme o uso. Ele se integra ao restante do ecossistema Azure e é uma forma rápida de rodar lógica sob demanda sem provisionar servidores.",
              resources: [
                {
                  label: "Azure Functions: documentação",
                  url: "https://learn.microsoft.com/en-us/azure/azure-functions/",
                  kind: "doc",
                },
              ],
            },
            gcp: {
              content:
                "No Google Cloud, o serviço é o **Cloud Functions**: funções acionadas por eventos (HTTP, mensagens, mudanças no Cloud Storage) que escalam sozinhas e cobram pelo uso. O Google também oferece o Cloud Run, voltado a rodar containers de forma serverless, útil quando você quer mais controle que uma função simples.",
              resources: [
                {
                  label: "Google Cloud Functions: documentação",
                  url: "https://cloud.google.com/functions/docs",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "servicos.containers",
          title: "Containers e Kubernetes",
          description:
            "Empacotar aplicações e orquestrá-las em escala na nuvem.",
          content:
            'Os **containers** viraram a forma padrão de empacotar e rodar aplicações na nuvem. Um container empacota a aplicação com tudo que ela precisa pra rodar (a linguagem, as dependências, as configurações), de forma que ela funcione igual em qualquer lugar, resolvendo o clássico "na minha máquina funciona". A ferramenta mais conhecida pra isso é o **Docker**, e vale aprender o básico dele: imagem, container e como empacotar uma aplicação.\n\nQuando você tem muitos containers pra gerenciar (atualizar, escalar, reiniciar quando falham, distribuir carga), precisa de um **orquestrador**. O padrão da indústria é o **Kubernetes**, um sistema que automatiza tudo isso. Ele é poderoso e, com franqueza, complexo: é um tema avançado, que faz mais sentido depois que você domina os fundamentos.\n\nComo rodar e administrar Kubernetes do zero é trabalhoso, os provedores oferecem versões **gerenciadas**, em que eles cuidam da parte mais difícil e você foca em rodar suas aplicações. É por aí que se começa, em vez de instalar Kubernetes na mão.\n\nUm conselho de ritmo: não pule pro Kubernetes cedo demais. Muita gente se afoga nele antes de entender containers e os serviços básicos. Aprenda Docker primeiro, rode aplicações em servidores ou em serviços serverless, e chegue ao Kubernetes quando a necessidade de orquestrar muitos containers aparecer de verdade.\n\nEscolha seu provedor pra ver o Kubernetes gerenciado dele.',
          byLanguage: {
            aws: {
              content:
                "Na AWS, o Kubernetes gerenciado é o **EKS** (Elastic Kubernetes Service). A AWS oferece também o ECS, um orquestrador de containers próprio e mais simples que o Kubernetes, que muitas vezes é um bom ponto de partida antes de encarar o EKS.",
              resources: [
                {
                  label: "AWS EKS: documentação",
                  url: "https://docs.aws.amazon.com/eks/",
                  kind: "doc",
                },
                {
                  label: "Docker: get started (oficial)",
                  url: "https://docs.docker.com/get-started/",
                  kind: "doc",
                },
              ],
            },
            azure: {
              content:
                "No Azure, o Kubernetes gerenciado é o **AKS** (Azure Kubernetes Service). Ele cuida da complexidade do cluster e se integra ao restante do Azure. Pra cargas mais simples, o Azure também oferece o Container Apps, que roda containers sem você administrar um cluster Kubernetes inteiro.",
              resources: [
                {
                  label: "Azure AKS: documentação",
                  url: "https://learn.microsoft.com/en-us/azure/aks/",
                  kind: "doc",
                },
                {
                  label: "Docker: get started (oficial)",
                  url: "https://docs.docker.com/get-started/",
                  kind: "doc",
                },
              ],
            },
            gcp: {
              content:
                "No Google Cloud, o Kubernetes gerenciado é o **GKE** (Google Kubernetes Engine). Como o Kubernetes nasceu no Google, o GKE é uma das implementações mais maduras. Pra começar com containers de forma mais simples, o Cloud Run roda containers de modo serverless, sem gerenciar cluster.",
              resources: [
                {
                  label: "Google Kubernetes Engine: documentação",
                  url: "https://cloud.google.com/kubernetes-engine/docs",
                  kind: "doc",
                },
                {
                  label: "Docker: get started (oficial)",
                  url: "https://docs.docker.com/get-started/",
                  kind: "doc",
                },
              ],
            },
          },
        },
      ],
    },
    {
      id: "automacao",
      title: "Automação e operação",
      description:
        "Descrever a infraestrutura como código, automatizar entregas e manter custos e saúde sob controle.",
      level: "avancado",
      children: [
        {
          id: "automacao.iac",
          title: "Infraestrutura como código",
          description:
            "Descrever sua infraestrutura em arquivos versionados, em vez de clicar no painel.",
          content:
            "No começo, você cria recursos clicando no painel do provedor. Isso ensina, mas não escala nem se repete com confiança: cliques não ficam registrados, e recriar tudo na mão é lento e propenso a erro. A solução profissional é a **infraestrutura como código** (IaC): descrever toda a sua infraestrutura em arquivos de texto, que você versiona no Git como qualquer código.\n\nA vantagem é grande. A infraestrutura vira **reproduzível**: o mesmo arquivo cria o mesmo ambiente quantas vezes você quiser, idêntico, em segundos. Vira **versionada**: você vê o histórico de mudanças e volta atrás se algo quebrar. E vira **documentada por definição**, porque o arquivo descreve exatamente o que existe, sem depender da memória de ninguém.\n\nA ferramenta mais popular pra isso é o **Terraform**, que tem uma grande vantagem pra esta trilha: ele funciona com os três provedores. Você descreve os recursos desejados (uma rede, um servidor, um banco), e o Terraform cuida de criá-los, atualizá-los ou removê-los pra bater com o que você declarou. Existem também ferramentas próprias de cada provedor, mas o Terraform, por ser multi-nuvem, é um conhecimento que viaja bem.\n\nÉ um tema avançado, e faz mais sentido depois que você já criou recursos na mão e entende o que eles são. Mas é uma habilidade muito valorizada: saber IaC é o que separa quem opera nuvem de forma artesanal de quem opera de forma profissional e em escala.",
          resources: [
            {
              label: "Terraform: documentação oficial",
              url: "https://developer.hashicorp.com/terraform/docs",
              kind: "doc",
            },
            {
              label: "Terraform: tutoriais oficiais",
              url: "https://developer.hashicorp.com/terraform/tutorials",
              kind: "doc",
            },
          ],
        },
        {
          id: "automacao.cicd",
          title: "CI/CD",
          description:
            "Automatizar a entrega de aplicações pra a nuvem a cada mudança.",
          content:
            "Em cloud, você não quer publicar aplicações na mão a cada mudança: é lento, manual e cheio de erro. A prática que resolve isso é o **CI/CD** (integração e entrega contínuas): um fluxo automatizado que, a cada alteração no código, testa, constrói e publica a aplicação na nuvem sozinho.\n\nVale separar as duas partes. A **integração contínua** (CI) cuida de, a cada envio de código, rodar verificações e testes automaticamente, pegando problemas cedo, antes de chegarem à produção. A **entrega contínua** (CD) cuida de levar o código aprovado até o ambiente onde ele roda, de forma automatizada e confiável.\n\nO efeito combinado é um **pipeline**: o desenvolvedor envia o código, as checagens rodam, e se tudo passa a nova versão é publicada sem intervenção manual. Isso torna as entregas mais frequentes, mais rápidas e muito mais seguras, porque o processo é sempre o mesmo, sem o fator humano de esquecer um passo.\n\nExistem várias ferramentas pra montar pipelines (uma das mais comuns é o GitHub Actions, integrado ao repositório), e os próprios provedores têm serviços nativos pra isso. Pra um projeto de portfólio, configurar um pipeline simples que publica sua aplicação na nuvem a cada push demonstra exatamente a mentalidade de automação que a área valoriza. É a peça que conecta o seu código ao seu deploy de forma profissional.",
        },
        {
          id: "automacao.custos",
          title: "Custos e monitoramento",
          description:
            "Acompanhar o que você gasta e o que está acontecendo na sua infraestrutura.",
          content:
            "Duas perguntas acompanham qualquer profissional de cloud no dia a dia: quanto isso está custando, e está tudo funcionando? Saber respondê-las é o que separa operar nuvem com responsabilidade de operar no escuro.\n\nO **custo** merece atenção desde o início, porque o modelo de pagamento por uso é uma faca de dois gumes: flexível, mas fácil de perder o controle. Recursos esquecidos ligados, escolhas de tamanho exageradas e tráfego de dados inesperado fazem a fatura crescer. Os três provedores oferecem painéis pra acompanhar gastos e, principalmente, **alertas de orçamento** que avisam quando o consumo passa de um limite. Configurar esses alertas é o primeiro reflexo de quem trabalha com nuvem. Gerenciar custo é, inclusive, uma especialidade própria dentro da área.\n\nO **monitoramento** responde à segunda pergunta. Você acompanha métricas (uso de CPU, memória, número de requisições, tempo de resposta) e **logs** (os registros do que os sistemas fazem) pra saber se está tudo saudável e investigar quando não está. Cada provedor tem seu serviço central de monitoramento e logs, onde esses dados se concentram.\n\nUma peça importante são os **alertas**: regras que te avisam automaticamente quando algo foge do normal (um servidor sobrecarregado, uma taxa de erro subindo, um serviço fora do ar), de preferência antes que o usuário perceba. A mentalidade de operação madura é descobrir problemas pelos seus alertas, não pela reclamação de quem usa.",
        },
      ],
    },
    {
      id: "carreira",
      title: "Certificações e carreira",
      description:
        "Validar seu conhecimento com a certificação certa e dar os primeiros passos rumo a uma vaga.",
      level: "avancado",
      children: [
        {
          id: "carreira.certificacoes",
          title: "Certificações cloud",
          description:
            "O caminho mais reconhecido pra validar conhecimento e entrar na área.",
          content:
            "Cloud é uma das áreas de tecnologia onde **certificações** pesam mais. Cada provedor tem sua trilha de certificações, e o mercado as reconhece como prova de que você domina os fundamentos da plataforma. Pra quem está começando, a recomendação é clara: comece pela certificação de **nível fundamental** do seu provedor.\n\nEssas certificações de entrada cobrem justamente os conceitos desta trilha (modelos de serviço, principais serviços, segurança, custos) sem exigir conhecimento técnico profundo. São acessíveis pra iniciantes, muito valorizadas como primeiro selo e uma excelente forma de organizar o estudo, porque dão um currículo de tópicos a dominar.\n\nUm conselho de equilíbrio: a certificação ajuda a passar por filtros de recrutamento e a estruturar o aprendizado, mas não substitui prática real. O ideal é estudar pra ela enquanto coloca a mão na massa na camada gratuita, criando recursos de verdade. Certificado somado a projetos práticos vale muito mais que o certificado sozinho.\n\nEscolha seu provedor pra ver a certificação de entrada e a plataforma de estudo oficial dele.",
          byLanguage: {
            aws: {
              content:
                "Na AWS, a certificação de entrada é a **AWS Certified Cloud Practitioner**, amplamente reconhecida e ideal pra iniciantes. A plataforma oficial de estudo gratuita é o **AWS Skill Builder**, com trilhas que preparam pra ela. É a certificação mais citada como ponto de partida pela quantidade de vagas que pedem AWS.",
              resources: [
                {
                  label: "AWS Certified Cloud Practitioner (oficial)",
                  url: "https://aws.amazon.com/certification/certified-cloud-practitioner/",
                  kind: "doc",
                },
                {
                  label: "AWS Skill Builder (treinamento oficial)",
                  url: "https://skillbuilder.aws/",
                  kind: "curso",
                },
              ],
            },
            azure: {
              content:
                "No Azure, a certificação de entrada é a **AZ-900: Azure Fundamentals**, que cobre os conceitos básicos da nuvem e dos principais serviços Azure. A plataforma oficial de estudo é o **Microsoft Learn**, gratuito, com trilhas completas que preparam pra ela. É forte especialmente em empresas que já usam o ecossistema Microsoft.",
              resources: [
                {
                  label: "Azure Fundamentals AZ-900 (oficial)",
                  url: "https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/",
                  kind: "doc",
                },
                {
                  label: "Microsoft Learn: treinamento Azure",
                  url: "https://learn.microsoft.com/en-us/training/azure/",
                  kind: "curso",
                },
              ],
            },
            gcp: {
              content:
                "No Google Cloud, a certificação de entrada, mais voltada a conceitos e negócio, é a **Cloud Digital Leader**. A plataforma oficial de estudo é o **Google Cloud Skills Boost**, com trilhas práticas. Conforme avança no lado técnico, o Google oferece a Associate Cloud Engineer, um passo seguinte mais aprofundado.",
              resources: [
                {
                  label: "Google Cloud Digital Leader (oficial)",
                  url: "https://cloud.google.com/learn/certification/cloud-digital-leader",
                  kind: "doc",
                },
                {
                  label: "Google Cloud Skills Boost (treinamento oficial)",
                  url: "https://www.cloudskillsboost.google/",
                  kind: "curso",
                },
              ],
            },
          },
        },
        {
          id: "carreira.projeto",
          title: "Projeto final: arquitetura de alta disponibilidade",
          description:
            "Uma aplicação web desenhada pra sobreviver a falhas, aplicando os pilares da trilha.",
          project: "arquitetura-alta-disponibilidade",
        },
        {
          id: "carreira.entrar",
          title: "Entrar na carreira",
          description:
            "Como construir experiência e se posicionar pra primeira vaga em cloud.",
          optional: true,
          content:
            "Cloud, assim como outras áreas de infraestrutura, costuma valorizar uma base prévia em TI, então muita gente chega a ela vinda de suporte, redes ou desenvolvimento. Mas dá pra construir o caminho de forma direta, combinando estudo, prática e a certificação certa.\n\nA fórmula que funciona tem três partes. A **certificação de entrada** do seu provedor, que abre portas em recrutamento e organiza o aprendizado. A **prática na camada gratuita**, criando recursos de verdade: subir um servidor, hospedar um site no armazenamento de objetos, configurar uma rede, montar um pequeno projeto de ponta a ponta. E a **documentação** desses projetos no GitHub, com um bom README, que serve de portfólio e prova que você sabe fazer, não só responder prova.\n\nAlguns cargos são portas de entrada comuns: posições juniores de cloud, e funções vizinhas como **DevOps** e **SRE**, que compartilham muito conhecimento com cloud e têm bastante demanda. Vale conhecer esses caminhos, porque a fronteira entre eles é fluida.\n\nDuas atitudes sustentam a carreira a longo prazo. O **controle de custos** como valor: mostrar que você pensa em não desperdiçar recursos é algo que empregadores valorizam muito, porque mexe direto com o bolso da empresa. E o **aprendizado contínuo**, porque os provedores lançam serviços o tempo todo; o profissional de cloud nunca para de estudar. A boa notícia é que os fundamentos desta trilha mudam devagar e sustentam tudo o que vier por cima.",
        },
      ],
    },
  ],
};
