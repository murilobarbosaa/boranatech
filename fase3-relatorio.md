# Fase 3 — Expansão dos hubs em cursos individuais

**Data:** 2026-07-19 · **Arquivo tocado:** `client/src/lib/data.ts`
**Verificação:** `pnpm check` ✅ · `pnpm build` ✅ (0 erros) · dedupe ✅ · URLs validadas via HEAD ✅

**Catálogo: 477 → 510 cursos** (+33 individuais). Os 8 hubs foram **mantidos** (Anthropic, Hugging Face, NVIDIA e os demais continuam como `formato: "hub"`), servindo de porta de entrada. Os cursos individuais entraram em adição.

Commits (um por ofertante):
- `163177b` feat(cursos): add Anthropic Academy and Anthropic x DeepLearning.AI courses (17)
- `55f1bc5` feat(cursos): add Hugging Face Learn individual courses (9)
- `af6dd02` feat(cursos): add NVIDIA DLI individual courses (7)

---

## Desvios do prompt (declarados)

1. **`instituicao` → `canal`.** O campo `instituicao` **nunca foi criado** (foi só uma recomendação no audit da fase 1). Todos os 477 cursos usam `canal` para o ofertante. Usei `canal` (Anthropic / Hugging Face / NVIDIA) em vez de forkar o schema com um campo redundante.
2. **`tipo: "Grátis"` → `"Gratuito"`.** O filtro de tipo e os 510 cursos usam a string `"Gratuito"`. `"Grátis"` quebraria o filtro e o selo silenciosamente.
3. **Plataforma da Anthropic Academy = `"Anthropic Academy"`** (não `"Skilljar"`). Mantém consistência com o hub já existente e evita expor o LMS de bastidores como "provider" no JSON-LD. Fácil trocar para "Skilljar" se preferir.
4. Cursos de público não-TI (AI Fluency for Educators/Students/Nonprofits/Small Businesses, Teaching AI Fluency, Enterprise adoption) **não** foram incluídos, conforme sua nota de curadoria.

## Cursos inseridos por grupo

- **Grupo 1 — Anthropic Academy (13):** Claude 101, Introduction to Claude Cowork, AI Capabilities and Limitations, Building with the Claude API, Introduction to MCP, MCP: Advanced Topics, Introduction to Agent Skills, Introduction to Subagents, Claude Code 101, Claude Code in Action, Claude with Amazon Bedrock, Claude with Google Cloud's Vertex AI, AI Fluency: Framework & Foundations. Todos `certificado: gratuito`.
- **Grupo 2 — Anthropic × DeepLearning.AI (4):** Agent Skills with Anthropic, Claude Code: A Highly Agentic Coding Assistant, Building toward Computer Use with Anthropic, MCP: Build Rich-Context AI Apps. `canal: Anthropic`, `plataforma: DeepLearning.AI`, `certificado: nenhum`.
- **Grupo 3 — Hugging Face Learn (9):** AI Agents Course (cert. gratuito), MCP Course, Deep RL Course, Computer Vision Course, Audio Course, Diffusion Course, ML for Games Course, ML for 3D Course, Open-Source AI Cookbook (os demais `certificado: nenhum`).
- **Grupo 4 — NVIDIA DLI (7):** Building a Brain in 10 Minutes, An Even Easier Introduction to CUDA, Getting Started with Deep Learning (cert. pago), Generative AI Explained (cert. gratuito), Building RAG Agents with LLMs, Fundamentals of Accelerated Computing with CUDA Python (cert. pago), Speed Up DataFrame Operations With RAPIDS cuDF.

Todos: `formato: "curso"`, `tipo: "Gratuito"`, `idioma: "Inglês"`, `duracao: "Self-paced"`. Categoria mapeada para `ia` / `desenvolvimento-software` / `cloud` / `gamedev` / `dados`.

## Cursos pulados por dedupe

| Curso | Motivo |
|---|---|
| **HF "LLM Course"** (`/learn/llm-course/chapter1/1`) | Mesmo curso do `curso-hf-nlp` já existente (a Hugging Face renomeou o "NLP Course" para "LLM Course"). Não dupliquei. O `curso-hf-nlp` permanece; se quiser, posso atualizar a URL dele para `/learn/llm-course/...` num passo à parte. |

Revisado e **mantido** (não é dup real): **HF "Computer Vision Course"** — o title-match foi contra `curso-kaggle-computer-vision` (Kaggle), ofertante e URL diferentes, curso distinto.

## Validação de URLs

Validei via HTTP HEAD (seguindo redirects) **todas as 33 URLs** (não só as da NVIDIA).

### Anthropic — 3 URLs do prompt estavam 404, corrigidas a partir do catálogo oficial

| Curso | URL do prompt (404) | URL corrigida (200) |
|---|---|---|
| Building with the Claude API | `/building-with-the-claude-api` | `/claude-with-the-anthropic-api` |
| Claude with Amazon Bedrock | `/claude-with-amazon-bedrock` | `/claude-in-amazon-bedrock` |
| Claude with Google Cloud's Vertex AI | `/claude-with-google-clouds-vertex-ai` | `/claude-with-google-vertex` |

As outras 10 do Grupo 1 e as 4 do Grupo 2 e as 9 do Grupo 3: **todas 200**.

### NVIDIA (validação obrigatória)

| Curso | URL usada | Status |
|---|---|---|
| Building a Brain in 10 Minutes | `.../course-detail?course_id=course-v1:DLI+T-FX-01+V1` | **200, específica ✅** |
| An Even Easier Introduction to CUDA | `.../course-detail?course_id=course-v1:DLI+T-AC-01+V1` | **200, específica ✅** |
| Getting Started with Deep Learning | `www.nvidia.com/en-us/training/self-paced-courses/` | catálogo — **URL específica pendente de verificação manual** |
| Generative AI Explained | idem | catálogo — **pendente** |
| Building RAG Agents with LLMs | idem | catálogo — **pendente** |
| Fundamentals of Accelerated Computing with CUDA Python | idem | catálogo — **pendente** |
| Speed Up DataFrame Operations With RAPIDS cuDF | idem | catálogo — **pendente** |

Observações NVIDIA:
- As 2 URLs específicas (course_ids `T-FX-01`, `T-AC-01`) retornaram **200** e foram usadas como estão.
- A URL de catálogo do prompt (`learn.nvidia.com/en-us/training/self-paced-courses`) faz **301** para `https://www.nvidia.com/en-us/training/self-paced-courses/` (redireciona para o catálogo, **não** para a home). Armazenei a URL canônica de destino.
- Os 5 cursos acima marcados como "pendente" apontam para o **catálogo**, não para a página específica do curso (os course_ids não foram capturados com segurança). Ficam 5 cursos compartilhando a mesma URL (mesmo tipo de dívida do §3b do audit da fase 1). Quando os course_ids forem obtidos, dá para deep-linkar cada um.

## Distribuição de certificado (todo o catálogo, pós-fase 3)

`gratuito: 29 · nenhum: 26 · pago: 5` (dos novos: 15 gratuito, 16 nenhum, 2 pago).

## Fora de escopo (não feito nesta fase)

- Validação dos 151 links-de-home legados.
- Expansão de MIT OCW, OpenAI Academy, MongoDB University, DeepLearning.AI Short Courses (hubs mantidos).
- Atualizar a URL do `curso-hf-nlp` para o novo caminho `/learn/llm-course` (sinalizado acima).
