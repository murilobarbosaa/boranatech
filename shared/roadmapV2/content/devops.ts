// TODO(Ana): revisao editorial do upgrade da fase 3c, lote 4 (duas folhas
// novas de Kubernetes na secao Orquestracao, fecho do projeto elevado, fechos
// de criterio, conexoes nominais, blocos de codigo e resources novos).
// Enquadramento de papel: DevOps ENTREGA (encurtar o caminho do commit ate
// producao, automatizar o repetitivo, infra versionada).
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
            'DevOps é, antes de tudo, uma **cultura**: um jeito de trabalhar que une o desenvolvimento de software (dev) com as operações de TI (ops) pra entregar software com mais velocidade, qualidade e confiabilidade. O nome vem dessa junção, e entender que DevOps é cultura, não cargo nem ferramenta, é o primeiro passo pra não se perder na área.\n\nIsso surpreende quem chega esperando "aprender a ferramenta DevOps", porque ela não existe. DevOps é um conjunto de práticas e valores apoiados por **várias** ferramentas (Docker, pipelines, Terraform, Kubernetes e outras que você verá aqui). As ferramentas servem à cultura, não o contrário. Empresas que compram ferramentas achando que isso as torna "DevOps", sem mudar a forma de trabalhar, costumam se frustrar.\n\nO objetivo central é entregar valor ao usuário de forma **rápida e segura ao mesmo tempo**, dois objetivos que pareciam opostos. Historicamente, ir rápido significava arriscar quebrar; ser estável significava ir devagar. DevOps busca os dois juntos, através de automação e de uma colaboração mais próxima entre quem constrói e quem mantém.\n\nVale um aviso honesto sobre dificuldade: DevOps é uma área avançada (a própria descrição da carreira aponta isso), que faz mais sentido depois de alguma base em desenvolvimento ou administração de sistemas. Não é por acaso o primeiro emprego de muita gente. Mas é uma das áreas de maior demanda e melhor remuneração em tecnologia, e esta trilha te dá o mapa, começando pelos fundamentos que sustentam tudo o resto.',
        },
        {
          id: "fundamentos.problema",
          title: "O muro entre dev e ops",
          description: "O problema histórico que fez o DevOps nascer.",
          content:
            'Pra entender por que DevOps existe, vale conhecer o problema que ele veio resolver. Tradicionalmente, dois times tinham objetivos em conflito. O time de **desenvolvimento** queria entregar mudanças e novidades rápido, porque é disso que vive o produto. O time de **operações** queria estabilidade, porque é responsabilizado quando algo cai, e toda mudança é um risco. O resultado era um conflito estrutural: dev empurrando mudanças, ops freando pra proteger.\n\nEsse conflito ficou conhecido como o **muro da confusão**: o desenvolvedor "jogava" o software por cima do muro pra operação colocar no ar, e quando dava problema, cada lado culpava o outro. O dev dizia "na minha máquina funcionava"; o ops dizia "o código de vocês quebrou". Ninguém era dono do problema inteiro, e o usuário sofria com lentidão e instabilidade.\n\nDevOps derruba esse muro. A ideia é que dev e ops compartilhem a **responsabilidade** pelo ciclo completo, do código até o software rodando em produção. Quem constrói também se importa com como aquilo roda no mundo real; quem opera participa mais cedo, ajudando a construir algo operável. A responsabilidade deixa de ser "de quem joga" e "de quem recebe", e passa a ser de todos.\n\nEssa mudança de mentalidade é a essência cultural do DevOps, e as práticas técnicas que você vai aprender (containers, pipelines, automação) são as ferramentas que tornam essa colaboração possível na prática. Sem a mudança de cultura, as ferramentas sozinhas não resolvem o conflito.',
        },
        {
          id: "fundamentos.pilares",
          title: "Cultura, automação e medição",
          description: "Os princípios que orientam toda prática de DevOps.",
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
            "A base técnica número um de DevOps é o **Linux**. A imensa maioria dos servidores roda Linux, assim como containers, ferramentas de automação e a nuvem em geral. Não dá pra trabalhar com infraestrutura sem se sentir em casa no terminal Linux, então este é o ponto de partida inegociável.\n\nVocê precisa de fluência na linha de comando: navegar por pastas, manipular arquivos, ver e gerenciar processos, checar logs, entender permissões de usuários e arquivos (quem pode fazer o quê), e usar o acesso remoto seguro (SSH) pra administrar servidores que não têm tela. Esses servidores sem interface gráfica são a norma, e o terminal é a sua única janela pra eles.\n\nLogo em seguida vem o **scripting**, a porta de entrada da automação. Saber escrever scripts em **Bash** (a linguagem do terminal Linux) permite automatizar tarefas repetitivas: encadear comandos, fazer um backup, preparar um ambiente, processar arquivos em lote. Muitos profissionais de DevOps também usam **Python** pra automações mais complexas. A mentalidade central já aparece aqui: se você faz algo manualmente mais de uma vez, pergunte se não vale automatizar.\n\nNão tente decorar centenas de comandos. Instale o Linux numa máquina virtual ou use uma instância na nuvem, e o use de verdade pra tarefas reais. A fluência cresce com a prática, e ela é o alicerce sobre o qual todo o resto da trilha se apoia: containers, pipelines e automação são, no fundo, formas estruturadas de comandar sistemas Linux. Você domina este passo quando, ao pegar uma tarefa repetitiva no terminal, seu reflexo é escrever um script de Bash em vez de repeti-la à mão.",
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
            "O **Git** é o sistema de controle de versão universal em tecnologia, e em DevOps ele tem um papel ainda mais central: é o ponto de partida de quase toda automação. Pipelines de entrega disparam a partir de mudanças no Git; a própria infraestrutura é versionada no Git. Dominar o Git bem, além do básico, é essencial aqui.\n\nVocê precisa do ciclo fundamental (`add`, `commit`, `push`) e, principalmente, do trabalho com **branches** (ramificações): criar uma linha de trabalho separada pra uma mudança, sem afetar a versão principal, e depois integrá-la de volta. Some a isso o fluxo de **pull request** (ou merge request), o mecanismo pelo qual mudanças são propostas, revisadas e aprovadas antes de entrar na base principal. Esse fluxo de revisão é onde a qualidade e a colaboração acontecem.\n\nEm DevOps, dois conceitos elevam o papel do Git. O primeiro é que o Git vira o **gatilho** dos pipelines: a cada push ou pull request, verificações e entregas automáticas disparam, como o passo O que é CI/CD detalha. O segundo, mais avançado, é a ideia de que **tudo vira código versionado**: não só a aplicação, mas a infraestrutura e as configurações também ficam no Git, o que dá histórico, revisão e reprodutibilidade pra tudo.\n\nSe você já usa Git no básico, o salto aqui é dominar branches, pull requests e a disciplina de bons commits. É um conhecimento que se paga em cada etapa seguinte, porque o Git é o fio condutor que liga código, automação e infraestrutura no mundo DevOps.",
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
            'Os **containers** são uma das tecnologias mais importantes de toda a área, e o **Docker** é a ferramenta que os popularizou. Um container empacota uma aplicação junto com tudo que ela precisa pra rodar (a linguagem na versão certa, as dependências, as configurações) num pacote isolado que se comporta igual em qualquer lugar: na sua máquina, na do colega e no servidor.\n\nIsso resolve, de uma vez, o clássico "na minha máquina funciona", justamente o atrito entre dev e ops que vimos nos fundamentos. Se a aplicação roda dentro de um container, ela roda igual em todo lugar, porque carrega o próprio ambiente consigo.\n\nAs três peças centrais a entender são simples. O **Dockerfile** é a receita: um arquivo de texto que descreve como construir a imagem (parta desta base, copie o código, instale as dependências, rode este comando):\n\n```dockerfile\nFROM node:20\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["node", "app.js"]\n```\n\nA **imagem** é o pacote pronto e imutável, gerado a partir da receita. E o **container** é a imagem em execução, um processo isolado rodando. Você constrói uma imagem a partir do Dockerfile e executa quantos containers quiser a partir dela.\n\nPra DevOps, o Docker é fundamental por dois motivos. Ele padroniza a unidade de software (tudo vira container, do banco à aplicação), o que simplifica enormemente o deploy e a automação. E é a base sobre a qual se constroem a orquestração (o passo Kubernetes) e boa parte dos pipelines modernos. Você domina este passo quando pega uma aplicação sua, escreve o Dockerfile, constrói a imagem e a roda igual em qualquer máquina, sem o clássico "na minha máquina funcionava". Escrever um Dockerfile, construir a imagem e rodar o container é o exercício que destrava o resto.',
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
            'Depois de construir uma imagem Docker, surge a pergunta: como levá-la da sua máquina pro servidor que vai executá-la? A resposta são os **registries** (registros de imagens), que funcionam como repositórios de imagens de container, parecidos com o que o GitHub é pra código.\n\nO fluxo é direto. Você constrói a imagem localmente, faz um **push** dela pro registry, e o servidor (ou o Kubernetes, ou o pipeline) faz um **pull** pra baixá-la e executar. Assim a mesma imagem, idêntica, viaja do desenvolvimento até a produção, garantindo que o que você testou é exatamente o que vai rodar. O registry público mais conhecido é o Docker Hub, e os provedores de nuvem oferecem registries privados pra imagens da empresa.\n\nDois conceitos ajudam no dia a dia. As **tags** identificam versões de uma imagem (como uma versão específica ou a "mais recente"), permitindo controlar exatamente qual versão roda onde. E o cuidado com o **tamanho** da imagem: imagens menores sobem e descem mais rápido e têm menos potencial de problemas, então boas práticas de Dockerfile (partir de imagens base enxutas, não incluir o que não precisa) importam.\n\nÉ um tema mais operacional, por isso opcional nesta fase, mas entender o papel do registry fecha o ciclo do container: você aprende a construir a imagem, a rodá-la e, agora, a distribuí-la. Esse ciclo completo (build, push, pull, run) é a espinha dorsal de como o software containerizado se move pela esteira de entrega, e os pipelines de CI/CD da próxima seção automatizam exatamente isso.',
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
          description: "Automatizar o caminho do código até a produção.",
          content:
            '**CI/CD** é provavelmente a prática mais emblemática do DevOps, a que mais materializa o princípio da automação. A sigla junta duas ideias complementares que, juntas, automatizam o caminho do código até o usuário.\n\nA **integração contínua** (CI) cuida da primeira parte. A cada mudança que um desenvolvedor envia ao repositório, um serviço automaticamente baixa o código num ambiente limpo e roda verificações: constrói o software, executa os testes, faz checagens de qualidade. Se algo falha, a mudança é sinalizada na hora, antes de causar problema. Isso evita o pesadelo clássico de integrar o trabalho de várias pessoas só no fim e descobrir uma montanha de conflitos e bugs de uma vez.\n\nA **entrega/implantação contínua** (CD) cuida de levar o código aprovado adiante de forma automatizada: prepará-lo pra produção e, em muitos casos, publicá-lo automaticamente. A diferença entre os dois "D" é sutil: entrega contínua deixa tudo pronto pra publicar com um clique; implantação contínua publica sozinha, sem intervenção, quando passa em todas as verificações.\n\nO conjunto forma um **pipeline**: uma esteira automatizada por onde cada mudança passa, do commit até a produção, com etapas de construção, teste e deploy. O efeito é transformador: entregas que eram raras, manuais e arriscadas viram frequentes, automáticas e seguras, porque o processo é sempre o mesmo e o que quebra é pego cedo.\n\nUma ferramenta muito comum e acessível pra montar pipelines é o **GitHub Actions**, integrado ao repositório, mas o conceito vale pra qualquer uma (Jenkins, GitLab CI e outras). O próximo passo é construir um pipeline na prática.',
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
            "Olhe pra trás um instante: você entrou nesta trilha entendendo o muro entre dev e ops, e agora tem o Git como gatilho, os containers como unidade de entrega e a automação como princípio. Construir um pipeline de CI/CD é onde tudo isso vira uma esteira real, e é o que melhor demonstra a essência do DevOps num portfólio.\n\nA encomenda é o pipeline do projeto abaixo: pegue um repositório seu no GitHub e monte, no GitHub Actions, uma esteira que a cada push baixa o código, roda os testes e, se tudo passa, constrói a imagem Docker e faz o deploy. Um job de workflow declarado em YAML, versionado junto com o código:\n\n```yaml\non: push\njobs:\n  ci:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test\n```\n\nComece pequeno (só os testes já é um CI funcional) e evolua etapa por etapa: build da imagem, depois o deploy. Cada etapa automatizada é uma vitória concreta e visível.\n\nO critério de chegada é objetivo: o pipeline verde no repositório, disparando sozinho a cada push, o histórico de execuções contando a história, e você explicando o que cada etapa faz e por que ela barra o código quebrado antes da produção. É este pipeline que prova, mais alto que qualquer certificado, que você entende o ciclo de entrega. As seções seguintes (infraestrutura como código, Kubernetes, observabilidade) constroem por cima desta base.",
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
            "Rodar alguns containers numa máquina é simples. Mas rodar centenas, distribuídos em vários servidores, garantindo que continuem no ar, escalem conforme a demanda e se recuperem de falhas, é outra história. Esse é o problema da **orquestração**, e a ferramenta padrão da indústria pra resolvê-lo é o **Kubernetes**.\n\nO Kubernetes automatiza a gestão de containers em escala. Você declara o estado desejado (quero tantas cópias desta aplicação rodando), e ele cuida de manter isso: distribui os containers pelos servidores disponíveis, reinicia os que falham, substitui os que morrem, escala pra mais ou menos cópias conforme a carga, e gerencia a rede entre eles. É como um maestro que rege uma orquestra de containers, daí o nome orquestração.\n\nVale ser honesto: o Kubernetes é **poderoso e complexo**. Tem muitos conceitos próprios (pods, serviços, deployments e outros) e uma curva de aprendizado real. É, com folga, um dos temas mais avançados desta trilha, e tentar dominá-lo cedo demais costuma frustrar. Por isso ele aparece no fim, depois de você entender bem containers, que são a base sobre a qual o Kubernetes opera.\n\nUm conselho de ritmo importante: nem todo projeto precisa de Kubernetes. Muita aplicação roda perfeitamente bem com soluções mais simples (containers num servidor, Docker Compose, serviços gerenciados de nuvem). Usar Kubernetes onde ele não é necessário adiciona complexidade sem retorno. Aprenda o conceito e o básico, entenda quando ele faz sentido (muitos containers, necessidade real de escala e resiliência), e aprofunde conforme sua carreira pedir. Os passos seguintes, Pods, deployments e services e kubectl e quando usar Kubernetes, dão o modelo mental concreto e o critério honesto de quando adotá-lo; dominá-lo por completo é uma jornada à parte.",
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
        {
          id: "orquestracao.objetos",
          title: "Pods, deployments e services",
          description:
            "Os três objetos básicos do Kubernetes e a ideia de estado desejado que os move.",
          content:
            "O Kubernetes tem vocabulário próprio, e três objetos formam o mapa básico. O **pod** é a menor unidade: um ou mais containers que rodam juntos, compartilhando rede e armazenamento. Na prática, quase sempre um pod é um container da sua aplicação. Pods são descartáveis: morrem e nascem o tempo todo, e você nunca cuida de um pod na mão.\n\nQuem cuida deles é o **deployment**. Você declara nele quantas cópias (réplicas) da aplicação quer no ar e qual imagem usar, e o Kubernetes cria e mantém esses pods. Pediu 3 réplicas e uma morreu? O deployment sobe outra pra voltar a 3. É aqui que mora a autocura.\n\nMas pods trocam de endereço a cada vez que nascem, então ninguém pode depender do IP de um pod. O **service** resolve isso: um endereço estável e único que distribui o tráfego entre os pods vivos daquele deployment, sem você saber quais são.\n\nA ideia que une tudo é a mais importante do Kubernetes: você declara o **estado desejado** (quero 3 réplicas desta imagem, expostas neste service), e o cluster trabalha sem parar pra fazer a realidade bater com o que você pediu. Você não dá ordens passo a passo; descreve o destino, e o Kubernetes persegue. Esse estado vive num arquivo (manifesto YAML), versionado no Git:\n\n```yaml\nkind: Deployment\nspec:\n  replicas: 3\n  template:\n    spec:\n      containers:\n        - image: minha-app:1.0\n```\n\nVocê domina este passo quando lê um manifesto e diz o que o cluster vai manter no ar.",
          resources: [
            {
              label: "Kubernetes: deployments (documentação oficial)",
              url: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/",
              kind: "doc",
            },
            {
              label: "Kubernetes: services (documentação oficial)",
              url: "https://kubernetes.io/docs/concepts/services-networking/service/",
              kind: "doc",
            },
          ],
        },
        {
          id: "orquestracao.pratica",
          title: "kubectl e quando usar Kubernetes",
          description:
            "A ferramenta do dia a dia e a decisão honesta de quando o Kubernetes vale a pena.",
          content:
            "Com os objetos no lugar, o dia a dia com o Kubernetes passa por uma ferramenta: o **kubectl**, o comando pra conversar com o cluster. Com ele você vê o que está rodando (`kubectl get pods`), investiga um problema (`kubectl describe` pra detalhes, `kubectl logs` pra ver a saída de um pod) e aplica um manifesto (`kubectl apply`). Diagnosticar no Kubernetes é, em boa parte, saber fazer as perguntas certas com o kubectl.\n\nMas a decisão mais importante vem antes de qualquer comando: **você precisa mesmo de Kubernetes?** Ele resolve um problema real (rodar muitos containers, em vários servidores, com escala e autocura) e cobra por isso um preço alto em complexidade. Para um projeto pequeno, um site ou uma API com pouco tráfego, Kubernetes é canhão pra matar mosca: um container num servidor, o Docker Compose ou um serviço gerenciado de nuvem resolvem com muito menos dor. Usar Kubernetes por moda, onde ele não é necessário, é um erro caro e comum.\n\nQuando ele faz sentido, ainda há uma escolha: **gerenciado ou autogerenciado**. Montar e manter um cluster do zero é um trabalho enorme e especializado. Por isso, quase todo mundo usa um Kubernetes **gerenciado** na nuvem: o provedor cuida do miolo do cluster, você cuida das suas aplicações. Autogerenciar só compensa em casos específicos, com equipe dedicada pra isso.\n\nVocê domina este passo quando, diante de um projeto, decide com honestidade se ele pede Kubernetes ou se uma solução mais simples serve melhor.",
          resources: [
            {
              label: "Kubernetes: kubectl (documentação oficial)",
              url: "https://kubernetes.io/docs/reference/kubectl/",
              kind: "doc",
            },
          ],
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
