import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Flag, Footprints } from "lucide-react";
import type { RoadmapSection } from "@/lib/roadmapV2/types";
import {
  isComplete,
  isSectionUnlocked,
  nodeProgress,
} from "@/lib/roadmapV2/progress";
import { fireProCelebration } from "@/lib/proConfetti";
import TrailStation from "./TrailStation";

// Full-bleed: a faixa da trilha rompe o max-width da pagina e ocupa a largura
// do viewport (medida, nunca 100vw, pra scrollbar nao criar overflow), com
// GUTTER por lado e a largura util clampada em MAX_TRAIL_W centralizada.
const GUTTER = 20;
const MAX_TRAIL_W = 1280;
const TOP_PAD = 80;
const BOTTOM_PAD = 110;
const DOTS = 6;
// Espacamento vertical entre centros de estacao (estacao 64px + rotulo ~46px
// + respiro). Mobile mais curto, desktop mais largo; nunca comprime com mais
// secoes: a altura total cresce linearmente.
const STEP_Y_DESKTOP = 170;
const STEP_Y_MOBILE = 140;

const THEMES = [
  { path: "#7c3aed", dotLit: "#a855f7", dotDim: "#ddd6fe", halo: "#ede9fe" },
  { path: "#0891b2", dotLit: "#06b6d4", dotDim: "#a5f3fc", halo: "#cffafe" },
  { path: "#ea580c", dotLit: "#f97316", dotDim: "#fed7aa", halo: "#ffedd5" },
  { path: "#db2777", dotLit: "#ec4899", dotDim: "#fbcfe8", halo: "#fce7f3" },
  { path: "#16a34a", dotLit: "#22c55e", dotDim: "#bbf7d0", halo: "#dcfce7" },
  { path: "#2563eb", dotLit: "#3b82f6", dotDim: "#bfdbfe", halo: "#dbeafe" },
];

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Dot-walk animation timing (kept in sync with the motion variants below).
const WALK_DELAY = 0.05;
const WALK_STAGGER = 0.26;
const DOT_DURATION = 0.55;
// When the last dot finishes arriving at the next station, in ms.
const WALK_MS = Math.round(
  (WALK_DELAY + WALK_STAGGER * (DOTS - 1) + DOT_DURATION) * 1000,
);

type Point = { x: number; y: number };

function bezier(a: Point, cp1: Point, cp2: Point, b: Point, t: number): Point {
  const u = 1 - t;
  return {
    x:
      u * u * u * a.x +
      3 * u * u * t * cp1.x +
      3 * u * t * t * cp2.x +
      t * t * t * b.x,
    y:
      u * u * u * a.y +
      3 * u * u * t * cp1.y +
      3 * u * t * t * cp2.y +
      t * t * t * b.y,
  };
}

