# Fase 4 — Universidades brasileiras + consolidação Fundação Bradesco

**Data:** 2026-07-19 · **Arquivo tocado:** `client/src/lib/data.ts`
**Verificação:** `pnpm check` ✅ · `pnpm build` ✅ (0 erros) · dedupe ✅ · 11 URLs validadas por HEAD ✅

**Catálogo: 510 → 521 cursos** (+11 de universidades BR). Hubs: 8 → 14.

Commits (separados por assunto):
- `e8d9810` refactor(cursos): normaliza grafias do canal Fundação Bradesco
- `58942f4` feat(cursos): add Brazilian university courses (USP, Unicamp, UNIVESP, FGV, UNESP)

---

## PARTE A — Consolidação da Fundação Bradesco

As 6 grafias de `canal` foram normalizadas para **"Fundação Bradesco"** nos 16 cursos. Confirmado: `canal` distinto agora = `["Fundação Bradesco"]` (um só).

De-para aplicado (8 cursos alterados; 8 já estavam canônicos):
| Grafia antiga | Qtd. | Microsoft preservado? |
|---|---|---|
| `Fundacao Bradesco / Microsoft` | 4 | sim (ver abaixo) |
| `Fundação Bradesco (com Microsoft)` | 1 | movido para descrição |
| `Fundacao Bradesco` (sem acento) | 1 | n/a (não tinha Microsoft) |
| `Fundação Bradesco (conteúdo Microsoft)` | 1 | movido para descrição |
| `Fundação Bradesco (parceria Microsoft)` | 1 | já estava na descrição |

**Nenhuma menção à Microsoft foi perdida.** Os 7 cursos que tinham "Microsoft" no `canal` continuam com a informação preservada:
- Já constava no **título** ("Microsoft Power BI"): `bradesco-intro-analise-dados-powerbi`, `bradesco-intro-analise-analista-dados`, `bradesco-intro-analise-bi`.
- Já constava na **descrição**: `bradesco-ev-fluencia-ia` ("especialistas da Microsoft no Brasil").
- **Movido para a descrição nesta fase** (a informação só existia no `canal`): `frontend-3`, `bradesco-analise-dados-powerbi-bi`, `bradesco-ev-ai-900-azure` — receberam uma frase "Conteúdo produzido (em parceria) pela Microsoft."

## PARTE B — Universidades brasileiras (11 inseridos)

Dedupe: o único curso USP pré-existente é **`qa-4` "Introdução ao Teste de Software (USP)"** (`/learn/intro-teste-de-software`) — diferente dos cursos de Python inseridos. **Nenhum curso pulado.**

| # | id | Título | canal | plataforma | formato | certificado |
|---|---|---|---|---|---|---|
| 1 | `curso-usp-python-parte-1` | Intro à CC com Python – Parte 1 | USP | Coursera | curso | pago |
| 2 | `curso-usp-python-parte-2` | Intro à CC com Python – Parte 2 | USP | Coursera | curso | pago |
| 3 | `hub-usp-eaulas` | eAulas USP | USP | USP eAulas | hub | nenhum |
| 4 | `curso-unicamp-android` | Desenvolvimento Android | Unicamp | Coursera | curso | pago |
| 5 | `curso-unicamp-pensamento-critico` | Pensamento Crítico, Lógica e Argumentação | Unicamp | Coursera | curso | pago |
| 6 | `curso-unicamp-logica-portugol` | Lógica de Programação (Portugol) | Unicamp | Unicamp GGTE | curso | gratuito |
| 7 | `hub-unicamp-ggte-moocs` | Portal MOOC GGTE | Unicamp | Unicamp GGTE | hub | gratuito |
| 8 | `hub-univesp-integra` | Repositório Integra | UNIVESP | UNIVESP | hub | nenhum |
| 9 | `hub-univesp-tv-youtube` | Univesp TV (YouTube) | UNIVESP | YouTube | hub | nenhum |
| 10 | `hub-fgv-gratuitos` | FGV cursos gratuitos | FGV | FGV Online | hub | gratuito |
| 11 | `hub-unesp-aberta` | UNESP Aberta | UNESP | UNESP Aberta | hub | nenhum |

Padrões: `tipo: "Gratuito"`, `idioma: "Português"`, duração qualitativa (`Self-paced` cursos / `Vários cursos` hubs), hubs com `nivel: "Iniciante"`. Categoria mapeada para `desenvolvimento-software` (Ciência da Computação / Programação / Lógica / Tecnologia) e `mobile` (Android).

## Validação de URLs (HEAD) — 4 correções antes de inserir

Validei todas as 11. **4 estavam quebradas** e foram corrigidas (não inseri link morto):

| Curso | URL do prompt | Status | Ação |
|---|---|---|---|
| USP Python Parte 1 / 2 | `.../ciencia-computacao-python-conceitos(-2)` | 200 | ok |
| eAulas USP | `eaulas.usp.br/` | 200 | ok |
| Unicamp Android | `/learn/introducao-desenvolvimento-android` | **404** | **corrigida** → `/learn/introducao-aplicativos-android` (200, slug real do parceiro Unicamp no Coursera) |
| Unicamp Pensamento Crítico | `/learn/pensamento-critico` | **404** | **corrigida** → `/learn/pensamento-critico-argumentacao` (200) |
| Unicamp GGTE (curso + hub) | `moocs.ggte.unicamp.br/...` | 200 | ok |
| UNIVESP Integra | `apps.univesp.br/integra/` | 200 | ok |
| Univesp TV (YouTube) | `youtube.com/@univesp` | **404** | **corrigida** → `youtube.com/@univesptv` (200, canal real achado via univesp.br) |
| FGV gratuitos | `educacao-executiva.fgv.br/cursos/gratuitos` | 200 | ok |
| UNESP Aberta | `www.unespaberta.ead.unesp.br/` | **falha (000)** | **corrigida** → `unespaberta.ead.unesp.br/` sem `www` (200) |

Nenhuma URL ficou pendente: todas resolvem 200.

## Desvios/decisões declarados

- **Plataforma "Unicamp GGTE"** (não "TIM Tec"): usei o nome do portal reconhecível (`moocs.ggte.unicamp.br`) em vez do LMS de bastidores, como fiz com "Anthropic Academy" na fase 3.
- **`areaSlug` de "Pensamento Crítico, Lógica e Argumentação"** = `desenvolvimento-software` (não é curso de TI puro; usei o bucket mais próximo por ser base de lógica de programação). Sinalizo caso prefira outro.
- **Números suavizados** (regra do CLAUDE.md de não cravar dado): eAulas "centenas de horas" (o prompt citava "1.400 horas"); FGV "amplo catálogo" (o prompt citava "200+").

## Curadoria (conforme sua nota)

- **UFRJ, UFMG, UnB não incluídas:** não têm hoje oferta consolidada de TI em formato aberto com URL estável. Não inventei URLs para elas.
- Universidades BR agora no catálogo: **USP** (era só 1, agora 4: Teste de Software + Python 1/2 + eAulas), **Unicamp** (4), **UNIVESP** (2), **FGV** (1 hub), **UNESP** (1 hub). Fundação Bradesco (16) agora conta como uma instituição única no filtro.

## Fora de escopo (não feito)

- Validação dos 151 links-de-home legados.
- Deep-link dos 5 cursos NVIDIA de catálogo (fase 3).
- Atualizar a URL do `curso-hf-nlp` para `/learn/llm-course` (sinalizado na fase 3).
