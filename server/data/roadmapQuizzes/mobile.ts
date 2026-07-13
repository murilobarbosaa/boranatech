// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool mobile). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "mobile",
  "questions": [
    {
      "id": "mobile-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está criando um aplicativo para celular e precisa garantir que a interface funcione bem com toques. O que você deve priorizar?",
      "alternativas": {
        "a": "Utilizar botões grandes e espaçados para facilitar o toque.",
        "b": "Criar uma interface cheia de detalhes pequenos para maximizar o espaço.",
        "c": "Focar em animações complexas para atrair a atenção do usuário.",
        "d": "Usar menus suspensos que exigem precisão no clique."
      },
      "correta": "a",
      "explicacao": "Priorizar botões grandes e espaçados facilita a interação do usuário, que utiliza os dedos para tocar na tela.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "mobile-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você decidiu desenvolver um aplicativo que funcione tanto em Android quanto em iOS. Qual abordagem você deve considerar para otimizar tempo e recursos?",
      "alternativas": {
        "a": "Desenvolver um aplicativo nativo para cada plataforma.",
        "b": "Optar por uma abordagem multiplataforma como React Native ou Flutter.",
        "c": "Criar um site responsivo que funcione em celulares.",
        "d": "Utilizar apenas HTML e CSS para o desenvolvimento."
      },
      "correta": "b",
      "explicacao": "Optar por uma abordagem multiplataforma permite que você escreva um único código para ambas as plataformas, economizando tempo e recursos.",
      "fonte": "fundamentos.nativomulti"
    },
    {
      "id": "mobile-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você está testando seu aplicativo em diferentes dispositivos. Qual é um fator importante a considerar durante os testes?",
      "alternativas": {
        "a": "A aparência do aplicativo deve ser a mesma em todos os dispositivos.",
        "b": "O desempenho do aplicativo pode variar dependendo da versão do sistema operacional.",
        "c": "Todos os dispositivos devem ter a mesma quantidade de memória disponível.",
        "d": "O aplicativo deve funcionar apenas em dispositivos mais novos."
      },
      "correta": "b",
      "explicacao": "O desempenho do aplicativo pode variar entre diferentes versões do sistema operacional, por isso é importante testar em várias configurações.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "mobile-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você precisa escolher entre desenvolvimento nativo e multiplataforma. Qual é uma desvantagem do desenvolvimento nativo?",
      "alternativas": {
        "a": "Acesso limitado aos recursos do dispositivo.",
        "b": "Necessidade de desenvolver dois aplicativos para plataformas diferentes.",
        "c": "Menor performance em comparação ao multiplataforma.",
        "d": "Menos flexibilidade na escolha da linguagem de programação."
      },
      "correta": "b",
      "explicacao": "A principal desvantagem do desenvolvimento nativo é que você precisa criar um aplicativo separado para cada plataforma, o que aumenta o custo e o tempo de desenvolvimento.",
      "fonte": "fundamentos.nativomulti"
    },
    {
      "id": "mobile-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você está criando um aplicativo que precisa acessar a câmera do dispositivo. Qual abordagem de desenvolvimento seria mais vantajosa?",
      "alternativas": {
        "a": "Desenvolvimento nativo, para acesso total e imediato aos recursos.",
        "b": "Desenvolvimento multiplataforma, que não permite acesso à câmera.",
        "c": "Desenvolvimento web, que não precisa de acesso à câmera.",
        "d": "Desenvolvimento nativo apenas para iOS, ignorando Android."
      },
      "correta": "a",
      "explicacao": "O desenvolvimento nativo oferece acesso total e imediato a todos os recursos do sistema, incluindo a câmera, o que é crucial para o funcionamento do aplicativo.",
      "fonte": "fundamentos.nativomulti"
    },
    {
      "id": "mobile-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você está configurando seu ambiente para desenvolvimento mobile e precisa testar seu app. O que você deve fazer?",
      "alternativas": {
        "a": "Rodar o app em um emulador ou no seu aparelho conectado.",
        "b": "Aguardar até ter um celular novo para testar.",
        "c": "Focar apenas na programação e ignorar o ambiente.",
        "d": "Instalar ferramentas sem verificar se funcionam corretamente."
      },
      "correta": "a",
      "explicacao": "Rodar o app em um emulador ou no aparelho é essencial para garantir que o ambiente está configurado corretamente.",
      "fonte": "stack.setup"
    },
    {
      "id": "mobile-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você acaba de instalar as ferramentas necessárias para desenvolvimento mobile. Qual é o próximo passo recomendado?",
      "alternativas": {
        "a": "Criar um app em branco e testá-lo imediatamente.",
        "b": "Ler sobre as funções da linguagem sem praticar.",
        "c": "Focar em design de telas antes de entender a linguagem.",
        "d": "Desinstalar as ferramentas e tentar outra stack."
      },
      "correta": "a",
      "explicacao": "Criar um app em branco e testá-lo ajuda a garantir que o ambiente está funcionando corretamente.",
      "fonte": "stack.setup"
    },
    {
      "id": "mobile-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você quer garantir que seu app não trave enquanto espera por dados de um servidor. O que você deve usar?",
      "alternativas": {
        "a": "Código assíncrono para lidar com operações demoradas.",
        "b": "Executar todas as operações de forma síncrona.",
        "c": "Aguardar que cada operação termine antes de continuar.",
        "d": "Usar loops infinitos para evitar travamentos."
      },
      "correta": "a",
      "explicacao": "O código assíncrono permite que o app continue respondendo enquanto aguarda resultados, evitando travamentos.",
      "fonte": "stack.async"
    },
    {
      "id": "mobile-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo uma função que precisa processar dados de forma eficiente. O que é essencial para isso?",
      "alternativas": {
        "a": "Entender e usar variáveis, funções e estruturas de dados.",
        "b": "Focar apenas em como a tela vai parecer.",
        "c": "Ignorar a lógica e se concentrar em frameworks.",
        "d": "Usar apenas funções pré-prontas disponíveis na internet."
      },
      "correta": "a",
      "explicacao": "Compreender variáveis, funções e estruturas de dados é fundamental para processar dados corretamente.",
      "fonte": "stack.linguagem"
    },
    {
      "id": "mobile-ini-10",
      "nivel": "iniciante",
      "pergunta": "Ao criar a interface de um app, qual abordagem você deve seguir para garantir que a tela se atualize corretamente?",
      "alternativas": {
        "a": "Usar UI declarativa para descrever o estado da tela.",
        "b": "Alterar manualmente cada elemento da tela sempre que um dado mudar.",
        "c": "Focar apenas em adicionar novos elementos à tela.",
        "d": "Criar uma sequência de comandos para cada atualização."
      },
      "correta": "a",
      "explicacao": "A UI declarativa permite descrever como a tela deve parecer, facilitando a atualização automática com base no estado dos dados.",
      "fonte": "stack.ui"
    },
    {
      "id": "mobile-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você precisa que sua função retorne um resultado após uma operação demorada. Qual é a melhor prática?",
      "alternativas": {
        "a": "Utilizar um mecanismo assíncrono para esperar o resultado.",
        "b": "Executar a operação de forma síncrona e travar a interface.",
        "c": "Ignorar a espera e retornar um valor padrão.",
        "d": "Chamar a função repetidamente até obter um resultado."
      },
      "correta": "a",
      "explicacao": "Usar um mecanismo assíncrono permite que a função espere o resultado sem travar a interface do usuário.",
      "fonte": "stack.async"
    },
    {
      "id": "mobile-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você está montando uma tela simples com um título e um botão. O que é importante lembrar?",
      "alternativas": {
        "a": "A tela deve ser uma função do estado dos dados.",
        "b": "A tela deve ser montada com comandos sequenciais.",
        "c": "A tela deve ter um design fixo sem considerar os dados.",
        "d": "A tela deve ser criada sem pensar na interação do usuário."
      },
      "correta": "a",
      "explicacao": "Montar a tela como uma função do estado dos dados permite que ela se atualize automaticamente conforme os dados mudam.",
      "fonte": "stack.ui"
    },
    {
      "id": "mobile-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você está aprendendo a programar e quer evitar frustrações. O que é uma boa prática ao iniciar?",
      "alternativas": {
        "a": "Dominar a linguagem antes de avançar para frameworks.",
        "b": "Começar diretamente com frameworks populares.",
        "c": "Ignorar a sintaxe e aprender apenas por tentativa e erro.",
        "d": "Focar em design e layout antes de entender a lógica."
      },
      "correta": "a",
      "explicacao": "Dominar a linguagem básica é fundamental para entender como os frameworks funcionam e evitar frustrações futuras.",
      "fonte": "stack.linguagem"
    },
    {
      "id": "mobile-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você quer implementar uma funcionalidade que faz chamadas a um servidor. O que deve ser sua prioridade?",
      "alternativas": {
        "a": "Usar chamadas assíncronas para não travar a interface.",
        "b": "Executar chamadas de forma síncrona para simplificar o código.",
        "c": "Fazer todas as chamadas em sequência, uma após a outra.",
        "d": "Ignorar o tempo de resposta e focar apenas na lógica."
      },
      "correta": "a",
      "explicacao": "Utilizar chamadas assíncronas é crucial para manter a interface responsiva enquanto espera por dados.",
      "fonte": "stack.async"
    },
    {
      "id": "mobile-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você está criando um app e precisa garantir que a interface reaja a mudanças de dados. O que você deve usar?",
      "alternativas": {
        "a": "Uma abordagem declarativa para descrever a interface.",
        "b": "Um código imperativo que altera a interface manualmente.",
        "c": "Um sistema de eventos que não atualiza a tela automaticamente.",
        "d": "Um layout fixo que não considera mudanças de dados."
      },
      "correta": "a",
      "explicacao": "Uma abordagem declarativa permite que a interface se atualize automaticamente quando os dados mudam, melhorando a experiência do usuário.",
      "fonte": "stack.ui"
    },
    {
      "id": "mobile-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está criando um layout para um aplicativo que deve se adaptar a diferentes tamanhos de tela. Qual abordagem você deve usar para garantir que o layout fique adequado em qualquer dispositivo?",
      "alternativas": {
        "a": "Definir tamanhos fixos para cada elemento em pixels.",
        "b": "Utilizar sistemas de layout flexíveis que se ajustem ao espaço disponível.",
        "c": "Colocar todos os elementos em uma única coluna, sem considerar o espaço.",
        "d": "Usar coordenadas absolutas para posicionar os elementos."
      },
      "correta": "b",
      "explicacao": "Utilizar sistemas de layout flexíveis permite que o aplicativo se ajuste automaticamente a diferentes tamanhos de tela, garantindo uma boa experiência em qualquer dispositivo.",
      "fonte": "telas.layout"
    },
    {
      "id": "mobile-int-02",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo uma tela que exibe uma lista de produtos. Qual é a prática recomendada para garantir que a rolagem da lista seja fluida e não consuma muita memória?",
      "alternativas": {
        "a": "Renderizar todos os itens da lista de uma vez.",
        "b": "Utilizar um componente de lista virtualizada que carrega apenas os itens visíveis.",
        "c": "Criar uma lista simples com todos os itens dentro, sem otimizações.",
        "d": "Dividir a lista em várias telas, exibindo apenas uma parte de cada vez."
      },
      "correta": "b",
      "explicacao": "Usar um componente de lista virtualizada é a prática recomendada, pois ele carrega apenas os itens visíveis, evitando sobrecarregar a memória e garantindo uma rolagem fluida.",
      "fonte": "telas.listas"
    },
    {
      "id": "mobile-int-03",
      "nivel": "intermediario",
      "pergunta": "Você está montando um formulário de login que deve validar as entradas do usuário antes de enviar. Qual é a abordagem correta para garantir que o formulário funcione adequadamente?",
      "alternativas": {
        "a": "Permitir o envio do formulário mesmo se os campos não estiverem válidos.",
        "b": "Usar campos controlados que refletem o estado e validar as entradas antes do envio.",
        "c": "Validar os campos apenas após o envio do formulário.",
        "d": "Exibir mensagens de erro apenas no final do processo de validação."
      },
      "correta": "b",
      "explicacao": "Usar campos controlados e validar as entradas antes do envio garante que o formulário funcione corretamente, guiando o usuário e evitando erros.",
      "fonte": "telas.formularios"
    },
    {
      "id": "mobile-int-04",
      "nivel": "intermediario",
      "pergunta": "Você está implementando a navegação entre duas telas em um aplicativo. Qual é a prática recomendada para passar dados entre essas telas?",
      "alternativas": {
        "a": "Não passar dados, apenas navegar entre as telas.",
        "b": "Utilizar parâmetros na navegação para indicar qual item foi selecionado.",
        "c": "Usar um sistema de armazenamento global para compartilhar dados entre telas.",
        "d": "Passar dados apenas na primeira tela e ignorar na segunda."
      },
      "correta": "b",
      "explicacao": "Utilizar parâmetros na navegação é a prática recomendada, pois permite que a tela de detalhe saiba qual item foi selecionado na lista, garantindo uma navegação coerente.",
      "fonte": "telas.navegacao"
    },
    {
      "id": "mobile-int-05",
      "nivel": "intermediario",
      "pergunta": "Você está criando um layout que deve incluir um cabeçalho, conteúdo e rodapé. Qual deve ser sua prioridade ao organizar esses elementos?",
      "alternativas": {
        "a": "Definir a posição exata de cada elemento em pixels.",
        "b": "Pensar no layout de fora para dentro, organizando primeiro o arranjo geral.",
        "c": "Adicionar elementos aleatoriamente e ajustar depois.",
        "d": "Focar nos detalhes antes de definir a estrutura geral."
      },
      "correta": "b",
      "explicacao": "Pensar no layout de fora para dentro ajuda a organizar a tela de forma lógica e eficiente, garantindo que todos os elementos se encaixem bem.",
      "fonte": "telas.layout"
    },
    {
      "id": "mobile-int-06",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um aplicativo que possui uma lista longa de itens. Qual abordagem você deve evitar para garantir uma boa performance?",
      "alternativas": {
        "a": "Utilizar uma lista virtualizada para exibir apenas os itens visíveis.",
        "b": "Renderizar todos os itens da lista de uma vez, mesmo que não sejam todos visíveis.",
        "c": "Implementar um scroll infinito que carrega novos itens conforme o usuário rola.",
        "d": "Dividir a lista em seções menores para facilitar a visualização."
      },
      "correta": "b",
      "explicacao": "Renderizar todos os itens de uma vez sobrecarrega a memória e prejudica a performance do aplicativo, resultando em uma rolagem travada.",
      "fonte": "telas.listas"
    },
    {
      "id": "mobile-int-07",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um app que precisa buscar uma lista de produtos de uma API. Após fazer a requisição, o que você deve fazer para garantir uma boa experiência do usuário enquanto os dados estão sendo carregados?",
      "alternativas": {
        "a": "Mostrar um indicador de carregamento até que os dados sejam recebidos.",
        "b": "Exibir uma mensagem de erro imediatamente, caso a requisição demore.",
        "c": "Deixar a tela em branco até que os dados sejam carregados.",
        "d": "Mostrar uma mensagem de sucesso antes mesmo de receber os dados."
      },
      "correta": "a",
      "explicacao": "Mostrar um indicador de carregamento melhora a experiência do usuário, pois informa que a requisição está em andamento.",
      "fonte": "dados.api"
    },
    {
      "id": "mobile-int-08",
      "nivel": "intermediario",
      "pergunta": "Você está criando um app onde duas telas precisam acessar o mesmo dado, como o carrinho de compras. Qual é a melhor abordagem para gerenciar esse estado compartilhado?",
      "alternativas": {
        "a": "Manter o estado do carrinho em cada tela individualmente.",
        "b": "Elevar o estado do carrinho para um local comum que ambas as telas possam acessar.",
        "c": "Armazenar o estado do carrinho apenas em um banco de dados local.",
        "d": "Passar o estado do carrinho de uma tela para outra através de props."
      },
      "correta": "b",
      "explicacao": "Elevar o estado permite que dados compartilhados sejam gerenciados em um único local, evitando inconsistências.",
      "fonte": "dados.estado"
    },
    {
      "id": "mobile-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um app que precisa armazenar a preferência de tema do usuário. Qual é a abordagem mais adequada para armazenar essa informação?",
      "alternativas": {
        "a": "Armazenar a preferência no banco de dados local.",
        "b": "Usar um mecanismo leve de chave e valor para guardar a preferência.",
        "c": "Guardar a preferência no servidor para acesso remoto.",
        "d": "Não armazenar a preferência, apenas perguntar ao usuário sempre que abrir o app."
      },
      "correta": "b",
      "explicacao": "Um mecanismo leve de chave e valor é ideal para dados pequenos e simples, como uma preferência de tema.",
      "fonte": "dados.local"
    },
    {
      "id": "mobile-int-10",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um app que precisa armazenar dados sensíveis, como tokens de autenticação. Qual é a prática recomendada para garantir a segurança desses dados?",
      "alternativas": {
        "a": "Armazenar os tokens no armazenamento comum do dispositivo.",
        "b": "Utilizar um cofre seguro específico da plataforma para armazenar esses dados.",
        "c": "Guardar os tokens em um arquivo de texto acessível no dispositivo.",
        "d": "Não armazenar os tokens, apenas solicitar ao usuário sempre que necessário."
      },
      "correta": "b",
      "explicacao": "Utilizar um cofre seguro é essencial para proteger dados sensíveis, evitando acessos não autorizados.",
      "fonte": "dados.local"
    },
    {
      "id": "mobile-int-11",
      "nivel": "intermediario",
      "pergunta": "Você está implementando a lógica de carregamento de dados em uma tela do seu app. O que deve ser feito após receber uma resposta de sucesso da API?",
      "alternativas": {
        "a": "Atualizar o estado com os dados recebidos e redesenhar a interface.",
        "b": "Ignorar a resposta e continuar com os dados antigos.",
        "c": "Mostrar uma mensagem de erro, mesmo que a resposta tenha sido bem-sucedida.",
        "d": "Repetir a requisição até que os dados sejam carregados corretamente."
      },
      "correta": "a",
      "explicacao": "Atualizar o estado com os dados recebidos é fundamental para que a interface reflita as informações mais recentes.",
      "fonte": "dados.api"
    },
    {
      "id": "mobile-int-12",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um aplicativo que precisa acessar a câmera quando o usuário toca em um botão. Qual é a melhor prática para pedir essa permissão?",
      "alternativas": {
        "a": "Peça a permissão assim que o app é aberto, para garantir que o usuário a aceite logo.",
        "b": "Peça a permissão quando o usuário tocar no botão, explicando por que o acesso é necessário.",
        "c": "Peça a permissão logo após a instalação do app, para evitar surpresas depois.",
        "d": "Peça a permissão em um pop-up separado logo no início, sem dar contexto."
      },
      "correta": "b",
      "explicacao": "A melhor prática é pedir a permissão no momento em que ela faz sentido, explicando o motivo, o que melhora a experiência do usuário.",
      "fonte": "recursos.permissoes"
    },
    {
      "id": "mobile-int-13",
      "nivel": "intermediario",
      "pergunta": "Você está criando um app que precisa acessar a galeria de fotos. Qual abordagem deve ser adotada para garantir que o app funcione corretamente em todos os dispositivos?",
      "alternativas": {
        "a": "Assuma que todos os dispositivos têm acesso à galeria e não trate erros.",
        "b": "Teste o acesso à galeria apenas no emulador, pois é mais prático.",
        "c": "Verifique se o dispositivo tem a galeria disponível e trate o caso de erro.",
        "d": "Acesse a galeria sem pedir permissão, pois o usuário deve confiar no app."
      },
      "correta": "c",
      "explicacao": "É importante verificar se o recurso está disponível e tratar erros adequadamente, pois nem todos os dispositivos têm a galeria.",
      "fonte": "recursos.camera"
    },
    {
      "id": "mobile-int-14",
      "nivel": "intermediario",
      "pergunta": "Você deseja enviar notificações push para os usuários do seu app. Qual é um passo essencial que deve ser realizado antes de implementar essa funcionalidade?",
      "alternativas": {
        "a": "Registrar um identificador único do aparelho para enviar notificações.",
        "b": "Pedir permissão para enviar notificações apenas após o app ser instalado.",
        "c": "Implementar a lógica de envio de notificações sem considerar o servidor.",
        "d": "Enviar notificações sem aviso prévio, pois os usuários devem aceitar."
      },
      "correta": "a",
      "explicacao": "Registrar um identificador único do aparelho é essencial para enviar notificações push corretamente.",
      "fonte": "recursos.notificacoes"
    },
    {
      "id": "mobile-int-15",
      "nivel": "intermediario",
      "pergunta": "Você está programando um lembrete que deve ser agendado para o usuário. Qual é a prática recomendada ao implementar notificações locais?",
      "alternativas": {
        "a": "Agende a notificação sem pedir permissão, pois é uma funcionalidade básica.",
        "b": "Peça permissão para enviar notificações e agende a notificação local.",
        "c": "Agende a notificação e ignore a permissão, pois é desnecessária.",
        "d": "Envie notificações locais em excesso para garantir que o usuário veja."
      },
      "correta": "b",
      "explicacao": "É importante pedir permissão antes de enviar notificações, mesmo que sejam locais, para respeitar a experiência do usuário.",
      "fonte": "recursos.notificacoes"
    },
    {
      "id": "mobile-av-01",
      "nivel": "avancado",
      "pergunta": "Você está implementando testes em um app mobile. Para garantir que a lógica de um cálculo de total funcione corretamente sem interação da interface, qual tipo de teste você deve implementar?",
      "alternativas": {
        "a": "Teste de ponta a ponta",
        "b": "Teste de unidade",
        "c": "Teste de componente",
        "d": "Teste de integração"
      },
      "correta": "b",
      "explicacao": "O teste de unidade verifica a lógica pura, como cálculos, sem interagir com a interface do usuário.",
      "fonte": "qualidade.testes"
    },
    {
      "id": "mobile-av-02",
      "nivel": "avancado",
      "pergunta": "Seu app está apresentando lentidão ao rolar listas longas. Qual abordagem você deve adotar para melhorar a performance?",
      "alternativas": {
        "a": "Utilizar listas virtualizadas",
        "b": "Carregar todos os itens na memória",
        "c": "Realizar o processamento na thread principal",
        "d": "Otimizar imagens apenas depois da publicação"
      },
      "correta": "a",
      "explicacao": "Listas virtualizadas carregam apenas os itens visíveis, melhorando a performance e evitando travamentos.",
      "fonte": "qualidade.performance"
    },
    {
      "id": "mobile-av-03",
      "nivel": "avancado",
      "pergunta": "Durante a revisão do seu app na App Store, você percebe que a política de privacidade não está clara. O que você deve fazer para evitar a rejeição do app?",
      "alternativas": {
        "a": "Remover a política de privacidade",
        "b": "Adicionar uma política de privacidade clara e detalhada",
        "c": "Declarar que não coleta dados de usuários",
        "d": "Aguardar a revisão e corrigir depois"
      },
      "correta": "b",
      "explicacao": "Uma política de privacidade clara é obrigatória e evita que o app seja rejeitado na revisão.",
      "fonte": "publicacao.lojas"
    },
    {
      "id": "mobile-av-04",
      "nivel": "avancado",
      "pergunta": "Você precisa garantir que o app que está publicando seja reconhecido como seguro. O que você deve fazer?",
      "alternativas": {
        "a": "Assinar digitalmente o pacote final do app",
        "b": "Publicar sem assinatura para agilizar o processo",
        "c": "Usar uma chave de assinatura temporária",
        "d": "Ignorar a assinatura se o app funciona no emulador"
      },
      "correta": "a",
      "explicacao": "A assinatura digital garante que o app é legítimo e é um requisito para publicação nas lojas.",
      "fonte": "publicacao.build"
    },
    {
      "id": "mobile-av-05",
      "nivel": "avancado",
      "pergunta": "Após implementar testes de unidade, você deseja verificar se um componente da interface está funcionando corretamente. Qual teste você deve utilizar?",
      "alternativas": {
        "a": "Teste de ponta a ponta",
        "b": "Teste de componente",
        "c": "Teste de unidade",
        "d": "Teste de integração"
      },
      "correta": "b",
      "explicacao": "O teste de componente verifica se um pedaço da interface funciona corretamente em isolamento.",
      "fonte": "qualidade.testes"
    },
    {
      "id": "mobile-av-06",
      "nivel": "avancado",
      "pergunta": "Seu app está com um tamanho excessivo e você deseja otimizá-lo. Qual prática deve ser seguida para reduzir o tamanho do app?",
      "alternativas": {
        "a": "Remover imagens não utilizadas",
        "b": "Adicionar mais recursos ao app",
        "c": "Duplicar arquivos de imagem para melhor qualidade",
        "d": "Aumentar o número de dependências"
      },
      "correta": "a",
      "explicacao": "Remover imagens não utilizadas ajuda a reduzir o tamanho do app e melhora a experiência do usuário.",
      "fonte": "qualidade.performance"
    },
    {
      "id": "mobile-av-07",
      "nivel": "avancado",
      "pergunta": "Você está preparando o material para publicação na Play Store. O que é essencial incluir na ficha do app?",
      "alternativas": {
        "a": "Um ícone e uma descrição do app",
        "b": "Somente a descrição do app",
        "c": "Apenas capturas de tela",
        "d": "Um ícone, mas sem descrição"
      },
      "correta": "a",
      "explicacao": "É essencial incluir ícone e descrição para que os usuários entendam o que o app oferece.",
      "fonte": "publicacao.lojas"
    },
    {
      "id": "mobile-av-08",
      "nivel": "avancado",
      "pergunta": "Ao gerar a versão final do seu app, qual é o primeiro passo que você deve seguir?",
      "alternativas": {
        "a": "Criar a ficha do app na loja",
        "b": "Gerar o pacote final do app",
        "c": "Enviar o pacote para a loja",
        "d": "Preencher as informações de privacidade"
      },
      "correta": "b",
      "explicacao": "O primeiro passo é gerar o pacote final do app, que é a versão pronta para publicação.",
      "fonte": "publicacao.build"
    },
    {
      "id": "mobile-av-09",
      "nivel": "avancado",
      "pergunta": "Você está testando um fluxo completo do seu app, como o login. Qual tipo de teste você deve realizar?",
      "alternativas": {
        "a": "Teste de unidade",
        "b": "Teste de componente",
        "c": "Teste de ponta a ponta",
        "d": "Teste de integração"
      },
      "correta": "c",
      "explicacao": "O teste de ponta a ponta simula o usuário percorrendo um fluxo completo, como o login.",
      "fonte": "qualidade.testes"
    },
    {
      "id": "mobile-av-10",
      "nivel": "avancado",
      "pergunta": "Você quer garantir que seu app respeite a privacidade dos usuários. O que deve ser feito durante o design do app?",
      "alternativas": {
        "a": "Declarar quais dados são coletados e por quê",
        "b": "Coletar dados sem informar os usuários",
        "c": "Ignorar a privacidade até a publicação",
        "d": "Usar dados de usuários apenas para testes internos"
      },
      "correta": "a",
      "explicacao": "Declarar quais dados são coletados e por quê é essencial para atender às exigências das lojas.",
      "fonte": "publicacao.lojas"
    },
    {
      "id": "mobile-av-11",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um app offline-first e precisa garantir que os dados sejam salvos localmente quando o usuário está sem internet. Qual abordagem você deve seguir para garantir que nenhuma informação seja perdida?",
      "alternativas": {
        "a": "Utilizar o armazenamento local para salvar as alterações imediatamente e sincronizar com o servidor quando a conexão voltar.",
        "b": "Salvar as alterações em uma variável temporária até que a conexão seja restabelecida.",
        "c": "Armazenar os dados apenas na memória do aplicativo, já que ele funcionará offline.",
        "d": "Não permitir que o usuário faça alterações enquanto estiver offline, para evitar conflitos."
      },
      "correta": "a",
      "explicacao": "A alternativa correta é a letra a, pois usar o armazenamento local garante que as alterações sejam persistidas mesmo sem conexão, evitando a perda de dados.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "mobile-av-12",
      "nivel": "avancado",
      "pergunta": "Você está criando um portfólio para se candidatar a vagas na área mobile. Qual estratégia é mais eficaz para demonstrar suas habilidades e atrair recrutadores?",
      "alternativas": {
        "a": "Publicar um app completo que você desenvolveu, com documentação clara no GitHub, mostrando telas e explicando a funcionalidade.",
        "b": "Criar vários pequenos projetos, mas não publicá-los, apenas compartilhar o código no GitHub.",
        "c": "Focar em um único projeto complexo e não documentá-lo, já que o código é o mais importante.",
        "d": "Desenvolver apps apenas para simulação, sem publicá-los, pois isso não é necessário."
      },
      "correta": "a",
      "explicacao": "A alternativa correta é a letra a, pois ter um app completo e publicado, com documentação, mostra a capacidade prática e atrai a atenção dos recrutadores.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "mobile-av-13",
      "nivel": "avancado",
      "pergunta": "Ao desenvolver um app que consome uma API, você percebe que a conexão com a internet é intermitente. Qual é a melhor prática para lidar com essa situação?",
      "alternativas": {
        "a": "Implementar um sistema de cache para armazenar os dados recebidos da API e permitir acesso offline.",
        "b": "Desenvolver o app sem considerar a conexão, já que a maioria dos usuários terá internet.",
        "c": "Mostrar uma tela de erro sempre que a conexão falhar, sem oferecer alternativas ao usuário.",
        "d": "Desabilitar todas as funcionalidades do app até que a conexão seja restabelecida."
      },
      "correta": "a",
      "explicacao": "A alternativa correta é a letra a, pois implementar um sistema de cache permite que o usuário acesse dados mesmo sem conexão, melhorando a experiência do usuário.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "mobile-av-14",
      "nivel": "avancado",
      "pergunta": "Você está prestes a publicar seu primeiro app na loja. O que deve ser feito para garantir que ele seja aceito sem problemas?",
      "alternativas": {
        "a": "Seguir todos os requisitos de build e assinatura, e preparar uma descrição clara e completa do app.",
        "b": "Publicar o app sem testar, pois o feedback dos usuários ajudará a melhorar.",
        "c": "Ignorar as diretrizes da loja, já que você sabe que seu app é bom.",
        "d": "Publicar apenas com um ícone e sem descrição, já que os usuários baixarão pelo nome."
      },
      "correta": "a",
      "explicacao": "A alternativa correta é a letra a, pois seguir os requisitos de build e ter uma descrição clara são essenciais para a aceitação na loja.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "mobile-av-15",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um app e precisa escolher a stack. Qual critério deve guiar sua decisão entre uma stack multiplataforma e uma nativa?",
      "alternativas": {
        "a": "Escolher pela afinidade com a linguagem e pelas oportunidades de emprego disponíveis na sua área.",
        "b": "Optar sempre pela stack nativa, pois é a única que garante performance.",
        "c": "Escolher a stack multiplataforma, pois é a única que permite desenvolver para ambos os sistemas operacionais.",
        "d": "Decidir pela stack nativa, independentemente do seu conhecimento prévio."
      },
      "correta": "a",
      "explicacao": "A alternativa correta é a letra a, pois escolher pela afinidade e pelas oportunidades disponíveis é fundamental para o sucesso na carreira.",
      "fonte": "carreira.entrar"
    }
  ]
};

export default pool;
