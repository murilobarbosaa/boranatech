# Relatorio de Adicao de Cursos Gratuitos

Documento vivo. Registra cada lote de cursos adicionados ao catalogo (`client/src/lib/data.ts`, array `cursosGratuitos`) e a sincronizacao com a tabela `courses` do Supabase.

Arquivo unico alterado por lote: `client/src/lib/data.ts`.
Sincronizacao Supabase: `upsert` por `slug` apenas das linhas novas (nao roda o seed completo, para nao sobrescrever tecnologias, plataformas e projetos em producao).
Mapeamento de certificado (shape estatico): `certificate: "sim" | "nao" | "nao_informado"`. Area de seguranca usa o slug real do projeto: `ciberseguranca`.

## Resumo geral

| Lote | Tema | Commit | Candidatos | Inseridos | Duplicatas | Reprovados no curl | Supabase |
| ---- | ---- | ------ | ---------- | --------- | ---------- | ------------------ | -------- |
| 1 | Cursos gratuitos por area | `0183502` | 35 | 5 | 16 | 13 (mais 1 sem conteudo confirmavel) | sincronizado |
| 2 | 50 cursos de ciberseguranca | `3f4037e` | 50 | 19 | 6 | 25 | sincronizado |
| 3 | 50 cursos de IA e machine learning | `0103e38` | 50 | 33 | 7 | 8 (mais 1 sem conteudo confirmavel) | sincronizado |
| 4 | 50 cursos de QA e testes | `3331568` | 50 | 2 | 1 | 47 (30 por 404/timeout, 17 URLs de YouTube fabricadas) | sincronizado |
| 5 | 100 cursos de front-end e back-end | (pendente) | 100 | 14 | 7 | 79 (ver detalhamento) | nao sincronizado |

Total inserido ate agora: 73 cursos.
Tabela `courses` no Supabase: 20 linhas curadas pre-existentes, agora 79 (59 novas). Lote 5 ainda nao sincronizado.

---

## Lote 1: Cursos gratuitos por area

Commit: `0183502` feat(cursos): add free courses by tech area.
Metodo de verificacao: `curl -sIL` (cadeia de status) com fallback `GET -A "Mozilla/5.0"` para 404 e 403.

### Inseridos (5)

| id | titulo | plataforma | area | certificate |
| -- | ------ | ---------- | ---- | ----------- |
| curso-fcc-full-stack | Full Stack Web Developer | freeCodeCamp | fullstack | sim |
| curso-yt-devops-na-pratica | Docker e Kubernetes | DevOps na Pratica (YouTube) | devops | nao |
| curso-unity-essentials | Unity Essentials | Unity Learn | gamedev | nao_informado |
| curso-yt-gdquest | Godot Tutorials | GDQuest (YouTube) | gamedev | nao |
| curso-sebrae-online | Cursos SEBRAE | SEBRAE | carreira (areaSlug null) | nao_informado |

### Nao inseridos por URL reprovada no curl (17)

404 real: HTML5 e CSS3 Modulo 1 (Curso em Video), Formacao React Developer (DIO), Python Mundo 1 (Curso em Video), Introducao ao Python no Azure (Microsoft), PHP Iniciante (Curso em Video), Formacao Java Developer (DIO), IA no Azure (Microsoft), MySQL Completo (Curso em Video), Seguranca e Conformidade (Microsoft), Formacao Flutter Specialist (DIO), Bootcamp Testes de Software (DIO), Intro to Data Science (Kaggle, HEAD 404 e GET apenas parede de reCAPTCHA).

Timeout 000 (3 tentativas): Introducao a Programacao (Fundacao Bradesco), Elements of AI (elementsofai.com.br), Seguranca da Informacao (Fundacao Bradesco), Ingles para TI (Fundacao Bradesco), Comunicacao Assertiva (Fundacao Bradesco).

