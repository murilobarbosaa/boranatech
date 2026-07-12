// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool dados). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "dados",
  "questions": [
    {
      "id": "dados-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está iniciando um projeto de ciência de dados e precisa entender o que deve ser feito primeiro. Qual é a primeira etapa do fluxo de um projeto de dados?",
      "alternativas": {
        "a": "Limpeza dos dados",
        "b": "Coleta dos dados",
        "c": "Definir a pergunta",
        "d": "Comunicação dos resultados"
      },
      "correta": "c",
      "explicacao": "A primeira etapa é sempre definir a pergunta que se quer responder, pois sem ela não há direção para o projeto.",
      "fonte": "fundamentos.fluxo"
    },
    {
      "id": "dados-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você recebeu um conjunto de dados que contém muitos valores faltantes e duplicatas. Qual etapa do fluxo de um projeto de dados você deve priorizar para garantir a qualidade da análise?",
      "alternativas": {
        "a": "Coleta dos dados",
        "b": "Limpeza dos dados",
        "c": "Análise dos dados",
        "d": "Comunicação dos resultados"
      },
      "correta": "b",
      "explicacao": "A limpeza dos dados é crucial para corrigir problemas como valores faltantes e duplicatas, garantindo que a análise seja confiável.",
      "fonte": "fundamentos.fluxo"
    },
    {
      "id": "dados-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você está trabalhando em um projeto de dados e precisa compartilhar suas análises com a equipe. Qual ferramenta é mais adequada para esse tipo de tarefa?",
      "alternativas": {
        "a": "Um editor de texto simples",
        "b": "Um notebook Jupyter",
        "c": "Um arquivo CSV",
        "d": "Um banco de dados SQL"
      },
      "correta": "b",
      "explicacao": "O notebook Jupyter é ideal para compartilhar análises, pois combina código, texto e gráficos em um só lugar.",
      "fonte": "fundamentos.ambiente"
    },
    {
      "id": "dados-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você quer começar a trabalhar com ciência de dados sem se preocupar com instalações complexas. Qual é a melhor opção para você?",
      "alternativas": {
        "a": "Instalar o Jupyter localmente",
        "b": "Usar o Google Colab",
        "c": "Programar em Python no terminal",
        "d": "Utilizar um IDE pesado"
      },
      "correta": "b",
      "explicacao": "O Google Colab permite que você comece a trabalhar com ciência de dados diretamente no navegador, sem necessidade de instalação.",
      "fonte": "fundamentos.ambiente"
    },
    {
      "id": "dados-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo um projeto de análise de dados e deseja manter um histórico das alterações feitas no código. Qual ferramenta deve ser utilizada?",
      "alternativas": {
        "a": "Google Drive",
        "b": "Git",
        "c": "Excel",
        "d": "Notepad"
      },
      "correta": "b",
      "explicacao": "Git é um sistema de controle de versão que permite versionar o código e manter um histórico de alterações de forma organizada.",
      "fonte": "fundamentos.git"
    },
    {
      "id": "dados-ini-06",
      "nivel": "iniciante",
      "pergunta": "Ao versionar seu código de análise de dados, qual comando você deve usar para registrar suas alterações?",
      "alternativas": {
        "a": "git push",
        "b": "git add",
        "c": "git commit -m \"mensagem\"",
        "d": "git clone"
      },
      "correta": "c",
      "explicacao": "O comando 'git commit -m \"mensagem\"' é utilizado para registrar as alterações feitas no código com uma descrição.",
      "fonte": "fundamentos.git"
    },
    {
      "id": "dados-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você está analisando vendas e precisa armazenar a quantidade de produtos vendidos. Qual é a melhor forma de fazer isso em Python?",
      "alternativas": {
        "a": "Usar uma variável do tipo `int` para guardar o número total de produtos.",
        "b": "Criar uma lista para armazenar cada venda individualmente.",
        "c": "Utilizar um dicionário onde a chave é o nome do produto e o valor é a quantidade vendida.",
        "d": "Armazenar as vendas em uma string que concatena todos os valores."
      },
      "correta": "c",
      "explicacao": "Um dicionário permite armazenar pares de chave e valor, facilitando a consulta e atualização das quantidades por produto.",
      "fonte": "python.basico"
    },
    {
      "id": "dados-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você precisa percorrer uma lista de notas de alunos e calcular a média. Qual estrutura de controle você deve usar para isso?",
      "alternativas": {
        "a": "Um laço `while` que continua até que todas as notas sejam processadas.",
        "b": "Um laço `for` que percorre cada nota da lista uma a uma.",
        "c": "Um laço `for` que percorre a lista, mas apenas imprime as notas.",
        "d": "Um laço `if` para verificar se a média é maior que 7."
      },
      "correta": "b",
      "explicacao": "O laço `for` é a estrutura ideal para percorrer cada item de uma lista e realizar operações, como calcular a média.",
      "fonte": "python.estruturas"
    },
    {
      "id": "dados-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você deseja usar uma biblioteca para criar gráficos em Python. Qual é o primeiro passo que você deve realizar?",
      "alternativas": {
        "a": "Importar a biblioteca no seu código com a palavra `import`.",
        "b": "Instalar a biblioteca usando o gerenciador de pacotes `pip`.",
        "c": "Criar uma função que desenha o gráfico desejado.",
        "d": "Procurar um tutorial sobre a biblioteca antes de usá-la."
      },
      "correta": "b",
      "explicacao": "Antes de usar uma biblioteca, é necessário instalá-la com `pip` para garantir que ela esteja disponível no seu ambiente.",
      "fonte": "python.bibliotecas"
    },
    {
      "id": "dados-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você está criando um programa que precisa armazenar informações sobre diferentes produtos. Qual estrutura de dados é mais apropriada para representar cada produto com suas características?",
      "alternativas": {
        "a": "Uma lista onde cada item é um produto com suas características em sequência.",
        "b": "Um dicionário onde as chaves são as características e os valores são os dados dos produtos.",
        "c": "Um conjunto que armazena apenas os nomes dos produtos.",
        "d": "Uma lista de dicionários, onde cada dicionário representa um produto."
      },
      "correta": "d",
      "explicacao": "Uma lista de dicionários permite representar múltiplos produtos, cada um com suas características de forma organizada.",
      "fonte": "python.estruturas"
    },
    {
      "id": "dados-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você precisa armazenar um valor booleano que indica se um cliente está ativo ou não. Qual é a melhor prática para isso?",
      "alternativas": {
        "a": "Usar uma variável do tipo `str` com valores 'sim' ou 'não'.",
        "b": "Criar uma lista com valores booleanos.",
        "c": "Utilizar uma variável do tipo `bool` para armazenar o estado ativo do cliente.",
        "d": "Armazenar o valor em um dicionário com a chave 'ativo'."
      },
      "correta": "c",
      "explicacao": "Uma variável do tipo `bool` é a forma mais adequada para armazenar um valor que representa verdadeiro ou falso.",
      "fonte": "python.basico"
    },
    {
      "id": "dados-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você precisa extrair os nomes e idades dos clientes da tabela 'clientes'. Qual comando SQL você deve usar?",
      "alternativas": {
        "a": "SELECT nome, idade FROM clientes",
        "b": "SELECT * FROM clientes",
        "c": "SELECT nome, idade WHERE clientes",
        "d": "SELECT clientes.nome, clientes.idade"
      },
      "correta": "a",
      "explicacao": "O comando correto usa a sintaxe adequada para selecionar colunas específicas de uma tabela.",
      "fonte": "sql.select"
    },
    {
      "id": "dados-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você quer listar todas as vendas que foram acima de 500 reais. Qual consulta SQL você deve usar?",
      "alternativas": {
        "a": "SELECT * FROM vendas WHERE valor > 500",
        "b": "SELECT vendas WHERE valor > 500",
        "c": "SELECT * FROM vendas AND valor > 500",
        "d": "SELECT * FROM vendas ORDER BY valor > 500"
      },
      "correta": "a",
      "explicacao": "A consulta correta utiliza o comando WHERE para filtrar as vendas com valor superior a 500 reais.",
      "fonte": "sql.filtros"
    },
    {
      "id": "dados-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você deseja saber a média de vendas por região, agrupando os resultados. Qual comando SQL você deve usar?",
      "alternativas": {
        "a": "SELECT regiao, AVG(valor) FROM vendas GROUP BY regiao",
        "b": "SELECT AVG(valor) FROM vendas GROUP BY regiao",
        "c": "SELECT regiao, AVG(valor) FROM vendas",
        "d": "SELECT regiao, SUM(valor) FROM vendas GROUP BY valor"
      },
      "correta": "a",
      "explicacao": "A consulta correta agrega a média de vendas por região, utilizando a cláusula GROUP BY corretamente.",
      "fonte": "sql.agregacao"
    },
    {
      "id": "dados-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você precisa encontrar as 5 maiores vendas registradas. Qual consulta SQL você deve usar?",
      "alternativas": {
        "a": "SELECT * FROM vendas ORDER BY valor DESC LIMIT 5",
        "b": "SELECT * FROM vendas WHERE valor > 0 ORDER BY valor LIMIT 5",
        "c": "SELECT * FROM vendas ORDER BY valor LIMIT 5",
        "d": "SELECT * FROM vendas WHERE valor > 0 ORDER BY valor DESC"
      },
      "correta": "a",
      "explicacao": "A consulta correta ordena as vendas de forma decrescente e limita o resultado às 5 maiores vendas.",
      "fonte": "sql.filtros"
    },
    {
      "id": "dados-int-01",
      "nivel": "intermediario",
      "pergunta": "Você tem um conjunto de dados de salários e percebe que a média é muito maior que a mediana. O que isso pode indicar sobre os dados?",
      "alternativas": {
        "a": "Os salários estão uniformemente distribuídos.",
        "b": "Existem valores extremos altos que estão puxando a média para cima.",
        "c": "Os salários são todos iguais.",
        "d": "A mediana é sempre maior que a média."
      },
      "correta": "b",
      "explicacao": "A diferença entre média e mediana indica que existem valores extremos altos que estão influenciando a média, enquanto a mediana representa melhor o salário típico.",
      "fonte": "estatistica.descritiva"
    },
    {
      "id": "dados-int-02",
      "nivel": "intermediario",
      "pergunta": "Você está analisando a distribuição de notas de uma turma e percebe que a maioria das notas está concentrada em um extremo. Qual medida de tendência central é mais adequada para representar essa distribuição?",
      "alternativas": {
        "a": "Média, pois ela considera todos os valores.",
        "b": "Mediana, pois ela não é influenciada por valores extremos.",
        "c": "Moda, pois ela representa o valor mais frequente.",
        "d": "Nenhuma das anteriores."
      },
      "correta": "b",
      "explicacao": "A mediana é mais adequada, pois não é afetada por valores extremos, enquanto a média poderia ser distorcida por notas muito altas ou muito baixas.",
      "fonte": "estatistica.descritiva"
    },
    {
      "id": "dados-int-03",
      "nivel": "intermediario",
      "pergunta": "Você está criando um histograma para visualizar a distribuição de idades em um grupo. O que você deve considerar ao definir os intervalos (bins) do histograma?",
      "alternativas": {
        "a": "Os intervalos devem ser todos do mesmo tamanho para facilitar a visualização.",
        "b": "Os intervalos devem ser diferentes para cada faixa etária.",
        "c": "Os intervalos devem ser escolhidos aleatoriamente para evitar viés.",
        "d": "Os intervalos devem ser definidos de acordo com a média das idades."
      },
      "correta": "a",
      "explicacao": "Intervalos do mesmo tamanho ajudam a manter a consistência na visualização e a facilitar a interpretação do histograma.",
      "fonte": "estatistica.distribuicao"
    },
    {
      "id": "dados-int-04",
      "nivel": "intermediario",
      "pergunta": "Você está analisando a correlação entre o tempo de estudo e as notas dos alunos. O que você deve ter em mente ao interpretar o coeficiente de correlação obtido?",
      "alternativas": {
        "a": "Um coeficiente próximo de 1 significa que o tempo de estudo causa aumento nas notas.",
        "b": "Um coeficiente próximo de 0 indica que não há relação entre as variáveis.",
        "c": "Um coeficiente negativo indica que mais estudo resulta em notas mais baixas.",
        "d": "A correlação não implica que uma variável causa a outra."
      },
      "correta": "d",
      "explicacao": "A correlação apenas indica que as variáveis se movem juntas, mas não prova que uma causa a outra, o que é essencial para evitar conclusões erradas.",
      "fonte": "estatistica.correlacao"
    },
    {
      "id": "dados-int-05",
      "nivel": "intermediario",
      "pergunta": "Você está analisando um conjunto de dados e encontra um outlier que parece ser um erro de digitação. O que você deve fazer com esse outlier antes de prosseguir com a análise?",
      "alternativas": {
        "a": "Ignorar o outlier, pois ele não afeta a média.",
        "b": "Remover o outlier, pois ele pode distorcer a análise.",
        "c": "Manter o outlier, pois ele pode ser um dado interessante.",
        "d": "Alterar o valor do outlier para a média."
      },
      "correta": "b",
      "explicacao": "Remover o outlier é recomendável, pois ele pode distorcer a análise e levar a conclusões erradas, especialmente em medidas de tendência central.",
      "fonte": "estatistica.distribuicao"
    },
    {
      "id": "dados-int-06",
      "nivel": "intermediario",
      "pergunta": "Você recebeu um arquivo CSV com dados de vendas. Após carregar o DataFrame, qual comando você deve usar para visualizar as primeiras linhas do DataFrame?",
      "alternativas": {
        "a": "df.head()",
        "b": "df.first()",
        "c": "df.show()",
        "d": "df.preview()"
      },
      "correta": "a",
      "explicacao": "O comando df.head() é utilizado para visualizar as primeiras linhas do DataFrame, permitindo uma rápida inspeção dos dados carregados.",
      "fonte": "pandas.dataframe"
    },
    {
      "id": "dados-int-07",
      "nivel": "intermediario",
      "pergunta": "Após realizar a limpeza de um DataFrame, você notou que algumas colunas ainda têm valores ausentes. Qual é o primeiro passo recomendado para lidar com esses valores?",
      "alternativas": {
        "a": "Remover todas as linhas com valores ausentes",
        "b": "Preencher os valores ausentes com a média da coluna",
        "c": "Localizar os valores ausentes com .isnull().sum()",
        "d": "Converter os valores ausentes em zero"
      },
      "correta": "c",
      "explicacao": "O primeiro passo recomendado é localizar os valores ausentes utilizando .isnull().sum(), pois isso permite entender a extensão do problema antes de decidir como tratá-los.",
      "fonte": "pandas.limpeza"
    },
    {
      "id": "dados-int-08",
      "nivel": "intermediario",
      "pergunta": "Você precisa calcular a média de uma coluna chamada 'salario' em um DataFrame. Qual é a maneira correta de fazer isso utilizando Pandas?",
      "alternativas": {
        "a": "df['salario'].mean()",
        "b": "df.mean('salario')",
        "c": "mean(df['salario'])",
        "d": "df['salario'].average()"
      },
      "correta": "a",
      "explicacao": "O método df['salario'].mean() é a forma correta de calcular a média da coluna 'salario' em um DataFrame no Pandas.",
      "fonte": "pandas.numpy"
    },
    {
      "id": "dados-int-09",
      "nivel": "intermediario",
      "pergunta": "Você deseja filtrar um DataFrame para mostrar apenas as linhas onde a coluna 'idade' é maior que 25. Qual é a sintaxe correta para fazer isso?",
      "alternativas": {
        "a": "df[df['idade'] > 25]",
        "b": "df.filter('idade' > 25)",
        "c": "df.query('idade > 25')",
        "d": "df.select(df['idade'] > 25)"
      },
      "correta": "a",
      "explicacao": "A sintaxe df[df['idade'] > 25] é a maneira correta de filtrar um DataFrame para mostrar apenas as linhas onde a idade é maior que 25.",
      "fonte": "pandas.transformar"
    },
    {
      "id": "dados-int-10",
      "nivel": "intermediario",
      "pergunta": "Você está agrupando um DataFrame por uma coluna chamada 'categoria' e deseja calcular a soma de outra coluna chamada 'valor'. Qual comando você deve usar?",
      "alternativas": {
        "a": "df.groupby('categoria')['valor'].sum()",
        "b": "df.aggregate('categoria', 'valor').sum()",
        "c": "df.group_by('categoria').sum('valor')",
        "d": "df['valor'].groupby('categoria').sum()"
      },
      "correta": "a",
      "explicacao": "O comando df.groupby('categoria')['valor'].sum() é a forma correta de agrupar por 'categoria' e calcular a soma da coluna 'valor'.",
      "fonte": "pandas.transformar"
    },
    {
      "id": "dados-int-11",
      "nivel": "intermediario",
      "pergunta": "Você está trabalhando com um DataFrame e precisa criar uma nova coluna chamada 'margem' que é a diferença entre 'receita' e 'custo'. Qual é a maneira correta de fazer isso?",
      "alternativas": {
        "a": "df['margem'] = df['receita'] - df['custo']",
        "b": "df['margem'] = df['receita'].subtract(df['custo'])",
        "c": "df['margem'] = df['receita'].diff(df['custo'])",
        "d": "df.create_column('margem', df['receita'] - df['custo'])"
      },
      "correta": "a",
      "explicacao": "A maneira correta de criar a nova coluna 'margem' é usando df['margem'] = df['receita'] - df['custo'], que calcula a diferença entre as duas colunas diretamente.",
      "fonte": "pandas.transformar"
    },
    {
      "id": "dados-int-12",
      "nivel": "intermediario",
      "pergunta": "Você está analisando um conjunto de dados e percebe que a distribuição de uma variável está muito concentrada em um intervalo pequeno. Qual gráfico você deve usar para visualizar essa distribuição?",
      "alternativas": {
        "a": "Gráfico de barras",
        "b": "Gráfico de linha",
        "c": "Histograma",
        "d": "Gráfico de dispersão"
      },
      "correta": "c",
      "explicacao": "Um histograma é o gráfico mais adequado para visualizar a distribuição de uma variável, mostrando como os dados estão distribuídos ao longo de intervalos.",
      "fonte": "visualizacao.principios"
    },
    {
      "id": "dados-int-13",
      "nivel": "intermediario",
      "pergunta": "Você precisa comunicar os resultados de uma análise de dados para um público não técnico. Qual é a melhor prática para apresentar o gráfico?",
      "alternativas": {
        "a": "Usar cores chamativas para destacar todos os dados",
        "b": "Adicionar muitos elementos decorativos para tornar o gráfico interessante",
        "c": "Incluir título e rótulos claros nos eixos",
        "d": "Mostrar todos os dados, mesmo os irrelevantes, para dar contexto"
      },
      "correta": "c",
      "explicacao": "Incluir título e rótulos claros nos eixos é uma prática recomendada para facilitar a compreensão do gráfico, especialmente para um público não técnico.",
      "fonte": "visualizacao.principios"
    },
    {
      "id": "dados-int-14",
      "nivel": "intermediario",
      "pergunta": "Você está utilizando o Matplotlib para criar um gráfico de dispersão e deseja adicionar uma legenda para identificar diferentes categorias. Qual comando você deve usar após plotar os dados?",
      "alternativas": {
        "a": "plt.title()",
        "b": "plt.xlabel()",
        "c": "plt.legend()",
        "d": "plt.grid()"
      },
      "correta": "c",
      "explicacao": "O comando plt.legend() é utilizado para adicionar uma legenda ao gráfico, identificando as diferentes categorias representadas.",
      "fonte": "visualizacao.matplotlib"
    },
    {
      "id": "dados-int-15",
      "nivel": "intermediario",
      "pergunta": "Você quer criar um gráfico de boxplot para resumir a distribuição de uma variável e identificar outliers. Qual biblioteca você deve usar para facilitar esse processo?",
      "alternativas": {
        "a": "Matplotlib",
        "b": "Pandas",
        "c": "Seaborn",
        "d": "NumPy"
      },
      "correta": "c",
      "explicacao": "O Seaborn facilita a criação de gráficos estatísticos, como boxplots, com menos código e uma aparência mais cuidada por padrão.",
      "fonte": "visualizacao.seaborn"
    },
    {
      "id": "dados-av-01",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um modelo de previsão de preços de imóveis e percebe que ele se sai muito bem nos dados de treino, mas mal nos dados de teste. O que isso indica?",
      "alternativas": {
        "a": "O modelo está aprendendo a generalizar bem os padrões dos dados.",
        "b": "O modelo pode estar sofrendo de overfitting, decorando os dados de treino.",
        "c": "O modelo é muito simples e não consegue aprender os padrões.",
        "d": "O conjunto de teste pode estar com dados muito diferentes dos de treino."
      },
      "correta": "b",
      "explicacao": "O overfitting ocorre quando o modelo aprende os dados de treino em excesso, resultando em um desempenho ruim em dados que não viu antes.",
      "fonte": "ml.treino"
    },
    {
      "id": "dados-av-02",
      "nivel": "avancado",
      "pergunta": "Você precisa prever se um cliente vai cancelar ou não a assinatura de um serviço. Qual técnica de aprendizado supervisionado você deve usar?",
      "alternativas": {
        "a": "Regressão, pois você quer prever um número.",
        "b": "Classificação, pois você quer prever uma categoria.",
        "c": "Clustering, pois você quer agrupar clientes semelhantes.",
        "d": "Análise de séries temporais, pois envolve dados ao longo do tempo."
      },
      "correta": "b",
      "explicacao": "A classificação é a técnica adequada, pois envolve prever uma categoria (cancelar ou não).",
      "fonte": "ml.supervisionado"
    },
    {
      "id": "dados-av-03",
      "nivel": "avancado",
      "pergunta": "Ao utilizar o scikit-learn, você separou seus dados em treino e teste. Qual é o próximo passo após a separação?",
      "alternativas": {
        "a": "Comparar as previsões com as respostas reais.",
        "b": "Criar o modelo e chamar o método fit com os dados de treino.",
        "c": "Ajustar as configurações do modelo para melhorar a performance.",
        "d": "Aumentar o tamanho do conjunto de teste para mais dados."
      },
      "correta": "b",
      "explicacao": "Após separar os dados, o próximo passo é criar o modelo e usar o método fit para treiná-lo com os dados de treino.",
      "fonte": "ml.sklearn"
    },
    {
      "id": "dados-av-04",
      "nivel": "avancado",
      "pergunta": "Você está avaliando um modelo de classificação e percebe que ele acerta 99% dos casos, mas a maioria dos casos pertence a uma única classe. O que isso pode indicar?",
      "alternativas": {
        "a": "O modelo é excelente, pois tem uma alta taxa de acerto.",
        "b": "O modelo pode estar apenas prevendo a classe majoritária.",
        "c": "O modelo está generalizando bem, pois acerta a maioria dos casos.",
        "d": "O modelo precisa de mais dados para melhorar a precisão."
      },
      "correta": "b",
      "explicacao": "Uma alta taxa de acerto em um problema desbalanceado pode indicar que o modelo está apenas prevendo a classe majoritária, não aprendendo a discriminar as classes.",
      "fonte": "ml.treino"
    },
    {
      "id": "dados-av-05",
      "nivel": "avancado",
      "pergunta": "Você está criando um modelo de previsão de vendas e decide usar uma árvore de decisão. Qual é uma boa prática ao começar?",
      "alternativas": {
        "a": "Usar a árvore de decisão complexa para capturar todos os padrões.",
        "b": "Começar com um modelo simples e depois complicar se necessário.",
        "c": "Ignorar a separação dos dados em treino e teste.",
        "d": "Treinar o modelo com todos os dados disponíveis de uma vez."
      },
      "correta": "b",
      "explicacao": "Começar com um modelo simples é uma boa prática, pois facilita a compreensão e a avaliação do desempenho inicial.",
      "fonte": "ml.supervisionado"
    },
    {
      "id": "dados-av-06",
      "nivel": "avancado",
      "pergunta": "Você está utilizando o scikit-learn e terminou de treinar seu modelo. Qual é a próxima etapa recomendada para avaliar seu desempenho?",
      "alternativas": {
        "a": "Aumentar o número de features para melhorar a precisão.",
        "b": "Usar o conjunto de teste para prever e comparar com os valores reais.",
        "c": "Aplicar o modelo em novos dados sem validação.",
        "d": "Re-treinar o modelo com dados de teste para melhorar a performance."
      },
      "correta": "b",
      "explicacao": "A próxima etapa é prever com o conjunto de teste e comparar as previsões com os valores reais para avaliar o desempenho do modelo.",
      "fonte": "ml.sklearn"
    },
    {
      "id": "dados-av-07",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um modelo para prever a temperatura de amanhã. Qual abordagem de aprendizado supervisionado você deve escolher?",
      "alternativas": {
        "a": "Classificação, pois a temperatura é uma categoria.",
        "b": "Regressão, pois a temperatura é um valor contínuo.",
        "c": "Clustering, pois você quer agrupar dias semelhantes.",
        "d": "Análise de séries temporais, pois envolve dados ao longo do tempo."
      },
      "correta": "b",
      "explicacao": "A regressão é a abordagem correta, pois você está prevendo um valor contínuo (temperatura).",
      "fonte": "ml.supervisionado"
    },
    {
      "id": "dados-av-08",
      "nivel": "avancado",
      "pergunta": "Você está limpando seus dados antes de treinar um modelo. Qual é um passo importante nesta fase?",
      "alternativas": {
        "a": "Remover todas as colunas que têm dados faltantes.",
        "b": "Preencher dados faltantes com a média ou mediana das colunas.",
        "c": "Manter todas as colunas, mesmo as irrelevantes, para não perder informação.",
        "d": "Transformar todas as variáveis em categóricas para simplificar o modelo."
      },
      "correta": "b",
      "explicacao": "Preencher dados faltantes com a média ou mediana é uma prática comum para evitar a perda de informações importantes.",
      "fonte": "ml.oque"
    },
    {
      "id": "dados-av-09",
      "nivel": "avancado",
      "pergunta": "Você está avaliando um modelo de regressão e precisa entender o erro médio das previsões. Qual métrica você deve usar?",
      "alternativas": {
        "a": "Acurácia, pois mede a proporção de acertos.",
        "b": "Erro médio absoluto, pois mede a diferença média entre previsto e real.",
        "c": "F1 Score, pois é útil para problemas de classificação.",
        "d": "Precisão, pois mede a relevância das previsões."
      },
      "correta": "b",
      "explicacao": "O erro médio absoluto é a métrica adequada para medir a diferença média entre as previsões e os valores reais em um modelo de regressão.",
      "fonte": "ml.treino"
    },
    {
      "id": "dados-av-10",
      "nivel": "avancado",
      "pergunta": "Você está escolhendo um dataset para sua análise. Qual abordagem garante que você tenha dados suficientes para aprender, mas não tão complicados que desanime?",
      "alternativas": {
        "a": "Escolher um dataset pequeno e bem organizado para evitar problemas.",
        "b": "Optar por um dataset grande e desorganizado para ter mais desafios.",
        "c": "Selecionar um dataset de tamanho médio com algumas imperfeições para praticar a limpeza.",
        "d": "Usar um dataset de uma fonte desconhecida para explorar temas novos."
      },
      "correta": "c",
      "explicacao": "Um dataset de tamanho médio com algumas imperfeições permite praticar a limpeza e a análise sem ser desmotivador.",
      "fonte": "projeto.dataset"
    },
    {
      "id": "dados-av-11",
      "nivel": "avancado",
      "pergunta": "Ao comunicar os resultados de sua análise, qual é a melhor prática para garantir que seu público entenda a mensagem principal?",
      "alternativas": {
        "a": "Apresentar a conclusão no final da apresentação para criar expectativa.",
        "b": "Começar com a conclusão e depois detalhar as evidências que a sustentam.",
        "c": "Focar em gráficos complexos para impressionar o público.",
        "d": "Usar muitos detalhes técnicos para mostrar seu conhecimento."
      },
      "correta": "b",
      "explicacao": "Começar com a conclusão permite que o público entenda rapidamente a mensagem principal antes de ver os detalhes.",
      "fonte": "projeto.comunicacao"
    },
    {
      "id": "dados-av-12",
      "nivel": "avancado",
      "pergunta": "Você está finalizando sua análise de um dataset público. Qual é o elemento mais importante a incluir no seu notebook para demonstrar sua capacidade analítica?",
      "alternativas": {
        "a": "Um gráfico colorido que represente todos os dados.",
        "b": "Um resumo da análise em uma frase e um gráfico que a sustente.",
        "c": "Um código extenso sem explicações para mostrar seu domínio técnico.",
        "d": "Uma lista de todas as funções do Python que você usou."
      },
      "correta": "b",
      "explicacao": "Um resumo claro e um gráfico que sustente a conclusão demonstram a capacidade de comunicação e síntese da análise.",
      "fonte": "projeto.analise"
    },
    {
      "id": "dados-av-13",
      "nivel": "avancado",
      "pergunta": "Você está inspecionando um novo dataset com o Pandas. Qual comando é mais útil para obter uma visão geral dos dados e suas características?",
      "alternativas": {
        "a": "Utilizar .describe() para ver apenas os dados numéricos.",
        "b": "Executar .info() para entender a estrutura e tipos de dados.",
        "c": "Aplicar .head() para visualizar todos os dados de uma vez.",
        "d": "Fazer um gráfico de dispersão imediatamente."
      },
      "correta": "b",
      "explicacao": ".info() fornece uma visão geral da estrutura e tipos de dados, essencial para entender o dataset antes de prosseguir.",
      "fonte": "projeto.dataset"
    },
    {
      "id": "dados-av-14",
      "nivel": "avancado",
      "pergunta": "Durante a análise, você percebe que os dados têm algumas inconsistências. Qual é a abordagem mais adequada para lidar com isso?",
      "alternativas": {
        "a": "Ignorar as inconsistências e prosseguir com a análise.",
        "b": "Documentar as inconsistências e explicar como elas afetam os resultados.",
        "c": "Alterar os dados para que pareçam perfeitos antes de analisar.",
        "d": "Focar apenas nas partes dos dados que parecem corretas."
      },
      "correta": "b",
      "explicacao": "Documentar as inconsistências e suas implicações demonstra maturidade analítica e transparência na análise.",
      "fonte": "projeto.analise"
    },
    {
      "id": "dados-av-15",
      "nivel": "avancado",
      "pergunta": "Você está preparando a apresentação dos resultados da sua análise. Como deve escolher os gráficos que irá usar?",
      "alternativas": {
        "a": "Escolher os gráficos que você acha mais bonitos.",
        "b": "Selecionar gráficos que respondam diretamente às perguntas que você fez na análise.",
        "c": "Usar gráficos complexos para mostrar suas habilidades técnicas.",
        "d": "Focar em gráficos que ocupem mais espaço na apresentação."
      },
      "correta": "b",
      "explicacao": "Escolher gráficos que respondem às perguntas garante que a comunicação seja clara e relevante para o público.",
      "fonte": "projeto.comunicacao"
    }
  ]
};

export default pool;
