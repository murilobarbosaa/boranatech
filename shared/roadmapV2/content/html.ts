// TODO(Ana): revisao editorial completa desta trilha (primeira trilha de
// marcacao da plataforma; titulo, descricao, resumo e todo o conteudo longo
// precisam de revisao de copy e de marcacao).
import type { RoadmapV2 } from "../types";

export const html: RoadmapV2 = {
  slug: "html",
  area: "linguagem",
  kind: "linguagem",
  codeLanguages: ["html"],
  // TODO(Ana): titulo da trilha
  title: "HTML do Zero",
  level: "Iniciante",
  // TODO(Ana): descricao da trilha
  description:
    "Do primeiro arquivo aberto no navegador até formulários, mídia e acessibilidade, com a linguagem que dá estrutura a toda página da web. Conclua uma etapa pra liberar a próxima.",
  // TODO(Ana): resumo curto da trilha no card da vitrine
  summary: "A estrutura de toda página da web, do primeiro arquivo ao projeto.",
  sections: [
    {
      id: "fundamentos",
      title: "Primeiros passos com HTML",
      level: "iniciante",
      description:
        "O que é marcação, como criar e abrir o primeiro arquivo, a anatomia de um elemento e o documento mínimo que toda página tem.",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é HTML",
          description:
            "A linguagem que dá estrutura e significado ao conteúdo de uma página, e por que ela não é uma linguagem de programação.",
          content:
            "HTML é a linguagem de **marcação** da web: ela não desenha nem calcula, ela **nomeia** as partes do conteúdo. Você escreve um texto e marca o que é título, o que é parágrafo, o que é lista, o que é imagem. O navegador lê essas marcas e monta a página.\n\nO problema que a marcação resolve é o de um texto puro não dizer nada sobre si. Num arquivo de texto comum, uma linha em cima pode ser um título ou pode ser só a primeira frase; ninguém sabe. Com `<h1>` em volta, ela passa a ser o título principal, e quem lê a página (navegador, buscador, leitor de tela) trata o conteúdo de acordo.\n\nO modelo mental que vale carregar: HTML é o esqueleto. O CSS, que vem depois, é a roupa; o JavaScript é o movimento. Página sem esqueleto não fica de pé, e é por isso que esta é a primeira linguagem da web.\n\nHTML também não é linguagem de programação: não tem condição, não tem repetição, não tem variável. Isso é uma boa notícia, porque o que você precisa aprender aqui é vocabulário e estrutura, não lógica.\n\nVocê domina este passo quando consegue explicar, sem jargão, a diferença entre escrever um texto e marcar um texto.",
          resources: [
            {
              label: "MDN: HTML (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.arquivo",
          title: "O primeiro arquivo",
          description:
            "Criar o index.html no VS Code, salvar e abrir no navegador: o ciclo que se repete a trilha inteira.",
          content:
            "Para escrever HTML você precisa de duas coisas que já tem: um editor de texto e um navegador. O editor da plataforma é o VS Code; qualquer editor serve, desde que salve texto puro.\n\nCrie uma pasta para o projeto, por exemplo `meu-site`, e dentro dela um arquivo chamado `index.html`. O nome importa: `index.html` é o arquivo que servidores entregam por padrão quando alguém abre um endereço sem citar página nenhuma. Escreva o conteúdo abaixo e salve.\n\n```html\n<h1>Ola, mundo</h1>\n<p>Minha primeira pagina.</p>\n```\n\nAgora abra o arquivo no navegador: dê dois cliques nele, ou arraste para uma janela aberta. O endereço vai começar com `file://`, sinal de que a página veio do seu disco, e não da internet. Isso basta para a trilha inteira.\n\nA partir daí o ciclo é sempre o mesmo: editar, salvar, recarregar a página com F5. Extensões que recarregam sozinhas existem, como o Live Server, e são opcionais; nada aqui depende delas.\n\nO hábito que evita confusão: mantenha o editor e o navegador lado a lado. Ver a mudança no mesmo segundo em que ela é salva é o que torna o aprendizado rápido.\n\nVocê domina este passo quando cria um arquivo, escreve duas linhas e as vê na tela.",
          resources: [
            {
              label: "MDN: estruturando conteúdo com HTML (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Core/Structuring_content",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.elemento",
          title: "Anatomia de um elemento",
          description:
            "Tag de abertura, conteúdo, tag de fechamento e atributos: as quatro peças que se repetem em tudo.",
          content:
            'Todo elemento HTML tem a mesma forma, e aprender essa forma uma vez resolve o resto da trilha.\n\n```html\n<a href="https://exemplo.com">Visite o exemplo</a>\n```\n\nA **tag de abertura** é `<a>`: o nome do elemento entre sinais de menor e maior. O **conteúdo** é o que vem depois dela, aqui o texto que aparece na tela. A **tag de fechamento** é `</a>`, igual à de abertura com uma barra antes do nome. E o **atributo** é o `href="https://exemplo.com"`, que fica dentro da tag de abertura, sempre no formato nome igual valor, com o valor entre aspas duplas.\n\nAtributo é informação extra sobre o elemento, e cada elemento tem os seus: `href` é do link, `src` é da imagem, `id` serve para qualquer um. Um elemento pode ter vários atributos, separados por espaço.\n\nAlguns elementos não têm conteúdo nem fechamento, porque não faria sentido: `<br>` é uma quebra de linha, `<img>` é uma imagem. São os elementos **vazios**, e nesta trilha eles aparecem sem barra no fim, como o padrão recomenda.\n\nO erro mais comum de quem começa é esquecer o fechamento. A seção seguinte mostra como isso muda a página inteira de lugar.\n\nVocê domina este passo quando aponta, num elemento qualquer, onde estão a tag, o conteúdo e o atributo.',
          resources: [
            {
              label: "MDN: referência de elementos HTML (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.documento",
          title: "O documento mínimo",
          description:
            "Doctype, html com lang, head e body: o esqueleto que toda página tem, mesmo a mais simples.",
          content:
            'O arquivo do passo anterior funciona, mas está incompleto. Uma página de verdade começa assim:\n\n```html\n<!DOCTYPE html>\n<html lang="pt-BR">\n  <head>\n    <meta charset="UTF-8">\n    <title>Minha pagina</title>\n  </head>\n  <body>\n    <h1>Ola, mundo</h1>\n  </body>\n</html>\n```\n\nCada linha tem um motivo. O `<!DOCTYPE html>` avisa que o documento segue o padrão atual; sem ele, o navegador liga um modo antigo de compatibilidade. O `<html>` envolve tudo, e o atributo `lang` diz o idioma do conteúdo, que leitores de tela usam para escolher a pronúncia.\n\nDentro dele vêm duas partes irmãs. O `<head>` guarda informação **sobre** a página, que não aparece no corpo dela: a codificação de caracteres em `<meta charset="UTF-8">`, sem a qual acentos viram símbolos, e o `<title>`, que nomeia a aba do navegador. O `<body>` guarda o que aparece na tela.\n\nA indentação de dois espaços não muda nada para o navegador, e muda tudo para quem lê: ela mostra quem está dentro de quem.\n\nO `<head>` tem muito mais a oferecer, e a seção Metadados e o head volta a ele com viewport, descrição e compartilhamento.\n\nVocê domina este passo quando escreve esse esqueleto de memória e sabe dizer o que cada linha faz.',
          resources: [
            {
              label: "MDN: o elemento html (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/html",
              kind: "doc",
            },
            {
              label: "MDN: doctype (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Glossary/Doctype",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "texto",
      title: "Texto",
      level: "iniciante",
      description:
        "Títulos com hierarquia, parágrafos, ênfase com significado, comentários e entidades: o conteúdo escrito de uma página.",
      children: [
        {
          id: "texto.titulos",
          title: "Títulos e hierarquia",
          description:
            "De h1 a h6, e por que a ordem dos níveis importa mais que o tamanho da letra.",
          content:
            "HTML tem seis níveis de título, de `<h1>` a `<h6>`, e eles formam o índice da página.\n\n```html\n<h1>Portfolio de Ana</h1>\n<h2>Projetos</h2>\n<h3>Site da padaria</h3>\n<h2>Contato</h2>\n```\n\nA regra é a de um sumário de livro: um `<h1>` por página, com o assunto principal; `<h2>` para as seções; `<h3>` para as subseções de um `<h2>`, e assim por diante. No exemplo, o site da padaria é um projeto, e por isso ele está aninhado sob Projetos.\n\nO erro clássico é escolher o nível pelo tamanho da letra. Como o `<h4>` aparece menor que o `<h2>` por padrão, é tentador usá-lo só porque o texto deve ficar pequeno. Isso quebra o índice, e o tamanho é assunto do CSS, que muda a aparência sem mexer no significado.\n\nPular níveis, como ir de `<h1>` direto para `<h4>`, tem o mesmo problema: quem navega pelos títulos passa a ver uma estrutura que não existe. A seção Acessibilidade e qualidade mostra, no passo sobre leitores de tela, o que se perde aí.\n\nVocê domina este passo quando desenha o índice de uma página antes de escrevê-la, e os níveis saem na ordem.",
          resources: [
            {
              label: "MDN: elementos de título (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/Heading_Elements",
              kind: "doc",
            },
          ],
        },
        {
          id: "texto.paragrafos",
          title: "Parágrafos, quebras e espaço em branco",
          description:
            "O elemento p, quando br e hr são a escolha certa, e por que apertar Enter não separa parágrafos.",
          content:
            "Texto corrido vive dentro de `<p>`, um elemento por parágrafo.\n\n```html\n<p>Primeiro paragrafo do texto.</p>\n<p>Segundo paragrafo, com quebra<br>na mesma ideia.</p>\n<hr>\n<p>Depois da separacao de assunto.</p>\n```\n\nO detalhe que surpreende quem vem do editor de texto: o HTML **colapsa** espaço em branco. Dez espaços seguidos viram um, e uma linha em branco no arquivo não cria parágrafo nenhum. Quem separa o texto é a marcação, não a tecla Enter.\n\nO `<br>` quebra a linha sem terminar o parágrafo, e serve para conteúdo em que a quebra faz parte do sentido, como um endereço ou um verso de poema. Usar `<br>` várias vezes seguidas para afastar blocos é sintoma de que falta CSS, não marcação.\n\nO `<hr>` marca uma mudança de assunto dentro da página. Ele nasceu como uma linha horizontal decorativa e hoje tem significado próprio, o de transição temática.\n\nOs dois são elementos vazios: não têm conteúdo nem tag de fechamento.\n\nVocê domina este passo quando escreve três parágrafos com marcação correta e explica por que a linha em branco do arquivo não bastou.",
          resources: [
            {
              label: "MDN: o elemento p (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/p",
              kind: "doc",
            },
          ],
        },
        {
          id: "texto.enfase",
          title: "Ênfase com significado",
          description:
            "strong e em contra b e i: a diferença entre destacar por importância e destacar por aparência.",
          content:
            "Duas duplas de elementos deixam um trecho em destaque, e a escolha entre elas é de significado.\n\n```html\n<p>O prazo termina <strong>hoje</strong> as 18h.</p>\n<p>O termo <em>responsivo</em> aparece muito aqui.</p>\n```\n\nO `<strong>` diz que o trecho tem **importância** maior que o resto: um prazo, um aviso, uma consequência. O `<em>` marca **ênfase**, aquela entonação que muda o sentido da frase quando você fala. Leitores de tela podem mudar a voz nesses trechos, e buscadores leem o destaque como sinal.\n\nOs primos `<b>` e `<i>` existem e continuam válidos, mas dizem só como o texto aparece: negrito e itálico, sem significado extra. Eles servem para casos em que a convenção tipográfica pede o estilo sem haver importância nenhuma, como o nome científico de uma espécie em `<i>`.\n\nNa prática, a escolha padrão é `<strong>` e `<em>`. Se o destaque é só visual, o lugar dele é o CSS, e não uma tag.\n\nVale o cuidado de sempre: um texto em que tudo é importante não destaca nada. Destaque é exceção.\n\nVocê domina este passo quando lê uma frase em voz alta e sabe dizer se o trecho pede `<strong>`, `<em>` ou nenhum dos dois.",
          resources: [
            {
              label: "MDN: o elemento strong (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/strong",
              kind: "doc",
            },
          ],
        },
        {
          id: "texto.entidades",
          title: "Comentários e entidades",
          description:
            "Como deixar recado no código e como escrever na tela os caracteres que o HTML usa para si.",
          content:
            'Duas ferramentas pequenas resolvem problemas que aparecem cedo.\n\n```html\n<!-- lembrete: revisar este texto -->\n<p>Escreva &lt;p&gt; para mostrar a tag na tela.</p>\n<p>Ana &amp; Bia, parceiras de projeto.</p>\n```\n\nO **comentário** vai entre `<!--` e `-->`. O navegador ignora tudo que estiver ali, então ele serve para explicar uma decisão ou marcar uma parte inacabada. Como o arquivo chega inteiro a quem visita a página, comentário não é lugar de senha nem de anotação particular.\n\nAs **entidades** resolvem o outro problema: alguns caracteres pertencem à linguagem. Se você digitar o sinal de menor seguido de uma letra, o navegador começa a ler uma tag. Para mostrar o caractere em si, escreva `&lt;` para menor, `&gt;` para maior e `&amp;` para o e comercial. Toda entidade começa com `&` e termina com ponto e vírgula.\n\nExistem centenas delas, herdadas da época em que acentos davam problema. Hoje, com `<meta charset="UTF-8">` no `<head>`, você escreve acento direto no arquivo e ele aparece certo.\n\nVocê domina este passo quando mostra o código de uma tag na tela sem que o navegador a interprete.',
          resources: [
            {
              label: "MDN: referência de caracteres (em inglês)",
              url: "https://developer.mozilla.org/en-US/docs/Glossary/Character_reference",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "links-imagens",
      title: "Links e imagens",
      level: "iniciante",
      description:
        "O elemento que criou a web, os caminhos entre arquivos, as âncoras internas e as imagens com descrição.",
      children: [
        {
          id: "links-imagens.links",
          title: "Links com a e href",
          description:
            "O elemento que liga uma página a outra, e o que faz um texto de link ser bom.",
          content:
            'O link é o elemento que transformou documentos soltos em web. Ele é o `<a>`, e o destino vai no atributo `href`.\n\n```html\n<a href="sobre.html">Sobre mim</a>\n<a href="https://exemplo.com">Site do exemplo</a>\n```\n\nO primeiro leva a outro arquivo do mesmo projeto; o segundo, a um endereço completo na internet. O conteúdo entre as tags é o que aparece na tela e o que pode ser clicado.\n\nO texto do link importa mais do que parece. Quem navega por leitor de tela pode pedir a lista de todos os links da página, e uma lista cheia de `clique aqui` não diz nada. Escreva no link o que ele entrega: `Sobre mim`, `Baixar o currículo`, `Ver o projeto da padaria`.\n\nO `href` também aceita outros tipos de destino. Com `mailto:` ele abre o programa de e-mail, e com `tel:` ele disca num celular. São úteis numa página de contato, como a do projeto desta trilha.\n\nLink quebrado é o defeito mais comum de uma página pessoal, e o mais fácil de evitar: clique em todos depois de publicar.\n\nVocê domina este passo quando cria links entre duas páginas suas e escreve textos que fazem sentido fora do contexto.',
          resources: [
            {
              label: "MDN: o elemento a (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/a",
              kind: "doc",
            },
          ],
        },
        {
          id: "links-imagens.caminhos",
          title: "Caminhos e organização de pastas",
          description:
            "Relativo e absoluto, e por que a pasta do projeto é o mapa que o navegador segue.",
          content:
            'Todo `href` e todo `src` é um caminho, e caminho se lê a partir do arquivo em que você está.\n\n```text\nmeu-site/\n  index.html\n  sobre.html\n  imagens/\n    foto.jpg\n```\n\nCom essa organização, o `index.html` alcança os vizinhos assim:\n\n```html\n<a href="sobre.html">Sobre mim</a>\n<img src="imagens/foto.jpg" alt="Ana no parque">\n```\n\nCaminho **relativo** parte do arquivo atual: um nome simples é um irmão na mesma pasta, `imagens/foto.jpg` entra numa subpasta, e `../` sobe um nível. Caminho **absoluto** começa com o endereço completo, como `https://exemplo.com/foto.jpg`, e aponta para fora do projeto.\n\nNa prática: use relativo dentro do seu site e absoluto para links externos. Assim o projeto inteiro pode mudar de pasta, ou sair do seu computador para um servidor, sem nada quebrar.\n\nDois hábitos evitam dor de cabeça. Nomes de arquivo em minúsculas, sem espaço e sem acento, porque muitos servidores diferenciam maiúsculas e o navegador não adivinha. E uma pasta por tipo de conteúdo, como `imagens`, desde o primeiro dia.\n\nVocê domina este passo quando desenha a pasta do projeto e escreve, de cabeça, o caminho de um arquivo até outro.',
          resources: [
            {
              label: "MDN: estruturando conteúdo com HTML (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Core/Structuring_content",
              kind: "doc",
            },
          ],
        },
        {
          id: "links-imagens.ancoras",
          title: "Âncoras internas e nova aba",
          description:
            "Links que levam a um ponto da mesma página, e como abrir um site externo com segurança.",
          content:
            'Um link também pode levar a um ponto da própria página. Para isso, o destino recebe um `id`, e o link aponta para ele com `#`.\n\n```html\n<nav>\n  <a href="#sobre">Sobre</a>\n  <a href="#contato">Contato</a>\n</nav>\n<section id="sobre">\n  <h2>Sobre mim</h2>\n</section>\n```\n\nO valor do `id` é único na página inteira: dois elementos com o mesmo `id` deixam o destino ambíguo. É esse par, `id` no destino e `#` no link, que faz o menu do projeto desta trilha funcionar sem nenhuma linha de JavaScript.\n\nPara abrir um endereço externo em outra aba, existe o `target`:\n\n```html\n<a href="https://exemplo.com" target="_blank"\n   rel="noopener">Abrir em nova aba</a>\n```\n\nO `rel="noopener"` acompanha o `target="_blank"` por segurança: sem ele, a página aberta ganha uma referência à sua e pode manipulá-la. Navegadores atuais já fazem isso sozinhos, e escrever continua sendo a recomendação.\n\nAbrir em nova aba é decisão de conteúdo, não regra: tira do visitante o controle do botão de voltar, então reserve para casos em que sair da página atrapalharia.\n\nVocê domina este passo quando cria um menu que salta para seções da mesma página.',
          resources: [
            {
              label: "MDN: o elemento a (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/a",
              kind: "doc",
            },
          ],
        },
        {
          id: "links-imagens.imagens",
          title: "Imagens com img e alt",
          description:
            "O elemento vazio que traz uma imagem, e os atributos que evitam página quebrada e layout pulando.",
          content:
            'A imagem entra com `<img>`, um elemento vazio: ele não tem conteúdo nem tag de fechamento.\n\n```html\n<img src="imagens/foto.jpg" alt="Ana no parque"\n     width="600" height="400">\n```\n\nO `src` é o caminho do arquivo. O `alt` é o texto alternativo: o que um leitor de tela anuncia e o que aparece quando a imagem não carrega. Ele descreve o que a imagem mostra, e não o nome do arquivo.\n\nO `width` e o `height` informam as dimensões originais em pixels. Eles não são para esticar a imagem, isso é papel do CSS; servem para o navegador reservar o espaço antes do download e evitar que o texto pule quando a foto aparece.\n\nSobre formatos: `.jpg` para fotografia, `.png` quando precisa de fundo transparente, `.svg` para desenho e ícone, que ampliam sem perder nitidez. E imagem grande demais é o motivo mais comum de página lenta: redimensione antes de publicar.\n\nO `alt` tem regras próprias, inclusive quando deixá-lo vazio de propósito, e a seção Acessibilidade e qualidade abre com esse assunto.\n\nVocê domina este passo quando publica uma imagem com descrição útil e sabe por que as dimensões estão ali.',
          resources: [
            {
              label: "MDN: o elemento img (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/img",
              kind: "doc",
            },
          ],
        },
        {
          id: "links-imagens.figure",
          title: "figure e figcaption",
          description:
            "Quando a imagem tem legenda visível, e qual a diferença entre legenda e texto alternativo.",
          content:
            'Quando a imagem vem acompanhada de uma legenda visível, os dois viram uma unidade:\n\n```html\n<figure>\n  <img src="grafico.png" alt="Vendas subindo">\n  <figcaption>Vendas do primeiro semestre</figcaption>\n</figure>\n```\n\nO `<figure>` envolve o conteúdo ilustrativo, e o `<figcaption>` guarda a legenda. A marcação diz ao navegador que aquele texto pertence àquela imagem, e não ao parágrafo vizinho.\n\nA diferença entre `alt` e `<figcaption>` confunde no começo. O `alt` **substitui** a imagem para quem não a vê, então descreve o que ela mostra. A legenda **acompanha** a imagem para todo mundo, e costuma dizer outra coisa: a fonte do dado, a data, o nome de quem aparece na foto. Repetir o mesmo texto nos dois faz o leitor de tela ouvir tudo duas vezes.\n\nO `<figure>` não serve só para imagem: ele vale para trecho de código, diagrama, tabela ou citação que sejam referenciados pelo texto principal.\n\nA posição dele na página é livre, e é justamente essa a ideia: o conteúdo continua fazendo sentido se a figura for para o lado ou para o fim.\n\nVocê domina este passo quando publica uma figura com legenda e um `alt` que não a repete.',
          resources: [
            {
              label: "MDN: o elemento figure (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/figure",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "listas-tabelas",
      title: "Listas e tabelas",
      level: "iniciante",
      description:
        "Listas com e sem ordem, listas de definição e tabelas de dados que continuam legíveis para quem não as enxerga.",
      children: [
        {
          id: "listas-tabelas.listas",
          title: "Listas com ul, ol e li",
          description:
            "Quando a ordem dos itens importa, quando não importa, e por que o li nunca vive sozinho.",
          content:
            "Duas listas cobrem quase tudo. A `<ul>` é a lista **sem ordem**, para itens que poderiam ser embaralhados sem prejuízo; a `<ol>` é a **ordenada**, para passos de uma receita ou colocações de um ranking. Cada item é um `<li>`.\n\n```html\n<ul>\n  <li>HTML</li>\n  <li>CSS</li>\n</ul>\n<ol>\n  <li>Criar a pasta</li>\n  <li>Escrever o index.html</li>\n</ol>\n```\n\nO navegador desenha marcador redondo na primeira e número na segunda, mas a escolha não é visual: é o significado da ordem. Trocar a aparência é trabalho do CSS.\n\nA regra estrutural é curta: `<li>` só existe dentro de `<ul>` ou `<ol>`, e essas duas só aceitam `<li>` como filho direto. Um parágrafo solto dentro de uma `<ul>` é marcação inválida, mesmo que o navegador mostre a página assim mesmo.\n\nLista é também o esqueleto de um menu de navegação: os links do projeto desta trilha vivem numa `<ul>` dentro do `<nav>`, como a seção HTML semântico mostra.\n\nO fechamento do `<li>` é opcional no padrão, e mesmo assim esta trilha sempre o escreve: código com fechamento explícito é código que qualquer pessoa consegue ler.\n\nVocê domina este passo quando escolhe entre `<ul>` e `<ol>` pelo conteúdo, e não pelo desenho do marcador.",
          resources: [
            {
              label: "MDN: o elemento ul (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/ul",
              kind: "doc",
            },
          ],
        },
        {
          id: "listas-tabelas.aninhadas",
          title: "Listas aninhadas e listas de definição",
          description:
            "Sublistas dentro de um item, e o par termo e descrição que o dl resolve.",
          content:
            "Uma lista pode conter outra, e o lugar da sublista é **dentro do item** a que ela pertence, nunca entre dois itens.\n\n```html\n<ul>\n  <li>Front-end\n    <ul>\n      <li>HTML</li>\n      <li>CSS</li>\n    </ul>\n  </li>\n  <li>Back-end</li>\n</ul>\n```\n\nRepare que o `<li>` de Front-end só fecha depois da sublista: é isso que diz que HTML e CSS pertencem a ele. Menu com submenu usa exatamente essa forma.\n\nPara pares de termo e descrição existe outra lista, a `<dl>`. Dentro dela, `<dt>` é o termo e `<dd>` é a descrição:\n\n```html\n<dl>\n  <dt>HTML</dt>\n  <dd>Estrutura e significado do conteudo.</dd>\n  <dt>CSS</dt>\n  <dd>Aparencia e layout.</dd>\n</dl>\n```\n\nEla serve para glossários, listas de perguntas e respostas e fichas técnicas, do tipo peso, altura e ano. Um termo pode ter mais de uma descrição, e várias descrições podem compartilhar o mesmo termo.\n\nO nome antigo, lista de definição, ainda aparece em tutoriais; o padrão hoje a chama de lista de descrição, e o uso é mais amplo que dicionário.\n\nVocê domina este passo quando aninha uma sublista no item certo e reconhece quando o conteúdo pede `<dl>`.",
          resources: [
            {
              label: "MDN: o elemento dl (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/dl",
              kind: "doc",
            },
          ],
        },
        {
          id: "listas-tabelas.tabelas",
          title: "Tabelas de dados",
          description:
            "table, tr, th e td para dado tabular, e por que tabela não serve para montar layout.",
          content:
            "Tabela serve para **dado tabular**: informação que só faz sentido no cruzamento de uma linha com uma coluna.\n\n```html\n<table>\n  <tr>\n    <th>Projeto</th>\n    <th>Ano</th>\n  </tr>\n  <tr>\n    <td>Site da padaria</td>\n    <td>2026</td>\n  </tr>\n</table>\n```\n\nO `<table>` envolve tudo. Cada `<tr>` é uma linha. Dentro dela, `<th>` é célula de **cabeçalho** e `<td>` é célula de **dado**. O navegador destaca o `<th>` por padrão, e mais importante: ele anuncia esse texto como o rótulo da coluna para quem usa leitor de tela.\n\nHouve uma época em que tabela era usada para montar o layout inteiro de um site, com colunas e menus dentro de células. Isso ficou para trás: quem posiciona é o CSS, e tabela de layout confunde qualquer leitura não visual da página.\n\nO navegador ainda insere sozinho um `<tbody>` em volta das linhas, mesmo quando você não escreve. Ver esse elemento no painel do DevTools não é sinal de erro.\n\nO próximo passo acrescenta o que falta para a tabela ser realmente legível.\n\nVocê domina este passo quando monta uma tabela pequena com cabeçalho e sabe dizer por que ela não serve de layout.",
          resources: [
            {
              label: "MDN: o elemento table (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/table",
              kind: "doc",
            },
          ],
        },
        {
          id: "listas-tabelas.tabelas-acessiveis",
          title: "Tabelas legíveis para todos",
          description:
            "caption, thead, tbody e o atributo scope: o que separa uma grade de números de uma tabela compreensível.",
          content:
            'Quatro acréscimos transformam a tabela do passo anterior.\n\n```html\n<table>\n  <caption>Projetos publicados</caption>\n  <thead>\n    <tr><th scope="col">Projeto</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Site da padaria</td></tr>\n  </tbody>\n</table>\n```\n\nO `<caption>` é o título da tabela, e vem logo depois da abertura do `<table>`. Ele aparece na tela e é anunciado antes do conteúdo, o que dá contexto a quem chega ali sem enxergar a página inteira.\n\nO `<thead>` agrupa a linha de cabeçalho e o `<tbody>` agrupa os dados. Além de organizar o código, essa separação permite que o cabeçalho continue visível quando a tabela rola, e que ele se repita quando a página é impressa.\n\nO `scope` é o detalhe que mais rende: `scope="col"` diz que aquele `<th>` rotula a coluna inteira, e `scope="row"` que ele rotula a linha. Com isso, um leitor de tela anuncia Projeto: site da padaria ao entrar na célula, em vez de ler números soltos.\n\nTabela grande pede também cuidado de conteúdo: menos colunas, unidades no cabeçalho e nada de célula vazia sem explicação.\n\nVocê domina este passo quando publica uma tabela em que cada célula de dado tem um rótulo claro.',
          resources: [
            {
              label: "MDN: o elemento caption (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/caption",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "semantica",
      title: "HTML semântico",
      level: "intermediario",
      description:
        "Escolher elementos pelo significado do conteúdo: as regiões da página, os blocos de conteúdo e o lugar certo de div e span.",
      children: [
        {
          id: "semantica.porque",
          title: "O problema da página feita de div",
          description:
            "Por que uma marcação que parece certa na tela pode não dizer nada sobre o conteúdo.",
          content:
            "É possível montar uma página inteira com um elemento só, o `<div>`, e com CSS ela fica idêntica a uma página bem marcada. A diferença não está no que se vê.\n\nHTML **semântico** é escolher o elemento pelo significado do conteúdo, e não pela aparência que ele terá. Um menu marcado como menu, um artigo marcado como artigo, um rodapé marcado como rodapé.\n\nTrês públicos leem essa diferença. Leitores de tela oferecem atalhos por região: quem navega assim pula direto para o conteúdo principal, se ele existir como tal. Buscadores usam a estrutura para entender o que é conteúdo e o que é navegação repetida em todas as páginas. E a próxima pessoa que abrir o código entende a página lendo só as tags, sem precisar rodar nada.\n\nO custo dessa escolha é zero: `<header>` e `<div>` ocupam o mesmo espaço e não mudam a aparência sozinhos. É a rara decisão em que o certo não custa mais caro.\n\nOs próximos passos percorrem os elementos das regiões e dos blocos de conteúdo, e fecham com os casos em que `<div>` e `<span>` continuam sendo a escolha certa.\n\nVocê domina este passo quando olha um layout e já pensa em nomes de elementos, e não em caixas.",
          resources: [
            {
              label: "MDN: semântica (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Glossary/Semantics",
              kind: "doc",
            },
          ],
        },
        {
          id: "semantica.estrutura",
          title: "As regiões da página",
          description:
            "header, nav, main e footer: os quatro elementos que dão o mapa de qualquer página.",
          content:
            'Quatro elementos descrevem as grandes regiões de uma página.\n\n```html\n<header>\n  <h1>Portfolio de Ana</h1>\n  <nav>\n    <ul>\n      <li><a href="#sobre">Sobre</a></li>\n    </ul>\n  </nav>\n</header>\n<main><h2>Sobre mim</h2></main>\n<footer><p>ana@exemplo.com</p></footer>\n```\n\nO `<header>` é o topo, com título e identidade. O `<nav>` é o bloco de navegação principal, e note que ele envolve uma lista de links: navegação é uma lista, e marcar assim informa quantos itens existem. O `<main>` guarda o conteúdo específico daquela página, e é único: o que se repete em todas as páginas fica fora dele. O `<footer>` fecha, com contato, autoria ou links secundários.\n\nEssas regiões são o que um leitor de tela usa para oferecer atalhos, assunto do passo sobre leitores de tela na seção Acessibilidade e qualidade.\n\nUm detalhe que confunde: `<header>` e `<footer>` também podem aparecer dentro de um `<article>`, funcionando como topo e rodapé daquele conteúdo. Já o `<main>` aparece uma vez só.\n\nVocê domina este passo quando divide qualquer página em topo, navegação, conteúdo e rodapé antes de escrever a primeira linha.',
          resources: [
            {
              label: "MDN: o elemento header (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/header",
              kind: "doc",
            },
          ],
        },
        {
          id: "semantica.conteudo",
          title: "Blocos de conteúdo",
          description:
            "section, article e aside: como agrupar partes do conteúdo sem perder o significado.",
          content:
            "Dentro das regiões vêm os blocos de conteúdo, e três elementos dão conta da maioria.\n\n```html\n<main>\n  <section>\n    <h2>Projetos</h2>\n    <article>\n      <h3>Site da padaria</h3>\n      <p>Pagina de uma padaria.</p>\n    </article>\n  </section>\n  <aside><p>Disponivel para freelas.</p></aside>\n</main>\n```\n\nO `<section>` agrupa uma parte temática do conteúdo e quase sempre começa com um título. Se você não consegue dar um título à seção, provavelmente ela é só uma caixa, e o elemento certo passa a ser `<div>`.\n\nO `<article>` é conteúdo que faz sentido sozinho, fora da página: um post, um card de projeto, um comentário. O teste rápido é imaginar aquele bloco publicado isolado em outro lugar.\n\nO `<aside>` é conteúdo lateral, relacionado mas não essencial: uma nota, um destaque, uma chamada. Ele não precisa estar visualmente ao lado; o que importa é a relação com o conteúdo principal.\n\nA regra que evita erro: pergunte se aquele bloco tem assunto próprio. Tendo, é `<section>` ou `<article>`; não tendo, é `<div>`.\n\nVocê domina este passo quando justifica cada `<section>` e cada `<article>` de uma página em uma frase.",
          resources: [
            {
              label: "MDN: o elemento section (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/section",
              kind: "doc",
            },
          ],
        },
        {
          id: "semantica.div-span",
          title: "Quando div e span são a escolha certa",
          description:
            "Os dois elementos sem significado próprio, e o papel legítimo que eles têm.",
          content:
            "Depois de tanto elogio à semântica, fica a impressão de que `<div>` e `<span>` são erro. Não são: eles são os elementos **neutros**, e existem para quando não há significado a declarar.\n\n```html\n<div>\n  <p>Ana, <span>desenvolvedora</span> em formacao.</p>\n</div>\n```\n\nO `<div>` é neutro em bloco: ocupa a largura disponível e serve para agrupar outros elementos quando o agrupamento é só de aparência, como envolver duas colunas que o CSS vai posicionar. O `<span>` é neutro em linha: envolve um trecho dentro de um texto, sem quebrá-lo, como marcar uma palavra que receberá cor.\n\nO critério é o de sempre: existe elemento com o significado que você quer? Use ele. Não existe? Use o neutro, sem culpa.\n\nO sintoma de excesso é a página em que só há `<div>` aninhado, às vezes com nomes de classe fazendo o trabalho que a tag deveria fazer. Classe é para o CSS; a tag é que carrega o significado.\n\nNesta trilha nenhum bloco usa CSS, então os neutros aparecem pouco. No projeto final eles voltam, quando o layout entrar.\n\nVocê domina este passo quando usa `<div>` por decisão, e não por falta de repertório.",
          resources: [
            {
              label: "MDN: o elemento div (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/div",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "formularios",
      title: "Formulários",
      level: "intermediario",
      description:
        "Como uma página coleta dados: o form, os campos com rótulo, os tipos de entrada e a validação que o próprio HTML faz.",
      children: [
        {
          id: "formularios.form",
          title: "O elemento form",
          description:
            "O envelope que junta os campos, para onde ele envia e por que o método importa.",
          content:
            'Todo formulário começa com `<form>`, o elemento que agrupa os campos e sabe o que fazer com eles.\n\n```html\n<form action="/contato" method="post">\n  <input type="text" name="nome">\n  <button type="submit">Enviar</button>\n</form>\n```\n\nO `action` diz para onde os dados vão: o endereço que vai recebê-los. O `method` diz como: com `get`, os dados viajam na própria URL, o que serve para busca e filtro, porque o resultado fica compartilhável; com `post`, eles viajam no corpo da requisição, que é o certo para qualquer coisa que altere dados ou seja privada.\n\nO que liga um campo ao envio é o atributo `name`. Campo sem `name` simplesmente não é enviado, e esse é um dos erros mais silenciosos de quem começa.\n\nO botão de envio é `<button type="submit">`. Ao clicar nele, o navegador reúne os campos e dispara a requisição sozinho, sem JavaScript nenhum.\n\nNesta trilha o formulário não tem para onde enviar de verdade, porque não há servidor: o foco é a marcação. O projeto final monta um formulário de contato completo, pronto para receber um `action` quando existir.\n\nVocê domina este passo quando explica a diferença entre `get` e `post` e lembra que todo campo precisa de `name`.',
          resources: [
            {
              label: "MDN: o elemento form (em inglês)",
              url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form",
              kind: "doc",
            },
          ],
        },
        {
          id: "formularios.label",
          title: "Campos com rótulo",
          description:
            "input e label ligados por for e id: o par que torna o formulário utilizável.",
          content:
            'Campo sem rótulo é campo adivinhado. O `<label>` resolve isso, e a ligação é explícita:\n\n```html\n<label for="email">E-mail</label>\n<input type="email" id="email" name="email">\n```\n\nO `for` do `<label>` aponta para o `id` do campo, e os dois precisam ter exatamente o mesmo valor. Feita a ligação, três coisas melhoram: clicar no rótulo põe o cursor no campo, o que ajuda quem usa o dedo numa tela pequena; o leitor de tela anuncia E-mail ao chegar no campo, em vez de campo de edição; e a área clicável do campo cresce.\n\nO `id` identifica o elemento na página e é único. O `name` identifica o dado no envio. Eles costumam ter o mesmo valor, e fazem trabalhos diferentes.\n\nExiste também a forma implícita, com o `<input>` dentro do `<label>`, que dispensa `for` e `id`. Ela funciona, e a forma explícita continua sendo a recomendada, porque sobrevive a mudanças de layout que separem o rótulo do campo.\n\nTexto de exemplo dentro do campo, com `placeholder`, não substitui rótulo: ele some quando a pessoa começa a digitar.\n\nVocê domina este passo quando todo campo do seu formulário tem rótulo ligado, e você prova isso clicando no texto.',
          resources: [
            {
              label: "MDN: o elemento label (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/label",
              kind: "doc",
            },
          ],
        },
        {
          id: "formularios.tipos",
          title: "Tipos de campo",
          description:
            "O atributo type muda teclado, validação e controle: escolher o tipo certo é metade do trabalho.",
          content:
            'O `<input>` é um elemento só, e o atributo `type` decide o que ele vira.\n\n```html\n<input type="text" id="nome" name="nome">\n<input type="email" id="email" name="email">\n<input type="date" id="nascimento" name="nascimento">\n<input type="checkbox" id="aceito" name="aceito">\n```\n\nA escolha do tipo muda três coisas de uma vez. O **teclado** do celular: `email` traz o arroba, `tel` traz o teclado numérico. O **controle** que aparece: `date` abre um calendário, `color` abre um seletor de cor, `checkbox` e `radio` viram caixas. E a **validação** automática, que o passo sobre validação detalha.\n\nOs tipos mais usados são `text`, `email`, `password`, `tel`, `number`, `date`, `checkbox`, `radio` e `file`. Um `type` que o navegador não conhece vira `text`, o que é uma degradação segura.\n\nDois cuidados. Em `radio`, os botões do mesmo grupo compartilham o mesmo `name`, e é isso que faz a escolha ser exclusiva. Em `checkbox` e `radio`, o rótulo importa ainda mais, porque a caixa sozinha não diz nada.\n\nO tipo certo não é detalhe de conforto: ele reduz erro de digitação antes de qualquer verificação.\n\nVocê domina este passo quando escolhe o `type` pelo dado que o campo recebe, e não por hábito.',
          resources: [
            {
              label: "MDN: o elemento input (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/input",
              kind: "doc",
            },
          ],
        },
        {
          id: "formularios.outros",
          title: "Seleção, texto longo e botões",
          description:
            "select, textarea e os três tipos de button, com as armadilhas de cada um.",
          content:
            'Nem todo campo é um `<input>`.\n\n```html\n<label for="assunto">Assunto</label>\n<select id="assunto" name="assunto">\n  <option value="orcamento">Orcamento</option>\n  <option value="duvida">Duvida</option>\n</select>\n<label for="msg">Mensagem</label>\n<textarea id="msg" name="msg" rows="4"></textarea>\n```\n\nO `<select>` é a lista de opções, e cada `<option>` tem um `value`, que é o dado enviado, e um texto, que é o que a pessoa lê. O `<textarea>` é o campo de texto longo; o conteúdo inicial dele vai entre as tags, e não num atributo `value`, e por isso ele precisa da tag de fechamento mesmo quando está vazio.\n\nO `<button>` tem três tipos, e a diferença aparece quando ele está dentro de um `<form>`. Com `type="submit"`, ele envia; com `type="reset"`, ele limpa os campos; com `type="button"`, ele não faz nada sozinho.\n\nA armadilha clássica é o `<button>` sem `type` dentro de um formulário: o padrão dele é `submit`, então um botão que deveria só abrir um menu acaba enviando o formulário. Escreva o `type` sempre.\n\nVocê domina este passo quando monta um formulário com seleção, texto longo e botões, e cada botão faz o que promete.',
          resources: [
            {
              label: "MDN: o elemento select (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/select",
              kind: "doc",
            },
            {
              label: "MDN: o elemento button (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/button",
              kind: "doc",
            },
          ],
        },
        {
          id: "formularios.validacao",
          title: "Validação sem JavaScript",
          description:
            "required, minlength, pattern, min e max: o que o próprio navegador confere antes de enviar.",
          content:
            'O HTML valida sozinho, e isso poupa código.\n\n```html\n<label for="nome">Nome</label>\n<input type="text" id="nome" name="nome" required\n       minlength="3">\n<label for="idade">Idade</label>\n<input type="number" id="idade" name="idade"\n       min="18" max="120">\n```\n\nO `required` torna o campo obrigatório. O `minlength` e o `maxlength` limitam o tamanho do texto; o `min` e o `max` limitam o valor de um número ou de uma data. O `pattern` aceita uma expressão regular, útil para formatos como CEP.\n\nAo clicar em enviar, o navegador barra o envio, foca o primeiro campo inválido e mostra uma mensagem no idioma do sistema. Nada disso exige JavaScript.\n\nO limite precisa ficar claro: essa validação melhora a experiência, e **não** é segurança. Qualquer pessoa pode enviar dados sem passar pelo formulário, então o servidor confere tudo de novo. É a mesma ideia do `alt`: o navegador ajuda, mas a responsabilidade continua de quem recebe.\n\nUse também o `type` como validação, já que `email` e `url` conferem o formato sozinhos.\n\nVocê domina este passo quando um formulário seu recusa dados inválidos antes do envio e você sabe explicar por que isso não basta.',
          resources: [
            {
              label: "MDN: validação de formulário (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Extensions/Forms/Form_validation",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "head",
      title: "Metadados e o head",
      level: "intermediario",
      description:
        "O que a página diz sobre si mesma: codificação, viewport, título, descrição, ícone da aba e a prévia que aparece quando alguém compartilha o link.",
      children: [
        {
          id: "head.charset-viewport",
          title: "Codificação e viewport",
          description:
            "Duas linhas que evitam acento quebrado e página minúscula no celular.",
          content:
            'O `<head>` guarda informação sobre a página. Duas linhas dele, mostradas abaixo sem o documento em volta, resolvem problemas que aparecem em toda página nova.\n\n```html\n<meta charset="UTF-8">\n<meta name="viewport"\n      content="width=device-width, initial-scale=1">\n```\n\nO `<meta charset="UTF-8">` declara a codificação de caracteres. Sem ele, o navegador chuta, e o chute erra: acento e cedilha viram símbolos estranhos. Ele precisa aparecer logo no começo do `<head>`, antes de qualquer texto.\n\nO `<meta name="viewport">` é o que faz a página se comportar no celular. Sem essa linha, o navegador finge ter uma tela larga de computador e encolhe tudo, deixando o texto ilegível. Com `width=device-width`, a largura passa a ser a real do aparelho, e `initial-scale=1` começa sem zoom.\n\nEsses dois `<meta>` são elementos vazios, como `<img>` e `<br>`: informação em atributo, sem conteúdo.\n\nA seção O documento mínimo já trazia o `charset`; aqui ele ganha companhia. Os próximos passos completam o `<head>` com título, descrição, ícone e prévia de compartilhamento.\n\nVocê domina este passo quando abre uma página sua no celular e ela aparece em tamanho legível, com acentos corretos.',
          resources: [
            {
              label: "MDN: o elemento meta (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/meta",
              kind: "doc",
            },
          ],
        },
        {
          id: "head.title-description",
          title: "Título e descrição",
          description:
            "O texto da aba e o resumo que aparece no resultado de busca.",
          content:
            'Duas informações da página viajam para fora dela.\n\n```html\n<title>Ana Souza | Desenvolvedora front-end</title>\n<meta name="description"\n      content="Portfolio de Ana Souza, com projetos de\n               front-end e formas de contato.">\n```\n\nO `<title>` nomeia a aba do navegador, vira o texto do favorito e costuma ser o título azul do resultado de busca. Ele é obrigatório: uma página sem `<title>` aparece como Sem título em toda lista. Escreva de 50 a 60 caracteres, do específico para o geral, como no exemplo.\n\nO `<meta name="description">` guarda o resumo. Buscadores costumam exibi-lo abaixo do título, e nem sempre: eles podem preferir um trecho do próprio conteúdo. Ainda assim vale escrever, entre 120 e 160 caracteres, dizendo o que a pessoa encontra ali.\n\nUm erro comum é repetir o mesmo título e a mesma descrição em todas as páginas do site. Cada página tem um assunto, e esses dois campos existem para dizer qual é.\n\nA trilha Front-end do Zero volta a esse assunto no passo `html.seo`, com o resto do que buscadores leem.\n\nVocê domina este passo quando escreve título e descrição diferentes para duas páginas do mesmo site.',
          resources: [
            {
              label: "MDN: o elemento title (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/title",
              kind: "doc",
            },
          ],
        },
        {
          id: "head.favicon",
          title: "O ícone da aba",
          description:
            "O favicon, o elemento link e a diferença entre link de navegação e link de recurso.",
          content:
            'O ícone que aparece na aba, no favorito e no atalho da tela inicial é o favicon, e ele entra pelo `<link>`:\n\n```html\n<link rel="icon" href="favicon.ico" sizes="any">\n<link rel="icon" href="icone.svg" type="image/svg+xml">\n```\n\nO `<link>` é um elemento vazio do `<head>`, e não tem relação com o `<a>`: ele não cria link clicável nenhum. O que ele faz é declarar uma **relação** entre a página e um recurso externo, e o atributo `rel` diz qual é a relação. Com `rel="icon"`, o recurso é o ícone; com `rel="stylesheet"`, seria uma folha de estilo, que é como o CSS entra numa página.\n\nDuas linhas cobrem o caso comum: um `.ico` para navegadores antigos e um `.svg`, que fica nítido em qualquer tamanho. Sem nenhuma delas, muitos navegadores ainda procuram um arquivo chamado `favicon.ico` na raiz do site.\n\nVale lembrar o custo: cada `<link>` é um arquivo a mais para baixar, e ícone gigante em página pequena pesa.\n\nVocê domina este passo quando publica uma página com ícone próprio e sabe explicar por que o `<link>` não é um link clicável.',
          resources: [
            {
              label: "MDN: o elemento link (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/link",
              kind: "doc",
            },
          ],
        },
        {
          id: "head.compartilhamento",
          title: "A prévia do compartilhamento",
          description:
            "Open Graph: os metadados que decidem como o link aparece quando alguém o envia.",
          content:
            'Quando você cola um endereço numa conversa e aparece um cartão com título, descrição e imagem, quem produziu aquilo foram metadados do `<head>`.\n\n```html\n<meta property="og:title" content="Portfolio de Ana">\n<meta property="og:description"\n      content="Projetos de front-end e contato.">\n<meta property="og:image"\n      content="https://exemplo.com/previa.jpg">\n<meta property="og:url" content="https://exemplo.com/">\n```\n\nEsse conjunto é o **Open Graph**, um padrão criado fora do HTML e adotado por praticamente todas as redes e mensageiros. Repare que aqui o atributo é `property`, e não `name` como nos outros `<meta>`.\n\nDois detalhes decidem se o cartão aparece certo. A imagem do `og:image` precisa de endereço **absoluto**, porque quem monta a prévia não está no seu site. E ela costuma ser cortada em proporção larga, algo perto de 1200 por 630 pixels, então texto pequeno nela some.\n\nSem esses metadados o link ainda funciona: a prévia fica sem imagem e o título vira o do `<title>`. É uma degradação elegante, e mesmo assim vale escrever as quatro linhas.\n\nVocê domina este passo quando publica uma página cuja prévia mostra o que você escolheu.',
          resources: [
            {
              label: "Open Graph protocol (em inglês)",
              url: "https://ogp.me/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "midia",
      title: "Mídia e incorporação",
      level: "intermediario",
      description:
        "Vídeo e áudio nativos, legendas que tornam o conteúdo acessível, conteúdo de terceiros com iframe e imagens que se adaptam à tela.",
      children: [
        {
          id: "midia.audio-video",
          title: "Vídeo e áudio",
          description:
            "Os elementos nativos, o atributo controls e o texto que aparece quando nada funciona.",
          content:
            'Vídeo e som tocam direto no navegador, sem plugin nenhum.\n\n```html\n<video src="apresentacao.mp4" controls width="600">\n  Seu navegador nao reproduz video.\n</video>\n<audio src="podcast.mp3" controls></audio>\n```\n\nO `controls` é o atributo que mostra os botões de play, volume e barra de progresso. Sem ele, o vídeo aparece parado e sem nenhuma forma de controle, o que só faz sentido com JavaScript no comando.\n\nO conteúdo entre as tags é o texto de reserva: ele aparece apenas em navegadores que não conhecem o elemento. Não é legenda nem descrição.\n\nTrês atributos merecem cuidado. O `autoplay` inicia sozinho e incomoda quase sempre; navegadores só o permitem com o som mudo. O `loop` repete sem fim. O `muted` começa sem som, e costuma ser a condição para o `autoplay` funcionar.\n\nSobre formatos: `.mp4` para vídeo e `.mp3` para áudio são os mais compatíveis. Arquivo grande demais custa caro para quem tem internet limitada, e vídeo hospedado em outro serviço, assunto do passo sobre `<iframe>`, resolve isso.\n\nVocê domina este passo quando publica um vídeo com controles e explica o papel do texto entre as tags.',
          resources: [
            {
              label: "MDN: o elemento video (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/video",
              kind: "doc",
            },
            {
              label: "MDN: o elemento audio (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/audio",
              kind: "doc",
            },
          ],
        },
        {
          id: "midia.legendas",
          title: "Legendas com track",
          description:
            "O elemento que acrescenta legenda a um vídeo, e por que ela não é opcional.",
          content:
            'Legenda entra como um arquivo à parte, ligado ao vídeo pelo `<track>`:\n\n```html\n<video src="aula.mp4" controls>\n  <track src="legendas.vtt" kind="captions"\n         srclang="pt-BR" label="Portugues" default>\n</video>\n```\n\nO `<track>` é vazio e fica dentro do `<video>`. O `src` aponta para um arquivo `.vtt`, texto puro com os tempos e as falas. O `kind` diz o tipo: `captions` para legenda que inclui sons relevantes, `subtitles` para tradução, `descriptions` para descrição do que acontece na tela. O `srclang` informa o idioma, o `label` é o nome que aparece no menu do player e o `default` marca a faixa ativa.\n\nLegenda serve a muita gente além de quem não ouve: quem está em ambiente barulhento, quem assiste sem som no transporte, quem aprende o idioma. É o mesmo raciocínio do `alt` nas imagens, que a seção Acessibilidade e qualidade aprofunda.\n\nGerar o `.vtt` à mão é viável para vídeos curtos, e o formato é simples: tempo inicial, seta, tempo final e a fala embaixo.\n\nVocê domina este passo quando acrescenta uma faixa de legenda a um vídeo e a vê no menu do player.',
          resources: [
            {
              label: "MDN: o elemento track (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/track",
              kind: "doc",
            },
          ],
        },
        {
          id: "midia.iframe",
          title: "Conteúdo de terceiros com iframe",
          description:
            "Incorporar mapa, vídeo ou formulário de outro serviço, com o cuidado que isso exige.",
          content:
            'O `<iframe>` abre outra página dentro da sua, e é assim que mapas, vídeos hospedados e formulários de terceiros aparecem num site.\n\n```html\n<iframe src="https://exemplo.com/mapa"\n        title="Mapa da loja" width="600"\n        height="400" loading="lazy"></iframe>\n```\n\nO `title` não é enfeite: ele é o que um leitor de tela anuncia antes de entrar no conteúdo incorporado, e sem ele a pessoa ouve apenas quadro. O `loading="lazy"` adia o carregamento até a área chegar perto da tela, o que ajuda bastante numa página com vários incorporados.\n\nTrês cuidados valem a pena. Todo `<iframe>` traz uma página inteira de outra pessoa, com o peso e os rastreadores dela. O conteúdo pode sair do ar sem aviso, e aí sobra um retângulo vazio. E o atributo `sandbox` existe para limitar o que o conteúdo incorporado pode fazer, quando a origem não é de confiança.\n\nA alternativa mais leve costuma ser um link e uma imagem de prévia, sobretudo em página pessoal.\n\nVocê domina este passo quando incorpora um conteúdo externo com título descritivo e sabe listar o que isso custa.',
          resources: [
            {
              label: "MDN: o elemento iframe (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/iframe",
              kind: "doc",
            },
          ],
        },
        {
          id: "midia.responsivas",
          title: "Imagens que se adaptam",
          description:
            "srcset, sizes e picture: entregar a imagem certa para cada tela, sem JavaScript.",
          content:
            'Mandar a mesma imagem de 2000 pixels para um celular desperdiça dados de quem paga por eles. O HTML resolve isso sozinho.\n\n```html\n<img src="foto-800.jpg"\n     srcset="foto-400.jpg 400w, foto-800.jpg 800w"\n     sizes="(max-width: 600px) 100vw, 600px"\n     alt="Ana no parque">\n```\n\nO `srcset` lista as versões do arquivo com a **largura real** de cada uma, escrita com `w`. O `sizes` diz quanto espaço a imagem vai ocupar na tela, e com essas duas informações o navegador escolhe qual baixar. O `src` continua ali como reserva para quem não entende `srcset`.\n\nQuando a mudança não é só de tamanho, entra o `<picture>`:\n\n```html\n<picture>\n  <source srcset="banner-largo.jpg"\n          media="(min-width: 800px)">\n  <img src="banner-alto.jpg" alt="Feira de rua">\n</picture>\n```\n\nEle permite trocar a imagem inteira conforme a condição, como usar um recorte vertical no celular. O `<img>` dentro dele é obrigatório: é ele que aparece quando nenhuma `<source>` casa, e é dele que vem o `alt`.\n\nVocê domina este passo quando publica uma imagem que baixa menos bytes no celular sem perder qualidade no monitor.',
          resources: [
            {
              label: "MDN: o elemento picture (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/picture",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "acessibilidade",
      title: "Acessibilidade e qualidade",
      level: "avancado",
      description:
        "Texto alternativo que serve, navegação por títulos e regiões, uso do teclado, ARIA com parcimônia e as ferramentas que conferem o resultado.",
      children: [
        {
          id: "acessibilidade.alt",
          title: "O alt que descreve",
          description:
            "Como escrever texto alternativo útil, e quando deixá-lo vazio de propósito.",
          content:
            'O `alt` é a imagem em palavras. Quem não a vê recebe esse texto no lugar dela, e quem a vê o recebe quando o arquivo não carrega.\n\n```html\n<img src="grafico.png"\n     alt="Vendas subiram de 10 para 40 no semestre">\n<img src="enfeite.png" alt="">\n```\n\nA primeira regra é descrever a **informação**, e não o arquivo. Um `alt` como foto ou grafico1.png não acrescenta nada; o que importa é o que a imagem comunica naquele contexto. A mesma foto pode ter descrições diferentes em páginas diferentes.\n\nA segunda regra surpreende: imagem **decorativa** leva `alt=""`, vazio de propósito. Assim o leitor de tela a ignora, em vez de anunciar o nome do arquivo. Atenção ao detalhe: omitir o atributo não é a mesma coisa que deixá-lo vazio, e a omissão costuma fazer o leitor ler o caminho inteiro.\n\nDuas dicas práticas. Não comece com imagem de nem foto de: o leitor já anuncia que é uma imagem. E se a imagem é um link, o `alt` descreve o **destino**, não o desenho.\n\nVocê domina este passo quando escreve o `alt` pensando em quem ouve a página, e decide com segurança quando deixá-lo vazio.',
          resources: [
            {
              label: "MDN: o elemento img (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Elements/img",
              kind: "doc",
            },
          ],
        },
        {
          id: "acessibilidade.leitores",
          title: "Como um leitor de tela percorre a página",
          description:
            "Títulos, regiões e links como atalhos: o que a marcação semântica entrega na prática.",
          content:
            "Leitor de tela é o programa que transforma a página em voz. Quem o usa raramente ouve tudo do começo ao fim: a leitura linear é lenta demais.\n\nO que essas pessoas fazem é navegar por **atalhos**, e cada atalho é feito de marcação. A tecla de títulos salta de `<h1>` para `<h2>` e assim por diante, e um índice mal montado vira um sumário mentiroso. A navegação por regiões usa `<header>`, `<nav>`, `<main>` e `<footer>`, os elementos da seção HTML semântico: sem eles, não há para onde saltar, e o conteúdo principal só chega depois do menu inteiro. A lista de links mostra todos os textos de link fora de contexto, o que explica por que clique aqui atrapalha.\n\nHá também a leitura dos formulários, campo a campo, anunciando o `<label>` ligado a cada um. Campo sem rótulo é anunciado como campo de edição, sem mais nada.\n\nO resumo é direto: os recursos de acessibilidade não são um trabalho extra sobre a página, eles são a própria marcação bem escolhida. Cada passo anterior desta trilha já era acessibilidade.\n\nVocê domina este passo quando explica, para cada elemento semântico que usou, qual atalho ele cria.",
          resources: [
            {
              label: "MDN: acessibilidade (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/Accessibility",
              kind: "doc",
            },
          ],
        },
        {
          id: "acessibilidade.teclado",
          title: "Navegação por teclado",
          description:
            "Foco, ordem do Tab e o que o tabindex resolve e estraga.",
          content:
            'Muita gente navega sem mouse: por teclado, por comando de voz, por acionador. Nesses casos o **foco** é o cursor, e ele anda com Tab.\n\nA boa notícia é que links, botões e campos já são focáveis por padrão, e a ordem do Tab segue a ordem do código. É por isso que a ordem em que você escreve importa: se o menu aparece depois do conteúdo no arquivo, o Tab chega nele por último, mesmo que o CSS o mostre no topo.\n\nO `tabindex` mexe nisso, e quase sempre vale a pena não mexer. Com `tabindex="0"`, um elemento que não era focável entra na ordem natural. Com `tabindex="-1"`, ele sai do Tab mas ainda pode receber foco por programação, o que serve para levar a pessoa a um trecho da página. E com um número positivo, ele fura a fila, o que espalha uma ordem artificial pela página inteira e é a fonte do problema mais comum aqui.\n\nDuas práticas fecham o assunto: nunca esconder o indicador visual do foco, e oferecer um link de pular para o conteúdo como primeiro item da página.\n\nVocê domina este passo quando percorre a página inteira com Tab, na ordem esperada, enxergando onde o foco está.',
          resources: [
            {
              label: "MDN: o atributo tabindex (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Reference/Global_attributes/tabindex",
              kind: "doc",
            },
          ],
        },
        {
          id: "acessibilidade.aria",
          title: "ARIA com parcimônia",
          description:
            "Atributos que descrevem papel e estado, e a primeira regra: não usar ARIA quando existe elemento nativo.",
          content:
            'ARIA é um conjunto de atributos que informam papel, estado e propriedade de um elemento a tecnologias assistivas, como `role`, `aria-label` e `aria-expanded`.\n\nA primeira regra do ARIA é não usar ARIA. Parece piada e não é: se existe um elemento HTML nativo com o comportamento que você quer, ele já traz papel, foco e teclado prontos. Uma `<div role="button">` precisa de código para responder a Enter e Espaço, para entrar na ordem do Tab e para anunciar o estado; um `<button>` faz tudo isso de graça.\n\nO segundo cuidado: ARIA mal usado é pior que ARIA nenhum. Um `role` errado mente sobre o elemento, e um `aria-label` sobrescreve o texto visível, o que pode fazer o leitor anunciar uma coisa enquanto a tela mostra outra.\n\nOnde ele é legítimo: componentes que o HTML não tem, como abas e menus complexos, e estados dinâmicos, como um painel que abre e fecha. Nos dois casos, o ARIA descreve algo que o JavaScript controla.\n\nNesta trilha não há ARIA nos blocos, e é de propósito: tudo o que ela ensina tem elemento nativo.\n\nVocê domina este passo quando, antes de escrever um `role`, procura o elemento que já faz aquilo.',
          resources: [
            {
              label: "MDN: ARIA (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/Accessibility/ARIA",
              kind: "doc",
            },
          ],
        },
        {
          id: "acessibilidade.validar",
          title: "Validar e inspecionar",
          description:
            "O validador do W3C e o painel Elements: duas conferências que pegam o que o olho não pega.",
          content:
            "Navegador é tolerante: ele conserta marcação quebrada em silêncio, e a página parece certa mesmo com tag sem fechar. Duas ferramentas mostram a verdade.\n\nO **validador do W3C** recebe o endereço da página ou o arquivo e lista tudo que não segue o padrão: tag aberta e nunca fechada, atributo que não existe naquele elemento, `id` repetido, `alt` ausente. Vale rodar antes de publicar e depois de qualquer mudança grande. Nem todo aviso é defeito, e todo erro merece leitura.\n\nO **painel Elements** do DevTools, que abre com F12, mostra a árvore que o navegador realmente montou, e não o que você escreveu. É ali que você vê o `<tbody>` que ninguém digitou, ou o `<p>` fechado antes da hora porque havia um `<div>` dentro dele. A trilha Front-end do Zero aprofunda essas ferramentas no passo `web.devtools`.\n\nA diferença entre as duas é útil: o validador diz o que está errado no seu arquivo; o DevTools mostra o que o navegador fez com ele.\n\nVocê domina este passo quando valida uma página sua, entende cada mensagem e a deixa sem erros.",
          resources: [
            {
              label: "Validador de HTML do W3C (em inglês)",
              url: "https://validator.w3.org/",
              kind: "doc",
            },
            {
              label: "Especificação HTML do WHATWG (em inglês)",
              url: "https://html.spec.whatwg.org/multipage/",
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
        "Uma página pessoal de verdade, marcada com o que a trilha inteira ensinou, validada, versionada e publicada.",
      children: [
        {
          id: "projeto.pagina",
          title: "Projeto: página pessoal",
          description:
            "Uma página que apresenta quem você é e seus projetos, marcada com HTML semântico e menu com âncoras.",
          project: "landing-page-pessoal",
        },
        {
          id: "projeto.roteiro",
          title: "Roteiro: do esqueleto à publicação",
          description:
            "A ordem de trabalho da página pessoal, seção por seção, até o endereço no ar.",
          content:
            'O projeto desta trilha é uma página pessoal, e aqui ela nasce só com HTML: a estrutura completa, sem estilo nenhum. O estilo vem depois, e o esqueleto é o que decide se ele vai ser fácil.\n\nComece pelo documento mínimo da primeira seção, com `lang`, `charset`, viewport, `<title>` e descrição. Depois marque as regiões: `<header>` com o seu nome em `<h1>` e um `<nav>`, `<main>` para o conteúdo e `<footer>` com o contato.\n\n```html\n<nav>\n  <ul>\n    <li><a href="#sobre">Sobre</a></li>\n    <li><a href="#projetos">Projetos</a></li>\n    <li><a href="#contato">Contato</a></li>\n  </ul>\n</nav>\n```\n\nCada item do menu aponta para o `id` de uma `<section>`, como no passo de âncoras internas. Em Sobre, texto em `<p>` e uma foto com `alt` que descreve. Em Projetos, um `<article>` por projeto, cada um com `<figure>` e `<figcaption>`. Em Contato, um formulário com `<label>` ligado a cada campo, um `<select>` de assunto, um `<textarea>` e `required` onde fizer sentido.\n\nPara terminar: valide no W3C até zerar os erros, versione com o que a trilha Git do Zero ensina e publique no GitHub Pages.\n\nVocê domina este passo quando sua página está no ar e o menu leva a cada seção.',
          resources: [
            {
              label: "Validador de HTML do W3C (em inglês)",
              url: "https://validator.w3.org/",
              kind: "doc",
            },
          ],
        },
        {
          id: "projeto.caminhos",
          title: "Próximos caminhos",
          description:
            "Onde o HTML leva depois desta trilha, e o que aprender em seguida.",
          content:
            "HTML sozinho já põe uma página no ar, e é a base de tudo que vem depois. Terminar aqui abre três caminhos claros.\n\nO primeiro é o estilo. A página do projeto está estruturada e sem aparência nenhuma; o passo seguinte é cuidar de cores, espaçamento e layout, e todo esse trabalho se apoia nos elementos que você marcou. Marcação bem feita é o que torna esse trabalho simples.\n\nO segundo é a trilha **Front-end do Zero**, que amarra a web inteira: a seção de HTML dela, de `html.estrutura` a `html.seo`, revisa o que você viu aqui com outro enfoque, e o passo `web.devtools` aprofunda as ferramentas do navegador.\n\nO terceiro é o comportamento, com **JavaScript do Zero**: formulários que respondem, conteúdo que muda sem recarregar, e o vocabulário de elementos desta trilha aparecendo de novo, agora manipulado por código.\n\nNo meio de qualquer um deles, **Git do Zero** é o que mantém o trabalho seguro e publicado, com histórico e pull request.\n\nO hábito que vale levar: antes de escrever qualquer marcação, pergunte qual é o significado daquele conteúdo. A resposta quase sempre já é o nome do elemento.\n\nVocê domina este passo, e a trilha, quando olha uma página pronta e consegue descrever a marcação por trás dela.",
        },
      ],
    },
  ],
};
