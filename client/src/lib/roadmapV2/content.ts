import type { RoadmapV2 } from "./types";

export const frontend: RoadmapV2 = {
  slug: "frontend",
  area: "frontend",
  title: "Front-end do Zero",
  level: "Iniciante",
  description: "Do basico da web ate publicar uma aplicacao React. Conclua uma etapa pra liberar a proxima.",
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
            { id: "fundamentos.web.http", title: "Cliente, servidor, HTTP e HTTPS", resources: [{ label: "MDN HTTP", url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP", kind: "doc" }] },
            { id: "fundamentos.web.dns", title: "DNS, dominios e hospedagem" },
            { id: "fundamentos.web.render", title: "Como o navegador renderiza uma pagina" },
            { id: "fundamentos.web.devtools", title: "DevTools do navegador", resources: [{ label: "Chrome DevTools", url: "https://developer.chrome.com/docs/devtools", kind: "doc" }] },
          ],
        },
        {
          id: "fundamentos.html",
          title: "HTML",
          children: [
            { id: "fundamentos.html.estrutura", title: "Estrutura do documento", resources: [{ label: "MDN HTML", url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML", kind: "doc" }] },
            { id: "fundamentos.html.semantica", title: "Tags semanticas" },
            { id: "fundamentos.html.forms", title: "Formularios e validacao" },
            { id: "fundamentos.html.a11y", title: "Acessibilidade (alt, label, aria)", resources: [{ label: "web.dev Acessibilidade", url: "https://web.dev/learn/accessibility", kind: "curso" }] },
            { id: "fundamentos.html.seo", title: "SEO basico (meta tags, titulos)", optional: true },
          ],
        },
        {
          id: "fundamentos.css",
          title: "CSS",
          children: [
            { id: "fundamentos.css.seletores", title: "Seletores e especificidade", resources: [{ label: "MDN CSS", url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS", kind: "doc" }, { label: "CSS-Tricks", url: "https://css-tricks.com", kind: "artigo" }] },
            { id: "fundamentos.css.boxmodel", title: "Box model" },
            { id: "fundamentos.css.unidades", title: "Unidades (px, rem, %, vh)" },
            { id: "fundamentos.css.posicionamento", title: "Posicionamento e z-index" },
            {
              id: "fundamentos.css.flexbox",
              title: "Flexbox",
              children: [
                { id: "fundamentos.css.flexbox.eixos", title: "Eixos e container", resources: [{ label: "CSS-Tricks Flexbox", url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox", kind: "artigo" }] },
                { id: "fundamentos.css.flexbox.itens", title: "Propriedades dos itens" },
                { id: "fundamentos.css.flexbox.padroes", title: "Padroes comuns de layout" },
              ],
            },
            {
              id: "fundamentos.css.grid",
              title: "Grid",
              children: [
                { id: "fundamentos.css.grid.colunas", title: "Linhas, colunas e gaps", resources: [{ label: "CSS-Tricks Grid", url: "https://css-tricks.com/snippets/css/complete-guide-grid", kind: "artigo" }] },
                { id: "fundamentos.css.grid.areas", title: "Areas e alinhamento" },
              ],
            },
            { id: "fundamentos.css.responsivo", title: "Responsividade (mobile-first)", resources: [{ label: "web.dev Responsive", url: "https://web.dev/learn/design", kind: "curso" }] },
            { id: "fundamentos.css.animacoes", title: "Transicoes e animacoes" },
            {
              id: "fundamentos.css.arquitetura",
              title: "Arquitetura de CSS",
              optional: true,
              children: [
                { id: "fundamentos.css.arquitetura.sass", title: "Preprocessadores (Sass)", optional: true, resources: [{ label: "Sass", url: "https://sass-lang.com/documentation", kind: "doc" }] },
                { id: "fundamentos.css.arquitetura.bem", title: "Metodologias (BEM)", optional: true },
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
      description: "A linguagem que da vida a pagina.",
      children: [
        {
          id: "javascript.fundamentos",
          title: "Fundamentos",
          children: [
            { id: "javascript.fundamentos.tipos", title: "Tipos e variaveis", resources: [{ label: "JavaScript.info", url: "https://javascript.info", kind: "curso" }] },
            { id: "javascript.fundamentos.controle", title: "Condicionais e lacos" },
            { id: "javascript.fundamentos.funcoes", title: "Funcoes e escopo", resources: [{ label: "MDN Functions", url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Functions", kind: "doc" }] },
            { id: "javascript.fundamentos.arrow", title: "Arrow functions e this" },
            { id: "javascript.fundamentos.modulos", title: "Modulos (import / export)" },
          ],
        },
        {
          id: "javascript.dados",
          title: "Dados",
          children: [
            { id: "javascript.dados.arrays", title: "Arrays (map, filter, reduce)", resources: [{ label: "MDN Array", url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Array", kind: "doc" }] },
            { id: "javascript.dados.objetos", title: "Objetos e desestruturacao" },
            { id: "javascript.dados.json", title: "JSON" },
          ],
        },
        {
          id: "javascript.dom",
          title: "DOM e eventos",
          children: [
            { id: "javascript.dom.manipular", title: "Manipular elementos", resources: [{ label: "MDN DOM", url: "https://developer.mozilla.org/pt-BR/docs/Web/API/Document_Object_Model", kind: "doc" }] },
            { id: "javascript.dom.eventos", title: "Eventos e delegacao" },
            { id: "javascript.dom.storage", title: "localStorage e sessionStorage", resources: [{ label: "MDN Web Storage", url: "https://developer.mozilla.org/pt-BR/docs/Web/API/Web_Storage_API", kind: "doc" }] },
          ],
        },
        {
          id: "javascript.async",
          title: "Assincrono",
          children: [
            { id: "javascript.async.promises", title: "Promises", resources: [{ label: "JavaScript.info Promises", url: "https://javascript.info/promise-basics", kind: "curso" }] },
            { id: "javascript.async.awaitasync", title: "async / await" },
            { id: "javascript.async.fetch", title: "fetch e consumo de APIs" },
            { id: "javascript.async.erros", title: "Tratamento de erros" },
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
            { id: "ferramentas.git.basico", title: "add, commit, push", resources: [{ label: "Documentacao Git", url: "https://git-scm.com/doc", kind: "doc" }] },
            { id: "ferramentas.git.branches", title: "Branches e merge" },
            { id: "ferramentas.git.pr", title: "Pull requests" },
          ],
        },
        { id: "ferramentas.terminal", title: "Terminal basico" },
        { id: "ferramentas.npm", title: "Gerenciadores de pacote (npm, pnpm)" },
        { id: "ferramentas.bundler", title: "Bundler (Vite)", resources: [{ label: "Vite", url: "https://vite.dev/guide", kind: "doc" }] },
        { id: "ferramentas.webpack", title: "Webpack e esbuild", optional: true },
        { id: "ferramentas.lint", title: "ESLint e Prettier", resources: [{ label: "ESLint", url: "https://eslint.org/docs/latest", kind: "doc" }, { label: "Prettier", url: "https://prettier.io/docs/en", kind: "doc" }] },
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
            { id: "react.base.jsx", title: "JSX", resources: [{ label: "React Docs", url: "https://react.dev/learn", kind: "doc" }] },
            { id: "react.base.componentes", title: "Componentes" },
            { id: "react.base.props", title: "Props" },
          ],
        },
        {
          id: "react.estado",
          title: "Estado e renderizacao",
          children: [
            { id: "react.estado.usestate", title: "useState", resources: [{ label: "React useState", url: "https://react.dev/reference/react/useState", kind: "doc" }] },
            { id: "react.estado.condicional", title: "Renderizacao condicional" },
            { id: "react.estado.listas", title: "Listas e keys" },
            { id: "react.estado.useeffect", title: "useEffect", resources: [{ label: "React useEffect", url: "https://react.dev/reference/react/useEffect", kind: "doc" }] },
          ],
        },
        {
          id: "react.hooks",
          title: "Hooks",
          children: [
            { id: "react.hooks.usecontext", title: "useContext" },
            { id: "react.hooks.useref", title: "useRef" },
            { id: "react.hooks.usememo", title: "useMemo e useCallback" },
            { id: "react.hooks.custom", title: "Hooks customizados" },
          ],
        },
        { id: "react.forms", title: "Formularios controlados" },
        { id: "react.routing", title: "Roteamento (React Router)" },
        { id: "react.fetching", title: "Data fetching (TanStack Query)", optional: true, resources: [{ label: "TanStack Query", url: "https://tanstack.com/query/latest", kind: "doc" }] },
        {
          id: "react.estadoglobal",
          title: "Estado global",
          optional: true,
          children: [
            { id: "react.estadoglobal.context", title: "Context API para estado" },
            { id: "react.estadoglobal.libs", title: "Redux ou Zustand", optional: true, resources: [{ label: "Redux", url: "https://redux.js.org/introduction/getting-started", kind: "doc" }] },
          ],
        },
        { id: "react.errorboundary", title: "Error boundaries", optional: true },
      ],
    },
    {
      id: "apis",
      title: "APIs",
      level: "intermediario",
      description: "Conectar o front a um back-end.",
      children: [
        { id: "apis.rest", title: "REST e status HTTP", resources: [{ label: "MDN HTTP Status", url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status", kind: "doc" }] },
        { id: "apis.clientes", title: "fetch e axios" },
        { id: "apis.estados", title: "Estados de loading e erro" },
        { id: "apis.cors", title: "CORS", resources: [{ label: "MDN CORS", url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CORS", kind: "doc" }] },
        {
          id: "apis.auth",
          title: "Autenticacao",
          children: [
            { id: "apis.auth.jwt", title: "JWT" },
            { id: "apis.auth.sessoes", title: "Sessoes e cookies" },
            { id: "apis.auth.oauth", title: "OAuth", optional: true },
          ],
        },
        { id: "apis.graphql", title: "GraphQL", optional: true, resources: [{ label: "GraphQL", url: "https://graphql.org/learn", kind: "doc" }] },
      ],
    },
    {
      id: "qualidade",
      title: "Qualidade e Boas Praticas",
      level: "avancado",
      description: "O que separa um projeto de estudo de um profissional.",
      children: [
        { id: "qualidade.typescript", title: "TypeScript no front", resources: [{ label: "TypeScript", url: "https://www.typescriptlang.org/docs", kind: "doc" }] },
        { id: "qualidade.estilo", title: "Estilizacao em escala (Tailwind, CSS Modules)", resources: [{ label: "Tailwind CSS", url: "https://tailwindcss.com/docs", kind: "doc" }] },
        {
          id: "qualidade.testes",
          title: "Testes",
          children: [
            { id: "qualidade.testes.unit", title: "Unitarios (Vitest, Testing Library)", resources: [{ label: "Testing Library", url: "https://testing-library.com/docs", kind: "doc" }] },
            { id: "qualidade.testes.e2e", title: "End-to-end (Playwright)", optional: true, resources: [{ label: "Playwright", url: "https://playwright.dev/docs/intro", kind: "doc" }] },
          ],
        },
        { id: "qualidade.performance", title: "Performance (Core Web Vitals, Lighthouse)", resources: [{ label: "web.dev Vitals", url: "https://web.dev/explore/learn-core-web-vitals", kind: "curso" }] },
        { id: "qualidade.seguranca", title: "Seguranca (XSS, CSRF, CSP)", resources: [{ label: "OWASP", url: "https://owasp.org/www-project-top-ten", kind: "doc" }] },
        { id: "qualidade.a11y", title: "Acessibilidade avancada (ARIA, teclado, leitor de tela)", optional: true },
      ],
    },
    {
      id: "projeto",
      title: "Projeto e Deploy",
      level: "avancado",
      description: "Juntar tudo e publicar.",
      children: [
        { id: "projeto.planejar", title: "Planejar um projeto real" },
        { id: "projeto.construir", title: "Construir aplicando tudo" },
        { id: "projeto.env", title: "Variaveis de ambiente (.env)" },
        { id: "projeto.readme", title: "Documentar (README)" },
        { id: "projeto.deploy", title: "Deploy", resources: [{ label: "Vercel", url: "https://vercel.com/docs", kind: "doc" }, { label: "Netlify", url: "https://docs.netlify.com", kind: "doc" }] },
        { id: "projeto.ssr", title: "SSR e SSG (conceito, Next.js)", optional: true, resources: [{ label: "Next.js", url: "https://nextjs.org/docs", kind: "doc" }] },
        { id: "projeto.ci", title: "CI basico", optional: true },
      ],
    },
  ],
};
