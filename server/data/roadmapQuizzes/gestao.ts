// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool gestao). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "gestao",
  "questions": [
    {
      "id": "gestao-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está coordenando um projeto de tecnologia e percebe que a equipe está enfrentando obstáculos. Qual é a sua melhor ação?",
      "alternativas": {
        "a": "Mandar a equipe acelerar o trabalho para compensar o atraso.",
        "b": "Remover os obstáculos e facilitar a comunicação entre os membros da equipe.",
        "c": "Aumentar o número de reuniões para discutir os problemas.",
        "d": "Delegar a responsabilidade para um membro da equipe resolver os problemas."
      },
      "correta": "b",
      "explicacao": "A alternativa correta é remover os obstáculos e facilitar a comunicação, pois isso ajuda a equipe a trabalhar de forma mais eficiente e colaborativa.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "gestao-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você precisa entregar um projeto de migração de sistema em um prazo apertado. O que deve ser sua prioridade?",
      "alternativas": {
        "a": "Aumentar o escopo do projeto para incluir mais funcionalidades.",
        "b": "Garantir que o time tenha os recursos necessários para cumprir o prazo.",
        "c": "Reduzir a comunicação com os stakeholders para evitar distrações.",
        "d": "Estabelecer um cronograma rígido e não permitir mudanças."
      },
      "correta": "b",
      "explicacao": "A prioridade deve ser garantir que o time tenha os recursos necessários, pois isso é fundamental para cumprir o prazo sem comprometer a qualidade.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "gestao-ini-03",
      "nivel": "iniciante",
      "pergunta": "Durante uma reunião, um stakeholder pede mais funcionalidades para o projeto, mas o prazo é curto. Como você deve responder?",
      "alternativas": {
        "a": "Prometer que tudo será entregue a tempo, sem ajustes.",
        "b": "Negociar o escopo e discutir o que pode ser ajustado para atender ao pedido.",
        "c": "Ignorar o pedido e seguir com o que já foi planejado.",
        "d": "Aumentar a equipe sem considerar as implicações de custo."
      },
      "correta": "b",
      "explicacao": "A resposta correta é negociar o escopo, pois isso permite ajustar as expectativas e manter a viabilidade do projeto.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "gestao-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você está gerenciando um projeto que envolve a criação de um novo aplicativo. Qual é a principal diferença entre um projeto e um produto?",
      "alternativas": {
        "a": "Um projeto tem um objetivo definido e um fim, enquanto um produto é contínuo e evolui.",
        "b": "Um projeto nunca pode ser alterado, enquanto um produto pode ser modificado a qualquer momento.",
        "c": "Um projeto é sempre mais caro que um produto.",
        "d": "Um produto deve ser entregue em um prazo fixo, enquanto um projeto não tem prazo."
      },
      "correta": "a",
      "explicacao": "A principal diferença é que um projeto tem um objetivo definido e um fim, enquanto um produto é contínuo e evolui ao longo do tempo.",
      "fonte": "fundamentos.projetoproduto"
    },
    {
      "id": "gestao-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você está planejando a entrega de um novo sistema. O que é mais importante considerar ao definir o escopo do projeto?",
      "alternativas": {
        "a": "A quantidade de recursos disponíveis para o projeto.",
        "b": "As expectativas dos stakeholders e o valor que o sistema trará.",
        "c": "O tempo que a equipe levará para concluir o projeto.",
        "d": "As funcionalidades que a equipe gostaria de implementar."
      },
      "correta": "b",
      "explicacao": "É importante considerar as expectativas dos stakeholders e o valor que o sistema trará, pois isso ajuda a alinhar o escopo às necessidades do negócio.",
      "fonte": "fundamentos.projetoproduto"
    },
    {
      "id": "gestao-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você está em um projeto e percebe que o escopo está aumentando sem ajustes no tempo ou custo. O que você deve fazer?",
      "alternativas": {
        "a": "Aceitar as mudanças e seguir em frente.",
        "b": "Alertar a equipe sobre a necessidade de ajustar o tempo ou custo.",
        "c": "Negar as solicitações de mudança para manter o projeto no cronograma.",
        "d": "Aumentar a equipe para lidar com o novo escopo."
      },
      "correta": "b",
      "explicacao": "Alertar a equipe sobre a necessidade de ajustar o tempo ou custo é essencial para manter o equilíbrio do projeto e evitar problemas futuros.",
      "fonte": "fundamentos.restricoes"
    },
    {
      "id": "gestao-ini-07",
      "nivel": "iniciante",
      "pergunta": "Em um projeto, você precisa equilibrar escopo, tempo e custo. Qual é a abordagem correta ao lidar com mudanças no escopo?",
      "alternativas": {
        "a": "Aumentar o tempo e o custo para acomodar o novo escopo.",
        "b": "Reduzir o escopo sem discutir com a equipe.",
        "c": "Ignorar as mudanças e manter o cronograma original.",
        "d": "Prometer que tudo será entregue sem ajustes."
      },
      "correta": "a",
      "explicacao": "A abordagem correta é aumentar o tempo e o custo para acomodar o novo escopo, garantindo que a qualidade do projeto não seja comprometida.",
      "fonte": "fundamentos.restricoes"
    },
    {
      "id": "gestao-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você está gerenciando um projeto e um stakeholder pede uma entrega mais rápida. O que você deve considerar?",
      "alternativas": {
        "a": "Aumentar o escopo para incluir mais funcionalidades.",
        "b": "Reduzir a qualidade para atender ao prazo.",
        "c": "Negociar o prazo e discutir o que pode ser ajustado no escopo.",
        "d": "Prometer que a entrega será feita sem ajustes."
      },
      "correta": "c",
      "explicacao": "Negociar o prazo e discutir o que pode ser ajustado no escopo é a melhor abordagem para equilibrar as expectativas e a viabilidade do projeto.",
      "fonte": "fundamentos.restricoes"
    },
    {
      "id": "gestao-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você está atuando como Scrum Master e percebe que a equipe está enfrentando dificuldades. Qual deve ser sua principal ação?",
      "alternativas": {
        "a": "Aumentar a frequência das reuniões para discutir os problemas.",
        "b": "Remover impedimentos e facilitar a comunicação entre os membros da equipe.",
        "c": "Delegar a responsabilidade para um membro da equipe resolver os problemas.",
        "d": "Mandar a equipe acelerar o trabalho para compensar os atrasos."
      },
      "correta": "b",
      "explicacao": "A principal ação deve ser remover impedimentos e facilitar a comunicação, ajudando a equipe a trabalhar de forma mais eficiente.",
      "fonte": "fundamentos.papeis"
    },
    {
      "id": "gestao-ini-10",
      "nivel": "iniciante",
      "pergunta": "Qual é a função principal de um PMO em um projeto de tecnologia?",
      "alternativas": {
        "a": "Conduzir as cerimônias do Scrum.",
        "b": "Padronizar e acompanhar os projetos da empresa.",
        "c": "Gerenciar diretamente todos os recursos do projeto.",
        "d": "Definir o escopo e as funcionalidades do produto."
      },
      "correta": "b",
      "explicacao": "A função principal de um PMO é padronizar e acompanhar os projetos da empresa, garantindo que as melhores práticas sejam seguidas.",
      "fonte": "fundamentos.papeis"
    },
    {
      "id": "gestao-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você está gerenciando um projeto de software e percebe que os requisitos mudaram durante o desenvolvimento. O que você deve priorizar para se adaptar a essa mudança?",
      "alternativas": {
        "a": "Seguir o plano original e concluir o projeto como estava definido",
        "b": "Reavaliar as prioridades e ajustar o trabalho para entregar valor rapidamente",
        "c": "Documentar todas as mudanças antes de continuar o projeto",
        "d": "Aumentar a equipe para tentar cumprir o cronograma inicial"
      },
      "correta": "b",
      "explicacao": "Reavaliar as prioridades e ajustar o trabalho permite que você entregue valor rapidamente, alinhando-se ao espírito ágil de adaptação.",
      "fonte": "agil.manifesto"
    },
    {
      "id": "gestao-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você está em uma reunião de planejamento de um projeto. O cliente expressa novas necessidades que não estavam previstas. O que você deve fazer?",
      "alternativas": {
        "a": "Ignorar as novas necessidades e seguir com o que foi previamente acordado",
        "b": "Incluir as novas necessidades no planejamento e ajustar o cronograma",
        "c": "Registrar as novas necessidades para discutir em uma próxima reunião",
        "d": "Reavaliar o planejamento e adaptar o projeto para incluir as novas necessidades"
      },
      "correta": "d",
      "explicacao": "Reavaliar o planejamento e adaptar o projeto é a abordagem ágil, que valoriza a resposta a mudanças em vez de seguir um plano fixo.",
      "fonte": "agil.manifesto"
    },
    {
      "id": "gestao-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você está gerenciando um projeto que usa o modelo cascata, mas percebe que os requisitos não estão claros. Qual é a melhor abordagem a seguir?",
      "alternativas": {
        "a": "Continuar com o modelo cascata, pois é o que foi decidido",
        "b": "Mudar para uma abordagem ágil, realizando entregas em ciclos curtos",
        "c": "Aumentar o tempo de planejamento para tentar esclarecer os requisitos",
        "d": "Dividir o projeto em fases menores, mas ainda seguindo o cascata"
      },
      "correta": "b",
      "explicacao": "Mudar para uma abordagem ágil permite que você trabalhe com ciclos curtos e se adapte às mudanças, o que é essencial quando os requisitos não estão claros.",
      "fonte": "agil.cascata"
    },
    {
      "id": "gestao-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você está em um time ágil e percebe que a equipe está focando muito em processos e rituais. O que você deve fazer para garantir que o time mantenha o foco no valor?",
      "alternativas": {
        "a": "Reforçar a importância dos rituais para a equipe",
        "b": "Discutir com a equipe sobre a importância de entregar valor e se adaptar",
        "c": "Implementar mais rituais para aumentar a disciplina",
        "d": "Aumentar a carga de trabalho para que a equipe se concentre mais"
      },
      "correta": "b",
      "explicacao": "Discutir sobre a importância de entregar valor e se adaptar ajuda a manter o foco no espírito ágil, que vai além dos rituais.",
      "fonte": "agil.manifesto"
    },
    {
      "id": "gestao-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você está avaliando se deve usar o modelo ágil ou cascata para um novo projeto. O que deve ser considerado para tomar a decisão correta?",
      "alternativas": {
        "a": "A popularidade do modelo ágil entre as empresas",
        "b": "Se o projeto possui requisitos claros e estáveis ou se mudam com frequência",
        "c": "A quantidade de documentação que você precisa produzir",
        "d": "A experiência da equipe com metodologias ágeis"
      },
      "correta": "b",
      "explicacao": "Considerar se os requisitos são claros e estáveis ou se mudam com frequência é essencial para escolher a abordagem mais adequada.",
      "fonte": "agil.cascata"
    },
    {
      "id": "gestao-int-01",
      "nivel": "intermediario",
      "pergunta": "Durante uma sprint, o time precisa decidir o que será entregue. Qual evento é responsável por essa definição?",
      "alternativas": {
        "a": "Daily",
        "b": "Retrospectiva",
        "c": "Planejamento",
        "d": "Review"
      },
      "correta": "c",
      "explicacao": "O evento de planejamento é onde o time define o que será entregue na sprint, alinhando as prioridades e expectativas.",
      "fonte": "scrum.eventos"
    },
    {
      "id": "gestao-int-02",
      "nivel": "intermediario",
      "pergunta": "Você é o Scrum Master e percebe que o time está enfrentando um impedimento que afeta a produtividade. O que você deve fazer?",
      "alternativas": {
        "a": "Ignorar o problema e esperar que o time resolva",
        "b": "Remover o impedimento rapidamente",
        "c": "Cobrar do time que se adapte à situação",
        "d": "Aumentar a carga de trabalho para compensar"
      },
      "correta": "b",
      "explicacao": "Remover impedimentos é uma das principais responsabilidades do Scrum Master, garantindo que o time possa trabalhar de forma eficiente.",
      "fonte": "scrum.facilitacao"
    },
    {
      "id": "gestao-int-03",
      "nivel": "intermediario",
      "pergunta": "O Product Owner deve priorizar itens no backlog. Qual é a principal responsabilidade dele nesse processo?",
      "alternativas": {
        "a": "Definir como o trabalho será realizado",
        "b": "Decidir o que deve ser construído e em que ordem",
        "c": "Acompanhar o desempenho da equipe",
        "d": "Gerenciar o tempo das reuniões"
      },
      "correta": "b",
      "explicacao": "O Product Owner é responsável por definir o que será construído e a ordem de prioridade, representando a voz do negócio e do cliente.",
      "fonte": "scrum.papeis"
    },
    {
      "id": "gestao-int-04",
      "nivel": "intermediario",
      "pergunta": "Em uma retrospectiva, o time discute como melhorar. Qual é o objetivo principal dessa cerimônia?",
      "alternativas": {
        "a": "Planejar o próximo sprint",
        "b": "Mostrar o que foi entregue",
        "c": "Identificar ações concretas para melhorar o processo",
        "d": "Avaliar o desempenho individual dos membros"
      },
      "correta": "c",
      "explicacao": "O objetivo da retrospectiva é discutir como o time pode trabalhar melhor, identificando ações concretas para a melhoria contínua.",
      "fonte": "scrum.eventos"
    },
    {
      "id": "gestao-int-05",
      "nivel": "intermediario",
      "pergunta": "Você está facilitando uma daily e percebe que ela está se tornando longa e improdutiva. O que você deve fazer?",
      "alternativas": {
        "a": "Permitir que os participantes falem livremente",
        "b": "Estabelecer um tempo fixo e manter o foco",
        "c": "Interromper a reunião quando achar necessário",
        "d": "Cobrar que todos falem sobre suas tarefas"
      },
      "correta": "b",
      "explicacao": "Estabelecer um tempo fixo e manter o foco é essencial para garantir que a daily seja produtiva e respeite o tempo de todos.",
      "fonte": "scrum.eventos"
    },
    {
      "id": "gestao-int-06",
      "nivel": "intermediario",
      "pergunta": "Qual das seguintes afirmações descreve melhor o papel do Scrum Master?",
      "alternativas": {
        "a": "Ele é o chefe do time e toma todas as decisões",
        "b": "Ele facilita o trabalho do time e remove impedimentos",
        "c": "Ele é responsável por definir o que deve ser feito",
        "d": "Ele controla o desempenho de cada membro do time"
      },
      "correta": "b",
      "explicacao": "O Scrum Master atua como facilitador, ajudando o time a remover impedimentos e a trabalhar de forma mais eficiente, sem exercer controle hierárquico.",
      "fonte": "scrum.facilitacao"
    },
    {
      "id": "gestao-int-07",
      "nivel": "intermediario",
      "pergunta": "Você está gerenciando um projeto e percebe que muitas tarefas estão paradas na coluna 'em andamento' do quadro Kanban. O que você deve fazer para resolver essa situação?",
      "alternativas": {
        "a": "Aumentar o limite de trabalho em andamento para permitir mais tarefas simultâneas.",
        "b": "Reduzir o limite de trabalho em andamento para forçar a equipe a concluir mais tarefas antes de iniciar novas.",
        "c": "Adicionar mais tarefas à coluna 'em andamento' para que a equipe tenha mais opções de trabalho.",
        "d": "Remover tarefas da coluna 'concluído' para dar mais espaço para novas tarefas."
      },
      "correta": "b",
      "explicacao": "Reduzir o limite de trabalho em andamento ajuda a focar na conclusão das tarefas, evitando o acúmulo e melhorando o fluxo.",
      "fonte": "kanban.fluxo"
    },
    {
      "id": "gestao-int-08",
      "nivel": "intermediario",
      "pergunta": "Você está analisando o desempenho do seu time usando Kanban e percebe que o lead time das tarefas está aumentando. Qual a melhor abordagem para entender e melhorar essa situação?",
      "alternativas": {
        "a": "Comparar o lead time do seu time com o de outros times para identificar quem é mais eficiente.",
        "b": "Investigar as etapas do fluxo onde as tarefas estão se acumulando e discutir melhorias com o time.",
        "c": "Aumentar a quantidade de tarefas em andamento para acelerar o processo de entrega.",
        "d": "Definir um prazo fixo para a conclusão de todas as tarefas, independentemente do fluxo."
      },
      "correta": "b",
      "explicacao": "Investigar onde as tarefas se acumulam permite identificar gargalos e melhorar o fluxo de trabalho com a colaboração da equipe.",
      "fonte": "kanban.metricas"
    },
    {
      "id": "gestao-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está implementando Kanban em um time que lida com demandas imprevisíveis. Qual é a prática recomendada para garantir um fluxo de trabalho saudável?",
      "alternativas": {
        "a": "Estabelecer um limite de trabalho em andamento para evitar sobrecarga e focar na conclusão.",
        "b": "Permitir que cada membro do time escolha quantas tarefas iniciar ao mesmo tempo.",
        "c": "Definir um cronograma fixo para a entrega de todas as tarefas, independentemente da demanda.",
        "d": "Remover as colunas do quadro Kanban para simplificar o processo."
      },
      "correta": "a",
      "explicacao": "Estabelecer um limite de trabalho em andamento é fundamental para evitar sobrecarga e garantir que o time consiga concluir as tarefas de forma eficiente.",
      "fonte": "kanban.fluxo"
    },
    {
      "id": "gestao-int-10",
      "nivel": "intermediario",
      "pergunta": "Você está organizando o backlog de um projeto e precisa priorizar itens. Qual abordagem é mais eficaz para decidir o que fazer primeiro?",
      "alternativas": {
        "a": "Escolher os itens que geram mais valor com menos esforço.",
        "b": "Selecionar os itens que foram mais discutidos nas reuniões.",
        "c": "Priorizar os itens que têm mais comentários no sistema de gestão.",
        "d": "Focar nos itens que o Product Owner mais gosta."
      },
      "correta": "a",
      "explicacao": "A abordagem correta é priorizar itens que geram mais valor com menos esforço, garantindo que o time trabalhe no que realmente importa.",
      "fonte": "planejamento.backlog"
    },
    {
      "id": "gestao-int-11",
      "nivel": "intermediario",
      "pergunta": "Você precisa estimar o tempo que um novo recurso levará para ser desenvolvido. Qual é a prática recomendada para realizar essa estimativa?",
      "alternativas": {
        "a": "Definir um prazo fixo baseado em experiências anteriores.",
        "b": "Usar a técnica de planning poker com a equipe para obter uma estimativa coletiva.",
        "c": "Impor uma estimativa baseada em um cronograma anterior sem consultar o time.",
        "d": "Apostar em uma estimativa otimista para agradar a liderança."
      },
      "correta": "b",
      "explicacao": "A prática recomendada é usar a técnica de planning poker, pois envolve o time na estimativa, tornando-a mais realista e precisa.",
      "fonte": "planejamento.estimativas"
    },
    {
      "id": "gestao-int-12",
      "nivel": "intermediario",
      "pergunta": "Você identificou um risco de alta probabilidade e alto impacto em seu projeto. Qual é a melhor ação a ser tomada em resposta a esse risco?",
      "alternativas": {
        "a": "Aceitar o risco e seguir em frente sem alterações.",
        "b": "Criar um plano B para mitigar o impacto caso o risco se concretize.",
        "c": "Reduzir a chance do risco acontecer, alterando o planejamento.",
        "d": "Monitorar o risco e esperar que não ocorra."
      },
      "correta": "c",
      "explicacao": "A melhor ação é reduzir a chance do risco acontecer, alterando o planejamento, já que é um risco de alta probabilidade e alto impacto.",
      "fonte": "planejamento.riscos"
    },
    {
      "id": "gestao-int-13",
      "nivel": "intermediario",
      "pergunta": "Você precisa documentar um novo projeto. Qual parte do documento é fundamental para evitar expectativas erradas sobre o que não será feito?",
      "alternativas": {
        "a": "A seção que descreve o objetivo e o contexto do projeto.",
        "b": "A seção que lista os riscos conhecidos e suas respostas.",
        "c": "A seção que detalha o escopo, incluindo o que não está incluído.",
        "d": "A seção que apresenta os prazos e entregas do projeto."
      },
      "correta": "c",
      "explicacao": "A seção que detalha o escopo, incluindo o que não está incluído, é fundamental para evitar expectativas erradas e proteger o foco da equipe.",
      "fonte": "planejamento.documento"
    },
    {
      "id": "gestao-int-14",
      "nivel": "intermediario",
      "pergunta": "Você está revisando o backlog e percebe que um item foi mal compreendido pelo time. Como você deve proceder para evitar mal-entendidos futuros?",
      "alternativas": {
        "a": "Remover o item do backlog e substituí-lo por outro.",
        "b": "Reescrever a história de usuário com critérios de aceitação claros.",
        "c": "Deixar o item como está, pois o time deve se adaptar.",
        "d": "Discutir o item apenas em reuniões futuras."
      },
      "correta": "b",
      "explicacao": "Reescrever a história de usuário com critérios de aceitação claros ajuda a evitar mal-entendidos futuros e garante que todos estejam alinhados.",
      "fonte": "planejamento.backlog"
    },
    {
      "id": "gestao-int-15",
      "nivel": "intermediario",
      "pergunta": "Durante a gestão de riscos, você percebe que um risco de impacto baixo e probabilidade alta foi ignorado. Qual é a melhor forma de lidar com esse risco?",
      "alternativas": {
        "a": "Tratar o risco imediatamente, já que a probabilidade é alta.",
        "b": "Deixar o risco sem ação, pois o impacto é baixo.",
        "c": "Monitorar o risco e aceitar que ele pode ocorrer.",
        "d": "Criar um plano para evitar que o risco se concretize."
      },
      "correta": "c",
      "explicacao": "A melhor forma de lidar com um risco de impacto baixo e probabilidade alta é monitorá-lo e aceitar que ele pode ocorrer, sem gastar energia excessiva.",
      "fonte": "planejamento.riscos"
    },
    {
      "id": "gestao-av-01",
      "nivel": "avancado",
      "pergunta": "Você está gerenciando um projeto e um stakeholder solicita uma atualização. Como você deve adaptar sua comunicação para atender a esse pedido?",
      "alternativas": {
        "a": "Fornecer uma visão detalhada de cada tarefa em andamento.",
        "b": "Apresentar um resumo claro do que avançou, o que está planejado e o que está travando.",
        "c": "Focar apenas nos pontos positivos e evitar mencionar riscos.",
        "d": "Enviar um relatório longo com todos os detalhes técnicos do projeto."
      },
      "correta": "b",
      "explicacao": "Apresentar um resumo claro do que avançou, o que está planejado e o que está travando é a melhor forma de manter stakeholders informados de maneira eficiente e honesta.",
      "fonte": "pessoas.comunicacao"
    },
    {
      "id": "gestao-av-02",
      "nivel": "avancado",
      "pergunta": "Durante uma reunião, um membro da equipe menciona um problema que pode atrasar a entrega do projeto. Qual é a melhor abordagem para lidar com essa situação?",
      "alternativas": {
        "a": "Ignorar o problema e focar nas partes que estão indo bem.",
        "b": "Comunicar o problema imediatamente e discutir possíveis soluções com a equipe.",
        "c": "Minimizar a preocupação e garantir que tudo ficará bem no final.",
        "d": "Esperar para ver se o problema se resolve sozinho antes de agir."
      },
      "correta": "b",
      "explicacao": "Comunicar o problema imediatamente e discutir soluções é essencial para evitar surpresas e manter a confiança da equipe e dos stakeholders.",
      "fonte": "pessoas.status"
    },
    {
      "id": "gestao-av-03",
      "nivel": "avancado",
      "pergunta": "Você percebe que um membro da equipe está enfrentando um impedimento que ele não consegue resolver. Qual deve ser sua primeira ação como gestor?",
      "alternativas": {
        "a": "Dizer ao membro da equipe que ele deve resolver isso sozinho.",
        "b": "Remover o impedimento pessoalmente sem consultar a equipe.",
        "c": "Investigar o que está bloqueando e ajudar a encontrar uma solução.",
        "d": "Aguardar até que a equipe traga o problema para você."
      },
      "correta": "c",
      "explicacao": "Investigar o que está bloqueando e ajudar a encontrar uma solução é uma parte crucial da liderança servidora e ajuda a manter o foco da equipe.",
      "fonte": "pessoas.lideranca"
    },
    {
      "id": "gestao-av-04",
      "nivel": "avancado",
      "pergunta": "Um cliente expressa insatisfação com a falta de informações sobre o projeto. O que você deve priorizar para melhorar essa situação?",
      "alternativas": {
        "a": "Enviar um relatório detalhado com todas as informações técnicas.",
        "b": "Estabelecer uma comunicação regular e clara sobre o andamento do projeto.",
        "c": "Prometer que tudo será resolvido sem fornecer detalhes.",
        "d": "Evitar contato até que a situação melhore."
      },
      "correta": "b",
      "explicacao": "Estabelecer uma comunicação regular e clara ajuda a construir confiança e a manter o cliente informado sobre o andamento do projeto.",
      "fonte": "pessoas.comunicacao"
    },
    {
      "id": "gestao-av-05",
      "nivel": "avancado",
      "pergunta": "Você está preparando um relatório de status e percebe que há um atraso significativo. O que você deve incluir no relatório para ser transparente?",
      "alternativas": {
        "a": "Esconder o atraso e focar nos pontos positivos.",
        "b": "Mencionar o atraso e explicar as razões, além de como pretende resolver.",
        "c": "Dizer que tudo está dentro do cronograma para evitar preocupações.",
        "d": "Focar apenas no que está sendo feito e ignorar o atraso."
      },
      "correta": "b",
      "explicacao": "Mencionar o atraso e explicar as razões, além de como pretende resolver, é fundamental para manter a transparência e a confiança.",
      "fonte": "pessoas.status"
    },
    {
      "id": "gestao-av-06",
      "nivel": "avancado",
      "pergunta": "Um novo membro da equipe traz uma solução que não se alinha com as necessidades do projeto. Como você deve abordar essa situação?",
      "alternativas": {
        "a": "Rejeitar a solução imediatamente e explicar que não é viável.",
        "b": "Investigar as necessidades por trás da proposta e discutir alternativas.",
        "c": "Aceitar a solução para não desmotivá-lo.",
        "d": "Ignorar a proposta e seguir com o que já estava planejado."
      },
      "correta": "b",
      "explicacao": "Investigar as necessidades por trás da proposta e discutir alternativas ajuda a transformar exigências em conversas produtivas.",
      "fonte": "pessoas.comunicacao"
    },
    {
      "id": "gestao-av-07",
      "nivel": "avancado",
      "pergunta": "Você está liderando um time que enfrenta um bloqueio devido a uma dependência externa. Qual é a sua melhor ação?",
      "alternativas": {
        "a": "Esperar que a dependência se resolva sozinha.",
        "b": "Remover o impedimento buscando a resolução com a parte externa.",
        "c": "Informar a equipe que eles devem lidar com isso por conta própria.",
        "d": "Aumentar a pressão sobre a equipe para que encontrem uma solução."
      },
      "correta": "b",
      "explicacao": "Remover o impedimento buscando a resolução com a parte externa é essencial para manter o foco da equipe e garantir o progresso do projeto.",
      "fonte": "pessoas.lideranca"
    },
    {
      "id": "gestao-av-08",
      "nivel": "avancado",
      "pergunta": "Você está prestes a enviar um relatório de status e percebe que alguns dados estão desatualizados. O que você deve fazer?",
      "alternativas": {
        "a": "Enviar o relatório assim mesmo, pois a maioria das informações está correta.",
        "b": "Atualizar os dados antes de enviar o relatório, mesmo que isso atrase um pouco.",
        "c": "Informar que os dados estão desatualizados e enviar o relatório assim mesmo.",
        "d": "Ignorar a atualização e focar apenas nas partes que estão corretas."
      },
      "correta": "b",
      "explicacao": "Atualizar os dados antes de enviar o relatório é crucial para manter a honestidade e a clareza na comunicação com os stakeholders.",
      "fonte": "pessoas.status"
    },
    {
      "id": "gestao-av-09",
      "nivel": "avancado",
      "pergunta": "Você está gerenciando um projeto ágil e percebe que a equipe está desmotivada com a ferramenta de gestão utilizada. O que você deve priorizar para melhorar a situação?",
      "alternativas": {
        "a": "Configurar a ferramenta para que ela tenha mais funcionalidades.",
        "b": "Realizar uma reunião para entender as necessidades da equipe e ajustar o processo.",
        "c": "Trocar a ferramenta por uma mais complexa e robusta.",
        "d": "Focar em criar quadros visuais mais bonitos para engajar a equipe."
      },
      "correta": "b",
      "explicacao": "Realizar uma reunião para entender as necessidades da equipe permite ajustar o processo e melhorar a motivação, enquanto apenas mudar a ferramenta ou focar em estética não resolve o problema real.",
      "fonte": "carreira.ferramentas"
    },
    {
      "id": "gestao-av-10",
      "nivel": "avancado",
      "pergunta": "Você está se preparando para uma entrevista para uma vaga de Scrum Master e precisa demonstrar seu conhecimento sobre Scrum. Qual abordagem é a mais eficaz?",
      "alternativas": {
        "a": "Decorar o Scrum Guide e recitar seus pontos principais.",
        "b": "Estudar o Scrum Guide e preparar exemplos práticos de sua aplicação.",
        "c": "Focar apenas nas certificações que possui, sem entender o conteúdo.",
        "d": "Falar sobre as ferramentas de gestão que você usou sem relacionar com Scrum."
      },
      "correta": "b",
      "explicacao": "Preparar exemplos práticos de aplicação do Scrum demonstra compreensão real do método, enquanto apenas decorar ou falar de ferramentas sem conexão não é efetivo.",
      "fonte": "carreira.certificacoes"
    },
    {
      "id": "gestao-av-11",
      "nivel": "avancado",
      "pergunta": "Você está organizando um projeto voluntário e quer aplicar Scrum. Qual é a primeira coisa que você deve fazer para garantir que o projeto seja bem-sucedido?",
      "alternativas": {
        "a": "Definir um backlog inicial com todas as tarefas que você imagina serem necessárias.",
        "b": "Reunir a equipe e explicar o que é Scrum, buscando o entendimento de todos.",
        "c": "Escolher a ferramenta de gestão que você mais gosta para acompanhar o projeto.",
        "d": "Estabelecer um cronograma rígido para garantir que tudo seja cumprido."
      },
      "correta": "b",
      "explicacao": "Reunir a equipe e explicar o que é Scrum garante que todos estejam alinhados e compreendam o processo, o que é fundamental para o sucesso do projeto.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "gestao-av-12",
      "nivel": "avancado",
      "pergunta": "Você está em uma equipe que utiliza Jira e percebe que as tarefas estão sendo mal priorizadas. O que você deve fazer para melhorar a situação?",
      "alternativas": {
        "a": "Configurar o Jira para que ele priorize automaticamente as tarefas.",
        "b": "Realizar uma reunião com a equipe para discutir critérios de priorização.",
        "c": "Aumentar a quantidade de tarefas no backlog para dar mais opções.",
        "d": "Focar em melhorar a estética dos quadros no Jira."
      },
      "correta": "b",
      "explicacao": "Discutir critérios de priorização com a equipe ajuda a alinhar expectativas e melhorar a organização das tarefas, enquanto as outras alternativas não abordam a raiz do problema.",
      "fonte": "carreira.ferramentas"
    },
    {
      "id": "gestao-av-13",
      "nivel": "avancado",
      "pergunta": "Você está buscando uma certificação para validar seu conhecimento em gestão de projetos ágeis. Qual estratégia deve ser sua prioridade?",
      "alternativas": {
        "a": "Fazer um curso caro que promete aprovação na certificação.",
        "b": "Estudar o Scrum Guide e praticar o que aprendeu em projetos reais.",
        "c": "Focar em várias certificações ao mesmo tempo, para ter mais opções.",
        "d": "Apenas ler materiais de estudo sem aplicar o conhecimento."
      },
      "correta": "b",
      "explicacao": "Estudar o Scrum Guide e aplicar o conhecimento em projetos reais garante uma compreensão mais profunda e prática, que é mais valiosa do que apenas decorar ou acumular certificações.",
      "fonte": "carreira.certificacoes"
    },
    {
      "id": "gestao-av-14",
      "nivel": "avancado",
      "pergunta": "Você está ajudando um colega a se preparar para uma vaga de analista de PMO. Qual conselho você deve dar para se destacar na entrevista?",
      "alternativas": {
        "a": "Falar apenas sobre suas certificações e cursos.",
        "b": "Preparar exemplos concretos de experiências passadas que demonstrem habilidades de gestão.",
        "c": "Focar em mencionar todas as ferramentas que conhece, independentemente da relevância.",
        "d": "Dizer que você é um especialista em todas as áreas de gestão."
      },
      "correta": "b",
      "explicacao": "Preparar exemplos concretos de experiências passadas demonstra habilidades práticas e a capacidade de aplicar conhecimento, o que é mais relevante do que apenas listar certificações ou ferramentas.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "gestao-av-15",
      "nivel": "avancado",
      "pergunta": "Você está em uma equipe que utiliza o Trello para gerenciar tarefas. O que você deve fazer para garantir que todos os membros da equipe estejam alinhados sobre as prioridades?",
      "alternativas": {
        "a": "Criar um quadro com todas as tarefas, mas sem definir prioridades claras.",
        "b": "Realizar reuniões regulares para discutir as prioridades e atualizações das tarefas.",
        "c": "Permitir que cada membro da equipe decida suas próprias prioridades sem coordenação.",
        "d": "Focar em adicionar mais tarefas ao quadro para aumentar a produtividade."
      },
      "correta": "b",
      "explicacao": "Realizar reuniões regulares para discutir prioridades garante que todos estejam alinhados e cientes das expectativas, enquanto as outras opções não promovem a comunicação efetiva.",
      "fonte": "carreira.ferramentas"
    }
  ]
};

export default pool;
