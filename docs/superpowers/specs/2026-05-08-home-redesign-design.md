# BoraNaTech — Home Redesign Spec

**Data:** 2026-05-08  
**Arquivo-alvo:** `client/src/pages/HomeLanding.tsx`  
**Escopo:** Tudo abaixo do `<Header />` até o `<LandingFooter />`  
**Restrição inviolável:** `Header.tsx` não é tocado.

---

## Contexto e Motivação

A `HomeLanding.tsx` atual sofre de:

- **Narrativa quebrada**: eventos e notícias aparecem antes de apresentar o produto
- **Duplicação de intenção**: acesso rápido (6 cards) e feature cards (9 cards) comunicam a mesma coisa duas vezes
- **Seção de dores precoce**: aparece antes de o usuário entender o que a plataforma entrega
- **Excesso de seções táticas** (cursos, plataformas) que pertencem às páginas internas
- **CTAs repetidos** sem progressão narrativa
- **Floating signup bar** com lógica frágil de auth

O redesign preserva **100% do design system existente** e reconstrói apenas estrutura, hierarquia e narrativa.

---

## Design System a Preservar (não negociável)

| Elemento | Especificação |
|---|---|
| Sombra offset | `shadow-[Xpx_Xpx_0_#0f172a]` — assinatura neo-brutal |
| Bordas | `border-2 border-slate-900/950` em todos os elementos interativos |
| CTA primário | `rounded-full border-2 border-slate-950 bg-[#FFB800] shadow-[Npx_Npx_0_#0f172a]` |
| CTA secundário | Mesmo padrão, `bg-white` |
| Hover padrão | `hover:-translate-y-1 hover:shadow-[maior]` |
| Fundo base | `#faf8f4` (creme quente) |
| Textura hero | `radial-gradient` dots + grid linear, opacity 30–50% |
| Tipografia | `font-display font-black` para títulos; `font-semibold` para corpo |
| Cores de área | `.tag-frontend`, `.tag-backend`, etc. — sólidas por área |
| Animações scroll | `Reveal` component (IntersectionObserver + stagger) — mantido |
| Emojis | Linguagem de conteúdo primária (não ícones de linha) |
| Hover de ícone | `group-hover:-rotate-6 group-hover:scale-110` |

---

## Arco Narrativo da Nova Home

```
Quem somos → Como funciona → O que você pode explorar →
Como a IA acelera → Prova de valor → Planos → Carreira →
Comunidade viva → Ação final
```

---

## Seções — Especificação Detalhada

### S1 — Hero

**Layout:** coluna única centralizada  
**Fundo:** `hero-pattern` existente (`#faf8f4` + grid 56px + dots violeta), `border-b-2 border-slate-950`

**Conteúdo (de cima para baixo):**
1. Badge social: `rounded-full border-2 border-emerald-900 bg-emerald-100 px-4 py-2 font-black` com pulso animado
2. H1: `font-display text-5xl md:text-7xl font-black leading-[0.95]`
3. Sub-headline: `text-lg md:text-xl font-semibold text-slate-700`
4. CTAs: `Começar de graça` (amarelo + shadow 4px) + `Descobrir minha área` (branco)
5. Social proof: avatares + "Sem cartão · Grátis pra sempre no básico"
6. Mini-grid de 6 cards de área com `animate-gentle-float` escalonado, cor por tag de área

**Auth-aware:**
- Logado: CTAs mudam para `Ver minha jornada` → `/areas` e `Meus estudos` → `/estudos`
- Não logado: CTAs de cadastro padrão

---

### S2 — Marquee de Áreas

`<AnimatedAreaMarquee />` — sem alteração.

---

### S3 — Trilha Guiada "Como Funciona"

**Layout desktop:** flex horizontal, 4 cards com `ArrowRight` entre eles  
**Layout mobile:** flex vertical com seta para baixo  
**Fundo:** `#faf8f4`, `border-b-2 border-slate-200`

**SectionHeader:** label `"por onde começar"` · título `"Quatro passos. Uma direção."`

**Passos:**

| # | Título | Destino | Emoji |
|---|---|---|---|
| 01 | Descubra sua área | `/quiz-carreira` | 🧭 |
| 02 | Siga o roadmap certo | `/roadmaps` | 🗺️ |
| 03 | Construa seu perfil | `/portfolio` | 💼 |
| 04 | Conquiste a vaga | `/estagio` | 🚀 |

**Card:** `rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[4px_4px_0_#0f172a]`  
Número: `rounded-full bg-violet-700 text-white font-black` (ex: "01")  
Hover: `hover:-translate-y-1 hover:bg-[#fff7d6] hover:shadow-[7px_7px_0_#0f172a]`  
`Reveal` com stagger 80ms por passo

---

### S4 — Explorador de Áreas

**Layout:** `grid-cols-2 md:grid-cols-4` (8 áreas)  
**Fundo:** `section-alt`, `border-y-2 border-slate-200`

**SectionHeader:** label `"áreas da TI"` · título `"Encontre onde você se encaixa"`

**Card:** `rounded-xl border-2 border-slate-950 bg-white p-5 shadow-[4px_4px_0_#0f172a]`  
Tag de cor: classe `.tag-{area}` correspondente (frontend → violet, backend → green, etc.)  
Hover: `hover:-translate-y-1 hover:bg-violet-50 hover:shadow-[7px_7px_0_#0f172a]`

CTAs abaixo: `Ver todas as áreas` (branco) + `Fazer quiz de carreira` (amarelo)

---

### S5 — Ferramentas IA

