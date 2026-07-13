// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool qa). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "qa",
  "questions": [
    {
      "id": "qa-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está testando um novo recurso de um software e encontra um bug. O que você deve fazer para garantir que o problema seja resolvido rapidamente?",
      "alternativas": {
        "a": "Reportar o bug de forma clara e detalhada para a equipe de desenvolvimento.",
        "b": "Aguardar até que o desenvolvedor pergunte sobre os bugs encontrados.",
        "c": "Ignorar o bug, pois ele pode ser corrigido em uma atualização futura.",
        "d": "Testar novamente o software para ver se o bug desapareceu por conta própria."
      },
      "correta": "a",
      "explicacao": "Reportar o bug de forma clara e detalhada ajuda a equipe a entender e resolver o problema rapidamente.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "qa-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você está participando de uma reunião de planejamento de um novo projeto. Qual deve ser sua abordagem como profissional de QA?",
      "alternativas": {
        "a": "Focar apenas nos requisitos funcionais do software.",
        "b": "Questionar requisitos ambíguos e sugerir melhorias para prevenir bugs.",
        "c": "Aguardar o desenvolvimento terminar para começar a pensar nos testes.",
        "d": "Concentrar-se em como os usuários devem usar o software."
      },
      "correta": "b",
      "explicacao": "Questionar requisitos ambíguos ajuda a prevenir bugs e garante que todos tenham uma compreensão clara do que precisa ser feito.",
      "fonte": "fundamentos.qualidadeteste"
    },
    {
      "id": "qa-ini-03",
      "nivel": "iniciante",
      "pergunta": "Durante o teste de um aplicativo, você percebe que um campo de entrada aceita valores inválidos. O que você deve fazer?",
      "alternativas": {
        "a": "Sinalizar o problema e sugerir que o campo aceite apenas valores válidos.",
        "b": "Testar o aplicativo novamente para ver se o problema persiste.",
        "c": "Informar que o campo deve aceitar todos os tipos de entrada.",
        "d": "Aguardar que o desenvolvedor note o erro por conta própria."
      },
      "correta": "a",
      "explicacao": "Sinalizar o problema e sugerir que o campo aceite apenas valores válidos ajuda a garantir a qualidade do software.",
      "fonte": "fundamentos.mindset"
    },
    {
      "id": "qa-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você está testando um software e percebe que ele falha em situações extremas, como entradas muito grandes. O que você deve fazer?",
      "alternativas": {
        "a": "Criar casos de teste para essas situações e reportar os resultados.",
        "b": "Ignorar esses casos, pois são raros e não afetam a maioria dos usuários.",
        "c": "Aguardar que outros testadores façam esses testes.",
        "d": "Testar apenas os cenários que funcionam corretamente."
      },
      "correta": "a",
      "explicacao": "Criar casos de teste para situações extremas ajuda a identificar e corrigir falhas que podem afetar a experiência do usuário.",
      "fonte": "fundamentos.mindset"
    },
    {
      "id": "qa-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você está no final do ciclo de desenvolvimento e o software está prestes a ser lançado. O que é mais importante fazer neste momento?",
      "alternativas": {
        "a": "Executar testes finais para garantir que tudo funcione como esperado.",
        "b": "Aguardar o feedback dos usuários após o lançamento.",
        "c": "Focar apenas em novas funcionalidades para o próximo ciclo.",
        "d": "Testar apenas as partes do software que foram alteradas."
      },
      "correta": "a",
      "explicacao": "Executar testes finais é crucial para garantir que o software funcione corretamente antes do lançamento.",
      "fonte": "fundamentos.ciclo"
    },
    {
      "id": "qa-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você está revisando um caso de teste e percebe que ele não cobre todas as possíveis entradas do usuário. O que você deve fazer?",
      "alternativas": {
        "a": "Adicionar mais cenários ao caso de teste para cobrir as entradas faltantes.",
        "b": "Manter o caso de teste como está, pois ele já é suficiente.",
        "c": "Remover o caso de teste, pois ele está muito complexo.",
        "d": "Aguardar que outro membro da equipe revise o caso de teste."
      },
      "correta": "a",
      "explicacao": "Adicionar mais cenários ao caso de teste garante que todas as possíveis entradas sejam testadas, aumentando a qualidade do software.",
      "fonte": "fundamentos.qualidadeteste"
    },
    {
      "id": "qa-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você está testando um software em um ambiente de desenvolvimento. O que deve ser sua principal preocupação?",
      "alternativas": {
        "a": "Garantir que todas as funcionalidades estejam presentes e funcionando.",
        "b": "Apenas verificar se o software não apresenta erros visíveis.",
        "c": "Focar em como o software será utilizado no ambiente de produção.",
        "d": "Testar apenas as partes do software que foram alteradas recentemente."
      },
      "correta": "c",
      "explicacao": "Focar em como o software será utilizado no ambiente de produção ajuda a identificar problemas que podem surgir no uso real.",
      "fonte": "fundamentos.ciclo"
    },
    {
      "id": "qa-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você está revisando um requisito e percebe que ele é ambíguo. O que você deve fazer?",
      "alternativas": {
        "a": "Questionar a ambiguidade e buscar esclarecimentos com a equipe.",
        "b": "Ignorar a ambiguidade, pois o desenvolvimento pode resolver isso depois.",
        "c": "Escrever um caso de teste baseado na interpretação que você entendeu.",
        "d": "Aguardar que a equipe de desenvolvimento pergunte sobre o requisito."
      },
      "correta": "a",
      "explicacao": "Questionar a ambiguidade e buscar esclarecimentos ajuda a evitar bugs que podem surgir de requisitos mal definidos.",
      "fonte": "fundamentos.qualidadeteste"
    },
    {
      "id": "qa-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você percebe que a equipe de desenvolvimento não está testando seu próprio código. Como você deve agir?",
      "alternativas": {
        "a": "Conversar com a equipe sobre a importância de testar o próprio trabalho.",
        "b": "Esperar que eles percebam a necessidade de testar.",
        "c": "Testar tudo sozinho para garantir a qualidade do software.",
        "d": "Aguardar o ciclo de testes para discutir o assunto."
      },
      "correta": "a",
      "explicacao": "Conversar com a equipe sobre a importância de testar ajuda a criar uma cultura de qualidade compartilhada.",
      "fonte": "fundamentos.ciclo"
    },
    {
      "id": "qa-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você está testando uma nova funcionalidade de login em um sistema. Qual tipo de teste você deve priorizar para garantir que a funcionalidade atenda às expectativas do usuário?",
      "alternativas": {
        "a": "Teste de aceitação, pois verifica se o sistema atende ao que foi pedido",
        "b": "Teste de integração, para checar se o front e a API funcionam juntos",
        "c": "Teste de unidade, para garantir que a função de login está correta",
        "d": "Teste de sistema, para avaliar o software completo em uso real"
      },
      "correta": "a",
      "explicacao": "O teste de aceitação é focado em validar se a funcionalidade atende às necessidades do usuário, o que é essencial para a qualidade do produto.",
      "fonte": "tipos.niveis"
    },
    {
      "id": "qa-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você precisa verificar se um sistema suporta 1000 usuários simultaneamente. Qual tipo de teste é mais adequado para essa situação?",
      "alternativas": {
        "a": "Teste funcional, para garantir que todas as funcionalidades estão corretas",
        "b": "Teste de usabilidade, para avaliar a experiência do usuário",
        "c": "Teste de desempenho, para verificar a capacidade do sistema sob carga",
        "d": "Teste de integração, para checar a interação entre diferentes partes"
      },
      "correta": "c",
      "explicacao": "O teste de desempenho é especificamente projetado para avaliar como o sistema se comporta sob diferentes condições de carga, como muitos usuários simultâneos.",
      "fonte": "tipos.funcional"
    },
    {
      "id": "qa-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você está realizando um teste em um sistema sem olhar o código. Qual abordagem você está usando?",
      "alternativas": {
        "a": "Teste de caixa branca, que requer conhecimento do código interno",
        "b": "Teste de caixa cinza, que combina conhecimento interno e externo",
        "c": "Teste de caixa preta, que foca apenas no comportamento externo",
        "d": "Teste de integração, que verifica a conexão entre partes do sistema"
      },
      "correta": "c",
      "explicacao": "O teste de caixa preta é realizado sem acesso ao código, focando apenas nas entradas e saídas do sistema, como um usuário faria.",
      "fonte": "tipos.caixa"
    },
    {
      "id": "qa-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você está testando uma nova funcionalidade de cadastro e quer garantir que ela funcione corretamente em diferentes navegadores. Qual tipo de teste você deve realizar?",
      "alternativas": {
        "a": "Teste de aceitação, para verificar se atende às expectativas do cliente",
        "b": "Teste funcional, para confirmar que o cadastro salva os dados corretamente",
        "c": "Teste não-funcional, especificamente de compatibilidade, para checar diferentes navegadores",
        "d": "Teste de unidade, para validar a função de cadastro isoladamente"
      },
      "correta": "c",
      "explicacao": "O teste de compatibilidade é um tipo de teste não-funcional que verifica se o sistema funciona em diferentes ambientes, como navegadores e dispositivos.",
      "fonte": "tipos.funcional"
    },
    {
      "id": "qa-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você está testando a interação entre um front-end e uma API. Qual tipo de teste é mais adequado para garantir que esses componentes funcionam bem juntos?",
      "alternativas": {
        "a": "Teste de aceitação, para verificar se tudo atende ao que foi pedido",
        "b": "Teste de sistema, para avaliar o software completo em uso real",
        "c": "Teste de integração, para validar a comunicação entre partes diferentes",
        "d": "Teste de unidade, para checar a lógica de cada parte isoladamente"
      },
      "correta": "c",
      "explicacao": "O teste de integração é projetado para verificar se diferentes partes do sistema funcionam bem juntas, como o front-end e a API.",
      "fonte": "tipos.niveis"
    },
    {
      "id": "qa-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você precisa testar um sistema e não tem acesso ao código fonte. Qual abordagem você deve usar?",
      "alternativas": {
        "a": "Teste de caixa branca, que requer conhecimento do código interno",
        "b": "Teste de caixa cinza, que combina conhecimento interno e externo",
        "c": "Teste de caixa preta, que foca apenas no comportamento externo",
        "d": "Teste de unidade, que verifica partes isoladas do código"
      },
      "correta": "c",
      "explicacao": "O teste de caixa preta é a abordagem indicada quando se testa sem acesso ao código, focando na funcionalidade e comportamento do sistema.",
      "fonte": "tipos.caixa"
    },
    {
      "id": "qa-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está escrevendo um caso de teste para uma funcionalidade de login. Qual dos seguintes exemplos é um caso de teste adequado?",
      "alternativas": {
        "a": "Com um usuário cadastrado, inserir email e senha corretos e clicar em entrar; esperado: usuário acessa a página inicial.",
        "b": "Testar o login com um usuário cadastrado.",
        "c": "Verificar se o login funciona.",
        "d": "Com um usuário cadastrado, clicar em entrar; esperado: acesso ao sistema."
      },
      "correta": "a",
      "explicacao": "A alternativa correta é um caso de teste claro e específico, com pré-condições, passos e resultado esperado bem definidos.",
      "fonte": "design.casos"
    },
    {
      "id": "qa-int-02",
      "nivel": "intermediario",
      "pergunta": "Você precisa testar um campo que aceita idades de 18 a 65 anos. Qual abordagem de teste é a mais eficiente para garantir a cobertura adequada?",
      "alternativas": {
        "a": "Testar todas as idades entre 18 e 65.",
        "b": "Testar apenas os valores 18 e 65.",
        "c": "Testar um valor válido como 30 e um inválido como 10.",
        "d": "Testar valores aleatórios entre 18 e 65."
      },
      "correta": "c",
      "explicacao": "A partição de equivalência permite testar um valor válido e um inválido, cobrindo a faixa sem necessidade de testar cada número individualmente.",
      "fonte": "design.tecnicas"
    },
    {
      "id": "qa-int-03",
      "nivel": "intermediario",
      "pergunta": "Ao preparar dados de teste para um sistema, qual é a melhor prática em relação ao uso de dados reais?",
      "alternativas": {
        "a": "Usar dados reais de produção sem modificações.",
        "b": "Mascarar dados reais antes de utilizá-los.",
        "c": "Criar dados sintéticos para garantir controle.",
        "d": "Usar dados reais apenas em testes manuais."
      },
      "correta": "b",
      "explicacao": "Mascarar dados reais é essencial para evitar riscos de vazamento de informações sensíveis e garantir conformidade com a LGPD.",
      "fonte": "design.dados"
    },
    {
      "id": "qa-int-04",
      "nivel": "intermediario",
      "pergunta": "Você está elaborando um plano de testes para um novo aplicativo. Qual elemento é crucial para definir o que não será testado?",
      "alternativas": {
        "a": "Os critérios de aceitação do projeto.",
        "b": "O escopo do plano de testes.",
        "c": "A abordagem de testes a ser utilizada.",
        "d": "Os riscos associados ao projeto."
      },
      "correta": "b",
      "explicacao": "O escopo do plano de testes deve deixar claro o que será e o que não será testado, evitando expectativas erradas.",
      "fonte": "design.plano"
    },
    {
      "id": "qa-int-05",
      "nivel": "intermediario",
      "pergunta": "Você encontrou um bug em uma aplicação e precisa reportá-lo. Qual é a parte mais crítica do seu relatório?",
      "alternativas": {
        "a": "O ambiente onde o bug ocorreu.",
        "b": "Um título que descreva o problema.",
        "c": "Os passos para reproduzir o bug.",
        "d": "Evidências como capturas de tela."
      },
      "correta": "c",
      "explicacao": "Os passos para reproduzir o bug são essenciais para que o desenvolvedor consiga replicar o problema e corrigi-lo.",
      "fonte": "design.bugs"
    },
    {
      "id": "qa-int-06",
      "nivel": "intermediario",
      "pergunta": "Ao escrever um caso de teste, qual abordagem deve ser utilizada para garantir que ele seja compreensível por qualquer pessoa?",
      "alternativas": {
        "a": "Usar jargões técnicos que a equipe conhece.",
        "b": "Deixar claro o que fazer e o que esperar.",
        "c": "Incluir muitos detalhes desnecessários.",
        "d": "Focar apenas no resultado esperado."
      },
      "correta": "b",
      "explicacao": "Um bom caso de teste deve ser claro e compreensível, permitindo que qualquer pessoa o execute sem ambiguidades.",
      "fonte": "design.casos"
    },
    {
      "id": "qa-int-07",
      "nivel": "intermediario",
      "pergunta": "Você está testando um sistema que aceita valores de 1 a 100. Qual valor deve ser testado para verificar a análise de valores limite?",
      "alternativas": {
        "a": "1 e 100.",
        "b": "50.",
        "c": "0 e 101.",
        "d": "10 e 90."
      },
      "correta": "a",
      "explicacao": "Testar os limites 1 e 100 é fundamental para identificar erros que podem ocorrer nas bordas da faixa aceitável.",
      "fonte": "design.tecnicas"
    },
    {
      "id": "qa-int-08",
      "nivel": "intermediario",
      "pergunta": "Ao criar dados sintéticos para testes, qual é a principal vantagem dessa abordagem?",
      "alternativas": {
        "a": "Os dados são mais fáceis de gerar.",
        "b": "Você tem total controle sobre os dados utilizados.",
        "c": "Os dados sintéticos são mais realistas.",
        "d": "Eles não precisam ser mascarados."
      },
      "correta": "b",
      "explicacao": "A principal vantagem dos dados sintéticos é que você tem controle total sobre seu conteúdo, permitindo testar cenários específicos de forma segura.",
      "fonte": "design.dados"
    },
    {
      "id": "qa-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está testando uma nova funcionalidade em um software e notou que algo não está funcionando como esperado. O que você deve fazer a seguir?",
      "alternativas": {
        "a": "Registrar o erro e reportar ao desenvolvedor sem investigar mais.",
        "b": "Tentar reproduzir o erro para confirmar que ele realmente acontece.",
        "c": "Ignorar o erro se não estiver claro como reproduzi-lo.",
        "d": "Testar outras funcionalidades antes de investigar o erro."
      },
      "correta": "b",
      "explicacao": "Confirmar que o erro pode ser reproduzido é essencial para garantir que o problema é real e pode ser corrigido.",
      "fonte": "execucao.manual"
    },
    {
      "id": "qa-int-10",
      "nivel": "intermediario",
      "pergunta": "Durante um teste exploratório, você encontrou um comportamento inesperado em um fluxo de checkout. O que você deve fazer para documentar sua descoberta?",
      "alternativas": {
        "a": "Anotar sua descoberta e seguir testando outras áreas sem interrupção.",
        "b": "Registrar a descoberta, incluindo o que testou e o que encontrou, para referência futura.",
        "c": "Compartilhar a descoberta com a equipe, mas sem documentação formal.",
        "d": "Desconsiderar a descoberta se não houver um caso de teste específico para isso."
      },
      "correta": "b",
      "explicacao": "Registrar suas descobertas e o que foi testado é fundamental para manter um histórico e permitir que outros revisem seu trabalho.",
      "fonte": "execucao.exploratorio"
    },
    {
      "id": "qa-int-11",
      "nivel": "intermediario",
      "pergunta": "Após uma atualização no software, você precisa garantir que as funcionalidades anteriores ainda estão funcionando. Qual abordagem você deve usar?",
      "alternativas": {
        "a": "Executar um teste de regressão para verificar as funcionalidades existentes.",
        "b": "Realizar um teste exploratório para descobrir novos bugs.",
        "c": "Focar apenas em novas funcionalidades, ignorando as antigas.",
        "d": "Executar um smoke test apenas para verificar se o sistema está funcionando."
      },
      "correta": "a",
      "explicacao": "O teste de regressão é especificamente projetado para garantir que as funcionalidades que já funcionavam continuam operacionais após mudanças.",
      "fonte": "execucao.regressao"
    },
    {
      "id": "qa-int-12",
      "nivel": "intermediario",
      "pergunta": "Você está prestes a realizar um smoke test após uma nova versão do software. O que deve ser seu foco principal?",
      "alternativas": {
        "a": "Verificar todas as funcionalidades detalhadamente para garantir que tudo está perfeito.",
        "b": "Testar as funcionalidades mais essenciais para garantir que o sistema está minimamente funcional.",
        "c": "Realizar um teste exploratório para descobrir bugs inesperados.",
        "d": "Focar em funcionalidades que foram alteradas na nova versão."
      },
      "correta": "b",
      "explicacao": "O smoke test deve se concentrar nas funcionalidades essenciais para determinar rapidamente se o sistema está estável o suficiente para testes mais aprofundados.",
      "fonte": "execucao.regressao"
    },
    {
      "id": "qa-int-13",
      "nivel": "intermediario",
      "pergunta": "Você está testando uma API que deve retornar dados em formato JSON. Você envia uma requisição e recebe um código de status 500. O que isso indica?",
      "alternativas": {
        "a": "A requisição foi mal formulada e o servidor não conseguiu entender.",
        "b": "O servidor encontrou um erro interno e não conseguiu processar a requisição.",
        "c": "A requisição foi bem-sucedida e os dados estão corretos.",
        "d": "A API não está disponível no momento."
      },
      "correta": "b",
      "explicacao": "O código de status 500 indica um erro interno do servidor, sugerindo que houve um problema ao processar a requisição.",
      "fonte": "apis.postman"
    },
    {
      "id": "qa-int-14",
      "nivel": "intermediario",
      "pergunta": "Durante um teste de carga em uma API, você percebe que o tempo de resposta aumenta significativamente quando o número de usuários simultâneos passa de 500. O que isso pode indicar?",
      "alternativas": {
        "a": "A API está funcionando corretamente, mas precisa de mais usuários para ser testada.",
        "b": "O sistema pode estar se aproximando do seu ponto de quebra e precisa ser otimizado.",
        "c": "O tempo de resposta não é uma métrica relevante para testes de carga.",
        "d": "A API deve ser testada apenas com 100 usuários para garantir resultados precisos."
      },
      "correta": "b",
      "explicacao": "Um aumento significativo no tempo de resposta sob carga elevada pode indicar que o sistema está se aproximando do seu limite de capacidade e precisa de otimização.",
      "fonte": "apis.performance"
    },
    {
      "id": "qa-int-15",
      "nivel": "intermediario",
      "pergunta": "Você está utilizando o Postman para testar uma API e deseja verificar como ela lida com entradas inválidas. Qual abordagem você deve adotar?",
      "alternativas": {
        "a": "Enviar requisições com dados válidos para garantir que a API funcione corretamente.",
        "b": "Mandar dados errados de propósito e conferir se a API retorna o erro certo.",
        "c": "Focar apenas em testar a interface da aplicação, ignorando a API.",
        "d": "Realizar testes apenas em ambientes de produção para obter resultados reais."
      },
      "correta": "b",
      "explicacao": "Enviar dados inválidos de propósito é essencial para verificar se a API responde corretamente com mensagens de erro apropriadas, garantindo sua robustez.",
      "fonte": "apis.postman"
    },
    {
      "id": "qa-av-01",
      "nivel": "avancado",
      "pergunta": "Você está automatizando testes de um sistema que tem mudanças frequentes. Qual abordagem é a mais recomendada para evitar que seus testes quebrem constantemente?",
      "alternativas": {
        "a": "Automatizar todos os testes de ponta a ponta para garantir cobertura total.",
        "b": "Focar em automatizar testes de unidade e integração, deixando os testes de ponta a ponta para fluxos críticos.",
        "c": "Criar testes de ponta a ponta com um número elevado de verificações para cobrir todos os cenários.",
        "d": "Ignorar a automação e realizar testes manuais sempre que houver uma mudança."
      },
      "correta": "b",
      "explicacao": "A abordagem correta é focar em testes de unidade e integração, que são mais estáveis e menos suscetíveis a quebras frequentes, reservando os testes de ponta a ponta para fluxos críticos.",
      "fonte": "automacao.porque"
    },
    {
      "id": "qa-av-02",
      "nivel": "avancado",
      "pergunta": "Você precisa garantir que seus testes de ponta a ponta sejam confiáveis e não falhem sem motivo aparente. Qual prática você deve adotar?",
      "alternativas": {
        "a": "Utilizar esperas fixas para garantir que a página esteja sempre carregada antes de interagir.",
        "b": "Escrever testes que verificam a presença de elementos antes de interagir com eles.",
        "c": "Executar os testes em diferentes navegadores para aumentar a cobertura.",
        "d": "Criar testes que não dependem do estado da aplicação para passar."
      },
      "correta": "b",
      "explicacao": "A prática recomendada é garantir que os elementos estejam presentes antes de interagir, evitando falhas instáveis nos testes.",
      "fonte": "automacao.ferramentas"
    },
    {
      "id": "qa-av-03",
      "nivel": "avancado",
      "pergunta": "Ao implementar uma estratégia de automação de testes, qual é o principal objetivo a ser alcançado com a automação?",
      "alternativas": {
        "a": "Reduzir o número de testes manuais realizados pela equipe de QA.",
        "b": "Aumentar a cobertura de testes em todas as áreas do sistema, independentemente da estabilidade.",
        "c": "Garantir que os testes sejam executados rapidamente e com frequência, mantendo a qualidade do software.",
        "d": "Substituir completamente o trabalho manual do QA por automação."
      },
      "correta": "c",
      "explicacao": "O principal objetivo da automação é garantir que os testes sejam executados rapidamente e com frequência, ajudando a manter a qualidade do software.",
      "fonte": "automacao.porque"
    },
    {
      "id": "qa-av-04",
      "nivel": "avancado",
      "pergunta": "Você está configurando um pipeline de CI/CD e deseja que seus testes sejam executados automaticamente a cada commit. Qual é a melhor prática a seguir?",
      "alternativas": {
        "a": "Executar todos os testes de ponta a ponta para garantir que nada quebrou.",
        "b": "Executar apenas testes de unidade e integração, deixando os de ponta a ponta para verificações manuais.",
        "c": "Executar todos os tipos de teste, mas priorizar os de ponta a ponta para feedback rápido.",
        "d": "Ignorar a execução de testes durante o CI/CD, pois eles podem ser executados manualmente depois."
      },
      "correta": "b",
      "explicacao": "A melhor prática é executar testes de unidade e integração automaticamente, pois são mais rápidos e confiáveis, enquanto os testes de ponta a ponta devem ser reservados para verificações manuais em fluxos críticos.",
      "fonte": "automacao.ci"
    },
    {
      "id": "qa-av-05",
      "nivel": "avancado",
      "pergunta": "Você está revisando uma suíte de testes automatizados e percebe que muitos testes de ponta a ponta estão quebrando frequentemente. O que você deve considerar fazer?",
      "alternativas": {
        "a": "Aumentar a quantidade de testes de ponta a ponta para cobrir mais cenários.",
        "b": "Reduzir a quantidade de testes de ponta a ponta e focar em testes de unidade e integração.",
        "c": "Alterar a ferramenta de automação para ver se melhora a estabilidade dos testes.",
        "d": "Manter os testes de ponta a ponta e ignorar as falhas."
      },
      "correta": "b",
      "explicacao": "Reduzir a quantidade de testes de ponta a ponta e focar em testes de unidade e integração é a abordagem correta para melhorar a estabilidade e a manutenção da suíte de testes.",
      "fonte": "automacao.piramide"
    },
    {
      "id": "qa-av-06",
      "nivel": "avancado",
      "pergunta": "Você está escolhendo uma ferramenta de automação para testes de interface. Qual critério é mais importante a considerar?",
      "alternativas": {
        "a": "A popularidade da ferramenta entre os desenvolvedores.",
        "b": "A facilidade de integração com outras ferramentas de desenvolvimento.",
        "c": "A capacidade de simular interações de usuários e a qualidade da documentação.",
        "d": "A quantidade de recursos disponíveis na ferramenta."
      },
      "correta": "c",
      "explicacao": "A capacidade de simular interações de usuários e a qualidade da documentação são fundamentais para garantir que a ferramenta atenda às suas necessidades de automação de forma eficaz.",
      "fonte": "automacao.ferramentas"
    },
    {
      "id": "qa-av-07",
      "nivel": "avancado",
      "pergunta": "Você está implementando testes de integração em um projeto. Qual é a abordagem mais eficaz para garantir que esses testes sejam úteis?",
      "alternativas": {
        "a": "Executar os testes de integração apenas uma vez por semana para economizar tempo.",
        "b": "Criar testes que verifiquem a interação entre componentes de forma isolada.",
        "c": "Focar em testar apenas as partes mais críticas do sistema para evitar sobrecarga.",
        "d": "Garantir que os testes de integração sejam executados sempre que houver uma mudança no código."
      },
      "correta": "d",
      "explicacao": "Garantir que os testes de integração sejam executados sempre que houver uma mudança no código é crucial para detectar problemas rapidamente e manter a qualidade do software.",
      "fonte": "automacao.ci"
    },
    {
      "id": "qa-av-08",
      "nivel": "avancado",
      "pergunta": "Você está revisando a estratégia de automação de testes de uma equipe. Qual é um sinal claro de que a pirâmide de testes não está equilibrada?",
      "alternativas": {
        "a": "Existem muitos testes de unidade e poucos testes de ponta a ponta.",
        "b": "A maioria dos testes são de ponta a ponta e a suíte é lenta e instável.",
        "c": "Os testes de integração estão sendo executados com frequência.",
        "d": "Os testes de unidade estão falhando frequentemente."
      },
      "correta": "b",
      "explicacao": "Um sinal claro de que a pirâmide de testes não está equilibrada é ter muitos testes de ponta a ponta, resultando em uma suíte lenta e instável.",
      "fonte": "automacao.piramide"
    },
    {
      "id": "qa-av-09",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo uma nova funcionalidade e deseja garantir que os testes automatizados sejam eficazes. O que você deve priorizar?",
      "alternativas": {
        "a": "Criar testes de ponta a ponta para cobrir todos os casos de uso.",
        "b": "Escrever testes de unidade que verifiquem a lógica da funcionalidade.",
        "c": "Focar apenas em testes manuais para garantir a experiência do usuário.",
        "d": "Automatizar todos os testes de integração antes de qualquer outra coisa."
      },
      "correta": "b",
      "explicacao": "Priorizar a escrita de testes de unidade que verifiquem a lógica da funcionalidade é essencial para garantir que a nova funcionalidade funcione corretamente.",
      "fonte": "automacao.piramide"
    },
    {
      "id": "qa-av-10",
      "nivel": "avancado",
      "pergunta": "Você está enfrentando problemas com testes que falham intermitentemente. Qual é a abordagem mais eficaz para resolver esse problema?",
      "alternativas": {
        "a": "Aumentar o tempo de espera entre as interações dos testes.",
        "b": "Revisar os testes para garantir que eles sejam estáveis e não dependam de condições externas.",
        "c": "Ignorar os testes intermitentes e focar nos que passam sempre.",
        "d": "Executar os testes em um ambiente diferente para ver se o problema persiste."
      },
      "correta": "b",
      "explicacao": "Revisar os testes para garantir que sejam estáveis e não dependam de condições externas é a abordagem mais eficaz para resolver problemas de falhas intermitentes.",
      "fonte": "automacao.ferramentas"
    },
    {
      "id": "qa-av-11",
      "nivel": "avancado",
      "pergunta": "Você está se preparando para uma entrevista e precisa explicar por que a certificação ISTQB é valiosa. Qual ponto você deve destacar?",
      "alternativas": {
        "a": "Ela é um selo que garante que você sabe programar bem.",
        "b": "Ela padroniza o vocabulário da área, facilitando a comunicação.",
        "c": "Ela é uma exigência em todas as vagas de QA.",
        "d": "Ela substitui a necessidade de experiência prática."
      },
      "correta": "b",
      "explicacao": "A certificação ISTQB padroniza o vocabulário da área, o que ajuda na comunicação clara e na compreensão de materiais técnicos.",
      "fonte": "carreira.istqb"
    },
    {
      "id": "qa-av-12",
      "nivel": "avancado",
      "pergunta": "Você está montando seu portfólio para uma vaga de QA. Qual item é mais relevante para demonstrar suas habilidades práticas?",
      "alternativas": {
        "a": "Um certificado de conclusão de um curso de programação.",
        "b": "Um plano de testes para um aplicativo que você usa regularmente.",
        "c": "Uma lista de bugs que você encontrou em um projeto de amigos.",
        "d": "Um resumo das aulas que você assistiu sobre testes."
      },
      "correta": "b",
      "explicacao": "Um plano de testes bem elaborado para um aplicativo real demonstra suas habilidades práticas e compreensão do processo de QA.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "qa-av-13",
      "nivel": "avancado",
      "pergunta": "Ao se preparar para a certificação ISTQB, qual abordagem é mais eficaz para garantir um aprendizado sólido?",
      "alternativas": {
        "a": "Decorar as respostas do material de estudo.",
        "b": "Focar em entender os conceitos e praticar com projetos reais.",
        "c": "Estudar apenas os tópicos que caem com frequência na prova.",
        "d": "Assistir a vídeos sobre a certificação sem praticar."
      },
      "correta": "b",
      "explicacao": "Focar em entender os conceitos e praticar com projetos reais garante um aprendizado mais sólido e aplicável no dia a dia.",
      "fonte": "carreira.istqb"
    },
    {
      "id": "qa-av-14",
      "nivel": "avancado",
      "pergunta": "Você deseja migrar de analista de QA para QA Engineer. Qual habilidade deve priorizar para essa transição?",
      "alternativas": {
        "a": "Aprimorar suas habilidades de documentação de bugs.",
        "b": "Aprender uma linguagem de programação para automação.",
        "c": "Focar em testes manuais e evitar automação.",
        "d": "Aumentar sua capacidade de comunicação com a equipe."
      },
      "correta": "b",
      "explicacao": "Aprender uma linguagem de programação para automação é essencial para a transição de analista de QA para QA Engineer, que exige mais habilidades técnicas.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "qa-av-15",
      "nivel": "avancado",
      "pergunta": "Você está em uma reunião de equipe e precisa reportar um problema encontrado em um teste. Qual abordagem é mais recomendada?",
      "alternativas": {
        "a": "Apontar o erro de forma direta e crítica.",
        "b": "Descrever o problema com clareza e sugerir soluções.",
        "c": "Falar apenas sobre o que não funcionou, sem detalhes.",
        "d": "Evitar falar sobre o problema para não criar conflitos."
      },
      "correta": "b",
      "explicacao": "Descrever o problema com clareza e sugerir soluções demonstra uma postura colaborativa e ajuda a equipe a resolver a questão de forma eficiente.",
      "fonte": "carreira.entrar"
    }
  ]
};

export default pool;
