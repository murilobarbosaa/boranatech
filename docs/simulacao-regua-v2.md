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

## 4. O que isto não decide

A mensagem que o usuário lê quando a nota dele muda sem ele ter mexido no perfil. Os números acima dizem
que a recalibragem de cobertura **sobe** a nota de 24 e derruba a de 1, e que os checks por item **descem**
a de até 70. As duas mudanças juntas se cancelam parcialmente, e a ordem em que forem para produção decide
o que a pessoa vê. Decisão de produto.
