# Sistema de Cores · Bora na Tech?

O sistema mapeia cor → família semântica → conjunto fixo de páginas. Cada família comunica a intenção de conteúdo antes de qualquer leitura. A regra de saturação restringe os tons usáveis para evitar que fundos grandes concorram com o conteúdo. O arquivo `client/src/lib/colorSystem.ts` é a fonte de verdade em código.

## Sistemas de Cor Independentes

O projeto BoraNaTech tem cinco sistemas de cor que coexistem em harmonia porque servem propósitos distintos. Este documento descreve principalmente o **Sistema 1**, mas reconhece formalmente os demais.

### Sistema 1: Cores Semânticas de Página

Comunica "do que esta página fala". É o sistema das 10 famílias documentado neste arquivo (discovery, technical, market, application, information, reference, community, women, creative, institutional).

**Quem controla:** designers/devs do projeto.  
**Onde vive:** layouts, heros, seções, componentes compartilhados.  
**Regras:** todas as documentadas neste arquivo.

### Sistema 2: Cores de Identidade Social

Comunica "quem é este usuário" em contextos sociais (avatar, futuramente: tags próprias, categorias criadas pelo usuário, etc).

**Quem controla:** cada usuário individual.  
**Onde vive:** elementos pessoais que aparecem em múltiplos contextos (avatar no header, avatar em comentários futuros, etc).  
**Regras:**

- Paleta pode incluir cores fora das 10 famílias de página (red, pink, green Tailwind puro, etc), diversidade é VALOR aqui, não problema
- Elementos personalizados sempre têm "contenção visual" (border-2 border-slate-950 neobrutalist) que isola a cor do contexto da página
- O namespace exclusivo de "women" (pink) se aplica apenas ao Sistema 1; no Sistema 2, pink é uma opção pessoal válida
- Customizações premium (Pro/Plus) podem ampliar a paleta

### Sistema 3: Cores de Ação

Comunica "esta ação tem natureza X" (destrutiva, sucesso, alerta), independente do tema da página ou da identidade do usuário.

**Quem controla:** padrões UX universais.  
**Onde vive:** botões de ação destrutiva (excluir, remover), mensagens de sucesso/erro, alertas, validações.  
**Regras:**

- Sucesso: emerald (usado neutralmente, não evoca família technical)
- Erro / destrutivo: rose ou red
- Alerta: amber (usado neutralmente, não evoca família market)
- Confirmação positiva: emerald-100 / emerald-700
- Exemplo aplicado: botão "Excluir conta" em /perfil usa rose-100 / rose-800 como cor de ação destrutiva, NÃO como família de página

### Sistema 4: Cores de Status Premium

Comunica "este elemento é exclusivo do plano pago" (Pro, Plus, ou planos futuros). É um sistema dourado consistente usado para diferenciar features grátis de features premium.

**Quem controla:** designers/devs do projeto (decisão de monetização).  
**Onde vive:** estrelas indicadoras, backgrounds de itens premium em menus, tags "Pro", botões de upgrade, marca premium em customizações.  
**Tokens:**

- `#FFB800`, token primário do Pro (botões "Assinar Pro", estrela cheia, ícones)
- `#FFF7D6`, background sutil de item Pro em listas (tint dourado)
- `#FFF2B8`, variante mais saturada do tint (hover, estado ativo)
- `#BA7517`, texto/borda de marca Pro (label "funcionalidade Pro", ícones de detalhe)

**Regras:**

- O dourado NUNCA é cor de família, é sempre marcador de status
- Aplicar consistentemente: se um botão premium tem estrela dourada, TODO botão premium na mesma página deve ter
- Em conjunto com cor de família: o dourado vence visualmente (é o que o usuário precisa ver primeiro)
- O sistema 4 é "transparente" às famílias, pode aparecer sobre qualquer fundo de família

**Exemplo aplicado:** dropdown "Carreira" no Header mostra estrelas douradas e background `#FFF7D6` em itens Pro (Salários, Currículo IA, etc), distinguindo-os dos itens gratuitos.

### Sistema 5: Acentos de Navegação (legado do Header)

O Header tem um sistema próprio de 5 cores customizadas que acentua cada grupo de menu. Documentado aqui como reconhecimento, **NÃO como sistema a ser ampliado**.

**Mapeamento atual:**

