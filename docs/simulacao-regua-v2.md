# Simulação da régua v2 sobre as 107 análises persistidas

Simulação, **nada implementado**. Existe para a decisão de comparabilidade de nota ser tomada com dado
real em vez de com as 6 fixtures.

## 1. O que é recomputável, e o que não é

O `profileText` não é persistido. O que está gravado em `linkedin_analyses.result.deterministic`, nas 107
linhas, é:

| Campo | Presença | Recomputável a partir dele |
|---|---|---|
| `checks[]` com `id`, `tier`, `aprovado` | 107/107 | **Sim, exato.** A nota sai de `computeLinkedinScore`, que só lê tier e aprovado. Trocar o veredito de um check e recalcular é aritmética, não inferência. |
| `keywordsEncontradas[]` | 107/107 | **Sim, exato.** É a lista das tecnologias-chave da área comprovadas. A recalibragem de cobertura por contagem absoluta precisa só do tamanho dela. |
| `keywordsFaltantes[]` | 107/107 | Sim, exato. |
| `experienciasContagem`, `sobreTamanho`, `skillsContagem` | 107/107 | Sim, exato, mas são agregados. |
| `headline` (texto) | 107/107 | Sim. |
| `skillsParaAdicionarAgora`, `keywordsCampos`, `perfilDedup` | **0/107** | Não existem: entraram depois. |
| Texto de cada experiência | nunca persistido | **Não.** |

Duas ressalvas que valem para tudo abaixo:

1. **Os números são do parser antigo.** As 107 foram calculadas antes da Fase 1A e da 1B, com line-wrap,
   rodapé de paginação e cabeçalho do vizinho dentro das descrições. `keywordsEncontradas` de hoje, para o
   mesmo PDF, pode ser diferente. A simulação diz o que teria acontecido com aquelas análises, não o que
   acontece com uma análise nova.
2. **`detail` é copy, não dado.** Alguns trazem número (`"5 experiência(s) detectada(s)"`,
   `"As descrições usam 37 verbos de ação"`), outros não (`exp-resultados` tem 2 textos distintos e
   **nenhum** com número). Extrair número de string de copy é frágil por natureza: a copy muda por decisão
   de produto e a extração quebra em silêncio. Nada nesta simulação depende disso. Onde o dado não existe,
   está reportado como intervalo, não como ponto.

## 2. Cobertura por contagem absoluta (6 aprova o essencial, 10 o ótimo)

Substitui `coverageRatio >= 0.5` e `>= 0.75` por `keywordsEncontradas.length >= 6` e `>= 10`.

**Distribuição da nota**

| | média | mediana | mín | máx |
|---|---|---|---|---|
| antes | 46,0 | 45 | 11 | 72 |
| depois | **47,4** | **46** | 11 | **77** |

**Faixas, contagem por dezena**

| dezena | 10 | 20 | 30 | 40 | 50 | 60 | 70 |
|---|---|---|---|---|---|---|---|
| antes | 4 | 10 | 9 | 43 | 28 | 10 | 3 |
| depois | 4 | 10 | 8 | 41 | 22 | **16** | **6** |

**Movimento**

- **24 sobem, 1 desce, 82 ficam iguais.**
- **4 mudam de faixa**: 3 de `em-construcao` para `forte`, 1 de `inicio` para `em-construcao`.
- **Maior subida individual: +9 pontos** (49 para 58), perfil de backend com 11 tecnologias comprovadas de
  64 na área. Pela régua de razão, 11/64 = 17%, reprovava as duas coberturas; por contagem absoluta,
  11 passa nas duas.
- **A que desce é uma só, e é informativa**: ciberseguranca, 68 para 62. Ela tem 5 tecnologias de uma área
  cuja pool tem só 10, então 50% eram 5 e ela passava; com o corte absoluto de 6, não passa mais. **Área
  com pool pequena fica mais dura, não mais fácil.** Se isso não for o desejado, o corte precisa de piso
  por tamanho de pool.

**Por que o efeito é grande**: hoje **1 das 107** aprova a cobertura essencial e **0 das 107** aprovam a
ótima. Com o corte absoluto passam a ser **24** e **5**. A régua de razão não estava classificando, estava
reprovando todo mundo.

