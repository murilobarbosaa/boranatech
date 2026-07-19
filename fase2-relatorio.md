# Fase 2 — Inserção de cursos e consolidação do catálogo

**Data:** 2026-07-19 · **Arquivos tocados:** `client/src/lib/data.ts`, `client/src/pages/Cursos.tsx`
**Verificação:** `pnpm check` ✅ · regressão de render ✅ (0 cards legados alterados)

Catálogo: **457 → 477 cursos** (−4 duplicados removidos, +24 novos).

---

## 1. Duplicados de CS50 (decisão 1: pular os 3 e consolidar os existentes)

**Não inseri** CS50x, CS50 AI e CS50 Web (já existiam). **Consolidei** o que estava duplicado, mantendo UMA entrada canônica por curso, com a URL oficial `cs50.harvard.edu`:

| Curso | Antes | Depois (canônico) | Removidos |
|---|---|---|---|
| Intro to CS | 3 entradas | `curso-cs50x` → `cs50.harvard.edu/x/` | `curso-edx-cs50x`, `curso-cs50-harvard` |
| Web Programming | 2 entradas | `curso-cs50-web` → `cs50.harvard.edu/web/` | `curso-edx-cs50-web` |
| Intro to AI | 1 entrada | `curso-edx-cs50-ai` → URL trocada p/ `cs50.harvard.edu/ai/` | — |

Nos 3 canônicos adicionei `certificado: "gratuito"` (CS50 emite certificado grátis).

**Exceção da variante PT verificada:** o "CS50 Web ... com Python e JavaScript" (PT) apontava para `cs50.harvard.edu/web/`, ou seja, é o **mesmo curso em inglês com legendas**, não conteúdo genuinamente em português. Logo a exceção não se aplica: não mantive curso PT separado. (Se algum dia surgir uma versão dublada/traduzida real em outra URL, aí sim vira curso à parte com `idioma: "Português"`.)

## 2. Hugging Face (decisão 2, parte final)

O par duplicado (`curso-hf-nlp` + `curso-huggingface-nlp`) foi consolidado em **1 curso**: mantive `curso-hf-nlp` (`huggingface.co/learn/nlp-course`, URL específica) e removi `curso-huggingface-nlp` (que usava a URL genérica `/learn`). O hub `huggingface.co/learn` entrou como **entrada nova de hub** (`hub-hugging-face-learn`). Resultado: HF = 1 curso + 1 hub.

## 3. Novo schema (decisões 2 e 3)

Como **não existe `interface Curso`** (o tipo é inferido do array literal, é assim que `tipo`/`preco` já são opcionais), adicionei os dois campos como **opcionais nos objetos** — o que já os torna opcionais no tipo inferido. `pnpm check` confirma que nada quebrou. Não introduzi uma interface nova (seria refatoração fora de escopo).

- **`certificado?: "gratuito" | "pago" | "nenhum"`** — preenchido só nos cursos novos e nos tocados (27 entradas no total).
- **`formato?: "curso" | "hub"`** — marcado `"hub"` nas 8 entradas de catálogo.

**Front (`Cursos.tsx`):**
- Selo de certificado agora usa `certificado` quando presente (grátis = verde, **pago = âmbar**, nenhum = cinza). **Fallback:** quando `certificado` está ausente, mantém exatamente o comportamento antigo derivado de `certificate`/`tipo`.
- Novo selo **"Catálogo de cursos"** (violeta, ícone `Library`) quando `formato === "hub"`.

## 4. Inserções (24)

**16 cursos individuais:**
- **Harvard/CS50 (7):** CS50P, CS50 SQL, CS50 Cybersecurity, CS50 Games, CS50 Scratch, CS50 Business, CS50R
- **Princeton (6):** Algorithms I, Algorithms II, Programming with a Purpose, Algorithms/Theory/Machines, Analysis of Algorithms, Bitcoin & Cryptocurrency
- **Penn (1):** Computational Thinking for Problem Solving
- **Dartmouth (2):** C: Getting Started, C with Linux (programa de 7)

