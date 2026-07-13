// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool produto). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "produto",
  "questions": [
    {
      "id": "produto-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo um novo aplicativo de finanças. Qual é a primeira coisa que você deve fazer antes de começar a programar?",
      "alternativas": {
        "a": "Definir as funcionalidades que você quer incluir no app.",
        "b": "Identificar qual problema o app vai resolver para os usuários.",
        "c": "Escolher a tecnologia que será usada para o desenvolvimento.",
        "d": "Fazer um design detalhado das telas do aplicativo."
      },
      "correta": "b",
      "explicacao": "Identificar o problema que o aplicativo vai resolver é crucial para garantir que ele atenda a uma necessidade real dos usuários.",
      "fonte": "fundamentos.mentalidade"
    },
    {
      "id": "produto-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você precisa priorizar tarefas para o desenvolvimento de um produto digital. O que deve ser sua principal consideração?",
      "alternativas": {
        "a": "O que é mais fácil de implementar tecnicamente.",
        "b": "O que gera mais receita imediata para o negócio.",
        "c": "O que resolve as principais dores dos usuários.",
        "d": "O que foi solicitado pela maioria dos clientes."
      },
      "correta": "c",
      "explicacao": "Priorizar o que resolve as dores dos usuários garante que o produto atenda às suas necessidades e gere valor.",
      "fonte": "fundamentos.pm"
    },
    {
      "id": "produto-ini-03",
      "nivel": "iniciante",
      "pergunta": "Ao desenvolver um produto digital, o que é fundamental para garantir que ele evolua com o tempo?",
      "alternativas": {
        "a": "Manter um cronograma rígido de entregas.",
        "b": "Receber feedback contínuo dos usuários.",
        "c": "Adicionar novas funcionalidades a cada versão.",
        "d": "Focar apenas na tecnologia mais avançada."
      },
      "correta": "b",
      "explicacao": "Receber feedback contínuo dos usuários é essencial para entender se o produto está atendendo às suas necessidades e como ele pode ser melhorado.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "produto-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você é um Product Manager e recebeu feedback negativo sobre uma funcionalidade. Qual deve ser sua abordagem?",
      "alternativas": {
        "a": "Defender a funcionalidade, pois foi uma decisão bem pensada.",
        "b": "Ignorar o feedback, pois a funcionalidade já foi implementada.",
        "c": "Investigar o problema e entender a dor do usuário.",
        "d": "Modificar a funcionalidade sem consultar os usuários."
      },
      "correta": "c",
      "explicacao": "Investigar o problema e entender a dor do usuário é crucial para fazer ajustes que realmente atendam às necessidades deles.",
      "fonte": "fundamentos.pm"
    },
    {
      "id": "produto-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você está em uma reunião de equipe e alguém sugere uma nova funcionalidade. O que você deve perguntar primeiro?",
      "alternativas": {
        "a": "Qual é o custo de desenvolvimento dessa funcionalidade?",
        "b": "Que problema essa funcionalidade resolve e para quem?",
        "c": "Quando podemos começar a trabalhar nisso?",
        "d": "Como essa funcionalidade se compara com a concorrência?"
      },
      "correta": "b",
      "explicacao": "Perguntar que problema a funcionalidade resolve e para quem é essencial para garantir que a equipe esteja focada nas necessidades dos usuários.",
      "fonte": "fundamentos.mentalidade"
    },
    {
      "id": "produto-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você notou que sua equipe está focando em entregar muitas funcionalidades. O que você deve fazer?",
      "alternativas": {
        "a": "Reforçar a importância de entregar mais funcionalidades.",
        "b": "Questionar se essas funcionalidades realmente resolvem problemas dos usuários.",
        "c": "Aumentar a equipe para entregar mais rápido.",
        "d": "Implementar um sistema de recompensas por funcionalidades entregues."
      },
      "correta": "b",
      "explicacao": "Questionar se as funcionalidades realmente resolvem problemas dos usuários ajuda a evitar a armadilha da 'feature factory'.",
      "fonte": "fundamentos.mentalidade"
    },
    {
      "id": "produto-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo um produto digital e precisa equilibrar três forças. Quais são essas forças?",
      "alternativas": {
        "a": "O que o time deseja, o que os investidores querem e o que a tecnologia permite.",
        "b": "O que o negócio precisa, o que o usuário quer e o que a tecnologia permite.",
        "c": "O que a concorrência faz, o que o time gosta e o que os usuários pedem.",
        "d": "O que é mais fácil de implementar, o que gera mais lucro e o que os usuários desejam."
      },
      "correta": "b",
      "explicacao": "As três forças que precisam ser equilibradas são o que o negócio precisa, o que o usuário quer e o que a tecnologia permite.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "produto-ini-08",
      "nivel": "iniciante",
      "pergunta": "Como um Product Manager deve influenciar sua equipe, já que não possui autoridade hierárquica sobre eles?",
      "alternativas": {
        "a": "Impondo suas decisões e exigindo que sejam seguidas.",
        "b": "Usando dados, clareza de visão e bons argumentos.",
        "c": "Fazendo reuniões frequentes para discutir as tarefas.",
        "d": "Delegando tarefas de acordo com as habilidades de cada um."
      },
      "correta": "b",
      "explicacao": "Um PM deve influenciar sua equipe através de dados, clareza de visão e bons argumentos, construindo confiança e alinhamento.",
      "fonte": "fundamentos.pm"
    },
    {
      "id": "produto-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você está em uma reunião e alguém sugere uma nova ideia de produto. O que você deve fazer primeiro antes de começar a desenvolver?",
      "alternativas": {
        "a": "Começar a codificar a ideia imediatamente",
        "b": "Entender se o problema é real e vale a pena resolver",
        "c": "Fazer uma pesquisa de mercado abrangente",
        "d": "Criar um protótipo e apresentar para o time"
      },
      "correta": "b",
      "explicacao": "É fundamental entender se o problema realmente existe e se vale a pena resolvê-lo antes de investir tempo em desenvolvimento.",
      "fonte": "discovery.oque"
    },
    {
      "id": "produto-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você quer validar uma ideia de produto, mas não tem muito tempo ou recursos. Qual é a melhor abordagem para começar?",
      "alternativas": {
        "a": "Construir um MVP completo e lançar no mercado",
        "b": "Realizar entrevistas com usuários para entender suas necessidades",
        "c": "Fazer uma pesquisa de opinião com um grande público",
        "d": "Criar um site complexo para apresentar a ideia"
      },
      "correta": "b",
      "explicacao": "Realizar entrevistas com usuários é uma forma eficaz e de baixo custo para entender as necessidades e validar ideias.",
      "fonte": "discovery.pesquisa"
    },
    {
      "id": "produto-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo uma solução e decide criar um MVP. O que você deve focar para garantir que ele seja eficaz?",
      "alternativas": {
        "a": "Incluir o máximo de funcionalidades possível",
        "b": "Resolver bem um problema específico",
        "c": "Fazer um design visualmente atraente",
        "d": "Testar várias ideias ao mesmo tempo"
      },
      "correta": "b",
      "explicacao": "Um MVP deve focar em resolver bem um problema específico, não em incluir várias funcionalidades que podem comprometer sua eficácia.",
      "fonte": "discovery.validar"
    },
    {
      "id": "produto-ini-12",
      "nivel": "iniciante",
      "pergunta": "Durante uma entrevista com usuários, você percebe que eles não estão respondendo de forma clara. O que você deve evitar fazer?",
      "alternativas": {
        "a": "Fazer perguntas abertas sobre experiências passadas",
        "b": "Induzir a resposta que você gostaria de ouvir",
        "c": "Pedir exemplos de situações reais que viveram",
        "d": "Escutar atentamente e fazer anotações"
      },
      "correta": "b",
      "explicacao": "Induzir a resposta que você quer ouvir compromete a qualidade da pesquisa e pode levar a conclusões erradas.",
      "fonte": "discovery.pesquisa"
    },
    {
      "id": "produto-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você tem uma ideia de produto e quer testar sua viabilidade. Qual é a menor ação que você poderia realizar para aprender se a ideia funciona?",
      "alternativas": {
        "a": "Desenvolver um protótipo completo",
        "b": "Criar uma página simples que descreve a solução",
        "c": "Fazer uma campanha de marketing para atrair usuários",
        "d": "Lançar o produto em uma versão beta"
      },
      "correta": "b",
      "explicacao": "Criar uma página simples que descreve a solução permite medir o interesse sem grandes investimentos, ajudando a validar a ideia.",
      "fonte": "discovery.validar"
    },
    {
      "id": "produto-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você está em uma fase de discovery e precisa entender melhor o comportamento dos usuários. Qual abordagem é mais eficaz?",
      "alternativas": {
        "a": "Realizar entrevistas focadas em opiniões futuras",
        "b": "Observar como os usuários interagem com produtos similares",
        "c": "Fazer uma pesquisa de satisfação com clientes atuais",
        "d": "Enviar questionários online para um grande público"
      },
      "correta": "b",
      "explicacao": "Observar como os usuários interagem com produtos similares fornece insights valiosos sobre comportamentos reais, ao invés de opiniões hipotéticas.",
      "fonte": "discovery.pesquisa"
    },
    {
      "id": "produto-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você está testando uma hipótese sobre um novo recurso. Qual é a forma mais eficaz de validar essa hipótese antes de investir em desenvolvimento?",
      "alternativas": {
        "a": "Construir o recurso e lançá-lo",
        "b": "Realizar um teste A/B com usuários reais",
        "c": "Fazer uma apresentação para stakeholders",
        "d": "Criar um protótipo clicável e observar a reação"
      },
      "correta": "d",
      "explicacao": "Criar um protótipo clicável permite observar a reação dos usuários e coletar feedback sem grandes investimentos.",
      "fonte": "discovery.validar"
    },
    {
      "id": "produto-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está em um time que adota Scrum e precisa decidir o que incluir no próximo sprint. Qual é a melhor prática a seguir?",
      "alternativas": {
        "a": "Definir as tarefas com base no que o time acha que pode completar sem consultar o Product Owner.",
        "b": "Priorizar as tarefas em conjunto com o Product Owner, garantindo que o backlog reflita as necessidades do negócio.",
        "c": "Escolher as tarefas que estão mais fáceis de serem feitas para garantir entregas rápidas.",
        "d": "Selecionar as tarefas que o time mais gosta de fazer, independentemente da prioridade do cliente."
      },
      "correta": "b",
      "explicacao": "A prática recomendada é envolver o Product Owner na priorização para garantir que o trabalho atenda às necessidades do negócio e do usuário.",
      "fonte": "agil.scrum"
    },
    {
      "id": "produto-int-02",
      "nivel": "intermediario",
      "pergunta": "Você está revisando o quadro Kanban do seu time e percebe que há muitas tarefas na coluna 'em andamento'. O que você deve fazer?",
      "alternativas": {
        "a": "Adicionar mais tarefas na coluna 'em andamento' para garantir que todos estejam ocupados.",
        "b": "Revisar e aplicar limites de trabalho em andamento para evitar sobrecarga e aumentar a produtividade.",
        "c": "Mover as tarefas mais fáceis para a coluna 'concluído' para melhorar a aparência do quadro.",
        "d": "Discutir com o time sobre a possibilidade de trabalhar em mais tarefas ao mesmo tempo."
      },
      "correta": "b",
      "explicacao": "Aplicar limites de trabalho em andamento é crucial para evitar gargalos e melhorar a eficiência do fluxo de trabalho.",
      "fonte": "agil.kanban"
    },
    {
      "id": "produto-int-03",
      "nivel": "intermediario",
      "pergunta": "Você está participando de uma retrospectiva de sprint e percebe que o time não está discutindo como melhorar. O que você deve fazer?",
      "alternativas": {
        "a": "Focar apenas nas entregas do sprint, pois isso é o mais importante.",
        "b": "Incentivar a discussão sobre o que pode ser melhorado e como o time pode se adaptar.",
        "c": "Sugerir que a retrospectiva seja mais curta para não tomar muito tempo do time.",
        "d": "Evitar trazer problemas à tona para não criar conflitos entre os membros do time."
      },
      "correta": "b",
      "explicacao": "Incentivar a discussão sobre melhorias é essencial para que o time evolua e se torne mais eficiente em sprints futuros.",
      "fonte": "agil.scrum"
    },
    {
      "id": "produto-int-04",
      "nivel": "intermediario",
      "pergunta": "Você precisa implementar um novo recurso rapidamente, mas o time está sobrecarregado. Qual método seria mais adequado para essa situação?",
      "alternativas": {
        "a": "Utilizar Scrum e planejar um sprint de duas semanas para organizar o trabalho.",
        "b": "Optar por Kanban para permitir um fluxo contínuo e adaptar-se à demanda conforme as tarefas forem concluídas.",
        "c": "Dividir o trabalho em múltiplos sprints para acelerar a entrega do recurso.",
        "d": "Aumentar o número de membros do time para concluir as tarefas mais rapidamente."
      },
      "correta": "b",
      "explicacao": "O Kanban permite um fluxo contínuo e flexível, ideal para situações onde a demanda é imprevisível e rápida.",
      "fonte": "agil.kanban"
    },
    {
      "id": "produto-int-05",
      "nivel": "intermediario",
      "pergunta": "Você está em um time que se diz ágil, mas percebe que eles seguem todos os rituais do Scrum sem questionar. O que isso pode indicar?",
      "alternativas": {
        "a": "O time está seguindo boas práticas e se adaptando conforme necessário.",
        "b": "O time pode estar se tornando burocrático e perdendo o verdadeiro espírito ágil.",
        "c": "O time está bem organizado e isso é um sinal de eficiência.",
        "d": "O time está focado em entregar valor rapidamente, o que é positivo."
      },
      "correta": "b",
      "explicacao": "Seguir rituais sem adaptação pode indicar que o time não está realmente praticando a filosofia ágil, mas sim se tornando burocrático.",
      "fonte": "agil.scrum"
    },
    {
      "id": "produto-int-06",
      "nivel": "intermediario",
      "pergunta": "Você está analisando o desempenho do seu time e percebe que muitas tarefas estão paradas no quadro Kanban. O que você deve investigar?",
      "alternativas": {
        "a": "Se o time está se distraindo com tarefas não relacionadas ao projeto.",
        "b": "Quais são os gargalos que estão impedindo o fluxo de trabalho e como podem ser resolvidos.",
        "c": "Se as tarefas estão bem definidas e se o time entende o que precisa ser feito.",
        "d": "Se o número de tarefas na coluna 'concluído' é suficiente para mostrar progresso."
      },
      "correta": "b",
      "explicacao": "Investigar gargalos é essencial para entender onde o fluxo está sendo interrompido e como melhorar a eficiência do time.",
      "fonte": "agil.kanban"
    },
    {
      "id": "produto-int-07",
      "nivel": "intermediario",
      "pergunta": "Você está criando uma história de usuário para um novo recurso de aplicativo. Qual parte é mais importante e frequentemente esquecida?",
      "alternativas": {
        "a": "Quem é o usuário que vai utilizar o recurso.",
        "b": "O que o recurso deve fazer em termos técnicos.",
        "c": "O objetivo que o usuário quer alcançar com o recurso.",
        "d": "Como o recurso será implementado pelo time."
      },
      "correta": "c",
      "explicacao": "O objetivo que o usuário quer alcançar é crucial para entender a necessidade real e pode revelar soluções melhores.",
      "fonte": "backlog.historias"
    },
    {
      "id": "produto-int-08",
      "nivel": "intermediario",
      "pergunta": "Você precisa priorizar itens no backlog. Qual abordagem ajuda a decidir o que fazer primeiro, considerando o valor e o esforço?",
      "alternativas": {
        "a": "Escolher o item que o chefe pediu primeiro.",
        "b": "Priorizar itens que são mais fáceis de implementar.",
        "c": "Comparar cada item pelo valor que entrega contra o esforço que custa.",
        "d": "Focar apenas nas ideias que geram menos discussão."
      },
      "correta": "c",
      "explicacao": "Comparar o valor e o esforço ajuda a priorizar itens de alto valor e baixo esforço, otimizando o backlog.",
      "fonte": "backlog.priorizacao"
    },
    {
      "id": "produto-int-09",
      "nivel": "intermediario",
      "pergunta": "Ao elaborar um roadmap, qual é um erro comum que deve ser evitado?",
      "alternativas": {
        "a": "Organizar o roadmap por objetivos a resolver.",
        "b": "Tratar o roadmap como uma promessa de datas exatas.",
        "c": "Incluir feedback dos stakeholders no roadmap.",
        "d": "Manter o roadmap flexível para mudanças futuras."
      },
      "correta": "b",
      "explicacao": "Tratar o roadmap como uma promessa de datas pode levar a frustrações, pois produtos são cheios de incertezas.",
      "fonte": "backlog.roadmap"
    },
    {
      "id": "produto-int-10",
      "nivel": "intermediario",
      "pergunta": "Você está revisando uma história de usuário e percebe que falta um detalhe importante. O que você deve fazer?",
      "alternativas": {
        "a": "Adicionar a solução técnica que você acha melhor.",
        "b": "Discutir com o time para entender melhor a necessidade do usuário.",
        "c": "Ignorar e seguir em frente, pois a história já está boa.",
        "d": "Definir critérios de aceitação sem consultar o time."
      },
      "correta": "b",
      "explicacao": "Discutir com o time ajuda a esclarecer a necessidade e a melhorar a história de usuário.",
      "fonte": "backlog.historias"
    },
    {
      "id": "produto-int-11",
      "nivel": "intermediario",
      "pergunta": "Ao priorizar o backlog, como você deve lidar com ideias que parecem boas, mas que não são urgentes?",
      "alternativas": {
        "a": "Implementar imediatamente para não perder a ideia.",
        "b": "Deixar para depois e focar apenas no que é urgente.",
        "c": "Justificar a decisão de não priorizar com critérios claros.",
        "d": "Priorizar todas as ideias boas para não deixar nada de fora."
      },
      "correta": "c",
      "explicacao": "Justificar a decisão com critérios claros ajuda a manter o foco no que realmente gera valor.",
      "fonte": "backlog.priorizacao"
    },
    {
      "id": "produto-int-12",
      "nivel": "intermediario",
      "pergunta": "Você está escrevendo um PRD e precisa descrever o que não será incluído na versão atual. Qual abordagem é a mais adequada?",
      "alternativas": {
        "a": "Incluir uma lista detalhada de todas as funcionalidades que não serão implementadas.",
        "b": "Dizer que não haverá funcionalidades adicionais, sem especificar quais.",
        "c": "Especificar claramente que 'não vamos fazer X nesta versão' para evitar expectativas erradas.",
        "d": "Afirmar que o escopo está aberto e pode mudar a qualquer momento."
      },
      "correta": "c",
      "explicacao": "Especificar o que não será feito ajuda a alinhar as expectativas e manter o foco na entrega atual.",
      "fonte": "especificacao.prd"
    },
    {
      "id": "produto-int-13",
      "nivel": "intermediario",
      "pergunta": "Você está alinhando stakeholders sobre uma nova funcionalidade. Qual é a melhor maneira de comunicar a decisão?",
      "alternativas": {
        "a": "Falar sobre os detalhes técnicos da implementação para todos os stakeholders.",
        "b": "Explicar a decisão de forma que cada grupo entenda seus impactos e benefícios específicos.",
        "c": "Enviar um e-mail genérico com a decisão sem personalizar para cada público.",
        "d": "Focar apenas nos resultados financeiros da nova funcionalidade."
      },
      "correta": "b",
      "explicacao": "Adaptar a comunicação para cada público garante que todos entendam a decisão e seus impactos relevantes.",
      "fonte": "especificacao.stakeholders"
    },
    {
      "id": "produto-int-14",
      "nivel": "intermediario",
      "pergunta": "Durante uma reunião, um stakeholder apresenta uma solução específica para um problema. Qual deve ser sua abordagem como PM?",
      "alternativas": {
        "a": "Aceitar a solução imediatamente para não desagradar o stakeholder.",
        "b": "Investigar o problema por trás do pedido e discutir alternativas.",
        "c": "Rejeitar a solução sem discutir, pois você já tem um plano.",
        "d": "Agradecer a sugestão e seguir com seu plano original sem mudanças."
      },
      "correta": "b",
      "explicacao": "Investigar o problema permite encontrar soluções mais adequadas e efetivas, além de construir confiança com os stakeholders.",
      "fonte": "especificacao.stakeholders"
    },
    {
      "id": "produto-int-15",
      "nivel": "intermediario",
      "pergunta": "Você percebe que um PRD está sendo ignorado pela equipe. O que você deve fazer para melhorar essa situação?",
      "alternativas": {
        "a": "Reescrever o PRD com mais detalhes técnicos para torná-lo mais interessante.",
        "b": "Realizar uma reunião para discutir o PRD e esclarecer dúvidas com a equipe.",
        "c": "Aumentar a frequência de envio do PRD por e-mail para todos.",
        "d": "Deixar o PRD como está, pois ele foi feito corretamente."
      },
      "correta": "b",
      "explicacao": "Discutir o PRD em uma reunião ajuda a esclarecer dúvidas e promove um entendimento compartilhado, essencial para a sua eficácia.",
      "fonte": "especificacao.prd"
    },
    {
      "id": "produto-av-01",
      "nivel": "avancado",
      "pergunta": "Você está analisando dados de uso de um aplicativo e percebe que o total de cadastros está crescendo. O que você deve fazer para entender melhor o valor real que esse número representa?",
      "alternativas": {
        "a": "Investigar se os novos usuários estão realmente utilizando o aplicativo.",
        "b": "Focar apenas no aumento do número de cadastros, pois isso é um bom sinal.",
        "c": "Comparar o número de cadastros com o de desinstalações para ver a diferença.",
        "d": "Aumentar o investimento em marketing para atrair ainda mais cadastros."
      },
      "correta": "a",
      "explicacao": "Investigar se os novos usuários estão realmente utilizando o aplicativo é fundamental para entender o valor real, já que o total de cadastros pode ser uma métrica de vaidade.",
      "fonte": "metricas.porque"
    },
    {
      "id": "produto-av-02",
      "nivel": "avancado",
      "pergunta": "Você precisa escolher uma métrica estrela-guia para seu produto. Qual das opções abaixo melhor representa o valor que seu produto entrega aos usuários?",
      "alternativas": {
        "a": "O número total de acessos ao site.",
        "b": "A frequência com que os usuários retornam para realizar uma ação central.",
        "c": "O total de cliques em anúncios exibidos.",
        "d": "A quantidade de novos usuários cadastrados por dia."
      },
      "correta": "b",
      "explicacao": "A frequência com que os usuários retornam para realizar uma ação central é uma métrica que captura melhor o valor entregue, ao contrário de métricas que apenas medem atividade.",
      "fonte": "metricas.northstar"
    },
    {
      "id": "produto-av-03",
      "nivel": "avancado",
      "pergunta": "Ao analisar um funil de vendas, você percebe que muitos usuários desistem na etapa de pagamento. Qual deve ser seu próximo passo?",
      "alternativas": {
        "a": "Aumentar o número de visitantes para compensar as desistências.",
        "b": "Investigar as razões pelas quais os usuários estão desistindo nessa etapa.",
        "c": "Reduzir o preço do produto para aumentar a conversão.",
        "d": "Adicionar mais opções de pagamento para tentar reter os usuários."
      },
      "correta": "b",
      "explicacao": "Investigar as razões pelas quais os usuários estão desistindo na etapa de pagamento é crucial para entender e melhorar a experiência do usuário.",
      "fonte": "metricas.funil"
    },
    {
      "id": "produto-av-04",
      "nivel": "avancado",
      "pergunta": "Você está conduzindo um teste A/B para avaliar a eficácia de uma nova funcionalidade. O que é essencial fazer antes de iniciar o teste?",
      "alternativas": {
        "a": "Definir claramente qual métrica será analisada durante o teste.",
        "b": "Escolher o grupo de controle com base nos usuários mais ativos.",
        "c": "Realizar o teste apenas por um dia para obter resultados rápidos.",
        "d": "Promover a nova funcionalidade para todos os usuários antes do teste."
      },
      "correta": "a",
      "explicacao": "Definir claramente qual métrica será analisada é essencial para garantir que o teste forneça resultados significativos e confiáveis.",
      "fonte": "metricas.experimentos"
    },
    {
      "id": "produto-av-05",
      "nivel": "avancado",
      "pergunta": "Você notou que a retenção de usuários do seu aplicativo está baixa. Qual abordagem você deve adotar para melhorar essa situação?",
      "alternativas": {
        "a": "Investir em campanhas de marketing para atrair novos usuários.",
        "b": "Analisar feedbacks qualitativos dos usuários para entender as razões da baixa retenção.",
        "c": "Aumentar a frequência de notificações para manter os usuários engajados.",
        "d": "Reduzir o número de funcionalidades do aplicativo para simplificá-lo."
      },
      "correta": "b",
      "explicacao": "Analisar feedbacks qualitativos é fundamental para entender as razões da baixa retenção e, assim, implementar melhorias efetivas.",
      "fonte": "metricas.funil"
    },
    {
      "id": "produto-av-06",
      "nivel": "avancado",
      "pergunta": "Você está revisando as métricas de desempenho do seu produto e percebe que uma métrica de vaidade está sendo priorizada. O que você deve fazer?",
      "alternativas": {
        "a": "Continuar monitorando a métrica, pois ela está em alta.",
        "b": "Substituir essa métrica por uma que realmente reflita o valor entregue aos usuários.",
        "c": "Apresentar a métrica para a diretoria como um sucesso.",
        "d": "Comparar essa métrica com outras de vaidade para justificar sua importância."
      },
      "correta": "b",
      "explicacao": "Substituir a métrica de vaidade por uma que realmente reflita o valor entregue é essencial para tomar decisões informadas e eficazes.",
      "fonte": "metricas.porque"
    },
    {
      "id": "produto-av-07",
      "nivel": "avancado",
      "pergunta": "Durante uma análise de funil, você observa que a taxa de conversão é alta, mas a retenção é baixa. O que isso indica sobre o seu produto?",
      "alternativas": {
        "a": "Os usuários estão satisfeitos com a experiência inicial, mas não encontram valor a longo prazo.",
        "b": "O produto é muito popular, mas não gera receita suficiente.",
        "c": "Os usuários estão apenas testando o produto e não têm intenção de voltar.",
        "d": "A comunicação de marketing está atraindo o público errado."
      },
      "correta": "a",
      "explicacao": "Uma alta taxa de conversão combinada com baixa retenção indica que os usuários podem estar satisfeitos inicialmente, mas não estão encontrando valor suficiente para retornar.",
      "fonte": "metricas.funil"
    },
    {
      "id": "produto-av-08",
      "nivel": "avancado",
      "pergunta": "Você está planejando um experimento para testar uma nova interface do usuário. Qual é um dos principais cuidados que você deve ter ao conduzir esse teste?",
      "alternativas": {
        "a": "Garantir que o grupo de controle e o grupo de teste tenham tamanhos iguais.",
        "b": "Definir um volume suficiente de usuários para que os resultados sejam significativos.",
        "c": "Realizar o teste por um período curto para obter resultados rápidos.",
        "d": "Permitir que os usuários escolham qual versão eles preferem."
      },
      "correta": "b",
      "explicacao": "Definir um volume suficiente de usuários é crucial para garantir que as diferenças observadas não sejam apenas fruto do acaso.",
      "fonte": "metricas.experimentos"
    },
    {
      "id": "produto-av-09",
      "nivel": "avancado",
      "pergunta": "Você percebe que a métrica de churn (cancelamento) está aumentando. Qual ação você deve priorizar para entender melhor essa situação?",
      "alternativas": {
        "a": "Aumentar o número de novos usuários para compensar as perdas.",
        "b": "Realizar entrevistas com usuários que cancelaram para entender suas razões.",
        "c": "Reduzir o preço do serviço para tentar reter os usuários.",
        "d": "Melhorar a comunicação sobre funcionalidades do produto."
      },
      "correta": "b",
      "explicacao": "Realizar entrevistas com usuários que cancelaram é fundamental para entender as razões do churn e implementar melhorias efetivas.",
      "fonte": "metricas.northstar"
    },
    {
      "id": "produto-av-10",
      "nivel": "avancado",
      "pergunta": "Você lançou uma nova funcionalidade e começou a receber feedback dos usuários. Qual é o próximo passo mais adequado?",
      "alternativas": {
        "a": "Desconsiderar o feedback e seguir com o plano original.",
        "b": "Acompanhar as métricas definidas e ajustar a funcionalidade conforme o feedback.",
        "c": "Lançar uma nova funcionalidade imediatamente para corrigir os problemas.",
        "d": "Parar o desenvolvimento de novas funcionalidades até resolver todos os problemas reportados."
      },
      "correta": "b",
      "explicacao": "Acompanhar as métricas e ajustar a funcionalidade com base no feedback é essencial para o ciclo de aprendizado contínuo em produto.",
      "fonte": "carreira.lancamento"
    },
    {
      "id": "produto-av-11",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo uma estratégia de métricas de retenção para um aplicativo de receitas. Qual deve ser sua North Star?",
      "alternativas": {
        "a": "Número total de downloads do aplicativo.",
        "b": "Número de receitas visualizadas por usuário por semana.",
        "c": "Taxa de usuários que retornam ao aplicativo após a primeira semana.",
        "d": "Número de receitas cadastradas no aplicativo."
      },
      "correta": "c",
      "explicacao": "A North Star deve refletir o valor central do aplicativo, que é a retenção de usuários, e não apenas métricas de vaidade como downloads ou receitas cadastradas.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "produto-av-12",
      "nivel": "avancado",
      "pergunta": "Você está analisando um produto que usa uma métrica de vaidade. O que você deve fazer para torná-la acionável?",
      "alternativas": {
        "a": "Manter a métrica, pois ela mostra popularidade.",
        "b": "Definir uma métrica que esteja diretamente ligada ao comportamento do usuário e ao valor entregue.",
        "c": "Adicionar mais métricas de vaidade para ter uma visão mais ampla.",
        "d": "Focar apenas nas métricas que são mais fáceis de medir."
      },
      "correta": "b",
      "explicacao": "Transformar uma métrica de vaidade em uma acionável envolve conectar a métrica ao comportamento do usuário e ao valor que o produto entrega.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "produto-av-13",
      "nivel": "avancado",
      "pergunta": "Você está começando sua carreira em produto e não tem experiência formal. Qual é a melhor forma de demonstrar sua capacidade?",
      "alternativas": {
        "a": "Fazer cursos online e obter certificados.",
        "b": "Criar um portfólio com análises críticas de produtos que você usa e propostas de melhorias.",
        "c": "Focar apenas em vagas que exigem experiência prévia.",
        "d": "Aguardar uma oportunidade de emprego para ganhar experiência."
      },
      "correta": "b",
      "explicacao": "Criar um portfólio com análises e propostas de melhoria demonstra sua capacidade de raciocínio em produto, essencial para entrevistas na área.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "produto-av-14",
      "nivel": "avancado",
      "pergunta": "Você vem de uma área de suporte e deseja transitar para produto. Como você pode usar sua experiência atual?",
      "alternativas": {
        "a": "Ignorar sua experiência anterior e focar apenas em novas habilidades.",
        "b": "Enquadrar sua experiência em termos de problemas que você resolveu e decisões que tomou relacionadas ao usuário.",
        "c": "Apenas listar suas tarefas de suporte em seu currículo.",
        "d": "Focar em aprender a codar, pois isso é o que os PMs fazem."
      },
      "correta": "b",
      "explicacao": "Enquadrar sua experiência em termos de problemas e decisões relacionadas ao usuário ajuda a mostrar como sua bagagem é valiosa para a área de produto.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "produto-av-15",
      "nivel": "avancado",
      "pergunta": "Você está em um time que planeja lançar uma nova funcionalidade. Qual abordagem ajuda a reduzir riscos?",
      "alternativas": {
        "a": "Lançar a funcionalidade para todos os usuários de uma vez.",
        "b": "Liberar a funcionalidade gradualmente para um grupo pequeno e monitorar o desempenho.",
        "c": "Aguardar até que todas as funcionalidades estejam prontas antes de lançar.",
        "d": "Lançar a funcionalidade sem monitorar as métricas."
      },
      "correta": "b",
      "explicacao": "Liberar a funcionalidade gradualmente permite monitorar o desempenho e contornar problemas antes que afetem todos os usuários.",
      "fonte": "carreira.lancamento"
    }
  ]
};

export default pool;
