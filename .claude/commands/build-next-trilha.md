Voce esta trabalhando nas trilhas v2 no padrao editorial calibrado nas fases 3b (frontend) e 4 (prova de trilha). shared/roadmapV2/content/frontend.ts e a referencia de qualidade; este guia vale tanto pra construir trilha nova quanto pra upgrade de trilha existente. Nada vai pra producao sem revisao; NUNCA rode git push.

## 1. Estrutura: o curriculo real decide

- O curriculo REAL da area decide o numero de secoes: de 5 a 12. O template fixo de 6 a 8 secoes esta REVOGADO. Secao existe porque o assunto existe na profissao, nunca pra preencher molde; secao de uma folha so e sinal de divisao artificial (funda ou expanda).
- Cada secao tem `level` (iniciante, intermediario, avancado) e os levels progridem ao longo da trilha.
- Grupos intermediarios (nos com children dentro da secao) tem NO MAXIMO um nivel de profundidade e so existem onde ajudam a leitura (ex: "Git e GitHub" agrupando 3 passos). Nunca grupo dentro de grupo.
- Seletor de linguagem (`languages` + folhas `byLanguage`): apenas quando a area se divide por stack de verdade (mobile, cloud, gamedev, backend). Na duvida, sem seletor. Variante byLanguage tem o mesmo padrao de qualidade do tronco comum, nao e resumo.

## 2. Anatomia da folha

Todo `content` segue esta intencao, nesta ordem (como guia de escrita, nao formulario rigido):

1. O que E, em UMA frase concreta, sem rodeio.
2. Por que existe: o problema que resolve.
3. Modelo mental: a imagem que faz o conceito assentar.
4. Habito pratico ou exemplo real de uso.
5. Fecho conectando ao proximo passo ou a um passo adiante da trilha.

- Faixa de 120 a 250 palavras, com a densidade nascendo do conceito. NAO inflar folha magra pra bater faixa; conceito pequeno merece texto pequeno.
- Criterio de dominio: onde houver habilidade verificavel, fechar com a ideia "Voce domina este passo quando..." em formulacao VARIADA, nunca formula repetida. Exercicio proposto ou mapa mental sao fechos igualmente validos; escolha o que serve ao conceito.

## 3. Disciplina de blocos de codigo

O renderer estiliza: paragrafo, negrito, `codigo inline`, listas com hifen (ul), links e bloco cercado (pre). NAO estiliza headings, listas numeradas (ol) nem blockquote; nao use o que o renderer nao estiliza.

- Bloco cercado APENAS quando a forma do codigo e a licao (quando VER a sintaxe ensina mais que le-la descrita).
- Ate 8 linhas de ~45 caracteres cada; maximo 1 bloco por folha, salvo justificativa explicita no relatorio.
- A MAIORIA das folhas nao tem bloco nenhum.

## 4. Voz e conexoes

- PT-BR direto, registro do backend.ts: proximo, concreto, sem infantilizar.
- Conexoes NOMINAIS entre secoes: promessas feitas cedo e fechadas adiante (no frontend, primeirosite.publicar promete o que ferramentas.git.basico cumpre). Toda trilha deve ter algumas, com nome de passo real.
- Jargao interno PROIBIDO em qualquer string visivel: "folha" e "no" viram "passo"; "trilha" e o termo do produto.
- ZERO travessao e ZERO en-dash em qualquer texto, codigo ou copy. Hifen comum so em palavra composta legitima.

## 5. resources

- De 0 a 3 por folha, APENAS canonicos: MDN em pt-BR, web.dev, documentacao oficial da ferramenta ou orgao (ex: postgresql.org, kubernetes.io, scrumguides.org).
- NUNCA inventar URL; na duvida, omitir o resource. Regra irma: NUNCA inventar dado (estatistica, preco, nome, data); inverificavel vira linguagem qualitativa ou sai.

## 6. Projeto da trilha

- Toda trilha tem UM no de projeto, resolvendo num id REAL de shared/projects/catalog.ts.
- Projeto de trilha e sempre gratuito: NUNCA aponte pra projeto com `pro: true`.

## 7. Registro triplo de trilha nova

1. shared/roadmapV2/content/index.ts: adicionar ao agregado roadmapsV2.
2. client/src/lib/roadmapV2/loaders.ts: adicionar o import lazy do slug.
3. pnpm gen:roadmap-meta: regenerar meta.generated.ts e projectLinks.generated.ts.

O --check do pnpm check acusa qualquer omissao dos tres; rode pnpm check antes de considerar pronto.

## 8. Pool de quiz (prova da trilha)

