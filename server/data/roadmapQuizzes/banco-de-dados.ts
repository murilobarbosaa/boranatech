// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool banco-de-dados). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "banco-de-dados",
  "questions": [
    {
      "id": "banco-de-dados-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo um aplicativo que precisa armazenar informações de usuários, pedidos e produtos. Qual é a principal função do banco de dados nesse cenário?",
      "alternativas": {
        "a": "Armazenar dados de forma organizada e permanente.",
        "b": "Executar a lógica de negócios do aplicativo.",
        "c": "Criar interfaces de usuário para interação com os dados.",
        "d": "Gerar relatórios sobre as vendas do aplicativo."
      },
      "correta": "a",
      "explicacao": "O banco de dados é responsável por armazenar dados de forma organizada e permanente, permitindo acesso eficiente e seguro.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "banco-de-dados-ini-02",
      "nivel": "iniciante",
      "pergunta": "Como um DBA pode garantir que os dados de um banco permaneçam disponíveis e seguros?",
      "alternativas": {
        "a": "Ajustando consultas lentas e controlando o acesso aos dados.",
        "b": "Desenvolvendo novas funcionalidades para o sistema.",
        "c": "Eliminando dados antigos para liberar espaço.",
        "d": "Aumentando a velocidade da internet da empresa."
      },
      "correta": "a",
      "explicacao": "O DBA ajusta consultas lentas e controla o acesso aos dados para garantir a segurança e a disponibilidade deles.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "banco-de-dados-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você precisa de um sistema que permita várias pessoas acessarem e modificarem dados simultaneamente. Qual é a função do SGBD nesse contexto?",
      "alternativas": {
        "a": "Gerenciar o acesso simultâneo e garantir a integridade dos dados.",
        "b": "Armazenar os dados em um formato não estruturado.",
        "c": "Criar backups automáticos dos dados todos os dias.",
        "d": "Executar scripts de manutenção em horários programados."
      },
      "correta": "a",
      "explicacao": "O SGBD gerencia o acesso simultâneo e garante que as operações não corrompam os dados, mantendo a integridade.",
      "fonte": "fundamentos.sgbd"
    },
    {
      "id": "banco-de-dados-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você está escolhendo um SGBD para um projeto que exige alta confiabilidade e segurança. Qual dos seguintes é um SGBD relacional conhecido e respeitado no mercado?",
      "alternativas": {
        "a": "MongoDB",
        "b": "MySQL",
        "c": "Redis",
        "d": "Cassandra"
      },
      "correta": "b",
      "explicacao": "O MySQL é um SGBD relacional conhecido e amplamente utilizado, ideal para projetos que exigem confiabilidade e segurança.",
      "fonte": "fundamentos.sgbd"
    },
    {
      "id": "banco-de-dados-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo um sistema de e-commerce que precisa de consistência nos dados. Qual modelo de banco de dados é mais adequado para essa situação?",
      "alternativas": {
        "a": "Banco de dados NoSQL, pois são mais flexíveis.",
        "b": "Banco de dados relacional, pois garantem consistência e estrutura.",
        "c": "Banco de dados de grafos, que lidam bem com relacionamentos complexos.",
        "d": "Banco de dados de chave e valor, que são rápidos."
      },
      "correta": "b",
      "explicacao": "Um banco de dados relacional é mais adequado para garantir consistência em sistemas como e-commerce, onde a integridade dos dados é crítica.",
      "fonte": "fundamentos.relacionalnosql"
    },
    {
      "id": "banco-de-dados-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você está lidando com um grande volume de dados não estruturados e precisa de flexibilidade. Qual tipo de banco de dados pode ser mais adequado?",
      "alternativas": {
        "a": "Banco de dados relacional, que organiza dados em tabelas.",
        "b": "Banco de dados NoSQL, que permite estruturas flexíveis.",
        "c": "Banco de dados de grafos, que foca em relacionamentos.",
        "d": "Banco de dados de texto, que armazena apenas textos."
      },
      "correta": "b",
      "explicacao": "Os bancos de dados NoSQL oferecem flexibilidade para armazenar dados não estruturados, adequando-se a cenários com grandes volumes de dados.",
      "fonte": "fundamentos.relacionalnosql"
    },
    {
      "id": "banco-de-dados-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você está considerando usar um banco de dados NoSQL para um projeto. Qual é uma armadilha comum que você deve evitar?",
      "alternativas": {
        "a": "Usar NoSQL em todos os projetos sem avaliar a necessidade.",
        "b": "Escolher um banco de dados relacional para dados não estruturados.",
        "c": "Ignorar a documentação do SGBD escolhido.",
        "d": "Não realizar backups dos dados."
      },
      "correta": "a",
      "explicacao": "Uma armadilha comum é usar NoSQL indiscriminadamente, sem avaliar se é realmente a melhor escolha para o problema em questão.",
      "fonte": "fundamentos.relacionalnosql"
    },
    {
      "id": "banco-de-dados-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você quer aprender SQL para se preparar para o mercado de trabalho. Qual é a principal razão para dominar essa linguagem?",
      "alternativas": {
        "a": "Ela é a única linguagem usada em bancos de dados.",
        "b": "O conhecimento de SQL se transfere entre diferentes SGBDs.",
        "c": "SQL é mais fácil de aprender do que qualquer outra linguagem.",
        "d": "SQL é a única forma de acessar dados em tempo real."
      },
      "correta": "b",
      "explicacao": "Dominar SQL é importante porque o conhecimento se transfere entre diferentes SGBDs, tornando-o uma habilidade valiosa no mercado de trabalho.",
      "fonte": "fundamentos.sgbd"
    },
    {
      "id": "banco-de-dados-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você precisa listar todos os clientes que moram em Salvador. Qual comando você deve usar?",
      "alternativas": {
        "a": "SELECT nome, email FROM clientes WHERE cidade = 'Salvador'",
        "b": "SELECT * FROM clientes WHERE cidade = 'Salvador'",
        "c": "SELECT nome, email FROM clientes WHERE cidade LIKE 'Salvador'",
        "d": "SELECT nome, email FROM clientes WHERE cidade = 'Salvador' OR cidade = 'São Paulo'"
      },
      "correta": "a",
      "explicacao": "A alternativa correta é a que usa o `WHERE` para filtrar especificamente pela cidade de Salvador, trazendo apenas os dados relevantes.",
      "fonte": "sql.basico"
    },
    {
      "id": "banco-de-dados-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você quer adicionar um novo cliente chamado João com o email joao@email.com. Qual comando você deve usar?",
      "alternativas": {
        "a": "INSERT INTO clientes (nome, email) VALUES ('João', 'joao@email.com')",
        "b": "INSERT clientes VALUES ('João', 'joao@email.com')",
        "c": "INSERT INTO clientes (nome, email) VALUES 'João', 'joao@email.com'",
        "d": "INSERT INTO clientes (nome, email) VALUES ('João', 'joao@email.com') WHERE id = 1"
      },
      "correta": "a",
      "explicacao": "A alternativa correta inclui a sintaxe completa e correta do comando `INSERT`, que é essencial para adicionar novos dados.",
      "fonte": "sql.manipular"
    },
    {
      "id": "banco-de-dados-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você precisa atualizar o email do cliente com id 3 para novo@email.com. Qual comando é o mais seguro para garantir que você não altere outros registros?",
      "alternativas": {
        "a": "UPDATE clientes SET email = 'novo@email.com' WHERE id = 3",
        "b": "UPDATE clientes SET email = 'novo@email.com'",
        "c": "UPDATE clientes SET email = 'novo@email.com' WHERE nome = 'Carlos'",
        "d": "UPDATE clientes SET email = 'novo@email.com' WHERE id = 3 AND nome = 'Carlos'"
      },
      "correta": "a",
      "explicacao": "A alternativa correta usa o `WHERE` para garantir que apenas o cliente com id 3 seja atualizado, evitando alterações indesejadas em outros registros.",
      "fonte": "sql.manipular"
    },
    {
      "id": "banco-de-dados-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você deseja remover todos os clientes que não têm compras registradas. Qual comando você deve usar?",
      "alternativas": {
        "a": "DELETE FROM clientes WHERE id NOT IN (SELECT cliente_id FROM compras)",
        "b": "DELETE FROM clientes",
        "c": "DELETE clientes WHERE id NOT IN (SELECT cliente_id FROM compras)",
        "d": "DELETE FROM clientes WHERE compras IS NULL"
      },
      "correta": "a",
      "explicacao": "A alternativa correta usa uma subconsulta para identificar clientes sem compras, garantindo que apenas esses registros sejam removidos.",
      "fonte": "sql.manipular"
    },
    {
      "id": "banco-de-dados-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você quer contar quantos clientes existem em cada cidade. Qual comando SQL você deve usar?",
      "alternativas": {
        "a": "SELECT cidade, COUNT(*) FROM clientes GROUP BY cidade",
        "b": "SELECT COUNT(*) FROM clientes GROUP BY cidade",
        "c": "SELECT cidade, COUNT(nome) FROM clientes",
        "d": "SELECT cidade, COUNT(*) FROM clientes"
      },
      "correta": "a",
      "explicacao": "A alternativa correta utiliza `GROUP BY` para contar clientes por cidade, que é a abordagem adequada para essa consulta.",
      "fonte": "sql.avancado"
    },
    {
      "id": "banco-de-dados-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você precisa encontrar todos os clientes que gastaram mais do que a média. Qual comando você deve usar?",
      "alternativas": {
        "a": "SELECT * FROM clientes WHERE gasto > (SELECT AVG(gasto) FROM compras)",
        "b": "SELECT * FROM clientes WHERE gasto > AVG(gasto)",
        "c": "SELECT * FROM clientes WHERE gasto = (SELECT AVG(gasto) FROM compras)",
        "d": "SELECT * FROM clientes WHERE gasto > (SELECT SUM(gasto) FROM compras)"
      },
      "correta": "a",
      "explicacao": "A alternativa correta usa uma subconsulta para calcular a média de gastos e filtra os clientes que gastaram acima desse valor.",
      "fonte": "sql.avancado"
    },
    {
      "id": "banco-de-dados-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você precisa listar todos os clientes e seus pedidos, mesmo aqueles que não fizeram pedidos. Qual tipo de JOIN você deve usar?",
      "alternativas": {
        "a": "LEFT JOIN",
        "b": "INNER JOIN",
        "c": "CROSS JOIN",
        "d": "RIGHT JOIN"
      },
      "correta": "a",
      "explicacao": "A alternativa correta é o `LEFT JOIN`, que inclui todos os clientes e seus pedidos, mesmo que alguns não tenham feito pedidos.",
      "fonte": "sql.avancado"
    },
    {
      "id": "banco-de-dados-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está modelando um sistema de vendas e precisa garantir que cada cliente tenha um único registro. Qual abordagem você deve usar para evitar duplicação de dados?",
      "alternativas": {
        "a": "Criar uma tabela de clientes com uma chave primária única e referenciar essa tabela em pedidos.",
        "b": "Armazenar todos os dados do cliente diretamente na tabela de pedidos para evitar referências.",
        "c": "Criar uma tabela de clientes, mas permitir que o mesmo cliente seja registrado várias vezes.",
        "d": "Usar um campo de texto livre para o nome do cliente na tabela de pedidos."
      },
      "correta": "a",
      "explicacao": "A abordagem correta é criar uma tabela de clientes com uma chave primária única, evitando duplicação e inconsistência.",
      "fonte": "modelagem.modelagem"
    },
    {
      "id": "banco-de-dados-int-02",
      "nivel": "intermediario",
      "pergunta": "Você está projetando um banco de dados para um sistema de biblioteca. Um livro pode ser emprestado por vários usuários e um usuário pode pegar vários livros. Como você deve modelar essa relação?",
      "alternativas": {
        "a": "Criar uma tabela de livros e uma tabela de usuários, e armazenar os empréstimos diretamente na tabela de usuários.",
        "b": "Criar uma tabela de livros, uma tabela de usuários e uma tabela intermediária para registrar os empréstimos.",
        "c": "Armazenar todos os dados dos empréstimos na tabela de livros para simplificar a estrutura.",
        "d": "Criar uma tabela de empréstimos que apenas referencia os usuários, sem incluir informações sobre os livros."
      },
      "correta": "b",
      "explicacao": "A relação muitos para muitos deve ser modelada com uma tabela intermediária que conecta livros e usuários, garantindo integridade dos dados.",
      "fonte": "modelagem.modelagem"
    },
    {
      "id": "banco-de-dados-int-03",
      "nivel": "intermediario",
      "pergunta": "Você está normalizando uma tabela de pedidos e percebe que o endereço do cliente está repetido em várias linhas. Qual é a melhor prática para resolver essa redundância?",
      "alternativas": {
        "a": "Criar uma tabela separada para clientes e referenciar o endereço na tabela de pedidos.",
        "b": "Manter o endereço na tabela de pedidos, mas garantir que ele seja atualizado sempre que mudar.",
        "c": "Eliminar o campo de endereço da tabela de pedidos e armazenar apenas o nome do cliente.",
        "d": "Duplicar o endereço em cada linha da tabela de pedidos para facilitar a consulta."
      },
      "correta": "a",
      "explicacao": "Criar uma tabela separada para clientes e referenciar o endereço elimina a redundância e mantém a consistência dos dados.",
      "fonte": "modelagem.normalizacao"
    },
    {
      "id": "banco-de-dados-int-04",
      "nivel": "intermediario",
      "pergunta": "Ao normalizar um banco de dados, você decide que algumas informações podem ser repetidas para melhorar a performance. Qual é o termo para essa prática?",
      "alternativas": {
        "a": "Desnormalização, que é feita com cautela e por motivos claros.",
        "b": "Redundância, que deve ser evitada a todo custo.",
        "c": "Normalização, que é o processo de eliminar dados duplicados.",
        "d": "Compilação, que se refere a juntar dados em uma única tabela."
      },
      "correta": "a",
      "explicacao": "Desnormalização é a prática de aceitar alguma redundância para melhorar a performance, mas deve ser uma decisão consciente.",
      "fonte": "modelagem.normalizacao"
    },
    {
      "id": "banco-de-dados-int-05",
      "nivel": "intermediario",
      "pergunta": "Você está criando um diagrama para modelar um sistema de gerenciamento de eventos. Qual é a principal vantagem de desenhar esse modelo antes de implementar?",
      "alternativas": {
        "a": "Permite visualizar entidades e relacionamentos, evitando problemas futuros na estrutura do banco.",
        "b": "Facilita a criação de tabelas diretamente no banco de dados sem planejamento.",
        "c": "Reduz a necessidade de documentação, já que tudo estará visualmente representado.",
        "d": "Acelera o processo de criação das tabelas no banco de dados."
      },
      "correta": "a",
      "explicacao": "Desenhar o modelo ajuda a visualizar entidades e relacionamentos, evitando retrabalho e problemas na estrutura do banco.",
      "fonte": "modelagem.modelagem"
    },
    {
      "id": "banco-de-dados-int-06",
      "nivel": "intermediario",
      "pergunta": "Você está otimizado uma consulta que está lenta e identificou uma varredura completa no plano de execução. O que você deve fazer primeiro?",
      "alternativas": {
        "a": "Criar um índice na coluna usada no filtro da consulta.",
        "b": "Reescrever a consulta para usar menos colunas.",
        "c": "Aumentar a memória do servidor para melhorar a performance.",
        "d": "Executar a consulta novamente para verificar se o problema persiste."
      },
      "correta": "a",
      "explicacao": "Criar um índice na coluna usada no filtro pode resolver a varredura completa, acelerando a consulta.",
      "fonte": "performance.tuning"
    },
    {
      "id": "banco-de-dados-int-07",
      "nivel": "intermediario",
      "pergunta": "Você notou que uma tabela com milhões de linhas está tendo consultas lentas. Qual abordagem inicial deve ser adotada para melhorar a performance?",
      "alternativas": {
        "a": "Criar índices em todas as colunas da tabela.",
        "b": "Analisar o plano de execução das consultas lentas.",
        "c": "Dividir a tabela em várias tabelas menores.",
        "d": "Aumentar o número de conexões permitidas no banco."
      },
      "correta": "b",
      "explicacao": "Analisar o plano de execução ajuda a identificar os problemas específicos que estão causando a lentidão nas consultas.",
      "fonte": "performance.tuning"
    },
    {
      "id": "banco-de-dados-int-08",
      "nivel": "intermediario",
      "pergunta": "Você precisa decidir quais colunas indexar em uma tabela. Qual critério você deve usar para essa decisão?",
      "alternativas": {
        "a": "Indexar todas as colunas para garantir que todas as consultas sejam rápidas.",
        "b": "Indexar apenas colunas que são frequentemente usadas em filtros, junções e ordenações.",
        "c": "Indexar colunas que têm muitos valores únicos, independentemente do uso.",
        "d": "Indexar colunas que já têm índices, para garantir redundância."
      },
      "correta": "b",
      "explicacao": "Indexar apenas colunas frequentemente usadas em filtros, junções e ordenações é a prática recomendada para equilibrar leitura e escrita.",
      "fonte": "performance.indices"
    },
    {
      "id": "banco-de-dados-int-09",
      "nivel": "intermediario",
      "pergunta": "Ao analisar o plano de execução de uma consulta, você percebe que o banco de dados está realizando uma varredura completa em uma tabela grande. Qual é a ação mais apropriada para resolver esse problema?",
      "alternativas": {
        "a": "Adicionar um índice na coluna que está sendo filtrada na consulta.",
        "b": "Aumentar o tamanho da tabela para melhorar a performance.",
        "c": "Alterar a consulta para incluir mais colunas do que o necessário.",
        "d": "Remover todos os índices existentes para evitar conflitos."
      },
      "correta": "a",
      "explicacao": "Adicionar um índice na coluna filtrada pode eliminar a varredura completa e acelerar a consulta.",
      "fonte": "performance.tuning"
    },
    {
      "id": "banco-de-dados-int-10",
      "nivel": "intermediario",
      "pergunta": "Você está criando um novo índice em uma tabela. Qual é um ponto importante a considerar antes de prosseguir?",
      "alternativas": {
        "a": "O índice deve ser criado em todas as colunas da tabela.",
        "b": "O índice deve ser criado apenas se houver um padrão de leitura que justifique sua criação.",
        "c": "O índice deve ser criado sem considerar o impacto nas operações de escrita.",
        "d": "O índice deve ser criado apenas se a tabela tiver menos de mil linhas."
      },
      "correta": "b",
      "explicacao": "Criar um índice deve ser justificado por um padrão de leitura que indique que ele trará benefícios significativos.",
      "fonte": "performance.indices"
    },
    {
      "id": "banco-de-dados-int-11",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um sistema de transferências bancárias. Após retirar dinheiro da conta A, o sistema falha antes de adicionar à conta B. O que você deve fazer para garantir a integridade da transação?",
      "alternativas": {
        "a": "Executar um ROLLBACK para desfazer a operação na conta A.",
        "b": "Confirmar a transação com um COMMIT para manter o estado atual.",
        "c": "Registrar a falha em um log e continuar com a operação na conta B.",
        "d": "Repetir a operação de transferência até que funcione corretamente."
      },
      "correta": "a",
      "explicacao": "A opção correta é desfazer a operação na conta A, garantindo que nenhuma parte da transação seja confirmada se houver falha, mantendo a integridade dos dados.",
      "fonte": "integridade.transacoes"
    },
    {
      "id": "banco-de-dados-int-12",
      "nivel": "intermediario",
      "pergunta": "Você precisa garantir que um pedido só possa ser associado a um cliente existente em seu banco de dados. Qual constraint você deve usar para garantir essa integridade referencial?",
      "alternativas": {
        "a": "NOT NULL para garantir que o campo cliente não fique vazio.",
        "b": "UNIQUE para impedir que dois pedidos tenham o mesmo cliente.",
        "c": "PRIMARY KEY para identificar pedidos de forma única.",
        "d": "FOREIGN KEY para garantir que o cliente associado ao pedido exista."
      },
      "correta": "d",
      "explicacao": "A FOREIGN KEY é a constraint que garante que um pedido só possa referenciar um cliente que realmente existe, mantendo a integridade referencial.",
      "fonte": "integridade.constraints"
    },
    {
      "id": "banco-de-dados-int-13",
      "nivel": "intermediario",
      "pergunta": "Em um sistema de cadastro de usuários, você quer garantir que nenhum usuário tenha o mesmo endereço de e-mail. Qual é a melhor prática para implementar essa regra no banco de dados?",
      "alternativas": {
        "a": "Usar a constraint UNIQUE na coluna de e-mail.",
        "b": "Fazer a validação na aplicação antes de inserir os dados.",
        "c": "Criar uma chave primária que inclua o e-mail como parte da identificação.",
        "d": "Usar a constraint NOT NULL para garantir que o e-mail sempre tenha um valor."
      },
      "correta": "a",
      "explicacao": "A constraint UNIQUE na coluna de e-mail é a melhor prática, pois garante que não haja duplicatas diretamente no banco de dados, independente da aplicação.",
      "fonte": "integridade.constraints"
    },
    {
      "id": "banco-de-dados-int-14",
      "nivel": "intermediario",
      "pergunta": "Você está implementando uma regra que proíbe a inserção de preços negativos em um sistema de vendas. Qual constraint deve ser utilizada para garantir essa regra?",
      "alternativas": {
        "a": "FOREIGN KEY para garantir que o preço esteja associado a um produto válido.",
        "b": "CHECK para validar que o preço é maior ou igual a zero.",
        "c": "UNIQUE para garantir que não existam preços duplicados.",
        "d": "NOT NULL para garantir que o preço sempre tenha um valor."
      },
      "correta": "b",
      "explicacao": "A constraint CHECK é a mais adequada para validar condições específicas, como garantir que o preço não seja negativo.",
      "fonte": "integridade.constraints"
    },
    {
      "id": "banco-de-dados-int-15",
      "nivel": "intermediario",
      "pergunta": "Você deseja implementar um sistema de rollback em caso de falhas durante uma transação. Qual comando SQL você deve usar para desfazer todas as operações realizadas até o momento?",
      "alternativas": {
        "a": "BEGIN para iniciar a transação.",
        "b": "COMMIT para confirmar todas as operações realizadas.",
        "c": "ROLLBACK para desfazer todas as operações realizadas.",
        "d": "UPDATE para modificar os dados na transação."
      },
      "correta": "c",
      "explicacao": "O comando ROLLBACK é o que desfaz todas as operações realizadas em uma transação, garantindo que o banco de dados retorne ao estado anterior em caso de falha.",
      "fonte": "integridade.transacoes"
    },
    {
      "id": "banco-de-dados-av-01",
      "nivel": "avancado",
      "pergunta": "Você precisa garantir que um usuário tenha acesso apenas a dados que ele deve manipular. Qual ação você deve tomar?",
      "alternativas": {
        "a": "Conceder todas as permissões para evitar problemas futuros.",
        "b": "Criar um usuário distinto e conceder apenas as permissões necessárias.",
        "c": "Permitir acesso total a todos os usuários para facilitar o trabalho.",
        "d": "Usar uma única conta para todos os usuários, assim todos têm as mesmas permissões."
      },
      "correta": "b",
      "explicacao": "Criar um usuário distinto e conceder apenas as permissões necessárias garante que o acesso seja controlado e seguro, seguindo o princípio do menor privilégio.",
      "fonte": "operacao.seguranca"
    },
    {
      "id": "banco-de-dados-av-02",
      "nivel": "avancado",
      "pergunta": "Você está configurando um backup e deseja minimizar a perda de dados. Qual estratégia deve ser adotada?",
      "alternativas": {
        "a": "Realizar backups completos a cada hora, mesmo que isso consuma muito espaço.",
        "b": "Fazer backups incrementais regularmente, em vez de completos sempre.",
        "c": "Fazer backups apenas uma vez por semana para economizar tempo.",
        "d": "Armazenar os backups no mesmo servidor para facilitar a recuperação."
      },
      "correta": "b",
      "explicacao": "Fazer backups incrementais permite economizar espaço e tempo, garantindo que você minimize a perda de dados entre os backups completos.",
      "fonte": "operacao.backup"
    },
    {
      "id": "banco-de-dados-av-03",
      "nivel": "avancado",
      "pergunta": "Você precisa restaurar um banco de dados após um erro humano. Qual é a melhor prática a seguir?",
      "alternativas": {
        "a": "Restaurar diretamente do backup mais recente sem testar antes.",
        "b": "Testar a restauração periodicamente para garantir que funcione quando necessário.",
        "c": "Confiar que o backup automático sempre funcionará sem necessidade de testes.",
        "d": "Usar uma réplica como substituto para o backup durante a restauração."
      },
      "correta": "b",
      "explicacao": "Testar a restauração periodicamente é crucial para garantir que você possa recuperar os dados corretamente quando necessário.",
      "fonte": "operacao.backup"
    },
    {
      "id": "banco-de-dados-av-04",
      "nivel": "avancado",
      "pergunta": "Você está implementando replicação em um banco de dados. Qual é a principal vantagem dessa técnica?",
      "alternativas": {
        "a": "A replicação garante que o banco de dados esteja sempre acessível, mesmo com falhas.",
        "b": "A replicação realiza backups automáticos a cada alteração no banco.",
        "c": "A replicação permite que todos os usuários acessem o banco ao mesmo tempo sem problemas.",
        "d": "A replicação elimina a necessidade de backups regulares."
      },
      "correta": "a",
      "explicacao": "A replicação mantém cópias vivas do banco, garantindo que ele continue acessível mesmo em caso de falhas na máquina principal.",
      "fonte": "operacao.replicacao"
    },
    {
      "id": "banco-de-dados-av-05",
      "nivel": "avancado",
      "pergunta": "Ao planejar a segurança do banco de dados, qual é a prática recomendada para dados sensíveis?",
      "alternativas": {
        "a": "Armazenar dados sensíveis em texto puro para fácil acesso.",
        "b": "Utilizar criptografia para proteger dados sensíveis.",
        "c": "Permitir acesso irrestrito a dados sensíveis para todos os usuários.",
        "d": "Não se preocupar com dados sensíveis, pois o banco é seguro."
      },
      "correta": "b",
      "explicacao": "Utilizar criptografia para proteger dados sensíveis é fundamental para garantir a segurança e a conformidade com leis de privacidade.",
      "fonte": "operacao.seguranca"
    },
    {
      "id": "banco-de-dados-av-06",
      "nivel": "avancado",
      "pergunta": "Você está configurando um sistema de replicação e precisa garantir que os dados não sejam corrompidos. O que deve ser evitado?",
      "alternativas": {
        "a": "Realizar operações de escrita apenas na réplica primária.",
        "b": "Permitir que todas as operações sejam feitas em qualquer réplica.",
        "c": "Sincronizar as réplicas com intervalos longos para evitar sobrecarga.",
        "d": "Desativar a replicação durante períodos de alta carga."
      },
      "correta": "a",
      "explicacao": "Realizar operações de escrita apenas na réplica primária evita a propagação de erros para as réplicas secundárias.",
      "fonte": "operacao.replicacao"
    },
    {
      "id": "banco-de-dados-av-07",
      "nivel": "avancado",
      "pergunta": "Você precisa garantir que um backup seja efetivo. O que deve ser feito regularmente?",
      "alternativas": {
        "a": "Aumentar o espaço de armazenamento sem testar o backup.",
        "b": "Testar a recuperação do backup periodicamente.",
        "c": "Fazer backups apenas quando houver mudanças significativas.",
        "d": "Confiar que o sistema de backup automático funciona sempre."
      },
      "correta": "b",
      "explicacao": "Testar a recuperação do backup periodicamente é essencial para garantir que ele funcione quando necessário.",
      "fonte": "operacao.backup"
    },
    {
      "id": "banco-de-dados-av-08",
      "nivel": "avancado",
      "pergunta": "Você está implementando um controle de acesso em um banco de dados. Qual é a abordagem correta?",
      "alternativas": {
        "a": "Conceder permissões amplas para evitar atrasos no trabalho.",
        "b": "Usar o princípio do menor privilégio para conceder acessos mínimos.",
        "c": "Permitir que todos os usuários tenham acesso total para facilitar o uso.",
        "d": "Criar um único usuário administrador para todos os acessos."
      },
      "correta": "b",
      "explicacao": "Usar o princípio do menor privilégio é fundamental para limitar o acesso e proteger os dados sensíveis.",
      "fonte": "operacao.seguranca"
    },
    {
      "id": "banco-de-dados-av-09",
      "nivel": "avancado",
      "pergunta": "Você está modelando um banco de dados para um e-commerce e precisa escolher um SGBD. Qual seria a melhor opção para começar, considerando acessibilidade e demanda no mercado?",
      "alternativas": {
        "a": "Oracle, por ser amplamente utilizado em grandes corporações",
        "b": "MySQL, por ser gratuito e muito difundido em aplicações web",
        "c": "PostgreSQL, por ser gratuito, robusto e bem documentado",
        "d": "SQL Server, por ser forte no ecossistema Microsoft"
      },
      "correta": "c",
      "explicacao": "PostgreSQL é recomendado por ser acessível, robusto e amplamente demandado no mercado, tornando-o uma ótima escolha para iniciantes.",
      "fonte": "carreira.sgbd"
    },
    {
      "id": "banco-de-dados-av-10",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um data mart comercial e precisa otimizar uma consulta lenta. Qual é o primeiro passo que você deve tomar para identificar o problema?",
      "alternativas": {
        "a": "Criar um índice em todas as colunas da tabela",
        "b": "Executar a consulta com o comando EXPLAIN para analisar o plano de execução",
        "c": "Aumentar a memória alocada para o banco de dados",
        "d": "Reduzir o volume de dados na tabela para melhorar a performance"
      },
      "correta": "b",
      "explicacao": "Usar o comando EXPLAIN permite analisar o plano de execução da consulta, ajudando a identificar gargalos e otimizar a performance.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "banco-de-dados-av-11",
      "nivel": "avancado",
      "pergunta": "Você está configurando um backup para um banco de dados. Qual prática é recomendada para garantir a integridade dos dados durante o processo?",
      "alternativas": {
        "a": "Realizar o backup apenas em horários de baixa utilização do sistema",
        "b": "Fazer backups incrementais sem verificar a integridade dos dados",
        "c": "Utilizar transações para garantir que o backup seja consistente",
        "d": "Armazenar o backup no mesmo servidor do banco de dados"
      },
      "correta": "c",
      "explicacao": "Utilizar transações durante o backup garante que os dados sejam consistentes e íntegros, evitando problemas de corrupção.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "banco-de-dados-av-12",
      "nivel": "avancado",
      "pergunta": "Você está modelando tabelas para um data mart e precisa garantir a integridade referencial. Qual abordagem é a mais adequada?",
      "alternativas": {
        "a": "Criar chaves primárias e estrangeiras adequadas nas tabelas",
        "b": "Utilizar apenas chaves primárias e ignorar as estrangeiras",
        "c": "Definir todas as colunas como NOT NULL para evitar dados nulos",
        "d": "Criar uma tabela de logs para registrar alterações em vez de usar constraints"
      },
      "correta": "a",
      "explicacao": "Criar chaves primárias e estrangeiras é essencial para garantir a integridade referencial entre as tabelas no banco de dados.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "banco-de-dados-av-13",
      "nivel": "avancado",
      "pergunta": "Você está em um processo de otimização de um banco de dados e precisa escolher um índice. Qual é o critério mais importante a considerar ao selecionar o tipo de índice?",
      "alternativas": {
        "a": "O tipo de dados da coluna que será indexada",
        "b": "A frequência com que a coluna é atualizada",
        "c": "O número de registros na tabela",
        "d": "A quantidade de consultas que utilizam a coluna"
      },
      "correta": "d",
      "explicacao": "A quantidade de consultas que utilizam a coluna é o critério mais importante, pois um índice deve ser criado para colunas frequentemente consultadas para melhorar a performance.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "banco-de-dados-av-14",
      "nivel": "avancado",
      "pergunta": "Você está revisando seu portfólio para se candidatar a uma vaga de DBA. Qual projeto deve ser priorizado para demonstrar suas habilidades práticas?",
      "alternativas": {
        "a": "Um projeto que apenas cria tabelas de exemplo",
        "b": "Um projeto que otimiza consultas lentas em um banco real",
        "c": "Um projeto que apenas documenta teorias sobre bancos de dados",
        "d": "Um projeto que não envolve dados reais"
      },
      "correta": "b",
      "explicacao": "Um projeto que otimiza consultas lentas em um banco real demonstra habilidades práticas e a capacidade de lidar com problemas reais, o que é valorizado no mercado.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "banco-de-dados-av-15",
      "nivel": "avancado",
      "pergunta": "Você está aprendendo sobre replicação de dados. Qual é o principal objetivo desse processo em um ambiente de banco de dados?",
      "alternativas": {
        "a": "Aumentar o número de usuários simultâneos no banco de dados",
        "b": "Garantir a segurança dos dados armazenados",
        "c": "Manter cópias do banco de dados em sincronia para alta disponibilidade",
        "d": "Reduzir o tamanho do banco de dados"
      },
      "correta": "c",
      "explicacao": "O principal objetivo da replicação é manter cópias do banco de dados em sincronia, garantindo alta disponibilidade e recuperação em caso de falhas.",
      "fonte": "carreira.sgbd"
    }
  ]
};

export default pool;
