import type { RoadmapV2 } from "./types";

export const frontend: RoadmapV2 = {
  slug: "frontend",
  area: "frontend",
  title: "Front-end do Zero",
  level: "Iniciante",
  description: "Do básico da web até publicar uma aplicação React. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos",
      level: "iniciante",
      description: "Como a web funciona e a base de HTML e CSS.",
      children: [
        {
          id: "fundamentos.web",
          title: "Como a web funciona",
          children: [
            { id: "fundamentos.web.http", title: "Cliente, servidor, HTTP e HTTPS", description: "Como o navegador e o servidor conversam, e o que o HTTPS protege nessa troca.", resources: [{ label: "MDN HTTP", url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP", kind: "doc" }] },
            { id: "fundamentos.web.dns", title: "DNS, domínios e hospedagem", description: "O que acontece entre digitar um endereço e a página aparecer." },
            { id: "fundamentos.web.render", title: "Como o navegador renderiza uma página", description: "O caminho do HTML e do CSS até virar o que você vê na tela." },
            { id: "fundamentos.web.devtools", title: "DevTools do navegador", description: "As ferramentas embutidas pra inspecionar, depurar e medir sua página.", resources: [{ label: "Chrome DevTools", url: "https://developer.chrome.com/docs/devtools", kind: "doc" }] },
          ],
        },
        {
          id: "fundamentos.html",
          title: "HTML",
          children: [
            { id: "fundamentos.html.estrutura", title: "Estrutura do documento", description: "Os elementos básicos que todo HTML precisa pra existir.", resources: [{ label: "MDN HTML", url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML", kind: "doc" }] },
            { id: "fundamentos.html.semantica", title: "Tags semânticas", description: "Usar tags que descrevem o significado do conteúdo, não só a aparência." },
            { id: "fundamentos.html.forms", title: "Formulários e validação", description: "Capturar dados do usuário e checar se vieram certos." },
            { id: "fundamentos.html.a11y", title: "Acessibilidade (alt, label, aria)", description: "Fazer sua página funcionar pra todo mundo, incluindo leitores de tela.", resources: [{ label: "web.dev Acessibilidade", url: "https://web.dev/learn/accessibility", kind: "curso" }] },
            { id: "fundamentos.html.seo", title: "SEO básico (meta tags, títulos)", description: "O mínimo pra os buscadores entenderem e indexarem sua página.", optional: true },
          ],
        },
        {
          id: "fundamentos.css",
          title: "CSS",
          children: [
            { id: "fundamentos.css.seletores", title: "Seletores e especificidade", description: "Como apontar quais elementos estilizar e quem vence quando há conflito.", resources: [{ label: "MDN CSS", url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS", kind: "doc" }, { label: "CSS-Tricks", url: "https://css-tricks.com", kind: "artigo" }] },
            { id: "fundamentos.css.boxmodel", title: "Box model", description: "Entender margin, border, padding e content, a base de todo layout." },
            { id: "fundamentos.css.unidades", title: "Unidades (px, rem, %, vh)", description: "Quando usar cada medida e por quê." },
            { id: "fundamentos.css.posicionamento", title: "Posicionamento e z-index", description: "Controlar onde os elementos ficam e quem aparece na frente." },
            {
              id: "fundamentos.css.flexbox",
              title: "Flexbox",
              children: [
                { id: "fundamentos.css.flexbox.eixos", title: "Eixos e container", description: "O modelo de eixo principal e cruzado que rege o Flexbox.", resources: [{ label: "CSS-Tricks Flexbox", url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox", kind: "artigo" }] },
                { id: "fundamentos.css.flexbox.itens", title: "Propriedades dos itens", description: "Como cada filho cresce, encolhe e se alinha." },
                { id: "fundamentos.css.flexbox.padroes", title: "Padrões comuns de layout", description: "Receitas de Flexbox pros arranjos que você mais vai usar." },
              ],
            },
            {
              id: "fundamentos.css.grid",
              title: "Grid",
              children: [
                { id: "fundamentos.css.grid.colunas", title: "Linhas, colunas e gaps", description: "Montar grades de duas dimensões com espaçamento controlado.", resources: [{ label: "CSS-Tricks Grid", url: "https://css-tricks.com/snippets/css/complete-guide-grid", kind: "artigo" }] },
                { id: "fundamentos.css.grid.areas", title: "Áreas e alinhamento", description: "Nomear regiões da grade e posicionar conteúdo nelas." },
              ],
            },
            { id: "fundamentos.css.responsivo", title: "Responsividade (mobile-first)", description: "Fazer o layout se adaptar de celulares a telas grandes.", resources: [{ label: "web.dev Responsive", url: "https://web.dev/learn/design", kind: "curso" }] },
            { id: "fundamentos.css.animacoes", title: "Transições e animações", description: "Dar movimento e feedback visual com CSS." },
            {
              id: "fundamentos.css.arquitetura",
              title: "Arquitetura de CSS",
              optional: true,
              children: [
                { id: "fundamentos.css.arquitetura.sass", title: "Preprocessadores (Sass)", description: "Escrever CSS com variáveis, aninhamento e reúso.", optional: true, resources: [{ label: "Sass", url: "https://sass-lang.com/documentation", kind: "doc" }] },
                { id: "fundamentos.css.arquitetura.bem", title: "Metodologias (BEM)", description: "Uma convenção de nomes pra manter o CSS organizado em projetos grandes.", optional: true },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "javascript",
      title: "JavaScript",
      level: "iniciante",
      description: "A linguagem que dá vida à página.",
      children: [
        {
          id: "javascript.fundamentos",
          title: "Fundamentos",
          children: [
            { id: "javascript.fundamentos.tipos", title: "Tipos e variáveis", description: "Os tipos de dados do JavaScript e como guardar valores.", resources: [{ label: "JavaScript.info", url: "https://javascript.info", kind: "curso" }] },
            { id: "javascript.fundamentos.controle", title: "Condicionais e laços", description: "Tomar decisões e repetir ações no código." },
            { id: "javascript.fundamentos.funcoes", title: "Funções e escopo", description: "Empacotar lógica reutilizável e entender onde as variáveis vivem.", resources: [{ label: "MDN Functions", url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Functions", kind: "doc" }] },
            { id: "javascript.fundamentos.arrow", title: "Arrow functions e this", description: "A sintaxe enxuta de função e como ela trata o this." },
            { id: "javascript.fundamentos.modulos", title: "Módulos (import / export)", description: "Quebrar o código em arquivos que se importam." },
          ],
        },
        {
          id: "javascript.dados",
          title: "Dados",
          children: [
            { id: "javascript.dados.arrays", title: "Arrays (map, filter, reduce)", description: "Transformar e filtrar listas sem laços manuais.", resources: [{ label: "MDN Array", url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Array", kind: "doc" }] },
            { id: "javascript.dados.objetos", title: "Objetos e desestruturação", description: "Estruturar dados em pares chave-valor e extrair o que precisa." },
            { id: "javascript.dados.json", title: "JSON", description: "O formato que o front e o back usam pra trocar dados." },
          ],
        },
        {
          id: "javascript.dom",
          title: "DOM e eventos",
          children: [
            { id: "javascript.dom.manipular", title: "Manipular elementos", description: "Ler e mudar a página pelo JavaScript.", resources: [{ label: "MDN DOM", url: "https://developer.mozilla.org/pt-BR/docs/Web/API/Document_Object_Model", kind: "doc" }] },
            { id: "javascript.dom.eventos", title: "Eventos e delegação", description: "Reagir a cliques, teclas e outras ações do usuário." },
            { id: "javascript.dom.storage", title: "localStorage e sessionStorage", description: "Guardar dados no navegador entre visitas.", resources: [{ label: "MDN Web Storage", url: "https://developer.mozilla.org/pt-BR/docs/Web/API/Web_Storage_API", kind: "doc" }] },
          ],
        },
        {
          id: "javascript.async",
          title: "Assíncrono",
          children: [
            { id: "javascript.async.promises", title: "Promises", description: "Lidar com operações que terminam no futuro.", resources: [{ label: "JavaScript.info Promises", url: "https://javascript.info/promise-basics", kind: "curso" }] },
            { id: "javascript.async.awaitasync", title: "async / await", description: "Escrever código assíncrono que parece síncrono." },
            { id: "javascript.async.fetch", title: "fetch e consumo de APIs", description: "Buscar dados de um servidor pela rede." },
            { id: "javascript.async.erros", title: "Tratamento de erros", description: "Capturar e tratar o que pode dar errado." },
          ],
        },
      ],
    },
    {
      id: "ferramentas",
      title: "Ferramentas",
      level: "intermediario",
      description: "O que todo dev usa no dia a dia.",
      children: [
        {
          id: "ferramentas.git",
          title: "Git e GitHub",
          children: [
            { id: "ferramentas.git.basico", title: "add, commit, push", description: "O ciclo básico de salvar e enviar seu código.", resources: [{ label: "Documentação Git", url: "https://git-scm.com/doc", kind: "doc" }] },
            { id: "ferramentas.git.branches", title: "Branches e merge", description: "Trabalhar em paralelo e juntar as mudanças." },
            { id: "ferramentas.git.pr", title: "Pull requests", description: "Propor e revisar mudanças antes de integrar." },
          ],
        },
        { id: "ferramentas.terminal", title: "Terminal básico", description: "Os comandos essenciais pra se virar na linha de comando." },
        { id: "ferramentas.npm", title: "Gerenciadores de pacote (npm, pnpm)", description: "Instalar e gerenciar as bibliotecas do projeto." },
        { id: "ferramentas.bundler", title: "Bundler (Vite)", description: "A ferramenta que junta e serve seu código em dev e produção.", resources: [{ label: "Vite", url: "https://vite.dev/guide", kind: "doc" }] },
        { id: "ferramentas.webpack", title: "Webpack e esbuild", description: "Outros bundlers que você vai encontrar por aí.", optional: true },
        { id: "ferramentas.lint", title: "ESLint e Prettier", description: "Padronizar e achar problemas no código automaticamente.", resources: [{ label: "ESLint", url: "https://eslint.org/docs/latest", kind: "doc" }, { label: "Prettier", url: "https://prettier.io/docs/en", kind: "doc" }] },
      ],
    },
    {
      id: "react",
      title: "React",
      level: "intermediario",
      description: "A biblioteca pra construir interfaces de verdade.",
      children: [
        {
          id: "react.base",
          title: "Base",
          children: [
            { id: "react.base.jsx", title: "JSX", description: "A sintaxe que mistura marcação e JavaScript no React.", resources: [{ label: "React Docs", url: "https://react.dev/learn", kind: "doc" }] },
            { id: "react.base.componentes", title: "Componentes", description: "Os blocos reutilizáveis que montam a interface." },
            { id: "react.base.props", title: "Props", description: "Passar dados de um componente pai pro filho." },
          ],
        },
        {
          id: "react.estado",
          title: "Estado e renderização",
          children: [
            { id: "react.estado.usestate", title: "useState", description: "Guardar e atualizar estado dentro de um componente.", resources: [{ label: "React useState", url: "https://react.dev/reference/react/useState", kind: "doc" }] },
            { id: "react.estado.condicional", title: "Renderização condicional", description: "Mostrar coisas diferentes conforme o estado." },
            { id: "react.estado.listas", title: "Listas e keys", description: "Renderizar coleções e ajudar o React a rastreá-las." },
            { id: "react.estado.useeffect", title: "useEffect", description: "Rodar efeitos colaterais, como buscar dados, no ciclo do componente.", resources: [{ label: "React useEffect", url: "https://react.dev/reference/react/useEffect", kind: "doc" }] },
          ],
        },
        {
          id: "react.hooks",
          title: "Hooks",
          children: [
            { id: "react.hooks.usecontext", title: "useContext", description: "Compartilhar dados sem passar props por vários níveis." },
            { id: "react.hooks.useref", title: "useRef", description: "Guardar valores ou referenciar elementos sem re-renderizar." },
            { id: "react.hooks.usememo", title: "useMemo e useCallback", description: "Evitar recálculos e re-renders desnecessários." },
            { id: "react.hooks.custom", title: "Hooks customizados", description: "Extrair lógica reutilizável pros seus próprios hooks." },
          ],
        },
        { id: "react.forms", title: "Formulários controlados", description: "Ligar os inputs ao estado do React." },
        { id: "react.routing", title: "Roteamento (React Router)", description: "Navegar entre páginas numa SPA." },
        { id: "react.fetching", title: "Data fetching (TanStack Query)", description: "Buscar, cachear e sincronizar dados do servidor com menos código.", optional: true, resources: [{ label: "TanStack Query", url: "https://tanstack.com/query/latest", kind: "doc" }] },
        {
          id: "react.estadoglobal",
          title: "Estado global",
          optional: true,
          children: [
            { id: "react.estadoglobal.context", title: "Context API para estado", description: "Estado global simples sem biblioteca externa." },
            { id: "react.estadoglobal.libs", title: "Redux ou Zustand", description: "Bibliotecas pra estado global em apps maiores.", optional: true, resources: [{ label: "Redux", url: "https://redux.js.org/introduction/getting-started", kind: "doc" }] },
          ],
        },
        { id: "react.errorboundary", title: "Error boundaries", description: "Capturar erros de renderização sem quebrar o app inteiro.", optional: true },
      ],
    },
    {
      id: "apis",
      title: "APIs",
      level: "intermediario",
      description: "Conectar o front a um back-end.",
      children: [
        { id: "apis.rest", title: "REST e status HTTP", description: "O padrão mais comum de API e o que cada código de status diz.", resources: [{ label: "MDN HTTP Status", url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status", kind: "doc" }] },
        { id: "apis.clientes", title: "fetch e axios", description: "As duas formas mais usadas de chamar APIs no front." },
        { id: "apis.estados", title: "Estados de loading e erro", description: "Mostrar carregamento e falhas pro usuário." },
        { id: "apis.cors", title: "CORS", description: "Por que o navegador bloqueia certas requisições e como resolver.", resources: [{ label: "MDN CORS", url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CORS", kind: "doc" }] },
        {
          id: "apis.auth",
          title: "Autenticação",
          children: [
            { id: "apis.auth.jwt", title: "JWT", description: "Tokens pra identificar o usuário em cada requisição." },
            { id: "apis.auth.sessoes", title: "Sessões e cookies", description: "A forma clássica de manter o usuário logado." },
            { id: "apis.auth.oauth", title: "OAuth", description: "Login via terceiros, como Google e GitHub.", optional: true },
          ],
        },
        { id: "apis.graphql", title: "GraphQL", description: "Uma alternativa ao REST onde o cliente pede exatamente os dados que quer.", optional: true, resources: [{ label: "GraphQL", url: "https://graphql.org/learn", kind: "doc" }] },
      ],
    },
    {
      id: "qualidade",
      title: "Qualidade e Boas Práticas",
      level: "avancado",
      description: "O que separa um projeto de estudo de um profissional.",
      children: [
        { id: "qualidade.typescript", title: "TypeScript no front", description: "Adicionar tipos ao JavaScript pra pegar erros antes de rodar.", resources: [{ label: "TypeScript", url: "https://www.typescriptlang.org/docs", kind: "doc" }] },
        { id: "qualidade.estilo", title: "Estilização em escala (Tailwind, CSS Modules)", description: "Manter o CSS organizado conforme o projeto cresce.", resources: [{ label: "Tailwind CSS", url: "https://tailwindcss.com/docs", kind: "doc" }] },
        {
          id: "qualidade.testes",
          title: "Testes",
          children: [
            { id: "qualidade.testes.unit", title: "Unitários (Vitest, Testing Library)", description: "Testar pedaços do código de forma automática.", resources: [{ label: "Testing Library", url: "https://testing-library.com/docs", kind: "doc" }] },
            { id: "qualidade.testes.e2e", title: "End-to-end (Playwright)", description: "Testar o app inteiro como um usuário usaria.", optional: true, resources: [{ label: "Playwright", url: "https://playwright.dev/docs/intro", kind: "doc" }] },
          ],
        },
        { id: "qualidade.performance", title: "Performance (Core Web Vitals, Lighthouse)", description: "Medir e melhorar a velocidade percebida da página.", resources: [{ label: "web.dev Vitals", url: "https://web.dev/explore/learn-core-web-vitals", kind: "curso" }] },
        { id: "qualidade.seguranca", title: "Segurança (XSS, CSRF, CSP)", description: "As ameaças comuns do front e como se proteger.", resources: [{ label: "OWASP", url: "https://owasp.org/www-project-top-ten", kind: "doc" }] },
        { id: "qualidade.a11y", title: "Acessibilidade avançada (ARIA, teclado, leitor de tela)", description: "Ir além do básico pra uma experiência inclusiva de verdade.", optional: true },
      ],
    },
    {
      id: "projeto",
      title: "Projeto e Deploy",
      level: "avancado",
      description: "Juntar tudo e publicar.",
      children: [
        { id: "projeto.planejar", title: "Planejar um projeto real", description: "Definir escopo e estrutura antes de codar." },
        { id: "projeto.construir", title: "Construir aplicando tudo", description: "Juntar o que você aprendeu num projeto de ponta a ponta." },
        { id: "projeto.env", title: "Variáveis de ambiente (.env)", description: "Guardar configs e segredos fora do código." },
        { id: "projeto.readme", title: "Documentar (README)", description: "Explicar seu projeto pra quem chega depois, inclusive você." },
        { id: "projeto.deploy", title: "Deploy", description: "Colocar seu projeto no ar pra qualquer um acessar.", resources: [{ label: "Vercel", url: "https://vercel.com/docs", kind: "doc" }, { label: "Netlify", url: "https://docs.netlify.com", kind: "doc" }] },
        { id: "projeto.ssr", title: "SSR e SSG (conceito, Next.js)", description: "Renderizar no servidor pra ganhar performance e SEO.", optional: true, resources: [{ label: "Next.js", url: "https://nextjs.org/docs", kind: "doc" }] },
        { id: "projeto.ci", title: "CI básico", description: "Automatizar testes e build a cada mudança.", optional: true },
      ],
    },
  ],
};