- Descobrir: `#534AB7`
- Aprender: `#3B6D11`
- Evoluir: `#BA7517` (também é cor do Sistema 4, coincidência histórica)
- Carreira: `#0F6E56`
- Comunidade: `#993C1D`

**Onde aparece:** apenas em 2 lugares no Header (hover 8% opacidade no desktop, border 3px no drawer mobile). Função visual extremamente sutil.

**Regras:**

- Sistema CONTIDO ao Header, não propagar para outras páginas
- Mudanças neste sistema requerem ajuste das 5 cores em conjunto (coerência interna)
- Quando refatorarmos o Header (fase futura), avaliar se vale manter esse sistema ou alinhar com famílias de página

### Coexistência

Os cinco sistemas coexistem em harmonia porque servem propósitos distintos e raramente competem visualmente. Conflitos potenciais são resolvidos por contenção visual (borda preta neobrutalist, espaço em branco, escala/tamanho) ou por hierarquia de propósito (Sistema 4 (status premium) visualmente vence Sistema 1 (família) quando coexistem, porque o status é a informação primária).

Exemplo: avatar do usuário com fundo rosa (Sistema 2) aparece no header de TODAS as páginas, incluindo páginas da família technical (emerald). Não há conflito porque a borda preta do avatar e o pequeno tamanho (~40px) isolam visualmente a cor pessoal do tema da página.

## Famílias

| Família         | Cor base | Tom claro     | Tom escuro    | Propósito                           | Páginas                                                                                                  |
| --------------- | -------- | ------------- | ------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `discovery`     | violet   | `violet-100`  | `violet-900`  | Exploração e orientação de carreira | Áreas, Quiz, Tecnologias, Comunidades, Faculdades                                                        |
| `technical`     | emerald  | `emerald-100` | `emerald-900` | Conteúdo prático e técnico          | Roadmaps, Portfólio, Evolução, TecnologiaMapa, Comparador, Plataformas, TecnologiaComparador             |
| `market`        | amber    | `amber-100`   | `amber-900`   | Mercado de trabalho e carreira      | Cursos, Estágio, Salários, TecnologiaRanking, Mentorias, Dicas, Estudos                                  |
| `application`   | blue     | `blue-100`    | `blue-900`    | Candidatura e processos seletivos   | Currículo, LinkedIn, Empresas, Entrevistas (todas), CurriculoAnalisar, PortfolioAnalisar                 |
| `information`   | sky      | `sky-100`     | `sky-900`     | Informação e atualidade             | Notícias, Inglês                                                                                         |
| `reference`     | cyan     | `cyan-100`    | `cyan-900`    | Referência e consulta rápida        | Dicionário                                                                                               |
| `community`     | fuchsia  | `fuchsia-100` | `fuchsia-900` | Comunidade e interação              | Eventos, Simulador de Carreira, EstudosDiário                                                            |
| `women`         | pink     | `pink-100`    | `pink-900`    | Identidade simbólica exclusiva      | Mulheres em TI                                                                                           |
| `creative`      | orange   | `orange-100`  | `orange-900`  | Criação e produção                  | Projetos, Freelance, Ferramentas                                                                         |
| `institutional` | cream    | `#faf8f4`     | `slate-900`   | Páginas neutras e institucionais    | HomeLanding, Sobre, Checkout, Perfil, Licença, Privacidade, Termos de Uso                                |

## Camadas de Aplicação da Cor

A cor da família se aplica em camadas hierárquicas. Cada camada tem um tom oficial e um uso obrigatório. Use Areas.tsx como referência visual canônica.

### Tabela de Camadas

| Camada                            | Tom                         | Uso                                 | Exemplo (família violet)                |
| --------------------------------- | --------------------------- | ----------------------------------- | --------------------------------------- |
| Hero (background do topo)         | -100                        | Topo da página, sempre              | bg-violet-100                           |
| Corpo da página                   | -50                         | `<section>` ou `<main>` após o hero | bg-violet-50                            |
| Área "ativa" (sticky bar, drawer) | -50                         | Filtros fixos, painéis laterais     | bg-violet-50                            |
| Border sutil (estado repouso)     | -200                        | Borders de input, divisores         | border-violet-200                       |
| Eyebrow / Pill de label           | -300 + border preta         | Tag uppercase no topo               | bg-violet-300 border-2 border-slate-950 |
| Border hover                      | -400                        | hover:border de inputs/botões       | hover:border-violet-400                 |
| Focus ring                        | -500                        | focus:border de inputs              | focus:border-violet-500                 |
| Estado ativo (botão pequeno, dot) | -600 ou -700                | Filtro ativo, dot preenchido        | bg-violet-700                           |
| Texto de ação inline              | -700                        | Links, "Explorar →", CTAs em texto  | text-violet-700                         |
| Hover de título                   | -700                        | group-hover:text-\* em títulos      | group-hover:text-violet-700             |
| Card de destaque escuro           | -900 + text-white           | CTAs invertidos                     | bg-violet-900 text-white                |
| Card regular                      | bg-white + border-slate-950 | Conteúdo principal                  | bg-white border-2 border-slate-950      |

