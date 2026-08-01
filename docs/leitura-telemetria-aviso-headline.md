# Como ler a telemetria do aviso de headline cortada

**Escrito em 2026-07-31, ANTES de existir dado.** Esse é o ponto do documento: limiar declarado
antes do número vale mais que interpretação inventada depois. Se em duas semanas o resultado for
ambíguo, a tentação vai ser encaixar a explicação no que apareceu.

## Os dois eventos

| evento | quando | propriedades |
|---|---|---|
| `linkedin_headline_review` | uma vez por chegada de texto (PDF escolhido ou paste) | `cortada`, `assinatura`, `origem` |
| `linkedin_analysis_submitted` | uma vez por análise efetivamente enviada | `aviso_visto`, `corrigiu_apos_aviso` |

## Taxa de disparo: a linha de base é 17%

**27 de 156** análises persistidas até 2026-07-30 tinham assinatura inequívoca de corte.

- **Muito acima de 17%** → a detecção está frouxa. A suspeita concreta é a família F2b (primeira
  seção com uma palavra só, 39 casos), que ficou **de fora de propósito** porque casa headline
  legítima (`Student | Open to Internships`). Se a taxa subir muito, alguma das quatro assinaturas
  está pegando um caso legítimo que a amostra de 156 não continha. Olhar a quebra por `assinatura`
  antes de mexer em qualquer regra.
- **Muito abaixo de 17%** → o corpo persistido não representa o tráfego. As 156 são de quem
  **terminou** o fluxo; quem abandonou no passo de revisão nunca virou linha. Se a taxa real for
  bem menor, o aviso protege menos gente do que a medição sugeria, e a prioridade do (b) cai.

**Faixa que eu chamaria de "confirma a medição": 12% a 25%.** É chute com base em uma amostra só,
e está escrito aqui como chute.

## `corrigiu_apos_aviso`: o número que decide

É a única prova de que o aviso é **lido**, e não só de que aparece. Denominador: os envios com
`aviso_visto: true`.

- **Acima de 30%** → o aviso funciona. Vale manter e vale investir no (b), porque a pessoa
  demonstra que quer consertar quando sabe que há o que consertar.
- **Entre 10% e 30%** → zona cinzenta. O aviso é lido por alguns, e a leitura provável é que o
  texto explica o problema mas não oferece um caminho barato de conserto (colar o perfil de novo é
  trabalhoso). **É o cenário que mais fortalece o (b)**: dar um campo editável troca "cole tudo de
  novo" por "conserte esta linha".
- **Abaixo de 10%** → o aviso não está sendo lido, ou está sendo lido e ignorado. Antes de concluir
  que não serve, checar duas hipóteses baratas: o chip amarelo pode não estar chamando atenção
  suficiente, e a copy pode estar pedindo uma ação que parece cara demais. Só depois disso concluir
  que a detecção deve virar bloqueio (não deixar analisar) ou ser removida.

**Os três limiares (30% e 10%) são chute declarado.** Não há base empírica; existem para que a
conversa em duas semanas comece de um compromisso e não de uma racionalização.

## Viés conhecido, que não dá para tirar do número

Quem vê o aviso, apaga tudo e cola **outro** perfil (sem corte) conta como correção, igual a quem
colou o mesmo perfil inteiro. Do lado do cliente os dois são indistinguíveis sem comparar o texto,
e comparar texto de perfil para telemetria é mais dado do que a pergunta merece.

**`corrigiu_apos_aviso` é um teto, não uma medida exata.** Se ele vier alto, o número real de
correções é aquele ou menor, nunca maior.

## O que NÃO medir com isto

Não usar essa telemetria para estimar quantos perfis têm headline truncada no geral. As quatro
assinaturas cobrem só o que é inequívoco: **86 das 156 headlines antigas não têm assinatura
nenhuma**, e uma headline cortada que por acaso termine numa palavra é indetectável aqui. A taxa
mede o alcance do aviso, não a incidência do defeito.

## Onde está o código

- `client/src/lib/headlineCortada.ts` — as quatro assinaturas e o motivo de cada uma, mais o motivo
  de a F2b ficar de fora.
- `client/src/lib/headlineAvisoTelemetria.ts` — os payloads, puros e testáveis.
- `client/src/lib/headlineAvisoTelemetria.test.ts` — inclui a tabela verdade dos quatro cantos de
  `corrigiu_apos_aviso`, porque métrica de produto sem teste já falhou três vezes nesta base.
- `client/src/pages/LinkedinAnalisar.tsx` — os três pontos de captura (`handleFile`, `onPaste`,
  `runAnalysis`), nenhum deles em render nem no `useMemo`.
