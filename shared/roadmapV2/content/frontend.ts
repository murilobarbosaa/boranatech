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
            "Eixos, justify-content, align-items, gap e as três receitas que resolvem 90% dos alinhamentos.",
          content:
            "Flexbox é o sistema de layout unidimensional do CSS: você liga no elemento pai com `display: flex` e ele passa a distribuir os **filhos diretos** ao longo de uma linha ou coluna. A maior parte do alinhamento que atormentava gerações de devs virou duas ou três propriedades.\n\nO modelo mental: todo container flex tem um **eixo principal** (horizontal por padrão, controlado por `flex-direction`) e um **eixo cruzado**, perpendicular a ele. As duas propriedades mestras alinham nesses eixos: `justify-content` distribui os itens no eixo principal (`center`, `space-between`, `flex-end`) e `align-items` alinha no eixo cruzado (`center`, `stretch`). O `gap` define o respiro entre os itens sem depender de margin.\n\nNos filhos, três propriedades decidem como cada um cresce e encolhe: `flex-grow`, `flex-shrink` e `flex-basis`, quase sempre resumidas no atalho `flex: 1` (todos crescem por igual) ou simplesmente deixadas no padrão.\n\nTrês receitas resolvem 90% do dia a dia. Barra de navegação com logo de um lado e links do outro: `display: flex` com `justify-content: space-between` e `align-items: center`. Centralizar qualquer coisa perfeitamente: `justify-content: center` com `align-items: center` no pai. Fileira de cards que quebra de linha: `flex-wrap: wrap` com `gap`.\n\nVocê domina este passo quando monta as três receitas de memória e, diante de qualquer alinhamento, sabe dizer qual eixo está em jogo.",
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
            "Layout bidimensional com colunas em fr e a receita de grade responsiva sem media query.",
          content:
            "Grid é o layout bidimensional do CSS: enquanto o Flexbox pensa numa fila (uma dimensão de cada vez), o Grid pensa numa tabela, linhas E colunas juntas. O critério de escolha é esse: fileira de itens, Flexbox; grade onde linhas e colunas precisam se alinhar entre si, Grid.\n\nLiga-se com `display: grid` no pai e desenham-se as colunas com `grid-template-columns`. A unidade nova é o `fr`, a fração do espaço livre: `grid-template-columns: 1fr 1fr 1fr` cria três colunas iguais; `2fr 1fr` faz a primeira ter o dobro da segunda. O `gap` funciona como no Flexbox, espaçando linhas e colunas de uma vez.\n\nA receita de ouro da grade responsiva sem nenhuma media query: `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))`. Lendo por partes: cada coluna tem no mínimo 250px e no máximo uma fração igual do espaço (`minmax`), e o navegador encaixa quantas colunas couberem na largura disponível (`repeat` com `auto-fit`). A tela estreitou? As colunas quebram sozinhas pra linha de baixo. É a solução padrão pra galeria de cards.\n\nGrid tem bem mais (áreas nomeadas, posicionamento explícito de itens), mas colunas, `fr`, `gap` e a receita responsiva cobrem a larga maioria do que você vai construir. Monte uma galeria com a receita hoje e redimensione a janela pra ver funcionando.",
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
            "Mobile-first, media queries, breakpoints pelo conteúdo e imagens que nunca estouram.",
          content:
            "Responsividade é o compromisso de a página funcionar de um celular de 360px a um monitor de 1440px. Mobile-first é a estratégia que torna isso administrável: escreva o CSS base pra tela pequena e adicione ajustes conforme a tela CRESCE, nunca o contrário.\n\nA ferramenta dos ajustes é a **media query**, e o empilhamento mobile-first tem essa cara:\n\n```css\n.galeria { grid-template-columns: 1fr; }\n\n@media (min-width: 768px) {\n  .galeria { grid-template-columns: 1fr 1fr; }\n}\n```\n\nA base vale pro celular; o bloco de `min-width` só entra quando a janela tem pelo menos 768px. Telas maiores, mais blocos progressivos.\n\nE onde ficam os cortes? **Breakpoints se escolhem pelo conteúdo, não por dispositivo.** Estique a janela devagar: no ponto em que o layout começa a ficar estranho (linha de texto longa demais, espaço sobrando), ali nasce um breakpoint. Perseguir medidas de aparelhos específicos é enxugar gelo; aparelhos mudam todo ano.\n\nDuas práticas completam o kit. As unidades relativas que você viu no box model (`rem`, `%`, `vh`) fazem o layout esticar sozinho entre um breakpoint e outro, diminuindo quantos você precisa. E toda imagem leva `max-width: 100%`: ela encolhe junto com o container e nunca estoura pro lado.\n\nVocê domina este passo quando abre o modo responsivo do DevTools, arrasta a largura de 360px a 1200px e a sua página não quebra em nenhum ponto do caminho.",
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
            "Por que CSS degrada em projeto grande, e as disciplinas (BEM, Sass) que o fazem envelhecer bem.",
          optional: true,
          content:
            "Em página pequena, CSS se comporta. Em projeto grande, ele degrada de um jeito previsível: a especificidade vai subindo (uma regra precisa ganhar da outra, alguém apela pro id, outro apela pro `!important`), ninguém sabe mais o que cada classe afeta e bate o medo de deletar qualquer linha. Arquitetura de CSS é o conjunto de disciplinas pra ele envelhecer bem.\n\nA disciplina mais barata é uma convenção de nomes. O **BEM** (bloco, elemento, modificador) nomeia as classes como `card`, `card__titulo` e `card--destaque`: lendo o nome você sabe a que bloco a classe pertence e o que ela modifica, e a especificidade fica plana, porque tudo é uma classe só. Parece burocracia numa página pessoal; num time, é o que evita o CSS de ninguém, aquele que todos temem tocar.\n\nO **Sass** ataca por outro lado: é um pré-processador, um CSS com superpoderes (variáveis, aninhamento, funções) que compila pra CSS comum antes de chegar ao navegador.\n\nE existe uma terceira via que virou dominante no mercado: frameworks de utilidades, como o Tailwind, trocam a invenção de nomes por classes minúsculas prontas, resolvendo o mesmo problema por outro ângulo. Você vai encontrá-los mais à frente; conhecer BEM e Sass te faz entender exatamente qual dor eles vieram curar.",
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
            "Const e let, tipos primitivos, template literals e por que comparar sempre com ===.",
          content:
            'Variável é uma caixinha com nome onde o programa guarda um valor pra usar depois. No JavaScript moderno você declara com `const` (valor que não será reatribuído, o seu padrão) e `let` (valor que muda, como um contador). Existe também o `var`, o jeito antigo com regras de escopo traiçoeiras: você vai vê-lo em código velho, não escreva em código novo.\n\nOs valores têm **tipos**. Os primitivos do dia a dia: `string` (texto entre aspas), `number` (inteiro e decimal são o mesmo tipo), `boolean` (`true` ou `false`), mais `null` (ausência intencional de valor) e `undefined` (ainda sem valor). No Console, `typeof valor` revela o tipo de qualquer coisa.\n\nPra montar textos, os **template literals** substituem a colagem com `+`: entre crases, `Olá, ${nome}!` interpola qualquer expressão dentro do `${}`. Mais legível, menos propenso a erro.\n\nA armadilha clássica do começo é a **coerção**: o JavaScript converte tipos sozinho quando acha que deve, e `"5" + 1` vira `"51"` enquanto `"5" - 1` vira `4`. Por isso a comparação `==` engana: ela converte antes de comparar, e `"5" == 5` dá `true`. Regra sem exceção nesta trilha: compare com `===` e `!==`, que exigem tipo e valor iguais.\n\nAbra o Console do DevTools e teste cada exemplo acima: ele é o seu laboratório de JavaScript daqui em diante.',
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
          description:
            "If, operadores lógicos, os três loops e o early return como hábito de legibilidade.",
          content:
            "Controle de fluxo é o que transforma uma lista de instruções em programa de verdade: decidir e repetir.\n\nA decisão é o `if`: `if (idade >= 18) { ... } else { ... }` executa um bloco ou o outro conforme a condição. Condições se combinam com os operadores lógicos `&&` (e), `||` (ou) e `!` (não): `if (logado && !bloqueado)` lê exatamente como a frase que descreve.\n\nA repetição tem três formas principais. O `for` clássico conta: `for (let i = 0; i < 10; i++)`. O `while` repete enquanto a condição valer, útil quando não se sabe de antemão quantas voltas. E o `for...of` percorre uma coleção item a item: `for (const item of carrinho)` lê muito melhor do que gerenciar índice na mão, e vai ser o seu loop do dia a dia até os métodos de array assumirem boa parte do trabalho daqui a dois passos.\n\nUm hábito de legibilidade pra adotar desde já: o **early return**. Em vez de aninhar `if` dentro de `if`, trate os casos de saída primeiro e encerre cedo; o caminho principal fica reto, sem indentação profunda. Você ainda não escreveu funções (é o próximo passo), mas guarde o princípio: exceções primeiro, fluxo principal limpo.\n\nVocê domina este passo quando lê uma condição composta em voz alta e o programa faz exatamente o que você narrou.",
        },
        {
          id: "javascript.funcoes",
          title: "Funções, escopo e arrow functions",
          description:
            "Parâmetros, retorno, escopo, função como valor e arrow functions com a noção de this.",
          content:
            "Função é um bloco de código com nome que você define uma vez e executa quantas vezes quiser: a unidade básica de organização de qualquer programa. Ela recebe **parâmetros**, faz o trabalho e devolve um resultado com `return`: definida `function somar(a, b) { return a + b; }`, a expressão `somar(2, 3)` vale `5` em qualquer lugar do código.\n\nO que separa o JavaScript de muitas linguagens: função é **valor**. Dá pra guardar numa variável, passar como argumento e devolver de outra função. É isso que os métodos de array do próximo passo exploram: `numeros.map(dobrar)` entrega a função `dobrar` pro `map` aplicar em cada item.\n\nCada função cria um **escopo**: variáveis declaradas dentro só existem dentro. De dentro se enxerga o lado de fora; de fora, nunca o lado de dentro. Esse cerco é o que deixa duas funções usarem nomes iguais sem conflito.\n\nA **arrow function** é a sintaxe enxuta pra função como valor. As duas formas abaixo são equivalentes:\n\n```js\nfunction dobrar(n) {\n  return n * 2;\n}\n\nconst dobrarArrow = (n) => n * 2;\n```\n\nSem chaves, a arrow retorna a expressão direto, e em callbacks curtos ela reina: `numeros.map((n) => n * 2)`. Uma diferença real além da sintaxe: a arrow não tem `this` próprio, herda o do lugar onde foi escrita. Se um `this` se comportar estranho um dia, lembre desta diferença e aprofunde na hora.\n\nVocê domina este passo quando passa uma função pra outra sem executá-la por engano (passar `dobrar`, não `dobrar()`).",
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
          description:
            "Map, filter e reduce, buscas com find e includes, e o modelo mental de não mutar o original.",
          content:
            'Array é a lista do JavaScript: `const frutas = ["uva", "kiwi", "manga"]`, acesso por índice a partir do zero (`frutas[0]`), tamanho em `frutas.length`. O poder real está nos métodos, e eles se dividem em famílias.\n\nOs **transformadores** criam um array novo a partir do original. O `map` aplica uma função a cada item: `const dobros = numeros.map((n) => n * 2)`. O `filter` mantém só o que passa no teste: `const pares = numeros.filter((n) => n % 2 === 0)`. O `reduce` resume a lista inteira num valor só (a soma, o maior, um agrupamento); é o mais poderoso e o mais difícil de ler, então por enquanto basta a noção de que existe pra esse fim.\n\nOs **buscadores** respondem perguntas: `find` devolve o primeiro item que passa no teste, `includes` diz se um valor está lá.\n\nO **iterador** `forEach` executa algo pra cada item sem produzir array novo, primo do `for...of` que você já usa.\n\nO modelo mental central da família: **mutação versus array novo**. `map` e `filter` não tocam no original, devolvem outro array; esse estilo de transformar sem alterar é exatamente o que o React vai exigir mais à frente. Métodos como `push` e `sort` alteram o próprio array; use com consciência do efeito.\n\nVocê domina este passo quando resolve com `map` e `filter` o que antes escreveria com um `for` e um array auxiliar.',
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
            "Chave-valor, desestruturação, spread e o par JSON.stringify e parse pra trocar dados.",
          content:
            'Objeto é a estrutura de dados central do JavaScript: pares de chave e valor descrevendo uma coisa só. `const usuario = { nome: "Bia", idade: 23 }` agrupa num único valor tudo que descreve a usuária.\n\nO acesso tem duas formas: o ponto, `usuario.nome`, pro caso comum; e o colchete, `usuario["nome"]`, pra quando a chave vem numa variável ou tem caracteres especiais.\n\nA **desestruturação** extrai valores direto pra variáveis: `const { nome, idade } = usuario` cria as duas de uma vez. Funciona com arrays (`const [primeiro] = lista`) e em parâmetros de função, e você vai vê-la em praticamente todo código React.\n\nO **spread** (`...`) espalha um objeto dentro de outro: `const atualizado = { ...usuario, idade: 24 }` cria uma cópia com um campo trocado, sem tocar no original. O mesmo espírito do `map` e do `filter` do passo anterior, agora pra objetos.\n\nE o **JSON**? É o formato de texto que o front e o back usam pra trocar dados, com cara de objeto JavaScript (chaves entre aspas duplas, sem funções). A conversão é um par: `JSON.stringify(objeto)` transforma objeto em texto pra enviar ou guardar; `JSON.parse(texto)` faz a volta. Esse par reaparece no armazenamento local e nas APIs, logo adiante.\n\nVocê domina este passo quando modela algo do mundo real (um produto, um perfil) como objeto e o converte pra JSON e de volta sem surpresas.',
          resources: [
            {
              label: "MDN JSON",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/JSON",
              kind: "doc",
            },
          ],
        },
        {
          id: "javascript.modulos",
          title: "Módulos (import / export)",
          description:
            "Import, export, named vs default e o type=module que liga tudo no navegador.",
          content:
            'Módulo é um arquivo de JavaScript que declara o que oferece (`export`) e o que precisa (`import`). É a resposta pra pergunta que todo projeto encontra ao crescer: como dividir mil linhas em arquivos pequenos sem virar uma bagunça de variáveis globais se atropelando.\n\nA mecânica: um arquivo `matematica.js` exporta com `export function somar(a, b) { ... }`; outro arquivo consome com `import { somar } from "./matematica.js"`. Cada módulo tem escopo próprio (o cerco das funções, agora no nível do arquivo inteiro): o que não for exportado é invisível pra fora.\n\nExistem dois estilos de export. O **named** permite vários por arquivo e o import usa chaves com o nome exato. O **default** é um por arquivo, importado sem chaves e com o nome que você quiser. Critério prático desta trilha: prefira named exports (o editor autocompleta e renomear é seguro) e reserve o default pra quando o arquivo É uma coisa só, como um componente React será mais à frente.\n\nNo navegador, módulos ligam com `<script type="module" src="app.js">` no HTML: sem esse atributo, `import` e `export` nem funcionam. As ferramentas da próxima seção, como o Vite, já assumem esse mundo de módulos como padrão e cuidam do resto pra você.',
          resources: [
            {
              label: "MDN Módulos",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Modules",
              kind: "doc",
            },
          ],
        },
        {
          id: "javascript.dom",
          title: "DOM e eventos",
          children: [
            {
              id: "javascript.dom.manipular",
              title: "Manipular elementos",
              description:
                "querySelector, textContent, classList e criar elementos: a página viva nas mãos do JS.",
              content:
                'Lembra de como o navegador renderiza? Ele lê o seu HTML e monta o DOM, a árvore viva da página. Pois o JavaScript tem acesso total a essa árvore: ler, alterar, criar e remover qualquer elemento, a qualquer momento, sem recarregar nada. Manipular o DOM é isso: editar a página em plena execução.\n\nO ponto de partida é achar o elemento: `document.querySelector(".titulo")` devolve o primeiro que casa com o seletor (a mesma sintaxe de seletores CSS que você já domina); `querySelectorAll` devolve todos.\n\nCom o elemento na mão: `el.textContent = "Novo texto"` troca o texto; `el.setAttribute("src", "outra.jpg")` mexe nos atributos; e o `classList` gerencia classes com `add`, `remove` e `toggle`, que é a forma padrão de mudar aparência (a classe carrega o estilo no CSS, o JavaScript só liga e desliga).\n\nCriar também é direto: `document.createElement("li")` fabrica o elemento, você preenche o conteúdo e pendura na árvore com `pai.append(el)`. É assim que uma lista de tarefas ganha itens novos na tela.\n\nO exercício que consolida: na sua página pessoal, adicione um botão que alterna o tema chamando `document.body.classList.toggle("escuro")`, com a classe `escuro` definida no seu CSS. Uma linha de JavaScript e a página reage. Falta o clique de verdade: eventos, no próximo passo.',
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
                "addEventListener, o objeto de evento, preventDefault no formulário e a noção de delegação.",
              content:
                'Evento é qualquer coisa que acontece na página: clique, tecla, envio de formulário, rolagem. O DOM anuncia esses acontecimentos, e o JavaScript escuta com `addEventListener`: `botao.addEventListener("click", aoClicar)` registra a função `aoClicar` pra rodar a cada clique. Repare que a função é passada como valor, sem parênteses: quem a executa é o navegador, na hora certa.\n\nA função ouvinte recebe um **objeto de evento** cheio de contexto: `event.target` é o elemento onde o evento aconteceu, `event.key` diz a tecla pressionada, e por aí vai.\n\nO caso central do começo é o formulário. Por padrão, enviar um `<form>` recarrega a página inteira (o comportamento clássico da web). Numa aplicação, você intercepta:\n\n```js\nform.addEventListener("submit", (event) => {\n  event.preventDefault();\n  // daqui em diante, quem decide é o seu código\n});\n```\n\nEsse padrão (escutar, prevenir o comportamento padrão, tratar) vai se repetir em toda aplicação que você construir.\n\nUma técnica pra guardar como noção: **delegação**. Em vez de um ouvinte por item de uma lista longa (ou de itens que ainda nem existem), registra-se um só no pai e usa-se `event.target` pra descobrir qual filho originou o evento. Menos ouvintes, e itens criados depois já nascem cobertos.\n\nVocê domina este passo quando o seu formulário valida e responde na tela sem recarregar a página.',
              resources: [
                {
                  label: "MDN addEventListener",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/API/EventTarget/addEventListener",
                  kind: "doc",
                },
              ],
            },
            {
              id: "javascript.dom.storage",
              title: "localStorage e sessionStorage",
              description:
                "localStorage e sessionStorage, o limite de string com JSON e o tema salvo entre visitas.",
              content:
                'O localStorage é a gaveta persistente do navegador: pares de chave e valor que sobrevivem ao fechamento da aba, do navegador e ao desligar do computador. O sessionStorage é a gaveta irmã de vida curta: dura só enquanto aquela aba existir. O critério: preferência que deve ser lembrada amanhã, `localStorage`; estado descartável daquela visita, `sessionStorage`.\n\nA API é minúscula: `localStorage.setItem("tema", "escuro")` guarda, `localStorage.getItem("tema")` lê (e devolve `null` se não existir), `removeItem` apaga.\n\nO detalhe que pega todo mundo: as gavetas só guardam **string**. Objeto entra e sai pelo par que você conheceu no passo de objetos: `setItem("config", JSON.stringify(config))` na ida, `JSON.parse(getItem("config"))` na volta.\n\nO exemplo mental completo é o tema escuro da sua página: o botão que você criou no passo de manipulação alterna a classe e grava a escolha com `setItem`; no início do script, ao carregar a página, um `getItem` reaplica o tema salvo. A página passa a lembrar do usuário entre visitas, tudo no navegador, sem servidor nenhum.\n\nE esse é justamente o limite da gaveta: ela só conhece o que o SEU código guardou nela. Buscar dados do mundo lá fora, de um servidor de verdade, é o próximo salto da trilha: a seção de APIs e assincronia.',
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
              description:
                "O problema que o Git resolve e o ciclo status, add e commit com mensagem que explica o porquê.",
              content:
                'O Git resolve o problema que todo projeto encontra: e se eu quebrar tudo? Ele guarda o histórico do seu código em fotografias chamadas **commits**; cada uma é um ponto de restauração pro qual dá pra voltar. É o ctrl+z do projeto inteiro, com a vantagem de nunca esquecer nada.\n\nLá em Primeiro site no ar ficou prometido o jeito profissional de publicar: é este. O upload manual se aposenta aqui; de agora em diante, seus projetos vivem com histórico.\n\nA configuração é uma vez por projeto: `git init` dentro da pasta a transforma num repositório. Daí em diante, o ciclo do dia a dia tem três batidas:\n\n```bash\ngit status\ngit add .\ngit commit -m "adiciona seção de contato"\n```\n\nO `git status` é a bússola: mostra o que mudou desde a última fotografia, e rode sem medo, ele nunca altera nada. O `git add` coloca as mudanças na **área de preparo**, o rascunho da próxima fotografia (o ponto adiciona tudo; dá pra escolher arquivo a arquivo). O `git commit` tira a fotografia com uma mensagem curta, e a boa mensagem explica o PORQUÊ da mudança, não o óbvio que o código já mostra.\n\nVocê domina este passo quando o ciclo status, add e commit vira reflexo ao fim de cada sessão de trabalho.',
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
              description:
                "Linhas do tempo paralelas com switch e merge, e o conflito como decisão normal, não catástrofe.",
              content:
                "Branch é uma linha do tempo paralela do seu projeto: você cria uma, experimenta à vontade nela, e a linha principal (a `main`) continua intacta. É o que permite tentar uma ideia arriscada sem medo e, em time, é o que permite dez pessoas trabalharem sem se atropelar.\n\nA mecânica: `git switch -c ajuste-menu` cria a branch e já muda pra ela (o `-c` é de criar); `git switch main` volta pra principal. Cada commit feito na branch fica só nela. Terminou e gostou? De volta à `main`, `git merge ajuste-menu` traz as mudanças pra linha principal.\n\nE quando as duas linhas mexeram no MESMO trecho do mesmo arquivo, acontece o **conflito**. A palavra assusta; a realidade é mansa. O Git não escolhe por você: ele marca o trecho disputado no arquivo com as duas versões, você abre, decide o que fica (uma, outra ou uma mistura), apaga as marcações e commita. Conflito não é catástrofe nem erro seu: é o Git sendo honesto sobre uma decisão que só um humano pode tomar.\n\nVocê domina este passo quando cria uma branch pra cada experimento e resolve um conflito simples sem pânico.",
              resources: [
                {
                  label: "Pro Git (livro oficial, em português)",
                  url: "https://git-scm.com/book/pt-br/v2",
                  kind: "doc",
                },
              ],
            },
            {
              id: "ferramentas.git.pr",
              title: "Pull requests",
              description:
                "Push pro GitHub, o PR como conversa sobre código e o critério entre fork e branch.",
              content:
                "Até aqui o Git trabalhou só na sua máquina. O `git push` sobe seus commits pro GitHub (o repositório remoto, que o Git conhece pelo apelido `origin`), e o `git pull` traz o que mudou por lá. Com isso, aquele upload por arrastar e soltar do começo da trilha se aposenta de vez: publicar vira commitar e dar push.\n\nO **pull request** (PR) é o ritual que nasce daí: em vez de mandar sua branch direto pra `main`, você abre no GitHub um pedido pra integrá-la. O PR mostra o diff completo do que muda e abre um espaço de conversa: comentários linha a linha, sugestões, ajustes, aprovação. É assim que times revisam código antes de ele entrar, e é assim que se aprende de verdade: **review não é tribunal, é a cultura de olhar o trabalho junto**.\n\nFork ou branch? Critério prático: no projeto em que você tem acesso de escrita (o seu, o do seu time), crie branches. No projeto dos outros (uma biblioteca open source, por exemplo), você primeiro faz um **fork**, a sua cópia inteira do repositório, trabalha nela e abre o PR do fork pro projeto original. É exatamente assim que acontece uma primeira contribuição open source, e ela conta muito num portfólio iniciante.",
              resources: [
                {
                  label: "GitHub Docs: Pull requests",
                  url: "https://docs.github.com/pt/pull-requests",
                  kind: "doc",
                },
              ],
            },
          ],
        },
        {
          id: "ferramentas.terminal",
          title: "Terminal básico",
          description:
            "O shell sem medo: navegar com pwd, ls e cd, organizar com mkdir e mv, e ler o erro sempre.",
          content:
            "O terminal (ou shell) é o jeito de dar ordens ao computador por texto: você digita um comando, ele executa e responde. Parece arcaico perto de janelas e cliques, mas é ferramenta diária de quem desenvolve: rápida, precisa e igual em qualquer servidor. O Git do próximo passo, o npm e o Vite logo adiante: todos vivem aqui.\n\nO medo some com meia dúzia de comandos. Os de orientação: `pwd` mostra em que pasta você está, `ls` lista o que tem nela, `cd` entra numa pasta (e `cd ..` volta uma). Os de organização: `mkdir` cria pasta, `cp` copia, `mv` move ou renomeia. Uma sessão típica:\n\n```bash\npwd\nls\ncd meu-site\nmkdir imagens\n```\n\nDois hábitos aceleram tudo: a tecla Tab autocompleta nomes (digite `cd me` e aperte Tab) e a seta pra cima repete comandos anteriores.\n\nE o hábito mais importante da carreira inteira nasce aqui: **ler a mensagem de erro**. Um `command not found` diz que o programa não existe ou não está instalado; um `no such file or directory` diz que o caminho está errado. O terminal sempre explica o que houve; quem lê, resolve.\n\nAbra o terminal integrado do VS Code (menu Terminal) e refaça a sessão acima na sua pasta de projetos.",
          resources: [
            {
              label: "Ubuntu: linha de comando pra iniciantes",
              url: "https://ubuntu.com/tutorials/command-line-for-beginners",
              kind: "artigo",
            },
          ],
        },
        {
          id: "ferramentas.npm",
          title: "Gerenciadores de pacote (npm, pnpm)",
          description:
            "package.json como identidade do projeto, node_modules fora do Git e scripts como atalhos.",
          content:
            'Nenhum projeto real se escreve sozinho: você vai usar bibliotecas, código pronto de terceiros. O npm é o gerenciador desses pacotes no mundo JavaScript, e o `package.json` é a identidade do projeto: nome, versão, a lista de dependências e os scripts. É o primeiro arquivo que um dev abre pra entender um projeto desconhecido.\n\n`npm install nome-do-pacote` baixa a biblioteca e a registra no `package.json`. Os arquivos baixados vão pra pasta `node_modules`, que engorda rápido e **nunca vai pro Git**: qualquer pessoa que clonar o projeto roda `npm install` e a reconstrói inteira a partir do `package.json`. É por isso que ela mora no `.gitignore`.\n\nOs **scripts** são atalhos com nome: um `"dev": "vite"` no `package.json` permite rodar `npm run dev` em vez de decorar o comando real. Todo projeto que você pegar terá seus scripts; olhe-os primeiro.\n\nE o `package-lock.json`? Uma frase honesta: ele congela as versões exatas instaladas pra todo mundo ter o mesmo ambiente; vai pro Git e você não o edita na mão.\n\nO bundler do próximo passo chega justamente por aqui: um `npm create` e o projeto nasce montado.',
          resources: [
            {
              label: "Documentação npm",
              url: "https://docs.npmjs.com",
              kind: "doc",
            },
          ],
        },
        {
          id: "ferramentas.bundler",
          title: "Bundler (Vite)",
          description:
            "Por que o navegador não roda seu projeto cru, e o Vite como dev server e build da trilha.",
          content:
            "O navegador entende HTML, CSS e JavaScript, mas não entende um PROJETO: dezenas de módulos se importando, TypeScript, imagens pra otimizar, código pra minificar. O bundler é a ferramenta que fica entre o seu código e o navegador, resolvendo essa distância nos dois momentos da vida do projeto.\n\nEm desenvolvimento, ele é o **dev server**: serve a página localmente e atualiza o navegador a cada salvamento (o Live Server que você usou, em versão profissional). Na hora de publicar, ele faz o **build**: junta os módulos, descarta o que não é usado, minifica e entrega uma pasta `dist` pronta pra produção.\n\nO padrão desta trilha é o **Vite**, o mais usado no ecossistema atual e famoso pela velocidade: o dev server abre em milissegundos. O portão de entrada é um comando só: `npm create vite@latest meu-app` pergunta nome e template e monta o projeto inteiro configurado. Guarde esse comando: é exatamente ele que a seção de React vai usar pra criar o seu primeiro app.\n\nUma frase de história pra você não boiar em vaga antiga: o **webpack** dominou a era anterior dos bundlers (e o esbuild trabalha por baixo de várias ferramentas atuais); os nomes mudam, o conceito é o mesmo.\n\nRode o `npm create vite@latest` hoje, escolha o template vanilla e explore o que ele gerou.",
          resources: [
            { label: "Vite", url: "https://vite.dev/guide", kind: "doc" },
          ],
        },
        {
          id: "ferramentas.lint",
          title: "ESLint e Prettier",
          description:
            "Prettier cuida da forma, ESLint da qualidade: format on save e erro pego antes de rodar.",
          content:
            "Duas ferramentas cuidam do seu código por ângulos diferentes, e a distinção importa: o **Prettier** cuida da FORMA (indentação, aspas, quebras de linha) e o **ESLint** cuida da QUALIDADE (variável nunca usada, comparação suspeita, import quebrado).\n\nO Prettier é inegociável e libertador: com o formatar ao salvar ligado no VS Code (você ativou lá no ambiente), o código se arruma sozinho a cada `Ctrl+S`, e a discussão de estilo simplesmente deixa de existir. Ninguém gasta review debatendo vírgula: a máquina decide, todo mundo aceita, o diff fica limpo.\n\nO ESLint é o par de olhos que nunca cansa: analisa o código parado (sem executar nada) e sublinha o que cheira a erro antes de você rodar qualquer coisa. Um `const nome` declarado e nunca usado? Sublinhado. Um `if (x = 5)` onde você queria `===`? Sublinhado. Boa parte dos bugs de digitação morre ainda no editor.\n\nNos projetos criados com Vite, os dois chegam quase de graça nos templates. O hábito que fica é o mesmo do terminal: sublinhou, leia; a mensagem do lint sempre diz o que é e onde está.",
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
          description:
            "O recibo de valor futuro: os três estados e o encadeamento com then e catch.",
          content:
            "Até aqui, todo código seu foi **síncrono**: uma linha termina, a próxima roda. Buscar dados pela rede quebra esse conforto: uma requisição leva 50 milissegundos ou 5 segundos, e o navegador não pode congelar a página esperando. O JavaScript resolve com um contrato: a operação demorada devolve na hora uma **Promise**, um recibo de valor futuro.\n\nO recibo tem três estados: **pending** (a operação ainda rodando), **fulfilled** (deu certo, o valor chegou) e **rejected** (falhou, com um erro explicando). E ele só muda de estado uma vez: ou cumpre, ou rejeita.\n\nO que se faz com um recibo? Registra-se o que deve acontecer quando ele resolver: `promessa.then(usarOValor)` agenda uma função pro sucesso, e `promessa.catch(tratarErro)` agenda o plano B da falha. Como o `then` devolve outra promise, dá pra encadear etapas (busca, depois transforma, depois exibe), com um único `catch` no fim cobrindo a corrente inteira.\n\nPor que aprender a mecânica se o próximo passo traz uma sintaxe mais confortável? Porque o `async/await` é açúcar em cima exatamente disto: toda API moderna do navegador devolve promises, e as mensagens de erro falam a língua delas. Entendendo o recibo e os três estados, o resto da seção desce redondo.",
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
            "await que se lê como código síncrono, try/catch como cinto de segurança e Promise.all em noção.",
          content:
            "O `async/await` é o jeito de consumir promises escrevendo código que se lê como síncrono. Duas palavras, dois papéis: `async` marca a função (e faz ela sempre devolver uma promise); `await` pausa aquela função (só ela, a página segue viva) até a promise resolver, e entrega o valor direto.\n\nO cinto de segurança é o `try/catch`: se qualquer `await` do bloco `try` rejeitar, a execução salta pro `catch`, um único lugar pra tratar qualquer falha da sequência:\n\n```js\nasync function carregarPerfil() {\n  try {\n    const dados = await buscarPerfil();\n    mostrar(dados);\n  } catch (erro) {\n    mostrarErro(erro);\n  }\n}\n```\n\nSem o `try/catch`, uma falha de rede vira erro solto no console e tela quebrada sem explicação; com ele, vira o estado de erro que a interface mostra com dignidade (assunto de um passo adiante).\n\nUma noção pra guardar: `await` em sequência espera um terminar pra começar o outro. Quando as operações são independentes (buscar o perfil E as notificações), o `Promise.all([a, b])` dispara as duas juntas e espera ambas; o tempo total vira o da mais lenta, não a soma das duas.\n\nVocê domina este passo quando escreve uma função `async` com `try/catch` de memória e explica o que cada `await` está esperando.",
          resources: [
            {
              label: "MDN async function",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Statements/async_function",
              kind: "doc",
            },
          ],
        },
        {
          id: "apis.fetch",
          title: "fetch e consumo de APIs",
          description:
            "fetch com await, a checagem do response.ok, o .json() e o POST em noção; axios como menção.",
          content:
            'O `fetch` é a função nativa do navegador pra fazer requisições HTTP: `const resposta = await fetch(url)` executa um GET e devolve o objeto de resposta. A partir daí, dois movimentos que valem decorar.\n\nPrimeiro, a checagem que todo mundo esquece: **o fetch não rejeita em erro HTTP**. Um 404 ou um 500 chegam como resposta normal; a promise só rejeita se a rede falhar de vez. Por isso a primeira linha depois do fetch é `if (!resposta.ok) throw new Error(...)`: o `ok` só é `true` na faixa 2xx dos status que você conhece.\n\nSegundo, o corpo vem em etapa própria: `const dados = await resposta.json()` lê o corpo e o converte de JSON pra objeto (outro `await`, porque o corpo também chega pela rede).\n\nPra enviar dados, o fetch recebe um segundo argumento de opções, em noção: `method: "POST"`, um `headers` com `"Content-Type": "application/json"` e o `body` com `JSON.stringify(objeto)`. O trio método, cabeçalho e corpo cobre o formulário que você vai enviar pra uma API de verdade.\n\nE o **axios**? Uma biblioteca popular que faz o mesmo com açúcar: rejeita em erro HTTP e converte o JSON sozinha. Você vai encontrá-la em muitos projetos; sabendo fetch, ela se aprende numa tarde.',
          resources: [
            {
              label: "MDN Fetch API",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/API/Fetch_API",
              kind: "doc",
            },
          ],
        },
        {
          id: "apis.rest",
          title: "REST e status HTTP",
          description:
            "A URL nomeia o recurso, o verbo diz a ação, o status resume o resultado: o cardápio das APIs.",
          content:
            "REST é o estilo de API mais comum da web, e o modelo mental é um cardápio de **recursos**: a URL nomeia a coisa, o verbo HTTP diz a ação. `GET /produtos` lista, `GET /produtos/42` busca um, `POST /produtos` cria, `PUT /produtos/42` atualiza, `DELETE /produtos/42` remove. O mesmo endereço, ações diferentes conforme o verbo: essa é a elegância do padrão.\n\nAs respostas falam pelos **status codes** que você conheceu nos fundamentos da web, agora com leitura de consumidor de API: `200` veio o que pedi, `201` criado com sucesso, `400` meu pedido estava malformado, `401` preciso me identificar, `404` esse recurso não existe, `500` o problema é do lado deles. Ler o status antes do corpo economiza horas de depuração.\n\nE o corpo, na ida e na volta, é quase sempre **JSON**, a língua franca que você já converte com `parse` e `stringify`.\n\nO exercício que fixa: a PokeAPI, uma API pública e gratuita, expõe `https://pokeapi.co/api/v2/pokemon/pikachu`. Leia a URL com olhos novos: recurso `pokemon`, identificador `pikachu`, verbo GET implícito ao abrir no navegador. Abra o endereço, veja o JSON cru e depois busque-o com `fetch` no Console: a sua primeira conversa com uma API de verdade.",
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
          description:
            "Carregando, sucesso, erro e vazio: desenhar os quatro estados antes de codar a tela.",
          content:
            "Toda tela que depende de dados de fora vive em um de quatro estados, sem exceção: **carregando** (a requisição partiu, nada chegou ainda), **sucesso** (dados na tela), **erro** (a busca falhou) e **vazio** (deu certo, mas não há o que mostrar: a lista sem itens, a busca sem resultados).\n\nO padrão de esquecimento é previsível: o dev implementa o sucesso, lembra do carregando e esquece os dois últimos, porque no ambiente de desenvolvimento a rede é rápida e sempre tem dado de teste. O usuário real percebe: a tela que congela sem aviso quando a conexão cai, a página em branco que parece bug quando a lista está vazia.\n\nOs remédios são de design, não de biblioteca. Pro carregando, um indicador honesto (um spinner, um esqueleto da tela). Pro erro, mensagem em linguagem humana e um botão de tentar de novo. Pro vazio, uma frase que orienta o próximo passo em vez do nada silencioso.\n\nO hábito profissional que este passo instala: antes de codar qualquer tela que dependa de dados, desenhe (nem que seja no papel) como ela fica nos QUATRO estados. As ferramentas pra implementar evoluem ao longo da trilha; a disciplina de pensar nos quatro vale pra carreira inteira.",
        },
        {
          id: "apis.cors",
          title: "CORS",
          description:
            "A política de mesma origem, por que o navegador (não o servidor) bloqueia e onde mora a liberação.",
          content:
            "Mais cedo ou mais tarde, todo dev front vive isso: o fetch funciona no navegador direto, mas na SUA página explode com um erro vermelho falando em CORS. Entender o que acontece transforma o susto em rotina.\n\nA raiz é a **política de mesma origem**: por segurança, o navegador não deixa a página de um site ler respostas de OUTRA origem (outro domínio, porta ou protocolo) sem permissão explícita. É ela que impede um site malicioso de, aproveitando a sua aba logada, ler seus dados de outros serviços.\n\nO ponto que confunde todo mundo: **quem bloqueia é o navegador, não o servidor**. A requisição muitas vezes até chega lá e volta; o navegador é que se recusa a entregar a resposta ao seu código. Por isso a mesma URL funciona aberta direto e falha dentro da página.\n\nO CORS é o mecanismo de permissão: o servidor declara, em cabeçalhos de resposta (`Access-Control-Allow-Origin`), quais origens podem consumi-lo. A consequência honesta: **a liberação mora no servidor**. Se a API não é sua, nenhuma linha de front resolve; o dono é quem precisa liberar a sua origem.\n\nNo dia a dia de desenvolvimento, a palavra a reconhecer é **proxy**: o dev server (o Vite, inclusive) pode repassar suas chamadas pro back como se fossem da mesma origem. Quando o erro aparecer, leia a mensagem do console com calma: ela diz exatamente qual origem foi bloqueada.",
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
            "O crachá (token) no Authorization header, onde guardá-lo com que riscos, e o OAuth em duas frases.",
          content:
            "Autenticação em API segue um modelo mental de portaria: você prova quem é uma vez (o login com e-mail e senha) e recebe um **crachá**; nas requisições seguintes, mostra o crachá em vez de provar tudo de novo. O crachá é um **token**, geralmente no formato JWT: um texto assinado pelo servidor dizendo quem você é e até quando vale.\n\nNo front, o crachá viaja num cabeçalho padrão: `Authorization: Bearer <token>`. Recebeu um `401` de volta? O crachá falta ou venceu: hora de renovar ou de mandar o usuário logar de novo (olha os status de REST trabalhando).\n\nOnde guardar o crachá é decisão com riscos reais, em noção honesta: no `localStorage` é simples, mas qualquer script injetado na página consegue ler (o ataque XSS que a seção de qualidade detalha); em **cookies httpOnly**, o script não lê, e quem o envia e recebe é o navegador conversando com o servidor. A escolha costuma vir do back-end do projeto; a sua parte é saber o que está em jogo.\n\nE o botão **entrar com Google**? É o rosto do OAuth: você prova quem é pro Google, e ele garante ao site que você é você, sem a sua senha trocar de mãos. Duas frases bastam por agora.\n\nEmitir, validar e renovar o crachá: a profundidade desse outro lado mora na trilha de back-end. No front, portaria e crachá levam você longe.",
        },
        {
          id: "apis.graphql",
          title: "GraphQL",
          description:
            "Cardápios prontos (REST) versus balcão sob medida (GraphQL), e quando cada um brilha.",
          optional: true,
          content:
            "GraphQL é uma alternativa ao REST pra conversar com o servidor, e o contraste cabe numa imagem: o REST oferece vários cardápios prontos (`/produtos`, `/usuarios/42`, cada um devolvendo a sua estrutura fixa); o GraphQL oferece um balcão único onde você descreve exatamente os campos que quer (o `nome` e o `preco` de cada produto, nada mais) e recebe só isso.\n\nA dor que ele ataca: no REST, telas complexas ou pedem demais (a resposta traz trinta campos e você usa três) ou pedem várias vezes (três endpoints pra montar uma tela só). No GraphQL, uma requisição única traz a forma exata que a tela precisa.\n\nQuando cada um brilha, em noção: o REST segue imbatível em simplicidade, cache e onipresença (a grande maioria das APIs públicas é REST); o GraphQL compensa em produtos grandes, com muitas telas diferentes consumindo os mesmos dados de jeitos diferentes, e times de front e back que evoluem separados.\n\nVocê não precisa dele agora: reconhecer uma query GraphQL quando vir e explicar esse contraste em voz alta já cumprem o papel deste passo opcional.",
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
                "O projeto React nascendo do create vite e a sintaxe que parece HTML dentro do JavaScript.",
              content:
                'Lembra do comando que a seção de ferramentas mandou guardar? A hora dele é agora: `npm create vite@latest meu-app` com o template **react** monta seu primeiro projeto React configurado. Rode `npm install`, depois `npm run dev`, e abra o arquivo `App.jsx`: o que tem dentro é JSX.\n\nJSX é a sintaxe do React que parece HTML escrito dentro do JavaScript:\n\n```jsx\nfunction App() {\n  const nome = "Bia";\n  return <h1>Olá, {nome}!</h1>;\n}\n```\n\nAs regras que mudam em relação ao HTML são poucas e aparecem logo. **Chaves interpolam JavaScript**: dentro de `{}` vai qualquer expressão (variável, conta, chamada de função), exatamente como no template literal. **`className` no lugar de `class`**, porque `class` é palavra reservada do JavaScript. E todo retorno precisa de **um elemento raiz**: dois irmãos soltos não podem; embrulhe numa tag ou num fragmento vazio `<>...</>`.\n\nA noção honesta que desfaz o mistério: JSX não é HTML. Cada tag compila pra uma chamada de função JavaScript que descreve o elemento; é por isso que ele vive dentro do JS e aceita expressões nas chaves sem cerimônia. Parece marcação, é código.\n\nVocê domina este passo quando cria o projeto com o Vite, edita o `App.jsx` e interpola uma variável sua no meio da marcação sem consultar nada.',
              resources: [
                {
                  label: "React Docs (pt-BR)",
                  url: "https://pt-br.react.dev/learn",
                  kind: "doc",
                },
              ],
            },
            {
              id: "react.base.componentes",
              title: "Componentes",
              description:
                "Função que retorna JSX, nome com maiúscula e a página inteira como árvore de componentes.",
              content:
                "Componente é uma função que retorna JSX. Só isso, de verdade: `function Cabecalho() { return <header>...</header>; }` é um componente completo, e usá-lo é escrever `<Cabecalho />` onde ele deve aparecer.\n\nA maiúscula no nome não é estilo, é contrato: é assim que o React distingue um componente seu (`<Cabecalho />`) de uma tag HTML comum (`<header>`). Nome minúsculo, ele procura uma tag; maiúsculo, ele chama a sua função.\n\nO modelo mental é Lego: peças pequenas que se combinam em peças maiores. Um `<CardDeProduto />` usa `<Preco />` e `<BotaoComprar />`; a `<PaginaDeBusca />` usa uma fileira de `<CardDeProduto />`. No topo, o `<App />` contém tudo. A página inteira vira uma **árvore de componentes**, e essa imagem não é nova pra você: é a mesma árvore que o navegador monta desde os fundamentos da web, só que agora cada galho é uma função sua que descreve aquele pedaço.\n\nO hábito que separa projeto legível de emaranhado: **um componente, uma responsabilidade**. Se a função cresceu e faz três coisas (busca, lista e rodapé), são três componentes pedindo pra nascer. Componente pequeno se entende, se testa e se reusa.\n\nVocê domina este passo quando olha uma tela qualquer (a da sua página pessoal, inclusive) e desenha de cabeça a árvore de componentes que a construiria.",
              resources: [
                {
                  label: "React: seu primeiro componente (pt-BR)",
                  url: "https://pt-br.react.dev/learn/your-first-component",
                  kind: "doc",
                },
              ],
            },
            {
              id: "react.base.props",
              title: "Props",
              description:
                "Os argumentos do componente: somente leitura, desestruturados na assinatura, incluindo children e funções.",
              content:
                'Se componente é função, **props são os argumentos dela**: os dados que o pai entrega pro filho renderizar. `<CardDeProduto nome="Caneca" preco={29} />` passa duas props; o filho as recebe num objeto único, quase sempre desestruturado direto na assinatura: `function CardDeProduto({ nome, preco })`. A desestruturação que você aprendeu em objetos trabalhando todo dia.\n\nA regra de ouro: **props são somente leitura**. O filho usa, exibe, calcula em cima, mas nunca altera; quem muda dado é o dono do dado (assunto do próximo grupo, estado). Essa disciplina de mão única é o que mantém o fluxo de dados do React rastreável: dados descem, e você sempre sabe de onde vieram.\n\nDuas props especiais completam o quadro. O `children` é o que o pai escreve ENTRE as tags do filho: `<Painel><p>Qualquer coisa</p></Painel>` chega em `function Painel({ children })` pronto pra ser posicionado; é assim que se fazem componentes-moldura. E lembra que em JavaScript **função é valor**, lá de funções e escopo? Aqui essa ideia vira arquitetura: o pai passa uma função como prop (`<BotaoComprar aoComprar={adicionarAoCarrinho} />`) e o filho a chama na hora certa. Dados descem por props; avisos sobem por funções. Esse é o canal filho pra pai.\n\nVocê domina este passo quando monta um componente que recebe dados, children e uma função, e explica qual viaja em cada direção.',
              resources: [
                {
                  label: "React: passando props (pt-BR)",
                  url: "https://pt-br.react.dev/learn/passing-props-to-a-component",
                  kind: "doc",
                },
              ],
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
                "O par valor e setter, o re-render a cada mudança e o onClick como novo addEventListener.",
              content:
                "Tente guardar um contador numa variável comum dentro do componente e dois problemas aparecem: a cada re-render a função roda de novo e a variável renasce zerada, e mesmo que sobrevivesse, mudar uma variável não avisa a tela. **Estado** é a solução do React pras duas coisas: memória que sobrevive aos renders e que, ao mudar, re-renderiza o componente.\n\nO `useState` entrega um par: o valor atual e a função que o troca. Em ação:\n\n```jsx\nfunction Contador() {\n  const [cliques, setCliques] = useState(0);\n  const somar = () => setCliques(cliques + 1);\n  return (\n    <button onClick={somar}>Total: {cliques}</button>\n  );\n}\n```\n\nRepare no `onClick`: é o jeito React do que o `addEventListener` fazia lá no DOM. Mesma ideia (uma função escutando o clique), agora declarada direto na marcação, sem buscar o elemento antes.\n\nO ciclo completo: clique chama `somar`, que chama `setCliques`, que troca o valor E re-renderiza o componente; o JSX roda de novo com `cliques` novo e a tela atualiza. Você nunca toca no DOM; descreve a tela a partir do estado e o React cuida do resto.\n\nA regra inegociável: **nunca mute o estado direto**. Nada de `lista.push(item)`: crie um novo com `[...lista, item]` e entregue ao setter. O spread e o map que você já domina existem pra isso.\n\nVocê domina este passo quando explica por que a tela atualiza sem você tocar no DOM.",
              resources: [
                {
                  label: "React useState (pt-BR)",
                  url: "https://pt-br.react.dev/reference/react/useState",
                  kind: "doc",
                },
              ],
            },
            {
              id: "react.estado.renderizacao",
              title: "Renderização condicional e listas",
              description:
                "Ternário e &&, map com key como identidade, e os quatro estados de dados virando interface.",
              content:
                "Se a tela é uma função do estado, renderizar condicionalmente é só usar as ferramentas do JavaScript dentro do JSX. O ternário escolhe entre dois caminhos: `{logado ? <Perfil /> : <BotaoEntrar />}`. O `&&` mostra ou omite: `{temAviso && <Banner />}` (cuidado com número à esquerda: `{0 && ...}` renderiza o próprio 0).\n\nListas saem do `map` que você já domina: `{produtos.map((p) => <Card key={p.id} nome={p.nome} />)}`. A novidade é a prop **`key`**: a identidade de cada item, que permite ao React saber quem entrou, saiu ou se moveu entre um render e outro. Use um id estável do dado. O índice do array parece funcionar, mas é armadilha em lista que muda: remova o primeiro item e todos os índices mudam, e o React confunde quem é quem (estado de input indo parar no item errado é o sintoma clássico).\n\nE aqui os **quatro estados** que você desenhou na seção de APIs viram interface de verdade:\n\n```jsx\nif (carregando) return <Spinner />;\nif (erro) return <Erro aoTentar={buscar} />;\nif (itens.length === 0) return <Vazio />;\nreturn <Lista itens={itens} />;\n```\n\nCarregando, erro, vazio e sucesso, cada um com seu retorno; o early return de condicionais e laços organizando componente.\n\nVocê domina este passo quando renderiza uma lista real com keys estáveis e os quatro estados cobertos.",
              resources: [
                {
                  label: "React: renderizando listas (pt-BR)",
                  url: "https://pt-br.react.dev/learn/rendering-lists",
                  kind: "doc",
                },
              ],
            },
            {
              id: "react.estado.useeffect",
              title: "useEffect",
              description:
                "O canal com o mundo fora do render: dependências como contrato, limpeza e menos efeitos do que parece.",
              content:
                "Render, no React, é cálculo puro: estado e props entram, JSX sai. Mas aplicações reais conversam com o mundo fora desse cálculo: buscar dados na rede, iniciar um timer, mudar o título da aba. O `useEffect` é o canal oficial pra esses **efeitos**: `useEffect(funcao, dependencias)` roda a função DEPOIS de o componente renderizar.\n\nO array de dependências é um contrato de quando rodar. Vazio (`[]`): uma vez, quando o componente monta; o lugar clássico do fetch inicial. Com valores (`[id]`): de novo sempre que `id` mudar; o produto trocou, busca o novo. Sem array: depois de todo render, o que quase nunca é o que você quer.\n\nSe o efeito devolve uma função, ela é a **limpeza**: roda antes do efeito repetir e quando o componente sai de cena. Timer criado, timer cancelado; é o que evita vazamento.\n\nO erro clássico de iniciante, em noção: efeito que altera um estado do qual ele mesmo depende dispara render, que dispara o efeito, que dispara render: o loop infinito. Quando o console avisar, olhe as dependências.\n\nE a honestidade que a documentação moderna martela: **você precisa de menos efeitos do que parece**. Valor derivado de estado (o total do carrinho, a lista filtrada) não é efeito, é cálculo durante o render. Reserve o `useEffect` pro que realmente sai do componente.\n\nVocê domina este passo quando explica o contrato do seu array de dependências em voz alta.",
              resources: [
                {
                  label: "React useEffect (pt-BR)",
                  url: "https://pt-br.react.dev/reference/react/useEffect",
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
                "O prop drilling como dor, o contexto como valor da subárvore e o critério do que merece ser global.",
              content:
                "A dor tem nome: **prop drilling**. O usuário logado vive no `<App />`, mas quem o exibe é um `<Avatar />` cinco níveis abaixo; a prop atravessa `<Layout />`, `<Header />` e `<Menu />`, que não a usam pra nada, só repassam. Cada intermediário fica acoplado a um dado que não é dele.\n\nO **contexto** é o atalho oficial: um valor publicado uma vez fica disponível pra qualquer componente da subárvore, sem escala nos intermediários. A mecânica, em noção: cria-se o contexto com `createContext`, o componente de cima embrulha os filhos num **Provider** com o valor, e qualquer descendente lê com `useContext(MeuContexto)`. Três peças, e o `<Avatar />` pega o usuário direto da fonte.\n\nQuando o valor do Provider muda, quem consome re-renderiza; é assim que o tema trocado se propaga na hora (esta plataforma faz exatamente isso com tema e sessão).\n\nO critério honesto pra não transformar o app numa sopa de contextos: contexto é pra dado genuinamente **transversal**, que muitos pontos distantes leem. Tema, usuário logado, idioma: sim. O estado de um formulário, a aba selecionada: não; isso é local, e local é mais simples de raciocinar. Comece local, promova a contexto quando o drilling doer de verdade.\n\nVocê domina este passo quando identifica num app real qual dado merece contexto e qual está bem onde está.",
              resources: [
                {
                  label: "React useContext (pt-BR)",
                  url: "https://pt-br.react.dev/reference/react/useContext",
                  kind: "doc",
                },
              ],
            },
            {
              id: "react.hooks.useref",
              title: "useRef",
              description:
                "A caixa que sobrevive a renders sem causar render: valor mutável e acesso ao DOM, como o focus.",
              content:
                "O `useRef` entrega uma caixa com um único compartimento, `ref.current`, com duas propriedades que a tornam única: o conteúdo **sobrevive aos re-renders** (como estado) e trocá-lo **não dispara render nenhum** (ao contrário de estado). O contraste é o jeito de decorar: estado avisa a tela, ref não avisa ninguém.\n\nPrimeiro uso: valor mutável de bastidor, que precisa persistir mas não aparece na interface. O id de um timer pra cancelar depois, a contagem de quantas vezes algo rodou: coisas que a tela não mostra e que seriam desperdício de render como estado.\n\nSegundo uso, o mais visível: **segurar um elemento do DOM**. Crie a ref, pendure no JSX com `<input ref={inputRef} />`, e depois do render `inputRef.current` é o elemento de verdade, aquele mesmo das APIs de DOM que você já conhece. O caso central: focar o campo de busca quando a tela abre, com `inputRef.current.focus()` dentro de um efeito. O React não tem prop pra foco; a ref é a porta de saída pro DOM real quando ela é necessária.\n\nA disciplina: ref não é atalho pra burlar estado. Se o valor influencia o que aparece na tela, ele é estado; se é bastidor ou elemento, é ref. Errar essa escolha é a fonte clássica de tela que não atualiza.",
              resources: [
                {
                  label: "React useRef (pt-BR)",
                  url: "https://pt-br.react.dev/reference/react/useRef",
                  kind: "doc",
                },
              ],
            },
            {
              id: "react.hooks.usememo",
              title: "useMemo e useCallback",
              description:
                "Memoizar valor derivado caro, com a regra honesta: calcule no render por padrão, otimize quando medir.",
              content:
                "O `useMemo` memoiza um valor derivado: `const visiveis = useMemo(() => filtrarEOrdenar(itens), [itens])` só refaz o cálculo quando `itens` muda; nos demais renders, devolve o resultado guardado. É a ferramenta pra derivação genuinamente **cara**: filtrar e ordenar milhares de linhas, processar um texto grande.\n\nA regra honesta vem antes da ferramenta: **o React é rápido, e recalcular no render é o padrão certo**. O total do carrinho, a lista com meia dúzia de filtros: calcule direto no corpo do componente, sem cerimônia, como o passo de useEffect já pregou. Memoização espalhada por reflexo é ruído: cada `useMemo` é mais código pra ler e uma lista de dependências pra manter em dia.\n\nO critério profissional é medir antes de otimizar: a interface engasgou de verdade? O Profiler das DevTools do React aponta o componente lento? Aí sim o `useMemo` entra, cirúrgico, no cálculo culpado.\n\nO primo em uma frase: o `useCallback` faz o mesmo pra funções (memoiza a função em vez do valor), útil quando uma função criada no render desce como prop pra componentes otimizados.\n\nVocê domina este passo justamente quando resiste a usá-lo sem motivo: derivação simples no render, `useMemo` guardado pra quando a medição apontar o gargalo.",
              resources: [
                {
                  label: "React useMemo (pt-BR)",
                  url: "https://pt-br.react.dev/reference/react/useMemo",
                  kind: "doc",
                },
              ],
            },
            {
              id: "react.hooks.custom",
              title: "Hooks customizados",
              description:
                "Extrair lógica repetida pra funções use, as duas regras dos hooks e hooks compondo hooks.",
              content:
                'Quando a mesma lógica com estado aparece em dois componentes (o mesmo par de `useState` com `useEffect`, a mesma assinatura), o React tem um mecanismo de extração: o **hook customizado**. É uma função comum cujo nome começa com `use` e que pode chamar outros hooks por dentro; o componente vira uma linha, e a lógica ganha casa própria e reutilizável.\n\nO exemplo mental perfeito junta duas pontas da trilha: um `useLocalStorage(chave, valorInicial)` que embrulha um `useState` e persiste cada mudança com o `localStorage` que você aprendeu no DOM. Escreveu uma vez, e todo componente que precisar de preferência salva usa `const [tema, setTema] = useLocalStorage("tema", "claro")`, com a mesma cara do useState.\n\nO prefixo `use` não é decoração: ele sinaliza que a função obedece às **duas regras dos hooks**. Um: hooks só se chamam no topo do componente ou de outro hook, nunca dentro de `if`, loop ou callback. Dois: só componentes e hooks chamam hooks. O porquê, em noção: o React identifica cada hook pela ORDEM de chamada a cada render; um hook dentro de `if` embaralha a fila inteira. O ESLint dos templates React vigia as duas regras por você.\n\nHooks compõem hooks, e é assim que a lógica de um app grande se organiza. Você domina este passo quando extrai seu primeiro `use` de uma repetição real entre dois componentes.',
              resources: [
                {
                  label:
                    "React: reutilizando lógica com hooks customizados (pt-BR)",
                  url: "https://pt-br.react.dev/learn/reusing-logic-with-custom-hooks",
                  kind: "doc",
                },
              ],
            },
          ],
        },
        {
          id: "react.forms",
          title: "Formulários controlados",
          description:
            "value com onChange como fonte única, o preventDefault de volta no submit e validação antes de enviar.",
          content:
            'No React, o padrão pra formulário é o **input controlado**: o valor do campo mora no estado, e o input só reflete e reporta:\n\n```jsx\nconst [email, setEmail] = useState("");\n\n<input\n  value={email}\n  onChange={(e) => setEmail(e.target.value)}\n/>\n```\n\nO ciclo: a pessoa digita, o `onChange` atualiza o estado, o re-render devolve o valor pro `value`. Parece uma volta longa pra digitar uma letra, mas compra a vantagem central: **uma única fonte de verdade**. O que está no estado É o que está na tela, e validar, limpar, preencher ou desabilitar o botão de enviar viram operações sobre estado, sem caçar valores no DOM.\n\nO envio é um reencontro: o mesmo `event.preventDefault()` que você aprendeu nos eventos do DOM abre o handler de `onSubmit` do form, impedindo o reload; dali em diante, é o seu código com os valores já em mãos no estado.\n\nValidação simples entra antes do envio, em noção: e-mail sem `@`, campo vazio? Guarde a mensagem num estado de erro, renderize-a condicionalmente (os quatro estados, sempre eles) e só chame a API quando estiver tudo certo.\n\nFormulário grande, com dezenas de campos e validações cruzadas, tem bibliotecas dedicadas no ecossistema; fica a menção. O controlado na mão é a base que faz qualquer uma delas fazer sentido.',
          resources: [
            {
              label: "React: input (pt-BR)",
              url: "https://pt-br.react.dev/reference/react-dom/components/input",
              kind: "doc",
            },
          ],
        },
        {
          id: "react.routing",
          title: "Roteamento (React Router)",
          description:
            "URL mapeada pra componente, Link sem reload com estado preservado e parâmetros de rota em noção.",
          content:
            'Até aqui seu app React é uma tela só. Uma SPA de verdade tem várias: perfil, busca, detalhe do produto, cada uma com sua URL, mas **sem recarregar a página** na troca. Quem faz essa mágica é o roteador: uma biblioteca que observa a URL e decide qual componente renderizar.\n\nO modelo mental é um mapa: `/` renderiza `<Home />`, `/produtos` renderiza `<Lista />`, `/produtos/:id` renderiza `<Detalhe />`. Você declara o mapa uma vez e navega o resto da vida.\n\nA troca de página usa `<Link to="/produtos">` no lugar do `<a href>`, e o porquê importa: o `<a>` dispara navegação completa (nova requisição, tela branca, todo o estado do app perdido); o `<Link>` intercepta o clique, atualiza a URL e deixa o roteador trocar o componente. Sem reload, estado global preservado, transição instantânea. A URL continua real: dá pra copiar, favoritar e compartilhar.\n\nO `:id` do mapa é o **parâmetro de rota**, em noção: `/produtos/42` casa com `/produtos/:id` e o componente lê o `42` pra buscar o produto certo, casando com o efeito que refaz o fetch quando o id muda.\n\nO nome de mercado é o **React Router**, o roteador dominante do ecossistema; alternativas mais leves existem (esta plataforma usa uma, o wouter). Os conceitos são os mesmos em todas: mapa, Link, parâmetro.',
          resources: [
            {
              label: "React Router",
              url: "https://reactrouter.com",
              kind: "doc",
            },
          ],
        },
        {
          id: "react.fetching",
          title: "Data fetching (TanStack Query)",
          description:
            "O combo cru de fetch com useEffect que você deve dominar, e o que uma biblioteca de dados acrescenta.",
          optional: true,
          content:
            "Você já sabe buscar dados no React, e essa combinação crua é pré-requisito deste passo, não o que ele substitui: um `useEffect` que dispara o `fetch` na montagem, estados pra carregando, erro e dados, os quatro estados renderizados por condição. Todo dev React precisa saber montar esse combo de memória, e ele basta pra apps pequenos.\n\nO que ele não dá conta, conforme o app cresce: **cache** (duas telas pedem o mesmo usuário e o app busca duas vezes), **revalidação** (o dado envelhece e nada o atualiza sozinho), sincronização entre abas, retry de falha, e a repetição do mesmo trio de estados em cada tela.\n\nBibliotecas de dados existem pra essa camada, e o nome a conhecer é o **TanStack Query** (ex React Query): você declara a chave e a função que busca, e recebe de volta dados, estados prontos, cache compartilhado e revalidação automática. O boilerplate que você escrevia em toda tela vira uma chamada.\n\nO critério prático de adoção: duas ou três telas com fetch simples, siga no combo cru, sem dependência nova. O app cresceu, os mesmos dados aparecem em vários lugares, o cache manual começou a nascer em contexto? É o sinal. E a base que você dominou continua valendo: a biblioteca automatiza exatamente o que você sabe fazer na mão.",
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
            "Quando subir estado deixa de bastar, o custo honesto do contexto e o critério de global como exceção.",
          optional: true,
          content:
            "O primeiro remédio pra estado compartilhado você já conhece: **subir o estado** pro ancestral comum e descê-lo por props. Ele resolve a maioria dos casos e deve ser sempre a primeira tentativa. Este passo existe pra quando ele deixa de bastar: o carrinho lido pelo header, pela página de produto e pelo checkout, componentes distantes demais pra um ancestral razoável.\n\nO contexto, que você conheceu nos hooks, resolve a **leitura** global. O custo honesto, em noção: quando o valor muda, toda a subárvore consumidora re-renderiza; pra tema (muda raro), perfeito; pra estado que muda a cada tecla, vira peso.\n\nDaí as bibliotecas dedicadas. O **Zustand** é a porta de entrada simples do ecossistema atual: uma store criada fora da árvore, componentes assinam só a fatia que usam, e só quem usa a fatia re-renderiza. O **Redux** é o nome histórico que dominou uma era e segue vivo em bases grandes; o padrão de ações e reducers que ele consagrou vale conhecer quando você o encontrar num projeto.\n\nO critério que evita arquitetura prematura: **comece local, suba quando doer, global é exceção**. A maior parte do estado de qualquer app é local de uma tela; a fatia genuinamente global costuma ser pequena (sessão, tema, carrinho). Desconfie do impulso de globalizar por conveniência.",
          resources: [
            {
              label: "Zustand",
              url: "https://zustand.docs.pmnd.rs",
              kind: "doc",
            },
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
            "A rede que segura erro de render com fallback, o que ela não pega e a granularidade por seção.",
          optional: true,
          content:
            "Sem proteção, um erro lançado durante o render (o clássico: ler propriedade de um dado que veio `undefined`) derruba a árvore inteira: tela branca, app morto, usuário sem explicação. O **error boundary** é a rede de segurança: um componente que embrulha uma parte da árvore e, se algo quebrar no render dali pra baixo, mostra um fallback amigável no lugar do desastre.\n\nA noção de uso: o boundary embrulha a região (`<ErrorBoundary fallback={<Aviso />}>`), captura o erro dos descendentes e renderiza o plano B. Na prática dos projetos, usa-se um pacote pronto ou o componente que o time já tem; o valor está em ONDE colocar.\n\nTão importante quanto saber o que ele pega é saber o que **não** pega: erro dentro de handler de evento e falha em código assíncrono (o fetch que rejeitou) não passam pelo render, então o boundary nem os vê. Pra esses, as ferramentas continuam as que você já domina: o `try/catch` do async e o estado de erro renderizado com dignidade. O boundary cobre a terceira via: o erro inesperado no meio do render.\n\nGranularidade, em noção: um boundary global evita a tela branca total, e boundaries por seção (a sidebar, o feed, o painel) deixam o resto do app vivo quando uma região quebra. Quebrou o feed, a navegação continua funcionando.",
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
            "Tipos checados antes de rodar: anotar parâmetro e retorno, inferência e o any como armadilha.",
          content:
            'TypeScript é o JavaScript que você já escreve, com tipos checados **antes de rodar**. O valor real aparece em dois momentos do dia a dia: o erro surge em tempo de escrita (o editor sublinha o `produto.nomee` na hora, não o usuário na sexta à noite) e o autocomplete vira documentação que não mente: digite o ponto e o editor lista o que aquele valor realmente tem.\n\nA prática central é anotar as fronteiras: parâmetros e retorno de função, e o formato dos objetos com `type` ou `interface`:\n\n```ts\ntype Produto = {\n  nome: string;\n  preco: number;\n};\n\nfunction formatarPreco(p: Produto): string {\n  return `R$ ${p.preco.toFixed(2)}`;\n}\n```\n\nDentro das fronteiras, deixe a **inferência** trabalhar: `const nome = "Bia"` já é `string` sem anotação nenhuma; anotar o óbvio é ruído.\n\nO portão de entrada você conhece da seção de ferramentas: o `npm create vite@latest` tem o template **react-ts**, que entrega o projeto React tipado e configurado.\n\nE a honestidade sobre o `any`: ele é a válvula de escape que desliga a checagem daquele valor, e cada `any` espalhado devolve exatamente os bugs que o TypeScript veio evitar. Use como exceção consciente, não como rotina.\n\nVocê domina este passo quando o sublinhado vermelho do editor vira o seu primeiro revisor, antes de qualquer refresh.',
          resources: [
            {
              label: "TypeScript (pt)",
              url: "https://www.typescriptlang.org/pt/docs",
              kind: "doc",
            },
          ],
        },
        {
          id: "qualidade.estilo",
          title: "Estilo de código e legibilidade",
          description:
            "Nomes que dizem o que são, funções pequenas, comentário do porquê e consistência acima de preferência.",
          content:
            "Código se escreve uma vez e se lê dezenas: pra revisar, pra caçar bug, pra estender daqui a seis meses. Estilo de código é otimizar pra esse leitor, que na maioria das vezes é você do futuro.\n\nO fundamento é o **nome que diz o que é**: `calcularFrete` conta a história, `processar` esconde; `diasAteVencimento` dispensa comentário, `x` cobra um. Vale pra variável, função e componente: se o nome precisa de explicação pra fazer sentido, o nome está errado.\n\nTamanho importa: função e componente pequenos, com uma responsabilidade clara, como a seção de React pregou pros componentes. E o **early return** que você carrega desde condicionais e laços é a ferramenta de forma: trate as exceções primeiro e deixe o caminho principal reto, sem escadaria de `if`.\n\nComentário tem papel específico: explicar o **porquê** (a regra de negócio, a restrição, o motivo da escolha estranha), nunca narrar o que o código já mostra. Um `// soma 1 ao contador` é ruído; um `// o gateway arredonda pra cima, replicamos aqui` salva horas de arqueologia.\n\nA divisão com as ferramentas que você configurou: o Prettier e o ESLint automatizam o combinável, forma e erro detectável; estilo é o julgamento que a máquina não pega: nome, tamanho, clareza. E em time vale a regra de ouro: **a consistência do projeto vence a sua preferência pessoal**. Código bom parece escrito por uma pessoa só.",
        },
        {
          id: "qualidade.testes",
          title: "Testes",
          children: [
            {
              id: "qualidade.testes.unit",
              title: "Unitários (Vitest, Testing Library)",
              description:
                "Preparar, agir e conferir com Vitest: o teste como confiança pra mudar código sem medo.",
              content:
                'Lembra do "e se eu quebrar tudo?" que o Git respondeu? O Git protege o passado: sempre dá pra voltar. O teste protege o presente: ele diz, em segundos, se a mudança de agora quebrou o que já funcionava. É isso que teste compra: **confiança pra mexer no código sem medo**.\n\nTeste unitário é o menor deles: verifica uma unidade isolada (uma função, um componente) com entradas conhecidas. A anatomia é sempre a mesma, preparar, agir, conferir:\n\n```js\nimport { test, expect } from "vitest";\nimport { calcularFrete } from "./frete";\n\ntest("frete grátis acima de 200 reais", () => {\n  expect(calcularFrete(250)).toBe(0);\n});\n```\n\nO **Vitest** é a escolha natural em projeto Vite: mesma configuração, mesmo ecossistema, roda com `npx vitest`. E o nome não engana: a sintaxe de `test` e `expect` é o padrão da área.\n\nComece por onde o retorno é imediato: **funções puras**, aquelas que só calculam (frete, validação, formatação). Entrada, saída, sem tela no meio: fáceis de testar e onde moram as regras de negócio.\n\nComponente também se testa, com a **Testing Library**: renderiza e verifica o que o usuário veria, em noção por enquanto.\n\nVocê domina este passo quando escreve o teste de uma função sua e o vê falhar de propósito antes de passar.',
              resources: [
                {
                  label: "Vitest",
                  url: "https://vitest.dev",
                  kind: "doc",
                },
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
              description:
                "O navegador automatizado nos fluxos críticos, a pirâmide de testes e o custo honesto do e2e.",
              optional: true,
              content:
                "Teste end-to-end é um navegador de verdade sendo pilotado por script: abre a página, digita no formulário, clica no botão e confere o que apareceu, exatamente como um usuário faria. Enquanto o unitário verifica peças isoladas, o e2e verifica a experiência inteira montada: front, rotas, API, tudo junto.\n\nO nome a conhecer é o **Playwright**: você descreve o fluxo (visite a página, preencha o e-mail, clique em entrar, espere o painel aparecer) e ele executa em navegadores reais, tirando screenshot de onde falhou.\n\nOnde ele paga o preço: nos **fluxos críticos**, os caminhos que não podem quebrar nunca. Login, cadastro, compra, envio do formulário principal. Um punhado de testes cobrindo essas espinhas dorsais avisa na hora se um deploy quebrou o que importa.\n\nA dosagem vem da **pirâmide de testes**, em noção: muitos testes unitários na base (baratos, rápidos, apontam o erro com precisão) e poucos e2e no topo (caros, lentos, mas verificam o conjunto real).\n\nE o custo honesto: e2e é lento por natureza (navegador de verdade, rede de verdade) e fica quebradiço quando mal escrito, falhando por timing ou seletor frágil sem bug nenhum. Teste e2e instável que todo mundo ignora é pior que teste nenhum: comece pequeno, nos dois ou três fluxos que definem o seu app.",
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
          description:
            "LCP, CLS e INP como percepção medida, a imagem como vilã e o Lighthouse do DevTools como régua.",
          content:
            'Performance, no front, é a percepção do usuário: a página parece rápida ou parece travada? O Google transformou essa percepção em métricas, os **Core Web Vitals**, e são três siglas a reconhecer: **LCP** mede quanto demora pro conteúdo principal aparecer; **CLS** mede quanto a página pula enquanto carrega (o botão que foge do dedo); **INP** mede quanto ela demora pra responder a uma interação.\n\nA vilã número um, de longe, é a **imagem**: foto de 4MB numa vitrine de 300px afunda qualquer LCP. O kit de defesa: dimensione pro tamanho real de exibição, use formato moderno (WebP ou AVIF no lugar de PNG e JPEG pesados) e adie o que está fora da tela com `loading="lazy"`. Só isso resolve a maior parte dos problemas de página lenta de iniciante.\n\nA régua você carrega desde os fundamentos: o DevTools que virou sua lupa lá no comecinho da trilha tem a aba **Lighthouse**, que audita a página e devolve nota com a lista do que consertar, apontando cada Vital.\n\nBundle entra em noção: todo JavaScript importado viaja até o usuário, e dividir o código pra cada página carregar só o seu pedaço é a evolução natural (o Vite ajuda nisso).\n\nE a filosofia é a mesma do useMemo: **medir antes de otimizar**. Rode o Lighthouse, ataque o pior item, meça de novo. Otimização sem medida é chute.',
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
          description:
            "XSS como risco central, o escape padrão do React, validação de servidor e segredo fora do front.",
          content:
            "Segurança de front tem escopo honesto: o navegador é território do usuário, então a última palavra mora sempre no servidor. Ainda assim, o front tem responsabilidades próprias, e uma delas é o risco central.\n\nO **XSS** (cross-site scripting) é injetar código executável através de conteúdo: se o app insere na página um texto vindo de fora (um comentário, um nome de perfil) sem tratamento, e esse texto contém um script, o navegador o executa como se fosse seu, com acesso a tudo que a página vê. O comentário malicioso vira código rodando na conta de quem o lê.\n\nA boa notícia: o React escapa por padrão. Texto interpolado em JSX vira TEXTO na tela, nunca HTML interpretado; a mesma string com script dentro aparece literal, inofensiva. A exceção tem nome de aviso: `dangerouslySetInnerHTML` injeta HTML cru de verdade, e o nome é assustador de propósito. Se um dia precisar dele, o conteúdo tem que ser sanitizado antes.\n\nSobre validação, a divisão que você viu nascer nos formulários HTML: a do client é conforto de UX (feedback imediato); a do **servidor é a segurança**. Qualquer um dispara requisições sem passar pela sua tela: nunca confie só no front.\n\nDuas linhas pra fechar o kit: segredo (chave de API, senha de serviço) não vive em código de front, e o próximo passo de variáveis de ambiente explica o porquê; e o HTTPS dos fundamentos é o que impede a rede no meio do caminho de ler ou trocar o que trafega.",
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
            "Teclado com foco visível, contraste, ARIA como complemento cauteloso e o teste com as próprias mãos.",
          optional: true,
          content:
            'A base você plantou lá na acessibilidade do HTML: semântica, `alt`, `label`, headings em ordem. Este passo é o resto do caminho, o que transforma página tecnicamente acessível em experiência utilizável de verdade.\n\nA primeira frente é o **teclado**: muita gente navega só com ele. Percorra seu app com Tab: dá pra alcançar tudo que é clicável? A ordem faz sentido? E o **foco visível**: aquele contorno que mostra onde você está é um recurso de orientação, não um defeito estético; um `outline: none` sem substituto à altura deixa o usuário de teclado às cegas.\n\nA segunda é o **contraste**: texto cinza claro sobre fundo branco pode ser bonito no seu monitor e ilegível no sol, na tela barata, no olho com baixa visão. E o `alt` segue como hábito contínuo, não checklist de um dia.\n\nSobre o **ARIA**: é o vocabulário de atributos pra quando a semântica nativa não basta (um dropdown customizado, um modal). A honestidade obrigatória: ARIA mal usado é PIOR que ARIA nenhum, porque mente pro leitor de tela. A primeira regra do ARIA é não usar ARIA quando existe elemento nativo: `<button>` antes de `role="button"`.\n\nO teste começa com as próprias mãos: navegue seu projeto inteiro sem mouse, e rode a auditoria de acessibilidade do Lighthouse que você conheceu na performance. O que essas duas passadas apontarem já é um plano de trabalho.',
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
          description:
            "Escopo pequeno terminado, telas com os quatro estados desenhados e a lista explícita do que fica pra depois.",
          content:
            'A regra número um de projeto pessoal: **escopo pequeno terminado vence escopo grande abandonado**. O portfólio que impressiona não é o clone de rede social pela metade; é o app modesto, completo, no ar e bem documentado. Planejar é decidir o que NÃO entra.\n\nComece listando as telas. Pra cada uma, o hábito que você trouxe da seção de APIs e viu virar código no React: desenhe os **quatro estados** (carregando, sucesso, erro, vazio) antes de codar. O rabisco vale mais que a ferramenta: papel resolve; Figma, em noção, se quiser evoluir o desenho.\n\nCom as telas na mão, quebre cada uma na **árvore de componentes** que a seção de React ensinou a enxergar: o que se repete vira componente, o que tem responsabilidade própria também. Essa árvore rabiscada é o seu mapa de construção.\n\nE o corte de escopo ganha forma concreta: escolha **3 a 5 funcionalidades pra v1** e escreva uma lista explícita de "depois" pra todo o resto. A lista de depois não é lixeira, é promessa organizada: ela tira as ideias da cabeça (e da v1) sem perdê-las.\n\nVocê domina este passo quando entrega um plano de uma página: telas, estados, árvore de componentes e as funcionalidades da v1 com a lista de depois ao lado.',
        },
        {
          id: "projeto.construir",
          title: "Construir aplicando tudo",
          description:
            "Estático, depois estado, depois dados; commit a cada marco e a v1 feia terminada antes do polimento.",
          content:
            "Com o plano na mão, a ordem de construção que funciona tem três camadas. Primeiro a **marcação estática**: todas as telas com HTML e CSS, dados de mentira escritos na mão, nada clicável. Depois o **estado**: os useState e os eventos que fazem a interface reagir, ainda com dados falsos. Por último os **dados de verdade**: o fetch, os quatro estados renderizados, a API real. Cada camada se apoia na anterior, e você nunca depura duas coisas ao mesmo tempo.\n\nA cada marco funcionando, o ciclo que virou reflexo na seção de ferramentas: `git status`, `git add`, `git commit`. Marco pequeno, commit pequeno; quando algo quebrar (vai quebrar), o histórico diz exatamente onde o mundo ainda estava de pé.\n\nDois chapéus, um de cada vez: o de **construir** e o de **polir** não se usam juntos. Ajustar sombra de botão com a busca ainda quebrada é a receita do projeto eterno. Termine a v1 feia e funcional; o embelezamento é uma fase própria, depois.\n\nE quando travar: reduza o problema. Isole o pedaço que falha, interrogue com `console.log`, abra o Network do DevTools pra ver o que realmente foi e voltou. Travamento de horas quase sempre é um problema pequeno escondido num contexto grande.\n\nVocê domina este passo quando o seu histórico de commits conta a história da construção em passos pequenos e funcionais.",
        },
        {
          id: "projeto.env",
          title: "Variáveis de ambiente (.env)",
          description:
            "Config fora do código com prefixo VITE_, o .env fora do Git e o aviso: env de front é pública.",
          content:
            "Variável de ambiente é o valor que muda conforme ONDE o app roda, mantido fora do código: a URL da API é `localhost:3100` na sua máquina e `api.seuapp.com` em produção, e o código não deveria saber disso; ele lê `import.meta.env.VITE_API_URL` e cada ambiente fornece o seu valor.\n\nNo Vite, os valores de desenvolvimento vivem num arquivo `.env` na raiz do projeto, e a primeira providência é ele entrar no `.gitignore`: configuração de ambiente é local, não vai pro histórico. O que o time compartilha é um `.env.example` com as chaves sem os valores, mostrando o que precisa existir.\n\nO detalhe do Vite: só as variáveis com prefixo **`VITE_`** chegam ao código do client. É um portão de segurança deliberado, pra uma variável sensível do sistema não vazar pro bundle por acidente.\n\nE aqui entra o aviso central, que a seção de segurança deixou engatilhado: **variável de ambiente de front é PÚBLICA**. Ela é embutida no JavaScript final, e qualquer pessoa com o DevTools que você mesmo usa a encontra em segundos. Serve pra URL de API e configuração não sensível; chave secreta, senha de serviço, token privado vivem no servidor, sempre. Se o serviço exige a chave escondida, a chamada passa por um back-end seu.\n\nVocê domina este passo quando explica por que o `VITE_` no nome não torna o valor secreto.",
          resources: [
            {
              label: "Vite: variáveis de ambiente",
              url: "https://vite.dev/guide/env-and-mode",
              kind: "doc",
            },
          ],
        },
        {
          id: "projeto.readme",
          title: "Documentar (README)",
          description:
            "A porta de entrada do repositório: o que é, screenshot, link no ar, como rodar e próximos passos.",
          content:
            'O README é a porta de entrada do repositório: é a primeira (e muitas vezes única) coisa que alguém lê sobre o seu projeto. A verdade do mercado que dá peso a este passo: **recrutador lê README, não código**. Um projeto bom com README vazio simplesmente não existe pra quem olha de fora.\n\nA receita do README que trabalha por você, de cima pra baixo: **o que é**, em uma ou duas frases sem jargão; o **link do site no ar**, no topo, clicável (o deploy do próximo passo garante que ele existe); um **screenshot** ou GIF curto, porque projeto visual se vende visualmente; **como rodar** (clonar, `npm install`, `npm run dev`, e as variáveis do `.env.example` que precisam existir); as **tecnologias** usadas, em lista curta; e os **próximos passos**, que mostram que você enxerga a evolução (a lista de "depois" do planejamento encontra sua vitrine aqui).\n\nO teste de qualidade é um só: escreva pra quem nunca viu o projeto e não tem você do lado. Se a pessoa consegue entender o que é, ver funcionando e rodar localmente sem te perguntar nada, o README cumpriu o papel.\n\nEscreva o do seu projeto agora, antes do deploy: quando o link público existir, ele já terá casa.',
        },
        {
          id: "projeto.deploy",
          title: "Deploy",
          description:
            "Do build à Vercel conectada ao repositório: push na main virando deploy automático, o arco completo.",
          content:
            "Lá no comecinho da trilha, em Primeiro site no ar, você publicou arrastando arquivos pra dentro do GitHub. Aquele era o começo do arco; este passo o fecha do jeito profissional.\n\nPrimeiro, o que vai ao ar de fato: `npm run build` roda o Vite no modo produção e gera a pasta `dist`, seu app minificado e otimizado. É ela que os servidores servem, nunca o código fonte cru.\n\nSó que você não vai fazer upload da `dist`: plataformas como **Vercel** e **Netlify** se conectam direto ao seu repositório. O fluxo, uma vez só: crie a conta com o próprio GitHub, importe o repositório, confirme o framework detectado (build e pasta de saída já vêm certos pra Vite) e configure no painel as variáveis de ambiente que o `.env` local guardava, como o passo de env ensinou.\n\nDaí em diante, a mágica que junta a trilha inteira: **todo push na main vira deploy automático**. O ciclo do Git que virou reflexo, o commit e o push de ferramentas, agora termina com o site atualizado no ar em um ou dois minutos. Domínio próprio, em noção: as plataformas dão um endereço gratuito, e apontar um domínio seu é uma configuração de DNS, aquele mesmo dos fundamentos.\n\nOlhe o caminho percorrido: de uma página estática arrastada pro GitHub a um app React com histórico, testes e deploy automático a cada push. Você atravessou a trilha. O endereço público que existe agora é seu, pra colocar no README, no currículo e no LinkedIn.",
          resources: [
            { label: "Vercel", url: "https://vercel.com/docs", kind: "doc" },
            { label: "Netlify", url: "https://docs.netlify.com", kind: "doc" },
          ],
        },
        {
          id: "projeto.ssr",
          title: "SSR e SSG (conceito, Next.js)",
          description:
            "A limitação da SPA pura, o render no servidor como resposta e o critério honesto pra Next.js.",
          optional: true,
          content:
            "A SPA que você construiu tem uma característica estrutural: o HTML que chega do servidor é quase vazio, uma casca com um `<div>` e um script; a página de verdade só existe depois que o JavaScript baixa e o React renderiza. Pra app logado, irrelevante. Mas tem dois preços, em noção: buscadores e previews de link enxergam melhor conteúdo que já chega pronto (SEO), e em conexão lenta o usuário encara tela branca até o JS chegar (primeira pintura).\n\nO **SSR** (server-side rendering) inverte: o servidor roda o React e envia o HTML já montado; o navegador mostra conteúdo imediatamente e o JavaScript assume em seguida. O primo **SSG** gera as páginas prontas no build, perfeito pra conteúdo que muda pouco, como um blog.\n\nO nome de mercado é o **Next.js**, o framework React que empacota SSR, SSG, rotas e mais decisões prontas; é ele que você verá em vaga e em tutorial.\n\nO critério honesto: **portfólio e app logado em SPA estão ótimos**, e o deploy que você acabou de fazer não fica devendo nada. SSR entra quando o conteúdo precisa indexar: e-commerce, blog, landing que vive de busca orgânica. E o conselho de sequência: não aprenda Next antes do React estar sólido; ele assume tudo que esta seção construiu e adiciona camadas por cima.",
          resources: [
            { label: "Next.js", url: "https://nextjs.org/docs", kind: "doc" },
          ],
        },
        {
          id: "projeto.ci",
          title: "CI básico",
          description:
            "O robô que roda lint, testes e build a cada push, com preview por PR fechando a cultura de review.",
          optional: true,
          content:
            "CI (integração contínua) é um robô que roda as suas checagens a cada push: lint, testes, build. O que você roda na sua máquina quando lembra, ele roda sempre, em ambiente limpo, e conta o resultado no GitHub com um check verde ou vermelho no commit e no PR.\n\nPra quem já vive no GitHub, a escolha natural é o **GitHub Actions**: um arquivo de configuração descrevendo os passos (instalar dependências, rodar os scripts) e o gatilho (a cada push, a cada PR). Os templates prontos pra Node cobrem o essencial e se ajustam em minutos.\n\nO que automatizar primeiro é exatamente o que você já tem: o `npm run lint`, os testes do Vitest e o `npm run build`. Build quebrado que só aparece na hora do deploy é o tipo de surpresa que o CI extingue: se quebrar, quebra no PR, com contexto e antes de encostar na main.\n\nE o complemento que a Vercel dá de graça, em noção: **preview por PR**. Cada pull request ganha uma URL própria com aquela versão no ar, e a conversa de review que a seção de ferramentas plantou sobe de nível: além de ler o diff, quem revisa CLICA na mudança funcionando. Check verde do CI mais preview navegável: é assim que time profissional integra mudança com confiança, e o seu projeto solo pode trabalhar igual desde já.",
          resources: [
            {
              label: "GitHub Actions",
              url: "https://docs.github.com/pt/actions",
              kind: "doc",
            },
          ],
        },
      ],
    },
  ],
};
