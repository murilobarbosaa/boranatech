# Fase 2A — Relatório de Teste: resume-render

> **Modelo:** `gpt-4o-mini` · **Temperature:** 0.2 · **Rodadas por cenário:** 3 · **Gerado em:** 2026-05-21T20:19:12.671Z

## Sumário

| Métrica            | Resultado  |
| ------------------ | ---------- |
| Rodadas executadas | 12         |
| HTTP 200 da OpenAI | 12/12 ✅   |
| JSON parse OK      | 12/12 ✅   |
| Zod validation OK  | 12/12 ✅   |
| Checks semânticos  | 214/214 ✅ |

---

## R1 · Estudante PT (Maria, 2 ano CC, primeiro estágio)

**Login context:** `[dados do cadastro] Nome: Maria Souza, Email: maria.souza@email.com, Gênero: feminino`

### Rodada 1 (5.4s, in=3769t, out=336t)

Schema válido ✅

**Checks semânticos:**

| Check                                    | Resultado                                                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Idioma bate (pt-BR)                      | ✅ (obtido=pt-BR)                                                                                                                               |
| Persona bate (estudante)                 | ✅ (obtido=estudante)                                                                                                                           |
| Formato em hibrido                       | ✅ (obtido=hibrido)                                                                                                                             |
| Nome do cadastro usado                   | ✅ (obtido=Maria Souza)                                                                                                                         |
| Email do cadastro usado                  | ✅ (obtido=maria.souza@email.com)                                                                                                               |
| Habilidades mencionam "React"            | ✅                                                                                                                                              |
| Habilidades mencionam "TypeScript"       | ✅                                                                                                                                              |
| Sem fantasia "Empresa Exemplo"           | ✅                                                                                                                                              |
| Sem fantasia "exemplo@"                  | ✅                                                                                                                                              |
| Sem fantasia "01/01/2020"                | ✅                                                                                                                                              |
| Sem fantasia "lorem"                     | ✅                                                                                                                                              |
| Resumo profissional escrito em português | ✅ (resumo[:120]="Estudante de Ciência da Computação na UFRJ, com foco em desenvolvimento web e habilidades em frontend. Experiência em pr...") |

<details><summary>JSON do currículo</summary>

```json
{
  "dadosPessoais": {
    "nome": "Maria Souza",
    "email": "maria.souza@email.com",
    "telefone": null,
    "linkedin": null,
    "github": null,
    "cidade": null
  },
  "objetivo": {
    "cargo": "Estagiária em Desenvolvimento Frontend",
    "area": "frontend",
    "nivel": "estágio"
  },
  "idioma": "pt-BR",
  "formato": "hibrido",
  "persona": "estudante",
  "resumoProfissional": "Estudante de Ciência da Computação na UFRJ, com foco em desenvolvimento web e habilidades em frontend. Experiência em projetos práticos utilizando React e TypeScript, buscando uma oportunidade de estágio para aplicar e expandir conhecimentos técnicos.",
  "formacao": [
    {
      "curso": "Ciência da Computação",
      "instituicao": "UFRJ",
      "periodo": "2024 - em andamento",
      "status": "em andamento"
    },
    {
      "curso": "Curso de React",
      "instituicao": "Alura",
      "periodo": null,
      "status": "concluído"
    }
  ],
  "experiencias": [],
  "projetos": [
    {
      "nome": "Clone do Spotify",
      "descricao": "Projeto que replica a interface e funcionalidades do Spotify utilizando React e TypeScript, com integração na API do Deezer.",
      "tecnologias": ["React", "TypeScript", "API do Deezer"],
      "link": null
    },
    {
      "nome": "Calculadora Simples",
      "descricao": "Calculadora desenvolvida em HTML, CSS e JavaScript para um trabalho da faculdade.",
      "tecnologias": ["HTML", "CSS", "JavaScript"],
      "link": null
    }
  ],
  "habilidades": ["JavaScript", "TypeScript", "React", "HTML", "CSS", "Git"],
  "idiomas": [
    {
      "idioma": "Inglês",
      "nivel": "Intermediário"
    }
  ],
  "certificacoes": null
}
```

</details>

### Rodada 2 (5.6s, in=3769t, out=328t)

Schema válido ✅

**Checks semânticos:**

| Check                                    | Resultado                                                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Idioma bate (pt-BR)                      | ✅ (obtido=pt-BR)                                                                                                                               |
| Persona bate (estudante)                 | ✅ (obtido=estudante)                                                                                                                           |
| Formato em hibrido                       | ✅ (obtido=hibrido)                                                                                                                             |
| Nome do cadastro usado                   | ✅ (obtido=Maria Souza)                                                                                                                         |
| Email do cadastro usado                  | ✅ (obtido=maria.souza@email.com)                                                                                                               |
| Habilidades mencionam "React"            | ✅                                                                                                                                              |
| Habilidades mencionam "TypeScript"       | ✅                                                                                                                                              |
| Sem fantasia "Empresa Exemplo"           | ✅                                                                                                                                              |
| Sem fantasia "exemplo@"                  | ✅                                                                                                                                              |
| Sem fantasia "01/01/2020"                | ✅                                                                                                                                              |
| Sem fantasia "lorem"                     | ✅                                                                                                                                              |
| Resumo profissional escrito em português | ✅ (resumo[:120]="Estudante de Ciência da Computação na UFRJ, com foco em desenvolvimento web e habilidades em frontend. Experiência em pr...") |

<details><summary>JSON do currículo</summary>

