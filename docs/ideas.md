# BORA NA TECH? — Brainstorm de Design

## Contexto
Plataforma educativa para iniciantes em tecnologia. Público: jovens 18-24 anos, mulheres em transição de carreira, pessoas sem base técnica. Sensação desejada: "Eu finalmente entendi por onde começar."

---

<response>
<idea>

## Abordagem 1 — "Diário de Bordo Tech"
**Design Movement:** Editorial moderno + Zine digital

**Core Principles:**
- Assimetria intencional: colunas desiguais, texto que "respira" ao lado de blocos visuais
- Contraste tipográfico extremo: títulos enormes e bold vs. corpo de texto fino e leve
- Cor como marcador de território: cada seção tem sua própria cor de acento, criando identidade visual por área
- Textura sutil: grain overlay nos fundos para dar profundidade sem pesar

**Color Philosophy:**
- Fundo: creme quente (#F5F0E8) — acolhedor, não clínico
- Primária: azul petróleo (#1B4F72) — confiança e profissionalismo
- Acentos por área: coral (#E74C3C) para Front-end, verde-salva (#27AE60) para Dados, lilás (#8E44AD) para UX/UI
- Texto: quase-preto (#1A1A2E) — legível e sofisticado

**Layout Paradigm:**
- Grid de 12 colunas com quebras intencionais
- Cards que "sangram" para fora do container em desktop
- Seções alternando entre full-width e contidas

**Signature Elements:**
- Número de seção em tipografia gigante como elemento decorativo de fundo
- Tags coloridas de área em todos os cards
- Linha de separação diagonal entre seções

**Interaction Philosophy:**
- Hover revela cor de acento da área com transição suave
- Cards têm micro-elevação ao hover (translateY -4px + sombra)
- Menu mobile com slide lateral com overlay escuro

**Animation:**
- Entrada de cards com fade + slide-up (staggered, 80ms entre cada)
- Transição de página com fade simples (200ms)
- Números decorativos com counter animation ao entrar na viewport

**Typography System:**
- Display: Playfair Display (bold 700/900) — autoridade editorial
- Corpo: DM Sans (400/500) — leitura confortável
- Mono: JetBrains Mono — para termos técnicos e códigos

</idea>
<probability>0.08</probability>
</response>

---

<response>
<idea>

## Abordagem 2 — "Mapa de Exploração" ✅ ESCOLHIDA
**Design Movement:** Flat design com profundidade — Neo-Brutalism suavizado

**Core Principles:**
- Clareza acima de tudo: cada elemento tem propósito visual claro
- Hierarquia por peso e cor, não por decoração excessiva
- Espaço branco generoso como elemento de respiro e confiança
- Cards com bordas definidas e sombras sólidas (não difusas) — identidade marcante

**Color Philosophy:**
- Fundo: branco puro (#FFFFFF) e cinza muito claro (#F8F9FA) para seções alternadas
- Primária: violeta-índigo (#5B21B6) — tecnologia, criatividade, modernidade
- Secundária: âmbar (#F59E0B) — energia, chamada para ação, destaque
- Terciária: verde-esmeralda (#059669) — progresso, carreira, conquista
- Texto: slate escuro (#0F172A) — máxima legibilidade
- Bordas: slate-200 (#E2E8F0) — delicadas mas presentes

**Layout Paradigm:**
- Assimetria controlada: hero com texto à esquerda e visual à direita
- Grid de cards com colunas variáveis (2-3-4 dependendo do contexto)
- Seções com fundo alternado (branco / cinza claro / violeta claro)
- Sidebar de navegação fixa em desktop para páginas internas

**Signature Elements:**
- Bordas com sombra sólida offset (neo-brutalism suavizado): `box-shadow: 3px 3px 0 #0F172A`
- Ícones em círculos coloridos com fundo suave
- Tags de área com cores distintas por categoria

**Interaction Philosophy:**
- Hover nos cards: sombra sólida aumenta e card se move levemente (translateX 2px, translateY -2px)
- Botões primários com efeito de "pressão" ao clicar (scale 0.97)
- Links de navegação com underline animado que cresce da esquerda

**Animation:**
- Hero: título entra com clip-path reveal (wipe da esquerda)
- Cards: fade + scale de 0.95 para 1 ao entrar na viewport
- Filtros: transição suave de opacidade e altura ao expandir

**Typography System:**
- Display: Space Grotesk (700/800) — geométrico, tecnológico, jovem
- Corpo: Plus Jakarta Sans (400/500/600) — moderna, acolhedora, legível
- Mono: Fira Code — para termos técnicos

</idea>
<probability>0.09</probability>
</response>

---

<response>
<idea>

## Abordagem 3 — "Cosmos Tech"
**Design Movement:** Dark mode futurista + glassmorphism

**Core Principles:**
- Fundo escuro como tela de exploração — sensação de "universo a descobrir"
- Glassmorphism nos cards: blur + transparência + borda luminosa
- Gradientes vibrantes como pontos de luz no escuro
- Tipografia luminosa: texto claro sobre escuro com glow sutil

**Color Philosophy:**
- Fundo: azul-noite profundo (#0A0E27)
- Cards: vidro escuro com blur (rgba(255,255,255,0.05) + backdrop-blur)
- Primária: ciano elétrico (#00D4FF) — tecnologia, futuro
- Secundária: magenta (#FF006E) — criatividade, destaque
- Terciária: verde-neon (#00FF88) — progresso, sucesso
- Texto: branco (#FFFFFF) e cinza-claro (#B0B8D4)

**Layout Paradigm:**
- Full-width com elementos flutuantes
- Cards com efeito de vidro sobrepostos em grid irregular
- Seções com gradiente de fundo que muda suavemente

**Signature Elements:**
- Partículas animadas no hero (canvas com pontos conectados)
- Bordas com gradiente luminoso nos cards
- Badges com glow colorido por área

**Interaction Philosophy:**
- Hover nos cards: glow aumenta e borda fica mais luminosa
- Cursor personalizado com trail de partículas
- Scroll parallax nos elementos de fundo

**Animation:**
- Hero com animação de digitação no título
- Cards com entrada em cascata com efeito de "materialização"
- Transições de página com fade + blur

**Typography System:**
- Display: Syne (800) — futurista, impactante
- Corpo: Outfit (400/500) — moderna e legível no escuro
- Mono: Space Mono — para termos técnicos

</idea>
<probability>0.07</probability>
</response>
