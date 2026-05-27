import type { CSSProperties } from "react";
import { Link } from "wouter";
import TechnologyLogo from "@/components/TechnologyLogo";
import type { Technology } from "@/lib/technologyData";
import { cn } from "@/lib/utils";

export type TechCompactTileProps = {
  technology: Technology;
  style?: CSSProperties;
  onNavigate?: () => void;
  /** Slug da área de origem; preserva o caminho de volta na página da tecnologia. */
  fromArea?: string;
};

/** Azulejo compacto: logo pequeno + nome completo (várias linhas se precisar). */
export default function TechCompactTile({ technology, style, onNavigate, fromArea }: TechCompactTileProps) {
  return (
    <Link
      href={fromArea ? `/tecnologias/${technology.slug}?from=${fromArea}` : `/tecnologias/${technology.slug}`}
      title={`${technology.name} · ${technology.category}, nível ${technology.difficulty}`}
      style={style}
      onClick={() => onNavigate?.()}
      className={cn(
        "tech-map-pill flex min-h-0 flex-col items-center justify-start gap-1.5 rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-center outline-offset-2 transition-[border-color,background-color,box-shadow] hover:border-teal-300 hover:bg-teal-50/50 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-teal-400",
      )}
    >
      <TechnologyLogo
        name={technology.name}
        icon={technology.icon}
        logoUrl={technology.logoUrl}
        className="h-8 w-8 shrink-0 rounded-md border border-slate-200 bg-white shadow-sm sm:h-9 sm:w-9"
        imageClassName="h-4 w-4 p-px sm:h-5 sm:w-5"
      />
      <span className="w-full min-h-[2lh] hyphens-auto text-balance break-words text-[11px] font-bold leading-snug text-slate-900 antialiased sm:min-h-0 sm:text-xs">
        {technology.name}
      </span>
    </Link>
  );
}
