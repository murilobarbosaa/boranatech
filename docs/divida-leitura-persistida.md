# Dívida: leitura de `result` persistido sem guarda

Levantamento, não plano de execução. Nada aqui foi alterado.

## O problema, em uma frase

`linkedin_analyses.result`, `github_analyses.result` e `resume_analyses.result` são `jsonb` gravados por uma
versão do código e lidos por outra, **sem nenhuma validação em runtime na volta** (as funções de client fazem
`body.data ?? null`, um cast e nada mais). Todo acesso direto a `result.x.y` é uma aposta de que o formato
gravado meses atrás é o que o bundle de hoje espera. Quando não é, não dá erro tratado: dá tela branca.

É a mesma classe do incidente que o `CLAUDE.md` documenta em "Lookups por valor do servidor"
(`STATUS_META[item.status].label` derrubando o admin em produção), e foi por isso que a Fase 0 introduziu
`readQualitative` para o `qualitative` do LinkedIn.

## Inventário: 31 acessos diretos remanescentes

### `client/src/pages/LinkedinAnalisar.tsx`, 18 acessos a `result.deterministic.*` (feature já parcialmente coberta)

| Linha | Expressão | Risco se o campo sumir |
|---|---|---|
| 805 | `setResult(record.result)` | entrada de tudo abaixo; sem validação |
| 816, 817 | `record.result.deterministic.score` | `undefined` em comparação: delta errado, não quebra |
| 915 | `result.deterministic.sobreTamanho` | comparação falsa, degrada silencioso |
| 922 | `result.deterministic.experienciasContagem` | idem |
| 957 | `faixa={result.deterministic.faixa}` | **coberto** por `faixaUiOf` desde a Fase 0 |
| 1553, 1555, 1577 | `result.deterministic.headline` | render condicional, tolera `undefined` |
| 1618, 1629 | `result.deterministic.sobreTamanho` | render de texto, tolera |
| 1714, 1725, 1727 | `result.deterministic.experienciasContagem` | render de texto, tolera |
| 1745, 1747, 1748, 1830 | `result.deterministic.skillsContagem` | render de texto, tolera |

Detalhe importante: **nenhum destes 18 chama método em array ou objeto aninhado**. São números, strings e
comparações, que com `undefined` degradam feio mas não lançam. Os que realmente lançariam já estão cobertos:
`checks` passa por `checksByCategory` com `?? []`, `faixa` por `faixaUiOf`, e
`skillsParaAdicionarAgora` por `?? []`.

O ponto de verdade é outro: `RecruiterFinder` recebe `deterministic` inteiro e faz
`keywordsEncontradas.length`, `keywordsFaltantes.map` e `titulosIngles.map`
(`client/src/components/linkedin/RecruiterFinder.tsx:20-108`). **Esses três lançam** se o campo faltar. Hoje não
lançam porque as 107 linhas têm formato uniforme (verificado: todas com as mesmas 10 chaves de `deterministic`),
mas é o único ponto da feature onde uma mudança de formato vira tela branca.

### `client/src/pages/PortfolioAnalisar.tsx`, 13 acessos (outra feature)

`result.deterministic.band`, `.suficienciaRazao`, `.checks`, `.score`, e `result.qualitative.proximoPasso`,
`.resumo`, `.pontosFortes`, `.pontosFracos`, `.melhorias`, `.readmeSugestao`, mais `record.result` no
`openHistory`. Mesmo padrão, mesma ausência de validação, banco próprio (`github_analyses`).

### `client/src/pages/CurriculoAnalisar.tsx`, 4 acessos (outra feature)

`record.result.score`, `.faixa`, `.criterios`, `.qualitative`, em `resume_analyses`.

## Menor conjunto que precisa de guarda antes da Fase 1

A Fase 1 vai mexer no parser (`shared/linkedin/parse.ts`) e nas checagens. O que ela muda é **o conteúdo** de
`deterministic`, não necessariamente o formato. Então a pergunta certa é: o que quebra se a Fase 1 acrescentar,
renomear ou remover um campo de `LinkedinDeterministicResult`?

**Conjunto mínimo, 3 leituras, todas em `RecruiterFinder.tsx`:**

1. `keywordsEncontradas.length` e `.map` (`:40-52`)
2. `keywordsFaltantes.length` e `.map` (`:63-75`)
3. `titulosIngles.map` (`:91-108`)

São as únicas que **lançam** em vez de degradar, e as três estão no caminho de render do resultado, alimentadas
direto pelo jsonb persistido. A correção é um `readDeterministic` no molde do `readQualitative`, ou, se o
apetite for menor, três `?? []` mais um `deterministicVersion` estampado na escrita.

Recomendação: **`readDeterministic` antes da Fase 1**, pelo mesmo argumento que valeu para o `qualitative` —
a Fase 1 é exatamente a rodada que vai mudar o formato, e o histórico de 107 análises é onde a mudança aparece.
Custo estimado: 2 a 3 horas, incluindo teste com a fixture legada que já existe
(`server/lib/__fixtures__/linkedin/result-legado-v1.json`).

Os 17 acessos restantes do LinkedIn podem esperar: degradam para texto estranho, não para tela branca. As
outras duas features (Portfólio e Currículo) ficam fora da Fase 1 por definição de escopo, mas herdam o mesmo
risco e o mesmo remédio, e o `readQualitative` já serve de molde pronto para as duas.
