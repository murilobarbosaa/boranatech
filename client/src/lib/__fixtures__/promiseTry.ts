/**
 * SUPORTE A PDF FIXADO NO TESTE, em vez de herdado do runtime do runner.
 *
 * `navegadorSuportaPdf` (client/src/lib/pdfExtract.ts) responde
 * `typeof Promise.try === "function"`, e a pergunta que ela faz e sobre o
 * NAVEGADOR DO USUARIO. Num teste quem responde e o Node do runner, e isso ja
 * custou caro: em 03/09/2026, com o `.nvmrc` em 22 (Node 22 nao tem
 * `Promise.try`), 33 testes de extracao cairam em `browser_unsupported` e a
 * `main` ficou vermelha ate `9123e30f` subir a baseline para 24. O sintoma
 * parecia bug de PDF, e a causa era a versao do Node.
 *
 * Hoje passa porque o runner tem `Promise.try`. Isso e sorte, nao garantia: se
 * o `.nvmrc` cair de novo, os mesmos testes voltam a mentir sobre o mesmo
 * assunto. Quem exercita a EXTRACAO fixa o suporte com estas funcoes; quem
 * testa a propria deteccao (pdfExtract.navegador.test.ts) continua manipulando
 * `Promise.try` diretamente, que la e o objeto do teste.
 *
 * POR QUE NAO `vi.spyOn(pdfExtract, "navegadorSuportaPdf")`: `extractPdfText`
 * a chama INTERNAMENTE, no mesmo modulo (pdfExtract.ts:178). Em ESM essa
 * chamada liga direto na funcao, nao passa pelo objeto de namespace, entao o
 * spy no export nao intercepta nada e o teste passaria a verde por engano.
 */

/** Acesso tipado ao metodo que pode nao existir, sem `any`. */
type PromiseComTry = { try?: unknown };

const promiseCtor = Promise as unknown as PromiseComTry;

let original: unknown;
let salvo = false;

/** Guarda o estado real, para `restaurarSuportePdf` devolver o ambiente. */
function salvar(): void {
  if (salvo) return;
  original = promiseCtor.try;
  salvo = true;
}

/**
 * Declara que o navegador SUPORTA PDF.
 *
 * Instala o metodo em vez de supor que existe: e a mesma postura do
 * `pdfExtract.navegador.test.ts`, e e o que torna o teste independente do V8
 * de quem roda.
 */
export function fixarSuportePdf(): void {
  salvar();
  promiseCtor.try = () => Promise.resolve();
}

/** Declara que o navegador NAO suporta, para o caminho `browser_unsupported`. */
export function fixarSemSuportePdf(): void {
  salvar();
  delete promiseCtor.try;
}

/**
 * Devolve o ambiente ao que era.
 *
 * `delete` quando nao existia, atribuicao quando existia: restaurar com
 * `promiseCtor.try = undefined` deixaria a propriedade PRESENTE com valor
 * indefinido, e `typeof undefined` nao e `"function"`, entao o proximo arquivo
 * de teste veria "nao suporta" sobre um ambiente que suporta.
 */
export function restaurarSuportePdf(): void {
  if (!salvo) return;
  if (original === undefined) delete promiseCtor.try;
  else promiseCtor.try = original;
  salvo = false;
}
