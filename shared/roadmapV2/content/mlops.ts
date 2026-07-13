// TODO(Ana): revisao editorial completa desta trilha (titulos, descricoes e
// todo o conteudo em markdown sao novos e precisam de revisao de copy).
import type { RoadmapV2 } from "../types";

export const mlops: RoadmapV2 = {
  slug: "mlops",
  area: "carreira",
  kind: "carreira",
  title: "MLOps e Machine Learning Engineer do Zero",
  level: "Iniciante",
  description:
    "Enquanto a Ciência de Dados analisa e cria modelos, este caminho os coloca em produção de forma confiável: versionar, treinar, servir, monitorar e escalar modelos de machine learning.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é MLOps, como difere de Ciência de Dados e por que colocar modelo em produção é um problema à parte.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.o-que-e",
          title: "O que é MLOps",
          description:
            "As práticas para levar modelos de machine learning do notebook até rodar em produção de forma confiável.",
          content:
            "MLOps é a junção de machine learning com as práticas de operação de software (o DevOps aplicado a ML). É o conjunto de práticas que leva um modelo do experimento no notebook até rodar em produção servindo usuários de verdade, de forma confiável e repetível.\n\nO problema que o MLOps resolve é real e caro: um modelo com ótima acurácia no notebook do cientista de dados não gera valor nenhum enquanto não estiver no ar, recebendo dados reais e devolvendo previsões. A distância entre \"o modelo funciona no meu computador\" e \"o modelo atende milhares de requisições por dia sem quebrar\" é exatamente onde vive o ML Engineer.\n\nEsta trilha assume que você vai aprender o básico de ML pelo caminho, mas o foco não é criar o modelo mais preciso, e sim construir a infraestrutura ao redor dele: versionar, automatizar, servir, monitorar. É engenharia com sabor de dados.",
        },
        {
          id: "fundamentos.vs-ciencia-dados",
          title: "MLOps versus Ciência de Dados",
          description:
            "O cientista de dados descobre e modela; o ML Engineer coloca em produção e mantém funcionando.",
          content:
            "Os dois papéis se complementam, mas têm focos diferentes. O cientista de dados investiga o problema, explora os dados, testa hipóteses e treina modelos buscando a melhor solução analítica. O trabalho dele é muito de experimentação e descoberta.\n\nO ML Engineer (ou engenheiro de MLOps) pega o modelo que funciona e responde a outras perguntas: como servir isso a milhares de usuários com baixa latência? Como saber se o modelo piorou com o tempo? Como treinar de novo de forma automática quando chegam dados novos? Como versionar dados e modelos para reproduzir qualquer resultado? É engenharia de sistemas com ML no centro.\n\nEm times pequenos, uma pessoa faz os dois. Em times maiores, os papéis se separam. Entender a fronteira ajuda você a escolher onde quer atuar: se te atrai mais a análise e a estatística, o caminho é Ciência de Dados; se te atrai construir sistemas robustos, MLOps é a sua praia.",
        },
        {
          id: "fundamentos.ciclo",
          title: "O ciclo de vida de ML em produção",
          description:
            "Dados, treino, avaliação, deploy, monitoramento e retreino: um ciclo que se repete, não uma linha reta.",
          content:
            "Um projeto de ML em produção não termina quando o modelo é treinado. Ele vive num ciclo: coletar e preparar dados, treinar um modelo, avaliar sua qualidade, colocá-lo para servir previsões, monitorar como ele se comporta com dados reais e, quando o desempenho cai, treinar de novo com dados atualizados.\n\nO que diferencia ML de software tradicional é que o comportamento depende dos dados, não só do código. Um sistema comum faz sempre a mesma coisa dado o mesmo código. Um modelo pode piorar sem ninguém mexer numa linha, só porque o mundo mudou e os dados que ele vê agora não são os que ele viu no treino.\n\nPor isso o monitoramento e o retreino são partes centrais, não opcionais. Guardar essa mentalidade de ciclo desde o começo evita a armadilha de tratar o modelo como algo pronto e esquecido depois do primeiro deploy.",
        },
      ],
    },
    {
      id: "base",
      title: "Base técnica: Python e ML",
      description:
        "As ferramentas de base que sustentam tudo: Python, as bibliotecas de dados e o que é treinar um modelo.",
      level: "iniciante",
      children: [
        {
          id: "base.python",
          title: "Python para ML",
          description:
            "A linguagem padrão do ecossistema de machine learning e o que priorizar nela.",
          content:
            "Python é a linguagem dominante em machine learning, e por bons motivos: sintaxe legível, um ecossistema gigante de bibliotecas e forte adoção tanto em pesquisa quanto na indústria. Para esta trilha, você não precisa ser um especialista em Python, mas precisa de fluência no básico.\n\nO essencial: tipos e estruturas (listas, dicionários), laços e condições, funções, e como organizar código em módulos. Somado a isso, entender ambientes virtuais e gerenciamento de dependências, porque projetos de ML dependem de versões específicas de bibliotecas e reprodutibilidade é lei aqui.\n\nSe você vem de outra linguagem, a transição é rápida. Se está começando do zero, vale investir nas bases de programação antes de mergulhar em ML, porque toda a automação e infraestrutura que você vai construir é código Python no fim das contas.",
        },
        {
          id: "base.bibliotecas",
          title: "Bibliotecas de dados e ML",
          description:
            "NumPy, pandas e scikit-learn: manipular dados e treinar modelos clássicos.",
          content:
            "Três bibliotecas formam a base do trabalho com dados em Python. NumPy fornece arrays numéricos eficientes, a fundação sobre a qual quase tudo é construído. pandas oferece o DataFrame, uma tabela poderosa para carregar, limpar e transformar dados, que é onde boa parte do tempo de qualquer projeto é gasto.\n\nscikit-learn é a biblioteca clássica de machine learning: ela traz algoritmos prontos para classificação, regressão e agrupamento, com uma interface consistente para treinar e usar modelos. É o melhor lugar para entender o fluxo geral (separar dados, treinar, prever, avaliar) antes de partir para bibliotecas de deep learning mais pesadas.\n\nComo ML Engineer, você não precisa dominar a matemática de cada algoritmo, mas precisa saber operar essas ferramentas com segurança, porque elas aparecem em todo pipeline que você vai automatizar e colocar no ar.",
        },
        {
          id: "base.treinar-inferir",
          title: "Treinar e inferir: os dois momentos",
          description:
            "A diferença entre ensinar o modelo e usá-lo para prever, que molda toda a infraestrutura.",
          content:
            "Um modelo de ML vive em dois momentos bem distintos. No treino, ele aprende a partir de dados históricos: você mostra exemplos com a resposta certa e ele ajusta seus parâmetros para reconhecer padrões. Isso costuma ser pesado, demorado e feito de tempos em tempos.\n\nNa inferência (ou predição), o modelo já treinado recebe um dado novo e devolve uma resposta. Isso precisa ser rápido e acontece o tempo todo em produção: cada vez que um usuário pede uma recomendação ou uma classificação, é uma inferência. Os requisitos de cada momento são opostos: treino tolera lentidão e usa muito recurso; inferência exige velocidade e estabilidade.\n\nEssa separação molda toda a arquitetura de MLOps. Você vai construir pipelines de treino de um lado e sistemas de servir previsões de outro, e entender que são problemas diferentes é o primeiro passo para não misturá-los.",
        },
      ],
    },
    {
      id: "versionamento",
      title: "Versionamento de dados e modelos",
      description:
        "Sem reprodutibilidade não há confiança: versionar código, dados, modelos e experimentos.",
      level: "intermediario",
      children: [
        {
          id: "versionamento.git",
          title: "Git e reprodutibilidade",
          description:
            "Versionar o código é o mínimo; em ML, reproduzir um resultado exige versionar mais que isso.",
          content:
            "Git versiona o código, e isso é o ponto de partida obrigatório. Mas em machine learning, o código é só uma das três coisas que definem um resultado: o mesmo código com dados diferentes ou parâmetros diferentes gera um modelo diferente. Reproduzir um resultado exige rastrear os três.\n\nReprodutibilidade significa conseguir, meses depois, recriar exatamente um modelo: os mesmos dados, o mesmo código, os mesmos parâmetros, a mesma versão das bibliotecas. Sem isso, você não consegue explicar por que um modelo se comporta de um jeito, nem voltar a uma versão que funcionava melhor.\n\nPor isso o versionamento em MLOps vai além do Git. Você precisa de estratégias para versionar também os dados e os modelos, o que as próximas ferramentas resolvem. A disciplina de reprodutibilidade é o que separa um experimento sério de uma tentativa que ninguém consegue repetir.",
        },
        {
          id: "versionamento.dados-modelos",
          title: "Versionar dados e modelos",
          description:
            "Ferramentas para rastrear versões de datasets e modelos, que o Git sozinho não dá conta.",
          content:
            "O Git foi feito para texto e arquivos pequenos, não para datasets de gigabytes nem para arquivos de modelo binários e grandes. Colocar esses artefatos direto no Git trava o repositório. Por isso surgiram ferramentas específicas para versionar dados e modelos.\n\nA ideia geral: o dado e o modelo grandes ficam guardados num armazenamento apropriado, e o Git guarda apenas uma referência leve que aponta para a versão exata. Assim você continua com um histórico ligado ao código, mas sem inchar o repositório. Ferramentas como DVC seguem esse conceito, integrando-se ao fluxo de Git que você já conhece.\n\nO objetivo prático é poder dizer \"este modelo veio deste dataset nesta versão\" com certeza. Quando um modelo em produção dá problema, essa rastreabilidade é o que permite investigar e reverter, em vez de adivinhar.",
        },
        {
          id: "versionamento.experimentos",
          title: "Rastreamento de experimentos",
          description:
            "Registrar cada tentativa de treino com seus parâmetros e resultados para comparar depois.",
          content:
            "Treinar modelos é um processo de muitas tentativas: você muda um parâmetro, troca um conjunto de dados, ajusta o algoritmo, e cada tentativa gera um resultado diferente. Sem registro, você perde a conta do que testou e não consegue comparar de forma honesta qual versão foi melhor.\n\nRastrear experimentos é registrar, para cada treino, os parâmetros usados, as métricas obtidas e o modelo gerado. Ferramentas como MLflow oferecem isso: um lugar onde cada execução fica gravada e você compara lado a lado, em vez de anotar em planilhas soltas ou confiar na memória.\n\nEsse hábito muda a qualidade do trabalho. Em vez de \"acho que aquela versão era melhor\", você tem números registrados que sustentam a decisão. E quando alguém pergunta por que o modelo atual foi escolhido, a resposta está documentada, não perdida.",
        },
      ],
    },
    {
      id: "pipelines",
      title: "Pipelines de treino",
      description:
        "Transformar o treino manual do notebook num processo automático, repetível e confiável.",
      level: "intermediario",
      children: [
        {
          id: "pipelines.automatizar",
          title: "Do notebook ao pipeline",
          description:
            "Por que o treino manual não escala e como transformá-lo num processo reproduzível.",
          content:
            "No começo, treinar um modelo acontece num notebook, rodando célula por célula na mão. Funciona para explorar, mas não para produção: é difícil de repetir igual, fácil de esquecer um passo e impossível de rodar sozinho quando chegam dados novos.\n\nUm pipeline de treino transforma esse processo manual numa sequência automatizada de etapas: carregar dados, preparar, treinar, avaliar, salvar o modelo. Cada etapa é código versionado, com entradas e saídas claras, que roda da mesma forma toda vez. O ganho é reprodutibilidade e a possibilidade de disparar o treino sem intervenção humana.\n\nMigrar do notebook para o pipeline é um marco na maturidade de um projeto de ML. É o momento em que o treino deixa de ser uma arte manual e vira um processo de engenharia, que outras pessoas conseguem entender, rodar e melhorar.",
        },
        {
          id: "pipelines.orquestracao",
          title: "Orquestração de etapas",
          description:
            "Coordenar as etapas do pipeline, na ordem certa, com controle de falhas e reexecução.",
          content:
            "Quando o pipeline tem várias etapas que dependem umas das outras, alguém precisa coordenar a ordem, garantir que uma só comece quando a anterior terminou, e lidar com falhas no meio do caminho. Isso é orquestração.\n\nFerramentas de orquestração (Airflow é uma das mais conhecidas) permitem descrever o fluxo como uma sequência de tarefas com dependências, agendar execuções e reexecutar só a parte que falhou, sem refazer tudo. É a diferença entre um script frágil que quebra e obriga a começar do zero e um fluxo robusto que se recupera.\n\nPara começar, o importante é entender o conceito de fluxo de tarefas dependentes e a ideia de que pipelines de dados e de treino precisam de coordenação confiável. As ferramentas específicas você aprende conforme o projeto exigir, mas a mentalidade de orquestração vale desde já.",
        },
      ],
    },
    {
      id: "deploy",
      title: "Deploy de modelos",
      description:
        "Colocar o modelo para servir previsões de verdade, seja em tempo real ou em lote.",
      level: "intermediario",
      children: [
        {
          id: "deploy.api",
          title: "Servir modelo como API",
          description:
            "Expor o modelo por trás de uma API para que outros sistemas peçam previsões em tempo real.",
          content:
            "A forma mais comum de servir um modelo em tempo real é colocá-lo atrás de uma API: um endpoint que recebe um dado de entrada, roda a inferência e devolve a previsão. Qualquer sistema (um app, um site, outro serviço) faz uma requisição e recebe a resposta, sem precisar saber nada sobre o modelo por dentro.\n\nEm Python, frameworks web leves como FastAPI e Flask são bastante usados para embrulhar o modelo numa API. O trabalho de engenharia aqui é garantir que essa API seja rápida, estável e capaz de aguentar o volume de requisições esperado, tratando entradas inválidas com elegância em vez de quebrar.\n\nEsse padrão liga o mundo do ML ao mundo do software comum: para o resto do sistema, o modelo vira só mais um serviço que responde a chamadas. Entender como construir e operar essa API é uma habilidade central do ML Engineer.",
        },
        {
          id: "deploy.batch-online",
          title: "Previsão em lote versus em tempo real",
          description:
            "Prever tudo de uma vez em horários definidos ou responder na hora, item a item.",
          content:
            "Nem todo modelo precisa responder na hora. Existem duas formas principais de servir previsões. Em tempo real (online), cada requisição gera uma previsão imediata, como recomendar um produto no instante em que o usuário abre a página. Isso exige baixa latência e disponibilidade constante.\n\nEm lote (batch), o modelo processa um grande conjunto de dados de uma vez, em horários definidos, e guarda os resultados para uso posterior. Por exemplo, calcular durante a madrugada o risco de todos os clientes e deixar o resultado pronto para consulta durante o dia. É mais simples e barato quando a resposta imediata não é necessária.\n\nEscolher entre os dois é uma decisão de arquitetura guiada pela necessidade real: se o negócio precisa da resposta no instante, é online; se pode ser processado periodicamente, batch resolve com muito menos complexidade. Muitos sistemas usam os dois para propósitos diferentes.",
        },
      ],
    },
    {
      id: "monitoramento",
      title: "Monitoramento e drift",
      description:
        "Modelo em produção não é para sempre: acompanhar desempenho e detectar quando o mundo muda.",
      level: "avancado",
      children: [
        {
          id: "monitoramento.observar",
          title: "Monitorar previsões em produção",
          description:
            "Acompanhar se o modelo continua funcionando bem depois de no ar, com métricas e alertas.",
          content:
            "Colocar o modelo no ar não é o fim: é quando começa a parte mais delicada. Diferente de software comum, um modelo pode continuar rodando sem erro nenhum e mesmo assim estar dando previsões cada vez piores, porque a qualidade depende dos dados, não só do código.\n\nMonitorar significa acompanhar tanto a saúde técnica (latência, taxa de erro, disponibilidade, como qualquer serviço) quanto a qualidade das previsões ao longo do tempo. Você registra o que o modelo prevê e, quando possível, compara com o que de fato aconteceu, para saber se ele ainda acerta. Alertas avisam quando algo sai do esperado.\n\nSem monitoramento, a degradação passa despercebida até virar um problema visível para o usuário ou para o negócio. Com ele, você percebe cedo e age antes do estrago. Monitoramento é o que transforma um modelo lançado num modelo mantido.",
        },
        {
          id: "monitoramento.drift",
          title: "Data drift e concept drift",
          description:
            "Quando os dados reais deixam de parecer com os do treino, o modelo perde a pontaria.",
          content:
            "Drift é o nome do fenômeno em que o modelo piora porque o mundo mudou. Data drift acontece quando os dados que chegam em produção passam a ter uma distribuição diferente da dos dados de treino: novos padrões de comportamento, uma sazonalidade, uma mudança no perfil dos usuários.\n\nConcept drift é quando a própria relação entre entrada e resposta muda: o que antes indicava uma coisa passa a indicar outra. Um modelo treinado antes de uma grande mudança de comportamento (uma crise, um lançamento, uma nova moda) pode simplesmente deixar de valer, mesmo com os mesmos tipos de dado.\n\nDetectar drift é justamente o motivo de monitorar a distribuição dos dados e a qualidade das previsões. Quando o drift é confirmado, a resposta costuma ser retreinar o modelo com dados atualizados. Esse ciclo de detectar e retreinar é o que mantém um sistema de ML relevante ao longo do tempo.",
        },
      ],
    },
    {
      id: "infra",
      title: "Infraestrutura",
      description:
        "As ferramentas que empacotam, escalam e automatizam a entrega de modelos: containers, orquestração e nuvem.",
      level: "avancado",
      children: [
        {
          id: "infra.docker",
          title: "Containers com Docker",
          description:
            "Empacotar o modelo e suas dependências para rodar igual em qualquer lugar.",
          content:
            "Um dos problemas mais antigos de software é o \"funciona na minha máquina\": o código roda no computador de quem escreveu, mas quebra em outro por causa de versões diferentes de bibliotecas ou do sistema. Em ML, com dezenas de dependências específicas, esse risco é ainda maior.\n\nContainers resolvem isso empacotando a aplicação junto com tudo que ela precisa para rodar: o código, as bibliotecas nas versões certas, as configurações. Docker é a ferramenta padrão. Um container roda igual no seu computador, no servidor de teste e em produção, porque carrega o próprio ambiente consigo.\n\nPara o ML Engineer, empacotar o serviço de inferência num container é o passo natural antes de colocá-lo em produção. É o que garante que o modelo que você testou é exatamente o modelo que vai rodar no ar, sem surpresas de ambiente.",
        },
        {
          id: "infra.escala-nuvem",
          title: "Orquestração e nuvem",
          description:
            "Rodar muitos containers de forma escalável e usar os serviços de ML das nuvens.",
          content:
            "Quando o volume cresce, um container só não basta: você precisa rodar muitos, distribuir a carga, subir mais quando a demanda aumenta e substituir os que falham. Kubernetes é a ferramenta que orquestra containers em escala, cuidando dessa coordenação automaticamente.\n\nAs grandes nuvens (AWS, Google Cloud, Azure) oferecem serviços gerenciados voltados para ML, que cuidam de parte dessa infraestrutura para você: treinar, hospedar e servir modelos sem montar tudo do zero. Conhecer ao menos uma nuvem é praticamente esperado no mercado de MLOps.\n\nNo começo, não tente dominar Kubernetes e três nuvens de uma vez. Entenda o conceito de escalar containers e o papel dos serviços gerenciados, escolha uma nuvem para se aprofundar, e deixe a amplitude vir com a prática. A base de containers e a mentalidade de automação são o que sustentam tudo isso.",
        },
      ],
    },
    {
      id: "carreira",
      title: "Prática e carreira",
      description:
        "Juntar tudo num projeto de ponta a ponta, montar portfólio e entender o mercado de ML Engineer.",
      level: "intermediario",
      children: [
        {
          id: "carreira.projeto",
          title: "Projeto de ponta a ponta",
          description:
            "Levar um modelo do treino ao deploy com monitoramento, mostrando o ciclo completo.",
          content:
            "A melhor forma de consolidar MLOps é construir um projeto que percorre o ciclo inteiro, mesmo que simples: pegar um conjunto de dados, treinar um modelo, versioná-lo, empacotá-lo num container, servi-lo por uma API e deixar algum monitoramento básico funcionando.\n\nO valor não está em o modelo ser sofisticado, e sim em ele estar de pé e operável de ponta a ponta. Um modelo modesto que você consegue treinar de novo, servir e monitorar demonstra muito mais competência de engenharia do que um modelo brilhante preso num notebook.\n\nDocumente as decisões: por que servir online ou em batch, como você versiona, o que monitora. Esse registro mostra maturidade de engenharia e é exatamente o que diferencia um portfólio de ML Engineer de um de cientista de dados iniciante.",
        },
        {
          id: "carreira.mercado",
          title: "O mercado e como crescer",
          description:
            "Onde o ML Engineer atua, o que se espera do perfil e como evoluir na área.",
          content:
            "O ML Engineer vive na fronteira entre ciência de dados e engenharia de software, e por isso é um perfil disputado: junta entender modelos com saber construir sistemas robustos. Empresas que já têm modelos e querem tirá-los do laboratório para gerar valor precisam exatamente dessa habilidade.\n\nPara entrar, ajuda ter uma base sólida de engenharia de software (a trilha de Engenharia de Software desta plataforma é uma boa companheira) somada a fluência em Python, ML básico e as práticas de MLOps. Não é preciso ser PhD em estatística; é preciso ser bom em transformar modelos em serviços confiáveis.\n\nO crescimento vem de aprofundar tanto o lado de dados quanto o de infraestrutura, e de acumular projetos reais no ar. Cada sistema de ML que você ajuda a colocar em produção e manter funcionando é uma linha forte no currículo, porque essa é a parte que a maioria não sabe fazer.",
        },
      ],
    },
  ],
};
