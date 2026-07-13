// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool fullstack). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "fullstack",
  "questions": [
    {
      "id": "fullstack-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo uma aplicação e precisa implementar uma funcionalidade que envolve tanto a interface do usuário quanto a lógica do servidor. O que você deve fazer?",
      "alternativas": {
        "a": "Desenvolver a interface e passar a lógica para outro desenvolvedor.",
        "b": "Criar a tela de cadastro e implementar a validação no servidor.",
        "c": "Focar apenas na parte do servidor, já que é mais complexa.",
        "d": "Implementar a lógica no front-end para evitar problemas com o servidor."
      },
      "correta": "b",
      "explicacao": "A alternativa correta é desenvolver a tela de cadastro e implementar a validação no servidor, pois um dev full-stack deve trabalhar em ambas as partes da aplicação.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "fullstack-ini-02",
      "nivel": "iniciante",
      "pergunta": "Ao abrir um site, o navegador envia uma requisição para um servidor. Qual é o papel do servidor nesse processo?",
      "alternativas": {
        "a": "Ele apenas armazena os dados e não faz nada com as requisições.",
        "b": "Ele processa a requisição e devolve uma resposta ao cliente.",
        "c": "Ele ignora as requisições e espera que o cliente faça tudo.",
        "d": "Ele apenas redireciona as requisições para outros servidores."
      },
      "correta": "b",
      "explicacao": "O servidor processa a requisição e devolve uma resposta ao cliente, que é a função principal dele na comunicação com o navegador.",
      "fonte": "fundamentos.web"
    },
    {
      "id": "fullstack-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você precisa verificar o que há dentro de uma pasta no seu projeto usando o terminal. Qual comando você deve usar?",
      "alternativas": {
        "a": "cd",
        "b": "ls",
        "c": "mkdir",
        "d": "pwd"
      },
      "correta": "b",
      "explicacao": "O comando 'ls' lista o conteúdo da pasta atual no terminal, permitindo que você veja o que está lá.",
      "fonte": "fundamentos.terminal"
    },
    {
      "id": "fullstack-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você deseja salvar as alterações feitas em um arquivo no Git. Qual é o primeiro passo que você deve realizar?",
      "alternativas": {
        "a": "git commit -m \"mensagem\"",
        "b": "git push",
        "c": "git add",
        "d": "git status"
      },
      "correta": "c",
      "explicacao": "O primeiro passo é usar 'git add' para marcar quais arquivos serão incluídos no próximo commit.",
      "fonte": "fundamentos.git"
    },
    {
      "id": "fullstack-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo um sistema que precisa se comunicar com um servidor. Qual método HTTP você deve usar para criar novos dados?",
      "alternativas": {
        "a": "GET",
        "b": "POST",
        "c": "PUT",
        "d": "DELETE"
      },
      "correta": "b",
      "explicacao": "O método POST é utilizado para criar novos dados no servidor, enquanto os outros métodos têm funções diferentes.",
      "fonte": "fundamentos.web"
    },
    {
      "id": "fullstack-ini-06",
      "nivel": "iniciante",
      "pergunta": "Ao usar o terminal, você quer saber em qual diretório está atualmente. Qual comando você deve usar?",
      "alternativas": {
        "a": "ls",
        "b": "cd",
        "c": "mkdir",
        "d": "pwd"
      },
      "correta": "d",
      "explicacao": "O comando 'pwd' mostra o caminho do diretório atual em que você está no terminal.",
      "fonte": "fundamentos.terminal"
    },
    {
      "id": "fullstack-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você fez algumas alterações no seu código e agora deseja enviar essas alterações para o GitHub. Qual comando você deve usar após fazer o commit?",
      "alternativas": {
        "a": "git add",
        "b": "git push",
        "c": "git commit -m \"mensagem\"",
        "d": "git clone"
      },
      "correta": "b",
      "explicacao": "Após fazer o commit, você deve usar 'git push' para enviar suas alterações para o repositório no GitHub.",
      "fonte": "fundamentos.git"
    },
    {
      "id": "fullstack-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você está criando uma aplicação web e precisa entender como os dados fluem entre o cliente e o servidor. O que é essencial saber sobre esse processo?",
      "alternativas": {
        "a": "O cliente nunca se comunica com o servidor.",
        "b": "A comunicação é feita através de requisições e respostas.",
        "c": "O servidor não precisa responder ao cliente.",
        "d": "A comunicação é feita apenas uma vez por sessão."
      },
      "correta": "b",
      "explicacao": "É essencial saber que a comunicação entre cliente e servidor é feita através de requisições e respostas, o que é fundamental para o desenvolvimento web.",
      "fonte": "fundamentos.web"
    },
    {
      "id": "fullstack-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você está criando um formulário em HTML e precisa garantir que os campos sejam facilmente compreensíveis. Qual tag você deve usar para o título do formulário?",
      "alternativas": {
        "a": "<h2>",
        "b": "<p>",
        "c": "<button>",
        "d": "<div>"
      },
      "correta": "a",
      "explicacao": "A tag <h2> é semântica e adequada para títulos, facilitando a compreensão da estrutura do formulário.",
      "fonte": "frontend.htmlcss"
    },
    {
      "id": "fullstack-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo uma página responsiva e precisa garantir que os elementos se ajustem ao tamanho da tela. Qual técnica você deve priorizar?",
      "alternativas": {
        "a": "Usar apenas pixels para definir tamanhos",
        "b": "Utilizar o box model para espaçamento",
        "c": "Definir tamanhos fixos para cada elemento",
        "d": "Usar media queries para ajustar o layout"
      },
      "correta": "d",
      "explicacao": "Media queries permitem que você ajuste o layout com base no tamanho da tela, garantindo uma experiência responsiva.",
      "fonte": "frontend.htmlcss"
    },
    {
      "id": "fullstack-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você está implementando uma função em JavaScript para validar um formulário. Qual estrutura você deve usar para verificar se um campo está vazio?",
      "alternativas": {
        "a": "if (campo == '')",
        "b": "if (campo != null)",
        "c": "if (campo.length > 0)",
        "d": "if (campo === undefined)"
      },
      "correta": "a",
      "explicacao": "A condição if (campo == '') verifica corretamente se o campo está vazio, que é o que se deseja na validação.",
      "fonte": "frontend.javascript"
    },
    {
      "id": "fullstack-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você precisa criar um botão que, ao ser clicado, deve executar uma função em seu aplicativo React. Qual atributo você deve usar para vincular a função ao botão?",
      "alternativas": {
        "a": "onMouseOver",
        "b": "onClick",
        "c": "onChange",
        "d": "onFocus"
      },
      "correta": "b",
      "explicacao": "O atributo onClick é usado para associar uma função a um evento de clique em um botão no React.",
      "fonte": "frontend.estado"
    },
    {
      "id": "fullstack-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo um componente em React e precisa passar dados para ele. Qual recurso você deve usar para enviar esses dados?",
      "alternativas": {
        "a": "Props",
        "b": "State",
        "c": "Context",
        "d": "Refs"
      },
      "correta": "a",
      "explicacao": "Props são os dados que um componente recebe de fora, permitindo a personalização e reutilização do componente.",
      "fonte": "frontend.react"
    },
    {
      "id": "fullstack-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você está criando um campo de busca em React e deseja que a tela atualize conforme o usuário digita. Qual abordagem você deve usar?",
      "alternativas": {
        "a": "Alterar diretamente a variável do campo",
        "b": "Usar o useState para gerenciar o valor",
        "c": "Criar uma função que não atualiza o estado",
        "d": "Ignorar a atualização da tela"
      },
      "correta": "b",
      "explicacao": "Usar o useState permite que você gerencie o valor do campo e atualize a tela de forma eficiente.",
      "fonte": "frontend.estado"
    },
    {
      "id": "fullstack-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você precisa organizar a estrutura de um layout complexo em CSS. Qual método você deve usar para facilitar o posicionamento dos elementos?",
      "alternativas": {
        "a": "Utilizar apenas floats",
        "b": "Usar flexbox ou grid",
        "c": "Definir todos os elementos com display: inline",
        "d": "Aplicar margens negativas a todos os elementos"
      },
      "correta": "b",
      "explicacao": "Flexbox e grid são métodos modernos que facilitam o posicionamento e a organização de layouts complexos.",
      "fonte": "frontend.htmlcss"
    },
    {
      "id": "fullstack-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está criando um servidor com Node.js e precisa escutar requisições. Qual framework você deve usar para facilitar esse processo?",
      "alternativas": {
        "a": "Koa",
        "b": "Express",
        "c": "Hapi",
        "d": "NestJS"
      },
      "correta": "b",
      "explicacao": "O Express é o framework mais tradicional e fácil de começar para criar servidores com Node.js, facilitando o gerenciamento de rotas e requisições.",
      "fonte": "backend.servidor"
    },
    {
      "id": "fullstack-int-02",
      "nivel": "intermediario",
      "pergunta": "Ao desenvolver uma API REST, você precisa garantir que a resposta para um recurso não encontrado seja clara. Qual status HTTP você deve retornar nesse caso?",
      "alternativas": {
        "a": "200",
        "b": "404",
        "c": "400",
        "d": "500"
      },
      "correta": "b",
      "explicacao": "O status 404 indica que o recurso solicitado não foi encontrado, sendo a resposta adequada para essa situação.",
      "fonte": "backend.api"
    },
    {
      "id": "fullstack-int-03",
      "nivel": "intermediario",
      "pergunta": "Você está implementando validação no servidor usando a biblioteca Zod. Qual é a principal vantagem de usar essa biblioteca em vez de escrever validações manuais?",
      "alternativas": {
        "a": "Ela é mais rápida que validações manuais",
        "b": "Ela reduz a quantidade de código repetido",
        "c": "Ela garante que todos os dados sejam sempre válidos",
        "d": "Ela valida apenas campos obrigatórios"
      },
      "correta": "b",
      "explicacao": "A biblioteca Zod permite declarar o formato esperado dos dados, reduzindo a quantidade de código repetido e tornando a validação mais clara e organizada.",
      "fonte": "backend.validacao"
    },
    {
      "id": "fullstack-int-04",
      "nivel": "intermediario",
      "pergunta": "Você precisa criar uma rota para listar todos os produtos em sua API. Qual método HTTP você deve usar?",
      "alternativas": {
        "a": "POST",
        "b": "GET",
        "c": "PUT",
        "d": "DELETE"
      },
      "correta": "b",
      "explicacao": "O método GET é utilizado para listar recursos, como no caso de listar todos os produtos.",
      "fonte": "backend.api"
    },
    {
      "id": "fullstack-int-05",
      "nivel": "intermediario",
      "pergunta": "Ao definir rotas no Express, o que os parâmetros na URL, como em `GET /produtos/:id`, representam?",
      "alternativas": {
        "a": "Um método HTTP",
        "b": "Um tipo de recurso",
        "c": "Um recurso específico",
        "d": "Um status da requisição"
      },
      "correta": "c",
      "explicacao": "Os parâmetros na URL, como `:id`, representam um recurso específico que está sendo solicitado na rota.",
      "fonte": "backend.servidor"
    },
    {
      "id": "fullstack-int-06",
      "nivel": "intermediario",
      "pergunta": "Você implementou um sistema de tratamento de erros na sua API. Qual é a melhor prática ao responder a um erro?",
      "alternativas": {
        "a": "Retornar um erro genérico sem detalhes",
        "b": "Retornar status 500 para todos os erros",
        "c": "Retornar o status apropriado e uma mensagem útil",
        "d": "Ignorar erros e continuar a execução"
      },
      "correta": "c",
      "explicacao": "Retornar o status apropriado e uma mensagem útil ajuda o front-end a entender o que deu errado e a tratar o erro de forma adequada.",
      "fonte": "backend.validacao"
    },
    {
      "id": "fullstack-int-07",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo uma API para um aplicativo de tarefas. Ao modelar o banco de dados, qual é a melhor forma de garantir que cada tarefa esteja sempre associada a um usuário?",
      "alternativas": {
        "a": "Criar uma coluna 'usuario_id' na tabela de tarefas como chave estrangeira.",
        "b": "Adicionar uma coluna 'usuario_id' na tabela de usuários para referenciar as tarefas.",
        "c": "Usar uma tabela intermediária para conectar usuários e tarefas sem chaves estrangeiras.",
        "d": "Criar uma coluna 'tarefa_id' na tabela de usuários para referenciar as tarefas."
      },
      "correta": "a",
      "explicacao": "A coluna 'usuario_id' na tabela de tarefas como chave estrangeira garante que cada tarefa esteja associada a um usuário específico, estabelecendo a relação correta entre as tabelas.",
      "fonte": "bancodedados.modelagem"
    },
    {
      "id": "fullstack-int-08",
      "nivel": "intermediario",
      "pergunta": "Você precisa inserir um novo usuário no banco de dados. Qual comando SQL você deve usar para garantir que o usuário seja adicionado corretamente?",
      "alternativas": {
        "a": "UPDATE usuarios SET nome = 'João' WHERE id = 1;",
        "b": "INSERT INTO usuarios (nome, email) VALUES ('João', 'joao@email.com');",
        "c": "SELECT * FROM usuarios WHERE nome = 'João';",
        "d": "DELETE FROM usuarios WHERE id = 1;"
      },
      "correta": "b",
      "explicacao": "O comando INSERT é o correto para adicionar um novo usuário à tabela, enquanto os outros comandos são para atualizar, consultar ou deletar dados.",
      "fonte": "bancodedados.sql"
    },
    {
      "id": "fullstack-int-09",
      "nivel": "intermediario",
      "pergunta": "Ao conectar sua API ao banco de dados usando Prisma, qual é a prática recomendada para lidar com credenciais de acesso?",
      "alternativas": {
        "a": "Escrever as credenciais diretamente no código-fonte da aplicação.",
        "b": "Armazenar as credenciais em um arquivo de configuração que é versionado no Git.",
        "c": "Utilizar variáveis de ambiente para armazenar as credenciais de forma segura.",
        "d": "Colocar as credenciais em um banco de dados separado para segurança."
      },
      "correta": "c",
      "explicacao": "Utilizar variáveis de ambiente para armazenar credenciais é a prática recomendada, pois evita que informações sensíveis fiquem expostas no código-fonte.",
      "fonte": "bancodedados.conectar"
    },
    {
      "id": "fullstack-int-10",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo uma rota GET para listar as tarefas de um usuário. Qual comando SQL deve ser utilizado para obter as tarefas corretamente?",
      "alternativas": {
        "a": "SELECT * FROM tarefas WHERE usuario_id = ?;",
        "b": "SELECT usuario_id FROM tarefas WHERE id = ?;",
        "c": "INSERT INTO tarefas (usuario_id) VALUES (?);",
        "d": "DELETE FROM tarefas WHERE usuario_id = ?;"
      },
      "correta": "a",
      "explicacao": "O comando SELECT é o apropriado para listar as tarefas de um usuário específico, utilizando o filtro correto pela chave estrangeira 'usuario_id'.",
      "fonte": "bancodedados.conectar"
    },
    {
      "id": "fullstack-int-11",
      "nivel": "intermediario",
      "pergunta": "Você está modelando um banco de dados e precisa garantir que dois usuários não tenham o mesmo e-mail. Como isso pode ser implementado?",
      "alternativas": {
        "a": "Definindo a coluna 'email' como obrigatória e única na tabela de usuários.",
        "b": "Criando uma tabela separada para armazenar emails únicos dos usuários.",
        "c": "Permitindo que a coluna 'email' aceite valores nulos para evitar conflitos.",
        "d": "Adicionando uma chave estrangeira na tabela de emails para referenciar usuários."
      },
      "correta": "a",
      "explicacao": "Definir a coluna 'email' como obrigatória e única na tabela de usuários garante que não haverá duplicidade de emails, respeitando a integridade dos dados.",
      "fonte": "bancodedados.modelagem"
    },
    {
      "id": "fullstack-int-12",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um aplicativo React e precisa buscar a lista de tarefas de uma API. Como você deve gerenciar os estados de carregamento, erro e sucesso ao fazer a requisição?",
      "alternativas": {
        "a": "Utilizar apenas um estado para armazenar os dados e exibir uma mensagem de erro quando necessário.",
        "b": "Criar três estados: um para os dados, um para o erro e um para indicar que a requisição está carregando.",
        "c": "Fazer a requisição e exibir os dados diretamente, sem se preocupar com estados de erro ou carregamento.",
        "d": "Usar um estado para os dados e um timer para simular o carregamento."
      },
      "correta": "b",
      "explicacao": "A alternativa correta é a que cria três estados, pois isso permite gerenciar de forma adequada as diferentes fases da requisição, melhorando a experiência do usuário.",
      "fonte": "integracao.consumir"
    },
    {
      "id": "fullstack-int-13",
      "nivel": "intermediario",
      "pergunta": "Você está recebendo um erro de CORS ao tentar acessar uma API durante o desenvolvimento. O que você deve fazer para resolver isso?",
      "alternativas": {
        "a": "Modificar o código do front-end para que ele faça as requisições para a mesma porta da API.",
        "b": "Adicionar um middleware de CORS no servidor e configurar as origens permitidas para o front-end.",
        "c": "Desativar as configurações de segurança do navegador para permitir chamadas entre origens diferentes.",
        "d": "Criar um proxy no front-end que redirecione as requisições para a API."
      },
      "correta": "b",
      "explicacao": "A alternativa correta é adicionar um middleware de CORS no servidor, pois é assim que se controla quais origens têm permissão para acessar a API, garantindo a segurança.",
      "fonte": "integracao.cors"
    },
    {
      "id": "fullstack-int-14",
      "nivel": "intermediario",
      "pergunta": "Você está implementando a autenticação em um aplicativo e precisa garantir que as senhas dos usuários sejam armazenadas de forma segura. O que você deve fazer?",
      "alternativas": {
        "a": "Armazenar as senhas em texto puro para facilitar o acesso posterior.",
        "b": "Utilizar um algoritmo de hash para transformar as senhas em um formato irreversível antes de armazená-las.",
        "c": "Criptografar as senhas e armazenar a chave de criptografia junto com elas.",
        "d": "Guardar as senhas em um arquivo de configuração que não é versionado."
      },
      "correta": "b",
      "explicacao": "A alternativa correta é utilizar um algoritmo de hash, pois isso garante que as senhas não possam ser recuperadas em seu formato original, aumentando a segurança.",
      "fonte": "integracao.auth"
    },
    {
      "id": "fullstack-int-15",
      "nivel": "intermediario",
      "pergunta": "Após o login, você precisa enviar um token JWT em todas as requisições protegidas. Como você deve proceder?",
      "alternativas": {
        "a": "Enviar o token no corpo da requisição para que o servidor possa validá-lo.",
        "b": "Anexar o token no cabeçalho da requisição para que o servidor possa verificar sua autenticidade.",
        "c": "Não é necessário enviar o token, pois o servidor já sabe quem é o usuário após o login.",
        "d": "Armazenar o token em um cookie sem nenhuma proteção adicional."
      },
      "correta": "b",
      "explicacao": "A alternativa correta é anexar o token no cabeçalho da requisição, pois esse é o método padrão para autenticação com JWT, permitindo que o servidor valide o token em cada requisição.",
      "fonte": "integracao.auth"
    },
    {
      "id": "fullstack-av-01",
      "nivel": "avancado",
      "pergunta": "Você está organizando um repositório para um projeto full-stack. Qual a melhor prática para manter a clareza entre front e back-end?",
      "alternativas": {
        "a": "Criar pastas separadas para cada um, como `client/` e `server/`",
        "b": "Misturar os códigos do front e back para facilitar o acesso",
        "c": "Colocar todo o código em uma única pasta para simplificar a estrutura",
        "d": "Criar um repositório para o front e outro para o back"
      },
      "correta": "a",
      "explicacao": "Manter pastas separadas para front e back ajuda a manter a organização e a clareza do projeto.",
      "fonte": "projeto.estrutura"
    },
    {
      "id": "fullstack-av-02",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um app onde os usuários gerenciam seus dados. Qual é a melhor prática para garantir que cada usuário tenha acesso apenas aos seus dados?",
      "alternativas": {
        "a": "Implementar autenticação com JWT para proteger as rotas",
        "b": "Permitir acesso a todos os dados de forma aberta",
        "c": "Criar uma única conta para todos os usuários acessarem",
        "d": "Usar um sistema de senhas simples sem criptografia"
      },
      "correta": "a",
      "explicacao": "A autenticação com JWT é uma prática recomendada para garantir que cada usuário acesse apenas seus dados, protegendo as informações.",
      "fonte": "projeto.app"
    },
    {
      "id": "fullstack-av-03",
      "nivel": "avancado",
      "pergunta": "Após finalizar o desenvolvimento do seu app, qual é a primeira coisa que você deve fazer antes de publicá-lo?",
      "alternativas": {
        "a": "Rodar uma suíte de testes automatizados para garantir que tudo funciona",
        "b": "Fazer uma revisão manual do código para verificar erros",
        "c": "Publicar imediatamente para ganhar tempo",
        "d": "Aguardar feedback de amigos sobre o app"
      },
      "correta": "a",
      "explicacao": "Rodar testes automatizados garante que o app funcione corretamente antes de ser publicado, evitando problemas para os usuários.",
      "fonte": "projeto.testes"
    },
    {
      "id": "fullstack-av-04",
      "nivel": "avancado",
      "pergunta": "Você precisa testar uma regra de negócio no servidor. Qual abordagem é a mais adequada para isso?",
      "alternativas": {
        "a": "Criar um teste unitário para a função que implementa a regra",
        "b": "Testar a regra diretamente no navegador",
        "c": "Fazer um teste de ponta a ponta para verificar a regra",
        "d": "Executar a aplicação e verificar manualmente se a regra está funcionando"
      },
      "correta": "a",
      "explicacao": "Um teste unitário é a abordagem correta para validar regras de negócio no servidor, garantindo que a lógica funcione isoladamente.",
      "fonte": "projeto.testes"
    },
    {
      "id": "fullstack-av-05",
      "nivel": "avancado",
      "pergunta": "Ao construir um app full-stack, qual é a melhor maneira de lidar com a persistência de dados entre reinícios?",
      "alternativas": {
        "a": "Utilizar um banco de dados para armazenar os dados de forma persistente",
        "b": "Guardar os dados em variáveis globais",
        "c": "Armazenar os dados apenas na memória do servidor",
        "d": "Não se preocupar com persistência, já que o app é pequeno"
      },
      "correta": "a",
      "explicacao": "Utilizar um banco de dados é a prática recomendada para garantir que os dados sejam persistentes entre reinícios do app.",
      "fonte": "projeto.app"
    },
    {
      "id": "fullstack-av-06",
      "nivel": "avancado",
      "pergunta": "Você está implementando testes para um componente crítico da sua aplicação. Qual ferramenta é mais indicada para isso?",
      "alternativas": {
        "a": "React Testing Library para simular interações e verificar a renderização",
        "b": "Vitest para testar a lógica do servidor",
        "c": "Playwright para testes de ponta a ponta",
        "d": "Jest apenas para verificar a performance do componente"
      },
      "correta": "a",
      "explicacao": "A React Testing Library é a ferramenta ideal para testar componentes, pois permite simular interações e verificar se a tela reage corretamente.",
      "fonte": "projeto.testes"
    },
    {
      "id": "fullstack-av-07",
      "nivel": "avancado",
      "pergunta": "Você está prestes a fazer o deploy de sua aplicação full-stack. O que deve ser feito em relação ao arquivo `.env` antes de subir para o servidor?",
      "alternativas": {
        "a": "Adicionar o arquivo `.env` ao repositório para facilitar o acesso a variáveis.",
        "b": "Manter o arquivo `.env` localmente e garantir que ele não seja enviado ao repositório.",
        "c": "Subir o arquivo `.env` junto com o código para garantir que as variáveis estejam disponíveis.",
        "d": "Criar um novo arquivo `.env` no servidor com as mesmas variáveis do local."
      },
      "correta": "b",
      "explicacao": "O arquivo `.env` deve ser mantido localmente e não enviado ao repositório para proteger segredos e configurações sensíveis.",
      "fonte": "deploy.env"
    },
    {
      "id": "fullstack-av-08",
      "nivel": "avancado",
      "pergunta": "Após publicar sua API, você percebe que o front-end não consegue se conectar. O que você deve verificar primeiro?",
      "alternativas": {
        "a": "Se a URL do banco de dados está correta no back-end.",
        "b": "Se a URL da API no front-end foi atualizada para a URL pública.",
        "c": "Se o código do front-end está livre de erros de sintaxe.",
        "d": "Se o servidor está rodando na porta padrão 80."
      },
      "correta": "b",
      "explicacao": "A URL da API no front-end deve ser atualizada para a URL pública após o deploy, caso contrário, a conexão falhará.",
      "fonte": "deploy.frontend"
    },
    {
      "id": "fullstack-av-09",
      "nivel": "avancado",
      "pergunta": "Você está configurando seu back-end para o deploy. Qual é uma prática recomendada em relação às variáveis de ambiente?",
      "alternativas": {
        "a": "Definir todas as variáveis diretamente no código-fonte.",
        "b": "Centralizar a leitura das variáveis em um único módulo ou arquivo.",
        "c": "Espalhar a leitura das variáveis em várias partes do código.",
        "d": "Utilizar valores padrão no código, sem validação."
      },
      "correta": "b",
      "explicacao": "Centralizar a leitura das variáveis de ambiente ajuda a evitar erros e facilita a manutenção do código.",
      "fonte": "deploy.env"
    },
    {
      "id": "fullstack-av-10",
      "nivel": "avancado",
      "pergunta": "Ao fazer o deploy do seu back-end, você precisa garantir que a API está acessível. O que é crucial para isso?",
      "alternativas": {
        "a": "Rodar o servidor na porta 3000, que é a porta padrão.",
        "b": "Configurar a URL do banco de dados no painel da plataforma de hospedagem.",
        "c": "Definir a porta de escuta via variável de ambiente `PORT` no código.",
        "d": "Utilizar uma URL de banco de dados local para testes."
      },
      "correta": "c",
      "explicacao": "A variável de ambiente `PORT` deve ser usada para definir a porta de escuta, pois as plataformas de hospedagem definem isso dinamicamente.",
      "fonte": "deploy.backend"
    },
    {
      "id": "fullstack-av-11",
      "nivel": "avancado",
      "pergunta": "Você acabou de fazer o deploy do seu front-end e está testando a aplicação. O que deve ser verificado em relação ao CORS?",
      "alternativas": {
        "a": "Se o domínio do front-end está na lista de origens permitidas no back-end.",
        "b": "Se o front-end está rodando na mesma porta que o back-end.",
        "c": "Se o código do front-end não contém erros de JavaScript.",
        "d": "Se o banco de dados está acessível a partir do front-end."
      },
      "correta": "a",
      "explicacao": "O domínio do front-end deve estar na lista de origens permitidas no back-end para evitar bloqueios de CORS.",
      "fonte": "deploy.frontend"
    },
    {
      "id": "fullstack-av-12",
      "nivel": "avancado",
      "pergunta": "Após o deploy, você precisa monitorar a aplicação. Qual ferramenta é essencial para isso no back-end?",
      "alternativas": {
        "a": "O console do navegador para erros de JavaScript.",
        "b": "O painel de logs da plataforma de deploy para capturar saídas e erros.",
        "c": "Um sistema de notificações por e-mail para alertas.",
        "d": "Um painel de controle de performance da aplicação."
      },
      "correta": "b",
      "explicacao": "O painel de logs captura tudo que a aplicação escreve na saída padrão, permitindo monitorar erros e comportamento.",
      "fonte": "deploy.monitor"
    },
    {
      "id": "fullstack-av-13",
      "nivel": "avancado",
      "pergunta": "Você implementou um health check no seu back-end. Qual é o propósito dessa rota?",
      "alternativas": {
        "a": "Registrar todas as requisições feitas à API.",
        "b": "Verificar se a aplicação está respondendo corretamente.",
        "c": "Capturar erros de CORS que ocorrem na aplicação.",
        "d": "Fornecer informações detalhadas sobre o estado do banco de dados."
      },
      "correta": "b",
      "explicacao": "A rota de health check deve responder 200 quando o serviço está ativo, permitindo monitoramento da disponibilidade da aplicação.",
      "fonte": "deploy.monitor"
    },
    {
      "id": "fullstack-av-14",
      "nivel": "avancado",
      "pergunta": "Você está configurando a URL da API no front-end. Qual é a melhor prática em relação a isso?",
      "alternativas": {
        "a": "Definir a URL da API diretamente no código-fonte.",
        "b": "Utilizar uma variável de ambiente no painel da plataforma de front.",
        "c": "Manter a URL da API como localhost para desenvolvimento.",
        "d": "Criar um arquivo separado para armazenar todas as URLs."
      },
      "correta": "b",
      "explicacao": "Utilizar uma variável de ambiente permite que a URL da API seja facilmente alterada entre ambientes sem modificar o código.",
      "fonte": "deploy.frontend"
    },
    {
      "id": "fullstack-av-15",
      "nivel": "avancado",
      "pergunta": "Você está prestes a fazer o deploy do seu banco de dados. Qual é um aspecto importante a ser considerado?",
      "alternativas": {
        "a": "Utilizar um banco de dados local para produção.",
        "b": "Rodar as migrations apontando para o banco de produção.",
        "c": "Manter o banco de dados no mesmo servidor que o front-end.",
        "d": "Configurar o banco de dados com credenciais padrão."
      },
      "correta": "b",
      "explicacao": "As migrations devem ser rodadas no banco de produção para garantir que a estrutura esteja correta antes do uso.",
      "fonte": "deploy.backend"
    }
  ]
};

export default pool;
