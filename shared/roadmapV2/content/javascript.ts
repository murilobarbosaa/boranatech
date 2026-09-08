// TODO(Ana): revisao editorial completa desta trilha (primeira trilha de
// linguagem da plataforma; titulos, descricoes e todo o conteudo longo
// precisam de revisao de copy e de codigo).
import type { RoadmapV2 } from "../types";

export const javascript: RoadmapV2 = {
  slug: "javascript",
  area: "linguagem",
  kind: "linguagem",
  codeLanguages: ["js"],
  // TODO(Ana): titulo da trilha
  title: "JavaScript do Zero",
  level: "Iniciante",
  // TODO(Ana): descricao da trilha
  description:
    "Da primeira linha no terminal até módulos, assincronia e o que roda por dentro da linguagem. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "comeco",
      title: "Preparando o terreno",
      level: "iniciante",
      description:
        "O que é JavaScript, onde ele roda e como executar o primeiro arquivo no seu computador.",
      children: [
        {
          id: "comeco.oque",
          title: "O que é JavaScript e onde roda",
          description:
            "A linguagem que nasceu no navegador e hoje roda no servidor, no celular e no terminal.",
          content:
            "JavaScript é a linguagem de programação que todo navegador entende sem instalar nada. Ela nasceu em 1995 pra dar vida a páginas que até então eram texto parado, e hoje roda muito além do navegador: no servidor com o Node, em aplicativos de celular, em ferramentas de linha de comando e até dentro de editores de código.\n\nO motivo de existir é simples: HTML descreve a estrutura de uma página e CSS descreve a aparência, mas nenhum dos dois **decide** nada. Reagir a um clique, buscar dados de uma API, validar um formulário, calcular um total: tudo isso é decisão, e decisão é programa. JavaScript é o programa.\n\nO modelo mental que vale carregar: JavaScript é uma linguagem, e um **motor** a executa. O motor do Chrome se chama V8; o Node é esse mesmo V8 tirado do navegador e colocado num programa que roda no seu terminal. Por isso o código que você escreve aqui serve tanto pra uma página quanto pra um script que organiza arquivos no seu computador.\n\nNesta trilha você aprende a linguagem em si, sem depender de página: a maior parte dos exemplos roda no terminal com o Node, e o que é específico do navegador (o DOM, os eventos de clique) fica pra trilha de Front-end. Aqui o foco é pensar em JavaScript.\n\nVocê domina este passo quando consegue explicar a alguém a diferença entre a linguagem e o motor que a executa, e citar dois lugares fora do navegador onde JavaScript roda.",
          resources: [
            {
              label: "MDN JavaScript",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript",
              kind: "doc",
            },
          ],
        },
        {
          id: "comeco.node",
          title: "Instalar o Node LTS",
          description:
            "O Node é o JavaScript fora do navegador; instale a versão LTS e confira no terminal.",
          content:
            "Node é o programa que executa JavaScript no seu computador, fora do navegador. Instalar o Node é o primeiro passo prático da trilha, porque é com ele que você vai rodar cada exemplo daqui em diante.\n\nNo site oficial existem duas linhas de versão: **LTS** e **Current**. LTS significa suporte de longo prazo: é a versão estável, a que empresas usam em produção e a que você deve instalar. A Current tem novidades mais cedo e muda mais; deixe pra quando você já estiver confortável.\n\nBaixe o instalador da LTS pro seu sistema, siga o padrão e, ao terminar, abra um terminal (no Windows, o PowerShell ou o terminal do VS Code) e confira se ficou tudo no lugar rodando `node --version` e depois `npm --version`.\n\nOs dois comandos devem responder com um número de versão. O `npm` veio junto: é o gerenciador de pacotes do Node, que a seção de módulos e ferramentas apresenta de verdade. Por enquanto basta saber que ele existe.\n\nSe o terminal disser que não conhece o comando `node`, feche e abra o terminal de novo (a instalação atualiza o caminho do sistema, e terminais abertos antes não enxergam). Persistindo, é sinal de que o instalador não completou.\n\nVocê domina este passo quando `node --version` responde no seu terminal e você sabe dizer por que escolheu a LTS.",
          resources: [
            {
              label: "Download do Node",
              url: "https://nodejs.org/en/download",
              kind: "doc",
            },
          ],
        },
        {
          id: "comeco.primeiro",
          title: "Rodar o primeiro arquivo",
          description:
            "Um arquivo .js, o comando node e a primeira saída no terminal: o ciclo que se repete a trilha inteira.",
          content:
            "Um programa em JavaScript é um arquivo de texto com a extensão `.js`. Escrever, salvar e rodar com o Node é o ciclo que você vai repetir centenas de vezes, então vale fazer do jeito certo desde o primeiro.\n\nCrie uma pasta pra trilha (por exemplo `estudos-js`), abra no VS Code e crie um arquivo `ola.js` com uma única linha:\n\n```js\nconsole.log('Olá, JavaScript!'); // Olá, JavaScript!\n```\n\nNo terminal, dentro da pasta, rode `node ola.js`. O texto aparece na tela. Esse `console.log` é a função que escreve algo na saída; nesta trilha, sempre que um bloco mostrar um comentário depois de um `console.log`, aquele comentário é o que apareceu no terminal de verdade.\n\nO modelo mental: o Node lê o arquivo de cima pra baixo e executa cada instrução na ordem. Sem mágica de inicialização, sem função principal obrigatória. Duas linhas rodam em sequência; a segunda só acontece depois da primeira.\n\n```js\nconsole.log('primeira'); // primeira\nconsole.log('segunda'); // segunda\n```\n\nO hábito que fica: cada conceito novo da trilha ganha um arquivo pequeno seu. Não copie e cole o exemplo; digite, rode, mude um detalhe e rode de novo. É na segunda execução, com a sua alteração, que o conceito assenta.\n\nVocê domina este passo quando cria um arquivo, roda com `node` e prevê o que vai aparecer antes de apertar Enter.",
        },
        {
          id: "comeco.console",
          title: "O Console do navegador",
          description:
            "O mesmo JavaScript, executado linha a linha dentro do DevTools: o laboratório de bolso.",
          content:
            "O Console do DevTools é um lugar onde você digita JavaScript e vê o resultado na hora, sem criar arquivo. Abra qualquer página, aperte F12, escolha a aba Console e digite `2 + 2`: o navegador responde `4`. É o mesmo motor que executa o JavaScript da página, à sua disposição.\n\nEle existe pra dois usos. O primeiro é experimentar: testar uma expressão, conferir o que um método devolve, checar se uma ideia funciona antes de escrever no arquivo. O segundo é observar: os `console.log` de qualquer página aparecem ali, junto com os erros, o que faz do Console a primeira parada de toda investigação.\n\nUma diferença em relação ao terminal do Node: no Console, uma expressão sozinha mostra o valor sem precisar de `console.log`. Digite `'ola'.toUpperCase()` e aparece `'OLA'`. No arquivo rodado pelo Node, sem `console.log` nada aparece.\n\nO modelo mental é o de laboratório de bolso: rápido, descartável, sem arquivo. O que você prova ali e quer guardar, vai pro arquivo `.js`. O Node também tem um laboratório desses: rode `node` sem argumento no terminal e ele abre um modo interativo que aceita uma linha por vez; saia com `.exit`.\n\nA seção de erros e depuração volta ao DevTools com muito mais profundidade. Por enquanto, faça do Console o lugar de tirar dúvida rápida sobre qualquer trecho desta trilha.",
        },
        {
          id: "comeco.sintaxe",
          title: "Comentários e ponto e vírgula",
          description:
            "As duas convenções que aparecem em todo arquivo: comentar pra quem lê e decidir sobre o ponto e vírgula.",
          content:
            "Antes de qualquer conceito de programação, duas convenções que aparecem em todo arquivo JavaScript e confundem quem começa: comentários e ponto e vírgula.\n\nComentário é texto que o motor ignora, escrito pra quem lê o código. Duas barras comentam até o fim da linha; barra e asterisco abrem um comentário que pode ocupar várias linhas:\n\n```js\n// comentario de uma linha\nconst limite = 10; // pode vir depois do codigo\n/* comentario\n   de varias linhas */\nconsole.log(limite); // 10\n```\n\nO hábito certo: comente o **porquê**, não o quê. `// soma dois numeros` acima de uma soma é ruído; `// o limite vem do contrato com o cliente` é informação que o código sozinho não dá.\n\nO ponto e vírgula encerra uma instrução. JavaScript tem um mecanismo que insere ponto e vírgula automaticamente em quebras de linha, o que faz muita gente omiti-lo. Funciona na maioria dos casos e falha em alguns cantos raros, como uma linha que começa com parêntese ou colchete. A decisão aqui é pragmática: **use ponto e vírgula** no fim de cada instrução. Custa nada, elimina a categoria inteira de surpresas e é o que o Prettier, apresentado na seção de módulos e ferramentas, faz por padrão.\n\nVocê domina este passo quando lê um arquivo alheio e distingue à primeira vista o que é código do que é comentário, e escreve o seu com ponto e vírgula sem pensar.",
        },
      ],
    },
    {
      id: "valores",
      title: "Valores e variáveis",
      level: "iniciante",
      description:
        "Os tipos de dado que a linguagem conhece, como guardar cada um e onde a conversão automática engana.",
      children: [
        {
          id: "valores.tipos",
          title: "Tipos primitivos",
          description:
            "string, number, boolean, undefined e null: os valores básicos e o operador typeof que revela cada um.",
          content:
            "Todo valor em JavaScript tem um tipo, e os primeiros que importam são os primitivos: `string` (texto), `number` (número, inteiro ou decimal, sem distinção), `boolean` (`true` ou `false`), `undefined` (ainda não recebeu valor) e `null` (ausência intencional de valor). Existem outros dois, `bigint` e `symbol`, que você encontra raramente no começo.\n\nO tipo existe porque cada valor se comporta de um jeito: `'2' + '2'` junta textos e dá `'22'`; `2 + 2` soma e dá `4`. Saber o tipo de cada coisa é saber o que vai acontecer com ela.\n\nO operador `typeof` revela o tipo de qualquer valor, e é o seu instrumento de investigação:\n\n```js\nconsole.log(typeof 'texto'); // string\nconsole.log(typeof 42); // number\nconsole.log(typeof true); // boolean\nconsole.log(typeof undefined); // undefined\nconsole.log(typeof null); // object\n```\n\nA última linha é um dos cantos estranhos mais famosos da linguagem: `typeof null` responde `object` por um erro de implementação antigo que nunca foi corrigido pra não quebrar a web. Guarde: `null` é primitivo, apesar do que o `typeof` diz.\n\nO modelo mental: `undefined` é o que a linguagem coloca quando você não colocou nada; `null` é o que você coloca de propósito pra dizer que não há valor. Os dois aparecem o tempo todo, e a seção de erros mostra o que acontece quando você tenta usar um deles como se fosse um objeto.\n\nVocê domina este passo quando olha um valor qualquer e diz o tipo dele antes de rodar o `typeof`.",
          resources: [
            {
              label: "MDN Tipos e estruturas de dados",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Data_structures",
              kind: "doc",
            },
          ],
        },
        {
          id: "valores.let",
          title: "let e const, e por que var ficou no passado",
          description:
            "Declarar variáveis: const por padrão, let quando o valor muda, e o motivo de var não entrar mais.",
          content:
            "Variável é um nome que aponta pra um valor. Em JavaScript moderno você declara com duas palavras: `const`, quando o nome não vai apontar pra outro valor depois, e `let`, quando vai.\n\n```js\nconst nome = 'Ana';\nlet contador = 0;\ncontador = contador + 1;\nconsole.log(nome, contador); // Ana 1\n```\n\nA regra de decisão é curta: **comece com `const`** e troque pra `let` só quando o código exigir reatribuir. Isso não é preciosismo: cada `const` é uma promessa de que aquele nome significa a mesma coisa do começo ao fim, e quem lê o código depois (inclusive você) não precisa procurar onde o valor mudou.\n\nUm detalhe que engana: `const` impede a **reatribuição** do nome, não a alteração do conteúdo. Um array declarado com `const` aceita novos itens; o que não pode é apontar o nome pra outro array. A seção de arrays e objetos volta a isso.\n\nE o `var`? Existe desde o início da linguagem e ainda funciona, mas tem dois comportamentos que causam bugs: o nome fica visível fora do bloco onde foi declarado, e pode ser declarado duas vezes sem erro. `let` e `const` resolvem os dois. Você vai encontrar `var` em código antigo e em tutoriais velhos; ao ler, entenda; ao escrever, não use.\n\nVocê domina este passo quando, diante de cada variável nova, escolhe `const` ou `let` com uma justificativa de uma frase.",
          resources: [
            {
              label: "MDN let",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Statements/let",
              kind: "doc",
            },
            {
              label: "MDN const",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Statements/const",
              kind: "doc",
            },
          ],
        },
        {
          id: "valores.strings",
          title: "Strings e template literals",
          description:
            "Texto entre aspas, os métodos que você usa todo dia e a crase que monta texto com valores dentro.",
          content:
            "String é texto. Você escreve entre aspas simples ou duplas, e tanto faz qual, desde que seja consistente. Toda string traz um conjunto de métodos prontos, e uns poucos cobrem quase todo o uso do dia a dia:\n\n```js\nconst frase = '  Bora na Tech  ';\nconsole.log(frase.trim()); // Bora na Tech\nconsole.log(frase.length); // 16\nconsole.log('abc'.toUpperCase()); // ABC\nconsole.log('a,b,c'.split(',')); // [ 'a', 'b', 'c' ]\nconsole.log('banana'.includes('nan')); // true\n```\n\nO detalhe que importa: métodos de string **devolvem uma string nova** e nunca alteram a original. `frase.trim()` não muda `frase`; ele entrega outro valor, que você guarda se quiser.\n\nA terceira forma de escrever string usa crase e se chama template literal. Ela aceita valores dentro do texto, com cifrão e chaves, e aceita quebra de linha direto:\n\n```js\nconst nome = 'Ana';\nconst idade = 27;\nconsole.log(`${nome} tem ${idade} anos`); // Ana tem 27 anos\n```\n\nAntes dela, montar texto com valores exigia somar pedaços com `+`, e ficava difícil de ler com três ou quatro variáveis. Template literal é o padrão moderno pra qualquer texto que mistura valor: use sempre que houver `${}` pra colocar.\n\nO modelo mental: string é uma sequência de caracteres que você lê, fatia e transforma, sempre produzindo uma nova. Você domina este passo quando resolve, sem consultar nada, tirar espaços das pontas, deixar em maiúsculas e montar uma frase com dois valores dentro.",
          resources: [
            {
              label: "MDN Template literals",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Template_literals",
              kind: "doc",
            },
          ],
        },
        {
          id: "valores.numeros",
          title: "Números e Math",
          description:
            "Um único tipo numérico, os operadores, a armadilha do ponto flutuante e o objeto Math.",
          content:
            "JavaScript tem um único tipo numérico: `number` serve pra `3` e pra `3.5`, sem separar inteiro de decimal. Os operadores são os da aritmética, mais dois que valem conhecer: `%` (resto da divisão) e `**` (potência).\n\n```js\nconsole.log(7 % 3); // 1\nconsole.log(2 ** 10); // 1024\nconsole.log(10 / 4); // 2.5\nconsole.log(0.1 + 0.2); // 0.30000000000000004\n```\n\nA última linha assusta todo mundo uma vez. Não é bug do JavaScript: é a representação de decimais em binário, a mesma de quase toda linguagem, que não consegue guardar `0.1` com exatidão. A lição prática tem duas partes: nunca compare decimais com `===` esperando igualdade exata, e nunca faça conta de dinheiro em reais com decimais. Guarde centavos como inteiro (`1050` em vez de `10.50`) e formate só na hora de mostrar.\n\nO objeto `Math` reúne funções matemáticas prontas. As que você usa cedo: `Math.round` arredonda, `Math.floor` arredonda pra baixo, `Math.max` e `Math.min` escolhem entre vários, e `Math.random` sorteia um decimal entre 0 e 1.\n\n```js\nconsole.log(Math.round(2.5)); // 3\nconsole.log(Math.floor(2.9)); // 2\nconsole.log(Math.max(3, 9, 4)); // 9\n```\n\nO resto da divisão parece detalhe e resolve problemas reais: saber se um número é par (`n % 2 === 0`), ciclar entre posições, distribuir itens em colunas. A seção de controle de fluxo usa isso em laços.\n\nVocê domina este passo quando explica por que `0.1 + 0.2` não dá `0.3` e sabe como guardar um valor em dinheiro sem cair nessa.",
          resources: [
            {
              label: "MDN Math",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Math",
              kind: "doc",
            },
          ],
        },
        {
          id: "valores.conversao",
          title: "Conversão de tipos e os cantos estranhos",
          description:
            "A conversão automática, a diferença entre == e ===, o NaN e como converter de propósito.",
          content:
            "JavaScript converte tipos sozinho quando um operador recebe valores de tipos diferentes. Isso se chama coerção, e é a fonte de metade das surpresas de quem começa.\n\nO caso clássico é o `+`: com uma string de um lado, ele vira concatenação. E o `==` compara depois de converter, o que produz igualdades que ninguém quer:\n\n```js\nconsole.log('5' + 1); // 51\nconsole.log('5' - 1); // 4\nconsole.log('5' == 5); // true\nconsole.log('5' === 5); // false\nconsole.log(0 == ''); // true\n```\n\nA regra que elimina o problema: **compare sempre com `===`** (e `!==` pra diferente). O triplo compara valor e tipo, sem converter nada. O duplo só aparece em código antigo; ao escrever, esqueça que existe.\n\nQuando você precisa converter, faça de propósito e por escrito. `Number('42')` transforma texto em número; `String(42)` faz o inverso; `Boolean(valor)` diz se o valor é verdadeiro ou falso no sentido da linguagem. Vale decorar o que é falso: `0`, `''`, `null`, `undefined`, `NaN` e o próprio `false`. Todo o resto é verdadeiro, inclusive `'0'` e um array vazio.\n\n```js\nconsole.log(Number('42') + 1); // 43\nconsole.log(Number('abc')); // NaN\nconsole.log(Number.isNaN(Number('abc'))); // true\n```\n\n`NaN` significa que uma conversão numérica falhou. Ele tem uma propriedade única: não é igual nem a ele mesmo, então se testa com `Number.isNaN`, nunca com `===`.\n\nVocê domina este passo quando prevê o resultado de `'5' + 1` e de `'5' - 1` sem rodar, e escreve comparações só com `===`.",
        },
      ],
    },
    {
      id: "fluxo",
      title: "Controle de fluxo",
      level: "iniciante",
      description:
        "Decidir e repetir: as estruturas que fazem o programa tomar caminhos diferentes e voltar sobre os próprios passos.",
      children: [
        {
          id: "fluxo.if",
          title: "Condicionais",
          description:
            "if, else if e else: o programa escolhe um caminho a partir de uma condição.",
          content:
            "Condicional é o programa escolhendo um caminho. `if` recebe uma expressão entre parênteses; se ela for verdadeira, o bloco entre chaves roda; senão, o programa pula pro `else`, se houver.\n\n```js\nconst nota = 7.5;\nif (nota >= 9) {\n  console.log('excelente');\n} else if (nota >= 7) {\n  console.log('aprovado'); // aprovado\n} else {\n  console.log('recuperacao');\n}\n```\n\nO `else if` encadeia testes: o primeiro que der verdadeiro vence e os outros nem são avaliados. Por isso a **ordem** importa: com `nota >= 7` antes de `nota >= 9`, um 9.5 cairia em `aprovado`.\n\nA condição não precisa ser uma comparação. Qualquer valor serve, e a linguagem aplica a regra de verdadeiro e falso do passo de conversão: `if (lista.length)` roda quando a lista tem itens, porque `0` é falso. Isso é idiomático, mas prefira ser explícito enquanto estiver aprendendo: `if (lista.length > 0)` diz a intenção sem exigir que o leitor lembre da regra.\n\nO operador ternário é um `if` de uma expressão, útil pra escolher entre dois valores curtos: `const status = ativo ? 'ligado' : 'desligado';`. Se a escolha precisar de mais de uma linha, volte pro `if`.\n\nO modelo mental: cada `if` é uma bifurcação, e o programa passa por exatamente um ramo. Você domina este passo quando escreve um encadeamento de três faixas e acerta a ordem dos testes na primeira tentativa.",
          resources: [
            {
              label: "MDN if...else",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Statements/if...else",
              kind: "doc",
            },
          ],
        },
        {
          id: "fluxo.logicos",
          title: "Operadores lógicos",
          description:
            "E, ou e não: combinar condições, o curto-circuito e os valores padrão com || e ??.",
          content:
            "Três operadores combinam condições: `&&` (e), `||` (ou) e `!` (não). `a && b` é verdadeiro só se os dois forem; `a || b` é verdadeiro se pelo menos um for; `!a` inverte.\n\n```js\nconst idade = 20;\nconst temIngresso = true;\nconsole.log(idade >= 18 && temIngresso); // true\nconsole.log(idade < 18 || !temIngresso); // false\n```\n\nO que torna esses operadores mais interessantes do que parecem é o **curto-circuito**: `&&` para no primeiro valor falso e `||` para no primeiro verdadeiro, e devolvem o valor onde pararam, não um booleano. Isso permite um padrão que você vai ver em todo código: `const nome = entrada || 'visitante';` usa `entrada` se ela for verdadeira, senão cai no padrão.\n\nEsse padrão tem uma pegadinha: `0` e `''` são falsos, então `quantidade || 10` troca um zero legítimo por 10. Pra isso existe o `??`, que só cai no padrão quando o valor é `null` ou `undefined`:\n\n```js\nconst quantidade = 0;\nconsole.log(quantidade || 10); // 10\nconsole.log(quantidade ?? 10); // 0\n```\n\nA regra prática: valor padrão pra algo que pode estar **ausente**, use `??`. Só use `||` quando zero e string vazia também devem cair no padrão.\n\nVocê domina este passo quando lê `a && b()` e sabe que `b` só roda se `a` for verdadeiro, e escolhe entre `||` e `??` conforme o zero for um valor válido ou não.",
        },
        {
          id: "fluxo.switch",
          title: "switch",
          description:
            "Comparar um valor com várias opções fixas, o break que não pode faltar e quando um objeto resolve melhor.",
          content:
            "`switch` compara um valor com uma lista de opções fixas e executa o caso que bater. É o substituto legível de um `if` com cinco ou seis `else if` que testam a mesma variável contra valores diferentes.\n\n```js\nconst dia = 'sab';\nswitch (dia) {\n  case 'sab':\n  case 'dom':\n    console.log('fim de semana'); // fim de semana\n    break;\n  default:\n    console.log('dia util');\n}\n```\n\nDois detalhes decidem se o `switch` ajuda ou atrapalha. O primeiro é o `break`: sem ele, a execução **continua no próximo caso**, mesmo que o valor não bata. Isso é usado de propósito pra agrupar casos, como `sab` e `dom` acima, e é bug em qualquer outra situação. Todo caso que faz algo termina em `break` (ou em `return`, dentro de função).\n\nO segundo: a comparação é com `===`, então `switch ('1')` não entra em `case 1`.\n\nUma alternativa que muitas vezes é melhor: um objeto como tabela. Quando cada caso só devolve um valor, `const rotulos = { sab: 'fim de semana', dom: 'fim de semana' };` e `rotulos[dia] ?? 'dia util'` fazem o mesmo em menos linhas e sem risco de esquecer o `break`. A seção de arrays e objetos ensina a montar essas tabelas.\n\nVocê domina este passo quando explica o que acontece ao remover um `break` e sabe quando trocar o `switch` por um objeto.",
          resources: [
            {
              label: "MDN switch",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Statements/switch",
              kind: "doc",
            },
          ],
        },
        {
          id: "fluxo.for",
          title: "for e while",
          description:
            "Repetir com contador ou até uma condição mudar, e como não cair num laço infinito.",
          content:
            "Laço é repetição. O `for` clássico repete um bloco um número conhecido de vezes, com três partes entre parênteses: o início, a condição pra continuar e o passo ao fim de cada volta.\n\n```js\nfor (let i = 1; i <= 3; i++) {\n  console.log(i);\n}\n// 1\n// 2\n// 3\n```\n\nLeia assim: começa com `i` valendo 1; enquanto `i <= 3`, roda o bloco; a cada volta, `i++` soma um. O `let` ali é obrigatório na prática: `i` muda a cada volta, e com `let` ele existe só dentro do laço.\n\nO `while` repete enquanto uma condição for verdadeira, sem contador embutido. Serve quando você não sabe de antemão quantas voltas vai dar: ler até acabar, tentar até conseguir.\n\n```js\nlet saldo = 100;\nlet meses = 0;\nwhile (saldo < 130) {\n  saldo = saldo * 1.1;\n  meses++;\n}\nconsole.log(meses); // 3\n```\n\nO risco do `while` é o laço infinito: se a condição nunca vira falsa, o programa trava. Antes de rodar, pergunte o que faz a condição mudar; se a resposta não estiver dentro do bloco, o laço não termina. No terminal, `Ctrl+C` interrompe.\n\nO `for` com contador ainda aparece muito, mas pra percorrer listas a linguagem tem uma forma melhor, que o próximo passo mostra. Você domina este passo quando escreve um `while` e aponta a linha que garante que ele termina.",
          resources: [
            {
              label: "MDN for",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Statements/for",
              kind: "doc",
            },
          ],
        },
        {
          id: "fluxo.forof",
          title: "for...of, break e continue",
          description:
            "Percorrer uma lista item a item, sair no meio com break e pular um item com continue.",
          content:
            "`for...of` percorre uma lista item a item, sem contador e sem índice. É a forma que você deve preferir sempre que a pergunta for **cada item** e não a posição dele.\n\n```js\nconst frutas = ['uva', 'kiwi', 'manga'];\nfor (const fruta of frutas) {\n  console.log(fruta);\n}\n// uva\n// kiwi\n// manga\n```\n\nRepare no `const`: a cada volta a variável `fruta` nasce de novo apontando pro item da vez, então não há reatribuição e o `const` cabe. Funciona com arrays, strings (letra a letra) e qualquer coisa iterável, que a seção de arrays aprofunda.\n\nDois comandos alteram o ritmo de qualquer laço. `break` sai do laço na hora; `continue` pula o resto da volta atual e vai pra próxima:\n\n```js\nfor (const n of [3, 8, 12, 5, 20]) {\n  if (n % 2 !== 0) continue;\n  if (n > 15) break;\n  console.log(n);\n}\n// 8\n// 12\n```\n\nO 3 e o 5 são pulados pelo `continue` (ímpares); o 20 interrompe tudo pelo `break`. Esse padrão de filtrar e parar cedo aparece em busca: percorra até encontrar o que quer e saia, sem visitar o resto.\n\nUma promessa pra mais adiante: boa parte dos laços que filtram e transformam listas some quando você conhece `map` e `filter`, na seção de arrays e objetos. O `for...of` continua sendo a escolha pra quando cada item exige várias linhas de trabalho.\n\nVocê domina este passo quando troca um `for` com índice por `for...of` sem perder nada e usa `break` pra encerrar uma busca no primeiro resultado.",
          resources: [
            {
              label: "MDN for...of",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Statements/for...of",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "funcoes",
      title: "Funções",
      level: "intermediario",
      description:
        "Dar nome a um pedaço de lógica, passar valores pra dentro, receber de volta e entender de onde uma função enxerga.",
      children: [
        {
          id: "funcoes.declarar",
          title: "Declaração e expressão de função",
          description:
            "As duas formas de criar uma função, o que é hoisting e quando cada forma faz sentido.",
          content:
            "Função é um bloco de código com nome que você executa quantas vezes quiser. Ela existe pra não repetir lógica: escreve uma vez, chama em vários lugares, e quando precisar mudar, muda num lugar só.\n\nHá duas formas de criar uma. A **declaração** usa a palavra `function` seguida do nome; a **expressão** guarda uma função sem nome numa variável:\n\n```js\nfunction saudar(nome) {\n  return `Olá, ${nome}!`;\n}\nconst despedir = function (nome) {\n  return `Tchau, ${nome}!`;\n};\nconsole.log(saudar('Ana')); // Olá, Ana!\nconsole.log(despedir('Ana')); // Tchau, Ana!\n```\n\nA diferença prática está em quando a função passa a existir. Declarações sofrem **hoisting**: o motor as registra antes de rodar o arquivo, então você pode chamar `saudar` numa linha acima da declaração. Expressões só existem depois que a linha delas roda, como qualquer variável.\n\nIsso não é motivo pra espalhar chamadas antes da definição; é motivo pra entender uma mensagem de erro futura. O hábito que vale: declare funções com `function` quando elas são a peça principal do arquivo, e use expressões (quase sempre na forma de arrow function, o próximo passo) quando a função é um valor que você passa adiante.\n\nO modelo mental: uma função é uma máquina com entrada e saída. Você domina este passo quando escreve as duas formas de cabeça e explica por que chamar uma expressão antes da linha dela dá erro.",
          resources: [
            {
              label: "MDN Funções",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Functions",
              kind: "doc",
            },
          ],
        },
        {
          id: "funcoes.arrow",
          title: "Arrow functions",
          description:
            "A sintaxe curta com seta, o retorno implícito e o caso em que os parênteses viram armadilha.",
          content:
            "Arrow function é a forma curta de escrever uma expressão de função: parâmetros, uma seta e o corpo. É a sintaxe que domina o JavaScript moderno, principalmente quando a função é passada como argumento pra outra.\n\n```js\nconst dobro = (n) => n * 2;\nconst somar = (a, b) => {\n  const total = a + b;\n  return total;\n};\nconsole.log(dobro(4)); // 8\nconsole.log(somar(2, 3)); // 5\n```\n\nAs duas formas acima mostram a regra do corpo. Sem chaves, o corpo é uma única expressão e o valor dela é **devolvido automaticamente**: `dobro` não precisa de `return`. Com chaves, o corpo é um bloco comum e o `return` volta a ser obrigatório, exatamente como em `somar`.\n\nA armadilha clássica é devolver um objeto sem chaves de bloco: `() => { a: 1 }` não devolve objeto, porque o motor lê as chaves como bloco. Embrulhe o objeto em parênteses: `() => ({ a: 1 })`.\n\nUm parâmetro só dispensa os parênteses (`n => n * 2`), mas o Prettier os coloca de volta, e manter sempre é uma regra a menos pra lembrar.\n\nExiste uma diferença de comportamento além da sintaxe: arrow functions não têm `this` próprio. Isso raramente importa nas funções pequenas que você escreve agora, e a seção de JavaScript por dentro explica quando importa.\n\nVocê domina este passo quando converte uma expressão de função em arrow, e o inverso, sem mudar o resultado, e sabe quando os parênteses em volta do objeto são obrigatórios.",
          resources: [
            {
              label: "MDN Arrow functions",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Functions/Arrow_functions",
              kind: "doc",
            },
          ],
        },
        {
          id: "funcoes.parametros",
          title: "Parâmetros e retorno",
          description:
            "Valores que entram, o valor que sai, o padrão pra parâmetro ausente e o que acontece sem return.",
          content:
            "Parâmetro é o nome que a função dá ao valor que recebe; argumento é o valor que você passa na chamada. `function area(largura, altura)` declara dois parâmetros; `area(3, 4)` passa dois argumentos.\n\nJavaScript não reclama quando os números não batem. Argumento a mais é ignorado; parâmetro sem argumento fica `undefined`. Pra evitar o `undefined` silencioso, dê um **valor padrão** ao parâmetro:\n\n```js\nfunction area(largura, altura = largura) {\n  return largura * altura;\n}\nconsole.log(area(3, 4)); // 12\nconsole.log(area(5)); // 25\n```\n\nO padrão pode até usar um parâmetro anterior, como `altura = largura` fazendo um quadrado.\n\nO `return` entrega o resultado e **encerra** a função na hora: qualquer linha depois dele não roda. Função sem `return`, ou com `return` vazio, devolve `undefined`. Isso explica um erro comum: chamar uma função que só faz `console.log` e tentar usar o resultado, que é `undefined`. Mostrar na tela e devolver um valor são coisas diferentes; funções que calculam devem devolver, e quem chama decide se mostra.\n\nQuando o número de argumentos varia, o parâmetro rest recolhe todos num array: `function soma(...numeros)` aceita `soma(1, 2, 3)` e recebe `[1, 2, 3]`.\n\nVocê domina este passo quando escreve uma função com valor padrão, explica por que uma função só de `console.log` devolve `undefined` e usa `return` cedo pra sair de um caso especial.",
        },
        {
          id: "funcoes.escopo",
          title: "Escopo e closure",
          description:
            "De onde cada nome é visível, o que um bloco esconde e a função que lembra do lugar onde nasceu.",
          content:
            "Escopo é a região do código onde um nome é visível. Em JavaScript moderno, `let` e `const` criam nomes que só existem dentro do bloco (as chaves) onde foram declarados, e cada função abre um escopo próprio. De dentro você enxerga o que está fora; de fora você não enxerga o que está dentro.\n\n```js\nconst mensagem = 'global';\nfunction mostrar() {\n  const local = 'interno';\n  console.log(mensagem, local); // global interno\n}\nmostrar();\nconsole.log(typeof local); // undefined\n```\n\nA regra que faz a cadeia funcionar: quando um nome é usado, o motor procura no escopo atual e, não achando, sobe pro escopo de fora, até o global. É por isso que `mostrar` lê `mensagem` sem receber como parâmetro.\n\nDaí nasce a **closure**: uma função que lembra do escopo onde foi criada, mesmo depois de esse escopo ter terminado.\n\n```js\nfunction criarContador() {\n  let total = 0;\n  return () => {\n    total++;\n    return total;\n  };\n}\nconst contar = criarContador();\nconsole.log(contar(), contar()); // 1 2\n```\n\n`criarContador` terminou, mas a função devolvida continua com acesso a `total`, que ninguém de fora consegue ler nem zerar. Closure é o mecanismo por trás de estado privado, de callbacks que carregam contexto e de boa parte do que você vai ver na seção de assincronia.\n\nVocê domina este passo quando explica por que `contar()` não recomeça do zero a cada chamada e por que `total` é inacessível de fora.",
          resources: [
            {
              label: "MDN Closures",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Closures",
              kind: "doc",
            },
          ],
        },
        {
          id: "funcoes.callbacks",
          title: "Funções como valor",
          description:
            "Guardar, passar e devolver funções: o callback, a base de tudo que vem depois.",
          content:
            "Em JavaScript, função é um valor como qualquer outro: cabe numa variável, num array, numa propriedade de objeto, e pode ser passada como argumento pra outra função. Uma função passada pra outra executar se chama **callback**.\n\n```js\nfunction repetir(vezes, acao) {\n  for (let i = 1; i <= vezes; i++) {\n    acao(i);\n  }\n}\nrepetir(3, (n) => console.log(`volta ${n}`));\n// volta 1\n// volta 2\n// volta 3\n```\n\n`repetir` não sabe o que vai fazer em cada volta; quem chama decide, passando a ação. É a separação entre **o mecanismo** (percorrer) e **a política** (o que fazer com cada item), e ela está em toda parte: ordenar uma lista recebe a função que compara dois itens, um botão recebe a função que roda no clique, uma requisição recebe a função que roda quando a resposta chega.\n\nUm erro comum ao começar: passar a chamada em vez da função. `repetir(3, mostrar())` executa `mostrar` na hora e passa o resultado dela (provavelmente `undefined`); o certo é `repetir(3, mostrar)`, sem parênteses, entregando a função pra ser chamada depois.\n\nFunções também podem **devolver** funções, como `criarContador` fez no passo anterior. Juntas, closure e callback formam a dupla que a seção de arrays e objetos usa em `map` e `filter`, e que a seção de assincronia leva ao limite com Promises.\n\nVocê domina este passo quando escreve uma função que recebe outra como argumento e explica, com a diferença entre `mostrar` e `mostrar()`, por que o callback é passado sem parênteses.",
        },
      ],
    },
    {
      id: "estruturas",
      title: "Arrays e objetos",
      level: "intermediario",
      description:
        "As duas estruturas que guardam quase todo dado de um programa, os métodos que transformam listas e o formato que viaja pela rede.",
      children: [
        {
          id: "estruturas.arrays",
          title: "Arrays",
          description:
            "Lista ordenada de valores: criar, acessar por índice, adicionar, remover e medir.",
          content:
            "Array é uma lista ordenada de valores. Você cria com colchetes, acessa cada item pela posição (o índice, que começa em **zero**) e mede com `length`.\n\n```js\nconst tarefas = ['estudar', 'treinar'];\ntarefas.push('dormir');\nconsole.log(tarefas[0]); // estudar\nconsole.log(tarefas.length); // 3\nconsole.log(tarefas.at(-1)); // dormir\nconsole.log(tarefas.indexOf('treinar')); // 1\n```\n\nO índice zero confunde no início e depois vira natural: o primeiro item é `[0]`, o último é `[length - 1]`, ou `at(-1)`, que conta do fim.\n\nOs métodos que alteram o array no lugar são poucos e valem decorar: `push` adiciona no fim, `pop` remove do fim, `unshift` e `shift` fazem o mesmo no início, `splice` remove ou insere no meio. Repare que `tarefas` foi declarado com `const` e mesmo assim recebeu um item: `const` protege o nome, não o conteúdo, como o passo de `let` e `const` avisou.\n\nA pergunta que separa quem entende arrays de quem só usa: o método **altera o original ou devolve um novo**? `push` altera; `slice`, `concat` e todos os métodos do próximo passo devolvem outro array e deixam o original intacto. Saber isso evita o bug de achar que uma lista mudou quando só uma cópia mudou, ou o contrário.\n\nVocê domina este passo quando cria um array, adiciona, remove e pega o último item sem consultar nada, e classifica `push` e `slice` quanto a alterar ou não o original.",
          resources: [
            {
              label: "MDN Array",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Array",
              kind: "doc",
            },
          ],
        },
        {
          id: "estruturas.metodos",
          title: "map, filter, reduce e find",
          description:
            "Os quatro métodos que substituem a maioria dos laços: transformar, selecionar, resumir e localizar.",
          content:
            "Quatro métodos de array resolvem a maior parte do que você fazia com `for...of`, e cada um recebe um callback, o que o passo de funções como valor preparou. `map` transforma cada item e devolve um array novo do mesmo tamanho; `filter` mantém só os itens em que o callback devolve verdadeiro; `find` devolve o primeiro que passa no teste; `reduce` resume tudo num único valor.\n\n```js\nconst precos = [10, 25, 40, 5];\nconsole.log(precos.map((p) => p * 2)); // [ 20, 50, 80, 10 ]\nconsole.log(precos.filter((p) => p > 8)); // [ 10, 25, 40 ]\nconsole.log(precos.find((p) => p > 20)); // 25\nconsole.log(precos.reduce((soma, p) => soma + p, 0)); // 80\n```\n\nNenhum deles altera `precos`. Essa é a promessa feita no passo de `for...of`: a maioria dos laços que filtram e transformam vira uma linha declarativa, que diz **o que** você quer em vez de **como** percorrer.\n\nO `reduce` merece uma explicação a mais. O primeiro parâmetro do callback é o acumulador, que começa no valor inicial passado depois do callback (o `0`) e recebe, a cada item, o que o callback devolveu. Somar é o exemplo clássico; contar ocorrências, agrupar por categoria e achar o maior também são `reduce`.\n\nOs métodos se encadeiam, porque cada um devolve um array: `precos.filter((p) => p > 8).map((p) => p * 2)` filtra e depois transforma. Leia da esquerda pra direita como uma linha de produção.\n\nVocê domina este passo quando reescreve um `for...of` que filtra e soma usando `filter` e `reduce`, e escolhe `find` em vez de `filter` quando só quer o primeiro resultado.",
          resources: [
            {
              label: "MDN Array.prototype.map",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Array/map",
              kind: "doc",
            },
            {
              label: "MDN Array.prototype.reduce",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce",
              kind: "doc",
            },
          ],
        },
        {
          id: "estruturas.objetos",
          title: "Objetos e acesso",
          description:
            "Pares de chave e valor: criar, ler com ponto ou colchete, alterar e percorrer as chaves.",
          content:
            "Objeto é uma coleção de pares chave e valor, escrita entre chaves. Se o array responde à pergunta 'quais itens, em ordem', o objeto responde 'qual valor está em qual nome'. É a estrutura de qualquer coisa com características: um usuário tem nome, e-mail e idade.\n\n```js\nconst usuario = { nome: 'Ana', idade: 27 };\nusuario.email = 'ana@exemplo.com';\nconst campo = 'idade';\nconsole.log(usuario.nome); // Ana\nconsole.log(usuario[campo]); // 27\nconsole.log(usuario.telefone); // undefined\nconst chaves = Object.keys(usuario);\nconsole.log(chaves); // [ 'nome', 'idade', 'email' ]\n```\n\nO acesso com ponto é o normal. O acesso com colchete serve quando a chave está numa variável, como `campo`, ou quando ela tem caracteres que o ponto não aceita. Ler uma chave que não existe devolve `undefined`, sem erro; o erro vem depois, se você tentar usar esse `undefined` como objeto, e a seção de erros mostra a mensagem exata.\n\n`Object.keys` devolve as chaves num array, o que junta as duas estruturas: com as chaves em mãos, `map` e `filter` do passo anterior valem pra objetos também. `Object.values` e `Object.entries` fazem o mesmo com os valores e com os pares.\n\nObjetos também guardam funções, e aí a chave se chama método: `const conta = { saldo: 0, depositar(valor) { this.saldo += valor; } };`. O `this` dentro do método aponta pro próprio objeto, e a seção de JavaScript por dentro explica as regras completas.\n\nVocê domina este passo quando escolhe entre ponto e colchete pelo motivo certo e percorre as chaves de um objeto com `Object.keys`.",
        },
        {
          id: "estruturas.destructuring",
          title: "Destructuring e spread",
          description:
            "Tirar valores de arrays e objetos com uma sintaxe só, e espalhar um deles dentro de outro.",
          content:
            "Destructuring é extrair valores de um array ou objeto direto pra variáveis, numa linha que espelha a forma da estrutura. Spread é o inverso: espalhar os itens de um array ou as chaves de um objeto dentro de outro. Os dois usam a mesma sintaxe de colchetes e chaves, e os três pontos.\n\n```js\nconst pessoa = { nome: 'Ana', cidade: 'Recife' };\nconst { nome, cidade } = pessoa;\nconst [primeiro, segundo] = ['a', 'b', 'c'];\nconsole.log(nome, cidade); // Ana Recife\nconsole.log(primeiro, segundo); // a b\n```\n\nNo objeto, o nome da variável tem que bater com a chave (ou você renomeia com `nome: apelido`). No array, o que manda é a posição. Destructuring aparece o tempo todo em parâmetros de função: `function exibir({ nome, cidade })` recebe o objeto e já abre as chaves.\n\nO spread copia sem alterar a origem, o que vai pesar na seção de JavaScript por dentro quando o assunto for imutabilidade:\n\n```js\nconst base = { tema: 'claro', idioma: 'pt' };\nconst config = { ...base, tema: 'escuro' };\nconst lista = [1, 2];\nconsole.log(config); // { tema: 'escuro', idioma: 'pt' }\nconsole.log([...lista, 3]); // [ 1, 2, 3 ]\nconsole.log(base.tema); // claro\n```\n\nRepare na ordem: `tema: 'escuro'` veio depois do spread e venceu. O que vem por último sobrescreve. `base` continua com `claro`, porque o spread criou um objeto novo em vez de mexer no antigo.\n\nVocê domina este passo quando extrai dois campos de um objeto numa linha e cria uma cópia alterada de um objeto sem tocar no original.",
        },
        {
          id: "estruturas.json",
          title: "JSON",
          description:
            "O formato de texto em que objetos viajam pela rede e vão pro disco, e as duas funções que o convertem.",
          content:
            'JSON é um formato de texto pra representar dados, com a sintaxe de objetos e arrays do JavaScript (o nome vem daí: JavaScript Object Notation). É o formato em que uma API responde, em que um arquivo de configuração é salvo e em que dados vão parar no `localStorage` do navegador. Praticamente toda linguagem sabe ler e escrever JSON, por isso ele é o idioma comum entre sistemas.\n\nA conversão nos dois sentidos é feita por duas funções. `JSON.stringify` transforma um valor em texto JSON; `JSON.parse` faz o caminho de volta:\n\n```js\nconst pedido = { id: 7, itens: [\'caneta\', \'caderno\'] };\nconst texto = JSON.stringify(pedido);\nconsole.log(texto); // {"id":7,"itens":["caneta","caderno"]}\nconst copia = JSON.parse(texto);\nconsole.log(copia.itens[1]); // caderno\n```\n\nO modelo mental: em memória você tem um objeto, com métodos e referências; no fio ou no disco só cabe texto. `stringify` empacota, `parse` desempacota. A dupla também serve pra fazer uma cópia profunda simples de um objeto sem funções.\n\nAs diferenças em relação a um objeto JavaScript escrito no código: em JSON as chaves vão sempre entre aspas duplas, strings usam aspas duplas, não existem comentários, funções nem `undefined`, e não pode haver vírgula sobrando no fim. Erro nessas regras faz `JSON.parse` lançar uma exceção, o que a seção de erros ensina a tratar.\n\nO `package.json`, que a seção de módulos e ferramentas apresenta, é um arquivo JSON; a seção de assincronia lê JSON de uma API real com `fetch`.\n\nVocê domina este passo quando converte um objeto em texto e de volta, e aponta num JSON escrito à mão as três regras que ele viola.',
          resources: [
            {
              label: "MDN JSON",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/JSON",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "erros",
      title: "Erros e depuração",
      level: "intermediario",
      description:
        "Ler o que a linguagem diz quando algo quebra, tratar o que dá pra tratar e investigar o resto com as ferramentas certas.",
      children: [
        {
          id: "erros.tipos",
          title: "Tipos de erro",
          description:
            "SyntaxError, ReferenceError e TypeError: o que cada um significa e a causa mais comum de cada.",
          content:
            "Quando algo dá errado, JavaScript lança um erro com um tipo e uma mensagem, e o tipo já diz metade do diagnóstico. Três cobrem quase tudo que você vai encontrar no começo.\n\n`SyntaxError` é código que o motor não consegue nem ler: parêntese sem fechar, vírgula onde não cabe, palavra reservada usada como nome. Ele aparece antes de qualquer linha rodar, e a mensagem aponta a linha aproximada.\n\n`ReferenceError` é usar um nome que não existe naquele escopo: uma variável com o nome digitado errado, ou uma expressão de função chamada antes da linha dela, como o passo de declaração e expressão previu.\n\n`TypeError` é usar um valor de um jeito que o tipo dele não permite. O caso que você mais vai ver na vida: tentar ler uma propriedade de `undefined` ou de `null`.\n\n```js\nconst usuario = { nome: 'Ana' };\ntry {\n  console.log(usuario.endereco.cidade);\n} catch (erro) {\n  console.log(erro.name); // TypeError\n}\n```\n\n`usuario.endereco` não existe, devolve `undefined`, e `.cidade` em cima de `undefined` explode. A mensagem completa, do tipo `Cannot read properties of undefined (reading 'cidade')`, diz exatamente qual propriedade faltou; leia até o fim antes de procurar no código.\n\nO modelo mental: `SyntaxError` é problema de escrita, `ReferenceError` é problema de nome, `TypeError` é problema de valor. Com essa tríade, a maioria dos erros vira uma pergunta específica em vez de um susto. O próximo passo mostra como capturar erros de propósito.\n\nVocê domina este passo quando lê a mensagem de um erro e diz, antes de abrir o código, se o problema é de escrita, de nome ou de valor.",
          resources: [
            {
              label: "MDN Error",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Error",
              kind: "doc",
            },
          ],
        },
        {
          id: "erros.trycatch",
          title: "try, catch e finally",
          description:
            "Capturar um erro esperado, lançar os seus com throw e o bloco que roda de qualquer jeito.",
          content:
            "`try` e `catch` capturam um erro em vez de deixar o programa parar. O código que pode falhar vai no `try`; se algo lançar um erro ali, a execução pula pro `catch`, que recebe o erro como parâmetro.\n\n```js\nfunction lerConfig(texto) {\n  try {\n    return JSON.parse(texto);\n  } catch (erro) {\n    console.log(`config invalida: ${erro.message}`);\n    return {};\n  }\n}\nconsole.log(lerConfig('{\"a\":1}')); // { a: 1 }\nconsole.log(lerConfig('{tema}')); // {}\n```\n\nA regra de ouro: capture só o que você sabe **tratar**. Um JSON vindo de fora pode estar corrompido, e devolver um objeto vazio é uma decisão consciente. Um `catch` vazio, que engole o erro sem fazer nada, é a pior versão possível, porque esconde o problema e ele volta longe dali, sem pista. Se não sabe o que fazer com o erro, não capture.\n\nVocê também lança os seus com `throw new Error('mensagem')`. Uma função que recebe um argumento inválido deve lançar cedo, com mensagem que diga o que veio errado, em vez de seguir e quebrar dez linhas depois num `TypeError` sem contexto.\n\nO `finally` roda sempre, com ou sem erro, e serve pra fechar o que foi aberto: um arquivo, uma conexão, um indicador de carregando na tela.\n\nEsse mecanismo volta na seção de assincronia, onde `try` e `catch` envolvem `await` e capturam falhas de rede. Você domina este passo quando decide, diante de uma operação que pode falhar, se captura e o que devolve, e lança um erro com mensagem útil quando a entrada é inválida.",
          resources: [
            {
              label: "MDN try...catch",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Statements/try...catch",
              kind: "doc",
            },
          ],
        },
        {
          id: "erros.stack",
          title: "Ler um stack trace",
          description:
            "O rastro de chamadas que vem com todo erro: de cima pra baixo, do ponto que quebrou até quem chamou.",
          content:
            "Stack trace é a lista de chamadas que estavam ativas quando um erro aconteceu. Todo erro não tratado imprime uma no terminal, e ler essa lista com método é a habilidade que mais economiza tempo de quem programa.\n\nA primeira linha traz o tipo e a mensagem. As linhas seguintes, cada uma começando com `at`, são o rastro: a primeira é o ponto exato que quebrou, com arquivo, linha e coluna; a de baixo é quem chamou aquela função; e assim por diante, até o início do programa.\n\n```js\nfunction calcularTotal(pedido) {\n  return pedido.itens.length;\n}\nfunction processar() {\n  return calcularTotal(undefined);\n}\nprocessar();\n```\n\nRodando esse arquivo, o terminal mostra `TypeError: Cannot read properties of undefined (reading 'itens')`, e abaixo `at calcularTotal (arquivo.js:2:23)` seguido de `at processar (arquivo.js:5:10)`. A leitura: quebrou na linha 2, dentro de `calcularTotal`, que foi chamada na linha 5 por `processar`. O erro está na linha 2, mas a **causa** está na linha 5, que passou `undefined`. Subir o rastro é o que leva da consequência à causa.\n\nO hábito: ignore as linhas que apontam pra dentro do Node ou de bibliotecas (caminhos com `node:internal` ou `node_modules`) e procure a primeira que aponta pro seu arquivo. É ali que a investigação começa.\n\nVocê domina este passo quando pega um stack trace de cinco linhas e diz onde o erro estourou e onde ele foi causado, sem rodar nada.",
        },
        {
          id: "erros.console",
          title: "console além do log",
          description:
            "table, error, warn, time e group: o console como instrumento, não só como print.",
          content:
            "`console.log` é o começo, mas o objeto `console` tem métodos que transformam a saída de texto solto em instrumento de investigação. Quatro valem entrar no seu repertório agora.\n\n`console.table` mostra um array de objetos como tabela, com uma coluna por chave. Pra olhar dez registros vindos de uma API, é imbatível. `console.error` e `console.warn` escrevem na saída de erro (no terminal, a mesma tela; no navegador, com cor e ícone), e a diferença importa quando alguém redireciona a saída normal pra um arquivo e quer ver só os problemas.\n\n`console.time` e `console.timeEnd` medem quanto tempo passou entre os dois, com o mesmo rótulo:\n\n```js\nconsole.time('soma');\nlet total = 0;\nfor (let i = 0; i < 1000000; i++) {\n  total += i;\n}\nconsole.timeEnd('soma');\nconsole.log(total); // 499999500000\n```\n\nA linha do `timeEnd` imprime algo como `soma: 2.1ms`, e o número exato varia a cada máquina e execução. É a forma mais simples de responder 'isso é lento?' com um número em vez de impressão.\n\n`console.group` e `console.groupEnd` indentam tudo que for impresso entre eles, o que organiza a saída de um laço que imprime várias coisas por item.\n\nUm hábito que separa iniciante de quem já sofreu: `console.log` de investigação é temporário. Marque com um comentário ou um prefixo fixo (`// DEBUG`) e apague antes de terminar; log esquecido em produção é ruído pra quem vier depois.\n\nVocê domina este passo quando usa `console.table` pra inspecionar uma lista e `console.time` pra medir um trecho, e limpa os logs de investigação ao fechar a tarefa.",
          resources: [
            {
              label: "MDN console",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/API/console",
              kind: "doc",
            },
          ],
        },
        {
          id: "erros.debugger",
          title: "Depurar no DevTools e no VS Code",
          description:
            "Pausar o programa numa linha, olhar as variáveis e avançar passo a passo, no navegador e no editor.",
          content:
            "Depurador é a ferramenta que pausa o programa numa linha escolhida e deixa você olhar cada variável naquele instante, avançar uma linha por vez e ver o que muda. Depois de `console.log`, é o maior salto de produtividade da trilha.\n\nA linha onde o programa para se chama breakpoint. Você marca clicando à esquerda do número da linha, tanto na aba Sources do DevTools quanto no VS Code. A palavra `debugger;` no meio do código faz o mesmo quando um depurador está ligado, e é ignorada quando não está.\n\nCom o programa pausado, três botões fazem quase todo o trabalho: **continuar** até o próximo breakpoint, **passar por cima** (executa a linha atual e para na seguinte) e **entrar** (para na primeira linha da função chamada). O painel de escopo mostra as variáveis visíveis ali; o de call stack mostra o rastro do passo anterior, ao vivo.\n\nNo VS Code, com um arquivo `.js` aberto, o menu de executar e depurar sabe rodar com Node sem configuração; marque um breakpoint e inicie. No navegador, os scripts da página aparecem em Sources.\n\nO roteiro pra um bug: reproduza, marque um breakpoint um pouco antes de onde acha que quebra, rode, e avance linha a linha comparando o valor que você esperava com o que aparece. O primeiro valor diferente do esperado é a pista.\n\nVocê domina este passo quando pausa um programa numa linha, lê o valor de uma variável no painel e avança até encontrar onde ela recebe o valor errado.",
        },
      ],
    },
    {
      id: "assincrono",
      title: "Assincronia",
      level: "intermediario",
      description:
        "Como JavaScript espera sem travar: o event loop, as Promises, o async e await e a primeira requisição de verdade.",
      children: [
        {
          id: "assincrono.eventloop",
          title: "O event loop em uma imagem",
          description:
            "Uma única fila de tarefas e um motor que nunca espera parado: o modelo que explica toda a assincronia.",
          content:
            "JavaScript executa uma coisa de cada vez, numa única linha de execução. Mesmo assim, uma página responde a cliques enquanto baixa imagens e um servidor Node atende centenas de conexões. O que permite isso é o **event loop**.\n\nA imagem: o motor tem uma pilha onde roda o código atual e uma fila onde esperam as tarefas prontas pra rodar. Quando você pede algo demorado (ler um arquivo, esperar dois segundos, buscar dados na rede), o motor entrega o pedido pro ambiente (o navegador ou o Node), que cuida disso em paralelo, e segue executando o resto do seu código. Quando o pedido termina, a função que você deixou pra rodar depois entra na fila, e o loop a executa assim que a pilha esvaziar.\n\n```js\nconsole.log('primeiro');\nsetTimeout(() => console.log('terceiro'), 0);\nconsole.log('segundo');\n// primeiro\n// segundo\n// terceiro\n```\n\nO `setTimeout` com zero milissegundos não roda na hora: ele agenda a função, e ela só entra quando a pilha estiver vazia, depois do `segundo`. Se esse exemplo faz sentido, o modelo assentou.\n\nA consequência tem dois lados. O bom: nada bloqueia enquanto espera. O ruim: se o seu código ficar preso num laço pesado, nada mais roda, nem o clique do usuário; trabalho demorado no navegador precisa ser fatiado ou levado pra fora da linha principal.\n\nOs próximos passos mostram as três formas de escrever 'quando terminar, faça isso': callbacks, Promises e `async`/`await`, o mesmo event loop com sintaxes diferentes. Você domina este passo quando prevê a ordem de saída do exemplo acima e explica por que o zero do `setTimeout` não significa imediato.",
        },
        {
          id: "assincrono.callbacks",
          title: "Callbacks e o problema",
          description:
            "A forma original de esperar, e por que encadear várias etapas com ela vira uma escada ilegível.",
          content:
            "A forma original de lidar com o event loop é passar um callback: uma função que o ambiente chama quando a tarefa termina. Você já viu com `setTimeout`, e é assim que as APIs mais antigas do Node e do navegador funcionam.\n\n```js\nfunction buscarUsuario(id, aoTerminar) {\n  setTimeout(() => aoTerminar({ id, nome: 'Ana' }), 10);\n}\nbuscarUsuario(1, (usuario) => {\n  console.log(usuario.nome); // Ana\n});\n```\n\nFunciona bem pra uma etapa. O problema aparece quando uma etapa depende da anterior: buscar o usuário, depois os pedidos dele, depois os itens do primeiro pedido. Cada 'depois' vira um callback dentro do outro, o código desce em escada pra direita, o tratamento de erro precisa ser repetido em cada nível, e a ordem de leitura deixa de acompanhar a ordem de execução. O apelido disso é callback hell, e não é exagero: era o dia a dia de quem programava JavaScript antes de 2015.\n\nHá outro problema mais sutil: com callbacks, quem chama não tem um **valor** que represente a operação em andamento. Não dá pra guardar numa variável, passar adiante, nem esperar duas ao mesmo tempo sem escrever a coordenação à mão.\n\nÉ esse buraco que a Promise, no próximo passo, preenche: ela transforma 'uma tarefa que termina depois' num objeto, com um lugar fixo pra sucesso e outro pra erro.\n\nVocê domina este passo quando escreve uma função que recebe um callback de conclusão e explica, com o exemplo das três etapas dependentes, por que esse estilo não escala.",
        },
        {
          id: "assincrono.promises",
          title: "Promises",
          description:
            "Um objeto que representa um valor futuro: then para o sucesso, catch para o erro e o encadeamento que substitui a escada.",
          content:
            "Promise é um objeto que representa um valor que ainda não existe, mas vai existir (ou falhar). Ela tem três estados: pendente, resolvida com um valor ou rejeitada com um erro. Você registra o que fazer no sucesso com `then` e no erro com `catch`.\n\n```js\nfunction buscarUsuario(id) {\n  return new Promise((resolver, rejeitar) => {\n    if (id <= 0) return rejeitar(new Error('id invalido'));\n    setTimeout(() => resolver({ id, nome: 'Ana' }), 10);\n  });\n}\nbuscarUsuario(1)\n  .then((usuario) => console.log(usuario.nome)) // Ana\n  .catch((erro) => console.log(erro.message));\n```\n\nO que muda em relação ao callback: `buscarUsuario` **devolve** algo. Esse algo é a Promise, e ela cabe numa variável, pode ser passada adiante e esperada por quem quiser.\n\nO encadeamento resolve a escada. Cada `then` devolve uma Promise nova com o valor que o callback dele retornar; se o callback retornar outra Promise, o próximo `then` espera por ela. Assim, três etapas dependentes viram três `then` em sequência, no mesmo nível, com um único `catch` no fim que pega o erro de qualquer etapa.\n\n`Promise.all` espera várias ao mesmo tempo e entrega os resultados juntos, o que com callbacks exigia coordenação manual. A rejeição de qualquer uma rejeita o conjunto.\n\nNa prática você raramente vai escrever `new Promise`: as APIs modernas já devolvem Promises prontas, e o próximo passo apresenta a sintaxe que faz o encadeamento parecer código comum. Você domina este passo quando explica os três estados e transforma dois callbacks aninhados em dois `then` seguidos de um `catch`.",
          resources: [
            {
              label: "MDN Promise",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Promise",
              kind: "doc",
            },
          ],
        },
        {
          id: "assincrono.asyncawait",
          title: "async e await",
          description:
            "Escrever código assíncrono na ordem em que ele acontece, com try e catch de volta ao normal.",
          content:
            "`async` e `await` são a sintaxe que faz Promise parecer código comum. Uma função marcada com `async` sempre devolve uma Promise; dentro dela, `await` pausa a execução até uma Promise resolver e entrega o valor, como se fosse uma chamada normal.\n\n```js\nfunction esperar(ms) {\n  return new Promise((r) => setTimeout(r, ms));\n}\nasync function contagem() {\n  await esperar(10);\n  console.log('um'); // um\n  await esperar(10);\n  console.log('dois'); // dois\n}\ncontagem();\n```\n\nA ordem de leitura volta a ser a ordem de execução, e o `try`/`catch` da seção de erros passa a funcionar com código assíncrono: um `await` que rejeita lança um erro normal, capturado pelo `catch` de fora. É a mesma máquina do event loop, com a espera escrita de forma sequencial.\n\nDois cuidados. O primeiro: `await` só pode aparecer dentro de função `async` (ou no topo de um módulo, como a seção de módulos mostra). O segundo: `await` em sequência espera uma coisa de cada vez. Se duas buscas não dependem uma da outra, dispare as duas e espere juntas com `Promise.all`, senão você soma os tempos à toa.\n\nO hábito que evita um bug silencioso: toda chamada a função `async` deve ter seu resultado esperado (`await`) ou tratado (`then`/`catch`). Chamar e ignorar a Promise faz um erro futuro sumir sem aviso.\n\nVocê domina este passo quando reescreve um encadeamento de `then` com `async`/`await` e `try`/`catch`, e reconhece quando dois `await` deveriam virar um `Promise.all`.",
          resources: [
            {
              label: "MDN async function",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Statements/async_function",
              kind: "doc",
            },
          ],
        },
        {
          id: "assincrono.fetch",
          title: "fetch e o erro assíncrono",
          description:
            "A primeira requisição HTTP de verdade, o JSON que volta e os dois tipos de falha que precisam de tratamento.",
          content:
            "`fetch` faz uma requisição HTTP e devolve uma Promise com a resposta. Está disponível no navegador e no Node, e é o ponto em que tudo desta trilha se encontra: assincronia, JSON, objetos e tratamento de erro.\n\n```js\nasync function buscarPost(id) {\n  const base = 'https://jsonplaceholder.typicode.com';\n  const resposta = await fetch(`${base}/posts/${id}`);\n  if (!resposta.ok) {\n    throw new Error(`HTTP ${resposta.status}`);\n  }\n  const post = await resposta.json();\n  return post.title;\n}\n```\n\nSão dois `await`, e isso não é acaso. O primeiro espera os cabeçalhos da resposta chegarem; o segundo, `resposta.json()`, lê o corpo inteiro e converte de texto JSON pra objeto, o `JSON.parse` da seção de arrays e objetos acontecendo por baixo.\n\nA parte que quase todo tutorial esquece são as duas falhas diferentes. Falha de **rede** (sem conexão, servidor fora do ar) faz o `fetch` rejeitar, e o `await` lança. Já resposta com status de erro, como `404` ou `500`, **não rejeita**: o `fetch` considera que a conversa aconteceu. Por isso o teste de `resposta.ok`, que é verdadeiro só pra status entre 200 e 299, e o `throw` que transforma o status ruim em erro. Quem chama `buscarPost` trata os dois casos com um único `try`/`catch`.\n\nA URL do exemplo é de um serviço público de testes que devolve posts fictícios; rode com `buscarPost(1).then(console.log)` e veja um título chegar. Troque o id por um número grande e veja o `HTTP 404` no lugar.\n\nVocê domina este passo quando escreve uma função que busca JSON de uma URL, trata os dois tipos de falha e explica por que `404` não cai no `catch` sem o teste de `ok`.",
          resources: [
            {
              label: "MDN Fetch API",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/API/Fetch_API",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "modulos",
      title: "Módulos e ferramentas",
      level: "avancado",
      description:
        "Dividir o programa em arquivos, usar código dos outros com npm e as ferramentas que todo projeto sério tem.",
      children: [
        {
          id: "modulos.esm",
          title: "import e export",
          description:
            "Dividir o código em arquivos que declaram o que oferecem e o que usam: o sistema de módulos da linguagem.",
          content:
            'Módulo é um arquivo que declara o que exporta e importa o que precisa de outros. Até aqui cada exemplo coube num arquivo; um programa real tem dezenas, e o sistema de módulos (ESM, de ECMAScript Modules) é o que os conecta sem variáveis globais nem ordem mágica de carregamento.\n\nUm arquivo `mat.js` exporta duas funções; outro as importa pelo nome:\n\n```js\n// mat.js\nexport function dobro(n) {\n  return n * 2;\n}\nexport const PI = 3.14159;\n```\n\n```js\n// app.js\nimport { dobro, PI } from \'./mat.js\';\nconsole.log(dobro(PI));\n```\n\nO caminho começa com `./` e leva a extensão: é um arquivo, não um pacote. Sem `export`, nada do módulo é visível de fora, o que é bom: cada arquivo escolhe sua interface. Além do export nomeado existe o `export default`, um por arquivo, importado sem chaves e com o nome que o importador quiser.\n\nNo Node, ESM funciona em arquivos `.mjs` ou em projetos cujo `package.json` declara `"type": "module"`, assunto do próximo passo. Você vai cruzar com `require` e `module.exports` em código antigo; é o sistema anterior do Node, o CommonJS, e a leitura é direta: `require` importa, `module.exports` exporta.\n\nNum módulo, `await` funciona no topo do arquivo, sem função `async` em volta, o que resolve a restrição da seção de assincronia pra scripts pequenos.\n\nVocê domina este passo quando separa um programa em dois arquivos com `export` e `import` e roda pelo Node sem erro de resolução.',
          resources: [
            {
              label: "MDN Módulos JavaScript",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Modules",
              kind: "doc",
            },
          ],
        },
        {
          id: "modulos.npm",
          title: "npm e package.json",
          description:
            "O registro público de pacotes, o arquivo que descreve o seu projeto e a pasta que nunca vai pro repositório.",
          content:
            'npm é o gerenciador de pacotes do Node e o maior registro público de código do mundo. Um pacote é um módulo publicado por alguém pra você instalar em vez de escrever. O que conecta o seu projeto ao npm é o `package.json`, o arquivo JSON que descreve o projeto: nome, versão, dependências e scripts.\n\nNuma pasta nova, `npm init -y` cria o arquivo com o mínimo. Instalar um pacote, com `npm install nome`, faz três coisas: baixa o código pra pasta `node_modules`, registra o nome e a faixa de versão em `dependencies`, e grava a versão exata resolvida no `package-lock.json`.\n\n```json\n{\n  "name": "estudos-js",\n  "version": "1.0.0",\n  "type": "module",\n  "dependencies": {\n    "date-fns": "^3.6.0"\n  }\n}\n```\n\nO `"type": "module"` é o que liga o `import`/`export` do passo anterior em arquivos `.js`. O `^` na versão significa \'esta ou qualquer versão compatível mais nova\'; o lock é quem garante que a sua máquina e a do colega instalem exatamente a mesma.\n\nA regra que todo iniciante aprende do jeito difícil: `node_modules` **nunca** vai pro repositório. Ela é enorme e reconstruível; quem clona roda `npm install` e o lock faz o resto. Um `.gitignore` com `node_modules` é a primeira linha de qualquer projeto.\n\nDependências de desenvolvimento (ferramentas que não rodam em produção, como as do passo de ESLint e Prettier) vão em `devDependencies`, instaladas com `npm install -D nome`.\n\nVocê domina este passo quando cria um projeto, instala um pacote, explica o que cada um dos três artefatos gerados faz e mantém `node_modules` fora do Git.',
        },
        {
          id: "modulos.scripts",
          title: "Scripts do package.json",
          description:
            "Dar nome aos comandos do projeto pra ninguém precisar decorar como rodar, testar ou formatar.",
          content:
            'A seção `scripts` do `package.json` dá nome a comandos do terminal. Em vez de todo mundo lembrar a linha exata pra iniciar, testar ou formatar o projeto, o time roda `npm run nome` e o `package.json` sabe o resto.\n\n```json\n{\n  "scripts": {\n    "start": "node app.js",\n    "dev": "node --watch app.js",\n    "format": "prettier --write ."\n  }\n}\n```\n\n`npm run dev` executa `node --watch app.js`, que reinicia o programa a cada arquivo salvo, o modo que você vai querer durante o estudo. `start` e `test` são especiais e dispensam o `run`: `npm start` e `npm test` bastam.\n\nO detalhe que faz os scripts funcionarem com ferramentas instaladas: dentro de um script, o npm coloca a pasta `node_modules/.bin` no caminho, então `prettier` é encontrado mesmo sem instalação global. Esse é o motivo de ferramentas de projeto irem em `devDependencies` e serem chamadas por script, e não instaladas na máquina: cada projeto carrega a versão de que precisa.\n\nO modelo mental: `package.json` é o painel de controle do projeto. Quem chega lê os scripts e sabe o que dá pra fazer; quem sai deixa ali o que aprendeu. Projetos desta plataforma, como qualquer projeto profissional, têm scripts pra tudo que se roda mais de duas vezes.\n\nVocê domina este passo quando adiciona um script `dev` com `--watch`, roda com `npm run dev` e explica por que `prettier` funciona dentro do script sem estar instalado globalmente.',
        },
        {
          id: "modulos.lint",
          title: "ESLint e Prettier",
          description:
            "Uma ferramenta acha erro provável, a outra decide a aparência: as duas juntas tiram discussão de estilo do caminho.",
          content:
            "ESLint e Prettier são as duas ferramentas que todo projeto JavaScript sério tem, e elas fazem trabalhos diferentes. **ESLint** analisa o código em busca de problemas prováveis: variável declarada e nunca usada, comparação com `==`, `await` esquecido numa Promise, função que nunca retorna no caminho de erro. **Prettier** decide a aparência: indentação, aspas, ponto e vírgula, quebra de linha. Ele reescreve o arquivo e não aceita opinião.\n\nA divisão importa porque discussão de estilo consome tempo sem produzir nada. Com o Prettier, a resposta a 'aspas simples ou duplas' é 'o que o Prettier decidiu', e o assunto morre. O ponto e vírgula do primeiro passo desta trilha é um exemplo: o Prettier o coloca, e você para de pensar nisso.\n\nInstalação típica: `npm install -D eslint prettier`, um arquivo de configuração de cada, um script `format` que roda `prettier --write .` e um `lint` que roda `eslint .`. No VS Code, as extensões oficiais mostram os avisos do ESLint enquanto você digita e formatam ao salvar.\n\nO hábito que muda a qualidade do que você escreve: trate aviso do ESLint como pergunta, não como ruído. 'Variável nunca usada' costuma ser código morto; 'Promise não tratada' costuma ser um bug esperando. Configurar as regras é assunto de projeto; começar com a configuração recomendada já pega o que importa.\n\nVocê domina este passo quando explica a diferença de responsabilidade entre as duas ferramentas e tem as duas rodando ao salvar no seu editor.",
        },
        {
          id: "modulos.bundler",
          title: "O que é um bundler",
          description:
            "Por que o código que você escreve não é o que o navegador recebe, e o que Vite e afins fazem no meio.",
          content:
            "Bundler é a ferramenta que pega os seus módulos, as dependências do npm e os arquivos de estilo, e produz o conjunto de arquivos que o navegador realmente recebe. Você escreve dezenas de arquivos pequenos e importa pacotes; o usuário baixa poucos arquivos otimizados. Vite, webpack e esbuild são nomes dessa categoria.\n\nEle existe por três motivos. Navegadores carregam módulos, mas cada `import` vira uma requisição, e centenas delas deixam a página lenta; o bundler junta tudo. Pacotes do npm são feitos pro Node e nem sempre funcionam direto no navegador; o bundler adapta. E código de produção precisa ser menor: o bundler remove espaços, encurta nomes e descarta o que ninguém importa.\n\nO modelo mental é o de uma fábrica com entrada e saída. Entrada: a pasta do seu código. Saída: uma pasta `dist` com o que vai pro servidor. No meio, uma cadeia de transformações que você configura uma vez e esquece. Em desenvolvimento, o mesmo bundler serve os arquivos sem empacotar e recarrega a página a cada mudança.\n\nNesta trilha você não precisa configurar um bundler; o conceito basta pra entender por que um projeto React tem uma etapa de build e por que o arquivo que aparece no DevTools tem nome com letras aleatórias. A trilha de Front-end coloca o Vite pra rodar de verdade.\n\nVocê domina este passo quando explica a alguém o que a pasta `dist` contém, de onde ela veio e por que ela não está no repositório.",
        },
      ],
    },
    {
      id: "avancado",
      title: "JavaScript por dentro",
      level: "avancado",
      description:
        "Os mecanismos que explicam os comportamentos estranhos: this, protótipos, referência e o que TypeScript acrescenta.",
      children: [
        {
          id: "avancado.this",
          title: "this e contexto",
          description:
            "A palavra que muda de valor conforme quem chama, e por que arrow functions não têm uma própria.",
          content:
            "`this` é a palavra que aponta pro contexto em que uma função foi **chamada**, não onde foi escrita. É a regra mais mal compreendida da linguagem, e ela fica simples quando você olha pra chamada em vez da definição.\n\nNum método chamado com ponto, `this` é o objeto antes do ponto. Se você tira o método do objeto e chama solto, o contexto some:\n\n```js\nconst conta = {\n  saldo: 100,\n  mostrar() {\n    return this === undefined ? 'sem this' : this.saldo;\n  },\n};\nconsole.log(conta.mostrar()); // 100\nconst solta = conta.mostrar;\nconsole.log(solta()); // sem this\n```\n\nNa segunda chamada não há objeto antes do ponto e `this` é `undefined` (num módulo ou em modo estrito; em código antigo sem modo estrito, ele cairia no objeto global, o que era pior). Sem a proteção do exemplo, `this.saldo` lançaria um `TypeError`. É o motivo de callbacks que usam `this` quebrarem quando passados pra `setTimeout` ou pra um evento.\n\nArrow functions resolvem isso do jeito oposto: elas **não têm** `this` próprio e usam o da função em volta, como qualquer outra variável do escopo. Dentro de um método, um callback em arrow enxerga o mesmo `this` do método. É a escolha certa pra callbacks; e é o motivo de arrow não servir como método de objeto, porque ali você quer que `this` seja o objeto.\n\nQuando precisar fixar o contexto à mão, `funcao.bind(objeto)` devolve uma cópia com `this` preso. Você domina este passo quando olha uma chamada e diz o que é `this` nela, e explica por que trocar um método por arrow function quebra o `this.saldo`.",
          resources: [
            {
              label: "MDN this",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Operators/this",
              kind: "doc",
            },
          ],
        },
        {
          id: "avancado.prototipos",
          title: "Protótipos e classes",
          description:
            "Como um objeto herda de outro por baixo dos panos, e a sintaxe de classe que organiza isso.",
          content:
            "Todo objeto em JavaScript tem um protótipo: outro objeto de onde ele herda propriedades. Quando você lê `lista.map`, o motor não acha `map` no array, sobe pro protótipo dos arrays e acha lá. É a cadeia de protótipos, e é por ela que arrays, strings e objetos têm métodos sem que você os declare.\n\nA sintaxe de `class` organiza esse mecanismo com uma forma que lembra outras linguagens, sem mudar o que acontece por baixo:\n\n```js\nclass Conta {\n  constructor(titular) {\n    this.titular = titular;\n    this.saldo = 0;\n  }\n  depositar(valor) {\n    this.saldo += valor;\n    return this;\n  }\n}\nconst conta = new Conta('Ana').depositar(50);\nconsole.log(conta.saldo); // 50\n```\n\n`new` cria um objeto vazio, aponta o protótipo dele pra `Conta.prototype` e roda o `constructor` com `this` sendo esse objeto novo. O método `depositar` não é copiado pra cada conta: fica no protótipo, e todas as instâncias o compartilham. O `return this` permite encadear chamadas, como no exemplo.\n\n`extends` faz uma classe herdar de outra, e `super` chama o construtor ou os métodos da classe de cima. Vale usar quando há uma relação real de especialização; empilhar três níveis de herança costuma render código difícil de mudar, e composição (um objeto que tem outro) resolve melhor na maioria dos casos.\n\nO modelo mental: classe é uma fábrica com molde compartilhado. Você domina este passo quando explica onde mora um método declarado na classe e por que `conta.depositar === outraConta.depositar` é verdadeiro.",
          resources: [
            {
              label: "MDN Classes",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Classes",
              kind: "doc",
            },
          ],
        },
        {
          id: "avancado.referencia",
          title: "Referência versus valor e imutabilidade",
          description:
            "Por que copiar um objeto não copia nada, o bug que isso causa e o hábito de criar novos em vez de alterar.",
          content:
            "Primitivos são copiados por valor; objetos e arrays, por referência. Atribuir um número a outra variável cria uma cópia independente. Atribuir um objeto faz as duas variáveis apontarem pro **mesmo** objeto, e alterar por uma altera pra outra.\n\n```js\nlet a = 1;\nlet b = a;\nb = 2;\nconsole.log(a); // 1\nconst original = { itens: [1, 2] };\nconst apelido = original;\napelido.itens.push(3);\nconsole.log(original.itens); // [ 1, 2, 3 ]\n```\n\nO bug clássico: uma função recebe um objeto, altera uma propriedade pra uso interno e, sem querer, muda o objeto de quem chamou, que aparece diferente em outra parte do programa. O rastro leva a uma função que parecia inocente.\n\nA defesa é o hábito de **imutabilidade**: em vez de alterar, criar um novo com a mudança. O spread do passo de destructuring é a ferramenta: `{ ...original, ativo: true }` e `[...lista, item]` produzem cópias, e o original fica intacto. Métodos como `map` e `filter` seguem a mesma ideia, e é por isso que eles devolvem arrays novos.\n\nO limite do spread: ele copia um nível só. `{ ...original }` cria um objeto novo, mas `itens` dentro dele continua sendo o mesmo array. Pra copiar em profundidade existe `structuredClone(valor)`, disponível no Node e nos navegadores atuais.\n\nEsse hábito é a base de como React e outras bibliotecas detectam mudança: elas comparam referências, e um objeto alterado no lugar parece igual a si mesmo. Você domina este passo quando prevê o resultado do exemplo acima antes de rodar e reescreve um `push` como uma cópia com spread.",
        },
        {
          id: "avancado.typescript",
          title: "O que TypeScript resolve",
          description:
            "Os erros que só aparecem rodando, a camada de tipos que os pega antes, e por que a próxima trilha é TypeScript.",
          content:
            "TypeScript é JavaScript com tipos declarados: você diz que `idade` é `number` e que `buscarPost` devolve uma Promise de string, e uma ferramenta confere o programa antes de rodar. O código que sai da conferência é JavaScript comum; o navegador e o Node nunca veem os tipos.\n\nO problema que ele resolve apareceu várias vezes nesta trilha: em JavaScript, a maioria dos erros só aparece **executando**. O `TypeError` de ler `cidade` em `undefined`, o argumento a menos que vira `undefined`, a função que passou a devolver string depois de uma mudança. Com tipos, cada um vira um sublinhado vermelho no editor, enquanto você escreve.\n\nO segundo ganho é o editor entender o seu código: ao digitar `usuario.`, a lista de propriedades aparece, porque a ferramenta sabe o que `usuario` é. Em projeto grande, com mais de uma pessoa, isso vale mais do que a checagem.\n\nO modelo mental: TypeScript é um verificador de contratos. Você declara o que cada função aceita e devolve; a ferramenta cobra o contrato dos dois lados. Tudo que você aprendeu aqui continua valendo, porque TypeScript **é** JavaScript com uma camada por cima.\n\nEsta plataforma vai ter uma trilha de TypeScript que começa deste ponto. Enquanto ela não existe, o caminho é o projeto desta trilha e as trilhas de área que usam JavaScript, no passo final.\n\nVocê domina este passo quando cita três erros desta trilha que TypeScript pegaria antes de rodar e explica por que o navegador não precisa saber que o código foi escrito em TypeScript.",
        },
      ],
    },
    {
      id: "projeto",
      title: "Projeto",
      level: "avancado",
      description:
        "Um programa de terminal completo, escrito só com o que a trilha ensinou, e os caminhos que se abrem depois.",
      children: [
        {
          id: "projeto.cli",
          title: "Projeto: CLI de tarefas no terminal",
          description:
            "Um gerenciador de tarefas de linha de comando com Node e um arquivo JSON local, aplicando a trilha inteira.",
          project: "cli-tarefas-terminal",
        },
        {
          id: "projeto.caminhos",
          title: "Próximos caminhos",
          description:
            "Onde JavaScript leva depois desta trilha: as trilhas de área que o usam e como escolher a sua.",
          content:
            "JavaScript é a linguagem que aparece em mais trilhas desta plataforma, e terminar esta é o ponto de partida de várias outras. Com a linguagem assentada, a pergunta deixa de ser 'como escrevo isso' e passa a ser 'o que quero construir'.\n\nA trilha de **Front-end** é a continuação mais direta: ela pega o JavaScript daqui e o coloca pra manipular a página, reagir a eventos e, mais adiante, montar interfaces com React. Tudo que o passo do Console apresentou de relance vira o centro dela.\n\nA trilha de **Back-end**, escolhendo Node no seletor de linguagem, leva o mesmo código pro servidor: rotas HTTP, banco de dados, autenticação. A seção de assincronia e o `fetch` desta trilha são o que você vai usar do outro lado da conversa, respondendo requisições em vez de fazê-las.\n\nA trilha de **Mobile**, com React Native, usa JavaScript pra construir aplicativos de celular a partir das mesmas ideias de componente que o Front-end ensina; faz sentido depois dela.\n\nAntes de qualquer uma, o projeto desta trilha: o gerenciador de tarefas no terminal usa arrays, objetos, JSON, módulos, tratamento de erro e leitura de arquivo, e fica pronto sem nada que você não tenha visto aqui. Termine, publique no GitHub e leve como primeira peça do portfólio.\n\nVocê domina este passo, e a trilha, quando olha pra uma ideia de programa e consegue dizer qual dessas trilhas ensina o que falta pra construí-la.",
        },
      ],
    },
  ],
};
