import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { nodeProgress } from "@/lib/roadmapV2/progress";
import {
  buildCompletionCtas,
  type CompletionCta,
} from "@/lib/roadmapV2/completionCtas";
import {
  listCompletions,
  registerCompletion,
  type RoadmapCompletion,
} from "@/services/roadmapCompletionService";
import { SECTION_CELEBRATION_TOTAL_MS } from "@/hooks/useTrailCelebration";
import type { RoadmapV2 } from "@/lib/roadmapV2/types";

// Folga depois da coreografia de secao (confete do burst ainda assentando)
// antes do modal de conclusao abrir por cima.
const MODAL_OPEN_SLACK_MS = 600;
export const COMPLETION_MODAL_DELAY_MS =
  SECTION_CELEBRATION_TOTAL_MS + MODAL_OPEN_SLACK_MS;

type UseRoadmapCompletionArgs = {
  // null enquanto o conteudo da trilha carrega (import() por slug). Todos os
  // efeitos toleram o null: allComplete fica false e o seed anti-replay so
  // assenta quando conteudo E progresso estiverem prontos.
  roadmap: RoadmapV2 | null;
  done: Set<string>;
  ready: boolean;
};

export function useRoadmapCompletion({
  roadmap,
  done,
  ready,
}: UseRoadmapCompletionArgs) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const slug = roadmap?.slug ?? null;
  // Assentado de verdade: progresso carregado E conteudo resolvido. O caller
  // ja combina os dois no `ready`, mas o hook re-garante por conta propria.
  const settled = ready && roadmap !== null;

  const [completion, setCompletion] = useState<RoadmapCompletion | null>(null);
  const [listLoaded, setListLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const allComplete = useMemo(() => {
    if (!settled || !roadmap) return false;
    let total = 0;
    for (const section of roadmap.sections) {
      const progress = nodeProgress(section, done);
      total += progress.total;
      if (progress.done < progress.total) return false;
    }
    return total > 0;
  }, [roadmap, done, settled]);

  // Mesma mecanica anti-replay do useTrailCelebration: null ate assentar
  // (progresso E conteudo); o primeiro render assentado semeia com o estado
  // carregado e nao dispara nada. So a transicao false -> true NESTA sessao
  // abre o modal. Reload em trilha ja concluida semeia allComplete=true e
  // nunca dispara.
  const prevAllComplete = useRef<boolean | null>(null);
  // Marca que houve transicao ao vivo nesta sessao, pra reconciliacao
  // silenciosa nao disparar um segundo POST.
  const liveTransition = useRef(false);
  const reconciled = useRef(false);
  const modalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Troca de trilha sem remontar o componente: estado por-trilha zera.
  useEffect(() => {
    liveTransition.current = false;
    reconciled.current = false;
    prevAllComplete.current = null;
    setShowModal(false);
  }, [slug]);

  useEffect(() => {
    if (!settled || !slug) {
      prevAllComplete.current = null;
      return;
    }
    if (prevAllComplete.current === null) {
      prevAllComplete.current = allComplete;
      return;
    }
    if (allComplete && !prevAllComplete.current) {
      liveTransition.current = true;
      // O modal espera a coreografia da ultima secao (useTrailCelebration)
      // terminar; o POST nao bloqueia nem condiciona a celebracao.
      modalTimer.current = setTimeout(() => {
        setShowModal(true);
      }, COMPLETION_MODAL_DELAY_MS);
      if (userId) {
        void registerCompletion(userId, slug).then((record) => {
          if (record) setCompletion(record);
        });
      }
    }
    prevAllComplete.current = allComplete;
  }, [allComplete, settled, userId, slug]);

  useEffect(() => {
    return () => {
      if (modalTimer.current) clearTimeout(modalTimer.current);
    };
  }, []);

  // Carga unica (cacheada em memoria) das conclusoes do usuario logado.
  useEffect(() => {
    if (!userId || !slug) {
      setCompletion(null);
      setListLoaded(false);
      return;
    }
    let cancelled = false;
    void listCompletions(userId).then((list) => {
      if (cancelled || list === null) return;
      setCompletion(list.find((c) => c.roadmapSlug === slug) ?? null);
      setListLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, slug]);

  // Reconciliacao silenciosa: usuario concluiu como anonimo (ou o POST da
  // transicao falhou) e agora esta logado com tudo completo, mas sem registro
  // no server. Registra sem mostrar modal.
  useEffect(() => {
    if (
      !userId ||
      !slug ||
      !settled ||
      !allComplete ||
      !listLoaded ||
      completion !== null ||
      liveTransition.current ||
      reconciled.current
    ) {
      return;
    }
    reconciled.current = true;
    void registerCompletion(userId, slug).then((record) => {
      if (record) setCompletion(record);
    });
  }, [userId, settled, allComplete, listLoaded, completion, slug]);

  const ctas: CompletionCta[] = useMemo(
    () => (roadmap ? buildCompletionCtas(roadmap) : []),
    [roadmap],
  );

  return {
    completion,
    allComplete,
    showModal,
    dismissModal: () => setShowModal(false),
    ctas,
  };
}