```json
{
  "dadosPessoais": {
    "nome": "Maria Souza",
    "email": "maria.souza@email.com",
    "telefone": null,
    "linkedin": null,
    "github": null,
    "cidade": null
  },
  "objetivo": {
    "cargo": "Estagiária em Desenvolvimento Frontend",
    "area": "frontend",
    "nivel": "estágio"
  },
  "idioma": "pt-BR",
  "formato": "hibrido",
  "persona": "estudante",
  "resumoProfissional": "Estudante de Ciência da Computação na UFRJ, com foco em desenvolvimento web e habilidades em frontend. Experiência em projetos acadêmicos e pessoais utilizando tecnologias modernas como React e TypeScript.",
  "formacao": [
    {
      "curso": "Ciência da Computação",
      "instituicao": "UFRJ",
      "periodo": "2024 - em andamento",
      "status": "em andamento"
    },
    {
      "curso": "Curso de React",
      "instituicao": "Alura",
      "periodo": null,
      "status": "concluído"
    }
  ],
  "experiencias": [],
  "projetos": [
    {
      "nome": "Clone do Spotify",
      "descricao": "Projeto que replica a interface e funcionalidades do Spotify, utilizando React e TypeScript com integração na API do Deezer.",
      "tecnologias": ["React", "TypeScript", "API do Deezer"],
      "link": null
    },
    {
      "nome": "Calculadora Simples",
      "descricao": "Calculadora desenvolvida em HTML, CSS e JavaScript para um trabalho da faculdade.",
      "tecnologias": ["HTML", "CSS", "JavaScript"],
      "link": null
    }
  ],
  "habilidades": ["JavaScript", "TypeScript", "React", "HTML", "CSS", "Git"],
  "idiomas": [
    {
      "idioma": "Inglês",
      "nivel": "Intermediário"
    }
  ],
  "certificacoes": null
}
```

</details>

### Rodada 3 (5.0s, in=3769t, out=344t)

Schema válido ✅

**Checks semânticos:**

| Check                                    | Resultado                                                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Idioma bate (pt-BR)                      | ✅ (obtido=pt-BR)                                                                                                                               |
| Persona bate (estudante)                 | ✅ (obtido=estudante)                                                                                                                           |
| Formato em hibrido                       | ✅ (obtido=hibrido)                                                                                                                             |
| Nome do cadastro usado                   | ✅ (obtido=Maria Souza)                                                                                                                         |
| Email do cadastro usado                  | ✅ (obtido=maria.souza@email.com)                                                                                                               |
| Habilidades mencionam "React"            | ✅                                                                                                                                              |
| Habilidades mencionam "TypeScript"       | ✅                                                                                                                                              |
| Sem fantasia "Empresa Exemplo"           | ✅                                                                                                                                              |
| Sem fantasia "exemplo@"                  | ✅                                                                                                                                              |
| Sem fantasia "01/01/2020"                | ✅                                                                                                                                              |
| Sem fantasia "lorem"                     | ✅                                                                                                                                              |
| Resumo profissional escrito em português | ✅ (resumo[:120]="Estudante de Ciência da Computação na UFRJ, com experiência em desenvolvimento web e foco em frontend. Possuo habilidade...") |

<details><summary>JSON do currículo</summary>

```json
{
  "dadosPessoais": {
    "nome": "Maria Souza",
    "email": "maria.souza@email.com",
    "telefone": null,
    "linkedin": null,
    "github": null,
    "cidade": null
  },
  "objetivo": {
    "cargo": "Estagiária em Desenvolvimento Frontend",
    "area": "frontend",
    "nivel": "estágio"
  },
  "idioma": "pt-BR",
  "formato": "hibrido",
  "persona": "estudante",
  "resumoProfissional": "Estudante de Ciência da Computação na UFRJ, com experiência em desenvolvimento web e foco em frontend. Possuo habilidades em JavaScript, TypeScript e React, além de ter realizado projetos práticos que demonstram minha capacidade de implementar soluções criativas e funcionais.",
  "formacao": [
    {
      "curso": "Ciência da Computação",
      "instituicao": "UFRJ",
      "periodo": "2024 - em andamento",
      "status": "em andamento"
    },
    {
      "curso": "Curso de React",
      "instituicao": "Alura",
      "periodo": null,
      "status": "concluído"
    }
  ],
  "experiencias": [],
  "projetos": [
    {
      "nome": "Clone do Spotify",
      "descricao": "Projeto que replica a interface e funcionalidades do Spotify utilizando React e TypeScript, com integração na API do Deezer.",
      "tecnologias": ["React", "TypeScript", "API do Deezer"],
      "link": null
    },
    {
      "nome": "Calculadora Simples",
      "descricao": "Calculadora desenvolvida em HTML, CSS e JavaScript para um trabalho da faculdade.",
      "tecnologias": ["HTML", "CSS", "JavaScript"],
      "link": null
    }
  ],
  "habilidades": ["JavaScript", "TypeScript", "React", "HTML", "CSS", "Git"],
  "idiomas": [
    {
      "idioma": "Inglês",
      "nivel": "Intermediário"
    }
  ],
  "certificacoes": null
}
```

</details>

---

## R2 · Júnior PT (Lucas Silva, dev backend BR, fluxo C8 completo)

**Login context:** `[dados do cadastro] Nome: Lucas Silva, Email: lucas.silva@email.com, Gênero: masculino`

### Rodada 1 (5.5s, in=3803t, out=339t)

Schema válido ✅

**Checks semânticos:**

| Check                                    | Resultado                                                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Idioma bate (pt-BR)                      | ✅ (obtido=pt-BR)                                                                                                                               |
| Persona bate (estudante)                 | ✅ (obtido=estudante)                                                                                                                           |
| Formato em hibrido                       | ✅ (obtido=hibrido)                                                                                                                             |
| Nome do cadastro usado                   | ✅ (obtido=Lucas Silva)                                                                                                                         |
| Email do cadastro usado                  | ✅ (obtido=lucas.silva@email.com)                                                                                                               |
| Habilidades mencionam "Node.js"          | ✅                                                                                                                                              |
| Habilidades mencionam "PostgreSQL"       | ✅                                                                                                                                              |
| Habilidades mencionam "React"            | ✅                                                                                                                                              |
| Sem fantasia "Empresa Exemplo"           | ✅                                                                                                                                              |
| Sem fantasia "exemplo@"                  | ✅                                                                                                                                              |
| Sem fantasia "Acme"                      | ✅                                                                                                                                              |
| Resumo profissional escrito em português | ✅ (resumo[:120]="Desenvolvedor backend júnior com formação em Bootcamp Full Stack na Rocketseat. Possuo experiência em projetos práticos,...") |

<details><summary>JSON do currículo</summary>

