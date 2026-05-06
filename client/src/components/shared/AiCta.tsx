import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "wouter";

type AiCtaBaseProps = {
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

const aiCtaClassName =
  "group relative inline-flex items-center gap-3 rounded-2xl border-2 border-slate-950 bg-violet-700 px-5 py-3 text-left text-white shadow-[5px_5px_0_#0f172a] transition-all hover:-translate-y-0.5 hover:bg-violet-800 hover:shadow-[7px_7px_0_#0f172a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700";

function AiCtaContent({ children, description }: AiCtaBaseProps) {
  return (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-amber-300 text-slate-950 shadow-[3px_3px_0_#0f172a]">
        <Sparkles className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="mb-1 inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-100">
          recurso com IA
        </span>
        <span className="block font-display text-sm font-black leading-tight md:text-base">{children}</span>
        {description && <span className="mt-1 block text-xs font-bold text-violet-100">{description}</span>}
      </span>
    </>
  );
}

export function AiCtaLink({ href, children, description, className = "" }: AiCtaLinkProps) {
  return (
    <Link href={href} className={`${aiCtaClassName} ${className}`}>
      <AiCtaContent description={description}>{children}</AiCtaContent>
    </Link>
  );
}

export function AiCtaButton({ onClick, type = "button", pressed, children, description, className = "" }: AiCtaButtonProps) {
  return (
    <button type={type} onClick={onClick} className={`${aiCtaClassName} ${className}`} aria-pressed={pressed}>
      <AiCtaContent description={description}>{children}</AiCtaContent>
    </button>
  );
}