### Regra Geral

- **Tons médios (-200 a -700)** são PERMITIDOS apenas em elementos pequenos pontuais: borders, hovers, focus, textos, dots, botões compactos.
- **Tons médios são PROIBIDOS em backgrounds grandes**: cards inteiros, seções inteiras, áreas hero. Esses ficam restritos a -50, -100, ou -900.
- O exemplo concreto que motivou a regra: um card com `bg-emerald-500` em área grande chama mais atenção que o conteúdo. Migrar para `bg-emerald-100` + border preta, ou `bg-emerald-900` + text-white.

### Exemplos

```tsx
// ✅ Permitido, borders e focus pequenos pontuais
<input className="border-violet-200 focus:border-violet-500" />

// ✅ Permitido, botão de filtro ativo pequeno
<button className="bg-violet-700 text-white px-3 py-1">Todos</button>

// ✅ Permitido, texto de ação inline
<a className="text-violet-700">Explorar →</a>

// ❌ Proibido, fundo médio em card grande
<div className="bg-violet-500 text-white rounded-2xl p-6">

// ✅ Correto A, pastel + neobrutalism
<div className="bg-violet-100 border-2 border-slate-950 rounded-2xl p-6">

// ✅ Correto B, escuro sóbrio com contraste
<div className="bg-violet-900 text-white rounded-2xl p-6">
```

## Accent Neutro

Botões secundários, links inline e ícones de UI em qualquer página usam `text-slate-950` e `border-slate-950`, nunca a cor da família nesses elementos. Isso uniformiza o neobrutalism (border quase-preta) e impede que a cor de fundo vire accent concorrente.

## Limites da Escala Amber

A escala amber do Tailwind perde identidade amarela em tons médios e escuros: `amber-500` já é amarelo forte limite, e `amber-700`+ é laranja-marrom. Isso significa que a regra "botão escuro usa -700 da família" não funciona literal para amber, precisa ajuste.

Para a família `market` (amber), aplicar:

- Botão submit: `bg-amber-500` + `text-slate-950` (texto preto sobre amarelo forte, em vez de `bg-amber-700`)
- Hover do botão: `hover:bg-amber-400` (clareia em vez de escurecer, mantém identidade amarela)
- Eyebrow do botão: `text-amber-900` (marrom escuro sobre amarelo, em vez de `text-amber-100` que sumiria)
- Focus ring de inputs: `focus:ring-amber-300` (mais contraste sobre `amber-50` que `-200`)
- Demais camadas (`-50`, `-100`, `-300`) permanecem como no resto do sistema

Outras famílias a observar (não estão sob exceção, avaliar se aparecer problema visual):

- `cyan-700` puxa para teal mas é tolerável
- `orange-700` é tom esperado da família, sem problema

O Sparkles wrapper "selo IA" continua em `bg-amber-300 text-slate-950` para **todas** as famílias (incluindo amber), é identidade transversal de IA, não está em jogo aqui.

### Consequência técnica

Para suportar essa exceção sem hardcode, o `AiToolPanel.tsx` usa estas chaves no objeto `ACCENT` (e qualquer componente futuro com botão escuro deve seguir o mesmo padrão):

| Chave           | Propósito                                 |
| --------------- | ----------------------------------------- |
| `buttonBg`      | background do botão submit                |
| `buttonHover`   | hover do background                       |
| `buttonText`    | cor do texto principal do botão           |
| `buttonEyebrow` | cor do texto do eyebrow "EXECUTAR COM IA" |

## Sombra Colorida vs Sombra Preta

O projeto usa sombra neobrutalist (`shadow-[Xpx_Xpx_0_#0f172a]`) como padrão estrutural em 95% dos elementos. Em casos estratégicos, sombra colorida da família da página substitui a preta para reforçar identidade narrativa.

