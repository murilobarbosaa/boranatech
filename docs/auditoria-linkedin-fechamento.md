# Auditoria do Avaliador de LinkedIn: fechamento

Encerrada em 2026-08-01. Cobre da rodada 1 (`docs/auditoria-avaliador-linkedin.md`, 2026-07-26) até o
fechamento do check pendente (`DETERMINISTIC_VERSION = 7`, 2026-08-01).

**Como ler os números daqui.** Cada um tem data e fonte. Onde não há medição, está escrito **estimativa** e
por quê. Nenhum número deste documento foi arredondado para soar melhor, e a seção 3 existe para o resto não
virar propaganda.

---

## 1. O arco, em números

| o que | antes | depois | data / fonte |
|---|---|---|---|
| Teto real da nota | **85-87**, "Magnético" inalcançável | fixture `perfil-a-senior` foi de 82 para **91** | 2026-07-27, `docs/fase3-fechamento.md` §3 |
| `skills-cobertura` essencial | **1 de 107** aprovavam | **25 de 107** | 2026-07-27, `docs/simulacao-regua-v2.md` §5 (variante C) |
| `skills-cobertura` ótima | **0 de 107** | (não medido isolado) | idem |
| Fabricação (afirmações inventadas) | **58** | **0** | 2026-07-26 a 2026-07-27, `docs/rubrica-fidelidade.md` §6 |
| Custo por análise | US$ 0,0077 a 0,0162 (constante inflada **5,4x a 5,7x**) | **US$ 0,00122** medido | 2026-07-26, `docs/auditoria-avaliador-linkedin-rodada2.md` |
| Testes do parser, dos checks e do score | **zero** | cobertos, com **6 golden fixtures** | rodada 1 §12.1 / 2026-08-01, contagem direta |
| Suíte inteira | 2 testes na feature (65 linhas) | **1542 passando, 5 pulados** | rodada 1 §12.1 / 2026-08-01, execução local |
| Nota média sobre as 107 | 46,0 | **47,5** (27 sobem, **0 descem**) | 2026-07-27, `docs/fase3-fechamento.md` §3 |

### A cobertura de teste, com a precisão que a diferença exige

Rodada 1, §12.1:

> "Não há teste nenhum para `shared/linkedin/parse.ts` (342 linhas),
> `server/lib/linkedinChecks.ts` (467 linhas), `computeLinkedinScore`,
> `faixaFromScore`, `skillNormalize.ts`. Cobertura real do fluxo: próxima de zero."

**"Zero teste no parser" é verdade; "zero teste na feature" não era.** Existiam dois:
`checkLinks.test.ts` (37 linhas) e `stripPdfPageNoise.test.ts` (28). Nenhum tocava parser, checks ou score.

A diferença parece pedantismo e não é: "zero na feature" é o tipo de arredondamento para o lado dramático
que esta auditoria passou treze rodadas combatendo. Um número que soa melhor e é falso não é resumo, é a
mesma classe de defeito com sinal trocado.

### A curva da fabricação: a forma dela é o conteúdo

A série completa, `docs/rubrica-fidelidade.md` §6. Cada linha traz o n, porque ele muda no meio:

```
2026-07-26  antes da Fase 0                          n=10   58 inventadas   3 distorcidas
2026-07-26  Fase 0, item 7 (lastro por experiência)  n=10   22              0
2026-07-26  Fase 0, campos separados (v2)            n=10    3              0
2026-07-26  Fase 0, skillsParaAdicionarAgora (v3)    n=10    0              0
2026-07-26  Fase 1A, normalização de line-wrap       n=10    3              0
2026-07-27  Fase 1A-bis, saneamento de numeral       n=30    2              1
2026-07-27  Fase 1A-ter, camada única de lastro      n=30    4              0
2026-07-27  Fase 1B, reescrita do bloco de exp.      n=30    1              0
2026-07-27  Fase 2B, orçamento repartido             n=30    0              0    431 afirmações
```

**A curva não é uma descida.** Ela chega a zero na Fase 0, sobe de novo para 3, 2, 4, e só estabiliza em 0
na Fase 2B. Quem citar "58 → 0" está contando uma história que a medição não sustenta.

#### Por que subiu de novo

Cada fase mexeu na ENTRADA do modelo, e mudar a entrada muda o comportamento inteiro, não só o defeito
que se queria corrigir:

- **Fase 1A** normalizou quebra de linha e rodapé de PDF. O modelo passou a ver um texto diferente do que
  vinha vendo, e o resíduo reapareceu em 3.
- **Fase 1A-bis e 1A-ter** trocaram a camada de lastro. Duas vezes o resíduo **migrou de campo em vez de
  desaparecer**: o que era invenção de numeral em bullet virou invenção de tecnologia noutro lugar. O total
  subiu (2 → 4) sem que nada tivesse regredido no alvo original.
- **Fase 1B e 2B** deram ao modelo mais cabeçalhos e mais descrições (6 de 6 contra 5, 5 de 5 contra 3), com
  o orçamento de 6.000 caracteres repartido em vez de corte por posição.

