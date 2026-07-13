// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool gamedev). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "gamedev",
  "questions": [
    {
      "id": "gamedev-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo um jogo e precisa implementar a física dos objetos. O que você deve usar para facilitar esse trabalho?",
      "alternativas": {
        "a": "Criar seu próprio sistema de física do zero.",
        "b": "Utilizar uma game engine que já possui um motor de física integrado.",
        "c": "Programar a física apenas com matemática pura, sem ferramentas.",
        "d": "Focar apenas na estética do jogo e ignorar a física."
      },
      "correta": "b",
      "explicacao": "Usar uma game engine com motor de física integrado economiza tempo e esforço, permitindo que você se concentre em outros aspectos do jogo.",
      "fonte": "fundamentos.engine"
    },
    {
      "id": "gamedev-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você quer criar um jogo que seja divertido e equilibrado para os jogadores. Qual é a melhor abordagem a seguir?",
      "alternativas": {
        "a": "Programar tudo de uma vez e lançar sem testes.",
        "b": "Fazer muitos testes e ajustes para refinar a jogabilidade.",
        "c": "Ignorar feedback dos jogadores e seguir sua própria visão.",
        "d": "Focar apenas em gráficos e ignorar a mecânica do jogo."
      },
      "correta": "b",
      "explicacao": "Realizar testes e ajustes é essencial para garantir que o jogo ofereça uma experiência divertida e equilibrada.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "gamedev-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você decidiu entrar no mercado de desenvolvimento de jogos. Qual expectativa é mais realista?",
      "alternativas": {
        "a": "Você terá um salário alto desde o início da carreira.",
        "b": "O mercado é pequeno e a concorrência é alta.",
        "c": "Você pode trabalhar sozinho e não precisa de colaboração.",
        "d": "A paixão pelo desenvolvimento não é importante."
      },
      "correta": "b",
      "explicacao": "O mercado de jogos é menor que outras áreas de tecnologia, resultando em mais concorrência por vagas.",
      "fonte": "fundamentos.expectativas"
    },
    {
      "id": "gamedev-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você está escolhendo uma game engine para o seu primeiro jogo. O que deve considerar como prioridade?",
      "alternativas": {
        "a": "A engine mais popular, que possui muitos recursos e suporte.",
        "b": "Uma engine que não oferece documentação ou comunidade ativa.",
        "c": "Escolher uma engine apenas pela aparência.",
        "d": "Usar uma engine que não se adapta ao tipo de jogo que você quer criar."
      },
      "correta": "a",
      "explicacao": "A popularidade e o suporte da engine são importantes para facilitar o aprendizado e a resolução de problemas.",
      "fonte": "fundamentos.engine"
    },
    {
      "id": "gamedev-ini-05",
      "nivel": "iniciante",
      "pergunta": "Ao programar a inteligência dos inimigos no seu jogo, qual prática é recomendada?",
      "alternativas": {
        "a": "Criar um sistema complexo sem testes.",
        "b": "Iterar e testar frequentemente para ajustar o comportamento dos inimigos.",
        "c": "Usar a mesma lógica para todos os inimigos sem variação.",
        "d": "Ignorar a dificuldade e deixar os inimigos sempre fáceis."
      },
      "correta": "b",
      "explicacao": "Testar e ajustar frequentemente ajuda a garantir que a inteligência dos inimigos seja desafiadora e divertida.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "gamedev-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você quer garantir que seu jogo seja acessível a um público amplo. O que deve fazer?",
      "alternativas": {
        "a": "Desenvolver o jogo apenas em português.",
        "b": "Incluir suporte a múltiplos idiomas e opções de acessibilidade.",
        "c": "Focar em um único tipo de jogador e ignorar outros.",
        "d": "Não se preocupar com a experiência do jogador."
      },
      "correta": "b",
      "explicacao": "Incluir suporte a múltiplos idiomas e acessibilidade torna o jogo mais inclusivo e atraente para diferentes públicos.",
      "fonte": "fundamentos.expectativas"
    },
    {
      "id": "gamedev-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você está testando a jogabilidade do seu jogo. O que é uma prática recomendada?",
      "alternativas": {
        "a": "Testar apenas uma vez e considerar o jogo pronto.",
        "b": "Recolher feedback de diferentes jogadores e ajustar conforme necessário.",
        "c": "Ignorar as opiniões dos jogadores e seguir sua própria visão.",
        "d": "Focar apenas na correção de bugs visuais."
      },
      "correta": "b",
      "explicacao": "Recolher feedback de diferentes jogadores ajuda a identificar problemas e melhorar a jogabilidade.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "gamedev-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você está decidindo entre Unity, Godot e Unreal Engine. O que deve considerar ao fazer sua escolha?",
      "alternativas": {
        "a": "A linguagem de programação que você já conhece e a comunidade de suporte.",
        "b": "Escolher a engine mais complexa sem considerar suas habilidades.",
        "c": "Optar pela engine que não se adapta ao tipo de jogo que você deseja criar.",
        "d": "Ignorar a documentação e suporte disponíveis."
      },
      "correta": "a",
      "explicacao": "A linguagem de programação e a comunidade de suporte são fatores cruciais para facilitar o aprendizado e o desenvolvimento.",
      "fonte": "fundamentos.engine"
    },
    {
      "id": "gamedev-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você está começando sua carreira em desenvolvimento de jogos. Qual é a melhor motivação para seguir nessa área?",
      "alternativas": {
        "a": "A possibilidade de ganhar muito dinheiro rapidamente.",
        "b": "A paixão por jogos e o desejo de criá-los.",
        "c": "A ideia de trabalhar sozinho e não precisar colaborar.",
        "d": "A crença de que não é necessário aprender programação."
      },
      "correta": "b",
      "explicacao": "Entrar na área por paixão é fundamental para superar os desafios e encontrar satisfação no trabalho.",
      "fonte": "fundamentos.expectativas"
    },
    {
      "id": "gamedev-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você está começando a desenvolver um jogo e precisa escolher uma engine. Você quer uma opção que tenha uma grande comunidade e muitos recursos disponíveis. Qual engine você deve escolher?",
      "alternativas": {
        "a": "Godot, pois é leve e fácil de aprender.",
        "b": "Unity, pois é a mais utilizada no mercado e tem muitos tutoriais.",
        "c": "Unreal, pois é a melhor para gráficos avançados.",
        "d": "Godot, pois é a mais pesada e complexa."
      },
      "correta": "b",
      "explicacao": "A Unity é a engine mais utilizada no mercado, o que garante uma maior disponibilidade de tutoriais e suporte da comunidade.",
      "fonte": "inicio.escolha"
    },
    {
      "id": "gamedev-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você decidiu usar a Godot para desenvolver seu primeiro jogo. Qual linguagem você precisará aprender para programar nessa engine?",
      "alternativas": {
        "a": "C++, que é a linguagem mais comum entre as engines.",
        "b": "Java, que é popular em desenvolvimento de jogos.",
        "c": "GDScript, que é a linguagem própria da Godot.",
        "d": "C#, que é a linguagem da Unreal."
      },
      "correta": "c",
      "explicacao": "A Godot utiliza GDScript como sua linguagem principal, que é fácil de aprender e adequada para iniciantes.",
      "fonte": "inicio.linguagem"
    },
    {
      "id": "gamedev-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você está aprendendo a programar e quer fazer um objeto se mover na tela em seu jogo. O que é mais recomendado para começar?",
      "alternativas": {
        "a": "Aprender toda a linguagem de programação antes de começar a programar.",
        "b": "Fazer pequenos testes e projetos para entender a lógica da linguagem.",
        "c": "Criar um jogo complexo logo de início para praticar.",
        "d": "Focar apenas na sintaxe sem se preocupar com a lógica."
      },
      "correta": "b",
      "explicacao": "Começar com pequenos testes ajuda a entender a lógica da programação, permitindo um aprendizado mais eficaz.",
      "fonte": "inicio.linguagem"
    },
    {
      "id": "gamedev-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você quer desenvolver jogos com gráficos avançados e está disposto a enfrentar uma curva de aprendizado mais difícil. Qual engine é mais adequada para você?",
      "alternativas": {
        "a": "Godot, pois é leve e fácil de usar.",
        "b": "Unity, pois é a mais amigável para iniciantes.",
        "c": "Unreal, pois é ideal para jogos de grande porte e gráficos avançados.",
        "d": "Unity, pois é a mais complexa e poderosa."
      },
      "correta": "c",
      "explicacao": "A Unreal Engine é a melhor opção para desenvolver jogos com gráficos avançados, apesar de sua complexidade.",
      "fonte": "inicio.escolha"
    },
    {
      "id": "gamedev-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você decidiu usar a Unity para seu projeto. Qual linguagem você deve aprender para programar na Unity?",
      "alternativas": {
        "a": "GDScript, que é a linguagem da Godot.",
        "b": "C#, que é a linguagem usada na Unity.",
        "c": "C++, que é a linguagem da Unreal.",
        "d": "Java, que é comum em desenvolvimento de jogos."
      },
      "correta": "b",
      "explicacao": "A Unity utiliza C# como sua linguagem de programação, que é acessível para iniciantes.",
      "fonte": "inicio.linguagem"
    },
    {
      "id": "gamedev-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você está confuso sobre qual engine escolher e teme que sua decisão possa travar sua carreira. O que é importante lembrar?",
      "alternativas": {
        "a": "Escolher a engine mais popular é sempre a melhor opção.",
        "b": "Não existe escolha errada, o importante é decidir e seguir em frente.",
        "c": "É melhor testar todas as engines antes de decidir.",
        "d": "Escolher a engine mais complexa garantirá mais oportunidades."
      },
      "correta": "b",
      "explicacao": "O mais importante é decidir e seguir em frente, pois pular de engine em engine pode atrasar seu progresso.",
      "fonte": "inicio.escolha"
    },
    {
      "id": "gamedev-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um jogo e precisa que um objeto, como um inimigo, se mova de forma consistente em diferentes máquinas. O que você deve fazer?",
      "alternativas": {
        "a": "Multiplicar a velocidade do movimento pelo delta time a cada frame.",
        "b": "Definir uma velocidade fixa para o movimento do objeto sem considerar o delta time.",
        "c": "Usar uma taxa de frames fixa para todos os jogadores, independentemente do hardware.",
        "d": "Ajustar a velocidade do movimento apenas uma vez no início do jogo."
      },
      "correta": "a",
      "explicacao": "Multiplicar a velocidade pelo delta time garante que o movimento do objeto seja consistente em diferentes máquinas, evitando bugs de velocidade.",
      "fonte": "engine.gameloop"
    },
    {
      "id": "gamedev-int-02",
      "nivel": "intermediario",
      "pergunta": "Ao criar uma cena em sua engine, você precisa adicionar um novo objeto que representa um jogador. Qual é a abordagem correta para garantir que o jogador tenha o comportamento desejado?",
      "alternativas": {
        "a": "Criar um novo script para cada instância do jogador na cena.",
        "b": "Adicionar um comportamento ao objeto jogador e reutilizá-lo em várias cenas.",
        "c": "Configurar o objeto jogador apenas uma vez e não reaproveitá-lo em outras cenas.",
        "d": "Duplicar o objeto jogador sempre que precisar dele em uma nova cena."
      },
      "correta": "b",
      "explicacao": "Adicionar um comportamento ao objeto jogador e reutilizá-lo em várias cenas permite reaproveitamento eficiente e manutenção mais fácil do código.",
      "fonte": "engine.modelo"
    },
    {
      "id": "gamedev-int-03",
      "nivel": "intermediario",
      "pergunta": "Você está implementando a lógica do seu jogo e precisa garantir que o jogo responda rapidamente às entradas do jogador. O que você deve considerar ao estruturar seu código?",
      "alternativas": {
        "a": "Colocar toda a lógica do jogo em uma função que roda a cada frame.",
        "b": "Escrever a lógica do jogo em um único bloco de código que roda apenas no início do jogo.",
        "c": "Separar a lógica de entrada do jogador da lógica de atualização do estado do jogo.",
        "d": "Executar a lógica do jogo apenas quando uma tecla é pressionada."
      },
      "correta": "a",
      "explicacao": "Colocar a lógica do jogo em uma função que roda a cada frame garante que o jogo responda continuamente às entradas do jogador.",
      "fonte": "engine.gameloop"
    },
    {
      "id": "gamedev-int-04",
      "nivel": "intermediario",
      "pergunta": "Você está configurando uma nova cena e precisa garantir que todos os objetos dentro dela sejam atualizados corretamente. Qual é a prática recomendada ao trabalhar com objetos em sua engine?",
      "alternativas": {
        "a": "Criar uma nova instância de cada objeto sempre que a cena for carregada.",
        "b": "Reaproveitar objetos existentes e aplicar comportamentos a eles conforme necessário.",
        "c": "Adicionar todos os objetos na cena sem considerar a estrutura de reaproveitamento.",
        "d": "Destruir objetos que não estão visíveis para economizar recursos."
      },
      "correta": "b",
      "explicacao": "Reaproveitar objetos existentes e aplicar comportamentos a eles garante eficiência e facilita a manutenção do jogo.",
      "fonte": "engine.modelo"
    },
    {
      "id": "gamedev-int-05",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um jogo e precisa que o personagem responda rapidamente aos comandos do jogador. Qual abordagem você deve usar para garantir um controle responsivo?",
      "alternativas": {
        "a": "Ler a entrada do jogador apenas uma vez por segundo para evitar sobrecarga.",
        "b": "Ler a entrada do jogador a cada frame e aplicar o delta time no movimento.",
        "c": "Aguarde um tempo fixo antes de processar a entrada do jogador para suavizar o movimento.",
        "d": "Aplique um movimento fixo sem considerar a entrada do jogador para simplificar o controle."
      },
      "correta": "b",
      "explicacao": "Ler a entrada a cada frame e aplicar o delta time garante que o movimento seja consistente e responsivo, melhorando a sensação de controle do jogador.",
      "fonte": "mecanicas.movimento"
    },
    {
      "id": "gamedev-int-06",
      "nivel": "intermediario",
      "pergunta": "Você está criando um jogo de plataforma onde o personagem deve pular sobre obstáculos. Qual é a melhor maneira de implementar a física do pulo?",
      "alternativas": {
        "a": "Definir a gravidade e a força do pulo usando valores fixos para todos os personagens.",
        "b": "Usar a física da engine para calcular a gravidade e a força do pulo de forma dinâmica.",
        "c": "Programar a física do pulo manualmente, ignorando a gravidade da engine.",
        "d": "Aumentar a velocidade do pulo sempre que o jogador pressiona a tecla de pulo."
      },
      "correta": "b",
      "explicacao": "Utilizar a física da engine permite que o pulo se comporte de maneira realista e consistente, facilitando ajustes e melhorias no gameplay.",
      "fonte": "mecanicas.fisica"
    },
    {
      "id": "gamedev-int-07",
      "nivel": "intermediario",
      "pergunta": "Você está implementando inimigos em seu jogo que devem perseguir o jogador. Qual técnica é mais adequada para definir o comportamento desses inimigos?",
      "alternativas": {
        "a": "Usar uma lógica simples de ataque direto, sem considerar a posição do jogador.",
        "b": "Implementar uma máquina de estados para alternar entre patrulhar, perseguir e atacar.",
        "c": "Criar um algoritmo complexo de IA que prevê os movimentos do jogador.",
        "d": "Fazer com que os inimigos sempre ataquem assim que o jogador estiver visível."
      },
      "correta": "b",
      "explicacao": "A máquina de estados permite que os inimigos mudem de comportamento de forma clara e lógica, tornando a interação mais interessante e divertida.",
      "fonte": "mecanicas.ia"
    },
    {
      "id": "gamedev-int-08",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um jogo onde o personagem deve coletar itens ao tocar neles. Como você deve implementar a detecção de colisão?",
      "alternativas": {
        "a": "Usar colisores que correspondem exatamente ao formato dos objetos visuais.",
        "b": "Implementar colisores simplificados que funcionem bem para a detecção de toque.",
        "c": "Ignorar a detecção de colisão e usar apenas a lógica de proximidade.",
        "d": "Definir colisores apenas para os objetos que não se movem."
      },
      "correta": "b",
      "explicacao": "Colisores simplificados são mais eficientes e ainda permitem uma detecção precisa, evitando problemas de desempenho e bugs.",
      "fonte": "mecanicas.fisica"
    },
    {
      "id": "gamedev-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está criando um inimigo que deve reagir ao jogador de maneira divertida. Qual abordagem você deve evitar para garantir uma experiência agradável?",
      "alternativas": {
        "a": "Fazer com que o inimigo tenha um tempo de reação para tornar o desafio justo.",
        "b": "Criar um inimigo que nunca erra, tornando a luta impossível de vencer.",
        "c": "Implementar falhas propositais no comportamento do inimigo para criar oportunidades.",
        "d": "Usar uma máquina de estados para definir claramente as ações do inimigo."
      },
      "correta": "b",
      "explicacao": "Um inimigo que nunca erra pode frustrar o jogador, enquanto um que tem falhas propositais oferece um desafio justo e divertido.",
      "fonte": "mecanicas.ia"
    },
    {
      "id": "gamedev-int-10",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um jogo onde o personagem deve se mover em um ambiente 3D. Qual é a melhor prática para garantir que o movimento seja suave e responsivo?",
      "alternativas": {
        "a": "Desconsiderar o delta time e mover o personagem a uma velocidade fixa por frame.",
        "b": "Calcular o movimento com base na entrada do jogador e no delta time a cada frame.",
        "c": "Implementar um movimento acelerado que ignora a entrada do jogador.",
        "d": "Usar uma taxa de atualização de 30 frames por segundo para simplificar o cálculo."
      },
      "correta": "b",
      "explicacao": "Calcular o movimento com base na entrada do jogador e no delta time garante que o movimento seja suave e consistente em diferentes máquinas.",
      "fonte": "mecanicas.movimento"
    },
    {
      "id": "gamedev-int-11",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um jogo e precisa integrar um som que deve ser tocado sempre que um personagem pula. Qual é a melhor abordagem para garantir que o som seja reproduzido corretamente?",
      "alternativas": {
        "a": "Associar o som diretamente ao evento de pulo no código do personagem.",
        "b": "Criar uma função separada para tocar o som e chamá-la sempre que o personagem pular.",
        "c": "Adicionar o som ao sprite do personagem para que ele toque automaticamente ao pular.",
        "d": "Disparar o som usando um sistema de animação que controla o pulo."
      },
      "correta": "b",
      "explicacao": "Criar uma função separada para tocar o som permite um controle melhor sobre quando e como o som é reproduzido, evitando problemas de sincronização.",
      "fonte": "conteudo.assets"
    },
    {
      "id": "gamedev-int-12",
      "nivel": "intermediario",
      "pergunta": "Você está criando animações para um personagem que deve andar e atacar. Qual técnica você deve usar para garantir que as animações mudem corretamente conforme a ação do jogador?",
      "alternativas": {
        "a": "Utilizar um único sprite para todas as animações e trocar a imagem manualmente.",
        "b": "Implementar uma máquina de estados de animação que define as transições entre as animações.",
        "c": "Criar uma sequência de animações sem lógica de transição entre elas.",
        "d": "Usar animações separadas para cada ação, mas sem um sistema que controle a troca."
      },
      "correta": "b",
      "explicacao": "A máquina de estados de animação permite que o jogo mude as animações de acordo com as ações do jogador, proporcionando uma experiência mais fluida e responsiva.",
      "fonte": "conteudo.animacao"
    },
    {
      "id": "gamedev-int-13",
      "nivel": "intermediario",
      "pergunta": "Você está projetando a interface de um jogo mobile. Qual é a consideração mais importante para garantir que a UI funcione bem em diferentes dispositivos?",
      "alternativas": {
        "a": "Usar tamanhos fixos para todos os elementos da UI, garantindo consistência visual.",
        "b": "Testar a interface apenas em um dispositivo para economizar tempo.",
        "c": "Adaptar a UI para diferentes tamanhos de tela, garantindo que todos os elementos sejam visíveis.",
        "d": "Criar uma interface que não se preocupe com a responsividade, pois a maioria dos usuários tem dispositivos modernos."
      },
      "correta": "c",
      "explicacao": "Adaptar a UI para diferentes tamanhos de tela é essencial para garantir que todos os jogadores tenham uma boa experiência, independentemente do dispositivo que utilizam.",
      "fonte": "conteudo.uisave"
    },
    {
      "id": "gamedev-int-14",
      "nivel": "intermediario",
      "pergunta": "Ao implementar o sistema de salvamento em seu jogo, qual é a melhor prática para garantir que os dados do jogador sejam armazenados corretamente?",
      "alternativas": {
        "a": "Salvar todos os dados em um único arquivo, independentemente do tamanho.",
        "b": "Persistir apenas a pontuação máxima, pois é o dado mais importante.",
        "c": "Utilizar os mecanismos da engine para gravar informações importantes em arquivos separados.",
        "d": "Salvar os dados apenas quando o jogador finalizar o jogo."
      },
      "correta": "c",
      "explicacao": "Utilizar os mecanismos da engine para gravar informações em arquivos separados permite uma melhor organização e recuperação dos dados, garantindo que tudo seja salvo corretamente.",
      "fonte": "conteudo.uisave"
    },
    {
      "id": "gamedev-int-15",
      "nivel": "intermediario",
      "pergunta": "Você está trabalhando com sprites e precisa otimizar o desempenho do seu jogo. Qual abordagem é mais eficaz para lidar com os sprites?",
      "alternativas": {
        "a": "Usar sprites individuais para cada animação, mesmo que isso aumente o número de arquivos.",
        "b": "Criar um sprite sheet que agrupe todos os sprites necessários em uma única imagem.",
        "c": "Reduzir a qualidade dos sprites para diminuir o tamanho dos arquivos, sem considerar a aparência.",
        "d": "Manter os sprites em alta resolução, mesmo se não forem utilizados todos ao mesmo tempo."
      },
      "correta": "b",
      "explicacao": "Criar um sprite sheet é mais eficiente, pois reduz o número de arquivos que a engine precisa carregar, melhorando o desempenho do jogo.",
      "fonte": "conteudo.animacao"
    },
    {
      "id": "gamedev-av-01",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um jogo e percebe que a dificuldade está frustrando os jogadores. O que você deve fazer?",
      "alternativas": {
        "a": "Aumentar a quantidade de inimigos para tornar o jogo mais desafiador.",
        "b": "Reduzir a quantidade de inimigos e ajustar a curva de aprendizado gradualmente.",
        "c": "Manter a dificuldade atual, pois os jogadores devem se esforçar para vencer.",
        "d": "Adicionar mais mecânicas complexas para diversificar a experiência."
      },
      "correta": "b",
      "explicacao": "Reduzir a quantidade de inimigos e ajustar a curva de aprendizado ajuda a encontrar um equilíbrio que desafia sem frustrar.",
      "fonte": "design.fundamentos"
    },
    {
      "id": "gamedev-av-02",
      "nivel": "avancado",
      "pergunta": "Durante o desenvolvimento de um jogo, você recebe feedback de que os jogadores não entendem suas ações. O que você deve priorizar para melhorar a experiência?",
      "alternativas": {
        "a": "Adicionar mais elementos visuais para tornar o jogo mais atraente.",
        "b": "Implementar feedback claro e imediato para as ações dos jogadores.",
        "c": "Criar um tutorial longo e detalhado explicando todas as mecânicas.",
        "d": "Remover elementos que os jogadores consideram confusos, mesmo que sejam importantes."
      },
      "correta": "b",
      "explicacao": "Implementar feedback claro e imediato ajuda os jogadores a entenderem suas ações e melhora a experiência geral.",
      "fonte": "design.fundamentos"
    },
    {
      "id": "gamedev-av-03",
      "nivel": "avancado",
      "pergunta": "Você está participando de uma game jam e percebe que seu projeto está muito ambicioso para o tempo disponível. O que você deve fazer?",
      "alternativas": {
        "a": "Continuar com o projeto original, pois é importante manter a visão inicial.",
        "b": "Cortar escopo e focar nas mecânicas essenciais para finalizar o jogo.",
        "c": "Dividir o projeto em partes e tentar finalizar uma versão maior depois da jam.",
        "d": "Pedir ajuda a outros participantes para manter o escopo original."
      },
      "correta": "b",
      "explicacao": "Cortar escopo e focar nas mecânicas essenciais é crucial para terminar o jogo dentro do prazo da game jam.",
      "fonte": "design.jams"
    },
    {
      "id": "gamedev-av-04",
      "nivel": "avancado",
      "pergunta": "Você está em uma game jam e percebe que muitos participantes estão apenas começando. O que você deve fazer para maximizar seu aprendizado?",
      "alternativas": {
        "a": "Focar em ajudar os novatos a entenderem o processo de desenvolvimento.",
        "b": "Concentrar-se em criar um jogo complexo para impressionar os outros.",
        "c": "Participar apenas como espectador para observar os outros desenvolvendo.",
        "d": "Formar uma equipe com os novatos para compartilhar conhecimento e experiências."
      },
      "correta": "d",
      "explicacao": "Formar uma equipe com novatos permite compartilhar conhecimento e experiências, enriquecendo o aprendizado de todos.",
      "fonte": "design.jams"
    },
    {
      "id": "gamedev-av-05",
      "nivel": "avancado",
      "pergunta": "Você completou um jogo em uma game jam, mas ele está cheio de bugs. O que você deve priorizar antes de apresentá-lo?",
      "alternativas": {
        "a": "Adicionar mais níveis e conteúdo ao jogo para torná-lo mais interessante.",
        "b": "Testar e corrigir os bugs mais críticos que afetam a jogabilidade.",
        "c": "Focar em melhorar os gráficos e a estética do jogo.",
        "d": "Deixar os bugs, pois todos estão cientes de que é uma game jam."
      },
      "correta": "b",
      "explicacao": "Testar e corrigir os bugs críticos é essencial para garantir uma boa experiência de jogo antes da apresentação.",
      "fonte": "design.jams"
    },
    {
      "id": "gamedev-av-06",
      "nivel": "avancado",
      "pergunta": "Você está programando um jogo e quer garantir que ele seja divertido. Qual abordagem você deve tomar?",
      "alternativas": {
        "a": "Focar em implementar a maior quantidade de mecânicas possíveis.",
        "b": "Testar o jogo com jogadores e ajustar as mecânicas com base no feedback.",
        "c": "Planejar o jogo em detalhes antes de começar a programar.",
        "d": "Ignorar o feedback dos jogadores e seguir sua própria visão criativa."
      },
      "correta": "b",
      "explicacao": "Testar o jogo com jogadores e ajustar as mecânicas com base no feedback é fundamental para garantir que o jogo seja divertido.",
      "fonte": "design.fundamentos"
    },
    {
      "id": "gamedev-av-07",
      "nivel": "avancado",
      "pergunta": "Você desenvolveu um jogo e está pronto para publicá-lo. Qual a primeira plataforma que você deve considerar para um lançamento inicial, devido à sua acessibilidade e comunidade acolhedora?",
      "alternativas": {
        "a": "Steam, por ser a maior vitrine de jogos para PC",
        "b": "Google Play, que permite acesso a um grande público",
        "c": "Itch.io, que é voltada para jogos independentes e tem baixa burocracia",
        "d": "Epic Games Store, que oferece boas condições para novos desenvolvedores"
      },
      "correta": "c",
      "explicacao": "A Itch.io é a plataforma mais acessível para iniciantes, permitindo publicar jogos com pouca burocracia e receber feedback da comunidade.",
      "fonte": "carreira.publicar"
    },
    {
      "id": "gamedev-av-08",
      "nivel": "avancado",
      "pergunta": "Você está publicando seu jogo na Itch.io. O que é essencial incluir na sua página para causar uma boa primeira impressão?",
      "alternativas": {
        "a": "Apenas uma descrição do jogo",
        "b": "Capturas de tela, um vídeo curto e uma descrição clara",
        "c": "Um trailer longo e detalhado sobre o desenvolvimento",
        "d": "Uma lista extensa de recursos e funcionalidades do jogo"
      },
      "correta": "b",
      "explicacao": "Incluir capturas de tela, um vídeo curto e uma descrição clara é fundamental para atrair jogadores e dar uma boa primeira impressão.",
      "fonte": "carreira.publicar"
    },
    {
      "id": "gamedev-av-09",
      "nivel": "avancado",
      "pergunta": "Qual é a principal razão para publicar seus jogos, além de compartilhar com o público?",
      "alternativas": {
        "a": "Para ganhar dinheiro rapidamente",
        "b": "Para criar um portfólio que comprove suas habilidades",
        "c": "Para receber críticas negativas que ajudem a melhorar",
        "d": "Para se tornar famoso na comunidade de desenvolvedores"
      },
      "correta": "b",
      "explicacao": "Publicar jogos cria um portfólio que demonstra suas habilidades práticas, o que é mais valioso do que diplomas na busca por vagas na área.",
      "fonte": "carreira.publicar"
    },
    {
      "id": "gamedev-av-10",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um roguelike com geração procedural. Qual aspecto é crucial para garantir que as fases geradas sejam jogáveis e justas?",
      "alternativas": {
        "a": "Focar apenas na estética das fases",
        "b": "Definir regras claras que guiem a geração das fases",
        "c": "Criar fases fixas e depois adaptá-las para o procedural",
        "d": "Permitir que os jogadores escolham as fases antes de jogar"
      },
      "correta": "b",
      "explicacao": "Definir regras claras é essencial para garantir que as fases geradas sejam jogáveis e ofereçam um desafio justo ao jogador.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "gamedev-av-11",
      "nivel": "avancado",
      "pergunta": "O projeto final de um roguelike deve ser completo e jogável. O que caracteriza um jogo 'completo' nesse contexto?",
      "alternativas": {
        "a": "Ter gráficos de alta qualidade e efeitos sonoros",
        "b": "Permitir que o jogador jogue uma partida inteira e entenda o jogo sem explicações",
        "c": "Incluir várias fases desenhadas à mão",
        "d": "Possuir uma história complexa e envolvente"
      },
      "correta": "b",
      "explicacao": "Um jogo é considerado completo quando o jogador consegue jogar uma partida inteira e entender a mecânica sem precisar de explicações externas.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "gamedev-av-12",
      "nivel": "avancado",
      "pergunta": "Ao desenvolver seu roguelike, qual é a importância de implementar uma máquina de estados para os inimigos?",
      "alternativas": {
        "a": "Para deixar os inimigos mais bonitos visualmente",
        "b": "Para garantir que os inimigos tenham comportamentos variados e realistas",
        "c": "Para simplificar o código e reduzir a complexidade do jogo",
        "d": "Para permitir que os inimigos sejam controlados pelo jogador"
      },
      "correta": "b",
      "explicacao": "Implementar uma máquina de estados permite que os inimigos tenham comportamentos variados, tornando o jogo mais dinâmico e desafiador.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "gamedev-av-13",
      "nivel": "avancado",
      "pergunta": "Você está construindo seu portfólio e decidiu participar de game jams. Qual é o principal benefício dessa prática?",
      "alternativas": {
        "a": "Criar jogos muito longos e complexos rapidamente",
        "b": "Acelerar o aprendizado e gerar projetos para o portfólio",
        "c": "Focar apenas em um único projeto por vez",
        "d": "Obter feedback negativo para melhorar rapidamente"
      },
      "correta": "b",
      "explicacao": "Participar de game jams acelera o aprendizado e gera projetos que podem ser incluídos no portfólio, ajudando no desenvolvimento de habilidades.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "gamedev-av-14",
      "nivel": "avancado",
      "pergunta": "Qual é a recomendação mais eficaz para construir um portfólio sólido na área de desenvolvimento de jogos?",
      "alternativas": {
        "a": "Focar em um grande projeto inacabado",
        "b": "Construir vários jogos pequenos e completos",
        "c": "Participar de eventos apenas como espectador",
        "d": "Publicar jogos sem documentação ou feedback"
      },
      "correta": "b",
      "explicacao": "Construir vários jogos pequenos e completos é mais eficaz do que um grande projeto inacabado, pois cada jogo finalizado ensina mais e demonstra suas habilidades.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "gamedev-av-15",
      "nivel": "avancado",
      "pergunta": "Por que o inglês é uma habilidade importante para quem deseja entrar na carreira de desenvolvimento de jogos?",
      "alternativas": {
        "a": "Porque a maioria dos jogos é feita em inglês",
        "b": "Porque a documentação e as oportunidades estão majoritariamente em inglês",
        "c": "Porque é a única língua falada em game jams",
        "d": "Porque os jogos só podem ser publicados em inglês"
      },
      "correta": "b",
      "explicacao": "O inglês é crucial porque a maior parte da documentação, comunidades e oportunidades de trabalho estão disponíveis nesse idioma.",
      "fonte": "carreira.entrar"
    }
  ]
};

export default pool;
