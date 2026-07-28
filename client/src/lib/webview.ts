// Deteccao de navegador embutido em app (in-app browser / webview).
//
// Existe por causa do PKCE: o `code_verifier` que o supabase-js gera no clique
// fica no localStorage da ORIGEM onde o fluxo comecou. Webview de app tem
// armazenamento proprio, entao um fluxo iniciado dentro do Instagram e concluido
// no navegador do sistema (ou vice-versa) chega no callback com o `code` e SEM o
// verifier, e a troca falha. Aqui a deteccao serve so para o log (Passo 1); o
// caminho de "abrir no navegador" vem depois.
//
// Funcao PURA sobre a string de UA, sem ler `navigator`, porque teste que depende
// de UA global e teste que passa por acidente de ambiente.
//
// Deliberadamente NAO tenta ser exaustiva: UA de webview nao tem padrao e a lista
// completa nao existe. Por isso o retorno separa "qual app" de "e webview": um app
// desconhecido cai em `other` com `isInApp: true` pela heuristica generica, em vez
// de virar `false` por nao estar na lista. Preferimos superestimar.

// Baixa cardinalidade de proposito: este valor vai como propriedade de evento no
// PostHog, e UA cru como dimensao explodiria o numero de valores distintos.
export type InAppBrowser =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "tiktok"
  | "twitter"
  | "snapchat"
  | "pinterest"
  | "line"
  | "other"
  | null;

// Ordem importa: o Instagram manda FBAN/FBAV junto do proprio marcador (a
// Meta compartilha a base do webview), entao "Instagram" tem que ser testado
// ANTES de facebook, senao todo trafego do Instagram e contado como Facebook.
const APP_MARKERS: Array<{ app: Exclude<InAppBrowser, "other" | null>; markers: string[] }> = [
  { app: "instagram", markers: ["instagram"] },
  { app: "facebook", markers: ["fban", "fbav", "fb_iab", "fbios"] },
  { app: "linkedin", markers: ["linkedinapp", "linkedin/"] },
  { app: "tiktok", markers: ["bytedance", "musical_ly", "tiktok"] },
  { app: "twitter", markers: ["twitter"] },
  { app: "snapchat", markers: ["snapchat"] },
  { app: "pinterest", markers: ["pinterest"] },
  { app: "line", markers: ["line/"] },
];

// Heuristica generica, para webview de app que nao esta na lista acima.
// - Android marca webview com "; wv)" no UA desde o KitKat.
// - iOS nao marca nada: um WKWebView se parece com o Safari MENOS o token
//   "Safari/", que so o navegador de verdade envia. Mobile + AppleWebKit sem
//   "Safari/" e o sinal disponivel.
function looksLikeGenericWebview(ua: string): boolean {
  if (ua.includes("; wv)") || ua.includes("(wv)")) return true;
  const isAppleMobile = /\b(iphone|ipad|ipod)\b/.test(ua);
  if (isAppleMobile && ua.includes("applewebkit") && !ua.includes("safari/")) {
    return true;
  }
  return false;
}

export interface InAppBrowserInfo {
  isInApp: boolean;
  app: InAppBrowser;
}

export function detectInAppBrowser(userAgent: string | null | undefined): InAppBrowserInfo {
  if (!userAgent) return { isInApp: false, app: null };
  const ua = userAgent.toLowerCase();

  for (const { app, markers } of APP_MARKERS) {
    if (markers.some((marker) => ua.includes(marker))) {
      return { isInApp: true, app };
    }
  }

  if (looksLikeGenericWebview(ua)) return { isInApp: true, app: "other" };

  return { isInApp: false, app: null };
}

// Conveniencia para o codigo de runtime. Mantida separada da funcao pura para
// que o teste nunca precise mexer em `navigator`.
export function currentInAppBrowser(): InAppBrowserInfo {
  if (typeof navigator === "undefined") return { isInApp: false, app: null };
  return detectInAppBrowser(navigator.userAgent);
}
