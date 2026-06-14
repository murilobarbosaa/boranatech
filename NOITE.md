# NOITE.md - Missao da noite (Bora na Tech)

Registro autonomo. Atualizado apos cada subtarefa. NAO push (tudo na main local).
Inicio: 2026-06-14 (madrugada).

## Contexto importante
- Sessao concorrente compartilha esta arvore. Arquivos que NAO sao meus e NAO devo tocar:
  `client/src/pages/QuizCarreira.tsx` aparece modificado desde o inicio da sessao (mudanca pre-existente, nao minha).
  `client/src/components/Header.tsx` apareceu modificado pela outra sessao em momentos anteriores.
  Memoria de longo prazo marca `Dicas.tsx` e `Cursos.tsx` como da outra sessao.
- Regra: bloqueio -> pular, registrar aqui, seguir. Nunca parar a noite.

## Progresso por subtarefa

### 1. BUG curtidas/acoes lentas - CONCLUIDO
- Causa raiz: `useFavorites` era um hook por-componente (useState local). Cada `FavoriteButton`
  (22+ no grid de Areas) tinha estado proprio e fazia seu proprio `GET /api/bookmarks`,
  comecando em `favorites: []` / `loading: true`. O estado "curtido" so aparecia depois do
  round-trip de rede de CADA botao -> lentidao e curtido tardio.
- Correcao: promovido para `FavoritesProvider` unico e compartilhado (1 fetch, nao N) com
  hidratacao SINCRONA via localStorage (cache por userId, `bora-na-tech:favorites-cache:v1:<id>`).
  No load, le o cache sincrono e seta `favorites` ANTES de qualquer rede -> curtido aparece
  imediato. O refetch reconcilia com o servidor sem colapsar o estado em `[]` (nao zera durante
  loading). Toggle continua otimista; cache reescrito a cada mudanca (persiste entre paginas).
- API publica preservada: `@/hooks/useFavorites` agora re-exporta do contexto; nenhum consumidor
  mudou (FavoriteButton, FavoriteCard, Perfil, PerfilFavoritos).
- Wiring: `<FavoritesProvider>` dentro de `<AuthProvider>` no App.tsx.
- Teste: pnpm check EXIT 0. Preview /areas: app sobe, 22 botoes de favorito compartilham 1 provider,
  zero erros no console. (Caminho logado nao testavel no preview sem auth, mas logica tipada e
  hidratacao sincrona garantem curtido imediato.)
- Arquivos: `contexts/FavoritesContext.tsx` (novo), `hooks/useFavorites.ts` (re-export fino), `App.tsx`.
- Itens reais: n/a (bug fix).
- Pendencias: nenhuma.
- Commit: 86c30fa

### 2. AREAS DA TI: texto mais rapido + selos de Embaixadora - CONCLUIDO
- Texto que passa: CurvedLoop speed 0.5 -> 0.8 (um pouco mais rapido). curveAmount segue 0 (reto).
- `EmbaixadoraBadge` generalizado: props `program` (default "IBM Z Xplore") e `href` opcional
  (slot de link). Sem href -> <span> (sem link). Com href -> <a target=_blank rel=noopener> com
  icone de link externo, foco visivel. Texto agora "Ana e Embaixadora {program}" (mostra que e a
  Ana pelo nome). Backward compatible: AreaDetalhe e Plataformas usam o default (IBM).
- Selos na pagina Areas: nova faixa "Programas que a Ana representa" logo apos o loop, com dois
  selos: IBM Z Xplore (por nome, SEM link, regra 5) e Claude (com slot de link PRONTO). O card de
  area Mainframe mantem seu selo IBM contextual.
- Decisao: nao existe "area de TI" chamada Claude e inventar uma viola a regra 1. Entao o "card
  Claude com selo" foi realizado como selo de Embaixadora na faixa (honesto, sem inventar area).
