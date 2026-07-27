# Rubrica de fidelidade factual do Avaliador de LinkedIn

Congelada em 2026-07-26. Serve para que medições feitas em rodadas diferentes sejam comparáveis entre si.
Alterar qualquer definição daqui invalida a comparação com as medições anteriores: se precisar mudar, versione
(crie a v2 abaixo) em vez de reescrever a v1.

Motivo de existir: entre a rodada 2 e a Fase 0 o placar do mesmo prompt "piorou" de 2 para 58 sem o prompt ter
mudado. A causa foi **mudança de unidade de contagem**, não de comportamento. A rodada 2 contou frases inteiras
julgadas à mão em 3 execuções; a Fase 0 contou cada item de array em 10 execuções. Os dois números estavam
certos e não significavam a mesma coisa.

---

## 1. Definições

Uma **afirmação** é uma unidade de conteúdo gerada pela IA que pode ser confrontada com o perfil de entrada.
Cada afirmação recebe exatamente um veredito.

### `sustentada`
O conteúdo tem lastro localizável no perfil de entrada. Para bullets de experiência, o lastro precisa estar no
texto **daquela** experiência. Para os demais campos, em qualquer parte do perfil (texto extraído + competências
coladas pelo usuário).

### `distorcida`
O fato existe no perfil, mas foi alterado ao ser reescrito. Casos que contam como distorção:

- **Reatribuição de sujeito**: a métrica pertence a X e foi atribuída a Y. Exemplo real (rodada 2): o perfil diz
  que *pre-routers determinísticos* cortaram latência em ~86% *em queries comuns*; a saída afirmou que o
  *agente Syni* melhorou *tempo de resposta de RH* em 86%.
- **Generalização de escopo**: o perfil afirma algo de um caso específico e a saída afirma do projeto inteiro.
- **Troca de métrica**: latência vira acurácia, redução de bugs vira aumento de produtividade.

### `inventada`
Não há lastro nenhum no perfil. Os casos que importam aqui:

- **Métrica sem lastro** (acrescentado na emenda de 2026-07-26, ver seção 7): um número, percentual ou
  volume que não existe em lugar nenhum do texto daquela experiência. É diferente de reatribuição: aqui não há
  um valor original sendo movido de dono, o valor **não existe**. Exemplo real: "melhorando a eficiência em
  30%" numa experiência que não tem descrição nenhuma no PDF.

- **Tecnologia sem lastro**: uma tecnologia nomeada num bullet de experiência que não aparece no texto daquela
  experiência (mesmo que apareça no Sobre, na headline ou em outra experiência), ou uma tecnologia em
  headline/Sobre/sugestão de competência que não aparece em lugar nenhum do perfil. Exemplo real (rodada 2):
  "Built Syni ... **using Node.js and React**", com o perfil nunca dizendo qual é a stack do Syni.
- **Recomendação sem lastro**: sugerir que a pessoa adicione ao perfil uma tecnologia que ela não demonstra ter.
  Exemplo real (rodada 2): recomendar **Next.js e Tailwind** na headline, e **Ruby e Elixir** nas competências,
  de um engenheiro de IA que usa JavaScript e TypeScript.

---

## 2. Unidade de contagem (a parte que mais importa)

**Cada item de array conta como uma afirmação, individualmente.** Uma lista com 8 competências sugeridas são 8
afirmações, não 1. Três headlines são 3 afirmações. Um bloco de bullets com 5 bullets são 5 afirmações.

Por quê: o usuário consome esses itens um a um (cada chip de competência é copiável, cada headline é uma opção
de colar), então um item inventado é um dano independente. Contar a lista inteira como uma afirmação faria uma
lista com 8 invenções empatar com uma lista com 1.

Consequência aceita: o número absoluto fica alto e **não é comparável** com contagens por frase. Compare sempre
com uma medição feita sob esta mesma rubrica.

Dentro de um item, **cada tecnologia sem lastro conta separadamente**: um bullet que cita duas tecnologias
inventadas conta 2, porque são dois erros factuais distintos.

### O que NÃO entra na contagem

- **Rótulos que não são tecnologia conhecida** (não estão em `TECH_AREA_MAP`), como "Análise de Dados",
  "Business Intelligence", "ETL". Não são verificáveis mecanicamente e julgá-los à mão reintroduz exatamente a
  subjetividade que esta rubrica existe para eliminar. São contados à parte, como
  `rotulos nao-tecnologia nao avaliados`, e reportados junto ao placar.
- **Texto de conversa** (`resumo`, `pontosFortes`, `pontosFracos`, `melhorias`, `proximoPasso`) quando não cita
  tecnologia nem métrica. Opinião calibrada não é afirmação factual verificável.
