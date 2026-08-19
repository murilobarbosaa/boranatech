# Limitacoes conhecidas do parser de perfil (Fase 1)

Duas limitacoes foram reproduzidas na verificacao final da Fase 1 e aprovadas
como NAO bloqueantes. Ficam aqui porque as duas falham no sentido silencioso:
produzem resultado plausivel em vez de erro, entao ninguem tropeca nelas por
acaso. Registrar e o que garante que a proxima pessoa saiba que ja foram vistas
e medidas, e nao as redescubra como novidade.

## 1. Linha de competencia com virgula pode satisfazer o validador de localizacao

A condicao (c) de `identidadeDestacavelDaSecao` exige uma linha de localizacao
estrutural dentro do bloco de identidade destacado de uma secao. O validador
`ehLocalizacaoEstrutural` aceita qualquer linha curta com virgula cujas partes
comecem em maiuscula e tenham ate quatro palavras. Uma linha de competencia com
virgula interna, posicionada no fim do bloco, satisfaz esse teste e devolve a
regiao a `confirmed`, com splice no texto bruto e perda das linhas promovidas
em `skillsPdf`.

Reproduzido pelas sondas S1 a S3 da auditoria, por exemplo
`Top Skills / Python / Machine Learning / Vector Databases / Comunicacao, Lideranca / Summary`.

Por que nao bloqueia: as competencias do LinkedIn saem de vocabulario
controlado e o "Salvar como PDF" as exporta uma por linha, sem virgula. As
fixtures reais desta base confirmam o formato (`Ciencia da computacao`,
`Programacao (computacao)`, `Linguagens de programacao`). O export real nao
produz a linha necessaria.

Direcao de aperto, se um caso real aparecer: exigir que a localizacao esteja
ABAIXO da headline, em vez de varrer o bloco inteiro (hoje a propria headline
com virgula pode satisfazer a condicao), e apertar `ehLocalizacaoEstrutural`
para nao aceitar enumeracao de duas partes sem sinal geografico.

## 2. Ancora de identidade com nome de uma palavra escapa do fail-closed do prefill

`skillsTemPossivelIdentidade` marca a origem das competencias como duvidosa
quando alguma linha e localizacao estrutural, ou tem duas palavras ou mais e
passa em `pareceNomeEstrutural`. Uma ancora de UMA palavra nao entra nesse
filtro, e a linha de headline tambem escapa, porque `pareceNomeEstrutural`
rejeita por construcao qualquer linha com sinal de cargo (ele e um detector de
NOME, nao de headline). O resultado e `skillsPdfConfiaveis: true` com a linha de
identidade dentro de `skillsPdf`, e o prefill da interface a oferece como
competencia.

Reproduzido no caso A (`Top Skills / React / Frontend Developer / Summary`) e,
na forma mais danosa, num perfil com nome real de uma palavra, onde o proprio
nome da pessoa entra no prefill.

Por que nao bloqueia: e realista apenas para mononimos, raros no publico deste
produto, porque o LinkedIn exige nome e sobrenome na maioria dos locales. Com
nome de duas palavras o fail-closed funciona: `skillsPdfConfiaveis` sai `false`
e o prefill fica vazio. No caso A o resultado ainda e defensavel, porque para
aquelas linhas serem identidade o nome da pessoa teria que ser `React`.

Direcao de aperto: tratar como sinal de identidade, dentro do filtro de
prefill, tambem a linha que passa como headline plausivel dentro de uma secao,
e nao so a que passa como nome.