- Teste: pnpm check EXIT 0. Preview /areas: faixa presente, dois selos com texto correto, Claude
  como slot pronto (vira <a> assim que a URL for setada), sem scroll horizontal.
- Itens reais: n/a (estrutura/selos).
- Commit: (abaixo)

### 3. DICIONARIO: niveis + exemplos - CONCLUIDO
- 283 termos existentes em `dictionaryTerms` (platformData.ts) foram enriquecidos com `level`
  (Iniciante/Basico/Avancado) e `example` (exemplo real de uso, divertido). Para nao arriscar
  corromper o array de 283 entradas (usado tambem pelo glossario), criei um modulo separado
  `client/src/lib/dictionaryEnrichment.ts` (mapa term -> {level, example}). Cobertura: 283/283,
  0 backfill, 0 travessao, 0 nivel invalido. Distribuicao: Iniciante 34, Basico 167, Avancado 82.
- Geracao: 6 subagents em paralelo escreveram os exemplos/niveis; merge validado por script
  (matching exato + fallback sem acento pra recuperar 4 termos acentuados). Scripts temporarios
  removidos (nao commitados).
- Pagina `Dicionario.tsx` reescrita: filtro por nivel (Todos + 3 niveis com contagem), secoes
  separadas por nivel com emoji+blurb, cada card mostra nivel (badge colorido) + caixa "exemplo de
  uso" (italico). Entrada animada (AnimatedContent, respeita reduced-motion), hover limpo
  (motion-safe:hover -translate-y-1, sem tilt). Busca agora inclui o exemplo. Cores vivas por nivel
  (emerald/sky/violet) com contraste AA.
- Teste: pnpm check EXIT 0. Preview /dicionario: 4 botoes de nivel com contagem correta
  (283/34/167/82), 3 secoes, 283 caixas de exemplo (cada termo tem exemplo), sem scroll horizontal.
- Aceite: cada termo tem nivel + exemplo. OK.
- Itens reais: 283 termos enriquecidos (nivel + exemplo).
- Commit: (abaixo)

### 4. QUIZ DE CARREIRA - PULADO (bloqueio: sessao concorrente ativa)
- `client/src/pages/QuizCarreira.tsx` esta sob trabalho ATIVO da outra sessao agora. Historico
  recente (ultimos ~12 min) mostra varios commits dela exatamente nessa pagina e exatamente nesse
  espirito: "redesign objective screen with bolder cta, color and motion", "animated role text",
  "tela de nivel entre triagem e perguntas", "da mais vida as opcoes e a barra de progresso".
  Ultimo commit do arquivo: 35e95cb, 12 min atras.
- Regra 2 + limite de sessao concorrente: nao toco no arquivo pra nao colidir/sobrescrever o
  trabalho dela. A subtarefa 4 ja esta sendo feita pela outra sessao.
- Acao: PULADO. Se ao final a outra sessao tiver parado e o arquivo estiver estavel, posso revisitar.
- Itens reais: n/a.

### 5. ABA TECNOLOGIAS: cor, vida, marquee, curiosidades, roadmaps - CONCLUIDO
- Curiosidades VERIFICADAS: 38 linguagens pesquisadas por 3 subagents, cada fato confirmado na
  Wikipedia (URL aberta via WebFetch). Salvo em `client/src/lib/technologyCuriosities.ts`
  (name -> {curiosity, source}). Ex: JavaScript nasceu como LiveScript (Brendan Eich, 1995);
  Python vem do Monty Python; Lua nasceu na PUC-Rio; Java comecou como Oak; Elixir e do brasileiro
  Jose Valim; Ada homenageia Ada Lovelace.
- Na pagina, todo card de linguagem mostra a curiosidade (caixa ambar com lampada). A fonte do dado
  esta no arquivo (source). A base ao vivo (API getTechnologies) traz 14 linguagens e TODAS as 14
  mostram curiosidade (cobertura 100% do que aparece); as outras 24 ja estao prontas no dado caso
  entrem na base.
