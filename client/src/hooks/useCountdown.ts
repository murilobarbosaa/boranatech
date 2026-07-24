import { useEffect, useState } from "react";

// Contador regressivo ate `retryAt` (ISO), formato HH:MM:SS. Retorna a string
// enquanto o alvo esta no futuro; null quando nao ha alvo, o ISO e invalido, ou
// ja passou. So instancia o setInterval quando ha alvo no futuro (sem cooldown,
// sem interval), limpa no desmonte, e ao chegar a zero chama onExpire (para o
// caller revalidar) em vez de travar em "00:00:00". E informacao, nao decoracao:
// nao precisa de gate em prefers-reduced-motion.

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function useCountdown(
  retryAt: string | null | undefined,
  onExpire?: () => void,
): string | null {
  const target = retryAt ? new Date(retryAt).getTime() : NaN;
  const hasTarget = Number.isFinite(target);
  const [remaining, setRemaining] = useState(() =>
    hasTarget ? target - Date.now() : -1,
  );

  useEffect(() => {
    if (!hasTarget) return;
    const tick = () => {
      const left = target - Date.now();
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        onExpire?.();
      }
    };
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [target, hasTarget, onExpire]);

  if (!hasTarget || remaining <= 0) return null;
  const total = Math.floor(remaining / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
