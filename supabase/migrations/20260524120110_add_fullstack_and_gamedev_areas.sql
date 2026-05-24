-- Adiciona as áreas "Full-stack" e "Game Dev" na tabela `areas`.
--
-- Contexto: o fallback `areasTI` (client/src/lib/data.ts) tinha 16 áreas, mas o
-- banco tinha só 12, causando flash 16→12 a cada carregamento de /areas. Decisão:
-- promover essas duas ao banco (são áreas de carreira reais) e remover do fallback
-- as duas que eram duplicatas de sub-áreas (engenharia-dados e sre).
--
-- Todos os campos foram copiados literalmente do fallback. Campos sem equivalente
-- direto no fallback (icon emoji, tag, color, is_pro) foram preenchidos com o
-- mesmo padrão das 12 áreas já cadastradas.

INSERT INTO public.areas (
  slug, name, short_description, full_description, daily_tasks, profile_indicated,
  skills, tools, average_salary, free_courses, initial_roadmap, projects,
  essential_terms, initial_tips, roles, tag, tag_class, icon, color,
  is_pro, is_published, sort_order
) VALUES
(
  'fullstack',
  'Full-stack',
  'Desenvolvedor versátil que atua no front-end E back-end. Constrói aplicações de ponta a ponta — interface, servidor, banco de dados.',
  'Full-stack é o desenvolvedor que domina tanto o front-end (interface visível ao usuário) quanto o back-end (servidor, lógica, banco de dados). Em vez de focar numa única camada, atua em todas. É o cargo mais buscado em equipes pequenas e startups, onde uma pessoa precisa entregar features completas: do design da tela até o deploy. Em empresas maiores, o full-stack é valorizado pela visão sistêmica e flexibilidade entre times.',
  '["Criar telas e componentes no front-end (HTML, CSS, JavaScript/TypeScript)","Desenvolver APIs e lógica de negócio no back-end","Modelar e consultar bancos de dados (SQL ou NoSQL)","Integrar front-end com back-end via APIs REST ou GraphQL","Fazer deploy de aplicações em ambientes cloud (AWS, Vercel, Railway)","Participar de code reviews e cerimônias ágeis com o time"]'::jsonb,
  'Pessoa curiosa que gosta de variedade, não tem medo de mudar de contexto várias vezes ao dia e aprecia ver o produto funcionando completo. Tem boa visão sistêmica e prefere amplitude a profundidade. Ideal pra quem quer trabalhar em startups ou ter autonomia pra entregar features sozinho.',
  '["HTML, CSS e JavaScript/TypeScript","Pelo menos um framework front-end (React, Vue ou Angular)","Pelo menos uma linguagem back-end (Node.js, Python ou Java)","SQL e modelagem de banco de dados","Git e versionamento","Lógica de programação e pensamento sistêmico"]'::jsonb,
  '["React","Node.js","TypeScript","PostgreSQL","Git/GitHub","Docker","AWS","VS Code"]'::jsonb,
  '{"label":"R$ 3.250 (júnior) a R$ 15.900 (pleno) — fonte Robert Half/Glassdoor 2026","difficulty":4}'::jsonb,
  '["Curso em Vídeo — Web Moderno (Gustavo Guanabara)","The Odin Project (em inglês, gratuito, completo)","freeCodeCamp — Responsive Web Design + APIs and Microservices","Rocketseat Ignite (versão grátis das trilhas)"]'::jsonb,
  '["Aprender HTML, CSS e JavaScript básico","Estudar um framework front-end (React é o mais procurado)","Aprender Node.js + Express ou outra linguagem back-end","Estudar bancos de dados (SQL — começar com PostgreSQL)","Aprender Git e GitHub na prática","Construir 3 projetos full-stack pessoais (com deploy)"]'::jsonb,
  '["App de lista de tarefas full-stack (React + Node + PostgreSQL)","Clone de rede social simples (login, posts, comentários)","Sistema de cadastro com autenticação JWT","E-commerce básico com carrinho e checkout"]'::jsonb,
  '["API REST","SPA (Single Page Application)","CRUD","Autenticação JWT","Deploy","Endpoint"]'::jsonb,
  'Comece pelo front-end (HTML/CSS/JS), depois aprenda back-end (Node.js ou Python). Construa pelo menos 3 projetos completos antes de procurar emprego. Domine Git desde o dia 1.',
  '["Desenvolvedor Full-stack Júnior","Desenvolvedor Full-stack Pleno","Desenvolvedor Full-stack Sênior","Tech Lead"]'::jsonb,
  'Full-stack',
  'tag-fullstack',
  '🧩',
  NULL,
  false,
  true,
  13
),
(
  'gamedev',
  'Game Dev',
  'Programação de jogos digitais. Mecânicas, IA, física, gráficos. Mercado BR pequeno mas crescente, principalmente em mobile e estúdios médios.',
  'Game Dev é a programação por trás dos jogos digitais — desde mobile casual até console AAA. O desenvolvedor de jogos cria mecânicas, sistemas de IA pra inimigos, física, multiplayer, otimização de performance gráfica e integração com motores como Unity ou Unreal Engine. É uma área de mercado pequeno mas com paixão grande no Brasil — estúdios como Wildlife, Aquiris, Tapps Games e Hoplon empregam centenas, principalmente em jogos mobile. Salário fica abaixo da média geral de TI no início, mas seniores em estúdios internacionais ou remoto pra fora ganham bem. Recomendado pra quem tem paixão real por games, não só pelo salário.',
  '["Programar mecânicas de jogo (movimentação, combate, sistemas de pontos)","Implementar IA de inimigos, NPCs e comportamentos do mundo","Trabalhar com física, animações e renderização","Integrar arte (modelos 3D, sprites, sons) com a engine","Otimizar performance pra rodar bem em diferentes plataformas","Testar, debugar e ajustar dificuldade com base em feedback"]'::jsonb,
  'Pessoa apaixonada por jogos com paciência pra testes infinitos. Combina lógica de programação com sensibilidade pra experiência do jogador. Tolerante a ferramentas complexas, gosta de matemática (vetores, álgebra linear) e tem perfil colaborativo — game dev é trabalho em equipe multidisciplinar. Importante: o salário inicial é menor que outras áreas de dev, então paixão pela área conta muito.',
  '["Programação em C# (Unity) ou C++ (Unreal Engine)","Lógica de programação e estrutura de dados","Matemática aplicada (vetores, álgebra linear, trigonometria)","Domínio de pelo menos uma game engine","Conhecimento básico de design de jogos (game design)","Otimização e profiling de performance"]'::jsonb,
  '["Unity","Unreal Engine","Godot","Visual Studio","Git (com Git LFS pra assets grandes)","Blender (visualização básica de assets)","Steam / Itch.io (publicação)","Trello ou Jira"]'::jsonb,
  '{"label":"R$ 2.550 (júnior) a R$ 16.000 (sênior). Média BR R$ 8.200 — Jobted/Glassdoor 2026","difficulty":4}'::jsonb,
  '["Unity Learn (cursos oficiais grátis em inglês e PT-BR)","Brackeys (canal YouTube, referência mundial Unity em inglês — biblioteca enorme)","Curso em Vídeo — Lógica de Programação (Gustavo Guanabara, base sólida)","Godot Engine Documentation + Tutoriais oficiais (gratuitos)"]'::jsonb,
  '["Aprender lógica de programação e C# (ou C++ se for direto pra Unreal)","Escolher uma engine: Unity (mais empregos), Unreal (gráfico AAA) ou Godot (open-source)","Construir 2 jogos simples completos (Pong, Breakout, Endless Runner)","Estudar fundamentos de game design e UX em jogos","Participar de pelo menos 1 game jam","Publicar 1 jogo na Itch.io ou Google Play"]'::jsonb,
  '["Plataformer 2D com física, inimigos e fases (Unity ou Godot)","Top-down shooter com IA de inimigos (Unity)","Sistema de inventário e save/load completo","Jogo mobile casual publicado na Google Play"]'::jsonb,
  '["Game Loop","Engine","Asset","Prefab","Sprite","Game Jam"]'::jsonb,
  'Comece com Unity ou Godot (mais leves). Faça 3-5 jogos pequenos completos, não 1 grande pela metade. Participe de game jams (Global Game Jam, Ludum Dare) — é a forma mais rápida de aprender e fazer networking. Inglês é mais importante aqui que em outras áreas — quase toda doc e comunidade é em inglês.',
  '["Programador de Jogos Júnior","Programador de Jogos Pleno","Programador de Jogos Sênior","Gameplay Programmer / Engine Programmer"]'::jsonb,
  'Game Dev',
  'tag-gamedev',
  '🎮',
  NULL,
  false,
  true,
  14
)
ON CONFLICT (slug) DO NOTHING;