**Quando usar sombra preta (padrão):**

- Botões de submit, navegações, headers
- Cards de listagem (cursos, vagas, etc, qualquer card "filtrável")
- Painéis estruturais, modais
- Inputs, selects, qualquer formulário

**Quando usar sombra colorida da família:**

- Apenas em elementos onde a página inteira é o "conteúdo central" e queremos reforçar a identidade da família
- Exemplo aplicado: cards de pergunta do `/quiz-carreira` (família discovery → `shadow-[5px_5px_0_#c4b5fd]` = violet-300)

**Como escolher o tom da sombra colorida:**

- Sempre use o tom -300 da família (não -500, não -700)
- Tons claros (-300) dão "ar de personalidade"; tons escuros viram competição visual com a sombra preta de outros elementos

**Regra de exclusão:**
Nunca use sombra colorida em elementos que coexistem com cards de sombra preta na mesma seção. Se decidir sombra colorida em um padrão, aplicar a TODOS os elementos similares daquela página.

## Padrões de Destaque (CTAs e Realces)

Decisões estabelecidas durante a Onda 4 que se aplicam a TODAS as páginas do projeto:

### Preto / slate-900 reservado para footer

O preto puro (`bg-slate-900`, `bg-black`) é reservado EXCLUSIVAMENTE para o footer do site. Em qualquer outro contexto (CTAs, cards destaque, heros) usar sempre:

- Cor da família da página (tons -100 claros com -700 escuros para borders/textos)
- Ou estruturais (`border-2 border-slate-950` sem fundo preto)

Razão: o preto em CTAs/cards cria competição visual desproporcional com o resto da página, e quebra a coerência cromática da família.

### Padrão de CTA destaque

Para CTAs de destaque (cards que chamam para ação principal dentro de uma página), usar o seguinte padrão dentro da família:

```jsx
<div className="bg-{família}-100 border-2 border-{família}-700 rounded-xl p-5">
  <p className="font-bold text-slate-950">{Título do CTA}</p>
  <p className="text-sm text-slate-700">{Subtítulo descritivo}</p>
  <Link className="bg-{família}-700 text-white border-2 border-{família}-700 hover:bg-{família}-800">
    {Ação}
  </Link>
</div>
```

Estrutura: fundo claro da família + border escura da família + textos neutros (slate-950/700) + botão sólido escuro da família.

Exemplo aplicado: CTA "Pronta para começar?" em `/roadmaps` usa `emerald-100` + `border-emerald-700` + botão `emerald-700`.

### Destaques numéricos ficam na cor da família

Números grandes em destaque (durações, métricas, contadores, preços) devem usar a cor da família da página, não outras famílias "chamativas" como `amber-600`.

Exemplo: filtros de duração em `/roadmaps` mostram "10 dias / 20 dias / etc" em `text-emerald-700` (família technical), não em `text-amber-600`.

Exceção: quando o número É inerentemente uma categorização semântica de outra família (ex: preço amber em página de cursos), Sistema 3 prevalece, usar cor da categorização. Esse caso é raro.