```json
{
  "dadosPessoais": {
    "nome": "Lucas Silva",
    "email": "lucas.silva@email.com",
    "telefone": "(11) 98765-4321",
    "linkedin": null,
    "github": "github.com/lucassilva",
    "cidade": "São Paulo SP"
  },
  "objetivo": {
    "cargo": "Desenvolvedor Backend Júnior",
    "area": "backend",
    "nivel": "júnior"
  },
  "idioma": "pt-BR",
  "formato": "hibrido",
  "persona": "estudante",
  "resumoProfissional": "Desenvolvedor backend júnior com formação em Bootcamp Full Stack na Rocketseat. Possuo experiência em projetos práticos, incluindo uma API REST e um clone do Twitter. Busco uma oportunidade para aplicar minhas habilidades em JavaScript, Node.js e PostgreSQL.",
  "formacao": [
    {
      "curso": "Bootcamp Full Stack",
      "instituicao": "Rocketseat",
      "periodo": "2024-2025",
      "status": "em andamento"
    },
    {
      "curso": "Ensino Médio",
      "instituicao": "ETEC Itaquera",
      "periodo": "2020",
      "status": "concluído"
    }
  ],
  "experiencias": [],
  "projetos": [
    {
      "nome": "API REST em Node.js",
      "descricao": "API REST para controle de gastos pessoais.",
      "tecnologias": ["Node.js", "PostgreSQL"],
      "link": "Railway"
    },
    {
      "nome": "Clone do Twitter",
      "descricao": "Clone simples do Twitter feito durante o bootcamp.",
      "tecnologias": ["React", "Express"],
      "link": null
    }
  ],
  "habilidades": [
    "JavaScript",
    "TypeScript",
    "Node.js",
    "React",
    "PostgreSQL",
    "Git",
    "Docker básico"
  ],
  "idiomas": [
    {
      "idioma": "Inglês",
      "nivel": "Intermediário"
    }
  ],
  "certificacoes": null
}
```

</details>

### Rodada 2 (4.9s, in=3803t, out=337t)

Schema válido ✅

**Checks semânticos:**

| Check                                    | Resultado                                                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Idioma bate (pt-BR)                      | ✅ (obtido=pt-BR)                                                                                                                               |
| Persona bate (estudante)                 | ✅ (obtido=estudante)                                                                                                                           |
| Formato em hibrido                       | ✅ (obtido=hibrido)                                                                                                                             |
| Nome do cadastro usado                   | ✅ (obtido=Lucas Silva)                                                                                                                         |
| Email do cadastro usado                  | ✅ (obtido=lucas.silva@email.com)                                                                                                               |
| Habilidades mencionam "Node.js"          | ✅                                                                                                                                              |
| Habilidades mencionam "PostgreSQL"       | ✅                                                                                                                                              |
| Habilidades mencionam "React"            | ✅                                                                                                                                              |
| Sem fantasia "Empresa Exemplo"           | ✅                                                                                                                                              |
| Sem fantasia "exemplo@"                  | ✅                                                                                                                                              |
| Sem fantasia "Acme"                      | ✅                                                                                                                                              |
| Resumo profissional escrito em português | ✅ (resumo[:120]="Desenvolvedor backend júnior com formação em Bootcamp Full Stack na Rocketseat. Experiência em projetos de desenvolvimen...") |

<details><summary>JSON do currículo</summary>

```json
{
  "dadosPessoais": {
    "nome": "Lucas Silva",
    "email": "lucas.silva@email.com",
    "telefone": "(11) 98765-4321",
    "linkedin": null,
    "github": "github.com/lucassilva",
    "cidade": "São Paulo SP"
  },
  "objetivo": {
    "cargo": "Desenvolvedor Backend Júnior",
    "area": "backend",
    "nivel": "júnior"
  },
  "idioma": "pt-BR",
  "formato": "hibrido",
  "persona": "estudante",
  "resumoProfissional": "Desenvolvedor backend júnior com formação em Bootcamp Full Stack na Rocketseat. Experiência em projetos de desenvolvimento de APIs e clones de aplicações. Habilidades em JavaScript, TypeScript, Node.js e React, buscando a primeira oportunidade no mercado.",
  "formacao": [
    {
      "curso": "Bootcamp Full Stack",
      "instituicao": "Rocketseat",
      "periodo": "2024-2025",
      "status": "em andamento"
    },
    {
      "curso": "Ensino Médio",
      "instituicao": "ETEC Itaquera",
      "periodo": "2020",
      "status": "concluído"
    }
  ],
  "experiencias": [],
  "projetos": [
    {
      "nome": "API REST em Node.js",
      "descricao": "API REST para controle de gastos pessoais.",
      "tecnologias": ["Node.js", "PostgreSQL"],
      "link": "Railway"
    },
    {
      "nome": "Clone do Twitter",
      "descricao": "Clone simples do Twitter feito durante o bootcamp.",
      "tecnologias": ["React", "Express"],
      "link": null
    }
  ],
  "habilidades": [
    "JavaScript",
    "TypeScript",
    "Node.js",
    "React",
    "PostgreSQL",
    "Git",
    "Docker básico"
  ],
  "idiomas": [
    {
      "idioma": "Inglês",
      "nivel": "intermediário"
    }
  ],
  "certificacoes": null
}
```

</details>

### Rodada 3 (5.5s, in=3803t, out=328t)

Schema válido ✅

**Checks semânticos:**

| Check                                    | Resultado                                                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Idioma bate (pt-BR)                      | ✅ (obtido=pt-BR)                                                                                                                               |
| Persona bate (estudante)                 | ✅ (obtido=estudante)                                                                                                                           |
| Formato em hibrido                       | ✅ (obtido=hibrido)                                                                                                                             |
| Nome do cadastro usado                   | ✅ (obtido=Lucas Silva)                                                                                                                         |
| Email do cadastro usado                  | ✅ (obtido=lucas.silva@email.com)                                                                                                               |
| Habilidades mencionam "Node.js"          | ✅                                                                                                                                              |
| Habilidades mencionam "PostgreSQL"       | ✅                                                                                                                                              |
| Habilidades mencionam "React"            | ✅                                                                                                                                              |
| Sem fantasia "Empresa Exemplo"           | ✅                                                                                                                                              |
| Sem fantasia "exemplo@"                  | ✅                                                                                                                                              |
| Sem fantasia "Acme"                      | ✅                                                                                                                                              |
| Resumo profissional escrito em português | ✅ (resumo[:120]="Desenvolvedor Backend Júnior com formação em Bootcamp Full Stack e experiência em projetos práticos. Habilidades em Java...") |

