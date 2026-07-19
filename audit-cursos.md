# Auditoria do Catálogo de Cursos — Bora na Tech

**Data:** 2026-07-19 · **Escopo:** leitura apenas (nada foi modificado no catálogo)
**Artefato de dados:** [`audit-cursos.json`](./audit-cursos.json) (inventário completo dos 457 cursos + este resumo estruturado)

---

## 1. Inventário — onde os cursos estão

**Fonte única e canônica:** `client/src/lib/data.ts`, no export `export const cursosGratuitos` (linhas **7063–16151**).

- **Não há tabela de cursos no Supabase.** Nenhuma migration cria/popula cursos. O catálogo é 100% estático no bundle JS.
- Consumido por `client/src/pages/Cursos.tsx` (via `import { cursosGratuitos } from "@/lib/data"`).
- **Atenção — não confundir:** o mesmo arquivo tem outro símbolo, `cursosGratuitos` como campo `string[]` dentro de `areasTI`/`SubArea` (recomendações em texto livre dentro dos roadmaps). Esses **não** são o catálogo. O catálogo é o array de objetos estruturados. Cursos pagos também vivem nesse mesmo array (campo `tipo: "Pago"`), apesar do nome do export ser `cursosGratuitos`.

**Total no catálogo: 457 cursos.**

O inventário completo com todos os campos de cada curso está em `audit-cursos.json` → chave `inventory`. Cada curso tem: `titulo`, `canal` (ofertante), `plataforma` (origem: Coursera/edX/YouTube/etc.), `link`, `areaSlug` (categoria), `idioma`, `nivel`, `certificate`, e campos descritivos.

### Distribuições

| Certificado | | Nível | | Tipo (efetivo) | |
|---|---|---|---|---|---|
| sim | 247 | Iniciante | 224 | Gratuito | 374 |
| nao | 125 | Intermediário | 181 | Pago | 83 |
| nao_informado | 85 | Avançado | 52 | | |

**Idioma:** Inglês 229 · Português 208 · variações mistas 20 (7 grafias diferentes do mesmo conceito).

**Top plataformas:** Coursera 47 · Microsoft Learn 33 · YouTube 31 · Udemy 29 · freeCodeCamp 28 · DIO 28 · Kaggle 24 · Google Cloud Skills Boost 18 · Curso em Vídeo 12 · Cisco NetAcad 10 · AWS Skill Builder 9.

---

## 2. Verificação por ofertante

"Existe" = ofertado por (match em `canal`/`plataforma`). "Só menção" = a marca aparece no título/descrição mas o curso é ofertado por outro (ex.: um curso freeCodeCamp que *ensina* MongoDB).

| Ofertante | Existe? | Qtd. | Observação |
|---|---|---|---|
| **Meta** | ✅ | 4 | 3 Professional Certificates (Front-End, Back-End, Database Engineer) no Coursera + doc React Native |
| **Google** | ✅ | 78 | Inclui Kaggle (24), Android/Flutter/Dart, Google Cloud, e os Google Career Certificates no Coursera |
| **IBM** | ✅ | 7 | Data Science, Data Analyst, Cybersecurity (Coursera) + IBM SkillsBuild + IA (via Cisco NetAcad) |
| **Microsoft** | ✅ | 43 | Microsoft Learn (majoritário) + parcerias Fundação Bradesco. Inclui 1 curso "Azure OpenAI" |
| **AWS / Amazon** | ✅ | 11 | AWS Skill Builder + Coursera (+4 cursos que ensinam AWS via DIO/Udemy/Pluralsight) |
| **Cisco** | ✅ | 10 | Todos na Cisco Networking Academy (NetAcad) |
| **Hugging Face** | ✅ | 2 | LLM/NLP Course (aparece **duplicado**, ver §3a) |
| **Harvard / CS50** | ✅ | 6 | CS50x, CS50 Web, CS50 AI — todos no edX (com inconsistência de nomenclatura, ver §3d) |
| **NVIDIA** | ❌ | 0 | Ausente |
| **Anthropic** | ❌ | 0 | Ausente |
| **OpenAI** | ❌ | 0 | Só 1 menção: "Soluções de IA com Azure OpenAI" — ofertado pela **Microsoft**, não pela OpenAI |
| **MongoDB** | ❌ | 0 | Só 2 menções: cursos do **freeCodeCamp** que ensinam MongoDB |
| **MIT** | ❌ | 0 | Ausente |
| **Princeton** | ❌ | 0 | Ausente |
| **Penn (UPenn)** | ❌ | 0 | Ausente |
| **Columbia** | ❌ | 0 | Ausente |
| **Dartmouth** | ❌ | 0 | Ausente |
| **Brown** | ❌ | 0 | Ausente |
| **Yale** | ❌ | 0 | Ausente |
| **Cornell** | ❌ | 0 | Ausente |