> Ver também: **[Coexistência](#coexistência)**, regras sobre como essas decisões interagem com cores de identidade social (Sistema 2) e acentos de navegação (Sistema 5) presentes na mesma página.

## Proteções e Exceções

| Exceção                                   | Regra                                                                                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `women`, pink                            | Cor de identidade simbólica. `pink-*` é proibido em qualquer outra página do sistema.                                                                  |
| Auth, Cadastro, RecuperarSenha, NovaSenha | Fora do sistema. Mantêm `hero-pattern` CSS atual. Não recebem família.                                                                                 |
| AreaDetalhe, TecnologiaDetalhe            | Fora do sistema cromático fixo. Usam `AREA_SLUG_ACCENT` / `accentForTechnology()`, o accent é identidade da área/tecnologia, não da página-container. |

## Migrações Necessárias

| Página                  | Arquivo                  | Cor atual                                            | Cor nova                            | Ação                                                                                                                                         |
| ----------------------- | ------------------------ | ---------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkout                | Checkout.tsx             | `bg-[#f5f0e8]`                                       | `bg-[#faf8f4]`                      | Trocar token cream                                                                                                                           |
| Checkout: Sucesso       | CheckoutSucesso.tsx      | `bg-[#f5f0e8]`                                       | `bg-[#faf8f4]`                      | Trocar token cream                                                                                                                           |
| Perfil                  | Perfil.tsx               | `bg-[#f5f0e8]`                                       | `bg-[#faf8f4]`                      | Trocar token cream                                                                                                                           |
| Sobre                   | Sobre.tsx                | `bg-[#f5f0e8]`                                       | `bg-[#faf8f4]`                      | Trocar token cream                                                                                                                           |
| Licença                 | Licenca.tsx              | LegalPage `violet-100`                               | `bg-[#faf8f4]`                      | Família → `institutional`                                                                                                                    |
| Privacidade             | Privacidade.tsx          | LegalPage `emerald-100`                              | `bg-[#faf8f4]`                      | Família → `institutional`                                                                                                                    |
| Termos de Uso           | TermosDeUso.tsx          | LegalPage `amber-100`                                | `bg-[#faf8f4]`                      | Família → `institutional`                                                                                                                    |
| Comparador de Cursos    | Comparador.tsx           | `bg-lime-100` / `bg-lime-300`                        | `bg-emerald-100` / `bg-emerald-300` | Trocar escala                                                                                                                                |
| Tecnologias: Mapa       | TecnologiaMapa.tsx       | PageHero `accent="teal"`                             | PageHero `accent="emerald"`         | Trocar prop                                                                                                                                  |
| Estudos: Diário         | EstudosDiario.tsx        | PageHero `accent="rose"`                             | PageHero `accent="fuchsia"`         | Trocar prop                                                                                                                                  |
| Entrevistas             | Entrevistas.tsx          | PageHero `accent="sky"`                              | PageHero `accent="blue"`            | Trocar prop                                                                                                                                  |
| Faculdades              | Faculdades.tsx           | `bg-indigo-100` / `bg-indigo-300`                    | `bg-violet-100` / `bg-violet-300`   | Trocar escala                                                                                                                                |
| Quiz de Carreira        | QuizCarreira.tsx         | `bg-purple-100` / `bg-purple-300`                    | `bg-violet-100` / `bg-violet-300`   | Trocar escala                                                                                                                                |
| Empresa: Ranking Júnior | EmpresaRankingJunior.tsx | PageHero (default violet)                            | PageHero `accent="blue"`            | Adicionar prop                                                                                                                               |
| Entrevista: Perguntas   | EntrevistaPerguntas.tsx  | PageHero (default violet)                            | PageHero `accent="blue"`            | Adicionar prop                                                                                                                               |
| Entrevista: Simulador   | EntrevistaSimulador.tsx  | PageHero (default violet)                            | PageHero `accent="blue"`            | Adicionar prop                                                                                                                               |
| Entrevista: Desafios    | EntrevistaDesafios.tsx   | PageHero (default violet)                            | PageHero `accent="blue"`            | Adicionar prop                                                                                                                               |
| Tecnologias: Comparador | TecnologiaComparador.tsx | PageHero (default violet)                            | PageHero `accent="emerald"`         | Adicionar prop                                                                                                                               |
| Currículo: Analisar     | CurriculoAnalisar.tsx    | PageHero `accent="amber"`                            | PageHero `accent="blue"`            | Trocar prop                                                                                                                                  |
| Portfolio: Analisar     | PortfolioAnalisar.tsx    | PageHero `accent="violet"`                           | PageHero `accent="blue"`            | Trocar prop                                                                                                                                  |
| Plataformas             | Plataformas.tsx          | `bg-blue-100` / `bg-blue-300`                        | `bg-emerald-100` / `bg-emerald-300` | Trocar escala                                                                                                                                |
| Auditoria de saturação  | Todas as páginas         | tons médios (`-400` a `-700`) em backgrounds grandes | tons `-100` ou `-800`/`-900`        | Auditar caso a caso durante implementação. Exemplo confirmado: card "Analisar seu portfólio" em Portfolio.tsx usa `bg-emerald-500`, migrar. |

## TODO Futuro

> Renomear rota /pro para /planos. Migração separada que toca App.tsx, links da home (S5 e S7), header (botão Cadastre-se agora), footer, links das Ferramentas Pro, e provavelmente um redirect no vercel.json. Atualizar também o slug `'pro'` → `'planos'` em PAGE_FAMILY. Fazer depois da Fase 3 (migrações cromáticas) e Fase 4 (refactor da home).