Duas dessas medições têm ressalva declarada na própria rubrica: com n=10, uma execução suja a mais ou a
menos move o placar o bastante para ser indistinguível de ruído amostral. Foi por isso que o n subiu para 30.

#### A leitura que sobrevive

**As três reduções que funcionaram vieram de TIRAR TRABALHO DO MODELO, não de pedir melhor.**

```
58 → 22   lastro por experiência: o modelo deixou de ter que localizar a evidência
22 →  3   campos separados: deixou de ter que decidir onde cada coisa vai
 3 →  0   skillsParaAdicionarAgora calculado em CÓDIGO: deixou de gerar a lista
```

Nenhuma das três foi instrução melhor no prompt. As três removeram uma decisão do modelo e a colocaram em
código determinístico. **E a estabilidade só apareceu quando o último cálculo saiu do prompt** — a Fase 2B
é a primeira medição com n=30 em que o modelo não faz nenhuma conta que a plataforma já saiba fazer.

O corolário para a próxima feature de IA: cada cálculo que fica no prompt é uma superfície de fabricação, e
a taxa não cai de forma estável enquanto ele estiver lá.

### Os dois bugs que abriram a auditoria, e o que se revelaram

1. **Checklist de melhorias devolvendo 500** no meio de um resultado que dera certo. Causa: a migration
   `linkedin_improvement_progress` estava declarada no repositório e **nunca fora aplicada no banco**. Não era
   bug de código: era um passo de deploy que dependia de alguém lembrar.
2. **Resultado pago virando tela de erro**: o refresh de histórico rodava dentro do `try` da análise, e uma
   falha nele acionava o `catch`, apagando o resultado recém-gerado.

O que os dois se revelaram ser: **a causa do primeiro era invisível porque quatro rotas descartavam o
`error.message` do Supabase.** A string `Could not find the table` existia e ninguém a via. Os bugs eram
sintomas; o defeito era o silêncio.

### O que NÃO melhorou

**O truncamento de headline continua.** A correção `eeda681` (2026-07-30) cobre uma família de quebra
(vírgula com continuação forte) e a medição mostrou que ela é **1 caso em 156**. As famílias dominantes
seguem intactas.

Medição de 2026-08-01, sobre 170 análises persistidas, pelas **quatro assinaturas inequívocas**:

```
29 de 170  (17,1%)   termina em `|` 14 · começa em `|` 10 · minúscula 4 · vírgula 1
```

**Correção de um número que circulou:** o "39 de 156" é da família `F2b` (primeira seção com uma palavra
só), que **tem falso positivo** — `Student | Open to Internships` e `Estudante | Análise e Desenvolvimento`
são headlines legítimas. Ela ficou de fora da detecção de propósito. O número defensável é 29 de 170.

O que existe hoje: um aviso no passo de revisão (antes de gastar cota), a nota deixando de afirmar faixa
sobre leitura em dúvida (v7), e `headlineContexto` persistido para o próximo caso ser diagnosticável. **O
parser não foi corrigido**, e a razão está na seção 4.

---

## 2. A classe de defeito

### A anatomia

> **O instrumento mede um proxy da coisa, e o proxy coincide com a verdade quase sempre.**

Três consequências, e são elas que tornam a classe difícil:

1. **Falha PASSANDO.** Um instrumento que erra para menos não acusa: ele reporta sucesso sobre uma superfície
   menor. Verde é indistinguível de verde.
2. **Sobrevive à revisão.** O proxy é escolhido justamente porque é barato e correlacionado. Quem revisa
   confere se o instrumento roda, não se ele enxerga.
3. **Só aparece quando o proxy descola.** Pode levar 17 dias (o `get_ai_usage_today`), 13 rodadas (o
   truncamento de headline) ou dez deploys (o hash do entry).

O corolário operacional: **verificar que algo respondeu não é verificar o que ele respondeu.**

### As instâncias

Ordenadas por mecanismo, não cronologia. Todas medidas nesta base.

#### Escopo derivado por parser que sub-casa

| instância | como falhava | contramedida |
|---|---|---|
| Migration que dependia de alguém lembrar | Não havia instrumento nenhum | Guard comparando declarado com banco |
| Regex de `create table` | Enxergava **38 de 72** tabelas | Contagem ampla contra a lida, abortando na diferença |
| Pre-commit com lista de arquivos | Liberou árvore com 10 testes vermelhos | Rodar a suíte inteira, sem enumerar |
| Janela de 4000 chars no `returns trigger` | Classificou 2 RPC reais como trigger | Escopo até o primeiro `returns` + contagem esperada |
| `stripSqlComments` por regex | `/api/cron/*` casou com `*/6` e apagou 3663 chars de SQL | Lexer mínimo com dollar-quoting |
| `CREATE` antes de `DROP` | `drop x; create x;` terminava sem `x` | Aplicar eventos em ordem de origem |
| `check:migrations` verificando função por NOME | Guard **verde por 17 dias** sobre banco em que a mudança não estava | Asserção comportamental afirmando o conteúdo |
| Checklist de smoke que morava só na conversa | Sumiu numa compactação, perdeu 3 de 11 passos | Artefato de release é arquivo versionado |
| `S1` construída de um exemplo | "Termina em vírgula" achou **1 em 156** e foi reportada como família | Medir a assinatura sobre o corpo inteiro antes de nomeá-la |
| **O `58` que abre a série de sucesso** | A rodada 2 mediu **2** no mesmo prompt. A diferença era **unidade de contagem** (frases inteiras à mão em 3 execuções contra item de array em 10), não comportamento. Os dois estavam certos e não significavam a mesma coisa — e o número inflado é o que faz a melhora parecer maior | Rubrica congelada em `docs/rubrica-fidelidade.md`, com a unidade de contagem declarada e versionada: mudar definição obriga criar v2 |
| Classificar por FORMA em vez de origem | 3 sítios acusados, **2 falsos positivos** | Seguir a origem da chave, não o formato do acesso |
| Sub-casar para MAIS | Contou 4 onde esperava 3 — o caminho do import casava a string | Separar código de caminho antes de contar |

