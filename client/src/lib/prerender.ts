/**
 * O app esta rodando dentro do prerender?
 *
 * `scripts/prerender.mjs` captura as rotas publicas num Chrome headless
 * controlado pelo puppeteer, e automacao expoe `navigator.webdriver === true`. E
 * o mesmo sinal que o LaunchGate ja usava para tirar o widget do HTML capturado;
 * mora aqui para o modo entrada-estatica usar a mesma deteccao, e nao uma segunda.
 */
export function isPrerender(): boolean {
  return typeof navigator !== "undefined" && navigator.webdriver === true;
}
