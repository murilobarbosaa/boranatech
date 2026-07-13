import type { RoadmapV2 } from "../types";

export const dados: RoadmapV2 = {
  slug: "dados",
  area: "dados",
  title: "Ciência de Dados do Zero",
  level: "Iniciante",
  description:
    "De Python e SQL à primeira análise de um dataset real, com estatística, Pandas e visualização. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é trabalhar com dados, como um projeto flui do bruto ao insight e o ambiente onde tudo acontece.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é ciência de dados",
          description:
            "Transformar dados brutos em decisões, no encontro de programação, estatística e negócio.",
          content:
            "Ciência de dados é a prática de transformar dados brutos em respostas que ajudam a decidir. Toda empresa gera dados o tempo todo (vendas, cliques, cadastros, sensores), mas dado solto não vale nada; o valor aparece quando alguém o organiza, analisa e tira dali uma conclusão útil. Esse alguém é o profissional de dados.\n\nO trabalho mora no encontro de três mundos. **Programação**, pra coletar e manipular os dados em escala. **Estatística**, pra separar padrão real de coincidência. E **conhecimento do negócio**, pra fazer a pergunta certa e interpretar o resultado com sentido. Faltando uma das três, a análise trava ou engana.\n\nDentro da área existem perfis com focos diferentes: o analista responde perguntas e monta relatórios, o cientista constrói modelos que preveem, o engenheiro de dados cuida da infraestrutura que move tudo. Esta trilha cobre a base comum a todos eles, que é por onde qualquer um começa.\n\nUma expectativa pra ajustar logo: a fama é de modelos sofisticados de inteligência artificial, mas a maior parte do tempo real é gasta coletando e **limpando** dados. Quem se diverte com esse trabalho de detetive tem tudo pra prosperar aqui.",
        },
        {
          id: "fundamentos.fluxo",
          title: "O fluxo de um projeto de dados",
          description:
            "As etapas que todo trabalho percorre, do dado bruto à conclusão comunicada.",
          content:
            "Quase todo projeto de dados segue o mesmo caminho, e conhecê-lo cedo te dá um mapa pra não se perder. São cinco etapas encadeadas.\n\nPrimeiro, a **pergunta**: o que se quer descobrir? Sem uma pergunta clara, você junta dados sem rumo. Segundo, a **coleta**: buscar os dados onde eles estão, num arquivo, num banco ou numa API. Terceiro, a **limpeza**, a etapa mais demorada e menos glamourosa: corrigir valores faltando, formatos errados, duplicatas e categorias bagunçadas. Dado sujo gera conclusão errada, então essa fase decide a qualidade do resto.\n\nQuarto, a **análise**: explorar, calcular estatísticas, cruzar variáveis e, quando faz sentido, treinar um modelo. Quinto, a **comunicação**: traduzir o que você achou em gráficos e uma narrativa que alguém de fora entenda e use pra decidir.\n\nDuas verdades que iniciantes descobrem na prática. O processo raramente é uma linha reta; você volta etapas o tempo todo, porque a análise revela um problema na limpeza, e a limpeza muda a pergunta. E a última etapa, comunicar, costuma valer tanto quanto as anteriores: uma análise brilhante que ninguém entende não muda nada. Esta trilha percorre exatamente essas etapas.",
        },
        {
          id: "fundamentos.ambiente",
          title: "Notebook, Jupyter e Colab",
          description:
            "O ambiente onde análises de dados são escritas, executadas e compartilhadas.",
          content:
            "Quem trabalha com dados raramente escreve um programa que roda do início ao fim. O trabalho é exploratório: você testa uma ideia, vê o resultado, ajusta e testa de novo. A ferramenta feita pra isso é o **notebook**, um documento dividido em células onde você escreve um pedaço de código, executa só ele e vê o resultado (um número, uma tabela, um gráfico) logo abaixo, sem rodar tudo de novo.\n\nO notebook mais usado é o **Jupyter**. Ele mistura código, texto explicativo e gráficos no mesmo documento, o que o torna perfeito tanto pra investigar quanto pra apresentar uma análise pronta.\n\nPra começar sem instalar nada, existe o **Google Colab**: um Jupyter que roda no navegador, de graça, com as principais bibliotecas de dados já disponíveis. Você abre, escreve Python e executa, sem configurar ambiente. É o caminho mais rápido pra dar os primeiros passos e onde você pode fazer boa parte desta trilha.\n\nMais pra frente vale aprender a rodar o Jupyter na sua própria máquina, pra ter controle sobre as versões das bibliotecas. Mas no início, tirar o atrito de instalação importa mais que tudo: o Colab deixa você focar em aprender dados, não em configurar ferramenta.",
          resources: [
            {
              label: "Google Colab",
              url: "https://colab.research.google.com/",
              kind: "doc",
            },
            {
              label: "Jupyter (documentação oficial)",
              url: "https://docs.jupyter.org/en/latest/",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.git",
          title: "Git e GitHub",
          description:
            "Versionar o código das análises e publicar seus projetos.",
          optional: true,
          content:
            'Git é um sistema de controle de versão: ele guarda o histórico do seu trabalho em "fotografias" chamadas **commits**, permitindo voltar atrás quando algo quebra e comparar o que mudou. O **GitHub** é o site que hospeda esses repositórios na nuvem.\n\nEm dados, o Git resolve um problema clássico: aquela coleção de arquivos chamados `analise_final.ipynb`, `analise_final_v2.ipynb`, `analise_final_AGORA.ipynb`. Com Git, você mantém um arquivo só e um histórico limpo de versões, sem bagunça.\n\nO ciclo básico tem três passos: `git add` marca os arquivos, `git commit -m "mensagem"` registra a fotografia com uma frase curta, e `git push` envia tudo pro GitHub.\n\nÉ opcional pra dar os primeiros passos, mas vira essencial rápido por dois motivos. Times de dados trabalham em repositórios compartilhados, então versionamento é o básico do dia a dia. E seu GitHub funciona como portfólio: cada análise publicada lá, com um bom README explicando a pergunta, os dados e a conclusão, é uma vitrine pra recrutadores. Termine os projetos desta trilha publicados.',
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
      id: "python",
      title: "Python",
      description:
        "A linguagem padrão da ciência de dados: o suficiente pra manipular dados com confiança.",
      level: "iniciante",
      children: [
        {
          id: "python.basico",
          title: "Python básico",
          description:
            "Variáveis, tipos e o controle de fluxo que sustentam qualquer análise.",
          content:
            "**Python** é a linguagem dominante em ciência de dados, e não por acaso: a sintaxe é limpa e legível, parecida com inglês, e quase toda biblioteca de dados é escrita pra ela. É por aqui que você começa.\n\nA boa notícia pra quem teme programar: você não precisa virar engenheiro de software. Precisa de uma base sólida no essencial. Comece pelas **variáveis** (guardar um valor com um nome) e pelos **tipos** do dia a dia: texto (`str`), número inteiro (`int`), decimal (`float`) e verdadeiro/falso (`bool`).\n\nEm seguida, o **controle de fluxo**: o `if` pra decidir entre caminhos (se a venda for acima de mil, marque como grande) e o laço `for` pra repetir uma ação sobre vários itens (percorrer cada linha de um conjunto de dados). Some a isso as **funções**, blocos de código reutilizáveis que recebem entradas e devolvem um resultado.\n\nNão tente decorar tudo nem mergulhar em recursos avançados da linguagem. O objetivo desta etapa é ler e escrever Python simples com tranquilidade, porque é essa base que as bibliotecas de dados vão usar. Pratique em pequenos exercícios antes de seguir; a fluência vem da repetição, não da leitura passiva.",
          resources: [
            {
              label: "Python: tutorial oficial (em português)",
              url: "https://docs.python.org/pt-br/3/tutorial/introduction.html",
              kind: "doc",
            },
            {
              label: "Kaggle Learn: Python",
              url: "https://www.kaggle.com/learn/python",
              kind: "curso",
            },
          ],
        },
        {
          id: "python.estruturas",
          title: "Listas e dicionários",
          description:
            "As estruturas que guardam coleções de dados, base de tudo o que vem depois.",
          content:
            "Dados quase nunca são um valor só; são coleções. Por isso duas estruturas do Python merecem atenção especial, porque sustentam tudo o que vem na trilha.\n\nA **lista** é uma sequência ordenada de itens, escrita entre colchetes: `[10, 20, 30]`. Você acessa por posição (a primeira é a de índice 0), adiciona, remove e percorre item a item com um laço. Pense numa coluna de uma planilha: uma sequência de valores em ordem.\n\nO **dicionário** guarda pares de chave e valor, escrito entre chaves: `{\"nome\": \"Ana\", \"idade\": 30}`. Em vez de acessar por posição, você acessa pelo nome da chave. É a forma natural de representar um registro com vários campos, como uma linha de uma tabela onde cada coluna tem um nome.\n\nRepare na combinação poderosa: uma **lista de dicionários** representa uma tabela inteira, cada dicionário sendo uma linha. Essa é exatamente a forma como dados costumam chegar de uma API ou de um arquivo, então você vai esbarrar nela o tempo todo.\n\nDomine bem essas duas estruturas, junto com o laço `for` pra percorrê-las. Quando você chegar no Pandas, vai entender que ele é, no fundo, uma forma muito mais conveniente de trabalhar com esse mesmo tipo de coleção.",
          resources: [
            {
              label: "Python: estruturas de dados (tutorial oficial)",
              url: "https://docs.python.org/pt-br/3/tutorial/datastructures.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "python.bibliotecas",
          title: "Bibliotecas e o ecossistema",
          description:
            "Como reaproveitar código pronto, o que torna o Python tão forte em dados.",
          content:
            "O que faz o Python reinar em dados não é só a linguagem; é o **ecossistema** de bibliotecas em volta dela. Uma **biblioteca** é um pacote de código pronto que alguém já escreveu e testou, e que você aproveita em vez de reinventar. Pra ler um arquivo, calcular uma média de milhões de linhas ou desenhar um gráfico, existe uma biblioteca madura esperando por você.\n\nO mecanismo tem duas partes. Você **instala** a biblioteca uma vez, com a ferramenta `pip` (no Colab, a maioria já vem instalada). Depois, no seu código, você a **importa** com a palavra `import` pra poder usá-la. É comum dar um apelido na importação, como `import pandas as pd`, pra digitar menos.\n\nVocê vai encontrar nomes que se repetem em qualquer projeto de dados, e cada um aparece em uma seção desta trilha: **Pandas** pra manipular tabelas, **NumPy** pra cálculo numérico, **Matplotlib** e **seaborn** pra gráficos, **scikit-learn** pra modelos. Não precisa conhecê-las agora; o importante é entender o conceito.\n\nA mentalidade certa em dados é esta: antes de escrever uma solução do zero, pergunte-se se já não existe uma biblioteca consagrada que faz aquilo melhor. Quase sempre existe.",
        },
      ],
    },
    {
      id: "sql",
      title: "SQL",
      description:
        "A linguagem pra buscar dados onde eles realmente moram: os bancos de dados.",
      level: "iniciante",
      children: [
        {
          id: "sql.select",
          title: "Buscar dados com SELECT",
          description:
            "A consulta que extrai exatamente as colunas e linhas que você quer.",
          content:
            "Boa parte dos dados de uma empresa não vive em arquivos soltos; vive em **bancos de dados**, organizados em **tabelas** com linhas e colunas, como planilhas muito grandes e bem estruturadas. A linguagem universal pra conversar com esses bancos é o **SQL**, e ela é uma habilidade tão básica quanto Python pra quem trabalha com dados.\n\nO comando central é o `SELECT`, que busca dados. A forma mais simples escolhe colunas de uma tabela: `SELECT nome, idade FROM clientes` traz só essas duas colunas de todos os clientes. Pra trazer tudo, usa-se `SELECT * FROM clientes`, embora em tabelas grandes seja melhor pedir só as colunas que importam.\n\nA leitura é quase em inglês corrente: selecione tais colunas, de tal tabela. Essa clareza é uma das razões de o SQL ter sobrevivido por décadas praticamente sem mudar.\n\nUm banco gratuito e muito usado no mercado pra praticar é o **PostgreSQL**. Comece criando uma tabela pequena, inserindo algumas linhas e rodando seus primeiros `SELECT` pra sentir como a consulta responde. O objetivo desta etapa é conseguir extrair de um banco exatamente o recorte de dados que sua análise precisa, em vez de depender de outra pessoa pra isso.",
          resources: [
            {
              label: "PostgreSQL: SELECT (tutorial oficial)",
              url: "https://www.postgresql.org/docs/current/tutorial-select.html",
              kind: "doc",
            },
            {
              label: "Kaggle Learn: Intro to SQL",
              url: "https://www.kaggle.com/learn/intro-to-sql",
              kind: "curso",
            },
          ],
        },
        {
          id: "sql.filtros",
          title: "Filtrar e ordenar",
          description:
            "Recortar as linhas que interessam e colocá-las na ordem certa.",
          content:
            "Buscar uma tabela inteira raramente é o que você quer. O poder do SQL aparece quando você recorta: trazer só as linhas relevantes e organizá-las.\n\nO `WHERE` filtra por condição. `SELECT * FROM vendas WHERE valor > 1000` traz só as vendas acima de mil. Você combina condições com `AND` e `OR` (vendas acima de mil **e** da região Sul), e tem operadores úteis como `BETWEEN` pra faixas, `IN` pra listas de valores e `LIKE` pra buscar trechos de texto. Filtrar bem é o que transforma uma montanha de dados na fatia que responde sua pergunta.\n\nO `ORDER BY` ordena o resultado. `ORDER BY valor DESC` mostra as maiores vendas primeiro (`DESC` é decrescente, `ASC` é crescente). Combinado com o `LIMIT`, que corta a quantidade de linhas, você responde perguntas do tipo top 10: as dez maiores vendas do mês.\n\nUm cuidado com textos: comparações costumam diferenciar maiúsculas de minúsculas, e valores ausentes (o famoso `NULL`) têm regras próprias e não se comportam como zero ou texto vazio. Esses detalhes pegam todo iniciante, então confira sempre se o filtro trouxe o que você esperava. Filtrar e ordenar são, junto com o `SELECT`, o trio que resolve a maioria das consultas do dia a dia.",
        },
        {
          id: "sql.agregacao",
          title: "Agrupar e agregar",
          description:
            "Resumir muitas linhas em totais, médias e contagens por categoria.",
          content:
            "Até aqui você buscou linhas individuais. Mas análise de dados vive de **resumos**: qual o total de vendas, a média por categoria, quantos clientes por estado. Pra isso existem as funções de agregação e o agrupamento.\n\nAs funções de agregação condensam muitas linhas num número só: `COUNT` conta, `SUM` soma, `AVG` calcula a média, `MIN` e `MAX` pegam o menor e o maior. `SELECT AVG(valor) FROM vendas` devolve a média de todas as vendas, uma única linha de resposta.\n\nO salto de poder vem com o `GROUP BY`, que aplica a agregação **por categoria** em vez de no todo. `SELECT regiao, SUM(valor) FROM vendas GROUP BY regiao` devolve o total de vendas de cada região, uma linha por região. É o equivalente em SQL da tabela dinâmica de uma planilha, e responde a maioria das perguntas de negócio.\n\nQuando você precisa filtrar **depois** de agrupar (mostrar só as regiões cujo total passou de um milhão), usa-se o `HAVING`, que é como o `WHERE` mas para grupos.\n\nCom `SELECT`, `WHERE`, `ORDER BY` e `GROUP BY` você já cobre o grosso do SQL do dia a dia de um analista. O resto, como juntar tabelas com `JOIN`, vem naturalmente quando os projetos exigirem.",
        },
      ],
    },
    {
      id: "estatistica",
      title: "Estatística básica",
      description:
        "As ideias que separam um padrão real de uma coincidência e dão sentido aos números.",
      level: "intermediario",
      children: [
        {
          id: "estatistica.descritiva",
          title: "Estatística descritiva",
          description:
            "Resumir um conjunto de números em poucas medidas que contam a história.",
          content:
            "Diante de uma coluna com milhares de números, você precisa de medidas que a resumam. É isso que a **estatística descritiva** faz: descrever um conjunto de dados em poucos valores.\n\nAs primeiras são as medidas de **tendência central**, que apontam o centro dos dados. A **média** é a soma dividida pela quantidade. A **mediana** é o valor do meio quando você ordena tudo. A diferença entre elas é uma das lições mais úteis de toda a área: a média é sensível a valores extremos, a mediana não. Numa lista de salários onde um diretor ganha muito, a média sobe e engana; a mediana mostra melhor o salário típico. Saber qual usar evita conclusões erradas.\n\nO segundo grupo são as medidas de **dispersão**, que dizem o quanto os dados variam em torno do centro. O **desvio padrão** é a principal: pequeno significa dados próximos da média, grande significa dados espalhados. Duas turmas podem ter a mesma média de notas e realidades completamente diferentes, e só a dispersão revela isso.\n\nNa prática, você não calcula nada disso na mão; o Pandas devolve todas essas medidas de uma vez. Mas entender o que cada número significa é o que te permite interpretar, em vez de só apertar um botão e repetir um valor sem saber se ele faz sentido.",
        },
        {
          id: "estatistica.distribuicao",
          title: "Distribuições e variação",
          description:
            "Enxergar o formato dos dados, não só seu resumo em um número.",
          content:
            "Resumir dados num número só é útil, mas perigoso quando vira a única visão. A **distribuição** mostra o quadro completo: como os valores se espalham, onde se concentram e o que foge do padrão.\n\nUma forma comum é pensar em faixas e contar quantos dados caem em cada uma; o gráfico que mostra isso, o histograma, você vê na seção de visualização. O importante agora é a intuição: distribuições têm **formato**. Algumas são simétricas em torno do centro (a famosa forma de sino), outras são puxadas pra um lado (muitos valores baixos e poucos altíssimos, como em renda), e essa assimetria muda quais medidas fazem sentido usar.\n\nDois conceitos práticos ajudam o dia a dia. Os **quartis** dividem os dados ordenados em quatro partes iguais, e a faixa entre o primeiro e o terceiro quartil mostra onde mora a metade central dos dados, ignorando extremos. E os **outliers**, valores muito fora do resto, que merecem atenção especial: às vezes são erro de digitação pra corrigir, às vezes são o achado mais interessante da análise.\n\nA lição central desta etapa é uma só: sempre olhe o formato dos dados antes de confiar num resumo. Duas distribuições muito diferentes podem ter a mesma média, e quem decide só pelo número médio toma decisões cegas.",
        },
        {
          id: "estatistica.correlacao",
          title: "Correlação e causalidade",
          description:
            "Medir se duas variáveis andam juntas, sem cair na armadilha de concluir causa.",
          optional: true,
          content:
            "Boa parte das perguntas de dados é sobre relações: vendas sobem quando investe em anúncio? Quem usa mais o app cancela menos? A **correlação** é a medida que responde se duas variáveis tendem a se mover juntas.\n\nEla costuma ser resumida num número entre -1 e 1. Perto de 1, as duas sobem juntas; perto de -1, quando uma sobe a outra desce; perto de 0, não há relação linear clara. É uma ferramenta rápida pra encontrar pistas no meio de muitas variáveis, e o Pandas calcula a correlação entre todas as colunas com um comando.\n\nAgora o aviso mais importante de toda a estatística aplicada: **correlação não é causalidade**. Duas coisas variarem juntas não significa que uma causa a outra. Pode haver um terceiro fator por trás das duas, ou ser puro acaso. O exemplo clássico: venda de sorvete e número de afogamentos sobem juntos, mas sorvete não causa afogamento; o calor do verão move os dois.\n\nPra iniciante, a regra prática salva carreiras: use a correlação pra **levantar hipóteses**, nunca pra **provar causa**. Provar que algo causa outra coisa exige cuidado bem maior, como experimentos controlados. Confundir os dois é o erro que gera relatórios bonitos e decisões desastrosas.",
        },
      ],
    },
    {
      id: "pandas",
      title: "Pandas",
      description:
        "A biblioteca que traz a planilha pro Python e vira o seu canivete suíço de dados.",
      level: "intermediario",
      children: [
        {
          id: "pandas.dataframe",
          title: "DataFrame: a tabela do Python",
          description:
            "A estrutura central pra carregar e inspecionar dados tabulares.",
          content:
            "O **Pandas** é a biblioteca mais importante da trilha, a que você vai usar todo dia. Ela traz pro Python uma estrutura chamada **DataFrame**: uma tabela com linhas e colunas, exatamente como uma planilha ou o resultado de uma consulta SQL, mas que você manipula com código.\n\nO ponto de partida é carregar dados. Com uma linha como `pd.read_csv(\"dados.csv\")`, o Pandas lê um arquivo e devolve um DataFrame pronto. Ele lê vários formatos, mas o CSV (texto com valores separados por vírgula) é o mais comum no começo.\n\nAntes de qualquer análise, você inspeciona o que chegou. Alguns comandos viram reflexo: `.head()` mostra as primeiras linhas, `.info()` revela as colunas e seus tipos, `.describe()` calcula de uma vez aquelas estatísticas descritivas da seção anterior, e `.shape` informa quantas linhas e colunas existem. Esse ritual de inspeção é a primeira coisa a fazer com qualquer dataset novo.\n\nVocê acessa uma coluna pelo nome, como `df[\"idade\"]`, e a partir daí calcula, filtra e transforma. A grande vantagem sobre uma planilha é a repetibilidade: o mesmo código roda de novo num arquivo atualizado sem refazer nada na mão. Dominar o DataFrame é dominar o trabalho prático de dados.",
          resources: [
            {
              label: "Pandas: começando (documentação oficial)",
              url: "https://pandas.pydata.org/docs/getting_started/index.html",
              kind: "doc",
            },
            {
              label: "Kaggle Learn: Pandas",
              url: "https://www.kaggle.com/learn/pandas",
              kind: "curso",
            },
          ],
        },
        {
          id: "pandas.limpeza",
          title: "Limpar dados",
          description:
            "A etapa que mais consome tempo e mais decide a qualidade da análise.",
          content:
            "Dados do mundo real chegam sujos: campos vazios, datas em formatos diferentes, nomes escritos de cinco jeitos, linhas repetidas. A **limpeza** é a etapa que mais consome tempo num projeto, e não é desperdício; é o que garante que a análise não vai mentir. A regra é dura e verdadeira: lixo entra, lixo sai.\n\nO problema mais frequente são os **valores ausentes**, que o Pandas marca como `NaN`. Você primeiro os localiza (com `.isnull().sum()`, que conta os faltantes por coluna) e depois decide o que fazer: remover as linhas, ou preencher com algum valor razoável, como a mediana da coluna. Não há resposta única; a escolha depende do contexto e você precisa justificá-la.\n\nOutros clássicos: **duplicatas**, que você remove com `.drop_duplicates()`; **tipos errados**, como números que vieram como texto e precisam ser convertidos antes de qualquer cálculo; e **categorias inconsistentes**, como \"SP\", \"sp\" e \"São Paulo\" significando a mesma coisa e bagunçando qualquer agrupamento.\n\nUm hábito profissional desde já: nunca altere o arquivo original. Faça a limpeza em código, num notebook, de forma que qualquer pessoa (inclusive você no futuro) veja exatamente o que foi mudado e por quê. Limpeza documentada é análise confiável; limpeza feita na mão e esquecida é uma bomba-relógio.",
        },
        {
          id: "pandas.transformar",
          title: "Filtrar, agrupar e transformar",
          description:
            "As operações do dia a dia que extraem respostas de um DataFrame limpo.",
          content:
            "Com os dados limpos, começa a parte que responde perguntas. As operações do Pandas espelham o que você já viu em SQL, agora dentro do Python e encadeáveis com fluidez.\n\n**Filtrar** seleciona as linhas que interessam por uma condição, como `df[df[\"idade\"] > 30]`, que traz só quem tem mais de 30 anos. É o equivalente ao `WHERE` do SQL. **Criar colunas** deriva informação nova a partir das existentes, como calcular uma coluna de margem a partir de receita e custo; é uma das operações mais comuns e poderosas.\n\nO **agrupamento** com `.groupby()` é o coração da análise: `df.groupby(\"regiao\")[\"valor\"].sum()` devolve o total por região, exatamente como o `GROUP BY` do SQL. Você agrupa por uma categoria e aplica uma agregação (soma, média, contagem) a cada grupo, condensando milhares de linhas em uma tabela-resumo que conta uma história.\n\nUm conforto pra quem vem do SQL: os conceitos são os mesmos, só a forma de escrever muda. Quem aprendeu a pensar em filtros e agrupamentos numa ferramenta transfere o raciocínio pra outra com facilidade.\n\nDominando filtrar, criar colunas e agrupar, você já consegue extrair de um DataFrame a maioria das respostas que uma análise exploratória exige, e tem em mãos os números que a próxima seção vai transformar em gráficos.",
        },
        {
          id: "pandas.numpy",
          title: "NumPy por baixo",
          description:
            "A base numérica em que o Pandas se apoia, útil pra cálculos em massa.",
          optional: true,
          content:
            "Embaixo do Pandas existe outra biblioteca fazendo o trabalho pesado de cálculo: o **NumPy**. Você nem sempre o usa diretamente, mas entender o papel dele esclarece por que o Pandas é tão rápido.\n\nA estrutura central do NumPy é o **array**, uma sequência de números otimizada pra cálculo. A diferença pra uma lista comum do Python é a velocidade: o NumPy aplica uma operação sobre milhões de números de uma vez, em vez de percorrer um por um num laço. Multiplicar uma coluna inteira por dois, somar duas colunas, calcular a raiz de cada valor: tudo isso roda numa tacada só, e é isso que torna viável trabalhar com bases grandes.\n\nNa prática, cada coluna de um DataFrame é, por baixo, um array do NumPy. Quando você calcula a média de uma coluna no Pandas, é o NumPy quem faz a conta. Por isso a recomendação de evitar laços manuais sobre os dados quando existe uma operação pronta: a versão vetorizada é muito mais rápida e mais limpa.\n\nVocê pode ir longe sabendo pouco de NumPy diretamente, porque o Pandas embrulha quase tudo. Mas vale conhecer o conceito de array e o de operação aplicada à coluna inteira, porque eles aparecem o tempo todo e, em cálculos numéricos mais específicos, você vai recorrer ao NumPy de propósito.",
          resources: [
            {
              label: "NumPy (documentação oficial)",
              url: "https://numpy.org/doc/stable/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "visualizacao",
      title: "Visualização",
      description:
        "Transformar números em gráficos que revelam padrões e convencem quem decide.",
      level: "intermediario",
      children: [
        {
          id: "visualizacao.principios",
          title: "Por que e como visualizar",
          description:
            "O gráfico certo revela o que uma tabela esconde e comunica o achado.",
          content:
            "Uma tabela com mil linhas esconde seus padrões; um bom gráfico os revela num instante. Visualização tem dois papéis na ciência de dados, e os dois importam.\n\nO primeiro é **explorar**. Durante a análise, você desenha gráficos rápidos pra enxergar o que está acontecendo: a distribuição de uma coluna, a relação entre duas variáveis, a evolução ao longo do tempo. Muitos achados aparecem aqui, no olho, antes de qualquer cálculo formal. Um valor estranho que passou despercebido na tabela salta num gráfico.\n\nO segundo é **comunicar**. No fim do projeto, você escolhe os poucos gráficos que contam a história com clareza pra quem vai decidir. Aqui as regras mudam: o gráfico precisa ser limpo, com título, eixos rotulados e foco na mensagem, sem enfeite que distraia.\n\nEscolher o tipo certo é meio caminho. Tendência ao longo do tempo pede um gráfico de **linha**. Comparar categorias pede **barras**. Ver a distribuição de uma variável pede **histograma**. Investigar a relação entre duas variáveis numéricas pede **dispersão** (os pontos espalhados). Usar o tipo errado confunde mais que ajuda.\n\nUm princípio honesto fecha a etapa: gráfico serve pra esclarecer, nunca pra enganar. Manipular eixos pra exagerar uma diferença é fácil e tentador, e destrói sua credibilidade. A meta é sempre mostrar a verdade dos dados da forma mais clara possível.",
        },
        {
          id: "visualizacao.matplotlib",
          title: "Gráficos com Matplotlib",
          description:
            "A biblioteca base de visualização em Python, fundação de quase tudo.",
          content:
            "A biblioteca de visualização mais fundamental do Python é o **Matplotlib**. Quase todas as outras são construídas sobre ela, então entender o básico aqui te dá a fundação pra qualquer gráfico.\n\nNa prática, o Matplotlib se integra ao Pandas de um jeito que economiza trabalho: a partir de um DataFrame ou de uma coluna, você gera um gráfico direto, sem montar tudo do zero. Um `.plot()` numa coluna desenha a evolução dos valores; um `.hist()` desenha o histograma da distribuição; e há chamadas equivalentes pra barras e dispersão. No notebook, o gráfico aparece logo abaixo da célula, o que torna a exploração ágil.\n\nDepois de ter o gráfico, você o deixa apresentável: título, rótulos nos eixos, legenda quando há mais de uma série. Esses detalhes são o que separa um gráfico de rascunho de um que você mostra pra alguém. Vale também aprender a salvar a figura num arquivo de imagem, pra usar em relatórios e apresentações.\n\nO Matplotlib tem fama de verboso, e tem mesmo: o controle fino sobre cada elemento custa código. Mas é justamente esse controle que faz dele a base de tudo. Comece pelos gráficos simples integrados ao Pandas, que resolvem a maior parte da exploração, e aprofunde no Matplotlib quando precisar de um ajuste que as opções rápidas não dão.",
          resources: [
            {
              label: "Matplotlib: tutoriais (documentação oficial)",
              url: "https://matplotlib.org/stable/tutorials/index.html",
              kind: "doc",
            },
            {
              label: "Kaggle Learn: Data Visualization",
              url: "https://www.kaggle.com/learn/data-visualization",
              kind: "curso",
            },
          ],
        },
        {
          id: "visualizacao.seaborn",
          title: "Seaborn para análise",
          description:
            "Gráficos estatísticos bonitos com pouco código, ideais pra exploração.",
          optional: true,
          content:
            "O **seaborn** é uma biblioteca construída sobre o Matplotlib que resolve duas dores de uma vez: gráficos estatísticos exigem menos código e já saem com aparência cuidada por padrão. Pra exploração de dados, costuma ser a forma mais agradável de trabalhar.\n\nA vantagem fica clara em gráficos que dão trabalho no Matplotlib puro. Com uma linha, o seaborn desenha um **boxplot** (que resume distribuição e outliers numa caixa), um gráfico de dispersão já colorido por categoria, ou um **mapa de calor** da correlação entre todas as colunas, aquele que transforma a tabela de correlações da seção de estatística num quadro visual onde os pares fortes saltam aos olhos.\n\nEle também entende o DataFrame do Pandas diretamente: você passa o DataFrame e diz quais colunas vão em cada eixo, e ele cuida do resto. Isso encaixa o seaborn naturalmente no meio do fluxo de análise, sem fricção.\n\nÉ opcional porque o Matplotlib sozinho já cobre o essencial, mas o ganho de produtividade na fase exploratória é grande, e os gráficos estatísticos mais comuns ficam triviais. A relação entre os dois é de camadas: o seaborn facilita o caminho comum, e o Matplotlib continua disponível por baixo pra qualquer ajuste fino que você queira fazer no resultado.",
          resources: [
            {
              label: "seaborn (documentação oficial)",
              url: "https://seaborn.pydata.org/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    // TODO(Ana): etapa nova (aprofundamento), revisar copy.
    {
      id: "preparacao",
      title: "Limpeza e preparação de dados",
      description:
        "A etapa que ocupa a maior parte de um projeto real: deixar os dados prontos e confiáveis antes de modelar.",
      level: "intermediario",
      children: [
        {
          id: "preparacao.ausentes",
          title: "Tratar valores ausentes e outliers",
          description:
            "Decidir com critério o que fazer com dados que faltam e com valores extremos que distorcem tudo.",
          content:
            "Depois da limpeza básica no Pandas, existe um trabalho mais fino de **preparação** que separa uma análise amadora de uma profissional. Ele começa pelos **valores ausentes** tratados com critério. Remover as linhas com falta é simples, mas joga fora informação; preencher (com a média, a mediana ou um valor derivado) mantém os dados, mas introduz uma suposição. Não há resposta única: você escolhe conforme o contexto e, principalmente, **registra e justifica** a decisão.\n\nOs **outliers** são o segundo cuidado. São valores extremos, muito acima ou abaixo do resto, que podem ser erro de digitação ou um caso real e importante. Um único outlier arrasta a média e distorce um modelo inteiro. A questão não é apagar todo valor estranho, e sim investigar: é erro (então corrige ou remove) ou é um caso legítimo que o modelo precisa aprender a lidar?\n\nO princípio que atravessa tudo: decisões de preparação mudam o resultado, então devem ser conscientes e documentadas, nunca automáticas. Dados preparados com displicência produzem análises que parecem certas e mentem.",
        },
        {
          id: "preparacao.split",
          title: "Separar treino e teste",
          description:
            "Guardar uma parte dos dados que o modelo nunca vê no treino, para medir sua honestidade depois.",
          content:
            "Antes de treinar qualquer modelo, existe um passo que muita gente iniciante pula e paga caro: **separar os dados em treino e teste**. Você reserva uma parte dos dados (digamos, 20%) que o modelo **nunca vê durante o treino**, para usá-la depois só na avaliação. É o equivalente a estudar por um material e ser testado por questões novas.\n\nO motivo é evitar uma ilusão perigosa. Se você avalia o modelo nos mesmos dados em que ele treinou, ele parece ótimo, porque está apenas repetindo o que decorou. O teste com dados separados revela se ele realmente **aprendeu um padrão que generaliza** ou se só memorizou os exemplos vistos, um problema chamado overfitting.\n\nEssa separação é a base de toda avaliação honesta de modelos, que a etapa mais adiante aprofunda. Fazer o split logo no começo, antes de qualquer preparação que use estatísticas dos dados, também evita que informação do conjunto de teste vaze para o treino, um erro sutil que infla os resultados sem você perceber.",
        },
      ],
    },
    // TODO(Ana): etapa nova (aprofundamento), revisar copy.
    {
      id: "features",
      title: "Feature engineering",
      description:
        "Criar boas variáveis a partir dos dados brutos, muitas vezes o que mais melhora um modelo.",
      level: "intermediario",
      children: [
        {
          id: "features.o-que",
          title: "O que é feature engineering",
          description:
            "Transformar dados crus nas variáveis que realmente ajudam o modelo a enxergar o padrão.",
          content:
            "**Feature** é o nome que se dá a cada variável de entrada que o modelo usa para aprender. **Feature engineering** é a arte de criar boas features a partir dos dados brutos, e é frequentemente o que mais melhora um modelo, mais até do que trocar o algoritmo. Um modelo simples com boas features costuma vencer um modelo sofisticado com features ruins.\n\nA ideia é dar ao modelo a informação no formato mais útil. De uma data de nascimento, você extrai a idade; de uma data e hora, o dia da semana ou se é fim de semana; de um endereço, a região. De duas colunas você pode criar uma razão que faz mais sentido que as duas separadas. Cada uma dessas transformações revela um padrão que estava escondido no dado cru.\n\nBoa parte da feature engineering vem de **entender o problema e o negócio**, não só de técnica. Saber o que importa naquele contexto guia quais variáveis criar. Por isso a conversa com quem conhece o domínio, somada à exploração dos dados, é tão valiosa: é dela que saem as ideias das features que fazem diferença.",
        },
        {
          id: "features.categorias-escala",
          title: "Categorias e escalas",
          description:
            "Preparar variáveis de texto e ajustar magnitudes para que o modelo consiga usá-las.",
          content:
            "Modelos trabalham com números, então **variáveis categóricas** (texto como cidade, categoria de produto, sim ou não) precisam virar números antes de entrar no modelo. A forma mais comum transforma cada categoria em colunas de zero e um, para que o modelo não invente uma ordem falsa entre valores que não têm ordem (cidade A não é maior que cidade B).\n\nO outro cuidado é a **escala**. Quando uma variável vai de 0 a 1 e outra vai de 0 a 1.000.000, alguns algoritmos passam a dar peso demais à de números grandes só pela magnitude, não pela importância real. Colocar as variáveis numa escala comparável (um processo chamado normalização ou padronização) evita esse viés e ajuda muitos modelos a aprender melhor.\n\nEsses ajustes são menos glamourosos que treinar o modelo, mas são exatamente o tipo de preparação que decide se ele vai funcionar. Um dado bem preparado e bem representado é metade do caminho para um bom resultado, e é por isso que profissionais de dados gastam tanto tempo aqui.",
        },
      ],
    },
    {
      id: "ml",
      title: "Machine learning",
      description:
        "A introdução aos modelos que aprendem com os dados pra prever e classificar.",
      level: "avancado",
      children: [
        {
          id: "ml.oque",
          title: "O que é machine learning",
          description:
            "Ensinar o computador a encontrar padrões nos dados em vez de programar regras.",
          content:
            "Até aqui você descreveu e explorou o passado. **Machine learning** (aprendizado de máquina) dá o passo seguinte: usar os dados pra fazer **previsões**. A virada de chave é conceitual. Na programação tradicional, você escreve as regras na mão (se isto, faça aquilo). No machine learning, você mostra exemplos ao computador e ele **aprende** as regras sozinho, a partir dos padrões nos dados.\n\nUm exemplo torna concreto. Pra prever o preço de um imóvel, em vez de inventar uma fórmula, você dá ao algoritmo milhares de imóveis com suas características (tamanho, bairro, quartos) e seus preços reais. Ele encontra a relação entre características e preço, e passa a estimar o preço de um imóvel novo que nunca viu.\n\nVale ajustar a expectativa, porque o tema é cercado de exagero. Machine learning não é mágica nem inteligência geral; é estatística aplicada em escala, encontrando padrões em dados. E ele depende inteiramente do que vem antes nesta trilha: sem dados limpos e bem entendidos, nenhum modelo funciona. Não existe atalho que pule a coleta, a limpeza e a análise.\n\nEsta seção é uma **introdução**. A meta não é te tornar especialista, mas dar a base honesta: o que esses modelos são, quando fazem sentido e como avaliá-los sem se enganar com resultados bonitos demais.",
          resources: [
            {
              label: "Kaggle Learn: Intro to Machine Learning",
              url: "https://www.kaggle.com/learn/intro-to-machine-learning",
              kind: "curso",
            },
          ],
        },
        {
          id: "ml.supervisionado",
          title: "Aprendizado supervisionado",
          description:
            "O tipo mais comum de modelo: aprender com exemplos já rotulados.",
          content:
            "O tipo de machine learning mais usado e o melhor pra começar é o **aprendizado supervisionado**. O nome vem da ideia de aprender com exemplos onde a resposta certa já é conhecida, como um aluno que estuda com o gabarito ao lado.\n\nEle se divide em duas grandes tarefas, e reconhecer qual é qual orienta toda a escolha de ferramenta. A **regressão** prevê um número contínuo: o preço de um imóvel, a temperatura de amanhã, as vendas do próximo mês. A **classificação** prevê uma categoria: este email é spam ou não, este cliente vai cancelar ou ficar, esta transação é fraude ou legítima.\n\nO vocabulário básico é simples. As **features** são as características que você usa pra prever (tamanho e bairro do imóvel). O **alvo** (ou target) é o que você quer prever (o preço). E os dados de treino são as linhas onde você conhece tanto as features quanto o alvo, e é a partir delas que o modelo aprende.\n\nUm bom hábito mental desde o início: comece sempre pelo modelo mais simples que resolve o problema. Modelos como a regressão linear e a árvore de decisão são fáceis de entender, rápidos de treinar e, muitas vezes, suficientes. Saltar direto pro modelo mais complexo da moda costuma trazer mais dor de cabeça que ganho, especialmente quando você ainda está aprendendo a avaliar se o resultado faz sentido.",
        },
        {
          id: "ml.treino",
          title: "Treino, teste e avaliação",
          description:
            "Por que separar os dados e como saber se o modelo é mesmo bom.",
          content:
            "Aqui mora o conceito que separa quem entende machine learning de quem só roda código: você **nunca** avalia um modelo nos mesmos dados em que ele aprendeu. O motivo é intuitivo. Um aluno que decora o gabarito acerta a prova que já viu, mas isso não prova que aprendeu; só prova que tem boa memória. Com modelos é igual.\n\nA solução é separar os dados em dois grupos antes de treinar. O conjunto de **treino** ensina o modelo. O conjunto de **teste** fica guardado e só é usado no fim, pra medir o desempenho em dados que o modelo nunca viu. Esse número é o que importa, porque estima como ele vai se sair na vida real.\n\nIsso revela o vilão mais comum, o **overfitting**: o modelo decora os dados de treino, vai perfeito neles e mal nos de teste. Acertar demais no treino é sinal de alerta, não de sucesso. O contrário também existe, o modelo simples demais que não aprende nem o treino.\n\nA avaliação muda conforme a tarefa. Em classificação, você olha a proporção de acertos, mas com cuidado: num problema onde 99 por cento dos casos são de uma classe, acertar 99 por cento pode significar que o modelo só chuta sempre a maioria. Por isso existem métricas que olham além da taxa bruta. Em regressão, mede-se o tamanho típico do erro entre o previsto e o real. Entender essas medidas é o que evita comemorar um modelo que, na prática, não serve.",
        },
        {
          id: "ml.sklearn",
          title: "scikit-learn na prática",
          description:
            "A biblioteca que coloca todo o ciclo de modelagem em poucas linhas.",
          content:
            "A biblioteca que reúne tudo isso em Python é o **scikit-learn**, a porta de entrada do machine learning prático. Sua maior virtude é a consistência: praticamente todo modelo segue o mesmo punhado de passos, então quando você aprende um, aprende o uso de quase todos.\n\nO ciclo é direto. Você separa os dados em treino e teste com uma função pronta. Escolhe um modelo (uma regressão linear, uma árvore de decisão) e o cria. Chama `.fit()` passando as features e o alvo de treino, e é aí que o modelo aprende. Depois chama `.predict()` pra gerar previsões sobre o conjunto de teste. Por fim, compara essas previsões com as respostas reais usando uma função de métrica. Esse roteiro de quatro passos se repete em quase todo projeto.\n\nO scikit-learn também traz as ferramentas em volta do modelo: preparação de dados, comparação entre modelos, ajuste de configurações. Por agora, foque no ciclo básico; o resto entra conforme a necessidade aparece.\n\nUm fechamento honesto pra esta trilha introdutória: rodar o scikit-learn é a parte fácil. O difícil, e o que de fato cria valor, é tudo que veio antes (entender o problema, limpar os dados, escolher boas features) e a interpretação crítica do resultado no fim. O modelo é uma peça pequena no meio de um trabalho muito maior, e quem domina o ciclo completo é quem se destaca.",
          resources: [
            {
              label: "scikit-learn: começando (documentação oficial)",
              url: "https://scikit-learn.org/stable/getting_started.html",
              kind: "doc",
            },
          ],
        },
      ],
    },
    // TODO(Ana): etapa nova (aprofundamento), revisar copy.
    {
      id: "avaliacao",
      title: "Avaliação de modelos",
      description:
        "Saber se um modelo é bom de verdade: as métricas certas para cada problema e as armadilhas comuns.",
      level: "intermediario",
      children: [
        {
          id: "avaliacao.metricas",
          title: "Métricas por tipo de problema",
          description:
            "Acurácia não serve para tudo; cada tipo de problema pede a métrica que reflete o que importa.",
          content:
            "Treinar um modelo é só metade; a outra metade é saber se ele presta. E o erro mais comum de quem começa é confiar apenas na **acurácia** (a porcentagem de acertos), que engana em muitos casos. Num problema onde 99% dos exemplos são de uma classe (como detectar fraude, rara por natureza), um modelo que responde sempre a classe comum acerta 99% e não serve para nada.\n\nPor isso cada tipo de problema tem métricas próprias. Em **classificação**, além da acurácia, olha-se a precisão (dos que o modelo apontou como positivos, quantos eram mesmo) e o recall (dos positivos reais, quantos o modelo pegou). O equilíbrio entre os dois depende do que custa mais: deixar passar um caso ou dar um alarme falso. Em **regressão** (prever um número), mede-se o tamanho médio do erro entre o previsto e o real.\n\nEscolher a métrica certa é escolher o que você quer que o modelo otimize, e isso é uma decisão ligada ao problema de negócio, não um detalhe técnico. Um modelo com ótima acurácia e péssimo recall pode ser um desastre num contexto onde deixar passar um caso é grave.",
        },
        {
          id: "avaliacao.overfitting",
          title: "Overfitting e generalização",
          description:
            "O modelo que decora em vez de aprender parece perfeito no treino e falha no mundo real.",
          content:
            "O maior inimigo silencioso de um modelo é o **overfitting**: quando ele decora os dados de treino em vez de aprender o padrão geral. Um modelo assim acerta quase tudo nos dados que viu e erra feio nos dados novos, que é justamente onde ele precisa funcionar. É como um aluno que decora o gabarito e trava na prova de verdade.\n\nÉ para revelar isso que serve a separação treino e teste feita na preparação. Avaliar o modelo nos dados de teste, que ele nunca viu, mostra a diferença entre o desempenho decorado (no treino) e o real (no teste). Uma folga grande entre os dois é o sinal clássico de overfitting: ótimo no treino, fraco no teste.\n\nO objetivo final de um modelo nunca é acertar os dados que já temos, e sim **generalizar** para os que virão. Guardar essa mentalidade muda a forma como você avalia: não celebre um resultado brilhante no treino sem checar o teste, porque o número que importa é o que ele entrega diante do desconhecido.",
        },
      ],
    },
    // TODO(Ana): etapa nova (aprofundamento), revisar copy.
    {
      id: "comunicacao",
      title: "Comunicação de resultados",
      description:
        "Uma análise só gera valor quando alguém entende e decide com ela: contar a história por trás dos números.",
      level: "intermediario",
      children: [
        {
          id: "comunicacao.storytelling",
          title: "Contar a história dos dados",
          description:
            "Traduzir números e gráficos numa mensagem clara que leva a uma decisão.",
          content:
            "A melhor análise do mundo não vale nada se ninguém entende ou age sobre ela. **Comunicar resultados** é a habilidade que transforma trabalho técnico em impacto, e é frequentemente o que separa o analista que cresce do que fica estagnado, por melhor que ele seja tecnicamente.\n\nComunicar bem começa por lembrar para quem você fala. Quem toma a decisão em geral não quer o passo a passo do código nem a lista de métricas; quer saber o que os dados dizem, o que isso significa para o problema dele e o que fazer a respeito. A regra é liderar com a conclusão, sustentá-la com os dados essenciais, e deixar o detalhe técnico como apoio para quem quiser aprofundar.\n\nUm gráfico bem escolhido comunica em segundos o que uma tabela esconde em minutos, mas ele precisa ter um propósito claro: cada visualização deve responder a uma pergunta e destacar a mensagem, não enfeitar. Contar a história (aqui está o problema, isto é o que os dados mostram, esta é a recomendação) é o que faz uma análise virar decisão.",
        },
      ],
    },
    {
      id: "projeto",
      title: "Projeto de análise",
      description:
        "Juntar tudo numa análise completa de dados reais: a melhor prova do que você aprendeu.",
      level: "avancado",
      children: [
        {
          id: "projeto.dataset",
          title: "Escolher e explorar um dataset",
          description:
            "Começar por dados reais que te interessam e fazer as primeiras perguntas.",
          content:
            "A melhor forma de consolidar tudo é fazer uma análise de ponta a ponta com dados reais. E o primeiro passo, escolher bons dados, importa mais do que parece.\n\nDuas fontes são ideais pra começar. Os **dados públicos** de órgãos oficiais, como institutos de estatística e portais de governo, trazem temas que afetam a vida real e dão peso ao projeto. E o **Kaggle**, plataforma com milhares de conjuntos de dados gratuitos sobre quase qualquer assunto, do clima ao cinema. Em ambos, prefira um tema que genuinamente te interesse: você vai passar horas com esses dados, e curiosidade real sustenta a análise até o fim.\n\nEvite dois extremos. Um dataset grande e bagunçado demais trava o iniciante na limpeza e desanima. Um pequeno e perfeito demais não ensina nada, porque a vida real nunca é assim. Procure o meio: dados com alguma sujeira pra você tratar, mas tamanho administrável.\n\nCom os dados em mãos, faça o ritual de inspeção do Pandas (`.head()`, `.info()`, `.describe()`) e formule as perguntas que vai responder. Boas perguntas são concretas: qual região cresceu mais, o que se relaciona com o resultado X, como tal número evoluiu no tempo. Sem pergunta, a exploração vira passeio sem destino. Definir o que você quer descobrir é o que dá direção a todo o resto.",
        },
        {
          id: "projeto.analise",
          title: "Análise completa de dataset público",
          description:
            "Percorrer o fluxo inteiro, do dado bruto à conclusão comunicada.",
          content:
            "Hora de juntar tudo. Uma análise completa percorre o fluxo que abriu a trilha, e é o projeto que melhor demonstra sua capacidade num portfólio, porque mostra raciocínio, não só código.\n\nO caminho: parta da pergunta definida, carregue os dados (de um arquivo ou de uma consulta SQL), faça a **limpeza** com cuidado e documentada, explore com estatísticas e gráficos pra entender o terreno, e responda à pergunta com evidências. Se fizer sentido pro seu tema, encaixe um modelo simples pra prever algo; se não fizer, uma análise exploratória bem feita já é um projeto completo e valioso, sem forçar machine learning onde ele não cabe.\n\nO entregável vive num notebook que mistura código, gráficos e texto, contando uma história clara: qual era a pergunta, o que você fez com os dados, o que encontrou e o que isso significa. Termine com uma conclusão honesta, incluindo as limitações (o que os dados não permitem afirmar). Reconhecer limites demonstra maturidade analítica e vale mais que uma certeza exagerada.\n\nPublique no GitHub com um bom README, porque é assim que recrutadores veem seu trabalho. O projeto abaixo te guia numa análise de dados públicos de ponta a ponta, exatamente o conjunto de habilidades que esta trilha construiu. Use-o como roteiro e troque pelo tema que mais te move.",
          project: "analise-dados-publicos",
          resources: [
            {
              label: "Kaggle Learn (catálogo de cursos)",
              url: "https://www.kaggle.com/learn",
              kind: "curso",
            },
          ],
        },
      ],
    },
  ],
};