Observacao: todo o dominio `escolavirtual.bradesco.com.br` nao respondeu deste ambiente. Vale reconferir num navegador antes de descartar de vez.

### Nao inseridos por ja existirem no catalogo (duplicatas, URL ok)

Algoritmos (Curso em Video), JavaScript Completo (Curso em Video), Responsive Web Design (freeCodeCamp), Trilha Full Stack Rocketseat (YouTube), Google Data Analytics (Coursera), Intro to Machine Learning (Kaggle), Intro to SQL (Kaggle), AWS Cloud Practitioner Essentials (Skill Builder), AZ-900 Conceitos Azure (Microsoft), Google UX Design (Coursera), Android Basics with Compose (Android Developers), Git e GitHub (Curso em Video).

### Nao inserido por conteudo nao confirmavel (1)

Figma Tutoriais (Curso em Video no YouTube): URL do canal responde 200, mas a busca no canal nao retornou nenhum video de Figma. Rotular como curso de Figma seria inventar conteudo.

---

## Lote 2: 50 cursos de ciberseguranca

Commit: `3f4037e` feat(cursos): add 50 cybersecurity courses across all specializations.
Metodo de verificacao: `curl -sL --max-time 10 -A "Mozilla/5.0" <url> -o /dev/null -w "%{http_code}"`. 403 com dominio reconhecivel foi aprovado com ressalva (bloqueio de bot). 000 reconferido 3 vezes.
Todos com `areaSlug: "ciberseguranca"`.

### Inseridos (19)

| id | titulo | plataforma | certificate | idioma |
| -- | ------ | ---------- | ----------- | ------ |
| curso-sec-ibm-analyst | IBM Cybersecurity Analyst | Coursera | nao | Ingles |
| curso-sec-network-defense | Network Defense | Cisco NetAcad | sim | Ingles |
| curso-sec-fortinet-fortigate | Introducao ao FortiGate e Firewalls | Fortinet Training | sim | Ingles |
| curso-sec-packet-tracer | Introducao ao Cisco Packet Tracer | Cisco NetAcad | sim | Ingles |
| curso-sec-network-security-coursera | Network Security | Coursera | nao | Ingles |
| curso-sec-aws-networking | AWS Networking Basics | AWS Skill Builder | sim | Ingles |
| curso-sec-ms-security-operations | Gerenciar operacoes de seguranca no Azure | Microsoft Learn | sim | Portugues |
| curso-sec-gcp-workspace | Seguranca e Privacidade no Google Workspace | Google Cloud Skills Boost | sim | Ingles |
| curso-sec-gcp-iam | IAM no Google Cloud | Google Cloud Skills Boost | sim | Ingles |
| curso-sec-crypto-stanford | Cryptography I (Stanford) | Coursera | nao | Ingles |
| curso-sec-gcp-security | Seguranca no Google Cloud | Google Cloud Skills Boost | sim | Ingles |
| curso-sec-aws-governance | AWS Security Governance at Scale | AWS Skill Builder | sim | Ingles |
| curso-sec-ms-cloud-data | Proteger seus dados na nuvem | Microsoft Learn | sim | Portugues |
| curso-sec-aws-threat-detection | AWS Threat Detection Essentials | AWS Skill Builder | sim | Ingles |
| curso-sec-gcp-kms | Criptografia e KMS no Google Cloud | Google Cloud Skills Boost | sim | Ingles |
| curso-sec-aws-ec2 | Amazon EC2 Security Best Practices | AWS Skill Builder | sim | Ingles |
| curso-sec-cyberops | CyberOps Associate | Cisco NetAcad | sim | Ingles |
| curso-sec-fortinet-ransomware | Defesa contra Ransomware | Fortinet Training | sim | Ingles |
| curso-sec-iot | IoT Security | Cisco NetAcad | sim | Ingles |

Certificado marcado como `nao` nos 3 de auditoria gratuita (IBM Cybersecurity Analyst, Network Security da Coursera, Cryptography I de Stanford). Os dois cursos Fortinet usam a mesma URL geral (`training.fortinet.com/`) com nomes distintos.

