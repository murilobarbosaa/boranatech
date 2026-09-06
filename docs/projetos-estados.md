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
