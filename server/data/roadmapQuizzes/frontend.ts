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
      "pergunta": "Você está desenvolvendo uma página e precisa enviar dados de um formulário para o servidor. Qual verbo HTTP você deve usar para essa ação?",
      "alternativas": {
        "a": "GET",
        "b": "POST",
        "c": "DELETE",
        "d": "OPTIONS"
      },
      "correta": "b",
      "explicacao": "O verbo POST é utilizado para enviar dados ao servidor, como em um formulário de cadastro.",
      "fonte": "web.http"
    },
    {
      "id": "frontend-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você digitou uma URL no navegador e não conseguiu acessar o site. O que pode ter acontecido com o DNS?",
      "alternativas": {
        "a": "O domínio pode estar expirado.",
        "b": "O servidor pode estar fora do ar.",
        "c": "O navegador não consegue traduzir o domínio para um IP.",
        "d": "O site pode estar bloqueado pelo firewall."
      },
      "correta": "c",
      "explicacao": "Se o DNS não consegue traduzir o domínio para um IP, o navegador não consegue encontrar o servidor correspondente.",
      "fonte": "web.dns"
    },
    {
      "id": "frontend-ini-03",
      "nivel": "iniciante",
      "pergunta": "Ao abrir uma página web, você percebe que o conteúdo aparece antes do estilo. O que pode ter causado isso?",
      "alternativas": {
        "a": "O CSS foi carregado antes do HTML.",
        "b": "O JavaScript foi executado antes do CSS.",
        "c": "O CSS foi carregado após o HTML.",
        "d": "O navegador não suporta o CSS."
      },
      "correta": "c",
      "explicacao": "Se o CSS é carregado após o HTML, a página pode aparecer sem estilo por um instante até que o CSS seja aplicado.",
      "fonte": "web.render"
    },
    {
      "id": "frontend-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você está inspecionando uma página no DevTools e deseja ver todos os arquivos que foram carregados. Qual aba você deve utilizar?",
      "alternativas": {
        "a": "Elements",
        "b": "Sources",
        "c": "Network",
        "d": "Console"
      },
      "correta": "c",
      "explicacao": "A aba Network lista todas as requisições feitas pela página, mostrando os arquivos carregados e seus status.",
      "fonte": "web.devtools"
    },
    {
      "id": "frontend-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você está criando um documento HTML e precisa garantir que o navegador interprete corretamente a página. O que você deve incluir na primeira linha do seu arquivo?",
      "alternativas": {
        "a": "<html>",
        "b": "<!DOCTYPE html>",
        "c": "<head>",
        "d": "<body>"
      },
      "correta": "b",
      "explicacao": "A declaração <!DOCTYPE html> informa ao navegador que o documento usa HTML moderno, evitando o modo de compatibilidade antigo.",
      "fonte": "html.estrutura"
    },
    {
      "id": "frontend-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você precisa adicionar uma imagem à sua página e garantir que pessoas com deficiência visual entendam o que ela representa. O que você deve fazer?",
      "alternativas": {
        "a": "Adicionar um texto alternativo no atributo alt da tag <img>",
        "b": "Usar um link para a imagem em vez de uma tag <img>",
        "c": "Colocar a imagem dentro de uma <div> sem descrição",
        "d": "Adicionar a imagem sem qualquer atributo alt"
      },
      "correta": "a",
      "explicacao": "Adicionar um texto alternativo no atributo alt da tag <img> é essencial para que leitores de tela possam descrever a imagem para usuários com deficiência visual.",
      "fonte": "html.a11y"
    },
    {
      "id": "frontend-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo um formulário e precisa garantir que os campos sejam acessíveis. O que você deve fazer para cada campo de entrada?",
      "alternativas": {
        "a": "Adicionar um <label> associado ao campo",
        "b": "Usar apenas placeholders para descrever os campos",
        "c": "Não usar rótulos, pois eles ocupam espaço",
        "d": "Criar um botão de envio sem conexão com o formulário"
      },
      "correta": "a",
      "explicacao": "Adicionar um <label> associado ao campo de entrada é fundamental para acessibilidade, pois permite que o rótulo seja clicável e ajude na identificação do campo.",
      "fonte": "html.forms"
    },
    {
      "id": "frontend-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você está criando uma página e precisa garantir que a estrutura de títulos esteja correta para melhorar a acessibilidade. O que você deve fazer?",
      "alternativas": {
        "a": "Usar um único <h1> e seguir com <h2>, <h3> em ordem",
        "b": "Usar <h1> e depois pular para <h4> para estilização",
        "c": "Usar múltiplos <h1> para diferentes seções",
        "d": "Usar <h2> como o primeiro título da página"
      },
      "correta": "a",
      "explicacao": "Usar um único <h1> e seguir com <h2>, <h3> em ordem garante uma hierarquia clara, essencial para leitores de tela.",
      "fonte": "html.a11y"
    },
    {
      "id": "frontend-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você está otimizando uma página para SEO e precisa adicionar uma descrição. Qual tag você deve usar e como deve ser o conteúdo?",
      "alternativas": {
        "a": "<meta name=\"description\" content=\"Descrição breve e relevante\">",
        "b": "<title>Descrição breve e relevante</title>",
        "c": "<meta charset=\"UTF-8\">",
        "d": "<h1>Descrição breve e relevante</h1>"
      },
      "correta": "a",
      "explicacao": "A tag <meta name=\"description\" content=\"...\"> deve conter uma descrição breve e relevante para ajudar os buscadores a entender o conteúdo da página.",
      "fonte": "html.seo"
    },
    {
      "id": "frontend-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você está estilizando um botão e deseja que ele mude de cor ao passar o mouse sobre ele. Qual é a melhor maneira de implementar isso usando CSS?",
      "alternativas": {
        "a": "Adicionar uma propriedade `background-color` diretamente no seletor do botão",
        "b": "Usar `transition` para suavizar a mudança de cor no estado `:hover`",
        "c": "Definir a cor de fundo no seletor de classe e usar `!important`",
        "d": "Criar uma animação com `@keyframes` para a mudança de cor"
      },
      "correta": "b",
      "explicacao": "Usar `transition` no estado `:hover` permite uma mudança suave de cor, melhorando a experiência do usuário.",
      "fonte": "css.animacoes"
    },
    {
      "id": "frontend-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você precisa criar um layout onde um elemento deve ocupar 50% da largura do seu elemento pai. Qual unidade você deve usar para garantir que o elemento se ajuste corretamente?",
      "alternativas": {
        "a": "Definir a largura como `50px`",
        "b": "Utilizar `50%` para a largura do elemento",
        "c": "Aplicar `50rem` para a largura do elemento",
        "d": "Definir a largura como `50vh`"
      },
      "correta": "b",
      "explicacao": "A unidade `%` é relativa ao elemento pai, garantindo que o elemento ocupe 50% da largura disponível.",
      "fonte": "css.boxmodel"
    },
    {
      "id": "frontend-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você está criando um layout onde um elemento deve ser posicionado em relação ao seu pai, mas sem afetar o fluxo dos outros elementos. Qual propriedade CSS você deve usar?",
      "alternativas": {
        "a": "Definir `position: static` para o elemento",
        "b": "Usar `position: relative` para o pai e `position: absolute` para o filho",
        "c": "Aplicar `position: fixed` ao elemento",
        "d": "Definir `position: sticky` para o elemento"
      },
      "correta": "b",
      "explicacao": "`position: absolute` permite que o elemento seja posicionado em relação ao seu pai com `position: relative`, sem afetar o fluxo dos elementos vizinhos.",
      "fonte": "css.posicionamento"
    },
    {
      "id": "frontend-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você está configurando seu ambiente de desenvolvimento. Qual extensão do VS Code é essencial para que as mudanças no seu código sejam automaticamente refletidas no navegador?",
      "alternativas": {
        "a": "Prettier, que formata o código automaticamente",
        "b": "Live Server, que recarrega a página no navegador",
        "c": "Portuguese (Brazil) Language Pack, que traduz a interface",
        "d": "GitHub, que permite versionar o código"
      },
      "correta": "b",
      "explicacao": "A extensão Live Server é responsável por abrir a página no navegador e recarregá-la automaticamente a cada salvamento, facilitando o fluxo de trabalho.",
      "fonte": "primeirosite.ambiente"
    },
    {
      "id": "frontend-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você está criando sua página pessoal. Qual é a ordem correta para estruturar o HTML antes de adicionar qualquer estilo?",
      "alternativas": {
        "a": "Adicionar o estilo primeiro e depois o conteúdo",
        "b": "Criar um `<footer>` antes do `<main>`",
        "c": "Começar pelo conteúdo, usando as tags semânticas apropriadas",
        "d": "Usar um template pronto para facilitar a construção"
      },
      "correta": "c",
      "explicacao": "A prática recomendada é começar pelo conteúdo, utilizando as tags semânticas corretas, antes de adicionar qualquer estilo ao HTML.",
      "fonte": "primeirosite.pagina"
    },
    {
      "id": "frontend-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você deseja publicar sua página no GitHub Pages. Qual é o primeiro passo que você deve realizar?",
      "alternativas": {
        "a": "Criar um repositório novo e torná-lo privado",
        "b": "Fazer o upload dos arquivos diretamente no repositório",
        "c": "Criar uma conta gratuita no GitHub com um nome de usuário apresentável",
        "d": "Configurar o domínio personalizado para seu site"
      },
      "correta": "c",
      "explicacao": "O primeiro passo é criar uma conta gratuita no GitHub, pois é necessário ter uma conta para poder criar repositórios e publicar páginas.",
      "fonte": "primeirosite.publicar"
    },
    {
      "id": "frontend-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está criando um layout de galeria de imagens que deve se adaptar a diferentes tamanhos de tela. Qual propriedade do Grid você deve usar para garantir que as colunas se ajustem automaticamente sem precisar de media queries?",
      "alternativas": {
        "a": "grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))",
        "b": "grid-template-columns: 1fr 1fr 1fr",
        "c": "grid-template-columns: repeat(3, 1fr)",
        "d": "grid-template-columns: auto 1fr"
      },
      "correta": "a",
      "explicacao": "A propriedade correta é `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`, pois isso permite que as colunas se ajustem automaticamente ao espaço disponível, criando um layout responsivo sem media queries.",
      "fonte": "layout.grid"
    },
    {
      "id": "frontend-int-02",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um layout flexível para uma barra de navegação que deve centralizar logo e links. Qual combinação de propriedades Flexbox você deve usar para garantir que os itens fiquem centralizados vertical e horizontalmente?",
      "alternativas": {
        "a": "display: flex; justify-content: center; align-items: center",
        "b": "display: flex; justify-content: space-between; align-items: stretch",
        "c": "display: flex; justify-content: flex-start; align-items: center",
        "d": "display: flex; justify-content: center; align-items: flex-start"
      },
      "correta": "a",
      "explicacao": "A combinação correta é `display: flex; justify-content: center; align-items: center`, pois isso garante que os itens fiquem centralizados tanto horizontal quanto verticalmente na barra de navegação.",
      "fonte": "layout.flexbox"
    },
    {
      "id": "frontend-int-03",
      "nivel": "intermediario",
      "pergunta": "Você precisa alterar o texto de um elemento com a classe 'titulo' na sua página. Qual comando você deve usar?",
      "alternativas": {
        "a": "document.querySelector('.titulo').textContent = 'Novo texto';",
        "b": "document.querySelectorAll('.titulo').textContent = 'Novo texto';",
        "c": "document.getElementsByClassName('titulo').textContent = 'Novo texto';",
        "d": "document.querySelector('.titulo').innerHTML = 'Novo texto';"
      },
      "correta": "a",
      "explicacao": "O comando correto utiliza `querySelector` para selecionar o primeiro elemento com a classe 'titulo' e altera seu `textContent`.",
      "fonte": "javascript.dom.manipular"
    },
    {
      "id": "frontend-int-04",
      "nivel": "intermediario",
      "pergunta": "Você está criando um formulário e deseja evitar que a página seja recarregada ao enviá-lo. Qual é a forma correta de fazer isso?",
      "alternativas": {
        "a": "form.addEventListener('submit', (event) => { event.preventDefault(); });",
        "b": "form.addEventListener('submit', (event) => { return false; });",
        "c": "form.onsubmit = () => { return false; };",
        "d": "form.addEventListener('submit', (event) => { event.stopPropagation(); });"
      },
      "correta": "a",
      "explicacao": "A opção correta usa `event.preventDefault()` para evitar o comportamento padrão do formulário, que é recarregar a página.",
      "fonte": "javascript.dom.eventos"
    },
    {
      "id": "frontend-int-05",
      "nivel": "intermediario",
      "pergunta": "Você deseja criar um novo elemento de lista e adicioná-lo a um elemento pai já existente. Qual é a sequência correta de comandos?",
      "alternativas": {
        "a": "const li = document.createElement('li'); pai.appendChild(li);",
        "b": "const li = document.createElement('li'); li.append(pai);",
        "c": "const li = document.createElement('li'); document.body.append(li);",
        "d": "const li = document.createElement('li'); li.parentNode.append(li);"
      },
      "correta": "a",
      "explicacao": "A opção correta cria um novo elemento `li` e o adiciona ao elemento pai usando `appendChild`, que é o método apropriado para isso.",
      "fonte": "javascript.dom.manipular"
    },
    {
      "id": "frontend-int-06",
      "nivel": "intermediario",
      "pergunta": "Você precisa verificar se um valor específico está presente em um array de frutas. Qual método você deve usar?",
      "alternativas": {
        "a": "frutas.includes('maçã');",
        "b": "frutas.find('maçã');",
        "c": "frutas.indexOf('maçã') !== -1;",
        "d": "frutas.filter('maçã');"
      },
      "correta": "a",
      "explicacao": "O método `includes` é a forma correta de verificar se um valor está presente em um array, retornando um booleano.",
      "fonte": "javascript.arrays"
    },
    {
      "id": "frontend-int-07",
      "nivel": "intermediario",
      "pergunta": "Ao trabalhar com objetos, você deseja extrair as propriedades 'nome' e 'idade' de um objeto usuário. Qual é a forma correta de fazer isso?",
      "alternativas": {
        "a": "const { nome, idade } = usuario;",
        "b": "const usuario = { nome, idade };",
        "c": "const nome = usuario.nome, idade = usuario.idade;",
        "d": "const usuario = { nome: 'Bia', idade: 23 }; const { nome, idade } = usuario;"
      },
      "correta": "a",
      "explicacao": "A desestruturação permite extrair propriedades diretamente de um objeto, facilitando a atribuição a variáveis.",
      "fonte": "javascript.objetos"
    },
    {
      "id": "frontend-int-08",
      "nivel": "intermediario",
      "pergunta": "Você fez várias alterações em um projeto e deseja salvar essas mudanças. Qual é a sequência correta de comandos para garantir que suas alterações sejam registradas no Git?",
      "alternativas": {
        "a": "git add .; git commit -m \"salvando alterações\"; git push",
        "b": "git commit -m \"salvando alterações\"; git add .; git push",
        "c": "git status; git add .; git push",
        "d": "git add .; git status; git commit -m \"salvando alterações\""
      },
      "correta": "a",
      "explicacao": "A sequência correta é usar 'git add .' para adicionar as mudanças, depois 'git commit' para registrar e, finalmente, 'git push' para enviar ao repositório remoto.",
      "fonte": "ferramentas.git.basico"
    },
    {
      "id": "frontend-int-09",
      "nivel": "intermediario",
      "pergunta": "Você criou uma nova branch chamada 'ajuste-menu' e fez algumas alterações. Após revisar as mudanças, você quer integrar essas alterações à branch principal. Qual comando você deve usar para fazer isso?",
      "alternativas": {
        "a": "git merge ajuste-menu",
        "b": "git switch main; git merge ajuste-menu",
        "c": "git switch ajuste-menu; git merge main",
        "d": "git merge main; git switch ajuste-menu"
      },
      "correta": "b",
      "explicacao": "Para integrar as alterações da branch 'ajuste-menu' à branch principal, você deve primeiro mudar para a branch principal usando 'git switch main' e, em seguida, usar 'git merge ajuste-menu'.",
      "fonte": "ferramentas.git.branches"
    },
    {
      "id": "frontend-int-10",
      "nivel": "intermediario",
      "pergunta": "Você está colaborando em um projeto no GitHub e deseja enviar suas alterações. Qual é a prática recomendada para integrar suas mudanças ao projeto principal?",
      "alternativas": {
        "a": "Fazer um push direto para a branch principal",
        "b": "Criar uma branch, fazer o push e abrir um pull request",
        "c": "Fazer um fork do repositório, trabalhar e depois fazer um push direto",
        "d": "Fazer um commit e push sem revisão"
      },
      "correta": "b",
      "explicacao": "A prática recomendada é criar uma branch para suas alterações, fazer o push e abrir um pull request, permitindo revisão e discussão antes da integração.",
      "fonte": "ferramentas.git.pr"
    },
    {
      "id": "frontend-int-11",
      "nivel": "intermediario",
      "pergunta": "Você está usando o terminal e deseja criar uma nova pasta chamada 'imagens' dentro da pasta atual. Qual comando você deve utilizar?",
      "alternativas": {
        "a": "mkdir imagens",
        "b": "cd imagens",
        "c": "ls imagens",
        "d": "mv imagens"
      },
      "correta": "a",
      "explicacao": "O comando 'mkdir imagens' é o correto para criar uma nova pasta chamada 'imagens' na localização atual.",
      "fonte": "ferramentas.terminal"
    },
    {
      "id": "frontend-int-12",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo uma função que precisa buscar dados de um perfil de usuário e exibi-los. Qual a melhor forma de tratar erros durante essa operação usando async/await?",
      "alternativas": {
        "a": "Utilizar um bloco try/catch para capturar erros e exibir uma mensagem amigável ao usuário.",
        "b": "Ignorar erros, pois o usuário não precisa saber se algo deu errado.",
        "c": "Usar apenas o await sem tratamento de erros, já que a função vai falhar silenciosamente.",
        "d": "Chamar a função de busca e esperar que o erro seja tratado automaticamente pelo navegador."
      },
      "correta": "a",
      "explicacao": "O uso de try/catch permite capturar e tratar erros de forma controlada, garantindo uma melhor experiência ao usuário.",
      "fonte": "apis.async"
    },
    {
      "id": "frontend-int-13",
      "nivel": "intermediario",
      "pergunta": "Você está consumindo uma API usando fetch e precisa verificar se a resposta foi bem-sucedida. Qual a melhor prática para checar o status da resposta?",
      "alternativas": {
        "a": "Verificar se resposta.ok é true e, caso contrário, lançar um erro.",
        "b": "Apenas usar await fetch sem checagem, pois qualquer erro será tratado automaticamente.",
        "c": "Confiar que o fetch sempre retorna um status 200 e seguir com o processamento.",
        "d": "Usar um bloco try/catch para capturar qualquer erro sem verificar o status da resposta."
      },
      "correta": "a",
      "explicacao": "Verificar resposta.ok é crucial, pois o fetch não rejeita em erros HTTP, e isso previne falhas silenciosas.",
      "fonte": "apis.fetch"
    },
    {
      "id": "frontend-int-14",
      "nivel": "intermediario",
      "pergunta": "Ao implementar uma tela que depende de dados de uma API, você deve considerar diferentes estados. Qual dos seguintes estados é essencial para uma boa experiência do usuário?",
      "alternativas": {
        "a": "Somente o estado de sucesso, já que o usuário só se importa com dados.",
        "b": "Os estados de carregando, sucesso, erro e vazio, para uma interface completa.",
        "c": "Apenas o estado de erro, pois é o mais importante para depuração.",
        "d": "Os estados de sucesso e erro, pois são os únicos que o usuário percebe."
      },
      "correta": "b",
      "explicacao": "Considerar todos os quatro estados ajuda a criar uma interface mais amigável e informativa para o usuário.",
      "fonte": "apis.estados"
    },
    {
      "id": "frontend-int-15",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo uma aplicação que precisa se comunicar com uma API externa que não é sua. O que você deve fazer se encontrar um erro de CORS ao tentar fazer uma requisição?",
      "alternativas": {
        "a": "Modificar o código da API externa para que ela permita sua origem.",
        "b": "Usar um proxy no seu servidor de desenvolvimento para contornar a política de CORS.",
        "c": "Ignorar o erro, pois ele não afeta a funcionalidade da aplicação.",
        "d": "Fazer a requisição diretamente no navegador, já que isso não deve causar problemas."
      },
      "correta": "b",
      "explicacao": "Usar um proxy permite contornar a restrição de CORS durante o desenvolvimento, já que a liberação deve ser feita no servidor da API.",
      "fonte": "apis.cors"
    },
    {
      "id": "frontend-av-01",
      "nivel": "avancado",
      "pergunta": "Você está criando um componente que precisa renderizar uma lista de produtos. Qual abordagem você deve usar para garantir que o React identifique corretamente cada item na lista?",
      "alternativas": {
        "a": "Utilizar o índice do array como chave para cada item renderizado.",
        "b": "Passar um identificador único e estável de cada produto como chave.",
        "c": "Não usar a prop key, pois o React gerencia isso automaticamente.",
        "d": "Criar uma função que gera uma chave única aleatória para cada item."
      },
      "correta": "b",
      "explicacao": "Passar um identificador único e estável como chave ajuda o React a identificar quais itens mudaram, foram adicionados ou removidos, evitando bugs de estado.",
      "fonte": "react.estado.renderizacao"
    },
    {
      "id": "frontend-av-02",
      "nivel": "avancado",
      "pergunta": "Você precisa buscar dados de um usuário assim que um componente é montado. Qual é a maneira correta de implementar isso usando o React?",
      "alternativas": {
        "a": "Utilizar o useEffect com um array de dependências vazio para fazer a busca na montagem.",
        "b": "Fazer a busca diretamente no corpo do componente antes do return.",
        "c": "Chamar a função de busca dentro de um evento de clique para garantir que os dados sejam carregados.",
        "d": "Usar um setTimeout para simular a busca de dados após um tempo."
      },
      "correta": "a",
      "explicacao": "Usar o useEffect com um array de dependências vazio garante que a busca seja feita apenas uma vez, quando o componente é montado.",
      "fonte": "react.estado.useeffect"
    },
    {
      "id": "frontend-av-03",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo uma aplicação que precisa compartilhar o estado de um usuário logado entre diversos componentes. Qual abordagem é a mais adequada?",
      "alternativas": {
        "a": "Subir o estado do usuário para o componente pai e passá-lo como prop para os filhos.",
        "b": "Utilizar o contexto para fornecer o estado do usuário a todos os componentes que precisarem.",
        "c": "Criar uma variável global que armazena o estado do usuário e acessá-la em qualquer lugar.",
        "d": "Passar o estado do usuário através de props em cada nível da árvore de componentes."
      },
      "correta": "b",
      "explicacao": "Utilizar o contexto é a melhor prática para compartilhar dados que precisam ser acessados por muitos componentes distantes, evitando o prop drilling.",
      "fonte": "react.hooks.usecontext"
    },
    {
      "id": "frontend-av-04",
      "nivel": "avancado",
      "pergunta": "Você está criando um formulário controlado e precisa garantir que o valor do campo de entrada seja sempre refletido no estado. Como você deve implementar isso?",
      "alternativas": {
        "a": "Usar onChange para atualizar o estado e value para refletir o estado no campo.",
        "b": "Usar apenas value para definir o valor do campo sem onChange.",
        "c": "Utilizar onSubmit para definir o valor do campo no estado após o envio do formulário.",
        "d": "Criar uma referência com useRef para armazenar o valor do campo."
      },
      "correta": "a",
      "explicacao": "A abordagem de usar onChange para atualizar o estado e value para refletir o estado no campo garante que o input seja controlado corretamente.",
      "fonte": "react.forms"
    },
    {
      "id": "frontend-av-05",
      "nivel": "avancado",
      "pergunta": "Você precisa otimizar um cálculo que é caro em termos de desempenho, mas não quer que ele seja recalculado em cada renderização. Qual hook você deve usar?",
      "alternativas": {
        "a": "useEffect, para garantir que o cálculo seja feito apenas quando necessário.",
        "b": "useMemo, para memoizar o resultado do cálculo e evitar recalculos desnecessários.",
        "c": "useCallback, para memoizar a função que realiza o cálculo.",
        "d": "useRef, para armazenar o resultado do cálculo."
      },
      "correta": "b",
      "explicacao": "O useMemo é projetado para memoizar valores derivados, evitando recalcular a cada renderização, o que é ideal para cálculos caros.",
      "fonte": "react.hooks.usememo"
    },
    {
      "id": "frontend-av-06",
      "nivel": "avancado",
      "pergunta": "Você está implementando um Error Boundary em sua aplicação. Qual é a maneira correta de usá-lo?",
      "alternativas": {
        "a": "Colocar o Error Boundary em torno de toda a aplicação para capturar todos os erros.",
        "b": "Embrulhar apenas componentes que podem falhar durante o render.",
        "c": "Usar o Error Boundary apenas para capturar erros de eventos e não de renderização.",
        "d": "Colocar o Error Boundary em torno de componentes que não têm dependências externas."
      },
      "correta": "b",
      "explicacao": "Embrulhar apenas componentes que podem falhar durante o render permite que você capture erros específicos sem derrubar toda a aplicação.",
      "fonte": "react.errorboundary"
    },
    {
      "id": "frontend-av-07",
      "nivel": "avancado",
      "pergunta": "Você precisa implementar um hook customizado que encapsule lógica de estado e efeitos. Qual é a regra fundamental que você deve seguir?",
      "alternativas": {
        "a": "Os hooks customizados podem ser chamados em qualquer lugar dentro do componente.",
        "b": "Os hooks devem ser chamados no topo do componente ou de outro hook, nunca dentro de loops ou condicionais.",
        "c": "Os hooks customizados podem ser usados apenas em componentes de classe.",
        "d": "Os hooks devem ser chamados apenas dentro de funções de evento."
      },
      "correta": "b",
      "explicacao": "Os hooks devem ser chamados no topo do componente ou de outro hook para que o React possa manter a ordem de chamadas e garantir o funcionamento correto.",
      "fonte": "react.hooks.custom"
    },
    {
      "id": "frontend-av-08",
      "nivel": "avancado",
      "pergunta": "Você está utilizando o React Router para gerenciar a navegação em sua aplicação. Como você deve implementar um link que não recarregue a página?",
      "alternativas": {
        "a": "Usar um elemento <a> com o atributo href para a navegação.",
        "b": "Utilizar o componente <Link> do React Router para navegação sem reload.",
        "c": "Criar uma função que manipula o histórico do navegador diretamente.",
        "d": "Usar um botão que chama uma função para mudar a URL."
      },
      "correta": "b",
      "explicacao": "O componente <Link> do React Router permite a navegação sem recarregar a página, preservando o estado da aplicação.",
      "fonte": "react.routing"
    },
    {
      "id": "frontend-av-09",
      "nivel": "avancado",
      "pergunta": "Você está implementando uma função em TypeScript que deve retornar um objeto contendo informações de um produto. Qual é a prática recomendada para garantir que o tipo do objeto esteja correto?",
      "alternativas": {
        "a": "Utilizar o tipo `any` para evitar problemas de tipo.",
        "b": "Definir um `type` ou `interface` para o objeto de retorno da função.",
        "c": "Anotar o tipo de cada propriedade individualmente dentro da função.",
        "d": "Inferir o tipo do objeto a partir do retorno da função sem anotações."
      },
      "correta": "b",
      "explicacao": "Definir um `type` ou `interface` para o objeto de retorno garante que a estrutura e os tipos das propriedades estejam corretos, evitando erros em tempo de execução.",
      "fonte": "qualidade.typescript"
    },
    {
      "id": "frontend-av-10",
      "nivel": "avancado",
      "pergunta": "Você está revisando um código e encontra uma função chamada `processar`. O que você faria para melhorar a legibilidade e a clareza do código?",
      "alternativas": {
        "a": "Deixar a função como está, pois o nome não é tão importante.",
        "b": "Renomear a função para `calcularFrete`, que descreve melhor sua ação.",
        "c": "Adicionar um comentário explicando o que a função faz.",
        "d": "Dividir a função em duas partes, mas manter o nome original."
      },
      "correta": "b",
      "explicacao": "Renomear a função para algo que descreva claramente sua ação melhora a legibilidade e evita a necessidade de comentários desnecessários.",
      "fonte": "qualidade.estilo"
    },
    {
      "id": "frontend-av-11",
      "nivel": "avancado",
      "pergunta": "Você está configurando testes end-to-end com Playwright para um aplicativo. Qual é a abordagem correta para garantir que seus testes sejam eficazes?",
      "alternativas": {
        "a": "Escrever muitos testes e2e para todas as partes do aplicativo, mesmo que sejam lentos.",
        "b": "Focar em testar apenas os fluxos críticos que não podem falhar.",
        "c": "Ignorar a estabilidade dos testes e2e, pois eles são rápidos de escrever.",
        "d": "Usar seletores fracos para facilitar a manutenção dos testes."
      },
      "correta": "b",
      "explicacao": "Focar em testar os fluxos críticos garante que as partes mais importantes do aplicativo sejam verificadas, evitando testes e2e lentos e instáveis.",
      "fonte": "qualidade.testes.e2e"
    },
    {
      "id": "frontend-av-12",
      "nivel": "avancado",
      "pergunta": "Você está configurando variáveis de ambiente para seu app em Vite. Qual é a prática recomendada para garantir que informações sensíveis não sejam expostas?",
      "alternativas": {
        "a": "Colocar todas as variáveis diretamente no código-fonte.",
        "b": "Usar um arquivo .env com prefixo VITE_ para as variáveis de ambiente.",
        "c": "Adicionar as variáveis de ambiente ao repositório Git sem o .gitignore.",
        "d": "Usar variáveis de ambiente públicas para armazenar chaves de API sensíveis."
      },
      "correta": "b",
      "explicacao": "Utilizar um arquivo .env com prefixo VITE_ garante que apenas as variáveis necessárias sejam expostas ao código do cliente, protegendo informações sensíveis.",
      "fonte": "projeto.env"
    },
    {
      "id": "frontend-av-13",
      "nivel": "avancado",
      "pergunta": "Você terminou a primeira versão do seu projeto e está pronto para o deploy. Qual é o passo correto para garantir que a versão otimizada do seu app seja publicada?",
      "alternativas": {
        "a": "Fazer upload da pasta src diretamente para o servidor.",
        "b": "Executar o comando npm run build para gerar a pasta dist.",
        "c": "Publicar o código-fonte no GitHub sem otimização.",
        "d": "Rodar o app em modo desenvolvimento antes do deploy."
      },
      "correta": "b",
      "explicacao": "O comando npm run build gera a pasta dist, que contém a versão minificada e otimizada do seu app, pronta para o deploy.",
      "fonte": "projeto.deploy"
    },
    {
      "id": "frontend-av-14",
      "nivel": "avancado",
      "pergunta": "Você está escrevendo o README do seu projeto. Qual elemento é essencial para garantir que qualquer pessoa consiga rodar seu projeto localmente?",
      "alternativas": {
        "a": "Incluir apenas o link do repositório no GitHub.",
        "b": "Adicionar instruções detalhadas sobre como clonar o repositório e executar o projeto.",
        "c": "Listar apenas as tecnologias utilizadas no projeto.",
        "d": "Incluir um screenshot do projeto sem qualquer explicação."
      },
      "correta": "b",
      "explicacao": "Instruções claras sobre como clonar e executar o projeto são fundamentais para que outros possam entender e rodar seu projeto sem ajuda.",
      "fonte": "projeto.readme"
    },
    {
      "id": "frontend-av-15",
      "nivel": "avancado",
      "pergunta": "Você está implementando integração contínua (CI) no seu projeto. Qual é a primeira automação que você deve configurar para evitar surpresas no deploy?",
      "alternativas": {
        "a": "Rodar o build apenas quando o projeto estiver pronto para produção.",
        "b": "Executar o lint e os testes a cada push para a branch principal.",
        "c": "Configurar o CI para rodar apenas em pull requests.",
        "d": "Ignorar os testes e focar apenas no lint."
      },
      "correta": "b",
      "explicacao": "Executar o lint e os testes a cada push ajuda a detectar problemas antes que o código chegue à branch principal, evitando surpresas no deploy.",
      "fonte": "projeto.ci"
    }
  ]
};

export default pool;