Aprovados com ressalva (403, dominio confirmado, bloqueio de bot): Seguranca e Privacidade no Google Workspace, Seguranca no Google Cloud, Criptografia e KMS no Google Cloud (todos cloudskillsboost.google, dominio confirmado por outro template que respondeu 200).

### Nao inseridos por duplicata (6)

| # | Curso proposto | Ja existe como |
| - | -------------- | -------------- |
| 1 | Introducao a Ciberseguranca (Cisco) | Introduction to Cybersecurity (Cisco NetAcad) |
| 2 | Fundamentos de Ciberseguranca (Cisco) | Cybersecurity Essentials (Cisco NetAcad) |
| 5 | Google Cybersecurity Certificate (Coursera) | Google Cybersecurity Professional Certificate (Coursera) |
| 9 | Seguranca da Informacao PT (freeCodeCamp) | Information Security (freeCodeCamp) |
| 31 | AWS Security Fundamentals (Skill Builder) | AWS Security Fundamentals (AWS Skill Builder) |
| 49 | Pentesting Fundamentos (freeCodeCamp) | Information Security (freeCodeCamp), mesma URL |

### Nao inseridos por URL reprovada no curl (25)

404 real (22): SC-900 (Microsoft, #4), Ciberseguranca para Iniciantes (Fortinet public_courses.php, #7), Seguranca de SO (Microsoft, #10), Seguranca de Rede Azure (Microsoft, #13), Redes Hibridas (Microsoft, #14), Redes Sem Fio (Microsoft, #16), Switch e Roteadores (Microsoft, #18), VPN (Microsoft, #19), IAM Azure (Microsoft, #21), Protecao de Dados e Governanca (Microsoft, #22), Conformidade Insider Risk (Microsoft, #28), Auditoria de Sistemas (Coursera, #29), Acesso Privilegiado (Microsoft, #30), AZ-500 (Microsoft, #32), CSPM Defender (Microsoft, #34), Arquitetura Seg. Hibrida (Microsoft, #39), Microsoft Sentinel SIEM (Microsoft, #42), Resposta a Incidentes (Microsoft, #43), Threat Hunting Sentinel (Microsoft, #44), Deteccao de Malware (Coursera, #45), Seguranca de APIs (Microsoft, #46), DevSecOps (Microsoft, #50).

Timeout 000 (3): Seguranca da Informacao (Bradesco, #3), Seguranca na Internet (Bradesco, #8), LGPD na Pratica (Bradesco, #24).

Observacao: a maioria dos 404 sao paths do Microsoft Learn que foram reorganizados. Os 3 timeouts sao todos do dominio da Fundacao Bradesco, que nao responde deste ambiente.

---

## Lote 3: 50 cursos de IA e machine learning

Commit: `0103e38` feat(cursos): add 50 ai and machine learning courses.
Metodo de verificacao: `curl -sL --max-time 10 -A "Mozilla/5.0" <url> -o /dev/null -w "%{http_code}"`. 403 em dominios reconhecidos aprovado com ressalva (bloqueio de bot). Todos com `areaSlug: "ia"`.

Resultado do curl: 35 responderam 200, 6 responderam 403 (cloudskillsboost.google, dominio confirmado, aprovados com ressalva), 8 responderam 404 e 1 deu timeout 000.

### Inseridos (33)

Fundamentos e generativa: Introduction to Artificial Intelligence (IBM, Coursera, cert nao), AI for Everyone (DeepLearning.AI, Coursera, cert nao), Fundamentos de IA Generativa (Google Cloud Skills Boost, sim), Etica e IA Responsavel (Microsoft Learn, sim), Como a IA Funciona AI for Oceans (Code.org, nao), Introducao ao Machine Learning (Microsoft Learn, sim), Principios de IA Responsavel (Google Cloud Skills Boost, sim), Introduction to Large Language Models (Google Cloud Skills Boost, sim), Prompt Engineering (Vanderbilt, Coursera, nao), Introduction to Image Generation (Google Cloud Skills Boost, sim), Desenvolvendo com a API do Gemini (Google Cloud Skills Boost, sim), Introduction to Generative AI Studio (Google Cloud Skills Boost, sim), Google Cloud Generative AI Learning Path (Google Cloud Skills Boost, sim).

Machine learning e deep learning: Intermediate Machine Learning (Kaggle, sim), Supervised Machine Learning (Stanford e DeepLearning.AI, Coursera, nao), Advanced Learning Algorithms (Stanford e DeepLearning.AI, Coursera, nao), Unsupervised Learning Recommenders Reinforcement (Stanford e DeepLearning.AI, Coursera, nao), AWS Machine Learning Foundations (AWS Skill Builder, sim), Treinar e avaliar modelos de regressao (Microsoft Learn, sim), Neural Networks and Deep Learning (DeepLearning.AI, Coursera, nao), Structuring Machine Learning Projects (DeepLearning.AI, Coursera, nao), Convolutional Neural Networks (DeepLearning.AI, Coursera, nao), Sequence Models (DeepLearning.AI, Coursera, nao), Fundamentos do PyTorch (Microsoft Learn, sim), Redes Neurais Recorrentes (Google Cloud Skills Boost, sim).

Visao, NLP e engenharia de IA: Natural Language Processing (Kaggle, sim), Visao Computacional no Azure (Microsoft Learn, sim), NLP com Servicos Cognitivos (Microsoft Learn, sim), Solucoes de IA com Azure OpenAI (Microsoft Learn, sim), Encoder-Decoder Architecture (Google Cloud Skills Boost, sim), Attention Mechanism (Google Cloud Skills Boost, sim), Transformer Models e BERT (Google Cloud Skills Boost, sim), Sistemas RAG (Google Cloud Skills Boost, sim).

Certificado marcado como `nao` nos 9 de auditoria gratuita da Coursera e nos 2 do Code.org e afins que nao emitem certificado. Todos os cursos do Kaggle, Microsoft Learn, Google Cloud Skills Boost e AWS Skill Builder ficaram como `sim`.

Aprovados com ressalva (403, dominio confirmado): Fundamentos de IA Generativa (556), Introduction to Large Language Models (540), Desenvolvendo com a API do Gemini (983), Redes Neurais Recorrentes (544), Attention Mechanism (545), Transformer Models e BERT (546), todos cloudskillsboost.google.

### Nao inseridos por duplicata (7)

| # | Curso proposto | Ja existe como |
| - | -------------- | -------------- |
| 1 | Elementos de IA (University of Helsinki) | Elements of AI (University of Helsinki). Alem disso o curl deu timeout 000. |
| 11 | Introduction to Generative AI (Google Cloud Skills Boost) | Introduction to Generative AI (Google Cloud) |
| 19 | Generative AI for Beginners (Microsoft GitHub) | IA Generativa para Iniciantes serie de 18 licoes (Microsoft), mesmo curso |
| 21 | Intro to Machine Learning (Kaggle) | Intro to Machine Learning (Kaggle) |
| 23 | Feature Engineering (Kaggle) | Feature Engineering (Kaggle) |
| 28 | Machine Learning com Python (freeCodeCamp) | Machine Learning with Python Certification (freeCodeCamp) |
| 31 | Intro to Deep Learning (Kaggle) | Intro to Deep Learning (Kaggle) |
| 41 | Computer Vision (Kaggle) | Computer Vision (Kaggle) |

### Nao inseridos por URL reprovada no curl (8)

404 real: IA no Azure Introducao (Microsoft, #2), IA Generativa com Microsoft Copilot (Microsoft, #17), Construindo Copilotos Copilot Studio (Microsoft, #18), ML sem Codigo Azure ML Studio (Microsoft, #24), Redes Neurais com TensorFlow (Microsoft, #37), Deep Learning TensorFlow e Keras (freeCodeCamp news, #38), Redes Neurais do Zero (freeCodeCamp news, #39), Processamento de Fala TTS e STT (Microsoft, #45).

Timeout 000: Elementos de IA (elementsofai.com.br, #1), que tambem e duplicata.

### Nao inserido por conteudo divergente (1)

Introducao a IA Cisco NetAcad (#5): a URL responde 200, mas aponta para o curso Introduction to IoT and Digital Transformation, que e de IoT e nao de IA. O nome proposto nao corresponde ao conteudo, entao foi descartado para nao inventar dado.

---

## Lote 4: 50 cursos de QA e testes

Commit: `3331568` feat(cursos): add 50 qa and software testing courses.
Metodo de verificacao: `curl -sL --max-time 10 -A "Mozilla/5.0"`. Para as URLs de YouTube houve verificacao extra de existencia real, porque o YouTube responde 200 mesmo para playlist ou video inexistente. Videos checados via endpoint oembed (200 existe, 404 nao existe) e playlists via feed RSS `feeds/videos.xml?playlist_id=` (200 existe, 404 nao existe). O metodo foi validado com controles reais (video e playlist que existem retornaram 200).

Este lote tinha a maior parte das URLs invalidas. Todos com `areaSlug: "qa"`.

### Inseridos (2)

| id | titulo | plataforma | certificate | idioma |
| -- | ------ | ---------- | ----------- | ------ |
| curso-qa-intro-software-testing | Introduction to Software Testing | Coursera (University of Minnesota) | nao | Ingles |
| curso-qa-github-actions-cicd | Automatizar fluxos com GitHub Actions | Microsoft Learn | sim | Portugues |

Certificado marcado como `nao` no curso da Coursera (auditoria gratuita) e `sim` na trilha da Microsoft Learn.

### Nao inseridos por duplicata (1)

| # | Curso proposto | Ja existe como |
| - | -------------- | -------------- |
| 6 | Conceitos de QA PT (freeCodeCamp) | Quality Assurance Certification (freeCodeCamp), mesma certificacao |

### Nao inseridos por URL de YouTube fabricada (17)

Todas as 17 URLs de YouTube retornaram 200 no curl simples, mas a verificacao de existencia real mostrou que nenhuma resolve para conteudo valido (playlist ou video inexistente). Descartadas para nao inventar material:

Playlists (12): #5 Teste de Software Julio de Lima, #14 Cypress Agilizei, #16 Selenium Python Selenium Brasil, #19 Playwright TSQA, #20 Robot Framework Papito Dev, #26 API Postman Julio de Lima, #28 RestAssured Julio de Lima, #29 API Python Selenium Brasil, #37 Appium Julio de Lima, #39 JMeter QALizando, #40 K6 Grafana Labs, #47 Docker DevOps na Pratica.

Videos (5): #9 Gerenciamento de Bugs, #12 Casos de Teste LuizTools, #24 Cucumber e BDD, #34 Database Testing LuizTools, #50 Mutation Testing.

### Nao inseridos por URL reprovada no curl (30)

404 real (28): Introduction to Software Testing freeCodeCamp news (#3), Trilha de QA DIO (#4), Black Box Testing Coursera (#7), White Box Testing Coursera (#8), Testes em Metodos Ageis Microsoft (#10), Automacao com Cypress freeCodeCamp news (#13), Selenium WebDriver Java freeCodeCamp news (#15), Cypress DIO (#17), Playwright freeCodeCamp news (#18), Testes Unitarios com Jest freeCodeCamp news (#21), Testes Unitarios em Angular Microsoft (#22), React Testing Library freeCodeCamp news (#23), Testes de API com Postman freeCodeCamp news (#25), JUnit e Mockito DIO (#27), Testes de Microsservicos Microsoft (#30), PyTest freeCodeCamp news (#31), Testes no Spring Boot Microsoft (#32), Testes Node.js freeCodeCamp news (#33), Testes de Integracao .NET Microsoft (#35), Automacao Mobile com Appium freeCodeCamp news (#36), JMeter freeCodeCamp news (#38), Testes de Acessibilidade freeCodeCamp news (#41), Engenharia do Caos Microsoft (#42), OWASP Top 10 freeCodeCamp news (#43), SAST e DAST Microsoft (#44), Testes no Azure DevOps Microsoft (#46), Testes de UI em Pipelines Microsoft (#48), GitLab CI freeCodeCamp news (#49).

Timeout 000 (2): Fundamentos de Teste de Software Bradesco (#1) e Engenharia de Requisitos para QAs Bradesco (#11). Alem do timeout, as duas URLs tinham slug divergente do tema: #1 apontava para implementando-banco-de-dados e #11 para introducao-a-programacao, ou seja, nao eram cursos de QA.

---

## Lote 5: 100 cursos de front-end e back-end

Commit: (pendente).
Metodo de verificacao: `curl -sL --max-time 12 -A "Mozilla/5.0" <url> -o /dev/null -w "%{http_code}"`, em paralelo. Para os 200 foi feita verificacao extra do `<title>` e da URL final (`url_effective`) para detectar soft-404 e redirecionamento-fantasma, porque varios dominios respondem 200 mesmo quando o curso nao existe mais (Microsoft Learn cai em `/training/browse/`, AWS Skill Builder cai em uma busca com `showRedirectNotFoundBanner=true`, cursoemvideo mostra pagina `[VIP]` paga). freeCodeCamp `/learn/` validado com controle negativo (slug falso retorna 404).

50 front-end com `areaSlug: "frontend"`, 50 back-end com `areaSlug: "backend"` (o arquivo usa `areaSlug`, sem hifen, nao `area: "front-end"` como no prompt). O shape do arquivo nao tem campo `gratuito`; todo o array `cursosGratuitos` ja e de cursos gratuitos.

Resultado do curl: 200 aprovados no HTTP, mas destes 6 eram soft-404 / redirecionamento-fantasma e 2 eram paginas pagas `[VIP]`; o restante 404 real ou 000 (timeout). Total inserido: 14.

### Inseridos (14)

| id | titulo | plataforma | areaSlug | certificate | idioma |
| -- | ------ | ---------- | -------- | ----------- | ------ |
| curso-fe-tailwind-css | Tailwind CSS | freeCodeCamp | frontend | nao | Ingles |
| curso-fe-js-algorithms-pt | Algoritmos e Estruturas de Dados em JavaScript | freeCodeCamp | frontend | sim | Portugues |
| curso-fe-react-free-course | React para Iniciantes | freeCodeCamp | frontend | nao | Ingles |
| curso-fe-redux-toolkit | Redux e Redux Toolkit | freeCodeCamp | frontend | nao | Ingles |
| curso-fe-vue-3 | Vue 3 e Composition API | freeCodeCamp | frontend | nao | Ingles |
| curso-fe-axios-react | Consumindo APIs com Axios no React | freeCodeCamp | frontend | nao | Ingles |
| curso-be-fastapi | FastAPI | freeCodeCamp | backend | nao | Ingles |
| curso-be-python-oop | Programacao Orientada a Objetos em Python | freeCodeCamp | backend | nao | Ingles |
| curso-be-spring-boot | Introducao ao Spring Boot | freeCodeCamp | backend | nao | Ingles |
| curso-be-csharp-part-2 | Fundamentos de C#: Colecoes e Metodos | Microsoft Learn | backend | sim | Portugues |
| curso-be-aspnet-core-api | APIs com ASP.NET Core | Microsoft Learn | backend | sim | Portugues |
| curso-be-csharp-beginners | Curso Completo de C# para Iniciantes | freeCodeCamp | backend | nao | Ingles |
| curso-be-rust | Curso Completo de Rust | freeCodeCamp | backend | nao | Ingles |
| curso-be-rest-api-design | Design de API RESTful | freeCodeCamp | backend | nao | Ingles |

Ajustes de titulo para nao inventar conteudo (URL valida, mas o nome proposto nao batia com o material real):
- BE30 (prompt "C# Avancado LINQ e Generics") aponta para "Full C# Course for Beginners" da freeCodeCamp, curso para iniciantes, nao avancado. Renomeado para "Curso Completo de C# para Iniciantes".
- BE27 (prompt URL `build-web-api-net-core`) redireciona 301 para a URL canonica `build-web-api-aspnet-core`; usei a canonica.
- BE26 (prompt "Colecoes e POO em C#") aponta para "Introducao ao C#, Parte 2", que cobre colecoes e metodos; titulo ajustado para "Fundamentos de C#: Colecoes e Metodos".

### Nao inseridos por duplicata (7)

| # | Curso proposto | Ja existe como |
| - | -------------- | -------------- |
| FE5 | Responsive Web Design (freeCodeCamp) | Responsive Web Design (freeCodeCamp), mesma URL |
| FE9 | Responsive Web Design PT (freeCodeCamp) | Certificacao de Design Responsivo para a Web (freeCodeCamp Portugues), mesmo curso |
| FE16 | JavaScript Completo (Curso em Video) | JavaScript / Curso de JavaScript (Curso em Video), mesma URL |
| FE18 | JavaScript Algorithms and Data Structures v8 (freeCodeCamp) | JavaScript Algorithms and Data Structures Certification (freeCodeCamp), mesma URL |
| FE25 | Front End Libraries React Redux (freeCodeCamp) | Front End Development Libraries React (freeCodeCamp), mesma URL |
| BE9 | Back End Development and APIs (freeCodeCamp) | Back End Development and APIs (freeCodeCamp), mesma URL |
| BE24 | Primeiros Passos com C# (Microsoft Learn) | Escreva seu primeiro codigo usando C# (Microsoft Learn), mesma URL `get-started-c-sharp-part-1` |

### Nao inseridos por conteudo pago ou soft-404 / redirecionamento-fantasma (apesar de HTTP 200) (9)

- FE3 HTML5 e CSS3 Modulo 3 (Curso em Video): pagina real, mas titulo `[VIP]`, conteudo pago. Nao e gratuito.
- FE4 HTML5 e CSS3 Modulo 4 (Curso em Video): idem, `[VIP]`, pago.
- FE24 TypeScript com Microsoft Learn: redireciona para `typescriptlang.org` (path da trilha nao existe mais).
- FE28 Construindo Web Apps com React (Microsoft Learn): redireciona para `/training/browse/`.
- FE43 Web Development 101 (Microsoft Learn): redireciona para `/training/browse/`.
- BE13 APIs Web Node.js Express (Microsoft Learn): redireciona para `/training/browse/`.
- BE38 Primeiros Passos com Rust (Microsoft Learn): redireciona para `/training/browse/` (tambem em en-us).
- BE43 Microsservicos e Arquiteturas Escalaveis (Microsoft Learn): redireciona para um doc de arquitetura de "Aplicativo Web Basico" no Azure, que nao e o curso de microsservicos proposto.
- BE50 Serverless na AWS (AWS Skill Builder): redireciona para busca com `showRedirectNotFoundBanner=true`, ou seja, curso nao encontrado.

### Nao inseridos por URL reprovada no curl (70)

404 real front-end (30): FE1 e FE2 HTML5/CSS3 Modulo 1 e 2 (Curso em Video), FE10 Sass, FE11 CSS Flexbox e Grid, FE13 Bootstrap 5, FE14 Animacoes CSS, FE15 SVG, FE20 DOM com JavaScript, FE21 JavaScript Assincrono, FE22 OOP em JavaScript, FE23 TypeScript Completo, FE26 Formacao React Developer (DIO), FE29 React Hooks Avancados, FE30 Gerenciamento de Estado React, FE32 React com TypeScript, FE33 Next.js Moderno, FE34 Front-End Web Development with React (Coursera), FE35 Styling React com Tailwind, FE36 Angular para Iniciantes, FE37 Primeiros Passos com Angular (Microsoft), FE38 Formacao Vue.js Developer (DIO), FE40 Svelte Crash Course, FE41 Vite.js, FE42 Webpack, FE44 Material UI, FE45 Acessibilidade Web, FE46 Performance Web, FE47 HTML5 Canvas, FE48 Chakra UI, FE50 Deploy Front-end. (todos os `/news/` que nao existem sao slugs fabricados)

404 real back-end (36): BE1 a BE3 Python Mundo 1 a 3 (Curso em Video), BE4 Formacao Python Developer (DIO), BE5 Django, BE6 Flask, BE10 Formacao Node.js Developer (DIO), BE11 Node.js Development (Microsoft), BE12 Node.js e Express, BE14 APIs RESTful Express e MongoDB, BE15 NestJS, BE16 GraphQL, BE17 Formacao Java Developer (DIO), BE18 Java para Iniciantes, BE19 Java Avancado, BE21 Microsservicos Java Spring Boot (Microsoft), BE22 Hibernate e JPA, BE23 Spring Security, BE25 Formacao .NET Developer (DIO), BE28 ASP.NET Core MVC, BE29 Entity Framework Core (Microsoft), BE31 PHP Iniciante (Curso em Video), BE32 PHP Moderno M1 (Curso em Video), BE33 PHP para Iniciantes, BE34 Laravel, BE35 PHP OOP, BE36 Go para Iniciantes, BE37 APIs com Go e Gin, BE40 Rust com Actix-Web, BE42 Arquitetura de Microsservicos, BE44 SQL, BE45 MongoDB, BE46 PostgreSQL, BE47 Redis, BE48 Docker, BE49 Seguranca de APIs JWT OAuth2.

Timeout 000 (4): FE6 Design Responsivo HTML5 CSS3, FE7 HTML Basico, FE8 HTML Avancado, FE17 JavaScript Basico, todos da Fundacao Bradesco (`escolavirtual.bradesco.com.br`), dominio que segue sem responder deste ambiente (mesmo padrao dos lotes 1 a 4).

Observacao geral: como nos lotes anteriores, a grande maioria das URLs `freecodecamp.org/news/...`, `web.dio.me/track/...` e varios paths do `learn.microsoft.com` nao existem (slugs fabricados ou reorganizados). O cursoemvideo migrou os modulos de HTML5/CSS3 para conteudo pago `[VIP]`.

### Zero travessao / en dash

Todas as 14 entradas inseridas foram escritas so com hifen comum, sem travessao (—) nem en dash (–), conforme regra do CLAUDE.md.

## Pendencias e decisoes em aberto

1. Tabela `courses` do Supabase e um subconjunto curado. Antes dos lotes tinha 20 linhas (uma amostra por area), nao o catalogo estatico completo (cerca de 365 cursos). A pagina `/cursos` ao vivo mostra o conteudo da tabela; o estatico e fallback e fonte do SEO. Apos os dois lotes a tabela foi de 20 para 44 linhas e ficou pesada em ciberseguranca (19 de 24 novas). Decisao a tomar:
   - Manter o modelo de subconjunto curado (nesse caso 19 cursos de seguranca desequilibram as areas), ou
   - Rodar o seed completo (`pnpm seed:content`) para sincronizar todo o catalogo estatico na tabela.

2. Dominio `escolavirtual.bradesco.com.br` nao respondeu em nenhum dos lotes. As URLs da Fundacao Bradesco foram descartadas por timeout, nao por 404. Vale reconferir num navegador se esses cursos importam.