#### Falha que se propaga como dado, não como exceção

| instância | como falhava | contramedida |
|---|---|---|
| `contarLinhas` devolvendo `-1` | Erro de rede virou "protegida"; falha de infra contada como sucesso de segurança | Distinguir "não sei" de "zero" |
| `TIER_WEIGHTS[tier]` desconhecido | `possivel += undefined` → nota inteira `NaN`, sem erro | **Lançar**, não devolver peso de fallback |
| `env -i` | Limpou variáveis do shell, não o arquivo que o `dotenv` lê. 549 testes verdes sobre condição inexistente | Renomear o ARQUIVO, conferir md5 |
| Receita não-determinística no passo 12 do smoke | Dois operadores obtinham resultados diferentes | Receita com entrada fixa |

#### A superfície responde, e a resposta é lida como veredito

| instância | como falhava | contramedida |
|---|---|---|
| Blip de disponibilidade para detectar deploy | Railway troca sem downtime: 150 amostras, 200 sem exceção. E o loop disparou a mitigação da Vercel, cegando a medição | Endpoint que DECLARA estado (`uptime`), amostra única |
| Endpoint legado `releases/{v}/files/` | 200 com lista vazia — indexa por URL, e o upload moderno é por debug ID | Endpoint `artifact-bundles`, e conferir o debug ID do chunk servido |
| Hash do entry como prova de deploy | **Cego para mudança em chunk lazy.** Funcionou por dez deploys porque as mudanças tocavam o entry | Release do Sentry com `dateFinished` como sinal primário |
| Pedir o bundle antigo | **200 com o `index.html`** do catch-all da Vercel, nunca 404 | Comparar tamanho ou conteúdo, nunca status |
| `git log origin/main -1` | Mostra o que o clone acha, não o que o servidor tem | `git ls-remote` |
| **O instrumento que verifica cobertura não tinha cobertura** (2026-08-01) | `scripts/` nunca esteve no `include` do `tsconfig.json`, então **nenhum guard desta auditoria era type-checked**. `checkMigrationsApplied.mts` subiu com um `ReferenceError` (variável de bloco referenciada fora do bloco) e `pnpm check` estava **verde**. Foi encontrado pelo próprio guard quebrando em execução real — **não por revisão, não por teste** | `tsconfig.scripts.json` sobrescrevendo só `target`, e `pnpm check` rodando os dois. Provado: reintroduzir o defeito original faz o check falhar com `TS2304` |
| **Guard abortando por falta de `.env`, lido como "nada a reportar"** (2026-08-01) | `check:migrations` num worktree sem `.env` sai com **`exit 1`, o mesmo código de uma falha real**, e imprime com **o mesmo prefixo do caminho de sucesso**. Um grep na saída procurando o aviso das três tabelas de billing não achou nada, e a leitura foi "pendência resolvida". O guard não tinha verificado coisa nenhuma | Código de saída próprio (`78`, `EX_CONFIG`) e mensagem que diz "ABORTADO SEM VERIFICAR NADA / este resultado NÃO significa que o banco está em dia". Travado em `scripts/lib/guardAmbienteAusente.test.ts`, que roda o script de verdade |
| Medir antes da coisa existir | Três vezes: release "cobrindo um projeto só" (o backend ainda não subira), "zero artefatos", "o bundle não mudou" | Conferir que o instante da medição é depois do evento |
| `release` sem artefato | Existir a release não implica os mapas terem subido | Verificar o debug ID do arquivo servido |

#### A interface afirma mais do que sabe

| instância | como falhava | contramedida |
|---|---|---|
| Chip verde "headline detectada" | Presença não é correção. Uma headline cortada ao meio produzia o mesmo verde tranquilizador | Âmbar quando falta, neutro quando existe, e a pessoa confere |
| `[Filtered]` do scrubber do Sentry | `error_code`, `error_message` e `method` chegavam mascarados; o diagnóstico recomeçava do zero | Safe Fields nos campos que não são texto livre |
| `userCount: 0` lido como "ninguém afetado" | É pré-login: não há usuário identificado, não que não haja gente | Ler o que o campo mede, não o que ele parece dizer |
| 502 `upstream_error` para dado nosso | Mensagem culpa terceiro; quem diagnostica começa olhando a OpenAI | Erro tipado, classificado pela ORIGEM e não pela camada |
| Barra cheia num grupo pendente | Mesma afirmação do chip verde, com outra forma | Barra neutra e "a conferir" |

