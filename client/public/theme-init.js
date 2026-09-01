/*
  Anti-flash do tema. Roda ANTES do CSS e do bundle, de forma sincrona, para a
  primeira pintura ja sair no tema certo. Sem isto a pagina pinta clara e
  escurece depois que o React monta, o que e visivel.

  Arquivo externo, e nao script inline no index.html, por causa do CSP: o
  script-src das duas copias da policy (vercel.json e server/app.ts) e
  "'self' https://us-assets.i.posthog.com 'sha256-...'", sem 'unsafe-inline'.
  Um inline aqui seria bloqueado no navegador, e o guard scripts/checkCspHashes.mts
  NAO acusaria, porque ele so varre client/public/lancamento.html. Ou seja: a
  falha apareceria so em producao. 'self' cobre este arquivo sem tocar na policy.

  A logica esta duplicada com client/src/contexts/ThemeContext.tsx de proposito:
  este arquivo precisa rodar antes de qualquer modulo, entao nao pode importar
  nada. Quem manda no runtime e o ThemeContext; este aqui so evita o flash.
*/
(function () {
  try {
    var stored = window.localStorage.getItem("bnt-theme");
    var prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = stored === "dark" || (stored !== "light" && prefersDark);
    var root = document.documentElement;
    if (dark) root.classList.add("dark");
    root.style.colorScheme = dark ? "dark" : "light";
  } catch (e) {
    /* localStorage indisponivel: fica no claro */
  }
})();