- Com o conteudo pronto e revisado, gerar o pool: pnpm gen:quiz-pool <slug>.
- Registrar o pool novo em server/data/roadmapQuizzes/index.ts (o pnpm check acusa a omissao).
- O pool contem o GABARITO e e server-only: NUNCA pode ser importado de client/src, direto ou indireto. Qualquer vazamento e bug critico.
- Ids de pergunta sao ESTAVEIS depois de gerados: tentativas de usuarios os referenciam; regenerar com --force troca ids e invalida tentativas ativas.

## 9. Ids estaveis

- Ids de no em dot-path (secao.grupo.folha), estaveis. O progresso do usuario e chaveado por slug:nodeId: renomear id apaga progresso na pratica e e decisao consciente, sinalizada no relatorio, nunca efeito colateral.

## 10. Revisao editorial

- Todo arquivo de conteudo novo ou reescrito abre com cabecalho TODO(Ana) pedindo revisao editorial completa.

## 11. Trilhas de linguagem, framework e ferramenta

- Tres kinds alem de "carreira", declarados em `kind` na trilha (shared/roadmapV2/types.ts): `linguagem` para linguagem de programacao (JavaScript, Python, SQL); `framework` para framework, biblioteca ou runtime (React, Node, Django); `ferramenta` para ferramenta de trabalho (Git, Docker, Linux).
- `area` e IGUAL ao kind (`area: "linguagem"`, `area: "framework"`, `area: "ferramenta"`), a mesma sentinela que "carreira" ja usa. Trilha sem kind continua exigindo `area` de areasTI.
- Slug so com `a-z`, `0-9` e hifen simples: `cpp` e nao `c++`, `csharp` e nao `c#`. O slug `ia` e reservado pela rota /roadmaps/ia.
- O `pnpm check` afirma tudo isso nos dois sentidos (checkKinds em scripts/generateRoadmapMeta.mts): kind sem area igual, area sentinela sem kind, area real inexistente, slug fora da forma, slug reservado e slug duplicado reprovam.
- As regras editoriais especificas dessas trilhas (disciplina de codigo, quiz de codigo) entram em revisao posterior deste guia.
- `codeLanguages` (identificadores de cerca markdown, a primeira e a principal) e obrigatorio na pratica em trilha de linguagem e framework, porque sem ele a prova sai so de conceito; em ferramenta e opcional (Git e Docker tem codigo, Figma nao). O `pnpm check` reprova o campo em trilha sem kind ou de carreira, vazio, ou com identificador fora de `a-z` e `0-9`.
- A proporcao de perguntas de codigo por tipo de trilha vem de `CODE_SHARE_BY_KIND` em scripts/quizPoolGeneration.mts (metade em linguagem e framework, 40% em ferramenta), com pelo menos 1 e no maximo cota menos 1 por secao.
- `pnpm gen:quiz-pool <slug> --dry-run` (e `--dry-run --schema`) imprime o system prompt, o user prompt de cada secao e o schema sem gastar credito; e o que se roda antes da geracao real.
- `pnpm verify:quiz-pool <slug>` roda depois de TODA geracao de pool de trilha com `codeLanguages` que tenha runner (js e python): executa cada trecho de codigo e compara com o gabarito. Pergunta `CORRIGIR` nao entra em commit; `LER` (tipo erro) e leitura humana.
- Pergunta `erro` exige `codigo.saidaEsperada`: o stdout cru que o trecho DEVERIA produzir segundo a intencao declarada na pergunta. Nao e gabarito (vai ao client); e o que torna `erro` verificavel: trecho que roda limpo e imprime exatamente isso nao tem defeito.
- O gerador executa os trechos de `js` e `python` DENTRO do retry (saida, completar e erro conferidos por execucao a cada tentativa, no mesmo canal das violacoes de regra); `--no-exec` desliga, para ambiente sem o runner. O dry-run nunca executa.
- O verificador continua sendo o portao final antes do commit, e `erro` com `saidaEsperada` agora sai `OK` (lanca ou diverge) ou `CORRIGIR` (roda limpo e imprime a saida esperada), nao mais `LER`; `LER` fica so para pool anterior ao campo.

Disciplina de codigo em trilha de linguagem, framework e ferramenta (SUBSTITUI a secao 3 para essas trilhas; a secao 3 continua valendo para trilha de area e de carreira):

