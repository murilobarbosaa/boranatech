-- Dois motivos, um arquivo, tudo ADITIVO.
--
-- 1) AREA NOVA: DevSecOps deixa de ser subarea de DevOps e vira area de topo,
--    em /areas/devsecops. O conteudo abaixo e o mesmo que o estatico
--    (client/src/lib/data.ts) declara para a area, promovido do que ja existia
--    na subarea. Nenhuma afirmacao nova de mercado foi criada aqui.
--
-- 2) RESTAURACAO DE SINCRONIA: a tabela public.areas tinha 23 linhas e o
--    estatico 25 (verificado em producao em 2026-08-22). Faltavam
--    'desenvolvimento-software' e 'mainframe', que existem no estatico desde
--    antes e nunca chegaram ao banco. Elas entram aqui pelo mesmo INSERT, com o
--    conteudo copiado do estatico.
--
-- Por que isso importa alem da pagina /areas: server/lib/searchIndex.ts monta o
-- indice de busca do agente a partir da TABELA, nao do estatico
-- (buildAreas le public.areas e gera /areas/<slug>). Area que existe so no
-- estatico e invisivel para a busca do agente.
--
-- Idempotencia: ON CONFLICT (slug) DO NOTHING, o mesmo tratamento do molde
-- 20260524120110_add_fullstack_and_gamedev_areas.sql. Rodar duas vezes nao muda
-- nada. NAO ha UPDATE nem DELETE: sort_order 24, 25 e 26 continuam a sequencia
-- existente e nao deslocam nenhuma linha ja gravada.

BEGIN;