<details><summary>JSON do currículo</summary>

```json
{
  "dadosPessoais": {
    "nome": "Lucas Silva",
    "email": "lucas.silva@email.com",
    "telefone": "(11) 98765-4321",
    "linkedin": null,
    "github": "github.com/lucassilva",
    "cidade": "São Paulo SP"
  },
  "objetivo": {
    "cargo": "Desenvolvedor Backend Júnior",
    "area": "backend",
    "nivel": "júnior"
  },
  "idioma": "pt-BR",
  "formato": "hibrido",
  "persona": "estudante",
  "resumoProfissional": "Desenvolvedor Backend Júnior com formação em Bootcamp Full Stack e experiência em projetos práticos. Habilidades em JavaScript, Node.js e PostgreSQL, com foco em desenvolvimento de APIs e aplicações web.",
  "formacao": [
    {
      "curso": "Bootcamp Full Stack",
      "instituicao": "Rocketseat",
      "periodo": "2024-2025",
      "status": "em andamento"
    },
    {
      "curso": "Ensino Médio",
      "instituicao": "ETEC Itaquera",
      "periodo": "2020",
      "status": "concluído"
    }
  ],
  "experiencias": [],
  "projetos": [
    {
      "nome": "API REST em Node.js",
      "descricao": "API REST para controle de gastos pessoais.",
      "tecnologias": ["Node.js", "PostgreSQL"],
      "link": "Railway"
    },
    {
      "nome": "Clone do Twitter",
      "descricao": "Clone simples do Twitter feito durante o bootcamp.",
      "tecnologias": ["React", "Express"],
      "link": null
    }
  ],
  "habilidades": [
    "JavaScript",
    "TypeScript",
    "Node.js",
    "React",
    "PostgreSQL",
    "Git",
    "Docker básico"
  ],
  "idiomas": [
    {
      "idioma": "Inglês",
      "nivel": "Intermediário"
    }
  ],
  "certificacoes": null
}
```

</details>

---

## R3 · Experiente EN (Carlos, Senior Big Tech, conversa em PT mas alvo Google)

**Login context:** `[dados do cadastro] Nome: Carlos Mendes, Email: carlos.mendes@email.com, Gênero: masculino`

### Rodada 1 (13.3s, in=3944t, out=602t)

Schema válido ✅

**Checks semânticos:**

| Check                                                          | Resultado                                                                               |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------- |
| Idioma bate (en)                                               | ✅ (obtido=en)                                                                          |
| Persona bate (experiente)                                      | ✅ (obtido=experiente)                                                                  |
| Formato em harvard                                             | hibrido                                                                                 | ✅ (obtido=harvard) |
| Nome do cadastro usado                                         | ✅ (obtido=Carlos Mendes)                                                               |
| Email do cadastro usado                                        | ✅ (obtido=carlos.mendes@email.com)                                                     |
| Habilidades mencionam "Kubernetes"                             | ✅                                                                                      |
| Habilidades mencionam "Kotlin"                                 | ✅                                                                                      |
| Sem fantasia "Empresa Exemplo"                                 | ✅                                                                                      |
| Sem fantasia "Acme Corp"                                       | ✅                                                                                      |
| Sem fantasia "lorem"                                           | ✅                                                                                      |
| EN sem vazamento de PT em objetivo.cargo                       | ✅ ("Senior Software Engineer")                                                         |
| EN sem vazamento de PT em objetivo.area                        | ✅ ("infrastructure")                                                                   |
| EN sem vazamento de PT em objetivo.nivel                       | ✅ ("Senior")                                                                           |
| EN sem vazamento de PT em resumoProfissional                   | ✅ ("Experienced Senior Software Engineer with 8 years in backend and cloud infrastru") |
| EN sem vazamento de PT em formacao[0].curso                    | ✅ ("Bachelor's in Computer Engineering")                                               |
| EN sem vazamento de PT em formacao[0].status                   | ✅ ("completed")                                                                        |
| EN sem vazamento de PT em experiencias[0].responsabilidades[0] | ✅ ("Led migration of job orchestrator to Kubernetes")                                  |
| EN sem vazamento de PT em experiencias[0].responsabilidades[1] | ✅ ("Reduced infrastructure costs by 30%")                                              |
| EN sem vazamento de PT em experiencias[0].responsabilidades[2] | ✅ ("Improved p99 latency of queues from 500ms to 80ms")                                |
| EN sem vazamento de PT em experiencias[1].responsabilidades[0] | ✅ ("Worked on the payments team")                                                      |
| EN sem vazamento de PT em experiencias[1].responsabilidades[1] | ✅ ("Scaled the boleto system to process 5x more transactions")                         |
| EN sem vazamento de PT em experiencias[2].responsabilidades[0] | ✅ ("Consulted for financial clients")                                                  |
| EN sem vazamento de PT em experiencias[2].responsabilidades[1] | ✅ ("Worked primarily with Java and microservices")                                     |
| EN sem vazamento de PT em idiomas[0].idioma                    | ✅ ("Portuguese")                                                                       |
| EN sem vazamento de PT em idiomas[0].nivel                     | ✅ ("Native")                                                                           |
| EN sem vazamento de PT em idiomas[1].idioma                    | ✅ ("English")                                                                          |
| EN sem vazamento de PT em idiomas[1].nivel                     | ✅ ("Fluent")                                                                           |
| EN sem vazamento de PT em idiomas[2].idioma                    | ✅ ("Spanish")                                                                          |
| EN sem vazamento de PT em idiomas[2].nivel                     | ✅ ("Intermediate")                                                                     |

<details><summary>JSON do currículo</summary>

