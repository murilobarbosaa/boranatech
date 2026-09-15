// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool git). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "git",
  "questions": [
    {
      "id": "git-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você quer que todos os repositórios deste computador usem o nome Ana Souza nos commits. Qual comando faz isso?",
      "alternativas": {
        "a": "git config --global user.name \"Ana Souza\"",
        "b": "git config user.name \"Ana Souza\"",
        "c": "git config --local user.name \"Ana Souza\"",
        "d": "git config --global user.name Ana Souza"
      },
      "correta": "a",
      "explicacao": "O --global grava no seu usuário e vale para todo repositório da máquina. Sem ele, ou com --local, a configuração vale só para o repositório atual. Sem aspas, o terminal separa Ana e Souza em dois argumentos, e o nome gravado sai incompleto.",
      "fonte": "fundamentos.config"
    },
    {
      "id": "git-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você precisa verificar se o Git está instalado corretamente. Qual comando você deve usar?",
      "alternativas": {
        "a": "git --help",
        "b": "git --version",
        "c": "git check-version",
        "d": "git verify"
      },
      "correta": "b",
      "explicacao": "O git --version responde com a versão instalada, o que prova que o terminal encontra o Git. O --help mostra a ajuda, e check-version e verify não são comandos do Git.",
      "fonte": "fundamentos.instalar"
    },
    {
      "id": "git-ini-03",
      "nivel": "iniciante",
      "pergunta": "Qual alternativa completa a lacuna para que todo repositório novo criado neste computador comece na branch main?",
      "alternativas": {
        "a": "master",
        "b": "main",
        "c": "default",
        "d": "branch"
      },
      "correta": "b",
      "explicacao": "O init.defaultBranch define o nome da branch inicial dos repositórios criados com git init. Com main, todo repositório novo começa na main; master é o nome antigo, e os outros valores criariam branches com esses nomes.",
      "fonte": "fundamentos.config",
      "tipo": "completar",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git config --global init.defaultBranch ____"
      },
      "alternativasCodigo": true
    },
    {
      "id": "git-ini-04",
      "nivel": "iniciante",
      "pergunta": "Este código deveria gravar o nome completo Ana Souza para os commits, e o segundo comando confere o valor gravado. Qual é o defeito?",
      "alternativas": {
        "a": "Falta a opção --global no primeiro comando",
        "b": "O nome não está entre aspas: o terminal separa Ana e Souza, e o Git grava só Ana",
        "c": "O segundo comando precisa de --global para ler o valor",
        "d": "O user.name só aceita uma palavra"
      },
      "correta": "b",
      "explicacao": "Sem aspas, Ana e Souza chegam ao Git como dois argumentos separados, e o valor gravado é só Ana. Com git config --global user.name \"Ana Souza\", o segundo comando responde Ana Souza.",
      "fonte": "fundamentos.config",
      "tipo": "erro",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git config --global user.name Ana Souza\n$ git config user.name",
        "saidaEsperada": "Ana Souza"
      }
    },
    {
      "id": "git-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você criou um novo projeto e deseja que o Git comece a acompanhar as alterações. Qual comando você deve usar?",
      "alternativas": {
        "a": "git start",
        "b": "git track",
        "c": "git init",
        "d": "git create"
      },
      "correta": "c",
      "explicacao": "O comando correto para iniciar um repositório Git é o 'git init', que transforma uma pasta comum em um repositório Git.",
      "fonte": "repositorio.init"
    },
    {
      "id": "git-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você quer ver, arquivo por arquivo, quais estão modificados, quais estão no stage e quais são novos desde o último commit. Qual comando mostra isso?",
      "alternativas": {
        "a": "git changes",
        "b": "git status",
        "c": "git diff",
        "d": "git log"
      },
      "correta": "b",
      "explicacao": "O git status mostra a situação de cada arquivo: modificado, no stage ou não rastreado. O git diff mostra as linhas alteradas, não a situação de cada arquivo, e o git log mostra o histórico de commits.",
      "fonte": "repositorio.status"
    },
    {
      "id": "git-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você fez várias alterações em arquivos, mas deseja gravar apenas algumas delas no próximo commit. O que você deve fazer?",
      "alternativas": {
        "a": "Usar git commit diretamente",
        "b": "Usar git add para selecionar as alterações",
        "c": "Usar git push para enviar as alterações",
        "d": "Usar git status para ver as alterações"
      },
      "correta": "b",
      "explicacao": "Para selecionar quais alterações irão para o próximo commit, você deve usar o comando 'git add' para adicionar as mudanças desejadas ao stage.",
      "fonte": "repositorio.add"
    },
    {
      "id": "git-ini-08",
      "nivel": "iniciante",
      "pergunta": "Qual é a função do arquivo .gitignore em um repositório Git?",
      "alternativas": {
        "a": "Ele lista os arquivos que devem ser rastreados",
        "b": "Ele lista os arquivos que devem ser ignorados pelo Git",
        "c": "Ele é usado para armazenar senhas",
        "d": "Ele é um backup do repositório"
      },
      "correta": "b",
      "explicacao": ".gitignore é usado para especificar quais arquivos ou pastas o Git deve ignorar, evitando que sejam rastreados no histórico.",
      "fonte": "repositorio.gitignore"
    },
    {
      "id": "git-ini-09",
      "nivel": "iniciante",
      "pergunta": "Num repositório na main em que a única edição pendente é uma linha nova em app.js, este código deveria gravar no commit essa linha e também a acrescentada pelo echo, e o último comando confere que não sobrou nada pendente (o hash varia). Qual é o defeito?",
      "alternativas": {
        "a": "A edição feita depois do git add ficou fora do stage; faltou outro git add antes do commit",
        "b": "O git add só aceita o ponto, não o nome de um arquivo",
        "c": "O echo com >> apaga o conteúdo anterior de app.js",
        "d": "O git status precisa rodar antes do commit para funcionar"
      },
      "correta": "a",
      "explicacao": "O git add guarda a versão do arquivo naquele instante. A linha acrescentada depois dele ficou fora do stage, então o commit não a levou e o git status ainda mostra app.js modificado. Com um novo git add antes do commit, o status sai limpo.",
      "fonte": "repositorio.add",
      "tipo": "erro",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git add app.js\n$ echo \"// fim\" >> app.js\n$ git commit -m \"Corrige total\"\n$ git status",
        "saidaEsperada": "[main a1b2c3d] Corrige total\n 1 file changed, 2 insertions(+)\nOn branch main\nnothing to commit, working tree clean"
      }
    },
    {
      "id": "git-ini-10",
      "nivel": "iniciante",
      "pergunta": "Qual alternativa completa a lacuna para que o comando mande para o stage todas as alterações a partir da pasta atual?",
      "alternativas": {
        "a": "commit",
        "b": "add",
        "c": "restore",
        "d": "status"
      },
      "correta": "b",
      "explicacao": "O git add . coloca no stage tudo o que mudou a partir da pasta atual. O git restore . descarta as edições, o git status . só mostra a situação e o git commit . grava direto, sem passar pelo stage como pede a pergunta.",
      "fonte": "repositorio.add",
      "tipo": "completar",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git ____ ."
      },
      "alternativasCodigo": true
    },
    {
      "id": "git-ini-11",
      "nivel": "iniciante",
      "pergunta": "Num repositório na main em que nada mudou desde o último commit e o stage está vazio, o que este comando imprime?",
      "alternativas": {
        "a": "On branch main\nnothing to commit, working tree clean",
        "b": "1 file changed, 1 insertion(+)",
        "c": "Everything up-to-date",
        "d": "Already up to date."
      },
      "correta": "a",
      "explicacao": "Com o stage vazio e nenhuma alteração, o commit recusa e explica que não há nada a gravar, com a mesma resposta do git status num repositório limpo. Everything up-to-date é resposta do git push e Already up to date. é do git pull.",
      "fonte": "repositorio.commit",
      "tipo": "saida",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git commit -m \"Adiciona README\""
      },
      "alternativasCodigo": true
    },
    {
      "id": "git-ini-12",
      "nivel": "iniciante",
      "pergunta": "Ao usar o comando `git log --oneline`, o que você consegue visualizar?",
      "alternativas": {
        "a": "O histórico de commits em ordem do mais novo para o mais antigo.",
        "b": "Os arquivos que foram alterados em cada commit.",
        "c": "A lista de branches disponíveis no repositório.",
        "d": "O conteúdo completo de cada arquivo em cada commit."
      },
      "correta": "a",
      "explicacao": "O comando `git log --oneline` exibe o histórico de commits de forma resumida, uma linha por commit com o hash curto e a mensagem, do mais novo para o mais antigo.",
      "fonte": "historico.log"
    },
    {
      "id": "git-ini-13",
      "nivel": "iniciante",
      "pergunta": "Qual é a melhor prática ao usar `git diff` antes de um commit?",
      "alternativas": {
        "a": "Usar `git diff --staged` para revisar as alterações que serão gravadas.",
        "b": "Usar `git diff` para ver as alterações não adicionadas ao stage.",
        "c": "Usar `git diff --stat` para visualizar o resumo das alterações.",
        "d": "Usar `git diff` sem argumentos para ver tudo que foi mudado."
      },
      "correta": "a",
      "explicacao": "A prática recomendada é usar `git diff --staged` para revisar as alterações que serão gravadas antes de um commit.",
      "fonte": "historico.diff"
    },
    {
      "id": "git-ini-14",
      "nivel": "iniciante",
      "pergunta": "Estando na main, qual alternativa completa a lacuna para que o comando resuma o commit imediatamente anterior ao atual?",
      "alternativas": {
        "a": "HEAD",
        "b": "HEAD~1",
        "c": "HEAD~2",
        "d": "main"
      },
      "correta": "b",
      "explicacao": "HEAD é o commit em que você está, e o til com número conta para trás: HEAD~1 é o anterior, HEAD~2 o de antes dele. Estando na main, main aponta para o mesmo commit que HEAD.",
      "fonte": "historico.show",
      "tipo": "completar",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git show --stat --oneline ____"
      },
      "alternativasCodigo": true
    },
    {
      "id": "git-ini-15",
      "nivel": "iniciante",
      "pergunta": "Estando na main, cujo último commit é Marca tarefa como feita, este comando deveria resumir esse commit (os hashes variam). Qual é o defeito?",
      "alternativas": {
        "a": "HEAD~1 aponta para o commit anterior ao atual; o commit atual é HEAD",
        "b": "As opções --stat e --oneline não podem ser usadas juntas",
        "c": "O git show só aceita hash, não referência relativa",
        "d": "Falta o nome de um arquivo no fim do comando"
      },
      "correta": "a",
      "explicacao": "HEAD~1 é o commit anterior ao atual, então o comando resume o commit errado. Para o commit em que você está, a referência é HEAD: git show --stat --oneline HEAD.",
      "fonte": "historico.show",
      "tipo": "erro",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git show --stat --oneline HEAD~1",
        "saidaEsperada": "e4f5a6b (HEAD -> main) Marca tarefa como feita\n app.js | 4 +++-\n 1 file changed, 3 insertions(+), 1 deletion(-)"
      }
    },
    {
      "id": "git-int-01",
      "nivel": "intermediario",
      "pergunta": "Você editou o arquivo app.js e deseja descartar essas edições, retornando ao último commit. Qual comando você deve usar?",
      "alternativas": {
        "a": "git restore app.js",
        "b": "git reset app.js",
        "c": "git switch app.js",
        "d": "git revert app.js"
      },
      "correta": "a",
      "explicacao": "O git restore app.js descarta as edições e volta o arquivo ao último commit. O git reset app.js só mexeria no stage, o git switch troca de branch e o git revert desfaz commits, não edições de arquivo.",
      "fonte": "desfazer.restore"
    },
    {
      "id": "git-int-02",
      "nivel": "intermediario",
      "pergunta": "Você adicionou um arquivo ao stage por engano e deseja removê-lo sem perder as edições feitas. Qual comando você utiliza?",
      "alternativas": {
        "a": "git restore --staged app.js",
        "b": "git rm app.js",
        "c": "git restore app.js",
        "d": "git commit --amend"
      },
      "correta": "a",
      "explicacao": "O git restore --staged app.js tira o arquivo do stage e mantém as edições no diretório de trabalho. Sem o --staged, o restore descarta as edições; o git rm apaga o arquivo, e o --amend refaz o último commit.",
      "fonte": "desfazer.unstage"
    },
    {
      "id": "git-int-03",
      "nivel": "intermediario",
      "pergunta": "Qual alternativa completa a lacuna para que o comando desfaça o último commit mantendo as mudanças no stage, prontas para um novo commit?",
      "alternativas": {
        "a": "--soft",
        "b": "--hard",
        "c": "--mixed",
        "d": "--no-edit"
      },
      "correta": "a",
      "explicacao": "O --soft desfaz o commit e devolve as mudanças para o stage. O --mixed, o modo padrão, devolve para o diretório de trabalho, fora do stage; o --hard descarta as mudanças, e o --no-edit não é opção do reset.",
      "fonte": "desfazer.reset",
      "tipo": "completar",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git reset ____ HEAD~1"
      },
      "alternativasCodigo": true
    },
    {
      "id": "git-int-04",
      "nivel": "intermediario",
      "pergunta": "O último commit da main alterou só app.js e ainda não foi enviado. Este código deveria desfazer esse commit mantendo as mudanças no stage, e o último comando confere o resultado. Qual é o defeito?",
      "alternativas": {
        "a": "HEAD~1 aponta para o próximo commit, não para o anterior",
        "b": "O --hard descarta as mudanças do commit desfeito; para mantê-las no stage, o modo é --soft",
        "c": "O git reset não desfaz commits, só arquivos",
        "d": "O git status --short não mostra arquivos no stage"
      },
      "correta": "b",
      "explicacao": "Com --hard, a branch volta um commit e as mudanças de app.js são descartadas, então o status sai vazio. Com --soft, elas voltam para o stage e o status mostra app.js modificado na primeira coluna.",
      "fonte": "desfazer.reset",
      "tipo": "erro",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git reset --hard HEAD~1\n$ git status --short",
        "saidaEsperada": "M  app.js"
      }
    },
    {
      "id": "git-int-05",
      "nivel": "intermediario",
      "pergunta": "Você precisa criar uma nova branch chamada 'desenvolvimento' e já entrar nela. Qual comando você deve usar?",
      "alternativas": {
        "a": "git branch -c desenvolvimento",
        "b": "git switch -c desenvolvimento",
        "c": "git switch desenvolvimento",
        "d": "git create -b desenvolvimento"
      },
      "correta": "b",
      "explicacao": "O git switch -c cria a branch e já entra nela. Sem o -c, o switch só troca para uma branch que já existe; o git branch -c copia a branch atual sem entrar na cópia, e git create não é comando do Git.",
      "fonte": "branches.criar"
    },
    {
      "id": "git-int-06",
      "nivel": "intermediario",
      "pergunta": "Você está na main, que não ganhou nenhum commit desde que a branch filtro nasceu, e roda git merge filtro. O que acontece?",
      "alternativas": {
        "a": "O Git cria um commit de merge com dois pais",
        "b": "A main avança até o último commit da filtro, sem criar commit novo",
        "c": "O Git para num conflito, porque as duas branches mudaram",
        "d": "A branch filtro é apagada depois do merge"
      },
      "correta": "b",
      "explicacao": "Como a main não andou, os commits da filtro estão em linha reta à frente dela, e o merge é fast-forward: o nome main só avança. Commit de merge e conflito só aparecem quando as duas branches andaram.",
      "fonte": "branches.ff"
    },
    {
      "id": "git-int-07",
      "nivel": "intermediario",
      "pergunta": "Qual alternativa completa a lacuna para que o comando jogue fora a branch experimento, cujos commits nunca entraram em outra branch e não vão entrar?",
      "alternativas": {
        "a": "-d",
        "b": "-D",
        "c": "-m",
        "d": "-c"
      },
      "correta": "b",
      "explicacao": "O -d recusa apagar uma branch com commits que não entraram na branch atual. Para descartá-la de propósito, o -D força a remoção. O -m renomeia e o -c copia a branch atual.",
      "fonte": "branches.apagar",
      "tipo": "completar",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git branch ____ experimento"
      },
      "alternativasCodigo": true
    },
    {
      "id": "git-int-08",
      "nivel": "intermediario",
      "pergunta": "Você está na main, que ganhou um commit mexendo só no README.md depois que a branch filtro nasceu. A filtro tem um commit que acrescentou 12 linhas ao app.js. O que este comando imprime?",
      "alternativas": {
        "a": "Merge made by the 'ort' strategy.\n app.js | 12 ++++++++++++\n 1 file changed, 12 insertions(+)",
        "b": "Already up to date.",
        "c": "Auto-merging app.js\nCONFLICT (content): Merge conflict in app.js",
        "d": "Everything up-to-date"
      },
      "correta": "a",
      "explicacao": "As duas branches andaram, então não há fast-forward: o Git cria um commit de merge, com a mensagem padrão por causa do --no-edit, e mostra o resumo do que chegou da filtro. Como cada lado mexeu num arquivo diferente, não há conflito.",
      "fonte": "branches.merge-commit",
      "tipo": "saida",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git merge --no-edit filtro"
      },
      "alternativasCodigo": true
    },
    {
      "id": "git-int-09",
      "nivel": "intermediario",
      "pergunta": "Durante um merge, você se depara com um conflito em um arquivo. O que você deve fazer para resolver esse conflito?",
      "alternativas": {
        "a": "Editar o arquivo para remover as marcações de conflito e decidir qual versão manter.",
        "b": "Fazer um commit imediatamente sem resolver o conflito.",
        "c": "Excluir o arquivo que está em conflito e continuar o merge.",
        "d": "Rodar o comando git merge novamente para tentar resolver automaticamente."
      },
      "correta": "a",
      "explicacao": "A opção correta é editar o arquivo para remover as marcações de conflito e decidir qual versão manter, pois isso é necessário para concluir o merge corretamente.",
      "fonte": "conflitos.resolver"
    },
    {
      "id": "git-int-10",
      "nivel": "intermediario",
      "pergunta": "Você está em um merge e o Git sinaliza um conflito. O que significa a marcação 'UU' ao rodar o comando 'git status --short'?",
      "alternativas": {
        "a": "O arquivo foi combinado corretamente e não há conflitos.",
        "b": "O arquivo está em conflito e precisa ser resolvido antes de continuar.",
        "c": "O arquivo foi removido e não está mais no repositório.",
        "d": "O arquivo foi adicionado ao índice e está pronto para commit."
      },
      "correta": "b",
      "explicacao": "A marcação 'UU' indica que o arquivo está em conflito e precisa ser resolvido antes de continuar o merge.",
      "fonte": "conflitos.marcacoes"
    },
    {
      "id": "git-int-11",
      "nivel": "intermediario",
      "pergunta": "Num merge da branch titulo-novo na main, você já editou index.html e tirou as marcações de conflito. Este código deveria marcar o arquivo como resolvido e concluir o merge, e o último comando confere o commit mais recente (o hash varia). Qual é o defeito?",
      "alternativas": {
        "a": "O git add não pode ser usado num arquivo que teve conflito",
        "b": "O git merge --abort cancela o merge e descarta a resolução; para concluir, o comando é git commit ou git merge --continue",
        "c": "O git log --oneline não mostra commits de merge",
        "d": "Falta rodar git merge titulo-novo de novo antes do log"
      },
      "correta": "b",
      "explicacao": "O git add marca o conflito como resolvido, mas o --abort em seguida devolve o repositório ao estado de antes do merge, e o log mostra o commit antigo. Com git commit --no-edit no lugar do --abort, o último commit passa a ser o de merge.",
      "fonte": "conflitos.resolver",
      "tipo": "erro",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git add index.html\n$ git merge --abort\n$ git log --oneline -1",
        "saidaEsperada": "[main a1b2c3d] Merge branch 'titulo-novo'\na1b2c3d (HEAD -> main) Merge branch 'titulo-novo'"
      }
    },
    {
      "id": "git-int-12",
      "nivel": "intermediario",
      "pergunta": "Num repositório remoto, o que acontece quando você executa `git fetch`?",
      "alternativas": {
        "a": "Baixa novos commits e atualiza sua branch local.",
        "b": "Baixa novos commits e mescla com sua branch local.",
        "c": "Baixa novos commits e atualiza a referência de origin/main.",
        "d": "Baixa novos commits e deleta sua branch local."
      },
      "correta": "c",
      "explicacao": "O `git fetch` atualiza sua cópia de `origin/main`, mas não altera sua branch local.",
      "fonte": "remotos.fetch-pull"
    },
    {
      "id": "git-int-13",
      "nivel": "intermediario",
      "pergunta": "Ao clonar um repositório com `git clone`, o que é configurado automaticamente?",
      "alternativas": {
        "a": "O repositório local é criado sem histórico.",
        "b": "O remoto é registrado com o apelido origin.",
        "c": "A branch local é desconectada da branch remota.",
        "d": "O repositório é criado vazio e sem commits."
      },
      "correta": "b",
      "explicacao": "O `git clone` registra automaticamente o remoto com o apelido `origin`.",
      "fonte": "remotos.clone"
    },
    {
      "id": "git-int-14",
      "nivel": "intermediario",
      "pergunta": "Qual alternativa completa a lacuna para que o remoto fique registrado com o apelido padrão que o git push -u origin main, logo depois, espera?",
      "alternativas": {
        "a": "origin",
        "b": "main",
        "c": "push",
        "d": "add"
      },
      "correta": "a",
      "explicacao": "O git remote add recebe o apelido e depois o endereço, e origin é o apelido padrão que o push seguinte usa. Qualquer outro nome seria aceito, mas o git push -u origin main não o encontraria.",
      "fonte": "remotos.push",
      "tipo": "completar",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git remote add ____ https://github.com/voce/tarefas.git"
      },
      "alternativasCodigo": true
    },
    {
      "id": "git-int-15",
      "nivel": "intermediario",
      "pergunta": "Num repositório sem nenhum remoto, este código deveria registrar o remoto com o apelido origin, e o segundo comando lista os apelidos registrados. Qual é o defeito?",
      "alternativas": {
        "a": "O endereço precisa ser SSH, não HTTPS",
        "b": "A ordem está invertida: o git remote add recebe primeiro o apelido e depois o endereço",
        "c": "O git remote sem -v não lista nada",
        "d": "Falta um git push antes do git remote"
      },
      "correta": "b",
      "explicacao": "Com a ordem invertida, o Git tenta usar o endereço como apelido e recusa, porque ele não é um nome válido, e nenhum remoto é registrado. Com git remote add origin e o endereço depois, o segundo comando responde origin.",
      "fonte": "remotos.push",
      "tipo": "erro",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git remote add https://github.com/voce/tarefas.git origin\n$ git remote",
        "saidaEsperada": "origin"
      }
    },
    {
      "id": "git-av-01",
      "nivel": "avancado",
      "pergunta": "Antes de criar a branch de uma tarefa nova, o que você faz para que ela nasça do ponto mais recente da main do remoto?",
      "alternativas": {
        "a": "Criar a branch e depois rodar `git merge main` nela.",
        "b": "Criar a branch e depois rodar `git rebase main` nela.",
        "c": "Rodar `git switch main` e `git pull`, e só então criar a branch.",
        "d": "Rodar `git push` da main antes de criar a branch."
      },
      "correta": "c",
      "explicacao": "Só o git pull na main traz os commits novos do remoto; merge ou rebase da main local, sem esse pull, usam uma main desatualizada. Com a main atualizada, a branch nova já nasce do ponto mais recente.",
      "fonte": "fluxos.feature"
    },
    {
      "id": "git-av-02",
      "nivel": "avancado",
      "pergunta": "Você precisa revisar uma branch que foi enviada para um pull request. Qual é a melhor prática ao revisar?",
      "alternativas": {
        "a": "Fazer o merge diretamente na branch sem revisar.",
        "b": "Revisar o código e pedir ajustes antes de aprovar o merge.",
        "c": "Aprovar o merge sem revisar, pois o código já foi testado.",
        "d": "Fazer comentários apenas no final da revisão."
      },
      "correta": "b",
      "explicacao": "A revisão é fundamental para garantir a qualidade do código antes do merge, permitindo ajustes necessários.",
      "fonte": "fluxos.pr"
    },
    {
      "id": "git-av-03",
      "nivel": "avancado",
      "pergunta": "Você está em uma branch chamada `nova-funcionalidade` e precisa aplicar as mudanças mais recentes da `main`. O que você deve evitar?",
      "alternativas": {
        "a": "Fazer um rebase da `main` na sua branch.",
        "b": "Fazer um merge da `main` na sua branch.",
        "c": "Fazer um rebase em commits que já foram enviados para a `main`.",
        "d": "Atualizar sua branch com `git pull`."
      },
      "correta": "c",
      "explicacao": "Reescrever commits que já estão na `main` pode causar conflitos e duplicação de histórico.",
      "fonte": "fluxos.quando-nao"
    },
    {
      "id": "git-av-04",
      "nivel": "avancado",
      "pergunta": "Ao usar o comando `git rebase`, o que acontece com os commits da sua branch?",
      "alternativas": {
        "a": "Eles permanecem inalterados na branch.",
        "b": "Eles são mesclados com os commits da `main` criando um novo commit de merge.",
        "c": "Eles são reaplicados em cima do último commit da `main`, criando novos hashes.",
        "d": "Eles são excluídos e não aparecem mais no histórico."
      },
      "correta": "c",
      "explicacao": "O `git rebase` reaplica os commits da sua branch, criando novos commits com novos hashes.",
      "fonte": "fluxos.rebase"
    },
    {
      "id": "git-av-05",
      "nivel": "avancado",
      "pergunta": "Qual comando você deve usar para forçar o push de uma branch que foi rebaseada, garantindo que não sobrescreva alterações de outros?",
      "alternativas": {
        "a": "`git push --force`",
        "b": "`git push --force-with-lease`",
        "c": "`git push --all`",
        "d": "`git push -u origin`"
      },
      "correta": "b",
      "explicacao": "O `--force-with-lease` garante que você não sobrescreva alterações que possam ter sido enviadas por outros desde o último fetch.",
      "fonte": "fluxos.quando-nao"
    },
    {
      "id": "git-av-06",
      "nivel": "avancado",
      "pergunta": "A main e a filtro ganharam, cada uma, um commit que a outra não tem. Este código deveria reaplicar os commits da branch filtro depois do último commit da main. Qual é o defeito?",
      "alternativas": {
        "a": "O git rebase só aceita hash, não nome de branch",
        "b": "O rebase reaplica a branch em que você está; para mover a filtro, é preciso estar nela e rodar git rebase main",
        "c": "Falta um git merge filtro antes do rebase",
        "d": "O rebase precisa da opção --continue para começar"
      },
      "correta": "b",
      "explicacao": "O git rebase move a branch atual. Estando na main, o comando reaplica os commits da main depois da filtro, o contrário do pedido. Com git switch filtro e git rebase main, a resposta é a de rebase da filtro.",
      "fonte": "fluxos.rebase",
      "tipo": "erro",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git switch main\n$ git rebase filtro",
        "saidaEsperada": "Switched to branch 'filtro'\nSuccessfully rebased and updated refs/heads/filtro."
      }
    },
    {
      "id": "git-av-07",
      "nivel": "avancado",
      "pergunta": "Você precisa guardar suas edições atuais, sem fazer commit, para trocar de branch sem perder nada. Qual comando você deve usar?",
      "alternativas": {
        "a": "git stash",
        "b": "git commit",
        "c": "git add",
        "d": "git reset"
      },
      "correta": "a",
      "explicacao": "O git stash guarda as edições numa pilha e deixa o diretório de trabalho limpo, sem criar commit. O git add só coloca no stage, que continua indo junto na troca, e o git reset não guarda nada.",
      "fonte": "ferramentas.stash"
    },
    {
      "id": "git-av-08",
      "nivel": "avancado",
      "pergunta": "Você precisa marcar a versão 1.0.0 do seu projeto com uma tag anotada. Qual comando você deve usar?",
      "alternativas": {
        "a": "git tag v1.0.0",
        "b": "git tag -d v1.0.0",
        "c": "git tag -l v1.0.0",
        "d": "git tag -a v1.0.0 -m \"Primeira versão\""
      },
      "correta": "d",
      "explicacao": "O -a cria uma tag anotada, com autor, data e a mensagem do -m. Sem opção, a tag criada é leve; o -d apaga e o -l lista tags.",
      "fonte": "ferramentas.tag"
    },
    {
      "id": "git-av-09",
      "nivel": "avancado",
      "pergunta": "Você quer trazer um commit específico de outra branch para a sua branch atual. Qual comando deve ser utilizado?",
      "alternativas": {
        "a": "git cherry-pick <hash>",
        "b": "git merge <hash>",
        "c": "git rebase <hash>",
        "d": "git pull <hash>"
      },
      "correta": "a",
      "explicacao": "O comando `git cherry-pick <hash>` é usado para trazer um único commit específico de outra branch.",
      "fonte": "ferramentas.cherry-pick"
    },
    {
      "id": "git-av-10",
      "nivel": "avancado",
      "pergunta": "Logo depois de um git reset --hard HEAD~1 que tirou da main o commit Adiciona filtro, o reflog mostra as linhas do trecho (os hashes variam). Qual alternativa completa a lacuna para trazer esse commit de volta?",
      "alternativas": {
        "a": "HEAD@{0}",
        "b": "HEAD@{1}",
        "c": "HEAD~1",
        "d": "a1b2c3d"
      },
      "correta": "b",
      "explicacao": "HEAD@{0} é a posição atual, a do próprio reset, e a1b2c3d é o mesmo commit. HEAD~1 volta ainda mais na main. O commit perdido está em HEAD@{1}, a posição de antes do reset.",
      "fonte": "ferramentas.reflog",
      "tipo": "completar",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git reflog\na1b2c3d (HEAD -> main) HEAD@{0}: reset: moving to HEAD~1\ne4f5a6b HEAD@{1}: commit: Adiciona filtro\n$ git reset --hard ____"
      },
      "alternativasCodigo": true
    },
    {
      "id": "git-av-11",
      "nivel": "avancado",
      "pergunta": "Na main, você acabou de fazer o commit e4f5a6b Adiciona filtro e, logo em seguida, rodou git reset --hard HEAD~1, voltando para a1b2c3d Adiciona README (os hashes são de exemplo). O que este comando imprime?",
      "alternativas": {
        "a": "a1b2c3d (HEAD -> main) HEAD@{0}: reset: moving to HEAD~1\ne4f5a6b HEAD@{1}: commit: Adiciona filtro",
        "b": "e4f5a6b (HEAD -> main) Adiciona filtro\na1b2c3d Adiciona README",
        "c": "a1b2c3d (HEAD -> main) Adiciona README",
        "d": "HEAD is now at a1b2c3d Adiciona README"
      },
      "correta": "a",
      "explicacao": "O reflog lista os lugares por onde o HEAD passou, do mais recente para o mais antigo, e o -2 mostra só os dois últimos: o reset e, antes dele, o commit que o reset tirou da main. As outras alternativas são respostas do git log e do próprio reset.",
      "fonte": "ferramentas.reflog",
      "tipo": "saida",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git reflog -2"
      },
      "alternativasCodigo": true
    },
    {
      "id": "git-av-12",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo uma CLI e precisa iniciar um novo repositório. Qual comando você deve usar?",
      "alternativas": {
        "a": "git start",
        "b": "git create",
        "c": "git init",
        "d": "git new"
      },
      "correta": "c",
      "explicacao": "O comando 'git init' é o que inicia um novo repositório Git.",
      "fonte": "projeto.roteiro"
    },
    {
      "id": "git-av-13",
      "nivel": "avancado",
      "pergunta": "Ao começar um novo comando da CLI, você quer criar a branch comando-novo, entrar nela e enviá-la ligada à branch remota. Qual sequência faz isso?",
      "alternativas": {
        "a": "git switch -c comando-novo, depois git push -u origin comando-novo",
        "b": "git switch comando-novo, depois git push -u origin comando-novo",
        "c": "git branch -d comando-novo, depois git push -u origin comando-novo",
        "d": "git switch -c comando-novo, depois git pull origin comando-novo"
      },
      "correta": "a",
      "explicacao": "O git switch -c cria a branch e entra nela, e o git push -u envia e liga a branch local à remota. Sem o -c, o switch não cria a branch; o -d apaga, e o pull busca em vez de enviar.",
      "fonte": "projeto.roteiro"
    },
    {
      "id": "git-av-14",
      "nivel": "avancado",
      "pergunta": "Num repositório em que a branch comando-concluir ainda não existe, nem local nem no remoto, este comando deveria criá-la e já entrar nela. Qual é o defeito?",
      "alternativas": {
        "a": "O nome da branch não pode ter hífen",
        "b": "Sem o -c, o git switch só troca para uma branch que já existe; para criar e entrar, o comando é git switch -c comando-concluir",
        "c": "É preciso rodar git push antes de criar a branch",
        "d": "O git switch só funciona estando na main"
      },
      "correta": "b",
      "explicacao": "Sem o -c, o git switch procura uma branch com esse nome, não encontra e recusa. Com o -c, ele cria a branch a partir do commit atual e entra nela.",
      "fonte": "projeto.roteiro",
      "tipo": "erro",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git switch comando-concluir",
        "saidaEsperada": "Switched to a new branch 'comando-concluir'"
      }
    },
    {
      "id": "git-av-15",
      "nivel": "avancado",
      "pergunta": "No fim do projeto, qual alternativa completa a lacuna para marcar a primeira versão com uma tag anotada, que guarda autor, data e mensagem?",
      "alternativas": {
        "a": "-d",
        "b": "-l",
        "c": "-a",
        "d": "-v"
      },
      "correta": "c",
      "explicacao": "O -a cria a tag anotada, que guarda autor, data e a mensagem passada no -m. O -d apaga uma tag, o -l lista e o -v confere a assinatura de uma tag existente.",
      "fonte": "projeto.roteiro",
      "tipo": "completar",
      "codigo": {
        "linguagem": "bash",
        "trecho": "$ git tag ____ v1.0.0 -m \"Primeira versão\""
      },
      "alternativasCodigo": true
    }
  ]
};

export default pool;
