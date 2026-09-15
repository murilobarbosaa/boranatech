// TODO(Ana): revisao editorial completa desta trilha (primeira trilha de
// estilo da plataforma; titulo, descricao, resumo e todo o conteudo longo
// precisam de revisao de copy).
import type { RoadmapV2 } from "../types";

export const css: RoadmapV2 = {
  slug: "css",
  area: "linguagem",
  kind: "linguagem",
  codeLanguages: ["css", "html"],
  // TODO(Ana): titulo da trilha
  title: "CSS do Zero",
  level: "Iniciante",
  // TODO(Ana): descricao da trilha
  description:
    "Da primeira regra até layout responsivo com flexbox e grid, com a linguagem que dá aparência a toda página da web. Conclua uma etapa pra liberar a próxima.",
  // TODO(Ana): resumo curto da trilha no card da vitrine
  summary:
    "A aparência e o layout de toda página da web, da primeira regra ao projeto.",
  sections: [
    {
      id: "fundamentos",
      title: "Primeiros passos com CSS",
      level: "iniciante",
      description:
        "O que o CSS faz, como ligar a folha de estilos à página, a forma de uma regra e como manter o arquivo organizado.",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é CSS",
          description:
            "A linguagem que descreve a aparência de uma página, e por que ela vive separada da marcação.",
          content:
            "CSS é a linguagem que descreve **como** o conteúdo aparece. O HTML diz o que cada parte é; o CSS diz a cor, o tamanho, o espaço em volta e a posição na tela. São duas perguntas diferentes sobre o mesmo conteúdo, e por isso moram em arquivos diferentes.\n\nEssa separação não é preciosismo. Com ela, a mesma marcação recebe aparências diferentes sem ser reescrita, uma folha de estilos vale para o site inteiro, e quem lê a página sem enxergar (um leitor de tela, um buscador) continua recebendo o significado intacto. A trilha HTML do Zero construiu esse significado; aqui você trabalha sobre ele.\n\nO navegador já aplica um estilo próprio antes de você escrever qualquer coisa: por isso um `<h1>` nasce grande e em negrito, e um link nasce azul e sublinhado. O seu CSS não começa do vazio, ele **conversa** com esse estilo padrão, às vezes concordando, às vezes substituindo.\n\nO modelo mental que vale carregar a trilha inteira: você não desenha a página pixel a pixel, você declara regras, e o navegador decide o resultado a partir delas, do tamanho da tela e das preferências de quem está lendo.\n\nVocê domina este passo quando explica, sem jargão, o que muda de responsabilidade entre o arquivo de marcação e o de estilo.",
          resources: [
            {
              label: "MDN: CSS (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.ligar",
          title: "Ligar o CSS à página",
          description:
            "As três formas de aplicar estilo e por que só uma delas é a recomendada.",
          content:
            'Existem três formas de aplicar CSS, e elas não são equivalentes.\n\nA recomendada é a **folha externa**: um arquivo separado, ligado no `<head>` da página.\n\n```html\n<link rel="stylesheet" href="estilos.css">\n```\n\nUm arquivo, todas as páginas do site, um lugar só para mudar. É o que esta trilha usa do começo ao fim.\n\nA segunda é o elemento `<style>`, escrito dentro do próprio HTML. Serve para um teste rápido ou para uma página única, e tem o defeito de não ser reaproveitável.\n\nA terceira é o atributo `style`, escrito no elemento. Evite: ele mistura conteúdo e aparência na mesma linha, não se reaproveita, e é difícil de vencer na disputa entre regras, assunto da seção Cascata, especificidade e herança.\n\nCrie agora o arquivo `estilos.css` ao lado do seu `index.html` e ligue os dois. Se a página não mudar quando você escrever a primeira regra, o suspeito quase sempre é o caminho do `href`: ele é relativo ao arquivo HTML.\n\nVocê domina este passo quando liga uma folha externa e vê a primeira regra surtir efeito na tela.',
          resources: [
            {
              label: "MDN: primeiros passos com CSS (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Core/Styling_basics",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.regra",
          title: "A forma de uma regra",
          description:
            "Seletor, bloco, declaração, propriedade e valor: o vocabulário que se repete em todo o CSS.",
          content:
            'Toda regra de CSS tem a mesma forma, e aprender essa forma uma vez resolve o resto da trilha.\n\n```css\np {\n  color: #333333;\n  line-height: 1.6;\n}\n```\n\nO **seletor** é o `p`: ele responde a pergunta "quais elementos?". O **bloco** é o que vem entre chaves. Cada linha do bloco é uma **declaração**, formada por uma **propriedade** (`color`) e um **valor** (`#333333`), separados por dois-pontos e terminados por ponto e vírgula.\n\nO ponto e vírgula fecha a declaração. Omiti-lo na última linha funciona em muitos casos, e esta trilha escreve sempre, inclusive na última: assim acrescentar uma declaração depois nunca quebra a anterior.\n\nComentários ficam entre `/*` e `*/`, e valem para explicar uma decisão que o código não conta sozinho.\n\nErros de escrita não têm aviso: o navegador simplesmente ignora a declaração que não entende e segue para a próxima. Uma propriedade com nome errado, um valor sem unidade ou um dois-pontos faltando somem em silêncio, e a página fica sem aquele efeito.\n\nVocê domina este passo quando aponta, numa regra qualquer, onde está o seletor, a propriedade e o valor.',
        },
        {
          id: "fundamentos.organizar",
          title: "Organizar a folha de estilos",
          description:
            "A ordem do arquivo, o uso de comentários e o hábito que evita a folha virar um depósito.",
          content:
            "Uma folha de estilos cresce rápido, e a diferença entre um arquivo que se lê e um depósito é só hábito.\n\nA ordem que funciona bem começa pelo geral e termina no específico: primeiro o que vale para a página inteira, depois cada área. Na prática, uma sequência assim:\n\n```css\n/* 1. variaveis e reset */\n/* 2. tipografia e cores base */\n/* 3. cabecalho, conteudo, rodape */\n/* 4. componentes: cartao, botao, formulario */\n/* 5. media queries */\n```\n\nEssa ordem não é só estética. Como você vai ver na seção Cascata, especificidade e herança, quando duas regras têm a mesma força, vence a que está por último. Escrever do geral para o específico faz a cascata trabalhar a seu favor em vez de contra.\n\nComentários valem para o porquê, não para o quê: `/* cor do texto */` antes de `color` não acrescenta nada, mas `/* contraste minimo para o texto pequeno */` explica uma decisão.\n\nUm único arquivo dá conta de um site pequeno, e é o que esta trilha usa. Dividir em vários arquivos só compensa quando a folha fica grande a ponto de você não achar mais as coisas.\n\nVocê domina este passo quando abre a sua folha e sabe, sem procurar, em que parte dela cada tipo de regra mora.",
        },
      ],
    },
    {
      id: "seletores",
      title: "Seletores",
      level: "iniciante",
      description:
        "Escolher exatamente os elementos que vão receber estilo: por tipo, por classe, por posição e por estado.",
      children: [
        {
          id: "seletores.basicos",
          title: "Seletores básicos",
          description:
            "Selecionar por tipo, por classe e por id, e por que a classe é a escolha padrão.",
          content:
            "Existem três seletores que você usa o tempo todo, e eles se diferenciam pelo que escolhem.\n\nO seletor de **tipo** é o nome do elemento, e pega todos: `p` pega todo parágrafo da página. Serve para a base, como definir a tipografia do texto corrido.\n\nO seletor de **classe** começa com ponto e pega todo elemento que declarou aquela classe no atributo `class`. É o que você mais usa, porque a classe é escolha sua: você decide o que ela agrupa e a repete onde quiser.\n\nO seletor de **id** começa com cerquilha e pega o único elemento com aquele `id`.\n\n```css\np {\n  line-height: 1.6;\n}\n\n.destaque {\n  background-color: #fff3cd;\n}\n```\n\nA recomendação da trilha é preferir classe. O id é único por página, então não se reaproveita, e vence a classe em qualquer disputa por um motivo que o passo Contar especificidade explica. Estilo apoiado em id vira uma regra que só se derruba com outra regra mais forte ainda, e a folha começa a competir consigo mesma.\n\nNome de classe vale a mesma disciplina do HTML: minúsculas, sem acento, palavras ligadas por hífen, e dizendo o papel (`.cartao-projeto`) e não a aparência (`.azul`).\n\nVocê domina este passo quando escolhe entre tipo, classe e id sem hesitar.",
          resources: [
            {
              label: "MDN: seletores CSS (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Guides/Selectors",
              kind: "doc",
            },
          ],
        },
        {
          id: "seletores.combinadores",
          title: "Combinadores",
          description:
            "Descendente, filho e irmão: escolher pelo lugar que o elemento ocupa na estrutura.",
          content:
            "Combinadores escolhem elementos pela posição que eles ocupam dentro da marcação, e não por um nome próprio.\n\nO **descendente** é um espaço entre dois seletores: `nav a` pega todo link dentro de uma navegação, em qualquer profundidade.\n\nO **filho** é o sinal de maior: `nav > a` pega só os links que são filhos diretos da navegação, e ignora os que estão dentro de outro elemento.\n\nO **irmão adjacente** é o sinal de mais: `h2 + p` pega o parágrafo que vem logo depois de um `h2`.\n\n```css\nnav a {\n  text-decoration: none;\n}\n\nh2 + p {\n  margin-top: 0.5rem;\n}\n```\n\nRepare que combinador algum inventa estrutura: ele só aproveita a que o HTML já tem. É por isso que marcação bem feita, com `header`, `nav`, `main` e `footer` no lugar certo, torna a folha de estilos curta. Estrutura clara vira seletor curto.\n\nO cuidado é não acorrentar seletores longos como `main section div ul li a`: eles quebram na primeira mudança da marcação e são difíceis de vencer. Duas partes costumam bastar.\n\nVocê domina este passo quando lê um combinador e diz, olhando a marcação, exatamente quais elementos ele alcança.",
        },
        {
          id: "seletores.agrupar",
          title: "Agrupar e selecionar por atributo",
          description:
            "Aplicar a mesma regra a vários seletores e escolher elementos pelos atributos que eles carregam.",
          content:
            'Quando duas regras teriam o mesmo bloco, a vírgula junta os seletores em uma lista e evita a repetição.\n\n```css\nh1,\nh2,\nh3 {\n  font-family: Georgia, serif;\n}\n```\n\nA vírgula quer dizer "ou": a regra vale para cada um dos seletores da lista, de forma independente. Um erro comum é ler a lista como se fosse uma combinação, e esperar que `h1, h2` signifique um `h2` dentro de um `h1`. Não significa; isso seria `h1 h2`.\n\nO seletor de **atributo** escolhe pelo que está escrito no elemento, entre colchetes. `[type="email"]` pega o campo de e-mail de um formulário; `[href^="https"]` pega os links cujo endereço começa com https.\n\n```css\ninput[type="email"] {\n  border: 2px solid #94a3b8;\n}\n```\n\nEle é útil justamente onde não faz sentido inventar uma classe: o tipo do campo já está declarado na marcação, e criar `.campo-email` ao lado seria repetir a mesma informação em dois lugares, com o risco de as duas discordarem.\n\nVocê domina este passo quando encurta uma folha de estilos agrupando seletores que repetiam o mesmo bloco.',
        },
        {
          id: "seletores.pseudo-classes",
          title: "Pseudo-classes",
          description:
            "Estilo que depende do estado do elemento: apontado pelo mouse, focado pelo teclado, em certa posição.",
          content:
            "Pseudo-classes começam com dois-pontos e descrevem um **estado**, não um elemento novo.\n\n```css\na:hover {\n  color: #1d4ed8;\n}\n\na:focus-visible {\n  outline: 3px solid #1d4ed8;\n  outline-offset: 2px;\n}\n```\n\n`:hover` vale enquanto o ponteiro está sobre o elemento. É um efeito agradável, e nunca pode ser o único sinal de que algo é clicável, porque quem navega por toque ou por teclado não tem ponteiro.\n\n`:focus-visible` é o par que não pode faltar: ele marca o elemento que recebeu o foco pelo teclado. Remover esse contorno sem colocar outro no lugar deixa quem navega de Tab sem saber onde está, e é um dos erros de acessibilidade mais comuns da web. O passo Navegação por teclado, da trilha HTML do Zero, trata do mesmo assunto pelo lado da marcação.\n\n`:nth-child()` escolhe pela posição: `tr:nth-child(even)` pinta as linhas pares de uma tabela, criando o efeito de listra sem classe nenhuma na marcação.\n\nHá muitas outras, e todas seguem a mesma ideia: o elemento já existe, e você está descrevendo uma condição dele.\n\nVocê domina este passo quando estiliza o estado de foco de um link sem apagar a pista visual de quem usa teclado.",
          resources: [
            {
              label: "MDN: pseudo-classes (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Reference/Selectors/Pseudo-classes",
              kind: "doc",
            },
          ],
        },
        {
          id: "seletores.pseudo-elementos",
          title: "Pseudo-elementos",
          description:
            "Criar e estilizar partes que não existem na marcação, com ::before, ::after e content.",
          content:
            'Pseudo-elementos começam com dois dois-pontos e tratam de um pedaço do elemento que não está escrito na marcação.\n\n`::first-line` alcança a primeira linha de um parágrafo. `::marker` alcança o marcador de um item de lista. E os dois mais usados, `::before` e `::after`, criam conteúdo no começo e no fim do elemento.\n\n```css\n.externo::after {\n  content: " (link externo)";\n  color: #64748b;\n}\n```\n\nA propriedade `content` é obrigatória nesses dois: sem ela, nada aparece. Ela aceita texto entre aspas, e também a string vazia, que é o caso de quando você quer só uma forma decorativa com tamanho e cor.\n\nO limite que vale conhecer: o que nasce de `content` é decoração, e não conteúdo de verdade. Ele não está no HTML, alguns leitores de tela o anunciam e outros não, e ninguém consegue selecioná-lo com o mouse de forma confiável. Informação que a pessoa precisa ler fica na marcação; aqui entram setas, aspas, separadores.\n\nVocê domina este passo quando acrescenta uma marca visual a um elemento sem tocar no HTML, e sabe dizer por que aquilo não é conteúdo.',
          resources: [
            {
              label: "MDN: pseudo-elementos (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Reference/Selectors/Pseudo-elements",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "cascata",
      title: "Cascata, especificidade e herança",
      level: "iniciante",
      description:
        "Quando duas regras brigam pelo mesmo elemento, quem vence e por quê.",
      children: [
        {
          id: "cascata.ordem",
          title: "A ordem decide o empate",
          description:
            "Quando duas regras têm a mesma força, vence a que foi escrita por último.",
          content:
            'Duas regras podem alcançar o mesmo elemento e pedir coisas diferentes. O CSS resolve isso sempre, e nunca ao acaso.\n\nA primeira regra do desempate é a mais simples: com a **mesma força**, vence a que aparece depois na folha.\n\n```css\np {\n  color: #b91c1c;\n}\n\np {\n  color: #1d4ed8;\n}\n```\n\nO parágrafo sai azul. Não é bug, é a cascata funcionando: o CSS lê o arquivo de cima para baixo, e a última palavra é a que vale.\n\nIsso explica dois hábitos. O primeiro é escrever do geral para o específico, como o passo Organizar a folha de estilos recomenda: assim o específico vem depois e vence naturalmente. O segundo é desconfiar quando uma regra "não funciona": antes de reforçá-la, procure se não há outra igual mais abaixo no arquivo dizendo o contrário.\n\nA ordem também vale entre arquivos: se a página liga duas folhas, vale a ordem dos `<link>` no `<head>`.\n\nVocê domina este passo quando descobre, sozinho, por que uma cor que você escreveu não apareceu na tela.',
          resources: [
            {
              label: "MDN: cascata (em inglês)",
              url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Introduction",
              kind: "doc",
            },
          ],
        },
        {
          id: "cascata.especificidade",
          title: "Contar especificidade",
          description:
            "A conta que decide qual regra vence quando elas não têm a mesma força.",
          content:
            "Antes de olhar a ordem, o navegador compara a **especificidade** dos seletores. Ela é uma conta de três números, sempre nesta ordem:\n\n1. quantos **ids** o seletor tem;\n2. quantas **classes**, atributos e pseudo-classes;\n3. quantos **tipos** e pseudo-elementos.\n\nCompara-se o primeiro número; só havendo empate se olha o segundo, e depois o terceiro. Um id vence qualquer quantidade de classes, e uma classe vence qualquer quantidade de tipos.\n\n```css\n/* 0-1-1 */\n.menu a {\n  color: #1d4ed8;\n}\n\n/* 1-0-0, vence */\n#topo {\n  color: #b91c1c;\n}\n```\n\nO seletor universal `*` e os combinadores não contam nada. O `:where()` também vale zero, o que o torna útil para escrever base sem criar peso.\n\nÉ essa conta que sustenta a recomendação do passo Seletores básicos de preferir classe: uma folha escrita só com classes tem quase todas as regras no mesmo patamar, e aí quem decide é a ordem, que você controla lendo o arquivo. Assim que entra um id, aparece um degrau que só outro id alcança.\n\nVocê domina este passo quando calcula, de cabeça, qual de dois seletores vence.",
          resources: [
            {
              label: "MDN: especificidade (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Guides/Cascade/Specificity",
              kind: "doc",
            },
          ],
        },
        {
          id: "cascata.heranca",
          title: "Herança",
          description:
            "O que passa do elemento pai para os filhos automaticamente, e o que não passa.",
          content:
            "Algumas propriedades descem sozinhas na árvore: você define no pai e os filhos recebem. É a **herança**, e ela existe para você não precisar repetir a mesma decisão em todo elemento.\n\nHerdam-se, em geral, as propriedades de texto: `color`, `font-family`, `font-size`, `line-height`, `text-align`. Não se herdam as de caixa e layout: `margin`, `padding`, `border`, `background-color`, `width`.\n\nEssa divisão tem lógica. Faz sentido um parágrafo dentro de um artigo usar a fonte do artigo; não faria sentido nenhum ele copiar a margem do artigo.\n\n```css\nbody {\n  font-family: system-ui, sans-serif;\n  color: #1f2937;\n}\n```\n\nCom essas duas linhas, a página inteira já tem fonte e cor de texto, porque tudo é descendente do `body`.\n\nQuando você quer herança onde ela não acontece, o valor `inherit` força: `border-color: inherit` manda a borda usar a cor herdada. E quando quer cortar, `initial` volta ao valor padrão da propriedade.\n\nVocê domina este passo quando define a tipografia do site inteiro em uma única regra e entende por que a margem não se comportou igual.",
          resources: [
            {
              label: "MDN: herança (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Guides/Cascade/Inheritance",
              kind: "doc",
            },
          ],
        },
        {
          id: "cascata.important",
          title: "O !important e a dívida que ele cria",
          description:
            "O que essa marca faz de verdade e por que ela quase sempre é um sintoma.",
          content:
            "A marca `!important`, escrita no fim de uma declaração, tira aquela declaração da disputa normal: ela passa na frente de qualquer regra sem a marca, com qualquer especificidade.\n\n```css\n.aviso {\n  color: #b91c1c !important;\n}\n```\n\nFunciona. O problema é o que acontece depois. A partir daí, a única forma de mudar aquela cor é outro `!important`, e a próxima pessoa que precisar ajustar a página vai escrever mais um. Em pouco tempo a folha tem uma segunda disputa acontecendo por cima da primeira, e ninguém consegue prever o resultado lendo o arquivo.\n\nQuase sempre `!important` é sintoma de outra coisa: um estilo escrito no atributo `style` do elemento, que só perde para ele; um seletor com id onde bastava classe; ou duas regras na ordem errada. Resolver a causa costuma ser mais barato que sustentar a marca.\n\nExiste um uso defensável, e é raro: sobrescrever estilo de terceiros que você não controla e não consegue reordenar. Mesmo aí, vale um comentário dizendo por quê.\n\nVocê domina este passo quando tira um `!important` de uma folha de estilos ajustando a ordem ou o seletor, sem perder o efeito.",
        },
      ],
    },
    {
      id: "texto-cores",
      title: "Cores, texto e unidades",
      level: "iniciante",
      description:
        "As decisões de aparência que aparecem em toda página: cor, fonte, tamanho e legibilidade.",
      children: [
        {
          id: "texto-cores.cores",
          title: "Cores",
          description:
            "As formas de escrever uma cor em CSS e quando a transparência entra.",
          content:
            "Uma cor pode ser escrita de várias formas, e todas chegam ao mesmo lugar.\n\nO **nome** é a forma mais curta: `red`, `white`, `rebeccapurple`. São cerca de cento e quarenta nomes, úteis para um teste rápido e limitados demais para um projeto.\n\nO **hexadecimal** é o mais comum: `#1d4ed8` são três pares, vermelho, verde e azul, de `00` a `ff`. Esta trilha escreve em minúsculas, por consistência.\n\nA função `rgb()` diz o mesmo em números de 0 a 255, e a `hsl()` descreve a cor por matiz, saturação e luminosidade, o que facilita gerar variações: mesma matiz, luminosidade diferente, e você tem a versão clara e a escura do mesmo tom.\n\n```css\n.cartao {\n  background-color: #f8fafc;\n  border: 2px solid hsl(217 91% 60%);\n}\n```\n\nA transparência entra com uma barra: `rgb(0 0 0 / 50%)` é preto pela metade. Ela serve para sobreposição, e não para texto apagado: texto com pouco contraste fica ilegível ao sol, em tela barata e para muita gente.\n\nO contraste é assunto de acessibilidade, e o passo Texto legível volta a ele.\n\nVocê domina este passo quando escolhe um formato de cor com um motivo, e não por hábito.",
          resources: [
            {
              label: "MDN: valores de cor (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Reference/Values/color_value",
              kind: "doc",
            },
          ],
        },
        {
          id: "texto-cores.fontes",
          title: "Fontes",
          description:
            "A pilha de fontes, o peso e a altura de linha: as três decisões que mudam o texto inteiro.",
          content:
            'A propriedade `font-family` recebe uma **pilha**, e não uma fonte só. O navegador tenta a primeira; se não tiver, vai para a próxima.\n\n```css\nbody {\n  font-family: Georgia, "Times New Roman", serif;\n  line-height: 1.6;\n}\n```\n\nA última da pilha é sempre uma família genérica, como `serif`, `sans-serif` ou `monospace`. Ela é a garantia: qualquer sistema tem alguma fonte dessas, então o texto nunca cai numa fonte aleatória. Nome com espaço vai entre aspas.\n\nUma pilha que resolve bem sem baixar arquivo nenhum é `system-ui, sans-serif`: ela usa a fonte de interface do próprio sistema, que já está instalada e carrega instantaneamente.\n\n`font-weight` controla o peso, de `100` a `900`, sendo `400` o normal e `700` o negrito. Só funciona se a fonte tiver aquele peso; quando não tem, o navegador aproxima.\n\n`line-height` é o espaço entre as linhas, e é a propriedade que mais muda a leitura de um texto longo. Sem unidade, ela é multiplicador do tamanho da fonte, e é assim que você deve escrever: `1.6` acompanha qualquer tamanho.\n\nVocê domina este passo quando monta uma pilha de fontes que termina numa família genérica.',
          resources: [
            {
              label: "MDN: font-family (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Reference/Properties/font-family",
              kind: "doc",
            },
          ],
        },
        {
          id: "texto-cores.unidades",
          title: "Unidades",
          description:
            "px, rem, em e porcentagem: o que cada uma mede e quando usar.",
          content:
            'Escolher a unidade certa é o que faz a página respeitar quem aumenta a fonte do navegador.\n\nO `px` é fixo: um pixel de CSS, sempre igual. Serve bem para espessura de borda e para detalhes que não devem crescer.\n\nO `rem` é relativo ao tamanho de fonte da **raiz** do documento, que por padrão é 16px. Então `1rem` costuma dar 16px, e `1.5rem`, 24px. A vantagem é justamente o "costuma": quem configurou o navegador com fonte maior recebe tudo proporcionalmente maior. É a unidade padrão desta trilha para texto e espaçamento.\n\nO `em` é relativo ao tamanho de fonte do **próprio elemento**, e por isso acumula: um `em` dentro de outro multiplica, e o resultado surpreende.\n\nA **porcentagem** é relativa a alguma medida do pai, e qual medida depende da propriedade: em `width` é a largura do pai, em `line-height` é o tamanho da fonte.\n\n```css\nh1 {\n  font-size: 2rem;\n  margin-bottom: 1rem;\n}\n```\n\nA regra prática: `rem` para texto e espaço, `px` para bordas finas, porcentagem para largura, e `em` só quando você quiser mesmo o efeito de acompanhar o elemento.\n\nVocê domina este passo quando justifica a unidade de cada medida que escreve.',
          resources: [
            {
              label: "MDN: unidades de comprimento (em inglês)",
              url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length",
              kind: "doc",
            },
          ],
        },
        {
          id: "texto-cores.texto",
          title: "Texto legível",
          description:
            "Alinhamento, decoração e contraste: o que separa um texto bonito de um texto que se lê.",
          content:
            "Algumas propriedades de texto aparecem em quase toda folha de estilos.\n\n`text-align` alinha o conteúdo dentro da caixa. O alinhamento à esquerda é o padrão em português e o mais legível para texto corrido; `center` funciona em título curto e cansa em parágrafo; `justify` cria rios de espaço em coluna estreita.\n\n`text-decoration` controla o sublinhado. Tirar o sublinhado dos links de uma navegação é comum, e tirar dos links no meio de um parágrafo não é: ali o sublinhado é o que distingue o link do texto ao redor para quem não percebe a diferença de cor.\n\n```css\n.menu a {\n  text-decoration: none;\n}\n\narticle a {\n  color: #1d4ed8;\n}\n```\n\nO **contraste** entre a cor do texto e a do fundo é o item que mais afeta a leitura. Cinza-claro sobre branco parece elegante na sua tela e desaparece na tela de outra pessoa, no sol, ou para quem enxerga pouco. A recomendação corrente é pelo menos 4,5 para 1 em texto normal, e o painel de acessibilidade do DevTools calcula essa relação para você.\n\nVocê domina este passo quando confere o contraste de um texto antes de aceitar a cor que escolheu.",
        },
      ],
    },
    {
      id: "box-model",
      title: "Box model",
      level: "intermediario",
      description:
        "Todo elemento é uma caixa. Entender as camadas dessa caixa é o que faz o espaçamento parar de ser adivinhação.",
      children: [
        {
          id: "box-model.caixa",
          title: "Todo elemento é uma caixa",
          description:
            "Conteúdo, padding, border e margin: as quatro camadas que formam qualquer elemento.",
          content:
            "O navegador desenha cada elemento como uma caixa de quatro camadas, de dentro para fora.\n\nO **conteúdo** é o texto ou a imagem. O **padding** é o espaço entre o conteúdo e a borda, por dentro: ele recebe a cor de fundo do elemento. A **border** é a linha em volta. E a **margin** é o espaço por fora da borda, que separa este elemento dos vizinhos e é sempre transparente.\n\n```css\n.cartao {\n  padding: 1rem;\n  border: 2px solid #0f172a;\n  margin-bottom: 1.5rem;\n}\n```\n\nA diferença que mais confunde no começo é entre `padding` e `margin`: os dois são espaço, mas o `padding` aumenta a caixa e é pintado pelo fundo, e a `margin` empurra os outros e nunca é pintada. Quando você quer afastar o texto da borda do cartão, é `padding`; quando quer afastar um cartão do outro, é `margin`.\n\nAs quatro propriedades aceitam um valor por lado. Escritas em atalho, a ordem é horária a partir do topo: `margin: 10px 20px 30px 40px` é topo, direita, baixo, esquerda. Com dois valores, o primeiro vale para topo e baixo, e o segundo para os lados.\n\nVocê domina este passo quando olha um espaço na tela e diz se ele é padding ou margin.",
          resources: [
            {
              label: "MDN: box model (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Core/Styling_basics/Box_model",
              kind: "doc",
            },
          ],
        },
        {
          id: "box-model.box-sizing",
          title: "box-sizing e o reset",
          description:
            "Por que uma caixa de 300px acaba com 340px na tela, e a linha que resolve isso.",
          content:
            "Por padrão, a `width` que você escreve vale só para o **conteúdo**. O padding e a borda somam por fora.\n\nUma caixa com `width: 300px`, `padding: 1rem` e `border: 2px` ocupa 300 mais 16 mais 16 mais 2 mais 2, ou seja, 336px na tela. Foi assim que a web nasceu, e é a origem de muita conta errada em layout.\n\nA propriedade `box-sizing` muda o critério. Com `border-box`, a `width` passa a incluir padding e borda: você escreve 300 e a caixa ocupa 300, com o conteúdo se ajustando por dentro.\n\n```css\n*,\n*::before,\n*::after {\n  box-sizing: border-box;\n}\n```\n\nEsse é o **reset** mais comum da web, e vale escrever no topo de toda folha de estilos. O seletor universal com os dois pseudo-elementos garante que nada fique de fora.\n\nNão é a única regra de reset que existe: zerar a margem padrão do `body` e limitar imagens com `max-width: 100%` também são comuns, e os dois aparecem adiante nesta trilha. O que importa é entender que um reset não é enfeite: ele é a decisão de partir de um ponto conhecido em vez do padrão de cada navegador.\n\nVocê domina este passo quando prevê a largura final de uma caixa antes de abrir o navegador.",
          resources: [
            {
              label: "MDN: box-sizing (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Reference/Properties/box-sizing",
              kind: "doc",
            },
          ],
        },
        {
          id: "box-model.display",
          title: "display: block, inline e inline-block",
          description:
            "O que decide se um elemento ocupa a linha inteira, e quais medidas ele aceita.",
          content:
            "A propriedade `display` decide como a caixa se comporta em relação às vizinhas.\n\nUm elemento **block**, como `div`, `p` e `section`, começa em uma linha nova e ocupa toda a largura disponível. Aceita `width`, `height`, margem e padding em todos os lados.\n\nUm elemento **inline**, como `span`, `a` e `strong`, fica na mesma linha do texto e ocupa só o espaço do conteúdo. E aqui está a pegadinha: ele **ignora** `width` e `height`, e ignora margem vertical. Escrever `width: 200px` num `span` não produz erro nem efeito.\n\nO **inline-block** junta os dois: fica na linha como o inline, mas aceita todas as medidas como o block.\n\n```css\n.selo {\n  display: inline-block;\n  width: 6rem;\n  padding: 0.25rem 0.5rem;\n}\n```\n\nO valor `none` remove o elemento do layout por completo, como se ele não existisse na página. É diferente de `visibility: hidden`, que o deixa invisível mas mantém o espaço ocupado. E é diferente de escondê-lo de leitores de tela: `display: none` some para todo mundo, inclusive para quem ouve a página.\n\nOs dois valores que trazem layout de verdade, `flex` e `grid`, são o assunto das duas próximas seções.\n\nVocê domina este passo quando explica por que a largura que você deu a um link não mudou nada.",
          resources: [
            {
              label: "MDN: display (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Reference/Properties/display",
              kind: "doc",
            },
          ],
        },
        {
          id: "box-model.margens",
          title: "Margens que colapsam e centralizar",
          description:
            "Duas margens verticais viram uma, e o atalho que centraliza um bloco.",
          content:
            "Duas margens verticais encostadas não somam: elas **colapsam**, e vale a maior das duas.\n\nSe um parágrafo tem `margin-bottom: 20px` e o seguinte tem `margin-top: 30px`, o espaço entre eles é 30px, e não 50px. Isso vale entre irmãos, e também entre um pai e o primeiro ou último filho, quando não há borda nem padding separando os dois.\n\nO colapso é intencional: ele existe para o espaçamento entre parágrafos ficar uniforme sem você somar margens. Mas surpreende quando aparece entre pai e filho, e o conserto é justamente dar ao pai um `padding` ou uma `border`, que interrompem o colapso.\n\nMargem horizontal nunca colapsa, e margem de elemento em flex ou grid também não.\n\nO atalho mais conhecido do CSS vem daqui:\n\n```css\n.conteudo {\n  max-width: 60rem;\n  margin: 0 auto;\n}\n```\n\n`margin: 0 auto` quer dizer zero em cima e embaixo, automático nos lados. O navegador divide o espaço que sobra igualmente à esquerda e à direita, e o bloco fica centralizado. Só funciona em elemento block com largura limitada: sem `max-width` ou `width`, ele já ocupa tudo e não sobra o que dividir.\n\nVocê domina este passo quando centraliza um bloco e sabe dizer por que o `auto` fez isso.",
          resources: [
            {
              label: "MDN: margin (em inglês)",
              url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/margin",
              kind: "doc",
            },
          ],
        },
        {
          id: "box-model.overflow",
          title: "Quando o conteúdo não cabe",
          description:
            "O que o navegador faz com o que passa da caixa, e como pedir rolagem só onde precisa.",
          content:
            "Quando o conteúdo é maior que a caixa, o padrão é vazar: o texto ou a imagem aparece para fora, por cima do que estiver ao lado.\n\nA propriedade `overflow` decide outro destino. Com `hidden`, o que passa é cortado e some. Com `scroll`, a caixa ganha barra de rolagem sempre. Com `auto`, ela ganha barra só quando precisa, que é quase sempre o que você quer.\n\n```css\n.tabela-larga {\n  overflow-x: auto;\n}\n```\n\nO caso mais comum numa página de conteúdo é este: uma tabela ou um bloco de código largo demais para a tela do celular. Deixar a caixa rolar na horizontal resolve sem quebrar o resto; deixar a **página inteira** rolar na horizontal é o defeito que aparece em toda página mal adaptada, e o passo Começar pelo celular volta a ele.\n\n`overflow: hidden` merece cuidado: ele corta em silêncio, e o conteúdo cortado não tem como ser alcançado, nem pelo mouse nem pelo teclado. Use quando o que sai é decoração; nunca quando é informação.\n\nVocê domina este passo quando faz um bloco largo rolar dentro de si mesmo, sem a página inteira rolar de lado.",
          resources: [
            {
              label: "MDN: overflow (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Reference/Properties/overflow",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "flexbox",
      title: "Flexbox",
      level: "intermediario",
      description:
        "Distribuir elementos em uma linha ou coluna, com alinhamento e espaçamento sob controle.",
      children: [
        {
          id: "flexbox.container",
          title: "O container flex",
          description:
            "Uma declaração no pai muda o comportamento de todos os filhos.",
          content:
            'Flexbox é o primeiro sistema de layout da trilha, e a ideia central cabe em uma frase: **o `display: flex` vai no pai**, e quem muda de comportamento são os filhos.\n\n```html\n<nav class="menu">\n  <a href="#sobre">Sobre</a>\n  <a href="#contato">Contato</a>\n</nav>\n```\n\n```css\n.menu {\n  display: flex;\n}\n```\n\nOs links, que eram inline e ficavam no fluxo do texto, viram **itens flex** e passam a se distribuir numa linha controlada pelo pai. Nenhuma regra foi escrita neles.\n\nEsse é o engano mais comum de quem começa: escrever `display: flex` no item que se quer mover. Ali a declaração não é erro de sintaxe, então nada é ignorado; ela apenas transforma aquele item num container para os filhos **dele**, e o efeito esperado não acontece.\n\nO container tem um **eixo principal**, que por padrão é a horizontal. A propriedade `flex-direction` muda isso: com `column`, o eixo principal vira a vertical e os itens empilham. Saber qual é o eixo principal em cada momento é o que torna as propriedades de alinhamento previsíveis, e é o assunto do próximo passo.\n\nVocê domina este passo quando transforma uma lista de links em uma barra horizontal com uma única declaração.',
          resources: [
            {
              label: "MDN: conceitos básicos de flexbox (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Guides/Flexible_box_layout/Basic_concepts",
              kind: "doc",
            },
          ],
        },
        {
          id: "flexbox.alinhar",
          title: "Alinhar no eixo principal e no cruzado",
          description:
            "justify-content e align-items, e por que confundir os dois é tão comum.",
          content:
            'Um container flex tem dois eixos: o **principal**, definido pelo `flex-direction`, e o **cruzado**, que é o perpendicular a ele.\n\n`justify-content` distribui os itens no eixo **principal**. `align-items` alinha no eixo **cruzado**. Toda a confusão vem daí: com `flex-direction: row`, que é o padrão, `justify-content` mexe na horizontal e `align-items` na vertical; com `column`, os dois trocam de sentido.\n\n```css\n.cabecalho {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n```\n\nEsse trio é o cabeçalho da web inteira: o nome de um lado, o menu do outro, os dois centrados na vertical. O `space-between` gruda o primeiro item no começo, o último no fim, e divide o espaço que sobra entre os demais.\n\nOs outros valores úteis de `justify-content` são `flex-start`, `center`, `flex-end` e `space-around`. Em `align-items`, além de `center`, há `stretch`, que é o padrão e estica todos à altura do mais alto, e `baseline`, que alinha pela linha de base do texto.\n\nVocê domina este passo quando pergunta "qual é o eixo principal aqui?" antes de escolher a propriedade.',
          resources: [
            {
              label: "MDN: alinhamento em flexbox (em inglês)",
              url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Flexible_box_layout/Aligning_items",
              kind: "doc",
            },
          ],
        },
        {
          id: "flexbox.gap-wrap",
          title: "Espaço e quebra de linha",
          description:
            "A propriedade gap e o flex-wrap, que fazem o layout caber em telas estreitas.",
          content:
            "A propriedade `gap` cria espaço **entre** os itens de um container flex, sem margem nenhuma neles.\n\n```css\n.galeria {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 1rem;\n}\n```\n\nA diferença para margem é que o `gap` não sobra nas pontas: ele separa os itens uns dos outros e não empurra o primeiro nem o último contra a borda do container. Antes dele, o recurso era dar margem a todos e tirar do último com um seletor extra, e essa gambiarra não é mais necessária.\n\n`flex-wrap: wrap` autoriza a quebra de linha. Por padrão, um container flex tenta manter tudo em uma linha só, comprimindo os itens até eles ficarem estreitos demais, o que arruína o layout no celular. Com `wrap`, os itens que não cabem descem para a linha seguinte.\n\nEssas duas declarações, juntas, já resolvem uma galeria simples: os cartões se acomodam lado a lado enquanto couberem e quebram quando a tela encolhe, sem nenhuma media query. Vale fazer o teste estreitando a janela.\n\nVocê domina este passo quando monta uma galeria que se reorganiza sozinha ao estreitar a janela.",
          resources: [
            {
              label: "MDN: gap (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Reference/Properties/gap",
              kind: "doc",
            },
          ],
        },
        {
          id: "flexbox.itens",
          title: "Crescer, encolher e a base",
          description:
            "flex-grow, flex-shrink e flex-basis, e o atalho que junta os três.",
          content:
            "As três propriedades que vão nos **itens**, e não no container, decidem como o espaço que sobra é repartido.\n\n`flex-grow` diz quanto o item cresce quando sobra espaço. O padrão é `0`, ou seja, não cresce. Com `1`, ele toma o espaço livre; se dois itens têm `1`, dividem igualmente; se um tem `2` e outro `1`, o primeiro fica com o dobro **do que sobrou**, e não com o dobro da largura total.\n\n`flex-shrink` diz quanto ele encolhe quando falta espaço. O padrão é `1`, ou seja, todos encolhem juntos. Com `0`, o item se recusa a encolher.\n\n`flex-basis` é o tamanho de partida, antes de crescer ou encolher.\n\nO atalho `flex` junta os três, nessa ordem:\n\n```css\n.principal {\n  flex: 1 1 20rem;\n}\n```\n\nIsso quer dizer: cresça, encolha, e parta de 20rem. É o padrão de um cartão que quer 20rem mas aceita negociar.\n\nO valor `flex: 1`, muito comum, equivale a `1 1 0%`: o item ignora o próprio tamanho e divide o espaço por igual com os outros que também têm `flex: 1`.\n\nVocê domina este passo quando faz uma coluna ocupar o espaço restante sem calcular porcentagem.",
          resources: [
            {
              label: "MDN: flex (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Reference/Properties/flex",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "grid",
      title: "Grid",
      level: "intermediario",
      description:
        "Layout em duas dimensões, com linhas e colunas declaradas de uma vez.",
      children: [
        {
          id: "grid.colunas",
          title: "Colunas e a unidade fr",
          description:
            "Declarar a grade de uma vez, e a unidade que reparte o espaço livre.",
          content:
            "Grid resolve o layout em **duas dimensões**: linhas e colunas declaradas juntas, no container.\n\n```css\n.galeria {\n  display: grid;\n  grid-template-columns: 1fr 1fr 1fr;\n  gap: 1rem;\n}\n```\n\nA propriedade `grid-template-columns` descreve as colunas, uma medida para cada. Três `1fr` criam três colunas iguais.\n\nA unidade `fr` é exclusiva do grid e significa uma **fração do espaço livre**. Ela não é porcentagem: o navegador primeiro reserva o que é fixo, incluindo os `gap`, e só então reparte o que sobrou. Por isso `1fr 1fr 1fr` com `gap` continua dando três colunas iguais, enquanto três colunas de 33,3% estouram a largura assim que entra qualquer espaço entre elas.\n\nMedidas podem se misturar: `250px 1fr` cria uma barra lateral fixa e um conteúdo que ocupa o resto, que é o layout clássico de documentação.\n\nA diferença para o flexbox é o ponto de partida. No flex, os itens se acomodam e o layout emerge deles; no grid, você declara a grade antes e os itens entram nela. Para uma barra de navegação, flex; para uma galeria alinhada nos dois sentidos, grid.\n\nVocê domina este passo quando cria uma grade de três colunas iguais com espaço entre elas.",
          resources: [
            {
              label: "MDN: conceitos básicos de grid (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Guides/Grid_layout/Basic_concepts",
              kind: "doc",
            },
          ],
        },
        {
          id: "grid.posicionar",
          title: "Posicionar pelas linhas",
          description:
            "A grade é feita de linhas numeradas, e um item pode ocupar mais de uma célula.",
          content:
            'Uma grade de três colunas tem quatro **linhas verticais**, numeradas de 1 a 4: uma antes da primeira coluna, uma entre cada par, e uma depois da última. É contando essas linhas que você posiciona um item.\n\n```css\n.destaque {\n  grid-column: 1 / 3;\n}\n```\n\nIsso quer dizer: comece na linha 1 e termine na linha 3, ou seja, ocupe duas colunas. Repare que o segundo número é onde o item **termina**, e não quantas colunas ele ocupa; é o engano mais comum aqui.\n\nQuando você prefere pensar em quantidade, existe a palavra `span`: `grid-column: span 2` ocupa duas colunas a partir de onde o item calhar de cair.\n\nO mesmo vale na vertical com `grid-row`.\n\nNúmeros negativos contam do fim para o começo, e `-1` é sempre a última linha. Por isso `grid-column: 1 / -1` quer dizer "ocupe a largura inteira da grade", qualquer que seja o número de colunas, e é a forma de fazer um item atravessar a grade sem depender do total.\n\nOs itens que você não posiciona são colocados automaticamente, um por célula, na ordem em que aparecem no HTML.\n\nVocê domina este passo quando faz um cartão ocupar duas colunas sem quebrar os vizinhos.',
          resources: [
            {
              label: "MDN: grid-template-columns (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Reference/Properties/grid-template-columns",
              kind: "doc",
            },
          ],
        },
        {
          id: "grid.areas",
          title: "Áreas com nome",
          description:
            "Desenhar o layout em texto, com nomes em vez de números de linha.",
          content:
            'Há uma segunda forma de posicionar no grid, e ela se lê como um desenho.\n\nVocê dá nome às áreas no container e diz, em cada item, a que área ele pertence.\n\n```css\n.pagina {\n  display: grid;\n  grid-template-areas:\n    "cabecalho cabecalho"\n    "lateral conteudo"\n    "rodape rodape";\n}\n```\n\nCada string é uma linha da grade, e cada palavra é uma célula. Nome repetido em células vizinhas cria uma área que ocupa as duas, e é assim que o cabeçalho acima atravessa as duas colunas. Um ponto no lugar do nome deixa a célula vazia.\n\nDepois, cada item declara `grid-area: cabecalho`, e é só.\n\nA vantagem é a leitura: o layout inteiro fica visível no próprio código, e mudar a ordem das áreas em uma media query é reescrever o desenho, sem mexer em item nenhum. A limitação é que áreas precisam ser retangulares, e o nome não pode ter acento nem espaço.\n\nNomes de área e nomes de classe seguem a mesma disciplina do resto do projeto: minúsculas, sem acento, hífen quando precisar de duas palavras.\n\nVocê domina este passo quando lê um `grid-template-areas` e enxerga o layout antes de abrir o navegador.',
          resources: [
            {
              label: "MDN: grid-template-areas (em inglês)",
              url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/grid-template-areas",
              kind: "doc",
            },
          ],
        },
        {
          id: "grid.automatico",
          title: "Grade que se ajusta sozinha",
          description:
            "repeat, minmax e auto-fit: a grade responsiva sem escrever media query.",
          content:
            'Três funções juntas resolvem a galeria responsiva com uma linha.\n\n`repeat()` evita a repetição: `repeat(3, 1fr)` é o mesmo que `1fr 1fr 1fr`.\n\n`minmax()` declara um mínimo e um máximo: `minmax(15rem, 1fr)` quer dizer "nunca menos que 15rem, e no máximo uma fração do espaço livre".\n\n`auto-fit` substitui o número de repetições por "quantas couberem".\n\n```css\n.galeria {\n  display: grid;\n  grid-template-columns:\n    repeat(auto-fit, minmax(15rem, 1fr));\n  gap: 1rem;\n}\n```\n\nLeia em voz alta: crie quantas colunas couberem, cada uma com pelo menos 15rem, dividindo o espaço que sobra. Numa tela larga saem quatro ou cinco colunas; num celular, uma. Nenhuma media query foi escrita.\n\nEsse é o exemplo mais claro do que separa o CSS moderno do antigo. A versão antiga desse layout tinha três ou quatro pontos de quebra, cada um redefinindo larguras, e quebrava em qualquer tamanho que o autor não tivesse previsto. Aqui você declara a intenção, e o navegador faz a conta para qualquer tela.\n\nExiste também `auto-fill`, que reserva as colunas vazias em vez de esticar as que existem.\n\nVocê domina este passo quando escreve uma galeria responsiva sem nenhum ponto de quebra.',
        },
      ],
    },
    {
      id: "responsivo",
      title: "Layout responsivo",
      level: "intermediario",
      description:
        "A mesma página legível no celular e no monitor, sem duas versões do site.",
      children: [
        {
          id: "responsivo.mobile-first",
          title: "Começar pelo celular",
          description:
            "Escrever primeiro o layout estreito e ampliar, em vez do contrário.",
          content:
            '**Mobile-first** é uma ordem de escrita, não uma tecnologia: você escreve o CSS base pensando na tela estreita e acrescenta, em media queries, o que a tela larga ganha.\n\nO motivo é prático. O layout de celular é quase sempre o mais simples: uma coluna, tudo empilhado. Partir dele significa que o CSS base é curto, e cada media query **acrescenta** em vez de desfazer. No caminho contrário, cada media query precisa cancelar o que a regra anterior montou, e a folha cresce em regras que existem só para desligar outras.\n\nHá também o motivo de rede: a tela estreita costuma ser a conexão pior, e ela recebe o CSS mais leve.\n\nNa prática, a folha fica assim: primeiro todas as regras, sem media query nenhuma; depois, no fim do arquivo, os blocos `@media (min-width: ...)` com o que muda em telas maiores. Essa ordem também respeita a cascata, porque o específico vem por último.\n\nNão esqueça a linha que torna tudo isso possível, e que mora no HTML, não aqui:\n\n```html\n<meta name="viewport"\n      content="width=device-width, initial-scale=1">\n```\n\nSem ela, o celular finge ter uma tela larga e reduz a página inteira, e nenhuma media query dispara.\n\nVocê domina este passo quando escreve o layout estreito primeiro e usa a media query só para acrescentar.',
        },
        {
          id: "responsivo.media",
          title: "Media queries",
          description:
            "Aplicar um conjunto de regras só a partir de certa largura de tela.",
          content:
            'Uma media query é um bloco de regras com uma condição.\n\n```css\n.galeria {\n  display: grid;\n  gap: 1rem;\n}\n\n@media (min-width: 48rem) {\n  .galeria {\n    grid-template-columns: 1fr 1fr;\n  }\n}\n```\n\nA condição `min-width` quer dizer "desta largura para cima". É a que combina com o mobile-first: o CSS base vale sempre, e o bloco entra quando a tela alcança o tamanho. O `max-width` faz o contrário e é o que se usa no caminho inverso; misturar os dois na mesma folha é receita para regras que se anulam.\n\nO valor pode estar em `px` ou em `rem`. Em `rem` ele acompanha a fonte de quem configurou o navegador com letra maior, o que é coerente com o resto desta trilha.\n\nSobre onde quebrar: não existe lista canônica de pontos de quebra, e perseguir os tamanhos dos aparelhos da moda é trabalho perdido, porque eles mudam todo ano. O critério que funciona é outro: estreite a janela devagar e coloque um ponto de quebra onde o layout ficar feio. O ponto de quebra é do seu conteúdo, não do aparelho de ninguém.\n\nUma ou duas condições dão conta de um site pessoal.\n\nVocê domina este passo quando escolhe um ponto de quebra olhando o layout, e não uma tabela de aparelhos.',
          resources: [
            {
              label: "MDN: usando media queries (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Guides/Media_queries/Using",
              kind: "doc",
            },
          ],
        },
        {
          id: "responsivo.imagens",
          title: "Imagens que se adaptam",
          description:
            "Duas declarações que impedem a imagem de estourar a tela e de distorcer.",
          content:
            "Imagem é a causa mais comum de página que rola de lado no celular: o arquivo tem 1200 pixels de largura, a tela tem 360, e a imagem simplesmente sai pela direita.\n\nA primeira declaração resolve isso para o site inteiro:\n\n```css\nimg {\n  max-width: 100%;\n  height: auto;\n}\n```\n\n`max-width: 100%` impede a imagem de passar da largura do elemento que a contém, e `height: auto` recalcula a altura para a proporção não se perder. Escrever só a primeira faz a imagem encolher achatada.\n\nA segunda declaração é para quando você precisa de um tamanho fixo, como numa galeria em que todos os cartões têm a mesma altura:\n\n```css\n.cartao img {\n  aspect-ratio: 16 / 9;\n  object-fit: cover;\n}\n```\n\n`object-fit: cover` preenche a área recortando o excesso, sem esticar. O valor `contain` faz o oposto: cabe a imagem inteira e sobra espaço.\n\nO `alt`, que a trilha HTML do Zero trata no passo Imagens que informam, continua sendo obrigação da marcação: nenhuma dessas regras substitui a descrição para quem não vê a imagem.\n\nVocê domina este passo quando nenhuma imagem sua estoura a largura da tela nem sai distorcida.",
          resources: [
            {
              label: "MDN: object-fit (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Reference/Properties/object-fit",
              kind: "doc",
            },
          ],
        },
        {
          id: "responsivo.fluido",
          title: "Tamanhos fluidos",
          description:
            "clamp e unidades de viewport: valores que variam com a tela sem ponto de quebra.",
          content:
            "Media query muda o layout em degraus. Há um jeito de variar **continuamente**, e ele cabe em uma função.\n\nAs unidades de viewport medem a janela: `1vw` é um centésimo da largura, e `1vh`, um centésimo da altura. Um título com `font-size: 5vw` acompanha a tela, e sozinho é perigoso: numa tela muito estreita fica ilegível, numa muito larga fica gigante.\n\n`clamp()` resolve isso com três valores: mínimo, ideal e máximo.\n\n```css\nh1 {\n  font-size: clamp(1.75rem, 4vw, 3rem);\n}\n```\n\nLeia assim: use 4% da largura da janela, mas nunca menos de 1.75rem nem mais de 3rem. O tamanho varia suavemente entre os dois limites, e não há ponto de quebra nenhum.\n\nO mesmo vale para espaçamento: `padding: clamp(1rem, 3vw, 3rem)` dá respiro proporcional à tela.\n\nUm cuidado de acessibilidade: tamanho de fonte que depende **só** de `vw` ignora quem aumentou a letra no navegador, porque a janela não muda de tamanho por causa disso. Por isso os limites do `clamp` acima estão em `rem`, que respeita essa configuração.\n\nVocê domina este passo quando faz um título crescer com a tela sem ficar ilegível nos extremos.",
        },
      ],
    },
    {
      id: "moderno",
      title: "CSS moderno e qualidade",
      level: "avancado",
      description:
        "Variáveis, posicionamento, movimento e respeito às preferências de quem usa.",
      children: [
        {
          id: "moderno.variaveis",
          title: "Variáveis de CSS",
          description:
            "Guardar um valor com nome e usá-lo em toda a folha, com propriedades customizadas.",
          content:
            "Propriedades customizadas são variáveis de verdade, entendidas pelo navegador. O nome começa com dois hifens, e o valor se lê com `var()`.\n\n```css\n:root {\n  --cor-principal: #1d4ed8;\n  --espaco: 1rem;\n}\n\n.botao {\n  background-color: var(--cor-principal);\n  padding: var(--espaco);\n}\n```\n\nO seletor `:root` é o elemento raiz do documento, e declarar ali faz a variável valer para a página inteira, porque propriedades customizadas são herdadas.\n\nA vantagem óbvia é trocar uma cor em um lugar só. A menos óbvia é o nome: `--cor-principal` diz a intenção, enquanto `#1d4ed8` espalhado por trinta linhas não diz nada, e ninguém sabe quais daqueles azuis são o mesmo azul por acaso e quais são de propósito.\n\nComo são herdadas, elas podem ser redefinidas em um trecho da página: um bloco com `--cor-principal` diferente muda tudo que estiver dentro dele. É esse mecanismo que sustenta o tema escuro do próximo passo.\n\n`var()` aceita um segundo argumento, usado quando a variável não existe: `var(--cor-principal, #333333)`.\n\nVocê domina este passo quando troca a paleta inteira do seu projeto editando uma única regra.",
          resources: [
            {
              label: "MDN: propriedades customizadas (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties",
              kind: "doc",
            },
          ],
        },
        {
          id: "moderno.posicionamento",
          title: "Posicionamento e z-index",
          description:
            "Tirar um elemento do fluxo normal, e decidir quem fica na frente.",
          content:
            "Por padrão todo elemento está no **fluxo**: um depois do outro, empurrando os vizinhos. A propriedade `position` muda isso.\n\n`relative` mantém o elemento no fluxo, e permite deslocá-lo com `top`, `left`, `right` e `bottom`. O espaço original continua reservado. Sozinho ele é pouco útil, e o uso principal é outro: ele vira a **referência** para um filho posicionado.\n\n`absolute` tira o elemento do fluxo. Ele passa a se posicionar em relação ao ancestral posicionado mais próximo, e é por isso que o `relative` do pai importa. Sem nenhum ancestral posicionado, a referência vira a página.\n\n`fixed` também sai do fluxo e se fixa na janela, ficando parado quando a página rola. `sticky` é o híbrido: rola junto até chegar ao limite que você deu e gruda ali.\n\n```css\n.cartao {\n  position: relative;\n}\n\n.cartao .selo {\n  position: absolute;\n  top: 0.5rem;\n  right: 0.5rem;\n}\n```\n\nQuando dois elementos se sobrepõem, `z-index` decide quem fica na frente, do menor para o maior. A pegadinha: **ele só funciona em elemento posicionado**. Escrever `z-index` num elemento com `position: static`, que é o padrão, não produz efeito nem aviso.\n\nVocê domina este passo quando coloca um selo no canto de um cartão e ele acompanha o cartão.",
          resources: [
            {
              label: "MDN: position (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Reference/Properties/position",
              kind: "doc",
            },
            {
              label: "MDN: z-index (em inglês)",
              url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/z-index",
              kind: "doc",
            },
          ],
        },
        {
          id: "moderno.transicoes",
          title: "Transições e animações",
          description:
            "Suavizar uma mudança de estado, e criar movimento com quadros-chave.",
          content:
            "Sem CSS, toda mudança de estado é instantânea. A propriedade `transition` diz ao navegador para interpolar a mudança ao longo de um tempo.\n\n```css\n.botao {\n  background-color: #1d4ed8;\n  transition: background-color 0.2s ease-in-out;\n}\n\n.botao:hover {\n  background-color: #1e40af;\n}\n```\n\nOs valores são: qual propriedade, quanto tempo, e a curva de aceleração. A transição mora no estado **normal**, e não no `:hover`; escrita só no `:hover`, ela suaviza a entrada e corta na saída.\n\nAnimação é o passo seguinte, para movimento que não depende de um estado. Você declara quadros-chave e os aplica:\n\n```css\n@keyframes surgir {\n  from {\n    opacity: 0;\n  }\n\n  to {\n    opacity: 1;\n  }\n}\n```\n\nDepois, `animation: surgir 0.3s ease-out` no elemento.\n\nDuas medidas de bom senso: anime poucas propriedades, porque `opacity` e `transform` são baratas para o navegador e mudanças de tamanho e posição custam bem mais; e mantenha tempos curtos, entre 0.15s e 0.3s, porque animação longa em interface vira espera.\n\nO próximo passo trata de quem prefere não ver movimento nenhum.\n\nVocê domina este passo quando suaviza a mudança de cor de um botão sem cortar a volta.",
          resources: [
            {
              label: "MDN: transition (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Reference/Properties/transition",
              kind: "doc",
            },
            {
              label: "MDN: @keyframes (em inglês)",
              url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@keyframes",
              kind: "doc",
            },
          ],
        },
        {
          id: "moderno.preferencias",
          title: "Respeitar as preferências de quem lê",
          description:
            "Duas media queries que leem configurações do sistema, e por que uma delas é acessibilidade.",
          content:
            "O sistema operacional guarda preferências de quem usa, e o CSS consegue lê-las.\n\n`prefers-color-scheme` diz se a pessoa escolheu tema claro ou escuro. Com as variáveis do passo Variáveis de CSS, atender a isso é redefinir a paleta:\n\n```css\n@media (prefers-color-scheme: dark) {\n  :root {\n    --cor-fundo: #0f172a;\n    --cor-texto: #e2e8f0;\n  }\n}\n```\n\n`prefers-reduced-motion` é a mais importante das duas, e não é preferência estética: movimento na tela provoca náusea, tontura e enxaqueca em muita gente, e quem tem esse problema liga a opção no sistema justamente para avisar.\n\n```css\n@media (prefers-reduced-motion: reduce) {\n  .botao {\n    transition: none;\n  }\n}\n```\n\nA leitura é sempre a mesma: quem não pediu nada recebe a experiência completa, e quem pediu recebe a versão sem movimento. Note que isso não é remover a funcionalidade, é remover a animação dela.\n\nÉ o mesmo compromisso do passo Navegação por teclado, da trilha HTML do Zero: a página serve a quem chega nela de qualquer jeito, e não só a quem usa como você.\n\nVocê domina este passo quando desliga as animações do seu projeto para quem pediu menos movimento.",
          resources: [
            {
              label: "MDN: prefers-color-scheme (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme",
              kind: "doc",
            },
            {
              label: "MDN: prefers-reduced-motion (em inglês)",
              url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion",
              kind: "doc",
            },
          ],
        },
        {
          id: "moderno.devtools",
          title: "Inspecionar estilo no navegador",
          description:
            "Os painéis Styles e Computed: ver qual regra venceu e por quê.",
          content:
            'Quase toda dúvida de CSS se resolve no inspetor, e não relendo o arquivo. Clique com o botão direito num elemento e escolha Inspecionar, ou abra o DevTools com F12.\n\nO painel **Styles** mostra todas as regras que alcançam o elemento selecionado, na ordem de quem vence. Regra derrotada aparece **riscada**, e ao lado dela está o arquivo e a linha de onde veio. É a resposta direta para "por que essa cor não aplicou": ou ela está riscada, e outra regra venceu, ou ela não está na lista, e o seu seletor não alcança o elemento.\n\nAli você também edita ao vivo: mudar um valor, ligar e desligar uma declaração pelo quadradinho, e acrescentar uma regra nova. Nada disso altera o arquivo, então é o lugar certo para experimentar antes de escrever.\n\nO painel **Computed** mostra o valor final de cada propriedade, depois da cascata e da herança, já convertido em pixels. É onde você descobre que `1.5rem` virou 24px, e de qual regra aquele valor veio.\n\nA trilha Front-end do Zero aprofunda essas ferramentas no passo DevTools do navegador.\n\nVocê domina este passo quando descobre no inspetor, em segundos, qual regra venceu a disputa.',
          resources: [
            {
              label: "MDN: o que são as ferramentas de desenvolvedor (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Howto/Tools_and_setup/What_are_browser_developer_tools",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "projeto",
      title: "Projeto",
      level: "avancado",
      description:
        "Dar aparência à página pessoal que a trilha HTML do Zero deixou estruturada.",
      children: [
        {
          id: "projeto.estilo",
          title: "Dar aparência à página pessoal",
          description:
            "O projeto final da trilha: estilizar a página que você marcou na trilha HTML do Zero.",
          project: "landing-page-pessoal",
          content:
            "O projeto desta trilha não começa do zero: ele é a **mesma página pessoal** que a trilha HTML do Zero deixou estruturada, agora com aparência.\n\nSe você fez aquela trilha, abra o seu arquivo. Se não fez, qualquer página com cabeçalho, uma seção sobre você, uma lista de projetos e um formulário de contato serve como ponto de partida.\n\nA regra do projeto é uma só: **não mude a marcação para facilitar o estilo**. Se você precisar de um gancho, acrescente uma classe; se precisar de estrutura nova, pense duas vezes, porque quase sempre o que falta é um seletor melhor, e não uma `div` a mais.\n\nO resultado esperado é uma página que se lê bem no celular e no monitor, com paleta consistente, espaçamento regular, foco visível no teclado e nenhuma rolagem horizontal.\n\nO card abaixo traz o enunciado completo, com os critérios de pronto. Os dois passos seguintes dão o roteiro de execução e os caminhos depois da trilha.\n\nVocê domina este passo quando olha a sua página sem estilo e já sabe por onde começar.",
        },
        {
          id: "projeto.roteiro",
          title: "Roteiro do projeto",
          description:
            "A ordem de trabalho que evita refazer: das variáveis ao ajuste final no inspetor.",
          content:
            "A ordem abaixo existe para você não refazer trabalho. Ela vai do que vale para a página inteira até o detalhe.\n\n1. **Variáveis e reset.** Declare em `:root` as cores e o espaçamento base, e escreva o `box-sizing: border-box` no seletor universal.\n2. **Tipografia.** Defina `font-family`, `color` e `line-height` no `body`, e deixe a herança distribuir.\n3. **Largura do conteúdo.** Um `max-width` com `margin: 0 auto` no contêiner principal, para o texto não atravessar o monitor inteiro.\n4. **Cabeçalho.** `display: flex` com `justify-content: space-between` e `align-items: center`, nome de um lado e navegação do outro.\n5. **Projetos.** Grade com `repeat(auto-fit, minmax(15rem, 1fr))` e `gap`, e as imagens com `object-fit: cover`.\n6. **Formulário.** Campos com `width: 100%`, rótulos legíveis, e um `:focus-visible` que se enxergue.\n7. **Celular.** Estreite a janela e corrija onde quebrar, com uma media query de `min-width`.\n8. **Movimento.** Transições curtas, e um bloco `prefers-reduced-motion` desligando-as.\n\nNo fim, abra o inspetor e confira duas coisas nos painéis Styles e Computed: nenhuma regra importante riscada, e os tamanhos saindo como você esperava. Navegue a página inteira só de Tab para ver se o foco aparece sempre.\n\nCom a página pronta, publique pelo Git. A trilha **Git do Zero** cobre o caminho até o repositório remoto.\n\nVocê domina este passo quando termina a página e consegue explicar cada decisão de layout que tomou.",
        },
        {
          id: "projeto.caminhos",
          title: "Depois desta trilha",
          description:
            "Três caminhos naturais a partir do CSS, e o hábito que vale levar.",
          content:
            "Com HTML e CSS você já põe uma página completa no ar. Daqui saem três caminhos claros.\n\nO primeiro é o comportamento, com **JavaScript do Zero**: menu que abre, formulário que valida antes de enviar, conteúdo que muda sem recarregar. Boa parte do que o JavaScript faz na tela é, no fim, acrescentar e remover classes, e essas classes são as que você escreveu aqui.\n\nO segundo é a trilha **Front-end do Zero**, que amarra a web inteira e revisa este conteúdo com outro enfoque, nos passos Seletores e especificidade, Box model e unidades e Transições e animações, além de mostrar como tudo isso se encaixa com ferramentas e frameworks.\n\nO terceiro é **Git do Zero**, que mantém o trabalho versionado e publicado, com histórico e pull request.\n\nSobre frameworks de estilo: eles existem, são úteis, e todos assumem que você entende cascata, especificidade e box model. Quem chega neles sem essa base fica preso à documentação; quem chega com ela aprende o atalho em um dia.\n\nO hábito que vale levar é o do inspetor: antes de acrescentar uma regra para consertar algo, abra o painel Styles e descubra qual regra está vencendo. Quase sempre o conserto é apagar, e não acrescentar.\n\nVocê domina este passo, e a trilha, quando olha uma página pronta e consegue descrever as decisões de estilo por trás dela.",
        },
      ],
    },
  ],
};