```json
{
  "dadosPessoais": {
    "nome": "Carlos Mendes",
    "email": "carlos.mendes@email.com",
    "telefone": "+55 11 99888-7766",
    "linkedin": "linkedin.com/in/carlos-mendes",
    "github": "github.com/cmendes",
    "cidade": "São Paulo SP"
  },
  "objetivo": {
    "cargo": "Senior Software Engineer",
    "area": "infrastructure",
    "nivel": "Senior"
  },
  "idioma": "en",
  "formato": "harvard",
  "persona": "experiente",
  "resumoProfissional": "Experienced Senior Software Engineer with 8 years in backend and cloud infrastructure. Proven track record in leading migrations and optimizing system performance. Strong skills in Kotlin, Java, and cloud technologies.",
  "formacao": [
    {
      "curso": "Bachelor's in Computer Engineering",
      "instituicao": "USP",
      "periodo": null,
      "status": "completed"
    }
  ],
  "experiencias": [
    {
      "empresa": "Nubank",
      "cargo": "Staff Engineer",
      "periodo": "2021 - Present",
      "responsabilidades": [
        "Led migration of job orchestrator to Kubernetes",
        "Reduced infrastructure costs by 30%",
        "Improved p99 latency of queues from 500ms to 80ms"
      ],
      "conquistas": []
    },
    {
      "empresa": "iFood",
      "cargo": "Senior Backend Engineer",
      "periodo": "2018 - 2021",
      "responsabilidades": [
        "Worked on the payments team",
        "Scaled the boleto system to process 5x more transactions"
      ],
      "conquistas": []
    },
    {
      "empresa": "ThoughtWorks",
      "cargo": "Software Engineer",
      "periodo": "2017 - 2018",
      "responsabilidades": [
        "Consulted for financial clients",
        "Worked primarily with Java and microservices"
      ],
      "conquistas": []
    }
  ],
  "projetos": [],
  "habilidades": [
    "Kotlin",
    "Java",
    "Go",
    "Rust",
    "Kubernetes",
    "AWS",
    "Kafka",
    "PostgreSQL",
    "Redis",
    "Terraform",
    "observability tools (Grafana, Prometheus)"
  ],
  "idiomas": [
    {
      "idioma": "Portuguese",
      "nivel": "Native"
    },
    {
      "idioma": "English",
      "nivel": "Fluent"
    },
    {
      "idioma": "Spanish",
      "nivel": "Intermediate"
    }
  ],
  "certificacoes": null
}
```

</details>

### Rodada 2 (7.5s, in=3944t, out=628t)

Schema válido ✅

**Checks semânticos:**

| Check                                                          | Resultado                                                                               |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------- |
| Idioma bate (en)                                               | ✅ (obtido=en)                                                                          |
| Persona bate (experiente)                                      | ✅ (obtido=experiente)                                                                  |
| Formato em harvard                                             | hibrido                                                                                 | ✅ (obtido=harvard) |
| Nome do cadastro usado                                         | ✅ (obtido=Carlos Mendes)                                                               |
| Email do cadastro usado                                        | ✅ (obtido=carlos.mendes@email.com)                                                     |
| Habilidades mencionam "Kubernetes"                             | ✅                                                                                      |
| Habilidades mencionam "Kotlin"                                 | ✅                                                                                      |
| Sem fantasia "Empresa Exemplo"                                 | ✅                                                                                      |
| Sem fantasia "Acme Corp"                                       | ✅                                                                                      |
| Sem fantasia "lorem"                                           | ✅                                                                                      |
| EN sem vazamento de PT em objetivo.cargo                       | ✅ ("Senior Software Engineer")                                                         |
| EN sem vazamento de PT em objetivo.area                        | ✅ ("infrastructure")                                                                   |
| EN sem vazamento de PT em objetivo.nivel                       | ✅ ("Senior")                                                                           |
| EN sem vazamento de PT em resumoProfissional                   | ✅ ("Experienced Senior Software Engineer with 8 years in backend and infrastructure.") |
| EN sem vazamento de PT em formacao[0].curso                    | ✅ ("Bachelor's in Computer Engineering")                                               |
| EN sem vazamento de PT em formacao[0].status                   | ✅ ("completed")                                                                        |
| EN sem vazamento de PT em experiencias[0].responsabilidades[0] | ✅ ("Led migration of job orchestrator to Kubernetes")                                  |
| EN sem vazamento de PT em experiencias[0].responsabilidades[1] | ✅ ("Reduced infrastructure costs by 30%")                                              |
| EN sem vazamento de PT em experiencias[0].responsabilidades[2] | ✅ ("Improved p99 latency of queues from 500ms to 80ms")                                |
| EN sem vazamento de PT em experiencias[1].responsabilidades[0] | ✅ ("Scaled the boleto system to process 5x more transactions")                         |
| EN sem vazamento de PT em experiencias[2].responsabilidades[0] | ✅ ("Consulted for financial clients, primarily working with Java and microservices")   |
| EN sem vazamento de PT em idiomas[0].idioma                    | ✅ ("Portuguese")                                                                       |
| EN sem vazamento de PT em idiomas[0].nivel                     | ✅ ("Native")                                                                           |
| EN sem vazamento de PT em idiomas[1].idioma                    | ✅ ("English")                                                                          |
| EN sem vazamento de PT em idiomas[1].nivel                     | ✅ ("Fluent")                                                                           |
| EN sem vazamento de PT em idiomas[2].idioma                    | ✅ ("Spanish")                                                                          |
| EN sem vazamento de PT em idiomas[2].nivel                     | ✅ ("Intermediate")                                                                     |

<details><summary>JSON do currículo</summary>

