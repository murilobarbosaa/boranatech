import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, ExternalLink, Trophy } from "lucide-react";
import { getCatalogItem, type CareerCatalogLevel } from "@shared/careerCatalog";
import { cn } from "@/lib/utils";
import type { FxRate } from "@/services/careerPlanService";
import { formatAmount, formatPrice, type StationCertVM } from "./types";

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
  // ou readonly: sem toggle.
  onToggle?: (itemId: string) => void;
  readonly?: boolean;
  // Versao do catalogo do plano exibido; alimenta a linha de preco do
  // detalhe. Ausente (ex: vitrine), a linha de versao e omitida.
  catalogVersion?: string | null;
  // Cotacao PTAX (ou null): preco em USD ganha "≈ R$" ao lado no detalhe.
  // Ausente, so o USD como sempre.
  fx?: FxRate | null;
}

// Cartao-trofeu de certificacao. O preco vive APENAS no detalhe expandido e
// vem SEMPRE do catalogo curado; nenhum valor inventado. A expansao e estado
// local (diferente da estacao, controlada pelo pai): trofeus aparecem em tres
// contextos e nenhum pai precisa garantir scroll do trofeu expandido.
export default function TrophyCard({
  cert,
  onToggle,
  readonly = false,
  catalogVersion = null,
  fx = null,
}: TrophyCardProps) {
  const reduce = useReducedMotion() ?? false;
  const [expanded, setExpanded] = useState(false);
  const item = getCatalogItem(cert.catalogId);
  const done = cert.done === true;
  // done null = progresso indisponivel: nao afirma "por conquistar" nem
  // permite toggle sem estado confiavel.
  const canToggle = !readonly && cert.done !== null && !!onToggle;
  const name = item?.name ?? cert.catalogId;

  return (
    <div
      className={cn(
        "rounded-xl border-2 transition-colors",
        done ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-white",
      )}
    >
      <div className="flex items-start gap-2.5 px-3 py-2">
        <button
          type="button"
          aria-expanded={expanded}
          // TODO(Ana): aria-label do detalhe do trofeu
          aria-label={`Detalhes de ${name}`}
          onClick={() => setExpanded((prev) => !prev)}
          className="flex min-w-0 flex-1 items-start gap-2.5 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <span
            aria-hidden
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-slate-950",
              done ? "bg-[#FFB800]" : "bg-amber-50",
            )}
          >
            <Trophy
              className={cn(
                "h-4 w-4",
                done ? "text-slate-950" : "text-amber-700",
              )}
              strokeWidth={2.5}
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-bold leading-tight text-slate-900">
                {name}
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
          <ChevronDown
            aria-hidden
            className={cn(
              "mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform motion-reduce:transition-none",
              expanded && "rotate-180",
            )}
          />
        </button>
        {canToggle ? (
          <button
            type="button"
            aria-pressed={done}
            // TODO(Ana): aria-label do toggle de conquista
            aria-label={`Marcar certificação ${name}`}
            onClick={() => onToggle?.(cert.itemId)}
            className={cn(
              "mt-1 grid h-5 w-5 shrink-0 place-items-center rounded border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1",
              done
                ? "border-emerald-600 bg-emerald-500"
                : "border-slate-400 bg-white hover:border-slate-600",
            )}
          >
            {done ? (
              <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
            ) : null}
          </button>
        ) : cert.done !== null ? (
          <span
            className={cn(
              "mt-0.5 shrink-0 rounded-full border-2 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide",
              done
                ? "border-emerald-600 bg-emerald-100 text-emerald-800"
                : "border-slate-300 bg-white text-slate-500",
            )}
          >
            {/* TODO(Ana): estados de conquista do trofeu */}
            {done ? "Conquistada" : "Por conquistar"}
          </span>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="detail"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.24, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mx-3 mb-2.5 border-t border-dashed border-slate-300 pt-2.5">
              {!item ? (
                <p className="text-xs font-medium text-slate-500">
                  {/* TODO(Ana): aviso de item fora do catalogo no detalhe */}
                  Este item saiu do nosso catálogo atual, então não mostramos
                  preço nem link. Gere um plano novo pra ver alternativas
                  atualizadas.
                </p>
              ) : (
                <div className="space-y-1.5">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    {"free" in item.price ? (
                      <span className="rounded-full border-2 border-emerald-600 bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wide text-emerald-800">
                        {/* TODO(Ana): badge de item gratuito */}
                        gratuito
                      </span>
                    ) : (
                      <>
                        <span className="font-black text-slate-900">
                          {formatPrice(cert.catalogId)}
                        </span>
                        {fx && item.price.currency === "USD" ? (
                          <span className="text-xs font-bold text-slate-600">
                            ≈{" "}
                            {formatAmount(
                              Math.round(item.price.amount * fx.usdBrl),
                              "BRL",
                              item.price.period,
                            )}
                          </span>
                        ) : null}
                      </>
                    )}
                    {catalogVersion ? (
                      <span className="text-xs font-medium text-slate-500">
                        {/* TODO(Ana): rotulo da versao do preco */}
                        preços de {catalogVersion}
                      </span>
                    ) : null}
                  </p>
                  {cert.whenLabel ? (
                    <p className="text-xs font-bold text-slate-600">
                      {cert.whenLabel}
                    </p>
                  ) : null}
                  {cert.rationale ? (
                    <p className="text-xs font-medium text-slate-500">
                      {cert.rationale}
                    </p>
                  ) : null}
                  <p>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded text-xs font-bold text-amber-800 underline underline-offset-2 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      {/* TODO(Ana): label do link oficial */}
                      Ver no site oficial
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  </p>
                  {!("free" in item.price) ? (
                    <p className="text-[0.65rem] font-medium text-slate-400">
                      {/* TODO(Ana): disclaimer curto de preco no trofeu */}
                      Preço de referência; confirme no site oficial.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
