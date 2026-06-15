import type { RoadmapV2 } from "../types";

export const infraestrutura: RoadmapV2 = {
  slug: "infraestrutura",
  area: "infraestrutura",
  title: "Suporte e Infraestrutura do Zero",
  level: "Iniciante",
  description:
    "De hardware e sistemas operacionais a redes, servidores e atendimento: a porta de entrada mais acessível da TI. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que faz a área de suporte e infraestrutura, e por que ela é a melhor porta de entrada da TI.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é suporte e infraestrutura",
          description:
            "Manter funcionando tudo que faz a TI de uma empresa rodar no dia a dia.",
          content:
            "Suporte e infraestrutura é a área que cuida de tudo que faz a tecnologia de uma empresa funcionar no dia a dia: os computadores, os servidores, as redes, o Wi-Fi, as impressoras, os acessos. Quando alguém não consegue entrar no sistema, a internet cai ou um equipamento para, é essa área que resolve. É o alicerce invisível sobre o qual todo o resto da empresa trabalha.\n\nNa prática, o trabalho é variado e prático. Atender chamados e resolver problemas das pessoas, instalar e configurar equipamentos e sistemas, administrar a rede e os acessos, monitorar servidores, e manter tudo documentado e organizado. É uma rotina que mistura resolver problemas técnicos com atender pessoas, e que dá uma visão ampla de como toda a TI se conecta.\n\nO perfil que combina com a área: alguém que gosta de resolver problemas práticos, tem paciência pra atender pessoas e curiosidade pra entender como máquinas e redes funcionam por dentro. Não exige programação avançada nem matemática pesada; exige método, disposição pra aprender e jeito com gente.\n\nUm ponto que torna essa área especialmente atraente, e que a próxima parte aprofunda: ela é uma das **portas de entrada mais acessíveis** da tecnologia. A barreira pra começar é baixa, o tempo até a primeira vaga costuma ser curto, e o que você aprende aqui é a base de praticamente todas as outras áreas de infraestrutura. Esta trilha cobre o caminho do hardware às redes e servidores, sempre com o pé no chão de quem quer entrar logo no mercado.",
        },
        {
          id: "fundamentos.porta",
          title: "A porta de entrada da TI",
          description:
            "Por que o suporte é um ótimo trampolim para outras áreas de tecnologia.",
          content:
            "Há algo que torna o suporte e a infraestrutura uma escolha estratégica pra quem está começando: ela é, ao mesmo tempo, uma **carreira completa** e um **trampolim** pra várias outras áreas. Entender isso ajuda a aproveitá-la ao máximo.\n\nComo porta de entrada, ela tem vantagens concretas. A **barreira é baixa**: você não precisa de anos de estudo nem de saber programar pra conseguir a primeira vaga, e o tempo até empregar costuma ser curto. E ela dá uma **visão ampla**: trabalhando no suporte, você vê de perto como redes, servidores, sistemas e segurança se conectam no mundo real, algo que nenhum curso ensina tão bem quanto a prática diária.\n\nEssa visão ampla é o que faz dela um trampolim. Quem entra no suporte descobre, com a experiência, o que mais gosta, e tem caminhos naturais de evolução: pra **redes** (aprofundando em infraestrutura de rede), pra **cloud** (a infraestrutura moderna na nuvem), pra **DevOps** e **SRE** (automação e operação em escala), ou pra **cibersegurança** (proteção dos sistemas). Todas essas áreas se beneficiam enormemente da base prática que o suporte dá.\n\nVale uma expectativa honesta sobre o lado financeiro: o salário inicial no suporte costuma ser mais baixo que o de desenvolvimento. Mas a barreira de entrada também é menor, e a área abre caminho pra posições mais bem pagas conforme você se especializa. A recomendação clássica é usar o suporte como base de aprendizado e como ponto de partida, aproveitando pra ver tudo de perto e descobrir a direção que mais combina com você.",
          resources: [
            {
              label: "Google IT Support (Coursera, audit gratuito)",
              url: "https://www.coursera.org/professional-certificates/google-it-support",
              kind: "curso",
            },
          ],
        },
      ],
    },
    {
      id: "hardware",
      title: "Hardware",
      description:
        "Conhecer as peças por dentro do computador e saber montar e manter máquinas.",
      level: "iniciante",
      children: [
        {
          id: "hardware.componentes",
          title: "Hardware e componentes",
          description:
            "As peças que formam um computador e o que cada uma faz.",
          content:
            "Antes de tudo, vale conhecer o computador por dentro. Saber identificar e entender o papel de cada **componente** é a base do trabalho de suporte, porque boa parte dos problemas (lentidão, travamentos, falhas) tem origem no hardware.\n\nOs componentes principais e suas funções. O **processador** (CPU) é o cérebro, que executa as operações. A **memória RAM** é a memória de trabalho temporária, onde ficam os programas em uso; pouca RAM deixa tudo lento. O **armazenamento** guarda os dados de forma permanente, e aqui vale conhecer a diferença entre o HD tradicional (mais barato, mais lento) e o **SSD** (bem mais rápido, hoje o padrão), porque trocar um HD por SSD é uma das melhorias de performance mais comuns que um técnico faz. A **placa-mãe** conecta tudo, e a **fonte** alimenta o sistema com energia.\n\nVocê também precisa entender os **periféricos e conexões**: monitores, teclados, as portas (USB e outras), e como tudo se liga. Parece básico, mas é o que permite diagnosticar quando algo não funciona: é o cabo? a porta? o componente?\n\nUm conhecimento prático valioso é saber relacionar **sintoma e causa**: um computador que não liga, uma tela preta, lentidão extrema, cada um aponta pra possíveis culpados no hardware. Com o tempo, você desenvolve a intuição de por onde começar a investigar.\n\nNão precisa decorar especificações técnicas; precisa entender o que cada peça faz e como elas trabalham juntas. Essa base te permite diagnosticar problemas, recomendar melhorias e conversar com fornecedores, e prepara o terreno pra a montagem e manutenção, próximo passo.",
        },
        {
          id: "hardware.montagem",
          title: "Montagem e manutenção",
          description:
            "Colocar a mão na massa montando, trocando peças e mantendo máquinas.",
          content:
            "Conhecer as peças é o primeiro passo; saber **montar e manter** computadores é o que torna o conhecimento prático. Essa é uma habilidade muito valorizada no suporte, e felizmente é das mais fáceis de aprender na prática.\n\nA **montagem** é encaixar os componentes corretamente: instalar o processador e a memória na placa-mãe, conectar o armazenamento, ligar a fonte, organizar os cabos. Cada peça tem seu lugar e seu jeito de encaixar, e a prática ensina rápido. Um cuidado importante que todo técnico aprende cedo: a **eletricidade estática** pode danificar componentes, então há precauções simples ao manuseá-los, como evitar tocar nos contatos e descarregar a estática antes.\n\nA **manutenção** é o trabalho contínuo de manter as máquinas saudáveis. Inclui a parte física (limpeza interna, porque poeira acumulada causa superaquecimento, e troca de peças que falham ou ficam obsoletas) e a parte lógica (instalar e atualizar sistemas, remover o que atrapalha, otimizar o desempenho). Uma troca comum e de grande impacto, como mencionado, é substituir um HD por SSD pra dar sobrevida a uma máquina lenta.\n\nUm hábito profissional desde já: **diagnosticar antes de trocar**. Trocar peças no chute é caro e nem sempre resolve; o bom técnico investiga o sintoma, isola a causa, e só então age. Testar trocando uma peça por uma que você sabe que funciona é uma técnica clássica de diagnóstico.\n\nA melhor forma de aprender isso é fazendo: monte ou desmonte uma máquina (sua ou de laboratório), com cuidado e curiosidade. A confiança com hardware vem das mãos, não dos livros.",
        },
      ],
    },
    {
      id: "sistemas",
      title: "Sistemas operacionais",
      description:
        "Dominar os dois sistemas que você mais vai encontrar: Windows e Linux.",
      level: "iniciante",
      children: [
        {
          id: "sistemas.windows",
          title: "Windows",
          description:
            "O sistema mais comum nas empresas, que todo técnico precisa dominar.",
          content:
            "O **Windows** é, de longe, o sistema operacional mais usado nos computadores das empresas, então dominá-lo a fundo é essencial pra quem trabalha com suporte. Você não precisa só saber usá-lo como um usuário comum; precisa saber **administrá-lo** e resolver seus problemas.\n\nO que vale dominar. A **instalação e configuração** do sistema do zero, incluindo a preparação de máquinas novas. A gestão de **usuários e permissões** locais (quem pode acessar o quê na máquina). A instalação e o gerenciamento de **programas e drivers** (os softwares que fazem o hardware funcionar; driver desatualizado ou errado é causa comum de problema). E as ferramentas internas de **diagnóstico**, como o gerenciador de tarefas (pra ver o que está consumindo recursos), o visualizador de eventos (os logs do Windows, que registram erros) e as ferramentas de rede pela linha de comando.\n\nUm tema central no ambiente corporativo é entender como o Windows se conecta à **rede da empresa** e ao gerenciamento centralizado, que mais adiante se liga ao Active Directory. Em empresas, as máquinas Windows não são ilhas; elas fazem parte de um domínio gerenciado, e o técnico precisa entender essa estrutura.\n\nResolver problemas de Windows é boa parte do dia a dia do suporte: aquele computador lento, o programa que não abre, a impressora que sumiu, o usuário que não consegue logar. Com a prática, você cria um repertório de diagnósticos e soluções. A documentação oficial da Microsoft é uma referência completa, e a melhor forma de aprender é mexendo: explore as configurações, as ferramentas administrativas e os logs de uma máquina Windows.",
          resources: [
            {
              label: "Microsoft: documentação do Windows (oficial)",
              url: "https://learn.microsoft.com/en-us/windows/",
              kind: "doc",
            },
          ],
        },
        {
          id: "sistemas.linux",
          title: "Linux",
          description:
            "O sistema que domina os servidores, e um diferencial na carreira.",
          content:
            "Se o Windows domina os computadores das pessoas, o **Linux** domina os **servidores**. A maior parte da infraestrutura que sustenta a internet e as empresas roda em Linux, então conhecer ao menos o básico dele é um grande diferencial no suporte e praticamente obrigatório pra evoluir pra redes, cloud, DevOps ou segurança.\n\nO contato inicial pode assustar quem só usou Windows, porque o Linux costuma ser operado pela **linha de comando**, o terminal, em vez de janelas. Mas é justamente isso que o torna poderoso pra servidores: é rápido, preciso e funciona em máquinas sem tela, que é o caso da maioria dos servidores. O básico cabe em poucos comandos: navegar entre pastas, listar e manipular arquivos, ver processos, checar logs, e o conceito de **permissões** (quem pode ler, escrever ou executar cada coisa), que é central no Linux.\n\nPra o suporte e a infraestrutura, alguns pontos valem atenção. Entender o sistema de **arquivos e diretórios** do Linux, que é organizado de forma diferente do Windows. Gerenciar **usuários e permissões**. Instalar programas pelos gerenciadores de pacotes. E conhecer o **acesso remoto** via SSH, que é como você administra um servidor Linux a partir do seu computador.\n\nUma forma segura e gratuita de praticar é instalar o Linux numa **máquina virtual** (assunto que volta na virtualização), onde você experimenta sem risco pra sua máquina principal. Comece com uma distribuição amigável, use o terminal pra tarefas reais, e deixe a fluência crescer. Mesmo um conhecimento intermediário de Linux já abre muitas portas, e é o que separa quem fica no suporte básico de quem evolui pra infraestrutura.",
          resources: [
            {
              label: "Ubuntu: linha de comando pra iniciantes",
              url: "https://ubuntu.com/tutorials/command-line-for-beginners",
              kind: "artigo",
            },
          ],
        },
      ],
    },
    {
      id: "redes",
      title: "Redes",
      description:
        "Como os computadores conversam entre si, o coração técnico da infraestrutura.",
      level: "intermediario",
      children: [
        {
          id: "redes.fundamentos",
          title: "Fundamentos de redes",
          description:
            "Como os dados viajam e como cada máquina é endereçada.",
          content:
            "**Redes** são o coração técnico da infraestrutura, e dominá-las é o que mais distingue um profissional de suporte que cresce de um que estaciona. Quase todo problema de TI passa, em algum momento, pela rede.\n\nO conceito mais fundamental é o **endereço IP**: cada dispositivo numa rede tem um endereço, como um endereço postal, que permite que os dados saibam de onde vêm e pra onde vão. Você precisa entender a diferença entre endereços **privados** (usados dentro da rede local da empresa ou de casa) e **públicos** (na internet), e noções de como uma rede é dividida em faixas de endereços (as sub-redes), porque configurar e diagnosticar redes depende disso.\n\nA base de tudo é o conjunto de protocolos **TCP/IP**, as regras que governam a comunicação na internet e nas redes locais. Você não precisa decorar a teoria toda, mas entender como os dados são divididos em **pacotes** e trafegam de uma máquina a outra é essencial pra diagnosticar problemas.\n\nNa prática do suporte, isso vira ferramentas de diagnóstico que você usa todo dia: comandos pra testar se uma máquina está acessível (como o ping), pra ver a configuração de rede de um computador, e pra rastrear o caminho que os dados percorrem. Quando alguém diz \"a internet não funciona\", é com essas ferramentas que você descobre se o problema é o cabo, a configuração, o roteador ou o provedor.\n\nOs cursos gratuitos da Cisco, líder mundial em equipamentos de rede, são uma referência excelente pra aprender redes do zero, e o conhecimento de redes é a ponte pras certificações e pra evolução de carreira que a trilha aborda no fim.",
          resources: [
            {
              label: "Cisco Networking Academy: cursos de redes",
              url: "https://www.netacad.com/courses/networking",
              kind: "curso",
            },
            {
              label: "MDN: protocolo HTTP",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP",
              kind: "doc",
            },
          ],
        },
        {
          id: "redes.servicos",
          title: "DNS, DHCP e Wi-Fi",
          description:
            "Os serviços de rede que fazem tudo funcionar nos bastidores.",
          content:
            "Sobre os fundamentos de rede, alguns **serviços** fazem a mágica acontecer nos bastidores, e entender o que cada um faz é essencial pro suporte, porque quando eles falham, \"a rede para\".\n\nO **DNS** (Sistema de Nomes de Domínio) é a agenda telefônica da internet: ele traduz nomes que as pessoas usam (como um endereço de site) nos endereços IP que as máquinas entendem. Quando você digita um site e ele não abre, mas o ping pro IP funciona, o problema é quase sempre de DNS. É um dos diagnósticos mais comuns e úteis.\n\nO **DHCP** (Protocolo de Configuração Dinâmica) é quem distribui os endereços IP automaticamente pros dispositivos quando eles se conectam à rede. Sem ele, alguém teria que configurar o IP de cada máquina na mão. Entender o DHCP explica por que um dispositivo \"pega\" um endereço ao conectar, e ajuda a diagnosticar quando uma máquina não consegue se conectar à rede.\n\nO **Wi-Fi** é a rede sem fio, onipresente e fonte constante de chamados no suporte. Você precisa entender o básico de como configurar e proteger uma rede sem fio (senhas, padrões de segurança), os canais e a interferência (por que o Wi-Fi fica lento em certos lugares), e os problemas comuns de conexão.\n\nJuntos, IP, DNS, DHCP e Wi-Fi formam o repertório de rede do dia a dia do suporte. Boa parte dos chamados de \"está sem internet\" se resolve entendendo qual dessas peças falhou. A documentação da Microsoft sobre serviços de rede em servidores é uma boa referência pra aprofundar no DNS e no DHCP, que costumam ser administrados em servidores Windows nas empresas.",
          resources: [
            {
              label: "Microsoft: DNS no Windows Server (oficial)",
              url: "https://learn.microsoft.com/en-us/windows-server/networking/dns/dns-top",
              kind: "doc",
            },
          ],
        },
        {
          id: "redes.equipamentos",
          title: "Equipamentos de rede",
          description:
            "Os aparelhos físicos que conectam e organizam uma rede.",
          content:
            "Além dos conceitos e serviços, a rede tem uma parte **física**: os equipamentos que conectam tudo. Conhecê-los é parte do trabalho de infraestrutura, especialmente em empresas com redes de verdade.\n\nOs principais. O **switch** é o equipamento que conecta os dispositivos dentro de uma mesma rede local, encaminhando os dados pra a máquina certa; pense nele como o organizador do trânsito interno da rede. O **roteador** conecta redes diferentes e liga a rede local à internet, decidindo por onde os dados saem e entram; é o portão da rede pro mundo. O **ponto de acesso** (access point) é o que fornece o Wi-Fi, conectando os dispositivos sem fio à rede cabeada.\n\nVocê também precisa entender o **cabeamento**: os cabos de rede que conectam fisicamente os equipamentos, seus tipos e a importância de uma instalação organizada (um rack de rede bagunçado é fonte de problemas difíceis de rastrear). E noções de como esses equipamentos são **configurados**, porque um switch ou roteador corporativo tem configurações que vão muito além do roteador doméstico.\n\nNa prática, o profissional de infraestrutura instala, configura e mantém esses equipamentos, diagnostica quando um deles falha (uma porta de switch com defeito, um roteador travado) e planeja como a rede é organizada fisicamente. Aprofundar em configuração de equipamentos de rede, especialmente os da Cisco, líder do setor, é um caminho natural de especialização rumo à área de redes, e o tema das certificações como a CCNA, que a trilha aborda mais adiante.\n\nUm ótimo exercício prático é montar uma pequena rede, em casa ou num laboratório, conectando alguns dispositivos e configurando o acesso. Ver os dados fluírem na prática fixa a teoria como nada mais.",
        },
      ],
    },
    {
      id: "servidores",
      title: "Servidores e usuários",
      description:
        "Administrar os servidores e o gerenciamento centralizado de usuários e acessos da empresa.",
      level: "intermediario",
      children: [
        {
          id: "servidores.servidores",
          title: "Servidores",
          description:
            "As máquinas que oferecem serviços para toda a empresa.",
          content:
            "Um **servidor** é um computador, geralmente mais potente e ligado o tempo todo, que oferece serviços pra outras máquinas da rede. Enquanto o computador de uma pessoa serve a ela, o servidor serve a muitos: guarda os arquivos da empresa, hospeda sistemas, controla os acessos, distribui a internet. Administrar servidores é uma parte central da infraestrutura.\n\nExistem servidores pra várias funções. O **servidor de arquivos** centraliza os documentos da empresa, pra que as pessoas compartilhem e acessem de qualquer máquina, com controle de quem vê o quê. O **servidor de impressão** gerencia as impressoras. Servidores de **aplicações** hospedam os sistemas internos. E há os que rodam serviços de rede como o DNS e o DHCP que você viu, frequentemente em servidores Windows nas empresas.\n\nO trabalho com servidores envolve instalá-los e configurá-los, **monitorar** se estão saudáveis e respondendo (porque um servidor fora do ar afeta muita gente de uma vez), gerenciar os serviços que rodam neles, e cuidar de **backups**, porque os dados de um servidor costumam ser críticos pra empresa.\n\nUm conceito importante é que servidores rodam tanto **Windows Server** (uma versão do Windows feita pra servidores, comum em ambientes corporativos) quanto **Linux** (dominante na web e em serviços de internet). Por isso conhecer os dois sistemas, como a trilha cobriu, é tão valioso.\n\nUm bom projeto de aprendizado é configurar um **servidor de arquivos em Linux** numa máquina ou máquina virtual: você exercita Linux, rede, permissões e a lógica de servir recursos pra a rede, tudo de uma vez. A documentação oficial do Windows Server é uma referência sólida pra o lado corporativo.",
          resources: [
            {
              label: "Microsoft: documentação do Windows Server (oficial)",
              url: "https://learn.microsoft.com/en-us/windows-server/",
              kind: "doc",
            },
          ],
        },
        {
          id: "servidores.ad",
          title: "Active Directory e usuários",
          description:
            "O sistema que centraliza usuários, acessos e permissões da empresa.",
          content:
            "Numa empresa, não faria sentido cada computador ter seus próprios usuários e senhas isolados. O **Active Directory** (AD), da Microsoft, resolve isso: é o sistema que **centraliza** o gerenciamento de usuários, máquinas e acessos de toda a organização. É uma das ferramentas mais importantes do dia a dia da infraestrutura corporativa, e dominá-lo é um diferencial concreto.\n\nA ideia central é o **domínio**: um ambiente gerenciado onde todas as máquinas e usuários são cadastrados e controlados de um ponto central. Com o AD, quando um funcionário é contratado, você cria a conta dele uma vez, e ele consegue logar em qualquer computador da empresa com as permissões certas. Quando ele sai, você desativa a conta num lugar só, e o acesso dele acaba em todas as máquinas. Isso é gestão de acesso em escala.\n\nO trabalho com AD envolve criar e gerenciar **usuários e grupos** (agrupar pessoas por setor ou função pra dar permissões de uma vez), definir **políticas** que se aplicam às máquinas e usuários (como regras de senha e configurações padrão), e controlar **quem acessa o quê**. Aqui aparece de novo o princípio do **menor privilégio**, comum a toda TI: cada pessoa recebe apenas os acessos de que precisa, nem mais.\n\nO AD conecta vários temas da trilha: ele roda num servidor Windows, depende da rede pra funcionar, e é central pra segurança e organização da empresa. Entender bem o gerenciamento de usuários e acessos é uma das competências mais pedidas em vagas de infraestrutura, e uma ponte natural pra áreas como cibersegurança. A documentação oficial da Microsoft cobre o AD em profundidade.",
          resources: [
            {
              label: "Microsoft: Active Directory Domain Services (oficial)",
              url: "https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview",
              kind: "doc",
            },
          ],
        },
        {
          id: "servidores.virtualizacao",
          title: "Virtualização",
          description:
            "Rodar vários computadores virtuais numa só máquina física.",
          content:
            "A **virtualização** é uma tecnologia fundamental na infraestrutura moderna: ela permite rodar vários computadores **virtuais** (chamados máquinas virtuais, ou VMs) dentro de uma única máquina física. Cada VM se comporta como um computador completo e independente, com seu próprio sistema operacional, mesmo compartilhando o hardware real por baixo.\n\nO valor disso é enorme. Em vez de comprar dez servidores físicos pra dez funções diferentes, uma empresa pode rodar dez servidores virtuais numa máquina potente, economizando dinheiro, energia e espaço. As VMs também são fáceis de criar, copiar e descartar, o que facilita testes e recuperação.\n\nPra quem está aprendendo, a virtualização tem um uso imediato e valioso: criar um **laboratório pessoal**. Com ferramentas gratuitas como o VirtualBox, você instala uma máquina virtual no seu computador e pratica à vontade, instalar Linux, configurar um servidor, montar uma rede de teste, sem nenhum risco pra a sua máquina principal. Se algo der errado, você simplesmente apaga a VM e cria outra. É a forma mais segura e barata de aprender praticamente tudo desta trilha.\n\nNo mundo corporativo, ferramentas de virtualização mais robustas (como as da VMware) gerenciam servidores virtuais em escala, e a virtualização é a base sobre a qual a **computação em nuvem** foi construída: quando você cria um servidor na nuvem, está, no fundo, criando uma máquina virtual no data center de um provedor. Por isso entender virtualização é também um primeiro passo conceitual rumo à cloud.\n\nComece instalando o VirtualBox e criando sua primeira VM. Esse laboratório vai te acompanhar em todo o aprendizado de infraestrutura.",
          resources: [
            {
              label: "VirtualBox: manual oficial",
              url: "https://www.virtualbox.org/manual/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "suporte",
      title: "Atendimento e operação",
      description:
        "O lado humano e organizacional do trabalho: atender pessoas e manter tudo documentado.",
      level: "intermediario",
      children: [
        {
          id: "suporte.chamados",
          title: "Atendimento e chamados",
          description:
            "Resolver problemas das pessoas com método e boa comunicação.",
          content:
            "Boa parte do trabalho de suporte é **atender pessoas**, e isso surpreende quem imagina a área como puramente técnica. A verdade é que a comunicação e o atendimento são tão importantes quanto o conhecimento técnico, e o que mais diferencia um bom profissional de suporte.\n\nO trabalho costuma se organizar em torno de **chamados** (tickets): cada problema relatado por um usuário vira um chamado, que você registra, prioriza, resolve e fecha, mantendo a pessoa informada no caminho. Ferramentas de gestão de chamados, como o GLPI (gratuito e muito usado) ou o Jira, organizam esse fluxo e mantêm o histórico de tudo.\n\nUm conceito comum é a organização em **níveis** de suporte: o primeiro nível atende e resolve os problemas mais simples e frequentes; o que ele não resolve é **escalado** pra níveis mais especializados. Saber até onde resolver e quando escalar, sem segurar um problema que te trava nem repassar o que você poderia resolver, é uma habilidade prática importante.\n\nAlgumas atitudes definem o bom atendimento. **Paciência e empatia**, porque a pessoa que abre um chamado costuma estar frustrada e nem sempre sabe explicar o problema tecnicamente; cabe a você traduzir. **Comunicação clara**, explicando em linguagem que o usuário entenda, sem jargão. E o **método de diagnóstico**: fazer as perguntas certas, reproduzir o problema, isolar a causa, em vez de sair tentando soluções no escuro.\n\nUma verdade da área: o usuário lembra mais de **como** foi atendido do que do problema em si. Um técnico que resolve com gentileza e clareza constrói reputação, e reputação abre portas. Tratar o atendimento com o mesmo cuidado que a parte técnica é o que faz a diferença na carreira.",
          resources: [
            {
              label: "GLPI (ferramenta de gestão de chamados, oficial)",
              url: "https://glpi-project.org/",
              kind: "doc",
            },
          ],
        },
        {
          id: "suporte.documentacao",
          title: "Documentação e ativos",
          description:
            "Registrar o que existe e como as coisas funcionam, pra a TI não depender de memória.",
          content:
            "Um trabalho de infraestrutura organizado depende de **documentação**, e essa é uma parte subestimada por iniciantes mas muito valorizada por quem contrata. TI que funciona na base da memória de uma pessoa é uma bomba-relógio; TI documentada é profissional e resiliente.\n\nDois tipos de documentação importam. O **inventário de ativos**: o registro de tudo que a empresa tem (computadores, servidores, equipamentos de rede, licenças de software), com suas informações e onde estão. Saber exatamente o que existe é essencial pra manutenção, compras, segurança e planejamento. E os **procedimentos**: o passo a passo de como fazer as tarefas comuns (como configurar uma máquina nova, como resolver um problema recorrente, como funciona a rede da empresa).\n\nA documentação de procedimentos tem um valor enorme e prático. Ela permite que qualquer pessoa da equipe execute uma tarefa de forma consistente, acelera o treinamento de novos técnicos, e garante que o conhecimento não vá embora quando alguém sai da empresa. Aquele \"só o fulano sabe configurar isso\" é exatamente o problema que a documentação resolve.\n\nUm bom hábito desde o início da carreira: **documente enquanto resolve**. Ao solucionar um problema novo ou configurar algo, registre como fez. Da próxima vez (sua ou de um colega), o trabalho será muito mais rápido, e você constrói uma base de conhecimento valiosa.\n\nUm ótimo exercício de aprendizado, inclusive como projeto de portfólio, é documentar o inventário e os procedimentos de um setor ou de um laboratório: listar os equipamentos, descrever a rede, escrever os passos das tarefas principais. Isso demonstra organização e visão de infraestrutura, qualidades que recrutadores procuram.",
        },
      ],
    },
    {
      id: "carreira",
      title: "Certificações e carreira",
      description:
        "Validar conhecimento com certificações e usar o suporte como trampolim para outras áreas.",
      level: "avancado",
      children: [
        {
          id: "carreira.certificacoes",
          title: "Certificações",
          description:
            "Os selos que validam conhecimento e abrem portas na área de infraestrutura.",
          content:
            "A área de infraestrutura valoriza bastante as **certificações**, porque elas comprovam conhecimento técnico de forma reconhecida, o que ajuda especialmente quem está começando e ainda não tem experiência. Elas também organizam o estudo, dando um roteiro claro de tópicos a dominar.\n\nAlgumas certificações são portas de entrada conhecidas. Na área de **redes**, a referência mundial é a trilha da **Cisco**, líder em equipamentos de rede. A certificação **CCNA** é a mais citada como base sólida de redes, muito reconhecida no mercado, e a Cisco oferece cursos gratuitos pela sua academia (Networking Academy) que preparam pra ela e ensinam redes do zero. Há também certificações introdutórias mais amplas de suporte de TI, como as que cobrem fundamentos de hardware, sistemas e redes de forma geral.\n\nConforme você define a direção, surgem certificações mais especializadas: de redes mais avançadas, de sistemas (Windows Server e Linux), de **cloud** (as dos provedores como AWS, Azure e Google, que a trilha de cloud aborda), e de **segurança**. Cada caminho de evolução tem suas certificações.\n\nUm conselho de equilíbrio, válido aqui como em toda TI: a certificação ajuda a entrar e a passar por filtros de recrutamento, mas não substitui a **prática**. O ideal é estudar pra ela com a intenção de entender de verdade, e combinar com experiência concreta, como montar redes e servidores num laboratório virtual. Uma certificação acompanhada de prática demonstrável e de um portfólio (como a documentação de um laboratório que você montou) vale muito mais que o certificado isolado.\n\nComece pelos cursos gratuitos da Cisco e por uma base ampla de fundamentos, e escolha a certificação conforme a direção que mais te atrair.",
          resources: [
            {
              label: "Cisco CCNA (certificação oficial)",
              url: "https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccna/index.html",
              kind: "doc",
            },
            {
              label: "Cisco Networking Academy (cursos gratuitos)",
              url: "https://www.netacad.com/",
              kind: "curso",
            },
          ],
        },
        {
          id: "carreira.evoluir",
          title: "Evoluir e entrar na carreira",
          description:
            "Conseguir a primeira vaga e usar o suporte como trampolim.",
          optional: true,
          content:
            "O suporte e a infraestrutura têm uma vantagem rara: é, ao mesmo tempo, uma das **entradas mais rápidas** no mercado de tecnologia e um **trampolim** comprovado pra áreas mais avançadas e bem pagas. Aproveitar isso bem é a chave da carreira.\n\nPra conseguir a primeira vaga, a fórmula é acessível. Domine os **fundamentos** desta trilha: hardware, Windows e Linux, redes, servidores e atendimento. Monte um **laboratório virtual** com máquinas virtuais e pratique de verdade: instale sistemas, configure uma rede, suba um servidor de arquivos, brinque com o Active Directory. **Documente** esses exercícios, porque eles viram portfólio e provam iniciativa. E considere uma **certificação** de base, como as gratuitas da Cisco, que ajuda a passar por filtros. O tempo até a primeira vaga costuma ser curto justamente porque a barreira é menor que em outras áreas.\n\nO grande diferencial estratégico vem depois: usar o suporte como **trampolim**. Trabalhando na área, você vê de perto redes, servidores, cloud e segurança, e descobre o que mais gosta. A partir daí, os caminhos de evolução são claros e valorizados: **redes** (aprofundando em infraestrutura de rede), **cloud** (a infraestrutura na nuvem, uma das áreas mais quentes), **DevOps e SRE** (automação e operação em escala), ou **cibersegurança** (proteção dos sistemas). Cada uma dessas áreas paga mais e se constrói sobre a base prática que o suporte te deu.\n\nO conselho que resume tudo: entre pelo suporte pra aprender vendo tudo de perto, capriche nos fundamentos e no atendimento, e use a experiência pra escolher conscientemente sua próxima direção. Poucas áreas oferecem uma entrada tão acessível com tantas portas de saída pra cima.",
        },
      ],
    },
  ],
};