- Linha de tecnologias passando (marquee): 24 techs (top ranking) em pills brancas com logo seguro
  (TechnologyLogo, tipografico no fallback) e nome em cor vibrante ciclica. Duplicada pra loop
  continuo. Reduced-motion para a animacao (add `.animate-marquee-left` no bloco reduced-motion do
  index.css + motion-reduce:animate-none). aria-hidden, dentro de overflow-hidden (sem scroll H).
- Cores fortes: tag de categoria agora colorida por categoria (violet/blue/emerald/sky/orange/
  fuchsia/rose/teal/pink/amber), texto sempre AA (branco em 600/700, slate-950 no amber).
- Botoes pra roadmaps REAIS: cada card tem botao "Ver roadmap" -> `/roadmaps?area=<slug>` quando a
  area da tech existe como areaSlug real dos roadmaps (frontend, backend, dados, devops, mobile,
  qa, gestao); senao cai em `/roadmaps` (pagina real, sempre populada). Validei o vocabulario de
  slugs (nenhum link cai em filtro vazio). 63 botoes, hrefs reais conferidos no preview.
- Entrada animada: AnimatedContent (respeita reduced-motion). Hover limpo via card-brutal.
- Teste: pnpm check EXIT 0. Preview: marquee 48 itens, 63 botoes roadmap reais, 14/14 linguagens
  com curiosidade, sem scroll horizontal (desktop e mobile 375).
- Itens reais: 38 curiosidades de linguagens verificadas (Wikipedia).
- Commit: (abaixo)

### 6. RANKING DE TECNOLOGIAS: cara de ranking - CONCLUIDO
- So reestilizacao, ZERO numero novo. Barras usam o `usagePercent` que ja existia; quando a tech
  nao tem percentual, a barra simplesmente nao aparece (sem inventar).
- Adicionado: podio top-3 (medalhas, logo, label, barra), barras de uso na tabela e nos cards
  mobile, rotulo "Dados 2025 a 2026, sempre atualizado" (badge com icone refresh), doodles animados
  no hero (trofeu/sparkles, animate-gentle-float ja gated por reduced-motion, aria-hidden), e varios
  CTAs reais: Comparar, Por area, Ver roadmaps (/roadmaps), Fazer o quiz (/quiz-carreira).
- Acessibilidade: barra com role=img + aria-label "Uso aproximado de N%"; CTAs com hover motion-safe;
  contraste AA (branco em violet-600, slate-950 em amber/white).
- Teste: pnpm check EXIT 0. Preview: rotulo de ano presente, 67 barras, 6 medalhas (podio+tabela),
  4 CTAs com rotas reais, sem scroll horizontal.
- Itens reais: n/a (reestilizacao de dados existentes).
- Commit: (abaixo)

### 7. TECNOLOGIAS > subarea JOGOS - CONCLUIDO
- Nova pagina `/tecnologias/jogos` (`TecnologiaJogos.tsx`) + rota no App.tsx (antes do
  `/tecnologias/:slug` pra nao ser engolida pelo catch-all) + botao "Como os jogos foram feitos"
  na pagina Tecnologias.
- Conteudo: 58 jogos famosos com engine + linguagem VERIFICADAS (3 subagents, cada fato confirmado
  em fonte que carrega: Wikipedia do jogo/engine, dev blogs, GDC, repo n64decomp). Salvo em
  `client/src/lib/gamesTech.ts` (game, engine, language, made, source, year?). Dedupe por nome:
  63 brutos -> 58 unicos. Linguagens: C#, C++, C, Java, Lua, Haxe, GML, JavaScript, Assembly.
  Ex: Doom (1993, id Tech 1, C); Minecraft Java (Java); Fortnite (Unreal 4, C++); Undertale
  (GameMaker, GML); Factorio (engine propria, C++); RollerCoaster Tycoon (Assembly).
