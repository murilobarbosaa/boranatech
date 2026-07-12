import {
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from "react";

// Interacao compartilhada das trilhas horizontais (CareerTrail e
// GeneralShelf): arrastar com a maozinha (mouse ou pen) move o scroll. Touch
// fica de fora: o gesto nativo ja resolve. O wheel vertical rolando a trilha
// foi REMOVIDO por decisao de produto: ficam o drag, o swipe touch, o
// trackpad horizontal (deltaX nativo, sem nenhuma interferencia daqui) e as
// setas do teclado. Drag e manipulacao direta do usuario, permitido com
// reduced motion; nenhuma animacao decorativa vive aqui.

// Abaixo do limiar o gesto e clique normal (estacoes, checkboxes, trofeus).
const DRAG_THRESHOLD_PX = 6;

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
