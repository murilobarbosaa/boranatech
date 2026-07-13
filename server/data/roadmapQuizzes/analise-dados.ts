// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool analise-dados). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "analise-dados",
  "questions": [
    {
      "id": "analise-dados-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você precisa entender por que as vendas caíram no Sul. Qual é o primeiro passo que você deve tomar?",
      "alternativas": {
        "a": "Começar a coletar dados de vendas sem uma direção clara.",
        "b": "Definir uma pergunta de negócio que guie sua análise.",
        "c": "Criar um dashboard com os dados de vendas imediatamente.",
        "d": "Limpar os dados de vendas que você tem disponível."
      },
      "correta": "b",
      "explicacao": "Definir uma pergunta de negócio é essencial para guiar todo o processo de análise e garantir que você está focando no que realmente importa.",
      "fonte": "fundamentos.fluxo"
    },
    {
      "id": "analise-dados-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você foi solicitado a apresentar um relatório sobre as vendas do último trimestre. Qual ferramenta você deve usar para visualizar os dados?",
      "alternativas": {
        "a": "Uma planilha para organizar os dados brutos.",
        "b": "SQL para extrair os dados necessários.",
        "c": "Uma ferramenta de visualização para criar gráficos e dashboards.",
        "d": "Um editor de texto para escrever um relatório detalhado."
      },
      "correta": "c",
      "explicacao": "Uma ferramenta de visualização é a melhor escolha para criar gráficos e dashboards que ajudam a comunicar os dados de forma clara e visual.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "analise-dados-ini-03",
      "nivel": "iniciante",
      "pergunta": "Após coletar os dados de vendas, você percebe que eles estão desorganizados. O que você deve fazer a seguir?",
      "alternativas": {
        "a": "Começar a analisar os dados imediatamente.",
        "b": "Limpar e organizar os dados para facilitar a análise.",
        "c": "Criar gráficos com os dados disponíveis, mesmo que desorganizados.",
        "d": "Descartar os dados e coletar novos dados."
      },
      "correta": "b",
      "explicacao": "Limpar e organizar os dados é uma etapa crucial que garante que a análise seja precisa e significativa.",
      "fonte": "fundamentos.fluxo"
    },
    {
      "id": "analise-dados-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você está analisando dados de vendas e percebe que alguns produtos têm muitas devoluções. Qual é a melhor abordagem para entender esse padrão?",
      "alternativas": {
        "a": "Ignorar as devoluções e focar apenas nas vendas.",
        "b": "Investigar as causas das devoluções cruzando dados de vendas e feedback dos clientes.",
        "c": "Fazer um gráfico apenas das vendas totais.",
        "d": "Comparar as devoluções com as vendas de outros produtos sem contexto."
      },
      "correta": "b",
      "explicacao": "Investigar as causas das devoluções, cruzando dados, é essencial para entender o padrão e tomar decisões informadas.",
      "fonte": "fundamentos.vsciencia"
    },
    {
      "id": "analise-dados-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você terminou sua análise e agora precisa comunicar os resultados. O que é mais importante a considerar?",
      "alternativas": {
        "a": "Focar apenas nos números e métricas que você encontrou.",
        "b": "Apresentar os dados de forma clara, com uma história e recomendações.",
        "c": "Usar jargões técnicos para mostrar seu conhecimento.",
        "d": "Criar um relatório longo e detalhado, sem se preocupar com a clareza."
      },
      "correta": "b",
      "explicacao": "Comunicar os resultados de forma clara e com uma história é crucial para garantir que as partes interessadas entendam e utilizem a análise.",
      "fonte": "fundamentos.fluxo"
    },
    {
      "id": "analise-dados-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você quer começar na área de análise de dados. Qual habilidade é mais importante para um analista iniciante?",
      "alternativas": {
        "a": "Dominar matemática avançada desde o início.",
        "b": "Ter um bom conhecimento de SQL e visualização de dados.",
        "c": "Saber programar em diversas linguagens de programação.",
        "d": "Focar apenas em relatórios sem se preocupar com a comunicação."
      },
      "correta": "b",
      "explicacao": "Um bom conhecimento de SQL e visualização de dados é fundamental para um analista iniciante, pois essas são as ferramentas principais na análise de dados.",
      "fonte": "fundamentos.vsciencia"
    },
    {
      "id": "analise-dados-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você precisa listar os nomes e cidades de todos os clientes que moram em Recife. Qual comando SQL você deve usar?",
      "alternativas": {
        "a": "SELECT nome, cidade FROM clientes WHERE cidade = 'Recife'",
        "b": "SELECT * FROM clientes WHERE cidade = 'Recife'",
        "c": "SELECT nome, cidade FROM clientes ORDER BY cidade",
        "d": "SELECT nome, cidade FROM clientes LIMIT 10"
      },
      "correta": "a",
      "explicacao": "A alternativa correta filtra os resultados especificamente para a cidade de Recife, enquanto as outras opções não atendem ao pedido de listar apenas os clientes dessa cidade.",
      "fonte": "sql.basico"
    },
    {
      "id": "analise-dados-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você deseja saber quanto cada cliente gastou em pedidos. Qual é a consulta correta para unir as tabelas de clientes e pedidos?",
      "alternativas": {
        "a": "SELECT c.nome, p.valor FROM clientes c JOIN pedidos p ON c.id = p.cliente_id",
        "b": "SELECT c.nome, p.valor FROM clientes c LEFT JOIN pedidos p ON c.id = p.cliente_id",
        "c": "SELECT c.nome, p.valor FROM clientes c INNER JOIN pedidos p ON p.cliente_id = c.id",
        "d": "SELECT c.nome, p.valor FROM clientes c RIGHT JOIN pedidos p ON c.id = p.cliente_id"
      },
      "correta": "c",
      "explicacao": "A alternativa correta usa INNER JOIN, que é a forma adequada para trazer apenas os clientes que fizeram pedidos, conforme o enunciado.",
      "fonte": "sql.joins"
    },
    {
      "id": "analise-dados-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você precisa calcular a média de vendas por região. Qual consulta SQL você deve usar?",
      "alternativas": {
        "a": "SELECT regiao, AVG(valor) FROM vendas GROUP BY regiao",
        "b": "SELECT AVG(valor) FROM vendas GROUP BY regiao",
        "c": "SELECT regiao, AVG(valor) FROM vendas",
        "d": "SELECT regiao, valor FROM vendas GROUP BY regiao"
      },
      "correta": "a",
      "explicacao": "A alternativa correta inclui o GROUP BY para agregar as vendas por região, enquanto as outras opções não agrupam corretamente os dados.",
      "fonte": "sql.agregacao"
    },
    {
      "id": "analise-dados-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você quer listar as regiões com total de vendas acima de um milhão. Qual consulta você deve usar?",
      "alternativas": {
        "a": "SELECT regiao, SUM(valor) AS total FROM vendas GROUP BY regiao HAVING total > 1000000",
        "b": "SELECT regiao, SUM(valor) FROM vendas GROUP BY regiao WHERE total > 1000000",
        "c": "SELECT regiao, SUM(valor) AS total FROM vendas GROUP BY regiao HAVING SUM(valor) > 1000000",
        "d": "SELECT regiao, SUM(valor) FROM vendas GROUP BY regiao"
      },
      "correta": "c",
      "explicacao": "A alternativa correta usa HAVING para filtrar os resultados após a agregação, enquanto a opção b usa WHERE, que não é aplicável após o GROUP BY.",
      "fonte": "sql.agregacao"
    },
    {
      "id": "analise-dados-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você deseja listar as 10 maiores vendas. Qual comando SQL você deve usar?",
      "alternativas": {
        "a": "SELECT * FROM vendas ORDER BY valor DESC LIMIT 10",
        "b": "SELECT valor FROM vendas ORDER BY valor ASC LIMIT 10",
        "c": "SELECT * FROM vendas WHERE valor > 0 ORDER BY valor DESC LIMIT 10",
        "d": "SELECT valor FROM vendas ORDER BY valor DESC LIMIT 10"
      },
      "correta": "a",
      "explicacao": "A alternativa correta ordena as vendas em ordem decrescente e limita os resultados às 10 maiores, atendendo ao pedido de listar as maiores vendas.",
      "fonte": "sql.basico"
    },
    {
      "id": "analise-dados-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você recebeu uma planilha com dados de vendas e precisa saber rapidamente qual vendedor teve o maior total de vendas. O que você faz?",
      "alternativas": {
        "a": "Criar uma tabela dinâmica e arrastar o campo de vendedor para linhas e o total de vendas para valores.",
        "b": "Usar a função `SOMASE` para somar as vendas de cada vendedor manualmente.",
        "c": "Filtrar a planilha para mostrar apenas os dados do vendedor mais alto e somar as vendas.",
        "d": "Ordenar a coluna de vendas em ordem decrescente e verificar o primeiro vendedor."
      },
      "correta": "a",
      "explicacao": "A tabela dinâmica permite resumir e cruzar dados rapidamente, facilitando a análise sem necessidade de fórmulas complexas.",
      "fonte": "planilhas.dinamicas"
    },
    {
      "id": "analise-dados-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você precisa calcular a média de vendas de um produto em uma planilha. Qual abordagem é a mais eficiente?",
      "alternativas": {
        "a": "Usar a função `MÉDIA` diretamente na coluna de vendas do produto.",
        "b": "Criar uma tabela dinâmica e arrastar o campo de vendas para valores, selecionando a média.",
        "c": "Contar o número de vendas e dividir pelo total de produtos vendidos.",
        "d": "Somar todas as vendas e dividir pelo número de linhas na planilha."
      },
      "correta": "b",
      "explicacao": "A tabela dinâmica permite calcular a média de forma rápida e eficiente, sem a necessidade de fórmulas manuais.",
      "fonte": "planilhas.dinamicas"
    },
    {
      "id": "analise-dados-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você está analisando uma planilha de gastos e precisa identificar rapidamente quais categorias têm mais despesas. O que você deve fazer?",
      "alternativas": {
        "a": "Criar uma tabela dinâmica e arrastar o campo de categoria para linhas e o total de gastos para valores.",
        "b": "Filtrar a planilha para mostrar apenas as categorias com maiores valores de gastos.",
        "c": "Usar a função `SOMASE` para calcular os gastos de cada categoria manualmente.",
        "d": "Ordenar a coluna de gastos em ordem crescente e verificar as últimas categorias."
      },
      "correta": "a",
      "explicacao": "A tabela dinâmica permite visualizar rapidamente as categorias e seus totais de gastos, facilitando a análise.",
      "fonte": "planilhas.dinamicas"
    },
    {
      "id": "analise-dados-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você precisa remover duplicatas de uma lista de clientes em uma planilha. Qual é a maneira mais eficaz de fazer isso?",
      "alternativas": {
        "a": "Usar a função `REMOVER.DUPLICATAS` na aba de dados da planilha.",
        "b": "Filtrar a lista e copiar apenas os valores únicos para uma nova planilha.",
        "c": "Ordenar a lista e excluir manualmente as duplicatas que aparecem consecutivamente.",
        "d": "Contar quantas duplicatas existem e criar uma nova lista sem elas."
      },
      "correta": "a",
      "explicacao": "A função `REMOVER.DUPLICATAS` é a maneira mais rápida e eficiente de eliminar entradas duplicadas em uma lista.",
      "fonte": "planilhas.avancado"
    },
    {
      "id": "analise-dados-int-01",
      "nivel": "intermediario",
      "pergunta": "Você recebeu um conjunto de dados com várias entradas duplicadas. Qual é a melhor abordagem para garantir que a análise não seja distorcida?",
      "alternativas": {
        "a": "Remover todas as duplicatas sem verificar qual é a correta.",
        "b": "Manter as duplicatas e fazer a análise normalmente.",
        "c": "Identificar e remover as duplicatas, garantindo que apenas uma entrada correta permaneça.",
        "d": "Substituir as duplicatas por um valor médio dos dados."
      },
      "correta": "c",
      "explicacao": "A identificação e remoção das duplicatas garantem que a análise reflita a realidade dos dados, evitando distorções nos resultados.",
      "fonte": "preparacao.limpeza"
    },
    {
      "id": "analise-dados-int-02",
      "nivel": "intermediario",
      "pergunta": "Ao trabalhar com dados de diferentes fontes, você notou que as datas estão em formatos variados. O que você deve fazer para garantir a consistência dos dados?",
      "alternativas": {
        "a": "Escolher um formato de data e converter todas as entradas para ele.",
        "b": "Manter os formatos diferentes e adaptar a análise para cada caso.",
        "c": "Ignorar as datas e focar apenas em outros dados disponíveis.",
        "d": "Utilizar o formato de data mais comum e descartar os outros."
      },
      "correta": "a",
      "explicacao": "Converter todas as datas para um único formato garante que a análise seja consistente e evita erros de interpretação.",
      "fonte": "preparacao.limpeza"
    },
    {
      "id": "analise-dados-int-03",
      "nivel": "intermediario",
      "pergunta": "Você está limpando um conjunto de dados e encontra várias células vazias. Qual é a abordagem mais adequada para lidar com esses valores ausentes?",
      "alternativas": {
        "a": "Preencher todas as células vazias com zero.",
        "b": "Excluir todas as linhas que contêm células vazias.",
        "c": "Decidir conscientemente como tratar cada célula vazia, considerando o impacto na análise.",
        "d": "Substituir as células vazias por um valor médio de outras entradas."
      },
      "correta": "c",
      "explicacao": "Tratar os valores ausentes de forma consciente garante que a escolha não afete negativamente os resultados da análise.",
      "fonte": "preparacao.limpeza"
    },
    {
      "id": "analise-dados-int-04",
      "nivel": "intermediario",
      "pergunta": "Você está utilizando um banco de dados e precisa extrair informações para análise. Qual é o primeiro passo do processo ETL?",
      "alternativas": {
        "a": "Transformar os dados para o formato desejado.",
        "b": "Carregar os dados em uma ferramenta de BI.",
        "c": "Extrair os dados das fontes originais.",
        "d": "Limpar e organizar os dados."
      },
      "correta": "c",
      "explicacao": "A extração é o primeiro passo do processo ETL, onde os dados são buscados nas fontes originais antes de qualquer transformação.",
      "fonte": "preparacao.etl"
    },
    {
      "id": "analise-dados-int-05",
      "nivel": "intermediario",
      "pergunta": "Durante o processo de ETL, você precisa garantir que os dados estejam prontos para análise. O que deve ser feito na etapa de transformação?",
      "alternativas": {
        "a": "Carregar os dados diretamente na ferramenta de BI.",
        "b": "Limpar, padronizar e combinar os dados conforme necessário.",
        "c": "Extrair dados de outras fontes sem transformá-los.",
        "d": "Ignorar a limpeza e focar apenas na combinação dos dados."
      },
      "correta": "b",
      "explicacao": "A etapa de transformação envolve limpar e padronizar os dados para que estejam prontos para a análise, garantindo a qualidade dos resultados.",
      "fonte": "preparacao.etl"
    },
    {
      "id": "analise-dados-int-06",
      "nivel": "intermediario",
      "pergunta": "Você está montando um projeto de análise e decide usar dados públicos. Qual é a vantagem de utilizar esses dados?",
      "alternativas": {
        "a": "Eles são sempre mais fáceis de trabalhar do que dados privados.",
        "b": "Eles oferecem grandes volumes de dados abertos e relevantes para análise.",
        "c": "Eles são sempre mais precisos do que dados coletados internamente.",
        "d": "Eles não precisam passar por processos de limpeza."
      },
      "correta": "b",
      "explicacao": "Dados públicos oferecem um grande volume de informações relevantes e acessíveis, sendo ótimos para projetos de portfólio.",
      "fonte": "preparacao.etl"
    },
    {
      "id": "analise-dados-int-07",
      "nivel": "intermediario",
      "pergunta": "Você está analisando dados de vendas de um produto e percebe que a média de vendas é muito alta, mas a maioria das vendas são baixas. Qual medida você deve usar para representar melhor a situação?",
      "alternativas": {
        "a": "A média, pois ela considera todos os dados.",
        "b": "A mediana, pois ela não é influenciada por valores extremos.",
        "c": "A moda, pois é o valor mais comum.",
        "d": "A soma total, pois mostra o volume geral de vendas."
      },
      "correta": "b",
      "explicacao": "A mediana é a melhor escolha, pois não é afetada por valores extremos, representando melhor a tendência central em casos de distribuição assimétrica.",
      "fonte": "estatistica.descritiva"
    },
    {
      "id": "analise-dados-int-08",
      "nivel": "intermediario",
      "pergunta": "Em uma análise de dados sobre a satisfação do cliente, você observa que a média de satisfação é alta, mas muitos clientes estão insatisfeitos. Qual abordagem você deve evitar para não enganar sua equipe?",
      "alternativas": {
        "a": "Comparar a média com a mediana para entender a distribuição.",
        "b": "Focar apenas na média e ignorar a dispersão dos dados.",
        "c": "Analisar a frequência das respostas para entender o que os clientes pensam.",
        "d": "Usar gráficos para visualizar a distribuição das respostas."
      },
      "correta": "b",
      "explicacao": "Focar apenas na média pode levar a conclusões erradas, pois não considera a variação e insatisfação dos clientes.",
      "fonte": "estatistica.descritiva"
    },
    {
      "id": "analise-dados-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está preparando um relatório sobre o crescimento de uma empresa e deseja mostrar a participação de cada departamento no total. Qual métrica você deve usar?",
      "alternativas": {
        "a": "Total acumulado de vendas de cada departamento.",
        "b": "Crescimento percentual de cada departamento em relação ao total.",
        "c": "Proporção de vendas de cada departamento em relação ao total.",
        "d": "Média de vendas de cada departamento."
      },
      "correta": "c",
      "explicacao": "A proporção de vendas é a métrica correta, pois mostra a participação de cada departamento no total, facilitando a comparação.",
      "fonte": "estatistica.descritiva"
    },
    {
      "id": "analise-dados-int-10",
      "nivel": "intermediario",
      "pergunta": "Você está analisando dados de vendas e percebe que a correlação entre o aumento das vendas e o aumento da temperatura é alta. O que você deve evitar ao interpretar esses dados?",
      "alternativas": {
        "a": "Concluir que o aumento da temperatura causa o aumento das vendas.",
        "b": "Investigar outros fatores que podem estar influenciando as vendas.",
        "c": "Apresentar a correlação em um gráfico claro.",
        "d": "Considerar a sazonalidade como um fator relevante."
      },
      "correta": "a",
      "explicacao": "Concluir que a temperatura causa o aumento das vendas é um erro comum, pois correlação não implica causalidade; outros fatores podem estar envolvidos.",
      "fonte": "estatistica.armadilhas"
    },
    {
      "id": "analise-dados-int-11",
      "nivel": "intermediario",
      "pergunta": "Você está analisando o desempenho de uma campanha de marketing e observa um aumento no número de cadastros. Qual armadilha você deve evitar ao relatar esses dados?",
      "alternativas": {
        "a": "Considerar a taxa de conversão de cadastros em clientes.",
        "b": "Focar apenas no número total de cadastros sem contexto.",
        "c": "Comparar o desempenho da campanha com campanhas anteriores.",
        "d": "Analisar a retenção de usuários após o cadastro."
      },
      "correta": "b",
      "explicacao": "Focar apenas no número total de cadastros sem considerar se os usuários são ativos ou retidos é uma métrica de vaidade que não reflete o sucesso real da campanha.",
      "fonte": "estatistica.armadilhas"
    },
    {
      "id": "analise-dados-int-12",
      "nivel": "intermediario",
      "pergunta": "Você está criando um gráfico para mostrar a variação nas vendas ao longo do tempo. Qual cuidado você deve ter para evitar um gráfico enganoso?",
      "alternativas": {
        "a": "Começar o eixo vertical em um número que não seja zero.",
        "b": "Usar uma escala adequada que represente a variação real.",
        "c": "Selecionar um período que mostre a tendência de forma clara.",
        "d": "Incluir todas as categorias de vendas no gráfico."
      },
      "correta": "a",
      "explicacao": "Começar o eixo vertical em um número que não seja zero pode exagerar a diferença nas vendas, tornando o gráfico enganoso.",
      "fonte": "estatistica.armadilhas"
    },
    {
      "id": "analise-dados-av-01",
      "nivel": "avancado",
      "pergunta": "Você está montando um dashboard para um cliente que precisa entender a evolução das vendas ao longo do tempo. Qual gráfico você deve usar para representar essa tendência?",
      "alternativas": {
        "a": "Gráfico de barras empilhadas",
        "b": "Gráfico de linhas",
        "c": "Gráfico de rosca",
        "d": "Gráfico de dispersão"
      },
      "correta": "b",
      "explicacao": "O gráfico de linhas é o mais indicado para mostrar a evolução ao longo do tempo, facilitando a visualização de tendências.",
      "fonte": "bi.dashboard"
    },
    {
      "id": "analise-dados-av-02",
      "nivel": "avancado",
      "pergunta": "Ao construir um dashboard, você percebe que tem muitos gráficos e informações. Qual abordagem deve ser adotada para garantir que o painel seja eficaz?",
      "alternativas": {
        "a": "Adicionar mais cores para destacar os dados",
        "b": "Focar em um conjunto claro de perguntas",
        "c": "Incluir todos os dados disponíveis para maior detalhamento",
        "d": "Usar gráficos complexos para impressionar o usuário"
      },
      "correta": "b",
      "explicacao": "Focar em um conjunto claro de perguntas evita que o dashboard fique confuso e garante que as informações mais relevantes sejam destacadas.",
      "fonte": "bi.dashboard"
    },
    {
      "id": "analise-dados-av-03",
      "nivel": "avancado",
      "pergunta": "Você está criando um dashboard interativo. Qual elemento deve ser incluído para permitir que os usuários explorem os dados de forma independente?",
      "alternativas": {
        "a": "Gráficos estáticos",
        "b": "Filtros para recortar os dados",
        "c": "Textos explicativos longos",
        "d": "Animações entre as transições"
      },
      "correta": "b",
      "explicacao": "Filtros permitem que os usuários interajam com os dados, tornando o dashboard uma ferramenta dinâmica e exploratória.",
      "fonte": "bi.dashboard"
    },
    {
      "id": "analise-dados-av-04",
      "nivel": "avancado",
      "pergunta": "Você precisa escolher KPIs para medir a satisfação do cliente. Qual métrica seria a mais adequada para representar essa informação de forma clara?",
      "alternativas": {
        "a": "Número total de vendas",
        "b": "Taxa de recompra",
        "c": "Número de reclamações",
        "d": "Total de produtos vendidos"
      },
      "correta": "b",
      "explicacao": "A taxa de recompra é um KPI que indica diretamente a satisfação do cliente, pois reflete a disposição do cliente em voltar a comprar.",
      "fonte": "bi.kpis"
    },
    {
      "id": "analise-dados-av-05",
      "nivel": "avancado",
      "pergunta": "Ao definir KPIs para um projeto, qual cuidado deve ser tomado para evitar a armadilha das métricas de vaidade?",
      "alternativas": {
        "a": "Escolher métricas que sempre aumentam",
        "b": "Selecionar KPIs que estejam alinhados a objetivos reais do negócio",
        "c": "Usar métricas que impressionem a diretoria",
        "d": "Focar apenas em números de fácil obtenção"
      },
      "correta": "b",
      "explicacao": "Selecionar KPIs alinhados a objetivos reais do negócio garante que as métricas realmente representem o desempenho e não apenas números que parecem bons.",
      "fonte": "bi.kpis"
    },
    {
      "id": "analise-dados-av-06",
      "nivel": "avancado",
      "pergunta": "Você está ajudando uma empresa a entender se está crescendo. Qual métrica você deve usar para responder a essa pergunta?",
      "alternativas": {
        "a": "Número total de funcionários",
        "b": "Taxa de crescimento da receita",
        "c": "Total de produtos em estoque",
        "d": "Número de visitas ao site"
      },
      "correta": "b",
      "explicacao": "A taxa de crescimento da receita é uma métrica clara que indica se a empresa está realmente crescendo em termos financeiros.",
      "fonte": "bi.kpis"
    },
    {
      "id": "analise-dados-av-07",
      "nivel": "avancado",
      "pergunta": "Você está escolhendo uma ferramenta de BI para um projeto. Qual fator deve ser considerado para garantir que a escolha atenda às necessidades do mercado?",
      "alternativas": {
        "a": "A ferramenta deve ser a mais complexa disponível",
        "b": "A ferramenta deve ter uma versão gratuita para aprendizado",
        "c": "A ferramenta deve ser a mais nova no mercado",
        "d": "A ferramenta deve ter muitos recursos visuais"
      },
      "correta": "b",
      "explicacao": "Escolher uma ferramenta que tenha uma versão gratuita para aprendizado, como o Power BI, é estratégico para quem está começando e busca empregabilidade.",
      "fonte": "bi.ferramentas"
    },
    {
      "id": "analise-dados-av-08",
      "nivel": "avancado",
      "pergunta": "Você está avaliando a eficácia de um dashboard que apresenta muitos dados. Qual é a principal característica que deve ser observada para garantir que o dashboard seja útil?",
      "alternativas": {
        "a": "Ele deve ter muitos gráficos coloridos",
        "b": "Os dados devem ser apresentados de forma clara e direta",
        "c": "Ele deve incluir todos os dados disponíveis",
        "d": "Os gráficos devem ser complexos e detalhados"
      },
      "correta": "b",
      "explicacao": "Um dashboard útil deve apresentar os dados de forma clara e direta, evitando confusão e facilitando a tomada de decisão.",
      "fonte": "bi.dashboard"
    },
    {
      "id": "analise-dados-av-09",
      "nivel": "avancado",
      "pergunta": "Você precisa apresentar os resultados de uma análise de vendas para a diretoria. Qual abordagem você deve usar para garantir que sua apresentação seja impactante?",
      "alternativas": {
        "a": "Começar explicando como os dados foram coletados e processados.",
        "b": "Focar nas conclusões e recomendações, começando pela queda nas vendas e suas causas.",
        "c": "Mostrar os gráficos e tabelas sem uma explicação detalhada.",
        "d": "Apresentar uma lista de todas as métricas analisadas."
      },
      "correta": "b",
      "explicacao": "Focar nas conclusões e recomendações garante que a mensagem principal seja transmitida de forma clara e direta, facilitando a tomada de decisão.",
      "fonte": "carreira.storytelling"
    },
    {
      "id": "analise-dados-av-10",
      "nivel": "avancado",
      "pergunta": "Você está criando um painel executivo para um gestor. Qual deve ser a prioridade ao escolher as métricas a serem incluídas?",
      "alternativas": {
        "a": "Incluir todas as métricas disponíveis para mostrar a profundidade da análise.",
        "b": "Selecionar apenas as métricas que respondem diretamente às perguntas que o gestor faria.",
        "c": "Focar em métricas que você acha interessantes, mesmo que não sejam relevantes para o gestor.",
        "d": "Escolher métricas complexas que impressionem o gestor pela dificuldade de cálculo."
      },
      "correta": "b",
      "explicacao": "Selecionar métricas que respondem diretamente às perguntas do gestor garante que o painel seja útil e prático para a tomada de decisão.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "analise-dados-av-11",
      "nivel": "avancado",
      "pergunta": "Ao elaborar um dashboard, qual é a melhor prática para garantir que a visualização seja eficaz?",
      "alternativas": {
        "a": "Usar várias cores e formatos para destacar todos os números.",
        "b": "Focar em uma mensagem clara e garantir que cada visualização tenha um propósito específico.",
        "c": "Incluir o máximo de informações possíveis para não deixar nada de fora.",
        "d": "Criar gráficos complexos que mostrem a profundidade da análise."
      },
      "correta": "b",
      "explicacao": "Focar em uma mensagem clara e garantir um propósito específico para cada visualização ajuda a transmitir a informação de forma eficaz e evita confusão.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "analise-dados-av-12",
      "nivel": "avancado",
      "pergunta": "Você está iniciando sua carreira em análise de dados e precisa construir um portfólio. Qual é a melhor estratégia para isso?",
      "alternativas": {
        "a": "Criar dashboards com dados fictícios para mostrar suas habilidades.",
        "b": "Usar datasets reais e explicar os insights de cada análise realizada.",
        "c": "Focar apenas em mostrar as ferramentas que você sabe usar, sem explicar os resultados.",
        "d": "Incluir apenas gráficos bonitos, sem se preocupar com a narrativa."
      },
      "correta": "b",
      "explicacao": "Usar datasets reais e explicar os insights demonstra que você sabe extrair e interpretar dados, o que é essencial para um analista.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "analise-dados-av-13",
      "nivel": "avancado",
      "pergunta": "Você recebeu feedback de que suas apresentações não estão impactando a equipe. O que você deve fazer para melhorar?",
      "alternativas": {
        "a": "Continuar apresentando os dados da mesma forma, pois você acredita que estão corretos.",
        "b": "Investir tempo em entender o público e adaptar a narrativa para suas necessidades.",
        "c": "Focar apenas nos dados técnicos, pois isso é o que realmente importa.",
        "d": "Aumentar a quantidade de gráficos apresentados para mostrar mais informações."
      },
      "correta": "b",
      "explicacao": "Entender o público e adaptar a narrativa para suas necessidades melhora a comunicação e torna a apresentação mais impactante.",
      "fonte": "carreira.storytelling"
    },
    {
      "id": "analise-dados-av-14",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um painel financeiro e precisa garantir que ele seja lido rapidamente. Qual é a melhor abordagem?",
      "alternativas": {
        "a": "Incluir muitos detalhes para que o gestor tenha todas as informações.",
        "b": "Destacar as métricas mais importantes e organizá-las de forma hierárquica.",
        "c": "Usar gráficos complexos que mostrem todos os dados disponíveis.",
        "d": "Focar em uma única métrica e ignorar as demais."
      },
      "correta": "b",
      "explicacao": "Destacar as métricas mais importantes e organizá-las de forma hierárquica facilita a leitura e a compreensão rápida do painel.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "analise-dados-av-15",
      "nivel": "avancado",
      "pergunta": "Você está se preparando para uma entrevista na área de análise de dados. O que deve ser enfatizado em sua apresentação?",
      "alternativas": {
        "a": "Apenas suas habilidades técnicas, como SQL e ferramentas de BI.",
        "b": "A importância de contar histórias com dados e como você aplicou isso em projetos anteriores.",
        "c": "A quantidade de projetos que você já fez, independentemente da qualidade.",
        "d": "O número de ferramentas que você conhece, sem explicar como as usou."
      },
      "correta": "b",
      "explicacao": "Enfatizar a importância de contar histórias com dados mostra que você entende a comunicação necessária para um analista e como aplicar isso na prática.",
      "fonte": "carreira.entrar"
    }
  ]
};

export default pool;
