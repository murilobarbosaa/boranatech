// TODO(Ana): revisao editorial do upgrade da fase 3c, lote 1 (reescritas de
// HTTP, framework e projeto final, fechos de criterio de dominio, conexoes
// nominais, blocos de codigo e resources novos).
import type { RoadmapV2 } from "../types";

export const backend: RoadmapV2 = {
  slug: "backend",
  area: "backend",
  title: "Back-end do Zero",
  level: "Iniciante",
  description:
    "Da lógica de servidor até publicar uma API com banco de dados. Conclua uma etapa pra liberar a próxima.",
  languages: [
    { id: "node", label: "Node.js" },
    { id: "python", label: "Python" },
    { id: "java", label: "Java" },
    { id: "go", label: "Go" },
  ],
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "Antes de escrever uma linha de código de servidor, entenda o terreno: como a internet conversa, e as ferramentas que todo dev usa no dia a dia.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.conceitos",
          title: "Como funciona o back-end",
          children: [
            {
              id: "fundamentos.conceitos.clienteservidor",
              title: "Cliente e servidor",
              description:
                "O modelo de pergunta e resposta que sustenta quase tudo na internet.",
              content:
                "Quase tudo que você usa na internet segue o mesmo modelo: de um lado existe um **cliente** (o navegador, o aplicativo no celular) e do outro um **servidor**, um computador ligado o tempo todo esperando pedidos. O cliente pede, o servidor responde. Esse vai e vem se chama modelo cliente-servidor.\n\nQuando você abre um site de filmes, o cliente pede a lista de lançamentos, o servidor busca essa lista, monta a resposta e devolve. O cliente só exibe; quem sabe quais filmes existem, quem pode acessar e onde os dados ficam guardados é o servidor.\n\nO back-end é exatamente esse lado do servidor: o código que recebe os pedidos, aplica as regras do negócio (pode ou não pode? existe ou não existe?), conversa com o banco de dados e devolve uma resposta. Você não vê o back-end na tela, mas toda ação importante passa por ele.\n\nGuarde a ideia central: **o cliente é quem pede, o servidor é quem decide e responde**. O resto da trilha é aprender a construir esse lado que decide.",
              resources: [
                {
                  label: "MDN: Visão geral cliente-servidor",
                  url: "https://developer.mozilla.org/pt-BR/docs/Learn/Server-side/First_steps/Client-Server_overview",
                  kind: "doc",
                },
              ],
            },
            {
              id: "fundamentos.conceitos.http",
              title: "HTTP, métodos e status",
              description:
                "A linguagem que o navegador e o servidor usam pra conversar.",
              content:
                "HTTP é o protocolo que cliente e servidor usam pra conversar, e nesta trilha você está do lado que **responde**: cada detalhe do protocolo deixa de ser curiosidade e vira decisão sua em cada rota.\n\nToda requisição chega com um **método**, que carrega a intenção de quem pede: GET busca, POST cria, PUT e PATCH atualizam, DELETE apaga. Respeitar essa semântica é um contrato com quem consome sua API: um GET nunca pode alterar dados, e um POST repetido pode criar duas vezes; é você quem garante isso.\n\nA resposta que você monta tem três partes. O **status code** conta o resultado em três dígitos: 2xx deu certo, 4xx quem pediu errou, 5xx o seu servidor falhou. Escolher o código certo é responsabilidade sua, e o passo de Status codes, na seção de APIs REST, transforma essa escolha em vocabulário fluente. Os **headers** são os metadados da conversa: o `Content-Type: application/json` avisa o formato do corpo, e é em headers que viajam autenticação e cache. E o **corpo** carrega o dado em si, quase sempre JSON.\n\nO modelo mental pra guardar: um formulário de pedido e uma etiqueta de resposta, sempre nesse par. Você domina este passo quando olha uma requisição real (método, caminho, headers, corpo) e sabe descrever o que o servidor deve devolver em cada parte.",
              resources: [
                {
                  label: "MDN HTTP",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP",
                  kind: "doc",
                },
                {
                  label: "MDN Status HTTP",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status",
                  kind: "doc",
                },
              ],
            },
            {
              id: "fundamentos.conceitos.api",
              title: "O que é uma API",
              description:
                "O cardápio de pedidos que o servidor aceita e a forma das respostas.",
              content:
                "API significa interface de programação de aplicações. Na prática, é o **contrato** que o servidor oferece pro mundo: a lista de pedidos que ele aceita, como cada pedido deve ser feito e o que vem na resposta. Pense num restaurante: você não entra na cozinha, você pede pelo cardápio. A API é o cardápio do seu back-end.\n\nCada item desse cardápio é um **endpoint**: um endereço (como /usuarios ou /produtos/42) combinado com um método HTTP. GET /produtos lista produtos, POST /usuarios cria um usuário. O cliente chama o endpoint, o servidor executa e responde.\n\nNa web, a resposta quase sempre vem em **JSON**, um formato de texto simples com chaves e valores que qualquer linguagem entende. É ele que permite que um back-end em Python converse com um app em JavaScript sem atrito.\n\nIsso importa porque APIs são o produto principal do trabalho de back-end: o site, o aplicativo e até outros sistemas da empresa consomem a mesma API. Construir uma do zero é o objetivo final desta trilha.",
              resources: [
                {
                  label: "MDN: O que é API (glossário)",
                  url: "https://developer.mozilla.org/pt-BR/docs/Glossary/API",
                  kind: "doc",
                },
              ],
            },
            {
              id: "fundamentos.conceitos.frontback",
              title: "Front-end x back-end",
              description:
                "Quem cuida da tela, quem cuida das regras, e como os dois conversam.",
              optional: true,
              content:
                'O **front-end** é tudo que roda no dispositivo do usuário: a tela, os botões, as animações, o que acontece quando você clica. O **back-end** roda no servidor: guarda os dados, aplica as regras, decide quem pode fazer o quê. São dois lados do mesmo produto, e eles conversam por HTTP, geralmente trocando JSON através de uma API.\n\nUm exemplo concreto: ao tocar em "curtir" numa foto, o front-end pinta o coração na hora e manda uma requisição pro back-end. O back-end confere se você está logado, registra a curtida no banco e responde que deu certo. Se o servidor recusar, o front-end desfaz o coração.\n\nA divisão importa porque define onde mora a confiança. O usuário pode mexer no front-end (ele roda na máquina dele), então toda validação que importa de verdade precisa acontecer de novo no back-end.\n\nExiste também o perfil **fullstack**, que transita pelos dois lados. Mas mesmo quem vai de fullstack precisa dominar cada lado separadamente primeiro, e esta trilha cobre o lado do servidor.',
            },
          ],
        },
        {
          id: "fundamentos.terminal",
          title: "Terminal e linha de comando",
          description:
            "A forma de conversar com o computador por texto, ferramenta diária de quem faz back-end.",
          content:
            "O terminal é um programa onde você dá ordens pro computador digitando comandos em vez de clicar em janelas. Parece antiquado, mas é o contrário: é a ferramenta mais usada por quem trabalha com back-end, porque é rápida, precisa e funciona em qualquer servidor, inclusive nos que não têm tela nenhuma.\n\nVocê vai usar o terminal pra tudo nesta trilha: instalar a linguagem, rodar seu servidor, usar o Git, ver logs de erro e publicar seu projeto. Servidores em produção são controlados quase só assim.\n\nO básico cabe em poucos comandos: `cd` entra numa pasta, `ls` lista o que tem nela (no Windows, `dir`), `mkdir` cria uma pasta e `pwd` mostra onde você está. Com esses quatro você já navega por qualquer projeto.\n\nNão precisa decorar dezenas de comandos agora. A fluência vem do uso: abra o terminal, navegue até uma pasta sua, crie outra, entre nela. Você domina este passo quando chega em qualquer pasta do computador e monta a estrutura de um projeto sem tocar no mouse; cada etapa seguinte da trilha vai reforçar o hábito.",
          resources: [
            {
              label: "Ubuntu: linha de comando pra iniciantes",
              url: "https://ubuntu.com/tutorials/command-line-for-beginners",
              kind: "artigo",
            },
          ],
        },
        {
          id: "fundamentos.git",
          title: "Git e GitHub",
          children: [
            {
              id: "fundamentos.git.basico",
              title: "add, commit, push",
              description:
                "O ciclo básico de salvar versões do código e enviar pro GitHub.",
              content:
                'Git é um sistema de controle de versão: ele guarda o histórico do seu código em "fotografias" chamadas **commits**. Com isso você pode voltar atrás quando algo quebra, comparar o que mudou e trabalhar em equipe sem sobrescrever o trabalho dos outros. O GitHub é o site onde esses repositórios ficam hospedados na nuvem.\n\nO ciclo do dia a dia tem três passos. `git add` marca quais arquivos entram na próxima fotografia. `git commit -m "mensagem"` tira a fotografia, com uma mensagem curta dizendo o que mudou. `git push` envia seus commits pro GitHub, deixando tudo salvo fora da sua máquina.\n\nA mensagem do commit importa mais do que parece: "corrige cálculo do frete" ajuda; "mudanças" não diz nada. Acostume-se a commits pequenos e frequentes, cada um com uma mudança que faz sentido sozinha.\n\nIsso não é opcional na carreira: todo time de tecnologia usa Git, e seu GitHub funciona como vitrine do seu trabalho pra recrutadores. Cada projeto desta trilha deve terminar publicado lá. O domínio aqui é mecânico: o ciclo add, commit e push saindo sem consulta, com mensagens que contam a história do projeto.',
              resources: [
                {
                  label: "Pro Git (livro oficial, em português)",
                  url: "https://git-scm.com/book/pt-br/v2",
                  kind: "doc",
                },
              ],
            },
            {
              id: "fundamentos.git.branches",
              title: "Branches e merge",
              description:
                "Linhas paralelas de trabalho que depois se juntam ao código principal.",
              content:
                "Uma **branch** é uma linha paralela do seu código. A principal costuma se chamar `main` e representa a versão estável. Quando você vai fazer algo novo (uma funcionalidade, uma correção), cria uma branch separada com `git checkout -b nome-da-branch` e trabalha nela à vontade, sem risco de quebrar o que já funciona.\n\nQuando o trabalho fica pronto, você junta a branch de volta na principal com um **merge**: o Git combina os dois históricos. Se você e outra pessoa mexeram na mesma linha do mesmo arquivo, o Git não sabe qual versão vale e sinaliza um **conflito**, que você resolve escolhendo manualmente o que fica. Conflito assusta no começo, mas é rotina, não acidente.\n\nA ideia central é isolar o trabalho em andamento do código que funciona. Mesmo sozinho num projeto pessoal, vale praticar o fluxo de criar branch, terminar a mudança e fazer merge, porque é exatamente assim que os times profissionais operam, e chegar numa equipe já fluente nisso conta muitos pontos. Considere o passo vencido no dia em que criar branch, resolver um conflito e fazer merge deixar de dar frio na barriga.",
              resources: [
                {
                  label: "Pro Git: branches em poucas palavras",
                  url: "https://git-scm.com/book/pt-br/v2/Branches-no-Git-Branches-em-poucas-palavras",
                  kind: "doc",
                },
              ],
            },
            {
              id: "fundamentos.git.pr",
              title: "Pull requests",
              description:
                "O pedido formal de revisão antes do seu código entrar no projeto.",
              content:
                'Um **pull request** (PR) é o jeito de propor que sua branch entre no código principal de um projeto no GitHub. Em vez de fazer o merge direto, você abre um PR dizendo "terminei essa mudança, alguém revisa?". Outras pessoas leem o código, comentam linha por linha, pedem ajustes, e só depois da aprovação a mudança é incorporada.\n\nÉ assim que praticamente todo time profissional trabalha: ninguém manda código pra produção sem que outro par de olhos passe por ele. O PR também vira documentação: meses depois, dá pra entender o que mudou e por quê.\n\nUm bom PR é pequeno e focado: uma mudança por vez, com título claro e uma descrição curta do que foi feito. PRs gigantes são difíceis de revisar e demoram a ser aprovados.\n\nPra praticar, você não precisa de um time: abra PRs nos seus próprios projetos, das suas branches pra `main`, e escreva as descrições como se outra pessoa fosse ler. Além de criar o hábito, isso deixa seu GitHub com cara de quem já trabalha do jeito profissional.',
              resources: [
                {
                  label: "GitHub Docs: sobre pull requests",
                  url: "https://docs.github.com/pt/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests",
                  kind: "doc",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "linguagem",
      title: "Sua linguagem",
      description:
        "Escolha uma das quatro linguagens e aprenda a base dela de verdade. O conceito é o mesmo em todas; o que muda é a escrita.",
      level: "iniciante",
      children: [
        {
          id: "linguagem.escolha",
          title: "Como escolher sua linguagem",
          description:
            "As quatro opções da trilha, onde cada uma brilha e por que a escolha importa menos do que parece.",
          content:
            "Esta trilha funciona com quatro linguagens, e você escolhe uma pra seguir. A boa notícia: os conceitos de back-end (HTTP, API, banco, autenticação) são os mesmos em todas. Quem aprende bem uma linguagem troca de linguagem depois sem recomeçar do zero.\n\nUm retrato rápido de cada uma:\n\n- **Node.js** roda JavaScript no servidor. Se você já viu JavaScript no front-end, é o caminho mais curto: uma língua só pros dois lados. Muito comum em startups e produtos web.\n- **Python** é famosa pela leitura fácil, ótima primeira linguagem. Além de back-end, abre portas pra dados e inteligência artificial.\n- **Java com Spring Boot** é o padrão do mundo corporativo: bancos, grandes empresas e sistemas que vivem décadas. Tem mais cerimônia no começo, mas é presença constante em vagas formais.\n- **Go** foi criada pelo Google pensando em servidores: simples, rápida e forte em infraestrutura e cloud. Menos material pra iniciante em português, mas a linguagem em si é enxuta.\n\nA regra de ouro: **escolha uma e fique nela até o fim da trilha**. Trocar de linguagem no meio é a forma mais comum de não sair do lugar. Em dúvida? Já mexeu com JavaScript, vá de Node. Nunca programou, vá de Python.",
        },
        {
          id: "linguagem.setup",
          title: "Instalar e rodar",
          description:
            "Deixar a linguagem instalada na sua máquina e rodar o primeiro programa.",
          content:
            "Antes de aprender qualquer sintaxe, você precisa do ambiente funcionando: a linguagem instalada, um editor de código e a capacidade de rodar um arquivo e ver o resultado no terminal.\n\nO editor recomendado pra qualquer uma das quatro linguagens é o **VS Code**, gratuito e padrão de mercado (pra Java, o IntelliJ IDEA Community também é uma ótima escolha). O ritual é o mesmo em todas: instalar, abrir o terminal, confirmar a versão com um comando e rodar um programa que imprime uma mensagem na tela.\n\nNão pule esta etapa nem deixe pela metade. Boa parte da frustração de iniciante não é com lógica, é com ambiente quebrado. Vale gastar uma hora aqui pra não travar depois. O critério de pronto é binário: editar um arquivo, rodar no terminal e ver a mensagem aparecer. Escolha sua linguagem acima pra ver o passo a passo dela.",
          byLanguage: {
            node: {
              content:
                'Baixe o Node.js no site oficial, sempre a versão **LTS** (a estável, de suporte longo). A instalação já traz o npm junto. Confirme no terminal com `node --version`, crie um arquivo `app.js` com `console.log("olá")` e rode com `node app.js`.',
              resources: [
                {
                  label: "Node.js: download oficial",
                  url: "https://nodejs.org/pt/download",
                  kind: "doc",
                },
              ],
            },
            python: {
              content:
                'Baixe no site oficial do Python (no Windows, marque a opção de adicionar ao PATH durante a instalação; no Linux e Mac costuma já vir instalado). Confirme com `python3 --version`, crie um `app.py` com `print("olá")` e rode com `python3 app.py`.',
              resources: [
                {
                  label: "Python: download oficial",
                  url: "https://www.python.org/downloads/",
                  kind: "doc",
                },
                {
                  label: "Documentação oficial em português",
                  url: "https://docs.python.org/pt-br/3/",
                  kind: "doc",
                },
              ],
            },
            java: {
              content:
                "Você precisa do **JDK** (o kit de desenvolvimento). Baixe o Temurin no site da Adoptium, uma distribuição gratuita e amplamente usada. Confirme com `java --version`. Pra rodar um primeiro programa, crie um `Main.java` com o método `main` imprimindo algo e use `java Main.java`. O Spring Boot entra mais à frente, na parte de servidor.",
              resources: [
                {
                  label: "Adoptium (JDK Temurin)",
                  url: "https://adoptium.net",
                  kind: "doc",
                },
                {
                  label: "Dev.java: aprenda Java",
                  url: "https://dev.java/learn/",
                  kind: "doc",
                },
              ],
            },
            go: {
              content:
                "Baixe no site oficial go.dev e siga o instalador. Confirme com `go version`, crie um `main.go` com o pacote `main` e uma função `main` imprimindo algo, e rode com `go run main.go`. O Go também compila pra um executável único com `go build`, um dos charmes da linguagem.",
              resources: [
                {
                  label: "Go: instalação oficial",
                  url: "https://go.dev/doc/install",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "linguagem.sintaxe",
          title: "Sintaxe, tipos e variáveis",
          description:
            "Como declarar valores, e o que significa uma linguagem ter tipos.",
          content:
            "Todo programa manipula valores: textos, números, verdadeiro ou falso. Uma **variável** é um nome que guarda um valor pra você usar depois. O **tipo** diz que espécie de valor é: texto (string), número, booleano.\n\nA grande divisão entre linguagens é como elas tratam tipos. Em linguagens de **tipagem dinâmica** (JavaScript, Python), a variável aceita qualquer coisa e o tipo é descoberto na hora de rodar. Em linguagens de **tipagem estática** (Java, Go), você declara o tipo e o compilador barra erros antes mesmo do programa rodar, trocando um pouco de velocidade de escrita por segurança.\n\nNenhum dos dois modelos é melhor em tudo; você vai conviver com os dois na carreira. O que importa agora é ganhar fluência: declarar variáveis, juntar textos, fazer contas e imprimir resultados sem precisar consultar nada. Escolha sua linguagem pra ver a sintaxe dela.",
          byLanguage: {
            node: {
              content:
                "Em JavaScript, declare com `const` (valor que não muda de referência) e `let` (valor que muda). Esqueça o `var`, é legado. Tipos principais: string, number, boolean, object e array. Pra juntar texto e variável, use template literals: `Olá, ${nome}` (escritos entre crases). A tipagem é dinâmica; mais adiante na trilha o TypeScript adiciona tipos por cima.",
              resources: [
                {
                  label: "MDN: gramática e tipos em JavaScript",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Grammar_and_types",
                  kind: "doc",
                },
              ],
            },
            python: {
              content:
                'Em Python, não há palavra-chave pra declarar: `nome = "Ana"` cria a variável. Tipos principais: str, int, float, bool, list e dict. A convenção de nomes é snake_case (`total_pedidos`). Um detalhe que define a linguagem: blocos de código são marcados por **indentação** (o recuo no início da linha), não por chaves. Pra juntar texto, use f-strings: `f"Olá, {nome}"`.',
              resources: [
                {
                  label: "Tutorial oficial: introdução informal ao Python",
                  url: "https://docs.python.org/pt-br/3/tutorial/introduction.html",
                  kind: "doc",
                },
              ],
            },
            java: {
              content:
                'Em Java, todo código vive dentro de uma classe, e variáveis declaram o tipo: `String nome = "Ana"`, `int idade = 20`, `boolean ativo = true`. Em versões recentes o `var` deduz o tipo (`var nome = "Ana"`), mas a variável continua tendo tipo fixo. A convenção é camelCase pra variáveis e PascalCase pra classes. É mais cerimônia que as outras, e em troca o compilador pega muito erro antes de rodar.',
              resources: [
                {
                  label: "Dev.java: linguagem básica",
                  url: "https://dev.java/learn/language-basics/",
                  kind: "doc",
                },
              ],
            },
            go: {
              content:
                'Em Go, declare com tipo explícito (`var nome string = "Ana"`) ou deixe o compilador deduzir com a forma curta `nome := "Ana"`, que é a mais usada no dia a dia. Tipos principais: string, int, float64, bool. Detalhe marcante: variável declarada e não usada é **erro de compilação**, o Go não deixa sujeira acumular. O comando `gofmt` formata o código no padrão único da comunidade.',
              resources: [
                {
                  label: "A Tour of Go",
                  url: "https://go.dev/tour/",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "linguagem.controle",
          title: "Condicionais e laços",
          description: "Fazer o programa decidir caminhos e repetir tarefas.",
          content:
            "Um programa que só executa de cima pra baixo não resolve quase nada. **Condicionais** (if/else) deixam o código escolher um caminho: se o usuário está logado, mostra o painel; senão, manda pro login. **Laços** (loops) repetem uma tarefa: pra cada produto da lista, calcula o preço com desconto.\n\nEsses dois mecanismos são o coração da lógica de programação. No back-end, você vai usá-los o tempo todo: validar cada campo de um formulário, percorrer resultados do banco de dados, decidir qual resposta devolver pra cada situação.\n\nA recomendação aqui é prática deliberada: resolva exercícios pequenos (par ou ímpar, soma de uma lista, contagem de itens) até que escrever um if ou um for seja tão natural quanto escrever uma frase. Esse é o investimento que faz todo o resto da trilha andar rápido.",
          byLanguage: {
            node: {
              content:
                "JavaScript tem `if/else`, `switch`, `while` e várias formas de `for`. Pra percorrer arrays, prefira `for...of`: `for (const item of lista)`. Uma pegadinha clássica: use sempre `===` (comparação estrita) em vez de `==`, que faz conversões automáticas traiçoeiras.",
              resources: [
                {
                  label: "MDN: controle de fluxo e tratamento de erro",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Control_flow_and_error_handling",
                  kind: "doc",
                },
              ],
            },
            python: {
              content:
                "Python usa `if/elif/else` e dois laços: `while` e o `for`, que percorre qualquer coleção direto (`for item in lista:`). Pra repetir um número fixo de vezes, combine com `range`: `for i in range(10):`. Lembre que o bloco é definido pela indentação, então o recuo errado muda o comportamento do programa.",
              resources: [
                {
                  label: "Tutorial oficial: controle de fluxo",
                  url: "https://docs.python.org/pt-br/3/tutorial/controlflow.html",
                  kind: "doc",
                },
              ],
            },
            java: {
              content:
                "Java tem `if/else`, `switch`, `while` e `for` clássico com contador. Pra percorrer coleções, use o for-each: `for (String nome : nomes)`. Versões recentes trazem o switch em forma de expressão, mais enxuto, mas o básico acima cobre tudo que você precisa nesta fase.",
              resources: [
                {
                  label: "Dev.java: instruções de controle de fluxo",
                  url: "https://dev.java/learn/language-basics/controlling-flow/",
                  kind: "doc",
                },
              ],
            },
            go: {
              content:
                "Go simplifica: existe **um único laço**, o `for`, que cobre todos os casos (com contador, como while, ou infinito). Pra percorrer coleções, use `for i, valor := range lista`. O `if` dispensa parênteses na condição, e o `switch` não precisa de `break`: cada caso já para sozinho.",
              resources: [
                {
                  label: "A Tour of Go: controle de fluxo",
                  url: "https://go.dev/tour/flowcontrol/1",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "linguagem.funcoes",
          title: "Funções",
          description:
            "Empacotar um pedaço de lógica com nome, entrada e saída.",
          content:
            "Uma **função** é um bloco de código com nome, que recebe entradas (parâmetros), faz um trabalho e devolve uma saída (retorno). Em vez de repetir as mesmas dez linhas em cinco lugares, você escreve uma função e chama cinco vezes.\n\nFunções são a unidade básica de organização de qualquer sistema. Um back-end de verdade é uma pilha delas: uma valida o e-mail, outra calcula o frete, outra busca o usuário no banco. Quando cada função faz **uma coisa só** e tem um nome que diz o que faz (`calcularFrete`, não `processar`), o código vira leitura, não decifração.\n\nDois hábitos pra criar desde já: prefira funções curtas, e prefira que elas **retornem** valores em vez de só imprimir na tela. Função que retorna pode ser testada, combinada e reaproveitada; função que só imprime é um beco sem saída.",
          byLanguage: {
            node: {
              content:
                "JavaScript tem duas formas principais: a declaração clássica (`function somar(a, b) { return a + b }`) e a **arrow function** (`const somar = (a, b) => a + b`), muito comum em código moderno. As duas convivem; aprenda a ler ambas. Funções são valores: podem ser guardadas em variáveis e passadas pra outras funções, e isso vai aparecer bastante no Express.",
              resources: [
                {
                  label: "MDN: funções",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Functions",
                  kind: "doc",
                },
              ],
            },
            python: {
              content:
                'Em Python, funções nascem com `def`: `def somar(a, b): return a + b`. Parâmetros podem ter valor padrão (`def saudacao(nome, formal=False):`) e podem ser passados por nome na chamada (`saudacao(nome="Ana")`), o que deixa o código bem legível. Docstrings (a string logo abaixo do `def`) documentam o que a função faz.',
              resources: [
                {
                  label: "Tutorial oficial: definindo funções",
                  url: "https://docs.python.org/pt-br/3/tutorial/controlflow.html#defining-functions",
                  kind: "doc",
                },
              ],
            },
            java: {
              content:
                "Em Java, funções se chamam **métodos** e vivem dentro de classes, declarando o tipo do retorno e de cada parâmetro: `int somar(int a, int b) { return a + b; }`. Métodos `static` podem ser chamados sem criar objeto, e `void` indica que não há retorno. Essa tipagem toda parece burocracia, mas é ela que deixa o compilador trabalhar a seu favor.",
              resources: [
                {
                  label: "Dev.java: definindo métodos",
                  url: "https://dev.java/learn/classes-objects/defining-methods/",
                  kind: "doc",
                },
              ],
            },
            go: {
              content:
                "Em Go: `func somar(a int, b int) int { return a + b }`. A marca registrada é o **retorno múltiplo**: uma função pode devolver dois valores, e o padrão da linguagem é devolver o resultado e um erro juntos (`valor, err := buscar(id)`). Você vai checar `if err != nil` o tempo todo; é assim que Go trata erro, de forma explícita.",
              resources: [
                {
                  label: "A Tour of Go: funções",
                  url: "https://go.dev/tour/basics/4",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "linguagem.estruturas",
          title: "Listas e mapas",
          description:
            "As duas estruturas que guardam quase todos os dados de um programa.",
          content:
            "Duas estruturas resolvem a maior parte dos problemas de organização de dados. A **lista** guarda valores em ordem: os produtos de um carrinho, as mensagens de um chat. O **mapa** (também chamado de dicionário) guarda pares de chave e valor: o nome aponta pro telefone, o id aponta pro usuário.\n\nA escolha entre elas é sobre **como você vai buscar o dado depois**. Precisa manter ordem e percorrer tudo? Lista. Precisa achar um item direto pela chave, sem procurar um por um? Mapa.\n\nNo back-end isso é onipresente: o corpo JSON de uma requisição vira um mapa, o resultado de uma consulta ao banco vira uma lista de mapas, a resposta da sua API é montada combinando os dois. Você domina este passo quando cria, percorre e transforma uma lista de mapas (a forma de quase todo dado de API) sem consultar a documentação; é pré-requisito direto pra tudo que vem nas próximas seções.",
          byLanguage: {
            node: {
              content:
                'Em JavaScript, a lista é o **array** (`const frutas = ["maçã", "uva"]`) e o mapa do dia a dia é o **objeto** (`const user = { nome: "Ana", idade: 20 }`). Aprenda os métodos de array que o back-end usa sem parar: `map` transforma, `filter` seleciona e `find` localiza. Existe também a classe `Map` pra casos específicos, mas objetos cobrem o comum.',
              resources: [
                {
                  label: "MDN: coleções indexadas",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Indexed_collections",
                  kind: "doc",
                },
              ],
            },
            python: {
              content:
                'Em Python, a lista é a `list` (`frutas = ["maçã", "uva"]`) e o mapa é o `dict` (`user = {"nome": "Ana", "idade": 20}`). Vale conhecer também a `tuple` (lista imutável) e o `set` (conjunto sem repetição). As list comprehensions (`[p.nome for p in produtos]`) são o jeito pythônico de transformar listas, e aparecem em todo código profissional.',
              resources: [
                {
                  label: "Tutorial oficial: estruturas de dados",
                  url: "https://docs.python.org/pt-br/3/tutorial/datastructures.html",
                  kind: "doc",
                },
              ],
            },
            java: {
              content:
                "Em Java, a lista dinâmica é a `ArrayList` e o mapa é o `HashMap`, ambos do Collections Framework. Os tipos dos elementos vão entre colchetes angulares (generics): `List<String> nomes = new ArrayList<>()` e `Map<String, Usuario> porId = new HashMap<>()`. Programe sempre contra as interfaces `List` e `Map`, é a convenção do ecossistema.",
              resources: [
                {
                  label: "Dev.java: o Collections Framework",
                  url: "https://dev.java/learn/api/collections-framework/",
                  kind: "doc",
                },
              ],
            },
            go: {
              content:
                'Em Go, a lista do dia a dia é o **slice** (`frutas := []string{"maçã", "uva"}`), que cresce com `append`. O mapa é o `map`: `idades := map[string]int{"Ana": 20}`. Tudo tem tipo fixo: um slice de string só aceita strings. Pra agrupar campos com nomes diferentes (um usuário com nome e idade), Go usa **structs**, que você encontra logo no Tour.',
              resources: [
                {
                  label: "A Tour of Go: structs, slices e maps",
                  url: "https://go.dev/tour/moretypes/1",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "linguagem.pacotes",
          title: "Gerenciador de pacotes",
          description:
            "Instalar código pronto da comunidade e controlar as dependências do projeto.",
          content:
            "Ninguém constrói tudo do zero. Pra falar com banco de dados, validar dados ou criptografar senha, você instala **pacotes**: bibliotecas prontas publicadas pela comunidade. O **gerenciador de pacotes** é a ferramenta que baixa, instala e atualiza essas bibliotecas pra você.\n\nCada projeto declara suas **dependências** num arquivo de manifesto. Isso é o que permite outra pessoa (ou um servidor de produção) clonar seu projeto e instalar exatamente as mesmas bibliotecas com um comando. Junto vem o arquivo de **lock**, que congela as versões exatas pra garantir que funciona igual em qualquer máquina.\n\nDois cuidados desde o início: entenda o que cada pacote que você instala faz (dependência é código de terceiros rodando no seu servidor) e nunca edite as pastas de bibliotecas instaladas à mão. Escolha sua linguagem pra conhecer a ferramenta dela.",
          byLanguage: {
            node: {
              content:
                "O **npm** já vem com o Node. `npm init` cria o projeto, `npm install express` adiciona uma dependência. O manifesto é o `package.json`, o lock é o `package-lock.json`, e tudo se instala na pasta `node_modules` (que nunca vai pro Git). Existem alternativas como pnpm e yarn, mas comece pelo npm.",
              resources: [
                {
                  label: "Documentação oficial do npm",
                  url: "https://docs.npmjs.com",
                  kind: "doc",
                },
              ],
            },
            python: {
              content:
                "O **pip** instala pacotes (`pip install fastapi`), e o costume é registrar as dependências num `requirements.txt`. Antes de instalar qualquer coisa, crie um **ambiente virtual** com `python3 -m venv .venv` e ative; ele isola as bibliotecas de cada projeto pra uma não conflitar com a outra. Pular o venv é a fonte clássica de dor de cabeça em Python.",
              resources: [
                {
                  label: "Tutorial oficial: ambientes virtuais e pacotes",
                  url: "https://docs.python.org/pt-br/3/tutorial/venv.html",
                  kind: "doc",
                },
              ],
            },
            java: {
              content:
                "No mundo Java, quem gerencia dependências é o **Maven** (manifesto `pom.xml`) ou o **Gradle** (`build.gradle`), que também compilam e empacotam o projeto. Na prática, com Spring Boot você quase nunca configura isso na mão: o **Spring Initializr** gera o projeto já com tudo amarrado. Comece por ele e aprenda o Maven aos poucos, lendo o `pom.xml` gerado.",
              resources: [
                {
                  label: "Maven (documentação oficial)",
                  url: "https://maven.apache.org",
                  kind: "doc",
                },
                {
                  label: "Spring Initializr",
                  url: "https://start.spring.io",
                  kind: "doc",
                },
              ],
            },
            go: {
              content:
                "Go traz isso embutido na linguagem, sem ferramenta extra: são os **Go Modules**. `go mod init nome-do-modulo` cria o projeto, `go get` adiciona uma dependência, e o manifesto é o `go.mod` (com o `go.sum` travando as versões). O próprio comando `go` baixa o que falta na hora de compilar.",
              resources: [
                {
                  label: "Go: gerenciando dependências",
                  url: "https://go.dev/doc/modules/managing-dependencies",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "linguagem.modulos",
          title: "Módulos e imports",
          description: "Dividir o programa em vários arquivos que se enxergam.",
          content:
            "Projeto de verdade não cabe num arquivo só. **Módulos** são a forma de dividir o código em arquivos separados, cada um cuidando de um assunto, e **imports** são a forma de um arquivo usar o que outro oferece.\n\nA mecânica tem sempre dois lados: um arquivo **exporta** (torna público) o que quer compartilhar, funções, constantes, classes, e outro arquivo **importa** o que precisa. O que não é exportado fica privado daquele módulo, e isso é um recurso, não uma limitação: esconder detalhes internos evita que uma mudança num arquivo quebre dez outros.\n\nIsso prepara o terreno pra estrutura em camadas que você monta mais adiante na trilha: rotas num arquivo, regras de negócio em outro, acesso ao banco em outro. Por enquanto, o exercício é simples: pegue um programa seu de arquivo único e separe em dois ou três módulos que se importam.",
          byLanguage: {
            node: {
              content:
                'JavaScript tem dois sistemas: o **CommonJS** (`require`/`module.exports`), padrão histórico do Node, e os **ES Modules** (`import`/`export`), o padrão moderno. Pra projeto novo, use ES Modules: adicione `"type": "module"` no `package.json` e escreva `import { somar } from "./matematica.js"`. Você ainda vai esbarrar em `require` por aí, então aprenda a ler os dois.',
              resources: [
                {
                  label: "Node.js: ECMAScript modules",
                  url: "https://nodejs.org/api/esm.html",
                  kind: "doc",
                },
              ],
            },
            python: {
              content:
                "Em Python, **todo arquivo .py já é um módulo**. Se `matematica.py` define `somar`, outro arquivo usa com `from matematica import somar` (ou `import matematica` e depois `matematica.somar()`). Pastas com vários módulos formam pacotes. Não existe palavra-chave de exportação: tudo que o módulo define pode ser importado, e a convenção de prefixar com `_` sinaliza o que é interno.",
              resources: [
                {
                  label: "Tutorial oficial: módulos",
                  url: "https://docs.python.org/pt-br/3/tutorial/modules.html",
                  kind: "doc",
                },
              ],
            },
            java: {
              content:
                "Java organiza código em **packages**, que espelham a estrutura de pastas: o arquivo declara `package com.exemplo.loja;` no topo, e quem precisa dele escreve `import com.exemplo.loja.Produto;`. A visibilidade é controlada por `public` e `private`. As IDEs (IntelliJ, VS Code) geram e organizam os imports sozinhas, então o custo disso no dia a dia é baixo.",
              resources: [
                {
                  label: "Dev.java: pacotes",
                  url: "https://dev.java/learn/packages/",
                  kind: "doc",
                },
              ],
            },
            go: {
              content:
                'Em Go, **cada pasta é um package**: todos os arquivos dela declaram o mesmo `package nome` e se enxergam sem import. Entre pacotes, importa-se pelo caminho do módulo: `import "meu-modulo/pedidos"`. A regra de visibilidade é única no mundo das linguagens: **nome com inicial maiúscula é exportado, minúscula é privado**. `Somar` é público, `somar` é interno.',
              resources: [
                {
                  label: "Go: como escrever código Go",
                  url: "https://go.dev/doc/code",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "linguagem.async",
          title: "Assíncrono e concorrência",
          description:
            "Como o servidor faz outras coisas enquanto espera o banco ou a rede responder.",
          content:
            'Boa parte do tempo de um back-end é **espera**: espera o banco de dados responder, espera outra API responder, espera o disco. Se o programa parasse a cada espera, um servidor atenderia um usuário por vez e seria inutilizável. Código **assíncrono** e **concorrência** são as técnicas pra continuar trabalhando enquanto a espera acontece.\n\nA ideia central: quando uma operação demorada começa (uma consulta ao banco), o programa não fica parado olhando pra ela; ele registra "quando isso terminar, continue daqui" e vai atender outras requisições. É assim que um servidor modesto atende milhares de usuários ao mesmo tempo.\n\nCada linguagem resolve isso de um jeito bem diferente, e essa é uma das maiores diferenças práticas entre as quatro da trilha. Não precisa dominar tudo agora: entenda o modelo da sua linguagem e saiba escrever o padrão básico dela. A fluência vem quando você estiver consultando banco de dados de verdade, mais adiante.',
          byLanguage: {
            node: {
              content:
                "Node é o caso mais radical: **tudo é assíncrono por padrão**. Operações demoradas devolvem uma **Promise**, e o jeito moderno de consumir é `async/await`: `const user = await buscarUsuario(id)`. O `await` pausa só aquela função, não o servidor. Como o Node roda num laço de eventos de thread única, código assíncrono não é opcional, é o idioma da plataforma. Domine isso antes do Express.",
              resources: [
                {
                  label: "MDN: usando promises",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Using_promises",
                  kind: "doc",
                },
              ],
            },
            python: {
              content:
                "Python é síncrono por padrão, e há um mundo assíncrono opcional com `asyncio` e a mesma dupla `async/await` (`user = await buscar_usuario(id)`). O FastAPI, framework desta trilha, suporta os dois estilos: funções normais e funções `async`. Pra começar, escreva o simples e adote `async` quando a rota fizer chamadas de rede ou banco que suportem isso.",
              resources: [
                {
                  label: "Documentação oficial: asyncio",
                  url: "https://docs.python.org/pt-br/3/library/asyncio.html",
                  kind: "doc",
                },
              ],
            },
            java: {
              content:
                "O modelo clássico do Java é de **threads**: o servidor mantém várias linhas de execução, e cada requisição ocupa uma delas do início ao fim. A vantagem pra quem aprende: com Spring Boot **você escreve código normal, de cima pra baixo**, e o framework cuida da concorrência entre requisições. Versões recentes do Java adicionaram virtual threads, que barateiam esse modelo, mas isso é refinamento pra depois.",
              resources: [
                {
                  label: "Dev.java: aprenda Java",
                  url: "https://dev.java/learn/",
                  kind: "doc",
                },
              ],
            },
            go: {
              content:
                "Concorrência é a especialidade do Go: as **goroutines** são tarefas levíssimas que rodam em paralelo, criadas com uma palavra só (`go minhaFuncao()`), e **channels** passam dados entre elas com segurança. O melhor pra quem está começando: o servidor HTTP da biblioteca padrão já roda **cada requisição na sua própria goroutine**, então você escreve código simples e síncrono e ganha a concorrência de graça.",
              resources: [
                {
                  label: "A Tour of Go: concorrência",
                  url: "https://go.dev/tour/concurrency/1",
                  kind: "doc",
                },
              ],
            },
          },
        },
      ],
    },
    {
      id: "servidor",
      title: "Servidor web",
      description:
        "Seu primeiro servidor de verdade: receber requisições, separar por rota e devolver respostas.",
      level: "intermediario",
      children: [
        {
          id: "servidor.http",
          title: "O que é um servidor HTTP",
          description:
            "Um programa que fica escutando uma porta e responde a cada requisição que chega.",
          content:
            "Um servidor HTTP é um programa que **nunca termina**: ele sobe, fica escutando uma **porta** (um número que identifica o serviço dentro da máquina, como a 3000 ou a 8080) e entra num ciclo eterno: chegou requisição, processa, devolve resposta, espera a próxima.\n\nIsso muda o jeito de pensar em relação aos scripts que você escreveu até aqui. Um script roda de cima pra baixo e acaba; um servidor é um atendente de plantão. Cada requisição que chega traz um método (GET, POST), um caminho (/produtos) e talvez dados, e o seu código decide o que responder pra cada combinação.\n\nDurante o desenvolvimento, o servidor roda na sua própria máquina e você o acessa pelo endereço **localhost** (a máquina apontando pra ela mesma) seguido da porta: `http://localhost:3000`. Abra no navegador ou use uma ferramenta de testar APIs e veja a resposta chegar.\n\nA ideia central pra levar: back-end é escrever a função que transforma **requisição em resposta**. Todo o resto da trilha (rotas, banco, autenticação) é sofisticar essa transformação.",
          resources: [
            {
              label: "MDN: o que é um servidor web",
              url: "https://developer.mozilla.org/pt-BR/docs/Learn/Common_questions/Web_mechanics/What_is_a_web_server",
              kind: "doc",
            },
          ],
        },
        {
          id: "servidor.framework",
          title: "Framework web",
          description:
            "A ferramenta que cuida de rotas, requisições e respostas pra você.",
          content:
            "Dá pra escrever um servidor inteiro em cima do HTTP puro que você acabou de conhecer, mas ninguém entrega produto assim. Um **framework web** é a biblioteca que resolve o encanamento repetitivo de todo servidor: receber a requisição, descobrir qual rota atende, interpretar params, query e corpo, encadear os middlewares e serializar a resposta. Sem ele, cada projeto reinventa esse arroz com feijão e tropeça em detalhes que a comunidade já resolveu há uma década.\n\nO modelo mental: o framework é o chassi do carro. Ele não decide pra onde você vai (as regras do sistema continuam sendo suas), mas motor, freio e direção chegam prontos e testados por milhares de projetos.\n\nA escolha honesta usa dois critérios: **o que a comunidade da sua linguagem mais usa** (mais material de estudo, mais resposta pronta, mais vaga) e o quanto a ferramenta deixa você enxergar o HTTP por baixo. Framework que esconde demais atrapalha justamente quem está aprendendo o protocolo; framework de menos vira trabalho braçal.\n\nEscolha sua linguagem acima pra ver a recomendação. E guarde uma promessa: os **middlewares**, o recurso mais reaproveitado dessa camada, ganham um passo inteiro logo adiante.",
          byLanguage: {
            node: {
              content:
                "No Node, o **Express** é o padrão de fato há uma década: minimalista, comunidade gigante, e o vocabulário dele (app, rotas, middlewares) virou a língua comum do ecossistema. O **Fastify** é a alternativa moderna, focada em desempenho e com validação embutida, cada vez mais comum em projeto novo. O critério pra agora: comece pelo Express, que tem o material de estudo mais abundante; migrar pro Fastify depois é barato, porque os conceitos são os mesmos.",
              resources: [
                {
                  label: "Express",
                  url: "https://expressjs.com/pt-br/",
                  kind: "doc",
                },
                {
                  label: "Fastify",
                  url: "https://fastify.dev",
                  kind: "doc",
                },
              ],
            },
            python: {
              content:
                "No Python, o **FastAPI** é a escolha moderna pra APIs e o framework desta trilha: rápido, com validação e documentação automáticas nascendo dos type hints que você já escreve. O **Django** (com o Django REST Framework) é o veterano completo: admin pronto, ORM próprio e baterias inclusas, muito forte quando o produto é mais que uma API. O critério pra agora: FastAPI pra aprender API enxuta; Django quando um projeto pedir o pacote completo.",
              resources: [
                {
                  label: "FastAPI",
                  url: "https://fastapi.tiangolo.com",
                  kind: "doc",
                },
                {
                  label: "Django",
                  url: "https://docs.djangoproject.com/pt-br/",
                  kind: "doc",
                },
              ],
            },
            java: {
              content:
                "No Java, o **Spring Boot** domina o mercado corporativo com folga: rotas, injeção de dependências, segurança e acesso a dados resolvidos no mesmo guarda-chuva, e presença constante em vaga formal. Ele tem mais conceitos de partida que os pares das outras linguagens; o **Spring Initializr** gera o esqueleto do projeto e amortece a curva. Alternativas como Quarkus e Micronaut existem no mercado, mas pra aprender (e pra empregar), Spring Boot é o caminho.",
              resources: [
                {
                  label: "Spring Boot",
                  url: "https://spring.io/projects/spring-boot",
                  kind: "doc",
                },
                {
                  label: "Spring Initializr",
                  url: "https://start.spring.io",
                  kind: "doc",
                },
              ],
            },
            go: {
              content:
                "No Go, a conversa começa diferente: a **net/http** da biblioteca padrão já é um servidor completo, e nas versões recentes ela roteia método e partes variáveis do caminho nativamente; muita API de produção roda só com ela. Quando o projeto pede mais conforto, o **Gin** é o framework mais popular (rotas enxutas, middlewares e leitura de JSON prontas), com o Echo logo atrás. O critério pra agora: comece na net/http pra ver o HTTP de perto, adote o Gin quando o código repetitivo incomodar.",
              resources: [
                {
                  label: "Gin",
                  url: "https://gin-gonic.com/en/docs/",
                  kind: "doc",
                },
                {
                  label: "Go: pacote net/http",
                  url: "https://pkg.go.dev/net/http",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "servidor.rotas",
          title: "Rotas e métodos",
          description:
            "Mapear cada combinação de método e caminho pra uma função sua.",
          content:
            "Uma **rota** é a ligação entre uma combinação de método e caminho (GET /produtos, POST /usuarios) e a função que vai atendê-la, chamada de **handler**. O framework recebe a requisição, olha método e caminho, e entrega pro handler certo. Definir rotas é literalmente desenhar o cardápio da sua API.\n\nCaminhos podem ter **partes variáveis**: em /produtos/42, o 42 é o id do produto. Você declara a rota com um marcador (algo como /produtos/:id) e o framework extrai o valor pra você usar no handler.\n\nDois hábitos de organização que valem desde o primeiro projeto: nomear caminhos no plural e em torno de recursos (/produtos, /usuarios), nunca de ações (/buscarProduto), e agrupar as rotas de um mesmo recurso no mesmo arquivo. A Seção de APIs aprofunda essas convenções; aqui o objetivo é a mecânica: criar meia dúzia de rotas e ver cada uma responder no navegador.",
          byLanguage: {
            node: {
              content:
                'No Express, cada rota é um método do app, e a forma diz tudo:\n\n```js\napp.get("/produtos/:id", (req, res) => {\n  res.json({ id: req.params.id });\n});\n```\n\nO handler é a função `(req, res)` que termina respondendo, e a parte variável (`:id`) chega em `req.params`. Pra organizar por arquivo, use o `express.Router()`, que agrupa as rotas de um recurso e é plugado no app com `app.use("/produtos", router)`.',
              resources: [
                {
                  label: "Express: roteamento",
                  url: "https://expressjs.com/pt-br/guide/routing.html",
                  kind: "doc",
                },
              ],
            },
            python: {
              content:
                'No FastAPI, rotas são **decorators** em cima de funções, e ver a forma ensina mais que descrevê-la:\n\n```python\n@app.get("/produtos/{id}")\ndef buscar(id: int):\n    return {"id": id}\n```\n\nO retorno da função vira a resposta JSON automaticamente, e a parte variável do caminho vira parâmetro tipado (o FastAPI converte e valida o `id` sozinho). Pra organizar por arquivo, o `APIRouter` agrupa as rotas de um recurso e é plugado no app com `include_router`.',
              resources: [
                {
                  label: "FastAPI: primeiros passos",
                  url: "https://fastapi.tiangolo.com/tutorial/first-steps/",
                  kind: "doc",
                },
              ],
            },
            java: {
              content:
                'No Spring Boot, rotas vivem numa classe anotada com `@RestController`, e cada método ganha a sua anotação:\n\n```java\n@GetMapping("/produtos/{id}")\nProduto buscar(@PathVariable Long id) {\n  return service.buscar(id);\n}\n```\n\nO retorno do método é convertido pra JSON automaticamente, e a parte variável do caminho chega pelo `@PathVariable`. Um controller por recurso é a organização padrão do ecossistema.',
              resources: [
                {
                  label: "Spring: construindo um serviço REST",
                  url: "https://spring.io/guides/gs/rest-service",
                  kind: "doc",
                },
              ],
            },
            go: {
              content:
                'Com a net/http, você registra rotas no `http.ServeMux`: nas versões recentes do Go dá pra incluir o método no padrão, `mux.HandleFunc("GET /produtos", handler)`, e partes variáveis com chaves, `"GET /produtos/{id}"`. O handler é uma função `(w http.ResponseWriter, r *http.Request)`. No Gin, fica mais enxuto: `r.GET("/produtos", handler)` e `r.GET("/produtos/:id", handler)`.',
              resources: [
                {
                  label: "Go: pacote net/http",
                  url: "https://pkg.go.dev/net/http",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "servidor.middleware",
          title: "Middlewares",
          description:
            "Funções que rodam no meio do caminho, entre a requisição chegar e a rota responder.",
          content:
            "Algumas tarefas precisam acontecer em **todas** (ou quase todas) as requisições: registrar no log o que chegou, verificar se o usuário está logado, interpretar o JSON do corpo. Copiar esse código em cada rota seria um desastre. O **middleware** resolve isso: é uma função que roda no meio do caminho, antes do handler da rota.\n\nPense numa esteira: a requisição entra, passa por uma fila de middlewares (cada um pode inspecionar, modificar ou até barrar a requisição) e só então chega na rota. Se o middleware de autenticação detecta que não há login, ele responde 401 ali mesmo e a rota nem executa.\n\nÉ um dos conceitos mais reaproveitados da trilha: validação, CORS, rate limiting e tratamento de erros se encaixam nesse formato, e o passo de Middleware de autenticação, lá na seção de segurança, é esta mesma ideia protegendo rotas inteiras. A ideia central: **comportamento que se repete entre rotas vira middleware**, escrito uma vez e aplicado onde precisar, no app inteiro ou só num grupo de rotas.",
          byLanguage: {
            node: {
              content:
                'No Express, middleware é uma função `(req, res, next)`, e a assinatura é a própria lição:\n\n```js\nfunction logger(req, res, next) {\n  console.log(req.method, req.path);\n  next();\n}\napp.use(logger);\n```\n\nEle faz o trabalho e chama `next()` pra passar adiante, ou responde e encerra ali. Além do `app.use` global, dá pra aplicar por rota: `app.get("/admin", checarLogin, handler)`. Você já usa um desde o início sem perceber: `app.use(express.json())` é o middleware que interpreta o corpo JSON.',
              resources: [
                {
                  label: "Express: usando middlewares",
                  url: "https://expressjs.com/pt-br/guide/using-middleware.html",
                  kind: "doc",
                },
              ],
            },
            python: {
              content:
                'No FastAPI existem dois mecanismos. O middleware clássico, com `@app.middleware("http")`, roda em toda requisição e serve pra logging e afins. Mas o jeito idiomático de proteger e preparar rotas é o sistema de **dependências**: declare `Depends(verificar_usuario)` no parâmetro da rota e o FastAPI executa essa função antes do handler, injetando o resultado. Pra checagem de login por rota, prefira `Depends`.',
              resources: [
                {
                  label: "FastAPI: middleware",
                  url: "https://fastapi.tiangolo.com/tutorial/middleware/",
                  kind: "doc",
                },
                {
                  label: "FastAPI: dependências",
                  url: "https://fastapi.tiangolo.com/tutorial/dependencies/",
                  kind: "doc",
                },
              ],
            },
            java: {
              content:
                "No ecossistema Spring, o papel de middleware é dos **filters** (padrão do mundo servlet, rodam antes de tudo) e dos **interceptors** do Spring MVC (rodam em volta do controller). Na prática de iniciante, você configura pouco disso na mão: o Spring Boot já traz filtros prontos pra JSON, erros e CORS, e quando chegar em autenticação o Spring Security monta a corrente de filtros pra você. Guarde o conceito: é uma corrente de etapas antes do controller.",
              resources: [
                {
                  label: "Spring Boot (documentação oficial)",
                  url: "https://docs.spring.io/spring-boot/index.html",
                  kind: "doc",
                },
              ],
            },
            go: {
              content:
                "Na net/http, middleware é uma função que **embrulha um handler e devolve outro**: ela recebe o próximo handler, faz seu trabalho (log, checagem) e decide se chama `next.ServeHTTP(w, r)` ou responde e para. É só composição de funções, sem mágica. No Gin vem pronto pro uso: `r.Use(gin.Logger())` aplica no app todo, e dentro de um middleware `c.Next()` segue adiante e `c.Abort()` barra.",
              resources: [
                {
                  label: "Gin: middlewares customizados",
                  url: "https://gin-gonic.com/en/docs/middleware/custom-middleware/",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "servidor.reqres",
          title: "Request e response (params, query, body)",
          description:
            "Os três lugares de onde os dados chegam e como montar a resposta.",
          content:
            "Toda requisição pode trazer dados em três lugares, e cada um tem seu papel:\n\n- **Params** (parâmetros de rota): identificam **qual** recurso, dentro do caminho. Em GET /produtos/42, o 42 é o id.\n- **Query string**: ajustes opcionais depois do `?`, pra filtrar, ordenar e paginar. Em GET /produtos?categoria=livros&pagina=2, são dois filtros.\n- **Body** (corpo): o pacote de dados de verdade, geralmente JSON, usado em POST e PUT pra criar e atualizar. O corpo de um POST /usuarios carrega nome, e-mail e senha.\n\nA regra de bolso: **params dizem qual, query diz como, body traz o quê**.\n\nDo outro lado, a resposta que você monta tem três partes: o status code (200, 201, 404), os headers (metadados, como o tipo do conteúdo) e o corpo em JSON. Dominar esse vai e vem é o arroz com feijão do back-end: praticamente toda rota que você escrever na vida começa lendo esses três lugares e termina montando uma resposta.",
          byLanguage: {
            node: {
              content:
                'No Express: `req.params.id` pega o parâmetro de rota, `req.query.categoria` pega a query string e `req.body` pega o corpo (desde que `app.use(express.json())` esteja ligado, senão vem undefined, erro clássico de iniciante). Pra responder: `res.status(201).json({ id: 1, nome: "Ana" })`. Atenção: tudo que chega em params e query é **string**; converta antes de usar como número.',
              resources: [
                {
                  label: "Express: objeto request (API)",
                  url: "https://expressjs.com/pt-br/api.html",
                  kind: "doc",
                },
              ],
            },
            python: {
              content:
                "O FastAPI mapeia tudo pra **parâmetros da função**, usando os tipos que você declara: o que está no caminho vira parâmetro de rota (`def buscar(id: int)`), parâmetro com valor padrão vira query (`def listar(categoria: str = None)`) e parâmetro tipado com um modelo Pydantic vira o corpo. A conversão e a validação são automáticas: declarou `id: int` e veio texto, o cliente recebe erro 422 sem você escrever nada.",
              resources: [
                {
                  label: "FastAPI: parâmetros de rota",
                  url: "https://fastapi.tiangolo.com/tutorial/path-params/",
                  kind: "doc",
                },
                {
                  label: "FastAPI: corpo da requisição",
                  url: "https://fastapi.tiangolo.com/tutorial/body/",
                  kind: "doc",
                },
              ],
            },
            java: {
              content:
                "No Spring Boot, cada origem tem sua anotação no parâmetro do método: `@PathVariable Long id` pro parâmetro de rota, `@RequestParam String categoria` pra query e `@RequestBody ProdutoRequest dados` pro corpo, que é convertido pra um objeto seu automaticamente. Pra controlar o status da resposta, retorne um `ResponseEntity`: `ResponseEntity.status(201).body(produto)`.",
              resources: [
                {
                  label: "Spring Framework: anotações de controller",
                  url: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller.html",
                  kind: "doc",
                },
              ],
            },
            go: {
              content:
                'Na net/http: `r.PathValue("id")` lê o parâmetro de rota (nos padrões com chaves das versões recentes), `r.URL.Query().Get("categoria")` lê a query e o corpo JSON é decodificado pra uma struct com `json.NewDecoder(r.Body).Decode(&dados)`. Pra responder, escreva o status com `w.WriteHeader(http.StatusCreated)` e o JSON com `json.NewEncoder(w).Encode(produto)`. No Gin: `c.Param("id")`, `c.Query("categoria")`, `c.BindJSON(&dados)` e `c.JSON(201, produto)`.',
              resources: [
                {
                  label: "Go: pacote encoding/json",
                  url: "https://pkg.go.dev/encoding/json",
                  kind: "doc",
                },
              ],
            },
          },
        },
      ],
    },
    {
      id: "apis",
      title: "APIs REST",
      description:
        "Transformar seu servidor numa API de verdade: recursos bem desenhados, respostas previsíveis e dados validados.",
      level: "intermediario",
      children: [
        {
          id: "apis.rest",
          title: "REST e recursos",
          description:
            "O estilo de organizar APIs em torno de recursos e dos métodos HTTP.",
          content:
            "REST é um **estilo de organizar APIs** que virou o padrão da web. A ideia central: modelar tudo como **recursos** (as coisas do seu sistema: usuários, produtos, pedidos), dar a cada recurso um endereço próprio e usar os métodos HTTP pra dizer a ação.\n\nO recurso vai no caminho, sempre como substantivo no plural: `/produtos` é a coleção, `/produtos/42` é um item dela. A ação vem do método: GET /produtos lista, POST /produtos cria, PUT /produtos/42 atualiza o 42, DELETE /produtos/42 apaga. Repare que o caminho nunca tem verbo; quem age é o método. `/criarProduto` ou `/produtos/deletar` são o anti-padrão clássico.\n\nRecursos também se aninham quando um pertence ao outro: `/usuarios/7/pedidos` são os pedidos do usuário 7.\n\nPor que isso importa? Previsibilidade. Um dev que nunca viu sua API olha `GET /produtos/42` e sabe exatamente o que esperar, porque o mundo inteiro segue a mesma convenção. API REST bem desenhada dispensa metade da documentação, e desenhar recursos é a primeira coisa que você faz em qualquer projeto novo de back-end.",
          resources: [
            {
              label: "MDN: REST (glossário)",
              url: "https://developer.mozilla.org/pt-BR/docs/Glossary/REST",
              kind: "doc",
            },
          ],
        },
        {
          id: "apis.status",
          title: "Status codes",
          description: "Escolher o código certo pra cada resposta da sua API.",
          content:
            'Você já conhece as faixas (2xx sucesso, 4xx erro do cliente, 5xx erro do servidor). Agora a parte prática: escolher o código certo em cada rota que escreve. Esse é o vocabulário do dia a dia de uma API:\n\n- **200 OK**: deu certo, segue o resultado (buscas e atualizações).\n- **201 Created**: recurso criado, a resposta do POST bem-sucedido.\n- **204 No Content**: deu certo e não há nada pra devolver (comum no DELETE).\n- **400 Bad Request**: o pedido veio malformado ou com dados inválidos.\n- **401 Unauthorized**: não sabemos quem você é (faltou login ou token).\n- **403 Forbidden**: sabemos quem você é, mas você não pode fazer isso.\n- **404 Not Found**: o recurso não existe.\n- **409 Conflict**: o pedido conflita com o estado atual (e-mail já cadastrado).\n- **500 Internal Server Error**: o seu código quebrou.\n\nA dupla que mais confunde iniciante é 401 e 403: **401 é "quem é você?", 403 é "você não pode"**. E o erro mais comum é devolver 200 com uma mensagem de erro dentro do JSON: o cliente (e qualquer ferramenta de monitoramento) confia no status, então ele precisa contar a verdade.\n\nA promessa feita lá em HTTP, métodos e status se cumpre aqui. Você domina este passo quando escolhe o código de cada rota sem olhar a lista, e sente incômodo ao ver um 200 carregando erro.',
          resources: [
            {
              label: "MDN: códigos de status HTTP",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status",
              kind: "doc",
            },
          ],
        },
        {
          id: "apis.crud",
          title: "CRUD",
          description:
            "As quatro operações que formam o esqueleto de quase toda API.",
          content:
            "CRUD é a sigla de **Create, Read, Update, Delete**: criar, ler, atualizar e apagar. É o ciclo de vida de qualquer dado, e a espinha dorsal da maioria das APIs. Um recurso completo em REST vira exatamente cinco rotas:\n\n- `POST /produtos` cria um produto (Create), responde 201.\n- `GET /produtos` lista todos (Read), responde 200.\n- `GET /produtos/42` busca um pelo id (Read), responde 200 ou 404.\n- `PUT /produtos/42` atualiza o 42 (Update), responde 200.\n- `DELETE /produtos/42` apaga o 42 (Delete), responde 204.\n\nSobre atualização, há dois métodos: **PUT** substitui o recurso inteiro (você manda todos os campos) e **PATCH** altera só os campos enviados. Pra começar, PUT resolve; saiba que PATCH existe.\n\nEsse conjunto é o exercício definitivo desta fase da trilha: implemente o CRUD completo de um recurso guardando os dados numa lista em memória mesmo, sem banco ainda. Se cada rota responder com o status certo e o JSON esperado, você entendeu o coração do back-end. Na seção seguinte, essa lista em memória vira um banco de dados de verdade, e o resto do código quase não muda.",
          resources: [
            {
              label: "MDN: métodos de requisição HTTP",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Methods",
              kind: "doc",
            },
          ],
        },
        {
          id: "apis.validacao",
          title: "Validação de entrada",
          description:
            "Nunca confiar no que chega: conferir formato e regras antes de processar.",
          content:
            'Regra de ouro do back-end: **nunca confie em dado que vem de fora**. O cliente pode mandar campo faltando, e-mail sem arroba, idade negativa, texto onde era número, ou payload montado de má fé. Validação de entrada é a barreira que confere tudo isso **antes** do dado tocar sua lógica e seu banco.\n\nValidar na mão (uma pilha de ifs em cada rota) até funciona, mas não escala e esquece casos. Toda linguagem tem uma forma consolidada de **declarar o formato esperado** (um esquema: quais campos, de que tipo, com que regras) e deixar a biblioteca conferir e gerar os erros.\n\nQuando a validação falha, a resposta é **400 Bad Request** com um corpo dizendo qual campo falhou e por quê, pra quem consome a API conseguir corrigir. Mensagem genérica tipo "dados inválidos" é meio caminho; "email: formato inválido" resolve.\n\nE mesmo que o front-end já valide o formulário, o back-end valida de novo, sempre: a validação do front melhora a experiência, a do back **garante** a integridade, porque é a única que ninguém consegue pular.',
          byLanguage: {
            node: {
              content:
                "No Node, a biblioteca mais adotada é o **Zod**. Você declara o formato uma vez e valida tudo que chega:\n\n```js\nconst schema = z.object({\n  nome: z.string().min(2),\n  email: z.string().email(),\n});\nconst dados = schema.safeParse(req.body);\n```\n\nSe `dados.success` for falso, devolve 400 com a lista de erros que o Zod já monta. Combina muito bem com TypeScript, que entra mais adiante na trilha: o schema gera o tipo de graça.",
              resources: [
                {
                  label: "Zod (documentação oficial)",
                  url: "https://zod.dev",
                  kind: "doc",
                },
              ],
            },
            python: {
              content:
                "No FastAPI a validação já vem embutida via **Pydantic**: declare um modelo (`class CriarUsuario(BaseModel): nome: str; email: EmailStr`) e use como tipo do parâmetro da rota. Payload fora do formato nem chega no seu código: o FastAPI responde 422 com o detalhe de cada campo automaticamente. Regras extras (tamanho mínimo, faixa numérica) entram com `Field`.",
              resources: [
                {
                  label: "Pydantic (documentação oficial)",
                  url: "https://docs.pydantic.dev",
                  kind: "doc",
                },
              ],
            },
            java: {
              content:
                "No Spring Boot, a validação usa o **Bean Validation**: anotações direto nos campos da classe de requisição (`@NotBlank`, `@Email`, `@Min(0)`) e `@Valid` no parâmetro do controller pra ativar a checagem. Adicione a dependência `spring-boot-starter-validation`. Quando falha, o Spring lança uma exceção que você captura num handler global pra devolver 400 com os campos errados.",
              resources: [
                {
                  label: "Spring: validando entrada de formulário",
                  url: "https://spring.io/guides/gs/validating-form-input",
                  kind: "doc",
                },
              ],
            },
            go: {
              content:
                'No Go com Gin, a validação vem por **tags na struct**, aquelas anotações escritas entre crases ao lado de cada campo: `binding:"required,min=2"` exige o campo com tamanho mínimo, `binding:"required,email"` valida formato de e-mail. O `c.ShouldBindJSON(&dados)` valida na hora de ler o corpo e devolve o erro pra você responder 400. Por baixo, o Gin usa a biblioteca go-playground/validator, que também funciona sozinha com a net/http.',
              resources: [
                {
                  label: "go-playground/validator",
                  url: "https://pkg.go.dev/github.com/go-playground/validator/v10",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "apis.erros",
          title: "Tratamento de erros",
          description:
            "Fazer a API falhar de forma controlada, clara e sem vazar segredo.",
          content:
            'Erro vai acontecer: banco fora do ar, id que não existe, bug seu. A diferença entre uma API amadora e uma profissional não é a ausência de erro, é **como ela se comporta quando ele acontece**. Mal tratado, o erro derruba o servidor ou vaza detalhes internos; bem tratado, vira uma resposta limpa e o serviço segue de pé.\n\nO primeiro passo é separar os dois tipos. **Erros esperados** fazem parte do fluxo: produto não encontrado (404), dado inválido (400), e-mail duplicado (409). Você os detecta e responde com o status certo e uma mensagem útil. **Erros inesperados** são bugs e falhas de infraestrutura: viram 500, com mensagem genérica pro cliente e o detalhe completo registrado no log pra você investigar.\n\nA regra de segurança: **stack trace e mensagem interna nunca vão na resposta**. Eles revelam estrutura do código e do banco pra qualquer um, inclusive atacantes. O cliente recebe "erro interno"; o log recebe a história toda.\n\nNa prática, os frameworks permitem centralizar isso num **tratador global de erros** (um middleware ou handler de exceções): as rotas lançam ou repassam o erro, e um único lugar decide status, formato e o que vai pro log. Montar esse tratador é parte do projeto desta trilha.',
        },
        {
          id: "apis.boaspraticas",
          title: "Boas práticas de REST",
          description:
            "Os refinamentos que separam uma API funcional de uma API agradável de consumir.",
          optional: true,
          content:
            "Com recursos, status e CRUD no lugar, alguns refinamentos deixam sua API no nível das que você admira:\n\n- **Consistência acima de tudo**: mesmo formato de resposta, mesma convenção de nomes nos campos JSON (escolha um padrão e siga em todas as rotas). Quem consome a API aprende uma vez e usa tudo.\n- **Paginação nas listas**: nunca devolva uma coleção inteira que cresce sem limite. Aceite `?page=2&limit=20` e devolva junto o total, pro cliente montar a navegação.\n- **Filtros e ordenação via query**: `?categoria=livros&sort=preco` em vez de criar uma rota nova pra cada combinação.\n- **Versionamento**: prefixar os caminhos com `/v1/` te dá liberdade de mudar a API no futuro sem quebrar quem já usa a versão atual.\n- **Plural sempre, e caminhos rasos**: `/produtos/42/avaliacoes` está ótimo; cinco níveis de aninhamento é sinal de que o desenho precisa ser repensado.\n\nNada disso é lei, são convenções que o mercado consolidou. O teste prático: se outra pessoa consegue usar sua API só olhando os nomes das rotas e uma resposta de exemplo, você acertou.",
        },
      ],
    },
    {
      id: "bancodedados",
      title: "Banco de dados",
      description:
        "Onde os dados moram de verdade: modelar, consultar com SQL e conectar o banco à sua API.",
      level: "intermediario",
      children: [
        {
          id: "bancodedados.conceitos",
          title: "Conceitos",
          children: [
            {
              id: "bancodedados.conceitos.sqlnosql",
              title: "SQL x NoSQL",
              description:
                "As duas grandes famílias de banco de dados e quando usar cada uma.",
              content:
                "Banco de dados é o programa especializado em guardar dados de forma permanente, segura e consultável. Sua API reinicia, o servidor cai, e os dados continuam lá. Existem duas grandes famílias.\n\nOs bancos **relacionais (SQL)** organizam tudo em **tabelas** com colunas fixas, como planilhas que se referenciam: a tabela de pedidos aponta pra tabela de usuários. Você conversa com eles em **SQL**, uma linguagem padrão que existe há décadas. PostgreSQL e MySQL são os nomes mais fortes.\n\nOs bancos **NoSQL** abrem mão dessa estrutura rígida em troca de flexibilidade. O tipo mais comum é o de **documentos** (MongoDB), que guarda registros parecidos com JSON, cada um podendo ter campos diferentes. Há também os de chave-valor (Redis), entre outros.\n\nPra quem está começando, a escolha é tranquila: **comece pelo relacional**. A maioria esmagadora dos sistemas usa um, SQL é habilidade cobrada em quase toda vaga de back-end, e quem aprende o modelo relacional entende NoSQL depois sem esforço. O contrário é menos verdade. Nesta trilha, o banco principal é o PostgreSQL.",
              resources: [
                {
                  label: "PostgreSQL: sobre o projeto",
                  url: "https://www.postgresql.org/about/",
                  kind: "doc",
                },
              ],
            },
            {
              id: "bancodedados.conceitos.modelagem",
              title: "Modelagem básica",
              description:
                "Decidir quais tabelas existem, quais campos têm e como se ligam.",
              content:
                "Antes de escrever qualquer SQL, vem a pergunta de design: **quais tabelas o sistema precisa, com quais campos, ligadas como?** Isso é modelagem de dados, e errar aqui custa caro, porque tudo que vem depois se apoia nessa estrutura.\n\nO caminho prático: liste as **entidades** do sistema (os substantivos: usuário, produto, pedido), e cada uma vira uma tabela. Liste os **atributos** de cada entidade (nome, e-mail, preço), e cada um vira uma coluna com um tipo (texto, número, data, booleano). Toda tabela ganha um **id** pra identificar cada linha sem ambiguidade.\n\nDepois, as **relações**: um usuário faz vários pedidos (relação um-pra-muitos, a mais comum), um pedido contém vários produtos e um produto aparece em vários pedidos (muitos-pra-muitos). Identificar essas relações agora é o que vai virar chave estrangeira no passo de relacionamentos e chaves.\n\nUma regra de ouro pra evitar a armadilha clássica: **não repita dado, referencie**. Se o nome do cliente está na tabela de usuários, a tabela de pedidos guarda só o id do usuário, não o nome de novo. Dado duplicado desatualiza, e aí o sistema mente. Desenhe o modelo no papel antes de criar qualquer tabela; dez minutos de rabisco economizam semanas.",
              resources: [
                {
                  label: "PostgreSQL: definição de dados (DDL)",
                  url: "https://www.postgresql.org/docs/current/ddl.html",
                  kind: "doc",
                },
              ],
            },
          ],
        },
        {
          id: "bancodedados.relacional",
          title: "Banco relacional (PostgreSQL)",
          children: [
            {
              id: "bancodedados.relacional.postgres",
              title: "PostgreSQL",
              description:
                "O banco relacional open source que esta trilha usa do começo ao fim.",
              content:
                "O **PostgreSQL** (apelido: Postgres) é um banco relacional open source, gratuito, e um dos mais respeitados do mercado: roda de projeto pessoal a sistema bancário. É o banco desta trilha porque o que você aprende nele vale pra qualquer relacional, e porque os serviços de nuvem que você vai usar no deploy o oferecem prontamente.\n\nO modelo mental: o Postgres é um **servidor**, separado da sua API. Ele roda escutando uma porta (a padrão é 5432), e sua aplicação se conecta a ele com endereço, usuário e senha pra mandar comandos SQL. Dentro do servidor vivem os **databases**, e dentro de cada database, as tabelas.\n\nPra instalar, use o instalador oficial do site (ou Docker, se já estiver confortável com ele). Junto vem o **psql**, o terminal interativo do Postgres, onde você digita SQL direto. Também vale instalar uma interface gráfica pra visualizar tabelas; o **pgAdmin** é o oficial.\n\nMeta desta etapa: Postgres rodando na sua máquina, um database criado, e você conectado nele via psql ou pgAdmin. A partir daí, é aprender a conversar em SQL.",
              resources: [
                {
                  label: "PostgreSQL: documentação oficial",
                  url: "https://www.postgresql.org/docs/",
                  kind: "doc",
                },
                {
                  label: "PostgreSQL: tutorial oficial",
                  url: "https://www.postgresql.org/docs/current/tutorial.html",
                  kind: "doc",
                },
              ],
            },
            {
              id: "bancodedados.relacional.queries",
              title: "SELECT, INSERT, UPDATE, DELETE",
              description:
                "Os quatro comandos SQL que espelham o CRUD da sua API.",
              content:
                "SQL é a língua dos bancos relacionais, e quatro comandos cobrem o dia a dia. Repare que eles espelham exatamente o CRUD que você já fez na API:\n\n- `INSERT INTO produtos (nome, preco) VALUES ('Café', 25)` cria uma linha.\n- `SELECT * FROM produtos` lê todas; `SELECT nome, preco FROM produtos WHERE preco < 50 ORDER BY nome` lê filtrando e ordenando.\n- `UPDATE produtos SET preco = 30 WHERE id = 42` atualiza.\n- `DELETE FROM produtos WHERE id = 42` apaga.\n\nO **WHERE** é a cláusula mais importante de todas: é ela que diz **quais linhas** o comando atinge. E aqui mora o erro mais famoso do SQL: um UPDATE ou DELETE **sem WHERE atinge a tabela inteira**. Releia o WHERE antes de rodar, sempre.\n\nNo SELECT, você ainda vai usar `LIMIT` pra paginar (e perceber de onde vem a paginação da sua API) e `COUNT(*)` pra contar.\n\nO jeito de aprender é volume: crie uma tabela de produtos no psql e faça vinte consultas diferentes, errando à vontade, num banco de estudo que não importa. SQL é tão central que aparece em entrevista técnica de back-end com frequência; fluência aqui se paga rápido.",
              resources: [
                {
                  label: "PostgreSQL: introdução ao SQL (tutorial oficial)",
                  url: "https://www.postgresql.org/docs/current/tutorial-sql.html",
                  kind: "doc",
                },
              ],
            },
            {
              id: "bancodedados.relacional.relacionamentos",
              title: "Relacionamentos e chaves",
              description:
                "Como as tabelas se ligam: chave primária, chave estrangeira e JOIN.",
              content:
                "É aqui que o banco relacional ganha o nome. Duas peças fazem a ligação entre tabelas:\n\n- A **chave primária** (primary key) é o identificador único de cada linha, normalmente a coluna `id`. O banco garante que não se repete.\n- A **chave estrangeira** (foreign key) é uma coluna que guarda o id de uma linha de **outra** tabela. A tabela `pedidos` tem uma coluna `usuario_id` apontando pro dono do pedido.\n\nCom isso, a relação um-pra-muitos que você desenhou na modelagem vira estrutura concreta: um usuário, muitos pedidos apontando pra ele. E o banco **defende** essa ligação: declarada a chave estrangeira, ele recusa um pedido com `usuario_id` que não existe e te obriga a decidir o que acontece com os pedidos quando o usuário é apagado.\n\nPra ler dados de tabelas ligadas de uma vez, existe o **JOIN**: `SELECT pedidos.id, usuarios.nome FROM pedidos JOIN usuarios ON pedidos.usuario_id = usuarios.id` devolve cada pedido já com o nome do dono. JOIN intimida no começo, mas é uma ideia só: **costurar linhas de duas tabelas pela chave que as liga**. Pratique com duas tabelas pequenas até o clique acontecer; é o conceito mais cobrado de SQL em entrevistas.",
              resources: [
                {
                  label:
                    "PostgreSQL: consultas entre tabelas (tutorial oficial)",
                  url: "https://www.postgresql.org/docs/current/tutorial-join.html",
                  kind: "doc",
                },
              ],
            },
          ],
        },
        {
          id: "bancodedados.orm",
          title: "Acessar o banco pelo código (ORM)",
          description:
            "A camada que liga as tabelas do banco aos objetos da sua linguagem.",
          content:
            "Sua API não vai abrir o psql: ela precisa consultar o banco **de dentro do código**. Dá pra mandar SQL puro por uma biblioteca de conexão, e é bom saber que esse caminho existe. Mas o mais comum em aplicações é usar um **ORM** (mapeamento objeto-relacional): uma biblioteca que liga as tabelas do banco às estruturas da sua linguagem.\n\nCom um ORM, você descreve o modelo (um produto tem nome e preço) uma vez, e consulta com código idiomático em vez de montar strings de SQL: algo como `produtos.buscarPorId(42)` em vez de `SELECT * FROM produtos WHERE id = 42`. O ORM gera o SQL, executa e devolve objetos prontos. De quebra, ele cuida de um ponto sério de segurança: parametriza as consultas, fechando a porta da injeção de SQL que você verá na seção de segurança.\n\nO equilíbrio importante: **ORM não substitui saber SQL**. Quando uma consulta complexa ficar lenta ou se comportar estranho, é lendo o SQL gerado que você entende o porquê. Aprenda SQL primeiro (você já fez isso), use ORM pra produtividade depois. E a promessa do passo de CRUD se cumpre aqui: aquela lista em memória finalmente vira tabela de verdade, com o resto do código quase intacto. Escolha sua linguagem acima pra ver a ferramenta dela.",
          byLanguage: {
            node: {
              content:
                "No Node, o **Prisma** é a escolha mais amigável pra começar: você descreve as tabelas num arquivo de schema próprio, ele gera um cliente tipado, e as consultas ficam como `prisma.produto.findUnique({ where: { id: 42 } })`. Integra direto com TypeScript e já traz sistema de migrations. O Drizzle é a alternativa mais enxuta que vem crescendo.",
              resources: [
                {
                  label: "Prisma (documentação oficial)",
                  url: "https://www.prisma.io/docs",
                  kind: "doc",
                },
              ],
            },
            python: {
              content:
                "No Python, o padrão de mercado é o **SQLAlchemy**: você declara modelos como classes e consulta com `session.get(Produto, 42)`. Pra usar com FastAPI, vale conhecer o **SQLModel**, criado pelo mesmo autor do framework: ele junta SQLAlchemy e Pydantic, então o mesmo modelo serve pro banco e pra validação. Comece pelo SQLModel se estiver no FastAPI.",
              resources: [
                {
                  label: "SQLAlchemy (documentação oficial)",
                  url: "https://docs.sqlalchemy.org",
                  kind: "doc",
                },
                {
                  label: "SQLModel (documentação oficial)",
                  url: "https://sqlmodel.tiangolo.com",
                  kind: "doc",
                },
              ],
            },
            java: {
              content:
                "No Spring Boot, o caminho é o **Spring Data JPA** (com o Hibernate por baixo): a entidade é uma classe anotada com `@Entity`, e um repositório que estende `JpaRepository` já te dá `findById`, `save` e `delete` sem escrever implementação. Consultas extras nascem do nome do método: `findByNome(String nome)` vira o SQL certo sozinho. É o stack de persistência mais comum do mundo corporativo Java.",
              resources: [
                {
                  label: "Spring Data JPA",
                  url: "https://spring.io/projects/spring-data-jpa",
                  kind: "doc",
                },
                {
                  label: "Spring: acessando dados com JPA",
                  url: "https://spring.io/guides/gs/accessing-data-jpa",
                  kind: "doc",
                },
              ],
            },
            go: {
              content:
                "No Go, boa parte da comunidade prefere ficar perto do SQL: o pacote `database/sql` da biblioteca padrão, com um driver de Postgres, já resolve com consultas explícitas e parametrizadas. Quem quer ORM completo usa o **GORM**, o mais popular, com structs anotadas e chamadas como `db.First(&produto, 42)`. Sugestão: comece pelo `database/sql` pra entender o fluxo, adote GORM se o projeto crescer.",
              resources: [
                {
                  label: "Go: acessando banco relacional (tutorial oficial)",
                  url: "https://go.dev/doc/tutorial/database-access",
                  kind: "doc",
                },
                {
                  label: "GORM (documentação oficial)",
                  url: "https://gorm.io/docs/",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "bancodedados.migrations",
          title: "Migrations",
          description:
            "Versionar as mudanças de estrutura do banco como se fossem commits.",
          content:
            'Seu modelo de dados vai mudar: surge a tabela nova, a coluna que faltava, o campo que muda de tipo. Fazer essas mudanças na mão, direto no banco, funciona até o dia em que ninguém mais sabe qual estrutura o banco de produção tem, e o da sua máquina é diferente do banco do colega.\n\n**Migrations** resolvem isso: cada mudança de estrutura vira um **arquivo versionado** no projeto ("cria tabela produtos", "adiciona coluna preco"), e uma ferramenta aplica os arquivos em ordem, registrando o que já rodou. É o Git do esquema do banco. Qualquer pessoa (ou servidor) que rode as migrations chega na mesma estrutura, sem passo manual.\n\nAs regras de convivência são simples: toda mudança de estrutura entra por migration, nunca direto no banco; migration que já rodou em produção não se edita, se cria outra corrigindo; e os arquivos vão pro repositório junto com o código que depende deles.\n\nNa prática, você quase nunca instala uma ferramenta separada pra isso: os ORMs do passo anterior (Prisma, SQLAlchemy com Alembic, Spring com Flyway, GORM) já trazem ou se integram a um sistema de migrations. O hábito a criar é um só: **mudou o modelo, gerou migration, commitou junto**.',
        },
        {
          id: "bancodedados.nosql",
          title: "NoSQL (MongoDB)",
          description:
            "O banco de documentos mais popular, pra conhecer o outro lado do mundo dos dados.",
          optional: true,
          content:
            "O **MongoDB** é o banco de documentos mais conhecido. Em vez de tabelas com colunas fixas, ele guarda **documentos** (estruturas no estilo JSON) dentro de **coleções**. Cada documento pode ter campos diferentes do vizinho, e dados que no relacional virariam outra tabela podem viver aninhados dentro do próprio documento: o pedido carrega a lista de itens dentro dele.\n\nIsso brilha quando a estrutura dos dados varia muito ou evolui rápido: catálogos com atributos diferentes por tipo de produto, eventos de formatos variados, protótipos em que o modelo ainda está se descobrindo. E cobra o preço no que o relacional dá de graça: as garantias de integridade entre dados ligados e os JOINs ficam, em grande parte, por conta da sua aplicação.\n\nO mapa mental pra quem vem do SQL: tabela vira coleção, linha vira documento, coluna vira campo. As consultas são feitas por métodos como `find` e `insertOne`, com filtros em formato de documento.\n\nEste passo é opcional de propósito: o mercado espera SQL primeiro. Vale conhecer o MongoDB pra entender as conversas e saber quando ele é a ferramenta certa, sem precisar dominar agora.",
          resources: [
            {
              label: "MongoDB: documentação oficial",
              url: "https://www.mongodb.com/docs/",
              kind: "doc",
            },
          ],
        },
        {
          id: "bancodedados.cache",
          title: "Cache (Redis)",
          description:
            "Guardar respostas prontas na memória pra não refazer trabalho caro.",
          optional: true,
          content:
            "Algumas consultas são caras e repetitivas: a home busca os produtos em destaque a cada visita, e a resposta é a mesma pra todo mundo. **Cache** é a técnica de guardar um resultado pronto num lugar de acesso rápido e servi-lo direto de lá, em vez de recalcular a cada pedido.\n\nO **Redis** é a ferramenta padrão pra isso: um banco de chave-valor que vive **na memória RAM**, o que o torna extremamente rápido. Sua API o usa assim: chegou o pedido, olha no Redis primeiro; se a resposta está lá (cache hit), devolve na hora; se não está (cache miss), consulta o banco de verdade, responde e **guarda no Redis com prazo de validade** (o TTL, tempo de expiração) pros próximos pedidos.\n\nA parte difícil do cache não é guardar, é **invalidar**: quando o dado muda no banco, o que está no Redis fica velho. O TTL é a proteção básica (o dado expira sozinho), e apagar a chave no momento da atualização é o passo seguinte.\n\nA regra prática: cache é otimização, não fundação. Primeiro faça a API funcionar correta sem ele; adicione cache quando houver consulta repetitiva pesando. O Redis ainda vai reaparecer na sua carreira em filas e sessões, então conhecê-lo aqui é investimento.",
          resources: [
            {
              label: "Redis: documentação oficial",
              url: "https://redis.io/docs/latest/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "autenticacao",
      title: "Autenticação e segurança",
      description:
        "Saber quem é o usuário, proteger o que é dele e fechar as portas mais comuns de ataque.",
      level: "avancado",
      children: [
        {
          id: "autenticacao.senhas",
          title: "Hashing de senha",
          description:
            "Por que senha nunca se guarda em texto puro, e como guardar do jeito certo.",
          content:
            "Regra absoluta: **nenhum sistema guarda a senha do usuário**. Se o seu banco vazar (e bancos vazam) com senhas legíveis, você expôs não só o seu sistema, mas todas as outras contas em que o usuário repete aquela senha.\n\nO que se guarda é o **hash** da senha: o resultado de uma função matemática de mão única. Transformar a senha em hash é fácil; recuperar a senha a partir do hash é inviável. No cadastro, você calcula e guarda o hash. No login, calcula o hash do que a pessoa digitou e compara com o guardado. A senha original nunca toca o banco.\n\nDois detalhes separam o certo do quebrado. Primeiro, **não é qualquer hash**: funções rápidas como MD5 ou SHA-256 puro são quebráveis por força bruta com hardware moderno; usam-se algoritmos feitos pra senha, que são propositalmente lentos, como **bcrypt** e **argon2**. Segundo, o **salt**: um valor aleatório misturado a cada senha antes do hash, pra que duas pessoas com a mesma senha tenham hashes diferentes. As bibliotecas de bcrypt cuidam do salt sozinhas.\n\nNa prática: use a biblioteca consolidada da sua linguagem e nunca invente criptografia própria. É a regra número um da segurança. E o teste de domínio é direto: seu cadastro guarda só o hash, seu login compara pela biblioteca, e a senha em texto puro não toca banco nem log em momento algum.",
          byLanguage: {
            node: {
              content:
                "No Node, use o pacote **bcrypt**: `await bcrypt.hash(senha, 10)` no cadastro (o 10 é o custo, quanto maior, mais lento e mais seguro) e `await bcrypt.compare(senhaDigitada, hashGuardado)` no login. Use sempre as versões assíncronas pra não travar o event loop.",
              resources: [
                {
                  label: "bcrypt (pacote npm)",
                  url: "https://www.npmjs.com/package/bcrypt",
                  kind: "doc",
                },
              ],
            },
            python: {
              content:
                "No Python, o pacote **bcrypt** resolve direto: `bcrypt.hashpw(senha.encode(), bcrypt.gensalt())` no cadastro e `bcrypt.checkpw(senha_digitada.encode(), hash_guardado)` no login. O tutorial de segurança do FastAPI mostra o fluxo completo de cadastro e login com hashing integrado às rotas.",
              resources: [
                {
                  label: "bcrypt (PyPI)",
                  url: "https://pypi.org/project/bcrypt/",
                  kind: "doc",
                },
                {
                  label: "FastAPI: tutorial de segurança",
                  url: "https://fastapi.tiangolo.com/tutorial/security/",
                  kind: "doc",
                },
              ],
            },
            java: {
              content:
                "No Spring, o hashing vem com o Spring Security: o `BCryptPasswordEncoder` expõe `encode(senha)` pro cadastro e `matches(senhaDigitada, hashGuardado)` pro login. Declare um `PasswordEncoder` como bean e injete onde precisar; é o mesmo encoder que o framework usa no fluxo de autenticação dele.",
              resources: [
                {
                  label: "Spring Security (documentação oficial)",
                  url: "https://docs.spring.io/spring-security/reference/",
                  kind: "doc",
                },
              ],
            },
            go: {
              content:
                "No Go, o pacote oficial é o `golang.org/x/crypto/bcrypt`: `bcrypt.GenerateFromPassword([]byte(senha), bcrypt.DefaultCost)` no cadastro e `bcrypt.CompareHashAndPassword(hashGuardado, []byte(senhaDigitada))` no login, que devolve erro quando não bate. Simples e direto, sem dependência externa além do módulo x/crypto.",
              resources: [
                {
                  label: "Go: pacote bcrypt",
                  url: "https://pkg.go.dev/golang.org/x/crypto/bcrypt",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "autenticacao.login",
          title: "Manter o usuário logado",
          children: [
            {
              id: "autenticacao.login.sessoes",
              title: "Sessões e cookies",
              description:
                "O jeito clássico de lembrar quem é o usuário entre uma requisição e outra.",
              content:
                'HTTP tem um detalhe que muda tudo: ele é **sem estado**. Cada requisição chega sozinha, sem memória da anterior. O servidor não sabe que o GET de agora veio da mesma pessoa que fez login há um minuto. Manter o usuário logado é, na essência, resolver esse problema.\n\nA solução clássica é a **sessão**: no login bem-sucedido, o servidor gera um identificador aleatório (o id de sessão), guarda do lado dele a associação "esse id pertence ao usuário 7" e envia o id pro navegador dentro de um **cookie**. Cookie é um pedacinho de dado que o navegador guarda e **reenvia automaticamente** em toda requisição pro mesmo site. A cada pedido, o servidor lê o id do cookie, consulta quem é, e pronto: o usuário está "lembrado". Logout é apagar a sessão do lado do servidor.\n\nCookies de sessão pedem três configurações que você verá nos exemplos: `HttpOnly` (o JavaScript da página não consegue ler o cookie, proteção contra roubo via script), `Secure` (só viaja em HTTPS) e `SameSite` (limita o envio a partir de outros sites).\n\nA característica central do modelo: **o estado mora no servidor**, que tem controle total (dá pra derrubar uma sessão na hora). O passo seguinte, o JWT, mostra o modelo oposto.',
              resources: [
                {
                  label: "MDN: cookies HTTP",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Cookies",
                  kind: "doc",
                },
              ],
            },
            {
              id: "autenticacao.login.jwt",
              title: "JWT (tokens)",
              description:
                "O crachá assinado que o cliente apresenta a cada requisição.",
              content:
                "O **JWT** (JSON Web Token) inverte a lógica da sessão: em vez de o servidor guardar quem está logado, ele entrega ao cliente um **token assinado** com as informações dentro, e o cliente o apresenta a cada requisição, como um crachá.\n\nO token tem três partes: um cabeçalho, o **payload** (os dados: id do usuário, validade) e a **assinatura**, gerada com uma chave secreta que só o servidor conhece. A cada requisição, o cliente manda o token no header `Authorization: Bearer <token>`, e o servidor **verifica a assinatura**: se bate, os dados são confiáveis sem consultar nada, porque ninguém consegue alterar o payload sem invalidar a assinatura.\n\nDois cuidados que todo iniciante precisa gravar. Primeiro: o payload é apenas **codificado, não criptografado**; qualquer um que tenha o token lê o conteúdo. Nunca coloque senha ou dado sensível dentro. Segundo: como o servidor não guarda nada, **não dá pra revogar um token antes de expirar**. Por isso, tokens de acesso têm vida curta.\n\nQuando usar o quê? Sessões brilham em aplicações web tradicionais; JWT brilha em APIs consumidas por apps e SPAs, e é o que você vai implementar no projeto desta trilha. Os dois modelos convivem no mercado, e entrevistas adoram perguntar a diferença.",
              resources: [
                {
                  label: "Introdução ao JWT (jwt.io)",
                  url: "https://jwt.io/introduction",
                  kind: "artigo",
                },
              ],
            },
            {
              id: "autenticacao.login.middleware",
              title: "Middleware de autenticação",
              description:
                "A barreira única que protege as rotas que exigem login.",
              content:
                "Com login e token funcionando, falta o último elo: **barrar quem não está autenticado** nas rotas protegidas. Checar o token dentro de cada rota seria repetição na certa; isso é trabalho pro middleware, exatamente como visto na seção de servidor.\n\nO fluxo do middleware de autenticação é sempre o mesmo, em qualquer linguagem: extrair o token do header `Authorization` (ou o id de sessão do cookie), **verificar** a assinatura e a validade, e então decidir. Token válido: anexa os dados do usuário à requisição (pra rota saber quem está pedindo) e deixa passar. Token ausente ou inválido: responde **401** ali mesmo, e a rota nem executa.\n\nUm refinamento que vem logo em seguida: autenticação diz **quem você é**; autorização diz **o que você pode**. O middleware resolve a primeira; a segunda é checagem extra (esse usuário é admin? esse recurso pertence a ele?) que responde **403** quando falha.\n\nDesenhe pensando em grupos: rotas públicas (cadastro, login, listagem aberta) ficam fora da barreira; todo o resto fica atrás dela. Escolha sua linguagem pra ver a mecânica.",
              byLanguage: {
                node: {
                  content:
                    'No Express, é um middleware seu: leia `req.headers.authorization`, separe o `Bearer`, verifique com `jwt.verify(token, segredo)` da biblioteca **jsonwebtoken** (dentro de try/catch, token inválido lança erro), anexe o payload em `req.user` e chame `next()`. Aplique por grupo: `app.use("/api/privado", autenticar)`.',
                  resources: [
                    {
                      label: "jsonwebtoken (pacote npm)",
                      url: "https://www.npmjs.com/package/jsonwebtoken",
                      kind: "doc",
                    },
                  ],
                },
                python: {
                  content:
                    "No FastAPI, a barreira é uma **dependência**: o `OAuth2PasswordBearer` extrai o token do header pra você, e uma função `get_current_user` o verifica e devolve o usuário (ou levanta `HTTPException` 401). Toda rota protegida declara `Depends(get_current_user)`. O tutorial oficial de segurança monta exatamente esse fluxo, com JWT, passo a passo.",
                  resources: [
                    {
                      label: "FastAPI: OAuth2 com JWT",
                      url: "https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/",
                      kind: "doc",
                    },
                  ],
                },
                java: {
                  content:
                    "No Spring Boot, quem faz esse papel é o **Spring Security**: você configura a `SecurityFilterChain` dizendo quais caminhos são públicos (`permitAll`) e quais exigem autenticação (`authenticated`), e adiciona um filtro que valida o JWT e popula o contexto de segurança. É o caminho com mais peças das quatro linguagens; siga um guia oficial com calma e monte uma vez, porque a estrutura se repete em todo projeto corporativo.",
                  resources: [
                    {
                      label: "Spring Security (documentação oficial)",
                      url: "https://docs.spring.io/spring-security/reference/",
                      kind: "doc",
                    },
                  ],
                },
                go: {
                  content:
                    'No Go, é o padrão de embrulhar handlers da seção de servidor: o middleware lê o header `Authorization`, valida com a biblioteca **golang-jwt** (`jwt.Parse` com a função que devolve seu segredo), coloca o usuário no `context` da requisição e chama o próximo handler; inválido, responde 401 e para. No Gin, mesma lógica com `c.GetHeader`, `c.Set("user", ...)` e `c.Abort()`.',
                  resources: [
                    {
                      label: "golang-jwt (documentação do pacote)",
                      url: "https://pkg.go.dev/github.com/golang-jwt/jwt/v5",
                      kind: "doc",
                    },
                  ],
                },
              },
            },
          ],
        },
        {
          id: "autenticacao.seguranca",
          title: "Segurança básica",
          children: [
            {
              id: "autenticacao.seguranca.segredos",
              title: "Variáveis de ambiente e segredos",
              description:
                "Manter senhas, chaves e tokens fora do código e fora do Git.",
              content:
                "Seu projeto agora tem **segredos**: a senha do banco, a chave que assina os JWTs, tokens de serviços externos. A regra é uma só e não tem exceção: **segredo não entra no código-fonte**. Código vai pro Git, Git vai pro GitHub, e segredo commitado é segredo vazado, mesmo em repositório privado, mesmo que você apague depois (o histórico do Git lembra).\n\nO lugar dos segredos são as **variáveis de ambiente**: valores que o sistema operacional entrega ao programa quando ele inicia. O código lê `DATABASE_URL` e `JWT_SECRET` do ambiente, sem saber o valor; cada máquina (a sua, a do colega, o servidor de produção) define os seus.\n\nNo dia a dia, usa-se um arquivo **`.env`** na raiz do projeto com os pares `CHAVE=valor`, carregado na inicialização (as quatro linguagens têm suporte nativo ou biblioteca pra isso). Os dois hábitos que completam o sistema: o `.env` entra no **`.gitignore`** imediatamente, antes do primeiro commit; e o projeto mantém um **`.env.example`** versionado, com as chaves e valores falsos, pra documentar o que é preciso configurar.\n\nSe um segredo escapar pro Git, a resposta certa não é apagar o commit: é **trocar o segredo**. Considere queimado.",
              resources: [
                {
                  label: "The Twelve-Factor App: configurações",
                  url: "https://12factor.net/pt_br/config",
                  kind: "artigo",
                },
              ],
            },
            {
              id: "autenticacao.seguranca.cors",
              title: "CORS",
              description:
                "A trava do navegador que decide quais sites podem chamar sua API.",
              content:
                'Mais cedo ou mais tarde, todo dev back-end vive esta cena: o front-end chama a API e o navegador bloqueia com um erro de **CORS** no console. Entender o que está acontecendo transforma o sapo em configuração de cinco minutos.\n\nPor segurança, os navegadores seguem a política de mesma origem: o JavaScript de um site só pode chamar APIs **da própria origem** (a combinação de domínio, protocolo e porta). Como seu front em `localhost:3000` e sua API em `localhost:3100` são origens diferentes, o navegador exige que **a API autorize** explicitamente aquela origem. CORS é exatamente esse mecanismo de autorização: a API responde com o header `Access-Control-Allow-Origin` dizendo quem pode.\n\nDois pontos pra fixar. Primeiro: a configuração é sempre **no servidor**, não há o que "consertar" no front. Segundo: CORS protege o usuário no navegador, **não protege sua API**; requisições de fora do navegador (scripts, outras APIs) nem passam por ele. Autenticação continua obrigatória.\n\nNa prática, todo framework tem middleware ou configuração de CORS pronto: você lista as origens permitidas (a do seu front em produção, a de desenvolvimento) e segue o jogo. Liberar tudo com `*` é aceitável só em API pública sem credenciais.',
              resources: [
                {
                  label: "MDN: CORS",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CORS",
                  kind: "doc",
                },
              ],
            },
            {
              id: "autenticacao.seguranca.validacao",
              title: "Validação e sanitização",
              description:
                "Tratar todo dado externo como hostil até prova em contrário.",
              content:
                'Você já valida formato desde a seção de APIs. Agora o mesmo tema pelo ângulo da segurança: dado externo não é só potencialmente errado, é **potencialmente malicioso**. Os ataques mais clássicos da web entram pela porta dos dados de entrada.\n\nO exemplo canônico é a **injeção de SQL**: se o código monta a consulta concatenando texto do usuário (`"SELECT * FROM usuarios WHERE nome = \'" + nome + "\'"`), alguém digita um nome cheio de SQL e passa a conversar com seu banco. A defesa é nunca montar SQL com concatenação: use **consultas parametrizadas**, em que o valor viaja separado do comando. ORMs fazem isso por padrão, um dos motivos de usá-los.\n\nO primo dele é o **XSS**: um usuário salva um texto contendo script, sua API o devolve, e o navegador de outra pessoa executa. A defesa principal é do lado de quem exibe (escapar o conteúdo), mas o back-end ajuda **sanitizando**: limpando ou rejeitando conteúdo suspeito na entrada.\n\nA postura geral que resolve quase tudo: valide com **lista do que é permitido** (formato, tamanho, faixa, opções válidas) em vez de tentar bloquear o que é proibido, e jamais use dado bruto do usuário pra montar comandos, consultas ou caminhos de arquivo.',
              resources: [
                {
                  label: "OWASP: SQL Injection",
                  url: "https://owasp.org/www-community/attacks/SQL_Injection",
                  kind: "artigo",
                },
              ],
            },
            {
              id: "autenticacao.seguranca.owasp",
              title: "Ameaças comuns (OWASP)",
              description:
                "O mapa das vulnerabilidades mais exploradas em aplicações web.",
              optional: true,
              content:
                'A **OWASP** é uma fundação sem fins lucrativos dedicada à segurança de software, e seu projeto mais famoso é o **OWASP Top 10**: a lista, atualizada periodicamente, das categorias de vulnerabilidade mais críticas em aplicações web. É a referência comum entre devs e times de segurança no mundo todo, e aparece em requisito de vaga com frequência.\n\nVárias categorias da lista você já combateu nesta trilha sem saber o nome formal: **injeção** (as consultas parametrizadas), **falhas de identificação e autenticação** (hashing de senha, tokens com expiração), **falhas criptográficas** (não inventar criptografia própria), **má configuração de segurança** (segredos fora do código, CORS restrito).\n\nOutras valem conhecer de nome: **quebra de controle de acesso** (a mais comum: o usuário 7 consegue ler os dados do usuário 8 trocando o id na URL, porque a rota checa login mas não checa dono), componentes desatualizados com vulnerabilidades conhecidas, e falhas de log e monitoramento que deixam invasões passarem despercebidas.\n\nO uso prático: leia o Top 10 como **checklist de revisão** do seu projeto final. Pra cada item, pergunte "onde isso poderia acontecer aqui?". É exatamente assim que times profissionais o usam.',
              resources: [
                {
                  label: "OWASP Top 10",
                  url: "https://owasp.org/www-project-top-ten/",
                  kind: "artigo",
                },
              ],
            },
          ],
        },
        {
          id: "autenticacao.rate",
          title: "Rate limiting",
          description:
            "Limitar quantas requisições cada cliente pode fazer por período.",
          optional: true,
          content:
            'Sem limite, nada impede um cliente (ou um robô) de fazer milhares de requisições por segundo à sua API: tentando adivinhar senhas no login por força bruta, raspando seus dados ou simplesmente derrubando o serviço pra todo mundo. **Rate limiting** é a defesa: um teto de requisições por cliente por período, algo como "100 por minuto por IP".\n\nA mecânica: a cada requisição, o servidor identifica o cliente (em geral pelo IP, ou pelo usuário autenticado), incrementa um contador com janela de tempo e, estourado o limite, responde **429 Too Many Requests** em vez de processar. O cliente espera a janela virar e volta ao normal.\n\nDois pontos de atenção. Limites não precisam ser iguais pra tudo: rotas sensíveis como **login merecem limite bem mais apertado** que o resto, justamente por serem alvo de força bruta. E se sua API roda em mais de uma instância, o contador precisa viver num lugar compartilhado; é um dos usos clássicos do Redis visto na seção de banco.\n\nNa prática, é middleware pronto em todos os ecossistemas (procure por "rate limit" junto do nome do seu framework). Pro projeto da trilha, um limite global simples mais um limite apertado no login já demonstram a competência.',
          resources: [
            {
              label: "MDN: status 429 Too Many Requests",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status/429",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "qualidade",
      title: "Qualidade de código",
      description:
        "O que separa código que funciona de código profissional: tipos, organização, testes e visibilidade do que acontece.",
      level: "avancado",
      children: [
        {
          id: "qualidade.tipagem",
          title: "Tipagem",
          description:
            "Usar tipos pra transformar erros de execução em erros pegos antes de rodar.",
          content:
            "Quanto mais o projeto cresce, mais caro fica o erro bobo: a função que esperava número e recebeu texto, o campo que veio undefined, o nome digitado errado. **Tipagem** é a prática de declarar o formato dos dados pro computador conferir por você, transformando erros que explodiriam em produção em avisos no editor, **antes de rodar**.\n\nOs benefícios compostos: o editor passa a autocompletar com precisão, refatorações ficam seguras (mudou o nome do campo, a ferramenta aponta todos os lugares afetados) e os tipos viram documentação que nunca desatualiza, porque é verificada.\n\nAqui as quatro linguagens da trilha se dividem. Java e Go já nasceram tipadas: seu trabalho é usar bem o que existe. JavaScript e Python nasceram dinâmicas e ganharam tipagem opcional por cima (TypeScript e type hints), que o mercado adotou em peso: projetos profissionais novos raramente abrem mão.\n\nA recomendação é a mesma nos quatro casos: **no projeto final da trilha, vá com tipagem ligada**. O custo de aprender é pago em dias; o hábito vale pra carreira inteira.",
          byLanguage: {
            node: {
              content:
                "No mundo Node, tipagem é **TypeScript**: um superconjunto do JavaScript (todo JS válido é TS válido) que adiciona tipos e compila pra JS normal. Você anota funções (`function somar(a: number, b: number): number`), descreve formatos com `interface` ou `type`, e o compilador barra o que não encaixa. A combinação com o Zod da seção de APIs é especialmente boa: o schema de validação vira o tipo automaticamente, sem declarar duas vezes.",
              resources: [
                {
                  label: "TypeScript (documentação oficial)",
                  url: "https://www.typescriptlang.org/docs/",
                  kind: "doc",
                },
              ],
            },
            python: {
              content:
                "No Python, são os **type hints**: anotações nativas da linguagem (`def somar(a: int, b: int) -> int:`). O detalhe: o Python em si não confere os hints ao rodar; quem confere é um verificador externo como o **mypy**, rodado como etapa de checagem (`mypy app/`). Se você está no FastAPI, já usa hints desde o primeiro dia, eles são o motor da validação e das docs automáticas; o passo novo é adicionar o verificador.",
              resources: [
                {
                  label: "Python: módulo typing (documentação oficial)",
                  url: "https://docs.python.org/pt-br/3/library/typing.html",
                  kind: "doc",
                },
                {
                  label: "mypy (documentação oficial)",
                  url: "https://mypy.readthedocs.io",
                  kind: "doc",
                },
              ],
            },
            java: {
              content:
                "Java é tipada desde a origem, então aqui o tema é usar o sistema de tipos **a seu favor**. Três hábitos: crie classes pequenas pra dados em vez de passar mapas genéricos (os **records**, `record ProdutoResponse(Long id, String nome) {}`, tornam isso barato); use `Optional` no retorno do que pode não existir, forçando quem chama a tratar o vazio; e prefira tipos específicos a String pra tudo (enums pra status, por exemplo). O compilador só protege o que você expressa em tipos.",
              resources: [
                {
                  label: "Dev.java: records",
                  url: "https://dev.java/learn/records/",
                  kind: "doc",
                },
              ],
            },
            go: {
              content:
                'Go também já é tipada; o salto de qualidade está em duas peças. As **structs** com tipos precisos pra cada dado que entra e sai da API (nada de `map[string]interface{}` circulando pelo código). E as **interfaces**, que declaram comportamento ("qualquer coisa que tenha o método Buscar") e permitem trocar implementações, essencial pros testes logo abaixo. Complete com `go vet`, o verificador oficial que pega erros que o compilador deixa passar.',
              resources: [
                {
                  label: "Effective Go",
                  url: "https://go.dev/doc/effective_go",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "qualidade.estrutura",
          title: "Estrutura em camadas",
          description:
            "Separar rotas, regras de negócio e acesso ao banco em camadas com papéis claros.",
          content:
            'Seu projeto começou com tudo dentro das rotas: validação, regra de negócio, consulta ao banco, montagem da resposta. Funciona até crescer; aí toda mudança vira caça ao tesouro. A solução clássica é a **estrutura em camadas**, e ela aparece, com nomes parecidos, em praticamente todo back-end profissional:\n\n- **Camada de rotas** (controllers/handlers): recebe a requisição, aciona quem resolve e monta a resposta HTTP. Fina de propósito: nada de regra de negócio aqui.\n- **Camada de serviços**: o coração. As regras do sistema ("não pode comprar com estoque zerado", "e-mail duplicado é conflito") vivem aqui, **sem saber nada de HTTP**.\n- **Camada de repositórios**: todo o acesso ao banco. É a única que conhece SQL ou ORM.\n\nA regra que sustenta o desenho: **cada camada só fala com a vizinha de baixo**. Rota chama serviço, serviço chama repositório; rota nunca pula direto pro banco.\n\nO ganho é concreto: regra de negócio testável sem subir servidor (gancho pro passo de testes), troca de banco sem tocar nas regras, e qualquer pessoa do time sabe onde procurar cada coisa. Pro projeto da trilha, três pastas (`routes`, `services`, `repositories`, ou os nomes idiomáticos da sua linguagem) já entregam o benefício inteiro.',
        },
        {
          id: "qualidade.erros",
          title: "Padrão de erros e respostas",
          description: "Um formato único de resposta de erro pra API inteira.",
          content:
            'Na seção de APIs você aprendeu a tratar erros; agora, a padronizar a **cara** deles. Se cada rota inventa seu formato (uma devolve `{ erro: "..." }`, outra `{ message: "..." }`, outra um texto solto), quem consome a API precisa tratar cada caso, e o front-end vira um zoológico de ifs.\n\nA solução é contrato: **toda resposta de erro da API segue o mesmo formato**. Um desenho simples e suficiente:\n\n- `status`: o código HTTP, repetido no corpo por conveniência.\n- `code`: um identificador estável e legível por máquina (`email_ja_cadastrado`, `produto_nao_encontrado`). É nele que o cliente se baseia pra decidir o que fazer, nunca na mensagem.\n- `message`: o texto pra humanos, que pode mudar sem quebrar ninguém.\n- Opcionalmente `details`: a lista de campos inválidos na validação.\n\nA implementação se conecta com o que você já montou: as camadas de serviço lançam erros semânticos ("isso é um conflito", "isso não existe") e o **tratador global** da seção de APIs traduz cada um pro formato padrão com o status certo. Nenhuma rota monta JSON de erro na mão.\n\nVale saber que existe um padrão formal pra isso, o **Problem Details** (RFC 9457), usado por várias APIs públicas. Pro seu projeto, o formato simples acima basta; o que não se negocia é a consistência.',
          resources: [
            {
              label: "RFC 9457: Problem Details for HTTP APIs",
              url: "https://www.rfc-editor.org/rfc/rfc9457",
              kind: "doc",
            },
          ],
        },
        {
          id: "qualidade.logging",
          title: "Logging",
          description:
            "Registrar o que o sistema fez pra conseguir investigar quando algo der errado.",
          content:
            'Em produção, você não tem o console aberto nem o debugger na mão. Quando um usuário disser "deu erro ontem à noite", sua única testemunha é o **log**: o registro do que o sistema fez e quando. Logging é a diferença entre investigar e adivinhar.\n\nO primeiro upgrade em relação ao print solto é usar **níveis**, que todo framework de log oferece: `error` (algo falhou e precisa de atenção), `warn` (suspeito, mas seguiu), `info` (eventos relevantes: servidor subiu, pedido criado) e `debug` (detalhe pra desenvolvimento, desligado em produção). Em vez de apagar prints, você regula o volume por configuração.\n\nO segundo upgrade são **logs estruturados**: em vez de frases soltas, eventos com campos (`{ level: "error", rota: "/pedidos", usuario_id: 7, erro: "timeout no banco" }`), que dão pra filtrar e buscar quando o volume cresce. As bibliotecas maduras de cada ecossistema fazem isso por padrão.\n\nE a regra de ouro do que **não** logar: senha (nem errada), token, dado de cartão e dado pessoal sensível. Log vaza com facilidade (vai pra serviços de terceiros, fica anos guardado), então trate-o como semi-público.\n\nO mínimo pro projeto da trilha: um log por requisição (método, rota, status, duração) e todo erro inesperado logado com contexto no tratador global.',
          resources: [
            {
              label: "The Twelve-Factor App: logs",
              url: "https://12factor.net/pt_br/logs",
              kind: "artigo",
            },
          ],
        },
        {
          id: "qualidade.testes",
          title: "Testes",
          description:
            "Código que verifica seu código, e a confiança pra mudar sem medo de quebrar.",
          content:
            "Teste automatizado é código que **executa o seu código e confere o resultado**: chama a função de calcular frete com entradas conhecidas e verifica a saída; chama a rota de cadastro e confere o 201. Escrito uma vez, roda mil vezes de graça.\n\nO valor real não é provar que funciona hoje, é **liberdade pra mudar amanhã**: com uma suíte de testes, você refatora, atualiza dependência e adiciona feature sabendo na hora se quebrou algo. Sem ela, todo deploy é um salto sem rede, e o medo congela o projeto.\n\nDois tipos cobrem o essencial no back-end. **Testes unitários** verificam uma função isolada, de preferência as regras de negócio da camada de serviços (a estrutura em camadas existe também pra isso: serviço que não conhece HTTP nem banco testa fácil). **Testes de integração** sobem a aplicação e batem nas rotas de verdade, conferindo status e corpo da resposta; pra API, são os que mais pagam o investimento.\n\nComece pequeno e honesto: as regras de negócio com casos de borda (carrinho vazio, estoque zerado, e-mail duplicado) e o caminho feliz mais os erros principais de cada rota do CRUD. Suíte que roda em segundos com um comando é critério de pronto do projeto da trilha.",
          byLanguage: {
            node: {
              content:
                'No Node, o **Vitest** é o test runner moderno (rápido, configuração mínima, TypeScript de fábrica) e o **Jest** é o clássico que você verá em muitos projetos; os dois têm a mesma cara de escrita (`describe`, `it`, `expect`). Pra testar rotas do Express de verdade, junte o **supertest**, que sobe o app em memória e faz requisições: `await request(app).post("/produtos").send(dados)` seguido de `expect(201)`.',
              resources: [
                {
                  label: "Vitest (documentação oficial)",
                  url: "https://vitest.dev",
                  kind: "doc",
                },
              ],
            },
            python: {
              content:
                'No Python, o padrão absoluto é o **pytest**: testes são funções simples começando com `test_`, e a verificação é um `assert` puro. Pra testar a API, o FastAPI traz o **TestClient**: `client.post("/produtos", json=dados)` devolve a resposta pra você conferir status e corpo, sem subir servidor de verdade. O tutorial oficial de testing do FastAPI mostra o caminho completo em uma página.',
              resources: [
                {
                  label: "pytest (documentação oficial)",
                  url: "https://docs.pytest.org",
                  kind: "doc",
                },
                {
                  label: "FastAPI: testando",
                  url: "https://fastapi.tiangolo.com/tutorial/testing/",
                  kind: "doc",
                },
              ],
            },
            java: {
              content:
                "No Java, a base é o **JUnit 5** (métodos anotados com `@Test`, verificações com `assertEquals` e afins), quase sempre com **AssertJ** pra asserções mais legíveis. O Spring Boot traz o `spring-boot-starter-test` com tudo isso pronto, mais o **MockMvc** pra testar controllers sem subir servidor: você simula o request e confere status e JSON da resposta. Pra serviços, o **Mockito** substitui os repositórios por dublês.",
              resources: [
                {
                  label: "JUnit 5 (guia oficial)",
                  url: "https://junit.org/junit5/docs/current/user-guide/",
                  kind: "doc",
                },
                {
                  label: "Spring: testando a camada web",
                  url: "https://spring.io/guides/gs/testing-web",
                  kind: "doc",
                },
              ],
            },
            go: {
              content:
                "Go traz testes **na linguagem**, sem framework: arquivos `_test.go` com funções `func TestNome(t *testing.T)`, rodados com `go test ./...`. O idiomático são os **table-driven tests**: uma lista de casos (entrada e saída esperada) percorrida num loop, perfeita pros casos de borda. Pra rotas, o pacote `net/http/httptest` simula requisições e captura a resposta sem abrir porta.",
              resources: [
                {
                  label: "Go: pacote testing",
                  url: "https://pkg.go.dev/testing",
                  kind: "doc",
                },
                {
                  label: "Go: escrevendo um teste (tutorial oficial)",
                  url: "https://go.dev/doc/tutorial/add-a-test",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "qualidade.docs",
          title: "Documentar a API (OpenAPI)",
          description:
            "A descrição formal da sua API que vira documentação navegável.",
          optional: true,
          content:
            'Quem consome sua API (o dev do front, um colega, você daqui a seis meses) precisa saber quais rotas existem, o que cada uma recebe e o que devolve. Documentação em texto solto desatualiza na primeira semana. A resposta do mercado é o **OpenAPI**: um padrão pra descrever APIs REST num formato que máquinas entendem (um arquivo YAML ou JSON listando rotas, parâmetros, formatos e respostas).\n\nDessa descrição nascem coisas úteis de graça: a principal é a interface **Swagger UI**, uma página navegável onde se lê cada rota e, melhor, **testa direto do navegador**, sem instalar nada. Também dá pra gerar código de cliente e validar que a API cumpre o contrato.\n\nO esforço varia por ecossistema, e aqui o FastAPI larga na frente: a documentação OpenAPI nasce **automaticamente** dos seus modelos e rotas (visite `/docs` no seu projeto e ela já está lá). No Spring Boot, a biblioteca springdoc-openapi gera o equivalente a partir dos controllers. No Express e no Go, o caminho comum é anotar as rotas ou manter o arquivo de especificação, com bibliotecas servindo o Swagger UI.\n\nÉ opcional porque a API funciona sem isso. Mas no portfólio, um link de documentação navegável diz "sei trabalhar em time" mais alto que qualquer README.',
          resources: [
            {
              label: "OpenAPI Initiative",
              url: "https://www.openapis.org",
              kind: "doc",
            },
            {
              label: "Swagger (ferramentas OpenAPI)",
              url: "https://swagger.io/docs/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "deploy",
      title: "Projeto e deploy",
      description:
        "A reta final: construir a API completa, colocar no ar e saber que ela continua de pé.",
      level: "avancado",
      children: [
        {
          id: "deploy.apirest",
          title: "Construir uma API REST",
          description: "Juntar tudo num projeto de ponta a ponta.",
          content:
            "Olhe pra trás um instante: você entrou nesta trilha aprendendo o que é cliente e servidor, e agora tem nas mãos rotas, validação, banco com migrations, autenticação com JWT e um tratador global de erros. Este passo junta tudo isso numa encomenda só.\n\nA encomenda é a **API de hábitos** do projeto abaixo: usuários se cadastram, fazem login e registram os hábitos que estão construindo, cada um enxergando só o que é seu. Cabe num fim de semana esticado e exercita exatamente o arco da trilha: modelar as tabelas, expor o CRUD com os status certos, proteger rotas com o middleware de autenticação e falhar bonito no formato único de erros.\n\nO critério de chegada é objetivo: a API respondendo numa URL pública, o repositório no GitHub com um README que ensina a rodar, e você explicando cada decisão (por que esse status? por que essa tabela?) sem colar. Os passos seguintes desta seção cuidam da parte de colocar no ar; o projeto guia o resto.\n\nÉ este repositório que vira a peça central do seu portfólio de back-end. Capriche na encomenda: recrutador não lê certificado, lê código.",
          project: "api-habitos",
          resources: [
            {
              label: "MDN REST",
              url: "https://developer.mozilla.org/pt-BR/docs/Glossary/REST",
              kind: "doc",
            },
          ],
        },
        {
          id: "deploy.env",
          title: "Configuração por ambiente (.env)",
          description:
            "O mesmo código rodando com configurações diferentes em desenvolvimento e produção.",
          content:
            "Na seção de segurança, as variáveis de ambiente entraram pra esconder segredos. No deploy, elas ganham o segundo papel: fazer **o mesmo código** rodar em lugares diferentes com configurações diferentes. É um princípio central de deploy: o que muda entre ambientes não é o código, é a configuração.\n\nPense no que difere entre sua máquina e o servidor: a URL do banco (local x gerenciado), a porta, as origens permitidas no CORS, o nível de log (`debug` em dev, `info` em produção). Tudo isso vira variável de ambiente, lida na inicialização. Existe inclusive a convenção de uma variável dizendo qual é o ambiente (como `NODE_ENV` no Node ou perfis no Spring), pra ativar comportamentos em bloco.\n\nNa prática do deploy: o arquivo `.env` é coisa da sua máquina e **não sobe pro servidor**; as plataformas de hospedagem têm um painel de variáveis de ambiente onde você cadastra os valores de produção, e elas os injetam no processo.\n\nDois hábitos que evitam sustos. Centralize a leitura das variáveis num módulo único de configuração, em vez de espalhar leituras pelo código. E **valide na inicialização**: se uma variável obrigatória está faltando, o ideal é o app recusar a subir com uma mensagem clara, não quebrar de madrugada no primeiro uso.",
          resources: [
            {
              label: "The Twelve-Factor App: configurações",
              url: "https://12factor.net/pt_br/config",
              kind: "artigo",
            },
          ],
        },
        {
          id: "deploy.bancoprod",
          title: "Banco de dados gerenciado",
          description:
            "O Postgres de produção como serviço, com backup e manutenção por conta da plataforma.",
          content:
            "O Postgres rodando na sua máquina morre quando você desliga o computador. Em produção, o banco precisa viver num servidor sempre ligado, e a forma moderna de fazer isso é o **banco gerenciado**: você contrata o Postgres como serviço, e a plataforma cuida de instalação, atualizações, disco e **backups**, enquanto você recebe só o que importa: uma URL de conexão.\n\nA alternativa (alugar um servidor e administrar o Postgres na mão) ensina muito, mas é responsabilidade demais pra agora: banco sem backup é tragédia anunciada. Gerenciado é a escolha certa pro primeiro deploy.\n\nAs próprias plataformas de hospedagem da trilha, como **Railway** e **Render**, oferecem Postgres gerenciado a um clique, o que simplifica tudo: API e banco no mesmo lugar. Há também serviços dedicados só a Postgres, como **Neon** e **Supabase**, com planos gratuitos pra projetos pequenos.\n\nO fluxo na prática: crie o banco na plataforma, copie a URL de conexão (ela carrega usuário, senha, host e nome do banco numa string só), cadastre como variável de ambiente da API e **rode as migrations** apontando pra ele. Seu banco local segue existindo pra desenvolvimento; produção e dev nunca compartilham banco.",
        },
        {
          id: "deploy.publicar",
          title: "Deploy (Railway, Render)",
          description:
            "Colocar sua API no ar, com URL pública, a partir do repositório no GitHub.",
          content:
            "**Deploy** é tirar a API do localhost e colocá-la num servidor com URL pública. Plataformas como **Railway** e **Render** tornaram isso acessível: você conecta seu repositório do GitHub, a plataforma detecta a linguagem, instala as dependências, executa o comando de start e entrega uma URL. Os planos gratuitos ou de baixo custo atendem bem projeto de portfólio.\n\nO fluxo típico: criar conta, apontar pro repositório, cadastrar as variáveis de ambiente no painel (incluindo a URL do banco gerenciado) e disparar o primeiro deploy. A partir daí, **cada push na branch principal redeploya sozinho**, e é por isso que tudo que a trilha cobrou antes importa agora: segredos fora do código, configuração por ambiente, migrations versionadas.\n\nDois ajustes que pegam todo mundo no primeiro deploy. A **porta**: a plataforma define em qual porta seu app deve escutar via variável de ambiente (`PORT`); código com porta fixa no fonte não sobe. E o **comando de start**: confira que o de produção está declarado do jeito que a plataforma espera (algo como o script start no Node ou o binário compilado no Go).\n\nQuando a URL responder, faça o ritual: chame sua API publicada de outro dispositivo e comemore. Poucas sensações na carreira batem o primeiro deploy.",
          resources: [
            {
              label: "Railway (documentação)",
              url: "https://docs.railway.app",
              kind: "doc",
            },
            {
              label: "Render (documentação)",
              url: "https://render.com/docs",
              kind: "doc",
            },
          ],
        },
        {
          id: "deploy.monitor",
          title: "Logs e monitoramento",
          description:
            "Enxergar o que sua API está fazendo em produção e descobrir problemas antes dos usuários.",
          content:
            "Com a API no ar, surge a pergunta que define operação: **ela está funcionando agora?** Sem visibilidade, a resposta vem do pior jeito possível: um usuário reclamando. Monitorar é garantir que você descobre antes.\n\nA primeira ferramenta você já construiu: os **logs** da seção de qualidade. As plataformas de deploy capturam tudo que sua aplicação escreve na saída padrão e mostram num painel com busca. Deploy quebrou ou rota deu 500? O painel de logs da plataforma é o primeiro lugar a olhar. É exatamente aqui que o log estruturado com contexto se paga.\n\nA segunda peça é o **health check**: uma rota simples (como `GET /health`) que responde 200 quando o serviço está de pé, de preferência checando também a conexão com o banco. As plataformas usam essa rota pra saber se a aplicação subiu, e serviços de monitoramento externos podem chamá-la de tempos em tempos e te avisar se ela parar de responder.\n\nO terceiro nível é o **rastreamento de erros**: serviços que capturam cada exceção em produção com stack trace e contexto, agrupam ocorrências repetidas e notificam. O Sentry é o nome mais conhecido, com plano gratuito que atende projeto pequeno.\n\nPra trilha, o essencial: rota de health check, logs limpos no painel da plataforma e o hábito de olhá-los depois de cada deploy.",
          resources: [
            {
              label: "Sentry (documentação oficial)",
              url: "https://docs.sentry.io",
              kind: "doc",
            },
          ],
        },
        {
          id: "deploy.ci",
          title: "CI básico",
          description:
            "Checagens automáticas rodando a cada push, antes do código chegar em produção.",
          optional: true,
          content:
            "Você já tem testes e checagem de tipos; o elo que falta é **garantir que eles rodam sempre**, não só quando alguém lembra. **CI** (integração contínua) é isso: um serviço que, a cada push ou pull request, baixa seu código num servidor limpo e roda as checagens. Se algo falha, o PR fica marcado em vermelho e ninguém faz merge de código quebrado por descuido.\n\nNo GitHub, a ferramenta é o **GitHub Actions**, gratuito pra repositórios públicos. A configuração é um arquivo YAML em `.github/workflows/` descrevendo o **workflow**: quando rodar (a cada push e PR) e os passos (instalar a linguagem, instalar dependências, rodar a checagem de tipos, rodar os testes). Pra um projeto da trilha, são poucas linhas, e os templates prontos do próprio Actions cobrem as quatro linguagens.\n\nO efeito combinado com o deploy automático da plataforma é o pipeline profissional em miniatura: push abre PR, o CI valida, o merge na principal dispara o deploy. Código quebrado para na barreira em vez de chegar em produção.\n\nÉ opcional, mas é barato e de impacto desproporcional no portfólio: o selo verde de checks passando no repositório comunica disciplina de engenharia que pouco iniciante demonstra.",
          resources: [
            {
              label: "GitHub Actions (documentação oficial)",
              url: "https://docs.github.com/pt/actions",
              kind: "doc",
            },
          ],
        },
        {
          id: "deploy.docker",
          title: "Docker",
          description:
            "Empacotar a aplicação com tudo que ela precisa pra rodar igual em qualquer máquina.",
          optional: true,
          content:
            '"Na minha máquina funciona" é a frase mais famosa do desenvolvimento, e o **Docker** existe pra aposentá-la. Ele empacota sua aplicação junto com tudo que ela precisa (a linguagem na versão certa, as dependências, as configurações) numa **imagem**, que roda como **contêiner**: um processo isolado que se comporta igual na sua máquina, na do colega e no servidor.\n\nAs peças: o **Dockerfile** é a receita da imagem (comece desta base, copie o código, instale as dependências, rode este comando); a **imagem** é o pacote pronto e imutável; o **contêiner** é a imagem em execução. Com o **Docker Compose**, um arquivo descreve vários contêineres de uma vez, e esse é o uso mais útil pra você agora: subir a API e um Postgres juntos com um comando (`docker compose up`), sem instalar o Postgres na máquina.\n\nNo deploy, as plataformas da trilha aceitam projetos com Dockerfile, e em times maiores o contêiner é a unidade padrão de deploy, base de tudo que envolve Kubernetes e orquestração (assunto pra bem mais tarde).\n\nÉ opcional porque Railway e Render fazem deploy sem Docker. Mas é presença constante em vaga de back-end, e o investimento de aprender o básico (Dockerfile, build, run, compose) é pequeno perto do retorno.',
          resources: [
            {
              label: "Docker: get started (documentação oficial)",
              url: "https://docs.docker.com/get-started/",
              kind: "doc",
            },
          ],
        },
      ],
    },
  ],
};
