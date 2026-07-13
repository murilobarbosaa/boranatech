import type { RoadmapV2 } from "../types";

export const devops: RoadmapV2 = {
  slug: "devops",
  area: "devops",
  title: "DevOps do Zero",
  level: "Iniciante",
  description:
    "Da cultura e das bases de Linux e Git aos containers, CI/CD, infraestrutura como código e observabilidade. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é DevOps de verdade, o problema que ele resolve e os princípios que o sustentam.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é DevOps",
          description:
            "Uma cultura de unir desenvolvimento e operações, não um cargo ou uma ferramenta.",
          content:
            "DevOps é, antes de tudo, uma **cultura**: um jeito de trabalhar que une o desenvolvimento de software (dev) com as operações de TI (ops) pra entregar software com mais velocidade, qualidade e confiabilidade. O nome vem dessa junção, e entender que DevOps é cultura, não cargo nem ferramenta, é o primeiro passo pra não se perder na área.\n\nIsso surpreende quem chega esperando \"aprender a ferramenta DevOps\", porque ela não existe. DevOps é um conjunto de práticas e valores apoiados por **várias** ferramentas (Docker, pipelines, Terraform, Kubernetes e outras que você verá aqui). As ferramentas servem à cultura, não o contrário. Empresas que compram ferramentas achando que isso as torna \"DevOps\", sem mudar a forma de trabalhar, costumam se frustrar.\n\nO objetivo central é entregar valor ao usuário de forma **rápida e segura ao mesmo tempo**, dois objetivos que pareciam opostos. Historicamente, ir rápido significava arriscar quebrar; ser estável significava ir devagar. DevOps busca os dois juntos, através de automação e de uma colaboração mais próxima entre quem constrói e quem mantém.\n\nVale um aviso honesto sobre dificuldade: DevOps é uma área avançada (a própria descrição da carreira aponta isso), que faz mais sentido depois de alguma base em desenvolvimento ou administração de sistemas. Não é por acaso o primeiro emprego de muita gente. Mas é uma das áreas de maior demanda e melhor remuneração em tecnologia, e esta trilha te dá o mapa, começando pelos fundamentos que sustentam tudo o resto.",
        },
        {
          id: "fundamentos.problema",
          title: "O muro entre dev e ops",
          description:
            "O problema histórico que fez o DevOps nascer.",
          content:
            "Pra entender por que DevOps existe, vale conhecer o problema que ele veio resolver. Tradicionalmente, dois times tinham objetivos em conflito. O time de **desenvolvimento** queria entregar mudanças e novidades rápido, porque é disso que vive o produto. O time de **operações** queria estabilidade, porque é responsabilizado quando algo cai, e toda mudança é um risco. O resultado era um conflito estrutural: dev empurrando mudanças, ops freando pra proteger.\n\nEsse conflito ficou conhecido como o **muro da confusão**: o desenvolvedor \"jogava\" o software por cima do muro pra operação colocar no ar, e quando dava problema, cada lado culpava o outro. O dev dizia \"na minha máquina funcionava\"; o ops dizia \"o código de vocês quebrou\". Ninguém era dono do problema inteiro, e o usuário sofria com lentidão e instabilidade.\n\nDevOps derruba esse muro. A ideia é que dev e ops compartilhem a **responsabilidade** pelo ciclo completo, do código até o software rodando em produção. Quem constrói também se importa com como aquilo roda no mundo real; quem opera participa mais cedo, ajudando a construir algo operável. A responsabilidade deixa de ser \"de quem joga\" e \"de quem recebe\", e passa a ser de todos.\n\nEssa mudança de mentalidade é a essência cultural do DevOps, e as práticas técnicas que você vai aprender (containers, pipelines, automação) são as ferramentas que tornam essa colaboração possível na prática. Sem a mudança de cultura, as ferramentas sozinhas não resolvem o conflito.",
        },
        {
          id: "fundamentos.pilares",
          title: "Cultura, automação e medição",
          description:
            "Os princípios que orientam toda prática de DevOps.",
          content:
            "DevOps se apoia em alguns princípios que orientam todas as práticas técnicas. Conhecê-los ajuda a entender o **porquê** por trás de cada ferramenta que você vai aprender, em vez de decorar comandos soltos.\n\nO primeiro é a **colaboração**: times de dev e ops (e segurança, e qualidade) trabalhando juntos, com responsabilidade compartilhada, em vez de em silos que jogam culpa um no outro. Esse é o coração cultural, do qual tudo decorre.\n\nO segundo é a **automação**, talvez o mais visível na prática. A ideia é automatizar tudo que é repetitivo e propenso a erro humano: testes, construção do software, deploy, criação de infraestrutura. Tarefa feita à mão é lenta, inconsistente e arriscada; automatizada, é rápida, repetível e confiável. Boa parte desta trilha é justamente aprender a automatizar essas etapas.\n\nO terceiro é a **medição** (e o monitoramento): você não melhora o que não mede. DevOps valoriza acompanhar métricas reais (com que frequência você entrega, quanto tempo leva pra se recuperar de uma falha, com que frequência mudanças causam problemas) pra guiar melhorias com base em fatos, não em achismo.\n\nE há um princípio que costura tudo: a **melhoria contínua**, a busca constante por ciclos mais curtos, processos melhores e menos atrito, aprendendo com cada entrega e cada falha. Em vez de uma grande transformação de uma vez, pequenas melhorias somadas ao longo do tempo. Guarde esses princípios; cada prática técnica adiante é uma forma concreta de colocá-los em ação.",
        },
      ],
    },
    {
      id: "bases",
      title: "Bases técnicas",
      description:
        "As fundações que todo profissional de DevOps usa todo dia: Linux e Git.",
      level: "iniciante",
      children: [
        {
          id: "bases.linux",
          title: "Linux e scripting",
          description:
            "O sistema dos servidores e a automação por linha de comando.",
          content:
            "A base técnica número um de DevOps é o **Linux**. A imensa maioria dos servidores roda Linux, assim como containers, ferramentas de automação e a nuvem em geral. Não dá pra trabalhar com infraestrutura sem se sentir em casa no terminal Linux, então este é o ponto de partida inegociável.\n\nVocê precisa de fluência na linha de comando: navegar por pastas, manipular arquivos, ver e gerenciar processos, checar logs, entender permissões de usuários e arquivos (quem pode fazer o quê), e usar o acesso remoto seguro (SSH) pra administrar servidores que não têm tela. Esses servidores sem interface gráfica são a norma, e o terminal é a sua única janela pra eles.\n\nLogo em seguida vem o **scripting**, a porta de entrada da automação. Saber escrever scripts em **Bash** (a linguagem do terminal Linux) permite automatizar tarefas repetitivas: encadear comandos, fazer um backup, preparar um ambiente, processar arquivos em lote. Muitos profissionais de DevOps também usam **Python** pra automações mais complexas. A mentalidade central já aparece aqui: se você faz algo manualmente mais de uma vez, pergunte se não vale automatizar.\n\nNão tente decorar centenas de comandos. Instale o Linux numa máquina virtual ou use uma instância na nuvem, e o use de verdade pra tarefas reais. A fluência cresce com a prática, e ela é o alicerce sobre o qual todo o resto da trilha se apoia: containers, pipelines e automação são, no fundo, formas estruturadas de comandar sistemas Linux.",
          resources: [
            {
              label: "Ubuntu: linha de comando pra iniciantes",
              url: "https://ubuntu.com/tutorials/command-line-for-beginners",
              kind: "artigo",
            },
          ],
        },
        {
          id: "bases.git",
          title: "Git e fluxo de trabalho",
          description:
            "O controle de versão que está no centro de todo fluxo DevOps.",
          content:
            "O **Git** é o sistema de controle de versão universal em tecnologia, e em DevOps ele tem um papel ainda mais central: é o ponto de partida de quase toda automação. Pipelines de entrega disparam a partir de mudanças no Git; a própria infraestrutura é versionada no Git. Dominar o Git bem, além do básico, é essencial aqui.\n\nVocê precisa do ciclo fundamental (`add`, `commit`, `push`) e, principalmente, do trabalho com **branches** (ramificações): criar uma linha de trabalho separada pra uma mudança, sem afetar a versão principal, e depois integrá-la de volta. Some a isso o fluxo de **pull request** (ou merge request), o mecanismo pelo qual mudanças são propostas, revisadas e aprovadas antes de entrar na base principal. Esse fluxo de revisão é onde a qualidade e a colaboração acontecem.\n\nEm DevOps, dois conceitos elevam o papel do Git. O primeiro é que o Git vira o **gatilho** dos pipelines: a cada push ou pull request, verificações e entregas automáticas disparam, como você verá na seção de CI/CD. O segundo, mais avançado, é a ideia de que **tudo vira código versionado**: não só a aplicação, mas a infraestrutura e as configurações também ficam no Git, o que dá histórico, revisão e reprodutibilidade pra tudo.\n\nSe você já usa Git no básico, o salto aqui é dominar branches, pull requests e a disciplina de bons commits. É um conhecimento que se paga em cada etapa seguinte, porque o Git é o fio condutor que liga código, automação e infraestrutura no mundo DevOps.",
          resources: [
            {
              label: "Pro Git (livro oficial, em português)",
              url: "https://git-scm.com/book/pt-br/v2",
              kind: "doc",
            },
          ],
        },
      ],
    },
    // TODO(Ana): etapa nova (aprofundamento), revisar copy.
    {
      id: "redes",
      title: "Redes na prática",
      description:
        "O Linux você já viu nas bases; aqui entra a rede que liga os serviços, o outro pilar que DevOps precisa dominar.",
      level: "intermediario",
      children: [
        {
          id: "redes.conecta",
          title: "Como a rede conecta os serviços",
          description:
            "IP, DNS, portas e HTTPS: os conceitos que explicam como um serviço acha e fala com o outro.",
          content:
            "Toda infraestrutura é feita de serviços que precisam se encontrar e conversar pela rede, então uma base sólida de **redes** é o segundo pilar técnico de DevOps, ao lado do Linux. Alguns conceitos abrem quase tudo. O **endereço IP** identifica cada máquina; o **DNS** traduz nomes (como api.seusite.com) nesses endereços; e as **portas** distinguem os vários serviços numa mesma máquina (o site numa porta, o banco em outra).\n\nSobre isso roda o **HTTP**, o protocolo da web, e sua versão segura, o **HTTPS**, que criptografa o tráfego com **TLS** (os certificados que fazem o cadeado aparecer). Entender o caminho de uma requisição (o cliente resolve o nome no DNS, abre conexão no IP e porta certos, e troca dados por HTTP) é o que permite diagnosticar quando dois serviços não conseguem se falar, um problema diário em infraestrutura.\n\nEsses conceitos deixam de ser abstratos quando algo quebra: um serviço que não responde pode ser DNS errado, porta fechada, certificado vencido ou firewall bloqueando. Saber por onde a comunicação passa transforma o pânico do não funciona num diagnóstico metódico, etapa por etapa.",
        },
        {
          id: "redes.trafego",
          title: "Balanceamento, proxy e firewall",
          description:
            "As peças que distribuem, encaminham e protegem o tráfego entre a internet e seus serviços.",
          content:
            "Quando um serviço cresce, um servidor só não aguenta o tráfego, e entra o **balanceador de carga** (load balancer): uma peça que recebe as requisições e as distribui entre várias cópias da aplicação, evitando sobrecarregar uma só e permitindo escalar horizontalmente. Se uma cópia cai, o balanceador para de mandar tráfego pra ela, aumentando a resiliência.\n\nO **proxy reverso** é um parente próximo: fica na frente dos serviços e encaminha as requisições para o destino certo, além de cuidar de tarefas comuns como terminar o HTTPS e servir conteúdo em cache. E o **firewall** (com seus primos na nuvem, os grupos de segurança) controla o que pode entrar e sair, deixando passar só o tráfego autorizado nas portas certas e bloqueando o resto.\n\nEssas três peças formam a borda por onde o tráfego entra na sua infraestrutura, e configurá-las bem é ao mesmo tempo questão de performance e de segurança. Você não precisa dominar todas de uma vez, mas entender o papel de cada uma esclarece como um sistema real recebe e protege o tráfego que vem da internet.",
        },
      ],
    },
    {
      id: "containers",
      title: "Containers",
      description:
        "A tecnologia que padronizou como o software é empacotado e executado.",
      level: "intermediario",
      children: [
        {
          id: "containers.docker",
          title: "Docker e containers",
          description:
            "Empacotar uma aplicação com tudo que ela precisa pra rodar igual em qualquer lugar.",
          content:
            "Os **containers** são uma das tecnologias mais importantes de toda a área, e o **Docker** é a ferramenta que os popularizou. Um container empacota uma aplicação junto com tudo que ela precisa pra rodar (a linguagem na versão certa, as dependências, as configurações) num pacote isolado que se comporta igual em qualquer lugar: na sua máquina, na do colega e no servidor.\n\nIsso resolve, de uma vez, o clássico \"na minha máquina funciona\", justamente o atrito entre dev e ops que vimos nos fundamentos. Se a aplicação roda dentro de um container, ela roda igual em todo lugar, porque carrega o próprio ambiente consigo.\n\nAs três peças centrais a entender são simples. O **Dockerfile** é a receita: um arquivo de texto que descreve como construir a imagem (parta desta base, copie o código, instale as dependências, rode este comando). A **imagem** é o pacote pronto e imutável, gerado a partir da receita. E o **container** é a imagem em execução, um processo isolado rodando. Você constrói uma imagem a partir do Dockerfile e executa quantos containers quiser a partir dela.\n\nPra DevOps, o Docker é fundamental por dois motivos. Ele padroniza a unidade de software (tudo vira container, do banco à aplicação), o que simplifica enormemente o deploy e a automação. E é a base sobre a qual se constroem a orquestração (Kubernetes) e boa parte dos pipelines modernos. Comece aprendendo a containerizar uma aplicação simples: escrever um Dockerfile, construir a imagem e rodar o container é o exercício que destrava o resto.",
          resources: [
            {
              label: "Docker: introdução (documentação oficial)",
              url: "https://docs.docker.com/get-started/introduction/",
              kind: "doc",
            },
          ],
        },
        {
          id: "containers.compose",
          title: "Docker Compose",
          description:
            "Orquestrar vários containers que trabalham juntos com um comando.",
          content:
            "Uma aplicação real raramente é um container só. Costuma ter vários trabalhando juntos: a aplicação, um banco de dados, talvez um cache, um servidor web na frente. Subir e configurar cada um na mão, garantindo que conversem entre si, é trabalhoso e propenso a erro. O **Docker Compose** resolve isso.\n\nCom o Compose, você descreve todos os containers da sua aplicação num único arquivo de texto (em formato YAML): quais imagens usar, como eles se conectam, quais portas expor, quais variáveis de ambiente passar. Aí, com um comando só (`docker compose up`), o Compose sobe tudo de uma vez, na ordem certa e já conectado.\n\nIsso é especialmente útil em dois cenários. No **desenvolvimento**, ele permite subir todo o ambiente da aplicação (incluindo o banco) na sua máquina com um comando, sem instalar nada além do Docker, e derrubar tudo igualmente fácil. E como documentação viva: o arquivo do Compose descreve, de forma executável, todas as peças que a aplicação precisa pra rodar.\n\nO Compose também é um primeiro contato com uma ideia central do DevOps: descrever a infraestrutura em **arquivos versionados** em vez de configurar tudo na mão. O arquivo do Compose entra no Git junto com o código, e qualquer pessoa que clonar o projeto sobe o mesmo ambiente. Essa é uma prévia do conceito de infraestrutura como código, que você aprofunda mais adiante. Para muitos projetos pequenos e médios, e para o ambiente de desenvolvimento, o Compose já resolve a orquestração sem precisar de algo tão complexo quanto o Kubernetes.",
          resources: [
            {
              label: "Docker Compose: documentação oficial",
              url: "https://docs.docker.com/compose/",
              kind: "doc",
            },
          ],
        },
        {
          id: "containers.registry",
          title: "Imagens e registries",
          description:
            "Onde as imagens de container são armazenadas e compartilhadas.",
          optional: true,
          content:
            "Depois de construir uma imagem Docker, surge a pergunta: como levá-la da sua máquina pro servidor que vai executá-la? A resposta são os **registries** (registros de imagens), que funcionam como repositórios de imagens de container, parecidos com o que o GitHub é pra código.\n\nO fluxo é direto. Você constrói a imagem localmente, faz um **push** dela pro registry, e o servidor (ou o Kubernetes, ou o pipeline) faz um **pull** pra baixá-la e executar. Assim a mesma imagem, idêntica, viaja do desenvolvimento até a produção, garantindo que o que você testou é exatamente o que vai rodar. O registry público mais conhecido é o Docker Hub, e os provedores de nuvem oferecem registries privados pra imagens da empresa.\n\nDois conceitos ajudam no dia a dia. As **tags** identificam versões de uma imagem (como uma versão específica ou a \"mais recente\"), permitindo controlar exatamente qual versão roda onde. E o cuidado com o **tamanho** da imagem: imagens menores sobem e descem mais rápido e têm menos potencial de problemas, então boas práticas de Dockerfile (partir de imagens base enxutas, não incluir o que não precisa) importam.\n\nÉ um tema mais operacional, por isso opcional nesta fase, mas entender o papel do registry fecha o ciclo do container: você aprende a construir a imagem, a rodá-la e, agora, a distribuí-la. Esse ciclo completo (build, push, pull, run) é a espinha dorsal de como o software containerizado se move pela esteira de entrega, e os pipelines de CI/CD da próxima seção automatizam exatamente isso.",
        },
      ],
    },
    {
      id: "cicd",
      title: "CI/CD",
      description:
        "O coração automatizado do DevOps: integrar, testar e entregar software a cada mudança.",
      level: "intermediario",
      children: [
        {
          id: "cicd.conceito",
          title: "O que é CI/CD",
          description:
            "Automatizar o caminho do código até a produção.",
          content:
            "**CI/CD** é provavelmente a prática mais emblemática do DevOps, a que mais materializa o princípio da automação. A sigla junta duas ideias complementares que, juntas, automatizam o caminho do código até o usuário.\n\nA **integração contínua** (CI) cuida da primeira parte. A cada mudança que um desenvolvedor envia ao repositório, um serviço automaticamente baixa o código num ambiente limpo e roda verificações: constrói o software, executa os testes, faz checagens de qualidade. Se algo falha, a mudança é sinalizada na hora, antes de causar problema. Isso evita o pesadelo clássico de integrar o trabalho de várias pessoas só no fim e descobrir uma montanha de conflitos e bugs de uma vez.\n\nA **entrega/implantação contínua** (CD) cuida de levar o código aprovado adiante de forma automatizada: prepará-lo pra produção e, em muitos casos, publicá-lo automaticamente. A diferença entre os dois \"D\" é sutil: entrega contínua deixa tudo pronto pra publicar com um clique; implantação contínua publica sozinha, sem intervenção, quando passa em todas as verificações.\n\nO conjunto forma um **pipeline**: uma esteira automatizada por onde cada mudança passa, do commit até a produção, com etapas de construção, teste e deploy. O efeito é transformador: entregas que eram raras, manuais e arriscadas viram frequentes, automáticas e seguras, porque o processo é sempre o mesmo e o que quebra é pego cedo.\n\nUma ferramenta muito comum e acessível pra montar pipelines é o **GitHub Actions**, integrado ao repositório, mas o conceito vale pra qualquer uma (Jenkins, GitLab CI e outras). O próximo passo é construir um pipeline na prática.",
          resources: [
            {
              label: "GitHub Actions (documentação oficial)",
              url: "https://docs.github.com/pt/actions",
              kind: "doc",
            },
          ],
        },
        {
          id: "cicd.pipeline",
          title: "Construir um pipeline",
          description:
            "Montar uma esteira que testa e entrega seu projeto automaticamente.",
          content:
            "Hora de colocar a mão na massa. Construir um pipeline de CI/CD é o exercício que melhor demonstra a essência do DevOps num portfólio, porque amarra Git, automação e deploy numa coisa só, funcionando de ponta a ponta.\n\nUm pipeline típico, definido num arquivo de configuração versionado junto com o código, encadeia etapas que rodam automaticamente a cada mudança. Por exemplo: ao receber um push, o pipeline baixa o código, instala as dependências, roda os testes, constrói a aplicação (muitas vezes gerando uma imagem Docker) e, se tudo passou, faz o deploy. Se qualquer etapa falha, o pipeline para e avisa, e o código problemático não avança.\n\nComece simples. Pegue um projeto pessoal e crie um pipeline que, a cada push, rode ao menos uma verificação automática (os testes, ou uma checagem de qualidade). Esse já é um CI funcional. Depois evolua: adicione a construção de uma imagem Docker, e por fim um deploy automático pra algum ambiente. Cada etapa que você automatiza é uma vitória concreta e visível.\n\nO valor pedagógico é alto: ao montar um pipeline, você junta tudo que viu antes (Git como gatilho, containers como unidade de entrega, automação como princípio) num fluxo real. E o valor pra carreira também, porque saber configurar CI/CD é uma das habilidades mais pedidas em vagas de DevOps.\n\nO projeto abaixo te guia na criação de um pipeline de CI/CD para um projeto pessoal, exatamente o exercício que consolida esta seção. Use-o como roteiro, partindo de um repositório seu no GitHub.",
          project: "pipeline-ci-cd",
          resources: [
            {
              label: "GitHub Actions (documentação oficial)",
              url: "https://docs.github.com/pt/actions",
              kind: "doc",
            },
          ],
        },
        {
          id: "cicd.deploy",
          title: "Estratégias de deploy",
          description:
            "Publicar mudanças com segurança, reduzindo o risco de cada entrega.",
          content:
            "Automatizar o deploy é metade do trabalho; fazê-lo com **segurança** é a outra. Publicar uma mudança sempre carrega risco de quebrar algo em produção, e o DevOps maduro usa estratégias pra reduzir esse risco, em vez de cruzar os dedos a cada entrega.\n\nUma ideia central é **entregar pequeno e com frequência**. Parece contraintuitivo (entregar mais vezes não seria mais arriscado?), mas é o contrário: mudanças pequenas e frequentes são mais fáceis de testar, de entender e de reverter se der errado. O perigoso é a entrega gigante e rara, que junta centenas de mudanças e, quando quebra, é difícil descobrir qual delas foi a culpada.\n\nAlgumas estratégias ajudam a publicar com rede de proteção. O **deploy gradual** (às vezes chamado canário) libera a mudança primeiro pra uma fração pequena dos usuários, observa se está tudo bem, e só então amplia; se surgir problema, poucos foram afetados. Outra abordagem mantém duas versões do ambiente e troca o tráfego de uma pra outra, permitindo voltar atrás rapidamente. E há as **flags de funcionalidade**, que permitem ligar ou desligar uma novidade sem novo deploy.\n\nO conceito que une tudo é o **rollback**: a capacidade de voltar rápido à versão anterior quando algo dá errado. Saber reverter com segurança é o que dá coragem pra entregar com frequência. Boas práticas de configuração também sustentam isso: princípios como os do The Twelve-Factor App ajudam a construir aplicações que se comportam bem ao serem implantadas e revertidas. A meta não é nunca falhar (impossível), é falhar de forma pequena e se recuperar rápido.",
          resources: [
            {
              label: "The Twelve-Factor App (em português)",
              url: "https://12factor.net/pt_br/",
              kind: "artigo",
            },
          ],
        },
      ],
    },
    // TODO(Ana): etapa nova (aprofundamento), revisar copy.
    {
      id: "seguranca",
      title: "Segurança no pipeline",
      description:
        "Levar segurança para dentro da esteira de entrega (DevSecOps): proteger segredos e achar falhas cedo, não no fim.",
      level: "avancado",
      children: [
        {
          id: "seguranca.segredos",
          title: "Segredos e credenciais",
          description:
            "Senhas, chaves e tokens nunca no código; como guardá-los e entregá-los com segurança.",
          content:
            "O erro de segurança mais comum e mais perigoso em DevOps é deixar **segredos** (senhas de banco, chaves de API, tokens de acesso) escritos direto no código ou no repositório Git. Uma vez no histórico do Git, um segredo é dificílimo de apagar de verdade, e se o repositório vazar, tudo vaza junto. A regra é inegociável: segredo não entra no código.\n\nA solução é guardar segredos em lugares próprios para isso: cofres de segredos e os gerenciadores de configuração das nuvens e das ferramentas de CI/CD, que armazenam esses valores de forma cifrada e os entregam à aplicação apenas em tempo de execução, sem nunca aparecerem no código. A aplicação lê o segredo do ambiente, não de um arquivo versionado.\n\nJunto vem o princípio do **menor privilégio**: cada serviço e cada credencial deve ter só o acesso que realmente precisa, e nada além. Assim, se uma credencial vaza, o estrago é limitado. Tratar segredos com esse cuidado é uma das contribuições mais importantes (e mais esquecidas) de quem cuida da infraestrutura.",
        },
        {
          id: "seguranca.devsecops",
          title: "Segurança integrada ao pipeline",
          description:
            "Colocar verificações de segurança automáticas na esteira, para achar problemas antes de chegar em produção.",
          content:
            "A ideia por trás do **DevSecOps** é simples: em vez de tratar segurança como uma revisão manual no fim do processo, integrá-la ao **pipeline** de entrega, de forma automática e contínua. Quanto mais cedo um problema é encontrado, mais barato e fácil de corrigir; achar uma falha em produção custa muito mais do que pegá-la antes de publicar.\n\nNa prática, o pipeline de CI/CD ganha etapas de verificação de segurança que rodam a cada mudança: checar se as **dependências** do projeto têm vulnerabilidades conhecidas (bibliotecas desatualizadas são uma porta de entrada comum), analisar o próprio código em busca de padrões inseguros, e garantir que nenhum segredo escapou para o repositório. Se uma verificação falha, a entrega para, e o problema é resolvido antes de avançar.\n\nPara quem está começando, o valor está em incorporar a mentalidade de que segurança é responsabilidade contínua e automatizável, não um obstáculo pontual. Adicionar até verificações simples ao pipeline já eleva bastante o nível, e é um diferencial cada vez mais esperado de profissionais de DevOps.",
        },
      ],
    },
    {
      id: "iac",
      title: "Infraestrutura como código",
      description:
        "Descrever servidores e configurações em arquivos versionados, em vez de configurar na mão.",
      level: "avancado",
      children: [
        {
          id: "iac.terraform",
          title: "Infraestrutura como código",
          description:
            "Criar e gerenciar infraestrutura a partir de arquivos, com reprodutibilidade.",
          content:
            "Conforme a infraestrutura cresce (servidores, redes, bancos, balanceadores), configurar tudo clicando em painéis vira insustentável: não fica registrado, não se repete com confiança e ninguém lembra exatamente o que foi feito. A resposta do DevOps é a **infraestrutura como código** (IaC): descrever toda a infraestrutura em arquivos de texto, versionados no Git como qualquer código.\n\nOs ganhos são grandes e conectam vários princípios da área. A infraestrutura vira **reproduzível**: o mesmo arquivo cria o mesmo ambiente quantas vezes você quiser, idêntico, eliminando o problema de ambientes que diferem por configurações esquecidas. Vira **versionada**: você vê o histórico de mudanças e reverte se algo quebrar. E vira **documentada por definição**, porque o arquivo descreve exatamente o que existe.\n\nA ferramenta mais popular é o **Terraform**, que funciona com praticamente qualquer provedor de nuvem. Você declara o estado desejado da infraestrutura (quero esta rede, este servidor, este banco), e o Terraform cuida de criar, atualizar ou remover recursos pra que a realidade bata com o que você declarou. Essa abordagem declarativa (você diz o **quê**, não o passo a passo) é uma marca da IaC moderna.\n\nÉ um tema avançado, e faz mais sentido depois que você já criou recursos manualmente e entende o que são. Mas é uma das habilidades mais valorizadas em DevOps, porque é o que permite gerenciar infraestrutura grande de forma profissional, sem o caos do trabalho manual. Comece pequeno: usar o Terraform pra criar um único servidor já ensina o ciclo todo de declarar, aplicar e destruir infraestrutura por código.",
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
          id: "iac.config",
          title: "Gestão de configuração",
          description:
            "Automatizar a configuração do que roda dentro dos servidores.",
          optional: true,
          content:
            "A infraestrutura como código cria os servidores; a **gestão de configuração** cuida do que acontece **dentro** deles: instalar programas, ajustar configurações, criar usuários, garantir que cada máquina esteja no estado certo. São responsabilidades complementares, e juntas automatizam a preparação completa de um ambiente.\n\nFerramentas como o **Ansible** resolvem isso. Em vez de entrar em cada servidor e configurar na mão (lento, inconsistente e impossível de repetir em escala), você descreve em arquivos o estado desejado de cada máquina, e a ferramenta aplica essa configuração em quantos servidores forem necessários, de forma automatizada e padronizada.\n\nUm conceito importante aqui é a **idempotência**: aplicar a mesma configuração várias vezes leva sempre ao mesmo resultado, sem efeitos colaterais. Se o programa já está instalado, a ferramenta não tenta instalar de novo; ela só age no que precisa mudar pra alcançar o estado declarado. Isso torna seguro rodar a configuração repetidamente, o que é essencial pra automação confiável.\n\nO Ansible tem uma vantagem que o torna amigável pra começar: ele opera pelos servidores via SSH, sem exigir instalar nada de especial nas máquinas alvo, e suas configurações são escritas em YAML, um formato legível.\n\nNa prática moderna, há sobreposição e várias formas de combinar essas ferramentas, e em ambientes muito baseados em containers parte dessa configuração migra pro próprio Dockerfile. Por isso é um tema opcional nesta fase. Mas a ideia central permanece valiosa e muito DevOps: **configuração também é código**, versionada, automatizada e reproduzível, nunca ajustes manuais que ninguém registra.",
          resources: [
            {
              label: "Ansible: documentação oficial",
              url: "https://docs.ansible.com/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "orquestracao",
      title: "Orquestração",
      description:
        "Gerenciar muitos containers em produção, em escala, de forma automatizada.",
      level: "avancado",
      children: [
        {
          id: "orquestracao.kubernetes",
          title: "Kubernetes",
          description:
            "O orquestrador que gerencia containers em escala automaticamente.",
          content:
            "Rodar alguns containers numa máquina é simples. Mas rodar centenas, distribuídos em vários servidores, garantindo que continuem no ar, escalem conforme a demanda e se recuperem de falhas, é outra história. Esse é o problema da **orquestração**, e a ferramenta padrão da indústria pra resolvê-lo é o **Kubernetes**.\n\nO Kubernetes automatiza a gestão de containers em escala. Você declara o estado desejado (quero tantas cópias desta aplicação rodando), e ele cuida de manter isso: distribui os containers pelos servidores disponíveis, reinicia os que falham, substitui os que morrem, escala pra mais ou menos cópias conforme a carga, e gerencia a rede entre eles. É como um maestro que rege uma orquestra de containers, daí o nome orquestração.\n\nVale ser honesto: o Kubernetes é **poderoso e complexo**. Tem muitos conceitos próprios (pods, serviços, deployments e outros) e uma curva de aprendizado real. É, com folga, um dos temas mais avançados desta trilha, e tentar dominá-lo cedo demais costuma frustrar. Por isso ele aparece no fim, depois de você entender bem containers, que são a base sobre a qual o Kubernetes opera.\n\nUm conselho de ritmo importante: nem todo projeto precisa de Kubernetes. Muita aplicação roda perfeitamente bem com soluções mais simples (containers num servidor, Docker Compose, serviços gerenciados de nuvem). Usar Kubernetes onde ele não é necessário adiciona complexidade sem retorno. Aprenda o conceito e o básico (a documentação oficial tem um tutorial introdutório), entenda quando ele faz sentido (muitos containers, necessidade real de escala e resiliência), e aprofunde conforme sua carreira pedir. Saber que ele existe e o que resolve já é importante; dominá-lo é uma jornada à parte.",
          resources: [
            {
              label: "Kubernetes: conceitos básicos (oficial)",
              url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
              kind: "doc",
            },
            {
              label: "Kubernetes: visão geral (documentação oficial)",
              url: "https://kubernetes.io/docs/concepts/overview/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    // TODO(Ana): etapa nova (aprofundamento), revisar copy.
    {
      id: "custos",
      title: "Custos e FinOps",
      description:
        "Na nuvem, cada recurso tem preço e a conta cresce sozinha; entender e controlar custos virou parte do trabalho.",
      level: "avancado",
      children: [
        {
          id: "custos.nuvem",
          title: "Por que a conta da nuvem surpreende",
          description:
            "O modelo de pagar pelo uso é poderoso, mas fácil de estourar sem atenção.",
          content:
            "A nuvem cobra pelo que você usa: processamento, armazenamento, tráfego de dados, cada serviço tem seu preço. Esse modelo é ótimo porque você não paga por servidores parados, mas tem um lado traiçoeiro: a conta cresce sozinha conforme os recursos se acumulam, e é comum a fatura surpreender no fim do mês.\n\nOs vilões clássicos são recursos esquecidos ligados sem uso (uma máquina de teste que ninguém desligou), ambientes superdimensionados (capacidade muito maior que a necessária, paga integralmente), e o tráfego de dados, que muita gente ignora até ver o valor. Como subir recursos na nuvem é fácil e rápido, o desperdício se acumula sem ninguém perceber, até a conta chegar.\n\nPor isso, entender como cada serviço cobra e acompanhar os gastos deixou de ser assunto só do financeiro e virou parte do trabalho de quem cuida da infraestrutura. Saber ler a fatura da nuvem e ligar cada custo a um recurso concreto é o primeiro passo para não pagar caro pelo que não precisa.",
        },
        {
          id: "custos.finops",
          title: "FinOps: cultura de custo",
          description:
            "Tratar o custo da nuvem como responsabilidade contínua da equipe técnica, com visibilidade e otimização.",
          content:
            "**FinOps** é o nome que se dá à prática de gerenciar os custos da nuvem de forma colaborativa e contínua, aproximando as equipes técnicas das decisões financeiras. A ideia central é que quem cria os recursos (os times de engenharia) passe a enxergar e a se responsabilizar pelo custo do que sobe, em vez de o custo ser um problema distante de outra área.\n\nNa prática, isso envolve dar **visibilidade** (relatórios que mostram quanto cada time, projeto ou serviço gasta, para que ninguém decida no escuro), e agir sobre isso: desligar o que não é usado, ajustar recursos superdimensionados ao tamanho real, e aproveitar as opções de preço que as nuvens oferecem para uso previsível. Pequenas otimizações repetidas somam economias grandes.\n\nO ponto de cultura é o que sustenta tudo: custo eficiente não é cortar até doer, e sim gastar de forma consciente, entregando o mesmo valor por menos. Para o profissional de DevOps, desenvolver essa sensibilidade a custo é um diferencial concreto, porque liga a decisão técnica ao impacto no negócio, uma ponte que empresas valorizam cada vez mais.",
        },
      ],
    },
    {
      id: "observabilidade",
      title: "Observabilidade e carreira",
      description:
        "Enxergar o que acontece em produção e dar os primeiros passos rumo a uma vaga.",
      level: "avancado",
      children: [
        {
          id: "observabilidade.monitoramento",
          title: "Monitoramento e observabilidade",
          description:
            "Saber o que está acontecendo nos sistemas, idealmente antes dos usuários.",
          content:
            "Lembra do princípio de **medição** dos fundamentos? É aqui que ele vira prática. Com sistemas rodando em produção, você precisa saber, a qualquer momento, se está tudo funcionando, e descobrir problemas antes que o usuário reclame. Esse é o trabalho de monitoramento e observabilidade.\n\nTrês tipos de sinais formam a base. As **métricas** são números medidos ao longo do tempo: uso de CPU e memória, número de requisições, tempo de resposta, taxa de erros. Os **logs** são os registros do que os sistemas fazem, essenciais pra investigar o que aconteceu quando algo deu errado. E os **traces** (rastros) seguem uma requisição através de vários serviços, úteis em sistemas distribuídos pra achar onde o tempo se perde.\n\nNo ecossistema DevOps, uma dupla muito comum resolve boa parte disso: o **Prometheus**, que coleta e armazena métricas, e o **Grafana**, que as exibe em painéis visuais e gráficos. Juntos, eles dão um retrato em tempo real da saúde dos sistemas.\n\nMas observabilidade não é só coletar dados; é poder **fazer perguntas** sobre o sistema e obter respostas. E a peça que fecha o ciclo são os **alertas**: regras que avisam automaticamente quando algo foge do normal (um servidor sobrecarregado, a taxa de erros subindo, um serviço fora do ar), de preferência antes que vire um problema visível pro usuário.\n\nA mentalidade madura de operação é descobrir problemas pelos próprios alertas e painéis, não pela reclamação de quem usa. E vai além: cada incidente vira aprendizado pra melhorar o monitoramento e evitar a repetição, fechando o ciclo de melhoria contínua que define o DevOps.",
          resources: [
            {
              label: "Prometheus: visão geral (documentação oficial)",
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
          id: "observabilidade.carreira",
          title: "SRE e a carreira DevOps",
          description:
            "Caminhos de carreira e como entrar numa área avançada e disputada.",
          optional: true,
          content:
            "DevOps é uma área avançada e bem remunerada, e raramente é um primeiro emprego em tecnologia. Entender isso ajuda a traçar um caminho realista, sem frustração.\n\nO caminho mais comum é **chegar ao DevOps a partir de outra base**. Muita gente vem do desenvolvimento (backend, em geral) e migra trazendo o conhecimento de como o software é construído; outros vêm da administração de sistemas (sysadmin, infraestrutura) e trazem o conhecimento de como mantê-lo rodando. Os dois caminhos funcionam, porque DevOps justamente une esses dois mundos. Se você está começando do zero em tecnologia, considere construir primeiro uma base sólida em uma dessas áreas.\n\nVale conhecer alguns títulos vizinhos, porque a fronteira entre eles é fluida. O **SRE** (Site Reliability Engineering) é uma disciplina, originada no Google, focada em confiabilidade de sistemas com forte uso de engenharia e automação; compartilha muito com DevOps. O **engenheiro de plataforma** constrói as ferramentas e ambientes internos que facilitam a vida dos times de desenvolvimento. E há bastante sobreposição com **Cloud Engineer**. Não é preciso decidir agora; a base que esta trilha cobre serve a todos.\n\nPra se posicionar, aposte em **prática demonstrável**: um projeto pessoal containerizado com Docker, um pipeline de CI/CD funcionando, talvez um pouco de infraestrutura como código, tudo documentado no GitHub. Esse tipo de portfólio prova que você entende o ciclo na prática, não só na teoria.\n\nE cultive duas qualidades que definem a área: a mentalidade de **automação** (incomodar-se com o trabalho manual repetitivo e querer eliminá-lo) e o **aprendizado contínuo**, porque o ferramental do DevOps evolui rápido. Os princípios, porém, mudam devagar e sustentam tudo o que vier.",
        },
      ],
    },
  ],
};
