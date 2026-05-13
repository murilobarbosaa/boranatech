# Sistema de Cores — Bora na Tech?

O sistema mapeia cor → família semântica → conjunto fixo de páginas. Cada família comunica a intenção de conteúdo antes de qualquer leitura. A regra de saturação restringe os tons usáveis para evitar que fundos grandes concorram com o conteúdo. O arquivo `client/src/lib/colorSystem.ts` é a fonte de verdade em código.

## Famílias

| Família | Cor base | Tom claro | Tom escuro | Propósito | Páginas |
|---|---|---|---|---|---|
| `discovery` | violet | `violet-100` | `violet-900` | Exploração e orientação de carreira | Áreas, Quiz, Tecnologias, Comunidades, Faculdades |
| `technical` | emerald | `emerald-100` | `emerald-900` | Conteúdo prático e técnico | Roadmaps, Portfólio, Evolução, TecnologiaMapa, Networking, Comparador, Plataformas, TecnologiaComparador |
| `market` | amber | `amber-100` | `amber-900` | Mercado de trabalho e carreira | Cursos, Estágio, Salários, TecnologiaRanking, Mentorias, Dicas, Estudos, Empregabilidade |
| `application` | blue | `blue-100` | `blue-900` | Candidatura e processos seletivos | Currículo, LinkedIn, Empresas, Entrevistas (todas), CurriculoAnalisar, PortfolioAnalisar |
| `information` | sky | `sky-100` | `sky-900` | Informação e atualidade | Notícias, Inglês |
| `reference` | cyan | `cyan-100` | `cyan-900` | Referência e consulta rápida | Dicionário |
| `community` | fuchsia | `fuchsia-100` | `fuchsia-900` | Comunidade e interação | Eventos, Simulador de Carreira, EstudosDiário |
| `women` | pink | `pink-100` | `pink-900` | Identidade simbólica exclusiva | Mulheres em TI |
| `creative` | orange | `orange-100` | `orange-900` | Criação e produção | Projetos, Freelance, Ferramentas |
| `institutional` | cream | `#faf8f4` | `slate-900` | Páginas neutras e institucionais | HomeLanding, Sobre, Checkout, Perfil, Licença, Privacidade, Termos de Uso |

## Camadas de Aplicação da Cor

A cor da família se aplica em camadas hierárquicas. Cada camada tem um tom oficial e um uso obrigatório. Use Areas.tsx como referência visual canônica.

### Tabela de Camadas

| Camada | Tom | Uso | Exemplo (família violet) |
|---|---|---|---|
| Hero (background do topo) | -100 | Topo da página, sempre | bg-violet-100 |
| Corpo da página | -50 | `<section>` ou `<main>` após o hero | bg-violet-50 |
| Área "ativa" (sticky bar, drawer) | -50 | Filtros fixos, painéis laterais | bg-violet-50 |
| Border sutil (estado repouso) | -200 | Borders de input, divisores | border-violet-200 |
| Eyebrow / Pill de label | -300 + border preta | Tag uppercase no topo | bg-violet-300 border-2 border-slate-950 |
| Border hover | -400 | hover:border de inputs/botões | hover:border-violet-400 |
| Focus ring | -500 | focus:border de inputs | focus:border-violet-500 |
| Estado ativo (botão pequeno, dot) | -600 ou -700 | Filtro ativo, dot preenchido | bg-violet-700 |
| Texto de ação inline | -700 | Links, "Explorar →", CTAs em texto | text-violet-700 |
| Hover de título | -700 | group-hover:text-* em títulos | group-hover:text-violet-700 |
| Card de destaque escuro | -900 + text-white | CTAs invertidos | bg-violet-900 text-white |
| Card regular | bg-white + border-slate-950 | Conteúdo principal | bg-white border-2 border-slate-950 |

### Regra Geral

