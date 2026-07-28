import { describe, expect, it } from "vitest";

import { detectInAppBrowser } from "./webview";

// UAs reais, encurtados só no que não participa da decisão.
const UA = {
  instagram:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 329.0.0.13.97 (iPhone14,3; iOS 17_5)",
  facebookIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/468.0.0.36.107]",
  linkedin:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 LinkedInApp/9.29.3",
  androidWebview:
    "Mozilla/5.0 (Linux; Android 13; SM-A536E; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.6261.90 Mobile Safari/537.36",
  safariIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 13; SM-A536E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.90 Mobile Safari/537.36",
  chromeDesktop:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  iosWkwebviewSemApp:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
};

describe("detectInAppBrowser", () => {
  it("identifica os apps que motivaram a deteccao", () => {
    expect(detectInAppBrowser(UA.instagram)).toEqual({
      isInApp: true,
      app: "instagram",
    });
    expect(detectInAppBrowser(UA.facebookIos)).toEqual({
      isInApp: true,
      app: "facebook",
    });
    expect(detectInAppBrowser(UA.linkedin)).toEqual({
      isInApp: true,
      app: "linkedin",
    });
  });

  // CONTROLE NEGATIVO da ordem da lista. O webview do Instagram manda FBAN/FBAV
  // junto do proprio marcador porque a Meta compartilha a base; se alguem reordenar
  // APP_MARKERS e puser facebook antes, este teste fica vermelho. Sem ele, todo o
  // trafego do Instagram seria contado como Facebook e a contagem pareceria certa.
  it("classifica como instagram um UA que tambem carrega marcador do facebook", () => {
    const ua = `${UA.instagram} [FBAN/FBIOS;FBAV/1.0]`;
    expect(detectInAppBrowser(ua).app).toBe("instagram");
  });

  it("pega webview generico do Android pelo token wv", () => {
    expect(detectInAppBrowser(UA.androidWebview)).toEqual({
      isInApp: true,
      app: "other",
    });
  });

  it("pega WKWebView do iOS pela ausencia do token Safari/", () => {
    expect(detectInAppBrowser(UA.iosWkwebviewSemApp)).toEqual({
      isInApp: true,
      app: "other",
    });
  });

  // CONTROLE NEGATIVO da heuristica generica: navegador de verdade NAO pode ser
  // marcado como webview. Sem esta assercao, uma heuristica que devolvesse
  // `true` para tudo passaria em todos os testes acima.
  it("nao marca navegador de verdade como webview", () => {
    for (const ua of [UA.safariIos, UA.chromeAndroid, UA.chromeDesktop]) {
      expect(detectInAppBrowser(ua)).toEqual({ isInApp: false, app: null });
    }
  });

  it("trata UA ausente sem quebrar", () => {
    expect(detectInAppBrowser(null)).toEqual({ isInApp: false, app: null });
    expect(detectInAppBrowser(undefined)).toEqual({
      isInApp: false,
      app: null,
    });
    expect(detectInAppBrowser("")).toEqual({ isInApp: false, app: null });
  });
});
