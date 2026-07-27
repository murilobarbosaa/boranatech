# Auditoria do Avaliador de LinkedIn, rodada 2: causa raiz e verificação dirigida

Data: 2026-07-26. Complementa e **corrige** `docs/auditoria-avaliador-linkedin.md` (rodada 1).

Diferente da rodada 1, esta rodada **executou o produto**: servidor Express real na porta 3199, banco Supabase
real do projeto, autenticação real, PDF real, e **6 chamadas pagas à OpenAI**. Tudo que está aqui foi
reproduzido, não deduzido. Onde não consegui verificar, está escrito `NÃO VERIFICADO`.

**Nenhum arquivo de código foi modificado.** A PARTE J explica por que a autorização condicional de escrita não
foi acionada.

---

## 0. Divergências de fixture, ambiente e custo

### 0.1 Arquivos citados no briefing

| Citado | Situação real |
|---|---|
| `docs/fixtures/perfil-real.pdf` | **NÃO EXISTE**. O arquivo presente é `docs/fixtures/Profile.pdf` (66.535 bytes, 5 páginas). Usei esse. |
| `docs/fixtures/output-real.md` | **NÃO EXISTE**. `ls docs/fixtures/` retorna apenas `Profile.pdf`. |

Como o `output-real.md` não existe, substituí por algo melhor: recuperei do banco a **linha real** que a
ferramenta gravou na sua execução (`linkedin_analyses.id = cf02e168-22c8-4336-a3a7-62656c37413b`,
2026-07-26T21:28:29Z, score 72, faixa forte). É o output de produção de verdade, com o `input` exato. Todos os
seus 6 achados da PARTE B batem com essa linha, então a fonte confere.

### 0.2 Ambiente

- Servidor: `PORT=3199 pnpm dev:server`. A porta 3100 já estava ocupada pela sua instância, então subi uma
  paralela para capturar os logs. Boot limpo: `[server] rodando na porta 3199 (development)`, e
  `/api/health` devolveu `{"checks":{"database":"ok","openai":"ok","redis":"ok",...}}`.
- Banco: Supabase **remoto** do projeto (o `supabase/config.toml` existe mas não há instância local; os
  containers Docker da máquina são de outro projeto).
- Autenticação: token real, obtido via `POST /auth/v1/admin/generate_link` (type `magiclink`, **não dispara
  e-mail**) e trocado em `POST /auth/v1/verify`. Conta: `6a9063c4-2bcb-4432-8a75-70fccc676851`
  (`murilobarbosa2811@gmail.com`), que é `is_user_admin = true` e portanto passa no gate Pro por desenho
  (`is_user_pro` retorna `false`; o acesso vem do admin, conforme `CLAUDE.md`).

### 0.3 Efeitos colaterais que eu produzi (para você reverter se quiser)

Três análises reais foram gravadas em `linkedin_analyses` durante a PARTE E:

```
08f0b3f3-d154-43b0-a214-db712d46a575
b0c8a2da-bf9a-4200-816f-14079208d29e
d00cb5bb-1060-41cc-9d00-17da9fd046e8
```

Os `PUT` de progresso da PARTE A **não escreveram nada** (a tabela não existe). Nenhum e-mail foi enviado.

### 0.4 Custo real

6 chamadas à OpenAI, todas com `usage` medido:

| Chamada | Modelo | prompt_tokens | completion_tokens | Custo |
|---|---|---|---|---|
| Produto, run 1 | gpt-4o-mini | 4.130 | ~1.000 | US$ 0,00122 |
| Produto, run 2 | gpt-4o-mini | 4.130 | ~1.000 | US$ 0,00122 |
| Produto, run 3 | gpt-4o-mini | 4.130 | ~1.000 | US$ 0,00122 |
| Direta, controle | gpt-4o-mini | 4.130 | 1.000 | US$ 0,00122 |
| Direta, modelo forte | gpt-4o | 4.130 | 1.158 | US$ 0,02191 |
| Perfil B (não-tech) | gpt-4o-mini | 3.370 | 923 | US$ 0,00106 |
| **Total** | | | | **≈ US$ 0,028** |

Preços usados: gpt-4o-mini US$ 0,15/1M entrada e US$ 0,60/1M saída; gpt-4o US$ 2,50/1M e US$ 10,00/1M. São os
preços públicos que eu conheço, **não foram consultados ao vivo** nesta sessão.

Sobrou US$ 1,97 do orçamento autorizado.

Dois subprodutos relevantes desse número:
- **Custo real por análise: US$ 0,0012**, contra os US$ 0,0077 a US$ 0,0162 que a rodada 1 estimou com as
  constantes internas (`server/lib/aiTools.ts:34-35`, US$ 0,85/1M e US$ 3,40/1M). **As constantes do projeto
  superestimam o custo do `gpt-4o-mini` em cerca de 5,7 vezes.** Correção formal da rodada 1.
- A OpenAI aplicou cache automático de prompt: `prompt_tokens_details.cached_tokens = 4096` na segunda chamada
  em diante. O prefixo (system + cabeçalho) é estável e está sendo cacheado sem nenhum trabalho do projeto.

---

## PARTE A — Causa raiz dos dois bugs de produção

### A.1 Reprodução

Sequência real contra o servidor rodando, com o token válido e a análise `cf02e168` (que existe e é do dono):

**Sanidade primeiro** (prova que a rota, o token e a posse funcionam):
```
GET /api/linkedin/analyses
HTTP 200
{"data":[{"id":"cf02e168-22c8-4336-a3a7-62656c37413b","area":"fullstack","level":"pleno","score":72,...}]}
```

**Bug 1**:
```
GET /api/linkedin/analyses/cf02e168-22c8-4336-a3a7-62656c37413b/improvements
HTTP 500
{"error":{"code":"load_failed","message":"Não foi possível carregar o progresso."}}
```

**Bug 2**:
```
PUT /api/linkedin/analyses/cf02e168-22c8-4336-a3a7-62656c37413b/improvements/0
Content-Type: application/json
{"done":true}

HTTP 500
{"error":{"code":"save_failed","message":"Não foi possível salvar o progresso."}}
```

**Controle, a MESMA rota no analisador de GitHub**:
```
GET /api/github/analyses/ed130c03-8f91-407f-866a-f0d724ec8b57/improvements
HTTP 200
{"applied":[]}
```

Log do servidor (`server/app.ts:242-262` e `server/middleware/error.ts:23-28`):

```
[error] GET /api/linkedin/analyses/cf02e168-.../improvements (requestId: bb36a058-...) Error: Não foi possível carregar o progresso.
    at createError (/home/s0ft/boranatech/server/middleware/error.ts:52:25)
    at <anonymous> (/home/s0ft/boranatech/server/routes/linkedin.ts:328:9)
{"level":"error","msg":"http_request","method":"GET","path":".../improvements","status":500,"duration_ms":1327,...}

[error] PUT /api/linkedin/analyses/cf02e168-.../improvements/0 (requestId: a0074b59-...) Error: Não foi possível salvar o progresso.
    at createError (/home/s0ft/boranatech/server/middleware/error.ts:52:25)
    at <anonymous> (/home/s0ft/boranatech/server/routes/linkedin.ts:392:9)
{"level":"error","msg":"http_request","method":"PUT","path":".../improvements/0","status":500,"duration_ms":1016,...}
```

Repare no que **não** está no log: a causa. As duas rotas descartam `error.message` do Supabase
(`server/routes/linkedin.ts:326-334` e `:390-394` chamam `createError` sem logar o erro original). Voltarei a
isso em A.7.

### A.2 Sua hipótese: CONFIRMADA no mecanismo, e os dois bugs são o mesmo defeito

Você escreveu: "update otimista no client, `PUT` de progresso falhando, estado revertendo; e o `GET` dos mesmos
dados falhando gera o banner". Está exatamente certo, com evidência:

- **Bug 1**: o `useEffect` que carrega o progresso chama `getLinkedinImprovements(analysisId)`
  (`client/src/pages/LinkedinAnalisar.tsx:579-601`). O 500 rejeita a promise, o `.catch` zera o `applied` e
  chama `setProgressError("Não foi possível carregar seu progresso salvo. Recarregue a página para tentar de
  novo.")` (`:593-596`). Esse é o texto literal do banner que você viu, renderizado em `:1482-1486`.
- **Bug 2**: `toggleImprovement` (`:605-625`) marca `applied` na hora (o selo "Aplicada" aparece,
  `client/src/components/portfolio/QualitativePanels.tsx:214-229`), dispara o `PUT` em background e, no
  `.catch`, reverte o `Set` (`:616-621`). O selo some. É o rollback funcionando como projetado, contra um
  servidor que sempre falha.

Os dois consomem a **mesma tabela**. Um defeito, dois sintomas.

### A.3 A causa verdadeira: **(b), a migration não está aplicada**

`public.linkedin_improvement_progress` **não existe** no banco em uso. PostgREST, com service role:

```
GET /rest/v1/linkedin_improvement_progress?select=*&limit=1
HTTP 404
{"code":"PGRST205","details":null,
 "hint":"Perhaps you meant the table 'public.github_improvement_progress'",
 "message":"Could not find the table 'public.linkedin_improvement_progress' in the schema cache"}
```

O próprio PostgREST entrega a prova do contraste: a tabela **do GitHub** existe (`HTTP 200`), a do LinkedIn não.
O arquivo da migration está no repositório e nunca foi aplicado:
`supabase/migrations/20260710120000_create_linkedin_improvement_progress.sql`.

