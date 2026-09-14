/*
  "Entrar" do HTML estatico para quem esta logado. O prerender roda sem sessao,
  entao o HTML de cada rota traz os links de visitante ("Entrar", "Cadastre-se
  agora"), marcados pelo Header com data-auth-estatico. Ate o React montar, quem
  esta logado veria esses links. Este script roda antes do CSS e do bundle, ve se
  existe sessao do Supabase no navegador e marca o <html>; o index.css esconde so
  os links marcados. Depois que o React monta, quem decide e o Header vivo, e o
  App tira a classe.

  Arquivo externo, e nao inline, pelo mesmo motivo do theme-init.js: o script-src
  do CSP nao tem 'unsafe-inline', e 'self' cobre este arquivo sem tocar na policy.

  Presenca, nao validade, igual a client/src/lib/persistedSession.ts: nada aqui
  le o conteudo da chave, que carrega o token. A forma da chave
  (sb-<primeiro rotulo do host>-auth-token) esta duplicada com
  chaveDaSessaoSupabase de proposito, porque este arquivo nao pode importar nada;
  client/src/lib/sessaoInit.test.ts roda este script contra a chave que a funcao
  gera e trava os dois juntos. O host nao esta disponivel aqui, entao a busca e
  pela forma, e o $ deixa de fora o code-verifier do PKCE. A classe e
  CLASSE_SESSAO_PERSISTIDA, no mesmo arquivo.
*/
(function () {
  try {
    var armazenamento = window.localStorage;
    for (var i = 0; i < armazenamento.length; i++) {
      var chave = armazenamento.key(i);
      if (chave && /^sb-.+-auth-token$/.test(chave)) {
        document.documentElement.classList.add("bnt-sessao-persistida");
        return;
      }
    }
  } catch (e) {
    /* localStorage indisponivel: fica o HTML como veio */
  }
})();