Distribuição de tecnologias comprovadas nas 107: `0:27, 1:12, 2:10, 3:17, 4:6, 5:11, 6:6, 7:5, 8:4, 9:4,
10:3, 11:1, 15:1`. Metade das análises tem 3 ou menos, o que também diz que 6 é um corte exigente.

## 3. Checks por item nas experiências

**Não é recomputável, e a razão é dura**: o texto de cada experiência nunca foi persistido. O que existe é
o veredito agregado (`exp-descricoes` olha a concatenação de todas as descrições, mínimo 100 caracteres) e
`experienciasContagem`. Não há como saber, de uma linha gravada, se a segunda das cinco experiências tinha
descrição própria.

Pior ainda: até a Fase 1B, uma experiência **sem** descrição recebia o cabeçalho da experiência seguinte
como se fosse descrição (bug B.1). Ou seja, entre as 107, uma parte dos `exp-descricoes` aprovados foi
aprovada com texto que não era descrição de ninguém. O sinal está contaminado na direção otimista.

O que dá para afirmar, em intervalo:

- **70 das 107** aprovam `exp-descricoes` hoje **e** têm 2 ou mais experiências. São as únicas que podem
  cair: com 1 experiência, checar por item é igual a checar agregado.
- **Pior caso** (toda experiência extra está vazia): queda de **5 a 6 pontos** cada, e **26 das 107 mudam
  de faixa para baixo**.
- **Melhor caso** (nenhuma vazia): zero muda.
- O valor real está entre os dois e **não é recuperável** do que está gravado.

Âncora fraca, declarada como fraca: nas 6 fixtures, 1 de 13 experiências não tem descrição própria (7,7%)
e 1 de 6 perfis tem pelo menos uma (17%). Com n=6 isso não sustenta extrapolação para 107; serve só para
dizer que o pior caso é folgado e o melhor é improvável.

**Como tornar isso recuperável daqui pra frente**: persistir, junto do `deterministic`, o comprimento da
descrição de cada experiência (um array de inteiros). É aditivo, não muda nota, não guarda texto de
ninguém, e faz a próxima simulação desta pergunta ser exata em vez de intervalar.

## 3-bis. Três variantes de cobertura (Fase 3, item 5)

Tamanhos de pool medidos, 22 áreas: `analise-sistemas 3`, `gestao 5`, `blockchain 5`, `gamedev 6`,
`iot 7`, `produto 10`, `uxui 10`, `ciberseguranca 10`, `sre 12`, `analise-dados 14`, `banco-de-dados 14`,
`cloud 15`, `ia 15`, `qa 16`, `infraestrutura 17`, `mobile 18`, `engenharia-dados 19`, `fullstack 22`,
`devops 29`, `frontend 33`, `dados 35`, `backend 64`.

| | A: absoluto 6/10 | B: `min(6, ceil(p/2))` / `min(10, ceil(p*0,75))` | C: B com `ótima >= essencial+1` |
|---|---|---|---|
| média | 47,4 | 47,4 | 47,4 |
| mediana | 46 | 46 | 46 |
| sobem | 24 | 24 | 24 |
| **descem** | **1** | **0** | **0** |
| mudam de faixa | 4 | 4 | 4 |
| maior subida | +9 (49→58, backend) | +9 | +9 |
| maior queda | **-6** (68→62, ciberseguranca) | **nenhuma** | **nenhuma** |
| aprovam essencial | 24/107 | **25/107** | 25/107 |
| aprovam ótima | 5/107 | 5/107 | 5/107 |
| **essencial impossível** | **3 áreas** | **0** | **0** |
| **ótima impossível** | **5 áreas** | **0** | **0** |

Faixas por dezena: antes `10:4 20:10 30:9 40:43 50:28 60:10 70:3`; nas três variantes
`10:4 20:10 30:8 40:41 50:22 60:16 70:6`.

**Impossibilidade, por área.** Em A, `analise-sistemas(3)`, `gestao(5)` e `blockchain(5)` têm pool menor
que 6: o check essencial nunca pode ser aprovado, por mais completo que o perfil seja. A ótima em 10 é
impossível nessas três mais `gamedev(6)` e `iot(7)`, **cinco áreas** (não oito). Em B e em C, zero: o corte
nunca pode passar do tamanho da pool, por construção.

