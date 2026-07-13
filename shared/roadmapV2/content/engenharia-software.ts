// TODO(Ana): revisao editorial completa desta trilha (titulos, descricoes e
// todo o conteudo em markdown sao novos e precisam de revisao de copy).
import type { RoadmapV2 } from "../types";

export const engenhariaSoftware: RoadmapV2 = {
  slug: "engenharia-software",
  area: "carreira",
  kind: "carreira",
  title: "Engenharia de Software do Zero",
  level: "Iniciante",
  description:
    "A disciplina por trás de escrever bom código: lógica, estruturas de dados, paradigmas, padrões, arquitetura e trabalho em time. Vale para qualquer linguagem ou área de desenvolvimento.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é engenharia de software, como ela difere de só programar e o ciclo de vida de um sistema.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.o-que-e",
          title: "O que é engenharia de software",
          description:
            "Escrever código é uma parte; engenharia é construir software que dura, escala e é mantido por um time.",
          content:
            "Programar é escrever instruções que um computador executa. Engenharia de software é o conjunto de práticas para construir sistemas que funcionam de forma confiável, que outras pessoas conseguem entender e mudar, e que continuam de pé quando crescem de dez para dez mil usuários.\n\nA diferença aparece com o tempo. Um script que você escreve numa tarde resolve um problema hoje. Um sistema que uma empresa usa por anos precisa ser lido, corrigido e estendido por gente que nunca conversou com quem escreveu a primeira linha. Engenharia é o que separa código que só roda de código que sobrevive a essa realidade.\n\nEsta trilha é transversal: ela não ensina uma linguagem específica, e sim as ideias que você leva para qualquer linguagem e qualquer área, do front-end ao back-end, de dados a mobile. São os fundamentos que fazem alguém virar engenheiro, não só quem sabe a sintaxe de um idioma.",
        },
        {
          id: "fundamentos.ciclo-de-vida",
          title: "Ciclo de vida do software",
          description:
            "Das ideias ao software no ar: requisitos, design, implementação, testes, entrega e manutenção.",
          content:
            "Todo software passa por fases, mesmo quando ninguém as nomeia. Entender o ciclo de vida (às vezes chamado de SDLC, do inglês Software Development Life Cycle) te dá o mapa do processo inteiro, e não só da parte de escrever código.\n\nAs fases clássicas: levantamento de requisitos (o que precisa ser feito e por quê), design (como vai ser construído), implementação (escrever o código), testes (verificar se funciona e não quebrou nada), entrega/deploy (colocar no ar) e manutenção (corrigir e evoluir depois de lançado). Na prática elas se sobrepõem e se repetem em ciclos curtos, não numa linha reta.\n\nUm detalhe que surpreende quem começa: a maior parte do custo de um software está na manutenção, não na construção inicial. Software é lido muito mais vezes do que é escrito. Guardar isso desde já muda como você programa.",
        },
        {
          id: "fundamentos.papel",
          title: "O papel do engenheiro no time",
          description:
            "Traduzir problemas em soluções técnicas, colaborar e tomar decisões com trade-offs.",
          content:
            "O engenheiro de software não é uma pessoa isolada digitando código. Ele conversa com quem define o produto para entender o problema, decide entre caminhos técnicos com prós e contras, escreve código, revisa o de colegas e mantém o sistema depois que ele está no ar.\n\nBoa parte do trabalho é tomar decisões com trade-offs: quase nada é claramente certo ou errado, e sim mais rápido versus mais flexível, mais simples versus mais poderoso. Reconhecer que existe um trade-off e escolher conscientemente é uma habilidade central da profissão.\n\nComunicação pesa tanto quanto código. Explicar uma decisão, escrever uma mensagem de commit clara, deixar um comentário útil no lugar certo: tudo isso é parte do trabalho de engenharia, porque o software é construído por times, não por heróis solitários.",
        },
      ],
    },
    {
      id: "logica",
      title: "Lógica e algoritmos",
      description:
        "O pensamento por trás de qualquer programa: decompor problemas, montar algoritmos e medir seu custo.",
      level: "iniciante",
      children: [
        {
          id: "logica.pensamento",
          title: "Pensamento algorítmico",
          description:
            "Quebrar um problema grande em passos claros e ordenados que levam à solução.",
          content:
            "Um algoritmo é uma sequência de passos bem definidos que resolve um problema. Antes de qualquer linguagem, a habilidade fundamental é conseguir descrever a solução em passos: dado uma entrada, o que fazer, em que ordem, até chegar na saída desejada.\n\nO caminho é sempre decompor. Um problema grande (\"ordenar uma lista de nomes\") vira problemas menores (\"comparar dois nomes\", \"trocar duas posições\", \"repetir até acabar\"). Resolver os pequenos e juntá-los resolve o grande. Essa quebra é o coração da programação, e você treina ela resolvendo exercícios no papel antes de codar.\n\nCondições (se isso, então aquilo), repetições (faça enquanto) e a combinação das duas cobrem uma quantidade enorme de lógica. Dominar esses blocos em qualquer linguagem é o que permite depois aprender qualquer outra rapidamente.",
        },
        {
          id: "logica.recursao",
          title: "Recursão",
          description:
            "Um problema que se resolve chamando a si mesmo em versões menores, até um caso base.",
          content:
            "Recursão é quando uma função resolve um problema chamando a si mesma para uma versão menor do mesmo problema. Parece estranho no começo, mas é natural para estruturas que se repetem dentro de si, como pastas dentro de pastas ou uma árvore de categorias.\n\nToda recursão precisa de duas coisas para não rodar para sempre: um caso base (a versão tão pequena que a resposta é direta, sem mais chamadas) e um passo que aproxima do caso base a cada chamada. Sem o caso base, o programa se chama infinitamente e estoura.\n\nO exemplo clássico é o fatorial: o fatorial de n é n vezes o fatorial de n menos 1, e o caso base é que o fatorial de 0 é 1. Entender recursão abre a porta para trabalhar com árvores e grafos mais adiante, onde ela costuma ser o caminho mais limpo.",
        },
        {
          id: "logica.complexidade",
          title: "Complexidade e Big-O",
          description:
            "Como estimar se um algoritmo aguenta dados grandes, sem depender do computador.",
          content:
            "Nem todo algoritmo que dá a resposta certa é bom o suficiente. Se ele funciona com 10 itens mas trava com 10 milhões, ele não serve para o mundo real. A notação Big-O é a forma padrão de descrever como o custo de um algoritmo cresce conforme a entrada aumenta.\n\nAlguns padrões que você vai reconhecer sempre: O(1) é custo constante (não importa o tamanho), O(n) cresce proporcional à entrada (percorrer uma lista uma vez), O(n²) cresce ao quadrado (dois laços aninhados, cuidado com dados grandes) e O(log n) cresce devagar (buscas que dividem o problema pela metade a cada passo).\n\nVocê não precisa de matemática pesada para começar: basta olhar seus laços. Um laço sobre os dados é O(n); um laço dentro do outro sobre os mesmos dados é O(n²). Esse olho treinado evita escrever código que funciona no teste e morre em produção.",
        },
      ],
    },
    {
      id: "estruturas",
      title: "Estruturas de dados",
      description:
        "As formas de organizar dados na memória e por que a escolha certa muda tudo.",
      level: "intermediario",
      children: [
        {
          id: "estruturas.listas",
          title: "Arrays e listas",
          description:
            "A estrutura mais básica: uma sequência de elementos acessados por posição.",
          content:
            "Arrays (ou listas, dependendo da linguagem) guardam uma sequência de elementos em ordem, cada um numa posição numerada a partir do zero. É a estrutura que você mais vai usar: uma lista de usuários, de produtos, de mensagens.\n\nO que importa entender é o custo das operações. Acessar um elemento pela posição é imediato (você sabe onde ele está). Já procurar um valor sem saber a posição exige percorrer os elementos um a um, o que fica caro em listas grandes. Inserir ou remover no meio pode obrigar a deslocar todo o resto.\n\nEsse perfil de custos é o que justifica existirem outras estruturas. Quando \"procurar\" ou \"inserir no meio\" viram a operação mais frequente, uma lista simples deixa de ser a melhor escolha, e é aí que entram as próximas estruturas.",
        },
        {
          id: "estruturas.pilha-fila",
          title: "Pilhas e filas",
          description:
            "Duas formas de ordenar acesso: a última que entra sai primeiro, ou a primeira que entra sai primeiro.",
          content:
            "Pilha (stack) e fila (queue) são estruturas simples definidas pela ordem em que os elementos saem. Numa pilha, o último que entra é o primeiro que sai (LIFO), como uma pilha de pratos. Numa fila, o primeiro que entra é o primeiro que sai (FIFO), como uma fila de banco.\n\nElas aparecem o tempo todo, muitas vezes escondidas. O botão \"voltar\" do navegador é uma pilha de páginas. O histórico de \"desfazer\" de um editor é uma pilha de ações. Uma lista de tarefas a processar em ordem de chegada é uma fila. Reconhecer o padrão te dá a estrutura certa de graça.\n\nA própria execução de funções do seu programa usa uma pilha (a call stack): cada função chamada empilha, cada retorno desempilha. Por isso a recursão sem caso base estoura a pilha. Entender pilhas ilumina o que acontece por baixo do código.",
        },
        {
          id: "estruturas.hash",
          title: "Dicionários e tabelas hash",
          description:
            "Guardar e achar um valor por uma chave, quase instantaneamente.",
          content:
            "Um dicionário (mapa, ou hash table) guarda pares de chave e valor: você pede pela chave e recebe o valor de volta, sem precisar percorrer nada. É a estrutura que resolve o problema de \"procurar é caro numa lista\".\n\nO exemplo mental: uma agenda de contatos onde você busca pelo nome e recebe o telefone. Não importa quantos contatos existam, achar um pelo nome é praticamente imediato. Isso vale para contar frequências, remover duplicados, agrupar itens, associar identificadores a objetos.\n\nDicionários são tão úteis que estão em toda linguagem moderna com nomes diferentes (dict, map, object, HashMap). Sempre que você pensar \"eu tenho um identificador e quero achar o dado ligado a ele rápido\", a resposta quase sempre é um dicionário.",
        },
        {
          id: "estruturas.arvores-grafos",
          title: "Árvores e grafos",
          description:
            "Estruturas para dados com hierarquia ou conexões, como pastas, categorias e redes.",
          content:
            "Nem todo dado é uma sequência. Uma árvore representa hierarquia: um nó raiz com filhos, cada filho com seus filhos. Pastas dentro de pastas, categorias e subcategorias, a estrutura de uma página web (o DOM): tudo isso são árvores.\n\nUm grafo é mais geral: nós conectados por ligações, sem hierarquia obrigatória. Uma rede de amizades, um mapa de cidades ligadas por estradas, dependências entre tarefas. Grafos modelam \"o que se conecta a quê\", e percorrê-los é como resolver caminhos e conexões.\n\nNo começo, basta reconhecer quando um problema é uma árvore ou um grafo, porque isso muda completamente a abordagem. Percorrer essas estruturas costuma usar recursão, o que fecha o ciclo com o que você viu na seção de lógica.",
        },
      ],
    },
    {
      id: "paradigmas",
      title: "Paradigmas de programação",
      description:
        "Estilos diferentes de organizar código: orientação a objetos, funcional e por que conhecer os dois ajuda.",
      level: "intermediario",
      children: [
        {
          id: "paradigmas.oo",
          title: "Orientação a objetos",
          description:
            "Modelar o sistema como objetos que guardam dados e comportamentos juntos.",
          content:
            "A orientação a objetos (OO) organiza o código em objetos: unidades que juntam dados (atributos) e comportamentos (métodos) que agem sobre esses dados. Uma classe é o molde; um objeto é uma instância criada a partir dela. Um usuário, um pedido, um carrinho de compras viram objetos com seus dados e ações.\n\nQuatro ideias sustentam o paradigma. Encapsulamento: esconder os detalhes internos e expor só o necessário. Herança: uma classe reaproveitar o que outra já define. Polimorfismo: objetos diferentes responderem à mesma chamada de formas próprias. Abstração: representar o essencial e ignorar o resto.\n\nOO domina boa parte do mercado (Java, C#, Python e muitas outras suportam bem), então entender esses conceitos é quase obrigatório. O objetivo não é usar herança em tudo, e sim modelar o problema de forma que o código espelhe o mundo que ele representa.",
        },
        {
          id: "paradigmas.funcional",
          title: "Programação funcional",
          description:
            "Tratar computação como funções que transformam dados, evitando estado que muda por fora.",
          content:
            "A programação funcional organiza o código em funções que recebem entradas e devolvem saídas, sem alterar coisas por fora. Duas ideias centrais: funções puras (mesma entrada, sempre mesma saída, sem efeitos escondidos) e imutabilidade (em vez de mudar um dado, você cria uma versão nova).\n\nO ganho é previsibilidade. Uma função pura é fácil de testar e de raciocinar, porque ela não depende de nem mexe em nada além do que recebe. Operações como map (transformar cada item), filter (selecionar itens) e reduce (combinar tudo num resultado) são o pão com manteiga desse estilo e aparecem hoje em quase toda linguagem.\n\nVocê não precisa escolher um lado. Linguagens modernas misturam os paradigmas, e bons engenheiros usam OO para estruturar e ideias funcionais para transformar dados. Conhecer os dois te dá mais ferramentas para escrever código claro.",
        },
      ],
    },
    {
      id: "padroes",
      title: "Princípios e padrões de projeto",
      description:
        "Regras e soluções conhecidas para problemas que se repetem, que evitam reinventar a roda de forma ruim.",
      level: "intermediario",
      children: [
        {
          id: "padroes.principios",
          title: "Princípios: SOLID, DRY, KISS, YAGNI",
          description:
            "Diretrizes curtas que guiam decisões do dia a dia rumo a código sustentável.",
          content:
            "Alguns princípios viraram vocabulário comum porque resumem lições caras em poucas letras. DRY (Don't Repeat Yourself): evite duplicar lógica, porque a cópia esquecida vira bug. KISS (Keep It Simple): prefira a solução mais simples que resolve, não a mais esperta. YAGNI (You Aren't Gonna Need It): não construa para um futuro imaginado que talvez nunca chegue.\n\nSOLID é um conjunto de cinco princípios para código orientado a objetos, sendo o mais citado o da responsabilidade única: cada peça deve ter um motivo só para mudar. A ideia geral por trás de todos é reduzir acoplamento (quanto uma parte depende da outra) e aumentar coesão (quanto uma parte é focada num só assunto).\n\nCuidado com o excesso: princípios são guias, não leis. Aplicar SOLID a um script de dez linhas é engenharia demais. O bom senso de quando aplicar vem com prática, e é justamente ele que a experiência constrói.",
        },
        {
          id: "padroes.design-patterns",
          title: "Padrões de projeto",
          description:
            "Soluções testadas para problemas recorrentes de estrutura, com nome e forma conhecidos.",
          content:
            "Padrões de projeto (design patterns) são soluções consagradas para problemas que aparecem repetidamente ao estruturar software. Eles não são código pronto para copiar, e sim receitas que descrevem uma forma de organizar as peças, com um nome que o time inteiro reconhece.\n\nAlguns que você vai encontrar cedo: Factory (uma função central decide qual objeto criar), Strategy (trocar um comportamento por outro sem mexer no resto), Observer (avisar vários interessados quando algo muda) e Singleton (garantir uma única instância de algo). Saber o nome ajuda a conversa: \"aqui cabe um Strategy\" comunica muito em duas palavras.\n\nO risco é o mesmo dos princípios: forçar um padrão onde não precisa deixa o código mais complicado, não menos. Aprenda a reconhecê-los primeiro; aplicá-los com parcimônia vem depois, quando o problema realmente pede.",
        },
      ],
    },
    {
      id: "arquitetura",
      title: "Arquitetura de software",
      description:
        "As decisões de estrutura em nível alto: como dividir o sistema em partes que se encaixam sem virar um nó.",
      level: "avancado",
      children: [
        {
          id: "arquitetura.camadas",
          title: "Separação em camadas",
          description:
            "Dividir o sistema por responsabilidade: interface, regra de negócio e dados.",
          content:
            "Uma das primeiras decisões de arquitetura é separar responsabilidades em camadas. A camada de apresentação cuida da interface e da interação; a de negócio contém as regras que definem o comportamento do sistema; a de dados cuida de guardar e recuperar informação. Cada uma conversa só com a vizinha, por contratos claros.\n\nA vantagem é que você pode mudar uma camada sem quebrar as outras. Trocar o banco de dados não deveria obrigar a reescrever as regras de negócio; mudar a tela não deveria mexer em como os dados são salvos. Essa separação é o que mantém sistemas grandes gerenciáveis.\n\nPadrões como MVC (Model, View, Controller) são formas concretas dessa ideia. O nome varia entre frameworks, mas a intenção é sempre a mesma: manter juntas as coisas que mudam juntas e separadas as que mudam por motivos diferentes.",
        },
        {
          id: "arquitetura.monolito-microservicos",
          title: "Monolito e microserviços",
          description:
            "Um sistema único versus muitos serviços pequenos, e por que não existe escolha universal.",
          content:
            "Um monolito é um sistema construído como uma única aplicação: todo o código roda junto, no mesmo processo. Microserviços dividem o sistema em vários serviços pequenos e independentes, cada um com sua responsabilidade, conversando entre si pela rede.\n\nNão existe vencedor absoluto. O monolito é mais simples de construir, testar e implantar no começo, e por isso é quase sempre a escolha certa para times pequenos e produtos novos. Microserviços ajudam quando o sistema e o time crescem muito, permitindo evoluir e escalar partes de forma independente, ao custo de bem mais complexidade operacional.\n\nA armadilha comum de quem estuda é achar que microserviços são sempre o avançado e melhor. Muita empresa grande voltou de microserviços para monolitos mais organizados. A boa engenharia é escolher pela realidade do problema, não pela moda.",
        },
      ],
    },
    {
      id: "qualidade",
      title: "Qualidade e clean code",
      description:
        "Escrever código que outras pessoas (e o você do futuro) conseguem ler, testar e mudar sem medo.",
      level: "intermediario",
      children: [
        {
          id: "qualidade.clean-code",
          title: "Código legível",
          description:
            "Nomes claros, funções curtas e simplicidade: o que faz um código ser fácil de ler.",
          content:
            "Código é lido muito mais vezes do que é escrito, então clareza vale mais do que esperteza. Código legível começa com nomes: uma variável chamada precoTotal explica a si mesma, enquanto x, tmp ou dado2 obrigam quem lê a decifrar. Funções e variáveis devem dizer o que são e o que fazem.\n\nFunções curtas e focadas, cada uma fazendo uma coisa, são mais fáceis de entender e testar do que uma função gigante que faz de tudo. Evitar aninhamento profundo, remover código morto e não deixar comentários que só repetem o óbvio também contam. O melhor comentário explica o porquê de uma decisão, não o que a linha faz.\n\nA regra prática: escreva pensando na pessoa que vai ler isso daqui a seis meses sem contexto nenhum, que muitas vezes é você mesmo. Se ela vai entender rápido, o código está bom.",
        },
        {
          id: "qualidade.testes",
          title: "Testes automatizados",
          description:
            "Código que verifica seu código, para mudar sem quebrar o que já funcionava.",
          content:
            "Testes automatizados são pedaços de código que verificam se o seu código faz o que deveria. Em vez de abrir a aplicação e conferir na mão toda vez, você escreve verificações que rodam sozinhas e apontam na hora se algo quebrou.\n\nOs níveis mais comuns: testes de unidade checam uma função ou peça isolada; testes de integração checam se várias peças funcionam juntas; testes de ponta a ponta simulam o usuário de verdade percorrendo o sistema. Uma base saudável tem muitos testes de unidade (rápidos e baratos) e menos dos níveis acima.\n\nO valor real aparece na mudança: com testes, você refatora e adiciona funcionalidade com a rede de segurança avisando se você quebrou algo antigo. Sem eles, cada mudança vira uma aposta. TDD (escrever o teste antes do código) é uma disciplina que leva essa ideia ao limite, e vale conhecer.",
        },
        {
          id: "qualidade.refactoring",
          title: "Refatoração e revisão",
          description:
            "Melhorar código já pronto sem mudar o que ele faz, e revisar o código dos colegas.",
          content:
            "Refatorar é melhorar a estrutura interna do código sem mudar o comportamento externo: renomear para clarear, extrair uma função repetida, simplificar uma condição confusa. O sistema faz o mesmo, mas fica mais fácil de entender e mudar. Testes automatizados são o que tornam a refatoração segura.\n\nCode review é a prática de outra pessoa ler seu código antes de ele entrar no sistema, normalmente num pull request. Não é sobre pegar erro do outro, e sim espalhar conhecimento, manter um padrão comum e melhorar a solução com um segundo par de olhos. Aprender a receber e a dar review com respeito é uma habilidade de time.\n\nJuntas, refatoração e revisão são o que mantêm um sistema saudável ao longo dos anos. Código que ninguém melhora e ninguém revisa apodrece devagar até virar aquele módulo que todo mundo tem medo de tocar.",
        },
      ],
    },
    {
      id: "colaboracao",
      title: "Versionamento e trabalho em time",
      description:
        "As ferramentas e práticas de construir software junto: Git, fluxos de trabalho e métodos ágeis.",
      level: "intermediario",
      children: [
        {
          id: "colaboracao.git",
          title: "Git e controle de versão",
          description:
            "Guardar o histórico do código e permitir que várias pessoas trabalhem sem se atropelar.",
          content:
            "Controle de versão é um sistema que guarda o histórico de todas as mudanças no código e permite voltar atrás, comparar versões e trabalhar em paralelo. Git é a ferramenta dominante, e saber usá-la bem é pré-requisito de praticamente qualquer vaga.\n\nO fluxo básico gira em torno de commits (fotos do estado do código com uma mensagem descrevendo a mudança), branches (linhas de trabalho paralelas, para desenvolver algo sem mexer no código estável) e merge (juntar uma branch de volta). Plataformas como o GitHub adicionam o pull request, onde a mudança é revisada antes de entrar.\n\nUma mensagem de commit clara e uma branch por tarefa parecem detalhes, mas são o que deixa o histórico legível e o time produtivo. Git recompensa quem trata o histórico com cuidado, e pune com dor de cabeça quem trata como bagunça.",
        },
        {
          id: "colaboracao.agil",
          title: "Métodos ágeis e comunicação",
          description:
            "Entregar em ciclos curtos, se ajustar rápido e colaborar bem com o time.",
          content:
            "Métodos ágeis são formas de organizar o trabalho em ciclos curtos, entregando pedaços pequenos e funcionais com frequência em vez de sumir por meses e aparecer com tudo pronto. A ideia é receber retorno cedo e se ajustar, porque requisitos mudam e ninguém acerta tudo no papel.\n\nScrum e Kanban são os arranjos mais comuns. O importante para começar não é decorar cerimônias, e sim entender o espírito: trabalho visível, fatias pequenas, feedback constante, melhoria contínua. Reuniões curtas de alinhamento, tarefas num quadro e ciclos com começo e fim são o formato que você vai encontrar.\n\nNo fim, engenharia de software é um esporte de time. A pessoa que escreve código impecável mas não consegue explicar uma decisão, alinhar com colegas ou receber uma crítica trava o grupo. As habilidades técnicas te colocam no jogo; as de colaboração decidem até onde você vai na carreira.",
        },
      ],
    },
  ],
};