```json
{
  "dadosPessoais": {
    "nome": "Carlos Mendes",
    "email": "carlos.mendes@email.com",
    "telefone": "+55 11 99888-7766",
    "linkedin": "linkedin.com/in/carlos-mendes",
    "github": "github.com/cmendes",
    "cidade": "São Paulo SP"
  },
  "objetivo": {
    "cargo": "Senior Software Engineer",
    "area": "infrastructure",
    "nivel": "Senior"
  },
  "idioma": "en",
  "formato": "harvard",
  "persona": "experiente",
  "resumoProfissional": "Experienced Senior Software Engineer with 8 years in backend and infrastructure. Strong expertise in cloud technologies and performance optimization, aiming to contribute to innovative projects at Google.",
  "formacao": [
    {
      "curso": "Bachelor's in Computer Engineering",
      "instituicao": "USP",
      "periodo": null,
      "status": "completed"
    }
  ],
  "experiencias": [
    {
      "empresa": "Nubank",
      "cargo": "Staff Engineer",
      "periodo": "2021 - Present",
      "responsabilidades": [
        "Led migration of job orchestrator to Kubernetes",
        "Reduced infrastructure costs by 30%",
        "Improved p99 latency of queues from 500ms to 80ms"
      ],
      "conquistas": []
    },
    {
      "empresa": "iFood",
      "cargo": "Senior Backend Engineer",
      "periodo": "2018 - 2021",
      "responsabilidades": [
        "Scaled the boleto system to process 5x more transactions"
      ],
      "conquistas": []
    },
    {
      "empresa": "ThoughtWorks",
      "cargo": "Software Engineer",
      "periodo": "2017 - 2018",
      "responsabilidades": [
        "Consulted for financial clients, primarily working with Java and microservices"
      ],
      "conquistas": []
    }
  ],
  "projetos": [
    {
      "nome": "rufus-rs",
      "descricao": null,
      "tecnologias": ["Rust"],
      "link": null
    }
  ],
  "habilidades": [
    "Kotlin",
    "Java",
    "Go",
    "Rust",
    "Kubernetes",
    "AWS",
    "Kafka",
    "PostgreSQL",
    "Redis",
    "Terraform",
    "observability tools (Grafana, Prometheus)"
  ],
  "idiomas": [
    {
      "idioma": "Portuguese",
      "nivel": "Native"
    },
    {
      "idioma": "English",
      "nivel": "Fluent"
    },
    {
      "idioma": "Spanish",
      "nivel": "Intermediate"
    }
  ],
  "certificacoes": null
}
```

</details>

### Rodada 3 (6.6s, in=3944t, out=604t)

Schema válido ✅

**Checks semânticos:**

| Check                                                          | Resultado                                                                               |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------- |
| Idioma bate (en)                                               | ✅ (obtido=en)                                                                          |
| Persona bate (experiente)                                      | ✅ (obtido=experiente)                                                                  |
| Formato em harvard                                             | hibrido                                                                                 | ✅ (obtido=harvard) |
| Nome do cadastro usado                                         | ✅ (obtido=Carlos Mendes)                                                               |
| Email do cadastro usado                                        | ✅ (obtido=carlos.mendes@email.com)                                                     |
| Habilidades mencionam "Kubernetes"                             | ✅                                                                                      |
| Habilidades mencionam "Kotlin"                                 | ✅                                                                                      |
| Sem fantasia "Empresa Exemplo"                                 | ✅                                                                                      |
| Sem fantasia "Acme Corp"                                       | ✅                                                                                      |
| Sem fantasia "lorem"                                           | ✅                                                                                      |
| EN sem vazamento de PT em objetivo.cargo                       | ✅ ("Senior Software Engineer")                                                         |
| EN sem vazamento de PT em objetivo.area                        | ✅ ("infrastructure")                                                                   |
| EN sem vazamento de PT em objetivo.nivel                       | ✅ ("Senior")                                                                           |
| EN sem vazamento de PT em resumoProfissional                   | ✅ ("Experienced Senior Software Engineer with 8 years in backend development and inf") |
| EN sem vazamento de PT em formacao[0].curso                    | ✅ ("Bachelor's in Computer Engineering")                                               |
| EN sem vazamento de PT em formacao[0].status                   | ✅ ("completed")                                                                        |
| EN sem vazamento de PT em experiencias[0].responsabilidades[0] | ✅ ("Led the migration of the job orchestrator to Kubernetes.")                         |
| EN sem vazamento de PT em experiencias[0].conquistas[0]        | ✅ ("Reduced infrastructure costs by 30%.")                                             |
| EN sem vazamento de PT em experiencias[0].conquistas[1]        | ✅ ("Improved p99 latency of queues from 500ms to 80ms.")                               |
| EN sem vazamento de PT em experiencias[1].responsabilidades[0] | ✅ ("Worked on the payments team.")                                                     |
| EN sem vazamento de PT em experiencias[1].conquistas[0]        | ✅ ("Scaled the boleto system to process 5x more transactions.")                        |
| EN sem vazamento de PT em experiencias[2].responsabilidades[0] | ✅ ("Consulted for financial clients.")                                                 |
| EN sem vazamento de PT em experiencias[2].conquistas[0]        | ✅ ("Worked mainly with Java and microservices.")                                       |
| EN sem vazamento de PT em idiomas[0].idioma                    | ✅ ("Portuguese")                                                                       |
| EN sem vazamento de PT em idiomas[0].nivel                     | ✅ ("Native")                                                                           |
| EN sem vazamento de PT em idiomas[1].idioma                    | ✅ ("English")                                                                          |
| EN sem vazamento de PT em idiomas[1].nivel                     | ✅ ("Fluent")                                                                           |
| EN sem vazamento de PT em idiomas[2].idioma                    | ✅ ("Spanish")                                                                          |
| EN sem vazamento de PT em idiomas[2].nivel                     | ✅ ("Intermediate")                                                                     |

<details><summary>JSON do currículo</summary>

