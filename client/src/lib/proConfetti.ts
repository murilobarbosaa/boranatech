import confetti from "canvas-confetti";

const COLORS = ["#FFB800", "#1a1a1a", "#ffffff", "#10b981"];

// z-index padrao do proprio canvas-confetti. Quem precisa ficar acima de um
// dialog passa o seu.
const Z_INDEX_PADRAO = 100;

let instancia: confetti.CreateTypes | null = null;

// SEM WORKER, DE PROPOSITO. O `confetti` padrao da biblioteca desenha num Web
// Worker criado a partir de um `blob:`, e a CSP servida pela Vercel nao declara
// `worker-src`: o navegador cai no `script-src`, que nao tem `blob:`, e bloqueia
// o worker. O bloqueio nao lanca excecao sincrona, entao o try/catch da
// biblioteca nao ve nada, o canvas e transferido para um worker que nunca
// nasceu e nenhuma particula aparece, sem erro. Medido em 2026-09-11 no Chrome
// 153 com o header de producao: 0 pixels desenhados com worker, 10509 sem.
// Criada na primeira chamada, e nao na importacao, para nao tocar `document`
// fora do navegador.
function disparador(): confetti.CreateTypes {
  instancia ??= confetti.create(undefined, { resize: true, useWorker: false });
  return instancia;
}

// Celebration used when a customer subscribes to Pro (checkout success screen).
// A strong initial burst at `origin`, then a ~2s "festao" cycle that alternates
// scattered bursts and bottom-corner cannons every 240ms. `origin` is normalized
// (0..1), matching canvas-confetti. Returns a stop() that clears the interval so
// callers can clean up on unmount. Reduced-motion stays the caller's
// responsibility; `disableForReducedMotion` on every burst is the library's own
// second line of defense, not a replacement for the caller's guard.
export function fireProCelebration(
  origin: {
    x: number;
    y: number;
  },
  opcoes: { zIndex?: number } = {},
): () => void {
  const disparar = disparador();
  const comuns = {
    colors: COLORS,
    scalar: 0.9,
    zIndex: opcoes.zIndex ?? Z_INDEX_PADRAO,
    disableForReducedMotion: true,
  };

  // Burst inicial mais forte, no ponto de origem.
  disparar({
    ...comuns,
    particleCount: 90,
    spread: 100,
    origin,
    ticks: 140,
    gravity: 0.85,
  });

  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  // Burst aleatorio espalhado: origem x/y e angulo randomicos cobrindo a tela.
  const fireScatter = () => {
    disparar({
      ...comuns,
      particleCount: 45,
      spread: randomInRange(70, 90),
      angle: randomInRange(60, 120),
      origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0.1, 0.6) },
      ticks: 120,
      gravity: 0.9,
    });
  };

  // Canhao de um canto inferior disparando pra dentro/cima.
  const fireCannon = (side: "left" | "right") => {
    disparar({
      ...comuns,
      particleCount: 55,
      spread: 55,
      angle: side === "left" ? 60 : 120,
      startVelocity: 45,
      origin: { x: side === "left" ? 0 : 1, y: 1 },
      ticks: 140,
      gravity: 0.9,
    });
  };

  // Ciclo: aleatorio, canhao-esquerdo, aleatorio, canhao-direito, ...
  const sequence = [
    () => fireScatter(),
    () => fireCannon("left"),
    () => fireScatter(),
    () => fireCannon("right"),
  ];
  const end = Date.now() + 2000;
  let tick = 0;

  const interval = window.setInterval(() => {
    if (Date.now() >= end) {
      window.clearInterval(interval);
      return;
    }
    sequence[tick % sequence.length]();
    tick += 1;
  }, 240);

  return () => window.clearInterval(interval);
}
