// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool uxui). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "uxui",
  "questions": [
    {
      "id": "uxui-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está projetando um aplicativo e precisa garantir que ele seja fácil de usar. Qual abordagem você deve priorizar?",
      "alternativas": {
        "a": "Focar apenas na estética do design, como cores e fontes.",
        "b": "Realizar pesquisas com usuários para entender suas necessidades.",
        "c": "Adicionar muitas funcionalidades para impressionar os usuários.",
        "d": "Seguir as tendências de design sem considerar o usuário."
      },
      "correta": "b",
      "explicacao": "Realizar pesquisas com usuários é essencial para entender suas necessidades e criar um produto que realmente resolva seus problemas.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "uxui-ini-02",
      "nivel": "iniciante",
      "pergunta": "Ao desenvolver um aplicativo de pagamento, qual aspecto é mais importante para a experiência do usuário (UX)?",
      "alternativas": {
        "a": "A cor do botão de confirmação.",
        "b": "A quantidade de telas necessárias para concluir o pagamento.",
        "c": "O tipo de fonte usada para mostrar o valor.",
        "d": "O ícone que representa a conta."
      },
      "correta": "b",
      "explicacao": "A quantidade de telas e a ordem das informações são fundamentais para garantir que o usuário consiga completar a tarefa de forma eficiente e sem frustrações.",
      "fonte": "fundamentos.uxvsui"
    },
    {
      "id": "uxui-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você está criando um protótipo de um novo aplicativo. Qual etapa do processo de design você deve seguir primeiro?",
      "alternativas": {
        "a": "Definir o layout visual do aplicativo.",
        "b": "Testar o protótipo com usuários reais.",
        "c": "Entender o problema e as necessidades dos usuários.",
        "d": "Idear novas funcionalidades para o aplicativo."
      },
      "correta": "c",
      "explicacao": "Entender o problema e as necessidades dos usuários é a primeira etapa do processo de design, essencial para guiar as demais fases.",
      "fonte": "fundamentos.processo"
    },
    {
      "id": "uxui-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você quer melhorar a usabilidade de um aplicativo. Qual prática você deve adotar?",
      "alternativas": {
        "a": "Focar em criar uma interface visualmente atraente.",
        "b": "Realizar testes com usuários e iterar com base no feedback.",
        "c": "Adicionar mais opções de personalização ao usuário.",
        "d": "Reduzir o número de telas, mesmo que isso comprometa a clareza."
      },
      "correta": "b",
      "explicacao": "Testar com usuários e iterar com base no feedback é crucial para identificar problemas de usabilidade e melhorar a experiência.",
      "fonte": "fundamentos.processo"
    },
    {
      "id": "uxui-ini-05",
      "nivel": "iniciante",
      "pergunta": "Ao criar um design de interface, qual é a principal responsabilidade do designer de UI?",
      "alternativas": {
        "a": "Definir a lógica de navegação do aplicativo.",
        "b": "Decidir o tamanho e a cor dos botões.",
        "c": "Realizar pesquisas sobre o comportamento do usuário.",
        "d": "Criar wireframes para o fluxo de informações."
      },
      "correta": "b",
      "explicacao": "A principal responsabilidade do designer de UI é dar forma ao design, incluindo a escolha de cores, tamanhos e outros elementos visuais.",
      "fonte": "fundamentos.uxvsui"
    },
    {
      "id": "uxui-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você está projetando um site e quer garantir que ele seja intuitivo. O que deve ser sua prioridade?",
      "alternativas": {
        "a": "Usar animações complexas para atrair a atenção.",
        "b": "Estabelecer uma hierarquia clara de informações.",
        "c": "Criar um design minimalista sem considerar o conteúdo.",
        "d": "Adicionar muitos elementos gráficos para torná-lo interessante."
      },
      "correta": "b",
      "explicacao": "Estabelecer uma hierarquia clara de informações ajuda os usuários a navegar de forma intuitiva e encontrar o que precisam rapidamente.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "uxui-ini-07",
      "nivel": "iniciante",
      "pergunta": "Durante o processo de design, o que é a iteração?",
      "alternativas": {
        "a": "A criação de um design final sem revisões.",
        "b": "A repetição de etapas para melhorar a solução.",
        "c": "A escolha de cores e fontes para o design.",
        "d": "A pesquisa de mercado para entender tendências."
      },
      "correta": "b",
      "explicacao": "Iteração é o processo de repetir etapas para ajustar e melhorar a solução com base em feedback e testes.",
      "fonte": "fundamentos.processo"
    },
    {
      "id": "uxui-ini-08",
      "nivel": "iniciante",
      "pergunta": "Qual é a principal diferença entre UX e UI em um aplicativo?",
      "alternativas": {
        "a": "UX lida com a estética, enquanto UI cuida da funcionalidade.",
        "b": "UX é sobre como o aplicativo funciona, UI é sobre como ele se apresenta.",
        "c": "UX é mais importante que UI em todos os casos.",
        "d": "UX é a parte visual, enquanto UI é a parte funcional."
      },
      "correta": "b",
      "explicacao": "UX se concentra na experiência e funcionalidade do aplicativo, enquanto UI se concentra na aparência e apresentação visual.",
      "fonte": "fundamentos.uxvsui"
    },
    {
      "id": "uxui-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você está entrevistando usuários para entender suas necessidades. Qual abordagem é a mais eficaz para obter informações verdadeiras?",
      "alternativas": {
        "a": "Perguntar o que eles acham de um produto hipotético.",
        "b": "Induzir a resposta que você espera ouvir.",
        "c": "Perguntar sobre experiências passadas relacionadas ao uso do produto.",
        "d": "Fazer perguntas abertas sobre o que eles gostariam que existisse."
      },
      "correta": "c",
      "explicacao": "Perguntar sobre experiências passadas ajuda a revelar necessidades reais, enquanto perguntas hipotéticas podem levar a respostas imprecisas.",
      "fonte": "pesquisa.metodos"
    },
    {
      "id": "uxui-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você precisa criar uma persona para seu projeto. Qual é a prática recomendada ao desenvolver essa persona?",
      "alternativas": {
        "a": "Inventar características que você acha que seriam interessantes.",
        "b": "Basear a persona em dados reais coletados durante a pesquisa.",
        "c": "Usar uma persona genérica que se encaixa em todos os usuários.",
        "d": "Criar várias personas detalhadas sem dados concretos."
      },
      "correta": "b",
      "explicacao": "A persona deve ser baseada em dados reais da pesquisa para ser útil e representativa do usuário.",
      "fonte": "pesquisa.persona"
    },
    {
      "id": "uxui-ini-11",
      "nivel": "iniciante",
      "pergunta": "Ao mapear a jornada do usuário, qual elemento é essencial para identificar pontos de dor?",
      "alternativas": {
        "a": "Focar apenas nas etapas em que o usuário interage com o produto.",
        "b": "Registrar o que o usuário faz, pensa e sente em cada etapa.",
        "c": "Desenhar a jornada sem considerar as emoções do usuário.",
        "d": "Analisar apenas as opiniões dos usuários sobre o produto."
      },
      "correta": "b",
      "explicacao": "Registrar ações, pensamentos e emoções permite identificar frustrações e pontos de dor na jornada do usuário.",
      "fonte": "pesquisa.jornada"
    },
    {
      "id": "uxui-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você está organizando uma pesquisa qualitativa. Qual método é o mais indicado para entender profundamente as necessidades dos usuários?",
      "alternativas": {
        "a": "Realizar questionários com muitas pessoas.",
        "b": "Conduzir entrevistas com um número limitado de participantes.",
        "c": "Fazer observações sem interação com os usuários.",
        "d": "Criar um grupo de foco com pessoas aleatórias."
      },
      "correta": "b",
      "explicacao": "Entrevistas permitem uma compreensão profunda das necessidades e frustrações dos usuários.",
      "fonte": "pesquisa.metodos"
    },
    {
      "id": "uxui-ini-13",
      "nivel": "iniciante",
      "pergunta": "Durante uma entrevista, você percebe que o usuário está hesitante em compartilhar suas verdadeiras opiniões. O que você deve fazer?",
      "alternativas": {
        "a": "Forçar o usuário a responder suas perguntas.",
        "b": "Mudar o assunto para algo mais leve e divertido.",
        "c": "Reformular a pergunta para que ele se sinta mais à vontade.",
        "d": "Concluir a entrevista rapidamente para não perder tempo."
      },
      "correta": "c",
      "explicacao": "Reformular a pergunta pode ajudar o usuário a se sentir mais confortável e disposto a compartilhar suas experiências.",
      "fonte": "pesquisa.metodos"
    },
    {
      "id": "uxui-ini-14",
      "nivel": "iniciante",
      "pergunta": "Ao criar uma persona, qual é o principal risco de se inventar características sem base em dados reais?",
      "alternativas": {
        "a": "A persona pode se tornar muito complexa e difícil de entender.",
        "b": "A persona pode dar uma falsa sensação de compreensão do usuário.",
        "c": "A persona pode ser muito semelhante a outras que você já criou.",
        "d": "A persona pode não ter um nome interessante."
      },
      "correta": "b",
      "explicacao": "Inventar características sem dados reais pode levar a decisões de design baseadas em suposições, não na realidade do usuário.",
      "fonte": "pesquisa.persona"
    },
    {
      "id": "uxui-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você está criando um mapa de jornada e percebe que uma etapa não foi bem detalhada. O que deve ser incluído para torná-la mais útil?",
      "alternativas": {
        "a": "Apenas as ações que o usuário realiza nessa etapa.",
        "b": "Os sentimentos e pensamentos do usuário durante essa etapa.",
        "c": "Uma descrição longa e detalhada da etapa.",
        "d": "A opinião de outros membros da equipe sobre essa etapa."
      },
      "correta": "b",
      "explicacao": "Incluir sentimentos e pensamentos do usuário ajuda a identificar frustrações e a melhorar a experiência geral.",
      "fonte": "pesquisa.jornada"
    },
    {
      "id": "uxui-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está organizando o conteúdo de um aplicativo e percebe que a estrutura interna da empresa está refletida nos menus. Qual abordagem você deve adotar para melhorar a arquitetura de informação?",
      "alternativas": {
        "a": "Manter a estrutura atual, pois ela reflete a organização da empresa.",
        "b": "Reorganizar os menus com base no que faz sentido para os usuários.",
        "c": "Adicionar mais categorias para incluir todos os departamentos da empresa.",
        "d": "Usar jargão técnico nos rótulos para que os usuários entendam melhor."
      },
      "correta": "b",
      "explicacao": "A reorganização dos menus com base no entendimento dos usuários garante que eles encontrem o que procuram sem esforço, evitando a armadilha de usar a estrutura interna da empresa.",
      "fonte": "estrutura.ia"
    },
    {
      "id": "uxui-int-02",
      "nivel": "intermediario",
      "pergunta": "Ao mapear um fluxo de usuário para a criação de uma conta, você se concentra apenas nas situações em que tudo ocorre como esperado. O que você deve fazer para melhorar esse fluxo?",
      "alternativas": {
        "a": "Adicionar etapas para lidar com senhas esquecidas e erros de preenchimento.",
        "b": "Focar apenas nas etapas que levam ao sucesso da criação da conta.",
        "c": "Desenhar o fluxo sem considerar as bifurcações de decisão.",
        "d": "Eliminar as etapas que não são necessárias para simplificar o fluxo."
      },
      "correta": "a",
      "explicacao": "Adicionar etapas para lidar com senhas esquecidas e erros de preenchimento garante que o fluxo seja realista e trate das situações que ocorrem na prática, melhorando a experiência do usuário.",
      "fonte": "estrutura.fluxos"
    },
    {
      "id": "uxui-int-03",
      "nivel": "intermediario",
      "pergunta": "Você está criando wireframes para um novo aplicativo e quer garantir que o feedback dos usuários se concentre na estrutura. Qual estratégia você deve usar ao apresentar os wireframes?",
      "alternativas": {
        "a": "Mostrar wireframes coloridos e detalhados para impressionar os usuários.",
        "b": "Apresentar wireframes em baixa fidelidade, focando na estrutura e hierarquia.",
        "c": "Usar wireframes com imagens e textos reais para facilitar a compreensão.",
        "d": "Incluir todos os elementos visuais para que os usuários vejam o design final."
      },
      "correta": "b",
      "explicacao": "Apresentar wireframes em baixa fidelidade ajuda a manter a conversa focada na estrutura e hierarquia, evitando distrações com detalhes visuais.",
      "fonte": "estrutura.wireframe"
    },
    {
      "id": "uxui-int-04",
      "nivel": "intermediario",
      "pergunta": "Você está realizando um card sorting para entender como os usuários agrupam o conteúdo de um site. Qual é a principal razão para usar essa técnica?",
      "alternativas": {
        "a": "Ela ajuda a validar a estrutura interna da empresa.",
        "b": "Ela revela a estrutura natural que faz sentido para os usuários.",
        "c": "Ela é uma forma de testar a usabilidade do site já existente.",
        "d": "Ela permite que você escolha os rótulos mais técnicos para os menus."
      },
      "correta": "b",
      "explicacao": "O card sorting revela como os usuários agrupam o conteúdo, ajudando a criar uma arquitetura de informação que faça sentido para eles, e não para a empresa.",
      "fonte": "estrutura.ia"
    },
    {
      "id": "uxui-int-05",
      "nivel": "intermediario",
      "pergunta": "Ao mapear um fluxo de usuário, você percebe que não incluiu o que acontece quando um pagamento é recusado. O que você deve fazer para corrigir isso?",
      "alternativas": {
        "a": "Adicionar uma tela de erro que informe o usuário sobre a recusa do pagamento.",
        "b": "Ignorar essa etapa, pois a maioria dos pagamentos é aprovada.",
        "c": "Desenhar o fluxo apenas para os casos de sucesso, simplificando o processo.",
        "d": "Criar um botão que redirecione o usuário para outra parte do site."
      },
      "correta": "a",
      "explicacao": "Adicionar uma tela de erro que informe o usuário sobre a recusa do pagamento garante que o fluxo seja completo e trate das situações que podem ocorrer na prática.",
      "fonte": "estrutura.fluxos"
    },
    {
      "id": "uxui-int-06",
      "nivel": "intermediario",
      "pergunta": "Você está criando um protótipo de um aplicativo e precisa adicionar um botão que será usado em várias telas. Qual abordagem você deve usar para garantir consistência e agilidade no design?",
      "alternativas": {
        "a": "Desenhar o botão manualmente em cada tela para personalizar cada um.",
        "b": "Criar um componente para o botão e reutilizá-lo em todas as telas.",
        "c": "Usar uma imagem do botão e inseri-la em cada tela individualmente.",
        "d": "Copiar e colar o botão de uma tela para outra, ajustando o estilo depois."
      },
      "correta": "b",
      "explicacao": "Criar um componente para o botão permite que você o reutilize em várias telas, garantindo consistência e facilitando alterações futuras.",
      "fonte": "figma.componentes"
    },
    {
      "id": "uxui-int-07",
      "nivel": "intermediario",
      "pergunta": "Você está ajustando o layout de um aplicativo e precisa que os elementos se reorganizem automaticamente quando você adicionar novos itens. Qual recurso do Figma você deve utilizar?",
      "alternativas": {
        "a": "Usar frames para cada elemento individualmente.",
        "b": "Aplicar auto layout aos elementos que precisam se reorganizar.",
        "c": "Ajustar manualmente a posição de cada elemento após a adição.",
        "d": "Criar grupos de elementos e movê-los manualmente."
      },
      "correta": "b",
      "explicacao": "O auto layout permite que os elementos se reorganizem automaticamente, economizando tempo e esforço ao fazer ajustes no design.",
      "fonte": "figma.ferramenta"
    },
    {
      "id": "uxui-int-08",
      "nivel": "intermediario",
      "pergunta": "Você está trabalhando em um projeto e percebe que os botões estão com estilos ligeiramente diferentes. Qual é a melhor maneira de evitar esse problema no futuro?",
      "alternativas": {
        "a": "Criar um guia de estilo separado para os botões.",
        "b": "Desenhar cada botão manualmente para garantir que eles sejam únicos.",
        "c": "Utilizar componentes para os botões, garantindo que todos sejam consistentes.",
        "d": "Copiar os botões de uma tela para outra, ajustando-os conforme necessário."
      },
      "correta": "c",
      "explicacao": "Utilizar componentes para os botões assegura que todos sejam idênticos, evitando inconsistências no design.",
      "fonte": "figma.componentes"
    },
    {
      "id": "uxui-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está criando um layout e precisa destacar a informação mais importante. Qual estratégia de hierarquia visual você deve usar?",
      "alternativas": {
        "a": "Usar um tamanho de fonte menor para o texto mais importante.",
        "b": "Aplicar um alto contraste entre o texto e o fundo.",
        "c": "Adicionar muitos elementos coloridos ao redor da informação.",
        "d": "Desalinhá-la para dar um toque mais criativo."
      },
      "correta": "b",
      "explicacao": "O alto contraste entre o texto e o fundo ajuda a destacar a informação mais importante, guiando o olhar do usuário de forma eficaz.",
      "fonte": "visual.hierarquia"
    },
    {
      "id": "uxui-int-10",
      "nivel": "intermediario",
      "pergunta": "Você está projetando uma interface e precisa escolher uma paleta de cores. Qual abordagem é mais eficaz?",
      "alternativas": {
        "a": "Escolher cores que você gosta e aplicá-las aleatoriamente.",
        "b": "Usar uma cor primária para ações principais e neutras para o fundo.",
        "c": "Optar por muitas cores vibrantes para chamar atenção.",
        "d": "Selecionar cores sem considerar seu significado."
      },
      "correta": "b",
      "explicacao": "Usar uma cor primária para ações principais e cores neutras para o fundo cria uma hierarquia clara e evita confusão na interface.",
      "fonte": "visual.cor"
    },
    {
      "id": "uxui-int-11",
      "nivel": "intermediario",
      "pergunta": "Você está ajustando a tipografia de um projeto. Qual é a melhor prática para garantir legibilidade?",
      "alternativas": {
        "a": "Usar várias fontes decorativas para dar estilo ao texto.",
        "b": "Escolher uma fonte sans-serif e limitar a duas fontes no total.",
        "c": "Utilizar tamanhos de fonte diferentes em cada tela para variedade.",
        "d": "Deixar o texto colado para economizar espaço na tela."
      },
      "correta": "b",
      "explicacao": "Escolher uma fonte sans-serif e limitar a duas fontes garante legibilidade e consistência em todo o projeto.",
      "fonte": "visual.tipografia"
    },
    {
      "id": "uxui-int-12",
      "nivel": "intermediario",
      "pergunta": "Ao projetar uma interface acessível, qual das seguintes práticas é fundamental?",
      "alternativas": {
        "a": "Usar cores vibrantes para todos os elementos.",
        "b": "Garantir contraste suficiente entre texto e fundo.",
        "c": "Adicionar texto alternativo apenas em imagens decorativas.",
        "d": "Depender exclusivamente da cor para comunicar erros."
      },
      "correta": "b",
      "explicacao": "Garantir contraste suficiente entre texto e fundo é essencial para a legibilidade e acessibilidade, beneficiando todos os usuários.",
      "fonte": "visual.acessibilidade"
    },
    {
      "id": "uxui-int-13",
      "nivel": "intermediario",
      "pergunta": "Você está finalizando um dashboard no Figma. Qual aspecto é crucial para garantir um acabamento profissional?",
      "alternativas": {
        "a": "Ter um alinhamento impecável e espaçamento generoso.",
        "b": "Usar o máximo de cores possíveis para destacar informações.",
        "c": "Criar elementos desalinhados para um visual mais dinâmico.",
        "d": "Evitar o uso de espaço em branco para não parecer vazio."
      },
      "correta": "a",
      "explicacao": "Um alinhamento impecável e espaçamento generoso são fundamentais para um acabamento profissional e organizado em um dashboard.",
      "fonte": "visual.projeto"
    },
    {
      "id": "uxui-int-14",
      "nivel": "intermediario",
      "pergunta": "Você precisa organizar informações em uma tela. Qual abordagem de hierarquia visual deve ser priorizada?",
      "alternativas": {
        "a": "Agrupar elementos semelhantes para mostrar relação entre eles.",
        "b": "Usar tamanhos de fonte aleatórios para cada item.",
        "c": "Desconsiderar o espaço em branco para maximizar o conteúdo.",
        "d": "Alinhar todos os elementos de forma aleatória."
      },
      "correta": "a",
      "explicacao": "Agrupar elementos semelhantes ajuda a comunicar que eles se relacionam, criando uma hierarquia visual clara e organizada.",
      "fonte": "visual.hierarquia"
    },
    {
      "id": "uxui-int-15",
      "nivel": "intermediario",
      "pergunta": "Ao escolher uma paleta de cores para um projeto, qual é a prática recomendada?",
      "alternativas": {
        "a": "Usar cores que contrastem entre si para destacar diferentes seções.",
        "b": "Escolher uma única cor e aplicá-la em toda a interface.",
        "c": "Misturar várias cores sem um critério definido.",
        "d": "Usar cores apenas por gosto pessoal."
      },
      "correta": "a",
      "explicacao": "Usar cores que contrastem entre si ajuda a destacar diferentes seções e cria uma hierarquia visual clara.",
      "fonte": "visual.cor"
    },
    {
      "id": "uxui-av-01",
      "nivel": "avancado",
      "pergunta": "Você está criando um design system para um aplicativo de grande porte. Qual camada deve conter as diretrizes sobre como e quando usar os componentes?",
      "alternativas": {
        "a": "Tokens",
        "b": "Componentes",
        "c": "Diretrizes",
        "d": "Estilos"
      },
      "correta": "c",
      "explicacao": "As diretrizes explicam como e quando usar os componentes, garantindo a aplicação correta do design system.",
      "fonte": "designsystem.oque"
    },
    {
      "id": "uxui-av-02",
      "nivel": "avancado",
      "pergunta": "Ao projetar um aplicativo para Android, qual abordagem é mais eficaz para garantir que os usuários se sintam confortáveis com a interface?",
      "alternativas": {
        "a": "Criar novos padrões de interação",
        "b": "Seguir as convenções do Material Design",
        "c": "Usar cores e fontes únicas",
        "d": "Inovar com animações complexas"
      },
      "correta": "b",
      "explicacao": "Seguir as convenções do Material Design faz o aplicativo parecer nativo e familiar, facilitando a usabilidade.",
      "fonte": "designsystem.plataformas"
    },
    {
      "id": "uxui-av-03",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um mini design system no Figma. Qual é a primeira etapa recomendada para garantir consistência no projeto?",
      "alternativas": {
        "a": "Definir a paleta de cores",
        "b": "Criar componentes complexos",
        "c": "Desenvolver animações",
        "d": "Escrever um manual de uso"
      },
      "correta": "a",
      "explicacao": "Definir a paleta de cores é a primeira etapa essencial para garantir consistência em um design system.",
      "fonte": "designsystem.oque"
    },
    {
      "id": "uxui-av-04",
      "nivel": "avancado",
      "pergunta": "Você percebeu que os usuários estão confusos com a navegação do seu app. Qual é a melhor maneira de resolver isso, segundo as práticas recomendadas?",
      "alternativas": {
        "a": "Alterar a posição do botão de voltar",
        "b": "Adicionar um tutorial na primeira tela",
        "c": "Seguir as convenções de navegação conhecidas",
        "d": "Criar um menu original e inovador"
      },
      "correta": "c",
      "explicacao": "Seguir as convenções de navegação conhecidas ajuda os usuários a se sentirem confortáveis e reduz a curva de aprendizado.",
      "fonte": "designsystem.plataformas"
    },
    {
      "id": "uxui-av-05",
      "nivel": "avancado",
      "pergunta": "Você está criando um protótipo no Figma e precisa simular a navegação entre telas. Qual é a melhor abordagem para garantir que o fluxo do usuário seja claro?",
      "alternativas": {
        "a": "Conectar as telas de forma que cada botão leve à tela correta, incluindo transições.",
        "b": "Criar um protótipo visualmente bonito, mas sem se preocupar com a navegação.",
        "c": "Adicionar animações complexas entre as telas antes de garantir a navegação.",
        "d": "Usar imagens estáticas de cada tela sem conectá-las."
      },
      "correta": "a",
      "explicacao": "Conectar as telas de forma que cada botão leve à tela correta é essencial para simular a experiência do usuário de forma eficaz.",
      "fonte": "prototipo.prototipagem"
    },
    {
      "id": "uxui-av-06",
      "nivel": "avancado",
      "pergunta": "Durante uma avaliação heurística de uma interface, você percebe que o sistema não informa o usuário sobre o que está acontecendo. Qual princípio de usabilidade está sendo violado?",
      "alternativas": {
        "a": "Controle e liberdade.",
        "b": "Visibilidade do estado do sistema.",
        "c": "Consistência.",
        "d": "Prevenção de erros."
      },
      "correta": "b",
      "explicacao": "A visibilidade do estado do sistema é crucial para que o usuário saiba o que está acontecendo, e a falta dela pode causar confusão.",
      "fonte": "prototipo.heuristicas"
    },
    {
      "id": "uxui-av-07",
      "nivel": "avancado",
      "pergunta": "Você está conduzindo um teste de usabilidade com um protótipo e um participante hesita em usar um botão. O que você deve fazer?",
      "alternativas": {
        "a": "Perguntar ao participante por que ele hesitou.",
        "b": "Observar em silêncio e anotar a hesitação.",
        "c": "Indicar ao participante o que ele deveria fazer.",
        "d": "Repetir a tarefa para ver se o erro se repete."
      },
      "correta": "b",
      "explicacao": "Observar em silêncio e anotar a hesitação é a abordagem correta, pois o objetivo é identificar problemas sem influenciar o usuário.",
      "fonte": "prototipo.teste"
    },
    {
      "id": "uxui-av-08",
      "nivel": "avancado",
      "pergunta": "Ao preparar a entrega para desenvolvimento, você precisa especificar o que acontece quando um botão é pressionado. Qual informação é essencial incluir?",
      "alternativas": {
        "a": "A cor do botão quando pressionado.",
        "b": "A posição do botão na tela.",
        "c": "O texto do botão quando pressionado.",
        "d": "O comportamento do botão em diferentes estados."
      },
      "correta": "d",
      "explicacao": "Especificar o comportamento do botão em diferentes estados é crucial para que o desenvolvedor saiba como implementá-lo corretamente.",
      "fonte": "prototipo.handoff"
    },
    {
      "id": "uxui-av-09",
      "nivel": "avancado",
      "pergunta": "Você está criando seu portfólio e deseja apresentar um projeto. Qual abordagem é mais eficaz para mostrar seu raciocínio de design?",
      "alternativas": {
        "a": "Incluir apenas as telas finais do projeto.",
        "b": "Contar a história do projeto, incluindo desafios e decisões tomadas.",
        "c": "Apresentar o projeto sem contexto, apenas as imagens.",
        "d": "Focar em quantos projetos você já completou."
      },
      "correta": "b",
      "explicacao": "Contar a história do projeto, incluindo desafios e decisões, demonstra seu raciocínio e habilidades como designer.",
      "fonte": "prototipo.portfolio"
    },
    {
      "id": "uxui-av-10",
      "nivel": "avancado",
      "pergunta": "Ao testar um protótipo, você observa que um usuário não consegue encontrar uma opção de desfazer. O que isso indica sobre o design?",
      "alternativas": {
        "a": "O design é intuitivo e fácil de usar.",
        "b": "Falta um controle e liberdade adequados no design.",
        "c": "Os usuários não estão prestando atenção.",
        "d": "O protótipo está muito bonito para ser funcional."
      },
      "correta": "b",
      "explicacao": "A falta de uma opção de desfazer indica que o design não oferece controle e liberdade adequados para o usuário.",
      "fonte": "prototipo.teste"
    },
    {
      "id": "uxui-av-11",
      "nivel": "avancado",
      "pergunta": "Você está realizando uma avaliação heurística e percebe que a interface usa jargões técnicos. Qual princípio de usabilidade isso viola?",
      "alternativas": {
        "a": "Consistência.",
        "b": "Correspondência com o mundo real.",
        "c": "Visibilidade do estado do sistema.",
        "d": "Prevenção de erros."
      },
      "correta": "b",
      "explicacao": "Usar linguagem e conceitos que o usuário já conhece é fundamental para a correspondência com o mundo real, e o jargão técnico dificulta isso.",
      "fonte": "prototipo.heuristicas"
    },
    {
      "id": "uxui-av-12",
      "nivel": "avancado",
      "pergunta": "Ao entregar um design para desenvolvimento, o que deve ser incluído para evitar retrabalho?",
      "alternativas": {
        "a": "Apenas as telas finais e suas cores.",
        "b": "Especificações detalhadas de espaçamentos e estados dos componentes.",
        "c": "Um resumo do projeto e suas metas.",
        "d": "Apenas os wireframes iniciais."
      },
      "correta": "b",
      "explicacao": "Especificações detalhadas de espaçamentos e estados dos componentes são essenciais para que o desenvolvedor construa o design corretamente.",
      "fonte": "prototipo.handoff"
    },
    {
      "id": "uxui-av-13",
      "nivel": "avancado",
      "pergunta": "Você está criando um protótipo de alta fidelidade para apresentar a um cliente. Qual é a prática recomendada para garantir que o protótipo atenda às expectativas?",
      "alternativas": {
        "a": "Focar em detalhes visuais e animações complexas desde o início.",
        "b": "Conectar as telas e garantir que o fluxo principal seja navegável.",
        "c": "Adicionar o máximo de funcionalidades possíveis.",
        "d": "Ignorar feedbacks anteriores e seguir com a primeira versão."
      },
      "correta": "b",
      "explicacao": "Conectar as telas e garantir que o fluxo principal seja navegável é fundamental para atender às expectativas do cliente em um protótipo.",
      "fonte": "prototipo.prototipagem"
    },
    {
      "id": "uxui-av-14",
      "nivel": "avancado",
      "pergunta": "Você está montando seu portfólio e deseja incluir um projeto de redesign. Qual é a melhor maneira de apresentar esse projeto?",
      "alternativas": {
        "a": "Mostrar apenas o resultado final e ignorar o processo.",
        "b": "Incluir o processo de redesign e as decisões tomadas ao longo do caminho.",
        "c": "Focar apenas nas críticas que recebeu durante o projeto.",
        "d": "Apresentar o projeto como se fosse um trabalho original."
      },
      "correta": "b",
      "explicacao": "Incluir o processo de redesign e as decisões tomadas demonstra seu raciocínio e capacidade de resolver problemas.",
      "fonte": "prototipo.portfolio"
    },
    {
      "id": "uxui-av-15",
      "nivel": "avancado",
      "pergunta": "Durante um teste de usabilidade, um usuário encontra um erro ao tentar completar uma tarefa. Como você deve encarar essa situação?",
      "alternativas": {
        "a": "Como uma falha do design que precisa ser corrigida.",
        "b": "Como uma oportunidade de aprender sobre o que não funciona.",
        "c": "Como um sinal de que o usuário não está qualificado.",
        "d": "Como um resultado que deve ser ignorado."
      },
      "correta": "b",
      "explicacao": "Encarar o erro como uma oportunidade de aprender é fundamental, pois ajuda a identificar problemas que precisam ser corrigidos antes do lançamento.",
      "fonte": "prototipo.teste"
    }
  ]
};

export default pool;
