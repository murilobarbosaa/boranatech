// TODO(Ana): revisao editorial completa desta trilha (estrutura reorganizada
// pelo curriculo real da area na Fase 3b.1; titulos e descricoes novos ou
// reescritos precisam de revisao de copy; o conteudo longo esta sendo
// preenchido por lotes a partir da secao de HTML).
import type { RoadmapV2 } from "../types";

export const frontend: RoadmapV2 = {
  slug: "frontend",
  area: "frontend",
  title: "Front-end do Zero",
  level: "Iniciante",
  description:
    "Do básico da web até publicar uma aplicação React. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "web",
      title: "Fundamentos da web",
      level: "iniciante",
      description:
        "O que acontece por trás de toda página: navegador, servidor e as ferramentas pra enxergar isso.",
      children: [
        {
          id: "web.http",
          title: "Cliente, servidor, HTTP e HTTPS",
          description:
            "Requisição e resposta, verbos GET e POST e os códigos de status que resumem cada conversa.",
          content:
            "A web inteira funciona numa conversa de duas falas: o **cliente** pede, o **servidor** responde. O cliente é o navegador que você está usando agora; o servidor é um computador ligado o tempo todo esperando pedidos. Cada pedido se chama requisição, e cada resposta, bem, resposta: request e response, os dois termos que você vai ler em inglês em todo lugar.\n\nQuando você digita uma URL como `https://site.com/produtos`, está montando um pedido: o `https` diz o protocolo da conversa, o `site.com` diz com qual servidor falar e o `/produtos` diz o que você quer lá dentro.\n\nTodo pedido carrega um **verbo** que declara a intenção. Os dois primeiros que importam: `GET` busca alguma coisa (abrir uma página, carregar uma imagem) e `POST` envia dados (mandar um formulário de cadastro). Existem outros, mas esses dois cobrem o seu início inteiro.\n\nA resposta sempre vem com um **código de status**, um número de três dígitos que resume o resultado: `200` é deu certo, `404` é o servidor não achou o que você pediu, `500` é o servidor quebrou tentando responder. Ler esses códigos vira diagnóstico instantâneo.\n\nE o HTTPS? É o HTTP com criptografia: o conteúdo viaja embaralhado, e ninguém no meio do caminho (o wifi do café, o provedor) consegue ler nem alterar o que passa.\n\nVocê domina este passo quando consegue narrar, em termos de requisição e resposta, o que acontece ao abrir um site e ao enviar um formulário.",
          resources: [
            {
              label: "MDN HTTP",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP",
              kind: "doc",
            },
          ],
        },
        {
          id: "web.dns",
          title: "DNS, domínios e hospedagem",
          description:
            "Do nome que você digita ao IP do servidor: domínio, hospedagem e a ponte entre eles.",
          content:
            'DNS é a agenda de contatos da internet: traduz nomes que humanos decoram, como `boranatech.com.br`, em endereços IP que as máquinas usam pra se encontrar, números como `76.76.21.21`. Servidores se localizam por número; nomes existem pra você não precisar decorá-los.\n\nO caminho completo, simplificado: você digita o endereço, o navegador pergunta ao DNS qual é o IP daquele domínio, recebe o número, abre a conexão com o servidor naquele IP e só então faz a requisição HTTP do passo anterior. Tudo em milissegundos, com camadas de cache no meio pra não repetir a mesma pergunta a cada clique.\n\nTrês nomes que você vai ouvir junto e o que cada um é na prática: **domínio** é o nome que alguém registrou e renova anualmente (`seusite.com.br`); **hospedagem** é o computador ou serviço onde os arquivos do site realmente moram; **DNS** é a ponte que aponta o primeiro pro segundo. São três serviços independentes, e é por isso que dá pra trocar de hospedagem mantendo o mesmo domínio: basta atualizar o apontamento.\n\nGuarde o mapa mental: nome, tradução pra IP, conexão, requisição. Quando um site "não abre", esse mapa diz onde procurar o problema. E mais à frente, quando você publicar um projeto com endereço próprio, essas três peças voltam a aparecer.',
        },
        {
          id: "web.render",
          title: "Como o navegador renderiza uma página",
          description:
            "DOM, estilos, layout e pintura: as etapas entre o HTML chegar e a página aparecer.",
          content:
            'Renderizar é transformar texto em pixels. O servidor manda um arquivo de texto (o HTML); o que aparece na tela é o resultado de um processo do navegador que vale conhecer em quatro etapas.\n\nPrimeiro, o navegador lê o HTML de cima pra baixo e monta o **DOM**, uma árvore de objetos em memória onde cada tag vira um nó pendurado no pai. É essa árvore, e não o arquivo original, que o navegador enxerga dali em diante (e é ela que o JavaScript vai manipular mais adiante na trilha).\n\nSegundo, ele processa o CSS e calcula o estilo final de cada elemento da árvore, resolvendo conflitos pelas regras de especificidade e cascata que a seção de CSS ensina.\n\nTerceiro, o **layout**: com os estilos definidos, o navegador calcula a posição e o tamanho de cada caixa na página. Quarto, a **pintura**: desenha tudo na tela, camada por camada.\n\nA consequência prática de ler de cima pra baixo é que a ordem dos arquivos importa. O CSS entra no `<head>` pra página já nascer estilizada, e os scripts costumam ficar no fim do `<body>` (ou marcados com atributo próprio) pra não travar a leitura do HTML no meio.\n\nVocê domina este passo quando consegue explicar por que uma página pode aparecer "pelada" por um instante quando o CSS demora a carregar.',
        },
        {
          id: "web.devtools",
          title: "DevTools do navegador",
          description:
            "F12 e mãos na massa: inspecionar elementos, editar ao vivo, ler o Console e a aba Network.",
          content:
            "O DevTools é o raio-x embutido em todo navegador: um painel que mostra a página por dentro, ao vivo. Abra com F12, com clique direito e Inspecionar, ou com `Ctrl+Shift+I` (`Cmd+Option+I` no Mac). Ele vai ser sua lupa na trilha inteira, então este passo é mão na massa desde já.\n\nA aba **Elements** mostra o DOM montado (aquela árvore do passo anterior) e os estilos aplicados a cada elemento selecionado. O truque que muda tudo: dá pra editar ali mesmo. Clique duas vezes num texto e troque; desmarque uma propriedade CSS e veja o layout reagir na hora. Nada disso altera o site de verdade, é um rascunho local seu; recarregou, voltou ao original.\n\nO **Console** mostra os erros e avisos da página (e vai ser por onde o seu JavaScript conversa com você mais adiante). A aba **Network** lista cada requisição que a página fez: o HTML, cada CSS, cada imagem, com status e tamanho. É o modelo de requisição e resposta acontecendo na sua frente.\n\nO exercício que fecha o passo: abra um site que você usa todo dia e passe cinco minutos fuçando. Troque o título da página, esconda um banner mudando o `display` dele, ache no Network uma requisição com status `200` e alguma com `404`. Fuçar sem medo é o hábito que fica: o DevTools não quebra nada.",
          resources: [
            {
              label: "Chrome DevTools",
              url: "https://developer.chrome.com/docs/devtools",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "html",
      title: "HTML",
      level: "iniciante",
      description:
        "A estrutura de toda página: documento, conteúdo, significado e formulários.",
      children: [
        {
          id: "html.estrutura",
          title: "Estrutura do documento",
          description:
            "Doctype, html, head e body: o esqueleto que todo documento precisa, e o que vai em cada parte.",
          content:
            'Todo arquivo HTML segue o mesmo esqueleto, e o navegador conta com ele pra interpretar a página do jeito certo. São quatro peças: a declaração `<!DOCTYPE html>`, o elemento `<html>`, o `<head>` e o `<body>`.\n\nA primeira linha, `<!DOCTYPE html>`, avisa o navegador que o documento usa HTML moderno. Sem ela, o navegador entra num modo de compatibilidade antigo (o quirks mode) e pequenas diferenças de renderização começam a aparecer do nada.\n\nO `<html>` embrulha todo o resto e leva o atributo de idioma, como em `<html lang="pt-BR">`. É ele que faz o leitor de tela escolher a voz certa e o navegador acertar corretor e tradução.\n\nO `<head>` é a área de bastidores: nada dali aparece na página. É onde vivem o `<title>` (o texto da aba), o `<meta charset="UTF-8">` (que garante os acentos), a meta viewport (que prepara a página pra telas de celular) e os links pros arquivos de CSS.\n\nO `<body>` é o palco: tudo que o usuário vê mora aqui, dos títulos aos botões.\n\nO critério de domínio deste passo é objetivo: fechar qualquer referência e escrever de memória um documento mínimo com essas quatro partes, com `lang`, `charset`, viewport e um `<title>` decente. Esse esqueleto vai abrir todo projeto seu daqui pra frente.',
          resources: [
            {
              label: "MDN HTML",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML",
              kind: "doc",
            },
            {
              label: "web.dev Learn HTML",
              url: "https://web.dev/learn/html",
              kind: "curso",
            },
          ],
        },
        {
          id: "html.conteudo",
          title: "Texto, links, imagens e listas",
          description:
            "Títulos, parágrafos, links, imagens e listas: as tags que colocam conteúdo real na página.",
          content:
            'Com o esqueleto de pé, entra o conteúdo de verdade. Um punhado de tags cobre a maior parte do que qualquer página mostra: títulos, parágrafos, links, imagens e listas.\n\nTítulos vão de `<h1>` a `<h6>` e formam a hierarquia do documento: um único `<h1>` com o assunto principal, `<h2>` pras seções, `<h3>` pra subdivisões. Pular níveis por estética é erro clássico: o tamanho se ajusta com CSS, a tag diz a estrutura. Texto corrido vive em `<p>`.\n\nO link, `<a href="https://exemplo.com">texto</a>`, é o elemento que dá nome ao hipertexto. O endereço vai no atributo `href`, e o texto entre as tags deve dizer pra onde o link leva. Aqui aparece um padrão que vale pra todo o HTML: tags carregam informação extra em **atributos**, pares de nome e valor escritos dentro da abertura da tag.\n\nImagens usam `<img src="foto.jpg" alt="descrição da foto">`. O `src` aponta o arquivo; o `alt` descreve a imagem pra quem não a vê, e na prática é obrigatório.\n\nListas fecham o kit: `<ul>` pra itens sem ordem, `<ol>` quando a sequência importa, `<li>` pra cada item. Monte uma página de receita culinária usando tudo isso (título, ingredientes em lista, passos numerados, foto e um link) e você terá coberto o essencial do conteúdo HTML.',
          resources: [
            {
              label: "MDN Elementos HTML",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Element",
              kind: "doc",
            },
          ],
        },
        {
          id: "html.semantica",
          title: "Tags semânticas",
          description:
            "Escolher a tag pelo significado do conteúdo: o mapa que leitores de tela e buscadores usam.",
          content:
            "Semântica em HTML é escolher a tag pelo **significado** do conteúdo, não pela aparência. Uma `<div>` não diz nada sobre o que tem dentro; um `<nav>` diz que ali mora a navegação. As duas podem ficar idênticas na tela, mas só uma carrega informação.\n\nAs principais tags semânticas de estrutura são `<header>` (o topo com logo e menu), `<nav>` (blocos de navegação), `<main>` (o conteúdo principal, um por página), `<section>` (agrupamento por assunto), `<article>` (conteúdo que faz sentido sozinho, como um post ou um card de produto) e `<footer>` (o rodapé). No nível do texto, `<strong>` marca importância e `<em>` marca ênfase.\n\nIsso importa por três motivos concretos. Leitores de tela usam essas tags como mapa: quem navega por atalhos pula direto pro `<main>` ou pro `<nav>` sem ouvir a página inteira. Buscadores entendem melhor o que é conteúdo e o que é moldura. E o próximo dev que abrir o arquivo (inclusive você daqui a três meses) lê a estrutura sem decifrar dezenas de `<div>` aninhadas.\n\nO hábito a construir: antes de digitar `<div>`, pergunte se existe uma tag que descreve o que esse bloco É. Use `<div>` só quando a resposta for não, como puro agrupador visual.",
          resources: [
            {
              label: "MDN Semântica",
              url: "https://developer.mozilla.org/pt-BR/docs/Glossary/Semantics",
              kind: "doc",
            },
          ],
        },
        {
          id: "html.forms",
          title: "Formulários e validação",
          description:
            "Campos, labels, envio e a validação nativa que o HTML faz antes de qualquer JavaScript.",
          content:
            'Formulário é o canal de entrada de dados da web: login, busca, cadastro, checkout. Tudo começa com `<form>`, que agrupa os campos e define o que acontece no envio.\n\nO campo básico é o `<input>`, e o atributo `type` muda o comportamento dele: `type="text"` pra texto livre, `type="email"` valida formato de e-mail, `type="password"` esconde a digitação, `type="number"`, `type="date"` e `type="checkbox"` fazem o que os nomes dizem. Texto longo usa `<textarea>`; opções fechadas usam `<select>`.\n\nDois atributos merecem atenção especial. O `name` identifica o dado no envio: campo sem `name` simplesmente não é enviado. E todo campo precisa de um `<label>` conectado por `for` e `id`, como em `<label for="email">E-mail</label>` ligado a `<input id="email">`: além de acessível, o rótulo inteiro vira área clicável.\n\nO envio acontece com `<button type="submit">`. E antes de qualquer JavaScript, o próprio HTML valida: `required` impede envio vazio, `minlength` e `maxlength` controlam tamanho, `min` e `max` limitam números, e o `type` certo já bloqueia formato errado. O navegador exibe as mensagens de erro sozinho.\n\nA validação nativa resolve o básico de graça; a validação com JavaScript, que vem mais adiante na trilha, refina a experiência em cima dela. Comece sempre pela nativa.',
          resources: [
            {
              label: "MDN Formulários",
              url: "https://developer.mozilla.org/pt-BR/docs/Learn/Forms",
              kind: "doc",
            },
          ],
        },
        {
          id: "html.a11y",
          title: "Acessibilidade básica",
          description:
            "Alt, label, headings em ordem e links claros: acessibilidade de graça no HTML básico.",
          content:
            'Acessibilidade é garantir que a página funcione pra todo mundo: quem usa leitor de tela, quem navega só pelo teclado, quem enxerga pouco contraste, quem está num celular fraco sob sol forte. No HTML básico, quatro hábitos cobrem a maior parte do caminho.\n\nPrimeiro: toda imagem com conteúdo precisa de `alt` descritivo. O leitor de tela lê esse texto no lugar da imagem; sem ele, a pessoa ouve só o nome do arquivo. Imagem puramente decorativa leva `alt=""` vazio de propósito, pra ser pulada.\n\nSegundo: todo campo de formulário precisa de `<label>` associado, como você viu no passo anterior. Placeholder não substitui rótulo: ele some assim que a pessoa digita.\n\nTerceiro: hierarquia de títulos correta. Leitores de tela listam os headings como um sumário da página; um `<h4>` solto logo depois de um `<h1>` quebra esse mapa.\n\nQuarto: texto de link que se explica sozinho. Quem navega pulando de link em link ouve cada texto fora de contexto: "clique aqui" não diz nada, "ver a documentação de formulários" diz tudo.\n\nSemântica correta, `alt`, `label` e headings em ordem são acessibilidade de graça, sem uma linha de ARIA. O aprofundamento (ARIA, gestão de foco, navegação por teclado) tem passo próprio na reta final da trilha.',
          resources: [
            {
              label: "web.dev Acessibilidade",
              url: "https://web.dev/learn/accessibility",
              kind: "curso",
            },
          ],
        },
        {
          id: "html.seo",
          title: "SEO básico (meta tags, títulos)",
          description:
            "Title, meta description e estrutura limpa: o mínimo pra buscadores entenderem sua página.",
          optional: true,
          content:
            'SEO é o conjunto de práticas pra buscadores encontrarem, entenderem e ranquearem sua página. O front-end controla a camada técnica básica, e ela mora quase toda no HTML que você acabou de aprender.\n\nO `<title>` é o elemento mais importante: vira o título clicável no resultado da busca e o texto da aba do navegador. Cada página do site deve ter um título único e descritivo, com o assunto principal no começo. Logo abaixo vem a `<meta name="description" content="...">`: o resumo de uma ou duas frases que costuma aparecer como o texto cinza do resultado.\n\nO resto é consequência do que esta seção já ensinou: um único `<h1>` coerente com o assunto, hierarquia de headings limpa, tags semânticas no lugar certo e `alt` nas imagens. O robô do buscador lê a página de um jeito muito parecido com um leitor de tela: estrutura boa pra acessibilidade é estrutura boa pra SEO.\n\nNesta fase, pare por aqui: título único, descrição decente e estrutura semântica já colocam sua página na frente da maioria. O jogo avançado (performance, dados estruturados, estratégia de conteúdo) pertence a outras etapas da trilha e a outras disciplinas.',
          resources: [
            {
              label: "Guia de SEO do Google",
              url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "css",
      title: "CSS básico",
      level: "iniciante",
      description:
        "Aparência e espaçamento: selecionar elementos, entender a caixa e dar vida ao visual.",
      children: [
        {
          id: "css.seletores",
          title: "Seletores e especificidade",
          description:
            "Tipo, classe e id, quem vence os conflitos e por que quase tudo se estiliza com classe.",
          content:
            'Seletor é o endereço de um estilo: a parte da regra CSS que diz **quais** elementos recebem **quais** propriedades. Em `p { color: blue; }`, o `p` é o seletor e pinta todos os parágrafos da página.\n\nOs três fundamentais: o seletor de **tipo** mira a tag (`h1`, `p`, `button`); o de **classe** mira o atributo `class` e se escreve com ponto (`.destaque` pega todo elemento com `class="destaque"`); o de **id** mira o `id` único e usa cerquilha (`#menu`). Combinações simples ampliam a mira: `article p` pega parágrafos dentro de artigos, `.card.ativo` pega quem tem as duas classes, `button:hover` pega o botão sob o mouse.\n\nQuando duas regras disputam o mesmo elemento, vence a mais **específica**: id ganha de classe, classe ganha de tipo. Empatou a especificidade? Vence a que aparece por último no arquivo; essa ordem de desempate é a **cascata** que dá nome ao CSS.\n\nDuas decisões práticas evitam a maioria dos problemas antes de existirem: estilize quase tudo com classes (reutilizáveis, de especificidade baixa e previsível) e evite id pra estilo (específico demais, ganha toda disputa e vira dor de cabeça pra sobrescrever depois).\n\nVocê domina este passo quando bate o olho em duas regras conflitantes e prevê qual vence antes de testar no DevTools.',
          resources: [
            {
              label: "MDN CSS",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS",
              kind: "doc",
            },
            {
              label: "CSS-Tricks",
              url: "https://css-tricks.com",
              kind: "artigo",
            },
          ],
        },
        {
          id: "css.boxmodel",
          title: "Box model e unidades",
          description:
            "As quatro camadas de toda caixa, o border-box como padrão e o critério pra px, rem, % e vh.",
          content:
            "No CSS, todo elemento é uma caixa retangular, e o **box model** descreve as quatro camadas dela, de dentro pra fora: o **content** (o conteúdo em si), o **padding** (o respiro interno entre conteúdo e borda), a **border** (a moldura) e a **margin** (o afastamento pros vizinhos). Inspecione qualquer elemento no DevTools e você vê esse diagrama colorido; ele responde quase toda dúvida de espaçamento.\n\nUma pegadinha histórica: por padrão, `width: 200px` define só o content, e padding e borda crescem pra fora, deixando a caixa final maior que 200px. A correção virou padrão de projeto: `box-sizing: border-box` faz a largura declarada incluir padding e borda. Praticamente todo projeto começa aplicando isso a todos os elementos.\n\nPra dimensionar as caixas, quatro unidades cobrem o dia a dia. `px` é fixo: bom pra bordas finas e detalhes que não devem escalar. `rem` é relativo ao tamanho de fonte raiz da página: a unidade padrão pra fontes e espaçamentos, porque respeita o ajuste de tamanho que o usuário fizer no navegador. `%` é relativo ao elemento pai: útil pra larguras fluidas. `vh` e `vw` são fatias da janela: `100vh` é a altura exata da tela, clássico em seções de abertura.\n\nO critério prático: fonte e espaçamento em `rem`, largura fluida em `%`, altura de tela em `vh`, detalhe fino em `px`. Com isso e `border-box`, o layout para de estourar misteriosamente.",
          resources: [
            {
              label: "web.dev Learn CSS",
              url: "https://web.dev/learn/css",
              kind: "curso",
            },
          ],
        },
        {
          id: "css.posicionamento",
          title: "Posicionamento e z-index",
          description:
            "Static, relative, absolute, fixed e sticky com um caso mental de cada, e o empilhamento com z-index.",
          content:
            "A propriedade `position` define as regras do jogo pra onde cada caixa pode ir. São cinco valores, cada um com um caso mental claro.\n\n`static` é o padrão: o elemento segue o fluxo normal do documento, um depois do outro, e ignora `top`, `left` e afins.\n\n`relative` mantém o elemento no fluxo, mas permite deslocá-lo em relação a onde ele estaria (`top: 8px` o empurra 8px pra baixo). O uso mais importante é outro, silencioso: um pai com `position: relative` vira o ponto de referência pros filhos absolutos.\n\n`absolute` tira o elemento do fluxo (os vizinhos fecham o espaço como se ele não existisse) e o posiciona em relação ao ancestral posicionado mais próximo. Caso mental: o balãozinho vermelho de notificação ancorado no canto do ícone.\n\n`fixed` prega o elemento na janela: ele fica parado enquanto a página rola. Caso mental: o botão de contato flutuando no canto da tela.\n\n`sticky` é o híbrido: rola junto com a página até encostar num limite (`top: 0`) e ali gruda. Caso mental: a barra de menu que fica presa no topo depois que o cabeçalho some.\n\nQuando caixas se sobrepõem, o `z-index` decide quem fica por cima, e ele só funciona em elemento posicionado (qualquer valor exceto `static`). Números maiores vencem; resista ao `z-index: 9999` e mantenha uma escala pequena e intencional.",
          resources: [
            {
              label: "MDN position",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/position",
              kind: "doc",
            },
          ],
        },
        {
          id: "css.animacoes",
          title: "Transições e animações",
          description:
            "Transition pra feedback de hover e focus, transform pra mover sem quebrar layout, keyframes como noção.",
          content:
            "Movimento em CSS começa com uma ideia simples: em vez de uma propriedade saltar de um valor pro outro, ela pode viajar suavemente entre eles. Quem faz essa viagem é a `transition`.\n\nA receita: declare no elemento o que anima e em quanto tempo, como `transition: background-color 0.2s ease`. Depois mude o valor em outro estado, tipo o `:hover`, e o navegador anima a passagem sozinho. O caso de uso central é exatamente esse: **feedback**. Botão que escurece no hover, borda que acende no `:focus` de um campo, card que levanta sob o mouse: microssinais de que a interface está viva e respondendo ao usuário.\n\nPra mover e escalar, prefira `transform`: `translate` desloca, `scale` amplia, `rotate` gira, tudo sem tirar o elemento do fluxo nem empurrar os vizinhos. Animar `margin` ou `width` obriga o navegador a recalcular o layout inteiro a cada quadro e engasga; `transform` e `opacity` são as propriedades baratas de animar.\n\nQuando o movimento precisa de várias etapas ou de repetição, entra o `@keyframes`: você descreve os quadros e aplica com a propriedade `animation`. Por enquanto basta saber que existe; o spinner de carregamento é o exemplo clássico.\n\nComece pequeno: pegue a página que você já tem e adicione transições de hover nos links e botões. Duração entre 0.15s e 0.3s quase sempre acerta; muito mais que isso, a interface parece lenta.",
          resources: [
            {
              label: "MDN transition",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS/transition",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "primeirosite",
      title: "Primeiro site no ar",
      level: "iniciante",
      description:
        "Ainda no básico, publique uma página de verdade: o hábito de entregar começa aqui.",
      children: [
        {
          id: "primeirosite.ambiente",
          title: "Editor e ambiente (VS Code)",
          description:
            "VS Code, Live Server e o ciclo editar, salvar e ver mudar rodando sem fricção.",
          content:
            "Ambiente de desenvolvimento é o seu posto de trabalho: o editor onde o código nasce e os atalhos que tiram fricção do caminho. O padrão da área é o **VS Code**, gratuito, e é ele que a trilha assume daqui pra frente. Baixe no site oficial, instale e pronto: metade do passo está feita.\n\nDentro dele, instale extensões pela aba de Extensions (o ícone de blocos na barra lateral). Três bastam agora: **Live Server**, que abre sua página no navegador e a recarrega sozinha a cada salvamento; **Prettier**, que formata o código automaticamente (ative o formatar ao salvar nas preferências); e o **Portuguese (Brazil) Language Pack**, se preferir a interface em português.\n\nO fluxo que você vai repetir milhares de vezes: crie uma pasta pro projeto (algo como `meu-site`, sem espaços nem acentos, hábito que evita dor de cabeça futura), abra a pasta no VS Code, crie um arquivo `index.html` dentro dela, clique em Go Live no rodapé do editor e veja a página abrir no navegador. Edite qualquer coisa, salve com `Ctrl+S` e observe o navegador recarregar sozinho.\n\nVocê domina este passo quando esse ciclo (editar, salvar, ver mudar) roda sem você pensar nele. É nesse ritmo que o próximo passo constrói uma página inteira.",
          resources: [
            {
              label: "VS Code",
              url: "https://code.visualstudio.com/docs",
              kind: "doc",
            },
          ],
        },
        {
          id: "primeirosite.pagina",
          title: "Montar uma página completa",
          description:
            "Sua página pessoal com o HTML e o CSS vistos até aqui: conteúdo primeiro, estilo depois.",
          content:
            "Chegou a hora de sair dos pedaços soltos e montar uma página completa, de verdade: a sua página pessoal. O desafio é usar SÓ o que a trilha cobriu até aqui, e isso é proposital: você vai descobrir que já sabe o suficiente pra construir algo apresentável.\n\nComece pelo conteúdo, sem nenhum estilo: o esqueleto que você sabe de memória (doctype, `html`, `head`, `body`), um `<header>` com seu nome num `<h1>` e uma frase de apresentação, um `<main>` com uma seção sobre você (dois ou três parágrafos honestos), sua foto com um `alt` decente, uma lista do que você está estudando e um `<footer>` com um link pro seu LinkedIn ou e-mail. Tags semânticas no lugar, headings em ordem.\n\nSó depois de o HTML ficar de pé, crie o `estilo.css`, linke no `<head>` e estilize: uma fonte melhor, cores com bom contraste, `max-width` no conteúdo pra não esticar em tela grande, espaçamento generoso com padding e margin, a foto num tamanho civilizado e uma transição de hover nos links. Nada de framework, nada de copiar template pronto: o valor do exercício está em cada decisão ser sua.\n\nVai ficar simples, e está ótimo assim: essa página evolui junto com você pela trilha inteira. O próximo passo coloca ela no ar, com endereço público pra mandar pra qualquer pessoa.",
        },
        {
          id: "primeirosite.publicar",
          title: "Publicar na web (GitHub Pages)",
          description:
            "Conta no GitHub, upload pela interface e Pages ativado: sua página com URL pública, sem git.",
          content:
            "Um site no ar é só isso: seus arquivos copiados pra um servidor que fica ligado o tempo todo respondendo requisições, como você viu nos fundamentos. Vários serviços fazem essa hospedagem de graça pra sites simples; a trilha usa o **GitHub Pages**, porque o GitHub vai ser sua casa profissional em breve e já vale ir criando intimidade.\n\nO caminho inteiro acontece no navegador, sem instalar nada. Primeiro, crie uma conta gratuita no GitHub com um nome de usuário apresentável (ele aparece na URL do site e, mais tarde, no seu portfólio). Depois, crie um repositório novo pela interface: pense nele, por enquanto, como uma pasta pública pro seu projeto; dê um nome simples como `minha-pagina` e marque como público.\n\nCom o repositório criado, use a opção de upload de arquivos e arraste pra lá o seu `index.html`, o `estilo.css` e a foto, confirmando a operação no botão verde. Por fim, abra as configurações do repositório, ache a seção **Pages**, escolha publicar a partir da branch principal e salve. Em um ou dois minutos o GitHub mostra a URL pública, algo como `seuusuario.github.io/minha-pagina`. Abra, veja sua página e mande o link pra alguém hoje.\n\nExiste um jeito profissional de publicar, com controle de versão e histórico de cada mudança: é o Git, e ele tem seção própria mais à frente na trilha. Por enquanto, celebre: você tem um site na internet.",
          resources: [
            {
              label: "GitHub Pages",
              url: "https://docs.github.com/pt/pages",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "layout",
      title: "Layout e responsividade",
      level: "intermediario",
      description:
        "As ferramentas de layout moderno e a disciplina de funcionar em qualquer tela.",
      children: [
        {
          id: "layout.flexbox",
          title: "Flexbox",
          description:
            "Eixos, container e itens: o modelo que resolve a maioria dos alinhamentos.",
          resources: [
            {
              label: "CSS-Tricks Flexbox",
              url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox",
              kind: "artigo",
            },
          ],
        },
        {
          id: "layout.grid",
          title: "Grid",
          description:
            "Grades de duas dimensões: linhas, colunas, áreas e alinhamento.",
          resources: [
            {
              label: "CSS-Tricks Grid",
              url: "https://css-tricks.com/snippets/css/complete-guide-grid",
              kind: "artigo",
            },
          ],
        },
        {
          id: "layout.responsivo",
          title: "Responsividade (mobile-first)",
          description:
            "Fazer o layout se adaptar de celulares a telas grandes.",
          resources: [
            {
              label: "web.dev Responsive",
              url: "https://web.dev/learn/design",
              kind: "curso",
            },
          ],
        },
        {
          id: "layout.arquitetura",
          title: "Arquitetura de CSS (Sass, BEM)",
          description:
            "Variáveis, reúso e convenção de nomes pra manter o CSS organizado em projetos grandes.",
          optional: true,
          resources: [
            {
              label: "Sass",
              url: "https://sass-lang.com/documentation",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "javascript",
      title: "JavaScript e o DOM",
      level: "intermediario",
      description:
        "A linguagem que dá vida à página, e o DOM, que é onde ela encontra o HTML.",
      children: [
        {
          id: "javascript.tipos",
          title: "Tipos e variáveis",
          description:
            "Os tipos de dados do JavaScript e como guardar valores.",
          resources: [
            {
              label: "JavaScript.info",
              url: "https://javascript.info",
              kind: "curso",
            },
          ],
        },
        {
          id: "javascript.controle",
          title: "Condicionais e laços",
          description: "Tomar decisões e repetir ações no código.",
        },
        {
          id: "javascript.funcoes",
          title: "Funções, escopo e arrow functions",
          description:
            "Empacotar lógica reutilizável, entender onde as variáveis vivem e como o this muda.",
          resources: [
            {
              label: "MDN Functions",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Functions",
              kind: "doc",
            },
          ],
        },
        {
          id: "javascript.arrays",
          title: "Arrays (map, filter, reduce)",
          description: "Transformar e filtrar listas sem laços manuais.",
          resources: [
            {
              label: "MDN Array",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Array",
              kind: "doc",
            },
          ],
        },
        {
          id: "javascript.objetos",
          title: "Objetos, desestruturação e JSON",
          description:
            "Estruturar dados em pares chave-valor, extrair o que precisa e trocar dados com o back.",
        },
        {
          id: "javascript.modulos",
          title: "Módulos (import / export)",
          description: "Quebrar o código em arquivos que se importam.",
        },
        {
          id: "javascript.dom",
          title: "DOM e eventos",
          children: [
            {
              id: "javascript.dom.manipular",
              title: "Manipular elementos",
              description: "Ler e mudar a página pelo JavaScript.",
              resources: [
                {
                  label: "MDN DOM",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/API/Document_Object_Model",
                  kind: "doc",
                },
              ],
            },
            {
              id: "javascript.dom.eventos",
              title: "Eventos e delegação",
              description:
                "Reagir a cliques, teclas e outras ações do usuário.",
            },
            {
              id: "javascript.dom.storage",
              title: "localStorage e sessionStorage",
              description: "Guardar dados no navegador entre visitas.",
              resources: [
                {
                  label: "MDN Web Storage",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/API/Web_Storage_API",
                  kind: "doc",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "ferramentas",
      title: "Git e ferramentas",
      level: "intermediario",
      description:
        "Controle de versão e o ferramental que todo time de front usa no dia a dia.",
      children: [
        {
          id: "ferramentas.git",
          title: "Git e GitHub",
          children: [
            {
              id: "ferramentas.git.basico",
              title: "add, commit, push",
              description: "O ciclo básico de salvar e enviar seu código.",
              resources: [
                {
                  label: "Documentação Git",
                  url: "https://git-scm.com/doc",
                  kind: "doc",
                },
              ],
            },
            {
              id: "ferramentas.git.branches",
              title: "Branches e merge",
              description: "Trabalhar em paralelo e juntar as mudanças.",
            },
            {
              id: "ferramentas.git.pr",
              title: "Pull requests",
              description: "Propor e revisar mudanças antes de integrar.",
            },
          ],
        },
        {
          id: "ferramentas.terminal",
          title: "Terminal básico",
          description:
            "Os comandos essenciais pra se virar na linha de comando.",
        },
        {
          id: "ferramentas.npm",
          title: "Gerenciadores de pacote (npm, pnpm)",
          description: "Instalar e gerenciar as bibliotecas do projeto.",
        },
        {
          id: "ferramentas.bundler",
          title: "Bundler (Vite)",
          description:
            "A ferramenta que junta e serve seu código em dev e produção.",
          resources: [
            { label: "Vite", url: "https://vite.dev/guide", kind: "doc" },
          ],
        },
        {
          id: "ferramentas.lint",
          title: "ESLint e Prettier",
          description:
            "Padronizar e achar problemas no código automaticamente.",
          resources: [
            {
              label: "ESLint",
              url: "https://eslint.org/docs/latest",
              kind: "doc",
            },
            {
              label: "Prettier",
              url: "https://prettier.io/docs/en",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "apis",
      title: "APIs e assincronia",
      level: "intermediario",
      description:
        "Buscar dados de um servidor: promessas, fetch e o que toda API espera de você.",
      children: [
        {
          id: "apis.promises",
          title: "Promises",
          description: "Lidar com operações que terminam no futuro.",
          resources: [
            {
              label: "JavaScript.info Promises",
              url: "https://javascript.info/promise-basics",
              kind: "curso",
            },
          ],
        },
        {
          id: "apis.async",
          title: "async / await e tratamento de erros",
          description:
            "Escrever código assíncrono legível e capturar o que pode dar errado.",
        },
        {
          id: "apis.fetch",
          title: "fetch e consumo de APIs",
          description:
            "Buscar dados de um servidor pela rede, com fetch ou bibliotecas como axios.",
        },
        {
          id: "apis.rest",
          title: "REST e status HTTP",
          description:
            "O padrão mais comum de API e o que cada código de status diz.",
          resources: [
            {
              label: "MDN HTTP Status",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status",
              kind: "doc",
            },
          ],
        },
        {
          id: "apis.estados",
          title: "Estados de loading e erro",
          description: "Mostrar carregamento e falhas pro usuário.",
        },
        {
          id: "apis.cors",
          title: "CORS",
          description:
            "Por que o navegador bloqueia certas requisições e como resolver.",
          resources: [
            {
              label: "MDN CORS",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CORS",
              kind: "doc",
            },
          ],
        },
        {
          id: "apis.auth",
          title: "Autenticação no front (tokens, sessões)",
          description:
            "JWT, cookies de sessão e login via terceiros: o que o front precisa entender.",
        },
        {
          id: "apis.graphql",
          title: "GraphQL",
          description:
            "Uma alternativa ao REST onde o cliente pede exatamente os dados que quer.",
          optional: true,
          resources: [
            { label: "GraphQL", url: "https://graphql.org/learn", kind: "doc" },
          ],
        },
      ],
    },
    {
      id: "react",
      title: "React",
      level: "avancado",
      description: "A biblioteca pra construir interfaces de verdade.",
      children: [
        {
          id: "react.base",
          title: "Base",
          children: [
            {
              id: "react.base.jsx",
              title: "JSX",
              description:
                "A sintaxe que mistura marcação e JavaScript no React.",
              resources: [
                {
                  label: "React Docs",
                  url: "https://react.dev/learn",
                  kind: "doc",
                },
              ],
            },
            {
              id: "react.base.componentes",
              title: "Componentes",
              description: "Os blocos reutilizáveis que montam a interface.",
            },
            {
              id: "react.base.props",
              title: "Props",
              description: "Passar dados de um componente pai pro filho.",
            },
          ],
        },
        {
          id: "react.estado",
          title: "Estado e renderização",
          children: [
            {
              id: "react.estado.usestate",
              title: "useState",
              description:
                "Guardar e atualizar estado dentro de um componente.",
              resources: [
                {
                  label: "React useState",
                  url: "https://react.dev/reference/react/useState",
                  kind: "doc",
                },
              ],
            },
            {
              id: "react.estado.renderizacao",
              title: "Renderização condicional e listas",
              description:
                "Mostrar coisas diferentes conforme o estado e renderizar coleções com keys.",
            },
            {
              id: "react.estado.useeffect",
              title: "useEffect",
              description:
                "Rodar efeitos colaterais, como buscar dados, no ciclo do componente.",
              resources: [
                {
                  label: "React useEffect",
                  url: "https://react.dev/reference/react/useEffect",
                  kind: "doc",
                },
              ],
            },
          ],
        },
        {
          id: "react.hooks",
          title: "Hooks",
          children: [
            {
              id: "react.hooks.usecontext",
              title: "useContext",
              description:
                "Compartilhar dados sem passar props por vários níveis.",
            },
            {
              id: "react.hooks.useref",
              title: "useRef",
              description:
                "Guardar valores ou referenciar elementos sem re-renderizar.",
            },
            {
              id: "react.hooks.usememo",
              title: "useMemo e useCallback",
              description: "Evitar recálculos e re-renders desnecessários.",
            },
            {
              id: "react.hooks.custom",
              title: "Hooks customizados",
              description:
                "Extrair lógica reutilizável pros seus próprios hooks.",
            },
          ],
        },
        {
          id: "react.forms",
          title: "Formulários controlados",
          description: "Ligar os inputs ao estado do React.",
        },
        {
          id: "react.routing",
          title: "Roteamento (React Router)",
          description: "Navegar entre páginas numa SPA.",
        },
        {
          id: "react.fetching",
          title: "Data fetching (TanStack Query)",
          description:
            "Buscar, cachear e sincronizar dados do servidor com menos código.",
          optional: true,
          resources: [
            {
              label: "TanStack Query",
              url: "https://tanstack.com/query/latest",
              kind: "doc",
            },
          ],
        },
        {
          id: "react.estadoglobal",
          title: "Estado global (Context, Redux ou Zustand)",
          description:
            "Compartilhar estado entre partes distantes do app, com ou sem biblioteca.",
          optional: true,
          resources: [
            {
              label: "Redux",
              url: "https://redux.js.org/introduction/getting-started",
              kind: "doc",
            },
          ],
        },
        {
          id: "react.errorboundary",
          title: "Error boundaries",
          description:
            "Capturar erros de renderização sem quebrar o app inteiro.",
          optional: true,
        },
      ],
    },
    {
      id: "qualidade",
      title: "Qualidade profissional",
      level: "avancado",
      description: "O que separa um projeto de estudo de um profissional.",
      children: [
        {
          id: "qualidade.typescript",
          title: "TypeScript no front",
          description:
            "Adicionar tipos ao JavaScript pra pegar erros antes de rodar.",
          resources: [
            {
              label: "TypeScript",
              url: "https://www.typescriptlang.org/docs",
              kind: "doc",
            },
          ],
        },
        {
          id: "qualidade.estilo",
          title: "Estilização em escala (Tailwind, CSS Modules)",
          description: "Manter o CSS organizado conforme o projeto cresce.",
          resources: [
            {
              label: "Tailwind CSS",
              url: "https://tailwindcss.com/docs",
              kind: "doc",
            },
          ],
        },
        {
          id: "qualidade.testes",
          title: "Testes",
          children: [
            {
              id: "qualidade.testes.unit",
              title: "Unitários (Vitest, Testing Library)",
              description: "Testar pedaços do código de forma automática.",
              resources: [
                {
                  label: "Testing Library",
                  url: "https://testing-library.com/docs",
                  kind: "doc",
                },
              ],
            },
            {
              id: "qualidade.testes.e2e",
              title: "End-to-end (Playwright)",
              description: "Testar o app inteiro como um usuário usaria.",
              optional: true,
              resources: [
                {
                  label: "Playwright",
                  url: "https://playwright.dev/docs/intro",
                  kind: "doc",
                },
              ],
            },
          ],
        },
        {
          id: "qualidade.performance",
          title: "Performance (Core Web Vitals, Lighthouse)",
          description: "Medir e melhorar a velocidade percebida da página.",
          resources: [
            {
              label: "web.dev Vitals",
              url: "https://web.dev/explore/learn-core-web-vitals",
              kind: "curso",
            },
          ],
        },
        {
          id: "qualidade.seguranca",
          title: "Segurança (XSS, CSRF, CSP)",
          description: "As ameaças comuns do front e como se proteger.",
          resources: [
            {
              label: "OWASP",
              url: "https://owasp.org/www-project-top-ten",
              kind: "doc",
            },
          ],
        },
        {
          id: "qualidade.a11y",
          title: "Acessibilidade avançada (ARIA, teclado, leitor de tela)",
          description:
            "Ir além do básico pra uma experiência inclusiva de verdade.",
          optional: true,
        },
      ],
    },
    {
      id: "projeto",
      title: "Projeto e deploy",
      level: "avancado",
      description: "Juntar tudo e publicar.",
      children: [
        {
          id: "projeto.planejar",
          title: "Planejar um projeto real",
          description: "Definir escopo e estrutura antes de codar.",
        },
        {
          id: "projeto.construir",
          title: "Construir aplicando tudo",
          description:
            "Juntar o que você aprendeu num projeto de ponta a ponta.",
        },
        {
          id: "projeto.env",
          title: "Variáveis de ambiente (.env)",
          description: "Guardar configs e segredos fora do código.",
        },
        {
          id: "projeto.readme",
          title: "Documentar (README)",
          description:
            "Explicar seu projeto pra quem chega depois, inclusive você.",
        },
        {
          id: "projeto.deploy",
          title: "Deploy",
          description: "Colocar seu projeto no ar pra qualquer um acessar.",
          resources: [
            { label: "Vercel", url: "https://vercel.com/docs", kind: "doc" },
            { label: "Netlify", url: "https://docs.netlify.com", kind: "doc" },
          ],
        },
        {
          id: "projeto.ssr",
          title: "SSR e SSG (conceito, Next.js)",
          description: "Renderizar no servidor pra ganhar performance e SEO.",
          optional: true,
          resources: [
            { label: "Next.js", url: "https://nextjs.org/docs", kind: "doc" },
          ],
        },
        {
          id: "projeto.ci",
          title: "CI básico",
          description: "Automatizar testes e build a cada mudança.",
          optional: true,
        },
      ],
    },
  ],
};