- Bloco cercado e a licao na maioria dos passos: a sintaxe se aprende vendo. Ate 2 blocos por passo, cada um com no maximo **10 linhas de conteudo e 12 linhas no total** (as em branco contam so no total), de ate 60 caracteres, indentacao de dois espacos. As duas contagens existem desde o Lote 10a: a PEP 8 pede linha em branco entre definicoes, e contar essas linhas junto com o codigo reprovava justamente o bloco bem escrito (8 blocos da trilha de Python). O limite de tela continua coberto pelo total.
- A cerca aceita metadados depois da linguagem, separados por espaco, e eles sao INVISIVEIS na tela (o renderer usa so a primeira palavra da cerca, provado por teste de render): `lanca=<TipoDoErro>` declara que o bloco quebra de proposito, e o verificador exige que ele quebre com esse tipo (a conferencia e por palavra inteira, entao `lanca=Error` NAO passa num bloco que lanca `TypeError`); em `ts`, `lanca=` aceita nome de excecao para erro em tempo de execucao OU codigo do compilador (`TS####`) para erro de tipo, e e essa segunda forma que torna verificavel o bloco que existe justamente para mostrar o erro que o compilador acusa; `arquivo=<nome>` declara que o bloco e um arquivo, e todos os blocos do MESMO passo com `arquivo=` sao gravados juntos, com so o ultimo sendo executado e os anteriores disponiveis para import. Metadado desconhecido reprova, para erro de digitacao nao deixar o bloco sem a verificacao que o autor pediu.
- `banco=<nome>` (so em `sql`, Lote 11a): o bloco executa DEPOIS de carregar a base `<nome>` do registro unico `shared/roadmapV2/sqlBancos.ts` (`SQL_BANCOS`). E o que torna a trilha de SQL escrevivel: `CREATE TABLE` mais `INSERT` mais a consulta nao cabem em dez linhas. Tres regras, todas erro de cerca: so em cerca `sql`; o nome precisa estar no registro; nunca junto de `arquivo=`. Erro dentro da base cita `__banco.sql` na mensagem, para ninguem procurar no bloco da licao. A base nao imprime nada: a saida do bloco e so a da consulta dele. A pergunta de pool NAO usa `banco=`: o trecho da pool continua autocontido.
- O runner de `ts` roda SEM a lib `dom` e SEM `@types/node` (`types: []`): no trecho existem `console` e a biblioteca padrao de ES2022, e mais nada. Trecho com `process`, `fetch`, `window`, `document`, `require` ou `Buffer` nao passa, e isso e deliberado: e o que faz `console.log(name)` acusar em vez de passar calado por causa de um global do navegador.
- A cerca leva o identificador de `codeLanguages` (`js`, nao `javascript`); o renderer ignora, mas o gerador de pool e a validacao leem.
- Passo de conceito puro (o que e, por que existe, modelo mental) pode nao ter bloco; passo de sintaxe ou de API sempre tem pelo menos um.
- Todo bloco e codigo que roda: nada de pseudocodigo, nada de `...` no meio, nada de saida inventada. Quando o passo mostra a saida, ela vem de execucao real (no lote, com `node -e`).
- A faixa de 120 a 250 palavras de prosa por passo continua valendo; o codigo nao conta como palavra.
- O restante do guia (anatomia da folha, voz, conexoes nominais, resources canonicos, projeto unico gratuito, ids estaveis, registro triplo, pool) vale igual.

## 12. Revisao humana obrigatoria