#### Barreira que não cobre o que se supõe

| instância | como falhava | contramedida |
|---|---|---|
| `git worktree --lock` | Protege contra remoção e `prune`, **não contra edição** | Convenção documentada, e worktree de deploy separado |
| `cherry-pick` não dispara `pre-commit` | Um hook que recusasse commit no worktree de deploy cobriria o caso secundário e deixaria passar o principal | Descartado; convenção escrita |
| Guarda no call site | `setScoreDelta` tinha 2 call sites e 1 desprotegido | Funil único (`decidirDelta`) |
| Três colisões de working tree | Duas frentes no mesmo checkout | Worktree por frente, e `bnt-main` só para deploy |

### As contramedidas que funcionaram, com quantas vezes

| contramedida | vezes aplicada | onde |
|---|---|---|
| **Afirmar o TOTAL, não a pertinência** | 4 | `EXPECTED_TABLE_COUNT`/`RLS`/`FUNCTION`; contagem ampla contra a lida; total de usos no teste de ausência de dependência; `pontosPendentes` contra o total |
| **Proteção dentro da função, nunca no call site** | 3 | `logAiUsage` (84 call sites cobertos); `decidirDelta`; `competenciasDoPdf` |
| **Enumerar da fonte com aborto em item não classificado** | 3 | `mutateLinkedinThresholds`; `aiUsageTool.test.ts`; `linkedinDeteccaoNaoMoveNota.test.ts` |
| **Barreira estrutural em vez de regra escrita** | 2 | CI sem `.env` (não simula a ausência, genuinamente não tem); worktree de deploy |
| **Reproduzir ausência de ARQUIVO renomeando o arquivo** | 1 | `docs/harness-fidelidade-instrumento.md` §2-bis |
| **Medir por endpoint que DECLARA estado** | 6+ | `uptime`; release com `dateFinished`; `docs/confirmar-deploy.md` |

**A mais forte é a barreira estrutural, e ela nem sempre está disponível.** O CI não *simula* a ausência do
`.env`: ele não tem `.env`. Não existe parser decidindo escopo, então não há escopo para encolher. Foi ele
quem pegou o que o `env -i` deixou passar, no primeiro push.

**E a barreira pode ser perdida por necessidade.** `headlineCortada.ts` morava em `client/src/lib` para que
um check da régua não pudesse depender dele — impossibilidade, não disciplina. Quando `pendente` passou a ser
persistido, o arquivo teve de ir para `shared/`, e a garantia caiu de "impossível" para "testado". A troca foi
correta (duplicar a regra seria pior) e **a perda está registrada dentro do próprio arquivo**, com dois testes
no lugar da barreira.

---

## 3. Método: o que não funcionou

Sem esta seção o documento não vale nada.

### O lote de 94 commits

A régua v2, os instrumentos, a Fase 0, 1, 2 e 3 subiram **num deploy só**, quando cada fase deveria ter sido
um deploy com 24h de observação. Lote grande transforma qualquer problema numa investigação entre 94
suspeitos, e adia a única verificação que vale.

**A culpa é de quem escreveu os prompts.** O executor entregou o que foi pedido, na cadência pedida.

### O que foi reportado como feito e não estava

O achado #5 da rodada 1 (separação visual dos sinais autodeclarados) foi dado como concluído e não estava.
Ficou pendente até a Fase 3, que criou o bloco rotulado "você declarou".

### Contramedida escrita não previne

**Cinco violações em cinco rodadas, três delas pelo próprio autor no dia seguinte de escrever a regra:**

- `vi.mock("./env")` documentado e esquecido no commit imediatamente seguinte;
- `cd` em vez de `git -C`, na primeira oportunidade depois de eu mesmo propor a regra;
- `/tmp/pai.mts` em vez de `.claude/tmp/`, duas rodadas seguidas;
- edição no `bnt-main` na mesma rodada em que a regra "ninguém edita lá" foi escrita;
- `git add .` que enfiou quatro `.forenseN.mjs` na árvore.

**A conclusão operacional: regra escrita é a contramedida mais fraca da lista.** Ela serve para explicar por
que a barreira existe, não para substituí-la.

### Conhecer a classe não imuniza

Em **2026-08-01**, escrevendo **este documento**, na seção que cataloga esta classe de defeito, o autor:

1. rodou `pnpm check:migrations` no worktree de documentação, que não tem `.env`;
2. grepou a saída procurando o aviso das três tabelas de billing;
3. não encontrou nada;
4. e quase registrou aqui que a pendência estava resolvida.

O guard tinha **abortado antes de verificar qualquer coisa**. `exit 1` é o mesmo código de uma falha real, e
o prefixo `[checkMigrationsApplied]` é o mesmo do caminho de sucesso — nem o código nem o texto distinguiam
"não achei" de "não consegui olhar".

