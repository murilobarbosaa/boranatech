import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from "react";

// Interacao compartilhada das trilhas horizontais (CareerTrail e
// GeneralShelf): wheel vertical rola a trilha para o lado e arrastar com a
// maozinha (mouse ou pen) move o scroll. Touch fica de fora: o gesto nativo
// ja resolve. Drag e wheel sao manipulacao direta do usuario, permitidos com
// reduced motion; nenhuma animacao decorativa vive aqui.

// Abaixo do limiar o gesto e clique normal (estacoes, checkboxes, trofeus).
const DRAG_THRESHOLD_PX = 6;
// deltaMode 1 (linhas, Firefox): conversao usual de linha para pixels.
const LINE_HEIGHT_PX = 40;

interface DragState {
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  active: boolean;
}

interface TrailScrollHandlers {
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
  onClickCapture: (event: MouseEvent<HTMLDivElement>) => void;
}

export function useTrailScroll(scrollRef: RefObject<HTMLDivElement | null>): {
  dragging: boolean;
  handlers: TrailScrollHandlers;
} {
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  // Listener nao-passivo: preventDefault SO quando a trilha ainda pode rolar
  // naquela direcao; no limite o wheel segue para a pagina, nunca aprisiona o
  // usuario. Trackpad com deltaX dominante nao sofre interferencia.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onWheel(event: WheelEvent) {
      if (!el) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const scale =
        event.deltaMode === 1
          ? LINE_HEIGHT_PX
          : event.deltaMode === 2
            ? el.clientWidth
            : 1;
      const delta = event.deltaY * scale;
      if (delta === 0) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const canScroll = delta > 0 ? el.scrollLeft < max - 1 : el.scrollLeft > 1;
      if (!canScroll) return;
      event.preventDefault();
      el.scrollLeft += delta;
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scrollRef]);

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const state = dragRef.current;
    if (!state || event.pointerId !== state.pointerId) return;
    dragRef.current = null;
    if (!state.active) return;
    setDragging(false);
    // Suprime o click que o browser dispara ao soltar um arrasto real sobre
    // um botao; a janela fecha num tick para nao engolir o clique seguinte.
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }

  const handlers: TrailScrollHandlers = {
    onPointerDown(event) {
      if (event.pointerType === "touch") return;
      if (event.button !== 0) return;
      const el = scrollRef.current;
      if (!el) return;
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScrollLeft: el.scrollLeft,
        active: false,
      };
    },
    onPointerMove(event) {
      const state = dragRef.current;
      const el = scrollRef.current;
      if (!state || !el || event.pointerId !== state.pointerId) return;
      const dx = event.clientX - state.startX;
      if (!state.active) {
        if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
        state.active = true;
        setDragging(true);
        el.setPointerCapture(event.pointerId);
      }
      el.scrollLeft = state.startScrollLeft - dx;
    },
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onClickCapture(event) {
      if (!suppressClickRef.current) return;
      suppressClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };

  return { dragging, handlers };
}
