// TODO(Ana): revisao editorial do upgrade da fase 3c, lote 2 (folha nova de
// testes, fecho do projeto elevado, fechos de criterio de dominio, conexoes
// nominais front/back, blocos de codigo e resources novos).
import type { RoadmapV2 } from "../types";

export const fullstack: RoadmapV2 = {
  slug: "fullstack",
  area: "fullstack",
  title: "Full-stack do Zero",
  level: "Iniciante",
  description:
    "Da primeira tela até uma aplicação completa no ar: front-end, back-end, banco e deploy. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que significa ser full-stack, como as duas pontas conversam e as ferramentas que você vai usar todo dia.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é ser full-stack",
          description:
            "Um dev que transita pelos dois lados da aplicação, da tela ao servidor.",
          content:
            "Toda aplicação web tem dois lados. O **front-end** é o que o usuário vê e toca: a tela, os botões, os formulários, rodando no navegador. O **back-end** é o que fica escondido no servidor: as regras, os cálculos, o banco de dados, decidindo o que pode e o que não pode. O dev full-stack é quem trabalha nos dois.\n\nNa prática, isso quer dizer construir uma feature de ponta a ponta. Você desenha a tela de cadastro, escreve o código que valida os dados no servidor, salva no banco e mostra o resultado de volta na tela. Em vez de depender de outra pessoa pra cada metade, você entrega o fluxo inteiro.\n\nEsse perfil é muito procurado em times pequenos e startups, onde uma pessoa precisa resolver o problema completo. Mas atenção a uma armadilha comum: full-stack não é saber tudo de tudo. É ter base sólida nos dois lados e profundidade onde o trabalho exige. Esta trilha segue exatamente essa ordem: primeiro o front, depois o back, depois a costura entre eles e por fim colocar no ar.",
          resources: [
            {
              label: "MDN: Visão geral cliente-servidor",
              url: "https://developer.mozilla.org/pt-BR/docs/Learn/Server-side/First_steps/Client-Server_overview",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.web",
          title: "Como a web funciona",
          description:
            "O vai e vem de requisição e resposta que liga o navegador ao servidor.",
          content:
            "Antes de escrever código, entenda o terreno. Quando você abre um site, o navegador (o **cliente**) manda uma requisição pela internet até um **servidor**, um computador sempre ligado esperando pedidos. O servidor processa e devolve uma resposta. Esse vai e vem é a base de tudo que você vai construir.\n\nA conversa segue um protocolo chamado **HTTP**. Cada requisição carrega um método que diz a intenção: GET pra buscar dados, POST pra criar, PUT e PATCH pra atualizar, DELETE pra apagar. A resposta sempre vem com um código de status: a faixa 2xx é sucesso (200 ok, 201 criado), 4xx é erro de quem pediu (404 não encontrado, 401 não autorizado) e 5xx é erro do servidor.\n\nPra um full-stack isso importa duas vezes. No front-end, você dispara essas requisições e trata as respostas. No back-end, você é quem recebe o pedido e escolhe o status certo pra devolver. Saber ler os dois lados da mesma conversa é o que te dá a visão completa que vale a pena ter. Você não precisa decorar tudo agora; cada etapa adiante volta a esses conceitos com exemplos concretos.",
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
          id: "fundamentos.terminal",
          title: "Terminal e linha de comando",
          description:
            "A forma de dar ordens ao computador por texto, presente nas duas pontas do trabalho.",
          content:
            "O terminal é um programa onde você comanda o computador digitando em vez de clicar. Parece antiquado, mas é o contrário: é uma das ferramentas mais usadas no desenvolvimento, porque é rápida, precisa e funciona em qualquer servidor, inclusive nos que não têm tela.\n\nComo full-stack, você vai abrir o terminal o tempo todo: instalar o Node, rodar o servidor do back-end, subir o front-end em modo de desenvolvimento, usar o Git, ver logs de erro e publicar o projeto. Os dois lados passam por aqui.\n\nO básico cabe em poucos comandos: `cd` entra numa pasta, `ls` lista o conteúdo (no Windows, `dir`), `mkdir` cria uma pasta e `pwd` mostra onde você está. Com esses quatro você já navega por qualquer projeto.\n\nNão precisa decorar dezenas de comandos. A fluência vem do uso: abra o terminal, navegue até uma pasta sua, crie outra, entre nela. Você domina este passo quando chega em qualquer pasta do computador e monta a estrutura de um projeto sem tocar no mouse; cada etapa seguinte da trilha vai reforçar o hábito.",
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
          description:
            "Salvar versões do código e publicar seus projetos pra mostrar pro mundo.",
          content:
            'Git é um sistema de controle de versão: ele guarda o histórico do seu código em "fotografias" chamadas **commits**. Com isso você volta atrás quando algo quebra, compara o que mudou e trabalha em equipe sem sobrescrever o trabalho dos outros. O **GitHub** é o site onde esses repositórios ficam hospedados na nuvem.\n\nO ciclo do dia a dia tem três passos. `git add` marca quais arquivos entram na próxima fotografia. `git commit -m "mensagem"` tira a fotografia, com uma frase curta dizendo o que mudou. `git push` envia tudo pro GitHub, deixando seu trabalho salvo fora da máquina.\n\nPra full-stack o Git tem um papel extra: ele é o ponto de partida do deploy. As plataformas que colocam seu site e sua API no ar conectam direto no repositório do GitHub e publicam a cada push. Ou seja, dominar o ciclo básico agora paga juros lá na frente.\n\nE tem o lado vitrine: seu GitHub funciona como portfólio pra recrutadores. Cada projeto desta trilha deve terminar publicado lá, com um bom README explicando o que faz.',
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
      id: "frontend",
      title: "Front-end",
      description:
        "A camada visível: estruturar a página, dar comportamento com JavaScript e montar interfaces com um framework.",
      level: "iniciante",
      children: [
        {
          id: "frontend.htmlcss",
          title: "HTML e CSS",
          description:
            "A estrutura e a aparência de toda página web, a base do visual.",
          content:
            "Toda página começa com dois pilares. O **HTML** define a estrutura: títulos, parágrafos, listas, imagens, formulários, botões. É o esqueleto, escrito com tags como `<h1>`, `<p>` e `<button>`. O **CSS** cuida da aparência: cores, espaçamentos, fontes, tamanhos e como tudo se reorganiza em telas grandes ou de celular.\n\nComo full-stack você não precisa virar um especialista em design, mas precisa montar telas que funcionem e não constranjam. Comece pelo HTML bem feito, usando a tag certa pra cada coisa (isso se chama HTML semântico e ajuda acessibilidade e busca). Depois aprenda o suficiente de CSS pra posicionar elementos, com destaque pro **flexbox** e o **grid**, que resolvem a maioria dos layouts.\n\nDois conceitos que economizam frustração desde cedo: o **box model** (todo elemento é uma caixa com conteúdo, borda e margem) e o **responsivo** (a página se adapta ao tamanho da tela). Não decore propriedades; entenda o modelo e consulte a documentação quando precisar. Você vai voltar nesses fundamentos quando o framework entrar em cena.",
          resources: [
            {
              label: "MDN HTML",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML",
              kind: "doc",
            },
            {
              label: "MDN CSS",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS",
              kind: "doc",
            },
          ],
        },
        {
          id: "frontend.javascript",
          title: "JavaScript",
          description:
            "A linguagem que dá vida à página e, mais tarde, também roda no servidor.",
          content:
            "Se HTML é o esqueleto e CSS a aparência, o **JavaScript** é o que dá comportamento: reagir a um clique, validar um formulário, buscar dados de um servidor e atualizar a tela sem recarregar a página. É a linguagem que todo navegador entende, e é por onde a maioria dos full-stacks começa.\n\nTem um motivo estratégico pra investir bem aqui: o mesmo JavaScript também roda no servidor, através do Node.js. Aprender a linguagem uma vez e usá-la nas duas pontas é o caminho mais curto pra ser full-stack de verdade, sem precisar dominar dois idiomas diferentes ao mesmo tempo.\n\nO que estudar primeiro: variáveis (`let`, `const`), tipos (texto, número, booleano), condicionais (`if`), laços, **funções**, e as estruturas de dados do dia a dia, arrays e objetos. Logo em seguida vêm os métodos de array (`map`, `filter`, `reduce`) e o trabalho com **assincronismo** (`async`/`await`), porque buscar dados de um servidor sempre acontece em segundo plano.\n\nNão pule pra um framework antes de estar confortável com isso. Framework é JavaScript organizado de um jeito; sem a base, ele vira mágica que você não controla.",
          resources: [
            {
              label: "javascript.info",
              url: "https://javascript.info",
              kind: "artigo",
            },
            {
              label: "MDN: Funções (JavaScript)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Functions",
              kind: "doc",
            },
          ],
        },
        {
          id: "frontend.react",
          title: "React e componentes",
          description:
            "Montar interfaces dividindo a tela em pedaços reutilizáveis.",
          content:
            "Conforme as telas crescem, escrever tudo em JavaScript puro vira um emaranhado difícil de manter. É aí que entra um **framework de front-end**, e o mais procurado no mercado é o **React**. A ideia central é simples: você quebra a interface em **componentes**, pedaços independentes (um botão, um card, um formulário) que você combina como blocos de montar.\n\nCada componente é uma função que devolve o que deve aparecer na tela, usando uma sintaxe parecida com HTML chamada **JSX**. O ganho é a reutilização: escreveu um componente de card uma vez, usa em dez lugares; mudou ele, mudou em todos.\n\nDois conceitos sustentam o React. **Props** são os dados que um componente recebe de fora, como argumentos de uma função (um card de produto recebe o nome e o preço). **Estado** é a memória interna do componente, o que pode mudar com a interação do usuário (um contador, o texto digitado num campo). Quando o estado muda, o React atualiza a tela sozinho.\n\nComece pelo tutorial oficial e construa interfaces pequenas. O React é a porta de entrada pro front-end moderno e o que mais aparece em vaga de full-stack.",
          resources: [
            {
              label: "React: aprender (documentação oficial)",
              url: "https://react.dev/learn",
              kind: "doc",
            },
          ],
        },
        {
          id: "frontend.estado",
          title: "Estado e eventos",
          description: "Como a tela reage ao usuário e se mantém atualizada.",
          optional: true,
          content:
            "Uma interface viva responde a ações: digitar, clicar, marcar uma caixa. No React, isso se organiza em torno de duas ideias que vale aprofundar antes de partir pro back-end.\n\nA primeira são os **eventos**. Você liga uma função a uma ação do usuário, como `onClick` num botão ou `onChange` num campo de texto. Quando o usuário age, sua função roda. É assim que um formulário captura o que foi digitado e um botão dispara uma busca.\n\nA segunda é o **estado**, que você gerencia com o `useState`. Pense num campo de busca: cada letra digitada atualiza o estado, e o React redesenha a tela mostrando o valor novo. A regra de ouro é não alterar variáveis na mão pra mexer na tela; você muda o estado e deixa o React cuidar de redesenhar.\n\nEsses dois conceitos preparam o terreno pra parte mais importante pro full-stack: buscar dados de uma API e exibi-los. Quando o usuário abre uma tela, você dispara a requisição, guarda a resposta no estado e a tela se monta com os dados reais. Tudo isso reaparece na seção de integração, agora com o back-end do outro lado.",
          resources: [
            {
              label: "React: useState (referência oficial)",
              url: "https://react.dev/reference/react/useState",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "backend",
      title: "Back-end",
      description:
        "O lado do servidor: escolher a linguagem, subir um servidor web e expor uma API que o front consome.",
      level: "intermediario",
      children: [
        {
          id: "backend.linguagem",
          title: "Escolher a linguagem do servidor",
          description:
            "Onde escrever a lógica que roda no servidor, e por que Node.js é o atalho natural.",
          content:
            "No back-end você precisa de uma linguagem que rode no servidor. Existem várias boas opções (Python, Java, Go, C#), mas pra quem está vindo do front-end há um atalho claro: o **Node.js**, que permite rodar **JavaScript** fora do navegador, no servidor. A vantagem é direta: você usa a mesma linguagem que já aprendeu no front, em vez de começar um idioma novo do zero.\n\nO Node vem com o **npm**, o gerenciador de pacotes que instala bibliotecas (incluindo o framework de servidor que você vai usar) e organiza as dependências do projeto no arquivo `package.json`. É o equivalente, no servidor, do que você já viu montando o projeto de front.\n\nNada impede um full-stack de usar outra linguagem no back, e em muitas empresas a stack já está definida. Mas pra esta trilha, manter JavaScript nos dois lados reduz o atrito e te deixa focar no que é realmente novo: pensar como servidor. Se a empresa onde você quer trabalhar usa outra linguagem, dá pra migrar depois; os conceitos de servidor, API e banco são os mesmos em qualquer uma.",
          resources: [
            {
              label: "Node.js (download oficial)",
              url: "https://nodejs.org/pt/download",
              kind: "doc",
            },
          ],
        },
        {
          id: "backend.servidor",
          title: "Servidor web e rotas",
          description:
            "Subir um processo que escuta requisições e responde por endereço.",
          content:
            'Um **servidor web** é um programa que fica ligado escutando requisições numa porta e respondendo a cada uma. No Node, em vez de fazer isso na mão, você usa um framework que cuida do trabalho repetitivo. O mais tradicional e fácil de começar é o **Express**.\n\nA peça central é a **rota**: a combinação de um método HTTP com um caminho. `GET /produtos` lista produtos, `POST /usuarios` cria um usuário. Você registra cada rota com uma função que recebe a requisição (`req`) e monta a resposta (`res`):\n\n```js\napp.get("/produtos/:id", (req, res) => {\n  res.json({ id: req.params.id });\n});\n```\n\nÉ aqui que a teoria de HTTP do passo Como a web funciona vira código de verdade: o método e o caminho que você estudou lá viram a assinatura da rota aqui.\n\nDois conceitos aparecem cedo. Os **parâmetros**, como o `42` em `GET /produtos/42`, dizem qual recurso específico foi pedido. E o **middleware**, funções que rodam antes das rotas e tratam coisas transversais: ler o corpo JSON da requisição, registrar logs, verificar se o usuário está logado.\n\nO objetivo desta etapa é conseguir subir um servidor local, criar algumas rotas e testá-las (pelo navegador pra GET, ou por uma ferramenta de requisições pros outros métodos). Quando você vê sua própria rota respondendo, o back-end deixa de ser abstrato.',
          resources: [
            {
              label: "Express (documentação em português)",
              url: "https://expressjs.com/pt-br/",
              kind: "doc",
            },
            {
              label: "Express: roteamento",
              url: "https://expressjs.com/pt-br/guide/routing.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "backend.api",
          title: "Construir uma API REST",
          description:
            "Organizar as rotas num contrato previsível que o front-end consome.",
          content:
            "Quando você organiza suas rotas seguindo um padrão, tem uma **API REST**. A ideia é tratar tudo como **recursos** (usuários, produtos, pedidos) e usar os métodos HTTP pras operações sobre eles. Pra um recurso de tarefas, o conjunto típico é: `GET /tarefas` (listar), `GET /tarefas/1` (buscar uma), `POST /tarefas` (criar), `PUT /tarefas/1` (atualizar) e `DELETE /tarefas/1` (apagar). Esse conjunto de operações se chama **CRUD**.\n\nOs dados trafegam em **JSON**, o mesmo formato que o front-end entende. O servidor lê o JSON que chega no corpo da requisição, faz o que precisa e responde com JSON e o código de status apropriado: 200 ou 201 quando dá certo, 404 quando o recurso não existe, 400 quando o pedido veio errado.\n\nO que faz uma API ser boa é a **previsibilidade**: endereços consistentes, status corretos, respostas no mesmo formato. Isso importa especialmente pro full-stack, porque é você que vai consumir essa API do outro lado, no front. Uma API bem desenhada hoje é menos dor de cabeça na integração depois. Esse contrato é o coração do trabalho de back-end e o que conecta as duas metades da sua aplicação.",
          resources: [
            {
              label: "MDN REST (glossário)",
              url: "https://developer.mozilla.org/pt-BR/docs/Glossary/REST",
              kind: "doc",
            },
          ],
        },
        {
          id: "backend.validacao",
          title: "Validação e tratamento de erros",
          description:
            "Conferir o que chega de fora e responder com clareza quando algo dá errado.",
          optional: true,
          content:
            "Tudo que chega do front-end é suspeito até prova em contrário. O usuário pode digitar errado, deixar campo vazio ou alguém mal-intencionado pode mandar dados estranhos de propósito. A regra é firme: **valide no servidor**, mesmo que o front já valide. A validação do front melhora a experiência; só a do back garante a integridade dos dados.\n\nEm vez de escrever um monte de `if` na mão, o caminho moderno no Node é uma biblioteca de validação como o **Zod**, onde você declara o formato esperado (este campo é texto obrigatório, este é número positivo) e ela confere por você, devolvendo um erro claro quando algo não bate.\n\nO outro lado da mesma moeda é o **tratamento de erros**. Quando algo falha (dado inválido, recurso não encontrado, banco fora do ar), a API precisa responder com o status certo e uma mensagem útil, sem derrubar o servidor inteiro nem vazar detalhes internos. Um bom hábito é centralizar isso num único tratador de erros, em vez de espalhar a lógica por todas as rotas.\n\nÉ opcional nesta fase, mas é o que separa uma API de brinquedo de uma confiável, e o front-end agradece quando recebe erros previsíveis em vez de respostas quebradas.",
          resources: [
            {
              label: "Zod (documentação oficial)",
              url: "https://zod.dev",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "bancodedados",
      title: "Banco de dados",
      description:
        "Onde os dados vivem de verdade: modelar, consultar e ligar o banco à sua API.",
      level: "intermediario",
      children: [
        {
          id: "bancodedados.sql",
          title: "SQL e bancos relacionais",
          description:
            "Guardar dados em tabelas e consultá-los com a linguagem padrão do setor.",
          content:
            "Até aqui os dados sumiam quando o servidor reiniciava. O **banco de dados** resolve isso: ele guarda a informação de forma permanente. O tipo mais comum é o **relacional**, que organiza tudo em **tabelas** com linhas e colunas, parecido com uma planilha bem estruturada. Uma tabela de usuários tem colunas como id, nome e email; cada usuário é uma linha.\n\nA linguagem pra conversar com esses bancos é o **SQL**, e ela é surpreendentemente legível. `SELECT nome FROM usuarios WHERE id = 1` busca o nome do usuário 1. `INSERT` adiciona uma linha, `UPDATE` altera, `DELETE` remove. Repare que isso espelha o CRUD da sua API: cada operação da API geralmente vira uma operação no banco.\n\nUm banco gratuito, robusto e muito usado no mercado é o **PostgreSQL**, ótima escolha pra aprender e pra produção. Comece instalando ele, criando uma tabela simples e rodando consultas na mão pra sentir como funciona.\n\nNão precisa dominar SQL avançado agora. O essencial é entender tabelas, os quatro comandos básicos e como filtrar resultados com `WHERE`. Você domina este passo quando cria uma tabela, insere algumas linhas e consulta exatamente o recorte que quer sem consultar a sintaxe. Esse é o conhecimento que liga sua API a dados que sobrevivem a reinícios.",
          resources: [
            {
              label: "PostgreSQL: tutorial de SQL (oficial)",
              url: "https://www.postgresql.org/docs/current/tutorial-sql.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "bancodedados.modelagem",
          title: "Modelar os dados",
          description:
            "Decidir quais tabelas existem e como elas se relacionam.",
          content:
            "Antes de criar tabelas no improviso, vale pensar na **modelagem**: quais entidades sua aplicação tem e como elas se conectam. Num app de tarefas, você tem usuários e tarefas. Cada tarefa pertence a um usuário. Essa frase simples já define a estrutura.\n\nA peça que liga tabelas é a **chave estrangeira**: a tabela de tarefas guarda o id do usuário dono, criando uma relação entre as duas. Esse é o tipo mais comum, o **um pra muitos** (um usuário tem muitas tarefas). Existem outros (muitos pra muitos, por exemplo, resolvido com uma tabela no meio), mas comece pelo um pra muitos, que cobre a maioria dos casos de um primeiro projeto.\n\nDuas decisões aparecem sempre. Quais colunas cada tabela precisa, com o tipo certo (texto, número, data, booleano). E quais regras o banco deve garantir: campo obrigatório, valor único (dois usuários não podem ter o mesmo email), valor padrão.\n\nModelar bem cedo evita retrabalho doloroso depois, quando já existem dados de verdade. Não precisa acertar de primeira nem prever tudo; precisa ter um modelo claro o suficiente pra construir as primeiras telas e ajustar conforme o projeto cresce.",
          resources: [
            {
              label: "PostgreSQL: tutorial (oficial)",
              url: "https://www.postgresql.org/docs/current/tutorial.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "bancodedados.conectar",
          title: "Conectar a API ao banco",
          description: "Fazer as rotas lerem e gravarem dados de verdade.",
          content:
            "Agora as duas pontas do back-end se juntam: cada rota da sua API passa a ler ou gravar no banco em vez de usar dados de mentira na memória. `GET /tarefas` faz um `SELECT`, `POST /tarefas` faz um `INSERT`, e assim por diante.\n\nDá pra escrever SQL direto no código, mas a maioria dos projetos modernos usa uma camada de tradução entre a linguagem e o banco. No mundo Node, uma opção popular e amigável pra iniciantes é o **Prisma**: você descreve suas tabelas num arquivo de modelo e ele te dá funções prontas e seguras pra consultar, sem montar strings de SQL na mão. Isso reduz erros e deixa o código mais legível.\n\nDois cuidados desde o começo. As **credenciais** de acesso ao banco (usuário, senha, endereço) nunca ficam escritas no código; elas vão pra variáveis de ambiente, assunto que volta no deploy. E toda entrada de usuário que chega numa consulta precisa ser tratada com parâmetros, nunca grudada na string da query, pra evitar um ataque clássico chamado injeção de SQL. As bibliotecas como o Prisma já cuidam disso por você quando usadas do jeito certo.\n\nQuando a primeira rota grava algo que continua lá depois de reiniciar o servidor, seu back-end está completo de ponta a ponta.",
          resources: [
            {
              label: "Prisma (documentação oficial)",
              url: "https://www.prisma.io/docs",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "integracao",
      title: "Ligando as pontas",
      description:
        "O que define o full-stack: fazer o front-end conversar com o back-end e proteger esse caminho.",
      level: "intermediario",
      children: [
        {
          id: "integracao.consumir",
          title: "Front-end consumindo a API",
          description: "Buscar dados do servidor e exibi-los na tela.",
          content:
            "Esta é a costura que torna você full-stack de verdade: o front-end deixa de inventar dados e passa a buscá-los na API que você montou em Construir uma API REST. O navegador tem a função `fetch` pra disparar requisições HTTP, e como elas demoram (vão até o servidor e voltam), você usa `async`/`await` pra esperar a resposta sem travar a tela.\n\nO fluxo típico no React: quando a tela abre, você dispara o `fetch` pra `GET /tarefas`, recebe a lista em JSON e guarda no **estado**, o mesmo `useState` do passo Estado e eventos, e a tela se remonta com os dados reais.\n\nUm detalhe que todo iniciante esquece: a vida real tem três estados, não um.\n\n```js\nconst [dados, setDados] = useState(null);\nconst [erro, setErro] = useState(null);\n// carregando = dados null e sem erro\n```\n\n**Carregando** (a resposta ainda não chegou, mostre um indicador), **erro** (deu 404, 500 ou a rede caiu, mostre uma mensagem) e **sucesso** (mostre os dados). Tratar os três separa uma tela que parece travada de uma que comunica o que está acontecendo.\n\nConforme o app cresce, bibliotecas como o **TanStack Query** cuidam de cache, recarga e desses estados pra você. Comece no `fetch` na mão pra entender o mecanismo, e adote uma biblioteca quando a repetição incomodar. Você domina este passo quando sua tela mostra o carregando, trata o erro e exibe os dados, sem nunca ficar em branco esperando.",
          resources: [
            {
              label: "TanStack Query (documentação oficial)",
              url: "https://tanstack.com/query/latest",
              kind: "doc",
            },
          ],
        },
        {
          id: "integracao.cors",
          title: "CORS",
          description:
            "Por que o navegador bloqueia chamadas entre origens diferentes e como liberar.",
          content:
            "Cedo ou tarde você verá um erro de **CORS** no console, e ele confunde todo iniciante. Acontece porque, em desenvolvimento, seu front-end roda num endereço (por exemplo, localhost na porta 3000) e sua API em outro (a porta 3100). Pro navegador, são **origens diferentes**, e por segurança ele bloqueia que um site chame livremente um servidor de outra origem.\n\nCORS é o mecanismo que resolve isso. O servidor declara, em cabeçalhos da resposta HTTP, quais origens têm permissão pra chamá-lo. Quando o navegador vê que sua origem está autorizada, libera a requisição. Repare que a configuração fica no **back-end**, não no front: é o servidor que diz quem pode acessá-lo.\n\nNa prática, no Express você adiciona um middleware de CORS e informa as origens permitidas. Em desenvolvimento, costuma ser o endereço local do seu front; em produção, o domínio real do site publicado, que você vai cadastrar aqui no passo Deploy do front-end.\n\nO erro de CORS não é um bug do seu código de busca; é o navegador fazendo o trabalho dele. Entender isso economiza horas de procurar no lugar errado. Como full-stack, esse é exatamente o tipo de problema que mora na fronteira entre as duas pontas e que só quem enxerga os dois lados resolve rápido.",
          resources: [
            {
              label: "MDN CORS",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CORS",
              kind: "doc",
            },
          ],
        },
        {
          id: "integracao.auth",
          title: "Autenticação com JWT",
          description:
            "Saber quem é o usuário e proteger as rotas que exigem login.",
          content:
            "Quase todo app real precisa de login. **Autenticação** é provar quem o usuário é; **autorização** é decidir o que ele pode fazer. O fluxo básico: o usuário manda email e senha, o servidor confere e, se bater, devolve um **token** que identifica aquele usuário nas próximas requisições.\n\nO formato de token mais comum em APIs é o **JWT** (JSON Web Token), um texto assinado pelo servidor que carrega informações como o id do usuário. A cada requisição protegida, o front envia esse token num cabeçalho, e o back confere a assinatura pra confirmar que é legítimo. Como ele é assinado, o servidor detecta se alguém tentar adulterá-lo.\n\nDois cuidados inegociáveis. Senha **nunca** é guardada como texto puro no banco; ela passa por um algoritmo de hash (como o bcrypt) que a transforma em algo irreversível, e você compara hashes no login. E o segredo usado pra assinar os tokens é uma variável de ambiente, jamais escrita no código.\n\nNo back, você cria um middleware que checa o token e barra com 401 quem não estiver autenticado. No front, você guarda o token após o login e o anexa nas requisições. É um tema que toca as duas pontas ao mesmo tempo, território natural do full-stack.",
          resources: [
            {
              label: "JWT: introdução",
              url: "https://jwt.io/introduction",
              kind: "artigo",
            },
            {
              label: "jsonwebtoken (pacote npm)",
              url: "https://www.npmjs.com/package/jsonwebtoken",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "projeto",
      title: "Projeto full-stack",
      description:
        "Juntar tudo num app de ponta a ponta: o que melhor prova que você é full-stack.",
      level: "avancado",
      children: [
        {
          id: "projeto.estrutura",
          title: "Organizar o repositório",
          description:
            "Como arrumar as pastas do front e do back num projeto só.",
          content:
            "Antes de construir, decida como organizar o código. Há dois jeitos comuns. No primeiro, front-end e back-end ficam em **repositórios separados**, cada um com sua vida própria. No segundo, os dois vivem no mesmo repositório, em pastas distintas (algo como `client/` e `server/`), o que costuma se chamar **monorepo**.\n\nPra um primeiro projeto de portfólio, manter tudo num repositório só costuma ser mais simples: um único lugar pra clonar, um histórico de commits que conta a história inteira da feature, do banco à tela. A separação por repositórios faz mais sentido quando times diferentes cuidam de cada lado.\n\nIndependente da escolha, três hábitos ajudam. Mantenha uma divisão clara entre o código de front e o de back, sem misturar responsabilidades. Tenha um arquivo de exemplo de variáveis de ambiente (sem os valores reais) pra quem for rodar o projeto saber o que configurar. E escreva um **README** explicando o que o app faz, como rodar localmente e quais tecnologias usou.\n\nEssa organização não é firula: é o que torna seu projeto compreensível pra um recrutador que abre o repositório por dois minutos, e pra você mesmo daqui a três meses.",
        },
        {
          id: "projeto.app",
          title: "Construir o app completo",
          description:
            "Aplicar front, back, banco e autenticação numa coisa só.",
          content:
            "Olhe pra trás um instante: você começou esta trilha sem saber o que era cliente e servidor, e agora tem HTML e React na tela, uma API REST com banco e login no servidor, e a costura de CORS e JWT ligando as duas pontas. Este passo junta tudo numa entrega só, a que melhor prova que você é full-stack.\n\nA encomenda é o app do projeto abaixo: uma aplicação com login onde cada usuário cria, vê e gerencia os próprios dados, do banco até a tela. Escolha um domínio que te interesse (agenda de estudos, controle de leituras, lista de tarefas com contas), porque você vai passar horas nele. Um caminho que funciona: modele os dados e crie o banco, construa a API com CRUD e autenticação, e monte o front consumindo essa API, com as telas de login, listagem e cadastro.\n\nCuide dos detalhes que separam protótipo de produto: os três estados de carregando, erro e sucesso, validação nas duas pontas e mensagens claras. Não precisa ser grande; um app pequeno e completo vale muito mais no portfólio que um grande pela metade.\n\nO critério de chegada é objetivo: o app respondendo numa URL pública, os dados persistindo entre reinícios, o login protegendo o que é de cada usuário, e o repositório no GitHub com um README que ensina a rodar. É este projeto que vira a peça central do seu portfólio full-stack, e o passo seguinte cerca ele de testes antes de ir ao ar.",
          project: "app-fullstack-estudos",
          resources: [
            {
              label: "MDN REST (glossário)",
              url: "https://developer.mozilla.org/pt-BR/docs/Glossary/REST",
              kind: "doc",
            },
          ],
        },
        {
          id: "projeto.testes",
          title: "Testar a aplicação",
          description:
            "A rede de segurança que deixa você mudar o app sem medo de quebrar o que já funciona.",
          content:
            "Seu app funciona hoje. A pergunta que separa protótipo de produto é outra: você consegue mudá-lo amanhã sem quebrar o que já funciona? **Teste automatizado** é código que executa o seu código e confere o resultado, e é ele que dá essa confiança. Rodou verde, pode publicar; vermelho, você descobre o problema antes do usuário.\n\nNum app full-stack, três camadas cobrem o essencial, e a **pirâmide de testes** organiza o esforço: muitos testes baratos e rápidos na base, poucos e caros no topo.\n\n- **Regra de negócio no servidor**: teste unitário das funções que decidem, como calcular um total ou barrar um acesso, sem subir banco nem servidor. É a base larga da pirâmide.\n- **Componente crítico no client**: um teste que renderiza o componente, simula a interação (digitou, clicou) e confere que a tela reagiu. Cobre as partes que doem se quebrarem.\n- **Um caminho de ponta a ponta**: um teste que abre o app de verdade no navegador, faz login e completa o fluxo principal, provando que as duas pontas conversam.\n\nComo sua stack é JavaScript nos dois lados, a mesma ferramenta serve pras duas primeiras camadas: o **Vitest** roda os testes de servidor e, com a **React Testing Library**, os de componente. Pro fluxo de ponta a ponta, o **Playwright** dirige o navegador. Comece pequeno: um teste da regra de negócio mais importante e um do login já mudam sua relação com o deploy. Você domina este passo quando um único comando roda a suíte inteira e o verde te dá coragem de publicar.",
          resources: [
            {
              label: "Vitest (documentação oficial)",
              url: "https://vitest.dev",
              kind: "doc",
            },
            {
              label: "Testing Library (documentação oficial)",
              url: "https://testing-library.com/docs/",
              kind: "doc",
            },
            {
              label: "Playwright (documentação oficial)",
              url: "https://playwright.dev/docs/intro",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "deploy",
      title: "Colocar no ar",
      description:
        "A reta final: publicar o front e o back, configurar por ambiente e acompanhar em produção.",
      level: "avancado",
      children: [
        {
          id: "deploy.env",
          title: "Variáveis de ambiente",
          description:
            "O mesmo código rodando com configurações diferentes em dev e produção.",
          content:
            "Antes de publicar, resolva uma questão que pega todo full-stack: o que muda entre a sua máquina e o servidor não é o código, é a **configuração**. Na sua máquina o banco está em localhost; em produção, num endereço gerenciado. As origens liberadas no CORS são diferentes. O segredo dos tokens é outro. Tudo isso vira **variável de ambiente**, lida pelo app na inicialização.\n\nA convenção é guardar esses valores num arquivo `.env` durante o desenvolvimento. Regra de ouro: esse arquivo **não sobe pro repositório** nem pro servidor (adicione-o ao `.gitignore`), porque costuma conter segredos. As plataformas de hospedagem têm um painel onde você cadastra os valores de produção, e elas os injetam no processo.\n\nIsso vale pras duas pontas. O back-end lê a URL do banco e o segredo dos tokens; o front-end, na hora do build, lê o endereço da API que vai consumir (em desenvolvimento, o localhost; em produção, a URL pública do back).\n\nDois hábitos que evitam sustos: centralize a leitura das variáveis num único lugar, em vez de espalhar pelo código; e valide na inicialização, fazendo o app recusar a subir com uma mensagem clara se faltar algo obrigatório, em vez de quebrar no primeiro acesso.",
          resources: [
            {
              label: "The Twelve-Factor App: configurações",
              url: "https://12factor.net/pt_br/config",
              kind: "artigo",
            },
          ],
        },
        {
          id: "deploy.backend",
          title: "Deploy do back-end e do banco",
          description: "Subir a API e o banco gerenciado, com URL pública.",
          content:
            "Comece pelo back-end, porque o front vai precisar do endereço dele. O banco vem junto: em produção ele não pode rodar na sua máquina, então você usa um **banco gerenciado**, contratado como serviço, onde a plataforma cuida de instalação, atualizações e **backups**, e te entrega só uma URL de conexão.\n\nPra publicar a API, plataformas como **Railway** e **Render** tornaram o processo acessível: você conecta seu repositório do GitHub, a plataforma detecta a linguagem, instala as dependências, roda o comando de start e entrega uma URL pública. Várias delas oferecem Postgres gerenciado a um clique, o que simplifica tudo: API e banco no mesmo lugar. A partir daí, cada push na branch principal redeploya sozinho.\n\nDois ajustes que pegam todo mundo no primeiro deploy. A **porta**: a plataforma define em qual porta o app deve escutar via variável de ambiente (`PORT`); código com porta fixa não sobe. E as **variáveis de ambiente**: cadastre no painel a URL do banco gerenciado, o segredo dos tokens e as origens de CORS (que agora incluem o domínio do seu front publicado).\n\nNão esqueça de rodar as migrations apontando pro banco de produção. Quando a URL da API responder de outro dispositivo, metade do deploy está feita.",
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
          id: "deploy.frontend",
          title: "Deploy do front-end",
          description:
            "Publicar a interface e apontá-la pra API que já está no ar.",
          content:
            "Com a API publicada, falta o front-end. Aplicações React modernas passam por um **build**: uma ferramenta junta seu código em arquivos otimizados, prontos pra servir. Plataformas como a **Vercel** são feitas pra isso: você conecta o repositório, ela detecta o framework, roda o build e entrega o site numa URL pública, com redeploy automático a cada push.\n\nO ponto que conecta as duas pontas é a configuração do endereço da API. No desenvolvimento, seu front apontava pro localhost do back; em produção, ele precisa apontar pra URL pública da API que você acabou de publicar. Esse endereço entra como variável de ambiente no painel da plataforma de front, e é lido na hora do build.\n\nFeche o ciclo do CORS: lá no back-end, garanta que o domínio do front publicado está na lista de origens permitidas, senão o navegador vai bloquear as chamadas mesmo com tudo no ar. Esse é o erro número um do primeiro deploy full-stack, e agora você sabe exatamente onde olhar.\n\nQuando você abre a URL do site, ele carrega, busca dados da sua API e mostra tudo funcionando, sua aplicação está completa e pública. Poucas sensações na carreira batem o primeiro deploy de ponta a ponta.",
          resources: [
            {
              label: "Vercel (documentação)",
              url: "https://vercel.com/docs",
              kind: "doc",
            },
          ],
        },
        {
          id: "deploy.monitor",
          title: "Logs e acompanhamento",
          description:
            "Enxergar o que a aplicação faz em produção e descobrir problemas cedo.",
          optional: true,
          content:
            "Com tudo no ar, surge a pergunta que define operação: **está funcionando agora?** Sem visibilidade, a resposta vem do pior jeito, um usuário reclamando. Acompanhar é descobrir antes.\n\nA primeira ferramenta são os **logs**. As plataformas de deploy capturam tudo que sua aplicação escreve na saída padrão e mostram num painel com busca. Deploy quebrou ou uma rota deu 500? O painel de logs do back-end é o primeiro lugar a olhar. Vale registrar cada requisição (método, rota, status) e todo erro inesperado com contexto. E a regra do que **não** logar: senha, token e dado pessoal sensível, porque log vaza com facilidade.\n\nUma peça simples e útil no back é o **health check**: uma rota como `GET /health` que responde 200 quando o serviço está de pé. Plataformas e serviços de monitoramento usam essa rota pra saber se a aplicação continua respondendo.\n\nDo lado do front, o console do navegador é seu aliado: erros de CORS, falhas de requisição e problemas de configuração aparecem lá primeiro. Depois de cada deploy, faça o ritual de abrir o site, navegar pelos fluxos principais e conferir os logs das duas pontas. É opcional pra um projeto de portfólio, mas é o hábito que diferencia quem só publica de quem mantém.",
          resources: [
            {
              label: "The Twelve-Factor App: logs",
              url: "https://12factor.net/pt_br/logs",
              kind: "artigo",
            },
          ],
        },
      ],
    },
  ],
};