**É a anatomia exata do `env -i` e do endpoint legado que devolvia 200 com lista vazia: ausência de resposta
lida como resposta.** E é o argumento mais forte deste documento a favor de barreira sobre regra escrita:
não houve desatenção nem pressa. Houve alguém que conhecia a classe, estava escrevendo sobre a classe, com a
tabela de instâncias aberta na tela, e caiu nela mesmo assim.

Conhecimento não é contramedida. O conserto está em `scripts/checkMigrationsApplied.mts`: exit `78`
(`EX_CONFIG`), distinto de `1`, e uma mensagem que não pode ser confundida com veredito.

### E a última: o instrumento que verifica não era verificado

Ainda em **2026-08-01**, consertando o guard acima, ele quebrou em execução real com `ReferenceError` — e
`pnpm check` estava **verde**. Causa: `scripts/` nunca esteve no `include` do `tsconfig.json`, que cobre
`client/src`, `shared` e `server`. **Nenhum dos guards desta auditoria era type-checked.**

A anatomia é a mais fechada da série: **o instrumento que verifica não é verificado, e a afirmação sobre a
cobertura dele estava errada no documento que cataloga erros de cobertura.**

E errou **duas vezes seguidas**, sendo a segunda a correção da primeira:

1. A versão original do `CLAUDE.md` dizia *"`pnpm check` NÃO cobre `*.test.ts` (o `tsconfig.json` os
   exclui)"*. **Falsa**: o `exclude` é só `node_modules`, `build` e `dist`. Ela mandava PULAR uma checagem
   barata que de fato pega o erro.
2. A correção de 2026-07-31 disse *"`pnpm check` COBRE `*.test.ts`"*. **Verdadeira sobre os três diretórios
   do `include`, falsa sobre o repositório** — `scripts/` ficava de fora, e era lá que estava o defeito.

A contramedida adotada é **citar o `include` explicitamente em vez de resumir**: resumo de configuração
envelhece, referência a configuração não. Uma frase que diz "cobre os testes" fica errada no dia em que
alguém acrescenta um diretório; uma que diz "cobre `client/src`, `shared` e `server`, e `scripts/` roda em
`check:scripts` no CI" erra em voz alta quando a configuração muda.

**Como foi encontrada importa mais que o conserto:** por `ReferenceError` em execução real, não por revisão e
não por teste. O que significa que **os outros guards podem ter o mesmo defeito latente e ninguém sabe,
porque nunca falharam.**

Daí a pergunta que fica aberta para quem continuar:

> **Quantos dos guards desta auditoria já rodaram no caminho de erro?**

**Os quatro foram exercitados no caminho de falha em 2026-08-01, e o resultado é misto.**

| guard | caminho de falha provocado | resultado |
|---|---|---|
| `check:migrations` | sem ambiente / contador errado / caminho feliz | **exit `78` / `1` / `0`.** Distingue os três |
| `mutateLinkedinThresholds` | sítio numérico não classificado | **aborta com exit `1` e nomeia.** Pega — ver a ressalva abaixo |
| `skipsDeclarados` | um `it.skip` novo | **falha nomeando arquivo e linha**: `deltaFunil.test.ts:271 -> .skip: expected [ {…} ] to deeply equal []` |
| `report:ai-usage` | sem ambiente | **falhava em distinguir.** Era `exit 1` com o mesmo prefixo da saída normal — o mesmo defeito do `check:migrations`. **Corrigido no mesmo dia** para `exit 78` com mensagem própria |

Então a resposta é: **três pegavam, um não pegava e foi consertado.** E o que não pegava era o mais
perigoso dos quatro pelo motivo que o comentário do conserto registra: **um relatório de custo de IA cujo
resultado esperado às vezes É vazio.** "Nenhuma linha de uso" e "não rodei" eram indistinguíveis, e o
primeiro é um resultado legítimo.

### A ressalva do `mutateLinkedinThresholds`, que é um achado próprio

Ele **aborta na árvore limpa**. Rodado sem nenhuma modificação, sai com exit `1` e lista **6 sítios numéricos
órfãos**:

