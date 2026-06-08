# Glossário — Bora na Tech

Vocabulário oficial do produto. Use estes termos no UI, copy e código.
Quando houver conflito, esta página vence.

## Termos canônicos

### Área

**Especialidade de TI** com perfil profissional, salário, ferramentas e mercado próprios.

- **Exemplos:** Front-end, Back-end, Ciência de Dados, UX/UI Design, Mobile, Cloud, DevOps, IA, Cibersegurança, Produto Digital, QA, Gestão de Projetos Tech.
- **Identificador no código:** `areaSlug` (string, kebab-case): `frontend`, `backend`, `dados`, `uxui`, `mobile`, `cloud`, `devops`, `ia`, `ciberseguranca`, `produto`, `qa`, `gestao`.
- **Tabela Supabase:** `areas`. **Coluna:** `slug` (PK textual).
- **NÃO usar como sinônimo:** carreira, curso, trilha.

### Roadmap

**Trilha de aprendizado estruturada em etapas numeradas** dentro de uma área específica (ou de carreira).

- **Tem:** etapas ordenadas, duração estimada, nível inicial, pré-requisitos.
- **Exemplo:** "Front-end do Zero (30 dias)".
- **Tabela:** `roadmaps`. **Relação com Área:** `area_slug` → `areas.slug`.
- **NÃO usar como sinônimo:** trilha (usar "roadmap" em todo lugar — escolha de marca).

### Curso

**Conteúdo de vídeo/aula online** produzido por terceiros (YouTube, plataformas, etc).

- **Tem:** canal, plataforma, link externo, carga horária, idioma, área.
- **Tabela:** `courses`.
- **NÃO confundir com:** curso superior (use _graduação_).

### Graduação

**Formação acadêmica formal** (tecnólogo, bacharelado, licenciatura) em instituição reconhecida.

- **Exemplo:** ADS, Sistemas de Informação, Engenharia de Computação.
- **Página:** `/faculdades`.
- **NÃO usar:** "curso superior" no UI — sempre "graduação".

### Carreira

**Trajeto profissional macro:** vagas, currículo, entrevistas, salários, transição de área.

- **Páginas relacionadas:** `/empregabilidade`, `/curriculo`, `/entrevistas`, `/salarios`, `/freelance`, `/estagio`.
- **NÃO sobrepor com:** área. Carreira é o caminho; área é o destino.

### Tecnologia

**Linguagem, framework, biblioteca ou ferramenta específica.**

- **Exemplos:** React, Python, Docker, Figma, Kubernetes.
- **Tabela:** `technologies`. **Relação com Área:** `related_area_slugs text[]`.
- **Página:** `/tecnologias`.

## Termos descontinuados

| Não usar                         | Usar      |
| -------------------------------- | --------- |
| Trilha                           | Roadmap   |
| Curso superior                   | Graduação |
| Especialidade tech               | Área      |
| Carreira (como sinônimo de área) | Área      |

## Convenção de identificadores

- `slug`: usado para a entidade Área em si — `areas.slug` (PK).
- `areaSlug` (camelCase no frontend) / `area_slug` (snake_case no banco): chave estrangeira de outras entidades (Roadmap, Curso, Projeto, Vaga) apontando pra `areas.slug`.
- **Lista canônica de areaSlugs:** `frontend`, `backend`, `dados`, `uxui`, `ia`, `produto`, `ciberseguranca`, `cloud`, `gestao`, `qa`, `mobile`, `devops`.
- **Casos especiais:** `null` para conteúdo sem área (ex: roadmap "Começar do Zero"); `"carreira"` (sentinela) para trilhas de carreira; futuramente `fullstack` quando a área Full-stack for criada.
