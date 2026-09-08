// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool javascript). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "javascript",
  "questions": [
    {
      "id": "javascript-ini-01",
      "nivel": "iniciante",
      "pergunta": "Qual é a principal função do JavaScript em uma página web?",
      "alternativas": {
        "a": "Criar a estrutura da página com HTML",
        "b": "Definir a aparência da página com CSS",
        "c": "Executar decisões e interagir com o usuário",
        "d": "Armazenar dados no servidor"
      },
      "correta": "c",
      "explicacao": "JavaScript é responsável por executar decisões, como reações a cliques e validações, tornando a página interativa.",
      "fonte": "comeco.oque"
    },
    {
      "id": "javascript-ini-02",
      "nivel": "iniciante",
      "pergunta": "Seguindo a recomendação de boas práticas, qual é a maneira correta de encerrar uma instrução em JavaScript?",
      "alternativas": {
        "a": "Deixar a linha em branco",
        "b": "Usar ponto e vírgula no final",
        "c": "Usar dois pontos no final",
        "d": "Não usar nada, o JavaScript insere automaticamente"
      },
      "correta": "b",
      "explicacao": "Usar ponto e vírgula no final de cada instrução é uma boa prática que evita surpresas no código.",
      "fonte": "comeco.sintaxe"
    },
    {
      "id": "javascript-ini-03",
      "nivel": "iniciante",
      "pergunta": "Qual método completa a lacuna para que o programa escreva Olá no terminal ao rodar com node?",
      "alternativas": {
        "a": "log",
        "b": "print",
        "c": "write",
        "d": "echo"
      },
      "correta": "a",
      "explicacao": "console.log é o método que escreve no terminal (e no Console do navegador). print, write e echo não existem em console, e chamar um deles lança TypeError.",
      "fonte": "comeco.primeiro",
      "tipo": "completar",
      "codigo": {
        "linguagem": "js",
        "trecho": "console.____('Olá');"
      },
      "alternativasCodigo": true
    },
    {
      "id": "javascript-ini-04",
      "nivel": "iniciante",
      "pergunta": "Este código deveria imprimir primeira e segunda, uma em cada linha, mas o Node recusa o arquivo antes de executar qualquer linha. Qual é o defeito?",
      "alternativas": {
        "a": "Falta o parêntese de fechamento na segunda chamada de console.log",
        "b": "Falta um ponto e vírgula no fim da primeira linha",
        "c": "console.log só pode ser chamado uma vez por arquivo",
        "d": "Strings em JavaScript precisam de aspas duplas, não simples"
      },
      "correta": "a",
      "explicacao": "A segunda chamada abre o parêntese e nunca fecha, e o interpretador para no SyntaxError antes de executar qualquer linha. Ponto e vírgula e aspas simples não são o problema.",
      "fonte": "comeco.primeiro",
      "tipo": "erro",
      "codigo": {
        "linguagem": "js",
        "trecho": "console.log('primeira');\nconsole.log('segunda';"
      }
    },
    {
      "id": "javascript-ini-05",
      "nivel": "iniciante",
      "pergunta": "O que este código imprime?",
      "alternativas": {
        "a": "Olá, JavaScript!",
        "b": "undefined",
        "c": "Erro: console.log não é uma função",
        "d": "Nada aparece no terminal"
      },
      "correta": "a",
      "explicacao": "O código imprime 'Olá, JavaScript!' porque a função console.log está corretamente utilizada para exibir a mensagem.",
      "fonte": "comeco.primeiro",
      "tipo": "saida",
      "codigo": {
        "linguagem": "js",
        "trecho": "console.log('Olá, JavaScript!');"
      },
      "alternativasCodigo": true
    },
    {
      "id": "javascript-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você precisa verificar o tipo de uma variável chamada `valor`. Qual comando você usa?",
      "alternativas": {
        "a": "console.log(valor.type)",
        "b": "console.log(typeof valor)",
        "c": "console.log(valor)",
        "d": "console.log(valor.class)"
      },
      "correta": "b",
      "explicacao": "O operador `typeof` é usado para verificar o tipo de um valor em JavaScript.",
      "fonte": "valores.tipos"
    },
    {
      "id": "javascript-ini-07",
      "nivel": "iniciante",
      "pergunta": "Ao declarar uma variável que não irá mudar de valor, qual é a palavra-chave recomendada?",
      "alternativas": {
        "a": "let",
        "b": "var",
        "c": "const",
        "d": "dynamic"
      },
      "correta": "c",
      "explicacao": "A palavra-chave `const` é usada para declarar variáveis que não serão reatribuídas.",
      "fonte": "valores.let"
    },
    {
      "id": "javascript-ini-08",
      "nivel": "iniciante",
      "pergunta": "Qual é o erro neste código que deveria somar dois números?",
      "alternativas": {
        "a": "Ele não tem erro, soma corretamente.",
        "b": "Usou `==` ao invés de `===`.",
        "c": "Está usando `undefined` como valor.",
        "d": "Está tentando somar uma string e um número."
      },
      "correta": "d",
      "explicacao": "Somar uma string e um número resulta em concatenação, não em soma numérica.",
      "fonte": "valores.conversao",
      "tipo": "erro",
      "codigo": {
        "linguagem": "js",
        "trecho": "const a = '5';\nconst b = 3;\nconsole.log(a + b);"
      }
    },
    {
      "id": "javascript-ini-09",
      "nivel": "iniciante",
      "pergunta": "Qual linha completa corretamente a seguinte expressão para que a saída seja 43?",
      "alternativas": {
        "a": "Number('42') + 1",
        "b": "String(42) + 1",
        "c": "Boolean(42) + 1",
        "d": "Number('abc') + 1"
      },
      "correta": "a",
      "explicacao": "`Number('42')` converte a string '42' em número e, somado a 1, resulta em 43.",
      "fonte": "valores.conversao",
      "tipo": "completar",
      "codigo": {
        "linguagem": "js",
        "trecho": "console.log(____);"
      },
      "alternativasCodigo": true
    },
    {
      "id": "javascript-ini-10",
      "nivel": "iniciante",
      "pergunta": "O que este código imprime?",
      "alternativas": {
        "a": "51",
        "b": "4",
        "c": "NaN",
        "d": "0"
      },
      "correta": "a",
      "explicacao": "A operação `+` com uma string e um número resulta na concatenação, então imprime '51'.",
      "fonte": "valores.conversao",
      "tipo": "saida",
      "codigo": {
        "linguagem": "js",
        "trecho": "console.log('5' + 1);"
      },
      "alternativasCodigo": true
    },
    {
      "id": "javascript-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você precisa verificar se um número é par ou ímpar. Qual expressão deve ser usada para que o código retorne 'par' se o número for par e 'ímpar' se não for?",
      "alternativas": {
        "a": "numero % 2 === 0 ? 'par' : 'ímpar'",
        "b": "numero % 2 = 0 ? 'par' : 'ímpar'",
        "c": "numero % 2 ? 'par' : 'ímpar'",
        "d": "numero % 2 !== 0 ? 'par' : 'ímpar'"
      },
      "correta": "a",
      "explicacao": "A alternativa correta usa o operador ternário corretamente para verificar se o número é par, retornando 'par' ou 'ímpar' conforme o resultado da condição.",
      "fonte": "fluxo.if",
      "tipo": "completar",
      "codigo": {
        "linguagem": "js",
        "trecho": "const numero = 4;\nconst resultado = ____;\nconsole.log(resultado);"
      },
      "alternativasCodigo": true
    },
    {
      "id": "javascript-ini-12",
      "nivel": "iniciante",
      "pergunta": "Este código deveria imprimir true somente quando a idade for maior ou igual a 18 E o usuário tiver ingresso. Com temIngresso false ele imprime true. Qual é o defeito?",
      "alternativas": {
        "a": "A condição deve usar '&&' no lugar de '||', para exigir as duas coisas.",
        "b": "A condição deve usar '!' antes de 'temIngresso'.",
        "c": "A condição deve usar '==' ao invés de '>=' para comparar a idade.",
        "d": "A condição está correta, o defeito é o valor de temIngresso."
      },
      "correta": "a",
      "explicacao": "Com || basta uma das condições ser verdadeira, então idade >= 18 sozinha já dá true. A intenção exige as duas ao mesmo tempo, e isso só && faz.",
      "fonte": "fluxo.logicos",
      "tipo": "erro",
      "codigo": {
        "linguagem": "js",
        "trecho": "const idade = 20;\nconst temIngresso = false;\nconsole.log(idade >= 18 || temIngresso);"
      }
    },
    {
      "id": "javascript-ini-13",
      "nivel": "iniciante",
      "pergunta": "Qual é a saída do seguinte código?",
      "alternativas": {
        "a": "1\n2\n3",
        "b": "1\n2\n3\n4",
        "c": "1\n2",
        "d": "1\n2\n3\n4\n5"
      },
      "correta": "a",
      "explicacao": "O código executa um laço for que imprime os números de 1 a 3, conforme definido na condição do laço.",
      "fonte": "fluxo.for",
      "tipo": "saida",
      "codigo": {
        "linguagem": "js",
        "trecho": "for (let i = 1; i <= 3; i++) {\n  console.log(i);\n}"
      },
      "alternativasCodigo": true
    },
    {
      "id": "javascript-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você deseja executar um bloco de código baseado no dia da semana. Qual é a prática recomendada para usar um switch, considerando que você quer evitar a execução de casos indesejados?",
      "alternativas": {
        "a": "Colocar break no fim de cada case, porque sem ele a execução continua no case seguinte.",
        "b": "Usar return no lugar de break, porque break só funciona dentro de laços for e while.",
        "c": "Colocar o default antes dos outros cases, para que ele sirva de guarda para os demais.",
        "d": "Não colocar nada, porque o switch encerra sozinho assim que um case casa com o valor."
      },
      "correta": "a",
      "explicacao": "Sem break a execução cai no case seguinte (fall-through), então o break no fim de cada case é o que impede casos indesejados de rodar. A posição do default não muda quem casa, e break funciona em switch.",
      "fonte": "fluxo.switch"
    },
    {
      "id": "javascript-ini-15",
      "nivel": "iniciante",
      "pergunta": "Quando você utiliza o for...of para percorrer uma lista, qual é a principal vantagem em relação ao for tradicional?",
      "alternativas": {
        "a": "O for...of não requer um contador explícito.",
        "b": "O for...of é mais rápido que o for tradicional.",
        "c": "O for...of permite modificar os itens da lista durante a iteração.",
        "d": "O for...of pode acessar o índice dos itens diretamente."
      },
      "correta": "a",
      "explicacao": "A principal vantagem do for...of é que ele não requer um contador explícito, tornando o código mais limpo e fácil de entender.",
      "fonte": "fluxo.forof"
    },
    {
      "id": "javascript-int-01",
      "nivel": "intermediario",
      "pergunta": "Você precisa de uma função area(largura, altura) em que, quando altura for omitida, ela vale o mesmo que largura. Usando o recurso de parâmetro padrão da linguagem, qual declaração faz isso?",
      "alternativas": {
        "a": "function area(largura, altura = largura) { return largura * altura; }",
        "b": "function area(largura, altura) { if (!altura) altura = largura; return largura * altura; }",
        "c": "function area(largura, altura = 0) { return largura * altura; }",
        "d": "function area(largura, altura = 1) { return largura * altura; }"
      },
      "correta": "a",
      "explicacao": "O parâmetro padrão pode usar um parâmetro anterior, então altura = largura cobre a omissão. O if dentro do corpo não usa o recurso pedido e trata 0 como omitido; os padrões 1 e 0 não valem a largura.",
      "fonte": "funcoes.parametros"
    },
    {
      "id": "javascript-int-02",
      "nivel": "intermediario",
      "pergunta": "Você precisa criar uma função que deve ser chamada antes de sua definição, mas ela está definida como uma expressão. O que acontece se você tentar chamá-la antes?",
      "alternativas": {
        "a": "O código roda normalmente, pois a função é acessível antes da definição.",
        "b": "O código gera um erro de referência, pois a função ainda não foi definida.",
        "c": "O código retorna undefined, pois a função não tem retorno.",
        "d": "O código executa a função, mas não faz nada."
      },
      "correta": "b",
      "explicacao": "Funções definidas como expressões não são hoisted, portanto, chamá-las antes da definição resulta em um erro de referência.",
      "fonte": "funcoes.declarar"
    },
    {
      "id": "javascript-int-03",
      "nivel": "intermediario",
      "pergunta": "Qual é o erro neste código, que deveria somar dois números e retornar o resultado?",
      "alternativas": {
        "a": "Falta o return na função.",
        "b": "Os parâmetros não estão definidos corretamente.",
        "c": "A função não está sendo chamada corretamente.",
        "d": "A função não está usando o operador de soma."
      },
      "correta": "a",
      "explicacao": "O código não retorna o resultado da soma porque falta a instrução 'return' na função, resultando em undefined.",
      "fonte": "funcoes.parametros",
      "tipo": "erro",
      "codigo": {
        "linguagem": "js",
        "trecho": "function somar(a, b) {\n  a + b;\n}"
      }
    },
    {
      "id": "javascript-int-04",
      "nivel": "intermediario",
      "pergunta": "O que este código imprime?",
      "alternativas": {
        "a": "1 2",
        "b": "1 1",
        "c": "1 undefined",
        "d": "undefined undefined"
      },
      "correta": "a",
      "explicacao": "Cada chamada de contar incrementa o total guardado pela closure, e console.log com dois argumentos imprime os dois na mesma linha, separados por espaço: 1 2.",
      "fonte": "funcoes.escopo",
      "tipo": "saida",
      "codigo": {
        "linguagem": "js",
        "trecho": "function criarContador() {\n  let total = 0;\n  return () => {\n    total++;\n    return total;\n  };\n}\nconst contar = criarContador();\nconsole.log(contar(), contar());"
      },
      "alternativasCodigo": true
    },
    {
      "id": "javascript-int-05",
      "nivel": "intermediario",
      "pergunta": "Você tem um array de preços e precisa encontrar o primeiro preço que é maior que 30. Qual método você deve usar?",
      "alternativas": {
        "a": "map",
        "b": "filter",
        "c": "find",
        "d": "reduce"
      },
      "correta": "c",
      "explicacao": "O método `find` retorna o primeiro elemento que satisfaz a condição especificada, que no caso é ser maior que 30.",
      "fonte": "estruturas.metodos"
    },
    {
      "id": "javascript-int-06",
      "nivel": "intermediario",
      "pergunta": "Você está criando um objeto para um usuário e deseja adicionar um novo campo de e-mail. Qual é a forma correta de fazer isso?",
      "alternativas": {
        "a": "usuario[email] = 'usuario@exemplo.com';",
        "b": "usuario.email = 'usuario@exemplo.com';",
        "c": "usuario.add('email', 'usuario@exemplo.com');",
        "d": "usuario.set('email', 'usuario@exemplo.com');"
      },
      "correta": "b",
      "explicacao": "A notação de ponto acrescenta a propriedade. Colchetes também funcionam, mas exigem a chave como string: usuario[email] sem aspas procura uma variável chamada email. Objetos não têm métodos add nem set.",
      "fonte": "estruturas.objetos"
    },
    {
      "id": "javascript-int-07",
      "nivel": "intermediario",
      "pergunta": "Este código deveria somar os itens da lista e devolver 0 quando ela estiver vazia, mas lança um erro. Qual é o defeito?",
      "alternativas": {
        "a": "Sem valor inicial, reduce lança TypeError em array vazio; falta o 0 como segundo argumento.",
        "b": "O callback não está devolvendo o valor acumulado a cada passo.",
        "c": "reduce não funciona em array vazio; o caso precisa ser tratado com forEach.",
        "d": "A variável soma precisa ser declarada com let para receber o resultado."
      },
      "correta": "a",
      "explicacao": "Sem valor inicial, reduce usa o primeiro item como acumulador, e em array vazio não existe primeiro item, então lança. Passar 0 como segundo argumento devolve 0 na lista vazia e soma normalmente nas outras.",
      "fonte": "estruturas.metodos",
      "tipo": "erro",
      "codigo": {
        "linguagem": "js",
        "trecho": "const numeros = [];\nconst soma = numeros.reduce((acc, num) => acc + num);\nconsole.log(soma);"
      }
    },
    {
      "id": "javascript-int-08",
      "nivel": "intermediario",
      "pergunta": "Qual é a saída do seguinte código?",
      "alternativas": {
        "a": "[ 1, 2, 3 ]\n[ 1, 2, 3 ]",
        "b": "[ 1, 2, 3 ]\n[ 1, 2, 3, 4 ]",
        "c": "[ 1, 2, 3, 4 ]\n[ 1, 2, 3 ]",
        "d": "[ 1, 2 ]\n[ 1, 2, 3, 4 ]"
      },
      "correta": "b",
      "explicacao": "O código usa o spread operator para adicionar 4 ao final do array original, resultando em `[1, 2, 3, 4]`.",
      "fonte": "estruturas.destructuring",
      "tipo": "saida",
      "codigo": {
        "linguagem": "js",
        "trecho": "const lista = [1, 2, 3];\nconst novaLista = [...lista, 4];\nconsole.log(lista);\nconsole.log(novaLista);"
      },
      "alternativasCodigo": true
    },
    {
      "id": "javascript-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está depurando um código e encontrou um erro que diz 'Cannot read properties of undefined (reading 'itens')'. Qual tipo de erro é esse?",
      "alternativas": {
        "a": "SyntaxError",
        "b": "ReferenceError",
        "c": "TypeError",
        "d": "EvalError"
      },
      "correta": "c",
      "explicacao": "Esse erro indica que você está tentando acessar uma propriedade de um valor que é undefined, caracterizando um TypeError.",
      "fonte": "erros.tipos"
    },
    {
      "id": "javascript-int-10",
      "nivel": "intermediario",
      "pergunta": "Você precisa capturar um erro que pode ocorrer ao fazer o parse de um JSON. Qual é a melhor prática ao usar try e catch?",
      "alternativas": {
        "a": "Capturar todos os erros sem tratamento",
        "b": "Capturar apenas erros que você sabe como tratar",
        "c": "Ignorar o erro e seguir o código",
        "d": "Capturar erros e imprimir uma mensagem genérica"
      },
      "correta": "b",
      "explicacao": "A melhor prática é capturar apenas os erros que você sabe como tratar, para evitar esconder problemas sem solução.",
      "fonte": "erros.trycatch"
    },
    {
      "id": "javascript-int-11",
      "nivel": "intermediario",
      "pergunta": "Um programa para com TypeError: Cannot read properties of undefined (reading 'itens'). No stack trace, a primeira linha aponta para calcularTotal e a segunda para processar. O que essa leitura diz sobre a origem do problema?",
      "alternativas": {
        "a": "O erro estourou dentro de calcularTotal, ao ler itens de um valor undefined que chegou de quem a chamou",
        "b": "O erro estourou dentro de processar, porque a última linha do stack trace é sempre a origem do problema",
        "c": "A propriedade itens não existe no objeto e precisa ser criada antes de calcularTotal ser chamada",
        "d": "O arquivo onde calcularTotal foi definida não foi carregado, por isso o valor dela é undefined"
      },
      "correta": "a",
      "explicacao": "A primeira linha do stack trace é o ponto onde o erro estourou e as seguintes mostram o caminho de chamadas até ali. O undefined da mensagem é o valor recebido, não a propriedade lida.",
      "fonte": "erros.stack"
    },
    {
      "id": "javascript-int-12",
      "nivel": "intermediario",
      "pergunta": "Este código deveria devolver um objeto vazio e avisar config invalida quando o texto não for JSON válido, mas o programa cai. Qual é o defeito?",
      "alternativas": {
        "a": "JSON.parse lança em texto inválido, e sem try e catch o erro escapa antes do if",
        "b": "JSON.parse devolve null em texto inválido, então o if deveria comparar com null",
        "c": "Falta um return depois do console.log, por isso a função continua executando",
        "d": "O texto '{tema}' é JSON válido e a função deveria devolver { tema: true }"
      },
      "correta": "a",
      "explicacao": "JSON.parse não devolve um valor falso em texto inválido: ele lança SyntaxError. Sem try e catch em volta da chamada, o erro sobe e o if nunca roda.",
      "fonte": "erros.trycatch",
      "tipo": "erro",
      "codigo": {
        "linguagem": "js",
        "trecho": "function lerConfig(texto) {\n  const config = JSON.parse(texto);\n  if (!config) {\n    console.log('config invalida');\n    return {};\n  }\n  return config;\n}\nconsole.log(lerConfig('{tema}'));"
      }
    },
    {
      "id": "javascript-int-13",
      "nivel": "intermediario",
      "pergunta": "Você está lidando com uma operação assíncrona que deve ser feita em sequência, mas deseja evitar o callback hell. Qual abordagem você deve usar?",
      "alternativas": {
        "a": "Utilizar Promises com o método then para encadear as operações.",
        "b": "Usar callbacks aninhados para cada operação assíncrona.",
        "c": "Implementar um loop para gerenciar as operações assíncronas.",
        "d": "Executar todas as operações em paralelo sem controle."
      },
      "correta": "a",
      "explicacao": "Utilizar Promises com o método then permite encadear operações assíncronas de forma mais legível e organizada, evitando o callback hell.",
      "fonte": "assincrono.callbacks"
    },
    {
      "id": "javascript-int-14",
      "nivel": "intermediario",
      "pergunta": "Este código deveria buscar o usuário e, quando o id for inválido, imprimir a mensagem id invalido sem derrubar o programa. Com id -1 o Node encerra com erro. Qual é o defeito?",
      "alternativas": {
        "a": "A rejeição não é tratada: falta um .catch depois do .then para imprimir a mensagem.",
        "b": "O .then precisa receber dois callbacks, senão a Promise nunca resolve.",
        "c": "rejeitar precisa receber uma string, não um Error, para a mensagem aparecer.",
        "d": "O setTimeout nunca dispara porque o return sai da função antes dele."
      },
      "correta": "a",
      "explicacao": "Uma Promise rejeitada sem .catch vira rejeição não tratada, e o Node encerra o processo com erro. O .catch é onde a mensagem seria impressa sem derrubar o programa.",
      "fonte": "assincrono.promises",
      "tipo": "erro",
      "codigo": {
        "linguagem": "js",
        "trecho": "function buscarUsuario(id) {\n  return new Promise((resolver, rejeitar) => {\n    if (id <= 0) return rejeitar(new Error('id invalido'));\n    setTimeout(() => resolver({ id, nome: 'Ana' }), 10);\n  });\n}\nbuscarUsuario(-1)\n  .then((usuario) => console.log(usuario.nome));"
      }
    },
    {
      "id": "javascript-int-15",
      "nivel": "intermediario",
      "pergunta": "O que este código imprime?",
      "alternativas": {
        "a": "um\ndois",
        "b": "dois\num",
        "c": "um\ndo\num",
        "d": "um\ndois\nundefined"
      },
      "correta": "a",
      "explicacao": "O código imprime 'um' e 'dois' na ordem correta, pois os await garantem que cada chamada seja concluída antes de prosseguir.",
      "fonte": "assincrono.asyncawait",
      "tipo": "saida",
      "codigo": {
        "linguagem": "js",
        "trecho": "function esperar(ms) {\n  return new Promise((r) => setTimeout(r, ms));\n}\nasync function contagem() {\n  await esperar(10);\n  console.log('um');\n  await esperar(10);\n  console.log('dois');\n}\ncontagem();"
      },
      "alternativasCodigo": true
    },
    {
      "id": "javascript-av-01",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um projeto e precisa dividir seu código em módulos. Qual é a principal vantagem de usar o sistema de módulos (ESM) em JavaScript?",
      "alternativas": {
        "a": "Evita a necessidade de usar variáveis globais.",
        "b": "Permite que todos os módulos sejam carregados simultaneamente.",
        "c": "Facilita a escrita de código sem precisar de arquivos externos.",
        "d": "Garante que todas as funções sejam exportadas automaticamente."
      },
      "correta": "a",
      "explicacao": "O sistema de módulos (ESM) evita a poluição do escopo global, permitindo que cada módulo declare suas próprias dependências e interfaces.",
      "fonte": "modulos.esm"
    },
    {
      "id": "javascript-av-02",
      "nivel": "avancado",
      "pergunta": "Ao usar o npm para gerenciar dependências, qual é a função do arquivo `package-lock.json`?",
      "alternativas": {
        "a": "Armazenar a versão exata das dependências instaladas.",
        "b": "Registrar as dependências que não são necessárias para o projeto.",
        "c": "Definir a estrutura de pastas do projeto.",
        "d": "Listar todos os scripts disponíveis no projeto."
      },
      "correta": "a",
      "explicacao": "O `package-lock.json` garante que a versão exata das dependências seja instalada, garantindo consistência entre diferentes ambientes.",
      "fonte": "modulos.npm"
    },
    {
      "id": "javascript-av-03",
      "nivel": "avancado",
      "pergunta": "Você deseja adicionar um comando para formatar seu código usando o Prettier no seu projeto. Qual deve ser a estrutura correta para o script no `package.json`?",
      "alternativas": {
        "a": "\"format\": \"prettier --write .\"",
        "b": "\"format\": \"npm prettier --write .\"",
        "c": "\"format\": \"node prettier --write .\"",
        "d": "\"format\": \"prettier .\""
      },
      "correta": "a",
      "explicacao": "A estrutura correta do script deve chamar o Prettier com a opção `--write` para formatar os arquivos no diretório atual.",
      "fonte": "modulos.scripts"
    },
    {
      "id": "javascript-av-04",
      "nivel": "avancado",
      "pergunta": "Qual é a principal função de um bundler em um projeto JavaScript?",
      "alternativas": {
        "a": "Juntar todos os arquivos em um único arquivo para o navegador.",
        "b": "Executar o código JavaScript no servidor.",
        "c": "Converter arquivos de estilo em JavaScript.",
        "d": "Gerar documentação automaticamente."
      },
      "correta": "a",
      "explicacao": "Um bundler combina todos os módulos e dependências em um ou poucos arquivos otimizados, melhorando o desempenho no navegador.",
      "fonte": "modulos.bundler"
    },
    {
      "id": "javascript-av-05",
      "nivel": "avancado",
      "pergunta": "Este código deveria exportar a função 'dobro' corretamente, mas falha. Qual é o erro neste código?",
      "alternativas": {
        "a": "A função não está sendo chamada corretamente.",
        "b": "Faltou a palavra-chave 'export' antes da função.",
        "c": "O nome da função não pode ser 'dobro'.",
        "d": "O arquivo não possui a extensão correta."
      },
      "correta": "b",
      "explicacao": "Sem a palavra-chave 'export', a função 'dobro' não será visível fora do módulo, resultando em falha ao tentar importá-la.",
      "fonte": "modulos.esm",
      "tipo": "erro",
      "codigo": {
        "linguagem": "js",
        "trecho": "function dobro(n) {\n  return n * 2;\n}"
      }
    },
    {
      "id": "javascript-av-06",
      "nivel": "avancado",
      "pergunta": "Num projeto com type module, o arquivo app.js faz import { dobro } from 'mat.js' e o Node falha com ERR_MODULE_NOT_FOUND, embora mat.js esteja na mesma pasta de app.js. Por que a importação falha?",
      "alternativas": {
        "a": "A função dobro precisa ser exportada com export default para poder ser importada por nome",
        "b": "O Node só resolve módulos locais quando a extensão .js é omitida no especificador do import",
        "c": "Sem ./ no início, 'mat.js' é procurado como pacote em node_modules, não como arquivo ao lado",
        "d": "Módulos locais exigem require, porque import serve apenas para pacotes instalados"
      },
      "correta": "c",
      "explicacao": "Especificador que não começa com ./, ../ ou / é tratado como nome de pacote. Arquivo local pede caminho relativo com a extensão, como './mat.js'.",
      "fonte": "modulos.esm"
    },
    {
      "id": "javascript-av-07",
      "nivel": "avancado",
      "pergunta": "O que este código imprime?",
      "alternativas": {
        "a": "6.28318",
        "b": "3.14159",
        "c": "NaN",
        "d": "6.28"
      },
      "correta": "a",
      "explicacao": "dobro devolve n * 2, e 3.14159 vezes 2 é 6.28318, impresso sem arredondamento.",
      "fonte": "modulos.esm",
      "tipo": "saida",
      "codigo": {
        "linguagem": "js",
        "trecho": "function dobro(n) {\n  return n * 2;\n}\nconst PI = 3.14159;\nconsole.log(dobro(PI));"
      },
      "alternativasCodigo": true
    },
    {
      "id": "javascript-av-08",
      "nivel": "avancado",
      "pergunta": "Você precisa garantir que o método `mostrar` da conta retorne o saldo corretamente, mesmo quando chamado sem um objeto. O que você faz?",
      "alternativas": {
        "a": "Usar uma arrow function para `mostrar`",
        "b": "Usar `bind` para fixar `this`",
        "c": "Chamar `mostrar` diretamente no objeto",
        "d": "Remover o método do objeto e chamá-lo solto"
      },
      "correta": "b",
      "explicacao": "Usar `bind` fixa o contexto de `this`, permitindo que o método acesse corretamente o saldo da conta.",
      "fonte": "avancado.this"
    },
    {
      "id": "javascript-av-09",
      "nivel": "avancado",
      "pergunta": "Qual é o erro neste código, que deveria retornar o saldo após um depósito?",
      "alternativas": {
        "a": "O método `depositar` não está retornando `this`",
        "b": "O objeto `conta` não é instanciado corretamente",
        "c": "O método `depositar` não está acessando `this.saldo`",
        "d": "O `constructor` não está definindo `this.saldo`"
      },
      "correta": "a",
      "explicacao": "O método `depositar` deve retornar `this` para permitir o encadeamento de chamadas, mas não está fazendo isso.",
      "fonte": "avancado.prototipos",
      "tipo": "erro",
      "codigo": {
        "linguagem": "js",
        "trecho": "class Conta {\n  constructor(titular) {\n    this.titular = titular;\n    this.saldo = 0;\n  }\n  depositar(valor) {\n    this.saldo += valor;\n  }\n}\nconst conta = new Conta('Ana').depositar(50);\nconsole.log(conta.saldo); // 50"
      }
    },
    {
      "id": "javascript-av-10",
      "nivel": "avancado",
      "pergunta": "O que este código imprime?",
      "alternativas": {
        "a": "[ 1, 2, 3 ]",
        "b": "[ 1, 2 ]",
        "c": "[ 1, 2, [ 3 ] ]",
        "d": "3"
      },
      "correta": "a",
      "explicacao": "apelido e original apontam para o mesmo objeto, então o push altera o array que os dois enxergam, e o Node imprime o array como [ 1, 2, 3 ].",
      "fonte": "avancado.referencia",
      "tipo": "saida",
      "codigo": {
        "linguagem": "js",
        "trecho": "const original = { itens: [1, 2] };\nconst apelido = original;\napelido.itens.push(3);\nconsole.log(original.itens);"
      },
      "alternativasCodigo": true
    },
    {
      "id": "javascript-av-11",
      "nivel": "avancado",
      "pergunta": "Seguindo a recomendação de imutabilidade do passo sobre referência, qual expressão completa a lacuna para que novo tenha ativo igual a true e original continue sem essa propriedade?",
      "alternativas": {
        "a": "Object.assign(original, { ativo: true })",
        "b": "{ ...original, ativo: true }",
        "c": "original",
        "d": "structuredClone(original)"
      },
      "correta": "b",
      "explicacao": "O spread copia as propriedades para um objeto novo e acrescenta ativo, então original fica intacto. Object.assign com original como alvo altera o original, o apelido aponta para o mesmo objeto e o clone sozinho não recebe ativo.",
      "fonte": "avancado.referencia",
      "tipo": "completar",
      "codigo": {
        "linguagem": "js",
        "trecho": "const original = { itens: [1, 2] };\nconst novo = ____;\nconsole.log(original, novo.ativo, novo === original);"
      },
      "alternativasCodigo": true
    },
    {
      "id": "javascript-av-12",
      "nivel": "avancado",
      "pergunta": "Qual é a principal vantagem do TypeScript em relação ao JavaScript?",
      "alternativas": {
        "a": "Elimina todos os erros de execução",
        "b": "Permite que o código rode mais rápido",
        "c": "Identifica erros de tipo antes da execução",
        "d": "Garante que o código seja sempre compatível com o navegador"
      },
      "correta": "c",
      "explicacao": "TypeScript permite identificar erros de tipo durante a escrita do código, antes da execução, evitando problemas em tempo de execução.",
      "fonte": "avancado.typescript"
    },
    {
      "id": "javascript-av-13",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um gerenciador de tarefas em Node e precisa armazenar as tarefas em um arquivo JSON. Qual é a melhor prática para garantir que o arquivo seja atualizado corretamente após adicionar uma nova tarefa?",
      "alternativas": {
        "a": "Ler o arquivo JSON, adicionar a tarefa e sobrescrever o arquivo inteiro com o novo conteúdo.",
        "b": "Adicionar a tarefa diretamente no arquivo JSON sem ler seu conteúdo.",
        "c": "Abrir o arquivo em modo append e escrever só a nova tarefa no fim dele.",
        "d": "Guardar as tarefas só em memória e gravar o arquivo apenas quando o programa for encerrado."
      },
      "correta": "a",
      "explicacao": "JSON é um documento único: ler, alterar o array e sobrescrever o arquivo mantém o conteúdo válido. Escrever no fim quebra o JSON, gravar só no encerramento perde tarefas se o programa cair, e editar sem ler apaga o que já existia.",
      "fonte": "projeto.cli"
    },
    {
      "id": "javascript-av-14",
      "nivel": "avancado",
      "pergunta": "Ao implementar o gerenciador de tarefas, você decide usar módulos para organizar seu código. Qual abordagem é a mais recomendada para garantir que os módulos funcionem corretamente entre si?",
      "alternativas": {
        "a": "Exportar as funções e variáveis que serão usadas em outros módulos e importar apenas as que você precisa.",
        "b": "Importar todos os módulos disponíveis sem se preocupar com o que é realmente necessário.",
        "c": "Criar um único arquivo com todas as funções e variáveis, evitando o uso de módulos.",
        "d": "Exportar tudo de cada módulo, mesmo as funções que não serão utilizadas em outros módulos."
      },
      "correta": "a",
      "explicacao": "A prática recomendada é exportar apenas o que é necessário e importar o que é utilizado, mantendo o código organizado e evitando conflitos.",
      "fonte": "projeto.cli"
    },
    {
      "id": "javascript-av-15",
      "nivel": "avancado",
      "pergunta": "Após concluir o gerenciador de tarefas, você vai publicar o projeto no GitHub. Qual prática deixa o repositório fácil de usar por outra pessoa?",
      "alternativas": {
        "a": "Incluir um README com instruções de instalação e uso do projeto.",
        "b": "Fazer commit da pasta node_modules para quem clonar não precisar instalar nada.",
        "c": "Deixar o arquivo .env com as chaves no repositório para o projeto rodar de primeira.",
        "d": "Subir só o arquivo principal e enviar o resto por mensagem para quem pedir."
      },
      "correta": "a",
      "explicacao": "O README diz como instalar e usar. node_modules é reconstruído pelo npm install a partir do package.json, .env com chaves nunca vai para o repositório, e projeto incompleto não roda.",
      "fonte": "projeto.cli"
    }
  ]
};

export default pool;