```
shared/linkedin/parse.ts:425      while (inicio > 0) {
shared/linkedin/parse.ts:442      juntou: partes.length > 1,
shared/linkedin/parse.ts:448      acimaIdx >= 0
shared/linkedin/schema.ts:881     export const DETERMINISTIC_VERSION = 7;
shared/linkedin/reguaV2.ts:247    .filter((p) => p.possivel > 0);
server/lib/linkedinChecks.ts:445  ? `Você cadastrou ${cadastradas === 1 ? ...
```

**Três deles entraram nesta auditoria, e dois são desta semana** (`headlineContexto` e o bump da v7). O guard
está funcionando exatamente como projetado — abortar em item não classificado é a contramedida documentada —
e mesmo assim ninguém classificou os sítios novos, **inclusive quem escreveu este documento, três vezes**.

A causa não é o guard: é que **nada o invoca**. Ele não está no hook nem no CI, é script manual. Um guard que
sempre falha e que ninguém roda tem a mesma informação que um guard que sempre passa — zero. É o espelho do
"guard vermelho como estado normal" que esta auditoria recusou duas vezes, com o sinal trocado.

**Fica aberto**, e o conserto não é classificar os 6: é decidir se ele entra num gate. Classificar sem
invocar só adia o próximo órfão.

### Pedido de mudança irreversível no fim de rodada cheia

Três vezes o passo que muda payload persistido foi pedido no fim de uma rodada que já tinha dois deploys. Nas
três o executor parou e reportou. **O defeito é do pedido, não da entrega:** item sem desfazer barato precisa
de rodada própria, e quem enche a rodada é quem escreve o prompt.

### Treze rodadas não pegaram o que um dia de uso pegou

O truncamento de headline sobreviveu a toda a auditoria. Duas razões, e as duas são estruturais:

1. **Nenhuma das 6 golden fixtures continha aquela família de quebra.** Golden file protege contra regressão
   e é cego para caso não amostrado.
2. **A UI dizia "detectada" em verde justamente quando errava**, então o uso real também não acusava — até
   alguém olhar o texto.

É a instância mais consequente da série, e a que melhor mostra a anatomia: a fixture é um proxy do perfil
real, e o proxy coincidia com a verdade em 6 de 6 casos escolhidos.

### Duas instruções incompatíveis na mesma mensagem

"Implemente a config antes de rodar a suíte" e "ninguém edita no worktree de deploy", no mesmo prompt. O
executor resolveu sozinho em vez de apontar. **A contramedida não é disciplina de quem executa, é revisão de
quem escreve o pedido** — mas apontar continua sendo obrigação de quem executa.

### Erros de execução, nomeados

- **"Fast-forward feito" sem medir.** Afirmação de estado de git sem `ls-remote`. Três vezes na série.
- **Dano do `FAIXA_UI` classificado errado.** Reportado como "chip vazio, degrada"; era `TypeError` derrubando
  a árvore. A diferença entre `{MAPA[x]}` no JSX (renderiza nada) e `const ui = MAPA[x]; ui.chipBg` (lança).
- **Premissa de que o vazamento do nome era independente** do bug da headline. Era o mesmo
  `inicioDaIdentidade`: dois sintomas do mesmo defeito lidos como dois defeitos.
- **Bump de uma linha autorizado sobre um defeito de duas metades.** `EXPECTED_TABLE_COUNT` seria corrigido e
  `EXPECTED_RLS_COUNT` quebraria em seguida, disparando o sinal de parada como falso positivo.
- **Critério lexical de nome próprio**: acusou 64 de 149 incluindo `Vector Databases` e `Microsoft Word`.
  Descartado em público antes de virar número oficial.

---

## 4. O que ficou aberto

Cada item com custo, impacto medido quando houver, e **o gatilho que o traz de volta**.

| item | custo | impacto | gatilho |
|---|---|---|---|
| **Famílias de quebra de headline** (pipe órfão, termo composto partido, prosa cortada) | Alto. O espaço é ABERTO: o ponto de quebra é escolhido pela largura da coluna do PDF, não pela gramática. Empilhar heurística perde por construção | 29 de 170 (17,1%), 2026-08-01 | A telemetria do aviso: taxa muito acima de 17% significa detecção frouxa; `corrigiu_apos_aviso` abaixo de 10% significa que o aviso não basta |
| **(b) Headline editável** | Médio. Campo opcional atravessando cliente, schema e servidor. Não precisa de alias (é campo de entrada) | Fecha as famílias conhecidas E a que ninguém viu | `corrigiu_apos_aviso` entre 10% e 30% é o cenário que mais o fortalece |
| **UI da reanálise** | Baixo. Base commitada em `claude/linkedin-fase4` (`abbb919`), **falta o teste** | 32 pares consecutivos com texto idêntico, 25 (78%) com nota idêntica, em 157 análises | Nenhum. É a próxima da fila |
| **Endpoint de exclusão de análise** | Baixo-médio. Rota + posse (padrão existe em 4 lugares); cascata **já resolvida** por FK | Hoje: SQL manual | Pedido de exclusão de uma das 13 pessoas do vazamento de identidade |
| **Gate do texto gerado** (`sobre-gancho`) | Alto. É decisão de produto antes de código | Reprova 38% do que a própria ferramenta escreve | Não instrumentado em produção |
| **Nível sênior** | Alto, feature nova | Sem medição | — |
| **Headers de rate limit** (`RateLimit-Limit`/`Remaining`) | Baixo. Três `setHeader` com valores já calculados. **Só o balde do chamador, nunca o de IP** | Transforma verificação de 181 requisições em 2 | Próxima vez que a validação do limiter precisar ser refeita |
| **Os mapas do admin** | Médio, 11 sítios | `STATUS_META` com 8 sítios no `Admin.tsx` é o mapa do incidente original; `ICON_MAP` vem do banco e pode ganhar valor novo sem deploy | `docs/mapas-indexados-por-valor-do-servidor.md`, ordem já definida |
| **Source map do backend** | Desconhecido | Stack trace do servidor chega minificada | — |
| **Retenção da identidade persistida** | Alto se feito certo (três cópias) | 13 pessoas, 11-30 de julho | Os quatro gatilhos em `docs/retencao-identidade-em-competencias.md` |
| **`termos-bilingues`, lista-núcleo curada, fronteiras de faixa, comparação de modelos** | Não estimados | Sem medição | — |
| **Billing: `fix/billing-customer-reuse` não subiu, e o prazo vence hoje** | Alto e crescendo. A branch está **20 commits à frente e 119 atrás** da `main` (era 10 atrás quando o prazo foi marcado, depois 15). Rebase, 5 migrations à mão, `backfillStripeCustomers.mjs` nunca executado, e duas migrations pedem janela destrutiva | O `check:migrations` reporta **hoje** as 3 tabelas expostas e não declaradas (`payment_recovery_emails`, `stripe_customers`, `billing_failed_payments`) — inconsistência real na direção inversa, verde com aviso | **Prazo 2026-08-01, hoje.** `docs/copy-provisoria-e-pendencias.md` §2.3 define as duas únicas saídas aceitas: adiar com data nova escrita no mesmo commit, ou transformar o aviso em erro temporário. O silêncio não é saída |
| **33 `TODO(Ana)` do escopo de consentimento, no ar desde 2026-07-28** | Baixo por item, revisão editorial | 30 dos 33 são lidos na tela. `ConsentGate` é modal bloqueante sem botão de fechar | Reconferido em 2026-08-01: **os 33 continuam lá**, número idêntico ao levantamento. `docs/copy-provisoria-e-pendencias.md` §1 |
| **`TODO(Ana)` fora do escopo de consentimento** | Não estimado. A alavanca é por arquivo, não pelo total | **1196 na base** (2026-08-01). Os dez maiores estão abaixo | Nunca inventariado. O `copy-provisoria` cobre só os 33 do consentimento e diz que "existem outros"; a ordem de grandeza não estava registrada em lugar nenhum |
| **Achados de design registrados sem correção** | Baixo a médio | CLS residual de 0,015 no hero; `tracking-[0.18em]` contra `[0.2em]`; sombra flat ausente nos cards da home; resíduo de 22px no skeleton da dica; o `<br>` do badge do hero que **envelhece quando a contagem passar de 10.000** | `docs/copy-provisoria-e-pendencias.md` §3 e §3-bis. O do `<br>` tem gatilho automático: a contagem cruzar 10.000 |
| **Os 5 testes pulados** | Baixo | `server/routes/adminTasks.rebalance.test.ts`, travados pelo guard de total exato | — |
| **Deprecação do `environmentMatchGlobs`** | Baixo | Aviso em toda execução do vitest | Upgrade de major do vitest |
| **Policies (72) e índices (139)** | Alto. Exige `DATABASE_URL` | Enumerados, não verificados | `docs/limites-do-guard-de-migrations.md` |

### Os dez arquivos com mais `TODO(Ana)`

Medido em 2026-08-01 sobre `client/`, `server/` e `shared/`. **1196 no total** — o número sozinho é volume
sem alavanca; a distribuição é que diz por onde começar.

```
client/src/pages/Admin.tsx                    144
client/src/pages/RoadmapQuiz.tsx               36
server/routes/aiRoadmap.ts                     32
client/public/lancamento.html                  32
client/src/pages/EntrevistaSessao.tsx          28
client/src/pages/Plataformas.tsx               25
client/src/pages/PlanoCarreira.tsx             21
client/src/pages/LinkedinAnalisar.tsx          21
client/src/components/agent/AgentWidget.tsx    21
server/lib/email.ts                            20
```

**Um arquivo concentra 12% do total.** `Admin.tsx` é interno, então a copy dele tem alcance pequeno e custo
de revisão alto — o inverso do critério de alcance que ordena os 33 do consentimento. Qualquer plano de
revisão editorial que ordene por volume vai começar pelo lugar errado.

---

## 5. O que a próxima sessão pode assumir

Escrito para quem não tem nenhum contexto desta conversa.

### Pode assumir

- **Toda tabela e função declarada em migration existe no banco**, ou `pnpm check:migrations` falha nomeando.
  Prova: o guard roda no CI (job `migrations`).
- **A nota é reprodutível a partir dos `checks` persistidos.** Verificado recalculando 162 linhas: **162 de
  162, zero divergência** (2026-07-31).
- **Um tier fora do catálogo LANÇA**, não produz `NaN`. Prova: `server/routes/linkedinTierInvalido.test.ts`,
  com teste de rota HTTP real devolvendo 500 `analysis_data_invalid`.
- **O marcador `pendente` não move a nota.** Prova: `shared/linkedin/reguaV2.pontosPendentes.test.ts`
  (deep-equals + teste de mutação) e `server/lib/linkedinDeteccaoNaoMoveNota.test.ts` (ausência de
  dependência, enumerada da fonte).
- **Campos novos em payload persistido são normalizados num ponto só.** `readDeterministic` devolve booleano,
  nunca `undefined`. Prova: `shared/linkedin/readDeterministic.pendente.test.ts` contra a fixture legada real.
- **Delta e celebração são suprimidos por um funil único.** `decidirDelta` — `delta: null` desliga a
  celebração, então não há segundo lugar para lembrar.
- **Source maps do frontend estão no ar**, verificados por debug ID do chunk servido, não por contagem.
- **O deploy se confirma pelo procedimento de `docs/confirmar-deploy.md`**, não pelo hash do bundle.

### NÃO pode assumir

- **Que a headline lida está correta.** 17,1% têm assinatura de corte, e a detecção só pega o inequívoco —
  86 de 156 headlines antigas não têm assinatura nenhuma, e uma cortada que termine em palavra é indetectável.
- **Que "17,1%" é a taxa real.** É estimativa sobre headline persistida de quem TERMINOU o fluxo. Quem
  abandonou no passo de revisão nunca virou linha. A medição direta (`notaIncompleta` em análises v7) ainda
  não tem amostra: **0 análises v7 em 2026-08-01**.
- **Que policies e índices estão verificados.** Estão enumerados.
- **Que o guard de migrations cobre coluna, trigger, view, enum ou grant.** Cobre tabela, função e RLS.
- **Que os mapas do admin estão protegidos.** 11 sítios sem resolver, com dano classificado mas **não
  traçado** — dois de três palpites por forma foram falso positivo.
- **Que o `perfilDedup` permite reprocessar o parser.** Ele começa NA headline e vem sem quebra de linha; o
  bug é de estrutura de linha, então reparsear não reproduz nem corrige.
- **Que uma contramedida escrita será seguida.** Cinco violações em cinco rodadas.

---

## 6. Índice dos documentos

| arquivo | o que responde | quando consultar |
|---|---|---|
| `auditoria-avaliador-linkedin.md` | Rodada 1: o levantamento original | Arqueologia. Vários achados foram corrigidos pela rodada 2 |
| `auditoria-avaliador-linkedin-rodada2.md` | Causa raiz, e as correções formais da rodada 1 | Antes de citar qualquer número da rodada 1 |
| `fase0-fechamento.md` | O que parou o sangramento, sem tocar em nota | Molde de fechamento de fase |
| `fase3-fechamento.md` | A régua v2, com o número líquido sobre as 107 | Qualquer pergunta sobre por que a nota mudou |
| `rubrica-fidelidade.md` | Definições congeladas de fabricação, e o histórico de medições | **Antes de medir fidelidade.** Alterar definição invalida a comparação |
| `simulacao-regua-v2.md` | As três variantes de cobertura simuladas sobre as 107 | Por que a cobertura é por corte relativo |
| `harness-fidelidade-instrumento.md` | O caso `env -i` e a fidelidade do instrumento | Antes de escrever qualquer verificação |
| `confirmar-deploy.md` | Como confirmar que um deploy chegou | **Todo deploy** |
| `leitura-telemetria-aviso-headline.md` | Os limiares declarados antes do dado | Quando houver amostra do aviso |
| `mapas-indexados-por-valor-do-servidor.md` | Os 11 sítios abertos, com "traçado" vs "candidato" | Antes de consertar qualquer um deles |
| `retencao-identidade-em-competencias.md` | A decisão de não limpar, e os gatilhos | Pedido de exclusão, ou abertura do repo |
| `limites-do-guard-de-migrations.md` | O que o guard NÃO verifica | Antes de confiar num CI verde de migrations |
| `divida-leitura-persistida.md` | O conjunto mínimo de leitura tolerante | Ao acrescentar campo ao payload |
| `smoke-linkedin.md` | O checklist de release do analisador | Todo deploy que toque o analisador |
| `validacao-rate-limit.md` / `denominador-rate-limit.md` | A validação manual executada e a amostragem | Se o limiter mudar |
| `erro-engolido.md` | Onde a causa de erro ainda é descartada | Ao investigar silêncio |

### Obsoleto ou contraditório

- **`auditoria-avaliador-linkedin.md` (rodada 1)** tem números corrigidos pela rodada 2, entre eles o custo
  por análise (US$ 0,0077-0,0162 → US$ 0,00122). **Sempre cruzar com a rodada 2 antes de citar.**
- **O `CLAUDE.md` afirmava que `pnpm check` não cobre `*.test.ts`.** Era falso e foi corrigido em 2026-07-31.
  Regra escrita errada em arquivo de regras é a pior classe de documentação desatualizada, porque ensina o
  erro em vez de só omiti-lo.
- **`ideas.md` é brainstorm de design da fundação do projeto, não lista de pendência.** Registra três
  abordagens visuais com a segunda marcada "✅ ESCOLHIDA". **A paleta que ele descreve não é a que vale
  hoje**: ele propõe violeta-índigo `#5B21B6` como primária e branco puro de fundo, enquanto o
  `CLAUDE.md` documenta amarelo `#FFB800` e cream `#faf8f4`. É registro de decisão histórica; para saber a
  paleta atual, o `CLAUDE.md` e `docs/color-system.md` mandam. Nenhuma pendência viva.
- **`copy-provisoria-e-pendencias.md` (2026-07-28) está VIVO, e uma seção dele vence hoje.** Reconferido em
  2026-08-01, item a item, na seção 4 acima.
