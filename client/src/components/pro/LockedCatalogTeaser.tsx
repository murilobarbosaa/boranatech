import { Link } from "wouter";
import { ArrowRight, Lock } from "lucide-react";
import { ProStarIcon } from "@/components/pro/ProStarIcon";

// Teaser do tier Pro para os catalogos freemium (Cursos, Plataformas,
// Projetos). Substitui o antigo padrao de renderizar o card real e cobrir com
// blur/overlay (burlavel no DevTools): aqui os cards sao placeholders
// decorativos SEM nenhum dado real do item. So a contagem (lockedCount) e o CTA
// sao reais. Mantem a linguagem visual de "tem mais no Pro".
interface LockedCatalogTeaserProps {
  count: number;
  noun: string;
  accentShadow: string;
  className?: string;
}

export default function LockedCatalogTeaser({
  count,
  noun,
  accentShadow,
  className = "",
}: LockedCatalogTeaserProps) {
  if (count <= 0) return null;

  const placeholders = Math.min(count, 3);

  return (
    <div className={`relative ${className}`}>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {Array.from({ length: placeholders }).map((_, i) => (
          <div
            key={i}
            style={{ boxShadow: `5px 5px 0 ${accentShadow}` }}
            className="select-none rounded-2xl border-2 border-slate-900 bg-white p-6 blur-[3px]"
          >
            <div className="mb-4 flex gap-2">
              <span className="h-5 w-16 rounded-md bg-slate-200" />
              <span className="h-5 w-20 rounded-md bg-slate-200" />
            </div>
            <div className="h-5 w-3/4 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/3 rounded bg-slate-200" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-5/6 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-slate-900 bg-white/70 p-6 text-center backdrop-blur-[1px]">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-900 bg-amber-300 shadow-[3px_3px_0_#0f172a]">
          <Lock className="h-6 w-6 text-slate-950" aria-hidden />
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-violet-100 px-2.5 py-0.5 text-[11px] font-black uppercase text-violet-800">
          <ProStarIcon className="h-3.5 w-3.5" /> Pro
        </span>
        {/* TODO(Ana): copy do teaser do catalogo Pro */}
        <p className="max-w-[18rem] text-sm font-black text-slate-950">
          Mais {count} {noun} liberam no Plano Pro.
        </p>
        <Link
          href="/planos"
          className="inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-[#FFB800] px-4 py-2 text-xs font-black uppercase text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-0.5"
        >
          Assine o Pro pra desbloquear{" "}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
