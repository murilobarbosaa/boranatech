// TODO(Ana): revisao editorial completa desta trilha (estrutura reorganizada
// pelo curriculo real da area na Fase 3b.1; titulos e descricoes novos ou
// reescritos precisam de revisao de copy; o conteudo longo esta sendo
// preenchido por lotes a partir da secao de HTML).
import type { RoadmapV2 } from "../types";

export const frontend: RoadmapV2 = {
  slug: "frontend",
  area: "frontend",
  title: "Front-end do Zero",
  level: "Iniciante",
  description:
    "Do básico da web até publicar uma aplicação React. Conclua uma etapa pra liberar a próxima.",
  sections: [
    {
      id: "web",
      title: "Fundamentos da web",
      level: "iniciante",
      description:
        "O que acontece por trás de toda página: navegador, servidor e as ferramentas pra enxergar isso.",
      children: [
        {
          id: "web.http",
          title: "Cliente, servidor, HTTP e HTTPS",
          description:
            "Como o navegador e o servidor conversam, e o que o HTTPS protege nessa troca.",
          resources: [
            {
              label: "MDN HTTP",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP",
              kind: "doc",
            },
          ],
        },
        {
          id: "web.dns",
          title: "DNS, domínios e hospedagem",
          description:
            "O que acontece entre digitar um endereço e a página aparecer.",
        },
        {
          id: "web.render",
          title: "Como o navegador renderiza uma página",
          description:
            "O caminho do HTML e do CSS até virar o que você vê na tela.",
        },
        {
          id: "web.devtools",
          title: "DevTools do navegador",
          description:
            "As ferramentas embutidas pra inspecionar, depurar e medir sua página.",
          resources: [
            {
              label: "Chrome DevTools",
              url: "https://developer.chrome.com/docs/devtools",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "html",
      title: "HTML",
      level: "iniciante",
      description:
        "A estrutura de toda página: documento, conteúdo, significado e formulários.",
      children: [
        {
          id: "html.estrutura",
          title: "Estrutura do documento",
          description:
            "Os elementos básicos que todo HTML precisa pra existir.",
          resources: [
            {
              label: "MDN HTML",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTML",
              kind: "doc",
            },
          ],
        },
        {
          id: "html.conteudo",
          title: "Texto, links, imagens e listas",
          description:
            "As tags do dia a dia pra colocar conteúdo de verdade na página.",
        },
        {
          id: "html.semantica",
          title: "Tags semânticas",
          description:
            "Usar tags que descrevem o significado do conteúdo, não só a aparência.",
        },
        {
          id: "html.forms",
          title: "Formulários e validação",
          description: "Capturar dados do usuário e checar se vieram certos.",
        },
        {
          id: "html.a11y",
          title: "Acessibilidade básica",
          description:
            "Fazer sua página funcionar pra todo mundo, incluindo leitores de tela.",
          resources: [
            {
              label: "web.dev Acessibilidade",
              url: "https://web.dev/learn/accessibility",
              kind: "curso",
            },
          ],
        },
        {
          id: "html.seo",
          title: "SEO básico (meta tags, títulos)",
          description:
            "O mínimo pra os buscadores entenderem e indexarem sua página.",
          optional: true,
        },
      ],
    },
    {
      id: "css",
      title: "CSS básico",
      level: "iniciante",
      description:
        "Aparência e espaçamento: selecionar elementos, entender a caixa e dar vida ao visual.",
      children: [
        {
          id: "css.seletores",
          title: "Seletores e especificidade",
          description:
            "Como apontar quais elementos estilizar e quem vence quando há conflito.",
          resources: [
            {
              label: "MDN CSS",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/CSS",
              kind: "doc",
            },
            {
              label: "CSS-Tricks",
              url: "https://css-tricks.com",
              kind: "artigo",
            },
          ],
        },
        {
          id: "css.boxmodel",
          title: "Box model e unidades",
          description:
            "Margin, border, padding e content, e as medidas (px, rem, %, vh) pra dimensionar tudo.",
        },
        {
          id: "css.posicionamento",
          title: "Posicionamento e z-index",
          description:
            "Controlar onde os elementos ficam e quem aparece na frente.",
        },
        {
          id: "css.animacoes",
          title: "Transições e animações",
          description: "Dar movimento e feedback visual com CSS.",
        },
      ],
    },
    {
      id: "primeirosite",
      title: "Primeiro site no ar",
      level: "iniciante",
      description:
        "Ainda no básico, publique uma página de verdade: o hábito de entregar começa aqui.",
      children: [
        {
          id: "primeirosite.ambiente",
          title: "Editor e ambiente (VS Code)",
          description:
            "Preparar o editor e as extensões que aceleram o dia a dia.",
          resources: [
            {
              label: "VS Code",
              url: "https://code.visualstudio.com/docs",
              kind: "doc",
            },
          ],
        },
        {
          id: "primeirosite.pagina",
          title: "Montar uma página completa",
          description:
            "Juntar HTML e CSS num projeto pequeno e real, do zero ao arquivo final.",
        },
        {
          id: "primeirosite.publicar",
          title: "Publicar na web (GitHub Pages)",
          description:
            "Colocar sua primeira página no ar com um endereço público.",
          resources: [
            {
              label: "GitHub Pages",
              url: "https://docs.github.com/pt/pages",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "layout",
      title: "Layout e responsividade",
      level: "intermediario",
      description:
        "As ferramentas de layout moderno e a disciplina de funcionar em qualquer tela.",
      children: [
        {
          id: "layout.flexbox",
          title: "Flexbox",
          description:
            "Eixos, container e itens: o modelo que resolve a maioria dos alinhamentos.",
          resources: [
            {
              label: "CSS-Tricks Flexbox",
              url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox",
              kind: "artigo",
            },
          ],
        },
        {
          id: "layout.grid",
          title: "Grid",
          description:
            "Grades de duas dimensões: linhas, colunas, áreas e alinhamento.",
          resources: [
            {
              label: "CSS-Tricks Grid",
              url: "https://css-tricks.com/snippets/css/complete-guide-grid",
              kind: "artigo",
            },
          ],
        },
        {
          id: "layout.responsivo",
          title: "Responsividade (mobile-first)",
          description:
            "Fazer o layout se adaptar de celulares a telas grandes.",
          resources: [
            {
              label: "web.dev Responsive",
              url: "https://web.dev/learn/design",
              kind: "curso",
            },
          ],
        },
        {
          id: "layout.arquitetura",
          title: "Arquitetura de CSS (Sass, BEM)",
          description:
            "Variáveis, reúso e convenção de nomes pra manter o CSS organizado em projetos grandes.",
          optional: true,
          resources: [
            {
              label: "Sass",
              url: "https://sass-lang.com/documentation",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "javascript",
      title: "JavaScript e o DOM",
      level: "intermediario",
      description:
        "A linguagem que dá vida à página, e o DOM, que é onde ela encontra o HTML.",
      children: [
        {
          id: "javascript.tipos",
          title: "Tipos e variáveis",
          description:
            "Os tipos de dados do JavaScript e como guardar valores.",
          resources: [
            {
              label: "JavaScript.info",
              url: "https://javascript.info",
              kind: "curso",
            },
          ],
        },
        {
          id: "javascript.controle",
          title: "Condicionais e laços",
          description: "Tomar decisões e repetir ações no código.",
        },
        {
          id: "javascript.funcoes",
          title: "Funções, escopo e arrow functions",
          description:
            "Empacotar lógica reutilizável, entender onde as variáveis vivem e como o this muda.",
          resources: [
            {
              label: "MDN Functions",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Functions",
              kind: "doc",
            },
          ],
        },
        {
          id: "javascript.arrays",
          title: "Arrays (map, filter, reduce)",
          description: "Transformar e filtrar listas sem laços manuais.",
          resources: [
            {
              label: "MDN Array",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Array",
              kind: "doc",
            },
          ],
        },
        {
          id: "javascript.objetos",
          title: "Objetos, desestruturação e JSON",
          description:
            "Estruturar dados em pares chave-valor, extrair o que precisa e trocar dados com o back.",
        },
        {
          id: "javascript.modulos",
          title: "Módulos (import / export)",
          description: "Quebrar o código em arquivos que se importam.",
        },
        {
          id: "javascript.dom",
          title: "DOM e eventos",
          children: [
            {
              id: "javascript.dom.manipular",
              title: "Manipular elementos",
              description: "Ler e mudar a página pelo JavaScript.",
              resources: [
                {
                  label: "MDN DOM",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/API/Document_Object_Model",
                  kind: "doc",
                },
              ],
            },
            {
              id: "javascript.dom.eventos",
              title: "Eventos e delegação",
              description:
                "Reagir a cliques, teclas e outras ações do usuário.",
            },
            {
              id: "javascript.dom.storage",
              title: "localStorage e sessionStorage",
              description: "Guardar dados no navegador entre visitas.",
              resources: [
                {
                  label: "MDN Web Storage",
                  url: "https://developer.mozilla.org/pt-BR/docs/Web/API/Web_Storage_API",
                  kind: "doc",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "ferramentas",
      title: "Git e ferramentas",
      level: "intermediario",
      description:
        "Controle de versão e o ferramental que todo time de front usa no dia a dia.",
      children: [
        {
          id: "ferramentas.git",
          title: "Git e GitHub",
          children: [
            {
              id: "ferramentas.git.basico",
              title: "add, commit, push",
              description: "O ciclo básico de salvar e enviar seu código.",
              resources: [
                {
                  label: "Documentação Git",
                  url: "https://git-scm.com/doc",
                  kind: "doc",
                },
              ],
            },
            {
              id: "ferramentas.git.branches",
              title: "Branches e merge",
              description: "Trabalhar em paralelo e juntar as mudanças.",
            },
            {
              id: "ferramentas.git.pr",
              title: "Pull requests",
              description: "Propor e revisar mudanças antes de integrar.",
            },
          ],
        },
        {
          id: "ferramentas.terminal",
          title: "Terminal básico",
          description:
            "Os comandos essenciais pra se virar na linha de comando.",
        },
        {
          id: "ferramentas.npm",
          title: "Gerenciadores de pacote (npm, pnpm)",
          description: "Instalar e gerenciar as bibliotecas do projeto.",
        },
        {
          id: "ferramentas.bundler",
          title: "Bundler (Vite)",
          description:
            "A ferramenta que junta e serve seu código em dev e produção.",
          resources: [
            { label: "Vite", url: "https://vite.dev/guide", kind: "doc" },
          ],
        },
        {
          id: "ferramentas.lint",
          title: "ESLint e Prettier",
          description:
            "Padronizar e achar problemas no código automaticamente.",
          resources: [
            {
              label: "ESLint",
              url: "https://eslint.org/docs/latest",
              kind: "doc",
            },
            {
              label: "Prettier",
              url: "https://prettier.io/docs/en",
              kind: "doc",
            },
          ],
        },
      ],
    },
    {
      id: "apis",
      title: "APIs e assincronia",
      level: "intermediario",
      description:
        "Buscar dados de um servidor: promessas, fetch e o que toda API espera de você.",
      children: [
        {
          id: "apis.promises",
          title: "Promises",
          description: "Lidar com operações que terminam no futuro.",
          resources: [
            {
              label: "JavaScript.info Promises",
              url: "https://javascript.info/promise-basics",
              kind: "curso",
            },
          ],
        },
        {
          id: "apis.async",
          title: "async / await e tratamento de erros",
          description:
            "Escrever código assíncrono legível e capturar o que pode dar errado.",
        },
        {
          id: "apis.fetch",
          title: "fetch e consumo de APIs",
          description:
            "Buscar dados de um servidor pela rede, com fetch ou bibliotecas como axios.",
        },
        {
          id: "apis.rest",
          title: "REST e status HTTP",
          description:
            "O padrão mais comum de API e o que cada código de status diz.",
          resources: [
            {
              label: "MDN HTTP Status",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status",
              kind: "doc",
            },
          ],
        },
        {
          id: "apis.estados",
          title: "Estados de loading e erro",
          description: "Mostrar carregamento e falhas pro usuário.",
        },
        {
          id: "apis.cors",
          title: "CORS",
          description:
            "Por que o navegador bloqueia certas requisições e como resolver.",
          resources: [
            {
              label: "MDN CORS",
              url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CORS",
              kind: "doc",
            },
          ],
        },
        {
          id: "apis.auth",
          title: "Autenticação no front (tokens, sessões)",
          description:
            "JWT, cookies de sessão e login via terceiros: o que o front precisa entender.",
        },
        {
          id: "apis.graphql",
          title: "GraphQL",
          description:
            "Uma alternativa ao REST onde o cliente pede exatamente os dados que quer.",
          optional: true,
          resources: [
            { label: "GraphQL", url: "https://graphql.org/learn", kind: "doc" },
          ],
        },
      ],
    },
    {
      id: "react",
      title: "React",
      level: "avancado",
      description: "A biblioteca pra construir interfaces de verdade.",
      children: [
        {
          id: "react.base",
          title: "Base",
          children: [
            {
              id: "react.base.jsx",
              title: "JSX",
              description:
                "A sintaxe que mistura marcação e JavaScript no React.",
              resources: [
                {
                  label: "React Docs",
                  url: "https://react.dev/learn",
                  kind: "doc",
                },
              ],
            },
            {
              id: "react.base.componentes",
              title: "Componentes",
              description: "Os blocos reutilizáveis que montam a interface.",
            },
            {
              id: "react.base.props",
              title: "Props",
              description: "Passar dados de um componente pai pro filho.",
            },
          ],
        },
        {
          id: "react.estado",
          title: "Estado e renderização",
          children: [
            {
              id: "react.estado.usestate",
              title: "useState",
              description:
                "Guardar e atualizar estado dentro de um componente.",
              resources: [
                {
                  label: "React useState",
                  url: "https://react.dev/reference/react/useState",
                  kind: "doc",
                },
              ],
            },
            {
              id: "react.estado.renderizacao",
              title: "Renderização condicional e listas",
              description:
                "Mostrar coisas diferentes conforme o estado e renderizar coleções com keys.",
            },
            {
              id: "react.estado.useeffect",
              title: "useEffect",
              description:
                "Rodar efeitos colaterais, como buscar dados, no ciclo do componente.",
              resources: [
                {
                  label: "React useEffect",
                  url: "https://react.dev/reference/react/useEffect",
                  kind: "doc",
                },
              ],
            },
          ],
        },
        {
          id: "react.hooks",
          title: "Hooks",
          children: [
            {
              id: "react.hooks.usecontext",
              title: "useContext",
              description:
                "Compartilhar dados sem passar props por vários níveis.",
            },
            {
              id: "react.hooks.useref",
              title: "useRef",
              description:
                "Guardar valores ou referenciar elementos sem re-renderizar.",
            },
            {
              id: "react.hooks.usememo",
              title: "useMemo e useCallback",
              description: "Evitar recálculos e re-renders desnecessários.",
            },
            {
              id: "react.hooks.custom",
              title: "Hooks customizados",
              description:
                "Extrair lógica reutilizável pros seus próprios hooks.",
            },
          ],
        },
        {
          id: "react.forms",
          title: "Formulários controlados",
          description: "Ligar os inputs ao estado do React.",
        },
        {
          id: "react.routing",
          title: "Roteamento (React Router)",
          description: "Navegar entre páginas numa SPA.",
        },
        {
          id: "react.fetching",
          title: "Data fetching (TanStack Query)",
          description:
            "Buscar, cachear e sincronizar dados do servidor com menos código.",
          optional: true,
          resources: [
            {
              label: "TanStack Query",
              url: "https://tanstack.com/query/latest",
              kind: "doc",
            },
          ],
        },
        {
          id: "react.estadoglobal",
          title: "Estado global (Context, Redux ou Zustand)",
          description:
            "Compartilhar estado entre partes distantes do app, com ou sem biblioteca.",
          optional: true,
          resources: [
            {
              label: "Redux",
              url: "https://redux.js.org/introduction/getting-started",
              kind: "doc",
            },
          ],
        },
        {
          id: "react.errorboundary",
          title: "Error boundaries",
          description:
            "Capturar erros de renderização sem quebrar o app inteiro.",
          optional: true,
        },
      ],
    },
    {
      id: "qualidade",
      title: "Qualidade profissional",
      level: "avancado",
      description: "O que separa um projeto de estudo de um profissional.",
      children: [
        {
          id: "qualidade.typescript",
          title: "TypeScript no front",
          description:
            "Adicionar tipos ao JavaScript pra pegar erros antes de rodar.",
          resources: [
            {
              label: "TypeScript",
              url: "https://www.typescriptlang.org/docs",
              kind: "doc",
            },
          ],
        },
        {
          id: "qualidade.estilo",
          title: "Estilização em escala (Tailwind, CSS Modules)",
          description: "Manter o CSS organizado conforme o projeto cresce.",
          resources: [
            {
              label: "Tailwind CSS",
              url: "https://tailwindcss.com/docs",
              kind: "doc",
            },
          ],
        },
        {
          id: "qualidade.testes",
          title: "Testes",
          children: [
            {
              id: "qualidade.testes.unit",
              title: "Unitários (Vitest, Testing Library)",
              description: "Testar pedaços do código de forma automática.",
              resources: [
                {
                  label: "Testing Library",
                  url: "https://testing-library.com/docs",
                  kind: "doc",
                },
              ],
            },
            {
              id: "qualidade.testes.e2e",
              title: "End-to-end (Playwright)",
              description: "Testar o app inteiro como um usuário usaria.",
              optional: true,
              resources: [
                {
                  label: "Playwright",
                  url: "https://playwright.dev/docs/intro",
                  kind: "doc",
                },
              ],
            },
          ],
        },
        {
          id: "qualidade.performance",
          title: "Performance (Core Web Vitals, Lighthouse)",
          description: "Medir e melhorar a velocidade percebida da página.",
          resources: [
            {
              label: "web.dev Vitals",
              url: "https://web.dev/explore/learn-core-web-vitals",
              kind: "curso",
            },
          ],
        },
        {
          id: "qualidade.seguranca",
          title: "Segurança (XSS, CSRF, CSP)",
          description: "As ameaças comuns do front e como se proteger.",
          resources: [
            {
              label: "OWASP",
              url: "https://owasp.org/www-project-top-ten",
              kind: "doc",
            },
          ],
        },
        {
          id: "qualidade.a11y",
          title: "Acessibilidade avançada (ARIA, teclado, leitor de tela)",
          description:
            "Ir além do básico pra uma experiência inclusiva de verdade.",
          optional: true,
        },
      ],
    },
    {
      id: "projeto",
      title: "Projeto e deploy",
      level: "avancado",
      description: "Juntar tudo e publicar.",
      children: [
        {
          id: "projeto.planejar",
          title: "Planejar um projeto real",
          description: "Definir escopo e estrutura antes de codar.",
        },
        {
          id: "projeto.construir",
          title: "Construir aplicando tudo",
          description:
            "Juntar o que você aprendeu num projeto de ponta a ponta.",
        },
        {
          id: "projeto.env",
          title: "Variáveis de ambiente (.env)",
          description: "Guardar configs e segredos fora do código.",
        },
        {
          id: "projeto.readme",
          title: "Documentar (README)",
          description:
            "Explicar seu projeto pra quem chega depois, inclusive você.",
        },
        {
          id: "projeto.deploy",
          title: "Deploy",
          description: "Colocar seu projeto no ar pra qualquer um acessar.",
          resources: [
            { label: "Vercel", url: "https://vercel.com/docs", kind: "doc" },
            { label: "Netlify", url: "https://docs.netlify.com", kind: "doc" },
          ],
        },
        {
          id: "projeto.ssr",
          title: "SSR e SSG (conceito, Next.js)",
          description: "Renderizar no servidor pra ganhar performance e SEO.",
          optional: true,
          resources: [
            { label: "Next.js", url: "https://nextjs.org/docs", kind: "doc" },
          ],
        },
        {
          id: "projeto.ci",
          title: "CI básico",
          description: "Automatizar testes e build a cada mudança.",
          optional: true,
        },
      ],
    },
  ],
};
