// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool engenharia-dados). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "engenharia-dados",
  "questions": [
    {
      "id": "engenharia-dados-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo um pipeline de dados e precisa garantir que os dados sejam entregues de forma confiável. O que você deve priorizar?",
      "alternativas": {
        "a": "Focar na visualização dos dados para os usuários finais.",
        "b": "Construir uma infraestrutura que automatize a coleta e transformação dos dados.",
        "c": "Criar relatórios detalhados sobre os dados coletados.",
        "d": "Concentrar-se em estatísticas avançadas para análise dos dados."
      },
      "correta": "b",
      "explicacao": "A construção de uma infraestrutura que automatize a coleta e transformação dos dados é essencial para garantir a confiabilidade no fluxo de dados.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "engenharia-dados-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você é um engenheiro de dados e precisa preparar dados para um analista. Qual é o seu papel nesse processo?",
      "alternativas": {
        "a": "Criar gráficos e dashboards para a visualização dos dados.",
        "b": "Construir e manter os pipelines que garantem a qualidade dos dados.",
        "c": "Desenvolver modelos preditivos para análise futura dos dados.",
        "d": "Focar em relatórios que expliquem os dados de forma simples."
      },
      "correta": "b",
      "explicacao": "O engenheiro de dados constrói e mantém os pipelines que garantem que os dados cheguem limpos e organizados até o analista.",
      "fonte": "fundamentos.perfis"
    },
    {
      "id": "engenharia-dados-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você está considerando entrar na área de engenharia de dados. Qual é uma habilidade essencial que você deve desenvolver primeiro?",
      "alternativas": {
        "a": "Habilidades em visualização de dados.",
        "b": "Conhecimento avançado em estatística.",
        "c": "Proficiência em Python para automação de pipelines.",
        "d": "Capacidade de criar dashboards interativos."
      },
      "correta": "c",
      "explicacao": "A proficiência em Python é fundamental, pois a maioria dos pipelines e automações na engenharia de dados é escrita nessa linguagem.",
      "fonte": "fundamentos.prereq"
    },
    {
      "id": "engenharia-dados-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você precisa garantir que os dados no seu pipeline estejam sempre atualizados. Qual abordagem você deve adotar?",
      "alternativas": {
        "a": "Focar apenas em armazenar os dados de forma eficiente.",
        "b": "Implementar automação para a ingestão e transformação dos dados.",
        "c": "Criar relatórios periódicos sobre a qualidade dos dados.",
        "d": "Analisar os dados manualmente sempre que necessário."
      },
      "correta": "b",
      "explicacao": "A automação da ingestão e transformação dos dados é crucial para garantir que os dados estejam sempre atualizados e disponíveis.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "engenharia-dados-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você está em uma equipe de dados e precisa entender como seu trabalho se relaciona com o de um cientista de dados. O que você deve ter em mente?",
      "alternativas": {
        "a": "O engenheiro de dados deve focar apenas na análise de dados.",
        "b": "O engenheiro de dados prepara a infraestrutura que permite ao cientista trabalhar com dados de qualidade.",
        "c": "O cientista de dados é responsável por manter os pipelines de dados em funcionamento.",
        "d": "O trabalho do engenheiro de dados é mais importante que o do cientista de dados."
      },
      "correta": "b",
      "explicacao": "O engenheiro de dados prepara a infraestrutura e os dados que o cientista de dados utiliza, garantindo que sejam de qualidade.",
      "fonte": "fundamentos.perfis"
    },
    {
      "id": "engenharia-dados-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você está começando na engenharia de dados e quer se preparar adequadamente. Qual é a melhor estratégia?",
      "alternativas": {
        "a": "Focar apenas em aprender SQL básico.",
        "b": "Desenvolver uma base sólida em programação e SQL antes de avançar.",
        "c": "Aprender sobre visualização de dados imediatamente.",
        "d": "Concentrar-se em estatísticas avançadas desde o início."
      },
      "correta": "b",
      "explicacao": "Desenvolver uma base sólida em programação e SQL é essencial para ter sucesso na engenharia de dados.",
      "fonte": "fundamentos.prereq"
    },
    {
      "id": "engenharia-dados-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você foi designado para construir um pipeline de dados. Qual aspecto deve receber mais atenção para evitar falhas?",
      "alternativas": {
        "a": "A estética do dashboard que será utilizado pelos analistas.",
        "b": "A automação dos processos de coleta e transformação de dados.",
        "c": "A criação de relatórios detalhados sobre o uso dos dados.",
        "d": "A análise manual dos dados para garantir sua precisão."
      },
      "correta": "b",
      "explicacao": "A automação dos processos de coleta e transformação é crucial para evitar falhas e garantir a eficiência do pipeline.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "engenharia-dados-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você está discutindo a diferença entre engenheiro de dados e analista de dados com um colega. O que você deve destacar?",
      "alternativas": {
        "a": "O engenheiro de dados se concentra em visualização, enquanto o analista foca em infraestrutura.",
        "b": "O engenheiro de dados constrói a infraestrutura, enquanto o analista utiliza os dados prontos para análise.",
        "c": "O analista de dados é responsável pela automação dos pipelines de dados.",
        "d": "O engenheiro de dados é mais focado em estatísticas do que o analista."
      },
      "correta": "b",
      "explicacao": "O engenheiro de dados constrói a infraestrutura que permite ao analista trabalhar com dados prontos para análise.",
      "fonte": "fundamentos.perfis"
    },
    {
      "id": "engenharia-dados-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você está planejando sua carreira e quer saber qual é um dos principais desafios na engenharia de dados. O que você deve considerar?",
      "alternativas": {
        "a": "A necessidade de habilidades em visualização de dados.",
        "b": "A complexidade de construir e manter pipelines de dados confiáveis.",
        "c": "A facilidade de entrar na área sem experiência prévia.",
        "d": "A ausência de demanda por engenheiros de dados no mercado."
      },
      "correta": "b",
      "explicacao": "Um dos principais desafios na engenharia de dados é a complexidade de construir e manter pipelines de dados que sejam confiáveis e eficientes.",
      "fonte": "fundamentos.prereq"
    },
    {
      "id": "engenharia-dados-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você precisa extrair dados de uma tabela de vendas e somar os valores por mês. Qual consulta SQL você deve usar para organizar essa transformação em etapas legíveis?",
      "alternativas": {
        "a": "SELECT mes, SUM(valor) AS total FROM vendas GROUP BY mes;",
        "b": "WITH vendas_mes AS (SELECT mes, SUM(valor) AS total FROM vendas GROUP BY mes) SELECT * FROM vendas_mes;",
        "c": "SELECT mes, total FROM (SELECT mes, SUM(valor) AS total FROM vendas GROUP BY mes);",
        "d": "SELECT mes, SUM(valor) FROM vendas WHERE valor > 0 GROUP BY mes;"
      },
      "correta": "b",
      "explicacao": "A alternativa correta utiliza uma CTE, que organiza a consulta em etapas legíveis, facilitando a compreensão e manutenção do código.",
      "fonte": "bases.sql"
    },
    {
      "id": "engenharia-dados-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você está criando um script em Python para ler dados de um arquivo CSV. Qual abordagem é a mais adequada para garantir que seu código funcione de forma confiável?",
      "alternativas": {
        "a": "Utilizar apenas a função read_csv do Pandas sem tratamento de erros.",
        "b": "Ler o CSV e ignorar arquivos que não existem, sem feedback ao usuário.",
        "c": "Implementar um tratamento de erros para lidar com arquivos ausentes ou mal formatados.",
        "d": "Usar um loop infinito para tentar ler o arquivo até que funcione."
      },
      "correta": "c",
      "explicacao": "A alternativa correta garante que o código lide com possíveis falhas na leitura do arquivo, tornando-o mais confiável e robusto.",
      "fonte": "bases.python"
    },
    {
      "id": "engenharia-dados-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você precisa criar uma função em Python que consome dados de uma API. Qual prática é recomendada para garantir que seu código funcione sem supervisão?",
      "alternativas": {
        "a": "Fazer a requisição sem verificar se a API está disponível.",
        "b": "Implementar um tratamento de exceções para lidar com falhas na requisição.",
        "c": "Executar a requisição e imprimir o resultado diretamente no console.",
        "d": "Usar uma biblioteca de requisição sem verificar a documentação."
      },
      "correta": "b",
      "explicacao": "A alternativa correta garante que o código possa lidar com erros de conexão ou resposta da API, evitando que o script quebre em execução.",
      "fonte": "bases.python"
    },
    {
      "id": "engenharia-dados-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você está escrevendo uma consulta SQL para combinar dados de duas tabelas. Qual é a prática recomendada para garantir que a consulta funcione corretamente?",
      "alternativas": {
        "a": "Usar JOIN sem especificar a condição de junção.",
        "b": "Utilizar JOIN e garantir que a condição de junção esteja correta e clara.",
        "c": "Fazer um CROSS JOIN para garantir que todos os dados sejam combinados.",
        "d": "Usar subconsultas aninhadas sem necessidade para simplificar a consulta."
      },
      "correta": "b",
      "explicacao": "A alternativa correta assegura que a junção seja feita de forma adequada, evitando resultados incorretos ou inesperados.",
      "fonte": "bases.sql"
    },
    {
      "id": "engenharia-dados-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você precisa automatizar um processo que lê dados de uma API e salva em um arquivo. Qual abordagem é a mais adequada para garantir a eficiência do seu código?",
      "alternativas": {
        "a": "Executar a leitura da API em um loop sem intervalos.",
        "b": "Implementar um sistema de logging para monitorar o sucesso das operações.",
        "c": "Salvar os dados diretamente no arquivo sem verificar se a API respondeu corretamente.",
        "d": "Executar a leitura da API apenas uma vez e não implementar qualquer verificação."
      },
      "correta": "b",
      "explicacao": "A alternativa correta permite monitorar e registrar o funcionamento do script, ajudando na identificação de problemas.",
      "fonte": "bases.python"
    },
    {
      "id": "engenharia-dados-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo uma consulta SQL complexa e quer garantir a performance. Qual técnica é recomendada para otimizar sua consulta?",
      "alternativas": {
        "a": "Utilizar subconsultas aninhadas em vez de CTEs.",
        "b": "Criar índices nas colunas que são frequentemente usadas em filtros e junções.",
        "c": "Evitar o uso de GROUP BY para não sobrecarregar a consulta.",
        "d": "Fazer SELECT * para não perder dados importantes."
      },
      "correta": "b",
      "explicacao": "A alternativa correta garante que a consulta seja executada de forma mais rápida, melhorando a performance ao acessar os dados.",
      "fonte": "bases.sql"
    },
    {
      "id": "engenharia-dados-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está projetando um sistema de análise de vendas e precisa armazenar dados de forma que as consultas sejam rápidas. Qual modelo de dados você deve usar?",
      "alternativas": {
        "a": "Um modelo normalizado com muitas tabelas pequenas",
        "b": "Um esquema estrela com uma tabela de fatos e tabelas de dimensões",
        "c": "Um data lake com dados brutos e não estruturados",
        "d": "Um modelo de dados desnormalizado com poucas tabelas"
      },
      "correta": "b",
      "explicacao": "O esquema estrela é otimizado para consultas rápidas em data warehouses, facilitando a análise de dados de vendas.",
      "fonte": "modelagem.modelagem"
    },
    {
      "id": "engenharia-dados-int-02",
      "nivel": "intermediario",
      "pergunta": "Você está lidando com um grande volume de dados de logs e precisa armazená-los sem uma estrutura rígida. Qual abordagem é mais adequada?",
      "alternativas": {
        "a": "Armazenar em um data warehouse com tabelas organizadas",
        "b": "Utilizar um data lake para guardar os dados em estado bruto",
        "c": "Criar um banco de dados relacional normalizado",
        "d": "Desnormalizar os dados para facilitar a gravação"
      },
      "correta": "b",
      "explicacao": "Um data lake permite armazenar dados em estado bruto, oferecendo flexibilidade para usos futuros, como machine learning.",
      "fonte": "modelagem.warehouse"
    },
    {
      "id": "engenharia-dados-int-03",
      "nivel": "intermediario",
      "pergunta": "Você precisa garantir que os dados de um data lake não se tornem desorganizados. O que deve ser feito?",
      "alternativas": {
        "a": "Implementar governança de dados para organizar e gerenciar os dados",
        "b": "Armazenar todos os dados sem qualquer estrutura",
        "c": "Utilizar apenas dados estruturados para evitar confusão",
        "d": "Criar tabelas normalizadas para cada tipo de dado"
      },
      "correta": "a",
      "explicacao": "A governança de dados é crucial para evitar que um data lake se transforme em um 'pântano de dados' desorganizado.",
      "fonte": "modelagem.warehouse"
    },
    {
      "id": "engenharia-dados-int-04",
      "nivel": "intermediario",
      "pergunta": "Ao modelar um data warehouse, você decide entre normalizar e desnormalizar os dados. O que deve ser considerado?",
      "alternativas": {
        "a": "O volume de dados que será armazenado",
        "b": "A frequência de gravação dos dados",
        "c": "O objetivo principal de leitura e análise dos dados",
        "d": "A complexidade das consultas SQL que serão realizadas"
      },
      "correta": "c",
      "explicacao": "A decisão entre normalizar e desnormalizar deve ser baseada no objetivo de leitura e análise, já que isso impacta a eficiência das consultas.",
      "fonte": "modelagem.modelagem"
    },
    {
      "id": "engenharia-dados-int-05",
      "nivel": "intermediario",
      "pergunta": "Você está criando um pipeline para enviar dados para um data warehouse. Qual é a principal consideração ao escolher o tipo de armazenamento?",
      "alternativas": {
        "a": "A necessidade de armazenar dados não estruturados",
        "b": "A velocidade e eficiência das consultas que os analistas irão realizar",
        "c": "A capacidade de guardar dados em estado bruto",
        "d": "A simplicidade na criação de tabelas"
      },
      "correta": "b",
      "explicacao": "A escolha do tipo de armazenamento deve priorizar a velocidade e eficiência das consultas, que é o propósito principal de um data warehouse.",
      "fonte": "modelagem.warehouse"
    },
    {
      "id": "engenharia-dados-int-06",
      "nivel": "intermediario",
      "pergunta": "Ao modelar um banco de dados para um aplicativo, qual abordagem você deve evitar se o foco é a consistência dos dados?",
      "alternativas": {
        "a": "Criar tabelas normalizadas para evitar repetição",
        "b": "Usar um modelo desnormalizado que pode ter repetição",
        "c": "Implementar chaves primárias e estrangeiras adequadas",
        "d": "Dividir dados em tabelas específicas para cada entidade"
      },
      "correta": "b",
      "explicacao": "Um modelo desnormalizado pode levar a repetição de dados, o que compromete a consistência, especialmente em sistemas que exigem integridade dos dados.",
      "fonte": "modelagem.modelagem"
    },
    {
      "id": "engenharia-dados-int-07",
      "nivel": "intermediario",
      "pergunta": "Você está projetando um pipeline de dados e precisa garantir que ele não corrompa dados ao ser executado várias vezes. Qual prática você deve implementar?",
      "alternativas": {
        "a": "Implementar monitoramento para detectar falhas no pipeline.",
        "b": "Utilizar um banco de dados que suporte transações.",
        "c": "Garantir que o pipeline seja idempotente.",
        "d": "Executar o pipeline apenas em horários de baixa demanda."
      },
      "correta": "c",
      "explicacao": "A idempotência garante que a execução repetida do pipeline não cause duplicação ou corrupção de dados, essencial para a confiabilidade do fluxo.",
      "fonte": "pipelines.etl"
    },
    {
      "id": "engenharia-dados-int-08",
      "nivel": "intermediario",
      "pergunta": "Você precisa processar dados que são atualizados frequentemente e a latência é crítica para o seu negócio. Qual abordagem de processamento você deve escolher?",
      "alternativas": {
        "a": "Processamento em batch, pois é mais simples e eficiente.",
        "b": "Processamento em streaming, para lidar com dados em tempo real.",
        "c": "Processamento em batch, mas com intervalos menores.",
        "d": "Processamento em streaming, mas apenas se o volume de dados for baixo."
      },
      "correta": "b",
      "explicacao": "O processamento em streaming é ideal quando a latência é um requisito crítico, permitindo que os dados sejam processados assim que chegam.",
      "fonte": "pipelines.batch"
    },
    {
      "id": "engenharia-dados-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está trabalhando com uma API que tem limites de requisição. Como você deve estruturar sua ingestão de dados para evitar problemas?",
      "alternativas": {
        "a": "Fazer requisições em paralelo para maximizar a velocidade.",
        "b": "Implementar uma lógica de carga incremental para trazer apenas novos dados.",
        "c": "Fazer requisições em lote para reduzir o número total de chamadas.",
        "d": "Aumentar o intervalo entre as requisições para evitar bloqueios."
      },
      "correta": "b",
      "explicacao": "A carga incremental permite que você traga apenas os dados que mudaram desde a última execução, respeitando os limites da API e melhorando a eficiência.",
      "fonte": "pipelines.ingestao"
    },
    {
      "id": "engenharia-dados-int-10",
      "nivel": "intermediario",
      "pergunta": "Ao escolher entre ETL e ELT para seu pipeline, qual fator deve ser considerado para decidir pela abordagem ELT?",
      "alternativas": {
        "a": "A necessidade de transformar dados antes de carregá-los.",
        "b": "A capacidade do warehouse de processar grandes volumes de dados.",
        "c": "A simplicidade do processo de transformação dos dados.",
        "d": "A necessidade de manter dados brutos para futuras análises."
      },
      "correta": "b",
      "explicacao": "O ELT é mais adequado quando o warehouse tem a capacidade de processar grandes volumes de dados, permitindo transformações flexíveis após o carregamento.",
      "fonte": "pipelines.etl"
    },
    {
      "id": "engenharia-dados-int-11",
      "nivel": "intermediario",
      "pergunta": "Você está lidando com dados que precisam ser processados em lotes. Qual é uma boa prática para garantir a eficiência do seu pipeline?",
      "alternativas": {
        "a": "Processar todos os dados de uma vez para evitar múltiplas execuções.",
        "b": "Definir um intervalo regular para a execução do pipeline.",
        "c": "Aumentar a frequência de execução para captar dados mais recentes.",
        "d": "Agrupar os dados em lotes de tamanhos variáveis."
      },
      "correta": "b",
      "explicacao": "Definir um intervalo regular para a execução do pipeline garante eficiência e evita sobrecarga no sistema, além de ser uma prática comum em processamento em batch.",
      "fonte": "pipelines.batch"
    },
    {
      "id": "engenharia-dados-int-12",
      "nivel": "intermediario",
      "pergunta": "Você precisa garantir que um pipeline de ingestão de dados não quebre ao lidar com mudanças no formato de uma API. O que você deve implementar?",
      "alternativas": {
        "a": "Testes automatizados para verificar a integridade dos dados.",
        "b": "Uma lógica de fallback que ignora erros de formato.",
        "c": "Um sistema de versionamento para controlar mudanças na API.",
        "d": "Um monitoramento que alerta sobre falhas na ingestão."
      },
      "correta": "c",
      "explicacao": "Implementar um sistema de versionamento permite que você lide com mudanças no formato da API sem quebrar o pipeline, garantindo robustez na ingestão.",
      "fonte": "pipelines.ingestao"
    },
    {
      "id": "engenharia-dados-int-13",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um pipeline que deve ser confiável e lidar com falhas. Qual é uma prática recomendada para garantir isso?",
      "alternativas": {
        "a": "Registrar logs detalhados de cada execução do pipeline.",
        "b": "Executar o pipeline em um ambiente de teste antes da produção.",
        "c": "Implementar um mecanismo de retry para falhas temporárias.",
        "d": "Usar uma única fonte de dados para simplificar o processo."
      },
      "correta": "c",
      "explicacao": "Implementar um mecanismo de retry ajuda a lidar com falhas temporárias, aumentando a confiabilidade do pipeline.",
      "fonte": "pipelines.etl"
    },
    {
      "id": "engenharia-dados-int-14",
      "nivel": "intermediario",
      "pergunta": "Você precisa implementar um pipeline que deve processar dados de forma contínua. Qual abordagem você deve usar?",
      "alternativas": {
        "a": "Usar processamento em batch com intervalos curtos.",
        "b": "Usar processamento em streaming para dados em tempo real.",
        "c": "Combinar batch e streaming conforme necessário.",
        "d": "Usar processamento em batch e ignorar a latência."
      },
      "correta": "b",
      "explicacao": "O processamento em streaming é a abordagem correta para dados que precisam ser processados continuamente e em tempo real.",
      "fonte": "pipelines.batch"
    },
    {
      "id": "engenharia-dados-int-15",
      "nivel": "intermediario",
      "pergunta": "Você está projetando um pipeline de ingestão e precisa garantir que os dados brutos sejam preservados. Qual deve ser sua abordagem?",
      "alternativas": {
        "a": "Transformar os dados imediatamente após a ingestão.",
        "b": "Armazenar os dados brutos em uma tabela separada.",
        "c": "Ignorar a preservação dos dados brutos para simplificar o processo.",
        "d": "Transformar os dados apenas se houver erros na ingestão."
      },
      "correta": "b",
      "explicacao": "Armazenar os dados brutos em uma tabela separada permite reprocessá-los no futuro e investigar problemas sem depender da fonte original.",
      "fonte": "pipelines.ingestao"
    },
    {
      "id": "engenharia-dados-av-01",
      "nivel": "avancado",
      "pergunta": "Você precisa organizar um projeto de transformação de dados em SQL utilizando dbt. Qual abordagem garante que as transformações sejam reutilizáveis e executadas na ordem correta?",
      "alternativas": {
        "a": "Escrever todas as transformações em um único arquivo SQL para facilitar a execução",
        "b": "Dividir as transformações em arquivos separados e referenciá-los entre si",
        "c": "Executar cada transformação manualmente na ordem desejada",
        "d": "Criar um script Python que chama cada transformação em sequência"
      },
      "correta": "b",
      "explicacao": "Dividir as transformações em arquivos separados e referenciá-los entre si permite que o dbt gerencie a ordem de execução e promova a reutilização do código.",
      "fonte": "ferramentas.dbt"
    },
    {
      "id": "engenharia-dados-av-02",
      "nivel": "avancado",
      "pergunta": "Você está criando um pipeline no Airflow que envolve múltiplas etapas de extração, transformação e carregamento. Como você deve definir as dependências entre as tarefas?",
      "alternativas": {
        "a": "Usar um loop para executar as tarefas na ordem correta",
        "b": "Definir as dependências usando operadores como 'extrair >> transformar >> carregar'",
        "c": "Executar todas as tarefas simultaneamente para otimizar o tempo",
        "d": "Definir as tarefas em um arquivo de configuração sem especificar dependências"
      },
      "correta": "b",
      "explicacao": "Definir as dependências usando operadores como 'extrair >> transformar >> carregar' permite que o Airflow execute as tarefas na ordem correta, respeitando as dependências entre elas.",
      "fonte": "ferramentas.airflow"
    },
    {
      "id": "engenharia-dados-av-03",
      "nivel": "avancado",
      "pergunta": "Ao utilizar dbt, você deseja garantir a qualidade dos dados em suas transformações. Qual prática você deve adotar?",
      "alternativas": {
        "a": "Criar uma tabela de logs para monitorar as transformações",
        "b": "Definir verificações automáticas sobre os dados, como checar valores nulos",
        "c": "Executar as transformações sem testes, focando apenas na performance",
        "d": "Documentar as transformações em um arquivo separado após a execução"
      },
      "correta": "b",
      "explicacao": "Definir verificações automáticas sobre os dados permite identificar problemas de qualidade cedo, garantindo que as transformações mantenham a integridade dos dados.",
      "fonte": "ferramentas.dbt"
    },
    {
      "id": "engenharia-dados-av-04",
      "nivel": "avancado",
      "pergunta": "Você precisa agendar um pipeline no Airflow para rodar diariamente às 3 da manhã. Qual é a maneira correta de fazer isso?",
      "alternativas": {
        "a": "Configurar o agendamento diretamente no código da tarefa",
        "b": "Utilizar o parâmetro 'schedule_interval' com uma expressão cron apropriada",
        "c": "Executar o pipeline manualmente a cada dia às 3 da manhã",
        "d": "Criar um script externo que chama o pipeline diariamente"
      },
      "correta": "b",
      "explicacao": "Utilizar o parâmetro 'schedule_interval' com uma expressão cron permite que o Airflow agende automaticamente a execução do pipeline na hora desejada.",
      "fonte": "ferramentas.airflow"
    },
    {
      "id": "engenharia-dados-av-05",
      "nivel": "avancado",
      "pergunta": "Você está projetando um pipeline de dados que deve lidar com um volume massivo de informações. Qual abordagem você deve considerar para garantir eficiência no processamento?",
      "alternativas": {
        "a": "Utilizar Apache Spark para processamento distribuído, aproveitando múltiplas máquinas.",
        "b": "Usar SQL em um warehouse, pois é a ferramenta mais simples.",
        "c": "Processar os dados em uma única máquina com um hardware mais potente.",
        "d": "Dividir os dados manualmente e processá-los em sequência em várias máquinas."
      },
      "correta": "a",
      "explicacao": "Apache Spark é projetado para processamento distribuído, permitindo que grandes volumes de dados sejam processados de forma eficiente em paralelo.",
      "fonte": "escala.spark"
    },
    {
      "id": "engenharia-dados-av-06",
      "nivel": "avancado",
      "pergunta": "Você está implementando um pipeline de dados e precisa garantir a qualidade dos dados. Qual prática é mais eficaz para evitar que dados errados cheguem aos analistas?",
      "alternativas": {
        "a": "Implementar testes e validações automáticas para verificar campos obrigatórios e consistência dos dados.",
        "b": "Realizar uma revisão manual dos dados após a entrega para encontrar erros.",
        "c": "Confiar na equipe de analistas para identificar e corrigir os dados errados.",
        "d": "Utilizar um sistema de alertas para notificações quando os dados falham."
      },
      "correta": "a",
      "explicacao": "Testes e validações automáticas ajudam a identificar problemas antes que os dados sejam utilizados, garantindo maior confiabilidade.",
      "fonte": "escala.qualidade"
    },
    {
      "id": "engenharia-dados-av-07",
      "nivel": "avancado",
      "pergunta": "Você precisa garantir que os dados em seu pipeline sejam rastreáveis e bem documentados. Qual abordagem é a mais adequada para implementar a governança de dados?",
      "alternativas": {
        "a": "Documentar a origem e as transformações dos dados, mantendo uma linhagem clara.",
        "b": "Confiar que a equipe de engenharia de dados se lembre de todas as transformações realizadas.",
        "c": "Usar ferramentas de visualização para mostrar os dados, sem necessidade de documentação.",
        "d": "Focar apenas na segurança dos dados, sem se preocupar com a documentação."
      },
      "correta": "a",
      "explicacao": "Manter uma documentação clara e rastreável dos dados é essencial para a governança e para garantir a confiança nos dados.",
      "fonte": "escala.qualidade"
    },
    {
      "id": "engenharia-dados-av-08",
      "nivel": "avancado",
      "pergunta": "Você está avaliando a necessidade de usar o Apache Spark em um projeto de dados. Qual situação justifica seu uso?",
      "alternativas": {
        "a": "Quando os dados são massivos, na casa de muitos terabytes, e não cabem em uma única máquina.",
        "b": "Quando o volume de dados é pequeno, mas a complexidade das operações é alta.",
        "c": "Quando a equipe já tem experiência com Spark, independentemente do volume de dados.",
        "d": "Quando a solução mais simples, como Pandas, não é suficiente para a análise."
      },
      "correta": "a",
      "explicacao": "O uso do Apache Spark é justificado quando os dados são realmente massivos e não podem ser processados eficientemente em uma única máquina.",
      "fonte": "escala.spark"
    },
    {
      "id": "engenharia-dados-av-09",
      "nivel": "avancado",
      "pergunta": "Você está configurando um pipeline de dados e precisa escolher um serviço de armazenamento. Qual opção é mais adequada para um lakehouse que precisa de escalabilidade e flexibilidade?",
      "alternativas": {
        "a": "Um banco de dados relacional tradicional",
        "b": "Um data warehouse na nuvem",
        "c": "Um sistema de arquivos local",
        "d": "Um serviço de armazenamento de objetos na nuvem"
      },
      "correta": "d",
      "explicacao": "Um serviço de armazenamento de objetos na nuvem é ideal para um lakehouse, pois oferece escalabilidade e flexibilidade para armazenar dados de diferentes formatos.",
      "fonte": "carreira.cloud"
    },
    {
      "id": "engenharia-dados-av-10",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um pipeline de dados que deve ser confiável. Qual abordagem garante que o pipeline não duplicará dados mesmo se a fonte mudar?",
      "alternativas": {
        "a": "Usar um sistema de logs para monitorar mudanças",
        "b": "Implementar ingestão idempotente",
        "c": "Executar o pipeline manualmente sempre que necessário",
        "d": "Armazenar dados em uma tabela temporária antes da carga"
      },
      "correta": "b",
      "explicacao": "A ingestão idempotente garante que o pipeline não duplicará dados, mesmo que a fonte mude, pois permite que a mesma operação seja realizada várias vezes sem efeitos colaterais.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "engenharia-dados-av-11",
      "nivel": "avancado",
      "pergunta": "Ao usar o BigQuery para consultas, qual prática recomendada deve ser seguida para garantir a performance e a escalabilidade das consultas?",
      "alternativas": {
        "a": "Realizar joins em tabelas não particionadas",
        "b": "Usar tabelas temporárias para armazenar resultados intermediários",
        "c": "Limitar o uso de funções de agregação",
        "d": "Particionar tabelas com base em colunas de data"
      },
      "correta": "d",
      "explicacao": "Particionar tabelas com base em colunas de data melhora a performance e a escalabilidade das consultas no BigQuery, pois reduz a quantidade de dados processados.",
      "fonte": "carreira.cloud"
    },
    {
      "id": "engenharia-dados-av-12",
      "nivel": "avancado",
      "pergunta": "Você está montando seu portfólio e precisa incluir um projeto que demonstre suas habilidades. Qual característica é essencial para um pipeline de dados ser considerado completo?",
      "alternativas": {
        "a": "Uso de ferramentas avançadas sem documentação",
        "b": "Execução manual do pipeline sempre que necessário",
        "c": "Agendamento e automação do fluxo de dados",
        "d": "Foco apenas na ingestão de dados brutos"
      },
      "correta": "c",
      "explicacao": "Um pipeline de dados completo deve ter agendamento e automação, permitindo que ele rode de forma autônoma e confiável.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "engenharia-dados-av-13",
      "nivel": "avancado",
      "pergunta": "Você quer entrar na área de engenharia de dados e já possui conhecimentos em SQL e Python. Qual é o próximo passo mais recomendado?",
      "alternativas": {
        "a": "Começar a aprender sobre ferramentas de visualização de dados",
        "b": "Focar em aprender sobre bancos de dados NoSQL",
        "c": "Construir um projeto de pipeline de dados de ponta a ponta",
        "d": "Aprofundar-se em linguagens de programação avançadas"
      },
      "correta": "c",
      "explicacao": "Construir um projeto de pipeline de dados de ponta a ponta é fundamental para demonstrar suas habilidades práticas e aplicar os conceitos aprendidos.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "engenharia-dados-av-14",
      "nivel": "avancado",
      "pergunta": "Você está implementando um pipeline que deve rodar sem supervisão. Qual abordagem deve ser adotada para garantir que ele falhe de maneira visível se houver um problema?",
      "alternativas": {
        "a": "Registrar erros em um arquivo de log silenciosamente",
        "b": "Notificar um administrador apenas em caso de falha crítica",
        "c": "Implementar alertas automáticos para falhas no pipeline",
        "d": "Executar o pipeline apenas em horários de baixa demanda"
      },
      "correta": "c",
      "explicacao": "Implementar alertas automáticos para falhas no pipeline é crucial para garantir que qualquer problema seja identificado e tratado rapidamente.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "engenharia-dados-av-15",
      "nivel": "avancado",
      "pergunta": "Você está escolhendo uma plataforma de dados na nuvem para um projeto. Qual critério deve ser considerado ao selecionar uma plataforma para garantir que você possa escalar conforme a necessidade?",
      "alternativas": {
        "a": "A plataforma deve oferecer suporte apenas a SQL",
        "b": "A plataforma deve ter um nível gratuito generoso",
        "c": "A plataforma deve permitir integração com várias ferramentas",
        "d": "A plataforma deve ser a mais popular entre os usuários"
      },
      "correta": "c",
      "explicacao": "A capacidade de integrar com várias ferramentas é essencial para escalar um projeto, pois permite que você utilize diferentes serviços conforme a necessidade.",
      "fonte": "carreira.cloud"
    }
  ]
};

export default pool;