A lista item-a-item de cada curso por ofertante está em `audit-cursos.json` → `offererVerification`.

---

## 3. Qualidade dos dados

### (a) Duplicados / títulos quase idênticos — **22 grupos, 51 cursos envolvidos**

A maioria é **duplicação intencional para reuso entre áreas** (mesmo curso Kaggle/freeCodeCamp catalogado com `id` e `areaSlug` diferentes para aparecer em "Cientista de Dados", "Analista de Dados", etc.). Funciona, mas infla a contagem e cria manutenção em N lugares. Exemplos:

- `"Pandas"` ×3, `"Data Visualization"` ×3, `"Advanced SQL"` ×3, `"Android Basics with Compose"` ×3 (Kaggle/Google, mesmo link)
- `"Introducao a Analise de Dados - Microsoft Power BI"` ×3 (Fundação Bradesco, mesmo link)
- `"Analise de Dados com Python"` ×4 (freeCodeCamp, mesmo link)
- `"Hugging Face LLM/NLP Course"` ×2 — este é **duplicata real do mesmo curso**, não reuso por área (`curso-hugging-face-llm` vs variação), candidato a merge.

**ID duplicado (bug):** `curso-tryhackme` aparece **2 vezes** com o mesmo id — viola unicidade e pode quebrar keys de React/lookup.

### (b) URLs — **0 malformadas**, mas **151 cursos compartilham URL genérica**

Nenhum link vazio ou sintaticamente inválido. Porém **49 grupos de link compartilhado (151 cursos)** apontam para a **home da plataforma**, não para a página do curso. Isso é um problema de qualidade de URL a corrigir:

- `https://www.udemy.com/` → **28 cursos** diferentes apontam para a mesma raiz
- `https://www.dio.me/…`, `https://www.rocketseat.com.br/`, `https://ebaconline.com.br/`, `https://www.datacamp.com/`, `https://www.udacity.com/`, `https://www.pluralsight.com/` → idem
- Parte dos 151 é o reuso legítimo do item (a) (mesmo curso, mesma URL real). O restante são URLs "placeholder" genéricas.

### (c) Campos obrigatórios faltando — **5 cursos**

| id | Campo faltando |
|---|---|
| `curso-rocketseat-one` | `areaSlug` (null) |
| `curso-curso.dev` | `areaSlug` (null) |
| `curso-sebrae-online` | `areaSlug` (null) |
| `curso-foundational-csharp` | `duracao` (vazio) |
| `curso-oracle-next-education` | `duracao` (vazio) |

Os 3 com `areaSlug: null` colapsam no filtro "Geral" da página (comportamento tratado no componente, não quebra).

### (d) Inconsistências de nomenclatura de instituição/plataforma

Mesma entidade grafada de várias formas — atrapalha agrupamento, filtro e o provider do JSON-LD:

- **Fundação Bradesco:** `Fundação Bradesco` / `Fundacao Bradesco` / `Fundação Bradesco (com Microsoft)` / `Fundacao Bradesco / Microsoft` / `Fundação Bradesco (conteúdo Microsoft)` / `Fundação Bradesco (parceria Microsoft)` (6 grafias)
- **freeCodeCamp (plataforma):** `freeCodeCamp` / `freeCodeCamp.org` / `freeCodeCamp (Português)` / `freeCodeCamp (em portugues)` / `YouTube (freeCodeCamp.org)` (5 grafias)
- **DIO:** `DIO` / `DIO (Digital Innovation One)` / `DIO (dio.me)`
- **Kaggle:** `Kaggle` / `Kaggle Learn`
- **Harvard:** `Harvard / CS50` / `Harvard University` (mesmos cursos CS50)
- **Escola Virtual (Bradesco):** 5 grafias · **Curso em Vídeo/Gustavo Guanabara:** grafias misturando canal e autor · **Google:** `Google` / `Google Cloud` / `Android Developers (Google)` / `Flutter (Google)` / `Dart (Google)`

