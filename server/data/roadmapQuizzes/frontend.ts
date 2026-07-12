// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool frontend). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "frontend",
  "questions": [
    {
      "id": "frontend-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está tentando acessar um site e recebe um erro 404. O que isso significa?",
      "alternativas": {
        "a": "O servidor não conseguiu entender sua requisição.",
        "b": "O servidor não encontrou o que você pediu.",
        "c": "O servidor está temporariamente fora do ar.",
        "d": "O navegador não suporta o protocolo HTTPS."
      },
      "correta": "b",
      "explicacao": "Um erro 404 indica que o servidor não conseguiu encontrar o recurso solicitado, ou seja, a página não existe.",
      "fonte": "web.http"
    },
    {
      "id": "frontend-ini-02",
      "nivel": "iniciante",
      "pergunta": "Ao digitar um endereço de site no navegador, que papel o DNS desempenha nesse processo?",
      "alternativas": {
        "a": "Ele traduz o endereço do site para um IP.",
        "b": "Ele armazena o conteúdo do site.",
        "c": "Ele envia a requisição HTTP ao servidor.",
        "d": "Ele garante a segurança da conexão com HTTPS."
      },
      "correta": "a",
      "explicacao": "O DNS é responsável por traduzir o nome do domínio em um endereço IP que o servidor pode entender.",
      "fonte": "web.dns"
    },
    {
      "id": "frontend-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você está criando um site e precisa que os usuários vejam uma imagem. Qual atributo é essencial para a tag de imagem?",
      "alternativas": {
        "a": "src",
        "b": "href",
        "c": "title",
        "d": "style"
      },
      "correta": "a",
      "explicacao": "O atributo 'src' especifica o caminho da imagem que deve ser exibida na página.",
      "fonte": "html.conteudo"
    },
    {
      "id": "frontend-ini-04",
      "nivel": "iniciante",
      "pergunta": "Qual é a função do elemento <head> em um documento HTML?",
      "alternativas": {
        "a": "Exibir o conteúdo principal da página.",
        "b": "Definir a estrutura semântica do documento.",
        "c": "Incluir informações que não aparecem na página, como título e links de CSS.",
        "d": "Armazenar dados de formulários."
      },
      "correta": "c",
      "explicacao": "O <head> contém metadados e links para arquivos, mas não exibe conteúdo visível na página.",
      "fonte": "html.estrutura"
    },
    {
      "id": "frontend-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você deseja que um botão fique fixo no canto da tela enquanto o usuário rola a página. Qual valor de position deve usar?",
      "alternativas": {
        "a": "static",
        "b": "relative",
        "c": "fixed",
        "d": "absolute"
      },
      "correta": "c",
      "explicacao": "A posição 'fixed' fixa o elemento na janela do navegador, independentemente da rolagem da página.",
      "fonte": "css.posicionamento"
    },
    {
      "id": "frontend-ini-06",
      "nivel": "iniciante",
      "pergunta": "Ao usar o DevTools, você quer inspecionar um elemento e ver suas propriedades CSS. Qual aba você deve usar?",
      "alternativas": {
        "a": "Console",
        "b": "Network",
        "c": "Elements",
        "d": "Sources"
      },
      "correta": "c",
      "explicacao": "A aba 'Elements' permite visualizar e editar o DOM e as propriedades CSS dos elementos.",
      "fonte": "web.devtools"
    },
    {
      "id": "frontend-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você está criando um formulário e precisa garantir que um campo de texto não seja enviado vazio. Qual atributo deve ser adicionado ao campo?",
      "alternativas": {
        "a": "placeholder",
        "b": "required",
        "c": "maxlength",
        "d": "name"
      },
      "correta": "b",
      "explicacao": "O atributo 'required' impede que o formulário seja enviado se o campo estiver vazio.",
      "fonte": "html.forms"
    },
    {
      "id": "frontend-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você quer que um texto apareça em negrito e que seja importante. Qual tag semântica você deve usar?",
      "alternativas": {
        "a": "<strong>",
        "b": "<b>",
        "c": "<em>",
        "d": "<div>"
      },
      "correta": "a",
      "explicacao": "A tag <strong> é usada para marcar texto que é importante, além de aplicar o estilo de negrito.",
      "fonte": "html.semantica"
    },
    {
      "id": "frontend-ini-09",
      "nivel": "iniciante",
      "pergunta": "Qual é a principal vantagem de usar tags semânticas em HTML?",
      "alternativas": {
        "a": "Elas melhoram a aparência visual da página.",
        "b": "Elas ajudam na organização do código CSS.",
        "c": "Elas facilitam a leitura e interpretação por leitores de tela e buscadores.",
        "d": "Elas aumentam a velocidade de carregamento da página."
      },
      "correta": "c",
      "explicacao": "Tags semânticas ajudam a estruturar o conteúdo de forma que leitores de tela e buscadores possam entender melhor a hierarquia e o significado.",
      "fonte": "html.semantica"
    },
    {
      "id": "frontend-ini-10",
      "nivel": "iniciante",
      "pergunta": "Ao criar um site, você deseja que ele seja acessível a todos os usuários. O que você deve garantir em relação às imagens?",
      "alternativas": {
        "a": "Usar imagens em alta resolução.",
        "b": "Adicionar um texto alternativo com o atributo alt.",
        "c": "Usar imagens apenas em formato JPEG.",
        "d": "Colocar todas as imagens em um slideshow."
      },
      "correta": "b",
      "explicacao": "O atributo 'alt' fornece uma descrição da imagem para leitores de tela, tornando o conteúdo acessível.",
      "fonte": "html.a11y"
    },
    {
      "id": "frontend-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você está estilizando uma página e deseja que todos os parágrafos tenham a mesma cor de texto. Qual seletor você deve usar?",
      "alternativas": {
        "a": "#paragrafo",
        "b": ".paragrafo",
        "c": "p",
        "d": ".texto"
      },
      "correta": "c",
      "explicacao": "O seletor 'p' aplica a regra a todos os elementos <p> na página, garantindo que todos os parágrafos tenham a mesma cor.",
      "fonte": "css.seletores"
    },
    {
      "id": "frontend-ini-12",
      "nivel": "iniciante",
      "pergunta": "Qual é a unidade mais adequada para definir tamanhos de fonte que respeitem as configurações de acessibilidade do usuário?",
      "alternativas": {
        "a": "px",
        "b": "em",
        "c": "rem",
        "d": "vh"
      },
      "correta": "c",
      "explicacao": "A unidade 'rem' é relativa ao tamanho da fonte raiz, permitindo que a fonte escale de acordo com as preferências do usuário.",
      "fonte": "css.boxmodel"
    },
    {
      "id": "frontend-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você deseja que um botão mude de cor quando o mouse passa sobre ele. Qual propriedade CSS você deve usar?",
      "alternativas": {
        "a": "animation",
        "b": "transition",
        "c": "transform",
        "d": "hover"
      },
      "correta": "b",
      "explicacao": "A propriedade 'transition' permite que a mudança de cor ocorra suavemente quando o estado do botão muda.",
      "fonte": "css.animacoes"
    },
    {
      "id": "frontend-ini-14",
      "nivel": "iniciante",
      "pergunta": "Para publicar sua página no GitHub Pages, qual é o primeiro passo que você deve seguir?",
      "alternativas": {
        "a": "Criar um repositório público no GitHub.",
        "b": "Fazer o upload dos arquivos HTML e CSS.",
        "c": "Configurar o domínio personalizado.",
        "d": "Instalar o Git no computador."
      },
      "correta": "a",
      "explicacao": "O primeiro passo é criar um repositório público no GitHub, que servirá como a pasta para os arquivos do seu site.",
      "fonte": "primeirosite.publicar"
    },
    {
      "id": "frontend-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você está criando uma página pessoal e deseja incluir uma seção sobre você. Qual tag semântica é mais apropriada para essa seção?",
      "alternativas": {
        "a": "<section>",
        "b": "<div>",
        "c": "<article>",
        "d": "<footer>"
      },
      "correta": "a",
      "explicacao": "A tag <section> é usada para agrupar conteúdo relacionado, como uma seção sobre uma pessoa ou tema específico.",
      "fonte": "html.semantica"
    },
    {
      "id": "frontend-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está criando uma barra de navegação e precisa que o logo fique à esquerda e os links à direita. Qual propriedade do Flexbox você deve usar?",
      "alternativas": {
        "a": "display: flex; justify-content: space-between; align-items: center;",
        "b": "display: flex; justify-content: center; align-items: stretch;",
        "c": "display: flex; justify-content: flex-start; align-items: center;",
        "d": "display: flex; justify-content: space-around; align-items: baseline;"
      },
      "correta": "a",
      "explicacao": "A propriedade 'justify-content: space-between' alinha o logo à esquerda e os links à direita, enquanto 'align-items: center' centraliza verticalmente os itens.",
      "fonte": "layout.flexbox"
    },
    {
      "id": "frontend-int-02",
      "nivel": "intermediario",
      "pergunta": "Você precisa criar um layout responsivo que se adapte automaticamente ao tamanho da tela, utilizando Grid. Qual é a propriedade correta para definir as colunas?",
      "alternativas": {
        "a": "grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));",
        "b": "grid-template-columns: 1fr 2fr;",
        "c": "grid-template-columns: 3fr 1fr;",
        "d": "grid-template-columns: 1fr 1fr 1fr;"
      },
      "correta": "a",
      "explicacao": "A propriedade 'repeat(auto-fit, minmax(250px, 1fr))' permite que as colunas se ajustem automaticamente, criando um layout responsivo.",
      "fonte": "layout.grid"
    },
    {
      "id": "frontend-int-03",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um site e quer garantir que ele funcione bem em dispositivos móveis. Qual abordagem você deve adotar?",
      "alternativas": {
        "a": "Desenvolver primeiro para desktop e depois adaptar para mobile.",
        "b": "Usar media queries para ajustar o layout conforme a tela aumenta.",
        "c": "Criar um layout fixo que não muda com o tamanho da tela.",
        "d": "Usar apenas pixels para definir tamanhos e espaçamentos."
      },
      "correta": "b",
      "explicacao": "A abordagem mobile-first com media queries permite que o site seja otimizado para dispositivos móveis e depois adaptado para telas maiores.",
      "fonte": "layout.responsivo"
    },
    {
      "id": "frontend-int-04",
      "nivel": "intermediario",
      "pergunta": "Você está trabalhando em um projeto grande e percebe que o CSS está se tornando difícil de gerenciar. Qual abordagem você deve considerar para melhorar a arquitetura do CSS?",
      "alternativas": {
        "a": "Usar IDs para aumentar a especificidade das regras.",
        "b": "Implementar BEM para nomear classes de forma clara.",
        "c": "Criar classes genéricas que podem ser reutilizadas em todo o projeto.",
        "d": "Evitar o uso de pré-processadores para manter o CSS simples."
      },
      "correta": "b",
      "explicacao": "A metodologia BEM ajuda a manter a clareza e a organização do CSS, evitando problemas de especificidade e tornando o código mais legível.",
      "fonte": "layout.arquitetura"
    },
    {
      "id": "frontend-int-05",
      "nivel": "intermediario",
      "pergunta": "Você precisa armazenar um valor que não deve ser reatribuído durante a execução do seu código. Qual palavra-chave você deve usar para declarar essa variável?",
      "alternativas": {
        "a": "let",
        "b": "const",
        "c": "var",
        "d": "static"
      },
      "correta": "b",
      "explicacao": "A palavra-chave 'const' é utilizada para declarar variáveis que não podem ser reatribuídas, garantindo que o valor permaneça constante.",
      "fonte": "javascript.tipos"
    },
    {
      "id": "frontend-int-06",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo uma função que deve retornar um valor baseado em uma condição. Qual estrutura você deve usar para implementar essa lógica?",
      "alternativas": {
        "a": "for loop",
        "b": "if statement",
        "c": "while loop",
        "d": "switch case"
      },
      "correta": "b",
      "explicacao": "A estrutura 'if statement' permite que você execute blocos de código com base em condições específicas, retornando valores conforme necessário.",
      "fonte": "javascript.controle"
    },
    {
      "id": "frontend-int-07",
      "nivel": "intermediario",
      "pergunta": "Você precisa criar uma função que deve ser chamada várias vezes com diferentes valores. Qual é a melhor maneira de definir essa função?",
      "alternativas": {
        "a": "function nomeFuncao() {}",
        "b": "const nomeFuncao = () => {}",
        "c": "function nomeFuncao(param) {}",
        "d": "const nomeFuncao = param => { return param; }"
      },
      "correta": "c",
      "explicacao": "Definir a função com parâmetros permite que você passe diferentes valores para ela em cada chamada, tornando-a reutilizável.",
      "fonte": "javascript.funcoes"
    },
    {
      "id": "frontend-int-08",
      "nivel": "intermediario",
      "pergunta": "Você está lidando com um array e precisa criar um novo array que contém apenas os números pares. Qual método você deve usar?",
      "alternativas": {
        "a": "array.map()",
        "b": "array.filter()",
        "c": "array.reduce()",
        "d": "array.forEach()"
      },
      "correta": "b",
      "explicacao": "O método 'filter()' é utilizado para criar um novo array com todos os elementos que passam em um teste, neste caso, os números pares.",
      "fonte": "javascript.arrays"
    },
    {
      "id": "frontend-int-09",
      "nivel": "intermediario",
      "pergunta": "Você tem um objeto e precisa acessar uma propriedade que contém caracteres especiais. Qual método você deve usar?",
      "alternativas": {
        "a": "objeto.propriedade",
        "b": "objeto['propriedade']",
        "c": "objeto.propriedade()",
        "d": "objeto.get('propriedade')"
      },
      "correta": "b",
      "explicacao": "O acesso usando colchetes permite que você acesse propriedades que contêm caracteres especiais ou que são armazenadas em variáveis.",
      "fonte": "javascript.objetos"
    },
    {
      "id": "frontend-int-10",
      "nivel": "intermediario",
      "pergunta": "Você está criando um novo projeto e precisa dividir seu código em diferentes arquivos. Qual recurso do JavaScript você deve usar?",
      "alternativas": {
        "a": "import/export",
        "b": "require",
        "c": "include",
        "d": "module.exports"
      },
      "correta": "a",
      "explicacao": "O sistema de módulos do JavaScript permite que você use 'import' e 'export' para dividir seu código em arquivos distintos, mantendo a organização.",
      "fonte": "javascript.modulos"
    },
    {
      "id": "frontend-int-11",
      "nivel": "intermediario",
      "pergunta": "Você precisa alterar o texto de um elemento HTML usando JavaScript. Qual método você deve usar?",
      "alternativas": {
        "a": "element.innerHTML = 'Novo texto';",
        "b": "element.textContent = 'Novo texto';",
        "c": "element.setAttribute('text', 'Novo texto');",
        "d": "element.changeText('Novo texto');"
      },
      "correta": "b",
      "explicacao": "O método 'textContent' é utilizado para alterar o texto de um elemento HTML de forma segura e eficiente.",
      "fonte": "javascript.dom.manipular"
    },
    {
      "id": "frontend-int-12",
      "nivel": "intermediario",
      "pergunta": "Você está lidando com um formulário e deseja evitar que a página recarregue ao enviar. Qual método você deve usar?",
      "alternativas": {
        "a": "event.preventDefault()",
        "b": "return false;",
        "c": "stopPropagation()",
        "d": "event.stopImmediatePropagation()"
      },
      "correta": "a",
      "explicacao": "O método 'event.preventDefault()' impede que o comportamento padrão do formulário (recarregar a página) ocorra ao ser enviado.",
      "fonte": "javascript.dom.eventos"
    },
    {
      "id": "frontend-int-13",
      "nivel": "intermediario",
      "pergunta": "Você precisa armazenar uma configuração que deve ser mantida mesmo após o fechamento do navegador. Qual API você deve usar?",
      "alternativas": {
        "a": "sessionStorage",
        "b": "localStorage",
        "c": "cookie",
        "d": "memoryStorage"
      },
      "correta": "b",
      "explicacao": "O 'localStorage' é utilizado para armazenar dados que persistem mesmo após o fechamento do navegador, ao contrário do 'sessionStorage'.",
      "fonte": "javascript.dom.storage"
    },
    {
      "id": "frontend-int-14",
      "nivel": "intermediario",
      "pergunta": "Você deseja enviar dados para uma API usando o método POST. Qual é a forma correta de fazer isso com fetch?",
      "alternativas": {
        "a": "fetch(url, { method: 'GET' })",
        "b": "fetch(url, { method: 'POST', body: JSON.stringify(data) })",
        "c": "fetch(url, { method: 'PUT' })",
        "d": "fetch(url)"
      },
      "correta": "b",
      "explicacao": "Para enviar dados com o método POST, você deve especificar o método e o corpo da requisição, convertendo os dados para JSON.",
      "fonte": "apis.fetch"
    },
    {
      "id": "frontend-int-15",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo uma aplicação que precisa lidar com diferentes estados de carregamento. Qual é a abordagem correta?",
      "alternativas": {
        "a": "Mostrar um spinner apenas quando os dados estão carregando.",
        "b": "Implementar estados de carregamento, sucesso, erro e vazio.",
        "c": "Mostrar uma mensagem de erro apenas quando a requisição falha.",
        "d": "Não se preocupar com estados, já que a rede é rápida."
      },
      "correta": "b",
      "explicacao": "É fundamental implementar os quatro estados para garantir uma boa experiência do usuário em casos de carregamento, sucesso, erro e vazio.",
      "fonte": "apis.estados"
    },
    {
      "id": "frontend-av-01",
      "nivel": "avancado",
      "pergunta": "Você está criando um novo projeto React e precisa usar JSX. Qual é a primeira ação que você deve realizar?",
      "alternativas": {
        "a": "Rodar o comando `npm create vite@latest meu-app` com o template react.",
        "b": "Criar um arquivo `App.jsx` manualmente e escrever JSX nele.",
        "c": "Instalar o React e o ReactDOM separadamente antes de qualquer coisa.",
        "d": "Criar um arquivo HTML e incluir o React através de um CDN."
      },
      "correta": "a",
      "explicacao": "Rodar `npm create vite@latest meu-app` com o template react inicializa corretamente um projeto React com suporte a JSX.",
      "fonte": "react.base.jsx"
    },
    {
      "id": "frontend-av-02",
      "nivel": "avancado",
      "pergunta": "Você precisa criar um componente que exibe um título e um botão. Qual a forma correta de definir esse componente?",
      "alternativas": {
        "a": "function TituloBotao() { return <h1>Título</h1><button>Click</button>; }",
        "b": "const TituloBotao = () => { return <h1>Título</h1><button>Click</button>; };",
        "c": "function TituloBotao() { return (<><h1>Título</h1><button>Click</button></>); }",
        "d": "const TituloBotao = () => <h1>Título</h1><button>Click</button>;"
      },
      "correta": "c",
      "explicacao": "Usar um fragmento (`<>...</>`) é necessário para retornar múltiplos elementos JSX de um componente.",
      "fonte": "react.base.componentes"
    },
    {
      "id": "frontend-av-03",
      "nivel": "avancado",
      "pergunta": "Você está passando props para um componente filho. Qual é a maneira correta de desestruturar as props dentro do componente filho?",
      "alternativas": {
        "a": "function MeuComponente(props) { const { nome, idade } = props; }",
        "b": "function MeuComponente({ nome, idade }) { }",
        "c": "function MeuComponente(nome, idade) { }",
        "d": "function MeuComponente(props) { return <div>{props.nome}</div>; }"
      },
      "correta": "b",
      "explicacao": "A desestruturação das props deve ser feita diretamente na assinatura da função do componente.",
      "fonte": "react.base.props"
    },
    {
      "id": "frontend-av-04",
      "nivel": "avancado",
      "pergunta": "Você deseja manter um contador que deve ser atualizado a cada clique em um botão. Qual é a abordagem correta usando useState?",
      "alternativas": {
        "a": "const [contador, setContador] = useState(0); const incrementar = () => contador++;",
        "b": "const [contador, setContador] = useState(0); const incrementar = () => setContador(contador + 1);",
        "c": "const [contador, setContador] = useState(0); const incrementar = () => setContador(contador++);",
        "d": "const [contador, setContador] = useState(0); const incrementar = () => setContador(contador + 1); return <button onClick={incrementar}>Incrementar</button>;"
      },
      "correta": "b",
      "explicacao": "A função `setContador` deve ser usada para atualizar o estado, garantindo que o componente seja re-renderizado.",
      "fonte": "react.estado.usestate"
    },
    {
      "id": "frontend-av-05",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo uma aplicação que precisa renderizar uma lista de itens. Qual é a forma correta de renderizar essa lista com a prop key?",
      "alternativas": {
        "a": "{itens.map((item) => <Item key={item.id} />)}",
        "b": "{itens.map((item, index) => <Item key={index} />)}",
        "c": "{itens.map((item) => <Item key={item.nome} />)}",
        "d": "{itens.map((item) => <Item key={item} />)}"
      },
      "correta": "a",
      "explicacao": "Usar um id único e estável como key ajuda o React a identificar quais itens mudaram, foram adicionados ou removidos.",
      "fonte": "react.estado.renderizacao"
    },
    {
      "id": "frontend-av-06",
      "nivel": "avancado",
      "pergunta": "Você precisa buscar dados de uma API quando um componente é montado. Qual é a forma correta de usar o useEffect para isso?",
      "alternativas": {
        "a": "useEffect(() => { fetchData(); }, []);",
        "b": "useEffect(() => { fetchData(); });",
        "c": "useEffect(fetchData, []);",
        "d": "useEffect(() => { fetchData(); }, [data]);"
      },
      "correta": "a",
      "explicacao": "O array de dependências vazio (`[]`) garante que o efeito execute apenas uma vez, quando o componente é montado.",
      "fonte": "react.estado.useeffect"
    },
    {
      "id": "frontend-av-07",
      "nivel": "avancado",
      "pergunta": "Você está lidando com prop drilling em sua aplicação. Qual é a solução mais adequada para evitar isso?",
      "alternativas": {
        "a": "Passar as props diretamente para todos os componentes intermediários.",
        "b": "Usar o useContext para fornecer o valor diretamente aos componentes que precisam dele.",
        "c": "Criar um estado global em cada componente que precisa do valor.",
        "d": "Duplicar a lógica em cada componente que precisa do valor."
      },
      "correta": "b",
      "explicacao": "O useContext permite que você evite o prop drilling ao fornecer um valor diretamente para a subárvore de componentes que precisam dele.",
      "fonte": "react.hooks.usecontext"
    },
    {
      "id": "frontend-av-08",
      "nivel": "avancado",
      "pergunta": "Você precisa manter uma referência a um elemento DOM e acessá-lo diretamente. Qual hook você deve usar?",
      "alternativas": {
        "a": "useState",
        "b": "useEffect",
        "c": "useRef",
        "d": "useContext"
      },
      "correta": "c",
      "explicacao": "O useRef permite que você mantenha uma referência a um elemento DOM e acesse suas propriedades sem causar re-render.",
      "fonte": "react.hooks.useref"
    },
    {
      "id": "frontend-av-09",
      "nivel": "avancado",
      "pergunta": "Você está tentando otimizar um cálculo que depende de uma lista grande. Qual hook você deve usar para memorizar o resultado desse cálculo?",
      "alternativas": {
        "a": "useState",
        "b": "useEffect",
        "c": "useMemo",
        "d": "useCallback"
      },
      "correta": "c",
      "explicacao": "O useMemo memoriza o resultado de um cálculo caro e só o recalcula quando suas dependências mudam.",
      "fonte": "react.hooks.usememo"
    },
    {
      "id": "frontend-av-10",
      "nivel": "avancado",
      "pergunta": "Você está extraindo lógica repetida de dois componentes diferentes. Qual é a abordagem correta para fazer isso?",
      "alternativas": {
        "a": "Criar um componente separado que encapsula a lógica.",
        "b": "Criar um hook customizado que encapsula a lógica.",
        "c": "Duplicar a lógica em ambos os componentes.",
        "d": "Usar um contexto para compartilhar a lógica."
      },
      "correta": "b",
      "explicacao": "Criar um hook customizado permite que você reutilize a lógica de forma limpa e organizada entre os componentes.",
      "fonte": "react.hooks.custom"
    },
    {
      "id": "frontend-av-11",
      "nivel": "avancado",
      "pergunta": "Você está criando um formulário controlado. Qual é a maneira correta de definir o valor do input?",
      "alternativas": {
        "a": "<input value={valor} onChange={setValor(e.target.value)} />",
        "b": "<input value={valor} onChange={(e) => setValor(e.target.value)} />",
        "c": "<input value={setValor} onChange={valor} />",
        "d": "<input onChange={(e) => setValor(e.target.value)} />"
      },
      "correta": "b",
      "explicacao": "O valor do input deve ser controlado pelo estado, e o onChange deve atualizar esse estado corretamente.",
      "fonte": "react.forms"
    },
    {
      "id": "frontend-av-12",
      "nivel": "avancado",
      "pergunta": "Você está implementando roteamento em sua aplicação. Qual é a maneira correta de definir um link para navegar entre páginas?",
      "alternativas": {
        "a": "<a href='/produtos'>Produtos</a>",
        "b": "<Link to='/produtos'>Produtos</Link>",
        "c": "<NavLink to='/produtos'>Produtos</NavLink>",
        "d": "<RouterLink to='/produtos'>Produtos</RouterLink>"
      },
      "correta": "b",
      "explicacao": "O componente Link do React Router permite a navegação sem recarregar a página e preserva o estado da aplicação.",
      "fonte": "react.routing"
    },
    {
      "id": "frontend-av-13",
      "nivel": "avancado",
      "pergunta": "Você precisa buscar dados de uma API e gerenciar o estado de carregamento e erro. Qual biblioteca você deve considerar para simplificar esse processo?",
      "alternativas": {
        "a": "Axios",
        "b": "TanStack Query",
        "c": "Redux",
        "d": "React Router"
      },
      "correta": "b",
      "explicacao": "TanStack Query (anteriormente React Query) simplifica o gerenciamento de dados, cache e estados de carregamento e erro.",
      "fonte": "react.fetching"
    },
    {
      "id": "frontend-av-14",
      "nivel": "avancado",
      "pergunta": "Você está lidando com estado global na sua aplicação. Qual é a abordagem mais adequada para gerenciar esse estado?",
      "alternativas": {
        "a": "Usar apenas props para passar o estado entre componentes.",
        "b": "Usar Context API para compartilhar estado entre componentes distantes.",
        "c": "Criar um novo estado em cada componente que precisa dos dados.",
        "d": "Usar apenas Redux para gerenciar o estado."
      },
      "correta": "b",
      "explicacao": "A Context API é uma solução adequada para gerenciar estado global sem prop drilling.",
      "fonte": "react.estadoglobal"
    },
    {
      "id": "frontend-av-15",
      "nivel": "avancado",
      "pergunta": "Você precisa implementar um fallback para erros de renderização em sua aplicação. Qual é a abordagem correta?",
      "alternativas": {
        "a": "Usar um try/catch dentro do render.",
        "b": "Criar um Error Boundary para capturar erros de renderização.",
        "c": "Adicionar um estado de erro em cada componente.",
        "d": "Usar um console.error para registrar erros."
      },
      "correta": "b",
      "explicacao": "Um Error Boundary permite capturar erros de renderização e exibir um fallback amigável.",
      "fonte": "react.errorboundary"
    }
  ]
};

export default pool;