- **Convites e fórmulas** ("me chame no LinkedIn", "Hi [Recruiter's Name]"): são pedidos do próprio prompt.

---

## 3. O que conta como evidência

| Campo avaliado | Fonte de lastro aceita |
|---|---|
| `bulletsReescritos[].bullets[]` | **somente** o título + descrição da experiência correspondente |
| `headlines[]` | texto do perfil + competências coladas |
| `sobreReescrito` | texto do perfil + competências coladas |
| `skillsSugeridas[]` (e sucessores) | texto do perfil + competências coladas |
| métricas em qualquer bullet | os números presentes no texto daquela experiência |

O casamento entre um bloco de bullets e a experiência de origem é feito por sobreposição de tokens do título
(campo `contexto` do bloco contra `experiencias[].titulo`).

---

## 4. Critério de aceite

**Zero `inventada` e zero `distorcida`** em 10 execuções distribuídas sobre 3 perfis
(4 no perfil real, 3 no perfil raso, 3 no perfil em transição, usando as fixtures de
`server/lib/__fixtures__/linkedin/`).

`sustentada` não tem meta: é o resto.

O placar é reportado cru, incluindo quando reprova. Não se ajusta o prompt até passar dentro da mesma medição:
uma medição que virou alvo de otimização deixa de medir.

---

## 5. Como reproduzir

O harness mecânico vive fora do repositório (é ferramenta de medição, não código de produto). Ele:

1. monta o prompt exatamente como `server/lib/linkedinAnalyze.ts` monta, lendo o `SYSTEM_PROMPT` do próprio
   arquivo fonte para não divergir;
2. chama a OpenAI com o mesmo modelo, temperatura e `response_format` da produção;
3. aplica as regras da seção 3 com `matchTechnologies` do próprio projeto, para que "tecnologia conhecida"
   signifique a mesma coisa no teste e em produção;
4. imprime o placar e grava um JSON por execução.

Custo aproximado: US$ 0,0012 por execução com `gpt-4o-mini`, cerca de US$ 0,012 por medição completa.

---

## 6. Histórico de medições

| Data | Prompt / contrato | Execuções | Inventadas | Distorcidas | Rubrica |
|---|---|---|---|---|---|
| 2026-07-26 | antes da Fase 0 | 10 | 58 | 3 | v1 |
| 2026-07-26 | Fase 0, item 7 (lastro por experiência) | 10 | 22 | 0 | v1 |
| 2026-07-26 | Fase 0, campos separados (v2) | 10 | 3 | 0 | v1 |
| 2026-07-26 | Fase 0, `skillsParaAdicionarAgora` em código (v3) | 10 | **0** | **0** | v1 |
| 2026-07-26 | Fase 1A, normalização de line-wrap e rodapé | 10 | 3 | 0 | v1 |
| 2026-07-27 | Fase 1A-bis, saneamento de numeral em bullets | **30** | 2 | 1 | v1.1 |
| 2026-07-27 | Fase 1A-ter, camada única de lastro | **30** | 4 | 0 | v1.1 |
| 2026-07-27 | Fase 1B, reescrita do bloco de experiências | **30** | 1 | 0 | v1.1 |

### Fase 1B, 2026-07-27

Hipótese declarada antes de medir: com o bloco de experiências limpo, a fabricação cai. Placar decomposto,
comparado lado a lado com a 1A-ter:

| Classe | 1A-ter | 1B |
|---|---|---|
| fabricação de numeral | 0 | **0** |
| fabricação de tecnologia | 4 | **1** |
| afirmação sem numeral e sem tecnologia | 0 | **0** |
| reatribuição | 0 | **0** |
| execuções limpas | 28/30 | **29/30** |
| afirmações avaliadas | (não registrado) | 406 |

A direção bate com a hipótese, e **o tamanho da amostra não sustenta a conclusão**: 2 execuções sujas contra 1,
em 30, é indistinguível de ruído amostral. O que a medição sustenta com firmeza é o negativo, que era o risco
real de mexer no parser: **nenhuma classe piorou e nenhuma classe nova apareceu**. As três classes cobertas
pela camada de lastro seguem em zero.

A única ocorrência é de novo a cegueira 3 da seção 8, no perfil de transição: o texto diz "Estou estudando
Python e outras ferramentas de análise de dados", que é honesto e é justamente o que se quer de um perfil em
transição, e a regra mecânica conta como tecnologia sem lastro. Falso positivo do harness, não mentira do
produto. Tratamento em `docs/tecnologia-aspiracional-sobre.md`.

