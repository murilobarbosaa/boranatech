// POOL ESCRITA A MAO no Lote 08, sem gerador: a trilha de HTML nao tem runner,
// e a geracao automatica em trilha sem runner ja se mostrou negativa (na pool
// de Git, 18 de 19 perguntas de codigo sairam semanticamente erradas e foram
// reescritas a mao). Cada pergunta aqui foi escrita e conferida pela revisao
// humana do lote, com a coluna estrutural de verify:quiz-pool --tabela-revisao.
//
// SERVER-ONLY: este arquivo contem o GABARITO; NUNCA importar, direta ou
// indiretamente, de client/src (o client recebe as perguntas sem gabarito via
// API). Ids sao estaveis: tentativas de usuarios os referenciam.
//
// HTML nao tem saida de terminal: nao ha pergunta do tipo saida e nenhum
// codigo.saidaEsperada (em html o campo e opcional).
//
// TODO(Ana): revisao editorial completa desta pool (perguntas, alternativas e
// explicacoes dos tres niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  slug: "html",
  questions: [
    {
      id: "html-ini-01",
      nivel: "iniciante",
      pergunta:
        "O que uma linguagem de marcação como o HTML faz com o conteúdo de uma página?",
      alternativas: {
        a: "Nomeia as partes do conteúdo, dizendo o que é título, parágrafo ou lista",
        b: "Calcula valores e toma decisões conforme a resposta da pessoa",
        c: "Define cores, espaçamentos e o posicionamento de cada elemento",
        d: "Guarda os dados enviados pelos visitantes para consulta posterior",
      },
      correta: "a",
      explicacao:
        "HTML é marcação: ele dá nome e significado a cada parte do conteúdo. Cálculo e decisão são de linguagens de programação, aparência é do CSS e guardar dados é do servidor.",
      fonte: "fundamentos.oque",
    },
    {
      id: "html-ini-02",
      nivel: "iniciante",
      pergunta:
        "Por que o arquivo principal de um site costuma se chamar index.html?",
      alternativas: {
        a: "Porque o navegador só abre arquivos com esse nome",
        b: "Porque é o nome que servidores entregam por padrão",
        c: "Porque o nome define o título que aparece na aba do navegador",
        d: "Porque arquivos com outro nome precisam ser convertidos antes de publicar",
      },
      correta: "b",
      explicacao:
        "index.html é a convenção que o servidor procura quando ninguém pede uma página específica. O navegador abre qualquer arquivo .html, o título vem do elemento title e nenhuma conversão é necessária.",
      fonte: "fundamentos.arquivo",
    },
    {
      id: "html-ini-03",
      nivel: "iniciante",
      pergunta:
        "Qual alternativa completa a lacuna para que a página declare a codificação de caracteres e os acentos apareçam corretos?",
      alternativas: { a: "lang", b: "encoding", c: "charset", d: "type" },
      correta: "c",
      explicacao:
        "O atributo é charset, e o valor UTF-8 cobre acentos e cedilha. O lang declara o idioma, não a codificação; encoding e type não valem nesse elemento.",
      fonte: "fundamentos.documento",
      tipo: "completar",
      codigo: {
        linguagem: "html",
        trecho: '<meta ____="UTF-8">',
      },
      alternativasCodigo: true,
    },
    {
      id: "html-ini-04",
      nivel: "iniciante",
      pergunta: "O que é um atributo em HTML?",
      alternativas: {
        a: "Um comentário que o navegador ignora ao montar a página",
        b: "O texto que aparece entre a tag de abertura e a de fechamento",
        c: "Um elemento que não tem conteúdo nem tag de fechamento",
        d: "Informação extra sobre o elemento, na tag de abertura",
      },
      correta: "d",
      explicacao:
        "O atributo vive dentro da tag de abertura e informa algo sobre o elemento, como o destino de um link. O texto entre as tags é o conteúdo; elemento sem fechamento é o vazio; e comentário é outra coisa.",
      fonte: "fundamentos.elemento",
    },
    {
      id: "html-ini-05",
      nivel: "iniciante",
      pergunta:
        "Este trecho deveria abrir a página com o título principal e, logo abaixo, o título da primeira seção. Qual é o defeito?",
      alternativas: {
        a: "A hierarquia pula de h1 para h4",
        b: "A página só aceita um título",
        c: "O h1 precisa vir depois das seções da página",
        d: "Títulos precisam do atributo id para funcionar",
      },
      correta: "a",
      explicacao:
        "Os níveis formam um índice e devem descer um degrau por vez: depois do h1 vem o h2. Escolher h4 pelo tamanho da letra quebra esse índice, e tamanho é assunto do CSS.",
      fonte: "texto.titulos",
      tipo: "erro",
      codigo: {
        linguagem: "html",
        trecho: "<h1>Portfólio de Ana</h1>\n<h4>Projetos</h4>",
      },
    },
    {
      id: "html-ini-06",
      nivel: "iniciante",
      pergunta:
        "Qual alternativa completa a lacuna para que a imagem tenha texto alternativo?",
      alternativas: { a: "title", b: "alt", c: "caption", d: "name" },
      correta: "b",
      explicacao:
        "O alt é o texto alternativo, lido por leitores de tela e exibido quando a imagem não carrega. O title mostra dica ao passar o mouse, caption não é atributo e name não descreve imagem.",
      fonte: "links-imagens.imagens",
      tipo: "completar",
      codigo: {
        linguagem: "html",
        trecho: '<img src="foto.jpg" ____="Ana no parque">',
      },
      alternativasCodigo: true,
    },
    {
      id: "html-ini-07",
      nivel: "iniciante",
      pergunta:
        "Este trecho deveria destacar parte do parágrafo. Qual é o defeito?",
      alternativas: {
        a: "O parágrafo precisa do atributo lang para aceitar destaque",
        b: "O strong não pode ficar dentro de um parágrafo",
        c: "O strong é fechado depois do p, fora da ordem",
        d: "O texto destacado precisa ficar entre aspas",
      },
      correta: "c",
      explicacao:
        "O último elemento aberto é o primeiro a fechar: aqui o strong abre dentro do p e deveria fechar antes dele. O navegador conserta em silêncio, e o validador acusa. O strong dentro de um parágrafo é válido, e nem lang nem aspas têm relação.",
      fonte: "fundamentos.elemento",
      tipo: "erro",
      codigo: {
        linguagem: "html",
        trecho: "<p>Leia <strong>com atenção antes.</p></strong>",
      },
    },
    {
      id: "html-ini-08",
      nivel: "iniciante",
      pergunta:
        "Qual é a diferença entre marcar um trecho com strong e marcá-lo com b?",
      alternativas: {
        a: "O strong só pode ser usado dentro de títulos",
        b: "O strong funciona em qualquer navegador e o b só nos mais novos",
        c: "O strong deixa o texto em itálico e o b deixa em negrito",
        d: "O strong marca importância; o b só pede negrito",
      },
      correta: "d",
      explicacao:
        "A diferença é de significado: strong marca importância, e leitores de tela e buscadores leem isso. O b pede só a aparência de negrito. Itálico é em, e nenhum dos dois depende de título.",
      fonte: "texto.enfase",
    },
    {
      id: "html-ini-09",
      nivel: "iniciante",
      pergunta:
        "Você quer que a página mostre na tela o texto de uma tag, como o sinal de menor seguido de p. O que usar?",
      alternativas: {
        a: "As entidades, escrevendo &lt;p&gt;",
        b: "Um comentário em volta do trecho",
        c: "Aspas duplas em volta do trecho",
        d: "Um atributo lang no parágrafo",
      },
      correta: "a",
      explicacao:
        "Entidades representam caracteres que pertencem à linguagem: &lt; para menor e &gt; para maior. Comentário faz o navegador ignorar o trecho, e aspas ou lang não mudam a interpretação.",
      fonte: "texto.entidades",
    },
    {
      id: "html-ini-10",
      nivel: "iniciante",
      pergunta:
        "Qual alternativa completa a lacuna para que o link com href igual a sustenido sobre chegue a esta seção?",
      alternativas: { a: "name", b: "id", c: "class", d: "target" },
      correta: "b",
      explicacao:
        "A âncora interna liga o href com sustenido ao id do destino, que é único na página. O name tem outros usos, class serve ao CSS e target decide onde o link abre.",
      fonte: "links-imagens.ancoras",
      tipo: "completar",
      codigo: {
        linguagem: "html",
        trecho: '<section ____="sobre">\n  <h2>Sobre mim</h2>\n</section>',
      },
      alternativasCodigo: true,
    },
    {
      id: "html-ini-11",
      nivel: "iniciante",
      pergunta:
        "Este trecho deveria levar a pessoa para a página sobre.html ao ser clicado. Qual é o defeito?",
      alternativas: {
        a: "O link precisa do atributo target para funcionar",
        b: "O texto do link precisa estar entre aspas",
        c: "Falta o href, e sem ele o link não navega",
        d: "O elemento a só funciona dentro de um nav",
      },
      correta: "c",
      explicacao:
        "É o href que diz o destino. Sem ele, o elemento vira apenas um texto e nem recebe foco pelo teclado. Aspas no conteúdo, target e nav não têm relação com isso.",
      fonte: "links-imagens.links",
      tipo: "erro",
      codigo: {
        linguagem: "html",
        trecho: "<a>Sobre mim</a>",
      },
    },
    {
      id: "html-ini-12",
      nivel: "iniciante",
      pergunta:
        "Dentro do seu próprio site, por que o caminho relativo é preferível ao absoluto?",
      alternativas: {
        a: "Porque o caminho relativo dispensa a extensão do arquivo",
        b: "Porque o caminho absoluto só funciona em imagens",
        c: "Porque o navegador carrega caminhos relativos duas vezes mais rápido",
        d: "Porque o projeto pode mudar de pasta sem quebrar",
      },
      correta: "d",
      explicacao:
        "O relativo parte do arquivo atual, então o conjunto continua coerente ao mudar de lugar. O absoluto fixa o endereço completo e serve para links externos; velocidade e extensão não entram na conta.",
      fonte: "links-imagens.caminhos",
    },
    {
      id: "html-ini-13",
      nivel: "iniciante",
      pergunta:
        "Qual alternativa completa a lacuna para que a lista sem ordem fique correta?",
      alternativas: { a: "ul", b: "ol", c: "dl", d: "li" },
      correta: "a",
      explicacao:
        "A lista sem ordem é ul, e o fechamento escrito exige que a abertura seja a mesma. A ol é ordenada, a dl é de descrição e li é o item, que não envolve a lista.",
      fonte: "listas-tabelas.listas",
      tipo: "completar",
      codigo: {
        linguagem: "html",
        trecho: "<____>\n  <li>HTML</li>\n  <li>CSS</li>\n</ul>",
      },
      alternativasCodigo: true,
    },
    {
      id: "html-ini-14",
      nivel: "iniciante",
      pergunta:
        "Este trecho deveria listar dois itens com marcação completa. Qual é o defeito?",
      alternativas: {
        a: "Uma lista sem ordem aceita no máximo um item",
        b: "Os itens não são fechados",
        c: "Falta o atributo type",
        d: "A lista precisa de um título antes do primeiro item",
      },
      correta: "b",
      explicacao:
        "Os dois li ficam sem tag de fechamento. O padrão permite omitir, e a marcação escrita por inteiro é a que qualquer pessoa lê sem dúvida. Não há limite de itens nem atributo type aqui.",
      fonte: "listas-tabelas.listas",
      tipo: "erro",
      codigo: {
        linguagem: "html",
        trecho: "<ul>\n  <li>HTML\n  <li>CSS\n</ul>",
      },
    },
    {
      id: "html-ini-15",
      nivel: "iniciante",
      pergunta: "Numa tabela, quando usar th em vez de td?",
      alternativas: {
        a: "Quando a célula é a primeira da tabela, qualquer que seja o conteúdo",
        b: "Quando a célula contém número em vez de texto",
        c: "Quando a célula é cabeçalho e rotula a linha ou a coluna",
        d: "Quando a tabela tem mais de três colunas",
      },
      correta: "c",
      explicacao:
        "O th marca célula de cabeçalho, e é o que permite anunciar o rótulo de cada dado. O td é a célula comum. O tipo do conteúdo, a posição e o tamanho da tabela não decidem isso.",
      fonte: "listas-tabelas.tabelas",
    },
    {
      id: "html-int-01",
      nivel: "intermediario",
      pergunta:
        "Uma página feita só de div pode ficar idêntica na tela a uma página com marcação semântica. O que se perde nela?",
      alternativas: {
        a: "A validação automática dos formulários",
        b: "A possibilidade de aplicar CSS aos elementos",
        c: "O suporte a imagens e vídeos dentro da página",
        d: "A estrutura que leitores de tela usam",
      },
      correta: "d",
      explicacao:
        "Semântica é significado, não aparência: ela alimenta atalhos de leitores de tela, a leitura de buscadores e a compreensão de quem abre o código. CSS, mídia e validação continuam funcionando.",
      fonte: "semantica.porque",
    },
    {
      id: "html-int-02",
      nivel: "intermediario",
      pergunta:
        "Qual alternativa completa a lacuna para que o topo da página, com título e navegação, fique marcado corretamente?",
      alternativas: { a: "header", b: "head", c: "main", d: "section" },
      correta: "a",
      explicacao:
        "O header é a região de topo, e o fechamento escrito confirma qual elemento se espera. O head guarda metadados e não aparece no corpo; main é o conteúdo principal e section é um bloco temático.",
      fonte: "semantica.estrutura",
      tipo: "completar",
      codigo: {
        linguagem: "html",
        trecho:
          '<____>\n  <h1>Portfólio de Ana</h1>\n  <nav><a href="#sobre">Sobre</a></nav>\n</header>',
      },
      alternativasCodigo: true,
    },
    {
      id: "html-int-03",
      nivel: "intermediario",
      pergunta:
        "Este trecho deveria marcar um bloco temático com assunto próprio dentro da página. Qual é o defeito?",
      alternativas: {
        a: "A section não pode conter parágrafos",
        b: "A section não tem título que declare o assunto",
        c: "A section precisa do atributo role para valer",
        d: "A section só pode aparecer dentro de um article",
      },
      correta: "b",
      explicacao:
        "Uma section agrupa conteúdo com assunto próprio, e é o título que declara esse assunto. Quando não há assunto a declarar, o elemento certo é a div. Parágrafos são permitidos e role não é exigido.",
      fonte: "semantica.conteudo",
      tipo: "erro",
      codigo: {
        linguagem: "html",
        trecho: "<section>\n  <p>Trabalho com front-end.</p>\n</section>",
      },
    },
    {
      id: "html-int-04",
      nivel: "intermediario",
      pergunta: "Quando div e span são a escolha certa?",
      alternativas: {
        a: "Quando o conteúdo tem assunto próprio e título",
        b: "Sempre que a página precisa de mais de uma coluna",
        c: "Quando o agrupamento existe só por aparência",
        d: "Quando o trecho precisa receber foco pelo teclado",
      },
      correta: "c",
      explicacao:
        "Os dois são neutros: servem quando não há significado a declarar. Conteúdo com assunto próprio pede section ou article, e foco por teclado pede um elemento interativo, como button ou a.",
      fonte: "semantica.div-span",
    },
    {
      id: "html-int-05",
      nivel: "intermediario",
      pergunta:
        "Qual alternativa completa a lacuna para ligar o rótulo ao campo de e-mail?",
      alternativas: { a: "aria-label", b: "id", c: "name", d: "for" },
      correta: "d",
      explicacao:
        "No label, o atributo for aponta para o id do campo. O id identifica o campo, o name nomeia o dado no envio e aria-label substituiria o texto visível, o que não é o caso aqui.",
      fonte: "formularios.label",
      tipo: "completar",
      codigo: {
        linguagem: "html",
        trecho:
          '<label ____="email">E-mail</label>\n<input type="email" id="email" name="email">',
      },
      alternativasCodigo: true,
    },
    {
      id: "html-int-06",
      nivel: "intermediario",
      pergunta:
        "Este trecho deveria ligar o rótulo ao campo, de modo que clicar no texto ponha o cursor nele. Qual é o defeito?",
      alternativas: {
        a: "O for do rótulo e o id do campo diferem",
        b: "O campo precisa vir antes do rótulo para a ligação valer",
        c: "O rótulo precisa do atributo name",
        d: "O campo de texto não aceita rótulo, só os de seleção",
      },
      correta: "a",
      explicacao:
        "O for precisa repetir exatamente o valor do id. Aqui um diz nome e o outro diz name, então o navegador não liga os dois. A ordem não importa, e todo campo aceita rótulo.",
      fonte: "formularios.label",
      tipo: "erro",
      codigo: {
        linguagem: "html",
        trecho:
          '<label for="nome">Nome</label>\n<input type="text" id="name" name="nome">',
      },
    },
    {
      id: "html-int-07",
      nivel: "intermediario",
      pergunta:
        "Num formulário que envia uma mensagem de contato, por que method igual a post é melhor que get?",
      alternativas: {
        a: "Porque post aceita mais campos que get",
        b: "Porque os dados não vão na URL",
        c: "Porque get não funciona em celulares",
        d: "Porque post dispensa o atributo action",
      },
      correta: "b",
      explicacao:
        "O get põe os dados na URL, o que é ótimo para busca compartilhável e ruim para mensagem privada. O post os envia no corpo. Ambos aceitam muitos campos, funcionam em qualquer aparelho e usam action.",
      fonte: "formularios.form",
    },
    {
      id: "html-int-08",
      nivel: "intermediario",
      pergunta:
        "Qual alternativa completa a lacuna para que o campo receba um endereço de e-mail, com teclado e validação próprios?",
      alternativas: { a: "format", b: "kind", c: "type", d: "mode" },
      correta: "c",
      explicacao:
        "O atributo type define o tipo do campo, e o valor email muda teclado, validação e controle. Os outros três não existem no input.",
      fonte: "formularios.tipos",
      tipo: "completar",
      codigo: {
        linguagem: "html",
        trecho: '<input ____="email" id="email" name="email">',
      },
      alternativasCodigo: true,
    },
    {
      id: "html-int-09",
      nivel: "intermediario",
      pergunta:
        "Este botão deveria apenas abrir um menu, sem enviar o formulário em volta. Qual é o defeito?",
      alternativas: {
        a: "Um formulário aceita no máximo um botão",
        b: "O botão precisa estar fora do formulário para funcionar",
        c: "O botão precisa de um atributo name para ser clicado",
        d: "Falta o type, e no form o padrão é enviar",
      },
      correta: "d",
      explicacao:
        "Sem type, o button dentro de um form assume submit e envia tudo ao ser clicado. Escrever type igual a button resolve. Ele pode ficar dentro do formulário, dispensa name e não há limite de botões.",
      fonte: "formularios.outros",
      tipo: "erro",
      codigo: {
        linguagem: "html",
        trecho:
          '<form action="/contato" method="post">\n  <button>Abrir menu</button>\n</form>',
      },
    },
    {
      id: "html-int-10",
      nivel: "intermediario",
      pergunta:
        "Um formulário usa required e minlength. Por que o servidor ainda precisa conferir os dados?",
      alternativas: {
        a: "Porque quem envia dados pode pular o formulário",
        b: "Porque required só vale em campos de texto",
        c: "Porque o navegador só valida depois que a página é publicada",
        d: "Porque a validação do HTML expira depois de alguns minutos",
      },
      correta: "a",
      explicacao:
        "A validação no navegador evita erro comum e dá resposta imediata, e não é barreira de segurança: qualquer cliente pode enviar dados direto. Ela vale para vários tipos de campo e não depende de publicação.",
      fonte: "formularios.validacao",
    },
    {
      id: "html-int-11",
      nivel: "intermediario",
      pergunta:
        "Qual alternativa completa a lacuna para que a viewport seja declarada corretamente?",
      alternativas: { a: "value", b: "content", c: "data", d: "size" },
      correta: "b",
      explicacao:
        "No elemento meta, o par é name e content: o name diz qual metadado e o content carrega o valor. Os outros três atributos não existem ali.",
      fonte: "head.charset-viewport",
      tipo: "completar",
      codigo: {
        linguagem: "html",
        trecho: '<meta name="viewport"\n      ____="width=device-width">',
      },
      alternativasCodigo: true,
    },
    {
      id: "html-int-12",
      nivel: "intermediario",
      pergunta:
        "Para que serve a meta description de uma página, e qual o cuidado com ela?",
      alternativas: {
        a: "Garante que a página apareça em primeiro lugar na busca",
        b: "Define o texto que aparece na aba do navegador",
        c: "Resume o conteúdo para a busca, e varia por página",
        d: "Substitui o texto alternativo das imagens da página",
      },
      correta: "c",
      explicacao:
        "A description resume a página e costuma aparecer abaixo do título no resultado de busca; repetir a mesma em todo o site desperdiça o espaço. A aba vem do title, posição não se compra com meta e alt é outro assunto.",
      fonte: "head.title-description",
    },
    {
      id: "html-int-13",
      nivel: "intermediario",
      pergunta:
        "Por que a imagem declarada em og:image precisa de endereço absoluto?",
      alternativas: {
        a: "Porque o caminho relativo só funciona depois de publicar",
        b: "Porque imagens de prévia precisam ficar em outro servidor",
        c: "Porque o Open Graph não aceita arquivos .jpg",
        d: "Porque quem monta a prévia não está no seu site",
      },
      correta: "d",
      explicacao:
        "A prévia é montada por outro serviço, a partir do endereço da sua página, então o caminho precisa ser completo. A imagem pode ficar no seu servidor, em qualquer formato comum.",
      fonte: "head.compartilhamento",
    },
    {
      id: "html-int-14",
      nivel: "intermediario",
      pergunta:
        "Este vídeo deveria aparecer com botões de play, volume e barra de progresso. Qual é o defeito?",
      alternativas: {
        a: "Falta o atributo controls",
        b: "O vídeo precisa do atributo autoplay para ser exibido",
        c: "O caminho do vídeo precisa ser absoluto",
        d: "O video não aceita width",
      },
      correta: "a",
      explicacao:
        "O controls é o que exibe a interface de reprodução. Sem ele, só JavaScript controlaria o vídeo. O autoplay inicia sozinho e não cria controles, o caminho relativo funciona e width é válido.",
      fonte: "midia.audio-video",
      tipo: "erro",
      codigo: {
        linguagem: "html",
        trecho: '<video src="apresentacao.mp4" width="600"></video>',
      },
    },
    {
      id: "html-int-15",
      nivel: "intermediario",
      pergunta:
        "Qual alternativa completa a lacuna para declarar que a faixa é uma legenda do vídeo?",
      alternativas: { a: "type", b: "kind", c: "rel", d: "role" },
      correta: "b",
      explicacao:
        "No track, o kind diz o tipo da faixa, e captions é a legenda que inclui sons relevantes. O type descreve formato de arquivo em outros elementos, rel é do link e role é de ARIA.",
      fonte: "midia.legendas",
      tipo: "completar",
      codigo: {
        linguagem: "html",
        trecho:
          '<track src="legendas.vtt" ____="captions"\n       srclang="pt-BR" label="Português">',
      },
      alternativasCodigo: true,
    },
    {
      id: "html-av-01",
      nivel: "avancado",
      pergunta:
        "Uma imagem é puramente decorativa e não acrescenta informação. O que escrever no alt dela?",
      alternativas: {
        a: "A palavra decoração, para deixar claro o papel dela",
        b: "O nome do arquivo da imagem",
        c: "O alt vazio, para que leitores de tela a ignorem",
        d: "Nada: o atributo deve ser omitido",
      },
      correta: "c",
      explicacao:
        "Imagem decorativa leva alt vazio, e assim ela é ignorada por quem ouve a página. Omitir o atributo é diferente: muitos leitores passam a anunciar o caminho do arquivo.",
      fonte: "acessibilidade.alt",
    },
    {
      id: "html-av-02",
      nivel: "avancado",
      pergunta:
        "Esta imagem apresenta um gráfico de vendas e é a única fonte desse dado na página. Qual é o defeito?",
      alternativas: {
        a: "Falta o atributo title para a imagem ser lida",
        b: "O caminho da imagem precisa ser absoluto",
        c: "A imagem precisa estar dentro de uma figure",
        d: "Falta o alt numa imagem que informa",
      },
      correta: "d",
      explicacao:
        "Imagem que informa exige alt descrevendo a informação, aqui o comportamento das vendas. Caminho relativo é válido, figure é opcional e o title não substitui o texto alternativo.",
      fonte: "acessibilidade.alt",
      tipo: "erro",
      codigo: {
        linguagem: "html",
        trecho: '<img src="grafico.png" width="600">',
      },
    },
    {
      id: "html-av-03",
      nivel: "avancado",
      pergunta:
        "Como uma pessoa que usa leitor de tela costuma percorrer uma página que não conhece?",
      alternativas: {
        a: "Por atalhos de títulos, regiões e links",
        b: "Lendo obrigatoriamente todo o conteúdo em ordem, sem atalhos",
        c: "Pelas cores e tamanhos na tela",
        d: "Apenas pelos formulários, que são a única parte anunciada",
      },
      correta: "a",
      explicacao:
        "A navegação é por saltos: lista de títulos, regiões como header, nav, main e footer, e lista de links. É a marcação semântica que cria esses atalhos; sem ela, sobra a leitura linear.",
      fonte: "acessibilidade.leitores",
    },
    {
      id: "html-av-04",
      nivel: "avancado",
      pergunta:
        "Esta página deveria ter uma região de conteúdo principal, com dois blocos dentro dela. Qual é o defeito?",
      alternativas: {
        a: "O main não pode conter títulos",
        b: "Existem dois main na mesma página",
        c: "Cada main precisa de um id diferente",
        d: "Os dois main precisam estar dentro de um header",
      },
      correta: "b",
      explicacao:
        "O main marca o conteúdo específico da página e aparece uma vez só; com dois, o atalho para o conteúdo principal deixa de significar algo. Ele aceita títulos, dispensa id e não vive dentro do header.",
      fonte: "acessibilidade.leitores",
      tipo: "erro",
      codigo: {
        linguagem: "html",
        trecho:
          "<main>\n  <h2>Sobre mim</h2>\n</main>\n<main>\n  <h2>Projetos</h2>\n</main>",
      },
    },
    {
      id: "html-av-05",
      nivel: "avancado",
      pergunta:
        "O botão mostra só um X na tela. Qual alternativa completa a lacuna para que ele seja anunciado como Fechar?",
      alternativas: { a: "role", b: "title", c: "aria-label", d: "name" },
      correta: "c",
      explicacao:
        "O aria-label dá um nome acessível ao elemento quando o conteúdo visível não basta. O title mostra dica ao passar o mouse e nem sempre é anunciado, role declara papel e name serve ao envio de formulário.",
      fonte: "acessibilidade.aria",
      tipo: "completar",
      codigo: {
        linguagem: "html",
        trecho: '<button type="button" ____="Fechar">X</button>',
      },
      alternativasCodigo: true,
    },
    {
      id: "html-av-06",
      nivel: "avancado",
      pergunta: "Por que evitar tabindex com número positivo?",
      alternativas: {
        a: "Porque ele só funciona em elementos de formulário",
        b: "Porque nenhum navegador atual reconhece o atributo",
        c: "Porque ele impede que o elemento receba foco",
        d: "Porque ele fura a ordem natural do Tab",
      },
      correta: "d",
      explicacao:
        "Número positivo cria uma fila própria, que passa na frente da ordem do documento e precisa ser mantida em toda a página. O valor zero inclui o elemento na ordem natural, e menos um o tira do Tab sem impedir foco por programação.",
      fonte: "acessibilidade.teclado",
    },
    {
      id: "html-av-07",
      nivel: "avancado",
      pergunta: "O que diz a primeira regra do ARIA?",
      alternativas: {
        a: "Não use ARIA quando existe elemento nativo",
        b: "Todo elemento interativo precisa de role",
        c: "ARIA substitui a marcação semântica em páginas modernas",
        d: "Atributos ARIA devem ser aplicados a todos os elementos de texto",
      },
      correta: "a",
      explicacao:
        "Elemento nativo já traz papel, foco e teclado prontos; ARIA descreve o que o HTML não tem, e ARIA errado mente sobre o elemento. Ele não substitui semântica nem se aplica a texto comum.",
      fonte: "acessibilidade.aria",
    },
    {
      id: "html-av-08",
      nivel: "avancado",
      pergunta:
        "Qual a diferença entre o validador do W3C e o painel Elements do DevTools?",
      alternativas: {
        a: "O validador corrige a marcação automaticamente e o painel apenas exibe erros",
        b: "O validador aponta o que foge do padrão; o painel mostra a árvore montada",
        c: "O validador funciona só em páginas publicadas e o painel só em arquivos locais",
        d: "Os dois mostram exatamente a mesma informação, com nomes diferentes",
      },
      correta: "b",
      explicacao:
        "O validador compara o seu código com o padrão; o painel mostra o resultado depois das correções silenciosas do parser, como o tbody inserido numa tabela. Nenhum dos dois corrige o arquivo por você.",
      fonte: "acessibilidade.validar",
    },
    {
      id: "html-av-09",
      nivel: "avancado",
      pergunta:
        "Este trecho deveria oferecer um controle acionável por teclado, na ordem natural da página. Qual é o defeito?",
      alternativas: {
        a: "O tabindex deveria ter um valor maior que o dos outros elementos da página",
        b: "O span precisa de um atributo id para receber foco",
        c: "Um span não é botão: não responde a Enter nem a Espaço, nem é anunciado como botão",
        d: "O texto do span precisa estar entre aspas",
      },
      correta: "c",
      explicacao:
        "Com tabindex igual a zero o span entra na ordem do Tab, e só isso: ele continua sem papel de botão e sem resposta a Enter ou Espaço. Um button traz tudo isso pronto, sem atributo nenhum.",
      fonte: "acessibilidade.teclado",
      tipo: "erro",
      codigo: {
        linguagem: "html",
        trecho: '<span tabindex="0">Enviar</span>',
      },
    },
    {
      id: "html-av-10",
      nivel: "avancado",
      pergunta:
        "No menu da página pessoal, qual alternativa completa a lacuna para que o link salte para a seção com id igual a sobre?",
      alternativas: {
        a: "/sobre",
        b: "sobre",
        c: "sobre.html",
        d: "#sobre",
      },
      correta: "d",
      explicacao:
        "O sustenido diz que o destino é um id na própria página. Sem ele, o navegador procura um arquivo chamado sobre, e sobre.html ou barra sobre levariam a outra página.",
      fonte: "projeto.roteiro",
      tipo: "completar",
      codigo: {
        linguagem: "html",
        trecho:
          '<nav>\n  <ul>\n    <li><a href="____">Sobre</a></li>\n  </ul>\n</nav>',
      },
      alternativasCodigo: true,
    },
    {
      id: "html-av-11",
      nivel: "avancado",
      pergunta:
        "No roteiro do projeto, por que validar a página antes de publicar?",
      alternativas: {
        a: "Porque o navegador conserta a marcação em silêncio",
        b: "Porque sem validação a página não abre em celulares",
        c: "Porque o validador gera o arquivo final que vai para o servidor",
        d: "Porque a publicação no GitHub Pages exige um selo de validação",
      },
      correta: "a",
      explicacao:
        "A tolerância do parser faz a página parecer certa mesmo com tag sem fechar ou id repetido. O validador lista essas falhas. Ele não gera arquivo nenhum, e a publicação não exige selo.",
      fonte: "projeto.roteiro",
    },
    {
      id: "html-av-12",
      nivel: "avancado",
      pergunta:
        "Terminada esta trilha, qual é a relação entre o que você marcou e o passo seguinte de estilo?",
      alternativas: {
        a: "O estilo substitui a marcação por classes e dispensa os elementos semânticos",
        b: "O estilo se apoia nos elementos já marcados",
        c: "A marcação é refeita quando o estilo entra",
        d: "Estilo e marcação são independentes: um não interfere no outro",
      },
      correta: "b",
      explicacao:
        "A aparência é aplicada sobre a estrutura existente, e estrutura clara reduz o esforço e o número de elementos extras. Nada é refeito nem substituído, e a escolha dos elementos afeta diretamente o estilo.",
      fonte: "projeto.caminhos",
    },
    {
      id: "html-av-13",
      nivel: "avancado",
      pergunta:
        "Este trecho deveria dar a cada seção da página pessoal um destino próprio para o menu. Qual é o defeito?",
      alternativas: {
        a: "O id de uma seção precisa repetir o texto do título",
        b: "Seções não podem ter id, apenas class",
        c: "As duas seções usam o mesmo id, e o id é único na página",
        d: "Duas seções seguidas precisam de uma div em volta",
      },
      correta: "c",
      explicacao:
        "Com dois elementos de mesmo id, o destino do link fica ambíguo e o navegador salta para o primeiro. Cada seção precisa do seu. Seções aceitam id, o valor é livre e nenhuma div é exigida.",
      fonte: "projeto.roteiro",
      tipo: "erro",
      codigo: {
        linguagem: "html",
        trecho:
          '<section id="sobre">\n  <h2>Sobre mim</h2>\n</section>\n<section id="sobre">\n  <h2>Projetos</h2>\n</section>',
      },
    },
    {
      id: "html-av-14",
      nivel: "avancado",
      pergunta:
        "Ao abrir o painel Elements, você vê um tbody que não escreveu dentro da sua tabela. O que isso significa?",
      alternativas: {
        a: "Que falta declarar o thead antes das linhas",
        b: "Que a tabela está com o fechamento errado",
        c: "Que o navegador não reconheceu as linhas da tabela",
        d: "Que o parser insere o tbody sozinho",
      },
      correta: "d",
      explicacao:
        "O tbody é inserido pelo próprio parser quando não está escrito, e é por isso que o painel mostra uma árvore diferente do arquivo. O thead é opcional e nada ali indica fechamento errado.",
      fonte: "acessibilidade.validar",
    },
    {
      id: "html-av-15",
      nivel: "avancado",
      pergunta:
        "Este trecho deveria associar a legenda à imagem. Qual é o defeito?",
      alternativas: {
        a: "O figcaption está fora do figure",
        b: "O figcaption precisa vir antes da imagem",
        c: "A figure não aceita imagens com alt",
        d: "O figcaption precisa do atributo for apontando para a imagem",
      },
      correta: "a",
      explicacao:
        "A associação existe porque o figcaption é filho do figure. Fora dele, vira um texto solto ao lado da imagem. A legenda pode vir antes ou depois dentro do figure, e não existe atributo for aqui.",
      fonte: "links-imagens.figure",
      tipo: "erro",
      codigo: {
        linguagem: "html",
        trecho:
          '<figure>\n  <img src="padaria.jpg" alt="Site da padaria">\n</figure>\n<figcaption>Projeto de 2026</figcaption>',
      },
    },
  ],
};

export default pool;