**Fundo:** `bg-gradient-to-br from-violet-100 via-[#fff7d6] to-emerald-100` + dots violeta opacity-50  
**Border:** `border-y-2 border-slate-950`

**SectionHeader:** label `"inteligência artificial"` · título `"IA que realmente acelera sua carreira"`

**Organização dos cards:**
- Linha superior: 3 cards FREE (`grid-cols-1 md:grid-cols-3`) — Quiz, Gerador de Projetos, Banco de Perguntas
- Linha inferior: 4 cards PRO (`grid-cols-2`) — Analisador Currículo, Simulador Entrevistas, Otimizador LinkedIn, Análise Portfolio

Cards mantêm `shadow-[4px_4px_0_#7c3aed]`.  
CTA discreto: `"Conheça o Plano Pro →"` texto simples, sem botão grande.

---

### S6 — Prova Social

**Layout:** grid `grid-cols-2 md:grid-cols-4` dentro de `rounded-3xl border-2 border-slate-950 bg-white shadow-[5px_5px_0_#FFB800]`  
**Fundo:** branco com textura dots amarelos opacity-40

**SectionHeader:** label `"números reais"` · título `"Uma plataforma que continua crescendo"`

| Número | Label |
|---|---|
| +4.800 | pessoas no caminho |
| 500+ | cursos curados |
| 80+ | roadmaps completos |
| 12 | áreas de TI mapeadas |

Número: `font-display text-5xl md:text-6xl font-black text-violet-700`  
Stagger `Reveal` 60ms

---

### S7 — Planos

**Layout:** mantido — `grid lg:grid-cols-2`  
**Visual:** sem alteração (card branco vs `violet-800` com shadow amarelo)  
**Fundo:** `#faf8f4`

**SectionHeader:** label `"escolha seu ritmo"` · título `"Avance no seu pace"`

Mudanças apenas textuais:
- Gratuito: CTA `"Começar de graça"`; lista de features mais longa
- Pro: subtitle `"Para quem quer avançar mais rápido"`; CTA `"Quero acelerar com Pro"`

**Auth-aware:**
- Logado free: CTA Pro visível; sem CTA de cadastro no gratuito
- Logado pro: seção oculta ou mensagem `"Você já é Pro 🎉"`

---

### S8 — Carreira no Início da Jornada

Visual e código mantidos exatamente — apenas reposicionado após S7.  
**Fundo:** `#fffaf0` com grid 48px, `border-b-2 border-slate-950`

---

### S9 — Comunidade Viva

**Layout:** `lg:grid-cols-2` — 2 notícias (esq.) + 2 eventos (dir.)  
**Fundo:** branco, `border-b-2 border-slate-200`

**SectionHeader:** label `"acontecendo agora"` · título `"Notícias e eventos desta semana"`

Cards mantêm `.card-brutal` existente. Seção reduzida vs. atual.

---

### S10 — CTA Final

**Fundo:** `bg-[#FFB800]`, `border-y-2 border-slate-950`

**Auth-aware:**
- Não logado: `"Chega de ficar parado. Bora?"` + CTA `"Criar conta grátis"` (branco)
- Logado: `"Continue de onde parou."` + CTA `"Ver minha jornada"` → `/areas`

Remove `animate-gentle-float` do botão.

---

## Seções Removidas

| Seção | Justificativa |
|---|---|
| Pain cards (4 cards) | Precoce na narrativa |
| Quick access cards (6 cards) | Duplicata da trilha guiada |
| Feature cards (9 cards) | Substituído por trilha + explorador |
| Extra cards (12 cards) | Volume sem hierarquia |
| Cursos em destaque (4 cards) | Tático demais para home |
| Plataformas de estudo (4 cards) | Idem |
| `FloatingSignupBar` | Substituída por auth-aware inline |

---

## Comportamento Auth-Aware (regra geral)

```
user === null  →  CTAs de cadastro normais
user !== null  →  CTAs para /areas, /estudos, /roadmaps; nunca signup
isPro          →  Seção de planos oculta ou mensagem positiva
```

---

## Responsividade

| Breakpoint | Comportamento-chave |
|---|---|
| < 640px | Todos os grids: 1 col ou 2 cols; trilha vertical |
| 640–1024px | Grids 2–3 cols; trilha 2×2 |
| > 1024px | Layout completo conforme spec |

---

## Animações

Todas via `Reveal` existente + stagger por `delay` prop. Nenhuma animação nova necessária.

---

## Arquivos Alterados

| Arquivo | Natureza |
|---|---|
| `client/src/pages/HomeLanding.tsx` | Reescrita das seções abaixo do `<Header />` |

## Arquivos Intocados

`Header.tsx`, `AnimatedAreaMarquee.tsx`, `Footer.tsx`, `index.css`, `App.tsx`, `AuthContext.tsx`, `SubscriptionContext.tsx`, todos os `ui/`, todos os `lib/`.

---

## Critérios de Aceitação

- [ ] Header exatamente igual ao atual
- [ ] Nenhum elemento novo de identidade visual introduzido
- [ ] Fundo, tipografia, bordas e sombras idênticos ao design system
- [ ] Usuário logado não vê CTA de cadastro
- [ ] Usuário Pro não vê seção de planos (ou vê mensagem adequada)
- [ ] Responsivo em mobile, tablet e desktop
- [ ] Animações de scroll via `Reveal` em todas as seções
- [ ] Seções removidas não existem mais no HTML
- [ ] Plano gratuito parece forte e completo
- [ ] Plano Pro posicionado como acelerador, não como bloqueio
