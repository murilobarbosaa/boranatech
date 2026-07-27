# Fechamento da Fase 3

Molde do `docs/fase0-fechamento.md`. O que mudou, em que ordem, o número líquido, a classe de defeito que
a fase inteira perseguiu, a dívida aberta, e o que a próxima fase pode e não pode assumir.

## 1. O que mudou

**A régua v2 do analisador (muda nota).** Quatro decisões, todas medidas sobre as 107 análises persistidas
antes de virar código:

- **Cobertura por corte relativo à pool da área** (variante C): `min(6, ⌈pool/2⌉)` para o essencial e
  `max(essencial+1, min(10, ⌈pool·0,75⌉))` para o ótimo. A v1 pedia 50% e 75% de TODAS as tecnologias da
  área, o que em `backend` eram 32 e 48 comprovadas no perfil: **1 das 107 aprovava o essencial e 0
  aprovavam o ótimo.** A régua não classificava, reprovava todo mundo.
- **`exp-descricoes` por item**: veredito por experiência, não pelo bloco concatenado. O agregado somava
  todas as descrições e comparava com 100, então uma experiência vazia entre quatro cheias passava e o
  card dizia "critérios ok" para um perfil com buraco.
- **`level` modula dois limiares de densidade**: `sobre-tamanho` (500 → 300 no nível leve) e descrição
  mínima por experiência (100 → 50). Não toca tier.
- **Sinais autodeclarados**: bloco rotulado "você declarou" e supressão de delta e celebração quando a
  única mudança entre duas análises foi autodeclaração. **Sem reponderação** (ver seção 3).

**Instrumentos (não mudam nota).**

- `check:migrations` passou a verificar **funções** (via OpenAPI do PostgREST, leitura pura) e **RLS**
  (contando com service role e lendo com a chave anon). Ganhou a **direção inversa**: o que existe no banco
  e nenhuma migration declara.
- `mutateLinkedinThresholds.mjs` passou a **descobrir os limiares da fonte** e abortar em sítio numérico
  não classificado.
- `tsconfig.json` passou a typechecar `*.test.ts`.
- Pre-commit passou a rodar a suíte inteira.
- **TOCTOU do limite diário de IA fechado** com reserva atômica (`reserve_ai_usage_slot`), com modo
  degradado ruidoso quando a RPC falta.

## 2. Commits, em ordem

```
41a1ce1  chore(ts): typecheck test files and fix the errors they were hiding
3ce71b9  fix(tooling): enumerate mutation scope from source and fail on unknown thresholds
b176926  fix(linkedin): stop sidebar sections at the identity block
ae22d5f  chore(tooling): keep the neighborhood report out of the repo root
0f92955  fix(ai): reserve the daily quota slot atomically to close the TOCTOU window
eecaee1  docs(linkedin): simulate the v2 ruler over the 107 persisted analyses
cfd7e70  feat(tooling): verify declared functions and enumerate policies and indexes
028b218  fix(ai): make the degraded quota path loud and bind the tool identifier per route
8bec634  feat(linkedin): persist per-experience description lengths for future simulation
d299357  docs(linkedin): simulate three coverage variants and their reachability per area
41e469e  feat(tooling): verify RLS by reading with the anon key instead of only enumerating
5855c8f  fix(tooling): lex sql comments and apply create and drop in source order
82954a6  docs: restate the silent-undermatch principle and the assert-the-total countermeasure
0ac8060  feat(linkedin): release ruler v2 with per-area coverage, per-item experiences and capped signals
7fb7f91  fix(linkedin): revert the self-declared signals weight cap and label the block
7fdb7c9  ci(migrations): require the anon key so the rls guard cannot skip silently
03ca307  docs(linkedin): justify the level assigned to every golden fixture
01d6af0  docs(linkedin): rewrite the bump copy and record the final simulation
```

## 3. O número líquido

Sobre as 107 análises persistidas, com as duas mudanças recomputáveis (cobertura e densidade):

| | antes | depois |
|---|---|---|
| média | 46,0 | **47,5** |
| mediana | 45 | **46** |
| sobem | | **27** |
| **descem** | | **0** |
| iguais | | **80** |
| faixa para cima | | **4** |
| **faixa para baixo** | | **0** |
| maior subida | | **+9** (49 para 58) |

**Nenhuma das 107 perde ponto por reponderação.** Uma versão anterior deste release incluía um teto de 12
pontos nos sinais autodeclarados; a decomposição mostrou que **100% do movimento para baixo e 100% dos 13
rebaixamentos vinham dele**, e ele foi revertido. O único vetor de queda que sobra é `exp-descricoes` por
item, não simulável sobre as 107 (o campo só existe daqui pra frente), com intervalo de até 70 perfis
caindo 5 a 6 pontos no pior caso. Essa queda tem causa verdadeira: uma experiência sem descrição é um
buraco real, e o card que dizia "critérios ok" estava mentindo.

`deterministicVersion` 3 → 4. Delta e celebração suprimidos entre versões diferentes, com teste.

**Magnético deixou de ser decorativa.** O teto real medido na rodada 1 era 85-87 por causa da cobertura
inalcançável; a fixture `perfil-a-senior` saiu de 82 (forte) para **91 (magnetico)**. Nenhuma fronteira de
faixa foi tocada.

## 4. A classe de defeito, e a contramedida que funcionou

