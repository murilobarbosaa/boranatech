import type { ReactNode } from "react";

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

const ACCENT: Record<
  PageHeroAccent,
  { hero: string; pill: string; dot: string }
> = {
  violet: {
    hero: "bg-violet-100",
    pill: "bg-violet-300",
    dot: "[background-image:radial-gradient(#7c3aed_1px,transparent_1px)]",
  },
  sky: {
    hero: "bg-sky-100",
    pill: "bg-sky-300",
    dot: "[background-image:radial-gradient(#0284c7_1px,transparent_1px)]",
  },
  amber: {
    hero: "bg-amber-100",
    pill: "bg-amber-300",
    dot: "[background-image:radial-gradient(#f59e0b_1px,transparent_1px)]",
  },
  emerald: {
    hero: "bg-emerald-100",
    pill: "bg-emerald-300",
    dot: "[background-image:radial-gradient(#10b981_1px,transparent_1px)]",
  },
  blue: {
    hero: "bg-blue-100",
    pill: "bg-blue-300",
    dot: "[background-image:radial-gradient(#2563eb_1px,transparent_1px)]",
  },
  fuchsia: {
    hero: "bg-fuchsia-100",
    pill: "bg-fuchsia-300",
    dot: "[background-image:radial-gradient(#c026d3_1px,transparent_1px)]",
  },
  orange: {
    hero: "bg-orange-100",
    pill: "bg-orange-300",
    dot: "[background-image:radial-gradient(#ea580c_1px,transparent_1px)]",
  },
  rose: {
    hero: "bg-rose-100",
    pill: "bg-rose-300",
    dot: "[background-image:radial-gradient(#e11d48_1px,transparent_1px)]",
  },
  cyan: {
    hero: "bg-cyan-100",
    pill: "bg-cyan-300",
    dot: "[background-image:radial-gradient(#0891b2_1px,transparent_1px)]",
  },
  teal: {
    hero: "bg-teal-100",
    pill: "bg-teal-300",
    dot: "[background-image:radial-gradient(#0d9488_1px,transparent_1px)]",
  },
};

interface PageHeroProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  /** Cor do hero — alinha com páginas como Notícias, Cursos e Roadmaps. */
  accent?: PageHeroAccent;
  /** Voltar ao hub, breadcrumbs, ícone antes do eyebrow etc. */
  topSlot?: ReactNode;
  /** Conteúdo ao lado direito no hero (ex.: favoritar). */
  actions?: ReactNode;
  /** Ex.: logo da tecnologia alinhado ao título. */
  titlePrefix?: ReactNode;
}

export default function PageHero({
  title,
  subtitle,
  eyebrow,
  accent = "violet",
  topSlot,
  actions,
  titlePrefix,
}: PageHeroProps) {
  const a = ACCENT[accent];

  return (
    <section
      className={`relative overflow-hidden border-b-2 border-slate-900 py-12 ${a.hero}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 opacity-50 ${a.dot} [background-size:18px_18px]`}
      />
      <div className="container relative">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl min-w-0 flex-1">
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
              {titlePrefix ? <span className="shrink-0">{titlePrefix}</span> : null}
              <h1 className="min-w-[12rem] flex-1 font-display text-4xl font-bold leading-tight text-slate-950">
                {title}
              </h1>
            </div>
            <p className="text-lg text-slate-950">{subtitle}</p>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}