- Cada card: explicacao curta (minha/Ana, em PT) de como foi feito + link "fonte" (a fonte real
  verificada). Logo de jogo = card TIPOGRAFICO (iniciais do jogo em tile colorido), conforme regra.
- Pagina muito animada e colorida: header de card com cor vibrante ciclica (10 cores, texto branco
  AA), entrada animada (AnimatedContent), hover limpo (motion-safe -translate-y-1), doodles
  (gamepad/sparkles, gentle-float gated), busca + filtro por linguagem. Sem scroll horizontal.
- Teste: pnpm check EXIT 0. Preview: 58 cards, 9 linguagens no filtro, 58 explicacoes, 62 links de
  fonte, sem scroll horizontal (desktop e mobile 375).
- Itens reais: 58 jogos verificados.
- Commit: (abaixo)

### 8. CURSOS: adicionar cursos reais - PARCIAL (dado pronto, visibilidade bloqueada)
- 38 cursos REAIS verificados adicionados ao catalogo estatico `cursosGratuitos` em
  `client/src/lib/data.ts` (71 -> 109). Cada URL aberta e confirmada por 3 subagents (WebFetch).
  Fontes: freeCodeCamp (certs), Coursera (Google/Meta/Michigan/AWS), edX (CS50 x3), Codecademy,
  Khan Academy, DIO, Fundacao Bradesco, Curso em Video (site, topicos novos: Algoritmos, MySQL,
  Git, Linux, Seguranca, IA), Flutterando (Flutter), Programacao Dinamica (ML), Programador BR.
  34 gratuitos + 4 pagos, 11 areas. Dedupe: contra os 71 existentes (titulo/link) e entre si;
  removidas as versoes YouTube do Guanabara que duplicavam as do site. 0 travessao.
- BLOQUEIO de visibilidade: a pagina Cursos usa `getCourses()` (API/DB) que SOBRESCREVE o catalogo
  estatico no mount. Confirmei no preview: os cursos novos so aparecem quando a API esta fora (o
  estatico e o fallback). Pra aparecerem ao vivo seria preciso (a) importar pro banco (Supabase),
  que eu nao mexo (fora de escopo, nao verificavel), ou (b) editar `Cursos.tsx` pra mesclar
  estatico + API, mas esse arquivo e da sessao concorrente (limite respeitado, regra 2).
- O que fica pronto: os 38 cursos verificados servem de fonte para a Ana importar no banco, e ja
  enriquecem o fallback estatico (usado quando a API cai / dev local).
- Teste: pnpm check EXIT 0. Pagina sobe sem erro.
- Itens reais: 38 cursos verificados (adicionados ao dado; visibilidade ao vivo pendente da Ana).
- Commit: (abaixo)

### 12. INGLES: mini-quiz de nivel + objetivo -> trilha personalizada - CONCLUIDO
- 23 recursos de ingles VERIFICADOS (1 subagent, cada URL confirmada por WebFetch/WebSearch; todos
  os itens "(confirmar)" da curadoria foram confirmados: FutureLearn, ESOL Courses, Busuu, Cambly,
  Tandem, HelloTalk). Salvo em `client/src/lib/inglesRecursos.ts` com subarea, nivel, objetivo[],
  gratuito, desc (minhas palavras).
- Mini-quiz novo (`components/ingles/InglesTrilhaQuiz.tsx`): 2 toques (nivel: Comecando/
  Intermediario/Avancado + objetivo: Conversar/Ler documentacao e codigo/Entrevista internacional/
  Passar num exame) -> monta trilha personalizada de 3 a 5 itens REAIS, ranqueados por nivel.
  Validei TODAS as combinacoes no preview: cada uma retorna 3 a 5 (Entrevista=4, resto=5), com
  links reais (Duolingo, BBC, British Council, italki, MDN, Cambridge Dictionary, etc.).