```json
{
  "dadosPessoais": {
    "nome": "Carlos Mendes",
    "email": "carlos.mendes@email.com",
    "telefone": "+55 11 99888-7766",
    "linkedin": "linkedin.com/in/carlos-mendes",
    "github": "github.com/cmendes",
    "cidade": "São Paulo SP"
  },
  "objetivo": {
    "cargo": "Senior Software Engineer",
    "area": "infrastructure",
    "nivel": "Senior"
  },
  "idioma": "en",
  "formato": "harvard",
  "persona": "experiente",
  "resumoProfissional": "Experienced Senior Software Engineer with 8 years in backend development and infrastructure. Proven track record in leading projects and optimizing systems for performance and cost efficiency.",
  "formacao": [
    {
      "curso": "Bachelor's in Computer Engineering",
      "instituicao": "USP",
      "periodo": null,
      "status": "completed"
    }
  ],
  "experiencias": [
    {
      "empresa": "Nubank",
      "cargo": "Staff Engineer",
      "periodo": "2021 - Present",
      "responsabilidades": [
        "Led the migration of the job orchestrator to Kubernetes."
      ],
      "conquistas": [
        "Reduced infrastructure costs by 30%.",
        "Improved p99 latency of queues from 500ms to 80ms."
      ]
    },
    {
      "empresa": "iFood",
      "cargo": "Senior Backend Engineer",
      "periodo": "2018 - 2021",
      "responsabilidades": ["Worked on the payments team."],
      "conquistas": [
        "Scaled the boleto system to process 5x more transactions."
      ]
    },
    {
      "empresa": "ThoughtWorks",
      "cargo": "Software Engineer",
      "periodo": "2017 - 2018",
      "responsabilidades": ["Consulted for financial clients."],
      "conquistas": ["Worked mainly with Java and microservices."]
    }
  ],
  "projetos": [],
  "habilidades": [
    "Kotlin",
    "Java",
    "Go",
    "Rust",
    "Kubernetes",
    "AWS",
    "Kafka",
    "PostgreSQL",
    "Redis",
    "Terraform",
    "observability tools (Grafana, Prometheus)"
  ],
  "idiomas": [
    {
      "idioma": "Portuguese",
      "nivel": "Native"
    },
    {
      "idioma": "English",
      "nivel": "Fluent"
    },
    {
      "idioma": "Spanish",
      "nivel": "Intermediate"
    }
  ],
  "certificacoes": null
}
```

</details>

---

## R4 · Júnior PT com campos qualificadores faltando (reproduz 502 da Fase 3)

**Login context:** `[dados do cadastro] Nome: Joana Lima, Email: joana.lima@email.com, Gênero: feminino`

### Rodada 1 (4.3s, in=3808t, out=357t)

Schema válido ✅

**Checks semânticos:**

| Check                                                              | Resultado                                                                                                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Idioma bate (pt-BR)                                                | ✅ (obtido=pt-BR)                                                                                                                               |
| Persona bate (junior)                                              | ✅ (obtido=junior)                                                                                                                              |
| Formato em hibrido                                                 | ✅ (obtido=hibrido)                                                                                                                             |
| Nome do cadastro usado                                             | ✅ (obtido=Joana Lima)                                                                                                                          |
| Email do cadastro usado                                            | ✅ (obtido=joana.lima@email.com)                                                                                                                |
| Habilidades mencionam "Node.js"                                    | ✅                                                                                                                                              |
| Habilidades mencionam "PostgreSQL"                                 | ✅                                                                                                                                              |
| Sem fantasia "Empresa Exemplo"                                     | ✅                                                                                                                                              |
| Sem fantasia "Udemy"                                               | ✅                                                                                                                                              |
| Sem fantasia "Coursera"                                            | ✅                                                                                                                                              |
| Sem fantasia "Alura"                                               | ✅                                                                                                                                              |
| Sem fantasia "2020"                                                | ✅                                                                                                                                              |
| Sem fantasia "2021"                                                | ✅                                                                                                                                              |
| Sem fantasia "2022"                                                | ✅                                                                                                                                              |
| Sem fantasia "2023"                                                | ✅                                                                                                                                              |
| Campo nullable "experiencias[0].periodo" veio null (não inventado) | ✅ (null)                                                                                                                                       |
| Campo nullable "formacao[0].instituicao" veio null (não inventado) | ✅ (null)                                                                                                                                       |
| Campo nullable "formacao[0].periodo" veio null (não inventado)     | ✅ (null)                                                                                                                                       |
| Resumo profissional escrito em português                           | ✅ (resumo[:120]="Desenvolvedora Backend Júnior com experiência em Node.js e PostgreSQL. Habilidade em trabalhar com API REST e em equipe ...") |

<details><summary>JSON do currículo</summary>

```json
{
  "dadosPessoais": {
    "nome": "Joana Lima",
    "email": "joana.lima@email.com",
    "telefone": null,
    "linkedin": null,
    "github": null,
    "cidade": null
  },
  "objetivo": {
    "cargo": "Desenvolvedora Backend Júnior",
    "area": "backend",
    "nivel": "júnior"
  },
  "idioma": "pt-BR",
  "formato": "hibrido",
  "persona": "junior",
  "resumoProfissional": "Desenvolvedora Backend Júnior com experiência em Node.js e PostgreSQL. Habilidade em trabalhar com API REST e em equipe de produto.",
  "formacao": [
    {
      "curso": "Cursos de Programação Online",
      "instituicao": null,
      "periodo": null,
      "status": null
    }
  ],
  "experiencias": [
    {
      "empresa": "Acme Solutions",
      "cargo": "Desenvolvedora Backend Júnior",
      "periodo": null,
      "responsabilidades": [
        "Trabalhar com Node.js e PostgreSQL",
        "Desenvolver e manter API REST"
      ],
      "conquistas": []
    }
  ],
  "projetos": [],
  "habilidades": ["Node.js", "PostgreSQL", "JavaScript", "Git", "API REST"],
  "idiomas": [
    {
      "idioma": "Português",
      "nivel": "Nativo"
    }
  ],
  "certificacoes": null
}
```

</details>

### Rodada 2 (4.3s, in=3808t, out=366t)

Schema válido ✅

**Checks semânticos:**

