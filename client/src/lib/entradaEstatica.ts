import { isPrerender } from "./prerender";

/**
 * MODO ENTRADA-ESTATICA.
 *
 * As 131 rotas publicas chegam como HTML pre-renderizado, e o React monta por
 * cima com `createRoot`. Quando isso acontece a pessoa JA esta vendo o conteudo:
 * rodar de novo a animacao de entrada (opacity 0 -> 1, y 20 -> 0) e o flicker.
 * Neste modo cada entrada renderiza direto no estado final (`initial={false}` no
 * framer), e o proprio prerender captura esse estado, sem `opacity: 0` inline.
 *
 * Liga em dois momentos: no prerender (`navigator.webdriver`) e na carga que
 * monta por cima de HTML pre-renderizado (`#root` com filhos antes do
 * createRoot, lido de forma sincrona em main.tsx).
 *
 * Desliga na primeira troca de rota ou na primeira interacao (ponteiro ou
 * teclado), o que vier antes. Tudo que ja estava no HTML monta no primeiro
 * render, sem interacao nenhuma, e decide o `initial` nesse instante, inclusive
 * os `whileInView` abaixo da dobra. O que monta depois de um clique (passo de
 * quiz, drawer, modal, painel) nunca foi visto e anima como sempre; sem a
 * interacao no gatilho, esses elementos perderiam a animacao ate a pessoa trocar
 * de rota, o que seria remover algo alem da entrada.
 */

type Estado = { ativo: boolean; rotaInicial: string };

let estado: Estado | null = null;

function rotaAtual(): string {
  return typeof window === "undefined" ? "/" : window.location.pathname;
}

function encerrar(): void {
  if (estado) estado.ativo = false;
}

export function iniciarModoEntradaEstatica(root: Element | null): boolean {
  const ativo = isPrerender() || Boolean(root && root.childElementCount > 0);
  estado = { ativo, rotaInicial: rotaAtual() };
  if (ativo && typeof window !== "undefined") {
    const opcoes = { capture: true, once: true } as const;
    window.addEventListener("pointerdown", encerrar, opcoes);
    window.addEventListener("keydown", encerrar, opcoes);
  }
  return ativo;
}

export function entradaEstatica(): boolean {
  // Sem inicializacao explicita (teste de componente, ou algo que renderize antes
  // do main.tsx), vale o sinal do prerender, lido a cada chamada e sem guardar
  // nada: um valor cacheado aqui dependeria da ordem em que foi calculado.
  if (estado === null) return isPrerender();
  if (estado.ativo && rotaAtual() !== estado.rotaInicial) estado.ativo = false;
  return estado.ativo;
}

/**
 * O `initial` de uma animacao de entrada: `false` (estado final) no modo
 * estatico, o valor original fora dele. Serve para objeto, variante e ternario
 * que ja devolva `false`.
 */
export function entrada<T>(inicial: T): T | false {
  return entradaEstatica() || prefereMenosMovimento() ? false : inicial;
}

/**
 * `prefers-reduced-motion: reduce`, lido na hora. A entrada so importa na
 * montagem, entao ler ali ja acompanha a preferencia de cada elemento; sem
 * `matchMedia` (jsdom, navegador antigo) conta como sem preferencia.
 */
function prefereMenosMovimento(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  } catch {
    return false;
  }
}

export function __reiniciarModoEntradaEstaticaParaTeste(): void {
  estado = null;
}
