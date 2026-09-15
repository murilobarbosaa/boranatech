// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool python). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "python",
  "questions": [
    {
      "id": "python-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você precisa explicar o que é Python para um amigo. O que você diz?",
      "alternativas": {
        "a": "É uma linguagem de programação que se destaca pela sua legibilidade.",
        "b": "É um tipo de software que roda apenas em servidores.",
        "c": "É uma ferramenta que serve apenas para automação de tarefas repetitivas.",
        "d": "É um sistema operacional que precisa ser instalado em todos os computadores."
      },
      "correta": "a",
      "explicacao": "Python é uma linguagem de programação projetada para ser legível e fácil de usar.",
      "fonte": "comeco.oque"
    },
    {
      "id": "python-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você está explicando a diferença entre Python e o interpretador. Como você define cada um?",
      "alternativas": {
        "a": "Python é a linguagem e o interpretador é o programa que executa o código.",
        "b": "Python é o programa que roda e o interpretador é uma linguagem de script.",
        "c": "Python é um editor e o interpretador é uma biblioteca de funções.",
        "d": "Python é um sistema operacional e o interpretador é um aplicativo."
      },
      "correta": "a",
      "explicacao": "Python é a linguagem de programação, enquanto o interpretador é o software que executa o código escrito nessa linguagem.",
      "fonte": "comeco.oque"
    },
    {
      "id": "python-ini-03",
      "nivel": "iniciante",
      "pergunta": "O que este código imprime?",
      "alternativas": {
        "a": "Olá, Python!",
        "b": "Olá, Python! Olá, Python!",
        "c": "Olá, Python! Olá!",
        "d": "Olá! Python!"
      },
      "correta": "a",
      "explicacao": "O código executa a função print que exibe 'Olá, Python!' no terminal.",
      "fonte": "comeco.primeiro",
      "tipo": "saida",
      "codigo": {
        "linguagem": "python",
        "trecho": "print('Olá, Python!')"
      },
      "alternativasCodigo": true
    },
    {
      "id": "python-ini-04",
      "nivel": "iniciante",
      "pergunta": "Este código deveria imprimir 'bem-vindo' só para quem tem 18 anos ou mais, e 'fim' para todos. Com idade 15, qual é o defeito?",
      "alternativas": {
        "a": "Falta um else depois do if para tratar quem tem menos de 18 anos.",
        "b": "A condição deveria usar > em vez de >=.",
        "c": "print('bem-vindo') está sem recuo, então fica fora do if e roda para qualquer idade.",
        "d": "print('fim') deveria estar recuado dentro do if."
      },
      "correta": "c",
      "explicacao": "Em Python o bloco do if é definido pelo recuo. Como print('bem-vindo') voltou à margem, ele não pertence ao if e é executado mesmo com idade 15.",
      "fonte": "comeco.indentacao",
      "tipo": "erro",
      "codigo": {
        "linguagem": "python",
        "trecho": "idade = 15\nif idade >= 18:\n    print('pode entrar')\nprint('bem-vindo')\nprint('fim')",
        "saidaEsperada": "fim"
      }
    },
    {
      "id": "python-ini-05",
      "nivel": "iniciante",
      "pergunta": "Qual é a saída deste código?",
      "alternativas": {
        "a": "primeira\nsegunda",
        "b": "primeira\\nsegunda",
        "c": "primeira segunda",
        "d": "primeira\nsegunda\nfim"
      },
      "correta": "a",
      "explicacao": "O código imprime 'primeira' e 'segunda' em linhas separadas devido ao uso da função print.",
      "fonte": "comeco.primeiro",
      "tipo": "saida",
      "codigo": {
        "linguagem": "python",
        "trecho": "print('primeira')\nprint('segunda')"
      },
      "alternativasCodigo": true
    },
    {
      "id": "python-ini-06",
      "nivel": "iniciante",
      "pergunta": "Qual alternativa completa a lacuna para que o programa mostre Olá, Python! no terminal?",
      "alternativas": {
        "a": "'Olá, Python!'",
        "b": "Olá, Python!",
        "c": "'Olá', 'Python!'",
        "d": "'Olá, Python'"
      },
      "correta": "a",
      "explicacao": "print recebe o texto entre aspas. Sem aspas, Python tenta ler o texto como código e acusa erro de sintaxe; com dois textos separados por vírgula, print os junta com espaço e a vírgula some; sem a exclamação, a saída muda.",
      "fonte": "comeco.primeiro",
      "tipo": "completar",
      "codigo": {
        "linguagem": "python",
        "trecho": "print(____)"
      },
      "alternativasCodigo": true
    },
    {
      "id": "python-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você precisa saber o tipo da variável `valor = '100'`. Qual comando você deve usar?",
      "alternativas": {
        "a": "type(valor)",
        "b": "valor.type()",
        "c": "valor.tipo()",
        "d": "tipo(valor)"
      },
      "correta": "a",
      "explicacao": "O comando correto para verificar o tipo de uma variável em Python é `type(valor)`.",
      "fonte": "valores.tipos"
    },
    {
      "id": "python-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você criou uma variável `preco = 10` e depois fez `preco = preco + 5`. Qual será o valor de `preco` após essas operações?",
      "alternativas": {
        "a": "10",
        "b": "5",
        "c": "15",
        "d": "0"
      },
      "correta": "c",
      "explicacao": "Após a operação, `preco` será 15, pois 10 + 5 resulta em 15.",
      "fonte": "valores.variaveis"
    },
    {
      "id": "python-ini-09",
      "nivel": "iniciante",
      "pergunta": "Este código deveria dobrar o valor 12,5 que o usuário digitou e imprimir 25.0. Qual é o defeito?",
      "alternativas": {
        "a": "float não converte texto; só int faz essa conversão.",
        "b": "O texto usa vírgula decimal; float só aceita ponto, então lança ValueError.",
        "c": "Falta converter o resultado com str antes do print.",
        "d": "valor * 2 repete o texto em vez de multiplicar."
      },
      "correta": "b",
      "explicacao": "float entende o ponto como separador decimal. Com '12,5' ele lança ValueError na linha 2; o texto precisaria virar '12.5', por exemplo com texto.replace(',', '.').",
      "fonte": "valores.conversao",
      "tipo": "erro",
      "codigo": {
        "linguagem": "python",
        "trecho": "texto = '12,5'\nvalor = float(texto)\nprint(valor * 2)",
        "saidaEsperada": "25.0"
      }
    },
    {
      "id": "python-ini-10",
      "nivel": "iniciante",
      "pergunta": "O que este código imprime?",
      "alternativas": {
        "a": "3 x caneta = 7.50",
        "b": "3 x caneta = 7.5",
        "c": "3 x caneta = 7.500",
        "d": "3 x caneta = 7.0"
      },
      "correta": "a",
      "explicacao": "O código imprime '3 x caneta = 7.50' com duas casas decimais formatadas.",
      "fonte": "valores.strings",
      "tipo": "saida",
      "codigo": {
        "linguagem": "python",
        "trecho": "produto = 'caneta'\npreco = 2.5\nqtd = 3\ntotal = qtd * preco\nprint(f'{qtd} x {produto} = {total:.2f}')\n"
      },
      "alternativasCodigo": true
    },
    {
      "id": "python-ini-11",
      "nivel": "iniciante",
      "pergunta": "Qual operador completa a lacuna para que o código mostre quantas horas inteiras cabem em 135 minutos?",
      "alternativas": {
        "a": "/",
        "b": "//",
        "c": "%",
        "d": "*"
      },
      "correta": "b",
      "explicacao": "A barra dupla faz divisão inteira: 135 // 60 dá 2. A barra simples daria 2.25, o % daria o resto, 15, e o * multiplicaria.",
      "fonte": "valores.numeros",
      "tipo": "completar",
      "codigo": {
        "linguagem": "python",
        "trecho": "minutos = 135\nhoras = minutos ____ 60\nprint(horas)"
      },
      "alternativasCodigo": true
    },
    {
      "id": "python-ini-12",
      "nivel": "iniciante",
      "pergunta": "Numa cadeia de if, elif e else que classifica uma nota, quantos blocos executam quando a nota satisfaz mais de uma condição?",
      "alternativas": {
        "a": "Todos os blocos cujas condições forem verdadeiras.",
        "b": "Só o primeiro bloco cuja condição for verdadeira, na ordem em que aparecem.",
        "c": "Só o bloco do else.",
        "d": "Só o último bloco cuja condição for verdadeira."
      },
      "correta": "b",
      "explicacao": "A cadeia para no primeiro teste verdadeiro e pula o resto. Por isso as condições de nota vêm da maior para a menor: com nota 9, nota >= 9 precisa ser testada antes de nota >= 7.",
      "fonte": "fluxo.if"
    },
    {
      "id": "python-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você está combinando condições para verificar se um usuário pode entrar em um evento. Qual é a forma correta de usar and e or?",
      "alternativas": {
        "a": "idade >= 18 and tem_ingresso",
        "b": "idade >= 18 or tem_ingresso",
        "c": "idade >= 18 and not tem_ingresso",
        "d": "idade < 18 or not tem_ingresso"
      },
      "correta": "a",
      "explicacao": "idade >= 18 and tem_ingresso exige as duas condições ao mesmo tempo, que é a regra de entrada. Com or bastaria uma delas, e com not a lógica se inverte.",
      "fonte": "fluxo.logicos"
    },
    {
      "id": "python-ini-14",
      "nivel": "iniciante",
      "pergunta": "Qual alternativa completa a lacuna para que o código some os números de 1 a 4 corretamente?",
      "alternativas": {
        "a": "range(1, 5)",
        "b": "range(1, 4)",
        "c": "range(1, 6)",
        "d": "range(2, 5)"
      },
      "correta": "a",
      "explicacao": "O fim de range é exclusivo: range(1, 5) gera 1, 2, 3 e 4, e a soma dá 10. range(1, 4) para no 3, range(1, 6) inclui o 5 e range(2, 5) pula o 1.",
      "fonte": "fluxo.for",
      "tipo": "completar",
      "codigo": {
        "linguagem": "python",
        "trecho": "total = 0\nfor n in ____:\n    total += n\nprint(total)"
      },
      "alternativasCodigo": true
    },
    {
      "id": "python-ini-15",
      "nivel": "iniciante",
      "pergunta": "Este código deveria imprimir os nomes da fila até encontrar 'sair' e parar ali. Qual é o defeito?",
      "alternativas": {
        "a": "continue só pula o 'sair' e o laço segue; para parar ali o certo é break.",
        "b": "O if deveria comparar com = em vez de ==.",
        "c": "Falta um else antes do print.",
        "d": "Um for não pode ser interrompido; seria preciso um while."
      },
      "correta": "a",
      "explicacao": "continue pula para a próxima repetição sem encerrar o laço, então 'bruno' ainda é impresso. break abandona o laço na hora, que é o que a intenção pede.",
      "fonte": "fluxo.while",
      "tipo": "erro",
      "codigo": {
        "linguagem": "python",
        "trecho": "fila = ['ana', 'sair', 'bruno']\nfor nome in fila:\n    if nome == 'sair':\n        continue\n    print(nome)",
        "saidaEsperada": "ana"
      }
    },
    {
      "id": "python-int-01",
      "nivel": "intermediario",
      "pergunta": "Qual palavra completa a lacuna para que a função devolva a área e o programa mostre 12?",
      "alternativas": {
        "a": "return",
        "b": "print",
        "c": "yield",
        "d": "assert"
      },
      "correta": "a",
      "explicacao": "return devolve o valor a quem chamou. print mostraria 12 dentro da função, mas ela devolveria None; yield transformaria a função num gerador, e assert só testa a condição sem devolver nada.",
      "fonte": "funcoes.def",
      "tipo": "completar",
      "codigo": {
        "linguagem": "python",
        "trecho": "def area_retangulo(largura, altura):\n    ____ largura * altura\n\nprint(area_retangulo(3, 4))"
      },
      "alternativasCodigo": true
    },
    {
      "id": "python-int-02",
      "nivel": "intermediario",
      "pergunta": "Ao definir uma função que usa uma lista como parâmetro padrão, qual é a prática recomendada para evitar problemas?",
      "alternativas": {
        "a": "Definir o parâmetro como lista=[]",
        "b": "Definir o parâmetro como lista=None",
        "c": "Definir o parâmetro como lista={}",
        "d": "Definir o parâmetro como lista=[0]"
      },
      "correta": "b",
      "explicacao": "Definir o parâmetro como None e criar a lista dentro da função evita que a mesma lista seja compartilhada entre chamadas.",
      "fonte": "funcoes.parametros"
    },
    {
      "id": "python-int-03",
      "nivel": "intermediario",
      "pergunta": "Esta função deveria somar dois números e devolver o resultado, e o programa imprimir 5. Qual é o defeito?",
      "alternativas": {
        "a": "Falta o return na função",
        "b": "A função não está definida corretamente",
        "c": "Os parâmetros não estão sendo passados corretamente",
        "d": "A função não pode somar números"
      },
      "correta": "a",
      "explicacao": "Sem return a função devolve None, e é None que aparece no lugar de 5.",
      "fonte": "funcoes.def",
      "tipo": "erro",
      "codigo": {
        "linguagem": "python",
        "trecho": "def soma_errada(a, b):\n    a + b\n\nprint(soma_errada(2, 3))",
        "saidaEsperada": "5"
      }
    },
    {
      "id": "python-int-04",
      "nivel": "intermediario",
      "pergunta": "Qual é a saída deste código?",
      "alternativas": {
        "a": "['a']\n['b']",
        "b": "['a', 'b']",
        "c": "['b']",
        "d": "['a', 'b', 'a']"
      },
      "correta": "a",
      "explicacao": "O código cria uma nova lista a cada chamada, então cada chamada devolve uma lista com apenas um item adicionado.",
      "fonte": "funcoes.parametros",
      "tipo": "saida",
      "codigo": {
        "linguagem": "python",
        "trecho": "def adicionar(item, lista=None):\n    if lista is None:\n        lista = []\n    lista.append(item)\n    return lista\n\nprint(adicionar('a'))\nprint(adicionar('b'))"
      },
      "alternativasCodigo": true
    },
    {
      "id": "python-int-05",
      "nivel": "intermediario",
      "pergunta": "Você precisa adicionar a fruta 'banana' no final da lista de frutas. Qual a forma correta de fazer isso?",
      "alternativas": {
        "a": "frutas.append('banana')",
        "b": "frutas.insert('banana')",
        "c": "frutas.append('banana', 0)",
        "d": "frutas += 'banana'"
      },
      "correta": "a",
      "explicacao": "append adiciona um item no fim da lista. insert exige a posição como primeiro argumento, append recebe um argumento só, e += com um texto acrescenta cada letra separada.",
      "fonte": "colecoes.listas"
    },
    {
      "id": "python-int-06",
      "nivel": "intermediario",
      "pergunta": "Você tem letras = ['a', 'b', 'c', 'd', 'e'] e quer obter ['b', 'c', 'd']. Qual fatia faz isso?",
      "alternativas": {
        "a": "letras[1:4]",
        "b": "letras[1:3]",
        "c": "letras[2:4]",
        "d": "letras[1,4]"
      },
      "correta": "a",
      "explicacao": "O fim da fatia é exclusivo: letras[1:4] pega os índices 1, 2 e 3. letras[1:3] para em 'c', letras[2:4] começa em 'c', e letras[1,4] com vírgula não é fatia e lança TypeError.",
      "fonte": "colecoes.fatiamento"
    },
    {
      "id": "python-int-07",
      "nivel": "intermediario",
      "pergunta": "Este código deveria imprimir a soma dos preços, 20. Qual é o defeito?",
      "alternativas": {
        "a": "O dicionário precisa de colchetes em vez de chaves.",
        "b": "sum só funciona com números inteiros escritos direto na chamada.",
        "c": "sum percorre as chaves do dicionário, que são textos; para somar os preços é preciso precos.values().",
        "d": "Falta inicializar a variável soma com 0."
      },
      "correta": "c",
      "explicacao": "Percorrer um dicionário entrega as chaves. sum tenta somar 'uva' e 'kiwi' e lança TypeError; sum(precos.values()) soma 8 e 12.",
      "fonte": "colecoes.dicionarios",
      "tipo": "erro",
      "codigo": {
        "linguagem": "python",
        "trecho": "precos = {'uva': 8, 'kiwi': 12}\nsoma = sum(precos)\nprint(soma)",
        "saidaEsperada": "20"
      }
    },
    {
      "id": "python-int-08",
      "nivel": "intermediario",
      "pergunta": "Qual alternativa completa a lacuna para aplicar 10% de desconto em cada preço?",
      "alternativas": {
        "a": "p * 0.9",
        "b": "p - 0.9",
        "c": "p * 0.1",
        "d": "n * 0.9"
      },
      "correta": "a",
      "explicacao": "Desconto de 10% é pagar 90% do preço: p * 0.9. p - 0.9 tira noventa centavos, p * 0.1 dá só o desconto, e n é o nome da fruta, não o preço.",
      "fonte": "colecoes.compreensoes",
      "tipo": "completar",
      "codigo": {
        "linguagem": "python",
        "trecho": "precos = {'uva': 8, 'kiwi': 12}\nitens = precos.items()\ncom_desconto = {n: ____ for n, p in itens}\nprint(com_desconto)"
      },
      "alternativasCodigo": true
    },
    {
      "id": "python-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está analisando um traceback e vê a mensagem `KeyError: 'itens'`. O que isso indica?",
      "alternativas": {
        "a": "Uma variável não foi definida corretamente.",
        "b": "Uma chave que não existe foi acessada em um dicionário.",
        "c": "Um tipo de dado não é compatível com a operação.",
        "d": "Um valor inválido foi passado para uma função."
      },
      "correta": "b",
      "explicacao": "A mensagem `KeyError` indica que uma chave que não existe foi acessada em um dicionário.",
      "fonte": "erros.traceback"
    },
    {
      "id": "python-int-10",
      "nivel": "intermediario",
      "pergunta": "Ao usar `try` e `except`, qual é a melhor prática ao capturar erros?",
      "alternativas": {
        "a": "Capturar todos os erros com um `except` genérico.",
        "b": "Capturar apenas os erros que você sabe tratar.",
        "c": "Usar `except` para ignorar todos os erros.",
        "d": "Capturar erros e imprimir mensagens de erro sem tratamento."
      },
      "correta": "b",
      "explicacao": "A melhor prática é capturar apenas os erros que você sabe tratar, para evitar engolir erros inesperados.",
      "fonte": "erros.try"
    },
    {
      "id": "python-int-11",
      "nivel": "intermediario",
      "pergunta": "Qual alternativa completa a lacuna para que a saída do código seja `90.0`?",
      "alternativas": {
        "a": "-10",
        "b": "150",
        "c": "10",
        "d": "0"
      },
      "correta": "c",
      "explicacao": "A lacuna deve ser preenchida com 10 para que o cálculo do desconto resulte em 90.0.",
      "fonte": "erros.raise",
      "tipo": "completar",
      "codigo": {
        "linguagem": "python",
        "trecho": "def desconto(valor, percentual):\n    if percentual < 0 or percentual > 100:\n        raise ValueError(f'fora de 0 a 100: {percentual}')\n    return valor * (1 - percentual / 100)\n\nprint(desconto(100, ____))"
      },
      "alternativasCodigo": true
    },
    {
      "id": "python-int-12",
      "nivel": "intermediario",
      "pergunta": "O que este código imprime?",
      "alternativas": {
        "a": "valores=[2, 4] soma=6\n3.0",
        "b": "valores=[2, 4] soma=6\nvalores=[2, 4] soma=6",
        "c": "valores=[2, 4] soma=6\n6",
        "d": "valores=[2, 4] soma=6\n2.0"
      },
      "correta": "a",
      "explicacao": "O código imprime a f-string com o valor de `valores` e `soma`, seguido do resultado da média.",
      "fonte": "erros.depurar",
      "tipo": "saida",
      "codigo": {
        "linguagem": "python",
        "trecho": "def media(valores):\n    soma = sum(valores)\n    print(f'{valores=} {soma=}')\n    return soma / len(valores)\n\nprint(media([2, 4]))"
      },
      "alternativasCodigo": true
    },
    {
      "id": "python-int-13",
      "nivel": "intermediario",
      "pergunta": "Você precisa converter um dicionário em uma string JSON. Qual alternativa completa a lacuna para que a saída seja a string JSON correta?",
      "alternativas": {
        "a": "json.dumps(usuario)",
        "b": "json.load(usuario)",
        "c": "json.dump(usuario)",
        "d": "json.loads(usuario)"
      },
      "correta": "a",
      "explicacao": "A função json.dumps converte um dicionário em uma string JSON. As outras opções não realizam essa conversão corretamente.",
      "fonte": "arquivos.json",
      "tipo": "completar",
      "codigo": {
        "linguagem": "python",
        "trecho": "import json\nusuario = {'nome': 'Ana', 'tags': ['py', 'web']}\ntexto = ____\nprint(texto)"
      },
      "alternativasCodigo": true
    },
    {
      "id": "python-int-14",
      "nivel": "intermediario",
      "pergunta": "Este código deveria ler o texto JSON e imprimir o nome Ana. Qual é o defeito?",
      "alternativas": {
        "a": "O texto usa aspas simples, que não valem em JSON; json.loads lança JSONDecodeError.",
        "b": "Deveria usar json.load, porque o dado é um texto.",
        "c": "json.loads devolve texto, então dados['nome'] não funciona.",
        "d": "Falta chamar json.dumps antes de json.loads."
      },
      "correta": "a",
      "explicacao": "JSON exige aspas duplas em chaves e textos. Com aspas simples o texto é malformado, e json.loads lança json.JSONDecodeError na linha 3; o texto certo seria {\"nome\": \"Ana\"}.",
      "fonte": "arquivos.json",
      "tipo": "erro",
      "codigo": {
        "linguagem": "python",
        "trecho": "import json\ntexto = \"{'nome': 'Ana'}\"\ndados = json.loads(texto)\nprint(dados['nome'])",
        "saidaEsperada": "Ana"
      }
    },
    {
      "id": "python-int-15",
      "nivel": "intermediario",
      "pergunta": "Qual é a prática recomendada ao dividir um programa em múltiplos arquivos em Python?",
      "alternativas": {
        "a": "Importar todos os módulos no início do arquivo principal.",
        "b": "Usar o guarda __name__ para evitar execução de código ao importar.",
        "c": "Colocar todo o código em um único arquivo para facilitar a leitura.",
        "d": "Renomear os módulos com nomes comuns para evitar confusão."
      },
      "correta": "b",
      "explicacao": "Usar o guarda __name__ é a prática recomendada para evitar que o código execute ao importar o módulo, permitindo que ele funcione tanto como um script quanto como uma biblioteca.",
      "fonte": "arquivos.modulos"
    },
    {
      "id": "python-av-01",
      "nivel": "avancado",
      "pergunta": "Qual método especial decide o texto que print mostra quando recebe um objeto da sua classe?",
      "alternativas": {
        "a": "__str__",
        "b": "__repr__",
        "c": "__len__",
        "d": "__eq__"
      },
      "correta": "a",
      "explicacao": "print chama __str__ para montar o texto do objeto. __repr__ é a representação para quem depura, usada quando __str__ não existe; __len__ e __eq__ atendem len e ==.",
      "fonte": "classes.especiais"
    },
    {
      "id": "python-av-02",
      "nivel": "avancado",
      "pergunta": "Ao criar uma classe que representa uma conta bancária, você deseja garantir que o saldo nunca fique negativo. Qual método deve ser implementado para validar essa condição ao realizar saques?",
      "alternativas": {
        "a": "sacar",
        "b": "depositar",
        "c": "__init__",
        "d": "resumo"
      },
      "correta": "a",
      "explicacao": "O método sacar deve ser implementado para garantir que a validação do saldo ocorra sempre que um saque for realizado.",
      "fonte": "classes.quando"
    },
    {
      "id": "python-av-03",
      "nivel": "avancado",
      "pergunta": "Este código deveria imprimir Ana: 0 (poupanca), reaproveitando o resumo da Conta. Qual é o defeito?",
      "alternativas": {
        "a": "O resumo de Poupanca não chama super().resumo(), então perde o titular e o saldo.",
        "b": "Poupanca precisa redefinir __init__ para ter titular.",
        "c": "O f-string da Conta está com a sintaxe errada.",
        "d": "Poupanca não herda de Conta."
      },
      "correta": "a",
      "explicacao": "Poupanca substitui resumo por inteiro. Para reaproveitar o texto da Conta, o método precisa devolver super().resumo() + ' (poupanca)'.",
      "fonte": "classes.heranca",
      "tipo": "erro",
      "codigo": {
        "linguagem": "python",
        "trecho": "class Conta:\n    def __init__(self, titular):\n        self.titular = titular\n        self.saldo = 0\n    def resumo(self):\n        return f'{self.titular}: {self.saldo}'\n\nclass Poupanca(Conta):\n    def resumo(self):\n        return ' (poupanca)'\n\nprint(Poupanca('Ana').resumo())",
        "saidaEsperada": "Ana: 0 (poupanca)"
      }
    },
    {
      "id": "python-av-04",
      "nivel": "avancado",
      "pergunta": "O que este código imprime?",
      "alternativas": {
        "a": "Produto(kit) 3",
        "b": "Produto: kit 3",
        "c": "Produto: kit\n3",
        "d": "Produto: kit"
      },
      "correta": "b",
      "explicacao": "print usa __str__ para o objeto e len chama __len__, que devolve 3. Com dois argumentos, print separa por espaço na mesma linha: Produto: kit 3.",
      "fonte": "classes.especiais",
      "tipo": "saida",
      "codigo": {
        "linguagem": "python",
        "trecho": "class Produto:\n    def __init__(self, nome, itens):\n        self.nome = nome\n        self.itens = itens\n    def __str__(self):\n        return f'Produto: {self.nome}'\n    def __len__(self):\n        return len(self.itens)\n\np = Produto('kit', ['a', 'b', 'c'])\nprint(p, len(p))"
      },
      "alternativasCodigo": true
    },
    {
      "id": "python-av-05",
      "nivel": "avancado",
      "pergunta": "Complete a lacuna para que a classe funcione corretamente com a função len().",
      "alternativas": {
        "a": "len(self.itens)",
        "b": "self.itens",
        "c": "len(self)",
        "d": "sum(self.itens)"
      },
      "correta": "a",
      "explicacao": "__len__ precisa devolver um inteiro: o tamanho da lista de itens. Devolver a própria lista lança TypeError, len(self) chama __len__ de novo sem fim, e sum tenta somar textos.",
      "fonte": "classes.especiais",
      "tipo": "completar",
      "codigo": {
        "linguagem": "python",
        "trecho": "class Produto:\n    def __init__(self, nome, itens):\n        self.nome = nome\n        self.itens = itens\n\n    def __len__(self):\n        return ____\n\np = Produto('kit', ['a', 'b', 'c'])\nprint(len(p))"
      },
      "alternativasCodigo": true
    },
    {
      "id": "python-av-06",
      "nivel": "avancado",
      "pergunta": "Qual palavra completa a lacuna para que contagem produza os números um por um, sob demanda?",
      "alternativas": {
        "a": "yield",
        "b": "return",
        "c": "yield from",
        "d": "print"
      },
      "correta": "a",
      "explicacao": "yield entrega um valor e pausa a função até o próximo pedido, o que faz de contagem um gerador. return encerraria na primeira volta, yield from exige algo iterável e print sem parênteses nem é sintaxe válida.",
      "fonte": "modernos.geradores",
      "tipo": "completar",
      "codigo": {
        "linguagem": "python",
        "trecho": "def contagem(limite):\n    n = 1\n    while n <= limite:\n        ____ n\n        n = n + 1\n\nprint(list(contagem(3)))"
      },
      "alternativasCodigo": true
    },
    {
      "id": "python-av-07",
      "nivel": "avancado",
      "pergunta": "Esta função deveria devolver 0.0 quando a lista vem vazia. Qual é o defeito?",
      "alternativas": {
        "a": "Com lista vazia, len(valores) é 0 e a divisão lança ZeroDivisionError; falta tratar a lista vazia.",
        "b": "A anotação list[float] faz Python recusar a lista vazia.",
        "c": "sum não aceita lista vazia.",
        "d": "O tipo de retorno float obriga uma conversão explícita."
      },
      "correta": "a",
      "explicacao": "sum([]) dá 0 e len([]) dá 0, então a conta vira 0 / 0 e lança ZeroDivisionError. As anotações não são verificadas em execução; a correção é devolver 0.0 antes da divisão quando a lista estiver vazia.",
      "fonte": "modernos.tipos",
      "tipo": "erro",
      "codigo": {
        "linguagem": "python",
        "trecho": "def media(valores: list[float]) -> float:\n    return sum(valores) / len(valores)\n\nprint(media([]))",
        "saidaEsperada": "0.0"
      }
    },
    {
      "id": "python-av-08",
      "nivel": "avancado",
      "pergunta": "O que este código imprime?",
      "alternativas": {
        "a": "2\n4",
        "b": "2\n3\n4",
        "c": "1\n2\n3\n4",
        "d": "1\n2\n3"
      },
      "correta": "a",
      "explicacao": "O código imprime os números pares da lista, que são 2 e 4, um por linha.",
      "fonte": "modernos.geradores",
      "tipo": "saida",
      "codigo": {
        "linguagem": "python",
        "trecho": "def pares(lista):\n    for item in lista:\n        if item % 2 == 0:\n            yield item\n\nfor numero in pares([1, 2, 3, 4]):\n    print(numero)"
      },
      "alternativasCodigo": true
    },
    {
      "id": "python-av-09",
      "nivel": "avancado",
      "pergunta": "Qual é a principal vantagem de usar uma expressão geradora em vez de uma compreensão de lista?",
      "alternativas": {
        "a": "Ela consome menos memória, pois os valores são gerados sob demanda.",
        "b": "Ela permite que você armazene todos os valores gerados em uma lista.",
        "c": "Ela é mais rápida, pois calcula todos os valores de uma vez.",
        "d": "Ela permite a manipulação direta dos valores gerados."
      },
      "correta": "a",
      "explicacao": "A expressão geradora consome menos memória, pois os valores são gerados sob demanda, ao contrário de uma lista que armazena todos os valores de uma vez.",
      "fonte": "modernos.preguica"
    },
    {
      "id": "python-av-10",
      "nivel": "avancado",
      "pergunta": "Qual é a principal função das anotações de tipo (type hints) em Python?",
      "alternativas": {
        "a": "Elas garantem que o código não tenha erros de tipo em tempo de execução.",
        "b": "Elas ajudam a documentar o código e a melhorar a autocompletação em editores.",
        "c": "Elas alteram o comportamento do código em tempo de execução.",
        "d": "Elas são obrigatórias para todas as funções em Python."
      },
      "correta": "b",
      "explicacao": "As anotações de tipo ajudam a documentar o código e melhoram a autocompletação em editores, mas não garantem a correção de tipos em tempo de execução.",
      "fonte": "modernos.tipos"
    },
    {
      "id": "python-av-11",
      "nivel": "avancado",
      "pergunta": "Qual é a principal vantagem de usar dataclasses em Python?",
      "alternativas": {
        "a": "Elas permitem a criação de classes com métodos complexos de forma simplificada.",
        "b": "Elas geram automaticamente métodos como __init__, __repr__ e __eq__ a partir das anotações.",
        "c": "Elas obrigam a definição de todos os atributos da classe no momento da criação.",
        "d": "Elas permitem a criação de classes que não precisam de atributos."
      },
      "correta": "b",
      "explicacao": "As dataclasses geram automaticamente métodos como __init__, __repr__ e __eq__ a partir das anotações, facilitando a criação de classes que apenas armazenam dados.",
      "fonte": "modernos.dataclasses"
    },
    {
      "id": "python-av-12",
      "nivel": "avancado",
      "pergunta": "Você precisa somar os quadrados de uma lista enorme sem criar uma lista intermediária. Qual forma faz isso?",
      "alternativas": {
        "a": "sum(n * n for n in numeros)",
        "b": "sum([n * n for n in numeros])",
        "c": "sum(list(n * n for n in numeros))",
        "d": "[sum(n * n) for n in numeros]"
      },
      "correta": "a",
      "explicacao": "Com parênteses, a expressão geradora entrega um valor por vez direto ao sum. Os colchetes e o list montam a lista inteira antes, e a última forma chama sum sobre um número, o que lança TypeError.",
      "fonte": "modernos.preguica"
    },
    {
      "id": "python-av-13",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um gerenciador de tarefas em Python e precisa armazenar as tarefas em um arquivo JSON. Qual abordagem garante que o arquivo JSON seja atualizado corretamente após cada nova tarefa adicionada?",
      "alternativas": {
        "a": "Ler o arquivo JSON, adicionar a tarefa à lista em memória e sobrescrever o arquivo com a lista atualizada.",
        "b": "Adicionar a nova tarefa diretamente ao arquivo JSON sem ler seu conteúdo primeiro.",
        "c": "Criar uma nova lista com a tarefa e salvar como um novo arquivo JSON, mantendo o original inalterado.",
        "d": "Armazenar as tarefas em uma variável global e salvar o arquivo JSON apenas quando o programa for encerrado."
      },
      "correta": "a",
      "explicacao": "A opção correta garante que o arquivo JSON tenha a lista atualizada, evitando perda de dados e corrupção do arquivo.",
      "fonte": "projeto.cli"
    },
    {
      "id": "python-av-14",
      "nivel": "avancado",
      "pergunta": "Ao implementar o gerenciador de tarefas, você quer garantir que erros de leitura do arquivo JSON sejam tratados corretamente. Qual é a melhor prática para lidar com exceções ao abrir o arquivo?",
      "alternativas": {
        "a": "Usar um bloco try-except para capturar a exceção e exibir uma mensagem amigável ao usuário.",
        "b": "Ignorar qualquer erro e continuar a execução do programa normalmente.",
        "c": "Fechar o programa imediatamente ao detectar um erro de leitura do arquivo.",
        "d": "Criar um arquivo JSON vazio automaticamente se o arquivo original não puder ser lido."
      },
      "correta": "a",
      "explicacao": "Usar um bloco try-except permite que você trate erros de forma controlada, melhorando a experiência do usuário.",
      "fonte": "projeto.cli"
    },
    {
      "id": "python-av-15",
      "nivel": "avancado",
      "pergunta": "Você terminou de desenvolver seu gerenciador de tarefas e deseja publicá-lo no GitHub. Qual é a prática recomendada para preparar seu repositório antes da publicação?",
      "alternativas": {
        "a": "Adicionar um arquivo README detalhando como instalar e usar o gerenciador de tarefas.",
        "b": "Publicar o código sem documentação, pois o código é autoexplicativo.",
        "c": "Incluir apenas os arquivos de código, sem qualquer informação adicional sobre o projeto.",
        "d": "Criar um arquivo de licença, mas não se preocupar com a descrição do projeto."
      },
      "correta": "a",
      "explicacao": "Um arquivo README é essencial para ajudar outros usuários a entenderem como usar seu projeto, tornando-o mais acessível.",
      "fonte": "projeto.cli"
    }
  ]
};

export default pool;