| Check                                                              | Resultado                                                                                                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Idioma bate (pt-BR)                                                | ✅ (obtido=pt-BR)                                                                                                                               |
| Persona bate (junior)                                              | ✅ (obtido=junior)                                                                                                                              |
| Formato em hibrido                                                 | ✅ (obtido=hibrido)                                                                                                                             |
| Nome do cadastro usado                                             | ✅ (obtido=Joana Lima)                                                                                                                          |
| Email do cadastro usado                                            | ✅ (obtido=joana.lima@email.com)                                                                                                                |
| Habilidades mencionam "Node.js"                                    | ✅                                                                                                                                              |
| Habilidades mencionam "PostgreSQL"                                 | ✅                                                                                                                                              |
| Sem fantasia "Empresa Exemplo"                                     | ✅                                                                                                                                              |
| Sem fantasia "Udemy"                                               | ✅                                                                                                                                              |
| Sem fantasia "Coursera"                                            | ✅                                                                                                                                              |
| Sem fantasia "Alura"                                               | ✅                                                                                                                                              |
| Sem fantasia "2020"                                                | ✅                                                                                                                                              |
| Sem fantasia "2021"                                                | ✅                                                                                                                                              |
| Sem fantasia "2022"                                                | ✅                                                                                                                                              |
| Sem fantasia "2023"                                                | ✅                                                                                                                                              |
| Campo nullable "experiencias[0].periodo" veio null (não inventado) | ✅ (null)                                                                                                                                       |
| Campo nullable "formacao[0].instituicao" veio null (não inventado) | ✅ (null)                                                                                                                                       |
| Campo nullable "formacao[0].periodo" veio null (não inventado)     | ✅ (null)                                                                                                                                       |
| Resumo profissional escrito em português                           | ✅ (resumo[:120]="Desenvolvedora Backend Júnior com experiência em Node.js e PostgreSQL. Habilidade em trabalhar com API REST e Git, busca...") |

<details><summary>JSON do currículo</summary>

```json
{
  "dadosPessoais": {
    "nome": "Joana Lima",
    "email": "joana.lima@email.com",
    "telefone": null,
    "linkedin": null,
    "github": null,
    "cidade": null
  },
  "objetivo": {
    "cargo": "Desenvolvedora Backend Júnior",
    "area": "backend",
    "nivel": "júnior"
  },
  "idioma": "pt-BR",
  "formato": "hibrido",
  "persona": "junior",
  "resumoProfissional": "Desenvolvedora Backend Júnior com experiência em Node.js e PostgreSQL. Habilidade em trabalhar com API REST e Git, buscando contribuir para o time de produto.",
  "formacao": [
    {
      "curso": "Cursos de Programação Online",
      "instituicao": null,
      "periodo": null,
      "status": null
    }
  ],
  "experiencias": [
    {
      "empresa": "Acme Solutions",
      "cargo": "Desenvolvedora Backend Júnior",
      "periodo": null,
      "responsabilidades": [
        "Trabalhar com Node.js e PostgreSQL no time de produto",
        "Desenvolver e manter API REST"
      ],
      "conquistas": []
    }
  ],
  "projetos": [],
  "habilidades": ["Node.js", "PostgreSQL", "JavaScript", "Git", "API REST"],
  "idiomas": [
    {
      "idioma": "Português",
      "nivel": "Nativo"
    }
  ],
  "certificacoes": null
}
```

</details>

### Rodada 3 (4.5s, in=3808t, out=363t)

Schema válido ✅

**Checks semânticos:**

| Check                                                              | Resultado                                                                                                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Idioma bate (pt-BR)                                                | ✅ (obtido=pt-BR)                                                                                                                               |
| Persona bate (junior)                                              | ✅ (obtido=junior)                                                                                                                              |
| Formato em hibrido                                                 | ✅ (obtido=hibrido)                                                                                                                             |
| Nome do cadastro usado                                             | ✅ (obtido=Joana Lima)                                                                                                                          |
| Email do cadastro usado                                            | ✅ (obtido=joana.lima@email.com)                                                                                                                |
| Habilidades mencionam "Node.js"                                    | ✅                                                                                                                                              |
| Habilidades mencionam "PostgreSQL"                                 | ✅                                                                                                                                              |
| Sem fantasia "Empresa Exemplo"                                     | ✅                                                                                                                                              |
| Sem fantasia "Udemy"                                               | ✅                                                                                                                                              |
| Sem fantasia "Coursera"                                            | ✅                                                                                                                                              |
| Sem fantasia "Alura"                                               | ✅                                                                                                                                              |
| Sem fantasia "2020"                                                | ✅                                                                                                                                              |
| Sem fantasia "2021"                                                | ✅                                                                                                                                              |
| Sem fantasia "2022"                                                | ✅                                                                                                                                              |
| Sem fantasia "2023"                                                | ✅                                                                                                                                              |
| Campo nullable "experiencias[0].periodo" veio null (não inventado) | ✅ (null)                                                                                                                                       |
| Campo nullable "formacao[0].instituicao" veio null (não inventado) | ✅ (null)                                                                                                                                       |
| Campo nullable "formacao[0].periodo" veio null (não inventado)     | ✅ (null)                                                                                                                                       |
| Resumo profissional escrito em português                           | ✅ (resumo[:120]="Desenvolvedora Backend Júnior com experiência em Node.js e PostgreSQL. Habilidade em trabalhar com API REST e versioname...") |

<details><summary>JSON do currículo</summary>

```json
{
  "dadosPessoais": {
    "nome": "Joana Lima",
    "email": "joana.lima@email.com",
    "telefone": null,
    "linkedin": null,
    "github": null,
    "cidade": null
  },
  "objetivo": {
    "cargo": "Desenvolvedora Backend Júnior",
    "area": "backend",
    "nivel": "júnior"
  },
  "idioma": "pt-BR",
  "formato": "hibrido",
  "persona": "junior",
  "resumoProfissional": "Desenvolvedora Backend Júnior com experiência em Node.js e PostgreSQL. Habilidade em trabalhar com API REST e versionamento de código usando Git.",
  "formacao": [
    {
      "curso": "Cursos de Programação Online",
      "instituicao": null,
      "periodo": null,
      "status": null
    }
  ],
  "experiencias": [
    {
      "empresa": "Acme Solutions",
      "cargo": "Desenvolvedora Backend Júnior",
      "periodo": null,
      "responsabilidades": [
        "Trabalhar com Node.js e PostgreSQL no time de produto",
        "Desenvolver e manter API REST"
      ],
      "conquistas": []
    }
  ],
  "projetos": [],
  "habilidades": ["Node.js", "PostgreSQL", "JavaScript", "Git", "API REST"],
  "idiomas": [
    {
      "idioma": "Português",
      "nivel": "Nativo"
    }
  ],
  "certificacoes": null
}
```

</details>