INSERT INTO public.areas (
  slug, name, short_description, full_description, daily_tasks, profile_indicated,
  skills, tools, average_salary, free_courses, initial_roadmap, projects,
  essential_terms, initial_tips, roles, tag, tag_class, icon, color,
  is_pro, is_published, sort_order
) VALUES
(
  'desenvolvimento-software',
  'Desenvolvimento de Software',
  'Escreve o código que faz sites, aplicativos e sistemas funcionarem.',
  'Quem trabalha com desenvolvimento de software constrói os programas que as pessoas usam todo dia: sites, aplicativos, sistemas internos e APIs. É a área mais ampla da programação e a porta de entrada mais comum em tecnologia. Com o tempo, a maioria escolhe uma especialização, como front-end, back-end ou full-stack.',
  '["Escrever código de novas funcionalidades","Corrigir bugs reportados por usuários ou pelo time","Revisar o código dos colegas em pull requests","Participar da reunião diária de alinhamento do time","Testar o que foi feito antes de subir para produção"]'::jsonb,
  'Gosta de resolver problemas, tem paciência para investigar erros e sente prazer em ver algo que construiu funcionando.',
  '["Lógica de programação","Uma linguagem de programação","Git e versionamento","Trabalho em equipe"]'::jsonb,
  '["VS Code","Git e GitHub","Terminal","Docker"]'::jsonb,
  '{"label":"R$ 3.000 a R$ 15.000+","difficulty":3}'::jsonb,
  '["CS50 de Harvard: fundamentos de computação (em inglês, com legendas)","Curso em Vídeo: Lógica de Programação e Python (Gustavo Guanabara)","The Odin Project: currículo completo e gratuito (em inglês)","freeCodeCamp: certificações gratuitas de programação"]'::jsonb,
  '["Aprender lógica de programação e algoritmos","Escolher a primeira linguagem (Python ou JavaScript são as mais acessíveis)","Aprender Git e GitHub na prática","Construir projetos pequenos do zero, sem seguir tutorial","Entender banco de dados e como uma API funciona","Escolher uma especialização: front-end, back-end ou full-stack"]'::jsonb,
  '["Página pessoal com seus projetos publicada no GitHub Pages","Lista de tarefas com salvamento local","API simples de cadastro com banco de dados","Aplicação que consome uma API pública e mostra os dados na tela"]'::jsonb,
  '["Algoritmo","API","Git","Pull request","Bug","Deploy","Code review"]'::jsonb,
  'Não tente aprender tudo ao mesmo tempo: escolha uma linguagem e vá fundo nela. Construir projetos do zero ensina mais do que assistir a dez cursos seguidos. E não se assuste com o erro: ler mensagem de erro e procurar solução é metade do trabalho.',
  '["Desenvolvedor Júnior","Desenvolvedor Pleno","Desenvolvedor Sênior","Tech Lead"]'::jsonb,
  'Desenvolvimento de Software',
  'tag-fullstack',
  '💻',
  NULL,
  false,
  true,
  24
),
(
  'mainframe',
  'Mainframe',
  'Mantém e moderniza os sistemas de altíssimo volume que rodam em bancos, governo e grandes empresas.',
  'Mainframe é o computador de grande porte que processa milhões de transações por dia com confiabilidade altíssima. Está no coração de bancos, governo, seguradoras e companhias aéreas, rodando sistemas críticos escritos em COBOL ao longo de décadas. Esses sistemas continuam no ar porque são estáveis e caros de substituir, então a demanda por quem sabe mantê-los segue alta enquanto poucos profissionais novos entram na área. É um nicho: menos vagas que web, mas com concorrência baixa e boa estabilidade.',
  '["Ler e dar manutenção em programas COBOL existentes","Escrever e ajustar JCL para executar jobs em lote","Consultar e atualizar dados em DB2, VSAM ou IMS","Investigar abends analisando logs e dumps","Editar e testar programas no TSO/ISPF"]'::jsonb,
  'Gosta de lógica, atenção a detalhe e de entender sistemas grandes e antigos. Tem paciência para ler código legado e valoriza estabilidade mais do que novidade constante.',
  '["Lógica de programação","COBOL","JCL (linguagem de controle de jobs)","SQL e DB2","Noções de z/OS e processamento em lote"]'::jsonb,
  '["COBOL","JCL","z/OS","CICS","DB2","IMS","TSO/ISPF","VSAM"]'::jsonb,
  '{"label":"R$ 3.500 a R$ 6.500 (júnior)","difficulty":4}'::jsonb,
  '["IBM Z Xplore (ambiente e desafios gratuitos da IBM, sucessor do Master the Mainframe)","freeCodeCamp: COBOL Programming Course (vídeo)","Open Mainframe Project: cursos abertos de COBOL e mainframe"]'::jsonb,
  '["Aprender lógica de programação","Estudar COBOL (sintaxe, estruturas e arquivos)","Criar conta no IBM Z Xplore e praticar no ambiente real","Aprender JCL para rodar programas em lote","Entender SQL e DB2 para acessar dados","Conhecer o básico de z/OS, TSO/ISPF e CICS"]'::jsonb,
  '["Resolver os desafios do IBM Z Xplore (ambiente gratuito)","Programa COBOL que lê um arquivo e gera um relatório","Job em lote com JCL processando um arquivo de entrada"]'::jsonb,
  '["COBOL","JCL","z/OS","Batch","CICS","DB2","Abend","Dataset"]'::jsonb,
  'Comece pela lógica e por COBOL, depois use o IBM Z Xplore para praticar em um ambiente real e gratuito. É um nicho: menos vagas, mas pouca concorrência e boa estabilidade.',
  '["Desenvolvedor COBOL/Mainframe Júnior","Analista de Mainframe","Programador COBOL","Analista de Sistemas Legados"]'::jsonb,
  'Mainframe',
  'tag-backend',
  '🖧',
  NULL,
  false,
  true,
  25
),
(
  'devsecops',
  'DevSecOps',
  'Integra segurança no ciclo CI/CD. SAST/DAST, secrets management, hardening de pipelines. Área em forte crescimento (3.4k+ vagas BR).',
  'DevSecOps é a evolução do DevOps com integração obrigatória de segurança em cada etapa do ciclo de desenvolvimento, desde o primeiro commit até o deploy em produção. Não é cargo opcional: virou requisito em fintechs, bancos e empresas que lidam com dados sensíveis (LGPD, PCI-DSS). Profissional integra ferramentas de scan de código (SAST, DAST, SCA), gerencia secrets, faz hardening de pipelines e containers. Diferente do AppSec (que é mais especializado em código de aplicação e revisão de segurança), o DevSecOps cobre todo o ciclo: código, build, deploy, runtime, infraestrutura. Mercado super aquecido em 2026: Glassdoor mostra 311+ vagas ativas, BeBee 3.4k+, com média salarial de R$ 9.030 e sêniores chegando a R$ 19.200. Em fintechs e bancos, ultrapassa R$ 25k facilmente.',
  '["Integrar ferramentas de segurança em pipelines CI/CD","Automatizar varredura de vulnerabilidades em código e dependências","Configurar e rotacionar gestão de secrets","Fazer hardening de containers e clusters Kubernetes","Auditar ambientes cloud (IAM, redes, configurações)","Orientar times de dev em práticas seguras (shift-left security)"]'::jsonb,
  'Gosta de automação e de segurança na mesma medida, e prefere prevenir a remediar. Tem paciência para investigar configuração e ler documentação técnica, e perfil colaborativo: boa parte do trabalho é convencer times de desenvolvimento a adotar práticas seguras.',
  '["CI/CD avançado (Jenkins, GitLab CI, GitHub Actions)","SAST, DAST e SCA (Semgrep, SonarQube, Snyk, OWASP ZAP)","Segurança em containers e Kubernetes (image scanning, runtime security)","Gestão de secrets (Vault, AWS Secrets Manager, sealed-secrets)","OWASP Top 10 + compliance (LGPD, PCI-DSS, ISO 27001)"]'::jsonb,
  '["Jenkins, GitLab CI ou GitHub Actions (CI/CD)","SonarQube ou Semgrep (SAST)","OWASP ZAP ou Burp Suite (DAST)","Snyk ou Dependabot (SCA)","HashiCorp Vault (gestão de secrets)","Docker + Kubernetes + Trivy (segurança de containers)"]'::jsonb,
  '{"label":"R$ 5.692 (júnior raro) a R$ 25.000+ (sênior em fintechs). Média BR R$ 9.030, Glassdoor 2026. Pleno gira em R$ 11.850. Especialistas em fintechs e bancos chegam a R$ 20-30k. Remoto pra fora paga em dólar (US$ 5-10k/mês).","difficulty":5}'::jsonb,
  '["OWASP Cheat Sheet Series (referência gratuita oficial de segurança em desenvolvimento)","GitHub Security Lab (cursos gratuitos sobre SAST e segurança em pipelines)","AWS Skill Builder: Security Learning Path (parte gratuita)"]'::jsonb,
  '["Ter base sólida em DevOps (CI/CD, Docker, Kubernetes, cloud), 2+ anos","Estudar OWASP Top 10 + fundamentos de segurança de aplicações","Aprender ferramentas SAST/DAST/SCA e como integrá-las em pipelines","Estudar compliance (LGPD obrigatório no BR, PCI-DSS pra fintechs)","Construir portfolio: pipeline público com segurança integrada + writeup técnico"]'::jsonb,
  '["Pipeline CI/CD completo com SAST + DAST + SCA integrados (GitHub Actions público)","Cluster Kubernetes hardening: image scanning + network policies + RBAC documentado","Sistema de secrets management end-to-end (Vault + integração com K8s + rotação automática)"]'::jsonb,
  '["SAST","DAST","SCA","Shift-left security","Secrets management","Hardening"]'::jsonb,
  'Não tente entrar como DevSecOps sem base de DevOps. Esse cargo cobra os dois mundos. Vindo de DevOps, foque em OWASP + ferramentas de scan + compliance. Vindo de segurança, foque em CI/CD + containers + cloud. Cargo paga muito bem em fintechs e bancos. Invista em entender PCI-DSS e LGPD. Inglês é obrigatório (toda a doc e community estão em inglês). Área em crescimento explosivo. Quem entra agora pega salários acima do normal.',
  '["DevSecOps Engineer Pleno (3+ anos de DevOps)","DevSecOps Engineer Sênior (5+ anos)","Staff DevSecOps / Tech Lead Security Engineering","Principal DevSecOps / Head of Platform Security"]'::jsonb,
  'DevSecOps',
  'tag-seguranca',
  '🛡️',
  NULL,
  false,
  true,
  26
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
