import { type CSSProperties } from "react";
import { Link } from "wouter";
import {
  BookA,
  Briefcase,
  Building2,
  CalendarDays,
  Cpu,
  ExternalLink,
  FolderGit2,
  Globe,
  GraduationCap,
  Heart,
  Layers,
  Lightbulb,
  type LucideIcon,
  Map as MapIcon,
  Newspaper,
  School,
  Users,
} from "lucide-react";

import type { FavoriteItem, FavoriteType } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

interface TypeMeta {
  label: string;
  Icon: LucideIcon;
  accent: string;
  iconBg: string;
  internalPath: (item: FavoriteItem) => string | null;
}

const TYPE_META: Record<FavoriteType, TypeMeta> = {
  noticia: {
    label: "Notícia",
    Icon: Newspaper,
    accent: "#7dd3fc",
    iconBg: "bg-sky-100 text-sky-700",
    internalPath: () => null,
  },
  roadmap: {
    label: "Roadmap",
    Icon: MapIcon,
    accent: "#6ee7b7",
    iconBg: "bg-emerald-100 text-emerald-700",
    internalPath: () => "/roadmaps",
  },
  curso: {
    label: "Curso",
    Icon: GraduationCap,
    accent: "#fcd34d",
    iconBg: "bg-amber-100 text-amber-800",
    internalPath: () => "/cursos",
  },
  projeto: {
    label: "Projeto",
    Icon: FolderGit2,
    accent: "#fda4af",
    iconBg: "bg-rose-100 text-rose-700",
    internalPath: () => "/projetos",
  },
  area: {
    label: "Área",
    Icon: Layers,
    accent: "#c4b5fd",
    iconBg: "bg-violet-100 text-violet-700",
    internalPath: (item) => `/areas/${item.id}`,
  },
  conceito: {
    label: "Conceito",
    Icon: BookA,
    accent: "#67e8f9",
    iconBg: "bg-cyan-100 text-cyan-700",
    internalPath: () => "/dicionario",
  },
  plataforma: {
    label: "Plataforma",
    Icon: Globe,
    accent: "#93c5fd",
    iconBg: "bg-blue-100 text-blue-700",
    internalPath: () => "/plataformas",
  },
  dica: {
    label: "Dica",
    Icon: Lightbulb,
    accent: "#fde047",
    iconBg: "bg-yellow-100 text-yellow-800",
    internalPath: () => "/dicas",
  },
  evento: {
    label: "Evento",
    Icon: CalendarDays,
    accent: "#f9a8d4",
    iconBg: "bg-pink-100 text-pink-700",
    internalPath: () => "/eventos",
  },
  comunidade: {
    label: "Comunidade",
    Icon: Users,
    accent: "#a5b4fc",
    iconBg: "bg-indigo-100 text-indigo-700",
    internalPath: () => "/comunidades",
  },
  faculdade: {
    label: "Faculdade",
    Icon: School,
    accent: "#cbd5e1",
    iconBg: "bg-slate-100 text-slate-700",
    internalPath: () => "/faculdades",
  },
  tecnologia: {
    label: "Tecnologia",
    Icon: Cpu,
    accent: "#5eead4",
    iconBg: "bg-teal-100 text-teal-700",
    internalPath: (item) => `/tecnologias/${item.id}`,
  },
  empresa: {
    label: "Empresa",
    Icon: Building2,
    accent: "#d4d4d8",
    iconBg: "bg-zinc-100 text-zinc-700",
    internalPath: (item) => `/empresas/${item.id}`,
  },
  vaga: {
    label: "Vaga",
    Icon: Briefcase,
    accent: "#fdba74",
    iconBg: "bg-orange-100 text-orange-700",
    internalPath: () => null,
  },
};

export function getFavoriteTypeMeta(type: FavoriteType): TypeMeta {
  return TYPE_META[type];
}

function externalHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

interface FavoriteCardProps {
  item: FavoriteItem;
  isRemoving?: boolean;
  onRemove: () => void;
}

export function FavoriteCard({ item, isRemoving = false, onRemove }: FavoriteCardProps) {
  const meta = TYPE_META[item.type];
  const host = item.url ? externalHost(item.url) : null;
  const internal = item.url ? null : meta.internalPath(item);
  const shadowStyle: CSSProperties = { boxShadow: `5px 5px 0 ${meta.accent}` };

  return (
    <article
      data-favorite-type={item.type}
      data-favorite-id={item.id}
      className={cn(
        "card-brutal flex flex-col rounded-xl border-2 border-slate-900 bg-white p-5 transition-opacity",
        isRemoving && "pointer-events-none opacity-50",
      )}
      style={shadowStyle}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-slate-900",
            meta.iconBg,
          )}
        >
          <meta.Icon className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black uppercase tracking-wide text-slate-700">
          {meta.label}
        </span>
      </div>

      <h3 className="font-display mt-4 text-lg font-black leading-snug text-slate-900">
        {item.title}
      </h3>

      {item.subtitle && (
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.subtitle}</p>
      )}

      {host && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-slate-400">
          <ExternalLink className="h-3 w-3" aria-hidden />
          {host}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-slate-950 hover:underline"
          >
            Ver original
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        ) : internal ? (
          <Link
            href={internal}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-slate-950 hover:underline"
          >
            Ver mais
          </Link>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover ${item.title} dos favoritos`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-rose-100 text-rose-700 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#0f172a] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isRemoving}
        >
          <Heart className="h-4 w-4 fill-current" aria-hidden />
        </button>
      </div>
    </article>
  );
}
