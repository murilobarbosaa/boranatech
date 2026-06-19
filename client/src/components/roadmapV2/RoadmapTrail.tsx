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
import type { RoadmapSection } from "@/lib/roadmapV2/types";
import {
  isComplete,
  isSectionUnlocked,
  nodeProgress,
} from "@/lib/roadmapV2/progress";
import { fireProCelebration } from "@/lib/proConfetti";
import TrailStation from "./TrailStation";

const VBW = 780;
const TOP_PAD = 80;
const BOTTOM_PAD = 110;
const ROW_GAP = 215;
const PER_ROW = 3;
const COL_X = [150, 390, 630];
const DOTS = 6;

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

function buildLayout(count: number) {
  const rows = Math.ceil(count / PER_ROW);
  const VBH = TOP_PAD + ROW_GAP * (rows - 1) + BOTTOM_PAD;
  const pts: Point[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / PER_ROW);
    const pir = i % PER_ROW;
    const col = row % 2 === 0 ? pir : PER_ROW - 1 - pir;
    pts.push({ x: COL_X[col], y: TOP_PAD + row * ROW_GAP });
  }
  const segments: Point[][] = [];
  for (let i = 0; i < count - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || pts[i + 1];
    const cp1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const cp2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    const dots: Point[] = [];
    for (let k = 0; k < DOTS; k++) {
      const t = 0.16 + 0.68 * (k / (DOTS - 1));
      dots.push(bezier(p1, cp1, cp2, p2, t));
    }
    segments.push(dots);
  }
  return { VBH, pts, segments };
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

const RoadmapTrail = forwardRef<TrailHandle, RoadmapTrailProps>(
  function RoadmapTrail({ sections, done, onOpenSection }, ref) {
    const layout = useMemo(
      () => buildLayout(sections.length),
      [sections.length],
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

    return (
      <div className="relative mt-7 w-full">
        <svg
          viewBox={`0 0 ${VBW} ${layout.VBH}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-auto w-full overflow-visible"
        >
          {layout.segments.map((dots, si) => (
            <motion.g
              key={si}
              initial={false}
              animate={lit.has(si) ? "lit" : "unlit"}
              variants={{
                lit: {
                  transition: { staggerChildren: 0.26, delayChildren: 0.05 },
                },
                unlit: {
                  transition: { staggerChildren: 0.04, staggerDirection: -1 },
                },
              }}
            >
              {dots.map((dot, k) => (
                <motion.circle
                  key={k}
                  cx={dot.x.toFixed(1)}
                  cy={dot.y.toFixed(1)}
                  r={6}
                  variants={{
                    lit: {
                      fill: "#FFB800",
                      scale: [1, 2.1, 1],
                      transition: { duration: 0.55, ease: "easeInOut" },
                    },
                    unlit: {
                      fill: "#d0d7e2",
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
              progress.total > 0 ? (progress.done / progress.total) * 100 : 0;
            return (
              <div
                key={section.id}
                className="absolute"
                style={{
                  left: `${(pt.x / VBW) * 100}%`,
                  top: `${(pt.y / layout.VBH) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
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
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

export default RoadmapTrail;
