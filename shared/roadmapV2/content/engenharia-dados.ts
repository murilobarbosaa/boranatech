// TODO(Ana): revisao editorial do upgrade da fase 3c, lote 3 (fecho do
// projeto reescrito, fechos de criterio de dominio, conexoes nominais, blocos
// de codigo e resources novos). Enquadramento de papel: confiabilidade e
// escala (o pipeline que roda sozinho as 3 da manha e nao mente).
import type { RoadmapV2 } from "../types";

export const engenhariaDados: RoadmapV2 = {
  slug: "engenharia-dados",
  area: "engenharia-dados",
  title: "Engenharia de Dados do Zero",
  level: "Iniciante",
  description:
    "Das bases de SQL e Python à modelagem de data warehouses, pipelines de ETL/ELT, orquestração e processamento em escala. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que faz um engenheiro de dados, como o papel difere dos outros perfis de dados e o que ter antes de começar.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é engenharia de dados",
          description:
            "Construir os caminhos confiáveis por onde os dados passam até quem os usa.",
          content:
            "Engenharia de dados é a área que **constrói e mantém os caminhos por onde os dados passam**. Enquanto outras pessoas analisam ou modelam dados, o engenheiro de dados garante que esses dados cheguem até elas: limpos, organizados, atualizados e disponíveis. É o encanamento da casa dos dados, invisível quando funciona e desesperador quando falha.\n\nNa prática, o trabalho gira em torno de **pipelines de dados**: fluxos automatizados que coletam dados de várias fontes (sistemas, APIs, arquivos, bancos), transformam esses dados pra um formato útil e os armazenam num lugar central de onde analistas e cientistas podem consumir. O engenheiro modela como esses dados ficam guardados, automatiza a ingestão, monitora pra garantir que nada quebre e cuida da qualidade e da governança.\n\nÉ uma área mais **técnica e próxima do back-end** que as outras de dados: muito código, infraestrutura e automação, e quase nenhum gráfico. Quem gosta de construir sistemas robustos, resolver problemas de dados sujos em escala e se importa com confiabilidade encontra aqui um trabalho satisfatório. Quem busca a parte de visualização e insight de negócio talvez prefira a análise de dados.\n\nA demanda é alta e os salários estão entre os mais altos da área de dados, puxados por empresas que querem se tornar orientadas a dados e precisam de quem construa a base pra isso. Mas, como você verá a seguir, costuma exigir alguma base prévia. Esta trilha te dá o mapa dessa profissão, dos fundamentos ao pipeline de ponta a ponta.",
        },
        {
          id: "fundamentos.perfis",
          title: "Os três perfis de dados",
          description:
            "Como engenharia, análise e ciência de dados se dividem e se complementam.",
          content:
            "A área de dados tem três perfis principais que trabalham juntos, e entender a divisão ajuda a escolher o seu caminho e a enxergar onde a engenharia se encaixa.\n\nO **engenheiro de dados** constrói a **infraestrutura**: os pipelines e os armazenamentos que levam os dados até quem precisa deles. Pensa em confiabilidade, escala e automação. É o foco desta trilha, e o mais próximo do back-end.\n\nO **analista de dados (BI)** usa os dados prontos pra responder perguntas de negócio, criando relatórios e dashboards. Foca em SQL, visualização e comunicação. Olha o passado e o presente do negócio.\n\nO **cientista de dados** usa os dados pra construir modelos preditivos e responder perguntas mais complexas, com estatística avançada e machine learning. Olha pro futuro e o desconhecido.\n\nA imagem que esclarece a relação: o engenheiro de dados **prepara a cozinha e os ingredientes**, e o analista e o cientista **cozinham**. Sem dados confiáveis e bem organizados (trabalho do engenheiro), o analista monta dashboards sobre números errados e o cientista treina modelos sobre dados ruins. Por isso a engenharia é a fundação sobre a qual as outras se apoiam.\n\nOs três se complementam, e em times pequenos uma pessoa pode acumular papéis. Mas os focos são distintos: a engenharia é a mais técnica e de infraestrutura, com menos análise e mais construção de sistemas. Se você gosta mais de **construir os caminhos** do que de analisar o que passa por eles, a engenharia é a sua área.",
        },
        {
          id: "fundamentos.prereq",
          title: "Pré-requisitos e por onde começar",
          description:
            "Por que a engenharia de dados raramente é um primeiro emprego, e o que ter antes.",
          content:
            "Uma conversa honesta antes de mergulhar: engenharia de dados **raramente é uma primeira porta de entrada** em tecnologia. Diferente da análise de dados, que é acessível pra iniciantes, a engenharia costuma exigir uma base técnica prévia, porque envolve programação, infraestrutura e conceitos que ficam mais fáceis com alguma experiência anterior.\n\nO que vale ter antes, ou construir com solidez no início desta trilha, são dois pilares. **Python**, porque pipelines e automações são escritos em código, e Python é a linguagem dominante na área. E **SQL**, em nível além do básico, porque o engenheiro de dados vive manipulando e transformando dados em bancos. Esses dois são tão centrais que a próxima seção é dedicada a eles.\n\nAlém disso, alguma familiaridade com **bancos de dados** e com **linha de comando e Git** acelera muito o aprendizado. Não precisa ser especialista, mas estar confortável com esses fundamentos evita travar nas etapas mais avançadas.\n\nIsso não quer dizer que você precise de anos de experiência. Muita gente chega à engenharia de dados vinda do desenvolvimento (back-end, em geral) ou da análise de dados, trazendo parte dessa base. Se você está começando do zero, o caminho mais inteligente é construir primeiro uma base sólida de programação e SQL, e então avançar pelos conceitos específicos de engenharia que esta trilha cobre.\n\nO recado não é desanimar, é calibrar: encare a engenharia de dados como um segundo passo bem recompensado, com a base de programação e dados firme primeiro. Com essa fundação, o resto da trilha flui.",
        },
      ],
    },
    {
      id: "bases",
      title: "Bases técnicas",
      description:
        "Os dois pilares que sustentam todo o trabalho de engenharia de dados: SQL e Python.",
      level: "iniciante",
      children: [
        {
          id: "bases.sql",
          title: "SQL avançado",
          description:
            "A linguagem dos dados, que o engenheiro precisa dominar além do básico.",
          content:
            "O **SQL** é a linguagem universal dos bancos de dados, e o engenheiro de dados precisa dominá-la além do nível básico, porque transformar dados é, em boa parte, escrever SQL. Se você vem de outra trilha de dados, já tem a base; aqui o foco é aprofundá-la.\n\nO essencial você talvez já conheça: o `SELECT` pra buscar, o `WHERE` pra filtrar, o `JOIN` pra combinar tabelas (que é onipresente, porque dados sempre vivem espalhados em várias tabelas relacionadas) e o `GROUP BY` pra agregar e resumir. Esses comandos são o pão de cada dia.\n\nO que diferencia o uso avançado, relevante pra engenharia, são recursos como as **CTEs** (as cláusulas `WITH`, que organizam consultas complexas em etapas legíveis, essenciais pra transformações grandes), as **window functions** (funções de janela, que fazem cálculos sofisticados como rankings e acumulados sem perder o detalhe das linhas), e a atenção à **performance** das consultas, porque o engenheiro lida com volumes grandes onde uma query mal escrita custa caro e demora muito.\n\nA CTE, o recurso que mais organiza transformação grande, tem esta forma:\n\n```sql\nWITH vendas_mes AS (\n  SELECT mes, SUM(valor) AS total\n  FROM vendas GROUP BY mes\n)\nSELECT * FROM vendas_mes\nWHERE total > 10000;\n```\n\nUm banco gratuito e robusto pra praticar é o **PostgreSQL**, e o SQL que você aprende vale, com pequenas variações, pra praticamente qualquer banco e data warehouse. Invista de verdade aqui: em engenharia de dados, SQL não é coadjuvante, é ferramenta central. Boa parte das transformações que você vai construir, inclusive no passo Transformação com dbt, é SQL bem escrito por baixo. Você domina este passo quando quebra uma transformação complexa em CTEs legíveis, em vez de empilhar subconsultas aninhadas.",
          resources: [
            {
              label: "PostgreSQL: tutorial de SQL (oficial)",
              url: "https://www.postgresql.org/docs/current/tutorial-sql.html",
              kind: "doc",
            },
            {
              label: "PostgreSQL: joins entre tabelas (oficial)",
              url: "https://www.postgresql.org/docs/current/tutorial-join.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "bases.python",
          title: "Python para engenharia de dados",
          description:
            "A linguagem que cola tudo: ingestão, automação e orquestração.",
          content:
            "Se o SQL transforma dados dentro do banco, o **Python** é a linguagem que cola tudo o resto: busca dados de APIs, lê e escreve arquivos, automatiza processos, e é a base das ferramentas de orquestração que você verá adiante. Junto com o SQL, forma a dupla fundamental do engenheiro de dados.\n\nVocê precisa de fluência no Python essencial: variáveis e tipos, condicionais, laços, funções, e as estruturas de dados do dia a dia (listas e dicionários). Some a isso dois temas muito presentes na área. O trabalho com **arquivos e formatos de dados**, porque dados chegam em formatos como CSV, JSON e outros, que você lê, processa e converte. E o consumo de **APIs**, fazendo requisições pra buscar dados de serviços externos, uma fonte comum de ingestão.\n\nDuas bibliotecas aparecem muito. O **Pandas**, pra manipular dados em tabelas, útil em transformações de volume moderado. E bibliotecas de requisição HTTP, pra conversar com APIs. Conforme você avança, encontra ferramentas específicas de engenharia construídas sobre Python, mas a base da linguagem é o que sustenta tudo.\n\nUm ponto que diferencia o uso do Python aqui do uso em análise: o foco é em **código de produção** confiável e automatizado, não em exploração pontual. Seus scripts vão rodar sozinhos, repetidamente, sem alguém olhando, então organização, tratamento de erros e clareza importam mais. Pense em construir sistemas que funcionam sem supervisão, não em rascunhos de análise. Você domina este passo quando escreve um script que lê de uma API ou de um arquivo, trata a falha quando a fonte não responde e pode rodar de novo sem quebrar. Essa mentalidade de engenharia, aplicada ao Python, é o que prepara o terreno pra construir pipelines robustos.",
          resources: [
            {
              label: "Python: documentação oficial (em português)",
              url: "https://docs.python.org/pt-br/3/",
              kind: "doc",
            },
            {
              label: "Kaggle Learn: Python",
              url: "https://www.kaggle.com/learn/python",
              kind: "curso",
            },
          ],
        },
      ],
    },
    {
      id: "modelagem",
      title: "Armazenamento e modelagem",
      description:
        "Onde os dados ficam guardados em escala e como organizá-los pra serem úteis.",
      level: "intermediario",
      children: [
        {
          id: "modelagem.warehouse",
          title: "Data warehouse e data lake",
          description:
            "Os dois grandes modelos de armazenamento central de dados.",
          content:
            'Quando uma empresa quer centralizar seus dados pra análise, surgem dois conceitos centrais que o engenheiro precisa entender: o data warehouse e o data lake. Ambos são lugares pra guardar grandes volumes de dados, com filosofias diferentes.\n\nO **data warehouse** (armazém de dados) guarda dados **estruturados e organizados**, prontos pra análise, geralmente em tabelas bem modeladas. Os dados entram já limpos e padronizados, otimizados pra consultas rápidas de relatórios e dashboards. É a fonte confiável de onde analistas extraem números. Ferramentas modernas de warehouse na nuvem, que você verá no fim da trilha, tornaram isso acessível e escalável.\n\nO **data lake** (lago de dados) guarda dados em estado mais **bruto e variado**, incluindo dados não estruturados (textos, imagens, logs), sem a organização rígida do warehouse. A ideia é "guardar tudo agora, organizar quando precisar", oferecendo flexibilidade pra usos futuros que você ainda não previu, como machine learning. A desvantagem é o risco de virar um "pântano de dados" desorganizado se não houver governança.\n\nUma diferença prática de filosofia: o warehouse exige decidir a estrutura **antes** de guardar (mais disciplina, mais pronto pra uso); o lake permite guardar primeiro e estruturar depois (mais flexível, menos pronto). Existe inclusive uma abordagem híbrida que combina os dois, mas o conceito base são esses dois.\n\nPra você agora, o importante é entender o papel de cada um: o engenheiro de dados constrói e mantém esses armazenamentos centrais, decidindo o que vai pra onde e garantindo que os dados cheguem lá de forma confiável, que é exatamente o trabalho dos pipelines.',
          resources: [
            {
              label: "Apache Parquet: documentação oficial",
              url: "https://parquet.apache.org/docs/",
              kind: "doc",
            },
          ],
        },
        {
          id: "modelagem.modelagem",
          title: "Modelagem de dados",
          description:
            "Organizar as tabelas de forma que a análise seja eficiente e clara.",
          content:
            "Guardar dados não basta; é preciso **organizá-los bem** pra que sejam úteis e eficientes de consultar. A modelagem de dados é a disciplina de decidir como estruturar as tabelas, suas colunas e suas relações, e é uma das competências centrais da engenharia.\n\nUm conceito importante é que a modelagem ideal **depende do uso**. Bancos de sistemas (como o de um aplicativo) costumam ser **normalizados**: os dados são divididos em muitas tabelas pequenas pra evitar repetição, o que é ótimo pra gravar dados com consistência. Já os data warehouses, voltados a **análise**, costumam usar modelos diferentes, otimizados pra leitura rápida de grandes volumes.\n\nO modelo mais conhecido pra análise é o **esquema estrela** (star schema). Nele, há uma tabela central de **fatos** (os eventos que se quer analisar: vendas, acessos, pedidos, com seus números) cercada por tabelas de **dimensões** (o contexto desses fatos: quem, o quê, quando, onde, como tempo, produto, cliente). Essa organização torna as consultas de análise simples e rápidas, e é o padrão em data warehouses.\n\nA decisão entre normalizar (muitas tabelas, sem repetição, bom pra gravar) e desnormalizar (menos tabelas, alguma repetição, bom pra ler) é um trade-off constante que o engenheiro avalia conforme o objetivo. Não existe modelo certo universal; existe o modelo adequado pro uso.\n\nModelar bem é o que faz a diferença entre um warehouse que responde perguntas em segundos e um que é lento e confuso de usar. É um trabalho de design que recompensa quem pensa antes de criar tabelas, e uma habilidade que cresce com a prática e com o entendimento de como os dados serão consumidos.",
        },
      ],
    },
    {
      id: "pipelines",
      title: "Pipelines de dados",
      description:
        "O coração da engenharia: mover e transformar dados de forma automatizada e confiável.",
      level: "intermediario",
      children: [
        {
          id: "pipelines.etl",
          title: "ETL e ELT",
          description:
            "As duas abordagens pra mover e transformar dados entre origem e destino.",
          content:
            "O **pipeline de dados** é o coração da engenharia: um fluxo que move dados de uma origem até um destino, transformando-os no caminho. Duas siglas dominam o assunto, e a diferença entre elas conta a história da evolução da área.\n\nO **ETL** (Extrair, Transformar, Carregar) é a abordagem clássica: você extrai os dados da fonte, **transforma** (limpa, padroniza, combina) num passo intermediário, e só então carrega o resultado já pronto no destino. Os dados chegam ao warehouse já organizados.\n\nO **ELT** (Extrair, Carregar, Transformar) inverte a ordem dos dois últimos passos: você extrai e carrega os dados **brutos** direto no destino, e transforma **depois**, lá dentro, usando o poder de processamento do próprio warehouse. Essa abordagem ganhou força com os warehouses modernos na nuvem, que são potentes o bastante pra transformar grandes volumes internamente.\n\nA diferença prática: no ETL, a transformação acontece **antes** de carregar, fora do destino; no ELT, **depois**, dentro do destino. O ELT virou comum em arquiteturas modernas porque é mais flexível (você guarda o dado bruto e pode transformá-lo de várias formas depois) e aproveita a escala dos warehouses na nuvem do passo Plataformas de dados na nuvem. Mas o ETL continua válido e usado.\n\nIndependentemente da abordagem, três cuidados definem um bom pipeline. A **confiabilidade**: ele precisa funcionar de forma consistente, e tratar bem as falhas (uma fonte fora do ar, um dado malformado). A **idempotência**: rodar o pipeline duas vezes não deve duplicar nem corromper dados. E o **monitoramento**: saber quando algo deu errado, de preferência antes que os dados errados cheguem a quem analisa. Esses princípios separam um script frágil de um pipeline de produção.",
        },
        {
          id: "pipelines.batch",
          title: "Batch e streaming",
          description:
            "Processar dados em lotes periódicos ou continuamente, em tempo real.",
          content:
            'Pipelines processam dados de dois jeitos fundamentais, e escolher o certo pra cada caso é uma decisão de arquitetura que o engenheiro toma com frequência.\n\nO processamento em **batch** (lote) roda em intervalos: o pipeline acorda de tempos em tempos (a cada hora, toda madrugada) e processa um lote de dados acumulados desde a última execução. É a abordagem mais comum, mais simples de construir e suficiente pra maioria dos casos. Relatórios diários, atualizações periódicas de um warehouse e a maior parte da análise de negócio vivem bem com batch, porque os dados não precisam estar atualizados ao segundo.\n\nO processamento em **streaming** (fluxo contínuo) lida com os dados **assim que chegam**, em tempo quase real, um a um ou em micro-lotes. É necessário quando a latência importa muito: detecção de fraude no momento da transação, monitoramento ao vivo, recomendações instantâneas. É mais complexo de construir e operar, e por isso só vale o esforço quando o tempo real é um requisito de verdade, não um capricho.\n\nA regra prática pra escolher é direta: comece perguntando "com que rapidez o dado precisa estar disponível?". Se um atraso de minutos ou horas é aceitável (e quase sempre é), **batch** resolve com menos complexidade. Só vá pra streaming quando o negócio realmente exigir tempo real, porque ele cobra um preço alto em complexidade.\n\nPra quem está começando, o foco é o **batch**: é onde a maioria do trabalho acontece e onde você aprende os fundamentos de pipeline. Streaming é um tema mais avançado, que faz sentido depois que você domina a construção de pipelines em lote.',
        },
        {
          id: "pipelines.ingestao",
          title: "Ingestão de dados",
          description:
            "Trazer dados de fontes variadas para dentro do seu sistema.",
          content:
            "A primeira etapa de qualquer pipeline é a **ingestão**: trazer os dados de suas fontes originais pra dentro do seu sistema. Parece simples, mas é onde muitos problemas começam, porque cada fonte tem seu jeito, seu formato e suas surpresas.\n\nAs fontes são variadas. **Bancos de dados** de sistemas (extrair os dados de produção de uma aplicação). **APIs**, fazendo requisições pra buscar dados de serviços externos, com seus limites de uso e formatos próprios. **Arquivos**, como CSVs e JSONs exportados de sistemas ou enviados por parceiros. E fluxos de **eventos**, no caso de streaming. O engenheiro precisa saber lidar com todas.\n\nAlguns desafios recorrentes da ingestão. A **carga incremental**: em vez de trazer tudo de novo a cada execução (lento e caro), trazer só o que mudou desde a última vez, o que exige saber identificar os dados novos. A lida com **mudanças na fonte**: o formato de uma API muda, uma coluna some, e seu pipeline precisa não quebrar silenciosamente. E os **limites e a educação** ao consumir fontes externas: não sobrecarregar uma API, respeitar seus limites de requisição.\n\nUm princípio importante na ingestão moderna, ligado ao ELT, é preservar o **dado bruto** como ele chegou, antes de transformar. Guardar a versão original permite reprocessar de formas diferentes no futuro e investigar problemas, sem precisar buscar tudo na fonte de novo.\n\nA ingestão bem feita é a fundação de um pipeline confiável: dados que entram de forma robusta e rastreável evitam uma cascata de problemas lá na frente. É a etapa que parece chata mas decide a saúde de todo o fluxo.",
        },
      ],
    },
    {
      id: "ferramentas",
      title: "Transformação e orquestração",
      description:
        "As ferramentas modernas que organizam transformações e agendam pipelines.",
      level: "avancado",
      children: [
        {
          id: "ferramentas.dbt",
          title: "Transformação com dbt",
          description:
            "Organizar as transformações de dados como código versionado e testado.",
          content:
            "Conforme as transformações de dados crescem, vira um emaranhado de consultas SQL difíceis de manter e entender. O **dbt** (data build tool) surgiu pra resolver isso, e virou padrão na engenharia de dados moderna, especialmente em arquiteturas ELT.\n\nA ideia central do dbt é tratar as **transformações como código de software**. Você escreve suas transformações em SQL, organizadas em arquivos, e o dbt cuida de executá-las na ordem certa dentro do seu warehouse, gerando as tabelas e visões finais. Em vez de transformações soltas e manuais, você tem um projeto estruturado, versionado no Git como qualquer código.\n\nIsso traz benefícios que vêm direto do mundo do desenvolvimento. **Versionamento**: o histórico das transformações fica no Git, com revisão e possibilidade de voltar atrás. **Modularidade**: você quebra transformações complexas em peças reutilizáveis, que se referenciam umas às outras, e o dbt resolve a ordem de execução. **Testes**: o dbt permite definir verificações automáticas sobre os dados (esta coluna não pode ter valores nulos, este id deve ser único), pegando problemas de qualidade cedo. E **documentação** gerada a partir do próprio projeto.\n\nO dbt encaixa naturalmente no fluxo ELT: os dados brutos são carregados no warehouse, e o dbt cuida da fase de transformação ali dentro, usando o poder do warehouse. Ele trabalha com SQL, então tudo que você investiu em SQL avançado se paga aqui.\n\nÉ um tema avançado, mas muito pedido em vagas, porque trouxe disciplina de engenharia de software pra um trabalho que antes era caótico. Entender o dbt, mesmo que no básico, é um diferencial concreto na carreira de dados.",
          resources: [
            {
              label: "dbt: documentação oficial",
              url: "https://docs.getdbt.com/",
              kind: "doc",
            },
          ],
        },
        {
          id: "ferramentas.airflow",
          title: "Orquestração com Airflow",
          description:
            "Agendar, coordenar e monitorar pipelines complexos automaticamente.",
          content:
            "Um pipeline real tem muitas etapas que dependem umas das outras, e precisam rodar na ordem certa, no horário certo, com tratamento de falhas. Coordenar isso é o trabalho da **orquestração**, e a ferramenta mais conhecida da área é o **Apache Airflow**.\n\nO Airflow permite definir pipelines como **fluxos de tarefas com dependências**: extrair os dados, depois transformá-los, depois carregar, depois rodar verificações, com cada etapa esperando a anterior terminar. Esse fluxo é representado como um grafo de tarefas, e o Airflow se encarrega de executá-las na ordem correta. A dependência entre etapas se declara com um operador:\n\n```python\nextrair >> transformar >> carregar\ncarregar >> validar\n```\n\nO que o Airflow resolve, além de só rodar tarefas em sequência, é o que torna pipelines confiáveis em produção. O **agendamento**: rodar o pipeline automaticamente todo dia às 3 da manhã, ou a cada hora, sem ninguém apertar um botão. O **tratamento de falhas**: o que fazer quando uma etapa falha (tentar de novo, avisar alguém, parar o fluxo). E a **visibilidade**: uma interface onde você vê o que rodou, o que falhou e onde, essencial pra operar pipelines sem voar às cegas.\n\nO Airflow é definido em Python, o que conecta de volta com o passo Python para engenharia de dados: você escreve seus pipelines como código versionado, em vez de configurar agendamentos manuais espalhados.\n\nÉ uma ferramenta avançada e poderosa, central no roteiro de quem quer ser engenheiro de dados. Existem alternativas modernas com propostas parecidas, mas o Airflow é o mais difundido e o mais pedido em vagas. Construir um pipeline agendado e orquestrado, juntando ingestão, transformação com dbt e orquestração com Airflow, é o exercício que melhor demonstra a competência de um engenheiro de dados.",
          resources: [
            {
              label: "Apache Airflow: documentação oficial",
              url: "https://airflow.apache.org/docs/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "escala",
      title: "Escala e qualidade",
      description:
        "Processar volumes que não cabem numa máquina e garantir que os dados sejam confiáveis.",
      level: "avancado",
      children: [
        {
          id: "escala.spark",
          title: "Processamento distribuído",
          description:
            "Processar volumes de dados grandes demais para uma única máquina.",
          content:
            "Em algum momento, o volume de dados fica grande demais pra ser processado numa única máquina, por mais potente que ela seja. A solução é o **processamento distribuído**: dividir o trabalho entre vários computadores que trabalham em paralelo, e a ferramenta mais conhecida pra isso é o **Apache Spark**.\n\nA ideia central do Spark é pegar um grande volume de dados, dividi-lo em pedaços, distribuí-los por um conjunto de máquinas (um cluster) que processam cada pedaço ao mesmo tempo, e juntar os resultados. O que demoraria horas ou seria impossível numa máquina só vira viável, porque o trabalho é repartido. O Spark cuida da complexidade dessa distribuição pra você, oferecendo uma forma de programar que esconde boa parte do trabalho de coordenar as máquinas.\n\nUm ponto importante de expectativa: a maioria dos problemas de dados **não precisa** de processamento distribuído. Volumes que cabem confortavelmente numa máquina são resolvidos de forma muito mais simples com SQL no warehouse, Pandas em Python, ou ferramentas como o dbt. O Spark entra quando os dados são realmente massivos, na casa de muitos terabytes, onde as abordagens convencionais não dão conta. Usar Spark onde ele não é necessário só adiciona complexidade sem retorno.\n\nPor isso é um tema avançado e que faz sentido conhecer depois de dominar os fundamentos. Você não precisa virar especialista em Spark pra começar na carreira, mas entender o conceito de processamento distribuído (por que existe, quando faz sentido) é importante, porque grandes empresas com volumes massivos o usam, e ele aparece em vagas mais sêniores. Saber que ele existe e qual problema resolve já te dá o discernimento de não usar um canhão pra matar uma mosca, nem ficar sem ferramenta diante de um volume realmente grande.",
          resources: [
            {
              label: "Apache Spark: documentação oficial",
              url: "https://spark.apache.org/docs/latest/",
              kind: "doc",
            },
          ],
        },
        {
          id: "escala.qualidade",
          title: "Qualidade e governança",
          description:
            "Garantir que os dados sejam confiáveis, organizados e bem documentados.",
          content:
            'De nada adianta um pipeline rápido e escalável se os dados que ele entrega estão errados. **Qualidade e governança de dados** são responsabilidades centrais do engenheiro, e o que faz a diferença entre dados em que o negócio confia e dados que ninguém leva a sério.\n\nA **qualidade de dados** é garantir que os dados estejam corretos, completos e consistentes. Na prática, isso vira **testes e validações** automáticas nos pipelines: verificar que campos obrigatórios não estão vazios, que valores estão dentro do esperado, que ids são únicos, que totais batem. Ferramentas como o dbt permitem definir essas verificações, e a ideia é pegar problemas **antes** que os dados errados cheguem a quem analisa. Um pipeline que entrega dado ruim em silêncio é pior que um que falha barulhentamente, porque o erro se espalha sem ninguém perceber.\n\nA **governança de dados** é mais ampla: cuida de quem pode acessar quais dados (segurança e privacidade), de onde cada dado veio e como foi transformado (a chamada linhagem de dados), do significado de cada campo (documentação) e do cumprimento de leis de proteção de dados. Em empresas que levam dados a sério, isso é levado muito a sério, especialmente com dados pessoais.\n\nUm conceito valioso é a **linhagem**: poder rastrear um número num relatório de volta até sua origem, passando por todas as transformações. Quando alguém pergunta "de onde veio esse número?", o engenheiro precisa saber responder.\n\nA mentalidade que sustenta tudo isso é a de **confiabilidade**: o engenheiro de dados é o guardião da confiança que a empresa deposita nos seus dados. Construir pipelines que entregam dados corretos, rastreáveis e bem documentados é, no fim, o propósito de toda a profissão.',
          resources: [
            {
              label: "dbt: testes de dados (documentação oficial)",
              url: "https://docs.getdbt.com/docs/build/data-tests",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "carreira",
      title: "Nuvem e carreira",
      description:
        "As plataformas de dados na nuvem e os passos pra entrar nessa carreira técnica e disputada.",
      level: "avancado",
      children: [
        {
          id: "carreira.cloud",
          title: "Plataformas de dados na nuvem",
          description:
            "Os warehouses gerenciados onde a engenharia de dados moderna acontece.",
          content:
            "A engenharia de dados moderna acontece, em grande parte, na **nuvem**. Em vez de montar e administrar servidores de dados, as empresas usam plataformas gerenciadas que oferecem armazenamento e processamento de dados em escala, cobrando pelo uso. Conhecer esse mundo é parte essencial da profissão hoje.\n\nO destaque são os **data warehouses na nuvem**, serviços que armazenam e consultam enormes volumes de dados com alta performance, sem você gerenciar a infraestrutura. Os mais conhecidos são o **BigQuery** (do Google Cloud) e o **Snowflake** (independente, roda em várias nuvens), além das ofertas das outras grandes nuvens. Eles são tão potentes que viabilizaram a abordagem ELT, transformando dados em escala dentro do próprio warehouse.\n\nUm conselho prático de aprendizado: o **BigQuery é um bom ponto de partida**, por ter um nível gratuito generoso e ser fácil de começar a usar, permitindo praticar consultas e carregamento de dados em escala sem custo inicial. Mas os conceitos (carregar dados, modelar tabelas, consultar com SQL, controlar acesso) se transferem entre as plataformas.\n\nAlém dos warehouses, o engenheiro de dados na nuvem usa serviços de armazenamento de arquivos (pra data lakes), de orquestração, de ingestão e de processamento. Há aqui uma sobreposição clara com a área de **cloud**: muito do que um engenheiro de dados faz envolve serviços de nuvem, e as duas áreas conversam de perto.\n\nVocê não precisa dominar todas as plataformas; escolha uma pra aprender a fundo (o BigQuery é um bom começo) e entenda que as ideias viajam. A familiaridade com pelo menos uma nuvem é praticamente requisito em vagas de engenharia de dados, então vale incorporar isso à prática desde cedo.",
          resources: [
            {
              label: "Google BigQuery: documentação oficial",
              url: "https://cloud.google.com/bigquery/docs",
              kind: "doc",
            },
            {
              label: "Snowflake: documentação oficial",
              url: "https://docs.snowflake.com/",
              kind: "doc",
            },
          ],
        },
        {
          id: "carreira.projeto",
          title: "Projeto final: mini lakehouse de vendas",
          description:
            "Ingestão, camadas e consumo num lakehouse enxuto, o pipeline completo da trilha.",
          content:
            "Olhe pra trás um instante: você entrou nesta trilha com SQL e Python, e agora modela um warehouse, distingue ETL de ELT, constrói ingestão idempotente, transforma com dbt e orquestra com Airflow. Este passo junta tudo no artefato que melhor prova a competência de um engenheiro: um **pipeline de ponta a ponta**.\n\nA encomenda é o mini lakehouse do projeto abaixo: partir de uma fonte de vendas (uma API pública ou arquivos), ingerir o dado bruto preservado, transformá-lo em camadas até tabelas prontas pra consulta, e deixar o fluxo agendado pra rodar sozinho. Percorra o que a trilha construiu: ingestão que não quebra quando a fonte muda, transformação versionada, e um destino de onde um analista consome sem saber do trabalho por baixo.\n\nO que distingue o projeto é a **confiabilidade**: o pipeline precisa rodar às três da manhã, sem ninguém olhando, e não mentir. Rode-o duas vezes e confira que não duplicou dado (a idempotência do passo ETL e ELT); derrube a fonte de propósito e veja se ele falha barulhentamente, não em silêncio.\n\nO critério de chegada é objetivo: o pipeline no GitHub com a arquitetura documentada, rodando de ponta a ponta de forma agendada e reprodutível, e você explicando cada camada e cada decisão de confiabilidade sem hesitar. É este projeto que vira a peça central do seu portfólio de engenharia de dados.",
          project: "lakehouse-mini-vendas",
        },
        {
          id: "carreira.entrar",
          title: "Entrar na carreira",
          description:
            "Como construir a base e o portfólio pra uma área técnica e bem paga.",
          optional: true,
          content:
            "Engenharia de dados é uma das áreas mais técnicas e mais bem pagas de dados, e a demanda é alta. Em troca, exige uma base sólida e raramente é um primeiro emprego, como conversamos nos fundamentos. Entender isso ajuda a traçar um caminho realista.\n\nO ponto de partida são os **pré-requisitos**: Python e SQL com solidez, mais familiaridade com bancos de dados, linha de comando e Git. Se você ainda não os tem, construa-os primeiro, porque tentar pular pra ferramentas avançadas sem essa base leva à frustração. Muita gente chega à engenharia de dados vinda do desenvolvimento back-end ou da análise de dados, aproveitando parte dessa fundação.\n\nDepois da base, o caminho é construir conhecimento dos conceitos específicos (modelagem, pipelines, orquestração) e, principalmente, **praticar com um projeto de ponta a ponta**. O projeto que melhor demonstra a competência de um engenheiro de dados é um **pipeline completo**: que coleta dados de uma fonte (uma API pública, por exemplo), os transforma e os carrega num destino, idealmente agendado e orquestrado. Documentado no GitHub, com explicação da arquitetura, esse projeto vale muito mais que uma lista de ferramentas no currículo.\n\nUm recurso muito recomendado na comunidade são os cursos práticos gratuitos voltados a engenharia de dados, alguns em formato de coorte, que guiam a construção de um pipeline real do zero. Eles são um dos caminhos mais eficientes pra sair da teoria.\n\nDuas atitudes sustentam a carreira. A mentalidade de **engenharia**, de construir sistemas confiáveis e automatizados, não scripts frágeis. E o **aprendizado contínuo**, porque o ferramental evolui rápido, embora os fundamentos (SQL, modelagem, pipelines bem feitos) mudem devagar e sustentem tudo. Com a base firme e um bom projeto, as portas dessa área valorizada se abrem.",
          resources: [
            {
              label: "Data Engineering Zoomcamp (curso prático gratuito)",
              url: "https://github.com/DataTalksClub/data-engineering-zoomcamp",
              kind: "curso",
            },
          ],
        },
      ],
    },
  ],
};