Lista completa das variações em `audit-cursos.json` → `dataQuality.namingInconsistencies`.

---

## 4. Schema atual e migração sugerida

**Não existe interface/type nomeado** para curso — o tipo é **inferido** do literal do array. `areaSlug` tem cast manual `as string | null`.

Campos presentes: `id, certificate, titulo, canal, plataforma, link, areaSlug, nivel, duracao, idioma, descricao, motivoIndicacao, oQueAprende[], proximoConteudo` (todos 457/457) + `tipo` (125/457) e `preco` (79/457) opcionais.

| Requisito da tarefa | Tem hoje? | Situação |
|---|---|---|
| **Tipo de certificado** (grátis / pago / inexistente) | ⚠️ Parcial | `certificate: sim\|nao\|nao_informado` só diz **se existe**. O custo (grátis vs pago) é **derivado de `tipo`** dentro de `Cursos.tsx` (`certificate==="sim" && tipo!=="Pago"`), não armazenado. |
| **Idioma** | ✅ Sim | Mas string livre — 7 grafias do mesmo conceito. |
| **Nível** (inic./interm./avanç.) | ✅ Sim | `nivel`, hoje consistente, mas string livre (não enum). |
| **Instituição vs Plataforma** (Harvard ≠ edX) | ❌ Não separado corretamente | `canal` mistura ofertante e criador (ex.: "Gustavo Guanabara", "Meta", "Harvard University"); `plataforma` é a origem. O JSON-LD usa `plataforma` como `provider.Organization`, tratando plataforma como emissor. Não há campo institucional limpo. |

### Migração sugerida (quando forem mexer no schema)

1. **Criar `interface Curso`** explícito em vez de tipo inferido — trava os campos e evita drift.
2. **Separar instituição de plataforma:** `instituicao` (Harvard, Meta, Google) × `plataforma` (edX, Coursera, YouTube) como campos distintos e normalizados (enum/união de literais), e corrigir o `provider` do JSON-LD.
3. **Certificado explícito:** `certificado: "gratuito" | "pago" | "inexistente" | "nao_informado"` — parar de derivar de `tipo`.
4. **Enums** para `nivel`, `idioma` e `areaSlug` (união de literais + normalizar as 7 grafias de idioma e as grafias de instituição do §3d).
5. **Deep-link obrigatório:** validar que `link` aponta para a página do curso, não a home da plataforma (§3b).
6. **Unicidade de `id`:** corrigir `curso-tryhackme` duplicado e adicionar checagem (lint/teste) contra ids repetidos.
7. Se/quando o catálogo migrar para o DB (dívida já registrada no CLAUDE.md sobre gating), esse schema normalizado é o alvo natural.

> Nada disso foi aplicado — são recomendações para a fase de migração.

---

## 5. Ofertantes AUSENTES (o que dá pra adicionar)

Da sua lista de verificação, **estão faltando por completo**:

- **NVIDIA** (DLI — Deep Learning Institute)
- **Anthropic** (cursos/Academy próprios)
- **OpenAI** (só aparece indiretamente via Azure/Microsoft)
- **MongoDB** (MongoDB University — só aparece como tema de cursos de terceiros)
- **MIT** (MITx no edX)
- **Princeton**
- **Penn / University of Pennsylvania**
- **Columbia**
- **Dartmouth**
- **Brown**
- **Yale**
- **Cornell**

**Presentes** (não precisa adicionar do zero, mas dá pra expandir): Meta (4), Google (78), IBM (7), Microsoft (43), AWS (11), Cisco (10), Hugging Face (2), Harvard/CS50 (6).

**Observação de curadoria:** das universidades da Ivy/elite pedidas, só **Harvard (via CS50)** existe. Se o objetivo é cobrir edX/Coursera universitário, MIT, Yale, Princeton, Columbia, Penn, Cornell, Brown e Dartmouth são a maior lacuna — todas têm catálogo relevante no edX/Coursera.
