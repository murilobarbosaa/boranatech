// Guard anti-contaminacao do prerender: o canonical de cada snapshot tem que
// ser o da PROPRIA rota capturada.
//
// POR QUE EXISTE. Em 2026-09-03 descobriu-se que as 71 rotas /areas/* estavam
// em producao servindo o SEO da pagina de cadastro, canonical incluso: o
// RequireAuth redirecionava durante a captura (o prerender roda sem sessao) e o
// puppeteer fotografava a pagina ja redirecionada. Nada acusou, porque um
// snapshot de outra pagina e um HTML perfeitamente valido. O gate-1 abriu a
// leitura daquelas rotas e resolveu o caso; este guard fecha a CLASSE, para
// qualquer rota que um dia passe a redirecionar durante o build.
//
// Funcao pura de proposito: da para testar com fixtures literais, sem subir
// browser nem escrever em disco.

/**
 * Rotas do sitemap que REDIRECIONAM por decisao de produto, com o destino que
 * o canonical delas deve ter.
 *
 * Sem esta lista o guard reprovaria os tres redirects deliberados declarados em
 * client/src/App.tsx, e guard que acusa o comportamento correto e guard que
 * alguem desliga. Note que ela AFIRMA O DESTINO em vez de so isentar a rota: se
 * /curriculo passar a apontar para outro lugar, isso ainda quebra.
 *
 * Rota que redireciona nao deveria estar no sitemap, e as tres estao. Corrigir
 * isso e mexer no generateSitemap, fora do escopo deste lote; enquanto seguirem
 * la, a lista as descreve com o destino real.
 *
 * Redirect NOVO no sitemap sem entrada aqui quebra o build, e e o desfecho
 * desejado: obriga a decidir entre tirar a rota do sitemap ou declara-la.
 */
export const REDIRECTS_ESPERADOS = {
  "/portfolio": "/portfolio/analisar",
  "/curriculo": "/curriculo/analisar",
  "/freelance": "/vagas",
};

/** Extrai o href do <link rel="canonical">, ou null se nao houver. */
export function canonicalDoHtml(html) {
  const match = /<link[^>]*rel=["']canonical["'][^>]*>/i.exec(html ?? "");
  if (!match) return null;
  const href = /href=["']([^"']*)["']/i.exec(match[0]);
  return href ? href[1] : null;
}

/** Pathname de uma URL absoluta ou de um caminho, sem barra final. */
function caminhoDe(valor) {
  try {
    const p = valor.startsWith("http")
      ? new URL(valor).pathname
      : valor.split(/[?#]/)[0];
    return p.replace(/\/+$/, "") || "/";
  } catch {
    return null;
  }
}

/**
 * Confere o snapshot de uma rota.
 *
 * Devolve `null` quando esta correto, ou a string do problema quando nao.
 * String e nao boolean porque o motivo entra no relatorio de erro: "sem
 * canonical" e "canonical de outra rota" pedem acoes diferentes.
 *
 * AUSENCIA E ERRO, nao "nada a verificar": toda pagina prerenderizada emite o
 * proprio canonical pelo componente SEO, entao a falta dele significa que o
 * componente nao montou, que e o mesmo sintoma do redirect.
 */
export function conferirCanonical(rota, html) {
  const encontrado = canonicalDoHtml(html);
  if (encontrado === null) return "sem canonical no snapshot";
  const rotaLimpa = caminhoDe(rota);
  const obtido = caminhoDe(encontrado);
  if (obtido === null) return `canonical ilegivel: ${encontrado}`;
  // Redirect declarado: o canonical certo e o do DESTINO, nao o da rota velha.
  const destino = REDIRECTS_ESPERADOS[rotaLimpa];
  const esperado = destino ? caminhoDe(destino) : rotaLimpa;
  if (obtido !== esperado) {
    return destino
      ? `redirect declarado para ${destino}, mas o canonical e ${encontrado}`
      : `canonical de outra rota: ${encontrado}`;
  }
  return null;
}
