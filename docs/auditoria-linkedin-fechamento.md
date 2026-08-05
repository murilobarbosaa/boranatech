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
| Suíte inteira | 2 testes na feature (65 linhas) | **1546 passando, 5 pulados** | rodada 1 §12.1 / 2026-08-01, execução local |
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
29 de 171  (17,0%)   termina em `|` 14 · começa em `|` 10 · minúscula 4 · vírgula 1
```

**Correção de um número que circulou:** o "39 de 156" é da família `F2b` (primeira seção com uma palavra
só), que **tem falso positivo** — `Student | Open to Internships` e `Estudante | Análise e Desenvolvimento`
são headlines legítimas. Ela ficou de fora da detecção de propósito. O número defensável é 29 de 171.

### O que as quatro assinaturas NÃO cobrem, e por que 17% não é piso

**Reescrito em 2026-08-04**, depois de um caso real com o PDF na mão. As quatro assinaturas são inequívocas
naquilo que afirmam, e continuam sendo o número honesto para o que elas medem. O problema é o que fica de
fora, e ele é maior que o que fica dentro.

Elas leem **a headline persistida**. Quando o PDF quebra a headline e o parser fica com a segunda metade, o
valor guardado é uma string perfeitamente bem formada: `TypeScript, React, Node.js, PostgreSQL | Remote`.
Não começa em `|`, não termina em `|` nem em vírgula, não começa em minúscula. **Nenhuma das quatro dispara,
e o corte perdeu 68 caracteres, incluindo o cargo-alvo.** Esse caso não está entre os 29: está contado como
headline limpa.

Duas medições de 2026-08-04, sobre 180 headlines persistidas:

**1. A família `termina em |` está MORTA.** As 14 ocorrências são **todas** anteriores a
2026-07-30T23:06, e há **zero** depois. Não é coincidência: `limparSeparadorOrfao` remove o separador do fim
de toda linha, então uma headline persistida terminando em `|` deixou de ser alcançável quando o normalizador
subiu. Ou seja, **quase metade do numerador dos 29 é de uma família que não pode mais ocorrer.** Nas 24
análises posteriores ao normalizador, as assinaturas pegam 3 (12,5%), e a composição é outra: `termina em |`
some, sobram `começa em |` (2) e vírgula (3).

**2. O tamanho do erro, nas linhas que carregam o diagnóstico.** Só 18 linhas têm `headlineContexto`
gravado, e nelas dá para comparar os dois detectores:

| detector | pega |
|---|---|
| as 4 assinaturas (o aviso do cliente) | **1** de 18 |
| o sinal do parser (`acima.forte && !juntou`) | **6** de 18 |
| sobreposição entre os dois | **0** |
| qualquer um dos dois | **7** de 18 (39%) |

**O aviso encontra 1 dos 7, ou 14% do que os dois juntos encontram.** As 6 invisíveis são exatamente a
família do caso real, e a forma delas é reconhecível a olho: `Dados & IA`, `JavaScript | TypeScript | Golang
| Python`, `Linux | AD | Docker | GCP | N1/N2` — a seção de stack sem o cargo, que ficou na linha de cima.

**Portanto 17% não é piso, é aproximadamente um quarto.** A melhor estimativa disponível é 39%, com a
ressalva que a torna provisória: **n = 18**. O limiar para tratá-la como número é o mesmo já declarado para
`notaIncompleta`, 30 análises com o campo.

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
| **O worktree de deploy desatualizado em silêncio** (2026-08-01) | `bnt-main` foi criado para eliminar a disputa de checkout, e ficou **4 commits atrás** da `main` do servidor. A operação principal dele é `cherry-pick`, que partiria de base velha sem nada avisar: nem o git, nem o CI, nem o hook. Encontrado por leitura manual na conferência de encerramento | `git fetch` + `git merge --ff-only origin/main` **antes de qualquer operação** ali, como passo do `docs/confirmar-deploy.md` |
| **CI verde que morreu com o SHA** (2026-08-05) | Duas branches autorizadas para fast-forward, CI verde medido nas duas. A primeira subiu; a segunda ficou **1 atrás** e precisou de rebase, que trocou os SHAs. **O verde medido passou a se referir a commits que não existem mais.** Empurrar confiando nele seria subir com aprovação de um artefato inexistente | Medir o CI DEPOIS da última operação que altera SHA, nunca antes. Rebase, amend e squash invalidam a medição inteira |
| **`lastDeploy` respondendo pelo ambiente errado** (2026-08-05) | O sinal primário do `docs/confirmar-deploy.md` é `lastDeploy.dateFinished`. Na primeira amostra ele veio `vercel-preview`, porque **o preview termina antes da produção**: o "último" deploy não é o deploy que interessa. Uma leitura ingênua concluiria "produção não chegou" sobre um deploy a caminho | Ler `/deploys/` (a lista) e **procurar o ambiente**, em vez de `lastDeploy` (o mais recente). Corrigido no `docs/confirmar-deploy.md` |
| **Comparar medição quente com medição fria** (2026-08-01) | `pnpm check` foi reportado como "de ~3s para 90s, 30x". O `~3s` era uma execução com `tsbuildinfo` quente e o `90s` uma a frio. A `main` **sem a mudança** também leva 88s a frio e 17s a quente: o custo real era **~6s**. Dois valores não comparáveis, conclusão confiante, e ela **dirigiu uma decisão de arquitetura do gate** | Medir os dois lados no mesmo estado de cache, e medir o "antes" na branch sem a mudança |
| **`$?` depois de um pipe para `tail`** (2026-08-01) | Lendo o exit code do `tail` em vez do script, **no dia em que se mediam exit codes de guards**. Deu `exit=0` para um guard que saía `1` | Redirecionar para arquivo e ler `$?` do comando, nunca do pipeline |
| **Guard que sempre falha e ninguém invoca** (2026-08-01) | `mutateLinkedinThresholds` abortava na árvore limpa havia semanas, com 6 sítios numéricos órfãos, **três produzidos pela própria auditoria**. Não estava no hook nem no CI. *Um guard que sempre falha e que ninguém roda carrega a mesma informação que um que sempre passa: zero* | Modo `--auditar` (menos de 1s, sem mutar) rodando no CI, e os 6 sítios classificados |
| **Âncora de mutante quebrada pelas próprias correções da auditoria** (2026-08-01) | Ver abaixo: é a instância que fecha a tabela | O modo `--auditar` falha quando qualquer âncora não casa |
| **O campo de diagnóstico cego na família que ele existia para diagnosticar** (2026-08-04) | `headlineContexto.acima.terminaEm` foi criado para dizer em que a linha acima da headline terminou, e era **estruturalmente incapaz de devolver `"pipe"`**: `limparSeparadorOrfao` apaga o `\|` do fim de toda linha antes de `detectHeadline` rodar. A família mais comum de quebra chegava classificada como `"palavra"`. **E isto era CONHECIDO**: um teste travava `"palavra"` e explicava o motivo em quinze linhas | `normalizeProfileLinesComSinal` devolve os índices onde removeu separador; `classificarTerminacao` lê o sinal antes do texto. Três testes travam `"pipe"`, a precedência sobre vírgula, e o caso que NÃO deve virar pipe |

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

### A instância que fecha a tabela: cegar o instrumento consertando o produto

`mutateLinkedinThresholds` existe para garantir que **todo limiar numérico do analisador é testado**: ele muda
o número e confere se algum teste quebra. Limiar cuja mutação não quebra nada é limiar sem rede.

Em 2026-08-01, duas das suas âncoras não casavam mais com a fonte:

| âncora | esperava | quem mudou |
|---|---|---|
| `clip da headline (250)` | `clip(escolhida.linha, 250)` | **`eeda681`**, a correção do truncamento de headline |
| `DETERMINISTIC_VERSION` | `= 4;` | **`acc2d31`**, o bump da v7 do check pendente |

**As duas quebraram por mudanças desta auditoria.** O `eeda681` é a correção da headline — o defeito que
motivou metade das rodadas. O `acc2d31` é o bump do check pendente — a última entrega. As duas corretas.

E o script reportava as duas como `??` **saindo com exit 0**. Ou seja: o guard construído para garantir que
todo limiar é testado tinha **dois limiares que deixaram de ser testados**, e dizia que estava tudo bem.

**Não foi descuido e não foi pressa.** As duas correções eram certas, revisadas, testadas e deployadas com
CI verde. O que aconteceu é mais incômodo:

> **Manter um instrumento acoplado à fonte custa atenção contínua que ninguém orçou.**

A âncora é uma cópia literal de uma linha de código. Toda vez que a linha muda, alguém teria de lembrar de
atualizar a cópia — e "lembrar" é exatamente o mecanismo que esta auditoria passou 45 rodadas substituindo
por barreira. O acoplamento por texto literal é barato de escrever e caro de manter, e o custo é cobrado em
silêncio, na forma de cobertura que evapora.

A contramedida não elimina o acoplamento (não há como mutar um limiar sem referenciá-lo): **ela torna a
evaporação ruidosa.** `pnpm check:limiares` falha quando qualquer âncora não casa, e roda no CI a cada push.

---

### A família de 2026-08-05: medição reusada depois de o objeto medido mudar

As duas instâncias novas parecem operacionais e são a mesma coisa, com o tempo invertido em relação a um erro
já registrado aqui.

A tabela já tem **"medi antes de a coisa existir"**: a release do Sentry amostrada às 20:07 com o Railway
terminando às 20:10, e o bundle conferido antes de a Vercel terminar. As duas de 2026-08-05 são
**"medi depois de a coisa deixar de existir"**:

- o **CI verde** foi medido sobre `d6ee466`, e o rebase o transformou em `b916bec`. O verde continuou
  existindo, verdadeiro, e sobre um objeto que não estava mais em lugar nenhum;
- o **`lastDeploy`** respondeu corretamente sobre o deploy de preview, que não era o objeto da pergunta.

Em nenhum dos dois o instrumento errou. **Os dois responderam com precisão a uma pergunta ligeiramente
diferente da que foi feita**, e a diferença estava no sujeito: *qual* commit, *qual* ambiente.

> **Toda medição tem um sujeito implícito, e ele pode mudar sem a medição mudar.** O valor continua lá,
> continua verdadeiro, e passa a descrever outra coisa.

A contramedida é a mesma nos dois casos, e é barata: **carregar o identificador junto do valor.** "CI verde"
é inútil; "CI verde em `b916bec`" quebra sozinho quando o SHA muda, porque a comparação com o `HEAD` atual é
imediata. "Deploy terminou" é inútil; "`vercel-production` terminou em 02:12:29Z" responde à pergunta certa.

Foi o que se fez na prática nas duas: o push só aconteceu depois de o CI completar **no SHA pós-rebase**, e a
confirmação de deploy passou a ler a lista de deploys procurando `vercel-production` em vez de aceitar o
último evento.

### A instância de 2026-08-04, que não é "ninguém viu": é "viram, escreveram, e ficou"

Todas as instâncias acima têm a mesma forma: o instrumento mediu uma superfície menor e ninguém percebeu.
Esta é diferente, e por isso vale separada.

O ponto cego do `terminaEm` **não passou despercebido**. Ele estava num teste, com nome próprio, assim:

> `it("na familia do PIPE o sinal util e `forte`, NAO `terminaEm`")`

e quinze linhas de comentário explicando que `normalizeProfileLines` remove o separador antes, que a
evidência do `|` já foi embora, que o contorno é `forte && !juntou`, e — literalmente — *"quem for consertar
a deteccao um dia precisa saber disto"*. O teste então **travava `terminaEm: "palavra"`**, congelando o
comportamento errado como se fosse contrato.

O defeito não foi de observação. Foi o que se fez com a observação:

> **Um teste que trava um comportamento errado e o documenta bem é indistinguível, para quem chega depois,
> de uma decisão de projeto.**

Documentação boa piorou a situação, e esse é o desconforto real da instância. Um `TODO` teria envelhecido
como dívida visível; um comentário longo e bem escrito envelheceu como justificativa. A pessoa seguinte lê
quinze linhas de raciocínio correto, conclui que foi ponderado, e não reabre. Foi preciso um caso real com o
PDF na mão, em que o dono do perfil viu a headline errada, para alguém voltar a perguntar.

**A contramedida não é escrever menos comentário.** É separar as duas coisas que aquele texto misturava: o
que o código FAZ (contrato, e teste trava) e o que ele DEIXA de fazer (limitação, e não vira asserção
positiva). Quando a limitação vira `expect(...).toBe("palavra")`, ela ganhou o mesmo status do
comportamento desejado, e a suíte passa a defendê-la.

**E a parte que generaliza, que é a razão de esta instância ter seção própria:**

> **Limitação conhecida precisa de GATILHO, não de explicação. Comentário não volta.**

As outras instâncias desta tabela são instrumentos que **não enxergavam**: o regex que via 38 de 72 tabelas,
a janela de 4000 caracteres, o `contarLinhas` devolvendo -1. O conserto delas é fazer o instrumento enxergar.

Esta enxergou. O mecanismo foi identificado corretamente, escrito com precisão, e o registro **passou a ser a
razão de não consertar**. Quem chegou depois leu quinze linhas de raciocínio correto e concluiu que a questão
tinha sido ponderada e decidida. Foi, e a decisão era "fica assim por ora" — só que "por ora" não tem prazo, e
nada no repositório voltava a perguntar.

Um comentário é **passivo por construção**: ele só é lido por quem já foi até aquele arquivo, e quem vai até
lá normalmente está fazendo outra coisa. O que volta a incomodar é outra categoria de artefato:

| em vez de | use | por que volta |
|---|---|---|
| comentário explicando a limitação | `it.todo(...)` com a condição | aparece em toda execução da suíte, como pulado |
| `expect(x).toBe(<valor errado>)` | asserção do que se QUER, marcada como pendente | teste vermelho ou pulado cobra; teste verde absolve |
| "quem for consertar precisa saber disto" | entrada na fila com **condição de reabertura** | a fila é lida em toda rodada de planejamento |

O caso concreto: a limitação do `terminaEm` deveria ter nascido como uma linha na seção 4 com o gatilho
*"reabrir quando aparecer caso real da família do pipe"*. O caso real apareceu em 2026-08-04, quatro dias
depois — e não encontrou nada esperando por ele.

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

### O que pegou o fim da fila não foi instrumento nenhum

**Duas das últimas três instâncias desta tabela apareceram porque alguém foi conferir o estado, não porque um
instrumento acusou:**

- o **fast-forward dado como autorizado e não executado** — o commit que fecha este documento ficou uma rodada
  parado na branch, com CI verde, e os dois lados achando que estava na `main`;
- o **`bnt-main` 4 commits atrás** — o worktree de deploy, cuja operação principal partiria de base velha.

Nenhum dos quinze guards construídos nesta auditoria olha para isso. O CI valida o que foi empurrado; ele não
pergunta se o que devia ser empurrado foi. O hook valida o que está sendo commitado; não valida onde. Os dois
respondem perguntas sobre conteúdo, e as duas falhas eram sobre **estado**.

É a coisa mais desconfortável do documento, e ela não tem contramedida barata: **a auditoria construiu quinze
instrumentos e o que pegou o fim da fila foi uma leitura manual.** O que dá para fazer é o que foi feito —
transformar a conferência num roteiro escrito (`docs/confirmar-deploy.md`) para que ela não dependa de alguém
lembrar de fazê-la, que é a mesma dívida com um passo a menos.

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

**Resposta, medida em 2026-08-01: os quatro, agora. Antes disso, nenhum.**

| guard | caminho de falha provocado | resultado |
|---|---|---|
| `check:migrations` | sem ambiente / contador errado / caminho feliz | **exit `78` / `1` / `0`.** Distingue os três |
| `mutateLinkedinThresholds` | sítio numérico não classificado | **aborta com exit `1` e nomeia.** Pega — ver a ressalva abaixo |
| `skipsDeclarados` | um `it.skip` novo | **falha nomeando arquivo e linha**: `deltaFunil.test.ts:271 -> .skip: expected [ {…} ] to deeply equal []` |
| `report:ai-usage` | sem ambiente | **falhava em distinguir.** Era `exit 1` com o mesmo prefixo da saída normal — o mesmo defeito do `check:migrations`. **Corrigido no mesmo dia** para `exit 78` com mensagem própria |

### O que exercitar o caminho de falha ensinou

**Três dos quatro tinham defeito no caminho de erro, e nenhum tinha sido exercitado.**

- `report:ai-usage` não distinguia "não consultei" de "não achei nada" — e é o pior lugar possível para esse
  defeito, porque **o resultado esperado dele às vezes É vazio**. "Nenhuma linha de uso de IA no período" é
  legítimo, e era indistinguível de "não rodei".
- `mutateLinkedinThresholds` pegava, mas **abortava na árvore limpa e ninguém o invocava**.
- Duas âncoras dele **tinham parado de casar com a fonte** e o script saía com exit 0.
- Só `skipsDeclarados` estava íntegro nos dois caminhos, e é o único que sempre rodou na suíte.

O padrão: **caminho de sucesso testado e caminho de falha não exercitado é meia verificação, e essa metade
faltava em 75% dos instrumentos que a auditoria construiu.** Os guards foram escritos para pegar defeito em
código de produto; o defeito estava neles, na perna que ninguém tinha percorrido.

Depois dos consertos:

| guard | caminho de erro | onde roda |
|---|---|---|
| `check:migrations` | exit `78` sem ambiente, `1` com contador errado, `0` no caminho feliz | CI |
| `check:limiares` (`mutateLinkedinThresholds --auditar`) | exit `1` em sítio órfão **e** em âncora que não casa | CI, < 1s |
| `skipsDeclarados` | falha nomeando arquivo e linha | suíte |
| `report:ai-usage` | exit `78`, distinto de `1` | manual (é relatório, não gate) |

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

**Fechado em 2026-08-01**, e o conserto não foi só classificar os 6: os sítios foram classificados **e** o
script ganhou um modo `--auditar` (descoberta e conferência de âncoras, sem mutar, menos de 1s) que roda no
CI a cada push. O modo completo continua manual, porque roda a suíte uma vez por mutante e leva mais de dez
minutos: **a parte que cabe num gate é a que entrou nele.**

### Pedido de mudança irreversível no fim de rodada cheia

Três vezes o passo que muda payload persistido foi pedido no fim de uma rodada que já tinha dois deploys. Nas
três o executor parou e reportou. **O defeito é do pedido, não da entrega:** item sem desfazer barato precisa
de rodada própria, e quem enche a rodada é quem escreve o prompt.

### O (b) sobe para primeiro da fila, e o gatilho muda de natureza

**Registrado em 2026-08-04.** O gatilho anterior era `corrigiu_apos_aviso` entre 10% e 30%, e ele **nunca
disparou porque nunca houve amostra**. Um gatilho que depende de uma taxa que ninguém está medindo é um
item parado com aparência de item priorizado.

O caso real trocou o gatilho por um argumento que não precisa de número:

> **Existe família de quebra sem assinatura e sem conserto.** O aviso não dispara (as quatro assinaturas
> leem a headline persistida, e nessa família ela sai bem formada), e mesmo se disparasse a pessoa **não
> tem o que fazer**: a única saída é editar a headline no LinkedIn, exportar o PDF de novo e subir outra vez.

As duas metades importam. Se o aviso falhasse mas houvesse conserto, seria problema de detecção. Se
detectasse mas não houvesse conserto, seria problema de produto. Estão as duas ao mesmo tempo, e **o (b)
resolve as duas de uma vez, sem heurística nenhuma**: quem vê a headline errada digita a certa.

**Ele não depende do (2b) e pode subir antes.** São ortogonais: o (2b) melhora o que o parser extrai, o (b)
dá saída para quando o parser erra. Nenhum bloqueia o outro, e o (b) tem a propriedade que o (2b) não tem:
funciona para família que ninguém mapeou ainda, inclusive as que não existem hoje.

**Escopo, já mapeado:** campo editável no passo de revisão (cliente), `headlineManual?` opcional no schema,
`?? parsed.headline` no servidor, e persistir qual dos dois venceu para a telemetria continuar separando
"o parser acertou" de "a pessoa corrigiu".

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
| **(b) Headline editável** | Médio. Campo opcional atravessando cliente, schema e servidor. Não precisa de alias (é campo de entrada) | Fecha as famílias conhecidas E a que ninguém viu | **PRIMEIRO DA FILA desde 2026-08-04, e o gatilho deixou de ser medição.** Ver abaixo |
| **UI da reanálise** | Baixo. Base commitada em `claude/linkedin-fase4` (`abbb919`), **falta o teste** | 32 pares consecutivos com texto idêntico, 25 (78%) com nota idêntica, em 157 análises | Nenhum. É a próxima da fila |
| **Endpoint de exclusão de análise** | Baixo-médio. Rota + posse (padrão existe em 4 lugares); cascata **já resolvida** por FK | Hoje: SQL manual | Pedido de exclusão de uma das 13 pessoas do vazamento de identidade |
| **Gate do texto gerado** (`sobre-gancho`) | Alto. É decisão de produto antes de código | Reprova 38% do que a própria ferramenta escreve | Não instrumentado em produção |
| **Nível sênior** | Alto, feature nova | Sem medição | — |
| **Headers de rate limit** (`RateLimit-Limit`/`Remaining`) | Baixo. Três `setHeader` com valores já calculados. **Só o balde do chamador, nunca o de IP** | Transforma verificação de 181 requisições em 2 | Próxima vez que a validação do limiter precisar ser refeita |
| **Os mapas do admin** | Médio, 11 sítios | `STATUS_META` com 8 sítios no `Admin.tsx` é o mapa do incidente original; `ICON_MAP` vem do banco e pode ganhar valor novo sem deploy | `docs/mapas-indexados-por-valor-do-servidor.md`, ordem já definida |
| **Source map do backend** | Desconhecido | Stack trace do servidor chega minificada | — |
| **Retenção da identidade persistida** | Alto se feito certo (três cópias) | 13 pessoas, 11-30 de julho | Os quatro gatilhos em `docs/retencao-identidade-em-competencias.md` |
| **`termos-bilingues`, lista-núcleo curada, fronteiras de faixa, comparação de modelos** | Não estimados | Sem medição | — |
| **Billing: `fix/billing-customer-reuse` não subiu** | Alto e crescendo. A branch estava **20 à frente e 132 atrás** da `main` ao fim de 2026-08-01 (era 10 atrás quando o prazo foi marcado, depois 15). Rebase, 5 migrations à mão, `backfillStripeCustomers.mjs` nunca executado, e duas migrations pedem janela destrutiva | As 3 tabelas existem e estão **protegidas** (RLS declarada + `REVOKE ALL`, verificado por leitura anon: `42501` nas três), e desde 2026-08-01 o `check:migrations` cobre a RLS delas na direção inversa. O aviso de não-declaradas continua | **Prazo adiado para 2026-08-08** em `docs/copy-provisoria-e-pendencias.md` §2.3, que registra a distância ao lado da data e a pergunta que a próxima revisão tem de responder antes de adiar de novo: **a billing sobe, ou a branch é descartada e o trabalho recomeça da `main`?** |
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
  **Atualizado em 2026-08-04: "indetectável" deixou de ser hipótese.** Um caso real, com o PDF na mão, perdeu
  68 caracteres (incluindo o cargo-alvo) e saiu com headline bem formada, sem nenhuma das quatro assinaturas.
  Nas 18 linhas que carregam `headlineContexto`, o aviso pega 1 e o sinal do parser pega 6, sem sobreposição:
  **o aviso encontra 14% do que os dois juntos encontram.** Ver "O que as quatro assinaturas NÃO cobrem".
- **Que "17,0%" é a taxa real.** É estimativa sobre headline persistida de quem TERMINOU o fluxo. Quem
  abandonou no passo de revisão nunca virou linha. A medição direta mal começou: **1 análise v7 em
  2026-08-01** (`notaIncompleta: false`). Um caso não é taxa; o limiar declarado para o número valer é **30
  análises v7**, e está em `docs/leitura-telemetria-aviso-headline.md`.
- **Que policies e índices estão verificados.** Estão enumerados.
- **Que o guard de migrations cobre coluna, trigger, view, enum ou grant.** Cobre tabela, função e RLS.
- **Que os mapas do admin estão protegidos.** 11 sítios sem resolver, com dano classificado mas **não
  traçado** — dois de três palpites por forma foram falso positivo.
- **Que o `perfilDedup` permite reprocessar o parser.** Ele começa NA headline e vem sem quebra de linha; o
  bug é de estrutura de linha, então reparsear não reproduz nem corrige.
- **Que uma contramedida escrita será seguida.** Cinco violações em cinco rodadas.

---

### Notas sobre documentos específicos

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
---

## 6. Encerramento

**Este documento está completo em 2026-08-01, e nada nele espera continuação.**

E a última coisa que faltou na auditoria foi **um fast-forward dado como autorizado e não executado**: o
commit que fecha este documento ficou uma rodada parado na branch, com CI verde, enquanto os dois lados
achavam que ele já estava na `main`. É a primeira linha da tabela da seção 2 acontecendo na última rodada —
`git log origin/main` lido como se fosse o servidor, estado afirmado sem `ls-remote`. Foi pego por uma
conferência de encerramento que existia justamente para isso.

O que ficou aberto está na seção 4, cada item com custo, impacto medido quando existe, e o gatilho que o traz
de volta. Nenhum depende de alguém lembrar.

**A fila do LinkedIn, na ordem:**

**Reordenada em 2026-08-04:** o (b) era o 2 e passou a ser o 1, pelo argumento da seção "O (b) sobe para
primeiro da fila". O gatilho antigo (`corrigiu_apos_aviso` entre 10% e 30%, em
`docs/leitura-telemetria-aviso-headline.md`) está **revogado** e não deve ser reaberto: ele condicionava o
item a uma medição que nunca teve amostra.

1. **(b) Headline editável** — fecha as famílias conhecidas e as que ninguém mapeou, sem heurística nova.
   Não depende do (2b) e pode subir antes dele.
2. **UI da reanálise** — base commitada em `claude/linkedin-fase4` (`abbb919`), falta o teste do caso que a
   motivou: mesmo texto não gasta cota, aviso âmbar aparece.
3. **(2b) Junção da headline por separador estrutural** — só depois de o `terminaEm` corrigido dar número.
   O (2a) subiu em 2026-08-04 e tornou a família contável; o (2b) é o que muda o que se extrai, e move nota.
4. **Endpoint de exclusão de análise** — rota, verificação de posse (padrão existe em 4 lugares), cascata já
   resolvida por FK.

### Fila de ESPERA, que não é fila de trabalho

A distinção importa: os itens abaixo **não têm nada a fazer**. Eles esperam amostra. Tratá-los como pendência
produz trabalho sobre ruído; ignorá-los perde a única prova de dois consertos.

Medido em **2026-08-01, 07:52 UTC**:

| o que | estado | quando reconferir |
|---|---|---|
| **`FRONT-4`** (`profile_fetch_exhausted`) | 50 eventos, **último 80 min ANTES** de o `cb3a197` subir. ~6h de silêncio desde o deploy | **24-48h.** A issue vinha de ~11 eventos/dia, então 6h de silêncio ainda cabe no acaso. **É a única prova do conserto de rate limit por usuário** |
| **`FRONT-9`** (`BntSelect`) | sem evento novo desde 2026-07-29; o `64dedd4` está no ar desde 31/07 23:06Z | Sinal fraco por construção: disparou **uma vez em três dias**. Ausência não vira prova aqui |
| **Taxa de `notaIncompleta`** | **n = 1** análise v7 (`notaIncompleta: false`) | **30 análises v7.** Abaixo disso uma linha a mais move a proporção em mais de 3 pontos |
| **Cruzamento do aviso de headline** | sem amostra | **15 com `aviso_visto: true`.** Critério em `docs/leitura-telemetria-aviso-headline.md` |

Os limiares foram declarados **antes** dos dados existirem, de propósito: limiar declarado antes vale mais que
interpretação inventada depois.

**Dois scripts de verificação seguem fora de qualquer gate**, e a decisão é consciente:
`check:hero-counter` precisa de browser e servidor de pé, e `check:persisted` é diagnóstico contra a base de
produção, não asserção. Ambos são invocados à mão; se algum dia virarem gate, o inventário está aqui.

---

## 7. Índice dos documentos

- **`fase3-fechamento.md` §5 afirma "a régua v2 não está em produção" e "mais de 80 commits à frente de
  `origin/main`".** Era verdade em 2026-07-27 e **não é mais**: a régua v2 subiu, e a versão determinística está
  em 7. O documento é um instantâneo de fechamento de fase e fica como está; quem o ler precisa saber que o
  §5 descreve o estado daquele dia, não o de hoje.
- **`ideas.md` é brainstorm de design da fundação do projeto, não lista de pendência.** Registra três
  abordagens visuais com a segunda marcada "✅ ESCOLHIDA". **A paleta que ele descreve não é a que vale
  hoje**: ele propõe violeta-índigo `#5B21B6` como primária e branco puro de fundo, enquanto o
  `CLAUDE.md` documenta amarelo `#FFB800` e cream `#faf8f4`. É registro de decisão histórica; para saber a
  paleta atual, o `CLAUDE.md` e `docs/color-system.md` mandam. Nenhuma pendência viva.
- **`copy-provisoria-e-pendencias.md` (2026-07-28) está VIVO.** Reconferido em 2026-08-01, item a item, na seção 4
  acima. O prazo da billing foi adiado para **2026-08-08** no mesmo dia, com a distância medida ao lado da data.
