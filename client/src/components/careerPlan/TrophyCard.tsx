import { Trophy } from "lucide-react";
import {
  getCatalogItem,
  type CareerCatalogLevel,
} from "@shared/careerCatalog";
import { cn } from "@/lib/utils";
import type { StationCertVM } from "./types";

// TODO(Ana): labels dos niveis do catalogo
const LEVEL_LABELS: Record<CareerCatalogLevel, string> = {
  intro: "Intro",
  fundamental: "Fundamental",
  associate: "Associate",
  professional: "Professional",
};

interface TrophyCardProps {
  cert: StationCertVM;
  // Marca/desmarca a conquista (item cert:<catalogId> do checklist). Ausente
  // ou readonly: cartao puramente informativo.
  onToggle?: (itemId: string) => void;
  readonly?: boolean;
}

// Cartao-trofeu de certificacao. Sem preco nesta fase: onde o preco vive no
// novo layout e decisao da Fase 4 com a Ana; nada de valor inventado aqui.
export default function TrophyCard({
  cert,
  onToggle,
  readonly = false,
}: TrophyCardProps) {
  const item = getCatalogItem(cert.catalogId);
  const done = cert.done === true;
  // done null = progresso indisponivel: nao afirma "por conquistar" nem
  // permite toggle sem estado confiavel.
  const interactive = !readonly && cert.done !== null && !!onToggle;

  const content = (
    <>
      <span
        aria-hidden
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-slate-950",
          done ? "bg-[#FFB800]" : "bg-amber-50",
        )}
      >
        <Trophy
          className={cn("h-4 w-4", done ? "text-slate-950" : "text-amber-700")}
          strokeWidth={2.5}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-bold leading-tight text-slate-900">
            {item?.name ?? cert.catalogId}
          </span>
          {!item ? (
            <span className="rounded-full border border-slate-400 bg-slate-100 px-1.5 text-[0.6rem] font-black uppercase text-slate-600">
              {/* TODO(Ana): marcacao de item fora do catalogo atual */}
              item desatualizado
            </span>
          ) : null}
          {cert.optional ? (
            <span className="rounded-full border border-slate-400 bg-slate-100 px-1.5 text-[0.6rem] font-black uppercase text-slate-600">
              {/* TODO(Ana): badge de certificacao opcional */}
              opcional
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
          {item ? <span>{item.provider}</span> : null}
          {item ? (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 text-[0.6rem] font-black uppercase text-amber-800">
              {LEVEL_LABELS[item.level]}
            </span>
          ) : null}
        </span>
      </span>
      {cert.done !== null ? (
        <span
          className={cn(
            "shrink-0 self-center rounded-full border-2 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide",
            done
              ? "border-emerald-600 bg-emerald-100 text-emerald-800"
              : "border-slate-300 bg-white text-slate-500",
          )}
        >
          {/* TODO(Ana): estados de conquista do trofeu */}
          {done ? "Conquistada" : "Por conquistar"}
        </span>
      ) : null}
    </>
  );

  const baseClass = cn(
    "flex w-full items-start gap-2.5 rounded-xl border-2 px-3 py-2 text-left transition-colors",
    done ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-white",
  );

  if (interactive) {
    return (
      <button
        type="button"
        aria-pressed={done}
        // TODO(Ana): aria-label do toggle de conquista
        aria-label={`Marcar certificação ${item?.name ?? cert.catalogId}`}
        onClick={() => onToggle?.(cert.itemId)}
        className={cn(baseClass, "hover:border-slate-500")}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
