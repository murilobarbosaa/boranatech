// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool analise-sistemas). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "analise-sistemas",
  "questions": [
    {
      "id": "analise-sistemas-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você foi chamado para entender a necessidade de um cliente que deseja um sistema mais eficiente. O que você deve fazer primeiro?",
      "alternativas": {
        "a": "Levantar requisitos claros e específicos com o cliente.",
        "b": "Começar a programar uma solução baseada na sua experiência.",
        "c": "Definir um cronograma de entrega para o projeto.",
        "d": "Analisar o que a concorrência está fazendo."
      },
      "correta": "a",
      "explicacao": "Levantar requisitos claros e específicos é essencial para entender o que o cliente realmente precisa.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "analise-sistemas-ini-02",
      "nivel": "iniciante",
      "pergunta": "Durante uma reunião, um cliente diz que quer um sistema 'melhor'. Qual a sua abordagem?",
      "alternativas": {
        "a": "Perguntar quais funcionalidades ele considera 'melhores'.",
        "b": "Sugerir que ele faça uma pesquisa de mercado.",
        "c": "Começar a listar funcionalidades que você acha que seriam boas.",
        "d": "Dizer que isso não é uma informação útil."
      },
      "correta": "a",
      "explicacao": "Você deve perguntar quais funcionalidades ele considera 'melhores' para transformar essa necessidade vaga em requisitos claros.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "analise-sistemas-ini-03",
      "nivel": "iniciante",
      "pergunta": "Qual é o principal foco do analista de sistemas em um projeto?",
      "alternativas": {
        "a": "Definir a estratégia de negócios do produto.",
        "b": "Organizar o time e os prazos de entrega.",
        "c": "Transformar necessidades em requisitos detalhados.",
        "d": "Elaborar um plano de marketing para o produto."
      },
      "correta": "c",
      "explicacao": "O analista de sistemas concentra-se em transformar necessidades em requisitos detalhados que o time pode usar.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "analise-sistemas-ini-04",
      "nivel": "iniciante",
      "pergunta": "Se um colega confunde o papel do analista de sistemas com o do gerente de projetos, como você explicaria a diferença?",
      "alternativas": {
        "a": "O analista de sistemas foca em como entregar o projeto.",
        "b": "O gerente de projetos define o que será construído.",
        "c": "O analista de sistemas detalha o que precisa ser feito.",
        "d": "O gerente de projetos elabora requisitos para o time."
      },
      "correta": "c",
      "explicacao": "O analista de sistemas detalha o que precisa ser feito, enquanto o gerente de projetos foca em como entregar o projeto.",
      "fonte": "fundamentos.ponte"
    },
    {
      "id": "analise-sistemas-ini-05",
      "nivel": "iniciante",
      "pergunta": "Em uma equipe pequena, como os papéis de analista de sistemas e analista de negócios costumam se comportar?",
      "alternativas": {
        "a": "Eles são sempre funções completamente distintas.",
        "b": "Um analista de sistemas pode acumular funções de analista de negócios.",
        "c": "O analista de negócios nunca se envolve na documentação.",
        "d": "Os papéis são sempre bem definidos e separados."
      },
      "correta": "b",
      "explicacao": "Em equipes pequenas, é comum que um analista de sistemas acumule funções de analista de negócios devido à sobreposição dos papéis.",
      "fonte": "fundamentos.ponte"
    },
    {
      "id": "analise-sistemas-ini-06",
      "nivel": "iniciante",
      "pergunta": "Qual habilidade é central para um analista de sistemas?",
      "alternativas": {
        "a": "Definir a visão do produto para o futuro.",
        "b": "Documentar e modelar requisitos com precisão.",
        "c": "Coordenar o time de desenvolvimento durante o projeto.",
        "d": "Elaborar estratégias de marketing para o produto."
      },
      "correta": "b",
      "explicacao": "A habilidade de documentar e modelar requisitos com precisão é o que diferencia um analista de sistemas dos demais papéis.",
      "fonte": "fundamentos.ponte"
    },
    {
      "id": "analise-sistemas-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você está escrevendo requisitos para um novo sistema de pedidos. Qual abordagem ajuda a garantir que as regras de negócio sejam claras e completas?",
      "alternativas": {
        "a": "Documentar regras sem considerar possíveis exceções.",
        "b": "Escrever requisitos sem pensar na lógica de como o software decide.",
        "c": "Antecipar casos como 'e se o campo estiver vazio?' ao escrever os requisitos.",
        "d": "Focar apenas nas funcionalidades desejadas, ignorando a lógica por trás."
      },
      "correta": "c",
      "explicacao": "Antecipar casos e pensar logicamente ajuda a escrever requisitos que fazem sentido técnico e que o desenvolvedor pode implementar sem confusões.",
      "fonte": "tecnica.logica"
    },
    {
      "id": "analise-sistemas-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você precisa entender como um sistema armazena dados sobre clientes. Qual comando SQL você usaria para listar todos os nomes dos clientes?",
      "alternativas": {
        "a": "SELECT * FROM clientes;",
        "b": "SELECT nome FROM clientes;",
        "c": "GET nome FROM clientes;",
        "d": "LIST nome FROM clientes;"
      },
      "correta": "b",
      "explicacao": "O comando correto para listar apenas os nomes dos clientes é o 'SELECT nome FROM clientes;', que é a forma adequada de consulta em SQL.",
      "fonte": "tecnica.sql"
    },
    {
      "id": "analise-sistemas-ini-09",
      "nivel": "iniciante",
      "pergunta": "Ao conversar com desenvolvedores sobre um sistema, qual habilidade é crucial para um analista de sistemas?",
      "alternativas": {
        "a": "Saber programar em várias linguagens.",
        "b": "Entender a lógica de programação e como o software toma decisões.",
        "c": "Focar apenas em design de interfaces.",
        "d": "Conhecer todos os detalhes técnicos do banco de dados."
      },
      "correta": "b",
      "explicacao": "Entender a lógica de programação permite que o analista escreva requisitos viáveis e compreenda as limitações do desenvolvimento.",
      "fonte": "tecnica.logica"
    },
    {
      "id": "analise-sistemas-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você quer saber quantos pedidos estão com status 'pendente'. Qual consulta SQL você deve usar?",
      "alternativas": {
        "a": "SELECT COUNT(*) FROM pedidos WHERE status = 'pendente';",
        "b": "SELECT * FROM pedidos WHERE status = 'pendente';",
        "c": "SELECT COUNT(status) FROM pedidos;",
        "d": "SELECT pedidos WHERE status = 'pendente';"
      },
      "correta": "a",
      "explicacao": "A consulta 'SELECT COUNT(*) FROM pedidos WHERE status = 'pendente';' conta corretamente o número de pedidos com status 'pendente'.",
      "fonte": "tecnica.sql"
    },
    {
      "id": "analise-sistemas-ini-11",
      "nivel": "iniciante",
      "pergunta": "Durante uma reunião, um desenvolvedor menciona que uma funcionalidade é inviável. O que um analista deve fazer para entender melhor essa situação?",
      "alternativas": {
        "a": "Ignorar e seguir com o projeto.",
        "b": "Perguntar quais aspectos técnicos tornam a funcionalidade inviável.",
        "c": "Sugerir uma solução sem entender o problema.",
        "d": "Apenas documentar a inviabilidade sem questionar."
      },
      "correta": "b",
      "explicacao": "Perguntar sobre os aspectos técnicos que tornam a funcionalidade inviável ajuda o analista a compreender as limitações e a colaborar na busca de soluções.",
      "fonte": "tecnica.logica"
    },
    {
      "id": "analise-sistemas-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você está validando se os dados de um novo sistema estão sendo gravados corretamente. Qual comando SQL é útil para essa tarefa?",
      "alternativas": {
        "a": "SELECT * FROM dados;",
        "b": "SELECT nome FROM dados WHERE gravado = 'sim';",
        "c": "SELECT COUNT(*) FROM dados;",
        "d": "SELECT nome, COUNT(*) FROM dados;"
      },
      "correta": "c",
      "explicacao": "O comando 'SELECT COUNT(*) FROM dados;' permite verificar quantos registros foram gravados, ajudando na validação dos dados.",
      "fonte": "tecnica.sql"
    },
    {
      "id": "analise-sistemas-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está entrevistando um usuário que pediu um botão de exportar. Para entender melhor, qual pergunta você deve fazer?",
      "alternativas": {
        "a": "Qual é a frequência com que você precisa exportar os dados?",
        "b": "Você pode me mostrar como você exporta os dados atualmente?",
        "c": "Você prefere um botão azul ou verde para o exportar?",
        "d": "Você acha que um botão de exportar é a melhor solução?"
      },
      "correta": "b",
      "explicacao": "Perguntar como o usuário realiza a tarefa atualmente ajuda a entender o problema real por trás do pedido, não apenas a solução que ele imagina.",
      "fonte": "requisitos.levantamento"
    },
    {
      "id": "analise-sistemas-int-02",
      "nivel": "intermediario",
      "pergunta": "Durante o levantamento de requisitos, um usuário menciona que precisa de um sistema que \"seja rápido\". O que você deve fazer?",
      "alternativas": {
        "a": "Anotar a solicitação e seguir em frente, pois é uma necessidade válida.",
        "b": "Perguntar qual é a definição de 'rápido' para ele e em quais situações isso se aplica.",
        "c": "Ignorar essa parte, pois requisitos de desempenho são secundários.",
        "d": "Sugerir que ele considere uma solução alternativa que não envolva velocidade."
      },
      "correta": "b",
      "explicacao": "É importante esclarecer o que 'rápido' significa para o usuário, pois requisitos vagos não são úteis e podem levar a mal-entendidos.",
      "fonte": "requisitos.levantamento"
    },
    {
      "id": "analise-sistemas-int-03",
      "nivel": "intermediario",
      "pergunta": "Você está documentando requisitos e precisa classificar um requisito que diz: \"O sistema deve permitir cadastrar um cliente\". Qual é a classificação correta desse requisito?",
      "alternativas": {
        "a": "Requisito não-funcional",
        "b": "Requisito funcional",
        "c": "Regra de negócio",
        "d": "Requisito de integração"
      },
      "correta": "b",
      "explicacao": "Esse requisito descreve uma funcionalidade específica que o sistema deve ter, caracterizando um requisito funcional.",
      "fonte": "requisitos.tipos"
    },
    {
      "id": "analise-sistemas-int-04",
      "nivel": "intermediario",
      "pergunta": "Um requisito diz que \"o sistema deve enviar um e-mail de confirmação após a compra\". Como você deve classificá-lo?",
      "alternativas": {
        "a": "Requisito funcional",
        "b": "Requisito não-funcional",
        "c": "Regra de negócio",
        "d": "Requisito de integração"
      },
      "correta": "a",
      "explicacao": "Esse requisito descreve uma funcionalidade específica que o sistema deve realizar, portanto é um requisito funcional.",
      "fonte": "requisitos.tipos"
    },
    {
      "id": "analise-sistemas-int-05",
      "nivel": "intermediario",
      "pergunta": "Você está especificando uma integração entre dois sistemas e precisa definir o que acontece quando uma chamada falha. O que deve ser incluído no contrato?",
      "alternativas": {
        "a": "Apenas o que acontece quando a chamada é bem-sucedida.",
        "b": "O que deve ser feito em caso de falha e quais dados são esperados.",
        "c": "Apenas os dados que serão enviados na chamada.",
        "d": "As consequências para o usuário em caso de falha."
      },
      "correta": "b",
      "explicacao": "Um bom contrato de integração deve incluir o que acontece em caso de falha, para evitar problemas futuros.",
      "fonte": "requisitos.integracoes"
    },
    {
      "id": "analise-sistemas-int-06",
      "nivel": "intermediario",
      "pergunta": "Ao documentar requisitos, você se depara com uma frase vaga: \"O sistema deve ser amigável\". O que você deve fazer?",
      "alternativas": {
        "a": "Reescrever a frase para torná-la mais específica e mensurável.",
        "b": "Aceitar a frase como está, pois é uma necessidade válida.",
        "c": "Adicionar exemplos de como o sistema poderia ser amigável.",
        "d": "Sugerir que o usuário forneça uma nova frase."
      },
      "correta": "a",
      "explicacao": "Reescrever a frase de forma específica e mensurável é essencial para garantir que o requisito seja claro e testável.",
      "fonte": "requisitos.documentacao"
    },
    {
      "id": "analise-sistemas-int-07",
      "nivel": "intermediario",
      "pergunta": "Você está escrevendo requisitos e percebe que um deles é ambíguo. O que você deve priorizar ao revisá-lo?",
      "alternativas": {
        "a": "Aumentar a complexidade para cobrir todos os aspectos.",
        "b": "Garantir que o requisito seja claro, específico e testável.",
        "c": "Focar apenas na funcionalidade principal.",
        "d": "Deixar o requisito aberto para interpretação."
      },
      "correta": "b",
      "explicacao": "Um requisito deve ser claro, específico e testável para evitar mal-entendidos e garantir que todos saibam o que construir.",
      "fonte": "requisitos.documentacao"
    },
    {
      "id": "analise-sistemas-int-08",
      "nivel": "intermediario",
      "pergunta": "Você está modelando um sistema e precisa representar as interações entre usuários e funcionalidades. Qual diagrama da UML você deve usar?",
      "alternativas": {
        "a": "Diagrama de classes, pois mostra as entidades do sistema",
        "b": "Diagrama de casos de uso, pois ilustra quem usa o sistema e suas ações",
        "c": "Diagrama de sequência, pois detalha a ordem das interações",
        "d": "Diagrama de atividades, pois representa o fluxo de trabalho do sistema"
      },
      "correta": "b",
      "explicacao": "O diagrama de casos de uso é o mais adequado para mostrar as interações entre usuários e as funcionalidades do sistema.",
      "fonte": "modelagem.uml"
    },
    {
      "id": "analise-sistemas-int-09",
      "nivel": "intermediario",
      "pergunta": "Ao mapear um processo de negócio, você percebe que as responsabilidades não estão claras. Qual recurso do BPMN pode ajudar a resolver isso?",
      "alternativas": {
        "a": "Usar eventos de início e fim para marcar etapas do processo",
        "b": "Adicionar raias (lanes) para dividir o processo por responsável",
        "c": "Criar atividades paralelas para otimizar o fluxo",
        "d": "Utilizar decisões para simplificar o processo"
      },
      "correta": "b",
      "explicacao": "As raias (lanes) ajudam a identificar claramente quem é responsável por cada etapa do processo, facilitando a visualização das responsabilidades.",
      "fonte": "modelagem.bpmn"
    },
    {
      "id": "analise-sistemas-int-10",
      "nivel": "intermediario",
      "pergunta": "Você está escrevendo um caso de uso detalhado e precisa incluir exceções. O que deve ser incluído para garantir um bom entendimento do fluxo alternativo?",
      "alternativas": {
        "a": "Apenas a descrição do fluxo principal, pois é o mais importante",
        "b": "Cenários de erro que podem ocorrer durante a execução do fluxo",
        "c": "Passos detalhados de como o ator deve proceder em cada exceção",
        "d": "Apenas a solução para cada exceção, sem detalhar o fluxo"
      },
      "correta": "c",
      "explicacao": "Incluir passos detalhados sobre como o ator deve proceder em cada exceção é essencial para garantir que todas as situações sejam compreendidas.",
      "fonte": "modelagem.uml"
    },
    {
      "id": "analise-sistemas-int-11",
      "nivel": "intermediario",
      "pergunta": "Você está projetando um novo sistema e quer entender como o processo atual funciona. Qual abordagem do BPMN você deve usar?",
      "alternativas": {
        "a": "Desenhar o processo 'to-be', para visualizar a melhoria",
        "b": "Mapear o processo 'as-is', para entender a situação atual",
        "c": "Criar um diagrama de casos de uso, para focar nas funcionalidades",
        "d": "Usar diagramas de sequência, para detalhar as interações"
      },
      "correta": "b",
      "explicacao": "Mapear o processo 'as-is' é fundamental para entender como o processo atual funciona antes de pensar em melhorias.",
      "fonte": "modelagem.bpmn"
    },
    {
      "id": "analise-sistemas-int-12",
      "nivel": "intermediario",
      "pergunta": "Você está ajudando a escrever uma história de usuário para um novo recurso de aplicativo. Qual formato você deve usar para garantir que a história capture a necessidade do usuário?",
      "alternativas": {
        "a": "Como [tipo de usuário], quero [fazer algo] para [alcançar um objetivo].",
        "b": "Como [tipo de usuário], [fazer algo] é importante para mim porque [alcançar um objetivo].",
        "c": "Como [tipo de usuário], eu gostaria que [fazer algo] para que eu possa [alcançar um objetivo].",
        "d": "Como [tipo de usuário], preciso [fazer algo] para [alcançar um objetivo] rapidamente."
      },
      "correta": "a",
      "explicacao": "A alternativa correta segue o formato clássico das histórias de usuário, que é essencial para a comunicação clara das necessidades do usuário.",
      "fonte": "agil.historias"
    },
    {
      "id": "analise-sistemas-int-13",
      "nivel": "intermediario",
      "pergunta": "Durante uma reunião de planejamento, você percebe que a equipe não está clara sobre os critérios de aceitação de uma história de usuário. O que você deve fazer para garantir que todos estejam alinhados?",
      "alternativas": {
        "a": "Definir os critérios de aceitação sozinho e enviar por e-mail para a equipe.",
        "b": "Discutir os critérios de aceitação com a equipe até que todos entendam e concordem.",
        "c": "Aguardar que o desenvolvedor proponha os critérios de aceitação durante a implementação.",
        "d": "Criar uma lista de critérios de aceitação sem consultar a equipe e apresentar na próxima reunião."
      },
      "correta": "b",
      "explicacao": "A alternativa correta envolve a discussão colaborativa dos critérios de aceitação, essencial para garantir que todos tenham a mesma compreensão do que é necessário.",
      "fonte": "agil.historias"
    },
    {
      "id": "analise-sistemas-int-14",
      "nivel": "intermediario",
      "pergunta": "Você está no final de um sprint e precisa validar se a funcionalidade construída atende aos critérios de aceitação. Qual deve ser sua abordagem?",
      "alternativas": {
        "a": "Testar a funcionalidade sozinho e aprová-la sem envolver o time.",
        "b": "Acompanhar os testes com a equipe e verificar se todos os critérios de aceitação foram atendidos.",
        "c": "Solicitar que o cliente teste a funcionalidade e forneça feedback diretamente.",
        "d": "Confiar que a equipe de desenvolvimento já validou a entrega e não fazer mais nada."
      },
      "correta": "b",
      "explicacao": "A alternativa correta enfatiza a importância da validação colaborativa, garantindo que a funcionalidade atenda aos critérios de aceitação estabelecidos.",
      "fonte": "agil.processo"
    },
    {
      "id": "analise-sistemas-int-15",
      "nivel": "intermediario",
      "pergunta": "Você percebe que há um conflito entre as expectativas de um stakeholder e o que a equipe de desenvolvimento está criando. O que você deve fazer para resolver essa situação?",
      "alternativas": {
        "a": "Ignorar o conflito e seguir com o que a equipe está desenvolvendo.",
        "b": "Reunir-se com os stakeholders e a equipe para discutir e alinhar as expectativas.",
        "c": "Decidir qual lado está certo e comunicar isso à equipe.",
        "d": "Focar apenas na comunicação com a equipe de desenvolvimento, pois eles são mais técnicos."
      },
      "correta": "b",
      "explicacao": "A alternativa correta envolve a mediação entre os stakeholders e a equipe, essencial para alinhar expectativas e resolver conflitos.",
      "fonte": "agil.processo"
    },
    {
      "id": "analise-sistemas-av-01",
      "nivel": "avancado",
      "pergunta": "Você está montando seu portfólio de análise de sistemas e decidiu documentar um aplicativo que usa. Ao escrever os requisitos funcionais, qual abordagem você deve evitar para não comprometer a clareza?",
      "alternativas": {
        "a": "Incluir requisitos vagos que não especificam claramente a funcionalidade.",
        "b": "Utilizar uma linguagem técnica que pode ser confusa para o leitor.",
        "c": "Listar requisitos sem priorização ou categorização.",
        "d": "Descrever requisitos de forma concisa, evitando jargões."
      },
      "correta": "c",
      "explicacao": "Listar requisitos sem priorização ou categorização pode levar a confusões sobre a importância e a relação entre eles.",
      "fonte": "carreira.portfolio"
    },
    {
      "id": "analise-sistemas-av-02",
      "nivel": "avancado",
      "pergunta": "Ao modelar um processo em BPMN para seu portfólio, qual erro você deve evitar para garantir que o diagrama seja compreensível?",
      "alternativas": {
        "a": "Usar símbolos BPMN de forma inconsistente ao longo do diagrama.",
        "b": "Incluir todos os detalhes do processo, mesmo os irrelevantes.",
        "c": "Utilizar cores diferentes para distinguir etapas do processo.",
        "d": "Manter o diagrama em uma única página para facilitar a visualização."
      },
      "correta": "a",
      "explicacao": "Usar símbolos BPMN de forma inconsistente pode causar confusão e dificultar a compreensão do fluxo do processo.",
      "fonte": "carreira.portfolio"
    },
    {
      "id": "analise-sistemas-av-03",
      "nivel": "avancado",
      "pergunta": "Você está escrevendo casos de uso para um sistema fictício. Qual prática recomendada deve seguir para garantir que os fluxos alternativos sejam claros e úteis?",
      "alternativas": {
        "a": "Incluir fluxos alternativos apenas se forem muito diferentes do fluxo principal.",
        "b": "Documentar todos os fluxos alternativos, mesmo os irrelevantes.",
        "c": "Definir claramente as condições que levam a cada fluxo alternativo.",
        "d": "Usar linguagem técnica complexa para descrever os fluxos alternativos."
      },
      "correta": "c",
      "explicacao": "Definir claramente as condições que levam a cada fluxo alternativo ajuda a entender como o sistema deve se comportar em diferentes cenários.",
      "fonte": "carreira.portfolio"
    },
    {
      "id": "analise-sistemas-av-04",
      "nivel": "avancado",
      "pergunta": "Você está finalizando um projeto de especificação de um sistema. Ao revisar seus requisitos não-funcionais, qual aspecto deve ser priorizado para garantir uma boa comunicação com o desenvolvedor?",
      "alternativas": {
        "a": "Listar requisitos não-funcionais de forma genérica, sem exemplos.",
        "b": "Incluir requisitos não-funcionais que não têm impacto no sistema.",
        "c": "Especificar claramente os critérios de desempenho e segurança esperados.",
        "d": "Utilizar termos técnicos sem explicação para os requisitos."
      },
      "correta": "c",
      "explicacao": "Especificar claramente os critérios de desempenho e segurança ajuda o desenvolvedor a entender as expectativas e a planejar adequadamente.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "analise-sistemas-av-05",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um protótipo navegável para um sistema. Qual abordagem você deve evitar para garantir que o protótipo seja útil para os stakeholders?",
      "alternativas": {
        "a": "Incluir apenas as funcionalidades principais, sem interações.",
        "b": "Criar um protótipo que não represente o fluxo real do usuário.",
        "c": "Focar na estética em detrimento da funcionalidade do protótipo.",
        "d": "Testar o protótipo com usuários para obter feedback."
      },
      "correta": "b",
      "explicacao": "Criar um protótipo que não represente o fluxo real do usuário pode levar a mal-entendidos sobre como o sistema funcionará na prática.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "analise-sistemas-av-06",
      "nivel": "avancado",
      "pergunta": "Ao levantar requisitos para um sistema, você percebe que um stakeholder não está claro sobre suas necessidades. Qual é a melhor abordagem para esclarecer essa situação?",
      "alternativas": {
        "a": "Ignorar a falta de clareza e seguir com os requisitos que você acha que são necessários.",
        "b": "Fazer perguntas abertas para explorar melhor as necessidades do stakeholder.",
        "c": "Propor soluções antes de entender completamente os requisitos.",
        "d": "Documentar o que foi dito, mesmo que não esteja claro."
      },
      "correta": "b",
      "explicacao": "Fazer perguntas abertas permite explorar melhor as necessidades do stakeholder e obter informações mais detalhadas.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "analise-sistemas-av-07",
      "nivel": "avancado",
      "pergunta": "Você está se preparando para entrar na área de análise de sistemas. Qual habilidade deve ser priorizada para se destacar em entrevistas e no trabalho?",
      "alternativas": {
        "a": "Aprofundar-se em linguagens de programação complexas.",
        "b": "Desenvolver a capacidade de fazer boas perguntas durante o levantamento de requisitos.",
        "c": "Focar apenas na documentação técnica e deixar a comunicação de lado.",
        "d": "Aprimorar conhecimentos em metodologias ágeis sem entender os fundamentos."
      },
      "correta": "b",
      "explicacao": "Desenvolver a capacidade de fazer boas perguntas é essencial para levantar requisitos de forma eficaz e entender as necessidades dos stakeholders.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "analise-sistemas-av-08",
      "nivel": "avancado",
      "pergunta": "Você está montando seu portfólio e precisa incluir exemplos de documentação. Qual tipo de documento deve ser evitado para não prejudicar sua apresentação?",
      "alternativas": {
        "a": "Documentos que não seguem uma estrutura clara e organizada.",
        "b": "Casos de uso que incluem fluxos alternativos bem definidos.",
        "c": "Requisitos funcionais que são específicos e mensuráveis.",
        "d": "Modelos de processos que utilizam BPMN corretamente."
      },
      "correta": "a",
      "explicacao": "Documentos que não seguem uma estrutura clara e organizada podem dar a impressão de falta de competência e clareza na comunicação.",
      "fonte": "carreira.portfolio"
    },
    {
      "id": "analise-sistemas-av-09",
      "nivel": "avancado",
      "pergunta": "Você está em uma entrevista para uma vaga de analista de sistemas. O entrevistador pergunta sobre sua experiência em comunicação. Qual resposta deve destacar sua habilidade de forma eficaz?",
      "alternativas": {
        "a": "Falar sobre suas experiências em programação e desenvolvimento de software.",
        "b": "Descrever como você já apresentou ideias complexas de forma clara para diferentes públicos.",
        "c": "Mencionar que você prefere trabalhar sozinho em vez de colaborar.",
        "d": "Dizer que a documentação não é uma parte importante do seu trabalho."
      },
      "correta": "b",
      "explicacao": "Descrever como você já apresentou ideias complexas de forma clara mostra sua habilidade de comunicação, que é fundamental na análise de sistemas.",
      "fonte": "carreira.entrar"
    }
  ]
};

export default pool;