Mudança no harness nesta rodada: ele passou a importar `experienciasBlock` de
`server/lib/linkedinAnalyze.ts` em vez de remontar o bloco de experiências por conta própria. A 1B mudou
exatamente esse trecho do prompt (empresa separada do cargo, três estados de descrição), e um harness que
remonta o prompt teria medido um prompt que não existe mais.

Placar decomposto da Fase 1A-ter, que é a forma correta de ler o resultado:

| Classe | Ocorrências |
|---|---|
| fabricação de numeral | **0** |
| fabricação de tecnologia | 4 |
| afirmação sem numeral e sem tecnologia | **0** |
| reatribuição | **0** |

28 de 30 execuções limpas; as 2 sujas tiveram 2 ocorrências cada. **As três classes cobertas pela camada de
lastro foram a zero**, incluindo a classe que era invisível até esta rodada. As 4 restantes estão inteiramente
em `sobreReescrito`, que está fora da camada por decisão registrada, e as 4 são a cegueira 3 da seção 8: o
texto diz "tenho interesse em aprender sobre frameworks como React e TypeScript" e "aplicar novas tecnologias
como Python e R", que é honesto, e a regra mecânica conta como tecnologia sem lastro. São falsos positivos do
harness, não mentira do produto.

Detalhe da medição de 30 execuções (n maior justamente porque n=10 não distinguia regressão de amostra
ruim): **28 de 30 execuções limpas**, 1 com um problema e 1 com dois. As 3 ocorrências restantes são de duas
causas conhecidas e nenhuma é fabricação de numeral, que era o alvo:

- 1 `distorcida`: reatribuição de numeral. A origem diz "25+ IT professionals" e a saída escreveu "satisfação
  do usuário em 25%". O `25` existe na experiência, então a verificação mecânica aprova por desenho. É o ponto
  cego registrado na emenda 1.
- 2 `inventadas`: tecnologias (React, TypeScript) numa **headline** do perfil raso. Fora do escopo do
  saneamento, que nesta rodada cobre só `bulletsReescritos`.

Leitura da série, que é o resultado mais útil deste documento:

- **58 -> 22**: instruções de lastro (tecnologia só com base no texto daquela experiência, métrica não muda de
  dono). Matou 100% das invenções em bullets e 100% das métricas reatribuídas.
- **22 -> 3**: separar o campo em "adicionar agora" e "estudar". O resíduo ficou só no perfil raso, onde a
  lista de comprovadas é vazia e o modelo preenchia para não deixar vazio.
- **3 -> 0**: tirar o cálculo do modelo. `skillsParaAdicionarAgora` é subtração de conjuntos e passou a ser
  computado em `deterministic`; `skillsParaEstudar` continua no modelo, mas com origem fechada (só itens da
  lista de faltantes entregue no prompt).

A lição que vale para as próximas ferramentas: **as três reduções vieram de tirar trabalho do modelo, não de
pedir melhor.** Nenhuma exigiu trocar de modelo.

---

## 7. Emendas

### Emenda 1, 2026-07-26: métrica fabricada é `inventada`, não `distorcida`

**Motivo.** Primeira aplicação ambígua da rubrica. A medição da Fase 1A produziu três bullets com percentuais
(`30%`, `40%`, `25%`) que não existem em lugar nenhum do perfil. A v1 definia `distorcida` como "o fato existe
mas foi alterado" e `inventada` com dois exemplos que falavam só de **tecnologia** e de **recomendação**.
Número fabricado não se encaixava em nenhuma das duas com clareza: não é um valor existente sendo movido de
dono, e não é tecnologia nem recomendação.

**Decisão.** Métrica sem lastro passa a ser explicitamente `inventada`. O critério que separa as duas:

| Situação | Veredito |
|---|---|
| O número existe no perfil e foi atribuído a outro sujeito, escopo ou métrica | `distorcida` |
| O número não existe em lugar nenhum do texto daquela experiência | `inventada` |

**Impacto nas medições anteriores.** As 3 ocorrências da medição da Fase 1A, contadas como `distorcidas`
(rótulo `REATRIBUIDA` do harness), são reclassificadas como `inventadas`. O total não muda (3), a distribuição
sim. As medições de 58/22/3/0 não são afetadas: naquelas, as 3 `distorcidas` da linha de base eram
reatribuição genuína (os ~86% mudando de dono), não fabricação.

**Limitação conhecida do harness, registrada aqui para não ser esquecida.** A verificação mecânica compara o
numeral do bullet com os numerais do texto daquela experiência. Ela detecta **fabricação** (número ausente da
origem), mas **não detecta reatribuição** (número presente na origem, colado no sujeito errado). Exemplo real
que passa batido: o perfil diz que *pre-routers determinísticos* cortaram latência em ~86% *em queries comuns*,
e a saída escreveu "um agente de AI conversacional que reduziu o tempo de resposta em 86% para consultas
comuns" — o 86 existe na experiência, então o harness aprova, mas o sujeito mudou. Reatribuição continua
dependendo de leitura humana, e o placar mecânico deve ser lido com essa ressalva.

