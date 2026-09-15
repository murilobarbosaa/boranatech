// POOL ESCRITA A MAO no Lote 09, sem gerador de IA: a trilha de CSS nao tem
// runner, e geracao automatica em trilha sem runner ja se mostrou negativa
// (na pool de Git, 18 de 19 perguntas de codigo sairam semanticamente
// erradas). Cada pergunta foi escrita e conferida pela revisao humana do
// lote, com a coluna estrutural de verify:quiz-pool --tabela-revisao, que
// no Lote 09 passou a valer para css (parser e lexer do css-tree).
//
// SERVER-ONLY: este arquivo contem o GABARITO; NUNCA importar, direta ou
// indiretamente, de client/src. Ids sao estaveis: tentativas de usuarios os
// referenciam.
//
// CSS nao tem saida de terminal nem motor de renderizacao aqui: nao ha
// pergunta do tipo saida e nenhum codigo.saidaEsperada.
//
// TODO(Ana): revisao editorial dos enunciados e das explicacoes.
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  slug: "css",
  questions: [
    {
      id: "css-ini-01",
      nivel: "iniciante",
      pergunta: "Qual é a responsabilidade do CSS numa página web?",
      alternativas: {
        a: "Descrever a aparência do conteúdo já marcado",
        b: "Dar significado a cada parte do conteúdo",
        c: "Guardar os dados que o formulário envia",
        d: "Definir o comportamento dos botões",
      },
      correta: "a",
      explicacao:
        "O HTML nomeia as partes do conteúdo e o CSS descreve como elas aparecem. Significado é do HTML, comportamento é do JavaScript e dados ficam no servidor.",
      fonte: "fundamentos.oque",
    },
    {
      id: "css-ini-02",
      nivel: "iniciante",
      pergunta:
        "Qual alternativa completa a lacuna para ligar uma folha de estilos externa à página?",
      alternativas: {
        a: 'type="text/style"',
        b: 'rel="stylesheet"',
        c: 'kind="css"',
        d: 'as="style"',
      },
      correta: "b",
      explicacao:
        "O elemento link declara a relação com rel, e o valor stylesheet é o que diz ao navegador que aquele arquivo é a folha de estilos. Os outros três atributos não cumprem esse papel.",
      fonte: "fundamentos.ligar",
      tipo: "completar",
      codigo: {
        linguagem: "html",
        trecho: '<link ____ href="estilos.css">',
      },
      alternativasCodigo: true,
    },
    {
      id: "css-ini-03",
      nivel: "iniciante",
      pergunta:
        "Por que o atributo style, escrito no elemento, é desaconselhado?",
      alternativas: {
        a: "Ele só funciona em navegadores antigos",
        b: "Ele é ignorado quando existe folha externa",
        c: "Ele mistura aparência e conteúdo na marcação",
        d: "Ele exige que a página seja publicada para valer",
      },
      correta: "c",
      explicacao:
        "Estilo no atributo vale para um elemento só, fica no meio da marcação e é difícil de sobrescrever. Ele funciona em qualquer navegador e não depende de publicação: o problema é de manutenção.",
      fonte: "fundamentos.ligar",
    },
    {
      id: "css-ini-04",
      nivel: "iniciante",
      pergunta: "Numa regra de CSS, o que é a declaração?",
      alternativas: {
        a: "O nome do elemento antes das chaves",
        b: "Todo o conteúdo entre as chaves",
        c: "O comentário que explica a regra",
        d: "O par de propriedade e valor",
      },
      correta: "d",
      explicacao:
        "A declaração é color: red, por exemplo: propriedade, dois-pontos, valor. O que vem antes das chaves é o seletor, e o conjunto entre chaves é o bloco.",
      fonte: "fundamentos.regra",
    },
    {
      id: "css-ini-05",
      nivel: "iniciante",
      pergunta:
        "Este trecho deveria pintar o parágrafo de azul. Qual é o defeito?",
      alternativas: {
        a: "Falta o dois-pontos entre a propriedade e o valor",
        b: "O nome da cor precisa estar entre aspas",
        c: "O seletor p não alcança parágrafos",
        d: "Falta o ponto e vírgula no fim",
      },
      correta: "a",
      explicacao:
        "Sem os dois-pontos a declaração não é válida, e o navegador a descarta em silêncio. Nome de cor não leva aspas, o seletor está certo e o ponto e vírgula está escrito.",
      fonte: "fundamentos.regra",
      tipo: "erro",
      codigo: {
        linguagem: "css",
        trecho: "p {\n  color blue;\n}",
      },
    },
    {
      id: "css-ini-06",
      nivel: "iniciante",
      pergunta:
        "Por que convém escrever as regras gerais antes das específicas na folha?",
      alternativas: {
        a: "Porque o navegador lê o arquivo de baixo para cima",
        b: "Porque no empate de força vence a última escrita",
        c: "Porque regras gerais são ignoradas depois da metade do arquivo",
        d: "Porque só a primeira regra de cada seletor é aplicada",
      },
      correta: "b",
      explicacao:
        "Com a mesma especificidade, a ordem decide, e o que vem depois vence. Escrever do geral para o específico faz o específico vencer sem esforço.",
      fonte: "fundamentos.organizar",
    },
    {
      id: "css-ini-07",
      nivel: "iniciante",
      pergunta:
        'Qual alternativa completa a lacuna para alcançar todo elemento com class="aviso"?',
      alternativas: {
        a: "#aviso",
        b: "aviso",
        c: ".aviso",
        d: "*aviso",
      },
      correta: "c",
      explicacao:
        "Classe é selecionada com ponto na frente do nome. A cerquilha é de id, o nome solto é seletor de tipo e o asterisco é o seletor universal.",
      fonte: "seletores.basicos",
      tipo: "completar",
      codigo: {
        linguagem: "css",
        trecho: "____ {\n  color: #b91c1c;\n}",
      },
      alternativasCodigo: true,
    },
    {
      id: "css-ini-08",
      nivel: "iniciante",
      pergunta: "Por que a trilha recomenda preferir classe a id para estilo?",
      alternativas: {
        a: "O id não pode ser usado junto com CSS",
        b: "A classe é aplicada antes do id pelo navegador",
        c: "O id só funciona em elementos de formulário",
        d: "A classe se repete e não cria degrau de força",
      },
      correta: "d",
      explicacao:
        "O id é único por página e vence qualquer classe na conta de especificidade, criando um degrau difícil de sobrescrever. Classe se reaproveita e deixa a ordem decidir.",
      fonte: "seletores.basicos",
    },
    {
      id: "css-ini-09",
      nivel: "iniciante",
      pergunta:
        "Qual alternativa completa a lacuna para alcançar somente os links que são filhos diretos da navegação?",
      alternativas: {
        a: ">",
        b: "+",
        c: "~",
        d: ",",
      },
      correta: "a",
      explicacao:
        "O sinal de maior é o combinador de filho: só o nível imediatamente abaixo. O mais pega o irmão seguinte, o til pega os irmãos posteriores e a vírgula formaria uma lista de dois seletores.",
      fonte: "seletores.combinadores",
      tipo: "completar",
      codigo: {
        linguagem: "css",
        trecho: "nav ____ a {\n  color: #1d4ed8;\n}",
      },
      alternativasCodigo: true,
    },
    {
      id: "css-ini-10",
      nivel: "iniciante",
      pergunta:
        "Este trecho deveria aplicar a mesma fonte aos títulos de nível 1 e 2. Qual é o defeito?",
      alternativas: {
        a: "Falta o ponto antes de cada nome de elemento",
        b: "Sem a vírgula, o seletor virou h2 dentro de h1",
        c: "Títulos não aceitam a propriedade font-family",
        d: "A pilha de fontes precisa de aspas em todos os nomes",
      },
      correta: "b",
      explicacao:
        "Espaço entre dois seletores é o combinador descendente: h1 h2 alcança um h2 dentro de um h1, que quase nunca existe. A lista pede vírgula.",
      fonte: "seletores.agrupar",
      tipo: "erro",
      codigo: {
        linguagem: "css",
        trecho: "h1 h2 {\n  font-family: Georgia, serif;\n}",
      },
    },
    {
      id: "css-ini-11",
      nivel: "iniciante",
      pergunta: "Por que :focus-visible não deve ser removido sem substituto?",
      alternativas: {
        a: "Ele é obrigatório para o link funcionar",
        b: "Sem ele o :hover deixa de valer",
        c: "Ele é a pista de onde está quem navega por teclado",
        d: "Ele define a ordem em que o Tab percorre a página",
      },
      correta: "c",
      explicacao:
        "O contorno de foco mostra o elemento atual para quem usa Tab. Removê-lo sem outra pista visual deixa a pessoa perdida. Ele não afeta o funcionamento do link nem a ordem do Tab.",
      fonte: "seletores.pseudo-classes",
    },
    {
      id: "css-ini-12",
      nivel: "iniciante",
      pergunta:
        "Este trecho deveria acrescentar um texto depois do link. Qual é o defeito?",
      alternativas: {
        a: "O pseudo-elemento precisa de um único dois-pontos",
        b: "Só ::before aceita texto, ::after não",
        c: "O seletor precisa de uma classe para funcionar",
        d: "Falta a propriedade content no pseudo-elemento",
      },
      correta: "d",
      explicacao:
        "Em ::before e ::after o content é obrigatório: sem ele o pseudo-elemento não é gerado. Os dois aceitam texto e a notação de dois dois-pontos está correta.",
      fonte: "seletores.pseudo-elementos",
      tipo: "erro",
      codigo: {
        linguagem: "css",
        trecho: "a::after {\n  color: #64748b;\n}",
      },
    },
    {
      id: "css-ini-13",
      nivel: "iniciante",
      pergunta:
        "Duas regras com o mesmo seletor pedem cores diferentes. Qual vence?",
      alternativas: {
        a: "A que estiver escrita por último na folha",
        b: "A que estiver escrita primeiro na folha",
        c: "A que tiver o valor de cor mais escuro",
        d: "Nenhuma: o navegador ignora as duas",
      },
      correta: "a",
      explicacao:
        "Com a mesma especificidade, a cascata decide pela ordem, e a última palavra vale. É por isso que uma regra que parece não funcionar costuma ter uma gêmea mais abaixo.",
      fonte: "cascata.ordem",
    },
    {
      id: "css-ini-14",
      nivel: "iniciante",
      pergunta: "Entre #topo e .menu a, qual seletor vence?",
      alternativas: {
        a: ".menu a, porque tem mais partes",
        b: "#topo, porque id vence classe",
        c: ".menu a, porque alcança menos elementos",
        d: "Depende de qual aparece por último na folha",
      },
      correta: "b",
      explicacao:
        "A conta compara primeiro os ids: 1 contra 0 já decide, e nem se olha o resto. A ordem só entra quando a especificidade empata.",
      fonte: "cascata.especificidade",
    },
    {
      id: "css-ini-15",
      nivel: "iniciante",
      pergunta: "Qual destas propriedades é herdada pelos elementos filhos?",
      alternativas: {
        a: "margin",
        b: "border",
        c: "font-family",
        d: "background-color",
      },
      correta: "c",
      explicacao:
        "Propriedades de texto descem na árvore; as de caixa, não. É por isso que definir a fonte no body basta para a página inteira, mas a margem precisa ser escrita onde se quer.",
      fonte: "cascata.heranca",
    },
    {
      id: "css-int-01",
      nivel: "intermediario",
      pergunta:
        "Qual é o principal problema de usar !important para resolver um conflito?",
      alternativas: {
        a: "Ele deixa o carregamento da página mais lento",
        b: "Ele só funciona em folhas externas",
        c: "Ele desliga a herança naquele elemento",
        d: "Só outro !important muda a regra depois",
      },
      correta: "d",
      explicacao:
        "A marca tira a declaração da disputa normal, e o próximo ajuste precisa da mesma marca. Em pouco tempo há uma segunda disputa por cima da primeira. Ele não afeta desempenho nem herança.",
      fonte: "cascata.important",
    },
    {
      id: "css-int-02",
      nivel: "intermediario",
      pergunta:
        "Qual alternativa completa a lacuna para declarar preto com metade da opacidade?",
      alternativas: {
        a: "rgb(0 0 0 / 50%)",
        b: "rgb(0 0 0 50%)",
        c: "hex(#000000, 0.5)",
        d: "opacity(#000000 50%)",
      },
      correta: "a",
      explicacao:
        "Na notação com espaços, a transparência vem depois de uma barra. Sem a barra a cor é inválida, e hex() e opacity() não existem como funções de cor.",
      fonte: "texto-cores.cores",
      tipo: "completar",
      codigo: {
        linguagem: "css",
        trecho: ".sombra {\n  background-color: ____;\n}",
      },
      alternativasCodigo: true,
    },
    {
      id: "css-int-03",
      nivel: "intermediario",
      pergunta:
        "Por que uma pilha de fontes deve terminar numa família genérica?",
      alternativas: {
        a: "Porque o navegador exige pelo menos três nomes",
        b: "Para garantir uma fonte se as outras faltarem",
        c: "Porque a genérica define o peso do texto",
        d: "Porque sem ela a fonte não é herdada pelos filhos",
      },
      correta: "b",
      explicacao:
        "A família genérica, como serif ou sans-serif, existe em qualquer sistema e é a última garantia da pilha. Ela não tem relação com peso nem com herança.",
      fonte: "texto-cores.fontes",
    },
    {
      id: "css-int-04",
      nivel: "intermediario",
      pergunta:
        "Qual é a vantagem de usar rem em vez de px no tamanho do texto?",
      alternativas: {
        a: "O rem é convertido em px pelo servidor",
        b: "O rem impede que o texto quebre em mais de uma linha",
        c: "O texto acompanha a fonte do navegador",
        d: "O rem é a única unidade aceita em media queries",
      },
      correta: "c",
      explicacao:
        "O rem é relativo à fonte da raiz, então quem aumentou a letra do navegador recebe tudo proporcionalmente maior. Media query aceita px também, e nenhuma unidade controla quebra de linha.",
      fonte: "texto-cores.unidades",
    },
    {
      id: "css-int-05",
      nivel: "intermediario",
      pergunta:
        "Qual é o risco de usar cinza-claro sobre fundo branco em texto corrido?",
      alternativas: {
        a: "O navegador troca a cor por preto automaticamente",
        b: "O texto deixa de ser selecionável",
        c: "A fonte perde o peso declarado",
        d: "O contraste fica baixo demais para muita gente ler",
      },
      correta: "d",
      explicacao:
        "Contraste insuficiente é o problema de legibilidade mais comum da web, e afeta quem lê no sol, em tela barata ou com baixa visão. A recomendação corrente é pelo menos 4,5 para 1 em texto normal.",
      fonte: "texto-cores.texto",
    },
    {
      id: "css-int-06",
      nivel: "intermediario",
      pergunta: "Qual é a diferença entre padding e margin?",
      alternativas: {
        a: "O padding é espaço por dentro da borda e o margin por fora",
        b: "O padding só aceita pixels e o margin aceita qualquer unidade",
        c: "O padding afeta elementos inline e o margin não",
        d: "O padding é sempre transparente e o margin recebe o fundo",
      },
      correta: "a",
      explicacao:
        "O padding fica entre o conteúdo e a borda e é pintado pelo fundo do elemento; a margem separa o elemento dos vizinhos e é sempre transparente, e não o contrário.",
      fonte: "box-model.caixa",
    },
    {
      id: "css-int-07",
      nivel: "intermediario",
      pergunta:
        "Qual alternativa completa a lacuna para a largura declarada incluir padding e borda?",
      alternativas: {
        a: "content-box",
        b: "border-box",
        c: "padding-box",
        d: "margin-box",
      },
      correta: "b",
      explicacao:
        "Com border-box a width passa a valer para a caixa inteira até a borda. O content-box é o padrão, e os outros dois valores não existem nessa propriedade.",
      fonte: "box-model.box-sizing",
      tipo: "completar",
      codigo: {
        linguagem: "css",
        trecho: "*,\n*::before,\n*::after {\n  box-sizing: ____;\n}",
      },
      alternativasCodigo: true,
    },
    {
      id: "css-int-08",
      nivel: "intermediario",
      pergunta:
        "Este trecho deveria dar uma largura fixa ao destaque, que é um span. Qual é o defeito?",
      alternativas: {
        a: "A unidade rem não vale para largura",
        b: "Falta declarar a altura junto com a largura",
        c: "Um span é inline e ignora width",
        d: "O seletor de classe não alcança um span",
      },
      correta: "c",
      explicacao:
        "Um span nasce inline e não aceita width nem height. A correção é display inline-block ou block. A unidade está certa, altura não é exigida e classe alcança qualquer elemento.",
      fonte: "box-model.display",
      tipo: "erro",
      codigo: {
        linguagem: "css",
        trecho: ".destaque {\n  width: 12rem;\n}",
      },
    },
    {
      id: "css-int-09",
      nivel: "intermediario",
      pergunta:
        "Um parágrafo tem margin-bottom de 20px e o seguinte tem margin-top de 30px. Qual é o espaço entre eles?",
      alternativas: {
        a: "50px, porque as margens se somam",
        b: "20px, porque vale a do elemento de cima",
        c: "0px, porque uma anula a outra",
        d: "30px, porque as margens verticais colapsam",
      },
      correta: "d",
      explicacao:
        "Margens verticais encostadas colapsam e vale a maior das duas. Elas só somariam se os dois parágrafos fossem itens de flex ou de grid, onde margem não colapsa.",
      fonte: "box-model.margens",
    },
    {
      id: "css-int-10",
      nivel: "intermediario",
      pergunta:
        "Este trecho deveria centralizar o bloco na página. Qual é o defeito?",
      alternativas: {
        a: "Sem largura limitada, não sobra o que dividir",
        b: "O valor auto não vale para margem horizontal",
        c: "Falta declarar text-align: center",
        d: "A margem precisa ser declarada em porcentagem",
      },
      correta: "a",
      explicacao:
        "O auto divide o espaço que sobra, e só sobra espaço se o bloco tiver max-width ou width. O text-align centralizaria o texto dentro da caixa, não a caixa.",
      fonte: "box-model.margens",
      tipo: "erro",
      codigo: {
        linguagem: "css",
        trecho: ".conteudo {\n  margin: 0 auto;\n}",
      },
    },
    {
      id: "css-int-11",
      nivel: "intermediario",
      pergunta:
        "Qual alternativa completa a lacuna para a tabela rolar de lado só quando não couber?",
      alternativas: {
        a: "scroll",
        b: "auto",
        c: "hidden",
        d: "visible",
      },
      correta: "b",
      explicacao:
        "O auto decide pela necessidade. O scroll mostra a barra sempre, o hidden corta o excesso em silêncio e o visible, que é o padrão, deixa o conteúdo vazar.",
      fonte: "box-model.overflow",
      tipo: "completar",
      codigo: {
        linguagem: "css",
        trecho: ".tabela-larga {\n  overflow-x: ____;\n}",
      },
      alternativasCodigo: true,
    },
    {
      id: "css-int-12",
      nivel: "intermediario",
      pergunta:
        "Este trecho deveria distribuir os links do menu em uma linha. Qual é o defeito?",
      alternativas: {
        a: "Falta declarar flex-direction: row",
        b: "Links não podem ser itens flex",
        c: "O display: flex está no item, e não no pai",
        d: "Falta a propriedade gap para os itens se separarem",
      },
      correta: "c",
      explicacao:
        "O display: flex vai no container, e são os filhos dele que mudam de comportamento. Escrito no próprio link, ele torna o link um container para os filhos dele. A direção row é o padrão.",
      fonte: "flexbox.container",
      tipo: "erro",
      codigo: {
        linguagem: "css",
        trecho: ".menu a {\n  display: flex;\n}",
      },
    },
    {
      id: "css-int-13",
      nivel: "intermediario",
      pergunta:
        "Num container com flex-direction: row, o que align-items controla?",
      alternativas: {
        a: "O alinhamento na horizontal, que é o eixo principal",
        b: "A ordem em que os itens aparecem",
        c: "A quebra de linha quando falta espaço",
        d: "O alinhamento na vertical, que é o eixo cruzado",
      },
      correta: "d",
      explicacao:
        "O align-items age no eixo cruzado, que com direction row é a vertical. O eixo principal é do justify-content, e a quebra é do flex-wrap.",
      fonte: "flexbox.alinhar",
    },
    {
      id: "css-int-14",
      nivel: "intermediario",
      pergunta:
        "Qual alternativa completa a lacuna para os cartões descerem de linha quando não couberem?",
      alternativas: {
        a: "flex-wrap: wrap",
        b: "flex-flow: break",
        c: "flex-shrink: 0",
        d: "flex-basis: auto",
      },
      correta: "a",
      explicacao:
        "Por padrão o container flex mantém tudo em uma linha, comprimindo os itens. O wrap autoriza a quebra. As outras três declarações não tratam disso.",
      fonte: "flexbox.gap-wrap",
      tipo: "completar",
      codigo: {
        linguagem: "css",
        trecho: ".galeria {\n  display: flex;\n  ____;\n  gap: 1rem;\n}",
      },
      alternativasCodigo: true,
    },
    {
      id: "css-int-15",
      nivel: "intermediario",
      pergunta: "O que flex: 1 faz num item de um container flex?",
      alternativas: {
        a: "Fixa a largura do item em uma fração da tela",
        b: "Faz os itens repartirem o espaço livre",
        c: "Impede o item de encolher quando falta espaço",
        d: "Coloca o item em primeiro lugar na linha",
      },
      correta: "b",
      explicacao:
        "O atalho flex: 1 equivale a crescer, encolher e partir de zero, então os itens repartem o espaço igualmente. Ele não fixa largura nem muda a ordem.",
      fonte: "flexbox.itens",
    },
    {
      id: "css-av-01",
      nivel: "avancado",
      pergunta: "O que a unidade fr representa numa grade?",
      alternativas: {
        a: "Uma fração da largura total da janela",
        b: "Um décimo do tamanho da fonte da raiz",
        c: "Uma fração do espaço livre da grade",
        d: "Uma porcentagem da altura do container",
      },
      correta: "c",
      explicacao:
        "O fr reparte o espaço livre, já descontados os tamanhos fixos e os gaps. É por isso que 1fr 1fr 1fr com gap continua dando colunas iguais, e três colunas de 33,3% estouram.",
      fonte: "grid.colunas",
    },
    {
      id: "css-av-02",
      nivel: "avancado",
      pergunta:
        "Qual alternativa completa a lacuna para criar três colunas de tamanho igual?",
      alternativas: {
        a: "repeat(3, 33%)",
        b: "columns(3)",
        c: "3 x 1fr",
        d: "repeat(3, 1fr)",
      },
      correta: "d",
      explicacao:
        "O repeat com fr reparte o espaço livre entre as três colunas, e continua correto com gap. Porcentagem somando 100% estoura assim que entra espaço entre as colunas; as outras duas formas não existem.",
      fonte: "grid.colunas",
      tipo: "completar",
      codigo: {
        linguagem: "css",
        trecho:
          ".galeria {\n  display: grid;\n  grid-template-columns: ____;\n  gap: 1rem;\n}",
      },
      alternativasCodigo: true,
    },
    {
      id: "css-av-03",
      nivel: "avancado",
      pergunta:
        "Qual alternativa completa a lacuna para o item ocupar as duas primeiras colunas da grade?",
      alternativas: {
        a: "1 / 3",
        b: "1 / 2",
        c: "2 / 3",
        d: "span 3",
      },
      correta: "a",
      explicacao:
        "Os números são linhas da grade, e o segundo é onde o item termina: da linha 1 à 3 são duas colunas. Com 1 / 2 ou 2 / 3 o item ocupa uma coluna só, e span 3 ocuparia três.",
      fonte: "grid.posicionar",
      tipo: "completar",
      codigo: {
        linguagem: "css",
        trecho: ".destaque {\n  grid-column: ____;\n}",
      },
      alternativasCodigo: true,
    },
    {
      id: "css-av-04",
      nivel: "avancado",
      pergunta:
        "Este trecho deveria criar um cabeçalho ocupando as duas colunas. Qual é o defeito?",
      alternativas: {
        a: "Nomes de área precisam começar com ponto",
        b: "Os dois nomes da primeira linha são diferentes",
        c: "grid-template-areas não aceita mais de uma linha",
        d: "Falta declarar grid-template-columns junto",
      },
      correta: "b",
      explicacao:
        "Uma área que atravessa células se forma repetindo o MESMO nome nelas. Com dois nomes diferentes saem duas áreas de uma célula cada.",
      fonte: "grid.areas",
      tipo: "erro",
      codigo: {
        linguagem: "css",
        trecho:
          '.pagina {\n  display: grid;\n  grid-template-areas:\n    "cabecalho topo"\n    "lateral conteudo";\n}',
      },
    },
    {
      id: "css-av-05",
      nivel: "avancado",
      pergunta: "O que repeat(auto-fit, minmax(15rem, 1fr)) produz?",
      alternativas: {
        a: "Sempre 15 colunas de 1rem cada",
        b: "Uma coluna que cresce até 15rem e para",
        c: "Quantas colunas couberem, cada uma com pelo menos 15rem",
        d: "Colunas fixas de 15rem, com rolagem horizontal quando faltar espaço",
      },
      correta: "c",
      explicacao:
        "O auto-fit substitui o número de repetições por quantas couberem, e o minmax dá o piso e o teto de cada uma. É a galeria responsiva sem media query.",
      fonte: "grid.automatico",
    },
    {
      id: "css-av-06",
      nivel: "avancado",
      pergunta: "O que significa escrever CSS mobile-first?",
      alternativas: {
        a: "Carregar uma folha de estilos diferente no celular",
        b: "Detectar o aparelho e servir outra página",
        c: "Declarar todas as medidas em unidades de viewport",
        d: "Escrever a base estreita e acrescentar depois",
      },
      correta: "d",
      explicacao:
        "Mobile-first é ordem de escrita: a base vale para a tela estreita, e as media queries de min-width acrescentam o que a tela larga ganha. Não há troca de folha nem detecção de aparelho.",
      fonte: "responsivo.mobile-first",
    },
    {
      id: "css-av-07",
      nivel: "avancado",
      pergunta:
        "Qual alternativa completa a lacuna para a regra valer de 48rem de largura para cima?",
      alternativas: {
        a: "min-width: 48rem",
        b: "max-width: 48rem",
        c: "min-size: 48rem",
        d: "screen: 48rem",
      },
      correta: "a",
      explicacao:
        "O min-width é a condição de piso, que combina com o mobile-first. O max-width faz o contrário, min-size não é uma media feature e screen é tipo de mídia, não condição com valor.",
      fonte: "responsivo.media",
      tipo: "completar",
      codigo: {
        linguagem: "css",
        trecho:
          "@media (____) {\n  .galeria {\n    grid-template-columns: 1fr 1fr;\n  }\n}",
      },
      alternativasCodigo: true,
    },
    {
      id: "css-av-08",
      nivel: "avancado",
      pergunta:
        "No roteiro do projeto, por que as variáveis e o reset vêm antes de tudo?",
      alternativas: {
        a: "Porque o navegador só lê variáveis no início do arquivo",
        b: "Porque valem para a página inteira, e não para uma parte",
        c: "Porque o reset precisa vir antes da tag link",
        d: "Porque variáveis declaradas depois não são herdadas",
      },
      correta: "b",
      explicacao:
        "A ordem vai do que vale para a página toda até o detalhe, e assim cada etapa se apoia na anterior. Variável pode ser declarada em qualquer ponto do arquivo; o motivo é de trabalho, não de sintaxe.",
      fonte: "projeto.roteiro",
    },
    {
      id: "css-av-09",
      nivel: "avancado",
      pergunta:
        "Este trecho deveria impedir a imagem de estourar a tela, sem distorcer. Qual é o defeito?",
      alternativas: {
        a: "max-width não vale para imagens",
        b: "Falta declarar display: block",
        c: "A altura fixa não acompanha a largura e distorce",
        d: "A largura precisa ser declarada em pixels",
      },
      correta: "c",
      explicacao:
        "O max-width reduz a largura, mas a altura continua em 400px, e a proporção se perde. O par que resolve é max-width: 100% com height: auto.",
      fonte: "responsivo.imagens",
      tipo: "erro",
      codigo: {
        linguagem: "css",
        trecho: "img {\n  max-width: 100%;\n  height: 400px;\n}",
      },
    },
    {
      id: "css-av-10",
      nivel: "avancado",
      pergunta:
        "Por que os limites de um clamp() de tamanho de fonte devem estar em rem?",
      alternativas: {
        a: "Porque o clamp não aceita px",
        b: "Porque rem é mais preciso que vw",
        c: "Porque só rem funciona dentro de media query",
        d: "Para respeitar quem aumentou a fonte no navegador",
      },
      correta: "d",
      explicacao:
        "Tamanho que depende só de vw ignora a configuração de fonte do navegador, porque a janela não muda por causa dela. Limites em rem devolvem esse controle a quem lê.",
      fonte: "responsivo.fluido",
    },
    {
      id: "css-av-11",
      nivel: "avancado",
      pergunta:
        "Qual alternativa completa a lacuna para usar o valor guardado em --cor-principal?",
      alternativas: {
        a: "var(--cor-principal)",
        b: "--cor-principal",
        c: "$cor-principal",
        d: "value(--cor-principal)",
      },
      correta: "a",
      explicacao:
        "Propriedade customizada se declara com dois hifens e se lê com var(). O nome sozinho não é valor, o cifrão é de pré-processador e value() não existe.",
      fonte: "moderno.variaveis",
      tipo: "completar",
      codigo: {
        linguagem: "css",
        trecho: ".botao {\n  background-color: ____;\n}",
      },
      alternativasCodigo: true,
    },
    {
      id: "css-av-12",
      nivel: "avancado",
      pergunta:
        "Este trecho deveria colocar o selo na frente do cartão, sobrepondo-o. Qual é o defeito?",
      alternativas: {
        a: "O z-index precisa de valor negativo para subir",
        b: "O z-index não age em position static",
        c: "Falta declarar display: block no selo",
        d: "O z-index só aceita valores até 10",
      },
      correta: "b",
      explicacao:
        "z-index só age em elemento posicionado, e static é o padrão. Basta acrescentar position: relative, absolute ou outro valor para o z-index passar a valer.",
      fonte: "moderno.posicionamento",
      tipo: "erro",
      codigo: {
        linguagem: "css",
        trecho: ".selo {\n  z-index: 10;\n}",
      },
    },
    {
      id: "css-av-13",
      nivel: "avancado",
      pergunta:
        "Este trecho deveria suavizar a mudança de cor do botão na ida e na volta. Qual é o defeito?",
      alternativas: {
        a: "O tempo precisa ser declarado em milissegundos",
        b: "A transição não funciona com cor de fundo",
        c: "A transição está só no :hover",
        d: "Falta declarar a curva de aceleração",
      },
      correta: "c",
      explicacao:
        "Declarada dentro do :hover, a transição só existe enquanto o ponteiro está sobre o botão: ao sair, ela some junto e a cor volta de uma vez. O lugar dela é o estado normal do elemento.",
      fonte: "moderno.transicoes",
      tipo: "erro",
      codigo: {
        linguagem: "css",
        trecho:
          ".botao:hover {\n  background-color: #1e40af;\n  transition: background-color 0.2s;\n}",
      },
    },
    {
      id: "css-av-14",
      nivel: "avancado",
      pergunta:
        "Por que atender a prefers-reduced-motion é acessibilidade, e não gosto?",
      alternativas: {
        a: "Porque animação consome dados móveis",
        b: "Porque leitores de tela não leem elementos animados",
        c: "Porque a animação atrasa o carregamento da página",
        d: "Movimento provoca náusea e tontura",
      },
      correta: "d",
      explicacao:
        "Quem liga essa opção no sistema costuma ter sintoma real com movimento, como enxaqueca ou vertigem. Atender é remover a animação, e não a funcionalidade.",
      fonte: "moderno.preferencias",
    },
    {
      id: "css-av-15",
      nivel: "avancado",
      pergunta:
        "No painel Styles do DevTools, uma declaração válida aparece riscada. O que isso significa?",
      alternativas: {
        a: "Ela perdeu para outra regra e não está valendo",
        b: "Ela foi escrita fora da ordem alfabética",
        c: "Ela veio da folha de estilos padrão do navegador",
        d: "Ela só vale em telas de outro tamanho",
      },
      correta: "a",
      explicacao:
        "O risco numa declaração válida marca a que perdeu a disputa, e o painel mostra ao lado de onde veio a vencedora. Valor inválido também aparece riscado, mas com um ícone de alerta.",
      fonte: "moderno.devtools",
    },
  ],
};

export default pool;
