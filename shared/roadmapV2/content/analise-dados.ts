import type { RoadmapV2 } from "../types";

export const analiseDados: RoadmapV2 = {
  slug: "analise-dados",
  area: "analise-dados",
  title: "Análise de Dados e BI do Zero",
  level: "Iniciante",
  description:
    "De SQL e planilhas à preparação de dados, dashboards de BI e a arte de contar histórias com números. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que faz um analista de dados, como a área difere da ciência de dados e o fluxo do trabalho.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é análise de dados e BI",
          description:
            "Transformar dados em relatórios e dashboards que ajudam o negócio a decidir.",
          content:
            "Análise de dados, muitas vezes chamada de BI (Business Intelligence, ou inteligência de negócio), é a prática de coletar, organizar e interpretar dados pra responder perguntas e apoiar **decisões de negócio**. O analista pega dados espalhados (num banco, em planilhas, em sistemas) e os transforma em relatórios, dashboards e recomendações que ajudam times e gestores a decidir com base em números, não em achismo.\n\nNa prática, o trabalho gira em torno de algumas atividades: extrair dados (geralmente com SQL), limpar e organizar, construir dashboards e relatórios em ferramentas de visualização, e, o mais importante, **traduzir os números em insights** que o negócio entenda e use. O analista é a ponte entre os dados brutos e as pessoas que tomam decisões.\n\nVale destacar por que essa é uma área tão atraente pra começar. Ela é uma das **principais portas de entrada** na área de dados, por dois motivos: exige menos matemática avançada que outras áreas de dados, e tem alta demanda no mercado. O que ela pede é organização, atenção ao detalhe, raciocínio lógico e, crucialmente, **boa comunicação**, porque de nada adianta um número certo que ninguém entende.\n\nUm tema vai se repetir nesta trilha como o diferencial da profissão: saber **contar a história** por trás dos dados. Mostrar um gráfico é fácil; explicar o que ele significa pro negócio e o que fazer a respeito é o que distingue um bom analista. Esta trilha te leva do SQL aos dashboards, sempre com esse fio condutor.",
        },
        {
          id: "fundamentos.vsciencia",
          title: "Análise e ciência de dados",
          description:
            "Duas áreas vizinhas que muita gente confunde, e o que as separa.",
          content:
            'Análise de dados e ciência de dados são vizinhas e frequentemente confundidas, mas têm focos diferentes. Entender a distinção ajuda a escolher seu caminho e a não se intimidar com o que não é necessário pra começar.\n\nA **análise de dados (BI)** olha principalmente pro **passado e o presente**: o que aconteceu e está acontecendo no negócio. Responde perguntas como "quais foram as vendas por região no último trimestre?" ou "qual produto tem mais devoluções?". As ferramentas centrais são SQL, planilhas e ferramentas de visualização, e a entrega são relatórios e dashboards que orientam decisões.\n\nA **ciência de dados** mira mais o **futuro e o desconhecido**: prever o que vai acontecer e construir modelos. Responde perguntas como "quais clientes têm risco de cancelar?", usando machine learning, estatística mais avançada e mais programação (Python). Exige uma base matemática mais pesada.\n\nA diferença prática mais importante pra você agora: a análise de dados **não exige machine learning nem matemática avançada** pra começar. O que ela pede é SQL sólido, visualização e comunicação. Isso a torna uma porta de entrada mais acessível, e muita gente começa como analista e migra pra ciência de dados depois, se quiser, construindo a base matemática ao longo do caminho.\n\nNenhuma é "melhor"; são perfis diferentes pra problemas diferentes. Esta trilha é sobre a análise de dados e BI: foco em extrair, organizar, visualizar e comunicar, sem a complexidade dos modelos preditivos. Se o seu interesse é prever e modelar, a trilha de ciência de dados é a sua.',
        },
        {
          id: "fundamentos.fluxo",
          title: "Da pergunta ao insight",
          description:
            "As etapas que levam de uma dúvida de negócio a uma decisão informada.",
          content:
            'Análise de dados não começa nos dados; começa numa **pergunta**. Esse é o erro mais comum de quem está aprendendo: mergulhar nos números sem saber o que está procurando, e acabar com gráficos bonitos que não respondem nada. O fluxo do trabalho tem uma ordem que vale internalizar.\n\nPrimeiro, a **pergunta de negócio**: o que se quer descobrir ou decidir? "Por que as vendas caíram no Sul?", "Qual canal traz os clientes mais valiosos?". Uma pergunta clara dá direção a tudo o que vem depois. Segundo, a **coleta**: buscar os dados que respondem àquela pergunta, geralmente extraindo de um banco com SQL ou reunindo planilhas. Terceiro, a **preparação**: limpar e organizar, porque dados do mundo real chegam bagunçados, e essa etapa costuma consumir a maior parte do tempo.\n\nQuarto, a **análise**: explorar os dados, calcular métricas, cruzar variáveis pra encontrar padrões e responder à pergunta. Quinto, e decisivo, a **comunicação**: traduzir o que você achou num dashboard ou relatório claro, com a história e a recomendação, pra quem precisa decidir.\n\nDuas verdades sobre esse fluxo. Ele não é uma linha reta: a análise frequentemente levanta novas perguntas, e você volta etapas. E a última etapa, comunicar, costuma valer tanto quanto todas as anteriores juntas, porque uma análise que ninguém entende ou usa não muda nada. Guarde essa sequência (pergunta, coleta, preparação, análise, comunicação); ela organiza toda esta trilha e todo projeto que você fizer.',
        },
      ],
    },
    {
      id: "sql",
      title: "SQL",
      description:
        "A habilidade central e mais pedida do analista: extrair exatamente os dados que você precisa.",
      level: "iniciante",
      children: [
        {
          id: "sql.basico",
          title: "SQL: o coração da análise",
          description:
            "A linguagem pra buscar dados em bancos, a competência número um.",
          content:
            "Se há uma habilidade que define o analista de dados, é o **SQL**. A maior parte dos dados de uma empresa vive em bancos de dados, organizados em **tabelas** (linhas e colunas, como planilhas grandes e bem estruturadas), e o SQL é a linguagem universal pra conversar com eles. Dominar SQL é, de longe, o investimento de maior retorno desta trilha, e a competência mais pedida nas vagas.\n\nA boa notícia é que o SQL é surpreendentemente legível, quase inglês corrente. O comando central é o `SELECT`, que busca dados. `SELECT nome, cidade FROM clientes` traz essas duas colunas de todos os clientes. Você refina o resultado com poucos elementos essenciais: o `WHERE` filtra por condição (`WHERE cidade = 'Recife'`), o `ORDER BY` ordena (`ORDER BY vendas DESC` mostra as maiores primeiro), e o `LIMIT` corta a quantidade de linhas, útil pra responder perguntas do tipo \"top 10\".\n\nUm banco gratuito, robusto e muito usado pra praticar é o **PostgreSQL**, mas o SQL que você aprende vale pra praticamente qualquer banco, com pequenas variações. Comece criando tabelas simples, inserindo dados e rodando seus primeiros `SELECT` pra sentir como a consulta responde.\n\nNão tenha pressa de avançar: a fluência em SQL básico (selecionar, filtrar, ordenar) é a base sobre a qual tudo o mais se apoia. Pratique com perguntas reais sobre um conjunto de dados, em vez de só ler a sintaxe. Quem domina bem SQL já está apto a fazer boa parte do trabalho de análise.",
          resources: [
            {
              label: "PostgreSQL: tutorial de SQL (oficial)",
              url: "https://www.postgresql.org/docs/current/tutorial-sql.html",
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
          id: "sql.joins",
          title: "Joins: combinar tabelas",
          description:
            "Juntar dados de várias tabelas, o que separa o iniciante do analista.",
          content:
            'No mundo real, a resposta pra uma pergunta raramente está numa tabela só. Os dados ficam **divididos** em várias tabelas relacionadas: uma de clientes, uma de pedidos, uma de produtos. Pra responder "quanto cada cliente gastou?", você precisa combinar a tabela de clientes com a de pedidos. O comando que faz isso é o **JOIN**, e dominá-lo é o que separa quem arranha o SQL de quem realmente analisa dados.\n\nA ideia é ligar tabelas por uma coluna em comum. A tabela de pedidos guarda o id do cliente; o JOIN usa esse id pra casar cada pedido com o cliente correspondente, trazendo as informações das duas tabelas juntas numa consulta só. É o mesmo princípio de relacionamento que organiza os bancos de dados.\n\nExistem alguns tipos de JOIN, e a diferença entre eles importa. O mais comum, o **inner join**, traz só as linhas que têm correspondência nas duas tabelas (clientes que fizeram pedidos). Os **outer joins** (como o left join) trazem também as linhas sem correspondência (incluindo clientes que não fizeram nenhum pedido, com valores vazios), o que é essencial pra perguntas como "quais clientes nunca compraram?". Escolher o tipo errado é uma fonte clássica de análises silenciosamente erradas.\n\nJoins assustam no começo, mas são pura prática. Comece com inner joins entre duas tabelas e vá aumentando. Como quase toda análise real envolve combinar tabelas, essa é uma das habilidades de SQL que mais aparece no dia a dia e em entrevistas.',
          resources: [
            {
              label: "PostgreSQL: joins entre tabelas (oficial)",
              url: "https://www.postgresql.org/docs/current/tutorial-join.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "sql.agregacao",
          title: "Agrupar e agregar",
          description:
            "Resumir muitos dados em totais, médias e contagens, a essência do relatório.",
          content:
            "Análise vive de **resumos**: total de vendas por mês, média de ticket por região, quantidade de pedidos por cliente. No SQL, isso se faz com funções de agregação combinadas com agrupamento, e é provavelmente o que você mais vai usar no dia a dia, porque é a base de quase todo relatório.\n\nAs **funções de agregação** condensam muitas linhas num número só: `COUNT` conta, `SUM` soma, `AVG` calcula a média, `MIN` e `MAX` pegam o menor e o maior. `SELECT AVG(valor) FROM vendas` devolve a média de todas as vendas, uma única linha.\n\nO salto de poder vem com o `GROUP BY`, que aplica a agregação **por categoria**. `SELECT regiao, SUM(valor) FROM vendas GROUP BY regiao` devolve o total de vendas de cada região, uma linha por região. É o equivalente em SQL da tabela dinâmica de uma planilha, e responde a maioria das perguntas de negócio: vendas por mês, clientes por estado, receita por produto.\n\nUm complemento importante é o `HAVING`, que filtra **depois** de agrupar (mostrar só as regiões cujo total passou de um milhão), diferente do `WHERE`, que filtra as linhas antes da agregação. Confundir os dois é um tropeço comum.\n\nCom `SELECT`, `WHERE`, `ORDER BY`, `JOIN` e `GROUP BY`, você já cobre o grosso do SQL que um analista usa todo dia. Esse conjunto é suficiente pra extrair, combinar e resumir dados pra praticamente qualquer relatório de iniciante. O resto do SQL você aprende conforme as perguntas ficarem mais complexas.",
          resources: [
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
      id: "planilhas",
      title: "Planilhas",
      description:
        "A ferramenta mais universal da análise, que todo analista domina e usa todo dia.",
      level: "iniciante",
      children: [
        {
          id: "planilhas.avancado",
          title: "Excel e Planilhas avançado",
          description:
            "A ferramenta onipresente que todo analista precisa dominar de verdade.",
          content:
            "Pode parecer básico, mas o **Excel** (e o Google Planilhas) é uma das ferramentas mais importantes e usadas em análise de dados. Toda empresa usa planilhas, muita análise rápida acontece nelas, e dominá-las de verdade, não só o básico de somar células, é um diferencial concreto. Subestimar planilhas é um erro comum de quem acha que só ferramentas sofisticadas contam.\n\nO que vale aprender além do básico. As **fórmulas** que automatizam cálculos e cruzamentos: além de soma e média, funções de busca (que procuram um valor numa tabela e trazem informação relacionada, como o `PROCV` ou as buscas modernas), funções condicionais (`SE`, `SOMASE`, `CONT.SE`) e funções de texto e data pra limpar e organizar. A manipulação de **dados em massa**: filtrar, ordenar, remover duplicatas, separar e juntar colunas. E a criação de **gráficos** rápidos pra visualizar tendências.\n\nUm ganho de aprender planilhas a fundo é que muitos conceitos se transferem pro resto da trilha. Filtrar e agrupar numa planilha é o mesmo raciocínio do `WHERE` e do `GROUP BY` no SQL; criar gráficos prepara pra visualização nas ferramentas de BI. A planilha é, muitas vezes, o primeiro lugar onde você explora um conjunto de dados antes de partir pra ferramentas maiores.\n\nA documentação oficial do Excel e do Google Planilhas cobre as funções em detalhe. Pratique com dados reais: pegue uma planilha de vendas ou de gastos e tente respondê-la com fórmulas e tabelas, em vez de contar na mão.",
          resources: [
            {
              label: "Microsoft: ajuda do Excel (oficial)",
              url: "https://support.microsoft.com/en-us/excel",
              kind: "doc",
            },
            {
              label: "Google: ajuda do Planilhas (oficial)",
              url: "https://support.google.com/docs/topic/9054603",
              kind: "doc",
            },
          ],
        },
        {
          id: "planilhas.dinamicas",
          title: "Tabelas dinâmicas",
          description:
            "A ferramenta que resume grandes volumes de dados em segundos.",
          content:
            "Entre todos os recursos de planilha, um merece destaque próprio por ser tão poderoso e tão usado por analistas: a **tabela dinâmica** (pivot table). Ela permite resumir e cruzar grandes volumes de dados em segundos, sem escrever fórmula nenhuma, arrastando campos numa interface visual.\n\nA ideia é simples e transformadora. Você tem uma tabela com muitas linhas (milhares de vendas, por exemplo), e a tabela dinâmica permite responder perguntas na hora: total de vendas por mês, por vendedor, por produto, ou qualquer combinação. Você escolhe o que vira linha, o que vira coluna e qual número é somado ou contado, e a planilha monta o resumo instantaneamente. Quer ver por região em vez de por mês? Arrasta um campo e pronto.\n\nA conexão com o que você já viu é direta e vale notar: a tabela dinâmica é, na essência, a versão visual e interativa do `GROUP BY` do SQL. Quem entende uma entende a outra, e perceber isso conecta as duas ferramentas centrais do analista.\n\nTabelas dinâmicas são especialmente úteis pra **exploração rápida**: quando você recebe um conjunto de dados novo e quer entender o que tem ali, montar algumas tabelas dinâmicas revela padrões e números-chave em minutos. Muitos analistas as usam o tempo todo pra responder perguntas pontuais antes mesmo de construir um dashboard formal.\n\nDominar tabelas dinâmicas, junto com as fórmulas essenciais, torna você produtivo em planilhas para a maior parte das análises do dia a dia, e é uma habilidade que aparece em quase toda vaga de analista.",
        },
      ],
    },
    {
      id: "preparacao",
      title: "Preparar os dados",
      description:
        "A etapa mais demorada e decisiva: limpar e organizar dados que chegam bagunçados.",
      level: "intermediario",
      children: [
        {
          id: "preparacao.limpeza",
          title: "Limpar e organizar dados",
          description:
            "A etapa que mais consome tempo e mais decide a qualidade do resultado.",
          content:
            'Dados do mundo real chegam **sujos**: campos vazios, datas em formatos diferentes, nomes escritos de cinco jeitos, valores duplicados, números guardados como texto. A limpeza é a etapa que mais consome tempo num projeto de análise, e não é desperdício; é o que garante que a sua conclusão não vai mentir. A regra é dura e verdadeira: lixo entra, lixo sai.\n\nOs problemas mais frequentes têm soluções conhecidas. **Valores ausentes**: decidir o que fazer com células vazias (ignorar, preencher, ou tratar como categoria à parte), sempre conscientemente, porque a escolha afeta os números. **Duplicatas**: linhas repetidas que inflam totais e precisam ser removidas. **Inconsistências**: "SP", "sp" e "São Paulo" significando a mesma coisa e bagunçando qualquer agrupamento, que você padroniza. E **tipos errados**: uma coluna de valores que veio como texto e não soma até ser convertida.\n\nEsse trabalho pode ser feito em SQL, em planilhas ou em ferramentas próprias, e a escolha depende do volume e da repetição. Um princípio profissional vale desde já: **nunca altere o dado original de forma irreversível**. Mantenha a fonte intacta e faça a limpeza de forma documentada e repetível, pra que outra pessoa (ou você no futuro) entenda o que foi mudado e por quê.\n\nUm alerta importante de postura: na pressa, é tentador "ajeitar" os dados pra a análise dar o resultado esperado. Isso é o oposto do trabalho. Limpeza honesta corrige erros reais; manipular dados pra confirmar uma conclusão é fraude analítica que mais cedo ou mais tarde explode. A integridade do dado é a base da confiança no seu trabalho.',
        },
        {
          id: "preparacao.etl",
          title: "ETL e fontes de dados",
          description:
            "Reunir dados de várias origens num formato pronto pra análise.",
          content:
            "Os dados que você precisa raramente estão num lugar só, prontos pra uso. Costumam vir de fontes diferentes (um banco, planilhas, sistemas, arquivos exportados) e em formatos variados. O processo de reuni-los e prepará-los tem um nome que você vai ouvir muito: **ETL**, de Extrair, Transformar e Carregar.\n\nAs três etapas são intuitivas. **Extrair**: buscar os dados nas fontes originais (rodar um SQL, baixar um arquivo, exportar de um sistema). **Transformar**: limpar, padronizar, combinar e calcular o que for preciso pra deixar os dados no formato certo pra análise, justamente o trabalho de limpeza que você viu. **Carregar**: levar o resultado pronto pra onde a análise vai acontecer (uma planilha, uma tabela, uma ferramenta de BI). Em times maiores, esse fluxo costuma ser automatizado, mas o conceito é o mesmo mesmo quando você faz manualmente.\n\nUma fonte valiosa e gratuita pra praticar são os **dados públicos**. Governos disponibilizam grandes volumes de dados abertos sobre os mais variados temas, ótimos pra projetos de portfólio com dados reais e relevantes. No Brasil, o portal de dados abertos do governo é um ponto de partida rico, com dados que rendem análises de verdade.\n\nO conceito de ETL conecta tudo que veio antes: você extrai com SQL, transforma com a limpeza e organização, e carrega pra construir o dashboard, próximo passo da trilha. Entender esse fluxo de ponta a ponta te dá a visão de como um dado bruto vira um insight, que é exatamente o trabalho do analista.",
          resources: [
            {
              label: "Portal Brasileiro de Dados Abertos (dados.gov.br)",
              url: "https://dados.gov.br/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "estatistica",
      title: "Estatística para análise",
      description:
        "O suficiente de estatística pra interpretar dados com honestidade e sem cair em armadilhas.",
      level: "intermediario",
      children: [
        {
          id: "estatistica.descritiva",
          title: "Estatística descritiva",
          description:
            "Resumir e entender os dados com poucas medidas, sem matemática pesada.",
          content:
            "Análise de dados exige estatística, mas, diferente da ciência de dados, aqui o foco é a **estatística descritiva**: medidas simples que resumem e descrevem os dados, sem a matemática avançada dos modelos preditivos. É acessível, e dominá-la bem já cobre a maior parte do trabalho.\n\nComece pelas medidas de **tendência central**, que apontam o centro dos dados. A **média** é a soma dividida pela quantidade. A **mediana** é o valor do meio quando você ordena tudo. A diferença entre elas é uma das lições mais úteis e práticas da área: a média é puxada por valores extremos, a mediana não. Num relatório de salários onde poucos ganham muito, a média engana pra cima; a mediana mostra melhor o valor típico. Escolher a medida certa pra cada situação evita conclusões erradas e enganosas.\n\nDepois, as medidas de **dispersão**, que dizem o quanto os dados variam em torno do centro. Saber que duas regiões têm a mesma média de vendas, mas uma é estável e a outra oscila muito, muda a história que você conta. E as **proporções e percentuais**, pão de cada dia do analista: crescimento percentual, participação de cada categoria no total, variação entre períodos.\n\nA mentalidade certa é que estatística descritiva serve pra **entender e resumir** os dados com honestidade, pra você interpretar o que está vendo, e não só apertar botões. Você não precisa de matemática pesada pra ser um ótimo analista; precisa entender bem essas medidas simples e saber quando cada uma faz sentido.",
        },
        {
          id: "estatistica.armadilhas",
          title: "Armadilhas comuns",
          description:
            "Os erros de interpretação que transformam uma análise em desinformação.",
          content:
            'Dados podem enganar tanto quanto esclarecer, e parte essencial do trabalho do analista é **não cair** (nem fazer os outros caírem) em armadilhas de interpretação. Conhecê-las cedo protege sua credibilidade, que é o ativo mais valioso da profissão.\n\nA primeira é confundir **correlação com causalidade**. Duas coisas variarem juntas não significa que uma causa a outra; pode haver um terceiro fator por trás, ou ser acaso. O exemplo clássico: vendas de sorvete e afogamentos sobem juntos, mas o sorvete não causa afogamento, o calor do verão move os dois. Apontar causa a partir de uma simples correlação é o erro mais perigoso e comum, e gera decisões desastrosas.\n\nA segunda são as **métricas de vaidade**: números que parecem ótimos e só sobem, mas não dizem nada sobre o que importa. Total acumulado de cadastros impressiona e não revela se as pessoas usam ou voltam. Boas métricas são acionáveis; vaidosas só enfeitam slides.\n\nA terceira são os **gráficos enganosos**, às vezes feitos sem querer: um eixo que não começa no zero exagerando uma diferença, uma escala distorcida, uma seleção conveniente do período que esconde a tendência real. Como analista, você tem o dever de mostrar a verdade dos dados da forma mais clara, nunca de manipular a visualização pra contar a história que alguém queria ouvir.\n\nA quarta é o **viés de seleção**: tirar conclusão sobre o todo a partir de uma amostra que não o representa. A postura que protege contra todas elas é o ceticismo honesto: questione seus próprios números, pergunte "isso pode estar enganando?", e prefira a verdade desconfortável à conclusão conveniente.',
        },
      ],
    },
    {
      id: "bi",
      title: "Visualização e BI",
      description:
        "Transformar dados em dashboards e gráficos que comunicam, com as ferramentas do analista.",
      level: "avancado",
      children: [
        {
          id: "bi.ferramentas",
          title: "Ferramentas de BI",
          description:
            "Os softwares que transformam dados em dashboards interativos.",
          content:
            "As **ferramentas de BI** são os softwares que transformam dados em dashboards e relatórios visuais e interativos. Elas conectam às suas fontes de dados, permitem montar gráficos e indicadores arrastando campos, e geram painéis que atualizam sozinhos quando os dados mudam. Dominar pelo menos uma é requisito central da profissão.\n\nAs três mais conhecidas no mercado. O **Power BI**, da Microsoft, é o mais pedido em vagas no Brasil, integra-se bem ao ecossistema Microsoft e tem uma versão gratuita pra estudar, sendo a escolha mais estratégica pra quem está começando e quer empregabilidade. O **Looker Studio** (do Google) é gratuito, roda no navegador e é ótimo pra começar sem instalar nada, especialmente integrado a fontes do Google. O **Tableau** é muito poderoso e respeitado, forte em visualizações sofisticadas.\n\nA recomendação prática, em linha com o mercado, é **focar no Power BI** primeiro, por ser o mais pedido. Mas a boa notícia é que os **conceitos são os mesmos** entre as ferramentas: conectar a uma fonte, modelar os dados, criar visualizações, montar o dashboard. Quem aprende uma migra pra outra sem recomeçar, porque o difícil não é a ferramenta, é saber o que mostrar e por quê.\n\nNão se disperse tentando aprender as três ao mesmo tempo. Escolha uma (de preferência o Power BI), aprenda-a bem construindo dashboards reais, e só depois, se precisar, conheça as outras. Como diz a sabedoria da área, saber contar a história com os dados vale mais que dominar dez ferramentas pela metade.",
          resources: [
            {
              label: "Microsoft Power BI (documentação oficial)",
              url: "https://learn.microsoft.com/en-us/power-bi/",
              kind: "doc",
            },
            {
              label: "Google Looker Studio (ajuda oficial)",
              url: "https://support.google.com/looker-studio",
              kind: "doc",
            },
            {
              label: "Tableau (documentação oficial)",
              url: "https://help.tableau.com/current/pro/desktop/en-us/default.htm",
              kind: "doc",
            },
          ],
        },
        {
          id: "bi.dashboard",
          title: "Construir dashboards",
          description:
            "Montar painéis que respondem perguntas de forma clara e imediata.",
          content:
            "Um **dashboard** é um painel que reúne os principais números e gráficos de um tema num só lugar, atualizado e fácil de ler. É o principal entregável do analista, e construir um bom dashboard é mais arte do que parece, porque o objetivo não é mostrar tudo, é comunicar o que importa com clareza.\n\nAlguns princípios separam um dashboard útil de um confuso. **Foco**: cada dashboard deve responder a um conjunto claro de perguntas, não tentar mostrar tudo de uma vez. Um painel lotado de gráficos vira ruído onde ninguém acha nada. **Hierarquia**: os números mais importantes em destaque, no topo, e os detalhes abaixo, guiando o olho de quem lê. **O gráfico certo pra cada dado**: tendência ao longo do tempo pede linha; comparação entre categorias pede barras; participação no total pede algo como uma rosca, com parcimônia. Usar o tipo errado confunde mais que ajuda.\n\nUm cuidado que iniciantes ignoram: **menos é mais**. A tentação de encher o dashboard de cores, gráficos e enfeites prejudica a leitura. Espaço, simplicidade e clareza comunicam melhor. Cada elemento deve ganhar seu lugar respondendo a uma pergunta real.\n\nE os bons dashboards são **interativos**: filtros que permitem ao usuário recortar os dados (por período, por região, por produto) sem precisar de você. Isso transforma um relatório estático numa ferramenta que as pessoas exploram sozinhas.\n\nUm ótimo exercício de portfólio é construir um dashboard a partir de dados públicos: escolha um tema, defina as perguntas que ele responde, prepare os dados e monte o painel. Sempre acompanhe-o de uma explicação dos insights, porque, como você verá, o gráfico sozinho não basta.",
          resources: [
            {
              label: "Kaggle Learn: Data Visualization",
              url: "https://www.kaggle.com/learn/data-visualization",
              kind: "curso",
            },
          ],
        },
        {
          id: "bi.kpis",
          title: "Métricas e KPIs",
          description:
            "Escolher os poucos números que de fato medem o que importa pro negócio.",
          content:
            'Um negócio gera infinitos números possíveis, e tentar acompanhar todos é o mesmo que não acompanhar nenhum. O analista ajuda o negócio a escolher e medir as **métricas** certas, e a traduzir perguntas de negócio em indicadores claros. Essa tradução é uma das partes mais valiosas do trabalho.\n\nOs **KPIs** (indicadores-chave de desempenho) são as poucas métricas centrais que representam a saúde de uma área ou objetivo. A palavra-chave é **poucas**: um punhado de KPIs bem escolhidos vale mais que um painel com cinquenta números que ninguém olha. Um bom KPI é claro (todo mundo entende o que significa), mensurável e ligado a um objetivo real do negócio.\n\nO trabalho começa traduzindo a pergunta de negócio em métrica. "Estamos crescendo?" pode virar a receita mensal e a taxa de crescimento. "Os clientes estão satisfeitos?" pode virar a taxa de recompra e o número de reclamações. Essa tradução, do objetivo vago pro número concreto, é onde o analista cria muito valor, porque exige entender tanto o negócio quanto os dados.\n\nDois cuidados importam, e conectam com as armadilhas que você viu. Fuja das métricas de vaidade, que sobem sempre e não dizem nada. E lembre-se de que **toda métrica acompanhada vira meta**, e metas mudam comportamento: se você medir só uma coisa, o time vai otimizar só aquilo, às vezes às custas do que importa. Por isso boas métricas vêm acompanhadas de contrapesos. Escolher o que medir é, no fundo, escolher o que o negócio vai priorizar, então é uma responsabilidade que o analista carrega com cuidado.',
        },
      ],
    },
    {
      id: "carreira",
      title: "Comunicação e carreira",
      description:
        "O diferencial do analista, contar a história dos dados, e os primeiros passos na carreira.",
      level: "avancado",
      children: [
        {
          id: "carreira.storytelling",
          title: "Storytelling com dados",
          description:
            "A habilidade que mais diferencia o analista: transformar números em narrativa.",
          content:
            'Aqui está o que mais diferencia um bom analista, e o que a própria área repete como conselho número um: saber **contar a história** por trás dos dados. Mostrar um gráfico é fácil; explicar o que ele significa pro negócio, e o que fazer a respeito, é o que transforma análise em decisão. Um analista que só entrega gráficos é substituível; um que conta histórias claras e acionáveis é valioso.\n\nStorytelling com dados é estruturar a sua análise como uma **narrativa**, não como um amontoado de números. Uma boa história de dados costuma ter: o **contexto** (qual era a pergunta e por que ela importa), a **descoberta** (o que os dados revelaram, com a evidência), e a **recomendação** (o que isso significa e o que fazer). Termina apontando uma ação, não deixando o ouvinte com um "e daí?".\n\nAlgumas práticas ajudam. **Conheça seu público**: um gestor quer a conclusão e a recomendação, não o detalhe técnico de como você extraiu os dados. **Lidere com o insight**, não com o método: comece pelo que importa ("as vendas caíram 20% no Sul por causa de X"), não pela jornada de como você chegou lá. **Deixe o gráfico falar uma coisa**: cada visualização deve ter uma mensagem clara, destacada. E seja **honesto**, inclusive sobre o que os dados não permitem concluir; reconhecer limites gera confiança.\n\nEssa habilidade é metade comunicação, metade análise, e é treinável. Pratique sempre fechando seus projetos não com "aqui está o dashboard", mas com "aqui está o que descobri, o que significa, e o que recomendo". É isso que faz um analista ser ouvido.',
        },
        {
          id: "carreira.projeto",
          title: "Projeto final: painel financeiro executivo",
          description:
            "O capstone da trilha: um painel executivo completo, de dados brutos a insights apresentáveis.",
          project: "painel-financeiro-executivo",
        },
        {
          id: "carreira.entrar",
          title: "Entrar na carreira",
          description:
            "Por que a análise de dados é uma das melhores portas de entrada, e como começar.",
          optional: true,
          content:
            "Análise de dados é uma das **melhores portas de entrada** na área de dados e em tecnologia em geral, e por bons motivos: exige menos matemática avançada que ciência de dados, tem alta demanda no mercado, e valoriza habilidades que muita gente em transição de carreira já traz, como organização, raciocínio analítico e comunicação. Quem vem de áreas como administração, finanças, marketing ou qualquer função que já lidava com planilhas e números tem uma base aproveitável.\n\nA fórmula pra entrar é direta e concreta. Domine os **fundamentos** desta trilha, com destaque absoluto pra **SQL** e **uma ferramenta de BI** (de preferência o Power BI, o mais pedido), que são o que as vagas mais cobram. Construa um **portfólio** de dois ou três dashboards a partir de dados públicos reais, cada um respondendo a perguntas claras e acompanhado da explicação dos insights, não só do gráfico. Publique no GitHub ou num portfólio online.\n\nUm conselho que vem da própria área e vale ouro: **use datasets reais e sempre explique o insight**, não apenas mostre o gráfico. Um portfólio que demonstra que você sabe extrair, organizar e, principalmente, **contar a história** dos dados vale muito mais que uma lista de ferramentas no currículo.\n\nE há um caminho de crescimento natural. Muita gente entra como analista júnior e evolui pra analista pleno e sênior, e alguns migram depois pra ciência de dados ou engenharia de dados, construindo a base técnica adicional ao longo do caminho. A análise de dados é, ao mesmo tempo, uma carreira completa e satisfatória por si só e um trampolim pra outras áreas de dados, se você quiser. Comece pelo SQL, capriche na comunicação, e construa o portfólio: as portas se abrem.",
        },
      ],
    },
  ],
};
