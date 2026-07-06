import { useEffect, useMemo, useRef } from "react";
import type { TrailHandle } from "@/components/roadmapV2/RoadmapTrail";
import { isComplete } from "@/lib/roadmapV2/progress";
import type { RoadmapSection } from "@/lib/roadmapV2/types";

// Orquestracao da sequencia de conclusao de secao da trilha v2, compartilhada
// entre as trilhas estaticas (RoadmapsV2) e os roadmaps gerados por IA
// (RoadmapIAView). Devolve o ref que DEVE ser passado ao <RoadmapTrail>: e por
// ele que o walk() acende o segmento e destrava a proxima estacao ao vivo.
//
// Beats of the section-complete sequence, with soft pauses between each step:
// a) station turns green (immediate, derived from `done`)
// b) hold on the green station, then the drawer closes itself
// c) after the drawer is fully gone, the confetti bursts
// d) after the confetti settles, the dots walk to the next station (slow, in the trail)
// e) the next station unlocks (gated on the walk inside the trail)
const GREEN_HOLD = 580;
const CLOSE_TO_BURST = 640;
const BURST_TO_WALK = 480;

type UseTrailCelebrationArgs = {
  sections: RoadmapSection[];
  done: Set<string>;
  ready: boolean;
  openSectionId: string | null;
  onCloseDrawer: () => void;
};

export function useTrailCelebration({
  sections,
  done,
  ready,
  openSectionId,
  onCloseDrawer,
}: UseTrailCelebrationArgs) {
  const trailRef = useRef<TrailHandle>(null);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const completed = useMemo(
    () => sections.map((section) => isComplete(section, done)),
    [sections, done],
  );

  // Seeded on the first settled (ready) render with the loaded completion, so a
  // reload never replays the confetti + line-walk for already-complete sections.
  // Starts null because the logged-in `done` arrives async: seeding eagerly with
  // the empty first render would make the celebration fire when the data lands.
  const prevCompleted = useRef<boolean[] | null>(null);

  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  const onCloseDrawerRef = useRef(onCloseDrawer);
  onCloseDrawerRef.current = onCloseDrawer;

  useEffect(() => {
    // Wait until the progress is settled (anon: immediate; logged-in: after the
    // server load). The first settled render seeds prevCompleted with the loaded
    // completion and animates nothing, so only new in-session changes celebrate.
    // Resetting to null on every unsettled cycle (initial load, in-place login,
    // logout) forces a fresh re-seed when ready returns, so a server delta (e.g.
    // progress from another device) does not replay through this parent effect,
    // which (unlike the trail) is not remounted by the ready gate.
    if (!ready) {
      prevCompleted.current = null;
      return;
    }
    const prev = prevCompleted.current;
    if (prev === null) {
      prevCompleted.current = completed;
      return;
    }
    sectionsRef.current.forEach((section, i) => {
      const wasComplete = prev[i] ?? false;
      const nowComplete = completed[i];
      if (nowComplete && !wasComplete) {
        const sequence = () => {
          // c) confetti, then d) the slow walk once it settles
          const burstTimer = setTimeout(
            () => trailRef.current?.burst(i),
            CLOSE_TO_BURST,
          );
          const walkTimer = setTimeout(
            () => trailRef.current?.walk(i),
            CLOSE_TO_BURST + BURST_TO_WALK,
          );
          timeouts.current.push(burstTimer, walkTimer);
        };
        if (openSectionId === section.id) {
          // b) hold on the green station, then close the drawer before celebrating
          const closeTimer = setTimeout(() => {
            onCloseDrawerRef.current();
            sequence();
          }, GREEN_HOLD);
          timeouts.current.push(closeTimer);
        } else {
          sequence();
        }
      } else if (!nowComplete && wasComplete) {
        trailRef.current?.unwalk(i);
      }
    });
    prevCompleted.current = completed;
  }, [completed, openSectionId, ready]);

  useEffect(() => {
    const pending = timeouts.current;
    return () => {
      pending.forEach((id) => clearTimeout(id));
    };
  }, []);

  return trailRef;
}