- Toda trilha nova com `codeLanguages` entrega, no lote da pool, a tabela de revisao: `pnpm verify:quiz-pool <slug> --tabela-revisao`. Uma linha por pergunta de codigo (nenhuma para conceito): id, tipo, linguagem, `executado` ou `nao-executado` e o resumo da alternativa correta em ate 60 caracteres. Cada linha e lida contra o trecho e o enunciado, e o veredito (certa ou errada, com o motivo) vai no relatorio do lote. Pergunta errada nao entra em commit.
- Por que e obrigatoria mesmo com execucao: o portao prova que o trecho roda, quebra ou imprime o esperado; nao prova que a alternativa correta descreve o motivo certo. Medido: na pool de Python (Lote 06g), 4 de 8 perguntas de `erro` aprovadas pelo portao estavam semanticamente erradas; na de JavaScript (Lote 06h), 0 de 9. O segundo numero nao revoga a regra: sem a leitura nao ha como saber em qual dos dois casos a trilha nova cai.
- Linguagem sem runner (`runner: null` em `scripts/languageCapabilities.mts`: bash, html, css e dockerfile; `ts` SAIU desta lista no Lote 10a, quando ganhou runner de duas etapas, checagem de tipos com a API do typescript e depois execucao com o tsx; `sql` entrou ja com runner, no Lote 11a): a verificacao por execucao nao cobre nenhum trecho, e o portao e o verificador dizem isso (`[aviso] N trechos de <linguagem> sem runner: verificacao por execucao NAO cobre estes; revisao humana obrigatoria`, e `nao-executado` na tabela). Ali a revisao cobre TODAS as perguntas de codigo, nao uma amostra, e e planejada desde o inicio do lote: o tempo da leitura completa com `--tabela-revisao` entra no plano antes da geracao, nao depois.
- Em bash e dockerfile (saida de ferramenta), alternativa de `saida` ou `saidaEsperada` que parece frase ("Already up to date.") nao reprova: sai como `[portao] [aviso] ... revisao humana confirma`, e a tabela decide se e saida real de terminal ou frase inventada. Em js, python, html e css a regra de frase continua reprovando.
- `codigo.saidaEsperada` segue a capacidade da linguagem: obrigatoria em js, ts, python e bash (comando de Git tem saida real e previsivel, e o campo e a unica declaracao explicita da intencao, que e o que a revisao compara com a correta); opcional em html, css e dockerfile, que nao tem saida de terminal (presente e vazia reprova).
- `sql` tem runner desde o Lote 11a: `node:sqlite` (`DatabaseSync`) num banco `:memory:`, pelo wrapper `scripts/runSqlSnippet.mjs`, sem binario externo (o `sqlite3` de linha de comando nao e garantido na maquina nem no CI). Proibido no trecho, com erro `SQLITE_AUTH` e status 1: `ATTACH`, `DETACH`, `VACUUM INTO` (os tres gravariam arquivo no diretorio do executor), `load_extension` e `CREATE TRIGGER`. A trilha nao precisa de nenhum deles.
- Formato de saida do runner de `sql`, que e o formato em que a pergunta de `saida` e a `saidaEsperada` se escrevem: cada consulta imprime uma linha de cabecalho com os nomes das colunas e uma linha por registro, com espaco, barra vertical e espaco entre um campo e outro (`nome | preco` no cabecalho, `caneta | 2.5` no registro); `NULL` sai `NULL`, inteiro e real como o SQLite devolve (real pelo `String()` do JavaScript: `12.0` sai `12`), texto cru, blob como `x'<hex>'`; consulta sem registro imprime so o cabecalho; duas consultas saem separadas por UMA linha em branco; `CREATE` e `INSERT` sem `RETURNING` nao imprimem nada; mais de 200 registros num resultado e erro. Erro sai no stderr como `<arquivo>:<linha>: error SQLITE_<NOME>: <mensagem>`, com a linha onde COMECA a instrucao e so o codigo PRIMARIO, entao `lanca=SQLITE_CONSTRAINT` casa um `UNIQUE` violado sem o sufixo `_UNIQUE`.
- Linguagem nova em `codeLanguages` e declarada primeiro em `LANGUAGE_CAPABILITIES` (runner, saidaEsperadaAplicavel, importRule, saidaDeFerramenta). Linguagem fora do mapa e erro de configuracao: o gerador para, nao cai num padrao.

Disciplina de codigo em linguagem sem runner de marcacao e estilo (html, css), complementando a da secao 11:

- `completar` e `erro` sao os tipos principais. A lacuna e a tag, o atributo, a propriedade ou o seletor que falta; o defeito e a tag que nao fecha, o atributo no lugar errado, a propriedade que nao existe, o seletor que nao casa. Os dois se conferem lendo o trecho, que ali e o unico instrumento.
- `saida` so onde existe saida real e exata. Renderizacao nao e saida: descrever o que aparece na tela vira frase, que a regra de frase reprova em html e css, e vira pergunta que so acerta quem imaginou a mesma tela.

## 13. Remocao de CSS

- Antes de remover uma classe CSS (ou uma familia, como `.tag-*`), grep de TODO uso no repositorio inteiro, pelo prefixo da familia e nao so pelo nome completo: `className` literal, template string (`${area.tagClass}`), valor em dado (`client/src/lib/data.ts`, a coluna `tag_class` em `supabase/migrations/`, `server/`, seed), teste e script. Ex.: `git grep -nE 'tag-|tagClass|tag_class'`. O nome inteiro da classe muitas vezes so existe em tempo de execucao, montado a partir de um valor que mora em outro arquivo.
- Licao do Lote M1: `2dae5521` (2026-09-01) tirou as 17 regras `.tag-*` do `index.css` e migrou `Cursos.tsx` e `SubAreaDetalhe.tsx` para `tagPaletteOf`; `RoadmapsV2Index.tsx` ficou de fora porque montava a classe em template string a partir de `area.tagClass`, e a vitrine /roadmaps ficou em producao com o quadrado do icone sem fundo e o icone branco invisivel ate `eb991189`. Nada acusou: o `tsc` nao le classe CSS e nenhum teste afirmava a cor.
- O relatorio do lote lista TODOS os arquivos em que o grep achou a classe ou o prefixo, com o destino de cada um (migrado, ou por que nao e uso). Lista vazia vem com o comando de grep colado, para quem le conferir a superficie.

## Fechamento de qualquer lote

- pnpm check com exit 0.
- Grep de travessao e en-dash vazio em todos os arquivos tocados.
- Staging explicito por arquivo (NUNCA git add . nem -A); git diff --cached conferido limpo imediatamente antes do commit.
- Commit de uma linha, em ingles, no formato tipo(escopo): descricao. Sem push.
- Relatorio: o que mudou por trilha, conexoes nominais criadas, blocos de codigo justificados, URLs adicionadas e decisoes fora do padrao.
