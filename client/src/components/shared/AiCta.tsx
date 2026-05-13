import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "wouter";
import type { PageHeroAccent } from "@/components/shared/PageHero";

type AiCtaBaseProps = {
  accent?: PageHeroAccent;
  children: ReactNode;
  description?: string;
  className?: string;
};

type AiCtaLinkProps = AiCtaBaseProps & {
  href: string;
};

type AiCtaButtonProps = AiCtaBaseProps & {
  onClick: () => void;
  type?: "button" | "submit" | "reset";
  pressed?: boolean;
};

const ACCENT: Record<PageHeroAccent, { container: string; eyebrow: string; focusOutline: string }> = {
  violet:  { container: "bg-violet-100",  eyebrow: "bg-violet-300",  focusOutline: "focus-visible:outline-violet-700"  },
  emerald: { container: "bg-emerald-100", eyebrow: "bg-emerald-300", focusOutline: "focus-visible:outline-emerald-700" },
  blue:    { container: "bg-blue-100",    eyebrow: "bg-blue-300",    focusOutline: "focus-visible:outline-blue-700"    },
  amber:   { container: "bg-amber-100",   eyebrow: "bg-amber-300",   focusOutline: "focus-visible:outline-amber-700"   },
  sky:     { container: "bg-sky-100",     eyebrow: "bg-sky-300",     focusOutline: "focus-visible:outline-sky-700"     },
  cyan:    { container: "bg-cyan-100",    eyebrow: "bg-cyan-300",    focusOutline: "focus-visible:outline-cyan-700"    },
  fuchsia: { container: "bg-fuchsia-100", eyebrow: "bg-fuchsia-300", focusOutline: "focus-visible:outline-fuchsia-700" },
  orange:  { container: "bg-orange-100",  eyebrow: "bg-orange-300",  focusOutline: "focus-visible:outline-orange-700"  },
  rose:    { container: "bg-rose-100",    eyebrow: "bg-rose-300",    focusOutline: "focus-visible:outline-rose-700"    },
  teal:    { container: "bg-teal-100",    eyebrow: "bg-teal-300",    focusOutline: "focus-visible:outline-teal-700"    },
};

function aiCtaClasses(accent: PageHeroAccent, extra = ""): string {
  const a = ACCENT[accent];
  return `group relative inline-flex items-center gap-3 rounded-2xl border-2 border-slate-950 px-5 py-3 text-left text-slate-950 shadow-[5px_5px_0_#0f172a] transition-all hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#0f172a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${a.container} ${a.focusOutline} ${extra}`;
}

function AiCtaContent({ children, description, accent = "violet" }: AiCtaBaseProps) {
  const a = ACCENT[accent];
  return (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-amber-300 text-slate-950 shadow-[3px_3px_0_#0f172a]">
        <Sparkles className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className={`mb-1 inline-flex rounded-full border border-slate-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-950 ${a.eyebrow}`}>
          recurso com IA
        </span>
        <span className="block font-display text-sm font-black leading-tight md:text-base">{children}</span>
        {description && <span className="mt-1 block text-xs font-bold text-slate-700">{description}</span>}
      </span>
    </>
  );
}

export function AiCtaLink({ href, children, description, accent = "violet", className = "" }: AiCtaLinkProps) {
  return (
    <Link href={href} className={aiCtaClasses(accent, className)}>
      <AiCtaContent description={description} accent={accent}>{children}</AiCtaContent>
    </Link>
  );
}

export function AiCtaButton({ onClick, type = "button", pressed, children, description, accent = "violet", className = "" }: AiCtaButtonProps) {
  return (
    <button type={type} onClick={onClick} className={aiCtaClasses(accent, className)} aria-pressed={pressed}>
      <AiCtaContent description={description} accent={accent}>{children}</AiCtaContent>
    </button>
  );
}
