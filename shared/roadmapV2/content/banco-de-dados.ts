// TODO(Ana): revisao editorial do upgrade da fase 3c, lote 3 (folha nova de
// replicacao e alta disponibilidade, fecho do projeto reescrito, fechos de
// criterio, conexoes nominais, blocos de codigo, troca do w3schools por doc
// canonica e resources novos). Enquadramento de papel: guardar, modelar e
// responder rapido; indice, plano de execucao e transacao sao o assunto
// principal, nao coadjuvantes.
import type { RoadmapV2 } from "../types";

export const bancoDeDados: RoadmapV2 = {
  slug: "banco-de-dados",
  area: "banco-de-dados",
  title: "Banco de Dados e DBA do Zero",
  level: "Iniciante",
  description:
    "De SQL e modelagem a índices, transações, backup e segurança: como manter bancos de dados rápidos, seguros e confiáveis. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é um banco de dados, o que faz quem cuida dele e os grandes tipos que existem.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "Banco de dados e o papel do DBA",
          description:
            "Onde os dados de uma empresa vivem, e quem garante que continuem vivos.",
          content:
            "Um **banco de dados** é onde a informação de um sistema fica guardada de forma organizada e permanente: os usuários de um app, os pedidos de uma loja, os registros de um hospital. Praticamente toda empresa que guarda informação depende de bancos de dados, e quando eles ficam lentos, perdem dados ou saem do ar, o negócio para.\n\nO **DBA** (administrador de banco de dados) é o profissional que mantém esses bancos funcionando bem: rápidos, seguros, disponíveis e sem perda de dados. Não é quem escreve a aplicação, mas quem garante que a fundação de dados sobre a qual ela roda seja sólida. Ajusta consultas lentas, planeja e testa backups, controla quem pode acessar o quê, modela a estrutura das tabelas e cuida da segurança e da integridade.\n\nÉ uma área com características próprias que atraem um perfil específico. Valoriza quem é **metódico, organizado e cuidadoso**, com paciência pra investigar problemas e preocupação genuína com confiabilidade e segurança. Quem prefere estabilidade a novidade constante tende a gostar: é uma área madura e essencial, presente em quase toda empresa, com demanda estável e salários sólidos.\n\nUm ponto de contexto: a fronteira entre DBA, engenharia de dados e back-end é fluida, e muitos profissionais transitam por elas. Mas o foco do DBA é claro: a saúde, a performance e a segurança do banco em si. Esta trilha te leva do SQL aos temas que distinguem um bom DBA, como índices, transações e backup, na ordem certa.",
        },
        {
          id: "fundamentos.sgbd",
          title: "O que é um SGBD",
          description:
            "O software que gerencia o banco e faz o trabalho pesado por você.",
          content:
            "Você não conversa diretamente com os arquivos onde os dados ficam gravados; conversa com um **SGBD** (Sistema Gerenciador de Banco de Dados), o software que administra tudo. Ele recebe seus comandos, guarda e busca os dados de forma eficiente, garante que várias pessoas usem o banco ao mesmo tempo sem conflito, e cuida de segurança, integridade e recuperação. É a camada entre você e os dados.\n\nOs SGBDs relacionais mais conhecidos são o **PostgreSQL** e o **MySQL** (ambos gratuitos e de código aberto), o **SQL Server** (da Microsoft) e o **Oracle** (forte em grandes corporações). Todos falam **SQL**, a linguagem padrão, com pequenas variações de dialeto entre eles. Por isso, aprender SQL bem é um conhecimento que viaja entre os bancos.\n\nUma boa notícia pra escolha de estudo: o **PostgreSQL** é uma excelente porta de entrada. É gratuito, robusto, respeitado no mercado e muito pedido em vagas, além de ter documentação oficial excelente. A recomendação comum é dominar SQL e os conceitos com ele, porque o que você aprende se transfere com facilidade pros outros SGBDs.\n\nO SGBD faz por você um trabalho imenso que seria inviável na mão: indexação pra buscas rápidas, controle de acesso simultâneo, garantia de que uma operação não corrompa os dados, recuperação após falhas. Entender que existe esse software cuidando de tudo, e como tirar o melhor dele, é a essência do trabalho de banco de dados. Os próximos temas da trilha são, em boa parte, sobre comandar bem o SGBD.",
        },
        {
          id: "fundamentos.relacionalnosql",
          title: "Relacional e NoSQL",
          description:
            "Os dois grandes modelos de banco de dados e quando cada um faz sentido.",
          content:
            'Bancos de dados se dividem em duas grandes famílias, e entender a diferença ajuda a escolher a ferramenta certa pra cada problema.\n\nOs bancos **relacionais** (também chamados SQL) organizam os dados em **tabelas** com linhas e colunas, relacionadas entre si por chaves. São a escolha mais comum e madura, ideais quando os dados têm estrutura clara e a consistência é crítica (sistemas financeiros, cadastros, e-commerce). PostgreSQL, MySQL, SQL Server e Oracle são relacionais, e o SQL é a sua linguagem. A maior parte desta trilha foca neles, porque dominam o mercado e são a base do conhecimento.\n\nOs bancos **NoSQL** (não relacionais) surgiram pra casos onde o modelo de tabelas não encaixa bem. Há vários tipos: bancos de documentos (que guardam dados em estruturas flexíveis, como o MongoDB), de chave e valor, de grafos, entre outros. Eles abrem mão de parte da rigidez (e às vezes de garantias de consistência) em troca de flexibilidade e de escala mais fácil pra certos cenários, como volumes enormes ou dados sem estrutura fixa.\n\nUma armadilha comum é achar que NoSQL é "melhor" ou mais moderno e usá-lo em tudo. Não é assim: na maioria dos casos de negócio, um banco relacional bem modelado é a escolha mais segura e adequada, e o NoSQL brilha em problemas específicos. A maturidade está em escolher pelo problema, não pela moda.\n\nPra começar, foque no mundo **relacional e em SQL**, que é a base sólida e mais empregável. Entenda que o NoSQL existe e quando faz sentido, e aprofunde nele conforme a necessidade aparecer.',
          resources: [
            {
              label: "MongoDB: documentação oficial (banco NoSQL)",
              url: "https://www.mongodb.com/docs/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "sql",
      title: "SQL",
      description:
        "A linguagem dos bancos de dados, do básico ao avançado: a competência central de quem trabalha com dados.",
      level: "iniciante",
      children: [
        {
          id: "sql.basico",
          title: "Consultar dados",
          description: "O SELECT e seus companheiros, a base de tudo.",
          content:
            "O **SQL** é a linguagem pra conversar com bancos relacionais, e o ponto de partida é aprender a **consultar** dados. O comando central é o `SELECT`, e ele é surpreendentemente legível, quase inglês corrente.\n\nA forma básica escolhe colunas de uma tabela: `SELECT nome, email FROM clientes` traz essas duas colunas de todos os clientes. A partir daí, você refina com poucos elementos essenciais. O `WHERE` filtra por condição (`WHERE cidade = 'Salvador'`), combinando condições com `AND` e `OR`, e com operadores úteis como `BETWEEN` pra faixas, `IN` pra listas e `LIKE` pra buscar trechos de texto. O `ORDER BY` ordena o resultado (`ORDER BY data DESC` mostra os mais recentes primeiro). E o `LIMIT` corta a quantidade de linhas.\n\nEsses comandos respondem a maior parte das perguntas do dia a dia, e a leitura quase em inglês é uma das razões de o SQL ter sobrevivido por décadas praticamente sem mudar. Um detalhe que pega iniciantes: valores ausentes, o famoso `NULL`, têm regras próprias e não se comportam como zero ou texto vazio, então confira sempre se o filtro trouxe o que você esperava.\n\nPra praticar, o PostgreSQL é gratuito e robusto, e o tutorial oficial dele cobre o SQL de forma direta. Comece criando uma tabela pequena, inserindo dados e rodando seus primeiros `SELECT` pra sentir como a consulta responde. Esse é o alicerce de tudo o que vem depois: sem consultar bem, nada do resto faz sentido.",
          resources: [
            {
              label: "PostgreSQL: tutorial de SQL (oficial)",
              url: "https://www.postgresql.org/docs/current/tutorial-sql.html",
              kind: "doc",
            },
            {
              label: "PostgreSQL: consultar uma tabela (oficial)",
              url: "https://www.postgresql.org/docs/current/tutorial-select.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "sql.manipular",
          title: "Inserir, atualizar e apagar",
          description:
            "Os comandos que modificam os dados, com o cuidado que eles exigem.",
          content:
            "Além de consultar, você precisa **modificar** os dados, e três comandos fazem isso. O `INSERT` adiciona novas linhas a uma tabela. O `UPDATE` altera linhas existentes. O `DELETE` remove linhas. Juntos com o `SELECT`, formam o conjunto conhecido como **CRUD** (criar, ler, atualizar, apagar), a base de qualquer manipulação de dados.\n\nA sintaxe é direta: `INSERT INTO clientes (nome, email) VALUES ('Ana', 'ana@email.com')` cria um cliente; `UPDATE clientes SET email = 'novo@email.com' WHERE id = 5` altera um; `DELETE FROM clientes WHERE id = 5` remove um.\n\nMas aqui mora um dos perigos mais clássicos e dolorosos do trabalho com bancos, que vale gravar a ferro: o **`WHERE` no `UPDATE` e no `DELETE`**. Se você esquecer a cláusula `WHERE`, o comando se aplica a **todas as linhas** da tabela. Um `DELETE FROM clientes` sem `WHERE` apaga todos os clientes; um `UPDATE` sem `WHERE` sobrescreve a tabela inteira. Histórias de terror de produção nasceram exatamente assim, e a recuperação depende de ter backup.\n\nPor isso, alguns hábitos de segurança são regra entre profissionais. Antes de um `UPDATE` ou `DELETE`, rode primeiro um `SELECT` com o **mesmo** `WHERE` pra ver exatamente quais linhas serão afetadas. Trabalhe sempre sabendo que existe um backup. E, em bancos reais, isso se conecta ao passo Transações e ACID, que permite desfazer uma operação antes de confirmá-la. Manipular dados é poderoso e arriscado; o cuidado aqui é o que separa o profissional do amador.",
          resources: [
            {
              label: "PostgreSQL: manipulação de dados (oficial)",
              url: "https://www.postgresql.org/docs/current/dml.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "sql.avancado",
          title: "SQL avançado",
          description:
            "Joins, agregações e subconsultas, o que separa o básico do uso profissional.",
          content:
            'O SQL do dia a dia profissional vai além de consultar uma tabela. Três recursos elevam seu domínio e aparecem o tempo todo.\n\nOs **joins** combinam dados de várias tabelas. Como os dados ficam divididos em tabelas relacionadas (clientes numa, pedidos noutra), o `JOIN` as liga por uma coluna em comum pra responder perguntas como "quanto cada cliente gastou?". Há tipos diferentes, e a distinção importa: o `INNER JOIN` traz só linhas com correspondência nas duas tabelas, enquanto os `OUTER JOIN` (como o `LEFT JOIN`) trazem também as sem correspondência, essenciais pra perguntas como "quais clientes nunca compraram?". Escolher o tipo errado gera resultados silenciosamente incorretos.\n\nAs **agregações** resumem muitas linhas em números: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, combinadas com o `GROUP BY` pra agrupar por categoria ("total de vendas por mês"). É a base de quase todo relatório, e o `HAVING` filtra os grupos depois de agregar.\n\nAs **subconsultas** são consultas dentro de consultas, úteis pra perguntas em duas etapas ("clientes que gastaram acima da média"), e as **CTEs** (cláusulas `WITH`) organizam consultas complexas em passos legíveis.\n\nDominar esses recursos é o que distingue quem arranha o SQL de quem o usa profissionalmente, e é especialmente importante pra um DBA, que precisa entender consultas complexas pra otimizá-las. Pratique com perguntas reais sobre um conjunto de dados; a fluência vem de resolver problemas, não de ler sintaxe. Com esse arsenal, você está pronto pros temas que tornam um banco rápido e confiável.',
          resources: [
            {
              label: "PostgreSQL: joins entre tabelas (oficial)",
              url: "https://www.postgresql.org/docs/current/tutorial-join.html",
              kind: "doc",
            },
            {
              label: "PostgreSQL: funções de agregação (oficial)",
              url: "https://www.postgresql.org/docs/current/tutorial-agg.html",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "modelagem",
      title: "Modelagem de dados",
      description:
        "Desenhar a estrutura das tabelas de forma que o banco seja correto, eficiente e sem redundância.",
      level: "intermediario",
      children: [
        {
          id: "modelagem.modelagem",
          title: "Modelar a estrutura",
          description:
            "Decidir quais tabelas existem e como elas se relacionam.",
          content:
            "Antes de criar tabelas no improviso, vem a **modelagem**: pensar quais entidades o sistema tem e como elas se conectam. Uma boa modelagem evita retrabalho doloroso depois, quando já existem dados de verdade e mudar a estrutura vira uma cirurgia arriscada.\n\nO ponto de partida é identificar as **entidades** (as coisas sobre as quais você guarda dados: clientes, produtos, pedidos) e os **relacionamentos** entre elas. A peça que liga tabelas é a **chave estrangeira**: a tabela de pedidos guarda o id do cliente dono, criando a relação. O tipo mais comum é o **um para muitos** (um cliente tem muitos pedidos). Existem outros, como o **muitos para muitos** (um pedido tem vários produtos e um produto está em vários pedidos), resolvido com uma tabela intermediária no meio.\n\nDuas decisões aparecem em cada tabela. Quais **colunas** ela tem, com o **tipo de dado** certo (texto, número, data, booleano), porque escolher o tipo adequado importa pra integridade e performance. E qual é a **chave primária**, a coluna que identifica cada linha de forma única (em geral um id), essencial pra relacionar e localizar registros.\n\nUma boa prática é desenhar o modelo antes de criar, visualizando entidades e relacionamentos num diagrama. Isso revela problemas no papel, antes de custarem caro. Modelar bem é uma habilidade de design que recompensa quem pensa antes de sair criando tabelas, e é uma das competências centrais do trabalho com bancos de dados. A normalização, próximo passo, é a técnica que disciplina esse desenho.",
          resources: [
            {
              label: "PostgreSQL: definição de dados (oficial)",
              url: "https://www.postgresql.org/docs/current/ddl.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "modelagem.normalizacao",
          title: "Normalização",
          description:
            "A técnica que elimina redundância e mantém os dados consistentes.",
          content:
            'A **normalização** é um conjunto de regras pra organizar as tabelas de forma a **eliminar redundância** e evitar inconsistências. É um dos conceitos mais importantes da modelagem relacional, e entendê-lo bem é marca de quem domina bancos de dados.\n\nO problema que ela resolve fica claro num exemplo. Imagine uma tabela de pedidos onde, em cada linha, você repete o nome e o endereço completo do cliente. Se o cliente tem cem pedidos, o endereço dele está repetido cem vezes. Isso desperdiça espaço, mas o pior é a **inconsistência**: se ele muda de endereço, você precisa atualizar cem linhas, e se esquecer uma, o banco passa a ter duas verdades diferentes. Qual está certa?\n\nA normalização resolve isso **separando** os dados em tabelas distintas, sem repetição. O cliente fica numa tabela de clientes, com seu endereço guardado **uma vez**, e a tabela de pedidos apenas referencia o cliente por uma chave estrangeira. Mudou o endereço? Você atualiza num lugar só, e todos os pedidos passam a refletir o dado correto. Cada informação tem uma única fonte da verdade.\n\nA normalização é descrita em níveis (as "formas normais"), mas pra a maioria dos casos práticos, dominar a ideia central já leva longe: cada dado deve viver num lugar só, sem repetição, com as tabelas conectadas por chaves.\n\nVale uma nuance que você reverá: às vezes, por performance, faz sentido **desnormalizar** de propósito (aceitar alguma redundância pra acelerar leituras), especialmente em cenários de análise. Mas isso é uma decisão consciente, tomada depois de entender a normalização, não uma desculpa pra modelar mal. Comece normalizando bem; desnormalize só com motivo claro.',
        },
      ],
    },
    {
      id: "performance",
      title: "Performance",
      description:
        "O que separa um DBA bom de um iniciante: fazer o banco responder rápido mesmo com muitos dados.",
      level: "intermediario",
      children: [
        {
          id: "performance.indices",
          title: "Índices",
          description:
            "A estrutura que faz buscas em milhões de linhas serem instantâneas.",
          content:
            "O **índice** é provavelmente o conceito de performance mais importante em bancos de dados, e entendê-lo bem é, segundo a sabedoria da área, o que mais separa um DBA competente de um iniciante.\n\nA analogia clássica explica tudo: um índice de banco de dados funciona como o índice remissivo de um livro. Pra achar um assunto, você não lê o livro inteiro página por página; vai ao índice no fim, que aponta direto a página certa. Sem índice, o banco faz exatamente isso de ruim: percorre **todas** as linhas da tabela pra encontrar o que você pediu (uma varredura completa). Numa tabela com milhões de linhas, isso é lento. Com um índice na coluna buscada, ele vai direto ao ponto, e a busca que levava segundos passa a levar milésimos.\n\nNa prática, você cria índices nas colunas mais usadas em filtros (`WHERE`), em junções (`JOIN`) e em ordenações (`ORDER BY`). A chave primária já costuma ter um índice automático.\n\nMas índice não é mágica grátis, e aqui mora a nuance que diferencia quem entende de verdade: cada índice **acelera leituras** mas **desacelera escritas** (porque o índice também precisa ser atualizado a cada `INSERT`, `UPDATE` ou `DELETE`) e **ocupa espaço**. Por isso, indexar tudo é um erro: você cria índices nas colunas que realmente se beneficiam, não em todas. Encontrar esse equilíbrio, entre buscas rápidas e escritas eficientes, é uma decisão constante de quem cuida de performance.\n\nSaber quando criar um índice, em qual coluna, e medir o ganho real é uma habilidade central do DBA. Você domina este passo quando decide indexar (ou não) uma coluna justificando pelo padrão de leitura e escrita dela, não por reflexo. E isso se conecta ao passo Tuning e planos de execução, que ensina a ler o que o banco de fato faz.",
          resources: [
            {
              label: "PostgreSQL: índices (oficial)",
              url: "https://www.postgresql.org/docs/current/indexes.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "performance.tuning",
          title: "Tuning e planos de execução",
          description:
            "Descobrir por que uma consulta é lenta e como deixá-la rápida.",
          content:
            "Quando uma consulta está lenta, o DBA precisa descobrir **por quê** antes de consertar, e a ferramenta pra isso é o **plano de execução**. Otimizar consultas com base nele é o trabalho que chamamos de tuning, e é uma das atividades mais valorizadas da área.\n\nO plano de execução é o passo a passo que o SGBD planeja pra responder à sua consulta: quais tabelas ele vai ler, em que ordem, se vai usar um índice ou varrer a tabela inteira, como vai juntar os dados. Você o vê usando o comando **`EXPLAIN`** (e variações como `EXPLAIN ANALYZE`, que executa e mostra os tempos reais) antes da sua consulta:\n\n```sql\nEXPLAIN ANALYZE\nSELECT * FROM vendas\nWHERE cliente_id = 42;\n```\n\nÉ como pedir ao banco que mostre o raciocínio dele antes de agir.\n\nLer esse plano revela os culpados pela lentidão. O sinal mais comum é uma **varredura completa** (sequential scan) numa tabela grande, onde o banco lê todas as linhas porque falta um índice adequado, justamente o problema que os índices resolvem. Outros vilões incluem junções ineficientes e consultas que pedem dados demais sem necessidade.\n\nCom o diagnóstico em mãos, o tuning age: criar o índice que falta, reescrever a consulta de forma mais eficiente, pedir só as colunas necessárias, ou ajustar a estrutura. E o ciclo se fecha medindo de novo, pra confirmar que o ajuste de fato acelerou.\n\nA mentalidade certa é a do investigador: não chute o que está lento, **meça**. O plano de execução transforma a otimização de adivinhação em diagnóstico baseado em evidência. Você domina este passo quando lê um plano de execução, aponta a varredura completa que trava a consulta e prova, medindo, que o índice certo a acelerou. Essa capacidade de pegar uma consulta lenta numa base grande, entender o porquê e torná-la rápida é, na prática, o que define o valor de um DBA experiente.",
          resources: [
            {
              label: "PostgreSQL: usando o EXPLAIN (oficial)",
              url: "https://www.postgresql.org/docs/current/using-explain.html",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "integridade",
      title: "Integridade e transações",
      description:
        "Garantir que os dados permaneçam corretos, mesmo com muitas operações acontecendo ao mesmo tempo.",
      level: "intermediario",
      children: [
        {
          id: "integridade.transacoes",
          title: "Transações e ACID",
          description:
            "Agrupar operações de forma que ou tudo acontece, ou nada acontece.",
          content:
            "Uma **transação** é um grupo de operações que o banco trata como uma unidade indivisível: ou **todas** acontecem com sucesso, ou **nenhuma** acontece. Esse conceito é a espinha dorsal da confiabilidade dos bancos de dados, e entendê-lo é essencial.\n\nO exemplo clássico é uma transferência bancária: tirar dinheiro da conta A e colocar na conta B são duas operações que precisam acontecer juntas. Imagine se o sistema tira da conta A e, antes de colocar na B, ele falha. O dinheiro simplesmente sumiu. A transação impede isso: as duas operações ficam dentro de uma transação, e se qualquer parte falha, o banco **desfaz tudo** (um rollback), deixando o estado como estava antes. Só quando tudo dá certo, a transação é **confirmada** (commit) e as mudanças se tornam permanentes.\n\nAs garantias de uma transação são resumidas na sigla **ACID**. **Atomicidade**: tudo ou nada, como no exemplo. **Consistência**: o banco vai de um estado válido a outro válido, respeitando as regras. **Isolamento**: transações simultâneas não interferem umas nas outras de forma indevida. E **Durabilidade**: uma vez confirmada, a transação sobrevive até a uma queda de energia.\n\nNa prática, você inicia uma transação, executa os comandos, e decide entre `COMMIT` (confirmar) ou `ROLLBACK` (desfazer):\n\n```sql\nBEGIN;\nUPDATE conta SET saldo = saldo - 100 WHERE id = 1;\nUPDATE conta SET saldo = saldo + 100 WHERE id = 2;\nCOMMIT;\n```\n\nIsso conecta com o cuidado do `UPDATE` e `DELETE`: dentro de uma transação, você pode executar, conferir o resultado, e desfazer com `ROLLBACK` se algo estiver errado, antes de confirmar.\n\nTransações são o que permite confiar que um banco não vai corromper dados no meio de uma operação, mesmo com falhas. Para um DBA, dominar esse conceito é inegociável, porque a integridade dos dados depende dele.",
          resources: [
            {
              label: "PostgreSQL: transações (oficial)",
              url: "https://www.postgresql.org/docs/current/tutorial-transactions.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "integridade.constraints",
          title: "Integridade e constraints",
          description:
            "Fazer o próprio banco garantir as regras dos dados, sem depender da aplicação.",
          content:
            'A **integridade dos dados** é a garantia de que os dados guardados são válidos e coerentes. A melhor forma de garanti-la é fazer o **próprio banco** impor as regras, através de **constraints** (restrições), em vez de confiar que a aplicação sempre vai fazer a coisa certa. Regra que mora só no código da aplicação cedo ou dia é furada; regra no banco vale pra sempre, venha o dado de onde vier.\n\nAs principais constraints. A **NOT NULL** garante que uma coluna obrigatória nunca fique vazia (um pedido sem cliente não deveria existir). A **UNIQUE** impede valores repetidos onde eles não fazem sentido (dois usuários com o mesmo email). A **PRIMARY KEY** combina as duas, identificando cada linha de forma única e obrigatória. A **CHECK** valida uma condição (um preço não pode ser negativo, uma idade deve ser positiva).\n\nE a mais importante pra integridade entre tabelas, a **FOREIGN KEY** (chave estrangeira): ela garante a **integridade referencial**, ou seja, que um pedido só possa apontar pra um cliente que realmente existe. Sem ela, você poderia ter pedidos "órfãos", apontando pra clientes que foram apagados, deixando o banco inconsistente. A chave estrangeira impede isso, recusando operações que quebrariam a relação.\n\nO princípio é poderoso: as constraints transformam o banco num **guardião ativo** da qualidade dos dados. Em vez de torcer pra que ninguém insira lixo, você define as regras uma vez, na estrutura, e o banco as faz cumprir automaticamente, rejeitando qualquer dado que as viole. Pra um DBA, modelar boas constraints é construir a confiabilidade na fundação, o lugar mais difícil de furar.',
          resources: [
            {
              label: "PostgreSQL: constraints (oficial)",
              url: "https://www.postgresql.org/docs/current/ddl-constraints.html",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "operacao",
      title: "Backup e segurança",
      description:
        "As responsabilidades que protegem a empresa do pior: perder dados ou ter acesso indevido.",
      level: "avancado",
      children: [
        {
          id: "operacao.backup",
          title: "Backup e recuperação",
          description:
            "A rede de segurança sem a qual nenhum banco deveria operar.",
          content:
            "Se há uma responsabilidade que define o DBA, é o **backup**. Bancos guardam o ativo mais valioso de muitas empresas (seus dados), e perdê-los pode ser fatal pro negócio. Falhas de disco, erros humanos (aquele `DELETE` sem `WHERE`), ataques e desastres acontecem. O backup é a rede de segurança que permite recuperar, e operar um banco sério sem backup é negligência grave.\n\nDois conceitos andam juntos e são igualmente importantes. O **backup** é a cópia dos dados, feita regularmente. A **recuperação** (restore) é o processo de trazer esses dados de volta a partir do backup quando algo dá errado. Um sem o outro não serve.\n\nAqui mora a lição mais repetida e mais ignorada da área: **um backup que nunca foi testado não é um backup, é uma esperança**. Muita gente configura backups automáticos e dorme tranquila, até o dia do desastre, quando descobre que o backup estava corrompido, incompleto ou que ninguém sabe como restaurá-lo sob pressão. O DBA profissional **testa a restauração** periodicamente, simulando o desastre, pra ter certeza de que funciona quando precisar.\n\nAlguns conceitos guiam uma boa estratégia. A **frequência**: com que regularidade fazer backup, equilibrando o quanto de dado você aceita perder no pior caso. A diferença entre backup **completo** (tudo) e **incremental** (só o que mudou desde o último), pra economizar tempo e espaço. E guardar cópias em **lugares diferentes**, porque um backup no mesmo servidor que falhou não ajuda em nada.\n\nPlanejar, automatizar e, principalmente, **testar** as rotinas de backup e recuperação é uma das tarefas mais críticas do DBA. É o trabalho invisível que ninguém nota até o dia em que salva a empresa.",
          resources: [
            {
              label: "PostgreSQL: backup e restauração (oficial)",
              url: "https://www.postgresql.org/docs/current/backup.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "operacao.replicacao",
          title: "Réplicas e alta disponibilidade",
          description:
            "Manter cópias vivas do banco pra continuar de pé quando uma máquina cai.",
          content:
            "Todo banco visto até aqui roda numa máquina só. E aí vem a pergunta que tira o sono de quem opera produção: **se essa máquina cair, e os dados?** O backup do passo anterior ajuda, mas restaurar leva tempo, e enquanto isso o sistema fica fora do ar. A resposta pra continuidade é a **replicação**.\n\nReplicar é manter uma ou mais **cópias vivas** do banco, sincronizadas em tempo quase real. A **réplica primária** recebe as escritas; cada mudança é transmitida pras **réplicas secundárias**, que ficam de prontidão com o mesmo dado. Se a primária cai, uma secundária assume o posto, uma manobra chamada **failover**, e o sistema segue de pé com interrupção mínima.\n\nHá um segundo ganho: as réplicas **escalam a leitura**. Consultas pesadas de relatório podem rodar numa secundária, aliviando a primária, que fica livre pras escritas. É um jeito comum de aguentar mais carga sem trocar de máquina.\n\nAgora o par que todo iniciante confunde e que um DBA nunca pode errar: **backup e replicação não são a mesma coisa**. A réplica copia tudo na hora, inclusive o erro: um `DELETE` sem `WHERE` na primária se propaga pras secundárias em segundos. O backup guarda o **passado**, um retrato de antes do desastre, e é a única coisa que traz o dado de volta depois de um erro humano. Réplica protege da máquina que queima; backup protege do comando que não devia ter rodado. Banco sério tem os dois.\n\nVocê domina este passo quando explica, sem hesitar, por que uma réplica não substitui um backup.",
          resources: [
            {
              label: "PostgreSQL: alta disponibilidade e replicação (oficial)",
              url: "https://www.postgresql.org/docs/current/high-availability.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "operacao.seguranca",
          title: "Controle de acesso e segurança",
          description: "Garantir que cada um acesse apenas os dados que deve.",
          content:
            'O banco de dados costuma guardar a informação mais sensível de uma empresa, então **controlar quem acessa o quê** é uma responsabilidade central do DBA. Segurança de banco de dados é, em boa parte, gestão de acesso e proteção dos dados.\n\nO mecanismo básico são **usuários e permissões**. Em vez de todo mundo usar uma conta todo-poderosa, você cria usuários distintos e concede a cada um apenas as permissões de que precisa, usando comandos como `GRANT` (conceder) e `REVOKE` (revogar). Uma aplicação que só lê relatórios não deveria ter permissão de apagar tabelas; um estagiário não deveria acessar dados de salário. Essa granularidade contém o estrago caso uma conta seja comprometida.\n\nO princípio que orienta tudo é o **menor privilégio**: dar a cada usuário, aplicação ou pessoa o mínimo de acesso necessário pra fazer seu trabalho, e nada além. O oposto, dar acesso amplo "pra facilitar", é a porta aberta pra vazamentos e acidentes. É o mesmo princípio que aparece em segurança e em nuvem, aplicado aos dados.\n\nOutros cuidados importam. Os **dados sensíveis** (senhas, dados pessoais, financeiros) merecem proteção extra, como criptografia, e nunca devem ser guardados de forma descuidada, especialmente senhas, que jamais ficam em texto puro. A **proteção da conexão** com o banco e a atenção às **leis de privacidade** completam o quadro, já que tratar dados pessoais traz obrigações legais.\n\nPara o DBA, segurança não é um extra; é parte do trabalho diário de manter o banco confiável. Junto com o backup, forma a dupla que protege a empresa do que ela mais teme: perder dados ou tê-los acessados por quem não deveria.',
          resources: [
            {
              label: "PostgreSQL: privilégios e controle de acesso (oficial)",
              url: "https://www.postgresql.org/docs/current/ddl-priv.html",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "carreira",
      title: "Aprofundamento e carreira",
      description:
        "Escolher um banco pra dominar e dar os primeiros passos numa carreira estável e essencial.",
      level: "avancado",
      children: [
        {
          id: "carreira.sgbd",
          title: "Escolher e aprofundar num SGBD",
          description:
            "Dominar um banco específico depois de aprender os fundamentos.",
          content:
            "Os fundamentos desta trilha (SQL, modelagem, índices, transações, backup, segurança) valem pra praticamente qualquer banco relacional. Mas, em algum momento, vale **escolher um SGBD específico pra aprofundar**, porque cada um tem suas particularidades, ferramentas e detalhes de administração que o mercado valoriza.\n\nUm panorama pra orientar a escolha. O **PostgreSQL** é a recomendação mais comum pra começar e aprofundar: gratuito, robusto, com recursos avançados, documentação excelente e muito pedido em vagas. O **MySQL** é outro gratuito muito difundido, especialmente em aplicações web. O **SQL Server**, da Microsoft, é forte em empresas que usam o ecossistema Microsoft, e a Microsoft oferece trilhas de aprendizado gratuitas. O **Oracle** domina grandes corporações e bancos, com um mundo próprio de ferramentas e certificações, e tende a aparecer em vagas mais corporativas e bem pagas.\n\nA recomendação prática, em linha com o mercado, é **aprofundar no PostgreSQL** primeiro, por ser acessível, gratuito e amplamente demandado. A partir dele, migrar pra outro SGBD é uma questão de aprender as diferenças, não de recomeçar, porque os conceitos centrais são os mesmos.\n\nAo aprofundar, você entra em temas mais específicos de administração: configuração e ajuste fino do servidor, monitoramento, replicação (manter cópias do banco em sincronia pra disponibilidade), alta disponibilidade e recuperação avançada. Esses são os temas que distinguem um DBA experiente, e cada SGBD tem seu jeito de fazê-los.\n\nNão tente dominar todos os bancos ao mesmo tempo. Escolha um, aprofunde de verdade, e deixe os conceitos transferíveis fazerem o trabalho de te aproximar dos outros quando precisar.",
          resources: [
            {
              label: "Microsoft Learn: SQL Server (oficial)",
              url: "https://learn.microsoft.com/en-us/sql/sql-server/",
              kind: "doc",
            },
          ],
        },
        {
          id: "carreira.projeto",
          title: "Projeto final: data mart comercial",
          description:
            "Modelagem, carga e consultas de um data mart de vendas, o fecho prático da trilha.",
          content:
            "Olhe pra trás um instante: você entrou nesta trilha escrevendo o primeiro `SELECT`, e agora modela tabelas normalizadas, cria índices onde eles pagam, lê planos de execução, embrulha operações em transações e protege tudo com constraints e backup. Este passo junta o essencial numa entrega só.\n\nA encomenda é o **data mart comercial** do projeto abaixo: um banco pequeno e bem desenhado pra responder perguntas de vendas (quanto por região, por produto, por período), do tipo que um relatório consome todo dia. Modele as tabelas de fatos e dimensões, defina as chaves e constraints que garantem a integridade, carregue um volume de dados que não seja de brinquedo, e crie os índices que fazem as consultas de relatório responderem rápido.\n\nO que separa este projeto de um exercício qualquer é a **medição**: pegue uma consulta lenta, leia o plano com `EXPLAIN`, crie o índice certo e comprove o ganho. É exatamente o raciocínio do passo Tuning e planos de execução, e o que define o valor de um DBA.\n\nO critério de chegada é objetivo: o banco modelado e documentado no GitHub (com o diagrama e o script de criação), respondendo às perguntas de negócio com consultas rápidas, e você explicando cada índice e cada decisão de modelagem sem hesitar. É este projeto que mostra, na prática, que você guarda, modela e faz o dado responder rápido.",
          project: "data-mart-comercial",
        },
        {
          id: "carreira.entrar",
          title: "Entrar na carreira",
          description:
            "Como construir a base e o portfólio pra uma área estável e sempre necessária.",
          optional: true,
          content:
            "A área de banco de dados tem um atrativo particular: é **estável e essencial**. Praticamente toda empresa que guarda informação precisa de quem cuide dos seus bancos, e essa demanda não desaparece com modas tecnológicas. Para quem valoriza estabilidade, profundidade técnica e um trabalho que recompensa a competência, é um caminho sólido.\n\nA fórmula pra entrar começa pelo que esta trilha enfatizou: **domine SQL de verdade**, do básico ao avançado, porque é a base inegociável e o que toda vaga cobra. Depois, **aprofunde num SGBD** (o PostgreSQL é um ótimo começo, gratuito e pedido). E entenda bem os temas que distinguem o DBA: índices e planos de execução, transações, backup e segurança. Como diz a sabedoria da área, entender índices e planos de execução é o que separa um DBA bom de um iniciante.\n\nPara praticar e montar portfólio, trabalhe com um **banco real e com volume de dados**, não só tabelas de brinquedo. Bons exercícios: modelar do zero o banco de um sistema (um e-commerce, por exemplo), pegar uma base grande e otimizar consultas lentas medindo o ganho, e configurar e testar uma rotina de backup e restauração. Documentar esses projetos demonstra competência concreta.\n\nVale notar a fronteira fluida com áreas vizinhas: muito do conhecimento de banco de dados conversa com **engenharia de dados**, **back-end** e **DevOps**, e profissionais transitam entre elas. Isso amplia suas opções e torna o aprendizado ainda mais aproveitável.\n\nDuas qualidades sustentam a carreira: o **método e o cuidado** (banco de dados não perdoa descuido, e o profissional metódico se destaca) e a disciplina de **medir antes de agir**, seja otimizando uma consulta ou testando um backup. Com SQL forte, um SGBD dominado e um portfólio prático, as portas dessa área essencial se abrem.",
        },
      ],
    },
  ],
};