**8 hubs (`formato: "hub"`):** MIT OCW, MIT Introductory Programming, Anthropic Academy, NVIDIA DLI, OpenAI Academy, MongoDB University, Hugging Face Learn, DeepLearning.AI Short Courses.

## 5. Convenções de mapeamento (suposições declaradas)

O seu JSON usava `instituicao/url/certificado/categoria`; mapeei para o schema do catálogo assim:

| Campo candidato | Vira | Regra |
|---|---|---|
| `instituicao` | `canal` | Ex.: "Princeton University", "MIT", "Anthropic" |
| `plataforma` | `plataforma` | edX / Coursera / MIT OpenCourseWare / etc. |
| `url` | `link` | direto |
| `certificado` | `certificado` + `certificate` | gratuito/pago → `certificate: "sim"`; nenhum → `"nao"` |
| `categoria` | `areaSlug` | mapa abaixo |
| `nivel` | `nivel` | direto; hubs ("Todos") → **"Iniciante"** (mantém o enum e a descoberta; o selo de hub já sinaliza que abrange níveis) |
| — | `idioma` | **"Inglês"** em todos (conteúdo em inglês) |
| — | `duracao` | **não inventei horas**: "Self-paced" (cursos) / "Vários cursos" (hubs) |
| — | `tipo` | **"Gratuito"** em todos (o curso é grátis de assistir; Penn/Dartmouth têm o *certificado* pago, capturado em `certificado`) |
| — | `descricao/motivoIndicacao/oQueAprende/proximoConteudo` | copy escrita por mim, sem dados numéricos inventados |

**Mapa `categoria` → `areaSlug`** (todos slugs de área de topo, resolvem para rótulo bonito):
Ciência da Computação / Programação / Algoritmos → `desenvolvimento-software` · Banco de Dados → `banco-de-dados` · Segurança da Informação → `ciberseguranca` · Desenvolvimento de Jogos → `gamedev` · Ciência de Dados → `dados` · Blockchain → `blockchain` · Inteligência Artificial → `ia`.

## 6. Verificação

- `pnpm check`: **passou** (tsc + geradores de sitemap/roadmap/CSP em sincronia).
- Contagem: **477** (457 − 4 + 24), 8 hubs, 27 com `certificado` (gratuito 14 / nenhum 10 / pago 3).
- CS50: cada curso agora aparece **uma única vez** com URL oficial.
- **Regressão de render:** 0 cards legados mudaram de aparência. Só 3 mudaram de propósito — Penn e os 2 Dartmouth passaram de "Certificado grátis" (rótulo errado do modelo antigo) para **"Certificado pago"**. Era exatamente a lacuna que motivou o campo `certificado`.
- Sem colisão de `id` entre as 24 novas entradas.

## 7. Fora de escopo (não toquei — sinalizando)

Problemas **pré-existentes** da auditoria da fase 1, que não fazem parte das decisões desta fase:
- **`id` duplicado `curso-tryhackme`** (aparece 2x) — continua lá; posso corrigir se você autorizar.
- **5 cursos com campo obrigatório vazio** (`curso-rocketseat-one`, `curso-curso.dev`, `curso-sebrae-online` sem `areaSlug`; `curso-foundational-csharp`, `curso-oracle-next-education` sem `duracao`).
- **`data.ts` não está 100% Prettier-clean** desde antes desta fase; **não** rodei `pnpm format` no arquivo inteiro para não gerar um diff gigante fora de escopo. Minhas entradas seguem o estilo das entradas já formatadas; `Cursos.tsx` passou no Prettier.

## 8. Nota de verificação visual

`pnpm check` e a checagem de regressão de render cobrem a lógica. **Não** abri o app no navegador para ver os dois selos novos porque os 24 registros entram Pro-gated (anexados ao fim, fora da amostra grátis) — precisaria de sessão Pro/admin. Se quiser, rodo o app e te mando um screenshot dos cards de hub e de certificado pago.
