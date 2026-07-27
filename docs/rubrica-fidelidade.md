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
Não há lastro nenhum no perfil. Os dois casos que importam aqui:

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

| Data | Prompt | Execuções | Inventadas | Distorcidas | Rubrica |
|---|---|---|---|---|---|
| 2026-07-26 | antes da Fase 0 | 10 | 58 | 3 | v1 |
| 2026-07-26 | Fase 0, item 7 | 10 | 22 | 0 | v1 |

Detalhe da segunda medição: as 22 restantes estão todas em `skillsSugeridas` e concentradas no perfil raso, que
é o único onde a lista de "tecnologias comprovadas fora das competências" fica vazia. Em bullets, o placar foi
6 -> 0; em métricas reatribuídas, 3 -> 0.
