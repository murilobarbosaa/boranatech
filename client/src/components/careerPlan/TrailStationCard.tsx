import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { getCatalogItem } from "@shared/careerCatalog";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import type { FxRate } from "@/services/careerPlanService";
import TrophyCard from "./TrophyCard";
import type { TrailStationVM } from "./types";

const ac = getPageAccentUi("amber");

interface TrailStationCardProps {
  station: TrailStationVM;
  index: number;
  expanded: boolean;
  // Expansao controlada pelo pai (CareerTrail garante o scroll da estacao
  // expandida); null fecha.
  onExpand: (stationId: string | null) => void;
  onToggleItem: (itemId: string) => void;
  readonly?: boolean;
  // Versao do catalogo do plano (repassada aos trofeus ancorados).
  catalogVersion?: string | null;
  // Cotacao PTAX (ou null), repassada aos trofeus ancorados.
  fx?: FxRate | null;
  // Ref do botao de cabecalho, usada pelo CareerTrail na navegacao por setas.
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

export default function TrailStationCard({
  station,
  index,
  expanded,
  onExpand,
  onToggleItem,
  readonly = false,
  catalogVersion = null,
  fx = null,
  buttonRef,
}: TrailStationCardProps) {
  const reduce = useReducedMotion() ?? false;
  const { step, items, anchoredCerts, scheduleLabel, progress, state } =
    station;

  const complete = state === "complete";
  const current = state === "current";
  const pct =
    progress.done !== null && progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  return (
    <article
      className={cn(
        "card-brutal flex h-full flex-col rounded-2xl bg-white pb-4",
        current &&
          "ring-2 ring-[#FFB800] ring-offset-2 ring-offset-transparent",
      )}
    >
      <button
        type="button"
        ref={buttonRef}
        data-station-index={index}
        aria-expanded={expanded}
        onClick={() => onExpand(expanded ? null : step.id)}
        className="flex w-full items-start gap-3 rounded-t-2xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500"
      >
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-slate-950 font-display text-base font-black text-slate-950 shadow-[2px_2px_0_#0f172a]",
            complete ? "bg-emerald-400" : current ? "bg-[#FFB800]" : "bg-white",
          )}
        >
          {complete ? (
            <Check className="h-5 w-5" strokeWidth={3} aria-hidden />
          ) : (
            index + 1
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-black leading-tight text-slate-950">
            {step.title}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border-2 border-slate-950 bg-amber-100 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-slate-900">
              {/* TODO(Ana): badge de duracao estimada */}~{step.estimatedWeeks}{" "}
              {step.estimatedWeeks === 1 ? "semana" : "semanas"}
            </span>
            {scheduleLabel ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide",
                  ac.tag,
                )}
              >
                {scheduleLabel}
              </span>
            ) : null}
          </span>
        </span>
      </button>

      <div className="px-4">
        {progress.done === null ? (
          <p className="text-xs font-bold text-slate-500">
            {/* TODO(Ana): progresso indisponivel */}
            Progresso indisponível no momento
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>
                {/* TODO(Ana): resumo do progresso da estacao */}
                {progress.done} de {progress.total} itens
              </span>
              <span className={ac.progressLabel}>{pct}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full border-2 border-slate-950 bg-slate-100">
              <div
                className={cn(
                  "h-full transition-[width] motion-reduce:transition-none",
                  complete ? "bg-emerald-500" : ac.progressFill,
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        )}
      </div>

      {anchoredCerts.length > 0 ? (
        <div className="mt-3 space-y-2 px-4">
          {anchoredCerts.map((cert) => (
            <TrophyCard
              key={cert.itemId}
              cert={cert}
              onToggle={readonly ? undefined : onToggleItem}
              readonly={readonly}
              catalogVersion={catalogVersion}
              fx={fx}
            />
          ))}
        </div>
      ) : null}

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="detail"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.28, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mx-4 mt-3 border-t-2 border-dashed border-slate-200 pt-3">
              <p className="text-sm leading-relaxed text-slate-600">
                {step.rationale}
              </p>
              <div className="mt-3 space-y-2">
                {items.map((item) => {
                  const catalogItem = item.catalogId
                    ? getCatalogItem(item.catalogId)
                    : null;
                  const label = catalogItem
                    ? `${item.label} (${catalogItem.name})`
                    : item.label;
                  const done = item.done === true;
                  // done null = progresso indisponivel: checkbox desabilitado
                  // para nao mostrar um "nao feito" falso nem gravar em cima.
                  const disabled = readonly || item.done === null;
                  return (
                    <button
                      key={item.itemId}
                      type="button"
                      disabled={disabled}
                      onClick={() => onToggleItem(item.itemId)}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-xl border-2 px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                        done
                          ? "border-emerald-500 bg-emerald-50 text-slate-700"
                          : "border-slate-300 bg-white text-slate-800 hover:border-slate-500",
                        disabled && "cursor-default opacity-80",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border-2",
                          done
                            ? "border-emerald-600 bg-emerald-500"
                            : "border-slate-400 bg-white",
                        )}
                      >
                        {done ? (
                          <Check
                            className="h-3 w-3 text-white"
                            strokeWidth={3}
                          />
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          done && "line-through decoration-slate-400",
                        )}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}