A fase inteira girou em torno de uma classe só: **instrumento de verificação cujo escopo é derivado por um
parser que pode sub-casar em silêncio.** Lista escrita à mão é o caso degenerado; regex, janela de contexto
e ordem de aplicação são o mesmo mecanismo. Todas falham **passando**.

| # | Instância | Como falhava | Contramedida |
|---|---|---|---|
| 1 | Migration `linkedin_improvement_progress` | Dependia de alguém lembrar de aplicar | Guard que compara o declarado com o banco |
| 2 | Regex de `create table` | Enxergava 38 de 72 tabelas | Contagem ampla contra a lida, abortando na diferença |
| 3 | Pre-commit com lista de arquivos | Liberou árvore vermelha com 10 testes quebrados | Rodar a suíte inteira, sem enumerar |
| 4 | Janela de 4000 caracteres no `returns trigger` | Classificou `get_study_heatmap` e `is_user_admin` como trigger, tirando duas RPC reais da verificação | Escopar ao primeiro `returns` + `EXPECTED_TRIGGER_FUNCTION_COUNT` |
| 5 | `stripSqlComments` por regex | Casou o `/*` de `/api/cron/*` com o `*/` de um cron `*/6` e apagou 3663 caracteres de SQL real, escondendo `call_cron_endpoint` | Lexer mínimo: string, dollar-quoting, aninhamento |
| 6 | `CREATE` antes de `DROP` por categoria | `drop function x; create function x;` terminava com `x` removido do conjunto | Aplicar eventos em ordem de origem |

**A contramedida que funcionou nas três vezes em que foi aplicada: afirmar o TOTAL, não a pertinência.** Um
guard que responde "os N que eu conheço estão lá" é inútil; um que responde "existem exatamente N, e são
estes" quebra quando o conjunto muda. Nas três formas: contagem ampla contra a lida; asserção de tamanho
do conjunto (`EXPECTED_TABLE_COUNT`, `EXPECTED_FUNCTION_COUNT`, `EXPECTED_RLS_COUNT`); e descoberta a
partir da fonte com aborto em item não classificado.

## 5. Dívida aberta

- **Policies (72) e índices (124) continuam enumerados e não verificados.** O PostgREST não os expõe e o
  projeto não tem `DATABASE_URL` nem cliente Postgres. O EFEITO da policy de SELECT é verificado (leitura
  com anon); o conteúdo de `using`/`with check` não é.
- **Trigger, view, enum, grant e alteração de coluna** seguem fora do escopo do guard. A maior é alteração
  de coluna: o guard confirma que a tabela existe, não que ela tem as colunas que o código espera.
- **7 tabelas inconclusivas** na verificação de RLS (6 vazias e uma inexistente). Tabela vazia não prova
  nada e nunca conta como verde.
- **`skills-cobertura` continua por razão** (`>= 0,5` do total da área), a mesma forma que foi corrigida em
  `cobertura-keywords-*`. Não estava no escopo desta fase.
- **`billing_orphan_payments` não aplicada.** Nenhum código em produção a toca (o commit não está em
  `origin/main`), então a ausência é inofensiva até o deploy correspondente.
- **A régua v2 não está em produção.** O repositório local está mais de 80 commits à frente de
  `origin/main`. `reserve_ai_usage_slot` **já foi aplicada no banco**, então o TOCTOU continua aberto em
  produção até o deploy, e a ordem ficou migration-antes-do-código (inofensivo aqui: função aditiva que
  ninguém chama).

## 6. O que a próxima fase pode assumir

**Pode:**

- Toda tabela e toda função declarada em migration existe no banco alvo, ou o guard falha nomeando.
- Nenhuma tabela com RLS declarada é legível pela chave anon sem policy pública que justifique.
- Todo limiar numérico dos módulos do LinkedIn está classificado, e um limiar novo aborta o varredor.
- Todo limiar que a Fase 3 tocou tem mutante de vizinhança (±1/±2) que quebra teste.
- Arquivo de teste é typechecado.
- Commit não sai com a suíte vermelha.
- `experienciasDescricaoTamanhos` passa a ser persistido: a próxima simulação de "checks por item" será
  exata, não intervalar.

**Não pode:**

- Assumir que policy ou índice declarado existe.
- Assumir que a nota de uma análise v3 é comparável com uma v4.
- Assumir que os números das 107 refletem o parser de hoje: elas foram calculadas antes das Fases 1A e 1B.
- Assumir que a régua v2 está em produção.

## 7. Duas perguntas abertas, sem resposta aqui

**As fronteiras de faixa (39, 69, 89) foram calibradas contra uma distribuição comprimida por um bug já
corrigido.** Quando elas foram escolhidas, a cobertura reprovava 106 das 107 e o teto real era 85-87: a
distribuição que serviu de base estava espremida por um defeito. Com a v2 a média subiu para 47,5 e
Magnético passou a ter ocupante. As fronteiras continuam onde estavam, e ninguém verificou se elas ainda
separam o que deveriam separar.

**A lista-núcleo curada por área continua sendo a resposta melhor que a contagem absoluta.** A variante C
conserta a alcançabilidade, mas continua tratando toda tecnologia da área como igualmente importante:
provar 6 tecnologias periféricas vale o mesmo que provar as 6 centrais. Uma lista-núcleo por área (as 5 ou
6 que um recrutador realmente filtra) mediria a coisa certa, e o custo é curadoria humana por área, que é
trabalho de produto e não de código.