**O perigo de ler só o movimento de nota.** A tem 3 perfis das 107 em `gestao`, área onde ela torna o
essencial impossível, e **nenhum deles muda de nota**, porque já reprovam. O dano de A é invisível no
placar e só aparece olhando a pool. Foi exatamente o modo de falha da régua original.

**Por que a única queda some em B.** `ciberseguranca` tem pool 10; o perfil tinha 5 tecnologias e passava
pelos 50%. Em A, 5 < 6 e ele cai 6 pontos. Em B, o corte da área é `min(6, 5) = 5`, e ele continua
aprovando. B não é só mais justo com áreas pequenas: ele não pune ninguém pela recalibragem.

**C é idêntico a B nos dados de hoje** e a trava nunca chega a agir: para toda pool real,
`ceil(p*0,75) > ceil(p/2)`. Ela existe para a pool que encolher: com pool 1, B daria essencial 1 e ótima 1,
dois checks que nunca se diferenciam.

**Projeção para as 8 áreas sem perfil nas 107** (`cloud 15`, `mobile 18`, `gamedev 6`,
`banco-de-dados 14`, `sre 12`, `analise-sistemas 3`, `blockchain 5`, `iot 7`): em A, três delas nascem com
check impossível (`analise-sistemas`, `blockchain` no essencial; mais `gamedev` e `iot` na ótima). Em B, os
cortes ficam `analise-sistemas 2/3`, `blockchain 3/4`, `gamedev 3/5`, `iot 4/6`, `sre 6/9`,
`banco-de-dados 6/10`, `cloud 6/10`, `mobile 6/10`, todos atingíveis. Nenhuma amostra real sustenta
previsão de nota nessas áreas; o que se afirma aqui é só reachability, que depende da pool e não do perfil.

## 3-ter. Simulação LÍQUIDA da régua v2 (Fase 3, item 4)

Três das quatro mudanças são recomputáveis exatamente sobre as 107. A quarta (checks por item) não é,
porque `experienciasDescricaoTamanhos` só passa a existir a partir daqui.

| | antes (v1) | só cobertura C | só densidade por `level` | só teto de sinais | **LÍQUIDO (as três)** |
|---|---|---|---|---|---|
| média | 46,0 | 47,4 | 46,0 | 44,4 | **45,9** |
| mediana | 45 | 46 | 45 | 45 | **45** |
| sobem | | 24 | 3 | 20 | **36** |
| descem | | 0 | 0 | **79** | **64** |
| iguais | | 83 | 104 | 8 | **7** |
| faixa para cima | | 4 | 0 | 0 | **6** |
| faixa para baixo | | 0 | 0 | **13** | **13** |
| maior subida | | +9 | +2 | +6 | **+12** (59 para 71) |
| maior queda | | 0 | 0 | -6 | **-6** (43 para 37) |

Faixas líquidas por dezena: `10:4 20:11 30:19 40:34 50:18 60:14 70:7` contra
`10:4 20:10 30:9 40:43 50:28 60:10 70:3` antes.

**O teto dos sinais é a força dominante, e no sentido contrário ao esperado.** Sozinho ele derruba a nota
de **79 das 107** e move 13 para a faixa de baixo. O motivo é direto: quase todo mundo APROVA os sinais
autodeclarados (a maioria responde que tem foto, que tem conexões), então esses 28 pontos eram pontos que
as pessoas estavam ganhando. Reduzi-los a 12 tira de quem os tinha. A média quase não se move (46,0 para
45,9) porque a cobertura empurra 24 para cima enquanto os sinais empurram 79 para baixo: **o agregado
esconde que 100 das 107 mudam de nota.**

A densidade por `level` quase não aparece (3 perfis, +2 no máximo), e isso também é informação: das 75
análises de nível leve com Sobre preenchido, 70 já passavam em 500 caracteres. O afrouxamento é justo, e
não é onde estava o problema.

**Checks por item**, não recomputável, mantém o intervalo da seção 3: até 70 perfis podem cair 5 a 6
pontos, com até 26 mudando de faixa para baixo no pior caso. Somado ao líquido acima, o pior caso total é
consideravelmente mais duro que o que a tabela mostra. A próxima simulação desta pergunta será exata,
porque `experienciasDescricaoTamanhos` passa a ser persistido.