Isto é precisamente o passo (3) do checklist de `CLAUDE.md` ("Ordem de deploy: código antes da migration ...
(1) commit + push, (2) deploy, (3) `db:push`, (4) smoke test") que foi pulado. A regra do projeto protege contra
migration-antes-do-código; **não existe nenhum passo que verifique que a migration chegou depois**, e o
resultado é uma feature que nasce morta em produção sem quebrar o build nem o `pnpm check`.

### A.4 Refutação das outras hipóteses

**(a) `analysisId` chega `null` porque `persistAnalysis` falhou: REFUTADA**, por três evidências independentes.

1. A tabela `linkedin_analyses` tem **107 linhas** (`content-range: 0-0/107`) e a listagem devolve ids válidos.
2. A própria manifestação do Bug 2 é a prova lógica: o checkbox só é renderizado quando `analysisId` é
   verdadeiro (`LinkedinAnalisar.tsx:1490-1491`, `applied={analysisId ? applied : undefined}`), e
   `toggleImprovement` retorna cedo se `!analysisId` (`:606`). **Se o `analysisId` fosse `null`, não haveria
   checkbox para clicar e o Bug 2 seria impossível.** Além disso o usuário veria o banner amarelo "O progresso
   de melhorias está indisponível para esta análise" (`:1476-1480`), que é diferente do banner vermelho que você
   relatou.
3. Minhas 3 execuções reais devolveram `analysisId` preenchido nas três
   (`08f0b3f3-...`, `b0c8a2da-...`, `d00cb5bb-...`).

**(c) violação de FK ou constraint: REFUTADA.** Não há FK a violar: a tabela não existe. O erro é `PGRST205`
(tabela ausente do schema cache), não `23503`.

**(d) auth, RLS ou posse: REFUTADA.** O `GET /api/linkedin/analyses` responde 200 com o token, e a checagem de
posse `ownsLinkedinAnalysis` (`server/routes/linkedin.ts:277-295`) **passou** nas duas requisições: o stack
trace aponta `linkedin.ts:328` e `:392`, que são as linhas de erro do *progresso*, depois do bloco de posse
(`:305-319` e `:369-378`). Se a posse tivesse falhado, seria 404 ou o erro de `:308-314`. RLS também não entra:
o servidor usa `supabaseAdmin` com service role, que faz bypass.

**(e) outra:** não. A causa é (b), isolada e comprovada.

### A.5 Como verificar (b), e o comando que você precisa rodar

Eu **consegui** verificar neste ambiente, com o service role do `.env` e uma chamada PostgREST. Reproduza com:

```bash
set -a && . ./.env && set +a
curl -s -o /dev/null -w "%{http_code}\n" \
  "$VITE_SUPABASE_URL/rest/v1/linkedin_improvement_progress?select=*&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
# 200 = aplicada.  404 (PGRST205) = ausente, que é o estado de hoje.
```

Equivalente em SQL, no SQL Editor do Supabase:

```sql
select to_regclass('public.linkedin_improvement_progress');  -- null = ausente
```

**Varredura completa que eu já rodei**: extraí as 38 tabelas declaradas em todos os
`supabase/migrations/*.sql` e testei uma a uma. Resultado: **exatamente uma ausente**, a
`linkedin_improvement_progress`. Não é um problema sistêmico de migrations, é um lote esquecido.

### A.6 O que depende de `analysisId`, e o que quebra em cascata

Vale a distinção: neste bug o `analysisId` **existe**. O que falha é a tabela. Mas você pediu o mapa, e ele é
útil porque os dois modos de falha convergem quase no mesmo lugar.

| Consumidor | Evidência | `analysisId === null` | Tabela ausente (hoje) |
|---|---|---|---|
| Effect de carga do progresso | `LinkedinAnalisar.tsx:579-601` | não chama a API, `applied` vazio, sem erro | chama, 500, **banner vermelho** |
| Banner "progresso indisponível" | `:1476-1480` | aparece (amarelo) | não aparece |
| Banner de erro de progresso | `:1482-1486` | não aparece | **aparece** |
| Checkbox das melhorias | `:1490-1491` | não renderiza | renderiza, mas sempre reverte |
| `toggleImprovement` | `:605-625` | early return | otimista, PUT 500, rollback |
| Chip "N de M aplicadas" no hero | `:835-845, 1419` | `null`, some | `null` (por `progressError`), **some** |
| Celebração do `ReanalyzeCta` | `:843-845, 1831` | nunca celebra | nunca celebra |
| Persistência em `sessionStorage` v3 | `:559-574, 219-237` | grava `null`, restaura sem checklist | grava o id normalmente |
| `PUT .../improvements/:index` | `server/routes/linkedin.ts:343-397` | 404 | 500 |

Efeito líquido para o usuário hoje: **o checklist de melhorias aplicadas está 100% morto**, o hero perde o
placar de progresso, a celebração de "tudo aplicado" nunca dispara, e no lugar disso aparece um banner
vermelho no meio de um resultado que, fora isso, funcionou.

### A.7 O achado que explica por que isso passou despercebido

As duas rotas de progresso engolem a causa do erro:

```ts
if (error) {
  return next(createError(500, "load_failed", "Não foi possível carregar o progresso."));
}
```
`server/routes/linkedin.ts:326-334` e, no mesmo molde, `:390-394`.

A string `Could not find the table 'public.linkedin_improvement_progress'` existia no `error.message` do
Supabase e foi descartada. Nem o log do servidor, nem o Sentry (que recebe o `Error` genérico), nem o cliente
jamais viram a causa. A função irmã no mesmo arquivo faz o certo
(`ownsLinkedinAnalysis`, `:287-292`, loga `error.message`). Duas linhas de `console.error` teriam transformado
um bug de diagnóstico difícil em uma leitura de log.

---

## PARTE B — Parser contra o PDF real

Extraí o texto com uma réplica exata de `client/src/lib/pdfExtract.ts:49-78` (mesmo `pdfjs-dist` do projeto,
mesmo `item.str` + `hasEOL ? "\n" : " "`): **5 páginas, 7.584 caracteres**. Rodei
`shared/linkedin/parse.ts` real sobre esse texto. Prova de fidelidade do harness: alimentando
`runLinkedinChecks` com o `input` exato da sua execução, o score deu **72, faixa forte**, idêntico ao que está
gravado no banco.

Saída do parser, íntegra:

```
headline: "Software Developer | Full-Stack Engineer | AI Agent Expert | React |"   (68 chars)
sobre:    1317 chars
skillsPdf: ["AI Agents","Vector Databases","Retrieval-Augmented Generation","(RAG)"]
experiencias: 6
  exp[0] titulo="CTO & Co-founder Page   1   of   5"                          desc=42
  exp[1] titulo="SinergyRH Artificial Intelligence Engineer"                  desc=1474
  exp[2] titulo="Chatvolt Generative AI Consultant/Support Analyst"           desc=912
  exp[3] titulo="TST - Tribunal Superior do Trabalho Intern"                  desc=793
  exp[4] titulo="Software Engineer/QA Engineer Page   3   of   5"             desc=828
  exp[5] titulo="• Demonstrated high team collaboration for effective QA.
                 Software Engineer/Full-Stack Developer"                      desc=804
```

### B.1 `CTO & Co-founder · SinergyRH Artificial Intelligence Engineer` — mecanismo confirmado

O trecho do PDF é:

```
Bora na Tech?              <- empresa
CTO & Co-founder           <- cargo
Page   1   of   5          <- rodapé do PDF, virou linha de conteúdo
July 2026 - Present   (1 month)
Brazil                     <- localização
SinergyRH                  <- empresa da PRÓXIMA experiência
Artificial Intelligence Engineer
July 2026 - Present   (1 month)
```

`parseExperiencias` (`shared/linkedin/parse.ts:241-290`) delimita experiências por **linhas de data**
(`isDateRangeLine`, `:105-112`). A descrição de uma experiência é definida como "tudo entre a data dela e a
próxima data" (`:273-284`):

```ts
const nextDi = e + 1 < dateIdx.length ? dateIdx[e + 1] : content.length;
let descStart = di + 1;
const firstAfter = content[descStart] ?? "";
if (firstAfter && (isDateRangeLine(firstAfter) || /\b(yrs?|mos?|anos?|meses|mes)\b/i.test(firstAfter) || firstAfter.length < 18)) {
  descStart += 1;
}
const descricao = content.slice(descStart, nextDi).join(" ").trim();
```

Para a experiência do CTO: `descStart` aponta para `"Brazil"` (6 caracteres, `< 18`, então é pulado como
localização), e a janela vai até a próxima data. Como **não há descrição nenhuma** entre as duas datas, o que
sobra na janela é justamente o cabeçalho da experiência seguinte: `"SinergyRH"` + `"Artificial Intelligence
Engineer"`. Confirmado: `desc = "SinergyRH Artificial Intelligence Engineer"`, 42 caracteres.

**O mecanismo é: descrição vazia não existe como conceito no parser.** A janela entre datas nunca é vazia, ela
só passa a conter o cabeçalho do vizinho.

O título, por sua vez, pega até 2 linhas antes da data (`:264-269`), o que aqui captura `"CTO & Co-founder"` e o
rodapé `"Page 1 of 5"`. **A empresa "Bora na Tech?" fica 3 linhas antes e é descartada: ela não aparece em
nenhum título nem em nenhuma descrição** (verificado: `todo.includes("Bora na Tech") === false`).

### B.2 `SinergyRH Artificial Intelligence Engineer` — empresa colada no cargo

Mesmo trecho `:264-269`: o título são as até 2 linhas não-data imediatamente anteriores à data, sem invadir o
bloco anterior. Para a SinergyRH essas duas linhas são a empresa e o cargo, então saem grudadas. É o
comportamento projetado, e ele está errado sempre que a empresa e o cargo ocupam linhas adjacentes, que é o
layout padrão do export.

### B.3 `Campinas, São Paulo, Brazil Responsibilities:` — confirmado, e a previsão da rodada 1 se sustenta

A rodada 1 previu que o corte de localização é `firstAfter.length < 18` (`parse.ts:280`). A string real é
`"Campinas, São Paulo, Brazil"`, **27 caracteres**, portanto `27 < 18` é falso e a linha **não** é pulada:
entra na descrição. Confirmado exatamente como previsto.

Contraste medido no mesmo perfil: `"Brazil"` (6) e `"São Paulo, Brazil"` (17) **são** pulados; `"Campinas, São
Paulo, Brazil"` (27) e `"Brasília, DF"`... este último tem 12 e é pulado. Ou seja, a heurística funciona para
cidade curta e falha para cidade com estado e país por extenso. É uma regra de comprimento fazendo trabalho de
regra semântica.

### B.4 `Software Engineer/QA Engineer` — a empresa não desapareceu, ela mudou de dono

Você disse que "Alpha Edtech desapareceu". **Correção parcial: ela não desapareceu do texto, ela foi
reatribuída à experiência anterior.** O formato agrupado do LinkedIn é:

```
Alpha Edtech                      <- empresa
1 year 1 month                    <- duração total do agrupamento
Software Engineer/QA Engineer     <- cargo 1
Page   3   of   5
August 2024 - November 2024   (4 months)
```

`"1 year 1 month"` **não** é reconhecido como linha de data (`isDateRangeLine` exige ano de 4 dígitos ou nome de
mês, `:105-112`; "1 year 1 month" não tem nenhum dos dois). Então a empresa e a duração ficam órfãs entre a
data do TST e a data do QA, e caem na **descrição do TST**:

```
exp[3].descricao (cauda): "... • Elevated user satisfaction through improved services.
                           Alpha Edtech 1 year 1 month Software Engineer/QA Engineer Page   3   of   5"
```

Verificado: `exp[3].descricao.includes("Alpha Edtech") === true`, e nenhum título contém "Alpha Edtech".

**Resposta direta: o parser não trata o formato agrupado.** Não há nenhum conceito de "empresa com múltiplos
cargos" em `parse.ts`. As consequências se separam em duas:
- na **UI** ("seu atual") e nos **checks de título**, a empresa some do cargo a que pertence;
- no **prompt**, o texto sobrevive, só que ligado à experiência errada. É por isso que a IA conseguiu escrever
  `"Alpha Edtech Software Engineer/QA Engineer"` como contexto de bullets nas 3 execuções: ela reassociou
  sozinha o que o parser bagunçou.

### B.5 O último bullet entrando no título seguinte — confirmado

`exp[5].titulo = "• Demonstrated high team collaboration for effective QA. Software Engineer/Full-Stack
Developer"`. Mesma regra `:264-269`: as duas linhas anteriores à data do segundo cargo da Alpha Edtech são o
último bullet do cargo anterior e o cargo novo. O parser não tem como saber que uma linha começando com `•` é
conteúdo e não cabeçalho.

Custo real disso: `cargo-em-experiencia` (`server/lib/linkedinChecks.ts:320-328`) casa títulos contra
`marketTitles` usando `matchesAnyTitle` sobre **todos os títulos concatenados**, então esse lixo entra no
matching. No perfil real o check passou, mas passou apesar do ruído, não por causa da limpeza.

### B.6 Achado #5 da rodada 1: **REFUTADO** contra o PDF real

A rodada 1 afirmou que "o nome e a headline da pessoa são lidos como competências". **Isso não acontece neste
PDF, e a razão é estrutural, não sorte.**

O layout real é:

```
Top Skills
AI Agents
Vector Databases
Retrieval-Augmented Generation
(RAG)
Languages          <- CABEÇALHO RECONHECIDO
Portuguese   (Native or Bilingual)
...
Certifications     <- CABEÇALHO RECONHECIDO
...
Murilo Cardoso     <- nome
Software Developer | ...   <- headline
Summary
```

`sectionLines` (`parse.ts:218-228`) corta a seção no **próximo cabeçalho reconhecido**, e `"Languages"` é um
cabeçalho reconhecido (`SECTION_HEADERS`, key `idiomas`, `parse.ts:70`). A seção de skills fecha ali, muito
antes do nome. O `skillsPdf` real é `["AI Agents","Vector Databases","Retrieval-Augmented Generation","(RAG)"]`,
sem nenhum vestígio do nome.

**Correção formal: o achado #5 da rodada 1 é inválido como descrito.** Ele foi produzido por um export que eu
reconstruí em que "Principais competências" era seguido diretamente por "Resumo", sem `Languages` nem
`Certifications` no meio. Nessa configuração o bug é real (eu o reproduzi), mas ela não é o layout padrão do
export do LinkedIn.

O que sobra de verdadeiro, e é o que **de fato** aconteceu com você, é a PARTE B.7.

### B.7 `(RAG)` como quarta competência: line-wrap, confirmado

`"Retrieval-Augmented Generation (RAG)"` é uma competência só. O PDF quebra em duas linhas:

```
Retrieval-Augmented Generation
(RAG)
```

`parseSkills` (`parse.ts:230-239`) itera **linha a linha** e ainda quebra cada linha por `[,;|]`, aceitando
qualquer fragmento com 2 a 60 caracteres. Não existe nenhuma lógica de junção de linha continuada. Resultado:
3 competências reais viram 4 itens, sendo um deles o fragmento `"(RAG)"`. Exatamente o que você viu no campo
pré-preenchido.

**Onde mais o line-wrap do PDF quebra o parser:**

1. **A headline perde conteúdo.** É o mais grave e ninguém tinha notado. A headline real ocupa duas linhas:
   ```
   Software Developer | Full-Stack Engineer | AI Agent Expert | React |
   Node
   ```
   `detectHeadline` (`:193-205`) escolhe **uma única linha** candidata, a última com sinal forte. `"Node"` tem
   4 caracteres e é rejeitada por `isHeadlineCandidate` (`:166-167`, mínimo 6). A headline entregue termina em
   `"| React |"`, com barra órfã, e **"Node" nunca chega à análise**. Consequência direta e medida:
   `countKnownTechnologies(headline) = 1`, então `headline-stack` **reprova** com "A headline cita menos de 2
   tecnologias reconhecidas" (peso 6, importante). É a origem da crítica que você recebeu (ver B.9).
2. **Competências**, item acima.
3. **Palavras hifenizadas no corpo** ganham espaço: no `exp[1].descricao` real aparece `"answers natural-
   language HR and payroll questions"`. Nenhuma tecnologia foi partida neste PDF, mas o mecanismo é o mesmo
   que quebraria `"Node.\njs"` ou `"Tailwind\nCSS"`: `containsTerm` (`server/lib/skillNormalize.ts:72-81`) exige
   o termo normalizado contíguo, então um termo partido pelo wrap simplesmente não é contado.
4. **Linhas que são só um parêntese de continuação** aparecem 3 vezes neste PDF: `"(61)99952-2811   (Mobile)"`,
   `"(Portfolio)"`, `"(RAG)"`. Só a última cai dentro de uma seção que vira dado, mas o padrão é recorrente.

### B.8 `stripPdfPageNoise` roda **só na exibição**, e o que isso corrompe

Confirmado por código e por execução. O `PAGE_RE` do parser (`parse.ts:117`) é usado **apenas** dentro de
`isHeadlineCandidate` (`:174`), ou seja, só para não escolher um rodapé como headline. Ele **não filtra** as
linhas de conteúdo. E `stripPdfPageNoise` (`client/src/components/linkedin/stripPdfPageNoise.ts:17-22`) é
chamado só na renderização do "seu atual" (`LinkedinAnalisar.tsx:1559, 1612-1616`), com um comentário no
arquivo dizendo explicitamente que é assim de propósito.

O que isso corrompe, medido no PDF real (**5 das 6 experiências carregam `Page N of M` cru** no título ou na
descrição):

- **Títulos poluídos**: `"CTO & Co-founder Page   1   of   5"` e `"Software Engineer/QA Engineer Page   3   of
  5"`. Vão crus para `cargo-em-experiencia` e para o prompt da IA.
- **Contagem inflada**: 57 caracteres de rodapé são contados no total de `exp-descricoes`
  (`server/lib/linkedinChecks.ts:287-296`, limiar de 100 caracteres). Num perfil magro, esse ruído pode ser a
  diferença entre reprovar e aprovar um check **essencial de peso 10**.
- **Falso positivo em `exp-resultados` a partir de 10 páginas.** O `RESULT_RE`
  (`server/lib/linkedinChecks.ts:109`) é `/(\d+\s?%|\b\d{2,}\b|\+\d)/`. Medido:
  ```
  RESULT_RE.test("Page   1   of   5")   = false
  RESULT_RE.test("Page   10   of   12") = true      <- rodapé vira "métrica"
  RESULT_RE.test("Pagina 10 de 20")     = true
  ```
  Um PDF de 10 páginas ou mais **aprova sozinho** o check "Descrições com números e resultados". Neste perfil,
  de 5 páginas, não disparou.
- **O prompt recebe o lixo**: `experienciasBlock` (`server/lib/linkedinAnalyze.ts:103-114`) usa
  `exp.titulo` e `exp.descricao` crus, e esse ruído ainda ocupa espaço dentro do orçamento de 4.000 caracteres
  que, como mostro na PARTE E.5, já está estourando.

### B.9 A crítica à headline: de onde ela veio

Você recebeu "a headline não menciona tecnologias além das já listadas" numa headline que lista React **e**
Node. Rastreado até o fim, com a cadeia inteira reproduzida:

1. O PDF quebra a headline em duas linhas e `"Node"` é descartado por ter menos de 6 caracteres
   (`parse.ts:166-167`). Headline entregue: `"... | React |"`.
2. `countKnownTechnologies` sobre essa headline devolve **1** (só React).
3. `headline-stack` exige `>= 2` (`server/lib/linkedinChecks.ts:199-204`) e **reprova**:
   `"A headline cita menos de 2 tecnologias reconhecidas."`
4. Essa frase entra no bloco de checagens do prompt como **fato**, sob a instrução
   `"são fatos, não reavalie nem contradiga"` (`server/lib/linkedinAnalyze.ts:148`).
5. A IA obedece e transforma em crítica. Reproduzido nas minhas execuções, literalmente:
   - run 3, `pontosFracos`: `"A headline não menciona tecnologias adicionais relevantes."`
   - chamada direta ao `gpt-4o-mini`, `pontosFracos`: `"A headline não menciona tecnologias relevantes como
     Next.js e Tailwind CSS."`
   - run 3, `proximoPasso`: `"Atualize a sua headline para incluir tecnologias relevantes como Next.js e
     Tailwind CSS."`

**Sobre a pergunta específica "a detecção ou algum check fatia a headline por `|`": não.** Nem
`detectHeadline`, nem `clicheHeadline`, nem `headline-stack`, nem `headline-tamanho` quebram por barra. A barra
só é usada como *sinal* de que a linha é uma headline (`parse.ts:184`). O único lugar do parser que fatia por
`|` é `parseSkills` (`:233`), e ele opera na seção de competências, não na headline.

Então o defeito não é fatiamento: é **truncamento por wrap**, e o agravante é que a nota erra junto com o texto.
Pior: a "correção" que a ferramenta sugere é adicionar Next.js e Tailwind, tecnologias que você não usa, quando
a resposta certa seria "sua headline já está boa, o leitor é que não a leu inteira".

---

## PARTE C — Cargo em inglês no mercado Brasil

### C.1 Reprodução

Perfil construído com headline `"Full Stack Developer | React, Node.js"`, área `fullstack`, 10 competências
coladas, todos os sinais positivos. Rodado nos três mercados:

| Mercado | Score | `headline-cargo-alvo` | `cargo-em-experiencia` | `termos-bilingues` |
|---|---|---|---|---|
| brasil | 77 forte | **OK** (essencial, 10) | OK (importante, 6) | **REPROVA** (opcional, **3**) |
| ambos | 74 forte | **OK** (essencial, 10) | OK (importante, 6) | **REPROVA** (essencial, **10**) |
| exterior | 75 forte | **OK** (essencial, 10) | OK (importante, 6) | não se aplica |

### C.2 Sua hipótese está **parcialmente errada**, e o problema real é pior

Você disse que o usuário "perde nota e recebe a informação de que falta o cargo-alvo na headline". A segunda
metade não se sustenta:

**`headline-cargo-alvo` APROVA um cargo em inglês no mercado Brasil.** A razão está em `titlesForMarket`
(`server/lib/linkedinChecks.ts:129-134`):

```ts
function titlesForMarket(area: AreaSlug, mercado: Mercado): string[] {
  if (mercado === "brasil") {
    return [...PT_TITLES[area], ...ENGLISH_TITLES[area]];   // <- os DOIS idiomas
  }
  return ENGLISH_TITLES[area];
}
```

Para o mercado Brasil a régua é PT **mais** EN, exatamente coerente com o system prompt. Medido:
`matchesAnyTitle("Full Stack Developer | React, Node.js", [...PT, ...EN]) === true`. E no perfil real do PDF,
que é integralmente em inglês, `headline-cargo-alvo` também **passou**.

**O que realmente pune é `termos-bilingues`**, e a contradição existe, só que em outro lugar e com outro preço:

- System prompt, `server/lib/linkedinAnalyze.ts:58`: *"Para o mercado Brasil, as reescritas são em português,
  **mas o cargo na headline pode ser em inglês porque é assim que se busca em tecnologia**."*
- Check `termos-bilingues`, `server/lib/linkedinChecks.ts:340-350`: aprova **somente** se
  `matchesAnyTitle(profileText, PT_TITLES) && matchesAnyTitle(profileText, ENGLISH_TITLES)`. Ou seja, exige o
  cargo **nos dois idiomas**, no perfil inteiro.
- Catálogo, `shared/linkedin/schema.ts:292-300`: `tier: "opcional"`, mas
  `tierByMercado: { ambos: "essencial" }` e `appliesToMercado: ["brasil", "ambos"]`.

As duas frases lado a lado: o prompt diz que escrever o cargo só em inglês **está certo**; o check diz que
escrever o cargo só em inglês **está errado**. A mesma decisão é premiada pela metade da ferramenta que escreve
o texto e punida pela metade que dá a nota.

### C.3 `headline-cargo-alvo` compara contra o quê

Contra `titlesForMarket(area, mercado)`, ou seja: **PT + EN quando o mercado é Brasil**, e **só EN** quando é
exterior ou ambos (`server/lib/linkedinChecks.ts:189-197` chamando `:129-134`). Sim, depende do mercado.

Nota lateral que interessa: para o mercado **ambos**, `headline-cargo-alvo` usa **só EN**, e ao mesmo tempo
`termos-bilingues` vira essencial e exige PT. As duas regras convivem no mesmo cenário puxando para lados
opostos.

### C.4 Quanto custa, e quantas pessoas caem nisso

Custo medido, exclusivamente por `termos-bilingues`:

- mercado **brasil**: 3 pontos de 177 = **1,7 ponto** na nota final.
- mercado **ambos**: 10 pontos de 184 = **5,4 pontos** na nota final, e é o único caso capaz de mudar de faixa
  sozinho perto de uma fronteira.

Frequência: **estimativa, não medição.** Em tecnologia no Brasil os títulos em inglês ("Full Stack Developer",
"Software Engineer", "Frontend Developer") são a norma na headline, e escrever o mesmo cargo também em
português no perfil é raro fora de vagas CLT tradicionais. Meu palpite é que **algo entre metade e três quartos
dos perfis brasileiros de tecnologia reprovam `termos-bilingues`**, e ele vira quase um imposto fixo. Não tenho
dado para sustentar isso; para medir de verdade bastaria rodar o check sobre as 107 análises já persistidas,
que é uma consulta, não um experimento.

### C.5 Correção proposta e impacto em análises persistidas

A correção honesta não é remover o check, é **corrigir o alvo dele**. Hoje ele mede "o cargo aparece em PT e em
EN"; o que ele quer medir é "o perfil é encontrável por recrutador que busca em português". Proposta:

1. Aprovar quando o cargo aparecer **em qualquer um dos dois idiomas** e o perfil declarar mercado brasil,
   rebaixando a exigência bilíngue a uma **dica** (não a um check pontuado).
2. Para mercado **ambos**, manter a exigência bilíngue, mas **rebaixar de essencial para importante** (10 -> 6)
   e alinhar a copy do prompt: dizer explicitamente que, no mercado ambos, o cargo deve aparecer em inglês na
   headline **e** em português em algum outro campo (Sobre ou título de experiência). Hoje o prompt não pede
   isso em lugar nenhum, então a ferramenta pune por algo que ela nunca ensinou.

**Muda nota de análise persistida?** Não retroativamente: `linkedin_analyses.result` guarda o `deterministic`
inteiro e nunca é reescrito (`server/routes/linkedin.ts:62-74`). Mas **quebra comparabilidade**: a próxima
reanálise sobe 2 a 5 pontos sem o perfil ter mudado, e o `ScoreDeltaBanner` (`LinkedinAnalisar.tsx:1422-1427`)
vai comemorar uma melhora que não existiu. Isso vale para qualquer recalibração e volta na PARTE I.

---

## PARTE D — Checagens agregadas mascarando falha por item

### D.1 Confirmado: as checagens de experiência avaliam **um bloco concatenado**

`server/lib/linkedinChecks.ts:151-158`:

```ts
const expDescricoes = parsed.experiencias.map((exp) => exp.descricao).join(" ").trim();
const expTitulos    = parsed.experiencias.map((exp) => exp.titulo).join(" ").trim();
```

E os checks operam sobre essas strings únicas: `exp-descricoes` mede `expDescricoes.length >= 100` (`:287-296`),
`exp-verbos-acao` conta verbos no blob (`:176-177, 297-303`), `exp-tecnologias` conta techs no blob
(`:175, 304-310`), `exp-resultados` roda um regex no blob (`:311-319`), `cargo-em-experiencia` casa títulos no
blob (`:320-328`).

No perfil real: `exp[0]` tem **42 caracteres** de "descrição" (que nem descrição é, é o cabeçalho do vizinho) e
mesmo assim **os 5 checks de experiência passaram**, o veredito da seção saiu `bom` e o card exibiu
"Está bom / 5 critérios ok" (`SectionReport.tsx:25-33, 110-116`). Exatamente o que você viu.

### D.2 Prova construída: uma experiência boa carrega três vazias

Perfil sintético: 1 experiência rica + 3 sem nenhuma descrição.

```
exp[0] titulo="Empresa Boa Desenvolvedor Full-stack"  desc=225 chars
exp[1] titulo="Empresa Vazia Um Desenvolvedor"        desc=32 chars   (só a localização vazada)
exp[2] titulo="Empresa Vazia Dois Desenvolvedor"      desc=32 chars
exp[3] titulo="Empresa Vazia Tres Desenvolvedor"      desc=0 chars    (literalmente vazia)

[OK] exp-existe        : 4 experiência(s) detectada(s).
[OK] exp-descricoes    : As experiências têm descrições com substância.
[OK] exp-verbos-acao   : As descrições usam 4 verbos de ação.
[OK] exp-tecnologias   : As descrições citam 8 tecnologias reconhecidas.
[OK] exp-resultados    : As descrições trazem números ou métricas.
```

**Cinco de cinco, incluindo um check essencial de peso 10, com 75% das experiências vazias.** Resposta à sua
pergunta: sim, uma experiência excelente faz todas as outras passarem.

### D.3 Todos os checks que sofrem de agregação

Nove dos 27, somando **62 dos 177 pontos possíveis no mercado Brasil, ou 35% da nota**:

| Check | Tier | Peso | Agrega sobre |
|---|---|---|---|
| `exp-descricoes` | essencial | 10 | todas as descrições concatenadas |
| `cobertura-keywords-area` | essencial | 10 | perfil inteiro + skills |
| `skills-cobertura` | essencial | 10 | todas as competências |
| `exp-verbos-acao` | importante | 6 | todas as descrições |
| `exp-tecnologias` | importante | 6 | todas as descrições |
| `cargo-em-experiencia` | importante | 6 | todos os títulos |
| `cobertura-keywords-otima` | importante | 6 | perfil inteiro + skills |
| `exp-resultados` | opcional | 3 | todas as descrições |
| `termos-bilingues` | opcional | 3 | perfil inteiro |

Os outros 18 são de campo único (headline, Sobre, sinais do formulário) e não têm esse problema.

### D.4 Existe algum check por item? Não

Varri o catálogo inteiro (`shared/linkedin/schema.ts:142-384`, 28 entradas). **Não existe nenhum check que
olhe uma experiência individualmente.** Concretamente, não há:

- check de "experiência sem descrição";
- check de "descrição abaixo de N caracteres" por item;
- check de "cargo sem data" (aliás, sem data a experiência sequer é delimitada, `parse.ts:246-256`);
- check de "experiência mais recente sem tecnologias", que seria o mais valioso, já que recrutador lê a
  primeira.

Consequência combinada com a PARTE B: a experiência do CTO, que está **de fato vazia** no LinkedIn, é a que o
recrutador vê primeiro, e a ferramenta chama a seção inteira de "Está bom".

### D.5 Desenho proposto: check por item com veredito por item

**Modelo.** Introduzir uma dimensão de item nos checks de experiência, mantendo os agregados para o que é
legitimamente agregado (cobertura de palavras-chave é uma propriedade do perfil, não de uma experiência).

```ts
interface LinkedinItemCheckResult {
  itemIndex: number;          // índice da experiência
  itemLabel: string;          // título já limpo, para a UI
  checks: LinkedinCheckResult[];
}
```

O `LinkedinDeterministicResult` ganharia `experienciasChecks: LinkedinItemCheckResult[]`, e o score dos checks
de experiência passaria a ser a **fração de itens aprovados** vezes o peso, em vez de tudo ou nada. Uma
experiência vazia entre quatro deixaria de custar zero.

**Custo da mudança, honesto:**

| Camada | Impacto |
|---|---|
| `shared/linkedin/schema.ts` | tipo novo + `computeLinkedinScore` passa a somar peso fracionado. Contrato muda: `result` antigo continua legível, mas o campo novo não existe nas 107 linhas persistidas, então a UI precisa de fallback |
| `server/lib/linkedinChecks.ts` | os 4 checks de `exp-*` viram função por item; ~80 linhas |
| Prompt | o bloco de checagens (`linkedinAnalyze.ts:94-101`) passa a listar por experiência; **cresce**, e o orçamento de tokens já está apertado (PARTE E.5). Provavelmente é preciso enviar só os itens reprovados |
| UI | `SectionReport` (`checks: LinkedinCheckResult[]`) precisa de um modo aninhado: veredito da seção + lista por experiência. É a maior parte do trabalho visual |
| Nota | **muda para todo mundo**, quase sempre para baixo. Decisão de produto |

Estimativa: 1 a 2 dias, e é a mudança que mais aumenta a verdade do diagnóstico.

---

## PARTE E — Fidelidade do output da IA

### E.1 As três execuções

Três `POST /api/linkedin/analyze` reais, payload idêntico ao `input` da sua execução de produção:

```
run 1: HTTP 200 em 11.810ms  analysisId=08f0b3f3-...  score=72
run 2: HTTP 200 em 10.647ms  analysisId=b0c8a2da-...  score=72
run 3: HTTP 200 em 10.015ms  analysisId=d00cb5bb-...  score=72
```

Latência real ponta a ponta: **10 a 12 segundos** (a rodada 1 estimou 15 a 40s; era pessimista).

Os textos completos das três estão transcritos no fim desta parte, em E.8, para não quebrar a leitura.

### E.2 Tabela de fidelidade factual

Critério: `sustentada` = a afirmação tem lastro em linha específica do PDF; `distorcida` = o fato existe mas foi
reatribuído, exagerado ou generalizado; `inventada` = não há lastro nenhum.

**RUN 1**

| Afirmação | Veredito | Lastro ou ausência |
|---|---|---|
| "Built Syni ... **using Node.js and TypeScript**, improving HR query efficiency" | **INVENTADA** | O PDF descreve Syni em 4 linhas (69-72) e **nunca** nomeia a stack dele. Node.js/TypeScript aparecem no Summary e na Alpha Edtech, outra empresa |
| "Designed a hybrid architecture integrating LLMs and deterministic backend logic" | sustentada | linhas 73-76 |
| "Implemented multi-channel delivery ..., **enhancing user engagement across platforms**" | distorcida | linhas 81-84 dizem WhatsApp e Excel com janela de mensageria; "user engagement" não é afirmado |
| Chatvolt: "over 20 custom AI agents ... improving operational efficiency" | sustentada | linhas 97, 105 |
| Chatvolt: "Streamlined technical support ... response times and client satisfaction" | sustentada | linhas 107, 110 |
| Chatvolt: "Delivered end-to-end AI solution support, aligning with strategic goals" | sustentada | linhas 102-103 |
| Alpha: Cypress / Jest / CI-CD (3 bullets) | sustentadas | linhas 139-141 |
| `sobreReescrito` inteiro | sustentado | paráfrase do Summary (31-56); troca "Front-End Engineer" por "Full Stack Developer", coberto por "profound knowledge in full-stack development" |

**RUN 2**

| Afirmação | Veredito | Lastro ou ausência |
|---|---|---|
| "Built Syni ..., improving **HR query response times by 86%**" | **DISTORCIDA** | os ~86% são redução de latência de *pre-routers determinísticos em queries comuns* (79-80), não tempo de resposta do Syni |
| "Architected a semantic search engine for 3M+ candidate profiles" | sustentada | linhas 85-87 |
| "Implemented multi-channel delivery ..., integrating with legacy systems seamlessly" | sustentada | linhas 81-84 |
| Chatvolt (3 bullets) | sustentadas | 96-111 |
| Alpha (3 bullets) | sustentadas | 139-145 |
| `sobreReescrito` | sustentado | Summary |

**RUN 3**

| Afirmação | Veredito | Lastro ou ausência |
|---|---|---|
| "Built a conversational AI agent ..., improving **response accuracy** and efficiency" | distorcida | o PDF fala em confiabilidade dos números por desenho determinístico (73-76), nunca em acurácia de resposta |
| "Designed a hybrid architecture ..., achieving a latency reduction of ~86% **on common queries**" | distorcida (leve) | mantém "common queries", mas atribui à arquitetura em vez de aos pre-routers (79-80) |
| "Architected a semantic search engine over 3M+ ..." | sustentada | 85-87 |
| Chatvolt (2 bullets), Alpha (2 bullets) | sustentadas | 96-111, 139-145 |
| `proximoPasso`: "Atualize a sua headline para incluir tecnologias relevantes como **Next.js e Tailwind CSS**" | **INVENTADA e prejudicial** | Next.js e Tailwind **não aparecem no PDF**. A ferramenta está mandando um engenheiro de IA anunciar tecnologias que ele não usa, no campo mais visível do perfil |
| `pontosFracos`: "A headline não menciona tecnologias adicionais relevantes" | derivada de check errado | ver B.9 |

**Chamada direta de controle (`gpt-4o-mini`, mesmo payload)** produziu **a sua frase, literalmente**:

> "Built Syni, a production conversational AI agent **using Node.js and React**, improving HR query response
> times by 86%."

Uma frase, duas falhas: stack inventada e os 86% reatribuídos. Reprodução exata do que você relatou.

**Placar em 3 execuções do produto**: sobre 24 afirmações factuais avaliadas, **2 inventadas** (a stack do Syni
na run 1 e a recomendação Next.js/Tailwind na run 3) e **4 distorcidas**. Somando a chamada direta, a
fabricação de stack do Syni apareceu em **2 de 4 execuções do `gpt-4o-mini`**, sempre no mesmo bullet.

O padrão é nítido e não é aleatório: **a alucinação se concentra na primeira bullet da primeira experiência**,
que é justamente aquela cuja descrição não nomeia tecnologias. O modelo preenche a lacuna com a stack que
achou em outro lugar do perfil.

### E.3 Variabilidade entre execuções

| Dimensão | Resultado |
|---|---|
| Nota | **72, 72, 72.** Zero variação, como projetado |
| `resumo` | reescrito do zero as 3 vezes, mesma tese, palavras diferentes |
| `pontosFortes` | 4 itens na run 1, 5 nas runs 2 e 3; conteúdo sobreposto mas não idêntico |
| Ordem das melhorias | **muda**. Run 1 e 2 abrem com "palavras-chave / competências"; run 3 promove **"Atualizar a Headline com Tecnologias" a prioridade alta e primeira posição** |
| `proximoPasso` | 3 ações diferentes: competências (run 1), competências (run 2), **headline** (run 3) |
| `headlines` | 9 propostas distintas em 3 execuções, sem repetição literal |
| `bulletsReescritos` | sempre os mesmos 3 contextos; número de bullets varia (3+3+3, 3+3+3, 3+2+2) |
| `skillsSugeridas` | run 1 e 3 idênticas; run 2 troca a ordem e inclui NestJS e Ruby on Rails |

Isto tem uma consequência de produto que ninguém pediu para eu avaliar mas que salta: **o "próximo passo único
de maior impacto" não é estável**. Duas pessoas com o mesmo perfil, ou a mesma pessoa reanalisando, recebem
prioridades diferentes. Como a UI vende esse card como *a* ação (`NextStepCard`), a instabilidade mina a
autoridade da recomendação.

Detalhe agravante da run 3: ela promoveu a **headline** a prioridade alta, e a headline só estava reprovada
por causa do bug de truncamento da PARTE B.7. O erro do parser chegou ao topo da lista de prioridades.

### E.4 O texto é intercambiável entre perfis? **Não** (a lacuna da rodada 1, fechada)

Rodei o mesmo pipeline com um perfil deliberadamente oposto (Ana Moura, administrativa em transição para dados,
área `analise-dados`, mercado brasil, score 49):

> "Seu perfil está em transição de carreira e possui uma boa base de experiência em administração, mas precisa
> de ajustes para se destacar na área de Análise de Dados."

`pontosFortes` incluem "Experiência sólida em administração com **6 anos** de atuação", "Habilidade em criar
relatórios gerenciais em **Excel e Power BI**", "gestão de processos financeiros, como **contas a pagar e
receber**". `headlines` propostas em português com SQL e Power BI. `skillsSugeridas`: Python, R, Tableau,
Looker, Pandas.

**Veredito: o conteúdo é específico do perfil, não é boilerplate.** A rodada 1 levantou o risco de feedback
genérico; ele **não se confirma**. Correção formal.

O que **é** intercambiável é o *esqueleto*: as duas análises seguem a fórmula "Seu perfil [avaliação], mas
[ressalva]. É importante incluir mais palavras-chave...", e **"adicionar palavras-chave / competências" aparece
como prioridade alta em 100% das execuções de ambos os perfis**. Isso não é o modelo sendo preguiçoso: é
consequência de os checks de cobertura reprovarem sempre (rodada 1, achado #1), então o mesmo fato é injetado
como reprovação em todo prompt e a IA fielmente o promove a prioridade máxima. **O viés estrutural da nota vira
viés do texto.**

Um segundo achado nesse perfil: a segunda headline proposta foi
`"Analista de Dados | SQL, Power BI | Buscando novas oportunidades"`. O system prompt **proíbe explicitamente**
esse tipo de frase (`server/lib/linkedinAnalyze.ts:62`: *"Nada de frases como apaixonado por tecnologia ou em
busca de oportunidades"*). E o checker determinístico da própria ferramenta **não pega**, porque
`clicheHeadline` (`server/lib/linkedinChecks.ts:114-122`) só cobre o singular. Medido:

```
PEGA   :: Buscando oportunidades
PEGA   :: Em busca de oportunidades
PEGA   :: Apaixonado por tecnologia
PASSA  :: Buscando novas oportunidades        <- gerado pela própria IA
PASSA  :: Em busca de novas oportunidades
PASSA  :: Aberto a novas oportunidades
PASSA  :: Open to new opportunities
```

A ferramenta gerou um texto que o próprio prompt proíbe, e o próprio detector deixou passar por uma lacuna de
plural.

### E.5 Por que só 3 de 6 experiências receberam bullets

Sua hipótese oferecia três causas. Medi as três.

**`max_tokens`: NÃO.** Capturei o `finish_reason` real fazendo a chamada direta com o payload idêntico:

```
gpt-4o-mini: finish_reason=stop   usage={"prompt_tokens":4130,"completion_tokens":1000}
gpt-4o     : finish_reason=stop   usage={"prompt_tokens":4130,"completion_tokens":1158}
```

`stop`, não `length`. Nada foi cortado na saída. (Isso não invalida o achado #10 da rodada 1: o código continua
sem ler `finish_reason`, `server/lib/linkedinAnalyze.ts:210-216`; só significa que não é a causa aqui.)

**Truncamento do prompt: SIM, e é pior do que parece.** `EXPERIENCIAS_LIMIT = 4000`
(`server/lib/linkedinAnalyze.ts:33`), aplicado sobre o bloco concatenado (`:103-114`). Medido:

```
bloco cru: 5.196 chars | limite: 4.000 | chars perdidos: 1.196
  exp[0] começa em    0  -> DENTRO
  exp[1] começa em   82  -> DENTRO
  exp[2] começa em 1604  -> DENTRO
  exp[3] começa em 2571  -> DENTRO
  exp[4] começa em 3412  -> DENTRO (cortada no meio)
  exp[5] começa em 4293  -> CORTADA INTEIRA
```

A experiência 6 **nunca chegou ao modelo**. E qual é ela? `"Software Engineer/Full-Stack Developer"` na Alpha
Edtech, cuja descrição é:

> "Developed responsive user interfaces using React. Created a library of reusable components. Designed scalable
> RESTful APIs with TypeScript and Node.js. Managed PostgreSQL and Redis database environments. Maintained
> production Linux servers..."

**É a experiência mais full-stack do perfil inteiro, para uma análise cuja área escolhida é `fullstack`, e é
exatamente ela que o truncamento descarta.** O corte é por posição no texto, e a ordem é cronológica
decrescente, então o limite sempre sacrifica as experiências mais antigas, sem nenhuma noção de relevância.

**Escolha do modelo: SIM, para as outras duas.** Das 5 experiências que chegaram ao prompt, a IA ignorou a
`exp[0]` (CTO, cuja "descrição" é o cabeçalho do vizinho, ou seja, não há o que reescrever) e a `exp[3]` (TST,
serviço de TI e ITIL, sem código). As duas escolhas são defensáveis; o problema é que **nada disso é explicado
ao usuário**, que vê 3 blocos e 6 experiências no perfil e não sabe se foi decisão editorial, bug ou limite.

Causa raiz combinada: **truncamento cego por posição (1) + ausência de qualquer instrução no prompt sobre
cobertura de experiências (2) + ausência de qualquer explicação na UI (3)**.

### E.6 `gpt-4o-mini` contra `gpt-4o`, mesmo prompt, mesmo payload

| | gpt-4o-mini-2024-07-18 | gpt-4o-2024-08-06 |
|---|---|---|
| Latência | 8.941 ms | 8.903 ms |
| Tokens | 4.130 / 1.000 | 4.130 / 1.158 |
| Custo real | **US$ 0,00122** | **US$ 0,02191** (18x) |
| `finish_reason` | stop | stop |

**Fidelidade dos bullets de Syni:**

| Afirmação | mini | 4o |
|---|---|---|
| Stack do Syni | "using **Node.js and React**" -> **INVENTADA** | "for HR and payroll queries using hybrid architecture" -> **sustentada** |
| Os ~86% | "improving HR query response times by 86%" -> **distorcida** | "Designed a backend system with deterministic logic and LLMs for intent interpretation, **reducing latency by 86%**" -> **sustentada**, atribuição correta |
| Qdrant e embeddings | não mencionou | "Architected a semantic search engine over 3M+ profiles **using vector embeddings and Qdrant**" -> sustentada |
| Legado PHP | não mencionou | "integrating modern AI with **legacy PHP systems**" -> sustentada |
| Cobertura | 3 blocos, 2 a 3 bullets | 2 blocos, **5 bullets cada** |

**`skillsSugeridas`, a diferença mais importante:**

- mini: `["Next.js","Tailwind CSS","Express.js","GraphQL","MongoDB","Git","Ruby","Elixir"]` -> cópia crua da
  lista de faltantes. Sugere Ruby e Elixir a um desenvolvedor JS/TS.
- 4o: `["JavaScript","TypeScript","React","Node.js","Docker","PostgreSQL","Redis","Linux","ITIL","Generative AI"]`
  -> **exatamente as tecnologias que o perfil comprova e que estão faltando na seção Competências do LinkedIn.**
  É a resposta correta, e é a que o próprio system prompt pede (`linkedinAnalyze.ts:54`: "proponha apenas o que
  é plausível a partir do que o perfil já evidencia").

**Onde o 4o falha igual:** o `proximoPasso` dele é *"Atualize sua headline para incluir tecnologias adicionais
como **Next.js e MongoDB**"*, e uma das headlines propostas é `"Full Stack Developer | React, Node.js, Next.js |
AI Agent Expert"`. Ou seja, **os dois modelos recomendam tecnologias que a pessoa não tem, no mesmo lugar.**

**Conclusão causal, que é o ponto principal desta parte:** trocar de modelo compra fidelidade nos bullets e
conserta o `skillsSugeridas`, mas **não conserta a recomendação de tecnologias inventadas na headline**. Isso
prova que essa falha específica **não é do modelo, é do prompt e do dado**: a lista `keywordsFaltantes` é
injetada como "Palavras-chave da área faltantes" (`linkedinAnalyze.ts:156-158`) sem nenhuma instrução dizendo
que ela pode ser irrelevante para a pessoa, e os dois modelos leem isso como uma lista de tarefas. É consertável
com prompt, de graça, e é bem mais barato que trocar o modelo.

### E.7 A `REGRA DOS FATOS` contra uma checagem objetivamente errada

Cenário da PARTE D: a experiência do CTO está vazia, mas o check diz `"As experiências têm descrições com
substância"` e isso entra no prompt sob `"são fatos, não reavalie nem contradiga"`
(`linkedinAnalyze.ts:54, 148`).

**Verifiquei nos 3 outputs se a IA apontou a experiência vazia. Não apontou em nenhum.**

```
run1: cita 'cto'=false  'co-founder'=false  'bora na tech'=false  'sem descrição'=false
run2: cita 'cto'=true   'co-founder'=false  'bora na tech'=false  'sem descrição'=false
run3: cita 'cto'=false  'co-founder'=false  'bora na tech'=false  'sem descrição'=false
```

O mais próximo que chegou foram duas melhorias genéricas e despriorizadas:

- run 2, prioridade **média**: "Expandir a descrição das experiências. Revise as descrições das suas
  experiências para incluir mais detalhes sobre as tecnologias utilizadas..."
- run 3, prioridade **baixa**: "Expandir a Seção de Experiências. Considere detalhar mais suas experiências,
  especialmente em projetos que utilizam tecnologias que você domina..."

Nenhuma nomeia a experiência problemática. Nenhuma diz "sua experiência de CTO está sem descrição".

**Resposta direta à sua pergunta: sim, a IA está efetivamente impedida de apontar o que o check não vê.** Não
por censura explícita, mas por construção: (a) a regra proíbe contradizer as checagens, e dizer "há uma
experiência vazia" contradiz frontalmente "as experiências têm descrições com substância"; (b) o prompt entrega
as experiências como texto corrido numerado (`linkedinAnalyze.ts:103-114`), sem marcar qual está vazia; e (c)
para a `exp[0]` o campo descrição nem parece vazio, ele contém `"SinergyRH Artificial Intelligence Engineer"`,
que é o bug da PARTE B.1. **A IA foi informada de que a experiência tem descrição, e a descrição que ela
recebeu era o cabeçalho da experiência seguinte.**

Este é o achado mais estrutural da rodada: quando a camada determinística erra, a `REGRA DOS FATOS` transforma o
erro em dogma e desliga a única camada que poderia tê-lo pegado. O prompt precisa de uma válvula, algo como
"se o texto do perfil contradisser uma checagem, aponte a divergência em vez de repetir a checagem".

### E.8 Transcrição integral dos 3 outputs

<details>
<summary>RUN 1 (analysisId 08f0b3f3-d154-43b0-a214-db712d46a575)</summary>

**resumo**: Seu perfil está bem estruturado e apresenta uma sólida experiência em desenvolvimento Full-Stack,
com ênfase em inteligência artificial. No entanto, é necessário melhorar a cobertura de palavras-chave e
aumentar o número de competências para atrair mais recrutadores.

**pontosFortes**: Experiência prática em desenvolvimento de sistemas de IA e soluções personalizadas. | Sólido
conhecimento em tecnologias Full-Stack, incluindo React, Node.js e PostgreSQL. | Experiência comprovada em
otimização de processos e melhorias em sistemas existentes. | Capacidade de trabalhar em equipe e colaborar em
projetos multidisciplinares.

**pontosFracos**: Cobertura de palavras-chave da área muito baixa, apenas 27%. | Número de competências
cadastradas insuficiente, apenas 4. | Falta de um convite claro ao contato na seção Sobre. | Atividade recente
no LinkedIn é baixa, o que pode impactar a visibilidade.

**proximoPasso**: Adicione palavras-chave relevantes e competências à sua seção de competências hoje mesmo,
priorizando tecnologias que você já utiliza.

**melhorias**: [alta] Aumentar a cobertura de palavras-chave | [alta] Adicionar mais competências ao perfil |
[media] Reescrever a seção Sobre com convite ao contato | [media] Aumentar a atividade no LinkedIn | [baixa]
Atualizar a headline com mais tecnologias

**headlines**:
1. Full Stack Developer | React, Node.js, PostgreSQL, Docker | AI Solutions Specialist
2. Software Engineer | Full-Stack Developer | JavaScript, TypeScript, Docker | Expert in AI Agents
3. Full Stack Engineer | React, Node.js, PostgreSQL, AI Solutions | Building Intelligent Systems

**sobreReescrito**: I am a Full Stack Developer with over 3 years of experience in Software Development. My
expertise lies in full-stack development, crafting modern user interfaces with React and implementing RESTful
APIs using TypeScript and Node.js. Additionally, I am skilled in backend infrastructure, including
containerization with Docker, database administration with PostgreSQL, and Linux server management. I have
successfully developed and customized Generative AI agents for various clients, enhancing their business
processes. I am proficient in using tools such as Docker, PostgreSQL, Redis, and Linux, contributing to robust
and efficient IT solutions. I invite you to connect with me for potential opportunities in software development
and AI solutions.

**bulletsReescritos**:
- *SinergyRH Artificial Intelligence Engineer*: Built Syni, a production conversational AI agent using Node.js
  and TypeScript, improving HR query efficiency. | Designed a hybrid architecture integrating LLMs and
  deterministic backend logic, ensuring reliable data handling. | Implemented multi-channel delivery for AI
  solutions, enhancing user engagement across platforms.
- *Chatvolt Generative AI Consultant/Support Analyst*: Developed over 20 custom AI agents for various companies,
  improving operational efficiency. | Streamlined technical support processes, significantly enhancing response
  times and client satisfaction. | Delivered end-to-end AI solution support, aligning with strategic business
  goals.
- *Alpha Edtech Software Engineer/QA Engineer*: Developed an end-to-end testing suite using Cypress, ensuring
  high reliability of services. | Implemented a back-end testing strategy with Jest, reducing production bugs
  significantly. | Integrated automated testing in CI/CD pipelines, accelerating the development cycle.

**skillsSugeridas**: Next.js, Tailwind CSS, Express.js, GraphQL, MongoDB, Git, Ruby, Elixir

**modeloMensagemRecrutador**: Hi [Recruiter's Name], I'm a Full Stack Developer with experience in AI solutions
and modern web technologies. I'm currently exploring new opportunities and would love to connect!
</details>

<details>
<summary>RUN 2 (analysisId b0c8a2da-bf9a-4200-816f-14079208d29e)</summary>

**resumo**: Seu perfil está bem estruturado e apresenta uma boa experiência em desenvolvimento de software, com
foco em inteligência artificial e desenvolvimento full-stack. No entanto, há espaço para melhorias,
especialmente na inclusão de mais palavras-chave e competências relevantes para aumentar sua visibilidade para
recrutadores internacionais.

**pontosFortes**: Experiência sólida em desenvolvimento de software com foco em Inteligência Artificial. |
Habilidades técnicas abrangentes em full-stack, incluindo React, Node.js e PostgreSQL. | Contribuições
significativas em projetos de AI, demonstrando impacto e resultados mensuráveis. | Experiência em ambientes de
trabalho ágeis e aplicação de melhores práticas de ITIL V4. | Histórico de sucesso na otimização de processos e
aumento de eficiência em projetos.

**pontosFracos**: Falta de palavras-chave essenciais na seção de competências, impactando a visibilidade. |
Sobre não contém um convite claro para contato, o que pode reduzir conexões. | Experiências e habilidades não
cobrem uma gama ampla de tecnologias-chave da área. | Atividade recente no LinkedIn é baixa, o que pode afetar a
visibilidade do perfil. | Número de competências cadastradas é baixo, limitando a busca por recrutadores.

**proximoPasso**: Atualizar a seção de competências para incluir pelo menos mais 6 tecnologias relevantes que
você conhece e pode adicionar com honestidade.

**melhorias**: [alta] Adicionar mais palavras-chave nas competências | [alta] Incluir um convite claro no Sobre |
[media] Aumentar a atividade no LinkedIn | [media] Expandir a descrição das experiências | [baixa] Melhorar a
headline

**headlines**:
1. Software Developer | Full-Stack Engineer | React, Node.js, PostgreSQL | Focused on AI Solutions
2. Full Stack Engineer | JavaScript, TypeScript, Docker | Building Scalable Applications
3. Software Engineer | Full-Stack Developer | AI Agent Expert, React, Node.js | Passionate about Innovation

**sobreReescrito**: I am a Full-Stack Engineer with over 3 years of experience in Software Development,
specializing in building robust AI solutions. I have profound knowledge in full-stack development, crafting
modern user interfaces with React and implementing RESTful APIs using TypeScript and Node.js. Additionally, I am
skilled in backend infrastructure, including containerization with Docker, database administration with
PostgreSQL and Redis, and Linux server management. My projects include developing and deploying Generative AI
agents that solve specific client challenges, enhancing their business processes. I am capable of using my
strong desire for learning and development to drive projects to successful completion. I invite recruiters and
professionals to connect with me regarding opportunities in full-stack development and AI solutions.

**bulletsReescritos**:
- *SinergyRH Artificial Intelligence Engineer*: Built Syni, a conversational AI agent, improving HR query
  response times by 86%. | Architected a semantic search engine for 3M+ candidate profiles, enhancing search
  efficiency. | Implemented multi-channel delivery for AI solutions, integrating with legacy systems seamlessly.
- *Chatvolt Generative AI Consultant/Support Analyst*: Developed over 20 custom AI agents for 15+ companies,
  streamlining operations. | Enhanced client engagement and decision-making through tailored AI strategies. |
  Provided end-to-end support for AI solutions, ensuring alignment with strategic goals.
- *Alpha Edtech Software Engineer/QA Engineer*: Developed an end-to-end testing suite using Cypress,
  significantly reducing production bugs. | Integrated automated testing in CI/CD pipeline, accelerating
  development cycles. | Collaborated with cross-functional teams to ensure reliability and performance of
  services.

**skillsSugeridas**: Git, MongoDB, Next.js, Tailwind CSS, Express.js, GraphQL, NestJS, Ruby on Rails

**modeloMensagemRecrutador**: Hi [Recruiter's Name], I hope this message finds you well. I am a Full-Stack
Engineer with a strong background in AI solutions and I am currently looking for new opportunities. I would love
to connect and explore potential roles that align with my expertise. Thank you!
</details>

<details>
<summary>RUN 3 (analysisId d00cb5bb-1060-41cc-9d00-17da9fd046e8)</summary>

**resumo**: Seu perfil demonstra uma sólida experiência em desenvolvimento de software, com foco em inteligência
artificial e soluções full-stack. No entanto, há espaço para melhorar a visibilidade e a cobertura de
palavras-chave para atrair mais recrutadores internacionais.

**pontosFortes**: Experiência em desenvolvimento de sistemas de IA e soluções full-stack. | Capacidade
comprovada em construir e implementar agentes de IA personalizados. | Conhecimento em containerização com Docker
e administração de bancos de dados como PostgreSQL. | Experiência em arquitetura de sistemas com foco em
desempenho e escalabilidade. | Habilidades em implementar práticas de ITIL v4 para entrega de serviços de TI.

**pontosFracos**: Cobertura insuficiente de palavras-chave da área de tecnologia. | Falta de convite claro ao
contato na seção Sobre. | Número baixo de competências cadastradas no perfil. | Atividade recente no LinkedIn é
limitada, o que pode impactar a visibilidade. | A headline não menciona tecnologias adicionais relevantes.

**proximoPasso**: Atualize a sua headline para incluir tecnologias relevantes como Next.js e Tailwind CSS.

**melhorias**: [alta] Atualizar a Headline com Tecnologias | [alta] Adicionar Competências Relevantes | [media]
Incluir Convite ao Contato no Sobre | [media] Aumentar Atividade no LinkedIn | [baixa] Expandir a Seção de
Experiências

**headlines**:
1. Full Stack Developer | React, Node.js, PostgreSQL | AI Solutions Expert
2. Full Stack Engineer | JavaScript, TypeScript, Docker | Building Intelligent Systems
3. Software Engineer | AI Agent Developer, React, PostgreSQL | Innovating Solutions

**sobreReescrito**: I am a Full-Stack Developer with over 3 years of experience in software development,
specializing in creating intelligent solutions using modern technologies. I have a strong background in both
front-end and back-end development, crafting user interfaces with React and implementing RESTful APIs using
Node.js and TypeScript. My expertise extends to backend infrastructure, utilizing Docker for containerization,
and managing databases with PostgreSQL and Redis. I have successfully developed and customized Generative AI
agents for various clients, enhancing their business processes and solving specific challenges. I am passionate
about learning and applying best practices in IT service delivery. I invite recruiters to connect with me
regarding opportunities in full-stack development and AI solutions.

**bulletsReescritos**:
- *SinergyRH Artificial Intelligence Engineer*: Built a conversational AI agent that handles HR inquiries,
  improving response accuracy and efficiency. | Designed a hybrid architecture for AI systems, achieving a
  latency reduction of ~86% on common queries. | Architected a semantic search engine over 3M+ candidate
  profiles, enhancing search speed and relevance.
- *Chatvolt Generative AI Consultant/Support Analyst*: Developed over 20 custom AI agents for various clients,
  streamlining operations and enhancing engagement. | Implemented AI solutions in educational institutions,
  significantly improving support processes and response times.
- *Alpha Edtech Software Engineer/QA Engineer*: Developed an end-to-end testing suite using Cypress, ensuring
  high reliability of software releases. | Integrated automated testing into CI/CD pipelines, reducing
  production bugs and accelerating development cycles.

**skillsSugeridas**: Next.js, Tailwind CSS, Express.js, GraphQL, MongoDB, Git, Ruby, Elixir

**modeloMensagemRecrutador**: Hi [Recruiter's Name], I'm a Full-Stack Developer with a strong background in AI
solutions and modern web technologies. I'm currently looking for opportunities to leverage my skills in a
dynamic team. Let's connect!
</details>

---

## PARTE F — Cobertura de palavras-chave

### F.1 A cobertura é do perfil inteiro, e o usuário não tem como saber onde editar

```ts
const skillsText = skillsForm.join(", ");
const fullText   = `${profileText} ${skillsText}`;          // linha 150
const fullCoverage   = matchTechnologies(fullText, keyTechs);
const skillsCoverage = matchTechnologies(skillsText, keyTechs);
const coverageRatio  = fullCoverage.encontradas.length / keyTechs.length;
```
`server/lib/linkedinChecks.ts:148-170`.

Existem exatamente **duas** granularidades: o perfil inteiro (`cobertura-keywords-area` e
`cobertura-keywords-otima`) e as competências coladas (`skills-cobertura`). Não há cobertura por headline, por
Sobre ou por experiência.

Portanto, à pergunta do usuário "adicionar **onde**?": **a ferramenta não sabe responder, porque ela não
calculou por campo.** O número "27%" é uma propriedade do documento inteiro. A UI mostra a lista de faltantes
no `RecruiterFinder` (`client/src/components/linkedin/RecruiterFinder.tsx:61-82`) sem nenhum destino, e o hint
do catálogo diz apenas "Pelo menos metade das tecnologias-chave da área no perfil"
(`shared/linkedin/schema.ts:281`). A reclamação é procedente e é uma lacuna de desenho, não um bug.

### F.2a `JavaScript` contado sem existir: confirmado, e há outros

Medido: `/javascript/i.test(textoDoPDF) === false`, e mesmo assim `JavaScript` aparece em
`keywordsEncontradas`.

Causa: `ALIAS_GROUPS` (`server/lib/skillNormalize.ts:26-46`) declara `["js", "javascript"]`, e `containsTerm`
(`:72-81`) usa:

```ts
const re = new RegExp(`(?<![a-z0-9])${escapeRegExp(termNormalized)}(?![a-z0-9#+])`);
```

O lookbehind bloqueia letra ou dígito antes do termo, mas **`.` não é nem letra nem dígito**. Em `"node.js"` o
caractere antes de `js` é `.`, então o alias casa. Verificado:
`containsTerm(normalize("Node.js e React"), "js") === true`.

**Todo perfil que menciona Node.js, Next.js, Vue.js, Three.js ou qualquer `*.js` é creditado com JavaScript**,
tenha ou não escrito a palavra.

Varri os aliases atrás de outros falsos positivos, testando contra prosa comum em inglês
(`"we go to market next month. the node of the graph. i will go now. next steps are clear."`):

| Alias | Tecnologia creditada | Casa em prosa comum? |
|---|---|---|
| `go` | **Go** | **SIM** ("go to market", "i will go") |
| `next` | **Next.js** | **SIM** ("next month", "next steps") |
| `node` | **Node.js** | **SIM** ("the node of the graph") |
| `js` | JavaScript | não isoladamente, mas casa dentro de `*.js` |
| `.net` | .NET | não nesse texto |
| `vue` | Vue.js | não |

Ou seja, **três aliases são palavras inglesas comuns**. Um perfil em inglês que diga "next steps" ganha Next.js
de presente. Como a cobertura é o check essencial mais pesado, isso é ruído direto na nota, e ruído que sempre
**infla**.

### F.2b Tecnologias reais do perfil que a régua ignora

| Tecnologia | Escrita no PDF? | Contada em `fullstack`? | Está no `TECH_AREA_MAP` de `fullstack`? | de `ia`? |
|---|---|---|---|---|
| Redis | sim | **não** | não | não |
| Linux | sim | **não** | não | não |
| Cypress | sim | **não** | não | não |
| Jest | sim | **não** | não | não |
| Qdrant | sim | **não** | não | não |
| PHP | sim | **não** | não | não |
| Excel | sim | **não** | não | não |
| JavaScript | **não** | **sim** | sim | não |
| TypeScript, React, Node.js, PostgreSQL, Docker | sim | sim | sim | não |

Sete tecnologias reais do perfil não contam para nada, e uma que não existe conta. O caso do **Qdrant** é o mais
eloquente: é uma vector database, a pessoa se apresenta como especialista em Vector Databases, e a régua da
área `ia` **não conhece Qdrant** (nem Redis, nem Linux). A régua de `ia` tem 15 tecnologias e o perfil casou
com **1**.

### F.3 A mesma análise na área `ia`: **72, exatamente igual**

Você perguntou quanto daria em `ia`. Rodei todas as áreas plausíveis com o mesmo perfil e o mesmo mercado:

| Área | Score | Faixa | techs na régua | cobertura | skills-cobertura |
|---|---|---|---|---|---|
| fullstack | **72** | forte | 22 | 27% | 0% |
| **ia** | **72** | forte | 15 | **7%** | 0% |
| frontend | **72** | forte | 33 | 24% | 0% |
| backend | **72** | forte | 64 | 13% | 0% |
| dados | 64 | em-construção | 35 | 6% | 0% |
| analise-sistemas | 64 | em-construção | 3 | 0% | 0% |
| gestao | 64 | em-construção | 5 | 0% | 0% |

**Escolher a área "certa" não muda absolutamente nada: 72 nas quatro áreas de desenvolvimento**, apesar de a
cobertura variar de 7% a 27%. A razão é que os três checks de cobertura reprovam em todas elas, então a
diferença de percentual é invisível para a nota. O que separa 72 de 64 não é a cobertura, é
`headline-cargo-alvo` e `cargo-em-experiencia` casarem ou não.

Isso **refuta** a intuição implícita na sua pergunta (de que a área errada estaria custando pontos) e reforça o
achado #1 da rodada 1: os checks de cobertura não discriminam nada, eles só subtraem.

### F.4 Crédito cruzado, sugestão de área, multi-área

**Nenhum dos três existe.** `keyTechnologiesForArea` (`server/lib/skillNormalize.ts:97-99`) filtra o
`TECH_AREA_MAP` pela área única escolhida; não há peso parcial para tecnologia de área vizinha, não há
`suggestedArea` no `LinkedinDeterministicResult` (`shared/linkedin/schema.ts:439-453`), e o request aceita uma
`area` só (`:552`).

**A escolha de área muda a nota mais que a de mercado?** Comparação medida, no mesmo perfil real:

- variação por **área** (entre as 7 testadas): 64 a 72 = **8 pontos**
- variação por **mercado** (fullstack, os 3 mercados): 67, 72, 74 = **7 pontos**

São da mesma ordem. As duas escolhas de dropdown juntas movem cerca de 10 pontos, o que é maior que a diferença
entre muitas melhorias reais no perfil.

### F.5 `skillsSugeridas` é uma fatia crua da lista de faltantes: confirmado

```
faltantes(fullstack) = ["Next.js","Tailwind CSS","Express.js","GraphQL","MongoDB","Git","Ruby","Elixir",
                        "Nuxt","NestJS","Laravel","Ruby on Rails","ASP.NET Core","Phoenix","Firebase","Supabase"]
skillsSugeridas run 1 = ["Next.js","Tailwind CSS","Express.js","GraphQL","MongoDB","Git","Ruby","Elixir"]
```

São **os 8 primeiros itens, na mesma ordem**. Run 3 idêntica. A ferramenta recomenda **Ruby** e **Elixir** a um
desenvolvedor JavaScript/TypeScript especializado em IA, porque essas duas linguagens estão no
`TECH_AREA_MAP` de `fullstack` e ele não as citou.

**É aceitável num produto pago?** Na minha leitura, não, por três razões concretas: (1) contradiz o próprio
system prompt, que manda propor "apenas o que é plausível a partir do que o perfil já evidencia"
(`server/lib/linkedinAnalyze.ts:54`); (2) a UI apresenta esse bloco sob o rótulo "pronto para colar" com um
`CopyButton` que copia tudo de uma vez (`LinkedinAnalisar.tsx:1713-1741`), então a ação padrão é colar
literalmente no LinkedIn; e (3) a única salvaguarda é uma frase de rodapé ("Adicione só o que você realmente
sabe"), que pede ao usuário para filtrar uma lista que a ferramenta deveria ter filtrado.

E é evitável: o `gpt-4o`, com o **mesmo prompt**, produziu a lista certa (as tecnologias que o perfil comprova e
que faltam nas Competências). Ou seja, o dado necessário está no prompt; falta a instrução.

### F.6 Desenho proposto: cobertura por campo com destino explícito

Substituir "27% de cobertura" por uma matriz **tecnologia x campo**, que é o que o usuário precisa para agir:

```ts
interface KeywordPlacement {
  termo: string;                                    // "Next.js"
  presenteEm: ("headline" | "sobre" | "experiencias" | "skills")[];
  destinoSugerido: "headline" | "sobre" | "experiencias" | "skills";
  evidenciaNoPerfil: string | null;                 // trecho que comprova, ou null
}
```

Regras, todas deriváveis do que já existe:

1. Rodar `matchTechnologies` **quatro vezes**, uma por campo, em vez de uma vez no blob. O custo é
   desprezível (funções puras, texto pequeno).
2. Um termo com `evidenciaNoPerfil !== null` (aparece em alguma experiência mas não nas Competências) vira
   **"adicione às Competências"**, que é acionável e honesto. Foi exatamente o que o `gpt-4o` fez sozinho.
3. Um termo sem nenhuma evidência **não é sugerido**, ou é claramente rotulado como "lacuna de aprendizado",
   nunca como "adicione ao perfil".
4. A UI do `RecruiterFinder` passa a agrupar por destino: "Faltando na headline (2)", "Faltando nas
   Competências (6)", cada chip com o texto pronto do campo correspondente já disponível ao lado.

Ganho colateral relevante: isso **conserta a PARTE E.6 sem trocar de modelo**, porque a lista injetada no prompt
deixa de ser "faltantes" cru e passa a ser "faltantes com evidência" e "lacunas sem evidência", separadas.

---

## PARTE G — "Resolver agora" e a camada de destino

### G.1 Deep links testados

Testei sete URLs candidatas com `curl` (logged out). **Aviso metodológico importante e limitante: sem sessão
autenticada não é possível verificar em que tela o usuário logado realmente cai.** O LinkedIn resolve boa parte
da navegação no cliente, então o comportamento deslogado é uma evidência parcial, não uma prova.

| URL | Status | Redirect observado |
|---|---|---|
| `https://www.linkedin.com/in/me` | 302 | `.../uas/login?session_redirect=https%3A%2F%2Fwww.linkedin.com%2Fin%2Fme` |
| `https://www.linkedin.com/in/me/edit/intro/` | 301 | `https://www.linkedin.com/in/me` |
| `https://www.linkedin.com/in/me/details/experience/` | 301 | `https://www.linkedin.com/in/me` |
| `https://www.linkedin.com/in/me/details/skills/` | 999 | (bloqueio anti-bot) |
| `https://www.linkedin.com/in/me/add-edit/POSITION/` | 999 | (bloqueio anti-bot) |
| `https://www.linkedin.com/in/me/add-edit/SKILL_AND_ASSOCIATION/` | 301 | `https://www.linkedin.com/in/me` |
| `https://www.linkedin.com/jobs/opportunities/job-opportunities/onboard/` | **404** | — |

Leitura honesta: só o `/in/me` produz um redirect de login que **preserva o destino** (`session_redirect`), o
que é a assinatura de uma rota estável. As sub-rotas de seção ou voltam com 301 para `/in/me` (o servidor
descarta o sub-caminho) ou são bloqueadas com 999. A rota de Open to Work que eu testei responde 404.

**Conclusão: não consegui verificar nenhum deep link de seção que funcione, e não vou inventar nenhum.** O
comentário do código (`shared/linkedin/checkLinks.ts:1-13`) afirma exatamente isso, que o LinkedIn não documenta
URLs estáveis de edição por seção, e a evidência que levantei é consistente com essa afirmação. **A rodada 1
chamou a implementação de "honestamente limitada" e eu mantenho o veredito**: dado o que é verificável, `/in/me`
ou `null` é a escolha certa. `NÃO VERIFICADO`: o comportamento das sub-rotas com sessão ativa.

### G.2 O botão deve existir?

Do ponto de vista do usuário você está certo: um botão chamado "Resolver agora" que abre a home do perfil não
resolve nada, e a promessa do rótulo é maior que a entrega. Mas a resposta não é remover o botão, é **parar de
prometer o que ele não faz**. Proposta, em ordem de preferência:

1. **Trocar o rótulo pela ação real.** "Resolver agora" vira **"Abrir meu perfil"**, com o hint do catálogo
   (que já existe, `shared/linkedin/schema.ts:150-363`, e já é renderizado em `SectionReport.tsx:149-157`)
   promovido a instrução numerada de onde clicar dentro do LinkedIn. O usuário sai do card sabendo o caminho.
2. **Anexar o texto pronto ao botão.** Para os checks que têm reescrita correspondente (headline, Sobre), o
   botão útil é "Copiar o texto novo e abrir o perfil", uma ação composta em vez de um link solto.
3. **Manter `null` onde é `null`.** `conexoes` e `atividade` já não têm botão, o que está certo.

Custo: é copy e um `CopyButton` reaproveitado. Menos de uma hora.

### G.3 Inventário dos blocos "pronto para colar": nenhum diz somar ou substituir

Levantei os cinco blocos que a UI apresenta como texto pronto:

| Bloco | Onde | Rótulo que o usuário lê | Diz o destino? | Diz a operação? |
|---|---|---|---|---|
| 3 headlines | `LinkedinAnalisar.tsx:1517-1533` | "pronto para colar" | implícito (card "Headline") | **não**. São 3 opções: escolher uma? juntar? |
| Sobre reescrito | `:1563-1574` | "pronto para colar" | implícito (card "Sobre") | **não**. Substitui o Sobre inteiro, mas nada avisa |
| Bullets por experiência | `:1635-1670` | "pronto para colar" ou **"Quer deixar ainda melhor?"** | o `contexto` nomeia a experiência | **não**. Substitui a descrição? acrescenta aos bullets? |
| Competências sugeridas | `:1713-1741` | "pronto para colar" | implícito | tem ressalva de honestidade, mas não diz que é **acrescentar** |
| Mensagem para recrutador | `:1800-1813` | "pronto para colar" | nenhum campo do perfil | é para enviar, não colar no perfil, e isso não é dito |

O rótulo `"pronto para colar"` é único e genérico (`SectionReport.tsx:191-196`), e o modo recolhido usa
`"Quer deixar ainda melhor?"` (`:199-205`), que é ainda mais vago. Sua observação sobre os bullets vale para
todos os cinco: **em nenhum lugar da UI existe a palavra "substituir" ou "adicionar".**

Correção barata: um subtítulo por bloco, no molde `Destino: seção Sobre do LinkedIn · Substitui o texto atual`
ou `Destino: Competências · Adiciona aos itens existentes`. É copy estruturada, cabe no `SectionReport` como uma
prop `destino: { campo: string; operacao: "substituir" | "adicionar" | "enviar" }`.

---

## PARTE H — Projetos e cursos

### H.1 Componente, fonte e pool

`client/src/components/shared/NextStepsByArea.tsx` (161 linhas), consumido em `LinkedinAnalisar.tsx:1818` com
**uma única prop**: `area={result.area}`.

Fonte: catálogo estático `client/src/lib/data.ts` (`cursosGratuitos` e `projetos`), com um comentário no
arquivo explicando que a API foi abandonada porque o `/api/content/courses` serve só amostra ao free
(`NextStepsByArea.tsx:34-37`).

**Pool real, medida:** 521 cursos e 320 projetos no total. Para `fullstack`: **18 cursos e 24 projetos**.

Campos disponíveis por item:

```
curso:   id, certificate, titulo, canal, plataforma, link, areaSlug, nivel, duracao,
         idioma, descricao, motivoIndicacao, oQueAprende, proximoConteudo
projeto: id, nome, areaSlug, nivel, objetivo, ferramentas, passosSimplificados,
         entregavel, comoPublicar, sugestaoLinkedIn, proximoProjeto
```

Ou seja: **`nivel` existe nos dois, e `ferramentas` existe nos projetos.** Os dois sinais que faltam na
recomendação já estão no dado.

### H.2 Critério de seleção hoje: área, e nada mais

```ts
const MAX_ITEMS = 3;
projetos.filter((p) => p.areaSlug === area && (p.pro !== true || isPro)).slice(0, MAX_ITEMS)
cursosGratuitos.filter((c) => c.areaSlug === area).slice(0, MAX_ITEMS)
```
`NextStepsByArea.tsx:17, 26-32, 38-50`.

Filtra por área (e por Pro nos projetos) e pega **os 3 primeiros na ordem do array**. Sem ordenação, sem
aleatoriedade, sem estado. **Determinístico e idêntico para todo mundo da mesma área, para sempre.**

Reproduzi exatamente a sua reclamação:

```
area=fullstack, 3 CURSOS entregues:
   [Iniciante] Rocketseat One (Rocketseat)
   [Iniciante] curso.dev (Filipe Deschamps)
   [Iniciante] CS50x: Introdução à Ciência da Computação (Harvard / CS50)

area=fullstack, 3 PROJETOS entregues:
   [Avançado] App Full Stack de Estudos
   [Avançado] Checkout fictício com carrinho
   [Avançado] Mini-SaaS com Next.js, auth e Stripe (modo teste)
```

Três cursos **Iniciante** para um perfil Pleno, três projetos **Avançado** ao mesmo tempo, e **CS50x da Harvard
para alguém que tem "Harvard University, Computer Science" na Education do PDF que a ferramenta acabou de ler**.
Tudo confirmado, tudo pelo mesmo motivo: `.slice(0, 3)`.

Detalhe que agrava: a pool de `fullstack` tem **11 cursos Iniciante e 7 Intermediário** (e zero Avançado). Os 3
Intermediários mais óbvios (The Odin Project: Full Stack, Full Stack Open, CS50 Web Programming) existem e
**nunca aparecem**, porque estão depois na ordem do array.

### H.3 Tudo que a análise já calculou e a recomendação ignora

Passa **só** `area`. É ignorado:

| Sinal disponível | Onde já existe | Ignorado |
|---|---|---|
| `level` (estágio a pleno) | `result.level` | sim |
| `mercado` | `result.mercado` | sim |
| `objetivo` (texto livre) | `request.objetivo` | sim |
| `keywordsFaltantes` (16 itens) | `result.deterministic.keywordsFaltantes` | sim |
| `keywordsEncontradas` | idem | sim |
| checks reprovados | `result.deterministic.checks` | sim |
| seção mais fraca (veredito por card) | derivável de `deriveSectionVerdict` | sim |
| formação e certificações do PDF | seções `formacao` e `certificacoes` **são parseadas** (`parse.ts:49-81`) mas descartadas: `LinkedinParsed` não as expõe (`:20-28`) | sim |
| senioridade real das experiências | inferível das datas | sim |
| `nivel` do próprio curso/projeto | campo do catálogo | **sim** |
| `ferramentas` do projeto | campo do catálogo | **sim** |

Vale destacar o caso da formação: o parser **reconhece** o cabeçalho `Education` e o usa como fronteira de
seção, mas `parseLinkedinText` nunca devolve o conteúdo. A informação "essa pessoa já estudou em Harvard" passou
pelo parser e foi jogada fora, e três linhas depois a ferramenta recomenda o curso introdutório de Harvard.

### H.4 Algoritmo de ranqueamento proposto, e o que ele devolveria

Proposta de score por item, tudo com dado que já existe:

```
score(item) =
    3,0 * casaNivel(item.nivel, level)              // pleno -> Intermediário/Avançado
  + 2,5 * fracaoDeFerramentasFaltantes(item)        // projetos: interseção com keywordsFaltantes COM evidência
  + 2,0 * enderecaCheckReprovado(item)              // ex.: sem exp-resultados -> projeto com entregável medível
  + 1,0 * casaObjetivo(item, objetivo)              // match textual simples
  - 5,0 * jaPossui(item)                            // dedup contra formação/certificações do perfil
  - 1,0 * jaRecomendadoNaAnaliseAnterior(item)      // rotação entre reanálises
```

`casaNivel` para nível pleno: Intermediário 1,0; Avançado 0,7; Iniciante 0,0.

**Aplicado ao perfil de fixture** (fullstack, pleno, faltando Next.js, Tailwind, Express, GraphQL, MongoDB, Git;
Harvard na formação):

| | A ferramenta devolveu | O algoritmo devolveria |
|---|---|---|
| Curso 1 | Rocketseat One `[Iniciante]` | The Odin Project: Full Stack `[Intermediário]` |
| Curso 2 | curso.dev `[Iniciante]` | Full Stack Open `[Intermediário]` |
| Curso 3 | **CS50x da Harvard** `[Iniciante]` | CS50 Web Programming com Python e JavaScript `[Intermediário]` (ou o próximo Intermediário, se a dedup por instituição também pesar) |
| Projeto 1 | App Full Stack de Estudos `[Avançado]` React, Node.js, PostgreSQL | **Plataforma EAD Acadêmica** `[Intermediário]` Next.js, TypeScript, **Tailwind CSS**, Supabase |
| Projeto 2 | Checkout fictício `[Avançado]` | **Mini-SaaS com Next.js, auth e Stripe** `[Avançado]` **Next.js**, Auth, Stripe, PostgreSQL |
| Projeto 3 | Mini-SaaS com Next.js `[Avançado]` | **Encurtador de Links** `[Intermediário]` Node.js, **Express**, banco |

A diferença não é cosmética: os três projetos escolhidos pelo algoritmo cobrem **Next.js, Tailwind CSS e
Express.js**, que são literalmente três das seis lacunas com evidência que a mesma análise apontou. A pool já
tem o que resolver o problema que a própria ferramenta diagnosticou; ela só não conecta as duas pontas.

### H.5 Deduplicação e variação: nenhuma das duas existe

- **Contra formação e certificações**: impossível hoje, o componente só recebe `area` (`:19`) e o parser
  descarta as seções (H.3).
- **Contra cursos concluídos na plataforma**: não há consulta a progresso; o componente é síncrono e puro sobre
  o catálogo estático.
- **Entre análises repetidas**: `.slice(0, 3)` sobre um array estático **sempre devolve os mesmos 3**. Reanalisar
  dez vezes mostra a mesma lista dez vezes. Zero rotação.

### H.6 Já existe recomendação personalizada no projeto? Sim, e é reaproveitável

`server/lib/careerPlan/generate.ts` implementa exatamente o padrão que falta aqui: monta um bloco de **"ITENS
CITÁVEIS"** a partir do catálogo, com id, nome, provedor, **nível**, preço e pré-requisitos
(`:167-176`), e impõe no system prompt que qualquer item citado venha **por `catalogId` dessa lista**, proibindo
invenção (`:187`):

> "REGRA DOS ITENS CITÁVEIS (crítica): você vai receber a lista ITENS CITÁVEIS com ids do catálogo. Qualquer
> certificação ou curso pago citado DEVE entrar apenas por catalogId dessa lista [...] NUNCA invente id, nome,
> sigla ou provedor de certificação fora da lista."

É recomendação ancorada em catálogo, com nível e pré-requisito, resistente a alucinação. **Sim, é código
duplicado esperando para acontecer**: o analisador de LinkedIn precisa exatamente disso e hoje resolve com
`.slice(0, 3)`.

Duas formas de reaproveitar, com trade-off diferente:

- **Barata e determinística**: extrair só o *ranqueador* (a função de score da H.4) para
  `shared/recommendation/` e usar nos dois lugares. Sem IA, sem custo, sem latência. É o que eu faria primeiro.
- **Cara e mais rica**: fazer o analisador passar a lista citável no próprio prompt e deixar a IA escolher e
  justificar ("este projeto porque você não tem métricas nas experiências"). Custa tokens, adiciona um vetor de
  alucinação a mais e depende de o `bulletsReescritos` já estar disputando o mesmo orçamento de saída.

---

## PARTE I — Plano de correção

### I.1 Método de priorização

`Prioridade = (dano × frequência × 100) ÷ esforço_em_horas`, com **dano** de 1 a 5 (5 = o usuário perde
resultado pago ou recebe informação falsa que o leva a piorar o perfil) e **frequência** = fração estimada de
análises afetadas. Frequências são estimativas minhas salvo quando marcadas como medidas.

### I.2 Fase 0 — sangramento

| # | Item | Dano | Freq | Esforço | Prioridade | Muda nota? |
|---|---|---|---|---|---|---|
| 0.1 | Aplicar a migration `linkedin_improvement_progress` (PARTE A) | 4 | **1,0** (medida) | 0,25h | **1600** | não |
| 0.2 | Logar `error.message` do Supabase nas 2 rotas de progresso (`linkedin.ts:326-334, 390-394`) | 3 | 1,0 | 0,1h | **3000** | não |
| 0.3 | Tirar `listLinkedinAnalyses()` de dentro do `try` do analyze (rodada 1 #3, `LinkedinAnalisar.tsx:766-770`) | 5 | 0,02 | 0,25h | 40 | não |
| 0.4 | `catch` no `openHistory` (rodada 1 #11) | 2 | 0,02 | 0,25h | 16 | não |

Dependências: 0.1 é a única com dependência externa (acesso ao banco) e é **decisão sua**, ver PARTE J. 0.2 é
pré-requisito prático de qualquer diagnóstico futuro e deveria ir junto com 0.1 no mesmo commit.
Risco de regressão: nulo em 0.2 e 0.4; baixo em 0.3.

### I.3 Fase 1 — verdade da análise

| # | Item | Dano | Freq | Esforço | Prioridade | Muda nota? |
|---|---|---|---|---|---|---|
| 1.1 | Aliases `go`, `next`, `node`, `js` gerando falso positivo (F.2a) | 2 | 0,9 | 1h | **180** | **sim, para baixo** |
| 1.2 | `termos-bilingues`: alinhar com o prompt e rebaixar em `ambos` (C.5) | 3 | 0,5 | 0,5h | **300** | **sim, para cima** |
| 1.3 | Headline truncada por line-wrap (B.7): juntar linhas contíguas antes de escolher a headline | 3 | 0,4 | 1,5h | **80** | **sim, para cima** |
| 1.4 | Line-wrap nas competências (B.7): juntar linha continuada em `parseSkills` | 2 | 0,3 | 0,5h | **120** | sim, marginal |
| 1.5 | Delimitar o conteúdo do usuário no prompt + instrução anti-invenção de stack (E.2) | 4 | 0,5 | 1h | **200** | não |
| 1.6 | Separar `keywordsFaltantes` em "com evidência" e "sem evidência" antes de injetar no prompt (E.6, F.6) | 4 | 1,0 | 2h | **200** | não |
| 1.7 | Filtrar ruído de paginação **antes** do parse (B.8) | 2 | 0,6 | 1h | **120** | sim, marginal |
| 1.8 | Truncamento das experiências: cortar por item inteiro e priorizar as recentes (E.5) | 3 | 0,3 | 1,5h | **60** | não |
| 1.9 | Empresa colada no cargo e formato agrupado (B.2, B.4) | 3 | 0,7 | 4h | **52** | sim, marginal |
| 1.10 | Descrição vazia engolindo o cabeçalho seguinte (B.1) | 4 | 0,4 | 3h | **53** | **sim** |
| 1.11 | Checks de experiência por item (PARTE D) | 4 | 0,5 | 12h | **17** | **sim, para baixo** |
| 1.12 | Válvula na `REGRA DOS FATOS` para divergência check x texto (E.7) | 3 | 0,3 | 0,5h | **180** | não |
| 1.13 | Plural em `clicheHeadline` (E.4) | 1 | 0,3 | 0,25h | **120** | sim, marginal |

Dependências: 1.10 e 1.9 mexem na mesma função (`parseExperiencias`) e devem ir juntas. 1.11 depende de 1.10
(sem descrição vazia detectável, o check por item não tem o que detectar). 1.6 habilita boa parte da Fase 2.
Risco de regressão: **alto em 1.9/1.10/1.11** (é o coração do parser e do score, sem nenhum teste hoje) —
por isso a Fase 4 tem os golden files, e eu os moveria para antes de tocar no parser.

### I.4 Fase 2 — destino

| # | Item | Dano | Freq | Esforço | Prioridade | Muda nota? |
|---|---|---|---|---|---|---|
| 2.1 | Copy de destino e operação nos 5 blocos "pronto para colar" (G.3) | 2 | 1,0 | 1h | **200** | não |
| 2.2 | "Resolver agora" vira "Abrir meu perfil" + instrução (G.2) | 2 | 1,0 | 1h | **200** | não |
| 2.3 | Ranqueador de projetos e cursos por nível, ferramentas e lacunas (H.4) | 3 | 1,0 | 6h | **50** | não |
| 2.4 | Dedup contra formação e certificações: expor `formacao`/`certificacoes` no `LinkedinParsed` (H.3) | 2 | 0,3 | 3h | **20** | não |
| 2.5 | Cobertura por campo com destino explícito (F.6) | 3 | 1,0 | 12h | **25** | não (só apresentação) |

Dependências: 2.5 depende de 1.6. 2.3 é independente e é a maior entrega de valor percebido por hora da fase.
Risco de regressão: baixo em tudo, exceto 2.4 que mexe no contrato do `LinkedinParsed`.

### I.5 Fase 3 — calibragem e teto de nota

| # | Item | Dano | Freq | Esforço | Prioridade | Muda nota? |
|---|---|---|---|---|---|---|
| 3.1 | Recalibrar os 3 checks de cobertura (rodada 1 #1, confirmado em F.3) | 4 | **1,0** (medida) | 6h | **67** | **sim, muito** |
| 3.2 | `level` afetar a régua (rodada 1 #7) | 3 | 1,0 | 6h | **50** | **sim** |
| 3.3 | Sinais autodeclarados: separar visualmente e/ou reduzir peso (rodada 1 #20) | 2 | 1,0 | 3h | **67** | **sim** |
| 3.4 | Uma nota ou duas (Perfil vs Encontrabilidade) | 4 | 1,0 | 16h | **25** | **sim, redefine tudo** |

Dependências: 3.1 e 3.4 são a mesma discussão; fazer 3.1 sozinho e depois 3.4 significa recalibrar duas vezes e
quebrar a comparabilidade do histórico duas vezes. **Se a resposta a 3.4 for "duas notas", pule 3.1 e faça
direto.**

### I.6 Fase 4 — infraestrutura

| # | Item | Dano usuário | Freq | Esforço | Prioridade | Observação |
|---|---|---|---|---|---|---|
| 4.1 | Golden files do determinismo (rodada 1 #21) | 0 direto | — | 6h | — | **pré-requisito das Fases 1.9 a 1.11**; sem isso o refactor do parser é cego |
| 4.2 | `costEstimate` no `logAiUsage` (rodada 1 #9) | 0 | 1,0 | 0,25h | — | e **corrigir as constantes**: medi US$ 0,0012 real contra US$ 0,0077+ estimado |
| 4.3 | TOCTOU do rate limit (rodada 1 #2) | 0 | ~0,01 | 3h | — | risco de custo, não de usuário |
| 4.4 | Métrica de qualidade: nota média por área, taxa de 422, taxa de `headline: null` | 0 direto | — | 6h | — | é o que teria detectado o bug da headline truncada |

### I.7 Ordem recomendada, condensada

```
0.2 -> 0.1 -> 0.3 -> 0.4          (uma tarde, elimina o sangramento)
4.1                               (rede de segurança antes de tocar no parser)
1.2 -> 1.1 -> 1.5 -> 1.6 -> 1.12 -> 1.13   (barato, alto impacto, sem tocar no parser)
1.3 -> 1.4 -> 1.7                 (line-wrap e ruído: parser, mas cirúrgico)
1.8                               (truncamento do prompt)
1.9 + 1.10 -> 1.11                (cirurgia grande no parser e nos checks)
2.1 -> 2.2 -> 2.3                 (destino e recomendação)
[decisão de produto] -> 3.x       (calibragem)
2.4 -> 2.5 -> 4.2 -> 4.3 -> 4.4
```

### I.8 O que eu preciso que você decida antes, e o que eu faço sozinho

**Decisões suas (produto ou risco em produção):**

1. **Aplicar a migration** (0.1): é escrita em banco de produção. Ver PARTE J.
2. **Recalibrar a cobertura** (3.1) e **uma nota ou duas** (3.4): mudam a nota de todo mundo e quebram a
   comparabilidade com as 107 análises persistidas. Junto: migrar recalculando, versionar o algoritmo no
   `result`, ou aceitar a descontinuidade.
3. **Checks por item** (1.11): vai **derrubar** notas, principalmente de quem tem muitas experiências rasas. É a
   correção certa e é impopular.
4. **`level` na régua** (3.2): decidir se a ferramenta é mais dura ou mais leve com estagiário.
5. **Trocar de modelo**: `gpt-4o` custa 18x (US$ 0,022 contra US$ 0,0012) e entrega bullets mais fiéis e
   `skillsSugeridas` correta. Mas 1.6 provavelmente compra a maior parte desse ganho por prompt, de graça.
   Minha recomendação: **fazer 1.6 primeiro e só reavaliar o modelo depois**, com medição.
6. **Peso dos sinais autodeclarados** (3.3).

**O que eu executo sem perguntar** (nenhum muda nota nem contrato persistido): 0.2, 0.3, 0.4, 1.1, 1.5, 1.12,
1.13, 2.1, 2.2, 4.1, 4.2, 4.3, 4.4. E 1.2, 1.3, 1.4, 1.7, 1.8 se você aceitar de antemão que a nota se move
alguns pontos para cima em perfis afetados por bug de parser, o que é a nota **corrigindo um erro**, não uma
recalibragem de critério.

---

## PARTE J — Autorização de escrita: **não acionada**, e por quê

A autorização era condicional: corrigir apenas se a causa raiz fosse "trivial e localizada (menos de 20 linhas,
sem mudança de schema, sem migration, sem decisão de produto)".

**A causa raiz é exatamente uma migration não aplicada.** Bate na cláusula de exclusão literal, e nas outras
duas por consequência: mexe em schema e o caminho de conserto envolve escrever no banco de produção. Portanto
**não modifiquei nenhum arquivo**. As opções, para você escolher:

### Opção A — aplicar a migration (a correção real)

```bash
pnpm db:push            # aplica supabase/migrations/20260710120000_create_linkedin_improvement_progress.sql
```

Ou, colando no SQL Editor do Supabase, o conteúdo do arquivo (que cria a tabela, habilita RLS e cria a policy de
select próprio). Depois, o smoke test:

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  "$VITE_SUPABASE_URL/rest/v1/linkedin_improvement_progress?select=*&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
# esperado: 200
```

- **Prós**: conserta os dois bugs de uma vez, sem tocar em código; a feature passa a existir; o código já está
  em produção e é tolerante (a tabela nova não quebra nada que já roda).
- **Contras**: é escrita em produção, e `pnpm db:push` aplica **tudo** que estiver pendente. Como eu verifiquei
  que **só** essa tabela falta entre as 38 declaradas, o risco é baixo, mas `db:push` também aplica alterações
  que não criam tabela (policies, funções, índices) que eu **não** auditei uma a uma. Se quiser risco mínimo,
  rode só o SQL desse arquivo no SQL Editor.
- **Por que é decisão sua**: `CLAUDE.md` classifica migration como mudança que exige validação manual, e a regra
  de deploy do projeto trata a ordem migration/código como assunto de operação, não de código.

### Opção B — degradar com elegância no código, sem tabela

Fazer o `GET` responder `{ applied: [] }` e um flag `progressAvailable: false` quando o erro for "tabela
ausente", e a UI esconder o checklist em vez de mostrar banner vermelho.

- **Prós**: elimina o banner de erro sem tocar no banco.
- **Contras**: **remove silenciosamente uma feature paga** e mascara permanentemente o mesmo tipo de falha no
  futuro. É decisão de produto ("o checklist deixa de existir?"), o que a sua própria cláusula exclui.

### Opção C — A e B juntas

Aplicar a migration e, em cima, deixar a degradação como rede de segurança para o dia em que outra migration for
esquecida. Junto com o item 0.2 (logar a causa), é o que eu recomendo.

**Minha recomendação: Opção A agora, pelo SQL Editor (não pelo `db:push`), mais o item 0.2 no mesmo commit.**
Diga qual você quer e eu executo a parte de código.

---

## Anexo — Correções formais à rodada 1

| Rodada 1 | Status após a rodada 2 |
|---|---|
| Achado #5, "nome e headline lidos como competências" | **REFUTADO** no layout real do export. `Languages` fecha a seção de skills antes do nome. O bug real é line-wrap (`(RAG)` virando item separado) |
| "Feedback genérico / intercambiável entre perfis" (risco levantado, não verificado) | **REFUTADO**. O conteúdo é específico do perfil. O que se repete é o esqueleto e a recomendação de palavras-chave, esta última causada pelo achado #1 |
| Custo por análise US$ 0,0077 a US$ 0,0162 | **CORRIGIDO**: US$ 0,00122 medido. As constantes de `aiTools.ts:34-35` superestimam ~5,7x |
| Latência estimada 15 a 40s | **CORRIGIDO**: 10 a 12s medidos |
| Achado #10, "truncamento por `max_tokens` é plausível" | **NÃO se confirmou neste perfil**: `finish_reason=stop`. O código continua sem ler `finish_reason`, o achado segue válido como risco |
| Achado #4, `profileText > 12.000` vira 400 | Segue válido e **agora é mensurável**: o PDF real tem 7.584 caracteres, ou 63% do teto, com 5 páginas. Um perfil de 8 páginas estoura |
| "`< 18` corta a localização" (previsão) | **CONFIRMADO** contra o arquivo real: `"Campinas, São Paulo, Brazil"` (27) passa e entra na descrição |
| Achado #1, checks de cobertura inatingíveis | **REFORÇADO**: em 7 áreas testadas com um perfil real e forte, a cobertura variou de 0% a 27% e **nunca** aprovou |
