import { type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type EstrelaSpec = {
  top: string;
  left: string;
  size: number;
  delay: number;
  duration: number;
};

// Conjunto curado padrao: identico ao starfield original do Checkout, para a
// extracao nao mudar a aparencia daquela pagina. Outras telas podem passar o
// proprio array (controla a densidade) e a cor do brilho.
const ESTRELAS_PADRAO: EstrelaSpec[] = [
  { top: "12%", left: "8%", size: 8, delay: 0, duration: 3 },
  { top: "18%", left: "92%", size: 6, delay: 0.5, duration: 2.6 },
  { top: "30%", left: "20%", size: 5, delay: 1.2, duration: 3.4 },
  { top: "26%", left: "78%", size: 7, delay: 1.8, duration: 2.8 },
  { top: "55%", left: "12%", size: 5, delay: 0.8, duration: 3.2 },
  { top: "62%", left: "88%", size: 8, delay: 2.4, duration: 2.4 },
  { top: "72%", left: "30%", size: 6, delay: 1.5, duration: 3 },
  { top: "78%", left: "70%", size: 5, delay: 2.8, duration: 2.6 },
  { top: "45%", left: "50%", size: 4, delay: 3.2, duration: 3.6 },
  { top: "85%", left: "45%", size: 7, delay: 0.3, duration: 2.8 },
];

type CeuEstreladoProps = {
  /** Cor central do brilho radial. */
  glowColor?: string;
  /** Estrelas que cintilam. Trocar o array controla a densidade. */
  stars?: EstrelaSpec[];
  /** Liga o pattern de estrelas SVG ao fundo. */
  showPattern?: boolean;
  className?: string;
};

// Fundo decorativo de ceu estrelado: brilho radial + pattern de estrelas SVG +
// pontos com `animate-twinkle` (que ja respeita prefers-reduced-motion no
// index.css). Puramente decorativo, por isso aria-hidden e pointer-events-none.
export default function CeuEstrelado({
  glowColor = "rgba(255,184,0,0.15)",
  stars = ESTRELAS_PADRAO,
  showPattern = true,
  className,
}: CeuEstreladoProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, ${glowColor}, transparent 60%)`,
        }}
      />
      {showPattern && (
        <svg className="absolute inset-0 h-full w-full opacity-50">
          <defs>
            <pattern
              id="ceu-estrelado-stars"
              x="0"
              y="0"
              width="120"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 30 14 L 32 22 L 40 22 L 33 28 L 35 36 L 30 31 L 25 36 L 27 28 L 20 22 L 28 22 Z"
                fill="#fbbf24"
                opacity="0.18"
              />
              <path
                d="M 90 80 L 91 84 L 95 84 L 92 87 L 93 91 L 90 88 L 87 91 L 88 87 L 85 84 L 89 84 Z"
                fill="#fbbf24"
                opacity="0.22"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ceu-estrelado-stars)" />
        </svg>
      )}
      <div className="absolute inset-0">
        {stars.map((s, idx) => (
          <span
            key={idx}
            className="animate-twinkle absolute rounded-full bg-amber-300"
            style={
              {
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                boxShadow: `0 0 ${s.size * 3}px ${s.size * 1.2}px rgba(255, 184, 0, 0.7)`,
                ["--twinkle-delay" as string]: `${s.delay}s`,
                ["--twinkle-duration" as string]: `${s.duration}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
