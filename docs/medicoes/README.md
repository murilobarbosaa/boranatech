# Medição semântica de personalização dos roadmaps com IA

Instrumento construído na entrada da Fase 3, **antes** de qualquer mudança de
prompt, para haver um "antes" contra o qual comparar o "depois". Nenhum prompt de
geração foi alterado nesta medição.

Script: `scripts/avaliarRoadmapIA.mts`. Baseline:
`baseline-personalizacao-2026-08-04.json`.

## Por que ele existe

A métrica ingênua foi medida e **refutada**: intake rico deu 342 caracteres por
passo e intake pobre 289, e a diferença inteira vinha de um único outlier.
Comprimento e contagem de passos medem **volume**. Um roadmap pode ser longo e
genérico, e a pergunta que importa é outra: _este plano é daquela pessoa?_

## Desenho

**Metade computada, sem IA.** Carga declarada contra tempo disponível,
consistência de unidade, ids de projeto, sub-passos. Perguntar isso a um juiz
seria trocar uma medida exata por uma opinião cara. Coberta por 11 testes em
`scripts/avaliarRoadmapIA.test.ts`.

**Metade julgada, com IA.** Só o que exige ler o texto. Juiz **gpt-4o**,
`temperature: 0`, `response_format: json_schema` estrito, com **evidência textual
obrigatória** por nota. O gerador é `gpt-4o-mini`: modelo diferente de propósito,
porque juiz que avalia o próprio estilo infla nota.

**Custo: US$ 0,0175 por avaliação.** Os 29 roadmaps custaram **US$ 0,51**.

**Separação entre PERSONALIZAÇÃO e QUALIDADE.** As quatro primeiras dimensões
dependem do intake; as três últimas não. É essa separação que torna o teste
adversário possível.

## Rubrica

Escala 1 a 5, ancorada e idêntica em todas as dimensões: 1 = ausente, 2 = menção
superficial, 3 = parcial, 4 = consistente, 5 = central (o plano só faz sentido
para alguém com este intake).

| Grupo          | Dimensão           | O que mede                                      |
| -------------- | ------------------ | ----------------------------------------------- |
| Personalização | `objetivo`         | o plano leva ao `goal` declarado                |
| Personalização | `ponto_de_partida` | reconhece o que a pessoa já sabe                |
| Personalização | `stack`            | usa o `stackFocus` citado (null se vazio)       |
| Personalização | `obstaculos`       | considera `constraints` e `motivation`          |
| Qualidade      | `especificidade`   | subtópicos concretos vs "estude os fundamentos" |
| Qualidade      | `acionabilidade`   | dá para começar hoje só com o que está escrito  |
| Qualidade      | `escrita`          | clareza e progressão                            |

**A calibragem de carga saiu do juiz e virou cálculo**, porque é calculável:
soma dos `estimatedTime` em horas contra `hoursPerWeek × deadline`.

## Calibração: o instrumento discrimina

Quatro casos-controle. Duas iterações; a primeira está registrada porque a
correção dela é a evidência de que o instrumento foi calibrado e não só escrito.

| Caso                                                  | P        | Q    | Esperado          |
| ----------------------------------------------------- | -------- | ---- | ----------------- |
| 1 correto (roadmap + seu próprio intake)              | **3,50** | 4,67 | P alta            |
| 2 trocado (mesmo roadmap, intake de outra pessoa)     | **1,75** | 3,67 | P baixa           |
| 3 adversário (genérico bem escrito + intake avançado) | **1,50** | 3,67 | P baixa, Q alta   |
| 4 `ia-c209bae0`                                       | 3,25     | 4,00 | hipótese a testar |

**Veredito: discrimina.** Personalização separa 3,50 (par correto) de 1,50-1,75
(trocado e adversário) — **2 pontos numa escala de 5**, com a qualidade
permanecendo acima em todos os casos.

**Iteração 1 → 2.** O caso adversário usava o intake de `ia-b9ec1b72`
(`startingPoint: "iniciante"`) e o juiz deu `ponto_de_partida = 4` ao roadmap
genérico. O juiz estava **certo**: um plano que começa em tipos e variáveis
_serve_ para um iniciante. O caso é que não testava nada, porque "genérico" e
"bom para iniciante" coincidem. Trocado para um intake avançado (alguém que já
estuda Angular e React), o adversário caiu de 2,75 para **1,50**.

**O caso 4 refutou uma hipótese minha.** Eu havia chamado `ia-c209bae0` de
"geração degradada" olhando 5 seções e 205 caracteres por passo — exatamente as
métricas de volume que este instrumento existe para substituir. O juiz deu
P=3,25 e Q=4,00, com `stack=5`. **O rótulo estava errado**, e quem o produziu foi
a métrica que eu mesma havia refutado.

## Determinismo

Três execuções no mesmo par, `temperature: 0`:

| Medida                    | Valores            | Amplitude |
| ------------------------- | ------------------ | --------- |
| Personalização (composta) | 3,00 / 3,50 / 3,50 | **0,50**  |
| Qualidade (composta)      | 4,67 / 4,67 / 4,67 | **0,00**  |
| Dimensões isoladas        | —                  | **1,00**  |

**Os compostos são a unidade confiável.** Diferença de 1 ponto numa dimensão
isolada é ruído e não deve ser interpretada; diferença de composto acima de 0,5
é sinal.

