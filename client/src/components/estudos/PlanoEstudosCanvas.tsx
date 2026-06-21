import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Cpu,
  FolderGit2,
  Layers,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import { Link } from "wouter";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";
import type {
  PlanoEstudos,
  PlanoItem,
  PlanoItemTipo,
} from "@shared/estudos/schema";

// ─────────────────────────────────────────────────────────────────────────────
// COPY pendente de sign-off da Ana. Centralizado de propósito: nada de texto de
// UX espalhado pelo JSX. Ajustar aqui.
// TODO(Ana): pendente de sign-off
// ─────────────────────────────────────────────────────────────────────────────
const COPY = {
  tituloPainel: "Seu plano de estudos",
  vazioTitulo: "Seu plano aparece aqui",
  vazioTexto:
    "Conforme você conversa com o Natechinho, o plano vai se montando deste lado: área, ritmo e o cronograma semana a semana.",
  carregandoTexto: "Montando seu plano...",
  atualizando: "Atualizando",
  chips: {
    area: "Área",
    nivel: "Nível",
    horasPorDia: "Horas por dia",
    diasPorSemana: "Dias por semana",
    prazoSemanas: "Prazo",
    objetivo: "Objetivo",
  },
  semanaLabel: (n: number) => `Semana ${n}`,
  focoLabel: "Foco",
  marcoLabel: "Marco",
  tipos: {
    curso: "Curso",
    tecnologia: "Tecnologia",
    plataforma: "Plataforma",
    projeto: "Projeto",
  } as Record<PlanoItemTipo, string>,
  prontoTitulo: "Plano pronto!",
  prontoTexto:
    "Seu cronograma está fechado. Pode seguir semana a semana e pedir ajustes ao Natechinho quando quiser.",
} as const;

const NIVEL_LABEL: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

const TIPO_ICON: Record<PlanoItemTipo, typeof BookOpen> = {
  curso: BookOpen,
  tecnologia: Cpu,
  plataforma: Layers,
  projeto: FolderGit2,
};

type CanvasView =
  | "vazio"
  | "carregando-inicial"
  | "coletando"
  | "montando"
  | "pronto";

/**
 * "Pronto" é DERIVADO DO CONTEÚDO, não do plano.status: precisa de área, nível
 * e objetivo preenchidos e as semanas cobrindo o prazo. Quando não há prazo
 * definido, o plano.status entra só como corroboração.
 */
function planoCompleto(p: PlanoEstudos): boolean {
  if (!p.area || !p.nivel || !p.objetivo) return false;
  if (p.semanas.length === 0) return false;
  const prazo = p.prazoSemanas ?? 0;
  if (prazo > 0) return p.semanas.length >= prazo;
  return p.status === "pronto";
}

export function deriveCanvasView(
  plano: PlanoEstudos | null,
  loading: boolean,
): CanvasView {
  if (plano == null) {
    return loading ? "carregando-inicial" : "vazio";
  }
  if (planoCompleto(plano)) return "pronto";
  if (plano.semanas.length > 0) return "montando";
  return "coletando";
}

interface ChipData {
  key: string;
  label: string;
  value: string;
}

function buildChips(plano: PlanoEstudos): ChipData[] {
  const chips: ChipData[] = [];
  if (plano.area)
    chips.push({ key: "area", label: COPY.chips.area, value: plano.area.titulo });
  if (plano.nivel)
    chips.push({
      key: "nivel",
      label: COPY.chips.nivel,
      value: NIVEL_LABEL[plano.nivel] ?? plano.nivel,
    });
  if (plano.horasPorDia != null)
    chips.push({
      key: "horasPorDia",
      label: COPY.chips.horasPorDia,
      value: `${plano.horasPorDia}h`,
    });
  if (plano.diasPorSemana != null)
    chips.push({
      key: "diasPorSemana",
      label: COPY.chips.diasPorSemana,
      value: `${plano.diasPorSemana}`,
    });
  if (plano.prazoSemanas != null)
    chips.push({
      key: "prazoSemanas",
      label: COPY.chips.prazoSemanas,
      value: `${plano.prazoSemanas} semanas`,
    });
  if (plano.objetivo)
    chips.push({
      key: "objetivo",
      label: COPY.chips.objetivo,
      value: plano.objetivo,
    });
  return chips;
}

interface PlanoEstudosCanvasProps {
  plano: PlanoEstudos | null;
  loading: boolean;
}

