import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  slug: "typescript",
  questions: [
    {
      id: "typescript-ini-01",
      nivel: "iniciante",
      pergunta:
        "Se você tem um arquivo `.js` que funciona, o que acontece se você renomeá-lo para `.ts`?",
      alternativas: {
        a: "Funciona: TypeScript e superconjunto de JavaScript",
        b: "O arquivo não funcionará mais, pois TypeScript não aceita JavaScript.",
        c: "O arquivo precisará de anotações de tipo para funcionar.",
        d: "O arquivo não poderá ser executado sem um compilador.",
      },
      correta: "a",
      explicacao:
        "TypeScript é um superconjunto de JavaScript, portanto, um arquivo `.js` válido também é um arquivo `.ts` válido.",
      fonte: "fundamentos.superconjunto",
    },
    {
      id: "typescript-ini-02",
      nivel: "iniciante",
      pergunta:
        "Qual é o papel do compilador TypeScript durante o processo de compilação?",
      alternativas: {
        a: "Ele apenas transforma o código TypeScript em JavaScript sem verificar erros.",
        b: "Ele verifica os tipos e remove as anotações de tipo antes de gerar o JavaScript.",
        c: "Ele executa o código TypeScript diretamente no navegador.",
        d: "Ele converte o código TypeScript em um arquivo `.exe`.",
      },
      correta: "b",
      explicacao:
        "O compilador confere os tipos e apaga as anotações, gerando apenas JavaScript.",
      fonte: "fundamentos.compilar",
    },
    {
      id: "typescript-ini-03",
      nivel: "iniciante",
      pergunta:
        "Qual alternativa completa a lacuna para que a atribuicao seja valida?",
      alternativas: {
        a: '"30"',
        b: "undefined",
        c: "30",
        d: "null",
      },
      correta: "c",
      explicacao:
        "A variável idade deve ser um número, portanto, a alternativa correta é 30.",
      fonte: "fundamentos.onde",
      tipo: "completar",
      codigo: {
        linguagem: "ts",
        trecho: "const idade: number = ____;",
      },
      alternativasCodigo: true,
    },
    {
      id: "typescript-ini-04",
      nivel: "iniciante",
      pergunta: "O que este codigo imprime?",
      alternativas: {
        a: 'Olá, "Ana"',
        b: 'saudar("Ana")',
        c: "undefined",
        d: "Olá, Ana",
      },
      correta: "d",
      explicacao:
        "O código chama a função saudar com o argumento 'Ana', que é retornado e impresso no console.",
      fonte: "fundamentos.rodar",
      tipo: "saida",
      codigo: {
        linguagem: "ts",
        trecho:
          'function saudar(nome: string): string {\n  return `Olá, ${nome}`;\n}\nconsole.log(saudar("Ana"));',
      },
      alternativasCodigo: true,
    },
    {
      id: "typescript-ini-05",
      nivel: "iniciante",
      pergunta:
        "Qual é a prática recomendada ao usar tipos primitivos em TypeScript?",
      alternativas: {
        a: "Utilizar string, number e boolean em minúsculas.",
        b: "Usar String, Number e Boolean para melhor legibilidade.",
        c: "Misturar tipos primitivos e objetos para flexibilidade.",
        d: "Anotar todos os tipos, mesmo quando não necessário.",
      },
      correta: "a",
      explicacao:
        "Os tipos primitivos devem ser escritos em minúsculas para evitar confusão com os objetos embrulhados.",
      fonte: "tipos.primitivos",
    },
    {
      id: "typescript-ini-06",
      nivel: "iniciante",
      pergunta:
        "Em que situações você deve anotar o tipo de uma variável em TypeScript?",
      alternativas: {
        a: "Sempre que declarar uma variável.",
        b: "Quando a variável é um parâmetro de função.",
        c: "Ao usar uma variável que já tem um valor.",
        d: "Quando a variável é uma constante.",
      },
      correta: "b",
      explicacao:
        "Você deve anotar o tipo em parâmetros de função, pois isso é considerado um contrato.",
      fonte: "tipos.anotar",
    },
    {
      id: "typescript-ini-07",
      nivel: "iniciante",
      pergunta: "Qual é o erro deste código?",
      alternativas: {
        a: "O código não tem erro, ele roda corretamente.",
        b: "O tipo 'dado' não é inferido corretamente.",
        c: "O compilador não permite usar 'toUpperCase' em 'unknown'.",
        d: "O valor 'dado' não pode ser um número.",
      },
      correta: "c",
      explicacao:
        "unknown nao libera metodo nenhum antes de voce provar o tipo. Com um if de typeof em volta, o valor vira string e toUpperCase passa a existir, imprimindo TEXTO.",
      fonte: "tipos.unknown",
      tipo: "erro",
      codigo: {
        linguagem: "ts",
        trecho:
          'const dado: unknown = "texto";\n\nconsole.log(dado.toUpperCase());',
        saidaEsperada: "TEXTO\n",
      },
    },
    {
      id: "typescript-ini-08",
      nivel: "iniciante",
      pergunta:
        "Qual alternativa completa a lacuna para o metodo de texto existir?",
      alternativas: {
        a: "number",
        b: "boolean",
        c: "unknown",
        d: "string",
      },
      correta: "d",
      explicacao:
        "So com string o compilador libera toUpperCase. number e boolean nao aceitam o valor, e unknown exige provar o tipo antes de usar qualquer metodo.",
      fonte: "tipos.inferencia",
      tipo: "completar",
      codigo: {
        linguagem: "ts",
        trecho: 'const nome: ____ = "Ana";\n\nconsole.log(nome.toUpperCase());',
      },
      alternativasCodigo: true,
    },
    {
      id: "typescript-ini-09",
      nivel: "iniciante",
      pergunta:
        "Você está criando um objeto para representar um usuário. Qual a melhor forma de garantir que o objeto sempre tenha as propriedades corretas?",
      alternativas: {
        a: "Declarar uma interface para o objeto",
        b: "Usar uma função construtora para criar o objeto.",
        c: "Criar um objeto diretamente, sem validação.",
        d: "Usar um tipo para definir as propriedades do objeto.",
      },
      correta: "a",
      explicacao:
        "Usar uma interface garante que o objeto tenha as propriedades corretas e que o compilador verifique isso em todo lugar que a interface é utilizada.",
      fonte: "objetos.interface",
    },
    {
      id: "typescript-ini-10",
      nivel: "iniciante",
      pergunta:
        "Este código deveria criar um objeto de tarefa com um id e uma nota. Qual é o erro deste código?",
      alternativas: {
        a: "A propriedade 'nota' deve ser obrigatória.",
        b: "A propriedade 'id' não pode ser alterada após a criação.",
        c: "A propriedade 'nota' não pode ser omitida.",
        d: "A propriedade 'id' deve ser opcional.",
      },
      correta: "b",
      explicacao:
        "O erro ocorre porque a propriedade 'id' é marcada como 'readonly' e não pode ser alterada após a criação do objeto.",
      fonte: "objetos.opcional",
      tipo: "erro",
      codigo: {
        linguagem: "ts",
        trecho:
          "interface Tarefa {\n  readonly id: number;\n  nota?: string;\n}\n\nconst t: Tarefa = { id: 1 };\nt.id = 2;\nconsole.log(t.id);",
        saidaEsperada: "1\n",
      },
    },
    {
      id: "typescript-ini-11",
      nivel: "iniciante",
      pergunta:
        "Qual alternativa completa a lacuna para que o código funcione corretamente?",
      alternativas: {
        a: "string",
        b: "{ cidade: number }",
        c: "Endereco",
        d: "Endereco[]",
      },
      correta: "c",
      explicacao:
        "A propriedade guarda um endereco, e o tipo ja tem nome. string e { cidade: number } nao casam com o objeto, e Endereco[] seria uma lista.",
      fonte: "objetos.aninhado",
      tipo: "completar",
      codigo: {
        linguagem: "ts",
        trecho:
          'interface Endereco {\n  cidade: string;\n}\n\ninterface Cliente {\n  endereco: ____;\n}\n\nconst c: Cliente = {\n  endereco: { cidade: "Recife" },\n};\nconsole.log(c.endereco.cidade);',
      },
      alternativasCodigo: true,
    },
    {
      id: "typescript-ini-12",
      nivel: "iniciante",
      pergunta:
        "Você precisa garantir que a função `metade` só aceite números. O que deve ser feito na chamada da função para evitar o erro de tipo?",
      alternativas: {
        a: "Passar uma string, como `metade('10')`",
        b: "Omitir o argumento, como `metade()`",
        c: "Passar um objeto, como `metade({valor: 10})`",
        d: "Passar um número diretamente, como `metade(10)`",
      },
      correta: "d",
      explicacao:
        "Passar um número diretamente evita o erro de tipo, garantindo que a função funcione corretamente.",
      fonte: "funcoes.parametros",
    },
    {
      id: "typescript-ini-13",
      nivel: "iniciante",
      pergunta:
        "Você está criando uma função que deve retornar um valor e deseja que o compilador verifique isso. Qual é a melhor prática a seguir?",
      alternativas: {
        a: "Declarar o tipo de retorno da função explicitamente",
        b: "Deixar o tipo de retorno para ser inferido pelo compilador",
        c: "Não se preocupar com o tipo de retorno",
        d: "Declarar o tipo de retorno como `any`",
      },
      correta: "a",
      explicacao:
        "Declarar o tipo de retorno explicitamente ajuda a evitar erros e facilita a manutenção do código.",
      fonte: "funcoes.retorno",
    },
    {
      id: "typescript-ini-14",
      nivel: "iniciante",
      pergunta:
        "Qual alternativa completa a lacuna para o valor padrao ser valido?",
      alternativas: {
        a: "colega",
        b: '"colega"',
        c: "0",
        d: "undefined",
      },
      correta: "b",
      explicacao:
        "O padrao precisa ser um texto. Sem aspas vira um nome que nao existe, e numero ou undefined nao cabem num parametro declarado como string.",
      fonte: "funcoes.opcional",
      tipo: "completar",
      codigo: {
        linguagem: "ts",
        trecho:
          'function saudar(nome: string, titulo: string = ____): string {\n  return `Ola, ${titulo} ${nome}`;\n}\n\nconsole.log(saudar("Ana"));',
      },
      alternativasCodigo: true,
    },
    {
      id: "typescript-ini-15",
      nivel: "iniciante",
      pergunta: "O que este código imprime?",
      alternativas: {
        a: "R$ 10.0000",
        b: "10.00",
        c: "R$ 10.00",
        d: "10",
      },
      correta: "c",
      explicacao:
        "O código formata o número 10 para o formato de moeda, resultando em 'R$ 10.00'.",
      fonte: "funcoes.tipo",
      tipo: "saida",
      codigo: {
        linguagem: "ts",
        trecho:
          "type Formatador = (valor: number) => string;\n\nconst emReais: Formatador = (v) => `R$ ${v.toFixed(2)}`;\n\nfunction aplicar(n: number, f: Formatador): string {\n  return f(n);\n}\n\nconsole.log(aplicar(10, emReais));",
      },
      alternativasCodigo: true,
    },
    {
      id: "typescript-int-01",
      nivel: "intermediario",
      pergunta:
        "Você precisa criar um tipo que aceite apenas os status de uma tarefa. Qual é a maneira correta de definir isso?",
      alternativas: {
        a: "type Status = string;",
        b: 'type Status = "pendente" | string;',
        c: 'type Status = "pendente" | "feita" | "cancelada" | string;',
        d: 'type Status = "pendente" | "feita" | "cancelada";',
      },
      correta: "d",
      explicacao:
        "A alternativa correta define um tipo literal que aceita apenas os valores exatos especificados.",
      fonte: "uniao.literal",
    },
    {
      id: "typescript-int-02",
      nivel: "intermediario",
      pergunta:
        "Você está desenvolvendo uma função que deve retornar a área de um círculo ou quadrado. Qual é a maneira correta de estreitar a união usando um campo discriminante?",
      alternativas: {
        a: 'if (f.tipo === "circulo") { return 3.14 * f.raio * f.raio; }',
        b: 'if (f.tipo === "quadrado") { return f.lado * f.lado; }',
        c: 'if (f.tipo === "circulo") { return f.lado * f.lado; }',
        d: 'if (f.tipo === "quadrado") { return 3.14 * f.raio * f.raio; }',
      },
      correta: "a",
      explicacao:
        "A alternativa correta usa o campo 'tipo' para estreitar a união e acessar a propriedade específica de 'Circulo'.",
      fonte: "uniao.propriedade",
    },
    {
      id: "typescript-int-03",
      nivel: "intermediario",
      pergunta: "Qual alternativa completa a lacuna para estreitar a uniao?",
      alternativas: {
        a: "instanceof",
        b: "typeof",
        c: "keyof",
        d: "valueof",
      },
      correta: "b",
      explicacao:
        "typeof compara o tipo em tempo de execucao e e o que o compilador acompanha. instanceof serve para classe, keyof e de tipo e valueof nao existe.",
      fonte: "uniao.typeof",
      tipo: "completar",
      codigo: {
        linguagem: "ts",
        trecho:
          'function formatar(id: string | number): string {\n  if (____ id === "string") {\n    return id.toUpperCase();\n  }\n  return id.toFixed(2);\n}\n\nconsole.log(formatar(3.14159));',
      },
      alternativasCodigo: true,
    },
    {
      id: "typescript-int-04",
      nivel: "intermediario",
      pergunta:
        "O que este código imprime quando a função ehTarefa é chamada com um objeto válido?",
      alternativas: {
        a: "titulo: estudar",
        b: "undefined",
        c: "estudar",
        d: "titulo: estudar, feita: false",
      },
      correta: "c",
      explicacao:
        "A alternativa correta é 'estudar', que é o valor da propriedade 'titulo' do objeto dado.",
      fonte: "uniao.guarda",
      tipo: "saida",
      codigo: {
        linguagem: "ts",
        trecho:
          'type Tarefa = { titulo: string; feita: boolean };\n\nfunction ehTarefa(v: unknown): v is Tarefa {\n  if (typeof v !== "object" || v === null) return false;\n  return "titulo" in v;\n}\n\nconst dado: unknown = { titulo: "estudar", feita: false };\n\nif (ehTarefa(dado)) {\n  console.log(dado.titulo);\n}',
      },
      alternativasCodigo: true,
    },
    {
      id: "typescript-int-05",
      nivel: "intermediario",
      pergunta:
        "Você precisa garantir que uma função aceite tanto strings quanto números, mas deve usar um método específico para cada tipo. Qual é a maneira correta de fazer isso?",
      alternativas: {
        a: "Usar apenas string como tipo.",
        b: "Usar uma classe para encapsular os tipos.",
        c: "Usar um enum para definir os tipos.",
        d: "Usar uma união e estreitar com typeof.",
      },
      correta: "d",
      explicacao:
        "A alternativa correta descreve o uso de união e estreitamento com typeof para garantir o acesso aos métodos específicos de cada tipo.",
      fonte: "uniao.typeof",
    },
    {
      id: "typescript-int-06",
      nivel: "intermediario",
      pergunta:
        "Qual é a maneira correta de definir um tipo que pode ser um número ou uma string, e usar isso em uma função?",
      alternativas: {
        a: "type Id = string | number;",
        b: "type Id = string & number;",
        c: "type Id = string | null;",
        d: "type Id = number | undefined;",
      },
      correta: "a",
      explicacao:
        "A alternativa correta define um tipo que aceita tanto string quanto número, permitindo a flexibilidade necessária.",
      fonte: "uniao.uniao",
    },
    {
      id: "typescript-int-07",
      nivel: "intermediario",
      pergunta:
        "Você precisa garantir que uma lista de nomes só aceite strings. O que você deve fazer?",
      alternativas: {
        a: "Declarar como const nomes = []",
        b: "Declarar como const nomes: string[] = []",
        c: "Declarar como const nomes: any[] = []",
        d: "Declarar como const nomes: Array<string> = []",
      },
      correta: "b",
      explicacao:
        "A declaração correta garante que a lista só aceite strings, evitando erros de tipo.",
      fonte: "colecoes.array",
    },
    {
      id: "typescript-int-08",
      nivel: "intermediario",
      pergunta:
        "Você está criando uma tupla para representar um ponto em um plano. Qual é a forma correta de declarar essa tupla?",
      alternativas: {
        a: "const ponto: [number] = [10, 20]",
        b: "const ponto: [number, number] = [10]",
        c: "const ponto: [number, number] = [10, 20]",
        d: "const ponto: [number, number] = [10, 20, 30]",
      },
      correta: "c",
      explicacao:
        "A declaração correta define uma tupla com exatamente dois números, representando as coordenadas do ponto.",
      fonte: "colecoes.tupla",
    },
    {
      id: "typescript-int-09",
      nivel: "intermediario",
      pergunta:
        "Este código deveria somar os votos de 'ana' e 'carla', mas apresenta um erro. Qual é o defeito?",
      alternativas: {
        a: "A chave 'carla' foi inicializada com um valor inválido",
        b: "O tipo de votos não permite chaves de texto",
        c: "O código não declara o tipo de votos corretamente",
        d: "A chave 'carla' não foi inicializada no objeto votos",
      },
      correta: "d",
      explicacao:
        "A chave carla nunca foi preenchida, entao a leitura devolve undefined e a soma vira NaN. Com carla inicializada em 1, a conta fecha em 4.",
      fonte: "colecoes.record",
      tipo: "erro",
      codigo: {
        linguagem: "ts",
        trecho:
          "type Contagem = Record<string, number>;\nconst votos: Contagem = { ana: 3 };\n\nconsole.log(votos.ana + votos.carla);",
        saidaEsperada: "4\n",
      },
    },
    {
      id: "typescript-int-10",
      nivel: "intermediario",
      pergunta: "O que este codigo imprime?",
      alternativas: {
        a: "3",
        b: "2",
        c: "4",
        d: "Erro de tipo",
      },
      correta: "a",
      explicacao:
        "O espalhamento cria uma lista nova a partir da somente leitura, entao a original fica intacta e a nova tem tres itens.",
      fonte: "colecoes.readonly",
      tipo: "saida",
      codigo: {
        linguagem: "ts",
        trecho:
          'const dias: readonly string[] = ["seg", "ter"];\nconst novos = [...dias, "qua"];\n\nconsole.log(novos.length);',
      },
    },
    {
      id: "typescript-int-11",
      nivel: "intermediario",
      pergunta:
        "Qual alternativa completa a lacuna para que o código funcione corretamente?",
      alternativas: {
        a: "Record<number, string>",
        b: "Record<string, number>",
        c: "Record<string, string>",
        d: "number[]",
      },
      correta: "b",
      explicacao:
        "As chaves sao texto e os valores sao numero. Record<number, string> inverte os dois, Record<string, string> recusa o 3 e number[] nao aceita chave nomeada.",
      fonte: "colecoes.record",
      tipo: "completar",
      codigo: {
        linguagem: "ts",
        trecho:
          "const votos: ____ = { ana: 3, bia: 5 };\n\nconsole.log(votos.ana);",
      },
      alternativasCodigo: true,
    },
    {
      id: "typescript-int-12",
      nivel: "intermediario",
      pergunta:
        "Você está criando uma função que deve retornar o primeiro elemento de um array, mas precisa garantir que o tipo do elemento seja mantido. Qual é a forma correta de definir essa função?",
      alternativas: {
        a: "function primeiro(itens: any[]): any { return itens[0]; }",
        b: "function primeiro<T>(itens: T): T[] { return itens; }",
        c: "function primeiro<T>(itens: T[]): T { return itens[0]; }",
        d: "function primeiro(itens: unknown[]): unknown { return itens[0]; }",
      },
      correta: "c",
      explicacao:
        "A alternativa correta usa um parâmetro de tipo genérico, garantindo que o tipo do elemento retornado seja o mesmo do tipo dos itens do array.",
      fonte: "genericos.funcao",
    },
    {
      id: "typescript-int-13",
      nivel: "intermediario",
      pergunta:
        "Você precisa criar uma interface que represente uma resposta de uma API, que pode conter dados de qualquer tipo e um erro. Qual é a forma correta de definir essa interface?",
      alternativas: {
        a: "interface Resposta { dados: any; erro: string | null; }",
        b: "interface Resposta<T = unknown> { dados: T; erro: string; }",
        c: "interface Resposta<T> { dados: T; erro: unknown; }",
        d: "interface Resposta<T> { dados: T; erro: string | null; }",
      },
      correta: "d",
      explicacao:
        "A alternativa correta define um parâmetro de tipo genérico, permitindo que a interface seja utilizada com diferentes tipos de dados enquanto mantém a informação de tipo.",
      fonte: "genericos.tipo",
    },
    {
      id: "typescript-int-14",
      nivel: "intermediario",
      pergunta:
        "Este código deveria retornar o comprimento de um valor que possui a propriedade 'length'. Qual é o defeito deste código?",
      alternativas: {
        a: "O tipo T não está restrito, então qualquer tipo é aceito.",
        b: "A função não retorna o valor de comprimento corretamente.",
        c: "A função não aceita valores que não têm a propriedade length.",
        d: "O tipo T não deve ser um tipo genérico.",
      },
      correta: "a",
      explicacao:
        "O código não restringe o tipo T, permitindo que tipos que não possuem a propriedade 'length' sejam passados, resultando em erro de compilação.",
      fonte: "genericos.extends",
      tipo: "erro",
      codigo: {
        linguagem: "ts",
        trecho:
          "type ComTamanho = { length: number }; \nfunction tamanho<T>(v: T): number { \n  return v.length; \n}",
        saidaEsperada: "42",
      },
    },
    {
      id: "typescript-int-15",
      nivel: "intermediario",
      pergunta:
        "Qual alternativa completa a lacuna para o tipo ficar sem o id?",
      alternativas: {
        a: "Pick",
        b: "Omit",
        c: "Record",
        d: "Partial",
      },
      correta: "b",
      explicacao:
        "Omit remove as chaves citadas. Pick faria o contrario e deixaria so o id, Record monta um dicionario e Partial recebe um argumento de tipo so.",
      fonte: "genericos.utilitarios",
      tipo: "completar",
      codigo: {
        linguagem: "ts",
        trecho:
          'interface Tarefa {\n  id: number;\n  titulo: string;\n}\n\ntype Rascunho = ____<Tarefa, "id">;\n\nconst r: Rascunho = { titulo: "estudar" };\nconsole.log(r.titulo);',
      },
      alternativasCodigo: true,
    },
    {
      id: "typescript-av-01",
      nivel: "avancado",
      pergunta:
        "Você está configurando um projeto TypeScript e deseja garantir que `null` e `undefined` não sejam aceitos em tipos que não os esperam. Qual configuração deve ser ativada no `tsconfig.json`?",
      alternativas: {
        a: "noImplicitAny",
        b: "strictTypeChecking",
        c: "strictNullChecks",
        d: "allowNullTypes",
      },
      correta: "c",
      explicacao:
        "A configuração `strictNullChecks` impede que `null` e `undefined` sejam atribuídos a tipos que não os aceitam, melhorando a segurança do código.",
      fonte: "nulos.strict",
    },
    {
      id: "typescript-av-02",
      nivel: "avancado",
      pergunta:
        "Você está escrevendo uma função que deve retornar o primeiro caractere de um nome que pode ser `null`. Qual é a forma correta de lidar com isso?",
      alternativas: {
        a: "return nome.charAt(0);",
        b: "return nome ? nome.charAt(0) : '?';",
        c: "return nome[0];",
        d: "return nome === null ? '?' : nome[0];",
      },
      correta: "d",
      explicacao:
        "A alternativa correta verifica se `nome` é `null` antes de tentar acessar o índice, evitando um erro de tipo.",
      fonte: "nulos.undefined",
    },
    {
      id: "typescript-av-03",
      nivel: "avancado",
      pergunta:
        "Você está utilizando encadeamento opcional e deseja fornecer um valor padrão caso a propriedade não exista. Qual é a sintaxe correta para isso?",
      alternativas: {
        a: "c.endereco.cidade ?? 'não informada'",
        b: "c.endereco.cidade || 'não informada'",
        c: "c.endereco.cidade ? c.endereco.cidade : 'não informada'",
        d: "c.endereco.cidade !== undefined ? c.endereco.cidade : 'não informada'",
      },
      correta: "a",
      explicacao:
        "A sintaxe `??` fornece o valor à direita quando o valor à esquerda é `null` ou `undefined`, que é o comportamento desejado.",
      fonte: "nulos.encadeamento",
    },
    {
      id: "typescript-av-04",
      nivel: "avancado",
      pergunta:
        "Este codigo deveria imprimir o primeiro nome iniciado por A. Qual e o defeito?",
      alternativas: {
        a: "O metodo find nao aceita funcao como argumento",
        b: "A assercao de nao-nulo afirma um achado que a lista nao tem",
        c: "A lista precisa ser declarada como readonly",
        d: "startsWith nao existe em string",
      },
      correta: "b",
      explicacao:
        "find devolve undefined quando nao acha, e o ponto de exclamacao apenas cala o compilador: o erro volta na execucao. Com ?? no lugar da assercao, o padrao entra e a saida sai.",
      fonte: "nulos.assercao",
      tipo: "erro",
      codigo: {
        linguagem: "ts",
        trecho:
          'const nomes: string[] = ["Bia", "Caio"];\nconst primeiro = nomes.find((n) => n.startsWith("A"))!;\n\nconsole.log(primeiro.toUpperCase());',
        saidaEsperada: "NENHUM\n",
      },
    },
    {
      id: "typescript-av-05",
      nivel: "avancado",
      pergunta:
        "Qual alternativa completa a lacuna para o literal caber no tipo?",
      alternativas: {
        a: "as string",
        b: "satisfies Status",
        c: "as const",
        d: "as unknown",
      },
      correta: "c",
      explicacao:
        "Sem congelar o literal, a propriedade e inferida como string e nao cabe na uniao. as string e as unknown trocam o tipo por outro, e o objeto inteiro nao satisfaz Status.",
      fonte: "nulos.asconst",
      tipo: "completar",
      codigo: {
        linguagem: "ts",
        trecho:
          'type Status = "pendente" | "feita";\n\nconst config = { status: "feita" } ____;\n\nconst s: Status = config.status;\nconsole.log(s);',
      },
      alternativasCodigo: true,
    },
    {
      id: "typescript-av-06",
      nivel: "avancado",
      pergunta:
        "Qual é a forma correta de garantir que um objeto se encaixa em um tipo específico sem alterar o tipo inferido?",
      alternativas: {
        a: "Usar `as` para afirmar o tipo do objeto.",
        b: "Declarar o tipo explicitamente na variável.",
        c: "Usar `const` para garantir a imutabilidade.",
        d: "Usar `satisfies` para verificar o tipo sem alargar.",
      },
      correta: "d",
      explicacao:
        "A palavra-chave `satisfies` permite verificar se um objeto se encaixa em um tipo sem alterar o tipo inferido, garantindo segurança.",
      fonte: "nulos.assercao",
    },
    {
      id: "typescript-av-07",
      nivel: "avancado",
      pergunta:
        "Você está recebendo o erro TS2322 ao tentar atribuir um valor a uma variável. O que isso significa?",
      alternativas: {
        a: "O valor atribuído não é do tipo esperado.",
        b: "O valor atribuído é do tipo correto, mas não é permitido.",
        c: "A variável não foi declarada corretamente.",
        d: "O tipo da variável não foi definido.",
      },
      correta: "a",
      explicacao:
        "O erro TS2322 indica que o valor atribuído não é compatível com o tipo declarado da variável.",
      fonte: "ferramenta.mensagens",
    },
    {
      id: "typescript-av-08",
      nivel: "avancado",
      pergunta:
        "Você está tentando usar uma função que espera um número, mas está passando uma string. Qual mensagem de erro você deve esperar?",
      alternativas: {
        a: "TS7006: Parameter is missing type.",
        b: "TS2345, argumento incompativel na chamada",
        c: "TS18048: Cannot access property that may be undefined.",
        d: "TS2322: Type 'string' is not assignable to type 'number'.",
      },
      correta: "b",
      explicacao:
        "A mensagem correta é TS2345, que indica que o argumento passado não é do tipo esperado pela função.",
      fonte: "ferramenta.mensagens",
    },
    {
      id: "typescript-av-09",
      nivel: "avancado",
      pergunta:
        "Qual é o erro neste código que deve retornar a metade de um número?",
      alternativas: {
        a: "O tipo do parâmetro está incorreto.",
        b: "A função não retorna um valor.",
        c: "O valor passado para a função não é um número.",
        d: "A função não está definida corretamente.",
      },
      correta: "c",
      explicacao:
        "O parametro e number e a chamada passa texto, entao o compilador para em TS2345 antes de rodar. Com metade(10), a conta fecha e a saida e 5.",
      fonte: "ferramenta.mensagens",
      tipo: "erro",
      codigo: {
        linguagem: "ts",
        trecho:
          'function metade(valor: number): number {\n  return valor / 2;\n}\n\nconsole.log(metade("10"));',
        saidaEsperada: "5\n",
      },
    },
    {
      id: "typescript-av-10",
      nivel: "avancado",
      pergunta:
        "Qual é a melhor prática ao lidar com mensagens de erro do compilador TypeScript?",
      alternativas: {
        a: "Ignorar a mensagem e continuar o desenvolvimento.",
        b: "Modificar o código até que não apareça mais a mensagem.",
        c: "Consultar a documentação apenas quando necessário.",
        d: "Ler a mensagem de fora para dentro para entender o erro.",
      },
      correta: "d",
      explicacao:
        "Ler a mensagem de fora para dentro ajuda a entender rapidamente o que causou o erro e como corrigi-lo.",
      fonte: "ferramenta.mensagens",
    },
    {
      id: "typescript-av-11",
      nivel: "avancado",
      pergunta: "Qual é a função do código TS7006 no TypeScript?",
      alternativas: {
        a: "Indica que um parâmetro não possui tipo no modo estrito.",
        b: "Indica que um tipo foi declarado incorretamente.",
        c: "Indica que um valor não é do tipo esperado.",
        d: "Indica que um valor pode ser indefinido.",
      },
      correta: "a",
      explicacao:
        "O código TS7006 indica que um parâmetro foi declarado sem tipo, o que é um erro no modo estrito do TypeScript.",
      fonte: "ferramenta.mensagens",
    },
    {
      id: "typescript-av-12",
      nivel: "avancado",
      pergunta:
        "Você está tipando uma função que adiciona uma nova tarefa. Qual deve ser a tipagem correta do parâmetro de entrada, considerando que o título da tarefa é recebido como texto?",
      alternativas: {
        a: "(titulo: unknown) => void",
        b: "(titulo: string) => void",
        c: "(titulo: any) => void",
        d: "(titulo: string | null) => void",
      },
      correta: "b",
      explicacao:
        "A alternativa correta é a que tipa o parâmetro como string, pois o título deve ser um texto. Usar 'unknown' ou 'any' ignora a tipagem e pode levar a erros.",
      fonte: "projeto.roteiro",
    },
    {
      id: "typescript-av-13",
      nivel: "avancado",
      pergunta:
        "Você está implementando a função que lista as tarefas. Qual abordagem é a mais adequada para lidar com a possibilidade de não encontrar tarefas?",
      alternativas: {
        a: "Usar 'if' para verificar se a lista está vazia antes de listar",
        b: "Retornar um array vazio se não houver tarefas",
        c: "Usar 'find' e tratar o resultado com '??' para um valor padrão",
        d: "Usar o ponto de exclamação para ignorar a possibilidade de undefined",
      },
      correta: "c",
      explicacao:
        "A alternativa correta usa 'find' e trata o resultado com '??', que é a forma recomendada para lidar com valores que podem ser undefined, evitando erros silenciosos.",
      fonte: "projeto.roteiro",
    },
    {
      id: "typescript-av-14",
      nivel: "avancado",
      pergunta:
        "Ao declarar a interface para a tarefa, qual propriedade deve ser marcada como 'readonly' e por quê?",
      alternativas: {
        a: "A propriedade 'titulo', pois não deve mudar após a criação",
        b: "A propriedade 'feita', para garantir que o estado não seja alterado",
        c: "Nenhuma das propriedades precisa ser readonly",
        d: "A propriedade 'id', pois ela não muda depois de criada",
      },
      correta: "d",
      explicacao:
        "A propriedade 'id' deve ser marcada como 'readonly' porque ela não deve mudar após a criação da tarefa, garantindo a integridade do identificador.",
      fonte: "projeto.roteiro",
    },
    {
      id: "typescript-av-15",
      nivel: "avancado",
      pergunta:
        "Você está revisando seu código e encontrou um uso de 'any'. Qual é a melhor prática recomendada para lidar com isso?",
      alternativas: {
        a: "Remover o 'any' e tipar corretamente a variável",
        b: "Substituir por 'unknown' e deixar o compilador decidir",
        c: "Adicionar um comentário justificando o uso de 'any'",
        d: "Deixar como está, pois não causa erro de compilação",
      },
      correta: "a",
      explicacao:
        "A melhor prática é remover o 'any' e tipar corretamente a variável, pois isso melhora a segurança do tipo e evita problemas futuros.",
      fonte: "projeto.cli",
    },
  ],
};

export default pool;
