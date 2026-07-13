import type { RoadmapV2 } from "../types";

export const iot: RoadmapV2 = {
  slug: "iot",
  area: "iot",
  title: "IoT e Sistemas Embarcados do Zero",
  level: "Iniciante",
  description:
    "De C e eletrônica básica a microcontroladores, sensores, conectividade e projetos de IoT conectados à nuvem. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é programar dispositivos físicos e por que isso é diferente de programar software comum.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é IoT e sistemas embarcados",
          description:
            "O software que roda dentro de objetos físicos e os conecta à internet.",
          content:
            "Sistemas embarcados são o software que roda **dentro de dispositivos físicos**: uma máquina de café, um carro, um sensor industrial, um relógio inteligente, um eletrodoméstico. Diferente de um aplicativo que roda num computador ou celular de uso geral, esse software vive dentro de um aparelho dedicado a uma função, controlando o hardware diretamente. A **IoT** (Internet das Coisas) é a extensão disso: esses dispositivos conectados à internet, trocando dados e sendo controlados remotamente.\n\nO profissional da área programa **microcontroladores** (pequenos computadores dentro dos dispositivos), integra **sensores** (que medem o mundo: temperatura, luz, movimento) e **atuadores** (que agem sobre ele: motores, luzes, válvulas), cuida da comunicação entre dispositivos e com a internet, e otimiza o consumo de memória e energia, porque esses aparelhos costumam ter recursos limitados e às vezes funcionam a bateria.\n\nO que torna a área especial é a combinação de **programação com eletrônica e o mundo físico**. Você não escreve só código que manipula dados na tela; escreve código que faz uma luz acender, um motor girar, um alarme tocar. Ver o seu código controlando algo real é uma satisfação particular dessa área, que atrai quem gosta tanto de software quanto de mexer com coisas físicas.\n\nA demanda cresce com a expansão da IoT e da indústria 4.0 (fábricas conectadas e automatizadas), e a área tem salários competitivos. É um campo técnico que une dois mundos, e exige base de programação e curiosidade pelo hardware. Esta trilha te leva de C e eletrônica básica até um projeto de IoT completo conectado à nuvem.",
          resources: [
            {
              label: "Cisco Networking Academy: Introduction to IoT (gratuito)",
              url: "https://www.netacad.com/courses/iot",
              kind: "curso",
            },
          ],
        },
        {
          id: "fundamentos.diferenca",
          title: "Hardware e software juntos",
          description:
            "Por que programar embarcados é diferente, e o que isso exige de você.",
          content:
            "Programar sistemas embarcados é diferente de programar software comum em aspectos que moldam toda a área, e entendê-los cedo prepara a cabeça pro que vem.\n\nA primeira diferença são os **recursos limitados**. Um microcontrolador tem pouquíssima memória e poder de processamento perto de um computador, às vezes alguns kilobytes de memória. Você não pode desperdiçar; cada byte e cada ciclo contam. Isso explica por que a linguagem **C** domina a área (ela dá controle fino e é eficiente) e por que otimizar memória e energia é parte central do trabalho, não um detalhe.\n\nA segunda é que você programa **interagindo com o mundo físico** através de hardware. Seu código lê pinos elétricos, controla voltagens, conversa com chips. Isso significa que problemas podem estar tanto no software quanto no **hardware** (um fio solto, um componente queimado, ruído elétrico), e diagnosticar exige testar os dois juntos. A depuração é mais difícil: nem sempre há uma tela mostrando o erro, e às vezes você precisa de instrumentos como multímetro e osciloscópio pra ver o que está acontecendo nos circuitos.\n\nA terceira é a relação direta com o **tempo e o hardware real**. Em muitos casos, o dispositivo precisa reagir em tempo preciso (um airbag não pode atrasar), e o código roda direto sobre o hardware, às vezes sem nem um sistema operacional completo por baixo.\n\nO que isso exige de você: além de programar, ter **paciência pra depurar problemas de hardware** e disposição pra entender eletrônica. A boa notícia é que se aprende fazendo, e ter o componente físico na mão acelera tudo. A próxima seção começa pela base: a linguagem C e a eletrônica.",
        },
      ],
    },
    {
      id: "bases",
      title: "Bases técnicas",
      description:
        "Os dois alicerces da área: a linguagem do firmware e os fundamentos de eletrônica.",
      level: "iniciante",
      children: [
        {
          id: "bases.c",
          title: "Linguagem C",
          description:
            "A linguagem do firmware, que dá controle fino sobre o hardware.",
          content:
            "A linguagem **C** é a língua dos sistemas embarcados. A maior parte do **firmware** (o software que roda dentro dos dispositivos) é escrita em C, e em C++ pra projetos maiores. Aprender C de verdade é, segundo a própria área recomenda, o investimento mais importante pra quem quer trabalhar com embarcados.\n\nPor que C domina aqui? Porque ela dá **controle fino e eficiência**. Diferente de linguagens de alto nível que escondem o que acontece por baixo, C te coloca perto do hardware: você controla diretamente a memória, manipula bits, e gera código enxuto que cabe nos recursos apertados de um microcontrolador. Esse controle, que seria excesso de responsabilidade em outras áreas, é exatamente o que os embarcados precisam.\n\nO que dominar. Os fundamentos da linguagem: variáveis e tipos (com atenção aos tamanhos, que importam quando a memória é escassa), condicionais, laços, funções. E os conceitos que tornam C poderosa e perigosa: os **ponteiros** (referências diretas a posições de memória, centrais em C e fonte de muitos bugs), o **gerenciamento manual de memória**, e a manipulação de **bits** (ligar e desligar bits específicos, comum ao controlar hardware).\n\nC tem uma curva mais íngreme que linguagens modernas, justamente porque te dá mais controle e menos proteção. Mas em embarcados esse controle é necessário, e dominá-la abre as portas da área. Se você está começando do zero, vale construir bem a lógica de programação em paralelo. A documentação de referência da linguagem C é completa, e a melhor forma de aprender é praticando, idealmente já com um microcontrolador na mão pra ver o código controlando algo real.",
          resources: [
            {
              label: "cppreference: referência da linguagem C",
              url: "https://en.cppreference.com/w/c",
              kind: "doc",
            },
          ],
        },
        {
          id: "bases.eletronica",
          title: "Eletrônica básica",
          description:
            "O suficiente de eletrônica para entender e montar circuitos simples.",
          content:
            'Em embarcados, software e hardware andam juntos, então você precisa de uma base de **eletrônica**. Não precisa virar engenheiro eletrônico, mas precisa entender o suficiente pra montar circuitos simples, conectar componentes corretamente e diagnosticar quando algo não funciona.\n\nOs conceitos fundamentais. **Tensão, corrente e resistência**, a tríade básica que descreve como a eletricidade flui (a famosa Lei de Ohm relaciona as três, e entendê-la evita queimar componentes). Os componentes essenciais: resistores (que limitam corrente), LEDs (que acendem e são o "olá mundo" da eletrônica), capacitores, e como ligá-los. E a leitura de um **diagrama de circuito**, o esquema que mostra como tudo se conecta.\n\nNa prática, você trabalha muito com a **protoboard** (uma placa onde se montam circuitos sem solda, encaixando os componentes), ideal pra prototipar e experimentar. E aprende a usar ferramentas de diagnóstico: o **multímetro** (que mede tensão, corrente e continuidade, ajudando a achar fios soltos e problemas) e, mais adiante, o osciloscópio.\n\nUm conceito que conecta eletrônica e software são os **sinais digitais e analógicos**. Sinais digitais são ligado/desligado (1 ou 0), como um botão pressionado ou não. Sinais analógicos variam continuamente, como a temperatura ou a luz medida por um sensor. Entender a diferença é essencial, porque seu código lida com os dois ao ler sensores e controlar saídas.\n\nO medo da eletrônica costuma ser maior que a dificuldade real do básico. Comece com circuitos simples (acender um LED, ler um botão), use uma protoboard, e a confiança vem rápido. Ter o hardware na mão e errar com componentes baratos é a melhor forma de aprender.',
        },
      ],
    },
    {
      id: "microcontroladores",
      title: "Microcontroladores",
      description:
        "Os pequenos computadores que executam o firmware e controlam o hardware.",
      level: "intermediario",
      children: [
        {
          id: "microcontroladores.arduino",
          title: "Microcontroladores e Arduino",
          description:
            "O computador minúsculo que roda seu código, e a plataforma ideal pra começar.",
          content:
            'O **microcontrolador** é o coração de um sistema embarcado: um chip que é, na prática, um computador minúsculo e completo, com processador, memória e a capacidade de se conectar a sensores e atuadores, tudo num componente do tamanho de uma unha. É nele que o seu firmware roda e a partir dele que você controla o hardware.\n\nPra começar, a plataforma mais recomendada é o **Arduino**, e por ótimos motivos. É **barato**, tem uma **comunidade enorme** (com tutoriais e projetos prontos pra praticamente tudo), e foi feito justamente pra facilitar a entrada de iniciantes no mundo dos microcontroladores. O Arduino vem com um ambiente de programação próprio, o **Arduino IDE**, que simplifica todo o processo de escrever o código e enviá-lo pra a placa.\n\nO ciclo de trabalho é direto e viciante: você escreve o código no computador, conecta a placa por um cabo USB, faz o **upload** do código pra ela, e o microcontrolador passa a executar o seu programa, controlando o que estiver ligado nele. Ver o seu primeiro LED piscar comandado pelo seu código é o marco que engancha muita gente na área.\n\nUma característica do firmware Arduino que ilustra como embarcados pensam: o programa tem uma função que roda **uma vez** na inicialização (pra configurar) e outra que roda **em loop infinito**, repetidamente, pra sempre. O dispositivo não "termina"; ele fica eternamente no seu ciclo de ler entradas e controlar saídas, diferente de um programa comum que executa e encerra.\n\nComece com o Arduino e projetos simples, como manda a recomendação da área. A documentação oficial do Arduino é farta e acessível, e a prática com a placa na mão é o que mais acelera o aprendizado.',
          resources: [
            {
              label: "Arduino: documentação oficial",
              url: "https://docs.arduino.cc/",
              kind: "doc",
            },
          ],
        },
        {
          id: "microcontroladores.gpio",
          title: "GPIO: entradas e saídas",
          description:
            "Os pinos pelos quais o microcontrolador conversa com o mundo físico.",
          content:
            'A forma como o microcontrolador interage com o mundo físico é através dos seus **pinos**, e o conceito central aqui é o **GPIO** (General Purpose Input/Output, ou entrada e saída de propósito geral). São os pinos que você pode programar pra serem entradas (lendo algo do mundo) ou saídas (controlando algo).\n\nComo **saída**, um pino GPIO pode ser ligado ou desligado pelo seu código, fornecendo ou cortando tensão. É assim que você acende um LED, aciona um relé que liga um motor, ou dispara um alarme. Seu programa diz "pino 5, ligado", e o mundo físico responde.\n\nComo **entrada**, um pino lê o estado do que está conectado a ele. É assim que você detecta se um botão foi pressionado, se uma porta está aberta, ou o valor de um sensor. Seu programa pergunta "pino 7, está em nível alto ou baixo?" e age conforme a resposta.\n\nDois tipos de sinal aparecem, conectando com a eletrônica que você viu. Os pinos **digitais** lidam com ligado/desligado (o botão está pressionado ou não). Os pinos **analógicos** leem valores que variam continuamente (a posição de um potenciômetro, a intensidade de luz), convertendo a tensão num número que seu código usa. Há também uma técnica chamada PWM, que simula uma saída "intermediária" ligando e desligando muito rápido, usada pra controlar brilho de LED ou velocidade de motor.\n\nDominar o GPIO é dominar a ponte entre o seu código e o hardware. Praticamente todo projeto de embarcados é uma combinação de ler entradas e controlar saídas, com lógica no meio. Os primeiros projetos (piscar um LED no ritmo de um botão, ler um sensor e reagir) já exercitam exatamente isso, e formam a base de tudo o que vem depois.',
          resources: [
            {
              label: "Arduino: referência de linguagem (oficial)",
              url: "https://www.arduino.cc/reference/en/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "sensores",
      title: "Sensores e comunicação",
      description:
        "Medir o mundo com sensores e fazer os componentes conversarem entre si.",
      level: "intermediario",
      children: [
        {
          id: "sensores.sensores",
          title: "Sensores e atuadores",
          description: "Os componentes que medem o mundo e agem sobre ele.",
          content:
            "Um sistema embarcado fica interessante quando ele **percebe e age sobre o mundo físico**, e isso se faz com sensores e atuadores. Eles são o que conecta o seu código à realidade, e integrá-los é boa parte do trabalho prático da área.\n\nOs **sensores** medem grandezas do mundo e as transformam em sinais que o microcontrolador entende. Há sensores pra quase tudo: temperatura e umidade, luz, movimento e presença, distância, gás, aceleração, posição. Cada um tem seu jeito de funcionar e de se conectar, mas a ideia é sempre a mesma: ler do sensor um valor que representa algo do mundo real, pra o seu código tomar decisões com base nele.\n\nOs **atuadores** fazem o caminho inverso: agem sobre o mundo a partir de comandos do seu código. LEDs e displays (que mostram informação), motores (que movem coisas), relés (que ligam e desligam equipamentos maiores), válvulas, alarmes. É o atuador que transforma uma decisão do software numa ação física.\n\nA mágica dos projetos de IoT nasce de combinar os dois com lógica no meio: ler um sensor de umidade do solo e, se estiver seco, acionar uma bomba de irrigação; ler um sensor de temperatura e ligar um ventilador se passar de certo valor. Esse padrão de **sentir, decidir, agir** é a essência da área.\n\nNa prática, cada sensor ou atuador costuma ter uma **biblioteca** pronta (especialmente no ecossistema Arduino) que facilita a comunicação, escondendo os detalhes de baixo nível. Você conecta o componente fisicamente, instala a biblioteca, e a usa pra ler ou controlar. Os projetos clássicos de aprendizado (uma estação meteorológica com sensores, uma automação de luz ou irrigação) são justamente combinações de sensores e atuadores, e são o melhor jeito de fixar tudo isso.",
          resources: [
            {
              label: "Arduino: tutoriais e aprendizado (oficial)",
              url: "https://docs.arduino.cc/learn/",
              kind: "doc",
            },
          ],
        },
        {
          id: "sensores.protocolos",
          title: "Protocolos I2C e SPI",
          description:
            "As formas padronizadas pelas quais os componentes conversam entre si.",
          content:
            "Sensores, displays e outros chips precisam **conversar com o microcontrolador**, e fazer isso fio a fio pra cada sinal seria inviável. Por isso existem **protocolos de comunicação** padronizados, que definem como os componentes trocam dados usando poucos fios. Dois são fundamentais em embarcados, e entendê-los destrava o uso de muitos sensores.\n\nO **I2C** é um protocolo que conecta vários componentes usando apenas **dois fios** (um de dados e um de relógio, que sincroniza a comunicação). Sua grande vantagem é permitir ligar muitos dispositivos nos mesmos dois fios, cada um com um endereço próprio, como uma pequena rede interna. É muito comum em sensores e displays, e econômico em pinos, o que importa quando o microcontrolador tem poucos.\n\nO **SPI** é outro protocolo, que usa mais fios mas é **mais rápido** que o I2C. É preferido quando a velocidade importa, como em cartões de memória, displays maiores e alguns sensores. A escolha entre I2C e SPI é um trade-off entre simplicidade (menos fios) e velocidade.\n\nVocê não precisa implementar esses protocolos do zero, e raramente o fará: as bibliotecas dos sensores e do próprio Arduino cuidam dos detalhes de baixo nível. Mas precisa **entender os conceitos** pra conectar os componentes corretamente (ligar os fios certos nos pinos certos) e pra diagnosticar quando a comunicação não funciona, que é uma fonte comum de problemas.\n\nUm conceito relacionado e mais simples é a comunicação **serial**, que o seu dispositivo usa pra conversar com o computador (por onde você vê mensagens de depuração e envia comandos durante o desenvolvimento). Ela é sua principal janela pra o que está acontecendo dentro do microcontrolador, e uma ferramenta essencial de diagnóstico no dia a dia.",
        },
      ],
    },
    {
      id: "conectividade",
      title: "Conectividade e IoT",
      description:
        "O que transforma um dispositivo isolado em parte da Internet das Coisas.",
      level: "intermediario",
      children: [
        {
          id: "conectividade.esp32",
          title: "ESP32 e conectividade",
          description:
            "O microcontrolador com Wi-Fi que abre as portas da IoT.",
          content:
            "O que transforma um sistema embarcado isolado em um dispositivo de **IoT** é a conexão com a internet. E aqui entra um microcontrolador especialmente popular, o passo natural depois do Arduino: o **ESP32**.\n\nO ESP32 é amado na comunidade de IoT porque traz **Wi-Fi e Bluetooth embutidos**, além de ser potente e barato. Enquanto um Arduino básico precisa de componentes extras pra se conectar à internet, o ESP32 já vem pronto pra isso, o que o torna a escolha ideal pra projetos conectados. A recomendação clássica da área é exatamente essa: comece com Arduino pra aprender os fundamentos, depois migre pro ESP32 quando quiser conectividade.\n\nA boa notícia pra quem já aprendeu com Arduino é que o ESP32 pode ser programado com as mesmas ferramentas e a mesma abordagem (inclusive pelo Arduino IDE), então o conhecimento se transfere. Você ganha a conectividade sem recomeçar do zero.\n\nCom Wi-Fi, seu dispositivo pode fazer coisas que definem a IoT: enviar os dados dos sensores pra a internet, receber comandos remotos, sincronizar com outros dispositivos, e se integrar a serviços na nuvem. Um sensor de temperatura deixa de só mostrar o valor num display local e passa a registrar histórico na nuvem, mandar alertas, e ser consultado de qualquer lugar.\n\nPara projetos mais avançados, o ESP32 tem um ambiente de desenvolvimento próprio e robusto da fabricante (o ESP-IDF), mas começar pelo caminho mais simples do Arduino é perfeitamente válido. Há também a **Raspberry Pi**, que é um computador completo em miniatura (mais potente que um microcontrolador, rodando Linux), útil pra projetos de IoT que exigem mais processamento, como os que envolvem câmera ou interfaces ricas. ESP32 e Raspberry Pi cobrem, juntos, a maioria dos projetos de IoT de quem está aprendendo.",
          resources: [
            {
              label: "Espressif ESP32 (página oficial)",
              url: "https://www.espressif.com/en/products/socs/esp32",
              kind: "doc",
            },
            {
              label: "ESP-IDF: documentação oficial do ESP32",
              url: "https://docs.espressif.com/projects/esp-idf/en/latest/esp32/",
              kind: "doc",
            },
            {
              label: "Raspberry Pi: documentação oficial",
              url: "https://www.raspberrypi.com/documentation/",
              kind: "doc",
            },
          ],
        },
        {
          id: "conectividade.mqtt",
          title: "MQTT e a nuvem",
          description:
            "O protocolo leve que conecta milhões de dispositivos a serviços na internet.",
          content:
            'Quando seu dispositivo está conectado à internet, surge a pergunta: como ele troca dados com a nuvem e com outros dispositivos de forma eficiente? O protocolo mais usado em IoT pra isso é o **MQTT**, e entendê-lo é entrar de vez no mundo conectado.\n\nO MQTT foi projetado justamente pra IoT: é **leve** (gasta pouca banda e pouca energia, importante pra dispositivos com bateria e conexões limitadas) e eficiente pra muitos dispositivos trocando pequenas mensagens. Isso o diferencia de protocolos mais pesados, e é por isso que ele domina a área.\n\nO funcionamento usa um modelo simples e elegante chamado **publicar e assinar**. Existe um intermediário central (o **broker**) por onde passam todas as mensagens. Um dispositivo **publica** dados num "tópico" (por exemplo, um sensor publica a temperatura no tópico "sala/temperatura"), e qualquer outro dispositivo ou aplicação interessado **assina** aquele tópico e recebe os dados automaticamente. O sensor não precisa saber quem está escutando; ele só publica, e o broker entrega a quem assinou. Isso desacopla os dispositivos e permite que a coisa escale pra milhares deles.\n\nNa prática, um projeto de IoT típico funciona assim: o dispositivo lê sensores e **publica** os valores via MQTT; um serviço na nuvem recebe esses dados, armazena e os exibe num **dashboard** que você acessa de qualquer lugar; e comandos podem voltar pelo mesmo caminho pra controlar o dispositivo remotamente. Existem serviços de nuvem voltados a IoT que oferecem brokers MQTT e dashboards prontos, facilitando montar isso.\n\nO projeto que coroa esta trilha é exatamente esse: um dispositivo que lê o mundo, conecta-se via Wi-Fi, publica os dados via MQTT e os mostra num dashboard na nuvem. Ele junta tudo (firmware, sensores, conectividade, protocolo, nuvem) num sistema de IoT completo.',
          resources: [
            {
              label: "MQTT (site oficial do protocolo)",
              url: "https://mqtt.org/",
              kind: "doc",
            },
          ],
        },
        {
          id: "conectividade.seguranca",
          title: "Segurança de dispositivos IoT",
          description:
            "Por que dispositivos conectados são alvo fácil, e o básico inegociável pra não ser um.",
          content:
            "No momento em que o seu dispositivo se conecta à internet, ele deixa de ser um brinquedo isolado e vira um **alvo**. IoT tem fama de ser o elo fraco da segurança, e por motivos concretos: o dispositivo é físico e muitas vezes fica exposto (num poste, numa fábrica, na rua), raramente recebe atualização depois de instalado, e costuma sair de fábrica com uma **senha padrão** que quase ninguém troca. Some isso a recursos limitados que dificultam proteções pesadas, e você tem o cenário perfeito pra um invasor.\n\nA lição que a área aprendeu na dor tem nome: **botnets**. Redes gigantes de dispositivos sequestrados, formadas por câmeras, roteadores e gravadores domésticos que ficaram na internet com a senha de fábrica, foram usadas pra derrubar serviços enormes com ataques coordenados. Cada aparelho parecia inofensivo; juntos, viraram uma arma, e o dono de cada um nem percebia que fazia parte.\n\nO básico inegociável não é opcional, e cabe numa lista curta:\n\n```\nAntes de conectar um dispositivo:\n- trocar a senha padrão de fábrica\n- cifrar a comunicação (nada em texto puro)\n- manter o firmware atualizável e atualizado\n- abrir só as portas que o projeto usa\n```\n\nNenhum desses passos é avançado, e a maioria dos desastres de IoT vem de pular o mais óbvio deles. Pensar em segurança desde o projeto, e não como remendo no fim, é o que separa um produto de um problema. Esta folha é só a porta de entrada: o raciocínio defensivo (o que proteger, contra quem, como) é o assunto da trilha de cibersegurança, que vale visitar pra aprofundar. Você domina esta etapa quando, antes de pôr qualquer dispositivo na rede, consegue listar o que precisa fechar (senha, comunicação, firmware, portas) sem consultar nada.",
          resources: [
            {
              label: "OWASP Internet of Things Project (oficial)",
              url: "https://owasp.org/www-project-internet-of-things/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "avancado",
      title: "Tópicos avançados",
      description:
        "Os temas que separam um projeto de hobby de um produto embarcado robusto.",
      level: "avancado",
      children: [
        {
          id: "avancado.recursos",
          title: "Memória e energia",
          description:
            "Trabalhar dentro dos limites apertados de um dispositivo embarcado.",
          content:
            'Conforme os projetos saem do hobby e miram produtos reais, dois recursos viram preocupação central, e dominá-los distingue o profissional do iniciante: a **memória** e a **energia**.\n\nA **memória** num microcontrolador é escassa, às vezes alguns kilobytes, ordens de grandeza menos que num computador. Isso exige uma disciplina que outras áreas não pedem: escolher tipos de dados do tamanho certo (não usar um número grande onde um pequeno basta), evitar desperdício, ter cuidado redobrado com o gerenciamento manual de memória que a linguagem C exige, e prevenir problemas como o estouro de memória, que num dispositivo embarcado pode travar tudo sem aviso. Pensar em cada byte é um hábito que se desenvolve, e é parte do charme técnico da área.\n\nA **energia** é crítica porque muitos dispositivos embarcados funcionam a **bateria**, às vezes por meses ou anos sem troca (um sensor remoto, um vestível). Otimizar consumo vira questão de viabilidade do produto. As técnicas incluem os **modos de baixo consumo** (o dispositivo "dorme" a maior parte do tempo, acordando só quando precisa agir ou medir, economizando muita bateria), desligar componentes quando não estão em uso, e reduzir a frequência de operações custosas como a comunicação por rádio, que gasta bastante.\n\nEsses cuidados raramente aparecem em projetos de aprendizado simples, onde o dispositivo fica ligado na tomada e a memória sobra pro que você faz. Mas em produtos reais, eles definem se o dispositivo é viável. Entender desde cedo que você trabalha dentro de **restrições apertadas** molda a forma como você programa em embarcados, e desenvolver essa consciência é um diferencial concreto na carreira.',
          resources: [
            {
              label: "ESP-IDF: documentação oficial (recursos e otimização)",
              url: "https://docs.espressif.com/projects/esp-idf/en/latest/esp32/",
              kind: "doc",
            },
          ],
        },
        {
          id: "avancado.rtos",
          title: "RTOS e depuração de hardware",
          description:
            "Coordenar várias tarefas em tempo real e investigar problemas físicos.",
          content:
            "Dois temas mais avançados aparecem quando os projetos crescem em complexidade: os sistemas operacionais de tempo real e as técnicas de depuração de hardware.\n\nUm **RTOS** (Real-Time Operating System, sistema operacional de tempo real) é um sistema leve que roda no microcontrolador pra ajudar a coordenar **várias tarefas ao mesmo tempo** com garantias de tempo. Em projetos simples, seu código roda num único loop fazendo uma coisa de cada vez. Mas quando o dispositivo precisa fazer várias coisas aparentemente em paralelo (ler sensores, manter a comunicação de rede, responder a botões, controlar um motor), organizar isso num loop só vira um pesadelo. O RTOS resolve, permitindo dividir o programa em tarefas independentes que ele agenda, garantindo que as mais urgentes rodem no tempo certo. O **FreeRTOS** é um dos mais conhecidos e usados, inclusive no ESP32. É um tema avançado, que faz sentido depois que você domina os fundamentos.\n\nA **depuração de hardware** é a habilidade de investigar problemas que misturam software e eletrônica, e é onde a paciência da área é mais exigida. Diferente de um programa comum, nem sempre há uma mensagem de erro clara: o dispositivo simplesmente não funciona, ou se comporta de forma estranha, e a causa pode estar num fio solto, numa alimentação insuficiente, num sensor que mente (retorna um valor errado com toda a naturalidade) ou no código. As ferramentas e técnicas incluem usar a comunicação serial pra imprimir mensagens e acompanhar o que o código está fazendo, o **multímetro** pra verificar tensões e conexões, e o **osciloscópio** pra visualizar sinais elétricos que variam rápido demais pra o multímetro. Aprender a isolar se o problema é de hardware ou de software, testando uma hipótese de cada vez, é uma arte que se desenvolve com prática e é central no dia a dia de embarcados.",
          resources: [
            {
              label: "FreeRTOS (site e documentação oficial)",
              url: "https://www.freertos.org/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "carreira",
      title: "Projetos e carreira",
      description:
        "Construir projetos físicos reais e dar os primeiros passos numa área que une software e hardware.",
      level: "avancado",
      children: [
        {
          id: "carreira.projeto",
          title: "Projeto final: estação de monitoramento",
          description:
            "Sensor, MQTT e dashboard em tempo real: o ciclo completo de IoT num projeto só.",
          content:
            "Esta é a hora de fechar o ciclo completo da IoT num aparelho que você segura na mão e vê funcionando. Você aprendeu C e eletrônica, o microcontrolador e o GPIO, sensores e atuadores, os protocolos que os fazem conversar, a conectividade do ESP32 e o MQTT, e o cuidado com segurança. O projeto final junta tudo num sistema de ponta a ponta.\n\nO projeto vinculado te encomenda uma **estação de monitoramento**: um dispositivo que lê o mundo com um ou mais sensores (temperatura, umidade, luz, o que fizer sentido), conecta-se por Wi-Fi, publica os valores via MQTT, e os mostra num dashboard na nuvem que você acessa de qualquer lugar, com o histórico se acumulando. É o padrão sentir, conectar, publicar e visualizar, que define a IoT, num projeto só.\n\nComo a trilha insistiu, trate o hardware com a paciência que ele exige: valide cada sensor antes de conectar tudo, cuide da alimentação, e não ponha o dispositivo na rede sem o básico de segurança (senha trocada, comunicação cifrada). Você chega ao fim quando outra pessoa consegue abrir o seu dashboard, ver os dados do seu dispositivo real chegando e atualizando em tempo real, e você consegue explicar o caminho completo do dado, do sensor físico até a tela. Um aparelho físico que faz isso é a peça de portfólio mais convincente da área, porque é tangível.",
          project: "estacao-monitoramento-iot",
        },
        {
          id: "carreira.entrar",
          title: "Entrar na carreira",
          description:
            "Como aprender de verdade e se posicionar para uma área técnica e crescente.",
          content:
            "IoT e sistemas embarcados é uma área técnica, que une software e hardware, com demanda crescente puxada pela expansão da IoT e da indústria 4.0, e salários competitivos. Tem uma particularidade que define como se aprende e como se entra: **é uma área profundamente prática**, onde ter o hardware na mão vale mais que qualquer teoria.\n\nO conselho mais repetido pela área, e o mais importante, é: **construa projetos físicos reais**. Diferente de áreas onde você pode aprender só no computador, aqui o aprendizado dispara quando você tem uma placa, sensores e componentes na mão, e constrói coisas que funcionam de verdade. O caminho recomendado é claro: comece com Arduino e projetos simples (piscar LEDs, ler sensores), evolua pro ESP32 e a conectividade, e construa um projeto de IoT completo. Os clássicos são ótimos: uma estação meteorológica com sensores e Wi-Fi, uma automação de luz ou irrigação, um dispositivo que envia dados pra um dashboard na nuvem.\n\nEsses projetos são o seu **portfólio**, e um portfólio especialmente convincente, porque são tangíveis: você pode mostrar o dispositivo funcionando, em vídeo ou pessoalmente, documentar o circuito e o código no GitHub, e provar que sabe levar um projeto do componente ao funcionamento. Poucas coisas impressionam tanto quanto um aparelho físico que você construiu fazendo algo útil.\n\nA fórmula completa: domine **C** de verdade (a linguagem do firmware), entenda **eletrônica básica**, pratique muito com **hardware real**, e construa projetos que conectam dispositivos à nuvem. Os recursos gratuitos da área são bons, da documentação oficial do Arduino a cursos introdutórios de IoT e portais brasileiros dedicados a embarcados.\n\nDuas qualidades fecham o perfil: a **paciência pra depurar** problemas que misturam hardware e software, e o **prazer de ver o código controlando algo físico**. Se você gosta tanto de programar quanto de mexer com o mundo real, é uma carreira fascinante e cheia de demanda, especialmente pra quem constrói coisas de verdade.",
          resources: [
            {
              label: "Arduino: documentação oficial",
              url: "https://docs.arduino.cc/",
              kind: "doc",
            },
            {
              label:
                "PlatformIO: documentação oficial (ambiente de embarcados)",
              url: "https://docs.platformio.org/",
              kind: "doc",
            },
          ],
        },
      ],
    },
  ],
};
