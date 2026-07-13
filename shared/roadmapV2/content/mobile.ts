// TODO(Ana): revisao editorial completa. Trilha mobile REESTRUTURADA na fase
// 3c, lote 6 (a unica condenada pela auditoria): a secao de linguagem, que
// tinha 1 folha para as 4 stacks, virou 4 folhas byLanguage; a construcao de
// telas ganhou listas, formularios e navegacao proprios; entraram arquitetura
// de estado, permissoes, testes e o fecho de projeto calibrado. Ids
// renomeados (zero usuarios com progresso, confirmado no banco).
import type { RoadmapV2 } from "../types";

export const mobile: RoadmapV2 = {
  slug: "mobile",
  area: "mobile",
  title: "Desenvolvimento Mobile do Zero",
  level: "Iniciante",
  description:
    "Da escolha da stack à publicação de um app na loja, passando por linguagem, telas, dados, recursos do dispositivo e qualidade. Escolha seu caminho e conclua uma etapa pra liberar a próxima.",
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
        "O que é fazer apps, o que muda em relação à web e a decisão entre nativo e multiplataforma.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é desenvolvimento mobile",
          description:
            "Criar aplicativos que rodam no celular, com regras e limites próprios.",
          content:
            "Desenvolvimento mobile é criar aplicativos para celulares e tablets, os aparelhos que mais usamos no dia a dia. É construir algo que as pessoas tocam a toda hora, com desafios bem diferentes do desenvolvimento web.\n\nO que torna o mobile particular são as restrições e as capacidades do aparelho. A **tela é pequena** e o dedo é o principal jeito de interagir, então a interface se pensa pro toque, não pro mouse. Os **recursos são limitados** (bateria, memória, dados móveis), o que exige cuidado com performance. E há acesso a **recursos do dispositivo** que a web mal alcança: câmera, GPS, sensores, e notificações que chegam mesmo com o app fechado.\n\nO mundo mobile gira em torno de duas plataformas, o **Android** (Google) e o **iOS** (Apple), cada uma com suas ferramentas e sua loja de apps, com regras próprias de publicação. Atingir as duas é o objetivo da maioria dos apps, e como fazer isso é a primeira grande decisão da área.\n\nO ciclo típico é construir as telas e funcionalidades, integrar com APIs, testar em aparelhos diferentes e publicar nas lojas. Esta trilha percorre esse caminho inteiro e termina no que mais motiva quem entra na área: ver o próprio app publicado e funcionando num celular de verdade.",
        },
        {
          id: "fundamentos.nativomulti",
          title: "Nativo e multiplataforma",
          description:
            "As duas grandes abordagens pra fazer apps, e o que muda entre elas.",
          content:
            "A decisão central do mobile define o seu caminho de estudo: desenvolver de forma **nativa** ou **multiplataforma**. Esta trilha funciona com quatro stacks, e você escolhe uma no seletor acima.\n\nNo desenvolvimento **nativo**, você constrói um app específico para cada plataforma, com a linguagem e as ferramentas oficiais dela: **Kotlin** para Android, **Swift** para iOS. A vantagem é o acesso total e imediato a tudo que o sistema oferece, com a melhor performance. A desvantagem é o custo: pra ter o app nas duas plataformas, você constrói, na prática, dois apps.\n\nNo desenvolvimento **multiplataforma**, você escreve um código que roda nas duas plataformas. As opções dominantes são o **React Native** (baseado em JavaScript, do ecossistema React) e o **Flutter** (baseado na linguagem Dart, do Google). A vantagem é cobrir Android e iOS com uma base de código só; a troca é uma camada a mais entre você e o sistema e alguma perda de acesso a recursos muito específicos.\n\nNão existe escolha certa universal; depende do objetivo, do time e do contexto. Mas há uma tendência clara pra quem começa e quer empregabilidade rápida com bom alcance: as opções multiplataforma, por entregarem as duas lojas com um aprendizado só. O conteúdo da trilha inteira se adapta à stack que você selecionar acima.",
        },
      ],
    },
    {
      id: "stack",
      title: "Sua stack e linguagem",
      description:
        "O ambiente, a linguagem, o assíncrono e o paradigma declarativo da stack que você escolheu.",
      level: "iniciante",
      children: [
        {
          id: "stack.setup",
          title: "Ambiente e ferramentas",
          description:
            "Instalar o que você precisa pra criar e rodar seu primeiro app.",
          content:
            "Antes de programar, você precisa do ambiente funcionando: as ferramentas instaladas e a capacidade de rodar um app, seja num **emulador** (um celular simulado no computador) ou no seu próprio aparelho conectado. Essa etapa dá mais trabalho no mobile que em outras áreas, então vale paciência, porque ambiente quebrado é a maior fonte de frustração no começo.\n\nUm conceito comum a todas as stacks é o emulador (ou simulador), que deixa você testar sem um celular físico, embora testar no aparelho real seja sempre recomendado antes de publicar. Você domina este passo quando roda um app novo, em branco, num emulador ou no seu aparelho, sem travar na configuração. Escolha sua stack acima pra ver o passo a passo dela.",
          byLanguage: {
            "react-native": {
              content:
                "Em React Native, o caminho mais simples é o **Expo**, um conjunto de ferramentas que cuida da configuração pesada por você. Instale o Node.js, crie o projeto com o Expo e rode no celular pelo app Expo Go (lendo um QR code) ou num emulador. É o jeito mais rápido de ver algo na tela sem brigar com Android Studio e Xcode logo de cara.",
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
                "Em Flutter, você instala o **SDK do Flutter** e um editor (o VS Code com a extensão do Flutter é ótimo). O comando `flutter doctor` é seu melhor amigo: ele verifica o que falta no ambiente e te guia até tudo ficar verde. Pra rodar, use um emulador do Android Studio ou seu celular conectado. O guia oficial de instalação cobre cada sistema operacional em detalhe.",
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
                "Em Android nativo, a ferramenta central é o **Android Studio**, o ambiente oficial do Google, que já traz editor, emulador e o SDK do Android. Instale, crie um projeto Kotlin e rode num emulador ou no celular com o modo desenvolvedor ativado. A instalação é mais pesada que a das opções multiplataforma, então reserve um tempo pra ela.",
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
                "Em iOS nativo, você precisa de um **Mac**, porque a ferramenta oficial, o **Xcode**, só roda em macOS. Esse é o principal pré-requisito de hardware da plataforma. Instale o Xcode (gratuito na App Store do Mac), que traz o editor, o simulador de iPhone e o resto, crie um projeto Swift e rode no simulador ou num iPhone conectado.",
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
        {
          id: "stack.linguagem",
          title: "A linguagem da sua stack",
          description:
            "Variáveis, tipos, funções e coleções: a base sem a qual nada se sustenta.",
          content:
            "Antes de montar telas, você precisa de fluência na linguagem da sua stack. O núcleo é parecido em todas: **variáveis e tipos**, condicionais, laços, **funções** e as estruturas de dados do dia a dia (listas e mapas ou objetos). É com isso que você calcula, decide caminhos e organiza os dados que a tela vai mostrar.\n\nUm conselho que vale pra qualquer stack: não pule a linguagem pra ir direto às telas. Framework é a linguagem organizada de um jeito; sem a base, ele vira mágica que você não controla, e o primeiro erro te trava sem você entender por quê.\n\nVocê domina este passo quando lê e escreve funções que recebem dados, transformam uma lista e devolvem um resultado, sem consultar a sintaxe o tempo todo. Escolha sua stack acima pra ver qual linguagem aprender e por onde começar.",
          byLanguage: {
            "react-native": {
              content:
                "React Native usa **JavaScript** (e cada vez mais o TypeScript, que adiciona tipos por cima). A grande vantagem: se você já viu JavaScript no front-end web, a maior parte se transfere direto. Foque em funções, métodos de array (`map`, `filter`), objetos e desestruturação. Quem vem do React web tem um caminho especialmente curto.",
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
                "Flutter usa o **Dart**, criada pelo Google, de tipagem estática e sintaxe limpa, fácil de pegar pra quem já viu algo parecido com C ou Java. Foque em variáveis tipadas, funções, classes (Flutter é bem orientado a objetos), listas e mapas. A documentação oficial do Dart é clara e direta.",
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
                "Android nativo usa **Kotlin**, a linguagem oficial recomendada pelo Google, moderna e mais enxuta que o antigo Java. Foque em variáveis (`val` e `var`), funções, classes, coleções e a **segurança contra nulos**, um diferencial forte do Kotlin que evita uma classe inteira de erros. A documentação oficial tem material pra iniciantes.",
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
                "iOS nativo usa **Swift**, a linguagem moderna da Apple, segura e expressiva. Foque em variáveis (`let` e `var`), funções, structs e classes, e os **opcionais**, o jeito do Swift de lidar com ausência de valor, um conceito central da linguagem. A Apple oferece o livro oficial do Swift, gratuito, como referência completa.",
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
        {
          id: "stack.async",
          title: "Assíncrono na sua linguagem",
          description:
            "Como o app faz trabalho demorado sem travar a tela, o padrão que aparece em todo app.",
          content:
            "Quase tudo que um app faz de interessante leva tempo: buscar dados de um servidor, ler um arquivo, esperar o usuário. Se o app parasse a tela a cada espera, ele congelaria. O código **assíncrono** é a técnica pra continuar respondendo enquanto a espera acontece, e no mobile ele é onipresente, porque toda chamada de rede é assíncrona.\n\nA ideia central: quando uma operação demorada começa, você não fica olhando pra ela; registra que, quando terminar, o código continua daquele ponto, e a tela segue viva. As quatro stacks têm um jeito moderno de escrever isso que se lê quase como código normal, de cima pra baixo, escondendo a complexidade da espera.\n\nDominar esse padrão agora evita o erro número um do iniciante em mobile: travar a interface fazendo trabalho pesado na frente do usuário. Você domina este passo quando escreve uma função que espera um resultado demorado e o usa, sem congelar a tela. Escolha sua stack pra ver o mecanismo dela.",
          byLanguage: {
            "react-native": {
              content:
                "Em JavaScript, operações demoradas devolvem uma **Promise**, e o jeito moderno de consumir é `async`/`await`: `const dados = await buscar()`. O `await` pausa só aquela função, não o app. É o mesmo modelo do React web, então quem vem de lá já sabe o padrão.",
              resources: [
                {
                  label: "MDN: usando promises",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Using_promises",
                  kind: "doc",
                },
              ],
            },
            flutter: {
              content:
                "Em Dart, uma operação demorada devolve um **Future**, e você o consome com `async`/`await`: `final dados = await buscar()`. Enquanto o Future não resolve, o app segue respondendo. É um padrão que aparece em toda busca de dados no Flutter.",
              resources: [
                {
                  label: "Dart: programação assíncrona (oficial)",
                  url: "https://dart.dev/libraries/async/async-await",
                  kind: "doc",
                },
              ],
            },
            android: {
              content:
                "Em Kotlin, o assíncrono usa **corrotinas**: você marca uma função com `suspend` e a chama de dentro de um escopo de corrotina, e o Android roda o trabalho demorado fora da thread principal sem travar a tela. É o mecanismo padrão do Android moderno pra rede e disco.",
              resources: [
                {
                  label: "Android: corrotinas Kotlin (oficial)",
                  url: "https://developer.android.com/kotlin/coroutines",
                  kind: "doc",
                },
              ],
            },
            ios: {
              content:
                "Em Swift moderno, o assíncrono usa `async`/`await`: você marca a função com `async` e chama com `await`, e o sistema cuida de não bloquear a interface. É a forma recomendada hoje, mais limpa que os antigos closures de callback.",
              resources: [
                {
                  label: "Swift: concorrência (livro oficial)",
                  url: "https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "stack.ui",
          title: "UI declarativa",
          description:
            "O paradigma que as quatro stacks compartilham: descrever a tela, não montá-la passo a passo.",
          content:
            "A interface de um app é feita de pequenos blocos visuais que você combina: textos, botões, imagens, campos. O nome desses blocos muda conforme a stack, mas o paradigma moderno é o mesmo nas quatro: a **UI declarativa**.\n\nDeclarativo significa que você **descreve como a tela deve parecer** para cada estado dos dados, em vez de dar os passos pra alterá-la na mão. Você não pega um texto e troca o conteúdo dele; você diz que a tela mostra este texto quando o dado é este, e a stack se encarrega de redesenhar quando o dado muda. É uma virada de chave em relação ao jeito antigo, e é o que torna a interface previsível: olhando o código, você sabe como a tela vai ficar.\n\nOutra ideia comum é a **composição**: você combina blocos pequenos em blocos maiores, aninhando-os, e reaproveita esses pedaços. Uma tela vira uma árvore de elementos.\n\nVocê domina este passo quando monta uma tela simples (um título, um texto e um botão) e entende que ela é uma função do estado, não uma sequência de comandos. Escolha sua stack pra ver o vocabulário dela.",
          byLanguage: {
            "react-native": {
              content:
                "Em React Native, você monta telas com **componentes**: `View` (um contêiner), `Text`, `Image`, `Pressable`, escritos em JSX, a mesma sintaxe do React web. Você combina componentes pequenos em maiores e os reaproveita, exatamente como no React. Quem já fez React web se sente em casa.",
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
                "Em Flutter, **tudo é widget**: textos, botões, espaçamentos e até o layout são widgets que você aninha, formando uma árvore. Você combina widgets pequenos em maiores:\n\n```dart\nColumn(children: [\n  Text('Ola'),\n  ElevatedButton(\n    onPressed: () {},\n    child: Text('Entrar'),\n  ),\n])\n```\n\nEssa filosofia é a marca do Flutter.",
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
                "No Android moderno, a forma recomendada é o **Jetpack Compose**, declarativo em Kotlin: você descreve a tela com funções que emitem elementos chamados composables (`Text`, `Button`, `Column`, `Row`). É mais simples e moderno que o antigo sistema de layouts em XML, e é por onde vale começar hoje.",
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
                "No iOS moderno, a forma recomendada é o **SwiftUI**, declarativo em Swift: você descreve a interface com views como `Text`, `Button`, `VStack` e `HStack`, aninhando-as. A tela se atualiza sozinha conforme os dados mudam. É mais simples que o antigo UIKit e o caminho recomendado pra quem começa hoje.",
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
      ],
    },
    {
      id: "telas",
      title: "Construindo telas",
      description:
        "As telas de verdade: organizar o layout, exibir listas longas, receber entrada e navegar entre telas.",
      level: "intermediario",
      children: [
        {
          id: "telas.layout",
          title: "Layout e organização",
          description:
            "Arranjar os elementos no espaço de forma que o app fique bem em qualquer tela.",
          content:
            "Montar uma tela não é só colocar elementos; é **organizá-los no espaço**. E aqui mora um conceito universal do mobile: como os aparelhos têm tamanhos muito diferentes, você não fixa posições em pixels absolutos. Usa sistemas de layout **flexíveis** que adaptam o arranjo ao espaço disponível, garantindo que o app fique bem num celular pequeno e num tablet grande.\n\nO modelo mental é pensar em **caixas que se empilham e se alinham**: elementos em coluna (um embaixo do outro), em linha (lado a lado), com espaçamentos e alinhamentos entre eles. Combinando essas caixas você monta qualquer layout, do mais simples ao mais complexo, sem cravar coordenadas.\n\nDois hábitos evitam dor de cabeça: pense no layout de fora pra dentro (o arranjo geral primeiro, os detalhes depois) e teste em mais de um tamanho de tela cedo, pra não descobrir um layout quebrado só no fim. Você domina este passo quando monta uma tela com cabeçalho, conteúdo e rodapé que se ajusta sozinha a telas de tamanhos diferentes. Escolha sua stack pra ver o sistema de layout dela.",
          byLanguage: {
            "react-native": {
              content:
                "Em React Native, o layout usa **Flexbox**, o mesmo do CSS: a `View` organiza os filhos com `flexDirection` (`column` ou `row`), `justifyContent` e `alignItems`. Quem já fez CSS no front-end se sente em casa, com a diferença de que aqui o padrão já é coluna.",
              resources: [
                {
                  label: "React Native: layout com Flexbox (oficial)",
                  url: "https://reactnative.dev/docs/flexbox",
                  kind: "doc",
                },
              ],
            },
            flutter: {
              content:
                "Em Flutter, você organiza com os widgets `Column` (empilha na vertical) e `Row` (na horizontal), controlando o alinhamento com `mainAxisAlignment` e `crossAxisAlignment`. O `Expanded` faz um filho ocupar o espaço livre, e o `Padding` cria espaçamentos. Aninhando Columns e Rows você monta qualquer layout.",
              resources: [
                {
                  label: "Flutter: layouts (oficial)",
                  url: "https://docs.flutter.dev/ui/layout",
                  kind: "doc",
                },
              ],
            },
            android: {
              content:
                "No Jetpack Compose, você organiza com `Column` (vertical) e `Row` (horizontal), usando `Modifier` pra ajustar tamanho, espaçamento e alinhamento de cada elemento. O `Box` sobrepõe elementos. É o mesmo raciocínio de caixas que se empilham e se alinham.",
              resources: [
                {
                  label: "Compose: layouts (oficial)",
                  url: "https://developer.android.com/develop/ui/compose/layouts",
                  kind: "doc",
                },
              ],
            },
            ios: {
              content:
                "No SwiftUI, você organiza com `VStack` (empilha na vertical), `HStack` (na horizontal) e `ZStack` (sobrepõe), ajustando espaço com `Spacer` e `padding`. Aninhando essas pilhas você constrói o layout inteiro, e ele se adapta ao tamanho da tela por padrão.",
              resources: [
                {
                  label: "Apple: layout no SwiftUI (oficial)",
                  url: "https://developer.apple.com/documentation/swiftui/declaring-a-custom-view",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "telas.listas",
          title: "Listas e scroll",
          description:
            "Exibir muitos itens com rolagem fluida, sem afogar a memória do aparelho.",
          content:
            "Boa parte das telas de um app é uma **lista**: o feed, o catálogo de produtos, as mensagens, os contatos. Exibir listas bem é uma das habilidades mais usadas no mobile, e tem uma armadilha que separa o app fluido do travado.\n\nA armadilha é renderizar todos os itens de uma vez. Uma lista pode ter milhares de linhas, mas a tela mostra só uma dúzia por vez. Se você criar os mil elementos de cara, o app consome memória demais e engasga ao rolar. A solução é a **lista virtualizada**: a stack cria só os itens visíveis na tela (mais uma pequena folga), e vai criando e descartando conforme você rola. O usuário vê uma lista infinita fluida; a memória só carrega o punhado que aparece.\n\nPor isso, a regra é firme: para listas longas, **nunca** use um scroll simples com todos os itens dentro; use sempre o componente de lista virtualizada da sua stack, que faz esse trabalho por você. Cada item costuma precisar de uma **chave** ou identidade estável, pra stack saber qual é qual ao reciclar.\n\nVocê domina este passo quando exibe uma lista de centenas de itens que rola sem engasgar, usando o componente virtualizado certo. Escolha sua stack pra ver qual é.",
          byLanguage: {
            "react-native": {
              content:
                "Em React Native, a lista virtualizada é a **FlatList**: você passa os dados e uma função que desenha cada item, e ela cuida de renderizar só o visível.\n\n```jsx\n<FlatList\n  data={itens}\n  keyExtractor={(i) => i.id}\n  renderItem={({ item }) =>\n    <Text>{item.nome}</Text>}\n/>\n```\n\nEvite um `ScrollView` com mil filhos; use a FlatList.",
              resources: [
                {
                  label: "React Native: FlatList (oficial)",
                  url: "https://reactnative.dev/docs/flatlist",
                  kind: "doc",
                },
              ],
            },
            flutter: {
              content:
                "Em Flutter, a lista virtualizada é o **ListView.builder**: você informa a quantidade de itens e uma função que constrói cada um sob demanda, e o Flutter só cria os visíveis. Prefira sempre o `.builder` a montar uma `Column` gigante dentro de um scroll, que criaria tudo de uma vez.",
              resources: [
                {
                  label: "Flutter: listas (cookbook oficial)",
                  url: "https://docs.flutter.dev/cookbook/lists/long-lists",
                  kind: "doc",
                },
              ],
            },
            android: {
              content:
                "No Jetpack Compose, a lista virtualizada é a **LazyColumn** (e a LazyRow, na horizontal): dentro dela você declara os itens com `items(lista)`, e o Compose só compõe os visíveis. É o equivalente moderno do antigo RecyclerView, com muito menos código.",
              resources: [
                {
                  label: "Compose: listas (oficial)",
                  url: "https://developer.android.com/develop/ui/compose/lists",
                  kind: "doc",
                },
              ],
            },
            ios: {
              content:
                "No SwiftUI, a **List** já é virtualizada por padrão: você passa uma coleção e uma view para cada item, e ela renderiza só o visível, com rolagem fluida de fábrica. Para listas simples com poucos itens dá pra usar um `ScrollView`, mas para muitas linhas a `List` é a escolha certa.",
              resources: [
                {
                  label: "Apple: List no SwiftUI (oficial)",
                  url: "https://developer.apple.com/documentation/swiftui/list",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "telas.formularios",
          title: "Formulários e entrada",
          description:
            "Receber texto e escolhas do usuário e validar antes de enviar.",
          content:
            "Todo app real recebe **entrada do usuário**: o login, o cadastro, a busca, o comentário. O bloco central é o **campo de texto**, e a forma de trabalhar com ele revela o paradigma declarativo em ação.\n\nO padrão moderno é o **campo controlado**: o valor digitado vive no estado da tela, e o campo apenas reflete esse estado. Quando o usuário digita, um evento atualiza o estado, e o campo mostra o novo valor. Isso pode parecer indireto, mas dá um poder enorme: o valor está sempre na sua mão, pronto pra validar, limpar ou enviar, sem você ir buscar no elemento da tela.\n\nA **validação** completa o quadro. Antes de enviar um formulário, você confere o que veio: e-mail com formato certo, campo obrigatório preenchido, senha no tamanho mínimo. E mostra o erro de forma clara, ao lado do campo, em vez de deixar o usuário adivinhar. Um bom formulário guia, não pune.\n\nDois cuidados de mobile: use o **tipo de teclado** certo (numérico para telefone, e-mail para e-mail) e trate o teclado que cobre a tela, um detalhe que todo iniciante esquece. Você domina este passo quando monta um formulário de login com validação que só habilita o envio quando os campos estão válidos. Escolha sua stack pra ver o campo de entrada dela.",
          byLanguage: {
            "react-native": {
              content:
                "Em React Native, o campo é o **TextInput**, controlado pelo estado:\n\n```jsx\nconst [email, setEmail] = useState('');\n<TextInput\n  value={email}\n  onChangeText={setEmail}\n/>\n```\n\nO `value` vem do estado e o `onChangeText` o atualiza. Use `keyboardType` pra escolher o teclado.",
              resources: [
                {
                  label: "React Native: TextInput (oficial)",
                  url: "https://reactnative.dev/docs/textinput",
                  kind: "doc",
                },
              ],
            },
            flutter: {
              content:
                "Em Flutter, o campo é o **TextField**, e você lê o valor com um `TextEditingController` ou pelo callback `onChanged`. Pra formulários com validação, o Flutter tem o widget `Form` com `TextFormField`, que integra a checagem de cada campo e mostra os erros de forma organizada.",
              resources: [
                {
                  label: "Flutter: formulários (cookbook oficial)",
                  url: "https://docs.flutter.dev/cookbook/forms/validation",
                  kind: "doc",
                },
              ],
            },
            android: {
              content:
                "No Jetpack Compose, o campo é o **TextField**, controlado por estado: você guarda o valor com `remember` e `mutableStateOf`, passa em `value` e atualiza no `onValueChange`. É o mesmo padrão de campo controlado, com o estado do Compose por trás.",
              resources: [
                {
                  label: "Compose: entrada de texto (oficial)",
                  url: "https://developer.android.com/develop/ui/compose/text/user-input",
                  kind: "doc",
                },
              ],
            },
            ios: {
              content:
                'No SwiftUI, o campo é o **TextField**, ligado a uma propriedade de estado por um binding: `TextField("Email", text: $email)`. O `$email` conecta o campo ao `@State`, e o valor fica sempre sincronizado. Modificadores como `keyboardType` ajustam o teclado.',
              resources: [
                {
                  label: "Apple: TextField no SwiftUI (oficial)",
                  url: "https://developer.apple.com/documentation/swiftui/textfield",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "telas.navegacao",
          title: "Navegação entre telas",
          description:
            "Levar o usuário de uma tela a outra de forma organizada.",
          content:
            "Apps reais têm várias telas, e o usuário transita entre elas: da lista pro detalhe, da home pras configurações, do login pro conteúdo. Organizar esses caminhos é o trabalho de **navegação**, e fazê-la bem é o que dá estrutura ao app.\n\nO padrão mais comum é a navegação em **pilha** (stack): ao abrir uma tela nova, ela empilha sobre a anterior, e o botão de voltar a remove, revelando a de baixo. É o modelo mental de um baralho de telas: você coloca uma por cima, e volta tirando a do topo. Há também as **abas** na base da tela, pra alternar entre as seções principais do app.\n\nDois pontos importam desde cedo. Passar **dados entre telas**: a tela de lista precisa dizer à de detalhe qual item foi tocado, então a navegação carrega parâmetros. E o **botão voltar**: no Android ele é um botão do sistema que o usuário espera que funcione, então sua navegação precisa respeitá-lo.\n\nVocê domina este passo quando cria um fluxo de duas telas (uma lista e um detalhe), navega de uma pra outra passando qual item foi escolhido, e volta. Escolha sua stack pra ver a ferramenta de navegação dela.",
          byLanguage: {
            "react-native": {
              content:
                "Em React Native, a biblioteca padrão é o **React Navigation**: você define as telas e navega entre elas com uma pilha (stack), abas e menus laterais, passando parâmetros na navegação. É uma das primeiras bibliotecas que você adiciona a qualquer app de verdade.",
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
                "Em Flutter, a navegação básica usa o **Navigator**, que gerencia uma pilha de telas (rotas): você empilha com `push` e volta com `pop`, passando dados no construtor da tela. Pra apps maiores há sistemas de rotas mais estruturados, mas o Navigator com push e pop resolve os primeiros apps.",
              resources: [
                {
                  label: "Flutter: navegação (cookbook oficial)",
                  url: "https://docs.flutter.dev/cookbook/navigation/navigation-basics",
                  kind: "doc",
                },
              ],
            },
            android: {
              content:
                "No Android com Compose, a navegação usa o **Navigation Compose**: você define rotas (destinos) e navega entre elas mantendo a pilha, com argumentos passados na rota. Ele integra com o comportamento esperado do botão voltar do sistema, e faz parte das bibliotecas Jetpack.",
              resources: [
                {
                  label: "Compose: navegação (oficial)",
                  url: "https://developer.android.com/develop/ui/compose/navigation",
                  kind: "doc",
                },
              ],
            },
            ios: {
              content:
                "No SwiftUI, a navegação em pilha usa a **NavigationStack**, dentro da qual o `NavigationLink` leva o usuário de uma tela a outra, com o botão voltar surgindo sozinho. Para as seções principais, a `TabView` cria as abas na base. São os componentes nativos do SwiftUI pra estruturar os caminhos.",
              resources: [
                {
                  label: "Apple: navegação no SwiftUI (oficial)",
                  url: "https://developer.apple.com/documentation/swiftui/navigationstack",
                  kind: "doc",
                },
              ],
            },
          },
        },
      ],
    },
    {
      id: "dados",
      title: "Dados e estado",
      description:
        "Conectar o app ao servidor, organizar o estado que a tela mostra e guardar dados no aparelho.",
      level: "intermediario",
      children: [
        {
          id: "dados.api",
          title: "Consumir uma API",
          description:
            "Buscar e enviar dados de um servidor, o que quase todo app faz.",
          content:
            "Quase todo app conversa com um servidor: busca uma lista de produtos, envia um cadastro, carrega o feed, confirma um login. Isso acontece através de **APIs**, e é o que conecta seu app ao mundo.\n\nO padrão é o mesmo que sustenta a web: o app faz uma **requisição** HTTP a uma API (com um método como GET pra buscar ou POST pra enviar), o servidor responde com um código de status e, em geral, dados em **JSON**, que o app converte pra exibir na tela. Como isso leva tempo, o trabalho é **assíncrono**, aquele que você já viu, e você precisa tratar três situações: **carregando, sucesso e erro**. Mostrar um indicador enquanto carrega e uma mensagem clara quando a rede falha é o que separa um app polido de um que parece travado.\n\nO fluxo típico: ao abrir a tela, dispara a requisição, guarda a resposta no estado, e a tela se monta com os dados reais. O conceito é idêntico nas quatro stacks; muda a ferramenta da requisição.\n\nVocê domina este passo quando sua tela busca dados de uma API pública e mostra os três estados, sem nunca ficar em branco esperando. Escolha sua stack pra ver como fazer a requisição.",
          byLanguage: {
            "react-native": {
              content:
                "Em React Native, você usa a função `fetch` (a mesma do navegador) ou bibliotecas como o axios, com `async`/`await` pra esperar a resposta. Guarda o resultado no estado e a tela se atualiza. O fluxo é igual ao do React web.",
              resources: [
                {
                  label: "React Native: rede (oficial)",
                  url: "https://reactnative.dev/docs/network",
                  kind: "doc",
                },
              ],
            },
            flutter: {
              content:
                "Em Flutter, o pacote oficial `http` faz as requisições, e você usa `Future` com `async`/`await` pra lidar com a resposta. O cookbook oficial tem uma receita direta de buscar dados de uma API e exibi-los, um ótimo ponto de partida prático.",
              resources: [
                {
                  label: "Flutter: buscar dados de uma API (cookbook)",
                  url: "https://docs.flutter.dev/cookbook/networking/fetch-data",
                  kind: "doc",
                },
              ],
            },
            android: {
              content:
                "No Android, as requisições costumam usar bibliotecas consagradas como o **Retrofit**, combinadas com corrotinas Kotlin pra lidar com o assincronismo de forma limpa. O guia de arquitetura do Android mostra como organizar a camada de dados que conversa com a rede.",
              resources: [
                {
                  label: "Android: camada de dados (oficial)",
                  url: "https://developer.android.com/topic/architecture/data-layer",
                  kind: "doc",
                },
              ],
            },
            ios: {
              content:
                "No iOS, a **URLSession** é a ferramenta nativa pra requisições de rede, e com Swift moderno você a usa com `async`/`await`. Decodifica o JSON da resposta em tipos Swift e atualiza a interface. Tudo isso vem na própria plataforma, sem bibliotecas externas pra começar.",
              resources: [
                {
                  label: "Apple: URLSession (oficial)",
                  url: "https://developer.apple.com/documentation/foundation/urlsession",
                  kind: "doc",
                },
              ],
            },
          },
        },
        {
          id: "dados.estado",
          title: "Arquitetura de estado",
          description:
            "Do estado local de uma tela à organização do estado num app que cresce.",
          content:
            "O **estado** são os dados que a tela mostra e que mudam com o uso: o texto de um campo, o item selecionado, a lista vinda da API. No paradigma declarativo, você atualiza o estado e a interface se redesenha sozinha. Cada stack tem uma forma básica de guardar estado dentro de uma tela, e é por aí que se começa.\n\nMas o estado vira um problema de **arquitetura** quando o app cresce. Duas telas distantes precisam do mesmo dado (o usuário logado, o carrinho); um valor precisa sobreviver à troca de tela; a mesma informação aparece em vários lugares e não pode divergir. Guardar tudo no estado local de cada tela leva ao caos de passar dado de mão em mão por muitas camadas.\n\nA solução é **elevar o estado**: dados compartilhados sobem pra um lugar comum, acima das telas que os usam, e há soluções de gerenciamento de estado dedicadas a isso em cada ecossistema. A regra sadia: comece pelo estado local simples, e adote uma solução de estado global só quando a dor de compartilhar aparecer de verdade, não por antecipação.\n\nVocê domina este passo quando decide, com critério, o que fica no estado local de uma tela e o que precisa ser compartilhado. Escolha sua stack pra ver o estado local dela.",
          byLanguage: {
            "react-native": {
              content:
                "Em React Native, o estado local usa **hooks**, principalmente o `useState`. Quando o valor muda, o componente se redesenha. Pra estado compartilhado, começa-se pelo `useContext`, e apps maiores adotam bibliotecas como Zustand ou Redux. É o mesmo modelo do React web.",
              resources: [
                {
                  label: "React: gerenciar estado (oficial)",
                  url: "https://react.dev/learn/managing-state",
                  kind: "doc",
                },
              ],
            },
            flutter: {
              content:
                "Em Flutter, o estado local básico vem do `StatefulWidget` com `setState`, que avisa o framework pra redesenhar. Conforme o app cresce, adotam-se soluções de gerenciamento de estado como Provider ou Riverpod. Comece pelo `setState` pra entender o mecanismo antes de adotar abstrações.",
              resources: [
                {
                  label: "Flutter: gerenciamento de estado (oficial)",
                  url: "https://docs.flutter.dev/data-and-backend/state-mgmt/intro",
                  kind: "doc",
                },
              ],
            },
            android: {
              content:
                'No Jetpack Compose, o estado local usa `remember` e `mutableStateOf`, e a tela recompoe quando ele muda:\n\n```kotlin\nvar texto by remember {\n  mutableStateOf("")\n}\n```\n\nPra estado que sobrevive à tela, o Android usa o **ViewModel**, base da arquitetura recomendada.',
              resources: [
                {
                  label: "Compose: estado (oficial)",
                  url: "https://developer.android.com/develop/ui/compose/state",
                  kind: "doc",
                },
              ],
            },
            ios: {
              content:
                "No SwiftUI, o estado local é declarado com `@State`, e a view se atualiza quando ele muda. Pra compartilhar estado entre telas, usam-se `@Observable` (ou o antigo `ObservableObject`) e o `@Environment`, que injetam um modelo comum na árvore de views.",
              resources: [
                {
                  label: "Apple: gerenciamento de estado (oficial)",
                  url: "https://developer.apple.com/documentation/swiftui/state-and-data-flow",
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
            "Nem tudo precisa ir pro servidor. Muitas vezes o app guarda dados no **próprio aparelho**: a preferência de tema, se o usuário já viu a introdução, um rascunho, ou dados pra funcionar offline. Isso é o armazenamento local, e ele tem níveis.\n\nPara **dados pequenos e simples** (uma configuração, um sinalizador de já-abriu-antes), cada plataforma tem um mecanismo leve de chave e valor, que guarda pares como tema igual a escuro. Para **dados estruturados e maiores** (uma lista que precisa sobreviver ao fechamento do app, com buscas e relações), usa-se um **banco de dados local** no dispositivo, quase sempre baseado em SQLite ou em soluções construídas sobre ele.\n\nA regra pra escolher é o volume e a complexidade: configuração simples pede o mecanismo leve; muitos registros com consultas pedem banco local. E um cuidado inegociável de segurança: dados sensíveis, como senhas e tokens, **não** vão no armazenamento comum; cada plataforma tem um cofre seguro próprio pra isso.\n\nSaber quando o dado fica no aparelho e quando vai pro servidor é uma decisão de arquitetura que você toma o tempo todo, e é o alicerce do projeto final desta trilha, o app offline-first. Você domina este passo quando salva uma preferência do usuário que continua lá depois de fechar e reabrir o app.",
        },
      ],
    },
    {
      id: "recursos",
      title: "Recursos do dispositivo",
      description:
        "O que diferencia um app de um site: acessar o hardware com permissão e usar notificações.",
      level: "intermediario",
      children: [
        {
          id: "recursos.permissoes",
          title: "Permissões e privacidade",
          description:
            "Por que o sistema protege câmera e localização, e como pedir acesso do jeito certo.",
          content:
            "Antes de usar a câmera, a localização ou os contatos, o app precisa de **permissão** do usuário. O sistema operacional protege esses recursos justamente porque são sensíveis, e essa barreira é uma das coisas que mais diferencia o mobile da web. Entender permissões é pré-requisito pra usar qualquer recurso do aparelho.\n\nO fluxo é sempre parecido: no momento em que o app vai usar o recurso, ele pede autorização, o sistema mostra um alerta, e o usuário aceita ou nega. Seu código precisa tratar os dois caminhos, porque negar é comum, e um app que quebra quando a permissão é negada passa vergonha.\n\nAqui mora uma questão de experiência que também é de respeito: **peça bem**. Peça a permissão na hora em que ela faz sentido (a câmera quando o usuário toca em tirar foto, não no primeiro segundo do app), e explique o porquê antes. Pedir tudo de uma vez, sem contexto, afasta o usuário e é motivo de rejeição nas lojas. A regra de ouro é o **menor acesso**: peça só o que o app realmente precisa, e deixe claro pra quê.\n\nVocê domina este passo quando pede uma permissão na hora certa, com uma explicação, e trata com elegância o caso em que o usuário nega.",
          resources: [
            {
              label: "Android: permissões (oficial)",
              url: "https://developer.android.com/guide/topics/permissions/overview",
              kind: "doc",
            },
            {
              label: "Apple: privacidade e acesso a dados (oficial)",
              url: "https://developer.apple.com/documentation/uikit/protecting-the-user-s-privacy",
              kind: "doc",
            },
          ],
        },
        {
          id: "recursos.camera",
          title: "Câmera, galeria e sensores",
          description:
            "Acessar o hardware do aparelho, o que torna um app integrado ao celular.",
          content:
            "O que torna um app mais poderoso que um site é o acesso ao **hardware do aparelho**: a câmera pra tirar foto ou ler um QR code, a galeria pra escolher uma imagem, o **GPS** pra saber a localização, e sensores como o acelerômetro. Usar esses recursos é o que faz o app parecer de verdade parte do celular.\n\nO padrão de uso é constante, qualquer que seja o recurso: você **pede a permissão** (o passo anterior), **aciona o recurso** por uma API da plataforma ou uma biblioteca, e **recebe o resultado** (a foto, as coordenadas, a leitura). Nas stacks nativas você chama a API do sistema direto; nas multiplataforma, um plugin embrulha esse acesso nativo pra você, e cada recurso tem o seu (um pra câmera, um pra localização).\n\nDois hábitos evitam frustração. Teste no **aparelho real**, porque câmera e sensores nem sempre funcionam bem no emulador. E trate o caso de o recurso **não existir** ou estar indisponível (nem todo aparelho tem todos os sensores), em vez de assumir que está sempre lá.\n\nO conselho geral é incremental: construa apps que funcionam primeiro, e adicione câmera, localização ou sensores quando o projeto realmente pedir. Você domina este passo quando o app tira uma foto ou lê a localização e usa esse resultado na tela, tratando a permissão negada.",
        },
        {
          id: "recursos.notificacoes",
          title: "Notificações",
          description:
            "Avisar o usuário mesmo com o app fechado, das locais simples às push.",
          content:
            "As **notificações** são o jeito de um app falar com o usuário mesmo quando ele não está com o app aberto: o lembrete, a mensagem nova, a promoção. Bem usadas, trazem a pessoa de volta; mal usadas, fazem o app ser desinstalado. Há dois tipos, com complexidades bem diferentes.\n\nAs **notificações locais** são agendadas pelo próprio app, no aparelho: um lembrete pra daqui a uma hora, um alarme diário. São simples de implementar, porque tudo acontece dentro do dispositivo, sem servidor. Um ótimo primeiro contato com o tema.\n\nAs **notificações push** são enviadas de um **servidor** pra o aparelho, mesmo com o app fechado, e é assim que um app de mensagens avisa que chegou algo. Elas são mais avançadas: envolvem um serviço de mensagens da plataforma, o registro de um identificador único do aparelho, e uma parte de servidor pra disparar. Vale conhecer o conceito agora e deixar a implementação completa pra quando o projeto exigir.\n\nUm ponto transversal: como tudo que incomoda o usuário, notificação também pede **permissão**, e mandar em excesso é o caminho mais rápido pra desinstalação. Você domina este passo quando agenda uma notificação local e entende, em linhas gerais, o que uma push exige a mais.",
          resources: [
            {
              label: "Android: notificações (oficial)",
              url: "https://developer.android.com/develop/ui/views/notifications",
              kind: "doc",
            },
            {
              label: "Apple: notificações do usuário (oficial)",
              url: "https://developer.apple.com/documentation/usernotifications",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "qualidade",
      title: "Qualidade e publicação",
      description:
        "O que separa um protótipo de um app de verdade: testes, performance, e o caminho até a loja.",
      level: "avancado",
      children: [
        {
          id: "qualidade.testes",
          title: "Testar o app",
          description:
            "A rede de segurança que deixa você mudar o app sem quebrar o que já funciona.",
          content:
            "Seu app funciona hoje. A pergunta que separa protótipo de produto é outra: você consegue mudá-lo amanhã sem quebrar o que já funciona? **Teste automatizado** é código que executa o seu código e confere o resultado, e é ele que dá essa confiança. Rodou verde, pode publicar; vermelho, você descobre o problema antes do usuário, e antes da revisão da loja.\n\nNum app mobile, três camadas cobrem o essencial, na lógica da **pirâmide de testes**: muitos testes baratos na base, poucos e caros no topo.\n\n- **Teste de unidade**: verifica a lógica pura (o cálculo de um total, a validação de um formulário), sem subir a interface. É a base larga e rápida.\n- **Teste de componente ou widget**: monta um pedaço da tela em memória e confere que ele reage (o botão desabilita, o texto aparece), sem precisar de um aparelho.\n- **Teste de ponta a ponta**: roda o app de verdade num emulador e simula o usuário percorrendo um fluxo, como fazer login. É o mais caro, então cobre só os caminhos críticos.\n\nCada stack tem seu ferramental: o React Native usa Jest com a Testing Library; o Flutter traz o `flutter test` embutido; o Android usa JUnit e Espresso; o iOS usa o XCTest. Você domina este passo quando um comando roda a suíte inteira e o verde te dá coragem de publicar.",
          resources: [
            {
              label: "Flutter: testes (oficial)",
              url: "https://docs.flutter.dev/testing/overview",
              kind: "doc",
            },
            {
              label: "Android: testar apps (oficial)",
              url: "https://developer.android.com/training/testing",
              kind: "doc",
            },
          ],
        },
        {
          id: "qualidade.performance",
          title: "Performance e tamanho do app",
          description:
            "Fazer o app rodar liso, respeitar os limites do celular e não pesar no download.",
          content:
            "No celular, performance não é luxo; é requisito. Os aparelhos têm limites de processamento, memória, **bateria** e **dados móveis**, e o usuário percebe na hora quando um app trava, esquenta o telefone ou consome demais.\n\nO mais visível é manter a interface **fluida**. Telas que engasgam ao rolar e toques que demoram a responder passam impressão de app malfeito. A causa mais comum é fazer trabalho pesado na thread principal, a que cuida da tela; a solução é jogar tarefas demoradas pra segundo plano, o trabalho assíncrono que você já viu. As **listas longas** são o caso clássico: use sempre a lista virtualizada da sua stack, nunca um scroll com tudo dentro.\n\nHá também o **tamanho do app**, que muita gente ignora. Um app grande demora mais pra baixar, ocupa espaço e afasta usuários com aparelho modesto ou internet limitada. Cuide do peso das imagens, remova o que não usa, e as ferramentas de build de cada stack ajudam a enxugar o pacote final.\n\nUm princípio pra iniciantes: fuja da **otimização prematura**. Primeiro faça o app funcionar correto e organizado; depois, se notar lentidão real, meça e otimize o ponto específico. Mas tenha desde cedo a consciência de que, no mobile, você é convidado de um aparelho com recursos limitados, e bons apps respeitam isso.",
        },
        {
          id: "publicacao.lojas",
          title: "As lojas de aplicativos",
          description:
            "Como funcionam a Play Store e a App Store, e o que elas exigem.",
          content:
            "O destino final de um app são as lojas: a **Play Store** (Android, do Google) e a **App Store** (iOS, da Apple). Publicar nelas transforma um projeto em algo que qualquer pessoa baixa, e é um diferencial enorme num portfólio. Mas cada loja tem regras, e conhecê-las evita surpresas.\n\nAlguns pontos são comuns às duas. Ambas cobram uma **taxa de conta de desenvolvedor** (a do Google é um pagamento único; a da Apple é anual), então há um custo real. Ambas fazem uma **revisão** dos apps antes de aprovar, checando qualidade, conteúdo e privacidade. E ambas exigem que você prepare os materiais: ícone, capturas de tela, descrição, e uma política de privacidade explicando o que o app faz com os dados.\n\nHá diferenças de cultura. A **App Store** tem fama de revisão mais rigorosa e demorada, com diretrizes detalhadas que vale ler antes de construir, pra não ter o app rejeitado por algo evitável. A **Play Store** costuma ter processo mais rápido, mas igualmente leva privacidade a sério.\n\nUm ponto que pega iniciantes: a **privacidade** virou central. As duas lojas exigem que você declare quais dados o app coleta e por quê, e penalizam quem não cumpre. Pensar nisso desde o design, e não só na hora de publicar, evita retrabalho. O passo seguinte mostra como gerar a versão pronta pra enviar.",
        },
        {
          id: "publicacao.build",
          title: "Build assinado e distribuição",
          description:
            "Gerar a versão final assinada do app e enviá-la à loja.",
          content:
            "Publicar exige transformar seu projeto numa **versão de produção**: um pacote otimizado e **assinado digitalmente**, diferente da versão de desenvolvimento que roda no emulador. A assinatura é uma garantia de que o app veio mesmo de você, e as lojas a exigem, então guardar bem a chave de assinatura é crítico: perdê-la pode impedir você de atualizar o próprio app.\n\nO processo geral é parecido nas plataformas: você gera o pacote final, cria a ficha do app na loja (ícone, capturas, descrição), envia o pacote, preenche as informações de privacidade e submete pra revisão. Aprovado, o app fica disponível. Escolha sua stack pra ver as especificidades.",
          byLanguage: {
            "react-native": {
              content:
                "Com React Native usando Expo, o caminho mais simples é o serviço de build do Expo (EAS), que gera os pacotes de Android (AAB) e iOS na nuvem, sem você configurar todo o ambiente nativo, e depois submete às lojas. A documentação do Expo cobre o fluxo de build e submissão passo a passo.",
              resources: [
                {
                  label: "Expo: build e submissão (oficial)",
                  url: "https://docs.expo.dev/deploy/build-project/",
                  kind: "doc",
                },
              ],
            },
            flutter: {
              content:
                "Em Flutter, você gera o pacote com `flutter build appbundle` (para a Play Store) e `flutter build ipa` (para a App Store, exigindo um Mac com Xcode). A documentação oficial tem guias dedicados de publicação pra cada loja, com cada passo de assinatura e envio.",
              resources: [
                {
                  label: "Flutter: publicar na Play Store (oficial)",
                  url: "https://docs.flutter.dev/deployment/android",
                  kind: "doc",
                },
              ],
            },
            android: {
              content:
                "No Android nativo, você gera um Android App Bundle (AAB) assinado pelo Android Studio e o envia pelo **Google Play Console**, a central onde gerencia a ficha, os testes e o lançamento. A documentação oficial de distribuição detalha o processo inteiro.",
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
                "No iOS nativo, você arquiva o app no Xcode e o envia pelo **App Store Connect**, a central da Apple pra gerenciar apps, fichas e a revisão. É necessário estar inscrito no Apple Developer Program. A documentação oficial cobre os requisitos e o fluxo de submissão.",
              resources: [
                {
                  label: "Apple: App Store Connect (oficial)",
                  url: "https://developer.apple.com/help/app-store-connect/",
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
        "O projeto que consolida a trilha e os primeiros passos rumo a uma vaga mobile.",
      level: "avancado",
      children: [
        {
          id: "carreira.projeto",
          title: "Projeto final: app offline-first",
          description:
            "Um app que funciona sem internet e sincroniza depois, o desafio que consolida a trilha.",
          content:
            "Olhe pra trás um instante: você entrou nesta trilha sem rodar um app, e agora domina a linguagem da sua stack, monta telas com listas e formulários, navega entre elas, consome APIs, organiza o estado, guarda dados no aparelho e sabe testar e publicar. Este passo junta tudo no desafio que mais prova a maturidade de um dev mobile: um app **offline-first**.\n\nA encomenda é o app do projeto abaixo: um app que **funciona sem internet** e sincroniza quando a conexão volta. Escolha um domínio simples (notas, tarefas, um diário). O usuário cria e edita itens a qualquer momento, mesmo em modo avião; o app guarda tudo no **armazenamento local**, mostra os dados na hora, e quando a rede volta, envia o que mudou pro servidor e traz o que veio de fora. É o cruzamento de tudo: estado, dados locais, API e o cuidado com os três estados de carregamento.\n\nO que separa este projeto de um app comum é lidar com o **conflito e a ausência de rede** com dignidade: nada de tela em branco quando está offline, nada de perder o que o usuário digitou. Teste no modo avião de propósito e prove que funciona.\n\nO critério de chegada é objetivo: o app rodando no aparelho, funcional offline e sincronizando ao reconectar, publicado ou pelo menos com o pacote assinado gerado, e o repositório no GitHub com um README que mostra as telas e explica a estratégia de sincronização. É este app que prova, mais alto que qualquer certificado, que você constrói mobile de verdade.",
          project: "app-offline-first-sync",
        },
        {
          id: "carreira.entrar",
          title: "Entrar na carreira mobile",
          description:
            "Como construir experiência e se posicionar para a primeira vaga.",
          optional: true,
          content:
            "A carreira mobile tem uma vantagem rara pra portfólio: você constrói **apps completos e publicados** por conta própria, algo palpável que recrutadores podem literalmente baixar e usar. Poucas áreas oferecem prova de capacidade tão concreta, e é nisso que você deve apostar.\n\nO caminho combina algumas peças. Domine os **fundamentos** da sua stack, que você construiu aqui. Construa **projetos de verdade**, do simples ao completo: comece por um app de lista de tarefas (que exercita telas, estado e armazenamento), depois um que consome uma API pública (clima, filmes), e evolua pro projeto offline-first desta trilha. E **publique** pelo menos um numa loja, porque levar um app do código até a loja, lidando com build, assinatura e revisão, ensina muito e impressiona.\n\nDocumente tudo no GitHub, com um README mostrando telas e explicando o que o app faz e como foi construído. Esse portfólio é o que abre portas pra quem ainda não tem experiência formal.\n\nSobre a escolha de stack: as **multiplataforma** (React Native e Flutter) têm bastante demanda e cobrem as duas plataformas com um aprendizado, um caminho de entrada eficiente. As **nativas** (Kotlin e Swift) são muito valorizadas, especialmente em empresas com apps grandes. Nenhuma é errada; escolha pela afinidade e pelas vagas que você mira.\n\nDuas atitudes sustentam a carreira: manter os **fundamentos** sólidos (que mudam devagar) enquanto acompanha a evolução das ferramentas (que muda rápido), e a disciplina de **terminar e publicar**, porque um app no ar vale mais que dez pela metade.",
        },
      ],
    },
  ],
};
