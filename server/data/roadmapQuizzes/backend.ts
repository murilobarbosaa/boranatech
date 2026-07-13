// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool backend). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "backend",
  "questions": [
    {
      "id": "backend-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo uma aplicação web e precisa que o cliente peça a lista de usuários. O que você deve implementar no servidor?",
      "alternativas": {
        "a": "Um endpoint GET /usuarios que retorna a lista de usuários.",
        "b": "Um endpoint POST /usuarios que cria um novo usuário.",
        "c": "Um endpoint DELETE /usuarios que remove um usuário.",
        "d": "Um endpoint PUT /usuarios que atualiza informações de um usuário."
      },
      "correta": "a",
      "explicacao": "O endpoint GET /usuarios é o correto porque ele é utilizado para buscar dados, que é a intenção do cliente neste caso.",
      "fonte": "fundamentos.conceitos.api"
    },
    {
      "id": "backend-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você está criando uma API e precisa garantir que um pedido de criação de um recurso não altere dados existentes. Qual método HTTP você deve usar?",
      "alternativas": {
        "a": "POST, que é usado para criar novos recursos.",
        "b": "GET, que é usado para buscar dados sem alterar nada.",
        "c": "PUT, que é usado para atualizar recursos existentes.",
        "d": "DELETE, que é usado para remover recursos."
      },
      "correta": "a",
      "explicacao": "O método POST é o apropriado para criar novos recursos, garantindo que não haja alteração em dados existentes.",
      "fonte": "fundamentos.conceitos.http"
    },
    {
      "id": "backend-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você está implementando um servidor e precisa que ele retorne um erro quando um recurso não é encontrado. Qual status code você deve usar?",
      "alternativas": {
        "a": "200, que indica que a requisição foi bem-sucedida.",
        "b": "404, que indica que o recurso não foi encontrado.",
        "c": "500, que indica um erro interno do servidor.",
        "d": "403, que indica que o acesso ao recurso é proibido."
      },
      "correta": "b",
      "explicacao": "O status code 404 é o correto para indicar que o recurso solicitado não foi encontrado no servidor.",
      "fonte": "fundamentos.conceitos.http"
    },
    {
      "id": "backend-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você está usando o terminal para gerenciar um projeto. Qual comando você deve usar para criar uma nova pasta dentro do seu projeto?",
      "alternativas": {
        "a": "mkdir, que cria uma nova pasta.",
        "b": "cd, que muda o diretório atual.",
        "c": "ls, que lista os arquivos do diretório.",
        "d": "pwd, que mostra o caminho do diretório atual."
      },
      "correta": "a",
      "explicacao": "O comando mkdir é o correto para criar uma nova pasta no terminal.",
      "fonte": "fundamentos.terminal"
    },
    {
      "id": "backend-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você fez alterações em um arquivo e agora quer salvar essas mudanças no Git. Qual comando você deve usar primeiro?",
      "alternativas": {
        "a": "git push, que envia as mudanças para o repositório remoto.",
        "b": "git commit -m 'mensagem', que salva as mudanças localmente.",
        "c": "git status, que mostra o estado do repositório.",
        "d": "git add, que marca os arquivos para serem incluídos no próximo commit."
      },
      "correta": "d",
      "explicacao": "O comando git add é o primeiro passo para marcar os arquivos que você deseja incluir no próximo commit.",
      "fonte": "fundamentos.git.basico"
    },
    {
      "id": "backend-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você está trabalhando em uma nova funcionalidade e precisa criar uma branch para isolar seu trabalho. Qual comando você deve usar?",
      "alternativas": {
        "a": "git checkout -b nome-da-branch, que cria e muda para a nova branch.",
        "b": "git merge nome-da-branch, que combina a branch com a principal.",
        "c": "git push, que envia a branch para o repositório remoto.",
        "d": "git commit -m 'mensagem', que salva as mudanças na branch atual."
      },
      "correta": "a",
      "explicacao": "O comando git checkout -b nome-da-branch cria uma nova branch e muda para ela, permitindo que você trabalhe isoladamente.",
      "fonte": "fundamentos.git.branches"
    },
    {
      "id": "backend-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você finalizou uma funcionalidade em uma branch e quer que outros revisem seu código antes de integrar. O que você deve fazer?",
      "alternativas": {
        "a": "Fazer um merge direto com a branch principal.",
        "b": "Criar um pull request (PR) para revisão do código.",
        "c": "Enviar um e-mail com o código para a equipe.",
        "d": "Fazer um commit e esperar que outros vejam no repositório."
      },
      "correta": "b",
      "explicacao": "Criar um pull request (PR) é a forma correta de solicitar revisão do código antes de integrá-lo ao projeto principal.",
      "fonte": "fundamentos.git.pr"
    },
    {
      "id": "backend-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você está começando a aprender sobre back-end e precisa escolher uma linguagem. Qual é a melhor escolha se você já tem experiência com JavaScript no front-end?",
      "alternativas": {
        "a": "Python, pois é fácil de ler e entender.",
        "b": "Java com Spring Boot, que é muito usado em empresas grandes.",
        "c": "Node.js, pois permite usar JavaScript em ambos os lados.",
        "d": "Go, que é rápida e simples."
      },
      "correta": "c",
      "explicacao": "Node.js permite que você use JavaScript tanto no front-end quanto no back-end, facilitando a transição entre as duas áreas.",
      "fonte": "linguagem.escolha"
    },
    {
      "id": "backend-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você instalou a linguagem de programação escolhida, mas não consegue rodar seu primeiro programa. O que você deve fazer primeiro?",
      "alternativas": {
        "a": "Verificar se o editor de código está configurado corretamente.",
        "b": "Instalar um novo editor de código diferente do recomendado.",
        "c": "Rodar o programa sem confirmar a versão da linguagem.",
        "d": "Desinstalar e reinstalar a linguagem sem mais verificações."
      },
      "correta": "a",
      "explicacao": "Verificar a configuração do editor de código é essencial para garantir que você possa rodar seu programa corretamente.",
      "fonte": "linguagem.setup"
    },
    {
      "id": "backend-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você precisa declarar uma variável que guardará a idade de um usuário. Qual das seguintes opções é a maneira correta de fazer isso?",
      "alternativas": {
        "a": "idade = 30",
        "b": "int idade = 30",
        "c": "var idade = 30",
        "d": "declare idade = 30"
      },
      "correta": "c",
      "explicacao": "A sintaxe correta para declarar uma variável em muitas linguagens é usar a palavra-chave 'var', que indica que você está criando uma nova variável.",
      "fonte": "linguagem.sintaxe"
    },
    {
      "id": "backend-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você está criando um programa que precisa verificar se um usuário está logado. Qual estrutura de controle você deve usar?",
      "alternativas": {
        "a": "Um laço 'for' para repetir a verificação.",
        "b": "Uma condicional 'if' para decidir o que fazer.",
        "c": "Um laço 'while' que continua até que o usuário faça login.",
        "d": "Uma função que sempre retorna verdadeiro."
      },
      "correta": "b",
      "explicacao": "Uma condicional 'if' é a estrutura correta para tomar decisões com base em condições, como verificar se um usuário está logado.",
      "fonte": "linguagem.controle"
    },
    {
      "id": "backend-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você precisa criar uma função que calcula o preço total de um produto com desconto. Qual das alternativas abaixo é a melhor prática?",
      "alternativas": {
        "a": "Criar uma função que apenas imprime o resultado na tela.",
        "b": "Criar uma função que retorna o preço total após o desconto.",
        "c": "Criar uma função que não aceita parâmetros.",
        "d": "Criar uma função que calcula o desconto e imprime o resultado."
      },
      "correta": "b",
      "explicacao": "Funções que retornam valores são mais reutilizáveis e testáveis, permitindo que você use o resultado em outras partes do código.",
      "fonte": "linguagem.funcoes"
    },
    {
      "id": "backend-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você está organizando dados de produtos em um carrinho de compras. Qual estrutura de dados você deve usar para manter a ordem dos produtos?",
      "alternativas": {
        "a": "Um mapa, que permite acesso rápido por chave.",
        "b": "Uma lista, que mantém a ordem dos itens inseridos.",
        "c": "Um conjunto, que não permite duplicatas.",
        "d": "Um dicionário, que é uma forma de mapa."
      },
      "correta": "b",
      "explicacao": "Uma lista é ideal para manter a ordem dos produtos, permitindo que você percorra todos os itens na sequência em que foram adicionados.",
      "fonte": "linguagem.estruturas"
    },
    {
      "id": "backend-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você deseja instalar uma biblioteca para validar dados no seu projeto. O que você deve fazer primeiro?",
      "alternativas": {
        "a": "Instalar a biblioteca sem verificar suas dependências.",
        "b": "Consultar a documentação da biblioteca para entender como usá-la.",
        "c": "Modificar o código da biblioteca para atender suas necessidades.",
        "d": "Ignorar a instalação e tentar fazer tudo manualmente."
      },
      "correta": "b",
      "explicacao": "Consultar a documentação da biblioteca é essencial para entender como utilizá-la corretamente e evitar problemas futuros.",
      "fonte": "linguagem.pacotes"
    },
    {
      "id": "backend-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você está dividindo seu código em módulos e precisa compartilhar uma função entre eles. O que você deve fazer?",
      "alternativas": {
        "a": "Exportar a função no módulo onde ela está definida.",
        "b": "Importar a função em todos os módulos que precisam dela.",
        "c": "Criar cópias da função em cada módulo que precisa dela.",
        "d": "Deixar a função privada, pois não precisa ser compartilhada."
      },
      "correta": "a",
      "explicacao": "Exportar a função permite que outros módulos a acessem, promovendo a reutilização e organização do código.",
      "fonte": "linguagem.modulos"
    },
    {
      "id": "backend-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo uma API e precisa que ela responda corretamente a requisições GET para um recurso específico. Qual abordagem você deve seguir para definir a rota?",
      "alternativas": {
        "a": "Definir a rota como /produtos e associar a função que retorna todos os produtos.",
        "b": "Definir a rota como /buscarProduto e associar a função que retorna todos os produtos.",
        "c": "Definir a rota como /produtos/:id e associar a função que retorna um produto específico.",
        "d": "Definir a rota como /produtos e associar a função que retorna um produto específico."
      },
      "correta": "a",
      "explicacao": "A alternativa correta é a que define a rota como /produtos, que é a forma recomendada para retornar todos os produtos, seguindo a convenção de nomear caminhos no plural.",
      "fonte": "servidor.rotas"
    },
    {
      "id": "backend-int-02",
      "nivel": "intermediario",
      "pergunta": "Você está implementando um middleware de autenticação e precisa garantir que apenas usuários logados acessem determinadas rotas. Qual abordagem deve ser adotada?",
      "alternativas": {
        "a": "Registrar o usuário no log e continuar a execução da rota.",
        "b": "Verificar se o usuário está logado e barrar a requisição com um erro 401 caso não esteja.",
        "c": "Executar a rota normalmente e verificar a autenticação apenas no final.",
        "d": "Redirecionar o usuário para a página de login sem barrar a requisição."
      },
      "correta": "b",
      "explicacao": "A alternativa correta é a que verifica se o usuário está logado e barrar a requisição com um erro 401, garantindo que apenas usuários autenticados acessem as rotas protegidas.",
      "fonte": "servidor.middleware"
    },
    {
      "id": "backend-int-03",
      "nivel": "intermediario",
      "pergunta": "Você precisa extrair dados de uma requisição POST que está enviando um objeto JSON. Qual parte da requisição você deve acessar para obter esses dados?",
      "alternativas": {
        "a": "Os parâmetros da rota, que identificam o recurso.",
        "b": "A query string, que contém filtros e opções de paginação.",
        "c": "O corpo da requisição, onde o JSON é enviado.",
        "d": "Os headers, que trazem metadados sobre a requisição."
      },
      "correta": "c",
      "explicacao": "A alternativa correta é acessar o corpo da requisição, que é onde os dados do objeto JSON são enviados em requisições POST.",
      "fonte": "servidor.reqres"
    },
    {
      "id": "backend-int-04",
      "nivel": "intermediario",
      "pergunta": "Você está criando um servidor e precisa escolher um framework web para facilitar o desenvolvimento. Qual critério deve ser considerado na escolha?",
      "alternativas": {
        "a": "A popularidade do framework na comunidade da sua linguagem e a transparência em relação ao HTTP.",
        "b": "A quantidade de funcionalidades que o framework oferece, independentemente de sua complexidade.",
        "c": "A facilidade de uso do framework, mesmo que isso signifique esconder detalhes do HTTP.",
        "d": "A quantidade de plugins disponíveis para o framework, sem considerar sua integração."
      },
      "correta": "a",
      "explicacao": "A alternativa correta é considerar a popularidade do framework na comunidade e a transparência em relação ao HTTP, pois isso facilita o aprendizado e a resolução de problemas.",
      "fonte": "servidor.framework"
    },
    {
      "id": "backend-int-05",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo uma API para gerenciar produtos. Qual rota você deve implementar para permitir a atualização de um produto específico?",
      "alternativas": {
        "a": "POST /produtos/42",
        "b": "PUT /produtos/42",
        "c": "PATCH /produtos/42",
        "d": "GET /produtos/42"
      },
      "correta": "b",
      "explicacao": "A rota correta para atualizar um produto específico é a que utiliza o método PUT, que substitui o recurso inteiro.",
      "fonte": "apis.crud"
    },
    {
      "id": "backend-int-06",
      "nivel": "intermediario",
      "pergunta": "Ao implementar a validação de entrada em sua API, qual abordagem é mais recomendada para garantir a integridade dos dados?",
      "alternativas": {
        "a": "Usar uma pilha de ifs em cada rota para validar os dados",
        "b": "Confiar apenas na validação do front-end",
        "c": "Declarar um esquema de validação e deixar a biblioteca verificar os dados",
        "d": "Ignorar a validação e deixar o banco de dados lidar com erros"
      },
      "correta": "c",
      "explicacao": "Declarar um esquema de validação permite que a biblioteca verifique os dados de forma consistente e escalável, garantindo a integridade.",
      "fonte": "apis.validacao"
    },
    {
      "id": "backend-int-07",
      "nivel": "intermediario",
      "pergunta": "Você está criando uma API e deseja implementar um tratamento de erros eficiente. Qual é a melhor prática ao lidar com erros inesperados?",
      "alternativas": {
        "a": "Retornar um status 200 com uma mensagem de erro no corpo",
        "b": "Retornar um status 500 com uma mensagem genérica para o cliente",
        "c": "Retornar um status 404 se o recurso não for encontrado",
        "d": "Retornar um status 400 com detalhes do erro no corpo"
      },
      "correta": "b",
      "explicacao": "Para erros inesperados, a prática recomendada é retornar um status 500 com uma mensagem genérica, evitando expor detalhes internos.",
      "fonte": "apis.erros"
    },
    {
      "id": "backend-int-08",
      "nivel": "intermediario",
      "pergunta": "Você está projetando uma API REST e quer garantir que ela seja fácil de consumir. Qual prática você deve seguir para melhorar a experiência do desenvolvedor?",
      "alternativas": {
        "a": "Usar caminhos de rotas com verbos para descrever ações",
        "b": "Manter consistência nos formatos de resposta e nomes de campos",
        "c": "Devolver listas completas sem limites de itens",
        "d": "Criar rotas diferentes para cada combinação de filtros"
      },
      "correta": "b",
      "explicacao": "Manter consistência nos formatos de resposta e nomes de campos facilita o uso da API, permitindo que quem a consome aprenda uma vez e aplique em todas as rotas.",
      "fonte": "apis.boaspraticas"
    },
    {
      "id": "backend-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está modelando um sistema de e-commerce. Qual é a abordagem correta para evitar dados duplicados entre as tabelas de usuários e pedidos?",
      "alternativas": {
        "a": "Armazenar o nome do usuário na tabela de pedidos junto com o id do usuário.",
        "b": "Criar uma tabela de usuários com um id e referenciar esse id na tabela de pedidos.",
        "c": "Duplicar todos os dados do usuário em cada pedido para facilitar consultas.",
        "d": "Criar uma tabela de pedidos sem referência aos usuários."
      },
      "correta": "b",
      "explicacao": "Referenciar o id do usuário na tabela de pedidos evita a duplicação de dados e garante a integridade das informações.",
      "fonte": "bancodedados.conceitos.modelagem"
    },
    {
      "id": "backend-int-10",
      "nivel": "intermediario",
      "pergunta": "Você precisa realizar uma consulta para obter todos os produtos com preço menor que 50, ordenados pelo nome. Qual comando SQL você deve usar?",
      "alternativas": {
        "a": "SELECT * FROM produtos WHERE preco < 50 ORDER BY nome;",
        "b": "SELECT nome, preco FROM produtos WHERE preco < 50;",
        "c": "SELECT * FROM produtos ORDER BY nome WHERE preco < 50;",
        "d": "SELECT nome, preco FROM produtos WHERE preco < 50 ORDER BY nome;"
      },
      "correta": "d",
      "explicacao": "A alternativa d é a única que combina corretamente a filtragem e a ordenação na mesma consulta SQL.",
      "fonte": "bancodedados.relacional.queries"
    },
    {
      "id": "backend-int-11",
      "nivel": "intermediario",
      "pergunta": "Você está usando PostgreSQL e deseja garantir que a coluna usuario_id na tabela pedidos sempre referencie um usuário existente. O que você deve fazer?",
      "alternativas": {
        "a": "Criar a coluna usuario_id sem restrições adicionais.",
        "b": "Adicionar uma chave estrangeira na coluna usuario_id que referencia a tabela de usuários.",
        "c": "Criar um índice na coluna usuario_id para melhorar a performance.",
        "d": "Adicionar uma chave primária na tabela pedidos para garantir a unicidade."
      },
      "correta": "b",
      "explicacao": "Adicionar uma chave estrangeira na coluna usuario_id garante que cada pedido esteja vinculado a um usuário existente, mantendo a integridade referencial.",
      "fonte": "bancodedados.relacional.relacionamentos"
    },
    {
      "id": "backend-int-12",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo uma API que precisa consultar dados do banco de dados de forma segura. Qual é a principal vantagem de usar um ORM?",
      "alternativas": {
        "a": "Permitir consultas SQL mais rápidas e diretas.",
        "b": "Gerar SQL automaticamente e evitar injeção de SQL.",
        "c": "Facilitar a conexão com o banco de dados sem precisar de credenciais.",
        "d": "Eliminar a necessidade de entender SQL completamente."
      },
      "correta": "b",
      "explicacao": "Um ORM gera SQL automaticamente e parametriza as consultas, ajudando a evitar injeções de SQL, o que aumenta a segurança da aplicação.",
      "fonte": "bancodedados.orm"
    },
    {
      "id": "backend-int-13",
      "nivel": "intermediario",
      "pergunta": "Você está implementando um sistema de migrations para versionar as alterações no banco de dados. Qual é a prática recomendada ao fazer uma alteração?",
      "alternativas": {
        "a": "Fazer a alteração diretamente no banco de dados e documentar depois.",
        "b": "Criar uma migration para cada alteração de estrutura e versioná-las no repositório.",
        "c": "Alterar a estrutura do banco e criar uma migration apenas se houver erro.",
        "d": "Editar migrations que já foram aplicadas para corrigir problemas."
      },
      "correta": "b",
      "explicacao": "Criar uma migration para cada alteração garante que todas as mudanças sejam rastreáveis e aplicáveis de forma consistente em diferentes ambientes.",
      "fonte": "bancodedados.migrations"
    },
    {
      "id": "backend-int-14",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo uma aplicação que precisa armazenar dados temporários de forma rápida. Qual abordagem você deve considerar?",
      "alternativas": {
        "a": "Usar um banco de dados relacional para armazenar os dados.",
        "b": "Implementar um sistema de cache com Redis para armazenar os dados temporariamente.",
        "c": "Armazenar os dados diretamente em arquivos de texto.",
        "d": "Utilizar um banco de dados NoSQL para dados temporários."
      },
      "correta": "b",
      "explicacao": "Usar um sistema de cache como o Redis permite armazenar dados temporários de forma rápida e eficiente, melhorando a performance da aplicação.",
      "fonte": "bancodedados.cache"
    },
    {
      "id": "backend-int-15",
      "nivel": "intermediario",
      "pergunta": "Você está trabalhando com MongoDB e precisa armazenar um pedido que contém itens variados. Qual é a melhor forma de estruturar os dados?",
      "alternativas": {
        "a": "Criar uma tabela separada para cada item do pedido.",
        "b": "Armazenar todos os itens do pedido dentro do documento do pedido como um array.",
        "c": "Criar um documento para cada item e referenciar os pedidos.",
        "d": "Armazenar os itens em uma coleção separada e vincular por id."
      },
      "correta": "b",
      "explicacao": "Armazenar os itens do pedido dentro do documento do pedido como um array é uma prática comum no MongoDB, permitindo uma estrutura flexível e eficiente.",
      "fonte": "bancodedados.nosql"
    },
    {
      "id": "backend-av-01",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um sistema de autenticação e precisa armazenar senhas de usuários. Qual abordagem garante a segurança das senhas armazenadas?",
      "alternativas": {
        "a": "Armazenar a senha em texto puro e usar uma função hash rápida como SHA-256.",
        "b": "Armazenar o hash da senha usando bcrypt, adicionando um salt único para cada senha.",
        "c": "Armazenar o hash da senha usando MD5, pois é mais rápido e eficiente.",
        "d": "Armazenar a senha em texto puro, mas criptografá-la com uma chave secreta."
      },
      "correta": "b",
      "explicacao": "A abordagem correta é armazenar o hash da senha usando bcrypt, que é projetado para ser lento e seguro, além de utilizar um salt para cada senha, garantindo que hashes iguais não sejam gerados para senhas iguais.",
      "fonte": "autenticacao.senhas"
    },
    {
      "id": "backend-av-02",
      "nivel": "avancado",
      "pergunta": "Você está implementando um sistema que usa JWT para autenticação. Qual é uma prática recomendada para garantir a segurança dos tokens?",
      "alternativas": {
        "a": "Incluir dados sensíveis, como senhas, no payload do token para fácil acesso.",
        "b": "Usar uma chave secreta forte e mantê-la em um arquivo de configuração versionado no Git.",
        "c": "Definir um tempo de expiração curto para os tokens de acesso e renová-los periodicamente.",
        "d": "Enviar o token no corpo da requisição para evitar que ele seja exposto no header."
      },
      "correta": "c",
      "explicacao": "Definir um tempo de expiração curto para os tokens de acesso é uma prática recomendada, pois limita o tempo em que um token comprometido pode ser usado.",
      "fonte": "autenticacao.login.jwt"
    },
    {
      "id": "backend-av-03",
      "nivel": "avancado",
      "pergunta": "Você está criando um middleware de autenticação para proteger rotas em sua API. Qual é a abordagem correta para lidar com tokens inválidos?",
      "alternativas": {
        "a": "Retornar um código de status 200 e ignorar a requisição.",
        "b": "Retornar um código de status 401 e não executar a rota.",
        "c": "Retornar um código de status 403 e executar a rota com dados limitados.",
        "d": "Retornar um código de status 500 e registrar o erro no log."
      },
      "correta": "b",
      "explicacao": "A abordagem correta é retornar um código de status 401 quando o token é inválido, impedindo que a rota seja executada e informando que a autenticação falhou.",
      "fonte": "autenticacao.login.middleware"
    },
    {
      "id": "backend-av-04",
      "nivel": "avancado",
      "pergunta": "Você está configurando CORS em sua API. Qual é a configuração correta para permitir que apenas um domínio específico faça requisições?",
      "alternativas": {
        "a": "Configurar `Access-Control-Allow-Origin` para `*` permitindo todas as origens.",
        "b": "Configurar `Access-Control-Allow-Origin` para o domínio específico do front-end, como `http://localhost:3000`.",
        "c": "Não configurar CORS, pois o navegador não permite requisições de origens diferentes.",
        "d": "Configurar `Access-Control-Allow-Origin` para `localhost`, permitindo qualquer porta."
      },
      "correta": "b",
      "explicacao": "A configuração correta é definir `Access-Control-Allow-Origin` para o domínio específico do front-end, permitindo apenas requisições desse domínio.",
      "fonte": "autenticacao.seguranca.cors"
    },
    {
      "id": "backend-av-05",
      "nivel": "avancado",
      "pergunta": "Você está implementando rate limiting em sua API. Qual abordagem é mais adequada para proteger a rota de login?",
      "alternativas": {
        "a": "Definir um limite de 100 requisições por minuto para todas as rotas da API.",
        "b": "Definir um limite de 10 requisições por minuto apenas para a rota de login.",
        "c": "Não aplicar rate limiting na rota de login, pois é uma prática desnecessária.",
        "d": "Definir um limite de 1000 requisições por minuto para a rota de login."
      },
      "correta": "b",
      "explicacao": "É adequado definir um limite mais restrito para a rota de login, como 10 requisições por minuto, para proteger contra ataques de força bruta.",
      "fonte": "autenticacao.rate"
    },
    {
      "id": "backend-av-06",
      "nivel": "avancado",
      "pergunta": "Você está revisando seu código para evitar injeções de SQL. Qual prática deve ser adotada para garantir a segurança?",
      "alternativas": {
        "a": "Usar concatenação de strings para montar consultas SQL com dados do usuário.",
        "b": "Utilizar consultas parametrizadas para separar dados do comando SQL.",
        "c": "Validar dados do usuário apenas no front-end antes de enviá-los ao servidor.",
        "d": "Escapar caracteres especiais em strings antes de concatená-las."
      },
      "correta": "b",
      "explicacao": "A prática recomendada é utilizar consultas parametrizadas, que separam os dados do comando SQL, prevenindo injeções.",
      "fonte": "autenticacao.seguranca.validacao"
    },
    {
      "id": "backend-av-07",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo uma API e percebe que as respostas de erro estão em formatos diferentes. O que você deve fazer para garantir consistência?",
      "alternativas": {
        "a": "Definir um formato único para todas as respostas de erro, incluindo status, code e message.",
        "b": "Manter os formatos atuais, pois cada rota pode ter requisitos diferentes.",
        "c": "Criar um formato de erro que inclua apenas o código de status HTTP.",
        "d": "Utilizar mensagens de erro personalizadas para cada rota, sem padronização."
      },
      "correta": "a",
      "explicacao": "Definir um formato único para as respostas de erro garante que todos os consumidores da API saibam como tratar os erros de forma consistente.",
      "fonte": "qualidade.erros"
    },
    {
      "id": "backend-av-08",
      "nivel": "avancado",
      "pergunta": "Você precisa implementar logging em sua aplicação. Qual abordagem você deve seguir para garantir logs úteis e seguros?",
      "alternativas": {
        "a": "Registrar todos os detalhes possíveis, incluindo senhas e tokens, para facilitar a depuração.",
        "b": "Utilizar níveis de log e garantir que dados sensíveis não sejam registrados.",
        "c": "Fazer logs apenas de erros, sem informações sobre requisições.",
        "d": "Registrar mensagens de log em formato de texto solto, sem estrutura definida."
      },
      "correta": "b",
      "explicacao": "Utilizar níveis de log e evitar registrar dados sensíveis garante que você tenha informações úteis sem comprometer a segurança.",
      "fonte": "qualidade.logging"
    },
    {
      "id": "backend-av-09",
      "nivel": "avancado",
      "pergunta": "Você está criando um projeto e precisa garantir que as regras de negócio sejam testáveis. Qual estrutura você deve adotar?",
      "alternativas": {
        "a": "Colocar toda a lógica dentro das rotas para facilitar o acesso.",
        "b": "Separar a lógica em camadas, com regras de negócio na camada de serviços.",
        "c": "Manter a lógica de negócio no repositório para facilitar a persistência.",
        "d": "Criar uma única camada que combine rotas, serviços e repositórios."
      },
      "correta": "b",
      "explicacao": "Separar a lógica em camadas permite que as regras de negócio sejam testadas de forma isolada, sem dependências de HTTP ou banco de dados.",
      "fonte": "qualidade.estrutura"
    },
    {
      "id": "backend-av-10",
      "nivel": "avancado",
      "pergunta": "Você está documentando sua API e quer garantir que a documentação esteja sempre atualizada. Qual abordagem é recomendada?",
      "alternativas": {
        "a": "Escrever a documentação em texto solto e atualizá-la manualmente sempre que houver mudanças.",
        "b": "Utilizar OpenAPI para gerar a documentação automaticamente a partir do código.",
        "c": "Criar um arquivo separado para cada rota, sem um padrão definido.",
        "d": "Manter a documentação apenas em comentários no código."
      },
      "correta": "b",
      "explicacao": "Utilizar OpenAPI para gerar a documentação automaticamente garante que ela esteja sempre atualizada e acessível para os desenvolvedores.",
      "fonte": "qualidade.docs"
    },
    {
      "id": "backend-av-11",
      "nivel": "avancado",
      "pergunta": "Você está implementando uma API REST e precisa garantir que os usuários só vejam seus próprios hábitos. Qual abordagem você deve usar para proteger as rotas?",
      "alternativas": {
        "a": "Utilizar um middleware de autenticação que verifica o token JWT em cada requisição.",
        "b": "Implementar uma verificação manual de autenticação em cada rota, sem middleware.",
        "c": "Permitir que qualquer usuário acesse as rotas, já que a validação é feita apenas no frontend.",
        "d": "Criar uma tabela de permissões que não está relacionada ao usuário."
      },
      "correta": "a",
      "explicacao": "O uso de um middleware de autenticação que verifica o token JWT é a prática recomendada para proteger rotas e garantir que apenas usuários autenticados possam acessar seus dados.",
      "fonte": "deploy.apirest"
    },
    {
      "id": "backend-av-12",
      "nivel": "avancado",
      "pergunta": "Ao configurar variáveis de ambiente para sua aplicação em produção, qual prática você deve seguir para evitar problemas?",
      "alternativas": {
        "a": "Centralizar a leitura das variáveis em um módulo único de configuração.",
        "b": "Espalhar a leitura das variáveis de ambiente por todo o código da aplicação.",
        "c": "Deixar as variáveis de ambiente visíveis no código para facilitar a depuração.",
        "d": "Não validar as variáveis de ambiente na inicialização da aplicação."
      },
      "correta": "a",
      "explicacao": "Centralizar a leitura das variáveis em um módulo único evita erros e facilita a manutenção, além de permitir validações na inicialização.",
      "fonte": "deploy.env"
    },
    {
      "id": "backend-av-13",
      "nivel": "avancado",
      "pergunta": "Você está prestes a fazer o deploy da sua API em uma plataforma que exige variáveis de ambiente. Qual é um erro comum que você deve evitar?",
      "alternativas": {
        "a": "Definir uma porta fixa no código da aplicação para escutar requisições.",
        "b": "Registrar a URL do banco de dados gerenciado como uma variável de ambiente.",
        "c": "Cadastrar as variáveis de ambiente no painel da plataforma antes de fazer o deploy.",
        "d": "Usar um script de start que a plataforma não reconhece."
      },
      "correta": "a",
      "explicacao": "Definir uma porta fixa no código impede que a aplicação suba corretamente, pois a plataforma define a porta via variável de ambiente.",
      "fonte": "deploy.publicar"
    },
    {
      "id": "backend-av-14",
      "nivel": "avancado",
      "pergunta": "Após colocar sua API no ar, como você deve monitorar sua aplicação para garantir que ela está funcionando corretamente?",
      "alternativas": {
        "a": "Implementar uma rota de health check que responde 200 quando tudo está funcionando.",
        "b": "Confiar apenas nos logs gerados pela aplicação sem monitoramento adicional.",
        "c": "Ignorar a necessidade de monitoramento, já que a aplicação foi publicada.",
        "d": "Utilizar um sistema de monitoramento que não verifica a conexão com o banco."
      },
      "correta": "a",
      "explicacao": "Implementar uma rota de health check é essencial para monitorar a saúde da aplicação e garantir que ela está funcionando como esperado.",
      "fonte": "deploy.monitor"
    },
    {
      "id": "backend-av-15",
      "nivel": "avancado",
      "pergunta": "Você decidiu usar Docker para empacotar sua aplicação. Qual é um erro que você deve evitar ao criar seu Dockerfile?",
      "alternativas": {
        "a": "Incluir todas as dependências necessárias na imagem da aplicação.",
        "b": "Copiar o código da aplicação antes de instalar as dependências.",
        "c": "Usar uma imagem base que não é adequada para a sua aplicação.",
        "d": "Definir o comando de inicialização da aplicação de forma clara."
      },
      "correta": "c",
      "explicacao": "Usar uma imagem base inadequada pode causar falhas na execução da aplicação, portanto, escolher a imagem correta é crucial.",
      "fonte": "deploy.docker"
    },
    {
      "id": "backend-int-16",
      "nivel": "intermediario",
      "pergunta": "Seu back-end cresceu e a lógica de negócio, as consultas ao banco e o tratamento das requisições estão todos misturados no mesmo arquivo. Qual abordagem organiza melhor esse código?",
      "alternativas": {
        "a": "Separar o código em camadas por responsabilidade: entrada, regra de negócio e acesso a dados.",
        "b": "Juntar tudo num único arquivo grande para facilitar encontrar o código.",
        "c": "Duplicar a mesma lógica em cada rota que precisa dela para evitar dependências.",
        "d": "Consultar o banco diretamente dentro de cada rota, sem uma camada de dados."
      },
      "correta": "a",
      "explicacao": "Separar em camadas por responsabilidade mantém o código compreensível e permite mudar uma parte sem quebrar as outras.",
      "fonte": "arquitetura.camadas"
    },
    {
      "id": "backend-int-17",
      "nivel": "intermediario",
      "pergunta": "Uma consulta ao banco é lenta e o resultado muda muito pouco ao longo do tempo. Qual técnica ajuda a responder mais rápido sem refazer a consulta toda vez?",
      "alternativas": {
        "a": "Usar cache: guardar o resultado pronto e servi-lo direto por um tempo, com uma estratégia de expiração.",
        "b": "Remover o índice da tabela para o banco processar menos informação.",
        "c": "Repetir a mesma consulta várias vezes em paralelo para acelerar.",
        "d": "Aumentar o tamanho da resposta enviada ao cliente."
      },
      "correta": "a",
      "explicacao": "O cache guarda o resultado caro para reaproveitá-lo, e o cuidado principal é definir quando o dado guardado expira.",
      "fonte": "performance.cache"
    },
    {
      "id": "backend-av-16",
      "nivel": "avancado",
      "pergunta": "Ao registrar um pedido, seu sistema precisa enviar um email que às vezes demora. Como evitar que o usuário fique esperando esse envio para receber a resposta?",
      "alternativas": {
        "a": "Colocar o envio numa fila e deixar um worker processá-lo em segundo plano, respondendo ao usuário na hora.",
        "b": "Enviar o email de forma síncrona antes de responder, para garantir a ordem.",
        "c": "Bloquear a resposta até o servidor de email confirmar a entrega.",
        "d": "Remover o envio de email para o sistema ficar mais rápido."
      },
      "correta": "a",
      "explicacao": "Processar a tarefa demorada em segundo plano com fila e worker mantém a resposta rápida, sem o usuário esperar o trabalho pesado.",
      "fonte": "filas.workers"
    }
  ]
};

export default pool;