## 3-quinquies. Reversão do teto de sinais e simulação FINAL

O teto de 12 pontos nos sinais autodeclarados **foi revertido** por decisão de produto, e a decomposição
acima é o motivo: 100% do movimento para baixo e 100% dos 13 rebaixamentos vinham dele. Cobertura e
densidade não derrubavam ninguém. O teto tirava ponto exatamente de quem respondeu a verdade sobre ter
foto, banner e Open to Work, que são ações reais e as mais fáceis de executar.

O risco que ele endereçava (inflação invisível e gamificável) ficou com dois mecanismos que não custam
ponto de ninguém: o bloco rotulado **"você declarou"**, separado do que a ferramenta leu do PDF, e
`mudancaSoDeAutodeclaracao`, que impede delta e celebração quando a única coisa que mudou entre duas
análises foi autodeclaração.

**Limite conhecido dos dois, declarado**: eles protegem a COMPARAÇÃO, não o número absoluto de uma
primeira análise, onde não existe "antes". Uma pessoa que responde "sim" aos cinco sinais na primeira
análise leva 28 pontos que a ferramenta não conferiu, e a separação torna isso visível na tela mas não
tira do número que ela vê e compartilha. É o vetor que sobra.

**Simulação final, sem o teto:**

| | antes (v1) | só cobertura C | só densidade | **FINAL (as duas)** |
|---|---|---|---|---|
| média | 46,0 | 47,4 | 46,0 | **47,5** |
| mediana | 45 | 46 | 45 | **46** |
| sobem | | 24 | 3 | **27** |
| **descem** | | 0 | 0 | **0** |
| iguais | | 83 | 104 | **80** |
| faixa para cima | | 4 | 0 | **4** |
| **faixa para baixo** | | 0 | 0 | **0** |
| maior subida | | +9 | +2 | **+9** (49 para 58) |
| maior queda | | 0 | 0 | **nenhuma** |

Faixas finais por dezena: `10:4 20:10 30:8 40:41 50:22 60:16 70:6` contra `10:4 20:10 30:9 40:43 50:28
60:10 70:3` antes.

**Nenhuma das 107 perde ponto por reponderação.** O único vetor de queda que sobra é o `exp-descricoes`
por item, que não é simulável sobre as 107 (o campo `experienciasDescricaoTamanhos` só passa a existir
daqui pra frente) e cujo intervalo continua sendo o da seção 3: até 70 perfis, 5 a 6 pontos, até 26
mudando de faixa para baixo no pior caso. Diferente do teto, essa queda tem causa verdadeira: uma
experiência sem descrição própria é um buraco real do perfil, e o card que dizia "critérios ok" para ela
estava mentindo.

## 3-sexies. `skills-cobertura` na variante C (pré-deploy)

O terceiro check do achado #1 da rodada 1. Ele pedia `>= 0,5` de TODA a pool da área nas competências
coladas (11 em fullstack, 32 em backend) e aprovava **0 das 107**.

**A variante C direta aqui seria errada.** O numerador vem só das competências coladas, e o que o check
pergunta é REGISTRO, não conhecimento: "o que você prova está cadastrado?". Cobrar `min(6, ⌈pool/2⌉)`
contra a pool transformaria este check numa segunda cópia de `cobertura-keywords-area`, e uma pessoa que
comprova 4 tecnologias e cadastrou as 4 continuaria reprovando **sem ter o que fazer a respeito**.

A forma adotada é o corte da variante C **limitado pelo que a pessoa comprova**, com guarda para o zero:

```
minimo = min(essencial_da_area, tecnologias_comprovadas)
aprova = tecnologias_comprovadas > 0 && cadastradas >= minimo
```

Sem a guarda, `min(6, 0) = 0` e `0 >= 0` aprovaria: **27 das 107 ganhariam um check essencial de 10 pontos
por não ter nada**.

**Sobre a recuperação do número, e por que ela não é método.** A contagem de tecnologias-chave nas
competências não é persistida. Ela foi recuperada invertendo o percentual do `detail`
(`pct = round(100·n/pool)`), e a inversão é **unívoca em 0 de 107** casos: nenhum percentual admite dois
inteiros. Isso vale como **medição de uma vez**, feita e conferida, e **não vale como método**: este mesmo
documento registra na seção 1 que extrair número de string de copy quebra em silêncio na primeira mudança
de texto. Nada em produção depende dessa inversão; ela existiu para responder a esta pergunta e morre aqui.

