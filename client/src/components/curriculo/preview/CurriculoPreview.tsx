import { useEffect, useRef, useState } from "react";
import type { Curriculo } from "@shared/curriculo/schema";

import CronologicoLayout from "./layouts/CronologicoLayout";
import HarvardLayout from "./layouts/HarvardLayout";
import HibridoLayout from "./layouts/HibridoLayout";

interface CurriculoPreviewProps {
  curriculo: Curriculo;
}

// Fallbacks pra primeira renderização, antes de medir o A4 de fato.
// 210mm × 297mm em 96dpi (padrão CSS). O valor real é medido por
// ResizeObserver assim que o DOM monta, então isso aqui é só pra evitar
// um flash sem dimensões.
const A4_WIDTH_PX_FALLBACK = 794;
const A4_HEIGHT_PX_FALLBACK = 1123;

/**
 * Renderiza o currículo como folha A4 sóbria (preto/cinza/branco, sem
 * brutalist). O layout interno muda conforme o campo "formato" do JSON.
 *
 * Responsividade via SCALE-DOWN:
 * - O A4 mantém width 210mm fixo (idêntico ao que será impresso).
 * - Um ResizeObserver mede a largura do palco (.curriculo-preview-stage),
 *   calcula um fator <= 1, e aplica `transform: scale(fator)` no A4 com
 *   `transform-origin: top left`.
 * - Um wrapper externo (.curriculo-scale-wrapper) ocupa o tamanho VISUAL
 *   do A4 escalado (width e height multiplicados pelo fator). Isso evita
 *   o gap em branco que surgiria, já que transform não afeta o fluxo.
 * - @media print zera o transform e o wrapper, garantindo PDF em A4 real.
 */
export default function CurriculoPreview({ curriculo }: CurriculoPreviewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [naturalWidth, setNaturalWidth] = useState(A4_WIDTH_PX_FALLBACK);
  const [naturalHeight, setNaturalHeight] = useState(A4_HEIGHT_PX_FALLBACK);
  const [scale, setScale] = useState(1);

  // Mede largura disponível no parent (palco cinza) e calcula scale.
  // Math.min(1, ...) impede AMPLIAR o A4 acima do tamanho real em telas
  // largas. Reobserva via ResizeObserver pra reagir a redimensionamentos
  // (girar celular, abrir/fechar devtools, etc) sem depender de breakpoints.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const parent = wrapper?.parentElement;
    if (!parent) return;
    function updateScale() {
      if (!parent) return;
      const stageWidth = parent.clientWidth;
      if (stageWidth <= 0) return;
      const factor = Math.min(1, stageWidth / naturalWidth);
      setScale(factor);
    }
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [naturalWidth]);

  // Mede o tamanho natural (não escalado) do A4. CSS transform: scale()
  // NÃO afeta offsetWidth/offsetHeight, então a medição é estável mesmo
  // quando o scale já foi aplicado.
  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    function updateNatural() {
      if (!inner) return;
      const w = inner.offsetWidth;
      const h = inner.offsetHeight;
      if (w > 0) setNaturalWidth(w);
      if (h > 0) setNaturalHeight(h);
    }
    updateNatural();
    const observer = new ResizeObserver(updateNatural);
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="curriculo-scale-wrapper"
      style={{
        width: naturalWidth * scale,
        height: naturalHeight * scale,
        position: "relative",
        margin: "0 auto",
      }}
    >
      <div
        ref={innerRef}
        className="curriculo-print-target bg-white text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "18mm",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <article className="font-body text-[11px] leading-relaxed text-slate-900">
          {curriculo.formato === "cronologico" ? (
            <CronologicoLayout curriculo={curriculo} />
          ) : curriculo.formato === "harvard" ? (
            <HarvardLayout curriculo={curriculo} />
          ) : (
            <HibridoLayout curriculo={curriculo} />
          )}
        </article>
      </div>
    </div>
  );
}