---

## 8. O que o harness detecta e o que NÃO detecta

O gate vale exatamente o que esta lista permite. Uma medição só é honesta se as cegueiras estiverem escritas
ao lado do placar, porque toda melhoria que fecha uma classe detectável empurra o resto para as classes cegas.

### Detecta

| Classe | Como | Campo |
|---|---|---|
| Tecnologia sem lastro em bullet | `matchTechnologies` do bullet contra o texto daquela experiência | `bulletsReescritos` |
| Tecnologia sem lastro em headline | contra `keywordsEncontradas` (determinístico) | `headlines` |
| Numeral fabricado | valor ausente do texto daquela experiência | `bulletsReescritos` |
| Numeral com tipo trocado | valor existe como contagem, usado como percentual | `bulletsReescritos` |
| Bullet sem origem | a experiência do bloco não tem descrição própria (< 48 caracteres), então todo bullet ali é fabricado, **inclusive os que não citam número nem tecnologia** | `bulletsReescritos` |
| Competência sugerida sem lastro | contra o perfil + competências coladas | `skillsParaEstudar` |

### NÃO detecta, com o motivo

1. **Reatribuição de sujeito com o mesmo tipo de numeral.** "Os pre-routers cortaram latência em ~86%" vira
   "o agente reduziu o tempo de resposta em 86%". O 86 existe na experiência e é percentual nos dois lados,
   então nem a presença nem a comparação de tipo pegam. Exige entender quem é o sujeito da frase.
2. **Afirmação qualitativa fabricada numa experiência QUE TEM descrição.** Se a origem tem 800 caracteres e o
   modelo inventa "liderou a migração para microsserviços" sem número e sem tecnologia nova, nada acusa. O
   corte por conteúdo de origem só cobre o caso da experiência vazia.
3. **Distinção entre "eu sei X" e "quero aprender X".** Medido: em `sobreReescrito` o modelo escreveu "tenho
   interesse em aprender sobre frameworks como React e TypeScript", que é honesto, e o harness contou como
   duas tecnologias inventadas. A regra mecânica é "tecnologia nomeada sem lastro", e ela não lê a moldura da
   frase. **Isto infla o placar**, não o esconde: é falso positivo, não falso negativo.
4. **`sobreReescrito` inteiro** está fora da camada de lastro (ver `shared/linkedin/lastro.ts` para o motivo),
   então o harness ainda o mede mas a produção não o corrige. Toda ocorrência ali é reportada e sobrevive.
5. **Exagero de escopo sem número.** "Melhorou significativamente" onde a origem diz "melhorou" não é
   detectável mecanicamente.
6. **Rótulos que não são tecnologia conhecida** ("Business Intelligence", "ETL"): ficam fora da contagem por
   decisão da seção 2, e são reportados à parte.
7. **Idioma e tom** fora do especificado: não é objeto desta rubrica.

### Consequência prática

O placar decomposto existe por causa desta lista. Um total agregado esconde que uma classe foi a zero
enquanto outra apareceu. Reporte sempre por classe.

---

## 9. Princípio de projeto: check reprovando aumenta fabricação

Registrado como observação, **sem ação nesta fase**.

Evidência acumulada em três medições independentes:

| Situação | Fabricação |
|---|---|
| `headline-stack` aprovando (perfil real, 8 execuções) | 0 |
| `headline-stack` reprovando, mesmo perfil e mesmo prompt (8 execuções) | 6, em 4 das 8 |
| Perfil raso, lista de "adicionar agora" vazia (Fase 0, 10 execuções) | 22 |

O experimento do meio isolou a variável: um único termo da headline mudou, o que alterou apenas o resultado de
um check no bloco enviado ao prompt. Com o check reprovando, o modelo fabricou; com ele aprovando, não.

**A leitura: um check reprovando funciona como pressão para o modelo compensar.** Ele lê a lista de falhas como
um pedido de conserto e preenche as lacunas com o que não tem.

Isso é argumento de segunda ordem para a Fase 1B, e vale escrever com todas as letras: **consertar um check que
reprova por bug do parser não melhora só a nota, reduz mentira no texto.** Cada check falso removido é uma
fonte de fabricação removida. Ao priorizar a 1B, o peso de um bug não é só "quantos pontos de nota ele custa",
é também "quanta invenção ele induz".