Medido sobre as 107:

| forma | aprovam |
|---|---|
| hoje, `>= 0,5` da pool | **0/107** |
| variante C direta | 7/107 |
| **adotada** (limitada pelo comprovado) | **16/107** |

**Distribuição de tecnologias comprovadas entre os 16 que passam** (a pergunta é se o check virou fácil):

| comprovadas | 1 | 2 | 4 | 5 | 6 | 8 | 10 | 15 |
|---|---|---|---|---|---|---|---|---|
| perfis | 4 | 3 | 1 | 1 | 1 | 3 | 2 | 1 |

**7 dos 16 (44%) passam comprovando 1 ou 2 tecnologias**, e os 4 de "comprova 1, cadastrou 1" são o caso
extremo: um check `essencial` de 10 pontos por cadastrar uma única tecnologia. Os outros 7 comprovam 6 ou
mais, ou seja, passam pelo corte cheio.

A leitura honesta: o check mede **registro**, e quem comprova 1 e cadastrou 1 registrou 100% do que tem.
O que impede esse perfil de ter nota alta é `cobertura-keywords-area`, que continua exigindo 6 e continua
reprovando ele. São dois checks com duas perguntas. Se a decisão for que registrar 1 não deveria valer um
essencial inteiro, o ajuste natural é um piso (`max(2, min(essencial, comprovadas))`), que tiraria os 4
casos de 1 e deixaria 12 aprovando. **Não foi feito**: é decisão de produto, e o número está aqui para ela
ser tomada com dado.

### Simulação líquida com as TRÊS mudanças de cobertura

| | antes | depois |
|---|---|---|
| média | 46,0 | **48,3** |
| sobem | | **36** |
| **descem** | | **0** |
| iguais | | **71** |
| faixa para cima | | **10** (3 `inicio->em-construcao`, 7 `em-construcao->forte`) |
| **faixa para baixo** | | **0** |
| maior subida | | **+15** (56 para 71) |
| maior queda | | **nenhuma** |

Faixas: `10:2 20:9 30:9 40:42 50:23 60:12 70:10` contra `10:4 20:10 30:9 40:43 50:28 60:10 70:3`.

Entra na mesma `deterministicVersion` **4**, sem bump novo: a v4 ainda não subiu, então não existe análise
gravada com ela para ficar incomparável. Bumpar para 5 marcaria como incomparáveis duas versões que nunca
coexistiram em produção.

## 3-quater. Teto teórico e a faixa Magnético

**O teto teórico é 100**, e sempre foi: com todos os 27 (Brasil) ou 28 (exterior) checks aprovados, a nota
é 100 por construção. A pergunta que importa é outra: **existe perfil real capaz de chegar a 90?**

Medido: reprovar UM check essencial derruba de 100 para **94**; reprovar um opcional derruba para **99**.
Ou seja, dá para falhar dois essenciais e ainda ficar em Magnético.

**A resposta mudou com a régua v2, e a causa é exatamente a que a rodada 1 identificou.** O teto real
medido lá era 85 a 87 porque os dois checks de cobertura eram inalcançáveis: em `backend`, a v1 exigia 32
das 64 tecnologias-chave comprovadas no perfil, e 48 para a marca ótima. Com a variante C são **6 e 10**,
em qualquer área.

Prova concreta: a fixture `perfil-a-senior`, um perfil exemplar e realista, saiu de **82 (forte)** para
**90 (magnetico)**. Ela ainda reprova três checks (`termos-bilingues`, `skills-cobertura`,
`skills-quantidade-otima`), todos alcançáveis por uma pessoa real que escreva o cargo em inglês e cadastre
25 competências.

**Magnético deixou de ser decorativa.** Não mexi em nenhuma fronteira de faixa.

## 4. O que isto não decide

A mensagem que o usuário lê quando a nota dele muda sem ele ter mexido no perfil. Os números acima dizem
que a recalibragem de cobertura **sobe** a nota de 24 e derruba a de 1, e que os checks por item **descem**
a de até 70. As duas mudanças juntas se cancelam parcialmente, e a ordem em que forem para produção decide
o que a pessoa vê. Decisão de produto.