- **Tons médios (-200 a -700)** são PERMITIDOS apenas em elementos pequenos pontuais: borders, hovers, focus, textos, dots, botões compactos.
- **Tons médios são PROIBIDOS em backgrounds grandes**: cards inteiros, seções inteiras, áreas hero. Esses ficam restritos a -50, -100, ou -900.
- O exemplo concreto que motivou a regra: um card com `bg-emerald-500` em área grande chama mais atenção que o conteúdo. Migrar para `bg-emerald-100` + border preta, ou `bg-emerald-900` + text-white.

### Exemplos

```tsx
// ✅ Permitido — borders e focus pequenos pontuais
<input className="border-violet-200 focus:border-violet-500" />

// ✅ Permitido — botão de filtro ativo pequeno
<button className="bg-violet-700 text-white px-3 py-1">Todos</button>

// ✅ Permitido — texto de ação inline
<a className="text-violet-700">Explorar →</a>

// ❌ Proibido — fundo médio em card grande
<div className="bg-violet-500 text-white rounded-2xl p-6">

// ✅ Correto A — pastel + neobrutalism
<div className="bg-violet-100 border-2 border-slate-950 rounded-2xl p-6">

// ✅ Correto B — escuro sóbrio com contraste
<div className="bg-violet-900 text-white rounded-2xl p-6">
```

## Accent Neutro

Botões secundários, links inline e ícones de UI em qualquer página usam `text-slate-950` e `border-slate-950` — nunca a cor da família nesses elementos. Isso uniformiza o neobrutalism (border quase-preta) e impede que a cor de fundo vire accent concorrente.

## Limites da Escala Amber

A escala amber do Tailwind perde identidade amarela em tons médios e escuros: `amber-500` já é amarelo forte limite, e `amber-700`+ é laranja-marrom. Isso significa que a regra "botão escuro usa -700 da família" não funciona literal para amber — precisa ajuste.

Para a família `market` (amber), aplicar:
- Botão submit: `bg-amber-500` + `text-slate-950` (texto preto sobre amarelo forte, em vez de `bg-amber-700`)
- Hover do botão: `hover:bg-amber-400` (clareia em vez de escurecer — mantém identidade amarela)
- Eyebrow do botão: `text-amber-900` (marrom escuro sobre amarelo, em vez de `text-amber-100` que sumiria)
- Focus ring de inputs: `focus:ring-amber-300` (mais contraste sobre `amber-50` que `-200`)
- Demais camadas (`-50`, `-100`, `-300`) permanecem como no resto do sistema

Outras famílias a observar (não estão sob exceção — avaliar se aparecer problema visual):
- `cyan-700` puxa para teal mas é tolerável
- `orange-700` é tom esperado da família, sem problema

O Sparkles wrapper "selo IA" continua em `bg-amber-300 text-slate-950` para **todas** as famílias (incluindo amber) — é identidade transversal de IA, não está em jogo aqui.

### Consequência técnica

Para suportar essa exceção sem hardcode, o `AiToolPanel.tsx` usa estas chaves no objeto `ACCENT` (e qualquer componente futuro com botão escuro deve seguir o mesmo padrão):

| Chave | Propósito |
|---|---|
| `buttonBg` | background do botão submit |
| `buttonHover` | hover do background |
| `buttonText` | cor do texto principal do botão |
| `buttonEyebrow` | cor do texto do eyebrow "EXECUTAR COM IA" |

## Proteções e Exceções

| Exceção | Regra |
|---|---|
| `women` — pink | Cor de identidade simbólica. `pink-*` é proibido em qualquer outra página do sistema. |
| Auth, Cadastro, RecuperarSenha, NovaSenha | Fora do sistema. Mantêm `hero-pattern` CSS atual. Não recebem família. |
| AreaDetalhe, TecnologiaDetalhe | Fora do sistema cromático fixo. Usam `AREA_SLUG_ACCENT` / `accentForTechnology()` — o accent é identidade da área/tecnologia, não da página-container. |

## Migrações Necessárias

