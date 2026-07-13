// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool mainframe). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "mainframe",
  "questions": [
    {
      "id": "mainframe-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo um sistema crítico para um banco. Qual característica do mainframe é essencial para garantir que o sistema opere sem falhas?",
      "alternativas": {
        "a": "Capacidade de processar grandes volumes de dados rapidamente",
        "b": "Capacidade de ser facilmente substituído por novas tecnologias",
        "c": "Capacidade de operar com sistemas de código aberto",
        "d": "Capacidade de ser acessado remotamente por qualquer dispositivo"
      },
      "correta": "a",
      "explicacao": "A característica essencial do mainframe é sua capacidade de processar grandes volumes de dados com confiabilidade extrema, garantindo a operação ininterrupta de sistemas críticos.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "mainframe-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você está considerando uma carreira em mainframe. Qual é uma das principais razões para a alta demanda por profissionais nessa área?",
      "alternativas": {
        "a": "Os sistemas em mainframe são sempre mais baratos de manter",
        "b": "A maioria dos profissionais da área está se aposentando",
        "c": "As empresas estão substituindo mainframes por tecnologias mais novas",
        "d": "Os mainframes são usados apenas em bancos e seguradoras"
      },
      "correta": "b",
      "explicacao": "A alta demanda por profissionais em mainframe se deve ao fato de que muitos profissionais experientes estão se aposentando, enquanto a necessidade de manutenção e evolução dos sistemas permanece alta.",
      "fonte": "fundamentos.porque"
    },
    {
      "id": "mainframe-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você precisa modernizar um sistema legado em mainframe. Qual é a abordagem mais recomendada para garantir a continuidade do serviço?",
      "alternativas": {
        "a": "Reescrever todo o sistema do zero",
        "b": "Fazer melhorias incrementais e manter a operação",
        "c": "Substituir o sistema por uma solução em nuvem",
        "d": "Ignorar o sistema existente e criar um novo"
      },
      "correta": "b",
      "explicacao": "A abordagem recomendada é fazer melhorias incrementais, pois reescrever um sistema legado do zero é caro e arriscado, enquanto a continuidade do serviço é mantida.",
      "fonte": "fundamentos.porque"
    },
    {
      "id": "mainframe-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você está explicando a um colega por que mainframes são considerados únicos. Qual é um dos fatores que contribui para essa singularidade?",
      "alternativas": {
        "a": "Eles são mais rápidos que servidores comuns",
        "b": "Eles operam em um ambiente de tecnologia obsoleta",
        "c": "Eles são projetados para sistemas críticos com alta confiabilidade",
        "d": "Eles são acessíveis a qualquer desenvolvedor iniciante"
      },
      "correta": "c",
      "explicacao": "Mainframes são únicos porque são projetados especificamente para operar sistemas críticos com alta confiabilidade e estabilidade, processando milhões de transações diariamente.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "mainframe-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você está avaliando uma proposta de carreira em mainframe. Qual é um dos principais desafios que você deve estar preparado para enfrentar?",
      "alternativas": {
        "a": "Trabalhar apenas com tecnologias modernas e populares",
        "b": "Lidar com código legado e sistemas antigos",
        "c": "Desenvolver aplicativos para dispositivos móveis",
        "d": "Criar interfaces gráficas complexas"
      },
      "correta": "b",
      "explicacao": "Um dos principais desafios em uma carreira em mainframe é lidar com código legado e sistemas antigos, que exigem paciência e atenção aos detalhes.",
      "fonte": "fundamentos.porque"
    },
    {
      "id": "mainframe-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você está se preparando para uma entrevista sobre mainframes. Qual é uma característica que você deve destacar sobre o ambiente de mainframe?",
      "alternativas": {
        "a": "A flexibilidade para mudar rapidamente de tecnologia",
        "b": "A estabilidade e confiabilidade dos sistemas",
        "c": "A facilidade de uso para desenvolvedores iniciantes",
        "d": "A popularidade crescente entre jovens profissionais"
      },
      "correta": "b",
      "explicacao": "A estabilidade e confiabilidade dos sistemas é uma característica fundamental do ambiente de mainframe, o que o torna atraente para empresas que precisam de operações ininterruptas.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "mainframe-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você precisa resolver um problema que envolve processar dados de um arquivo grande. Qual abordagem você deve usar para garantir que cada registro seja tratado corretamente?",
      "alternativas": {
        "a": "Ler o arquivo todo de uma vez e aplicar as regras em um único passo.",
        "b": "Decompor a tarefa em passos claros, usando laços para processar cada registro sequencialmente.",
        "c": "Ignorar a lógica e tentar aplicar as regras de forma aleatória.",
        "d": "Processar apenas os registros que parecem mais importantes, sem seguir uma ordem."
      },
      "correta": "b",
      "explicacao": "A abordagem correta é decompor a tarefa em passos claros e usar laços para garantir que cada registro seja processado sequencialmente.",
      "fonte": "logica.logica"
    },
    {
      "id": "mainframe-ini-08",
      "nivel": "iniciante",
      "pergunta": "Ao programar, você se depara com a necessidade de tomar decisões com base em condições. Qual estrutura você deve usar para implementar essa lógica?",
      "alternativas": {
        "a": "Usar variáveis para armazenar dados sem verificar condições.",
        "b": "Utilizar condicionais para definir ações baseadas em 'se isto, então aquilo'.",
        "c": "Criar múltiplos laços sem considerar as condições necessárias.",
        "d": "Ignorar a lógica condicional e programar diretamente as ações."
      },
      "correta": "b",
      "explicacao": "A estrutura correta para tomar decisões é utilizar condicionais, que permitem definir ações com base em condições específicas.",
      "fonte": "logica.logica"
    },
    {
      "id": "mainframe-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você está aprendendo lógica de programação e precisa repetir uma ação várias vezes. Qual a melhor prática para isso?",
      "alternativas": {
        "a": "Escrever o mesmo código várias vezes para cada repetição.",
        "b": "Usar laços para automatizar a repetição da ação de forma organizada.",
        "c": "Criar uma função que não considera a repetição.",
        "d": "Evitar laços e tentar resolver o problema sem repetições."
      },
      "correta": "b",
      "explicacao": "A melhor prática é usar laços, que permitem automatizar a repetição de ações de forma organizada e eficiente.",
      "fonte": "logica.logica"
    },
    {
      "id": "mainframe-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um programa COBOL para processar dados financeiros. Qual é a melhor maneira de garantir que os dados sejam lidos e escritos corretamente, considerando a estrutura dos registros?",
      "alternativas": {
        "a": "Definir a estrutura dos dados na Data Division antes de processá-los.",
        "b": "Usar variáveis globais para armazenar os dados temporariamente.",
        "c": "Ignorar a definição de tamanho dos campos, pois isso não afeta o processamento.",
        "d": "Declarar todos os dados como strings, já que o COBOL é verboso."
      },
      "correta": "a",
      "explicacao": "Definir a estrutura dos dados na Data Division é essencial para garantir que cada campo seja tratado corretamente durante o processamento.",
      "fonte": "cobol.linguagem"
    },
    {
      "id": "mainframe-int-02",
      "nivel": "intermediario",
      "pergunta": "Ao escrever um programa COBOL que precisa ler um arquivo de entrada e gerar um relatório, qual abordagem você deve seguir para garantir que o processamento seja feito corretamente?",
      "alternativas": {
        "a": "Abrir o arquivo, ler todos os registros de uma vez e processá-los em memória.",
        "b": "Abrir o arquivo, ler registro por registro, processar e gravar os resultados em um arquivo de saída.",
        "c": "Ler o arquivo em ordem aleatória para otimizar a velocidade de leitura.",
        "d": "Processar os dados sem verificar a estrutura do arquivo, confiando que tudo está correto."
      },
      "correta": "b",
      "explicacao": "A abordagem correta é ler registro por registro, processar e gravar os resultados, que é o padrão de processamento sequencial no COBOL.",
      "fonte": "cobol.arquivos"
    },
    {
      "id": "mainframe-int-03",
      "nivel": "intermediario",
      "pergunta": "Você precisa implementar um programa COBOL que gere relatórios a partir de dados de clientes. Qual é a prática recomendada para definir a estrutura dos dados na Data Division?",
      "alternativas": {
        "a": "Definir os campos com tamanhos fixos e tipos específicos para cada dado.",
        "b": "Usar tamanhos variáveis para permitir flexibilidade nos dados.",
        "c": "Declarar todos os campos como numéricos para simplificar o código.",
        "d": "Definir apenas os campos que você acha que serão necessários."
      },
      "correta": "a",
      "explicacao": "Definir os campos com tamanhos fixos e tipos específicos é fundamental para garantir a precisão no processamento dos dados.",
      "fonte": "cobol.linguagem"
    },
    {
      "id": "mainframe-int-04",
      "nivel": "intermediario",
      "pergunta": "Em um projeto COBOL, você precisa processar um grande volume de dados de maneira eficiente. Qual é a abordagem correta para lidar com arquivos?",
      "alternativas": {
        "a": "Utilizar arquivos sequenciais para garantir que os dados sejam lidos na ordem correta.",
        "b": "Armazenar todos os dados em um único arquivo para simplificar a leitura.",
        "c": "Processar os dados em múltiplos arquivos ao mesmo tempo para melhorar a performance.",
        "d": "Ler e escrever dados em um formato não estruturado para maior flexibilidade."
      },
      "correta": "a",
      "explicacao": "A utilização de arquivos sequenciais é a abordagem correta, pois garante que os dados sejam lidos na ordem correta e processados de forma eficiente.",
      "fonte": "cobol.arquivos"
    },
    {
      "id": "mainframe-int-05",
      "nivel": "intermediario",
      "pergunta": "Você está escrevendo um programa COBOL que deve manipular dados de clientes. Como deve ser a definição dos dados na Data Division para evitar erros de processamento?",
      "alternativas": {
        "a": "Definir cada campo com um tamanho fixo e tipo adequado, conforme a necessidade dos dados.",
        "b": "Declarar todos os campos como texto, pois isso facilita a manipulação.",
        "c": "Usar tamanhos de campo variáveis para acomodar diferentes tipos de dados.",
        "d": "Ignorar a definição de tipos, já que o COBOL é flexível com dados."
      },
      "correta": "a",
      "explicacao": "Definir cada campo com um tamanho fixo e tipo adequado é crucial para evitar erros de processamento e garantir a integridade dos dados.",
      "fonte": "cobol.linguagem"
    },
    {
      "id": "mainframe-int-06",
      "nivel": "intermediario",
      "pergunta": "Você precisa executar um job em lote que processa transações bancárias durante a madrugada. Qual a principal vantagem de usar processamento em lote nesse cenário?",
      "alternativas": {
        "a": "Permite que o job seja executado sem interação humana, garantindo que todas as transações sejam processadas de uma vez.",
        "b": "Possibilita que o job responda rapidamente a solicitações de usuários em tempo real, melhorando a eficiência do sistema.",
        "c": "Facilita a execução de jobs em horários de pico, aumentando a produtividade do sistema.",
        "d": "Garante que o job seja executado imediatamente após a solicitação, sem atrasos."
      },
      "correta": "a",
      "explicacao": "O processamento em lote permite que grandes volumes de dados sejam processados sem interação humana, ideal para tarefas como o fechamento diário de um banco.",
      "fonte": "jcl.batch"
    },
    {
      "id": "mainframe-int-07",
      "nivel": "intermediario",
      "pergunta": "Você está escrevendo um JCL para rodar um programa COBOL que deve ler um arquivo de entrada. Qual das seguintes opções é a mais adequada para garantir que o arquivo seja lido corretamente?",
      "alternativas": {
        "a": "Definir o arquivo como um dataset de entrada no step correspondente do JCL.",
        "b": "Incluir o dataset como uma variável de ambiente no sistema operacional antes de executar o job.",
        "c": "Rodar o programa COBOL sem especificar o dataset, confiando que ele será encontrado automaticamente.",
        "d": "Criar uma cópia do arquivo de entrada em um diretório temporário antes de executar o job."
      },
      "correta": "a",
      "explicacao": "Definir o arquivo como um dataset de entrada no step do JCL é essencial para que o programa COBOL consiga acessá-lo corretamente.",
      "fonte": "jcl.jcl"
    },
    {
      "id": "mainframe-int-08",
      "nivel": "intermediario",
      "pergunta": "Durante a execução de um job em lote, você precisa garantir que um step só seja executado se o step anterior for bem-sucedido. Como isso pode ser feito no JCL?",
      "alternativas": {
        "a": "Utilizando o parâmetro COND para especificar a condição de execução do step.",
        "b": "Colocando todos os steps em um único job sem condições específicas.",
        "c": "Executando o job em modo interativo para monitorar o progresso dos steps.",
        "d": "Definindo um novo job para cada step, garantindo que eles sejam independentes."
      },
      "correta": "a",
      "explicacao": "O parâmetro COND permite que você controle a execução de steps com base no resultado do step anterior, garantindo um fluxo de trabalho adequado.",
      "fonte": "jcl.jcl"
    },
    {
      "id": "mainframe-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está programando um job em lote que precisa ser executado em um horário específico. Qual a melhor prática para garantir que isso aconteça?",
      "alternativas": {
        "a": "Agendar o job para rodar em um horário definido usando um scheduler de jobs.",
        "b": "Executar o job manualmente sempre que necessário, sem agendamento.",
        "c": "Rodar o job em um loop até que o horário desejado chegue.",
        "d": "Configurar o job para ser executado em qualquer horário, dependendo da carga do sistema."
      },
      "correta": "a",
      "explicacao": "Agendar o job para rodar em um horário definido é a melhor prática para garantir que ele seja executado no momento certo, especialmente em processamento em lote.",
      "fonte": "jcl.batch"
    },
    {
      "id": "mainframe-int-10",
      "nivel": "intermediario",
      "pergunta": "Após a execução de um job em lote, você percebe que ocorreu uma falha. Qual a abordagem correta para garantir a recuperação sem reprocessar todos os dados?",
      "alternativas": {
        "a": "Implementar um mecanismo de checkpoint para reiniciar o job a partir do ponto de falha.",
        "b": "Reexecutar todo o job desde o início para garantir que todos os dados sejam processados corretamente.",
        "c": "Ignorar a falha e continuar com o próximo job na sequência.",
        "d": "Modificar o JCL para eliminar o step que falhou e executar os demais."
      },
      "correta": "a",
      "explicacao": "Implementar um mecanismo de checkpoint permite reiniciar o job a partir do ponto de falha, evitando a necessidade de reprocessar todos os dados.",
      "fonte": "jcl.batch"
    },
    {
      "id": "mainframe-int-11",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um programa COBOL que precisa acessar dados do DB2. Para garantir que a consulta SQL funcione corretamente, qual é a prática recomendada ao embutir comandos SQL no código?",
      "alternativas": {
        "a": "Utilizar comandos SQL dentro de parênteses para evitar erros de sintaxe.",
        "b": "Colocar os comandos SQL dentro de uma seção específica do código COBOL.",
        "c": "Incluir os comandos SQL diretamente no fluxo do programa, sem separação.",
        "d": "Adicionar comentários explicativos antes de cada comando SQL para facilitar a leitura."
      },
      "correta": "b",
      "explicacao": "Colocar os comandos SQL em uma seção específica do código COBOL ajuda a organizar o código e facilita a manutenção e leitura, seguindo as boas práticas de programação.",
      "fonte": "dados.db2"
    },
    {
      "id": "mainframe-int-12",
      "nivel": "intermediario",
      "pergunta": "Você precisa otimizar a leitura de registros em um arquivo VSAM. Qual abordagem você deve considerar para melhorar a eficiência do acesso aos dados?",
      "alternativas": {
        "a": "Utilizar leitura sequencial para garantir que todos os registros sejam processados.",
        "b": "Implementar acesso indexado para buscar registros específicos rapidamente.",
        "c": "Armazenar todos os dados em arquivos sequenciais para simplificar o acesso.",
        "d": "Criar cópias dos dados em múltiplos arquivos para facilitar a leitura."
      },
      "correta": "b",
      "explicacao": "O acesso indexado no VSAM permite localizar registros específicos rapidamente, melhorando a eficiência em comparação com a leitura sequencial.",
      "fonte": "dados.vsam"
    },
    {
      "id": "mainframe-int-13",
      "nivel": "intermediario",
      "pergunta": "Durante o desenvolvimento de um sistema que utiliza tanto DB2 quanto VSAM, você precisa garantir que as operações de leitura e escrita sejam realizadas de forma eficiente. O que deve ser considerado ao escolher entre os dois métodos de armazenamento?",
      "alternativas": {
        "a": "DB2 é sempre mais rápido que VSAM, então deve ser usado em todas as situações.",
        "b": "VSAM deve ser utilizado apenas para dados que não mudam com frequência.",
        "c": "A escolha deve depender do tipo de operação e da estrutura dos dados.",
        "d": "Ambos os métodos devem ser usados simultaneamente para garantir a integridade dos dados."
      },
      "correta": "c",
      "explicacao": "A escolha entre DB2 e VSAM deve levar em conta o tipo de operação (transações online ou batch) e a estrutura dos dados, pois cada um tem suas vantagens em diferentes cenários.",
      "fonte": "dados.db2"
    },
    {
      "id": "mainframe-int-14",
      "nivel": "intermediario",
      "pergunta": "Você está implementando um job em lote que precisa atualizar registros no DB2. Qual abordagem você deve seguir para garantir que as atualizações sejam feitas corretamente?",
      "alternativas": {
        "a": "Executar todas as atualizações em uma única transação para evitar inconsistências.",
        "b": "Realizar as atualizações uma a uma, sem controle de transação.",
        "c": "Usar uma transação para cada registro atualizado para garantir a integridade.",
        "d": "Agrupar as atualizações em pequenas transações para facilitar o controle."
      },
      "correta": "a",
      "explicacao": "Executar todas as atualizações em uma única transação garante que as alterações sejam feitas de forma consistente, evitando problemas de integridade dos dados.",
      "fonte": "dados.db2"
    },
    {
      "id": "mainframe-int-15",
      "nivel": "intermediario",
      "pergunta": "Você está lidando com um sistema legado que utiliza arquivos VSAM. Qual é a principal vantagem de usar VSAM em comparação com arquivos sequenciais?",
      "alternativas": {
        "a": "VSAM permite acesso direto a registros específicos por meio de chaves.",
        "b": "VSAM é mais fácil de implementar do que arquivos sequenciais.",
        "c": "VSAM consome menos espaço em disco do que arquivos sequenciais.",
        "d": "VSAM não requer conhecimento técnico para ser utilizado."
      },
      "correta": "a",
      "explicacao": "A principal vantagem do VSAM é seu acesso indexado, que permite localizar registros específicos rapidamente, ao contrário dos arquivos sequenciais que exigem leitura completa.",
      "fonte": "dados.vsam"
    },
    {
      "id": "mainframe-av-01",
      "nivel": "avancado",
      "pergunta": "Você está tentando submeter um job no z/OS, mas ele não está sendo executado. O que você deve verificar primeiro?",
      "alternativas": {
        "a": "Se o JCL está correto e segue as convenções de nomeação dos datasets.",
        "b": "Se o job foi enviado em um horário que o sistema está disponível.",
        "c": "Se você tem permissão para executar jobs em qualquer dataset.",
        "d": "Se o sistema está atualizado com a última versão do z/OS."
      },
      "correta": "a",
      "explicacao": "Verificar a correção do JCL é essencial, pois um erro de sintaxe ou convenção pode impedir a execução do job.",
      "fonte": "ambiente.zos"
    },
    {
      "id": "mainframe-av-02",
      "nivel": "avancado",
      "pergunta": "Você precisa acessar um dataset específico no z/OS, mas não sabe o nome exato. Qual é a melhor maneira de encontrá-lo?",
      "alternativas": {
        "a": "Usar o comando de busca no ISPF para localizar datasets com base em padrões conhecidos.",
        "b": "Tentar acessar todos os datasets até encontrar o correto.",
        "c": "Consultar um colega que já trabalhou com o mesmo dataset.",
        "d": "Acessar a documentação do z/OS para encontrar o nome do dataset."
      },
      "correta": "a",
      "explicacao": "O comando de busca no ISPF é a maneira mais eficiente e prática de localizar datasets com base em padrões.",
      "fonte": "ambiente.zos"
    },
    {
      "id": "mainframe-av-03",
      "nivel": "avancado",
      "pergunta": "Você está editando um programa COBOL no ISPF e deseja testar as alterações. O que você deve fazer primeiro?",
      "alternativas": {
        "a": "Salvar as alterações e submeter o job para execução.",
        "b": "Compilar o programa antes de salvar as alterações.",
        "c": "Verificar se o JCL está correto antes de compilar.",
        "d": "Fazer um backup do programa original antes de qualquer alteração."
      },
      "correta": "a",
      "explicacao": "Salvar as alterações e submeter o job é o passo correto para testar as modificações feitas no programa.",
      "fonte": "ambiente.zos"
    },
    {
      "id": "mainframe-av-04",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um programa que precisa gerenciar transações em tempo real. Qual é a principal consideração ao usar CICS?",
      "alternativas": {
        "a": "As transações devem ser curtas e bem definidas para garantir o desempenho.",
        "b": "As transações podem ser longas, pois o CICS gerencia a execução em segundo plano.",
        "c": "O CICS não permite acesso simultâneo a dados durante as transações.",
        "d": "As transações devem ser executadas em horários específicos para evitar conflitos."
      },
      "correta": "a",
      "explicacao": "As transações em CICS precisam ser curtas e bem definidas para garantir a eficiência e o desempenho do sistema.",
      "fonte": "ambiente.cics"
    },
    {
      "id": "mainframe-av-05",
      "nivel": "avancado",
      "pergunta": "Você precisa garantir que uma transação no CICS seja completada ou revertida em caso de falha. Qual mecanismo do CICS você deve utilizar?",
      "alternativas": {
        "a": "O gerenciamento de unidades de trabalho (UOW) para garantir a integridade da transação.",
        "b": "O uso de logs para registrar todas as transações realizadas.",
        "c": "A configuração de tempos limites para transações mais longas.",
        "d": "A execução de transações em lote para reduzir o risco de falhas."
      },
      "correta": "a",
      "explicacao": "O gerenciamento de unidades de trabalho (UOW) é fundamental para garantir que uma transação seja completada ou revertida em caso de falha.",
      "fonte": "ambiente.cics"
    },
    {
      "id": "mainframe-av-06",
      "nivel": "avancado",
      "pergunta": "Durante a execução de um programa, você encontra um abend. Qual é o primeiro passo que você deve tomar para investigar o problema?",
      "alternativas": {
        "a": "Consultar o código do abend para identificar o tipo de erro.",
        "b": "Reiniciar o job para ver se o erro persiste.",
        "c": "Modificar o código do programa sem investigar o erro.",
        "d": "Acessar a documentação para entender o que é um abend."
      },
      "correta": "a",
      "explicacao": "Consultar o código do abend é o primeiro passo crucial para identificar a causa do erro e iniciar a investigação.",
      "fonte": "ambiente.abend"
    },
    {
      "id": "mainframe-av-07",
      "nivel": "avancado",
      "pergunta": "Você está analisando os logs de um job que falhou. O que você deve procurar para entender a causa do abend?",
      "alternativas": {
        "a": "Erros de lógica no código do programa.",
        "b": "Mensagens de erro específicas que indicam onde o job falhou.",
        "c": "Referências a outros jobs que podem ter interferido na execução.",
        "d": "Mudanças recentes na configuração do sistema."
      },
      "correta": "b",
      "explicacao": "Mensagens de erro específicas nos logs são fundamentais para entender onde e por que o job falhou.",
      "fonte": "ambiente.abend"
    },
    {
      "id": "mainframe-av-08",
      "nivel": "avancado",
      "pergunta": "Você precisa ler um dump para entender um abend complexo. Qual habilidade é essencial para essa tarefa?",
      "alternativas": {
        "a": "Familiaridade com a estrutura e o conteúdo de dumps no ambiente mainframe.",
        "b": "Conhecimento sobre a linguagem de programação utilizada no job que falhou.",
        "c": "Capacidade de modificar o código do programa para evitar futuros abends.",
        "d": "Experiência em otimização de performance de jobs no mainframe."
      },
      "correta": "a",
      "explicacao": "A familiaridade com a estrutura e conteúdo dos dumps é essencial para interpretar corretamente as informações e diagnosticar o problema.",
      "fonte": "ambiente.abend"
    },
    {
      "id": "mainframe-av-09",
      "nivel": "avancado",
      "pergunta": "Você está depurando um programa que falhou. Qual atitude deve ser evitada durante a investigação de um abend?",
      "alternativas": {
        "a": "Ignorar o código do abend e tentar consertar o problema sem informações.",
        "b": "Analisar os logs e dumps para entender a causa do erro.",
        "c": "Isolar a parte do código que causou a falha para testes.",
        "d": "Consultar a documentação para entender os códigos de erro."
      },
      "correta": "a",
      "explicacao": "Ignorar o código do abend e tentar consertar sem informações é uma abordagem ineficaz e pode levar a mais problemas.",
      "fonte": "ambiente.abend"
    },
    {
      "id": "mainframe-av-10",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo uma rotina batch em COBOL que precisa criticar registros de movimentações. Qual abordagem você deve usar para garantir que registros inválidos não interrompam o job?",
      "alternativas": {
        "a": "Descarte todos os registros inválidos e continue o processamento.",
        "b": "Crie um arquivo de saída separado para os registros inválidos.",
        "c": "Pare o job imediatamente ao encontrar um registro inválido.",
        "d": "Ignore os registros inválidos e processe apenas os válidos."
      },
      "correta": "b",
      "explicacao": "Criar um arquivo de saída separado para os registros inválidos permite que o job continue e capture os erros sem interromper o processamento.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "mainframe-av-11",
      "nivel": "avancado",
      "pergunta": "Ao implementar um job JCL que lê um arquivo de movimentações, qual é a prática recomendada para garantir que cada passo do job só avance se o anterior for bem-sucedido?",
      "alternativas": {
        "a": "Utilizar a cláusula 'COND=EVEN' em todos os passos.",
        "b": "Definir a condição de saída de cada passo corretamente.",
        "c": "Configurar todos os passos para rodarem independentemente.",
        "d": "Usar 'COND=ONLY' para que o job pare ao primeiro erro."
      },
      "correta": "b",
      "explicacao": "Definir a condição de saída corretamente garante que cada passo do job só avance se o anterior for bem-sucedido, evitando falhas em cascata.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "mainframe-av-12",
      "nivel": "avancado",
      "pergunta": "Você precisa gerar um relatório totalizado a partir de dados processados em uma rotina batch. Qual é a abordagem correta para garantir a precisão dos dados no relatório?",
      "alternativas": {
        "a": "Totalizar os dados durante a leitura do arquivo de entrada.",
        "b": "Realizar a totalização apenas após a validação completa dos registros.",
        "c": "Totalizar os dados enquanto ignora os registros inválidos.",
        "d": "Gerar o relatório antes de validar os dados."
      },
      "correta": "b",
      "explicacao": "Realizar a totalização após a validação completa dos registros garante que apenas dados corretos sejam considerados, aumentando a precisão do relatório.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "mainframe-av-13",
      "nivel": "avancado",
      "pergunta": "Você está se preparando para entrar na carreira de mainframe e deseja praticar. Qual é a melhor forma de ganhar experiência no ambiente real?",
      "alternativas": {
        "a": "Participar de cursos online de programação em geral.",
        "b": "Criar um projeto pessoal em um computador comum.",
        "c": "Utilizar o IBM Z Xplore para acessar um mainframe real.",
        "d": "Focar apenas em teoria e livros sobre COBOL."
      },
      "correta": "c",
      "explicacao": "Utilizar o IBM Z Xplore permite que você tenha acesso a um mainframe real e pratique em um ambiente que simula o dia a dia do trabalho.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "mainframe-av-14",
      "nivel": "avancado",
      "pergunta": "Ao buscar uma oportunidade na área de mainframe, qual estratégia é mais eficaz para se posicionar no mercado?",
      "alternativas": {
        "a": "Aguardar que vagas júnior sejam anunciadas em sites de emprego.",
        "b": "Focar em programas de formação oferecidos por grandes empresas.",
        "c": "Enviar currículos em massa sem personalização.",
        "d": "Apostar em cursos de tecnologia não relacionados a mainframe."
      },
      "correta": "b",
      "explicacao": "Focar em programas de formação oferecidos por grandes empresas é a estratégia mais realista, pois eles frequentemente buscam novos talentos para a área.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "mainframe-av-15",
      "nivel": "avancado",
      "pergunta": "Qual característica é importante para quem deseja prosperar na carreira de mainframe?",
      "alternativas": {
        "a": "Preferir trabalhar em projetos novos e inovadores.",
        "b": "Valorizar a estabilidade e ter paciência para lidar com código legado.",
        "c": "Focar em linguagens de programação modernas e populares.",
        "d": "Ter aversão a sistemas grandes e complexos."
      },
      "correta": "b",
      "explicacao": "Valorizar a estabilidade e ter paciência para lidar com código legado são características essenciais, já que grande parte do trabalho envolve manutenção de sistemas antigos.",
      "fonte": "carreira.entrar"
    }
  ]
};

export default pool;