## Baseline: 27 roadmaps reais

Os dois do smoke test (`ia-5de5a6c6`, `ia-dcffb368`) ficam fora da análise porque
o intake é sintético. Avaliados à parte: P=3,00 e P=2,33.

| Dimensão               | Média    | Mín | Máx | n   |
| ---------------------- | -------- | --- | --- | --- |
| **`ponto_de_partida`** | **1,81** | 1   | 5   | 27  |
| `obstaculos`           | 2,44     | 2   | 4   | 27  |
| `objetivo`             | 3,19     | 2   | 4   | 27  |
| `acionabilidade`       | 3,52     | 3   | 5   | 27  |
| `escrita`              | 4,00     | 4   | 4   | 27  |
| `stack`                | 4,00     | 3   | 5   | 12  |
| `especificidade`       | 4,15     | 3   | 5   | 27  |

**Compostos:** personalização **2,61**, qualidade **3,89**.

**A hipótese "intake rico gera roadmap mais personalizado" é verdadeira, mas
fraca:** r = **+0,37** entre número de campos e personalização. Por faixa, o
ganho está concentrado no topo:

| Campos | n   | P médio  |
| ------ | --- | -------- |
| 4 a 6  | 8   | ~2,36    |
| 7      | 12  | 2,47     |
| 8      | 7   | **3,13** |

**Métricas computadas:** **21 de 27** roadmaps misturam unidade (horas e semanas
no mesmo plano), e **14 de 27** têm razão de carga fora da faixa 0,5-1,5 (mediana
0,88).

## O que a Fase 3 deve atacar primeiro

**`ponto_de_partida`, e o número que sustenta é 1,81 de 5** — a pior dimensão,
com folga de 0,63 para a segunda pior.

E o padrão por trás é mais específico que a média. **23 dos 27 roadmaps têm
`startingPoint` preenchido**, muitos com detalhe rico ("já atua em projeto com
React e TypeScript", "6º semestre de Ciências da Computação", "bom conhecimento
de Python"). Entre esses 23, a média é **1,96**. E as duas únicas notas altas vão
para as duas pessoas que declararam **não saber nada**:

| Roadmap       | `startingPoint` declarado                      | Nota  |
| ------------- | ---------------------------------------------- | ----- |
| `ia-760e4a4a` | "sem conhecimento prévio em frontend e lógica" | **5** |
| `ia-b9ec1b72` | "iniciante"                                    | 3     |
| `ia-9a7f1bcf` | "já atua em projeto com React e TypeScript"    | 2     |
| `ia-23584789` | "bom conhecimento de Python"                   | **1** |
| `ia-375b2f86` | "base em desenvolvimento full stack"           | **1** |

**O gerador só respeita o ponto de partida quando ele é zero.** Quem declara
conhecimento prévio recebe um plano que recomeça do início. É a personalização
mais cara de coletar (texto livre, custa turnos de conversa) e a menos usada.

Segundo alvo: `obstaculos`, em 2,44, com o mesmo formato de problema.

## Limites e vieses declarados

**O que ele NÃO mede:**

- **Correção técnica.** Se o roadmap ensinar algo errado, o juiz não pega. Ele
  avalia adequação à pessoa, não veracidade.
- **Se a pessoa vai conseguir seguir.** Nenhuma nota aqui prevê conclusão. Só o
  funil do PostHog responde isso.
- **Qualidade dos projetos indicados.** `project` entra como contagem, não como
  julgamento de conteúdo.
- **Ordenação.** Um plano com os tópicos certos na ordem errada pontua igual.

**Vieses, medidos onde deu:**

- **Comprimento: não encontrado.** A correlação entre número de passos e
  qualidade é r = **+0,14**, praticamente nula, e com personalização r = +0,05.
  O juiz não está premiando volume — que era o defeito da métrica anterior.
- **`escrita` não informa nada.** Todas as 27 notas foram **4**, variância zero.
  A dimensão não discrimina e deve ser refeita ou descartada; hoje ela só dilui o
  composto de qualidade.
- **Auto-preferência não foi eliminada, só reduzida.** Juiz e gerador são
  modelos diferentes, mas da mesma fabricante e provavelmente com dados de treino
  sobrepostos. Um juiz de outra família daria uma segunda opinião útil, e isso não
  foi feito.
- **`stack` só tem n=12**, porque 15 pessoas não declararam `stackFocus`. A média
  4,00 dessa dimensão vale para menos da metade do corpus.
- **O corpus é homogêneo.** Os 27 são quase todos `goal: primeira-vaga`, o que
  limita o quanto o caso "trocado" consegue contrastar. Com um corpus mais
  variado a discriminação medida provavelmente seria maior, não menor.

**Onde ele pode enganar:** um roadmap que **cita** o intake sem mudar o plano
tende a ganhar 2 em vez de 1, e a diferença entre "mencionou" e "usou" é
justamente o que a escala tenta separar. Se a Fase 3 otimizar para a métrica em
vez de para a pessoa, o caminho mais barato é acrescentar menções. **A defesa é a
evidência textual**: toda nota vem com citação, e uma amostra lida à mão detecta
esse tipo de otimização. Ler a amostra é parte do procedimento, não opcional.