// Serpentina desenhada: as estacoes alternam entre uma banda esquerda
// (15% a 40% da largura util) e uma direita (60% a 85%), com o hash da trilha
// virando apenas jitter deterministico DENTRO da banda (posicao na banda +
// ate 8px de variacao vertical), nunca fora dela. O guard de rotulo impede a
// caixa de titulo (whitespace-nowrap, centrada na estacao) de vazar o viewport
// nas extremidades. Mesma trilha + mesma largura = mesmo layout, sempre.
function buildLayout(count: number, seedKey: string, trailW: number) {
  const rand = mulberry32(hashSeed(seedKey));
  const themeIndex = Math.floor(rand() * THEMES.length);
  const startRight = rand() > 0.5;
  const stepY = trailW < 600 ? STEP_Y_MOBILE : STEP_Y_DESKTOP;
  const labelGuard = Math.min(130, trailW * 0.36);
  const VBH = TOP_PAD + stepY * Math.max(count - 1, 0) + BOTTOM_PAD;
  const pts: Point[] = [];
  for (let i = 0; i < count; i++) {
    const isRight = startRight ? i % 2 === 0 : i % 2 === 1;
    const inBand = rand();
    const frac = isRight ? 0.6 + inBand * 0.25 : 0.15 + inBand * 0.25;
    const x = Math.max(
      labelGuard,
      Math.min(trailW - labelGuard, frac * trailW),
    );
    const yJitter = (rand() * 2 - 1) * 8;
    pts.push({ x, y: TOP_PAD + i * stepY + yJitter });
  }
  const bowBase = Math.min(64, trailW * 0.07);
  const segments: Point[][] = [];
  const paths: string[] = [];
  for (let i = 0; i < count - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || pts[i + 1];
    const cp1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const cp2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    const dir = i % 2 === 0 ? 1 : -1;
    const bow = bowBase * (1 + 0.4 * Math.sin(i * 1.7));
    cp1.x += dir * bow;
    cp1.y += dir * 14 * Math.cos(i * 0.9);
    cp2.x -= dir * bow * 0.78;
    cp2.y += dir * 16 * Math.sin(i * 1.1);
    const dots: Point[] = [];
    for (let k = 0; k < DOTS; k++) {
      const t = 0.16 + 0.68 * (k / (DOTS - 1));
      dots.push(bezier(p1, cp1, cp2, p2, t));
    }
    segments.push(dots);
    paths.push(
      `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} C ${cp1.x.toFixed(1)} ${cp1.y.toFixed(1)} ${cp2.x.toFixed(1)} ${cp2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
    );
  }
  return { VBH, pts, segments, paths, theme: THEMES[themeIndex] };
}

export type TrailHandle = {
  burst: (index: number) => void;
  walk: (index: number) => void;
  unwalk: (index: number) => void;
};

type RoadmapTrailProps = {
  sections: RoadmapSection[];
  done: Set<string>;
  onOpenSection: (id: string) => void;
};

// Segments already earned by restored progress: every section i (except the
// last, which has no outgoing segment) that is already complete. walk(i) lights
// segment i then marks it arrived, so seeding lit + arrived with these indices
// makes a reload render the conquered line gold and keep the unlocked stations
// open WITHOUT replaying the walk. New in-session completions still call walk().
function seedReached(
  sections: RoadmapSection[],
  done: Set<string>,
): Set<number> {
  const reached = new Set<number>();
  for (let i = 0; i < sections.length - 1; i++) {
    if (isComplete(sections[i], done)) reached.add(i);
  }
  return reached;
}

function ChestMark() {
  return (
    <svg
      width="34"
      height="30"
      viewBox="0 0 34 30"
      fill="none"
      aria-hidden
      className="opacity-40"
    >
      <path
        d="M3 14 Q17 4 31 14"
        fill="#d8b66e"
        stroke="#7a5a2e"
        strokeWidth="2"
      />
      <rect
        x="3"
        y="12"
        width="28"
        height="15"
        rx="2"
        fill="#caa15a"
        stroke="#7a5a2e"
        strokeWidth="2"
      />
      <rect x="14" y="14" width="6" height="9" rx="1" fill="#7a5a2e" />
      <circle cx="17" cy="18" r="1.6" fill="#FFB800" />
    </svg>
  );
}

const RoadmapTrail = forwardRef<TrailHandle, RoadmapTrailProps>(
  function RoadmapTrail({ sections, done, onOpenSection }, ref) {
    const wrapRef = useRef<HTMLDivElement>(null);
    // Largura do viewport SEM a scrollbar (clientWidth) e o offset esquerdo do
    // wrapper em fluxo: e com esses dois que o full-bleed e calculado, sem
    // 100vw, garantindo zero scroll horizontal em qualquer viewport.
    const [metrics, setMetrics] = useState(() => ({
      viewportW:
        typeof window !== "undefined"
          ? document.documentElement.clientWidth
          : 1280,
      wrapLeft: 0,
    }));
    const seedKey = useMemo(
      () => sections.map((s) => s.id).join("|"),
      [sections],
    );
    const trailW = Math.max(
      280,
      Math.min(metrics.viewportW - GUTTER * 2, MAX_TRAIL_W),
    );
    const layout = useMemo(
      () => buildLayout(sections.length, seedKey, trailW),
      [sections.length, seedKey, trailW],
    );
    const [lit, setLit] = useState<Set<number>>(() =>
      seedReached(sections, done),
    );
    // Segments whose dot-walk has finished arriving. Gates the next station's
    // unlock + pulse, so "you are here" only lights up once the dots reach it.
    // Seeded from restored progress so already-earned unlocks are open at mount.
    const [arrived, setArrived] = useState<Set<number>>(() =>
      seedReached(sections, done),
    );
    const burstedRef = useRef<Set<number>>(new Set());
    const stationRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const arrivalTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(
      new Map(),
    );
    const celebrationStops = useRef<Array<() => void>>([]);
    const reduce = useReducedMotion();

    const burst = useCallback(
      (index: number) => {
        if (burstedRef.current.has(index)) return;
        burstedRef.current.add(index);
        if (reduce) return;
        const btn = stationRefs.current[index];
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const stop = fireProCelebration({
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        });
        celebrationStops.current.push(stop);
      },
      [reduce],
    );

    const walk = useCallback(
      (index: number) => {
        if (index >= sections.length - 1) return;
        setLit((prev) => {
          if (prev.has(index)) return prev;
          const next = new Set(prev);
          next.add(index);
          return next;
        });
        const existing = arrivalTimers.current.get(index);
        if (existing) clearTimeout(existing);
        const timer = setTimeout(() => {
          arrivalTimers.current.delete(index);
          setArrived((prev) => {
            if (prev.has(index)) return prev;
            const next = new Set(prev);
            next.add(index);
            return next;
          });
        }, WALK_MS);
        arrivalTimers.current.set(index, timer);
      },
      [sections.length],
    );

    const unwalk = useCallback((index: number) => {
      burstedRef.current.delete(index);
      const pending = arrivalTimers.current.get(index);
      if (pending) {
        clearTimeout(pending);
        arrivalTimers.current.delete(index);
      }
      setLit((prev) => {
        if (!prev.has(index)) return prev;
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
      setArrived((prev) => {
        if (!prev.has(index)) return prev;
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }, []);

    useImperativeHandle(ref, () => ({ burst, walk, unwalk }), [
      burst,
      walk,
      unwalk,
    ]);

    useEffect(() => {
      const timers = arrivalTimers.current;
      const stops = celebrationStops.current;
      return () => {
        timers.forEach((timer) => clearTimeout(timer));
        timers.clear();
        stops.forEach((stop) => stop());
        stops.length = 0;
      };
    }, []);

    useEffect(() => {
      const el = wrapRef.current;
      if (!el) return;
      const measure = () => {
        const viewportW = document.documentElement.clientWidth;
        const wrapLeft = el.getBoundingClientRect().left;
        setMetrics((prev) =>
          prev.viewportW === viewportW && prev.wrapLeft === wrapLeft
            ? prev
            : { viewportW, wrapLeft },
        );
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      window.addEventListener("resize", measure);
      return () => {
        ro.disconnect();
        window.removeEventListener("resize", measure);
      };
    }, []);

    const firstPt = layout.pts[0];
    const lastPt = layout.pts[layout.pts.length - 1];
    const trailDecor = layout.pts
      .slice(0, -1)
      .map((p, i) => ({
        i,
        mx: (p.x + layout.pts[i + 1].x) / 2,
        my: (p.y + layout.pts[i + 1].y) / 2,
      }))
      .filter((d) => d.i % 2 === 1);

    return (
      <div
        ref={wrapRef}
        className="relative mt-7 w-full"
        style={{ height: layout.VBH }}
      >
        {/* Camada full-bleed: comeca na borda esquerda do viewport (offset
            medido, nao 100vw) e cobre clientWidth; a faixa util centralizada
            dentro dela. Estacoes e SVG em px 1:1, sem esticar. */}
        <div
          className="absolute top-0"
          style={{
            left: -metrics.wrapLeft,
            width: metrics.viewportW,
            height: layout.VBH,
          }}
        >
          <div
            className="relative mx-auto"
            style={{ width: trailW, height: layout.VBH }}
          >
            <svg
              viewBox={`0 0 ${trailW} ${layout.VBH}`}
              className="absolute inset-0 block h-full w-full overflow-visible"
            >
              {layout.paths.map((d, si) => (
                <path
                  key={`route-${si}`}
                  d={d}
                  fill="none"
                  stroke={layout.theme.path}
                  strokeWidth={2.5}
                  strokeDasharray="2 10"
                  strokeLinecap="round"
                  opacity={0.45}
                  className="pointer-events-none"
                />
              ))}
              <g className="pointer-events-none" opacity={0.32}>
                <circle
                  cx={54}
                  cy={58}
                  r={20}
                  fill="none"
                  stroke="#9c7b4f"
                  strokeWidth={2}
                />
                <path d="M54 42 L60 58 L54 74 L48 58 Z" fill="#9c7b4f" />
                <path d="M54 42 L57 58 L54 58 Z" fill="#b04a2f" />
              </g>
              {lastPt && (
                <g
                  className="pointer-events-none"
                  opacity={0.5}
                  stroke="#b04a2f"
                  strokeWidth={4}
                  strokeLinecap="round"
                >
                  <line
                    x1={lastPt.x - 13}
                    y1={lastPt.y - 58}
                    x2={lastPt.x + 13}
                    y2={lastPt.y - 32}
                  />
                  <line
                    x1={lastPt.x + 13}
                    y1={lastPt.y - 58}
                    x2={lastPt.x - 13}
                    y2={lastPt.y - 32}
                  />
                </g>
              )}
              {layout.segments.map((dots, si) => (
                <motion.g
                  key={si}
                  initial={false}
                  animate={lit.has(si) ? "lit" : "unlit"}
                  variants={{
                    lit: {
                      transition: {
                        staggerChildren: 0.26,
                        delayChildren: 0.05,
                      },
                    },
                    unlit: {
                      transition: {
                        staggerChildren: 0.04,
                        staggerDirection: -1,
                      },
                    },
                  }}
                >
                  {dots.map((dot, k) => (
                    <motion.circle
                      key={k}
                      cx={dot.x.toFixed(1)}
                      cy={dot.y.toFixed(1)}
                      r={(5.5 + ((si * 2 + k) % 3) * 0.6).toFixed(1)}
                      variants={{
                        lit: {
                          fill: layout.theme.dotLit,
                          scale: [1, 2.1, 1],
                          transition: { duration: 0.55, ease: "easeInOut" },
                        },
                        unlit: {
                          fill: layout.theme.dotDim,
                          scale: 1,
                          transition: { duration: 0.25 },
                        },
                      }}
                      style={{
                        transformBox: "fill-box",
                        transformOrigin: "center",
                      }}
                    />
                  ))}
                </motion.g>
              ))}
            </svg>

            <div className="absolute inset-0">
              {firstPt && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute"
                  style={{
                    left: firstPt.x,
                    top: firstPt.y,
                    transform: "translate(-135%, -75%)",
                  }}
                >
                  <Flag
                    className="h-6 w-6 text-amber-800 opacity-40"
                    strokeWidth={2.5}
                  />
                </div>
              )}
              {lastPt && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute"
                  style={{
                    left: lastPt.x,
                    top: lastPt.y,
                    transform: "translate(-50%, 42%)",
                  }}
                >
                  <ChestMark />
                </div>
              )}
              {trailDecor.map((d) => (
                <div
                  key={`decor-${d.i}`}
                  aria-hidden
                  className="pointer-events-none absolute"
                  style={{
                    left: d.mx,
                    top: d.my,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <motion.div
                    animate={reduce ? undefined : { y: [0, -6, 0] }}
                    transition={
                      reduce
                        ? undefined
                        : {
                            duration: 4 + (d.i % 3),
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: (d.i % 3) * 0.4,
                          }
                    }
                  >
                    {d.i % 3 === 0 ? (
                      <Footprints
                        className="h-5 w-5 text-amber-800 opacity-30"
                        strokeWidth={2.5}
                      />
                    ) : d.i % 3 === 1 ? (
                      <svg
                        width="30"
                        height="26"
                        viewBox="0 0 30 26"
                        fill="none"
                        className="opacity-35"
                      >
                        <rect
                          x="4"
                          y="3"
                          width="22"
                          height="20"
                          rx="3"
                          fill="#e8d8b0"
                          stroke="#7a5a2e"
                          strokeWidth="2"
                        />
                        <path
                          d="M8 9 H22 M8 13 H20 M8 17 H15"
                          stroke="#9c7b4f"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeDasharray="1 3"
                        />
                        <path
                          d="M17 14 l4 4 M21 14 l-4 4"
                          stroke="#b04a2f"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="22"
                        height="30"
                        viewBox="0 0 22 30"
                        fill="none"
                        className="opacity-35"
                      >
                        <line
                          x1="5"
                          y1="2"
                          x2="5"
                          y2="28"
                          stroke="#7a5a2e"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M5 4 L20 8 L5 13 Z"
                          fill="#d97706"
                          stroke="#7a5a2e"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </motion.div>
                </div>
              ))}
              {sections.map((section, i) => {
                const pt = layout.pts[i];
                // Unlock + pulse only after the dot-walk finishes arriving at this
                // station (arrived segment i-1), so it is the last beat of the sequence.
                const prevHasNoRequired =
                  i > 0 && nodeProgress(sections[i - 1], done).total === 0;
                const unlocked =
                  isSectionUnlocked(i, sections, done) &&
                  (i === 0 || arrived.has(i - 1) || prevHasNoRequired);
                const complete = isComplete(section, done);
                const progress = nodeProgress(section, done);
                const pct =
                  progress.total > 0
                    ? (progress.done / progress.total) * 100
                    : 0;
                return (
                  <div
                    key={section.id}
                    className="absolute"
                    style={{
                      left: pt.x,
                      top: pt.y,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <motion.div
                      className="relative"
                      initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.32,
                        delay: Math.min(i * 0.05, 0.6),
                        ease: "easeOut",
                      }}
                    >
                      <span
                        aria-hidden
                        className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl"
                        style={{ background: layout.theme.halo, opacity: 0.55 }}
                      />
                      <TrailStation
                        ref={(el) => {
                          stationRefs.current[i] = el;
                        }}
                        number={i + 1}
                        title={section.title}
                        level={section.level}
                        locked={!unlocked}
                        complete={complete}
                        current={unlocked && !complete}
                        progressPct={pct}
                        onOpen={() => onOpenSection(section.id)}
                      />
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default RoadmapTrail;