| Página | Arquivo | Cor atual | Cor nova | Ação |
|---|---|---|---|---|
| Checkout | Checkout.tsx | `bg-[#f5f0e8]` | `bg-[#faf8f4]` | Trocar token cream |
| Checkout: Sucesso | CheckoutSucesso.tsx | `bg-[#f5f0e8]` | `bg-[#faf8f4]` | Trocar token cream |
| Perfil | Perfil.tsx | `bg-[#f5f0e8]` | `bg-[#faf8f4]` | Trocar token cream |
| Sobre | Sobre.tsx | `bg-[#f5f0e8]` | `bg-[#faf8f4]` | Trocar token cream |
| Licença | Licenca.tsx | LegalPage `violet-100` | `bg-[#faf8f4]` | Família → `institutional` |
| Privacidade | Privacidade.tsx | LegalPage `emerald-100` | `bg-[#faf8f4]` | Família → `institutional` |
| Termos de Uso | TermosDeUso.tsx | LegalPage `amber-100` | `bg-[#faf8f4]` | Família → `institutional` |
| Comparador de Cursos | Comparador.tsx | `bg-lime-100` / `bg-lime-300` | `bg-emerald-100` / `bg-emerald-300` | Trocar escala |
| Tecnologias: Mapa | TecnologiaMapa.tsx | PageHero `accent="teal"` | PageHero `accent="emerald"` | Trocar prop |
| Networking | Networking.tsx | PageHero `accent="teal"` | PageHero `accent="emerald"` | Trocar prop |
| Estudos: Diário | EstudosDiario.tsx | PageHero `accent="rose"` | PageHero `accent="fuchsia"` | Trocar prop |
| Entrevistas | Entrevistas.tsx | PageHero `accent="sky"` | PageHero `accent="blue"` | Trocar prop |
| Faculdades | Faculdades.tsx | `bg-indigo-100` / `bg-indigo-300` | `bg-violet-100` / `bg-violet-300` | Trocar escala |
| Quiz de Carreira | QuizCarreira.tsx | `bg-purple-100` / `bg-purple-300` | `bg-violet-100` / `bg-violet-300` | Trocar escala |
| Empresa: Ranking Júnior | EmpresaRankingJunior.tsx | PageHero (default violet) | PageHero `accent="blue"` | Adicionar prop |
| Entrevista: Perguntas | EntrevistaPerguntas.tsx | PageHero (default violet) | PageHero `accent="blue"` | Adicionar prop |
| Entrevista: Simulador | EntrevistaSimulador.tsx | PageHero (default violet) | PageHero `accent="blue"` | Adicionar prop |
| Entrevista: Desafios | EntrevistaDesafios.tsx | PageHero (default violet) | PageHero `accent="blue"` | Adicionar prop |
| Tecnologias: Comparador | TecnologiaComparador.tsx | PageHero (default violet) | PageHero `accent="emerald"` | Adicionar prop |
| Currículo: Analisar | CurriculoAnalisar.tsx | PageHero `accent="amber"` | PageHero `accent="blue"` | Trocar prop |
| Portfolio: Analisar | PortfolioAnalisar.tsx | PageHero `accent="violet"` | PageHero `accent="blue"` | Trocar prop |
| Plataformas | Plataformas.tsx | `bg-blue-100` / `bg-blue-300` | `bg-emerald-100` / `bg-emerald-300` | Trocar escala |
| Empregabilidade | Empregabilidade.tsx | PageHero `accent="violet"` | PageHero `accent="amber"` | Trocar prop |
| Auditoria de saturação | Todas as páginas | tons médios (`-400` a `-700`) em backgrounds grandes | tons `-100` ou `-800`/`-900` | Auditar caso a caso durante implementação. Exemplo confirmado: card "Analisar seu portfólio" em Portfolio.tsx usa `bg-emerald-500` — migrar. |

## TODO Futuro

> Renomear rota /pro para /planos. Migração separada que toca App.tsx, links da home (S5 e S7), header (botão Cadastre-se agora), footer, links das Ferramentas Pro, e provavelmente um redirect no vercel.json. Atualizar também o slug `'pro'` → `'planos'` em PAGE_FAMILY. Fazer depois da Fase 3 (migrações cromáticas) e Fase 4 (refactor da home).
