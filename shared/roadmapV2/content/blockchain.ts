import type { RoadmapV2 } from "../types";

export const blockchain: RoadmapV2 = {
  slug: "blockchain",
  area: "blockchain",
  title: "Blockchain e Web3 do Zero",
  level: "Iniciante",
  description:
    "Dos fundamentos de blockchain ao Solidity, contratos inteligentes, integração Web3 e a segurança que essa área exige acima de tudo. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é blockchain e Web3, como uma blockchain funciona e que expectativas ter na área.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é blockchain e Web3",
          description:
            "Aplicações que rodam em redes descentralizadas, sem um dono central.",
          content:
            "Blockchain é uma tecnologia de **registro distribuído**: em vez de um banco de dados controlado por uma única empresa, os dados ficam guardados de forma replicada e verificável numa rede de muitos computadores, sem um dono central. O desenvolvedor de blockchain (ou Web3) cria aplicações que rodam sobre essas redes, sendo a **Ethereum** a mais usada pra desenvolvimento.\n\nO coração desse trabalho são os **contratos inteligentes** (smart contracts): programas que vivem na blockchain e executam regras automaticamente, sem intermediários. Um contrato pode, por exemplo, transferir um valor quando uma condição é cumprida, registrar a posse de um item digital, ou administrar uma votação, tudo de forma automática e visível a todos. Essas aplicações alimentam áreas como finanças descentralizadas (DeFi), tokens, NFTs e identidade digital.\n\nO termo **Web3** descreve essa visão de uma internet mais descentralizada, onde aplicações rodam sobre blockchains em vez de servidores controlados por uma empresa só. Na prática, o desenvolvedor escreve os contratos (geralmente na linguagem **Solidity**) e conecta aplicações web a eles.\n\nUm ponto que define a área e merece destaque desde já: a **segurança é levada a sério como em poucas áreas**, porque os contratos lidam com valores reais e, uma vez publicados, são difíceis ou impossíveis de alterar. Um erro pode causar prejuízo irreversível. Por isso, auditoria e segurança não são um detalhe do fim; são uma preocupação do início ao fim, e esta trilha as trata com o peso que merecem.\n\nÉ uma área de nicho, técnica e fascinante pra quem une programação com curiosidade por finanças e tecnologia descentralizada. A próxima parte ajusta as expectativas com honestidade.",
        },
        {
          id: "fundamentos.comofunciona",
          title: "Como funciona uma blockchain",
          description:
            "Blocos, descentralização e por que os dados são tão difíceis de adulterar.",
          content:
            "Pra desenvolver sobre uma blockchain, você precisa entender como ela funciona por baixo. A intuição é mais simples do que o hype sugere.\n\nO nome vem de **cadeia de blocos**: as transações são agrupadas em blocos, e cada bloco é ligado ao anterior de forma criptográfica, formando uma corrente. Essa ligação usa **hashes** (impressões digitais matemáticas dos dados), e o detalhe genial é que alterar um bloco antigo mudaria seu hash, quebrando a ligação com todos os blocos seguintes. Isso torna o histórico praticamente **imutável**: adulterar um dado já registrado é detectável e inviável na prática.\n\nA segunda peça é a **descentralização**. A blockchain não vive num servidor; ela é replicada em muitos computadores (os nós) espalhados pela rede, que mantêm cópias idênticas e concordam sobre o estado atual através de um mecanismo de **consenso**. Como não há um ponto central de controle, não há um único lugar pra atacar, censurar ou desligar. Essa é a fonte da resistência da blockchain.\n\nUm conceito central pro desenvolvedor é o **gas**: como a rede é compartilhada por todos, cada operação custa uma taxa (paga na moeda da rede), o que remunera quem mantém a rede e evita abuso. Isso significa que, ao contrário de um sistema comum, **executar código na blockchain custa dinheiro**, e otimizar para gastar menos gas é parte do trabalho.\n\nVocê não precisa entender a fundo a matemática do consenso pra começar a desenvolver, mas precisa da intuição: dados imutáveis, rede descentralizada, e custo por operação. Esses três conceitos explicam por que desenvolver para blockchain é diferente de desenvolver um sistema comum, e moldam todas as decisões técnicas adiante. A documentação da Ethereum, disponível em português, é uma referência excelente.",
          resources: [
            {
              label: "Ethereum.org: documentação para desenvolvedores (pt-BR)",
              url: "https://ethereum.org/pt-br/developers/docs/",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.expectativas",
          title: "Expectativas realistas",
          description:
            "Uma conversa honesta sobre o mercado e os riscos antes de investir tempo.",
          content:
            "Como em toda área cercada de hype, vale calibrar as expectativas antes de investir tempo. Blockchain tem características próprias que pesam na decisão de carreira.\n\nÉ uma área de **nicho** e mais **volátil** que outras de tecnologia. O mercado oscila com os ciclos do mundo cripto: em momentos de alta, surgem muitas vagas e oportunidades; em momentos de baixa, o setor encolhe. Isso traz salários competitivos e demanda real, puxada por projetos cripto e por iniciativas institucionais, como moedas digitais de bancos centrais, mas também mais instabilidade que áreas consolidadas. Entrar com a consciência dessa volatilidade evita frustração.\n\nUm pré-requisito honesto: blockchain **costuma exigir base sólida de programação** antes. Não é uma primeira porta de entrada em tecnologia; o ideal é já saber programar (lógica e JavaScript, em especial) antes de mergulhar em Solidity e contratos. Tentar aprender blockchain sem essa base costuma travar.\n\nE a característica que mais define a área, que vale repetir porque muda tudo: a **segurança é prioridade absoluta**. Diferente de um app comum, onde um bug você corrige com um update, um contrato inteligente publicado lida com valores reais e é imutável. Um erro pode causar prejuízo irreversível, e a história da área é cheia de casos de milhões perdidos por uma falha de contrato. Isso exige uma disciplina de cuidado e auditoria que poucas áreas pedem.\n\nO recado não é desanimar, é entrar com os olhos abertos: se você tem base de programação, curiosidade genuína por tecnologia descentralizada e tolerância a um mercado volátil, é uma área técnica e recompensadora. Esta trilha te dá o mapa, com a segurança como fio condutor.",
        },
      ],
    },
    {
      id: "bases",
      title: "Pré-requisitos",
      description:
        "A base de programação e os conceitos de blockchain que sustentam o desenvolvimento Web3.",
      level: "iniciante",
      children: [
        {
          id: "bases.programacao",
          title: "Base de programação",
          description:
            "Saber programar bem antes de partir para os contratos inteligentes.",
          content:
            "Antes de Solidity e contratos, vem a programação. Blockchain é uma especialização que se constrói sobre uma base de desenvolvimento, e tentar pular essa etapa é a causa mais comum de quem desiste no meio do caminho.\n\nA linguagem mais relevante pra começar é o **JavaScript** (e o TypeScript, sua versão com tipos), por dois motivos. Primeiro, porque o ecossistema de ferramentas Web3 (as bibliotecas que conectam aplicações à blockchain, os ambientes de desenvolvimento) é majoritariamente em JavaScript. Segundo, porque a própria Solidity, que você aprenderá em seguida, tem sintaxe inspirada em linguagens dessa família, então o aprendizado se transfere.\n\nO que dominar: os fundamentos da linguagem (variáveis, condicionais, laços, funções, objetos e arrays), o trabalho com **assincronismo** (`async`/`await`, onipresente porque conversar com a blockchain sempre acontece em segundo plano), e noções de como aplicações web funcionam, já que boa parte do trabalho é conectar uma interface web a contratos na blockchain.\n\nSe você já vem do desenvolvimento web ou de outra área de programação, ótimo: a maior parte desse conhecimento se transfere direto, e você pode avançar mais rápido pros conceitos específicos de blockchain. Se está começando do zero, vale construir essa base primeiro, eventualmente passando por uma trilha de programação antes de retornar a esta.\n\nA mentalidade certa: blockchain não substitui saber programar, ela exige saber programar. Quanto mais sólida a sua base, mais fácil será entender Solidity, escrever contratos corretos e, principalmente, evitar os erros que na blockchain custam caro.",
          resources: [
            {
              label: "MDN: JavaScript",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript",
              kind: "doc",
            },
          ],
        },
        {
          id: "bases.conceitos",
          title: "Conceitos de blockchain e cripto",
          description:
            "Carteiras, chaves e gas: o vocabulário prático do desenvolvedor Web3.",
          content:
            "Sobre a base de programação, você precisa do vocabulário prático que aparece todos os dias no desenvolvimento blockchain. São conceitos que conectam a teoria da seção anterior com o dia a dia.\n\nA **carteira** (wallet) é como você interage com a blockchain. Ela guarda um par de chaves criptográficas: uma **chave pública**, que funciona como seu endereço (onde os outros te enviam valores), e uma **chave privada**, o segredo que prova que você é o dono e autoriza transações. A mecânica geral da criptografia de chave pública e privada é assunto da trilha de cibersegurança, que a detalha; aqui o que importa é o papel específico dela na blockchain, onde a chave é a base da posse e da assinatura, não apenas da confidencialidade. A regra de ouro, que vale tanto pro usuário quanto pro dev, é absoluta: **quem tem a chave privada tem o controle total**. Perdeu a chave, perdeu o acesso, sem recuperação; vazou a chave, perdeu os fundos. Essa responsabilidade irreversível é uma marca da área. A **MetaMask** é a carteira mais usada no desenvolvimento, e você a usará pra testar suas aplicações.\n\nOs **tokens** são ativos digitais que vivem na blockchain. Podem ser moedas, pontos, ou representar a posse de algo. Existem padrões que definem como criá-los, como você verá nos contratos.\n\nO **gas**, mencionado antes, é a taxa paga por cada operação na rede. Pro desenvolvedor, isso tem implicações práticas: código ineficiente custa mais caro pra rodar, então otimização tem peso financeiro real, diferente de um sistema comum.\n\nE há as **redes de teste** (testnets): cópias da blockchain feitas pra desenvolvimento, onde você publica e testa contratos usando moeda sem valor real. É nelas que você praticará tudo nesta trilha, sem arriscar dinheiro de verdade, antes de qualquer coisa ir pra a rede principal. Entender esses conceitos te dá o terreno pra começar a escrever contratos com segurança.",
        },
      ],
    },
    {
      id: "solidity",
      title: "Solidity e contratos",
      description:
        "A linguagem dos contratos inteligentes e como escrever o seu primeiro.",
      level: "intermediario",
      children: [
        {
          id: "solidity.linguagem",
          title: "Solidity",
          description:
            "A linguagem mais usada para escrever contratos inteligentes.",
          content:
            "A linguagem dominante pra escrever contratos inteligentes na Ethereum (e em várias outras redes compatíveis) é o **Solidity**. Ela foi criada especificamente pra esse fim, e tem sintaxe inspirada em linguagens como JavaScript, o que facilita pra quem já programa.\n\nO Solidity tem características próprias que refletem o ambiente onde roda. É **tipado estaticamente** (você declara os tipos das variáveis), o que ajuda a evitar erros, importante num contexto onde erros custam caro. Tem tipos específicos do mundo blockchain, como tipos pra endereços de carteira e pra valores monetários da rede. E organiza o código em torno do conceito de **contrato**, que é parecido com uma classe na programação orientada a objetos: agrupa dados (o estado guardado na blockchain) e funções (as ações que o contrato pode executar).\n\nUm conceito fundamental e único: o **estado do contrato fica armazenado na blockchain**, de forma permanente. Variáveis de estado que você define persistem entre as chamadas e ficam visíveis pra todos. E como guardar e alterar dados na blockchain custa gas, você aprende a ser econômico com o que armazena, um cuidado que não existe na programação comum.\n\nOutro ponto que diferencia: as funções têm modificadores de **visibilidade e permissão** (quem pode chamar o quê) que importam muito pra segurança. Esquecer de restringir uma função sensível é uma falha clássica e grave.\n\nA melhor forma de começar é interativa: o **CryptoZombies** ensina Solidity construindo um jogo no navegador, de forma divertida e gradual, e é uma das portas de entrada mais recomendadas da área. A documentação oficial do Solidity é a referência completa pra consultar conforme avança.",
          resources: [
            {
              label: "Solidity: documentação oficial",
              url: "https://docs.soliditylang.org/",
              kind: "doc",
            },
            {
              label: "Ethereum.org: contratos inteligentes (pt-BR)",
              url: "https://ethereum.org/pt-br/developers/docs/smart-contracts/",
              kind: "doc",
            },
            {
              label: "CryptoZombies (Solidity interativo, gratuito)",
              url: "https://cryptozombies.io/",
              kind: "curso",
            },
          ],
        },
        {
          id: "solidity.contrato",
          title: "Escrever e fazer deploy",
          description:
            "Do código do contrato à sua publicação numa rede de teste.",
          content:
            "Aprender a sintaxe é o começo; o ciclo completo é **escrever, testar e fazer deploy** de um contrato. Esse fluxo é o trabalho prático do dia a dia, e felizmente há um caminho amigável pra iniciantes.\n\nA forma mais simples de começar é o **Remix**, um ambiente de desenvolvimento que roda direto no navegador, sem instalar nada. Nele você escreve o contrato em Solidity, compila, e faz o **deploy** (publica) numa rede de teste com poucos cliques, podendo interagir com o contrato logo em seguida. É perfeito pra dar os primeiros passos e ver um contrato funcionando de verdade.\n\nO conceito de **deploy** é central e tem um peso especial aqui. Publicar um contrato é enviá-lo pra blockchain, onde ele passa a existir num endereço e fica acessível. E lembre-se da imutabilidade: uma vez publicado, o contrato geralmente **não pode ser alterado**. Por isso você sempre testa exaustivamente numa **rede de teste** (testnet), onde tudo funciona como na rede real mas sem dinheiro de verdade, antes de cogitar publicar na rede principal.\n\nConforme os projetos crescem, você migra do Remix pra ferramentas mais robustas, que rodam na sua máquina e permitem fluxos profissionais: o **Hardhat** e o **Foundry** são os ambientes de desenvolvimento mais usados, oferecendo compilação, testes automatizados e scripts de deploy. Os **testes automatizados** merecem destaque: dada a impossibilidade de corrigir um contrato publicado, testar cada cenário antes do deploy não é opcional, é essencial. Um bom desenvolvedor de blockchain escreve muitos testes.\n\nO objetivo desta etapa é conseguir levar um contrato simples do código ao deploy numa testnet e interagir com ele. Quando você vê seu próprio contrato funcionando na rede, a teoria vira realidade.",
          resources: [
            {
              label: "Hardhat: documentação oficial",
              url: "https://hardhat.org/docs",
              kind: "doc",
            },
            {
              label: "Foundry: livro oficial",
              url: "https://book.getfoundry.sh/",
              kind: "doc",
            },
          ],
        },
        {
          id: "solidity.testes",
          title: "Testar antes do deploy",
          description:
            "Por que testar um contrato é diferente, e o que testar antes que seja tarde.",
          content:
            "Em quase todo software, testar é uma boa prática; em contratos inteligentes, é a diferença entre um projeto sério e um prejuízo. O motivo é o que esta trilha repete: o **deploy é irreversível** e o contrato lida com **dinheiro real**. Não existe corrigir em produção com um update; se um bug foi publicado, a única saída costuma ser migrar tudo para um novo contrato, um processo caro e traumático. Então o teste não vem depois, vem **antes**, e é a sua principal linha de defesa.\n\nO que testar vai além do caminho feliz. **O caminho feliz**: o contrato faz o que promete quando tudo dá certo. **As permissões**: só quem tem direito consegue chamar as funções sensíveis, e um estranho é barrado (controle de acesso mal feito é das falhas mais comuns). **Os valores limite**: o zero, o máximo, o saldo insuficiente, os números que estouram. E, em noção, a **reentrância**: garantir que uma chamada externa não consiga reentrar no seu contrato e drená-lo antes de ele atualizar o estado. Essas categorias você aprofunda em segurança de smart contracts; aqui o ponto é que o teste precisa cobri-las.\n\nA ferramenta natural desse trabalho é um ambiente do ecossistema, como o **Hardhat** ou o **Foundry**, que rodam seus testes automaticamente e simulam a blockchain na sua máquina, de graça e em segundos. Você escreve cenários que exercitam o contrato de todos os ângulos e roda a suíte inteira a cada mudança.\n\nE, mesmo com a suíte passando, o passo final antes da rede principal é sempre a **testnet**: publicar numa rede de teste, onde tudo funciona como no real mas com moeda sem valor, e exercitar o contrato ali. A testnet é o ensaio geral obrigatório; pular direto pra mainnet com dinheiro de verdade é o erro que a área inteira aprendeu a não cometer. Você domina esta etapa quando, antes de imaginar um deploy na rede principal, tem uma suíte que cobre caminho feliz, permissões e valores limite, e o contrato já rodou numa testnet.",
          resources: [
            {
              label: "Ethereum.org: testar contratos inteligentes (pt-BR)",
              url: "https://ethereum.org/pt-br/developers/docs/smart-contracts/testing/",
              kind: "doc",
            },
          ],
        },
        {
          id: "solidity.erc",
          title: "Padrões ERC: tokens e NFTs",
          description:
            "Os modelos consagrados que padronizam tokens e ativos digitais.",
          content:
            "Boa parte das aplicações blockchain envolve **tokens**, e a comunidade Ethereum criou **padrões** que definem como eles devem funcionar, pra que carteiras, exchanges e aplicações saibam interagir com qualquer token da mesma forma. Esses padrões se chamam **ERC**, e dois são fundamentais.\n\nO **ERC-20** é o padrão de **tokens fungíveis**: tokens intercambiáveis e divisíveis, como uma moeda, onde uma unidade vale o mesmo que outra. É usado pra criar moedas, pontos, ações tokenizadas. O padrão define um conjunto de funções que todo token ERC-20 deve ter (transferir, consultar saldo, autorizar gastos), e seguir esse padrão garante que seu token funcione em qualquer carteira e plataforma compatível.\n\nO **ERC-721** é o padrão de **tokens não fungíveis** (os famosos NFTs): cada token é único e indivisível, representando a posse de algo específico, como uma obra de arte digital, um item de jogo ou um certificado. Diferente do ERC-20, onde as unidades são idênticas, cada NFT tem identidade própria.\n\nUm conceito que economiza tempo e, principalmente, aumenta a segurança: você **não escreve esses contratos do zero**. A **OpenZeppelin** mantém implementações desses padrões que são abertas, amplamente revisadas e consideradas seguras pela comunidade. A prática recomendada é partir dessas implementações consagradas e construir sobre elas, em vez de reinventar (e arriscar introduzir falhas). Reaproveitar código auditado por milhares de pessoas é muito mais seguro que escrever o seu.\n\nProjetos clássicos de aprendizado nascem daqui: criar seu próprio token ERC-20 numa rede de teste, ou um marketplace simples de NFTs com ERC-721. Eles exercitam tudo que você viu e rendem ótimas peças de portfólio.",
          resources: [
            {
              label: "OpenZeppelin Contracts (implementações seguras)",
              url: "https://docs.openzeppelin.com/contracts/",
              kind: "doc",
            },
            {
              label: "EIP-20: padrão de token (oficial)",
              url: "https://eips.ethereum.org/EIPS/eip-20",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "web3",
      title: "Integração Web3",
      description:
        "Conectar aplicações web aos contratos, dando uma interface utilizável às pessoas.",
      level: "intermediario",
      children: [
        {
          id: "web3.integracao",
          title: "Conectar a aplicação à blockchain",
          description:
            "Ligar uma interface web aos contratos para que pessoas possam usá-los.",
          content:
            'Um contrato inteligente sozinho não tem interface; as pessoas precisam de uma **aplicação web** pra interagir com ele de forma amigável. Conectar o front-end aos contratos é o que transforma um contrato numa aplicação descentralizada (**DApp**) usável, e é uma habilidade central do desenvolvedor Web3, especialmente pra quem vem do front-end.\n\nA ponte entre a aplicação web e a blockchain é feita por bibliotecas como a **ethers.js**, que permitem ao seu código JavaScript ler dados dos contratos e enviar transações pra eles. Com ela, você chama as funções do contrato a partir da interface, exibe informações da blockchain na tela, e dispara ações quando o usuário interage.\n\nA peça que conecta o usuário é a **carteira**, como a MetaMask. Em vez de o seu site guardar senhas, ele se conecta à carteira do usuário: quando uma ação precisa de autorização (enviar uma transação, transferir um token), a carteira aparece pedindo a confirmação da pessoa, que assina com sua chave privada sem nunca expô-la ao site. Esse fluxo de "conectar carteira" e "confirmar transação" é a experiência típica de uma DApp, e implementá-lo é parte do trabalho.\n\nUm detalhe de experiência importante: como as transações na blockchain levam tempo pra serem confirmadas (e custam gas), a aplicação precisa lidar bem com esses estados, mostrando que algo está em andamento, tratando confirmações e falhas, e sendo clara sobre custos. Uma DApp que não comunica isso confunde o usuário.\n\nA documentação da ethers.js e da MetaMask são as referências práticas pra essa integração. Construir uma aplicação web simples que lê e escreve num contrato seu é o exercício que une o back-end (contratos) com o front-end (interface), fechando o ciclo de uma DApp completa.',
          resources: [
            {
              label: "ethers.js: documentação oficial",
              url: "https://docs.ethers.org/",
              kind: "doc",
            },
            {
              label: "MetaMask: documentação para desenvolvedores",
              url: "https://docs.metamask.io/",
              kind: "doc",
            },
          ],
        },
        {
          id: "web3.eventos",
          title: "Ler dados e eventos on-chain",
          description:
            "O lado da leitura: mostrar o estado da blockchain e reagir a eventos.",
          content:
            "A folha anterior tratou de **escrever** na blockchain, enviar transações. Uma DApp completa também precisa **ler**: mostrar saldos, status e histórico na tela, e reagir quando algo acontece on-chain. Esse lado da leitura tem uma diferença importante: ler o estado de um contrato **não custa gas** nem exige assinatura, porque não altera nada, é só uma consulta. Escrever custa e precisa de confirmação; ler é barato e imediato.\n\nHá duas formas principais de obter dados. A primeira é **consultar o estado** diretamente: chamar as funções de leitura do contrato pela ethers.js pra buscar um valor atual (o saldo de um token, o dono de um NFT). A segunda são os **eventos**: contratos emitem eventos quando algo relevante acontece (uma transferência, um registro criado), e a sua aplicação pode escutá-los pra atualizar a interface na hora ou reconstruir um histórico. Eventos são a forma padrão de a blockchain avisar o mundo de fora que algo mudou.\n\nUm detalhe que confunde iniciantes: a blockchain guarda o estado atual de forma barata de consultar, mas montar um histórico rico (todas as transferências de um usuário, por exemplo) relendo eventos pode ser pesado. Por isso existem serviços de indexação que organizam esses dados pra consulta rápida, algo que você conhece de nome agora e aprofunda quando precisar.\n\nJuntando as duas folhas, você tem o ciclo completo de uma DApp: ler o estado pra informar o usuário, e escrever transações quando ele decide agir. Você domina esta etapa quando sua aplicação exibe um dado que vive num contrato e atualiza a tela em resposta a um evento emitido on-chain, sem o usuário precisar recarregar a página.",
        },
      ],
    },
    {
      id: "seguranca",
      title: "Segurança e auditoria",
      description:
        "A prioridade absoluta da área: contratos lidam com valores reais e não podem ser corrigidos depois.",
      level: "avancado",
      children: [
        {
          id: "seguranca.seguranca",
          title: "Segurança de smart contracts",
          description:
            "Por que um bug aqui é diferente, e as falhas que você precisa conhecer.",
          content:
            "Aqui está o tema que mais define a maturidade de um desenvolvedor de blockchain. Em quase toda área de software, um bug é um problema que você corrige com uma atualização. Em smart contracts, é diferente em dois aspectos que mudam tudo: o contrato lida com **valores reais** e, uma vez publicado, costuma ser **imutável**. Isso significa que um bug pode causar prejuízo irreversível, sem chance de corrigir depois. A história da área tem casos famosos de milhões perdidos por uma única falha.\n\nPor isso, a mentalidade do desenvolvedor blockchain precisa ser **defensiva e paranoica** desde a primeira linha. Você programa esperando que pessoas mal-intencionadas vão tentar explorar cada brecha do seu contrato, porque na blockchain o código é público e os incentivos pra atacar são diretos: dinheiro.\n\nExistem categorias conhecidas de vulnerabilidades que todo desenvolvedor precisa estudar. Entre as mais clássicas estão os ataques de **reentrância** (quando um contrato malicioso chama o seu repetidamente antes de ele terminar de atualizar seu estado, drenando fundos), os problemas de **controle de acesso** (funções sensíveis que ficaram sem a devida restrição de quem pode chamá-las), e os erros de **aritmética**. Você não precisa decorar todas agora, mas precisa saber que elas existem e estudá-las a sério.\n\nA própria documentação do Solidity tem uma seção dedicada a considerações de segurança, leitura obrigatória. E há um princípio prático que reduz muito o risco: **reutilize código consagrado e auditado** (como as implementações da OpenZeppelin) em vez de escrever tudo do zero, porque código revisado por milhares de pessoas é muito mais seguro que o seu recém-escrito. Segurança, em blockchain, não é um tópico avançado opcional; é o centro do ofício.",
          resources: [
            {
              label: "Solidity: considerações de segurança (oficial)",
              url: "https://docs.soliditylang.org/en/latest/security-considerations.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "seguranca.auditoria",
          title: "Auditoria e boas práticas",
          description:
            "Os processos que reduzem o risco antes de um contrato ir para a rede real.",
          content:
            "Como os erros são tão caros e irreversíveis, a área desenvolveu processos rigorosos pra reduzir o risco **antes** de um contrato ir pra a rede principal. Conhecê-los, mesmo que no início você só os aplique de forma simples, é parte de pensar como um profissional de blockchain.\n\nA prática mais importante são os **testes exaustivos**. Antes de qualquer deploy, você testa o contrato em todos os cenários imagináveis, incluindo os casos de borda e as tentativas de uso indevido, usando as ferramentas de teste do Hardhat ou do Foundry. Dado que não dá pra corrigir depois, testar é a sua principal linha de defesa, e a cobertura precisa ser muito mais cuidadosa que num software comum.\n\nA **auditoria** é o passo seguinte: a revisão do código por outras pessoas especializadas em segurança de contratos, que procuram falhas que o autor não enxergou. Projetos sérios que vão lidar com valores significativos passam por auditorias profissionais antes de lançar, e a habilidade de auditar (ler contratos procurando vulnerabilidades) é, ela própria, uma especialização valorizada e bem paga dentro da área.\n\nAlgumas boas práticas viram hábito. **Manter os contratos simples**, porque complexidade esconde bugs. **Reutilizar implementações consagradas** em vez de reinventar. **Testar primeiro nas redes de teste**, sempre. E adotar a mentalidade de **lançar aos poucos**, com cautela, em vez de colocar tudo de uma vez na rede principal com valores altos.\n\nO conselho que a própria área repete pra iniciantes: estude segurança e auditoria **desde cedo**, não como um tópico pra depois. Em blockchain, a diferença entre um desenvolvedor competente e um perigoso é justamente o quanto ele leva a segurança a sério. Essa disciplina é o que protege você, seus usuários e o seu nome.",
        },
      ],
    },
    {
      id: "carreira",
      title: "Carreira",
      description:
        "Construir um portfólio on-chain e dar os primeiros passos numa área de nicho e técnica.",
      level: "avancado",
      children: [
        {
          id: "carreira.projeto",
          title: "Projeto final: dapp de registro em testnet",
          description:
            "Um contrato publicado e verificável em testnet com front simples, a trilha virando produto.",
          content:
            "Esta é a hora de fechar o ciclo completo de uma DApp e transformar a trilha num artefato público e verificável, a maior vantagem de portfólio da área. Você aprendeu a escrever contratos em Solidity, a testá-los antes do deploy, os padrões de token, a integração Web3 e a disciplina de segurança que define o ofício. O projeto final junta tudo numa aplicação de ponta a ponta.\n\nO projeto vinculado te encomenda um **DApp de registro publicado numa testnet**: um contrato que guarda algum registro on-chain (uma mensagem, um item, um comprovante), escrito e testado por você, mais uma interface web simples que conecta a carteira do usuário, lê o estado do contrato e envia transações pra ele. Tudo roda numa rede de teste, com moeda sem valor real, exatamente como a trilha insistiu: a testnet é onde a prática acontece, nunca a mainnet com dinheiro de verdade.\n\nComo o trabalho fica público, capriche na segurança visível: um contrato simples, testado, partindo de implementações consagradas onde fizer sentido. Você chega ao fim quando qualquer pessoa consegue abrir o endereço do seu contrato na testnet, ver que ele está publicado, e usar a sua interface pra ler e gravar um registro conectando a própria carteira. Um DApp que passa nesse teste é a peça de portfólio mais convincente que você pode ter na área.",
          project: "dapp-registro-testnet",
        },
        {
          id: "carreira.entrar",
          title: "Entrar na carreira",
          description:
            "Como construir experiência e se posicionar numa área que valoriza o que você constrói.",
          content:
            "Blockchain é uma área de nicho, técnica e volátil, mas com salários competitivos e uma característica que favorece quem está começando: o trabalho é **público e verificável**. Os contratos que você publica e o código que você escreve ficam visíveis, o que torna o portfólio especialmente poderoso pra provar capacidade.\n\nA fórmula pra entrar começa, como visto, pela **base de programação** sólida (lógica e JavaScript), sem a qual o resto não se sustenta. Sobre ela, domine os fundamentos desta trilha: como a blockchain funciona, Solidity, o ciclo de escrever e fazer deploy de contratos, os padrões ERC, a integração Web3 e, com peso especial, a segurança.\n\nPara o portfólio, construa **projetos completos em redes de teste**, documentados no GitHub. Os clássicos da área são ótimos: um token ERC-20 próprio, uma aplicação de votação on-chain, um marketplace simples de NFTs. Cada um exercita o ciclo completo (contrato, testes, deploy, integração) e demonstra que você sabe construir de ponta a ponta. Mostrar contratos testados, com atenção visível à segurança, vale muito.\n\nOs recursos gratuitos da área são excelentes e muito recomendados pra trilhar esse caminho: plataformas interativas como o CryptoZombies pra aprender Solidity, bootcamps gratuitos focados em desenvolvimento Ethereum, e a documentação oficial da Ethereum, disponível em português. A comunidade é ativa e cheia de material aberto.\n\nDuas qualidades fecham o perfil. A **disciplina de segurança**, que é o que mais distingue um bom desenvolvedor de blockchain, demonstrável pela forma como você testa e cuida dos seus contratos. E a **tolerância à volatilidade** do mercado, entrando com expectativas realistas. Se você tem base de programação e curiosidade genuína por tecnologia descentralizada, é um caminho técnico e recompensador, e os fundamentos que você construir aqui são valiosos mesmo que você transite para outras áreas de desenvolvimento depois.",
          resources: [
            {
              label: "Alchemy University (bootcamp gratuito de Ethereum)",
              url: "https://university.alchemy.com/",
              kind: "curso",
            },
            {
              label: "Ethereum.org: documentação para desenvolvedores (pt-BR)",
              url: "https://ethereum.org/pt-br/developers/docs/",
              kind: "doc",
            },
          ],
        },
      ],
    },
  ],
};
