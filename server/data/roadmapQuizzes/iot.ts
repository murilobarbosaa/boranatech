// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool iot). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "iot",
  "questions": [
    {
      "id": "iot-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo um sistema para monitorar a temperatura de um ambiente. Qual é a principal função dos sensores nesse contexto?",
      "alternativas": {
        "a": "Medir a temperatura e enviar dados para o microcontrolador.",
        "b": "Controlar a temperatura do ambiente diretamente.",
        "c": "Armazenar os dados de temperatura para uso futuro.",
        "d": "Conectar o sistema à internet para monitoramento remoto."
      },
      "correta": "a",
      "explicacao": "Os sensores têm a função de medir a temperatura e enviar esses dados ao microcontrolador para processamento.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "iot-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você precisa otimizar um código para um microcontrolador que controla um motor. O que deve ser sua prioridade?",
      "alternativas": {
        "a": "Reduzir o número de linhas de código para facilitar a leitura.",
        "b": "Minimizar o uso de memória e ciclos de processamento.",
        "c": "Adicionar comentários detalhados em cada função do código.",
        "d": "Usar uma linguagem de programação mais simples que C."
      },
      "correta": "b",
      "explicacao": "Minimizar o uso de memória e ciclos de processamento é essencial em sistemas embarcados devido aos recursos limitados dos microcontroladores.",
      "fonte": "fundamentos.diferenca"
    },
    {
      "id": "iot-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você está programando um dispositivo que deve responder rapidamente a eventos físicos, como um sensor de movimento. O que é crucial para garantir essa resposta?",
      "alternativas": {
        "a": "Usar um sistema operacional complexo para gerenciar as tarefas.",
        "b": "Assegurar que o código seja executado em tempo real e diretamente no hardware.",
        "c": "Implementar uma interface gráfica para facilitar o controle.",
        "d": "Conectar o dispositivo a um servidor para processamento de dados."
      },
      "correta": "b",
      "explicacao": "Garantir que o código seja executado em tempo real e diretamente no hardware é crucial para a resposta rápida a eventos físicos.",
      "fonte": "fundamentos.diferenca"
    },
    {
      "id": "iot-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você está projetando um sistema embarcado para um eletrodoméstico. Qual é a principal diferença em relação a um software comum?",
      "alternativas": {
        "a": "O software embarcado não precisa interagir com o hardware.",
        "b": "O software embarcado deve ser otimizado para recursos limitados.",
        "c": "O software embarcado é mais fácil de depurar.",
        "d": "O software embarcado não precisa se preocupar com o tempo de resposta."
      },
      "correta": "b",
      "explicacao": "O software embarcado deve ser otimizado para recursos limitados, ao contrário do software comum que geralmente tem mais recursos disponíveis.",
      "fonte": "fundamentos.diferenca"
    },
    {
      "id": "iot-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo um relógio inteligente. Qual é a função dos atuadores nesse dispositivo?",
      "alternativas": {
        "a": "Controlar a interface do usuário na tela.",
        "b": "Realizar ações físicas, como vibrar ou acender luzes.",
        "c": "Conectar o relógio à internet para atualizações.",
        "d": "Medir a frequência cardíaca do usuário."
      },
      "correta": "b",
      "explicacao": "Os atuadores realizam ações físicas, como vibrar ou acender luzes, que são essenciais para a interação do usuário com o dispositivo.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "iot-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você está programando um sensor de luz que deve acender uma lâmpada quando escurece. O que é importante considerar na programação?",
      "alternativas": {
        "a": "A lâmpada deve ser controlada diretamente pelo sensor sem um microcontrolador.",
        "b": "O código deve ser otimizado para responder rapidamente às mudanças de luz.",
        "c": "O sensor não precisa ser calibrado antes de ser usado.",
        "d": "A comunicação entre o sensor e a lâmpada deve ser feita via internet."
      },
      "correta": "b",
      "explicacao": "O código deve ser otimizado para responder rapidamente às mudanças de luz, garantindo que a lâmpada acenda no momento certo.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "iot-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você está montando um circuito simples com um LED e precisa garantir que ele não queime. O que você deve fazer?",
      "alternativas": {
        "a": "Usar um resistor para limitar a corrente que passa pelo LED.",
        "b": "Conectar o LED diretamente à fonte de energia.",
        "c": "Usar um capacitor para aumentar a tensão no LED.",
        "d": "Conectar o LED em paralelo com outros componentes."
      },
      "correta": "a",
      "explicacao": "Usar um resistor é essencial para limitar a corrente e evitar que o LED queime.",
      "fonte": "bases.eletronica"
    },
    {
      "id": "iot-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você está programando um microcontrolador e precisa manipular diretamente a memória. Qual recurso da linguagem C você deve usar?",
      "alternativas": {
        "a": "Variáveis.",
        "b": "Ponteiros.",
        "c": "Funções.",
        "d": "Estruturas."
      },
      "correta": "b",
      "explicacao": "Os ponteiros permitem acesso direto à memória, essencial para controle em sistemas embarcados.",
      "fonte": "bases.c"
    },
    {
      "id": "iot-ini-09",
      "nivel": "iniciante",
      "pergunta": "Ao ler um sensor de temperatura, você percebe que os valores estão variando continuamente. Que tipo de sinal o sensor está enviando?",
      "alternativas": {
        "a": "Sinal digital.",
        "b": "Sinal analógico.",
        "c": "Sinal de pulso.",
        "d": "Sinal de frequência."
      },
      "correta": "b",
      "explicacao": "Sinais analógicos variam continuamente, representando medições como temperatura.",
      "fonte": "bases.eletronica"
    },
    {
      "id": "iot-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você precisa de um código que ligue um LED quando um botão é pressionado. Qual estrutura de controle em C é mais adequada para isso?",
      "alternativas": {
        "a": "Um laço for.",
        "b": "Uma condição if.",
        "c": "Uma função void.",
        "d": "Um ponteiro."
      },
      "correta": "b",
      "explicacao": "A condição if é ideal para verificar se o botão está pressionado e ligar o LED.",
      "fonte": "bases.c"
    },
    {
      "id": "iot-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você está usando uma protoboard para montar um circuito. Qual é a principal vantagem desse método?",
      "alternativas": {
        "a": "Permite soldar componentes permanentemente.",
        "b": "Facilita a montagem e a modificação de circuitos.",
        "c": "Garante que todos os circuitos funcionem perfeitamente.",
        "d": "Evita que você precise usar ferramentas de diagnóstico."
      },
      "correta": "b",
      "explicacao": "A protoboard permite montar e modificar circuitos de forma rápida e fácil.",
      "fonte": "bases.eletronica"
    },
    {
      "id": "iot-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você quer garantir que seu código em C seja eficiente em um microcontrolador. O que você deve evitar?",
      "alternativas": {
        "a": "Usar ponteiros para manipulação de dados.",
        "b": "Usar variáveis de tamanho inadequado.",
        "c": "Usar laços para repetir ações.",
        "d": "Usar funções para organizar o código."
      },
      "correta": "b",
      "explicacao": "Usar variáveis de tamanho inadequado pode levar a desperdício de memória, o que é crítico em microcontroladores.",
      "fonte": "bases.c"
    },
    {
      "id": "iot-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um projeto com Arduino e precisa que um LED acenda quando um botão é pressionado. Qual a melhor forma de implementar isso?",
      "alternativas": {
        "a": "Usar um pino digital para o LED e um pino digital para o botão, lendo o estado do botão em loop.",
        "b": "Conectar o LED a um pino analógico e o botão a um pino digital, lendo o valor analógico para acender o LED.",
        "c": "Programar o LED para acender apenas uma vez, quando o botão for pressionado, sem verificar o estado novamente.",
        "d": "Utilizar um pino digital para o LED e um pino analógico para o botão, verificando a tensão do botão."
      },
      "correta": "a",
      "explicacao": "A alternativa correta usa pinos digitais para ambos, permitindo um controle eficiente do LED em resposta ao botão, sem complicações desnecessárias.",
      "fonte": "microcontroladores.arduino"
    },
    {
      "id": "iot-int-02",
      "nivel": "intermediario",
      "pergunta": "Você está criando um sistema que deve ler a intensidade de luz de um sensor e ajustar a intensidade de um LED em resposta. Qual abordagem é a mais adequada?",
      "alternativas": {
        "a": "Usar um pino analógico para ler a intensidade de luz e um pino PWM para controlar o brilho do LED.",
        "b": "Conectar o sensor de luz a um pino digital e o LED a um pino analógico para controle de brilho.",
        "c": "Ler a intensidade de luz com um pino digital e acionar o LED em um pino digital, sem ajuste de brilho.",
        "d": "Utilizar um pino PWM para ler a intensidade de luz e um pino digital para controlar o LED."
      },
      "correta": "a",
      "explicacao": "A alternativa correta permite a leitura precisa da intensidade de luz com um pino analógico e o controle de brilho do LED através de PWM, garantindo uma resposta adequada.",
      "fonte": "microcontroladores.gpio"
    },
    {
      "id": "iot-int-03",
      "nivel": "intermediario",
      "pergunta": "Você precisa que seu microcontrolador execute um código que deve rodar continuamente após a inicialização. Qual estrutura de código você deve usar?",
      "alternativas": {
        "a": "Uma função que é chamada uma vez e depois termina o programa.",
        "b": "Uma função de configuração seguida de um loop infinito que executa o código repetidamente.",
        "c": "Um código que roda uma vez e aguarda um evento para reiniciar o programa.",
        "d": "Uma função que roda em um intervalo de tempo fixo, sem loop infinito."
      },
      "correta": "b",
      "explicacao": "A alternativa correta descreve a estrutura típica de um programa em Arduino, onde uma função de configuração é seguida por um loop que executa continuamente.",
      "fonte": "microcontroladores.arduino"
    },
    {
      "id": "iot-int-04",
      "nivel": "intermediario",
      "pergunta": "Você está programando um microcontrolador e precisa garantir que um motor seja acionado apenas quando um botão específico for pressionado. Qual a melhor prática?",
      "alternativas": {
        "a": "Ler o estado do botão em loop e acionar o motor diretamente quando o botão estiver pressionado.",
        "b": "Acionar o motor uma vez e esperar que o botão seja pressionado novamente para desligá-lo.",
        "c": "Utilizar um pino analógico para o botão e um pino digital para o motor, sem controle de estado.",
        "d": "Ler o estado do botão apenas uma vez no início e acionar o motor baseado nessa leitura."
      },
      "correta": "a",
      "explicacao": "A alternativa correta garante que o motor seja acionado em resposta ao estado do botão, permitindo controle contínuo e responsivo.",
      "fonte": "microcontroladores.gpio"
    },
    {
      "id": "iot-int-05",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um sistema que precisa medir a temperatura e acionar um ventilador se a temperatura ultrapassar um limite. Qual é a melhor prática para integrar o sensor e o atuador nesse projeto?",
      "alternativas": {
        "a": "Usar um sensor de temperatura com uma biblioteca adequada e conectar um relé ao ventilador.",
        "b": "Conectar o ventilador diretamente ao sensor de temperatura para que ele ligue automaticamente.",
        "c": "Utilizar um sensor de temperatura e um motor DC sem controle, apenas acionando-o manualmente.",
        "d": "Instalar um sensor de temperatura e usar um display para mostrar a temperatura, sem acionar o ventilador."
      },
      "correta": "a",
      "explicacao": "A alternativa correta é usar um sensor de temperatura com uma biblioteca adequada e conectar um relé ao ventilador, pois isso permite automatizar a ação com base na leitura do sensor.",
      "fonte": "sensores.sensores"
    },
    {
      "id": "iot-int-06",
      "nivel": "intermediario",
      "pergunta": "Você precisa conectar vários sensores de um projeto IoT ao microcontrolador. Qual protocolo de comunicação é mais indicado para essa situação?",
      "alternativas": {
        "a": "Usar o protocolo SPI, pois ele é mais simples e permite conectar vários dispositivos com menos fios.",
        "b": "Utilizar o protocolo I2C, que permite conectar múltiplos dispositivos com apenas dois fios.",
        "c": "Escolher o protocolo serial, pois ele é o mais comum e fácil de implementar.",
        "d": "Optar por uma conexão direta fio a fio, pois isso garante maior controle sobre cada sensor."
      },
      "correta": "b",
      "explicacao": "O protocolo I2C é indicado para conectar múltiplos dispositivos com apenas dois fios, o que é eficiente em projetos IoT com vários sensores.",
      "fonte": "sensores.protocolos"
    },
    {
      "id": "iot-int-07",
      "nivel": "intermediario",
      "pergunta": "Em um projeto de automação de irrigação, você quer monitorar a umidade do solo e acionar uma bomba. Qual abordagem é a mais eficiente?",
      "alternativas": {
        "a": "Instalar um sensor de umidade e conectar a bomba diretamente ao sensor, acionando-a manualmente.",
        "b": "Usar um sensor de umidade com uma biblioteca e um relé para controlar a bomba automaticamente.",
        "c": "Conectar a bomba ao microcontrolador sem usar um sensor, acionando-a em horários fixos.",
        "d": "Utilizar um sensor de umidade e um display para monitorar a umidade, sem acionar a bomba."
      },
      "correta": "b",
      "explicacao": "A abordagem mais eficiente é usar um sensor de umidade com uma biblioteca e um relé para controlar a bomba automaticamente, permitindo a irrigação conforme necessário.",
      "fonte": "sensores.sensores"
    },
    {
      "id": "iot-int-08",
      "nivel": "intermediario",
      "pergunta": "Você está enfrentando problemas de comunicação entre um sensor e o microcontrolador. Qual é a primeira coisa que você deve verificar se estiver usando o protocolo I2C?",
      "alternativas": {
        "a": "Se o endereço do sensor está correto e se não há conflito com outros dispositivos na rede.",
        "b": "Se o sensor está conectado corretamente e se a alimentação está funcionando.",
        "c": "Se o código está correto e se o microcontrolador está atualizado.",
        "d": "Se o protocolo SPI é mais adequado para a aplicação."
      },
      "correta": "a",
      "explicacao": "A primeira coisa a verificar ao usar o protocolo I2C é se o endereço do sensor está correto e se não há conflito com outros dispositivos na rede, pois isso pode causar falhas na comunicação.",
      "fonte": "sensores.protocolos"
    },
    {
      "id": "iot-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um projeto de IoT com ESP32 e precisa enviar dados de um sensor para a nuvem. Qual abordagem você deve usar para garantir que o dispositivo se conecte à internet de forma eficaz?",
      "alternativas": {
        "a": "Utilizar um módulo Wi-Fi separado para conectar o ESP32 à internet.",
        "b": "Programar o ESP32 para se conectar diretamente à rede Wi-Fi usando suas funcionalidades embutidas.",
        "c": "Conectar o ESP32 a um computador via USB e enviar os dados manualmente.",
        "d": "Utilizar um Arduino para gerenciar a conexão do ESP32 com a internet."
      },
      "correta": "b",
      "explicacao": "O ESP32 já vem com Wi-Fi embutido, permitindo que você se conecte diretamente à rede sem a necessidade de módulos adicionais.",
      "fonte": "conectividade.esp32"
    },
    {
      "id": "iot-int-10",
      "nivel": "intermediario",
      "pergunta": "Você está criando um sistema IoT que precisa enviar dados de temperatura a um serviço na nuvem. Qual protocolo você deve escolher para garantir uma comunicação leve e eficiente?",
      "alternativas": {
        "a": "HTTP, pois é amplamente utilizado e fácil de implementar.",
        "b": "MQTT, que é leve e ideal para dispositivos com recursos limitados.",
        "c": "WebSocket, que oferece comunicação em tempo real.",
        "d": "FTP, que é bom para transferências de arquivos grandes."
      },
      "correta": "b",
      "explicacao": "O MQTT foi projetado para IoT, sendo leve e eficiente, ideal para dispositivos que precisam economizar banda e energia.",
      "fonte": "conectividade.mqtt"
    },
    {
      "id": "iot-int-11",
      "nivel": "intermediario",
      "pergunta": "Antes de colocar um dispositivo IoT na rede, qual é a primeira ação que você deve realizar para garantir a segurança do dispositivo?",
      "alternativas": {
        "a": "Configurar um firewall para bloquear acessos indesejados.",
        "b": "Trocar a senha padrão de fábrica por uma senha forte.",
        "c": "Desativar todas as portas de comunicação do dispositivo.",
        "d": "Instalar um software antivírus no dispositivo."
      },
      "correta": "b",
      "explicacao": "Trocar a senha padrão de fábrica é uma medida básica e essencial para proteger o dispositivo contra acessos não autorizados.",
      "fonte": "conectividade.seguranca"
    },
    {
      "id": "iot-int-12",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um projeto com ESP32 e precisa integrar múltiplos sensores que enviam dados para um servidor. Como o MQTT facilita essa integração?",
      "alternativas": {
        "a": "Permite que cada sensor se conecte diretamente ao servidor, evitando a sobrecarga no broker.",
        "b": "Usa um modelo de publicação e assinatura, desacoplando os dispositivos e facilitando a escalabilidade.",
        "c": "Exige que todos os sensores compartilhem a mesma conexão Wi-Fi para enviar dados.",
        "d": "Necessita que cada sensor tenha um endereço IP único para se comunicar com o servidor."
      },
      "correta": "b",
      "explicacao": "O MQTT permite que dispositivos publiquem dados em tópicos, que podem ser assinados por outros dispositivos, facilitando a comunicação e escalabilidade.",
      "fonte": "conectividade.mqtt"
    },
    {
      "id": "iot-int-13",
      "nivel": "intermediario",
      "pergunta": "Você está projetando um dispositivo IoT que ficará exposto ao ambiente. Qual é uma prática recomendada para garantir a segurança do dispositivo?",
      "alternativas": {
        "a": "Manter a comunicação em texto puro para facilitar a depuração.",
        "b": "Cifrar a comunicação para proteger os dados transmitidos.",
        "c": "Usar senhas simples para facilitar o acesso remoto.",
        "d": "Desativar atualizações de firmware para evitar falhas."
      },
      "correta": "b",
      "explicacao": "Cifrar a comunicação é essencial para proteger os dados transmitidos, evitando que informações sensíveis sejam interceptadas.",
      "fonte": "conectividade.seguranca"
    },
    {
      "id": "iot-int-14",
      "nivel": "intermediario",
      "pergunta": "Você está migrando de um Arduino para um ESP32 para um projeto IoT. Qual é uma das principais vantagens que você ganha ao fazer essa transição?",
      "alternativas": {
        "a": "A capacidade de programar em linguagens diferentes do Arduino.",
        "b": "A inclusão de Wi-Fi e Bluetooth embutidos no ESP32.",
        "c": "Aumentar o número de componentes necessários para a conexão à internet.",
        "d": "A necessidade de aprender uma nova IDE completamente diferente."
      },
      "correta": "b",
      "explicacao": "O ESP32 vem com Wi-Fi e Bluetooth embutidos, permitindo conectividade sem a necessidade de componentes adicionais.",
      "fonte": "conectividade.esp32"
    },
    {
      "id": "iot-int-15",
      "nivel": "intermediario",
      "pergunta": "Você deseja que seu dispositivo IoT publique dados de forma eficiente e receba comandos de forma remota. Qual é o papel do broker no protocolo MQTT nesse contexto?",
      "alternativas": {
        "a": "Ele armazena os dados dos dispositivos e os envia para a nuvem.",
        "b": "Ele é responsável por gerenciar as conexões diretas entre os dispositivos.",
        "c": "Ele atua como intermediário, recebendo mensagens publicadas e enviando-as aos assinantes.",
        "d": "Ele substitui a necessidade de um servidor na nuvem."
      },
      "correta": "c",
      "explicacao": "O broker MQTT atua como intermediário, permitindo que dispositivos publiquem dados e que outros dispositivos assinem esses dados automaticamente.",
      "fonte": "conectividade.mqtt"
    },
    {
      "id": "iot-av-01",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um sensor remoto que deve operar por meses sem troca de bateria. Qual técnica você deve priorizar para garantir a viabilidade do produto?",
      "alternativas": {
        "a": "Implementar um modo de baixo consumo, onde o dispositivo dorme quando não está em uso.",
        "b": "Aumentar a frequência de comunicação para garantir que os dados sejam enviados rapidamente.",
        "c": "Usar componentes que consomem mais energia para melhorar a performance do sensor.",
        "d": "Deixar o dispositivo sempre ligado para evitar problemas de conexão."
      },
      "correta": "a",
      "explicacao": "Implementar um modo de baixo consumo é essencial para prolongar a vida útil da bateria em dispositivos que devem operar por longos períodos sem troca.",
      "fonte": "avancado.recursos"
    },
    {
      "id": "iot-av-02",
      "nivel": "avancado",
      "pergunta": "Você está programando um microcontrolador e percebe que a memória está se esgotando rapidamente. O que você deve fazer para otimizar o uso da memória?",
      "alternativas": {
        "a": "Utilizar tipos de dados menores sempre que possível, evitando o uso de variáveis grandes desnecessárias.",
        "b": "Aumentar a quantidade de memória do microcontrolador para evitar problemas de estouro.",
        "c": "Alocar memória dinamicamente sempre que necessário, sem se preocupar com a liberação.",
        "d": "Utilizar arrays grandes para armazenar dados temporários, mesmo que não sejam todos utilizados."
      },
      "correta": "a",
      "explicacao": "Utilizar tipos de dados menores ajuda a otimizar a memória, evitando desperdícios e problemas como estouro.",
      "fonte": "avancado.recursos"
    },
    {
      "id": "iot-av-03",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um projeto que requer a execução de múltiplas tarefas simultaneamente em um microcontrolador. Qual abordagem você deve usar?",
      "alternativas": {
        "a": "Implementar um RTOS para gerenciar as tarefas e garantir que as mais urgentes sejam executadas no tempo certo.",
        "b": "Executar todas as tarefas em um único loop, priorizando as mais importantes.",
        "c": "Criar threads manualmente para cada tarefa, sem um sistema de gerenciamento.",
        "d": "Utilizar interrupções para cada tarefa, sem considerar a organização do código."
      },
      "correta": "a",
      "explicacao": "Um RTOS é ideal para gerenciar múltiplas tarefas simultaneamente, garantindo que as mais urgentes sejam executadas no tempo certo.",
      "fonte": "avancado.rtos"
    },
    {
      "id": "iot-av-04",
      "nivel": "avancado",
      "pergunta": "Durante a depuração de um dispositivo embarcado, você nota que ele não está respondendo corretamente. Qual ferramenta você deve usar para investigar problemas de sinal elétrico?",
      "alternativas": {
        "a": "Um multímetro para verificar as tensões nas conexões.",
        "b": "Um osciloscópio para visualizar sinais elétricos que variam rapidamente.",
        "c": "Um analisador lógico para monitorar a comunicação serial.",
        "d": "Um gerador de sinais para testar a resposta do dispositivo."
      },
      "correta": "b",
      "explicacao": "Um osciloscópio é essencial para visualizar sinais elétricos que mudam rapidamente, ajudando a identificar problemas de hardware.",
      "fonte": "avancado.rtos"
    },
    {
      "id": "iot-av-05",
      "nivel": "avancado",
      "pergunta": "Você está testando um novo sensor em um projeto embarcado e ele está retornando valores incorretos. Qual abordagem você deve tomar para identificar o problema?",
      "alternativas": {
        "a": "Verificar a alimentação do sensor e as conexões físicas.",
        "b": "Reescrever o código do sensor para garantir que está correto.",
        "c": "Substituir o sensor por outro modelo mais caro.",
        "d": "Ignorar o problema e continuar com o desenvolvimento."
      },
      "correta": "a",
      "explicacao": "Verificar a alimentação e as conexões é fundamental para identificar problemas de hardware que podem afetar o funcionamento do sensor.",
      "fonte": "avancado.rtos"
    },
    {
      "id": "iot-av-06",
      "nivel": "avancado",
      "pergunta": "Você precisa otimizar o consumo de energia de um dispositivo que deve operar em modo de espera a maior parte do tempo. O que você deve implementar?",
      "alternativas": {
        "a": "Desligar componentes não utilizados quando o dispositivo está em modo de espera.",
        "b": "Aumentar a frequência de operação para reduzir o tempo em que o dispositivo está ativo.",
        "c": "Deixar todos os componentes sempre ligados para evitar falhas.",
        "d": "Utilizar um modo de operação contínuo para garantir que não haja interrupções."
      },
      "correta": "a",
      "explicacao": "Desligar componentes não utilizados é uma prática recomendada para otimizar o consumo de energia em dispositivos embarcados.",
      "fonte": "avancado.recursos"
    },
    {
      "id": "iot-av-07",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo uma estação de monitoramento e precisa garantir a segurança do dispositivo. Qual é a melhor prática ao conectar o dispositivo à rede?",
      "alternativas": {
        "a": "Usar uma senha forte e mudar a senha padrão do dispositivo.",
        "b": "Conectar o dispositivo sem senha para facilitar o acesso remoto.",
        "c": "Desativar a comunicação cifrada para melhorar a velocidade de conexão.",
        "d": "Usar a mesma senha de outros dispositivos na rede para não esquecer."
      },
      "correta": "a",
      "explicacao": "A melhor prática é usar uma senha forte e mudar a senha padrão, garantindo a segurança do dispositivo na rede.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "iot-av-08",
      "nivel": "avancado",
      "pergunta": "Você está construindo um projeto de IoT e precisa enviar dados de sensores para a nuvem. Qual protocolo deve ser utilizado para garantir uma comunicação leve e eficiente?",
      "alternativas": {
        "a": "HTTP, pois é amplamente utilizado e fácil de implementar.",
        "b": "MQTT, que é otimizado para comunicação em dispositivos com recursos limitados.",
        "c": "FTP, que permite transferir arquivos grandes rapidamente.",
        "d": "WebSocket, que é ideal para comunicação em tempo real."
      },
      "correta": "b",
      "explicacao": "O MQTT é otimizado para comunicação em dispositivos com recursos limitados, tornando-o ideal para projetos de IoT.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "iot-av-09",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um projeto de automação com ESP32 e sensores. Qual é a abordagem recomendada para validar os sensores antes de integrá-los ao sistema?",
      "alternativas": {
        "a": "Conectar todos os sensores de uma vez e testar o sistema completo.",
        "b": "Testar cada sensor individualmente antes de conectá-los ao sistema.",
        "c": "Ignorar a validação, pois todos os sensores são iguais.",
        "d": "Usar sensores de diferentes fabricantes sem verificar a compatibilidade."
      },
      "correta": "b",
      "explicacao": "A abordagem recomendada é testar cada sensor individualmente para garantir que funcionem corretamente antes de integrá-los ao sistema.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "iot-av-10",
      "nivel": "avancado",
      "pergunta": "Ao iniciar na área de IoT e sistemas embarcados, qual é a melhor forma de construir um portfólio convincente?",
      "alternativas": {
        "a": "Documentar apenas o código no GitHub, sem mostrar o hardware.",
        "b": "Construir projetos físicos reais e documentar o processo completo.",
        "c": "Focar apenas em teoria e conceitos, evitando projetos práticos.",
        "d": "Usar projetos de outras pessoas e apresentar como seus."
      },
      "correta": "b",
      "explicacao": "Construir projetos físicos reais e documentar o processo completo é a melhor forma de criar um portfólio convincente na área de IoT.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "iot-av-11",
      "nivel": "avancado",
      "pergunta": "Você deseja aprender sobre sistemas embarcados e IoT. Qual é a abordagem mais eficaz para adquirir conhecimento prático?",
      "alternativas": {
        "a": "Assistir a vídeos teóricos sem praticar com hardware.",
        "b": "Construir projetos simples com Arduino e evoluir para o ESP32.",
        "c": "Ler livros sobre eletrônica sem realizar experimentos práticos.",
        "d": "Focar apenas em programação, ignorando a parte de hardware."
      },
      "correta": "b",
      "explicacao": "Construir projetos simples com Arduino e evoluir para o ESP32 é a abordagem mais eficaz para adquirir conhecimento prático na área de IoT.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "iot-av-12",
      "nivel": "avancado",
      "pergunta": "Você está se preparando para entrar na área de IoT. Qual qualidade é essencial para lidar com problemas que envolvem hardware e software?",
      "alternativas": {
        "a": "Apressar-se para encontrar soluções rápidas.",
        "b": "Ter paciência para depurar problemas complexos.",
        "c": "Ignorar os erros e seguir em frente.",
        "d": "Depender apenas de tutoriais para resolver problemas."
      },
      "correta": "b",
      "explicacao": "Ter paciência para depurar problemas complexos é essencial para lidar com os desafios que envolvem hardware e software na área de IoT.",
      "fonte": "carreira.entrar"
    }
  ]
};

export default pool;
