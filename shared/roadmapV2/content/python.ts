// TODO(Ana): revisao editorial completa desta trilha (segunda trilha de
// linguagem da plataforma; titulos, descricoes e todo o conteudo longo
// precisam de revisao de copy e de codigo).
import type { RoadmapV2 } from "../types";

export const python: RoadmapV2 = {
  slug: "python",
  area: "linguagem",
  kind: "linguagem",
  codeLanguages: ["python"],
  // TODO(Ana): titulo da trilha
  title: "Python do Zero",
  level: "Iniciante",
  // TODO(Ana): descricao da trilha
  description:
    "Do primeiro print no terminal até classes, geradores e arquivos, com a linguagem que virou a porta de entrada de dados, automação e web. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "comeco",
      title: "Preparando o terreno",
      level: "iniciante",
      description:
        "O que é Python, onde ele vive, como instalar e como rodar o primeiro arquivo no seu computador.",
      children: [
        {
          id: "comeco.oque",
          title: "O que é Python e onde ele vive",
          description:
            "Uma linguagem feita pra ser lida, que hoje roda em scripts, análise de dados, automação e servidores web.",
          content:
            "Python é uma linguagem de programação desenhada pra ser lida por gente antes de ser executada por máquina. Um programa em Python parece uma lista de instruções em inglês simples, com pouca pontuação, e é por isso que ela virou a primeira linguagem de tanta gente e a linguagem principal de tanta área.\n\nO motivo de existir: automatizar o que é repetitivo e chato, sem exigir que você escreva um programa inteiro só pra começar. Renomear 300 arquivos, cruzar duas planilhas, baixar dados de um site, treinar um modelo, responder uma requisição web. Cada uma dessas tarefas tem uma biblioteca pronta em Python e um punhado de linhas suas em volta.\n\nO modelo mental que vale carregar: Python é a linguagem, e o **interpretador** é o programa que lê o seu arquivo e o executa, linha a linha, de cima pra baixo. Você instala o interpretador uma vez e a partir daí todo arquivo `.py` é um programa pronto pra rodar com um comando.\n\nOnde ele vive hoje: scripts de automação no seu computador, notebooks de análise de dados, back-ends web com Django e FastAPI, pipelines de dados e quase tudo que envolve inteligência artificial. Nesta trilha o foco é a linguagem em si, no terminal; as áreas aparecem no fim, no passo sobre o ecossistema.\n\nVocê domina este passo quando consegue explicar a diferença entre a linguagem e o interpretador, e citar três tipos de trabalho em que Python é a ferramenta comum.",
          resources: [
            {
              label: "Tutorial oficial do Python (pt-BR)",
              url: "https://docs.python.org/pt-br/3/tutorial/index.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "comeco.instalar",
          title: "Instalar o Python e o editor",
          description:
            "O interpretador vindo de python.org, o comando python3 e o VS Code com a extensão certa.",
          content:
            "Antes do primeiro programa você precisa do interpretador instalado e de um editor que entenda Python. São dois programas, e vale saber o papel de cada um.\n\nO interpretador vem de python.org, na página de downloads, sempre na versão 3 mais recente. No Windows, marque a opção de adicionar o Python ao PATH durante a instalação; sem isso o terminal não encontra o comando. No macOS e no Linux costuma existir um Python do sistema, mas instale o seu mesmo assim, pra não depender de uma versão antiga que o sistema usa por dentro.\n\nA prova de que deu certo é um comando no terminal:\n\n```bash\npython3 --version\n```\n\nSe aparecer algo como `Python 3.12.3`, está pronto. Em algumas máquinas Windows o comando é `python` ou `py`; nesta trilha os exemplos usam `python3`, e você troca pelo que funciona na sua.\n\nO editor recomendado é o VS Code com a extensão Python, da Microsoft. Ela colore o código, aponta erro de sintaxe enquanto você digita, formata e traz o depurador que a seção de erros e depuração usa. Instale também a extensão Pylance, que ela sugere, pra ter as dicas de tipo dos passos mais adiante.\n\nO hábito: uma pasta só pra trilha, por exemplo `estudos-python`, aberta no VS Code, com um arquivo por conceito. Você domina este passo quando `python3 --version` responde no seu terminal e o VS Code abre um arquivo `.py` com a extensão ativa.",
          resources: [
            {
              label: "Configuração e uso do Python (pt-BR)",
              url: "https://docs.python.org/pt-br/3/using/index.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "comeco.primeiro",
          title: "Rodar o primeiro arquivo",
          description:
            "Um arquivo .py, o comando python3 e a primeira saída no terminal: o ciclo que se repete a trilha inteira.",
          content:
            "Um programa em Python é um arquivo de texto com a extensão `.py`. Escrever, salvar e rodar com `python3` é o ciclo que você vai repetir centenas de vezes, então vale fazer do jeito certo desde o primeiro.\n\nNa pasta da trilha, crie um arquivo `ola.py` com uma única linha:\n\n```python\nprint('Olá, Python!')  # Olá, Python!\n```\n\nNo terminal, dentro da pasta, rode `python3 ola.py`. O texto aparece na tela. `print` é a função que escreve algo na saída; nesta trilha, sempre que um bloco mostrar um comentário depois de um `print`, aquele comentário é o que apareceu no terminal de verdade, executado antes de entrar aqui.\n\nO modelo mental: o interpretador lê o arquivo de cima pra baixo e executa cada instrução na ordem. Sem função principal obrigatória, sem cerimônia. Duas linhas rodam em sequência, e a segunda só acontece depois da primeira:\n\n```python\nprint('primeira')  # primeira\nprint('segunda')  # segunda\n```\n\nRepare que não há ponto e vírgula nem chaves: a quebra de linha encerra a instrução. O passo sobre indentação explica o que substitui as chaves, e a seção de erros e depuração mostra o que o interpretador imprime quando uma linha falha.\n\nO hábito que fica: cada conceito novo da trilha ganha um arquivo pequeno seu. Não copie e cole o exemplo; digite, rode, mude um detalhe e rode de novo. Você domina este passo quando cria um arquivo, roda com `python3` e prevê o que vai aparecer antes de apertar Enter.",
        },
        {
          id: "comeco.repl",
          title: "O REPL: o laboratório de bolso",
          description:
            "O modo interativo do interpretador, onde cada linha responde na hora, e quando usá-lo em vez de um arquivo.",
          content:
            "Rode `python3` no terminal sem nome de arquivo e o interpretador abre um modo interativo: um prompt `>>>` esperando uma linha por vez. Digite `2 + 2` e ele responde `4` na hora. Esse modo se chama REPL, de ler, avaliar, imprimir e repetir, e é o laboratório de bolso da linguagem.\n\nEle existe pra dois usos. O primeiro é experimentar: testar uma expressão, conferir o que um método devolve, checar uma ideia antes de escrever no arquivo. O segundo é explorar: dentro do REPL, `help(len)` mostra a documentação da função `len`, e `dir('texto')` lista tudo que uma string sabe fazer. Poucas linguagens entregam isso sem sair do terminal.\n\nUma diferença em relação ao arquivo: no REPL, uma expressão sozinha mostra o valor sem `print`. Digite `'ola'.upper()` e aparece `'OLA'`, com aspas, porque o REPL mostra a representação do valor, não o texto impresso. No arquivo rodado com `python3`, sem `print` nada aparece.\n\nO modelo mental: rápido, descartável, sem arquivo. O que você prova ali e quer guardar vai pro `.py`. Pra sair, `exit()` ou Ctrl+D.\n\nVocê domina este passo quando usa o REPL pra tirar uma dúvida sobre qualquer trecho desta trilha em menos de um minuto, sem criar arquivo.",
        },
        {
          id: "comeco.indentacao",
          title: "Indentação é sintaxe, e comentários",
          description:
            "Os espaços no começo da linha definem os blocos; o cerquilha comenta. As duas convenções que estão em todo arquivo.",
          content:
            "Em Python os blocos de código não são marcados com chaves: são marcados com **indentação**, o recuo no começo da linha. Isso não é estilo, é sintaxe. Um `if` termina com dois pontos, e tudo que vem recuado abaixo dele pertence a ele. A primeira linha que volta ao recuo anterior está fora do bloco.\n\n```python\nidade = 20\nif idade >= 18:\n    print('pode entrar')  # pode entrar\n    print('bem-vindo')  # bem-vindo\nprint('fim')  # fim\n```\n\nA convenção é quatro espaços por nível, e o VS Code com a extensão Python já faz isso quando você aperta Tab. Misturar tabulação com espaço, ou recuar uma linha a mais por engano, produz um erro chamado `IndentationError`, que é o primeiro erro que todo iniciante encontra. Quando aparecer, olhe o recuo da linha apontada e da linha acima.\n\nComentário começa com `#` e vai até o fim da linha; o interpretador ignora. O hábito certo é comentar o **porquê**, não o quê: `# soma dois numeros` acima de uma soma é ruído, `# o limite vem do contrato` é informação que o código não dá sozinho. Nesta trilha, o comentário depois de um `print` tem um papel especial: é a saída real daquela linha.\n\nVocê domina este passo quando lê um arquivo alheio e enxerga os blocos só pelo recuo, e escreve o seu com quatro espaços sem pensar.",
          resources: [
            {
              label: "PEP 8, o guia de estilo do Python",
              url: "https://peps.python.org/pep-0008/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "valores",
      title: "Valores e variáveis",
      level: "iniciante",
      description:
        "Os tipos básicos, os nomes que guardam valores, texto, números e o que acontece ao converter um no outro.",
      children: [
        {
          id: "valores.tipos",
          title: "Tipos básicos e type()",
          description:
            "int, float, str e bool: os quatro tipos que todo programa usa, e a função que revela o tipo de qualquer valor.",
          content:
            "Todo valor em Python tem um tipo, e o tipo decide o que dá pra fazer com ele. Quatro aparecem em todo programa: `int` pra número inteiro, `float` pra número com casas decimais, `str` pra texto e `bool` pra verdadeiro ou falso.\n\nA função `type` revela o tipo de qualquer valor, e é a primeira coisa a chamar quando um resultado sai diferente do esperado:\n\n```python\nprint(type(42))  # <class 'int'>\nprint(type(3.5))  # <class 'float'>\nprint(type('42'))  # <class 'str'>\nprint(type(True))  # <class 'bool'>\n```\n\nRepare no terceiro caso: `'42'` entre aspas é texto, não número. Ele parece um número na tela, mas não soma com outro número, e esse é o engano mais comum de quem começa. A diferença entre `42` e `'42'` é a diferença entre um valor com que se calcula e um valor que se exibe.\n\nO modelo mental: o tipo vem junto com o valor, não com o nome que o guarda. Uma mesma variável pode receber um inteiro agora e um texto depois, e o `type` responde pelo que está lá no momento. O passo de conversão mostra como transformar um tipo no outro de propósito, e o que acontece quando a transformação não é possível.\n\nVocê domina este passo quando olha pra um valor no código e diz o tipo dele sem rodar, e usa `type` pra confirmar quando um cálculo dá errado.",
          resources: [
            {
              label: "Tipos embutidos (pt-BR)",
              url: "https://docs.python.org/pt-br/3/library/stdtypes.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "valores.variaveis",
          title: "Variáveis e nomes",
          description:
            "Um nome apontando pra um valor, sem declaração de tipo, e as convenções de nome que o Python inteiro segue.",
          content:
            "Uma variável em Python é um nome apontando pra um valor. Não existe palavra-chave de declaração nem tipo escrito: `preco = 10` cria o nome `preco` e o faz apontar pro inteiro 10. Atribuir de novo faz o nome apontar pra outro valor, de qualquer tipo.\n\n```python\npreco = 10\npreco = preco + 5\nprint(preco)  # 15\nnome = 'Ana'\nnome = nome + ' Lima'\nprint(nome)  # Ana Lima\n```\n\nO modelo mental que evita confusão mais adiante: a variável é uma etiqueta, não uma caixa. Dois nomes podem apontar pro mesmo valor, e mudar o valor por um nome aparece pelo outro. Com números e textos isso não se nota, porque eles não mudam por dentro; com listas, na seção de coleções, faz toda a diferença.\n\nAs convenções de nome vêm do PEP 8 e o ecossistema inteiro as segue: letras minúsculas com sublinhado separando palavras (`total_pedido`, `nome_completo`), nunca começando com número, e constantes em maiúsculas (`LIMITE = 100`). Nomes descrevem o conteúdo: `n` e `x` só em contas curtas; `quantidade` e `preco_unitario` no resto. O leitor do seu código, inclusive você em três semanas, agradece.\n\nVocê domina este passo quando cria variáveis com nomes que explicam o que guardam e consegue prever o valor de cada uma depois de uma sequência de atribuições.",
        },
        {
          id: "valores.strings",
          title: "Strings e f-strings",
          description:
            "Texto entre aspas, os métodos mais usados e a forma moderna de montar texto com valores dentro.",
          content:
            "Uma string é texto entre aspas, simples ou duplas, tanto faz, desde que abram e fechem com o mesmo tipo. Strings sabem fazer muita coisa sozinhas: `upper` e `lower` trocam a caixa, `strip` tira espaços das pontas, `replace` troca um pedaço por outro, `split` quebra em lista e `len` conta os caracteres.\n\n```python\nnome = '  ana lima  '\nlimpo = nome.strip().title()\nprint(limpo)  # Ana Lima\nprint(len(limpo))  # 8\nprint(limpo.replace('Lima', 'Souza'))  # Ana Souza\n```\n\nRepare que `replace` devolve uma string nova: a original não muda. Strings são imutáveis em Python, e todo método delas devolve outro valor em vez de alterar o que já existe.\n\nPra montar texto com valores dentro, a forma moderna é a f-string: um `f` antes das aspas e as expressões entre chaves. Funciona com qualquer expressão, não só com nomes, e aceita formatação de casas decimais depois de dois pontos:\n\n```python\nproduto = 'caneta'\npreco = 2.5\nqtd = 3\ntotal = qtd * preco\nprint(f'{qtd} x {produto} = {total:.2f}')\n# 3 x caneta = 7.50\n```\n\nO `:.2f` fixa duas casas decimais, e é o que você quer sempre que imprimir dinheiro. Você domina este passo quando monta qualquer mensagem com f-string em vez de somar pedaços de texto, e escolhe o método certo de string sem consultar nada.",
          resources: [
            {
              label: "Métodos de string (pt-BR)",
              url: "https://docs.python.org/pt-br/3/library/stdtypes.html#string-methods",
              kind: "doc",
            },
          ],
        },
        {
          id: "valores.numeros",
          title: "Números: divisão inteira, resto e potência",
          description:
            "As duas divisões, o resto que responde se um número é par e o operador de potência.",
          content:
            "Python tem dois tipos de número no dia a dia, `int` e `float`, e as operações que você espera: soma, subtração, multiplicação. As três que surpreendem quem vem de outra linguagem, ou de nenhuma, são as divisões e a potência.\n\nA barra simples sempre devolve `float`, mesmo quando a conta é exata. A barra dupla faz divisão inteira, jogando fora a parte decimal. O `%` devolve o resto da divisão, e `**` eleva à potência:\n\n```python\nprint(7 / 2)  # 3.5\nprint(7 // 2)  # 3\nprint(7 % 2)  # 1\nprint(2 ** 10)  # 1024\nprint(10 / 5)  # 2.0\n```\n\nO resto é mais útil do que parece: `n % 2 == 0` responde se `n` é par, `n % 10` pega o último dígito, e `minutos % 60` converte minutos em resto de hora. Quando você vir `%` num código, pense em ciclo e sobra.\n\nUm detalhe que vale conhecer cedo: `float` guarda uma aproximação binária, então `0.1 + 0.2` dá `0.30000000000000004`. Pra dinheiro, ou você trabalha em centavos com `int`, ou usa o módulo `decimal` da biblioteca padrão, apresentado no passo de módulos. Não é defeito do Python; é como todo computador guarda decimais.\n\nVocê domina este passo quando escolhe entre `/` e `//` de propósito e usa `%` pra resolver um problema de ciclo sem pensar duas vezes.",
        },
        {
          id: "valores.conversao",
          title: "Conversão de tipos e o que falha",
          description:
            "int, float e str como funções de conversão, o que elas aceitam e o erro que lançam quando não dá.",
          content:
            "Python não converte tipos por conta própria quando a conversão é ambígua. Somar um texto com um número lança erro em vez de adivinhar; essa é uma escolha da linguagem, e o passo anterior sobre tipos já mostrou por quê. Quando você quer a conversão, pede explicitamente com `int`, `float` e `str`.\n\n```python\nidade = int('42')\nprint(idade + 1)  # 43\nprint(float('3.5') * 2)  # 7.0\nprint('Idade: ' + str(42))  # Idade: 42\nprint(int(3.99))  # 3\n```\n\nRepare no último caso: `int` de um `float` trunca, não arredonda. Pra arredondar existe `round`. E `int('3.5')` falha, porque o texto não representa um inteiro; passe por `float` primeiro.\n\nO que falha, falha alto. `int('abc')` lança `ValueError` com a mensagem `invalid literal for int() with base 10: 'abc'`, e o programa para ali. Isso vai acontecer toda vez que a entrada vier de fora: de um arquivo, de uma URL, do teclado. Por enquanto, garanta que o texto é um número antes de converter; a seção de erros e depuração mostra `try` e `except`, que é como se trata isso de verdade.\n\nA função `bool` tem sua própria regra: zero, texto vazio e coleções vazias são falsos, todo o resto é verdadeiro. O passo sobre operadores lógicos usa isso o tempo todo.\n\nVocê domina este passo quando converte de propósito, sabe o que `int` faz com decimais e prevê qual entrada vai lançar `ValueError`.",
          resources: [
            {
              label: "Funções embutidas (pt-BR)",
              url: "https://docs.python.org/pt-br/3/library/functions.html",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "fluxo",
      title: "Controle de fluxo",
      level: "iniciante",
      description:
        "Decidir com if, combinar condições e repetir com for e while: o que transforma uma lista de instruções em programa.",
      children: [
        {
          id: "fluxo.if",
          title: "if, elif e else",
          description:
            "A decisão em Python, com dois pontos e indentação, e a cadeia de alternativas que evita ifs aninhados.",
          content:
            "`if` executa um bloco só quando uma condição é verdadeira. A linha termina com dois pontos e o bloco vem recuado abaixo. `elif` acrescenta uma alternativa testada só se a anterior falhou, e `else` é o que sobra.\n\n```python\nnota = 7.5\nif nota >= 9:\n    conceito = 'A'\nelif nota >= 7:\n    conceito = 'B'\nelif nota >= 5:\n    conceito = 'C'\nelse:\n    conceito = 'D'\nprint(conceito)  # B\n```\n\nA ordem importa: as condições são testadas de cima pra baixo e a primeira verdadeira vence, então a mais restritiva vem primeiro. Se `nota >= 5` estivesse no topo, toda nota acima de 5 sairia como C.\n\nAs comparações são as esperadas: `==` para igualdade, `!=` para diferença, `<`, `<=`, `>`, `>=`. Um detalhe que Python faz e poucas linguagens fazem: comparação encadeada. `if 0 <= nota <= 10:` é válido e significa o que parece, sem precisar de `and`.\n\nO engano clássico é usar `=` no lugar de `==`. Em Python isso não compila: `if nota = 7:` lança `SyntaxError`, o que é melhor do que a alternativa silenciosa de outras linguagens.\n\nQuando um `if` só define um valor entre dois, existe a forma condicional em uma linha: `conceito = 'A' if nota >= 9 else 'B'`. Use quando couber confortavelmente numa linha; acima disso, o `if` completo lê melhor.\n\nVocê domina este passo quando escreve uma cadeia de três condições na ordem certa e prevê qual bloco roda para cada entrada.",
        },
        {
          id: "fluxo.logicos",
          title: "and, or, not e valores falsos",
          description:
            "Combinar condições com palavras em vez de símbolos, e quais valores Python considera falsos.",
          content:
            "Python escreve os operadores lógicos por extenso: `and`, `or` e `not`. `and` só é verdadeiro quando os dois lados são; `or` basta um; `not` inverte.\n\n```python\nidade = 20\ntem_ingresso = False\nprint(idade >= 18 and tem_ingresso)  # False\nprint(idade >= 18 or tem_ingresso)  # True\nprint(not tem_ingresso)  # True\n```\n\nOs dois avaliam em curto-circuito: em `a and b`, se `a` é falso, `b` nem é executado. Isso é o que permite escrever `if lista and lista[0] == 'x':` sem estourar em lista vazia, porque a segunda parte só roda quando a primeira garante que dá.\n\nA outra metade da história é o que Python considera falso sem ser `False`: o número zero, a string vazia, a lista vazia, o dicionário vazio e `None`. Todo o resto é verdadeiro. Isso torna idiomático escrever `if nome:` em vez de `if nome != '':`, e `if not itens:` para tratar coleção vazia.\n\n```python\nnome = ''\nitens = [1, 2]\nprint(bool(nome), bool(itens))  # False True\nprint(bool(0), bool([]))  # False False\nif not nome:\n    print('nome vazio')  # nome vazio\n```\n\nCuidado com um caso: `if quantidade:` trata zero como ausente. Quando zero é um valor legítimo, compare explicitamente com `is None`. Você domina este passo quando combina duas condições sem parênteses desnecessários e usa a regra de valores falsos para encurtar um `if` sem mudar o significado.",
        },
        {
          id: "fluxo.for",
          title: "for e range",
          description:
            "O laço que percorre uma sequência item a item, e a função que gera intervalos de números.",
          content:
            "O `for` de Python percorre uma sequência item a item. Não existe contador manual nem condição de parada: você diz sobre o que iterar e recebe cada elemento.\n\n```python\nfrutas = ['uva', 'kiwi', 'manga']\nfor fruta in frutas:\n    print(fruta)  # uva\n# kiwi\n# manga\n```\n\nQuando você precisa de números em vez de itens, `range` os gera. `range(5)` vai de 0 a 4; `range(1, 6)` vai de 1 a 5; `range(0, 10, 2)` pula de dois em dois. O fim é sempre exclusivo, e isso é proposital: `range(len(itens))` cobre exatamente os índices válidos.\n\n```python\ntotal = 0\nfor n in range(1, 5):\n    total = total + n\nprint(total)  # 10\nfrutas = ['uva', 'kiwi']\nprecos = [8, 12]\nfor i, f in enumerate(zip(frutas, precos)):\n    print(f'{i}: {f[0]} custa {f[1]}')  # 0: uva custa 8\n# 1: kiwi custa 12\n```\n\nDuas funções tornam o `for` bem mais expressivo, e as duas aparecem no fim do bloco acima. `enumerate` devolve índice e valor juntos, e é o jeito certo de ter a posição sem `range(len(...))`. `zip` percorre duas listas em paralelo, parando na mais curta.\n\nVocê domina este passo quando escolhe entre iterar direto, `enumerate` e `zip` conforme o que precisa, sem cair no `range(len(...))` por reflexo.",
          resources: [
            {
              label: "Estruturas de controle de fluxo (pt-BR)",
              url: "https://docs.python.org/pt-br/3/tutorial/controlflow.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "fluxo.while",
          title: "while e o laço que não acaba",
          description:
            "Repetir enquanto uma condição for verdadeira, e a disciplina que evita o laço infinito.",
          content:
            "`while` repete um bloco enquanto a condição for verdadeira. Diferente do `for`, ele não percorre nada: ele testa, executa e testa de novo. Use quando o número de repetições não é conhecido de antemão.\n\n```python\nsaldo = 100\nmeses = 0\nwhile saldo > 0:\n    saldo = saldo - 30\n    meses = meses + 1\nprint(meses)  # 4\nprint(saldo)  # -20\n```\n\nA regra de sobrevivência: alguma coisa dentro do bloco precisa mudar a condição. Se `saldo` nunca diminuísse, o programa rodaria pra sempre e você precisaria de Ctrl+C pra parar. Todo `while` que você escreve merece a pergunta 'o que aqui dentro faz isso acabar?' antes de rodar.\n\nO padrão mais comum na prática é o laço com saída explícita, útil quando a condição de parada só aparece no meio do bloco:\n\n```python\nfila = ['ana', 'bruno', 'sair', 'carla']\nfor nome in fila:\n    if nome == 'sair':\n        break\n    print(nome)  # ana\n# bruno\n```\n\n`break` abandona o laço imediatamente, e `continue` pula para a próxima repetição sem executar o resto do bloco. Os dois funcionam em `for` e em `while`, e ambos servem pra evitar aninhar mais um `if` dentro do laço.\n\nVocê domina este passo quando escolhe `for` ou `while` pelo que sabe sobre o número de repetições, e consegue apontar num `while` alheio a linha que garante o fim.",
        },
      ],
    },
    {
      id: "funcoes",
      title: "Funções",
      level: "intermediario",
      description:
        "Empacotar um trecho com nome, parâmetros e retorno, e as regras de escopo que decidem o que cada função enxerga.",
      children: [
        {
          id: "funcoes.def",
          title: "def e return",
          description:
            "A palavra que cria uma função, o que ela devolve quando você não diz nada e por que isso importa.",
          content:
            "Uma função empacota um trecho de código com um nome, pra ser chamada quantas vezes você quiser. `def` cria, os parâmetros entram entre parênteses e `return` devolve um valor a quem chamou.\n\n```python\ndef area_retangulo(largura, altura):\n    return largura * altura\n\ndef soma_errada(a, b):\n    a + b\n\nprint(area_retangulo(3, 4))  # 12\nprint(soma_errada(2, 3))  # None\n```\n\nO detalhe que gera mais confusão em quem começa está na segunda função: sem `return`, ela devolve `None`. Não devolve o último valor calculado nem nada parecido; devolve o nada explícito de Python.\n\nEsse `None` viaja em silêncio e estoura longe dali, quando alguém tenta somar ou comparar o resultado. Sempre que uma função deveria produzir um valor, confira se ela tem `return`.\n\n`return` também encerra a função na hora: nada abaixo dele executa. Isso permite tratar o caso especial cedo e deixar o corpo principal sem aninhamento:\n\n```python\ndef desconto(valor, cupom):\n    if not cupom:\n        return valor\n    return valor * 0.9\n\nprint(desconto(100, ''))  # 100\nprint(desconto(100, 'BLACK'))  # 90.0\n```\n\nO critério de quando criar uma função: quando o mesmo trecho aparece duas vezes, ou quando um bloco precisa de um comentário explicando o que faz. O nome da função substitui o comentário. Você domina este passo quando escreve funções curtas com um retorno claro e detecta um `None` inesperado como `return` faltando.",
        },
        {
          id: "funcoes.parametros",
          title: "Argumentos padrão e nomeados",
          description:
            "Valores padrão que tornam parâmetros opcionais, chamada por nome e a armadilha da lista como padrão.",
          content:
            "Um parâmetro pode ter valor padrão, e aí quem chama pode omiti-lo. O padrão vai depois do sinal de igual na definição, e parâmetros com padrão vêm sempre depois dos obrigatórios.\n\n```python\ndef saudacao(nome, prefixo='Olá'):\n    return f'{prefixo}, {nome}!'\n\nprint(saudacao('Ana'))  # Olá, Ana!\nprint(saudacao('Bruno', 'Bom dia'))  # Bom dia, Bruno!\nprint(saudacao(prefixo='E aí', nome='Carla'))\n# E aí, Carla!\n```\n\nA terceira chamada mostra argumentos nomeados: passando `nome=` e `prefixo=`, a ordem deixa de importar. Em funções com muitos parâmetros isso é o que torna a chamada legível, porque `criar_conta('ana', True, False, 30)` não diz nada e `criar_conta('ana', ativa=True, admin=False, limite=30)` diz tudo.\n\nA armadilha clássica: **nunca** use uma lista ou dicionário como valor padrão. O padrão é avaliado uma vez, quando a função é definida, e o mesmo objeto passa a ser compartilhado por todas as chamadas.\n\n```python\ndef adicionar(item, lista=None):\n    if lista is None:\n        lista = []\n    lista.append(item)\n    return lista\n\nprint(adicionar('a'))  # ['a']\nprint(adicionar('b'))  # ['b']\n```\n\nCom `lista=[]` no lugar de `None`, a segunda chamada devolveria `['a', 'b']`, o que quase nunca é o desejado. O padrão `None` e a criação dentro do corpo é o idioma correto, e você vai ver esse par em todo código Python maduro.\n\nVocê domina este passo quando dá padrão só ao que é de fato opcional e explica por que `lista=[]` como padrão é um defeito.",
        },
        {
          id: "funcoes.escopo",
          title: "Escopo: o que a função enxerga",
          description:
            "Variáveis locais nascem e morrem na chamada; as de fora são visíveis para leitura, não para atribuição.",
          content:
            "Toda variável criada dentro de uma função é local: existe durante a chamada e desaparece quando ela termina. De fora, ela não é visível.\n\n```python\ndef calcular():\n    total = 42\n    return total\n\nprint(calcular())  # 42\n```\n\nUma variável definida fora da função pode ser **lida** de dentro. O que não acontece por acidente é a escrita: atribuir a um nome dentro da função cria uma variável local nova, e a de fora fica intacta.\n\n```python\ncontador = 0\n\ndef incrementar():\n    contador = 10\n    return contador\n\nprint(incrementar())  # 10\nprint(contador)  # 0\n```\n\nEsse comportamento é proteção, não defeito: uma função não muda o mundo em volta sem que você peça. Quando você realmente precisa alterar a de fora, existe a palavra `global`, e o conselho é evitá-la. Uma função que recebe o que precisa por parâmetro e devolve o resultado por `return` é testável e reaproveitável; uma que depende de estado global não é.\n\nO caso que confunde: listas e dicionários recebidos por parâmetro **podem** ser alterados por dentro, e a alteração aparece fora. Isso não contradiz o escopo, porque o nome local aponta pro mesmo objeto de fora, e é o mesmo assunto de etiqueta e caixa do passo sobre variáveis. A seção de coleções volta a isso.\n\nVocê domina este passo quando prevê o valor de uma variável de fora depois de uma chamada, e escreve funções que dependem só dos parâmetros.",
        },
        {
          id: "funcoes.valor",
          title: "Funções como valor e lambda",
          description:
            "Passar uma função para outra função, e a forma curta de escrever uma função de uma linha.",
          content:
            "Em Python, uma função é um valor como outro qualquer: pode ser guardada numa variável, passada como argumento e devolvida por outra função. Repare que o nome sem parênteses é a função em si; com parênteses é a chamada.\n\n```python\ndef dobro(n):\n    return n * 2\n\noperacao = dobro\nprint(operacao(21))  # 42\nprint(list(map(dobro, [1, 2, 3])))  # [2, 4, 6]\n```\n\nEsse é o mecanismo por trás de `sorted`, `map` e `filter`. `sorted` aceita um parâmetro `key`, que é uma função aplicada a cada item pra decidir a ordem:\n\n```python\npessoas = [('Ana', 30), ('Bruno', 25)]\npor_idade = sorted(pessoas, key=lambda p: p[1])\nprint(por_idade)  # [('Bruno', 25), ('Ana', 30)]\n```\n\n`lambda` cria uma função anônima de uma expressão só. `lambda p: p[1]` é o mesmo que uma função que recebe `p` e devolve `p[1]`, escrita no lugar onde é usada. Ela existe pra casos curtos como esse; se a lógica passar de uma expressão, escreva um `def` com nome, que lê melhor e pode ser testado.\n\nA seção de coleções mostra que, para transformar listas, a compreensão costuma ser mais idiomática que `map` e `filter` em Python. Guarde `map` e `filter` para quando você já tem a função pronta com nome.\n\nVocê domina este passo quando passa uma função como argumento sem confundir com a chamada dela, e usa `lambda` só onde ela cabe numa linha.",
        },
        {
          id: "funcoes.docstring",
          title: "Docstrings: documentar por dentro",
          description:
            "O texto entre aspas triplas logo abaixo do def, que vira a documentação da função em qualquer ferramenta.",
          content:
            'Uma docstring é uma string entre aspas triplas na primeira linha do corpo da função. Ela não é comentário: fica guardada no próprio objeto da função e é o que `help()` mostra, o que o editor exibe ao passar o mouse e o que ferramentas de documentação leem.\n\n```python\ndef media(valores):\n    """Devolve a media aritmetica de uma lista de numeros.\n\n    Lista vazia devolve 0, para nunca dividir por zero.\n    """\n    if not valores:\n        return 0\n    return sum(valores) / len(valores)\n\nprint(media([2, 4, 6]))  # 4.0\nprimeira = media.__doc__.splitlines()[0]\nprint(primeira[:24])  # Devolve a media aritmeti\n```\n\nO que escrever: a primeira linha diz o que a função faz, em uma frase, no imperativo. Se houver mais, uma linha em branco e depois os detalhes que o código não mostra sozinho, como o comportamento em casos de borda ou o que ela lança quando a entrada é inválida.\n\nO que não escrever: repetição da assinatura. `# recebe valores e devolve a media` acima de `def media(valores)` não acrescenta nada. A docstring boa responde o que o leitor não consegue deduzir lendo o corpo em dez segundos.\n\nA convenção vale igual para módulos e classes, sempre na primeira linha do corpo. É um hábito barato que separa código de estudo de código que outra pessoa consegue usar.\n\nVocê domina este passo quando escreve a primeira linha da docstring antes do corpo da função, como forma de decidir o que ela deve fazer.',
          resources: [
            {
              label: "PEP 257, convenções de docstring",
              url: "https://peps.python.org/pep-0257/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "colecoes",
      title: "Listas, dicionários e companhia",
      level: "intermediario",
      description:
        "As estruturas que guardam vários valores: listas, dicionários, tuplas, conjuntos e as compreensões que os constroem.",
      children: [
        {
          id: "colecoes.listas",
          title: "Listas e seus métodos",
          description:
            "A coleção ordenada e mutável que aparece em todo programa, e os métodos que a alteram no lugar.",
          content:
            "Uma lista guarda vários valores em ordem, entre colchetes, e pode misturar tipos. É a estrutura mais usada da linguagem, e a primeira a aprender de verdade.\n\n```python\nfrutas = ['uva', 'kiwi']\nfrutas.append('manga')\nfrutas.insert(0, 'pera')\nprint(frutas)  # ['pera', 'uva', 'kiwi', 'manga']\nprint(len(frutas), frutas[0], frutas[-1])  # 4 pera manga\n```\n\nO índice começa em zero, e o índice negativo conta do fim: `-1` é o último. `append` acrescenta no fim, `insert` numa posição, `remove` tira pela primeira ocorrência do valor e `pop` tira pelo índice devolvendo o item.\n\nA diferença que precisa ficar clara: esses métodos alteram a lista **no lugar** e devolvem `None`. Escrever `frutas = frutas.append('x')` é um defeito comum, porque a variável passa a valer `None`.\n\n```python\nnumeros = [3, 1, 2]\nnumeros.sort()\nprint(numeros)  # [1, 2, 3]\nprint(sorted([3, 1, 2]))  # [1, 2, 3]\nprint(sum(numeros), max(numeros))  # 6 3\n```\n\n`sort` ordena a lista original; `sorted` deixa a original intacta e devolve outra. A mesma dupla existe em `reverse` e `reversed`. Quando você quer a lista de origem preservada, use a versão que devolve.\n\nO passo de escopo já avisou: uma lista passada para uma função pode ser alterada lá dentro, e a alteração aparece aqui fora. É consequência de a lista ser mutável e o nome ser uma etiqueta.\n\nVocê domina este passo quando escolhe entre `sort` e `sorted` de propósito e não atribui o retorno de um método que altera no lugar.",
          resources: [
            {
              label: "Estruturas de dados: listas (pt-BR)",
              url: "https://docs.python.org/pt-br/3/tutorial/datastructures.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "colecoes.fatiamento",
          title: "Fatiamento",
          description:
            "A notação de dois pontos que recorta parte de uma lista ou string, com início, fim e passo.",
          content:
            "Fatiar é recortar um pedaço de uma sequência com a notação `[inicio:fim]`. O início é incluído, o fim é excluído, e omitir qualquer um dos dois significa 'da ponta'.\n\n```python\nletras = ['a', 'b', 'c', 'd', 'e']\nprint(letras[1:3])  # ['b', 'c']\nprint(letras[:2])  # ['a', 'b']\nprint(letras[2:])  # ['c', 'd', 'e']\nprint(letras[-2:])  # ['d', 'e']\n```\n\nO fim exclusivo tem uma vantagem prática: `letras[:2]` e `letras[2:]` juntos dão a lista inteira, sem sobreposição nem buraco. Sempre que dividir uma sequência em duas, esse par é a forma segura.\n\nO terceiro número é o passo, e ele aceita valor negativo, o que dá a forma idiomática de inverter:\n\n```python\ntexto = 'python'\nprint(texto[::2])  # pto\nprint(texto[::-1])  # nohtyp\nprint(texto[1:4])  # yth\n```\n\nFatiar funciona igual em strings e em listas, com uma diferença: a fatia de uma lista é uma lista nova, e a de uma string é uma string nova. Em nenhum dos casos a original muda.\n\nUm uso frequente: `lista[:]` copia a lista inteira. Quando você quer passar uma lista para uma função sem correr o risco de ela alterar a sua, passar `lista[:]` resolve, e é mais curto que `list(lista)`.\n\nVocê domina este passo quando recorta qualquer pedaço sem contar nos dedos, e usa `[:]` conscientemente para copiar.",
        },
        {
          id: "colecoes.dicionarios",
          title: "Dicionários",
          description:
            "Pares de chave e valor, o acesso seguro com get e o laço que percorre os dois ao mesmo tempo.",
          content:
            "Um dicionário guarda pares de chave e valor, entre chaves. É a estrutura certa quando o dado tem nome em vez de posição: um usuário, uma configuração, uma contagem.\n\n```python\nusuario = {'nome': 'Ana', 'idade': 30}\nusuario['email'] = 'ana@exemplo.com'\nprint(usuario['nome'])  # Ana\nprint(len(usuario))  # 3\nprint('idade' in usuario)  # True\n```\n\nAcessar com colchetes uma chave que não existe lança `KeyError`. Quando a ausência é possível, `get` devolve `None` no lugar do erro, ou o padrão que você passar:\n\n```python\nusuario = {'nome': 'Ana'}\nprint(usuario.get('idade'))  # None\nprint(usuario.get('idade', 0))  # 0\nprecos = {'uva': 8, 'kiwi': 12}\nfor produto, preco in precos.items():\n    print(f'{produto}: {preco}')  # uva: 8\n# kiwi: 12\nprint(list(precos.keys()))  # ['uva', 'kiwi']\n```\n\nA escolha entre colchete e `get` é uma decisão de projeto: colchete quando a chave **tem** que estar lá e a falta é um defeito, `get` quando a falta é esperada. Pra percorrer, `items` devolve chave e valor juntos, como no fim do bloco, e é o laço que você mais vai escrever.\n\nA partir do Python 3.7 a ordem de inserção é preservada, então o laço sai na ordem em que as chaves entraram. Chaves precisam ser imutáveis: texto e número servem, lista não.\n\nVocê domina este passo quando escolhe entre lista e dicionário pelo formato do dado, e entre colchete e `get` pelo que a ausência significa.",
        },
        {
          id: "colecoes.tuplas",
          title: "Tuplas e conjuntos",
          description:
            "A sequência imutável que serve de registro e o conjunto que elimina duplicados e testa pertinência rápido.",
          content:
            "Uma tupla é como uma lista, mas imutável: criada entre parênteses, não aceita `append` nem alteração de item. Serve para agrupar valores que andam juntos e não devem mudar, como um par de coordenadas ou um registro devolvido por uma função.\n\n```python\nponto = (10, 20)\nx, y = ponto\nprint(x + y)  # 30\ndef divide(a, b):\n    return a // b, a % b\n\nquociente, resto = divide(17, 5)\nprint(quociente, resto)  # 3 2\n```\n\nA segunda parte mostra o motivo mais comum de encontrar tuplas: uma função que devolve mais de um valor devolve uma tupla, e quem chama a desempacota em nomes na mesma linha. Isso é idiomático em Python e evita inventar uma classe só para carregar dois campos.\n\nUm conjunto guarda valores únicos e sem ordem, criado com `set()` ou chaves com valores soltos. Ele elimina duplicados e responde pertinência muito mais rápido que uma lista longa:\n\n```python\ntags = ['py', 'web', 'py', 'api']\nunicas = set(tags)\nprint(len(unicas))  # 3\nprint('web' in unicas)  # True\nprint(sorted(unicas))  # ['api', 'py', 'web']\n```\n\nConjuntos também fazem as operações da matemática: `a | b` é união, `a & b` é interseção, `a - b` é diferença. Comparar duas listas de ids com `set(a) - set(b)` responde 'o que tem aqui e não tem lá' em uma linha.\n\nO preço é a ordem: um conjunto não a preserva, então ordene ao exibir. Você domina este passo quando escolhe tupla para registro fixo e conjunto para unicidade ou pertinência, em vez de usar lista para tudo.",
        },
        {
          id: "colecoes.compreensoes",
          title: "Compreensões de lista e dicionário",
          description:
            "A forma idiomática de construir uma coleção a partir de outra, transformando e filtrando numa linha.",
          content:
            "A compreensão de lista constrói uma lista nova a partir de um iterável, em uma linha. A forma é `[expressão for item in iterável]`, com um `if` opcional no fim para filtrar.\n\n```python\nnumeros = [1, 2, 3, 4, 5]\ndobros = [n * 2 for n in numeros]\npares = [n for n in numeros if n % 2 == 0]\nprint(dobros)  # [2, 4, 6, 8, 10]\nprint(pares)  # [2, 4]\n```\n\nO equivalente com `for` e `append` ocupa três linhas e diz a mesma coisa; a compreensão é o que um leitor de Python espera ver. O que ela substitui é justamente `map` e `filter`, apresentados na seção de funções: `[n * 2 for n in numeros]` lê melhor que `list(map(lambda n: n * 2, numeros))`.\n\nA mesma forma vale para dicionários, com chave e valor separados por dois pontos, e para conjuntos:\n\n```python\nprecos = {'uva': 8, 'kiwi': 12}\nitens = precos.items()\ncom_desconto = {n: p * 0.9 for n, p in itens}\nprint(com_desconto)  # {'uva': 7.2, 'kiwi': 10.8}\ninversao = {preco: nome for nome, preco in precos.items()}\nprint(inversao[8])  # uva\n```\n\nO limite é a legibilidade. Compreensão com dois `for` aninhados e um `if` composto vira charada; nesse ponto, o laço explícito é a escolha certa. A regra prática: se não cabe confortavelmente em uma linha, ou se você precisou pensar para escrever, escreva o `for`.\n\nVocê domina este passo quando converte um laço de três linhas com `append` em compreensão sem hesitar, e reconhece quando não fazer isso.",
          resources: [
            {
              label: "Compreensões de lista (pt-BR)",
              url: "https://docs.python.org/pt-br/3/tutorial/datastructures.html#list-comprehensions",
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
        "Ler o traceback, capturar o que dá pra tratar, lançar os seus erros e investigar com print e depurador.",
      children: [
        {
          id: "erros.traceback",
          title: "Ler um traceback",
          description:
            "O relatório que Python imprime quando algo falha, lido de baixo pra cima, e os erros mais comuns.",
          content:
            "Quando uma linha falha, Python imprime um traceback e encerra. Ele parece assustador e é, na verdade, o mapa exato do problema. A regra de leitura: **a última linha diz o quê, e a penúltima seção diz onde**.\n\nUm traceback típico tem esta forma:\n\n```text\nTraceback (most recent call last):\n  File \"app.py\", line 7, in <module>\n    total = calcular(pedido)\n  File \"app.py\", line 3, in calcular\n    return pedido['itens'] * 2\nKeyError: 'itens'\n```\n\nA última linha é o tipo e a mensagem: `KeyError: 'itens'`, ou seja, uma chave que não existe no dicionário. O bloco imediatamente acima é onde estourou: linha 3, dentro de `calcular`. Os blocos anteriores são o caminho de chamadas até ali, do mais antigo pro mais recente, e servem pra responder de onde veio o dado errado.\n\nOs tipos que você mais vai encontrar: `SyntaxError` e `IndentationError` antes de rodar qualquer linha; `NameError` quando o nome não existe (quase sempre um erro de digitação); `TypeError` quando a operação não serve para aquele tipo, como somar texto e número; `ValueError` quando o tipo está certo e o valor não, como `int('abc')`; `KeyError` e `IndexError` para chave e índice ausentes; `ZeroDivisionError` para divisão por zero.\n\nO hábito: leia o traceback antes de mudar o código. Ele já diz a linha e o motivo, e ler primeiro economiza as tentativas às cegas que quem começa costuma fazer.\n\nVocê domina este passo quando, diante de um traceback de dez linhas, aponta em segundos o arquivo, a linha e o tipo do erro.",
        },
        {
          id: "erros.try",
          title: "try, except, else e finally",
          description:
            "Capturar só o erro que você sabe tratar, e os dois blocos opcionais que completam a estrutura.",
          content:
            "`try` e `except` capturam um erro em vez de deixar o programa parar. O código que pode falhar vai no `try`; se algo lançar ali, a execução pula pro `except` correspondente ao tipo.\n\n```python\ndef ler_idade(texto):\n    try:\n        return int(texto)\n    except ValueError:\n        print(f'valor invalido: {texto}')\n        return 0\n\nprint(ler_idade('42'))  # 42\nprint(ler_idade('abc'))  # valor invalido: abc\n# 0\n```\n\nA regra de ouro: **capture o tipo específico e só o que você sabe tratar**. `except ValueError` diz que você previu aquela falha e tem uma resposta. Um `except` genérico, sem tipo, engole também os erros que você não previu, inclusive erros de digitação no seu próprio código, e transforma um defeito visível em comportamento estranho meses depois.\n\nDois blocos completam a estrutura. `else` roda quando o `try` terminou sem erro, e serve pra separar o que pode falhar do que só faz sentido no caminho feliz. `finally` roda sempre, com ou sem erro, e é onde se fecha o que foi aberto:\n\n```python\ndef dividir(a, b):\n    try:\n        resultado = a / b\n    except ZeroDivisionError:\n        return None\n    else:\n        return resultado\n    finally:\n        print('tentativa encerrada')  # tentativa encerrada\n\nprint(dividir(10, 2))  # 5.0\n```\n\nO passo sobre arquivos mostra o `with`, que resolve o caso mais comum de `finally` sem você escrever um. Você domina este passo quando captura o tipo exato do erro esperado e consegue justificar cada `except` que escreve.",
          resources: [
            {
              label: "Erros e exceções (pt-BR)",
              url: "https://docs.python.org/pt-br/3/tutorial/errors.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "erros.raise",
          title: "raise e exceções próprias",
          description:
            "Lançar um erro quando a entrada é inválida, e criar um tipo próprio quando quem chama precisa distinguir.",
          content:
            "Uma função que recebe entrada inválida deve falhar **cedo e alto**, em vez de seguir e quebrar dez linhas adiante sem contexto. `raise` lança um erro com a mensagem que você escrever.\n\n```python\ndef desconto(valor, percentual):\n    if percentual < 0 or percentual > 100:\n        raise ValueError(f'fora de 0 a 100: {percentual}')\n    return valor * (1 - percentual / 100)\n\nprint(desconto(100, 10))  # 90.0\n```\n\nEscolher o tipo certo é metade do trabalho: `ValueError` para valor fora do domínio, `TypeError` para tipo errado, `KeyError` para chave ausente. A mensagem deve dizer o que veio e o que se esperava; `raise ValueError('erro')` não ajuda ninguém.\n\nQuando quem chama precisa distinguir a sua falha das outras, crie um tipo próprio herdando de `Exception`. É uma classe de três linhas, e a seção seguinte explica a sintaxe de classe com calma:\n\n```python\nclass SaldoInsuficiente(Exception):\n    pass\n\ndef sacar(saldo, valor):\n    if valor > saldo:\n        raise SaldoInsuficiente(f'saldo {saldo} < {valor}')\n    return saldo - valor\n\ntry:\n    sacar(50, 80)\nexcept SaldoInsuficiente as erro:\n    print(f'recusado: {erro}')  # recusado: saldo 50 < 80\n```\n\nO `as erro` dá acesso ao objeto lançado, e imprimi-lo mostra a mensagem. Um tipo próprio permite que quem chama capture exatamente essa situação, sem interceptar `ValueError` de outras origens.\n\nVocê domina este passo quando valida a entrada no início da função e escolhe entre um tipo embutido e um próprio pelo que quem chama precisa distinguir.",
        },
        {
          id: "erros.depurar",
          title: "Depurar: print e o depurador",
          description:
            "A investigação com print bem colocado e o depurador do VS Code, que mostra tudo sem alterar o código.",
          content:
            "Depurar é responder duas perguntas: por onde o programa passou e quanto valia cada coisa naquele ponto. A ferramenta mais simples responde as duas.\n\nUm `print` bem colocado é investigação legítima, desde que traga nome e valor. `print(total)` sozinho, no meio de dez saídas, não diz de onde veio; `print(f'{total=}')` imprime `total=42`, com nome e valor, graças ao `=` dentro da f-string:\n\n```python\ndef media(valores):\n    soma = sum(valores)\n    print(f'{valores=} {soma=}')  # valores=[2, 4] soma=6\n    return soma / len(valores)\n\nprint(media([2, 4]))  # 3.0\n```\n\nO limite do `print` aparece rápido: para investigar de verdade você acaba adicionando e removendo dezenas deles. O depurador resolve isso sem tocar no código. No VS Code, clique na margem esquerda ao lado do número da linha para colocar um ponto de parada, aperte F5 e escolha rodar o arquivo Python. A execução para naquela linha e o painel da esquerda mostra o valor de todas as variáveis vivas.\n\nOs três controles que resolvem quase tudo: continuar até o próximo ponto de parada, executar a próxima linha e entrar dentro da função que a linha chama. Com eles você percorre o programa no ritmo do seu raciocínio.\n\nO hábito profissional: quando o `print` já respondeu, apague. Saída de depuração esquecida no código é ruído que sobrevive até produção. Você domina este passo quando usa `f'{x=}'` por reflexo e coloca um ponto de parada em vez de espalhar dez `print`.",
        },
      ],
    },
    {
      id: "arquivos",
      title: "Arquivos, JSON e módulos",
      level: "intermediario",
      description:
        "Ler e escrever no disco com segurança, converter dados para JSON e organizar o código em módulos e ambientes.",
      children: [
        {
          id: "arquivos.with",
          title: "Ler e escrever arquivos com with",
          description:
            "A função open, os modos de abertura e o bloco que garante o fechamento mesmo quando algo falha.",
          content:
            "Ler e escrever arquivo em Python começa em `open`, que recebe o caminho e o modo. Os modos que importam: `'r'` lê, `'w'` escreve do zero apagando o que havia, `'a'` acrescenta no fim. Sempre passe `encoding='utf-8'`, ou o programa se comporta diferente em cada sistema operacional.\n\nO bloco `with` é a forma correta de abrir: ele fecha o arquivo ao sair, mesmo se uma exceção estourar no meio. É o `finally` do passo anterior, pronto e sem cerimônia.\n\n```text\nwith open('notas.txt', 'w', encoding='utf-8') as arquivo:\n    arquivo.write('ana:9\\n')\n    arquivo.write('bruno:7\\n')\n\nwith open('notas.txt', encoding='utf-8') as arquivo:\n    for linha in arquivo:\n        nome, nota = linha.strip().split(':')\n        print(nome, nota)\n```\n\nSaída no terminal: `ana 9` e depois `bruno 7`.\n\nIterar o arquivo direto no `for` entrega uma linha por vez e não carrega tudo na memória, o que importa quando o arquivo é grande. Cada linha vem com a quebra no fim, e é por isso que `strip` aparece antes do `split`. Quando o arquivo é pequeno, `arquivo.read()` traz tudo como uma string só.\n\nOs erros a esperar: `FileNotFoundError` quando o caminho não existe em modo de leitura, e `PermissionError` quando a pasta não deixa escrever. Os dois se tratam com o `try` da seção anterior, e o `'w'` merece cuidado extra, porque ele apaga o conteúdo anterior sem perguntar.\n\nVocê domina este passo quando abre todo arquivo com `with` e `encoding`, e escolhe o modo pensando no que acontece com o que já estava lá.",
          resources: [
            {
              label: "Leitura e escrita de arquivos (pt-BR)",
              url: "https://docs.python.org/pt-br/3/tutorial/inputoutput.html#reading-and-writing-files",
              kind: "doc",
            },
          ],
        },
        {
          id: "arquivos.json",
          title: "JSON: dados que viajam",
          description:
            "O formato de troca da web e as quatro funções do módulo json, com e sem arquivo.",
          content:
            "JSON é o formato em que dados viajam entre programas: APIs devolvem JSON, arquivos de configuração usam JSON, e o módulo `json` da biblioteca padrão converte nos dois sentidos.\n\nAs quatro funções seguem um padrão de nome fácil: `dumps` e `loads` trabalham com **s**tring; `dump` e `load` trabalham com arquivo.\n\n```python\nimport json\n\nusuario = {'nome': 'Ana', 'tags': ['py', 'web']}\ntexto = json.dumps(usuario)\nprint(texto)  # {\"nome\": \"Ana\", \"tags\": [\"py\", \"web\"]}\nde_volta = json.loads(texto)\nprint(de_volta['tags'][0])  # py\nprint(type(de_volta))  # <class 'dict'>\n```\n\nRepare na conversão dos valores: o `True` de Python virou `true` em JSON, e voltou a `True` na leitura. `None` vira `null`, tupla vira lista, e a lista não volta como tupla. Chave de dicionário sempre vira texto.\n\nPara ler e gravar arquivo, `load` e `dump` recebem o objeto de arquivo aberto com `with`. Dois argumentos valem sempre ao gravar: `ensure_ascii=False`, para acentos saírem legíveis em vez de sequências de escape, e `indent=2`, para o arquivo ficar legível por humanos.\n\n```python\nimport json\n\ncompacto = json.dumps({'cidade': 'São Paulo'})\ncidade = {'cidade': 'São Paulo'}\nlegivel = json.dumps(cidade, ensure_ascii=False)\nprint(compacto)  # {\"cidade\": \"S\\u00e3o Paulo\"}\nprint(legivel)  # {\"cidade\": \"São Paulo\"}\n```\n\nTexto malformado faz `loads` lançar `json.JSONDecodeError`, que é uma subclasse de `ValueError`. Como o dado quase sempre vem de fora, esse é um caso legítimo de `try` e `except`.\n\nVocê domina este passo quando escolhe entre as quatro funções pelo sufixo e grava JSON com acento legível e indentado.",
          resources: [
            {
              label: "Módulo json (pt-BR)",
              url: "https://docs.python.org/pt-br/3/library/json.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "arquivos.modulos",
          title: "Módulos e import",
          description:
            "Cada arquivo .py é um módulo importável, e o guarda que separa o que roda do que é importado.",
          content:
            "Todo arquivo `.py` é um módulo, e um módulo pode ser importado por outro. É assim que um programa cresce sem virar um arquivo de mil linhas.\n\nCom `calculos.py` ao lado de `app.py`, há três formas de importar, e a diferença é o nome que fica disponível:\n\n```python\nimport math\nfrom math import sqrt\nfrom math import sqrt as raiz\n\nprint(math.sqrt(16))  # 4.0\nprint(sqrt(25))  # 5.0\nprint(raiz(9))  # 3.0\n```\n\n`import modulo` traz o módulo e você usa o prefixo; `from modulo import nome` traz o nome direto; `as` renomeia. O prefixo é preferível quando ajuda a lembrar de onde a função veio, e o `from` quando o nome já é claro sozinho.\n\nA armadilha ao dividir o próprio código: ao importar um módulo, Python **executa** o arquivo inteiro. Se ele tem código solto no nível superior, isso roda na hora do import. O guarda que resolve é uma linha que todo projeto Python tem:\n\n```python\ndef principal():\n    print('rodando como programa')\n\nif __name__ == '__main__':\n    principal()  # rodando como programa\n```\n\n`__name__` vale `'__main__'` quando o arquivo é executado direto e o nome do módulo quando ele é importado. Com esse guarda, o mesmo arquivo serve como programa e como biblioteca.\n\nUm cuidado do passo anterior: nomear seu arquivo `json.py` ou `math.py` faz o seu módulo esconder o da biblioteca padrão. Evite os nomes dos módulos que você importa.\n\nVocê domina este passo quando divide um programa em dois arquivos e usa o guarda `__main__` sem copiar de lugar nenhum.",
        },
        {
          id: "arquivos.pip",
          title: "pip e ambientes virtuais",
          description:
            "Instalar bibliotecas de terceiros e por que cada projeto merece o próprio ambiente isolado.",
          content:
            "A biblioteca padrão cobre muita coisa, e o resto vem do PyPI, o repositório público de pacotes Python. O `pip` é o programa que instala de lá.\n\nO problema que aparece na segunda semana: dois projetos que precisam de versões diferentes da mesma biblioteca. Instalar tudo no Python do sistema faz um projeto quebrar o outro. A solução é o **ambiente virtual**, uma pasta com uma cópia isolada do interpretador e dos pacotes daquele projeto.\n\n```bash\npython3 -m venv .venv\nsource .venv/bin/activate\npip install requests\npip freeze > requirements.txt\n```\n\nNo Windows, a ativação é `.venv\\Scripts\\activate`. Depois de ativado, o terminal mostra `(.venv)` no prompt e `pip install` passa a instalar ali dentro, sem tocar no sistema. `deactivate` sai.\n\n`pip freeze > requirements.txt` grava a lista exata do que está instalado, com versões. Quem clonar o projeto roda `pip install -r requirements.txt` e recebe o mesmo conjunto. É esse arquivo, e não a pasta `.venv`, que vai para o Git; a pasta entra no `.gitignore`.\n\nO hábito: um ambiente por projeto, criado antes da primeira instalação. Ferramentas mais novas como `uv` e `poetry` automatizam isso, mas todas resolvem o mesmo problema, e entender o `venv` é o que faz as outras fazerem sentido.\n\nVocê domina este passo quando cria e ativa um ambiente antes de instalar qualquer coisa, e sabe explicar por que a pasta do ambiente não vai para o repositório.",
          resources: [
            {
              label: "Instalando pacotes (Python Packaging)",
              url: "https://packaging.python.org/en/latest/tutorials/installing-packages/",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "classes",
      title: "Classes e objetos",
      level: "avancado",
      description:
        "Criar um tipo seu com dados e comportamento, e os métodos de nome especial que o interpretador chama sozinho.",
      children: [
        {
          id: "classes.definir",
          title: "Classes e __init__",
          description:
            "Agrupar dados e comportamento num tipo próprio, com o método que roda ao criar cada objeto.",
          content:
            "Uma classe cria um tipo seu, juntando dados e as funções que operam sobre eles. `__init__` é o método chamado automaticamente ao criar um objeto, e `self` é a referência ao objeto sendo criado.\n\n```python\nclass Conta:\n    def __init__(self, titular, saldo=0):\n        self.titular = titular\n        self.saldo = saldo\n\n    def depositar(self, valor):\n        self.saldo = self.saldo + valor\n        return self.saldo\n\nconta = Conta('Ana')\nconta.depositar(50)\nprint(conta.titular, conta.saldo)  # Ana 50\n```\n\nTrês pontos que confundem quem chega de outra linguagem. Primeiro: `self` é explícito, aparece como primeiro parâmetro de todo método e você **não** o passa na chamada; `conta.depositar(50)` já entrega o objeto como `self`. Segundo: os atributos nascem da atribuição em `__init__`, não de uma declaração no topo. Terceiro: não existe `private` de verdade; a convenção é prefixar com um sublinhado (`self._interno`) para sinalizar que é detalhe interno.\n\nQuando criar uma classe: quando dados e comportamento andam juntos e há mais de um objeto do mesmo formato vivo ao mesmo tempo. Um dicionário resolve o caso de só guardar campos; a classe ganha quando existe comportamento associado, como a validação de saldo do passo sobre `raise`.\n\nO exemplo acima é o mesmo `Conta` daquele passo, agora completo. A herança existe (`class Poupanca(Conta):`) e a orientação a objetos em Python vai bem mais longe, mas o que aparece na maioria dos códigos é exatamente isto: `__init__`, atributos e alguns métodos.\n\nVocê domina este passo quando escreve uma classe com `__init__` e dois métodos sem consultar exemplo, e explica o que `self` é.",
          resources: [
            {
              label: "Classes (pt-BR)",
              url: "https://docs.python.org/pt-br/3/tutorial/classes.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "classes.especiais",
          title: "Métodos especiais: __str__ e __len__",
          description:
            "Os métodos de nome duplo-sublinhado que integram seus objetos às funções embutidas da linguagem.",
          content:
            "Métodos com dois sublinhados de cada lado do nome não são chamados por você: são chamados pela linguagem. Eles são o que faz um objeto seu funcionar com as funções embutidas.\n\n`__str__` decide o que `print` mostra. Sem ele, um objeto sai como `<__main__.Conta object at 0x7f...>`, que não informa nada:\n\n```python\nclass Produto:\n    def __init__(self, nome, itens):\n        self.nome = nome\n        self.itens = itens\n\n    def __str__(self):\n        return f'Produto({self.nome})'\n\n    def __len__(self):\n        return len(self.itens)\n\np = Produto('kit', ['a', 'b', 'c'])\nprint(p, len(p))  # Produto(kit) 3\n```\n\n`__len__` faz `len()` funcionar, e de quebra decide a verdade do objeto: um `Produto` com zero itens passa a ser falso em `if p:`, pela regra de valores falsos da seção de fluxo.\n\nOs outros que aparecem com frequência: `__eq__` define o que `==` compara (sem ele, dois objetos com os mesmos campos são diferentes); `__repr__` é a representação para quem depura, e é o que o REPL mostra; `__iter__` permite usar o objeto num `for`.\n\nO princípio: em vez de inventar `imprimir()` e `tamanho()`, você implementa o método especial e o objeto passa a se comportar como os tipos da linguagem. É o que se chama de protocolo em Python, e é por isso que `len` funciona igual em lista, dicionário e string.\n\nVocê domina este passo quando implementa `__str__` em toda classe que vai ser impressa, e sabe qual método embutido cada um desses nomes atende.",
        },
        {
          id: "classes.heranca",
          title: "Herança, em uma dose só",
          description:
            "Uma classe que aproveita outra e troca só o que muda, e por que composição costuma ser a escolha melhor.",
          content:
            "Herança faz uma classe aproveitar tudo de outra e trocar só o que muda. A classe nova recebe a de origem entre parênteses, e `super()` alcança a versão original de um método que ela substituiu.\n\n```python\nclass Conta:\n    def __init__(self, titular):\n        self.titular = titular\n        self.saldo = 0\n\n    def resumo(self):\n        return f'{self.titular}: {self.saldo}'\n\nclass Poupanca(Conta):\n    def resumo(self):\n        return super().resumo() + ' (poupanca)'\n\nprint(Poupanca('Ana').resumo())  # Ana: 0 (poupanca)\n```\n\n`Poupanca` não redefine `__init__` nem `titular`: herda tudo e substitui apenas `resumo`. Esse é o uso que compensa, quando a classe nova **é** um tipo especial da anterior e a frase 'toda poupança é uma conta' descreve a realidade.\n\nO uso que não compensa é herdar só para reaproveitar código. Uma classe que herda de outra fica presa a cada mudança dela, e cadeias de três ou quatro níveis viram o tipo de código em que ninguém acha onde um método foi definido. A alternativa é composição: a classe guarda um objeto da outra num atributo e chama o que precisa. Menos acoplamento, e o leitor enxerga a dependência.\n\nO passo sobre exceções próprias já usou herança sem alarde: `class SaldoInsuficiente(Exception)` é exatamente isso, e é o caso em que ela é obrigatória, porque o `except` funciona por tipo.\n\nVocê domina este passo quando escolhe entre herdar e compor pela pergunta 'a nova classe É um caso especial da outra?'.",
        },
        {
          id: "classes.quando",
          title: "Quando classe, quando dicionário, quando função",
          description:
            "O critério de decisão que evita tanto o programa sem estrutura quanto a classe que só embrulha um dicionário.",
          content:
            "Nem todo dado precisa de classe, e nem toda função precisa virar método. Três perguntas resolvem quase todos os casos.\n\nA primeira: **existe comportamento junto do dado?** Se o que você tem é um registro de campos que alguém lê e grava, um dicionário resolve, e a seção de coleções já mostrou como. `{'nome': 'Ana', 'saldo': 0}` não fica melhor virando classe se ninguém faz nada com ele além de ler.\n\nA segunda: **existe invariante a proteger?** Uma conta cujo saldo nunca pode ficar negativo tem uma regra que precisa valer em toda alteração. Colocar essa regra dentro de um método `sacar` garante que todo caminho passe por ela; espalhada pelos chamadores, ela some no primeiro que esquecer. É o mesmo raciocínio de validar dentro da função, do passo sobre `raise`.\n\nA terceira: **quantos objetos do mesmo formato existem ao mesmo tempo?** Um, e provavelmente você quer só funções e um módulo. Muitos, com estado próprio cada um, e a classe se paga.\n\nQuando o dado é um registro com poucos campos e nenhuma regra, existe um meio-termo que a próxima seção apresenta: `dataclass`, que dá um tipo com nome sem o `__init__` escrito à mão.\n\nVocê domina este passo quando consegue justificar, em uma frase, por que aquele dado virou classe em vez de dicionário.",
        },
      ],
    },
    {
      id: "modernos",
      title: "Geradores e tipagem",
      level: "avancado",
      description:
        "Produzir valores sob demanda em vez de montar listas, e anotar tipos para o editor e para quem lê.",
      children: [
        {
          id: "modernos.iteradores",
          title: "Iteradores: o que o for faz por dentro",
          description:
            "O protocolo de duas funções que todo for usa, e o motivo de o mesmo laço servir a lista, string, dicionário e arquivo.",
          content:
            "O `for` da seção de fluxo não sabe nada sobre listas. Ele conhece um protocolo de duas funções, e qualquer objeto que as tenha funciona nele. Isso explica por que o mesmo laço percorre lista, string, dicionário e arquivo aberto sem nenhuma adaptação.\n\n`iter` pede ao objeto um **iterador**, e `next` pede o próximo valor a esse iterador. Quando acaba, `next` lança `StopIteration`, e o `for` captura essa exceção para encerrar em silêncio.\n\n```python\nletras = ['a', 'b']\nit = iter(letras)\nprint(next(it))  # a\nprint(next(it))  # b\n```\n\nUma terceira chamada de `next` lançaria `StopIteration`. O `for` está fazendo exatamente isso a cada volta, com o `try` embutido.\n\nO detalhe que importa na prática: o iterador guarda a posição e **avança só para a frente**. Depois de esgotado, ele não volta ao início; você pede outro com `iter`. Uma lista pode ser percorrida quantas vezes você quiser porque cada `for` cria um iterador novo a partir dela.\n\nÉ o mesmo protocolo do método `__iter__` que a seção anterior citou entre os métodos especiais: implementá-lo faz um objeto seu funcionar num `for`, sem que ele precise ser uma lista.\n\nVocê domina este passo quando explica o que acontece entre duas voltas de um `for` e por que um iterador esgotado não recomeça.",
          resources: [
            {
              label: "Iteradores (pt-BR)",
              url: "https://docs.python.org/pt-br/3/tutorial/classes.html#iterators",
              kind: "doc",
            },
          ],
        },
        {
          id: "modernos.geradores",
          title: "Geradores: funções que pausam com yield",
          description:
            "Produzir valores sob demanda com yield, em vez de montar uma lista inteira na memória.",
          content:
            "Um gerador é uma função que produz valores um por um, sob demanda. Onde uma função normal usa `return` e acaba, o gerador usa `yield` e **pausa**, guardando onde parou até pedirem o próximo valor.\n\n```python\ndef contagem(limite):\n    n = 1\n    while n <= limite:\n        yield n\n        n = n + 1\n\nfor numero in contagem(3):\n    print(numero)  # 1\n# 2\n# 3\nprint(list(contagem(4)))  # [1, 2, 3, 4]\n```\n\nA diferença que importa é memória. Uma função que devolve uma lista com um milhão de itens ocupa a memória do milhão inteiro; o gerador ocupa a de um item por vez. Ler um arquivo de log de dois gigabytes, linha a linha, só é possível assim, e é exatamente o que o `for linha in arquivo` do passo de arquivos faz por dentro.\n\nPor dentro, o gerador é o iterador do passo anterior: cada `next` roda o corpo até o próximo `yield` e pausa ali.\n\n```python\ndef pares(lista):\n    for item in lista:\n        if item % 2 == 0:\n            yield item\n\ng = pares([1, 2, 3, 4])\nprint(next(g))  # 2\nprint(next(g))  # 4\n```\n\nSem `yield`, isso exigiria uma classe com `__iter__` e `__next__` guardando a posição à mão.\n\nComo todo iterador, o gerador é consumido uma vez. Depois que o `for` chegou ao fim, ele está esgotado; para percorrer de novo, chame a função outra vez. E não existe `len()` de gerador, porque ele não sabe quantos itens virão.\n\n`range` é o exemplo mais familiar dessa ideia: `range(1000000)` não cria um milhão de números, cria um objeto que os produz quando pedidos, mas que, ao contrário do gerador, pode ser percorrido de novo.\n\nVocê domina este passo quando troca uma função que monta lista por um gerador em dados grandes, e sabe dizer por que não dá para percorrê-lo duas vezes.",
        },
        {
          id: "modernos.preguica",
          title: "Expressões geradoras e avaliação preguiçosa",
          description:
            "A compreensão com parênteses, que produz sob demanda, e a diferença que ela faz numa cadeia de transformações.",
          content:
            "Uma expressão geradora é a compreensão de lista da seção de coleções trocando colchetes por parênteses. A forma é a mesma; o que muda é quando o trabalho acontece.\n\n```python\nquadrados = (n * n for n in range(4))\nprint(sum(quadrados))  # 14\nprint(list(quadrados))  # []\n```\n\nA primeira linha não calcula nada: cria um gerador parado. `sum` puxa os valores um por um e chega a 14. A segunda impressão sai vazia porque o gerador foi consumido, exatamente como o passo anterior descreveu.\n\nO nome disso é avaliação preguiçosa: o valor só é produzido quando alguém pede. A vantagem aparece em cadeia. Filtrar um milhão de linhas com compreensões de lista cria uma lista nova a cada etapa; com expressões geradoras, cada linha atravessa a cadeia inteira sozinha e nenhuma lista intermediária existe.\n\nUm detalhe de escrita: quando a expressão geradora é o único argumento de uma função, os parênteses dela bastam. `sum(n * n for n in range(4))` é válido e é a forma que você mais vai ver.\n\nQuando usar cada uma: compreensão de lista quando você vai percorrer o resultado mais de uma vez ou precisa de `len`; expressão geradora quando o resultado é consumido uma vez só, principalmente por `sum`, `max`, `any` ou um `for`.\n\nVocê domina este passo quando escolhe entre colchetes e parênteses pensando em quantas vezes o resultado será percorrido.",
        },
        {
          id: "modernos.tipos",
          title: "Type hints: tipos para o editor e para quem lê",
          description:
            "Anotações que Python não verifica em execução, mas que o editor e o mypy usam para apontar erro antes de rodar.",
          content:
            "Type hints anotam o tipo esperado dos parâmetros e do retorno. Python **não** os verifica em execução: o programa roda igual com o tipo errado. Quem os usa é o editor, o Pylance e ferramentas como o mypy, que apontam a incompatibilidade antes de você rodar.\n\n```python\ndef media(valores: list[float]) -> float:\n    if not valores:\n        return 0.0\n    return sum(valores) / len(valores)\n\nprint(media([2.0, 4.0]))  # 3.0\nprint(media([]))  # 0.0\n```\n\nA sintaxe: dois pontos depois do parâmetro, seta antes do retorno. Os tipos compostos usam colchetes (`list[str]`, `dict[str, int]`), e a barra vertical diz que o valor pode ser de mais de um tipo: `str | None` é o jeito moderno de anotar o que pode faltar.\n\nO ganho aparece em dois lugares. No editor, que passa a completar os métodos certos e a marcar de vermelho a chamada errada. E em quem lê a assinatura sem abrir o corpo: `def media(valores: list[float]) -> float` responde sozinha o que entra e o que sai, e substitui metade das docstrings que a seção de funções apresentou.\n\nOnde anotar: nas funções que outras partes do programa chamam. Dentro de um laço de três linhas, a anotação só faz ruído.\n\nVocê domina este passo quando anota a assinatura de uma função pública sem consultar nada, e sabe dizer o que acontece se o tipo passado não bater.",
          resources: [
            {
              label: "Módulo typing (pt-BR)",
              url: "https://docs.python.org/pt-br/3/library/typing.html",
              kind: "doc",
            },
          ],
        },
        {
          id: "modernos.dataclasses",
          title: "dataclasses: a classe de registro sem cerimônia",
          description:
            "Um decorador que escreve o __init__, o __repr__ e o __eq__ a partir dos campos anotados.",
          content:
            "Muita classe existe só para carregar campos. Escrever `__init__` atribuindo cinco atributos, `__repr__` para imprimir e `__eq__` para comparar é trabalho mecânico, e `dataclasses` faz esse trabalho a partir das anotações do passo anterior.\n\n```python\nfrom dataclasses import dataclass\n\n@dataclass\nclass Produto:\n    nome: str\n    preco: float\n    ativo: bool = True\n\np = Produto('caneta', 2.5)\nprint(p)  # Produto(nome='caneta', preco=2.5, ativo=True)\nprint(p == Produto('caneta', 2.5))  # True\n```\n\nO `@dataclass` acima da classe é um decorador: uma função que recebe a classe e devolve outra, com os métodos gerados. Os campos vêm das linhas anotadas, na ordem em que aparecem, e o valor depois do igual vira padrão, com a mesma regra dos argumentos padrão da seção de funções.\n\nO que você ganha em relação ao dicionário: um tipo com nome, campos que o editor conhece e igualdade por conteúdo, que a classe escrita à mão só tem se você implementar `__eq__`. O que você ganha em relação à classe manual: não escrever o óbvio, e não esquecer de atualizar a comparação quando um campo novo entra.\n\nÉ a resposta ao meio-termo que o passo sobre quando criar classe deixou em aberto: registro com nome e tipo, sem cerimônia.\n\nVocê domina este passo quando usa `dataclass` por padrão em classe que só guarda campos, e escreve `__init__` à mão apenas quando há lógica na construção.",
          resources: [
            {
              label: "Módulo dataclasses (pt-BR)",
              url: "https://docs.python.org/pt-br/3/library/dataclasses.html",
              kind: "doc",
            },
          ],
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
            "Um gerenciador de tarefas de linha de comando com Python e um arquivo JSON local, aplicando a trilha inteira.",
          project: "cli-tarefas-terminal",
        },
        {
          id: "projeto.caminhos",
          title: "Próximos caminhos",
          description:
            "Onde Python leva depois desta trilha: as trilhas de área que o usam e como escolher a sua.",
          content:
            "Python é a linguagem de mais áreas desta plataforma do que qualquer outra, e terminar esta trilha é o ponto de partida de várias. Com a linguagem assentada, a pergunta deixa de ser 'como escrevo isso' e passa a ser 'sobre o que quero trabalhar'.\n\nA trilha de **Dados** é a continuação mais direta: ela pega as listas, dicionários e compreensões daqui e as coloca sobre tabelas de verdade, com pandas e gráficos. A de **Análise de dados** segue o mesmo caminho pelo lado do negócio.\n\nA trilha de **Inteligência artificial** vai para modelos, e a de **Engenharia de dados** usa Python como cola entre bancos e filas, onde os geradores daqui aparecem em escala.\n\nA trilha de **Back-end**, escolhendo Python no seletor, leva a linguagem para o servidor: rotas HTTP, banco e autenticação com Django ou FastAPI.\n\nAs seções **Classes e objetos** e **Geradores e tipagem** são o que separa quem escreve script de quem escreve programa, e é o vocabulário que todo framework usa.\n\nAntes de qualquer uma, o projeto desta trilha: o gerenciador de tarefas no terminal usa listas, dicionários, JSON, funções, tratamento de erro e leitura de arquivo, e fica pronto sem nada que você não tenha visto aqui. Termine, publique no GitHub e leve como primeira peça do portfólio.\n\nVocê domina este passo, e a trilha, quando olha para uma ideia de programa e consegue dizer qual dessas trilhas ensina o que falta para construí-la.",
        },
      ],
    },
  ],
};
