import type { CSSProperties, ReactNode } from "react";

export type PageHeroAccent =
  | "violet"
  | "sky"
  | "amber"
  | "emerald"
  | "blue"
  | "fuchsia"
  | "orange"
  | "rose"
  | "cyan"
  | "teal";

export type PageHeroPattern = "dots" | "grid" | "none";

const ACCENT: Record<
  PageHeroAccent,
  { hero: string; pill: string; color: string }
> = {
  violet: { hero: "bg-violet-100", pill: "bg-violet-300", color: "#7c3aed" },
  sky: { hero: "bg-sky-100", pill: "bg-sky-300", color: "#0284c7" },
  amber: { hero: "bg-amber-100", pill: "bg-amber-300", color: "#f59e0b" },
  emerald: { hero: "bg-emerald-100", pill: "bg-emerald-300", color: "#10b981" },
  blue: { hero: "bg-blue-100", pill: "bg-blue-300", color: "#2563eb" },
  fuchsia: { hero: "bg-fuchsia-100", pill: "bg-fuchsia-300", color: "#c026d3" },
  orange: { hero: "bg-orange-100", pill: "bg-orange-300", color: "#ea580c" },
  rose: { hero: "bg-rose-100", pill: "bg-rose-300", color: "#e11d48" },
  cyan: { hero: "bg-cyan-100", pill: "bg-cyan-300", color: "#0891b2" },
  teal: { hero: "bg-teal-100", pill: "bg-teal-300", color: "#0d9488" },
};

function patternStyle(pattern: PageHeroPattern, color: string): CSSProperties {
  if (pattern === "none") return {};
  if (pattern === "dots")
    return {
      backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
      backgroundSize: "18px 18px",
    };
  return {
    backgroundImage: `linear-gradient(${color}33 1px, transparent 1px), linear-gradient(to right, ${color}33 1px, transparent 1px)`,
    backgroundSize: "18px 18px",
  };
}

interface PageHeroProps {
  title: ReactNode;
  subtitle: ReactNode;
  eyebrow?: string;
  /** Cor do hero, alinha com páginas como Notícias, Cursos e Roadmaps. */
  accent?: PageHeroAccent;
  /** Padrão decorativo de fundo. Default 'dots' preserva comportamento atual. */
  pattern?: PageHeroPattern;
  /** Voltar ao hub, breadcrumbs, ícone antes do eyebrow etc. */
  topSlot?: ReactNode;
  /** Conteúdo ao lado direito no hero (ex.: favoritar). */
  actions?: ReactNode;
  /** Ex.: logo da tecnologia alinhado ao título. */
  titlePrefix?: ReactNode;
  /** Camada decorativa atrás do conteúdo do hero (ex.: blobs animados por área). */
  backgroundSlot?: ReactNode;
}

export default function PageHero({
  title,
  subtitle,
  eyebrow,
  accent = "violet",
  pattern = "dots",
  topSlot,
  actions,
  titlePrefix,
  backgroundSlot,
}: PageHeroProps) {
  const a = ACCENT[accent];

  return (
    <section
      className={`relative overflow-hidden border-b-2 border-slate-900 py-12 ${a.hero}`}
    >
      {pattern !== "none" && (
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={patternStyle(pattern, a.color)}
        />
      )}
      {backgroundSlot}
      <div className="container relative">
        <div className="flex flex-col gap-6 md:flex-row md:flex-wrap md:items-start md:justify-between">
          <div className="min-w-0 md:max-w-2xl md:flex-1">
            {topSlot ? <div className="mb-4">{topSlot}</div> : null}
            {eyebrow ? (
              <p
                className={`mb-4 inline-flex rounded-full border-2 border-slate-900 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a] ${a.pill}`}
              >
                {eyebrow}
              </p>
            ) : null}
            <div
              className={`mb-3 flex flex-wrap gap-4 ${titlePrefix ? "items-center" : "items-start"}`}
            >
              {titlePrefix ? (
                <span className="shrink-0">{titlePrefix}</span>
              ) : null}
              <h1 className="min-w-[12rem] flex-1 font-display text-4xl font-bold leading-tight text-slate-950">
                {title}
              </h1>
            </div>
            <p className="text-lg text-slate-950">{subtitle}</p>
          </div>
          {actions ? (
            <div className="flex w-auto shrink-0 flex-col gap-3 md:w-80 md:max-w-xs">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
