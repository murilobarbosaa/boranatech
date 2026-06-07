import confetti from "canvas-confetti";

const COLORS = ["#FFB800", "#1a1a1a", "#ffffff", "#10b981"];

// Celebration used when a customer subscribes to Pro (checkout success screen).
// A strong initial burst at `origin`, then a ~2s "festao" cycle that alternates
// scattered bursts and bottom-corner cannons every 240ms. `origin` is normalized
// (0..1), matching canvas-confetti. Returns a stop() that clears the interval so
// callers can clean up on unmount. Reduced-motion is the caller's responsibility,
// as it was inline in the Pro flow.
export function fireProCelebration(origin: { x: number; y: number }): () => void {
  // Burst inicial mais forte, no ponto de origem.
  confetti({
    particleCount: 90,
    spread: 100,
    origin,
    colors: COLORS,
    scalar: 0.9,
    ticks: 140,
    gravity: 0.85,
  });

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  // Burst aleatorio espalhado: origem x/y e angulo randomicos cobrindo a tela.
  const fireScatter = () => {
    confetti({
      particleCount: 45,
      spread: randomInRange(70, 90),
      angle: randomInRange(60, 120),
      origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0.1, 0.6) },
      colors: COLORS,
      scalar: 0.9,
      ticks: 120,
      gravity: 0.9,
    });
  };

  // Canhao de um canto inferior disparando pra dentro/cima.
  const fireCannon = (side: "left" | "right") => {
    confetti({
      particleCount: 55,
      spread: 55,
      angle: side === "left" ? 60 : 120,
      startVelocity: 45,
      origin: { x: side === "left" ? 0 : 1, y: 1 },
      colors: COLORS,
      scalar: 0.9,
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
