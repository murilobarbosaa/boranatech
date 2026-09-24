# Estados de um projeto, e quem os produz

Frente projetos-v2. Um projeto tem UM estado na tela, derivado de TRES tabelas
diferentes, cada uma com um dono e um nivel de confianca proprio. A funcao que
combina as tres e `deriveProjectState`, em `client/src/lib/projectState.ts`.

| estado         | de onde vem                                           | quem escreve                                           | confianca                         |
| -------------- | ----------------------------------------------------- | ------------------------------------------------------ | --------------------------------- |
| `nao_iniciado` | ausencia de linha em qualquer uma                     | ninguem                                                | n/a                               |
| `em_andamento` | `user_progress.state.etapas` com pelo menos uma chave | a pessoa, marcando etapa                               | autodeclarado                     |
| `concluido`    | `user_progress.state.done === true`                   | a pessoa, no botao                                     | autodeclarado                     |
| `entregue`     | `project_submissions.status = 'entregue'`             | a pessoa, colando os links                             | autodeclarado, com links publicos |
| `verificado`   | `project_submissions.status = 'verificado'`           | o SERVER, quando todas as checagens automaticas passam | verificado por maquina            |
| `verificado`   | `project_validations.status = 'aprovado'`             | o SERVER, depois da avaliacao por IA do repositorio    | avaliado por IA                   |

## Ordem de precedencia

`verificado` > `entregue` > `concluido` > `em_andamento` > `nao_iniciado`.

Quem entregou tambem concluiu, e quem foi verificado tambem entregou. Mostrar o
estado mais fraco quando o mais forte existe esconderia trabalho feito.

## Por que tres tabelas e nao uma coluna

Elas tem donos diferentes. `user_progress` e escrita a pedido da pessoa e vale o
que ela disse; `project_submissions.status` so vira `verificado` por decisao do
server, depois de olhar o repositorio e o link publicado; `project_validations`
guarda a avaliacao por IA, que custa cota e nao roda sozinha. Juntar as tres
numa coluna faria a UI perder a distincao entre "eu disse que terminei" e "a
maquina conferiu".

## As checagens automaticas

Vivem em `server/lib/projectAutoChecks.ts`, declaradas por projeto em
`verificacaoAutomatica` (`shared/projects/v2/<id>.ts`). Tres resultados
possiveis por checagem, e a distincao entre os dois ultimos e o ponto:

- `ok`: a evidencia existe e satisfaz a checagem;
- `falhou`: a evidencia existe e NAO satisfaz;
- `erro`: nao foi possivel obter a evidencia (GitHub fora do ar, repositorio
  privado, timeout no link).

`status = 'verificado'` exige TODAS em `ok`. Uma em `erro` mantem `entregue`:
"nao consegui olhar" nao e "esta certo", e conflacionar os dois e a classe de
defeito que `docs/postmortems-instrumentos.md` cataloga.

## Entregar nao e concluir (lote 04b)

Ate o lote 04, o ato de entregar marcava `user_progress.state.done` e abria
"Projeto concluido!" sem olhar o resultado das checagens. A Ana entregou em
producao uma URL que nao era o projeto pedido, duas das seis checagens
falharam, e mesmo assim o projeto virou concluido. A regra agora:

- **entregar** grava a entrega e dispara a verificacao. Nao marca `done` e nao
  abre modal;
- **`entregue` vira `verificado` so com todas as checagens em `ok`**. Ai, e so
  ai, o cliente chama `toggleCompletion` (que alimenta contadores, badges e o
  espelho de trilha) e comemora na variante "Projeto verificado!";
- alguma em `falhou` ou `erro`: nenhum `done`, nenhum modal. O bloco de entrega
  mostra "Falta N para verificar", o que fazer em cada uma, e as inconclusivas
  numa linha a parte. "Verificar de novo", passando tudo, conclui e comemora;
- projeto v2 **sem** `verificacaoAutomatica`: nao ha o que conferir, entao
  entregar ja marca `done` e comemora na variante "Projeto entregue!";
- validacao com IA aprovada marca `done` e comemora "Projeto validado!",
  independente das checagens;
- v1 continua com o botao "Marcar como concluido", autodeclarado.

Resumo: `done` e marcado apenas em `verificado`, `validado` ou pelo botao de
autodeclaracao do v1. Nao existe "desentregar": a entrega so pode ter os links
alterados.

Isto nao corrige quem ja entregou antes do lote: uma linha com `done: true`
continua `true`. O chip mostra `entregue` (que tem precedencia sobre
`concluido`), e o bloco de entrega mostra o que falta.

## O que as checagens NAO julgam

A conferencia automatica e estrutural: se o site abre, se o repositorio e
publico, se tem README, commits, os arquivos e pastas esperados. Ela **nao
julga se o que foi entregue e o projeto pedido**. Um site institucional no
lugar da pagina pessoal passa em todas, se estiver no ar e bem montado. Quem
julga isso e a validacao com IA, que le o codigo e confere cada requisito.

A tela diz isso nos dois momentos, antes de entregar (junto de "O que a gente
confere sozinho") e depois (junto do resultado). Sem a frase, "o site responde,
o repositorio e publico" le como um aval que ninguem deu.

## A validacao com nota (lote 06)

Antes o veredito da IA era binario e exigia 100%: um requisito "parcial" num
projeto de dez reprovava tudo, e quem entregava via "reprovado" sem saber
quanto faltava. Agora ha nota.

- **Fonte dos requisitos**: o modulo v2, quando o projeto e de codigo
  (`tipoEntrega` `repo` ou `repo_deploy`). Os 8 projetos com selo Pro do
  catalogo continuam usando os `requisitos` do catalogo ate migrarem. Projeto
  v2 de artefato (figma, notebook, documento, dashboard) nao tem validacao por
  repositorio: nao ha repositorio para ler.
- **Quem pode**: assinante Pro. Deixou de ser exclusivo dos 8 projetos com
  selo.
- **Corte**: `VALIDATION_CUTOFF = 0.8`, em `shared/projects/validationScore.ts`.
  A comparacao e da FRACAO, nunca do percentual arredondado: 8 de 10 e 0.8 e
  valida; 7 de 9 e 0.777, exibe 77% e nao valida.
- **O que conta**: so `atende`. `parcial` e `nao_atende` contam como pendente,
  e requisito que a IA omitiu tambem (fail closed: a omissao e falha do
  avaliador, nao merito de quem entregou).
- **Cooldown**: 5 minutos entre validacoes do mesmo projeto, conferido ANTES da
  cota diaria de IA, para clique repetido nao queimar cota.
- **Reenvio**: permitido depois de validado, para subir a nota. A regra e
  MELHOR NOTA VENCE: uma tentativa com nota menor nao grava e a resposta traz
  `gravado: false` com a melhor nota em `melhor`. Reprovacoes entram no
  historico sem limite.
- **100%**: quando `perfeito`, um selo "100%" ao lado de "Validado". Nada alem
  disso.

A nota nao mora no banco: `project_validations.status` continua `aprovado` ou
`reprovado`, e a nota e DERIVADA de `requisitos_result` na leitura, contra a
lista de requisitos de hoje. Sem migration.
