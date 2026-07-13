// TODO(Ana): revisao editorial completa desta trilha (titulos, descricoes e
// todo o conteudo em markdown sao novos e precisam de revisao de copy).
import type { RoadmapV2 } from "../types";

export const suporte: RoadmapV2 = {
  slug: "suporte",
  area: "carreira",
  kind: "carreira",
  title: "Suporte Técnico e Help Desk do Zero",
  level: "Iniciante",
  description:
    "A porta de entrada mais acessível da TI: resolver problemas de hardware, software e rede, atender bem o usuário e crescer daí para outras áreas. Não exige diploma nem programação para começar.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que faz um profissional de suporte, os níveis de atendimento e por que essa é a melhor porta de entrada da TI.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.o-que-e",
          title: "O que é suporte técnico",
          description:
            "Ajudar pessoas a usar tecnologia: diagnosticar e resolver problemas de equipamentos, sistemas e acesso.",
          content:
            "Suporte técnico (ou help desk) é a área que ajuda pessoas a usar tecnologia no dia a dia: resolver um computador que não liga, um programa que trava, um acesso que não funciona, uma impressora que não imprime. É a linha de frente da TI, o time que mantém todo mundo trabalhando.\n\nO trabalho combina duas habilidades: a técnica (entender de hardware, software e redes o suficiente para diagnosticar) e a humana (atender com paciência quem está frustrado e muitas vezes não entende de tecnologia). As duas contam igual, e é justamente a segunda que muita gente subestima.\n\nEsta é a porta de entrada mais acessível da TI porque não exige diploma nem saber programar para começar. O que exige é vontade de resolver problemas, disposição para aprender e jeito com pessoas. Muita carreira de sucesso em tecnologia começou atendendo chamados.",
        },
        {
          id: "fundamentos.niveis",
          title: "Níveis de atendimento (N1, N2, N3)",
          description:
            "Como o suporte se organiza em camadas, do primeiro atendimento aos casos mais complexos.",
          content:
            "O suporte costuma ser organizado em níveis, que definem a complexidade do que cada um resolve. O nível 1 (N1) é o primeiro contato: atende o usuário, registra o problema e resolve as questões mais comuns, com apoio de procedimentos e uma base de conhecimento. É onde a maioria começa.\n\nO nível 2 (N2) recebe o que o N1 não conseguiu resolver: problemas mais técnicos, que exigem conhecimento mais profundo ou acesso a sistemas específicos. O nível 3 (N3) lida com os casos mais complexos, muitas vezes envolvendo especialistas de infraestrutura, redes ou desenvolvimento.\n\nEntender essa estrutura ajuda de duas formas: mostra o caminho natural de crescimento (do N1 para os níveis acima) e ensina uma habilidade central do trabalho, que é saber a hora de resolver e a hora de escalar, encaminhando o problema para quem tem o conhecimento certo, sem travar o usuário.",
        },
      ],
    },
    {
      id: "hardware-software",
      title: "Hardware e software",
      description:
        "Conhecer as peças do computador e como o software é instalado e mantido, a base técnica do suporte.",
      level: "iniciante",
      children: [
        {
          id: "hardware.componentes",
          title: "Componentes do computador",
          description:
            "Processador, memória, armazenamento e o resto: o que cada peça faz e como diagnosticar.",
          content:
            "Para dar suporte, você precisa entender do que um computador é feito. As peças principais: o processador (CPU), que executa as instruções; a memória RAM, que guarda o que está em uso no momento; o armazenamento (HD ou SSD), que guarda os dados de forma permanente; a placa-mãe, que conecta tudo; e a fonte, que alimenta o conjunto.\n\nConhecer isso não é decorar especificações, e sim entender sintomas. Um computador lento pode ser pouca memória RAM ou um disco cheio; um que não liga pode ser fonte ou energia; um que trava pode ser superaquecimento. Ligar sintoma a componente é o começo do diagnóstico.\n\nSome a isso os periféricos (teclado, mouse, monitor, impressora) e as conexões (cabos, portas USB, HDMI). Boa parte dos chamados de suporte é sobre esses itens do dia a dia, e resolver muitos deles é mais simples do que parece quando você conhece as peças envolvidas.",
        },
        {
          id: "hardware.software",
          title: "Instalação e manutenção de software",
          description:
            "Instalar, atualizar e configurar programas, e lidar com drivers e conflitos.",
          content:
            "Grande parte do suporte é sobre software: instalar um programa, atualizar uma versão, configurar um aplicativo, resolver algo que parou de funcionar depois de uma atualização. Entender como o software se relaciona com o sistema operacional é essencial.\n\nUm conceito importante são os drivers: programas que permitem o sistema conversar com um equipamento (impressora, placa de vídeo, webcam). Muito problema de \"não funciona\" é driver ausente, desatualizado ou com conflito. Saber verificar e atualizar drivers resolve uma categoria inteira de chamados.\n\nManutenção preventiva também conta: manter o sistema e os programas atualizados, remover software desnecessário, limpar arquivos temporários. Muitos problemas nem chegam a acontecer quando a manutenção básica é feita, e ensinar isso ao usuário é parte do trabalho.",
        },
      ],
    },
    {
      id: "sistemas",
      title: "Sistemas operacionais no dia a dia",
      description:
        "Windows, Linux e macOS na prática: contas, permissões e as tarefas que mais aparecem no suporte.",
      level: "iniciante",
      children: [
        {
          id: "sistemas.windows",
          title: "Windows no ambiente de trabalho",
          description:
            "O sistema mais comum em empresas: configurações, contas e a solução dos problemas mais frequentes.",
          content:
            "O Windows é o sistema operacional que você mais vai encontrar em empresas, então dominar seu dia a dia é prioridade. Isso inclui navegar pelas configurações, gerenciar contas de usuário, instalar e desinstalar programas, lidar com atualizações e usar as ferramentas de diagnóstico que o próprio sistema oferece.\n\nAlguns problemas se repetem: computador lento, programa que não abre, atualização travada, impressora que sumiu, senha esquecida. Ter um roteiro mental para cada um (o que verificar primeiro, segundo, terceiro) transforma o atendimento de tentativa e erro em diagnóstico eficiente.\n\nVale também conhecer as ferramentas administrativas básicas: o gerenciador de tarefas para ver o que está travando, o painel de contas, as opções de rede. Você não precisa ser um administrador avançado para começar no N1, mas familiaridade com essas telas acelera muito o atendimento.",
        },
        {
          id: "sistemas.linux-permissoes",
          title: "Noções de Linux e permissões",
          description:
            "Uma base de Linux e o conceito de contas e permissões, que valem em qualquer sistema.",
          content:
            "Muitos servidores e ambientes corporativos usam Linux, e ter uma noção básica dele amplia bastante suas oportunidades no suporte. Não precisa ser especialista: entender a estrutura de pastas, navegar pelo terminal com comandos simples e saber que existe um jeito diferente de instalar programas já é um bom começo.\n\nUm conceito que atravessa todos os sistemas é o de contas de usuário e permissões. Cada pessoa tem uma conta com um nível de acesso, e nem todo mundo pode fazer tudo: instalar programas, mexer em arquivos de sistema ou acessar pastas de outros costuma exigir permissão de administrador. Entender isso explica metade dos problemas de \"não consigo acessar\".\n\nPermissões existem por segurança: limitam o estrago que um erro ou um ataque pode causar. Como suporte, você vai lidar o tempo todo com pedidos de acesso, e saber por que a permissão existe (e por que nem todo pedido deve ser atendido) faz parte do trabalho responsável.",
        },
      ],
    },
    {
      id: "atendimento",
      title: "Atendimento ao usuário",
      description:
        "A metade humana do suporte: comunicar com clareza, ter empatia e transformar frustração em solução.",
      level: "iniciante",
      children: [
        {
          id: "atendimento.comunicacao",
          title: "Comunicação e empatia",
          description:
            "Ouvir o problema real, falar a língua do usuário e manter a calma quando ele não está calmo.",
          content:
            "A parte técnica resolve o computador; a comunicação resolve a pessoa. Quem procura o suporte costuma estar frustrado, com pressa ou constrangido por não entender de tecnologia. A forma como você atende define se a experiência é boa, independentemente de quão rápido o problema é resolvido.\n\nTrês habilidades fazem diferença. Escutar de verdade: deixar a pessoa explicar antes de sair concluindo, porque o problema que ela descreve nem sempre é o problema real. Traduzir: explicar em palavras simples, sem jargão, o que aconteceu e o que você vai fazer. E manter a calma: não absorver a irritação do usuário, respondendo com paciência mesmo quando ele não é paciente.\n\nEssa habilidade é tão valorizada que muitas vezes pesa mais na contratação do que o conhecimento técnico, que se aprende no trabalho. Um bom atendente com base técnica média rende mais para a empresa do que um gênio técnico que trata mal quem pede ajuda.",
        },
        {
          id: "atendimento.processo",
          title: "SLA e processo de atendimento",
          description:
            "Prazos, prioridades e o fluxo de um chamado do registro à resolução.",
          content:
            "O atendimento de suporte segue um processo, não é improviso. Um chamado nasce quando o usuário reporta um problema, é registrado, classificado por prioridade, encaminhado para quem resolve e fechado quando a solução é confirmada. Entender esse fluxo é entender o trabalho.\n\nUm conceito central é o SLA (acordo de nível de serviço): o compromisso de prazo para atender e resolver, que varia conforme a gravidade. Um sistema crítico parado para a empresa toda tem prioridade máxima; uma dúvida simples pode esperar mais. Saber priorizar segundo o impacto, e não só pela ordem de chegada, é uma habilidade que se desenvolve.\n\nRegistrar bem cada chamado (o que aconteceu, o que foi feito, como foi resolvido) parece burocracia, mas é o que constrói o histórico e a base de conhecimento. Da próxima vez que o mesmo problema aparecer, a solução já está documentada, e o atendimento fica mais rápido para todo mundo.",
        },
      ],
    },
    {
      id: "ferramentas",
      title: "Ferramentas de chamado",
      description:
        "Os sistemas de ticket que organizam o trabalho do suporte e a base de conhecimento que o acelera.",
      level: "iniciante",
      children: [
        {
          id: "ferramentas.ticket",
          title: "Sistemas de ticket",
          description:
            "O que são, como registram e acompanham chamados e por que centralizam o trabalho do time.",
          content:
            "Um sistema de ticket (ou service desk) é a ferramenta onde os chamados de suporte são registrados e acompanhados. Cada problema vira um ticket com número, descrição, prioridade, responsável e status, do aberto ao resolvido. É o painel de controle do trabalho do time.\n\nO valor é organização e memória. Sem um sistema desses, os pedidos chegam soltos por e-mail, mensagem e corredor, e se perdem. Com ele, nada cai no esquecimento, dá para ver o que está pendente, quem está cuidando do quê e quanto tempo cada coisa leva. Também gera dados: quais problemas mais aparecem, onde o time está sobrecarregado.\n\nExistem várias ferramentas no mercado, e cada empresa usa a sua, mas o conceito é o mesmo em todas. Aprender a trabalhar orientado a tickets (registrar tudo, atualizar o status, escrever a resolução) é uma habilidade que você leva para qualquer lugar.",
        },
        {
          id: "ferramentas.base-conhecimento",
          title: "Base de conhecimento",
          description:
            "Documentar soluções para que problemas repetidos sejam resolvidos mais rápido, por qualquer um.",
          content:
            "Uma base de conhecimento é o conjunto de artigos e procedimentos que documentam como resolver os problemas mais comuns. Quando um chamado se repete, em vez de reinventar a solução, o atendente consulta o artigo e resolve rápido, seguindo passos já testados.\n\nPara o usuário, boas bases de conhecimento viram autoatendimento: tutoriais que permitem resolver dúvidas simples sozinho, sem abrir chamado. Isso reduz o volume de trabalho do time e devolve autonomia para as pessoas, um ganho para os dois lados.\n\nContribuir com a base é parte do trabalho maduro de suporte. Toda vez que você resolve algo novo, documentar a solução ajuda o time inteiro e o seu eu do futuro. Quem escreve bons artigos de base de conhecimento demonstra organização e visão de processo, qualidades que aceleram o crescimento na carreira.",
        },
      ],
    },
    {
      id: "redes",
      title: "Redes básicas",
      description:
        "O suficiente de redes para resolver os problemas de conexão que dominam boa parte dos chamados.",
      level: "intermediario",
      children: [
        {
          id: "redes.conceitos",
          title: "IP, DNS e como a rede funciona",
          description:
            "Os conceitos mínimos de rede que explicam por que a conexão funciona ou falha.",
          content:
            "Boa parte dos chamados de suporte envolve conexão, então uma base de redes é indispensável. Alguns conceitos abrem quase tudo. O endereço IP identifica cada dispositivo na rede, como um número de casa. O DNS traduz nomes (como site.com) nos endereços que as máquinas usam. O gateway é a saída da rede local para a internet.\n\nEntender o caminho básico ajuda a diagnosticar: o dispositivo pega um endereço na rede, encontra o caminho para fora pelo gateway, e usa o DNS para achar os sites. Quando algo nessa cadeia falha, a internet \"não funciona\", e saber onde procurar (é a máquina? o wifi? o roteador? o provedor?) é o que separa o chute do diagnóstico.\n\nVocê não precisa da profundidade de um especialista em redes para o suporte, mas os conceitos de IP, DNS, gateway e a diferença entre rede local e internet aparecem todos os dias. Se essa parte te fascinar, redes é um dos caminhos naturais de crescimento a partir do suporte.",
        },
        {
          id: "redes.diagnostico",
          title: "Diagnóstico de conexão",
          description:
            "Um roteiro prático para resolver os problemas de rede mais comuns do dia a dia.",
          content:
            "Diante de um \"a internet caiu\", um roteiro de diagnóstico vale mais que sorte. Comece pelo mais simples e vá subindo: o cabo está conectado ou o wifi está ligado? Outros dispositivos na mesma rede funcionam (se sim, o problema é local; se não, é a rede toda)? Reiniciar o equipamento resolve?\n\nAlgumas verificações básicas ajudam a localizar a falha. Testar se a máquina alcança a rede, se consegue traduzir nomes pelo DNS, se o roteador está respondendo. Ferramentas simples de linha de comando (como o ping, que testa se um destino responde) dão pistas rápidas sobre onde a comunicação está travando.\n\nO princípio geral é isolar o problema por partes, do mais próximo ao mais distante, em vez de mexer em tudo ao mesmo tempo. Essa disciplina de eliminar causas uma a uma é a mesma que serve para qualquer diagnóstico técnico, e é uma das habilidades mais transferíveis que o suporte ensina.",
        },
      ],
    },
    {
      id: "seguranca",
      title: "Segurança básica",
      description:
        "Proteger usuários e dados no dia a dia: senhas, golpes, antivírus e backup, sem precisar ser especialista.",
      level: "intermediario",
      children: [
        {
          id: "seguranca.boas-praticas",
          title: "Senhas, phishing e boas práticas",
          description:
            "Os hábitos de segurança que o suporte precisa dominar e ensinar aos usuários.",
          content:
            "Segurança começa nos hábitos, e o suporte é quem orienta os usuários. Senhas fortes e diferentes para cada serviço, o uso de verificação em duas etapas, e o cuidado de nunca compartilhar credenciais são o básico que evita a maioria dos incidentes simples.\n\nO golpe mais comum é o phishing: mensagens falsas que se passam por empresas ou colegas para roubar senhas ou dados, ou instalar algo malicioso. Reconhecer os sinais (remetente estranho, urgência exagerada, links suspeitos, pedidos incomuns) e ensinar os usuários a desconfiar previne uma quantidade enorme de problemas graves.\n\nComo suporte, você é ao mesmo tempo a defesa e o educador: percebe comportamentos de risco, orienta com paciência e reforça as boas práticas sem tratar o usuário como culpado. Segurança que funciona é a que as pessoas entendem e adotam, não a que só existe no papel.",
        },
        {
          id: "seguranca.antivirus-backup",
          title: "Antivírus e backup",
          description:
            "Duas proteções essenciais: prevenir infecções e garantir que os dados sobrevivam a qualquer perda.",
          content:
            "Duas ferramentas formam a proteção básica de qualquer ambiente. O antivírus (e as proteções de segurança do próprio sistema) ajuda a prevenir e remover programas maliciosos. Mantê-lo ativo e atualizado, e saber agir quando algo suspeito é detectado, é tarefa recorrente do suporte.\n\nO backup é a rede de segurança contra a perda de dados: cópias regulares e guardadas em local separado, para que um defeito de disco, um apagão, um ataque de ransomware ou um erro humano não signifiquem perder tudo. A regra de ouro é simples: dado que existe em um só lugar é um dado que você já está arriscando perder.\n\nMuita gente só valoriza o backup depois de perder algo importante, e o suporte é quem evita esse aprendizado doloroso. Garantir que backups existam, funcionem e possam ser restaurados de verdade é uma das contribuições mais valiosas (e mais esquecidas) do profissional de suporte.",
        },
      ],
    },
    {
      id: "carreira",
      title: "Certificações e crescimento",
      description:
        "Como se destacar no suporte e usá-lo como trampolim para outras áreas da tecnologia.",
      level: "intermediario",
      children: [
        {
          id: "carreira.certificacoes",
          title: "Certificações de entrada",
          description:
            "Credenciais reconhecidas que ajudam a conseguir a primeira vaga e organizar o aprendizado.",
          content:
            "Certificações ajudam de duas formas: dão um roteiro de estudo organizado e sinalizam para o mercado que você tem uma base, o que pesa bastante em quem ainda não tem experiência formal. No mundo do suporte e da infraestrutura, algumas são bem conhecidas como porta de entrada.\n\nHá certificações voltadas para fundamentos de TI e suporte que cobrem hardware, sistemas, redes e resolução de problemas, e há certificações sobre boas práticas de gestão de serviços de TI, que ensinam a organizar o atendimento com processos. Vale pesquisar quais são mais valorizadas na sua região e no tipo de empresa que você mira, porque isso varia.\n\nUm aviso honesto: certificação abre porta, mas não substitui prática. Ela é mais poderosa quando combinada com projetos reais, um bom atendimento e a disposição de resolver problemas. Use-a como um complemento ao aprendizado, não como um atalho que dispensa o resto.",
        },
        {
          id: "carreira.crescer",
          title: "Do suporte para onde você quiser",
          description:
            "O suporte é trampolim: os caminhos naturais de crescimento a partir dele.",
          content:
            "O grande valor do suporte na carreira é ser um trampolim. Trabalhando nele, você entende como a tecnologia funciona na prática, conhece a empresa por dentro e descobre quais áreas te atraem, tudo enquanto já está empregado em TI. Poucos pontos de partida oferecem isso.\n\nOs caminhos de crescimento são vários. Quem curte redes e servidores segue para infraestrutura, redes ou administração de sistemas. Quem gosta de automatizar e escalar tende a DevOps ou cloud. Quem se interessa por segurança pode ir para a cibersegurança. E há quem descubra gosto por programação e migre para o desenvolvimento. Cada uma dessas tem trilha própria nesta plataforma.\n\nO segredo é usar o tempo no suporte com intenção: observar quais problemas te empolgam, estudar a área que te chama nas horas livres, e ir construindo a ponte. Muita gente sênior em tecnologia começou atendendo chamado, e o que fez a diferença foi tratar o suporte como começo, não como teto.",
        },
      ],
    },
  ],
};
