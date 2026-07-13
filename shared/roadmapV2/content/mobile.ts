import type { RoadmapV2 } from "../types";

export const mobile: RoadmapV2 = {
  slug: "mobile",
  area: "mobile",
  title: "Desenvolvimento Mobile do Zero",
  level: "Iniciante",
  description:
    "Da escolha da stack à publicação de um app na loja, passando por linguagem, telas, dados e recursos do dispositivo. Escolha seu caminho e conclua uma etapa pra liberar a próxima.",
  languages: [
    { id: "react-native", label: "React Native" },
    { id: "flutter", label: "Flutter" },
    { id: "android", label: "Android (Kotlin)" },
    { id: "ios", label: "iOS (Swift)" },
  ],
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      description:
        "O que é fazer apps, a divisão entre nativo e multiplataforma e como montar seu ambiente.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é desenvolvimento mobile",
          description:
            "Criar aplicativos que rodam no celular, com suas regras e limites próprios.",
          content:
            "Desenvolvimento mobile é a criação de aplicativos para celulares e tablets, os dispositivos que mais usamos no dia a dia. É uma área que combina a satisfação de construir algo que as pessoas tocam o tempo todo com desafios próprios, diferentes do desenvolvimento web.\n\nO que torna o mobile particular são as restrições e capacidades do aparelho. A **tela é pequena** e o toque é o principal jeito de interagir, então a interface precisa ser pensada pro dedo, não pro mouse. Os **recursos são limitados** (bateria, memória, dados móveis), o que exige cuidado com performance e consumo. E há acesso a **recursos do dispositivo** que a web mal alcança: câmera, GPS, sensores, notificações que chegam mesmo com o app fechado.\n\nO mundo mobile gira em torno de duas plataformas: **Android** (Google) e **iOS** (Apple). Cada uma tem seu jeito, suas ferramentas e sua loja de apps, com regras próprias de publicação. Atingir as duas é o objetivo da maioria dos apps, e como fazer isso é a primeira grande decisão da área, que você verá a seguir.\n\nO ciclo de trabalho típico envolve construir as telas e funcionalidades, integrar com APIs e serviços (porque a maioria dos apps conversa com um servidor), testar em diferentes aparelhos e publicar nas lojas. Esta trilha percorre esse caminho do início ao fim, e termina no objetivo que mais motiva quem entra na área: ver o próprio app publicado e funcionando no celular de verdade.",
        },
        {
          id: "fundamentos.nativomulti",
          title: "Nativo e multiplataforma",
          description:
            "As duas grandes abordagens pra fazer apps, e o que muda entre elas.",
          content:
            "Existe uma decisão central no mobile que define seu caminho de estudo: desenvolver de forma **nativa** ou **multiplataforma**. Esta trilha funciona com quatro stacks, e você escolhe uma no seletor acima.\n\nNo desenvolvimento **nativo**, você constrói um app específico para cada plataforma, com a linguagem e as ferramentas oficiais dela: **Kotlin** para Android, **Swift** para iOS. A vantagem é o acesso total e imediato a tudo que o sistema oferece, com a melhor performance e integração. A desvantagem é o custo: pra ter o app nas duas plataformas, você (ou o time) constrói praticamente dois apps.\n\nNo desenvolvimento **multiplataforma**, você escreve um código que roda nas duas plataformas, economizando esforço. As duas opções dominantes são o **React Native** (baseado em JavaScript, do ecossistema React) e o **Flutter** (baseado na linguagem Dart, do Google). A vantagem é cobrir Android e iOS com uma base de código só. A troca é alguma perda de acesso direto a recursos muito específicos e uma camada a mais entre você e o sistema.\n\nNão existe escolha certa universal; depende do objetivo, do time e do contexto. Mas há uma tendência clara pra quem está começando e quer empregabilidade rápida com bom alcance: as opções multiplataforma, especialmente por entregarem as duas lojas com um aprendizado só. O próximo passo te ajuda a escolher a sua, e o conteúdo da trilha se adapta à stack selecionada.",
        },
        {
          id: "fundamentos.setup",
          title: "Ambiente e ferramentas",
          description:
            "Instalar o que você precisa pra criar e rodar seu primeiro app.",
          content:
            "Antes de programar, você precisa do ambiente funcionando: as ferramentas instaladas e a capacidade de rodar um app, seja num **emulador** (um celular simulado no computador) ou no seu próprio aparelho conectado. Essa etapa costuma dar mais trabalho no mobile que em outras áreas, então vale paciência: ambiente quebrado é a maior fonte de frustração no começo.\n\nUm conceito comum a todas as stacks é o emulador (ou simulador), que permite testar o app sem precisar de um celular físico, embora testar no aparelho real seja sempre recomendado antes de publicar. Escolha sua stack acima pra ver o passo a passo do ambiente dela.",
          byLanguage: {
            "react-native": {
              content:
                "Pra começar em React Native, o caminho mais simples é o **Expo**, um conjunto de ferramentas que cuida da configuração pesada por você. Você instala o Node.js, cria o projeto com o Expo e roda no celular usando o app Expo Go (lendo um QR code) ou num emulador. É o jeito mais rápido de ver algo na tela sem brigar com configuração de Android Studio e Xcode logo de cara.",
              resources: [
                {
                  label: "Expo: documentação oficial",
                  url: "https://docs.expo.dev/",
                  kind: "doc",
                },
                {
                  label: "React Native: começar (oficial)",
                  url: "https://reactnative.dev/docs/getting-started",
                  kind: "doc",
                },
              ],
            },
            flutter: {
              content:
                "Pra Flutter, você instala o **SDK do Flutter** e um editor (o VS Code com a extensão do Flutter é uma ótima escolha). O comando `flutter doctor` é seu melhor amigo: ele verifica o que falta no ambiente e te guia. Pra rodar, use um emulador (do Android Studio) ou seu celular conectado. O guia oficial de instalação cobre cada sistema operacional em detalhe.",
              resources: [
                {
                  label: "Flutter: instalação (oficial)",
                  url: "https://docs.flutter.dev/get-started/install",
                  kind: "doc",
                },
              ],
            },
            android: {
              content:
                "Pra Android nativo, a ferramenta central é o **Android Studio**, o ambiente oficial do Google, que já traz tudo: editor, emulador e o SDK do Android. Você instala, cria um projeto Kotlin e roda num emulador ou no celular com o modo desenvolvedor ativado. A instalação é mais pesada que a das opções multiplataforma, então reserve um tempo pra ela.",
              resources: [
                {
                  label: "Android Studio (oficial)",
                  url: "https://developer.android.com/studio",
                  kind: "doc",
                },
              ],
            },
            ios: {
              content:
                "Pra iOS nativo, você precisa de um **Mac**, porque a ferramenta oficial, o **Xcode**, só roda em macOS. Esse é o principal pré-requisito de hardware da plataforma. Você instala o Xcode (gratuito na App Store do Mac), que traz o editor, o simulador de iPhone e tudo mais, cria um projeto Swift e roda no simulador ou num iPhone conectado.",
              resources: [
                {
                  label: "Xcode (oficial)",
                  url: "https://developer.apple.com/xcode/",
                  kind: "doc",
                },
              ],
            },
          },
        },
      ],
    },
    {
      id: "linguagem",
      title: "A linguagem",
      description:
        "A linguagem de programação da stack que você escolheu, base de todo o resto.",
      level: "iniciante",
      children: [
        {
          id: "linguagem.base",
          title: "A linguagem da sua stack",
          description:
            "Dominar o básico da linguagem antes de construir telas.",
          content:
            "Antes de montar telas, você precisa de fluência na linguagem da sua stack. Não importa qual seja, o núcleo a dominar é parecido: variáveis e tipos, condicionais, laços, **funções** e as estruturas de dados do dia a dia (listas e mapas/objetos). Some a isso o trabalho com **assincronismo**, porque buscar dados de um servidor sempre acontece em segundo plano, e é onipresente em apps.\n\nUm conselho que vale pra todas: não pule a linguagem pra ir direto às telas. Framework é a linguagem organizada de um jeito; sem a base, ele vira mágica que você não controla. Escolha sua stack acima pra ver qual linguagem aprender e por onde começar.",
          byLanguage: {
            "react-native": {
              content:
                "React Native usa **JavaScript** (e cada vez mais o TypeScript, que adiciona tipos por cima). A grande vantagem: se você já viu JavaScript no front-end web, a maior parte do conhecimento se transfere direto. Foque em funções, métodos de array (`map`, `filter`), objetos e o trabalho assíncrono com `async`/`await`, que você usa o tempo todo ao buscar dados. Quem vem do React web tem um caminho especialmente curto.",
              resources: [
                {
                  label: "MDN: JavaScript",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript",
                  kind: "doc",
                },
              ],
            },
            flutter: {
              content:
                "Flutter usa o **Dart**, uma linguagem criada pelo Google, de tipagem estática e sintaxe limpa, fácil de pegar pra quem já programou em qualquer linguagem parecida com C ou Java. Foque em variáveis tipadas, funções, classes (Flutter é bem orientado a objetos), listas e mapas, e o trabalho assíncrono com `Future` e `async`/`await`. A documentação oficial do Dart é clara e direta.",
              resources: [
                {
                  label: "Dart: a linguagem (oficial)",
                  url: "https://dart.dev/language",
                  kind: "doc",
                },
              ],
            },
            android: {
              content:
                "Android nativo usa **Kotlin**, a linguagem oficial recomendada pelo Google, moderna e mais enxuta que o antigo Java. Foque em variáveis (`val` e `var`), funções, classes, segurança contra nulos (um diferencial forte do Kotlin), coleções e o trabalho assíncrono com corrotinas, que o Android usa pra operações em segundo plano. A documentação oficial do Kotlin é completa e tem material pra iniciantes.",
              resources: [
                {
                  label: "Kotlin: documentação oficial",
                  url: "https://kotlinlang.org/docs/home.html",
                  kind: "doc",
                },
              ],
            },
            ios: {
              content:
                "iOS nativo usa **Swift**, a linguagem moderna da Apple, segura e expressiva. Foque em variáveis (`let` e `var`), funções, structs e classes, opcionais (o jeito do Swift de lidar com ausência de valor, um conceito central) e o trabalho assíncrono com `async`/`await`. A Apple oferece o livro oficial do Swift, gratuito, como referência completa da linguagem.",
              resources: [
                {
                  label: "The Swift Programming Language (livro oficial)",
                  url: "https://docs.swift.org/swift-book/",
                  kind: "doc",
                },
              ],
            },
          },
        },
      ],
    },
    {
      id: "ui",
      title: "Construir a interface",
      description:
        "Montar telas, torná-las interativas e ligar uma à outra: o coração de um app.",
      level: "intermediario",
      children: [
        {
          id: "ui.telas",
          title: "Construir telas",
          description:
            "Montar a parte visível do app com os blocos da sua stack.",
          content:
            "A interface de um app é construída a partir de pequenos blocos visuais que você combina: textos, botões, imagens, campos, listas. O nome desses blocos muda conforme a stack, mas a ideia é a mesma em todas: você compõe a tela encaixando esses elementos e organizando como eles se posicionam.\n\nUm conceito universal no mobile moderno é o **layout flexível**: como as telas têm tamanhos muito diferentes, você não fixa posições em pixels absolutos; usa sistemas que adaptam o arranjo ao espaço disponível, garantindo que o app fique bem num celular pequeno e num tablet grande. Escolha sua stack acima pra ver como montar telas nela.",
          byLanguage: {
            "react-native": {
              content:
                "Em React Native, você monta telas com **componentes**, como `View` (um contêiner), `Text`, `Image`, `TextInput` e `Pressable`, escritos em JSX, a mesma sintaxe do React web. O layout usa **Flexbox**, então quem já fez CSS no front-end se sente em casa. Você combina componentes pequenos em outros maiores, reaproveitando-os, exatamente como no React.",
              resources: [
                {
                  label: "React Native: componentes e APIs (oficial)",
                  url: "https://reactnative.dev/docs/components-and-apis",
                  kind: "doc",
                },
              ],
            },
            flutter: {
              content:
                'Em Flutter, tudo é **widget**: textos, botões, espaçamentos, até o layout em si são widgets que você aninha uns dentro dos outros, formando uma árvore. Widgets como `Container`, `Text`, `Row`, `Column` e `ListView` são o seu vocabulário básico. Essa filosofia de "tudo é widget" é a marca do Flutter, e dominá-la é dominar a construção de telas na ferramenta.',
              resources: [
                {
                  label: "Flutter: introdução aos widgets (oficial)",
                  url: "https://docs.flutter.dev/ui/widgets-intro",
                  kind: "doc",
                },
              ],
            },
            android: {
              content:
                "No Android moderno, a forma recomendada de construir telas é o **Jetpack Compose**, uma abordagem declarativa em Kotlin onde você descreve a interface com funções que emitem elementos chamados composables (`Text`, `Button`, `Column`, `Row`, `LazyColumn`). É mais simples e moderno que o antigo sistema de layouts em XML, e é por onde vale começar hoje.",
              resources: [
                {
                  label: "Jetpack Compose: documentação (oficial)",
                  url: "https://developer.android.com/develop/ui/compose/documentation",
                  kind: "doc",
                },
              ],
            },
            ios: {
              content:
                "No iOS moderno, a forma recomendada é o **SwiftUI**, uma abordagem declarativa em Swift onde você descreve a interface com componentes como `Text`, `Button`, `VStack`, `HStack` e `List`. Você combina essas views aninhando-as, e a tela se atualiza sozinha conforme os dados mudam. É mais simples que o antigo UIKit e o caminho recomendado pra quem começa hoje.",
              resources: [
                {
                  label: "Apple: tutoriais de SwiftUI (oficial)",
                  url: "https://developer.apple.com/tutorials/swiftui",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "ui.estado",
          title: "Estado e interatividade",
          description: "Fazer a tela reagir ao usuário e se atualizar sozinha.",
          content:
            "Uma tela parada tem pouco valor; o que faz um app vivo é reagir ao usuário e se atualizar. O conceito central pra isso é o **estado**: os dados que a tela mostra e que podem mudar com a interação (o texto digitado num campo, o item marcado numa lista, o número de um contador).\n\nO mobile moderno funciona de forma **declarativa**: em vez de você mexer manualmente nos elementos da tela quando algo muda, você atualiza o estado e a interface se redesenha sozinha pra refletir o novo estado. Essa ideia é comum às quatro stacks e muda a forma de pensar: você descreve como a tela deve parecer pra cada estado, não os passos pra alterá-la. Escolha sua stack pra ver como o estado funciona nela.",
          byLanguage: {
            "react-native": {
              content:
                "Em React Native, você gerencia estado com **hooks**, principalmente o `useState`. Você guarda um valor no estado e, quando ele muda (por exemplo, ao digitar num `TextInput` com `onChangeText`), o componente se redesenha automaticamente. É exatamente o mesmo modelo do React web, então o conhecimento se transfere direto.",
              resources: [
                {
                  label: "React Native: começar (oficial)",
                  url: "https://reactnative.dev/docs/getting-started",
                  kind: "doc",
                },
              ],
            },
            flutter: {
              content:
                "Em Flutter, a noção básica de estado vem do `StatefulWidget`, que guarda dados mutáveis, com o método `setState` avisando o framework pra redesenhar quando algo muda. Conforme os apps crescem, surgem soluções de gerenciamento de estado mais robustas, mas comece pelo `setState` pra entender o mecanismo antes de adotar abstrações.",
              resources: [
                {
                  label: "Flutter: introdução aos widgets (estado)",
                  url: "https://docs.flutter.dev/ui/widgets-intro",
                  kind: "doc",
                },
              ],
            },
            android: {
              content:
                "No Jetpack Compose, o estado é central e declarativo. Você cria estado com `remember` e `mutableStateOf`, e a tela (os composables) se redesenha automaticamente quando ele muda, num processo chamado recomposição. Entender esse fluxo de estado é a base pra construir telas interativas no Compose.",
              resources: [
                {
                  label: "Jetpack Compose: documentação (oficial)",
                  url: "https://developer.android.com/develop/ui/compose/documentation",
                  kind: "doc",
                },
              ],
            },
            ios: {
              content:
                "No SwiftUI, o estado é declarado com anotações como `@State`. Quando uma propriedade de estado muda, a view se atualiza sozinha pra refletir o novo valor. Você liga campos e controles a esse estado, e o SwiftUI cuida de manter a tela em sincronia com os dados, sem você mexer nos elementos manualmente.",
              resources: [
                {
                  label: "Apple: tutoriais de SwiftUI (oficial)",
                  url: "https://developer.apple.com/tutorials/swiftui",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "ui.navegacao",
          title: "Navegação entre telas",
          description:
            "Levar o usuário de uma tela a outra de forma organizada.",
          content:
            "Apps reais têm várias telas, e o usuário transita entre elas: da lista pro detalhe, da home pras configurações, do login pro conteúdo. Organizar esses caminhos é o trabalho de **navegação**, e fazê-la bem é o que dá estrutura ao app.\n\nUm padrão comum no mobile é a navegação em **pilha** (stack): ao abrir uma tela nova, ela empilha sobre a anterior, e o botão de voltar a remove, revelando a de baixo. Há também padrões como as **abas** na base da tela, pra alternar entre seções principais. Cada stack tem sua forma de implementar isso. Escolha a sua pra ver como.",
          byLanguage: {
            "react-native": {
              content:
                "Em React Native, a biblioteca padrão de navegação é o **React Navigation**. Com ela você define as telas do app e como navegar entre elas, incluindo navegação em pilha, abas e menus laterais. É uma das primeiras bibliotecas que você adiciona a qualquer app de verdade, e a documentação oficial tem um guia direto pra começar.",
              resources: [
                {
                  label: "React Navigation: começar (oficial)",
                  url: "https://reactnavigation.org/docs/getting-started",
                  kind: "doc",
                },
              ],
            },
            flutter: {
              content:
                "Em Flutter, a navegação básica usa o `Navigator`, que gerencia uma pilha de telas (chamadas rotas): você empilha uma nova tela com `push` e volta com `pop`. Pra apps maiores, há sistemas de rotas mais estruturados, mas o `Navigator` com push e pop é o suficiente pra entender e construir a navegação dos primeiros apps.",
              resources: [
                {
                  label: "Flutter: documentação de UI (oficial)",
                  url: "https://docs.flutter.dev/ui/widgets-intro",
                  kind: "doc",
                },
              ],
            },
            android: {
              content:
                "No Android com Compose, a navegação usa o componente **Navigation Compose**, onde você define rotas (destinos) e navega entre elas mantendo uma pilha de telas. Ele integra com os padrões do Android, como o comportamento esperado do botão voltar do sistema, e faz parte do conjunto de bibliotecas Jetpack.",
              resources: [
                {
                  label: "Jetpack Compose: documentação (oficial)",
                  url: "https://developer.android.com/develop/ui/compose/documentation",
                  kind: "doc",
                },
              ],
            },
            ios: {
              content:
                "No SwiftUI, a navegação em pilha usa a `NavigationStack`, dentro da qual `NavigationLink` leva o usuário de uma tela a outra, com o botão de voltar surgindo automaticamente. Pra seções principais, a `TabView` cria as abas na base da tela. São os componentes nativos do SwiftUI pra estruturar os caminhos do app.",
              resources: [
                {
                  label: "Apple: documentação do SwiftUI (oficial)",
                  url: "https://developer.apple.com/documentation/swiftui",
                  kind: "doc",
                },
              ],
            },
          },
        },
      ],
    },
    // TODO(Ana): etapa nova (aprofundamento), revisar copy.
    {
      id: "estado",
      title: "Estado e arquitetura do app",
      description:
        "Conforme o app cresce, organizar de onde vêm os dados da tela e como as partes se separam vira o que evita o caos.",
      level: "intermediario",
      children: [
        {
          id: "estado.o-que",
          title: "O que é estado e por que ele complica",
          description:
            "Os dados que mudam com o uso e aparecem na tela, e o desafio de mantê-los sempre coerentes.",
          content:
            "**Estado** é toda informação do app que muda com o uso e se reflete na tela: se o usuário está logado, o que ele digitou num campo, os itens no carrinho, se uma lista está carregando. Enquanto a tela é simples, controlar isso é fácil. O problema aparece quando o app cresce e várias telas precisam da mesma informação atualizada ao mesmo tempo.\n\nO exemplo clássico: o carrinho de compras. Ele aparece no ícone do topo, na tela de produtos e na de finalização, e um item adicionado numa tela precisa refletir instantaneamente nas outras. Se cada tela guarda sua própria cópia, elas saem de sincronia e o app mostra informações contraditórias, um dos bugs mais comuns e frustrantes.\n\nGerenciar estado é resolver esse problema: ter uma **fonte única da verdade** para cada informação compartilhada, de onde todas as telas leem e para onde todas escrevem. As quatro stacks têm suas ferramentas próprias de gerenciamento de estado, mas o conceito é o mesmo em todas, e entendê-lo é o que permite construir apps de verdade, com muitas telas conectadas.",
        },
        {
          id: "estado.arquitetura",
          title: "Separar interface, lógica e dados",
          description:
            "Organizar o app em camadas para que ele cresça sem virar um emaranhado impossível de mudar.",
          content:
            "Um app pequeno cabe em poucos arquivos, mas um que cresce sem organização vira um nó onde a lógica de negócio, as chamadas de rede e o código da tela se misturam, e qualquer mudança arrisca quebrar tudo. A defesa é a mesma de qualquer software sério: **separar responsabilidades** em camadas.\n\nA ideia geral é manter a **interface** (o que aparece e como o usuário interage) separada da **lógica** (as regras do que o app faz) e do **acesso a dados** (buscar da API, ler do armazenamento local). Assim a tela não precisa saber montar uma requisição, e a lógica pode ser testada sem depender da interface. Trocar de onde vêm os dados não obriga a reescrever as telas.\n\nCada plataforma tem padrões de arquitetura recomendados para isso, e você não precisa dominar o mais sofisticado desde o começo. O importante no início é o hábito de não jogar tudo no mesmo arquivo: separar o que é tela do que é regra e do que é dado já organiza bastante, e prepara o terreno para os padrões mais formais quando o app justificar.",
        },
      ],
    },
    {
      id: "dados",
      title: "Dados e APIs",
      description:
        "Conectar o app ao mundo: buscar dados de servidores e guardar informação no aparelho.",
      level: "intermediario",
      children: [
        {
          id: "dados.apis",
          title: "Consumir APIs",
          description:
            "Buscar e enviar dados de um servidor, o que quase todo app faz.",
          content:
            "Quase todo app de verdade conversa com um servidor: busca uma lista de produtos, envia um cadastro, carrega o feed, confirma um login. Isso acontece através de **APIs**, e entender esse fluxo é essencial, porque é o que conecta seu app ao mundo.\n\nO padrão é o mesmo que sustenta a web: o app faz uma **requisição** HTTP a uma API (com um método como GET pra buscar ou POST pra enviar), o servidor responde com um código de status e, em geral, dados em formato **JSON**, que o app converte pra exibir na tela. Como isso leva tempo (a resposta vai e volta pela internet), todo o trabalho é **assíncrono**, e você precisa tratar três situações: carregando, sucesso e erro. Mostrar um indicador enquanto carrega e uma mensagem clara quando a rede falha é o que separa um app polido de um que parece travado.\n\nO conceito é idêntico nas quatro stacks; muda a ferramenta usada pra fazer a requisição. Escolha a sua pra ver como.",
          byLanguage: {
            "react-native": {
              content:
                "Em React Native, você usa a função `fetch` (a mesma do navegador) ou bibliotecas como o axios pra fazer requisições, com `async`/`await` pra esperar a resposta. Guarda o resultado no estado e a tela se atualiza. O fluxo é igual ao do React web, então quem vem de lá já sabe consumir API.",
              resources: [
                {
                  label: "React Native: começar (oficial)",
                  url: "https://reactnative.dev/docs/getting-started",
                  kind: "doc",
                },
              ],
            },
            flutter: {
              content:
                "Em Flutter, o pacote oficial `http` faz as requisições, e você usa `Future` com `async`/`await` pra lidar com a resposta assíncrona. O cookbook oficial tem uma receita direta de como buscar dados de uma API e exibi-los, um ótimo ponto de partida prático.",
              resources: [
                {
                  label: "Flutter: buscar dados de uma API (cookbook oficial)",
                  url: "https://docs.flutter.dev/cookbook/networking/fetch-data",
                  kind: "doc",
                },
              ],
            },
            android: {
              content:
                "No Android, as requisições costumam usar bibliotecas consagradas como o Retrofit, combinadas com corrotinas Kotlin pra lidar com o assincronismo de forma limpa. O guia de arquitetura do Android mostra como organizar a camada de dados que conversa com a rede de forma sustentável.",
              resources: [
                {
                  label: "Android: guia de desenvolvimento (oficial)",
                  url: "https://developer.android.com/guide",
                  kind: "doc",
                },
              ],
            },
            ios: {
              content:
                "No iOS, a `URLSession` é a ferramenta nativa pra fazer requisições de rede, e com Swift moderno você a usa com `async`/`await`. Você decodifica o JSON da resposta em tipos Swift e atualiza a interface. Tudo isso vem na própria plataforma, sem precisar de bibliotecas externas pra começar.",
              resources: [
                {
                  label: "Apple: documentação do SwiftUI (oficial)",
                  url: "https://developer.apple.com/documentation/swiftui",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "dados.local",
          title: "Armazenamento local",
          description:
            "Guardar dados no próprio aparelho, pra o app lembrar das coisas.",
          content:
            'Nem tudo precisa ir pro servidor. Muitas vezes o app precisa **guardar dados no próprio aparelho**: a preferência de tema do usuário, se ele já viu a tela de introdução, um rascunho não enviado, ou dados pra funcionar offline. Isso é o armazenamento local.\n\nExistem níveis, do mais simples ao mais robusto, e o conceito vale pras quatro stacks. Pra **dados pequenos e simples** (uma configuração, um sinalizador de "já abriu antes"), cada plataforma tem um mecanismo leve de chave e valor, que guarda pares como "tema = escuro". Pra **dados estruturados e maiores** (uma lista de itens que precisa sobreviver ao fechamento do app, buscas e relações), usa-se um **banco de dados local** no dispositivo, em geral baseado em SQLite ou em soluções construídas sobre ele.\n\nA regra prática pra escolher é o volume e a complexidade: configuração simples pede o mecanismo leve; muitos registros com consultas pedem banco local. Um cuidado importante de segurança e privacidade: dados sensíveis (senhas, tokens) não vão no armazenamento comum; cada plataforma tem um cofre seguro próprio pra esse tipo de informação.\n\nComece pelo armazenamento simples de chave e valor, que resolve a maioria das necessidades iniciais (lembrar uma preferência, por exemplo), e avance pro banco local quando o app precisar guardar e consultar muitos dados de forma organizada. Saber quando os dados ficam no aparelho e quando vão pro servidor é uma decisão de arquitetura que você toma o tempo todo no mobile.',
        },
      ],
    },
    {
      id: "recursos",
      title: "Recursos do dispositivo",
      description:
        "O que torna o mobile especial: acessar câmera, localização e notificações, com cuidado de performance.",
      level: "intermediario",
      children: [
        {
          id: "recursos.dispositivo",
          title: "Câmera, GPS e notificações",
          description:
            "Usar os recursos do aparelho que diferenciam um app de um site.",
          content:
            "O que torna um app mais poderoso que um site é o acesso aos **recursos do dispositivo**: a câmera pra tirar foto ou ler um QR code, o **GPS** pra saber a localização, os sensores, e as **notificações** que chegam mesmo com o app fechado. Usar esses recursos é o que faz um app parecer de verdade integrado ao celular.\n\nDois conceitos transversais importam aqui, independentemente da stack. O primeiro são as **permissões**: o sistema operacional protege esses recursos, e o app precisa **pedir autorização** ao usuário antes de usar a câmera ou a localização. Pedir bem (na hora certa, explicando o porquê) é parte da boa experiência; pedir tudo de uma vez no primeiro segundo afasta o usuário. O segundo é a **privacidade**: esses dados são sensíveis, e tanto os usuários quanto as lojas levam a sério como você os trata. Acesse só o que precisa, e deixe claro pra quê.\n\nNa prática, cada recurso é acessado por uma API da plataforma ou por uma biblioteca (no caso das stacks multiplataforma, plugins que embrulham o acesso nativo). As **notificações** merecem destaque por serem um caso à parte: as locais, agendadas pelo próprio app, são simples; as **push** (enviadas de um servidor pra o aparelho mesmo com o app fechado) envolvem um serviço de mensagens e mais configuração, sendo um tema mais avançado.\n\nO conselho é incremental: não tente usar todos os recursos de uma vez. Construa apps que funcionam primeiro, e adicione câmera, localização ou notificações quando o seu projeto realmente pedir, aprendendo cada um conforme a necessidade aparece.",
        },
        {
          id: "recursos.performance",
          title: "Performance e boas práticas",
          description:
            "Fazer o app rodar liso e respeitar os limites do celular.",
          content:
            "No celular, performance não é luxo; é requisito. Os aparelhos têm limites de processamento, memória e, principalmente, **bateria** e **dados móveis**, e o usuário percebe na hora quando um app trava, esquenta o telefone ou consome demais. Alguns cuidados, comuns às quatro stacks, fazem grande diferença.\n\nO mais visível é manter a interface **fluida**. Telas que travam ao rolar, animações engasgadas e toques que demoram a responder passam uma impressão de app malfeito. A causa mais comum é fazer trabalho pesado na thread principal (a que cuida da tela); a solução é jogar tarefas demoradas (como processar dados ou esperar a rede) pra segundo plano, justamente o trabalho assíncrono que você já viu.\n\nDuas situações merecem atenção especial. As **listas longas**: apps cheios de itens (um feed, um catálogo) precisam renderizar só o que está visível na tela, e não milhares de itens de uma vez; todas as stacks têm componentes próprios pra listas eficientes, e usá-los é essencial. E o **uso de rede e bateria**: evitar baixar dados em excesso, reaproveitar o que já foi carregado e não ficar consultando o servidor à toa economiza dados do usuário e bateria.\n\nUm princípio sensato pra iniciantes: não caia na **otimização prematura**, gastando energia com microajustes antes de o app sequer funcionar. Primeiro faça funcionar de forma correta e organizada; depois, se notar lentidão real, investigue e otimize o ponto específico. Mas tenha desde cedo a consciência de que, no mobile, você é convidado de um aparelho com recursos limitados, e bons apps respeitam isso.",
        },
      ],
    },
    // TODO(Ana): etapa nova (aprofundamento), revisar copy.
    {
      id: "testes",
      title: "Testes no mobile",
      description:
        "Automatizar a verificação do app para mudar sem medo e chegar às lojas com confiança.",
      level: "intermediario",
      children: [
        {
          id: "testes.por-que",
          title: "Por que testar um app",
          description:
            "Testar na mão a cada mudança não escala; testes automatizados avisam na hora quando algo quebra.",
          content:
            "Conforme o app ganha telas e recursos, testar tudo na mão a cada mudança vira inviável: você mexe numa parte e não tem como conferir manualmente se as outras vinte continuam funcionando. **Testes automatizados** são código que verifica seu código, rodando sozinho e apontando na hora se algo quebrou.\n\nO valor aparece mais forte no mobile por um motivo prático: publicar uma correção na loja não é instantâneo. Um bug que passa para produção pode levar dias para ser corrigido e chegar aos usuários, ao contrário da web, onde se corrige e publica na hora. Pegar o problema antes de publicar, no seu computador, economiza esse ciclo doloroso.\n\nTestes também são a rede de segurança que permite evoluir o app sem medo. Com eles, você adiciona um recurso ou refatora uma tela e confia que, se quebrou algo antigo, o teste avisa. Sem eles, cada mudança num app grande é uma aposta, e o medo de mexer no que funciona acaba travando a evolução do projeto.",
        },
        {
          id: "testes.tipos",
          title: "Tipos de teste",
          description:
            "De verificar uma função isolada a simular o usuário percorrendo o app inteiro.",
          content:
            "Os testes se organizam em níveis, do mais focado ao mais abrangente, e o conceito vale para as quatro stacks. Os **testes de unidade** verificam uma peça isolada, como uma função que calcula o total do carrinho: são rápidos, baratos e devem ser a maioria. Os **testes de interface** (ou de componente) checam se uma tela mostra o que deveria e reage ao toque como esperado.\n\nNo topo estão os **testes de ponta a ponta**, que simulam o usuário de verdade abrindo o app e percorrendo um fluxo completo (fazer login, adicionar um item, finalizar). São os mais poderosos para garantir que tudo funciona junto, mas também os mais lentos e trabalhosos, então se usa poucos, focados nos fluxos mais críticos.\n\nCada plataforma tem suas ferramentas de teste próprias, e você não precisa cobrir tudo desde o primeiro projeto. Comece testando a lógica mais importante com testes de unidade (a parte que, se quebrar, causa mais estrago), e vá subindo os níveis conforme o app e a sua experiência crescem. Um app com a lógica central testada já está muito à frente de um sem teste nenhum.",
        },
      ],
    },
    {
      id: "publicacao",
      title: "Publicar nas lojas",
      description:
        "O objetivo que mais motiva: ver seu app disponível pra download nas lojas.",
      level: "avancado",
      children: [
        {
          id: "publicacao.lojas",
          title: "As lojas de aplicativos",
          description:
            "Como funcionam a Play Store e a App Store, e o que elas exigem.",
          content:
            "O destino final de um app são as lojas: a **Play Store** (Android, do Google) e a **App Store** (iOS, da Apple). Publicar nelas é o marco que transforma um projeto em algo que qualquer pessoa pode baixar, e é um diferencial enorme num portfólio. Mas cada loja tem suas regras, e conhecê-las evita surpresas.\n\nAlguns pontos comuns às duas. Ambas cobram uma **taxa de conta de desenvolvedor** pra publicar (a do Google é um pagamento único; a da Apple é anual), então há um custo real envolvido em colocar um app no ar. Ambas fazem uma **revisão** dos apps antes de aprovar, checando se seguem as diretrizes de qualidade, conteúdo e privacidade. E ambas exigem que você prepare materiais: ícone, capturas de tela, descrição, e uma política de privacidade explicando o que o app faz com os dados.\n\nHá diferenças de cultura importantes. A **App Store** tem fama de revisão mais rigorosa e demorada, com diretrizes detalhadas que vale ler antes de construir, pra não ter o app rejeitado por algo evitável. A **Play Store** costuma ter um processo mais rápido, mas igualmente leva privacidade e qualidade a sério.\n\nUm ponto que pega iniciantes: a **privacidade** virou central. As duas lojas exigem que você declare quais dados o app coleta e por quê, e penalizam quem não cumpre. Pensar nisso desde o design do app, e não só na hora de publicar, evita retrabalho. A etapa seguinte mostra como gerar a versão do app pronta pra enviar à loja da sua stack.",
        },
        {
          id: "publicacao.build",
          title: "Build e distribuição",
          description: "Gerar a versão final do app e enviá-la para a loja.",
          content:
            "Publicar exige transformar seu projeto numa **versão de produção**: um arquivo otimizado e assinado digitalmente, diferente da versão de desenvolvimento que roda no emulador. Essa assinatura é uma garantia de que o app veio mesmo de você, e as lojas a exigem.\n\nO processo geral é parecido nas plataformas: você gera o pacote final, cria a ficha do app na loja (com ícone, capturas e descrição), envia o pacote, preenche as informações de privacidade e submete pra revisão. Depois de aprovado, o app fica disponível. Escolha sua stack pra ver as especificidades.",
          byLanguage: {
            "react-native": {
              content:
                "Com React Native usando Expo, o caminho mais simples é o serviço de build do próprio Expo, que gera os pacotes para Android (AAB) e iOS na nuvem, sem você precisar configurar todo o ambiente nativo. Depois, você os envia pra Play Store e App Store. A documentação do Expo cobre o fluxo de build e submissão passo a passo.",
              resources: [
                {
                  label: "Expo: documentação oficial (build e submissão)",
                  url: "https://docs.expo.dev/",
                  kind: "doc",
                },
              ],
            },
            flutter: {
              content:
                "Em Flutter, você gera o pacote de produção com comandos como `flutter build appbundle` (para a Play Store) e `flutter build ipa` (para a App Store, exigindo um Mac com Xcode). A documentação oficial do Flutter tem guias dedicados de publicação pra cada loja, com cada passo de assinatura e envio.",
              resources: [
                {
                  label: "Flutter: documentação oficial",
                  url: "https://docs.flutter.dev/",
                  kind: "doc",
                },
              ],
            },
            android: {
              content:
                "No Android nativo, você gera um Android App Bundle (AAB) assinado pelo Android Studio e o envia pelo Google Play Console, a central onde você gerencia a ficha do app, os testes e o lançamento. A documentação oficial de distribuição do Android detalha todo o processo de publicação.",
              resources: [
                {
                  label: "Android: distribuir seu app (oficial)",
                  url: "https://developer.android.com/distribute",
                  kind: "doc",
                },
              ],
            },
            ios: {
              content:
                "No iOS nativo, você arquiva o app no Xcode e o envia pelo App Store Connect, a central da Apple pra gerenciar apps, fichas e o processo de revisão. É necessário estar inscrito no Apple Developer Program. A documentação oficial da Apple sobre a App Store cobre os requisitos e o fluxo de submissão.",
              resources: [
                {
                  label: "Apple: App Store (oficial)",
                  url: "https://developer.apple.com/app-store/",
                  kind: "doc",
                },
              ],
            },
          },
        },
      ],
    },
    {
      id: "carreira",
      title: "Carreira",
      description:
        "Construir um portfólio mobile e dar os primeiros passos rumo a uma vaga.",
      level: "avancado",
      children: [
        {
          id: "carreira.projeto",
          title: "Projeto final: app offline-first",
          description:
            "Um app que funciona sem internet e sincroniza depois, o desafio que consolida a trilha.",
          project: "app-offline-first-sync",
        },
        {
          id: "carreira.entrar",
          title: "Entrar na carreira mobile",
          description:
            "Como construir experiência e se posicionar para a primeira vaga.",
          optional: true,
          content:
            "A carreira mobile tem uma vantagem rara pra portfólio: você consegue construir **apps completos e publicados** por conta própria, algo palpável que recrutadores podem literalmente baixar e usar. Poucas áreas oferecem uma prova de capacidade tão concreta, e é nisso que você deve apostar.\n\nO caminho que funciona combina algumas peças. Domine os **fundamentos** da sua stack, que você construiu nesta trilha. Construa **projetos de verdade**, do simples ao mais completo: comece por um app de lista de tarefas (que exercita telas, estado e armazenamento), depois um app que consome uma API pública (como clima ou filmes), e evolua pra algo com mais funcionalidades. E **publique** pelo menos um deles numa loja, porque levar um app do código até a loja, lidando com build, assinatura e revisão, ensina muito e impressiona.\n\nDocumente tudo no GitHub, com um bom README mostrando telas e explicando o que o app faz e como foi construído. Esse portfólio é o que abre portas, especialmente pra quem não tem experiência formal ainda.\n\nUma decisão de carreira vale mencionar: as stacks **multiplataforma** (React Native e Flutter) costumam ter bastante demanda e permitem cobrir as duas plataformas com um aprendizado, o que as torna um caminho de entrada eficiente. As **nativas** (Kotlin e Swift) são muito valorizadas, especialmente em empresas com apps grandes e exigentes. Nenhuma é errada; escolha pela afinidade e pelas vagas que você mira.\n\nDuas atitudes sustentam a carreira: manter os **fundamentos** sólidos (que mudam devagar) enquanto acompanha a evolução das ferramentas (que muda rápido), e a disciplina de **terminar e publicar** projetos, porque um app no ar vale mais que dez pela metade.",
        },
      ],
    },
  ],
};
