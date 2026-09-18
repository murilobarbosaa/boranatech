// TODO(Ana): revisao editorial completa desta trilha (primeira trilha de
// TypeScript da plataforma; titulo, descricao, resumo e todo o conteudo
// longo precisam de revisao de copy).
//
// Os blocos rodam pelo runner de ts (Lote 10a): checagem de tipos com a API
// do typescript e depois execucao com o tsx, SEM a lib dom e SEM @types/node.
// Bloco que existe para mostrar erro de tipo declara o codigo do compilador
// na cerca (```ts lanca=TS2322), e o verificador exige que ele quebre assim.
import type { RoadmapV2 } from "../types";

export const typescript: RoadmapV2 = {
  slug: "typescript",
  area: "linguagem",
  kind: "linguagem",
  codeLanguages: ["ts"],
  // TODO(Ana): titulo da trilha
  title: "TypeScript do Zero",
  level: "Iniciante",
  // TODO(Ana): descricao da trilha
  description:
    "Do primeiro arquivo tipado a genéricos e ao modo estrito, com a camada que confere o seu JavaScript antes de ele rodar. Conclua uma etapa pra liberar a próxima.",
  // TODO(Ana): resumo curto da trilha no card da vitrine
  summary:
    "A camada de tipos do JavaScript, do primeiro arquivo ao projeto tipado.",
  sections: [
    {
      id: "fundamentos",
      title: "Primeiros passos com TypeScript",
      level: "iniciante",
      description:
        "O que o TypeScript acrescenta ao JavaScript, onde os tipos existem e como rodar o primeiro arquivo.",
      children: [
        {
          id: "fundamentos.oque",
          title: "O que é TypeScript",
          description:
            "Uma camada de tipos sobre o JavaScript, conferida antes de rodar, que some quando o código executa.",
          content:
            "TypeScript é JavaScript com **tipos declarados**. Você diz que `idade` é `number` e que `buscar` devolve uma string, e uma ferramenta confere o programa inteiro antes de ele rodar. O que sai da conferência é JavaScript comum: o navegador e o Node nunca veem os tipos.\n\nO problema que ele resolve é o de quase todo erro de JavaScript só aparecer **executando**. Ler uma propriedade de `undefined`, passar um argumento a menos, mudar uma função para devolver outra coisa e esquecer de quem a chamava: tudo isso roda até o momento em que quebra. Com tipos, cada um vira um sublinhado no editor enquanto você escreve.\n\nO segundo ganho é o editor entender o seu código: ao digitar `usuario.`, a lista de propriedades aparece, porque a ferramenta sabe o que `usuario` é. Em projeto com mais de uma pessoa, isso costuma valer mais que a própria checagem.\n\nO modelo mental para a trilha inteira: **TypeScript é um verificador de contratos**. Você declara o que cada função aceita e devolve, e a ferramenta cobra o contrato dos dois lados, sempre antes de rodar.\n\nVocê domina este passo quando explica, sem jargão, o que a ferramenta confere e o que ela não pode conferir.",
          resources: [
            {
              label: "TypeScript: o handbook (em inglês)",
              url: "https://www.typescriptlang.org/docs/handbook/intro.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.superconjunto",
          title: "Superconjunto de JavaScript",
          description:
            "Todo JavaScript válido já é TypeScript, com uma ressalva que a trilha inteira explora.",
          content:
            'TypeScript é um **superconjunto**: a linguagem é o JavaScript inteiro mais a sintaxe de tipos. Na prática, um arquivo `.js` que funciona vira um `.ts` que funciona, e você acrescenta tipo aos poucos, no seu ritmo.\n\n```ts\nconst nome = "Ana";\nconsole.log(nome.toUpperCase());\n```\n\nEsse trecho é JavaScript comum e TypeScript válido ao mesmo tempo. Nada foi anotado, e ainda assim a ferramenta já sabe que `nome` é uma string, então `toUpperCase` existe e `toFixed` seria erro. Esse é o assunto do passo Inferência.\n\nA ressalva aparece no modo estrito, que é o desta trilha e o padrão de qualquer projeto novo: **parâmetro sem tipo é erro**. Uma função copiada do JavaScript como `function dobro(n)` não passa, porque a ferramenta se recusa a adivinhar o que `n` é. O código do compilador para isso é `TS7006`, e você vai vê-lo bastante.\n\nA consequência prática é boa: migrar um projeto é um trabalho gradual, arquivo por arquivo, não uma reescrita.\n\nVocê domina este passo quando pega um trecho seu de JavaScript e diz o que precisaria mudar para ele passar no modo estrito.',
        },
        {
          id: "fundamentos.compilar",
          title: "Como o código vira JavaScript",
          description:
            "O compilador confere os tipos e os apaga: o que roda é JavaScript sem nenhum vestígio deles.",
          content:
            "O compilador do TypeScript faz duas coisas bem separadas, e confundi-las atrapalha.\n\nA primeira é **conferir**: ele lê o programa e reclama de tudo que não fecha. A segunda é **apagar os tipos** e emitir JavaScript. Não há verificação nenhuma em tempo de execução: as anotações somem.\n\n```ts\nconst total: number = 2 + 3;\nconsole.log(total);\n```\n\nO que sai disso é `const total = 2 + 3;` seguido do `console.log`. A anotação `: number` não existe mais no arquivo que roda.\n\nDaí vêm duas consequências que a trilha vai repetir. A primeira: se um dado chega de fora do programa, por exemplo de um arquivo ou de uma resposta da rede, **o tipo declarado é uma promessa sua**, não uma garantia; o passo unknown, o honesto trata disso. A segunda: erro de tipo nunca deixa o programa mais lento, porque o que roda é o mesmo JavaScript de antes.\n\nNesta trilha, o `tsx` faz as duas etapas de uma vez, e o passo Rodar o primeiro arquivo mostra como.\n\nVocê domina este passo quando explica por que um erro de tipo não pode ser capturado com try e catch.",
          resources: [
            {
              label: "TypeScript: tipos do dia a dia (em inglês)",
              url: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.onde",
          title: "Onde o tipo existe, e onde não existe",
          description:
            "Antes de rodar, o tipo é lei; depois, ele não está mais lá. Ver o erro do compilador é a lição.",
          content:
            "A forma mais rápida de entender a fronteira é ver o compilador reclamar.\n\n```ts lanca=TS2322\nconst idade: number = \"30\";\nconsole.log(idade + 1);\n```\n\nEsse programa **não chega a rodar**. A ferramenta para em `TS2322: Type 'string' is not assignable to type 'number'`, apontando a linha 1. Em JavaScript puro, o mesmo código rodaria e imprimiria `301`, porque o `+` concatena quando um dos lados é string; o defeito só apareceria depois, em algum lugar distante.\n\nEssa é a troca central da linguagem: você paga o preço de declarar, e recebe o erro no lugar exato, antes de qualquer execução.\n\nDo outro lado da fronteira, depois de compilar, não sobra nada. Não existe `if (typeof x === \"Usuario\")` para um tipo que você declarou, porque `Usuario` não existe em tempo de execução. O que existe é o JavaScript de sempre, com `typeof`, `Array.isArray` e a checagem de propriedade, e é sobre isso que a seção União e estreitamento se apoia.\n\nVocê domina este passo quando diz, olhando um erro, se ele é do compilador ou da execução.",
        },
        {
          id: "fundamentos.rodar",
          title: "Rodar o primeiro arquivo",
          description:
            "Um arquivo .ts, um comando, e o ciclo que se repete a trilha inteira.",
          content:
            'Crie um arquivo `ola.ts` com o conteúdo abaixo.\n\n```ts\nfunction saudar(nome: string): string {\n  return `Olá, ${nome}`;\n}\n\nconsole.log(saudar("Ana"));\n```\n\nRepare no que já está aqui: o parâmetro `nome` é `string`, o retorno é `string`, e o corpo usa template literal, igual ao JavaScript. Chamar `saudar(42)` viraria `TS2345`, e chamar `saudar()` viraria `TS2554`.\n\nPara rodar, o caminho mais curto é o `tsx`, que confere e executa em um passo só: `npx tsx ola.ts` imprime a saudação. Existe também o compilador oficial, o `tsc`, que gera um `.js` ao lado; ele é o que um projeto de verdade usa na hora de publicar, e o passo O tsconfig.json volta a ele.\n\nO ciclo é o mesmo da trilha de JavaScript: editar, salvar, rodar. A diferença é que boa parte dos erros aparece antes, no editor, sublinhada, enquanto você ainda está escrevendo.\n\nVocê domina este passo quando roda um arquivo `.ts` e provoca de propósito um erro de tipo para ver a mensagem.',
          resources: [
            {
              label: "TypeScript: tipos básicos (em inglês)",
              url: "https://www.typescriptlang.org/docs/handbook/2/basic-types.html",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "tipos",
      title: "Tipos e inferência",
      level: "iniciante",
      description:
        "Os tipos primitivos, o que o compilador deduz sozinho, quando vale anotar e o que any destrói.",
      children: [
        {
          id: "tipos.primitivos",
          title: "Os tipos primitivos",
          description:
            "string, number e boolean, que cobrem a maior parte do código do dia a dia.",
          content:
            'Os três tipos que aparecem em quase toda linha são `string`, `number` e `boolean`.\n\n```ts\nconst nome: string = "Ana";\nconst idade: number = 32;\nconst ativo: boolean = true;\n\nconsole.log(nome, idade, ativo);\n```\n\nEscreva-os sempre em **minúsculas**. Existem também `String`, `Number` e `Boolean` com maiúscula, que se referem aos objetos embrulhados do JavaScript e quase nunca são o que você quer; usá-los é um erro comum de quem vem de outras linguagens.\n\n`number` cobre inteiro e decimal, porque o JavaScript tem um número só. Não há `int` nem `float`.\n\nHá mais dois que valem conhecer agora. `null` e `undefined` são tipos por si, e no modo estrito eles **não** entram em qualquer lugar: a seção Nulos e rigor é inteira sobre isso. E `bigint` e `symbol` existem, são raros, e você os encontrará em código de biblioteca.\n\nO tipo `any` também existe, e é o único que desliga a conferência; ele tem passo próprio, porque merece cuidado.\n\nVocê domina este passo quando anota três variáveis sem hesitar entre maiúscula e minúscula.',
        },
        {
          id: "tipos.inferencia",
          title: "Inferência",
          description:
            "O compilador deduz o tipo do valor que você atribuiu, e anotar tudo é ruído.",
          content:
            'Na maior parte do tempo você **não precisa** anotar: o compilador olha o valor e deduz o tipo.\n\n```ts\nconst nome = "Ana";\nlet contador = 0;\n\ncontador = contador + 1;\nconsole.log(nome.toUpperCase(), contador);\n```\n\n`nome` é `string` e `contador` é `number`, sem nenhuma anotação. Tentar `contador = "dois"` seria `TS2322`, porque o tipo já está fixado desde a atribuição.\n\nHá uma diferença entre `const` e `let` que surpreende no começo. Com `const nome = "Ana"`, o tipo inferido é o **literal** `"Ana"`, e não `string`, porque a variável nunca vai mudar. Com `let`, o tipo é `string`, o mais largo. Isso volta a importar no passo as const, e é a base dos tipos literais da seção União e estreitamento.\n\nA regra prática desta trilha: **anote as fronteiras, deixe o resto inferir**. Fronteira é parâmetro de função, retorno quando não for óbvio, e a forma de um dado que vem de fora. Anotar variável local que já tem valor só acrescenta ruído.\n\nVocê domina este passo quando apaga uma anotação redundante e o programa continua conferindo igual.',
          resources: [
            {
              label: "TypeScript: tipos do dia a dia (em inglês)",
              url: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "tipos.anotar",
          title: "Quando anotar e quando calar",
          description:
            "A anotação vale nas fronteiras do programa, onde ela é contrato, e atrapalha no meio.",
          content:
            "Anotar demais deixa o código verboso sem ganhar segurança; anotar de menos deixa buracos onde o erro passa.\n\nO critério é simples: **anote onde há contrato**.\n\n```ts\nfunction metade(valor: number): number {\n  return valor / 2;\n}\n\nconst resultado = metade(10);\nconsole.log(resultado);\n```\n\nO parâmetro é obrigatório: sem ele o compilador acusa `TS7006`, porque não adivinha. O retorno é opcional, já que ele seria inferido como `number`, e ainda assim vale escrever em função pública: ele vira uma declaração de intenção, e quem alterar o corpo por engano recebe o erro na própria função, e não no lugar distante que a chamou.\n\nJá `const resultado` não precisa de nada: o tipo vem da chamada.\n\nO caso em que anotar é obrigatório mesmo fora de função é o do valor que nasce vazio: `const itens = []` é inferido como `any[]`, o que não ajuda ninguém. Ali você escreve `const itens: string[] = []`, e a seção Coleções trata do assunto.\n\nVocê domina este passo quando justifica cada anotação que escreve com a palavra contrato ou fronteira.",
        },
        {
          id: "tipos.any",
          title: "any apaga a garantia",
          description:
            "O tipo que aceita tudo, desliga a conferência e leva o erro de volta para a execução.",
          content:
            '`any` quer dizer "não confira nada aqui". Com ele, toda operação é permitida, e o compilador fica em silêncio.\n\n```ts lanca=TypeError\nconst dado: any = "texto";\n\nconsole.log(dado.toFixed(2));\n```\n\nEsse programa **compila sem um único aviso** e quebra ao rodar, com `TypeError: dado.toFixed is not a function`. É exatamente o erro que a trilha inteira existe para evitar, e `any` o traz de volta.\n\nEle aparece por três caminhos: escrito à mão para calar um erro difícil, por inferência de um `[]` ou `{}` vazio, e vindo de uma biblioteca sem tipos. O terceiro é o mais perigoso, porque ninguém decidiu nada, e o `any` se espalha: qualquer expressão que toque um `any` vira `any` também.\n\nHá um uso defensável, e é raro: migração de um arquivo grande, com o compromisso escrito de tirar depois. Fora disso, a alternativa quase sempre é `unknown`, o assunto do próximo passo.\n\nO `tsconfig.json` tem uma opção, `noImplicitAny`, que proíbe o `any` que ninguém escreveu; ela vem ligada com `strict`.\n\nVocê domina este passo quando troca um `any` seu por um tipo de verdade e vê o compilador achar um defeito real.',
        },
        {
          id: "tipos.unknown",
          title: "unknown, o any honesto",
          description:
            "Aceita qualquer valor na entrada e obriga você a provar o que ele é antes de usá-lo.",
          content:
            '`unknown` também aceita qualquer valor, e é o oposto de `any` no que importa: ele **não deixa** você usar o valor antes de provar o que ele é.\n\n```ts lanca=TS18046\nconst dado: unknown = "texto";\n\nconsole.log(dado.toUpperCase());\n```\n\nAqui o compilador para em `TS18046: \'dado\' is of type \'unknown\'`. Nada foi permitido de graça.\n\nPara usar o valor, você estreita, e o compilador acompanha:\n\n```ts\nconst dado: unknown = "texto";\n\nif (typeof dado === "string") {\n  console.log(dado.toUpperCase());\n}\n```\n\nDentro do `if`, `dado` é `string`, e o método existe. Esse mecanismo é o assunto da seção União e estreitamento.\n\nÉ por isso que `unknown` é o tipo certo na fronteira do programa: o que vem de um arquivo, de uma resposta da rede ou de um `JSON.parse` não é confiável, e declarar `any` ali é mentir para si mesmo. Com `unknown`, a checagem que você faria de qualquer jeito passa a ser obrigatória.\n\nVocê domina este passo quando troca um `any` de fronteira por `unknown` e escreve a checagem que faltava.',
          resources: [
            {
              label: "TypeScript: estreitamento (em inglês)",
              url: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "objetos",
      title: "Objetos",
      level: "iniciante",
      description:
        "Descrever a forma de um objeto com interface e type, com propriedade opcional e somente leitura.",
      children: [
        {
          id: "objetos.interface",
          title: "Descrever um objeto com interface",
          description:
            "Dar nome à forma de um objeto, e o compilador cobrando essa forma em todo lugar que a usa.",
          content:
            'Quase todo dado de um programa é um objeto, e `interface` é como você descreve a forma dele.\n\n```ts\ninterface Usuario {\n  nome: string;\n  idade: number;\n}\n\nconst ana: Usuario = { nome: "Ana", idade: 32 };\nconsole.log(ana.nome, ana.idade);\n```\n\nA partir daí, o nome `Usuario` vale como tipo em qualquer lugar: parâmetro, retorno, item de array. Faltar uma propriedade vira `TS2741`, sobrar uma vira `TS2353`, e escrever `idade: "32"` vira `TS2322`.\n\nRepare que o objeto continua sendo um objeto comum de JavaScript: não há classe, não há construtor, e nada disso existe depois de compilar. `interface` é só a descrição.\n\nA regra de escrita desta trilha: nome de tipo em **PascalCase** (`Usuario`, `ItemDoCarrinho`), sem prefixo `I`, que é hábito de outras linguagens e não se usa aqui.\n\nUma interface pode estender outra com `extends`, o que evita repetir propriedades entre formas parecidas, e pode ser declarada de novo para acrescentar campos, recurso raro e útil em declaração de biblioteca.\n\nVocê domina este passo quando descreve com uma interface um objeto que você já usava solto.',
          resources: [
            {
              label: "TypeScript: tipos de objeto (em inglês)",
              url: "https://www.typescriptlang.org/docs/handbook/2/objects.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "objetos.type",
          title: "type, e quando usar cada um",
          description:
            "O apelido de tipo faz tudo que a interface faz para objeto, e mais um pouco para o resto.",
          content:
            "`type` cria um **apelido** para qualquer tipo, e não só para objeto.\n\n```ts\ntype Usuario = {\n  nome: string;\n  idade: number;\n};\n\ntype Id = string | number;\n\nconst chave: Id = 42;\nconsole.log(chave);\n```\n\nPara descrever um objeto, `type` e `interface` são praticamente intercambiáveis: as duas conferem a mesma coisa e o erro é o mesmo. A diferença aparece fora do objeto: só `type` dá nome a uma união, a uma tupla ou a um literal, como o `Id` acima. E só `interface` pode ser reaberta para acrescentar campos.\n\nA convenção desta trilha, que é a mais comum na comunidade: **`interface` para a forma de um objeto, `type` para todo o resto**. Não é regra técnica, é consistência; projeto que mistura os dois sem critério fica difícil de ler.\n\nO que não vale é criar apelido para tudo. `type Nome = string` não acrescenta informação nenhuma e ainda esconde o tipo real de quem lê.\n\nVocê domina este passo quando escolhe entre os dois com um motivo, e não por hábito.",
        },
        {
          id: "objetos.opcional",
          title: "Opcional e somente leitura",
          description:
            "Marcar a propriedade que pode faltar e a que não pode mudar, e ver o compilador cobrar as duas.",
          content:
            "Duas marcas mudam bastante o contrato de um objeto.\n\nA interrogação diz que a propriedade **pode faltar**; ao ler, o tipo passa a incluir `undefined`, e o compilador exige que você trate isso. O `readonly` diz que a propriedade **não muda depois de criada**.\n\n```ts lanca=TS2540\ninterface Tarefa {\n  readonly id: number;\n  nota?: string;\n}\n\nconst t: Tarefa = { id: 1 };\nt.id = 2;\n```\n\nO compilador para em `TS2540: Cannot assign to 'id' because it is a read-only property`. Sem a marca, a atribuição passaria calada.\n\nRepare que `nota` foi omitida e isso é válido: ela é opcional. Ler `t.nota.length` seria erro, porque o valor pode ser `undefined`, e a seção Nulos e rigor mostra as formas de tratar.\n\nO `readonly` vale só para o compilador, e some ao rodar: ele não congela o objeto como `Object.freeze` faria. É um contrato de intenção, e é o suficiente para pegar a atribuição errada enquanto você escreve.\n\nVocê domina este passo quando marca como `readonly` um id que nunca deveria mudar e o compilador acha uma atribuição que você tinha esquecido.",
        },
        {
          id: "objetos.aninhado",
          title: "Objetos dentro de objetos",
          description:
            "Compor formas em vez de repetir campos, que é como um dado real costuma ser.",
          content:
            'Dado de verdade é aninhado: um pedido tem um cliente, que tem um endereço. Em TypeScript você compõe as formas, dando nome a cada uma.\n\n```ts\ninterface Endereco {\n  cidade: string;\n}\n\ninterface Cliente {\n  endereco: Endereco;\n}\n\nconst c: Cliente = {\n  endereco: { cidade: "Recife" },\n};\nconsole.log(c.endereco.cidade);\n```\n\nDá para escrever o objeto interno direto na propriedade, sem nome (`endereco: { cidade: string; uf: string }`), e isso é aceitável quando a forma aparece uma vez só. Assim que ela se repetir, dar nome vale a pena: o erro passa a citar `Endereco` em vez de despejar a estrutura inteira na mensagem.\n\nA profundidade cobra leitura: `c.endereco.cidade` é seguro porque nada ali é opcional. Bastaria `endereco?` para o acesso virar erro, e é aí que entra o encadeamento opcional, na seção Nulos e rigor.\n\nVocê domina este passo quando quebra uma forma grande em duas ou três com nome e o erro do compilador fica mais curto.',
        },
      ],
    },
    {
      id: "funcoes",
      title: "Funções",
      level: "iniciante",
      description:
        "Parâmetro e retorno tipados, argumento opcional, e a função tratada como um tipo.",
      children: [
        {
          id: "funcoes.parametros",
          title: "Parâmetros tipados",
          description:
            "O contrato de entrada da função, que é a anotação mais importante de todas.",
          content:
            'Parâmetro é a fronteira por onde o dado errado entra, e por isso é onde a anotação mais rende.\n\n```ts lanca=TS2345\nfunction metade(valor: number): number {\n  return valor / 2;\n}\n\nconsole.log(metade("10"));\n```\n\nO compilador para em `TS2345: Argument of type \'string\' is not assignable to parameter of type \'number\'`, apontando a chamada. Em JavaScript, `"10" / 2` daria `5` por coerção, e o mesmo código com `"dez"` daria `NaN`, que viajaria pelo programa até aparecer em algum lugar sem explicação.\n\nNo modo estrito, omitir o tipo do parâmetro é erro por si (`TS7006`): a ferramenta não adivinha. Essa é a única anotação realmente obrigatória do dia a dia.\n\nA ordem importa como em JavaScript, e a quantidade também: chamar com argumento a menos vira `TS2554`, e com um a mais também. Isso soa óbvio e é justamente o defeito que passa despercebido em JavaScript, onde o que falta vira `undefined` em silêncio.\n\nVocê domina este passo quando lê `TS2345` e sabe, sem abrir a função, que o erro está na chamada.',
          resources: [
            {
              label: "TypeScript: funções (em inglês)",
              url: "https://www.typescriptlang.org/docs/handbook/2/functions.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "funcoes.retorno",
          title: "O tipo de retorno",
          description:
            "Inferido quase sempre, escrito quando a função é contrato de outra pessoa.",
          content:
            'O retorno costuma ser inferido: o compilador olha o `return` e deduz.\n\n```ts\nfunction nomeCompleto(nome: string, sobrenome: string) {\n  return `${nome} ${sobrenome}`;\n}\n\nconst x: string = nomeCompleto("Ana", "Souza");\nconsole.log(x);\n```\n\nAqui o retorno é `string` sem nenhuma anotação. Escrevê-lo não muda a conferência, e ainda assim vale em função pública, por um motivo de diagnóstico: com o retorno declarado, alterar o corpo por engano acusa o erro **dentro da função**; sem ele, o tipo inferido muda em silêncio e o erro aparece longe, em quem chamou.\n\nFunção que não devolve nada tem retorno `void`, e o próximo passo trata dele.\n\nUm caso que confunde: uma função com dois `return` de tipos diferentes é inferida como a união dos dois (`string | number`). Isso é legítimo às vezes, e quase sempre é sinal de que a função faz duas coisas. A seção União e estreitamento mostra como quem chama lida com isso.\n\nVocê domina este passo quando declara o retorno de uma função e o compilador acusa uma mudança que antes passaria.',
        },
        {
          id: "funcoes.opcional",
          title: "Opcional, padrão e resto",
          description:
            "As três formas de uma função aceitar menos, ou mais, do que a lista fixa de parâmetros.",
          content:
            'Três recursos do JavaScript ganham tipo aqui, e cada um resolve um caso.\n\n```ts\nfunction saudar(nome: string, titulo = "colega"): string {\n  return `Olá, ${titulo} ${nome}`;\n}\n\nfunction somar(...valores: number[]): number {\n  return valores.reduce((a, b) => a + b, 0);\n}\n\nconsole.log(saudar("Ana"), somar(1, 2, 3));\n```\n\nO **valor padrão** já diz o tipo: `titulo` é `string` sem anotação, e a chamada pode omiti-lo.\n\nO **parâmetro opcional**, escrito `titulo?: string`, é diferente: ele não tem padrão, então dentro da função o tipo é `string | undefined` e o compilador exige tratamento. Use padrão quando houver um valor razoável, e opcional quando a ausência for informação.\n\nO **resto** junta o que sobra num array, e o tipo é do array: `...valores: number[]`.\n\nParâmetro opcional só pode vir depois dos obrigatórios; o contrário é `TS1016`, e a razão é a mesma de sempre: a chamada posiciona os argumentos pela ordem, e um buraco no meio da lista não teria como ser preenchido.\n\nVocê domina este passo quando escolhe entre padrão e opcional pela pergunta: existe um valor razoável quando ninguém passa nada?',
        },
        {
          id: "funcoes.void",
          title: "void, e a função que não devolve nada",
          description:
            "O tipo de quem existe pelo efeito, e o cuidado de não confiar no retorno dela.",
          content:
            'Função que não tem `return` com valor devolve `undefined`, e o tipo disso em TypeScript é `void`.\n\n```ts\nfunction registrar(mensagem: string): void {\n  console.log(`[log] ${mensagem}`);\n}\n\nregistrar("tarefa criada");\n```\n\nEscrever `: void` é opcional, já que seria inferido, e vale como declaração de intenção: "esta função existe pelo efeito, não pelo valor".\n\nO erro que ele evita é sutil. Sem o tipo, alguém pode escrever `const r = registrar("x")` e seguir usando `r`, que é `undefined`. Com `void` declarado, o compilador acusa qualquer tentativa de usar esse valor para algo.\n\n`void` é diferente de `undefined` como tipo. Uma função declarada `(): undefined` precisa de um `return` explícito; uma `(): void` pode simplesmente terminar. E há um caso surpreendente que aparece com métodos de array: uma função que devolve algo **pode** ser usada onde se espera `void`, e é por isso que `[1, 2].forEach((n) => contador++)` compila.\n\nVocê domina este passo quando marca como `void` uma função sua de efeito e explica por que ninguém deve usar o retorno dela.',
        },
        {
          id: "funcoes.tipo",
          title: "Função como tipo",
          description:
            "Descrever a assinatura de uma função para passá-la adiante, que é metade do JavaScript moderno.",
          content:
            "Em JavaScript, função é valor: você a guarda em variável e a passa como argumento. Em TypeScript, esse valor também tem tipo, e ele se escreve com uma seta.\n\n```ts\ntype Formatador = (valor: number) => string;\n\nconst emReais: Formatador = (v) => `R$ ${v.toFixed(2)}`;\n\nfunction aplicar(n: number, f: Formatador): string {\n  return f(n);\n}\n\nconsole.log(aplicar(10, emReais));\n```\n\nA assinatura diz o que a função aceita e o que devolve. Repare que `emReais` **não** anota o parâmetro: o tipo veio do contexto, porque a variável já foi declarada como `Formatador`. Esse é o caso em que calar é melhor que anotar, e ele é comum em callback.\n\nÉ esse mecanismo que dá tipo a `map`, `filter` e `reduce`: quando você escreve `lista.map((item) => item.nome)`, o tipo de `item` vem do array, e o editor completa as propriedades sozinho.\n\nAssinatura com parâmetro a mais do que o esperado é erro; com parâmetro a menos, não, porque ignorar argumento é legítimo.\n\nVocê domina este passo quando dá nome ao tipo de um callback que você passa em mais de um lugar.",
        },
      ],
    },
    {
      id: "uniao",
      title: "União e estreitamento",
      level: "intermediario",
      description:
        "Um valor que pode ser de mais de um tipo, e como o compilador acompanha você provando qual é.",
      children: [
        {
          id: "uniao.uniao",
          title: "Um valor, mais de um tipo",
          description:
            "A união descreve o valor que pode ser uma coisa ou outra, e obriga quem usa a considerar as duas.",
          content:
            'Nem todo valor tem um tipo só. Um identificador que às vezes vem como texto e às vezes como número se descreve com uma **união**, escrita com barra vertical.\n\n```ts\ntype Id = string | number;\n\nfunction mostrar(id: Id): void {\n  console.log(`id: ${id}`);\n}\n\nmostrar("abc");\nmostrar(42);\n```\n\nA união é o tipo que aceita os dois. O que ela **não** permite é usar um método que só exista em um deles: `id.toUpperCase()` dentro da função vira `TS2339`, porque `number` não tem esse método. O compilador só libera o que é comum aos dois lados.\n\nIsso incomoda no começo e é exatamente o ponto: a união te obriga a tratar o caso que você esqueceria. Para usar o que é específico, você precisa **provar** qual dos dois é, e isso se chama estreitamento, assunto dos próximos passos.\n\nUnião não é só de primitivos: `Usuario | null` é o caso mais comum de todos, e a seção Nulos e rigor trata dele.\n\nVocê domina este passo quando lê `TS2339` numa união e entende que falta provar o tipo, não trocar o tipo.',
          resources: [
            {
              label: "TypeScript: estreitamento (em inglês)",
              url: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "uniao.literal",
          title: "Tipos literais",
          description:
            "Um tipo que aceita apenas certos valores exatos, que é como se descreve um conjunto fechado.",
          content:
            'Um tipo pode ser um **valor exato**. `"pendente"` é um tipo, e só o texto `"pendente"` cabe nele. Sozinho isso é inútil; combinado com união, vira um dos recursos mais usados da linguagem.\n\n```ts\ntype Status = "pendente" | "feita" | "cancelada";\n\nfunction rotulo(s: Status): string {\n  return `status: ${s}`;\n}\n\nconsole.log(rotulo("feita"));\n```\n\nChamar `rotulo("concluida")` vira `TS2345`, com a mensagem listando os valores aceitos. Em JavaScript, esse erro de digitação sobreviveria até alguém notar que o filtro nunca encontra nada.\n\nÉ a alternativa direta ao enum de outras linguagens, e a mais comum em TypeScript moderno: o tipo existe só na conferência, e o que roda continua sendo uma string simples.\n\nVale lembrar o que o passo Inferência mostrou: `const s = "feita"` é inferido como o literal `"feita"`, enquanto `let s = "feita"` é inferido como `string`. Por isso passar um `let` onde se espera `Status` pode falhar, e o passo as const resolve esse caso.\n\nVocê domina este passo quando troca um conjunto de strings soltas por um tipo literal e o compilador acha um valor escrito errado.',
        },
        {
          id: "uniao.typeof",
          title: "Estreitar com typeof",
          description:
            "Dentro do if, o compilador sabe mais do que sabia fora dele.",
          content:
            'Estreitar é provar, para o compilador, qual dos tipos da união você tem em mãos. A ferramenta mais simples é o `typeof` do próprio JavaScript.\n\n```ts\nfunction formatar(id: string | number): string {\n  if (typeof id === "string") {\n    return id.toUpperCase();\n  }\n  return id.toFixed(2);\n}\n\nconsole.log(formatar("ana"), formatar(3.14159));\n```\n\nDentro do `if`, `id` é `string` e `toUpperCase` existe. Depois do `return`, sobra só `number`, e `toFixed` existe. Nenhuma conversão aconteceu: o valor é o mesmo, e o que mudou foi o que o compilador **sabe** sobre ele naquele ponto.\n\nEsse acompanhamento é o que torna a união prática. Ele funciona com `typeof`, com `Array.isArray`, com `instanceof` e com comparação de igualdade, e é tudo JavaScript de verdade, que continua existindo depois de compilar.\n\nUm detalhe herdado do JavaScript: `typeof null` é `"object"`, então `typeof x === "object"` não descarta `null`. Essa armadilha é antiga e o passo null e undefined no tipo volta a ela.\n\nVocê domina este passo quando estreita uma união e vê o editor passar a completar os métodos certos dentro do bloco.',
        },
        {
          id: "uniao.propriedade",
          title: "Estreitar pela propriedade",
          description:
            "A união de objetos se resolve olhando um campo que só existe num deles, ou que os distingue.",
          content:
            'Com objetos, `typeof` não ajuda: todos são `"object"`. O que distingue é a **forma**.\n\n```ts\ntype Circulo = { tipo: "circulo"; raio: number };\ntype Quadrado = { tipo: "quadrado"; lado: number };\n\nfunction area(f: Circulo | Quadrado): number {\n  if (f.tipo === "circulo") {\n    return 3.14 * f.raio * f.raio;\n  }\n  return f.lado * f.lado;\n}\n\nconsole.log(area({ tipo: "quadrado", lado: 3 }));\n```\n\nO campo `tipo`, com valor literal diferente em cada membro, é o **discriminante**. Comparar esse campo estreita a união inteira, e dentro do `if` o compilador libera `raio`, que só existe no círculo.\n\nEsse desenho, a união discriminada, é o jeito idiomático de descrever estado em TypeScript: uma resposta que é sucesso ou falha, uma tarefa pendente ou concluída. Ele substitui o objeto com metade dos campos opcionais, que é a versão sem tipo do mesmo problema.\n\nSem discriminante, ainda dá para usar o operador `in` (`if ("raio" in f)`), que é menos legível e serve quando você não controla a forma.\n\nVocê domina este passo quando modela um estado com união discriminada em vez de campos opcionais.',
        },
        {
          id: "uniao.guarda",
          title: "Funções de guarda",
          description:
            "Quando a prova não cabe num if, ela vira uma função que devolve uma afirmação sobre o tipo.",
          content:
            'Às vezes a checagem é longa demais para repetir em todo lugar. Você a transforma numa função, e diz ao compilador o que ela prova.\n\n```ts\ntype Tarefa = { titulo: string; feita: boolean };\n\nfunction ehTarefa(v: unknown): v is Tarefa {\n  if (typeof v !== "object" || v === null) return false;\n  return "titulo" in v;\n}\n\nconst dado: unknown = { titulo: "estudar", feita: false };\n\nif (ehTarefa(dado)) {\n  console.log(dado.titulo);\n}\n```\n\nO retorno `v is Tarefa` é uma **predicação de tipo**: ele diz que, quando a função devolver `true`, o argumento pode ser tratado como `Tarefa` dali em diante. Sem essa anotação, o retorno seria só `boolean` e o `if` não estreitaria nada.\n\nÉ o par natural de `unknown`: na fronteira do programa você recebe `unknown` e usa uma guarda para entrar no território tipado.\n\nO poder vem com uma responsabilidade: **o compilador acredita em você**. Se a função devolver `true` sem realmente conferir, o erro volta para a execução, e nada terá avisado. Guarda mal escrita é a forma mais discreta de reintroduzir o problema que a trilha resolve.\n\nVocê domina este passo quando escreve uma guarda e confere, você mesmo, se ela prova tudo que promete.',
        },
      ],
    },
    {
      id: "colecoes",
      title: "Coleções",
      level: "intermediario",
      description:
        "Array tipado, tupla, Record e somente leitura: o que muda em relação ao JavaScript.",
      children: [
        {
          id: "colecoes.array",
          title: "Array tipado",
          description:
            "Uma lista em que todos os itens têm o mesmo tipo, e o compilador cobrando isso na inserção.",
          content:
            'Array em TypeScript declara o tipo dos itens, com colchetes depois do tipo.\n\n```ts lanca=TS2345\nconst nomes: string[] = ["Ana", "Bia"];\n\nnomes.push(42);\nconsole.log(nomes);\n```\n\nO compilador para em `TS2345`, porque `42` não é `string`. Em JavaScript, o número entraria na lista e o defeito apareceria mais tarde, quando alguém chamasse `toUpperCase` no item errado.\n\nExiste a forma alternativa `Array<string>`, idêntica em efeito; esta trilha usa `string[]`, que é a mais comum.\n\nO caso que exige anotação é o array que nasce vazio: `const itens = []` é inferido como `any[]`, e a partir daí nada é conferido. Escreva `const itens: string[] = []`.\n\nOs métodos que você já usa ganham tipo junto: `nomes.map((n) => n.length)` devolve `number[]`, e o editor sabe que `n` é `string` sem você anotar nada, pelo mecanismo do passo Função como tipo.\n\nUm cuidado herdado do JavaScript: acessar um índice que não existe devolve `undefined`, e o tipo declarado **não** avisa disso. É uma das poucas promessas que o compilador não cobra.\n\nVocê domina este passo quando anota um array vazio antes de preenchê-lo.',
          resources: [
            {
              label: "MDN: Array (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Array",
              kind: "doc",
            },
          ],
        },
        {
          id: "colecoes.tupla",
          title: "Tupla",
          description:
            "Um array de tamanho fixo em que cada posição tem o seu próprio tipo.",
          content:
            "Quando a lista tem tamanho conhecido e cada posição significa uma coisa, o tipo é uma **tupla**.\n\n```ts\ntype Ponto = [number, number];\n\nconst origem: Ponto = [0, 0];\nconst [x, y] = origem;\n\nconsole.log(x + y);\n```\n\nA diferença para o array é que a posição carrega significado: `[number, number]` aceita exatamente dois números, e `[0, 0, 0]` vira `TS2322`.\n\nO uso mais reconhecível é o par de retorno, no estilo do `useState` do React: uma função devolve `[valor, funcao]` e quem chama desestrutura. Sem tupla, o retorno seria `(string | (() => void))[]`, e cada uso exigiria estreitamento.\n\nDá para nomear as posições, e vale a pena porque o editor passa a mostrar o nome: `type Ponto = [x: number, y: number]`. O nome é só documentação; não muda a conferência.\n\nTupla também aceita elemento opcional e resto, o que a torna útil para descrever argumentos. Na prática do dia a dia, se você precisar de mais de três posições, um objeto com nomes costuma ser mais legível.\n\nVocê domina este passo quando escolhe tupla em vez de array porque a posição significa algo.",
        },
        {
          id: "colecoes.record",
          title: "Record e objetos como dicionário",
          description:
            "Descrever o objeto usado como mapa de chave e valor, quando as chaves não são conhecidas de antemão.",
          content:
            'Nem todo objeto tem forma fixa. Quando ele é usado como dicionário, o tipo descreve a **chave** e o **valor**.\n\n```ts\ntype Contagem = Record<string, number>;\n\nconst votos: Contagem = { ana: 3, bia: 5 };\n\nvotos.carla = 1;\nconsole.log(votos.ana + votos.carla);\n```\n\n`Record<string, number>` quer dizer: qualquer chave de texto, valor sempre número. Acrescentar uma chave nova é permitido, e `votos.dani = "dois"` vira erro.\n\nA chave pode ser um conjunto fechado, e aí o `Record` passa a **exigir** todas: `Record<Status, number>` obriga o objeto a ter as três chaves do tipo `Status`, e esquecer uma vira `TS2740`. Esse é um uso excelente para tabela de tradução, porque acrescentar um status novo quebra o build até você preencher.\n\nO mesmo se escreve com assinatura de índice (`{ [chave: string]: number }`), que é a forma antiga e mais verbosa.\n\nA armadilha herdada do JavaScript: ler uma chave que não existe devolve `undefined`, e o tipo diz `number`. A opção `noUncheckedIndexedAccess` do `tsconfig.json` conserta isso, e o passo dele volta ao assunto.\n\nVocê domina este passo quando usa `Record` com chave fechada e o compilador cobra a chave que faltou.',
        },
        {
          id: "colecoes.readonly",
          title: "Coleções somente leitura",
          description:
            "Impedir a alteração de uma lista no próprio tipo, que é a versão barata da imutabilidade.",
          content:
            'Uma lista pode ser declarada como somente leitura, e aí os métodos que alteram deixam de existir.\n\n```ts lanca=TS2339\nconst dias: readonly string[] = ["seg", "ter"];\n\ndias.push("qua");\nconsole.log(dias);\n```\n\nO compilador para em `TS2339: Property \'push\' does not exist on type \'readonly string[]\'`. Os métodos que criam uma lista nova, como `map`, `filter` e `concat`, continuam disponíveis: o que sai deles é uma lista nova, e ninguém alterou a original.\n\nExiste também `ReadonlyArray<string>`, idêntico, e `ReadonlyMap` e `ReadonlySet` para as outras coleções.\n\nO valor disso aparece em parâmetro: declarar `function total(itens: readonly number[])` é um contrato de que a função **não vai mexer** na lista de quem chamou. Quem lê a assinatura já sabe, sem abrir o corpo.\n\nComo o `readonly` de propriedade, isto vale só na conferência e some ao rodar: o array continua um array comum, e nada impede alteração por um caminho sem tipo. É contrato, não cadeado.\n\nVocê domina este passo quando marca como `readonly` o parâmetro de uma função que não deveria alterar a lista recebida.',
        },
      ],
    },
    {
      id: "genericos",
      title: "Genéricos",
      level: "intermediario",
      description:
        "Escrever uma vez e funcionar com vários tipos, sem perder a informação pelo caminho.",
      children: [
        {
          id: "genericos.funcao",
          title: "Função genérica",
          description:
            "Escrever uma vez e funcionar com vários tipos, sem perder a informação de qual deles é.",
          content:
            'Uma função que serve para qualquer tipo pode ser escrita com `any`, e aí ela perde a informação: o que sai não tem tipo nenhum. O genérico resolve isso guardando o tipo que entrou.\n\n```ts\nfunction primeiro<T>(itens: T[]): T {\n  return itens[0];\n}\n\nconst n = primeiro([1, 2, 3]);\nconst s = primeiro(["ana", "bia"]);\n\nconsole.log(n + 1, s.toUpperCase());\n```\n\nO `<T>` é um **parâmetro de tipo**: ele não tem valor fixo, e assume o que a chamada trouxer. Na primeira linha `T` é `number`, então `n + 1` funciona; na segunda é `string`, e `toUpperCase` existe. Nenhuma anotação foi escrita na chamada: o compilador deduziu.\n\nCom `any` no lugar de `T`, as duas chamadas devolveriam `any` e nada seria conferido depois. Essa é a diferença que justifica o recurso: **o genérico é o oposto de apagar o tipo, é transportá-lo**.\n\nA convenção é uma letra maiúscula, `T` para o primeiro, `U` e `K` para os seguintes. Nome descritivo (`TItem`) também se vê, e vale quando há mais de dois.\n\nVocê domina este passo quando troca um `any[]` por `T[]` e o retorno volta a ter tipo.',
          resources: [
            {
              label: "TypeScript: genéricos (em inglês)",
              url: "https://www.typescriptlang.org/docs/handbook/2/generics.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "genericos.tipo",
          title: "Tipo genérico",
          description:
            "A mesma ideia aplicada a interface e apelido: uma forma parametrizada pelo que ela carrega.",
          content:
            'Genérico não é só de função. Um tipo também pode receber parâmetro, e é assim que se descreve um invólucro.\n\n```ts\ninterface Resposta<T> {\n  dados: T;\n  erro: string | null;\n}\n\nconst r: Resposta<string[]> = {\n  dados: ["ana", "bia"],\n  erro: null,\n};\n\nconsole.log(r.dados.length);\n```\n\n`Resposta<T>` descreve a forma "algo mais um erro", sem decidir o que é esse algo. Na hora de usar, `Resposta<string[]>` fixa `T`, e `r.dados` é um array de string de verdade, com `length` e `map`.\n\nSem isso, você escreveria uma interface por tipo de conteúdo, ou usaria `any` em `dados` e perderia a conferência logo depois.\n\nÉ o mesmo mecanismo que você já usa sem perceber: `Array<T>`, `Promise<T>` e `Map<K, V>` são tipos genéricos da biblioteca padrão. Quando o editor mostra `Promise<string>`, ele está dizendo qual `T` foi preenchido.\n\nParâmetro de tipo aceita valor padrão, escrito `interface Resposta<T = unknown>`, e aí usar `Resposta` sem colchetes é válido.\n\nVocê domina este passo quando descreve um invólucro seu com um parâmetro de tipo em vez de repetir a forma.',
        },
        {
          id: "genericos.extends",
          title: "Restringir o genérico",
          description:
            "Aceitar qualquer tipo é demais: extends limita o genérico ao que a função realmente sabe usar.",
          content:
            'Um genérico sem restrição aceita qualquer coisa, e por isso a função quase nada pode fazer com ele. Quando o corpo precisa de alguma capacidade, você a exige com `extends`.\n\n```ts lanca=TS2345\ntype ComTamanho = { length: number };\n\nfunction tamanho<T extends ComTamanho>(v: T): number {\n  return v.length;\n}\n\nconsole.log(tamanho("texto"), tamanho([1, 2]));\nconsole.log(tamanho(42));\n```\n\nA restrição diz: `T` pode ser qualquer tipo **que tenha** `length`. String e array passam; `42` não, e o compilador para em `TS2345`.\n\nRepare que a restrição não apaga o tipo original: dentro da função `T` continua sendo o que entrou, e o retorno pode usá-lo. É diferente de declarar o parâmetro como `{ length: number }`, que aceitaria o mesmo conjunto e perderia a identidade do tipo na saída.\n\nA forma mais comum no dia a dia é restringir a chave de um objeto: `function pegar<T, K extends keyof T>(obj: T, chave: K): T[K]` devolve exatamente o tipo da propriedade pedida, e uma chave que não existe vira erro.\n\nVocê domina este passo quando lê uma assinatura com `extends` e diz que capacidade a função exige.',
        },
        {
          id: "genericos.utilitarios",
          title: "Os utilitários que se usam de verdade",
          description:
            "Tipos prontos que derivam uma forma de outra, em vez de escrever a mesma coisa duas vezes.",
          content:
            'A biblioteca padrão traz tipos genéricos que transformam outros tipos. Quatro aparecem o tempo todo.\n\n```ts\ninterface Tarefa {\n  id: number;\n  titulo: string;\n  feita: boolean;\n}\n\ntype Rascunho = Omit<Tarefa, "id">;\ntype Resumo = Pick<Tarefa, "id" | "titulo">;\n\nconst r: Rascunho = { titulo: "estudar", feita: false };\nconsole.log(r.titulo);\n```\n\n`Omit<T, K>` devolve a forma sem as chaves citadas, e `Pick<T, K>` devolve só com elas. `Partial<T>` torna tudo opcional, útil para função de atualização. E `Record<K, V>`, que a seção Coleções já usou, monta um dicionário.\n\nO ganho não é escrever menos: é **derivar**. Quando `Tarefa` ganhar um campo, `Rascunho` e `Resumo` acompanham sozinhos. A versão copiada à mão silenciosamente diverge, e ninguém percebe até o bug.\n\nHá outros na mesma família (`Required`, `Readonly`, `ReturnType`, `Awaited`), e o handbook lista todos. Vale conhecer a existência e procurar quando precisar; decorar a lista não ajuda.\n\nVocê domina este passo quando deriva um tipo de outro em vez de copiar os campos.',
          resources: [
            {
              label: "TypeScript: tipos utilitários (em inglês)",
              url: "https://www.typescriptlang.org/docs/handbook/utility-types.html",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "nulos",
      title: "Nulos e rigor",
      level: "avancado",
      description:
        "O modo estrito, null e undefined dentro do tipo, e as ferramentas que evitam o erro mais comum da web.",
      children: [
        {
          id: "nulos.strict",
          title: "O modo estrito",
          description:
            "Com strict ligado, null e undefined deixam de caber em qualquer lugar, e é esse o ponto.",
          content:
            "A opção `strict` do `tsconfig.json` liga um conjunto de conferências, e a mais consequente é `strictNullChecks`.\n\nSem ela, `null` cabe em qualquer tipo, e o TypeScript repete o erro mais comum da história da linguagem. Com ela, não cabe:\n\n```ts lanca=TS2322\nconst nome: string = null;\n\nconsole.log(nome);\n```\n\nO compilador para em `TS2322: Type 'null' is not assignable to type 'string'`. Para permitir a ausência, você a declara: `const nome: string | null = null`.\n\nEssa mudança é o que transforma o TypeScript de \"JavaScript com autocompletar\" em verificador de verdade. É ela que pega o acesso a uma propriedade de algo que pode não existir, que em JavaScript é o `TypeError` de toda semana.\n\n`strict` também liga `noImplicitAny`, que o passo any apaga a garantia citou, e outras conferências menores. Projeto novo nasce com `strict: true`, e esta trilha inteira assume isso.\n\nLigar `strict` num projeto antigo costuma revelar centenas de erros de uma vez; o caminho é ligar uma opção por vez, e o passo do `tsconfig.json` volta a isso.\n\nVocê domina este passo quando explica por que `strictNullChecks` é a opção que mais muda o dia a dia.",
          resources: [
            {
              label: "TypeScript: opções do tsconfig (em inglês)",
              url: "https://www.typescriptlang.org/tsconfig/",
              kind: "doc",
            },
          ],
        },
        {
          id: "nulos.undefined",
          title: "null e undefined dentro do tipo",
          description:
            "Declarar a ausência e provar que ela não aconteceu antes de usar o valor.",
          content:
            "Quando um valor pode faltar, isso entra no tipo, e o compilador passa a cobrar a checagem.\n\n```ts\nfunction inicial(nome: string | null): string {\n  if (nome === null) {\n    return \"?\";\n  }\n  return nome[0];\n}\n\nconsole.log(inicial(\"Ana\"), inicial(null));\n```\n\nSem o `if`, `nome[0]` seria `TS18047: 'nome' is possibly 'null'`. Com ele, o estreitamento da seção União e estreitamento entra em ação: depois do `return`, só sobra `string`.\n\n`null` e `undefined` são tipos diferentes, e a distinção é útil: `undefined` costuma significar \"nunca foi preenchido\" e `null` significa \"foi preenchido com nada\". Propriedade opcional (`nota?: string`) produz `string | undefined`, não `null`.\n\nO erro que aparece mais é o `TS18048`, `'x' is possibly 'undefined'`, quase sempre em propriedade opcional ou em retorno de `find`. Ele não é implicância: `find` devolve `undefined` quando não acha, e ignorar isso é o defeito clássico.\n\nO próximo passo mostra as duas formas curtas de tratar a ausência sem escrever um `if` a cada acesso.\n\nVocê domina este passo quando lê `TS18048` e localiza, sem procurar, de onde vem a possibilidade de ausência.",
        },
        {
          id: "nulos.encadeamento",
          title: "Encadeamento opcional e o valor padrão",
          description:
            "Duas sintaxes do JavaScript moderno que o TypeScript entende e usa para estreitar.",
          content:
            'Ler uma propriedade fundo adentro quando algo no meio pode faltar cansa com `if`. O JavaScript resolveu isso com duas sintaxes, e o TypeScript as entende.\n\n```ts\ninterface Cliente {\n  nome: string;\n  endereco?: { cidade: string };\n}\n\nfunction cidade(c: Cliente): string {\n  return c.endereco?.cidade ?? "nao informada";\n}\n\nconsole.log(cidade({ nome: "Ana" }));\n```\n\nO `?.` para a leitura se o lado esquerdo for `null` ou `undefined`, devolvendo `undefined` em vez de lançar. Sem ele, `c.endereco.cidade` seria `TS18048`, e em JavaScript seria um `TypeError` na execução.\n\nO `??` devolve o lado direito quando o esquerdo é `null` ou `undefined`. Ele é diferente do `||`, que também troca em `0`, `""` e `false`; para um campo numérico, `||` transforma zero em padrão, que é um bug silencioso conhecido.\n\nOs dois são JavaScript de verdade e continuam existindo depois de compilar, ao contrário do que o próximo passo mostra sobre a asserção de não-nulo.\n\nVocê domina este passo quando troca uma cadeia de `if` por `?.` com `??` e o tipo final deixa de ter `undefined`.',
          resources: [
            {
              label: "MDN: encadeamento opcional (pt-BR)",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Operators/Optional_chaining",
              kind: "doc",
            },
          ],
        },
        {
          id: "nulos.asconst",
          title: "as const",
          description:
            "Congelar o valor no tipo mais específico possível, que é o que faz o literal funcionar.",
          content:
            'O passo Inferência mostrou que `let` alarga o tipo: `let s = "feita"` vira `string`, e não o literal. O mesmo acontece dentro de objetos e arrays, e é aí que dói.\n\n```ts\ntype Status = "pendente" | "feita";\n\nconst config = { status: "feita" } as const;\n\nfunction rotulo(s: Status): string {\n  return `status: ${s}`;\n}\n\nconsole.log(rotulo(config.status));\n```\n\nSem o `as const`, `config.status` seria inferido como `string`, e passá-lo para `rotulo` viraria `TS2345`, porque `string` é largo demais para caber em `Status`. Com ele, a propriedade é o literal `"feita"` e o encaixe acontece.\n\n`as const` faz duas coisas ao mesmo tempo: fixa cada valor no seu literal e marca tudo como `readonly`, em profundidade. Por isso um array com `as const` vira tupla somente leitura, o que é exatamente o que se quer numa lista de opções fixas.\n\nO uso mais comum é declarar a lista de valores válidos uma vez e derivar o tipo dela, em vez de manter as duas em sincronia à mão.\n\nVocê domina este passo quando usa `as const` para uma lista de opções e o tipo sai do próprio valor.',
        },
        {
          id: "nulos.assercao",
          title: "satisfies, e o empréstimo caro da asserção",
          description:
            "Uma forma de conferir sem alargar, e outra de calar o compilador que cobra juros.",
          content:
            'Duas ferramentas parecem resolver o mesmo problema, e só uma é segura.\n\nA **asserção de não-nulo**, o ponto de exclamação, diz ao compilador "confie em mim, aqui não é nulo":\n\n```ts\nconst nomes: string[] = ["Ana"];\nconst primeiro = nomes.find((n) => n.startsWith("A"))!;\n\nconsole.log(primeiro.toUpperCase());\n```\n\nIsso compila, e **nada é conferido em tempo de execução**: se o `find` não achar nada, o `TypeError` volta, exatamente como em JavaScript. É um empréstimo: você ganha silêncio agora e paga com o erro depois. Use só quando puder provar a ausência com um argumento que o compilador não alcança, e escreva o porquê ao lado.\n\nO `satisfies` é o oposto, e é seguro: ele confere que o valor cabe num tipo **sem** trocar o tipo inferido por ele.\n\n```ts\ntype Cores = Record<string, string>;\n\nconst tema = {\n  fundo: "#fff",\n  texto: "#000",\n} satisfies Cores;\n\nconsole.log(tema.fundo.length);\n```\n\nA conferência acontece, e `tema.fundo` continua sendo o literal, com as chaves exatas conhecidas. Com `: Cores`, o tipo alargaria e `tema.qualquer` passaria.\n\nVocê domina este passo quando troca uma anotação larga por `satisfies` e mantém o autocompletar das chaves reais.',
        },
      ],
    },
    {
      id: "ferramenta",
      title: "A ferramenta",
      level: "avancado",
      description:
        "O tsconfig.json, os pacotes de tipos, e ler a mensagem do compilador sem medo.",
      children: [
        {
          id: "ferramenta.tsconfig",
          title: "O tsconfig.json",
          description:
            "O arquivo que diz ao compilador o que conferir e para onde emitir, e as opções que importam de verdade.",
          content:
            'O `tsconfig.json` na raiz do projeto define como o compilador se comporta. Ele é longo na documentação e curto na prática.\n\n```json\n{\n  "compilerOptions": {\n    "strict": true,\n    "target": "es2022",\n    "module": "nodenext",\n    "outDir": "dist"\n  }\n}\n```\n\n`strict` é a decisão mais importante, e a seção Nulos e rigor já mostrou por quê. `target` diz para qual versão de JavaScript emitir. `module` diz qual sistema de módulos usar. `outDir` separa o que foi gerado do que você escreveu.\n\nDuas opções valem conhecer cedo. `noUncheckedIndexedAccess` acrescenta `undefined` ao ler índice de array ou chave de dicionário, que é a promessa que o passo Record citou como não cobrada por padrão. E `noEmit`, que manda o compilador só conferir, sem gerar arquivo, que é o modo usado quando outra ferramenta cuida da emissão.\n\nRodar `npx tsc --noEmit` confere o projeto inteiro e é o que costuma rodar na integração contínua.\n\nVocê domina este passo quando abre um `tsconfig.json` alheio e reconhece o que cada opção da raiz decide.',
          resources: [
            {
              label: "TypeScript: referência do tsconfig (em inglês)",
              url: "https://www.typescriptlang.org/tsconfig/",
              kind: "doc",
            },
          ],
        },
        {
          id: "ferramenta.importtype",
          title: "import type",
          description:
            "Importar só o tipo, deixando claro que nada daquilo sobra no código que roda.",
          content:
            'Tipos moram em arquivos e são importados como qualquer outra coisa. A forma que declara a intenção é `import type`.\n\n```ts arquivo=tipos.ts\nexport interface Tarefa {\n  titulo: string;\n  feita: boolean;\n}\n```\n\n```ts arquivo=app.ts\nimport type { Tarefa } from "./tipos";\n\nconst t: Tarefa = { titulo: "estudar", feita: false };\nconsole.log(t.titulo);\n```\n\nOs dois arquivos são de verdade: o primeiro declara a forma, o segundo a usa. O `import type` diz ao compilador que aquela importação é **só de tipo**, e ela desaparece por completo na emissão; nenhum `require` nem `import` sobra no JavaScript gerado.\n\nIsso evita um problema real: uma importação comum usada só como tipo pode manter um módulo vivo no bundle final sem necessidade, ou causar ciclo de importação. Com `import type`, a intenção fica escrita e a ferramenta garante.\n\nA forma `import { type Tarefa, criar }` também existe, e serve quando o mesmo arquivo traz tipo e valor.\n\nVocê domina este passo quando separa, numa importação sua, o que é tipo do que é valor.',
          resources: [
            {
              label: "TypeScript: módulos (em inglês)",
              url: "https://www.typescriptlang.org/docs/handbook/2/modules.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "ferramenta.types",
          title: "Os pacotes @types",
          description:
            "Onde moram os tipos das bibliotecas que não os trazem, e por que o seu trecho não enxerga o Node.",
          content:
            "Uma biblioteca escrita em TypeScript já traz os próprios tipos. Uma escrita em JavaScript não, e aí os tipos vêm de um pacote separado, publicado com o prefixo `@types`.\n\nInstalar `@types/node`, por exemplo, é o que faz `process`, `Buffer` e o módulo `fs` existirem para o compilador. Sem ele, `process.argv` é `TS2591`, com a mensagem sugerindo justamente a instalação.\n\nIsso explica uma característica desta trilha: os trechos das lições rodam num ambiente **sem** `@types/node` e **sem** a biblioteca do navegador. Existem `console` e a biblioteca padrão da linguagem, e nada mais. `process`, `fetch`, `window` e `document` não estão declarados, de propósito: assim um nome escrito errado aparece como erro em vez de encontrar um global qualquer.\n\nNo seu projeto é diferente: você instala o que precisa e declara em `types` no `tsconfig.json` quais pacotes entram.\n\nQuando uma biblioteca não tem tipos nem pacote `@types`, o caminho é declarar o mínimo você mesmo, num arquivo `.d.ts`, que contém só declarações e não gera código.\n\nVocê domina este passo quando lê `TS2591` e sabe que falta um pacote de tipos, não uma dependência.",
          resources: [
            {
              label: "TypeScript: declarações de tipo (em inglês)",
              url: "https://www.typescriptlang.org/docs/handbook/2/type-declarations.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "ferramenta.mensagens",
          title: "Ler a mensagem do compilador",
          description:
            "Os quatro códigos que aparecem toda semana, e como ler o erro de fora para dentro.",
          content:
            "A mensagem do compilador assusta de início e segue sempre a mesma forma: arquivo, linha e coluna, o código, e a explicação.\n\n```ts lanca=TS2345\nfunction metade(valor: number): number {\n  return valor / 2;\n}\n\nconsole.log(metade(\"10\"));\n```\n\nA saída é `TS2345: Argument of type 'string' is not assignable to parameter of type 'number'`, na linha da chamada.\n\nQuatro códigos cobrem a maior parte do dia a dia:\n\n`TS2322` é atribuição incompatível: o valor não cabe no tipo declarado. `TS2345` é argumento incompatível: a chamada não cabe no parâmetro. `TS7006` é parâmetro sem tipo no modo estrito. E `TS18048` é acesso a algo que pode ser `undefined`.\n\nA regra de leitura que economiza tempo: leia **de fora para dentro**. A primeira linha diz o que não coube onde; as linhas indentadas depois dela detalham a diferença, e em tipos aninhados elas ficam longas. Quase sempre a primeira linha basta.\n\nQuando a mensagem citar um tipo enorme, dê nome a ele com `interface` ou `type`: o erro passa a citar o nome.\n\nVocê domina este passo quando reconhece os quatro códigos sem procurar o que significam.",
        },
      ],
    },
    {
      id: "projeto",
      title: "Projeto",
      level: "avancado",
      description:
        "O gerenciador de tarefas no terminal da trilha de JavaScript, agora tipado.",
      children: [
        {
          id: "projeto.cli",
          title: "Tipar o gerenciador de tarefas",
          description:
            "O projeto final da trilha: pegar a CLI de tarefas da trilha de JavaScript e dar tipo a ela.",
          project: "cli-tarefas-terminal",
          content:
            "O projeto desta trilha não começa do zero: é o **mesmo gerenciador de tarefas no terminal** que a trilha JavaScript do Zero construiu, agora tipado.\n\nSe você fez aquela trilha, abra o seu código. Se não fez, qualquer programa de terminal que guarde uma lista de tarefas em arquivo, com adicionar, listar e concluir, serve de ponto de partida.\n\nA regra do projeto é uma só: **não troque a lógica para agradar o compilador**. Se um erro aparecer, ele é informação; entenda o que ele diz antes de calar. Em particular, evite o ponto de exclamação e o `any`: os dois fazem o erro sumir sem resolver nada, e o passo satisfies, e o empréstimo caro da asserção explica a conta.\n\nO resultado esperado é um programa que roda igual ao de antes, com `strict` ligado, sem nenhum `any` escrito à mão, e com a forma da tarefa declarada uma vez e usada em todo lugar.\n\nO card abaixo traz o enunciado completo com os critérios de pronto. Os dois passos seguintes dão o roteiro e os caminhos depois da trilha.\n\nVocê domina este passo quando olha o seu código sem tipos e já sabe qual forma declarar primeiro.",
        },
        {
          id: "projeto.roteiro",
          title: "Roteiro do projeto",
          description:
            "A ordem de trabalho que evita refazer: da forma do dado até o rigor no fim.",
          content:
            "A ordem abaixo existe para você não brigar com o compilador à toa. Ela vai do dado para as bordas.\n\n1. **A forma da tarefa.** Declare uma `interface Tarefa` com `id`, `titulo` e `feita`. Marque o `id` como `readonly`, porque ele nunca muda depois de criado.\n2. **O estado.** Tipe a lista como `Tarefa[]`, e não deixe nenhum array nascer vazio sem anotação.\n3. **As funções.** Tipe parâmetro e retorno de cada uma: `adicionar`, `listar`, `concluir`. É aqui que a maior parte dos erros reais aparece.\n4. **O que pode faltar.** `find` devolve `undefined` quando não acha. Trate com `if` ou com `??`, nunca com o ponto de exclamação.\n5. **A entrada do usuário.** O que chega do terminal é texto. Declare como `string` e converta explicitamente; um `id` que veio como texto e foi comparado com número é o defeito clássico.\n6. **O arquivo.** O conteúdo lido do disco e passado por `JSON.parse` é `unknown`, não `Tarefa[]`. Escreva a guarda, como no passo Funções de guarda.\n7. **O rigor.** Ligue `strict` no `tsconfig.json`, rode `npx tsc --noEmit` e resolva o que aparecer.\n\nNo fim, procure por `any` e por `!` no seu código: cada ocorrência merece um comentário justificando ou uma correção.\n\nVocê domina este passo quando termina com o compilador em silêncio e sem nenhum atalho escrito.",
        },
        {
          id: "projeto.caminhos",
          title: "Depois desta trilha",
          description:
            "Onde o TypeScript aparece a seguir, e o hábito que vale levar.",
          content:
            "Com JavaScript e TypeScript, você tem a linguagem e a rede de segurança. Daqui saem três caminhos.\n\nO primeiro é voltar às trilhas de área com a linguagem tipada. **Front-end do Zero** usa TypeScript com React em praticamente todo projeto atual, e o que você viu de genéricos e união aparece direto nas propriedades dos componentes. **Back-end do Zero**, no seletor de Node, usa os mesmos tipos do outro lado da requisição.\n\nO segundo é aprofundar a própria linguagem: tipos condicionais, mapeados e inferência com `infer` resolvem problemas de biblioteca, e quase nunca são necessários em código de aplicação. Procure-os quando doer, não antes.\n\nO terceiro é a base que sustenta tudo: se algum passo daqui pareceu apoiado em algo que faltou, **JavaScript do Zero** é a trilha que o cobre, e esta continua exatamente de onde ela para.\n\nSobre a adoção: projeto que já existe se migra arquivo por arquivo, com `strict` ligado por etapas. Não existe dia de virada, e tentar um costuma terminar com centenas de `any`.\n\nO hábito que vale levar é ler o erro inteiro antes de mexer no código. O compilador quase sempre já disse onde está o problema, e o reflexo de silenciar é o que transforma uma ferramenta de conferência em enfeite.\n\nVocê domina este passo, e a trilha, quando olha um erro de tipo e o trata como informação, não como obstáculo.",
        },
      ],
    },
  ],
};
