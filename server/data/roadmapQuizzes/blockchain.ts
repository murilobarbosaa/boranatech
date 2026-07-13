// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool blockchain). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "blockchain",
  "questions": [
    {
      "id": "blockchain-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo uma aplicação que precisa registrar a transferência de um item digital. Qual abordagem você deve usar para garantir que essa transferência seja automática e visível a todos?",
      "alternativas": {
        "a": "Criar um contrato inteligente na blockchain",
        "b": "Utilizar um banco de dados centralizado para registrar a transferência",
        "c": "Fazer a transferência manualmente sempre que necessário",
        "d": "Armazenar a transferência em um arquivo local"
      },
      "correta": "a",
      "explicacao": "Um contrato inteligente na blockchain permite que a transferência seja automática e visível a todos, garantindo a transparência e a segurança.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "blockchain-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você quer garantir que os dados em sua blockchain não possam ser alterados. Qual é a característica que assegura essa imutabilidade?",
      "alternativas": {
        "a": "A descentralização da rede",
        "b": "O uso de hashes para ligar os blocos",
        "c": "A presença de um servidor central",
        "d": "A capacidade de editar contratos inteligentes"
      },
      "correta": "b",
      "explicacao": "O uso de hashes para ligar os blocos garante que qualquer alteração em um bloco antigo quebraria a cadeia, tornando os dados imutáveis.",
      "fonte": "fundamentos.comofunciona"
    },
    {
      "id": "blockchain-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você está analisando uma vaga no setor de blockchain. Qual é uma característica importante do mercado que você deve considerar antes de se candidatar?",
      "alternativas": {
        "a": "O mercado é sempre estável e previsível",
        "b": "A área é de nicho e mais volátil que outras tecnologias",
        "c": "Não é necessário ter experiência prévia em programação",
        "d": "As oportunidades são garantidas independentemente do contexto econômico"
      },
      "correta": "b",
      "explicacao": "A área de blockchain é de nicho e mais volátil, o que significa que as oportunidades podem oscilar com os ciclos do mercado cripto.",
      "fonte": "fundamentos.expectativas"
    },
    {
      "id": "blockchain-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você está criando uma aplicação descentralizada e precisa otimizar os custos de operação. O que você deve considerar ao desenvolver seu código?",
      "alternativas": {
        "a": "O uso de um servidor central para reduzir custos",
        "b": "O custo do gas para cada operação na blockchain",
        "c": "A quantidade de dados armazenados localmente",
        "d": "A complexidade do código, independentemente do custo"
      },
      "correta": "b",
      "explicacao": "O custo do gas para cada operação na blockchain é crucial, pois cada ação executada na rede tem um custo associado.",
      "fonte": "fundamentos.comofunciona"
    },
    {
      "id": "blockchain-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você está escrevendo um contrato inteligente e quer garantir que ele seja seguro. Qual prática deve ser uma prioridade desde o início do desenvolvimento?",
      "alternativas": {
        "a": "A auditoria do código após a publicação",
        "b": "A utilização de uma linguagem de programação simples",
        "c": "A segurança deve ser uma preocupação desde o início",
        "d": "A documentação do código apenas no final"
      },
      "correta": "c",
      "explicacao": "A segurança deve ser uma prioridade desde o início, já que um erro em um contrato inteligente pode causar prejuízos irreversíveis.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "blockchain-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você deseja entender como as transações são organizadas em uma blockchain. O que forma a estrutura básica dessa organização?",
      "alternativas": {
        "a": "Um servidor central que controla as transações",
        "b": "Um conjunto de dados agrupados em blocos",
        "c": "Um único banco de dados que armazena todas as informações",
        "d": "Um arquivo de texto que lista as transações"
      },
      "correta": "b",
      "explicacao": "As transações na blockchain são organizadas em blocos, que são ligados entre si, formando uma cadeia.",
      "fonte": "fundamentos.comofunciona"
    },
    {
      "id": "blockchain-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você está considerando entrar na área de blockchain, mas não tem experiência em programação. O que isso pode significar para sua jornada?",
      "alternativas": {
        "a": "Você pode começar a aprender blockchain sem qualquer base",
        "b": "É ideal ter uma base sólida de programação antes de mergulhar",
        "c": "A programação não é necessária para desenvolver contratos inteligentes",
        "d": "Você pode aprender programação enquanto aprende blockchain"
      },
      "correta": "b",
      "explicacao": "Ter uma base sólida de programação é essencial, pois blockchain geralmente exige conhecimento prévio antes de começar a desenvolver.",
      "fonte": "fundamentos.expectativas"
    },
    {
      "id": "blockchain-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo uma aplicação que requer um registro de transações. Qual é a principal vantagem de usar uma blockchain em vez de um banco de dados tradicional?",
      "alternativas": {
        "a": "A blockchain é mais rápida para processar transações",
        "b": "A blockchain oferece um registro imutável e descentralizado",
        "c": "A blockchain é mais fácil de usar que um banco de dados tradicional",
        "d": "A blockchain não requer custos de operação"
      },
      "correta": "b",
      "explicacao": "A principal vantagem da blockchain é que ela oferece um registro imutável e descentralizado, o que aumenta a segurança e a transparência.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "blockchain-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você está estudando como as transações são validadas em uma blockchain. Qual mecanismo é utilizado para garantir que todos os nós concordem sobre o estado atual da rede?",
      "alternativas": {
        "a": "Um sistema de controle centralizado",
        "b": "Um mecanismo de consenso entre os nós",
        "c": "A validação manual de cada transação",
        "d": "A eliminação de nós que não concordam"
      },
      "correta": "b",
      "explicacao": "O mecanismo de consenso é fundamental para garantir que todos os nós na rede concordem sobre o estado atual da blockchain.",
      "fonte": "fundamentos.comofunciona"
    },
    {
      "id": "blockchain-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você está começando a aprender sobre blockchain e precisa de uma base sólida. Qual linguagem de programação deve ser sua prioridade inicial?",
      "alternativas": {
        "a": "Python, por ser uma linguagem simples e versátil.",
        "b": "JavaScript, pois é amplamente usado no ecossistema Web3.",
        "c": "Java, que é conhecida por sua robustez em aplicações empresariais.",
        "d": "C++, que é eficiente para desenvolvimento de sistemas."
      },
      "correta": "b",
      "explicacao": "JavaScript é a linguagem mais relevante para o desenvolvimento Web3, pois a maioria das ferramentas e bibliotecas utiliza essa linguagem.",
      "fonte": "bases.programacao"
    },
    {
      "id": "blockchain-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você quer criar uma aplicação que interaja com contratos inteligentes. O que é essencial saber sobre a programação assíncrona?",
      "alternativas": {
        "a": "É importante saber que o código assíncrono é mais lento que o síncrono.",
        "b": "Você deve evitar usar `async`/`await` para não complicar o código.",
        "c": "É fundamental entender como funciona o `async`/`await`, pois interações com a blockchain são assíncronas.",
        "d": "Não é necessário entender assíncrono, pois a maioria das operações é síncrona."
      },
      "correta": "c",
      "explicacao": "As interações com a blockchain ocorrem em segundo plano, tornando o conhecimento de programação assíncrona essencial.",
      "fonte": "bases.programacao"
    },
    {
      "id": "blockchain-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo uma aplicação Web3 e precisa otimizar o uso de gas. O que deve ser considerado?",
      "alternativas": {
        "a": "O código deve ser o mais complexo possível para garantir segurança.",
        "b": "Código ineficiente pode aumentar os custos de operação na rede.",
        "c": "O uso de loops é sempre recomendado para garantir eficiência.",
        "d": "Não é necessário se preocupar com a eficiência, pois gas não é um custo real."
      },
      "correta": "b",
      "explicacao": "Código ineficiente realmente custa mais caro para rodar, então a otimização é crucial.",
      "fonte": "bases.programacao"
    },
    {
      "id": "blockchain-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você está aprendendo sobre carteiras na blockchain. Qual é a função da chave privada?",
      "alternativas": {
        "a": "Ela é usada para enviar e receber tokens de forma anônima.",
        "b": "Ela é necessária para autorizar transações e provar a posse dos ativos.",
        "c": "Ela serve apenas para visualizar o saldo da carteira.",
        "d": "Ela deve ser compartilhada com outros para garantir segurança."
      },
      "correta": "b",
      "explicacao": "A chave privada é o segredo que prova a posse e autoriza transações, sendo essencial para o controle dos ativos.",
      "fonte": "bases.conceitos"
    },
    {
      "id": "blockchain-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você precisa entender o que são tokens na blockchain. Qual é a definição correta?",
      "alternativas": {
        "a": "Tokens são apenas moedas digitais usadas para transações.",
        "b": "Tokens são ativos digitais que podem representar moedas, pontos ou posse de algo.",
        "c": "Tokens são sempre criptomoedas que funcionam em uma única rede.",
        "d": "Tokens são documentos físicos que representam ativos digitais."
      },
      "correta": "b",
      "explicacao": "Tokens são ativos digitais que podem representar diversos tipos de valores ou propriedades na blockchain.",
      "fonte": "bases.conceitos"
    },
    {
      "id": "blockchain-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você quer testar sua aplicação blockchain sem riscos financeiros. O que você deve usar?",
      "alternativas": {
        "a": "A rede principal, pois é onde tudo acontece de verdade.",
        "b": "Uma rede de teste (testnet), que simula a blockchain sem valor real.",
        "c": "Uma rede privada, que é mais segura para testes.",
        "d": "Qualquer blockchain, pois todas funcionam da mesma forma."
      },
      "correta": "b",
      "explicacao": "As redes de teste (testnets) permitem que você teste contratos sem arriscar dinheiro real.",
      "fonte": "bases.conceitos"
    },
    {
      "id": "blockchain-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um contrato em Solidity e precisa garantir que apenas o proprietário possa executar uma função crítica. Qual modificador você deve usar para restringir o acesso?",
      "alternativas": {
        "a": "modifier onlyOwner() { require(msg.sender == owner); }",
        "b": "modifier onlyAdmin() { require(msg.sender == admin); }",
        "c": "modifier onlyUser() { require(msg.sender == user); }",
        "d": "modifier onlyCaller() { require(msg.sender == caller); }"
      },
      "correta": "a",
      "explicacao": "O modificador 'onlyOwner' garante que apenas o proprietário do contrato possa chamar a função, o que é crucial para segurança.",
      "fonte": "solidity.linguagem"
    },
    {
      "id": "blockchain-int-02",
      "nivel": "intermediario",
      "pergunta": "Você escreveu um contrato e agora precisa publicá-lo em uma rede de teste. Qual é o primeiro passo que você deve realizar?",
      "alternativas": {
        "a": "Compilar o contrato no Remix.",
        "b": "Testar o contrato em uma testnet.",
        "c": "Criar um novo endereço na blockchain.",
        "d": "Enviar o contrato diretamente para a mainnet."
      },
      "correta": "a",
      "explicacao": "Compilar o contrato no Remix é o primeiro passo antes de fazer o deploy em uma rede de teste.",
      "fonte": "solidity.contrato"
    },
    {
      "id": "blockchain-int-03",
      "nivel": "intermediario",
      "pergunta": "Ao testar um contrato inteligente, você precisa garantir que ele funcione corretamente em situações extremas. O que você deve testar especificamente?",
      "alternativas": {
        "a": "Apenas o caminho feliz, onde tudo funciona como esperado.",
        "b": "Os valores limite, como zero e o máximo permitido.",
        "c": "A estética do contrato no Remix.",
        "d": "A documentação do código."
      },
      "correta": "b",
      "explicacao": "Testar os valores limite é essencial para garantir que o contrato se comporte corretamente em situações extremas.",
      "fonte": "solidity.testes"
    },
    {
      "id": "blockchain-int-04",
      "nivel": "intermediario",
      "pergunta": "Você está criando um token ERC-20 e precisa garantir que ele possa ser transferido entre usuários. Qual função você deve implementar?",
      "alternativas": {
        "a": "function transfer(address to, uint256 value) public returns (bool);",
        "b": "function send(address to, uint256 value) public returns (bool);",
        "c": "function move(address to, uint256 value) public returns (bool);",
        "d": "function dispatch(address to, uint256 value) public returns (bool);"
      },
      "correta": "a",
      "explicacao": "A função 'transfer' é a função padrão definida pelo ERC-20 para transferir tokens entre endereços.",
      "fonte": "solidity.erc"
    },
    {
      "id": "blockchain-int-05",
      "nivel": "intermediario",
      "pergunta": "Você precisa garantir que seu contrato não possa ser alterado após o deploy. Qual abordagem você deve adotar?",
      "alternativas": {
        "a": "Utilizar um contrato proxy para atualizações futuras.",
        "b": "Definir o contrato como 'immutable' durante a criação.",
        "c": "Publicar o contrato em uma testnet primeiro.",
        "d": "Escrever funções de atualização no contrato."
      },
      "correta": "b",
      "explicacao": "Definir o contrato como 'immutable' garante que ele não possa ser alterado após o deploy, assegurando a integridade do código.",
      "fonte": "solidity.contrato"
    },
    {
      "id": "blockchain-int-06",
      "nivel": "intermediario",
      "pergunta": "Ao testar um contrato, você percebe que uma função sensível não está restringindo o acesso corretamente. O que você deve fazer?",
      "alternativas": {
        "a": "Adicionar um modificador de segurança para restringir o acesso.",
        "b": "Remover a função do contrato.",
        "c": "Aumentar o limite de gas para a função.",
        "d": "Alterar o nome da função."
      },
      "correta": "a",
      "explicacao": "Adicionar um modificador de segurança é a abordagem correta para garantir que apenas usuários autorizados possam acessar a função sensível.",
      "fonte": "solidity.testes"
    },
    {
      "id": "blockchain-int-07",
      "nivel": "intermediario",
      "pergunta": "Você está criando um NFT usando o padrão ERC-721. Qual função é essencial para garantir que cada token seja único?",
      "alternativas": {
        "a": "function mint(address to, uint256 tokenId);",
        "b": "function create(address to, uint256 tokenId);",
        "c": "function generate(address to, uint256 tokenId);",
        "d": "function issue(address to, uint256 tokenId);"
      },
      "correta": "a",
      "explicacao": "A função 'mint' é essencial para criar novos tokens únicos no padrão ERC-721, associando um tokenId a um endereço.",
      "fonte": "solidity.erc"
    },
    {
      "id": "blockchain-int-08",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um contrato que lida com valores monetários. Qual tipo de variável você deve usar para armazenar esses valores?",
      "alternativas": {
        "a": "uint256 para valores positivos.",
        "b": "int256 para valores negativos.",
        "c": "string para valores monetários.",
        "d": "bool para valores binários."
      },
      "correta": "a",
      "explicacao": "Usar 'uint256' é a prática recomendada para armazenar valores monetários, pois garante que apenas valores positivos sejam aceitos.",
      "fonte": "solidity.linguagem"
    },
    {
      "id": "blockchain-int-09",
      "nivel": "intermediario",
      "pergunta": "Ao utilizar o Remix para fazer o deploy de um contrato, qual é a principal vantagem desse ambiente para iniciantes?",
      "alternativas": {
        "a": "Permite a compilação e o deploy com poucos cliques.",
        "b": "Oferece suporte para contratos complexos de forma nativa.",
        "c": "Possui uma interface gráfica avançada para visualização de dados.",
        "d": "Garante que o contrato será imutável após o deploy."
      },
      "correta": "a",
      "explicacao": "O Remix permite que iniciantes compilen e façam o deploy de contratos com poucos cliques, facilitando o aprendizado.",
      "fonte": "solidity.contrato"
    },
    {
      "id": "blockchain-int-10",
      "nivel": "intermediario",
      "pergunta": "Você está testando um contrato e precisa garantir que ele não seja vulnerável a ataques de reentrância. O que você deve implementar?",
      "alternativas": {
        "a": "Controle de acesso rigoroso nas funções sensíveis.",
        "b": "Verificações de saldo antes de transferências.",
        "c": "Atualizações de estado antes de chamadas externas.",
        "d": "Limitações de gas nas funções."
      },
      "correta": "c",
      "explicacao": "Atualizar o estado antes de chamadas externas é uma prática recomendada para evitar vulnerabilidades de reentrância.",
      "fonte": "solidity.testes"
    },
    {
      "id": "blockchain-int-11",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo uma DApp e precisa conectar a interface web ao contrato inteligente. Qual biblioteca você deve usar para facilitar essa conexão?",
      "alternativas": {
        "a": "web3.js",
        "b": "ethers.js",
        "c": "truffle.js",
        "d": "hardhat.js"
      },
      "correta": "b",
      "explicacao": "A ethers.js é a biblioteca recomendada para conectar a aplicação web aos contratos, permitindo ler dados e enviar transações.",
      "fonte": "web3.integracao"
    },
    {
      "id": "blockchain-int-12",
      "nivel": "intermediario",
      "pergunta": "Ao implementar uma DApp, você precisa garantir que os usuários sejam informados sobre o status das transações. Qual é a melhor prática a seguir?",
      "alternativas": {
        "a": "Ocultar o status e mostrar apenas o resultado final",
        "b": "Exibir uma mensagem de carregamento enquanto a transação é processada",
        "c": "Permitir que o usuário envie várias transações sem feedback",
        "d": "Desabilitar a interface durante a transação sem explicações"
      },
      "correta": "b",
      "explicacao": "Exibir uma mensagem de carregamento é uma boa prática, pois informa o usuário que a transação está em andamento e evita confusões.",
      "fonte": "web3.integracao"
    },
    {
      "id": "blockchain-int-13",
      "nivel": "intermediario",
      "pergunta": "Você precisa mostrar o saldo de um token em sua DApp. Qual abordagem você deve usar para obter essa informação?",
      "alternativas": {
        "a": "Consultar diretamente o estado do contrato usando ethers.js",
        "b": "Escutar eventos de transferência e calcular o saldo",
        "c": "Fazer uma chamada para um serviço externo de dados",
        "d": "Recarregar a página para obter o saldo atualizado"
      },
      "correta": "a",
      "explicacao": "Consultar diretamente o estado do contrato usando ethers.js é a forma mais eficiente e imediata para obter o saldo de um token.",
      "fonte": "web3.eventos"
    },
    {
      "id": "blockchain-int-14",
      "nivel": "intermediario",
      "pergunta": "Ao projetar uma DApp, você quer que ela reaja a eventos emitidos pelo contrato. Qual é a melhor maneira de implementar isso?",
      "alternativas": {
        "a": "Usar polling para verificar o estado a cada segundo",
        "b": "Escutar eventos emitidos pelo contrato usando ethers.js",
        "c": "Registrar as transações em um banco de dados externo",
        "d": "Apenas mostrar o estado atual sem reagir a eventos"
      },
      "correta": "b",
      "explicacao": "Escutar eventos emitidos pelo contrato permite que a DApp reaja imediatamente a mudanças, atualizando a interface sem necessidade de recarregar.",
      "fonte": "web3.eventos"
    },
    {
      "id": "blockchain-int-15",
      "nivel": "intermediario",
      "pergunta": "Você está lidando com a integração de uma carteira como a MetaMask em sua DApp. Qual é a principal função dessa carteira no fluxo de interação?",
      "alternativas": {
        "a": "Armazenar as senhas dos usuários de forma segura",
        "b": "Permitir que o site gerencie as chaves privadas dos usuários",
        "c": "Autenticar o usuário e permitir a assinatura de transações",
        "d": "Conectar a DApp a um banco de dados centralizado"
      },
      "correta": "c",
      "explicacao": "A MetaMask autentica o usuário e permite que ele assine transações, garantindo que a chave privada nunca seja exposta ao site.",
      "fonte": "web3.integracao"
    },
    {
      "id": "blockchain-av-01",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um smart contract e deseja minimizar o risco de reentrância. Qual abordagem deve ser adotada?",
      "alternativas": {
        "a": "Implementar um padrão de mutex para bloquear chamadas enquanto o estado está sendo atualizado.",
        "b": "Utilizar funções públicas para permitir que qualquer um interaja com o contrato.",
        "c": "Escrever todo o código do zero, sem usar bibliotecas externas.",
        "d": "Fazer atualizações frequentes no contrato após o lançamento."
      },
      "correta": "a",
      "explicacao": "Utilizar um padrão de mutex é uma prática recomendada para evitar ataques de reentrância, garantindo que o contrato não seja chamado novamente antes de finalizar uma operação.",
      "fonte": "seguranca.seguranca"
    },
    {
      "id": "blockchain-av-02",
      "nivel": "avancado",
      "pergunta": "Você está prestes a lançar um smart contract que lida com valores significativos. Qual é a melhor prática a ser seguida antes do lançamento?",
      "alternativas": {
        "a": "Realizar testes exaustivos em todos os cenários possíveis.",
        "b": "Publicar o contrato e corrigir bugs conforme forem encontrados.",
        "c": "Confiar apenas na revisão do código feita por você mesmo.",
        "d": "Lançar o contrato sem testes, pois a comunidade irá ajudar a identificar problemas."
      },
      "correta": "a",
      "explicacao": "Realizar testes exaustivos é essencial para identificar e corrigir problemas antes do lançamento, evitando prejuízos irreversíveis.",
      "fonte": "seguranca.auditoria"
    },
    {
      "id": "blockchain-av-03",
      "nivel": "avancado",
      "pergunta": "Você está revisando um smart contract e nota que ele é excessivamente complexo. Qual é a melhor ação a tomar?",
      "alternativas": {
        "a": "Simplificar o contrato, removendo funcionalidades desnecessárias.",
        "b": "Deixar o contrato como está, pois a complexidade pode ser interessante.",
        "c": "Adicionar mais funcionalidades para torná-lo mais robusto.",
        "d": "Dividir o contrato em várias partes, mas mantendo a complexidade."
      },
      "correta": "a",
      "explicacao": "Manter os contratos simples ajuda a evitar bugs, pois a complexidade pode esconder falhas que são difíceis de detectar.",
      "fonte": "seguranca.auditoria"
    },
    {
      "id": "blockchain-av-04",
      "nivel": "avancado",
      "pergunta": "Você está escrevendo um smart contract e decide reutilizar código existente. Qual é a principal vantagem dessa prática?",
      "alternativas": {
        "a": "O código já foi auditado e testado por outros, aumentando a segurança.",
        "b": "Reutilizar código sempre resulta em um contrato mais barato.",
        "c": "O código reutilizado não precisa de testes adicionais.",
        "d": "Reutilizar código é uma prática comum e não traz riscos."
      },
      "correta": "a",
      "explicacao": "Reutilizar código auditado e consagrado, como o da OpenZeppelin, aumenta a segurança do seu contrato, pois já foi revisado por especialistas.",
      "fonte": "seguranca.seguranca"
    },
    {
      "id": "blockchain-av-05",
      "nivel": "avancado",
      "pergunta": "Você está testando um smart contract e se depara com um cenário de borda. O que você deve fazer?",
      "alternativas": {
        "a": "Ignorar esse cenário, pois é improvável que aconteça.",
        "b": "Testar esse cenário para garantir que o contrato se comporte como esperado.",
        "c": "Adicionar mais funcionalidades para cobrir esse cenário.",
        "d": "Apenas testar os casos mais comuns e deixar os extremos de lado."
      },
      "correta": "b",
      "explicacao": "Testar cenários de borda é crucial para garantir que o contrato funcione corretamente em todas as situações, evitando falhas inesperadas.",
      "fonte": "seguranca.auditoria"
    },
    {
      "id": "blockchain-av-06",
      "nivel": "avancado",
      "pergunta": "Você está revisando um smart contract e nota que ele não possui controle de acesso adequado. O que você deve fazer?",
      "alternativas": {
        "a": "Adicionar modificadores de função para restringir o acesso a funções sensíveis.",
        "b": "Deixar o contrato como está, pois todos devem ter acesso.",
        "c": "Eliminar todas as funções sensíveis do contrato.",
        "d": "Adicionar mais funções públicas para facilitar o uso."
      },
      "correta": "a",
      "explicacao": "Adicionar modificadores de função é essencial para garantir que apenas usuários autorizados possam acessar funções sensíveis, prevenindo abusos.",
      "fonte": "seguranca.seguranca"
    },
    {
      "id": "blockchain-av-07",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um DApp de registro em testnet e precisa garantir que o contrato esteja seguro. Qual abordagem você deve seguir?",
      "alternativas": {
        "a": "Utilizar implementações consagradas como base e testar exaustivamente o contrato antes do deploy.",
        "b": "Escrever o contrato do zero sem consultar exemplos, focando apenas na funcionalidade desejada.",
        "c": "Publicar o contrato imediatamente após a codificação, sem testes, para ganhar tempo.",
        "d": "Adicionar funcionalidades complexas para impressionar os usuários, mesmo que não sejam necessárias."
      },
      "correta": "a",
      "explicacao": "Utilizar implementações consagradas e testar exaustivamente garante que o contrato seja seguro e confiável.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "blockchain-av-08",
      "nivel": "avancado",
      "pergunta": "Ao construir seu portfólio na área de blockchain, qual projeto seria mais adequado para demonstrar suas habilidades?",
      "alternativas": {
        "a": "Um token ERC-20 próprio, para mostrar conhecimento em padrões de token e contratos.",
        "b": "Um simples script em JavaScript que não interage com a blockchain.",
        "c": "Um aplicativo de chat que não utiliza contratos inteligentes.",
        "d": "Um projeto de uma página estática que não contém código blockchain."
      },
      "correta": "a",
      "explicacao": "Um token ERC-20 próprio demonstra conhecimento em contratos, testes e deploy, fundamentais na área.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "blockchain-av-09",
      "nivel": "avancado",
      "pergunta": "Você quer se destacar na área de blockchain, mas está inseguro sobre o que construir. Qual é a melhor estratégia?",
      "alternativas": {
        "a": "Criar um marketplace simples de NFTs, pois é um projeto completo e popular.",
        "b": "Focar apenas em aprender teoria, sem implementar projetos práticos.",
        "c": "Desenvolver um projeto complexo sem planejamento, para impressionar potenciais empregadores.",
        "d": "Construir um DApp que não é verificável publicamente, para evitar críticas."
      },
      "correta": "a",
      "explicacao": "Criar um marketplace simples de NFTs é um projeto que demonstra habilidades práticas e conhecimento do ciclo completo de desenvolvimento.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "blockchain-av-10",
      "nivel": "avancado",
      "pergunta": "Você publicou um contrato em uma testnet, mas percebeu que não testou todas as funções. O que você deve fazer?",
      "alternativas": {
        "a": "Revisar e testar o contrato novamente antes de qualquer interação pública.",
        "b": "Ignorar os testes, pois a testnet não envolve dinheiro real.",
        "c": "Adicionar mais funcionalidades para compensar a falta de testes.",
        "d": "Apagar o contrato e criar um novo sem testar novamente."
      },
      "correta": "a",
      "explicacao": "Revisar e testar o contrato novamente é essencial para garantir a segurança e a funcionalidade do DApp.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "blockchain-av-11",
      "nivel": "avancado",
      "pergunta": "Você está se preparando para entrar na carreira de blockchain e quer construir experiência. Qual é a melhor forma de fazer isso?",
      "alternativas": {
        "a": "Participar de bootcamps gratuitos focados em desenvolvimento Ethereum e construir projetos em testnet.",
        "b": "Apenas estudar a documentação sem aplicar o conhecimento em projetos práticos.",
        "c": "Focar em um único projeto e não diversificar suas experiências.",
        "d": "Evitar interagir com a comunidade, para não se distrair."
      },
      "correta": "a",
      "explicacao": "Participar de bootcamps e construir projetos em testnet oferece experiência prática e conhecimento aplicado, essenciais na área.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "blockchain-av-12",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um DApp e precisa integrar a carteira do usuário. Qual é a melhor prática recomendada?",
      "alternativas": {
        "a": "Utilizar bibliotecas Web3 para facilitar a conexão e interação com a blockchain.",
        "b": "Criar uma integração manual, sem usar bibliotecas, para entender melhor o processo.",
        "c": "Ignorar a segurança da integração, pois a testnet não envolve dinheiro real.",
        "d": "Conectar a carteira do usuário de forma aleatória, sem validação."
      },
      "correta": "a",
      "explicacao": "Utilizar bibliotecas Web3 é a prática recomendada, pois facilita a integração e garante segurança e eficiência.",
      "fonte": "carreira.projeto"
    }
  ]
};

export default pool;
