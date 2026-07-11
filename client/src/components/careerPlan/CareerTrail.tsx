import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Flag, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import TrailStationCard from "./TrailStationCard";
import { useTrailScroll } from "./useTrailScroll";
import type { TrailStationVM } from "./types";

interface CareerTrailProps {
  stations: TrailStationVM[];
  // Primeira estacao com progresso incompleto (marcador "voce esta aqui");
  // calculado fora (buildTrailVM ou pai). null = sem marcador.
  currentStationIndex: number | null;
  expandedStationId: string | null;
  onExpand: (stationId: string | null) => void;
  onToggleItem: (itemId: string) => void;
  readonly?: boolean;
  // Versao do catalogo do plano exibido (linha de preco do trofeu expandido).
  catalogVersion?: string | null;
  // Ao montar com progresso conhecido, rola a trilha ate a estacao "voce
  // esta aqui" (so o scroll horizontal do container; a pagina nao se move).
  autoScrollToCurrent?: boolean;
  // Modo destaque do PlanResult: conector serpenteado, marcos entre estacoes,
  // bandeira de chegada, gaps maiores e cards maiores no desktop. A vitrine
  // da entrada NAO passa a prop e continua com o visual compacto.
  decorated?: boolean;
}

// Trilha horizontal do plano de carreira: scroll nativo com CSS scroll-snap,
// sem lib de carrossel. Irma conceitual da trilha vertical do RoadmapsV2.
// Wheel e arrasto vem do useTrailScroll; snap-proximity (nao mandatory) com
// snap desligado durante o arrasto, para o card assentar de leve perto do
// ponto de snap sem o efeito borracha do mandatory ao soltar.
export default function CareerTrail({
  stations,
  currentStationIndex,
  expandedStationId,
  onExpand,
  onToggleItem,
  readonly = false,
  catalogVersion = null,
  autoScrollToCurrent = false,
  decorated = false,
}: CareerTrailProps) {
  const reduce = useReducedMotion() ?? false;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { dragging, handlers } = useTrailScroll(scrollRef);
  const wrapperRefs = useRef<Array<HTMLDivElement | null>>([]);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const didAutoScroll = useRef(false);
  const [visibleIndex, setVisibleIndex] = useState(0);

  // Deep-link visual: centraliza a estacao atual UMA vez, mexendo apenas no
  // scrollLeft do container (scrollIntoView poderia rolar a pagina inteira
  // na vertical). reduce = posicionamento instantaneo, sem animacao.
  useEffect(() => {
    if (!autoScrollToCurrent || didAutoScroll.current) return;
    if (currentStationIndex === null) return;
    const rootEl = scrollRef.current;
    const wrapper = wrapperRefs.current[currentStationIndex];
    if (!rootEl || !wrapper) return;
    didAutoScroll.current = true;
    const left =
      wrapper.offsetLeft - (rootEl.clientWidth - wrapper.clientWidth) / 2;
    rootEl.scrollTo({
      left: Math.max(0, left),
      behavior: reduce ? "auto" : "smooth",
    });
  }, [autoScrollToCurrent, currentStationIndex, reduce]);

  // IntersectionObserver em vez de scroll handler: cobre snap, resize e
  // larguras variaveis de card sem matematica manual de offsets (que exigiria
  // throttle e recalculo a cada resize) e so dispara quando a visibilidade
  // muda de fato. O indicador segue a estacao mais visivel no viewport do
  // container.
  useEffect(() => {
    const rootEl = scrollRef.current;
    if (!rootEl || stations.length === 0) return;

    const ratios = new Map<Element, number>();
    const indexByEl = new Map<Element, number>();
    wrapperRefs.current.forEach((el, index) => {
      if (el) indexByEl.set(el, index);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target, entry.intersectionRatio);
        }
        let bestIndex = 0;
        let bestRatio = -1;
        ratios.forEach((ratio, el) => {
          const index = indexByEl.get(el);
          if (index !== undefined && ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = index;
          }
        });
        setVisibleIndex(bestIndex);
      },
      { root: rootEl, threshold: [0.25, 0.5, 0.75, 1] },
    );

    wrapperRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [stations.length]);

  function focusStation(index: number) {
    const clamped = Math.max(0, Math.min(stations.length - 1, index));
    buttonRefs.current[clamped]?.focus({ preventScroll: true });
    wrapperRefs.current[clamped]?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }

  // Setas esquerda/direita movem o foco entre estacoes. So age quando o foco
  // esta num botao de estacao (data-station-index), para nao sequestrar as
  // setas dentro do checklist expandido.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const target = event.target as HTMLElement;
    const raw = target.dataset.stationIndex;
    if (raw === undefined) return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    focusStation(Number(raw) + delta);
  }

  if (stations.length === 0) return null;

  return (
    <section
      role="region"
      // TODO(Ana): aria-label da trilha
      aria-label="Trilha do plano de carreira. Role para o lado ou use as setas esquerda e direita do teclado para navegar entre as estações."
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
          {/* TODO(Ana): rotulo da trilha */}
          Estações da rota
        </p>
        <p
          aria-live="polite"
          className="rounded-full border-2 border-slate-950 bg-white px-2.5 py-0.5 text-[0.65rem] font-black uppercase tracking-wide text-slate-700 shadow-[2px_2px_0_#0f172a]"
        >
          {/* TODO(Ana): indicador de posicao na trilha */}
          Estação {visibleIndex + 1} de {stations.length}
        </p>
      </div>

      <div className="relative mt-4">
        {/* Conector da trilha: caminho tracejado com leve serpenteio no modo
            destaque (mesmo espirito do RoadmapsV2, deitado); reto no modo
            compacto da vitrine. */}
        {decorated ? (
          <svg
            aria-hidden
            viewBox="0 0 1200 64"
            preserveAspectRatio="none"
            fill="none"
            className="pointer-events-none absolute left-0 right-0 top-12 z-0 h-16 w-full text-slate-950/25"
          >
            <path
              d="M0 32 Q 75 16 150 32 T 300 32 T 450 32 T 600 32 T 750 32 T 900 32 T 1050 32 T 1200 32"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="10 12"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-20 z-0 border-t-2 border-dashed border-slate-950/20"
          />
        )}
        <div
          ref={scrollRef}
          onKeyDown={handleKeyDown}
          {...handlers}
          style={{ scrollSnapType: dragging ? "none" : undefined }}
          className={cn(
            "relative z-10 -mx-2 flex snap-x snap-proximity items-start overflow-x-auto px-2 pb-4 pt-2",
            decorated ? "gap-6 md:gap-12" : "gap-5",
            dragging
              ? "cursor-grabbing select-none [&_*]:pointer-events-none"
              : "cursor-grab",
          )}
        >
          {stations.map((station, index) => (
            <motion.div
              key={station.step.id}
              ref={(el) => {
                wrapperRefs.current[index] = el;
              }}
              // Largura fluida no mobile (com espiada dos vizinhos via
              // snap-center), fixa no desktop. Sem altura fixa: overflow
              // vertical proibido.
              className={cn(
                "relative w-[min(82vw,340px)] shrink-0 snap-center pt-4",
                decorated ? "lg:w-[400px]" : "lg:w-[360px]",
              )}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: Math.min(index * 0.06, 0.3),
                ease: "easeOut",
              }}
            >
              {decorated && index < stations.length - 1 ? (
                // Marco discreto no meio do caminho entre esta estacao e a
                // proxima (centro do gap: gap-6 no mobile, gap-12 no md+).
                <span
                  aria-hidden
                  className="absolute -right-[17px] top-[67px] z-0 h-2.5 w-2.5 rotate-45 rounded-[2px] border-2 border-slate-950/60 bg-amber-300 md:-right-[29px]"
                />
              ) : null}
              {currentStationIndex === index ? (
                <span className="absolute left-1/2 top-0 z-20 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border-2 border-slate-950 bg-[#FFB800] px-2.5 py-0.5 text-[0.65rem] font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {/* TODO(Ana): marcador de posicao atual */}
                  Você está aqui
                </span>
              ) : null}
              <TrailStationCard
                station={station}
                index={index}
                expanded={expandedStationId === station.step.id}
                onExpand={(stationId) => {
                  onExpand(stationId);
                  if (stationId !== null) {
                    // Garante a estacao expandida visivel apos abrir.
                    wrapperRefs.current[index]?.scrollIntoView({
                      behavior: reduce ? "auto" : "smooth",
                      inline: "nearest",
                      block: "nearest",
                    });
                  }
                }}
                onToggleItem={onToggleItem}
                readonly={readonly}
                catalogVersion={catalogVersion}
                buttonRef={(el) => {
                  buttonRefs.current[index] = el;
                }}
              />
            </motion.div>
          ))}
          {decorated ? (
            // Chegada da trilha: bandeira alinhada ao caminho, depois da
            // ultima estacao. Puramente decorativa.
            <div aria-hidden className="flex shrink-0 items-start pr-1 pt-4">
              <span className="mt-7 grid h-14 w-14 place-items-center rounded-full border-2 border-slate-950 bg-[#FFB800] shadow-[3px_3px_0_#0f172a]">
                <Flag className="h-6 w-6 text-slate-950" strokeWidth={2.5} />
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
