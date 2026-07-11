import type { RoadmapV2 } from "../types";

export const ciberseguranca: RoadmapV2 = {
  slug: "ciberseguranca",
  area: "ciberseguranca",
  title: "Cibersegurança do Zero",
  level: "Iniciante",
  description:
    "Das bases de redes e Linux aos conceitos de segurança, times ofensivo e defensivo, prática ética e certificações. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é proteger sistemas, os princípios que guiam a área e a regra inegociável da ética.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é cibersegurança",
          description:
            "Proteger sistemas, dados e pessoas contra ameaças digitais.",
          content:
            'Cibersegurança é a prática de proteger sistemas, redes, dados e pessoas contra ameaças digitais: invasões, roubo de dados, fraudes, sabotagem. Conforme tudo na vida (banco, saúde, trabalho, governo) migra pro digital, proteger esses sistemas deixou de ser detalhe técnico e virou questão crítica pra empresas e pra sociedade.\n\nA área é ampla e tem muitos caminhos. De um lado, há o trabalho **ofensivo**, de quem testa defesas procurando falhas antes que criminosos as encontrem (os pentesters, o chamado red team). De outro, o **defensivo**, de quem monitora, detecta e responde a ataques (o blue team, os analistas de SOC). E há áreas de governança, que cuidam de políticas, riscos e conformidade com leis. Esta trilha apresenta as bases comuns a todos esses caminhos.\n\nUma ideia organiza o campo: segurança não é um produto que você compra e instala, é um **processo contínuo**. Não existe sistema cem por cento seguro; existe a gestão constante de riscos, tornando o ataque cada vez mais difícil e caro pro adversário, e a detecção cada vez mais rápida. Quem espera uma solução definitiva entende a área errado.\n\nUm aviso honesto: cibersegurança é uma área difícil e ampla, que exige base sólida em redes, sistemas e lógica antes da parte glamourosa de "hackear". A boa notícia é que a demanda por profissionais é alta e o caminho de estudo é bem trilhado. Esta jornada te dá esse mapa, na ordem certa.',
        },
        {
          id: "fundamentos.triade",
          title: "A tríade CIA",
          description:
            "Os três princípios que definem o que significa um sistema seguro.",
          content:
            "Toda a segurança da informação gira em torno de três princípios, conhecidos como **tríade CIA** (das iniciais em inglês). Entendê-los te dá uma lente pra analisar qualquer situação de segurança.\n\nO primeiro é a **confidencialidade**: garantir que a informação só seja acessada por quem tem permissão. É o que a criptografia e o controle de acesso protegem. Uma violação aqui é um vazamento de dados, quando informação sigilosa cai em mãos erradas.\n\nO segundo é a **integridade**: garantir que a informação não seja alterada de forma indevida, e que você saiba se foi. Imagine um criminoso mudando o valor de uma transferência bancária ou adulterando um registro médico. Mecanismos que detectam alteração protegem a integridade.\n\nO terceiro é a **disponibilidade**: garantir que o sistema esteja acessível a quem precisa, quando precisa. Um ataque que derruba um site e impede o acesso legítimo (uma negação de serviço) ataca a disponibilidade, sem necessariamente roubar ou alterar nada.\n\nA utilidade da tríade é prática: ao avaliar um risco ou um controle, você pergunta qual dos três pilares está em jogo. Às vezes eles entram em tensão (mais segurança pode reduzir disponibilidade ou comodidade), e o trabalho é equilibrar conforme o contexto. Esses três conceitos vão reaparecer em tudo nesta trilha, da criptografia à resposta a incidentes, como o vocabulário básico da área.",
          resources: [
            {
              label: "NIST: Cybersecurity Framework (oficial)",
              url: "https://www.nist.gov/cyberframework",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.etica",
          title: "Ética e legalidade",
          description:
            "A regra inegociável: só teste o que você tem autorização explícita pra testar.",
          content:
            'Antes de qualquer técnica, vem a regra que define toda a carreira, e ela é inegociável: **só teste sistemas que você tem autorização explícita pra testar**. Conhecer técnicas de invasão não dá direito de usá-las. A diferença entre um profissional de segurança e um criminoso não está na habilidade; está na autorização e na intenção.\n\nIsso não é só ética, é lei. Acessar sistemas sem permissão é crime, com penalidades sérias, mesmo que você não cause dano e mesmo que sua intenção fosse só "aprender" ou "ajudar". Invadir o sistema de uma empresa pra mostrar que ela é vulnerável, sem autorização, pode te levar à prisão, não a um emprego. Curiosidade não é defesa legal.\n\nO trabalho ofensivo legítimo sempre acontece dentro de limites combinados. Um pentest profissional começa por um contrato que define exatamente o que pode ser testado, como e quando, o chamado escopo. Programas de **bug bounty** dão autorização pública pra testar sistemas específicos sob regras claras. E existem ambientes feitos pra praticar legalmente, que você usa nesta trilha.\n\nPor isso, todo o aprendizado prático desta jornada acontece em **ambientes controlados e autorizados**: máquinas virtuais suas, laboratórios feitos pra treino, plataformas de desafios. Nunca em sistemas reais de terceiros.\n\nLeve isso a sério desde o primeiro dia. A área de segurança é construída sobre confiança: empresas dão a profissionais acesso ao que têm de mais sensível. Sua reputação ética é seu ativo mais valioso, e a única coisa que, perdida, não se recupera.',
        },
      ],
    },
    {
      id: "redes",
      title: "Redes de computadores",
      description:
        "Como os dados viajam pela internet, a base técnica sem a qual nada de segurança faz sentido.",
      level: "iniciante",
      children: [
        {
          id: "redes.basico",
          title: "Como funcionam as redes",
          description:
            "A base de como computadores conversam, ponto de partida da segurança.",
          content:
            'Não dá pra proteger (nem atacar de forma autorizada) o que você não entende, e quase tudo em segurança passa por **redes**. É a base técnica número um, e pular essa etapa é o erro mais comum de quem quer ir direto pra parte empolgante.\n\nA ideia central é simples: computadores conversam trocando pequenos pacotes de dados por uma rede. Cada máquina tem um endereço, o **IP**, que funciona como um endereço postal: é assim que os dados sabem pra onde ir e de onde vieram. Quando você acessa um site, seu computador manda pacotes pro IP do servidor, que responde com outros pacotes.\n\nEsse processo é organizado em **camadas**, cada uma com uma responsabilidade (do sinal físico até o aplicativo que você usa). Você não precisa decorar todas agora, mas entender que a comunicação é estruturada em camadas ajuda a localizar onde cada ataque e cada defesa atuam.\n\nPra segurança, esse conhecimento é o que permite enxergar o tráfego com sentido: reconhecer o que é normal e o que é suspeito, entender por onde um ataque pode entrar, saber o que um firewall está filtrando. Um analista que não entende redes está cego.\n\nInvista tempo de verdade aqui, mesmo que pareça menos empolgante que "hackear". Entender IP, pacotes e o caminho que os dados percorrem é o alicerce sobre o qual todo o resto desta trilha se apoia. Sem ele, os conceitos mais avançados viram decoreba sem compreensão.',
        },
        {
          id: "redes.protocolos",
          title: "Protocolos, portas e serviços",
          description:
            "As regras e os pontos de entrada que todo profissional de segurança precisa conhecer.",
          content:
            "Computadores seguem **protocolos**: conjuntos de regras que definem como a comunicação acontece. Você já conhece um, o HTTP, que o navegador usa pra carregar sites (e sua versão segura, o HTTPS). Outros importantes incluem o DNS, que traduz nomes como um site em endereços IP, e protocolos de email, transferência de arquivos e acesso remoto. Cada um tem seu jeito de funcionar e suas fraquezas.\n\nUm conceito central pra segurança são as **portas**. Um mesmo servidor oferece vários serviços ao mesmo tempo, e as portas são como portas numeradas de um prédio: cada serviço escuta numa porta específica (sites costumam usar a 80 e a 443, por exemplo). Saber quais portas estão abertas num sistema diz quais serviços ele expõe, e cada serviço exposto é uma possível porta de entrada.\n\nPor isso, uma das primeiras atividades em segurança é o **mapeamento**: descobrir quais máquinas existem numa rede e quais portas e serviços estão abertos. Ferramentas como o **Nmap** fazem isso, e a análise de tráfego de rede, com ferramentas como o **Wireshark**, permite enxergar de fato os pacotes que circulam. Essas duas ferramentas são clássicas da área e vale conhecer (sempre em ambiente autorizado).\n\nA lição que une tudo: cada serviço aberto, cada protocolo em uso, é ao mesmo tempo uma função útil e uma superfície de ataque. Reduzir o que está exposto ao mínimo necessário é um dos princípios mais básicos e eficazes de defesa.",
          resources: [
            {
              label: "MDN HTTP",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP",
              kind: "doc",
            },
            {
              label: "Wireshark: documentação oficial",
              url: "https://www.wireshark.org/docs/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "linux",
      title: "Linux",
      description:
        "O sistema operacional onde rodam servidores e ferramentas de segurança, e que você precisa dominar.",
      level: "iniciante",
      children: [
        {
          id: "linux.terminal",
          title: "Linux e linha de comando",
          description:
            "O sistema dos servidores e das ferramentas de segurança.",
          content:
            "A maioria dos servidores da internet roda **Linux**, assim como a maior parte das ferramentas de segurança. Por isso, dominar o Linux, especialmente a linha de comando, não é opcional na área: é uma habilidade diária.\n\nDiferente de clicar em janelas, no Linux você comanda o sistema digitando no **terminal**. Isso parece intimidador no começo, mas é mais rápido, preciso e funciona em qualquer servidor, inclusive nos que nem têm interface gráfica, que é a maioria. Os comandos básicos cabem em poucos: navegar entre pastas, listar arquivos, ler conteúdo, buscar texto, ver processos em execução. Com esse núcleo você já se vira.\n\nNa segurança, o Linux aparece dos dois lados. Você precisa entender como ele funciona pra **proteger** servidores Linux (a maioria dos alvos reais). E muitas ferramentas de teste rodam nele: existe inclusive uma distribuição, o **Kali Linux**, que já vem com centenas de ferramentas de segurança instaladas, muito usada pra estudo e por profissionais.\n\nUma forma segura e gratuita de praticar é instalar o Linux numa **máquina virtual**: um computador simulado dentro do seu, isolado, onde você pode experimentar à vontade sem risco pra sua máquina real. Esse será o seu laboratório pessoal ao longo da trilha.\n\nNão tente decorar centenas de comandos. Instale o Linux numa máquina virtual, use o terminal pra tarefas reais e deixe a fluência crescer com a prática. É um investimento que se paga em toda etapa seguinte.",
          resources: [
            {
              label: "Ubuntu: linha de comando pra iniciantes",
              url: "https://ubuntu.com/tutorials/command-line-for-beginners",
              kind: "artigo",
            },
            {
              label: "Kali Linux: documentação oficial",
              url: "https://www.kali.org/docs/",
              kind: "doc",
            },
          ],
        },
        {
          id: "linux.permissoes",
          title: "Usuários e permissões",
          description:
            "O modelo de controle de acesso que está no coração da segurança de qualquer sistema.",
          content:
            "Um dos conceitos mais importantes do Linux pra segurança é o de **usuários e permissões**, porque ele é a forma concreta como o sistema decide quem pode fazer o quê. E controle de acesso é metade da segurança.\n\nNo Linux, cada arquivo e cada processo pertence a um usuário, e o sistema controla quem pode ler, escrever ou executar cada coisa. Existe um usuário especial, o **root** (administrador), que pode tudo. Os demais usuários têm poderes limitados, restritos ao que precisam. Essa separação é proposital e protetora.\n\nDaí nasce um princípio central da área, o **menor privilégio**: cada usuário, programa ou serviço deve ter apenas as permissões mínimas necessárias pra fazer seu trabalho, e nada além. Se um serviço com poderes limitados for comprometido, o estrago é contido; se ele rodava como root, o atacante herda o controle total. Reduzir privilégios é uma das defesas mais simples e eficazes que existem.\n\nÉ por isso que um objetivo comum de quem ataca é a **escalada de privilégios**: depois de entrar num sistema com acesso limitado, tentar virar root. E é por isso que defender bem significa, em boa parte, configurar permissões com cuidado e não dar a ninguém mais poder do que o necessário.\n\nEntender esse modelo no Linux te dá a intuição que vale pra praticamente qualquer sistema: contas, papéis, permissões e o princípio de conceder só o mínimo. É um dos conceitos que mais se repete em toda a segurança.",
        },
      ],
    },
    {
      id: "conceitos",
      title: "Conceitos de segurança",
      description:
        "As ideias centrais que se repetem em toda a área: proteger dados, identidades e reconhecer ameaças.",
      level: "intermediario",
      children: [
        {
          id: "conceitos.cripto",
          title: "Criptografia básica",
          description:
            "Como a informação é protegida de quem não deveria lê-la.",
          content:
            "A **criptografia** é a ciência de proteger informação embaralhando-a de forma que só quem tem a chave certa consiga lê-la. É o que sustenta a confidencialidade da tríade CIA, e está por trás de quase tudo: o cadeado do navegador, as mensagens de apps, as senhas guardadas. Você não precisa da matemática pesada pra começar, mas precisa da intuição.\n\nHá duas grandes famílias. Na **criptografia simétrica**, a mesma chave fecha e abre o cofre: rápida, mas exige que as duas partes já compartilhem a chave em segredo. Na **assimétrica**, existe um par de chaves, uma pública e uma privada: o que uma fecha, só a outra abre. Isso resolve o problema de trocar segredos com quem você nunca conversou antes, e é a base do HTTPS que protege sua navegação.\n\nUm conceito relacionado e muito usado é o **hash**: uma função que transforma qualquer dado numa espécie de impressão digital de tamanho fixo, da qual não dá pra voltar ao original. Ele serve pra verificar integridade (se o dado mudou, o hash muda) e pra guardar senhas sem armazená-las em texto puro, assunto da próxima parte.\n\nDuas regras práticas que valem ouro. Nunca invente sua própria criptografia: use algoritmos consagrados e bibliotecas testadas, porque criptografia caseira quase sempre tem furos invisíveis pra quem a criou. E lembre que criptografia protege os dados, mas não substitui o resto: um sistema com criptografia forte e senhas fracas continua vulnerável.",
        },
        {
          id: "conceitos.autenticacao",
          title: "Autenticação e senhas",
          description:
            "Como sistemas confirmam quem você é, e por que esse é um alvo constante.",
          content:
            "**Autenticação** é como um sistema confirma que você é quem diz ser, e é uma das fronteiras mais atacadas, porque furá-la dá acesso direto. Vale separar de **autorização**, que vem depois: autenticação prova a identidade; autorização decide o que essa identidade pode fazer.\n\nO método mais comum ainda é a **senha**, e ela é também o elo mais fraco. Pessoas reutilizam senhas, escolhem combinações óbvias e caem em golpes que as entregam. Do lado de quem constrói sistemas, há uma regra inegociável: senhas **nunca** são guardadas em texto puro. Elas passam por um hash apropriado, de forma que, mesmo se o banco de dados vazar, as senhas originais não fiquem expostas. Guardar senha legível é uma das falhas mais graves e, infelizmente, ainda comuns.\n\nComo a senha sozinha é frágil, a defesa mais eficaz e acessível hoje é a **autenticação de múltiplos fatores** (MFA): exigir, além da senha (algo que você sabe), um segundo fator, como um código no celular (algo que você tem). Assim, mesmo que a senha vaze, ela não basta pra entrar. Ativar MFA é provavelmente a recomendação de segurança de maior impacto pra qualquer pessoa.\n\nVocê vai ouvir muito sobre ataques a essa camada: tentar muitas senhas até acertar, usar senhas vazadas de outros sites, enganar a pessoa pra que ela mesma entregue suas credenciais. Entender como a autenticação funciona é entender o que esses ataques exploram, e como controles simples, como MFA e boas políticas de senha, reduzem drasticamente o risco.",
        },
        {
          id: "conceitos.vulnerabilidades",
          title: "Vulnerabilidades comuns",
          description:
            "As falhas que mais aparecem em sistemas reais, catalogadas pela comunidade.",
          content:
            "Uma **vulnerabilidade** é uma falha num sistema que pode ser explorada pra comprometer sua segurança. Elas surgem de erros de programação, de configuração ou de projeto, e a boa notícia pra quem estuda é que as mais comuns se repetem tanto que foram catalogadas e bem documentadas.\n\nA referência mais conhecida é o **OWASP Top 10**, uma lista, mantida pela comunidade de segurança, das categorias de falhas mais críticas em aplicações web. Estudá-la é um dos melhores investimentos de quem começa, porque ela concentra os problemas que você mais vai encontrar no mundo real. Entre os clássicos estão as falhas de **injeção** (quando dados maliciosos enviados pelo usuário são tratados como comando pelo sistema), o **controle de acesso quebrado** (quando alguém consegue acessar o que não deveria) e os **erros de configuração** (sistemas deixados com senhas padrão ou serviços expostos sem necessidade).\n\nUm conceito importante pra organizar a cabeça: existe diferença entre **vulnerabilidade**, **exploração** e **ameaça**. A vulnerabilidade é a falha em si; a exploração é a técnica que se aproveita dela; a ameaça é quem ou o que pode causar o dano. Defender significa fechar vulnerabilidades antes que sejam exploradas.\n\nEstudar vulnerabilidades tem um propósito duplo e legítimo: quem **defende** precisa conhecer as falhas pra corrigi-las e priorizá-las, e quem faz testes **autorizados** precisa saber procurá-las. Em ambos os casos, o conhecimento serve pra proteger. Comece pela lista do OWASP, entendendo o que cada categoria significa e como se previne.",
          resources: [
            {
              label: "OWASP Top 10 (oficial)",
              url: "https://owasp.org/www-project-top-ten/",
              kind: "doc",
            },
          ],
        },
        {
          id: "conceitos.engenharia",
          title: "Engenharia social e malware",
          description: "Os ataques que miram a pessoa, não só a máquina.",
          content:
            "Nem todo ataque é técnico. Muitas das invasões mais bem-sucedidas exploram o elo mais difícil de proteger: as **pessoas**. A **engenharia social** é a arte de manipular alguém pra que entregue informação ou faça algo que comprometa a segurança, sem precisar quebrar nenhum sistema por força técnica.\n\nO exemplo mais comum é o **phishing**: mensagens (email, SMS, apps) que se passam por uma fonte confiável, como um banco ou a própria empresa, pra induzir a vítima a clicar num link falso, entregar a senha ou baixar um arquivo malicioso. Existem variações mais elaboradas, dirigidas a uma pessoa específica com informações personalizadas, que enganam até gente experiente. A defesa aqui é mais humana que técnica: desconfiança treinada, verificação por outro canal e cultura de segurança na organização.\n\nO **malware** (software malicioso) é o outro grande vetor, e é um termo guarda-chuva. Inclui vírus, que se espalham; **ransomware**, que sequestra dados criptografando-os e exige resgate, hoje uma das maiores ameaças a empresas; spyware, que espiona; e outros. O malware costuma entrar justamente por engenharia social (a pessoa abre o anexo errado) ou por uma vulnerabilidade não corrigida, conectando os dois temas.\n\nA lição estratégica: segurança não é só firewall e criptografia; é também conscientização das pessoas e bons hábitos. De nada adianta a defesa técnica mais cara se um funcionário entrega a senha por telefone a um golpista. Por isso treinamento e cultura de segurança são parte central do trabalho, não um detalhe.",
        },
      ],
    },
    {
      id: "ofensiva",
      title: "Segurança ofensiva",
      description:
        "Pensar como um atacante, de forma autorizada, pra encontrar falhas antes dos criminosos.",
      level: "intermediario",
      children: [
        {
          id: "ofensiva.redteam",
          title: "Red team e pentest",
          description:
            "Atacar de forma autorizada pra revelar falhas e ajudar a corrigi-las.",
          content:
            'A **segurança ofensiva** é o trabalho de atacar sistemas de forma **autorizada**, pra encontrar as falhas antes que criminosos as encontrem. A lógica é direta: a melhor forma de saber se uma defesa aguenta é tentar furá-la, com permissão e dentro de regras.\n\nA atividade mais conhecida é o **pentest** (teste de invasão): um profissional, contratado e autorizado, simula um ataque real a um sistema pra descobrir vulnerabilidades e demonstrar o impacto que teriam. O termo **red team** costuma se referir a exercícios mais amplos e realistas, que simulam um adversário de verdade pra testar não só a tecnologia, mas a capacidade da empresa de detectar e responder.\n\nO ponto que diferencia esse trabalho de um crime já foi dito, mas se repete porque é essencial: tudo começa com **autorização formal e escopo definido**. O pentester recebe por escrito o que pode testar, como e quando. Sair desse escopo, mesmo com boa intenção, é ilegal. A habilidade técnica sem a autorização não é segurança ofensiva, é invasão.\n\nO entregável de um pentest não é o "hack" em si; é o **relatório**. Um bom relatório descreve cada falha encontrada, o risco que representa, como reproduzi-la e, principalmente, como corrigi-la. O valor pra empresa está em consertar, não em ser invadida. Por isso um bom profissional ofensivo pensa como atacante, mas trabalha a serviço da defesa.\n\nÉ um caminho que exige base sólida (redes, sistemas, as falhas comuns) antes da prática. Por isso ele aparece depois dos fundamentos nesta trilha, não antes.',
          resources: [
            {
              label: "OWASP (comunidade e projetos de segurança)",
              url: "https://owasp.org/",
              kind: "doc",
            },
          ],
        },
        {
          id: "ofensiva.fases",
          title: "As fases de um teste",
          description:
            "O método estruturado por trás de um teste de invasão sério.",
          content:
            'Um teste de invasão não é mexer em ferramentas no escuro; segue um método estruturado, com fases bem definidas. Conhecer essa estrutura ajuda a entender como o trabalho realmente acontece, e mostra que disciplina importa mais que truque.\n\nTudo começa com o **planejamento e a autorização**: definir o escopo, as regras e os objetivos, por escrito. Sem essa fase, não existe teste legítimo. Em seguida vem o **reconhecimento**: reunir informação sobre o alvo, descobrir quais sistemas existem e o que eles expõem. É aqui que entram o mapeamento de rede e a varredura de portas que você viu antes, com ferramentas como o Nmap, sempre dentro do escopo combinado.\n\nDepois, o profissional **identifica vulnerabilidades** nos serviços encontrados, cruzando o que observou com falhas conhecidas. A fase seguinte, de **exploração**, testa de forma controlada se essas falhas realmente permitem acesso, comprovando o risco na prática (e não apenas em teoria). Por fim, a fase mais valiosa: a **documentação**, em que tudo vira um relatório claro, com as falhas, os riscos e as recomendações de correção.\n\nRepare que a parte de "invadir" é uma fatia pequena no meio de muito planejamento e documentação. O estereótipo do hacker digitando freneticamente é ficção; o trabalho real é metódico, paciente e bem registrado.\n\nNesta trilha, você só pratica essas fases em **ambientes autorizados**: máquinas virtuais suas, laboratórios de treino e plataformas de desafio feitas pra isso. Nunca em sistemas de terceiros.',
          resources: [
            {
              label: "Nmap: livro oficial (referência da ferramenta)",
              url: "https://nmap.org/book/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "defensiva",
      title: "Segurança defensiva",
      description:
        "O outro lado: monitorar, detectar e responder a ataques, que é onde está a maioria das vagas.",
      level: "avancado",
      children: [
        {
          id: "defensiva.blueteam",
          title: "Blue team e SOC",
          description: "Quem defende, monitora e detecta ataques no dia a dia.",
          content:
            "Se o red team ataca, o **blue team** defende. É o lado que monitora os sistemas, detecta atividades suspeitas e age pra impedir ou conter ataques. Vale destacar: embora o trabalho ofensivo seja o que mais aparece na imaginação popular, a **maioria das vagas** em cibersegurança é defensiva, e é um ótimo caminho de entrada na carreira.\n\nO coração da defesa em muitas empresas é o **SOC** (centro de operações de segurança): uma equipe que monitora o ambiente de forma contínua, muitas vezes em turnos, vinte e quatro horas por dia. O analista de SOC, posição comum pra quem começa, acompanha alertas, investiga o que é real e o que é falso alarme, e escala o que for grave.\n\nA matéria-prima desse trabalho são os **logs**: os registros que sistemas, redes e aplicações geram sobre tudo o que acontece. Ferramentas reúnem e correlacionam esses logs pra gerar alertas quando algo foge do padrão (um acesso de um país estranho, muitas tentativas de senha, um volume anormal de dados saindo). Boa parte da defesa é saber transformar essa enxurrada de registros em sinais úteis.\n\nUm recurso valioso pra quem entra na defesa é o **MITRE ATT&CK**, uma base de conhecimento pública que cataloga as táticas e técnicas que atacantes reais usam. Estudá-la ajuda o defensor a saber o que procurar e a antecipar movimentos do adversário.\n\nA mentalidade defensiva é de vigilância constante e suposição realista: parta do princípio de que ataques vão acontecer, e foque em detectá-los e respondê-los rápido, não só em tentar impedir tudo.",
          resources: [
            {
              label: "MITRE ATT&CK (base de táticas e técnicas)",
              url: "https://attack.mitre.org/",
              kind: "doc",
            },
          ],
        },
        {
          id: "defensiva.incidentes",
          title: "Resposta a incidentes",
          description:
            "O que fazer quando o ataque acontece, de forma organizada e sob pressão.",
          content:
            "Mais cedo ou mais tarde, algo vai dar errado: um sistema é comprometido, dados vazam, um ransomware ataca. A **resposta a incidentes** é o processo organizado de lidar com isso, e ter um plano antes da crise faz toda a diferença entre um susto contornado e um desastre.\n\nO trabalho costuma seguir etapas, descritas em guias consagrados da área. A **preparação** vem antes de qualquer ataque: ter plano, ferramentas e pessoas prontas. A **detecção e análise** identificam que um incidente está acontecendo e avaliam sua gravidade. A **contenção** limita o estrago, isolando o que foi afetado pra impedir que se espalhe. A **erradicação** remove a causa (o malware, o acesso indevido). A **recuperação** restaura os sistemas ao normal com segurança. E, depois, as **lições aprendidas**: analisar o que aconteceu pra evitar a repetição.\n\nA fase de lições aprendidas é a mais negligenciada e uma das mais importantes. Um incidente bem analisado vira melhoria de defesa; um incidente varrido pra debaixo do tapete vira o próximo incidente. Postura madura trata cada crise como aprendizado, sem cultura de culpa que faz as pessoas esconderem problemas.\n\nUm ponto que diferencia o profissional: sob pressão, no calor de um ataque, é fácil agir por impulso e piorar tudo (apagar evidências, alertar o atacante cedo demais). Por isso existe o processo. Seguir um plano calmo e definido, em vez de improvisar no pânico, é o que mantém a resposta eficaz. Frameworks oficiais, como os do NIST, descrevem esse ciclo em detalhe e servem de referência.",
          resources: [
            {
              label: "NIST SP 800-61: guia de resposta a incidentes (oficial)",
              url: "https://csrc.nist.gov/pubs/sp/800/61/r2/final",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "carreira",
      title: "Prática e carreira",
      description:
        "Treinar de forma legal e segura, validar conhecimento com certificações e dar os primeiros passos na área.",
      level: "avancado",
      children: [
        {
          id: "carreira.pratica",
          title: "Praticar com segurança",
          description:
            "Onde treinar habilidades de forma legal, em ambientes feitos pra isso.",
          content:
            'Cibersegurança só assenta com prática, mas, diferente de outras áreas, aqui praticar no lugar errado é crime. Por sorte, existe um ecossistema rico de ambientes **feitos pra treinar legalmente**, e é neles que você deve passar todo o seu tempo de prática.\n\nO primeiro é o seu **laboratório pessoal**: máquinas virtuais na sua máquina, isoladas, onde você pode instalar sistemas, configurar serviços e testar à vontade sem afetar nada real nem ninguém. Montar esse laboratório já é, por si só, um ótimo exercício de redes e sistemas.\n\nDepois vêm as **plataformas de desafios**, criadas justamente pra ensinar segurança de forma prática e autorizada. Plataformas como o **TryHackMe** oferecem trilhas guiadas pra iniciantes, com máquinas vulneráveis preparadas pra você explorar dentro das regras. São o caminho mais didático pra sair da teoria.\n\nE há os **CTFs** (Capture The Flag), competições de segurança em que você resolve desafios pra encontrar "bandeiras" escondidas. Existem CTFs pra todos os níveis, inclusive pra iniciantes, e eles são divertidos, viciantes e excelentes pra aprender, porque ensinam a pensar como quem resolve problemas de segurança, num ambiente totalmente legal e controlado.\n\nA regra de ouro se repete porque é a mais importante de toda a área: pratique apenas no que é seu ou no que foi explicitamente feito pra ser testado. Curiosidade é uma qualidade essencial em segurança, desde que canalizada pros lugares certos. Esses ambientes existem exatamente pra que você possa ser curioso sem cruzar a linha.',
        },
        {
          id: "carreira.certificacoes",
          title: "Certificações",
          description:
            "Como o mercado de segurança costuma validar conhecimento.",
          content:
            "Cibersegurança é uma das áreas de tecnologia onde **certificações** pesam mais. O motivo é o nível de confiança envolvido: empresas dão a profissionais de segurança acesso ao que têm de mais sensível, e certificações funcionam como um selo reconhecido de que a pessoa domina certos fundamentos.\n\nPara quem está começando, a certificação mais citada como porta de entrada é a **CompTIA Security+**, que cobre uma base ampla de conceitos de segurança e é amplamente reconhecida pelo mercado como ponto de partida. Ela não foca numa ferramenta específica, e sim nos fundamentos que esta trilha apresenta, o que a torna um bom objetivo pra consolidar o aprendizado.\n\nConforme você avança e escolhe um caminho, surgem certificações mais especializadas: há trilhas voltadas pro lado ofensivo (pentest), outras pro defensivo (análise, resposta a incidentes), e níveis mais avançados para profissionais experientes. Não é preciso decidir tudo agora; o importante é saber que existe um caminho de certificações que acompanha a evolução da carreira.\n\nUm conselho equilibrado: certificação ajuda muito a entrar e a passar por filtros de recrutamento, mas não substitui conhecimento e prática reais. O ideal é usá-la como meta de estudo que organiza o aprendizado, não como atalho pra decorar respostas. Uma certificação acompanhada de um laboratório pessoal, desafios resolvidos e capacidade de explicar o que você sabe vale muito mais que o certificado sozinho.",
          resources: [
            {
              label: "CompTIA Security+ (página oficial)",
              url: "https://www.comptia.org/certifications/security",
              kind: "doc",
            },
          ],
        },
        {
          id: "carreira.projeto",
          title: "Projeto final: SIEM doméstico",
          description:
            "Coleta e análise de logs num SIEM caseiro, aplicando a visão defensiva da trilha.",
          project: "siem-domestico-logs",
        },
        {
          id: "carreira.entrar",
          title: "Entrar na carreira",
          description:
            "Caminhos realistas pra conseguir a primeira oportunidade em segurança.",
          optional: true,
          content:
            "Cibersegurança raramente é um primeiro emprego em tecnologia, e entender isso ajuda a traçar um caminho realista. A área exige base sólida em sistemas e redes, então muita gente chega a ela vinda de outras funções de TI, como suporte, redes ou desenvolvimento, que já dão essa fundação.\n\nIsso aponta dois caminhos comuns de entrada. O primeiro é começar numa função de TI mais geral e migrar pra segurança conforme constrói base e demonstra interesse. O segundo é mirar direto em posições defensivas de entrada, como **analista de SOC júnior**, que é uma das portas mais acessíveis pra quem está começando especificamente em segurança, e onde há bastante demanda.\n\nPara se destacar sem experiência formal, mostre prática concreta. Documente seu laboratório pessoal, os desafios e CTFs que você resolveu, as trilhas que completou em plataformas de treino. Esse histórico funciona como portfólio e prova curiosidade e iniciativa, qualidades muito valorizadas na área. Uma certificação de base, como a Security+, soma a isso ao passar pelos filtros de recrutamento.\n\nDuas qualidades pesam tanto quanto a técnica. A **ética inquestionável**, que é pré-requisito, não diferencial, porque ninguém dá acesso sensível a quem não confia. E o **aprendizado contínuo**, porque ameaças e tecnologias mudam o tempo todo, e o profissional de segurança nunca para de estudar.\n\nO caminho é mais longo que o de algumas áreas, mas a demanda é alta e o trabalho é fascinante pra quem gosta de investigar e proteger. Construa a base com paciência, pratique sempre no lugar certo, e as portas se abrem.",
        },
      ],
    },
  ],
};
