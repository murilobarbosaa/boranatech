// TODO(Ana): revisao editorial completa desta trilha (primeira trilha de
// ferramenta da plataforma; titulos, descricoes, todo o conteudo longo e os
// blocos de terminal precisam de revisao de copy e de comando).
import type { RoadmapV2 } from "../types";

export const git: RoadmapV2 = {
  slug: "git",
  area: "ferramenta",
  kind: "ferramenta",
  codeLanguages: ["bash"],
  // TODO(Ana): titulo da trilha
  title: "Git do Zero",
  level: "Iniciante",
  // TODO(Ana): descricao da trilha
  description:
    "Do primeiro commit ao pull request, com o controle de versão que todo time de tecnologia usa: histórico, branches, conflitos, remotos e as ferramentas que salvam o dia. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Versionamento e o Git",
      level: "iniciante",
      description:
        "O problema que o controle de versão resolve, a ideia de commit como foto do projeto, a instalação e a configuração inicial.",
      children: [
        {
          id: "fundamentos.problema",
          title: "O problema que o Git resolve",
          description:
            "Arquivos chamados final-v2-agora-vai, trabalho sobrescrito e nenhuma forma de voltar atrás: o que existia antes do controle de versão.",
          content:
            "O Git é um sistema de controle de versão: um programa que guarda o histórico de um projeto, mudança por mudança, e deixa você voltar a qualquer ponto dele.\n\nO problema que ele resolve aparece cedo em qualquer projeto. Sem controle de versão, a cópia de segurança vira uma pasta `projeto-final`, depois `projeto-final-2`, depois `projeto-final-agora-vai`. Ninguém sabe qual é a versão boa, o que mudou entre elas nem por quê. Quando duas pessoas mexem no mesmo arquivo, a última a salvar apaga o trabalho da outra sem aviso.\n\nO controle de versão troca essa bagunça por um registro organizado. Cada mudança entra no histórico com autor, data e uma mensagem explicando o motivo. Você compara duas versões, descobre em que momento um erro apareceu e desfaz só aquela mudança, sem perder o resto.\n\nO Git faz isso de forma distribuída: cada pessoa tem o histórico inteiro no próprio computador, e não só a última versão. Dá pra trabalhar sem internet e sincronizar depois, e nenhum servidor sozinho guarda a única cópia do projeto.\n\nÉ por isso que o Git virou o padrão de mercado: praticamente toda vaga de tecnologia assume que você sabe usá-lo, do front-end à ciência de dados. Você domina este passo quando consegue explicar a um colega, sem jargão, o que se perde num projeto sem controle de versão.",
          resources: [
            {
              label: "Pro Git: Sobre controle de versão (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Primeiros-Passos-Sobre-Controle-de-Vers%c3%a3o",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.commits",
          title: "Commits: fotos do projeto inteiro",
          description:
            "O modelo mental que sustenta todo o resto: cada commit é uma foto completa do projeto, ligada à foto anterior.",
          content:
            "Um **commit** é uma foto do projeto inteiro num instante, guardada no histórico com uma mensagem que diz o que mudou e por quê.\n\nO modelo mental certo faz diferença aqui. Muita gente imagina que o Git guarda uma lista de diferenças, linha a linha. Na prática ele guarda fotos: cada commit registra o estado completo de todos os arquivos. Arquivo que não mudou não é copiado de novo; o Git só aponta para a versão que já tinha. O resultado é um histórico leve em que qualquer foto pode ser restaurada inteira.\n\nCada commit aponta para o anterior, o seu pai. O histórico é essa corrente de fotos, da mais nova até o primeiro commit do projeto. Quando mais adiante você criar branches, a corrente ganha galhos, mas a regra continua a mesma: cada foto sabe de onde veio.\n\nCada commit também tem um identificador, o **hash**: uma sequência de letras e números calculada a partir do conteúdo, como `a1b2c3d` na forma curta. O valor muda de commit para commit e de máquina para máquina, então nesta trilha os hashes mostrados são sempre de exemplo.\n\nEsse modelo explica comandos que parecem mágica mais adiante: voltar no tempo é só olhar uma foto antiga, e uma branch é só um nome apontando para uma foto. Você domina este passo quando descreve o histórico como uma corrente de fotos completas, e não como uma pilha de diferenças.",
          resources: [
            {
              label: "Pro Git: O que é Git? (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Primeiros-Passos-O-que-%c3%a9-Git%3F",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.instalar",
          title: "Instalar o Git e conferir a versão",
          description:
            "O Git vindo do site oficial, a prova no terminal e o idioma das mensagens.",
          content:
            "Antes do primeiro repositório, o Git precisa estar instalado e respondendo no terminal. No Windows, o instalador do site oficial traz o Git e o Git Bash, um terminal que aceita os mesmos comandos desta trilha. No macOS, o Git costuma vir com as ferramentas de linha de comando da Apple, que o próprio sistema oferece instalar na primeira vez que você digita `git`. No Linux, ele vem do gerenciador de pacotes da distribuição.\n\nA prova de que deu certo é um comando:\n\n```bash\n$ git --version\ngit version 2.43.0\n```\n\nO número varia com a instalação; qualquer versão 2.23 ou mais nova serve, porque é a partir dela que existem os comandos `switch` e `restore` que a trilha ensina.\n\nNos blocos desta trilha, a linha que começa com `$ ` é o comando que você digita, sem o `$`; as linhas sem esse sinal são a resposta do terminal. As respostas aparecem em inglês, que é como a maioria das mensagens aparece em tutoriais e buscas. Se o seu sistema estiver em português, o Git pode responder traduzido, e o sentido é o mesmo.\n\nO hábito que vale criar já: quando uma mensagem do Git parecer estranha, leia inteira antes de tentar outro comando. O Git costuma dizer na própria resposta qual é o próximo passo. Você domina este passo quando `git --version` responde no seu terminal.",
          resources: [
            {
              label: "Pro Git: Instalando o Git (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Primeiros-Passos-Instalando-o-Git",
              kind: "doc",
            },
          ],
        },
        {
          id: "fundamentos.config",
          title: "Configuração inicial: nome, e-mail e main",
          description:
            "Três configurações feitas uma vez por computador: quem assina os commits e o nome da branch inicial.",
          content:
            'Todo commit leva o nome e o e-mail de quem o fez, então o Git precisa saber quem você é antes do primeiro. A configuração é feita uma vez por computador:\n\n```bash\n$ git config --global user.name "Ana Souza"\n$ git config --global user.email "ana@exemplo.com"\n$ git config --global init.defaultBranch main\n```\n\nA opção `--global` grava no seu usuário, e vale para todo repositório daquela máquina. Use o mesmo e-mail da sua conta no GitHub, pra que os commits apareçam ligados ao seu perfil quando você publicar.\n\nA terceira linha define `main` como o nome da branch inicial de todo repositório novo. Versões antigas do Git usavam `master`, e você ainda vai encontrar esse nome em projetos e tutoriais mais velhos; o padrão atual das plataformas é `main`, e é o que esta trilha usa.\n\nPra conferir um valor, peça a chave sem passar o valor:\n\n```bash\n$ git config user.name\nAna Souza\n```\n\nConfiguração sem `--global` vale só para o repositório em que você está, e ganha da global. É útil quando o mesmo computador serve para projetos pessoais e do trabalho, cada um com o seu e-mail.\n\nVocê domina este passo quando `git config user.name` e `git config user.email` devolvem os seus dados, e sabe explicar a diferença entre configurar com e sem `--global`.',
          resources: [
            {
              label: "Pro Git: Configuração inicial do Git (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Primeiros-Passos-Configura%c3%a7%c3%a3o-inicial-do-Git",
              kind: "doc",
            },
            {
              label: "Referência do git config",
              url: "https://git-scm.com/docs/git-config",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "repositorio",
      title: "O primeiro repositório",
      level: "iniciante",
      description:
        "Criar um repositório, ler o status, escolher o que entra no próximo commit e gravar a foto, com o ciclo de três áreas que o Git usa o tempo todo.",
      children: [
        {
          id: "repositorio.init",
          title: "git init: um repositório novo",
          description:
            "Uma pasta comum vira repositório com um comando, e a pasta escondida .git passa a guardar todo o histórico.",
          content:
            "Um **repositório** é uma pasta de projeto cujo histórico o Git acompanha. Transformar uma pasta comum em repositório é um comando:\n\n```bash\n$ mkdir tarefas\n$ cd tarefas\n$ git init\n```\n\nO `git init` responde com uma linha começando por `Initialized empty Git repository in`, seguida do caminho da pasta na sua máquina, que varia de computador para computador.\n\nO que o comando faz é criar uma pasta escondida chamada `.git` dentro do projeto. É ali que mora o histórico inteiro: todos os commits, todas as branches, toda a configuração daquele repositório. Os seus arquivos continuam onde estavam; o Git só passou a observá-los.\n\nDuas consequências práticas. Primeiro, apagar a pasta `.git` apaga o histórico, e o projeto volta a ser uma pasta comum; nunca mexa nela à mão. Segundo, rodar `git init` dentro de uma pasta que já está dentro de outro repositório cria um repositório aninhado, fonte clássica de confusão. Um repositório por projeto, na pasta raiz do projeto.\n\nO `git init` é o começo de um projeto seu. Quando o projeto já existe em outro lugar, como no GitHub, o caminho é outro, o `git clone`, que aparece na seção Remotos. Você domina este passo quando cria um repositório numa pasta nova e sabe dizer onde o histórico dele fica guardado.",
          resources: [
            {
              label: "Pro Git: Obtendo um repositório Git (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Fundamentos-do-Git-Obtendo-um-Reposit%c3%b3rio-Git",
              kind: "doc",
            },
            {
              label: "Referência do git init",
              url: "https://git-scm.com/docs/git-init",
              kind: "doc",
            },
          ],
        },
        {
          id: "repositorio.status",
          title: "git status: onde está cada arquivo",
          description:
            "O comando que você mais vai digitar: a situação de cada arquivo em relação ao último commit.",
          content:
            "O `git status` responde a pergunta mais frequente de quem usa Git: o que mudou desde o último commit, e em que situação está cada arquivo. Num repositório que já tem commits e nenhuma alteração pendente, a resposta é curta:\n\n```bash\n$ git status\nOn branch main\nnothing to commit, working tree clean\n```\n\nA primeira linha diz em que branch você está; a segunda, que não há nada a gravar. Quando existem mudanças, o `git status` lista cada arquivo e ainda sugere os comandos para mexer nele, o que o torna o melhor professor de Git que existe.\n\nNo dia a dia, a forma curta mostra o mesmo em uma linha por arquivo:\n\n```bash\n$ git status --short\n M app.js\n?? notas.txt\n```\n\nO `M` indica um arquivo que o Git já acompanhava e que foi modificado. Os dois pontos de interrogação indicam um arquivo **não rastreado**: ele existe na pasta, mas nunca entrou num commit, e o Git não vai guardá-lo até você pedir. A posição da letra também conta, e o próximo passo explica por quê.\n\nO hábito: `git status` antes de todo `git add` e antes de todo `git commit`. Custa um segundo e evita gravar o arquivo errado. Você domina este passo quando lê a saída do `git status` e diz, para cada arquivo, se ele é novo, modificado ou está limpo.",
          resources: [
            {
              label: "Referência do git status",
              url: "https://git-scm.com/docs/git-status",
              kind: "doc",
            },
          ],
        },
        {
          id: "repositorio.areas",
          title: "Diretório de trabalho, stage e histórico",
          description:
            "As três áreas por onde toda mudança passa, e por que o Git separa escolher de gravar.",
          content:
            "Toda mudança no Git passa por três áreas, e entender essa viagem resolve metade das dúvidas de quem começa.\n\nO **diretório de trabalho** é a pasta que você vê e edita, com os arquivos como estão agora. A **área de stage** (também chamada de índice) é uma sala de espera: o que está ali vai entrar no próximo commit. O **histórico** é a corrente de commits já gravados.\n\nO caminho é sempre o mesmo: você edita no diretório de trabalho, escolhe com `git add` o que vai para o stage e grava o stage no histórico com `git commit`. A forma curta do `git status` mostra a viagem pela posição da letra:\n\n```bash\n$ git add app.js\n$ git status --short\nM  app.js\n```\n\nNo passo anterior o `M` estava na segunda coluna, significando modificado mas fora do stage. Depois do `git add`, ele foi para a primeira coluna: a mudança está na sala de espera, pronta para o commit.\n\nPor que existir essa sala de espera? Porque ela separa escolher de gravar. Você pode ter mexido em cinco arquivos por dois motivos diferentes e fazer dois commits, cada um contando uma história. Commit pequeno e com um motivo só é o que torna o histórico útil depois, quando alguém precisar entender ou desfazer uma mudança.\n\nVocê domina este passo quando descreve em que área está uma mudança olhando a coluna da letra no `git status --short`.",
          resources: [
            {
              label: "Pro Git: Gravando alterações no repositório (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Fundamentos-do-Git-Gravando-Altera%c3%a7%c3%b5es-no-Reposit%c3%b3rio",
              kind: "doc",
            },
          ],
        },
        {
          id: "repositorio.add",
          title: "git add: escolher o que entra no commit",
          description:
            "Mandar arquivos para o stage um a um, todos de uma vez ou só um pedaço de um arquivo.",
          content:
            "O `git add` coloca mudanças na área de stage, a sala de espera do próximo commit. Ele aceita um arquivo, vários, uma pasta ou o ponto, que significa tudo a partir da pasta atual:\n\n```bash\n$ git add README.md\n$ git add src/\n$ git add .\n```\n\nO `git add .` é o mais digitado e o mais perigoso, porque leva tudo: o arquivo que você queria, o arquivo de teste esquecido e, se não houver um `.gitignore`, a pasta de dependências inteira. Use-o depois de um `git status` que mostre só o que você espera.\n\nUm detalhe que pega muita gente: o `git add` guarda a versão do arquivo **naquele instante**. Se você editar o arquivo de novo depois do `add`, a nova edição fica fora do stage, e o `git status` mostra o mesmo arquivo nas duas situações ao mesmo tempo. A solução é rodar o `git add` de novo.\n\nPra escolher só uma parte de um arquivo, existe o modo interativo:\n\n```bash\n$ git add -p app.js\n```\n\nEle mostra cada trecho alterado e pergunta se entra ou não. É a ferramenta certa quando um arquivo tem duas mudanças sem relação e cada uma merece o seu commit.\n\nVocê domina este passo quando coloca no stage exatamente o que o próximo commit deve conter, e confere isso no `git status` antes de gravar.",
          resources: [
            {
              label: "Referência do git add",
              url: "https://git-scm.com/docs/git-add",
              kind: "doc",
            },
          ],
        },
        {
          id: "repositorio.commit",
          title: "git commit: gravar a foto",
          description:
            "O comando que transforma o stage num ponto permanente do histórico, com a mensagem que explica o motivo.",
          content:
            'O `git commit` pega tudo o que está no stage e grava como uma nova foto no histórico. A opção `-m` passa a mensagem direto na linha de comando:\n\n```bash\n$ git commit -m "Adiciona README"\n[main (root-commit) a1b2c3d] Adiciona README\n 1 file changed, 1 insertion(+)\n create mode 100644 README.md\n```\n\nA resposta conta o que aconteceu. Entre colchetes vêm a branch, a indicação `root-commit` (que só aparece no primeiro commit do repositório) e o hash curto, que varia a cada commit. Depois vem o resumo: quantos arquivos mudaram e quantas linhas entraram ou saíram. O `create mode` avisa que um arquivo novo passou a ser acompanhado.\n\nO commit grava o stage, não o diretório de trabalho. Mudança que você não adicionou fica de fora, mesmo que o arquivo esteja aberto no editor. Se o stage estiver vazio, o Git recusa e explica que não há nada a gravar.\n\nSem o `-m`, o Git abre um editor de texto para você escrever a mensagem. Na primeira vez isso assusta: se abrir o Vim, a saída é digitar `:wq` e Enter para salvar e sair. Configurar o editor que você já usa evita o susto.\n\nO ciclo que você vai repetir o resto da vida é este: editar, `git status`, `git add`, `git status` de novo, `git commit`. Você domina este passo quando faz esse ciclo sem consultar nada e lê a resposta do commit.',
          resources: [
            {
              label: "Referência do git commit",
              url: "https://git-scm.com/docs/git-commit",
              kind: "doc",
            },
          ],
        },
        {
          id: "repositorio.gitignore",
          title: ".gitignore: o que nunca entra",
          description:
            "Dependências, segredos e arquivos gerados ficam fora do histórico por uma lista escrita uma vez.",
          content:
            "Nem tudo que está na pasta do projeto deve ir para o histórico. Dependências baixadas, arquivos gerados pelo build, logs e, principalmente, arquivos com senhas e chaves ficam de fora. O `.gitignore` é o arquivo de texto, na raiz do repositório, que lista esses padrões:\n\n```text\nnode_modules/\n.env\n*.log\n```\n\nCada linha é um padrão: uma pasta inteira, um arquivo específico ou, com o asterisco, todo arquivo com aquela terminação. O próprio `.gitignore` entra no histórico, pra que todo mundo que trabalha no projeto ignore as mesmas coisas. Com esses padrões numa pasta que tem dependências e um `.env`, o status mostra só o que importa:\n\n```bash\n$ git status --short\n?? .gitignore\n```\n\nA regra que mais importa: o `.gitignore` só vale para arquivo que ainda não foi rastreado. Se um `.env` com senha entrou num commit, colocá-lo no `.gitignore` depois não o apaga do histórico, e quem tiver acesso ao repositório consegue lê-lo. Senha que vazou num commit tem que ser trocada, não só escondida. Por isso o `.gitignore` nasce junto com o repositório, antes do primeiro `git add .`.\n\nVocê domina este passo quando cria o `.gitignore` antes do primeiro commit de um projeto e sabe explicar por que ignorar depois não protege um segredo já gravado.",
          resources: [
            {
              label: "Referência do gitignore",
              url: "https://git-scm.com/docs/gitignore",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "historico",
      title: "Lendo o histórico",
      level: "iniciante",
      description:
        "Ver a corrente de commits, comparar versões e abrir um commit por dentro, com mensagens que fazem o histórico valer a pena.",
      children: [
        {
          id: "historico.log",
          title: "git log: a corrente de commits",
          description:
            "O histórico do mais novo para o mais antigo, na forma completa e na forma de uma linha por commit.",
          content:
            "O `git log` mostra o histórico, do commit mais novo para o mais antigo. Na forma completa, cada commit ocupa várias linhas com hash inteiro, autor, data e mensagem. No dia a dia, a forma de uma linha por commit é a mais útil:\n\n```bash\n$ git log --oneline\ne4f5a6b (HEAD -> main) Marca tarefa como feita\nc7d8e9f Lista as tarefas salvas\na1b2c3d Adiciona README\n```\n\nCada linha traz o hash curto e a mensagem. Os hashes aqui são de exemplo; no seu repositório serão outros. A marcação entre parênteses mostra onde estão os ponteiros: `HEAD -> main` diz que você está na branch `main` e que ela aponta para aquele commit. **HEAD** é o nome que o Git dá para o lugar em que você está agora.\n\nAlgumas variações resolvem perguntas comuns. `git log --oneline -5` mostra só os cinco últimos. `git log --oneline -- app.js` mostra só os commits que mexeram naquele arquivo. `git log --oneline --graph --all` desenha os galhos das branches, e vai ser útil na seção Branches.\n\nO log só é tão bom quanto as mensagens que estão nele. Uma corrente de commits chamados `ajustes` e `mais ajustes` não conta nada a ninguém, e o último passo desta seção trata disso.\n\nVocê domina este passo quando usa o `git log --oneline` para responder o que aconteceu no projeto nos últimos commits e em que commit você está.",
          resources: [
            {
              label: "Pro Git: Visualizando o histórico de commits (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Fundamentos-do-Git-Visualizando-o-Hist%c3%b3rico-de-Commits",
              kind: "doc",
            },
            {
              label: "Referência do git log",
              url: "https://git-scm.com/docs/git-log",
              kind: "doc",
            },
          ],
        },
        {
          id: "historico.diff",
          title: "git diff: o que mudou, linha a linha",
          description:
            "Comparar o diretório de trabalho com o stage, o stage com o último commit e ver o resumo das mudanças.",
          content:
            'O `git diff` mostra as linhas que mudaram. Sem argumentos, ele compara o diretório de trabalho com o stage: o que você editou e ainda não adicionou. Na saída, as linhas que importam são as marcadas com sinal:\n\n```text\n-console.log("Tarefas:");\n+console.log("Suas tarefas:");\n```\n\nA linha com `-` é como estava; a linha com `+` é como ficou. Uma alteração numa linha aparece sempre como uma linha que sai e outra que entra. Acima dessas linhas o Git mostra o nome do arquivo e a posição da mudança.\n\nO detalhe que confunde: depois do `git add`, o `git diff` puro fica vazio, porque o diretório de trabalho e o stage passaram a ser iguais. Pra ver o que vai entrar no próximo commit, a opção é outra:\n\n```bash\n$ git diff --staged --stat\n app.js | 2 +-\n 1 file changed, 1 insertion(+), 1 deletion(-)\n```\n\nO `--staged` compara o stage com o último commit. O `--stat` troca as linhas pelo resumo por arquivo, útil quando a mudança é grande e você só quer saber onde ela mexeu.\n\nO hábito que evita commit errado: `git diff --staged` imediatamente antes de `git commit`, lendo cada linha que vai ser gravada. Você domina este passo quando sabe qual das duas formas usar para ver o que editou e o que está prestes a gravar.',
          resources: [
            {
              label: "Referência do git diff",
              url: "https://git-scm.com/docs/git-diff",
              kind: "doc",
            },
          ],
        },
        {
          id: "historico.show",
          title: "git show: um commit por dentro",
          description:
            "Abrir um commit específico pelo hash ou por referência relativa, como HEAD~1.",
          content:
            "O `git log` diz quais commits existem; o `git show` abre um deles e mostra o que ele mudou. Sem argumento, ele mostra o commit em que você está. Com `--stat`, a resposta fica no resumo por arquivo:\n\n```bash\n$ git show --stat --oneline HEAD\ne4f5a6b (HEAD -> main) Marca tarefa como feita\n app.js | 4 +++-\n 1 file changed, 3 insertions(+), 1 deletion(-)\n```\n\nPra apontar para um commit, você tem dois caminhos. O primeiro é o hash, copiado do `git log --oneline`; o Git aceita a forma curta desde que ela não seja ambígua no repositório. O segundo é uma **referência relativa**: `HEAD~1` é o commit anterior ao atual, `HEAD~2` o de antes dele, e assim por diante.\n\n```bash\n$ git show HEAD~1\n$ git show c7d8e9f -- app.js\n```\n\nCada um imprime o commit inteiro, com autor, data e as linhas alteradas; a segunda linha mostra só a parte daquele commit que mexeu em `app.js`, útil quando o commit tocou muitos arquivos.\n\nAs referências relativas voltam o tempo todo nos próximos passos: `git reset HEAD~1` desfaz o último commit, e `git diff HEAD~2` compara com dois commits atrás. Vale assentar agora que `HEAD` é onde você está e o til com número conta para trás na corrente de commits.\n\nVocê domina este passo quando abre qualquer commit do histórico, pelo hash ou pela referência relativa, e explica o que ele mudou.",
          resources: [
            {
              label: "Referência do git show",
              url: "https://git-scm.com/docs/git-show",
              kind: "doc",
            },
          ],
        },
        {
          id: "historico.mensagens",
          title: "Mensagens de commit que servem",
          description:
            "O que escrever na mensagem pra que o histórico explique o projeto a quem chegar depois, inclusive você.",
          content:
            'A mensagem de commit é a única explicação que sobra de uma mudança depois que ela é gravada. O código mostra o que mudou; a mensagem precisa dizer **o que** em poucas palavras e, quando não for óbvio, **por quê**.\n\nAs convenções mais usadas cabem em três regras. Uma linha de resumo curta, em torno de 50 caracteres, que caiba no `git log --oneline`. Verbo no início, descrevendo a ação, como numa ordem: o commit adiciona, corrige, remove. E um assunto por commit: se a mensagem precisa de um "e" para juntar duas coisas sem relação, provavelmente eram dois commits.\n\n```text\nCorrige total quando a lista está vazia\nAdiciona filtro de tarefas concluídas\nRemove dependência que não é mais usada\n```\n\nCompare com `ajustes`, `wip` e `agora vai`. Daqui a seis meses, procurando em que momento o total começou a sair errado, só a primeira lista ajuda.\n\nMuitos times adotam um formato fixo, como prefixar o tipo da mudança (`feat:`, `fix:`, `docs:`), e escrevem em inglês. O formato é combinado com o time; o que não muda é o princípio de que a mensagem conta a história do projeto.\n\nQuando o motivo é importante e não cabe no resumo, deixe uma linha em branco e escreva o corpo abaixo, sem o `-m`, no editor. Você domina este passo quando o seu `git log --oneline` se lê como uma lista do que aconteceu no projeto.',
          resources: [
            {
              label: "Pro Git: Contribuindo com um projeto (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Git-Distribu%c3%addo-Contribuindo-com-um-Projeto",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "desfazer",
      title: "Desfazendo",
      level: "intermediario",
      description:
        "Descartar uma edição, tirar do stage, consertar o último commit, voltar commits com reset e desfazer com segurança com revert.",
      children: [
        {
          id: "desfazer.restore",
          title: "git restore: descartar uma edição",
          description:
            "Voltar um arquivo ao estado do último commit, e por que essa é a operação mais sem volta do Git.",
          content:
            "Você editou um arquivo, não gostou do resultado e quer voltar ao que estava no último commit. O `git restore` faz isso:\n\n```bash\n$ git status --short\n M app.js\n$ git restore app.js\n$ git status --short\n```\n\nO segundo `git status --short` não imprime nada: o arquivo voltou a ser igual ao do último commit, e o diretório de trabalho está limpo.\n\nAtenção ao que se perdeu. A edição descartada nunca entrou num commit, então o Git não tem cópia dela em lugar nenhum. É uma das poucas operações do Git que não têm volta, e é justamente por isso que ela merece um segundo de atenção antes do Enter. Na dúvida, guarde a edição com `git stash`, que aparece na seção Caixa de ferramentas, em vez de descartar.\n\nO `git restore .` descarta as edições de todos os arquivos rastreados a partir da pasta atual. Arquivo não rastreado, o dos pontos de interrogação, não é afetado: ele não tem versão anterior para onde voltar.\n\nO nome do comando ajuda a lembrar: ele restaura o arquivo a partir de uma fonte. Sem opção, a fonte é o stage, que depois de um commit é igual ao último commit. O próximo passo mostra o mesmo comando mexendo no stage em vez do arquivo.\n\nVocê domina este passo quando descarta uma edição com segurança, sabendo exatamente o que vai se perder.",
          resources: [
            {
              label: "Referência do git restore",
              url: "https://git-scm.com/docs/git-restore",
              kind: "doc",
            },
          ],
        },
        {
          id: "desfazer.unstage",
          title: "Tirar do stage com restore --staged",
          description:
            "Desfazer um git add sem perder a edição: a mudança volta para o diretório de trabalho.",
          content:
            "Um `git add` a mais é o engano mais comum do dia a dia: o arquivo entrou no stage, mas não pertence ao próximo commit. Desfazer isso não apaga nada:\n\n```bash\n$ git status --short\nM  app.js\n$ git restore --staged app.js\n$ git status --short\n M app.js\n```\n\nRepare na coluna da letra. Antes, o `M` estava na primeira coluna: a mudança estava no stage. Depois do comando, ele foi para a segunda: a mudança continua no arquivo, só saiu da sala de espera. Nenhuma linha que você escreveu se perdeu.\n\nEssa é a diferença que vale guardar entre as duas formas do `restore`. Com `--staged`, ele mexe só no stage e é seguro. Sem opção, ele mexe no arquivo e descarta a edição, como no passo anterior. Trocar uma pela outra é a forma mais comum de perder trabalho por distração.\n\nO mesmo vale para um arquivo novo que entrou no stage por um `git add .` apressado: depois do `git restore --staged`, ele volta a aparecer como não rastreado, com os pontos de interrogação, e continua na pasta.\n\nO `git status` completo, sem `--short`, mostra esse comando como sugestão logo acima da lista de arquivos do stage. É mais um motivo pra ler a saída dele inteira. Você domina este passo quando tira um arquivo do stage sem medo e explica por que nada foi perdido.",
          resources: [
            {
              label: "Pro Git: Desfazendo coisas (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Fundamentos-do-Git-Desfazendo-Coisas",
              kind: "doc",
            },
          ],
        },
        {
          id: "desfazer.amend",
          title: "Consertar o último commit com --amend",
          description:
            "Corrigir a mensagem ou incluir um arquivo esquecido no commit que acabou de ser feito.",
          content:
            'Acabou de fazer um commit e percebeu um erro de digitação na mensagem, ou esqueceu um arquivo. O `--amend` refaz o último commit em vez de criar outro:\n\n```bash\n$ git commit --amend -m "Adiciona filtro de tarefas"\n```\n\nO Git responde como a um commit comum, já com o hash novo. Para incluir um arquivo esquecido, ele entra no stage antes, e o `--no-edit` mantém a mensagem que já existia:\n\n```bash\n$ git add filtro.test.js\n$ git commit --amend --no-edit\n```\n\nO histórico fica como se o commit tivesse nascido certo, sem um segundo commit chamado `esqueci o teste`.\n\nO que acontece por baixo explica a regra de uso. O `--amend` não edita o commit antigo: ele cria um commit novo, com outro hash, e passa a branch para ele. O commit anterior some do histórico visível.\n\nIsso é inofensivo enquanto o commit só existe na sua máquina. Depois que ele foi enviado para um repositório compartilhado, com o `git push` que aparece na seção Remotos, outras pessoas podem ter o commit antigo, e reescrevê-lo cria dois históricos que discordam. Por isso a regra: `--amend` só em commit que ainda não foi compartilhado.\n\nEssa mesma regra, reescrever só o que ainda é seu, volta com o `git reset` no próximo passo e com o rebase na seção Fluxos de trabalho. Você domina este passo quando conserta o último commit antes de enviá-lo e sabe explicar por que não fazer isso depois.',
          resources: [
            {
              label: "Referência do git commit",
              url: "https://git-scm.com/docs/git-commit",
              kind: "doc",
            },
          ],
        },
        {
          id: "desfazer.reset",
          title: "git reset com cuidado",
          description:
            "Voltar a branch para um commit anterior nos três modos, do que guarda tudo ao que apaga tudo.",
          content:
            "O `git reset` move a branch atual para outro commit, geralmente um anterior. Os commits que ficam à frente saem do histórico visível. O que acontece com as mudanças deles depende do modo:\n\n```bash\n$ git reset --soft HEAD~1\n$ git reset HEAD~1\n$ git reset --hard HEAD~1\n```\n\nOs três são alternativas, não uma sequência: cada um desfaz o último commit, e eles diferem no destino das mudanças. O modo padrão e o `--hard` ainda imprimem um resumo, que muda com o seu repositório. Com `--soft`, elas voltam para o stage, prontas para um novo commit; é o jeito de juntar dois commits ou reescrever a mensagem de algo mais antigo. Sem opção, o modo padrão, elas voltam para o diretório de trabalho, fora do stage; é o jeito de refazer o commit escolhendo de novo o que entra. Com `--hard`, elas são descartadas, e o diretório de trabalho fica igual ao commit de destino.\n\nO `--hard` é o comando que mais apaga trabalho no Git. Ele descarta também as edições que você ainda não tinha gravado, e essas não voltam. Commits removidos ainda podem ser resgatados com o `git reflog`, da seção Caixa de ferramentas; edição nunca gravada, não.\n\nComo o `--amend`, o `reset` reescreve o histórico e segue a mesma regra: só em commits que ainda não foram compartilhados. Para desfazer algo que já está no repositório do time, o caminho é o próximo passo.\n\nVocê domina este passo quando escolhe o modo certo do `reset` para cada situação e evita o `--hard` quando existe edição não gravada.",
          resources: [
            {
              label: "Pro Git: Reset desmistificado (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Ferramentas-do-Git-Reset-Desmistificado",
              kind: "doc",
            },
            {
              label: "Referência do git reset",
              url: "https://git-scm.com/docs/git-reset",
              kind: "doc",
            },
          ],
        },
        {
          id: "desfazer.revert",
          title: "git revert: desfazer sem reescrever",
          description:
            "Um commit novo que desfaz um antigo, o jeito seguro de voltar atrás no que já foi compartilhado, e o critério para escolher entre os três.",
          content:
            'O `git revert` desfaz um commit sem apagá-lo: ele cria um commit novo com a mudança inversa. Se o commit original adicionou cinco linhas, o revert as remove.\n\n```bash\n$ git revert --no-edit HEAD\n[main f1e2d3c] Revert "Adiciona tema escuro"\n 1 file changed, 5 deletions(-)\n```\n\nO `--no-edit` aceita a mensagem padrão, que começa com `Revert` e repete a original. Sem ele, o Git abre o editor para você explicar o motivo, o que costuma valer a pena.\n\nA diferença para o `reset` é o que torna o revert o comando certo em repositório compartilhado. O histórico só cresce: o commit original continua lá, o commit de revert fica logo depois, e ninguém que já tinha o histórico precisa refazer nada. Qualquer um lê no log que a mudança entrou, saiu e por quê.\n\nCom os três comandos desta seção, a escolha fica assim. Edição que ainda não virou commit: `git restore`. Commit que só existe na sua máquina: `git reset` ou `git commit --amend`. Commit que já foi enviado para o repositório do time: `git revert`.\n\nO revert pode dar conflito, quando commits posteriores mexeram nas mesmas linhas; a seção Conflitos ensina a ler e resolver isso. Você domina este passo quando desfaz um commit compartilhado com revert e sabe dizer, para qualquer situação, qual dos três comandos usar.',
          resources: [
            {
              label: "Referência do git revert",
              url: "https://git-scm.com/docs/git-revert",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "branches",
      title: "Branches",
      level: "intermediario",
      description:
        "Linhas de trabalho paralelas: o que uma branch é por dentro, criar e trocar com switch, juntar com merge e apagar o que já entrou.",
      children: [
        {
          id: "branches.conceito",
          title: "O que é uma branch",
          description:
            "Um nome que aponta para um commit e anda sozinho a cada commit novo: por que criar branch no Git é barato.",
          content:
            "Uma **branch** é uma linha de trabalho paralela: você desenvolve uma funcionalidade nela sem mexer na versão principal, e junta as duas quando estiver pronto.\n\nPor dentro, ela é muito menos do que parece. Lembra do modelo de commits como fotos ligadas em corrente, da seção Versionamento e o Git? Uma branch é só um nome que aponta para uma dessas fotos. A `main` é um nome apontando para o commit mais recente da linha principal. Quando você faz um commit estando nela, o novo commit aponta para o anterior e o nome `main` anda para a frente, sozinho.\n\nCriar uma branch nova é criar mais um nome apontando para o commit atual. Nada é copiado, e por isso é instantâneo, mesmo num projeto enorme. A partir dali, os commits feitos na branch nova fazem só ela andar; a `main` fica parada onde estava.\n\nO **HEAD** completa o quadro: ele indica em qual branch você está. O `git log --oneline` mostra isso como `HEAD -> main`, e trocar de branch é mudar para onde o HEAD aponta, com o Git ajustando os arquivos da pasta para aquela foto.\n\nEsse modelo é o que torna os próximos passos previsíveis. Merge, rebase e reset são todos operações que movem nomes pela corrente de commits. Você domina este passo quando desenha, num papel, duas branches como dois nomes apontando para commits de uma mesma corrente.",
          resources: [
            {
              label: "Pro Git: Branches em poucas palavras (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Ramifica%c3%a7%c3%a3o-Branching-no-Git-Branches-em-Poucas-Palavras",
              kind: "doc",
            },
          ],
        },
        {
          id: "branches.criar",
          title: "git branch e git switch",
          description:
            "Criar, listar e trocar de branch com os comandos atuais, e o checkout que você vai encontrar em material antigo.",
          content:
            "O `git switch` troca de branch, e com `-c` cria a branch e já entra nela. O `git branch` lista as que existem:\n\n```bash\n$ git switch -c filtro\nSwitched to a new branch 'filtro'\n$ git branch\n* filtro\n  main\n```\n\nO asterisco marca a branch em que você está. Voltar para a principal é o mesmo comando, sem o `-c`:\n\n```bash\n$ git switch main\nSwitched to branch 'main'\n```\n\nAo trocar, o Git ajusta os arquivos da pasta para a foto da branch de destino. Um arquivo criado num commit da `filtro` some da pasta quando você volta para a `main`, e reaparece quando você volta para a `filtro`. Nada foi perdido: a pasta mostra sempre a branch atual.\n\nSe houver edições não gravadas, o Git leva as edições junto na troca quando elas não conflitam com a branch de destino, e recusa a troca quando conflitam, explicando o motivo. O caminho seguro é trocar de branch com o diretório de trabalho limpo, fazendo commit antes ou guardando com `git stash`.\n\nEm tutoriais antigos você vai ver `git checkout filtro` e `git checkout -b filtro`. É a forma antiga: o `checkout` trocava de branch e também restaurava arquivos, e o Git 2.23 separou esses dois papéis em `switch` e `restore`, os comandos que esta trilha usa. Você domina este passo quando cria uma branch, alterna entre ela e a `main` e sabe onde está olhando o asterisco.",
          resources: [
            {
              label: "Referência do git switch",
              url: "https://git-scm.com/docs/git-switch",
              kind: "doc",
            },
            {
              label: "Referência do git branch",
              url: "https://git-scm.com/docs/git-branch",
              kind: "doc",
            },
          ],
        },
        {
          id: "branches.ff",
          title: "Merge fast-forward",
          description:
            "Quando a main não andou desde que a branch nasceu, o merge só avança o ponteiro.",
          content:
            "O `git merge` traz os commits de outra branch para a branch em que você está. Você sempre se posiciona no destino e nomeia a origem:\n\n```bash\n$ git switch main\nSwitched to branch 'main'\n$ git merge filtro\nUpdating a1b2c3d..e4f5a6b\nFast-forward\n app.js | 12 ++++++++++++\n 1 file changed, 12 insertions(+)\n```\n\nA palavra `Fast-forward` diz qual tipo de merge aconteceu. Desde que a `filtro` nasceu, a `main` não ganhou nenhum commit novo. Os commits da `filtro` já estão, portanto, em linha reta à frente da `main`, e juntar as duas é só avançar o nome `main` até o último commit da `filtro`. Nenhum commit novo é criado, e a linha `Updating` mostra de onde para onde o ponteiro andou (os hashes variam).\n\nNo modelo de nomes apontando para fotos, o fast-forward é o merge mais simples possível: um nome anda pela corrente. Depois dele, as duas branches apontam para o mesmo commit, e o histórico continua uma linha reta, sem nenhum rastro de que existiu uma branch.\n\nÉ o caso comum quando você trabalha sozinho num projeto: cria a branch, faz os commits, volta para a `main` e junta. Quando mais gente mexe na `main` ao mesmo tempo, ela anda enquanto você trabalha, e o merge passa a ser o do próximo passo.\n\nVocê domina este passo quando olha o histórico antes do merge e prevê se ele vai ser fast-forward.",
          resources: [
            {
              label: "Pro Git: Branching e merging básicos (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Ramifica%c3%a7%c3%a3o-Branching-no-Git-Ramifica%c3%a7%c3%a3o-Branching-e-Mesclagem-Merging-B%c3%a1sicas",
              kind: "doc",
            },
            {
              label: "Referência do git merge",
              url: "https://git-scm.com/docs/git-merge",
              kind: "doc",
            },
          ],
        },
        {
          id: "branches.merge-commit",
          title: "Merge com commit de merge",
          description:
            "Quando as duas branches andaram, o Git junta os dois lados num commit com dois pais.",
          content:
            "Quando a `main` ganhou commits novos enquanto você trabalhava na sua branch, as duas linhas divergiram: nenhuma está em linha reta à frente da outra, e avançar um ponteiro não resolve. O Git então cria um **commit de merge**, que junta os dois lados:\n\n```bash\n$ git merge --no-edit filtro\nMerge made by the 'ort' strategy.\n app.js | 12 ++++++++++++\n 1 file changed, 12 insertions(+)\n```\n\nO `ort` é o nome da estratégia que o Git usa por padrão para combinar os dois lados. O `--no-edit` aceita a mensagem padrão do commit de merge, `Merge branch 'filtro'`; sem ele, o Git abre o editor com essa mensagem já escrita, para você ajustar ou só salvar.\n\nO commit de merge é diferente dos outros num ponto: ele tem **dois pais**, o último commit da `main` e o último da `filtro`. É assim que o histórico registra que duas linhas de trabalho se encontraram ali. O `git log --oneline --graph` desenha esse encontro como dois galhos que se juntam.\n\nNa maioria das vezes o Git combina os dois lados sozinho, porque eles mexeram em arquivos ou em trechos diferentes. Quando os dois mudaram as mesmas linhas, ele não tem como escolher qual versão vale, para no meio do caminho e pede a sua decisão. Esse é o conflito, assunto da próxima seção.\n\nVocê domina este passo quando sabe dizer, antes de rodar o merge, se ele vai ser fast-forward ou vai criar um commit de merge.",
          resources: [
            {
              label: "Referência do git merge",
              url: "https://git-scm.com/docs/git-merge",
              kind: "doc",
            },
          ],
        },
        {
          id: "branches.apagar",
          title: "Apagar a branch que já entrou",
          description:
            "Limpar as branches depois do merge, e a diferença entre apagar com -d e forçar com -D.",
          content:
            "Depois que o trabalho de uma branch entrou na `main`, ela não tem mais função, e deixá-la por aí só polui a lista. Apagar é seguro:\n\n```bash\n$ git branch -d filtro\nDeleted branch filtro (was e4f5a6b).\n```\n\nApagar uma branch apaga o nome, não os commits. Os commits da `filtro` continuam no histórico da `main`, porque o merge os trouxe. A resposta ainda mostra para qual commit o nome apontava, com um hash que varia.\n\nO `-d` minúsculo tem uma proteção embutida: se a branch tiver commits que ainda não entraram na branch atual, o Git recusa e avisa que ela não foi totalmente juntada. É o Git impedindo que você perca trabalho por engano.\n\nQuando você quer mesmo jogar fora uma branch que não deu certo, com commits que nunca vão entrar, o `-D` maiúsculo força a remoção:\n\n```bash\n$ git branch -D experimento\n```\n\nAqui o cuidado é seu. Os commits que só existiam nela ficam sem nome apontando para eles; ainda dá para resgatá-los por um tempo com o `git reflog`, da seção Caixa de ferramentas, mas é melhor não precisar.\n\nO hábito de times organizados: uma branch por tarefa, apagada assim que entra. A lista do `git branch` fica curta e mostra só o que está em andamento. Você domina este passo quando mantém a sua lista de branches limpa e sabe por que o `-d` recusou uma remoção.",
          resources: [
            {
              label: "Pro Git: Gerenciamento de branches (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Ramifica%c3%a7%c3%a3o-Branching-no-Git-Gerenciamento-de-Branches",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "conflitos",
      title: "Conflitos",
      level: "intermediario",
      description:
        "Por que um merge para no meio, como ler as marcações que o Git escreve no arquivo, resolver e concluir, ou desistir e recomeçar.",
      children: [
        {
          id: "conflitos.porque",
          title: "Por que conflitos acontecem",
          description:
            "Duas branches mudaram as mesmas linhas, e o Git se recusa a adivinhar qual versão vale.",
          content:
            "Um **conflito** acontece quando duas branches mudaram as mesmas linhas de um arquivo de formas diferentes, e o merge não tem como saber qual das duas versões é a certa. Em vez de adivinhar, o Git para e pede a sua decisão.\n\nImagine a `main` trocando o título da página para `Minhas tarefas` e a branch `titulo-novo` trocando a mesma linha para `Lista de tarefas`. Ao juntar as duas:\n\n```bash\n$ git merge titulo-novo\nAuto-merging index.html\nCONFLICT (content): Merge conflict in index.html\n```\n\nUma terceira linha da resposta avisa que o merge automático falhou e pede que você resolva os conflitos e faça o commit. O merge fica pela metade: os arquivos sem conflito já foram combinados, e o arquivo com conflito espera por você.\n\nConflito não é erro, e não significa que alguém fez algo errado. É o Git sendo honesto sobre o limite dele: ele sabe juntar mudanças em lugares diferentes, mas não sabe qual título o time quer. Só quem entende o projeto decide.\n\nO que diminui conflitos é a rotina, não sorte. Commits pequenos, branches que vivem pouco tempo e trazer a `main` para a sua branch com frequência fazem os conflitos aparecerem cedo, pequenos e fáceis. Branch que passa semanas longe da `main` acumula conflitos grandes. Você domina este passo quando explica por que o Git parou e sabe que o próximo passo é abrir o arquivo indicado.",
          resources: [
            {
              label: "Pro Git: Branching e merging básicos (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Ramifica%c3%a7%c3%a3o-Branching-no-Git-Ramifica%c3%a7%c3%a3o-Branching-e-Mesclagem-Merging-B%c3%a1sicas",
              kind: "doc",
            },
          ],
        },
        {
          id: "conflitos.marcacoes",
          title: "Lendo as marcações de conflito",
          description:
            "Os sinais que o Git escreve dentro do arquivo para mostrar os dois lados, e o status de um merge pela metade.",
          content:
            "Durante um conflito, o `git status` marca o arquivo com duas letras `U`, de não combinado:\n\n```bash\n$ git status --short\nUU index.html\n```\n\nDentro do arquivo, o Git escreve os dois lados do conflito, cercados por marcações:\n\n```text\n<<<<<<< HEAD\n<h1>Minhas tarefas</h1>\n=======\n<h1>Lista de tarefas</h1>\n>>>>>>> titulo-novo\n```\n\nA leitura é sempre a mesma. Entre `<<<<<<< HEAD` e `=======` está a versão da branch em que você está, a que recebe o merge. Entre `=======` e `>>>>>>> titulo-novo` está a versão da branch que está chegando, com o nome dela na marcação. Tudo fora das marcações já foi combinado e não precisa de atenção.\n\nUm arquivo pode ter vários blocos desses, um para cada trecho em conflito, e o merge só termina depois que todos forem resolvidos. O VS Code e outros editores reconhecem as marcações e oferecem botões para aceitar um lado, o outro ou os dois, o que ajuda, mas não substitui ler o que cada lado faz.\n\nO erro mais caro aqui é tratar as marcações como texto qualquer e fazer commit com elas dentro do arquivo. O código quebra, e em HTML elas aparecem na página. Antes de concluir, procure por `<<<<<<<` no projeto. Você domina este passo quando lê um bloco de conflito e diz de que branch veio cada versão.",
          resources: [
            {
              label: "Pro Git: Merging avançado (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Ferramentas-do-Git-Merging-Avan%c3%a7ado",
              kind: "doc",
            },
          ],
        },
        {
          id: "conflitos.resolver",
          title: "Resolver e concluir o merge",
          description:
            "Editar o arquivo até a versão certa, marcar como resolvido com git add e gravar o commit de merge.",
          content:
            "Resolver um conflito é editar o arquivo até ele ficar como deve ser, sem as marcações. A versão final pode ser a de um lado, a do outro ou uma combinação escrita por você; o Git não se importa, ele só precisa que você decida.\n\nNo exemplo do título, se o time escolheu `Lista de tarefas`, o arquivo fica só com essa linha, e as cinco linhas do bloco de conflito somem. Depois disso, dois comandos concluem o merge:\n\n```bash\n$ git add index.html\n$ git commit --no-edit\n```\n\nO `git add` aqui tem um papel especial: ele diz ao Git que o conflito daquele arquivo foi resolvido, e o `UU` some do `git status`. O `git commit` grava o commit de merge com a mensagem que o Git já tinha preparado quando o merge parou; o `--no-edit` aceita essa mensagem. O `git merge --continue` faz o mesmo que esse commit, e você vai encontrar as duas formas.\n\nAntes do `git add`, rode o projeto. Um conflito resolvido no texto ainda pode quebrar o programa, quando a combinação escolhida junta duas mudanças que não funcionam juntas. O Git confere as marcações, não o comportamento.\n\nSe o merge tiver vários arquivos em conflito, cada um recebe o seu `git add`, e o commit só é aceito quando o `git status` não mostra mais nenhum `UU`. Você domina este passo quando resolve um conflito do começo ao fim e confere o resultado rodando o projeto antes do commit.",
          resources: [
            {
              label: "Referência do git merge",
              url: "https://git-scm.com/docs/git-merge",
              kind: "doc",
            },
          ],
        },
        {
          id: "conflitos.abortar",
          title: "Abortar e recomeçar",
          description:
            "Desistir de um merge pela metade e voltar exatamente ao estado de antes.",
          content:
            "Às vezes o conflito é maior do que parecia, ou você percebe que juntou a branch errada. Não é preciso resolver nada para sair: o merge pela metade pode ser cancelado.\n\n```bash\n$ git merge --abort\n$ git status --short\n```\n\nO `git status --short` não imprime nada: o repositório voltou exatamente ao estado de antes do `git merge`, como se ele nunca tivesse sido rodado. Os arquivos combinados automaticamente também voltam, e as marcações de conflito somem.\n\nPor isso a recomendação de começar o merge com o diretório de trabalho limpo, sem edições pendentes. Com tudo gravado antes, o `--abort` devolve você a um ponto conhecido. Com edições não gravadas misturadas ao merge, a volta fica ambígua, e o Git pode não conseguir restaurá-las.\n\nAbortar não é fracasso, é estratégia. Um caminho comum quando o conflito é grande: abortar, conversar com quem fez a outra mudança, e refazer o merge sabendo qual versão cada trecho deve ter. Outro é abortar e trazer a `main` para a sua branch aos poucos, resolvendo conflitos menores de cada vez.\n\nO mesmo padrão existe em outras operações que podem parar no meio, como o rebase e o cherry-pick, das seções seguintes: cada uma tem o seu `--abort` e o seu `--continue`. Você domina este passo quando cancela um merge sem medo e explica por que o diretório limpo antes do merge torna isso seguro.",
          resources: [
            {
              label: "Referência do git merge",
              url: "https://git-scm.com/docs/git-merge",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "remotos",
      title: "Remotos",
      level: "intermediario",
      description:
        "O repositório que mora num servidor como o GitHub: clonar, enviar, buscar e entender o que o pull faz por baixo.",
      children: [
        {
          id: "remotos.conceito",
          title: "Repositório remoto e o GitHub",
          description:
            "Uma cópia do repositório num servidor, que o time usa como ponto de encontro, e o apelido origin.",
          content:
            "Até aqui, o histórico morou só no seu computador. Um **repositório remoto** é uma cópia do mesmo repositório guardada num servidor, que serve de ponto de encontro: cada pessoa envia os seus commits para lá e busca de lá os commits das outras.\n\nGitHub, GitLab e Bitbucket são serviços que hospedam repositórios remotos e acrescentam ferramentas em volta, como a revisão de código por pull request, que aparece na seção Fluxos de trabalho. O Git em si não depende de nenhum deles: o remoto é só outro repositório Git, que por acaso fica num servidor.\n\nComo cada pessoa tem o histórico inteiro, o remoto não é o dono do projeto no sentido técnico. Na prática, o time combina que a `main` do remoto é a versão oficial, e é dela que saem as publicações.\n\nUm repositório pode ter vários remotos, cada um com um apelido. O apelido padrão é **origin**, que o Git dá sozinho ao remoto de onde você clonou. Quando você lê `origin/main` num comando ou numa resposta, é a `main` do remoto chamado `origin`.\n\nA sincronização é sempre explícita. Nada sobe nem desce sozinho: o `git push` envia, o `git fetch` e o `git pull` buscam, e até você rodá-los, o remoto e a sua máquina podem estar diferentes. Você domina este passo quando explica o papel do remoto num time e o que significa `origin/main`.",
          resources: [
            {
              label: "Pro Git: Trabalhando com repositórios remotos (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Fundamentos-do-Git-Trabalhando-com-Reposit%c3%b3rios-Remotos",
              kind: "doc",
            },
          ],
        },
        {
          id: "remotos.clone",
          title: "git clone: trazer um projeto que já existe",
          description:
            "Baixar o repositório inteiro, com o histórico, e já sair com o origin configurado.",
          content:
            "Quando o projeto já existe num remoto, você não cria um repositório com `git init`: você clona o que existe.\n\n```bash\n$ git clone https://github.com/voce/tarefas.git\n$ cd tarefas\n```\n\nO `git clone` responde com `Cloning into 'tarefas'...` e mostra o progresso do download. Ele cria uma pasta com o nome do repositório e traz o histórico inteiro, todos os commits desde o primeiro, e não só a versão mais recente dos arquivos. É por isso que, depois de clonar, `git log` funciona sem internet.\n\nAlém de baixar, o clone já deixa tudo configurado. O remoto de onde você clonou fica registrado com o apelido `origin`, e a sua `main` local fica ligada à `main` do remoto. Pra conferir os remotos configurados:\n\n```bash\n$ git remote\norigin\n```\n\nCom `git remote -v`, a resposta mostra também o endereço de cada remoto, uma linha para buscar e outra para enviar.\n\nO endereço pode ser HTTPS, como no exemplo, ou SSH, no formato `git@github.com:voce/tarefas.git`. Os dois funcionam; a diferença está na autenticação, que o próximo passo explica. Clonar um repositório público não pede senha nenhuma.\n\nClonar é também o jeito mais rápido de estudar: qualquer projeto público pode ser clonado e ter o histórico lido com os comandos da seção Lendo o histórico. Você domina este passo quando clona um repositório e confere o remoto dele com `git remote`.",
          resources: [
            {
              label: "Referência do git clone",
              url: "https://git-scm.com/docs/git-clone",
              kind: "doc",
            },
          ],
        },
        {
          id: "remotos.push",
          title: "git remote e git push: enviar o seu trabalho",
          description:
            "Ligar um repositório local a um remoto vazio e enviar os commits, com a autenticação que o GitHub pede.",
          content:
            "Com um projeto criado com `git init`, o caminho é o inverso do clone: criar um repositório vazio no GitHub, ligar o repositório local a ele e enviar os commits.\n\n```bash\n$ git remote add origin https://github.com/voce/tarefas.git\n$ git push -u origin main\n```\n\nA primeira linha registra o remoto com o apelido `origin`. A segunda envia a branch `main` para ele. O `-u` liga a sua `main` à `main` do remoto, e a partir daí um `git push` sem argumentos já sabe para onde mandar. O Git responde com o progresso do envio.\n\nNo primeiro envio, o GitHub pede autenticação. Ele não aceita a senha da conta no terminal: o caminho é um token de acesso gerado no site, uma chave SSH ou o gerenciador de credenciais, que o instalador do Git para Windows já traz. Qualquer um dos três só precisa ser configurado uma vez.\n\nQuando não há nada novo para enviar, a resposta diz isso:\n\n```bash\n$ git push\nEverything up-to-date\n```\n\nO push só envia commits. Edição que não virou commit fica na sua máquina, e é por isso que o ciclo termina sempre em commit antes do push.\n\nSe o remoto tiver commits que você ainda não tem, o Git recusa o push e pede que você traga esses commits primeiro, com o comando do próximo passo. Você domina este passo quando publica um repositório local no GitHub e sabe o que o `-u` fez.",
          resources: [
            {
              label: "Referência do git push",
              url: "https://git-scm.com/docs/git-push",
              kind: "doc",
            },
            {
              label: "Referência do git remote",
              url: "https://git-scm.com/docs/git-remote",
              kind: "doc",
            },
          ],
        },
        {
          id: "remotos.fetch-pull",
          title: "fetch e pull: o que o pull faz por baixo",
          description:
            "Buscar commits sem mexer no seu trabalho, e o pull como busca seguida de merge.",
          content:
            "Trazer o trabalho dos outros para a sua máquina tem dois comandos, e a diferença entre eles evita muita surpresa.\n\nO `git fetch` baixa os commits novos do remoto e atualiza a sua cópia de `origin/main`, mas **não mexe** na sua `main` nem nos seus arquivos. Ele só deixa você ver o que chegou. Depois de um fetch, o status resumido mostra a distância:\n\n```bash\n$ git status --short --branch\n## main...origin/main [behind 2]\n```\n\nA leitura: a sua `main` está dois commits atrás da `main` do remoto. Nada foi alterado ainda; você decide quando e como trazer.\n\nO `git pull` faz as duas coisas de uma vez: um `git fetch` seguido de um `git merge` da branch remota na sua. Quando você não tem commits locais novos, o merge é fast-forward e a sua `main` só avança. Quando os dois lados andaram, ele cria um commit de merge, e pode dar conflito, como qualquer merge da seção Conflitos. Sem nada novo:\n\n```bash\n$ git pull\nAlready up to date.\n```\n\nÉ possível configurar o pull para usar rebase no lugar do merge, tema da seção Fluxos de trabalho. Seja qual for a configuração, saber que o pull é busca mais junção explica cada resposta que ele dá.\n\nO hábito: `git pull` na `main` antes de criar uma branch nova, pra começar do ponto mais recente. Você domina este passo quando explica o que o `git fetch` atualizou e o que o `git pull` fez a mais.",
          resources: [
            {
              label: "Referência do git fetch",
              url: "https://git-scm.com/docs/git-fetch",
              kind: "doc",
            },
            {
              label: "Referência do git pull",
              url: "https://git-scm.com/docs/git-pull",
              kind: "doc",
            },
          ],
        },
        {
          id: "remotos.rastreamento",
          title: "Branches remotas: ahead e behind",
          description:
            "origin/main como fotografia do remoto, a distância entre as duas branches e o envio de uma branch nova.",
          content:
            "O `origin/main` que aparece nas respostas do Git não é a `main` do servidor ao vivo: é a última foto que a sua máquina tirou dela, atualizada a cada `git fetch`, `git pull` ou `git push`. Entre um fetch e outro, o remoto pode ter andado sem que o seu `origin/main` saiba.\n\nA comparação entre a sua branch e essa foto aparece no status resumido. Depois de um commit local que ainda não foi enviado:\n\n```bash\n$ git status --short --branch\n## main...origin/main [ahead 1]\n```\n\n`ahead 1` significa um commit seu que o remoto ainda não tem, e resolve com `git push`. `behind`, do passo anterior, significa commits do remoto que você não tem, e resolve com `git pull`. Os dois ao mesmo tempo, como `[ahead 1, behind 2]`, significam que as linhas divergiram, e o pull vai criar um commit de merge ou pedir que você resolva um conflito.\n\nUma branch criada localmente não existe no remoto até você enviá-la pela primeira vez:\n\n```bash\n$ git push -u origin filtro\n```\n\nO `-u` faz o mesmo papel que teve com a `main`: liga a branch local à remota, e daí em diante `git push` e `git pull` nela funcionam sem argumentos. É esse envio que torna possível abrir um pull request, no começo da próxima seção.\n\nVocê domina este passo quando lê `ahead` e `behind` no status e sabe qual comando resolve cada um.",
          resources: [
            {
              label: "Pro Git: Branches remotos (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Ramifica%c3%a7%c3%a3o-Branching-no-Git-Branches-Remotos-Remote-Branches",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "fluxos",
      title: "Fluxos de trabalho",
      level: "avancado",
      description:
        "Como times usam o Git no dia a dia: uma branch por tarefa, pull request antes do merge, rebase para manter o histórico em linha e a regra de quando não rebasear.",
      children: [
        {
          id: "fluxos.feature",
          title: "Uma branch por tarefa",
          description:
            "A main sempre pronta para publicar, e cada mudança nascendo numa branch curta a partir do ponto mais recente.",
          content:
            "O fluxo mais usado em times de tecnologia cabe numa frase: a `main` está sempre funcionando, e toda mudança nasce numa branch própria, que volta para a `main` quando estiver pronta e revisada.\n\nO começo de cada tarefa é sempre o mesmo:\n\n```bash\n$ git switch main\nSwitched to branch 'main'\n$ git pull\nAlready up to date.\n$ git switch -c corrige-total\nSwitched to a new branch 'corrige-total'\n```\n\nPartir da `main` atualizada garante que a branch nasce do ponto mais recente, o que diminui os conflitos da seção Conflitos. O nome da branch diz o que ela faz: `corrige-total`, `adiciona-filtro`. Muitos times acrescentam o tipo ou o número do chamado, como `fix/total-vazio`; o formato é combinado com o time.\n\nA regra que faz o fluxo funcionar é branch curta. Uma branch que vive um ou dois dias e cabe numa revisão entra sem drama. Uma branch que acumula semanas de trabalho vira um merge cheio de conflitos e uma revisão que ninguém consegue ler direito.\n\nCom esse fluxo, a `main` vira a fonte da verdade: o que está nela foi revisado e pode ser publicado a qualquer momento. Quem precisa corrigir algo urgente parte da `main` sem medo de levar junto trabalho pela metade de outra pessoa.\n\nVocê domina este passo quando começa toda tarefa numa branch nova a partir da `main` atualizada, com um nome que diz o que ela faz.",
          resources: [
            {
              label: "Pro Git: Fluxos de trabalho de branches (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Ramifica%c3%a7%c3%a3o-Branching-no-Git-Fluxos-de-Trabalho-de-Branches-Branching-Workflows",
              kind: "doc",
            },
          ],
        },
        {
          id: "fluxos.pr",
          title: "Pull request: revisão antes do merge",
          description:
            "Propor a junção de uma branch pela plataforma, receber revisão e deixar o merge acontecer lá.",
          content:
            "Um **pull request** (no GitLab, merge request) é um pedido, feito na plataforma, para juntar uma branch na `main`. Ele não é um comando do Git: é uma ferramenta do GitHub e dos serviços parecidos, construída em cima das branches remotas da seção Remotos.\n\nO caminho começa com o envio da branch:\n\n```bash\n$ git push -u origin corrige-total\n```\n\nO Git responde com o progresso do envio, e o GitHub ainda devolve, na mesma resposta, um endereço para abrir o pull request daquela branch. Na página do pull request você escreve o que a mudança faz e por quê, e o site mostra o diff de todos os commits da branch.\n\nA partir daí o trabalho é de conversa. Colegas comentam linhas específicas, pedem ajustes, e cada ajuste é um commit novo na mesma branch, enviado com `git push`, que atualiza o pull request sozinho. Muitos projetos também rodam testes automáticos a cada envio e bloqueiam o merge enquanto eles falham.\n\nAprovado, o merge é feito pela própria plataforma, com um botão. Depois dele, a branch remota pode ser apagada no site, e na sua máquina você volta para a `main`, roda `git pull` para trazer o merge e apaga a branch local com `git branch -d`, como no passo Apagar a branch que já entrou.\n\nMesmo sozinho, abrir pull request para as próprias branches é um bom hábito: obriga a reler a mudança inteira antes de juntá-la. Você domina este passo quando leva uma branch do push ao merge por pull request.",
          resources: [
            {
              label: "Pro Git: Contribuindo para um projeto no GitHub (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/GitHub-Contribuindo-para-um-Projeto",
              kind: "doc",
            },
          ],
        },
        {
          id: "fluxos.rebase",
          title: "git rebase: reaplicar em cima da main",
          description:
            "Mover os commits de uma branch para depois do último commit da main, com histórico em linha reta.",
          content:
            "O `git rebase` é a outra forma de trazer as mudanças da `main` para a sua branch. Em vez de juntar as duas linhas com um commit de merge, ele pega os commits da sua branch e os reaplica, um por um, depois do último commit da `main`:\n\n```bash\n$ git switch filtro\nSwitched to branch 'filtro'\n$ git rebase main\nSuccessfully rebased and updated refs/heads/filtro.\n```\n\nO resultado é um histórico em linha reta, como se você tivesse começado a branch agora, a partir da `main` mais recente. Quando essa branch voltar para a `main`, o merge vai ser fast-forward, sem commit de merge.\n\nO detalhe que decide tudo no próximo passo: reaplicar um commit cria um commit **novo**, com outro hash. O conteúdo é o mesmo, mas para o Git são fotos diferentes, porque o pai mudou. Os commits antigos da branch deixam de fazer parte dela.\n\nComo o merge, o rebase pode parar num conflito, e aqui ele para em cada commit reaplicado que conflitar. A resolução segue o mesmo caminho da seção Conflitos: editar o arquivo, `git add` e, no lugar do commit, `git rebase --continue`. O `git rebase --abort` desiste e devolve a branch exatamente ao estado de antes.\n\nMerge e rebase chegam ao mesmo código final. A diferença é o desenho do histórico: o merge registra que houve duas linhas, e o rebase apresenta uma linha só. Você domina este passo quando atualiza uma branch com rebase e explica por que os hashes mudaram.",
          resources: [
            {
              label: "Pro Git: Rebase (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Ramifica%c3%a7%c3%a3o-Branching-no-Git-Rebase-Rebasing",
              kind: "doc",
            },
            {
              label: "Referência do git rebase",
              url: "https://git-scm.com/docs/git-rebase",
              kind: "doc",
            },
          ],
        },
        {
          id: "fluxos.quando-nao",
          title: "Quando não rebasear",
          description:
            "A regra de ouro: não reescrever commits que outras pessoas já têm, e o push forçado com proteção.",
          content:
            "A regra de ouro do rebase é curta: **não reescreva commits que outras pessoas já têm**. Rebase na sua branch local, antes de enviar, é seguro. Rebase em commits que já estão numa branch compartilhada, como a `main` do remoto, cria dois históricos que discordam.\n\nO motivo vem do passo anterior: o rebase troca os commits por outros, com hashes novos. Quem já tinha os antigos continua com eles. No próximo pull, o Git dessa pessoa vê commits que não reconhece, tenta juntar as duas versões e produz um histórico duplicado, com as mesmas mudanças aparecendo duas vezes. É o mesmo problema do `--amend` e do `reset` da seção Desfazendo, em escala maior.\n\nExiste um caso intermediário comum: a sua própria branch de pull request, que já foi enviada mas que só você usa. Depois de um rebase nela, o push normal é recusado, porque o remoto tem os commits antigos. O envio precisa ser forçado, e a forma com proteção é esta:\n\n```bash\n$ git push --force-with-lease\n```\n\nEle só sobrescreve o remoto se ninguém tiver enviado nada novo desde o seu último fetch. O `--force` puro sobrescreve sem conferir, e é o jeito clássico de apagar o trabalho de um colega.\n\nNa dúvida entre merge e rebase numa branch compartilhada, use merge: ele só acrescenta ao histórico e nunca reescreve. Você domina este passo quando sabe dizer, para uma branch, se ela pode ser rebaseada, e por quê.",
          resources: [
            {
              label: "Pro Git: Rebase (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Ramifica%c3%a7%c3%a3o-Branching-no-Git-Rebase-Rebasing",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "ferramentas",
      title: "Caixa de ferramentas",
      level: "avancado",
      description:
        "Os comandos que salvam o dia: guardar edições sem commit, marcar versões, trazer um commit específico e resgatar o que parecia perdido.",
      children: [
        {
          id: "ferramentas.stash",
          title: "git stash: guardar edições sem commit",
          description:
            "Tirar as edições do caminho para trocar de tarefa, e trazê-las de volta depois.",
          content:
            "Você está no meio de uma edição, ainda não é hora de commit, e surge uma correção urgente em outra branch. Trocar de branch com edições pendentes é arriscado; descartá-las, pior. O `git stash` guarda as edições numa pilha e deixa o diretório de trabalho limpo:\n\n```bash\n$ git stash\n$ git stash list\nstash@{0}: WIP on main: a1b2c3d Adiciona README\n$ git stash pop\n```\n\nO `git stash` responde com uma linha que começa com `Saved working directory and index state`, e a partir daí o `git status` fica limpo. Você pode trocar de branch, fazer a correção e voltar. O `git stash list` mostra o que está guardado: cada item tem um número, a branch em que foi criado e o último commit dela (o hash varia).\n\nO `git stash pop` devolve as edições do item mais recente para o diretório de trabalho e o remove da pilha, respondendo com o `git status` resultante. O `git stash apply` devolve sem remover, útil quando você quer aplicar o mesmo item em mais de uma branch.\n\nDois limites valem saber. Por padrão, o stash guarda só arquivos rastreados; arquivo novo, nunca adicionado, fica para trás, a menos que você use `git stash -u`. E a pilha é local e fácil de esquecer: stash que dura mais de um dia provavelmente devia ter virado um commit numa branch.\n\nVocê domina este passo quando interrompe uma tarefa com `git stash`, faz outra coisa e retoma de onde parou.",
          resources: [
            {
              label: "Pro Git: Fazendo stash e limpando (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Ferramentas-do-Git-Fazendo-Stash-e-Limpando",
              kind: "doc",
            },
            {
              label: "Referência do git stash",
              url: "https://git-scm.com/docs/git-stash",
              kind: "doc",
            },
          ],
        },
        {
          id: "ferramentas.tag",
          title: "git tag: marcar versões",
          description:
            "Um nome fixo para um commit importante, como a versão publicada, e o envio das tags para o remoto.",
          content:
            'Uma **tag** é um nome fixo apontando para um commit. Parece uma branch, com uma diferença decisiva: a branch anda a cada commit novo, e a tag fica parada para sempre no commit em que foi criada. É o jeito de marcar momentos importantes, como uma versão publicada.\n\n```bash\n$ git tag -a v1.0.0 -m "Primeira versão"\n$ git tag\nv1.0.0\n```\n\nO `-a` cria uma **tag anotada**, que guarda autor, data e mensagem, como um commit. Sem o `-a`, a tag é leve: só um nome, sem informação extra. Para marcar versões, a anotada é a recomendada, porque registra quem publicou e quando.\n\nSem argumentos, o `git tag` lista as tags em ordem alfabética. Uma tag vale como qualquer referência: `git show v1.0.0` abre o commit marcado, e `git diff v1.0.0` mostra tudo o que mudou desde a versão publicada.\n\nUm detalhe que surpreende: o `git push` comum não envia tags. Cada tag é enviada pelo nome, com `git push origin v1.0.0`, ou todas de uma vez com `git push --tags`. No GitHub, as tags enviadas aparecem na página do repositório e servem de base para as publicações de versão.\n\nO nome segue quase sempre o versionamento semântico, `v` seguido de três números: o primeiro muda quando algo quebra a compatibilidade, o segundo quando entra funcionalidade nova e o terceiro em correções. Você domina este passo quando marca uma versão com tag anotada e a envia para o remoto.',
          resources: [
            {
              label: "Pro Git: Criando tags (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Fundamentos-do-Git-Criando-Tags",
              kind: "doc",
            },
            {
              label: "Referência do git tag",
              url: "https://git-scm.com/docs/git-tag",
              kind: "doc",
            },
          ],
        },
        {
          id: "ferramentas.cherry-pick",
          title: "git cherry-pick: trazer um commit específico",
          description:
            "Copiar um único commit de outra branch para a atual, sem trazer o resto.",
          content:
            "Às vezes você precisa de um commit só de outra branch, e não da branch inteira. Uma correção feita no meio de uma funcionalidade inacabada, por exemplo, que precisa ir para a `main` hoje. O `git cherry-pick` copia esse commit para a branch em que você está:\n\n```bash\n$ git switch main\nSwitched to branch 'main'\n$ git cherry-pick c7d8e9f\n```\n\nO hash vem do `git log --oneline` da outra branch, e o do exemplo varia. O Git aplica as mesmas mudanças daquele commit na `main` e cria um commit novo, com a mesma mensagem e outro hash, respondendo como a um commit comum.\n\nEsse commit novo é uma cópia, não o original. Quando a branch de origem entrar na `main` mais tarde, as mesmas mudanças aparecem duas vezes no histórico, em dois commits diferentes. Na maioria dos casos o Git percebe que o conteúdo é igual e o merge passa sem conflito, mas o histórico fica com a duplicata.\n\nPor isso o cherry-pick é ferramenta de exceção, não de rotina. Ele resolve bem a correção urgente e o commit feito na branch errada. Para trazer várias mudanças, o caminho é merge ou rebase.\n\nComo o merge e o rebase, ele pode parar num conflito, quando as linhas em volta mudaram. A saída é a de sempre: resolver, `git add` e `git cherry-pick --continue`, ou desistir com `git cherry-pick --abort`. Você domina este passo quando traz um único commit de outra branch e explica por que ele ganhou outro hash.",
          resources: [
            {
              label: "Referência do git cherry-pick",
              url: "https://git-scm.com/docs/git-cherry-pick",
              kind: "doc",
            },
          ],
        },
        {
          id: "ferramentas.reflog",
          title: "git reflog: a rede de segurança",
          description:
            "O diário local de tudo para onde o HEAD apontou, e como ele resgata commits que pareciam perdidos.",
          content:
            "Um `git reset --hard` no commit errado, uma branch apagada com `-D`, um rebase que deu errado: os commits somem do `git log` e parecem perdidos. Quase nunca estão. O `git reflog` é um diário local de todos os lugares para onde o HEAD apontou, e os commits continuam lá:\n\n```bash\n$ git reflog\na1b2c3d (HEAD -> main) HEAD@{0}: reset: moving to HEAD~1\ne4f5a6b HEAD@{1}: commit: Adiciona filtro\n```\n\nA leitura é do mais recente para o mais antigo. A primeira linha é o reset que acabou de acontecer; a segunda é o commit que o reset tirou do histórico, com o hash ainda visível (os hashes do exemplo variam). Resgatar é voltar a branch para ele:\n\n```bash\n$ git reset --hard e4f5a6b\nHEAD is now at e4f5a6b Adiciona filtro\n```\n\nO commit voltou para a `main`, como se o reset nunca tivesse acontecido. Para resgatar uma branch apagada, o caminho é parecido: achar o último commit dela no reflog e criar uma branch nova apontando para ele, com `git branch filtro e4f5a6b`.\n\nOs limites precisam ficar claros. O reflog é da sua máquina, não vai para o remoto, e os registros expiram: por padrão, entradas de commits que ficaram fora de qualquer branch duram pelo menos 30 dias. E ele só conhece o que virou commit: edição descartada sem nunca ter sido gravada não aparece nele.\n\nVocê domina este passo quando resgata um commit perdido pelo reflog e explica por que commitar cedo é o que torna esse resgate possível.",
          resources: [
            {
              label: "Pro Git: Manutenção e recuperação de dados (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/Git-Internals-Por-Dentro-do-Git-Manuten%c3%a7%c3%a3o-e-Recupera%c3%a7%c3%a3o-de-Dados",
              kind: "doc",
            },
            {
              label: "Referência do git reflog",
              url: "https://git-scm.com/docs/git-reflog",
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
        "Versionar um programa de verdade do primeiro commit ao pull request, e os caminhos que se abrem depois.",
      children: [
        {
          id: "projeto.cli",
          title: "Projeto: versionar a CLI de tarefas",
          description:
            "O gerenciador de tarefas de terminal das trilhas de JavaScript e Python, agora com histórico, branches e pull request.",
          project: "cli-tarefas-terminal",
        },
        {
          id: "projeto.roteiro",
          title: "Roteiro: do init ao pull request",
          description:
            "A ordem de trabalho do projeto, usando cada seção da trilha em um momento do desenvolvimento.",
          content:
            "O projeto desta trilha é o mesmo das trilhas JavaScript do Zero e Python do Zero: a CLI de tarefas no terminal, com os comandos para adicionar, listar e concluir tarefas. Se você já o construiu numa delas, aqui ele ganha o que faltava, um histórico que conta como foi feito. Se ainda não, construa e versione ao mesmo tempo.\n\nO roteiro passa por cada seção da trilha. Comece com `git init`, o `.gitignore` e um primeiro commit com o README, como na seção O primeiro repositório. Depois, uma branch por comando da CLI, como na seção Fluxos de trabalho:\n\n```bash\n$ git switch -c comando-concluir\nSwitched to a new branch 'comando-concluir'\n$ git push -u origin comando-concluir\n```\n\nCada comando entra por pull request no seu próprio repositório do GitHub, mesmo trabalhando sozinho: abra, releia o diff inteiro, só então faça o merge pela plataforma e apague a branch.\n\nProvoque um conflito de propósito: em duas branches, mude a mesma mensagem de ajuda da CLI de formas diferentes e junte as duas, resolvendo como na seção Conflitos. Use `git stash` pelo menos uma vez para interromper uma tarefa, e desfaça um commit com `git revert` depois de enviá-lo.\n\nNo fim, marque a primeira versão com `git tag -a v1.0.0` e envie a tag. Ao terminar, o `git log --oneline --graph --all` do seu repositório deve contar a história do projeto sozinho. Você domina este passo quando outra pessoa entende como a CLI foi construída lendo só o seu histórico.",
          resources: [
            {
              label: "Pro Git: Contribuindo para um projeto no GitHub (pt-BR)",
              url: "https://git-scm.com/book/pt-br/v2/GitHub-Contribuindo-para-um-Projeto",
              kind: "doc",
            },
          ],
        },
        {
          id: "projeto.caminhos",
          title: "Próximos caminhos",
          description:
            "Onde o Git aparece depois desta trilha: nas trilhas de área e na rotina de qualquer time.",
          content:
            "O Git não é uma área, é a ferramenta que todas as áreas usam. Terminar esta trilha não aponta para um destino só: ela entra na bagagem de qualquer caminho que você escolher.\n\nNas trilhas **Front-end do Zero** e **Back-end do Zero**, o passo Git e GitHub resume o que você viu aqui em três comandos; agora você chega nele sabendo o que acontece por baixo de cada um, e o pull request deixa de ser um botão misterioso. Na **Full-stack do Zero**, o mesmo passo aparece nos fundamentos.\n\nNa trilha **DevOps do Zero**, o Git é o começo de tudo: o fluxo de trabalho com branches e pull request da seção Fluxos de trabalho é o gatilho dos testes automáticos e das publicações, e as tags da Caixa de ferramentas marcam o que foi para produção.\n\nSe você veio de **JavaScript do Zero** ou **Python do Zero**, volte aos exercícios dessas trilhas e versione cada um: um repositório por projeto, commits pequenos, uma branch por experimento.\n\nO que vale levar desta trilha, mais do que qualquer comando, são três hábitos: `git status` antes de agir, commit pequeno com mensagem que explica, e nunca reescrever o que outras pessoas já têm. Com eles, os comandos que você ainda não conhece se aprendem na hora, com a documentação ao lado.\n\nVocê domina este passo, e a trilha, quando entra num projeto de time, clona o repositório e sabe o que fazer da primeira branch ao merge.",
        },
      ],
    },
  ],
};
