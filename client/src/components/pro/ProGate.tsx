import { Lock, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface ProGateProps {
  description: string;
  className?: string;
}

const STARS: {
  top: string;
  left: string;
  size: number;
  delay: number;
  dur: number;
  gold: boolean;
}[] = [
  { top: "8%", left: "12%", size: 2, delay: 0, dur: 2.4, gold: false },
  { top: "14%", left: "78%", size: 3, delay: 0.6, dur: 3.1, gold: true },
  { top: "6%", left: "44%", size: 2, delay: 1.2, dur: 2.8, gold: false },
  { top: "20%", left: "30%", size: 2, delay: 0.3, dur: 3.4, gold: false },
  { top: "11%", left: "62%", size: 3, delay: 1.5, dur: 2.6, gold: false },
  { top: "26%", left: "88%", size: 2, delay: 0.9, dur: 3.2, gold: true },
  { top: "32%", left: "6%", size: 3, delay: 1.8, dur: 2.9, gold: false },
  { top: "38%", left: "52%", size: 2, delay: 0.4, dur: 3.6, gold: false },
  { top: "44%", left: "22%", size: 2, delay: 1.1, dur: 2.5, gold: false },
  { top: "40%", left: "72%", size: 3, delay: 0.7, dur: 3.0, gold: true },
  { top: "52%", left: "90%", size: 2, delay: 1.6, dur: 2.7, gold: false },
  { top: "56%", left: "40%", size: 2, delay: 0.2, dur: 3.5, gold: false },
  { top: "60%", left: "14%", size: 3, delay: 1.3, dur: 2.8, gold: false },
  { top: "64%", left: "66%", size: 2, delay: 0.8, dur: 3.3, gold: true },
  { top: "70%", left: "32%", size: 2, delay: 1.9, dur: 2.4, gold: false },
  { top: "72%", left: "84%", size: 3, delay: 0.5, dur: 3.1, gold: false },
  { top: "78%", left: "50%", size: 2, delay: 1.0, dur: 2.9, gold: false },
  { top: "82%", left: "10%", size: 2, delay: 1.7, dur: 3.4, gold: true },
  { top: "86%", left: "70%", size: 3, delay: 0.6, dur: 2.6, gold: false },
  { top: "90%", left: "38%", size: 2, delay: 1.4, dur: 3.0, gold: false },
  { top: "16%", left: "94%", size: 2, delay: 0.9, dur: 2.7, gold: false },
  { top: "48%", left: "58%", size: 2, delay: 1.2, dur: 3.2, gold: false },
  { top: "30%", left: "68%", size: 2, delay: 0.3, dur: 2.8, gold: false },
  { top: "88%", left: "92%", size: 2, delay: 1.5, dur: 3.5, gold: true },
];

const BIG_STARS: {
  top: string;
  left: string;
  size: number;
  delay: number;
  dur: number;
}[] = [
  { top: "12%", left: "84%", size: 20, delay: 0.2, dur: 3.4 },
  { top: "66%", left: "7%", size: 16, delay: 1.0, dur: 3.0 },
  { top: "24%", left: "18%", size: 14, delay: 1.5, dur: 3.8 },
  { top: "80%", left: "78%", size: 18, delay: 0.6, dur: 3.2 },
];

function StarField({ reduce }: { reduce: boolean | null }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      {STARS.map((star, i) => (
        <motion.span
          key={`s-${i}`}
          className={`absolute rounded-full ${star.gold ? "bg-amber-300" : "bg-white"}`}
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            opacity: reduce ? 0.55 : undefined,
          }}
          animate={
            reduce ? undefined : { opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }
          }
          transition={
            reduce
              ? undefined
              : {
                  duration: star.dur,
                  delay: star.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        />
      ))}
      {BIG_STARS.map((star, i) => (
        <motion.span
          key={`b-${i}`}
          className="absolute text-amber-200"
          style={{
            top: star.top,
            left: star.left,
            filter: "drop-shadow(0 0 5px rgba(251,191,36,0.7))",
            opacity: reduce ? 0.7 : undefined,
          }}
          animate={
            reduce
              ? undefined
              : { opacity: [0.5, 1, 0.5], scale: [0.85, 1.15, 0.85], rotate: [0, 10, 0] }
          }
          transition={
            reduce
              ? undefined
              : {
                  duration: star.dur,
                  delay: star.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        >
          <Sparkles
            style={{ width: star.size, height: star.size }}
            strokeWidth={1.6}
          />
        </motion.span>
      ))}
    </div>
  );
}

export default function ProGate({ description, className = "" }: ProGateProps) {
  const { loading } = useSubscription();
  const reduce = useReducedMotion();

  if (loading) {
    return (
      <div
        className={`relative isolate overflow-hidden rounded-2xl border-2 border-slate-900 bg-gradient-to-b from-violet-950 via-indigo-950 to-slate-950 p-6 text-center shadow-[4px_4px_0_#0f172a] ${className}`}
      >
        <p className="font-display text-2xl font-black text-white">
          Verificando acesso...
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-sm font-medium text-violet-200">
          Estamos conferindo sua assinatura e permissões administrativas.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative isolate overflow-hidden rounded-2xl border-2 border-slate-900 bg-gradient-to-b from-violet-950 via-indigo-950 to-slate-950 p-6 text-center shadow-[4px_4px_0_#0f172a] ${className}`}
    >
      <StarField reduce={reduce} />

      <div className="relative z-10">
        <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-900 bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.65)]">
          <Lock className="h-7 w-7 text-slate-950" />
          <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-amber-100" />
        </div>
        <h2 className="bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text font-display text-2xl font-black text-transparent">
          Disponível no Plano Pro
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm font-medium text-violet-100">
          {description}
        </p>
        <Link
          href="/planos"
          className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-amber-400 px-6 py-3 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-[4px_4px_0_#0f172a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
        >
          <Sparkles className="h-4 w-4" />
          Ver planos Pro
        </Link>
      </div>
    </div>
  );
}