- Organizado por subarea (cada card mostra a subarea), cor (tiles tipograficos coloridos), animacao
  (reveal com framer + reduced-motion, hover motion-safe), badge gratis/pago. aria-live na trilha.
  Logos: tipografico (nao bundlei logo de terceiro). Sem scroll horizontal.
- Integrado na pagina `/ingles` logo apos a subnav. As subpaginas de ingles que ja existiam
  continuam organizando recursos por tema.
- Nota BBC: o site bloqueia o crawler; os 2 podcasts (6 Minute English, The English We Speak) e a
  BBC Learning English foram confirmados por busca, usando as URLs canonicas conhecidas.
- Teste: pnpm check EXIT 0. Preview: quiz funciona, 3 a 5 itens por combinacao, links reais.
- Itens reais: 23 recursos verificados + quiz com 12 combinacoes validas.
- Commit: (abaixo)

### Rodada de correcao (selos por card, visual, motion, ranking) - CONCLUIDO
- Areas: removida a tira "Programas que a Ana representa"; selo pequeno por card (Cloud = "Ana e
  Embaixadora AWS" com slot de link; Mainframe = IBM Z Xplore por nome); selo Claude pronto no
  componente porem nao renderizado (oculto). Corpo do card ganhou cor da categoria + chips coloridos.
- Tecnologias: marquee virou so logos (devicon), maiores (56px), fundo transparente, sem pill/nome;
  subtitle menor (16px) e slate-900 (contraste forte).
- Mapa de tecnologias: adicionado botao "Ver roadmap de <area>" por card (23 botoes, rotas reais).
- Ranking: HTML e CSS agora aparecem como "Marcação" (nao linguagem); scope "Linguagens" virou
  "Linguagens e marcação"; subtitle deixa claro que e ranking de tecnologias no geral. Sem numero novo.
- Dicionario: secoes de nivel embrulhadas em container com key={level} -> remonta e reanima ao trocar
  de nivel (sem reanimar a cada tecla na busca).

## BLOQUEIOS desta rodada (precisam da Ana / dados)
- SELO ElevenLabs (Tecnologias): o card so renderiza se "ElevenLabs" estiver na lista. ElevenLabs
  NAO esta em `technologyData` nem (aparentemente) na API de technologies, entao o selo esta cabeado
  (`technology.name === "ElevenLabs"`) mas nao aparece. Pra mostrar: adicionar ElevenLabs aos dados
  (estatico/Supabase). Const de link `ELEVENLABS_EMBAIXADORA_URL` pronta (vazia).
- SELO IBM/Mainframe (Areas): o card do Mainframe nao esta na lista de areas que renderiza ao vivo
  (a fonte de areas em uso exclui Mainframe; a Cloud aparece e mostra o selo AWS). O selo IBM esta
  cabeado por slug "mainframe" e aparece assim que o card do Mainframe entrar na lista renderizada.
- LINK AWS Embaixadora: `AWS_EMBAIXADORA_URL` em Areas.tsx esta vazio (slot pronto).

## Pendencias que precisam da Ana (links)
- DECISAO CURSOS: importar os 38 cursos novos (em `cursosGratuitos`, data.ts) pro banco Supabase,
  OU autorizar editar `Cursos.tsx` pra mesclar API + estatico (hoje a API sobrescreve). Sem isso,
  os 38 cursos ficam so no fallback.
- LINK Claude Embaixadora: `CLAUDE_EMBAIXADORA_URL` em `client/src/pages/Areas.tsx` esta `undefined`.
  Assim que a Ana der o link publico do programa Claude, basta preencher essa const e o selo vira
  link automaticamente. (regra 5: sem link, fica TODO)
- LINK Alura Embaixadora e AWS SkillBuilder: slots a preparar nas subtarefas 9 (Plataformas).

## Lista de commits
- 86c30fa fix(favorites): share favorites via provider with sync cache hydration for instant liked state