export default function PlanoEstudosCanvas({
  plano,
  loading,
}: PlanoEstudosCanvasProps) {
  const reduced = usePrefersReducedMotion();
  const view = useMemo(() => deriveCanvasView(plano, loading), [plano, loading]);

  const enter = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
        transition: { duration: 0.25 },
      };

  return (
    <div className="card-brutal flex h-full min-h-[420px] w-full flex-col overflow-hidden rounded-2xl bg-white">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-slate-900 bg-violet-100 px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex items-center gap-2">
          <Sparkles
            className="h-5 w-5 text-violet-700"
            strokeWidth={2.25}
            aria-hidden
          />
          <h2 className="font-display text-lg font-black tracking-tight text-slate-900 sm:text-xl">
            {COPY.tituloPainel}
          </h2>
        </div>
        {loading && plano != null ? (
          <span
            className="flex items-center gap-1.5 rounded-full border border-violet-300 bg-white px-2.5 py-1 text-xs font-bold text-violet-800"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            {COPY.atualizando}
          </span>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
        {view === "vazio" ? <EmptyState /> : null}
        {view === "carregando-inicial" ? <InitialLoading /> : null}
        {plano != null && view !== "carregando-inicial" ? (
          <PlanoContent plano={plano} view={view} enter={enter} reduced={reduced} />
        ) : null}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-900 bg-violet-100 shadow-[3px_3px_0_#0f172a]">
        <Target className="h-6 w-6 text-violet-700" strokeWidth={2.25} aria-hidden />
      </div>
      <h3 className="mt-4 font-display text-lg font-black text-slate-900">
        {COPY.vazioTitulo}
      </h3>
      <p className="mt-2 max-w-sm text-sm font-medium leading-relaxed text-slate-600">
        {COPY.vazioTexto}
      </p>
    </div>
  );
}

function InitialLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <p className="flex items-center gap-2 text-sm font-bold text-violet-800">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {COPY.carregandoTexto}
      </p>
      <div className="flex flex-wrap gap-2">
        {[40, 56, 32, 48].map((w, i) => (
          <div
            key={i}
            className="h-7 animate-pulse rounded-full bg-violet-100"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl border-2 border-slate-200 bg-slate-50"
          />
        ))}
      </div>
    </div>
  );
}

interface PlanoContentProps {
  plano: PlanoEstudos;
  view: CanvasView;
  enter: Record<string, unknown>;
  reduced: boolean;
}

function PlanoContent({ plano, view, enter, reduced }: PlanoContentProps) {
  const chips = buildChips(plano);

  return (
    <div className="space-y-5">
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {chips.map((chip) => (
              <motion.div
                key={chip.key}
                layout={!reduced}
                {...enter}
                className="rounded-full border-2 border-slate-900 bg-violet-50 px-3 py-1.5 shadow-[2px_2px_0_#0f172a]"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-700">
                  {chip.label}
                </span>
                <span className="ml-1.5 text-sm font-bold text-slate-900">
                  {chip.value}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : null}

      {view === "pronto" ? (
        <motion.div
          layout={!reduced}
          {...enter}
          className="rounded-xl border-2 border-emerald-700 bg-emerald-50 px-4 py-3"
        >
          <p className="font-display text-sm font-black uppercase tracking-[0.12em] text-emerald-800">
            {COPY.prontoTitulo}
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-emerald-900">
            {COPY.prontoTexto}
          </p>
        </motion.div>
      ) : null}

      {plano.semanas.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {plano.semanas.map((semana) => (
              <motion.article
                key={semana.numero}
                layout={!reduced}
                {...enter}
                className="rounded-xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0_#0f172a]"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-slate-900 bg-[#FFB800] px-2 font-display text-xs font-black text-slate-900">
                    {semana.numero}
                  </span>
                  <h3 className="font-display text-sm font-black uppercase tracking-[0.1em] text-slate-700">
                    {COPY.semanaLabel(semana.numero)}
                  </h3>
                </div>

                <p className="mt-2.5 text-sm font-bold text-slate-900">
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                    {COPY.focoLabel}:{" "}
                  </span>
                  {semana.foco}
                </p>
                {semana.marco ? (
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                      {COPY.marcoLabel}:{" "}
                    </span>
                    {semana.marco}
                  </p>
                ) : null}

                {semana.itens.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    <AnimatePresence initial={false}>
                      {semana.itens.map((item) => (
                        <motion.li key={item.id} layout={!reduced} {...enter}>
                          <PlanoItemRow item={item} />
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                ) : null}
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      ) : null}
    </div>
  );
}

/** URL externa canônica do item (cursos e plataformas têm), ou null. */
function itemExternalUrl(item: PlanoItem): string | null {
  return item.url && item.url.trim() ? item.url : null;
}

/**
 * Rota de detalhe interna. Hoje só tecnologia tem (/tecnologias/:slug). Sem
 * rota, fica sem link interno (não inventar rota).
 */
function itemInternalHref(item: PlanoItem): string | null {
  if (item.tipo === "tecnologia" && item.slug) {
    return `/tecnologias/${item.slug}`;
  }
  return null;
}

function PlanoItemRow({ item }: { item: PlanoItem }) {
  const Icon = TIPO_ICON[item.tipo];
  const externalUrl = itemExternalUrl(item);
  const internalHref = externalUrl ? null : itemInternalHref(item);

  const inner = (
    <span className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-slate-900 bg-violet-100">
        <Icon className="h-3.5 w-3.5 text-violet-700" strokeWidth={2.25} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-slate-900">
          {item.titulo}
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-700">
          {COPY.tipos[item.tipo]}
        </span>
      </span>
    </span>
  );

  const base =
    "block rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2";
  const hover = "transition-colors hover:border-slate-900 hover:bg-violet-50";

  if (externalUrl) {
    return (
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(base, hover)}
      >
        {inner}
      </a>
    );
  }
  if (internalHref) {
    return (
      <Link href={internalHref} className={cn(base, hover)}>
        {inner}
      </Link>
    );
  }
  return <div className={base}>{inner}</div>;
}
